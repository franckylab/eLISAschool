/**
 * ==================================
 * eLISAschool - Modal Génération Heures de Cours depuis EDT (multi-sélection)
 * ==================================
 * 3 étapes (CustomModal + gestion manuelle) :
 *  1. Sélection — multi-sélection affectations (classe × matière × enseignant) + dates
 *  2. Résumé — récapitulatif des affectations sélectionnées
 *  3. Résultat — statistiques (créées / ignorées / erreurs)
 *
 * Flux async contrôlé : l'étape 3 ne s'affiche QU'APRÈS la complétion
 * de la génération (pas de StepperModal — incompatible async).
 *
 * Autonome : charge ses propres affectations (indépendant des filtres toolbar).
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Loader2, CheckCircle2, AlertTriangle,
    Info, GraduationCap, BookOpen, Users, CalendarDays,
    ClipboardList, Sparkles, CheckSquare, Square, Filter,
} from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { CustomModal } from '@/components/modals/CustomModal';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDateInput } from '@/lib/date-utils';
import { useGenererHeuresCoursFromEdt, type GenererHeuresCoursResult } from '../hooks/use-heure-cours';
import { useAffectationsOptions, type AffectationOption } from '../hooks/use-emploi-du-temps';

// ─── Types ──────────────────────────────────────────────

interface EDTHeuresCoursModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Pré-sélection classe depuis le contexte toolbar (optionnel) */
    contexteClasseAnneeId?: string;
}

// ─── Helpers dates ──────────────────────────────────────

function getSemaineCourante(): { lundi: string; samedi: string } {
    const now = new Date();
    const day = now.getDay();
    const lundi = new Date(now);
    lundi.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const samedi = new Date(lundi);
    samedi.setDate(lundi.getDate() + 5);
    return { lundi: formatDateInput(lundi), samedi: formatDateInput(samedi) };
}

// ─── Métadonnées étapes ─────────────────────────────────

const ETAPES_META = [
    { id: 'selection', icon: ClipboardList },
    { id: 'resume', icon: Sparkles },
    { id: 'resultat', icon: CheckCircle2 },
] as const;

// ─── Composant ──────────────────────────────────────────

export function EDTHeuresCoursModal({
    open,
    onOpenChange,
    contexteClasseAnneeId,
}: EDTHeuresCoursModalProps) {
    const { t } = useTranslation('emplois');

    // ─── État formulaire ───
    const [affectationsSelectionnees, setAffectationsSelectionnees] = useState<Set<string>>(new Set());
    const [filtreClasseIds, setFiltreClasseIds] = useState<Set<string>>(new Set());

    const { lundi, samedi } = getSemaineCourante();
    const [dateDebut, setDateDebut] = useState(lundi);
    const [dateFin, setDateFin] = useState(samedi);

    // ─── État étapes (manuel) ───
    const [etapeCourante, setEtapeCourante] = useState(0);
    const [resultat, setResultat] = useState<GenererHeuresCoursResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isInitializingRef = useRef(true);

    // ─── Chargement autonome des affectations ───
    const { data: affectations = [], isLoading: chargementAffectations } = useAffectationsOptions();

    const generer = useGenererHeuresCoursFromEdt();

    // ─── Classes disponibles (pour le filtre) ───
    const classesDisponibles = useMemo(() => {
        const map = new Map<string, { id: string; nom: string; niveau?: string }>();
        for (const a of affectations) {
            const classe = a.classeAnnee?.classe;
            if (classe?.id && classe?.nom) map.set(classe.id, { id: classe.id, nom: classe.nom, niveau: classe.niveau });
        }
        return Array.from(map.values()).sort((a, b) => a.nom.localeCompare(b.nom));
    }, [affectations]);

    // ─── Affectations filtrées par classe ───
    const affectationsFiltrees = useMemo(() => {
        if (filtreClasseIds.size === 0) return affectations;
        return affectations.filter(a => {
            const classeId = a.classeAnnee?.classe?.id;
            return classeId && filtreClasseIds.has(classeId);
        });
    }, [affectations, filtreClasseIds]);

    // ─── Initialisation au pré-remplissage contexte ───
    useEffect(() => {
        if (!open) return;
        isInitializingRef.current = true;

        // Reset complet
        setAffectationsSelectionnees(new Set());
        setFiltreClasseIds(new Set());
        setResultat(null);
        setIsSubmitting(false);
        setEtapeCourante(0);

        const { lundi: l, samedi: s } = getSemaineCourante();
        setDateDebut(l);
        setDateFin(s);

        // Pré-sélection depuis le contexte toolbar
        if (contexteClasseAnneeId) {
            const aff = affectations.find(a => a.classeAnnee?.id === contexteClasseAnneeId);
            if (aff?.classeAnnee?.classe?.id) {
                setFiltreClasseIds(new Set([aff.classeAnnee.classe.id]));
            }
        }

        setTimeout(() => { isInitializingRef.current = false; }, 50);
    }, [open, contexteClasseAnneeId, affectations]);

    // ─── Toggle affectation ───
    const toggleAffectation = useCallback((id: string) => {
        setAffectationsSelectionnees(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // ─── Tout sélectionner / désélectionner ───
    const toutSelectionner = useCallback(() => {
        setAffectationsSelectionnees(new Set(affectationsFiltrees.map(a => a.id)));
    }, [affectationsFiltrees]);

    const toutDeselectionner = useCallback(() => {
        setAffectationsSelectionnees(new Set());
    }, []);

    // ─── Toggle filtre classe ───
    const toggleFiltreClasse = useCallback((classeId: string) => {
        setFiltreClasseIds(prev => {
            const next = new Set(prev);
            if (next.has(classeId)) next.delete(classeId);
            else next.add(classeId);
            return next;
        });
        // Désélectionner les affectations qui ne correspondent plus au filtre
        setAffectationsSelectionnees(new Set());
    }, []);

    // ─── Validation étape 1 ───
    const etape1Valide = useMemo(() => {
        return affectationsSelectionnees.size > 0 && !!dateDebut && !!dateFin && dateDebut <= dateFin;
    }, [affectationsSelectionnees, dateDebut, dateFin]);

    // ─── Navigation étapes ───
    const allerEtapeSuivante = useCallback(() => {
        setEtapeCourante(prev => Math.min(prev + 1, 2));
    }, []);

    const allerEtapePrecedente = useCallback(() => {
        setEtapeCourante(prev => Math.max(prev - 1, 0));
    }, []);

    // ─── Soumission asynchrone (étape 2 → génération → étape 3) ───
    const handleGenerer = useCallback(async () => {
        if (affectationsSelectionnees.size === 0 || !dateDebut || !dateFin) return;
        setIsSubmitting(true);
        try {
            const res = await generer.mutateAsync({
                affectationMatiereIds: Array.from(affectationsSelectionnees),
                dateDebut,
                dateFin,
            });
            setResultat(res ?? null);
            allerEtapeSuivante();
        } catch {
            // Erreur gérée par le hook TanStack Query (toast)
        } finally {
            setIsSubmitting(false);
        }
    }, [affectationsSelectionnees, dateDebut, dateFin, generer, allerEtapeSuivante]);

    // ─── Fermeture ───
    const handleClose = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    // ─── Labels étapes ───
    const labelsEtapes = useMemo(() => [
        t('generationHeuresCours.etape1Titre'),
        t('generationHeuresCours.etape2Titre'),
        t('generationHeuresCours.etape3Titre'),
    ], [t]);

    // ─── Footer dynamique ───
    const footerContent = useMemo(() => {
        if (etapeCourante === 0) {
            return (
                <>
                    <ElisaButton variant="outline" size="md" onClick={handleClose}>
                        {t('common:boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        size="md"
                        disabled={!etape1Valide}
                        onClick={allerEtapeSuivante}
                        icon={<CalendarDays className="h-4 w-4" />}
                    >
                        {t('common:boutons.suivant')}
                    </ElisaButton>
                </>
            );
        }
        if (etapeCourante === 1) {
            return (
                <>
                    <ElisaButton variant="outline" size="md" onClick={allerEtapePrecedente}>
                        {t('common:boutons.retour')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        size="md"
                        loading={isSubmitting}
                        onClick={handleGenerer}
                        icon={!isSubmitting ? <Sparkles className="h-4 w-4" /> : undefined}
                    >
                        {t('generationHeuresCours.lancer')} ({affectationsSelectionnees.size})
                    </ElisaButton>
                </>
            );
        }
        return null;
    }, [etapeCourante, etape1Valide, isSubmitting, handleClose, allerEtapeSuivante, allerEtapePrecedente, handleGenerer, affectationsSelectionnees.size, t]);

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) handleClose(); }}
            title={t('generationHeuresCours.titre')}
            description={t('generationHeuresCours.description')}
            size="2xl"
            footer={footerContent && (
                <div className="flex items-center justify-end gap-[var(--gap-md)]">
                    {footerContent}
                </div>
            )}
            draggable={false}
            resizable={false}
        >
            {/* Stepper Header */}
            <StepperHeader
                etapeCourante={etapeCourante}
                labels={labelsEtapes}
                icons={ETAPES_META.map(m => m.icon)}
            />

            {/* Contenu étape */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={etapeCourante}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.15 }}
                >
                    {etapeCourante === 0 && (
                        <ContenuSelection
                            t={t}
                            chargementAffectations={chargementAffectations}
                            classesDisponibles={classesDisponibles}
                            filtreClasseIds={filtreClasseIds}
                            toggleFiltreClasse={toggleFiltreClasse}
                            affectationsFiltrees={affectationsFiltrees}
                            affectationsSelectionnees={affectationsSelectionnees}
                            toggleAffectation={toggleAffectation}
                            toutSelectionner={toutSelectionner}
                            toutDeselectionner={toutDeselectionner}
                            dateDebut={dateDebut}
                            setDateDebut={setDateDebut}
                            dateFin={dateFin}
                            setDateFin={setDateFin}
                        />
                    )}
                    {etapeCourante === 1 && (
                        <ContenuResume
                            t={t}
                            affectations={affectations}
                            affectationsSelectionnees={affectationsSelectionnees}
                            dateDebut={dateDebut}
                            dateFin={dateFin}
                        />
                    )}
                    {etapeCourante === 2 && (
                        <ContenuResultat
                            t={t}
                            resultat={resultat}
                            onClose={handleClose}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </CustomModal>
    );
}

// ─── Contenu Étape 1 : Multi-sélection ──────────────────

function ContenuSelection({ t, chargementAffectations, classesDisponibles, filtreClasseIds, toggleFiltreClasse, affectationsFiltrees, affectationsSelectionnees, toggleAffectation, toutSelectionner, toutDeselectionner, dateDebut, setDateDebut, dateFin, setDateFin }: {
    t: ReturnType<typeof useTranslation>['t'];
    chargementAffectations: boolean;
    classesDisponibles: { id: string; nom: string; niveau?: string }[];
    filtreClasseIds: Set<string>;
    toggleFiltreClasse: (id: string) => void;
    affectationsFiltrees: AffectationOption[];
    affectationsSelectionnees: Set<string>;
    toggleAffectation: (id: string) => void;
    toutSelectionner: () => void;
    toutDeselectionner: () => void;
    dateDebut: string;
    setDateDebut: (v: string) => void;
    dateFin: string;
    setDateFin: (v: string) => void;
}) {
    const toutesSelectionnees = affectationsFiltrees.length > 0 && affectationsSelectionnees.size === affectationsFiltrees.length;

    return (
        <div className="space-y-4">
            {/* Info */}
            <div className="p-3 rounded-[var(--radius-md)] border border-[var(--color-accent-500)]/20 bg-[var(--color-accent-500)]/5">
                <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-[var(--color-accent-600)] shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                        {t('generationHeuresCours.infoMultiSelection')}
                    </p>
                </div>
            </div>

            {/* Filtre par classe */}
            {classesDisponibles.length > 1 && (
                <>
                    <SectionSeparator title={t('generationHeuresCours.filtrerParClasse')} icon={<Filter className="h-4 w-4" />} />
                    <div className="flex flex-wrap gap-[var(--gap-xs)]">
                        {classesDisponibles.map(classe => (
                            <button
                                key={classe.id}
                                type="button"
                                onClick={() => toggleFiltreClasse(classe.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                    filtreClasseIds.has(classe.id)
                                        ? 'bg-[var(--color-dominant-600)] text-white border-[var(--color-dominant-600)]'
                                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-bordure)] hover:border-[var(--color-dominant-400)]'
                                }`}
                                style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}
                            >
                                {classe.nom}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Liste affectations */}
            <SectionSeparator
                title={t('generationHeuresCours.affectationsDisponibles')}
                icon={<GraduationCap className="h-4 w-4" />}
                action={
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-text-muted)]">
                            {affectationsSelectionnees.size}/{affectationsFiltrees.length}
                        </span>
                        <ElisaButton
                            variant="ghost"
                            size="xs"
                            onClick={toutesSelectionnees ? toutDeselectionner : toutSelectionner}
                            disabled={affectationsFiltrees.length === 0}
                        >
                            {toutesSelectionnees ? t('generationHeuresCours.toutDeselectionner') : t('generationHeuresCours.toutSelectionner')}
                        </ElisaButton>
                    </div>
                }
            />

            {chargementAffectations ? (
                <div className="flex items-center justify-center py-6 gap-2 text-[var(--color-text-secondary)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{t('chargement', 'Chargement…')}</span>
                </div>
            ) : affectationsFiltrees.length === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10">
                    <AlertTriangle className="h-4 w-4 text-[var(--color-warning)] shrink-0" />
                    <span className="text-sm">{t('generationHeuresCours.aucuneAffectation')}</span>
                </div>
            ) : (
                <div className="max-h-[280px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-bordure)] divide-y divide-[var(--color-bordure)]">
                    {affectationsFiltrees.map(aff => {
                        const isSelected = affectationsSelectionnees.has(aff.id);
                        const classeNom = aff.classeAnnee?.classe?.nom ?? '—';
                        const matiereNom = aff.matiere?.nom ?? '—';
                        const enseignantNom = aff.enseignant?.utilisateur?.profil
                            ? `${aff.enseignant.utilisateur.profil.prenom} ${aff.enseignant.utilisateur.profil.nom}`
                            : aff.enseignant?.matricule ?? '—';

                        return (
                            <button
                                key={aff.id}
                                type="button"
                                onClick={() => toggleAffectation(aff.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-surface-hover)] ${
                                    isSelected ? 'bg-[var(--color-dominant-50)]' : ''
                                }`}
                            >
                                {/* Checkbox */}
                                {isSelected
                                    ? <CheckSquare className="h-4 w-4 text-[var(--color-dominant-600)] shrink-0" />
                                    : <Square className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
                                }

                                {/* Infos affectation */}
                                <div className="flex-1 min-w-0 grid grid-cols-3 gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <GraduationCap className="h-3 w-3 text-[var(--color-dominant-600)] shrink-0" />
                                        <span className="text-xs font-medium truncate" style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                                            {classeNom}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <BookOpen className="h-3 w-3 text-[var(--color-accent-600)] shrink-0" />
                                        <span className="text-xs truncate text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                                            {matiereNom}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Users className="h-3 w-3 text-[var(--color-success)] shrink-0" />
                                        <span className="text-xs truncate text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                                            {enseignantNom}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Dates */}
            <SectionSeparator title={t('generationHeuresCours.periode')} icon={<CalendarDays className="h-4 w-4" />} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                <div className="flex flex-col gap-[var(--gap-xs)]">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                        {t('generationHeuresCours.dateDebut')}
                    </label>
                    <input
                        type="date"
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                        className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] transition-shadow"
                        style={{
                            fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)',
                            padding: 'clamp(0.375rem, 0.3rem + 0.3vw, 0.5rem) clamp(0.5rem, 0.4rem + 0.4vw, 0.75rem)',
                        }}
                    />
                </div>
                <div className="flex flex-col gap-[var(--gap-xs)]">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                        {t('generationHeuresCours.dateFin')}
                    </label>
                    <input
                        type="date"
                        value={dateFin}
                        min={dateDebut}
                        onChange={(e) => setDateFin(e.target.value)}
                        className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] transition-shadow"
                        style={{
                            fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)',
                            padding: 'clamp(0.375rem, 0.3rem + 0.3vw, 0.5rem) clamp(0.5rem, 0.4rem + 0.4vw, 0.75rem)',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Contenu Étape 2 : Résumé ───────────────────────────

function ContenuResume({ t, affectations, affectationsSelectionnees, dateDebut, dateFin }: {
    t: ReturnType<typeof useTranslation>['t'];
    affectations: AffectationOption[];
    affectationsSelectionnees: Set<string>;
    dateDebut: string;
    dateFin: string;
}) {
    const selected = affectations.filter(a => affectationsSelectionnees.has(a.id));

    // Grouper par classe pour le résumé
    const parClasse = useMemo(() => {
        const map = new Map<string, AffectationOption[]>();
        for (const aff of selected) {
            const classeNom = aff.classeAnnee?.classe?.nom ?? '—';
            if (!map.has(classeNom)) map.set(classeNom, []);
            map.get(classeNom)!.push(aff);
        }
        return map;
    }, [selected]);

    return (
        <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                {t('generationHeuresCours.resumeMultiDescription', { count: selected.length })}
            </p>

            {/* Résumé par classe */}
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {Array.from(parClasse.entries()).map(([classeNom, affs]) => (
                    <div key={classeNom} className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface-alt)] p-[var(--space-md)] space-y-2">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-[var(--color-dominant-600)]" />
                            <span className="font-semibold text-sm" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                {classeNom}
                            </span>
                            <span className="text-xs text-[var(--color-text-muted)]">({affs.length})</span>
                        </div>
                        <div className="space-y-1.5 pl-6">
                            {affs.map(aff => {
                                const matiereNom = aff.matiere?.nom ?? '—';
                                const enseignantNom = aff.enseignant?.utilisateur?.profil
                                    ? `${aff.enseignant.utilisateur.profil.prenom} ${aff.enseignant.utilisateur.profil.nom}`
                                    : aff.enseignant?.matricule ?? '—';
                                return (
                                    <div key={aff.id} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                                        <BookOpen className="h-3 w-3 text-[var(--color-accent-600)] shrink-0" />
                                        <span className="font-medium">{matiereNom}</span>
                                        <span className="text-[var(--color-text-muted)]">—</span>
                                        <Users className="h-3 w-3 text-[var(--color-success)] shrink-0" />
                                        <span>{enseignantNom}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Période */}
            <div className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                <CalendarDays className="h-4 w-4 text-[var(--color-text-secondary)]" />
                <span className="text-sm text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                    {t('generationHeuresCours.du')} {formatDateAffichage(dateDebut)} {t('generationHeuresCours.au')} {formatDateAffichage(dateFin)}
                </span>
            </div>
        </div>
    );
}

// ─── Contenu Étape 3 : Résultat ─────────────────────────

function ContenuResultat({ t, resultat, onClose }: {
    t: ReturnType<typeof useTranslation>['t'];
    resultat: GenererHeuresCoursResult | null;
    onClose: () => void;
}) {
    if (!resultat) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-dominant-600)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                    {t('generationHeuresCours.enCours')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center py-2">
                <div className="h-14 w-14 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mb-3">
                    <CheckCircle2 className="h-7 w-7 text-[var(--color-success)]" />
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}>
                    {t('generationHeuresCours.resultat')}
                </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[var(--gap-sm)]">
                <ResultatCard label={t('generationHeuresCours.creees')} value={resultat.created} color="success" />
                <ResultatCard label={t('generationHeuresCours.ignorees')} value={resultat.skipped} color="warning" />
                <ResultatCard label={t('generationHeuresCours.erreurs')} value={resultat.errors ?? 0} color="danger" />
                <ResultatCard label={t('generationHeuresCours.totalTraite')} value={resultat.total ?? (resultat.created + resultat.skipped)} color="dominant" />
            </div>

            {resultat.created === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10">
                    <AlertTriangle className="h-4 w-4 text-[var(--color-warning)] shrink-0" />
                    <span className="text-xs text-[var(--color-warning)]">
                        {t('generationHeuresCours.aucuneCreation')}
                    </span>
                </div>
            )}

            <div className="flex justify-center gap-3 pt-2">
                <ElisaButton variant="outline" size="md" onClick={onClose}>
                    {t('generationHeuresCours.fermer')}
                </ElisaButton>
            </div>
        </div>
    );
}

// ─── Stepper Header ─────────────────────────────────────

function StepperHeader({ etapeCourante, labels, icons }: {
    etapeCourante: number;
    labels: string[];
    icons: readonly React.ComponentType<{ className?: string }>[];
}) {
    const total = labels.length;

    return (
        <div className="flex flex-col gap-[var(--gap-sm)] mb-[var(--space-md)]">
            <div className="relative h-1 rounded-full bg-[var(--color-bordure)] overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-dominante)] transition-all duration-300"
                    style={{ width: `${((etapeCourante + 1) / total) * 100}%` }}
                />
            </div>
            <div className="flex items-center justify-between overflow-x-auto scrollbar-none -mx-1 px-1">
                {labels.map((label, index) => {
                    const Icon = icons[index];
                    const estComplet = index < etapeCourante;
                    const estActif = index === etapeCourante;
                    return (
                        <div key={index} className="flex flex-col items-center gap-1 px-2 py-1 min-w-[clamp(3rem,15vw,5rem)]">
                            <div className={`flex items-center justify-center rounded-full transition-all duration-200 h-[clamp(1.5rem,4vw,2rem)] w-[clamp(1.5rem,4vw,2rem)] ${estActif ? 'bg-[var(--color-dominante)] text-white shadow-sm' : estComplet ? 'bg-[var(--color-dominante)]/20 text-[var(--color-dominante)]' : 'bg-[var(--color-bordure)]/50 text-[var(--color-text-muted)]'}`}>
                                {estComplet ? <CheckCircle2 className="h-[clamp(0.75rem,2vw,0.875rem)] w-[clamp(0.75rem,2vw,0.875rem)]" /> : <Icon className="h-[clamp(0.75rem,2vw,0.875rem)] w-[clamp(0.75rem,2vw,0.875rem)]" />}
                            </div>
                            <span className={`text-[clamp(0.5625rem,1.25vw,0.6875rem)] text-center leading-tight truncate max-w-full ${estActif ? 'text-[var(--color-dominante)] font-semibold' : estComplet ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-muted)]'}`}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Composants utilitaires ─────────────────────────────

function ResultatCard({ label, value, color }: {
    label: string;
    value: number;
    color: 'success' | 'warning' | 'danger' | 'dominant';
}) {
    const colorMap = {
        success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30',
        warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30',
        danger: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30',
        dominant: 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] border-[var(--color-dominant-200)]',
    };
    return (
        <div className={`p-3 rounded-[var(--radius-md)] border text-center ${colorMap[color]}`}>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-[10px] font-medium uppercase tracking-wide mt-1 opacity-80">{label}</div>
        </div>
    );
}

function formatDateAffichage(dateStr: string): string {
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}
