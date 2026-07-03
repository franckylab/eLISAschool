/**
 * ==================================
 * eLISAschool - Page Détail Période (v3.0 — Structure hiérarchique)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * 3 onglets : Informations + Structure + Données liées
 * Actions : Clôturer / Réouvrir / Supprimer / Gérer compositions
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Calendar, Clock, Trash2,
    AlertCircle, Lock, Unlock, FileText,
    BarChart3, CheckCircle2, Timer, Edit, Network,
} from 'lucide-react';
import {
    usePeriode, useSupprimerPeriode,
    useCloturerPeriode, useReouvrirPeriode,
    useCompositions, useNiveauxPeriode,
    useProgressionEnfants,
} from '../hooks/use-periodes';
import { StatutPeriode, niveauPeutAvoirEnfants } from '../types/periode.types';
import type { PeriodeComposition } from '../types/periode.types';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ModalCloturePeriode } from './modal-cloture-periode';
import { ModalFormPeriode } from './modal-form-periode';
import { ModalGestionCompositions } from './modal-gestion-compositions';
import { usePermissions } from '@/hooks';
import { RowActions } from '@/components/ui/RowActions';
import { useMediaQuery } from '@/hooks/use-media-query';

/** Référence stable pour éviter les re-renders quand la query est désactivée */
const EMPTY_COMPOSITIONS: PeriodeComposition[] = [];

type OngletActif = 'informations' | 'structure' | 'donnees';

const LABELS_STATUT: Record<string, string> = {
    OUVERTE: 'Ouverte',
    EN_ATTENTE_CLOTURE: 'En attente de validation',
    CLOTUREE: 'Clôturée',
};

const COULEURS_STATUT: Record<string, string> = {
    OUVERTE: 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] border-[var(--color-dominant-200)]',
    EN_ATTENTE_CLOTURE: 'bg-amber-50 text-amber-700 border-amber-200',
    CLOTUREE: 'bg-[var(--color-surface-alt)] text-[var(--color-text-tertiary)] border-[var(--color-bordure)]',
};

function formatDateFr(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/** Progression temporelle (0-100) entre deux dates */
function calculeProgression(dateDebut: string, dateFin: string): number {
    const debut = new Date(dateDebut).getTime();
    const fin = new Date(dateFin).getTime();
    const maintenant = Date.now();
    if (maintenant < debut) return 0;
    if (maintenant > fin) return 100;
    return Math.round(((maintenant - debut) / (fin - debut)) * 100);
}

/** Format de date court pour mobile (ex: "15 jan. 2026") */
function formatDateFrCourt(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function PeriodeDetailPage() {
    const { id } = useParams({ from: '/_auth/periodes/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const estMobile = useMediaQuery('(max-width: 479px)');
    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');
    const [confirmAction, setConfirmAction] = useState<'supprimer' | 'reouvrir' | null>(null);
    const [modalClotureOpen, setModalClotureOpen] = useState(false);
    const [modalFormOpen, setModalFormOpen] = useState(false);
    const [modalCompositionsOpen, setModalCompositionsOpen] = useState(false);

    const { data: periode, isLoading } = usePeriode(id);
    const { data: compositionsEnfants = EMPTY_COMPOSITIONS } = useCompositions(id);
    const { data: progressionEnfants = [] } = useProgressionEnfants(id);
    const supprimer = useSupprimerPeriode();
    const cloturer = useCloturerPeriode();
    const reouvrir = useReouvrirPeriode();

    const estCloturee = periode?.statut === StatutPeriode.CLOTUREE;
    const estOuverte = periode?.statut === StatutPeriode.OUVERTE;

    // Calculs dérivés
    const dureeJours = useMemo(() => {
        if (!periode) return 0;
        return Math.ceil(
            (new Date(periode.dateFin).getTime() - new Date(periode.dateDebut).getTime())
            / (1000 * 60 * 60 * 24)
        );
    }, [periode]);

    const progression = useMemo(() => {
        if (!periode) return 0;
        const debut = new Date(periode.dateDebut).getTime();
        const fin = new Date(periode.dateFin).getTime();
        const maintenant = Date.now();
        if (maintenant < debut) return 0;
        if (maintenant > fin) return 100;
        return Math.round(((maintenant - debut) / (fin - debut)) * 100);
    }, [periode]);

    const onglets = [
        { id: 'informations' as const, label: 'Informations', icon: FileText },
        { id: 'structure' as const, label: 'Structure', icon: Network },
        { id: 'donnees' as const, label: 'Données liées', icon: BarChart3 },
    ];

    // Vérifier si le niveau peut avoir des enfants
    const { data: niveaux = [] } = useNiveauxPeriode();
    const peutAvoirEnfants = periode ? niveauPeutAvoirEnfants(niveaux, periode.niveauId) : false;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-bordure)] border-t-[var(--color-dominant-600)]" />
            </div>
        );
    }

    if (!periode) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-[var(--gap-md)]">
                <AlertCircle className="h-[var(--icon-xl)] w-[var(--icon-xl)] text-[var(--color-text-tertiary)]" />
                <p style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.125rem)' }} className="text-[var(--color-text-secondary)]">
                    Période non trouvée
                </p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/periodes' } as any)}>
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[var(--gap-lg)] w-full max-w-[1200px] mx-auto" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[var(--radius-xl)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                style={{ padding: 'var(--padding-modal-body)' }}
            >
                <div className="flex flex-col gap-[var(--gap-md)]">
                    {/* Retour + Actions */}
                    <div className="flex items-center justify-between flex-wrap gap-[var(--gap-sm)]">
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            icon={<ArrowLeft className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            onClick={() => navigate({ to: '/periodes' } as any)}
                        >
                            Retour
                        </ElisaButton>

                        {/* Actions secondaires — menu kebab mobile */}
                        <div className="sm:hidden">
                            <RowActions actions={[
                                ...(estOuverte ? [{
                                    key: 'modifier',
                                    label: 'Modifier',
                                    icon: Edit,
                                    onClick: () => setModalFormOpen(true),
                                    variant: 'primary' as const,
                                }] : []),
                                ...(estOuverte ? [{
                                    key: 'cloturer',
                                    label: 'Clôturer',
                                    icon: Lock,
                                    onClick: () => setModalClotureOpen(true),
                                    variant: 'warning' as const,
                                    disabled: cloturer.isPending,
                                }] : []),
                                ...(estCloturee ? [{
                                    key: 'reouvrir',
                                    label: 'Réouvrir',
                                    icon: Unlock,
                                    onClick: () => setConfirmAction('reouvrir'),
                                    variant: 'info' as const,
                                    disabled: reouvrir.isPending,
                                }] : []),
                                ...(estOuverte ? [{
                                    key: 'supprimer',
                                    label: 'Supprimer',
                                    icon: Trash2,
                                    onClick: () => setConfirmAction('supprimer'),
                                    variant: 'danger' as const,
                                    disabled: supprimer.isPending,
                                }] : []),
                            ]} />
                        </div>

                        {/* Actions desktop — boutons complets */}
                        <div className="hidden sm:flex items-center gap-[var(--gap-sm)] flex-wrap">
                            {estOuverte && (
                                <ElisaButton
                                    variant="outline"
                                    size="sm"
                                    icon={<Edit className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                    onClick={() => setModalFormOpen(true)}
                                >
                                    Modifier
                                </ElisaButton>
                            )}
                            {estOuverte && (
                                <ElisaButton
                                    variant="outline"
                                    size="sm"
                                    icon={<Lock className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                    isLoading={cloturer.isPending}
                                    onClick={() => setModalClotureOpen(true)}
                                >
                                    Clôturer
                                </ElisaButton>
                            )}
                            {estCloturee && (
                                <ElisaButton
                                    variant="accent"
                                    size="sm"
                                    icon={<Unlock className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                    isLoading={reouvrir.isPending}
                                    onClick={() => setConfirmAction('reouvrir')}
                                >
                                    Réouvrir
                                </ElisaButton>
                            )}
                            {estOuverte && (
                                <ElisaButton
                                    variant="danger"
                                    size="sm"
                                    icon={<Trash2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                    isLoading={supprimer.isPending}
                                    onClick={() => setConfirmAction('supprimer')}
                                >
                                    Supprimer
                                </ElisaButton>
                            )}
                        </div>
                    </div>

                    {/* Titre + badges */}
                    <div className="flex items-start gap-[var(--gap-md)] flex-wrap">
                        <div
                            className="rounded-[var(--radius-lg)] flex items-center justify-center shrink-0"
                            style={{
                                width: 'clamp(48px, 5vw, 64px)',
                                height: 'clamp(48px, 5vw, 64px)',
                                background: 'var(--color-dominant-600)',
                            }}
                        >
                            <Calendar
                                className="text-white"
                                style={{ width: 'clamp(24px, 2.5vw, 32px)', height: 'clamp(24px, 2.5vw, 32px)' }}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-[var(--gap-sm)] flex-wrap mb-[var(--space-xxs)]">
                                <h1 className="font-bold text-[var(--color-text-primary)] truncate" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.6vw, 1.75rem)' }}>
                                    {periode.nom}
                                </h1>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${COULEURS_STATUT[periode.statut]}`}>
                                    {LABELS_STATUT[periode.statut]}
                                </span>
                                {periode.niveau?.label && (
                                    <span className="rounded-full border px-2 py-0.5 text-xs font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-bordure)]">
                                        {periode.niveau.label}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-[var(--gap-md)] text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                <span>{dureeJours} jours</span>
                                {periode.anneeScolaire && (
                                    <>
                                        <span>•</span>
                                        <span className="font-medium">{periode.anneeScolaire.libelle}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Cartes résumé */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--gap-sm)]">
                {[
                    { label: 'Début', value: estMobile ? formatDateFrCourt(periode.dateDebut) : formatDateFr(periode.dateDebut), icon: Calendar },
                    { label: 'Fin', value: estMobile ? formatDateFrCourt(periode.dateFin) : formatDateFr(periode.dateFin), icon: Calendar },
                    { label: 'Durée', value: `${dureeJours} jours`, icon: Clock },
                    { label: 'Progression', value: `${progression}%`, icon: Timer },
                ].map((carte, i) => {
                    const Icon = carte.icon;
                    return (
                        <motion.div
                            key={carte.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * (i + 1) }}
                            className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                            style={{ padding: 'var(--space-md)' }}
                        >
                            <div className="flex items-center gap-[var(--gap-xs)] mb-[var(--space-xxs)]">
                                <Icon className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-tertiary)]" />
                                <span style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }} className="text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                                    {carte.label}
                                </span>
                            </div>
                            <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.0625rem)' }}>
                                {carte.value}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Barre de progression */}
            {estOuverte && progression > 0 && progression < 100 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                    style={{ padding: 'var(--space-md)' }}
                >
                    <div className="flex items-center justify-between mb-[var(--space-xs)]">
                        <span className="flex items-center gap-[var(--gap-xs)] text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                            <Timer className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                            Progression
                        </span>
                        <span className="font-semibold text-[var(--color-dominant-700)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                            {progression}%
                        </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'var(--color-dominant-600)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progression}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>
                </motion.div>
            )}

            {/* Onglets */}
            <div className="border-b border-[var(--color-bordure)]">
                <nav className="flex">
                    {onglets.map((onglet) => {
                        const Icon = onglet.icon;
                        const estActif = ongletActif === onglet.id;
                        return (
                            <button
                                key={onglet.id}
                                onClick={() => setOngletActif(onglet.id)}
                                className="flex-1 flex items-center justify-center gap-[var(--gap-xs)] py-[var(--space-sm)] px-[var(--space-xs)] border-b-2 font-medium transition-colors"
                                style={{
                                    fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)',
                                    borderColor: estActif ? 'var(--color-dominant-600)' : 'transparent',
                                    color: estActif ? 'var(--color-dominant-700)' : 'var(--color-text-secondary)',
                                }}
                                title={onglet.label}
                            >
                                <Icon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                <span className="hidden sm:inline">{onglet.id === 'donnees' ? 'Données' : onglet.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Contenu onglets */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={ongletActif}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                >
                    {ongletActif === 'informations' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-md)]">
                            {/* Informations générales */}
                            <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--padding-modal-body)' }}>
                                <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-[var(--gap-xs)] mb-[var(--space-md)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                                    <FileText className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominant-600)]" />
                                    Informations générales
                                </h3>
                                <dl className="space-y-[var(--space-sm)]">
                                    {[
                                        { label: 'Nom', value: periode.nom },
                                        { label: 'Type', value: periode.niveau?.label || '-' },
                                        { label: 'Statut', value: LABELS_STATUT[periode.statut], badge: COULEURS_STATUT[periode.statut] },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-center justify-between py-[var(--space-xxs)] border-b border-[var(--color-bordure)] last:border-0">
                                            <dt style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} className="text-[var(--color-text-secondary)]">
                                                {item.label}
                                            </dt>
                                            {item.badge ? (
                                                <dd className={`px-2 py-0.5 rounded-full text-xs font-medium border ${item.badge}`}>
                                                    {item.value}
                                                </dd>
                                            ) : (
                                                <dd className="text-[var(--color-text-primary)] font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                                    {item.value}
                                                </dd>
                                            )}
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            {/* Dates */}
                            <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--padding-modal-body)' }}>
                                <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-[var(--gap-xs)] mb-[var(--space-md)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                                    <Clock className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominant-600)]" />
                                    Période
                                </h3>
                                <dl className="space-y-[var(--space-sm)]">
                                    {[
                                        { label: 'Date de début', value: formatDateFr(periode.dateDebut) },
                                        { label: 'Date de fin', value: formatDateFr(periode.dateFin) },
                                        { label: 'Durée totale', value: `${dureeJours} jours` },
                                        { label: 'Année scolaire', value: periode.anneeScolaire?.libelle || '-' },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-start justify-between py-[var(--space-xxs)] border-b border-[var(--color-bordure)] last:border-0 gap-[var(--gap-sm)]">
                                            <dt style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} className="text-[var(--color-text-secondary)]">
                                                {item.label}
                                            </dt>
                                            <dd className="text-[var(--color-text-primary)] font-medium text-right min-w-0 truncate" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            {/* Métadonnées */}
                            <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)] lg:col-span-2" style={{ padding: 'var(--padding-modal-body)' }}>
                                <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-[var(--gap-xs)] mb-[var(--space-md)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                                    <FileText className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-tertiary)]" />
                                    Métadonnées
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                                    {[
                                        { label: 'ID', value: periode.id, mono: true },
                                        { label: 'Établissement', value: (periode.etablissementId?.substring(0, 8) || '—') + '...', mono: true },
                                        { label: 'Créée le', value: new Date(periode.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                                        { label: 'Modifiée le', value: new Date(periode.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                                    ].map((item) => (
                                        <div key={item.label}>
                                            <dt style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }} className="text-[var(--color-text-tertiary)] uppercase tracking-wide mb-[var(--space-xxs)]">
                                                {item.label}
                                            </dt>
                                            <dd className={`text-[var(--color-text-primary)] ${item.mono ? 'font-mono' : ''}`} style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {ongletActif === 'structure' && (
                        <div className="space-y-[var(--gap-md)]">
                            {/* En-tête avec bouton gérer */}
                            <div className="flex items-center justify-between flex-wrap gap-[var(--gap-sm)]">
                                <div>
                                    <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-[var(--gap-xs)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                                        <Network className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominant-600)]" />
                                        Composition hiérarchique
                                    </h3>
                                    <p className="text-[var(--color-text-secondary)] mt-1" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        {peutAvoirEnfants
                                            ? `${compositionsEnfants.length} enfant(s) lié(s) à cette période`
                                            : `Ce niveau de période (${periode.niveau?.label}) ne peut pas avoir d'enfants`
                                        }
                                    </p>
                                </div>
                                {estOuverte && peutAvoirEnfants && hasPermission('periodes:compositions:edit') && (
                                    <ElisaButton
                                        variant="outline"
                                        size="sm"
                                        icon={<Network className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                        onClick={() => setModalCompositionsOpen(true)}
                                    >
                                        Gérer
                                    </ElisaButton>
                                )}
                            </div>

                            {/* Liste des enfants ou message */}
                            {!peutAvoirEnfants ? (
                                <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--padding-modal-body)' }}>
                                    <div className="flex items-center gap-[var(--gap-sm)] text-[var(--color-text-tertiary)]">
                                        <AlertCircle className="h-[var(--icon-md)] w-[var(--icon-md)] shrink-0" />
                                        <p style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                            Les périodes de niveau « {periode.niveau?.label} » sont toujours au niveau le plus bas de la hiérarchie.
                                        </p>
                                    </div>
                                </div>
                            ) : compositionsEnfants.length === 0 ? (
                                <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--padding-modal-body)' }}>
                                    <div className="flex flex-col items-center gap-[var(--gap-sm)] py-4">
                                        <Network className="h-[var(--icon-xl)] w-[var(--icon-xl)] text-[var(--color-text-tertiary)]" />
                                        <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                            Aucun enfant lié à cette période
                                        </p>
                                        {estOuverte && hasPermission('periodes:compositions:edit') && (
                                            <ElisaButton
                                                variant="outline"
                                                size="sm"
                                                icon={<Network className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                                onClick={() => setModalCompositionsOpen(true)}
                                            >
                                                Ajouter des enfants
                                            </ElisaButton>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Vue desktop : tableau grille */}
                                    <div className="hidden sm:block rounded-[var(--radius-lg)] border border-[var(--color-bordure)] overflow-hidden">
                                        {/* En-tête */}
                                        <div className="grid grid-cols-[1fr_80px_100px_100px_60px] gap-[var(--gap-sm)] items-center px-[var(--space-md)] py-[var(--space-sm)] bg-[var(--color-surface-alt)] border-b border-[var(--color-bordure)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                            <span>Nom</span>
                                            <span>Type</span>
                                            <span>Période</span>
                                            <span>Progression</span>
                                            <span className="text-right">Ordre</span>
                                        </div>
                                        {/* Lignes */}
                                        <div className="divide-y divide-[var(--color-bordure)]">
                                            {compositionsEnfants
                                                .sort((a, b) => a.ordre - b.ordre)
                                                .map((comp) => {
                                                    const enfant = comp.periodeEnfant;
                                                    if (!enfant) return null;
                                                    const progPct = calculeProgression(enfant.dateDebut, enfant.dateFin);
                                                    const noteCount = progressionEnfants.find(p => p.id === enfant.id)?.noteCount ?? 0;
                                                    return (
                                                        <div key={comp.id} className="grid grid-cols-[1fr_80px_100px_100px_60px] gap-[var(--gap-sm)] items-center px-[var(--space-md)] py-[var(--space-sm)] hover:bg-[var(--color-surface-alt)]/50 transition-colors">
                                                            <div className="flex items-center gap-[var(--gap-xs)] min-w-0">
                                                                <Calendar className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-muted)] shrink-0" />
                                                                <span className="truncate font-medium text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                                                    {enfant.nom}
                                                                </span>
                                                            </div>
                                                            <span className="rounded-full border px-1.5 py-0.5 text-xs font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-bordure)] text-center">
                                                                {enfant.niveau?.label}
                                                            </span>
                                                            <div style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.8125rem)' }}>
                                                                <p className="text-[var(--color-text-primary)]">{new Date(enfant.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                                                                <p className="text-xs text-[var(--color-text-muted)]">→ {new Date(enfant.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                                                            </div>
                                                            <div className="flex flex-col gap-1 min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                                                                        <div
                                                                            className="h-full rounded-full transition-all duration-500"
                                                                            style={{
                                                                                width: `${progPct}%`,
                                                                                background: progPct >= 100 ? 'var(--color-success)' : 'var(--color-dominant-500)',
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-medium text-[var(--color-text-tertiary)] tabular-nums w-7 text-right">
                                                                        {progPct}%
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-[var(--color-text-muted)]">
                                                                    {noteCount} note{noteCount !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                            <span className="text-right text-sm font-medium text-[var(--color-text-secondary)]">
                                                                {comp.ordre}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>

                                    {/* Vue mobile : cartes verticales */}
                                    <div className="flex sm:hidden flex-col gap-[var(--gap-sm)]">
                                        {compositionsEnfants
                                            .sort((a, b) => a.ordre - b.ordre)
                                            .map((comp) => {
                                                const enfant = comp.periodeEnfant;
                                                if (!enfant) return null;
                                                const progPct = calculeProgression(enfant.dateDebut, enfant.dateFin);
                                                const noteCount = progressionEnfants.find(p => p.id === enfant.id)?.noteCount ?? 0;
                                                return (
                                                    <div key={comp.id} className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'clamp(0.75rem, 0.6rem + 0.4vw, 1rem)' }}>
                                                        <div className="flex items-center justify-between mb-[var(--space-xs)]">
                                                            <div className="flex items-center gap-[var(--gap-xs)] min-w-0">
                                                                <Calendar className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-muted)] shrink-0" />
                                                                <span className="truncate font-medium text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                                                    {enfant.nom}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs font-medium text-[var(--color-text-tertiary)]">#{comp.ordre}</span>
                                                        </div>
                                                        <div className="flex items-center gap-[var(--gap-md)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                                            <span className="rounded-full border px-1.5 py-0.5 text-xs font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-bordure)]">
                                                                {enfant.niveau?.label}
                                                            </span>
                                                            <span className="text-[var(--color-text-secondary)]">
                                                                {new Date(enfant.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                                {' → '}
                                                                {new Date(enfant.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <div className="flex items-center gap-1.5 flex-1">
                                                                <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full transition-all duration-500"
                                                                        style={{
                                                                            width: `${progPct}%`,
                                                                            background: progPct >= 100 ? 'var(--color-success)' : 'var(--color-dominant-500)',
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-medium text-[var(--color-text-tertiary)] tabular-nums">{progPct}%</span>
                                                            </div>
                                                            <span className="text-xs text-[var(--color-text-muted)]">{noteCount} note{noteCount !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {ongletActif === 'donnees' && (
                        <div className="space-y-[var(--gap-md)]">
                            {/* Résumé des données liées */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--gap-sm)]">
                                {[
                                    { label: 'Notes liées', value: '—', icon: CheckCircle2, color: 'var(--color-dominant-600)' },
                                    { label: 'Bulletins liés', value: '—', icon: FileText, color: 'var(--color-secondary-600)' },
                                    { label: 'Verrouillage', value: estCloturee ? 'Actif' : 'Inactif', icon: estCloturee ? Lock : Unlock, color: estCloturee ? 'var(--color-error-600)' : 'var(--color-text-tertiary)' },
                                ].map((carte) => {
                                    const Icon = carte.icon;
                                    return (
                                        <div key={carte.label} className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--space-md)' }}>
                                            <div className="flex items-center gap-[var(--gap-xs)] mb-[var(--space-xxs)]">
                                                <Icon className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color: carte.color }} />
                                                <span style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }} className="text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                                                    {carte.label}
                                                </span>
                                            </div>
                                            <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}>
                                                {carte.value}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Message informatif */}
                            <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--padding-modal-body)' }}>
                                <div className="flex items-start gap-[var(--gap-md)]">
                                    <BarChart3 className="h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-text-tertiary)] shrink-0 mt-[var(--space-xs)]" />
                                    <div>
                                        <h3 className="font-semibold text-[var(--color-text-primary)] mb-[var(--space-xs)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                                            Données liées à cette période
                                        </h3>
                                        <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                            {estCloturee
                                                ? 'Cette période est clôturée. Toutes les saisies (notes, bulletins) sont verrouillées. Les données existantes restent consultables.'
                                                : 'Les notes et bulletins liés à cette période seront affichés ici. La clôture verrouillera toutes les modifications.'
                                            }
                                        </p>
                                        {estCloturee && (
                                            <div className="flex items-center gap-[var(--gap-xs)] mt-[var(--space-md)] text-[var(--color-error-600)]">
                                                <Lock className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                                <span style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} className="font-medium">
                                                    Verrouillage actif — aucune modification possible
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Modals de confirmation */}
            {/* Modal formulaire (édition) */}
            <ModalFormPeriode
                periode={periode}
                isOpen={modalFormOpen}
                onClose={() => setModalFormOpen(false)}
                onSuccess={() => setModalFormOpen(false)}
            />

            {/* Modal cloture avec impacts */}
            <ModalCloturePeriode
                periode={periode}
                isOpen={modalClotureOpen}
                onClose={() => setModalClotureOpen(false)}
                onClotureSuccess={() => setModalClotureOpen(false)}
            />

            {/* Modal gestion des compositions */}
            <ModalGestionCompositions
                periode={periode}
                isOpen={modalCompositionsOpen}
                onClose={() => setModalCompositionsOpen(false)}
                onSuccess={() => setModalCompositionsOpen(false)}
            />

            {/* Modal confirmation reouvrir */}
            <ConfirmationModal
                isOpen={confirmAction === 'reouvrir'}
                title="Réouvrir cette période"
                message={`Êtes-vous sûr de vouloir réouvrir "${periode.nom}" ?`}
                details="La période sera à nouveau disponible pour les opérations courantes."
                variant="info"
                confirmLabel="Réouvrir"
                onConfirm={async () => {
                    try {
                        await reouvrir.mutateAsync({ id: periode.id, motif: 'Réouverture manuelle depuis le détail' });
                        setConfirmAction(null);
                    } catch (e) {}
                }}
                onCancel={() => setConfirmAction(null)}
                isLoading={reouvrir.isPending}
            />

            <ConfirmationModal
                isOpen={confirmAction === 'supprimer'}
                title="Supprimer cette période"
                message={`Êtes-vous sûr de vouloir supprimer "${periode.nom}" ?`}
                details="Cette action est irréversible."
                variant="danger"
                onConfirm={async () => {
                    try {
                        await supprimer.mutateAsync(periode.id);
                        setConfirmAction(null);
                        navigate({ to: '/periodes' } as any);
                    } catch (e) {}
                }}
                onCancel={() => setConfirmAction(null)}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
