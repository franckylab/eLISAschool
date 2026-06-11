/**
 * ==================================
 * eLISAschool - Page Détail Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase,
    Edit, Trash2, FileText, Award, Clock, Building2,
    UserCheck, AlertCircle
} from 'lucide-react';
import { useMembrePersonnel, useSupprimerPersonnel } from '../hooks/use-personnel';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { MembrePersonnel } from '../types/personnel.types';

type OngletActif = 'informations' | 'affectations' | 'documents';

const LABELS_TYPE_CONTRAT: Record<string, string> = {
    cdi: 'CDI',
    cdd: 'CDD',
    vacataire: 'Vacataire',
    stage: 'Stage',
};

const LABELS_STATUT: Record<string, string> = {
    actif: 'Actif',
    inactif: 'Inactif',
    en_conge: 'En congé',
    demission: 'Démission',
};

const COULEURS_STATUT: Record<string, string> = {
    actif: 'bg-green-100 text-green-800 border-green-200',
    inactif: 'bg-gray-100 text-gray-800 border-gray-200',
    en_conge: 'bg-blue-100 text-blue-800 border-blue-200',
    demission: 'bg-red-100 text-red-800 border-red-200',
};

export function PersonnelDetailPage() {
    const { id } = useParams({ from: '/_auth/personnel/$id' });
    const navigate = useNavigate();
    const { t } = useTranslation('personnel');
    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');

    const { data: membreData, isLoading } = useMembrePersonnel(id);
    const membre = membreData?.data;
    const supprimer = useSupprimerPersonnel();

    // Calculer l'ancienneté
    const anciennete = membre ? Math.floor(
        (Date.now() - new Date(membre.dateEntree).getTime()) / (1000 * 60 * 60 * 24 * 365)
    ) : 0;

    const onglets = [
        { id: 'informations' as const, label: 'Informations', icon: FileText },
        { id: 'affectations' as const, label: 'Affectations', icon: Briefcase },
        { id: 'documents' as const, label: 'Documents', icon: Award },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!membre) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-lg text-gray-600">Membre du personnel non trouvé</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/personnel' })} className="mt-4">
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header avec photo et infos principales */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                            {membre.prenom?.charAt(0)}{membre.nom?.charAt(0)}
                        </div>

                        {/* Infos principales */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {membre.prenom} {membre.nom}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${COULEURS_STATUT[membre.statut]}`}>
                                    {LABELS_STATUT[membre.statut]}
                                </span>
                            </div>

                            <p className="text-lg text-gray-600 mb-3">{membre.poste}</p>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    <span>{LABELS_TYPE_CONTRAT[membre.typeContrat]}</span>
                                </div>
                                {membre.departement && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        <span>{membre.departement}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Ancienneté: {anciennete} an{anciennete > 1 ? 's' : ''}</span>
                                </div>
                                {membre.matricule && (
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        <span className="font-mono">{membre.matricule}</span>
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
                            onClick={() => navigate({ to: '/personnel' })}
                        >
                            Modifier
                        </ElisaButton>
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            icon={<ArrowLeft className="h-4 w-4" />}
                            onClick={() => navigate({ to: '/personnel' })}
                        >
                            Retour
                        </ElisaButton>
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="h-4 w-4" />}
                            isLoading={supprimer.isPending}
                            onClick={() => {
                                if (confirm(`Supprimer ${membre.prenom} ${membre.nom} du personnel ?`)) {
                                    supprimer.mutateAsync(id).then(() => {
                                        navigate({ to: '/personnel' });
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
                        <span className="text-sm font-medium text-blue-700">Date d'entrée</span>
                    </div>
                    <p className="text-xl font-bold text-blue-800">
                        {new Date(membre.dateEntree).toLocaleDateString('fr-FR')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <UserCheck className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Statut</span>
                    </div>
                    <p className="text-xl font-bold text-green-800">
                        {LABELS_STATUT[membre.statut]}
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
                        <span className="text-sm font-medium text-purple-700">Qualification</span>
                    </div>
                    <p className="text-lg font-bold text-purple-800">
                        {membre.qualification || 'Non spécifié'}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">Type contrat</span>
                    </div>
                    <p className="text-xl font-bold text-orange-800">
                        {LABELS_TYPE_CONTRAT[membre.typeContrat]}
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
                        {/* Informations personnelles */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-blue-600" />
                                Informations personnelles
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Date de naissance</dt>
                                    <dd className="mt-1 text-gray-900">
                                        {new Date(membre.dateNaissance).toLocaleDateString('fr-FR')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Sexe</dt>
                                    <dd className="mt-1 text-gray-900">{membre.sexe === 'M' ? 'Masculin' : 'Féminin'}</dd>
                                </div>
                                {membre.specialite && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Spécialité</dt>
                                        <dd className="mt-1 text-gray-900">{membre.specialite}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Contact */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-green-600" />
                                Coordonnées
                            </h3>
                            <dl className="space-y-4">
                                {membre.email && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                                            <dd className="text-gray-900">{membre.email}</dd>
                                        </div>
                                    </div>
                                )}
                                {membre.telephone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                                            <dd className="text-gray-900">{membre.telephone}</dd>
                                        </div>
                                    </div>
                                )}
                                {membre.adresse && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                                            <dd className="text-gray-900">{membre.adresse}</dd>
                                        </div>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Informations professionnelles */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-purple-600" />
                                Informations professionnelles
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Poste</dt>
                                    <dd className="mt-1 text-gray-900">{membre.poste}</dd>
                                </div>
                                {membre.departement && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Département</dt>
                                        <dd className="mt-1 text-gray-900">{membre.departement}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Type de contrat</dt>
                                    <dd className="mt-1">
                                        <span className="px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                            {LABELS_TYPE_CONTRAT[membre.typeContrat]}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Date d'entrée</dt>
                                    <dd className="mt-1 text-gray-900">
                                        {new Date(membre.dateEntree).toLocaleDateString('fr-FR')}
                                    </dd>
                                </div>
                                {membre.dateSortie && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Date de sortie</dt>
                                        <dd className="mt-1 text-red-600 font-medium">
                                            {new Date(membre.dateSortie).toLocaleDateString('fr-FR')}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Métadonnées */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-600" />
                                Métadonnées
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Créé le</dt>
                                    <dd className="mt-1 text-gray-900">
                                        {new Date(membre.createdAt).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Dernière modification</dt>
                                    <dd className="mt-1 text-gray-900">
                                        {new Date(membre.updatedAt).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                {ongletActif === 'affectations' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">Historique des affectations</h3>
                            <ElisaButton variant="primary" size="sm" icon={<Briefcase className="h-4 w-4" />}>
                                Nouvelle affectation
                            </ElisaButton>
                        </div>
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 mb-2">Aucune affectation enregistrée</p>
                            <p className="text-sm text-gray-500">Les affectations seront visibles ici une fois créées</p>
                        </div>
                    </div>
                )}

                {ongletActif === 'documents' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">Documents et certifications</h3>
                            <ElisaButton variant="primary" size="sm" icon={<Award className="h-4 w-4" />}>
                                Ajouter un document
                            </ElisaButton>
                        </div>
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 mb-2">Aucun document uploadé</p>
                            <p className="text-sm text-gray-500">CV, diplômes, certificats seront visibles ici</p>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
