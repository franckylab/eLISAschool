/**
 * ==================================
 * eLISAschool - Gestion Modules Plateforme (Page unifiée)
 * ==================================
 * Refonte SaaS v9 — Fusion Catalogue + Builder + Résolution
 *
 * 3 onglets :
 *   - Catalogue : CRUD modules (source de vérité modules_catalogue)
 *   - Builder : Import/Export/Création modules custom
 *   - Résolution : Vue résolution par établissement
 *
 * API :
 *  GET/POST/PUT/DELETE /api/platform/facturation/modules/catalogue
 *  POST /api/platform/facturation/modules/catalogue/sync
 *  GET  /api/platform/facturation/modules/catalogue/resolution?etablissementId=
 *  POST /api/platform/facturation/modules/builder/import
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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
    Wrench,
    LayoutGrid,
    ArrowLeft,
    ArrowRight,
    Save,
    Upload,
    Download,
    Package,
    Shield,
    Star,
    Check,
    Loader2,
    FileJson,
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
import { cn } from '@/lib/cn';

// =============================================
// TYPES
// =============================================

type CategorieModule = 'BASE' | 'PREMIUM' | 'ADDON';
type TabId = 'catalogue' | 'builder' | 'resolution';
type BuilderStep = 1 | 2 | 3 | 4;

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

interface ModuleFormData {
    code: string;
    nom: string;
    nomEn: string;
    description: string;
    descriptionEn: string;
    categorie: CategorieModule;
    icone: string;
    prixMensuel: number;
    prixAnnuel: number;
    estFacturable: boolean;
    estSouscriptible: boolean;
    actifParDefaut: boolean;
    planMinimal: string;
    dependencies: string;
    config: string;
    ordre: number;
}

// =============================================
// CONSTANTES UI
// =============================================

const CATEGORIES: { value: 'TOUTES' | CategorieModule; labelKey: string }[] = [
    { value: 'TOUTES', labelKey: 'catalogue.categories.toutes' },
    { value: 'BASE', labelKey: 'catalogue.categories.base' },
    { value: 'PREMIUM', labelKey: 'catalogue.categories.premium' },
    { value: 'ADDON', labelKey: 'catalogue.categories.addons' },
];

const CATEGORIE_BADGE: { [K in CategorieModule]: { labelKey: string; tone: 'info' | 'neutral' | 'warning' } } = {
    BASE: { labelKey: 'catalogue.badge.base', tone: 'info' },
    PREMIUM: { labelKey: 'catalogue.badge.premium', tone: 'neutral' },
    ADDON: { labelKey: 'catalogue.badge.addon', tone: 'warning' },
};

const SOURCE_LABEL_KEYS: Record<ModuleResolu['source'], string> = {
    catalogue: 'catalogue.source.catalogue',
    plan: 'catalogue.source.plan',
    supplement: 'catalogue.source.supplement',
};

const BUILDER_INITIAL: ModuleFormData = {
    code: '', nom: '', nomEn: '', description: '', descriptionEn: '',
    categorie: 'ADDON', icone: 'Package', prixMensuel: 0, prixAnnuel: 0,
    estFacturable: false, estSouscriptible: true, actifParDefaut: false,
    planMinimal: '', dependencies: '', config: '{}', ordre: 99,
};

const ICON_OPTIONS = [
    'Package', 'Shield', 'Star', 'Puzzle', 'BookOpen', 'Calendar',
    'CreditCard', 'Users', 'GraduationCap', 'Bus', 'Utensils',
    'FileText', 'BarChart2', 'Bell', 'Settings', 'Heart',
];

const BUILDER_STEPS: { num: BuilderStep; label: string; icon: typeof Package }[] = [
    { num: 1, label: 'Infos de base', icon: Package },
    { num: 2, label: 'Catégorie & Prix', icon: Star },
    { num: 3, label: 'Dépendances & Config', icon: Puzzle },
    { num: 4, label: 'Preview & Validation', icon: Check },
];

function formatPrixXAF(montant?: number, t?: TFunction): string {
    if (!montant) return t?.('catalogue.inclus', 'Inclus') ?? 'Inclus';
    return `${montant.toLocaleString('fr-FR')} F/mois`;
}

function safeJsonParse(str: string, fallback: any): any {
    try { return JSON.parse(str); } catch { return fallback; }
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
        try { await onSubmit(form); } finally { setSubmitting(false); }
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
                        <input value={form.code ?? ''} disabled={!!entree?.estSysteme} onChange={(e) => set('code', e.target.value)} className={fieldClass} placeholder="ex: cantine" style={{ fontSize: fs }} />
                        {entree?.estSysteme && <p className="text-[var(--color-text-muted)] mt-1" style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }}>{t('catalogue.modal.codeProtege')}</p>}
                    </div>
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.nom')}</label>
                        <input value={form.nom ?? ''} onChange={(e) => set('nom', e.target.value)} className={fieldClass} placeholder="ex. Cantine scolaire" style={{ fontSize: fs }} />
                    </div>
                </div>
                <div>
                    <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.description')}</label>
                    <textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} className={fieldClass} rows={3} style={{ fontSize: fs }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--gap-md)]">
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.categorie')}</label>
                        <ElisaSelect value={form.categorie ?? 'ADDON'} onValueChange={(v) => set('categorie', v as CategorieModule)} options={([['BASE', t('catalogue.modal.categorieBase')], ['PREMIUM', t('catalogue.modal.categoriePremium')], ['ADDON', t('catalogue.modal.categorieAddon')]] as [CategorieModule, string][]).map(([value, label]) => ({ value, label }))} className="w-full" searchable={false} aria-label="Module category" />
                    </div>
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.prixMensuel')}</label>
                        <input type="number" min={0} value={form.prixMensuel ?? 0} onChange={(e) => set('prixMensuel', Math.max(0, Number(e.target.value)))} className={fieldClass} style={{ fontSize: fs }} />
                    </div>
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.prixAnnuel')}</label>
                        <input type="number" min={0} value={form.prixAnnuel ?? 0} onChange={(e) => set('prixAnnuel', Math.max(0, Number(e.target.value)))} className={fieldClass} style={{ fontSize: fs }} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-md)]">
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.planMinimum')}</label>
                        <ElisaSelect value={form.planMinimal ?? ''} onValueChange={(v) => set('planMinimal', v || undefined)} options={[{ value: '', label: t('catalogue.modal.planAucun') }, { value: 'starter', label: 'Starter' }, { value: 'standard', label: 'Standard' }, { value: 'premium', label: 'Premium' }, { value: 'enterprise', label: 'Enterprise' }]} className="w-full" searchable={false} />
                    </div>
                    <div>
                        <label className={labelClass} style={{ fontSize: fs }}>{t('catalogue.modal.icone')}</label>
                        <input value={form.icone ?? ''} onChange={(e) => set('icone', e.target.value)} className={fieldClass} placeholder="ex. UtensilsCrossed" style={{ fontSize: fs }} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--gap-md)]">
                    <label className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-[var(--space-md)] py-[var(--space-sm)] cursor-pointer">
                        <span className="text-[var(--color-text-secondary)]" style={{ fontSize: fs }}>{t('catalogue.modal.actifDefaut')}</span>
                        <input type="checkbox" checked={form.actifParDefaut ?? false} onChange={(e) => set('actifParDefaut', e.target.checked)} className="h-[var(--icon-sm)] w-[var(--icon-sm)] accent-[var(--color-dominant-600)]" />
                    </label>
                    <label className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-[var(--space-md)] py-[var(--space-sm)] cursor-pointer">
                        <span className="text-[var(--color-text-secondary)]" style={{ fontSize: fs }}>{t('catalogue.modal.visibleCatalogue')}</span>
                        <input type="checkbox" checked={form.estActif ?? true} onChange={(e) => set('estActif', e.target.checked)} className="h-[var(--icon-sm)] w-[var(--icon-sm)] accent-[var(--color-dominant-600)]" />
                    </label>
                </div>
            </div>
        </CustomModal>
    );
}

// =============================================
// ONGLET CATALOGUE (CRUD)
// =============================================

function CatalogueTab({ catalogue, isLoading, expanded, setExpanded, recherche, setRecherche, filtreCategorie, setFiltreCategorie, modalOuvert, setModalOuvert, edition, setEdition, suppression, setSuppression, invalidate, toggleMutation, deleteMutation }: {
    catalogue: ModuleCatalogue[] | undefined;
    isLoading: boolean;
    expanded: CategorieModule | null;
    setExpanded: (v: CategorieModule | null) => void;
    recherche: string;
    setRecherche: (v: string) => void;
    filtreCategorie: 'TOUTES' | CategorieModule;
    setFiltreCategorie: (v: 'TOUTES' | CategorieModule) => void;
    modalOuvert: boolean;
    setModalOuvert: (v: boolean) => void;
    edition: ModuleCatalogue | null;
    setEdition: (v: ModuleCatalogue | null) => void;
    suppression: ModuleCatalogue | null;
    setSuppression: (v: ModuleCatalogue | null) => void;
    invalidate: () => void;
    toggleMutation: any;
    deleteMutation: any;
}) {
    const { t } = useTranslation('admin');

    const parCategorie: Record<CategorieModule, ModuleCatalogue[]> = { BASE: [], PREMIUM: [], ADDON: [] };
    for (const m of catalogue ?? []) parCategorie[m.categorie]?.push(m);

    if (catalogue && expanded && !parCategorie[expanded as CategorieModule]?.length) {
        const first = (Object.keys(parCategorie) as CategorieModule[]).find((c) => parCategorie[c].length > 0);
        if (first) setExpanded(first);
    }

    const total = catalogue?.length ?? 0;
    const base = parCategorie.BASE.length;
    const payants = (catalogue ?? []).filter((m) => m.estFacturable).length;
    const actifsDefaut = (catalogue ?? []).filter((m) => m.actifParDefaut).length;
    const badgeVariant = (m: ModuleCatalogue) => m.estActif ? 'success' as const : 'warning' as const;

    return (
        <div className="space-y-[var(--space-lg)]">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--gap-md)]">
                <PlatformStatCard label={t('catalogue.totalModules')} value={total} icon={<Boxes className="h-[var(--icon-md)] w-[var(--icon-md)]" />} loading={isLoading} />
                <PlatformStatCard label={t('catalogue.baseGratuits')} value={base} tone="info" icon={<ShieldCheck className="h-[var(--icon-md)] w-[var(--icon-md)]" />} loading={isLoading} />
                <PlatformStatCard label={t('catalogue.facturables')} value={payants} tone="warning" icon={<Layers className="h-[var(--icon-md)] w-[var(--icon-md)]" />} loading={isLoading} />
                <PlatformStatCard label={t('catalogue.actifsDefaut')} value={actifsDefaut} tone="success" icon={<CheckCircle2 className="h-[var(--icon-md)] w-[var(--icon-md)]" />} loading={isLoading} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-[var(--gap-md)] items-start md:items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-[var(--space-md)] top-1/2 -translate-y-1/2 h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-muted)]" />
                    <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t('catalogue.rechercher')} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-[var(--space-md)] py-[var(--space-sm)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-300)] focus:outline-none" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }} />
                </div>
                <ElisaSelect value={filtreCategorie} onValueChange={(v) => setFiltreCategorie(v as 'TOUTES' | CategorieModule)} options={CATEGORIES.map((c) => ({ value: c.value, label: t(c.labelKey) }))} className="w-[clamp(160px,20vw,240px)]" searchable={false} />
            </div>

            {/* Liste par catégorie */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16"><InlineSpinner size="lg" label={t('catalogue.chargement')} /></div>
            ) : total === 0 ? (
                <EmptyState icon={<Boxes className="h-10 w-10" />} title={t('catalogue.aucunModule')} description={t('catalogue.aucunModuleDesc')} />
            ) : (
                <div className="space-y-[var(--gap-md)]">
                    {(['BASE', 'PREMIUM', 'ADDON'] as CategorieModule[]).map((cat) => {
                        const mods = parCategorie[cat];
                        if (!mods.length) return null;
                        const badge = CATEGORIE_BADGE[cat];
                        const estOuvert = expanded === cat;
                        return (
                            <div key={cat} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                                <button onClick={() => setExpanded(estOuvert ? null : cat)} className="w-full flex items-center justify-between px-[var(--space-md)] py-[var(--space-sm)] hover:bg-[var(--color-surface-hover)] transition-colors">
                                    <div className="flex items-center gap-[var(--gap-sm)]">
                                        {estOuvert ? <ChevronDown className="h-[var(--icon-sm)] w-[var(--icon-sm)]" /> : <ChevronRight className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                        <span className="font-semibold text-[var(--color-text-primary)]">{t(badge.labelKey)}s</span>
                                        <span className="text-xs text-[var(--color-text-muted)]">({mods.length})</span>
                                    </div>
                                    <span className="text-[var(--color-text-muted)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)' }}>{t('catalogue.payants', { count: mods.filter((m) => m.estFacturable).length })}</span>
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
                                                        {m.description && <p className="text-[var(--color-text-muted)] mt-0.5 truncate" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>{m.description}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-[var(--gap-sm)] shrink-0">
                                                    <button onClick={() => { setEdition(m); setModalOuvert(true); }} className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)] hover:bg-[var(--color-surface-hover)]" title={t('catalogue.modal.modifier', { code: m.code })}><Edit2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" /></button>
                                                    {!m.estSysteme && <button onClick={() => setSuppression(m)} className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-danger-600)] hover:bg-[var(--color-surface-hover)]" title={t('catalogue.confirm.supprimerLabel')}><Trash2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" /></button>}
                                                    <button onClick={() => toggleMutation.mutate({ id: m.id, estActif: !m.estActif })} disabled={toggleMutation.isPending} className="p-1.5 rounded hover:bg-[var(--color-surface-hover)]" title={m.estActif ? t('catalogue.desactiver') : t('catalogue.activer')}>
                                                        {m.estActif ? <ShieldCheck className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-success-600)]" /> : <CircleOff className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-muted)]" />}
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
        </div>
    );
}

// =============================================
// ONGLET BUILDER (Import/Export/Création)
// =============================================

function BuilderTab() {
    const queryClient = useQueryClient();
    const [step, setStep] = useState<BuilderStep>(1);
    const [form, setForm] = useState<ModuleFormData>(BUILDER_INITIAL);
    const [errors, setErrors] = useState<Partial<Record<keyof ModuleFormData, string>>>({});

    const { data: catalogue } = useQuery({
        queryKey: ['platform-modules-catalogue'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: any[] }>('/api/platform/facturation/modules/catalogue');
            return res.data?.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: ModuleFormData) => {
            const payload = {
                ...data,
                dependencies: data.dependencies ? data.dependencies.split(',').map((d) => d.trim()).filter(Boolean) : [],
                config: safeJsonParse(data.config, {}),
                planMinimal: data.planMinimal || null,
            };
            const res = await apiClient.post<{ data: any }>('/api/platform/facturation/modules/builder/import', payload);
            return res.data?.data;
        },
        onSuccess: () => {
            toast.success('Module créé avec succès');
            queryClient.invalidateQueries({ queryKey: ['platform-modules-catalogue'] });
            queryClient.invalidateQueries({ queryKey: ['modules-catalogue'] });
            setForm(BUILDER_INITIAL);
            setStep(1);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur lors de la création'),
    });

    const updateForm = useCallback(<K extends keyof ModuleFormData>(key: K, value: ModuleFormData[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    }, []);

    const handleCategorieChange = (cat: CategorieModule) => {
        updateForm('categorie', cat);
        if (cat === 'BASE') { updateForm('estFacturable', false); updateForm('actifParDefaut', true); }
    };

    const validateStep = (s: BuilderStep): boolean => {
        const newErrors: typeof errors = {};
        if (s === 1) {
            if (!form.code.trim()) newErrors.code = 'Code requis';
            if (!form.nom.trim()) newErrors.nom = 'Nom requis';
            if (form.code && !/^[a-z0-9_-]+$/.test(form.code)) newErrors.code = 'Code : minuscules, chiffres, tirets uniquement';
        }
        if (s === 2) { if (form.prixMensuel < 0) newErrors.prixMensuel = 'Prix invalide'; if (form.prixAnnuel < 0) newErrors.prixAnnuel = 'Prix invalide'; }
        if (s === 3) { try { JSON.parse(form.config); } catch { newErrors.config = 'JSON invalide'; } }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, 4) as BuilderStep); };
    const prevStep = () => setStep((s) => Math.max(s - 1, 1) as BuilderStep);

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const json = JSON.parse(await file.text());
                setForm({
                    code: json.code || '', nom: json.nom || '', nomEn: json.nomEn || '',
                    description: json.description || '', descriptionEn: json.descriptionEn || '',
                    categorie: json.categorie || 'ADDON', icone: json.icone || 'Package',
                    prixMensuel: json.prixMensuel || 0, prixAnnuel: json.prixAnnuel || 0,
                    estFacturable: json.estFacturable ?? false, estSouscriptible: json.estSouscriptible ?? true,
                    actifParDefaut: json.actifParDefaut ?? false, planMinimal: json.planMinimal || '',
                    dependencies: Array.isArray(json.dependencies) ? json.dependencies.join(', ') : '',
                    config: json.config ? JSON.stringify(json.config, null, 2) : '{}', ordre: json.ordre ?? 99,
                });
                toast.success('JSON importé'); setStep(1);
            } catch { toast.error('Fichier JSON invalide'); }
        };
        input.click();
    };

    const exportJson = () => {
        const data = {
            code: form.code, nom: form.nom, nomEn: form.nomEn, description: form.description,
            categorie: form.categorie, icone: form.icone, prixMensuel: form.prixMensuel, prixAnnuel: form.prixAnnuel,
            estFacturable: form.estFacturable, estSouscriptible: form.estSouscriptible, actifParDefaut: form.actifParDefaut,
            planMinimal: form.planMinimal || null,
            dependencies: form.dependencies ? form.dependencies.split(',').map(d => d.trim()).filter(Boolean) : [],
            config: safeJsonParse(form.config, {}), ordre: form.ordre,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `module-${form.code || 'export'}.json`; a.click();
        URL.revokeObjectURL(url);
    };

    const handleSubmit = () => { if (validateStep(1) && validateStep(2) && validateStep(3)) createMutation.mutate(form); };

    const categorieIcon = { BASE: Shield, PREMIUM: Star, ADDON: Puzzle };
    const CatIcon = categorieIcon[form.categorie] || Package;
    const inputCls = 'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-zinc-500 focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-500)]';

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Toolbar Import/Export */}
            <div className="flex justify-end gap-2">
                <ElisaButton variant="outline" size="sm" onClick={handleImport}><Upload className="mr-2 h-4 w-4" />Import JSON</ElisaButton>
                <ElisaButton variant="outline" size="sm" onClick={exportJson}><Download className="mr-2 h-4 w-4" />Export</ElisaButton>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between">
                {BUILDER_STEPS.map((s, i) => {
                    const StepIcon = s.icon;
                    const isActive = step === s.num;
                    const isDone = step > s.num;
                    return (
                        <div key={s.num} className="flex items-center">
                            {i > 0 && <div className={`mx-2 h-px w-8 sm:w-16 ${isDone ? 'bg-emerald-500' : 'bg-zinc-700'}`} />}
                            <button onClick={() => { if (s.num < step) setStep(s.num); }} className={cn('flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors', isActive ? 'bg-[var(--color-dominant-600)] text-white' : isDone ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-800 text-zinc-500')}>
                                <StepIcon size={14} />
                                <span className="hidden sm:inline">{s.label}</span>
                                <span className="sm:hidden">{s.num}</span>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Form */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                {/* Step 1 */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Infos de base</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Code *</label>
                                <input type="text" value={form.code} onChange={(e) => updateForm('code', e.target.value)} placeholder="ex: comptabilite" className={inputCls} />
                                {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Nom *</label>
                                <input type="text" value={form.nom} onChange={(e) => updateForm('nom', e.target.value)} placeholder="ex: Comptabilité" className={inputCls} />
                                {errors.nom && <p className="mt-1 text-xs text-red-500">{errors.nom}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Nom (EN)</label>
                            <input type="text" value={form.nomEn} onChange={(e) => updateForm('nomEn', e.target.value)} placeholder="ex: Accounting" className={inputCls} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Description</label>
                            <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={3} placeholder="Description du module..." className={inputCls} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Icône</label>
                            <div className="flex flex-wrap gap-2">
                                {ICON_OPTIONS.map((iconName) => (
                                    <button key={iconName} onClick={() => updateForm('icone', iconName)} className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors', form.icone === iconName ? 'border-[var(--color-dominant-500)] bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-zinc-500')}>
                                        <Package size={12} />{iconName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Catégorie & Pricing</h2>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">Catégorie</label>
                            <div className="flex gap-3">
                                {(['BASE', 'PREMIUM', 'ADDON'] as CategorieModule[]).map((cat) => {
                                    const Icon = categorieIcon[cat];
                                    return (
                                        <button key={cat} onClick={() => handleCategorieChange(cat)} className={cn('flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all', form.categorie === cat ? cat === 'BASE' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : cat === 'PREMIUM' ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-zinc-500')}>
                                            <Icon size={16} />{cat}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Prix mensuel (XAF)</label>
                                <input type="number" value={form.prixMensuel} onChange={(e) => updateForm('prixMensuel', parseInt(e.target.value) || 0)} min={0} className={inputCls} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Prix annuel (XAF)</label>
                                <input type="number" value={form.prixAnnuel} onChange={(e) => updateForm('prixAnnuel', parseInt(e.target.value) || 0)} min={0} className={inputCls} />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><input type="checkbox" checked={form.estFacturable} onChange={(e) => updateForm('estFacturable', e.target.checked)} disabled={form.categorie === 'BASE'} className="rounded border-[var(--color-border)]" />Facturable</label>
                            <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><input type="checkbox" checked={form.estSouscriptible} onChange={(e) => updateForm('estSouscriptible', e.target.checked)} className="rounded border-[var(--color-border)]" />Souscriptible</label>
                            <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><input type="checkbox" checked={form.actifParDefaut} onChange={(e) => updateForm('actifParDefaut', e.target.checked)} className="rounded border-[var(--color-border)]" />Actif par défaut</label>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Plan minimal requis</label>
                            <select value={form.planMinimal} onChange={(e) => updateForm('planMinimal', e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-dominant-500)] focus:outline-none">
                                <option value="">Aucun</option><option value="starter">Starter</option><option value="standard">Standard</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Dépendances & Configuration</h2>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Dépendances (codes séparés par des virgules)</label>
                            <input type="text" value={form.dependencies} onChange={(e) => updateForm('dependencies', e.target.value)} placeholder="ex: finances, comptabilite" className={inputCls} />
                            {(catalogue?.length ?? 0) > 0 && <p className="mt-1 text-xs text-[var(--color-text-muted)]">Modules existants : {catalogue?.map((m: any) => m.code).join(', ')}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Configuration JSON</label>
                            <textarea value={form.config} onChange={(e) => updateForm('config', e.target.value)} rows={8} spellCheck={false} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 font-mono text-xs text-[var(--color-text-primary)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-500)]" />
                            {errors.config && <p className="mt-1 text-xs text-red-500">{errors.config}</p>}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">Ordre d'affichage</label>
                            <input type="number" value={form.ordre} onChange={(e) => updateForm('ordre', parseInt(e.target.value) || 0)} min={0} className="w-32 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-500)]" />
                        </div>
                    </div>
                )}

                {/* Step 4 */}
                {step === 4 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Preview & Validation</h2>
                        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: form.categorie === 'BASE' ? 'rgba(16,185,129,0.1)' : form.categorie === 'PREMIUM' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)' }}>
                                    <CatIcon size={24} style={{ color: form.categorie === 'BASE' ? '#10b981' : form.categorie === 'PREMIUM' ? '#f59e0b' : '#3b82f6' }} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-[var(--color-text-primary)]">{form.nom || '—'}</h3>
                                    <p className="text-xs text-[var(--color-text-muted)]">Code: {form.code || '—'}</p>
                                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{form.description || 'Pas de description'}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', form.categorie === 'BASE' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : form.categorie === 'PREMIUM' ? 'border-amber-500/30 text-amber-600 dark:text-amber-400' : 'border-sky-500/30 text-sky-600 dark:text-sky-400')}>{form.categorie}</span>
                                        {form.estFacturable && <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-xs text-zinc-400">{form.prixMensuel} XAF/mois</span>}
                                        {form.actifParDefaut && <span className="rounded-full border border-emerald-500/30 px-2 py-0.5 text-xs text-emerald-500">Actif par défaut</span>}
                                        {form.planMinimal && <span className="rounded-full border border-amber-500/30 px-2 py-0.5 text-xs text-amber-500">Plan min: {form.planMinimal}</span>}
                                    </div>
                                    {form.dependencies && <p className="mt-2 text-xs text-[var(--color-text-muted)]">Dépendances: {form.dependencies}</p>}
                                </div>
                            </div>
                        </div>
                        <details className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                            <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)]"><FileJson className="mr-2 inline h-4 w-4" />Voir JSON</summary>
                            <pre className="overflow-x-auto px-4 pb-4 text-xs text-[var(--color-text-muted)]">{JSON.stringify({ code: form.code, nom: form.nom, categorie: form.categorie, icone: form.icone, prixMensuel: form.prixMensuel, prixAnnuel: form.prixAnnuel, estFacturable: form.estFacturable, dependencies: form.dependencies ? form.dependencies.split(',').map(d => d.trim()).filter(Boolean) : [] }, null, 2)}</pre>
                        </details>
                    </div>
                )}

                {/* Navigation buttons */}
                <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                    <ElisaButton variant="outline" size="sm" onClick={prevStep} disabled={step === 1}><ArrowLeft className="mr-2 h-4 w-4" />Précédent</ElisaButton>
                    {step < 4 ? (
                        <ElisaButton size="sm" onClick={nextStep}>Suivant<ArrowRight className="ml-2 h-4 w-4" /></ElisaButton>
                    ) : (
                        <ElisaButton size="sm" onClick={handleSubmit} disabled={createMutation.isPending}>
                            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Créer le module
                        </ElisaButton>
                    )}
                </div>
            </div>
        </div>
    );
}

// =============================================
// ONGLET RÉSOLUTION
// =============================================

function ResolutionTab({ etabResolution, setEtabResolution }: { etabResolution: string; setEtabResolution: (v: string) => void }) {
    const { t } = useTranslation('admin');

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
            const res = await apiClient.get<ModuleResolu[]>('/api/platform/facturation/modules/catalogue/resolution', { etablissementId: etabResolution });
            return res.data ?? [];
        },
        enabled: !!etabResolution,
    });

    const etabsOptions = (etablissements ?? []).map((e) => ({ value: e.id, label: e.nom }));

    return (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="px-[var(--space-md)] py-[var(--space-sm)] flex items-center justify-between">
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <Globe className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-dominant-500)]" />
                    <span className="font-semibold text-[var(--color-text-primary)]">{t('catalogue.resolution')}</span>
                </div>
                <ElisaSelect value={etabResolution} onValueChange={setEtabResolution} options={etabsOptions} className="w-[clamp(160px,20vw,240px)]" searchable />
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
                    {resolution.filter((m) => m.actif).length === 0 && <div className="px-[var(--space-md)] py-8 text-center text-[var(--color-text-muted)]">{t('catalogue.aucunModuleActif')}</div>}
                </div>
            ) : etabResolution ? (
                <div className="px-[var(--space-md)] py-8 text-center text-[var(--color-text-muted)]">{t('catalogue.selectionnerEtab')}</div>
            ) : (
                <div className="px-[var(--space-md)] py-8 text-center text-[var(--color-text-muted)]">{t('catalogue.previsualiserCascade')}</div>
            )}
        </div>
    );
}

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

function PlatformModulesPage() {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabId>('catalogue');

    // Catalogue state
    const [expanded, setExpanded] = useState<CategorieModule | null>('BASE');
    const [recherche, setRecherche] = useState('');
    const [filtreCategorie, setFiltreCategorie] = useState<'TOUTES' | CategorieModule>('TOUTES');
    const [modalOuvert, setModalOuvert] = useState(false);
    const [edition, setEdition] = useState<ModuleCatalogue | null>(null);
    const [suppression, setSuppression] = useState<ModuleCatalogue | null>(null);

    // Resolution state
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

    // ------- Mutations -------
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['modules-catalogue'] });

    const createMutation = useMutation({
        mutationFn: async (data: Partial<ModuleCatalogue>) => apiClient.post('/api/platform/facturation/modules/catalogue', data),
        onSuccess: () => { toast.success(t('catalogue.toast.cree')); setModalOuvert(false); invalidate(); },
        onError: (e: Error) => toast.error(e.message || t('catalogue.toast.erreurCreation')),
    });

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<ModuleCatalogue>) => apiClient.put(`/api/platform/facturation/modules/catalogue/${edition?.id}`, data),
        onSuccess: () => { toast.success(t('catalogue.toast.misAJour')); setModalOuvert(false); invalidate(); },
        onError: (e: Error) => toast.error(e.message || t('catalogue.toast.erreurMaj')),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => apiClient.delete(`/api/platform/facturation/modules/catalogue/${id}`),
        onSuccess: () => { toast.success(t('catalogue.toast.supprime')); setSuppression(null); invalidate(); },
        onError: (e: Error) => toast.error(e.message || t('catalogue.toast.erreurSuppression')),
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, estActif }: { id: string; estActif: boolean }) => apiClient.put(`/api/platform/facturation/modules/catalogue/${id}`, { estActif }),
        onSuccess: () => { toast.success(t('catalogue.toast.toggle')); invalidate(); },
        onError: (e: Error) => toast.error(e.message || t('catalogue.toast.erreurToggle')),
    });

    const syncMutation = useMutation({
        mutationFn: async () => apiClient.post<{ total: number }>('/api/platform/facturation/modules/catalogue/sync'),
        onSuccess: (res) => { toast.success(t('catalogue.toast.sync', { count: res.data?.total ?? 0 })); invalidate(); },
        onError: (e: Error) => toast.error(e.message || t('catalogue.toast.erreurSync')),
    });

    const tabs: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
        { id: 'catalogue', label: t('catalogue.titre', 'Catalogue'), icon: LayoutGrid },
        { id: 'builder', label: 'Builder', icon: Wrench },
        { id: 'resolution', label: t('catalogue.resolution', 'Résolution'), icon: Globe },
    ];

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
                    {activeTab === 'catalogue' && (
                        <ElisaButton variant="primary" onClick={() => { setEdition(null); setModalOuvert(true); }}>
                            <Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" /> {t('catalogue.nouveauModule')}
                        </ElisaButton>
                    )}
                </div>
            </div>

            {/* Onglets */}
            <div className="flex items-center gap-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-1 w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                                activeTab === tab.id
                                    ? 'bg-[var(--color-dominant-600)] text-white shadow-sm'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]',
                            )}
                        >
                            <Icon size={16} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Contenu des onglets */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                    {activeTab === 'catalogue' && (
                        <CatalogueTab
                            catalogue={catalogue} isLoading={isLoading}
                            expanded={expanded} setExpanded={setExpanded}
                            recherche={recherche} setRecherche={setRecherche}
                            filtreCategorie={filtreCategorie} setFiltreCategorie={setFiltreCategorie}
                            modalOuvert={modalOuvert} setModalOuvert={setModalOuvert}
                            edition={edition} setEdition={setEdition}
                            suppression={suppression} setSuppression={setSuppression}
                            invalidate={invalidate} toggleMutation={toggleMutation} deleteMutation={deleteMutation}
                        />
                    )}
                    {activeTab === 'builder' && <BuilderTab />}
                    {activeTab === 'resolution' && <ResolutionTab etabResolution={etabResolution} setEtabResolution={setEtabResolution} />}
                </motion.div>
            </AnimatePresence>

            {/* Modals (Catalogue) */}
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
