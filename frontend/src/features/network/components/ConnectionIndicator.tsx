import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import * as Popover from '@radix-ui/react-popover';
import { useConnectionStore } from '../stores/connection.store';
import { useConnectionStatus } from '../hooks/use-connection-status';
import { usePermissions } from '@/hooks/use-permissions';
import { ConnectionPopover } from './ConnectionPopover';
import type { ConnectionState } from '../types/network.types';

const STATE_CONFIG: Record<ConnectionState, {
    ringColor: string;
    dotColor: string;
    labelKey: string;
    ariaLabelKey: string;
    descKey: string;
    // Dot animation
    dotPulse: number | null;
    dotRotate: boolean;
    dotBreathe: boolean;
    // Ring animation
    ringPulse: { min: number; max: number; duration: number } | null;
    ringOpacity: number;
}> = {
    connected: {
        ringColor: 'var(--color-dominant-500)',
        dotColor: 'var(--color-dominant-500)',
        labelKey: 'network.connected',
        ariaLabelKey: 'network.connectedAria',
        descKey: 'network.connectedDesc',
        dotPulse: null,
        dotRotate: false,
        dotBreathe: true,
        ringPulse: null,
        ringOpacity: 0.6,
    },
    degraded: {
        ringColor: 'var(--color-dominant-500)',
        dotColor: 'var(--color-warning)',
        labelKey: 'network.degraded',
        ariaLabelKey: 'network.degradedAria',
        descKey: 'network.degradedDesc',
        dotPulse: 1.5,
        dotRotate: false,
        dotBreathe: false,
        ringPulse: { min: 0.4, max: 0.7, duration: 2 },
        ringOpacity: 0.6,
    },
    'server-down': {
        ringColor: 'var(--color-dominant-500)',
        dotColor: 'var(--color-danger)',
        labelKey: 'network.serverDown',
        ariaLabelKey: 'network.serverDownAria',
        descKey: 'network.serverDownDesc',
        dotPulse: 0.8,
        dotRotate: false,
        dotBreathe: false,
        ringPulse: { min: 0.3, max: 0.8, duration: 1 },
        ringOpacity: 0.6,
    },
    'lan-only': {
        ringColor: 'var(--color-warning)',
        dotColor: 'var(--color-dominant-500)',
        labelKey: 'network.lanOnly',
        ariaLabelKey: 'network.lanOnlyAria',
        descKey: 'network.lanOnlyDesc',
        dotPulse: null,
        dotRotate: true,
        dotBreathe: false,
        ringPulse: { min: 0.4, max: 0.6, duration: 3 },
        ringOpacity: 0.6,
    },
    offline: {
        ringColor: 'var(--color-danger)',
        dotColor: 'var(--color-text-muted)',
        labelKey: 'network.offline',
        ariaLabelKey: 'network.offlineAria',
        descKey: 'network.offlineDesc',
        dotPulse: null,
        dotRotate: false,
        dotBreathe: false,
        ringPulse: null,
        ringOpacity: 0.3,
    },
};

export function ConnectionIndicator() {
    const { t } = useTranslation('common');
    const state = useConnectionStore((s) => s.state);
    const databaseConnected = useConnectionStore((s) => s.details.databaseConnected);
    const { hasPermission } = usePermissions();
    const canViewDetails = hasPermission('network:details');

    useConnectionStatus();

    const cfg = STATE_CONFIG[state];
    const isCritical = state === 'server-down' || state === 'offline';

    // Dot color avec priorité : DB déconnectée → danger même si serveur OK
    const effectiveDotColor = (() => {
        // Serveur down/offline → garder la couleur de l'état
        if (state === 'server-down' || state === 'offline') return cfg.dotColor;
        // DB déconnectée → danger (système inutilisable sans DB)
        if (databaseConnected === false) return 'var(--color-danger)';
        // Sinon → couleur normale de l'état
        return cfg.dotColor;
    })();

    const dotVariants = {
        initial: { scale: 0, opacity: 0 },
        animate: {
            scale: 1,
            opacity: 1,
            transition: { type: 'spring', stiffness: 400, damping: 20 },
        },
        exit: { scale: 0, opacity: 0 },
    };

    // Animation pulse du dot
    const dotPulseAnimation = cfg.dotPulse
        ? {
              animate: {
                  scale: [1, 1.35, 1],
                  opacity: [1, 0.7, 1],
              },
              transition: {
                  duration: cfg.dotPulse,
                  repeat: Infinity,
                  ease: 'easeInOut',
              },
          }
        : null;

    // Animation rotation du dot (lan-only)
    const dotRotateAnimation = cfg.dotRotate
        ? {
              animate: { rotate: 360 },
              transition: {
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear',
              },
          }
        : null;

    // Animation breathing subtile (connected)
    const dotBreatheAnimation = cfg.dotBreathe
        ? {
              animate: { scale: [1, 1.15, 1], opacity: [1, 0.85, 1] },
              transition: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
              },
          }
        : null;

    // Animation pulse de l'anneau
    const ringPulseAnimation = cfg.ringPulse
        ? {
              animate: { opacity: [cfg.ringPulse.min, cfg.ringPulse.max, cfg.ringPulse.min] },
              transition: {
                  duration: cfg.ringPulse.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
              },
          }
        : null;

    const handleClick = () => {
        if (!canViewDetails) return;
    };

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <motion.button
                    className="relative flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:bg-[var(--color-surface-hover)] xs:h-8 xs:w-8 sm:h-9 sm:w-9"
                    aria-label={t(cfg.ariaLabelKey)}
                    title={t(cfg.labelKey)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClick}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={state}
                            className="relative flex items-center justify-center"
                            variants={dotVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            {/* Ring (outer circle — network) */}
                            {ringPulseAnimation ? (
                                <motion.svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    className="absolute"
                                    animate={ringPulseAnimation.animate}
                                    transition={ringPulseAnimation.transition}
                                >
                                    <circle
                                        cx="10"
                                        cy="10"
                                        r="8.5"
                                        fill="none"
                                        stroke={cfg.ringColor}
                                        strokeWidth="2"
                                    />
                                </motion.svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 20 20" className="absolute">
                                    <circle
                                        cx="10"
                                        cy="10"
                                        r="8.5"
                                        fill="none"
                                        stroke={cfg.ringColor}
                                        strokeWidth="2"
                                        opacity={cfg.ringOpacity}
                                    />
                                </svg>
                            )}

                            {/* Dot (inner circle — server + DB) */}
                            {dotPulseAnimation ? (
                                <motion.div
                                    className="h-1.5 w-1.5 rounded-full xs:h-2 xs:w-2 sm:h-2.5 sm:w-2.5"
                                    style={{ backgroundColor: effectiveDotColor }}
                                    animate={dotPulseAnimation.animate}
                                    transition={dotPulseAnimation.transition}
                                />
                            ) : dotRotateAnimation ? (
                                <motion.div
                                    className="h-1.5 w-1.5 rounded-full xs:h-2 xs:w-2 sm:h-2.5 sm:w-2.5"
                                    style={{
                                        background: `
                                            radial-gradient(circle at 35% 35%, rgba(255,255,255,0.35), transparent 55%),
                                            conic-gradient(${effectiveDotColor}, rgba(255,255,255,0.25), ${effectiveDotColor}, rgba(0,0,0,0.2), ${effectiveDotColor})
                                        `,
                                        boxShadow: '0 0 2px rgba(0,0,0,0.3), inset 0 -1px 1px rgba(0,0,0,0.15)',
                                    }}
                                    animate={dotRotateAnimation.animate}
                                    transition={dotRotateAnimation.transition}
                                />
                            ) : dotBreatheAnimation ? (
                                <motion.div
                                    className="h-1.5 w-1.5 rounded-full xs:h-2 xs:w-2 sm:h-2.5 sm:w-2.5"
                                    style={{ backgroundColor: effectiveDotColor }}
                                    animate={dotBreatheAnimation.animate}
                                    transition={dotBreatheAnimation.transition}
                                />
                            ) : (
                                <div
                                    className="h-1.5 w-1.5 rounded-full xs:h-2 xs:w-2 sm:h-2.5 sm:w-2.5"
                                    style={{ backgroundColor: effectiveDotColor }}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Critical indicator — small exclamation */}
                    {isCritical && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[var(--color-danger)] text-[6px] font-bold text-white xs:-right-1 xs:-top-1 xs:h-3 xs:w-3 xs:text-[7px] sm:h-3.5 sm:w-3.5 sm:text-[8px]">
                            !
                        </span>
                    )}
                </motion.button>
            </Popover.Trigger>

            {canViewDetails && (
                <ConnectionPopover />
            )}
        </Popover.Root>
    );
}
