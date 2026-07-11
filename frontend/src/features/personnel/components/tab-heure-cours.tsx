import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Clock, Calendar, BookOpen, CheckCircle, XCircle, AlertCircle,
    ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, List
} from 'lucide-react';
import { useResumeMensuel, useEdtEnseignant } from '../hooks/use-heure-cours';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';

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

    const nomMois = new Date(annee, mois - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const LundiDate = new Date(semaineRef);
    const semaineLabel = `${t('heuresCours.semaineDu')} ${LundiDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;

    const statsCards = useMemo(() => {
        if (!resume) return [];
        return [
            { label: t('heuresCours.heuresEffectuees'), value: `${resume.heuresEffectuees}h`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', trend: resume.heuresEffectuees > 0 ? 'up' as const : 'neutral' as const },
            { label: t('heuresCours.heuresPlanifiees'), value: `${resume.heuresPlanifiees}h`, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', trend: 'neutral' as const },
            { label: t('heuresCours.heuresAnnulees'), value: `${resume.heuresAnnulees}h`, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', trend: 'down' as const },
            { label: t('heuresCours.nombreCours'), value: resume.nombreCours, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'neutral' as const },
        ];
    }, [resume]);

    return (
        <div className="space-y-6">
            {/* Toggle Mensuel / Hebdo */}
            <div className="flex items-center gap-4 border-b border-gray-200 pb-3">
                <button onClick={() => setVue('mensuel')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${vue === 'mensuel' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Calendar className="h-4 w-4" /> {t('heuresCours.mensuel')}
                </button>
                <button onClick={() => setVue('hebdo')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${vue === 'hebdo' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
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
            </div>

            {vue === 'mensuel' && (isLoading ? (
                <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : resume ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {statsCards.map((stat, idx) => {
                            const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : Minus;
                            return (
                                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                                    className={`rounded-lg p-4 border ${stat.bg} border-gray-200`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-600">{stat.label}</span>
                                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                        <TrendIcon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                    {resume.detailParMatiere && resume.detailParMatiere.length > 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h4 className="text-md font-semibold mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-blue-600" /> {t('heuresCours.detailMatiere')}</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-medium text-gray-500">{t('heuresCours.matiere')}</th>
                                            <th className="text-right py-3 px-4 font-medium text-gray-500">{t('heuresCours.heures')}</th>
                                            <th className="text-right py-3 px-4 font-medium text-gray-500">{t('heuresCours.tarifHoraire')}</th>
                                            <th className="text-right py-3 px-4 font-medium text-gray-500">{t('heuresCours.montant')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {resume.detailParMatiere.map((d, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium">{d.matiereNom}</td>
                                                <td className="py-3 px-4 text-right">{d.heures}h</td>
                                                <td className="py-3 px-4 text-right">{d.tarifHoraire.toLocaleString('fr-FR')} F/h</td>
                                                <td className="py-3 px-4 text-right font-semibold">{d.montant.toLocaleString('fr-FR')} F</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
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
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 mb-2">{t('heuresCours.aucuneHeure')}</p>
                                <p className="text-sm text-gray-500">{t('heuresCours.aucuneHeureDesc')}</p>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">{t('heuresCours.chargementImpossible')}</p>
                </div>
            ))}

            {vue === 'hebdo' && (loadingEdt ? (
                <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : edt ? (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    {JOURS.map((jour) => {
                        const coursDuJour = edt.jours?.[jour] || [];
                        return (
                            <div key={jour} className="bg-white rounded-lg border border-gray-200 p-3 min-h-[200px]">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 pb-2 border-b border-gray-100">{JOURS_LABEL[jour]}</h4>
                                {coursDuJour.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-4">—</p>
                                ) : (
                                    <div className="space-y-2">
                                        {coursDuJour.map((c: any) => (
                                            <div key={c.id} className="text-xs p-2 rounded-md border bg-gray-50">
                                                <p className="font-medium text-gray-800">{c.heureDebut?.slice(0, 5)}–{c.heureFin?.slice(0, 5)}</p>
                                                <p className="text-gray-600 truncate">{c.matiere?.nom || '—'}</p>
                                                <p className="text-gray-400 truncate">{c.classe?.nom || ''}</p>
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
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">{t('heuresCours.edtImpossible')}</p>
                </div>
            ))}
        </div>
    );
}
