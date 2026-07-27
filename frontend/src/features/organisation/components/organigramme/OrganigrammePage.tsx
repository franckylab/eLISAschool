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
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, ArrowDown, ArrowRight, List, BarChart3, Building2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOrganigramme, useModifierUnite, useStatistiquesOrganisation } from '../../hooks/use-organisation';
import { useReordonnerUnite } from '../../hooks/use-unites';
import { useMediaQuery } from '@/hooks/use-media-query';
import { usePermissions, useDocumentTitle } from '@/hooks';
import { useAuthStore } from '@/stores/auth.store';
import { PageHeader } from '@/components/layout/PageHeader';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { OrganigrammeFlowView } from './OrganigrammeFlowView';
import { OrganigrammeListe } from './OrganigrammeListe';
import { OrganigrammeSynthese } from './synthese/OrganigrammeSynthese';
import { OrganigrammeToolbar, dispatchToolbarCommand } from './toolbar/OrganigrammeToolbar';
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
    const navigate = useNavigate();
    useDocumentTitle(t('organigramme.titre', 'Organigramme'));

    const isMobile = useMediaQuery('(max-width: 479px)');
    const { data: organigramme, isLoading, isError, refetch: refetchOrganigramme } = useOrganigramme();
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

    // Overlay relations hiérarchiques
    const [showRelations, setShowRelations] = useState(false);

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
            toast.error(err instanceof Error ? err.message : t('organigramme.dnd.erreurDeplacement', 'Erreur lors du déplacement'));
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

    // Handler export (délègue au toolbar qui gère l'ExportDialog)
    const handleExport = useCallback(() => {
        dispatchToolbarCommand('export');
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
        { id: 'liste' as const, label: t('organigramme.vueListe', 'Liste'), icon: List },
    ];

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-12" style={{ padding: 'var(--space-xl)' }}>
                <p className="text-destructive mb-4" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>{t('erreurChargement', 'Erreur lors du chargement de l\'organigramme')}</p>
                <ElisaButton variant="outline" onClick={() => refetchOrganigramme()}>
                    {t('reessayer', 'Réessayer')}
                </ElisaButton>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col" style={{ gap: 'var(--gap-md)', padding: 'var(--space-lg)' }}>
                {/* Skeleton header */}
                <div className="flex items-center" style={{ gap: 'var(--gap-md)' }}>
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-dominant-50)] animate-pulse" />
                    <div className="flex-1 flex flex-col" style={{ gap: 'var(--gap-xs)' }}>
                        <div className="h-5 w-48 rounded bg-[var(--color-bordure)] animate-pulse" />
                        <div className="h-3 w-32 rounded bg-[var(--color-bordure)] animate-pulse" />
                    </div>
                </div>
                {/* Skeleton cartes */}
                <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--gap-md)' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="rounded-xl border flex flex-col" style={{ borderColor: 'var(--color-bordure)', padding: 'var(--space-md)', gap: 'var(--gap-sm)' }}>
                            <div className="flex items-center" style={{ gap: 'var(--gap-sm)' }}>
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

    // ─── État vide : aucune unité ───
    if (data.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col h-full"
                style={{ gap: 'var(--gap-md)', padding: 'var(--space-lg)' }}
            >
                <PageHeader
                    title={nomEtablissement || t('organigramme.titre', 'Organigramme')}
                    subtitle={t('organigramme.subtitle', 'Vue interactive de la structure organisationnelle')}
                    icon={Network}
                    variant="gradient"
                />

                <div className="flex-1 flex items-center justify-center">
                    <div
                        className="flex flex-col items-center text-center max-w-md"
                        style={{ gap: 'var(--gap-lg)' }}
                    >
                        <div
                            className="rounded-2xl flex items-center justify-center"
                            style={{
                                width: 'clamp(64px, 15vw, 96px)',
                                height: 'clamp(64px, 15vw, 96px)',
                                backgroundColor: 'var(--color-dominant-50)',
                            }}
                        >
                            <Building2
                                className="text-[var(--color-dominant-400)]"
                                style={{ width: 'clamp(32px, 8vw, 48px)', height: 'clamp(32px, 8vw, 48px)' }}
                            />
                        </div>

                        <div>
                            <h2
                                className="font-semibold text-[var(--color-text)]"
                                style={{ fontSize: 'clamp(1.125rem, 1rem + 0.5vw, 1.375rem)' }}
                            >
                                {t('organigramme.empty.titre', 'Aucune unité organisationnelle')}
                            </h2>
                            <p
                                className="text-[var(--color-text-secondary)]"
                                style={{ marginTop: 'var(--space-xs)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.25vw, 0.9375rem)' }}
                            >
                                {t('organigramme.empty.description', 'Commencez par créer votre première unité ou générez une organisation complète depuis un modèle.')}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center" style={{ gap: 'var(--gap-md)' }}>
                            {canEdit && (
                                <ElisaButton
                                    variant="primary"
                                    icon={<Building2 className="h-4 w-4" />}
                                    onClick={() => setUniteFormModal({ open: true, mode: 'create', unite: null, parentUnite: null })}
                                >
                                    {t('organigramme.empty.creerUnite', 'Créer une unité')}
                                </ElisaButton>
                            )}
                            <ElisaButton
                                variant="outline"
                                icon={<Sparkles className="h-4 w-4" />}
                                onClick={() => navigate({ to: '/organisation/modeles' })}
                            >
                                {t('organigramme.empty.genererDepuisModele', 'Générer depuis un modèle')}
                            </ElisaButton>
                        </div>

                        <p
                            className="text-[var(--color-text-muted)] italic"
                            style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)' }}
                        >
                            {t('organigramme.empty.astuce', 'Vous pouvez aussi utiliser un modèle prédéfini pour générer automatiquement toute la structure.')}
                        </p>
                    </div>
                </div>

                {/* Modal formulaire unité (nécessaire même en état vide) */}
                <UniteFormModal
                    open={uniteFormModal.open}
                    onOpenChange={(v) => setUniteFormModal(prev => ({ ...prev, open: v }))}
                    mode={uniteFormModal.mode}
                    unite={uniteFormModal.unite}
                    parentUnite={uniteFormModal.parentUnite}
                    onSuccess={() => {
                        setUniteFormModal({ open: false, mode: 'create', unite: null, parentUnite: null });
                        refetchOrganigramme();
                    }}
                />
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col h-full"
            style={{ gap: 'var(--gap-md)', padding: 'var(--space-lg)' }}
        >
            {/* Header avec onglets intégrés */}
            <div
                className="relative overflow-hidden rounded-2xl"
                style={{
                    background: 'linear-gradient(135deg, var(--color-dominant-600), var(--color-dominant-800))',
                    padding: 'clamp(1rem, 0.8rem + 1vw, 1.5rem) clamp(1.25rem, 1rem + 1.2vw, 2rem)',
                }}
            >
                {/* Watermark décoratif */}
                <div className="absolute -right-6 -top-6 pointer-events-none select-none" aria-hidden>
                    <Network className="text-white/[0.07]" style={{ width: 'clamp(8rem, 15vw, 14rem)', height: 'clamp(8rem, 15vw, 14rem)' }} />
                </div>

                {/* Breadcrumbs */}
                <Breadcrumbs currentLabel={nomEtablissement || t('organigramme.titre', 'Organigramme')} inverted />

                {/* Contenu : titre + onglets */}
                <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    {/* Titre */}
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl flex items-center justify-center shrink-0" style={{ width: 'clamp(2.5rem, 5vw, 3.25rem)', height: 'clamp(2.5rem, 5vw, 3.25rem)', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                            <Network className="text-white" style={{ width: 'clamp(1.25rem, 2.5vw, 1.625rem)', height: 'clamp(1.25rem, 2.5vw, 1.625rem)' }} />
                        </div>
                        <div>
                            <h1 className="text-white font-bold" style={{ fontSize: 'clamp(1.25rem, 1rem + 1vw, 1.875rem)', lineHeight: 1.2 }}>
                                {nomEtablissement || t('organigramme.titre', 'Organigramme')}
                            </h1>
                            <p className="text-white/70" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', marginTop: '0.125rem' }}>
                                {t('organigramme.subtitle', 'Vue interactive de la structure organisationnelle')}
                            </p>
                        </div>
                    </div>

                    {/* Onglets — glass pill desktop, select mobile */}
                    {!isMobile ? (
                        <div
                            role="tablist"
                            aria-label={t('organigramme.vueLabel', 'Mode d\'affichage')}
                            className="flex items-center gap-0.5 rounded-xl"
                            style={{ padding: '0.25rem', backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}
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
                                        className="flex items-center rounded-lg text-xs font-medium transition-all"
                                        style={{
                                            gap: 'var(--gap-xxs, 0.25rem)',
                                            padding: 'clamp(0.3rem, 0.25rem + 0.15vw, 0.4375rem) clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)',
                                            backgroundColor: isActive ? 'rgba(255,255,255,0.28)' : 'transparent',
                                            color: 'white',
                                            opacity: isActive ? 1 : 0.7,
                                        }}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {v.label}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <select
                            value={vueActive}
                            onChange={(e) => changerVue(e.target.value as VueMode)}
                            className="rounded-lg border text-sm font-medium"
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                borderColor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                padding: '0.375rem 0.75rem',
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            {vues.map(v => (
                                <option key={v.id} value={v.id} style={{ color: '#1a1a1a', backgroundColor: '#fff' }}>
                                    {v.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
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
                    showRelations={showRelations}
                    onToggleRelations={() => setShowRelations(prev => !prev)}
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
                        {(vueActive === 'vertical' || vueActive === 'horizontal') && (
                            <OrganigrammeFlowView
                                data={data}
                                direction={vueActive === 'horizontal' ? 'LR' : 'TB'}
                                containerId={containerId}
                                onNodeSelect={handleNodeSelect}
                                isEditMode={isEditMode}
                                showRelations={showRelations}
                                onToggleRelations={() => setShowRelations(prev => !prev)}
                                onExport={handleExport}
                                onEditUnite={canEdit ? handleEditUnite : undefined}
                                onAddChildUnite={canEdit ? handleAddChildUnite : undefined}
                                onDeleteUnite={canDelete ? handleDeleteUnite : undefined}
                            />
                        )}
                        {vueActive === 'liste' && <OrganigrammeListe data={data} onNodeSelect={handleNodeSelect} />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Drawer */}
            <UniteDetailDrawer
                unite={selectedUnite}
                open={drawerOpen}
                onClose={handleCloseDrawer}
                onEdit={canEdit ? handleEditUnite : undefined}
                onAddChild={canEdit ? handleAddChildUnite : undefined}
                onDelete={canDelete ? handleDeleteUnite : undefined}
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
