import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useEnseignantEdt } from '../../hooks/use-enseignants';
import { LoadingState } from '@/components/feedback';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { EdtCreneau } from '../../types/enseignant.types';

const JOURS_ORDER = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const JOURS_I18N: Record<string, string> = {
    LUNDI: 'jours.lundi', MARDI: 'jours.mardi', MERCREDI: 'jours.mercredi',
    JEUDI: 'jours.jeudi', VENDREDI: 'jours.vendredi', SAMEDI: 'jours.samedi',
};

interface Props {
    enseignantId: string;
    isActive: boolean;
}

export function OngletMatieresPlanning({ enseignantId, isActive }: Props) {
    const { t } = useTranslation('personnel');
    const now = new Date();
    const semaine = now.toISOString().split('T')[0];
    const { data, isLoading, refetch } = useEnseignantEdt(enseignantId, semaine);

    const jours = useMemo(() => {
        if (!data?.jours) return [];
        return JOURS_ORDER
            .filter(j => data.jours[j] && data.jours[j].length > 0)
            .map(j => ({
                id: j,
                nom: t(JOURS_I18N[j] || j),
                creneaux: (data.jours[j] || []).sort(
                    (a, b) => (a.heureDebut || '').localeCompare(b.heureDebut || '')
                ),
            }));
    }, [data, t]);

    const totalCreneaux = Object.values(data?.jours ?? {}).flat().length;

    if (isLoading && isActive) {
        return <div className="py-12"><LoadingState message={t('affectations.chargementPlanning', 'Chargement du planning...')} /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{t('affectations.planningHebdo', 'Planning hebdomadaire')}</span>
                    <span className="text-xs text-muted-foreground">
                        {t('affectations.semaineDu', 'Semaine du')} {new Date(semaine).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-xs text-muted-foreground">· {totalCreneaux} {totalCreneaux > 1 ? t('affectations.creneaux', 'créneaux') : t('affectations.creneauSing', 'créneau')}</span>
                </div>
                <ElisaButton variant="ghost" size="sm" onClick={() => refetch()}>
                    {t('affectations.actualiser', 'Actualiser')}
                </ElisaButton>
            </div>

            {jours.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
                    <Calendar className="mb-3 h-12 w-12 text-muted-foreground/50" />
                    <p className="font-medium text-secondary">{t('affectations.aucunCoursSemaine', 'Aucun cours cette semaine')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('affectations.planningVide', 'Le planning hebdomadaire est vide.')}</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="grid auto-cols-fr grid-flow-col border-b border-border">
                        {jours.map(j => (
                            <div
                                key={j.id}
                                className="border-r border-border bg-muted/30 p-3 text-center last:border-r-0"
                            >
                                <p className="text-sm font-semibold text-foreground">{j.nom}</p>
                                <p className="text-xs text-muted-foreground">{j.creneaux.length} {t('affectations.cours', 'cours')}</p>
                            </div>
                        ))}
                        <div className="border-r border-border bg-muted/30 p-3 text-center last:border-r-0">
                            <p className="text-sm font-semibold text-foreground">{t('affectations.resume', 'Résumé')}</p>
                            <p className="text-xs text-muted-foreground">{totalCreneaux} {t('affectations.total', 'total')}</p>
                        </div>
                    </div>

                    {jours.map(j => (
                        <div key={j.id} className="border-b border-border last:border-b-0">
                            <div className="space-y-1 p-3">
                                {j.creneaux.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-muted-foreground">—</p>
                                ) : (
                                    j.creneaux.map(c => (
                                        <CreneauCard key={c.id} creneau={c} />
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function CreneauCard({ creneau }: { creneau: EdtCreneau }) {
    return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                    />
                    <span className="text-sm font-medium text-foreground">
                        {creneau.matiere?.nom || creneau.matiereId.slice(0, 8)}
                    </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {creneau.heureDebut?.slice(0, 5)} - {creneau.heureFin?.slice(0, 5)}
                </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {creneau.classe?.nom && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-secondary">
                        {creneau.classe.nom}
                    </span>
                )}
                {creneau.salle?.nom && (
                    <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {creneau.salle.nom}
                    </span>
                )}
            </div>
        </div>
    );
}
