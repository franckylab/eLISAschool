/**
 * ==================================
 * eLISAschool - Hook d'auto-save intelligent avec indicateur de statut
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Auto-save avec debounce, indicateur de statut visuel,
 * gestion des conflits, et feedback utilisateur.
 * Inspiré de Google Docs, Notion, et Figma.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// ==================================
// Types
// ==================================

export type SaveStatus = 
    | 'idle'           // Aucun changement
    | 'unsaved'        // Changements non sauvegardés
    | 'saving'         // Sauvegarde en cours
    | 'saved'          // Sauvegardé avec succès
    | 'error'          // Erreur de sauvegarde
    | 'offline'        // Hors ligne
    | 'conflict';      // Conflit détecté

export interface AutoSaveConfig {
    enabled: boolean;
    debounceMs: number; // Délai avant auto-save (défaut: 3000ms)
    showToasts: boolean;
    maxRetries: number;
    retryDelayMs: number;
    onBeforeSave?: () => boolean | Promise<boolean>; // Hook pour validation
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
    onConflict?: () => void;
}

export interface AutoSaveState {
    status: SaveStatus;
    lastSavedAt: Date | null;
    retryCount: number;
    hasUnsavedChanges: boolean;
    timeSinceLastSave: number; // Secondes
}

// ==================================
// Hook principal
// ==================================

export function useAutoSave<T>(
    data: T,
    saveFn: (data: T) => Promise<any>,
    config: AutoSaveConfig = {
        enabled: true,
        debounceMs: 3000,
        showToasts: true,
        maxRetries: 3,
        retryDelayMs: 1000,
    }
): AutoSaveState {
    const [status, setStatus] = useState<SaveStatus>('idle');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [timeSinceLastSave, setTimeSinceLastSave] = useState(0);

    const dataRef = useRef(data);
    const lastSavedDataRef = useRef<string>('');
    const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const isMountedRef = useRef(true);

    // Mettre à jour la référence de données
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // Détecter les changements
    useEffect(() => {
        const currentDataStr = JSON.stringify(data);
        const hasChanges = currentDataStr !== lastSavedDataRef.current;
        
        if (hasChanges && status === 'idle') {
            setStatus('unsaved');
        } else if (!hasChanges && status === 'unsaved') {
            setStatus('idle');
        }
    }, [data, status]);

    // Timer pour timeSinceLastSave
    useEffect(() => {
        if (!lastSavedAt) return;
        
        const interval = setInterval(() => {
            setTimeSinceLastSave(Math.floor((Date.now() - lastSavedAt.getTime()) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [lastSavedAt]);

    // Fonction de sauvegarde
    const performSave = useCallback(async (showToast: boolean = true) => {
        if (!config.enabled) return;

        try {
            setStatus('saving');

            // Hook de validation avant sauvegarde
            if (config.onBeforeSave) {
                const canSave = await config.onBeforeSave();
                if (!canSave) {
                    setStatus('unsaved');
                    return;
                }
            }

            const result = await saveFn(dataRef.current);
            
            if (!isMountedRef.current) return;

            lastSavedDataRef.current = JSON.stringify(dataRef.current);
            setLastSavedAt(new Date());
            setStatus('saved');
            setRetryCount(0);

            if (showToast && config.showToasts) {
                toast.success('Page sauvegardée', {
                    duration: 2000,
                    icon: '✓',
                });
            }

            config.onSuccess?.(result);

            // Retourner à 'idle' après 2s
            setTimeout(() => {
                if (isMountedRef.current) {
                    setStatus('idle');
                }
            }, 2000);

        } catch (error) {
            if (!isMountedRef.current) return;

            const err = error as Error;
            console.error('[AutoSave] Erreur:', err);

            // Gestion des conflits
            if (err.message?.includes('conflict') || err.message?.includes('version')) {
                setStatus('conflict');
                config.onConflict?.();
                if (config.showToasts) {
                    toast.error('Conflit détecté — Veuillez recharger', {
                        duration: 5000,
                    });
                }
                return;
            }

            // Retry logic
            if (retryCount < config.maxRetries) {
                setRetryCount(prev => prev + 1);
                setStatus('unsaved');
                
                if (config.showToasts) {
                    toast.info(`Sauvegarde échouée — Tentative ${retryCount + 1}/${config.maxRetries}`, {
                        duration: 3000,
                    });
                }

                retryTimerRef.current = setTimeout(() => {
                    performSave(false);
                }, config.retryDelayMs * (retryCount + 1));
            } else {
                setStatus('error');
                config.onError?.(err);
                
                if (config.showToasts) {
                    toast.error('Erreur de sauvegarde — Cliquez pour réessayer', {
                        duration: 5000,
                    });
                }
            }
        }
    }, [config, saveFn, retryCount]);

    // Auto-save avec debounce
    useEffect(() => {
        if (!config.enabled) return;
        if (status !== 'unsaved') return;

        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = setTimeout(() => {
            performSave(true);
        }, config.debounceMs);

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, [data, status, config.enabled, config.debounceMs, performSave]);

    // Sauvegarde manuelle
    const saveNow = useCallback(() => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
        performSave(true);
    }, [performSave]);

    // Nettoyage au démontage
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        };
    }, []);

    // Détection offline/online
    useEffect(() => {
        const handleOffline = () => {
            setStatus('offline');
            if (config.showToasts) {
                toast.warning('Connexion perdue — Mode hors ligne', {
                    duration: 3000,
                });
            }
        };

        const handleOnline = () => {
            setStatus('unsaved');
            if (config.showToasts) {
                toast.success('Connexion rétablie', {
                    duration: 2000,
                });
            }
            // Auto-save après retour en ligne
            setTimeout(() => {
                performSave(true);
            }, 1000);
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [config.showToasts, performSave]);

    return {
        status,
        lastSavedAt,
        retryCount,
        hasUnsavedChanges: status === 'unsaved' || status === 'saving',
        timeSinceLastSave,
    };
}

// ==================================
// Composant d'indicateur de statut
// ==================================

export function SaveStatusIndicator({ 
    status, 
    lastSavedAt, 
    timeSinceLastSave,
    onSaveClick,
    compact = false,
}: { 
    status: SaveStatus;
    lastSavedAt: Date | null;
    timeSinceLastSave: number;
    onSaveClick?: () => void;
    compact?: boolean;
}) {
    const formatTime = (seconds: number): string => {
        if (seconds < 5) return 'à l\'instant';
        if (seconds < 60) return `il y a ${seconds}s`;
        if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}min`;
        return `il y a ${Math.floor(seconds / 3600)}h`;
    };

    const getStatusConfig = () => {
        switch (status) {
            case 'idle':
                return {
                    icon: '✓',
                    label: 'Sauvegardé',
                    color: '#10b981',
                    bgColor: 'rgba(16, 185, 129, 0.1)',
                    borderColor: 'rgba(16, 185, 129, 0.2)',
                    clickable: false,
                };
            case 'unsaved':
                return {
                    icon: '●',
                    label: 'Modifications non sauvegardées',
                    color: '#f59e0b',
                    bgColor: 'rgba(245, 158, 11, 0.1)',
                    borderColor: 'rgba(245, 158, 11, 0.2)',
                    clickable: true,
                };
            case 'saving':
                return {
                    icon: '◌',
                    label: 'Sauvegarde...',
                    color: '#3b82f6',
                    bgColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 0.2)',
                    clickable: false,
                    spinning: true,
                };
            case 'saved':
                return {
                    icon: '✓',
                    label: 'Sauvegardé',
                    color: '#10b981',
                    bgColor: 'rgba(16, 185, 129, 0.1)',
                    borderColor: 'rgba(16, 185, 129, 0.2)',
                    clickable: false,
                };
            case 'error':
                return {
                    icon: '⚠',
                    label: 'Erreur de sauvegarde',
                    color: '#ef4444',
                    bgColor: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                    clickable: true,
                };
            case 'offline':
                return {
                    icon: '⊘',
                    label: 'Hors ligne',
                    color: '#64748b',
                    bgColor: 'rgba(100, 116, 139, 0.1)',
                    borderColor: 'rgba(100, 116, 139, 0.2)',
                    clickable: false,
                };
            case 'conflict':
                return {
                    icon: '⚡',
                    label: 'Conflit détecté',
                    color: '#dc2626',
                    bgColor: 'rgba(220, 38, 38, 0.1)',
                    borderColor: 'rgba(220, 38, 38, 0.2)',
                    clickable: true,
                };
        }
    };

    const config = getStatusConfig();

    if (compact) {
        return (
            <button
                onClick={config.clickable ? onSaveClick : undefined}
                className="cms-save-status-compact"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${config.borderColor}`,
                    background: config.bgColor,
                    color: config.color,
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: config.clickable ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                }}
                title={config.label}
            >
                <span style={{ 
                    fontSize: '12px',
                    animation: config.spinning ? 'spin 1s linear infinite' : 'none',
                }}>
                    {config.icon}
                </span>
                {!config.spinning && lastSavedAt && (
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>
                        {formatTime(timeSinceLastSave)}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div
            className="cms-save-status-indicator"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${config.borderColor}`,
                background: config.bgColor,
                transition: 'all 0.2s ease',
            }}
        >
            <span style={{ 
                fontSize: '16px',
                color: config.color,
                animation: config.spinning ? 'spin 1s linear infinite' : 'none',
            }}>
                {config.icon}
            </span>
            <div style={{ flex: 1 }}>
                <div style={{ 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    color: config.color,
                    marginBottom: '2px',
                }}>
                    {config.label}
                </div>
                {lastSavedAt && status !== 'saving' && (
                    <div style={{ 
                        fontSize: '10px', 
                        color: '#64748b',
                    }}>
                        {formatTime(timeSinceLastSave)}
                    </div>
                )}
            </div>
            {config.clickable && onSaveClick && (
                <button
                    onClick={onSaveClick}
                    style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${config.borderColor}`,
                        background: 'white',
                        color: config.color,
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                >
                    {status === 'error' ? 'Réessayer' : 'Sauvegarder'}
                </button>
            )}
        </div>
    );
}

// CSS pour l'animation
const style = document.createElement('style');
style.textContent = `
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);
