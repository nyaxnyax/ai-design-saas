"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, X, Lock, User, Loader2, Check, AlertCircle } from 'lucide-react'

interface SettingsPanelProps {
    isOpen: boolean
    onClose: () => void
    user?: any
}

export function SettingsPanel({ isOpen, onClose, user }: SettingsPanelProps) {
    const [phone, setPhone] = useState<string>('')
    const [inviteCode, setInviteCode] = useState<string>('')
    const [createdAt, setCreatedAt] = useState<string>('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string>('')
    const [success, setSuccess] = useState(false)
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
    const supabase = createClient()

    useEffect(() => {
        if (isOpen && user) {
            loadSettings()
        }
    }, [isOpen, user])

    const loadSettings = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) return

            const response = await fetch('/api/user/settings', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setPhone(data.phone || '')
                setInviteCode(data.inviteCode || '')
                setCreatedAt(data.createdAt || '')
            }
        } catch (error) {
            console.error('Failed to load settings:', error)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        // Validation
        if (newPassword.length < 6) {
            setError('新密码至少需要6位')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('两次密码输入不一致')
            return
        }

        if (currentPassword === newPassword) {
            setError('新密码不能与当前密码相同')
            return
        }

        setLoading(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setError('请先登录')
                setLoading(false)
                return
            }

            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess(true)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
                setTimeout(() => {
                    onClose()
                }, 2000)
            } else {
                setError(data.error || '密码修改失败')
            }
        } catch (error) {
            console.error('Password change error:', error)
            setError('密码修改失败，请重试')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
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
                            <div className="p-2 rounded-lg bg-slate-500/20">
                                <Settings className="w-5 h-5 text-slate-400" />
                            </div>
                            <h2 className="text-lg font-bold text-white">个人设置</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-6 p-1 bg-white/5 rounded-lg">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === 'profile'
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            基本信息
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === 'security'
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            安全设置
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'profile' ? (
                        <div className="space-y-6">
                            {/* Profile Card */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{user?.email?.split('@')[0] || '用户'}</p>
                                        <p className="text-sm text-slate-500">{user?.email || ''}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">
                                            手机号
                                        </label>
                                        <div className="px-4 py-2.5 rounded-lg bg-black/30 border border-white/5 text-slate-400">
                                            {phone || '未设置'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">
                                            邀请码
                                        </label>
                                        <div className="px-4 py-2.5 rounded-lg bg-black/30 border border-white/5 text-indigo-400 font-mono">
                                            {inviteCode || '未设置'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">
                                            注册时间
                                        </label>
                                        <div className="px-4 py-2.5 rounded-lg bg-black/30 border border-white/5 text-slate-400">
                                            {createdAt ? formatDate(createdAt) : '未知'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Cards */}
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <p className="text-sm text-blue-300">
                                    💡 如需修改手机号或邮箱，请联系客服
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Password Change Form */}
                            <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-2 mb-6">
                                    <Lock className="w-5 h-5 text-slate-400" />
                                    <h3 className="text-lg font-medium text-white">修改密码</h3>
                                </div>

                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="text-sm text-slate-400 mb-2 block">
                                            当前密码
                                        </label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                            placeholder="请输入当前密码"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-slate-400 mb-2 block">
                                            新密码
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                            placeholder="至少6位新密码"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-slate-400 mb-2 block">
                                            确认新密码
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg bg-black/30 border border-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                            placeholder="再次输入新密码"
                                            required
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-red-400">{error}</p>
                                        </div>
                                    )}

                                    {/* Success Message */}
                                    {success && (
                                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-400" />
                                            <p className="text-sm text-green-400">密码修改成功！</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                处理中...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-4 h-4" />
                                                修改密码
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Security Tips */}
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <h4 className="text-sm font-medium text-amber-400 mb-2">安全提示</h4>
                                <ul className="space-y-1 text-xs text-slate-400">
                                    <li>• 建议使用字母、数字和符号的组合</li>
                                    <li>• 不要使用与其他网站相同的密码</li>
                                    <li>• 定期修改密码以保护账户安全</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
