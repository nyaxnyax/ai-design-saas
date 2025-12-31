import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateCreditCost } from '@/lib/credit-calculator';
import type { GenerationSettings, SceneType, ArtStyle, Resolution } from '@/types/generation';

// Switch to Node.js runtime for longer timeout support
export const maxDuration = 300; // 300 seconds (5 mins) for 4K generation

/**
 * Upload base64 image to Supabase Storage and return public URL
 * Includes retry logic and detailed error logging
 */
async function uploadToStorage(supabase: any, base64Data: string, mimeType: string, userId: string): Promise<{ url: string | null; error: string | null }> {
    const maxRetries = 2;
    const uploadTimeout = 60000; // 60 seconds timeout

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const buffer = Buffer.from(base64Data, 'base64');
            const ext = mimeType.split('/')[1] || 'png';
            const filename = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

            console.log(`[Storage] Upload attempt ${attempt + 1}/${maxRetries + 1} - Size: ${buffer.length} bytes, File: ${filename}`);

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Upload timeout')), uploadTimeout)
            );

            // Upload to 'user-uploads' bucket
            const uploadPromise = supabase.storage
                .from('user-uploads')
                .upload(filename, buffer, {
                    contentType: mimeType,
                    upsert: false
                });

            // Race between upload and timeout
            const { error: uploadError } = await Promise.race([
                uploadPromise,
                timeoutPromise.then(() => ({ error: { message: 'Upload timeout', name: 'TimeoutError' } }))
            ]) as any;

            if (uploadError) {
                const errorMsg = `Attempt ${attempt + 1}: ${uploadError.message || JSON.stringify(uploadError)}`;
                console.error(`[Storage] Upload failed - ${errorMsg}`);
                if (attempt < maxRetries) {
                    console.log(`[Storage] Retrying in 1 second...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                return { url: null, error: errorMsg };
            }

            const { data: { publicUrl } } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(filename);

            console.log(`[Storage] Upload success: ${publicUrl}`);
            return { url: publicUrl, error: null };

        } catch (e: any) {
            const errorMsg = `Exception: ${e.message}`;
            console.error(`[Storage] ${errorMsg}`);
            if (attempt < maxRetries) {
                console.log(`[Storage] Retrying in 1 second...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            return { url: null, error: errorMsg };
        }
    }

    return { url: null, error: 'Max retries exceeded' };
}


/**
 * Parse and translate API error messages to user-friendly Chinese messages
 */
function parseApiError(errorMessage: string): string {
    // Check for token quota errors
    if (errorMessage.includes('token quota is not enough') ||
        errorMessage.includes('pre_consume_token_quota_failed')) {
        const remainMatch = errorMessage.match(/remain quota: ¥([\d.]+)/);
        const needMatch = errorMessage.match(/need quota: ¥([\d.]+)/);
        if (remainMatch && needMatch) {
            return `Token 配额不足！剩余: ¥${remainMatch[1]}，所需: ¥${needMatch[1]}，请充值后重试`;
        }
        return 'Token 配额不足，请充值后重试';
    }

    // Try to parse JSON format errors
    try {
        const errorData = JSON.parse(errorMessage);

        if (errorData.code === 'pre_consume_token_quota_failed' || errorData.type === 'new_api_error') {
            const message = errorData.message || '';
            const remainMatch = message.match(/remain quota: ¥([\d.]+)/);
            const needMatch = message.match(/need quota: ¥([\d.]+)/);
            if (remainMatch && needMatch) {
                return `Token 配额不足！剩余: ¥${remainMatch[1]}，所需: ¥${needMatch[1]}，请充值后重试`;
            }
            return 'Token 配额不足，请充值后重试';
        }

        if (errorData.error) {
            const error = errorData.error;
            if (error.code === 'UNAUTHENTICATED' || error.status === 'UNAUTHENTICATED') {
                return 'API Key 无效或已过期，请检查后重试';
            }
            if (error.code === 'PERMISSION_DENIED' || error.status === 'PERMISSION_DENIED') {
                return '没有权限访问此 API，请检查 API Key 权限';
            }
            if (error.code === 'RESOURCE_EXHAUSTED' || error.status === 'RESOURCE_EXHAUSTED') {
                return '请求频率超限，请稍后重试';
            }
            if (error.code === 'INVALID_ARGUMENT' || error.status === 'INVALID_ARGUMENT') {
                return '请求参数无效：' + (error.message || '请检查输入');
            }
            if (error.message) {
                return translateErrorMessage(error.message);
            }
        }

        if (errorData.message) {
            return translateErrorMessage(errorData.message);
        }
    } catch (e) {
        // Not JSON format, continue processing
    }

    // Network related errors
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        return '网络连接失败，请检查网络后重试';
    }
    if (errorMessage.includes('aborted') || errorMessage.includes('timeout')) {
        return '请求超时，请稍后重试';
    }

    // Return translated error message
    return translateErrorMessage(errorMessage) || '未知错误';
}

/**
 * Translate common English error messages to Chinese
 */
function translateErrorMessage(msg: string): string {
    if (!msg) return '未知错误';

    const translations: Record<string, string> = {
        'token quota is not enough': 'Token 配额不足',
        'remain quota': '剩余配额',
        'need quota': '所需配额',
        'request id': '请求ID',
        'Invalid API key': 'API Key 无效',
        'API key expired': 'API Key 已过期',
        'Rate limit exceeded': '请求频率超限',
        'Internal server error': '服务器内部错误',
        'Service unavailable': '服务暂时不可用',
        'Bad request': '请求格式错误',
        'Unauthorized': '未授权访问',
        'Forbidden': '禁止访问',
        'Not found': '资源不存在',
        'Request timeout': '请求超时',
        'Too many requests': '请求过于频繁'
    };

    let translated = msg;
    for (const [en, zh] of Object.entries(translations)) {
        translated = translated.replace(new RegExp(en, 'gi'), zh);
    }
    return translated;
}

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAILY_FREE_LIMIT = 3

export async function POST(req: Request) {
    try {
        // 1. Authenticate User
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        const { prompt, image_url, type, settings } = await req.json();

        // 2. Validate Inputs
        const apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'System Error: Missing AI Config' }, { status: 500 });
        }

        const isTextToImage = type === 'text-to-image';
        if (!isTextToImage && !image_url) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // 3. Process settings
        let finalSettings: GenerationSettings = {
            resolution: settings?.resolution || '1K',
            aspectRatio: settings?.aspectRatio || '16:9',
            sceneType: settings?.sceneType,
            artStyle: settings?.artStyle,
        };

        // 4. Calculate cost
        let cost = calculateCreditCost(type, finalSettings);

        // 5. Check Credits & Daily Limit
        const { data: creditRecord, error: creditFetchError } = await supabaseAdmin
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (creditFetchError && creditFetchError.code !== 'PGRST116') {
            console.error('Fetch Credits Error:', creditFetchError);
            return NextResponse.json({ error: 'Failed to retrieve wallet info' }, { status: 500 });
        }

        let currentCredits = 0;
        let dailyCount = 0;
        let lastReset = new Date(0).toISOString();

        if (!creditRecord) {
            const { data: newRecord, error: createError } = await supabaseAdmin
                .from('user_credits')
                .insert({ user_id: user.id, balance: 15, daily_generations: 0 })
                .select()
                .single();

            if (createError) return NextResponse.json({ error: 'Wallet init failed' }, { status: 500 });
            currentCredits = newRecord.balance;
            dailyCount = newRecord.daily_generations;
            lastReset = newRecord.last_daily_reset;
        } else {
            currentCredits = creditRecord.balance;
            dailyCount = creditRecord.daily_generations;
            lastReset = creditRecord.last_daily_reset;
        }

        const now = new Date();
        const lastResetDate = new Date(lastReset);
        const isSameDay = now.getUTCFullYear() === lastResetDate.getUTCFullYear() &&
            now.getUTCMonth() === lastResetDate.getUTCMonth() &&
            now.getUTCDate() === lastResetDate.getUTCDate();

        if (!isSameDay) {
            dailyCount = 0;
        }

        let isFreeUsage = false;
        if (dailyCount < DAILY_FREE_LIMIT) {
            isFreeUsage = true;
        } else {
            if (currentCredits < cost) {
                return NextResponse.json({ error: '积分不足 (Insufficient Credits)' }, { status: 402 });
            }
        }

        // 6. Build Prompt
        let userPrompt = buildEnhancedPrompt(prompt, type, finalSettings, isTextToImage);

        function buildEnhancedPrompt(basePrompt: string, toolType: string, settings: GenerationSettings, isTextToImage: boolean): string {
            let prompt = "";
            if (isTextToImage) {
                prompt = basePrompt || "Generate a high quality image";
            } else {
                switch (toolType) {
                    case 'background':
                        prompt = `Look at this product image and generate a new version with the background completely removed. Place the product on a pure white background. Keep the product sharp, clear and high quality. ${basePrompt || ''}`;
                        break
                    case 'upscale':
                        prompt = `Look at this image and generate an enhanced, higher resolution version. Make it sharper, more detailed, and improve the overall quality. ${basePrompt || ''}`;
                        break
                    case 'model':
                        prompt = basePrompt || "Generate a professional fashion photo with a model wearing/holding this product.";
                        break
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

            // Resolution hint in prompt
            const resolutionTexts: Record<Resolution, string> = {
                '1K': 'Standard HD quality.',
                '2K': 'High resolution 2K quality, enhanced details.',
                '4K': 'Ultra high resolution 4K quality, maximum detail and clarity.'
            };
            prompt = `${resolutionTexts[settings.resolution]} ${prompt}`;

            return prompt;
        }

        console.log(`[Generate] User: ${user.id} | Type: ${type} | Free: ${isFreeUsage} | Credits: ${currentCredits}`);

        // 7. Call AI API (Banana Pro / Google Native)
        let outputUrl = null;
        const modelName = process.env.AI_MODEL || "gemini-3-pro-image-preview";

        // Use logic from reference code
        const endpoint = process.env.AI_BASE_URL
            ? `${process.env.AI_BASE_URL}/models/${modelName}:generateContent`
            : `https://xingjiabiapi.org/v1beta/models/${modelName}:generateContent`;

        // Final API Key
        const finalApiKey = apiKey;
        const apiUrl = `${endpoint}?key=${finalApiKey}`;

        // Download image if needed
        let imageBase64 = "";
        let imageMimeType = "image/png";

        if (!isTextToImage && image_url) {
            try {
                console.log(`[AI API] Downloading image from: ${image_url}`);
                const imageResponse = await fetch(image_url);
                if (!imageResponse.ok) throw new Error(`Failed to download image: ${imageResponse.status}`);
                const imageBuffer = await imageResponse.arrayBuffer();
                const base64 = Buffer.from(imageBuffer).toString('base64');
                imageBase64 = base64;

                const urlLower = image_url.toLowerCase();
                if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) imageMimeType = "image/jpeg";
                else if (urlLower.includes('.webp')) imageMimeType = "image/webp";
                else if (urlLower.includes('.gif')) imageMimeType = "image/gif";
            } catch (e) {
                console.error('[AI API] Failed to download image:', e);
                return NextResponse.json({ error: 'Failed to process input image' }, { status: 500 });
            }
        }

        // Construct Payload according to working sample
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

        console.log(`[AI API] Calling ${endpoint}...`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Authorization header not strictly needed if key is in URL, but good practice if supported
                // 'Authorization': `Bearer ${finalApiKey}` 
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("AI API Error:", errorText);
            const friendlyError = parseApiError(errorText);
            return NextResponse.json({ error: friendlyError }, { status: response.status });
        }

        const data = await response.json();

        // Extract result (Logic from reference)
        // Check "candidates"
        const candidate = data.candidates?.[0];
        if (candidate) {
            const contentParts = candidate.content?.parts || [];
            // Look for inline_data
            const inlinePart = contentParts.find((p: any) => p.inline_data || p.inlineData);
            if (inlinePart) {
                const inline = inlinePart.inline_data || inlinePart.inlineData;
                if (inline?.data) {
                    const mime = inline.mime_type || inline.mimeType || 'image/png';
                    outputUrl = `data:${mime};base64,${inline.data}`;
                }
            }
        }

        // Fallback checks
        if (!outputUrl && data.imageBase64) {
            const mime = data.mimeType || 'image/png';
            outputUrl = `data:${mime};base64,${data.imageBase64}`;
        }

        // Check if only text returned
        if (!outputUrl) {
            console.error("Model No Output Image. Full Response:", JSON.stringify(data).substring(0, 1000));
            return NextResponse.json({ error: "Model returned text but no image. Please try again." }, { status: 500 });
        }

        // 8. PROCESS IMAGE: UPLOAD TO STORAGE
        // Vercel has a 4.5MB body limit. 4K images are ~10-15MB.
        // We MUST upload to storage and return a URL.
        let finalImageUrl = outputUrl;
        let storageError = null;

        // Check if it's base64
        if (outputUrl.startsWith('data:')) {
            const matches = outputUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const mimeType = matches[1];
                const base64Data = matches[2];
                const base64SizeMB = base64Data.length / (1024 * 1024);

                console.log(`[Generate] Uploading result to storage (${base64Data.length} chars, ~${base64SizeMB.toFixed(2)}MB)...`);
                const result = await uploadToStorage(supabaseAdmin, base64Data, mimeType, user.id);

                if (result.url) {
                    finalImageUrl = result.url;
                    console.log(`[Generate] Upload success: ${finalImageUrl}`);
                } else {
                    // Storage upload failed - record error but don't fail the entire request
                    storageError = result.error || 'Unknown storage error';
                    console.error('[Generate] Storage upload failed:', storageError);

                    // For small images (< 3MB base64), we can still return the base64 URL
                    // For large images (4K), we need to let the frontend know about the storage issue
                    if (base64Data.length > 3 * 1024 * 1024) {
                        // Image is too large to return as base64 - mark as storage error
                        console.warn('[Generate] Image too large for base64 fallback. Storage error will be sent to frontend.');
                        finalImageUrl = null; // Signal that we don't have a usable URL
                    } else {
                        console.warn('[Generate] Using base64 fallback for smaller image.');
                        // Keep the original base64 URL as fallback
                        finalImageUrl = outputUrl;
                    }
                }
            }
        }

        // 9. Deduct Credits
        if (isFreeUsage) {
            await supabaseAdmin.from('user_credits').update({
                daily_generations: dailyCount + 1,
                last_daily_reset: new Date().toISOString()
            }).eq('user_id', user.id);
        } else {
            await supabaseAdmin.from('user_credits').update({
                balance: currentCredits - cost
            }).eq('user_id', user.id);
            currentCredits -= cost; // Update local var for stats
        }

        // 10. Return response with storage error info if applicable
        // If storage failed but image was generated, return success with storage_error flag
        if (storageError && !finalImageUrl) {
            return NextResponse.json({
                image_url: null,
                storage_error: true,
                error_message: `图片已生成但存储上传失败: ${storageError}`,
                remaining_credits: currentCredits,
                daily_used: isFreeUsage ? dailyCount + 1 : dailyCount
            });
        }

        return NextResponse.json({
            image_url: finalImageUrl,
            storage_error: !!storageError, // Flag if there was a storage error (but we have a fallback URL)
            remaining_credits: currentCredits,
            daily_used: isFreeUsage ? dailyCount + 1 : dailyCount
        });

    } catch (error: any) {
        console.error('Generaton Route Error:', error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}

