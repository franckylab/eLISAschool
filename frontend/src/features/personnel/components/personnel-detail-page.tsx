/**
 * ==================================
 * eLISAschool - Page Détail Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo, createElement } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    Mail, Phone, MapPin, Calendar, Briefcase, Users,
    Edit, Trash2, FileText, Award, Clock, Building2,
    UserCheck, AlertCircle, CheckCircle, XCircle, Building, FileDown,
    BookOpen, CalendarDays, Star, UserRound, Footprints, GraduationCap
} from 'lucide-react';
import { useMembrePersonnel, useSupprimerPersonnel, usePersonnelContrats, usePersonnelBulletins } from '../hooks/use-personnel';
import { useDocumentTitle } from '@/hooks';
import { usePermissions } from '@/hooks';
import { useAffectationsMembre } from '../hooks/use-affectations';
import { PersonnelFormModal } from './personnel-form-modal';
import { TabHeureCours } from './tab-heure-cours';
import { TabFonctions } from './tab-fonctions';
import { PosteCapaciteIndicator } from '@/features/postes/components/PosteCapaciteIndicator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { OngletMatieres } from '@/features/enseignants/components/enseignant-detail/onglet-matieres';
import { OngletEdt } from '@/features/enseignants/components/enseignant-detail/onglet-edt';
import { OngletEvaluations } from '@/features/enseignants/components/enseignant-detail/onglet-evaluations';
import { OngletAbsences } from '@/features/enseignants/components/enseignant-detail/onglet-absences';
import { OngletParcours } from '@/features/enseignants/components/enseignant-detail/onglet-parcours';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { LoadingState } from '@/components/ui/ErrorMessage';
import { getTypeColor, getTypeIcon } from '@/features/personnel/constants/type-personnel-colors';
import { InlineEditField, InlineEditActions } from './InlineEditField';
import { useModifierStatut, useModifierTypePersonnel, useModifierDateEntree, useModifierCompetences } from '../hooks/use-personnel-edit';
import { useTypesPersonnel } from '../hooks/use-types-personnel';
import type { ContratPersonnel, BulletinPaie } from '../types/personnel.types';
import type { AffectationPoste } from '../types/affectation.types';

type OngletActif = 'informations' | 'affectations' | 'matieres' | 'edt' | 'contrat-salaire' | 'heures-cours' | 'evaluations' | 'absences' | 'parcours' | 'fonctions' | 'documents';

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
    ACTIF: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
    INACTIF: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
    CONGE: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    actif: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
    inactif: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
    en_conge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    demission: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
};

export function PersonnelDetailPage() {
    const { id } = useParams({ from: '/_auth/personnel/$id' });
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');

    const [showEditModal, setShowEditModal] = useState(false);

    const { data: membre, isLoading } = useMembrePersonnel(id);
    useDocumentTitle(`eLISAschool | ${membre ? (membre.utilisateur?.profil?.prenom ?? '') + ' ' + (membre.utilisateur?.profil?.nom ?? '') : 'Détail personnel'}`);
    const supprimer = useSupprimerPersonnel();
    const { data: affectations, isLoading: loadingAffectations } = useAffectationsMembre(id);
    const { data: contrats, isLoading: loadingContrats } = usePersonnelContrats(id);
    const { data: bulletins, isLoading: loadingBulletins } = usePersonnelBulletins(id);

    // Calculer l'ancienneté
    const anciennete = membre ? Math.floor(
        (Date.now() - new Date(membre.dateEmbauche || '').getTime()) / (1000 * 60 * 60 * 24 * 365)
    ) : 0;

    const estEnseignant = membre?.typePersonnel?.code === 'ENSEIGNANT';

    // ─── Inline Editing ───
    const { hasPermission } = usePermissions();
    const canEditIdentity = hasPermission('personnel:edit:identity');
    const canEditType = hasPermission('personnel:edit:type');
    const canEditCompetences = hasPermission('personnel:edit:competences');

    const [editing, setEditing] = useState<string | null>(null); // field name being edited
    const [editValue, setEditValue] = useState<string>('');

    const modifierStatut = useModifierStatut();
    const modifierTypePersonnel = useModifierTypePersonnel();
    const modifierDateEntree = useModifierDateEntree();
    const modifierCompetences = useModifierCompetences();

    const { data: typesPersonnel } = useTypesPersonnel();

    const startEdit = (field: string, currentValue: string) => {
        setEditValue(currentValue);
        setEditing(field);
    };

    const cancelEdit = () => {
        setEditing(null);
        setEditValue('');
    };

    const onglets = useMemo(() => {
        const communs = [
            { id: 'informations' as const, label: 'Informations', icon: FileText },
            { id: 'affectations' as const, label: 'Affectations', icon: Briefcase },
            { id: 'contrat-salaire' as const, label: 'Contrat & Salaire', icon: FileText },
            { id: 'fonctions' as const, label: 'Fonctions', icon: Award },
        ];

        if (estEnseignant) {
            return [
                ...communs.slice(0, 2),
                { id: 'matieres' as const, label: 'Matières & Classes', icon: BookOpen },
                { id: 'edt' as const, label: 'Emploi du temps', icon: CalendarDays },
                ...communs.slice(2, 3),
                { id: 'heures-cours' as const, label: 'Heures de cours', icon: Clock },
                { id: 'evaluations' as const, label: 'Évaluations', icon: Star },
                { id: 'absences' as const, label: 'Absences', icon: UserRound },
                { id: 'parcours' as const, label: 'Parcours', icon: Footprints },
                ...communs.slice(3),
            ];
        }

        return [
            ...communs.slice(0, 3),
            { id: 'heures-cours' as const, label: 'Heures de cours', icon: Clock },
            ...communs.slice(3),
        ];
    }, [estEnseignant]);

    if (isLoading) {
        return <div className="p-6"><LoadingState message="Chargement du dossier personnel..." /></div>;
    }

    if (!membre) {
        return (
            <div className="flex flex-col items-center justify-center h-64 p-6">
                <AlertCircle className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-lg text-gray-600 dark:text-gray-300">Membre du personnel non trouvé</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/personnel' })} className="mt-4">
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                icon={<Users className="h-8 w-8 text-white" />}
                onBack={() => navigate({ to: '/personnel' })}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<Edit className="h-4 w-4" />}
                            onClick={() => setShowEditModal(true)}
                        >
                            Modifier
                        </ElisaButton>
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="h-4 w-4" />}
                            isLoading={supprimer.isPending}
                            onClick={() => {
                                if (confirm(`Supprimer ${membre.utilisateur?.profil?.prenom ?? ''} ${membre.utilisateur?.profil?.nom ?? ''} du personnel ?`)) {
                                    supprimer.mutateAsync(id).then(() => {
                                        navigate({ to: '/personnel' });
                                    });
                                }
                            }}
                        >
                            Supprimer
                        </ElisaButton>
                    </div>
                }
            >
                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
                        {(membre.utilisateur?.profil?.prenom ?? '')?.charAt(0)}{(membre.utilisateur?.profil?.nom ?? '')?.charAt(0)}
                    </div>

                    {/* Infos principales */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h1 className="text-3xl font-bold text-white">
                                {membre.utilisateur?.profil?.prenom ?? ''} {membre.utilisateur?.profil?.nom ?? ''}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${COULEURS_STATUT[membre.statut]}`}>
                                {LABELS_STATUT[membre.statut]}
                            </span>
                            {membre.typePersonnel && (
                                <span
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border"
                                    style={{
                                        backgroundColor: `${getTypeColor(membre.typePersonnel.code)}15`,
                                        borderColor: `${getTypeColor(membre.typePersonnel.code)}30`,
                                        color: getTypeColor(membre.typePersonnel.code),
                                    }}
                                >
                                    {createElement(getTypeIcon(membre.typePersonnel.code), { className: 'h-3.5 w-3.5' })}
                                    {membre.typePersonnel.nom}
                                </span>
                            )}
                        </div>

                        <p className="text-lg text-white/70 mb-3">{membre.posteExact ?? 'Enseignant'}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-white/60">
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                <span>{LABELS_TYPE_CONTRAT[contrats?.[0]?.typeContrat ?? 'cdi']}</span>
                            </div>
                            {(membre.departement ?? '') && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span>{membre.departement ?? ''}</span>
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
                            {membre.utilisateur && (
                                <div
                                    className="flex items-center gap-2 cursor-pointer hover:text-white/90 transition-colors"
                                    onClick={() => navigate({ to: '/utilisateurs/$id', params: { id: membre.utilisateur!.id }, search: {} as any })}
                                >
                                    <UserCheck className="h-4 w-4" />
                                    <span className="underline underline-offset-2 decoration-dotted">
                                        {membre.utilisateur.email}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Stats rapides — édition inline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Statut */}
                <div className="group">
                    <InlineEditField
                        label="Statut"
                        value={
                            <span className={`px-2.5 py-1 rounded-full text-sm font-medium border inline-block ${COULEURS_STATUT[membre.statut]}`}>
                                {LABELS_STATUT[membre.statut]}
                            </span>
                        }
                        icon={UserCheck}
                        color="#22c55e"
                        editable={canEditIdentity}
                        editing={editing === 'statut'}
                        onStartEdit={() => startEdit('statut', membre.statut)}
                    >
                        <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-900"
                            autoFocus
                        >
                            <option value="ACTIF">Actif</option>
                            <option value="INACTIF">Inactif</option>
                            <option value="CONGE">En congé</option>
                        </select>
                        <InlineEditActions
                            onSave={() => {
                                modifierStatut.mutate({ id, statut: editValue });
                                cancelEdit();
                            }}
                            onCancel={cancelEdit}
                            saving={modifierStatut.isPending}
                        />
                    </InlineEditField>
                </div>

                {/* Type personnel */}
                <div className="group">
                    <InlineEditField
                        label="Type"
                        value={
                            membre.typePersonnel ? (
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: `${getTypeColor(membre.typePersonnel.code)}dd` }}>
                                    {createElement(getTypeIcon(membre.typePersonnel.code), { className: 'h-4 w-4' })}
                                    {membre.typePersonnel.nom}
                                </span>
                            ) : 'Non défini'
                        }
                        icon={GraduationCap}
                        color="#a855f7"
                        editable={canEditType}
                        editing={editing === 'typePersonnel'}
                        onStartEdit={() => startEdit('typePersonnel', membre.typePersonnelId ?? '')}
                    >
                        <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-900"
                            autoFocus
                        >
                            <option value="">Sélectionner un type</option>
                            {typesPersonnel?.filter((t: any) => t.actif).map((tp: any) => (
                                <option key={tp.id} value={tp.id}>
                                    {tp.nom} ({tp.code})
                                </option>
                            ))}
                        </select>
                        <InlineEditActions
                            onSave={() => {
                                if (editValue) modifierTypePersonnel.mutate({ id, typePersonnelId: editValue });
                                cancelEdit();
                            }}
                            onCancel={cancelEdit}
                            saving={modifierTypePersonnel.isPending}
                            disabled={!editValue}
                        />
                    </InlineEditField>
                </div>

                {/* Date d'entrée */}
                <div className="group">
                    <InlineEditField
                        label="Date d'embauche"
                        value={new Date(membre.dateEmbauche || '').toLocaleDateString('fr-FR')}
                        icon={Calendar}
                        color="#3b82f6"
                        editable={canEditIdentity}
                        editing={editing === 'dateEntree'}
                        onStartEdit={() => startEdit('dateEntree', (membre.dateEmbauche || '').split('T')[0])}
                    >
                        <input
                            type="date"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                        />
                        <InlineEditActions
                            onSave={() => {
                                modifierDateEntree.mutate({ id, dateEmbauche: editValue });
                                cancelEdit();
                            }}
                            onCancel={cancelEdit}
                            saving={modifierDateEntree.isPending}
                        />
                    </InlineEditField>
                </div>

                {/* Qualification */}
                <div className="group">
                    <InlineEditField
                        label="Qualification"
                        value={(membre.diplomes || '') || 'Non spécifié'}
                        icon={Award}
                        color="#f97316"
                        editable={canEditCompetences}
                        editing={editing === 'diplomes'}
                        onStartEdit={() => startEdit('diplomes', membre.diplomes || '')}
                    >
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Diplôme ou qualification"
                            autoFocus
                        />
                        <InlineEditActions
                            onSave={() => {
                                modifierCompetences.mutate({ id, diplomes: editValue });
                                cancelEdit();
                            }}
                            onCancel={cancelEdit}
                            saving={modifierCompetences.isPending}
                        />
                    </InlineEditField>
                </div>

                {/* Spécialité */}
                <div className="group">
                    <InlineEditField
                        label="Spécialité"
                        value={(membre.specialitePrincipale ?? membre.specialites?.[0] ?? '') || 'Non spécifié'}
                        icon={Star}
                        color="#06b6d4"
                        editable={canEditCompetences}
                        editing={editing === 'specialite'}
                        onStartEdit={() => startEdit('specialite', membre.specialitePrincipale ?? membre.specialites?.[0] ?? '')}
                    >
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="Spécialité principale"
                            autoFocus
                        />
                        <InlineEditActions
                            onSave={() => {
                                modifierCompetences.mutate({ id, specialitePrincipale: editValue || undefined });
                                cancelEdit();
                            }}
                            onCancel={cancelEdit}
                            saving={modifierCompetences.isPending}
                        />
                    </InlineEditField>
                </div>
            </div>

            {/* Onglets */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex gap-6">
                    {onglets.map((onglet) => {
                        const Icon = onglet.icon;
                        return (
                            <button
                                key={onglet.id}
                                onClick={() => setOngletActif(onglet.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    ongletActif === onglet.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
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
                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Informations personnelles
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de naissance</dt>
                                    <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                        {new Date(membre.utilisateur?.profil?.dateNaissance ?? '').toLocaleDateString('fr-FR')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Sexe</dt>
                                    <dd className="mt-1 text-gray-900 dark:text-gray-100">{membre.utilisateur?.profil?.genre === 'M' ? 'Masculin' : 'Féminin'}</dd>
                                </div>
                                {(membre.specialites?.[0] ?? '') && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Spécialité</dt>
                                        <dd className="mt-1 text-gray-900 dark:text-gray-100">{membre.specialites?.[0] ?? ''}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Contact */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                                Coordonnées
                            </h3>
                            <dl className="space-y-4">
                                {(membre.utilisateur?.email ?? '') && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                                            <dd className="text-gray-900 dark:text-gray-100">{membre.utilisateur?.email ?? ''}</dd>
                                        </div>
                                    </div>
                                )}
                                {(membre.utilisateur?.profil?.telephone ?? '') && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</dt>
                                            <dd className="text-gray-900 dark:text-gray-100">{membre.utilisateur?.profil?.telephone ?? ''}</dd>
                                        </div>
                                    </div>
                                )}
                                {(membre.utilisateur?.profil?.adresse ?? '') && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-1" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresse</dt>
                                            <dd className="text-gray-900 dark:text-gray-100">{membre.utilisateur?.profil?.adresse ?? ''}</dd>
                                        </div>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Informations professionnelles */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                Informations professionnelles
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Poste</dt>
                                    <dd className="mt-1 text-gray-900 dark:text-gray-100">{membre.posteExact ?? 'Enseignant'}</dd>
                                </div>
                                {(membre.departement ?? '') && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Département</dt>
                                        <dd className="mt-1 text-gray-900 dark:text-gray-100">{membre.departement ?? ''}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type de contrat</dt>
                                    <dd className="mt-1">
                                        <span className="px-2 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                            {LABELS_TYPE_CONTRAT[contrats?.[0]?.typeContrat ?? 'cdi']}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date d'embauche</dt>
                                    <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                        {new Date(membre.dateEmbauche || '').toLocaleDateString('fr-FR')}
                                    </dd>
                                </div>
                                { (contrats?.[0]?.dateFin && new Date(contrats[0].dateFin) < new Date()) && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de sortie</dt>
                                        <dd className="mt-1 text-red-600 dark:text-red-400 font-medium">
                                            {new Date(contrats[0].dateFin).toLocaleDateString('fr-FR')}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Métadonnées */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                Métadonnées
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Créé le</dt>
                                    <dd className="mt-1 text-gray-900 dark:text-gray-100">
                                        {new Date(membre.createdAt).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Dernière modification</dt>
                                    <dd className="mt-1 text-gray-900 dark:text-gray-100">
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
                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold mb-4">Contrats</h3>
                            {loadingContrats ? (
                                <div className="flex items-center justify-center h-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                            ) : contrats && contrats.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Type</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Poste</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Fonction</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Mode</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Période</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Salaire</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {contrats.map((c: ContratPersonnel) => (
                                                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="py-3 px-4 font-medium">{c.typeContrat}</td>
                                                    <td className="py-3 px-4">
                                                        {c.posteId ? (
                                                            <a href={`/organisation/postes/${c.posteId}`} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline">
                                                                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate max-w-[120px]">{c.poste?.intitule || c.posteId?.slice(0, 8)}</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400 dark:text-gray-500 italic">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {c.fonctionId ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-xs font-medium">
                                                                {c.fonction?.nom || c.fonctionId?.slice(0, 8)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 dark:text-gray-500 italic">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4"><Badge variant={c.statut === 'ACTIF' ? 'success' : 'default'}>{MODE_LABEL[c.modeRemuneration as string] || c.modeRemuneration || '—'}</Badge></td>
                                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                                                        <span className="text-xs">{new Date(c.dateDebut).toLocaleDateString('fr-FR')}</span>
                                                        {c.dateFin && <><span className="text-gray-300 mx-1">→</span><span className="text-xs">{new Date(c.dateFin).toLocaleDateString('fr-FR')}</span></>}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="font-medium">{c.salaireBase?.toLocaleString('fr-FR')} F</div>
                                                        {c.tarifHoraire && <div className="text-xs text-gray-400 dark:text-gray-500">{c.tarifHoraire.toLocaleString('fr-FR')} F/h</div>}
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
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucun contrat enregistré</p>
                            )}
                        </div>

                        {/* Bulletins de paie */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold mb-4">Bulletins de paie</h3>
                            {loadingBulletins ? (
                                <div className="flex items-center justify-center h-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                            ) : bulletins && bulletins.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Période</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Base</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Primes</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Retenues</th>
                                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Net</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">PDF</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {bulletins.map((b: BulletinPaie) => (
                                                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="py-3 px-4 font-medium">{b.mois}/{b.annee}</td>
                                                    <td className="py-3 px-4 text-right">{b.salaireBase?.toLocaleString('fr-FR')} F</td>
                                                    <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">+{b.primes?.toLocaleString('fr-FR')} F</td>
                                                    <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">−{b.deductions?.toLocaleString('fr-FR')} F</td>
                                                    <td className="py-3 px-4 text-right font-semibold">{b.salaireNet?.toLocaleString('fr-FR')} F</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge variant={b.statut === 'paye' ? 'success' : 'warning'}>{b.statut}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            onClick={() => window.open(`/api/personnel/bulletins/${b.id}/pdf`, '_blank')}
                                                            className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
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
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucun bulletin de paie</p>
                            )}
                        </div>
                    </div>
                )}

                {ongletActif === 'affectations' && (
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
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
                                        className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                    affectation.statut === 'ACTIF'
                                                        ? 'bg-green-100 dark:bg-green-900/30'
                                                        : 'bg-gray-100 dark:bg-gray-800'
                                                }`}>
                                                    {affectation.statut === 'ACTIF'
                                                        ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                        : <XCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                                    }
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                                            {affectation.poste?.intitule || 'Poste'}
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
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
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
                                                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                                                <FileText className="h-3.5 w-3.5" />
                                                                Contrat {affectation.contrat.typeContrat}
                                                            </span>
                                                        )}
                                                        <span className="text-gray-400 dark:text-gray-500">
                                                            {affectation.typeMutation === 'NOUVELLE' ? 'Nouvelle' :
                                                             affectation.typeMutation === 'PROMOTION' ? 'Promotion' :
                                                             affectation.typeMutation === 'TRANSFERT' ? 'Transfert' :
                                                             affectation.typeMutation === 'INTERIM' ? 'Intérim' : 'Réintégration'}
                                                        </span>
                                                    </div>
                                                    {affectation.commentaire && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">{affectation.commentaire}</p>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <Briefcase className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                                <p className="text-gray-600 dark:text-gray-300 mb-2">Aucune affectation enregistrée</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Les affectations seront visibles ici une fois créées</p>
                            </div>
                        )}
                    </div>
                )}

                {ongletActif === 'matieres' && (
                    <ErrorBoundary key="matieres">
                        <OngletMatieres enseignantId={id} isActive />
                    </ErrorBoundary>
                )}

                {ongletActif === 'edt' && (
                    <ErrorBoundary key="edt">
                        <OngletEdt enseignantId={id} isActive />
                    </ErrorBoundary>
                )}

                {ongletActif === 'heures-cours' && (
                    <TabHeureCours enseignantId={id} />
                )}

                {ongletActif === 'evaluations' && (
                    <ErrorBoundary key="evaluations">
                        <OngletEvaluations enseignantId={id} isActive />
                    </ErrorBoundary>
                )}

                {ongletActif === 'absences' && (
                    <ErrorBoundary key="absences">
                        <OngletAbsences enseignantId={id} isActive />
                    </ErrorBoundary>
                )}

                {ongletActif === 'parcours' && (
                    <ErrorBoundary key="parcours">
                        <OngletParcours enseignantId={id} isActive />
                    </ErrorBoundary>
                )}

                {ongletActif === 'fonctions' && (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                        <TabFonctions membreId={id} />
                    </div>
                )}

                {ongletActif === 'documents' && (
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">Documents et certifications</h3>
                            <ElisaButton variant="primary" size="sm" icon={<Award className="h-4 w-4" />}>
                                Ajouter un document
                            </ElisaButton>
                        </div>
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Award className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-600 dark:text-gray-300 mb-2">Aucun document uploadé</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">CV, diplômes, certificats seront visibles ici</p>
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
