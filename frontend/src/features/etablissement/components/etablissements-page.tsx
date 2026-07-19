import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Edit, Eye, Power, PowerOff, Building2 } from 'lucide-react';
import { useEtablissements, useDesactiverEtablissement, useActiverEtablissement } from '../hooks/use-etablissements';
import { EtablissementFormModal } from './etablissement-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Etablissement } from '../types/etablissement.types';
import type { Column } from '@/components/ui/DataTable';

const SOUS_SYSTEME_OPTIONS = [
    { value: 'FRANCOPHONE', label: 'Francophone' },
    { value: 'ANGLOPHONE', label: 'Anglophone' },
    { value: 'BICULTUREL', label: 'Biculturel' },
];

const STATUT_OPTIONS = [
    { value: 'ACTIF', label: 'Actif' },
    { value: 'EN_ATTENTE_VALIDATION', label: 'En attente validation' },
    { value: 'EN_ATTENTE_DESACTIVATION', label: 'En attente désactivation' },
    { value: 'INACTIF', label: 'Inactif' },
];

const TYPE_LABELS: Record<string, string> = {
    LAIC: 'Laïc',
    CONFESSIONNEL_CATHOLIQUE: 'Catholique',
    CONFESSIONNEL_PROTESTANT: 'Protestant',
    CONFESSIONNEL_ISLAMIQUE: 'Islamique',
    AUTRE: 'Autre',
};

const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

const SOUS_SYSTEME_COLORS: Record<string, string> = {
    FRANCOPHONE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    ANGLOPHONE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    BICULTUREL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const STATUT_COLORS: Record<string, string> = {
    ACTIF: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    EN_ATTENTE_VALIDATION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    EN_ATTENTE_DESACTIVATION: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    INACTIF: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function EtablissementsPage() {
    const { t } = useTranslation('etablissement');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [showFormModal, setShowFormModal] = useState(false);
    const [etablissementToToggle, setEtablissementToToggle] = useState<Etablissement | null>(null);

    const { data: etablissements = [], isLoading, isFetching, error, refetch } = useEtablissements();
    const desactiver = useDesactiverEtablissement();
    const activer = useActiverEtablissement();

    const handleToggleActif = (etablissement: Etablissement) => {
        setEtablissementToToggle(etablissement);
    };

    const colonnes: Column<Etablissement>[] = [
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('nom'),
            sortable: true,
            render: (etab) => (
                <div>
                    <span className="font-medium">{etab.nom}</span>
                    {etab.codeEtablissement && (
                        <p className="text-xs text-[var(--color-texte-muted)] font-mono">{etab.codeEtablissement}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'sousSysteme',
            header: t('sousSysteme'),
            sortable: true,
            className: 'text-center',
            render: (etab) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${SOUS_SYSTEME_COLORS[etab.sousSysteme] || 'bg-gray-100 text-gray-800'}`}>
                    {etab.sousSysteme}
                </span>
            ),
        },
        {
            key: 'type',
            header: t('type'),
            sortable: true,
            className: 'text-center',
            render: (etab) => (
                <span className="text-sm text-[var(--color-texte-secondaire)]">
                    {TYPE_LABELS[etab.type] || etab.type}
                </span>
            ),
        },
        {
            key: 'contactEmail',
            header: t('email'),
            render: (etab) => (
                <span className="text-sm text-[var(--color-texte-secondaire)]">
                    {etab.contactEmail || '-'}
                </span>
            ),
        },
        {
            key: 'contactTelephone',
            header: t('telephone'),
            render: (etab) => (
                <span className="text-sm text-[var(--color-texte-secondaire)]">
                    {etab.contactTelephone || '-'}
                </span>
            ),
        },
        {
            key: 'effectifActuel',
            header: t('effectif'),
            sortable: true,
            className: 'text-center',
            render: (etab) => (
                <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-bg-tertiaire)] px-3 py-1 text-sm font-semibold">
                    {etab.effectifActuel}
                    {etab.effectifMax && <span className="text-xs text-[var(--color-texte-muted)] ml-1">/ {etab.effectifMax}</span>}
                </span>
            ),
        },
        {
            key: 'statut',
            header: t('statut'),
            sortable: true,
            className: 'text-center',
            render: (etab) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUT_COLORS[etab.statut] || 'bg-gray-100 text-gray-800'}`}>
                    {etab.statut}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('actions'),
            className: 'text-right',
            renderActions: (etab) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('voirDetails'),
                    onClick: () => navigate({ to: '/etablissements/$id', params: { id: etab.id }, search: { mode: 'view' } }),
                    permission: 'etablissements:view',
                    variant: 'info' as const,
                },
                {
                    key: 'configurer',
                    icon: Edit,
                    label: t('configurer'),
                    onClick: () => navigate({ to: '/etablissements/$id', params: { id: etab.id } }),
                    permission: 'etablissements:edit',
                    variant: 'success' as const,
                },
                {
                    key: 'toggle',
                    icon: etab.actif ? PowerOff : Power,
                    label: etab.actif ? t('desactiver') : t('activer'),
                    onClick: () => handleToggleActif(etab),
                    permission: 'etablissements:activer',
                    variant: etab.actif ? 'warning' as const : 'success' as const,
                },
            ],
        },
    ];

    if (isLoading && etablissements.length === 0) {
        return <PageSkeleton showTable />;
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('chargement', { defaultValue: 'Erreur de chargement' })}
                    message={error.message}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('titre')}
                subtitle={t('nbEtablissements', { count: etablissements.length })}
                icon={Building2}
                variant="gradient"
                actions={hasPermission('etablissements:create') ? (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => setShowFormModal(true)}
                    >
                        {t('nouvelEtablissement')}
                    </ElisaButton>
                ) : undefined}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DataTable
                    tableId="etablissements"
                    data={etablissements}
                    columns={colonnes}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    enableCollapsibleFilters
                    filtres={[
                        {
                            key: 'sousSysteme',
                            label: t('sousSysteme'),
                            options: SOUS_SYSTEME_OPTIONS,
                            allOptionLabel: t('tousSousSystemes', { defaultValue: 'Tous' }),
                        },
                        {
                            key: 'type',
                            label: t('type'),
                            options: TYPE_OPTIONS,
                            allOptionLabel: t('tousTypes', { defaultValue: 'Tous' }),
                        },
                        {
                            key: 'statut',
                            label: t('statut'),
                            options: STATUT_OPTIONS,
                            allOptionLabel: t('tousStatuts', { defaultValue: 'Tous' }),
                        },
                    ]}
                    searchPlaceholder={t('rechercher')}
                />
            </motion.div>

            {showFormModal && (
                <EtablissementFormModal
                    open={showFormModal}
                    onOpenChange={(v) => { if (!v) setShowFormModal(false); }}
                />
            )}

            <ConfirmDialog
                open={!!etablissementToToggle}
                onOpenChange={(open) => { if (!open) setEtablissementToToggle(null); }}
                onConfirm={async () => {
                    if (etablissementToToggle) {
                        if (etablissementToToggle.actif) {
                            await desactiver.mutateAsync(etablissementToToggle.id);
                        } else {
                            await activer.mutateAsync(etablissementToToggle.id);
                        }
                        setEtablissementToToggle(null);
                    }
                }}
                title={etablissementToToggle?.actif ? t('confirmerDesactivation') : t('confirmerActivation')}
                description={etablissementToToggle?.actif
                    ? t('messageDesactivation', { nom: etablissementToToggle?.nom })
                    : t('messageActivation', { nom: etablissementToToggle?.nom })
                }
                variant={etablissementToToggle?.actif ? 'danger' : 'warning'}
                isLoading={desactiver.isPending || activer.isPending}
            />
        </div>
    );
}
