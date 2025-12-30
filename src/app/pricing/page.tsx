"use client"

import Link from 'next/link'
import { Check, Sparkles, Zap, Crown, Gift, Star, ArrowRight, Image as ImageIcon, ScanFace } from 'lucide-react'
import { useState } from 'react'

// 积分包数据
const creditPacks = [
    {
        id: 'starter',
        name: '入门套餐',
        credits: 100,
        price: 9.9,
        originalPrice: 19.9,
        perCredit: 0.1,
        badge: null,
        yields: {
            standard: 33, // 3 credits per
            pro: 10       // 10 credits per
        }
    },
    {
        id: 'popular',
        name: '热门套餐',
        credits: 550,
        price: 49,
        originalPrice: 99,
        perCredit: 0.09,
        badge: '推荐',
        badgeColor: 'from-orange-500 to-red-500',
        description: '含 50 积分赠送',
        popular: true,
        yields: {
            standard: 183,
            pro: 55
        }
    },
    {
        id: 'value',
        name: '超值套餐',
        credits: 1200,
        price: 99,
        originalPrice: 199,
        perCredit: 0.08,
        badge: '超值',
        badgeColor: 'from-blue-500 to-indigo-500',
        description: '含 200 积分赠送',
        yields: {
            standard: 400,
            pro: 120
        }
    },
    {
        id: 'expert', // Renamed from 'pro' to avoid collision with subscription 'pro'
        name: '尊享套餐',
        credits: 3300,
        price: 289,
        originalPrice: 499,
        perCredit: 0.08,
        badge: '大户首选',
        badgeColor: 'from-purple-500 to-pink-500',
        description: '含 300 积分赠送',
        yields: {
            standard: 1100,
            pro: 330
        }
    },
]

// 订阅方案数据
const subscriptions = [
    {
        id: 'basic',
        name: '基础版',
        price: 9.9,
        yearlyPrice: 99, // 17% off approx
        period: '月',
        credits: 100,
        perCredit: 0.1,
        features: [
            '每月 100 积分',
            '积分消耗 7 折优惠', // Marketing hook
            '专属会员群',
            '用不完可累计至下月',
        ],
        badge: '入门',
        yields: {
            standard: 33,
            pro: 10
        }
    },
    {
        id: 'pro',
        name: '专业版',
        price: 49,
        yearlyPrice: 499,
        period: '月',
        credits: 600,
        bonus: 0,
        perCredit: 0.08,
        features: [
            '每月 600 积分',
            '解锁 4K 超清生成',
            '积分消耗 6 折优惠',
            '优先生成队列',
        ],
        popular: true,
        badge: '最受欢迎',
        yields: {
            standard: 200,
            pro: 60
        }
    },
    {
        id: 'enterprise',
        name: '企业版',
        price: 199,
        yearlyPrice: 1999,
        period: '月',
        credits: 3000,
        bonus: 0,
        perCredit: 0.06,
        features: [
            '每月 3000 积分',
            'API 访问权限',
            '积分消耗 5 折优惠',
            '1对1 专属客服',
            '商用授权',
        ],
        badge: '企业',
        yields: {
            standard: 1000,
            pro: 300
        }
    },
]

export default function PricingPage() {
    const [activeTab, setActiveTab] = useState<'credits' | 'subscription'>('credits') // Default to credits as it's more direct
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [loading, setLoading] = useState<string | null>(null)

    const handleBuy = async (planId: string, amount: number, planName: string) => {
        // Adjust price if yearly
        let finalAmount = amount
        let finalName = planName

        if (activeTab === 'subscription' && billingCycle === 'yearly') {
            const sub = subscriptions.find(s => s.id === planId)
            if (sub) {
                finalAmount = sub.yearlyPrice
                finalName = `${planName} (年付)`
            }
        }

        try {
            setLoading(planId)
            // Call API
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, amount: finalAmount, planName: finalName })
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 401) {
                    // Ideally check user session before showing button, but simplified here
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
                        <div className="card p-1 border-transparent bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-indigo-500/30 relative">
                            <div className="bg-[#0f0f16] rounded-[20px] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                                {/* Left: Content */}
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
                                        <Gift className="w-10 h-10 text-white animate-bounce-slow" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-bold text-white">新人见面礼</h3>
                                            <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold border border-pink-500/30">
                                                限时 1 折
                                            </span>
                                        </div>
                                        <div className="text-slate-300 mb-1">
                                            <span className="text-4xl font-bold text-white">¥4.9</span>
                                            <span className="text-slate-500 line-through text-lg ml-2">¥49.0</span>
                                            <span className="mx-2 text-slate-600">|</span>
                                            <span className="text-green-400 font-medium">包含 50 积分</span>
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            约可生成 <b className="text-white">16</b> 张标准图或 <b className="text-white">5</b> 张 4K 超清图
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Action */}
                                <div className="shrink-0 w-full md:w-auto">
                                    <button
                                        onClick={() => handleBuy('new_user_gift', 4.9, '新人见面礼')}
                                        className="btn-primary bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 w-full md:w-auto px-8 py-4 text-lg shadow-xl shadow-purple-500/20"
                                    >
                                        立即领取 <ArrowRight className="w-5 h-5 ml-1 inline-block" />
                                    </button>
                                    <p className="text-center text-xs text-slate-500 mt-2">每人限购 1 次</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Credits Grid */}
                {activeTab === 'credits' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {creditPacks.map((pack) => (
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
                                            <ImageIcon className="w-3.5 h-3.5" /> 标准图 (1K)
                                        </span>
                                        <span className="text-white font-medium">≈ {pack.yields.standard} 张</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 flex items-center gap-2">
                                            <ScanFace className="w-3.5 h-3.5" /> 超清图 (4K)
                                        </span>
                                        <span className="text-white font-medium">≈ {pack.yields.pro} 张</span>
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {subscriptions.map((sub) => (
                                <div
                                    key={sub.id}
                                    className={`card p-8 relative overflow-hidden transition-all duration-300 ${sub.popular ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/20 scale-105' : ''
                                        }`}
                                >
                                    {/* Badge */}
                                    {sub.badge && (
                                        <div className={`absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-bl ${sub.popular ? 'from-purple-600 to-indigo-600' : 'from-slate-700 to-slate-800'} text-xs font-bold text-white rounded-bl-xl`}>
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
                                                    <ImageIcon className="w-3.5 h-3.5" /> 标准图 (1K)
                                                </span>
                                                <span className="text-white font-medium">≈ {sub.yields.standard} 张</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400 flex items-center gap-2">
                                                    <ScanFace className="w-3.5 h-3.5" /> 超清图 (4K)
                                                </span>
                                                <span className="text-white font-medium">≈ {sub.yields.pro} 张</span>
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
                                            onClick={() => handleBuy(sub.id, sub.price, sub.name)}
                                            disabled={loading === sub.id}
                                            className={`w-full py-3 rounded-xl font-medium transition-all ${sub.popular
                                                ? 'btn-primary'
                                                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                                } ${loading === sub.id ? 'opacity-70' : ''}`}>
                                            {loading === sub.id ? '处理中...' : '订阅'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

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
                            <p className="text-sm text-slate-400 leading-relaxed">除"基础版"及免费体验外，其他所有付费套餐生成的图片均默认授予<span className="text-white font-medium">商业使用授权</span>。</p>
                        </div>
                        <div className="card p-6 bg-transparent border-white/5 hover:border-white/10">
                            <h3 className="font-semibold text-white mb-2">标准图与超清图的区别？</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">标准图 (1K) 适合网页展示、社媒推广；超清图 (4K) 适合打印印刷、大幅广告，细节更丰富。</p>
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="mt-20 text-center pb-8">
                    <p className="text-slate-500 text-sm">
                        支付遇到问题？请联系客服 (微信: designai_support)
                    </p>
                </div>
            </div>
        </main>
    )
}
