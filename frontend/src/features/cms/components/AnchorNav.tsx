/**
 * ==================================
 * eLISAschool - Navigation par ancres + Sommaire auto CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant de navigation latérale pour pages CMS longues.
 * Sommaire automatique généré depuis les titres de sections.
 * Scroll-spy, smooth scroll, sticky sidebar.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { List, ChevronRight, ArrowUp } from 'lucide-react';

// ==================================
// Types
// ==================================

interface AnchorItem {
    id: string;
    titre: string;
    niveau: number; // 1 = h1, 2 = h2, 3 = h3
}

interface AnchorNavProps {
    /** Liste des ancres (auto-générée ou manuelle) */
    anchors?: AnchorItem[];
    /** Container selector pour scanner les titres */
    containerSelector?: string;
    /** Position : sidebar ou floating */
    position?: 'sidebar' | 'floating' | 'top';
    /** Couleur principale */
    couleurPrincipale?: string;
}

// ==================================
// Hook useScrollSpy
// ==================================

function useScrollSpy(anchorIds: string[], offset = 100): string {
    const [activeId, setActiveId] = useState('');

    useEffect(() => {
        if (!anchorIds.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                }
            },
            { rootMargin: `-${offset}px 0px -60% 0px`, threshold: 0 }
        );

        for (const id of anchorIds) {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        }

        return () => observer.disconnect();
    }, [anchorIds, offset]);

    return activeId;
}

// ==================================
// Hook useAutoAnchors — Scan les titres dans le DOM
// ==================================

export function useAutoAnchors(containerSelector = '.cms-page'): AnchorItem[] {
    const [anchors, setAnchors] = useState<AnchorItem[]>([]);

    useEffect(() => {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const titres = container.querySelectorAll('h1[id], h2[id], h3[id], [data-anchor-id]');
        const items: AnchorItem[] = [];

        titres.forEach((el) => {
            const id = el.id || el.getAttribute('data-anchor-id') || '';
            const text = el.textContent?.trim() || '';
            const niveau = el.tagName === 'H1' ? 1 : el.tagName === 'H2' ? 2 : 3;
            if (id && text) {
                items.push({ id, titre: text, niveau });
            }
        });

        setAnchors(items);
    }, [containerSelector]);

    return anchors;
}

// ==================================
// Composant principal — Sidebar
// ==================================

export function AnchorNavSidebar({ anchors: propAnchors, containerSelector, couleurPrincipale, position = 'sidebar' }: AnchorNavProps) {
    const autoAnchors = useAutoAnchors(containerSelector);
    const anchors = propAnchors || autoAnchors;
    const anchorIds = useMemo(() => anchors.map(a => a.id), [anchors]);
    const activeId = useScrollSpy(anchorIds);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const scrollTo = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Pas d'ancres → ne rien afficher
    if (anchors.length < 2) return null;

    // Mode top — barre horizontale
    if (position === 'top') {
        return (
            <div className="sticky top-16 z-30 border-b bg-white/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2">
                    <List className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    {anchors.map(a => (
                        <button
                            key={a.id}
                            onClick={() => scrollTo(a.id)}
                            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                activeId === a.id
                                    ? 'text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            style={activeId === a.id ? { backgroundColor: couleurPrincipale || '#28a745' } : undefined}
                        >
                            {a.titre}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Mode floating — bouton flottant
    if (position === 'floating') {
        return (
            <div className="fixed bottom-20 right-6 z-40">
                {isCollapsed ? (
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110"
                        style={{ backgroundColor: couleurPrincipale || '#28a745' }}
                    >
                        <List className="h-5 w-5" />
                    </button>
                ) : (
                    <div className="w-56 rounded-xl border bg-white p-3 shadow-xl">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase">Sommaire</span>
                            <button onClick={() => setIsCollapsed(true)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-xs">✕</span>
                            </button>
                        </div>
                        <div className="max-h-64 space-y-0.5 overflow-y-auto">
                            {anchors.map(a => (
                                <button
                                    key={a.id}
                                    onClick={() => scrollTo(a.id)}
                                    className={`block w-full truncate rounded px-2 py-1 text-left text-[11px] transition-colors ${
                                        activeId === a.id
                                            ? 'font-semibold text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                    style={{
                                        paddingLeft: `${(a.niveau - 1) * 8 + 8}px`,
                                        ...(activeId === a.id ? { backgroundColor: couleurPrincipale || '#28a745' } : {}),
                                    }}
                                >
                                    {a.titre}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={scrollToTop}
                            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border py-1 text-[10px] text-gray-500 hover:bg-gray-50"
                        >
                            <ArrowUp className="h-3 w-3" /> Haut de page
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Mode sidebar (par défaut)
    return (
        <nav className="sticky top-20 hidden w-56 shrink-0 xl:block" aria-label="Sommaire">
            <div className="rounded-xl border bg-white p-3">
                <h4 className="mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Sommaire</h4>
                <div className="max-h-[calc(100vh-8rem)] space-y-0.5 overflow-y-auto">
                    {anchors.map(a => (
                        <button
                            key={a.id}
                            onClick={() => scrollTo(a.id)}
                            className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[11px] transition-colors ${
                                activeId === a.id
                                    ? 'font-semibold text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            style={{
                                paddingLeft: `${(a.niveau - 1) * 8 + 8}px`,
                                ...(activeId === a.id ? { backgroundColor: couleurPrincipale || '#28a745' } : {}),
                            }}
                        >
                            {activeId === a.id && <ChevronRight className="h-3 w-3" />}
                            <span className="truncate">{a.titre}</span>
                        </button>
                    ))}
                </div>
                <button
                    onClick={scrollToTop}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border py-1 text-[10px] text-gray-500 hover:bg-gray-50"
                >
                    <ArrowUp className="h-3 w-3" /> Haut de page
                </button>
            </div>
        </nav>
    );
}

// ==================================
// Helper — Générer des IDs d'ancres depuis les sections
// ==================================

export function genererAncresDepuisSections(sections: { titre?: string; type?: string; ordre: number }[]): AnchorItem[] {
    return sections
        .filter(s => s.titre && s.titre.length > 0)
        .map((s, i) => ({
            id: `section-${s.ordre}-${slugify(s.titre || '')}`,
            titre: s.titre || `Section ${i + 1}`,
            niveau: 2,
        }));
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
}
