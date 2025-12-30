import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { ContactSupport } from '@/components/ContactSupport'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'DesignAI Pro - AI电商设计平台',
  description: 'AI驱动的电商产品图片设计工具。一键换背景、换模特、超清放大。专业级 AI 技术，让每一张产品图都完美呈现。',
  keywords: 'AI设计, 电商图片, 智能换背景, AI换模特, 图片放大, 产品摄影',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-[#0a0a0f] text-white antialiased">
        <div className="relative">
          {/* Background gradient orbs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
          </div>

          {/* Grid pattern overlay */}
          <div className="fixed inset-0 grid-pattern pointer-events-none" />

          {/* Content */}
          <div className="relative z-10">
            <Navbar />
            {children}
          </div>

          {/* Floating Contact Support Button */}
          <ContactSupport />
        </div>
      </body>
    </html>
  )
}

