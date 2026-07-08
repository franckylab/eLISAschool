import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Clock, ListOrdered, Database, RefreshCw, CheckCircle } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { usePermissions } from '@/hooks';
import { useConfiguration, useUpdateConfiguration, useResetConfiguration } from '../hooks/use-organisation';

interface Props { organisationId: string }

export function TabConfiguration({ organisationId }: Props) {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    const { data: params } = useConfiguration();
    const updateConfig = useUpdateConfiguration();
    const resetConfig = useResetConfiguration();

    const configItems = [
        {
            key: 'organisation.cache_arborescence_ttl',
            label: t('cacheArborescenceTTL'),
            description: t('cacheArborescenceDesc'),
            icon: Clock,
            defaultValue: '300',
        },
        {
            key: 'organisation.pagination_defaut_limit',
            label: t('paginationDefautLimit'),
            description: t('paginationDefautDesc'),
            icon: ListOrdered,
            defaultValue: '20',
        },
        {
            key: 'organisation.pagination_max_limit',
            label: t('paginationMaxLimit'),
            description: t('paginationMaxDesc'),
            icon: Database,
            defaultValue: '100',
        },
    ];

    const [values, setValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        configItems.forEach(item => { initial[item.key] = item.defaultValue; });
        return initial;
    });

    useEffect(() => {
        if (params && params.length > 0) {
            setValues((prev) => {
                const next = { ...prev };
                for (const p of params) {
                    if (p.valeur !== undefined && p.valeur !== null) {
                        next[p.cle] = String(p.valeur);
                    }
                }
                return next;
            });
        }
    }, [params]);

    const handleSave = async (key: string) => {
        try {
            await updateConfig.mutateAsync({ cle: key, valeur: values[key] });
        } catch { /* error handled by hook */ }
    };

    const handleReset = async (key: string) => {
        try {
            await resetConfig.mutateAsync(key);
            setValues((prev) => {
                const item = configItems.find(i => i.key === key);
                return { ...prev, [key]: item?.defaultValue || '' };
            });
        } catch { /* error handled by hook */ }
    };

    const isLoading = (key: string) => updateConfig.isPending && updateConfig.variables?.cle === key
        || resetConfig.isPending && resetConfig.variables === key;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Settings className="h-5 w-5 text-blue-500" />
                        {t('parametresSysteme')}
                    </h3>

                    <div className="space-y-6">
                        {configItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.key} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</h4>
                                            <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                                            <div className="flex gap-2">
                                                <ElisaInput
                                                    value={values[item.key]}
                                                    onChange={(e) => setValues((prev) => ({ ...prev, [item.key]: e.target.value }))}
                                                    placeholder={item.defaultValue}
                                                />
                                                {hasPermission('organisation:edit') && (
                                                    <>
                                                        <ElisaButton variant="primary" size="sm"
                                                            onClick={() => handleSave(item.key)}
                                                            loading={isLoading(item.key)}
                                                            disabled={updateConfig.isPending || resetConfig.isPending}>
                                                            <CheckCircle className="h-4 w-4" />
                                                        </ElisaButton>
                                                        <ElisaButton variant="ghost" size="sm"
                                                            onClick={() => handleReset(item.key)}
                                                            disabled={updateConfig.isPending || resetConfig.isPending}>
                                                            <RefreshCw className="h-4 w-4" />
                                                        </ElisaButton>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('aPropos')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {t('configDescription')}
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>{t('aPropos')} :</strong> {t('configNote')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
