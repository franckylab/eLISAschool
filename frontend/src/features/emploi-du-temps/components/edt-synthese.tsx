/**
 * ==================================
 * eLISAschool - Vue Synthèse Emploi du Temps
 * ==================================
 * Tableau croisé : Classes × Matières × Heures planifiées / Volume requis
 * Indicateur respect volume horaire (barre de progression)
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCreneaux } from '../hooks/use-emploi-du-temps';
import { PageSkeleton } from '@/components/ui/Skeleton';

interface EDTSyntheseProps {
    classeAnneeId?: string;
}

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

export function EDTSynthese({ classeAnneeId }: EDTSyntheseProps) {
    const { t } = useTranslation('emplois');

    const { data: paginated, isLoading } = useCreneaux(
        classeAnneeId ? { classeAnneeId, limit: 500 } : { limit: 500 }
    );
    const creneaux = paginated?.data?.items ?? [];

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
                parMatiere.set(key, {
                    matiereId: aff.matiereId,
                    matiereNom: aff.matiere.nom,
                    matiereCouleur: aff.matiere.couleur,
                    enseignantNom: aff.enseignant
                        ? `${aff.enseignant.prenom} ${aff.enseignant.nom}`
                        : '—',
                    heuresPlanifiees: heures,
                    volumeRequis: null,
                    nombreCreneaux: 1,
                    respect: 'non-define',
                });
            }
        }

        return Array.from(parMatiere.values()).sort((a, b) =>
            a.matiereNom.localeCompare(b.matiereNom)
        );
    }, [creneaux]);

    const totalHeures = synthese.reduce((s, l) => s + l.heuresPlanifiees, 0);
    const totalCreneaux = synthese.reduce((s, l) => s + l.nombreCreneaux, 0);

    if (isLoading) return <PageSkeleton showHeader={false} showStats={false} showTable />;

    if (creneaux.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-[var(--color-surface)] rounded-lg border border-[var(--color-bordure)]">
                <BarChart3 className="h-16 w-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--color-texte)] mb-2">{t('synthese.aucuneDonnee')}</h3>
                <p className="text-[var(--color-texte-secondaire)] max-w-md mx-auto">{t('synthese.genererPourVoirSynthese')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats globales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label={t('synthese.totalHeures')} value={`${totalHeures.toFixed(1)}h`} icon={<BarChart3 className="h-5 w-5" />} />
                <StatCard label={t('synthese.totalCreneaux')} value={String(totalCreneaux)} icon={<BarChart3 className="h-5 w-5" />} />
                <StatCard
                    label={t('synthese.matieres')}
                    value={String(synthese.length)}
                    icon={<BarChart3 className="h-5 w-5" />}
                />
            </div>

            {/* Tableau croisé */}
            <div className="rounded-xl border border-[var(--color-bordure)] overflow-hidden">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-[var(--color-dominant-600)] text-white">
                            <th className="px-4 py-3 text-left font-semibold">{t('synthese.matiere')}</th>
                            <th className="px-4 py-3 text-left font-semibold">{t('synthese.enseignant')}</th>
                            <th className="px-4 py-3 text-center font-semibold">{t('synthese.creneaux')}</th>
                            <th className="px-4 py-3 text-center font-semibold">{t('synthese.heuresPlanifiees')}</th>
                            <th className="px-4 py-3 text-center font-semibold">{t('synthese.volumeRequis')}</th>
                            <th className="px-4 py-3 text-left font-semibold w-48">{t('synthese.respect')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {synthese.map((ligne, i) => (
                            <tr
                                key={`${ligne.matiereId}-${i}`}
                                className={i % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-surface-alt)]'}
                            >
                                <td className="px-4 py-3 font-medium">
                                    <div className="flex items-center gap-2">
                                        {ligne.matiereCouleur && (
                                            <span
                                                className="inline-block h-3 w-3 rounded-full shrink-0"
                                                style={{ backgroundColor: ligne.matiereCouleur }}
                                            />
                                        )}
                                        {ligne.matiereNom}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-[var(--color-texte-secondaire)]">{ligne.enseignantNom}</td>
                                <td className="px-4 py-3 text-center">{ligne.nombreCreneaux}</td>
                                <td className="px-4 py-3 text-center font-mono">{ligne.heuresPlanifiees.toFixed(1)}h</td>
                                <td className="px-4 py-3 text-center font-mono">
                                    {ligne.volumeRequis !== null ? `${ligne.volumeRequis}h` : '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <RespectBarre respect={ligne.respect} planifiees={ligne.heuresPlanifiees} requis={ligne.volumeRequis} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Helpers ─────────────────────────────────────────

function calculerMinutes(heureDebut: string, heureFin: string): number {
    const [h1, m1] = heureDebut.split(':').map(Number);
    const [h2, m2] = heureFin.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]">
                {icon}
            </div>
            <div>
                <div className="text-2xl font-bold text-[var(--color-texte)]">{value}</div>
                <div className="text-xs text-[var(--color-texte-secondaire)]">{label}</div>
            </div>
        </div>
    );
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

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isOk ? 'bg-success' : isDepassement ? 'bg-destructive' : 'bg-warning'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs font-mono shrink-0">
                {isDepassement ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                ) : isOk ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                    <span className="text-warning">{pct.toFixed(0)}%</span>
                )}
            </span>
        </div>
    );
}
