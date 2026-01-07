"use client"

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { Sparkles, Menu, X, ChevronRight } from 'lucide-react'

import Image from 'next/image'

function Logo() {
    return (
        <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
                <Image
                    src="/images/logo.png"
                    alt="DesignAI Logo"
                    fill
                    className="object-contain" // Ensures the logo fits well without distortion
                />
            </div>
            <span className="text-xl font-bold text-white">
                Design<span className="gradient-text">AI</span>
            </span>
        </div>
    )
}

import { useRouter } from 'next/navigation'
import { AuthModal } from '../auth/AuthModal'

export function Navbar() {
    const [user, setUser] = useState<User | null>(null)
    const [mounted, setMounted] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [showLogoutToast, setShowLogoutToast] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
        const supabase = createClient()

        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (_event === 'SIGNED_OUT') {
                router.refresh()
            }
        })

        return () => subscription.unsubscribe()
    }, [router])

    const handleLogout = useCallback(async () => {
        try {
            const supabase = createClient()
            await supabase.auth.signOut()
            setUser(null)
            // 使用原生弹窗确保用户看到
            window.alert('已成功退出登录！')
            router.push('/')
        } catch (error) {
            console.error('Logout error:', error)
            window.alert('退出失败，请重试')
        }
    }, [router])

    const navLinks = [
        { href: '/#features', label: '功能介绍' },
        { href: '/pricing', label: '价格方案' },
        { href: '/gallery', label: '案例展示' },
    ]

    return (
        <>
            {/* Auth Modal */}
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

            {/* Logout Toast */}
            {showLogoutToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-green-500/90 text-white px-6 py-3 rounded-xl shadow-lg backdrop-blur-sm flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">已成功退出登录</span>
                    </div>
                </div>
            )}
            <nav className="sticky top-0 z-50 glass border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="hover:opacity-90 transition-opacity">
                        <Logo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        {mounted && user ? (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm text-slate-300">{user.email?.split('@')[0]}</span>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-slate-500 hover:text-red-400 transition-colors ml-2"
                                >
                                    退出
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                                >
                                    登录
                                </button>
                                <Link href="/studio">
                                    <button className="btn-primary flex items-center gap-2 text-sm">
                                        <Sparkles className="w-4 h-4" />
                                        开始创作
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden glass border-t border-white/5 py-4 px-4">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors py-2"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <hr className="border-white/10" />
                            <Link href="/studio" onClick={() => setMobileMenuOpen(false)}>
                                <button className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                                    <Sparkles className="w-4 h-4" />
                                    开始创作
                                </button>
                            </Link>
                        </div>
                    </div>
                )}
            </nav>
        </>
    )
}
