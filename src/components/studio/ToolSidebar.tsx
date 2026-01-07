"use client"

import { Image as ImageIcon, Sparkles, Scissors, UserSquare2, Zap, Focus, Eraser, Palette, Lightbulb } from 'lucide-react'
import clsx from 'clsx'
import { useState, useEffect } from 'react'

type ToolType = 'background' | 'model' | 'upscale' | 'enhance' | 'remove-watermark' | 'cutout' | 'erase'

interface ToolSidebarProps {
    activeTool: ToolType
    setActiveTool: (tool: ToolType) => void
    isGenerating: boolean
    onGenerate: (prompt: string) => void
    mode?: 'tools' | 'ecommerce'
}

// 每个工具的配置：提示词占位符 + 示例
const toolConfigs: Record<string, {
    icon: typeof Focus
    title: string
    desc: string
    placeholder: string
    examples: string[]
    systemPrompt: string // 后端会拼接的系统提示词前缀
}> = {
    // AI 修图工具箱
    'enhance': {
        icon: Focus,
        title: '变清晰/放大',
        desc: 'AI 增强图片清晰度，4K输出',
        placeholder: '可选：描述你想要的清晰度效果...',
        examples: [
            '放大2倍，保持细节清晰',
            '修复模糊，增强锐度',
            '提升到4K分辨率',
        ],
        systemPrompt: 'Enhance image quality, improve sharpness and details.'
    },
    'remove-watermark': {
        icon: Eraser,
        title: '去水印',
        desc: '智能识别并移除水印',
        placeholder: '描述水印的位置或特征...',
        examples: [
            '去除右下角的白色水印文字',
            '移除图片中间的半透明logo',
            '消除左上角的日期时间戳',
        ],
        systemPrompt: 'Remove watermark from the image, restore the original background seamlessly.'
    },
    'cutout': {
        icon: Scissors,
        title: '智能抠图',
        desc: '一键抠出主体，透明背景',
        placeholder: '可选：指定要保留的主体...',
        examples: [
            '只保留人物，去除背景',
            '抠出产品，背景透明',
            '保留前景的花瓶和花朵',
        ],
        systemPrompt: 'Extract the main subject from the image with transparent background.'
    },
    'erase': {
        icon: Sparkles,
        title: '涂抹消除',
        desc: '选中区域智能消除填充',
        placeholder: '描述要消除的内容和位置...',
        examples: [
            '消除画面左侧的路人',
            '移除背景中的电线杆',
            '去掉桌上多余的杂物',
        ],
        systemPrompt: 'Remove the specified object from the image and fill with surrounding context.'
    },
    // 电商设计中心
    'background': {
        icon: Palette,
        title: '智能换背景',
        desc: '替换为专业场景或纯色背景',
        placeholder: '描述你想要的背景效果...',
        examples: [
            '白色大理石桌面，柔和的自然光',
            '简约纯白背景，专业电商风格',
            '温馨的木质书桌，绿植装饰',
            '高级灰渐变背景，聚光灯效果',
        ],
        systemPrompt: 'Replace the background of the product image with:'
    },
    'model': {
        icon: UserSquare2,
        title: 'AI 换模特',
        desc: '将人台/假模换成真人模特',
        placeholder: '描述模特的特征...',
        examples: [
            '亚洲女性，20-25岁，自然妆容',
            '欧美男性，运动型身材，阳光形象',
            '中年女性，优雅气质，商务风格',
        ],
        systemPrompt: 'Replace the mannequin with a real human model:'
    },
    'upscale': {
        icon: ImageIcon,
        title: 'AI主图生成',
        desc: '根据描述生成电商主图',
        placeholder: '详细描述你想要的主图效果...',
        examples: [
            '高端护肤品主图，白色背景，水滴飞溅效果',
            '运动鞋场景图，户外跑道背景，动感光影',
            '美食主图，俯拍角度，暖色调光线',
        ],
        systemPrompt: 'Generate a professional e-commerce product image:'
    },
}

export function ToolSidebar({ activeTool, setActiveTool, isGenerating, onGenerate, mode = 'ecommerce' }: ToolSidebarProps) {
    const [prompt, setPrompt] = useState('')

    const toolIds = mode === 'tools'
        ? ['enhance', 'remove-watermark', 'cutout', 'erase']
        : ['background', 'model', 'upscale']

    const currentConfig = toolConfigs[activeTool]

    // 当工具切换时，清空提示词
    useEffect(() => {
        setPrompt('')
    }, [activeTool])

    const handleExampleClick = (example: string) => {
        setPrompt(example)
    }

    return (
        <aside className="w-80 border-r border-white/5 bg-[#0d0d14] flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        {mode === 'tools' ? (
                            <Sparkles className="w-4 h-4 text-white" />
                        ) : (
                            <Zap className="w-4 h-4 text-white" />
                        )}
                    </div>
                    <div>
                        <h2 className="font-bold text-white">
                            {mode === 'tools' ? 'AI 修图工具箱' : '电商设计中心'}
                        </h2>
                        <p className="text-xs text-slate-500">Pro 级模型 · 极致效果</p>
                    </div>
                </div>
            </div>

            {/* Tools List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {toolIds.map((toolId) => {
                    const config = toolConfigs[toolId]
                    return (
                        <ToolButton
                            key={toolId}
                            isActive={activeTool === toolId}
                            onClick={() => setActiveTool(toolId as ToolType)}
                            icon={<config.icon className="w-5 h-5" />}
                            title={config.title}
                            desc={config.desc}
                        />
                    )
                })}
            </div>

            {/* Action Area with Dynamic Prompts */}
            <div className="p-6 border-t border-white/5 bg-[#0a0a0f]">
                {/* Prompt Examples */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        <label className="text-xs font-medium text-slate-400">
                            提示词参考 (点击使用)
                        </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {currentConfig?.examples.slice(0, 3).map((example, index) => (
                            <button
                                key={index}
                                onClick={() => handleExampleClick(example)}
                                className="text-xs px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20 truncate max-w-full"
                                title={example}
                            >
                                {example.length > 15 ? example.slice(0, 15) + '...' : example}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Prompt Input */}
                <div className="mb-4">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                        效果描述
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="input-field resize-none h-24 text-sm"
                        placeholder={currentConfig?.placeholder || '描述你想要的效果...'}
                    />
                </div>

                <button
                    onClick={() => onGenerate(prompt)}
                    disabled={isGenerating}
                    className={clsx(
                        "w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                        isGenerating
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "btn-primary"
                    )}
                >
                    {isGenerating ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            处理中...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4" />
                            开始生成
                        </>
                    )}
                </button>

                <p className="text-xs text-slate-600 text-center mt-3">
                    使用 Pika AI Pro 模型
                </p>
            </div>
        </aside>
    )
}

function ToolButton({ isActive, onClick, icon, title, desc }: { isActive: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div
            onClick={onClick}
            className={clsx(
                "p-4 rounded-xl cursor-pointer border transition-all duration-200 group",
                isActive
                    ? "border-indigo-500/50 bg-indigo-500/10"
                    : "border-white/5 hover:border-white/10 hover:bg-white/5"
            )}
        >
            <div className="flex items-start gap-4">
                <div className={clsx(
                    "p-2.5 rounded-xl transition-all",
                    isActive
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                        : "bg-white/5 text-slate-400 group-hover:text-white"
                )}>
                    {icon}
                </div>
                <div>
                    <h3 className={clsx(
                        "font-semibold text-sm",
                        isActive ? "text-white" : "text-slate-300"
                    )}>
                        {title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
                </div>
            </div>
        </div>
    )
}

// 导出工具配置供后端使用
export { toolConfigs }
