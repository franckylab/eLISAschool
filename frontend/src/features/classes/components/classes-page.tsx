import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Users, Edit, Trash2, Eye, Power, GraduationCap, School, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { useClasses, useSupprimerClasse, useToggleActifClasse } from '../hooks/use-classes';
import { ClasseFormModal } from './classe-form-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { Classe, ClasseFiltres } from '../types/classe.types';

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className || ''}`} />;
}

export function ClassesPage() {
    const { t } = useTranslation('classes');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const [filtres, setFiltres] = useState<ClasseFiltres>({ page: 1, limit: 20 });
    const [modalOpen, setModalOpen] = useState(false);
    const [classeSelected, setClasseSelected] = useState<Classe | undefined>();
    const [modeFormulaire, setModeFormulaire] = useState<'creation' | 'edition'>('creation');
    const [classeToDelete, setClasseToDelete] = useState<Classe | null>(null);
    const [classeToToggle, setClasseToToggle] = useState<Classe | null>(null);

    const { data, isLoading, error, refetch } = useClasses(filtres);
    const supprimer = useSupprimerClasse();

    const computedStats = useMemo(() => {
        const items = data?.items || [];
        return {
            total: data?.meta?.totalItems ?? 0,
            actives: items.filter(c => c.actif).length,
            effectifTotal: items.reduce((sum, c) => sum + (c.effectifActuel || 0), 0),
            niveaux: new Set(items.map(c => c.niveauId)).size,
        };
    }, [data]);
    const toggleActif = useToggleActifClasse();

    const handleCreation = () => {
        setModeFormulaire('creation');
        setClasseSelected(undefined);
        setModalOpen(true);
    };

    const handleEdition = (classe: Classe) => {
        setModeFormulaire('edition');
        setClasseSelected(classe);
        setModalOpen(true);
    };

    const handleVoirDetail = (classe: Classe) => {
        navigate({ to: '/classes/$id', params: { id: classe.id } });
    };

    const handleToggleActif = (classe: Classe) => {
        setClasseToToggle(classe);
    };

    const confirmToggleActif = async () => {
        if (classeToToggle) {
            await toggleActif.mutateAsync({ id: classeToToggle.id, actif: !classeToToggle.actif });
            setClasseToToggle(null);
        }
    };

    const handleSuccess = () => {
        setModalOpen(false);
        setClasseSelected(undefined);
    };

    const colonnes: Column<Classe>[] = [
        {
            key: 'code',
            header: t('colonnes.code'),
            sortable: true,
            render: (classe) => (
                <button
                    onClick={() => handleVoirDetail(classe)}
                    className="font-mono font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                    {classe.code}
                </button>
            ),
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('colonnes.nom'),
            sortable: true,
            render: (classe) => (
                <button
                    onClick={() => handleVoirDetail(classe)}
                    className="hover:underline cursor-pointer text-left"
                >
                    <p className="font-medium text-gray-900 dark:text-gray-200 text-sm">{classe.nom}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-200">
                        {classe.niveau?.nom}
                        {classe.filiere && ` - ${classe.filiere.code}`}
                    </p>
                </button>
            ),
        },
        {
            key: 'effectif',
            header: t('colonnes.effectif'),
            sortable: true,
            className: 'text-center',
            render: (classe) => (
                <div className="flex items-center justify-center gap-1">
                    <Users className="h-3.5 w-3.5 text-gray-400 dark:text-gray-100" />
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-200">
                        {classe.effectifActuel || 0} / {classe.effectifMax || '∞'}
                    </span>
                </div>
            ),
        },
        {
            key: 'salle',
            header: t('colonnes.salle'),
            render: (classe) => (
                <span className="text-sm text-gray-700 dark:text-gray-400">
                    {classe.salle?.nom || classe.sallePrincipaleId?.substring(0, 8) || '-'}
                </span>
            ),
        },
        {
            key: 'principal',
            header: t('colonnes.principal'),
            render: (classe) => (
                <span className="text-sm text-gray-700 dark:text-gray-400">
                    {classe.professeurPrincipal
                        ? `${classe.professeurPrincipal.prenom} ${classe.professeurPrincipal.nom}`
                        : '-'}
                </span>
            ),
        },
        {
            key: 'typeClasse',
            header: t('colonnes.type'),
            className: 'text-center',
            render: (classe) => {
                const typeColors: Record<string, string> = {
                    NORMALE: 'bg-blue-100 text-blue-800',
                    BILINGUE: 'bg-purple-100 text-purple-800',
                    RENFORCEE: 'bg-orange-100 text-orange-800',
                    INTERNATIONALE: 'bg-indigo-100 text-indigo-800',
                };
                const typeLabels: Record<string, string> = {
                    NORMALE: t('types.normale'),
                    BILINGUE: t('types.bilingue'),
                    RENFORCEE: t('types.renforcee'),
                    INTERNATIONALE: t('types.internationale'),
                };
                return (
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${typeColors[classe.typeClasse] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
                        {typeLabels[classe.typeClasse] || classe.typeClasse}
                    </span>
                );
            },
        },
        {
            key: 'creneauHoraire',
            header: t('colonnes.creneau'),
            className: 'text-center',
            render: (classe) => {
                const creneauLabels: Record<string, string> = {
                    MATIN: t('creneaux.matin'),
                    APRES_MIDI: t('creneaux.apresMidi'),
                    JOURNEE_COMPLETE: t('creneaux.journeeComplete'),
                };
                return (
                    <span className="text-sm text-gray-500 dark:text-gray-200">
                        {creneauLabels[classe.creneauHoraire] || classe.creneauHoraire}
                    </span>
                );
            },
        },
        {
            key: 'statut',
            header: t('colonnes.statut'),
            sortable: true,
            className: 'text-center',
            render: (classe) => (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    classe.actif
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}>
                    {classe.actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {classe.actif ? t('statut.actif') : t('statut.inactif')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('colonnes.actions'),
            className: 'text-right',
            renderActions: (classe) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('actions.voir'),
                    onClick: () => handleVoirDetail(classe),
                    variant: 'info' as const,
                },
                {
                    key: 'toggleActif',
                    icon: Power,
                    label: classe.actif ? t('actions.desactiver') : t('actions.activer'),
                    onClick: () => handleToggleActif(classe),
                    permission: 'classes:edit',
                    variant: classe.actif ? 'warning' as const : 'success' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('actions.modifier'),
                    onClick: () => handleEdition(classe),
                    permission: 'classes:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('actions.supprimer'),
                    onClick: () => setClasseToDelete(classe),
                    permission: 'classes:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    if (isLoading && !data?.items?.length) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <Skeleton className="h-10 w-56 mb-8" />
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-4">
                <p className="text-red-600 font-medium">{error.message || t('erreurs.chargement')}</p>
                <ElisaButton variant="outline" onClick={() => refetch()}>
                    {t('boutons.retour')}
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <PageHeader
                    variant="gradient"
                    icon={GraduationCap}
                    title={t('titre')}
                    subtitle={`${data?.meta?.totalItems || 0} ${t('sousTitre.classesActives')}`}
                    actions={hasPermission('classes:create') ? (
                        <ElisaButton onClick={handleCreation} icon={<Plus className="h-4 w-4" />}>
                            {t('boutons.nouveau')}
                        </ElisaButton>
                    ) : undefined}
                />

                <CardGrid columns={{ default: 1, sm: 2, lg: 4 }} className="mb-8">
                    <StatCard icon={School} label={t('stats.total') || 'Total'} value={computedStats.total} tone="dominant" />
                    <StatCard icon={CheckCircle} label={t('stats.actives') || 'Actives'} value={computedStats.actives} tone="success" />
                    <StatCard icon={Users} label={t('stats.effectifTotal') || 'Effectif total'} value={computedStats.effectifTotal} tone="purple" />
                    <StatCard icon={BookOpen} label={t('stats.niveaux') || 'Niveaux'} value={computedStats.niveaux} tone="info" />
                </CardGrid>

                <DataTable
                    tableId="classes"
                    data={data?.items || []}
                    columns={colonnes}
                    isLoading={isLoading}
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    searchPlaceholder={t('filtres.recherchePlaceholder')}
                    onSearchChange={(recherche) =>
                        setFiltres((prev) => ({ ...prev, recherche, page: 1 }))
                    }
                    disableClientSearch
                    pagination={data?.meta ? {
                        page: data.meta.currentPage,
                        limit: data.meta.itemsPerPage,
                        total: data.meta.totalItems,
                        totalPages: data.meta.totalPages,
                        hasNext: data.meta.currentPage < data.meta.totalPages,
                        hasPrev: data.meta.currentPage > 1,
                    } : undefined}
                    onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                    onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
                />

                {modalOpen && (
                    <ClasseFormModal
                        mode={modeFormulaire}
                        classe={classeSelected}
                        onSuccess={handleSuccess}
                        onCancel={() => setModalOpen(false)}
                    />
                )}

                <ConfirmationModal
                    isOpen={!!classeToDelete}
                    title={t('confirmations.supprimerTitre')}
                    message={t('confirmations.supprimerMessage', { nom: classeToDelete?.nom || '' })}
                    details={t('confirmations.supprimerDetails')}
                    variant="danger"
                    onConfirm={async () => {
                        if (classeToDelete) {
                            await supprimer.mutateAsync(classeToDelete.id);
                            setClasseToDelete(null);
                        }
                    }}
                    onCancel={() => setClasseToDelete(null)}
                    isLoading={supprimer.isPending}
                />

                <ConfirmationModal
                    isOpen={!!classeToToggle}
                    title={classeToToggle?.actif ? t('confirmations.desactiverTitre') : t('confirmations.activerTitre')}
                    message={classeToToggle?.actif
                        ? t('confirmations.desactiverMessage', { nom: classeToToggle?.nom || '' })
                        : t('confirmations.activerMessage', { nom: classeToToggle?.nom || '' })
                    }
                    variant={classeToToggle?.actif ? 'warning' : 'info'}
                    onConfirm={confirmToggleActif}
                    onCancel={() => setClasseToToggle(null)}
                    isLoading={toggleActif.isPending}
                />
            </motion.div>
        </div>
    );
}
