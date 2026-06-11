/**
 * ==================================
 * eLISAschool - Page Détail Année Scolaire
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Calendar, Clock, BookOpen, Users,
    Edit, Trash2, FileText, AlertCircle, Play, Archive
} from 'lucide-react';
import { useAnneeScolaire, useSupprimerAnneeScolaire, useActiverAnneeScolaire } from '../hooks/use-annees-scolaires';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { AnneeScolaire } from '../types/annee-scolaire.types';

type OngletActif = 'informations' | 'periodes' | 'statistiques';

const LABELS_STATUT: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    future: 'Future',
    archivee: 'Archivée',
};

const COULEURS_STATUT: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    future: 'bg-blue-100 text-blue-800 border-blue-200',
    archivee: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function AnneeScolaireDetailPage() {
    const { id } = useParams({ from: '/_auth/annees-scolaires/$id' });
    const navigate = useNavigate();
    const { t } = useTranslation('annees-scolaires');
    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');

    const { data: anneeData, isLoading } = useAnneeScolaire(id);
    const annee = anneeData?.data;
    const supprimer = useSupprimerAnneeScolaire();
    const activer = useActiverAnneeScolaire();

    // Calculer la durée en jours
    const dureeJours = annee ? Math.ceil(
        (new Date(annee.dateFin).getTime() - new Date(annee.dateDebut).getTime()) / (1000 * 60 * 60 * 24)
    ) : 0;

    // Calculer les jours restants si active
    const joursRestants = annee?.statut === 'active' ? Math.ceil(
        (new Date(annee.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ) : null;

    const onglets = [
        { id: 'informations' as const, label: 'Informations', icon: Calendar },
        { id: 'periodes' as const, label: 'Périodes', icon: Clock },
        { id: 'statistiques' as const, label: 'Statistiques', icon: Users },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!annee) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-lg text-gray-600">Année scolaire non trouvée</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/annees-scolaires' })} className="mt-4">
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-6">
                        {/* Icône Calendar */}
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <Calendar className="h-10 w-10 text-white" />
                        </div>

                        {/* Infos principales */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {annee.libelle}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${COULEURS_STATUT[annee.statut]}`}>
                                    {LABELS_STATUT[annee.statut]}
                                </span>
                                {annee.estActuelle && (
                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md">
                                        ⭐ Année en cours
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="font-mono">{annee.code}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Durée: {dureeJours} jours</span>
                                </div>
                                {joursRestants !== null && joursRestants > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-orange-600 font-medium">{joursRestants} jours restants</span>
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
                        {!annee.estActuelle && annee.statut !== 'active' && (
                            <ElisaButton
                                variant="primary"
                                size="sm"
                                icon={<Play className="h-4 w-4" />}
                                isLoading={activer.isPending}
                                onClick={() => {
                                    if (confirm(`Activer l'année "${annee.libelle}" ?`)) {
                                        activer.mutateAsync(id);
                                    }
                                }}
                            >
                                Activer
                            </ElisaButton>
                        )}
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            icon={<ArrowLeft className="h-4 w-4" />}
                            onClick={() => navigate({ to: '/annees-scolaires' })}
                        >
                            Retour
                        </ElisaButton>
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="h-4 w-4" />}
                            isLoading={supprimer.isPending}
                            onClick={() => {
                                if (confirm(`Supprimer l'année "${annee.libelle}" ?`)) {
                                    supprimer.mutateAsync(id).then(() => {
                                        navigate({ to: '/annees-scolaires' });
                                    });
                                }
                            }}
                        >
                            Supprimer
                        </ElisaButton>
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
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Date début</span>
                    </div>
                    <p className="text-xl font-bold text-blue-800">
                        {new Date(annee.dateDebut).toLocaleDateString('fr-FR')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Date fin</span>
                    </div>
                    <p className="text-xl font-bold text-green-800">
                        {new Date(annee.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Durée totale</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-800">
                        {Math.floor(dureeJours / 30)} mois {dureeJours % 30} jours
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">Trimestres</span>
                    </div>
                    <p className="text-3xl font-bold text-orange-800">
                        {annee.trimestres?.length || 3}
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
                                <Calendar className="h-5 w-5 text-blue-600" />
                                Informations générales
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Libellé</dt>
                                    <dd className="mt-1 text-lg font-medium text-gray-900">{annee.libelle}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Code</dt>
                                    <dd className="mt-1 font-mono text-gray-900">{annee.code}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Statut</dt>
                                    <dd className="mt-1">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${COULEURS_STATUT[annee.statut]}`}>
                                            {LABELS_STATUT[annee.statut]}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Année en cours</dt>
                                    <dd className="mt-1">
                                        {annee.estActuelle ? (
                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                ✓ Oui
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                                ✗ Non
                                            </span>
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Période */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-green-600" />
                                Période
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Date de début</dt>
                                    <dd className="mt-1 text-gray-900">
                                        {new Date(annee.dateDebut).toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Date de fin</dt>
                                    <dd className="mt-1 text-gray-900">
                                        {new Date(annee.dateFin).toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Durée totale</dt>
                                    <dd className="mt-1 text-gray-900 font-medium">
                                        {dureeJours} jours ({Math.floor(dureeJours / 30)} mois {dureeJours % 30} jours)
                                    </dd>
                                </div>
                                {joursRestants !== null && joursRestants > 0 && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Jours restants</dt>
                                        <dd className="mt-1 text-orange-600 font-bold">
                                            {joursRestants} jours
                                        </dd>
                                    </div>
                                )}
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
                                        {new Date(annee.createdAt).toLocaleDateString('fr-FR', {
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
                                        {new Date(annee.updatedAt).toLocaleDateString('fr-FR', {
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

                {ongletActif === 'periodes' && (
                    <div className="space-y-6">
                        {/* Trimestres */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                Trimestres
                            </h3>
                            {annee.trimestres && annee.trimestres.length > 0 ? (
                                <div className="space-y-3">
                                    {annee.trimestres.map((trimestre) => (
                                        <div key={trimestre.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{trimestre.nom}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(trimestre.dateDebut).toLocaleDateString('fr-FR')} - {new Date(trimestre.dateFin).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                T{trimestre.numero}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 mb-2">Aucun trimestre configuré</p>
                                    <p className="text-sm text-gray-500">Les trimestres seront visibles ici une fois créés</p>
                                </div>
                            )}
                        </div>

                        {/* Semestres */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-purple-600" />
                                Semestres
                            </h3>
                            {annee.semestres && annee.semestres.length > 0 ? (
                                <div className="space-y-3">
                                    {annee.semestres.map((semestre) => (
                                        <div key={semestre.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{semestre.nom}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(semestre.dateDebut).toLocaleDateString('fr-FR')} - {new Date(semestre.dateFin).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                S{semestre.numero}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 mb-2">Aucun semestre configuré</p>
                                    <p className="text-sm text-gray-500">Les semestres seront visibles ici une fois créés</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {ongletActif === 'statistiques' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Progression de l'année</h3>
                            <div className="relative pt-4">
                                {annee.statut === 'active' ? (
                                    <>
                                        <div className="overflow-hidden h-4 text-xs flex rounded bg-blue-100">
                                            <div
                                                style={{ width: `${Math.max(0, Math.min(100, ((Date.now() - new Date(annee.dateDebut).getTime()) / (new Date(annee.dateFin).getTime() - new Date(annee.dateDebut).getTime())) * 100))}%` }}
                                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                                            />
                                        </div>
                                        <p className="mt-2 text-sm text-gray-600">
                                            {Math.floor(((Date.now() - new Date(annee.dateDebut).getTime()) / (new Date(annee.dateFin).getTime() - new Date(annee.dateDebut).getTime())) * 100)}% complété
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">
                                        {annee.statut === 'future' ? "L'année n'a pas encore commencé" : "Année terminée ou inactive"}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Résumé</h3>
                            <dl className="space-y-3">
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500">Statut</dt>
                                    <dd className="text-sm font-medium">{LABELS_STATUT[annee.statut]}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500">Durée</dt>
                                    <dd className="text-sm font-medium">{dureeJours} jours</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500">Trimestres</dt>
                                    <dd className="text-sm font-medium">{annee.trimestres?.length || 3}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500">Semestres</dt>
                                    <dd className="text-sm font-medium">{annee.semestres?.length || 2}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
