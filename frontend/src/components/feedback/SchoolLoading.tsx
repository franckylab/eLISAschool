/**
 * ==================================
 * eLISAschool - SchoolLoading
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant de chargement thématique scolaire.
 * 4 thèmes animés : livre, crayon, cahier, globe.
 * Centré dans la zone visible (min-h + flex center).
 * Thème auto (light/dark). Ultra-responsive (clamp).
 *
 * Usage :
 * - Page en chargement (variant="full", thème au choix)
 * - Onglet/section en chargement (variant="compact")
 * - Contexte scientifique (theme="globe")
 * - Contexte rédaction (theme="pencil")
 * - Contexte général (theme="book" ou "notebook")
 */

import { motion, type Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

// ─── Palette auto ──────────────────────────────────
const PALETTE = {
    light: {
        primary: '#1a3a5c',
        secondary: '#5a8a5c',
        accent: '#2e6b8a',
        page: '#f8fafc',
        lines: '#cbd5e1',
        pencil: '#f59e0b',
        text: '#64748b',
        ocean: '#3b82f6',
        land: '#22c55e',
    },
    dark: {
        primary: '#f1f5f9',
        secondary: '#4ade80',
        accent: '#cbd5e1',
        page: '#1e293b',
        lines: '#475569',
        pencil: '#fbbf24',
        text: '#94a3b8',
        ocean: '#60a5fa',
        land: '#4ade80',
    },
};

type PaletteColors = typeof PALETTE.light;

// ─── Animations partagées ──────────────────────────
const lineVariants: Variants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: (i: number) => ({
        scaleX: 1,
        opacity: 1,
        transition: {
            delay: 0.6 + i * 0.2,
            duration: 0.35,
            ease: 'easeOut',
        },
    }),
};

const pencilWriteVariants: Variants = {
    hidden: { x: 0, y: 0, opacity: 0 },
    writing: {
        opacity: 1,
        x: [0, 25, 50, 75],
        y: [0, 0, 10, 10],
        transition: {
            duration: 2.2,
            repeat: Infinity,
            repeatDelay: 0.4,
            ease: 'easeInOut',
        },
    },
};

const bookLeftVariants: Variants = {
    hidden: { rotateY: 0 },
    visible: {
        rotateY: -25,
        transition: { delay: 0.2, duration: 0.7, ease: 'easeOut' },
    },
};

const bookRightVariants: Variants = {
    hidden: { rotateY: 0 },
    visible: {
        rotateY: 25,
        transition: { delay: 0.2, duration: 0.7, ease: 'easeOut' },
    },
};

const pageTurnVariants: Variants = {
    hidden: { rotateY: 0 },
    turning: {
        rotateY: -160,
        transition: {
            duration: 1.2,
            repeat: Infinity,
            repeatDelay: 0.8,
            ease: 'easeInOut',
        },
    },
};

const globeSpinVariants: Variants = {
    hidden: { rotate: 0 },
    spinning: {
        rotate: 360,
        transition: {
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
        },
    },
};

const fadeInVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
};

// ─── Hook thème ────────────────────────────────────
function useSchoolColors(): PaletteColors {
    const [isDark, setIsDark] = useState(
        () => document.documentElement.dataset.theme === 'dark',
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.dataset.theme === 'dark');
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
        return () => observer.disconnect();
    }, []);

    return isDark ? PALETTE.dark : PALETTE.light;
}

// ─── Thème BOOK (livre ouvert + crayon) ────────────
function BookAnimation({ colors }: { colors: PaletteColors }) {
    return (
        <svg viewBox="0 0 80 80" fill="none" style={{ perspective: '200px' }}>
            {/* Page gauche */}
            <motion.g
                style={{ transformOrigin: '40px 40px' }}
                variants={bookLeftVariants}
                initial="hidden"
                animate="visible"
            >
                <path
                    d="M8 16C8 16 14 12 40 12V64C14 64 8 60 8 60V16Z"
                    fill={colors.page}
                    stroke={colors.primary}
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                />
                {[0, 1, 2, 3].map((i) => (
                    <motion.line
                        key={`l-${i}`}
                        x1="16" y1={24 + i * 8}
                        x2="36" y2={24 + i * 8}
                        stroke={colors.lines}
                        strokeWidth={0.8}
                        strokeLinecap="round"
                        variants={lineVariants}
                        custom={i}
                    />
                ))}
            </motion.g>

            {/* Page droite */}
            <motion.g
                style={{ transformOrigin: '40px 40px' }}
                variants={bookRightVariants}
                initial="hidden"
                animate="visible"
            >
                <path
                    d="M72 16C72 16 66 12 40 12V64C66 64 72 60 72 60V16Z"
                    fill={colors.page}
                    stroke={colors.primary}
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                />
                {[0, 1, 2, 3].map((i) => (
                    <motion.line
                        key={`r-${i}`}
                        x1="44" y1={24 + i * 8}
                        x2="64" y2={24 + i * 8}
                        stroke={colors.lines}
                        strokeWidth={0.8}
                        strokeLinecap="round"
                        variants={lineVariants}
                        custom={i + 4}
                    />
                ))}
            </motion.g>

            {/* Reliure */}
            <motion.line
                x1="40" y1="12" x2="40" y2="64"
                stroke={colors.primary}
                strokeWidth={1.2}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
            />

            {/* Crayon */}
            <motion.g variants={pencilWriteVariants} initial="hidden" animate="writing">
                <rect x="0" y="-2" width="16" height="4" rx="1"
                    fill={colors.pencil} transform="rotate(-35 8 0)" />
                <polygon points="-3,0 0,-2 0,2"
                    fill={colors.primary} transform="rotate(-35 8 0)" />
                <rect x="14" y="-2" width="3" height="4" rx="0.5"
                    fill={colors.secondary} transform="rotate(-35 8 0)" />
            </motion.g>
        </svg>
    );
}

// ─── Thème PENCIL (crayon qui écrit seul) ──────────
function PencilAnimation({ colors }: { colors: PaletteColors }) {
    return (
        <svg viewBox="0 0 80 80" fill="none">
            {/* Lignes de papier */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.line
                    key={i}
                    x1="12" y1={18 + i * 10}
                    x2="68" y2={18 + i * 10}
                    stroke={colors.lines}
                    strokeWidth={0.6}
                    strokeLinecap="round"
                    variants={lineVariants}
                    custom={i}
                />
            ))}

            {/* Crayon animé plus grand */}
            <motion.g
                initial={{ x: 12, y: 18, opacity: 0 }}
                animate={{
                    opacity: 1,
                    x: [12, 40, 60, 68, 40, 12],
                    y: [18, 18, 28, 38, 48, 58],
                }}
                transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    repeatDelay: 0.6,
                    ease: 'easeInOut',
                }}
            >
                {/* Corps */}
                <rect x="0" y="-3" width="22" height="6" rx="1.5"
                    fill={colors.pencil} transform="rotate(-40 11 0)" />
                {/* Pointe */}
                <polygon points="-5,0 0,-3 0,3"
                    fill={colors.primary} transform="rotate(-40 11 0)" />
                {/* Gomme */}
                <rect x="19" y="-3" width="4" height="6" rx="1"
                    fill={colors.secondary} transform="rotate(-40 11 0)" />
                {/* Trait d'écriture */}
                <motion.circle
                    cx="-4" cy="0" r="1.5"
                    fill={colors.accent}
                    animate={{ opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                />
            </motion.g>
        </svg>
    );
}

// ─── Thème NOTEBOOK (cahier à spirale + page qui tourne) ──
function NotebookAnimation({ colors }: { colors: PaletteColors }) {
    return (
        <svg viewBox="0 0 80 80" fill="none" style={{ perspective: '300px' }}>
            {/* Couverture arrière */}
            <rect x="14" y="10" width="52" height="60" rx="3"
                fill={colors.page} stroke={colors.primary} strokeWidth={1.5} />

            {/* Spirale */}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <motion.circle
                    key={i}
                    cx="18" cy={16 + i * 8}
                    r="2.5"
                    fill="none"
                    stroke={colors.accent}
                    strokeWidth={1}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.2 }}
                />
            ))}

            {/* Lignes du cahier */}
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.line
                    key={`line-${i}`}
                    x1="24" y1={22 + i * 9}
                    x2="60" y2={22 + i * 9}
                    stroke={colors.lines}
                    strokeWidth={0.6}
                    strokeLinecap="round"
                    variants={lineVariants}
                    custom={i}
                />
            ))}

            {/* Page qui tourne */}
            <motion.g
                style={{ transformOrigin: '14px 40px' }}
                variants={pageTurnVariants}
                initial="hidden"
                animate="turning"
            >
                <rect x="14" y="10" width="52" height="60" rx="3"
                    fill={colors.page} stroke={colors.primary} strokeWidth={1}
                    opacity={0.85} />
                {/* Lignes sur la page mobile */}
                {[0, 1, 2, 3].map((i) => (
                    <line
                        key={`tl-${i}`}
                        x1="24" y1={22 + i * 9}
                        x2="56" y2={22 + i * 9}
                        stroke={colors.lines}
                        strokeWidth={0.5}
                        strokeLinecap="round"
                        opacity={0.5}
                    />
                ))}
            </motion.g>
        </svg>
    );
}

// ─── Thème GLOBE (globe terrestre + méridiens) ─────
function GlobeAnimation({ colors }: { colors: PaletteColors }) {
    return (
        <svg viewBox="0 0 80 80" fill="none">
            {/* Globe */}
            <motion.g variants={fadeInVariants} initial="hidden" animate="visible">
                {/* Océan */}
                <circle cx="40" cy="40" r="28"
                    fill={colors.ocean} opacity={0.15}
                    stroke={colors.ocean} strokeWidth={1.5} />

                {/* Méridiens et parallèles (rotation) */}
                <motion.g
                    style={{ transformOrigin: '40px 40px' }}
                    variants={globeSpinVariants}
                    initial="hidden"
                    animate="spinning"
                >
                    {/* Méridien principal */}
                    <ellipse cx="40" cy="40" rx="12" ry="28"
                        fill="none" stroke={colors.accent} strokeWidth={0.8} opacity={0.6} />
                    {/* Méridien secondaire */}
                    <ellipse cx="40" cy="40" rx="24" ry="28"
                        fill="none" stroke={colors.accent} strokeWidth={0.6} opacity={0.4} />
                    {/* Continents stylisés */}
                    <motion.path
                        d="M32 25 Q36 22 40 24 Q44 26 42 30 Q38 32 34 28 Z"
                        fill={colors.land} opacity={0.6}
                    />
                    <motion.path
                        d="M44 36 Q50 34 52 38 Q54 44 48 46 Q44 44 44 40 Z"
                        fill={colors.land} opacity={0.5}
                    />
                    <motion.path
                        d="M28 40 Q32 38 34 42 Q32 46 28 44 Z"
                        fill={colors.land} opacity={0.5}
                    />
                </motion.g>

                {/* Parallèles fixes */}
                {[-14, -7, 0, 7, 14].map((offset, i) => (
                    <motion.line
                        key={i}
                        x1={40 - Math.sqrt(Math.max(0, 28 * 28 - offset * offset))}
                        y1={40 + offset}
                        x2={40 + Math.sqrt(Math.max(0, 28 * 28 - offset * offset))}
                        y2={40 + offset}
                        stroke={colors.accent}
                        strokeWidth={0.4}
                        opacity={0.3}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.3 }}
                    />
                ))}

                {/* Point lumineux orbital */}
                <motion.circle
                    r="2"
                    fill={colors.pencil}
                    animate={{
                        cx: [40, 68, 40, 12, 40],
                        cy: [12, 40, 68, 40, 12],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            </motion.g>
        </svg>
    );
}

// ─── Mapping thème → composant ─────────────────────
const THEME_COMPONENTS: Record<string, React.FC<{ colors: PaletteColors }>> = {
    book: BookAnimation,
    pencil: PencilAnimation,
    notebook: NotebookAnimation,
    globe: GlobeAnimation,
};

// ─── Composant principal ────────────────────────────
interface SchoolLoadingProps {
    /** Thème visuel : 'book' (défaut), 'pencil', 'notebook', 'globe' */
    theme?: 'book' | 'pencil' | 'notebook' | 'globe';
    /** Variante : 'full' (page entière) ou 'compact' (onglet/section) */
    variant?: 'full' | 'compact';
    /** Message personnalisé */
    message?: string;
    /** Classe CSS supplémentaire */
    className?: string;
}

export function SchoolLoading({
    theme = 'book',
    variant = 'full',
    message,
    className,
}: SchoolLoadingProps) {
    const colors = useSchoolColors();

    const svgSize = variant === 'full'
        ? 'clamp(80px, 15vw, 120px)'
        : 'clamp(48px, 8vw, 72px)';

    const textSize = variant === 'full'
        ? 'clamp(0.75rem, 1.5vw, 0.875rem)'
        : 'clamp(0.625rem, 1.2vw, 0.75rem)';

    const AnimationComponent = THEME_COMPONENTS[theme] || BookAnimation;

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-[var(--gap-md)]',
                variant === 'full' ? 'min-h-[clamp(200px,40vh,400px)]' : 'min-h-[clamp(120px,20vh,200px)]',
                className,
            )}
            role="status"
            aria-label="Chargement"
        >
            <div style={{ width: svgSize, height: svgSize }}>
                <AnimationComponent colors={colors} />
            </div>

            {/* Message */}
            <motion.p
                className="animate-pulse-soft"
                style={{
                    color: colors.text,
                    fontSize: textSize,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                {message || 'Chargement...'}
            </motion.p>
        </div>
    );
}

export default SchoolLoading;
