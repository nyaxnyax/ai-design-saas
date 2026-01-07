import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { createClient } from '@supabase/supabase-js';
import { calculateCreditCost, BASE_COSTS } from '@/lib/credit-calculator';
import type { GenerationSettings, SceneType, ArtStyle, Resolution } from '@/types/generation';

// EDGE RUNTIME may not support some Node APIs, but standard fetch/Supabase work fine.

/**
 * Parse and translate API error messages to user-friendly Chinese messages
 */
function parseApiError(errorMessage: string): string {
    // Check for sensitive upstream balance errors (Sanitization)
    if (errorMessage.includes('预扣费额度失败') || errorMessage.includes('用户剩余额度')) {
        return '系统服务繁忙，请稍后重试 (Service Busy)';
    }

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

// Node.js runtime (default) supports Buffer and longer timeouts
export const maxDuration = 60; // Set timeout to 60s for AI generation
export const dynamic = 'force-dynamic';


// Initialize Supabase Admin Client
// We use SERVICE_ROLE_KEY to perform backend operations (deduct credits) securely.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COST_STANDARD = 3
const COST_PRO = 10
const DAILY_FREE_CREDITS = 10 // Daily free credits limit

export async function POST(req: Request) {
    console.log('[API] /api/generate POST received');
    try {
        // 1. Authenticate User
        console.log('[API] Authenticating...');
        let user: { id: string; role?: string; email?: string } | null = null;

        // [Marketing Bot Backdoor]
        const marketingSecret = req.headers.get('x-marketing-secret');
        // TODO: Move secret to env in production
        if (marketingSecret && marketingSecret === 'PIKA_MARKETING_2026_SECRET') {
            console.log('[API] Marketing Bot Access Granted');
            user = { id: 'marketing-bot-001', role: 'service_role', email: 'bot@pika.ai' };
        } else {
            // Standard User Auth
            const authHeader = req.headers.get('Authorization');
            if (!authHeader) {
                return NextResponse.json({ error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
            }

            const token = authHeader.replace('Bearer ', '');
            const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

            if (authError || !authUser) {
                return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
            }
            user = authUser;
        }

        const { prompt, image_url, image_url_2, type, settings } = await req.json();

        // 2. Validate Inputs
        const apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY;
        const baseUrl = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1';

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

        // 3. Settings & Cost
        const userSelectedResolution = settings?.resolution || '1K';
        let finalSettings: GenerationSettings = {
            resolution: '1K',
            aspectRatio: settings?.aspectRatio || '16:9',
            sceneType: settings?.sceneType,
            artStyle: settings?.artStyle,
        };

        let costSettings: GenerationSettings = {
            resolution: userSelectedResolution,
            aspectRatio: settings?.aspectRatio || '16:9',
            sceneType: settings?.sceneType,
            artStyle: settings?.artStyle,
        };

        let cost = calculateCreditCost(type, costSettings);

        // 4. Check & Deduct Credits
        const { data: creditRecord, error: creditFetchError } = await supabaseAdmin
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (creditFetchError && creditFetchError.code !== 'PGRST116') {
            console.error('Fetch Credits Error:', creditFetchError);
            return NextResponse.json({ error: 'Failed to retrieve wallet info' }, { status: 500 });
        }

        // Initialize wallet if missing
        let currentBalance = 0;
        let lastReset = new Date(0).toISOString();
        let dailyUsed = 0;

        if (!creditRecord) {
            const { data: newRecord, error: createError } = await supabaseAdmin
                .from('user_credits')
                .insert({ user_id: user.id, balance: 10, daily_generations: 0 })
                .select()
                .single();

            if (createError) return NextResponse.json({ error: 'Wallet init failed' }, { status: 500 });
            currentBalance = newRecord.balance;
            dailyUsed = newRecord.daily_generations;
            lastReset = newRecord.last_daily_reset;
        } else {
            currentBalance = creditRecord.balance;
            dailyUsed = creditRecord.daily_generations;
            lastReset = creditRecord.last_daily_reset;
        }

        // Check Paid Status
        // Check Paid Status
        const { count: paidOrdersCount, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'paid');
        
        if (orderError) {
             console.error('[GENERATE] Failed to check paid status:', orderError);
             // CRITICAL SAFETY: Do not proceed if we can't verify payment status.
             // Risk: Treating a paid user as free might wipe their credits.
             return NextResponse.json({ error: 'System busy checking account status, please try again.' }, { status: 500 });
        }
        
        const isPaidUser = (paidOrdersCount || 0) > 0;

        // Daily Reset & Correction Logic
        const now = new Date();
        const lastResetDate = new Date(lastReset);
        const isSameDay = now.getUTCFullYear() === lastResetDate.getUTCFullYear() &&
            now.getUTCMonth() === lastResetDate.getUTCMonth() &&
            now.getUTCDate() === lastResetDate.getUTCDate();

        let balanceChangedByReset = false;

        if (isPaidUser) {
            // Paid User: Top up to 10 if below 10 on new day
            if (!isSameDay && currentBalance < 10) {
                console.log(`[GENERATE] Paid User Top-up: ${currentBalance} -> 10`);
                currentBalance = 10;
                dailyUsed = 0;
                balanceChangedByReset = true;
            } else if (!isSameDay) {
                dailyUsed = 0; // Just reset counter
                balanceChangedByReset = true; // Need to update timestamp
            }
        } else {
            // Free User: Strict Reset to 10
            if (!isSameDay || currentBalance > 10) {
                console.log(`[GENERATE] Free User Strict Reset: ${currentBalance} -> 10`);
                currentBalance = 10;
                dailyUsed = 0;
                balanceChangedByReset = true;
            }
        }

        // Check Affordability
        if (currentBalance < cost) {
            return NextResponse.json({ error: `积分不足 (Need ${cost}, Have ${currentBalance})` }, { status: 402 });
        }

        // Execute Deduction
        const newBalance = currentBalance - cost;
        const newDailyUsed = dailyUsed + 1; // Count + 1 generation

        console.log(`[CREDITS] Deduction: ${currentBalance} - ${cost} = ${newBalance}`);

        const { data: updated, error: updateError } = await supabaseAdmin.from('user_credits').update({
            balance: newBalance,
            daily_generations: newDailyUsed,
            last_daily_reset: balanceChangedByReset ? now.toISOString() : lastReset // Update time if reset happened
        }).eq('user_id', user.id).select().single();

        if (updateError || !updated) {
            console.error('[CREDITS] Transaction failed:', updateError);
            return NextResponse.json({ error: 'Transaction failed, please try again.' }, { status: 500 });
        }

        // 5. Generate
        let userPrompt = buildEnhancedPrompt(prompt, type, finalSettings, isTextToImage);
        
        function buildEnhancedPrompt(basePrompt: string, toolType: string, settings: GenerationSettings, isTextToImage: boolean): string {
             return basePrompt;
        }

        console.log(`[Generate] Start API Call. User: ${user.id}`);
        let outputUrl = null;
        let apiError = null;

        try {
             // ... API CALL LOGIC ...
             // (Must include full logic here to replace the function body)
             const modelName = process.env.AI_MODEL || "gemini-3-pro-image-preview";
             const isBananaPro = modelName === "gemini-3-pro-image-preview";
             const finalApiKey = isBananaPro && process.env.AI_API_KEY ? process.env.AI_API_KEY : apiKey;
             const xingjiabiUrl = process.env.AI_BASE_URL
                 ? `${process.env.AI_BASE_URL}/models/gemini-3-pro-image-preview:generateContent`
                 : "https://xingjiabiapi.org/v1beta/models/gemini-3-pro-image-preview:generateContent";
             const isGoogle = isBananaPro || baseUrl.includes('googleapis') || apiKey.startsWith('AIza') || modelName.includes('gemini');

             if (isGoogle) {
                 let googleUrl = isBananaPro ? xingjiabiUrl : 
                     (baseUrl.includes('openrouter.ai') ? 'https://generativelanguage.googleapis.com/v1beta' : baseUrl.replace(/\/$/, '')) + 
                     (baseUrl.includes('googleapis') || baseUrl.includes('openrouter') 
                         ? `/models/${modelName}:generateContent` 
                         : `/models/${modelName}:generateContent`) +
                     `?key=${finalApiKey}`;
                 
                 // Fix: Clean URL construction
                 if (!isBananaPro) {
                     const targetBase = baseUrl.includes('openrouter.ai') ? 'https://generativelanguage.googleapis.com/v1beta' : baseUrl;
                     const cleanBase = targetBase.replace(/\/$/, '');
                     const endpoint = baseUrl.includes('googleapis') || baseUrl.includes('openrouter')
                        ? `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`
                        : `${cleanBase}/models/${modelName}:generateContent`;
                     googleUrl = `${endpoint}?key=${finalApiKey}`;
                 }

                 let imageBase64 = "";
                 let imageMimeType = "image/png";
                 if (image_url) {
                    const imageResponse = await fetch(image_url);
                    if (!imageResponse.ok) throw new Error(`Failed to download image: ${imageResponse.status}`);
                    const imageBuffer = await imageResponse.arrayBuffer();
                    imageBase64 = Buffer.from(imageBuffer).toString('base64');
                    const urlLower = image_url.toLowerCase();
                    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) imageMimeType = "image/jpeg";
                    else if (urlLower.includes('.webp')) imageMimeType = "image/webp";
                    else if (urlLower.includes('.gif')) imageMimeType = "image/gif";
                 }
                 
                 let imageBase64_2 = "";
                 let imageMimeType_2 = "image/png";
                 if (image_url_2) {
                    const imageResponse = await fetch(image_url_2);
                    if (!imageResponse.ok) throw new Error(`Failed to download second image: ${imageResponse.status}`);
                    const imageBuffer = await imageResponse.arrayBuffer();
                    imageBase64_2 = Buffer.from(imageBuffer).toString('base64');
                    const urlLower = image_url_2.toLowerCase();
                    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) imageMimeType_2 = "image/jpeg";
                    else if (urlLower.includes('.webp')) imageMimeType_2 = "image/webp";
                    else if (urlLower.includes('.gif')) imageMimeType_2 = "image/gif";
                 }



                 const resolutionPrompt = finalSettings.resolution === '4K'
                    ? ' Generate at maximum 4K resolution (3840x2160 or higher).'
                    : finalSettings.resolution === '2K' ? ' Generate at 2K resolution.' : ' Generate at standard HD quality.';

                 const parts: any[] = [{ text: userPrompt + resolutionPrompt }];
                 if (imageBase64) parts.push({ inline_data: { mime_type: imageMimeType, data: imageBase64 } });
                 if (imageBase64_2) parts.push({ inline_data: { mime_type: imageMimeType_2, data: imageBase64_2 } });

                 const payload = {
                     contents: [{ role: "user", parts: parts }],
                     generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: finalSettings.aspectRatio, imageSize: finalSettings.resolution } }
                 };

                 const response = await fetch(googleUrl, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${finalApiKey}` },
                     body: JSON.stringify(payload)
                 });

                 if (!response.ok) {
                     const errorText = await response.text();
                     console.error("API Error:", errorText);
                     throw new Error(parseApiError(errorText));
                 }
                 const data = await response.json();
                 const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
                 if (part?.inlineData?.data) {
                     outputUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                 } else {
                     if (data.promptFeedback?.blockReason) throw new Error(`AI Refused: ${data.promptFeedback.blockReason}`);
                     throw new Error("模型未返回图片数据");
                 }
             } else {
                 // OPENAI compatible...
                  const response = await fetch(`${baseUrl}/chat/completions`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: process.env.AI_MODEL || "google/gemini-2.0-flash-exp:free",
                        messages: [{ role: "user", content: [{ type: "text", text: userPrompt }, { type: "image_url", image_url: { url: image_url } }] }],
                        max_tokens: 4096
                    }),
                });
                if (!response.ok) throw new Error(await response.text());
                const data = await response.json();
                outputUrl = data.choices?.[0]?.message?.images?.[0]?.url || data.choices?.[0]?.message?.content?.match(/http[^\s"]+/)?.[0];
             }

             if (!outputUrl) throw new Error("Model did not return an image URL.");

        } catch (error: any) {
            console.error('[Generate] API Failed:', error);
            apiError = error.message;
        }

        // 6. Finalize Transaction
        if (outputUrl) {
            return NextResponse.json({
                image_url: outputUrl,
                remaining_credits: newBalance,
                daily_used: newDailyUsed
            });
        } else {
            console.log(`[CREDITS] Rolling back: Returning to ${currentBalance}`);
            // Rollback
            await supabaseAdmin.from('user_credits').update({
                balance: currentBalance
            }).eq('user_id', user.id);

            return NextResponse.json({ error: apiError || 'Generation failed' }, { status: 500 });
        }

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

