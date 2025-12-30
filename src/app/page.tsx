import Link from 'next/link'
import { Sparkles, ImageIcon, Wand2, Zap, ArrowRight, Check, Star, Eraser, Focus, Scissors, Users, ShoppingBag, Palette } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4 relative overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-indigo-500 rounded-full animate-float opacity-60" />
        <div className="absolute top-40 right-32 w-3 h-3 bg-purple-500 rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-blue-500 rounded-full animate-float opacity-50" style={{ animationDelay: '2s' }} />

        <div className="container mx-auto text-center max-w-5xl">
          {/* Pro Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/20 mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-slate-300">Pro 级模型 · 效果碾压市面廉价 API</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">AI 图像处理</span>
            <br />
            <span className="gradient-text">专业级平台</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            只用最强模型，追求极致效果。
            <br className="hidden md:block" />
            无论是日常修图还是电商设计，都能获得专业级输出。
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">Pro</div>
              <div className="text-sm text-slate-500">模型级别</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-1">4K+</div>
              <div className="text-sm text-slate-500">输出分辨率</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">10s</div>
              <div className="text-sm text-slate-500">平均处理时间</div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Product Areas */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              选择你的使用场景
            </h2>
            <p className="text-slate-400">
              两大功能区，满足不同需求
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI 修图工具箱 */}
            <div className="card p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Wand2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI 修图工具箱</h3>
                    <p className="text-sm text-slate-500">日常修图 · 通用场景</p>
                  </div>
                </div>

                <p className="text-slate-400 mb-6">
                  满足日常图片处理需求，适合自媒体、设计师、个人用户。
                </p>


                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Focus className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-slate-300">变清晰/放大</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Eraser className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-slate-300">去水印</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Scissors className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-slate-300">智能抠图</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-slate-300">涂抹消除</span>
                  </div>
                </div>

                <Link href="/studio?mode=tools">
                  <button className="w-full btn-secondary flex items-center justify-center gap-2 group/btn">
                    进入工具箱
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>

            {/* 电商设计中心 */}
            <div className="card p-8 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
              {/* Pro badge */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-bold text-white">
                热门
              </div>

              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">电商设计中心</h3>
                    <p className="text-sm text-slate-500">电商卖家 · 品牌运营</p>
                  </div>
                </div>

                <p className="text-slate-400 mb-6">
                  专业电商图片设计，提升产品视觉，提高转化率。
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <ImageIcon className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-slate-300">AI主图生成</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Palette className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-slate-300">智能换背景</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-slate-300">AI换模特</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-slate-300">场景合成</span>
                  </div>
                </div>

                <Link href="/studio?mode=ecommerce">
                  <button className="w-full btn-primary flex items-center justify-center gap-2 group/btn">
                    进入设计中心
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Pro Model */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-6">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-slate-300">为什么选择我们</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pro 级模型，专业级效果
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              市面上大多数工具使用廉价 API 以次充好，我们只用最强模型确保每一张图都是专业级输出
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">最强模型</h3>
              <p className="text-slate-400">
                采用 Nano Banana Pro 顶级模型，效果远超市面廉价替代品
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
                <Focus className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">极致细节</h3>
              <p className="text-slate-400">
                4K+ 输出分辨率，保留每一个细节，满足印刷级需求
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">一次到位</h3>
              <p className="text-slate-400">
                无需反复调整，一次生成即可获得满意效果，节省时间成本
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison - Redesigned */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              效果对比
            </h2>
            <p className="text-slate-400">
              同样的图片，不同的处理效果
            </p>
          </div>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before - 普通工具 */}
            <div className="card p-6 border-red-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-red-400 text-lg">✕</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">普通工具效果</h3>
                  <p className="text-xs text-slate-500">廉价 API 处理结果</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <span className="text-red-400">•</span>
                  <span className="text-sm text-slate-400">图片模糊，细节丢失严重</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <span className="text-red-400">•</span>
                  <span className="text-sm text-slate-400">边缘锯齿，抠图不干净</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <span className="text-red-400">•</span>
                  <span className="text-sm text-slate-400">色彩失真，光影不自然</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <span className="text-red-400">•</span>
                  <span className="text-sm text-slate-400">需要多次处理才能勉强使用</span>
                </div>
              </div>
            </div>

            {/* After - DesignAI Pro */}
            <div className="card p-6 border-green-500/20 relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <span className="text-green-400 text-lg">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">DesignAI Pro 效果</h3>
                    <p className="text-xs text-slate-500">Nano Banana Pro 模型</p>
                  </div>
                  <div className="ml-auto px-2 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-bold text-white">
                    Pro
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm text-slate-300">4K 超清输出，细节完美保留</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm text-slate-300">智能边缘处理，抠图精准干净</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm text-slate-300">专业级色彩还原，光影自然</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm text-slate-300">一次生成即可直接使用</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="card p-12 text-center relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                体验专业级 AI 图像处理
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                立即开始，感受 Pro 级模型带来的极致效果
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/studio">
                  <button className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    立即体验
                  </button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Pro 级模型
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  4K+ 输出
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  极致效果
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-slate-500 text-sm">
              © 2024 DesignAI Pro. All rights reserved.
            </div>
            <div className="flex gap-8 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">隐私政策</a>
              <a href="#" className="hover:text-white transition-colors">服务条款</a>
              <a href="#" className="hover:text-white transition-colors">联系我们</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
