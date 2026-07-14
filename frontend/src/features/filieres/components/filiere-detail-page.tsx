/**
 * ==================================
 * eLISAschool - Page Détail Filière
 * ==================================
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Edit, Award, BookOpen,
    CheckCircle, XCircle, Loader2, AlertCircle,
    Layers,
} from 'lucide-react';
import { useFiliere } from '../hooks/use-filieres';
import { useSpecialites, type Specialite } from '@/features/specialites/hooks/use-specialites';
import { useModifierFiliere } from '../hooks/use-filieres';
import { FiliereFormModal } from './filiere-form-modal';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';

const SOUS_SYSTEME_LABELS: Record<string, string> = {
    FRANCOPHONE: 'Francophone',
    ANGLOPHONE: 'Anglophone',
};

export function FiliereDetailPage() {
    const { id } = useParams({ from: '/_auth/filieres/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: filiere, isLoading, error } = useFiliere(id);
    const [formOpen, setFormOpen] = useState(false);
    const modifier = useModifierFiliere();

    const handleSave = async (data: any) => {
        await modifier.mutateAsync({ id: filiere!.id, ...data });
        setFormOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
            </div>
        );
    }

    if (error || !filiere) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                <p className="text-red-600 mb-4">Filière non trouvée</p>
                <ElisaButton variant="outline" onClick={() => navigate({ to: '/filieres' })}>
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
                <Breadcrumbs currentLabel={filiere.nom} />
                <ElisaButton
                    variant="ghost"
                    onClick={() => navigate({ to: '/filieres' })}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-6"
                >
                    Retour aux filières
                </ElisaButton>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                            <Award className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200">{filiere.nom}</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">{filiere.code}</p>
                        </div>
                    </div>
                    {hasPermission('filieres:edit') && (
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
                                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-200 font-mono">{filiere.code}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Sous-système</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-200">{SOUS_SYSTEME_LABELS[filiere.sousSysteme] || filiere.sousSysteme}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Cycle</dt>
                                    <dd>
                                        {filiere.cycle ? (
                                            <button
                                                onClick={() => navigate({ to: '/cycles/$id', params: { id: filiere.cycle!.id } })}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {filiere.cycle.nom}
                                            </button>
                                        ) : (
                                            <span className="text-sm text-gray-400 dark:text-gray-300">-</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Coefficient frais</dt>
                                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-200">{filiere.coefficientFrais ?? '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">Statut</dt>
                                    <dd>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${filiere.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {filiere.actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            {filiere.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                            {filiere.description && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <dt className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</dt>
                                    <dd className="text-sm text-gray-900 dark:text-gray-200">{filiere.description}</dd>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`rounded-xl shadow-sm border p-6 ${filiere.actif ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                {filiere.actif
                                    ? <CheckCircle className="h-5 w-5 text-green-600" />
                                    : <XCircle className="h-5 w-5 text-red-600" />
                                }
                                <span className={`font-semibold ${filiere.actif ? 'text-green-800' : 'text-red-800'}`}>
                                    {filiere.actif ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {filiere.actif
                                    ? 'Cette filière est actuellement active.'
                                    : 'Cette filière est actuellement inactive.'}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-3">Informations</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Cycle</span>
                                    <span className="font-medium">{filiere.cycle?.nom || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Sous-système</span>
                                    <span className="font-medium">{SOUS_SYSTEME_LABELS[filiere.sousSysteme] || filiere.sousSysteme}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {formOpen && (
                <FiliereFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) setFormOpen(false); }}
                    filiere={filiere}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
