import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    Clock, Calendar, BookOpen, CheckCircle, XCircle, AlertCircle,
    ChevronLeft, ChevronRight, List, RefreshCw, Plus, Edit3
} from 'lucide-react';
import { useResumeMensuel, useEdtEnseignant, useGenererHeuresCoursFromEdt } from '../hooks/use-heure-cours';
import type { HeureCours } from '../hooks/use-heure-cours';
import { HeureCoursFormModal } from './heure-cours-form-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const JOURS_LABEL: Record<string, string> = {
    LUNDI: 'Lun', MARDI: 'Mar', MERCREDI: 'Mer', JEUDI: 'Jeu', VENDREDI: 'Ven', SAMEDI: 'Sam',
};

const getLundi = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

interface Props {
    enseignantId: string;
}

type Vue = 'mensuel' | 'hebdo';

export function TabHeureCours({ enseignantId }: Props) {
    const now = new Date();
    const [vue, setVue] = useState<Vue>('mensuel');
    const [mois, setMois] = useState(now.getMonth() + 1);
    const [annee, setAnnee] = useState(now.getFullYear());
    const [semaineRef, setSemaineRef] = useState(() => getLundi(now).toISOString().split('T')[0]);
    const { t } = useTranslation('personnel');

    const [modalMode, setModalMode] = useState<'creation' | 'edition' | null>(null);
    const [selectedCours, setSelectedCours] = useState<HeureCours | undefined>(undefined);

    const openCreate = () => { setModalMode('creation'); setSelectedCours(undefined); };
    const openEdit = (cours: HeureCours) => { setModalMode('edition'); setSelectedCours(cours); };
    const closeModal = () => { setModalMode(null); setSelectedCours(undefined); };

    const { data: resume, isLoading } = useResumeMensuel(enseignantId, mois, annee);
    const { data: edt, isLoading: loadingEdt } = useEdtEnseignant(enseignantId, vue === 'hebdo' ? semaineRef : undefined);

    const moisPrecedent = () => {
        if (mois === 1) { setMois(12); setAnnee(annee - 1); }
        else { setMois(mois - 1); }
    };
    const moisSuivant = () => {
        if (mois === 12) { setMois(1); setAnnee(annee + 1); }
        else { setMois(mois + 1); }
    };

    const semainePrecedente = () => {
        const d = new Date(semaineRef);
        d.setDate(d.getDate() - 7);
        setSemaineRef(d.toISOString().split('T')[0]);
    };
    const semaineSuivante = () => {
        const d = new Date(semaineRef);
        d.setDate(d.getDate() + 7);
        setSemaineRef(d.toISOString().split('T')[0]);
    };

    const generer = useGenererHeuresCoursFromEdt();

    const handleGenererFromEdt = () => {
        const dateDebut = `${annee}-${String(mois).padStart(2, '0')}-01`;
        const dateFin = new Date(annee, mois, 0).toISOString().split('T')[0];
        generer.mutate(
            { enseignantId, dateDebut, dateFin },
            {
                onSuccess: (result: { created: number; skipped: number }) => {
                    if (result.created === 0 && result.skipped === 0) {
                        toast.info('Aucun créneau EDT trouvé pour cet enseignant');
                    } else {
                        toast.success(`${result.created} cours créés, ${result.skipped} déjà existants`);
                    }
                },
                onError: () => {
                    toast.error('Erreur lors de la génération depuis l\'EDT');
                },
            }
        );
    };

    const nomMois = new Date(annee, mois - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const LundiDate = new Date(semaineRef);
    const semaineLabel = `${t('heuresCours.semaineDu')} ${LundiDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;

    return (
        <div className="space-y-6">
            {/* Toggle Mensuel / Hebdo */}
            <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                <button onClick={() => setVue('mensuel')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${vue === 'mensuel' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    <Calendar className="h-4 w-4" /> {t('heuresCours.mensuel')}
                </button>
                <button onClick={() => setVue('hebdo')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${vue === 'hebdo' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    <List className="h-4 w-4" /> {t('heuresCours.hebdomadaire')}
                </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ElisaButton variant="outline" size="sm" onClick={vue === 'mensuel' ? moisPrecedent : semainePrecedente}>
                        <ChevronLeft className="h-4 w-4" />
                    </ElisaButton>
                    <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        {vue === 'mensuel' ? nomMois : semaineLabel}
                    </h3>
                    <ElisaButton variant="outline" size="sm" onClick={vue === 'mensuel' ? moisSuivant : semaineSuivante}>
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
                        Ajouter
                    </ElisaButton>
                    {vue === 'mensuel' && (
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<RefreshCw className="h-4 w-4" />}
                            onClick={handleGenererFromEdt}
                            isLoading={generer.isPending}
                        >
                            Générer depuis EDT
                        </ElisaButton>
                    )}
                </div>
            </div>

            {vue === 'mensuel' && (isLoading ? (
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
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h4 className="text-md font-semibold mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-blue-600" /> {t('heuresCours.detailMatiere')}</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('heuresCours.matiere')}</th>
                                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('heuresCours.heures')}</th>
                                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('heuresCours.tarifHoraire')}</th>
                                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('heuresCours.montant')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {resume.detailParMatiere.map((d, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="py-3 px-4 font-medium">{d.matiereNom}</td>
                                                <td className="py-3 px-4 text-right">{d.heures}h</td>
                                                <td className="py-3 px-4 text-right">{d.tarifHoraire.toLocaleString('fr-FR')} F/h</td>
                                                <td className="py-3 px-4 text-right font-semibold">{d.montant.toLocaleString('fr-FR')} F</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                                            <td className="py-3 px-4">{t('heuresCours.total')}</td>
                                            <td className="py-3 px-4 text-right">{resume.heuresEffectuees}h</td>
                                            <td className="py-3 px-4 text-right" />
                                            <td className="py-3 px-4 text-right">{resume.detailParMatiere.reduce((s, d) => s + d.montant, 0).toLocaleString('fr-FR')} F</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                                <p className="text-gray-600 dark:text-gray-300 mb-2">{t('heuresCours.aucuneHeure')}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('heuresCours.aucuneHeureDesc')}</p>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-300">{t('heuresCours.chargementImpossible')}</p>
                </div>
            ))}

            {vue === 'hebdo' && (loadingEdt ? (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    {JOURS.map((jour) => (
                        <div key={jour} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 min-h-[200px] animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-3" />
                            <div className="space-y-2">
                                <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded" />
                                <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : edt ? (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    {JOURS.map((jour) => {
                        const coursDuJour = edt.jours?.[jour] || [];
                        return (
                            <div key={jour} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 min-h-[200px]">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">{JOURS_LABEL[jour]}</h4>
                                {coursDuJour.length === 0 ? (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">—</p>
                                ) : (
                                    <div className="space-y-2">
                                         {coursDuJour.map((c: any) => (
                                            <div key={c.id} className="text-xs p-2 rounded-md border bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors" onClick={() => openEdit(c)}>
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-gray-800 dark:text-gray-200">{c.heureDebut?.slice(0, 5)}–{c.heureFin?.slice(0, 5)}</p>
                                                    <Edit3 className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-300 truncate">{c.matiere?.nom || '—'}</p>
                                                <p className="text-gray-400 dark:text-gray-500 truncate">{c.classe?.nom || ''}</p>
                                                <Badge variant={c.statutEffectue === 'EFFECTUE' ? 'success' : c.statutEffectue === 'ANNULE' ? 'danger' : 'warning'} className="mt-1 text-[10px] px-1.5 py-0">
                                                    {t(`heuresCours.${c.statutEffectue?.toLowerCase()}`) || c.statutEffectue}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-300">{t('heuresCours.edtImpossible')}</p>
                </div>
            ))}

            {modalMode && (
                <HeureCoursFormModal
                    mode={modalMode}
                    enseignantId={enseignantId}
                    cours={selectedCours}
                    onSuccess={() => { closeModal(); toast.success(modalMode === 'creation' ? 'Cours ajouté' : 'Cours mis à jour'); }}
                    onCancel={closeModal}
                />
            )}
        </div>
    );
}
