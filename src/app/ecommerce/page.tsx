"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
    Upload, X, Download, ArrowRight, Zap, Sparkles, 
    ImageIcon, Palette, Users, Layers, Camera, 
    ChevronDown, LogIn, Repeat, Loader2, Type, PenTool, Crop, Frame, Clock
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthModal } from '@/components/auth/AuthModal'
import { PromptBuilder, type PromptOptions } from '@/components/studio/PromptBuilder'
import type { User } from '@supabase/supabase-js'

// 电商工具类型扩展
type EcommerceToolType = 'text-to-image' | 'main-image' | 'background' | 'model' | 'scene' | 'blend' | 'retouch' | 'wireframe'

interface ToolConfig {
    id: EcommerceToolType
    name: string
    icon: any
    description: string
    inputs: {
        upload?: { label?: string; max: number; required: boolean; labels?: string[] }
        prompt?: boolean
        styleSelector?: boolean
        advanced?: boolean
    }
    promptTemplate: string
}

// 电商工具定义 (Dynamic Config)
const ECOMMERCE_TOOLS: ToolConfig[] = [
    { 
        id: 'text-to-image', 
        name: 'AI 文生图', 
        icon: Type,
        description: '纯文字描述生成电商场景图',
        inputs: {
            upload: undefined, // 不需要上传
            prompt: true,
            styleSelector: true,
            advanced: true
        },
        promptTemplate: ''
    },
    { 
        id: 'main-image', 
        name: 'AI 主图生成', 
        icon: ImageIcon,
        description: '一键生成电商主图，提升产品视觉',
        inputs: {
            upload: { label: '上传产品图', max: 1, required: true },
            prompt: true,
            styleSelector: true,
            advanced: true
        },
        promptTemplate: ''
    },
    { 
        id: 'background', 
        name: '智能换背景', 
        icon: Palette,
        description: '更换产品背景，适配各种场景',
        inputs: {
            upload: { label: '上传产品图', max: 1, required: true },
            prompt: true,
            styleSelector: true, // 使用场景预设作为 style
            advanced: true
        },
        promptTemplate: ''
    },
    { 
        id: 'model', 
        name: 'AI 换模特', 
        icon: Users,
        description: '虚拟模特试衣，省去拍摄成本',
        inputs: {
            upload: { label: '上传服装/产品图', max: 1, required: true },
            prompt: true,
            styleSelector: true, // 模特类型
            advanced: true
        },
        promptTemplate: ''
    },
    { 
        id: 'scene', 
        name: '场景合成', 
        icon: Layers,
        description: '产品置入真实场景，增强代入感',
        inputs: {
            upload: { label: '上传产品图', max: 1, required: true },
            prompt: true,
            styleSelector: true,
            advanced: true
        },
        promptTemplate: ''
    },
    {
        id: 'blend',
        name: '溶图融合',
        icon: Crop,
        description: '将产品图完美融合到场景图中',
        inputs: {
            upload: { max: 2, required: true, labels: ['上传产品图', '上传场景图'] },
            prompt: true,
            styleSelector: false,
            advanced: true
        },
        promptTemplate: ''
    },
    {
        id: 'retouch',
        name: '专业修图',
        icon: PenTool,
        description: '画质增强与细节修复',
        inputs: {
            upload: { label: '上传原图', max: 1, required: true },
            prompt: true,
            styleSelector: false,
            advanced: true
        },
        promptTemplate: ''
    },
    {
        id: 'wireframe',
        name: '线框生图',
        icon: Frame,
        description: '线框草图生成真实渲染图',
        inputs: {
            upload: { max: 2, required: true, labels: ['上传线框图', '上传产品参考 (选填)'] },
            prompt: true,
            styleSelector: true,
            advanced: true
        },
        promptTemplate: ''
    }
]

// 风格模板定义 (按工具分类)
const TOOL_STYLES: Record<EcommerceToolType, { id: string; name: string; prompt: string }[]> = {
    'main-image': [
        { id: 'minimal-studio', name: '极简摄影棚', prompt: 'Professional studio photography, clean solid color background (white or light grey), softbox lighting, high key, product focus, commercial aesthetic.' },
        { id: 'luxury-premium', name: '奢华黑金', prompt: 'Luxurious style, dark textured background, golden accent lighting, high contrast, dramatic shadows, premium reflection on surface.' },
        { id: 'natural-sunlight', name: '自然日光', prompt: 'Natural daylight setup, sun rays casting soft shadows, warm golden hour tones, organic inputs like leaves shadows, fresh and airy.' },
        { id: 'tech-futuristic', name: '科技未来', prompt: 'Futuristic technical style, neon lighting accents (cyan and magenta), sleek metallic surfaces, clean lines, suitable for electronics and gadgets.' },
        { id: 'creative-pop', name: '波普色彩', prompt: 'Vibrant pop art style, bold contrasting colors, geometric shapes background, energetic and youthful vibe.' },
        { id: 'soft-pastel', name: '柔和莫兰迪', prompt: 'Soft pastel color palette, matte textures, gentle diffused lighting, elegant and calming commercial photography.' },
    ],
    'background': [
        { id: 'marble-podium', name: '大理石展台', prompt: 'Placed on a polished white marble podium, clean luxury bathroom or counter environment, soft focus background.' },
        { id: 'wooden-table', name: '原木桌面', prompt: 'Placed on a natural oak wood table, rustic yet clean texture, warm ambient lighting, home interior feel.' },
        { id: 'water-ripple', name: '水面涟漪', prompt: 'Placed on a water surface with gentle ripples, fresh blue tones, crystal clear water reflections, refreshing vibe.' },
        { id: 'silk-fabric', name: '丝绸褶皱', prompt: 'Resting on elegant flowing silk fabric, champagne or soft pink color, luxurious folds and textures.' },
        { id: 'nature-stone', name: '自然岩石', prompt: 'Placed on natural grey stones or slate, outdoor nature setting, moss and greenery details, organic feel.' },
        { id: 'city-blurred', name: '城市虚化', prompt: 'Placed on a ledge with a blurred city skyline in the background, bokeh lights, urban lifestyle setting.' },
    ],
    'model': [
        { id: 'asian-female-daily', name: '亚洲女性-日常', prompt: 'Asian female model, porcelain skin, natural makeup, straight black hair, wearing casual comfortable clothing (white t-shirt and jeans), lifestyle setting.' },
        { id: 'western-female-elegance', name: '欧美女性-优雅', prompt: 'Caucasian female model, fair skin, wavy blonde hair, wearing elegant evening dress, professional studio fashion shoot.' },
        { id: 'asian-male-business', name: '亚洲男性-商务', prompt: 'Asian male model, short neat black hair, wearing professional business suit, confident expression, modern office background.' },
        { id: 'western-male-street', name: '欧美男性-街头', prompt: 'Caucasian male model, tanned skin, messy brown hair, wearing trendy streetwear, urban street background.' },
        { id: 'hand-closeup', name: '手部特写', prompt: 'Close-up of a hand holding the product, manicured nails, natural skin texture, blurred background to focus on product and hand interaction.' },
        { id: 'diverse-group', name: '多元化模特', prompt: 'Diverse group of models of different backgrounds, smiling and interacting naturally, inclusive lifestyle vibe.' },
    ],
    'scene': [
        { id: 'modern-kitchen', name: '现代厨房', prompt: 'Placed on a clean kitchen counter, marble surface, blurred kitchen appliances in background, morning light.' },
        { id: 'cozy-bedroom', name: '温馨卧室', prompt: 'Placed on a bedside table, warm lamp light, soft bedding textures in background, cozy evening atmosphere.' },
        { id: 'office-desk', name: '办公桌面', prompt: 'Placed on a modern desk, laptop and notebook in background, natural window light, productive workspace vibe.' },
        { id: 'bathroom-vanity', name: '浴室洗漱台', prompt: 'Placed on a bathroom vanity shelf, mirror reflection, clean towels and plants in background, spa-like atmosphere.' },
        { id: 'outdoor-camping', name: '户外露营', prompt: 'Placed on a camping table or rock, grass and tent in background, natural outdoor light, adventure vibe.' },
        { id: 'cafe-leisure', name: '咖啡午后', prompt: 'Placed on a cafe table, blurred coffee cup and window view in background, warm relaxing atmosphere.' },
    ],
    'text-to-image': [
        { id: 'photorealism', name: '真实摄影', prompt: 'Photorealistic style, 8k resolution, highly detailed, sharp focus.' },
        { id: '3d-render', name: '3D 渲染', prompt: '3D C4D style rendering, clean geometric shapes, soft lighting, occlusion render style.' },
        { id: 'advertising', name: '商业广告', prompt: 'Professional commercial advertising photography, creative composition, dramatic lighting.' },
    ],
    'blend': [],
    'retouch': [],
    'wireframe': [
       { id: 'minimal-white', name: '极简白底', prompt: 'Minimalist white background, studio lighting, clean product focus.' },
       { id: 'lifestyle-context', name: '生活场景', prompt: 'Product placed in a realistic lifestyle context, soft background blur.' },
    ]
}

// 比例预设
const ASPECT_RATIOS = [
    { id: '1:1', name: '1:1', label: '淘宝/天猫' },
    { id: '3:4', name: '3:4', label: '小红书' },
    { id: '9:16', name: '9:16', label: '抖音/快手' },
    { id: '16:9', name: '16:9', label: '横版海报' },
]

export default function EcommercePage() {
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const fileInputRef2 = useRef<HTMLInputElement>(null)

    // 用户状态
    const [user, setUser] = useState<User | null>(null)
    const [credits, setCredits] = useState(0)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // 工具状态
    const [activeTool, setActiveTool] = useState<EcommerceToolType>('text-to-image')
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
    const [aspectRatio, setAspectRatio] = useState('1:1')
    const [customPrompt, setCustomPrompt] = useState('')
    const [batchSize, setBatchSize] = useState(1)
    
    // 专业选项状态
    const [promptOptions, setPromptOptions] = useState<PromptOptions>({
        lighting: '',
        camera: '',
        material: '',
        scene: '',
        age: ''
    })

    // 图片状态
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [uploadedImage2, setUploadedImage2] = useState<string | null>(null)
    const [uploadedFile2, setUploadedFile2] = useState<File | null>(null)
    // 批量生成结果数组
    const [generatedImages, setGeneratedImages] = useState<string[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [generationProgress, setGenerationProgress] = useState(0)
    const [generationStage, setGenerationStage] = useState('')
    const [error, setError] = useState<string | null>(null)

    // 历史记录状态
    interface HistoryItem {
        id: string;
        imageBase64: string;
        prompt: string;
        toolType: string;
        createdAt: number;
    }
    const [historyImages, setHistoryImages] = useState<HistoryItem[]>([])
    const [showHistoryPanel, setShowHistoryPanel] = useState(false)

    // 检查用户登录状态
    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                setUser(user)
                
                if (user) {
                    const { data: creditsData } = await supabase
                        .from('user_credits')
                        .select('balance, daily_generations, last_daily_reset')
                        .eq('user_id', user.id)
                        .maybeSingle()
                    
                    if (creditsData) {
                         const now = new Date();
                         // UTC Date check for daily reset
                         let dailyUsed = creditsData.daily_generations || 0;
                         if (creditsData.last_daily_reset) {
                            const lastReset = new Date(creditsData.last_daily_reset);
                            const isSameDay = now.getUTCFullYear() === lastReset.getUTCFullYear() &&
                                now.getUTCMonth() === lastReset.getUTCMonth() &&
                                now.getUTCDate() === lastReset.getUTCDate();
                            if (!isSameDay) dailyUsed = 0;
                         }

                         // Strict Balance Display: Trust the DB balance.
                         // Backend handles daily resets/top-ups.
                         setCredits(creditsData.balance || 0);
                    }
                }
            } catch (error) {
                console.error('Error checking user:', error)
            } finally {
                setIsLoading(false)
            }
        }
        
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                setShowAuthModal(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // 切换工具时重置风格
    useEffect(() => {
        setSelectedStyle(null)
    }, [activeTool])

    // IndexedDB 历史记录工具函数
    const DB_NAME = 'PikaDesignHistory'
    const STORE_NAME = 'generations'
    const MAX_HISTORY = 50

    const openDB = (): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' })
                }
            }
        })
    }

    const saveToHistory = async (item: Omit<HistoryItem, 'id' | 'createdAt'>) => {
        try {
            const db = await openDB()
            const tx = db.transaction(STORE_NAME, 'readwrite')
            const store = tx.objectStore(STORE_NAME)
            
            const newItem: HistoryItem = {
                ...item,
                id: Date.now().toString(),
                createdAt: Date.now()
            }
            store.add(newItem)
            
            // 限制历史数量
            const allItems = await new Promise<HistoryItem[]>((resolve) => {
                const allReq = store.getAll()
                allReq.onsuccess = () => resolve(allReq.result)
            })
            
            if (allItems.length > MAX_HISTORY) {
                const toDelete = allItems.slice(0, allItems.length - MAX_HISTORY)
                toDelete.forEach(item => store.delete(item.id))
            }
            
            db.close()
            loadHistoryFromDB()
        } catch (err) {
            console.error('Failed to save history:', err)
        }
    }

    const loadHistoryFromDB = async () => {
        try {
            const db = await openDB()
            const tx = db.transaction(STORE_NAME, 'readonly')
            const store = tx.objectStore(STORE_NAME)
            const allReq = store.getAll()
            allReq.onsuccess = () => {
                const items = (allReq.result as HistoryItem[]).sort((a, b) => b.createdAt - a.createdAt)
                setHistoryImages(items)
            }
            db.close()
        } catch (err) {
            console.error('Failed to load history:', err)
        }
    }

    // 页面加载时读取历史记录
    useEffect(() => {
        loadHistoryFromDB()
    }, [])

    // 使用历史图片作为样图
    const handleUseAsReference = (imageBase64: string) => {
        setUploadedImage(imageBase64)
        setShowHistoryPanel(false)
    }

    // 文件上传处理
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number = 0) => {
        const file = e.target.files?.[0]
        if (!file) return

        setError(null)
        
        if (index === 0) {
            setUploadedFile(file)
            const reader = new FileReader()
            reader.onload = (event) => {
                setUploadedImage(event.target?.result as string)
                setGeneratedImages([])
            }
            reader.readAsDataURL(file)
        } else {
            setUploadedFile2(file)
            const reader = new FileReader()
            reader.onload = (event) => {
                setUploadedImage2(event.target?.result as string)
                // setGeneratedImages([]) // Changing second image doesn't necessarily need to clear results if it's optional
            }
            reader.readAsDataURL(file)
        }
    }

    // 拖拽上传
    const handleDrop = (e: React.DragEvent, index: number = 0) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file && file.type.startsWith('image/')) {
            setError(null)
            
            if (index === 0) {
                setUploadedFile(file)
                const reader = new FileReader()
                reader.onload = (event) => {
                    setUploadedImage(event.target?.result as string)
                    setGeneratedImages([])
                }
                reader.readAsDataURL(file)
            } else {
                setUploadedFile2(file)
                const reader = new FileReader()
                reader.onload = (event) => {
                    setUploadedImage2(event.target?.result as string)
                }
                reader.readAsDataURL(file)
            }
        }
    }

    // 构建完整提示词
    const buildFullPrompt = (): string => {
        const tool = ECOMMERCE_TOOLS.find(t => t.id === activeTool)
        let prompt = tool?.promptTemplate || ''

        // 1. 添加风格模板
        if (selectedStyle && TOOL_STYLES[activeTool as keyof typeof TOOL_STYLES]) {
            const styles = TOOL_STYLES[activeTool as keyof typeof TOOL_STYLES]
            const style = styles.find(s => s.id === selectedStyle)
            if (style) {
                prompt += ` ${style.prompt}`
            }
        }

        // 2. 添加专业选项 (Lighting, Camera, Material, Scene, Age)
        if (promptOptions.lighting) prompt += `, ${promptOptions.lighting}`
        if (promptOptions.camera) prompt += `, ${promptOptions.camera}`
        if (promptOptions.material) prompt += `, material: ${promptOptions.material}`
        if (promptOptions.scene) prompt += `, background scene: ${promptOptions.scene}`
        if (activeTool === 'model' && promptOptions.age) prompt += `, model age: ${promptOptions.age}`

        // 3. 强制专业画质后缀 (Removed per user request for no hidden prompts)
        // prompt += `, high quality, 8k resolution, ultra-detailed`

        // 4. 添加用户自定义描述
        if (customPrompt.trim()) {
            prompt += ` Additional requirements: ${customPrompt.trim()}`
        }

        // 5. 添加比例说明
        const ratio = ASPECT_RATIOS.find(r => r.id === aspectRatio)
        if (ratio) {
            prompt += ` Output aspect ratio: ${ratio.name}.`
        }

        return prompt
    }

    // 生成图片（支持批量）
    const handleGenerate = async () => {
        if (!user) {
            setShowAuthModal(true)
            return
        }

        const currentToolConfig = ECOMMERCE_TOOLS.find(t => t.id === activeTool)
        
        // 校验逻辑：
        // 如果 required 为 true:
        //   - max=1: 必须有 uploadedFile
        //   - max=2: 必须至少有 uploadedFile (Slot 1)
        if (currentToolConfig?.inputs.upload?.required) {
             const isDual = (currentToolConfig.inputs.upload.max || 1) > 1;
             if (!uploadedFile) {
                 // Even for dual upload, we treat the first slot as the primary "must have" for now,
                 // or at least one of them. Let's start with enforcing Slot 1 as primary.
                 setError('请至少上传一张主图')
                 return
             }
        }

        const totalCost = 3 * batchSize
        if (credits < totalCost) {
            router.push('/pricing')
            return
        }

        setIsGenerating(true)
        setError(null)
        setGenerationProgress(0)
        setGeneratedImages([]) // 清空旧结果

        try {
            // 1. 上传图片到 Supabase Storage (如果有上传文件)
            let publicUrl = ''
            
            if (uploadedFile) {
                setGenerationStage('正在上传主图...')
                setGenerationProgress(5)

                const fileExt = uploadedFile.name.split('.').pop()
                const fileName = `${user.id}/ecommerce-${Date.now()}-1.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('user-uploads')
                    .upload(fileName, uploadedFile)

                if (uploadError) {
                    throw new Error('主图上传失败: ' + uploadError.message)
                }

                const { data } = supabase.storage
                    .from('user-uploads')
                    .getPublicUrl(fileName)
                
                publicUrl = data.publicUrl
            }

            // Upload Second Image if exists
            let publicUrl2 = ''
            if (uploadedFile2) {
                setGenerationStage('正在上传第二张图...')
                setGenerationProgress(8)
                
                const fileExt = uploadedFile2.name.split('.').pop()
                const fileName = `${user.id}/ecommerce-${Date.now()}-2.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('user-uploads')
                    .upload(fileName, uploadedFile2)

                 if (uploadError) {
                    throw new Error('第二张图上传失败: ' + uploadError.message)
                }

                const { data } = supabase.storage
                    .from('user-uploads')
                    .getPublicUrl(fileName)
                
                publicUrl2 = data.publicUrl
            }

            // 2. 批量调用 API
            setGenerationStage(`AI 正在创作 (共 ${batchSize} 张)...`)
            
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('请先登录')

            const fullPrompt = buildFullPrompt()
            
            const newImages: string[] = []
            
            // 串行或并行调用？为了更好的进度反馈和错误处理，这里使用串行
            let lastErrorMsg = '';
            
            // 批量生成循环
            for (let i = 0; i < batchSize; i++) {
                try {
                    setGenerationProgress(Math.round(((i) / batchSize) * 90))
                    setGenerationStage(`正在生成第 ${i + 1}/${batchSize} 张...`)

                    const response = await fetch('/api/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({
                            prompt: fullPrompt,
                            image_url: publicUrl,
                            image_url_2: publicUrl2,
                            type: activeTool,
                            settings: {
                                resolution: '1K',
                                aspectRatio: aspectRatio,
                                sceneType: 'product'
                            }
                        })
                    })

                    const data = await response.json()
                    if (!response.ok) throw new Error(data.error || '生成失败')
                    
                    if (data.image_url) {
                        newImages.push(data.image_url)
                        // 实时更新显示的图片列表（追加模式）
                        setGeneratedImages(prev => [...prev, data.image_url])
                        
                        // 更新积分
                        if (data.remaining_credits !== undefined) {
                            setCredits(data.remaining_credits)
                        }
                        
                        // 保存到历史记录
                        saveToHistory({
                            imageBase64: data.image_url,
                            prompt: fullPrompt,
                            toolType: activeTool
                        })
                    }
                } catch (err: any) {
                    console.error(`第 ${i+1} 张生成失败:`, err)
                    lastErrorMsg = err.message;
                    if (batchSize === 1) throw err; // 如果只生成一张，直接抛出错误
                    // 多张时继续尝试下一张，记录错误
                }
            }

            setGenerationProgress(100)
            setGenerationStage('生成完成！')

            if (newImages.length === 0) {
                throw new Error(lastErrorMsg || '生成失败，请重试')
            }

        } catch (err: any) {
            console.error('Generation error:', err)
            setError(err.message || '生成失败，请重试')
        } finally {
            setIsGenerating(false)
            setTimeout(() => {
                setGenerationProgress(0)
                setGenerationStage('')
            }, 2000)
        }
    }

    // 下载图片
    const handleDownload = async (imageUrl: string) => {
        try {
            let blob: Blob
            if (imageUrl.startsWith('data:')) {
                const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/)
                if (matches) {
                    const byteCharacters = atob(matches[2])
                    const byteNumbers = new Array(byteCharacters.length)
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i)
                    }
                    blob = new Blob([new Uint8Array(byteNumbers)], { type: matches[1] })
                } else {
                    throw new Error('Invalid data URI')
                }
            } else {
                const response = await fetch(imageUrl)
                blob = await response.blob()
            }

            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `pika-ecommerce-${Date.now()}.png`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            console.error('Download error:', err)
        }
    }

    // 批量下载
    const handleBatchDownload = async () => {
        for (let i = 0; i < generatedImages.length; i++) {
            await handleDownload(generatedImages[i])
            // 简单的延时防止浏览器拦截频繁下载
            await new Promise(resolve => setTimeout(resolve, 500))
        }
    }

    // ... (existing code)

    // 新增状态：预览与下载
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [downloadTargetUrl, setDownloadTargetUrl] = useState<string | null>(null)
    const [isConverting, setIsConverting] = useState(false)

    // 执行下载（格式转换核心逻辑）
    const downloadAsFormat = async (format: 'png' | 'jpg') => {
        if (!downloadTargetUrl) return
        
        setIsConverting(true)
        try {
            // 1. 获取图片 Blob
            let blob: Blob
            if (downloadTargetUrl.startsWith('data:')) {
                const arr = downloadTargetUrl.split(',')
                const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
                const bstr = atob(arr[1])
                let n = bstr.length
                const u8arr = new Uint8Array(n)
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n)
                }
                blob = new Blob([u8arr], { type: mime })
            } else {
                const response = await fetch(downloadTargetUrl)
                blob = await response.blob()
            }

            // 2. 如果是 JPG，需要 Canvas 转换
            if (format === 'jpg') {
                const imgBitmap = await createImageBitmap(blob)
                const canvas = document.createElement('canvas')
                canvas.width = imgBitmap.width
                canvas.height = imgBitmap.height
                const ctx = canvas.getContext('2d')
                
                if (ctx) {
                    // 填充白色背景（防止透明变黑）
                    ctx.fillStyle = '#FFFFFF'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    ctx.drawImage(imgBitmap, 0, 0)
                    
                    const jpgDataUrl = canvas.toDataURL('image/jpeg', 1.0)
                    const link = document.createElement('a')
                    link.href = jpgDataUrl
                    link.download = `pika-ecommerce-${Date.now()}.jpg`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                }
            } else {
                // PNG 直接下载
                const blobWithMime = new Blob([blob], { type: 'image/png' })
                const url = window.URL.createObjectURL(blobWithMime)
                const a = document.createElement('a')
                a.style.display = 'none'
                a.href = url
                a.download = `pika-ecommerce-${Date.now()}.png`
                document.body.appendChild(a)
                a.click()
                
                // 延迟释放，确保下载已开始
                setTimeout(() => {
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                }, 1000)
            }
            
            setDownloadTargetUrl(null) // 下载完成后关闭弹窗
        } catch (err) {
            console.error('Download error:', err)
            // 可以加个 toast 提示
        } finally {
            setIsConverting(false)
        }
    }

    // 覆盖旧的 handleDownload
    const openDownloadModal = (imageUrl: string) => {
        setDownloadTargetUrl(imageUrl)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#05050A]">
            {/* ... (Existing Navbar & Content) ... */}
            
            {/* 顶部工具栏 */}
            <div className="sticky top-16 z-40 bg-[#05050A]/95 backdrop-blur-md border-b border-white/10">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        {/* 工具选择 */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                            {ECOMMERCE_TOOLS.map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => setActiveTool(tool.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                                        activeTool === tool.id
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <tool.icon className="w-4 h-4" />
                                    {tool.name}
                                </button>
                            ))}
                        </div>

                        {/* 用户状态 */}
                        <div className="flex items-center gap-4">
                            {/* 历史记录按钮 */}
                            <button
                                onClick={() => setShowHistoryPanel(true)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                title="生成历史"
                            >
                                <Clock className="w-4 h-4" />
                                <span className="text-sm hidden md:inline">历史记录</span>
                                {historyImages.length > 0 && (
                                    <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">
                                        {historyImages.length}
                                    </span>
                                )}
                            </button>
                            
                            {user ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                                    <Zap className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm text-white font-medium">{credits}</span>
                                    <span className="text-xs text-slate-500">可用积分</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                                >
                                    <LogIn className="w-4 h-4" />
                                    登录
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 主内容区：左右分屏 */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
                    
                    {/* 左侧：上传与配置区 */}
                    <div className="flex flex-col gap-6">
                        {/* 上传区域 */}
                        {/* 上传区域 (Dynamic Rendering) */}
                        {/* 上传区域 (Dynamic Rendering) */}
                        {(() => {
                            const toolConfig = ECOMMERCE_TOOLS.find(t => t.id === activeTool);
                            const uploadConfig = toolConfig?.inputs.upload;

                            if (!uploadConfig) return null;

                            const isDual = (uploadConfig.max || 1) > 1;
                            const labels = uploadConfig.labels || [uploadConfig.label || '上传图片'];

                            return (
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Camera className="w-5 h-5 text-purple-400" />
                                        {isDual ? '上传图片素材' : (uploadConfig.label || '上传图片')}
                                    </h3>
                                    
                                    <div className={`grid gap-4 ${isDual ? 'grid-cols-2 h-[300px]' : 'grid-cols-1 h-[400px]'}`}>
                                        {/* Slot 1 */}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDrop={(e) => handleDrop(e, 0)}
                                            onDragOver={(e) => e.preventDefault()}
                                            className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group ${
                                                uploadedImage 
                                                    ? 'border-purple-500/50 bg-purple-500/5' 
                                                    : 'border-white/10 hover:border-purple-500/30 bg-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            {uploadedImage ? (
                                                <div className="relative w-full h-full">
                                                    <img 
                                                        src={uploadedImage} 
                                                        alt="Uploaded 1" 
                                                        className="w-full h-full object-contain"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setUploadedImage(null)
                                                            setUploadedFile(null)
                                                            if (!isDual) setGeneratedImages([])
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full p-4">
                                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                                                        <Upload className="w-6 h-6 text-purple-400" />
                                                    </div>
                                                    <p className="text-white font-medium text-center text-sm mb-1">{labels[0] || '上传主图'}</p>
                                                    <p className="text-xs text-slate-500 text-center">支持 JPG / PNG / WEBP</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Slot 2 (Conditional) */}
                                        {isDual && (
                                            <div
                                                onClick={() => fileInputRef2.current?.click()}
                                                onDrop={(e) => handleDrop(e, 1)}
                                                onDragOver={(e) => e.preventDefault()}
                                                className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group ${
                                                    uploadedImage2 
                                                        ? 'border-purple-500/50 bg-purple-500/5' 
                                                        : 'border-white/10 hover:border-purple-500/30 bg-white/5 hover:bg-white/10'
                                                }`}
                                            >
                                                {uploadedImage2 ? (
                                                    <div className="relative w-full h-full">
                                                        <img 
                                                            src={uploadedImage2} 
                                                            alt="Uploaded 2" 
                                                            className="w-full h-full object-contain"
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setUploadedImage2(null)
                                                                setUploadedFile2(null)
                                                            }}
                                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full p-4">
                                                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                                                            <Upload className="w-6 h-6 text-purple-400" />
                                                        </div>
                                                        <p className="text-white font-medium text-center text-sm mb-1">{labels[1] || '上传参考图 (选填)'}</p>
                                                        <p className="text-xs text-slate-500 text-center">选填</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 0)}
                                        className="hidden"
                                    />
                                    {isDual && (
                                        <input
                                            ref={fileInputRef2}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 1)}
                                            className="hidden"
                                        />
                                    )}
                                </div>
                            );
                        })()}
                        
                        {/* 文生图专用提示区 (当没有上传区时显示) */}
                        {!ECOMMERCE_TOOLS.find(t => t.id === activeTool)?.inputs.upload && (
                            <div className="flex-1 min-h-[200px] bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl border border-purple-500/20 p-8 flex flex-col justify-center items-center text-center">
                                <Sparkles className="w-12 h-12 text-purple-400 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">AI 创意工坊</h3>
                                <p className="text-slate-400 max-w-sm">
                                    无需底图，直接通过下方"专业设置"和"提示词"构建您心目中的电商大片。
                                </p>
                            </div>
                        )}

                        {/* 配置区域 */}
                        <div className="space-y-6">
                            {/* 风格模板选择 */}
                            {/* 风格模板选择 */}
                            {ECOMMERCE_TOOLS.find(t => t.id === activeTool)?.inputs.styleSelector && TOOL_STYLES[activeTool as keyof typeof TOOL_STYLES] && (
                                <div>
                                    <h4 className="text-sm font-medium text-slate-400 mb-3">
                                        风格模板 <span className="text-xs text-slate-600">({ECOMMERCE_TOOLS.find(t=>t.id===activeTool)?.name})</span>
                                    </h4>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                        {TOOL_STYLES[activeTool as keyof typeof TOOL_STYLES]?.map(style => (
                                            <button
                                                key={style.id}
                                                onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-left truncate ${
                                                    selectedStyle === style.id
                                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                                                }`}
                                            >
                                                {style.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 专业 Prompt 构建器 (Advanced Options) */}
                            {ECOMMERCE_TOOLS.find(t => t.id === activeTool)?.inputs.advanced && (
                                <PromptBuilder 
                                    options={promptOptions} 
                                    onChange={setPromptOptions}
                                    showAgeSelector={activeTool === 'model'}
                                />
                            )}

                            {/* 比例与数量 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-400 mb-3">输出比例</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {ASPECT_RATIOS.map(ratio => (
                                            <button
                                                key={ratio.id}
                                                onClick={() => setAspectRatio(ratio.id)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    aspectRatio === ratio.id
                                                        ? 'bg-pink-600 text-white'
                                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                                                }`}
                                            >
                                                {ratio.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center justify-between">
                                        <span>生成数量</span>
                                        <span className="text-xs text-purple-400 font-bold">{batchSize} 张</span>
                                    </h4>
                                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="7" 
                                            step="1"
                                            value={batchSize}
                                            onChange={(e) => setBatchSize(parseInt(e.target.value))}
                                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">消耗 {batchSize * 3} 积分</p>
                                </div>
                            </div>

                            {/* 自定义描述 */}
                            <div>
                                <h4 className="text-sm font-medium text-slate-400 mb-3">补充描述 (可选)</h4>
                                <input
                                    type="text"
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="例如：模特穿白色T恤，背景是海边..."
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                                />
                            </div>

                            {/* 生成按钮 */}
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || (ECOMMERCE_TOOLS.find(t=>t.id===activeTool)?.inputs.upload?.required && !uploadedImage)}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                                    isGenerating || (ECOMMERCE_TOOLS.find(t=>t.id===activeTool)?.inputs.upload?.required && !uploadedImage)
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20'
                                }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        生成中 ({generationProgress}%)
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        批量生成
                                        <span className="text-sm opacity-70 ml-2">({batchSize} 张 / {batchSize * 3} 积分)</span>
                                    </>
                                )}
                            </button>
                            
                             {/* 错误提示 */}
                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 右侧：生成结果区 (网格布局) */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-pink-400" />
                                生成结果 ({generatedImages.length})
                            </div>
                            {/* 批量下载先隐藏，等单独下载这块逻辑稳了再说，或者也改成可以弹窗选 */}
                        </h3>
                        
                        <div className={`flex-1 rounded-2xl border transition-all overflow-hidden relative ${
                            generatedImages.length > 0
                                ? 'border-pink-500/50 bg-pink-500/5' 
                                : 'border-white/10 bg-white/5'
                        }`}>
                            {generatedImages.length > 0 ? (
                                <div className="p-4 h-full overflow-y-auto max-h-[800px]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {generatedImages.map((imgUrl, idx) => (
                                            <div key={idx} className="relative group rounded-xl overflow-hidden bg-black/50 aspect-square">
                                                <img 
                                                    src={imgUrl} 
                                                    alt={`Generated ${idx + 1}`} 
                                                    className="w-full h-full object-contain"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setPreviewUrl(imgUrl)}
                                                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                                                        title="预览"
                                                    >
                                                        <ImageIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDownloadModal(imgUrl)}
                                                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                                                        title="下载"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded-md text-xs text-white">
                                                    #{idx + 1}
                                                </div>
                                            </div>
                                        ))}
                                        {/* 如果正在生成且有未完成的占位 */}
                                        {isGenerating && generatedImages.length < batchSize && (
                                            <div className="rounded-xl bg-white/5 border border-white/10 border-dashed flex items-center justify-center aspect-square">
                                                <Loader2 className="w-8 h-8 text-pink-500/50 animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
                                    {isGenerating ? (
                                        <>
                                            <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mb-4" />
                                            <p className="text-white font-medium mb-2">{generationStage || 'AI 正在创作...'}</p>
                                            <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                                    style={{ width: `${generationProgress}%` }}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
                                                <Palette className="w-8 h-8 text-pink-400" />
                                            </div>
                                            <p className="text-white font-medium mb-2">生成的图片将显示在这里</p>
                                            <p className="text-sm text-slate-500">上传产品图后点击生成</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 登录弹窗 */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            {/* 图片预览 Modal */}
            {previewUrl && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewUrl(null)}
                >
                    <button 
                        onClick={() => setPreviewUrl(null)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        <div className="absolute bottom-[-50px] left-1/2 -translate-x-1/2 flex gap-4">
                             <button
                                onClick={() => {
                                    setPreviewUrl(null)
                                    openDownloadModal(previewUrl)
                                }}
                                className="px-6 py-2 rounded-full bg-white text-black font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                下载此图
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 下载选项 Modal */}
            {downloadTargetUrl && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => !isConverting && setDownloadTargetUrl(null)}
                >
                    <div 
                        className="bg-[#1a1a24] rounded-2xl w-full max-w-sm p-6 border border-white/10 shadow-2xl scale-in" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">选择下载格式</h3>
                            <button 
                                onClick={() => setDownloadTargetUrl(null)}
                                disabled={isConverting}
                                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => downloadAsFormat('png')}
                                disabled={isConverting}
                                className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs uppercase border border-blue-500/20">
                                        PNG
                                    </div>
                                    <div className="text-left">
                                        <div className="text-white font-medium">无损原图 (PNG)</div>
                                        <div className="text-xs text-slate-500">最佳画质，透明背景</div>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                            </button>
                            <button
                                onClick={() => downloadAsFormat('jpg')}
                                disabled={isConverting}
                                className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold text-xs uppercase border border-orange-500/20">
                                        JPG
                                    </div>
                                    <div className="text-left">
                                        <div className="text-white font-medium">高品质 (JPG)</div>
                                        <div className="text-xs text-slate-500">最高质量，通用性强</div>
                                    </div>
                                </div>
                                {isConverting ? (
                                    <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                                ) : (
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 历史记录侧边栏 */}
            {showHistoryPanel && (
                <div className="fixed inset-0 z-50">
                    {/* 背景遮罩 */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowHistoryPanel(false)}
                    />
                    
                    {/* 侧边栏面板 */}
                    <div className="absolute right-0 top-0 h-full w-[400px] max-w-full bg-[#0d0d14] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right">
                        {/* 头部 */}
                        <div className="p-6 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/20">
                                        <Clock className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">生成历史</h2>
                                        <p className="text-xs text-slate-500">{historyImages.length} 张图片</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowHistoryPanel(false)}
                                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        {/* 历史图片列表 */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {historyImages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                    <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                                    <p>暂无生成记录</p>
                                    <p className="text-xs mt-1">生成的图片会自动保存在这里</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {historyImages.map((item) => (
                                        <div 
                                            key={item.id}
                                            className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all"
                                        >
                                            <img 
                                                src={item.imageBase64} 
                                                alt="历史图片"
                                                className="w-full aspect-square object-cover"
                                            />
                                            {/* 悬浮操作层 */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUseAsReference(item.imageBase64)}
                                                        className="flex-1 py-1.5 px-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
                                                    >
                                                        作为样图
                                                    </button>
                                                    <button
                                                        onClick={() => openDownloadModal(item.imageBase64)}
                                                        className="py-1.5 px-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {/* 时间标签 */}
                                            <div className="absolute top-2 left-2 text-[10px] bg-black/50 text-slate-300 px-1.5 py-0.5 rounded">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

