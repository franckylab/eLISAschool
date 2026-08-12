/**
 * ==================================
 * eLISAschool - Page galerie publique établissement
 * ==================================
 * Route: /e/:code/galerie
 * Galerie photos/vidéos publique avec filtres et lightbox.
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useEtablissementPublic, useThemePublic, useMenusPublic, usePagesPubliques } from '@/features/cms/hooks/use-cms-public';
import { PublicLayout } from '@/features/cms/components/PublicLayout';
import { CmsPageRenderer } from '@/features/cms/components/CmsPageRenderer';
import { X, ChevronLeft, ChevronRight, Image, Video, Grid, LayoutGrid } from 'lucide-react';
import type { CmsSection, CmsMedia } from '@/features/cms/types/cms.types';
import { SectionType } from '@/features/cms/types/cms.types';

export const Route = createFileRoute('/e/$code/galerie')({
    component: PageGaleriePublique,
});

function PageGaleriePublique() {
    const { code } = Route.useParams();
    const { data: etab } = useEtablissementPublic(code);
    const { data: theme } = useThemePublic(code);
    const { data: menus } = useMenusPublic(code);
    const { data: pages } = usePagesPubliques(code);

    // Trouver la page galerie
    const pageGalerie = pages?.find(p => p.template === 'galerie' || p.slug === 'galerie');
    const sectionsGalerie = pageGalerie?.sections || [];

    // Extraire les médias des sections GALERIE
    const tousMedias = useMemo(() => {
        const medias: { id: string; url: string; type: 'image' | 'video'; titre?: string; description?: string; dossier?: string }[] = [];
        for (const section of sectionsGalerie) {
            if (section.type === SectionType.GALERIE && section.contenu?.medias) {
                for (const media of section.contenu.medias) {
                    medias.push({
                        id: media.id || `${section.id}-${medias.length}`,
                        url: media.url || '',
                        type: media.type || 'image',
                        titre: media.titre || '',
                        description: media.description || '',
                        dossier: media.dossier || 'Tous',
                    });
                }
            }
        }
        return medias;
    }, [sectionsGalerie]);

    // Filtres
    const [filtreDossier, setFiltreDossier] = useState<string>('Tous');
    const [filtreType, setFiltreType] = useState<'tous' | 'image' | 'video'>('tous');
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [colonnes, setColonnes] = useState<2 | 3 | 4>(3);

    const dossiers = useMemo(() => {
        const set = new Set(tousMedias.map(m => m.dossier || 'Tous'));
        return ['Tous', ...Array.from(set).sort()];
    }, [tousMedias]);

    const mediasFiltres = useMemo(() => {
        return tousMedias.filter(m => {
            if (filtreDossier !== 'Tous' && m.dossier !== filtreDossier) return false;
            if (filtreType !== 'tous' && m.type !== filtreType) return false;
            return true;
        });
    }, [tousMedias, filtreDossier, filtreType]);

    // Navigation lightbox
    const lightboxSuivant = () => {
        if (lightboxIndex !== null) {
            setLightboxIndex((lightboxIndex + 1) % mediasFiltres.length);
        }
    };
    const lightboxPrecedent = () => {
        if (lightboxIndex !== null) {
            setLightboxIndex((lightboxIndex - 1 + mediasFiltres.length) % mediasFiltres.length);
        }
    };

    if (!etab) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
            </div>
        );
    }

    const primaryColor = theme?.couleurs?.primaire || '#28a745';

    return (
        <PublicLayout etablissement={etab} theme={theme} menus={menus || []}>
            {/* Sections CMS de la page galerie (hero, texte, etc.) */}
            {sectionsGalerie.filter(s => s.type !== SectionType.GALERIE).length > 0 && (
                <CmsPageRenderer
                    sections={sectionsGalerie.filter(s => s.type !== SectionType.GALERIE)}
                    theme={theme}
                    etablissement={etab}
                    codeEtablissement={code}
                />
            )}

            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* En-tête galerie */}
                <div className="mb-8 text-center">
                    <h1
                        className="mb-2 font-bold"
                        style={{
                            fontSize: 'clamp(1.5rem, 1rem + 2.5vw, 2.5rem)',
                            color: primaryColor,
                            fontFamily: 'var(--cms-font-title)',
                        }}
                    >
                        Galerie
                    </h1>
                    <p className="text-sm opacity-60">
                        {mediasFiltres.length} média{mediasFiltres.length > 1 ? 's' : ''}
                    </p>
                </div>

                {/* Barre d'outils */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    {/* Filtres dossiers */}
                    <div className="flex flex-wrap gap-2">
                        {dossiers.map(d => (
                            <button
                                key={d}
                                onClick={() => setFiltreDossier(d)}
                                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                                style={{
                                    backgroundColor: filtreDossier === d ? primaryColor : 'rgba(128,128,128,0.1)',
                                    color: filtreDossier === d ? '#fff' : 'inherit',
                                }}
                            >
                                {d}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Filtre type */}
                        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cms-text, #1a1a2e)', opacity: 0.6 }}>
                            <button
                                onClick={() => setFiltreType('tous')}
                                className="px-2 py-1 text-xs"
                                style={{ backgroundColor: filtreType === 'tous' ? primaryColor : 'transparent', color: filtreType === 'tous' ? '#fff' : 'inherit' }}
                            >
                                Tous
                            </button>
                            <button
                                onClick={() => setFiltreType('image')}
                                className="px-2 py-1 text-xs flex items-center gap-1"
                                style={{ backgroundColor: filtreType === 'image' ? primaryColor : 'transparent', color: filtreType === 'image' ? '#fff' : 'inherit' }}
                            >
                                <Image className="h-3 w-3" /> Photos
                            </button>
                            <button
                                onClick={() => setFiltreType('video')}
                                className="px-2 py-1 text-xs flex items-center gap-1"
                                style={{ backgroundColor: filtreType === 'video' ? primaryColor : 'transparent', color: filtreType === 'video' ? '#fff' : 'inherit' }}
                            >
                                <Video className="h-3 w-3" /> Vidéos
                            </button>
                        </div>

                        {/* Toggle colonnes */}
                        <div className="hidden sm:flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--cms-text, #1a1a2e)', opacity: 0.6 }}>
                            <button onClick={() => setColonnes(2)} className="p-1.5" title="2 colonnes">
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button onClick={() => setColonnes(3)} className="p-1.5" title="3 colonnes">
                                <Grid className="h-4 w-4" />
                            </button>
                            <button onClick={() => setColonnes(4)} className="p-1.5" title="4 colonnes">
                                <Grid className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grille médias */}
                {mediasFiltres.length === 0 ? (
                    <div className="py-20 text-center opacity-50">
                        <Image className="mx-auto h-16 w-16 mb-4 opacity-30" />
                        <p>Aucun média dans cette galerie pour le moment</p>
                    </div>
                ) : (
                    <div
                        className="grid gap-3"
                        style={{ gridTemplateColumns: `repeat(${colonnes}, 1fr)` }}
                    >
                        {mediasFiltres.map((media, index) => (
                            <button
                                key={media.id}
                                onClick={() => setLightboxIndex(index)}
                                className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 transition-transform hover:scale-[1.02]"
                            >
                                {media.type === 'video' ? (
                                    <div className="flex h-full w-full items-center justify-center bg-gray-900/10">
                                        <Video className="h-10 w-10 opacity-40" />
                                    </div>
                                ) : (
                                    <img
                                        src={media.url}
                                        alt={media.titre || ''}
                                        className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                                        loading="lazy"
                                    />
                                )}
                                {/* Overlay au hover */}
                                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                                    <div className="w-full p-3 text-left text-white">
                                        {media.titre && <p className="text-sm font-medium truncate">{media.titre}</p>}
                                        {media.description && <p className="text-xs opacity-80 truncate">{media.description}</p>}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && mediasFiltres[lightboxIndex] && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
                        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Navigation */}
                    <button
                        onClick={(e) => { e.stopPropagation(); lightboxPrecedent(); }}
                        className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); lightboxSuivant(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Contenu */}
                    <div className="max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
                        {mediasFiltres[lightboxIndex].type === 'video' ? (
                            <video
                                src={mediasFiltres[lightboxIndex].url}
                                controls
                                autoPlay
                                className="max-h-[80vh] max-w-[85vw] rounded-lg"
                            />
                        ) : (
                            <img
                                src={mediasFiltres[lightboxIndex].url}
                                alt={mediasFiltres[lightboxIndex].titre || ''}
                                className="max-h-[80vh] max-w-[85vw] rounded-lg object-contain"
                            />
                        )}
                        {/* Légende */}
                        <div className="mt-3 text-center text-white">
                            {mediasFiltres[lightboxIndex].titre && (
                                <p className="font-medium">{mediasFiltres[lightboxIndex].titre}</p>
                            )}
                            <p className="text-sm opacity-60">
                                {lightboxIndex + 1} / {mediasFiltres.length}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}
