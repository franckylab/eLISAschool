/**
 * ==================================
 * eLISAschool - Configuration Notifications
 * ==================================
 * 
 * Configuration des providers de notifications par établissement.
 * Test d'envoi, historique, gestion templates.
 * 
 * Phase 8.4 — Refonte SaaS
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
    Bell,
    Mail,
    MessageSquare,
    Smartphone,
    Send,
    CheckCircle2,
    XCircle,
    Loader2,
    Settings,
    Plus,
    TestTube,
} from 'lucide-react';

// =============================================
// TYPES
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
    nom: string;
    sujet: string;
    canal: string;
    actif: boolean;
}

// =============================================
// PAGE
// =============================================

function NotificationsConfigPage() {
    const [activeTab, setActiveTab] = useState<'providers' | 'templates' | 'history'>('providers');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Charger les providers configurés
    const { data: providers, isLoading: loadingProviders } = useQuery({
        queryKey: ['notification-providers'],
        queryFn: async () => {
            const res = await apiClient.get<ProviderConfig[]>('/api/notifications/providers');
            return res.data ?? [];
        },
    });

    // Charger les templates
    const { data: templates, isLoading: loadingTemplates } = useQuery({
        queryKey: ['notification-templates'],
        queryFn: async () => {
            const res = await apiClient.get<Template[]>('/api/notifications/templates');
            return res.data ?? [];
        },
    });

    // Test d'envoi
    const testMutation = useMutation({
        mutationFn: async ({ type, destination }: { type: string; destination: string }) => {
            const res = await apiClient.post('/api/notifications/test', { type, destination });
            return res.data as { success: boolean; message: string };
        },
        onSuccess: (data) => {
            setTestResult(data);
            setTimeout(() => setTestResult(null), 5000);
        },
    });

    const canalIcon = (type: string) => {
        switch (type) {
            case 'EMAIL': return <Mail className="h-5 w-5" />;
            case 'SMS': return <MessageSquare className="h-5 w-5" />;
            case 'PUSH': return <Smartphone className="h-5 w-5" />;
            default: return <Bell className="h-5 w-5" />;
        }
    };

    const canalLabel = (type: string) => {
        switch (type) {
            case 'EMAIL': return 'Email';
            case 'SMS': return 'SMS';
            case 'PUSH': return 'Push';
            case 'IN_APP': return 'In-app';
            default: return type;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-sm text-muted-foreground">
                            Configuration des canaux de notification
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b">
                {(['providers', 'templates', 'history'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab === 'providers' ? 'Providers' : tab === 'templates' ? 'Templates' : 'Historique'}
                    </button>
                ))}
            </div>

            {/* Test result banner */}
            {testResult && (
                <div className={`flex items-center gap-2 rounded-lg border p-3 ${
                    testResult.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                    {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span className="text-sm">{testResult.message}</span>
                </div>
            )}

            {/* Providers Tab */}
            {activeTab === 'providers' && (
                <div className="space-y-4">
                    {loadingProviders ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {providers?.map((provider) => (
                                <div key={provider.id} className="rounded-xl border bg-card p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {canalIcon(provider.type)}
                                            <div>
                                                <h3 className="font-semibold">{canalLabel(provider.type)}</h3>
                                                <p className="text-xs text-muted-foreground">{provider.service}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            provider.actif && provider.configure
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {provider.actif && provider.configure ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-md border hover:bg-muted transition-colors">
                                            <Settings className="h-3 w-3" />
                                            Configurer
                                        </button>
                                        <button
                                            onClick={() => testMutation.mutate({
                                                type: provider.type,
                                                destination: 'test@example.com',
                                            })}
                                            disabled={testMutation.isPending}
                                            className="flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                        >
                                            {testMutation.isPending ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <TestTube className="h-3 w-3" />
                                            )}
                                            Test
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus className="h-4 w-4" />
                            Nouveau template
                        </button>
                    </div>

                    {loadingTemplates ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-xl border divide-y">
                            {templates?.map((template) => (
                                <div key={template.id} className="flex items-center justify-between p-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{template.nom}</span>
                                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                {canalLabel(template.canal)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-0.5">{template.sujet}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            template.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {template.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                    <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>L'historique des notifications envoyées sera affiché ici.</p>
                    <p className="text-xs mt-1">Intégration avec le système d'audit en cours.</p>
                </div>
            )}
        </div>
    );
}

export const Route = createFileRoute('/_auth/notifications-config')({
    component: NotificationsConfigPage,
});
