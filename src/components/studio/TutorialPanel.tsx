"use client"

import { X, ChevronRight, Sparkles, Upload, Wand2, Download } from 'lucide-react'

interface TutorialPanelProps {
    isOpen: boolean
    onClose: () => void
}

const tutorialSteps = [
    {
        id: 1,
        icon: Upload,
        title: '上传图片',
        description: '点击上传区域选择你要处理的图片，支持 JPG、PNG、WEBP 格式，最大 10MB。',
        tips: ['选择清晰度较高的原图效果更好', '建议图片分辨率不低于 1024x1024']
    },
    {
        id: 2,
        icon: Wand2,
        title: '选择功能',
        description: '从左侧工具栏选择你需要的功能：智能换背景、AI 换模特、智能抠图等。',
        tips: ['不同功能消耗的积分不同', '鼠标悬停可查看功能说明']
    },
    {
        id: 3,
        icon: Sparkles,
        title: '添加提示词',
        description: '在右侧面板输入你想要的效果描述，提示词越详细，生成效果越好。',
        tips: ['可以参考下方的提示词示例', '支持中英文输入']
    },
    {
        id: 4,
        icon: Download,
        title: '生成并下载',
        description: '点击"立即生成"按钮，等待 AI 处理完成后，即可下载或继续生成。',
        tips: ['生成过程通常需要 10-30 秒', '可随时点击关闭按钮继续生成下一张']
    }
]

const features = [
    { name: '智能换背景', cost: 3, desc: '一键替换为专业场景背景' },
    { name: 'AI 换模特', cost: 5, desc: '人台换真人模特' },
    { name: '智能抠图', cost: 2, desc: '精确提取主体' },
    { name: '画质增强', cost: 2, desc: '提升清晰度到 4K' },
    { name: '智能消除', cost: 2, desc: '移除不需要的内容' },
    { name: '去水印', cost: 2, desc: '智能移除水印' }
]

const faqs = [
    {
        q: '如何获取积分？',
        a: '新用户注册赠送 15 积分。你可以通过充值购买积分，或邀请好友获得奖励积分。'
    },
    {
        q: '生成失败怎么办？',
        a: '请检查图片格式和大小是否符合要求，确保网络连接正常。如问题持续，请联系客服。'
    },
    {
        q: '生成的图片有保存期限吗？',
        a: '生成历史会保存 30 天，建议及时下载保存到本地。'
    },
    {
        q: '支持哪些图片格式？',
        a: '目前支持 JPG、PNG、WEBP 格式，单个文件不超过 10MB。'
    }
]

export function TutorialPanel({ isOpen, onClose }: TutorialPanelProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-[550px] max-w-full bg-[#0d0d14] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/20">
                                <Sparkles className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">使用教程</h2>
                                <p className="text-xs text-slate-500">新手指南 & 常见问题</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Quick Start */}
                    <section>
                        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                            快速开始
                        </h3>
                        <div className="space-y-4">
                            {tutorialSteps.map((step, index) => (
                                <div key={step.id} className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                                            <step.icon className="w-5 h-5 text-indigo-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-sm font-medium text-white">{step.title}</h4>
                                            {index < tutorialSteps.length - 1 && (
                                                <ChevronRight className="w-4 h-4 text-slate-600" />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400 mb-2">{step.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {step.tips.map((tip, i) => (
                                                <span key={i} className="text-xs px-2 py-1 rounded bg-white/5 text-slate-500">
                                                    💡 {tip}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Features & Pricing */}
                    <section>
                        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
                            功能与积分消耗
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {features.map((feature) => (
                                <div
                                    key={feature.name}
                                    className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-white">{feature.name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                                            {feature.cost} 积分
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FAQ */}
                    <section>
                        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-green-500 rounded-full"></span>
                            常见问题
                        </h3>
                        <div className="space-y-3">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg bg-white/5 border border-white/5"
                                >
                                    <h4 className="text-sm font-medium text-indigo-300 mb-2">
                                        Q: {faq.q}
                                    </h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        A: {faq.a}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Support */}
                    <section className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <h4 className="text-sm font-medium text-indigo-300 mb-2">需要帮助？</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            如果你在使用过程中遇到任何问题，欢迎通过以下方式联系我们：
                        </p>
                        <div className="mt-3 space-y-2 text-xs text-slate-400">
                            <p>📧 邮箱：support@designai.com</p>
                            <p>💬 微信：DesignAI_Support</p>
                            <p>🕐 工作时间：周一至周五 9:00-18:00</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
