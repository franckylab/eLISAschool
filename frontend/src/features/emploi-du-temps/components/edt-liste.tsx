/**
 * ==================================
 * eLISAschool - Vue Liste EDT (DataTable)
 * ==================================
 * Tableau structuré basé sur le composant DataTable réutilisable
 * Colonnes : Jour | Horaire | Matière | Enseignant | Classe | Salle | Type | Statut
 * Version: 3.0.0 — Migration vers DataTable
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Pencil } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import type { CreneauHoraire } from '../types/edt.types';

interface EDTListeViewProps {
    creneaux: CreneauHoraire[];
    onVoir?: (creneau: CreneauHoraire) => void;
    onModifier?: (creneau: CreneauHoraire) => void;
    matiereOptions?: { value: string; label: string }[];
}

export function EDTListeView({ creneaux, onVoir, onModifier, matiereOptions }: EDTListeViewProps) {
    const { t } = useTranslation('emplois');

    const colonnes: Column<CreneauHoraire>[] = useMemo(() => [
        {
            key: 'jour',
            header: t('calendrier.jour'),
            sortable: true,
            render: (c) => (
                <span className="font-medium text-[var(--color-text-primary)]">
                    {t(`jours.${c.jour.toLowerCase()}`)}
                </span>
            ),
        },
        {
            key: 'horaire',
            header: t('horaire'),
            sortable: true,
            render: (c) => (
                <span className="font-mono text-[var(--color-text-primary)]">
                    {c.heureDebut}–{c.heureFin}
                </span>
            ),
        },
        {
            key: 'matiere',
            header: t('matiere'),
            sortable: true,
            render: (c) => {
                const couleur = c.affectationMatiere?.matiere?.couleur || c.couleur;
                return (
                    <div className="flex items-center gap-[var(--gap-xs)]">
                        {couleur && (
                            <span
                                className="inline-block h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: couleur }}
                            />
                        )}
                        <span className="text-[var(--color-text-primary)] truncate max-w-[120px]">
                            {c.affectationMatiere?.matiere?.nom ?? '—'}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'enseignant',
            header: t('enseignant'),
            sortable: true,
            render: (c) => {
                const ens = c.affectationMatiere?.enseignant;
                const prenom = ens?.utilisateur?.profil?.prenom ?? '';
                const nom = ens?.utilisateur?.profil?.nom ?? '';
                if (!prenom && !nom) return <span className="text-[var(--color-text-muted)]">—</span>;
                const initiales = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
                const nomComplet = `${prenom} ${nom}`.trim();
                return (
                    <div className="flex items-center gap-[var(--gap-xs)] truncate max-w-[140px]" title={nomComplet}>
                        <span
                            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-semibold text-white"
                            style={{
                                fontSize: 'clamp(0.5rem, 0.45rem + 0.15vw, 0.625rem)',
                                backgroundColor: 'var(--color-dominant-500)',
                            }}
                        >
                            {initiales}
                        </span>
                        <span className="text-[var(--color-text-secondary)] truncate">
                            {nomComplet}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'classe',
            header: t('classe'),
            sortable: true,
            render: (c) => (
                <span className="text-[var(--color-text-secondary)] truncate max-w-[100px]">
                    {c.affectationMatiere?.classeAnnee?.classe?.nom ?? '—'}
                </span>
            ),
        },
        {
            key: 'salle',
            header: t('salle'),
            sortable: true,
            render: (c) => (
                <span className="text-[var(--color-text-secondary)]">
                    {c.salle?.nom ?? '—'}
                </span>
            ),
        },
        {
            key: 'typeCreneau',
            header: t('type'),
            sortable: true,
            render: (c) => (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
                    {t(`creneau.types.${c.typeCreneau.toLowerCase()}`)}
                </span>
            ),
        },
        {
            key: 'statut',
            header: t('statut'),
            sortable: true,
            render: (c) => (
                <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        c.statut === 'VALIDE'
                            ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                            : 'bg-[var(--color-info)]/10 text-[var(--color-info)]'
                    }`}
                >
                    {c.statut === 'VALIDE' ? t('heureCours.modal.statuts.effectue') : t('heureCours.modal.statuts.planifie')}
                </span>
            ),
        },
        ...(onVoir || onModifier ? [{
            key: 'actions',
            header: t('actions'),
            renderActions: (c: CreneauHoraire) => {
                const actions = [];
                if (onVoir) actions.push({
                    key: 'voir',
                    label: t('voir'),
                    icon: Eye,
                    onClick: () => onVoir(c),
                });
                if (onModifier) actions.push({
                    key: 'modifier',
                    label: t('modifier'),
                    icon: Pencil,
                    onClick: () => onModifier(c),
                });
                return actions;
            },
        }] : []),
    ], [t, onVoir, onModifier]);

    return (
        <DataTable<CreneauHoraire>
            tableId="emploi-du-temps-liste"
            data={creneaux}
            columns={colonnes}
            enableReordering
            enablePinning
            enableColumnVisibility
            searchable
            searchPlaceholder={t('filtres.rechercherCreneau')}
            enableCollapsibleFilters
            filtres={[
                {
                    key: 'jour',
                    label: t('calendrier.jour'),
                    type: 'select',
                    options: [
                        { value: 'LUNDI', label: t('jours.lundi') },
                        { value: 'MARDI', label: t('jours.mardi') },
                        { value: 'MERCREDI', label: t('jours.mercredi') },
                        { value: 'JEUDI', label: t('jours.jeudi') },
                        { value: 'VENDREDI', label: t('jours.vendredi') },
                        { value: 'SAMEDI', label: t('jours.samedi') },
                    ],
                    allOptionLabel: t('filtres.tousJours'),
                },
                ...(matiereOptions && matiereOptions.length > 0 ? [{
                    key: 'affectationMatiereId',
                    label: t('matiere'),
                    type: 'select' as const,
                    options: matiereOptions,
                    allOptionLabel: t('filtres.toutesMatieres'),
                }] : []),
                {
                    key: 'statut',
                    label: t('statut'),
                    type: 'select',
                    options: [
                        { value: 'PLANIFIE', label: t('heureCours.modal.statuts.planifie') },
                        { value: 'VALIDE', label: t('heureCours.modal.statuts.effectue') },
                    ],
                    allOptionLabel: t('filtres.tousStatuts'),
                },
            ]}
            getRowId={(c) => c.id}
            emptyMessage={t('aucunCreneau')}
        />
    );
}
