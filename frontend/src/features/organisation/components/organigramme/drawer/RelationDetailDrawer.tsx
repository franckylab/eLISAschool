/**
 * ==================================
 * eLISAschool - Drawer détail relations hiérarchiques (organigramme)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Drawer latéral 380px affichant les relations poste→poste agrégées
 * sur un lien de l'organigramme : liste des relations, suppression
 * (gated organisation:hierarchie:delete), lien vers la page Hiérarchie.
 */

import { useEffect, useCallback, useState } from 'react';
import { X, Link2, Trash2, ExternalLink, Briefcase, User, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import { useSupprimerHierarchie } from '../../../hooks/use-hierarchies';
import { libelleExtremite } from '../../hierarchie-libelles';
import type { RelationEdgeData } from '../edges/RelationEdge';
import type { HierarchiePersonnel } from '../../../types/organisation.types';

interface RelationDetailDrawerProps {
    data: RelationEdgeData | null;
    open: boolean;
    onClose: () => void;
}

function ExtremiteLabel({ relation, cote }: { relation: HierarchiePersonnel; cote: 'superieur' | 'subordonne' }) {
    const ext = libelleExtremite(relation, cote);
    const Icon = ext.type === 'poste' ? Briefcase : User;
    return (
        <div className="flex items-center min-w-0" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
            <Icon className="flex-shrink-0" style={{ width: 'var(--icon-xxs, 0.75rem)', height: 'var(--icon-xxs, 0.75rem)', color: 'var(--color-text-muted)' }} />
            <div className="flex flex-col min-w-0">
                <span className="truncate text-sm" style={{ color: 'var(--color-text)' }}>{ext.label}</span>
                {ext.sousLabel && (
                    <span className="truncate text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{ext.sousLabel}</span>
                )}
            </div>
        </div>
    );
}

export function RelationDetailDrawer({ data, open, onClose }: RelationDetailDrawerProps) {
    const { t } = useTranslation('organisation');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { mutateAsync: supprimerHierarchie, isPending: isDeleting } = useSupprimerHierarchie();
    const [relationASupprimer, setRelationASupprimer] = useState<HierarchiePersonnel | null>(null);

    const canDelete = hasPermission('organisation:hierarchie:delete');
    const canViewHierarchie = hasPermission('organisation:hierarchie:read');

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [open, handleKeyDown]);

    if (!open || !data) return null;

    const estFonctionnel = data.typeRelation === 'FONCTIONNEL';
    const couleur = estFonctionnel ? 'var(--color-accent-600)' : 'var(--color-dominant-600)';
    const fond = estFonctionnel ? 'var(--color-accent-50)' : 'var(--color-dominant-50)';
    const typeLabel = t(estFonctionnel ? 'typeRelation_FONCTIONNEL' : 'typeRelation_DIRECT');

    const handleConfirmDelete = async () => {
        if (!relationASupprimer) return;
        try {
            await supprimerHierarchie(relationASupprimer.id);
            setRelationASupprimer(null);
            if (data.relations.length <= 1) onClose();
        } catch {
            // toast géré par le hook
        }
    };

    return (
        <AnimatePresence>
            {/* Overlay */}
            <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
                key="drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                role="dialog"
                aria-modal="true"
                aria-label={t('relationsHierarchiques', 'Relations hiérarchiques')}
                className="fixed top-0 right-0 z-50 h-full w-[380px] max-w-[90vw] overflow-y-auto shadow-xl"
                style={{
                    backgroundColor: 'var(--color-surface)',
                    borderLeft: '1px solid var(--color-bordure)',
                }}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-bordure)', padding: 'var(--space-md) var(--space-lg)' }}>
                    <div className="flex items-center min-w-0" style={{ gap: 'var(--gap-sm)' }}>
                        <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)', backgroundColor: fond }}>
                            <Link2 style={{ width: 'var(--icon-md)', height: 'var(--icon-md)', color: couleur }} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                                {t('relationsHierarchiques', 'Relations hiérarchiques')}
                            </h2>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: fond, color: couleur }}>
                                {typeLabel}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="flex items-center justify-center rounded-lg hover:bg-[var(--color-dominant-50)] transition-colors flex-shrink-0" style={{ width: 'var(--icon-xl)', height: 'var(--icon-xl)' }} aria-label={t('organigramme.drawer.fermer', 'Fermer')}>
                        <X style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: 'var(--color-text-muted)' }} />
                    </button>
                </div>

                <div style={{ padding: '0 var(--space-lg) var(--space-lg)' }}>
                    {/* Unités source → cible */}
                    {(data.sourceNom || data.targetNom) && (
                        <div className="flex items-center flex-wrap text-sm" style={{ gap: 'var(--gap-xs)', padding: 'var(--space-md) 0' }}>
                            <span className="font-medium" style={{ color: 'var(--color-text)' }}>{data.sourceNom || '—'}</span>
                            <ArrowRight className="flex-shrink-0" style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)', color: couleur }} />
                            <span className="font-medium" style={{ color: 'var(--color-text)' }}>{data.targetNom || '—'}</span>
                        </div>
                    )}

                    {/* Liste des relations */}
                    <div className="border-t" style={{ borderColor: 'var(--color-bordure)', padding: 'var(--space-md) 0' }}>
                        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text)' }}>
                            {t('organigramme.relations.liste', 'Relations')} ({data.relations.length})
                        </span>
                        <ul className="flex flex-col" style={{ gap: 'var(--gap-sm)', marginTop: 'var(--space-xs)' }}>
                            {data.relations.map(r => (
                                <li
                                    key={r.id}
                                    className="rounded-lg border flex items-start justify-between"
                                    style={{ borderColor: 'var(--color-bordure)', padding: 'var(--space-xs) var(--space-sm)', gap: 'var(--gap-xs)' }}
                                >
                                    <div className="flex flex-col min-w-0 flex-1" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                                        <ExtremiteLabel relation={r} cote="superieur" />
                                        <div className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)', paddingLeft: 'var(--space-xs)' }}>
                                            <ArrowRight style={{ width: 'var(--icon-xxs, 0.75rem)', height: 'var(--icon-xxs, 0.75rem)', color: couleur }} />
                                            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{t('organigramme.relations.supervise', 'supervise')}</span>
                                        </div>
                                        <ExtremiteLabel relation={r} cote="subordonne" />
                                    </div>
                                    {canDelete && (
                                        <button
                                            onClick={() => setRelationASupprimer(r)}
                                            className="flex items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors flex-shrink-0"
                                            style={{ width: 'var(--icon-xl)', height: 'var(--icon-xl)' }}
                                            aria-label={t('supprimerRelation', 'Supprimer la relation')}
                                        >
                                            <Trash2 className="text-destructive" style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    {canViewHierarchie && (
                        <div className="border-t" style={{ borderColor: 'var(--color-bordure)', padding: 'var(--space-md) 0' }}>
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<ExternalLink className="w-3.5 h-3.5" />}
                                onClick={() => navigate({ to: '/organisation/hierarchie' })}
                                className="w-full"
                            >
                                {t('organigramme.relations.voirPageHierarchie', 'Gérer les hiérarchies')}
                            </ElisaButton>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Confirmation suppression */}
            <ConfirmDialog
                open={!!relationASupprimer}
                onOpenChange={(v) => { if (!v) setRelationASupprimer(null); }}
                onConfirm={handleConfirmDelete}
                title={t('supprimerRelation', 'Supprimer la relation')}
                description={t('confirmerSuppressionRelation', 'Êtes-vous sûr de vouloir supprimer cette relation hiérarchique ?')}
                variant="danger"
                isLoading={isDeleting}
            />
        </AnimatePresence>
    );
}
