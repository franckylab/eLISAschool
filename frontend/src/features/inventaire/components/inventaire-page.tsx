import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Plus, AlertTriangle, TrendingUp, DollarSign, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useMateriels, useSupprimerMateriel, useStatistiquesInventaire } from '../hooks/use-inventaire';
import type { Materiel } from '../types/inventaire.types';

export function InventairePage() {
    const { t } = useTranslation('inventaire');
    const [page, setPage] = useState(1);
    const [recherche, setRecherche] = useState('');
    const [filtreCategorie, setFiltreCategorie] = useState('');
    const [filtreEtat, setFiltreEtat] = useState('');

    const { data, isLoading, error, meta } = useMateriels({ recherche: recherche || undefined, categorie: filtreCategorie || undefined, etat: filtreEtat || undefined });
    const { data: stats } = useStatistiquesInventaire();
    const supprimer = useSupprimerMateriel();

    const categories: any = {
        mobilier: { label: t('mobilier'), color: 'blue' },
        informatique: { label: t('informatique'), color: 'purple' },
        pedagogique: { label: t('pedagogique'), color: 'green' },
        entretien: { label: t('entretien'), color: 'orange' },
        autre: { label: t('autre'), color: 'gray' },
    };

    const etats: any = {
        neuf: { label: t('neuf'), color: 'green' },
        bon: { label: t('bon'), color: 'blue' },
        moyen: { label: t('moyen'), color: 'yellow' },
        use: { label: t('use'), color: 'orange' },
        hors_service: { label: t('horsService'), color: 'red' },
    };

    const colonnes: Column<Materiel>[] = [
        { key: 'reference', header: t('reference'), className: 'w-28', render: (m) => <span className="text-sm font-mono text-gray-700">{m.reference}</span>},
        { key: 'designation', header: t('designation'), render: (m) => (<div><p className="font-medium text-gray-900">{m.designation}</p>{m.fournisseur && <p className="text-xs text-gray-500">{m.fournisseur}</p>}</div>)},
        { key: 'categorie', header: t('categorie'), className: 'text-center w-28', render: (m) => { const cat = categories[m.categorie]; return (<span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${cat?.color}-100 text-${cat?.color}-800`}>{cat?.label}</span>); }},
        { key: 'quantite', header: t('quantite'), className: 'text-center w-20', render: (m) => <span className="text-sm font-medium">{m.quantiteDisponible}/{m.quantite}</span>},
        { key: 'etat', header: t('etat'), className: 'text-center w-28', render: (m) => { const etat = etats[m.etat]; return (<span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-${etat?.color}-100 text-${etat?.color}-800`}>{etat?.label}</span>); }},
        { key: 'prix', header: t('prixUnitaire'), className: 'text-right w-24', render: (m) => <span className="text-sm text-gray-700">{m.prixUnitaire ? `${m.prixUnitaire.toLocaleString('fr-FR')} FCFA` : '-'}</span>},
        { key: 'actions', header: t('actions'), className: 'text-right w-20',
            renderActions: (m) => [
                { key: 'supprimer', icon: Trash2, label: t('supprimer'), onClick: () => supprimer.mutateAsync(m.id), variant: 'danger' as const },
            ],
        },
    ];

    if (isLoading && !data) return <PageSkeleton />;
    if (error) return <ErrorMessage message={error?.message || t('uneErreurEstSurvenue')} onRetry={() => window.location.reload()} />;

    return (
        <div className="space-y-6">
            <PageHeader
                variant="gradient"
                icon={Package}
                title={t('titre')}
                subtitle={t('description')}
                actions={
                    <ElisaButton variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => window.alert(t('ajouter'))}>{t('ajouter')}</ElisaButton>
                }
            />

            {stats && (
                <CardGrid columns={{ default: 1, md: 4 }}>
                    <StatCard icon={Package} label={t('totalMateriel')} value={stats.totalMateriel} tone="accent" />
                    <StatCard icon={TrendingUp} label={t('valeurTotale')} value={`${stats.valeurTotale?.toLocaleString('fr-FR')} FCFA`} tone="success" />
                    <StatCard icon={AlertTriangle} label={t('horsService')} value={stats.materielsHorsService} tone="danger" />
                    <StatCard icon={DollarSign} label={t('categories')} value={stats.parCategorie?.length || 0} tone="purple" />
                </CardGrid>
            )}

            <DataTable
                colonnes={colonnes}
                donnees={data || []}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('rechercher')}
                filtres={[
                    {
                        key: 'categorie',
                        label: t('categorie'),
                        options: [
                            { value: 'mobilier', label: t('mobilier') },
                            { value: 'informatique', label: t('informatique') },
                            { value: 'pedagogique', label: t('pedagogique') },
                            { value: 'entretien', label: t('entretien') },
                            { value: 'autre', label: t('autre') },
                        ],
                        allOptionLabel: t('toutesCategories'),
                    },
                    {
                        key: 'etat',
                        label: t('etat'),
                        options: [
                            { value: 'neuf', label: t('neuf') },
                            { value: 'bon', label: t('bon') },
                            { value: 'moyen', label: t('moyen') },
                            { value: 'use', label: t('use') },
                            { value: 'hors_service', label: t('horsService') },
                        ],
                        allOptionLabel: t('tousEtats'),
                    },
                ]}
                onSearchChange={setRecherche}
                onFilterChange={(key, valeur) => {
                    if (key === 'categorie') setFiltreCategorie(valeur);
                    if (key === 'etat') setFiltreEtat(valeur);
                }}
                disableClientSearch
                pagination={{ page, limit: 20, total: meta?.total || 0, onPageChange: setPage }}
            />
        </div>
    );
}
