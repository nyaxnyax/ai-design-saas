'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, ArrowRight, Filter, Wand2, Users, Palette, Scissors, Focus, Star } from 'lucide-react'

// 案例数据 - 使用本地下载的高质量图片
const galleryItems = [
    {
        id: 1,
        title: '时尚女装模特展示',
        category: 'model',
        tool: 'AI换模特',
        image: '/images/gallery/item-1.jpg',
        description: '将平铺服装一键生成真人模特上身效果',
    },
    {
        id: 2,
        title: '产品背景替换',
        category: 'background',
        tool: '智能换背景',
        image: '/images/gallery/item-2.jpg',
        description: '智能识别产品主体，一键更换场景背景',
    },
    {
        id: 3,
        title: '高清图片放大',
        category: 'enhance',
        tool: '变清晰/放大',
        image: '/images/gallery/item-3.jpg',
        description: '低分辨率图片智能放大至4K，细节完美还原',
    },
    {
        id: 4,
        title: '护肤品精修',
        category: 'ecommerce',
        tool: 'AI主图生成',
        image: '/images/gallery/item-4.jpg',
        description: '专业级产品图精修，提升转化率',
    },
    {
        id: 5,
        title: '男装模特换装',
        category: 'model',
        tool: 'AI换模特',
        image: '/images/gallery/item-5.jpg',
        description: '支持多种模特风格，快速生成上身效果',
    },
    {
        id: 6,
        title: '珠宝饰品展示',
        category: 'background',
        tool: '智能换背景',
        image: '/images/gallery/item-6.jpg',
        description: '高端质感背景，提升珠宝产品档次',
    },
    {
        id: 7,
        title: '商品抠图',
        category: 'enhance',
        tool: '智能抠图',
        image: '/images/gallery/item-7.jpg',
        description: '一键去除背景，边缘干净无锯齿',
    },
    {
        id: 8,
        title: '家居场景合成',
        category: 'ecommerce',
        tool: '场景合成',
        image: '/images/gallery/item-8.jpg',
        description: '将产品融入真实场景，展示使用效果',
    },
    {
        id: 9,
        title: '运动装模特',
        category: 'model',
        tool: 'AI换模特',
        image: '/images/gallery/item-9.jpg',
        description: '运动风格模特，展现产品动感活力',
    },
]

const categories = [
    { id: 'all', label: '全部', icon: Filter },
    { id: 'enhance', label: 'AI修图', icon: Focus },
    { id: 'ecommerce', label: '电商设计', icon: Wand2 },
    { id: 'model', label: '模特换装', icon: Users },
    { id: 'background', label: '背景替换', icon: Palette },
]

const toolColors: Record<string, string> = {
    'AI换模特': 'from-purple-500 to-pink-500',
    '智能换背景': 'from-blue-500 to-cyan-500',
    '变清晰/放大': 'from-green-500 to-emerald-500',
    'AI主图生成': 'from-indigo-500 to-purple-500',
    '智能抠图': 'from-orange-500 to-amber-500',
    '场景合成': 'from-rose-500 to-red-500',
}

export default function GalleryPage() {
    const [activeCategory, setActiveCategory] = useState('all')
    const [selectedItem, setSelectedItem] = useState<typeof galleryItems[0] | null>(null)

    const filteredItems = activeCategory === 'all'
        ? galleryItems
        : galleryItems.filter(item => item.category === activeCategory)

    return (
        <main className="min-h-screen pt-20">
            {/* Hero Section */}
            <section className="py-16 px-4 relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute top-10 left-20 w-3 h-3 bg-purple-500 rounded-full animate-float opacity-40" />
                <div className="absolute top-32 right-24 w-2 h-2 bg-indigo-500 rounded-full animate-float opacity-30" style={{ animationDelay: '1s' }} />

                <div className="container mx-auto max-w-6xl text-center">
                    {/* Pro Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/20 mb-6">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-slate-300">Pro 级模型效果展示</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-white">案例</span>
                        <span className="gradient-text">展示</span>
                    </h1>

                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
                        探索 AI 图像处理的无限可能，每一张图都是专业级输出
                    </p>

                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        {categories.map((cat) => {
                            const Icon = cat.icon
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300
                    ${activeCategory === cat.id
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                                            : 'glass text-slate-300 hover:text-white hover:border-indigo-500/30'
                                        }
                  `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {cat.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Gallery Grid */}
            <section className="py-8 px-4 pb-24">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="card group overflow-hidden hover:border-indigo-500/30 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                                onClick={() => setSelectedItem(item)}
                            >
                                {/* Image Container */}
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />

                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                    {/* Tool Badge */}
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${toolColors[item.tool] || 'from-indigo-500 to-purple-500'}`}>
                                            {item.tool}
                                        </span>
                                    </div>

                                    {/* View Button on hover */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="btn-primary flex items-center gap-2 transform scale-90 group-hover:scale-100 transition-transform">
                                            <Sparkles className="w-4 h-4" />
                                            查看详情
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredItems.length === 0 && (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                                <Filter className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">暂无案例</h3>
                            <p className="text-slate-400">该分类下暂时没有案例，请选择其他分类</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Lightbox Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedItem(null)
                    }}
                >
                    <div className="relative w-full max-w-4xl bg-[#1a1a24] rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                        </button>

                        <div className="flex flex-col md:flex-row">
                            {/* Image Section */}
                            <div className="relative w-full md:w-2/3 aspect-video md:aspect-auto bg-black flex items-center justify-center">
                                <Image
                                    src={selectedItem.image}
                                    alt={selectedItem.title}
                                    width={800}
                                    height={600}
                                    className="object-contain max-h-[70vh] w-auto"
                                />
                            </div>

                            {/* Details Section */}
                            <div className="w-full md:w-1/3 p-6 md:p-8 flex flex-col border-l border-white/5 bg-[#1a1a24]">
                                <div className="mb-6">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${toolColors[selectedItem.tool] || 'from-indigo-500 to-purple-500'} mb-4`}>
                                        {selectedItem.tool}
                                    </span>
                                    <h2 className="text-2xl font-bold text-white mb-2">{selectedItem.title}</h2>
                                    <p className="text-slate-400 leading-relaxed">{selectedItem.description}</p>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">处理参数</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                                            <span className="text-slate-500">模型版本</span>
                                            <span className="text-slate-300">Pro v2.1</span>
                                        </div>
                                        <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                                            <span className="text-slate-500">分辨率</span>
                                            <span className="text-slate-300">4K (Up-scaled)</span>
                                        </div>
                                        <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                                            <span className="text-slate-500">耗时</span>
                                            <span className="text-slate-300">~8.5s</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <Link href="/studio">
                                        <button className="w-full btn-primary flex items-center justify-center gap-2 py-3">
                                            <Wand2 className="w-4 h-4" />
                                            尝试此效果
                                        </button>
                                    </Link>
                                    <p className="text-xs text-center text-slate-500 mt-3">
                                        新用户首单免费体验
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CTA Section */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="card p-10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />

                        <div className="relative">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                想要同样的效果？
                            </h2>
                            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                                立即体验 Pro 级 AI 图像处理，让你的图片焕然一新
                            </p>
                            <Link href="/studio">
                                <button className="btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2 mx-auto">
                                    开始创作
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
