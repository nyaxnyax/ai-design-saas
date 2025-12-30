import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { prompt, image_url, type } = await req.json()

        // 🚀 Support generic OpenAI-compatible providers (like Xingjiabi, OpenRouter)
        const apiKey = Deno.env.get('AI_API_KEY') || Deno.env.get('OPENROUTER_API_KEY')
        const baseUrl = Deno.env.get('AI_BASE_URL') || 'https://openrouter.ai/api/v1'

        if (!apiKey) {
            throw new Error('Missing AI_API_KEY configuration')
        }

        if (!image_url) {
            throw new Error('Image URL is required')
        }

        // ... (prompt building logic remains same) ...

        console.log(`Starting generation for type: ${type}`)
        console.log(`Using API Provider: ${baseUrl}`)

        // Call AI Provider
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                // specific headers for OpenRouter, others might ignore
                "HTTP-Referer": "https://ai-design-saas.vercel.app",
                "X-Title": "AI Design SaaS"
            },
            body: JSON.stringify({
                // TODO: User might want to change model too? For now keep gemini-3-pro or make it env var
                model: Deno.env.get('AI_MODEL') || "google/gemini-pro-vision", // Fallback to a common vision model or keep existing if Xingjiabi supports it
                // Note: The previous code used "google/gemini-3-pro-image-preview". 
                // We should probably allow configuring the model via env var AI_MODEL.
                // Xingjiabi might have different model names. 
                // Let's use AI_MODEL env var, default to the one we verified works or a safe default.
                // Re-reading previous code: model: "google/gemini-3-pro-image-preview"
                // I will use that as default but allow override.
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: userPrompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: image_url
                                }
                            }
                        ]
                    }
                ],
                // CRITICAL: Must include modalities for image generation
                modalities: ["image", "text"],
                max_tokens: 4096,
                temperature: 0.7
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("OpenRouter Error:", errorText)
            throw new Error(`OpenRouter API error: ${errorText}`)
        }

        const data = await response.json()
        console.log("OpenRouter Response:", JSON.stringify(data, null, 2))

        // Extract the generated image from the response
        // According to OpenRouter docs, images are in message.images array
        const message = data.choices?.[0]?.message

        if (!message) {
            throw new Error("No message in response")
        }

        let outputUrl = null

        // Check for images array (OpenRouter standard format)
        if (message.images && message.images.length > 0) {
            // Images are returned as base64 data URLs
            outputUrl = message.images[0].image_url?.url || message.images[0].imageUrl?.url
        }

        // Fallback: check content for base64 or URL
        if (!outputUrl && message.content) {
            const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content)

            // Check for base64 image data
            const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
            if (base64Match) {
                outputUrl = base64Match[0]
            }

            // Check for URL
            const urlMatch = content.match(/https?:\/\/[^\s"']+\.(png|jpg|jpeg|webp|gif)/i)
            if (!outputUrl && urlMatch) {
                outputUrl = urlMatch[0]
            }
        }

        if (!outputUrl) {
            console.log("Full response (no image found):", JSON.stringify(data, null, 2))
            const contentPreview = message.content?.substring?.(0, 300) || JSON.stringify(message).substring(0, 300)
            throw new Error("Model did not return an image. Response preview: " + contentPreview)
        }

        return new Response(
            JSON.stringify({
                image_url: outputUrl,
                remaining_credits: 999 // TODO: Implement real credit deduction
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        )

    } catch (error: unknown) {
        console.error(error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
