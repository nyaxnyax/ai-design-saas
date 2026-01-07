/**
 * Artistic Letter N Logo Designs
 * Choose your favorite style to use as the brand logo
 */

// Style 1: Geometric Modern - Clean geometric lines with gradient
export function LogoGeometricN({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            {/* Left vertical bar */}
            <rect x="20" y="15" width="12" height="70" rx="2" fill="url(#grad1)" />
            {/* Right vertical bar */}
            <rect x="68" y="15" width="12" height="70" rx="2" fill="url(#grad1)" />
            {/* Diagonal bar */}
            <rect x="20" y="48" width="60" height="12" rx="2" fill="url(#grad1)" />
        </svg>
    )
}

// Style 2: Neon Glow - Glowing effect with dark background
export function LogoNeonN({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            {/* N shape with glow */}
            <path
                d="M25 20 L25 80 L35 80 L35 40 L75 80 L75 20 L65 20 L65 60 L25 20 Z"
                fill="none"
                stroke="url(#neonGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
            />
        </svg>
    )
}

// Style 3: Minimalist - Simple elegant single stroke
export function LogoMinimalN({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="minGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            {/* Single continuous stroke N */}
            <path
                d="M30 20 L30 80 L70 20 L70 80"
                stroke="url(#minGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

// Style 4: Cubic/3D - Isometric 3D effect
export function LogoCubicN({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#818cf8', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="cubeSide" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            {/* Left vertical - front */}
            <rect x="18" y="15" width="8" height="70" fill="url(#cubeSide)" />
            {/* Right vertical - front */}
            <rect x="62" y="15" width="8" height="70" fill="url(#cubeSide)" />
            {/* Diagonal - front */}
            <polygon points="26,50 62,25 70,32 34,57" fill="url(#cubeTop)" />
        </svg>
    )
}

// Style 5: Dotted/Tech - Modern tech dotted pattern
export function LogoTechN({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="techGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            {/* Left vertical dots */}
            <circle cx="25" cy="20" r="6" fill="url(#techGrad)" />
            <circle cx="25" cy="38" r="6" fill="url(#techGrad)" />
            <circle cx="25" cy="56" r="6" fill="url(#techGrad)" />
            <circle cx="25" cy="74" r="6" fill="url(#techGrad)" />

            {/* Diagonal dots */}
            <circle cx="39" cy="45" r="6" fill="url(#techGrad)" />
            <circle cx="53" cy="35" r="6" fill="url(#techGrad)" />
            <circle cx="67" cy="25" r="6" fill="url(#techGrad)" />

            {/* Right vertical dots */}
            <circle cx="75" cy="20" r="6" fill="url(#techGrad)" />
            <circle cx="75" cy="38" r="6" fill="url(#techGrad)" />
            <circle cx="75" cy="56" r="6" fill="url(#techGrad)" />
            <circle cx="75" cy="74" r="6" fill="url(#techGrad)" />
        </svg>
    )
}

// Style 6: Wave/Flow - Smooth wave style N
export function LogoWaveN({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            {/* Wave N using smooth curves */}
            <path
                d="M25 20 Q25 50 50 35 Q75 20 75 20 L75 80 Q75 50 50 65 Q25 80 25 80 Z"
                fill="url(#waveGrad)"
                opacity="0.9"
            />
        </svg>
    )
}
