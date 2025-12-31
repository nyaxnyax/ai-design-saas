import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPendingTasks, updateTaskStatus } from '@/lib/task-queue';
import type { GenerationSettings, Resolution, SceneType, ArtStyle } from '@/types/generation';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify Cron Secret
export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get pending tasks
        const tasks = await getPendingTasks(5);

        if (tasks.length === 0) {
            return NextResponse.json({ message: 'No pending tasks', processed: 0 });
        }

        console.log(`[Cron] Processing ${tasks.length} pending tasks...`);

        let processed = 0;

        for (const task of tasks) {
            try {
                await processTask(task);
                processed++;
            } catch (error: any) {
                console.error(`[Cron] Failed to process task ${task.id}:`, error);
                await updateTaskStatus(task.id, 'failed', undefined, error.message);
            }
        }

        return NextResponse.json({
            message: `Processed ${processed} tasks`,
            processed
        });

    } catch (error: any) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function uploadToStorage(supabase: any, base64Data: string, mimeType: string, userId: string): Promise<{ url: string | null; error: string | null }> {
    const maxRetries = 2;
    const uploadTimeout = 60000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const buffer = Buffer.from(base64Data, 'base64');
            const ext = mimeType.split('/')[1] || 'png';
            const filename = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Upload timeout')), uploadTimeout)
            );

            const uploadPromise = supabase.storage
                .from('user-uploads')
                .upload(filename, buffer, {
                    contentType: mimeType,
                    upsert: false
                });

            const { error: uploadError } = await Promise.race([
                uploadPromise,
                timeoutPromise.then(() => ({ error: { message: 'Upload timeout', name: 'TimeoutError' } }))
            ]) as any;

            if (uploadError) {
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                return { url: null, error: uploadError.message };
            }

            const { data: { publicUrl } } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(filename);

            return { url: publicUrl, error: null };

        } catch (e: any) {
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            return { url: null, error: e.message };
        }
    }

    return { url: null, error: 'Max retries exceeded' };
}

function parseApiError(errorMessage: string): string {
    if (errorMessage.includes('token quota is not enough') ||
        errorMessage.includes('pre_consume_token_quota_failed')) {
        return 'Token 配额不足，请充值后重试';
    }
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return '网络连接失败，请检查网络后重试';
    }
    if (errorMessage.includes('aborted') || errorMessage.includes('timeout')) {
        return '请求超时，请稍后重试';
    }
    return '未知错误';
}

async function processTask(task: any) {
    const { id, user_id, prompt, image_url, type, settings } = task;

    // Update status to processing
    await updateTaskStatus(id, 'processing');

    const finalSettings: GenerationSettings = {
        resolution: settings?.resolution || '1K',
        aspectRatio: settings?.aspectRatio || '16:9',
        sceneType: settings?.sceneType,
        artStyle: settings?.artStyle,
    };

    // Build prompt
    let userPrompt = buildEnhancedPrompt(prompt, type, finalSettings, type === 'text-to-image');

    // API Call
    const apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('System Error: Missing AI Config');
    }

    const modelName = process.env.AI_MODEL || "gemini-3-pro-image-preview";
    const endpoint = process.env.AI_BASE_URL
        ? `${process.env.AI_BASE_URL}/models/${modelName}:generateContent`
        : `https://xingjiabiapi.org/v1beta/models/${modelName}:generateContent`;

    let imageBase64 = "";
    let imageMimeType = "image/png";
    const isTextToImage = type === 'text-to-image';

    if (!isTextToImage && image_url) {
        const imageResponse = await fetch(image_url);
        if (!imageResponse.ok) throw new Error(`Failed to download image: ${imageResponse.status}`);
        const imageBuffer = await imageResponse.arrayBuffer();
        imageBase64 = Buffer.from(imageBuffer).toString('base64');

        const urlLower = image_url.toLowerCase();
        if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) imageMimeType = "image/jpeg";
        else if (urlLower.includes('.webp')) imageMimeType = "image/webp";
        else if (urlLower.includes('.gif')) imageMimeType = "image/gif";
    }

    const parts: any[] = [{ text: userPrompt }];
    if (imageBase64) {
        parts.push({
            inline_data: {
                mime_type: imageMimeType,
                data: imageBase64
            }
        });
    }

    const payload = {
        contents: [{
            role: 'user',
            parts: parts
        }],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
                aspectRatio: finalSettings.aspectRatio,
                imageSize: finalSettings.resolution
            }
        }
    };

    const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        const friendlyError = parseApiError(errorText);
        throw new Error(friendlyError);
    }

    const data = await response.json();

    // Extract image
    const candidate = data.candidates?.[0];
    let outputUrl = null;

    if (candidate) {
        const contentParts = candidate.content?.parts || [];
        const inlinePart = contentParts.find((p: any) => p.inline_data || p.inlineData);
        if (inlinePart) {
            const inline = inlinePart.inline_data || inlinePart.inlineData;
            if (inline?.data) {
                const mime = inline.mime_type || inline.mimeType || 'image/png';
                outputUrl = `data:${mime};base64,${inline.data}`;
            }
        }
    }

    if (!outputUrl && data.imageBase64) {
        const mime = data.mimeType || 'image/png';
        outputUrl = `data:${mime};base64,${data.imageBase64}`;
    }

    if (!outputUrl) {
        throw new Error("Model returned text but no image. Please try again.");
    }

    // Upload to storage
    let finalImageUrl = outputUrl;

    if (outputUrl.startsWith('data:')) {
        const matches = outputUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const base64Data = matches[2];

            const result = await uploadToStorage(supabaseAdmin, base64Data, mimeType, user_id);

            if (result.url) {
                finalImageUrl = result.url;
            } else if (base64Data.length > 3 * 1024 * 1024) {
                throw new Error('图片太大，存储上传失败: ' + result.error);
            }
        }
    }

    // Update task as completed
    await updateTaskStatus(id, 'completed', finalImageUrl);
}

function buildEnhancedPrompt(basePrompt: string, toolType: string, settings: GenerationSettings, isTextToImage: boolean): string {
    let prompt = "";
    if (isTextToImage) {
        prompt = basePrompt || "Generate a high quality image";
    } else {
        switch (toolType) {
            case 'background':
                prompt = `Look at this product image and generate a new version with the background completely removed. Place the product on a pure white background. Keep the product sharp, clear and high quality. ${basePrompt || ''}`;
                break;
            case 'upscale':
                prompt = `Look at this image and generate an enhanced, higher resolution version. Make it sharper, more detailed, and improve the overall quality. ${basePrompt || ''}`;
                break;
            case 'model':
                prompt = basePrompt || "Generate a professional fashion photo with a model wearing/holding this product.";
                break;
            default:
                prompt = basePrompt || "Enhance this image";
        }
    }

    if (settings.sceneType) {
        const scenePrompts: Record<SceneType, string> = {
            'product': 'Professional product photography, studio lighting, clean background.',
            'portrait': 'Professional portrait photography, flattering lighting, bokeh background.',
            'landscape': 'Stunning landscape photography, natural lighting, vibrant colors.',
            'interior': 'Interior design photography, architectural lighting, modern aesthetic.',
            'food': 'Appetizing food photography, professional food styling, warm lighting.',
            'abstract': 'Abstract artistic composition, creative and unique visual elements.'
        };
        prompt = `${scenePrompts[settings.sceneType]} ${prompt}`;
    }

    if (settings.artStyle) {
        const stylePrompts: Record<ArtStyle, string> = {
            'realistic': 'Photorealistic style, ultra-detailed, lifelike rendering.',
            'anime': 'Anime/manga art style, clean lines, vibrant colors, cel-shaded.',
            'oil-painting': 'Oil painting style, rich brushstrokes, classical art technique.',
            'watercolor': 'Watercolor painting style, soft gradients, translucent layers.',
            'digital-art': 'Digital art style, modern illustration, crisp details.',
            'pencil-sketch': 'Pencil sketch style, hand-drawn look, graphite texture.',
            'cinematic': 'Cinematic style, movie-like composition, dramatic lighting.'
        };
        prompt = `${stylePrompts[settings.artStyle]} ${prompt}`;
    }

    const resolutionTexts: Record<Resolution, string> = {
        '1K': 'Standard HD quality.',
        '2K': 'High resolution 2K quality, enhanced details.',
        '4K': 'Ultra high resolution 4K quality, maximum detail and clarity.'
    };
    prompt = `${resolutionTexts[settings.resolution]} ${prompt}`;

    return prompt;
}
