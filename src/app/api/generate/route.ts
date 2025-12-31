import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateCreditCost, BASE_COSTS } from '@/lib/credit-calculator';
import type { GenerationSettings, SceneType, ArtStyle, Resolution } from '@/types/generation';

// EDGE RUNTIME may not support some Node APIs, but standard fetch/Supabase work fine.

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

// EDGE RUNTIME may not support some Node APIs, but standard fetch/Supabase work fine.
export const runtime = 'edge';

// Initialize Supabase Admin Client
// We use SERVICE_ROLE_KEY to perform backend operations (deduct credits) securely.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COST_STANDARD = 3
const COST_PRO = 10
const DAILY_FREE_LIMIT = 3

export async function POST(req: Request) {
    try {
        // 1. Authenticate User
        // We expect an Authorization header "Bearer <access_token>" from the client
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
        const baseUrl = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1';

        if (!apiKey) {
            return NextResponse.json({ error: 'System Error: Missing AI Config' }, { status: 500 });
        }

        // Text-to-image mode doesn't require an image
        const isTextToImage = type === 'text-to-image';
        if (!isTextToImage && !image_url) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // 3. Validate and process settings
        let finalSettings: GenerationSettings = {
            resolution: settings?.resolution || '1K',
            aspectRatio: settings?.aspectRatio || '16:9',
            sceneType: settings?.sceneType,
            artStyle: settings?.artStyle,
        };

        // 4. Calculate cost using the new calculator
        let cost = calculateCreditCost(type, finalSettings);

        // 4. Check Credits & Daily Limit
        // Fetch user credit record
        const { data: creditRecord, error: creditFetchError } = await supabaseAdmin
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (creditFetchError && creditFetchError.code !== 'PGRST116') { // PGRST116 = no rows
            // If table missing or error, fail safe to deny or creating record? 
            // Best to create if missing (though the Trigger should have done it)
            console.error('Fetch Credits Error:', creditFetchError);
            return NextResponse.json({ error: 'Failed to retrieve wallet info' }, { status: 500 });
        }

        // If no record exists, create one (Fail-safe for old users created before migration)
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

        // Check if daily reset is needed
        // Convert both to same timezone day to compare. Simple UTC check:
        const now = new Date();
        const lastResetDate = new Date(lastReset);

        const isSameDay = now.getUTCFullYear() === lastResetDate.getUTCFullYear() &&
            now.getUTCMonth() === lastResetDate.getUTCMonth() &&
            now.getUTCDate() === lastResetDate.getUTCDate();

        if (!isSameDay) {
            dailyCount = 0; // Reset for today
        }

        let isFreeUsage = false;

        if (dailyCount < DAILY_FREE_LIMIT) {
            isFreeUsage = true;
        } else {
            // Check Balance
            if (currentCredits < cost) {
                return NextResponse.json({ error: '积分不足 (Insufficient Credits)' }, { status: 402 });
            }
        }

        // 5. Build enhanced prompt based on type, scene, and style
        let userPrompt = buildEnhancedPrompt(prompt, type, finalSettings, isTextToImage);

        function buildEnhancedPrompt(basePrompt: string, toolType: string, settings: GenerationSettings, isTextToImage: boolean): string {
            let prompt = "";

            // Build tool-specific base prompt
            if (isTextToImage) {
                // Text-to-image mode: directly use the user's prompt
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
                        prompt = basePrompt || "Generate a professional fashion photo with a model wearing/holding this product. High quality, 8K resolution, studio lighting, professional photography.";
                        break
                    default:
                        prompt = basePrompt || "Enhance this image";
                }
            }

            // Add scene type context
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

            // Add art style context
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

            // Add resolution context to prompt
            const resolutionTexts: Record<Resolution, string> = {
                '1K': 'Standard HD quality.',
                '2K': 'High resolution 2K quality, enhanced details.',
                '4K': 'Ultra high resolution 4K quality, maximum detail and clarity.'
            };
            prompt = `${resolutionTexts[settings.resolution]} ${prompt}`;

            return prompt;
        }

        console.log(`[Generate] User: ${user.id} | Type: ${type} | Free: ${isFreeUsage} | Credits: ${currentCredits}`);

        // 6. Call AI API
        let outputUrl = null;

        // Detect correct internal logic based on provider
        // Check for Google usage via URL, Key, or Model Name
        const modelName = process.env.AI_MODEL || "gemini-3-pro-image-preview";

        // Use user's specific key and endpoint if model matches Banana Pro
        const isBananaPro = modelName === "gemini-3-pro-image-preview";
        const finalApiKey = isBananaPro && process.env.AI_API_KEY ? process.env.AI_API_KEY : apiKey;
        const xingjiabiUrl = process.env.AI_BASE_URL
            ? `${process.env.AI_BASE_URL}/models/gemini-3-pro-image-preview:generateContent`
            : "https://xingjiabiapi.org/v1beta/models/gemini-3-pro-image-preview:generateContent";

        const isGoogle = isBananaPro || baseUrl.includes('googleapis') || apiKey.startsWith('AIza') || modelName.includes('gemini');

        if (isGoogle) {
            // GOOGLE NATIVE / BANANA PRO IMPLEMENTATION

            let googleUrl = "";
            if (isBananaPro) {
                googleUrl = xingjiabiUrl;
            } else {
                // Construct URL: Use provided BaseURL if it's a proxy, otherwise default to Google
                const targetBase = baseUrl.includes('openrouter.ai') ? 'https://generativelanguage.googleapis.com/v1beta' : baseUrl;
                const cleanBase = targetBase.replace(/\/$/, '');
                const endpoint = baseUrl.includes('googleapis') || baseUrl.includes('openrouter')
                    ? `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`
                    : `${cleanBase}/models/${modelName}:generateContent`;
                googleUrl = `${endpoint}?key=${finalApiKey}`;
            }

            // Download image and convert to base64 for Banana Pro/Gemini API
            let imageBase64 = "";
            let imageMimeType = "image/png";

            if (image_url) {
                try {
                    console.log(`[AI API] Downloading image from: ${image_url}`);
                    const imageResponse = await fetch(image_url);
                    if (!imageResponse.ok) {
                        throw new Error(`Failed to download image: ${imageResponse.status}`);
                    }
                    const imageBuffer = await imageResponse.arrayBuffer();
                    const base64 = Buffer.from(imageBuffer).toString('base64');
                    imageBase64 = base64;

                    // Detect mime type from URL
                    const urlLower = image_url.toLowerCase();
                    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
                        imageMimeType = "image/jpeg";
                    } else if (urlLower.includes('.webp')) {
                        imageMimeType = "image/webp";
                    } else if (urlLower.includes('.gif')) {
                        imageMimeType = "image/gif";
                    }

                    console.log(`[AI API] Image converted to base64, size: ${base64.length} chars, type: ${imageMimeType}`);
                } catch (downloadError) {
                    console.error('[AI API] Failed to download/convert image:', downloadError);
                    return NextResponse.json({ error: 'Failed to process uploaded image' }, { status: 500 });
                }
            }

            // Build parts array with text and image
            const parts: any[] = [
                { text: userPrompt }
            ];

            if (imageBase64) {
                parts.push({
                    inline_data: {
                        mime_type: imageMimeType,
                        data: imageBase64
                    }
                });
            }

            // Build enhanced prompt with resolution info
            const resolutionPrompt = finalSettings.resolution === '4K'
                ? ' Generate at maximum 4K resolution (3840x2160 or higher). Ultra high quality, maximum detail and clarity.'
                : finalSettings.resolution === '2K'
                ? ' Generate at 2K resolution (2560x1440). High resolution, enhanced details.'
                : ' Generate at standard HD quality.';

            const enhancedPrompt = userPrompt + resolutionPrompt;

            const payload = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: enhancedPrompt },
                            ...(imageBase64 ? [{
                                inline_data: {
                                    mime_type: imageMimeType,
                                    data: imageBase64
                                }
                            }] : [])
                        ]
                    }
                ],
                generationConfig: {
                    responseModalities: ["TEXT", "IMAGE"],
                    imageConfig: {
                        aspectRatio: finalSettings.aspectRatio
                    }
                }
            };

            console.log(`[AI API] Calling ${modelName}... URL: ${googleUrl}`);
            console.log(`[AI API] Resolution: ${finalSettings.resolution}, AspectRatio: ${finalSettings.aspectRatio}`);
            console.log(`[AI API] Enhanced prompt length: ${enhancedPrompt.length}`);

            const response = await fetch(googleUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${finalApiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Google API Error:", errorText);
                // Parse and translate error message for better UX
                const friendlyError = parseApiError(errorText);
                return NextResponse.json({ error: friendlyError }, { status: response.status });
            }

            const data = await response.json();

            // Log response structure for debugging
            console.log('[AI API] Response structure:', JSON.stringify({
                hasCandidates: !!data.candidates,
                candidatesLength: data.candidates?.length,
                firstCandidateKeys: data.candidates?.[0] ? Object.keys(data.candidates[0]) : [],
                hasContent: !!data.candidates?.[0]?.content,
                contentKeys: data.candidates?.[0]?.content ? Object.keys(data.candidates[0].content) : [],
                hasParts: !!data.candidates?.[0]?.content?.parts,
                partsLength: data.candidates?.[0]?.content?.parts?.length,
            }));

            // Parse Google Response (Inline Base64)
            // Structure: candidates[0].content.parts[].inlineData.data (Base64)
            const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

            console.log('[AI API] Found inlineData part:', !!part);

            if (part && part.inlineData && part.inlineData.data) {
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                outputUrl = `data:${mimeType};base64,${base64Data}`;
                console.log('[AI API] Image extracted successfully, data URI length:', outputUrl.length);
            } else {
                // Try alternative response formats
                console.log('[AI API] No inlineData found, checking alternatives...');
                console.log('[AI API] Full response data:', JSON.stringify(data).substring(0, 500));
            }

        } else {
            // OPENROUTER / OPENAI COMPATIBLE IMPLEMENTATION
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://ai-design-saas.vercel.app",
                    "X-Title": "AI Design SaaS"
                },
                body: JSON.stringify({
                    model: process.env.AI_MODEL || "google/gemini-2.0-flash-exp:free", // Update default to a better model?
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: userPrompt },
                                { type: "image_url", image_url: { url: image_url } }
                            ]
                        }
                    ],
                    max_tokens: 4096,
                    temperature: 0.7
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("AI API Error:", errorText);
                return NextResponse.json({ error: `AI API error: ${errorText}` }, { status: response.status });
            }

            const data = await response.json();
            const message = data.choices?.[0]?.message;

            if (message) {
                // @ts-ignore
                if (message.images && message.images.length > 0) {
                    // @ts-ignore
                    outputUrl = message.images[0].image_url?.url || message.images[0].imageUrl?.url;
                }
                if (!outputUrl && message.content) {
                    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
                    const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
                    if (base64Match) outputUrl = base64Match[0];
                    const urlMatch = content.match(/https?:\/\/[^\s"']+\.(png|jpg|jpeg|webp|gif)/i);
                    if (!outputUrl && urlMatch) outputUrl = urlMatch[0];
                }
            }
        }

        if (!outputUrl) {
            console.error("Model No Output. Data:", isGoogle ? "Google Parsed Failed" : "OpenAI Parsed Failed");
            return NextResponse.json({ error: "Model did not return an image." }, { status: 500 });
        }

        // 7. Deduct Credits / Update Daily Count ON SUCCESS
        // We do this AFTER generation to prevent taking credits for failures
        if (isFreeUsage) {
            // Increment daily count, update reset time to NOW (to mark today as active)
            await supabaseAdmin.from('user_credits').update({
                daily_generations: dailyCount + 1,
                last_daily_reset: new Date().toISOString()
            }).eq('user_id', user.id);

            // Return updated status (frontend can refresh)
            currentCredits = currentCredits; // No change
        } else {
            // Deduct Balance
            const { data: updated } = await supabaseAdmin.from('user_credits').update({
                balance: currentCredits - cost
            }).eq('user_id', user.id).select().single();

            currentCredits = updated?.balance ?? (currentCredits - cost);
        }

        return NextResponse.json({
            image_url: outputUrl,
            remaining_credits: currentCredits,
            daily_used: isFreeUsage ? dailyCount + 1 : dailyCount
        });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

