/**
 * ==================================
 * eLISAschool - Configuration Page
 * ==================================
 * Configuration établissement, thème, modules
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Settings, Palette, Globe, Blocks, Shield, Bell as BellIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { useThemeStore } from '@/stores/theme.store';
import { COULEURS_DOMINANTES } from '@/lib/theme-utils';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/cn';

type TabId = 'general' | 'theme' | 'langue' | 'modules' | 'securite' | 'notifications';

const TABS: { id: TabId; icon: React.ElementType }[] = [
    { id: 'general', icon: Settings },
    { id: 'theme', icon: Palette },
    { id: 'langue', icon: Globe },
    { id: 'modules', icon: Blocks },
    { id: 'securite', icon: Shield },
    { id: 'notifications', icon: BellIcon },
];

export function ConfigurationPage() {
    const { t } = useTranslation('configuration');
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabId>('general');
    const themeStore = useThemeStore();

    // Charger la configuration
    const { data: configResponse, isLoading } = useQuery({
        queryKey: ['configuration'],
        queryFn: () => apiClient.get('/api/configuration/full'),
        retry: 1,
    });

    return (
        <div>
            <PageHeader
                title={t('titre')}
                description={t('sections.general.description')}
            />

            <div className="flex flex-col gap-8 lg:flex-row">
                {/* Tabs latérales */}
                <nav className="flex gap-1 overflow-x-auto lg:w-48 lg:flex-col">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    activeTab === tab.id
                                        ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                        : 'text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {t(`sections.${tab.id}.titre`)}
                            </button>
                        );
                    })}
                </nav>

                {/* Contenu de l'onglet */}
                <div className="flex-1 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
                    {/* Général */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--color-texte)]">
                                    {t('sections.general.titre')}
                                </h2>
                                <p className="text-sm text-[var(--color-texte-secondaire)]">
                                    {t('sections.general.description')}
                                </p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <ElisaInput label={t('sections.general.nomEtablissement')} placeholder="Lycée..." />
                                <ElisaInput label={t('sections.general.codeEtablissement')} placeholder="LYC-001" />
                                <ElisaInput label={t('sections.general.email')} type="email" placeholder="contact@ecole.com" />
                                <ElisaInput label={t('sections.general.telephone')} placeholder="+237..." />
                                <ElisaInput label={t('sections.general.adresse')} className="sm:col-span-2" placeholder="Yaoundé, Cameroun" />
                            </div>
                            <ElisaButton>{t('boutons.enregistrer', { ns: 'common' })}</ElisaButton>
                        </div>
                    )}

                    {/* Thème */}
                    {activeTab === 'theme' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--color-texte)]">
                                    {t('sections.theme.titre')}
                                </h2>
                                <p className="text-sm text-[var(--color-texte-secondaire)]">
                                    {t('sections.theme.description')}
                                </p>
                            </div>

                            <div>
                                <p className="mb-3 text-sm font-medium text-[var(--color-texte)]">
                                    {t('sections.theme.couleurDominante')}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {COULEURS_DOMINANTES.map((c) => (
                                        <button
                                            key={c.valeur}
                                            onClick={() => themeStore.setCouleurDominante(c.valeur)}
                                            className={cn(
                                                'h-10 w-10 rounded-full border-2 transition-transform hover:scale-110',
                                                themeStore.couleurDominante === c.valeur
                                                    ? 'border-[var(--color-texte)] scale-110 ring-2 ring-[var(--color-dominante)]/30'
                                                    : 'border-transparent',
                                            )}
                                            style={{ backgroundColor: c.valeur }}
                                            title={c.nom}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="mb-3 text-sm font-medium text-[var(--color-texte)]">
                                    {t('sections.theme.mode')}
                                </p>
                                <div className="flex gap-3">
                                    {(['light', 'dark'] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => themeStore.setMode(mode)}
                                            className={cn(
                                                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                                                themeStore.mode === mode
                                                    ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                                    : 'border-[var(--color-bordure)] text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)]',
                                            )}
                                        >
                                            {mode === 'light' ? t('sections.theme.modeClair') : t('sections.theme.modeSombre')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <ElisaButton variant="outline" onClick={themeStore.reinitialiserTheme}>
                                {t('sections.theme.reinitialiser')}
                            </ElisaButton>
                        </div>
                    )}

                    {/* Autres onglets : placeholder */}
                    {activeTab !== 'general' && activeTab !== 'theme' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Settings className="h-12 w-12 text-[var(--color-texte-secondaire)]/30" />
                            <p className="mt-4 text-sm text-[var(--color-texte-secondaire)]">
                                {t(`sections.${activeTab}.titre`)} — Bientôt disponible
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
