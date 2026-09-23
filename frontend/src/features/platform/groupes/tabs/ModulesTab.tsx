/**
 * ==================================
 * eLISAschool — Platform Groupes · Onglet Modules
 * ==================================
 * Overrides groupe (ModulesGroupe) fusionnés au catalogue :
 * chaque module affiche son état effectif + toggle d'override.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { ElisaToggle } from '@/components/ui/ElisaToggle';
import { Badge } from '@/components/ui/Badge';
import { SchoolLoading } from '@/components/feedback/SchoolLoading';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useCatalogueModules, useModulesGroupe, useToggleModuleGroupe } from '../use-groupes-saas';
import type { GroupeSaaS } from '../types';

interface ModulesTabProps {
    groupe: GroupeSaaS;
}

export function ModulesTab({ groupe }: ModulesTabProps) {
    const { t } = useTranslation('admin');
    const [recherche, setRecherche] = useState('');

    const catalogue = useCatalogueModules();
    const overrides = useModulesGroupe(groupe.id);
    const toggle = useToggleModuleGroupe();

    const overridesParModule = useMemo(() => {
        const map = new Map<string, boolean>();
        (overrides.data ?? []).forEach((o) => map.set(o.moduleCatalogueId, o.actif));
        return map;
    }, [overrides.data]);

    const lignes = useMemo(() => {
        const q = recherche.trim().toLowerCase();
        return (catalogue.data ?? [])
            .filter((m) => !q || m.nom.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
            .sort((a, b) => (a.ordre ?? 99) - (b.ordre ?? 99) || a.nom.localeCompare(b.nom));
    }, [catalogue.data, recherche]);

    const nbActifs = useMemo(() => {
        // État effectif : override s'il existe, sinon actif par défaut du catalogue (inconnu → considéré actif pour BASE)
        return lignes.filter((m) => overridesParModule.get(m.id) ?? true).length;
    }, [lignes, overridesParModule]);

    if (catalogue.isLoading || overrides.isLoading) {
        return (
            <div className="flex justify-center py-8">
                <SchoolLoading variant="compact" />
            </div>
        );
    }

    if (catalogue.isError || overrides.isError) {
        return (
            <ErrorMessage
                title={t('groupes.modules.erreurChargement')}
                message={t('groupes.modules.erreurChargementDetail')}
                onRetry={() => {
                    catalogue.refetch();
                    overrides.refetch();
                }}
                retryLabel={t('groupes.reessayer')}
            />
        );
    }

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            <div className="flex flex-col gap-[var(--gap-sm)] sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--color-texte-secondaire)]">
                    {t('groupes.modules.compteur', { actifs: nbActifs, total: lignes.length })}
                </p>
                <div className="w-full sm:max-w-[clamp(12rem,20vw,18rem)]">
                    <SearchInput
                        value={recherche}
                        onChange={setRecherche}
                        placeholder={t('groupes.modules.rechercher')}
                        debounceMs={200}
                        ariaLabel={t('groupes.modules.rechercher')}
                    />
                </div>
            </div>

            {!lignes.length ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--color-bordure)] py-8 text-center">
                    <Package
                        className="h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-texte-muted)]"
                        aria-hidden
                    />
                    <p className="text-sm text-[var(--color-texte-secondaire)]">
                        {recherche ? t('groupes.modules.aucunResultat') : t('groupes.modules.vide')}
                    </p>
                </div>
            ) : (
                <ul className="flex flex-col gap-[var(--space-xs)]" aria-label={t('groupes.tabs.modules')}>
                    {lignes.map((m) => {
                        const aOverride = overridesParModule.has(m.id);
                        const actif = overridesParModule.get(m.id) ?? true;
                        return (
                            <li
                                key={m.id}
                                className="flex items-center justify-between gap-[var(--gap-sm)] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[var(--space-md)] py-[var(--space-sm)]"
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium text-[var(--color-texte)]">
                                        {m.nom}
                                    </span>
                                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                        <code className="font-mono text-xs text-[var(--color-texte-muted)]">
                                            {m.code}
                                        </code>
                                        {m.categorie && (
                                            <Badge variant="secondary" size="xs">
                                                {m.categorie}
                                            </Badge>
                                        )}
                                        {aOverride && (
                                            <Badge variant="default" size="xs">
                                                {t('groupes.modules.override')}
                                            </Badge>
                                        )}
                                    </span>
                                </span>
                                <ElisaToggle
                                    checked={actif}
                                    onCheckedChange={(next) =>
                                        toggle.mutate({ groupeId: groupe.id, moduleId: m.id, actif: next })
                                    }
                                    disabled={toggle.isPending}
                                    aria-label={`${m.nom}`}
                                    size="sm"
                                />
                            </li>
                        );
                    })}
                </ul>
            )}
            <p className="text-xs text-[var(--color-texte-muted)]">{t('groupes.modules.aide')}</p>
        </div>
    );
}
