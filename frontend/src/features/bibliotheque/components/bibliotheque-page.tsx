/**
 * ==================================
 * eLISAschool - Page Bibliothèque
 * ==================================
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Book, Plus, Eye, Trash2, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useOuvrages, usePrets, useSupprimerOuvrage, useStatistiquesBibliotheque } from '../hooks/use-bibliotheque';
import type { Ouvrage } from '../types/bibliotheque.types';
import { CardGrid, StatCard } from '@/components/ui';

export function BibliothequePage() {
    const { t } = useTranslation('bibliotheque');
    const [page, setPage] = useState(1);
    const limit = 20;
    const [recherche, setRecherche] = useState('');
    const [filtreCategorie, setFiltreCategorie] = useState('');
    const [filtreDispo, setFiltreDispo] = useState('tous');

    const { data: result, isLoading, isError, error, refetch } = useOuvrages({
        recherche: recherche || undefined,
        categorie: filtreCategorie || undefined,
        disponibilite: filtreDispo as any,
    });
    const data = result?.data;
    const meta = result?.data?.meta;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    usePrets(); // prets non utilisé
    const { data: stats } = useStatistiquesBibliotheque();
    const supprimer = useSupprimerOuvrage();

    const categories: any = {
        manuel: { label: 'Manuel', color: 'blue' },
        roman: { label: 'Roman', color: 'purple' },
        documentaire: { label: 'Documentaire', color: 'green' },
        dictionnaire: { label: 'Dictionnaire', color: 'orange' },
        encyclopedie: { label: 'Encyclopédie', color: 'red' },
        revue: { label: 'Revue', color: 'pink' },
        autre: { label: 'Autre', color: 'gray' },
    };

    const colonnes: Column<Ouvrage>[] = [
        {
            key: 'categorie',
            header: 'Catégorie',
            className: 'text-center w-32',
            render: (o) => {
                const cat = categories[o.categorie];
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${cat?.color}-100 text-${cat?.color}-800`}>
                        {cat?.label}
                    </span>
                );
            },
        },
        {
            key: 'titre',
            header: 'Ouvrage',
            render: (o) => (
                <div>
                    <p className="font-medium text-gray-900">{o.titre}</p>
                    <p className="text-xs text-gray-500">{o.auteur}</p>
                    {o.isbn && <p className="text-xs text-gray-400">ISBN: {o.isbn}</p>}
                </div>
            ),
        },
        {
            key: 'exemplaires',
            header: 'Exemplaires',
            className: 'text-center w-32',
            render: (o) => (
                <div className="text-sm">
                    <span className="font-medium text-gray-900">{o.exemplairesDisponibles}</span>
                    <span className="text-gray-500">/{o.nombreExemplaires}</span>
                    {o.exemplairesDisponibles === 0 && (
                        <p className="text-xs text-red-600 font-medium">Indisponible</p>
                    )}
                </div>
            ),
        },
        {
            key: 'localisation',
            header: 'Localisation',
            className: 'w-24',
            render: (o) => (
                <span className="text-sm text-gray-700">{o.localisation || '-'}</span>
            ),
        },
        {
            key: 'editeur',
            header: 'Éditeur',
            className: 'w-32',
            render: (o) => (
                <div>
                    <p className="text-sm text-gray-700">{o.editeur || '-'}</p>
                    {o.anneePublication && (
                        <p className="text-xs text-gray-500">{o.anneePublication}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (o) => [
                {
                    key: 'detail',
                    icon: Eye,
                    label: 'Détail',
                    onClick: () => window.alert(`Détail: ${o.titre}`),
                    variant: 'info' as const,
                },
                {
                    key: 'preter',
                    icon: BookOpen,
                    label: 'Prêter',
                    onClick: () => window.alert(`Prêt: ${o.titre}`),
                    hidden: o.exemplairesDisponibles <= 0,
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => supprimer.mutateAsync(o.id),
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    if (isLoading && !data) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={error?.message || t('erreurChargement')} onRetry={refetch} />;

    return (
        <div className="space-y-6">
            <PageHeader
                variant="gradient"
                icon={BookOpen}
                title={t('titre')}
                subtitle={t('description')}
                showBreadcrumbs={false}
                actions={
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => window.alert('Ajouter ouvrage')}
                    >
                        {t('ajouter')}
                    </ElisaButton>
                }
            />

            {stats && (
                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={Book} label="Total ouvrages" value={stats.totalOuvrages} tone="accent" />
                    <StatCard icon={BookOpen} label="Disponibles" value={stats.exemplairesDisponibles} tone="success" />
                    <StatCard icon={Clock} label="Prêts en cours" value={stats.pretsEnCours} tone="orange" />
                    <StatCard icon={AlertCircle} label="Retards" value={stats.pretsEnRetard} tone="danger" />
                </CardGrid>
            )}



            <DataTable
                tableId="bibliotheque"
                columns={colonnes}
                data={data?.data || []}
                isLoading={isLoading}
                enableReordering
                enableRowHeight
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('rechercher')}
                onSearchChange={(valeur) => setRecherche(valeur)}
                disableClientSearch
                filtres={[
                    {
                        key: 'categorie',
                        label: 'Catégorie',
                        options: [
                            { value: '', label: 'Toutes catégories' },
                            { value: 'manuel', label: 'Manuel' },
                            { value: 'roman', label: 'Roman' },
                            { value: 'documentaire', label: 'Documentaire' },
                            { value: 'dictionnaire', label: 'Dictionnaire' },
                            { value: 'encyclopedie', label: 'Encyclopédie' },
                            { value: 'revue', label: 'Revue' },
                            { value: 'autre', label: 'Autre' },
                        ],
                    },
                    {
                        key: 'disponibilite',
                        label: 'Disponibilité',
                        options: [
                            { value: 'tous', label: 'Tous' },
                            { value: 'disponible', label: 'Disponibles' },
                            { value: 'indisponible', label: 'Indisponibles' },
                        ],
                    },
                ]}
                onFilterChange={(key, valeur) => {
                    if (key === 'categorie') setFiltreCategorie(valeur);
                    if (key === 'disponibilite') setFiltreDispo(valeur);
                }}
                pagination={{
                    page,
                    limit,
                    total: meta?.total || 0,
                    onPageChange: setPage,
                }}
            />
        </div>
    );
}
