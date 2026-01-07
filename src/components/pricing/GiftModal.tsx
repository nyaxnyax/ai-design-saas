"use client"

import { useState, useEffect } from 'react'
import { Gift, X, ArrowRight, Zap, Sparkles } from 'lucide-react'

interface GiftModalProps {
    isOpen: boolean
    onClose: () => void
    onBuy: (planId: string, amount: number, name: string) => void
}

export default function GiftModal({ isOpen, onClose, onBuy }: GiftModalProps) {
    const [timeLeft, setTimeLeft] = useState(600) // 10 minutes

    useEffect(() => {
        if (!isOpen) return
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(timer)
    }, [isOpen])

    if (!isOpen) return null

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[#0f0f16] border border-pink-500/30 rounded-[32px] overflow-hidden shadow-2xl shadow-pink-500/10">
                {/* Glow Background */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-pink-500/20 blur-[80px]" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 blur-[80px]" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 text-center relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-pink-500/20">
                        <Gift className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">您的灵感不该止步</h2>
                    <p className="text-slate-400 mb-8">
                        检测到余额不足。新人特别福利，仅限本窗口关闭前领取。
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-slate-400">新人特惠见面礼</span>
                            <span className="flex items-center gap-1 text-pink-400 text-xs font-bold bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                                <Zap className="w-3 h-3" /> 限时 1.5 折
                            </span>
                        </div>
                        <div className="flex items-baseline justify-center gap-3 mb-2">
                            <span className="text-5xl font-bold text-white">¥2.9</span>
                            <span className="text-xl text-slate-500 line-through font-medium">¥19.9</span>
                        </div>
                        <div className="text-green-400 text-sm font-medium flex items-center justify-center gap-1">
                            <Sparkles className="w-4 h-4" /> 立即获得 30 积分奖励
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => onBuy('gift', 2.9, '新人见面礼')}
                            className="w-full btn-primary bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 py-4 text-lg font-bold shadow-xl shadow-pink-500/20 group"
                        >
                            立即领取特惠 <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1 inline-block" />
                        </button>

                        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                            <span>优惠倒计时:</span>
                            <span className="text-pink-400 font-mono font-bold tracking-wider">{formatTime(timeLeft)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
