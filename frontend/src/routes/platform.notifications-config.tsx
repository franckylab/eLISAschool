/**
 * ==================================
 * eLISAschool - Platform Notifications Config
 * ==================================
 * 
 * Configuration globale des notifications plateforme.
 * Gestion des templates, providers, et tests d'envoi.
 * 
 * Phase P4.3 — Refonte SaaS v4
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
    Bell,
    Mail,
    MessageSquare,
    Smartphone,
    Monitor,
    Send,
    CheckCircle2,
    XCircle,
    Loader2,
    Settings,
    TestTube,
    FileText,
    AlertCircle,
} from 'lucide-react';

// =============================================
// Types
// =============================================

interface ProviderConfig {
    id: string;
    type: string;
    service: string;
    actif: boolean;
    configure: boolean;
}

interface Template {
    id: string;
    type: string;
    sujet: string;
    channel: string;
    actif: boolean;
    contenu?: string;
}

type TabKey = 'providers' | 'templates' | 'test';

// =============================================
// Constants
// =============================================

const CANAL_ICONS: Record<string, typeof Bell> = {
    EMAIL: Mail,
    SMS: MessageSquare,
    PUSH: Smartphone,
    IN_APP: Monitor,
};

const CANAL_LABELS: Record<string, string> = {
    EMAIL: 'Email',
    SMS: 'SMS',
    PUSH: 'Push',
    IN_APP: 'In-App',
};

// =============================================
// Page
// =============================================

function PlatformNotificationsConfigPage() {
    const { t } = useTranslation('admin');
    const [activeTab, setActiveTab] = useState<TabKey>('providers');
    const [testCanal, setTestCanal] = useState('EMAIL');
    const [testDestinataire, setTestDestinataire] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Fetch providers
    const { data: providers, isLoading: loadingProviders } = useQuery<ProviderConfig[]>({
        queryKey: ['platform-notification-providers'],
        queryFn: async () => {
            const res = await apiClient.get<ProviderConfig[]>('/api/notifications/providers');
            return res.data ?? [];
        },
    });

    // Fetch templates
    const { data: templates, isLoading: loadingTemplates } = useQuery<Template[]>({
        queryKey: ['platform-notification-templates'],
        queryFn: async () => {
            const res = await apiClient.get<Template[]>('/api/notifications/templates');
            return res.data ?? [];
        },
    });

    // Test notification mutation
    const testMutation = useMutation({
        mutationFn: async () => {
            return apiClient.post('/api/notifications/test', {
                canal: testCanal,
                destinataire: testDestinataire,
                message: testMessage,
            });
        },
        onSuccess: () => {
            setTestResult({ success: true, message: t('notifications.test.succes') });
        },
        onError: (err: any) => {
            setTestResult({ success: false, message: err?.response?.data?.message || t('notifications.test.echec') });
        },
    });

    const tabs: { key: TabKey; label: string; icon: typeof Bell }[] = [
        { key: 'providers', label: t('notifications.onglets.providers'), icon: Settings },
        { key: 'templates', label: t('notifications.onglets.templates'), icon: FileText },
        { key: 'test', label: t('notifications.onglets.test'), icon: TestTube },
    ];

    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div>
                <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>{t('notifications.titre')}</h1>
                <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>{t('notifications.sousTitre')}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-[var(--gap-xs)] border-b border-[var(--color-bordure)]">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className="flex items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-sm)] border-b-2 transition-colors"
                            style={{
                                borderColor: isActive ? 'var(--color-dominant-600)' : 'transparent',
                                color: isActive ? 'var(--color-dominant-600)' : 'var(--color-texte-muted)',
                                fontWeight: isActive ? 500 : undefined,
                                fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)',
                            }}
                        >
                            <Icon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Providers Tab */}
            {activeTab === 'providers' && (
                <div className="space-y-[var(--space-md)]">
                    {loadingProviders ? (
                        <div className="animate-pulse space-y-[var(--space-sm)]">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 border border-[var(--color-bordure)] rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-hover) 50%, transparent)' }} />)}
                        </div>
                    ) : (
                        <div className="space-y-[var(--space-sm)]">
                            {providers?.map(provider => {
                                const Icon = CANAL_ICONS[provider.type] || Bell;
                                return (
                                    <div key={provider.id} className="flex items-center justify-between p-[var(--space-md)] border border-[var(--color-bordure)] rounded-lg bg-[var(--color-surface)]">
                                        <div className="flex items-center gap-[var(--gap-sm)]">
                                            <div className={`p-[var(--space-sm)] rounded-lg ${provider.actif ? 'bg-[var(--color-success-100)] text-[var(--color-success-600)]' : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]'}`}>
                                                <Icon className="h-[var(--icon-md)] w-[var(--icon-md)]" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-[var(--color-texte)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>{provider.service}</div>
                                                <div className="text-xs text-[var(--color-texte-muted)]">{CANAL_LABELS[provider.type] || provider.type}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-[var(--gap-sm)]">
                                            {provider.actif ? (
                                                <span className="flex items-center gap-[var(--gap-xs)] text-xs text-[var(--color-success-700)] bg-[var(--color-success-100)] px-2 py-0.5 rounded-full">
                                                    <CheckCircle2 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" /> {t('notifications.providers.actif')}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-[var(--gap-xs)] text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded-full">
                                                    <XCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)]" /> {t('notifications.providers.inactif')}
                                                </span>
                                            )}
                                            {provider.configure ? (
                                                <span className="text-xs text-[var(--color-info-600)] bg-[var(--color-info-100)] px-2 py-0.5 rounded-full">{t('notifications.providers.configure')}</span>
                                            ) : (
                                                <span className="text-xs text-[var(--color-warning-600)] bg-[var(--color-warning-100)] px-2 py-0.5 rounded-full">{t('notifications.providers.nonConfigure')}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {(!providers || providers.length === 0) && (
                                <div className="text-center py-8 text-[var(--color-texte-muted)] border border-dashed border-[var(--color-bordure)] rounded-lg" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                                    {t('notifications.providers.aucun')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="space-y-[var(--space-md)]">
                    {loadingTemplates ? (
                        <div className="animate-pulse space-y-[var(--space-sm)]">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 border border-[var(--color-bordure)] rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-hover) 50%, transparent)' }} />)}
                        </div>
                    ) : (
                        <div className="space-y-[var(--space-sm)]">
                            {templates?.map(template => {
                                const Icon = CANAL_ICONS[template.channel?.toUpperCase()] || Bell;
                                return (
                                    <div key={template.id} className="flex items-center justify-between p-[var(--space-md)] border border-[var(--color-bordure)] rounded-lg bg-[var(--color-surface)]">
                                        <div className="flex items-center gap-[var(--gap-sm)]">
                                            <Icon className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-texte-muted)]" />
                                            <div>
                                                <div className="font-medium text-[var(--color-texte)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>{template.type}</div>
                                                <div className="text-xs text-[var(--color-texte-muted)]">{template.sujet || t('notifications.templates.pasSujet')}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-[var(--gap-sm)]">
                                            <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-secondary-100)] text-[var(--color-texte)]">
                                                {CANAL_LABELS[template.channel?.toUpperCase()] || template.channel}
                                            </span>
                                            {template.actif ? (
                                                <span className="text-xs text-[var(--color-success-700)] bg-[var(--color-success-100)] px-2 py-0.5 rounded-full">{t('notifications.providers.actif')}</span>
                                            ) : (
                                                <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded-full">{t('notifications.providers.inactif')}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {(!templates || templates.length === 0) && (
                                <div className="text-center py-8 text-[var(--color-texte-muted)] border border-dashed border-[var(--color-bordure)] rounded-lg" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                                    {t('notifications.templates.aucun')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Test Tab */}
            {activeTab === 'test' && (
                <div className="space-y-[var(--space-md)] max-w-lg">
                    <div>
                        <label className="block font-medium mb-1" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>{t('notifications.test.canal')}</label>
                        <select
                            value={testCanal}
                            onChange={(e) => setTestCanal(e.target.value)}
                            className="w-full mt-1 px-[var(--space-md)] py-[var(--space-xs)] border border-[var(--color-bordure)] rounded-lg bg-[var(--color-surface)] text-[var(--color-texte)]"
                        >
                            {Object.entries(CANAL_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium mb-1" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>{t('notifications.test.destinataire')}</label>
                        <input
                            type="text"
                            value={testDestinataire}
                            onChange={(e) => setTestDestinataire(e.target.value)}
                            className="w-full mt-1 px-[var(--space-md)] py-[var(--space-xs)] border border-[var(--color-bordure)] rounded-lg bg-[var(--color-surface)] text-[var(--color-texte)]"
                            placeholder={t('notifications.test.placeholder')}
                        />
                    </div>
                    <div>
                        <label className="block font-medium mb-1" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>{t('notifications.test.message')}</label>
                        <textarea
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            className="w-full mt-1 px-[var(--space-md)] py-[var(--space-xs)] border border-[var(--color-bordure)] rounded-lg bg-[var(--color-surface)] text-[var(--color-texte)] resize-none"
                            rows={3}
                        />
                    </div>

                    {testResult && (
                        <div className={`flex items-center gap-[var(--gap-sm)] p-[var(--space-sm)] rounded-lg ${
                            testResult.success ? 'bg-[var(--color-success-50)] text-[var(--color-success-700)]' : 'bg-[var(--color-danger-50)] text-[var(--color-danger-700)]'
                        }`}>
                            {testResult.success ? <CheckCircle2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" /> : <AlertCircle className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            {testResult.message}
                        </div>
                    )}

                    <button
                        onClick={() => {
                            setTestResult(null);
                            testMutation.mutate();
                        }}
                        disabled={testMutation.isPending || !testDestinataire}
                        className="flex items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-sm)] rounded-lg hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff' }}
                    >
                        {testMutation.isPending ? <Loader2 className="h-[var(--icon-sm)] w-[var(--icon-sm)] animate-spin" /> : <Send className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        {t('notifications.test.envoyer')}
                    </button>
                </div>
            )}
        </div>
    );
}

export const Route = createFileRoute('/platform/notifications-config')({
    component: PlatformNotificationsConfigPage,
});

export default PlatformNotificationsConfigPage;
