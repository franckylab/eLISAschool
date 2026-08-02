import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import { Route, Briefcase, BookOpen, Star, Ban, TrendingUp, FileText, Calendar } from 'lucide-react';
import { useEnseignantParcours } from '../../hooks/use-personnel-detail';
import { SchoolLoading } from '@/components/feedback';
import { formatDate } from '@/lib/date-utils';
import { formatMontant } from '@/lib/format-utils';

interface TimelineEvent {
    date: string;
    type: string;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
}

export function OngletParcours({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const { t } = useTranslation('personnel');
    const { data, isLoading } = useEnseignantParcours(enseignantId);
    const parcours = isActive ? data : undefined;

    const timeline = useMemo(() => {
        if (!parcours) return [];
        const events: TimelineEvent[] = [];

        (parcours.contrats || []).forEach((c: { dateDebut: string; typeContrat?: string; salaireBase?: number }) => {
            events.push({
                date: c.dateDebut,
                type: 'contrat',
                title: `${t('parcours.contrats')} ${c.typeContrat || ''}`,
                description: `${t('detail.colSalaire')}: ${formatMontant(c.salaireBase)}`,
                icon: FileText,
                color: 'primary',
            });
        });

        (parcours.affectations || []).forEach((a: { dateDebut: string; matiere?: { nom?: string }; classe?: { nom?: string } }) => {
            events.push({
                date: a.dateDebut,
                type: 'affectation',
                title: `${t('parcours.affectations')}: ${a.matiere?.nom || '—'}`,
                description: a.classe?.nom ? `${t('affectations.colClasse')}: ${a.classe.nom}` : '',
                icon: BookOpen,
                color: 'success',
            });
        });

        (parcours.evaluations || []).forEach((e: { dateEvaluation: string; note?: number; categorie?: string }) => {
            events.push({
                date: e.dateEvaluation,
                type: 'evaluation',
                title: `${t('parcours.evaluations')}: ${e.note?.toFixed(1) || '—'}/20`,
                description: e.categorie || '',
                icon: Star,
                color: 'accent',
            });
        });

        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [parcours, t]);

    if (isLoading && isActive) {
        return <SchoolLoading variant="compact" message={t('parcours.chargement')} />;
    }

    if (!parcours) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
                <Route className="mb-3 h-12 w-12 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">{t('parcours.nonDisponible')}</p>
                <p className="mt-1 text-sm text-muted-foreground/80">{t('parcours.nonDisponibleDesc')}</p>
            </div>
        );
    }

    const anneesService = parcours.anciennete?.annees ?? 0;
    const nbContrats = parcours.contrats?.length ?? 0;
    const nbAffectations = parcours.affectations?.length ?? 0;
    const nbEvaluations = parcours.evaluations?.length ?? 0;
    const nbAbsences = parcours.statistiquesAbsences?.totalAbsences ?? 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <ParcoursCard icon={Briefcase} label={t('parcours.anneesService')} value={`${anneesService} an${anneesService > 1 ? 's' : ''}`} color="primary" />
                <ParcoursCard icon={FileText} label={t('parcours.contrats')} value={nbContrats} color="accent" />
                <ParcoursCard icon={BookOpen} label={t('parcours.affectations')} value={nbAffectations} color="success" />
                <ParcoursCard icon={Star} label={t('parcours.evaluations')} value={nbEvaluations} color="warning" />
                <ParcoursCard icon={Ban} label={t('parcours.absences')} value={nbAbsences} color="destructive" />
            </div>

            {timeline.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                        <Calendar className="h-5 w-5 text-primary" />
                        {t('parcours.chronologie')}
                    </h3>
                    <div className="relative space-y-0">
                        {timeline.slice(0, 20).map((event, i) => {
                            const Icon = event.icon;
                            const colorMap: Record<string, string> = {
                                primary: 'border-primary/40 bg-primary/10 text-primary',
                                success: 'border-success/40 bg-success/10 text-success',
                                accent: 'border-accent/40 bg-accent/10 text-accent',
                                warning: 'border-warning/40 bg-warning/10 text-warning',
                                destructive: 'border-destructive/40 bg-destructive/10 text-destructive',
                            };
                            return (
                                <div key={i} className="relative flex gap-4 pb-6 pl-8 last:pb-0">
                                    {i < timeline.length - 1 && (
                                        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />
                                    )}
                                    <div className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 ${colorMap[event.color] || colorMap.primary}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 rounded-lg border border-border bg-muted p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium text-foreground">{event.title}</p>
                                            <span className="shrink-0 text-xs text-muted-foreground">{formatDate(event.date, 'MMM yyyy')}</span>
                                        </div>
                                        {event.description && (
                                            <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {timeline.length > 20 && (
                            <p className="pt-2 text-center text-xs text-muted-foreground">
                                {t('parcours.evenementsSupplementaires', { count: timeline.length - 20 })}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {parcours.evolutionSalariale && parcours.evolutionSalariale.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                        <TrendingUp className="h-5 w-5 text-success" />
                        {t('parcours.evolutionSalariale')}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('parcours.colDate')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('parcours.colSalaire')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {parcours.evolutionSalariale.map((s, i: number) => (
                                    <tr key={i} className="hover:bg-muted/80">
                                        <td className="px-4 py-3 text-secondary">
                                            {s.mois && s.annee ? formatDate(`${s.annee}-${String(s.mois).padStart(2, '0')}-01`) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-foreground">
                                            {formatMontant(s.salaireNet)}
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

function ParcoursCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string | number; color: string }) {
    const colors: Record<string, string> = {
        primary: 'border-primary/20 bg-primary/5 text-primary',
        accent: 'border-accent/20 bg-accent/5 text-accent',
        success: 'border-success/20 bg-success/5 text-success',
        warning: 'border-warning/20 bg-warning/5 text-warning',
        destructive: 'border-destructive/20 bg-destructive/5 text-destructive',
    };
    return (
        <div className={`rounded-xl border p-4 ${colors[color] || colors.primary}`}>
            <Icon className="mb-2 h-5 w-5 opacity-70" />
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="mt-1 text-xl font-bold">{value}</p>
        </div>
    );
}
