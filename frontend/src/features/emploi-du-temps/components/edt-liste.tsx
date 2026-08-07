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
import { ColonneEnseignant, ColonneMatiere, ColonneClasse, ColonneSalle, BadgeStatutCreneau } from '@/components/ui/data-table';
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
                const mat = c.affectationMatiere?.matiere;
                return <ColonneMatiere matiere={mat ? { nom: mat.nom, couleur: mat.couleur ?? c.couleur, code: null } : undefined} />;
            },
        },
        {
            key: 'enseignant',
            header: t('enseignant'),
            sortable: true,
            render: (c) => {
                const ens = c.affectationMatiere?.enseignant;
                const profil = ens?.utilisateur?.profil;
                return <ColonneEnseignant enseignant={profil ? { prenom: profil.prenom, nom: profil.nom } : undefined} />;
            },
        },
        {
            key: 'classe',
            header: t('classe'),
            sortable: true,
            render: (c) => (
                <ColonneClasse classe={c.affectationMatiere?.classeAnnee?.classe ? { nom: c.affectationMatiere.classeAnnee.classe.nom, code: null } : undefined} />
            ),
        },
        {
            key: 'salle',
            header: t('salle'),
            sortable: true,
            render: (c) => (
                <ColonneSalle salle={c.salle ? { nom: c.salle.nom, code: null } : undefined} />
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
            render: (c) => {
                const statutEdt = c.statut === 'VALIDE' ? 'EFFECTUE' : 'PLANIFIE';
                const label = c.statut === 'VALIDE'
                    ? t('heureCours.modal.statuts.effectue')
                    : t('heureCours.modal.statuts.planifie');
                return <BadgeStatutCreneau statut={statutEdt} label={label} />;
            },
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
