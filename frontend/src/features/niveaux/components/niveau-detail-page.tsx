/**
 * ==================================
 * eLISAschool - Page Détail Niveau
 * ==================================
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Edit, GraduationCap, Layers,
    CheckCircle, XCircle, Loader2, AlertCircle,
    BookOpen, Link2,
} from 'lucide-react';
import { useNiveau } from '../hooks/use-niveaux';
import { NiveauFormModal } from './niveau-form-modal';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';

const SOUS_SYSTEME_LABELS: Record<string, string> = {
    FRANCOPHONE: 'Francophone',
    ANGLOPHONE: 'Anglophone',
    BICULTUREL: 'Biculturel',
};

export function NiveauDetailPage() {
    const { id } = useParams({ from: '/_auth/niveaux/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: niveau, isLoading, error } = useNiveau(id);
    const [formOpen, setFormOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
            </div>
        );
    }

    if (error || !niveau) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                <p className="text-red-600 mb-4">Niveau non trouvé</p>
                <ElisaButton variant="outline" onClick={() => navigate({ to: '/niveaux' })}>
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
                <Breadcrumbs currentLabel={niveau.nom} />
                <ElisaButton
                    variant="ghost"
                    onClick={() => navigate({ to: '/niveaux' })}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-6"
                >
                    Retour aux niveaux
                </ElisaButton>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-xl">
                            <GraduationCap className="h-8 w-8 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200">{niveau.nom}</h1>
                            {niveau.code && <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">{niveau.code}</p>}
                        </div>
                    </div>
                    {hasPermission('niveaux:edit') && (
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
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">Informations</h2>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Code</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-200 font-mono">{niveau.code || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Ordre</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-200">{niveau.ordre}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Sous-système</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-200">{SOUS_SYSTEME_LABELS[niveau.sousSysteme] || niveau.sousSysteme}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Classe d'examen</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-200">{niveau.estClasseExamen ? 'Oui' : 'Non'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Cycle</dt>
                                    <dd>
                                        {niveau.cycle ? (
                                            <button
                                                onClick={() => navigate({ to: '/cycles/$id', params: { id: niveau.cycle!.id } })}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {niveau.cycle.nom}
                                            </button>
                                        ) : (
                                            <span className="text-sm text-gray-400 dark:text-gray-300">-</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Statut</dt>
                                    <dd>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${niveau.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {niveau.actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            {niveau.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {niveau.examenNational && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Link2 className="h-5 w-5 text-orange-500" />
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">Examen national lié</h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 rounded-lg">
                                        <BookOpen className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => navigate({ to: '/examens-nationaux/$id', params: { id: niveau.examenNational!.id } })}
                                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                            {niveau.examenNational.nom}
                                        </button>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{niveau.examenNational.code}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className={`rounded-xl shadow-sm border p-6 ${niveau.actif ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                {niveau.actif
                                    ? <CheckCircle className="h-5 w-5 text-green-600" />
                                    : <XCircle className="h-5 w-5 text-red-600" />
                                }
                                <span className={`font-semibold ${niveau.actif ? 'text-green-800' : 'text-red-800'}`}>
                                    {niveau.actif ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {niveau.actif
                                    ? 'Ce niveau est actuellement actif.'
                                    : 'Ce niveau est actuellement inactif.'}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-3">Informations</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Sous-système</span>
                                    <span className="font-medium">{SOUS_SYSTEME_LABELS[niveau.sousSysteme] || niveau.sousSysteme}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Cycle</span>
                                    <span className="font-medium">{niveau.cycle?.nom || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Examen national</span>
                                    <span className="font-medium">{niveau.examenNational?.nom || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {formOpen && (
                <NiveauFormModal
                    niveau={niveau}
                    onClose={() => setFormOpen(false)}
                />
            )}
        </div>
    );
}
