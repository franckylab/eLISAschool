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
    const { data: impact, isLoading: isLoadingImpact } = useGetImpactUnite(open && unite?.id ? unite.id : null);
    const { mutateAsync: supprimerUnite, isPending: isDeleting } = useSupprimerUnite();

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
            <div className="flex flex-col" style={{ gap: 'var(--space-md)' }}>
                {/* Alerte */}
                <div
                    className="flex items-start rounded-lg bg-destructive/10"
                    style={{ gap: 'var(--gap-sm)', padding: 'var(--space-sm)' }}
                >
                    <AlertTriangle className="flex-shrink-0 text-destructive" style={{ width: 'var(--icon-md)', height: 'var(--icon-md)', marginTop: '0.125rem' }} />
                    <p style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)', color: 'var(--color-text-secondary)' }}>
                        {t('organigramme.impact.warning', 'Cette action est irréversible. Les unités enfants et les données associées seront également supprimées.')}
                    </p>
                </div>

                {/* Impact */}
                {isLoadingImpact ? (
                    <div className="flex items-center justify-center" style={{ padding: 'var(--space-xl) 0' }}>
                        <Loader2 className="animate-spin text-[var(--color-text-muted)]" style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
                        <span className="ml-2 text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                            {t('organigramme.impact.calcul', 'Calcul de l\'impact...')}
                        </span>
                    </div>
                ) : impact ? (
                    <div className="flex flex-col" style={{ gap: 'var(--gap-xs)' }}>
                        <p className="font-medium uppercase tracking-wide" style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)', color: 'var(--color-text-muted)' }}>
                            {totalImpact > 0
                                ? t('organigramme.impact.resume', 'Éléments affectés :')
                                : t('organigramme.impact.aucunImpact', 'Aucun élément affecté')
                            }
                        </p>
                        <div className="grid grid-cols-2" style={{ gap: 'var(--gap-xs)' }}>
                            {impactItems.map(item => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.label}
                                        className="flex items-center rounded-lg border"
                                        style={{ gap: 'var(--gap-xs)', padding: 'var(--space-sm)', borderColor: 'var(--color-bordure)' }}
                                    >
                                        <Icon className="flex-shrink-0" style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: 'var(--color-text-muted)' }} />
                                        <div className="min-w-0">
                                            <div className="font-semibold" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)', color: 'var(--color-text)' }}>
                                                {item.value}
                                            </div>
                                            <div className="truncate" style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.6875rem)', color: 'var(--color-text-muted)' }}>
                                                {item.label}
                                            </div>
                                            {item.sub && (
                                                <div style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.6875rem)', color: 'var(--color-text-muted)' }}>
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
