/**
 * ==================================
 * eLISAschool - Tab Heures de Cours (suivi effectif)
 * ==================================
 * Vue mensuelle : stats + liste détaillée avec pointage rapide
 * Version: 2.0.0
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Calendar, BookOpen, CheckCircle, XCircle,
    ChevronLeft, ChevronRight, RefreshCw, Plus, Edit3, Filter,
    UserCheck, UserX, CalendarClock, ArrowRightLeft,
} from 'lucide-react';
import {
    useResumeMensuel, useGenererHeuresCoursFromEdt,
    useHeureCoursList, useUpdateHeureCours,
} from '@/features/emploi-du-temps/hooks/use-heure-cours';
import type { HeureCours } from '@/features/emploi-du-temps/hooks/use-heure-cours';
import { HeureCoursFormModal } from '@/features/emploi-du-temps/components/heure-cours-form-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { SchoolLoading } from '@/components/feedback';
import { formatDate } from '@/lib/date-utils';
import { formatMontant } from '@/lib/format-utils';

interface Props {
    enseignantId: string;
}

type VueType = 'resume' | 'liste';
type FiltreStatut = 'TOUS' | 'PLANIFIE' | 'EFFECTUE' | 'ANNULE' | 'REMPLACE';

const STATUT_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
    PLANIFIE: { icon: <CalendarClock className="h-3.5 w-3.5" />, color: 'text-info', bg: 'bg-info/10', label: 'heuresCours.planifie' },
    EFFECTUE: { icon: <UserCheck className="h-3.5 w-3.5" />, color: 'text-success', bg: 'bg-success/10', label: 'heuresCours.effectue' },
    ANNULE: { icon: <UserX className="h-3.5 w-3.5" />, color: 'text-destructive', bg: 'bg-destructive/10', label: 'heuresCours.annule' },
    REMPLACE: { icon: <ArrowRightLeft className="h-3.5 w-3.5" />, color: 'text-warning', bg: 'bg-warning/10', label: 'heuresCours.remplace' },
};

export function TabHeureCours({ enseignantId }: Props) {
    const now = new Date();
    const [mois, setMois] = useState(now.getMonth() + 1);
    const [annee, setAnnee] = useState(now.getFullYear());
    const { t } = useTranslation('personnel');
    const [vue, setVue] = useState<VueType>('resume');
    const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('TOUS');

    const [modalMode, setModalMode] = useState<'creation' | 'edition' | null>(null);
    const [coursEdition, setCoursEdition] = useState<HeureCours | null>(null);

    const openCreate = () => { setCoursEdition(null); setModalMode('creation'); };
    const openEdit = (c: HeureCours) => { setCoursEdition(c); setModalMode('edition'); };
    const closeModal = () => { setModalMode(null); setCoursEdition(null); };

    // Dates du mois courant
    const dateDebut = `${annee}-${String(mois).padStart(2, '0')}-01`;
    const dateFin = new Date(annee, mois, 0).toISOString().split('T')[0];

    const { data: resume, isLoading: loadingResume } = useResumeMensuel(enseignantId, mois, annee);
    const { data: listeData, isLoading: loadingListe, refetch: refetchListe } = useHeureCoursList({
        enseignantId,
        dateDebut,
        dateFin,
        ...(filtreStatut !== 'TOUS' ? { statutEffectue: filtreStatut } : {}),
        sortBy: 'date',
        sortOrder: 'ASC',
        limit: 100,
    } as Record<string, string | number | boolean>);

    const updateMutation = useUpdateHeureCours();
    const generer = useGenererHeuresCoursFromEdt();

    const moisPrecedent = () => {
        if (mois === 1) { setMois(12); setAnnee(annee - 1); }
        else { setMois(mois - 1); }
    };
    const moisSuivant = () => {
        if (mois === 12) { setMois(1); setAnnee(annee + 1); }
        else { setMois(mois + 1); }
    };

    const handleGenererFromEdt = () => {
        generer.mutate(
            { enseignantId, dateDebut, dateFin },
            {
                onSuccess: (result) => {
                    if (!result) return;
                    if (result.created === 0 && result.skipped === 0) {
                        toast.info(t('heuresCours.aucunCreneauEdt'));
                    } else {
                        toast.success(t('heuresCours.generationReussie', { created: result.created, skipped: result.skipped }));
                    }
                    refetchListe();
                },
                onError: () => {
                    toast.error(t('heuresCours.erreurGeneration'));
                },
            }
        );
    };

    // Pointage rapide
    const handlePointageRapide = (cours: HeureCours, nouveauStatut: 'EFFECTUE' | 'ANNULE') => {
        updateMutation.mutate(
            { id: cours.id, statutEffectue: nouveauStatut },
            {
                onSuccess: () => {
                    toast.success(t(`heuresCours.statutChange.${nouveauStatut.toLowerCase()}`));
                    refetchListe();
                },
            }
        );
    };

    const nomMois = formatDate(new Date(annee, mois - 1, 1), 'MMMM yyyy');
    const heures = listeData?.items ?? [];

    // Grouper par date pour la vue liste
    const heuresParDate = useMemo(() => {
        const grouped = new Map<string, HeureCours[]>();
        for (const h of heures) {
            const dateKey = h.date?.split('T')[0] ?? 'unknown';
            if (!grouped.has(dateKey)) grouped.set(dateKey, []);
            grouped.get(dateKey)!.push(h);
        }
        return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [heures]);

    return (
        <div className="space-y-6">
            {/* ─── Navigation + actions ──────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <ElisaButton variant="outline" size="sm" onClick={moisPrecedent}>
                        <ChevronLeft className="h-4 w-4" />
                    </ElisaButton>
                    <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        {nomMois}
                    </h3>
                    <ElisaButton variant="outline" size="sm" onClick={moisSuivant}>
                        <ChevronRight className="h-4 w-4" />
                    </ElisaButton>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Toggle vue */}
                    <div className="flex rounded-lg border border-[var(--color-bordure)] overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setVue('resume')}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                vue === 'resume'
                                    ? 'bg-[var(--color-dominant-600)] text-white'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                            }`}
                        >
                            {t('heuresCours.vueResume')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setVue('liste')}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                vue === 'liste'
                                    ? 'bg-[var(--color-dominant-600)] text-white'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                            }`}
                        >
                            {t('heuresCours.vueListe')}
                        </button>
                    </div>

                    <ElisaButton variant="outline" size="xs" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
                        {t('heuresCours.ajouterCours')}
                    </ElisaButton>
                    <ElisaButton
                        variant="outline"
                        size="xs"
                        icon={<RefreshCw className="h-3.5 w-3.5" />}
                        onClick={handleGenererFromEdt}
                        isLoading={generer.isPending}
                    >
                        {t('heuresCours.genererDepuisEdt')}
                    </ElisaButton>
                </div>
            </div>

            {/* ─── Stats cards ───────────────────────── */}
            {loadingResume ? (
                <CardGrid columns={{ default: 1, md: 4 }} loading skeletonCount={4} />
            ) : resume ? (
                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={CheckCircle} label={t('heuresCours.heuresEffectuees')} value={`${resume.heuresEffectuees}h`} tone="success" />
                    <StatCard icon={Clock} label={t('heuresCours.heuresPlanifiees')} value={`${resume.heuresPlanifiees}h`} tone="warning" />
                    <StatCard icon={XCircle} label={t('heuresCours.heuresAnnulees')} value={`${resume.heuresAnnulees}h`} tone="danger" />
                    <StatCard icon={BookOpen} label={t('heuresCours.nombreCours')} value={resume.nombreCours} tone="accent" />
                </CardGrid>
            ) : null}

            {/* ─── Vue Résumé ────────────────────────── */}
            {vue === 'resume' && resume && (
                <>
                    {resume.detailParMatiere && resume.detailParMatiere.length > 0 ? (
                        <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-bordure)] p-4 sm:p-6">
                            <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-[var(--color-dominant-600)]" />
                                {t('heuresCours.detailMatiere')}
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[var(--color-bordure)]">
                                            <th className="text-left py-3 px-4 font-medium text-[var(--color-text-muted)]">{t('heuresCours.matiere')}</th>
                                            <th className="text-right py-3 px-4 font-medium text-[var(--color-text-muted)]">{t('heuresCours.heures')}</th>
                                            <th className="text-right py-3 px-4 font-medium text-[var(--color-text-muted)]">{t('heuresCours.tarifHoraire')}</th>
                                            <th className="text-right py-3 px-4 font-medium text-[var(--color-text-muted)]">{t('heuresCours.montant')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-bordure)]">
                                        {resume.detailParMatiere.map((d, idx) => (
                                            <tr key={idx} className="hover:bg-[var(--color-surface-hover)]">
                                                <td className="py-3 px-4 font-medium text-[var(--color-text-primary)]">{d.matiereNom}</td>
                                                <td className="py-3 px-4 text-right text-[var(--color-text-secondary)]">{d.heures}h</td>
                                                <td className="py-3 px-4 text-right text-[var(--color-text-secondary)]">{`${formatMontant(d.tarifHoraire)}/h`}</td>
                                                <td className="py-3 px-4 text-right font-semibold text-[var(--color-text-primary)]">{formatMontant(d.montant)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-[var(--color-bordure)] bg-[var(--color-surface-hover)] font-semibold">
                                            <td className="py-3 px-4 text-[var(--color-text-primary)]">{t('heuresCours.total')}</td>
                                            <td className="py-3 px-4 text-right text-[var(--color-text-primary)]">{resume.heuresEffectuees}h</td>
                                            <td className="py-3 px-4 text-right" />
                                            <td className="py-3 px-4 text-right text-[var(--color-text-primary)]">{formatMontant(resume.detailParMatiere.reduce((s, d) => s + d.montant, 0))}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <EmptyState message={t('heuresCours.aucuneHeure')} description={t('heuresCours.aucuneHeureDesc')} />
                    )}
                </>
            )}

            {/* ─── Vue Liste détaillée avec pointage ─── */}
            {vue === 'liste' && (
                <div className="space-y-4">
                    {/* Filtre statut */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
                        {(['TOUS', 'PLANIFIE', 'EFFECTUE', 'ANNULE', 'REMPLACE'] as FiltreStatut[]).map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setFiltreStatut(s)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                    filtreStatut === s
                                        ? s === 'TOUS'
                                            ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]'
                                            : `${STATUT_CONFIG[s]?.bg ?? ''} ${STATUT_CONFIG[s]?.color ?? ''}`
                                        : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                }`}
                            >
                                {s === 'TOUS' ? t('heuresCours.tous') : t(STATUT_CONFIG[s]?.label ?? s)}
                            </button>
                        ))}
                    </div>

                    {loadingListe ? (
                        <SchoolLoading variant="compact" theme="book" />
                    ) : heuresParDate.length === 0 ? (
                        <EmptyState message={t('heuresCours.aucunCoursPeriode')} description={t('heuresCours.aucunCoursPeriodeDesc')} />
                    ) : (
                        <div className="space-y-4">
                            {heuresParDate.map(([date, cours]) => (
                                <div key={date}>
                                    <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                                        {formatDate(new Date(date), 'EEEE d MMMM')}
                                    </div>
                                    <div className="space-y-1.5">
                                        {cours.map(h => (
                                            <HeureLigne
                                                key={h.id}
                                                heure={h}
                                                onPointage={handlePointageRapide}
                                                onEdit={() => openEdit(h)}
                                                isPending={updateMutation.isPending}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Modal ─────────────────────────────── */}
            <AnimatePresence>
                {modalMode && (
                    <HeureCoursFormModal
                        mode={modalMode}
                        enseignantId={enseignantId}
                        cours={coursEdition ?? undefined}
                        onSuccess={() => { closeModal(); refetchListe(); toast.success(t('heuresCours.coursAjoute')); }}
                        onCancel={closeModal}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Ligne heure avec pointage rapide ────────────────

function HeureLigne({ heure, onPointage, onEdit, isPending }: {
    heure: HeureCours;
    onPointage: (h: HeureCours, statut: 'EFFECTUE' | 'ANNULE') => void;
    onEdit: () => void;
    isPending: boolean;
}) {
    const { t } = useTranslation('personnel');
    const cfg = STATUT_CONFIG[heure.statutEffectue] ?? STATUT_CONFIG.PLANIFIE;

    return (
        <motion.div
            layout
            className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-bordure)]/50 hover:bg-[var(--color-surface-hover)] transition-colors group"
        >
            {/* Badge statut */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${cfg.bg} ${cfg.color} shrink-0`}>
                {cfg.icon}
                <span className="hidden sm:inline">{t(cfg.label)}</span>
            </div>

            {/* Horaire */}
            <div className="text-sm font-mono text-[var(--color-text-primary)] shrink-0 w-[90px]">
                {heure.heureDebut}–{heure.heureFin}
            </div>

            {/* Matière + classe */}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {heure.matiere?.nom ?? '—'}
                </div>
                {heure.classeAnnee?.classe && (
                    <div className="text-xs text-[var(--color-text-muted)] truncate">
                        {heure.classeAnnee.classe.nom}
                    </div>
                )}
            </div>

            {/* Salle */}
            {heure.salle && (
                <div className="text-xs text-[var(--color-text-muted)] hidden md:block">
                    {heure.salle.nom}
                </div>
            )}

            {/* Remplaçant */}
            {heure.remplacant && (
                <div className="text-xs text-warning flex items-center gap-1 hidden lg:flex">
                    <ArrowRightLeft className="h-3 w-3" />
                    {heure.remplacant.prenom} {heure.remplacant.nom}
                </div>
            )}

            {/* Actions rapides */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {heure.statutEffectue === 'PLANIFIE' && (
                    <>
                        <ElisaButton
                            variant="ghost"
                            size="xs"
                            icon={<CheckCircle className="h-3.5 w-3.5" />}
                            onClick={() => onPointage(heure, 'EFFECTUE')}
                            disabled={isPending}
                            title={t('heuresCours.marquerEffectue')}
                        />
                        <ElisaButton
                            variant="ghost"
                            size="xs"
                            icon={<XCircle className="h-3.5 w-3.5" />}
                            onClick={() => onPointage(heure, 'ANNULE')}
                            disabled={isPending}
                            title={t('heuresCours.marquerAnnule')}
                        />
                    </>
                )}
                {heure.statutEffectue !== 'PLANIFIE' && (
                    <ElisaButton
                        variant="ghost"
                        size="xs"
                        icon={<RefreshCw className="h-3 w-3" />}
                        onClick={() => onPointage(heure, 'EFFECTUE')}
                        disabled={isPending}
                        title={t('heuresCours.reinitialiserStatut')}
                    />
                )}
                <ElisaButton
                    variant="ghost"
                    size="xs"
                    icon={<Edit3 className="h-3.5 w-3.5" />}
                    onClick={onEdit}
                    title={t('modifier')}
                />
            </div>
        </motion.div>
    );
}

// ─── État vide ───────────────────────────────────────

function EmptyState({ message, description }: { message: string; description: string }) {
    return (
        <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-bordure)] p-6">
            <div className="text-center py-8">
                <Clock className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3" />
                <p className="text-[var(--color-text-secondary)] mb-2">{message}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
            </div>
        </div>
    );
}
