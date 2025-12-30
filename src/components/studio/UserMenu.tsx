"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    History,
    Coins,
    BookOpen,
    CreditCard,
    Settings,
    Users,
    ChevronRight,
    X,
    LogOut
} from 'lucide-react'

interface MenuItem {
    id: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    description: string
    badge?: string
}

const menuItems: MenuItem[] = [
    {
        id: 'history',
        icon: History,
        label: '历史记录',
        description: '查看生成历史'
    },
    {
        id: 'credits',
        icon: Coins,
        label: '我的积分',
        description: '积分余额和明细'
    },
    {
        id: 'tutorial',
        icon: BookOpen,
        label: '使用教程',
        description: '新手使用指南'
    },
    {
        id: 'pricing',
        icon: CreditCard,
        label: '充值中心',
        description: '购买积分套餐'
    },
    {
        id: 'settings',
        icon: Settings,
        label: '个人设置',
        description: '账户和偏好设置'
    },
    {
        id: 'invite',
        icon: Users,
        label: '邀请好友',
        description: '邀请获得积分',
        badge: '奖励'
    }
]

interface UserMenuProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (itemId: string) => void
    onLogout?: () => void
    user?: any
    credits?: number
}

export function UserMenu({ isOpen, onClose, onSelect, onLogout, user, credits }: UserMenuProps) {
    const [inviteCode, setInviteCode] = useState<string>('')

    useEffect(() => {
        if (user) {
            // Load invite code
            loadInviteCode()
        }
    }, [user])

    const loadInviteCode = async () => {
        try {
            const supabase = createClient()
            const { data } = await supabase
                .from('phone_users')
                .select('invite_code')
                .eq('supabase_user_id', user.id)
                .single()

            if (data?.invite_code) {
                setInviteCode(data.invite_code)
            }
        } catch (error) {
            console.error('Failed to load invite code:', error)
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

            {/* Menu Panel */}
            <div className="absolute right-0 top-0 h-full w-80 bg-[#0d0d14] border-l border-white/10 shadow-2xl animate-in slide-in-from-right">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">功能菜单</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* User Info */}
                    {user && (
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {user.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                    {user.email?.split('@')[0] || '用户'}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {credits !== undefined && `${credits} 积分`}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Menu Items */}
                <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onSelect(item.id)
                                onClose()
                            }}
                            className="w-full p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 transition-colors">
                                    <item.icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                                            {item.label}
                                        </span>
                                        {item.badge && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                            </div>
                        </button>
                    ))}

                    {/* Invite Code Card */}
                    {inviteCode && (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-medium text-white">我的邀请码</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 px-3 py-2 bg-black/30 rounded-lg text-indigo-300 font-mono text-sm">
                                    {inviteCode}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(inviteCode)
                                        alert('邀请码已复制！')
                                    }}
                                    className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white text-sm font-medium transition-colors"
                                >
                                    复制
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                邀请好友注册，双方各得积分
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#0a0a0f]">
                    <button
                        onClick={async () => {
                            if (onLogout) {
                                await onLogout()
                            }
                            onClose()
                        }}
                        className="w-full p-3 rounded-xl border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 transition-all group flex items-center justify-center gap-2 text-red-400 hover:text-red-300"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">退出登录</span>
                    </button>
                    <p className="text-xs text-slate-600 text-center mt-3">
                        AI Design SaaS v1.0
                    </p>
                </div>
            </div>
        </div>
    )
}
