/**
 * ==================================
 * eLISAschool - Historique versions CMS
 * ==================================
 * Route: /_auth/cms/versions
 * Timeline des modifications, diff, rollback.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useCmsPages, useCmsVersions, useRestaurerVersion } from '@/features/cms/hooks/use-cms-admin';
import type { CmsPage } from '@/features/cms/types/cms.types';
import { Clock, RotateCcw, FileText, ChevronRight, Search, Filter, GitBranch, Eye } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_auth/cms/versions')({
    component: CmsVersionsPage,
});

function CmsVersionsPage() {
    const { data: pages } = useCmsPages();
    const [pageSelectionnee, setPageSelectionnee] = useState<string>('');
    const [recherche, setRecherche] = useState('');

    const { data: versions, isLoading: isLoadingVersions } = useCmsVersions('page', pageSelectionnee);
    const restaurerVersion = useRestaurerVersion();

    const [versionComparee, setVersionComparee] = useState<string | null>(null);

    const pageActuelle = useMemo(() => {
        return (pages || []).find(p => p.id === pageSelectionnee) || null;
    }, [pages, pageSelectionnee]);

    const versionsFiltrees = useMemo(() => {
        if (!versions) return [];
        if (!recherche) return versions;
        const q = recherche.toLowerCase();
        return versions.filter((v: any) =>
            v.action?.toLowerCase().includes(q) ||
            v.utilisateurNom?.toLowerCase().includes(q) ||
            v.commentaire?.toLowerCase().includes(q)
        );
    }, [versions, recherche]);

    // Restaurer une version
    const handleRestaurer = async (versionId: string) => {
        if (!confirm('Restaurer cette version ? La version actuelle sera remplacée.')) return;
        try {
            await restaurerVersion.mutateAsync(versionId);
            toast.success('Version restaurée');
        } catch {
            toast.error('Erreur lors de la restauration');
        }
    };

    // Formater date
    const formaterDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    // Couleur action
    const getCouleurAction = (action: string) => {
        switch (action?.toLowerCase()) {
            case 'création':
            case 'creation':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'modification':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'publication':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'restauration':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'suppression':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-6">
            {/* En-tête */}
            <div>
                <h1 className="text-2xl font-bold">Historique des versions</h1>
                <p className="text-sm text-muted-foreground">Consultez et restaurez les versions précédentes de vos pages</p>
            </div>

            {/* Sélecteur de page */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1" style={{ minWidth: '250px' }}>
                    <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40" />
                    <select
                        value={pageSelectionnee}
                        onChange={(e) => { setPageSelectionnee(e.target.value); setVersionComparee(null); }}
                        className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="">Sélectionner une page...</option>
                        {(pages || []).map(p => (
                            <option key={p.id} value={p.id}>
                                {p.titre} ({p.slug})
                            </option>
                        ))}
                    </select>
                </div>
                {pageSelectionnee && (
                    <div className="relative" style={{ minWidth: '200px' }}>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40" />
                        <input
                            type="text"
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                            placeholder="Rechercher dans l'historique..."
                            className="rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                )}
            </div>

            {/* Contenu */}
            {!pageSelectionnee ? (
                <div className="rounded-xl border py-20 text-center">
                    <GitBranch className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm text-muted-foreground">Sélectionnez une page pour voir son historique</p>
                </div>
            ) : isLoadingVersions ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                </div>
            ) : !versionsFiltrees?.length ? (
                <div className="rounded-xl border py-20 text-center">
                    <Clock className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm text-muted-foreground">Aucune version trouvée</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Info page actuelle */}
                    {pageActuelle && (
                        <div className="rounded-lg border bg-card p-3">
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="font-medium">{pageActuelle.titre}</span>
                                <span className="text-muted-foreground">/e/code/{pageActuelle.slug}</span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {versionsFiltrees.length} version{versionsFiltrees.length > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="relative">
                        {/* Ligne verticale */}
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                        <div className="space-y-3">
                            {versionsFiltrees.map((version: any, index: number) => (
                                <div key={version.id} className="relative flex gap-4 pl-2">
                                    {/* Point timeline */}
                                    <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                                        index === 0
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border bg-card'
                                    }`}>
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                    </div>

                                    {/* Carte version */}
                                    <div className={`flex-1 rounded-xl border transition-all ${
                                        versionComparee === version.id
                                            ? 'border-primary bg-primary/5'
                                            : 'bg-card hover:border-muted-foreground/30'
                                    }`}>
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            {/* Badge action */}
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getCouleurAction(version.action)}`}>
                                                {version.action || 'Modification'}
                                            </span>

                                            {/* Infos */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {version.utilisateurNom || 'Système'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formaterDate(version.createdAt)}
                                                </p>
                                            </div>

                                            {/* Commentaire */}
                                            {version.commentaire && (
                                                <span className="max-w-[200px] truncate text-xs text-muted-foreground italic">
                                                    "{version.commentaire}"
                                                </span>
                                            )}

                                            {/* Actions */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setVersionComparee(versionComparee === version.id ? null : version.id)}
                                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                                                    title="Voir le contenu"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {index > 0 && (
                                                    <button
                                                        onClick={() => handleRestaurer(version.id)}
                                                        className="rounded-lg p-1.5 text-orange-600 hover:bg-orange-50"
                                                        title="Restaurer cette version"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Diff / contenu version */}
                                        {versionComparee === version.id && (
                                            <div className="border-t px-4 py-3">
                                                <div className="rounded-lg bg-muted/50 p-3">
                                                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Contenu de cette version</p>
                                                    {version.donnees ? (
                                                        <pre className="max-h-60 overflow-auto rounded bg-background p-3 text-xs font-mono">
                                                            {JSON.stringify(version.donnees, null, 2)}
                                                        </pre>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground italic">Aucun détail disponible</p>
                                                    )}
                                                </div>
                                                {index > 0 && (
                                                    <button
                                                        onClick={() => handleRestaurer(version.id)}
                                                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
                                                    >
                                                        <RotateCcw className="h-3 w-3" />
                                                        Restaurer cette version
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
