import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    Clock, Calendar, BookOpen, CheckCircle, XCircle, AlertCircle,
    ChevronLeft, ChevronRight, RefreshCw, Plus
} from 'lucide-react';
import { useResumeMensuel, useGenererHeuresCoursFromEdt } from '../hooks/use-heure-cours';
import { HeureCoursFormModal } from './heure-cours-form-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';

interface Props {
    enseignantId: string;
}

export function TabHeureCours({ enseignantId }: Props) {
    const now = new Date();
    const [mois, setMois] = useState(now.getMonth() + 1);
    const [annee, setAnnee] = useState(now.getFullYear());
    const { t, i18n } = useTranslation('personnel');

    const [modalMode, setModalMode] = useState<'creation' | null>(null);

    const openCreate = () => { setModalMode('creation'); };
    const closeModal = () => { setModalMode(null); };

    const { data: resume, isLoading } = useResumeMensuel(enseignantId, mois, annee);

    const moisPrecedent = () => {
        if (mois === 1) { setMois(12); setAnnee(annee - 1); }
        else { setMois(mois - 1); }
    };
    const moisSuivant = () => {
        if (mois === 12) { setMois(1); setAnnee(annee + 1); }
        else { setMois(mois + 1); }
    };

    const generer = useGenererHeuresCoursFromEdt();

    const handleGenererFromEdt = () => {
        const dateDebut = `${annee}-${String(mois).padStart(2, '0')}-01`;
        const dateFin = new Date(annee, mois, 0).toISOString().split('T')[0];
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
                },
                onError: () => {
                    toast.error(t('heuresCours.erreurGeneration'));
                },
            }
        );
    };

    const nomMois = new Date(annee, mois - 1, 1).toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6">
            {/* Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ElisaButton variant="outline" size="sm" onClick={moisPrecedent}>
                        <ChevronLeft className="h-4 w-4" />
                    </ElisaButton>
                    <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {nomMois}
                    </h3>
                    <ElisaButton variant="outline" size="sm" onClick={moisSuivant}>
                        <ChevronRight className="h-4 w-4" />
                    </ElisaButton>
                </div>
                <div className="flex items-center gap-2">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={openCreate}
                    >
                        {t('heuresCours.ajouterCours')}
                    </ElisaButton>
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<RefreshCw className="h-4 w-4" />}
                        onClick={handleGenererFromEdt}
                        isLoading={generer.isPending}
                    >
                        {t('heuresCours.genererDepuisEdt')}
                    </ElisaButton>
                </div>
            </div>

            {isLoading ? (
                <CardGrid columns={{ default: 1, md: 4 }} loading skeletonCount={4} />
            ) : resume ? (
                <>
                    <CardGrid columns={{ default: 1, md: 4 }}>
                        <StatCard icon={CheckCircle} label={t('heuresCours.heuresEffectuees')} value={`${resume.heuresEffectuees}h`} tone="success" />
                        <StatCard icon={Clock} label={t('heuresCours.heuresPlanifiees')} value={`${resume.heuresPlanifiees}h`} tone="warning" />
                        <StatCard icon={XCircle} label={t('heuresCours.heuresAnnulees')} value={`${resume.heuresAnnulees}h`} tone="danger" />
                        <StatCard icon={BookOpen} label={t('heuresCours.nombreCours')} value={resume.nombreCours} tone="accent" />
                    </CardGrid>
                    {resume.detailParMatiere && resume.detailParMatiere.length > 0 ? (
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h4 className="text-md font-semibold mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> {t('heuresCours.detailMatiere')}</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('heuresCours.matiere')}</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('heuresCours.heures')}</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('heuresCours.tarifHoraire')}</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('heuresCours.montant')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {resume.detailParMatiere.map((d, idx) => (
                                            <tr key={idx} className="hover:bg-muted">
                                                <td className="py-3 px-4 font-medium">{d.matiereNom}</td>
                                                <td className="py-3 px-4 text-right">{d.heures}h</td>
                                                <td className="py-3 px-4 text-right">{d.tarifHoraire.toLocaleString(i18n.language)} F/h</td>
                                                <td className="py-3 px-4 text-right font-semibold">{d.montant.toLocaleString(i18n.language)} F</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-border bg-muted font-semibold">
                                            <td className="py-3 px-4">{t('heuresCours.total')}</td>
                                            <td className="py-3 px-4 text-right">{resume.heuresEffectuees}h</td>
                                            <td className="py-3 px-4 text-right" />
                                            <td className="py-3 px-4 text-right">{resume.detailParMatiere.reduce((s, d) => s + d.montant, 0).toLocaleString(i18n.language)} F</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-card rounded-lg border border-border p-6">
                            <div className="text-center py-8 bg-muted rounded-lg">
                                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-secondary mb-2">{t('heuresCours.aucuneHeure')}</p>
                                <p className="text-sm text-muted-foreground">{t('heuresCours.aucuneHeureDesc')}</p>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12 bg-muted rounded-lg">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-secondary">{t('heuresCours.chargementImpossible')}</p>
                </div>
            )}

            {modalMode && (
                <HeureCoursFormModal
                    mode="creation"
                    enseignantId={enseignantId}
                    onSuccess={() => { closeModal(); toast.success(t('heuresCours.coursAjoute')); }}
                    onCancel={closeModal}
                />
            )}
        </div>
    );
}
