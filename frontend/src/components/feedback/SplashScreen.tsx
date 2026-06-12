/**
 * ==================================
 * eLISAschool - SplashScreen
 * ==================================
 * Écran de chargement avec logo animé professionnel
 */

import { motion } from 'framer-motion';
import { ElisaLogo } from '@/components/branding';

export function SplashScreen() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-fond)]">
            {/* Cercles concentriques animés */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    className="absolute h-48 w-48 rounded-full border border-[var(--color-dominante)]/5"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1.4, opacity: [0, 0.3, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                    className="absolute h-32 w-32 rounded-full border border-[var(--color-dominante)]/8"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: [0, 0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                />
            </div>

            <div className="flex flex-col items-center gap-8">
                {/* Logo principal animé */}
                <motion.div
                    initial={{ scale: 0.7, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <ElisaLogo variant="full" size="lg" animated showTagline />
                </motion.div>

                {/* Barre de chargement élégante */}
                <motion.div
                    className="h-0.5 w-40 overflow-hidden rounded-full bg-[var(--color-bordure)]"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 160 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                >
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-dominante)] to-[var(--color-accent)]"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ delay: 1, duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                </motion.div>

                {/* Texte de chargement */}
                <motion.p
                    className="text-xs tracking-widest uppercase text-[var(--color-texte-secondaire)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.7, 0.7, 0] }}
                    transition={{ delay: 1.2, duration: 2.5, repeat: Infinity }}
                >
                    Chargement...
                </motion.p>
            </div>
        </div>
    );
}
