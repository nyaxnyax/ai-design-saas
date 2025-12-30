// src/lib/glm.ts
export interface GLMMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function callGLM(messages: GLMMessage[]) {
    const apiKey = process.env.GLM_API_KEY;
    if (!apiKey) {
        throw new Error('Missing GLM_API_KEY environment variable');
    }

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'glm-4',
            messages: messages,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        throw new Error(`GLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}
