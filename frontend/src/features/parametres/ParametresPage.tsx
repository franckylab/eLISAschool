import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Search, Plus, RotateCcw, Trash2, Edit2, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Card, CardContent } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { cn } from '@/lib/cn';
import {
    useParametres,
    useSupprimerParametre,
    useReinitialiserTousParametres,
    useModifierParametre,
} from './hooks/use-parametres';
import { CategorieParametre, TypeValeurParametre } from './types/parametres.types';
import type { ParametreSysteme } from './types/parametres.types';

const CATEGORIES_CONFIG: Record<CategorieParametre, { label: string; icone: string; couleur: string }> = {
    [CategorieParametre.SYSTEME]: { label: 'Système', icone: '⚙️', couleur: 'gray' },
    [CategorieParametre.SECURITE]: { label: 'Sécurité', icone: '🔒', couleur: 'red' },
    [CategorieParametre.ETABLISSEMENT]: { label: 'Établissement', icone: '🏫', couleur: 'blue' },
    [CategorieParametre.MODULE]: { label: 'Modules', icone: '🧩', couleur: 'purple' },
    [CategorieParametre.THEME]: { label: 'Thème', icone: '🎨', couleur: 'pink' },
    [CategorieParametre.NOTIFICATION]: { label: 'Notifications', icone: '🔔', couleur: 'yellow' },
    [CategorieParametre.REGIONAL]: { label: 'Régional', icone: '🌍', couleur: 'green' },
    [CategorieParametre.CUSTOM]: { label: 'Personnalisé', icone: '✨', couleur: 'indigo' },
};

export function ParametresPage() {
    const { t } = useTranslation('parametres');
    const [filtres, setFiltres] = useState({
        categorie: undefined as CategorieParametre | undefined,
        search: '',
        visible: true,
    });
    const [selectedParam, setSelectedParam] = useState<ParametreSysteme | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [resetConfirm, setResetConfirm] = useState(false);

    const { data: response, isLoading, isError, error, refetch } = useParametres(filtres);
    const supprimer = useSupprimerParametre();
    const reinitialiserTous = useReinitialiserTousParametres();
    const modifier = useModifierParametre();

    const parametres = response?.data || [];

    const [editForm, setEditForm] = useState({
        cle: '',
        valeur: '',
        description: '',
    });

    useEffect(() => {
        if (selectedParam) {
            setEditForm({
                cle: selectedParam.cle,
                valeur: selectedParam.valeur,
                description: selectedParam.description || '',
            });
        }
    }, [selectedParam]);

    const parseValeur = (param: ParametreSysteme): any => {
        try { return JSON.parse(param.valeur); }
        catch { return param.valeur; }
    };

    const formatValeur = (param: ParametreSysteme): string => {
        const valeur = parseValeur(param);
        if (param.typeValeur === TypeValeurParametre.BOOLEAN) return valeur ? t('oui') : t('non');
        if (param.typeValeur === TypeValeurParametre.NUMBER) return String(valeur);
        if (typeof valeur === 'object') return JSON.stringify(valeur, null, 2);
        return String(valeur);
    };

    const stats = useMemo(() => ({
        total: parametres.length,
        parCategorie: parametres.reduce((acc, p) => {
            acc[p.categorie] = (acc[p.categorie] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
    }), [parametres]);

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        await supprimer.mutateAsync(deleteConfirm);
        setDeleteConfirm(null);
    };

    const handleResetAll = async () => {
        await reinitialiserTous.mutateAsync();
        setResetConfirm(false);
    };

    const handleEditSubmit = async () => {
        if (!selectedParam) return;
        try {
            await modifier.mutateAsync({
                cle: selectedParam.cle,
                dto: {
                    valeur: editForm.valeur,
                    description: editForm.description || undefined,
                },
            });
            setSelectedParam(null);
        } catch (e) {
            console.error('[ParametresPage] Erreur édition:', e);
        }
    };

    if (isLoading && !response) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>
            <PageHeader
                title={t('titre')}
                description={t('description')}
                icon={Settings}
                actions={
                    <ElisaButton
                        variant="primary"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {}}
                    >
                        {t('nouveauParametre')}
                    </ElisaButton>
                }
            />

            <Card>
                <CardContent className="p-4">
                    <div className="grid gap-4 sm:grid-cols-4">
                        <div className="p-4 bg-card rounded-lg border border-border">
                            <p className="text-sm text-muted-foreground">{t('totalParametres')}</p>
                            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                        </div>
                        {Object.entries(CATEGORIES_CONFIG).slice(0, 3).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setFiltres({ ...filtres, categorie: key as CategorieParametre })}
                                className={cn(
                                    'p-4 rounded-lg border transition-colors text-left',
                                    filtres.categorie === key
                                        ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/5'
                                        : 'border-border hover:border-[var(--color-dominante)]/50'
                                )}
                            >
                                <p className="text-2xl mb-1">{config.icone}</p>
                                <p className="text-sm text-muted-foreground">{config.label}</p>
                                <p className="text-lg font-semibold text-foreground">
                                    {stats.parCategorie[key] || 0}
                                </p>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('rechercher')}
                            value={filtres.search}
                            onChange={(e) => setFiltres({ ...filtres, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        />
                    </div>
                </div>

                <select
                    value={filtres.categorie || ''}
                    onChange={(e) => setFiltres({ ...filtres, categorie: e.target.value as CategorieParametre || undefined })}
                    className="px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-[var(--color-dominante)]"
                >
                    <option value="">{t('toutesCategories')}</option>
                    {Object.entries(CATEGORIES_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                            {config.icone} {config.label}
                        </option>
                    ))}
                </select>

                <ElisaButton
                    variant="outline"
                    icon={<RotateCcw className="h-4 w-4" />}
                    onClick={() => setResetConfirm(true)}
                    isLoading={reinitialiserTous.isPending}
                >
                    {t('reinitialiserTout')}
                </ElisaButton>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    {parametres.length === 0 ? (
                        <CardContent className="py-12 text-center">
                            <Settings className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-muted-foreground">{t('aucunParametre')}</p>
                        </CardContent>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('colonne.cle')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('colonne.valeur')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('colonne.type')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('colonne.categorie')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('colonne.module')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">{t('colonne.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {parametres.map((param) => {
                                    const configCat = CATEGORIES_CONFIG[param.categorie];
                                    return (
                                        <tr key={param.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-foreground">{param.cle}</p>
                                                    {param.description && (
                                                        <p className="text-xs text-muted-foreground mt-1">{param.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <code className="text-sm bg-muted px-2 py-1 rounded">{formatValeur(param)}</code>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium text-muted-foreground">{param.typeValeur}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted">
                                                    {configCat?.icone} {configCat?.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-muted-foreground">{param.module || '—'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedParam(param)}
                                                        className="p-1 hover:bg-muted rounded transition-colors"
                                                        title={t('actions.modifier')}
                                                    >
                                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                                    </button>
                                                    {!param.modifiableRuntime && (
                                                        <button
                                                            onClick={() => setDeleteConfirm(param.cle)}
                                                            disabled={supprimer.isPending}
                                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                                                            title={t('actions.supprimer')}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

            {selectedParam && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">{t('form.titreModifier')}</h2>
                                <p className="text-sm text-muted-foreground mt-1">{selectedParam.cle}</p>
                            </div>
                            <button
                                onClick={() => setSelectedParam(null)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">{t('form.cle')}</label>
                                <input
                                    type="text"
                                    value={editForm.cle}
                                    readOnly
                                    className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-muted-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">{t('form.type')}</label>
                                <div className="px-3 py-2 bg-muted/50 border border-border rounded-lg">
                                    <span className="text-sm font-mono">{selectedParam.typeValeur}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    {t('form.valeur')}
                                    {selectedParam.typeValeur === TypeValeurParametre.BOOLEAN && (
                                        <span className="ml-2 text-xs text-muted-foreground">(true/false)</span>
                                    )}
                                    {selectedParam.typeValeur === TypeValeurParametre.NUMBER && (
                                        <span className="ml-2 text-xs text-muted-foreground">({t('form.nombre')})</span>
                                    )}
                                    {selectedParam.typeValeur === TypeValeurParametre.JSON && (
                                        <span className="ml-2 text-xs text-muted-foreground">({t('form.jsonValide')})</span>
                                    )}
                                </label>
                                {selectedParam.typeValeur === TypeValeurParametre.BOOLEAN ? (
                                    <select
                                        value={editForm.valeur}
                                        onChange={(e) => setEditForm({ ...editForm, valeur: e.target.value })}
                                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-[var(--color-dominante)]"
                                    >
                                        <option value="true">{t('oui')} (true)</option>
                                        <option value="false">{t('non')} (false)</option>
                                    </select>
                                ) : selectedParam.typeValeur === TypeValeurParametre.JSON ? (
                                    <textarea
                                        value={editForm.valeur}
                                        onChange={(e) => setEditForm({ ...editForm, valeur: e.target.value })}
                                        rows={6}
                                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-[var(--color-dominante)] font-mono"
                                        placeholder='{"key": "value"}'
                                    />
                                ) : (
                                    <input
                                        type={selectedParam.typeValeur === TypeValeurParametre.NUMBER ? 'number' : 'text'}
                                        value={editForm.valeur}
                                        onChange={(e) => setEditForm({ ...editForm, valeur: e.target.value })}
                                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-[var(--color-dominante)]"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">{t('form.description')}</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-[var(--color-dominante)]"
                                    placeholder={t('form.descriptionPlaceholder')}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">{t('form.categorie')}</label>
                                    <div className="px-3 py-2 bg-muted/50 border border-border rounded-lg">
                                        <span className="text-sm">
                                            {CATEGORIES_CONFIG[selectedParam.categorie]?.icone}{' '}
                                            {CATEGORIES_CONFIG[selectedParam.categorie]?.label}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">{t('form.module')}</label>
                                    <div className="px-3 py-2 bg-muted/50 border border-border rounded-lg">
                                        <span className="text-sm">{selectedParam.module || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <input type="checkbox" checked={selectedParam.modifiableRuntime} disabled className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-blue-800 dark:text-blue-200">
                                    {selectedParam.modifiableRuntime ? t('form.modifiableRuntime') : t('form.nonModifiable')}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                            <ElisaButton variant="outline" onClick={() => setSelectedParam(null)} disabled={modifier.isPending}>
                                {t('form.annuler')}
                            </ElisaButton>
                            <ElisaButton onClick={handleEditSubmit} disabled={modifier.isPending || !editForm.valeur}>
                                {modifier.isPending ? t('form.enregistrement') : t('form.enregistrer')}
                            </ElisaButton>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!deleteConfirm}
                onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage', { cle: deleteConfirm || '' })}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />

            <ConfirmDialog
                open={resetConfirm}
                onOpenChange={setResetConfirm}
                title={t('confirmerResetTitre')}
                description={t('confirmerResetMessage')}
                confirmText={t('reinitialiserTout')}
                variant="danger"
                onConfirm={handleResetAll}
                isLoading={reinitialiserTous.isPending}
            />
        </div>
    );
}
