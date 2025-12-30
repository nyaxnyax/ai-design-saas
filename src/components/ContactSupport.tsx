"use client"

import { useState } from 'react'
import { X, MessageCircle, Mail, Copy, Check } from 'lucide-react'
import Image from 'next/image'

export function ContactSupport() {
    const [isOpen, setIsOpen] = useState(false)
    const [copiedField, setCopiedField] = useState<string | null>(null)

    const contactInfo = {
        email: '757307937@qq.com',
        qq: '757307937',
    }

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300 group"
            >
                <MessageCircle className="w-5 h-5 group-hover:animate-bounce" />
                <span className="hidden sm:inline">联系客服</span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                >
                    {/* Modal Content */}
                    <div
                        className="relative w-full max-w-lg bg-[#0f0f16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative p-6 text-center border-b border-white/10 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <MessageCircle className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">联系客服</h2>
                            <p className="text-sm text-slate-400 mt-1">有任何问题请联系我们的客服团队</p>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* WeChat QR Code */}
                            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.04-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.636-4.297-6.358-8.596-6.358zm-2.97 5.94c-.532 0-.963-.43-.963-.963 0-.534.431-.963.963-.963.533 0 .964.43.964.963 0 .534-.431.963-.964.963zm5.553 0c-.532 0-.963-.43-.963-.963 0-.534.431-.963.963-.963.534 0 .964.43.964.963 0 .534-.43.963-.964.963zM24 14.66c0-3.334-3.201-6.027-7.163-6.027-3.96 0-7.163 2.693-7.163 6.027 0 3.334 3.203 6.027 7.163 6.027.798 0 1.566-.094 2.293-.329a.69.69 0 01.57.078l1.527.893a.26.26 0 00.133.039.232.232 0 00.233-.234c0-.058-.022-.115-.038-.17l-.316-1.184a.472.472 0 01.17-.53C23.028 18.31 24 16.577 24 14.66zm-9.505-1.193c-.426 0-.771-.346-.771-.771s.345-.771.771-.771c.427 0 .772.346.772.771s-.345.771-.772.771zm4.683 0c-.426 0-.771-.346-.771-.771s.345-.771.771-.771c.427 0 .772.346.772.771s-.345.771-.772.771z" />
                                    </svg>
                                    <span className="font-medium text-white">微信客服</span>
                                </div>
                                <div className="flex justify-center">
                                    <div className="bg-white p-3 rounded-xl">
                                        <Image
                                            src="/wechat-qr.png"
                                            alt="微信客服二维码"
                                            width={180}
                                            height={180}
                                            className="rounded-lg"
                                        />
                                    </div>
                                </div>
                                <p className="text-center text-xs text-slate-400 mt-3">扫码添加客服微信</p>
                            </div>

                            {/* Contact Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Email */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mail className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs text-slate-400">客服邮箱</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white font-medium truncate">{contactInfo.email}</span>
                                        <button
                                            onClick={() => handleCopy(contactInfo.email, 'email')}
                                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                            title="复制"
                                        >
                                            {copiedField === 'email' ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* QQ */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29 0 2.239.425 6.287.687 6.287 0 0-.688-1.768-1.182-1.768-1.182 2.085-1.77 1.905-3.967 1.905-3.967.845 1.588 1.634 2.072 1.746 2.072.111 0 .283-.36.283-1.025 0-2.514-2.166-6.954-2.166-6.954V9.325C18.29 3.364 14.268 2 12.003 2z" />
                                        </svg>
                                        <span className="text-xs text-slate-400">客服QQ</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white font-medium">{contactInfo.qq}</span>
                                        <button
                                            onClick={() => handleCopy(contactInfo.qq, 'qq')}
                                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                            title="复制"
                                        >
                                            {copiedField === 'qq' ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Working Hours */}
                            <div className="text-center text-xs text-slate-500">
                                <span>工作时间: 周一至周日 9:00 - 22:00</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
