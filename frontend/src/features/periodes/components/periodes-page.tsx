/**
 * ==================================
 * eLISAschool - Page Périodes (v3.0 — Vue arborescente)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Vue arborescente expansible des périodes :
 * - Parents en lignes expansibles
 * - Enfants en sous-lignes indentées
 * - Actions : créer, modifier, supprimer, composer, clôturer
 * - Génération depuis template
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Calendar, Edit, Trash2, Lock, Unlock, Eye,
    ChevronRight, ChevronDown, Layers, Sparkles, Network, Settings,
} from 'lucide-react';
import {
    usePeriodesArbre, useSupprimerPeriode,
    useReouvrirPeriode, useGenererTemplate,
    useTemplatesPeriode, useNiveauxPeriode,
} from '../hooks/use-periodes';
import { useAnneesScolaires, useAnneeScolaireActive } from '@/features/annees-scolaires/hooks/use-annees-scolaires';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ModalCloturePeriode } from './modal-cloture-periode';
import { ModalFormPeriode } from './modal-form-periode';
import { StatutPeriode, niveauPeutAvoirEnfants } from '../types/periode.types';
import type { PeriodeArbre, Periode } from '../types/periode.types';
import { ModalGestionCompositions } from './modal-gestion-compositions';
import { ModalGestionTemplates } from './modal-gestion-templates';
import { ModalGestionNiveaux } from './modal-gestion-niveaux';

const COULEURS_STATUT: Record<string, string> = {
    OUVERTE: 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] border-[var(--color-dominant-200)]',
    EN_ATTENTE_CLOTURE: 'bg-amber-50 text-amber-700 border-amber-200',
    CLOTUREE: 'bg-[var(--color-surface-alt)] text-[var(--color-text-tertiary)] border-[var(--color-bordure)]',
};

const LABELS_STATUT: Record<string, string> = {
    OUVERTE: 'Ouverte',
    EN_ATTENTE_CLOTURE: 'En attente',
    CLOTUREE: 'Clôturée',
};

/**
 * Configuration des couleurs et barres de l'arborescence (profondeur dynamique)
 */
const NIVEAU_CONFIG_BASE = [
    { barWidth: 4, color: 'var(--color-dominant-600)', bgColor: 'transparent' },
    { barWidth: 5, color: 'var(--color-dominant-400)', bgColor: 'var(--color-dominant-50)' },
    { barWidth: 6, color: 'var(--color-dominant-300)', bgColor: 'var(--color-dominant-50)' },
] as const;

function getNiveauConfig(profondeur: number) {
    if (profondeur < NIVEAU_CONFIG_BASE.length) {
        return NIVEAU_CONFIG_BASE[profondeur];
    }
    // Generer dynamiquement pour des profondeurs arbitraires
    return {
        barWidth: 6,
        color: 'var(--color-dominant-200)',
        bgColor: 'var(--color-dominant-50)'
    };
}

const INDENT_DESKTOP = 28;
const BAR_WIDTH = 3;       // Épaisseur de chaque barre
const BAR_SPACING = 8;     // Espacement entre barres
const BAR_ZONE_PAD = 8;    // Padding gauche dans la zone des barres
const MAX_PROFONDEUR = 5;  // Profondeur maximale supportée pour les barres de gauche
/** Largeur fixe de la zone des barres (aligne header et lignes) */
const BAR_ZONE_FIXED = BAR_ZONE_PAD + (MAX_PROFONDEUR + 1) * (BAR_WIDTH + BAR_SPACING);


/**
 * Ligne aplatie pour le rendu (parent ou enfant visible)
 */
interface LigneArbre {
    node: PeriodeArbre;
    profondeur: number;
    estParent: boolean;
    aEnfants: boolean;
    parentNom?: string;
}

/**
 * Aplatir l'arbre en liste de lignes selon l'état d'expansion
 */
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
    const { hasPermission } = usePermissions();

    // Sélection année scolaire
    const { data: annees } = useAnneesScolaires();
    const { data: anneeActive } = useAnneeScolaireActive();
    const [anneeId, setAnneeId] = useState<string>(anneeActive?.id || '');

    // Données (vue arbre)
    const { data: arbres, isLoading } = usePeriodesArbre({ anneeId });
    const supprimer = useSupprimerPeriode();
    const reouvrir = useReouvrirPeriode();
    const genererTemplate = useGenererTemplate();
    const { data: templates = [] } = useTemplatesPeriode();
    const { data: niveaux = [] } = useNiveauxPeriode();

    // États expansion
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    // États confirmation
    const [confirmAction, setConfirmAction] = useState<{ type: 'supprimer' | 'reouvrir'; periode: PeriodeArbre } | null>(null);

    // États modaux
    const [modalFormOpen, setModalFormOpen] = useState(false);
    const [periodeToEdit, setPeriodeToEdit] = useState<PeriodeArbre | null>(null);
    const [modalClotureOpen, setModalClotureOpen] = useState(false);
    const [periodeToCloture, setPeriodeToCloture] = useState<PeriodeArbre | null>(null);
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);
    const [modalCompositionsOpen, setModalCompositionsOpen] = useState(false);
    const [periodeToCompose, setPeriodeToCompose] = useState<Periode | null>(null);
    const [modalTemplatesOpen, setModalTemplatesOpen] = useState(false);
    const [modalNiveauxOpen, setModalNiveauxOpen] = useState(false);

    // Toggle expansion
    const toggleExpand = useCallback((id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // Expand all / collapse all
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

    // Handlers
    const openCreer = () => {
        setPeriodeToEdit(null);
        setModalFormOpen(true);
    };
    const openModifier = (p: PeriodeArbre) => {
        // Convertir PeriodeArbre en format compatible avec ModalFormPeriode
        setPeriodeToEdit(p);
        setModalFormOpen(true);
    };
    const openCloturer = (p: PeriodeArbre) => {
        setPeriodeToCloture(p);
        setModalClotureOpen(true);
    };
    const voirDetail = (p: PeriodeArbre) => {
        window.location.href = `/periodes/${p.id}`;
    };
    const openGestionCompositions = (p: PeriodeArbre) => {
        setPeriodeToCompose(arbreToPeriode(p));
        setModalCompositionsOpen(true);
    };

    // Générer depuis template (v4.0 — par ID)
    const handleGenererTemplate = async (templateId: string) => {
        if (!anneeId) return;
        const now = new Date();
        const dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const dateFin = new Date(now.getFullYear() + 1, now.getMonth(), 0).toISOString();
        await genererTemplate.mutateAsync({ templateId, anneeScolaireId: anneeId, dateDebut, dateFin });
        setShowTemplateMenu(false);
    };

    // Aplatir l'arbre
    const lignes = useMemo(() => {
        if (!arbres?.length) return [];
        return aplatirArbre(arbres, expanded);
    }, [arbres, expanded]);

    // Stats
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

    // Liste des années pour le sélecteur
    const listeAnnees = annees?.items || [];

    // Convertir PeriodeArbre en Periode pour les modals (compatible v5.0)
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

    // Vérifier si un niveau peut avoir des enfants (dynamique depuis les niveaux chargés)
    const peutAvoirEnfantsFn = (niveauId: string): boolean => {
        return niveauPeutAvoirEnfants(niveaux, niveauId);
    };

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>
            {/* Header */}
            <motion.div
                className="flex flex-col gap-[var(--gap-md)] sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="font-bold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.6vw, 1.75rem)' }}>
                        Périodes
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        {stats.total} période(s) — {stats.ouvertes} ouverte(s), {stats.cloturees} clôturée(s)
                    </p>
                </div>
                <div className="flex items-center gap-[var(--gap-sm)] flex-wrap">
                    {/* Bouton gestion templates & labels */}
                    {(hasPermission('periodes:templates:view') || hasPermission('niveaux_periode:view')) && (
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            icon={<Settings className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            onClick={() => setModalTemplatesOpen(true)}
                        >
                            Templates
                        </ElisaButton>
                    )}
                    {/* Bouton gestion niveaux & usages */}
                    {hasPermission('niveaux_periode:view') && (
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            icon={<Layers className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            onClick={() => setModalNiveauxOpen(true)}
                        >
                            Niveaux
                        </ElisaButton>
                    )}
                    {/* Sélecteur année */}
                    <select
                        value={anneeId}
                        onChange={(e) => setAnneeId(e.target.value)}
                        className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                        style={{
                            padding: 'var(--space-sm)',
                            fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)',
                        }}
                    >
                        <option value="">Sélectionner une année...</option>
                        {listeAnnees.map((a) => (
                            <option key={a.id} value={a.id}>{a.libelle}</option>
                        ))}
                    </select>
                    {hasPermission('periodes:templates:generer') && anneeId && (
                        <div className="relative">
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<Sparkles className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                            >
                                Générer
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
                            Nouvelle période
                        </ElisaButton>
                    )}
                </div>
            </motion.div>

            {/* Vue arborescente */}
            {!anneeId ? (
                <div className="flex flex-col items-center justify-center py-16 gap-[var(--gap-md)]">
                    <Calendar className="h-[var(--icon-xl)] w-[var(--icon-xl)] text-[var(--color-text-tertiary)]" />
                    <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                        Sélectionnez une année scolaire pour voir les périodes
                    </p>
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-bordure)] border-t-[var(--color-dominant-600)]" />
                </div>
            ) : !lignes.length ? (
                <div className="flex flex-col items-center justify-center py-16 gap-[var(--gap-md)]">
                    <Layers className="h-[var(--icon-xl)] w-[var(--icon-xl)] text-[var(--color-text-tertiary)]" />
                    <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                        Aucune période pour cette année
                    </p>
                </div>
            ) : (
                <>
                    {/* Contrôles expansion */}
                    <div className="flex items-center gap-[var(--gap-sm)]">
                        <button
                            onClick={expandAll}
                            className="text-xs text-[var(--color-dominant-600)] hover:underline font-medium"
                        >
                            Tout déplier
                        </button>
                        <span className="text-[var(--color-text-tertiary)]">·</span>
                        <button
                            onClick={collapseAll}
                            className="text-xs text-[var(--color-dominant-600)] hover:underline font-medium"
                        >
                            Tout replier
                        </button>
                    </div>

                    {/* Tableau arborescent */}
                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] overflow-hidden">
                        {/* En-tête */}
                        <div className="hidden sm:flex items-center border-b border-[var(--color-bordure)] bg-[var(--color-surface-alt)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide py-[var(--space-sm)]">
                            {/* Zone barres vide (même largeur que les lignes) */}
                            <div className="shrink-0" style={{ width: `${BAR_ZONE_FIXED}px` }} aria-hidden="true" />
                            {/* Colonnes grille (même padding que le contenu des lignes) */}
                            <div className="flex-1 min-w-0 grid grid-cols-[1fr_100px_120px_100px_140px] gap-[var(--gap-sm)] items-center" style={{ paddingLeft: 'var(--space-sm)' }}>
                                <span>Nom</span>
                                <span>Type</span>
                                <span>Période</span>
                                <span>Statut</span>
                                <span className="text-right">Actions</span>
                            </div>
                        </div>

                        {/* Lignes */}
                        <div className="divide-y divide-[var(--color-bordure)]">
                            {lignes.map((ligne) => {
                                const { node, profondeur, aEnfants } = ligne;
                                const isExpanded = expanded.has(node.id);
                                const niveau = getNiveauConfig(profondeur);

                                return (
                                    <div
                                        key={node.id}
                                        className="flex items-center py-[var(--space-sm)] hover:bg-[var(--color-surface-alt)]/50 transition-colors"
                                        style={{ backgroundColor: profondeur > 0 ? niveau.bgColor : undefined }}
                                    >
                                        {/* === Zone gauche : barres de profondeur (largeur fixe alignée) === */}
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

                                        {/* === Zone contenu (flex-1, après les barres) === */}
                                        <div
                                            className="flex-1 min-w-0 grid grid-cols-[1fr_100px_120px_100px_140px] gap-[var(--gap-sm)] items-center"
                                            style={{ paddingLeft: `calc(var(--space-sm) + ${profondeur * INDENT_DESKTOP}px)` }}
                                        >
                                            {/* --- Vue desktop : colonnes grille --- */}
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
                                                    <span className={`truncate ${profondeur === 0 ? 'font-semibold' : 'font-medium'} text-[var(--color-text-primary)]`} style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>{node.nom}</span>
                                                </div>
                                                <span className="rounded-full border px-2 py-0.5 text-xs font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-bordure)] text-center">{node.niveau?.label || node.niveauId?.substring(0, 8) || '—'}</span>
                                                <div style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.8125rem)' }}>
                                                    <p className="text-[var(--color-text-primary)]">{new Date(node.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">→ {new Date(node.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                                                </div>
                                                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium text-center ${COULEURS_STATUT[node.statut]}`}>{LABELS_STATUT[node.statut]}</span>
                                            </div>

                                            {/* --- Vue mobile : carte verticale --- */}
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
                                                        <span className={`truncate ${profondeur === 0 ? 'font-semibold' : 'font-medium'} text-[var(--color-text-primary)]`} style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>{node.nom}</span>
                                                    </div>
                                                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ml-2 ${COULEURS_STATUT[node.statut]}`}>{LABELS_STATUT[node.statut]}</span>
                                                </div>
                                                <div className="flex items-center gap-[var(--gap-sm)] flex-wrap mb-[var(--space-xs)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                                    <span className="rounded-full border px-2 py-0.5 text-xs font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-bordure)]">{node.niveau?.label || node.niveauId?.substring(0, 8) || '—'}</span>
                                                    <span className="text-[var(--color-text-secondary)]">
                                                        {new Date(node.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                        {' → '}
                                                        {new Date(node.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-[var(--gap-xxs)] col-span-full sm:col-span-1 justify-start sm:justify-end flex-wrap">
                                            <button
                                                onClick={() => voirDetail(node)}
                                                className="p-2 sm:p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                                title="Voir le détail"
                                            >
                                                <Eye className="h-5 w-5 sm:h-4 sm:w-4" />
                                            </button>
                                            {node.statut === StatutPeriode.OUVERTE && hasPermission('periodes:compositions:edit') && peutAvoirEnfantsFn(node.niveauId) && (
                                                <button
                                                    onClick={() => openGestionCompositions(node)}
                                                    className="p-2 sm:p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)] transition-colors"
                                                    title="Gérer les enfants"
                                                >
                                                    <Network className="h-5 w-5 sm:h-4 sm:w-4" />
                                                </button>
                                            )}
                                            {node.statut === StatutPeriode.OUVERTE && hasPermission('periodes:edit') && (
                                                <button
                                                    onClick={() => openModifier(node)}
                                                    className="p-2 sm:p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)] transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
                                                </button>
                                            )}
                                            {node.statut === StatutPeriode.OUVERTE && hasPermission('periodes:cloturer') && (
                                                <button
                                                    onClick={() => openCloturer(node)}
                                                    className="p-2 sm:p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-amber-600 transition-colors"
                                                    title="Clôturer"
                                                >
                                                    <Lock className="h-5 w-5 sm:h-4 sm:w-4" />
                                                </button>
                                            )}
                                            {node.statut === StatutPeriode.CLOTUREE && hasPermission('periodes:reouvrir') && (
                                                <button
                                                    onClick={() => setConfirmAction({ type: 'reouvrir', periode: node })}
                                                    className="p-2 sm:p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)] transition-colors"
                                                    title="Réouvrir"
                                                >
                                                    <Unlock className="h-5 w-5 sm:h-4 sm:w-4" />
                                                </button>
                                            )}
                                            {node.statut === StatutPeriode.OUVERTE && hasPermission('periodes:delete') && !aEnfants && (
                                                <button
                                                    onClick={() => setConfirmAction({ type: 'supprimer', periode: node })}
                                                    className="p-2 sm:p-1 rounded hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-600 transition-colors"
                                                    title="Supprimer"
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

            {/* Modal gestion des compositions */}
            <ModalGestionCompositions
                periode={periodeToCompose}
                isOpen={modalCompositionsOpen}
                onClose={() => { setModalCompositionsOpen(false); setPeriodeToCompose(null); }}
                onSuccess={() => { setModalCompositionsOpen(false); setPeriodeToCompose(null); }}
            />

            {/* Modal gestion templates & labels */}
            <ModalGestionTemplates
                isOpen={modalTemplatesOpen}
                onClose={() => setModalTemplatesOpen(false)}
            />

            {/* Modal gestion niveaux & usages */}
            <ModalGestionNiveaux
                isOpen={modalNiveauxOpen}
                onClose={() => setModalNiveauxOpen(false)}
            />

            {/* Modal formulaire (création/édition) */}
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

            {/* Modal clôture avec impacts */}
            <ModalCloturePeriode
                periode={periodeToCloture ? arbreToPeriode(periodeToCloture) : null}
                isOpen={modalClotureOpen}
                onClose={() => { setModalClotureOpen(false); setPeriodeToCloture(null); }}
                onClotureSuccess={() => { setModalClotureOpen(false); setPeriodeToCloture(null); }}
            />

            {/* Modal confirmation (supprimer/réouvrir) */}
            {confirmAction && (
                <ConfirmationModal
                    isOpen={!!confirmAction}
                    title={
                        confirmAction.type === 'supprimer' ? 'Supprimer la période' :
                        'Réouvrir la période'
                    }
                    message={`Êtes-vous sûr de vouloir ${confirmAction.type === 'supprimer' ? 'supprimer' : 'réouvrir'} "${confirmAction.periode.nom}" ?`}
                    variant={confirmAction.type === 'supprimer' ? 'danger' : 'info'}
                    confirmLabel={
                        confirmAction.type === 'supprimer' ? 'Supprimer' : 'Réouvrir'
                    }
                    onConfirm={async () => {
                        const { type, periode } = confirmAction;
                        if (type === 'supprimer') {
                            try {
                                await supprimer.mutateAsync(periode.id);
                                setConfirmAction(null);
                            } catch (e) {
                                // L'erreur est déjà affichée par le toast.error dans la configuration onError de la mutation.
                                // On ne ferme pas le modal en cas d'erreur pour que l'utilisateur puisse corriger/comprendre.
                            }
                        } else if (type === 'reouvrir') {
                            try {
                                await reouvrir.mutateAsync({ id: periode.id, motif: 'Réouverture manuelle' });
                                setConfirmAction(null);
                            } catch (e) {}
                        }
                    }}
                    onCancel={() => setConfirmAction(null)}
                    isLoading={supprimer.isPending || reouvrir.isPending}
                />
            )}
        </div>
    );
}
