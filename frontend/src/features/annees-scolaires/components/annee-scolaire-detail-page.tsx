/**
 * ==================================
 * eLISAschool - Page Détail Année Scolaire
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Calendar, Clock, Trash2,
    AlertCircle, Play, Lock, Unlock, FileText,
    CalendarDays, CheckCircle2, XCircle, Timer
} from 'lucide-react';
import {
    useAnneeScolaire, useSupprimerAnneeScolaire,
    useActiverAnneeScolaire, useCloturerAnneeScolaire,
    useReouvrirAnneeScolaire
} from '../hooks/use-annees-scolaires';
import type { Periode } from '../types/annee-scolaire.types';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

type OngletActif = 'informations' | 'periodes';

const LABELS_STATUT: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    future: 'Future',
    archivee: 'Archivée',
};

const COULEURS_STATUT: Record<string, string> = {
    active: 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] border-[var(--color-dominant-200)]',
    inactive: 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-bordure)]',
    future: 'bg-blue-50 text-blue-700 border-blue-200',
    archivee: 'bg-purple-50 text-purple-700 border-purple-200',
};

const LABELS_STATUT_PERIODE: Record<string, string> = {
    OUVERTE: 'Ouverte',
    EN_ATTENTE_CLOTURE: 'En attente',
    CLOTUREE: 'Clôturée',
};

const COULEURS_STATUT_PERIODE: Record<string, string> = {
    OUVERTE: 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)]',
    EN_ATTENTE_CLOTURE: 'bg-amber-50 text-amber-700',
    CLOTUREE: 'bg-[var(--color-surface-alt)] text-[var(--color-text-tertiary)]',
};

/**
 * Formate une date en français
 */
function formatDateFr(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', options || {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Calcule la progression d'une année scolaire (0-100)
 */
function calculerProgression(dateDebut: string, dateFin: string): number {
    const debut = new Date(dateDebut).getTime();
    const fin = new Date(dateFin).getTime();
    const maintenant = Date.now();
    if (maintenant < debut) return 0;
    if (maintenant > fin) return 100;
    return Math.round(((maintenant - debut) / (fin - debut)) * 100);
}

export function AnneeScolaireDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams({ from: '/_auth/annees-scolaires/$id' });
    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');
    const [confirmActiver, setConfirmActiver] = useState(false);
    const [confirmSupprimer, setConfirmSupprimer] = useState(false);
    const [confirmCloturer, setConfirmCloturer] = useState(false);
    const [confirmReouvrir, setConfirmReouvrir] = useState(false);

    const { data: annee, isLoading } = useAnneeScolaire(id);
    const supprimer = useSupprimerAnneeScolaire();
    const activer = useActiverAnneeScolaire();
    const cloturer = useCloturerAnneeScolaire();
    const reouvrir = useReouvrirAnneeScolaire();

    const estCloturee = annee?.statut === 'archivee';

    // Calculs dérivés
    const dureeJours = useMemo(() => {
        if (!annee) return 0;
        return Math.ceil(
            (new Date(annee.dateFin).getTime() - new Date(annee.dateDebut).getTime())
            / (1000 * 60 * 60 * 24)
        );
    }, [annee]);

    const joursRestants = useMemo(() => {
        if (!annee || annee.statut !== 'active') return null;
        const restants = Math.ceil(
            (new Date(annee.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return restants > 0 ? restants : null;
    }, [annee]);

    const progression = useMemo(() => {
        if (!annee) return 0;
        return calculerProgression(annee.dateDebut, annee.dateFin);
    }, [annee]);

    // Grouper les périodes par niveau
    const periodesParType = useMemo(() => {
        if (!annee?.periodes?.length) return {};
        const groupes: Record<string, { typeNom: string; periodes: Periode[] }> = {};
        for (const periode of annee.periodes) {
            const niveauKey = periode.niveauId || 'AUTRE';
            const typeNom = periode.niveau?.label || periode.niveauId?.substring(0, 8) || 'AUTRE';
            if (!groupes[niveauKey]) {
                groupes[niveauKey] = { typeNom, periodes: [] };
            }
            groupes[niveauKey].periodes.push(periode);
        }
        // Trier les périodes par date de début dans chaque groupe
        for (const groupe of Object.values(groupes)) {
            groupe.periodes.sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
        }
        return groupes;
    }, [annee?.periodes]);

    const totalPeriodes = annee?.periodes?.length || 0;
    const periodesOuvertes = annee?.periodes?.filter(p => p.statut === 'OUVERTE').length || 0;

    const onglets = [
        { id: 'informations' as const, label: 'Informations', icon: FileText },
        { id: 'periodes' as const, label: `Périodes (${totalPeriodes})`, icon: CalendarDays },
    ];

    // --- États de chargement et erreur ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-bordure)] border-t-[var(--color-dominant-600)]" />
            </div>
        );
    }

    if (!annee) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-[var(--gap-md)]">
                <AlertCircle className="h-[var(--icon-xl)] w-[var(--icon-xl)] text-[var(--color-text-tertiary)]" />
                <p style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.125rem)' }} className="text-[var(--color-text-secondary)]">
                    Année scolaire non trouvée
                </p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/annees-scolaires' })}>
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[var(--gap-lg)] p-[var(--space-lg)]" style={{ maxWidth: 'clamp(800px, 90vw, 1200px)', margin: '0 auto' }}>

            {/* --- Header compact --- */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[var(--radius-xl)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                style={{ padding: 'var(--padding-modal-body)' }}
            >
                <div className="flex flex-col gap-[var(--gap-md)]">
                    {/* Ligne supérieure : retour + actions */}
                    <div className="flex items-center justify-between flex-wrap gap-[var(--gap-sm)]">
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            icon={<ArrowLeft className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            onClick={() => navigate({ to: '/annees-scolaires' })}
                        >
                            Retour
                        </ElisaButton>

                        <div className="flex items-center gap-[var(--gap-sm)] flex-wrap">
                            {!estCloturee && !annee.estActuelle && annee.statut !== 'active' && (
                                <ElisaButton
                                    variant="primary"
                                    size="sm"
                                    icon={<Play className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                    isLoading={activer.isPending}
                                    onClick={() => setConfirmActiver(true)}
                                >
                                    Activer
                                </ElisaButton>
                            )}
                            {!estCloturee && (
                                <ElisaButton
                                    variant="outline"
                                    size="sm"
                                    icon={<Lock className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                    isLoading={cloturer.isPending}
                                    onClick={() => setConfirmCloturer(true)}
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
                                    onClick={() => setConfirmReouvrir(true)}
                                >
                                    Réouvrir
                                </ElisaButton>
                            )}
                            <ElisaButton
                                variant="danger"
                                size="sm"
                                icon={<Trash2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                isLoading={supprimer.isPending}
                                onClick={() => setConfirmSupprimer(true)}
                            >
                                Supprimer
                            </ElisaButton>
                        </div>
                    </div>

                    {/* Ligne inférieure : titre + badges + métadonnées */}
                    <div className="flex items-start gap-[var(--gap-md)] flex-wrap">
                        {/* Icône */}
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
                                style={{
                                    width: 'clamp(24px, 2.5vw, 32px)',
                                    height: 'clamp(24px, 2.5vw, 32px)',
                                }}
                            />
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-[var(--gap-sm)] flex-wrap mb-[var(--space-xxs)]">
                                <h1
                                    className="font-bold text-[var(--color-text-primary)] truncate"
                                    style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.6vw, 1.75rem)' }}
                                >
                                    {annee.libelle}
                                </h1>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${COULEURS_STATUT[annee.statut]}`}>
                                    {LABELS_STATUT[annee.statut]}
                                </span>
                                {annee.estActuelle && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                        En cours
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-[var(--gap-md)] text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                <span className="font-mono">{annee.code}</span>
                                <span>•</span>
                                <span>{dureeJours} jours</span>
                                {joursRestants !== null && (
                                    <>
                                        <span>•</span>
                                        <span className="text-amber-600 font-medium">{joursRestants}j restants</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* --- Cartes résumé compactes --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--gap-sm)]">
                {[
                    { label: 'Début', value: formatDateFr(annee.dateDebut), icon: Calendar },
                    { label: 'Fin', value: formatDateFr(annee.dateFin), icon: Calendar },
                    { label: 'Durée', value: `${Math.floor(dureeJours / 30)}m ${dureeJours % 30}j`, icon: Clock },
                    { label: 'Périodes', value: `${totalPeriodes}`, icon: CalendarDays },
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

            {/* --- Barre de progression (si active) --- */}
            {annee.statut === 'active' && (
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
                            Progression de l'année
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

            {/* --- Onglets --- */}
            <div className="border-b border-[var(--color-bordure)]">
                <nav className="flex gap-[var(--gap-md)]">
                    {onglets.map((onglet) => {
                        const Icon = onglet.icon;
                        const estActif = ongletActif === onglet.id;
                        return (
                            <button
                                key={onglet.id}
                                onClick={() => setOngletActif(onglet.id)}
                                className="flex items-center gap-[var(--gap-xs)] py-[var(--space-sm)] px-[var(--space-xs)] border-b-2 font-medium transition-colors"
                                style={{
                                    fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)',
                                    borderColor: estActif ? 'var(--color-dominant-600)' : 'transparent',
                                    color: estActif ? 'var(--color-dominant-700)' : 'var(--color-text-secondary)',
                                }}
                            >
                                <Icon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                {onglet.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* --- Contenu des onglets --- */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={ongletActif}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* ===== ONGLET INFORMATIONS ===== */}
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
                                        { label: 'Libellé', value: annee.libelle },
                                        { label: 'Code', value: annee.code, mono: true },
                                        { label: 'Statut', value: LABELS_STATUT[annee.statut], badge: COULEURS_STATUT[annee.statut] },
                                        { label: 'En cours', value: annee.estActuelle ? 'Oui' : 'Non', badge: annee.estActuelle ? 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)]' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]' },
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
                                                <dd className={`text-[var(--color-text-primary)] font-medium ${item.mono ? 'font-mono' : ''}`} style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                                    {item.value}
                                                </dd>
                                            )}
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            {/* Dates et durée */}
                            <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--padding-modal-body)' }}>
                                <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-[var(--gap-xs)] mb-[var(--space-md)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                                    <Clock className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominant-600)]" />
                                    Période
                                </h3>
                                <dl className="space-y-[var(--space-sm)]">
                                    {[
                                        { label: 'Date de début', value: formatDateFr(annee.dateDebut, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                                        { label: 'Date de fin', value: formatDateFr(annee.dateFin, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                                        { label: 'Durée totale', value: `${dureeJours} jours (${Math.floor(dureeJours / 30)}m ${dureeJours % 30}j)` },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-start justify-between py-[var(--space-xxs)] border-b border-[var(--color-bordure)] last:border-0 gap-[var(--gap-sm)]">
                                            <dt style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} className="text-[var(--color-text-secondary)] shrink-0">
                                                {item.label}
                                            </dt>
                                            <dd className="text-[var(--color-text-primary)] font-medium text-right" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                    {joursRestants !== null && (
                                        <div className="flex items-center justify-between py-[var(--space-xxs)]">
                                            <dt style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} className="text-[var(--color-text-secondary)]">
                                                Jours restants
                                            </dt>
                                            <dd className="text-amber-600 font-bold" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                                {joursRestants} jours
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            {/* Métadonnées (pleine largeur) */}
                            <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)] lg:col-span-2" style={{ padding: 'var(--padding-modal-body)' }}>
                                <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-[var(--gap-xs)] mb-[var(--space-md)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                                    <FileText className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-tertiary)]" />
                                    Métadonnées
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                                    {[
                                        { label: 'Créée le', value: new Date(annee.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                                        { label: 'Modifiée le', value: new Date(annee.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                                    ].map((item) => (
                                        <div key={item.label}>
                                            <dt style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }} className="text-[var(--color-text-tertiary)] uppercase tracking-wide mb-[var(--space-xxs)]">
                                                {item.label}
                                            </dt>
                                            <dd className="text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== ONGLET PÉRIODES ===== */}
                    {ongletActif === 'periodes' && (
                        <div className="space-y-[var(--gap-md)]">
                            {totalPeriodes === 0 ? (
                                <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)] text-center" style={{ padding: 'clamp(2rem, 1.5rem + 2vw, 3rem)' }}>
                                    <CalendarDays className="h-[var(--icon-xl)] w-[var(--icon-xl)] text-[var(--color-text-tertiary)] mx-auto mb-[var(--space-md)]" />
                                    <p className="text-[var(--color-text-secondary)] font-medium" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                                        Aucune période configurée
                                    </p>
                                    <p className="text-[var(--color-text-tertiary)] mt-[var(--space-xs)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        Les périodes (trimestres, semestres, séquences) seront visibles ici une fois créées
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Résumé périodes */}
                                    <div className="flex items-center gap-[var(--gap-md)] flex-wrap rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--space-md)' }}>
                                        <div className="flex items-center gap-[var(--gap-xs)]">
                                            <CheckCircle2 className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominant-600)]" />
                                            <span style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} className="text-[var(--color-text-secondary)]">
                                                <strong className="text-[var(--color-text-primary)]">{periodesOuvertes}</strong> ouverte{periodesOuvertes > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-[var(--gap-xs)]">
                                            <XCircle className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-tertiary)]" />
                                            <span style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} className="text-[var(--color-text-secondary)]">
                                                <strong className="text-[var(--color-text-primary)]">{totalPeriodes - periodesOuvertes}</strong> clôturée{totalPeriodes - periodesOuvertes > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Groupes par type */}
                                    {Object.entries(periodesParType).map(([typeCode, { typeNom, periodes }]) => (
                                        <div key={typeCode} className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--padding-modal-body)' }}>
                                            <h3 className="font-semibold text-[var(--color-text-primary)] mb-[var(--space-md)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                                                {typeNom}
                                                <span className="ml-[var(--space-xs)] text-[var(--color-text-tertiary)] font-normal" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                                    ({periodes.length})
                                                </span>
                                            </h3>
                                            <div className="space-y-[var(--space-xs)]">
                                                {periodes.map((periode) => {
                                                    const periodeJours = Math.ceil(
                                                        (new Date(periode.dateFin).getTime() - new Date(periode.dateDebut).getTime())
                                                        / (1000 * 60 * 60 * 24)
                                                    );
                                                    return (
                                                        <div
                                                            key={periode.id}
                                                            className="flex items-center justify-between flex-wrap gap-[var(--gap-sm)] rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface-alt)]"
                                                            style={{ padding: 'var(--space-sm)' }}
                                                        >
                                                            <div className="flex items-center gap-[var(--gap-sm)] min-w-0">
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-[var(--color-text-primary)] truncate" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                                                        {periode.nom}
                                                                    </p>
                                                                    <p className="text-[var(--color-text-tertiary)]" style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }}>
                                                                        {formatDateFr(periode.dateDebut)} → {formatDateFr(periode.dateFin)}
                                                                        <span className="ml-[var(--space-xs)]">• {periodeJours}j</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-[var(--gap-xs)] shrink-0">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COULEURS_STATUT_PERIODE[periode.statut]}`}>
                                                                    {LABELS_STATUT_PERIODE[periode.statut]}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* --- Modals de confirmation --- */}
            <ConfirmationModal
                isOpen={confirmActiver}
                title="Activer cette année scolaire"
                message={`Êtes-vous sûr de vouloir activer l'année "${annee?.libelle}" ? Les autres années seront désactivées.`}
                variant="warning"
                onConfirm={async () => {
                    await activer.mutateAsync(id);
                    setConfirmActiver(false);
                    navigate({ to: '/annees-scolaires' });
                }}
                onCancel={() => setConfirmActiver(false)}
                isLoading={activer.isPending}
            />

            <ConfirmationModal
                isOpen={confirmCloturer}
                title="Clôturer cette année scolaire"
                message={`Êtes-vous sûr de vouloir clôturer l'année "${annee?.libelle}" ?`}
                details="Cette action marquera l'année comme terminée. Les opérations de notes et bulletins pourraient être restreintes."
                variant="warning"
                confirmLabel="Clôturer"
                onConfirm={async () => {
                    await cloturer.mutateAsync(id);
                    setConfirmCloturer(false);
                }}
                onCancel={() => setConfirmCloturer(false)}
                isLoading={cloturer.isPending}
            />

            <ConfirmationModal
                isOpen={confirmReouvrir}
                title="Réouvrir cette année scolaire"
                message={`Êtes-vous sûr de vouloir réouvrir l'année "${annee?.libelle}" ?`}
                details="L'année sera à nouveau disponible pour les opérations courantes."
                variant="info"
                confirmLabel="Réouvrir"
                onConfirm={async () => {
                    await reouvrir.mutateAsync(id);
                    setConfirmReouvrir(false);
                }}
                onCancel={() => setConfirmReouvrir(false)}
                isLoading={reouvrir.isPending}
            />

            <ConfirmationModal
                isOpen={confirmSupprimer}
                title="Supprimer cette année scolaire"
                message={`Êtes-vous sûr de vouloir supprimer l'année "${annee?.libelle}" ?`}
                details="Cette action est irréversible."
                variant="danger"
                onConfirm={async () => {
                    await supprimer.mutateAsync(id);
                    setConfirmSupprimer(false);
                    navigate({ to: '/annees-scolaires' });
                }}
                onCancel={() => setConfirmSupprimer(false)}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
