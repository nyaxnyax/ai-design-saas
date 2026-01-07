"use client"

import { useState } from 'react'
import {
    LogoGeometricN,
    LogoNeonN,
    LogoMinimalN,
    LogoCubicN,
    LogoTechN,
    LogoWaveN
} from '@/components/logo/LetterNLogo'
import { Sparkles } from 'lucide-react'

const logoStyles = [
    {
        name: '几何现代 (Geometric)',
        component: LogoGeometricN,
        description: '简洁几何线条，现代感强'
    },
    {
        name: '霓虹发光 (Neon)',
        component: LogoNeonN,
        description: '发光效果，适合暗色主题'
    },
    {
        name: '极简主义 (Minimal)',
        component: LogoMinimalN,
        description: '一笔连贯，简约优雅'
    },
    {
        name: '立方体 (3D Cubic)',
        component: LogoCubicN,
        description: '等距3D效果，立体感强'
    },
    {
        name: '科技点阵 (Tech)',
        component: LogoTechN,
        description: '点阵风格，科技感'
    },
    {
        name: '波浪流动 (Wave)',
        component: LogoWaveN,
        description: '柔和曲线，流动感'
    }
]

// Original logo with Sparkles icon
function OriginalLogo() {
    return (
        <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl rotate-6 opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
            </div>
            <span className="text-xl font-bold text-white">
                Design<span className="gradient-text">AI</span>
            </span>
        </div>
    )
}

// Preview card component showing logo in navbar context
function NavbarPreview({ LogoComponent, logoName }: { LogoComponent: React.ComponentType<{ className?: string }>, logoName: string }) {
    return (
        <div className="bg-[#0d0d14] border border-white/10 rounded-xl overflow-hidden">
            {/* Fake Navbar */}
            <div className="h-16 border-b border-white/5 flex items-center px-4 gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10">
                        <LogoComponent className="w-full h-full" />
                    </div>
                    <span className="text-lg font-bold text-white">
                        Design<span className="text-indigo-400">AI</span>
                    </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-400">
                    <span>功能介绍</span>
                    <span>价格方案</span>
                    <span>案例展示</span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">U</span>
                </div>
            </div>
            {/* Fake content area */}
            <div className="p-6 text-center text-slate-500 text-sm">
                这是 {logoName} 在导航栏中的实际效果
            </div>
        </div>
    )
}

export default function LogoLivePreviewPage() {
    const [selectedStyle, setSelectedStyle] = useState(0)

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#05050A] to-[#0a0a0f] py-12 px-4">
            <div className="container mx-auto max-w-6xl">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-white mb-3">
                        Logo 实际效果预览
                    </h1>
                    <p className="text-slate-400">
                        点击下方不同风格，查看在网站导航栏中的实际效果
                    </p>
                </div>

                {/* Style Selector */}
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                    {logoStyles.map((style, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedStyle(index)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedStyle === index
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                        >
                            {style.name}
                        </button>
                    ))}
                    <button
                        onClick={() => setSelectedStyle(-1)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedStyle === -1
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                    >
                        原版 (Sparkles)
                    </button>
                </div>

                {/* Main Preview */}
                <div className="mb-10">
                    {selectedStyle === -1 ? (
                        <div className="bg-[#0d0d14] border border-white/10 rounded-xl overflow-hidden">
                            <div className="h-16 border-b border-white/5 flex items-center px-4 gap-6">
                                <OriginalLogo />
                                <div className="flex items-center gap-6 text-sm text-slate-400">
                                    <span>功能介绍</span>
                                    <span>价格方案</span>
                                    <span>案例展示</span>
                                </div>
                                <div className="ml-auto flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">U</span>
                                </div>
                            </div>
                            <div className="p-6 text-center text-slate-500 text-sm">
                                当前使用的是 Sparkles 星星图标
                            </div>
                        </div>
                    ) : (
                        <NavbarPreview
                            LogoComponent={logoStyles[selectedStyle].component}
                            logoName={logoStyles[selectedStyle].name}
                        />
                    )}
                </div>

                {/* All Styles Grid */}
                <div className="border-t border-white/10 pt-10">
                    <h2 className="text-xl font-bold text-white text-center mb-8">
                        所有风格对比
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {logoStyles.map((style, index) => {
                            const LogoComponent = style.component
                            return (
                                <div key={index} className="space-y-4">
                                    <div className="bg-[#0d0d14] border border-white/10 rounded-xl overflow-hidden">
                                        <div className="h-14 border-b border-white/5 flex items-center px-4 gap-4">
                                            <div className="w-8 h-8">
                                                <LogoComponent className="w-full h-full" />
                                            </div>
                                            <span className="text-base font-bold text-white">
                                                Design<span className="text-indigo-400">AI</span>
                                            </span>
                                            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                                                <span>功能</span>
                                                <span>价格</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-white font-medium">{style.name}</p>
                                        <p className="text-xs text-slate-500">{style.description}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Size Comparison */}
                <div className="border-t border-white/10 pt-10 mt-10">
                    <h2 className="text-xl font-bold text-white text-center mb-8">
                        不同尺寸效果
                    </h2>
                    <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                        {logoStyles.slice(0, 3).map((style, index) => {
                            const LogoComponent = style.component
                            return (
                                <div key={index} className="text-center">
                                    <p className="text-xs text-slate-500 mb-4">{style.name}</p>
                                    <div className="flex items-center justify-center gap-6 h-20">
                                        <div className="w-12 h-12">
                                            <LogoComponent className="w-full h-full" />
                                        </div>
                                        <div className="w-8 h-8">
                                            <LogoComponent className="w-full h-full" />
                                        </div>
                                        <div className="w-5 h-5">
                                            <LogoComponent className="w-full h-full" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-2">大 → 中 → 小</p>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </main>
    )
}
