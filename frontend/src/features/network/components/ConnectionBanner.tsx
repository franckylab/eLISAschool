import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, WifiOff, AlertTriangle } from 'lucide-react';
import { useConnectionStore } from '../stores/connection.store';

const CRITICAL_DELAY_MS = 30000;

export function ConnectionBanner() {
    const { t } = useTranslation('common');
    const state = useConnectionStore((s) => s.state);
    const bannerDismissed = useConnectionStore((s) => s.bannerDismissed);
    const dismissBanner = useConnectionStore((s) => s.dismissBanner);
    const [show, setShow] = useState(false);
    const wasCritical = useRef(false);

    const isCritical = state === 'server-down' || state === 'offline';

    useEffect(() => {
        if (!isCritical) {
            setShow(false);
            return;
        }
        if (bannerDismissed) return;

        const timer = setTimeout(() => {
            setShow(true);
        }, CRITICAL_DELAY_MS);

        return () => clearTimeout(timer);
    }, [isCritical, bannerDismissed]);

    useEffect(() => {
        if (!wasCritical.current && isCritical) {
            setShow(false);
        }
        wasCritical.current = isCritical;
    }, [isCritical]);

    const icon = state === 'offline' ? WifiOff : AlertTriangle;
    const Icon = icon;
    const bannerBg = state === 'offline'
        ? 'bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30'
        : 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30';
    const textColor = state === 'offline'
        ? 'text-[var(--color-danger)]'
        : 'text-[var(--color-warning)]';
    const labelKey = state === 'offline' ? 'network.bannerOffline' : 'network.bannerServerDown';

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className={`overflow-hidden border-b ${bannerBg}`}
                >
                    <div className="flex items-center justify-between px-3 py-1.5 xs:px-4 xs:py-2 sm:px-6">
                        <div className="flex items-center gap-1.5 xs:gap-2">
                            <Icon className={`h-3.5 w-3.5 xs:h-4 xs:w-4 ${textColor}`} />
                            <span className={`text-[10px] font-medium xs:text-xs sm:text-sm ${textColor}`}>
                                {t(labelKey)}
                            </span>
                        </div>
                        <button
                            onClick={dismissBanner}
                            className={`rounded p-0.5 transition-colors hover:bg-[var(--color-surface-hover)] ${textColor}`}
                            aria-label={t('boutons.fermer')}
                        >
                            <X className="h-3 w-3 xs:h-3.5 xs:w-3.5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
