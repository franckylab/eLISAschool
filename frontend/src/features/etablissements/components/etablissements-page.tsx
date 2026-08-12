/**
 * ==================================
 * eLISAschool - Page Établissements Complète
 * ==================================
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, AlertTriangle, Building2, MapPin, Phone } from 'lucide-react';
import { useEtablissements, useSupprimerEtablissement, useCreerEtablissement, useModifierEtablissement } from '../hooks/use-etablissements';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import type { Etablissement, EtablissementFiltres } from '../types/etablissement.types';
import type { Column } from '@/components/ui/DataTable';

export function EtablissementsPage() {
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<EtablissementFiltres>({ page: 1, limit: 20, recherche: '' });
    const [showFormModal, setShowFormModal] = useState(false);
    const [etablissementToEdit, setEtablissementToEdit] = useState<Etablissement | null>(null);
    const [etablissementToDelete, setEtablissementToDelete] = useState<Etablissement | null>(null);

    const { data, isLoading } = useEtablissements(filtres);
    const supprimer = useSupprimerEtablissement();

    const getTypeLabel = (type?: string) => {
        const labels: Record<string, string> = {
            'LAIC': 'Laïc',
            'CONFESSIONNEL_CATHOLIQUE': 'Catholique',
            'CONFESSIONNEL_PROTESTANT': 'Protestant',
            'CONFESSIONNEL_ISLAMIQUE': 'Islamique',
            'AUTRE': 'Autre',
        };
        return type ? labels[type] || type : '—';
    };

    const getSousSystemeLabel = (sousSysteme?: string) => {
        const labels: Record<string, string> = {
            'FRANCOPHONE': 'Francophone',
            'ANGLOPHONE': 'Anglophone',
            'BICULTUREL': 'Biculturel',
        };
        return sousSysteme ? labels[sousSysteme] || sousSysteme : '—';
    };

    const getStatutBadge = (statut?: string) => {
        const styles: Record<string, string> = {
            'ACTIF': 'bg-green-100 text-green-800',
            'EN_ATTENTE_VALIDATION': 'bg-yellow-100 text-yellow-800',
            'EN_ATTENTE_DESACTIVATION': 'bg-orange-100 text-orange-800',
            'INACTIF': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
        };
        const labels: Record<string, string> = {
            'ACTIF': 'Actif',
            'EN_ATTENTE_VALIDATION': 'En attente',
            'EN_ATTENTE_DESACTIVATION': 'Désactivation',
            'INACTIF': 'Inactif',
        };
        return statut ? (
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${styles[statut] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
                {labels[statut] || statut}
            </span>
        ) : '—';
    };

    const colonnes: Column<Etablissement>[] = [
        {
            key: 'nom',
            pinned: 'left' as const,
            header: 'Établissement',
            sortable: true,
            render: (e) => (
                <div>
                    <span className="font-semibold">{e.nom}</span>
                    {e.slogan && <p className="text-xs text-gray-500 dark:text-gray-400 italic">{e.slogan}</p>}
                </div>
            ),
        },
        {
            key: 'ville',
            header: 'Ville',
            sortable: true,
            render: (e) => (
                <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="h-3 w-3" />
                    {e.ville || '—'}
                </span>
            ),
        },
        {
            key: 'contactTelephone',
            header: 'Téléphone',
            render: (e) => (
                <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="h-3 w-3" />
                    {e.contactTelephone || '—'}
                </span>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            render: (e) => <span className="text-sm">{getTypeLabel(e.type)}</span>,
        },
        {
            key: 'sousSysteme',
            header: 'Système',
            render: (e) => <span className="text-sm">{getSousSystemeLabel(e.sousSysteme)}</span>,
        },
        {
            key: 'statut',
            header: 'Statut',
            sortable: true,
            className: 'text-center',
            render: (e) => getStatutBadge(e.statut),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (e) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir détails',
                    onClick: () => {},
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => { setEtablissementToEdit(e); setShowFormModal(true); },
                    permission: 'etablissements:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => setEtablissementToDelete(e),
                    permission: 'etablissements:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">Établissements</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{data?.meta?.totalItems || 0} établissement(s)</p>
                </div>
                {hasPermission('etablissements:create') && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setEtablissementToEdit(null);
                            setShowFormModal(true);
                        }}
                    >
                        Nouvel établissement
                    </ElisaButton>
                )}
            </motion.div>

            <DataTable
                tableId="etablissements"
                data={data?.data || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder="Rechercher un établissement..."
                onSearchChange={(recherche) =>
                    setFiltres({ ...filtres, recherche })
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
                onPageChange={(page) => setFiltres({ ...filtres, page })}
                onLimitChange={(limit) => setFiltres({ ...filtres, limit })}
            />

            {showFormModal && (
                <EtablissementFormModal
                    etablissement={etablissementToEdit}
                    onClose={() => {
                        setShowFormModal(false);
                        setEtablissementToEdit(null);
                    }}
                />
            )}

            {etablissementToDelete && (
                <ConfirmDialog
                    title="Supprimer l'établissement"
                    message={`Êtes-vous sûr de vouloir supprimer l'établissement "${etablissementToDelete.nom}" ?`}
                    onConfirm={async () => {
                        await supprimer.mutateAsync(etablissementToDelete.id);
                        setEtablissementToDelete(null);
                    }}
                    onCancel={() => setEtablissementToDelete(null)}
                />
            )}
        </div>
    );
}

// Modal Formulaire Établissement
function EtablissementFormModal({ etablissement, onClose }: { etablissement: Etablissement | null; onClose: () => void }) {
    const creer = useCreerEtablissement();
    const modifier = useModifierEtablissement();
    const isEditMode = !!etablissement;

    const [nom, setNom] = useState(etablissement?.nom || '');
    const [code, setCode] = useState(etablissement?.codeEtablissement || '');
    const [slogan, setSlogan] = useState(etablissement?.slogan || '');
    const [adresse, setAdresse] = useState(etablissement?.adresse || '');
    const [ville, setVille] = useState(etablissement?.ville || '');
    const [telephone, setTelephone] = useState(etablissement?.contactTelephone || '');
    const [email, setEmail] = useState(etablissement?.contactEmail || '');
    const [typeEtablissement, setTypeEtablissement] = useState(etablissement?.type || 'LAIC');
    const [sousSysteme, setSousSysteme] = useState(etablissement?.sousSysteme || 'FRANCOPHONE');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        if (!nom.trim()) newErrors.nom = 'Le nom est requis';
        if (!ville.trim()) newErrors.ville = 'La ville est requise';
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Email invalide';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) return;

        const dto = {
            nom,
            codeEtablissement: code || undefined,
            slogan: slogan || undefined,
            adresse: adresse || undefined,
            ville,
            contactTelephone: telephone || undefined,
            contactEmail: email || undefined,
            type: typeEtablissement,
            sousSysteme,
        };

        try {
            if (isEditMode && etablissement) {
                await modifier.mutateAsync({ id: etablissement.id, ...dto });
            } else {
                await creer.mutateAsync(dto);
            }
            onClose();
        } catch (error) {
            // Erreur déjà gérée par le hook
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-[var(--color-dominant-100)]">
                            <Building2 className="h-6 w-6 text-[var(--color-dominant-600)]" />
                        </div>
                        <h2 className="text-2xl font-bold">
                            {isEditMode ? "Modifier l'établissement" : 'Nouvel établissement'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        <AlertTriangle className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                            <input
                                type="text"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg border ${errors.nom ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]`}
                                placeholder="Ex: Complexe Scolaire Les Brillants"
                            />
                            {errors.nom && <p className="text-red-600 text-xs mt-1">{errors.nom}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]"
                                placeholder="Ex: csl_brillants"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slogan</label>
                            <input
                                type="text"
                                value={slogan}
                                onChange={(e) => setSlogan(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]"
                                placeholder="Ex: L'excellence éducative"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                            <input
                                type="text"
                                value={adresse}
                                onChange={(e) => setAdresse(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]"
                                placeholder="Adresse complète..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ville *</label>
                            <input
                                type="text"
                                value={ville}
                                onChange={(e) => setVille(e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg border ${errors.ville ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]`}
                                placeholder="Ex: Douala"
                            />
                            {errors.ville && <p className="text-red-600 text-xs mt-1">{errors.ville}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                            <input
                                type="tel"
                                value={telephone}
                                onChange={(e) => setTelephone(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]"
                                placeholder="+237 6XX XXX XXX"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]`}
                                placeholder="contact@etablissement.com"
                            />
                            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type d'établissement</label>
                            <select
                                value={typeEtablissement}
                                onChange={(e) => setTypeEtablissement(e.target.value as typeof typeEtablissement)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]"
                            >
                                <option value="LAIC">Laïc</option>
                                <option value="CONFESSIONNEL_CATHOLIQUE">Catholique</option>
                                <option value="CONFESSIONNEL_PROTESTANT">Protestant</option>
                                <option value="CONFESSIONNEL_ISLAMIQUE">Islamique</option>
                                <option value="AUTRE">Autre</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sous-système</label>
                            <select
                                value={sousSysteme}
                                onChange={(e) => setSousSysteme(e.target.value as typeof sousSysteme)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]"
                            >
                                <option value="FRANCOPHONE">Francophone</option>
                                <option value="ANGLOPHONE">Anglophone</option>
                                <option value="BICULTUREL">Biculturel</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={creer.isPending || modifier.isPending}
                            className="px-4 py-2 rounded-lg bg-[var(--color-dominant-600)] text-white hover:bg-[var(--color-dominant-700)] disabled:opacity-50 transition-colors"
                        >
                            {creer.isPending || modifier.isPending ? 'Enregistrement...' : (isEditMode ? 'Enregistrer' : 'Créer')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Dialog de confirmation
function ConfirmDialog({ title, message, onConfirm, onCancel }: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200">{title}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                            Annuler
                        </button>
                        <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
