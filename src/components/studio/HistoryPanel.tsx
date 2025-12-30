"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { History, Download, X, Loader2, Calendar, Image as ImageIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface GenerationRecord {
    id: string
    type: string
    prompt: string
    input_image_url: string
    output_image_url: string
    created_at: string
    credits_used: number
}

interface HistoryPanelProps {
    isOpen: boolean
    onClose: () => void
}

export function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
    const [history, setHistory] = useState<GenerationRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (isOpen) {
            loadHistory()
        }
    }, [isOpen])

    const loadHistory = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setLoading(false)
                return
            }

            const response = await fetch('/api/user/history', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setHistory(data.history || [])
            }
        } catch (error) {
            console.error('Failed to load history:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (imageUrl: string, filename: string) => {
        try {
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-[500px] max-w-full bg-[#0d0d14] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/20">
                            <History className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">生成历史</h2>
                            <p className="text-xs text-slate-500">共 {history.length} 条记录</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p>加载中...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p>暂无生成记录</p>
                            <p className="text-sm mt-2">开始生成图片后记录将显示在这里</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((record) => (
                                <div
                                    key={record.id}
                                    className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                                >
                                    <div className="flex gap-4">
                                        {/* Thumbnail */}
                                        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-black/30 cursor-pointer" onClick={() => setSelectedImage(record.output_image_url)}>
                                            <img
                                                src={record.output_image_url}
                                                alt="Generated"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                                                    {record.type}
                                                </span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(record.created_at), {
                                                        addSuffix: true,
                                                        locale: zhCN
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                                                {record.prompt || '无提示词'}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDownload(record.output_image_url, `designai-${record.id}.png`)}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                                                >
                                                    <Download className="w-3 h-3" />
                                                    下载
                                                </button>
                                                <span className="text-xs text-slate-600">
                                                    {record.credits_used} 积分
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-8" onClick={() => setSelectedImage(null)}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
