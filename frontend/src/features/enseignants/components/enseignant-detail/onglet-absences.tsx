import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEnseignantAbsences, useEnseignantAssiduite } from '../../hooks/use-enseignants';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import { MiniPieChart } from '@/components/charts/MiniPieChart';
import { LoadingState } from '@/components/feedback';
import type { AbsenceEnseignant } from '../../types/enseignant.types';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR');
}

export function OngletAbsences({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const { t } = useTranslation('personnel');
    const absences = useEnseignantAbsences(enseignantId);
    const assiduite = useEnseignantAssiduite(enseignantId);

    const items = isActive ? (absences.data?.items ?? []) : [];
    const assiduiteData = isActive ? assiduite.data : undefined;
    const total = absences.data?.total ?? 0;

    const absencesParMois = useMemo(() => {
        const grouped: Record<string, number> = {};
        items.forEach((a: AbsenceEnseignant) => {
            const d = new Date(a.date);
            const key = MOIS[d.getMonth()];
            grouped[key] = (grouped[key] || 0) + 1;
        });
        return Object.entries(grouped).map(([label, value]) => ({ label, value }));
    }, [items]);

    const justifiees = items.filter((a: AbsenceEnseignant) => a.statutJustification === 'JUSTIFIE').length;
    const nonJustifiees = items.length - justifiees;

    const pieData = [
        { label: t('absences.justifiees'), value: justifiees, color: 'var(--color-success)' },
        { label: t('absences.nonJustifiees'), value: nonJustifiees, color: 'var(--color-destructive)' },
    ];

    if ((absences.isLoading || assiduite.isLoading) && isActive) {
        return <div className="py-12"><LoadingState message={t('absences.chargement')} /></div>;
    }

    return (
        <div className="space-y-5">
            {assiduiteData ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <AssiduiteCard label={t('absences.totalAbsences')} value={assiduiteData.totalAbsences} color="destructive" />
                    <AssiduiteCard label={t('absences.justifiees')} value={assiduiteData.justifiees} color="success" />
                    <AssiduiteCard label={t('absences.nonJustifiees')} value={assiduiteData.nonJustifiees} color="warning" />
                    <AssiduiteCard label={t('absences.tauxAbsentéisme')} value={`${(assiduiteData.tauxAbsenteisme * 100).toFixed(1)}%`} color="accent" />
                </div>
            ) : items.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                    <MiniCard label={t('affectations.total')} value={items.length} color="destructive" />
                    <MiniCard label={t('absences.justifiees')} value={justifiees} color="success" />
                    <MiniCard label={t('absences.nonJustifiees')} value={nonJustifiees} color="warning" />
                </div>
            ) : null}

            {items.length > 0 && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {absencesParMois.length > 1 && (
                        <div className="rounded-xl border border-border bg-card p-5">
                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                <TrendingUp className="h-4 w-4 text-warning" />
                                {t('absences.tendanceAbsences')}
                            </h4>
                            <MiniBarChart data={absencesParMois} height={160} />
                        </div>
                    )}
                    <div className="rounded-xl border border-border bg-card p-5">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            {t('absences.repartitionJustifie')}
                        </h4>
                        <div className="flex justify-center">
                            <MiniPieChart data={pieData} size={140} innerRadius={30} showLegend />
                        </div>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-success/30 bg-success/5 py-16">
                    <CheckCircle className="mb-3 h-12 w-12 text-success/60" />
                    <p className="font-medium text-success">{t('absences.aucuneAbsence')}</p>
                    <p className="mt-1 text-sm text-success/80">{t('absences.excellentPresence')}</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <span className="text-sm font-medium text-foreground">{t('absences.listeAbsences')} ({total})</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('absences.colDate')}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('absences.colType')}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('absences.colMotif')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('absences.colJustifiee')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('absences.colHoraire')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.map((a: AbsenceEnseignant) => (
                                    <tr key={a.id} className="hover:bg-muted/80">
                                        <td className="px-4 py-3 text-secondary">{formatDate(a.date)}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-secondary">{a.type}</span>
                                        </td>
                                        <td className="px-4 py-3">{a.motif || '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            {a.statutJustification === 'JUSTIFIE' || a.statutJustification === 'EN_COURS' ? (
                                                <CheckCircle className="mx-auto h-4 w-4 text-success" />
                                            ) : (
                                                <XCircle className="mx-auto h-4 w-4 text-destructive" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                                            {a.heureDebut ? `${a.heureDebut.slice(0, 5)}-${a.heureFin?.slice(0, 5) || ''}` : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function AssiduiteCard({ label, value, color }: { label: string; value: number | string; color: string }) {
    const colors: Record<string, string> = {
        destructive: 'from-destructive/5 to-destructive/10 border-destructive/20 text-destructive',
        success: 'from-success/5 to-success/10 border-success/20 text-success',
        warning: 'from-warning/5 to-warning/10 border-warning/20 text-warning',
        accent: 'from-primary/5 to-primary/10 border-primary/20 text-primary',
    };
    return (
        <div className={`rounded-xl border bg-gradient-to-br p-4 ${colors[color] || colors.accent}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}

function MiniCard({ label, value, color }: { label: string; value: number | string; color: string }) {
    const colors: Record<string, string> = {
        destructive: 'bg-destructive/5 text-destructive border-destructive/20',
        success: 'bg-success/5 text-success border-success/20',
        warning: 'bg-warning/5 text-warning border-warning/20',
        accent: 'bg-primary/5 text-primary border-primary/20',
    };
    return (
        <div className={`rounded-xl border p-4 ${colors[color] || colors.accent}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}
