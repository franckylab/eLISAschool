/**
 * ==================================
 * eLISAschool - Page Détail Spécialité
 * ==================================
 */

import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, BookOpen, Layers,
    CheckCircle, XCircle, Loader2, AlertCircle,
} from 'lucide-react';
import { useSpecialite } from '../hooks/use-specialites';
import { ElisaButton } from '@/components/ui/ElisaButton';

export function SpecialiteDetailPage() {
    const { id } = useParams({ from: '/_auth/specialites/$id' });
    const navigate = useNavigate();
    const { data: specialite, isLoading, error } = useSpecialite(id);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Chargement...</p>
            </div>
        );
    }

    if (error || !specialite) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                <p className="text-red-600 mb-4">Spécialité non trouvée</p>
                <ElisaButton variant="outline" onClick={() => navigate({ to: '/specialites' })}>
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
                    onClick={() => navigate({ to: '/specialites' })}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-6"
                >
                    Retour aux spécialités
                </ElisaButton>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-50 rounded-xl">
                            <BookOpen className="h-8 w-8 text-teal-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{specialite.nom}</h1>
                            <p className="text-gray-500 font-mono text-sm">{specialite.code}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <dt className="text-sm text-gray-500">Code</dt>
                                    <dd className="text-sm font-medium text-gray-900 font-mono">{specialite.code}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Ordre</dt>
                                    <dd className="text-sm font-medium text-gray-900">{specialite.ordre}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Filière</dt>
                                    <dd>
                                        {specialite.filiere ? (
                                            <button
                                                onClick={() => navigate({ to: '/filieres/$id', params: { id: specialite.filiere!.id } })}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {specialite.filiere.nom}
                                            </button>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Statut</dt>
                                    <dd>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${specialite.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {specialite.actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            {specialite.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                            {specialite.description && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <dt className="text-sm text-gray-500 mb-1">Description</dt>
                                    <dd className="text-sm text-gray-900">{specialite.description}</dd>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`rounded-xl shadow-sm border p-6 ${specialite.actif ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                {specialite.actif
                                    ? <CheckCircle className="h-5 w-5 text-green-600" />
                                    : <XCircle className="h-5 w-5 text-red-600" />
                                }
                                <span className={`font-semibold ${specialite.actif ? 'text-green-800' : 'text-red-800'}`}>
                                    {specialite.actif ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">
                                {specialite.actif
                                    ? 'Cette spécialité est actuellement active.'
                                    : 'Cette spécialité est actuellement inactive.'}
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Filière</h3>
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-indigo-500" />
                                {specialite.filiere ? (
                                    <button
                                        onClick={() => navigate({ to: '/filieres/$id', params: { id: specialite.filiere!.id } })}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {specialite.filiere.nom} ({specialite.filiere.code})
                                    </button>
                                ) : (
                                    <span className="text-sm text-gray-400">Non rattachée</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
