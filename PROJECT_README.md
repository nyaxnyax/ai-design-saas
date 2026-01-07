# DesignAI - AI Design SaaS 项目完整归档文档

> **项目名称**: DesignAI (pikadesign.me)
> **技术栈**: Next.js 14 + Supabase + Vercel
> **最后更新**: 2025-12-31
> **状态**: 生产环境运行中，支付系统调试中

---

## 📋 项目概述

一个 AI 图像生成 SaaS 平台，提供：
- 智能换背景
- AI 换模特
- AI 主图生成
- 批量生成（1-10张）
- 积分充值系统
- 订阅会员系统
- 虎皮椒支付接入

---

## 🏗️ 技术架构

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: 自定义 + Lucide Icons

### 后端
- **API**: Next.js API Routes (Edge Runtime)
- **数据库**: Supabase (PostgreSQL)
- **存储**: Supabase Storage
- **认证**: Supabase Auth (手机号验证码登录)

### AI 服务
- **提供商**: Banana Pro (xingjiabiapi.org)
- **模型**: gemini-3-pro-image-preview
- **成本**: ~¥0.24/张

### 部署
- **平台**: Vercel (免费版)
- **限制**: 10秒函数超时
- **域名**: pikadesign.me

---

## 📁 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── auth/                      # 认证相关API
│   │   │   ├── login/route.ts         # 手机号登录
│   │   │   ├── register/route.ts      # 注册
│   │   │   ├── send-code/route.ts     # 发送短信验证码
│   │   │   ├── check-phone/route.ts   # 检查手机号
│   │   │   ├── reset-password/route.ts
│   │   │   ├── init-credits/route.ts  # 初始化积分
│   │   │   └── repair-account/route.ts
│   │   ├── payment/                   # 支付相关API
│   │   │   ├── create/route.ts        # 创建虎皮椒支付订单
│   │   │   └── notify/route.ts        # 虎皮椒支付回调
│   │   ├── generate/route.ts          # AI生成接口
│   │   ├── debug/
│   │   │   └── credits/route.ts       # 调试接口
│   │   ├── admin/
│   │   │   └── fix-db/route.ts        # 数据库修复工具
│   │   └── user/                      # 用户相关API
│   │       ├── credits/route.ts       # 积分查询
│   │       ├── history/route.ts       # 生成历史
│   │       ├── referrals/route.ts     # 邀请记录
│   │       └── settings/route.ts      # 用户设置
│   ├── studio/                        # 创作工作室页面
│   ├── pricing/                       # 价格方案页面（含支付按钮）
│   ├── gallery/                       # 案例展示页面
│   ├── auth/
│   │   └── callback/route.ts          # OAuth回调
│   └── page.tsx                       # 首页
├── components/
│   ├── layout/
│   │   └── Navbar.tsx                 # 导航栏（含Logo）
│   ├── studio/
│   │   ├── GenerationSettings.tsx     # 生成设置面板
│   │   ├── ToolSidebar.tsx            # 工具侧边栏
│   │   ├── UserMenu.tsx               # 用户菜单
│   │   ├── CreditsPanel.tsx           # 积分面板
│   │   ├── TutorialPanel.tsx          # 教程面板
│   │   └── InvitePanel.tsx            # 邀请面板
│   ├── auth/
│   │   └── AuthModal.tsx              # 登录注册弹窗
│   └── logo/
│       └── LetterNLogo.tsx            # Logo组件
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # 客户端Supabase
│   │   └── server.ts                  # 服务端Supabase
│   ├── payment/
│   │   └── xunhu.ts                   # 虎皮椒支付配置和签名生成
│   └── credit-calculator.ts           # 积分计算器
├── types/
│   └── generation.ts                  # 类型定义
└── middleware.ts                      # 中间件
```

---

## 🔑 环境变量配置

### 本地开发 (.env.local)
```bash
# Created by Vercel CLI
CRON_SECRET="pika-cron-secret-2024"
SMSBAO_PASS="q82b@Wc45zdzFBh"
SMSBAO_USER="nyaxnyax"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://nvvinmvhapafxgrgrtnz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# AI API Configuration
AI_BASE_URL="https://xingjiabiapi.org/v1beta"
AI_MODEL="gemini-3-pro-image-preview"

# Vercel Configuration
NEXT_PUBLIC_BASE_URL="https://pikadesign.me"

# Payment Configuration
XUNHU_APP_ID="201906176073"
XUNHU_APP_SECRET="39fe382fb26565d0c0cd071c43689ebf"
XUNHU_API_URL="https://pay.xunhupay.com"
```

### Vercel 生产环境
需要在 Vercel Dashboard 中配置以下环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (重要！用于服务端绕过RLS)
- `AI_BASE_URL`
- `AI_MODEL`
- `AI_API_KEY`
- `NEXT_PUBLIC_BASE_URL`
- `XUNHU_APP_ID`
- `XUNHU_APP_SECRET`
- `SMSBAO_USER`
- `SMSBAO_PASS`
- `CRON_SECRET`

---

## 💰 积分与定价系统

### 统一定价策略
- **所有分辨率统一**: 3 积分/张
- **1K/2K/4K 价格相同**: 因为实际生成都用1K（Vercel超时限制）
- **每日免费额度**: 3次/天（每日0点重置）
- **批量生成**: 积分 = 单价 × 数量

### 积分包
| 套餐 | 积分 | 价格 | 原价 | 可生成图片 |
|------|------|------|------|------------|
| 新人见面礼 | 50 | ¥4.9 | ¥49 | ~16张 |
| 入门套餐 | 100 | ¥9.9 | ¥19.9 | ~33张 |
| 热门套餐 | 550 | ¥49 | ¥99 | ~183张 |
| 超值套餐 | 1200 | ¥99 | ¥199 | ~400张 |
| 尊享套餐 | 3300 | ¥289 | ¥499 | ~1100张 |

### 订阅方案
| 方案 | 月付 | 年付 | 每月积分 | 特点 |
|------|------|------|---------|------|
| 基础版 | ¥9.9 | ¥99 | 100 | 入门级 |
| 专业版 | ¥49 | ¥499 | 600 | 最受欢迎 |
| 企业版 | ¥199 | ¥1999 | 3000 | API访问 |

### 成本分析
- **API成本**: ~¥0.24/张
- **积分单价**: ~¥0.099/积分
- **盈亏平衡**: 2.42积分/张
- **当前定价**: 3积分/张（微利模式）

---

## 🗄️ 数据库结构

### 表: phone_users
```sql
CREATE TABLE public.phone_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  invite_code text UNIQUE NOT NULL,
  invited_by text,
  supabase_user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);
```

### 表: user_credits
```sql
CREATE TABLE public.user_credits (
  user_id uuid PRIMARY KEY REFERENCES phone_users(id),
  balance integer DEFAULT 15,
  daily_generations integer DEFAULT 0,
  last_daily_reset timestamp with time zone DEFAULT now(),
  subscription_tier text,
  subscription_expires_at timestamp with time zone,
  subscription_status text DEFAULT 'inactive',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### 表: orders (重要：已创建)
```sql
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES phone_users(id),
  plan_id text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider_trade_no text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb
);

-- RLS 策略
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all orders"
  ON public.orders FOR ALL USING (true);
```

### 表: credit_transactions
```sql
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES phone_users(id),
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  type text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);
```

### 表: generation_history
```sql
CREATE TABLE public.generation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES phone_users(id),
  prompt text,
  image_url text,
  type text,
  settings jsonb,
  credits_used integer,
  batch_index integer,
  created_at timestamp with time zone DEFAULT now()
);
```

### 表: referrals
```sql
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES phone_users(id),
  referred_id uuid REFERENCES phone_users(id),
  status text DEFAULT 'pending',
  credits_awarded boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
```

---

## 🔄 支付系统（虎皮椒）

### 配置文件: src/lib/payment/xunhu.ts
```typescript
export const XUNHU_CONFIG: XunhuConfig = {
  appId: (process.env.XUNHU_APP_ID || '').trim(),
  appSecret: (process.env.XUNHU_APP_SECRET || '').trim(),
  notifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/notify`,
  returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?status=success`,
  apiUrl: 'https://api.xunhupay.com/payment/do.html',
};
```

### 签名生成算法
```typescript
export function generateHash(data: Record<string, string | number>, appSecret: string): string {
  const sortedKeys = Object.keys(data).sort();
  const pairs: string[] = [];

  for (const key of sortedKeys) {
    const value = data[key];
    if (value !== '' && value !== null && value !== undefined && key !== 'hash') {
      pairs.push(`${key}=${value}`);
    }
  }

  pairs.push(`key=${appSecret}`);
  const signString = pairs.join('&');

  return crypto.createHash('md5').update(signString).digest('hex');
}
```

### 支付创建流程
1. 用户选择套餐，点击购买
2. 调用 `/api/payment/create` (需要登录)
3. 创建订单记录（使用 Service Role 绕过 RLS）
4. 生成虎皮椒支付参数
5. 返回支付URL，前端跳转

### 支付回调处理
1. 虎皮椒 POST 到 `/api/payment/notify`
2. 验证签名（MD5 hash）
3. 检查订单状态（status = 'OD' 表示已支付）
4. 更新订单状态为 'paid'
5. 根据套餐发放积分/订阅

### 积分发放对照表
```javascript
// 积分包
'starter': 100积分
'popular': 550积分（含50赠送）
'value': 1200积分（含200赠送）
'expert': 3300积分（含300赠送）
'new_user_gift': 50积分

// 订阅（积分+会员权益）
'basic': 100积分/月 + 订阅
'pro': 600积分/月 + 订阅
'enterprise': 3000积分/月 + 订阅
```

### 当前支付问题（待解决）
**错误**: "29 未知的APPID!"
**原因**: 虎皮椒服务器返回此APPID不存在或未激活
**排查方向**:
1. 确认APPID是否正确：201906176073
2. 检查虎皮椒后台账户状态
3. 确认支付方式是否已启用
4. 检查是否需要实名认证

---

## ⚠️ 重要技术决策与已知问题

### 1. Vercel 超时问题
**问题**: Vercel 免费版 API 函数超时为 10 秒，而 4K 图片生成需要 ~97 秒

**解决方案**: 所有分辨率统一生成 1K，但 UI 仍保留 1K/2K/4K 选项

**相关文件**: [src/app/api/generate/route.ts](src/app/api/generate/route.ts:157-165)

### 2. 积分扣除 Bug（已修复）
**问题**: 超过每日免费额度后，积分不扣除，可以无限白嫖

**根本原因**: 当 `isFreeUsage = false` 时，只扣除了 `balance`，但没有更新 `daily_generations`，导致它永远停留在 3

**修复代码**:
```typescript
// 修复前（BUG）
} else {
    const { data: updated } = await supabaseAdmin.from('user_credits').update({
        balance: currentCredits - cost
    }).eq('user_id', user.id).select().single();
}

// 修复后
} else {
    const { data: updated } = await supabaseAdmin.from('user_credits').update({
        balance: currentCredits - cost,
        daily_generations: dailyCount + 1  // 关键：也要累加每日次数！
    }).eq('user_id', user.id).select().single();
}
```

### 3. 下载文件格式问题（已修复）
**问题**: 下载的图片没有文件扩展名

**解决方案**:
1. 正确检测 MIME 类型
2. 添加文件扩展名
3. 添加格式转换功能（PNG ↔ JPG）
4. 提供下载格式选择菜单

### 4. orders 表 RLS 问题（已修复）
**问题**: 普通用户无法创建订单，报错 "Failed to create order"

**解决方案**:
1. 添加 INSERT 策略到 orders 表
2. 使用 Service Role 客户端绕过 RLS

### 5. 环境变量换行符问题（已修复）
**问题**: APPID 后面有换行符 `\n`，导致虎皮椒认证失败

**解决方案**:
```typescript
appId: (process.env.XUNHU_APP_ID || '').trim(),
appSecret: (process.env.XUNHU_APP_SECRET || '').trim(),
```

---

## 🎨 Logo 设计

**当前使用**: 自定义字母 N Logo

**Logo 文件**: `/public/images/logo.png`

**位置**: [src/components/layout/Navbar.tsx](src/components/layout/Navbar.tsx:9-33)

---

## 📱 短信验证码系统

**服务商**: SMS Bao (smsbao.com)
**功能**:
- 发送验证码
- 验证码有效期: 5分钟
- 新用户注册送 15 积分

**相关文件**:
- [src/app/api/auth/send-code/route.ts](src/app/api/auth/send-code/route.ts)
- [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts)

---

## 🎯 核心功能流程

### 用户注册流程
1. 输入手机号
2. 发送验证码
3. 验证码登录/注册
4. 创建 phone_users 记录（含唯一邀请码）
5. 触发 user_credits 记录（通过 trigger）
6. 发放注册奖励（15积分）

### 图片生成流程
1. 用户上传图片/输入提示
2. 选择设置（分辨率、比例、风格等）
3. 计算积分消耗 = 基础3分 × 风格系数 × 数量
4. 检查余额/每日免费额度
5. 调用 AI API 生成（强制1K分辨率）
6. **仅在成功后扣除积分**
7. 保存到历史记录

### 批量生成流程
```typescript
for (let i = 1; i <= batchSize; i++) {
    显示进度: "正在生成第 i/batchSize 张..."
    调用生成API
    扣除积分
    添加到历史（含batch_index）
}
```

---

## 🐛 已知问题与待解决

### 支付问题
**状态**: 待解决
**错误**: "29 未知的APPID!"
**需要**:
1. 确认虎皮椒APPID是否正确
2. 检查虎皮椒后台账户状态
3. 确认支付方式是否已启用
4. 可能需要重新创建虎皮椒应用

### 订阅折扣功能
**状态**: 已决定不实现
**原因**: 避免亏本，当前定价已经偏低

---

## 🚀 部署与维护

### 本地开发
```bash
cd C:\Users\Administrator\.gemini\antigravity\scratch\ai-design-saas
npm run dev
```

### 构建与部署
```bash
# 构建
npm run build

# 部署到 Vercel
npx vercel --prod
```

### 环境变量管理
```bash
# 查看环境变量
npx vercel env ls

# 添加环境变量
npx vercel env add <变量名> production

# 拉取环境变量到本地
npx vercel env pull .env.local
```

### 日志查看
```bash
# 查看部署日志
npx vercel logs pikadesign.me

# 检查部署状态
npx vercel inspect https://pikadesign.me --logs
```

---

## 📊 重要数据备份

### Supabase 项目
- **URL**: https://nvvinmvhapafxgrgrtnz.supabase.co
- **重要**: 定期备份数据库
- **RLS**: 所有表都启用了行级安全

### Vercel 项目
- **项目ID**: prj_AXQYEX6DWfy4DyWx5boWCv0wqQBh
- **团队**: 757307937-qqcoms-projects
- **域名**: pikadesign.me

---

## 📝 待办事项 (TODO)

### 紧急（支付相关）
- [ ] 解决虎皮椒 "未知的APPID" 问题
- [ ] 测试完整支付流程
- [ ] 验证支付回调是否正常

### 功能优化
- [ ] 添加图片生成进度条
- [ ] 历史记录分页加载
- [ ] 邀请系统优化

### 用户体验
- [ ] 添加支付成功/失败提示
- [ ] 优化移动端体验
- [ ] 添加更多艺术风格

---

## 📞 联系与支持

**客服微信**: designai_support
**项目位置**: `C:\Users\Administrator\.gemini\antigravity\scratch\ai-design-saas`

---

## 📄 快速交接清单

### 代码库
- [x] 项目已完整归档
- [x] 环境变量已记录
- [x] 数据库结构已文档化
- [x] API接口已说明

### 生产环境
- [x] Vercel 项目已链接
- [x] Supabase 配置已记录
- [x] 域名配置正常

### 待处理
- [ ] 虎皮椒支付问题需要解决
- [ ] 建议定期备份数据库

---

## 🔧 开发者快速入门

### 首次设置
```bash
# 1. 克隆或进入项目目录
cd C:\Users\Administrator\.gemini\antigravity\scratch\ai-design-saas

# 2. 安装依赖（如果需要）
npm install

# 3. 配置环境变量
# 复制 .env.local 并填入正确的值

# 4. 启动开发服务器
npm run dev

# 5. 访问 http://localhost:3000
```

### 数据库操作
```sql
-- 查看所有表
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 检查用户积分
SELECT u.phone_number, u.invite_code, c.balance, c.daily_generations
FROM phone_users u
LEFT JOIN user_credits c ON u.id = c.user_id;

-- 检查订单
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
```

---

**文档版本**: v2.0
**最后更新**: 2025-12-31
**归档状态**: 完整
