import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Globe, BookOpen, Layers, Users, TrendingUp, Filter } from 'lucide-react';
import { useMatieres, useSupprimerMatiere, useCreerMatiere, useModifierMatiere, useMatiereProgramme } from '../hooks/use-matieres';
import { MatiereFormModal } from './matiere-form-modal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LoadingState, ErrorState } from '@/components/feedback';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import type { Matiere, MatiereFiltres } from '../types/matiere.types';
import type { Column } from '@/components/ui/DataTable';

const sousSystemeOptions = [
    { value: '', label: 'Tous les systèmes' },
    { value: 'FRANCOPHONE', label: 'Francophone' },
    { value: 'ANGLOPHONE', label: 'Anglophone' },
    { value: 'BICULTUREL', label: 'Biculturel' },
];

export function MatieresPage() {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<MatiereFiltres>({ page: 1, limit: 50 });
    const [formOpen, setFormOpen] = useState(false);
    const [matiereToEdit, setMatiereToEdit] = useState<Matiere | null>(null);
    const [matiereToDelete, setMatiereToDelete] = useState<Matiere | null>(null);

    const { data, isLoading, error, refetch } = useMatieres(filtres);
    const creer = useCreerMatiere();
    const modifier = useModifierMatiere();
    const supprimer = useSupprimerMatiere();

    const stats = useMemo(() => {
        const items = data?.items || [];
        const total = data?.meta?.totalItems || 0;
        const countFR = items.filter(m => m.sousSysteme === 'FRANCOPHONE').length;
        const countAN = items.filter(m => m.sousSysteme === 'ANGLOPHONE').length;
        const countBI = items.filter(m => m.sousSysteme === 'BICULTUREL').length;
        const countCO = items.filter(m => !m.sousSysteme).length;
        const countActif = items.filter(m => m.actif).length;
        const countInactif = items.filter(m => !m.actif).length;
        return { total, countFR, countAN, countBI, countCO, countActif, countInactif };
    }, [data]);

    const handleSave = async (data: any) => {
        if (matiereToEdit) {
            await modifier.mutateAsync({ id: matiereToEdit.id, ...data });
        } else {
            await creer.mutateAsync(data);
        }
        setFormOpen(false);
        setMatiereToEdit(null);
    };

    const handleEdition = (matiere: Matiere) => {
        setMatiereToEdit(matiere);
        setFormOpen(true);
    };

    const handleCreation = () => {
        setMatiereToEdit(null);
        setFormOpen(true);
    };

    const sousSystemeLabel = (v: string | null) => {
        if (!v) return 'Commun';
        const opt = sousSystemeOptions.find(o => o.value === v);
        return opt ? opt.label : v;
    };

    const colonnes: Column<Matiere>[] = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (m) => <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">{m.code  || '-'}</span>,
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: t('commun.nom'),
            sortable: true,
            render: (m) => (
                <button
                    onClick={() => window.location.href = `/matieres/${m.id}`}
                    className="hover:underline cursor-pointer text-left"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.couleur }} />
                        <p className="font-medium">{m.nom}</p>
                        {m.nomAnglais && <span className="text-xs text-gray-400">({m.nomAnglais})</span>}
                    </div>
                </button>
            ),
        },
        {
            key: 'sousSysteme',
            header: 'Système',
            sortable: false,
            className: 'text-center',
            render: (m) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    !m.sousSysteme ? 'bg-gray-100 text-gray-700' :
                    m.sousSysteme === 'FRANCOPHONE' ? 'bg-blue-100 text-blue-700' :
                    m.sousSysteme === 'ANGLOPHONE' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                }`}>
                    {sousSystemeLabel(m.sousSysteme)}
                </span>
            ),
        },
        {
            key: 'actif',
            header: t('commun.statut'),
            sortable: true,
            className: 'text-center',
            render: (m) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${m.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {m.actif ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('commun.actions'),
            className: 'text-right',
            renderActions: (m) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir détails',
                    onClick: () => window.location.href = `/matieres/${m.id}`,
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => handleEdition(m),
                    permission: 'config:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => setMatiereToDelete(m),
                    permission: 'config:edit',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement des matières..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <ErrorState
                    message={error.message || "Impossible de charger les matières"}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div className="flex justify-between items-start" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold">{t('matieres.titre', { defaultValue: 'Matières' })}</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">{stats.total} matière(s)</p>
                </div>
                {hasPermission('matieres:create') && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleCreation}>{t('boutons.nouveau')}</ElisaButton>
                )}
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatMini icon={BookOpen} label="Total" value={stats.total} color="blue" />
                <StatMini icon={Globe} label="Francophone" value={stats.countFR} color="blue" />
                <StatMini icon={Globe} label="Anglophone" value={stats.countAN} color="green" />
                <StatMini icon={Globe} label="Commun" value={stats.countCO} color="gray" />
                <StatMini icon={TrendingUp} label="Actifs" value={stats.countActif} color={stats.countActif > 0 ? 'green' : 'gray'} />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Filtres</span>
                    <select
                        value={filtres.sousSysteme || ''}
                        onChange={(e) => setFiltres(prev => ({ ...prev, sousSysteme: e.target.value as any, page: 1 }))}
                        className="ml-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                    >
                        {sousSystemeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select
                        value={filtres.actif === undefined ? '' : String(filtres.actif)}
                        onChange={(e) => setFiltres(prev => ({ ...prev, actif: e.target.value === '' ? undefined : e.target.value === 'true', page: 1 }))}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="true">Actifs</option>
                        <option value="false">Inactifs</option>
                    </select>
                </div>
            </div>

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('filtres.recherche')}
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

            {formOpen && (
                <MatiereFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) { setFormOpen(false); setMatiereToEdit(null); } }}
                    matiere={matiereToEdit}
                    onSave={handleSave}
                    isLoading={creer.isPending || modifier.isPending}
                />
            )}

            <ConfirmationModal
                isOpen={!!matiereToDelete}
                title="Supprimer cette matière"
                message={`Êtes-vous sûr de vouloir supprimer la matière "${matiereToDelete?.nom}" ?`}
                details="Cette action est irréversible et supprimera toutes les données associées."
                variant="danger"
                onConfirm={async () => {
                    if (matiereToDelete) {
                        await supprimer.mutateAsync(matiereToDelete.id);
                        setMatiereToDelete(null);
                    }
                }}
                onCancel={() => setMatiereToDelete(null)}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}

function StatMini({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        gray: 'bg-gray-50 text-gray-700 border-gray-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        red: 'bg-red-50 text-red-700 border-red-200',
    };
    const c = colors[color] || colors.gray;
    return (
        <div className={`rounded-lg border p-3 ${c}`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="text-xl font-bold">{value}</p>
        </div>
    );
}
