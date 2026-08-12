import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Palette, Globe, Blocks, Shield, Bell as BellIcon, History, Package } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { useThemeStore } from '@/stores/theme.store';
import { COULEURS_DOMINANTES } from '@/lib/theme-utils';
import { cn } from '@/lib/cn';
import { SecuriteTab } from './components/SecuriteTab';
import { LangueRegionTab } from './components/LangueRegionTab';
import { ModulesTab } from './components/ModulesTab';
import { NotificationsTab } from './components/NotificationsTab';
import { HistoriqueTab } from './components/HistoriqueTab';
import { CatalogueTab } from './components/CatalogueTab';
import { useAuthStore } from '@/stores/auth.store';
import { useEtablissement, useModifierEtablissement } from '@/features/etablissement';

type TabId = 'general' | 'theme' | 'langue' | 'modules' | 'catalogue' | 'securite' | 'notifications' | 'historique';

const TABS: { id: TabId; icon: React.ElementType }[] = [
    { id: 'general', icon: Settings },
    { id: 'theme', icon: Palette },
    { id: 'langue', icon: Globe },
    { id: 'modules', icon: Blocks },
    { id: 'catalogue', icon: Package },
    { id: 'securite', icon: Shield },
    { id: 'notifications', icon: BellIcon },
    { id: 'historique', icon: History },
];

export function ConfigurationPage() {
    const { t } = useTranslation('configuration');
    const [activeTab, setActiveTab] = useState<TabId>('general');
    const themeStore = useThemeStore();
    const { etablissementId } = useAuthStore();

    const { data: etablissement, isLoading: isLoadingEtablissement, error: etablissementError, refetch } = useEtablissement(
        etablissementId || ''
    );
    const modifierEtablissement = useModifierEtablissement();

    const [formData, setFormData] = useState({
        nomEtablissement: etablissement?.nom || '',
        codeEtablissement: etablissement?.codeEtablissement || '',
        email: etablissement?.contactEmail || '',
        telephone: etablissement?.contactTelephone || '',
        adresse: etablissement?.adresse || '',
    });

    useEffect(() => {
        if (etablissement) {
            setFormData({
                nomEtablissement: etablissement.nom || '',
                codeEtablissement: etablissement.codeEtablissement || '',
                email: etablissement.contactEmail || '',
                telephone: etablissement.contactTelephone || '',
                adresse: etablissement.adresse || '',
            });
        }
    }, [etablissement]);

    const handleSaveGeneral = async () => {
        await modifierEtablissement.mutateAsync({
            id: etablissementId!,
            nom: formData.nomEtablissement,
            codeEtablissement: formData.codeEtablissement,
            contactEmail: formData.email,
            contactTelephone: formData.telephone,
            adresse: formData.adresse,
        });
    };

    if (isLoadingEtablissement && !etablissement) {
        return <PageSkeleton showHeader showStats={false} showTable={false} />;
    }

    if (etablissementError) {
        return (
            <div>
                <PageHeader title={t('titre')} icon={Settings} />
                <ErrorMessage
                    message={t('chargementErreur')}
                    variant="error"
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title={t('titre')}
                subtitle={t('sousTitre')}
                icon={Settings}
            />

            <div className="flex flex-col gap-8 lg:flex-row">
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

                <div className="flex-1">
                    {activeTab === 'general' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('sections.general.titre')}</CardTitle>
                                <CardDescription>{t('sections.general.description')}</CardDescription>
                            </CardHeader>
                            <SectionSeparator />
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <ElisaInput
                                        label={t('sections.general.nomEtablissement')}
                                        value={formData.nomEtablissement}
                                        onChange={(e) => setFormData({ ...formData, nomEtablissement: e.target.value })}
                                        placeholder="Lycée..."
                                    />
                                    <ElisaInput
                                        label={t('sections.general.codeEtablissement')}
                                        value={formData.codeEtablissement}
                                        onChange={(e) => setFormData({ ...formData, codeEtablissement: e.target.value })}
                                        placeholder="LYC-001"
                                    />
                                    <ElisaInput
                                        label={t('sections.general.email')}
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="contact@ecole.com"
                                    />
                                    <ElisaInput
                                        label={t('sections.general.telephone')}
                                        value={formData.telephone}
                                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                        placeholder="+237..."
                                    />
                                    <ElisaInput
                                        label={t('sections.general.adresse')}
                                        className="sm:col-span-2"
                                        value={formData.adresse}
                                        onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                        placeholder="Yaoundé, Cameroun"
                                    />
                                </div>
                                <ElisaButton
                                    variant="primary"
                                    onClick={handleSaveGeneral}
                                    isLoading={modifierEtablissement.isPending}
                                >
                                    {t('boutons.enregistrer', { ns: 'common' })}
                                </ElisaButton>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'theme' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('sections.theme.titre')}</CardTitle>
                                <CardDescription>{t('sections.theme.description')}</CardDescription>
                            </CardHeader>
                            <SectionSeparator />
                            <CardContent className="space-y-6">
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
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'securite' && (
                        <Card>
                            <CardContent className="p-0">
                                <SecuriteTab />
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'langue' && (
                        <Card>
                            <CardContent className="p-0">
                                <LangueRegionTab />
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'modules' && (
                        <Card>
                            <CardContent className="p-0">
                                <ModulesTab />
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'catalogue' && (
                        <Card>
                            <CardContent className="p-0">
                                <CatalogueTab />
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card>
                            <CardContent className="p-0">
                                <NotificationsTab />
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'historique' && (
                        <Card>
                            <CardContent className="p-0">
                                <HistoriqueTab />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
