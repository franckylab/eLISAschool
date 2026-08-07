/**
 * ==================================
 * eLISAschool - Dashboard Statistiques Emploi du Temps
 * ==================================
 * KPIs + graphiques CSS + tableau croisé volume horaire
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BarChart3, Clock, BookOpen, Users, Building2, AlertTriangle,
    CheckCircle2, TrendingUp, UserCheck,
} from 'lucide-react';
import { paletteCreneau } from '@/lib/palette-creneau';
import { useStatistiquesEDT, useCreneaux } from '../hooks/use-emploi-du-temps';
import { useTousMatieresNiveaux } from '@/features/matieres/hooks/use-matieres';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { StatCard } from '@/components/ui';

interface EDTSyntheseProps {
    classeAnneeId?: string;
    enseignantId?: string;
    /** Mode embarqué : affiche un titre de section au lieu d'un rendu standalone */
    embedded?: boolean;
}

export function EDTSynthese({ classeAnneeId, enseignantId, embedded = false }: EDTSyntheseProps) {
    const { t } = useTranslation('emplois');

    const { data: stats, isLoading, error, refetch } = useStatistiquesEDT({
        classeAnneeId,
        enseignantId,
    });

    const { data: paginated } = useCreneaux(
        classeAnneeId ? { classeAnneeId, limit: 100 } : { limit: 100 }
    );
    const creneaux = paginated?.items ?? [];

    const { data: matieresNiveaux } = useTousMatieresNiveaux();

    const volumeMap = useMemo(() => {
        const byComposite = new Map<string, number>();
        const byMatiere = new Map<string, number>();
        for (const mn of matieresNiveaux ?? []) {
            if (mn.volumeHoraire == null) continue;
            byComposite.set(`${mn.matiereId}:${mn.niveauId}`, mn.volumeHoraire);
            if (!byMatiere.has(mn.matiereId)) {
                byMatiere.set(mn.matiereId, mn.volumeHoraire);
            }
        }
        return { byComposite, byMatiere };
    }, [matieresNiveaux]);

    if (error) {
        return <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />;
    }

    if (isLoading) return <PageSkeleton showHeader={false} showStats={false} showTable />;

    if (!stats || (stats.totalCreneaux === 0 && creneaux.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-[var(--color-surface)] rounded-xl border border-[var(--color-bordure)]">
                <BarChart3 className="h-16 w-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                <h3
                    className="text-lg font-semibold text-[var(--color-text-primary)] mb-2"
                    style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
                >
                    {t('synthese.aucuneDonnee')}
                </h3>
                <p
                    className="text-[var(--color-text-secondary)] max-w-md mx-auto"
                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                >
                    {t('synthese.genererPourVoirSynthese')}
                </p>
            </div>
        );
    }

    const maxHeuresParJour = Math.max(...stats.repartitionParJour.map(j => j.totalHeures), 1);
    const maxHeuresParMatiere = Math.max(...stats.repartitionParMatiere.map(m => m.totalHeures), 1);

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]">
            {embedded && (
                <h2
                    className="font-semibold text-[var(--color-text-primary)]"
                    style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
                >
                    {t('synthese.titreComplet')}
                </h2>
            )}
            {/* ─── KPIs ─────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[var(--gap-md)]">
                <StatCard
                    icon={Clock}
                    label={t('synthese.kpiHeures')}
                    value={`${stats.totalHeures}h`}
                    tone="accent"
                    orientation="horizontal"
                    compact
                />
                <StatCard
                    icon={BarChart3}
                    label={t('synthese.kpiCreneaux')}
                    value={String(stats.totalCreneaux)}
                    tone="accent"
                    orientation="horizontal"
                    compact
                />
                <StatCard
                    icon={BookOpen}
                    label={t('synthese.kpiMatieres')}
                    value={String(stats.totalMatieres)}
                    tone="purple"
                    orientation="horizontal"
                    compact
                />
                <StatCard
                    icon={Users}
                    label={t('synthese.enseignants')}
                    value={String(stats.totalEnseignants)}
                    tone="accent"
                    orientation="horizontal"
                    compact
                />
                <StatCard
                    icon={Building2}
                    label={t('synthese.kpiSalles')}
                    value={String(stats.totalSallesOccupees)}
                    tone="accent"
                    orientation="horizontal"
                    compact
                />
                <StatCard
                    icon={TrendingUp}
                    label={t('synthese.tauxSalle')}
                    value={`${stats.tauxOccupationSalle}%`}
                    tone="purple"
                    orientation="horizontal"
                    compact
                />
            </div>

            {/* ─── Graphiques ───────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-lg)]">
                {/* Répartition par jour — bar chart CSS */}
                <div
                    className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-lg)]"
                >
                    <h3
                        className="font-semibold text-[var(--color-text-primary)] mb-[var(--gap-md)]"
                        style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.0625rem)' }}
                    >
                        {t('synthese.repartitionJour')}
                    </h3>
                    <div className="flex flex-col gap-[var(--gap-sm)]">
                        {stats.repartitionParJour.map(jour => (
                            <div key={jour.jour} className="flex items-center gap-[var(--gap-sm)]">
                                <span
                                    className="w-[clamp(48px,10vw,72px)] text-xs font-medium text-[var(--color-text-secondary)] shrink-0"
                                >
                                    {t(`jours.${jour.jour.toLowerCase()}`)}
                                </span>
                                <div className="flex-1 h-[clamp(20px,3vw,28px)] rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] overflow-hidden relative">
                                    <div
                                        className="h-full rounded-[var(--radius-sm)] bg-[var(--color-dominant-500)] transition-all duration-500"
                                        style={{ width: `${(jour.totalHeures / maxHeuresParJour) * 100}%` }}
                                    />
                                    <span
                                        className="absolute inset-0 flex items-center px-2 font-semibold text-[var(--color-text-primary)]"
                                        style={{
                                            fontSize: 'clamp(0.5625rem, 0.5rem + 0.15vw, 0.6875rem)',
                                            textShadow: '0 0 3px var(--color-surface), 0 0 6px var(--color-surface)',
                                        }}
                                    >
                                        {jour.totalHeures.toFixed(1)}h · {jour.nombreCreneaux} {t('synthese.creneauxLabel')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Répartition par matière — bar chart horizontal */}
                <div
                    className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-lg)]"
                >
                    <h3
                        className="font-semibold text-[var(--color-text-primary)] mb-[var(--gap-md)]"
                        style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.0625rem)' }}
                    >
                        {t('synthese.repartitionMatiere')}
                    </h3>
                    <div className="flex flex-col gap-[var(--gap-sm)]">
                        {stats.repartitionParMatiere.slice(0, 10).map(matiere => {
                            const pal = matiere.couleur ? paletteCreneau(matiere.couleur) : null;
                            return (
                            <div key={matiere.matiereId} className="flex items-center gap-[var(--gap-sm)]">
                                <span
                                    className="w-[clamp(60px,15vw,120px)] text-xs font-medium text-[var(--color-text-secondary)] truncate shrink-0"
                                    title={matiere.matiereNom}
                                >
                                    {matiere.matiereNom}
                                </span>
                                <div className="flex-1 h-[clamp(20px,3vw,28px)] rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] overflow-hidden relative">
                                    <div
                                        className="h-full rounded-[var(--radius-sm)] transition-all duration-500"
                                        style={{
                                            width: `${(matiere.totalHeures / maxHeuresParMatiere) * 100}%`,
                                            backgroundColor: pal?.bordure ?? (matiere.couleur || 'var(--color-accent-500)'),
                                        }}
                                    />
                                    <span
                                        className="absolute inset-0 flex items-center px-2 font-semibold"
                                        style={{
                                            fontSize: 'clamp(0.5625rem, 0.5rem + 0.15vw, 0.6875rem)',
                                            color: 'var(--color-text-primary)',
                                            textShadow: '0 0 4px var(--color-surface), 0 0 8px var(--color-surface)',
                                        }}
                                    >
                                        {matiere.totalHeures.toFixed(1)}h
                                    </span>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ─── Charge des enseignants ─────────────── */}
            {creneaux.length > 0 && (
                <ChargeEnseignant creneaux={creneaux} />
            )}

            {/* ─── Tableau croisé volume horaire ────────── */}
            {creneaux.length > 0 && (
                <TableauVolumeHoraire creneaux={creneaux} volumeMap={volumeMap} />
            )}
        </div>
    );
}

// ─── Tableau Volume Horaire ───────────────────────────

interface LigneSynthese {
    matiereId: string;
    matiereNom: string;
    matiereCouleur?: string;
    enseignantNom: string;
    heuresPlanifiees: number;
    volumeRequis: number | null;
    nombreCreneaux: number;
    respect: 'ok' | 'depassement' | 'insuffisant' | 'non-define';
}

function TableauVolumeHoraire({ creneaux, volumeMap }: {
    creneaux: Array<{
        id: string;
        heureDebut: string;
        heureFin: string;
        dureeMinutes?: number;
        affectationMatiere?: {
            matiereId: string;
            classeAnneeId: string;
            matiere?: { id: string; nom: string; couleur?: string };
            enseignant?: {
                id: string;
                matricule?: string;
                utilisateur?: {
                    id: string;
                    profil?: { id: string; nom: string; prenom: string };
                };
            };
            classeAnnee?: { classe?: { niveau?: string } };
        };
    }>;
    volumeMap: { byComposite: Map<string, number>; byMatiere: Map<string, number> };
}) {
    const { t } = useTranslation('emplois');

    const synthese = useMemo(() => {
        const parMatiere = new Map<string, LigneSynthese>();

        for (const creneau of creneaux) {
            const aff = creneau.affectationMatiere;
            if (!aff?.matiere) continue;

            const key = `${aff.matiereId}-${aff.classeAnneeId}`;
            const existing = parMatiere.get(key);

            const dureeMinutes = creneau.dureeMinutes ?? calculerMinutes(creneau.heureDebut, creneau.heureFin);
            const heures = dureeMinutes / 60;

            if (existing) {
                existing.heuresPlanifiees += heures;
                existing.nombreCreneaux += 1;
            } else {
                const niveauId = aff.classeAnnee?.classe?.niveau;
                const requis = niveauId
                    ? (volumeMap.byComposite.get(`${aff.matiereId}:${niveauId}`) ?? volumeMap.byMatiere.get(aff.matiereId) ?? null)
                    : (volumeMap.byMatiere.get(aff.matiereId) ?? null);

                parMatiere.set(key, {
                    matiereId: aff.matiereId,
                    matiereNom: aff.matiere.nom,
                    matiereCouleur: aff.matiere.couleur,
                    enseignantNom: aff.enseignant?.utilisateur?.profil
                        ? `${aff.enseignant.utilisateur.profil.prenom} ${aff.enseignant.utilisateur.profil.nom}`
                        : '—',
                    heuresPlanifiees: heures,
                    volumeRequis: requis,
                    nombreCreneaux: 1,
                    respect: 'non-define',
                });
            }
        }

        const lignes = Array.from(parMatiere.values());
        for (const l of lignes) {
            if (l.volumeRequis == null) {
                l.respect = 'non-define';
            } else if (l.heuresPlanifiees > l.volumeRequis) {
                l.respect = 'depassement';
            } else if (l.heuresPlanifiees >= l.volumeRequis * 0.9) {
                l.respect = 'ok';
            } else {
                l.respect = 'insuffisant';
            }
        }

        return lignes.sort((a, b) => a.matiereNom.localeCompare(b.matiereNom));
    }, [creneaux, volumeMap]);

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] overflow-hidden">
            <div
                className="px-[var(--space-md)] py-[var(--space-sm)] bg-[var(--color-dominant-600)] text-white font-semibold"
                style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
            >
                {t('synthese.respectVolume')}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-[var(--color-surface-alt)]">
                            <th className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-left font-medium text-[var(--color-text-secondary)]"
                                style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                                {t('synthese.matiere')}
                            </th>
                            <th className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-left font-medium text-[var(--color-text-secondary)]"
                                style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                                {t('synthese.enseignant')}
                            </th>
                            <th className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-center font-medium text-[var(--color-text-secondary)]"
                                style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                                {t('synthese.creneaux')}
                            </th>
                            <th className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-center font-medium text-[var(--color-text-secondary)]"
                                style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                                {t('synthese.heuresPlanifiees')}
                            </th>
                            <th className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-center font-medium text-[var(--color-text-secondary)]"
                                style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                                {t('synthese.volumeRequis')}
                            </th>
                            <th className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-left font-medium text-[var(--color-text-secondary)] w-48"
                                style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                                {t('synthese.respect')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {synthese.map((ligne, i) => (
                            <tr
                                key={`${ligne.matiereId}-${i}`}
                                className={i % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-surface-alt)]'}
                            >
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] font-medium text-[var(--color-text-primary)]">
                                    <div className="flex items-center gap-[var(--gap-xs)]">
                                        {ligne.matiereCouleur && (
                                            <span
                                                className="inline-block h-3 w-3 rounded-full shrink-0"
                                                style={{ backgroundColor: ligne.matiereCouleur }}
                                            />
                                        )}
                                        {ligne.matiereNom}
                                    </div>
                                </td>
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-[var(--color-text-secondary)]">
                                    {ligne.enseignantNom}
                                </td>
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-center text-[var(--color-text-primary)]">
                                    {ligne.nombreCreneaux}
                                </td>
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-center font-mono text-[var(--color-text-primary)]">
                                    {ligne.heuresPlanifiees.toFixed(1)}h
                                </td>
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)] text-center font-mono text-[var(--color-text-secondary)]">
                                    {ligne.volumeRequis !== null ? `${ligne.volumeRequis}h` : '—'}
                                </td>
                                <td className="px-[var(--padding-table-cell)] py-[var(--space-sm)]">
                                    <RespectBarre respect={ligne.respect} planifiees={ligne.heuresPlanifiees} requis={ligne.volumeRequis} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden flex flex-col gap-[var(--gap-sm)] p-[var(--space-md)]">
                {synthese.map((ligne, i) => (
                    <div
                        key={`${ligne.matiereId}-${i}`}
                        className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] p-[var(--space-md)]"
                    >
                        <div className="flex items-center gap-[var(--gap-xs)] mb-[var(--gap-xs)]">
                            {ligne.matiereCouleur && (
                                <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: ligne.matiereCouleur }} />
                            )}
                            <span className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                {ligne.matiereNom}
                            </span>
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)] mb-[var(--gap-xs)]">{ligne.enseignantNom}</div>
                        <div className="grid grid-cols-3 gap-[var(--gap-xs)] text-center mb-[var(--gap-sm)]">
                            <div>
                                <div className="text-xs text-[var(--color-text-muted)]">{t('synthese.creneaux')}</div>
                                <div className="font-semibold text-[var(--color-text-primary)]">{ligne.nombreCreneaux}</div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--color-text-muted)]">{t('synthese.heuresPlanifiees')}</div>
                                <div className="font-mono font-semibold text-[var(--color-text-primary)]">{ligne.heuresPlanifiees.toFixed(1)}h</div>
                            </div>
                            <div>
                                <div className="text-xs text-[var(--color-text-muted)]">{t('synthese.volumeRequis')}</div>
                                <div className="font-mono font-semibold text-[var(--color-text-secondary)]">
                                    {ligne.volumeRequis !== null ? `${ligne.volumeRequis}h` : '—'}
                                </div>
                            </div>
                        </div>
                        <RespectBarre respect={ligne.respect} planifiees={ligne.heuresPlanifiees} requis={ligne.volumeRequis} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Helpers ─────────────────────────────────────────

const SEUIL_ALERTE_ENSEIGNANT = 20; // heures/semaine

interface ChargeEnseignantData {
    enseignantId: string;
    enseignantNom: string;
    totalHeures: number;
    nombreCreneaux: number;
    enAlerte: boolean;
}

function ChargeEnseignant({ creneaux }: {
    creneaux: Array<{
        id: string;
        heureDebut: string;
        heureFin: string;
        dureeMinutes?: number;
        affectationMatiere?: {
            enseignantId?: string;
            enseignant?: {
                id: string;
                matricule?: string;
                utilisateur?: {
                    id: string;
                    profil?: { id: string; nom: string; prenom: string };
                };
            };
        };
    }>;
}) {
    const { t } = useTranslation('emplois');

    const charge = useMemo(() => {
        const parEnseignant = new Map<string, ChargeEnseignantData>();

        for (const creneau of creneaux) {
            const aff = creneau.affectationMatiere;
            if (!aff?.enseignant?.id) continue;

            const ensId = aff.enseignant.id;
            const dureeMinutes = creneau.dureeMinutes ?? calculerMinutes(creneau.heureDebut, creneau.heureFin);
            const heures = dureeMinutes / 60;
            const existing = parEnseignant.get(ensId);

            if (existing) {
                existing.totalHeures += heures;
                existing.nombreCreneaux += 1;
                existing.enAlerte = existing.totalHeures > SEUIL_ALERTE_ENSEIGNANT;
            } else {
                parEnseignant.set(ensId, {
                    enseignantId: ensId,
                    enseignantNom: `${aff.enseignant?.utilisateur?.profil?.prenom ?? ''} ${aff.enseignant?.utilisateur?.profil?.nom ?? ''}`.trim() || '—',
                    totalHeures: heures,
                    nombreCreneaux: 1,
                    enAlerte: heures > SEUIL_ALERTE_ENSEIGNANT,
                });
            }
        }

        return Array.from(parEnseignant.values()).sort((a, b) => b.totalHeures - a.totalHeures);
    }, [creneaux]);

    if (charge.length === 0) return null;

    const maxHeures = Math.max(...charge.map(c => c.totalHeures), 1);
    const nbEnAlerte = charge.filter(c => c.enAlerte).length;

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-lg)]">
            <div className="flex flex-wrap items-center justify-between gap-[var(--gap-sm)] mb-[var(--gap-md)]">
                <div className="flex items-center gap-[var(--gap-xs)]">
                    <UserCheck className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominant-600)]" />
                    <h3
                        className="font-semibold text-[var(--color-text-primary)]"
                        style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.0625rem)' }}
                    >
                        {t('synthese.chargeEnseignant')}
                    </h3>
                </div>
                <div className="flex items-center gap-[var(--gap-sm)]">
                    {nbEnAlerte > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
                            <AlertTriangle className="h-3 w-3" />
                            {nbEnAlerte} {t('synthese.dansAlerte')}
                        </span>
                    )}
                    <span
                        className="text-xs text-[var(--color-text-muted)]"
                    >
                        {t('synthese.seuilAlerte', { max: SEUIL_ALERTE_ENSEIGNANT })}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-[var(--gap-sm)]">
                {charge.map(ens => {
                    const pct = (ens.totalHeures / maxHeures) * 100;
                    const estEnAlerte = ens.enAlerte;
                    return (
                        <div key={ens.enseignantId} className="flex items-center gap-[var(--gap-sm)]">
                            <span
                                className="w-[clamp(80px,20vw,160px)] text-xs font-medium text-[var(--color-text-secondary)] truncate shrink-0"
                                title={ens.enseignantNom}
                            >
                                {ens.enseignantNom}
                            </span>
                            <div className="flex-1 h-[clamp(20px,3vw,28px)] rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] overflow-hidden relative">
                                <div
                                    className={`h-full rounded-[var(--radius-sm)] transition-all duration-500 ${
                                        estEnAlerte ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-accent-500)]'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                />
                                <span
                                    className="absolute inset-0 flex items-center justify-between px-2 font-semibold text-[var(--color-text-primary)]"
                                    style={{
                                        fontSize: 'clamp(0.5625rem, 0.5rem + 0.15vw, 0.6875rem)',
                                        textShadow: '0 0 3px var(--color-surface), 0 0 6px var(--color-surface)',
                                    }}
                                >
                                    <span>{ens.totalHeures.toFixed(1)}h · {ens.nombreCreneaux} {t('synthese.creneaux')}</span>
                                    {estEnAlerte && (
                                        <AlertTriangle className="h-3 w-3 text-[var(--color-danger)]" />
                                    )}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function calculerMinutes(heureDebut: string, heureFin: string): number {
    const [h1, m1] = heureDebut.split(':').map(Number);
    const [h2, m2] = heureFin.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function RespectBarre({ respect, planifiees, requis }: {
    respect: LigneSynthese['respect'];
    planifiees: number;
    requis: number | null;
}) {
    const { t } = useTranslation('emplois');

    if (respect === 'non-define' || requis === null) {
        return (
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <span>—</span>
            </div>
        );
    }

    const pct = Math.min((planifiees / requis) * 100, 100);
    const isOk = pct >= 90 && pct <= 100;
    const isDepassement = planifiees > requis;

    const colorClass = isOk ? 'bg-[var(--color-success)]' : isDepassement ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-warning)]';
    const label = isOk ? t('synthese.ok') : isDepassement ? t('synthese.depassement') : t('synthese.insuffisant');

    return (
        <div className="flex items-center gap-[var(--gap-xs)]">
            <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${colorClass}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-[10px] font-medium shrink-0 flex items-center gap-0.5">
                {isDepassement ? (
                    <AlertTriangle className="h-3 w-3 text-[var(--color-danger)]" />
                ) : isOk ? (
                    <CheckCircle2 className="h-3 w-3 text-[var(--color-success)]" />
                ) : (
                    <span className="text-[var(--color-warning)]">{pct.toFixed(0)}%</span>
                )}
                <span className="hidden lg:inline text-[var(--color-text-secondary)]">{label}</span>
            </span>
        </div>
    );
}
