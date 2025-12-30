"use client"

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ToolSidebar } from '@/components/studio/ToolSidebar'
import { GenerationSettingsPanel } from '@/components/studio/GenerationSettings'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Image as ImageIcon, Download, LogIn, Zap, Sparkles, Settings, ArrowRight, Wand2, Scissors, Eraser, ScanFace, Menu } from 'lucide-react'
import Image from 'next/image'
import { AuthModal } from '@/components/auth/AuthModal'
import { UserMenu } from '@/components/studio/UserMenu'
import { HistoryPanel } from '@/components/studio/HistoryPanel'
import { CreditsPanel } from '@/components/studio/CreditsPanel'
import { SettingsPanel } from '@/components/studio/SettingsPanel'
import { TutorialPanel } from '@/components/studio/TutorialPanel'
import { InvitePanel } from '@/components/studio/InvitePanel'
import type { User } from '@supabase/supabase-js'
import type { GenerationSettings } from '@/types/generation'
import { calculateCreditCost, getCreditDisplayText } from '@/lib/credit-calculator'

type ToolType = 'background' | 'model' | 'upscale' | 'enhance' | 'remove-watermark' | 'cutout' | 'erase' | 'text-to-image'

// Tools Definition
const tools = [
    { id: 'text-to-image', name: 'AI 文生图', icon: ImageIcon },
    { id: 'background', name: 'AI 场景合成', icon: ImageIcon },
    { id: 'model', name: 'AI 模特换装', icon: ScanFace },
    { id: 'cutout', name: '智能抠图', icon: Scissors },
    { id: 'enhance', name: '画质增强', icon: Wand2 },
    { id: 'erase', name: '智能消除', icon: Eraser },
]

// ⚡ 开发者模式 - 设置为 true 可跳过登录和积分限制
const DEV_MODE = process.env.NODE_ENV === 'development'

export const dynamic = 'force-dynamic'
import { Suspense } from 'react'

function StudioContent() {

    const searchParams = useSearchParams()
    const mode = (searchParams.get('mode') as 'tools' | 'ecommerce') || 'ecommerce'

    const [activeTool, setActiveTool] = useState<ToolType>(mode === 'tools' ? 'enhance' : 'background')
    // Aligning state naming with new UI
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null) // Used to be selectedImage
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [prompt, setPrompt] = useState('') // NEW: Prompt state
    const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
        resolution: '1K',
        aspectRatio: '16:9',
        sceneType: undefined,
        artStyle: undefined,
    })

    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [credits, setCredits] = useState<number>(0)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [showCredits, setShowCredits] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showTutorial, setShowTutorial] = useState(false)
    const [showInvite, setShowInvite] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()
    const router = useRouter()

    // Calculate current credit cost based on settings
    const currentCreditCost = calculateCreditCost(activeTool, generationSettings)

    // Handle login query param
    useEffect(() => {
        if (searchParams.get('login') === 'true') {
            setShowAuthModal(true)
        }
    }, [searchParams])

    // Check auth status on mount
    useEffect(() => {
        let mounted = true

        const checkUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!mounted) return

                setUser(user)

                if (user) {
                    const { data: creditsData, error: creditsError } = await supabase
                        .from('user_credits')
                        .select('balance')
                        .eq('user_id', user.id)
                        .maybeSingle()

                    if (creditsError) {
                        console.error('Error loading credits:', creditsError)
                    }

                    if (creditsData && mounted) {
                        setCredits(creditsData.balance)
                        console.log('[Studio] Credits loaded:', creditsData.balance)
                    } else if (mounted) {
                        // No credits record found, this might be a new user
                        // Try to initialize credits via API
                        console.warn('[Studio] No credits record found, initializing...')
                        try {
                            const initResponse = await fetch('/api/auth/init-credits', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            })
                            if (initResponse.ok) {
                                const { data } = await initResponse.json()
                                if (mounted) setCredits(data?.balance ?? 15)
                            } else {
                                // Fallback: set default 15 credits for display
                                if (mounted) setCredits(15)
                            }
                        } catch (e) {
                            console.error('[Studio] Failed to initialize credits:', e)
                            if (mounted) setCredits(15)
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking user:', error)
            } finally {
                // Always set loading to false after checking user
                if (mounted) setIsLoading(false)
            }
        }
        checkUser()

        // Fallback: Ensure loading is set to false after 5 seconds max
        const fallbackTimer = setTimeout(() => {
            if (mounted) setIsLoading(false)
        }, 5000)

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                setShowAuthModal(false)
                const { data: creditsData, error: creditsError } = await supabase
                    .from('user_credits')
                    .select('balance')
                    .eq('user_id', session.user.id)
                    .maybeSingle()

                if (creditsError) {
                    console.error('[Studio] Auth state change - Error loading credits:', creditsError)
                }

                if (creditsData) {
                    setCredits(creditsData.balance)
                    console.log('[Studio] Auth state change - Credits loaded:', creditsData.balance)
                } else {
                    // No credits record, initialize it
                    console.warn('[Studio] Auth state change - No credits found, initializing...')
                    try {
                        const token = session.access_token
                        const initResponse = await fetch('/api/auth/init-credits', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        })
                        if (initResponse.ok) {
                            const { data } = await initResponse.json()
                            setCredits(data?.balance ?? 15)
                        } else {
                            setCredits(15)
                        }
                    } catch (e) {
                        console.error('[Studio] Failed to init credits on auth change:', e)
                        setCredits(15)
                    }
                }
            } else {
                // User logged out
                setCredits(DEV_MODE ? 999999 : 0)
            }
        })

        return () => {
            mounted = false
            clearTimeout(fallbackTimer)
            subscription.unsubscribe()
        }
    }, [])

    // Handle menu item selection
    const handleMenuSelect = (itemId: string) => {
        switch (itemId) {
            case 'history':
                setShowHistory(true)
                break
            case 'credits':
                setShowCredits(true)
                break
            case 'tutorial':
                setShowTutorial(true)
                break
            case 'pricing':
                router.push('/pricing')
                break
            case 'settings':
                setShowSettings(true)
                break
            case 'invite':
                setShowInvite(true)
                break
        }
    }

    const handleLogout = async () => {
        try {
            // 清理所有状态
            setUser(null)
            setCredits(DEV_MODE ? 999999 : 0)
            setGeneratedImage(null)
            setPreviewUrl(null)
            setSelectedFile(null)
            setError(null)
            setIsGenerating(false)

            // 退出登录 - 使用 { scope: 'all' } 确保清理所有 session
            const { error } = await supabase.auth.signOut({ scope: 'all' })

            if (error) {
                console.error('Logout error:', error)
            }

            // 清理 localStorage 中的 Supabase 残留数据
            try {
                localStorage.clear()
            } catch (e) {
                console.warn('Failed to clear localStorage:', e)
            }

            // 刷新页面
            window.location.reload()
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    // Helper for Tool Selection
    const handleToolSelect = (toolId: string) => {
        setActiveTool(toolId as ToolType)
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setError(null)
        const file = e.target.files[0]
        setSelectedFile(file)

        const reader = new FileReader()
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string)
            setGeneratedImage(null)
        }
        reader.readAsDataURL(file)
    }

    const handleGenerate = async () => {
        if (!DEV_MODE && !user) {
            setShowAuthModal(true)
            return
        }

        // Check if text-to-image mode (no image required)
        const isTextToImage = activeTool === 'text-to-image'

        if (!isTextToImage && !selectedFile) {
            setError('请先上传一张图片！')
            return
        }

        if (isTextToImage && !prompt.trim()) {
            setError('请输入提示词来生成图片！')
            return
        }

        const cost = calculateCreditCost(activeTool, generationSettings)
        if (!DEV_MODE && credits < cost) {
            setError(`积分不足 (需要 ${cost} 积分)，请充值后再试`)
            return
        }

        setIsGenerating(true)
        setGeneratedImage(null)
        setError(null)

        try {
            let imageUrl = ''

            // Only upload image if not text-to-image mode
            if (!isTextToImage) {
                console.log('Step 1: Preparing file upload...')
                const fileExt = selectedFile.name.split('.').pop()
                const fileName = `${user?.id || 'dev'}/${Date.now()}.${fileExt}`

                console.log('Step 2: Uploading to Storage...', fileName)
                const { error: uploadError } = await supabase.storage
                    .from('user-uploads')
                    .upload(fileName, selectedFile)

                if (uploadError) {
                    console.error('Upload error:', uploadError)
                    throw new Error('图片上传失败: ' + uploadError.message)
                }
                console.log('Step 2 complete: Upload successful')

                const { data: { publicUrl } } = supabase.storage
                    .from('user-uploads')
                    .getPublicUrl(fileName)

                console.log('Step 3: Got public URL:', publicUrl)
                imageUrl = publicUrl
            } else {
                console.log('Text-to-image mode: skipping image upload')
            }

            // Get fresh session for token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("请先登录");

            console.log(`Step 4: Calling Next.js API /api/generate with mode: ${isTextToImage ? 'text-to-image' : 'image-to-image'}`)

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    prompt: prompt || '高质量专业产品摄影，柔和的灯光，8K分辨率',
                    image_url: imageUrl,  // Empty string for text-to-image
                    type: isTextToImage ? 'text-to-image' : activeTool,
                    settings: generationSettings
                })
            })

            const data = await response.json()

            console.log('Step 5: API response:', data)

            if (!response.ok) {
                throw new Error(data.error || 'Generation failed')
            }

            if (data?.image_url) {
                setGeneratedImage(data.image_url)
                setCredits(data.remaining_credits ?? credits - 1)
            } else {
                throw new Error("未返回图片 URL")
            }

        } catch (err: unknown) {
            console.error('Generation error:', err)
            const errorMessage = err instanceof Error ? err.message : '未知错误'
            setError("生成失败：" + errorMessage)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDownload = async () => {
        if (!generatedImage) return

        try {
            const response = await fetch(generatedImage)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `designai-pro-${Date.now()}.png`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            console.error('Download error:', err)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0a0a0f]">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="mt-4 text-slate-400 font-medium">加载中...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-20 pb-12 px-4">
            <div className="container mx-auto max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">

                    {/* Left Side: Canvas & Preview (75%) */}
                    <div className="flex-1 lg:flex-[3] flex flex-col gap-6 h-full">
                        {/* Tool Tabs (Top) */}
                        <div className="flex gap-4 p-1 bg-white/5 rounded-xl w-fit">
                            {tools.map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => handleToolSelect(tool.id)}
                                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTool === tool.id
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <tool.icon className="w-4 h-4" />
                                    {tool.name}
                                </button>
                            ))}
                        </div>

                        {/* Main Canvas Area */}
                        <div className="flex-1 card border-2 border-dashed border-white/10 relative group overflow-hidden flex flex-col items-center justify-center bg-black/20">
                            {generatedImage ? (
                                <div className="relative w-full h-full flex items-center justify-center p-4">
                                    <div className="relative max-w-full max-h-full group">
                                        <img
                                            src={generatedImage}
                                            alt="Generated"
                                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                        />
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-80 hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setGeneratedImage(null)}
                                                className="p-2 bg-red-500/90 backdrop-blur rounded-lg text-white hover:bg-red-600 transition-colors"
                                                title="关闭图片继续生成"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={handleDownload}
                                                className="p-2 bg-black/50 backdrop-blur rounded-lg text-white hover:bg-indigo-600 transition-colors"
                                                title="下载图片"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : previewUrl ? (
                                <div className="relative w-full h-full">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full object-contain rounded-lg"
                                    />
                                    <button
                                        onClick={() => {
                                            setPreviewUrl(null)
                                            setSelectedFile(null)
                                        }}
                                        className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : activeTool === 'text-to-image' ? (
                                // Text-to-image mode: show prompt input area
                                <div className="text-center p-8 w-full max-w-2xl">
                                    <Wand2 className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        AI 文生图
                                    </h3>
                                    <p className="text-slate-400 mb-6">
                                        输入提示词，AI 将为您生成图片
                                    </p>
                                    <div className="bg-white/5 rounded-xl p-4 text-left">
                                        <p className="text-sm text-slate-400 mb-2">提示词示例：</p>
                                        <p className="text-xs text-slate-500 italic">
                                            "一只可爱的橘猫坐在窗台上，阳光透过窗户洒进来，温暖的午后氛围，写实风格，8K分辨率"
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-8">
                                    <Upload className="w-16 h-16 text-slate-600 mx-auto mb-4 group-hover:text-indigo-500 transition-colors" />
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        点击或拖拽上传图片
                                    </h3>
                                    <p className="text-slate-400 mb-6">
                                        支持 JPG, PNG, WEBP (最大 10MB)
                                    </p>
                                    <label className="btn-primary cursor-pointer inline-flex">
                                        选择图片
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                        />
                                    </label>
                                </div>
                            )}

                            {/* Loading Overlay */}
                            {isGenerating && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="text-white font-medium animate-pulse">
                                        AI 正在施展魔法...
                                    </p>
                                </div>
                            )}

                            {/* Error Toast */}
                            {error && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/90 text-white rounded-lg shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-4">
                                    {error}
                                    <button
                                        onClick={() => setError(null)}
                                        className="ml-4 hover:text-white/80"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Settings Panel (25%) */}
                    <div className="lg:w-80 flex flex-col gap-6">

                        {/* User Info Card */}
                        {user && (
                            <div className="card p-4 bg-gradient-to-r from-slate-500/10 to-slate-600/10 border-slate-500/30">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                            {user.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">
                                                {user.email?.split('@')[0] || '用户'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {user.email?.split('@')[1] || ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowUserMenu(true)}
                                            className="text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
                                            title="功能菜单"
                                        >
                                            <Menu className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Credits Card */}
                        <div className="card p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">剩余积分</span>
                                <Link href="/pricing">
                                    <button className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                        充值 <ArrowRight className="w-3 h-3" />
                                    </button>
                                </Link>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-white">{credits}</span>
                                <span className="text-xs text-slate-500">积分</span>
                            </div>
                            {DEV_MODE && credits > 1000 && (
                                <div className="mt-2 text-xs text-yellow-500/80 bg-yellow-500/10 px-2 py-1 rounded">
                                    开发者模式 - 无限积分
                                </div>
                            )}
                        </div>

                        {/* Settings Form */}
                        <div className="card p-6 flex-1 overflow-y-auto space-y-6">

                            {/* Prompt Input */}
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 block">
                                    提示词 (Prompt)
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="描述你想要的效果..."
                                    className="input-field h-24 resize-none text-sm"
                                />
                            </div>

                            {/* Generation Settings Panel */}
                            <GenerationSettingsPanel
                                settings={generationSettings}
                                onSettingsChange={setGenerationSettings}
                                disabled={isGenerating}
                            />

                            {/* Generate Button */}
                            <div className="mt-auto">
                                <button
                                    onClick={handleGenerate}
                                    disabled={
                                        isGenerating ||
                                        credits < currentCreditCost ||
                                        (activeTool === 'text-to-image' ? !prompt.trim() : !selectedFile)
                                    }
                                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <Sparkles className="w-4 h-4 group-hover:animate-spin-slow" />
                                    {isGenerating ? '生成中...' : `立即生成 (${getCreditDisplayText(currentCreditCost)})`}
                                </button>
                                {credits < currentCreditCost && (
                                    <p className="text-xs text-red-400 text-center mt-2">
                                        积分不足 (需要 {currentCreditCost} 积分)，请先充值
                                    </p>
                                )}
                                {activeTool === 'text-to-image' && !prompt.trim() && (
                                    <p className="text-xs text-slate-500 text-center mt-2">
                                        请输入提示词来生成图片
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Panels */}
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            <UserMenu isOpen={showUserMenu} onClose={() => setShowUserMenu(false)} onSelect={handleMenuSelect} onLogout={handleLogout} user={user} credits={credits} />
            <HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} />
            <CreditsPanel isOpen={showCredits} onClose={() => setShowCredits(false)} currentBalance={credits} />
            <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} user={user} />
            <TutorialPanel isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
            <InvitePanel isOpen={showInvite} onClose={() => setShowInvite(false)} />
        </div>
    )
}

export default function StudioPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0f] text-slate-400">Loading Studio...</div>}>
            <StudioContent />
        </Suspense>
    )
}
