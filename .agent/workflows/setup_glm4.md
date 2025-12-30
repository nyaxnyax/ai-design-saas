---
description: 在项目中一键配置智谱 GLM-4.7 API 环境
---

这是一个自动化工作流，用于快速在 Next.js 项目中集成 GLM-4.7。

1.  **配置环境变量**
    - 检查 `.env.local` 是否存在，如果不存在则创建。
    - 将 `GLM_API_KEY` 写入环境变量文件。（注意：需要确保 Key 已知或询问用户）

    ```bash
    # 这一步通常需要用户确认 Key，或者假设我已经知道了 Key
    # 这里我们使用一个占位符命令，实际运行时我会智能处理
    env_file=".env.local"
    if [ ! -f "$env_file" ]; then
        touch "$env_file"
    fi
    # 检查是否已存在
    if ! grep -q "GLM_API_KEY" "$env_file"; then
        echo "" >> "$env_file"
        echo "GLM_API_KEY=49045607977f49bcb5bbd00c8b49d331.HEtd8HBbumbnekG2" >> "$env_file"
        echo "已添加 GLM_API_KEY"
    else
        echo "GLM_API_KEY 已存在"
    fi
    ```

2.  **创建通用 API 调用库**
    - 创建 `src/lib/glm.ts` 文件。

    ```typescript
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
          model: 'glm-4.7',
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
    ```

3.  **告知用户完成**
    - 提示用户环境已就绪，可以直接开始开发 AI 功能。
