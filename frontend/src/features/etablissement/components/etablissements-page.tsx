/**
 * ==================================
 * eLISAschool - Page Liste Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Power, PowerOff, Building2 } from 'lucide-react';
import { useEtablissements, useDesactiverEtablissement, useActiverEtablissement } from '../hooks/use-etablissements';
import { EtablissementFormModal } from './etablissement-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import { SousSysteme, TypeEtablissement, StatutEtablissement } from '../types/etablissement.types';
import type { Etablissement } from '../types/etablissement.types';
import type { Column } from '@/components/ui/DataTable';

export function EtablissementsPage() {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [showFormModal, setShowFormModal] = useState(false);
    const [etablissementToEdit, setEtablissementToEdit] = useState<Etablissement | null>(null);
    const [etablissementToToggle, setEtablissementToToggle] = useState<Etablissement | null>(null);

    const { data: etablissements = [], isLoading } = useEtablissements();
    const desactiver = useDesactiverEtablissement();
    const activer = useActiverEtablissement();

    const handleCreation = () => {
        setEtablissementToEdit(null);
        setShowFormModal(true);
    };

    const handleEdition = (etablissement: Etablissement) => {
        setEtablissementToEdit(etablissement);
        setShowFormModal(true);
    };

    const handleToggleActif = (etablissement: Etablissement) => {
        setEtablissementToToggle(etablissement);
    };

    const colonnes: Column<Etablissement>[] = [
        {
            key: 'nom',
            pinned: 'left' as const,
            header: 'Nom',
            sortable: true,
            render: (etab) => (
                <div>
                    <span className="font-medium">{etab.nom}</span>
                    {etab.codeEtablissement && (
                        <p className="text-xs text-gray-500 font-mono">{etab.codeEtablissement}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'sousSysteme',
            header: 'Sous-système',
            sortable: true,
            className: 'text-center',
            render: (etab) => {
                const colors: Record<string, string> = {
                    FRANCOPHONE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                    ANGLOPHONE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                    BICULTUREL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                };
                return (
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${colors[etab.sousSysteme] || 'bg-gray-100 text-gray-800'}`}>
                        {etab.sousSysteme}
                    </span>
                );
            },
        },
        {
            key: 'type',
            header: 'Type',
            sortable: true,
            className: 'text-center',
            render: (etab) => {
                const typeLabels: Record<string, string> = {
                    LAIC: 'Laïc',
                    CONFESSIONNEL_CATHOLIQUE: 'Catholique',
                    CONFESSIONNEL_PROTESTANT: 'Protestant',
                    CONFESSIONNEL_ISLAMIQUE: 'Islamique',
                    AUTRE: 'Autre',
                };
                return (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {typeLabels[etab.type] || etab.type}
                    </span>
                );
            },
        },
        {
            key: 'contactEmail',
            header: 'Email',
            render: (etab) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {etab.contactEmail || '-'}
                </span>
            ),
        },
        {
            key: 'contactTelephone',
            header: 'Téléphone',
            render: (etab) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {etab.contactTelephone || '-'}
                </span>
            ),
        },
        {
            key: 'effectifActuel',
            header: 'Effectif',
            sortable: true,
            className: 'text-center',
            render: (etab) => (
                <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold">
                    {etab.effectifActuel}
                    {etab.effectifMax && <span className="text-xs text-gray-500 ml-1">/ {etab.effectifMax}</span>}
                </span>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            sortable: true,
            className: 'text-center',
            render: (etab) => {
                const statutColors: Record<string, string> = {
                    ACTIF: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    EN_ATTENTE_VALIDATION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                    EN_ATTENTE_DESACTIVATION: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                    INACTIF: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                };
                return (
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statutColors[etab.statut] || 'bg-gray-100 text-gray-800'}`}>
                        {etab.statut}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: 'Actions',
            className: 'text-right',
            render: (etab) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => navigate({ to: '/etablissements/$id', params: { id: etab.id } })}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Voir détails"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission('etablissements:edit') && (
                        <button
                            onClick={() => handleEdition(etab)}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    )}
                    {hasPermission('etablissements:activer') && (
                        <button
                            onClick={() => handleToggleActif(etab)}
                            className={`p-1.5 rounded-lg transition-colors ${
                                etab.actif
                                    ? 'text-orange-600 hover:bg-orange-50'
                                    : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={etab.actif ? 'Désactiver' : 'Activer'}
                        >
                            {etab.actif ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Building2 className="h-8 w-8" />
                        Établissements
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {etablissements.length} établissement(s)
                    </p>
                </div>
                {hasPermission('etablissements:create') && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={handleCreation}
                    >
                        Nouvel établissement
                    </ElisaButton>
                )}
            </motion.div>

            <DataTable
                data={etablissements}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder="Rechercher un établissement..."
            />

            {showFormModal && (
                <EtablissementFormModal
                    mode={etablissementToEdit ? 'edition' : 'creation'}
                    etablissement={etablissementToEdit}
                    onSuccess={() => {
                        setShowFormModal(false);
                        setEtablissementToEdit(null);
                    }}
                    onCancel={() => {
                        setShowFormModal(false);
                        setEtablissementToEdit(null);
                    }}
                />
            )}

            <ConfirmDialog
                isOpen={!!etablissementToToggle}
                title={etablissementToToggle?.actif ? 'Désactiver cet établissement' : 'Activer cet établissement'}
                message={`Êtes-vous sûr de vouloir ${etablissementToToggle?.actif ? 'désactiver' : 'activer'} l'établissement "${etablissementToToggle?.nom}" ?`}
                variant={etablissementToToggle?.actif ? 'danger' : 'success'}
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
                onCancel={() => setEtablissementToToggle(null)}
                isLoading={desactiver.isPending || activer.isPending}
            />
        </div>
    );
}
