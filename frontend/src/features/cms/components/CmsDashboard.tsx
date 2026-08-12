/**
 * ==================================
 * eLISAschool - Dashboard CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Page principale de gestion CMS.
 * Liste des pages, thèmes, menus, widgets.
 * Accès rapide aux actions de gestion.
 */

import { useState } from 'react';
import { useCmsPages, useCmsThemes, useCmsMenus, useCreerPage, useSupprimerPage, usePublierPage } from '../hooks/use-cms-admin';
import { StatutPage, TemplatePage } from '../types/cms.types';
import type { CmsPage } from '../types/cms.types';
import { Plus, FileText, Palette, Menu, Layout, Eye, Edit3, Trash2, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function CmsDashboard() {
    const [showCreerPage, setShowCreerPage] = useState(false);
    const { data: pages, isLoading } = useCmsPages();
    const { data: themes } = useCmsThemes();
    const { data: menus } = useCmsMenus();
    const creerPage = useCreerPage();
    const supprimerPage = useSupprimerPage();
    const publierPage = usePublierPage();

    const themeActif = themes?.find(t => t.actif);

    const handleCreerPage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = {
            titre: (form.elements.namedItem('titre') as HTMLInputElement).value,
            slug: (form.elements.namedItem('slug') as HTMLInputElement).value,
            template: (form.elements.namedItem('template') as HTMLSelectElement).value as TemplatePage,
        };
        try {
            await creerPage.mutateAsync(data);
            toast.success('Page créée');
            setShowCreerPage(false);
        } catch {
            toast.error('Erreur lors de la création');
        }
    };

    const handlePublier = async (id: string) => {
        try {
            await publierPage.mutateAsync(id);
            toast.success('Page publiée');
        } catch {
            toast.error('Erreur lors de la publication');
        }
    };

    const handleSupprimer = async (id: string) => {
        if (!confirm('Supprimer cette page ? Cette action est irréversible.')) return;
        try {
            await supprimerPage.mutateAsync(id);
            toast.success('Page supprimée');
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const statutBadge = (statut: StatutPage) => {
        const config = {
            [StatutPage.PUBLIE]: { label: 'Publié', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            [StatutPage.BROUILLON]: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
            [StatutPage.HORS_LIGNE]: { label: 'Hors ligne', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
            [StatutPage.PROGRAMME]: { label: 'Programmé', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        };
        const c = config[statut] || config[StatutPage.BROUILLON];
        return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.color}`}>{c.label}</span>;
    };

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Pages publiques</h1>
                    <p className="text-sm text-muted-foreground">
                        Gérez les pages visibles sur votre site public
                    </p>
                </div>
                <button
                    onClick={() => setShowCreerPage(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    Nouvelle page
                </button>
            </div>

            {/* Stats rapides */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<FileText className="h-5 w-5" />} label="Pages" value={pages?.length || 0} />
                <StatCard icon={<Globe className="h-5 w-5" />} label="Publiées" value={pages?.filter(p => p.statut === StatutPage.PUBLIE).length || 0} />
                <StatCard icon={<Palette className="h-5 w-5" />} label="Thème actif" value={themeActif?.nom || 'Aucun'} />
                <StatCard icon={<Menu className="h-5 w-5" />} label="Menus" value={menus?.length || 0} />
            </div>

            {/* Liste des pages */}
            <div className="rounded-xl border bg-card">
                <div className="border-b px-6 py-4">
                    <h2 className="font-semibold">Toutes les pages</h2>
                </div>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                    </div>
                ) : !pages?.length ? (
                    <div className="py-12 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-4 text-sm text-muted-foreground">Aucune page créée</p>
                        <button
                            onClick={() => setShowCreerPage(true)}
                            className="mt-4 text-sm text-primary hover:underline"
                        >
                            Créer votre première page
                        </button>
                    </div>
                ) : (
                    <div className="divide-y">
                        {pages.map((page) => (
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
                                                    Accueil
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            /e/{'{{code}}'}/{page.slug} • {page.template}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {page.statut !== StatutPage.PUBLIE && (
                                        <button
                                            onClick={() => handlePublier(page.id)}
                                            className="rounded-lg p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                            title="Publier"
                                        >
                                            <Globe className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        title="Éditer"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleSupprimer(page.id)}
                                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal création page */}
            {showCreerPage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
                        <h2 className="mb-4 text-lg font-bold">Nouvelle page</h2>
                        <form onSubmit={handleCreerPage} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Titre</label>
                                <input
                                    name="titre"
                                    required
                                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Ex: À propos de nous"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Slug (URL)</label>
                                <input
                                    name="slug"
                                    required
                                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="a-propos-de-nous"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Template</label>
                                <select
                                    name="template"
                                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value={TemplatePage.PAGE_VIERGE}>Page vierge</option>
                                    <option value={TemplatePage.ACCUEIL}>Accueil</option>
                                    <option value={TemplatePage.CONTACT}>Contact</option>
                                    <option value={TemplatePage.GALERIE}>Galerie</option>
                                    <option value={TemplatePage.ACTUALITES}>Actualités</option>
                                    <option value={TemplatePage.INSCRIPTIONS}>Inscriptions</option>
                                    <option value={TemplatePage.MENTIONS_LEGALES}>Mentions légales</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreerPage(false)}
                                    className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={creerPage.isPending}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {creerPage.isPending ? 'Création...' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================================
// Composant carte statistique
// ==================================
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </div>
        </div>
    );
}
