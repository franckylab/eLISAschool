import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Plus, Calendar, Edit, Trash2, Lock, Unlock, Eye,
    ChevronRight, ChevronDown, Layers, Sparkles, Network, Settings,
    CalendarRange,
} from 'lucide-react';
import {
    usePeriodesArbre, useSupprimerPeriode,
    useReouvrirPeriode, useGenererTemplate,
    useTemplatesPeriode, useNiveauxPeriode,
} from '../hooks/use-periodes';
import { useAnneeScolaireActive } from '@/features/annees-scolaires/hooks/use-annees-scolaires';
import { useToutesAnneesScolaires } from '@/features/annees-scolaires/hooks/use-toutes-annees-scolaires';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useNavigate } from '@tanstack/react-router';
import { usePermissions } from '@/hooks';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { TextLabel } from '@/components/ui';
import { ModalCloturePeriode } from './modal-cloture-periode';
import { ModalFormPeriode } from './modal-form-periode';
import { StatutPeriode, niveauPeutAvoirEnfants } from '../types/periode.types';
import type { PeriodeArbre, Periode } from '../types/periode.types';
import { ModalGestionCompositions } from './modal-gestion-compositions';
import { ModalGestionTemplates } from './modal-gestion-templates';
import { ModalGestionNiveaux } from './modal-gestion-niveaux';

const COULEURS_STATUT: Record<string, string> = {
    OUVERTE: 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] border-[var(--color-dominant-200)]',
    EN_ATTENTE_CLOTURE: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    CLOTUREE: 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] border-[var(--color-bordure)]',
};

const NIVEAU_CONFIG_BASE = [
    { barWidth: 4, color: 'var(--color-dominant-600)', bgClass: '' },
    { barWidth: 5, color: 'var(--color-dominant-400)', bgClass: 'bg-[var(--color-dominant-50)] dark:bg-[var(--color-dominant-950)]/35' },
    { barWidth: 6, color: 'var(--color-dominant-300)', bgClass: 'bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/45' },
] as const;

function getNiveauConfig(profondeur: number) {
    if (profondeur < NIVEAU_CONFIG_BASE.length) {
        return NIVEAU_CONFIG_BASE[profondeur];
    }
    return {
        barWidth: 6,
        color: 'var(--color-dominant-200)',
        bgClass: 'bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/45',
    };
}

const INDENT_DESKTOP = 28;
const BAR_WIDTH = 3;
const BAR_SPACING = 8;
const BAR_ZONE_PAD = 8;
const MAX_PROFONDEUR = 5;
const BAR_ZONE_FIXED = BAR_ZONE_PAD + (MAX_PROFONDEUR + 1) * (BAR_WIDTH + BAR_SPACING);

interface LigneArbre {
    node: PeriodeArbre;
    profondeur: number;
    estParent: boolean;
    aEnfants: boolean;
    parentNom?: string;
}

function aplatirArbre(
    arbres: PeriodeArbre[],
    expanded: Set<string>,
    profondeur = 0,
    parentNom?: string,
): LigneArbre[] {
    const lignes: LigneArbre[] = [];
    for (const node of arbres) {
        const aEnfants = node.enfants.length > 0;
        lignes.push({
            node,
            profondeur,
            estParent: aEnfants,
            aEnfants,
            parentNom,
        });
        if (aEnfants && expanded.has(node.id)) {
            lignes.push(...aplatirArbre(node.enfants, expanded, profondeur + 1, node.nom));
        }
    }
    return lignes;
}

export function PeriodesPage() {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { t } = useTranslation('periodes');

    const { data: annees } = useToutesAnneesScolaires();
    const { data: anneeActive } = useAnneeScolaireActive();
    const [anneeId, setAnneeId] = useState<string>(anneeActive?.id || '');

    const { data: arbres, isLoading, isError, error, refetch } = usePeriodesArbre({ anneeId });
    const supprimer = useSupprimerPeriode();
    const reouvrir = useReouvrirPeriode();
    const genererTemplate = useGenererTemplate();
    const { data: templates = [] } = useTemplatesPeriode();
    const { data: niveaux = [] } = useNiveauxPeriode();

    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [confirmAction, setConfirmAction] = useState<{ type: 'supprimer' | 'reouvrir'; periode: PeriodeArbre } | null>(null);

    const [modalFormOpen, setModalFormOpen] = useState(false);
    const [periodeToEdit, setPeriodeToEdit] = useState<PeriodeArbre | null>(null);
    const [modalClotureOpen, setModalClotureOpen] = useState(false);
    const [periodeToCloture, setPeriodeToCloture] = useState<PeriodeArbre | null>(null);
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);
    const [modalCompositionsOpen, setModalCompositionsOpen] = useState(false);
    const [periodeToCompose, setPeriodeToCompose] = useState<Periode | null>(null);
    const [modalTemplatesOpen, setModalTemplatesOpen] = useState(false);
    const [modalNiveauxOpen, setModalNiveauxOpen] = useState(false);

    const toggleExpand = useCallback((id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        if (!arbres) return;
        const allIds = new Set<string>();
        const collect = (nodes: PeriodeArbre[]) => {
            for (const n of nodes) {
                if (n.enfants.length > 0) {
                    allIds.add(n.id);
                    collect(n.enfants);
                }
            }
        };
        collect(arbres);
        setExpanded(allIds);
    }, [arbres]);

    const collapseAll = useCallback(() => setExpanded(new Set()), []);

    const openCreer = () => {
        setPeriodeToEdit(null);
        setModalFormOpen(true);
    };
    const openModifier = (p: PeriodeArbre) => {
        setPeriodeToEdit(p);
        setModalFormOpen(true);
    };
    const openCloturer = (p: PeriodeArbre) => {
        setPeriodeToCloture(p);
        setModalClotureOpen(true);
    };
    const voirDetail = (p: PeriodeArbre) => {
        navigate({ to: '/periodes/$id', params: { id: p.id } });
    };
    const openGestionCompositions = (p: PeriodeArbre) => {
        setPeriodeToCompose(arbreToPeriode(p));
        setModalCompositionsOpen(true);
    };

    const handleGenererTemplate = async (templateId: string) => {
        if (!anneeId) return;
        const now = new Date();
        const dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const dateFin = new Date(now.getFullYear() + 1, now.getMonth(), 0).toISOString();
        await genererTemplate.mutateAsync({ templateId, anneeScolaireId: anneeId, dateDebut, dateFin });
        setShowTemplateMenu(false);
    };

    const lignes = useMemo(() => {
        if (!arbres?.length) return [];
        return aplatirArbre(arbres, expanded);
    }, [arbres, expanded]);

    const stats = useMemo(() => {
        if (!arbres?.length) return { total: 0, ouvertes: 0, enAttente: 0, cloturees: 0 };
        let total = 0, ouvertes = 0, enAttente = 0, cloturees = 0;
        const count = (nodes: PeriodeArbre[]) => {
            for (const n of nodes) {
                total++;
                if (n.statut === StatutPeriode.OUVERTE) ouvertes++;
                else if (n.statut === StatutPeriode.EN_ATTENTE_CLOTURE) enAttente++;
                else if (n.statut === StatutPeriode.CLOTUREE) cloturees++;
                count(n.enfants);
            }
        };
        count(arbres);
        return { total, ouvertes, enAttente, cloturees };
    }, [arbres]);

    const listeAnnees = annees || [];

    const arbreToPeriode = (a: PeriodeArbre): Periode => ({
        id: a.id,
        nom: a.nom,
        niveauId: a.niveauId,
        niveau: a.niveau,
        anneeScolaireId: a.anneeScolaireId,
        etablissementId: a.etablissementId,
        dateDebut: a.dateDebut,
        dateFin: a.dateFin,
        statut: a.statut,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
    });

    const peutAvoirEnfantsFn = (niveauId: string): boolean => {
        return niveauPeutAvoirEnfants(niveaux, niveauId);
    };

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>
            <PageHeader
                variant="gradient"
                tone="dominant"
                icon={CalendarRange}
                title={t('titre')}
                subtitle={t('stats', { total: stats.total, ouvertes: stats.ouvertes, cloturees: stats.cloturees })}
                showBreadcrumbs={false}
                actions={
                    <>
                        {(hasPermission('periodes:templates:view') || hasPermission('niveaux_periode:view')) && (
                            <ElisaButton
                                variant="ghost"
                                size="sm"
                                icon={<Settings className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                onClick={() => setModalTemplatesOpen(true)}
                            >
                                {t('templates')}
                            </ElisaButton>
                        )}
                        {hasPermission('niveaux_periode:view') && (
                            <ElisaButton
                                variant="ghost"
                                size="sm"
                                icon={<Layers className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                onClick={() => setModalNiveauxOpen(true)}
                            >
                                {t('niveaux')}
                            </ElisaButton>
                        )}
                        {hasPermission('periodes:templates:generer') && anneeId && (
                            <div className="relative">
                                <ElisaButton
                                    variant="outline"
                                    size="sm"
                                    icon={<Sparkles className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                    onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                                >
                                    {t('actions.generer')}
                                </ElisaButton>
                                <AnimatePresence>
                                    {showTemplateMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="absolute right-0 top-full mt-1 z-50 rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-lg min-w-[200px]"
                                        >
                                            {templates.length === 0 && (
                                                <div className="px-3 py-2 text-sm text-[var(--color-text-tertiary)]">
                                                    Aucun template disponible
                                                </div>
                                            )}
                                            {templates.map((tpl) => (
                                                <button
                                                    key={tpl.id}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-surface-alt)] text-[var(--color-text-primary)] transition-colors first:rounded-t-[var(--radius-md)] last:rounded-b-[var(--radius-md)]"
                                                    onClick={() => handleGenererTemplate(tpl.id)}
                                                    disabled={genererTemplate.isPending}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        {tpl.estSysteme && <span className="text-xs opacity-50">★</span>}
                                                        {tpl.nom}
                                                    </span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        {hasPermission('periodes:create') && (
                            <ElisaButton variant="primary" size="sm" icon={<Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />} onClick={openCreer}>
                                {t('nouvellePeriode')}
                            </ElisaButton>
                        )}
                    </>
                }
            />

            {/* Sélecteur année */}
            <div className="flex items-center gap-[var(--gap-sm)]">
                <select
                    value={anneeId}
                    onChange={(e) => setAnneeId(e.target.value)}
                    className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    style={{
                        padding: 'var(--space-sm)',
                        fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)',
                    }}
                >
                    <option value="">{t('selectAnnee')}</option>
                    {listeAnnees.map((a) => (
                        <option key={a.id} value={a.id}>{a.libelle}</option>
                    ))}
                </select>
            </div>

            {isError ? (
                <ErrorMessage
                    message={error?.message}
                    onRetry={() => refetch()}
                />
            ) : !anneeId ? (
                <div className="flex flex-col items-center justify-center py-16 gap-[var(--gap-md)]">
                    <Calendar className="h-[var(--icon-xl)] w-[var(--icon-xl)] text-[var(--color-text-tertiary)]" />
                    <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                        {t('selectionnezAnnee')}
                    </p>
                </div>
            ) : isLoading ? (
                <PageSkeleton />
            ) : !lignes.length ? (
                <div className="flex flex-col items-center justify-center py-16 gap-[var(--gap-md)]">
                    <Layers className="h-[var(--icon-xl)] w-[var(--icon-xl)] text-[var(--color-text-tertiary)]" />
                    <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                        {t('aucunePeriodeAnnee')}
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-[var(--gap-sm)]">
                        <button
                            onClick={expandAll}
                            className="text-xs text-[var(--color-dominant-600)] hover:underline font-medium"
                        >
                            {t('toutDeplier')}
                        </button>
                        <span className="text-[var(--color-text-tertiary)]">·</span>
                        <button
                            onClick={collapseAll}
                            className="text-xs text-[var(--color-dominant-600)] hover:underline font-medium"
                        >
                            {t('toutReplier')}
                        </button>
                    </div>

                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] overflow-hidden">
                        <div className="hidden sm:flex items-center border-b border-[var(--color-bordure)] bg-[var(--color-surface-alt)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-[var(--space-sm)]">
                            <div className="shrink-0" style={{ width: `${BAR_ZONE_FIXED}px` }} aria-hidden="true" />
                            <div className="flex-1 min-w-0 grid grid-cols-[1fr_100px_120px_100px_140px] gap-[var(--gap-sm)] items-center" style={{ paddingLeft: 'var(--space-sm)' }}>
                                <span>{t('colonne.nom')}</span>
                                <span>{t('colonne.type')}</span>
                                <span>{t('colonne.periode')}</span>
                                <span>{t('colonne.statut')}</span>
                                <span className="text-right">{t('colonne.actions')}</span>
                            </div>
                        </div>

                        <div className="divide-y divide-[var(--color-bordure)]">
                            {lignes.map((ligne) => {
                                const { node, profondeur, aEnfants } = ligne;
                                const isExpanded = expanded.has(node.id);
                                const niveau = getNiveauConfig(profondeur);

                                return (
                                    <div
                                        key={node.id}
                                        className={`flex items-center py-[var(--space-sm)] hover:bg-[var(--color-surface-alt)]/50 transition-colors ${profondeur > 0 ? niveau.bgClass : ''}`}
                                    >
                                        <div
                                            className="relative shrink-0 self-stretch hidden sm:block"
                                            style={{ width: `${BAR_ZONE_FIXED}px` }}
                                            aria-hidden="true"
                                        >
                                            {Array.from({ length: profondeur + 1 }, (_, i) => {
                                                const cfg = getNiveauConfig(i);
                                                const estNiveauCourant = i === profondeur;
                                                return (
                                                    <div
                                                        key={i}
                                                        className="absolute top-1 bottom-1 rounded-full"
                                                        style={{
                                                            left: `${BAR_ZONE_PAD + i * (BAR_WIDTH + BAR_SPACING)}px`,
                                                            width: `${cfg.barWidth}px`,
                                                            backgroundColor: cfg.color,
                                                            opacity: estNiveauCourant ? 1 : 0.25,
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>

                                        <div
                                            className="flex-1 min-w-0 grid grid-cols-[1fr_100px_120px_100px_140px] gap-[var(--gap-sm)] items-center"
                                            style={{ paddingLeft: `calc(var(--space-sm) + ${profondeur * INDENT_DESKTOP}px)` }}
                                        >
                                            <div className="hidden sm:contents">
                                                <div className="flex items-center gap-[var(--gap-xs)] min-w-0">
                                                    {aEnfants ? (
                                                        <button onClick={() => toggleExpand(node.id)} className="shrink-0 p-0.5 rounded hover:bg-[var(--color-surface-alt)] transition-colors" aria-label={isExpanded ? 'Replier' : 'Déplier'}>
                                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-[var(--color-dominant-600)]" /> : <ChevronRight className="h-4 w-4 text-[var(--color-dominant-600)]" />}
                                                        </button>
                                                    ) : profondeur > 0 ? (
                                                        <span className="w-5 shrink-0 flex items-center justify-center">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-dominant-400)]" />
                                                        </span>
                                                    ) : null}
                                                    <Calendar className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-muted)] shrink-0" />
                                                    <TextLabel size="sm" weight={profondeur === 0 ? 'bold' : 'semibold'}>{node.nom}</TextLabel>
                                                </div>
                                                <span className="rounded-full border px-2 py-0.5 text-xs font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-bordure)] text-center">{node.niveau?.label || node.niveauId?.substring(0, 8) || '—'}</span>
                                                <div style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.8125rem)' }}>
                                                    <p className="text-[var(--color-text-primary)]">{new Date(node.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">→ {new Date(node.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium text-center ${COULEURS_STATUT[node.statut]}`}>{t(`statut.${node.statut}`)}</span>
                                            </div>

                                            <div className="sm:hidden w-full col-span-full">
                                                <div className="flex items-center justify-between mb-[var(--space-xs)]">
                                                    <div className="flex items-center gap-[var(--gap-xs)] min-w-0 flex-1">
                                                        {aEnfants ? (
                                                            <button onClick={() => toggleExpand(node.id)} className="shrink-0 p-1 rounded hover:bg-[var(--color-surface-alt)] transition-colors" aria-label={isExpanded ? 'Replier' : 'Déplier'}>
                                                                {isExpanded ? <ChevronDown className="h-5 w-5 text-[var(--color-dominant-600)]" /> : <ChevronRight className="h-5 w-5 text-[var(--color-dominant-600)]" />}
                                                            </button>
                                                        ) : profondeur > 0 ? (
                                                            <span className="shrink-0 flex items-center justify-center w-5">
                                                                <span className="w-2 h-2 rounded-full bg-[var(--color-dominant-400)]" />
                                                            </span>
                                                        ) : null}
                                                        <Calendar className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-muted)] shrink-0" />
                                                        <TextLabel size="md" weight={profondeur === 0 ? 'bold' : 'semibold'}>{node.nom}</TextLabel>
                                                    </div>
                                                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ml-2 ${COULEURS_STATUT[node.statut]}`}>{t(`statut.${node.statut}`)}</span>
                                                </div>
                                                <div className="flex items-center gap-[var(--gap-sm)] flex-wrap mb-[var(--space-xs)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                                    <span className="rounded-full border px-2 py-0.5 text-xs font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-bordure)]">{node.niveau?.label || node.niveauId?.substring(0, 8) || '—'}</span>
                                                    <span className="text-[var(--color-text-secondary)]">
                                                        {new Date(node.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        {' → '}
                                                        {new Date(node.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-[var(--gap-xxs)] col-span-full sm:col-span-1 justify-start sm:justify-end flex-wrap">
                                            <button
                                                onClick={() => voirDetail(node)}
                                                className="p-2 sm:p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                                title={t('actions.voir')}
                                            >
                                                <Eye className="h-5 w-5 sm:h-4 sm:w-4" />
                                            </button>
                                            {node.statut === StatutPeriode.OUVERTE && hasPermission('periodes:compositions:edit') && peutAvoirEnfantsFn(node.niveauId) && (
                                                <button
                                                    onClick={() => openGestionCompositions(node)}
                                                    className="p-2 sm:p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)] transition-colors"
                                                    title={t('compositions.gerer')}
                                                >
                                                    <Network className="h-5 w-5 sm:h-4 sm:w-4" />
                                                </button>
                                            )}
                                            {node.statut === StatutPeriode.OUVERTE && hasPermission('periodes:edit') && (
                                                <button
                                                    onClick={() => openModifier(node)}
                                                    className="p-2 sm:p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)] transition-colors"
                                                    title={t('actions.modifier')}
                                                >
                                                    <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
                                                </button>
                                            )}
                                            {node.statut === StatutPeriode.OUVERTE && hasPermission('periodes:cloturer') && (
                                                <button
                                                    onClick={() => openCloturer(node)}
                                                    className="p-2 sm:p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-amber-600 transition-colors"
                                                    title={t('actions.cloturer')}
                                                >
                                                    <Lock className="h-5 w-5 sm:h-4 sm:w-4" />
                                                </button>
                                            )}
                                            {node.statut === StatutPeriode.CLOTUREE && hasPermission('periodes:reouvrir') && (
                                                <button
                                                    onClick={() => setConfirmAction({ type: 'reouvrir', periode: node })}
                                                    className="p-2 sm:p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)] transition-colors"
                                                    title={t('actions.reouvrir')}
                                                >
                                                    <Unlock className="h-5 w-5 sm:h-4 sm:w-4" />
                                                </button>
                                            )}
                                            {node.statut === StatutPeriode.OUVERTE && hasPermission('periodes:delete') && !aEnfants && (
                                                <button
                                                    onClick={() => setConfirmAction({ type: 'supprimer', periode: node })}
                                                    className="p-2 sm:p-1 rounded hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-600 transition-colors"
                                                    title={t('actions.supprimer')}
                                                >
                                                    <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                                                </button>
                                            )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            <ModalGestionCompositions
                periode={periodeToCompose}
                isOpen={modalCompositionsOpen}
                onClose={() => { setModalCompositionsOpen(false); setPeriodeToCompose(null); }}
                onSuccess={() => { setModalCompositionsOpen(false); setPeriodeToCompose(null); }}
            />

            <ModalGestionTemplates
                isOpen={modalTemplatesOpen}
                onClose={() => setModalTemplatesOpen(false)}
            />

            <ModalGestionNiveaux
                isOpen={modalNiveauxOpen}
                onClose={() => setModalNiveauxOpen(false)}
            />

            <ModalFormPeriode
                periode={periodeToEdit ? {
                    ...arbreToPeriode(periodeToEdit),
                    compositionsEnfants: [],
                } : null}
                isOpen={modalFormOpen}
                onClose={() => { setModalFormOpen(false); setPeriodeToEdit(null); }}
                anneeScolaireId={anneeId}
                onSuccess={() => setModalFormOpen(false)}
            />

            <ModalCloturePeriode
                periode={periodeToCloture ? arbreToPeriode(periodeToCloture) : null}
                isOpen={modalClotureOpen}
                onClose={() => { setModalClotureOpen(false); setPeriodeToCloture(null); }}
                onClotureSuccess={() => { setModalClotureOpen(false); setPeriodeToCloture(null); }}
            />

            {confirmAction?.type === 'supprimer' && (
                <ConfirmDialog
                    open={true}
                    onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
                    onConfirm={async () => {
                        try {
                            await supprimer.mutateAsync(confirmAction.periode.id);
                            setConfirmAction(null);
                        } catch (e) {}
                    }}
                    title={t('confirmerSupprimerTitre')}
                    description={`${t('confirmerSupprimerMessage', { nom: confirmAction.periode.nom })}\n${t('confirmerSupprimerDetail')}`}
                    confirmText={t('actions.supprimer')}
                    variant="danger"
                    isLoading={supprimer.isPending}
                />
            )}

            {confirmAction?.type === 'reouvrir' && (
                <ConfirmDialog
                    open={true}
                    onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
                    onConfirm={async () => {
                        try {
                            await reouvrir.mutateAsync({ id: confirmAction.periode.id, motif: 'Réouverture manuelle' });
                            setConfirmAction(null);
                        } catch (e) {}
                    }}
                    title={t('confirmerReouvrirTitre')}
                    description={`${t('confirmerReouvrirMessage', { nom: confirmAction.periode.nom })}\n${t('confirmerReouvrirDetail')}`}
                    confirmText={t('actions.reouvrir')}
                    variant="warning"
                    isLoading={reouvrir.isPending}
                />
            )}
        </div>
    );
}
