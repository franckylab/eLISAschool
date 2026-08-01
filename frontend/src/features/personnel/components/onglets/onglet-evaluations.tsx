import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, TrendingUp } from 'lucide-react';
import { useEnseignantEvaluations, useEnseignantMoyenneEvaluations } from '../../hooks/use-personnel-detail';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import { MiniPieChart } from '@/components/charts/MiniPieChart';
import { InlineSpinner } from '@/components/feedback';
import { formatDate } from '@/lib/date-utils';
import type { EvaluationEnseignant } from '../../types/personnel.types';

const CATEGORIE_COLORS: Record<string, string> = {
    Pédagogie: 'var(--color-primary)', Discipline: 'var(--color-success)', 'Relationnel': 'var(--color-warning)',
    'Savoir-être': 'var(--color-accent)', Technique: 'var(--color-secondary)',
};

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export function OngletEvaluations({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const { t } = useTranslation('personnel');
    const { data: evaluations, isLoading: evLoading } = useEnseignantEvaluations(enseignantId);
    const { data: moyenne, isLoading: moyLoading } = useEnseignantMoyenneEvaluations(enseignantId);
    const evals = isActive ? (evaluations ?? []) : [];
    const moy = isActive ? moyenne : undefined;

    const evolutionData = useMemo(() => {
        const grouped: Record<string, { total: number; count: number }> = {};
        evals.forEach((e: EvaluationEnseignant) => {
            const d = new Date(e.dateEvaluation);
            const key = `${MOIS[d.getMonth()]} ${d.getFullYear()}`;
            if (!grouped[key]) grouped[key] = { total: 0, count: 0 };
            grouped[key].total += e.note;
            grouped[key].count += 1;
        });
        return Object.entries(grouped).map(([label, v]) => ({
            label, value: Math.round((v.total / v.count) * 10) / 10,
        }));
    }, [evals]);

    const categorieData = useMemo(() => {
        const grouped: Record<string, number> = {};
        evals.forEach((e: EvaluationEnseignant) => {
            const cat = e.categorie || 'Autre';
            grouped[cat] = (grouped[cat] || 0) + 1;
        });
        return Object.entries(grouped).map(([label, value]) => ({
            label, value, color: CATEGORIE_COLORS[label] || 'var(--color-muted-foreground)',
        }));
    }, [evals]);

    if ((evLoading || moyLoading) && isActive) {
        return <div className="py-12 flex justify-center"><InlineSpinner label={t('evaluations.chargement')} /></div>;
    }

    return (
        <div className="space-y-5">
            {moy && moy.total > 0 && (
                <div className="rounded-xl border border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 p-5">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-accent/20 p-3">
                            <Star className="h-8 w-8 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-accent">{t('evaluations.moyenneEvaluations')}</p>
                            <p className="text-3xl font-bold text-accent">
                                {moy.moyenne.toFixed(1)} <span className="text-base font-normal">/ 20</span>
                            </p>
                            <p className="text-xs text-accent/80">{t('evaluations.evaluationCount', { count: moy.total })}</p>
                        </div>
                    </div>
                </div>
            )}

            {evals.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
                    <Star className="mb-3 h-12 w-12 text-muted-foreground/40" />
                    <p className="font-medium text-muted-foreground">{t('evaluations.aucuneEvaluation')}</p>
                    <p className="mt-1 text-sm text-muted-foreground/80">{t('evaluations.aucuneEvaluationDesc')}</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {evolutionData.length > 1 && (
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    {t('evaluations.evolutionNote')}
                                </h4>
                                <MiniBarChart data={evolutionData} height={180} />
                            </div>
                        )}
                        {categorieData.length > 0 && (
                            <div className="rounded-xl border border-border bg-card p-5">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Star className="h-4 w-4 text-accent" />
                                    {t('evaluations.repartitionCategorie')}
                                </h4>
                                <div className="flex justify-center">
                                    <MiniPieChart data={categorieData} size={160} showLegend />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('evaluations.colDate')}</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('evaluations.colCategorie')}</th>
                                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('evaluations.colNote')}</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('evaluations.colEvaluateur')}</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('evaluations.colCommentaire')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {evals.map((e: EvaluationEnseignant) => (
                                        <tr key={e.id} className="hover:bg-muted/80">
                                            <td className="px-4 py-3 text-muted-foreground">{formatDate(e.dateEvaluation)}</td>
                                            <td className="px-4 py-3">
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                    {e.categorie}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-lg font-semibold ${
                                                    e.note >= 4 ? 'text-success' : e.note >= 3 ? 'text-warning' : 'text-destructive'
                                                }`}>
                                                    {e.note.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{e.evaluateur ? `${e.evaluateur.prenom} ${e.evaluateur.nom}` : '-'}</td>
                                            <td className="max-w-xs truncate px-4 py-3 text-sm text-muted-foreground">{e.commentaire || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
