"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, X, Copy, Check, Loader2, Gift, Share2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Referral {
    id: string
    referred_phone: string
    status: 'pending' | 'completed'
    reward_amount: number
    created_at: string
}

interface InviteStats {
    totalInvites: number
    completedSignups: number
    pendingRewards: number
}

interface InvitePanelProps {
    isOpen: boolean
    onClose: () => void
}

export function InvitePanel({ isOpen, onClose }: InvitePanelProps) {
    const [inviteCode, setInviteCode] = useState<string>('')
    const [stats, setStats] = useState<InviteStats>({
        totalInvites: 0,
        completedSignups: 0,
        pendingRewards: 0
    })
    const [referrals, setReferrals] = useState<Referral[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (isOpen) {
            loadInviteData()
        }
    }, [isOpen])

    const loadInviteData = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setLoading(false)
                return
            }

            const response = await fetch('/api/user/referrals', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setInviteCode(data.inviteCode || '')
                setStats(data.stats)
                setReferrals(data.referrals || [])
            }
        } catch (error) {
            console.error('Failed to load invite data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCopyInviteCode = () => {
        navigator.clipboard.writeText(inviteCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShare = async () => {
        const shareText = `🎁 邀请你使用 AI Design SaaS！\n\n我的邀请码：${inviteCode}\n\n注册即送 15 积分，我也获得奖励！\nhttps://yourdomain.com?invite=${inviteCode}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'AI Design SaaS - 邀请好友',
                    text: shareText
                })
            } catch (error) {
                console.log('Share canceled')
            }
        } else {
            navigator.clipboard.writeText(shareText)
            alert('邀请链接已复制到剪贴板！')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-[500px] max-w-full bg-[#0d0d14] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20">
                                <Users className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">邀请好友</h2>
                                <p className="text-xs text-slate-500">邀请获得积分奖励</p>
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
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p>加载中...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Invite Code Card */}
                            <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <Gift className="w-5 h-5 text-indigo-400" />
                                    <span className="text-sm font-medium text-white">我的邀请码</span>
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <code className="flex-1 px-4 py-3 bg-black/30 rounded-lg text-indigo-300 font-mono text-lg text-center">
                                        {inviteCode}
                                    </code>
                                    <button
                                        onClick={handleCopyInviteCode}
                                        className="p-3 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white transition-colors"
                                    >
                                        {copied ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <Copy className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                <button
                                    onClick={handleShare}
                                    className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                                >
                                    <Share2 className="w-4 h-4" />
                                    分享给好友
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                                    <p className="text-2xl font-bold text-white">{stats.totalInvites}</p>
                                    <p className="text-xs text-slate-500 mt-1">总邀请</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                                    <p className="text-2xl font-bold text-green-400">{stats.completedSignups}</p>
                                    <p className="text-xs text-slate-500 mt-1">成功注册</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                                    <p className="text-2xl font-bold text-amber-400">{stats.pendingRewards}</p>
                                    <p className="text-xs text-slate-500 mt-1">待发放</p>
                                </div>
                            </div>

                            {/* Rewards Info */}
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                                    <Gift className="w-4 h-4" />
                                    奖励规则
                                </h3>
                                <ul className="space-y-2 text-xs text-slate-400">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400">•</span>
                                        <span>好友使用你的邀请码注册，双方各获得 <span className="text-white font-medium">5 积分</span></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400">•</span>
                                        <span>好友完成首次充值后，你额外获得 <span className="text-white font-medium">10 积分</span></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-400">•</span>
                                        <span>邀请不设上限，邀请越多奖励越多</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Referrals List */}
                            {referrals.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-white mb-3">邀请记录</h3>
                                    <div className="space-y-2">
                                        {referrals.map((referral) => (
                                            <div
                                                key={referral.id}
                                                className="p-3 rounded-xl bg-white/5 border border-white/5"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                                            <Users className="w-4 h-4 text-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-white">
                                                                {referral.referred_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                                                            </p>
                                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                {formatDistanceToNow(new Date(referral.created_at), {
                                                                    addSuffix: true,
                                                                    locale: zhCN
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                                            referral.status === 'completed'
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : 'bg-amber-500/20 text-amber-400'
                                                        }`}>
                                                            {referral.status === 'completed' ? '已完成' : '待注册'}
                                                        </span>
                                                        {referral.status === 'completed' && (
                                                            <p className="text-xs text-green-400 mt-1">+{referral.reward_amount} 积分</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
