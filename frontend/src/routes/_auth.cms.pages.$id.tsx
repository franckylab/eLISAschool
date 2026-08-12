/**
 * ==================================
 * eLISAschool - Éditeur de page CMS (drag & drop)
 * ==================================
 * Route: /_auth/cms/pages/$id
 * Éditeur 3 colonnes : palette sections, canvas, propriétés.
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo, useCallback } from 'react';
import {
    useCmsPage, useModifierPage, useCreerSection, useModifierSection,
    useSupprimerSection, useReordonnerSections,
} from '@/features/cms/hooks/use-cms-admin';
import { SectionType, StatutPage } from '@/features/cms/types/cms.types';
import type { CmsSection } from '@/features/cms/types/cms.types';
import { CmsSectionEditor, SECTION_CONFIG } from '@/features/cms/components/CmsSectionEditor';
import {
    ArrowLeft, Save, Eye, Plus, GripVertical, Trash2, ChevronUp, ChevronDown,
    Image, Type, BarChart3, Users, MessageSquare, MapPin, HelpCircle, Rocket,
    Download, Clock, Code, FileText, Play, ShoppingBag, Newspaper, Minus,
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_auth/cms/pages/$id')({
    component: CmsPageEditor,
});

// Icônes par type de section
const SECTION_ICONS: Record<SectionType, React.ReactNode> = {
    [SectionType.HERO]: <Image className="h-4 w-4" />,
    [SectionType.TEXTE]: <Type className="h-4 w-4" />,
    [SectionType.GALERIE]: <Image className="h-4 w-4" />,
    [SectionType.CARTE_INFOS]: <FileText className="h-4 w-4" />,
    [SectionType.TEMOIGNAGES]: <MessageSquare className="h-4 w-4" />,
    [SectionType.CHIFFRES_CLES]: <BarChart3 className="h-4 w-4" />,
    [SectionType.EQUIPE]: <Users className="h-4 w-4" />,
    [SectionType.FORMULAIRE]: <FileText className="h-4 w-4" />,
    [SectionType.CARTE]: <MapPin className="h-4 w-4" />,
    [SectionType.VIDEO]: <Play className="h-4 w-4" />,
    [SectionType.TELECHARGEMENTS]: <Download className="h-4 w-4" />,
    [SectionType.ACTUALITES]: <Newspaper className="h-4 w-4" />,
    [SectionType.HORAIRES]: <Clock className="h-4 w-4" />,
    [SectionType.PARTENAIRES]: <ShoppingBag className="h-4 w-4" />,
    [SectionType.FAQ]: <HelpCircle className="h-4 w-4" />,
    [SectionType.APPEL_ACTION]: <Rocket className="h-4 w-4" />,
    [SectionType.SEPARATEUR]: <Minus className="h-4 w-4" />,
    [SectionType.HTML_CUSTOM]: <Code className="h-4 w-4" />,
};

function CmsPageEditor() {
    const { id } = Route.useParams();
    const navigate = useNavigate();
    const { data: page, isLoading } = useCmsPage(id);
    const modifierPage = useModifierPage();
    const creerSection = useCreerSection();
    const modifierSection = useModifierSection();
    const supprimerSection = useSupprimerSection();
    const reordonnerSections = useReordonnerSections();

    const [sectionSelectionnee, setSectionSelectionnee] = useState<string | null>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    // Sections triées
    const sections = useMemo(() => {
        return (page?.sections || [])
            .filter(s => s.visible !== false)
            .sort((a, b) => a.ordre - b.ordre);
    }, [page?.sections]);

    const sectionActive = useMemo(() => {
        return sections.find(s => s.id === sectionSelectionnee) || null;
    }, [sections, sectionSelectionnee]);

    // Ajouter une section
    const handleAjouterSection = async (type: SectionType) => {
        try {
            const maxOrdre = sections.length > 0 ? Math.max(...sections.map(s => s.ordre)) + 1 : 0;
            await creerSection.mutateAsync({
                type,
                pageId: id,
                ordre: maxOrdre,
                titre: SECTION_CONFIG[type]?.label || type,
                contenu: {},
                visible: true,
            });
            toast.success('Section ajoutée');
        } catch {
            toast.error('Erreur lors de l\'ajout');
        }
    };

    // Modifier une section
    const handleModifierSection = async (data: Partial<CmsSection>) => {
        if (!sectionSelectionnee) return;
        try {
            await modifierSection.mutateAsync({ id: sectionSelectionnee, ...data });
            toast.success('Section modifiée');
        } catch {
            toast.error('Erreur lors de la modification');
        }
    };

    // Supprimer une section
    const handleSupprimerSection = async (sectionId: string) => {
        try {
            await supprimerSection.mutateAsync(sectionId);
            if (sectionSelectionnee === sectionId) setSectionSelectionnee(null);
            toast.success('Section supprimée');
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    // Déplacer une section
    const handleDeplacer = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= sections.length) return;

        const nouvellesSections = sections.map((s, i) => {
            if (i === index) return { id: s.id, ordre: newIndex };
            if (i === newIndex) return { id: s.id, ordre: index };
            return { id: s.id, ordre: i };
        });

        try {
            await reordonnerSections.mutateAsync({ pageId: id, sections: nouvellesSections });
        } catch {
            toast.error('Erreur lors du réordonnement');
        }
    };

    // Publier la page
    const handlePublier = async () => {
        try {
            await modifierPage.mutateAsync({ id, statut: StatutPage.PUBLIE });
            toast.success('Page publiée');
        } catch {
            toast.error('Erreur lors de la publication');
        }
    };

    // Sauvegarder les meta
    const handleSauvegarderMeta = async () => {
        // Placeholder — serait appelé depuis un panneau SEO
        toast.success('Métadonnées sauvegardées');
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
            </div>
        );
    }

    if (!page) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground">Page introuvable</p>
                    <button onClick={() => navigate({ to: '/cms/pages' })} className="mt-4 text-sm text-primary hover:underline">
                        Retour aux pages
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {/* Barre d'outils */}
            <div className="flex items-center justify-between border-b bg-card/50 px-4 py-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate({ to: '/cms/pages' })}
                        className="rounded-lg p-1.5 hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold">{page.titre}</h1>
                        <p className="text-xs text-muted-foreground">/e/code/{page.slug}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        page.statut === StatutPage.PUBLIE
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                        {page.statut === StatutPage.PUBLIE ? 'Publié' : 'Brouillon'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePublier}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Publier
                    </button>
                </div>
            </div>

            {/* Corps 3 colonnes */}
            <div className="flex flex-1 overflow-hidden">
                {/* Colonne gauche — Palette sections */}
                <div className="w-56 shrink-0 overflow-y-auto border-r bg-card/30 p-3">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Ajouter une section
                    </p>
                    <div className="space-y-1">
                        {Object.entries(SECTION_CONFIG).map(([type, config]) => (
                            <button
                                key={type}
                                onClick={() => handleAjouterSection(type as SectionType)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
                            >
                                <span className="text-primary">{config.icone}</span>
                                <span>{config.label}</span>
                                <Plus className="ml-auto h-3 w-3 opacity-40" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Centre — Canvas */}
                <div className="flex-1 overflow-y-auto bg-muted/20 p-6">
                    <div className="mx-auto max-w-2xl space-y-3">
                        {sections.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20 text-center">
                                <FileText className="mb-3 h-10 w-10 text-gray-300" />
                                <p className="text-sm text-muted-foreground">Aucune section</p>
                                <p className="text-xs text-muted-foreground">Cliquez sur une section dans la palette de gauche</p>
                            </div>
                        ) : (
                            sections.map((section, index) => (
                                <div
                                    key={section.id}
                                    className={`group relative rounded-xl border-2 transition-all ${
                                        sectionSelectionnee === section.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-transparent hover:border-muted-foreground/20 bg-card'
                                    }`}
                                >
                                    {/* Header section */}
                                    <div className="flex items-center gap-2 px-3 py-2">
                                        <GripVertical className="h-4 w-4 cursor-grab opacity-30" />
                                        <span className="text-primary">{SECTION_ICONS[section.type]}</span>
                                        <span className="flex-1 text-xs font-medium truncate">
                                            {section.titre || SECTION_CONFIG[section.type]?.label || section.type}
                                        </span>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDeplacer(index, 'up')}
                                                disabled={index === 0}
                                                className="rounded p-1 hover:bg-muted disabled:opacity-30"
                                            >
                                                <ChevronUp className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDeplacer(index, 'down')}
                                                disabled={index === sections.length - 1}
                                                className="rounded p-1 hover:bg-muted disabled:opacity-30"
                                            >
                                                <ChevronDown className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => setSectionSelectionnee(sectionSelectionnee === section.id ? null : section.id)}
                                                className="rounded p-1 text-blue-600 hover:bg-blue-50"
                                            >
                                                <Image className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => handleSupprimerSection(section.id)}
                                                className="rounded p-1 text-red-500 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preview minimal */}
                                    <div className="border-t px-3 py-3">
                                        <SectionPreview section={section} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Droite — Propriétés */}
                {sectionActive && (
                    <div className="w-72 shrink-0 overflow-y-auto border-l bg-card/50">
                        <CmsSectionEditor
                            section={sectionActive}
                            onSave={handleModifierSection}
                            onCancel={() => setSectionSelectionnee(null)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================================
// Preview minimal d'une section
// ==================================
function SectionPreview({ section }: { section: CmsSection }) {
    const contenu = section.contenu || {};

    switch (section.type) {
        case SectionType.HERO:
            return (
                <div className="rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 p-4 text-center">
                    <p className="text-sm font-semibold">{contenu.titre || 'Titre du hero'}</p>
                    <p className="text-xs opacity-60">{contenu.sousTitre || 'Sous-titre'}</p>
                </div>
            );
        case SectionType.TEXTE:
            return (
                <div className="space-y-1">
                    {contenu.titre && <p className="text-sm font-semibold">{contenu.titre}</p>}
                    <p className="text-xs opacity-60 line-clamp-2">{(contenu.contenu || '').replace(/<[^>]*>/g, '').slice(0, 100)}</p>
                </div>
            );
        case SectionType.CHIFFRES_CLES:
            return (
                <div className="flex gap-4 justify-center">
                    {(Array.isArray(contenu.chiffres) ? contenu.chiffres : []).slice(0, 3).map((c: any, i: number) => (
                        <div key={i} className="text-center">
                            <p className="text-lg font-bold text-primary">{c.valeur}</p>
                            <p className="text-[10px] opacity-60">{c.label}</p>
                        </div>
                    ))}
                </div>
            );
        case SectionType.APPEL_ACTION:
            return (
                <div className="rounded-lg bg-primary/10 p-3 text-center">
                    <p className="text-xs font-semibold">{contenu.titre || 'Appel à l\'action'}</p>
                    {contenu.boutonTexte && (
                        <span className="mt-1 inline-block rounded bg-primary px-2 py-0.5 text-[10px] text-white">{contenu.boutonTexte}</span>
                    )}
                </div>
            );
        case SectionType.GALERIE:
            return (
                <div className="grid grid-cols-4 gap-1">
                    {(Array.isArray(contenu.medias) ? contenu.medias : []).slice(0, 4).map((m: any, i: number) => (
                        <div key={i} className="aspect-square rounded bg-muted" />
                    ))}
                </div>
            );
        default:
            return (
                <div className="text-center text-xs text-muted-foreground py-2">
                    {SECTION_CONFIG[section.type]?.label || section.type}
                </div>
            );
    }
}
