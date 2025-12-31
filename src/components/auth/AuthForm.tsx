"use client"

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { Lock, Loader2, Smartphone, MessageSquareCode, KeyRound, Gift } from 'lucide-react'

// 手机号正则 (中国大陆)
const PHONE_REGEX = /^1[3-9]\d{9}$/

// 认证模式：登录 | 注册
type AuthMode = 'login' | 'register'

export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
    const [mode, setMode] = useState<AuthMode>('login')

    // Form States
    const [phone, setPhone] = useState('')
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [inviteCode, setInviteCode] = useState('')

    // UX States
    const [isLoading, setIsLoading] = useState(false)
    const [isSendingCode, setIsSendingCode] = useState(false)
    const [isRepairing, setIsRepairing] = useState(false)
    const [countdown, setCountdown] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [errorCode, setErrorCode] = useState<string | null>(null)

    const supabase = createClient()

    // Countdown Timer Effect
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    // Send Verification Code (for registration only)
    const handleSendCode = async () => {
        setError(null)
        if (!phone) {
            setError('请输入手机号')
            return
        }
        if (!PHONE_REGEX.test(phone)) {
            setError('请输入有效的 11 位手机号码')
            return
        }

        setIsSendingCode(true)
        try {
            const res = await fetch('/api/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || '发送失败')
            }

            setMessage('验证码已发送！')
            setCountdown(60)
        } catch (err: unknown) {
            console.error('Send OTP Error:', err)
            setError(err instanceof Error ? err.message : '发送失败')
        } finally {
            setIsSendingCode(false)
        }
    }

    // Repair account function
    const handleRepairAccount = async () => {
        if (!phone) {
            setError('请输入手机号')
            return
        }

        setIsRepairing(true)
        setError(null)
        try {
            const res = await fetch('/api/auth/repair-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || '修复失败')
            }

            setMessage(data.message || '账号修复成功，请重新登录')
            setErrorCode(null)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '修复失败')
        } finally {
            setIsRepairing(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setMessage(null)

        try {
            if (mode === 'register') {
                // 注册流程：验证码 + 密码
                if (!phone || !code || !password) {
                    setError('请填写完整信息')
                    setIsLoading(false)
                    return
                }

                if (password.length < 6) {
                    setError('密码至少6位')
                    setIsLoading(false)
                    return
                }

                if (password !== confirmPassword) {
                    setError('两次密码不一致')
                    setIsLoading(false)
                    return
                }

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, code, password, inviteCode })
                })

                const data = await res.json()
                if (!res.ok) throw new Error(data.error || '注册失败')

                // Hydrate Client Session
                if (data.session) {
                    const { error: sessionError } = await supabase.auth.setSession(data.session)
                    if (sessionError) throw sessionError
                    onSuccess?.()
                } else {
                    throw new Error('未获取到会话信息')
                }

            } else if (mode === 'login') {
                // 登录流程：手机号 + 密码
                if (!phone || !password) {
                    setError('请填写手机号和密码')
                    setIsLoading(false)
                    return
                }

                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, password })
                })

                const data = await res.json()
                if (!res.ok) {
                    // Check if this is a data inconsistency error
                    if (data.code === 'DATA_INCONSISTENCY') {
                        setErrorCode('DATA_INCONSISTENCY')
                    }
                    throw new Error(data.error || '登录失败')
                }

                // Show message if auto-fixed
                if (data.message) {
                    setMessage(data.message)
                }

                // Hydrate Client Session
                if (data.session) {
                    const { error: sessionError } = await supabase.auth.setSession(data.session)
                    if (sessionError) throw sessionError
                    // Wait for auth state to propagate then reload
                    await new Promise(resolve => setTimeout(resolve, 500))
                    window.location.reload()
                } else {
                    throw new Error('未获取到会话信息')
                }
            }
        } catch (err: unknown) {
            console.error('Auth Error:', err)
            setError(err instanceof Error ? err.message : '认证失败')
        } finally {
            setIsLoading(false)
        }
    }

    // 输入框样式
    const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 transition-all"

    return (
        <div className="w-full">
            {/* 标签页切换 */}
            <div className="flex mb-8 bg-white/5 rounded-xl p-1 border border-white/10">
                <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); setMessage(null); setErrorCode(null); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'login'
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                        }`}
                >
                    登录
                </button>
                <button
                    type="button"
                    onClick={() => { setMode('register'); setError(null); setMessage(null); setErrorCode(null); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'register'
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                        }`}
                >
                    注册
                </button>
            </div>

            {/* 标题 */}
            <h2 className="text-2xl font-bold text-center text-white mb-2">
                {mode === 'login' ? '欢迎回来' : '创建账号'}
            </h2>
            <p className="text-sm text-slate-400 text-center mb-6">
                {mode === 'login' ? '登录后继续使用所有功能' : '注册即可开始使用'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 手机号输入 */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <Smartphone className="w-4 h-4 text-indigo-400" />
                        手机号
                    </label>
                    <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                            +86
                        </div>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value); setErrorCode(null); }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 pl-14 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                            placeholder="输入手机号"
                            maxLength={11}
                        />
                    </div>
                </div>

                {/* 注册模式：验证码 */}
                {mode === 'register' && (
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                            <MessageSquareCode className="w-4 h-4 text-indigo-400" />
                            短信验证码
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                placeholder="请输入6位验证码"
                                maxLength={6}
                            />
                            <button
                                type="button"
                                onClick={handleSendCode}
                                disabled={isSendingCode || countdown > 0 || !phone}
                                className="px-4 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm font-medium rounded-xl border border-indigo-500/30 min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isSendingCode ? (
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : countdown > 0 ? (
                                    `${countdown}s`
                                ) : (
                                    '发送验证码'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* 密码输入 */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        <KeyRound className="w-4 h-4 text-indigo-400" />
                        {mode === 'register' ? '设置密码' : '密码'}
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClass}
                            placeholder={mode === 'register' ? '至少8个字符' : '输入密码'}
                        />
                    </div>
                </div>

                {/* 注册模式：确认密码 */}
                {mode === 'register' && (
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                            <KeyRound className="w-4 h-4 text-indigo-400" />
                            确认密码
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputClass}
                                placeholder="再次输入密码"
                            />
                        </div>
                    </div>
                )}

                {/* 注册模式：邀请码 */}
                {mode === 'register' && (
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                            <Gift className="w-4 h-4 text-indigo-400" />
                            邀请码（可选）
                        </label>
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                            placeholder="有邀请码可填写"
                        />
                    </div>
                )}

                {/* Error & Success Messages */}
                {error && (
                    <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20 flex items-start gap-2">
                        <span className="mt-0.5">⚠️</span>
                        <div className="flex-1">
                            <p>{error}</p>
                            {errorCode === 'DATA_INCONSISTENCY' && (
                                <button
                                    type="button"
                                    onClick={handleRepairAccount}
                                    disabled={isRepairing || !phone}
                                    className="mt-3 w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isRepairing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            修复中...
                                        </>
                                    ) : (
                                        <>
                                            <span>🔧</span>
                                            一键修复账号
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}
                {message && (
                    <div className="p-3 bg-green-500/10 text-green-400 text-sm rounded-xl border border-green-500/20 flex items-center gap-2">
                        <span>✅</span>
                        {message}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            {mode === 'register' ? '完成注册' : '立即登录'}
                            <span className="text-base">→</span>
                        </>
                    )}
                </button>
            </form>

            {/* 切换模式提示 */}
            <div className="mt-5 text-center text-sm text-slate-500">
                {mode === 'login' ? (
                    <p>
                        还没有账户？{' '}
                        <button onClick={() => setMode('register')} className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
                            注册账号
                        </button>
                    </p>
                ) : (
                    <p>
                        已有账户？{' '}
                        <button onClick={() => setMode('login')} className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
                            立即登录
                        </button>
                    </p>
                )}
            </div>
        </div>
    )
}
