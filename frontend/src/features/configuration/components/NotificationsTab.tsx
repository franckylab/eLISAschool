/**
 * ==================================
 * eLISAschool - Tab Notifications (connecté API)
 * ==================================
 * Configuration des canaux et préférences de notification.
 * Connecté aux vrais paramètres NOTIFICATION via useParametres.
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, Mail, Smartphone, Monitor, Radio, Save, Loader2 } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaToggle } from '@/components/ui/ElisaToggle';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useParametres, useModifierParametre } from '../hooks/use-configuration';
import type { ParametreSysteme } from '../types/configuration.types';

// Icônes par canal
const CANAL_ICONS: Record<string, { icon: typeof Mail; color: string }> = {
    'notifications.email': { icon: Mail, color: 'var(--color-info-600)' },
    'notifications.sms': { icon: Smartphone, color: 'var(--color-warning-600)' },
    'notifications.push': { icon: Monitor, color: 'var(--color-accent-600)' },
    'notifications.websocket': { icon: Radio, color: 'var(--color-success-600)' },
};

const DEFAULT_ICON = { icon: Bell, color: 'var(--color-text-secondary)' };

// Mapping des clés de paramètres vers les labels i18n
const CANAL_LABELS: Record<string, { nomKey: string; descKey: string }> = {
    'notifications.email_enabled': { nomKey: 'email', descKey: 'emailDesc' },
    'notifications.sms_enabled': { nomKey: 'sms', descKey: 'smsDesc' },
    'notifications.push_enabled': { nomKey: 'push', descKey: 'pushDesc' },
    'notifications.websocket_enabled': { nomKey: 'websocket', descKey: 'websocketDesc' },
};

export function NotificationsTab() {
    const { t } = useTranslation('config-params');
    const queryClient = useQueryClient();

    // Charger les paramètres de notification
    const { data: parametresResponse, isLoading } = useParametres({
        categorie: 'NOTIFICATION',
        limit: 50,
    });

    const parametres = parametresResponse?.data ?? [];
    const modifierParametre = useModifierParametre();

    // Valeurs éditées (clé → valeur parsée)
    const [editValues, setEditValues] = useState<Record<string, any>>({});
    const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());

    // Initialiser les valeurs depuis les paramètres chargés
    useEffect(() => {
        if (parametres.length > 0) {
            const values: Record<string, any> = {};
            for (const param of parametres) {
                values[param.cle] = parseNotificationValue(param.valeur, param.typeValeur);
            }
            setEditValues(values);
            setDirtyKeys(new Set());
        }
    }, [parametres]);

    // Mettre à jour une valeur
    const updateValue = useCallback((cle: string, valeur: any) => {
        setEditValues(prev => ({ ...prev, [cle]: valeur }));
        setDirtyKeys(prev => {
            const next = new Set(prev);
            const original = parseNotificationValue(
                parametres.find(p => p.cle === cle)?.valeur || '',
                parametres.find(p => p.cle === cle)?.typeValeur || 'BOOLEAN'
            );
            if (valeur === original) {
                next.delete(cle);
            } else {
                next.add(cle);
            }
            return next;
        });
    }, [parametres]);

    // Sauvegarder tous les changements
    const handleSave = useCallback(async () => {
        if (dirtyKeys.size === 0) return;

        try {
            const promises = Array.from(dirtyKeys).map(async (cle) => {
                const param = parametres.find(p => p.cle === cle);
                if (!param) return;
                const valeur = typeof editValues[cle] === 'boolean'
                    ? String(editValues[cle])
                    : String(editValues[cle]);
                await apiClient.put(`/api/configuration/parametres/${cle}`, { valeur });
            });

            await Promise.all(promises);
            toast.success(`${dirtyKeys.size} paramètre(s) enregistré(s)`);
            queryClient.invalidateQueries({ queryKey: ['configuration'] });
            setDirtyKeys(new Set());
        } catch {
            toast.error('Erreur lors de l\'enregistrement');
        }
    }, [dirtyKeys, editValues, parametres, queryClient]);

    // Séparer les canaux des préférences
    const { canaux, preferences } = useMemo(() => {
        const canauxList: ParametreSysteme[] = [];
        const prefsList: ParametreSysteme[] = [];

        for (const param of parametres) {
            if (param.cle.includes('email_enabled') ||
                param.cle.includes('sms_enabled') ||
                param.cle.includes('push_enabled') ||
                param.cle.includes('websocket_enabled') ||
                param.cle.includes('canal')) {
                canauxList.push(param);
            } else {
                prefsList.push(param);
            }
        }

        return { canaux: canauxList, preferences: prefsList };
    }, [parametres]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-dominant-600)]" />
                <span className="ml-3 text-sm text-[var(--color-text-secondary)]">
                    {t('chargement')}
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {t('sections.notifications.titre')}
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                    {t('sections.notifications.description')}
                </p>
            </div>

            {/* Canaux de notification */}
            {canaux.length > 0 && (
                <div>
                    <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                        {t('sections.notifications.canaux.titre')}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {canaux.map((param) => {
                            const labelInfo = CANAL_LABELS[param.cle];
                            const iconInfo = CANAL_ICONS[param.cle] || DEFAULT_ICON;
                            const Icon = iconInfo.icon;
                            const isActive = Boolean(editValues[param.cle]);

                            return (
                                <div
                                    key={param.id}
                                    className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${
                                        isActive
                                            ? 'border-[var(--color-dominant-500)] bg-[var(--color-dominant-50)]'
                                            : 'border-[var(--color-bordure)] hover:border-[var(--color-text-muted)]'
                                    }`}
                                >
                                    <Icon
                                        className="h-6 w-6 shrink-0"
                                        style={{ color: isActive ? iconInfo.color : 'var(--color-text-muted)' }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                            {labelInfo ? t(`sections.notifications.${labelInfo.nomKey}`) : param.cle}
                                        </p>
                                        <p className="text-xs text-[var(--color-text-secondary)]">
                                            {labelInfo ? t(`sections.notifications.${labelInfo.descKey}`) : param.description}
                                        </p>
                                    </div>
                                    <ElisaToggle
                                        checked={isActive}
                                        onCheckedChange={(checked) => updateValue(param.cle, checked)}
                                        disabled={!param.modifiableRuntime}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Préférences par événement */}
            {preferences.length > 0 && (
                <div>
                    <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                        {t('sections.notifications.preferences.titre')}
                    </h3>
                    <div className="space-y-2">
                        {preferences.map((param) => (
                            <div
                                key={param.id}
                                className="flex items-center justify-between rounded-lg p-3 hover:bg-[var(--color-surface-hover)]"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[var(--color-text-primary)]">
                                        {param.description || param.cle}
                                    </p>
                                </div>
                                <ElisaToggle
                                    checked={Boolean(editValues[param.cle])}
                                    onCheckedChange={(checked) => updateValue(param.cle, checked)}
                                    disabled={!param.modifiableRuntime}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Fallback : aucun paramètre */}
            {parametres.length === 0 && !isLoading && (
                <div className="rounded-lg border border-dashed border-[var(--color-bordure)] p-8 text-center">
                    <Bell className="mx-auto mb-3 h-10 w-10 opacity-30 text-[var(--color-text-muted)]" />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {t('aucunParametre')}
                    </p>
                </div>
            )}

            {/* Bouton sauvegarder */}
            {dirtyKeys.size > 0 && (
                <div className="flex items-center gap-3">
                    <ElisaButton
                        variant="primary"
                        onClick={handleSave}
                        icon={<Save className="h-4 w-4" />}
                        chargement={modifierParametre.isPending}
                    >
                        {t('enregistrer')} ({dirtyKeys.size})
                    </ElisaButton>
                    <ElisaButton
                        variant="outline"
                        onClick={() => {
                            // Reset aux valeurs originales
                            const values: Record<string, any> = {};
                            for (const param of parametres) {
                                values[param.cle] = parseNotificationValue(param.valeur, param.typeValeur);
                            }
                            setEditValues(values);
                            setDirtyKeys(new Set());
                        }}
                    >
                        {t('annuler')}
                    </ElisaButton>
                </div>
            )}
        </div>
    );
}

/**
 * Parse une valeur de paramètre de notification
 */
function parseNotificationValue(valeur: string, typeValeur: string): any {
    if (typeValeur === 'BOOLEAN') return valeur === 'true' || valeur === true;
    if (typeValeur === 'NUMBER') return Number(valeur) || 0;
    return valeur;
}
