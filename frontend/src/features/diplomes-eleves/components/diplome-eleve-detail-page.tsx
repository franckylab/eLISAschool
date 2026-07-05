/**
 * ==================================
 * eLISAschool - Page Détail Diplôme Élève
 * ==================================
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Edit, GraduationCap, FileText,
    CheckCircle, XCircle, Loader2, AlertCircle,
    Calendar, User, Award,
} from 'lucide-react';
import { useDiplomeEleve } from '../hooks/use-diplomes-eleves';
import { useModifierDiplomeEleve } from '../hooks/use-diplomes-eleves';
import { DiplomeEleveFormModal } from './diplome-eleve-form-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';

const RESULTAT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    ADMIS: { bg: 'bg-green-100', text: 'text-green-800', label: 'Admis' },
    REFUSE: { bg: 'bg-red-100', text: 'text-red-800', label: 'Refusé' },
    AJOURNE: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Ajourné' },
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

export function DiplomeEleveDetailPage() {
    const { id } = useParams({ from: '/_auth/diplomes-eleves/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: diplome, isLoading, error } = useDiplomeEleve(id);
    const [formOpen, setFormOpen] = useState(false);
    const modifier = useModifierDiplomeEleve();

    const handleSave = async (data: any) => {
        await modifier.mutateAsync({ id: diplome!.id, ...data });
        setFormOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Chargement...</p>
            </div>
        );
    }

    if (error || !diplome) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                <p className="text-red-600 mb-4">Diplôme non trouvé</p>
                <ElisaButton variant="outline" onClick={() => navigate({ to: '/diplomes-eleves' })}>
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    const resultatStyle = RESULTAT_STYLES[diplome.resultat] || RESULTAT_STYLES.REFUSE;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <ElisaButton
                    variant="ghost"
                    onClick={() => navigate({ to: '/diplomes-eleves' })}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-6"
                >
                    Retour aux diplômes
                </ElisaButton>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-50 rounded-xl">
                            <GraduationCap className="h-8 w-8 text-cyan-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {diplome.eleve ? `${diplome.eleve.prenom} ${diplome.eleve.nom}` : 'Diplôme'}
                            </h1>
                            {diplome.numeroDiplome && (
                                <p className="text-gray-500 font-mono text-sm">N° {diplome.numeroDiplome}</p>
                            )}
                        </div>
                    </div>
                    {hasPermission('diplomes-eleves:edit') && (
                        <ElisaButton
                            onClick={() => setFormOpen(true)}
                            icon={<Edit className="h-4 w-4" />}
                            variant="primary"
                        >
                            Modifier
                        </ElisaButton>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <dt className="text-sm text-gray-500">Élève</dt>
                                    <dd>
                                        {diplome.eleve ? (
                                            <button
                                                onClick={() => navigate({ to: '/eleves/$id', params: { id: diplome.eleve!.id } })}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {diplome.eleve.prenom} {diplome.eleve.nom}
                                            </button>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                        {diplome.eleve?.matricule && (
                                            <p className="text-xs text-gray-400 font-mono">{diplome.eleve.matricule}</p>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Examen national</dt>
                                    <dd>
                                        {diplome.examenNational ? (
                                            <button
                                                onClick={() => navigate({ to: '/examens-nationaux/$id', params: { id: diplome.examenNational!.id } })}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {diplome.examenNational.nom}
                                            </button>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Date d'obtention</dt>
                                    <dd className="text-sm font-medium text-gray-900">{formatDate(diplome.dateObtention)}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Résultat</dt>
                                    <dd>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${resultatStyle.bg} ${resultatStyle.text}`}>
                                            {resultatStyle.label}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Note obtenue</dt>
                                    <dd className="text-sm font-medium text-gray-900">{diplome.noteObtenue ?? '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Mention</dt>
                                    <dd className="text-sm font-medium text-gray-900">{diplome.mention || '-'}</dd>
                                </div>
                            </dl>
                            {diplome.observations && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <dt className="text-sm text-gray-500 mb-1">Observations</dt>
                                    <dd className="text-sm text-gray-900">{diplome.observations}</dd>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`rounded-xl shadow-sm border p-6 ${resultatStyle.bg} border-${diplome.resultat === 'ADMIS' ? 'green' : diplome.resultat === 'REFUSE' ? 'red' : 'yellow'}-200`}>
                            <div className="flex items-center gap-3 mb-3">
                                <Award className={`h-5 w-5 ${diplome.resultat === 'ADMIS' ? 'text-green-600' : diplome.resultat === 'REFUSE' ? 'text-red-600' : 'text-yellow-600'}`} />
                                <span className={`font-semibold ${resultatStyle.text}`}>{resultatStyle.label}</span>
                            </div>
                            {diplome.mention && (
                                <p className="text-sm text-gray-600">Mention: {diplome.mention}</p>
                            )}
                            {diplome.noteObtenue !== undefined && (
                                <p className="text-sm text-gray-600">Note: {diplome.noteObtenue}/20</p>
                            )}
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Récapitulatif</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Diplôme</span>
                                    <span className="font-medium">{diplome.examenNational?.diplomeDelivre || diplome.examenNational?.nom || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Date</span>
                                    <span className="font-medium">{formatDate(diplome.dateObtention)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Résultat</span>
                                    <span className={`font-medium ${resultatStyle.text}`}>{resultatStyle.label}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {formOpen && (
                <DiplomeEleveFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) setFormOpen(false); }}
                    diplome={diplome}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
