"use client"

import { X } from 'lucide-react'
import { AuthForm } from './AuthForm'
import { useEffect, useState } from 'react'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || !isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/5 animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="p-8">
                    <AuthForm onSuccess={onClose} />
                </div>
            </div>
        </div>
    )
}
