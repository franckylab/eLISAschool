/**
 * ==================================
 * eLISAschool - SplashScreen v2
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Écran de démarrage avec :
 * - Logo SVG qui se dessine trait par trait (book + eS)
 * - Texte "elisaschool" en reveal lettre par lettre
 * - Version affichée
 * - Barre de progression style règle/graduation
 * - Thème auto (light/dark)
 * - Ultra-responsive (clamp)
 * - Durée minimum : 5s (gérée par App.tsx)
 */

import { motion, type Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

// ─── Palette auto (light/dark) ─────────────────────
const PALETTE = {
    light: {
        primary: '#1a3a5c',
        secondary: '#5a8a5c',
        accent: '#2e6b8a',
        text: '#1a3a5c',
        textSecondary: '#5a8a5c',
        tagline: '#6b7280',
        surface: 'var(--color-background, #ffffff)',
        track: '#e5e7eb',
        tick: '#d1d5db',
    },
    dark: {
        primary: '#f1f5f9',
        secondary: '#4ade80',
        accent: '#cbd5e1',
        text: '#f1f5f9',
        textSecondary: '#4ade80',
        tagline: '#94a3b8',
        surface: 'var(--color-background, #111827)',
        track: '#374151',
        tick: '#4b5563',
    },
};

// ─── Animation variants ─────────────────────────────
const drawVariant: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (delay: number) => ({
        pathLength: 1,
        opacity: 1,
        transition: { delay, duration: 0.7, ease: 'easeInOut' },
    }),
};

const fadeInVariant: Variants = {
    hidden: { opacity: 0, y: 6 },
    visible: (delay: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay, duration: 0.5, ease: 'easeOut' },
    }),
};

const letterVariants: Variants = {
    hidden: { opacity: 0, y: 8, scale: 0.9 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            delay: 1.3 + i * 0.06,
            duration: 0.35,
            ease: 'easeOut',
        },
    }),
};

// ─── Composant : Logo SVG animé (dessin trait par trait) ──
function AnimatedLogoMark({ colors }: { colors: typeof PALETTE.light }) {
    return (
        <svg
            width="clamp(64px, 12vw, 96px)"
            height="clamp(64px, 12vw, 96px)"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Cercle extérieur (contour du logo) */}
            <motion.circle
                cx="32"
                cy="32"
                r="30"
                stroke={colors.primary}
                strokeWidth={0.8}
                strokeOpacity={0.15}
                fill="none"
                variants={drawVariant}
                custom={0}
            />

            {/* Livre ouvert — page gauche */}
            <motion.path
                d="M8 18C8 18 14 14 32 14V52C14 52 8 48 8 48V18Z"
                fill={colors.primary}
                fillOpacity={0.08}
                stroke={colors.primary}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={drawVariant}
                custom={0.1}
            />

            {/* Livre ouvert — page droite */}
            <motion.path
                d="M56 18C56 18 50 14 32 14V52C50 52 56 48 56 48V18Z"
                fill={colors.secondary}
                fillOpacity={0.08}
                stroke={colors.secondary}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={drawVariant}
                custom={0.25}
            />

            {/* Reliure centrale */}
            <motion.path
                d="M32 14V52"
                stroke={colors.primary}
                strokeWidth={1.2}
                strokeLinecap="round"
                opacity={0.4}
                variants={drawVariant}
                custom={0.5}
            />

            {/* Lettre "e" stylisée */}
            <motion.path
                d="M16 33C16 28.5 19.5 25 24 25C28.5 25 32 28.5 32 33H16C16 37.5 19.5 41 24 41C27 41 29.5 39.5 31 37"
                stroke={colors.primary}
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                variants={drawVariant}
                custom={0.6}
            />

            {/* Lettre "S" stylisée */}
            <motion.path
                d="M48 27C48 27 45.5 24 41 24C37.5 24 35 26 35 28.5C35 31 37 32 41 33C45 34 48 35 48 38C48 41 45 43 41 43C37 43 34 40.5 34 40.5"
                stroke={colors.secondary}
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                variants={drawVariant}
                custom={0.8}
            />

            {/* Germination (accent de croissance) */}
            <motion.path
                d="M33 20C33 20 34 17 33 14M33 14C32 16 31 17 31 17M33 14C34 16 35 17 35 17"
                stroke={colors.secondary}
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={fadeInVariant}
                custom={1.1}
            />

            {/* Point lumineux */}
            <motion.circle
                cx="33"
                cy="12"
                r="1.5"
                fill={colors.secondary}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.8 }}
                transition={{ delay: 1.3, duration: 0.3 }}
            />
        </svg>
    );
}

// ─── Composant : Texte "elisaschool" en reveal ──────
function AnimatedWordmark({ colors }: { colors: typeof PALETTE.light }) {
    const letters = 'elisaschool'.split('');

    return (
        <div className="flex items-center justify-center" aria-label="elisaschool">
            {letters.map((letter, i) => (
                <motion.span
                    key={`${letter}-${i}`}
                    className="inline-block font-bold"
                    style={{
                        color: i < 5 ? colors.text : colors.textSecondary,
                        fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
                        letterSpacing: '-0.02em',
                    }}
                    variants={letterVariants}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                >
                    {letter}
                </motion.span>
            ))}
            {/* Degré symbolique */}
            <motion.span
                className="inline-block font-bold"
                style={{
                    color: colors.secondary,
                    fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.0, duration: 0.3, type: 'spring' }}
            >
                °
            </motion.span>
        </div>
    );
}

// ─── Composant : Barre de progression style règle ───
function RulerProgressBar({
    colors,
    isIndeterminate,
}: {
    colors: typeof PALETTE.light;
    isIndeterminate: boolean;
}) {
    return (
        <div className="w-full max-w-[clamp(160px,40vw,280px)]">
            {/* Graduations (ticks) au-dessus de la barre */}
            <div className="flex justify-between mb-[2px] px-[1px]">
                {Array.from({ length: 11 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-full"
                        style={{
                            width: i % 5 === 0 ? '1.5px' : '1px',
                            height: i % 5 === 0 ? 'clamp(4px, 0.6vw, 6px)' : 'clamp(2px, 0.3vw, 3px)',
                            backgroundColor: colors.tick,
                            opacity: 0.6,
                        }}
                    />
                ))}
            </div>

            {/* Track de la barre */}
            <div
                className="relative overflow-hidden rounded-full"
                style={{
                    height: 'clamp(3px, 0.5vw, 5px)',
                    backgroundColor: colors.track,
                }}
            >
                {isIndeterminate ? (
                    <motion.div
                        className="absolute top-0 bottom-0 rounded-full"
                        style={{
                            width: '30%',
                            backgroundColor: colors.primary,
                            opacity: 0.7,
                        }}
                        animate={{ left: ['-30%', '100%'] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: [0.65, 0, 0.35, 1],
                        }}
                    />
                ) : (
                    <motion.div
                        className="h-full rounded-full relative overflow-hidden"
                        style={{ backgroundColor: colors.primary }}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3.5, ease: [0.22, 1, 0.36, 1], delay: 1.8 }}
                    >
                        {/* Shimmer */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)`,
                                animation: 'shimmer 1.8s ease-in-out infinite',
                            }}
                        />
                    </motion.div>
                )}
            </div>

            {/* Graduations en-dessous (miroir subtiles) */}
            <div className="flex justify-between mt-[2px] px-[1px]">
                {Array.from({ length: 11 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-full"
                        style={{
                            width: '1px',
                            height: i % 5 === 0 ? 'clamp(2px, 0.3vw, 3px)' : '1px',
                            backgroundColor: colors.tick,
                            opacity: 0.3,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Hook : détection thème ─────────────────────────
function useSplashColors(): typeof PALETTE.light {
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

// ─── Composant principal ────────────────────────────
interface SplashScreenProps {
    /** Version à afficher (ex: "1.0.0") */
    version?: string;
    /** Message de statut (ex: "Chargement...", "Connexion...") */
    statusMessage?: string;
    /** Classe CSS supplémentaire */
    className?: string;
}

export function SplashScreen({
    version = '1.0.0',
    statusMessage,
    className,
}: SplashScreenProps) {
    const colors = useSplashColors();

    return (
        <div
            className={cn(
                'fixed inset-0 z-[100] flex items-center justify-center',
                className,
            )}
            style={{ backgroundColor: colors.surface }}
            role="status"
            aria-label="Chargement de l'application"
        >
            {/* Cercles concentriques pulsants (arrière-plan) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    className="absolute rounded-full"
                    style={{
                        width: 'clamp(180px, 30vw, 280px)',
                        height: 'clamp(180px, 30vw, 280px)',
                        border: `1px solid ${colors.primary}`,
                    }}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: [0, 0.12, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                    className="absolute rounded-full"
                    style={{
                        width: 'clamp(120px, 20vw, 200px)',
                        height: 'clamp(120px, 20vw, 200px)',
                        border: `1px solid ${colors.secondary}`,
                    }}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1.3, opacity: [0, 0.15, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
                />
            </div>

            {/* Contenu central */}
            <div className="flex flex-col items-center gap-[clamp(1rem,3vw,2rem)] relative z-10">
                {/* Logo animé */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <AnimatedLogoMark colors={colors} />
                </motion.div>

                {/* Texte "elisaschool" */}
                <AnimatedWordmark colors={colors} />

                {/* Tagline */}
                <motion.p
                    className="tracking-widest uppercase"
                    style={{
                        color: colors.tagline,
                        fontSize: 'clamp(0.5rem, 1.2vw, 0.6875rem)',
                        letterSpacing: 'clamp(0.1em, 0.3vw, 0.2em)',
                    }}
                    variants={fadeInVariant}
                    initial="hidden"
                    animate="visible"
                    custom={2.2}
                >
                    Gestion Scolaire Intelligente
                </motion.p>

                {/* Barre de progression style règle */}
                <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6, duration: 0.4 }}
                >
                    <RulerProgressBar colors={colors} isIndeterminate />
                </motion.div>

                {/* Version + message de statut */}
                <motion.div
                    className="flex items-center gap-[var(--gap-sm)]"
                    variants={fadeInVariant}
                    initial="hidden"
                    animate="visible"
                    custom={2.5}
                >
                    <span
                        className="font-mono opacity-50"
                        style={{
                            color: colors.tagline,
                            fontSize: 'clamp(0.5rem, 1vw, 0.625rem)',
                        }}
                    >
                        v{version}
                    </span>
                    {statusMessage && (
                        <>
                            <span
                                className="opacity-30"
                                style={{ color: colors.tagline, fontSize: '0.5rem' }}
                            >
                                •
                            </span>
                            <span
                                className="animate-pulse-soft"
                                style={{
                                    color: colors.tagline,
                                    fontSize: 'clamp(0.5rem, 1vw, 0.625rem)',
                                }}
                            >
                                {statusMessage}
                            </span>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export default SplashScreen;
