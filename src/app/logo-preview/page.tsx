"use client"

import {
    LogoGeometricN,
    LogoNeonN,
    LogoMinimalN,
    LogoCubicN,
    LogoTechN,
    LogoWaveN
} from '@/components/logo/LetterNLogo'

const logoStyles = [
    {
        name: '几何现代 (Geometric)',
        component: LogoGeometricN,
        description: '简洁几何线条，现代感强'
    },
    {
        name: '霓虹发光 (Neon)',
        component: LogoNeonN,
        description: '发光效果，适合暗色主题',
        darkBg: true
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

export default function LogoPreviewPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-[#05050A] to-[#0a0a0f] py-20 px-4">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        品牌图标设计预览
                    </h1>
                    <p className="text-slate-400 text-lg">
                        选择你喜欢的字母 N 图标风格
                    </p>
                </div>

                {/* Logo Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {logoStyles.map((style) => {
                        const LogoComponent = style.component
                        return (
                            <div
                                key={style.name}
                                className={`p-8 rounded-2xl border transition-all hover:scale-105 hover:shadow-2xl ${
                                    style.darkBg
                                        ? 'bg-black border-white/10'
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                }`}
                            >
                                {/* Logo Preview */}
                                <div className="flex items-center justify-center h-40 mb-6">
                                    <div className="w-24 h-24">
                                        <LogoComponent className="w-full h-full" />
                                    </div>
                                </div>

                                {/* Style Info */}
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white mb-2">
                                        {style.name}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {style.description}
                                    </p>
                                </div>

                                {/* Size Previews */}
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <p className="text-xs text-slate-600 mb-3">不同尺寸预览</p>
                                    <div className="flex items-center justify-center gap-6">
                                        <div className="w-8 h-8">
                                            <LogoComponent className="w-full h-full" />
                                        </div>
                                        <div className="w-6 h-6">
                                            <LogoComponent className="w-full h-full" />
                                        </div>
                                        <div className="w-4 h-4">
                                            <LogoComponent className="w-full h-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Large Preview Section */}
                <div className="mt-16 p-12 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">
                        大尺寸效果预览
                    </h2>
                    <div className="flex flex-wrap items-center justify-center gap-12">
                        {logoStyles.map((style) => {
                            const LogoComponent = style.component
                            return (
                                <div key={style.name} className="text-center">
                                    <div className="w-32 h-32 mx-auto mb-3">
                                        <LogoComponent className="w-full h-full" />
                                    </div>
                                    <p className="text-sm text-slate-500">{style.name}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center">
                    <p className="text-slate-600 text-sm">
                        告诉我你喜欢哪个风格，我会帮你应用到网站中
                    </p>
                </div>
            </div>
        </main>
    )
}
