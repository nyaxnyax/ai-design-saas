"use client"

import { Resolution, AspectRatio, SceneType, ArtStyle, GenerationSettings } from '@/types/generation';
import { Settings, Image as ImageIcon, Palette, Wand2, Layers, Zap } from 'lucide-react';

interface GenerationSettingsPanelProps {
    settings: GenerationSettings;
    onSettingsChange: (settings: GenerationSettings) => void;
    disabled?: boolean;
}

const RESOLUTIONS: Resolution[] = ['1K', '2K', '4K'];
const ASPECT_RATIOS: AspectRatio[] = ['1:1', '16:9', '4:3', '3:4', '9:16'];
const BATCH_SIZES = [1, 2, 4, 6, 8, 10];

const SCENE_TYPES: { value: SceneType; label: string; icon: any }[] = [
    { value: 'product', label: '产品摄影', icon: ImageIcon },
    { value: 'portrait', label: '人像写真', icon: ImageIcon },
    { value: 'landscape', label: '风景摄影', icon: ImageIcon },
    { value: 'interior', label: '室内设计', icon: ImageIcon },
    { value: 'food', label: '美食摄影', icon: ImageIcon },
    { value: 'abstract', label: '抽象艺术', icon: Palette },
];

const ART_STYLES: { value: ArtStyle; label: string; description: string }[] = [
    { value: 'realistic', label: '写实', description: '照片般真实' },
    { value: 'anime', label: '动漫', description: '二次元风格' },
    { value: 'oil-painting', label: '油画', description: '古典油画' },
    { value: 'watercolor', label: '水彩', description: '水彩画风格' },
    { value: 'digital-art', label: '数字艺术', description: '现代插画' },
    { value: 'pencil-sketch', label: '素描', description: '铅笔素描' },
    { value: 'cinematic', label: '电影', description: '电影质感' },
];

export function GenerationSettingsPanel({
    settings,
    onSettingsChange,
    disabled = false
}: GenerationSettingsPanelProps) {
    const updateSetting = <K extends keyof GenerationSettings>(
        key: K,
        value: GenerationSettings[K]
    ) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const toggleSceneType = (value: SceneType) => {
        updateSetting('sceneType', settings.sceneType === value ? undefined : value);
    };

    const toggleArtStyle = (value: ArtStyle) => {
        updateSetting('artStyle', settings.artStyle === value ? undefined : value);
    };

    const toggleBatchMode = () => {
        updateSetting('batchMode', !settings.batchMode);
        if (!settings.batchMode) {
            updateSetting('batchSize', 1);
        }
    };

    return (
        <div className="space-y-5">
            {/* Batch Mode Toggle */}
            <div className={`p-4 rounded-xl border transition-all ${
                settings.batchMode
                    ? 'bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-indigo-500/30'
                    : 'border-white/10 bg-white/5'
            }`}>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        批量生成模式
                    </label>
                    <button
                        onClick={() => !disabled && toggleBatchMode()}
                        disabled={disabled}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${settings.batchMode ? 'bg-indigo-600' : 'bg-white/10'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all ${
                            settings.batchMode ? 'left-7' : 'left-1'
                        }`} />
                    </button>
                </div>

                {settings.batchMode && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Zap className="w-3.5 h-3.5" />
                            <span>选择生成数量（最多10张）</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                            {BATCH_SIZES.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => !disabled && updateSetting('batchSize', size)}
                                    disabled={disabled}
                                    className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                                        (settings.batchSize || 1) === size
                                            ? 'bg-indigo-600 border-indigo-500 text-white'
                                            : 'border-white/10 text-slate-400 hover:bg-white/5'
                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {size}张
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            批量生成将按顺序处理，每张图片独立生成
                        </p>
                    </div>
                )}
            </div>

            {/* Resolution Selector */}
            <div>
                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    分辨率
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {RESOLUTIONS.map((res) => (
                        <button
                            key={res}
                            onClick={() => !disabled && updateSetting('resolution', res)}
                            disabled={disabled}
                            className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                                settings.resolution === res
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                                    : 'border-white/10 text-slate-400 hover:bg-white/5 hover:border-white/20'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {res}
                        </button>
                    ))}
                </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div>
                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    画面比例
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio}
                            onClick={() => !disabled && updateSetting('aspectRatio', ratio)}
                            disabled={disabled}
                            className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                                settings.aspectRatio === ratio
                                    ? 'bg-indigo-600 border-indigo-500 text-white'
                                    : 'border-white/10 text-slate-400 hover:bg-white/5'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scene Type Selector */}
            <div>
                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    场景类型 <span className="text-xs text-slate-500 font-normal">(可选)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                    {SCENE_TYPES.map((scene) => (
                        <button
                            key={scene.value}
                            onClick={() => !disabled && toggleSceneType(scene.value)}
                            disabled={disabled}
                            className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                                settings.sceneType === scene.value
                                    ? 'bg-purple-600 border-purple-500 text-white'
                                    : 'border-white/10 text-slate-400 hover:bg-white/5'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <scene.icon className="w-3.5 h-3.5" />
                            {scene.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Art Style Selector */}
            <div>
                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    艺术风格 <span className="text-xs text-slate-500 font-normal">(可选)</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                    {ART_STYLES.map((style) => (
                        <button
                            key={style.value}
                            onClick={() => !disabled && toggleArtStyle(style.value)}
                            disabled={disabled}
                            className={`py-2.5 px-3 rounded-lg text-xs font-medium border transition-all text-left ${
                                settings.artStyle === style.value
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500 text-white shadow-lg'
                                    : 'border-white/10 text-slate-400 hover:bg-white/5'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="font-medium">{style.label}</div>
                            <div className="text-[10px] opacity-70 mt-0.5">{style.description}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
