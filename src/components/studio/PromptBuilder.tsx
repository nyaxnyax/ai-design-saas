import React from 'react'
import { Sliders, Camera, Sun, Layers, Maximize } from 'lucide-react'

export interface PromptOptions {
    lighting: string
    camera: string
    material: string
    scene: string
    age: string
}

interface PromptBuilderProps {
    options: PromptOptions
    onChange: (options: PromptOptions) => void
    showAgeSelector?: boolean
}

export const LIGHTING_OPTIONS = [
    { value: '', label: '默认光效' },
    { value: 'soft studio lighting', label: '柔和影棚光' },
    { value: 'natural sunlight', label: '自然阳光' },
    { value: 'cinematic lighting', label: '电影级布光' },
    { value: 'cyberpunk neon lights', label: '赛博霓虹' },
    { value: 'rembrandt lighting', label: '伦勃朗光' },
    { value: 'backlighting', label: '逆光轮廓' },
]

export const CAMERA_OPTIONS = [
    { value: '', label: '默认视角' },
    { value: 'front view', label: '正视图' },
    { value: 'top down view', label: '俯视图' },
    { value: 'close up shot', label: '特写细节' },
    { value: 'wide angle shot', label: '广角全景' },
    { value: 'isometric view', label: '等轴侧视' },
    { value: 'low angle view', label: '低角度仰视' },
]

export const MATERIAL_OPTIONS = [
    { value: '', label: '默认材质' },
    { value: 'matte finish', label: '哑光质感' },
    { value: 'glossy and shiny', label: '高光泽感' },
    { value: 'fabric texture', label: '织物纹理' },
    { value: 'metallic surface', label: '金属质感' },
    { value: 'glass geometric', label: '玻璃几何' },
    { value: 'wooden texture', label: '原木质感' },
]

export const SCENE_OPTIONS = [
    { value: '', label: '默认场景' },
    { value: 'minimalist solid background', label: '极简纯色' },
    { value: 'modern living room', label: '现代客厅' },
    { value: 'luxury podium display', label: '无论展台' },
    { value: 'natural outdoor garden', label: '户外花园' },
    { value: 'urban street background', label: '城市街头' },
    { value: 'abstract geometric background', label: '抽象几何' },
]

export function PromptBuilder({ options, onChange, showAgeSelector = false }: PromptBuilderProps) {
    const handleChange = (key: keyof PromptOptions, value: string) => {
        onChange({ ...options, [key]: value })
    }

    return (
        <div className="space-y-4 rounded-xl bg-white/5 p-4 border border-white/10">
            <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-2">
                <Sliders className="w-4 h-4" />
                高级/专业设置
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 光效 */}
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 flex items-center gap-1">
                        <Sun className="w-3 h-3" /> 光效
                    </label>
                    <select
                        value={options.lighting}
                        onChange={(e) => handleChange('lighting', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    >
                        {LIGHTING_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* 视角 */}
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 flex items-center gap-1">
                        <Camera className="w-3 h-3" /> 视角
                    </label>
                    <select
                        value={options.camera}
                        onChange={(e) => handleChange('camera', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    >
                        {CAMERA_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* 材质 */}
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 flex items-center gap-1">
                        <Layers className="w-3 h-3" /> 材质
                    </label>
                    <select
                        value={options.material}
                        onChange={(e) => handleChange('material', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    >
                        {MATERIAL_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                 {/* 场景 */}
                 <div className="space-y-1">
                    <label className="text-xs text-slate-500 flex items-center gap-1">
                        <Maximize className="w-3 h-3" /> 场景
                    </label>
                    <select
                        value={options.scene}
                        onChange={(e) => handleChange('scene', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    >
                        {SCENE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 年龄选择器 (仅在换模特模式下显示) */}
            {showAgeSelector && (
                <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                         <label className="text-xs text-slate-500">模特年龄段</label>
                         <span className="text-xs text-purple-400 font-medium">
                             {options.age ? options.age : '默认'}
                         </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['18-24 y.o', '25-30 y.o', '35-45 y.o', '50+ y.o', 'child'].map((range) => (
                            <button
                                key={range}
                                onClick={() => handleChange('age', options.age === range ? '' : range)}
                                className={`px-2 py-1 rounded text-xs border transition-colors ${
                                    options.age === range 
                                        ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                                        : 'bg-black/30 border-white/10 text-slate-400 hover:border-white/30'
                                }`}
                            >
                                {range === 'child' ? '儿童' : range.replace(' y.o', '岁')}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
