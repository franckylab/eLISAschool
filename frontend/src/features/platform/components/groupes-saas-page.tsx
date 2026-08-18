/**
 * ==================================
 * eLISAschool - Page Groupes SaaS
 * ==================================
 * 
 * Gestion des groupes d'établissements depuis la plateforme.
 * CRUD, membres, configuration modules/remises/abonnement.
 * 
 * Lot C v7 — Refonte SaaS
 */

import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    Users,
    Plus,
    Trash2,
    Settings,
    Building2,
    Package,
    Layers,
    CreditCard,
    ChevronRight,
    X,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { CustomModal } from '@/components/modals';
import { ElisaButton } from '@/components/ui';

// ─── Types ───────────────────────────────────────────────────────

interface GroupeEtablissement {
    id: string;
    nom: string;
    description?: string;
    code: string;
    actif: boolean;
    proprietaireId: string;
    etablissements?: Array<{
        id: string;
        etablissementId: string;
        etablissement?: { id: string; nom: string };
    }>;
    creeAt: string;
}



// ─── Hook API ────────────────────────────────────────────────────

function useGroupes() {
    return useQuery({
        queryKey: ['groupes-saas'],
        queryFn: async () => {
            const res = await apiClient.get<GroupeEtablissement[]>('/api/platform/facturation/groupes');
            return res.data ?? [];
        },
    });
}

function useCreateGroupe(t: TFunction) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { nom: string; description?: string; code: string }) =>
            apiClient.post('/api/platform/facturation/groupes', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['groupes-saas'] });
            toast.success(t('groupes.toast.cree'));
        },
        onError: () => toast.error(t('groupes.toast.erreurCreation')),
    });
}


function useDeleteGroupe(t: TFunction) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/platform/facturation/groupes/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['groupes-saas'] });
            toast.success(t('groupes.toast.supprime'));
        },
    });
}

function useAddMembre(t: TFunction) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ groupeId, etablissementId }: { groupeId: string; etablissementId: string }) =>
            apiClient.post(`/api/platform/facturation/groupes/${groupeId}/membres`, { etablissementId }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['groupes-saas'] });
            toast.success(t('groupes.toast.membreAjoute'));
        },
    });
}

function useRemoveMembre(t: TFunction) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ groupeId, etablissementId }: { groupeId: string; etablissementId: string }) =>
            apiClient.delete(`/api/platform/facturation/groupes/${groupeId}/membres/${etablissementId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['groupes-saas'] });
            toast.success(t('groupes.toast.membreRetire'));
        },
    });
}

// ─── Composant principal ─────────────────────────────────────────

export default function GroupesSaaSPage() {
    const { t } = useTranslation('admin');
    const [selectedGroupe, setSelectedGroupe] = useState<GroupeEtablissement | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);

    const { data: groupes, isLoading } = useGroupes();
    const createMutation = useCreateGroupe(t);
    const deleteMutation = useDeleteGroupe(t);

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[var(--text-xl)] font-bold flex items-center gap-[var(--gap-sm)]">
                        <Users className="h-[var(--icon-lg)] w-[var(--icon-lg)]" />
                        {t('groupes.titre', 'Groupes d\'établissements')}
                    </h1>
                    <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                        {t('groupes.description', 'Gérez les groupes logiques d\'établissements et leur configuration SaaS')}
                    </p>
                </div>
                <ElisaButton
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    icon={<Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                >
                    {t('groupes.creer', 'Nouveau groupe')}
                </ElisaButton>
            </div>

            {/* Liste des groupes */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-dominant-600)]" />
                </div>
            ) : !groupes?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-[var(--icon-xl)] w-[var(--icon-xl)] text-[var(--color-text-tertiary)] mb-[var(--space-md)]" />
                    <p className="text-[var(--text-base)] text-[var(--color-text-secondary)]">
                        {t('groupes.vide', 'Aucun groupe configuré')}
                    </p>
                    <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] mt-[var(--space-xs)]">
                        {t('groupes.videDescription', 'Créez votre premier groupe pour commencer')}
                    </p>
                </div>
            ) : (
                <div className="grid gap-[var(--gap-md)]">
                    {groupes.map((groupe) => (
                        <GroupeCard
                            key={groupe.id}
                            groupe={groupe}
                            onSelect={() => setSelectedGroupe(groupe)}
                            onConfigure={() => {
                                setSelectedGroupe(groupe);
                                setShowConfigModal(true);
                            }}
                            onDelete={() => deleteMutation.mutate(groupe.id)}
                        />
                    ))}
                </div>
            )}

            {/* Modal création */}
            <CreateGroupeModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={(data) => createMutation.mutate(data)}
            />

            {/* Modal configuration */}
            {selectedGroupe && (
                <ConfigureGroupeModal
                    open={showConfigModal}
                    onClose={() => setShowConfigModal(false)}
                    groupe={selectedGroupe}
                />
            )}
        </div>
    );
}

// ─── Carte Groupe ────────────────────────────────────────────────

function GroupeCard({
    groupe,
    onSelect,
    onConfigure,
    onDelete,
}: {
    groupe: GroupeEtablissement;
    onSelect: () => void;
    onConfigure: () => void;
    onDelete: () => void;
}) {
    const { t } = useTranslation('admin');
    const nbMembres = groupe.etablissements?.length ?? 0;

    return (
        <div
            className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--padding-card)] hover:border-[var(--color-dominant-400)] transition-colors cursor-pointer"
            onClick={onSelect}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-[var(--gap-md)]">
                    <div className="rounded-[var(--radius-md)] bg-[var(--color-dominant-100)] p-[var(--space-sm)]">
                        <Building2 className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-dominant-700)]" />
                    </div>
                    <div>
                        <h3 className="text-[var(--text-lg)] font-semibold">{groupe.nom}</h3>
                        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                            {groupe.code} • {nbMembres} {t('groupes.membres', 'membres')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-[var(--gap-xs)]">
                    <ElisaButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onConfigure();
                        }}
                        icon={<Settings className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    />
                    <ElisaButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        icon={<Trash2 className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-danger-600)]" />}
                    />
                    <ChevronRight className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-tertiary)]" />
                </div>
            </div>
            {groupe.description && (
                <p className="mt-[var(--space-sm)] text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                    {groupe.description}
                </p>
            )}
        </div>
    );
}

// ─── Modal Création ──────────────────────────────────────────────

function CreateGroupeModal({
    open,
    onClose,
    onSubmit,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { nom: string; description?: string; code: string }) => void;
}) {
    const { t } = useTranslation('admin');
    const [nom, setNom] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!nom || !code) return;
        onSubmit({ nom, code, description: description || undefined });
        setNom('');
        setCode('');
        setDescription('');
        onClose();
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onClose}
            title={t('groupes.modalCreate.titre', 'Nouveau groupe')}
            size="md"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onClose}>
                        {t('common:boutons.annuler', 'Annuler')}
                    </ElisaButton>
                    <ElisaButton variant="primary" onClick={handleSubmit}>
                        {t('common:boutons.creer', 'Créer')}
                    </ElisaButton>
                </>
            }
        >
            <div className="flex flex-col gap-[var(--gap-md)]">
                <div>
                    <label className="block text-[var(--text-sm)] font-medium mb-[var(--space-xs)]">
                        {t('groupes.nom', 'Nom du groupe')} *
                    </label>
                    <input
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]"
                        placeholder="Ex: Groupe Scolaire Nord"
                    />
                </div>
                <div>
                    <label className="block text-[var(--text-sm)] font-medium mb-[var(--space-xs)]">
                        {t('groupes.code', 'Code unique')} *
                    </label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]"
                        placeholder="Ex: GSN001"
                    />
                </div>
                <div>
                    <label className="block text-[var(--text-sm)] font-medium mb-[var(--space-xs)]">
                        {t('groupes.descriptionLabel', 'Description')}
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]"
                        rows={3}
                        placeholder={t('groupes.descriptionPlaceholder', 'Description optionnelle...')}
                    />
                </div>
            </div>
        </CustomModal>
    );
}

// ─── Modal Configuration ─────────────────────────────────────────

function ConfigureGroupeModal({
    open,
    onClose,
    groupe,
}: {
    open: boolean;
    onClose: () => void;
    groupe: GroupeEtablissement;
}) {
    const { t } = useTranslation('admin');
    const [activeTab, setActiveTab] = useState<'membres' | 'modules' | 'remises' | 'abonnement'>('membres');

    const tabs = [
        { id: 'membres' as const, label: t('groupes.tabs.membres', 'Membres'), icon: Building2 },
        { id: 'modules' as const, label: t('groupes.tabs.modules', 'Modules'), icon: Package },
        { id: 'remises' as const, label: t('groupes.tabs.remises', 'Remises'), icon: Layers },
        { id: 'abonnement' as const, label: t('groupes.tabs.abonnement', 'Abonnement'), icon: CreditCard },
    ];

    return (
        <CustomModal
            open={open}
            onOpenChange={onClose}
            title={`${groupe.nom} — ${t('groupes.configuration', 'Configuration')}`}
            size="3xl"
        >
            <div className="flex flex-col gap-[var(--gap-md)]">
                {/* Tabs */}
                <div className="flex gap-[var(--gap-xs)] border-b border-[var(--color-bordure)] pb-[var(--space-xs)]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-[var(--gap-xs)] px-[var(--space-md)] py-[var(--space-sm)] rounded-t-[var(--radius-md)] transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)] font-medium'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                            }`}
                        >
                            <tab.icon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="min-h-[300px]">
                    {activeTab === 'membres' && <MembresTab groupe={groupe} />}
                    {activeTab === 'modules' && <ModulesTab groupe={groupe} />}
                    {activeTab === 'remises' && <RemisesTab groupe={groupe} />}
                    {activeTab === 'abonnement' && <AbonnementTab groupe={groupe} />}
                </div>
            </div>
        </CustomModal>
    );
}

// ─── Tab Membres ─────────────────────────────────────────────────

function MembresTab({ groupe }: { groupe: GroupeEtablissement }) {
    const { t } = useTranslation('admin');
    const [newEtabId, setNewEtabId] = useState('');
    const addMembre = useAddMembre(t);
    const removeMembre = useRemoveMembre(t);

    // Charger les établissements disponibles (avec labels lisibles)
    const { data: tousEtablissements = [] } = useQuery({
        queryKey: ['groupes-saas-etablissements'],
        queryFn: async () => {
            const res = await apiClient.get<any[]>('/api/platform/facturation/etablissements');
            return (res.data ?? []).map((e: any) => ({
                id: e.id,
                nom: e.nom || e.nomCommercial || 'Établissement',
                ville: e.ville || '',
            }));
        },
        staleTime: 60 * 1000,
    });

    // Filtrer les établissements déjà membres du groupe
    const membresIds = new Set(groupe.etablissements?.map(l => l.etablissementId) ?? []);
    const etablissementsDisponibles = tousEtablissements.filter((e: { id: string }) => !membresIds.has(e.id));

    const handleAdd = () => {
        if (!newEtabId) return;
        addMembre.mutate({ groupeId: groupe.id, etablissementId: newEtabId });
        setNewEtabId('');
    };

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            <div className="flex gap-[var(--gap-sm)]">
                <select
                    value={newEtabId}
                    onChange={(e) => setNewEtabId(e.target.value)}
                    className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)] text-sm text-[var(--color-texte)] bg-[var(--color-surface)]"
                >
                    <option value="">{t('groupes.selectionnerEtab', 'Sélectionner un établissement...')}</option>
                    {etablissementsDisponibles.map((e: { id: string; nom: string; ville: string }) => (
                        <option key={e.id} value={e.id}>
                            {e.nom}{e.ville ? ` (${e.ville})` : ''}
                        </option>
                    ))}
                </select>
                <ElisaButton variant="primary" size="sm" onClick={handleAdd} disabled={!newEtabId} icon={<Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}>
                    {t('groupes.ajouter', 'Ajouter')}
                </ElisaButton>
            </div>
            <div className="flex flex-col gap-[var(--space-xs)]">
                {groupe.etablissements?.map((lien) => (
                    <div
                        key={lien.id}
                        className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]"
                    >
                        <span className="text-[var(--text-sm)]">
                            {lien.etablissement?.nom ?? lien.etablissementId}
                        </span>
                        <ElisaButton
                            variant="ghost"
                            size="xs"
                            onClick={() => removeMembre.mutate({ groupeId: groupe.id, etablissementId: lien.etablissementId })}
                            icon={<X className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        />
                    </div>
                ))}
                {!groupe.etablissements?.length && (
                    <p className="text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)] py-[var(--space-lg)]">
                        {t('groupes.aucunMembre', 'Aucun membre dans ce groupe')}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Tab Modules ─────────────────────────────────────────────────

function ModulesTab({ groupe }: { groupe: GroupeEtablissement }) {
    const { t } = useTranslation('admin');
    const qc = useQueryClient();

    const { data: modules, isLoading } = useQuery({
        queryKey: ['groupes-modules', groupe.id],
        queryFn: async () => {
            const res = await apiClient.get<any[]>(`/api/platform/facturation/groupes/${groupe.id}/modules`);
            return res.data ?? [];
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ moduleId, actif }: { moduleId: string; actif: boolean }) =>
            apiClient.put(`/api/platform/facturation/groupes/${groupe.id}/modules/${moduleId}`, { actif }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['groupes-modules', groupe.id] });
        },
    });

    if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-dominant-600)]" /></div>;

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            {!modules?.length ? (
                <p className="text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)] py-[var(--space-lg)]">
                    {t('groupes.modulesComing', 'Aucun module configuré pour ce groupe')}
                </p>
            ) : (
                <div className="flex flex-col gap-[var(--space-xs)]">
                    {modules.map((mod: any) => (
                        <div key={mod.id || mod.moduleId} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]">
                            <div>
                                <span className="text-[var(--text-sm)] font-medium">{mod.module?.nom ?? mod.moduleId}</span>
                                {mod.module?.categorie && (
                                    <span className="ml-2 text-xs text-[var(--color-text-tertiary)]">({mod.module.categorie})</span>
                                )}
                            </div>
                            <button
                                onClick={() => toggleMutation.mutate({ moduleId: mod.moduleId || mod.id, actif: !mod.actif })}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${mod.actif ? 'bg-[var(--color-dominant-600)]' : 'bg-[var(--color-surface-hover)]'}`}
                            >
                                <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${mod.actif ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Tab Promotions (v4 — nouveau système promotions) ─────────────────────

function RemisesTab({ groupe }: { groupe: GroupeEtablissement }) {
    const { t } = useTranslation('admin');
    const { data: promotions, isLoading } = useQuery({
        queryKey: ['groupes-promotions', groupe.id],
        queryFn: async () => {
            const res = await apiClient.get<any>(`/api/platform/facturation/promotions?scope=PLAN&actif=true`);
            return res.data?.data ?? res.data ?? [];
        },
    });

    if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-dominant-600)]" /></div>;

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            {!promotions?.length ? (
                <p className="text-center text-[var(--text-sm)] text-[var(--color-text-tertiary)] py-[var(--space-lg)]">
                    {t('groupes.aucunePromotion', 'Aucune promotion configurée pour ce groupe')}
                </p>
            ) : (
                <div className="border rounded-[var(--radius-lg)] overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--color-surface-hover)]">
                            <tr>
                                <th className="text-left p-[var(--space-sm)] font-medium">{t('groupes.promotions.code', 'Code')}</th>
                                <th className="text-left p-[var(--space-sm)] font-medium">{t('groupes.promotions.nom', 'Nom')}</th>
                                <th className="text-right p-[var(--space-sm)] font-medium">{t('groupes.promotions.valeur', 'Valeur')}</th>
                                <th className="text-left p-[var(--space-sm)] font-medium">{t('groupes.promotions.type', 'Type')}</th>
                                <th className="text-left p-[var(--space-sm)] font-medium">{t('groupes.promotions.scope', 'Scope')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-bordure)]">
                            {promotions.map((p: any) => (
                                <tr key={p.id}>
                                    <td className="p-[var(--space-sm)] font-mono text-xs">{p.code}</td>
                                    <td className="p-[var(--space-sm)]">{p.nom}</td>
                                    <td className="p-[var(--space-sm)] text-right font-mono">
                                        {p.typePromotion === 'POURCENTAGE' ? `${p.valeur}%` : `${Number(p.valeur).toLocaleString('fr-FR')} XAF`}
                                    </td>
                                    <td className="p-[var(--space-sm)]">
                                        <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]">
                                            {p.typePromotion === 'POURCENTAGE' ? 'Pourcentage' :
                                             p.typePromotion === 'GRATUITE' ? 'Gratuité' : 'Montant fixe'}
                                        </span>
                                    </td>
                                    <td className="p-[var(--space-sm)]">
                                        <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
                                            {p.scope === 'PLAN' ? 'Plan' :
                                             p.scope === 'PACK' ? 'Pack' :
                                             p.scope === 'MODULE' ? 'Module' : 'Bundle'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── Tab Abonnement ──────────────────────────────────────────────

function AbonnementTab({ groupe }: { groupe: GroupeEtablissement }) {
    const { t } = useTranslation('admin');
    const { data: abonnement, isLoading } = useQuery({
        queryKey: ['groupes-abonnement', groupe.id],
        queryFn: async () => {
            const res = await apiClient.get<any>(`/api/platform/facturation/groupes/${groupe.id}/abonnement`);
            return res.data;
        },
    });

    if (isLoading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-dominant-600)]" /></div>;

    if (!abonnement) {
        return (
            <div className="flex flex-col items-center justify-center py-[var(--space-xl)] text-center">
                <CreditCard className="h-[var(--icon-xl)] w-[var(--icon-xl)] text-[var(--color-text-tertiary)] mb-[var(--space-md)]" />
                <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                    {t('groupes.abonnementComing', 'Aucun abonnement configuré pour ce groupe')}
                </p>
            </div>
        );
    }

    const statutColor = abonnement.statut === 'ACTIF' ? 'text-[var(--color-success-700)] bg-[var(--color-success-100)]'
        : abonnement.statut === 'SUSPENDU' ? 'text-[var(--color-warning-700)] bg-[var(--color-warning-100)]'
        : 'text-[var(--color-text-muted)] bg-[var(--color-surface-hover)]';

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            <div className="grid grid-cols-2 gap-[var(--gap-md)]">
                <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] p-[var(--space-md)]">
                    <span className="text-xs text-[var(--color-text-tertiary)]">{t('groupes.abonnement.statut', 'Statut')}</span>
                    <div className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${statutColor}`}>
                        {abonnement.statut}
                    </div>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] p-[var(--space-md)]">
                    <span className="text-xs text-[var(--color-text-tertiary)]">{t('groupes.abonnement.modeFacturation', 'Mode facturation')}</span>
                    <div className="text-sm font-medium mt-1">{abonnement.modeFacturation ?? '—'}</div>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] p-[var(--space-md)]">
                    <span className="text-xs text-[var(--color-text-tertiary)]">{t('groupes.abonnement.repartition', 'Répartition')}</span>
                    <div className="text-sm font-medium mt-1">{abonnement.repartitionFacturation ?? '—'}</div>
                </div>
                <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] p-[var(--space-md)]">
                    <span className="text-xs text-[var(--color-text-tertiary)]">{t('groupes.abonnement.tarifDegressif', 'Tarif dégressif')}</span>
                    <div className="text-sm font-medium mt-1">{abonnement.tarifDegressif ? `${abonnement.tarifDegressif}%` : '—'}</div>
                </div>
            </div>
        </div>
    );
}
