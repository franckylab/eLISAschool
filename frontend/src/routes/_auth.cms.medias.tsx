/**
 * ==================================
 * eLISAschool - Bibliothèque médias CMS
 * ==================================
 * Route: /_auth/cms/medias
 * Upload, grille, filtres par type/dossier, suppression.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useCmsMedias, useCreerMedia, useSupprimerMedia } from '@/features/cms/hooks/use-cms-admin';
import { CmsMediaUpload } from '@/features/cms/components/CmsMediaUpload';
import { Image, Video, FileText, Trash2, Grid, List, Search, FolderOpen, Upload } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_auth/cms/medias')({
    component: CmsMediasPage,
});

function CmsMediasPage() {
    const [filtreType, setFiltreType] = useState<string>('');
    const [recherche, setRecherche] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showUpload, setShowUpload] = useState(false);

    const { data: medias, isLoading } = useCmsMedias(filtreType || undefined);
    const creerMedia = useCreerMedia();
    const supprimerMedia = useSupprimerMedia();

    const mediasFiltres = useMemo(() => {
        return (medias || []).filter(m => {
            if (recherche && !m.nom?.toLowerCase().includes(recherche.toLowerCase())) return false;
            return true;
        });
    }, [medias, recherche]);

    // Dossiers distincts
    const dossiers = useMemo(() => {
        const set = new Set((medias || []).map(m => m.dossier).filter(Boolean));
        return Array.from(set).sort();
    }, [medias]);

    const handleUpload = async (data: any) => {
        try {
            await creerMedia.mutateAsync(data);
            toast.success('Média ajouté');
        } catch {
            toast.error('Erreur lors de l\'upload');
        }
    };

    const handleSupprimer = async (id: string) => {
        if (!confirm('Supprimer ce média ?')) return;
        try {
            await supprimerMedia.mutateAsync(id);
            toast.success('Média supprimé');
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const getIcone = (type: string) => {
        switch (type) {
            case 'image': return <Image className="h-5 w-5" />;
            case 'video': return <Video className="h-5 w-5" />;
            default: return <FileText className="h-5 w-5" />;
        }
    };

    const formaterTaille = (octets: number) => {
        if (!octets) return '';
        if (octets < 1024) return `${octets} o`;
        if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
        return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Médiathèque</h1>
                    <p className="text-sm text-muted-foreground">{mediasFiltres.length} média{mediasFiltres.length > 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Upload className="h-4 w-4" />
                    {showUpload ? 'Fermer' : 'Uploader'}
                </button>
            </div>

            {/* Zone upload */}
            {showUpload && (
                <div className="rounded-xl border bg-card p-4">
                    <CmsMediaUpload onUpload={handleUpload} multiple accept="image/*,video/*,.pdf,.doc,.docx" maxTailleMo={10} />
                </div>
            )}

            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1" style={{ minWidth: '200px' }}>
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40" />
                    <input
                        type="text"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder="Rechercher un média..."
                        className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <select
                    value={filtreType}
                    onChange={(e) => setFiltreType(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Tous les types</option>
                    <option value="image">Images</option>
                    <option value="video">Vidéos</option>
                    <option value="document">Documents</option>
                </select>
                <div className="flex rounded-lg border overflow-hidden">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
                    >
                        <Grid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Contenu */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                </div>
            ) : !mediasFiltres.length ? (
                <div className="rounded-xl border py-20 text-center">
                    <FolderOpen className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm text-muted-foreground">Aucun média</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {mediasFiltres.map(m => (
                        <div key={m.id} className="group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
                            <div className="aspect-square bg-muted flex items-center justify-center">
                                {m.type === 'image' && m.url ? (
                                    <img src={m.url} alt={m.nom} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-primary">{getIcone(m.type)}</span>
                                )}
                            </div>
                            <div className="p-2">
                                <p className="truncate text-xs font-medium">{m.nom}</p>
                                <p className="text-[10px] text-muted-foreground">{formaterTaille(m.taille)}</p>
                            </div>
                            <button
                                onClick={() => handleSupprimer(m.id)}
                                className="absolute right-2 top-2 rounded-lg bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium">Nom</th>
                                <th className="px-4 py-2 text-left font-medium">Type</th>
                                <th className="px-4 py-2 text-left font-medium">Taille</th>
                                <th className="px-4 py-2 text-left font-medium">Dossier</th>
                                <th className="px-4 py-2 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {mediasFiltres.map(m => (
                                <tr key={m.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-2 flex items-center gap-2">
                                        {getIcone(m.type)}
                                        <span className="truncate max-w-[200px]">{m.nom}</span>
                                    </td>
                                    <td className="px-4 py-2 text-muted-foreground capitalize">{m.type}</td>
                                    <td className="px-4 py-2 text-muted-foreground">{formaterTaille(m.taille)}</td>
                                    <td className="px-4 py-2 text-muted-foreground">{m.dossier || '—'}</td>
                                    <td className="px-4 py-2 text-right">
                                        <button onClick={() => handleSupprimer(m.id)} className="rounded p-1 text-red-500 hover:bg-red-50">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
