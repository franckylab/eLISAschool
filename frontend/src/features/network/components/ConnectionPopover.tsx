import { useTranslation } from 'react-i18next';
import * as Popover from '@radix-ui/react-popover';
import { motion } from 'framer-motion';
import { useConnectionStore } from '../stores/connection.store';
import { usePermissions } from '@/hooks/use-permissions';

export function ConnectionPopover() {
    const { t } = useTranslation('common');
    const state = useConnectionStore((s) => s.state);
    const details = useConnectionStore((s) => s.details);
    const checkConnection = useConnectionStore((s) => s.checkConnection);
    const { hasPermission } = usePermissions();
    const canViewDetails = hasPermission('network:details');
    const canViewAdmin = hasPermission('network:admin');

    // Convertir kebab-case → camelCase pour les clés i18n
    const stateKey = state.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const stateLabel = t(`network.${stateKey}`);
    const stateDesc = t(`network.${stateKey}Desc`);
    const lastChecked = details.lastChecked
        ? details.lastChecked.toLocaleTimeString()
        : '—';

    const serverStatusKey: Record<string, string> = {
        ok: 'network.serverStatus_ok',
        degraded: 'network.serverStatus_degraded',
        down: 'network.serverStatus_down',
    };

    const badgeVariant = state === 'connected' || state === 'lan-only' ? 'bg-[var(--color-dominant-500)]' :
        state === 'degraded' ? 'bg-[var(--color-warning)]' :
        'bg-[var(--color-danger)]';

    return (
        <Popover.Portal>
            <Popover.Content
                sideOffset={8}
                align="end"
                className="z-50 w-[calc(100vw-2rem)] min-w-[220px] max-w-[300px] rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-0 shadow-lg xs:w-[260px] xs:p-1 sm:w-[280px]"
            >
                <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[var(--color-bordure)] px-3 py-2">
                        <span className="text-xs font-semibold text-[var(--color-texte)] xs:text-sm">
                            {t('network.statusTitle')}
                        </span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white ${badgeVariant} xs:text-xs`}>
                            {stateLabel}
                        </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 px-3 py-2">
                        <DetailRow
                            label={t('network.state')}
                            value={stateLabel}
                        />
                        <p className="text-[9px] text-[var(--color-texte-secondaire)] xs:text-[10px]">
                            {stateDesc}
                        </p>
                        {canViewDetails && (
                            <>
                                <DetailRow
                                    label={t('network.latency')}
                                    value={details.serverLatency !== null ? `${details.serverLatency}ms` : '—'}
                                />
                                <DetailRow
                                    label={t('network.serverStatus')}
                                    value={details.serverStatus && serverStatusKey[details.serverStatus]
                                        ? t(serverStatusKey[details.serverStatus])
                                        : '—'}
                                    valueColor={details.serverStatus === 'down'
                                        ? 'var(--color-danger)'
                                        : details.serverStatus === 'degraded' ? 'var(--color-warning)' : undefined}
                                />
                                <DetailRow
                                    label={t('network.database')}
                                    value={details.databaseConnected !== null
                                        ? (details.databaseConnected ? t('network.dbConnected') : t('network.dbDisconnected'))
                                        : '—'}
                                    valueColor={details.databaseConnected === false ? 'var(--color-danger)' : undefined}
                                />
                                <DetailRow
                                    label={t('network.memory')}
                                    value={details.freeMemoryMB !== null
                                        ? `${details.freeMemoryMB} MB`
                                        : '—'}
                                    valueColor={details.memoryOk === false ? 'var(--color-warning)' : undefined}
                                />
                                <DetailRow
                                    label={t('network.internet')}
                                    value={details.internetAccess !== null
                                        ? (details.internetAccess ? t('network.internetActive') : t('network.internetInactive'))
                                        : '—'}
                                    valueColor={details.internetAccess === false ? 'var(--color-warning)' : undefined}
                                />
                            </>
                        )}
                        <DetailRow
                            label={t('network.lastChecked')}
                            value={lastChecked}
                            muted
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-[var(--color-bordure)] px-3 py-1.5">
                        <button
                            onClick={() => checkConnection()}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10 xs:text-xs"
                        >
                            {t('network.refresh')}
                        </button>
                        {canViewAdmin && (
                            <button
                                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[var(--color-texte-secondaire)] transition-colors hover:bg-[var(--color-surface-hover)] xs:text-xs"
                            >
                                {t('network.monitoring')}
                            </button>
                        )}
                    </div>
                </motion.div>

                <Popover.Arrow className="fill-[var(--color-surface)]" />
            </Popover.Content>
        </Popover.Portal>
    );
}

function DetailRow({
    label,
    value,
    valueColor,
    muted,
}: {
    label: string;
    value: string;
    valueColor?: string;
    muted?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-[var(--color-texte-secondaire)] xs:text-xs">
                {label}
            </span>
            <span
                className={`truncate text-right text-[10px] font-medium xs:text-xs ${
                    muted ? 'text-[var(--color-texte-secondaire)]' : 'text-[var(--color-texte)]'
                }`}
                style={valueColor ? { color: valueColor } : undefined}
            >
                {value}
            </span>
        </div>
    );
}
