/**
 * ==================================
 * eLISAschool - Page Détail Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase,
    Edit, Trash2, FileText, Award, Clock, Building2,
    UserCheck, AlertCircle, CheckCircle, XCircle, Building, FileDown
} from 'lucide-react';
import { useMembrePersonnel, useSupprimerPersonnel, usePersonnelContrats, usePersonnelBulletins } from '../hooks/use-personnel';
import { useAffectationsMembre } from '../hooks/use-affectations';
import { PersonnelFormModal } from './personnel-form-modal';
import { TabHeureCours } from './tab-heure-cours';
import { TabFonctions } from './tab-fonctions';
import { PosteCapaciteIndicator } from '@/features/postes/components/PosteCapaciteIndicator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import type { ContratPersonnel, BulletinPaie } from '../types/personnel.types';
import type { AffectationPoste } from '../types/affectation.types';

type OngletActif = 'informations' | 'affectations' | 'contrat-salaire' | 'heures-cours' | 'fonctions' | 'documents';

const LABELS_TYPE_CONTRAT: Record<string, string> = {
    cdi: 'CDI',
    cdd: 'CDD',
    vacataire: 'Vacataire',
    stage: 'Stage',
};

const MODE_LABEL: Record<string, string> = {
    MENSUEL: 'Mensuel', HORAIRE: 'Horaire', MIXTE: 'Mixte', HEBDOMADAIRE: 'Hebdo',
};

const LABELS_STATUT: Record<string, string> = {
    ACTIF: 'Actif',
    INACTIF: 'Inactif',
    CONGE: 'En congé',
    actif: 'Actif',
    inactif: 'Inactif',
    en_conge: 'En congé',
    demission: 'Démission',
};

const COULEURS_STATUT: Record<string, string> = {
    ACTIF: 'bg-green-100 text-green-800 border-green-200',
    INACTIF: 'bg-gray-100 text-gray-800 border-gray-200',
    CONGE: 'bg-blue-100 text-blue-800 border-blue-200',
    actif: 'bg-green-100 text-green-800 border-green-200',
    inactif: 'bg-gray-100 text-gray-800 border-gray-200',
    en_conge: 'bg-blue-100 text-blue-800 border-blue-200',
    demission: 'bg-red-100 text-red-800 border-red-200',
};

export function PersonnelDetailPage() {
    const { id } = useParams({ from: '/_auth/personnel/$id' });
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');

    const [showEditModal, setShowEditModal] = useState(false);

    const { data: membre, isLoading } = useMembrePersonnel(id);
    const supprimer = useSupprimerPersonnel();
    const { data: affectations, isLoading: loadingAffectations } = useAffectationsMembre(id);
    const { data: contrats, isLoading: loadingContrats } = usePersonnelContrats(id);
    const { data: bulletins, isLoading: loadingBulletins } = usePersonnelBulletins(id);

    // Calculer l'ancienneté
    const anciennete = membre ? Math.floor(
        (Date.now() - new Date(membre.dateEmbauche ?? membre.dateEntree ?? '').getTime()) / (1000 * 60 * 60 * 24 * 365)
    ) : 0;

    const onglets = [
        { id: 'informations' as const, label: 'Informations', icon: FileText },
        { id: 'affectations' as const, label: 'Affectations', icon: Briefcase },
        { id: 'contrat-salaire' as const, label: 'Contrat & Salaire', icon: FileText },
        { id: 'heures-cours' as const, label: 'Heures de cours', icon: Clock },
        { id: 'fonctions' as const, label: 'Fonctions', icon: Briefcase },
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
                            {(membre.utilisateur?.profil?.prenom ?? membre.prenom ?? '')?.charAt(0)}{(membre.utilisateur?.profil?.nom ?? membre.nom ?? '')?.charAt(0)}
                        </div>

                        {/* Infos principales */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {membre.utilisateur?.profil?.prenom ?? membre.prenom ?? ''} {membre.utilisateur?.profil?.nom ?? membre.nom ?? ''}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${COULEURS_STATUT[membre.statut]}`}>
                                    {LABELS_STATUT[membre.statut]}
                                </span>
                            </div>

                            <p className="text-lg text-gray-600 mb-3">{membre.posteExact ?? membre.poste ?? 'Enseignant'}</p>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    <span>{LABELS_TYPE_CONTRAT[membre.typeContrat ?? 'cdi']}</span>
                                </div>
                                {(membre.service ?? membre.departement ?? '') && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        <span>{membre.service ?? membre.departement ?? ''}</span>
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
                            onClick={() => setShowEditModal(true)}
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
                                if (confirm(`Supprimer ${membre.utilisateur?.profil?.prenom ?? membre.prenom ?? ''} ${membre.utilisateur?.profil?.nom ?? membre.nom ?? ''} du personnel ?`)) {
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
                        {new Date(membre.dateEmbauche ?? membre.dateEntree ?? '').toLocaleDateString('fr-FR')}
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
                        {(membre.diplomes ?? membre.qualification ?? '') || 'Non spécifié'}
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
                        {LABELS_TYPE_CONTRAT[membre.typeContrat ?? 'cdi']}
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
                                        {new Date(membre.utilisateur?.profil?.dateNaissance ?? membre.dateNaissance ?? '').toLocaleDateString('fr-FR')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Sexe</dt>
                                    <dd className="mt-1 text-gray-900">{membre.sexe === 'M' ? 'Masculin' : 'Féminin'}</dd>
                                </div>
                                {(membre.specialites?.[0] ?? membre.specialite ?? '') && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Spécialité</dt>
                                        <dd className="mt-1 text-gray-900">{membre.specialites?.[0] ?? membre.specialite ?? ''}</dd>
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
                                {(membre.utilisateur?.email ?? membre.email ?? '') && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                                            <dd className="text-gray-900">{membre.utilisateur?.email ?? membre.email ?? ''}</dd>
                                        </div>
                                    </div>
                                )}
                                {(membre.utilisateur?.profil?.telephone ?? membre.telephone ?? '') && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                                            <dd className="text-gray-900">{membre.utilisateur?.profil?.telephone ?? membre.telephone ?? ''}</dd>
                                        </div>
                                    </div>
                                )}
                                {(membre.utilisateur?.profil?.adresse ?? membre.adresse ?? '') && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                                            <dd className="text-gray-900">{membre.utilisateur?.profil?.adresse ?? membre.adresse ?? ''}</dd>
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
                                    <dd className="mt-1 text-gray-900">{membre.posteExact ?? membre.poste ?? 'Enseignant'}</dd>
                                </div>
                                {(membre.service ?? membre.departement ?? '') && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Département</dt>
                                        <dd className="mt-1 text-gray-900">{membre.service ?? membre.departement ?? ''}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Type de contrat</dt>
                                    <dd className="mt-1">
                                        <span className="px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                            {LABELS_TYPE_CONTRAT[membre.typeContrat ?? 'cdi']}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Date d'entrée</dt>
                                    <dd className="mt-1 text-gray-900">
                                        {new Date(membre.dateEmbauche ?? membre.dateEntree ?? '').toLocaleDateString('fr-FR')}
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

                {ongletActif === 'contrat-salaire' && (
                    <div className="space-y-6">
                        {/* Contrats */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Contrats</h3>
                            {loadingContrats ? (
                                <div className="flex items-center justify-center h-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                            ) : contrats && contrats.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-500">Poste</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-500">Fonction</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-500">Mode</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-500">Période</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-500">Salaire</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-500">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {contrats.map((c: ContratPersonnel) => (
                                                <tr key={c.id} className="hover:bg-gray-50">
                                                    <td className="py-3 px-4 font-medium">{c.typeContrat}</td>
                                                    <td className="py-3 px-4">
                                                        {c.posteId ? (
                                                            <a href={`/postes/${c.posteId}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                                                                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate max-w-[120px]">{c.poste?.intitulé || c.posteId?.slice(0, 8)}</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400 italic">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {c.fonctionId ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-xs font-medium">
                                                                {c.fonction?.nom || c.fonctionId?.slice(0, 8)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 italic">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4"><Badge variant={c.statut === 'ACTIF' ? 'success' : 'default'}>{MODE_LABEL[c.modeRemuneration as string] || c.modeRemuneration || '—'}</Badge></td>
                                                    <td className="py-3 px-4 text-gray-600">
                                                        <span className="text-xs">{new Date(c.dateDebut).toLocaleDateString('fr-FR')}</span>
                                                        {c.dateFin && <><span className="text-gray-300 mx-1">→</span><span className="text-xs">{new Date(c.dateFin).toLocaleDateString('fr-FR')}</span></>}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="font-medium">{c.salaireBase?.toLocaleString('fr-FR')} F</div>
                                                        {c.tarifHoraire && <div className="text-xs text-gray-400">{c.tarifHoraire.toLocaleString('fr-FR')} F/h</div>}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge variant={c.statut === 'ACTIF' ? 'success' : 'secondary'}>{c.statut}</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Aucun contrat enregistré</p>
                            )}
                        </div>

                        {/* Bulletins de paie */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Bulletins de paie</h3>
                            {loadingBulletins ? (
                                <div className="flex items-center justify-center h-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                            ) : bulletins && bulletins.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 font-medium text-gray-500">Période</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-500">Base</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-500">Primes</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-500">Retenues</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-500">Net</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-500">Statut</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-500">PDF</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {bulletins.map((b: BulletinPaie) => (
                                                <tr key={b.id} className="hover:bg-gray-50">
                                                    <td className="py-3 px-4 font-medium">{b.mois}/{b.annee}</td>
                                                    <td className="py-3 px-4 text-right">{b.salaireBase?.toLocaleString('fr-FR')} F</td>
                                                    <td className="py-3 px-4 text-right text-green-600">+{b.primes?.toLocaleString('fr-FR')} F</td>
                                                    <td className="py-3 px-4 text-right text-red-600">−{b.deductions?.toLocaleString('fr-FR')} F</td>
                                                    <td className="py-3 px-4 text-right font-semibold">{b.salaireNet?.toLocaleString('fr-FR')} F</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge variant={b.statut === 'paye' ? 'success' : 'warning'}>{b.statut}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            onClick={() => window.open(`/api/personnel/bulletins/${b.id}/pdf`, '_blank')}
                                                            className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
                                                            title="Télécharger le bulletin"
                                                        >
                                                            <FileDown className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">Aucun bulletin de paie</p>
                            )}
                        </div>
                    </div>
                )}

                {ongletActif === 'affectations' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">Historique des affectations</h3>
                        </div>

                        {loadingAffectations ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            </div>
                        ) : affectations && affectations.length > 0 ? (
                            <div className="space-y-3">
                                {affectations.map((affectation: AffectationPoste) => (
                                    <div
                                        key={affectation.id}
                                        className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                    affectation.statut === 'ACTIF'
                                                        ? 'bg-green-100'
                                                        : 'bg-gray-100'
                                                }`}>
                                                    {affectation.statut === 'ACTIF'
                                                        ? <CheckCircle className="h-5 w-5 text-green-600" />
                                                        : <XCircle className="h-5 w-5 text-gray-400" />
                                                    }
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-gray-900">
                                                            {affectation.poste?.intitulé || 'Poste'}
                                                        </p>
                                                        <Badge
                                                            variant={affectation.statut === 'ACTIF' ? 'success' : 'secondary'}
                                                        >
                                                            {affectation.statut === 'ACTIF' ? 'Actif' : 'Terminé'}
                                                        </Badge>
                                                        {affectation.poste && (
                                                            <PosteCapaciteIndicator
                                                                occupantsCount={affectation.poste.occupantsCount}
                                                                nombrePostes={affectation.poste.nombrePostes}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {new Date(affectation.dateDebut).toLocaleDateString('fr-FR')}
                                                            {affectation.dateFin && (
                                                                <> → {new Date(affectation.dateFin).toLocaleDateString('fr-FR')}</>
                                                            )}
                                                        </span>
                                                        {affectation.poste?.uniteOrganisationnelle && (
                                                            <span className="flex items-center gap-1">
                                                                <Building className="h-3.5 w-3.5" />
                                                                {affectation.poste.uniteOrganisationnelle.nom}
                                                            </span>
                                                        )}
                                                        {affectation.contrat && (
                                                            <span className="flex items-center gap-1 text-blue-600">
                                                                <FileText className="h-3.5 w-3.5" />
                                                                Contrat {affectation.contrat.typeContrat}
                                                            </span>
                                                        )}
                                                        <span className="text-gray-400">
                                                            {affectation.typeMutation === 'NOUVELLE' ? 'Nouvelle' :
                                                             affectation.typeMutation === 'PROMOTION' ? 'Promotion' :
                                                             affectation.typeMutation === 'TRANSFERT' ? 'Transfert' :
                                                             affectation.typeMutation === 'INTERIM' ? 'Intérim' : 'Réintégration'}
                                                        </span>
                                                    </div>
                                                    {affectation.commentaire && (
                                                        <p className="text-sm text-gray-500 mt-1 italic">{affectation.commentaire}</p>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-600 mb-2">Aucune affectation enregistrée</p>
                                <p className="text-sm text-gray-500">Les affectations seront visibles ici une fois créées</p>
                            </div>
                        )}
                    </div>
                )}

                {ongletActif === 'heures-cours' && (
                    <TabHeureCours enseignantId={id} />
                )}

                {ongletActif === 'fonctions' && (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                        <TabFonctions membreId={id} />
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

            {showEditModal && (
                <PersonnelFormModal
                    mode="edition"
                    membre={membre}
                    onSuccess={() => setShowEditModal(false)}
                    onCancel={() => setShowEditModal(false)}
                />
            )}
        </div>
    );
}
