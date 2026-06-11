/**
 * ==================================
 * eLISAschool - Page Détail Matière
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    ArrowLeft, BookOpen, Clock, FileText, Users,
    Edit, Trash2, Hash, TrendingUp, AlertCircle
} from 'lucide-react';
import { useMatiere, useSupprimerMatiere } from '../hooks/use-matieres';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { Matiere } from '../types/matiere.types';

type OngletActif = 'informations' | 'programme' | 'statistiques';

export function MatiereDetailPage() {
    const { id } = useParams({ from: '/_auth/matieres/$id' });
    const navigate = useNavigate();
    const { t } = useTranslation('matieres');
    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');

    const { data: matiereData, isLoading } = useMatiere(id);
    const matiere = matiereData?.data;
    const supprimer = useSupprimerMatiere();

    const onglets = [
        { id: 'informations' as const, label: 'Informations', icon: BookOpen },
        { id: 'programme' as const, label: 'Programme', icon: FileText },
        { id: 'statistiques' as const, label: 'Statistiques', icon: TrendingUp },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!matiere) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-lg text-gray-600">Matière non trouvée</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/matieres' })} className="mt-4">
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    const couleurMatiere = matiere.couleur || '#3B82F6';

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header avec couleur de la matière */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
                {/* Barre de couleur */}
                <div
                    className="h-2 w-full"
                    style={{ backgroundColor: couleurMatiere }}
                />

                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-6">
                            {/* Icône avec couleur */}
                            <div
                                className="w-20 h-20 rounded-lg flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: `${couleurMatiere}20` }}
                            >
                                <BookOpen
                                    className="h-10 w-10"
                                    style={{ color: couleurMatiere }}
                                />
                            </div>

                            {/* Infos principales */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {matiere.nom}
                                    </h1>
                                    {matiere.statut && (
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            matiere.statut === 'actif'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {matiere.statut === 'actif' ? 'Active' : 'Inactive'}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        <span className="font-mono">{matiere.code}</span>
                                    </div>
                                    {matiere.coefficient && (
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            <span>Coefficient: {matiere.coefficient}</span>
                                        </div>
                                    )}
                                    {matiere.nombreHeures && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            <span>{matiere.nombreHeures}h/semaine</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<Edit className="h-4 w-4" />}
                            >
                                Modifier
                            </ElisaButton>
                            <ElisaButton
                                variant="ghost"
                                size="sm"
                                icon={<ArrowLeft className="h-4 w-4" />}
                                onClick={() => navigate({ to: '/matieres' })}
                            >
                                Retour
                            </ElisaButton>
                            <ElisaButton
                                variant="danger"
                                size="sm"
                                icon={<Trash2 className="h-4 w-4" />}
                                isLoading={supprimer.isPending}
                                onClick={() => {
                                    if (confirm(`Supprimer la matière "${matiere.nom}" ?`)) {
                                        supprimer.mutateAsync(id).then(() => {
                                            navigate({ to: '/matieres' });
                                        });
                                    }
                                }}
                            >
                                Supprimer
                            </ElisaButton>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Coefficient</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">
                        {matiere.coefficient || 'N/A'}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Heures/semaine</span>
                    </div>
                    <p className="text-3xl font-bold text-green-800">
                        {matiere.nombreHeures || 'N/A'}h
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Classes</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-800">-</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">Statut</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-800">
                        {matiere.statut === 'actif' ? 'Active' : 'Inactive'}
                    </p>
                </motion.div>
            </div>

            {/* Onglets */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6">
                    {onglets.map((onglet) => {
                        const Icon = onglet.icon;
                        return (
                            <button
                                key={onglet.id}
                                onClick={() => setOngletActif(onglet.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    ongletActif === onglet.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {onglet.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Contenu des onglets */}
            <motion.div
                key={ongletActif}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {ongletActif === 'informations' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Informations générales */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                                Informations générales
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Nom de la matière</dt>
                                    <dd className="mt-1 text-lg font-medium text-gray-900">{matiere.nom}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Code</dt>
                                    <dd className="mt-1 font-mono text-gray-900">{matiere.code}</dd>
                                </div>
                                {matiere.description && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                                        <dd className="mt-1 text-gray-900">{matiere.description}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Configuration */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                                Configuration pédagogique
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Coefficient</dt>
                                    <dd className="mt-1">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-lg font-bold bg-blue-100 text-blue-800">
                                            {matiere.coefficient || 'N/A'}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Nombre d'heures par semaine</dt>
                                    <dd className="mt-1 text-gray-900">{matiere.nombreHeures || 'Non défini'}h</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Couleur</dt>
                                    <dd className="mt-1 flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded-lg border-2 border-gray-200 shadow-sm"
                                            style={{ backgroundColor: couleurMatiere }}
                                        />
                                        <span className="font-mono text-sm">{couleurMatiere}</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Statut</dt>
                                    <dd className="mt-1">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            matiere.statut === 'actif'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {matiere.statut === 'actif' ? 'Active' : 'Inactive'}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Métadonnées */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 md:col-span-2">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-orange-600" />
                                Métadonnées
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Créée le</dt>
                                    <dd className="mt-1 text-gray-900">
                                        {new Date(matiere.createdAt).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Dernière modification</dt>
                                    <dd className="mt-1 text-gray-900">
                                        {new Date(matiere.updatedAt).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {ongletActif === 'programme' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Programme de la matière
                        </h3>
                        {matiere.programme ? (
                            <div className="prose max-w-none">
                                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {matiere.programme}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 mb-2">Aucun programme défini</p>
                                <p className="text-sm text-gray-500">Le programme sera visible ici une fois ajouté</p>
                            </div>
                        )}
                    </div>
                )}

                {ongletActif === 'statistiques' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Classes utilisant cette matière</h3>
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 mb-2">Données non disponibles</p>
                                <p className="text-sm text-gray-500">Cette fonctionnalité sera disponible prochainement</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Performance moyenne</h3>
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 mb-2">Statistiques non disponibles</p>
                                <p className="text-sm text-gray-500">Les moyennes seront calculées automatiquement</p>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
