/**
 * ==================================
 * eLISAschool - Page Détail Classe
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Corrections :
 * - Propriétés cohérentes avec le type Classe
 * - ConfirmationModal au lieu de confirm() natif
 * - Bouton Modifier fonctionnel
 * - Modal d'affectation élève
 * - LoadingState standardisé
 * - Responsive design complet
 * - i18n complet
 */

import { useState, useMemo } from 'react';
import { useParams } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, Users, BookOpen, MapPin,
    Edit, Trash2, UserPlus, TrendingUp, Award
} from 'lucide-react';
import { useClasse, useSupprimerClasse, useAffecterEleve } from '../hooks/use-classes';
import { useEleves } from '@/features/eleves/hooks/use-eleves';
import { ClasseFormModal } from './classe-form-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { LoadingState, ErrorState } from '@/components/feedback';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { Eleve } from '@/features/eleves/types/eleve.types';

type OngletActif = 'informations' | 'eleves' | 'statistiques';

/**
 * Mapping créneau horaire enum → clé i18n
 */
const creneauKey: Record<string, string> = {
    MATIN: 'matin',
    APRES_MIDI: 'apresMidi',
    JOURNEE_COMPLETE: 'journeeComplete',
};

export function ClasseDetailPage() {
    const { t } = useTranslation('classes');
    const { id } = useParams({ from: '/_auth/classes/$id' });
    const navigate = useNavigate();
    const estMobile = useMediaQuery('(max-width: 767px)');

    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');
    const [modalEditionOpen, setModalEditionOpen] = useState(false);
    const [modalAffectationOpen, setModalAffectationOpen] = useState(false);
    const [classeToDelete, setClasseToDelete] = useState(false);

    // Queries
    const { data: classe, isLoading: loadingClasse, error: erreurClasse } = useClasse(id);
    const supprimer = useSupprimerClasse();

    const { data: elevesData, isLoading: loadingEleves } = useEleves({
        classeId: id,
        page: 1,
        limit: 50,
    });

    const eleves = elevesData?.items || [];

    // Données pour le modal d'affectation (passées en prop)

    // Statistiques calculées
    const statsSexe = useMemo(() => {
        const garcons = eleves.filter((e: Eleve) => e.sexe === 'M').length;
        const filles = eleves.filter((e: Eleve) => e.sexe === 'F').length;
        const total = eleves.length;
        return {
            garcons,
            filles,
            total,
            pourcentageGarcons: total > 0 ? (garcons / total) * 100 : 0,
            pourcentageFilles: total > 0 ? (filles / total) * 100 : 0,
        };
    }, [eleves]);

    const tauxOccupation = useMemo(() => {
        if (!classe?.effectifMax) return null;
        const effectif = classe.effectifActuel || 0;
        return {
            pourcentage: (effectif / classe.effectifMax) * 100,
            effectif,
            capacite: classe.effectifMax,
        };
    }, [classe]);

    // Colonnes du tableau des élèves
    const colonnesEleves: Column<Eleve>[] = [
        {
            key: 'matricule',
            header: t('colonnes.matricule'),
            render: (e) => <span className="font-mono text-sm">{e.matricule}</span>,
        },
        {
            key: 'nomComplet',
            header: t('colonnes.nomComplet'),
            render: (e) => (
                <div>
                    <p className="font-medium">{e.prenom} {e.nom}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                        {e.sexe === 'M' ? t('sexe.masculin') : t('sexe.feminin')}
                    </p>
                </div>
            ),
        },
        {
            key: 'dateNaissance',
            header: t('colonnes.dateNaissance'),
            render: (e) => new Date(e.dateNaissance).toLocaleDateString('fr-FR'),
        },
        {
            key: 'statut',
            header: t('colonnes.statut'),
            render: (e) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    e.statut === 'ACTIF'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                    {e.statut === 'ACTIF' ? t('statut.actif') : t('statut.inactif')}
                </span>
            ),
        },
    ];

    // Onglets
    const onglets = [
        { id: 'informations' as const, label: t('onglets.informations'), icon: BookOpen },
        { id: 'eleves' as const, label: `${t('onglets.eleves')} (${eleves.length})`, icon: Users },
        { id: 'statistiques' as const, label: t('onglets.statistiques'), icon: TrendingUp },
    ];

    // Handlers
    const handleSuppression = async () => {
        await supprimer.mutateAsync(id);
        navigate({ to: '/classes' });
        setClasseToDelete(false);
    };

    // États de chargement et erreur
    if (loadingClasse) {
        return <LoadingState message={t('chargement.detail')} />;
    }

    if (erreurClasse || !classe) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-6">
                <ErrorState
                    message={erreurClasse?.message || t('erreurs.classeNonTrouvee')}
                    onRetry={() => navigate({ to: '/classes' })}
                />
            </div>
        );
    }

    // Données affichées
    const niveauNom = classe.niveau?.nom || '-';
    const cycleNom = classe.niveau?.cycle?.nom;
    const salleNom = classe.sallePrincipale || t('info.nonAssignee');
    const principalNom = classe.professeurPrincipal
        ? `${classe.professeurPrincipal.prenom} ${classe.professeurPrincipal.nom}`
        : t('info.nonAssigne');
    const effectifActuel = classe.effectifActuel || 0;
    const effectifMax = classe.effectifMax || null;

    return (
        <div className="flex flex-col gap-[var(--gap-lg)] p-[var(--space-md)] sm:p-[var(--space-lg)]">
            {/* Header responsive */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${estMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}
            >
                <div className="flex items-center gap-[var(--gap-md)]">
                    <ElisaButton
                        variant="ghost"
                        size="sm"
                        icon={<ArrowLeft className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        onClick={() => navigate({ to: '/classes' })}
                    >
                        {t('boutons.retour')}
                    </ElisaButton>
                    <div>
                        <h1
                            className="font-bold text-[var(--color-text-primary)]"
                            style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.6vw, 1.875rem)' }}
                        >
                            {classe.nom}
                        </h1>
                        <p
                            className="text-[var(--color-text-secondary)] mt-1"
                            style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                        >
                            {t('info.code')}: {classe.code} • {niveauNom}
                            {cycleNom && ` • ${cycleNom}`}
                        </p>
                    </div>
                </div>
                <div className={`flex ${estMobile ? 'w-full' : 'gap-2'}`}>
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Edit className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        onClick={() => setModalEditionOpen(true)}
                        className={estMobile ? 'flex-1' : ''}
                    >
                        {t('boutons.modifier')}
                    </ElisaButton>
                    <ElisaButton
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        onClick={() => setClasseToDelete(true)}
                        className={estMobile ? 'flex-1' : ''}
                    >
                        {t('boutons.supprimer')}
                    </ElisaButton>
                </div>
            </motion.div>

            {/* Stats rapides - Grille responsive */}
            <div className={`grid ${estMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-[var(--gap-md)]`}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-[var(--radius-lg)] border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-[var(--space-md)]"
                >
                    <div className="flex items-center gap-[var(--gap-sm)] mb-2">
                        <Users className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-blue-600 dark:text-blue-400" />
                        <span
                            className="font-medium text-blue-700 dark:text-blue-300"
                            style={{ fontSize: 'clamp(0.7rem, 0.65rem + 0.2vw, 0.875rem)' }}
                        >
                            {t('stats.effectif')}
                        </span>
                    </div>
                    <p
                        className="font-bold text-blue-800 dark:text-blue-200"
                        style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.6vw, 1.875rem)' }}
                    >
                        {effectifActuel} / {effectifMax || '∞'}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-[var(--radius-lg)] border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-[var(--space-md)]"
                >
                    <div className="flex items-center gap-[var(--gap-sm)] mb-2">
                        <MapPin className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-green-600 dark:text-green-400" />
                        <span
                            className="font-medium text-green-700 dark:text-green-300"
                            style={{ fontSize: 'clamp(0.7rem, 0.65rem + 0.2vw, 0.875rem)' }}
                        >
                            {t('stats.salle')}
                        </span>
                    </div>
                    <p
                        className="font-bold text-green-800 dark:text-green-200 truncate"
                        style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.5rem)' }}
                    >
                        {salleNom}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`rounded-[var(--radius-lg)] border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 p-[var(--space-md)] ${estMobile ? 'col-span-2' : ''}`}
                >
                    <div className="flex items-center gap-[var(--gap-sm)] mb-2">
                        <Award className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-purple-600 dark:text-purple-400" />
                        <span
                            className="font-medium text-purple-700 dark:text-purple-300"
                            style={{ fontSize: 'clamp(0.7rem, 0.65rem + 0.2vw, 0.875rem)' }}
                        >
                            {t('stats.principal')}
                        </span>
                    </div>
                    <p
                        className="font-bold text-purple-800 dark:text-purple-200 truncate"
                        style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)' }}
                    >
                        {principalNom}
                    </p>
                </motion.div>
            </div>

            {/* Onglets responsive */}
            <div className="border-b border-[var(--color-border)]">
                <nav className={`flex ${estMobile ? 'gap-2 overflow-x-auto' : 'gap-6'}`}>
                    {onglets.map((onglet) => {
                        const Icon = onglet.icon;
                        return (
                            <button
                                key={onglet.id}
                                onClick={() => setOngletActif(onglet.id)}
                                className={`flex items-center gap-[var(--gap-xs)] py-3 px-1 border-b-2 font-medium whitespace-nowrap transition-colors ${
                                    ongletActif === onglet.id
                                        ? 'border-[var(--color-dominant-600)] text-[var(--color-dominant-600)]'
                                        : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]'
                                }`}
                                style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                            >
                                <Icon className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
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
                {/* Onglet Informations */}
                {ongletActif === 'informations' && (
                    <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-lg)]`}>
                        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-lg)]">
                            <h3
                                className="font-semibold mb-[var(--space-md)] text-[var(--color-text-primary)]"
                                style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
                            >
                                {t('info.titreGeneral')}
                            </h3>
                            <dl className="space-y-[var(--space-md)]">
                                <div>
                                    <dt className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        {t('info.nomClasse')}
                                    </dt>
                                    <dd className="mt-1 font-medium text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)' }}>
                                        {classe.nom}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        {t('info.code')}
                                    </dt>
                                    <dd className="mt-1 font-mono text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                        {classe.code}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        {t('info.niveau')}
                                    </dt>
                                    <dd className="mt-1 text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                        {niveauNom}
                                    </dd>
                                </div>
                                {cycleNom && (
                                    <div>
                                        <dt className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                            {t('info.cycle')}
                                        </dt>
                                        <dd className="mt-1 text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                            {cycleNom}
                                        </dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        {t('info.typeClasse')}
                                    </dt>
                                    <dd className="mt-1 text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                        {classe.typeClasse}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-lg)]">
                            <h3
                                className="font-semibold mb-[var(--space-md)] text-[var(--color-text-primary)]"
                                style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
                            >
                                {t('info.titreConfig')}
                            </h3>
                            <dl className="space-y-[var(--space-md)]">
                                <div>
                                    <dt className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        {t('info.effectifMax')}
                                    </dt>
                                    <dd className="mt-1 text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                        {effectifMax || t('info.illimite')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        {t('info.sallePrincipale')}
                                    </dt>
                                    <dd className="mt-1 text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                        {salleNom}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        {t('info.statut')}
                                    </dt>
                                    <dd className="mt-1">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                            classe.actif
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                        }`}>
                                            {classe.actif ? t('statut.actif') : t('statut.inactif')}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        {t('info.anneeScolaire')}
                                    </dt>
                                    <dd className="mt-1 text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                        {classe.anneeScolaire?.libelle || '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        {t('info.creneau')}
                                    </dt>
                                    <dd className="mt-1 text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                        {t(`creneaux.${creneauKey[classe.creneauHoraire] || 'matin'}`)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Description si présente */}
                        {classe.description && (
                            <div className={`${estMobile ? '' : 'col-span-2'} rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-lg)]`}>
                                <h3
                                    className="font-semibold mb-[var(--space-md)] text-[var(--color-text-primary)]"
                                    style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
                                >
                                    {t('info.description')}
                                </h3>
                                <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                    {classe.description}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Onglet Élèves */}
                {ongletActif === 'eleves' && (
                    <div>
                        <div className={`flex ${estMobile ? 'flex-col gap-3' : 'items-center justify-between'} mb-[var(--space-md)]`}>
                            <h3
                                className="font-semibold text-[var(--color-text-primary)]"
                                style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
                            >
                                {t('eleves.inscrits')} ({eleves.length})
                            </h3>
                            <ElisaButton
                                variant="primary"
                                size="sm"
                                icon={<UserPlus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                onClick={() => setModalAffectationOpen(true)}
                            >
                                {t('eleves.inscrireEleve')}
                            </ElisaButton>
                        </div>
                        {loadingEleves ? (
                            <LoadingState message={t('chargement.eleves')} />
                        ) : eleves.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 rounded-[var(--radius-lg)] bg-[var(--color-surface-secondary)]">
                                <Users className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3" />
                                <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                    {t('eleves.aucunEleve')}
                                </p>
                            </div>
                        ) : (
                            <DataTable
                                tableId="classe-eleves"
                                data={eleves}
                                columns={colonnesEleves}
                                enableReordering
                                enablePinning
                                enableColumnVisibility
                            />
                        )}
                    </div>
                )}

                {/* Onglet Statistiques */}
                {ongletActif === 'statistiques' && (
                    <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-lg)]`}>
                        {/* Taux d'occupation */}
                        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-lg)]">
                            <h3
                                className="font-semibold mb-[var(--space-md)] text-[var(--color-text-primary)]"
                                style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
                            >
                                {t('stats.tauxOccupation')}
                            </h3>
                            {tauxOccupation ? (
                                <div>
                                    <div className="overflow-hidden h-4 rounded bg-blue-100 dark:bg-blue-900">
                                        <div
                                            style={{ width: `${Math.min(tauxOccupation.pourcentage, 100)}%` }}
                                            className="h-full bg-blue-500 transition-all duration-500 rounded"
                                        />
                                    </div>
                                    <p
                                        className="mt-2 text-[var(--color-text-secondary)]"
                                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                    >
                                        {tauxOccupation.pourcentage.toFixed(1)}% {t('stats.rempli')}
                                        {' '}({tauxOccupation.effectif}/{tauxOccupation.capacite})
                                    </p>
                                </div>
                            ) : (
                                <p className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                    {t('stats.pasDeLimite')}
                                </p>
                            )}
                        </div>

                        {/* Répartition par sexe */}
                        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-lg)]">
                            <h3
                                className="font-semibold mb-[var(--space-md)] text-[var(--color-text-primary)]"
                                style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
                            >
                                {t('stats.repartitionSexe')}
                            </h3>
                            <div className="space-y-[var(--space-md)]">
                                <div>
                                    <div className="flex justify-between mb-1" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        <span className="text-[var(--color-text-secondary)]">{t('sexe.garcons')}</span>
                                        <span className="font-medium text-[var(--color-text-primary)]">{statsSexe.garcons}</span>
                                    </div>
                                    <div className="overflow-hidden h-2 rounded bg-blue-100 dark:bg-blue-900">
                                        <div
                                            style={{ width: `${statsSexe.pourcentageGarcons}%` }}
                                            className="h-full bg-blue-500 transition-all duration-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        <span className="text-[var(--color-text-secondary)]">{t('sexe.filles')}</span>
                                        <span className="font-medium text-[var(--color-text-primary)]">{statsSexe.filles}</span>
                                    </div>
                                    <div className="overflow-hidden h-2 rounded bg-pink-100 dark:bg-pink-900">
                                        <div
                                            style={{ width: `${statsSexe.pourcentageFilles}%` }}
                                            className="h-full bg-pink-500 transition-all duration-500"
                                        />
                                    </div>
                                </div>
                                <p
                                    className="text-[var(--color-text-muted)] pt-2"
                                    style={{ fontSize: 'clamp(0.7rem, 0.65rem + 0.2vw, 0.8125rem)' }}
                                >
                                    {t('stats.totalEleves')}: {statsSexe.total}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Modal Édition */}
            {modalEditionOpen && (
                <ClasseFormModal
                    mode="edition"
                    classe={classe}
                    onSuccess={() => setModalEditionOpen(false)}
                    onCancel={() => setModalEditionOpen(false)}
                />
            )}

            {/* Modal Suppression (ConfirmationModal) */}
            <ConfirmationModal
                isOpen={classeToDelete}
                title={t('confirmations.supprimerTitre')}
                message={t('confirmations.supprimerMessage', { nom: classe.nom })}
                details={t('confirmations.supprimerDetails')}
                variant="danger"
                onConfirm={handleSuppression}
                onCancel={() => setClasseToDelete(false)}
                isLoading={supprimer.isPending}
            />

            {/* Modal Affectation Élève */}
            {modalAffectationOpen && (
                <ModalAffectationEleve
                    classeId={id}
                    onClose={() => setModalAffectationOpen(false)}
                />
            )}
        </div>
    );
}

/**
 * Modal d'affectation d'un élève à une classe
 */
interface ModalAffectationEleveProps {
    classeId: string;
    onClose: () => void;
}

function ModalAffectationEleve({ classeId, onClose }: ModalAffectationEleveProps) {
    const { t } = useTranslation('classes');
    const affecterEleve = useAffecterEleve();
    const estPetitEcran = useMediaQuery('(max-width: 479px)');
    const [eleveId, setEleveId] = useState('');
    const [dateAffectation, setDateAffectation] = useState(new Date().toISOString().split('T')[0]);
    const [motif, setMotif] = useState('');
    const [commentaire, setCommentaire] = useState('');

    // Charger les élèves de l'établissement
    const { data: tousElevesData } = useEleves({ page: 1, limit: 200 });
    // Charger les élèves déjà affectés à cette classe
    const { data: elevesClasseData } = useEleves({ classeId, page: 1, limit: 500 });

    // Filtrer les élèves déjà affectés à cette classe
    const elevesDejaAffectes = new Set(
        (elevesClasseData?.items || []).map((e: Eleve) => e.id)
    );
    const elevesDisponibles = (tousElevesData?.items || []).filter(
        (e: Eleve) => !elevesDejaAffectes.has(e.id)
    );

    const optionsEleves = elevesDisponibles.map((e: Eleve) => ({
        value: e.id,
        label: `${e.prenom} ${e.nom} (${e.matricule})`,
    }));

    const optionsMotifs = [
        { value: '', label: t('affectation.motifs.aucun') },
        { value: 'INSCRIPTION', label: t('affectation.motifs.inscription') },
        { value: 'CHANGEMENT_CLASSE', label: t('affectation.motifs.changementClasse') },
        { value: 'PASSAGE_NIVEAU', label: t('affectation.motifs.passageNiveau') },
        { value: 'TRANSFERE', label: t('affectation.motifs.transfere') },
        { value: 'REDOUBLEMENT', label: t('affectation.motifs.redoublement') },
    ];

    const handleSubmit = async () => {
        if (!eleveId) return;

        try {
            await affecterEleve.mutateAsync({
                eleveId,
                classeId,
                dateAffectation,
                motifChangement: motif || undefined,
                commentaire: commentaire || undefined,
            });
            onClose();
        } catch {
            // L'erreur est gérée par le hook
        }
    };

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onClose(); }}
            title={t('affectation.titre')}
            description={t('affectation.description')}
            size="xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onClose}>
                        {t('boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        isLoading={affecterEleve.isPending}
                        onClick={handleSubmit}
                        disabled={!eleveId}
                    >
                        {t('affectation.affecter')}
                    </ElisaButton>
                </>
            }
        >
            <div className="space-y-[var(--space-md)]">
                <ElisaSelect
                    label={t('affectation.eleve')}
                    value={eleveId}
                    onValueChange={setEleveId}
                    options={optionsEleves}
                    placeholder={t('affectation.selectionnerEleve')}
                    required
                />
                <div className={`grid ${estPetitEcran ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                    <div>
                        <label
                            className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
                            style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                        >
                            {t('affectation.date')}
                        </label>
                        <input
                            type="date"
                            value={dateAffectation}
                            onChange={(e) => setDateAffectation(e.target.value)}
                            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                            style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}
                        />
                    </div>
                    <ElisaSelect
                        label={t('affectation.motif')}
                        value={motif}
                        onValueChange={setMotif}
                        options={optionsMotifs}
                        placeholder={t('affectation.selectionnerMotif')}
                    />
                </div>
                <div>
                    <label
                        className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                    >
                        {t('affectation.commentaire')}
                    </label>
                    <textarea
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        placeholder={t('affectation.commentairePlaceholder')}
                        rows={3}
                        className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] resize-none"
                        style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}
                    />
                </div>
            </div>
        </CustomModal>
    );
}
