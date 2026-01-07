"use client"

import Link from 'next/link'
import { Check, Sparkles, Zap, Crown, Gift, Star, ArrowRight, Image as ImageIcon } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// 积分包数据
const CREDIT_PACKS = [
    {
        id: 'gift',
        name: '新人见面礼',
        credits: 30,
        price: 2.9,
        originalPrice: 19.9,
        perCredit: 0.09,
        badge: '限购 1 次',
        badgeColor: 'from-pink-500 to-rose-500',
        description: '限时 1.5 折',
        imageCount: 10,
        isGift: true
    },
    {
        id: 'starter',
        name: '入门包',
        credits: 100,
        price: 19.9,
        originalPrice: 29.9,
        perCredit: 0.19,
        badge: '热销',
        imageCount: 33
    },
    {
        id: 'popular',
        name: '超值套餐',
        credits: 650,
        price: 99,
        originalPrice: 159,
        perCredit: 0.15,
        badge: '送 50 积分',
        badgeColor: 'from-orange-500 to-red-500',
        description: '含 50 积分赠送',
        popular: true,
        imageCount: 216
    },
    {
        id: 'expert',
        name: '尊享套餐',
        credits: 4000,
        price: 499,
        originalPrice: 899,
        perCredit: 0.12,
        badge: '送 500 积分',
        badgeColor: 'from-purple-500 to-indigo-500',
        description: '含 500 积分赠送',
        imageCount: 1333
    },
];

// 订阅方案数据
const SUBSCRIPTION_PLANS = [
    {
        id: 'lite',
        name: '创作版',
        price: 29.9,
        yearlyPrice: 289,
        credits: 225,
        imageCount: 75,
        features: [
            '每月 225 积分 (年付 2700)',
            '全站 4K 超清生成',
            '特殊板块定制权限',
            '专属会员交流群',
        ],
        badge: '入门',
    },
    {
        id: 'pro',
        name: '专业版',
        price: 99,
        yearlyPrice: 890,
        credits: 750,
        imageCount: 250,
        features: [
            '每月 750 积分 (年付 9000)',
            '优先生成通道 (免排队)',
            '特殊板块定制权限',
            '全站 4K 超清生成',
        ],
        popular: true,
        badge: '80% 用户的选择',
    },
    {
        id: 'agency',
        name: '商业版',
        price: 299,
        yearlyPrice: 2890,
        credits: 2250,
        imageCount: 750,
        features: [
            '每月 2250 积分 (年付 27000)',
            '批量处理模式 (生产力)',
            '特殊板块定制权限',
            '1对1 专属技术支持',
        ],
        badge: '专业级',
    },
];

export default function PricingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#05050A] flex items-center justify-center text-white">加载中...</div>}>
            <PricingContent />
        </Suspense>
    )
}

function PricingContent() {
    const [activeTab, setActiveTab] = useState<'credits' | 'subscription'>('credits')
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [loading, setLoading] = useState<string | null>(null)
    const searchParams = useSearchParams()

    // 自动支付逻辑：处理从 Studio 耗尽拦截弹窗跳转过来的请求
    useEffect(() => {
        const planId = searchParams.get('plan')
        const amount = searchParams.get('amount')
        const name = searchParams.get('name')

        if (planId && amount && name) {
            handleBuy(planId, parseFloat(amount), name)
        }
    }, [])

    const handleBuy = async (planId: string, amount: number, planName: string) => {
        let finalAmount = amount
        let finalName = planName

        if (activeTab === 'subscription' && billingCycle === 'yearly') {
            const sub = SUBSCRIPTION_PLANS.find(s => s.id === planId)
            if (sub) {
                finalAmount = sub.yearlyPrice
                finalName = `${planName} (年付)`
            }
        }

        try {
            setLoading(planId)
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, amount: finalAmount, planName: finalName })
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 401) {
                    alert('请先登录后购买')
                    return
                }
                throw new Error(data.error || 'Payment failed')
            }

            if (data.url) {
                window.location.href = data.url
            }

        } catch (error) {
            console.error('Buy Error:', error)
            alert(error instanceof Error ? error.message : '支付初始化失败')
        } finally {
            setLoading(null)
        }
    }

    return (
        <main className="min-h-screen pt-8 pb-24 px-4 bg-[#05050A]">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="text-center mb-16 pt-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-white">简单透明的</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400"> 价格方案</span>
                    </h1>

                    <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-8">
                        无隐藏费用，按需选择。新人注册即享优惠。
                    </p>

                    {/* Switcher */}
                    <div className="inline-flex p-1 rounded-2xl bg-white/5 border border-white/10 mx-auto">
                        <button
                            onClick={() => setActiveTab('credits')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'credits'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            积分充值
                        </button>
                        <button
                            onClick={() => setActiveTab('subscription')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'subscription'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            会员订阅
                        </button>
                    </div>
                </div>

                {/* ✨ New User Gift Pack - Special Section */}
                {activeTab === 'credits' && (
                    <div className="mb-16 relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 blur-3xl opacity-50 group-hover:opacity-75 transition-opacity" />
                        <div className="card p-1 border-transparent bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-indigo-500/30 relative overflow-hidden">
                            <div className="bg-[#0f0f16] rounded-[20px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                                {/* Left: Content */}
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
                                        <Gift className="w-10 h-10 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-bold text-white">新人见面礼</h3>
                                            <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold border border-pink-500/30">
                                                限时 1.5 折
                                            </span>
                                        </div>
                                        <div className="text-slate-300 mb-1">
                                            <span className="text-4xl font-bold text-white">¥2.9</span>
                                            <span className="text-slate-500 line-through text-lg ml-2">¥19.9</span>
                                            <span className="mx-2 text-slate-600">|</span>
                                            <span className="text-green-400 font-medium">包含 30 积分</span>
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            约可生成 <b className="text-white">10</b> 张超清图片
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Action */}
                                <div className="shrink-0 w-full md:w-auto">
                                    <button
                                        onClick={() => handleBuy('gift', 2.9, '新人见面礼')}
                                        disabled={loading === 'gift'}
                                        className="btn-primary bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 w-full md:w-auto px-8 py-4 text-lg shadow-xl shadow-purple-500/20"
                                    >
                                        {loading === 'gift' ? '处理中...' : '立即领取'} <ArrowRight className="w-5 h-5 ml-1 inline-block" />
                                    </button>
                                    <p className="text-center text-xs text-slate-500 mt-2">每人限购 1 次</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Credits Grid */}
                {activeTab === 'credits' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {CREDIT_PACKS.filter(p => !p.isGift).map((pack) => (
                            <div
                                key={pack.id}
                                className={`card p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 ${pack.popular ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20 bg-indigo-500/5' : 'hover:border-white/20'
                                    }`}
                            >
                                {/* Badge */}
                                {pack.badge && (
                                    <div className={`absolute top-0 right-0 px-3 py-1 bg-gradient-to-bl ${pack.badgeColor || 'from-indigo-500 to-purple-500'} text-xs font-bold text-white rounded-bl-xl`}>
                                        {pack.badge}
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-slate-200 mb-2">{pack.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-4xl font-bold text-white">{pack.credits}</span>
                                        <span className="text-sm text-slate-400">积分</span>
                                    </div>
                                    {pack.description && (
                                        <p className="text-xs text-indigo-300 font-medium bg-indigo-500/10 inline-block px-2 py-0.5 rounded">
                                            {pack.description}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3 mb-8 bg-white/5 p-4 rounded-lg">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 flex items-center gap-2">
                                            <ImageIcon className="w-3.5 h-3.5" /> 可生成图片
                                        </span>
                                        <span className="text-white font-medium">≈ {pack.imageCount} 张</span>
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-3xl font-bold text-white">¥{pack.price}</span>
                                        <span className="text-sm text-slate-500 line-through">¥{pack.originalPrice}</span>
                                    </div>
                                    <button
                                        onClick={() => handleBuy(pack.id, pack.price, pack.name)}
                                        disabled={loading === pack.id}
                                        className={`w-full py-3 rounded-xl font-medium transition-all ${pack.popular
                                            ? 'btn-primary'
                                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                            } ${loading === pack.id ? 'opacity-70' : ''}`}>
                                        {loading === pack.id ? '处理中...' : '立即充值'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Subscription Tab */}
                {activeTab === 'subscription' && (
                    <>
                        {/* Billing Cycle Toggle */}
                        <div className="flex justify-center mb-10">
                            <div className="bg-white/5 p-1 rounded-xl inline-flex border border-white/10">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    按月付费
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    按年付费
                                    <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">省17%</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                            {SUBSCRIPTION_PLANS.map((sub) => (
                                <div
                                    key={sub.id}
                                    className={`card p-8 relative overflow-hidden transition-all duration-300 ${sub.popular
                                        ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105 z-10 bg-indigo-500/5'
                                        : 'opacity-90 hover:opacity-100'
                                        }`}
                                >
                                    {/* 热门标签 */}
                                    {sub.badge && (
                                        <div className={`absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-bl ${sub.popular ? 'from-indigo-500 to-purple-600' : 'from-slate-700 to-slate-800'} text-[10px] font-bold text-white rounded-bl-xl uppercase tracking-wider`}>
                                            {sub.badge}
                                        </div>
                                    )}

                                    <div className="relative">
                                        <h3 className="text-xl font-bold text-white mb-2">{sub.name}</h3>

                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-bold text-white">
                                                    ¥{billingCycle === 'yearly' ? sub.yearlyPrice : sub.price}
                                                </span>
                                                <span className="text-slate-400">/{billingCycle === 'yearly' ? '年' : '月'}</span>
                                            </div>
                                            {billingCycle === 'yearly' && (
                                                <p className="text-xs text-green-400 mt-1 font-medium">
                                                    平均仅需 ¥{Math.round(sub.yearlyPrice / 12)}/月
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-3 mb-8 bg-white/5 p-4 rounded-lg border border-white/5">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400 flex items-center gap-2">
                                                    <ImageIcon className="w-3.5 h-3.5" /> 可生成图片
                                                </span>
                                                <span className="text-white font-medium">≈ {sub.imageCount} 张</span>
                                            </div>
                                        </div>

                                        <ul className="space-y-4 mb-8">
                                            {sub.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                                                    <Check className={`w-5 h-5 shrink-0 ${sub.popular ? 'text-indigo-400' : 'text-slate-500'}`} />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => handleBuy(sub.id, billingCycle === 'yearly' ? sub.yearlyPrice : sub.price, sub.name)}
                                            disabled={loading === sub.id}
                                            className={`w-full py-3 rounded-xl font-medium transition-all ${sub.popular
                                                ? 'btn-primary'
                                                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                                } ${loading === sub.id ? 'opacity-70' : ''}`}>
                                            {loading === sub.id ? '处理中...' : '立即订阅'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Viral Referral Section */}
                <div className="mt-24 relative overflow-hidden rounded-[32px] border border-indigo-500/20 bg-indigo-500/5 p-8 md:p-12">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full" />
                    <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-4">
                                <Sparkles className="w-3 h-3" /> 传播计划
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">邀请好友，免费得积分</h2>
                            <p className="text-slate-400 max-w-lg">
                                每邀请一名好友注册并完成首次生成，您和好友都将额外获得 <span className="text-white font-bold">15 积分 (约 5 张图)</span>，奖励无上限。
                            </p>
                        </div>
                        <div className="shrink-0">
                            <Link href="/studio" className="btn-primary px-8 py-4 flex items-center gap-2">
                                去邀请好友 <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-24 border-t border-white/5 pt-16">
                    <h2 className="text-2xl font-bold text-white text-center mb-12">常见问题</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <div className="card p-6 bg-transparent border-white/5 hover:border-white/10">
                            <h3 className="font-semibold text-white mb-2">积分会过期吗？</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">按次购买的积分包<span className="text-white font-medium">永不过期</span>。订阅会员的每月额度在有效期内使用，支持累计至下个月。</p>
                        </div>
                        <div className="card p-6 bg-transparent border-white/5 hover:border-white/10">
                            <h3 className="font-semibold text-white mb-2">生成失败会扣积分吗？</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">系统会自动检测生成结果。如果因系统故障导致生成失败，积分将<span className="text-white font-medium">自动返还</span>。</p>
                        </div>
                        <div className="card p-6 bg-transparent border-white/5 hover:border-white/10">
                            <h3 className="font-semibold text-white mb-2">商用版权问题？</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">除“创作版”及免费体验外，其他所有付费套餐生成的图片均默认授予<span className="text-white font-medium">商业使用授权</span>。</p>
                        </div>
                        <div className="card p-6 bg-transparent border-white/5 hover:border-white/10">
                            <h3 className="font-semibold text-white mb-2">图片质量有区别吗？</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">所有套餐用户均享受相同的高清生成质量。购买更高级别的套餐将获得更快的生成速度和专属功能。</p>
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="mt-20 text-center pb-8 border-t border-white/5 pt-12">
                    <p className="text-slate-500 text-sm">
                        支付遇到问题？请联系客服 (微信: pikadesign_support)
                    </p>
                </div>
            </div>
        </main>
    )
}
