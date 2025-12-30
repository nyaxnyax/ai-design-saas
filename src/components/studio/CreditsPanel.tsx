"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Coins, X, Plus, Minus, Calendar, Loader2, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'

interface Transaction {
    id: string
    amount: number
    balance_after: number
    type: 'purchase' | 'usage' | 'reward' | 'referral' | 'signup_bonus'
    description: string
    created_at: string
}

interface CreditsPanelProps {
    isOpen: boolean
    onClose: () => void
    currentBalance?: number
}

const typeLabels = {
    purchase: { label: '购买积分', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    usage: { label: '使用消耗', color: 'text-red-400', bgColor: 'bg-red-500/20' },
    reward: { label: '活动奖励', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    referral: { label: '邀请奖励', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
    signup_bonus: { label: '注册奖励', color: 'text-purple-400', bgColor: 'bg-purple-500/20' }
}

export function CreditsPanel({ isOpen, onClose, currentBalance = 0 }: CreditsPanelProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [balance, setBalance] = useState(currentBalance)
    const supabase = createClient()

    useEffect(() => {
        if (isOpen) {
            loadTransactions()
        }
    }, [isOpen, currentBalance])

    const loadTransactions = async () => {
        try {
            setLoading(true)
            setBalance(currentBalance)

            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setLoading(false)
                return
            }

            const response = await fetch('/api/user/credits', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setTransactions(data.transactions || [])
                setBalance(data.balance || currentBalance)
            }
        } catch (error) {
            console.error('Failed to load transactions:', error)
        } finally {
            setLoading(false)
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
            <div className="absolute right-0 top-0 h-full w-[450px] max-w-full bg-[#0d0d14] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                                <Coins className="w-5 h-5 text-amber-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">我的积分</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Balance Card */}
                    <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                        <p className="text-sm text-slate-400 mb-1">当前余额</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white">{balance}</span>
                            <span className="text-slate-400">积分</span>
                        </div>
                        <Link href="/pricing" onClick={onClose}>
                            <button className="mt-4 w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2">
                                充值积分
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Transactions */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-sm font-medium text-slate-400 mb-4">交易记录</h3>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p>加载中...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <Coins className="w-16 h-16 mb-4 opacity-20" />
                            <p>暂无交易记录</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((tx) => {
                                const typeConfig = typeLabels[tx.type] || typeLabels.usage
                                const isPositive = tx.amount > 0

                                return (
                                    <div
                                        key={tx.id}
                                        className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                                                    {isPositive ? (
                                                        <Plus className={`w-4 h-4 ${typeConfig.color}`} />
                                                    ) : (
                                                        <Minus className={`w-4 h-4 ${typeConfig.color}`} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{tx.description}</p>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDistanceToNow(new Date(tx.created_at), {
                                                            addSuffix: true,
                                                            locale: zhCN
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                    {isPositive ? '+' : ''}{tx.amount}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    余额 {tx.balance_after}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeConfig.bgColor} ${typeConfig.color}`}>
                                                {typeConfig.label}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
