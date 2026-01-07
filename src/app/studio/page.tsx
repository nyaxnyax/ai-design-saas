"use client"

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ToolSidebar } from '@/components/studio/ToolSidebar'
import { GenerationSettingsPanel } from '@/components/studio/GenerationSettings'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Image as ImageIcon, Download, LogIn, Zap, Sparkles, Settings, ArrowRight, Wand2, Scissors, Eraser, ScanFace, Menu, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { AuthModal } from '@/components/auth/AuthModal'
import { UserMenu } from '@/components/studio/UserMenu'
import { HistoryPanel } from '@/components/studio/HistoryPanel'
import { CreditsPanel } from '@/components/studio/CreditsPanel'
import { SettingsPanel } from '@/components/studio/SettingsPanel'
import { TutorialPanel } from '@/components/studio/TutorialPanel'
import { InvitePanel } from '@/components/studio/InvitePanel'
import GiftModal from '@/components/pricing/GiftModal'
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

    const [activeTool, setActiveTool] = useState<ToolType>(mode === 'tools' ? 'enhance' : 'text-to-image')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [prompt, setPrompt] = useState('')
    const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
        resolution: '1K',
        aspectRatio: '1:1',
        sceneType: undefined,
        artStyle: undefined,
    })
    const [generationProgress, setGenerationProgress] = useState(0)
    const [generationStage, setGenerationStage] = useState('')

    // History
    const [history, setHistory] = useState<Array<{ id: string; url: string; prompt: string; settings: GenerationSettings; timestamp: number }>>([])

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
    const [showGiftModal, setShowGiftModal] = useState(false)
    const [userTier, setUserTier] = useState<string>('free')
    const [isLoading, setIsLoading] = useState(true)
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg'>('png')
    const [showDownloadMenu, setShowDownloadMenu] = useState(false)
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
                        .select('balance, subscription_tier')
                        .eq('user_id', user.id)
                        .maybeSingle() as { data: { balance: number; subscription_tier: string } | null; error: any }

                    if (creditsError) {
                        console.error('Error loading credits:', creditsError)
                    }

                    if (creditsData && mounted) {
                        setCredits(creditsData.balance)
                        setUserTier(creditsData.subscription_tier || 'free')
                        console.log('[Studio] Credits & Tier loaded:', creditsData.balance, creditsData.subscription_tier)
                    } else if (mounted) {
                        console.warn('[Studio] No credits record found, initializing...')
                        try {
                            // Get session for auth header
                            const { data: { session } } = await supabase.auth.getSession()

                            // Add timeout to prevent hanging
                            const controller = new AbortController()
                            const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

                            const initResponse = await fetch('/api/auth/init-credits', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
                                },
                                signal: controller.signal
                            })

                            clearTimeout(timeoutId)

                            if (initResponse.ok) {
                                const { data } = await initResponse.json()
                                if (mounted) setCredits(data?.balance ?? 15)
                            } else {
                                console.warn('[Studio] Init-credits returned non-OK status:', initResponse.status)
                                if (mounted) setCredits(15)
                            }
                        } catch (e: any) {
                            console.error('[Studio] Failed to initialize credits:', e)
                            if (e.name === 'AbortError') {
                                console.warn('[Studio] Init-credits request timed out, using default credits')
                            }
                            if (mounted) setCredits(15)
                        }
                    }

                    // Load history
                    if (mounted) {
                        loadHistory(user.id)
                    }
                }
            } catch (error) {
                console.error('Error checking user:', error)
            } finally {
                if (mounted) setIsLoading(false)
            }
        }
        checkUser()

        const fallbackTimer = setTimeout(() => {
            if (mounted) setIsLoading(false)
        }, 5000)

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                setShowAuthModal(false)
                const { data: creditsData, error: creditsError } = await supabase
                    .from('user_credits')
                    .select('balance, subscription_tier')
                    .eq('user_id', session.user.id)
                    .maybeSingle() as { data: any, error: any }

                if (creditsError) {
                    console.error('[Studio] Auth state change - Error loading credits:', creditsError)
                }

                if (creditsData) {
                    setCredits(creditsData.balance)
                    setUserTier(creditsData.subscription_tier || 'free')
                    console.log('[Studio] Auth state change - Credits & Tier loaded:', creditsData.balance, creditsData.subscription_tier)
                } else {
                    console.warn('[Studio] Auth state change - No credits found, initializing...')
                    try {
                        const token = session.access_token

                        // Add timeout to prevent hanging
                        const controller = new AbortController()
                        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

                        const initResponse = await fetch('/api/auth/init-credits', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            signal: controller.signal
                        })

                        clearTimeout(timeoutId)

                        if (initResponse.ok) {
                            const { data } = await initResponse.json()
                            setCredits(data?.balance ?? 15)
                        } else {
                            console.warn('[Studio] Auth state change - Init-credits returned non-OK status:', initResponse.status)
                            setCredits(15)
                        }
                    } catch (e: any) {
                        console.error('[Studio] Failed to init credits on auth change:', e)
                        if (e.name === 'AbortError') {
                            console.warn('[Studio] Auth state change - Init-credits request timed out, using default credits')
                        }
                        setCredits(15)
                    }
                }

                // Load history
                loadHistory(session.user.id)
            } else {
                setCredits(DEV_MODE ? 999999 : 0)
            }
        })

        return () => {
            mounted = false
            clearTimeout(fallbackTimer)
            subscription.unsubscribe()
        }
    }, [])

    // Load generation history
    const loadHistory = async (userId: string) => {
        try {
            const { data: historyData } = await supabase
                .from('generations')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20)

            if (historyData) {
                setHistory(historyData.map((item: any) => ({
                    id: item.id,
                    url: item.result_url,
                    prompt: item.prompt,
                    settings: item.settings,
                    timestamp: new Date(item.created_at).getTime()
                })))
            }
        } catch (e) {
            console.error('Failed to load history:', e)
        }
    }

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
            // First clear local state
            setUser(null)
            setCredits(DEV_MODE ? 999999 : 0)
            setGeneratedImage(null)
            setPreviewUrl(null)
            setSelectedFile(null)
            setError(null)
            setIsGenerating(false)

            // Sign out from Supabase
            const { error } = await supabase.auth.signOut()

            if (error) {
                console.error('Logout error:', error)
            }

            // Clear localStorage
            try {
                localStorage.clear()
            } catch (e) {
                console.warn('Failed to clear localStorage:', e)
            }

            // Reload page AFTER signOut completes
            window.location.reload()
        } catch (error) {
            console.error('Logout error:', error)
            // Still reload even if there's an error
            window.location.reload()
        }
    }

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

    // Simulate progress stages
    const progressStages = [
        { text: '正在分析提示词...', progress: 20 },
        { text: 'AI 正在创作...', progress: 50 },
        { text: '正在优化细节...', progress: 75 },
        { text: '即将完成...', progress: 95 },
    ]

    const handleGenerate = async () => {
        console.log('[handleGenerate] Starting generation...', {
            user: !!user,
            activeTool,
            prompt: prompt?.length,
            hasFile: !!selectedFile,
            credits,
            cost: calculateCreditCost(activeTool, generationSettings),
            batchMode: generationSettings.batchMode,
            batchSize: generationSettings.batchSize
        })

        if (!DEV_MODE && !user) {
            console.log('[handleGenerate] No user, showing auth modal')
            setShowAuthModal(true)
            return
        }

        const isTextToImage = activeTool === 'text-to-image'
        console.log('[handleGenerate] isTextToImage:', isTextToImage)

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
            setShowGiftModal(true)
            return
        }

        // --- 虚拟排队逻辑与身份溢价 (Identity Premium) ---
        // 判定条件：晚间高峰期 (20:00 - 23:00) 且 非专业版/商业版用户
        const now = new Date()
        const currentHour = now.getHours()
        const isPeakTime = currentHour >= 20 && currentHour <= 23
        const isPremiumUser = userTier === 'pro' || userTier === 'agency'

        if (!DEV_MODE && isPeakTime && !isPremiumUser) {
            setIsGenerating(true)
            setGenerationStage('服务器繁忙，正在为您排队... (当前位置: 12)')
            setGenerationProgress(5)
            // 强制等待 15 秒模拟排队
            await new Promise(resolve => setTimeout(resolve, 15000))
        }

        // Batch mode: generate multiple images in sequence
        if (generationSettings.batchMode && generationSettings.batchSize && generationSettings.batchSize > 1) {
            await handleBatchGenerate()
            return
        }

        // Single image generation (original logic)
        setIsGenerating(true)
        setGeneratedImage(null)
        setError(null)
        setGenerationProgress(0)
        setGenerationStage('')

        try {
            let imageUrl = ''

            // Simulate progress
            for (const stage of progressStages) {
                setGenerationStage(stage.text)
                setGenerationProgress(stage.progress)
                await new Promise(resolve => setTimeout(resolve, 800))
            }
            setGenerationStage('正在生成最终图片...')
            setGenerationProgress(99)

            if (!isTextToImage) {
                console.log('Step 1: Preparing file upload...')

                if (!selectedFile) {
                    setError('请先上传一张图片！')
                    setIsGenerating(false)
                    return
                }

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

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("请先登录");

            console.log(`Step 4: Calling Next.js API /api/generate with mode: ${isTextToImage ? 'text-to-image' : 'image-to-image'}`)
            console.log('[API] Request payload:', {
                prompt: prompt || '高质量专业产品摄影，柔和的灯光，8K分辨率',
                image_url: imageUrl,
                type: isTextToImage ? 'text-to-image' : activeTool,
                settings: generationSettings
            })

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    prompt: prompt || '高质量专业产品摄影，柔和的灯光，8K分辨率',
                    image_url: imageUrl,
                    type: isTextToImage ? 'text-to-image' : activeTool,
                    settings: generationSettings
                })
            })

            console.log('[API] Response status:', response.status, response.statusText)

            const data = await response.json()

            console.log('Step 5: API response:', data)

            if (!response.ok) {
                throw new Error(data.error || 'Generation failed')
            }

            if (data?.image_url) {
                setGeneratedImage(data.image_url)
                setCredits(data.remaining_credits ?? credits - 1)
                setGenerationProgress(100)
                setGenerationStage('生成完成！')

                // Add to history
                const newHistoryItem = {
                    id: `gen-${Date.now()}`,
                    url: data.image_url,
                    prompt: prompt || (isTextToImage ? 'AI 生图' : '图片处理'),
                    settings: generationSettings,
                    timestamp: Date.now()
                }
                setHistory(prev => [newHistoryItem, ...prev])

                // Save to database
                try {
                    await supabase.from('generations').insert({
                        user_id: user?.id,
                        prompt: prompt || (isTextToImage ? 'AI 生图' : '图片处理'),
                        result_url: data.image_url,
                        settings: generationSettings,
                        type: activeTool
                    })
                } catch (e) {
                    console.error('Failed to save history:', e)
                }

                // Reset progress after a short delay
                setTimeout(() => {
                    setGenerationProgress(0)
                    setGenerationStage('')
                }, 2000)
            } else {
                throw new Error("未返回图片 URL")
            }

        } catch (err: unknown) {
            console.error('Generation error:', err)
            const errorMessage = err instanceof Error ? err.message : '未知错误'
            setError("生成失败：" + errorMessage)
            setGenerationProgress(0)
            setGenerationStage('')
        } finally {
            setIsGenerating(false)
        }
    }

    // Handle batch generation
    const handleBatchGenerate = async () => {
        const batchSize = generationSettings.batchSize || 1
        const isTextToImage = activeTool === 'text-to-image'

        setIsGenerating(true)
        setError(null)

        // Store batch results
        const batchResults: Array<{ url: string; prompt: string; index: number }> = []

        for (let i = 0; i < batchSize; i++) {
            try {
                setGenerationStage(`正在生成第 ${i + 1}/${batchSize} 张图片...`)
                setGenerationProgress(Math.round(((i + 1) / batchSize) * 100))

                // Prepare image URL for non-text-to-image
                let imageUrl = ''
                if (!isTextToImage && selectedFile) {
                    const fileExt = selectedFile.name.split('.').pop()
                    const fileName = `${user?.id || 'dev'}/batch-${Date.now()}-${i}.${fileExt}`
                    const { error: uploadError } = await supabase.storage
                        .from('user-uploads')
                        .upload(fileName, selectedFile)

                    if (uploadError) {
                        throw new Error('图片上传失败: ' + uploadError.message)
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('user-uploads')
                        .getPublicUrl(fileName)
                    imageUrl = publicUrl
                }

                const { data: { session } } = await supabase.auth.getSession()
                if (!session) throw new Error("请先登录")

                // Call API with batchMode disabled (each image is counted separately)
                const singleImageSettings = { ...generationSettings, batchMode: false, batchSize: 1 }

                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({
                        prompt: prompt || '高质量专业产品摄影，柔和的灯光，8K分辨率',
                        image_url: imageUrl,
                        type: isTextToImage ? 'text-to-image' : activeTool,
                        settings: singleImageSettings
                    })
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Generation failed')
                }

                if (data?.image_url) {
                    batchResults.push({
                        url: data.image_url,
                        prompt: prompt || '批量生成',
                        index: i + 1
                    })

                    // Add to history
                    const newHistoryItem = {
                        id: `gen-${Date.now()}-${i}`,
                        url: data.image_url,
                        prompt: `[${i + 1}/${batchSize}] ${prompt || (isTextToImage ? 'AI 生图' : '图片处理')}`,
                        settings: generationSettings,
                        timestamp: Date.now()
                    }
                    setHistory(prev => [newHistoryItem, ...prev])
                }

                // Update credits after each successful generation
                const singleImageCost = calculateCreditCost(activeTool, singleImageSettings)
                setCredits(prev => Math.max(0, prev - singleImageCost))

            } catch (error: any) {
                console.error(`Batch generation error at image ${i + 1}:`, error)
                setError(`第 ${i + 1} 张图片生成失败：${error.message}`)
            }
        }

        setIsGenerating(false)
        setGenerationProgress(100)

        if (batchResults.length > 0) {
            // Show first image
            setGeneratedImage(batchResults[0].url)
            setGenerationStage(`批量生成完成！成功 ${batchResults.length}/${batchSize} 张`)
        } else {
            setGenerationStage('批量生成失败，请重试')
        }
    }

    const handleDownload = async (format?: 'png' | 'jpg') => {
        if (!generatedImage) return

        const selectedFormat = format || downloadFormat
        setShowDownloadMenu(false)

        try {
            let blob: Blob | undefined
            let fileName = `designai-pro-${Date.now()}.${selectedFormat}`

            // Check if it's a base64 data URI
            if (generatedImage.startsWith('data:')) {
                // Extract the MIME type and base64 data
                const matches = generatedImage.match(/^data:([^;]+);base64,(.+)$/)
                if (matches) {
                    const mimeType = matches[1]
                    const base64Data = matches[2]

                    // Convert base64 to blob
                    const byteCharacters = atob(base64Data)
                    const byteNumbers = new Array(byteCharacters.length)
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i)
                    }
                    const byteArray = new Uint8Array(byteNumbers)
                    blob = new Blob([byteArray], { type: mimeType })

                    // Convert format if needed
                    if (selectedFormat === 'jpg' && mimeType !== 'image/jpeg') {
                        // Convert to JPG
                        blob = await convertBlobToJpeg(blob)
                    } else if (selectedFormat === 'png' && mimeType !== 'image/png') {
                        // Convert to PNG (keep as is if already PNG)
                        if (mimeType === 'image/jpeg' || mimeType === 'image/webp') {
                            // Will be converted to PNG format below
                        }
                    }
                } else {
                    throw new Error('Invalid data URI format')
                }
            } else {
                // Regular URL - fetch as blob
                const response = await fetch(generatedImage)
                blob = await response.blob()
            }

            // Validate blob before proceeding
            if (!blob) {
                throw new Error('Failed to process image')
            }

            // Ensure final blob matches selected format
            if (selectedFormat === 'jpg' && blob.type !== 'image/jpeg') {
                blob = await convertBlobToJpeg(blob)
            } else if (selectedFormat === 'png' && blob.type !== 'image/png') {
                blob = await convertBlobToPng(blob)
            }

            // Create download link
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            console.log('Download successful:', fileName)
        } catch (err) {
            console.error('Download error:', err)
            alert('下载失败，请重试')
        }
    }

    // Helper function to convert blob to JPEG
    const convertBlobToJpeg = async (blob: Blob): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img')
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }
                // Fill white background for JPEG
                ctx.fillStyle = '#FFFFFF'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0)
                canvas.toBlob((convertedBlob) => {
                    if (convertedBlob) {
                        resolve(convertedBlob)
                    } else {
                        reject(new Error('Failed to convert to JPEG'))
                    }
                }, 'image/jpeg', 0.95)
            }
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = URL.createObjectURL(blob)
        })
    }

    // Helper function to convert blob to PNG
    const convertBlobToPng = async (blob: Blob): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img')
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }
                ctx.drawImage(img, 0, 0)
                canvas.toBlob((convertedBlob) => {
                    if (convertedBlob) {
                        resolve(convertedBlob)
                    } else {
                        reject(new Error('Failed to convert to PNG'))
                    }
                }, 'image/png')
            }
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = URL.createObjectURL(blob)
        })
    }

    const handleHistoryClick = (historyItem: typeof history[0]) => {
        setGeneratedImage(historyItem.url)
        setPrompt(historyItem.prompt)
        setGenerationSettings(historyItem.settings)
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
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
        <div className="min-h-screen bg-[#0a0a0f]">
            {/* Header - Tools */}
            <div className="sticky top-16 z-40 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/10">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4 overflow-x-auto">
                        <div className="flex items-center gap-2">
                            {tools.map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => handleToolSelect(tool.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTool === tool.id
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <tool.icon className="w-4 h-4" />
                                    {tool.name}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-4">
                            {user ? (
                                <>
                                    <div className="text-sm text-slate-400">
                                        <span className="text-white font-bold">{credits}</span> 积分
                                    </div>
                                    <div className="w-px h-6 bg-white/10"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                            {user.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <button
                                            onClick={() => setShowUserMenu(true)}
                                            className="text-slate-400 hover:text-white"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    登录
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column - Image Display (8 cols) */}
                    <div className="lg:col-span-8">
                        {/* Image Display Area */}
                        <div className="relative bg-[#12121a] rounded-2xl border border-white/10 overflow-hidden" style={{ minHeight: '500px' }}>
                            {generatedImage ? (
                                <div className="absolute inset-0 flex items-center justify-center p-6 bg-[#0a0a0f]">
                                    <div className="relative max-w-full">
                                        <img
                                            src={generatedImage}
                                            alt="Generated"
                                            className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                                            style={{ maxHeight: 'calc(100vh - 300px)' }}
                                        />
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button
                                                onClick={() => setGeneratedImage(null)}
                                                className="p-2 bg-black/60 backdrop-blur rounded-lg text-white hover:bg-red-600 transition-colors"
                                                title="关闭"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                                    className="p-2 bg-black/60 backdrop-blur rounded-lg text-white hover:bg-indigo-600 transition-colors flex items-center gap-1"
                                                    title="下载"
                                                >
                                                    <Download className="w-5 h-5" />
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>
                                                {showDownloadMenu && (
                                                    <div className="absolute top-full right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[120px]">
                                                        <button
                                                            onClick={() => handleDownload('png')}
                                                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-indigo-600 transition-colors flex items-center gap-2"
                                                        >
                                                            <span className="w-3 h-3 rounded bg-green-500"></span>
                                                            下载 PNG
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownload('jpg')}
                                                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-indigo-600 transition-colors flex items-center gap-2"
                                                        >
                                                            <span className="w-3 h-3 rounded bg-blue-500"></span>
                                                            下载 JPG
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : previewUrl ? (
                                <div className="absolute inset-0 flex items-center justify-center p-6">
                                    <div className="relative">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-w-full max-h-[70vh] object-contain rounded-xl"
                                        />
                                        <button
                                            onClick={() => {
                                                setPreviewUrl(null)
                                                setSelectedFile(null)
                                            }}
                                            className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white hover:bg-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                    {activeTool === 'text-to-image' ? (
                                        <>
                                            <Wand2 className="w-20 h-20 text-indigo-500 mx-auto mb-6" />
                                            <h3 className="text-2xl font-bold text-white mb-3">
                                                AI 文生图
                                            </h3>
                                            <p className="text-slate-400 mb-8 max-w-md">
                                                输入提示词描述你想要的图片，AI 将为你生成作品
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-20 h-20 text-slate-600 mx-auto mb-6" />
                                            <h3 className="text-2xl font-bold text-white mb-3">
                                                上传图片开始创作
                                            </h3>
                                            <p className="text-slate-400 mb-8">
                                                支持 JPG、PNG、WEBP 格式，最大 10MB
                                            </p>
                                            <label className="px-6 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                                                <Upload className="w-5 h-5" />
                                                选择图片
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                />
                                            </label>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Progress Overlay */}
                            {isGenerating && (
                                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                    <div className="w-full max-w-md px-6">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                            <p className="text-white text-lg font-medium mb-2">{generationStage || 'AI 正在创作...'}</p>
                                            <p className="text-slate-400 text-sm">请稍候，这可能需要 10-30 秒</p>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                                                style={{ width: `${generationProgress}%` }}
                                            />
                                        </div>
                                        <div className="text-right text-xs text-slate-400 mt-2">{generationProgress}%</div>
                                    </div>
                                </div>
                            )}

                            {/* Error Toast */}
                            {error && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/90 text-white rounded-lg shadow-xl backdrop-blur">
                                    <div className="flex items-center gap-3">
                                        <span>{error}</span>
                                        <button
                                            onClick={() => setError(null)}
                                            className="hover:text-white/80"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Settings (4 cols) */}
                    <div className="lg:col-span-4 space-y-4">

                        {/* Prompt Input */}
                        <div className="card p-5">
                            <label className="text-sm font-medium text-slate-300 mb-3 block">
                                提示词
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="描述你想要的效果，例如：一只可爱的橘猫坐在窗台上，阳光温暖..."
                                className="input-field w-full h-32 resize-none text-sm"
                            />
                        </div>

                        {/* Generation Settings */}
                        <div className="card p-5">
                            <GenerationSettingsPanel
                                settings={generationSettings}
                                onSettingsChange={setGenerationSettings}
                                disabled={isGenerating}
                            />
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={
                                isGenerating ||
                                credits < currentCreditCost ||
                                (activeTool === 'text-to-image' ? !prompt.trim() : !selectedFile)
                            }
                            className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <Sparkles className="w-5 h-5 group-hover:animate-spin-slow" />
                            {isGenerating ? '生成中...' : `立即生成`}
                            {!isGenerating && <span className="text-sm opacity-75">({getCreditDisplayText(currentCreditCost)})</span>}
                        </button>

                        {credits < currentCreditCost && (
                            <div className="card p-4 bg-red-500/10 border-red-500/30 text-center">
                                <p className="text-red-400 text-sm">
                                    积分不足 (需要 {currentCreditCost} 积分)
                                </p>
                                <Link href="/pricing" className="inline-block mt-2 text-sm text-indigo-400 hover:text-indigo-300">
                                    前往充值 →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* History Section */}
                {history.length > 0 && (
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-indigo-500" />
                                生成记录
                            </h2>
                            <Link href="/pricing" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                查看全部 <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {history.slice(0, 6).map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleHistoryClick(item)}
                                    className="group relative aspect-square bg-[#12121a] rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-indigo-500/50 transition-all"
                                >
                                    <img
                                        src={item.url}
                                        alt={item.prompt}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <p className="text-white text-xs line-clamp-2 mb-1">{item.prompt}</p>
                                            <p className="text-slate-400 text-xs">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Panels */}
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            <UserMenu isOpen={showUserMenu} onClose={() => setShowUserMenu(false)} onSelect={handleMenuSelect} onLogout={handleLogout} user={user} credits={credits} />
            <HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} />
            <CreditsPanel isOpen={showCredits} onClose={() => setShowCredits(false)} currentBalance={credits} />
            <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} user={user} />
            <TutorialPanel isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
            <InvitePanel isOpen={showInvite} onClose={() => setShowInvite(false)} />
            {/* 耗尽拦截特惠弹窗 */}
            <GiftModal
                isOpen={showGiftModal}
                onClose={() => setShowGiftModal(false)}
                onBuy={async (planId, amount, name) => {
                    setShowGiftModal(false)
                    // 调用现有的支付逻辑 (跳转到定价中心处理)
                    router.push(`/pricing?plan=${planId}&amount=${amount}&name=${encodeURIComponent(name)}`)
                }}
            />
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
