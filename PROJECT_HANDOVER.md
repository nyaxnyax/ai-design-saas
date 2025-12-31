# AI Design SaaS 项目交接文档

## 📋 项目概述

**项目名称**: AI Design SaaS / PikaDesign
**项目类型**: AI 图片生成 SaaS 平台
**技术栈**: Next.js 14 + React + Supabase + Vercel
**域名**: pikadesign.me
**部署**: Vercel (生产环境)

---

## 🏗️ 项目架构

### 技术栈
- **前端框架**: Next.js 14 (App Router)
- **UI**: React + Tailwind CSS + Lucide Icons
- **后端**: Next.js API Routes (Edge Runtime)
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth (手机号+密码登录)
- **文件存储**: Supabase Storage
- **AI API**: xingjiabiapi.org (Gemini-3-Pro-Image-Preview)
- **部署**: Vercel
- **版本控制**: GitHub

### 项目结构
```
ai-design-saas/
├── src/
│   ├── app/
│   │   ├── studio/page.tsx          # 主工作室页面
│   │   ├── api/
│   │   │   ├── auth/               # 认证相关 API
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── send-code/route.ts
│   │   │   │   ├── init-credits/route.ts
│   │   │   │   ├── repair-account/route.ts
│   │   │   │   └── check-phone/route.ts
│   │   │   ├── generate/route.ts   # 核心 AI 生图 API
│   │   │   ├── user/
│   │   │   │   └── credits/route.ts
│   │   │   └── payment/
│   │   │       └── notify/route.ts
│   │   ├── pricing/page.tsx
│   │   └── gallery/page.tsx
│   ├── components/
│   │   ├── auth/                   # 认证组件
│   │   │   ├── AuthModal.tsx
│   │   │   └── AuthForm.tsx
│   │   └── studio/                 # 工作室组件
│   │       ├── ToolSidebar.tsx
│   │       ├── GenerationSettings.tsx
│   │       ├── HistoryPanel.tsx
│   │       ├── CreditsPanel.tsx
│   │       └── UserMenu.tsx
│   ├── lib/
│   │   ├── supabase/client.ts
│   │   └── credit-calculator.ts    # 积分计算逻辑
│   └── types/
│       └── generation.ts           # 类型定义
├── supabase/
│   └── migrations/                 # 数据库迁移文件
└── scripts/                        # 工具脚本
```

---

## 🔑 环境变量配置

### 必需的环境变量 (.env.local)

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI API 配置 (xingjiabiapi.org)
AI_API_KEY=your_api_key
AI_BASE_URL=https://xingjiabiapi.org
AI_MODEL=gemini-3-pro-image-preview

# OpenRouter (备用)
OPENROUTER_API_KEY=optional_openrouter_key

# 微信支付（可选）
WECHAT_PAY_MCHID=
WECHAT_PAY_APICLIENT_KEY=
WECHAT_PAY_NOTIFY_URL=
```

### 获取环境变量

**Supabase:**
- URL: 在 Supabase Dashboard → Settings → API
- Service Role Key: 在同一页面（保密，不要泄露）

**AI API Key:**
- 平台: https://xingjiabiapi.org
- 注册账号后获取 API Key
- 模型: `gemini-3-pro-image-preview`

---

## 🗄️ 数据库结构

### 表结构

#### 1. `phone_users` - 手机号用户表
```sql
- id: uuid (primary key)
- phone: varchar (unique) - 手机号
- password_hash: varchar - 密码哈希
- supabase_user_id: uuid (foreign key) - 关联 auth.users
- created_at: timestamp
- updated_at: timestamp
```

#### 2. `user_credits` - 用户积分表
```sql
- user_id: uuid (primary key, foreign key)
- balance: integer (default 0) - 积分余额
- daily_generations: integer (default 0) - 每日生成次数
- last_daily_reset: timestamp - 上次重置时间
- created_at: timestamp
- updated_at: timestamp
```

#### 3. `generations` - 生成历史表
```sql
- id: uuid (primary key)
- user_id: uuid (foreign key)
- prompt: text - 提示词
- result_url: text - 结果图片URL
- settings: json - 生成设置
- type: varchar - 生成类型
- created_at: timestamp
```

#### 4. `verification_codes` - 验证码表
```sql
- id: uuid (primary key)
- phone: varchar - 手机号
- code: varchar - 验证码
- verified: boolean - 是否已验证
- expires_at: timestamp - 过期时间
- created_at: timestamp
```

#### 5. `payments` - 支付记录表
```sql
- id: uuid (primary key)
- user_id: uuid (foreign key)
- amount: decimal - 支付金额
- credits: integer - 获得积分
- status: varchar - 状态
- created_at: timestamp
```

### 触发器
- `on_auth_user_created`: 新用户注册时自动创建积分记录（15积分）

---

## 🔧 核心功能说明

### 1. 用户认证系统

**注册流程:**
1. 用户输入手机号
2. 调用 `/api/auth/send-code` 发送验证码
3. 用户输入验证码和密码
4. 调用 `/api/auth/register` 完成注册
5. 自动创建 Supabase Auth 用户（影子账户）
6. 自动初始化 15 积分

**登录流程:**
1. 用户输入手机号和密码
2. 调用 `/api/auth/login`
3. 验证 `phone_users.password_hash`
4. 使用影子账户登录 Supabase Auth
5. 返回 session 给前端

**影子账户机制:**
- 邮箱格式: `{phone}@phone.login`
- 密码: SHA256(phone + userPassword + salt) + 'Aa1!'
- 作用: 复用 Supabase Auth 的 session 机制

### 2. 积分系统

**积分计算** (`lib/credit-calculator.ts`):
```typescript
基础价格:
- 标准生成: 3 积分
- 高清放大: 10 积分

分辨率倍率:
- 1K: ×1.0 (3 积分)
- 2K: ×2.0 (6 积分)
- 4K: ×4.0 (12 积分)

风格倍率:
- 油画: ×1.5
- 电影: ×1.3
- 写实: ×1.2
- 动漫: ×1.1
```

**免费额度:**
- 新用户赠送 15 积分
- 每日免费 3 次生成（优先消耗免费额度）

### 3. AI 生图系统

**核心 API**: `/api/generate`

**请求参数:**
```typescript
{
  prompt: string           // 提示词
  image_url?: string       // 图片URL（图生图模式）
  type: string             // 'text-to-image' | 'background' | 'model' | 'upscale' | ...
  settings: {
    resolution: '1K' | '2K' | '4K'
    aspectRatio: '1:1' | '16:9' | '4:3' | '3:4' | '9:16'
    sceneType?: string
    artStyle?: string
  }
}
```

**AI API 调用** (xingjiabiapi.org):
```typescript
{
  contents: [{
    role: "user",
    parts: [
      { text: prompt },
      { inline_data: { mime_type: "...", data: "base64..." } }
    ]
  }],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: {
      aspectRatio: "16:9",
      imageSize: "4K"        // ⭐ 关键参数
    }
  }
}
```

**响应解析:**
- 从 `candidates[0].content.parts[]` 查找 `inlineData`
- 提取 base64 图片数据
- 返回 data URI 给前端

---

## 🐛 已知问题和修复

### ✅ 已修复的问题

#### 1. 新用户积分初始化失败
**问题**: 调用 `init-credits` API 时缺少 Authorization header
**修复**: 在 `src/app/studio/page.tsx:116-124` 添加 session token
**影响**: 新用户现在能正确获得 15 积分

#### 2. 登录后页面一直转圈
**问题**: `init-credits` API 调用可能卡住
**修复**: 添加 5 秒超时保护 (AbortController)
**位置**: `src/app/studio/page.tsx:119-147, 189-217`

#### 3. 4K 分辨率设置无效 ⭐ 最关键
**问题**: API 请求缺少 `imageSize` 参数
**修复**: 在 `imageConfig` 中添加 `imageSize: finalSettings.resolution`
**位置**: `src/app/api/generate/route.ts:400`
**影响**: 现在 4K/2K/1K 设置正确传递给 API，生成质量显著提升

#### 4. Studio 页面语法错误
**问题**: `src/app/studio/page.tsx` 曾出现语法错误导致的白屏
**修复**: 修正了 `useEffect` 中的代码块闭合问题
**状态**: ✅ 已修复，页面正常加载

### 📝 待优化项目

1. **API 响应解析增强**
   - 当前只支持 `inlineData` 格式
   - 可以添加更多容错处理

2. **图片显示优化**
   - 添加加载进度
   - 添加重试机制

3. **错误处理**
   - 更友好的错误提示
   - 自动重试失败的请求

---

## 🚀 部署指南

### 1. 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入真实值

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 2. 数据库设置

```bash
# 在 Supabase Dashboard 中执行迁移
# 依次执行以下 SQL 文件:

supabase/migrations/20241228_user_credits_system.sql
supabase/migrations/20241228_add_subscription_columns.sql
supabase/migrations/20241228000000_create_orders_table.sql
supabase/migrations/20241228000001_add_insert_policy.sql
supabase/migrations/20241228_create_verification_codes.sql
supabase/migrations/20241229_phone_auth_system.sql
supabase/migrations/20241230_fix_cascade_delete.sql
supabase/migrations/20241230_apply_cascade_fix.sql
```

### 3. Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署
vercel --prod

# 或者连接 GitHub 仓库自动部署
```

### 4. 环境变量配置（Vercel）

在 Vercel Dashboard → Settings → Environment Variables 添加:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL`

### 5. 域名配置

**已配置**: pikadesign.me

**DNS 记录**:
```
类型: CNAME
主机记录: @
记录值: cname.vercel-dns.com
TTL: 10分钟
```

---

## 🔍 调试指南

### 查看日志

**Vercel 函数日志:**
1. 访问 Vercel Dashboard
2. 进入项目 → Deployments
3. 点击最新部署 → Functions
4. 查看 `/api/generate` 的日志

**前端控制台:**
```javascript
// 查看生成流程日志
[handleGenerate] Starting generation...
[API] Request payload...
[API] Response status...

// 查看 AI API 调用
[AI API] Calling gemini-3-pro-image-preview...
[AI API] Resolution: 4K, AspectRatio: 16:9
[AI API] Response structure...
```

### 常见问题排查

**1. 图片不显示**
- 检查浏览器控制台是否有错误
- 检查 Network 标签看 API 响应
- 查看 Vercel 日志确认 API 是否被调用

**2. 积分未扣除**
- 检查 `user_credits` 表是否有记录
- 查看日志中的积分计算逻辑
- 确认请求包含有效的 session token

**3. 4K 设置无效**
- 确认代码包含 `imageSize` 参数
- 检查 API 请求体
- 查看 xingjiabiapi 后台的扣费金额

**4. 登录问题**
- 检查 `phone_users` 表
- 检查 Supabase Auth 用户
- 使用 `/api/auth/repair-account` 修复

---

## 📦 重要文件说明

### 核心业务文件

| 文件 | 说明 | 重要程度 |
|------|------|----------|
| `src/app/api/generate/route.ts` | AI 生图核心 API | ⭐⭐⭐ |
| `src/app/studio/page.tsx` | 主工作室页面 | ⭐⭐⭐ |
| `src/lib/credit-calculator.ts` | 积分计算逻辑 | ⭐⭐ |
| `src/components/auth/AuthForm.tsx` | 登录注册表单 | ⭐⭐ |
| `src/app/api/auth/login/route.ts` | 登录 API | ⭐⭐ |
| `src/app/api/auth/register/route.ts` | 注册 API | ⭐⭐ |

### 工具脚本

| 脚本 | 用途 |
|------|------|
| `scripts/add-credits.ts` | 手动给用户添加积分 |
| `scripts/fix-user-password.ts` | 修复用户密码 |
| `scripts/apply-cascade-fix.ts` | 修复数据库级联删除 |

---

## 📊 API 文档

### POST /api/generate

**请求头:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**请求体:**
```json
{
  "prompt": "一只可爱的猫",
  "image_url": "https://...",  // 可选
  "type": "text-to-image",
  "settings": {
    "resolution": "4K",
    "aspectRatio": "16:9",
    "sceneType": "product",
    "artStyle": "realistic"
  }
}
```

**响应:**
```json
{
  "image_url": "data:image/png;base64,iVBORw0KG...",
  "remaining_credits": 3,
  "daily_used": 1
}
```

**错误响应:**
```json
{
  "error": "错误描述（已翻译为中文）"
}
```

---

## 💰 支付系统集成

### 当前状态
- ✅ 支付 API 端点已创建 (`/api/payment/notify`)
- ✅ 数据库表已创建
- ⚠️ 需要配置微信支付商户信息

### 配置步骤
1. 注册微信支付商户号
2. 获取商户号和 API 密钥
3. 配置回调 URL: `https://pikadesign.me/api/payment/notify`
4. 在环境变量中添加配置
5. 实现支付页面 (`/pricing`)

---

## 🔐 安全注意事项

### 敏感信息
1. **SUPABASE_SERVICE_ROLE_KEY** - 绕过 RLS，绝对保密
2. **AI_API_KEY** - 关联计费，需要保护
3. **用户密码** - 使用 bcrypt 哈希存储

### 安全措施
- ✅ 使用 Supabase RLS (Row Level Security)
- ✅ API 路由验证用户身份
- ✅ 密码使用 bcrypt 哈希
- ✅ 影子账户密码使用确定性哈希
- ⚠️ 建议添加 rate limiting

---

## 📞 联系方式

**项目所有者**: [用户名]
**技术栈**: Next.js + Supabase + Vercel
**AI 服务**: xingjiabiapi.org

---

## 📝 待办事项清单

### 高优先级
- [ ] 完成 git push（网络问题待解决）
- [ ] 验证 4K 生图功能
- [ ] 检查 xingjiabiapi API 调用记录
- [ ] 确认积分扣除正确

### 中优先级
- [ ] 添加更多错误处理
- [ ] 优化图片加载体验
- [ ] 完成支付系统集成
- [ ] 添加使用统计

### 低优先级
- [ ] 添加用户反馈功能
- [ ] 优化 SEO
- [ ] 添加分享功能
- [ ] 移动端优化

---

## 📚 相关资源

### 文档链接
- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Vercel 文档](https://vercel.com/docs)
- [xingjiabiapi 文档](https://xingjiabiapi.org)

### 有用的命令
```bash
# 本地开发
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run type-check

# 运行 Supabase 本地开发
supabase start

# 应用数据库迁移
supabase db push
```

---

**文档更新时间**: 2025-12-31
**项目状态**: 开发中
**最后部署**: 待推送
