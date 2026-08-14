/**
 * ==================================
 * eLISAschool - Dashboard CMS V2
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Dashboard enrichi avec vue d'ensemble de toutes les fonctionnalités CMS V2.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@tanstack/react-router';
import { useCmsPages, useCmsThemes, useCmsMenus, useCreerPage, useSupprimerPage, usePublierPage, useResetCms } from '../hooks/use-cms-admin';
import { useCmsActualites, useCmsTemoignages, useCmsEvenements, useCmsPartenaires, useCmsNewsletter } from '../hooks/use-cms-admin';
import { StatutPage, TemplatePage } from '../types/cms.types';
import type { CmsPage } from '../types/cms.types';
import {
    Plus, FileText, Palette, Menu, Layout, Eye, Edit3, Trash2, Globe,
    RefreshCw, AlertTriangle, Check, ChevronRight, Image, GitBranch,
    Layers, Newspaper, MessageSquareQuote, Calendar, Handshake, Mail,
    Sparkles, Zap, Code, Download, Search as SearchIcon, Monitor,
    BarChart3, MousePointerClick, Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CustomModal } from '@/components/modals';

export function CmsDashboard() {
    const { t } = useTranslation('cms');
    const navigate = useNavigate();
    const [showCreerPage, setShowCreerPage] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [pageASupprimer, setPageASupprimer] = useState<string | null>(null);
    const [resetStep, setResetStep] = useState(1);
    const [resetOptions, setResetOptions] = useState({ conserverMedias: true, inclureDemo: true });
    const [confirmText, setConfirmText] = useState('');
    const [resetProgress, setResetProgress] = useState('');
    
    // Données principales
    const { data: pages, isLoading } = useCmsPages();
    const { data: themes } = useCmsThemes();
    const { data: menus } = useCmsMenus();
    const creerPage = useCreerPage();
    const supprimerPage = useSupprimerPage();
    const publierPage = usePublierPage();
    const resetCms = useResetCms();

    // Contenu dynamique
    const { data: actualites } = useCmsActualites();
    const { data: temoignages } = useCmsTemoignages();
    const { data: evenements } = useCmsEvenements();
    const { data: partenaires } = useCmsPartenaires();
    const { data: newsletter } = useCmsNewsletter();

    const themeActif = themes?.find(t => t.actif);
    const pagesPubliees = pages?.filter(p => p.statut === StatutPage.PUBLIE).length || 0;
    const totalSections = pages?.reduce((acc, p) => acc + (p.sections?.length || 0), 0) || 0;

    const handleCreerPage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = {
            titre: (form.elements.namedItem('titre') as HTMLInputElement).value,
            slug: (form.elements.namedItem('slug') as HTMLInputElement).value,
            template: (form.elements.namedItem('template') as HTMLSelectElement).value as TemplatePage,
        };
        try {
            const result = await creerPage.mutateAsync(data);
            toast.success(t('pageCreee'));
            setShowCreerPage(false);
            // Naviguer vers l'éditeur après création
            if (result?.data?.id) {
                navigate({ to: '/cms/pages/$id', params: { id: result.data.id } });
            }
        } catch {
            toast.error(t('erreurCreation'));
        }
    };

    const handlePublier = async (id: string) => {
        try {
            await publierPage.mutateAsync(id);
            toast.success(t('pagePubliee'));
        } catch {
            toast.error(t('erreurPublication'));
        }
    };

    const handleSupprimer = async (id: string) => {
        setPageASupprimer(id);
    };

    const confirmerSuppression = async () => {
        if (!pageASupprimer) return;
        try {
            await supprimerPage.mutateAsync(pageASupprimer);
            toast.success(t('pageSupprimee'));
        } catch {
            toast.error(t('erreurSuppression'));
        } finally {
            setPageASupprimer(null);
        }
    };

    const statutBadge = (statut: StatutPage) => {
        const config = {
            [StatutPage.PUBLIE]: { label: t('publie'), color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            [StatutPage.BROUILLON]: { label: t('brouillon'), color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
            [StatutPage.ARCHIVE]: { label: t('archive'), color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        };
        const c = config[statut] || config[StatutPage.BROUILLON];
        return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.color}`}>{c.label}</span>;
    };

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{t('titre')}</h1>
                        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            <Sparkles className="h-3 w-3" />
                            V2
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t('description')} — 28 composants, contenu dynamique, SEO, animations
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setShowResetModal(true); setResetStep(1); }}
                        className="inline-flex items-center gap-2 rounded-lg border border-orange-500/20 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        title={t('reinitialiserTitle')}
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('reinitialiser')}</span>
                    </button>
                    <button
                        onClick={() => setShowCreerPage(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        {t('nouvellePage')}
                    </button>
                </div>
            </div>

            {/* Stats principales */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<FileText className="h-5 w-5" />} label={t('pages')} value={pages?.length || 0} sub={`${pagesPubliees} publiées`} />
                <StatCard icon={<Layout className="h-5 w-5" />} label="Sections" value={totalSections} sub="dans toutes les pages" />
                <StatCard icon={<Palette className="h-5 w-5" />} label={t('themeActif')} value={themeActif?.nom || t('aucun')} sub={`${themes?.length || 0} thèmes`} />
                <StatCard icon={<Menu className="h-5 w-5" />} label={t('menus')} value={menus?.length || 0} sub="navigation" />
            </div>

            {/* Contenu dynamique — Stats */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Contenu Dynamique</h2>
                    <Link to="/cms/contenu" className="flex items-center gap-1 text-sm text-primary hover:underline">
                        Gérer <ChevronRight className="h-3 w-3" />
                    </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <QuickStatCard
                        icon={<Newspaper className="h-4 w-4" />}
                        label="Actualités"
                        value={actualites?.length || 0}
                        to="/cms/contenu"
                        color="blue"
                    />
                    <QuickStatCard
                        icon={<MessageSquareQuote className="h-4 w-4" />}
                        label="Témoignages"
                        value={temoignages?.length || 0}
                        to="/cms/contenu"
                        color="violet"
                    />
                    <QuickStatCard
                        icon={<Calendar className="h-4 w-4" />}
                        label="Événements"
                        value={evenements?.length || 0}
                        to="/cms/contenu"
                        color="emerald"
                    />
                    <QuickStatCard
                        icon={<Handshake className="h-4 w-4" />}
                        label="Partenaires"
                        value={partenaires?.length || 0}
                        to="/cms/contenu"
                        color="teal"
                    />
                    <QuickStatCard
                        icon={<Mail className="h-4 w-4" />}
                        label="Newsletter"
                        value={newsletter?.length || 0}
                        to="/cms/contenu"
                        color="amber"
                    />
                </div>
            </div>

            {/* Fonctionnalités CMS V2 */}
            <div>
                <h2 className="mb-4 text-lg font-semibold">Fonctionnalités CMS V2</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        icon={<Zap className="h-5 w-5" />}
                        title="28 Composants Puck"
                        description="Hero, Carousel, Timeline, Tabs, Newsletter, Compteurs animés, Galerie Masonry..."
                        color="purple"
                    />
                    <FeatureCard
                        icon={<SearchIcon className="h-5 w-5" />}
                        title="SEO & Preview"
                        description="Score SEO en temps réel, aperçu Google, meta tags, Open Graph"
                        color="blue"
                    />
                    <FeatureCard
                        icon={<Monitor className="h-5 w-5" />}
                        title="Preview Responsive"
                        description="6 tailles d'écran (320px → plein), zoom 25-200%"
                        color="green"
                    />
                    <FeatureCard
                        icon={<Download className="h-5 w-5" />}
                        title="Export / Import JSON"
                        description="Exportez vos pages en JSON, importez-les sur un autre établissement"
                        color="orange"
                    />
                    <FeatureCard
                        icon={<Type className="h-5 w-5" />}
                        title="Éditeur de Styles"
                        description="Boutons, typographie, arrière-plans, espacements, bordures, ombres"
                        color="pink"
                    />
                    <FeatureCard
                        icon={<Code className="h-5 w-5" />}
                        title="Code Editor Monaco"
                        description="Éditeur HTML/CSS/JS avec coloration syntaxique et autocomplétion"
                        color="cyan"
                    />
                    <FeatureCard
                        icon={<MousePointerClick className="h-5 w-5" />}
                        title="Animations Avancées"
                        description="15 variantes, 7 easings, 6 effets hover, presets (hero, card, stats...)"
                        color="indigo"
                    />
                    <FeatureCard
                        icon={<BarChart3 className="h-5 w-5" />}
                        title="Data Binding"
                        description="Variables dynamiques {{etablissement.nom}}, {{eleve.prenom}}..."
                        color="rose"
                    />
                    <FeatureCard
                        icon={<GitBranch className="h-5 w-5" />}
                        title="Versioning & Historique"
                        description="Snapshot automatique, rollback, protection contre édition concurrente"
                        color="slate"
                    />
                </div>
            </div>

            {/* Liste des pages */}
            <div className="rounded-xl border bg-card">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="font-semibold">{t('toutesLesPages')}</h2>
                    <span className="text-sm text-muted-foreground">{pages?.length || 0} pages</span>
                </div>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                    </div>
                ) : !pages?.length ? (
                    <div className="py-12 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-4 text-sm text-muted-foreground">{t('aucunePage')}</p>
                        <button
                            onClick={() => setShowCreerPage(true)}
                            className="mt-4 text-sm text-primary hover:underline"
                        >
                            {t('creerPremierePage')}
                        </button>
                    </div>
                ) : (
                    <div className="divide-y">
                        {pages.slice(0, 10).map((page) => (
                            <div key={page.id} className="flex items-center justify-between px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium">{page.titre}</h3>
                                            {statutBadge(page.statut)}
                                            {page.estPageAccueil && (
                                                <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                    {t('accueil')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>{`/e/{{code}}/${page.slug}`}</span>
                                            <span>•</span>
                                            <span>{page.sections?.length || 0} sections</span>
                                            <span>•</span>
                                            <span>{page.template}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {page.statut !== StatutPage.PUBLIE && (
                                        <button
                                            onClick={() => handlePublier(page.id)}
                                            className="rounded-lg p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                            title={t('publier')}
                                        >
                                            <Globe className="h-4 w-4" />
                                        </button>
                                    )}
                                    <Link
                                        to="/cms/pages/$id"
                                        params={{ id: page.id }}
                                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        title="Éditer"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleSupprimer(page.id)}
                                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        title={t('supprimer')}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(pages?.length ?? 0) > 10 && (
                            <div className="border-t px-6 py-3 text-center">
                                <Link to="/cms/pages" className="text-sm text-primary hover:underline">
                                    Voir toutes les pages ({pages?.length}) <ChevronRight className="inline h-3 w-3" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation rapide */}
            <div>
                <h2 className="mb-4 text-lg font-semibold">Navigation Rapide</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <QuickLink to="/cms/medias" icon={<Image className="h-5 w-5" />} title="Médiathèque" desc="Images, vidéos, documents" />
                    <QuickLink to="/cms/themes" icon={<Palette className="h-5 w-5" />} title="Thèmes" desc="Couleurs, typographie" />
                    <QuickLink to="/cms/templates" icon={<Layers className="h-5 w-5" />} title="Templates" desc="10 modèles prêts" />
                    <QuickLink to="/cms/versions" icon={<GitBranch className="h-5 w-5" />} title="Historique" desc="Versions & rollback" />
                </div>
            </div>

            {/* Modal création page */}
            <CustomModal
                open={showCreerPage}
                onOpenChange={(v) => { if (!v) setShowCreerPage(false); }}
                title={t('modal.titre')}
                description="Créez une nouvelle page pour votre site public"
                size="md"
                footer={<>
                    <button type="button" onClick={() => setShowCreerPage(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">{t('modal.annuler')}</button>
                    <button type="submit" form="form-creer-page-dashboard" disabled={creerPage.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                        {creerPage.isPending ? t('modal.creation') : t('modal.creer')}
                    </button>
                </>}
            >
                <form id="form-creer-page-dashboard" onSubmit={handleCreerPage} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium">{t('modal.titreLabel')}</label>
                        <input
                            name="titre"
                            required
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            placeholder={t('modal.titrePlaceholder')}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">{t('modal.slugLabel')}</label>
                        <input
                            name="slug"
                            required
                            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            placeholder={t('modal.slugPlaceholder')}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">{t('modal.templateLabel')}</label>
                        <select
                            name="template"
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value={TemplatePage.PAGE_VIERGE}>{t('modal.templates.pageVierge')}</option>
                            <option value={TemplatePage.ACCUEIL}>{t('modal.templates.accueil')}</option>
                            <option value={TemplatePage.CONTACT}>{t('modal.templates.contact')}</option>
                            <option value={TemplatePage.GALERIE}>{t('modal.templates.galerie')}</option>
                            <option value={TemplatePage.ACTUALITES}>{t('modal.templates.actualites')}</option>
                            <option value={TemplatePage.INSCRIPTIONS}>{t('modal.templates.inscriptions')}</option>
                            <option value={TemplatePage.MENTIONS_LEGALES}>{t('modal.templates.mentionsLegales')}</option>
                        </select>
                    </div>
                </form>
            </CustomModal>

            {/* Modal réinitialisation multi-étapes */}
            {showResetModal && (
                <>
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(8px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .animate-fadeIn {
                            animation: fadeIn 0.3s ease-out;
                        }
                    `}</style>
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-card shadow-xl">
                        <div className="border-b px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                    <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">{t('reset.titre')}</h2>
                                    <p className="text-xs text-muted-foreground">{t('reset.etape', { step: resetStep })}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex gap-1">
                                {[1, 2, 3].map((step) => (
                                    <div
                                        key={step}
                                        className={`h-1 flex-1 rounded-full transition-colors ${
                                            step <= resetStep ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="px-6 py-5">
                            {resetStep === 1 && (
                                <div className="animate-fadeIn space-y-4">
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                                            <div>
                                                <p className="font-medium text-red-800 dark:text-red-300">{t('reset.attention')}</p>
                                                <p className="text-sm text-red-700 dark:text-red-400">{t('reset.warning')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="mb-3 text-sm font-medium">{t('reset.elementsSupprimes')}</p>
                                        <div className="space-y-2">
                                            <ResetItem icon={<FileText className="h-4 w-4" />} label={t('reset.pages')} count={pages?.length || 0} />
                                            <ResetItem icon={<Layout className="h-4 w-4" />} label={t('reset.sections')} count={totalSections || '—'} />
                                            <ResetItem icon={<Palette className="h-4 w-4" />} label={t('reset.themes')} count={themes?.length || 0} />
                                            <ResetItem icon={<Menu className="h-4 w-4" />} label={t('reset.menus')} count={menus?.length || 0} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {resetStep === 2 && (
                                <div className="animate-fadeIn space-y-5">
                                    <p className="text-sm text-muted-foreground">{t('reset.options')}</p>
                                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <input
                                            type="checkbox"
                                            checked={resetOptions.inclureDemo}
                                            onChange={(e) => setResetOptions(prev => ({ ...prev, inclureDemo: e.target.checked }))}
                                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <p className="font-medium">{t('reset.inclureDemo')}</p>
                                            <p className="text-xs text-muted-foreground">{t('reset.inclureDemoDesc')}</p>
                                        </div>
                                    </label>
                                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <input
                                            type="checkbox"
                                            checked={resetOptions.conserverMedias}
                                            onChange={(e) => setResetOptions(prev => ({ ...prev, conserverMedias: e.target.checked }))}
                                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{t('reset.conserverMedias')}</p>
                                                <Image className="h-3.5 w-3.5 text-muted-foreground" />
                                            </div>
                                            <p className="text-xs text-muted-foreground">{t('reset.conserverMediasDesc')}</p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {resetStep === 3 && (
                                <div className="space-y-4">
                                    {resetCms.isPending ? (
                                        <div className="space-y-4 py-4">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="relative">
                                                    <RefreshCw className="h-12 w-12 animate-spin text-orange-500" />
                                                    <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-orange-400/20" />
                                                </div>
                                                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                                    {resetProgress || t('reset.reinitialisation')}
                                                </p>
                                            </div>
                                            <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                                <div className="h-full animate-pulse rounded-full bg-orange-500" style={{ width: '60%' }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-900/20">
                                                <p className="mb-3 font-medium text-orange-800 dark:text-orange-300">{t('reset.recapitulatif')}</p>
                                                <ul className="space-y-2 text-sm text-orange-700 dark:text-orange-400">
                                                    <li className="flex items-center gap-2"><Check className="h-4 w-4" />{t('reset.suppressionPages', { count: pages?.length || 0 })}</li>
                                                    <li className="flex items-center gap-2"><Check className="h-4 w-4" />{t('reset.suppressionThemes')}</li>
                                                    <li className="flex items-center gap-2"><Check className="h-4 w-4" />{resetOptions.conserverMedias ? t('reset.conservationMedias') : t('reset.suppressionMedias')}</li>
                                                    <li className="flex items-center gap-2"><Check className="h-4 w-4" />{resetOptions.inclureDemo ? t('reset.creationDemo') : t('reset.pasDemo')}</li>
                                                    <li className="flex items-center gap-2"><Check className="h-4 w-4" />{t('reset.recreationPages')}</li>
                                                </ul>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xs text-muted-foreground">{t('reset.confirmer')}</p>
                                                <input
                                                    type="text"
                                                    value={confirmText}
                                                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                                    placeholder="RÉINITIALISER"
                                                    className="w-full rounded-lg border border-orange-300 px-3 py-2 text-center font-mono text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-orange-700 dark:bg-gray-800"
                                                    autoComplete="off"
                                                />
                                            </div>
                                            <p className="text-center text-xs text-muted-foreground">{t('reset.irreversible')}</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <button
                                type="button"
                                onClick={() => {
                                    if (resetCms.isPending) return;
                                    if (resetStep > 1) {
                                        setResetStep(resetStep - 1);
                                        setConfirmText('');
                                    } else {
                                        setShowResetModal(false);
                                        setResetOptions({ conserverMedias: true, inclureDemo: true });
                                        setConfirmText('');
                                    }
                                }}
                                disabled={resetCms.isPending}
                                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                            >
                                {resetStep === 1 ? t('reset.annuler') : t('reset.precedent')}
                            </button>
                            {resetStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={() => setResetStep(resetStep + 1)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    {t('reset.suivant')}
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={resetCms.isPending || confirmText !== 'REINITIALISER'}
                                    onClick={async () => {
                                        try {
                                            const messages = [
                                                t('reset.suppressionDonnees'),
                                                t('reset.reinitialisationTheme'),
                                                t('reset.creationPages'),
                                                t('reset.ajoutDemo'),
                                                t('reset.finalisation'),
                                            ];
                                            let msgIndex = 0;
                                            setResetProgress(messages[0]);
                                            const interval = setInterval(() => {
                                                msgIndex = Math.min(msgIndex + 1, messages.length - 1);
                                                setResetProgress(messages[msgIndex]);
                                            }, 800);

                                            await resetCms.mutateAsync(resetOptions);
                                            clearInterval(interval);
                                            setResetProgress(t('reset.termine'));
                                            setTimeout(() => {
                                                setShowResetModal(false);
                                                setResetOptions({ conserverMedias: true, inclureDemo: true });
                                                setConfirmText('');
                                                setResetProgress('');
                                            }, 1000);
                                        } catch {
                                            setResetProgress('');
                                        }
                                    }}
                                    className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-4 w-4 ${resetCms.isPending ? 'animate-spin' : ''}`} />
                                    {resetCms.isPending ? resetProgress || t('reset.reinitialisation') : t('reinitialiser')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                </>
            )}

            <ConfirmationModal
                isOpen={!!pageASupprimer}
                title={t('supprimer')}
                message="Supprimer cette page ? Cette action est irréversible."
                confirmLabel={t('supprimer')}
                cancelLabel={t('modal.annuler')}
                variant="danger"
                onConfirm={confirmerSuppression}
                onCancel={() => setPageASupprimer(null)}
            />
        </div>
    );
}

// ==================================
// Composants utilitaires
// ==================================

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
                </div>
            </div>
        </div>
    );
}

function QuickStatCard({ icon, label, value, to, color }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    to: string;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return (
        <Link to={to} className="group rounded-xl border bg-card p-3 transition-colors hover:bg-accent">
            <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[color] || colorMap.blue}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-lg font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground group-hover:text-foreground">{label}</p>
                </div>
            </div>
        </Link>
    );
}

function FeatureCard({ icon, title, description, color }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
        cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
        indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
        slate: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
    };
    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorMap[color] || colorMap.blue}`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    );
}

function QuickLink({ to, icon, title, desc }: {
    to: string;
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <Link to={to} className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
            </div>
            <div>
                <p className="text-sm font-semibold group-hover:text-primary">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
        </Link>
    );
}

function ResetItem({ icon, label, count }: { icon: React.ReactNode; label: string; count: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{icon}</span>
                {label}
            </div>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-800">{count}</span>
        </div>
    );
}
