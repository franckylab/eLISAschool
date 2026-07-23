/**
 * ==================================
 * eLISAschool - Page Organigramme
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Page principale : SegmentedControl (Synthèse | Vertical | Horizontal | Liste),
 * état persisté en localStorage, responsive (auto-bascule liste si < 480px).
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, ArrowDown, ArrowRight, List, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOrganigramme, useModifierUnite, useStatistiquesOrganisation } from '../../hooks/use-organisation';
import { useReordonnerUnite } from '../../hooks/use-unites';
import { useMediaQuery } from '@/hooks/use-media-query';
import { usePermissions, useDocumentTitle } from '@/hooks';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { OrganigrammeFlowView } from './OrganigrammeFlowView';
import { OrganigrammeListe } from './OrganigrammeListe';
import { OrganigrammeSynthese } from './synthese/OrganigrammeSynthese';
import { OrganigrammeToolbar } from './toolbar/OrganigrammeToolbar';
import { UniteDetailDrawer } from './drawer/UniteDetailDrawer';
import { UniteFormModal } from './modals/UniteFormModal';
import { ImpactSuppressionDialog } from './modals/ImpactSuppressionDialog';
import type { OrganigrammeNode } from '../../types/organisation.types';

type VueMode = 'synthese' | 'vertical' | 'horizontal' | 'liste';

const VUE_STORAGE_KEY = 'organigramme_vue_active';

function getStoredVue(): VueMode {
    try { return localStorage.getItem(VUE_STORAGE_KEY) as VueMode || 'synthese'; } catch { return 'synthese'; }
}

export function OrganigrammePage() {
    const { t } = useTranslation('organisation');
    useDocumentTitle(t('organigramme.titre', 'Organigramme'));

    const isMobile = useMediaQuery('(max-width: 479px)');
    const { data: organigramme, isLoading } = useOrganigramme();
    const { data: statsApi } = useStatistiquesOrganisation();
    const etablissements = useAuthStore(s => s.etablissementsDisponibles);
    const etablissementId = useAuthStore(s => s.etablissementId);
    const nomEtablissement = etablissements?.find(e => e.id === etablissementId)?.nom || '';
    const { hasPermission } = usePermissions();

    const canEdit = hasPermission('organisation:unites:write');
    const canDelete = hasPermission('organisation:unites:delete');

    const [vueActive, setVueActive] = useState<VueMode>(isMobile ? 'liste' : getStoredVue());
    const [selectedUnite, setSelectedUnite] = useState<OrganigrammeNode | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [confirmMove, setConfirmMove] = useState<{ nodeId: string; targetId: string; nbEnfants: number } | null>(null);
    const { mutateAsync: modifierUnite } = useModifierUnite();
    const { mutateAsync: reordonnerUnite } = useReordonnerUnite();

    // Mode édition
    const [isEditMode, setIsEditMode] = useState(false);

    // Modals état
    const [uniteFormModal, setUniteFormModal] = useState<{
        open: boolean;
        mode: 'create' | 'edit';
        unite?: OrganigrammeNode | null;
        parentUnite?: OrganigrammeNode | null;
    }>({ open: false, mode: 'create', unite: null, parentUnite: null });

    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        unite: OrganigrammeNode | null;
    }>({ open: false, unite: null });

    useEffect(() => {
        if (isMobile && vueActive !== 'liste') setVueActive('liste');
    }, [isMobile]);

    // Écouter l'événement custom de confirmation de déplacement DnD
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail) setConfirmMove(detail);
        };
        window.addEventListener('organigramme-confirm-move', handler);
        return () => window.removeEventListener('organigramme-confirm-move', handler);
    }, []);

    // Écouter l'événement custom de réordonnancement DnD
    useEffect(() => {
        const handler = async (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail) {
                try {
                    await reordonnerUnite({ uniteId: detail.nodeId, apresId: detail.apresId });
                } catch (err) {
                    console.error('Erreur réordonnancement:', err);
                }
            }
        };
        window.addEventListener('organigramme-reorder', handler);
        return () => window.removeEventListener('organigramme-reorder', handler);
    }, [reordonnerUnite]);

    const handleConfirmMove = useCallback(async () => {
        if (!confirmMove) return;
        try {
            const parentId = confirmMove.targetId === '__root__' ? null : confirmMove.targetId;
            await modifierUnite({ id: confirmMove.nodeId, parentId });
        } catch (err) {
            console.error('Erreur déplacement:', err);
        }
        setConfirmMove(null);
    }, [confirmMove, modifierUnite]);

    const changerVue = useCallback((mode: VueMode) => {
        setVueActive(mode);
        try { localStorage.setItem(VUE_STORAGE_KEY, mode); } catch {}
    }, []);

    const handleNodeSelect = useCallback((unite: OrganigrammeNode) => {
        setSelectedUnite(unite);
        setDrawerOpen(true);
    }, []);

    const handleCloseDrawer = useCallback(() => {
        setDrawerOpen(false);
        setTimeout(() => setSelectedUnite(null), 200);
    }, []);

    // Handlers mode édition
    const handleToggleEditMode = useCallback(() => {
        setIsEditMode(prev => !prev);
    }, []);

    const handleEditUnite = useCallback((unite: OrganigrammeNode) => {
        setUniteFormModal({ open: true, mode: 'edit', unite, parentUnite: null });
    }, []);

    const handleAddChildUnite = useCallback((parentUnite: OrganigrammeNode) => {
        setUniteFormModal({ open: true, mode: 'create', unite: null, parentUnite });
    }, []);

    const handleDeleteUnite = useCallback((unite: OrganigrammeNode) => {
        setDeleteDialog({ open: true, unite });
    }, []);

    const handleUniteFormSuccess = useCallback(() => {
        setUniteFormModal({ open: false, mode: 'create', unite: null, parentUnite: null });
    }, []);

    const handleDeleteSuccess = useCallback(() => {
        setDeleteDialog({ open: false, unite: null });
        setDrawerOpen(false);
        setTimeout(() => setSelectedUnite(null), 200);
    }, []);

    const containerId = vueActive === 'horizontal' ? 'organigramme-flow-container-h' : 'organigramme-flow-container';
    const direction = vueActive === 'horizontal' ? 'LR' : 'TB';

    const vues = [
        { id: 'synthese' as const, label: t('organigramme.synthese', 'Synthèse'), icon: BarChart3 },
        { id: 'vertical' as const, label: t('organigramme.vertical', 'Vertical'), icon: ArrowDown },
        { id: 'horizontal' as const, label: t('organigramme.horizontal', 'Horizontal'), icon: ArrowRight },
        { id: 'liste' as const, label: t('organigramme.liste', 'Liste'), icon: List },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col" style={{ gap: 'var(--gap-md)', padding: 'var(--space-lg)' }}>
                {/* Skeleton header */}
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-dominant-50)] animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-5 w-48 rounded bg-[var(--color-bordure)] animate-pulse" />
                        <div className="h-3 w-32 rounded bg-[var(--color-bordure)] animate-pulse" />
                    </div>
                </div>
                {/* Skeleton cartes */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--color-bordure)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--color-bordure)] animate-pulse" />
                                <div className="h-3 w-24 rounded bg-[var(--color-bordure)] animate-pulse" />
                            </div>
                            <div className="h-8 w-16 rounded bg-[var(--color-bordure)] animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const data = organigramme || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col h-full"
            style={{ gap: 'var(--gap-md)', padding: 'var(--space-lg)' }}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <PageHeader
                    title={nomEtablissement || t('organigramme.titre', 'Organigramme')}
                    subtitle={t('organigramme.subtitle', 'Vue interactive de la structure organisationnelle')}
                    icon={Network}
                    variant="gradient"
                />

                {/* SegmentedControl */}
                {!isMobile && (
                    <div
                        role="tablist"
                        aria-label={t('organigramme.vueLabel', 'Mode d\'affichage')}
                        className="flex items-center gap-0.5 p-1 rounded-xl border"
                        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-bordure)' }}
                    >
                        {vues.map(v => {
                            const Icon = v.icon;
                            const isActive = vueActive === v.id;
                            return (
                                <button
                                    key={v.id}
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => changerVue(v.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                    style={{
                                        backgroundColor: isActive ? 'var(--color-dominant-600)' : 'transparent',
                                        color: isActive ? '#fff' : 'var(--color-text-muted)',
                                    }}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {v.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Toolbar (pas pour liste/synthèse) */}
            {(vueActive === 'vertical' || vueActive === 'horizontal') && (
                <OrganigrammeToolbar
                    direction={direction}
                    containerId={containerId}
                    nomEtablissement={nomEtablissement}
                    isEditMode={isEditMode}
                    onToggleEditMode={handleToggleEditMode}
                    canEdit={canEdit || canDelete}
                />
            )}

            {/* Contenu */}
            <div role="tabpanel" className={vueActive === 'synthese' ? 'flex-1' : 'flex-1 rounded-xl border overflow-hidden'} style={vueActive === 'synthese' ? { minHeight: 'calc(100vh - 320px)' } : { borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)', minHeight: 'calc(100vh - 320px)' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={vueActive}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="w-full h-full"
                    >
                        {vueActive === 'synthese' && <OrganigrammeSynthese data={data} statsApi={statsApi} />}
                        <OrganigrammeFlowView
                            data={data}
                            direction={vueActive === 'horizontal' ? 'LR' : 'TB'}
                            onNodeSelect={handleNodeSelect}
                            isEditMode={isEditMode}
                            onEditUnite={canEdit ? handleEditUnite : undefined}
                            onAddChildUnite={canEdit ? handleAddChildUnite : undefined}
                            onDeleteUnite={canDelete ? handleDeleteUnite : undefined}
                        />
                        {vueActive === 'liste' && <OrganigrammeListe data={data} onNodeSelect={handleNodeSelect} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Drawer */}
            <UniteDetailDrawer
                unite={selectedUnite}
                open={drawerOpen}
                onClose={handleCloseDrawer}
                onEdit={isEditMode && canEdit ? handleEditUnite : undefined}
                onAddChild={isEditMode && canEdit ? handleAddChildUnite : undefined}
                onDelete={isEditMode && canDelete ? handleDeleteUnite : undefined}
            />

            {/* Modal formulaire unité */}
            <UniteFormModal
                open={uniteFormModal.open}
                onOpenChange={(v) => setUniteFormModal(prev => ({ ...prev, open: v }))}
                mode={uniteFormModal.mode}
                unite={uniteFormModal.unite}
                parentUnite={uniteFormModal.parentUnite}
                onSuccess={handleUniteFormSuccess}
            />

            {/* Dialog suppression avec impact */}
            <ImpactSuppressionDialog
                open={deleteDialog.open}
                onOpenChange={(v) => setDeleteDialog(prev => ({ ...prev, open: v }))}
                unite={deleteDialog.unite}
                onDeleted={handleDeleteSuccess}
            />

            {/* ConfirmDialog DnD avec enfants */}
            <ConfirmDialog
                open={!!confirmMove}
                onOpenChange={(open) => !open && setConfirmMove(null)}
                onConfirm={handleConfirmMove}
                title={confirmMove?.targetId === '__root__'
                    ? t('organigramme.dnd.confirmRoot', 'Détacher l\'unité ?')
                    : t('organigramme.dnd.confirmTitle', 'Déplacer l\'unité ?')}
                description={confirmMove
                    ? confirmMove.targetId === '__root__'
                        ? t('organigramme.dnd.confirmRootDesc', 'Déplacer cette unité et ses {{count}} enfants vers la racine (sans parent) ?', { count: confirmMove.nbEnfants })
                        : t('organigramme.dnd.confirmDesc', 'Déplacer cette unité et ses {{count}} enfants vers la cible ?', { count: confirmMove.nbEnfants })
                    : undefined}
                confirmText={t('organigramme.dnd.confirmer', 'Déplacer')}
                cancelText={t('organigramme.dnd.annuler', 'Annuler')}
                variant="warning"
            />
        </motion.div>
    );
}
