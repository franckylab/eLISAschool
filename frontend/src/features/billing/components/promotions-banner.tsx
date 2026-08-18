/**
 * ==================================
 * eLISAschool - Bannière Promotions Client
 * ==================================
 * Bannière non-intrusive affichant les promotions actives/expirant bientôt.
 * Polling toutes les 5 min via TanStack Query (pas de WebSocket).
 * Dismissible, responsive, dark mode.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Clock, Tag } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { Promotion } from '@/features/billing/types/promotion.types';

const DISMISS_KEY = 'promo-banner-dismissed';
const DISMISS_DURATION = 4 * 60 * 60 * 1000; // 4 heures

function usePromotionsBanner() {
    return useQuery<Promotion[]>({
        queryKey: ['promotions-banner'],
        queryFn: async () => {
            const res = await apiClient.get('/api/billing/promotions/eligibles');
            const payload = res.data as any;
            return payload?.data ?? payload ?? [];
        },
        refetchInterval: 5 * 60 * 1000, // 5 minutes
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function PromotionsBanner() {
    const { data } = usePromotionsBanner();
    const [dismissed, setDismissed] = useState(false);

    // Vérifier si la bannière a été dismissée récemment
    useEffect(() => {
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DURATION) {
            setDismissed(true);
        }
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };

    if (dismissed || !data?.length) return null;

    const promos = data;
    const maintenant = new Date();
    const dans7Jours = new Date(maintenant.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Promotions expirant bientôt (7 jours)
    const expirantBientot = promos.filter(
        (p) => p.dateFin && new Date(p.dateFin) <= dans7Jours && new Date(p.dateFin) > maintenant
    );

    // Message dynamique
    const message = expirantBientot.length > 0
        ? `${expirantBientot.length} promotion${expirantBientot.length > 1 ? 's' : ''} expire${expirantBientot.length > 1 ? 'nt' : ''} bientôt !`
        : `${promos.length} promotion${promos.length > 1 ? 's' : ''} active${promos.length > 1 ? 's' : ''} sur votre abonnement`;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden border-b border-amber-200/50 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30"
            >
                <div className="flex items-center gap-2 px-[clamp(0.75rem,0.5rem+1vw,1.5rem)] py-2 text-xs sm:text-sm">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
                    <Tag className="hidden h-3.5 w-3.5 shrink-0 text-orange-400 sm:block" />
                    <span className="flex-1 truncate font-medium text-amber-800 dark:text-amber-200">
                        {message}
                    </span>
                    {expirantBientot.length > 0 && (
                        <span className="hidden items-center gap-1 rounded-full bg-amber-200/50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 sm:inline-flex dark:bg-amber-800/30 dark:text-amber-300">
                            <Clock className="h-3 w-3" />
                            {expirantBientot.length}
                        </span>
                    )}
                    <a
                        href="/mon-abonnement"
                        className="ml-1 rounded-md p-1 text-amber-600 transition-colors hover:bg-amber-200/50 hover:text-amber-800 dark:text-amber-400 dark:hover:bg-amber-800/30"
                        aria-label="Voir détails"
                        title="Voir mes promotions"
                    >
                        <Tag className="h-3.5 w-3.5" />
                    </a>
                    <button
                        onClick={handleDismiss}
                        className="rounded-md p-1 text-amber-600 transition-colors hover:bg-amber-200/50 hover:text-amber-800 dark:text-amber-400 dark:hover:bg-amber-800/30"
                        aria-label="Fermer"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
