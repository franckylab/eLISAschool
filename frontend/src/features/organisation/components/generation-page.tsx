import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Sparkles } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuthStore } from '@/stores/auth.store';
import { useTemplatesOrganisation, useGenererOrganisation } from '../hooks/use-templates';
import type { ResultatGeneration } from '../types/organisation.types';

export function GenerationPage() {
    const { t } = useTranslation('organisation');
    const { data: templates } = useTemplatesOrganisation();
    const etablissementId = useAuthStore(s => s.etablissementId) || '';
    const generer = useGenererOrganisation();
    const [templateId, setTemplateId] = useState('');
    const [prefixeCode, setPrefixeCode] = useState('');
    const [modeConflit, setModeConflit] = useState<'ERROR' | 'SKIP' | 'OVERWRITE'>('OVERWRITE');
    const [creerHierarchie, setCreerHierarchie] = useState(true);
    const [result, setResult] = useState<ResultatGeneration | null>(null);

    const handleGenerate = () => {
        if (!templateId || !etablissementId) return;
        generer.mutate({
            templateId,
            etablissementId,
            options: {
                prefixeCode: prefixeCode || undefined,
                creerHierarchie,
                modeConflit,
            },
        }, {
            onSuccess: (data) => setResult(data ?? null),
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('genererOrganisation')}
                icon={Sparkles}
                variant="gradient"
            />
            <Card className="p-6">
                <div className="space-y-4 max-w-xl">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">{t('template')}</label>
                        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded bg-background text-foreground">
                            <option value="">{t('selectionnerTemplate')}</option>
                            {(templates || []).map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.nom}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">{t('prefixeCode')}</label>
                            <input value={prefixeCode} onChange={(e) => setPrefixeCode(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground"
                                placeholder={t('optionnel')} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">{t('modeConflit')}</label>
                            <select value={modeConflit} onChange={(e) => setModeConflit(e.target.value as any)}
                                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground">
                                <option value="ERROR">{t('modeConflitError')}</option>
                                <option value="SKIP">{t('modeConflitSkip')}</option>
                                <option value="OVERWRITE">{t('modeConflitOverwrite')}</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 pb-2">
                                <input type="checkbox" checked={creerHierarchie} onChange={(e) => setCreerHierarchie(e.target.checked)}
                                    className="rounded border-border" />
                                <span className="text-sm text-foreground">{t('creerHierarchie')}</span>
                            </label>
                        </div>
                    </div>
                    <ElisaButton variant="primary" icon={<Play className="h-4 w-4" />}
                        onClick={handleGenerate} disabled={!templateId || !etablissementId || generer.isPending}>
                        {generer.isPending ? t('generationEnCours') : t('generer')}
                    </ElisaButton>

                    {result && (
                        <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded space-y-3">
                            <h3 className="font-semibold text-foreground">{t('resultatGeneration')}</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-3 bg-background border border-border rounded shadow-sm text-center">
                                    <p className="text-2xl font-bold text-blue-600">{result.unitesCrees}</p>
                                    <p className="text-xs text-muted-foreground">{t('unitesCrees')}</p>
                                </div>
                                <div className="p-3 bg-background border border-border rounded shadow-sm text-center">
                                    <p className="text-2xl font-bold text-purple-600">{result.postesCrees}</p>
                                    <p className="text-xs text-muted-foreground">{t('postesCrees')}</p>
                                </div>
                                <div className="p-3 bg-background border border-border rounded shadow-sm text-center">
                                    <p className="text-2xl font-bold text-green-600">{result.hierarchiesCrees}</p>
                                    <p className="text-xs text-muted-foreground">{t('hierarchiesCrees')}</p>
                                </div>
                            </div>
                            <details>
                                <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">{t('voirDetail')}</summary>
                                <pre className="mt-2 p-2 bg-surface-alt border border-border rounded text-xs font-mono overflow-auto max-h-48 text-foreground">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
