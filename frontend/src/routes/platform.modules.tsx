/**
 * ==================================
 * eLISAschool - Gestion Modules Plateforme (Catalogue unifié)
 * ==================================
 *
 * Source de vérité unique : modules_catalogue (Lot A — Refonte SaaS v7).
 * Remplace l'ancien registre frontend module-advanced.
 *
 * API :
 *  GET/POST/PUT/DELETE /api/platform/facturation/modules/catalogue
 *  POST /api/platform/facturation/modules/catalogue/sync
 *  GET  /api/platform/facturation/modules/catalogue/resolution?etablissementId=
 *
 * Phase 7 — Lot A (Refonte SaaS v7)
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
    Puzzle,
    Search,
    Plus,
    RefreshCw,
    Edit2,
    Trash2,
    ChevronDown,
    ChevronRight,
    Globe,
    ShieldCheck,
    Layers,
    Boxes,
    CheckCircle2,
    CircleOff,
} from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { InlineSpinner } from '@/components/feedback/InlineSpinner';
import {
    PlatformStatCard,
    StatusBadge,
    ConfirmAction,
    EmptyState,
} from '@/features/admin/components/ui-platform';

// =============================================
// TYPES
// =============================================

type CategorieModule = 'CRITIQUE' | 'PREMIUM' | 'ADDON';

interface ModuleCatalogue {
    id: string;
    code: string;
    nom: string;
    nomEn?: string;
    description?: string;
    categorie: CategorieModule;
    icone?: string;
    prixMensuel?: number;
    prixAnnuel?: number;
    estFacturable: boolean;
    estSouscriptible: boolean;
    actifParDefaut: boolean;
    planMinimal?: string;
    dependencies?: string[];
    permissionsRequises?: string[];
    ordre?: number;
    estSysteme: boolean;
    estActif: boolean;
    etablissementId?: string | null;
}

interface ModuleResolu {
    code: string;
    nom: string;
    categorie: CategorieModule;
    actif: boolean;
    source: 'catalogue' | 'plan' | 'supplement';
    prixMensuel?: number;
}

interface EtablissementRef {
    id: string;
    nom: string;
    code: string;
}

// =============================================
// CONSTANTES UI
// =============================================

const CATEGORIES: { value: 'TOUTES' | CategorieModule; labelKey: string }[] = [
    { value: 'TOUTES', labelKey: 'catalogue.categories.toutes' },
    { value: 'CRITIQUE', labelKey: 'catalogue.categories.critiques' },
    { value: 'PREMIUM', labelKey: 'catalogue.categories.premium' },
    { value: 'ADDON', labelKey: 'catalogue.categories.addons' },
];

const CATEGORIE_BADGE: { [K in CategorieModule]: { labelKey: string; tone: 'info' | 'neutral' | 'warning' } } = {
    CRITIQUE: { labelKey: 'catalogue.badge.critique', tone: 'info' },
    PREMIUM: { labelKey: 'catalogue.badge.premium', tone: 'neutral' },
    ADDON: { labelKey: 'catalogue.badge.addon', tone: 'warning' },
};

const SOURCE_LABEL_KEYS: Record<ModuleResolu['source'], string> = {
    catalogue: 'catalogue.source.catalogue',
    plan: 'catalogue.source.plan',
    supplement: 'catalogue.source.supplement',
};

function formatPrixXAF(montant?: number, t?: TFunction): string {
    if (!montant) return t?.('catalogue.inclus', 'Inclus') ?? 'Inclus';
    return `${montant.toLocaleString('fr-FR')} F/mois`;
}

// =============================================
// MODAL CRUD CATALOGUE
// =============================================

interface CatalogueModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entree?: ModuleCatalogue | null;
    onSubmit: (data: Partial<ModuleCatalogue>) => Promise<void>;
}

function CatalogueFormModal({ open, onOpenChange, entree, onSubmit }: CatalogueModalProps) {
    const { t } = useTranslation('admin');
    const [form, setForm] = useState<Partial<ModuleCatalogue>>({});
    const [submitting, setSubmitting] = useState(false);

    // Reset du formulaire à l'ouverture (et réinitialisation à la fermeture)
    useEffect(() => {
        if (open) setForm(entree ? { ...entree } : { categorie: 'ADDON', estActif: true });
    }, [open, entree]);

    const set = <K extends keyof Partial<ModuleCatalogue>>(key: K, valeur: Partial<ModuleCatalogue>[K]) =>
        setForm((f) => ({ ...f, [key]: valeur }));

    const handleSubmit = async () => {
        if (!form.code?.trim() || !form.nom?.trim()) {
            toast.error(t('catalogue.modal.codeRequis'));
            return;
        }
        setSubmitting(true);
        try {
            await onSubmit(form);
        } finally {
            setSubmitting(false);
        }
    };

    const fieldClass =
        'w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] ' +
        'px-[var(--space-md)] py-[var(--space-sm)] text-[var(--color-text-primary)] ' +
        'focus:ring-2 focus:ring-[var(--color-dominant-300)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
    const labelClass = 'block text-[var(--color-text-secondary)] font-medium mb-[var(--space-xs)]';
    const fs = 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)';

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={entree ? t('catalogue.modal.modifier', { code: entree.code }) : t('catalogue.modal.nouveau')}
            size="md"
            footer={
                <div className="flex items-center justify-end gap-[var(--gap-sm)]">
                    <ElisaButton variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                        {t('catalogue.modal.annuler')}
                    </ElisaButton>
                    <ElisaButton variant="primary" onClick={handleSubmit} disabled={submitting} loading={submitting}>
                        {entree ? t('catalogue.modal.enregistrer') : t('catalogue.modal.creer')}
                    </ElisaButton>
                </div>
            }
        >
            <div className="space-y-[var(--space-md)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-md)]">
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.code')}</label>
                        <input
                            value={form.code ?? ''}
                            disabled={!!entree?.estSysteme}
                            onChange={(e) => set('code', e.target.value)}
                            className={fieldClass}
                            placeholder="ex: cantine"
                            style={{ fontSize: fs }}
                        />
                        {entree?.estSysteme && (
                            <p className="text-[var(--color-text-muted)] mt-1" style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }}>
                                {t('catalogue.modal.codeProtege')}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.nom')}</label>
                        <input
                            value={form.nom ?? ''}
                            onChange={(e) => set('nom', e.target.value)}
                            className={fieldClass}
                            placeholder="ex. Cantine scolaire"
                            style={{ fontSize: fs }}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.description')}</label>
                    <textarea
                        value={form.description ?? ''}
                        onChange={(e) => set('description', e.target.value)}
                        className={fieldClass}
                        rows={3}
                        style={{ fontSize: fs }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--gap-md)]">
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.categorie')}</label>
                        <ElisaSelect
                            value={form.categorie ?? 'ADDON'}
                            onValueChange={(v) => set('categorie', v as CategorieModule)}
                            options={(
                                [
                                    ['CRITIQUE', t('catalogue.modal.categorieCritique')],
                                    ['PREMIUM', t('catalogue.modal.categoriePremium')],
                                    ['ADDON', t('catalogue.modal.categorieAddon')],
                                ] as [CategorieModule, string][]
                            ).map(([value, label]) => ({ value, label }))}
                            className="w-full"
                            searchable={false}
                            aria-label="Module category"
                        />
                    </div>
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.prixMensuel')}</label>
                        <input
                            type="number"
                            min={0}
                            value={form.prixMensuel ?? 0}
                            onChange={(e) => set('prixMensuel', Math.max(0, Number(e.target.value)))}
                            className={fieldClass}
                            style={{ fontSize: fs }}
                        />
                    </div>
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.prixAnnuel')}</label>
                        <input
                            type="number"
                            min={0}
                            value={form.prixAnnuel ?? 0}
                            onChange={(e) => set('prixAnnuel', Math.max(0, Number(e.target.value)))}
                            className={fieldClass}
                            style={{ fontSize: fs }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-md)]">
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.planMinimum')}</label>
                        <ElisaSelect
                            value={form.planMinimal ?? ''}
                            onValueChange={(v) => set('planMinimal', v || undefined)}
                            options={[
                                { value: '', label: t('catalogue.modal.planAucun') },
                                { value: 'starter', label: 'Starter' },
                                { value: 'standard', label: 'Standard' },
                                { value: 'premium', label: 'Premium' },
                                { value: 'enterprise', label: 'Enterprise' },
                            ]}
                            className="w-full"
                            searchable={false}
                        />
                    </div>
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.icone')}</label>
                        <input
                            value={form.icone ?? ''}
                            onChange={(e) => set('icone', e.target.value)}
                            className={fieldClass}
                            placeholder="ex. UtensilsCrossed"
                            style={{ fontSize: fs }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-md)]">
                    <label
                        className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-[var(--space-md)] py-[var(--space-sm)] cursor-pointer"
                    >
                        <span className="text-[var(--color-text-secondary)]" style={{ fontSize: fs }}>{t('catalogue.modal.actifDefaut')}</span>
                        <input
                            type="checkbox"
                            checked={form.actifParDefaut ?? false}
                            onChange={(e) => set('actifParDefaut', e.target.checked)}
                            className="h-[var(--icon-sm)] w-[var(--icon-sm)] accent-[var(--color-dominant-600)]"
                        />
                    </label>
                    <label
                        className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-[var(--space-md)] py-[var(--space-sm)] cursor-pointer"
                    >
                        <span className="text-[var(--color-text-secondary)]" style={{ fontSize: fs }}>{t('catalogue.modal.visibleCatalogue')}</span>
                        <input
                            type="checkbox"
                            checked={form.estActif ?? true}
                            onChange={(e) => set('estActif', e.target.checked)}
                            className="h-[var(--icon-sm)] w-[var(--icon-sm)] accent-[var(--color-dominant-600)]"
                        />
                    </label>
                </div>
            </div>
        </CustomModal>
    );
}

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

function PlatformModulesPage() {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [expanded, setExpanded] = useState<CategorieModule | null>('CRITIQUE');
    const [recherche, setRecherche] = useState('');
    const [filtreCategorie, setFiltreCategorie] = useState<'TOUTES' | CategorieModule>('TOUTES');
    const [modalOuvert, setModalOuvert] = useState(false);
    const [edition, setEdition] = useState<ModuleCatalogue | null>(null);
    const [suppression, setSuppression] = useState<ModuleCatalogue | null>(null);
    const [etabResolution, setEtabResolution] = useState('');

    // ---- Requêtes ----
    const { data: catalogue, isLoading } = useQuery({
        queryKey: ['modules-catalogue', filtreCategorie, recherche],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (filtreCategorie !== 'TOUTES') params.categorie = filtreCategorie;
            if (recherche.trim()) params.search = recherche.trim();
            const res = await apiClient.get<ModuleCatalogue[]>('/api/platform/facturation/modules/catalogue', params);
            return res.data ?? [];
        },
    });

    const { data: etablissements } = useQuery({
        queryKey: ['etablissements-refs'],
        queryFn: async () => {
            const res = await apiClient.get<EtablissementRef[]>('/api/platform/etablissements', { limit: '100' });
            return res.data ?? [];
        },
    });

    const { data: resolution, isFetching: resolutionLoading } = useQuery({
        queryKey: ['modules-resolution', etabResolution],
        queryFn: async () => {
            if (!etabResolution) return null;
            const res = await apiClient.get<ModuleResolu[]>('/api/platform/facturation/modules/catalogue/resolution', {
                etablissementId: etabResolution,
            });
            return res.data ?? [];
        },
        enabled: !!etabResolution,
    });

    // ------- Mutations -------
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['modules-catalogue'] });

    const createMutation = useMutation({
        mutationFn: async (data: Partial<ModuleCatalogue>) =>
            apiClient.post('/api/platform/facturation/modules/catalogue', data),
        onSuccess: () => {
            toast.success(t('catalogue.toast.cree'));
            setModalOuvert(false);
            invalidate();
        },
        onError: (e: Error) => toast.error(e.message || t('catalogue.toast.erreurCreation')),
    });

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<ModuleCatalogue>) =>
            apiClient.put(`/api/platform/facturation/modules/catalogue/${edition?.id}`, data),
        onSuccess: () => {
            toast.success(t('catalogue.toast.misAJour'));
            setModalOuvert(false);
            invalidate();
        },
        onError: (e: Error) => toast.error(e.message || t('catalogue.toast.erreurMaj')),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) =>
            apiClient.delete(`/api/platform/facturation/modules/catalogue/${id}`),
        onSuccess: () => {
            toast.success(t('catalogue.toast.supprime'));
            setSuppression(null);
            invalidate();
        },
        onError: (e: Error) => toast.error(e.message || t('catalogue.toast.erreurSuppression')),
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, estActif }: { id: string; estActif: boolean }) =>
            apiClient.put(`/api/platform/facturation/modules/catalogue/${id}`, { estActif }),
        onSuccess: () => {
            toast.success(t('catalogue.toast.toggle'));
            invalidate();
        },
        onError: (e: Error) => toast.error(e.message || t('catalogue.toast.erreurToggle')),
    });

    const syncMutation = useMutation({
        mutationFn: async () =>
            apiClient.post<{ total: number }>('/api/platform/facturation/modules/catalogue/sync'),
        onSuccess: (res) => {
            toast.success(t('catalogue.toast.sync', { count: res.data?.total ?? 0 }));
            invalidate();
        },
        onError: (e: Error) => toast.error(e.message || t('catalogue.toast.erreurSync')),
    });

    // ------- Dériviations -------
    const parCategorie: Record<CategorieModule, ModuleCatalogue[]> = {
        CRITIQUE: [],
        PREMIUM: [],
        ADDON: [],
    };
    for (const m of catalogue ?? []) parCategorie[m.categorie]?.push(m);

    if (catalogue && expanded && !parCategorie[expanded as CategorieModule]?.length) {
        const first = (Object.keys(parCategorie) as CategorieModule[]).find((c) => parCategorie[c].length > 0);
        if (first) setExpanded(first);
    }

    const total = catalogue?.length ?? 0;
    const critiques = parCategorie.CRITIQUE.length;
    const payants = (catalogue ?? []).filter((m) => m.estFacturable).length;
    const actifsDefaut = (catalogue ?? []).filter((m) => m.actifParDefaut).length;

    const etabsOptions = (etablissements ?? []).map((e) => ({ value: e.id, label: e.nom }));

    const badgeVariant = (m: ModuleCatalogue) =>
        m.estActif ? 'success' : 'warning';

    return (
        <div className="p-[clamp(1rem, 0.75rem + 1vw, 1.5rem)] space-y-[var(--space-lg)]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-[var(--gap-md)]">
                <div className="flex items-center gap-[var(--gap-md)]">
                    <span className="p-2.5 rounded-[var(--radius-md)] bg-[var(--color-dominant-50)] text-[var(--color-dominant-600)] dark:bg-[var(--color-dominant-900)]/20 dark:text-[var(--color-dominant-300)]">
                        <Puzzle className="h-[var(--icon-lg)] w-[var(--icon-lg)]" />
                    </span>
                    <div>
                        <h1 className="font-bold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(1.25rem, 1rem + 1vw, 1.75rem)' }}>
                            {t('catalogue.titre')}
                        </h1>
                        <p className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)' }}>
                            {t('catalogue.sousTitre')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <ElisaButton variant="secondary" onClick={() => syncMutation.mutate()} loading={syncMutation.isPending}>
                        <RefreshCw className="h-[var(--icon-sm)] w-[var(--icon-sm)]" /> {t('catalogue.synchroniser')}
                    </ElisaButton>
                    <ElisaButton variant="primary" onClick={() => { setEdition(null); setModalOuvert(true); }}>
                        <Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" /> {t('catalogue.nouveauModule')}
                    </ElisaButton>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--gap-md)]">
                <PlatformStatCard label={t('catalogue.totalModules')} value={total} icon={<Boxes className="h-[var(--icon-md)] w-[var(--icon-md)]" />} loading={isLoading} />
                <PlatformStatCard label={t('catalogue.critiquesGratuits')} value={critiques} tone="info" icon={<ShieldCheck className="h-[var(--icon-md)] w-[var(--icon-md)]" />} loading={isLoading} />
                <PlatformStatCard label={t('catalogue.facturables')} value={payants} tone="warning" icon={<Layers className="h-[var(--icon-md)] w-[var(--icon-md)]" />} loading={isLoading} />
                <PlatformStatCard label={t('catalogue.actifsDefaut')} value={actifsDefaut} tone="success" icon={<CheckCircle2 className="h-[var(--icon-md)] w-[var(--icon-md)]" />} loading={isLoading} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-[var(--gap-md)] items-start md:items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-[var(--space-md)] top-1/2 -translate-y-1/2 h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-muted)]" />
                    <input
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder={t('catalogue.rechercher')}
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-[var(--space-md)] py-[var(--space-sm)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-300)] focus:outline-none"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                    />
                </div>
                <ElisaSelect
                    value={filtreCategorie}
                    onValueChange={(v) => setFiltreCategorie(v as 'TOUTES' | CategorieModule)}
                    options={CATEGORIES.map((c) => ({ value: c.value, label: t(c.labelKey) }))}
                    className="w-[clamp(160px,20vw,240px)]"
                    searchable={false}
                />
            </div>

            {/* Liste par catégorie */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <InlineSpinner size="lg" label={t('catalogue.chargement')} />
                </div>
            ) : total === 0 ? (
                <EmptyState
                    icon={<Boxes className="h-10 w-10" />}
                    title={t('catalogue.aucunModule')}
                    description={t('catalogue.aucunModuleDesc')}
                />
            ) : (
                <div className="space-y-[var(--gap-md)]">
                    {(['CRITIQUE', 'PREMIUM', 'ADDON'] as CategorieModule[]).map((cat) => {
                        const mods = parCategorie[cat];
                        if (!mods.length) return null;
                        const badge = CATEGORIE_BADGE[cat];
                        const estOuvert = expanded === cat;
                        return (
                            <div key={cat} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                                {/* Header catégorie */}
                                <button
                                    onClick={() => setExpanded(estOuvert ? null : cat)}
                                    className="w-full flex items-center justify-between px-[var(--space-md)] py-[var(--space-sm)] hover:bg-[var(--color-surface-hover)] transition-colors"
                                >
                                    <div className="flex items-center gap-[var(--gap-sm)]">
                                        {estOuvert ? <ChevronDown className="h-[var(--icon-sm)] w-[var(--icon-sm)]" /> : <ChevronRight className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                        <span className="font-semibold text-[var(--color-text-primary)]">{t(badge.labelKey)}s</span>
                                        <span className="text-xs text-[var(--color-text-muted)]">({mods.length})</span>
                                    </div>
                                    <span className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)' }}>
                                        {t('catalogue.payants', { count: mods.filter((m) => m.estFacturable).length })}
                                    </span>
                                </button>

                                {estOuvert && (
                                    <div className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                                        {mods.map((m) => (
                                            <div key={m.id} className="flex items-center justify-between gap-[var(--gap-md)] px-[var(--space-md)] py-[var(--space-sm)]">
                                                <div className="flex items-center gap-[var(--gap-md)] min-w-0">
                                                    <span className="text-[var(--color-text-muted)]">{m.icone}</span>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-[var(--gap-xs)] flex-wrap">
                                                            <span className="font-medium text-[var(--color-text-primary)]">{m.nom}</span>
                                                            <code className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-hover)] px-1.5 py-0.5 rounded">{m.code}</code>
                                                            <StatusBadge status={m.estActif ? 'actif' : 'inactif'} label={m.estActif ? t('catalogue.actif') : t('catalogue.inactif')} variant={badgeVariant(m)} />
                                                            {m.estSysteme && <StatusBadge status="système" label={t('catalogue.systeme')} variant="info" />}
                                                            {m.estFacturable && <StatusBadge status="payant" label={formatPrixXAF(m.prixMensuel, t)} variant="warning" />}
                                                        </div>
                                                        {m.description && (
                                                            <p className="text-[var(--color-text-muted)] mt-0.5 truncate" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>{m.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-[var(--gap-sm)] shrink-0">
                                                    <button
                                                        onClick={() => { setEdition(m); setModalOuvert(true); }}
                                                        className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)] hover:bg-[var(--color-surface-hover)]"
                                                        title={t('catalogue.modal.modifier', { code: m.code })}
                                                    >
                                                        <Edit2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                                    </button>
                                                    {!m.estSysteme && (
                                                        <button
                                                            onClick={() => setSuppression(m)}
                                                            className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger-600)] hover:bg-[var(--color-surface-hover)]"
                                                            title={t('catalogue.confirm.supprimerLabel')}
                                                        >
                                                            <Trash2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => toggleMutation.mutate({ id: m.id, estActif: !m.estActif })}
                                                        disabled={toggleMutation.isPending}
                                                        className="p-1.5 rounded hover:bg-[var(--color-surface-hover)]"
                                                        title={m.estActif ? t('catalogue.desactiver') : t('catalogue.activer')}
                                                    >
                                                        {m.estActif ? (
                                                            <ShieldCheck className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-success-600)]" />
                                                        ) : (
                                                            <CircleOff className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-muted)]" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Panneau résolution par établissement */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="px-[var(--space-md)] py-[var(--space-sm)] flex items-center justify-between">
                    <div className="flex items-center gap-[var(--gap-sm)]">
                        <Globe className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-dominant-500)]" />
                        <span className="font-semibold text-[var(--color-text-primary)]">{t('catalogue.resolution')}</span>
                    </div>
                    <ElisaSelect
                        value={etabResolution}
                        onValueChange={setEtabResolution}
                        options={etabsOptions}
                        className="w-[clamp(160px,20vw,240px)]"
                        searchable
                    />
                </div>

                {resolutionLoading ? (
                    <div className="flex items-center justify-center py-8"><InlineSpinner size="md" /></div>
                ) : etabResolution && resolution ? (
                    <div className="border-t divide-y border-[var(--color-border)] divide-[var(--color-border)]">
                        {resolution.filter((r) => r.actif).map((r) => (
                            <div key={r.code} className="flex items-center justify-between px-[var(--space-md)] py-[var(--space-sm)]">
                                <div className="flex items-center gap-[var(--gap-xs)]">
                                    <span className="font-medium text-[var(--color-text-primary)]">{r.nom}</span>
                                    <code className="text-xs text-[var(--color-text-muted)]">{r.code}</code>
                                </div>
                                <div className="flex items-center gap-[var(--gap-xs)]">
                                    <StatusBadge status={r.categorie} /> <StatusBadge status={r.source} label={t(SOURCE_LABEL_KEYS[r.source])} variant={r.source === 'catalogue' ? 'neutral' : r.source === 'plan' ? 'info' : 'warning'} />
                                </div>
                            </div>
                        ))}
                        {resolution.filter((m) => m.actif).length === 0 && (
                            <div className="px-[var(--space-md)] py-8 text-center text-[var(--color-text-muted)]">{t('catalogue.aucunModuleActif')}</div>
                        )}
                    </div>
                ) : etabResolution ? (
                    <div className="px-[var(--space-md)] py-8 text-center text-[var(--color-text-muted)]">{t('catalogue.selectionnerEtab')}</div>
                ) : (
                    <div className="px-[var(--space-md)] py-8 text-center text-[var(--color-text-muted)]">{t('catalogue.previsualiserCascade')}</div>
                )}
            </div>

            {/* Modals */}
            <CatalogueFormModal
                open={modalOuvert}
                onOpenChange={setModalOuvert}
                entree={edition}
                onSubmit={async (data) => {
                    if (edition) await updateMutation.mutateAsync(data);
                    else await createMutation.mutateAsync(data);
                }}
            />

            <ConfirmAction
                open={!!suppression}
                onOpenChange={(o) => !o && setSuppression(null)}
                onConfirm={() => suppression && deleteMutation.mutate(suppression.id)}
                title={t('catalogue.confirm.supprimerTitre', { nom: suppression?.nom ?? '' })}
                description={t('catalogue.confirm.supprimerDesc')}
                confirmLabel={t('catalogue.confirm.supprimerLabel')}
                variant="danger"
                loading={deleteMutation.isPending}
            />
        </div>
    );
}

export const Route = createFileRoute('/platform/modules')({
    component: PlatformModulesPage,
});