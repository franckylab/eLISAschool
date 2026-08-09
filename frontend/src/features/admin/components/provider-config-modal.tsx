/**
 * ==================================
 * eLISAschool - Provider Config Modal
 * ==================================
 * 
 * Configuration des providers de paiement par établissement.
 * Liste des 7 providers avec statut, modal de configuration credentials.
 * 
 * Phase P2.3 — Refonte SaaS v4
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CustomModal } from '@/components/modals/CustomModal';
import {
    CreditCard,
    Smartphone,
    CheckCircle2,
    XCircle,
    Settings,
    Loader2,
    AlertCircle,
    Shield,
    Wifi,
    WifiOff,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface ProviderInfo {
    name: string;
    displayName: string;
    channels: string[];
    icon: typeof CreditCard;
}

interface ProviderConfigData {
    providerName: string;
    channel: string;
    credentials: Record<string, string>;
    sandbox: boolean;
    actif: boolean;
    webhookSecret?: string;
}

interface ProviderCfg {
    providerName: string;
    actif?: boolean;
}

interface ProviderConfigModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    etablissementId: string;
}

// =============================================
// Constants
// =============================================

const PROVIDERS: ProviderInfo[] = [
    { name: 'mtn-momo', displayName: 'MTN Mobile Money', channels: ['mobile_money'], icon: Smartphone },
    { name: 'orange-money', displayName: 'Orange Money', channels: ['mobile_money'], icon: Smartphone },
    { name: 'wave', displayName: 'Wave', channels: ['mobile_money'], icon: Smartphone },
    { name: 'paystack', displayName: 'Paystack', channels: ['mobile_money', 'card', 'bank_transfer'], icon: CreditCard },
    { name: 'flutterwave', displayName: 'Flutterwave', channels: ['mobile_money', 'card', 'bank_transfer'], icon: CreditCard },
    { name: 'stripe', displayName: 'Stripe', channels: ['card'], icon: CreditCard },
    { name: 'manuel', displayName: 'manual', channels: ['mobile_money', 'card'], icon: CreditCard },
];

function getChannelLabels(t: TFunction): Record<string, string> {
    return {
        mobile_money: 'Mobile Money',
        card: t('providerConfig.carteBancaire', { defaultValue: 'Carte bancaire' }),
        bank_transfer: t('providerConfig.virement', { defaultValue: 'Virement' }),
    };
}

const CREDENTIAL_FIELDS: Record<string, { key: string; label: string; masked: boolean }[]> = {
    'mtn-momo': [
        { key: 'apiUser', label: 'API User ID', masked: false },
        { key: 'apiKey', label: 'API Key', masked: true },
        { key: 'subscriptionKey', label: 'Subscription Key', masked: true },
    ],
    'orange-money': [
        { key: 'clientId', label: 'Client ID', masked: false },
        { key: 'clientSecret', label: 'Client Secret', masked: true },
    ],
    'wave': [
        { key: 'apiKey', label: 'API Key', masked: true },
        { key: 'merchantId', label: 'Merchant ID', masked: false },
    ],
    'paystack': [
        { key: 'secretKey', label: 'Secret Key', masked: true },
        { key: 'publicKey', label: 'Public Key', masked: false },
    ],
    'flutterwave': [
        { key: 'secretKey', label: 'Secret Key', masked: true },
        { key: 'publicKey', label: 'Public Key', masked: false },
        { key: 'encryptionKey', label: 'Encryption Key', masked: true },
    ],
    'stripe': [
        { key: 'secretKey', label: 'Secret Key', masked: true },
        { key: 'publicKey', label: 'Publishable Key', masked: false },
        { key: 'webhookSecret', label: 'Webhook Secret', masked: true },
    ],
    'manuel': [
        { key: 'instructions', label: 'Instructions de paiement', masked: false },
    ],
};

// =============================================
// Component
// =============================================

export function ProviderConfigModal({ open, onOpenChange, etablissementId }: ProviderConfigModalProps) {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(null);
    const [credentials, setCredentials] = useState<Record<string, string>>({});
    const [channel, setChannel] = useState('mobile_money');
    const [sandbox, setSandbox] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const CHANNEL_LABELS = getChannelLabels(t);

    // Fetch configured providers
    const { data: configuredProviders } = useQuery<ProviderCfg[] | undefined>({
        queryKey: ['provider-configs', etablissementId],
        queryFn: async () => {
            const res = await apiClient.get<ProviderCfg[]>('/api/paiement/providers/configures');
            return res.data;
        },
        enabled: !!etablissementId,
    });

    const configurerMutation = useMutation({
        mutationFn: async (data: ProviderConfigData) => {
            return apiClient.post('/api/paiement/providers/configurer', {
                ...data,
                etablissementId,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-configs'] });
            setSelectedProvider(null);
            setCredentials({});
            setError(null);
        },
        onError: (err: any) => setError(err?.response?.data?.message || t('providerConfig.erreurConfiguration', { defaultValue: 'Erreur de configuration' })),
    });

    const isConfigured = useCallback((providerName: string) => {
        return configuredProviders?.some((c) => c.providerName === providerName) || false;
    }, [configuredProviders]);

    const handleSelectProvider = (provider: ProviderInfo) => {
        setSelectedProvider(provider);
        setChannel(provider.channels[0] || 'mobile_money');
        setCredentials({});
        setError(null);
    };

    const handleSave = () => {
        if (!selectedProvider) return;
        configurerMutation.mutate({
            providerName: selectedProvider.name,
            channel,
            credentials,
            sandbox,
            actif: true,
        });
    };

    const handleClose = () => {
        setSelectedProvider(null);
        setCredentials({});
        setError(null);
        onOpenChange(false);
    };

    return (
        <>
            <CustomModal
                open={open && !selectedProvider}
                onOpenChange={handleClose}
                title={t('provider.titreModal')}
                description={t('provider.sousTitreModal')}
                size="xl"
            >
                <div className="space-y-3">
                    {PROVIDERS.map(provider => {
                        const Icon = provider.icon;
                        const configured = isConfigured(provider.name);

                        return (
                            <div
                                key={provider.name}
                                className="flex items-center justify-between p-4 border rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${configured ? 'bg-[var(--color-success-100)] text-[var(--color-success-600)]' : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{provider.displayName === 'manual' ? t('providerConfig.paiementManuel', { defaultValue: 'Paiement Manuel' }) : provider.displayName}</div>
                                        <div className="text-xs text-[var(--color-texte-muted)]">
                                            {provider.channels.map(c => CHANNEL_LABELS[c]).join(', ')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {configured ? (
                                        <span className="flex items-center gap-1 text-[var(--color-success-700)] bg-[var(--color-success-100)] px-2 py-1 rounded-full" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>
                                            <CheckCircle2 className="w-3 h-3" />
                                            {t('provider.configure')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[var(--color-text-secondary)] bg-[var(--color-surface-hover)] px-2 py-1 rounded-full" style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.3vw, 0.75rem)' }}>
                                            <XCircle className="w-3 h-3" />
                                            {t('provider.nonConfigure')}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleSelectProvider(provider)}
                                        className="p-1.5 text-[var(--color-texte-muted)] hover:text-[var(--color-dominant-600)] hover:bg-[color-mix(in_srgb,var(--color-dominant-600)_10%,transparent)] rounded-lg transition-colors"
                                        title={t('provider.configurer')}
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CustomModal>

            {/* Configuration sub-modal */}
            <CustomModal
                open={!!selectedProvider}
                onOpenChange={() => setSelectedProvider(null)}
                title={t('provider.modal.titre', { name: selectedProvider?.displayName || '' })}
                description={t('provider.modal.description')}
                size="lg"
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => setSelectedProvider(null)}
                            className="px-4 py-2 text-sm text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]"
                        >
                            {t('common:annuler', { defaultValue: 'Annuler' })}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={configurerMutation.isPending}
                            className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
                                                        style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff' }}
                        >
                            {configurerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {t('provider.modal.enregistrer')}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-[var(--color-danger-50)] text-[var(--color-danger-700)] rounded-[var(--radius-lg)]" style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Channel selection */}
                    {selectedProvider && selectedProvider.channels.length > 1 && (
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('provider.modal.canal')}</label>
                            <select
                                value={channel}
                                onChange={(e) => setChannel(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                            >
                                {selectedProvider.channels.map(c => (
                                    <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Sandbox toggle */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                            {sandbox ? <Wifi className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-warning-500)]" /> : <WifiOff className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-success-500)]" />}
                            <div>
                                <div className="text-sm font-medium">{t('provider.modal.mode', { mode: sandbox ? 'Sandbox' : 'Production' })}</div>
                                <div className="text-xs text-[var(--color-texte-muted)]">
                                    {sandbox ? t('provider.modal.sandbox') : t('provider.modal.production')}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSandbox(!sandbox)}
                            className={`w-10 h-6 rounded-full relative transition-colors ${sandbox ? 'bg-[var(--color-warning-500)]' : 'bg-[var(--color-success-500)]'}`}
                        >
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${sandbox ? 'translate-x-0.5' : 'translate-x-4.5'}`} />
                        </button>
                    </div>

                    {/* Credentials */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Shield className="w-4 h-4 text-[var(--color-texte-muted)]" />
                            {t('provider.modal.credentials')}
                        </div>
                        {selectedProvider && CREDENTIAL_FIELDS[selectedProvider.name]?.map(field => (
                            <div key={field.key}>
                                <label className="block text-xs text-[var(--color-texte-muted)] mb-1">{field.label}</label>
                                <input
                                    type={field.masked ? 'password' : 'text'}
                                    value={credentials[field.key] || ''}
                                    onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)] font-mono"
                                    placeholder={t('provider.modal.placeholder', { field: field.label.toLowerCase() })}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </CustomModal>
        </>
    );
}

export default ProviderConfigModal;
