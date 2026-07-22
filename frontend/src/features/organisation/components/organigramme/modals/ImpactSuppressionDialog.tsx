/**
 * ==================================
 * eLISAschool - Dialog impact suppression unité
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Affiche l'impact de la suppression d'une unité (descendants, postes, membres,
 * hiérarchies) avant de confirmer la suppression.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, GitBranch, Briefcase, Users, Link2, Loader2 } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useGetImpactUnite, useSupprimerUnite } from '../../../hooks/use-unites';
import type { OrganigrammeNode } from '../../../types/organisation.types';

interface ImpactSuppressionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    unite: OrganigrammeNode | null;
    onDeleted?: () => void;
}

export function ImpactSuppressionDialog({ open, onOpenChange, unite, onDeleted }: ImpactSuppressionDialogProps) {
    const { t } = useTranslation('organisation');
    const { mutateAsync: getImpact, data: impact, isPending: isLoadingImpact, reset: resetImpact } = useGetImpactUnite();
    const { mutateAsync: supprimerUnite, isPending: isDeleting } = useSupprimerUnite();

    // Charger l'impact à l'ouverture
    useEffect(() => {
        if (open && unite?.id) {
            getImpact(unite.id).catch(() => {});
        }
        if (!open) {
            resetImpact();
        }
    }, [open, unite?.id, getImpact, resetImpact]);

    const handleConfirm = async () => {
        if (!unite) return;
        try {
            await supprimerUnite(unite.id);
            onOpenChange(false);
            onDeleted?.();
        } catch {
            // L'erreur est gérée par le hook
        }
    };

    const totalImpact = impact
        ? impact.descendants + impact.postes + impact.membresTotal + impact.hierarchies
        : 0;

    const impactItems = impact
        ? [
            { icon: GitBranch, label: t('organigramme.impact.enfantsDirect', 'Enfants directs'), value: impact.enfants, sub: impact.descendants > 0 ? t('organigramme.impact.descendants', '{{count}} descendants', { count: impact.descendants }) : undefined },
            { icon: Briefcase, label: t('organigramme.impact.postes', 'Postes'), value: impact.postes, sub: impact.postesOccupes > 0 ? t('organigramme.impact.postesOccupes', '{{count}} occupés', { count: impact.postesOccupes }) : undefined },
            { icon: Users, label: t('organigramme.impact.membres', 'Membres'), value: impact.membresTotal, sub: impact.membresDirect > 0 ? t('organigramme.impact.membresDirect', '{{count}} directs', { count: impact.membresDirect }) : undefined },
            { icon: Link2, label: t('organigramme.impact.hierarchies', 'Hiérarchies'), value: impact.hierarchies },
        ]
        : [];

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v && !isDeleting) onOpenChange(false); }}
            title={t('organigramme.impact.titre', 'Supprimer cette unité ?')}
            description={unite ? `${unite.nom} (${unite.code})` : undefined}
            size="md"
            showClose={!isDeleting}
            closeOnOverlayClick={!isDeleting}
            footer={<>
                <ElisaButton
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    disabled={isDeleting}
                >
                    {t('common:boutons.annuler', 'Annuler')}
                </ElisaButton>
                <ElisaButton
                    variant="danger"
                    size="sm"
                    onClick={handleConfirm}
                    isLoading={isDeleting}
                >
                    {isDeleting
                        ? t('common:boutons.suppression', 'Suppression...')
                        : t('common:boutons.supprimer', 'Supprimer')
                    }
                </ElisaButton>
            </>}
        >
            <div className="space-y-4">
                {/* Alerte */}
                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-error, #ef4444)' + '10' }}>
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-error, #ef4444)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary, #64748b)' }}>
                        {t('organigramme.impact.warning', 'Cette action est irréversible. Les unités enfants et les données associées seront également supprimées.')}
                    </p>
                </div>

                {/* Impact */}
                {isLoadingImpact ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
                        <span className="ml-2 text-sm text-[var(--color-text-muted)]">
                            {t('organigramme.impact.calcul', 'Calcul de l\'impact...')}
                        </span>
                    </div>
                ) : impact ? (
                    <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                            {totalImpact > 0
                                ? t('organigramme.impact.resume', 'Éléments affectés :')
                                : t('organigramme.impact.aucunImpact', 'Aucun élément affecté')
                            }
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {impactItems.map(item => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.label}
                                        className="flex items-center gap-2 p-2.5 rounded-lg border"
                                        style={{ borderColor: 'var(--color-bordure)' }}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                                {item.value}
                                            </div>
                                            <div className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                                                {item.label}
                                            </div>
                                            {item.sub && (
                                                <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                                    {item.sub}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        </CustomModal>
    );
}
