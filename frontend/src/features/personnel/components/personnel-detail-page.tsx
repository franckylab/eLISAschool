/**
 * ==================================
 * eLISAschool - Page Détail Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Mail, Phone, MapPin, Calendar, Briefcase, Users,
    Edit, Trash2, FileText, Award, Clock, Building2,
    UserCheck, AlertCircle, CheckCircle, XCircle, Building, FileDown,
    BookOpen, CalendarDays, Star, UserRound, Footprints, GraduationCap, History, ShieldCheck,
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
import { TabsBar } from '@/components/ui/Tabs';
import type { Tab } from '@/components/ui/Tabs';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { OngletMatieres } from './onglets/onglet-matieres';
import { OngletEdt } from './onglets/onglet-edt';
import { OngletEvaluations } from './onglets/onglet-evaluations';
import { OngletAbsences } from './onglets/onglet-absences';
import { OngletParcours } from './onglets/onglet-parcours';
import { AuditTimeline } from '@/components/ui/AuditTimeline';
import { ValidationTimeline } from '@/components/ui/ValidationTimeline';
import { ValidationActions } from '@/components/ui/ValidationActions';
import { useWorkflowByEntite } from '@/hooks/use-validation-workflow';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { SchoolLoading } from '@/components/feedback';
import { getCategorieColors } from '@/lib/categorie-fonction';
import { formatDate } from '@/lib/date-utils';
import { formatMontant } from '@/lib/format-utils';
import { InlineEditField, InlineEditActions } from './InlineEditField';
import { useModifierStatut, useModifierDateEntree, useModifierCompetences } from '../hooks/use-personnel-edit';
import type { ContratPersonnel, BulletinPaie } from '../types/personnel.types';
import type { AffectationPoste } from '../types/affectation.types';

type OngletActif = 'informations' | 'affectations' | 'matieres' | 'edt' | 'contrat-salaire' | 'heures-cours' | 'evaluations' | 'absences' | 'parcours' | 'fonctions' | 'historique' | 'validation';

const STATUT_KEY: Record<string, string> = {
    ACTIF: 'ACTIF',
    INACTIF: 'INACTIF',
    CONGE: 'CONGE',
    actif: 'ACTIF',
    inactif: 'INACTIF',
    en_conge: 'CONGE',
    demission: 'DEMISSION',
};

const COULEURS_STATUT: Record<string, string> = {
    ACTIF: 'bg-success/10 text-success border-success/20',
    INACTIF: 'bg-muted text-muted-foreground border-border',
    CONGE: 'bg-primary/10 text-primary border-primary/20',
    DEMISSION: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function PersonnelDetailPage() {
    const { t } = useTranslation('personnel');
    const { id } = useParams({ from: '/_auth/personnel/$id' });
    const navigate = useNavigate();
    const search = useSearch({ from: '/_auth/personnel/$id' }) as { tab?: string };
    const ongletActif = (search.tab && (search.tab as OngletActif)) || 'informations';
    const setOngletActif = (tab: string) => navigate({ search: { tab } as never });

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const labelStatut = (statut: string) => t(`statut_${STATUT_KEY[statut] ?? statut}`, { defaultValue: statut });
    const labelCategorie = (categorie: string) => t(`categorie_${categorie}`, { defaultValue: categorie });
    const labelTypeContrat = (code?: string) => {
        const c = code ?? 'cdi';
        return t(`typesContrats.${c.toLowerCase()}`, { defaultValue: c });
    };
    const labelMode = (code?: string | null) => (code ? t(`modes.${code}`, { defaultValue: code }) : '—');

    const { data: membre, isLoading } = useMembrePersonnel(id);
    useDocumentTitle(`eLISAschool | ${membre ? (membre.utilisateur?.profil?.prenom ?? '') + ' ' + (membre.utilisateur?.profil?.nom ?? '') : t('detail.titreParDefaut')}`);
    const supprimer = useSupprimerPersonnel();
    const { data: affectations, isLoading: loadingAffectations } = useAffectationsMembre(id);
    const { data: contrats, isLoading: loadingContrats } = usePersonnelContrats(id);
    const { data: bulletins, isLoading: loadingBulletins } = usePersonnelBulletins(id);

    // Calculer l'ancienneté
    const anciennete = membre ? Math.floor(
        (Date.now() - new Date(membre.dateEmbauche || '').getTime()) / (1000 * 60 * 60 * 24 * 365)
    ) : 0;

    const estEnseignant = membre?.estEnseignant === true;

    // ─── Inline Editing ───
    const { hasPermission } = usePermissions();
    const canEditIdentity = hasPermission('personnel:edit:identity');
    const canEditCompetences = hasPermission('personnel:edit:competences');

    const peutValider = hasPermission('personnel:validate');
    const workflowQuery = useWorkflowByEntite('personnel', id);

    const [editing, setEditing] = useState<string | null>(null); // field name being edited
    const [editValue, setEditValue] = useState<string>('');

    const modifierStatut = useModifierStatut();
    const modifierDateEntree = useModifierDateEntree();
    const modifierCompetences = useModifierCompetences();

    const startEdit = (field: string, currentValue: string) => {
        setEditValue(currentValue);
        setEditing(field);
    };

    const cancelEdit = () => {
        setEditing(null);
        setEditValue('');
    };

    const onglets: Tab[] = useMemo(() => {
        const communs: Tab[] = [
            { id: 'informations', label: t('detail.ongletInformations'), icon: FileText },
            { id: 'affectations', label: t('detail.ongletAffectations'), icon: Briefcase },
            { id: 'contrat-salaire', label: t('detail.ongletContratSalaire'), icon: FileText },
            { id: 'fonctions', label: t('detail.ongletFonctions'), icon: Award },
        ];

        const canAudit = hasPermission('audit:personnel:view') || hasPermission('audit:view');
        const historiqueTab: Tab[] = canAudit
            ? [{ id: 'historique', label: t('detail.ongletHistorique'), icon: History }]
            : [];
        const validationTab: Tab[] = peutValider
            ? [{ id: 'validation', label: t('detail.ongletValidation'), icon: ShieldCheck }]
            : [];

        if (estEnseignant) {
            return [
                ...communs.slice(0, 2),
                { id: 'matieres', label: t('detail.ongletMatieres'), icon: BookOpen },
                { id: 'edt', label: t('detail.ongletEdt'), icon: CalendarDays },
                ...communs.slice(2, 3),
                ...validationTab,
                { id: 'heures-cours', label: t('detail.ongletHeuresCours'), icon: Clock },
                { id: 'evaluations', label: t('detail.ongletEvaluations'), icon: Star },
                { id: 'absences', label: t('detail.ongletAbsences'), icon: UserRound },
                { id: 'parcours', label: t('detail.ongletParcours'), icon: Footprints },
                ...communs.slice(3),
                ...historiqueTab,
            ];
        }

        return [
            ...communs.slice(0, 3),
            ...validationTab,
            { id: 'heures-cours', label: t('detail.ongletHeuresCours'), icon: Clock },
            ...communs.slice(3),
            ...historiqueTab,
        ];
    }, [estEnseignant, t, hasPermission, peutValider]);

    if (isLoading) {
        return <SchoolLoading message={t('detail.chargement')} />;
    }

    if (!membre) {
        return (
            <div className="flex flex-col items-center justify-center h-64 p-6">
                <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg text-secondary">{t('detail.nonTrouve')}</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/personnel' })} className="mt-4">
                    {t('detail.retourListe')}
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                icon={Users}
                onBack={() => navigate({ to: '/personnel' })}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<Edit className="h-4 w-4" />}
                            onClick={() => setShowEditModal(true)}
                        >
                            {t('detail.modifier')}
                        </ElisaButton>
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="h-4 w-4" />}
                            isLoading={supprimer.isPending}
                            onClick={() => setShowDeleteModal(true)}
                        >
                            {t('detail.supprimer')}
                        </ElisaButton>
                    </div>
                }
            >
                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-dominant-500)] to-[var(--color-accent-600)] flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
                        {(membre.utilisateur?.profil?.prenom ?? '')?.charAt(0)}{(membre.utilisateur?.profil?.nom ?? '')?.charAt(0)}
                    </div>

                    {/* Infos principales */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h1 className="text-3xl font-bold text-white">
                                {membre.utilisateur?.profil?.prenom ?? ''} {membre.utilisateur?.profil?.nom ?? ''}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${COULEURS_STATUT[membre.statut]}`}>
                                {labelStatut(membre.statut)}
                            </span>
                            {membre.categorie && (() => {
                                const colors = getCategorieColors(membre.categorie);
                                return (
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                                        <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                                        {labelCategorie(membre.categorie)}
                                    </span>
                                );
                            })()}
                        </div>

                        <p className="text-lg text-white/70 mb-3">{membre.posteExact ?? t('detail.enseignant')}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-white/60">
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                <span>{labelTypeContrat(contrats?.[0]?.typeContrat)}</span>
                            </div>
                            {(membre.departement ?? '') && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    <span>{membre.departement ?? ''}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{t('detail.anciennete', { count: anciennete })}</span>
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
                                    onClick={() => navigate({ to: '/utilisateurs/$id', params: { id: membre.utilisateur!.id }, search: {} as never })}
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
                        label={t('statut')}
                        value={
                            <span className={`px-2.5 py-1 rounded-full text-sm font-medium border inline-block ${COULEURS_STATUT[membre.statut]}`}>
                                {labelStatut(membre.statut)}
                            </span>
                        }
                        icon={UserCheck}
                        editable={canEditIdentity}
                        editing={editing === 'statut'}
                        onStartEdit={() => startEdit('statut', membre.statut)}
                    >
                        <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-text)]"
                            autoFocus
                        >
                            <option value="ACTIF">{t('statut_ACTIF')}</option>
                            <option value="INACTIF">{t('statut_INACTIF')}</option>
                            <option value="CONGE">{t('statut_CONGE')}</option>
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

                {/* Catégorie (dérivée de la fonction — lecture seule) */}
                <div className="group">
                    <InlineEditField
                        label={t('categorie')}
                        value={
                            membre.categorie ? (() => {
                                const colors = getCategorieColors(membre.categorie);
                                return (
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${colors.bg} ${colors.text}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                                        {labelCategorie(membre.categorie)}
                                    </span>
                                );
                            })() : t('detail.nonDefinie')
                        }
                        icon={GraduationCap}
                        editable={false}
                        editing={false}
                    >
                        {null}
                    </InlineEditField>
                </div>

                {/* Date d'entrée */}
                <div className="group">
                    <InlineEditField
                        label={t('detail.dateEmbauche')}
                        value={formatDate(membre.dateEmbauche || '')}
                        icon={Calendar}
                        editable={canEditIdentity}
                        editing={editing === 'dateEntree'}
                        onStartEdit={() => startEdit('dateEntree', (membre.dateEmbauche || '').split('T')[0])}
                    >
                        <input
                            type="date"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-text)]"
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
                        label={t('qualification')}
                        value={(membre.diplomes || '') || t('detail.nonSpecifie')}
                        icon={Award}
                        editable={canEditCompetences}
                        editing={editing === 'diplomes'}
                        onStartEdit={() => startEdit('diplomes', membre.diplomes || '')}
                    >
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-text)]"
                            placeholder={t('detail.placeholderDiplome')}
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
                        label={t('specialite')}
                        value={(membre.specialitePrincipale ?? membre.specialites?.[0] ?? '') || t('detail.nonSpecifie')}
                        icon={Star}
                        editable={canEditCompetences}
                        editing={editing === 'specialite'}
                        onStartEdit={() => startEdit('specialite', membre.specialitePrincipale ?? membre.specialites?.[0] ?? '')}
                    >
                        <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-[var(--color-dominant-500)] bg-[var(--color-surface)] text-[var(--color-text)]"
                            placeholder={t('detail.placeholderSpecialite')}
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
            <TabsBar tabs={onglets} activeTab={ongletActif} onTabChange={setOngletActif} variant="underline" scrollable />

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
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-primary" />
                                {t('detail.infosPersonnelles')}
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">{t('detail.dateNaissance')}</dt>
                                    <dd className="mt-1 text-foreground">
                                        {formatDate(membre.utilisateur?.profil?.dateNaissance ?? '')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">{t('detail.sexe')}</dt>
                                    <dd className="mt-1 text-foreground">{membre.utilisateur?.profil?.genre === 'M' ? t('detail.masculin') : t('detail.feminin')}</dd>
                                </div>
                                {(membre.specialites?.[0] ?? '') && (
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">{t('specialite')}</dt>
                                        <dd className="mt-1 text-foreground">{membre.specialites?.[0] ?? ''}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Contact */}
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-success" />
                                {t('detail.coordonnees')}
                            </h3>
                            <dl className="space-y-4">
                                {(membre.utilisateur?.email ?? '') && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">{t('detail.email')}</dt>
                                            <dd className="text-foreground">{membre.utilisateur?.email ?? ''}</dd>
                                        </div>
                                    </div>
                                )}
                                {(membre.utilisateur?.profil?.telephone ?? '') && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">{t('detail.telephone')}</dt>
                                            <dd className="text-foreground">{membre.utilisateur?.profil?.telephone ?? ''}</dd>
                                        </div>
                                    </div>
                                )}
                                {(membre.utilisateur?.profil?.adresse ?? '') && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                                        <div>
                                            <dt className="text-sm font-medium text-muted-foreground">{t('detail.adresse')}</dt>
                                            <dd className="text-foreground">{membre.utilisateur?.profil?.adresse ?? ''}</dd>
                                        </div>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Informations professionnelles */}
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-accent" />
                                {t('detail.infosProfessionnelles')}
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">{t('poste')}</dt>
                                    <dd className="mt-1 text-foreground">{membre.posteExact ?? t('detail.enseignant')}</dd>
                                </div>
                                {(membre.departement ?? '') && (
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">{t('departement')}</dt>
                                        <dd className="mt-1 text-foreground">{membre.departement ?? ''}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">{t('typeContrat')}</dt>
                                    <dd className="mt-1">
                                        <span className="px-2 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                                            {labelTypeContrat(contrats?.[0]?.typeContrat)}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">{t('detail.dateEmbauche')}</dt>
                                    <dd className="mt-1 text-foreground">
                                        {formatDate(membre.dateEmbauche || '')}
                                    </dd>
                                </div>
                                { (contrats?.[0]?.dateFin && new Date(contrats[0].dateFin) < new Date()) && (
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">{t('detail.dateSortie')}</dt>
                                        <dd className="mt-1 text-destructive font-medium">
                                            {formatDate(contrats[0].dateFin)}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Métadonnées */}
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-[var(--color-warning)]" />
                                {t('detail.metadonnees')}
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">{t('detail.creeLe')}</dt>
                                    <dd className="mt-1 text-foreground">
                                        {formatDate(membre.createdAt, 'dd MMMM yyyy')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">{t('detail.derniereModification')}</dt>
                                    <dd className="mt-1 text-foreground">
                                        {formatDate(membre.updatedAt, 'dd MMMM yyyy')}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                {ongletActif === 'contrat-salaire' && (
                    <div className="space-y-6">
                        {/* Contrats */}
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h3 className="text-lg font-semibold mb-4">{t('detail.contrats')}</h3>
                            {loadingContrats ? (
                                <SchoolLoading variant="compact" message={t('detail.chargementContrats')} />
                            ) : contrats && contrats.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('detail.colType')}</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('detail.colPoste')}</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('detail.colFonction')}</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('detail.colMode')}</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('detail.colPeriode')}</th>
                                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('detail.colSalaire')}</th>
                                                <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('detail.colStatut')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {contrats.map((c: ContratPersonnel) => (
                                                <tr key={c.id} className="hover:bg-muted">
                                                    <td className="py-3 px-4 font-medium">{c.typeContrat}</td>
                                                    <td className="py-3 px-4">
                                                        {c.posteId ? (
                                                            <a href={`/organisation/postes/${c.posteId}`} className="flex items-center gap-1.5 text-primary hover:underline">
                                                                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate max-w-[120px]">{c.poste?.intitule || c.posteId?.slice(0, 8)}</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {c.fonctionId ? (
                                                            <span className="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-xs font-medium">
                                                                {c.fonction?.nom || c.fonctionId?.slice(0, 8)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4"><Badge variant={c.statut === 'ACTIF' ? 'success' : 'default'}>{labelMode(c.modeRemuneration?.code)}</Badge></td>
                                                    <td className="py-3 px-4 text-secondary">
                                                        <span className="text-xs">{formatDate(c.dateDebut)}</span>
                                                        {c.dateFin && <><span className="text-muted-foreground mx-1">→</span><span className="text-xs">{formatDate(c.dateFin)}</span></>}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="font-medium">{formatMontant(c.salaireBase)}</div>
                                                        {c.tarifHoraire && <div className="text-xs text-muted-foreground">{formatMontant(c.tarifHoraire)}/h</div>}
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
                                <p className="text-muted-foreground text-center py-8">{t('detail.aucunContrat')}</p>
                            )}
                        </div>

                        {/* Bulletins de paie */}
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h3 className="text-lg font-semibold mb-4">{t('detail.bulletinsPaie')}</h3>
                            {loadingBulletins ? (
                                <SchoolLoading variant="compact" message={t('detail.chargementBulletins', 'Chargement des bulletins...')} />
                            ) : bulletins && bulletins.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('detail.colPeriode')}</th>
                                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('detail.colBase')}</th>
                                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('detail.colPrimes')}</th>
                                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('detail.colRetenues')}</th>
                                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('detail.colNet')}</th>
                                                <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('detail.colStatut')}</th>
                                                <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('detail.colPdf')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {bulletins.map((b: BulletinPaie) => (
                                                <tr key={b.id} className="hover:bg-muted">
                                                    <td className="py-3 px-4 font-medium">{b.mois}/{b.annee}</td>
                                                    <td className="py-3 px-4 text-right">{formatMontant(b.salaireBase)}</td>
                                                    <td className="py-3 px-4 text-right text-success">+{formatMontant(b.primes)}</td>
                                                    <td className="py-3 px-4 text-right text-destructive">−{formatMontant(b.deductions)}</td>
                                                    <td className="py-3 px-4 text-right font-semibold">{formatMontant(b.salaireNet)}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge variant={b.statut === 'paye' ? 'success' : 'warning'}>{b.statut}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            onClick={() => window.open(`/api/personnel/bulletins/${b.id}/pdf`, '_blank')}
                                                            className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
                                                            title={t('detail.telechargerBulletin')}
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
                                <p className="text-muted-foreground text-center py-8">{t('detail.aucunBulletin')}</p>
                            )}
                        </div>
                    </div>
                )}

                {ongletActif === 'affectations' && (
                    <div className="bg-card rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">{t('detail.historiqueAffectations')}</h3>
                        </div>

                        {loadingAffectations ? (
                            <SchoolLoading variant="compact" message={t('detail.chargementAffectations', 'Chargement des affectations...')} />
                        ) : affectations && affectations.length > 0 ? (
                            <div className="space-y-3">
                                {affectations.map((affectation: AffectationPoste) => (
                                    <div
                                        key={affectation.id}
                                        className="p-4 rounded-lg border border-border hover:border-border transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                    affectation.statut === 'ACTIF'
                                                        ? 'bg-success/10'
                                                        : 'bg-muted'
                                                }`}>
                                                    {affectation.statut === 'ACTIF'
                                                        ? <CheckCircle className="h-5 w-5 text-success" />
                                                        : <XCircle className="h-5 w-5 text-muted-foreground" />
                                                    }
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-foreground">
                                                            {affectation.poste?.intitule || t('poste')}
                                                        </p>
                                                        <Badge
                                                            variant={affectation.statut === 'ACTIF' ? 'success' : 'secondary'}
                                                        >
                                                            {affectation.statut === 'ACTIF' ? t('detail.affectationActive') : t('detail.affectationTerminee')}
                                                        </Badge>
                                                        {affectation.poste && (
                                                            <PosteCapaciteIndicator
                                                                occupantsCount={affectation.poste.occupantsCount}
                                                                nombrePostes={affectation.poste.nombrePostes}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {formatDate(affectation.dateDebut)}
                                                            {affectation.dateFin && (
                                                                <> → {formatDate(affectation.dateFin)}</>
                                                            )}
                                                        </span>
                                                        {affectation.poste?.uniteOrganisationnelle && (
                                                            <span className="flex items-center gap-1">
                                                                <Building className="h-3.5 w-3.5" />
                                                                {affectation.poste.uniteOrganisationnelle.nom}
                                                            </span>
                                                        )}
                                                        {affectation.contrat && (
                                                            <span className="flex items-center gap-1 text-primary">
                                                                <FileText className="h-3.5 w-3.5" />
                                                                {t('detail.contratType', { type: affectation.contrat.typeContrat })}
                                                            </span>
                                                        )}
                                                        <span className="text-muted-foreground">
                                                            {t(`detail.mutation_${affectation.typeMutation}`, { defaultValue: affectation.typeMutation })}
                                                        </span>
                                                    </div>
                                                    {affectation.commentaire && (
                                                        <p className="text-sm text-muted-foreground mt-1 italic">{affectation.commentaire}</p>
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-muted rounded-lg">
                                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-secondary mb-2">{t('detail.aucuneAffectation')}</p>
                                <p className="text-sm text-muted-foreground">{t('detail.aucuneAffectationDesc')}</p>
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
                    <ErrorBoundary key="heures-cours">
                        <TabHeureCours enseignantId={id} />
                    </ErrorBoundary>
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

                {ongletActif === 'historique' && (
                    <Card>
                        <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                            <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                <History className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
                                {t('detail.ongletHistorique')}
                            </h3>
                            <div className="border-b border-border mb-4" />
                            <AuditTimeline cible="MembrePersonnel" cibleId={id} module="personnel" />
                        </div>
                    </Card>
                )}

                {ongletActif === 'validation' && peutValider && (
                    <Card>
                        <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                            <h3 className="flex items-center gap-[var(--gap-xs)] text-base font-semibold text-foreground mb-4">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                {t('detail.validation')}
                            </h3>
                            <div className="border-b border-border mb-6" />
                            {workflowQuery.isLoading ? (
                                <p className="text-sm text-muted-foreground">{t('detail.chargement')}</p>
                            ) : workflowQuery.data ? (
                                <>
                                    <ValidationTimeline
                                        historique={workflowQuery.data.historique}
                                        niveauxRequis={workflowQuery.data.niveauxRequis}
                                        niveauActuel={workflowQuery.data.niveauActuel}
                                        statut={workflowQuery.data.statut}
                                        className="mb-6"
                                    />
                                    <ValidationActions
                                        workflowId={workflowQuery.data.id}
                                        statut={workflowQuery.data.statut}
                                        niveauActuel={workflowQuery.data.niveauActuel}
                                        niveauxRequis={workflowQuery.data.niveauxRequis}
                                        module="personnel"
                                        onValidated={() => workflowQuery.refetch()}
                                    />
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t('validation.aucunWorkflow')}</p>
                            )}
                        </div>
                    </Card>
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

            <ConfirmationModal
                isOpen={showDeleteModal}
                title={t('detail.confirmSuppressionTitre')}
                message={t('detail.confirmSuppressionMessage', { nom: `${membre.utilisateur?.profil?.prenom ?? ''} ${membre.utilisateur?.profil?.nom ?? ''}`.trim() })}
                variant="danger"
                isLoading={supprimer.isPending}
                onConfirm={async () => { await supprimer.mutateAsync(id); navigate({ to: '/personnel' }); }}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    );
}
