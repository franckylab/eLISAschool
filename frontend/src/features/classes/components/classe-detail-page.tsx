/**
 * ==================================
 * eLISAschool - Page Détail Classe
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Users, BookOpen, Calendar, MapPin,
    Edit, Trash2, UserPlus, TrendingUp, Award
} from 'lucide-react';
import { useClasse, useSupprimerClasse } from '../hooks/use-classes';
import { useEleves } from '@/features/eleves/hooks/use-eleves';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { DataTable, Column } from '@/components/ui/DataTable';
import type { Eleve } from '@/features/eleves/types/eleve.types';

type OngletActif = 'informations' | 'eleves' | 'statistiques';

export function ClasseDetailPage() {
    const { id } = useParams({ from: '/_auth/classes/$id' });
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');

    const { data: classeData, isLoading: loadingClasse } = useClasse(id);
    const classe = classeData?.data;
    const supprimer = useSupprimerClasse();

    const { data: elevesData, isLoading: loadingEleves } = useEleves({
        classeId: id,
        page: 1,
        limit: 50,
    });

    const eleves = elevesData?.data || [];

    const colonnesEleves: Column<Eleve>[] = [
        {
            key: 'matricule',
            header: 'Matricule',
            render: (e) => <span className="font-mono text-sm">{e.matricule}</span>,
        },
        {
            key: 'nomComplet',
            header: 'Nom complet',
            render: (e) => (
                <div>
                    <p className="font-medium">{e.prenom} {e.nom}</p>
                    <p className="text-xs text-gray-500">{e.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                </div>
            ),
        },
        {
            key: 'dateNaissance',
            header: 'Date naissance',
            render: (e) => new Date(e.dateNaissance).toLocaleDateString('fr-FR'),
        },
        {
            key: 'statut',
            header: 'Statut',
            render: (e) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    e.statut === 'ACTIF' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {e.statut === 'ACTIF' ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
    ];

    const onglets = [
        { id: 'informations' as const, label: 'Informations', icon: BookOpen },
        { id: 'eleves' as const, label: `Élèves (${eleves.length})`, icon: Users },
        { id: 'statistiques' as const, label: 'Statistiques', icon: TrendingUp },
    ];

    if (loadingClasse) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!classe) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-lg text-gray-600">Classe non trouvée</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/classes' })} className="mt-4">
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
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <ElisaButton
                        variant="ghost"
                        size="sm"
                        icon={<ArrowLeft className="h-4 w-4" />}
                        onClick={() => navigate({ to: '/classes' })}
                    >
                        Retour
                    </ElisaButton>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{classe.nom}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Code: {classe.code} • {classe.niveau} {classe.cycle && `• ${classe.cycle}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Edit className="h-4 w-4" />}
                    >
                        Modifier
                    </ElisaButton>
                    <ElisaButton
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-4 w-4" />}
                        isLoading={supprimer.isPending}
                        onClick={() => {
                            if (confirm('Supprimer cette classe ?')) {
                                supprimer.mutateAsync(id).then(() => {
                                    navigate({ to: '/classes' });
                                });
                            }
                        }}
                    >
                        Supprimer
                    </ElisaButton>
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
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Effectif</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-800">
                        {classe.effectif || 0} / {classe.capaciteMax || '∞'}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Salle</span>
                    </div>
                    <p className="text-2xl font-bold text-green-800">
                        {classe.salle || 'Non assignée'}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Principal</span>
                    </div>
                    <p className="text-lg font-bold text-purple-800">
                        {classe.principal ? `${classe.principal.prenom} ${classe.principal.nom}` : 'Non assigné'}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">Statut</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-800">
                        {classe.statut === 'actif' ? 'Actif' : 'Inactif'}
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
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Nom de la classe</dt>
                                    <dd className="mt-1 text-lg font-medium text-gray-900">{classe.nom}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Code</dt>
                                    <dd className="mt-1 text-lg font-mono text-gray-900">{classe.code}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Niveau</dt>
                                    <dd className="mt-1 text-gray-900">{classe.niveau}</dd>
                                </div>
                                {classe.cycle && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Cycle</dt>
                                        <dd className="mt-1 text-gray-900">{classe.cycle}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Configuration</h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Capacité maximale</dt>
                                    <dd className="mt-1 text-gray-900">{classe.capaciteMax || 'Illimitée'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Salle</dt>
                                    <dd className="mt-1 text-gray-900">{classe.salle || 'Non assignée'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Statut</dt>
                                    <dd className="mt-1">
                                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                                            classe.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {classe.statut === 'actif' ? 'Actif' : 'Inactif'}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                {ongletActif === 'eleves' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                Élèves inscrits ({eleves.length})
                            </h3>
                            <ElisaButton
                                variant="primary"
                                size="sm"
                                icon={<UserPlus className="h-4 w-4" />}
                            >
                                Inscrire un élève
                            </ElisaButton>
                        </div>
                        {loadingEleves ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            </div>
                        ) : eleves.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600">Aucun élève inscrit dans cette classe</p>
                            </div>
                        ) : (
                            <DataTable
                                data={eleves}
                                columns={colonnesEleves}
                                enableReordering
                                enablePinning
                                enableColumnVisibility
                            />
                        )}
                    </div>
                )}

                {ongletActif === 'statistiques' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Taux d'occupation</h3>
                            <div className="relative pt-4">
                                <div className="overflow-hidden h-4 text-xs flex rounded bg-blue-100">
                                    <div
                                        style={{ width: `${classe.capaciteMax ? (classe.effectif || 0) / classe.capaciteMax * 100 : 0}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-600">
                                    {classe.capaciteMax
                                        ? `${((classe.effectif || 0) / classe.capaciteMax * 100).toFixed(1)}% rempli`
                                        : 'Pas de limite définie'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Répartition par sexe</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Garçons</span>
                                        <span className="font-medium">
                                            {eleves.filter((e: any) => e.sexe === 'M').length}
                                        </span>
                                    </div>
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-100">
                                        <div
                                            style={{ width: `${eleves.length > 0 ? eleves.filter((e: any) => e.sexe === 'M').length / eleves.length * 100 : 0}%` }}
                                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Filles</span>
                                        <span className="font-medium">
                                            {eleves.filter((e: any) => e.sexe === 'F').length}
                                        </span>
                                    </div>
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-pink-100">
                                        <div
                                            style={{ width: `${eleves.length > 0 ? eleves.filter((e: any) => e.sexe === 'F').length / eleves.length * 100 : 0}%` }}
                                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-pink-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
