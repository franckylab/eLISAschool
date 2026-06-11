/**
 * ==================================
 * eLISAschool - SplashScreen
 * ==================================
 * Écran de chargement avec animation stylo + livre ouvert
 */

import { motion } from 'framer-motion';

export function SplashScreen() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-fond)]">
            <div className="flex flex-col items-center gap-6">
                {/* Logo animé : livre ouvert */}
                <motion.div
                    className="relative"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Livre gauche */}
                        <motion.path
                            d="M10 20 C10 20 15 15 40 15 L40 65 C15 65 10 60 10 60 Z"
                            fill="var(--color-dominante)"
                            opacity="0.8"
                            initial={{ rotateY: -30 }}
                            animate={{ rotateY: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        />
                        {/* Livre droit */}
                        <motion.path
                            d="M70 20 C70 20 65 15 40 15 L40 65 C65 65 70 60 70 60 Z"
                            fill="var(--color-dominante)"
                            opacity="0.6"
                            initial={{ rotateY: 30 }}
                            animate={{ rotateY: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        />
                        {/* Stylo */}
                        <motion.line
                            x1="40" y1="10" x2="40" y2="70"
                            stroke="white"
                            strokeWidth="2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                        />
                    </svg>
                </motion.div>

                {/* Nom de l'app */}
                <motion.h1
                    className="text-2xl font-bold text-[var(--color-dominante)]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                >
                    elisa<span className="text-[var(--color-accent)]">°</span>school
                </motion.h1>

                {/* Barre de chargement */}
                <motion.div className="h-1 w-32 overflow-hidden rounded-full bg-[var(--color-bordure)]">
                    <motion.div
                        className="h-full rounded-full bg-[var(--color-dominante)]"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                    />
                </motion.div>
            </div>
        </div>
    );
}
