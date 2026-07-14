/**
 * ==================================
 * eLISAschool - Page Détail Compétence
 * ==================================
 */

import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Target, BookOpen,
    CheckCircle, XCircle, Loader2, AlertCircle,
    GraduationCap, Layers,
} from 'lucide-react';
import { useCompetence } from '../hooks/use-competences';
import { ElisaButton } from '@/components/ui/ElisaButton';

export function CompetenceDetailPage() {
    const { id } = useParams({ from: '/_auth/competences/$id' });
    const navigate = useNavigate();
    const { data: competence, isLoading, error } = useCompetence(id);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-200">Chargement...</p>
            </div>
        );
    }

    if (error || !competence) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                <p className="text-red-600 mb-4">Compétence non trouvée</p>
                <ElisaButton variant="outline" onClick={() => navigate({ to: '/competences' })}>
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <ElisaButton
                    variant="ghost"
                    onClick={() => navigate({ to: '/competences' })}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-6"
                >
                    Retour aux compétences
                </ElisaButton>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-xl">
                            <Target className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200">{competence.libelle}</h1>
                            <p className="text-gray-500 dark:text-gray-200 font-mono text-sm">{competence.code}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">Informations</h2>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-200">Code</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-200 font-mono">{competence.code}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-200">Domaine</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-200">{competence.domaine}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-200">Niveau</dt>
                                    <dd>
                                        {competence.niveau ? (
                                            <button
                                                onClick={() => navigate({ to: '/niveaux/$id', params: { id: competence.niveau!.id } })}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {competence.niveau.nom}
                                            </button>
                                        ) : (
                                            <span className="text-sm text-gray-400 dark:text-gray-100">-</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-200">Matière</dt>
                                    <dd>
                                        {competence.matiere ? (
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{competence.matiere.nom}</span>
                                        ) : (
                                            <span className="text-sm text-gray-400 dark:text-gray-100">-</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-200">Ordre</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-200">{competence.ordre}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-200">Statut</dt>
                                    <dd>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${competence.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {competence.actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            {competence.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                            {competence.description && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <dt className="text-sm text-gray-500 dark:text-gray-200 mb-1">Description</dt>
                                    <dd className="text-sm text-gray-900 dark:text-gray-200">{competence.description}</dd>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`rounded-xl shadow-sm border p-6 ${competence.actif ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                {competence.actif
                                    ? <CheckCircle className="h-5 w-5 text-green-600" />
                                    : <XCircle className="h-5 w-5 text-red-600" />
                                }
                                <span className={`font-semibold ${competence.actif ? 'text-green-800' : 'text-red-800'}`}>
                                    {competence.actif ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {competence.actif
                                    ? 'Cette compétence est actuellement active.'
                                    : 'Cette compétence est actuellement inactive.'}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-3">Classification</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-200">Domaine</span>
                                    <span className="font-medium">{competence.domaine}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-200">Niveau</span>
                                    <span className="font-medium">{competence.niveau?.nom || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-200">Matière</span>
                                    <span className="font-medium">{competence.matiere?.nom || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
