/**
 * ==================================
 * eLISAschool - Page Providers Paiement
 * ==================================
 * 
 * Gestion des providers de paiement depuis la plateforme.
 * CRUD, test connexion, assignments.
 * 
 * Lot D v7 — Refonte SaaS
 */

import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    CreditCard,
    Plus,
    Trash2,
    TestTube,
    CheckCircle,
    XCircle,
    Wifi,
    WifiOff,
    Shield,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { CustomModal } from '@/components/modals';
import { ElisaButton } from '@/components/ui';

// ─── Types ───────────────────────────────────────────────────────

interface ProviderPaiement {
    id: string;
    nom: string;
    slug: string;
    type: 'mobile_money' | 'card' | 'bank_transfer' | 'mixed';
    icone?: string;
    description?: string;
    canaux: string[];
    credentials: string; // '***CHIFFRÉ***'
    webhookSecret?: string;
    sandbox: boolean;
    actif: boolean;
    metadata?: Record<string, any>;
    creeAt: string;
    majAt: string;
}


// ─── Hook API ────────────────────────────────────────────────────

function useProviders() {
    return useQuery({
        queryKey: ['providers-paiement'],
        queryFn: async () => {
            const res = await apiClient.get<ProviderPaiement[]>('/api/platform/facturation/providers');
            return res.data ?? [];
        },
    });
}

function useCreateProvider(t: TFunction) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiClient.post('/api/platform/facturation/providers', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['providers-paiement'] });
            toast.success(t('providersPage.toast.cree'));
        },
        onError: () => toast.error(t('providersPage.toast.erreurCreation')),
    });
}


function useDeleteProvider(t: TFunction) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/api/platform/facturation/providers/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['providers-paiement'] });
            toast.success(t('providersPage.toast.supprime'));
        },
    });
}

function useTestProvider(t: TFunction) {
    return useMutation({
        mutationFn: (id: string) => apiClient.post(`/api/platform/facturation/providers/${id}/test`),
        onSuccess: (res) => {
            const result = res.data;
            const message = (result && typeof result === 'object' && 'message' in result ? result.message : null) as string | null;
            if (res.success) {
                toast.success(message ?? t('providersPage.toast.connexionOk', 'Connexion OK'));
            } else {
                toast.error(message ?? t('providersPage.toast.echecConnexion', 'Échec de connexion'));
            }
        },
        onError: () => toast.error(t('providersPage.toast.erreurTest')),
    });
}

// ─── Composant principal ─────────────────────────────────────────

export default function ProvidersPaiementPage() {
    const { t } = useTranslation('admin');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<ProviderPaiement | null>(null);

    const { data: providers, isLoading } = useProviders();
    const deleteMutation = useDeleteProvider(t);
    const testMutation = useTestProvider(t);

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[var(--text-xl)] font-bold flex items-center gap-[var(--gap-sm)]">
                        <CreditCard className="h-[var(--icon-lg)] w-[var(--icon-lg)]" />
                        {t('providersPage.titre', 'Providers de paiement')}
                    </h1>
                    <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                        {t('providersPage.description', 'Configurez les providers de paiement et leurs assignments')}
                    </p>
                </div>
                <ElisaButton
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    icon={<Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                >
                    {t('providersPage.creer', 'Nouveau provider')}
                </ElisaButton>
            </div>

            {/* Liste des providers */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-dominant-600)]" />
                </div>
            ) : !providers?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CreditCard className="h-[var(--icon-xl)] w-[var(--icon-xl)] text-[var(--color-text-tertiary)] mb-[var(--space-md)]" />
                    <p className="text-[var(--text-base)] text-[var(--color-text-secondary)]">
                        {t('providersPage.vide', 'Aucun provider configuré')}
                    </p>
                    <p className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] mt-[var(--space-xs)]">
                        {t('providersPage.videDescription', 'Ajoutez votre premier provider de paiement')}
                    </p>
                </div>
            ) : (
                <div className="grid gap-[var(--gap-md)] md:grid-cols-2 lg:grid-cols-3">
                    {providers.map((provider) => (
                        <ProviderCard
                            key={provider.id}
                            provider={provider}
                            onSelect={() => setSelectedProvider(provider)}
                            onTest={() => testMutation.mutate(provider.id)}
                            onDelete={() => deleteMutation.mutate(provider.id)}
                        />
                    ))}
                </div>
            )}

            {/* Modal création */}
            <CreateProviderModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            {/* Modal détail */}
            {selectedProvider && (
                <ProviderDetailModal
                    open={!!selectedProvider}
                    onClose={() => setSelectedProvider(null)}
                    provider={selectedProvider}
                />
            )}
        </div>
    );
}

// ─── Carte Provider ──────────────────────────────────────────────

function ProviderCard({
    provider,
    onSelect,
    onTest,
    onDelete,
}: {
    provider: ProviderPaiement;
    onSelect: () => void;
    onTest: () => void;
    onDelete: () => void;
}) {
    const { t } = useTranslation('admin');

    const typeLabels: Record<string, string> = {
        mobile_money: t('providersPage.types.mobileMoney', 'Mobile Money'),
        card: t('providersPage.types.carte', 'Carte bancaire'),
        bank_transfer: t('providersPage.types.virement', 'Virement'),
        mixed: t('providersPage.types.mixte', 'Mixte'),
    };

    return (
        <div
            className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--padding-card)] hover:border-[var(--color-dominant-400)] transition-colors cursor-pointer"
            onClick={onSelect}
        >
            <div className="flex items-start justify-between mb-[var(--space-sm)]">
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <div className={`rounded-[var(--radius-md)] p-[var(--space-sm)] ${
                        provider.actif
                            ? 'bg-[var(--color-success-100)]'
                            : 'bg-[var(--color-surface-hover)]'
                    }`}>
                        <CreditCard className={`h-[var(--icon-md)] w-[var(--icon-md)] ${
                            provider.actif
                                ? 'text-[var(--color-success-700)]'
                                : 'text-[var(--color-text-tertiary)]'
                        }`} />
                    </div>
                    <div>
                        <h3 className="text-[var(--text-base)] font-semibold">{provider.nom}</h3>
                        <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                            {provider.slug}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-[var(--gap-xs)]">
                    {provider.sandbox ? (
                        <WifiOff className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-warning-600)]" aria-label="Sandbox" />
                    ) : (
                        <Wifi className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-success-600)]" aria-label="Production" />
                    )}
                    {provider.actif ? (
                        <CheckCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-success-600)]" />
                    ) : (
                        <XCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-tertiary)]" />
                    )}
                </div>
            </div>

            <div className="flex items-center gap-[var(--gap-xs)] mb-[var(--space-sm)]">
                <span className="text-[var(--text-xs)] px-[var(--space-xs)] py-[2px] rounded-[var(--radius-sm)] bg-[var(--color-surface-hover)]">
                    {typeLabels[provider.type] || provider.type}
                </span>
            </div>

            {provider.description && (
                <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-[var(--space-sm)] line-clamp-2">
                    {provider.description}
                </p>
            )}

            <div className="flex items-center gap-[var(--gap-xs)]">
                <ElisaButton
                    variant="outline"
                    size="xs"
                    onClick={(e) => {
                        e.stopPropagation();
                        onTest();
                    }}
                    icon={<TestTube className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                >
                    {t('providersPage.tester', 'Tester')}
                </ElisaButton>
                <ElisaButton
                    variant="ghost"
                    size="xs"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    icon={<Trash2 className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-danger-600)]" />}
                />
            </div>
        </div>
    );
}

// ─── Modal Création ──────────────────────────────────────────────

function CreateProviderModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const { t } = useTranslation('admin');
    const createMutation = useCreateProvider(t);

    const [formData, setFormData] = useState({
        nom: '',
        slug: '',
        type: 'mobile_money' as const,
        description: '',
        sandbox: true,
        actif: true,
        credentials: '{}',
    });

    const handleSubmit = () => {
        try {
            const credentials = JSON.parse(formData.credentials);
            createMutation.mutate({
                ...formData,
                credentials,
                canaux: [],
            });
            onClose();
        } catch {
            toast.error(t('providersPage.toast.credentialsInvalides'));
        }
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onClose}
            title={t('providersPage.modalCreate.titre', 'Nouveau provider')}
            size="lg"
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
                <div className="grid grid-cols-2 gap-[var(--gap-md)]">
                    <div>
                        <label className="block text-[var(--text-sm)] font-medium mb-[var(--space-xs)]">
                            {t('providersPage.nom', 'Nom')} *
                        </label>
                        <input
                            type="text"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]"
                            placeholder="Ex: MTN Mobile Money"
                        />
                    </div>
                    <div>
                        <label className="block text-[var(--text-sm)] font-medium mb-[var(--space-xs)]">
                            {t('providersPage.slug', 'Slug')} *
                        </label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                            className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]"
                            placeholder="Ex: mtn_momo"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[var(--text-sm)] font-medium mb-[var(--space-xs)]">
                        {t('providersPage.type', 'Type')} *
                    </label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]"
                    >
                        <option value="mobile_money">{t('providersPage.types.mobileMoney')}</option>
                        <option value="card">{t('providersPage.types.carte')}</option>
                        <option value="bank_transfer">{t('providersPage.types.virement')}</option>
                        <option value="mixed">{t('providersPage.types.mixte')}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[var(--text-sm)] font-medium mb-[var(--space-xs)]">
                        {t('providersPage.description', 'Description')}
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]"
                        rows={2}
                    />
                </div>

                <div>
                    <label className="block text-[var(--text-sm)] font-medium mb-[var(--space-xs)]">
                        <Shield className="inline h-[var(--icon-xs)] w-[var(--icon-xs)] mr-[var(--space-xs)]" />
                        {t('providersPage.credentials', 'Credentials (JSON)')} *
                    </label>
                    <textarea
                        value={formData.credentials}
                        onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)] font-mono text-[var(--text-xs)]"
                        rows={4}
                        placeholder='{"apiKey": "...", "secretKey": "..."}'
                    />
                    <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mt-[var(--space-xs)]">
                        {t('providersPage.credentialsHint', 'Les credentials seront chiffrées AES-256-GCM')}
                    </p>
                </div>

                <div className="flex items-center gap-[var(--gap-lg)]">
                    <label className="flex items-center gap-[var(--gap-xs)]">
                        <input
                            type="checkbox"
                            checked={formData.sandbox}
                            onChange={(e) => setFormData({ ...formData, sandbox: e.target.checked })}
                        />
                        <span className="text-[var(--text-sm)]">{t('providersPage.sandbox', 'Mode Sandbox')}</span>
                    </label>
                    <label className="flex items-center gap-[var(--gap-xs)]">
                        <input
                            type="checkbox"
                            checked={formData.actif}
                            onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                        />
                        <span className="text-[var(--text-sm)]">{t('providersPage.actif', 'Actif')}</span>
                    </label>
                </div>
            </div>
        </CustomModal>
    );
}

// ─── Modal Détail ────────────────────────────────────────────────

function ProviderDetailModal({
    open,
    onClose,
    provider,
}: {
    open: boolean;
    onClose: () => void;
    provider: ProviderPaiement;
}) {
    const { t } = useTranslation('admin');

    return (
        <CustomModal
            open={open}
            onOpenChange={onClose}
            title={provider.nom}
            size="lg"
        >
            <div className="flex flex-col gap-[var(--gap-md)]">
                <div className="grid grid-cols-2 gap-[var(--gap-md)]">
                    <div>
                        <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">Slug</p>
                        <p className="text-[var(--text-sm)] font-mono">{provider.slug}</p>
                    </div>
                    <div>
                        <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{t('providersPage.type', 'Type')}</p>
                        <p className="text-[var(--text-sm)]">{provider.type}</p>
                    </div>
                    <div>
                        <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{t('providersPage.detail.mode', 'Mode')}</p>
                        <p className="text-[var(--text-sm)] flex items-center gap-[var(--gap-xs)]">
                            {provider.sandbox ? (
                                <><WifiOff className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-warning-600)]" /> {t('providersPage.detail.sandbox', 'Sandbox')}</>
                            ) : (
                                <><Wifi className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-success-600)]" /> {t('providersPage.detail.production', 'Production')}</>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">{t('providersPage.detail.statut', 'Statut')}</p>
                        <p className="text-[var(--text-sm)] flex items-center gap-[var(--gap-xs)]">
                            {provider.actif ? (
                                <><CheckCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-success-600)]" /> {t('providersPage.actif', 'Actif')}</>
                            ) : (
                                <><XCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-tertiary)]" /> {t('providersPage.inactif', 'Inactif')}</>
                            )}
                        </p>
                    </div>
                </div>

                {provider.description && (
                    <div>
                        <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mb-[var(--space-xs)]">Description</p>
                        <p className="text-[var(--text-sm)]">{provider.description}</p>
                    </div>
                )}

                <div>
                    <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mb-[var(--space-xs)]">
                        <Shield className="inline h-[var(--icon-xs)] w-[var(--icon-xs)] mr-[var(--space-xs)]" />
                        {t('providersPage.credentials', 'Credentials (JSON)')}
                    </p>
                    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] px-[var(--space-md)] py-[var(--space-sm)]">
                        <p className="text-[var(--text-xs)] font-mono text-[var(--color-text-tertiary)]">
                            {provider.credentials}
                        </p>
                    </div>
                </div>

                <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                    {t('providersPage.detail.creeLe', 'Créé le')} {new Date(provider.creeAt).toLocaleDateString()} • {t('providersPage.detail.modifieLe', 'Modifié le')} {new Date(provider.majAt).toLocaleDateString()}
                </div>
            </div>
        </CustomModal>
    );
}
