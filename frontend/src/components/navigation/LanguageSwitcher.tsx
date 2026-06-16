/**
 * ==================================
 * eLISAschool - LanguageSwitcher Ultra-Compact
 * ==================================
 * Toggle FR/EN avec une seule lettre affichée, animations avancées
 * Design minimaliste professionnel avec feedback visuel et tactile
 */

import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/cn';

export function LanguageSwitcher() {
    const { changerLangue, isFR } = useLanguage();

    const langueActive = isFR ? 'Fr' : 'En';
    const langueInactive = isFR ? 'En' : 'Fr';

    return (
        <motion.button
            onClick={() => changerLangue(isFR ? 'en' : 'fr')}
            className={cn(
                'group relative flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-200 sm:h-8 sm:w-8 md:h-9 md:w-9',
                'border-[var(--color-bordure)] bg-[var(--color-surface)]',
                'hover:border-[var(--color-dominante)] hover:bg-[var(--color-dominante)]/5',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/40 focus:ring-offset-1',
                'active:scale-95',
            )}
            aria-label={isFR ? 'Switch to English' : 'Passer en français'}
            title={isFR ? 'Switch to English' : 'Passer en français'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            {/* Lettre active - affichée */}
            <motion.span
                key={langueActive}
                initial={{ opacity: 0, y: -8, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="font-bold text-[var(--color-texte)]"
            >
                <span className="text-xs sm:text-sm md:text-base">{langueActive[0]}</span>
                <span className="text-[10px] sm:text-xs md:text-sm opacity-80">{langueActive[1]}</span>
            </motion.span>

            {/* Indicateur subtil - point coloré en bas */}
            <motion.div
                className="absolute bottom-0.5 h-0.5 w-3 rounded-full bg-[var(--color-dominante)] sm:bottom-1 sm:w-4"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
            />

            {/* Tooltip au survol */}
            <motion.div
                className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-texte)] opacity-0 shadow-lg ring-1 ring-[var(--color-bordure)] group-hover:opacity-100"
                initial={{ y: -4 }}
                whileHover={{ y: 0 }}
                transition={{ duration: 0.15 }}
            >
                {isFR ? 'English' : 'Français'}
            </motion.div>
        </motion.button>
    );
}
