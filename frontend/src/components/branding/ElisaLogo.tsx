/**
 * ==================================
 * eLISAschool - Composant Logo SVG
 * ==================================
 * Logo vectoriel multi-variantes avec support animations
 * Variantes : full, horizontal, icon, mini, wordmark
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/cn';

// ─── Types ───────────────────────────────────────────
export type LogoVariant = 'full' | 'horizontal' | 'icon' | 'mini' | 'wordmark';
export type LogoTheme = 'default' | 'white' | 'mono' | 'dark';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ElisaLogoProps {
    variant?: LogoVariant;
    theme?: LogoTheme;
    size?: LogoSize;
    animated?: boolean;
    showTagline?: boolean;
    className?: string;
    onClick?: () => void;
}

// ─── Palette officielle ──────────────────────────────
const COLORS = {
    default: {
        primary: '#1a3a5c',     // Bleu marine
        secondary: '#5a8a5c',   // Vert sauge
        accent: '#2e6b8a',      // Bleu acier
        book: '#1a3a5c',
        text: '#1a3a5c',
        textSecondary: '#5a8a5c',
        tagline: '#6b7280',
    },
    white: {
        primary: '#ffffff',
        secondary: '#a8d5a2',
        accent: '#ffffff',
        book: '#ffffff',
        text: '#ffffff',
        textSecondary: '#a8d5a2',
        tagline: 'rgba(255,255,255,0.7)',
    },
    mono: {
        primary: '#1a3a5c',
        secondary: '#1a3a5c',
        accent: '#1a3a5c',
        book: '#1a3a5c',
        text: '#1a3a5c',
        textSecondary: '#1a3a5c',
        tagline: '#6b7280',
    },
    dark: {
        primary: '#e2e8f0',
        secondary: '#86efac',
        accent: '#94a3b8',
        book: '#e2e8f0',
        text: '#e2e8f0',
        textSecondary: '#86efac',
        tagline: '#94a3b8',
    },
};

// ─── Dimensions par taille ───────────────────────────
const SIZES: Record<LogoSize, { icon: number; full: number; horizontal: [number, number] }> = {
    xs: { icon: 24, full: 80, horizontal: [100, 24] },
    sm: { icon: 32, full: 120, horizontal: [140, 32] },
    md: { icon: 40, full: 160, horizontal: [180, 40] },
    lg: { icon: 56, full: 220, horizontal: [240, 56] },
    xl: { icon: 72, full: 280, horizontal: [320, 72] },
    '2xl': { icon: 96, full: 360, horizontal: [400, 96] },
};

// ─── Animations ──────────────────────────────────────
const bookOpenVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
        pathLength: 1,
        opacity: 1,
        transition: { duration: 0.8, ease: 'easeInOut' },
    },
};

const letterVariants: Variants = {
    hidden: { opacity: 0, y: 5 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.3 + i * 0.05, duration: 0.4, ease: 'easeOut' },
    }),
};

const pulseVariants: Variants = {
    idle: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
};

// ─── Sous-composant : Monogramme eS + Livre ──────────
function LogoMark({
    colors,
    size,
    animated,
}: {
    colors: typeof COLORS.default;
    size: number;
    animated: boolean;
}) {
    const MotionPath = animated ? motion.path : 'path';
    const MotionCircle = animated ? motion.circle : 'circle';

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Livre ouvert - page gauche */}
            <MotionPath
                d="M8 18C8 18 14 14 32 14V52C14 52 8 48 8 48V18Z"
                fill={colors.primary}
                fillOpacity={0.12}
                stroke={colors.primary}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                {...(animated && {
                    variants: bookOpenVariants,
                    initial: 'hidden',
                    animate: 'visible',
                })}
            />
            {/* Livre ouvert - page droite */}
            <MotionPath
                d="M56 18C56 18 50 14 32 14V52C50 52 56 48 56 48V18Z"
                fill={colors.secondary}
                fillOpacity={0.12}
                stroke={colors.secondary}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                {...(animated && {
                    variants: bookOpenVariants,
                    initial: 'hidden',
                    animate: 'visible',
                })}
            />
            {/* Reliure centrale */}
            <MotionPath
                d="M32 14V52"
                stroke={colors.primary}
                strokeWidth={1.2}
                strokeLinecap="round"
                opacity={0.4}
                {...(animated && {
                    initial: { pathLength: 0 },
                    animate: { pathLength: 1 },
                    transition: { delay: 0.5, duration: 0.4 },
                })}
            />
            {/* Lettre "e" stylisée */}
            <MotionPath
                d="M16 33C16 28.5 19.5 25 24 25C28.5 25 32 28.5 32 33H16C16 37.5 19.5 41 24 41C27 41 29.5 39.5 31 37"
                stroke={colors.primary}
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                {...(animated && {
                    variants: bookOpenVariants,
                    initial: 'hidden',
                    animate: 'visible',
                    transition: { delay: 0.4, duration: 0.6 },
                })}
            />
            {/* Lettre "S" stylisée */}
            <MotionPath
                d="M48 27C48 27 45.5 24 41 24C37.5 24 35 26 35 28.5C35 31 37 32 41 33C45 34 48 35 48 38C48 41 45 43 41 43C37 43 34 40.5 34 40.5"
                stroke={colors.secondary}
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                {...(animated && {
                    variants: bookOpenVariants,
                    initial: 'hidden',
                    animate: 'visible',
                    transition: { delay: 0.6, duration: 0.6 },
                })}
            />
            {/* Petit accent de germination (entre les lettres) */}
            <MotionPath
                d="M33 20C33 20 34 17 33 14M33 14C32 16 31 17 31 17M33 14C34 16 35 17 35 17"
                stroke={colors.secondary}
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.7}
                {...(animated && {
                    initial: { opacity: 0, y: 3 },
                    animate: { opacity: 0.7, y: 0 },
                    transition: { delay: 1, duration: 0.5 },
                })}
            />
            {/* Point lumineux accent */}
            <MotionCircle
                cx="33"
                cy="12"
                r="1.5"
                fill={colors.secondary}
                opacity={0.8}
                {...(animated && {
                    initial: { scale: 0, opacity: 0 },
                    animate: { scale: 1, opacity: 0.8 },
                    transition: { delay: 1.2, duration: 0.3 },
                })}
            />
        </svg>
    );
}

// ─── Sous-composant : Mini (sidebar collapsed) ───────
function LogoMini({
    colors,
    size,
    animated: _animated,
}: {
    colors: typeof COLORS.default;
    size: number;
    animated: boolean;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Fond arrondi */}
            <rect
                x="2" y="2" width="28" height="28"
                rx="8"
                fill={colors.primary}
                fillOpacity={0.08}
            />
            {/* eS compact */}
            <path
                d="M8 17C8 14.2 10.2 12 13 12C15.8 12 18 14.2 18 17H8C8 19.8 10.2 22 13 22C14.8 22 16.3 21 17 19.5"
                stroke={colors.primary}
                strokeWidth={2.2}
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M25 14C25 14 23.5 12 21 12C19 12 17.5 13.2 17.5 15C17.5 16.8 19 17.5 21 18C23 18.5 25 19.2 25 21C25 23 23 24.5 21 24.5C19 24.5 17 22.8 17 22.8"
                stroke={colors.secondary}
                strokeWidth={2.2}
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    );
}

// ─── Sous-composant : Wordmark ───────────────────────
function LogoWordmark({
    colors,
    animated,
    fontSize = 18,
}: {
    colors: typeof COLORS.default;
    animated: boolean;
    fontSize?: number;
}) {
    const letters = 'elisaschool'.split('');
    const Wrapper = animated ? motion.span : 'span';

    return (
        <span
            className="font-bold tracking-tight"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1 }}
        >
            {letters.map((letter, i) => (
                <Wrapper
                    key={`${letter}-${i}`}
                    style={{
                        color: i < 5 ? colors.text : colors.textSecondary,
                        display: 'inline-block',
                    }}
                    {...(animated && {
                        variants: letterVariants,
                        initial: 'hidden',
                        animate: 'visible',
                        custom: i,
                    })}
                >
                    {letter}
                </Wrapper>
            ))}
        </span>
    );
}

// ─── Composant principal ─────────────────────────────
export function ElisaLogo({
    variant = 'full',
    theme = 'default',
    size = 'md',
    animated = false,
    showTagline = false,
    className,
    onClick,
}: ElisaLogoProps) {
    const colors = COLORS[theme];
    const dimensions = SIZES[size];
    const Container = animated ? motion.div : 'div';

    // ─── Variante ICON (monogramme seul) ─────────────
    if (variant === 'icon') {
        return (
            <Container
                className={cn('inline-flex items-center justify-center', className)}
                {...(animated && { variants: pulseVariants, initial: 'idle', whileHover: 'hover' })}
                onClick={onClick}
            >
                <LogoMark colors={colors} size={dimensions.icon} animated={animated} />
            </Container>
        );
    }

    // ─── Variante MINI (sidebar collapsed) ───────────
    if (variant === 'mini') {
        return (
            <Container
                className={cn('inline-flex items-center justify-center', className)}
                {...(animated && { variants: pulseVariants, initial: 'idle', whileHover: 'hover' })}
                onClick={onClick}
            >
                <LogoMini colors={colors} size={dimensions.icon} animated={animated} />
            </Container>
        );
    }

    // ─── Variante WORDMARK (texte seul) ──────────────
    if (variant === 'wordmark') {
        const fontSize = { xs: 14, sm: 16, md: 20, lg: 26, xl: 34, '2xl': 44 }[size];
        return (
            <Container
                className={cn('inline-flex flex-col', className)}
                onClick={onClick}
            >
                <LogoWordmark colors={colors} animated={animated} fontSize={fontSize} />
                {showTagline && (
                    <span
                        className="mt-0.5 text-xs tracking-wide"
                        style={{ color: colors.tagline }}
                    >
                        Gestion Scolaire Intelligente
                    </span>
                )}
            </Container>
        );
    }

    // ─── Variante HORIZONTAL (icône + texte en ligne) ─
    if (variant === 'horizontal') {
        const fontSize = { xs: 12, sm: 14, md: 17, lg: 22, xl: 28, '2xl': 36 }[size];
        return (
            <Container
                className={cn('inline-flex items-center gap-2', className)}
                {...(animated && { variants: pulseVariants, initial: 'idle', whileHover: 'hover' })}
                onClick={onClick}
            >
                <LogoMark colors={colors} size={dimensions.icon * 0.85} animated={animated} />
                <div className="flex flex-col">
                    <LogoWordmark colors={colors} animated={animated} fontSize={fontSize} />
                    {showTagline && (
                        <span
                            className="text-[9px] tracking-wider uppercase"
                            style={{ color: colors.tagline }}
                        >
                            Gestion Scolaire Intelligente
                        </span>
                    )}
                </div>
            </Container>
        );
    }

    // ─── Variante FULL (icône + texte vertical) ──────
    const fontSize = { xs: 14, sm: 18, md: 22, lg: 28, xl: 36, '2xl': 46 }[size];
    return (
        <Container
            className={cn('inline-flex flex-col items-center gap-2', className)}
            {...(animated && { variants: pulseVariants, initial: 'idle', whileHover: 'hover' })}
            onClick={onClick}
        >
            <LogoMark colors={colors} size={dimensions.icon * 1.4} animated={animated} />
            <LogoWordmark colors={colors} animated={animated} fontSize={fontSize} />
            {showTagline && (
                <span
                    className="mt-1 text-xs tracking-wider"
                    style={{ color: colors.tagline }}
                >
                    Gestion Scolaire Intelligente
                </span>
            )}
        </Container>
    );
}

export default ElisaLogo;
