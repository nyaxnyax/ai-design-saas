# Supabase MCP Server Configuration Guide

此文档将指导你如何在 Cursor 或 Claude Desktop 中配置 Supabase MCP Server，以便让 AI 助手直接访问你的数据库进行查询和管理。

## 1. 准备工作

你需要准备以下两个凭证（可以在 `.env.local` 文件或 Supabase 后台设置中找到）：

1.  **SUPABASE_URL**: 你的 Supabase 项目 URL (例如: `https://xyz.supabase.co`)
2.  **SUPABASE_KEY**: 你的 **Service Role Key** (注意：为了让 AI 拥有完整的数据库管理权限，建议使用 Service Role Key，而在客户端代码中请只使用 Anon Key)。

## 2. 配置 Cursor

1.  打开 Cursor 设置 (`Ctrl + ,` 或 `Cmd + ,`)。
2.  搜索 "MCP" 或在侧边栏找到 **Features > MCP**。
3.  点击 **Add New MCP Server**。
4.  填写以下信息：
    *   **Name**: `supabase`
    *   **Type**: `command` (如果有此选项) 或直接在 Command 处填写。
    *   **Command**: `npx`
    *   **Args**: `-y @modelcontextprotocol/server-supabase`
    *   **Environment Variables**:
        *   `SUPABASE_URL`: (填入你的 URL)
        *   `SUPABASE_KEY`: (填入你的 Key)

如果 Cursor 支持直接编辑 `config.json`，请参考下方的 JSON 格式。

## 3. 配置 Claude Desktop

1.  找到配置文件：
    *   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
    *   **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
2.  使用文本编辑器打开该文件。
3.  在 `mcpServers` 对象中添加以下内容：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "YOUR_SUPABASE_URL_HERE",
        "SUPABASE_KEY": "YOUR_SERVICE_ROLE_KEY_HERE"
      }
    }
  }
}
```

## 4. 验证是否成功

配置完成后：
1.  **重启** Cursor 或 Claude Desktop。
2.  在对话框中看通过附件/工具图标是否能看到 `supabase` 工具。
3.  试着问 AI：“列出 `users` 表的前 5 条数据” 或 “检查 `profiles` 表的结构”。

## 常见问题

*   **Windows 路径问题**: 确保 `npx` 命令在你的系统 PATH 中（通常安装了 Node.js 就有）。
*   **权限问题**: 如果使用 Anon Key，AI 可能无法看到某些受 RLS 保护的数据。建议在本地调试环境使用 Service Role Key。
