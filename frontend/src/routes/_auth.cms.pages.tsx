/**
 * ==================================
 * eLISAschool - Liste pages CMS + création
 * ==================================
 * Route: /_auth/cms/pages
 * Gestion CRUD des pages CMS avec filtres.
 */

import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useCmsPages, useCreerPage, useSupprimerPage, usePublierPage, useModifierPage } from '@/features/cms/hooks/use-cms-admin';
import { StatutPage, TemplatePage } from '@/features/cms/types/cms.types';
import type { CmsPage } from '@/features/cms/types/cms.types';
import { Plus, FileText, Globe, Edit3, Trash2, Eye, Search, Filter, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_auth/cms/pages')({
    component: CmsPagesListe,
});

function CmsPagesListe() {
    const navigate = useNavigate();
    const { data: pages, isLoading } = useCmsPages();
    const creerPage = useCreerPage();
    const supprimerPage = useSupprimerPage();
    const publierPage = usePublierPage();
    const modifierPage = useModifierPage();

    const [showCreer, setShowCreer] = useState(false);
    const [recherche, setRecherche] = useState('');
    const [filtreStatut, setFiltreStatut] = useState<string>('');
    const [filtreTemplate, setFiltreTemplate] = useState<string>('');

    const pagesFiltrees = (pages || []).filter(p => {
        if (recherche && !p.titre.toLowerCase().includes(recherche.toLowerCase())) return false;
        if (filtreStatut && p.statut !== filtreStatut) return false;
        if (filtreTemplate && p.template !== filtreTemplate) return false;
        return true;
    });

    const handleCreer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = {
            titre: (form.elements.namedItem('titre') as HTMLInputElement).value,
            slug: (form.elements.namedItem('slug') as HTMLInputElement).value,
            template: (form.elements.namedItem('template') as HTMLSelectElement).value as TemplatePage,
        };
        try {
            const result = await creerPage.mutateAsync(data);
            toast.success('Page créée');
            setShowCreer(false);
            // Naviguer vers l'éditeur
            if (result?.data?.id) {
                navigate({ to: '/cms/pages/$id', params: { id: result.data.id } });
            }
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
        const config: Record<string, { label: string; cls: string }> = {
            [StatutPage.PUBLIE]: { label: 'Publié', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            [StatutPage.BROUILLON]: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
            [StatutPage.HORS_LIGNE]: { label: 'Hors ligne', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
            [StatutPage.PROGRAMME]: { label: 'Programmé', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        };
        const c = config[statut] || config[StatutPage.BROUILLON];
        return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.cls}`}>{c.label}</span>;
    };

    const templateLabel = (t: TemplatePage) => {
        const labels: Record<string, string> = {
            [TemplatePage.ACCUEIL]: 'Accueil',
            [TemplatePage.PAGE_VIERGE]: 'Page vierge',
            [TemplatePage.CONTACT]: 'Contact',
            [TemplatePage.GALERIE]: 'Galerie',
            [TemplatePage.ACTUALITES]: 'Actualités',
            [TemplatePage.INSCRIPTIONS]: 'Inscriptions',
            [TemplatePage.MENTIONS_LEGALES]: 'Mentions légales',
        };
        return labels[t] || t;
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Pages</h1>
                    <p className="text-sm text-muted-foreground">Gérez les pages de votre site public</p>
                </div>
                <button
                    onClick={() => setShowCreer(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    Nouvelle page
                </button>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1" style={{ minWidth: '200px' }}>
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40" />
                    <input
                        type="text"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder="Rechercher une page..."
                        className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <select
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Tous les statuts</option>
                    <option value={StatutPage.PUBLIE}>Publié</option>
                    <option value={StatutPage.BROUILLON}>Brouillon</option>
                    <option value={StatutPage.HORS_LIGNE}>Hors ligne</option>
                    <option value={StatutPage.PROGRAMME}>Programmé</option>
                </select>
                <select
                    value={filtreTemplate}
                    onChange={(e) => setFiltreTemplate(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Tous les templates</option>
                    {Object.values(TemplatePage).map(t => (
                        <option key={t} value={t}>{templateLabel(t)}</option>
                    ))}
                </select>
            </div>

            {/* Liste */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                </div>
            ) : !pagesFiltrees.length ? (
                <div className="rounded-xl border py-20 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm text-muted-foreground">Aucune page trouvée</p>
                    <button onClick={() => setShowCreer(true)} className="mt-4 text-sm text-primary hover:underline">
                        Créer votre première page
                    </button>
                </div>
            ) : (
                <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Page</th>
                                <th className="px-4 py-3 text-left font-medium">Template</th>
                                <th className="px-4 py-3 text-left font-medium">Statut</th>
                                <th className="px-4 py-3 text-left font-medium">Sections</th>
                                <th className="px-4 py-3 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {pagesFiltrees.map(page => (
                                <tr key={page.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{page.titre}</span>
                                                    {page.estPageAccueil && (
                                                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Accueil</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">/e/code/{page.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{templateLabel(page.template)}</td>
                                    <td className="px-4 py-3">{statutBadge(page.statut)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{page.sections?.length || 0}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                to="/cms/pages/$id"
                                                params={{ id: page.id }}
                                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                title="Éditer"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Link>
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
                                                onClick={() => handleSupprimer(page.id)}
                                                className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal création */}
            {showCreer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreer(false)}>
                    <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-4 text-lg font-bold">Nouvelle page</h2>
                        <form onSubmit={handleCreer} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Titre *</label>
                                <input name="titre" required className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" placeholder="Ex: À propos de nous" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Slug (URL) *</label>
                                <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" placeholder="a-propos-de-nous" />
                                <p className="mt-1 text-xs text-muted-foreground">Minuscules, chiffres et tirets uniquement</p>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Template</label>
                                <select name="template" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                                    {Object.values(TemplatePage).map(t => (
                                        <option key={t} value={t}>{templateLabel(t)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreer(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">Annuler</button>
                                <button type="submit" disabled={creerPage.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
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
