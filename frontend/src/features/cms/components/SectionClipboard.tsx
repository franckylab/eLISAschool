/**
 * ==================================
 * eLISAschool - Presse-papier de sections CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Système de copie/coll/duplication de sections.
 * Stockage localStorage + clipboard navigateur.
 * Historique des 10 dernières sections copiées.
 */

import { useState, useCallback, useEffect } from 'react';
import { Copy, Clipboard, Trash2, Plus, Search, Layers } from 'lucide-react';
import type { Data, PuckProps } from '@puckeditor/core';

// ==================================
// Types
// ==================================

interface SectionClipboardItem {
    id: string;
    nom: string;
    type: string;
    timestamp: number;
    props: Record<string, any>;
}

interface SectionClipboardProps {
    currentData: Data;
    onInsert: (newData: Data) => void;
}

// ==================================
// Constantes
// ==================================

const STORAGE_KEY = 'cms:section-clipboard';
const MAX_ITEMS = 10;

// ==================================
// Hook useSectionClipboard
// ==================================

export function useSectionClipboard() {
    const [items, setItems] = useState<SectionClipboardItem[]>([]);

    // Charger depuis localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setItems(JSON.parse(stored));
            }
        } catch {
            // Ignore si corrompu
        }
    }, []);

    // Sauvegarder dans localStorage
    const persist = useCallback((newItems: SectionClipboardItem[]) => {
        setItems(newItems);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems.slice(0, MAX_ITEMS)));
    }, []);

    // Copier une section
    const copierSection = useCallback((item: Data['content'][number], nom?: string) => {
        const newItem: SectionClipboardItem = {
            id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
            nom: nom || item.type || 'Section',
            type: item.type,
            timestamp: Date.now(),
            props: { ...item.props },
        };
        const newItems = [newItem, ...items.filter(i => i.id !== newItem.id)].slice(0, MAX_ITEMS);
        persist(newItems);
        return newItem;
    }, [items, persist]);

    // Coller une section à une position
    const collerSection = useCallback((currentData: Data, itemId: string, position?: number): Data => {
        const item = items.find(i => i.id === itemId);
        if (!item) return currentData;

        const newContent = [...currentData.content];
        const insertAt = position ?? newContent.length;
        newContent.splice(insertAt, 0, {
            type: item.type,
            props: { ...item.props, id: undefined }, // Nouveau ID sera généré par le backend
        });

        return { ...currentData, content: newContent };
    }, [items]);

    // Supprimer un item du clipboard
    const supprimerItem = useCallback((itemId: string) => {
        persist(items.filter(i => i.id !== itemId));
    }, [items, persist]);

    // Vider le clipboard
    const viderClipboard = useCallback(() => {
        persist([]);
    }, [persist]);

    // Exporter au format JSON
    const exporterItem = useCallback((itemId: string): string | null => {
        const item = items.find(i => i.id === itemId);
        if (!item) return null;
        return JSON.stringify({ type: item.type, props: item.props }, null, 2);
    }, [items]);

    // Importer depuis JSON
    const importerItem = useCallback((json: string): SectionClipboardItem | null => {
        try {
            const parsed = JSON.parse(json);
            if (!parsed.type || !parsed.props) return null;
            const newItem: SectionClipboardItem = {
                id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
                nom: parsed.props?.titre || parsed.type || 'Section importée',
                type: parsed.type,
                timestamp: Date.now(),
                props: parsed.props,
            };
            persist([newItem, ...items].slice(0, MAX_ITEMS));
            return newItem;
        } catch {
            return null;
        }
    }, [items, persist]);

    return {
        items,
        copierSection,
        collerSection,
        supprimerItem,
        viderClipboard,
        exporterItem,
        importerItem,
    };
}

// ==================================
// Panneau UI
// ==================================

export function SectionClipboardPanel({ currentData, onInsert }: SectionClipboardProps) {
    const { items, copierSection, collerSection, supprimerItem, viderClipboard, exporterItem, importerItem } = useSectionClipboard();
    const [recherche, setRecherche] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');

    // Sections disponibles dans la page courante (pour copier)
    const sectionsDisponibles = currentData.content.filter(c => c.type);

    // Filtrer les items du clipboard
    const itemsFiltres = items.filter(i =>
        !recherche || i.nom.toLowerCase().includes(recherche.toLowerCase()) || i.type.toLowerCase().includes(recherche.toLowerCase())
    );

    // Copier depuis la page courante
    const handleCopier = useCallback((index: number) => {
        const section = sectionsDisponibles[index];
        if (section) {
            copierSection(section, (section.props as any)?.titre || section.type);
        }
    }, [sectionsDisponibles, copierSection]);

    // Coller dans la page
    const handleColler = useCallback((itemId: string) => {
        const newData = collerSection(currentData, itemId);
        onInsert(newData);
    }, [currentData, collerSection, onInsert]);

    // Exporter en JSON
    const handleExporter = useCallback((itemId: string) => {
        const json = exporterItem(itemId);
        if (json) {
            navigator.clipboard.writeText(json);
        }
    }, [exporterItem]);

    // Importer depuis JSON
    const handleImporter = useCallback(() => {
        if (importText.trim()) {
            importerItem(importText.trim());
            setImportText('');
            setShowImport(false);
        }
    }, [importText, importerItem]);

    return (
        <div className="p-3 space-y-3">
            {/* Recherche */}
            <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full rounded-md border border-gray-200 py-1.5 pl-7 pr-2 text-xs focus:border-blue-400 focus:outline-none"
                />
            </div>

            {/* Sections de la page courante (copier) */}
            {sectionsDisponibles.length > 0 && (
                <div>
                    <h4 className="mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Sections de cette page
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {sectionsDisponibles.map((section, i) => (
                            <div key={i} className="flex items-center gap-1.5 rounded-md border border-gray-100 px-2 py-1.5">
                                <span className="flex-1 truncate text-[10px] text-gray-600">
                                    {(section.props as any)?.titre || section.type}
                                </span>
                                <button
                                    onClick={() => handleCopier(i)}
                                    className="rounded p-0.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                                    title="Copier"
                                >
                                    <Copy className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Clipboard */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Clipboard className="h-3 w-3" />
                        Presse-papier ({items.length})
                    </h4>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setShowImport(!showImport)}
                            className="rounded px-1.5 py-0.5 text-[9px] text-blue-600 hover:bg-blue-50"
                        >
                            Importer
                        </button>
                        {items.length > 0 && (
                            <button
                                onClick={viderClipboard}
                                className="rounded p-0.5 text-gray-400 hover:text-red-500"
                                title="Vider"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Import JSON */}
                {showImport && (
                    <div className="mb-2 space-y-1">
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder='{"type": "HeroSection", "props": {...}}'
                            className="h-16 w-full rounded-md border border-gray-200 p-2 text-[10px] font-mono focus:border-blue-400 focus:outline-none"
                        />
                        <button
                            onClick={handleImporter}
                            disabled={!importText.trim()}
                            className="rounded bg-blue-500 px-2 py-1 text-[10px] text-white disabled:opacity-50"
                        >
                            Importer
                        </button>
                    </div>
                )}

                {/* Liste des items */}
                {itemsFiltres.length === 0 ? (
                    <div className="flex flex-col items-center py-4 text-gray-400">
                        <Layers className="mb-1 h-5 w-5" />
                        <p className="text-[10px]">Aucune section copiée</p>
                        <p className="text-[9px]">Copiez une section pour la réutiliser</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {itemsFiltres.map(item => (
                            <div key={item.id} className="flex items-center gap-1.5 rounded-md border border-gray-100 px-2 py-1.5 transition-colors hover:bg-gray-50">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[10px] font-medium text-gray-700">{item.nom}</p>
                                    <p className="text-[9px] text-gray-400">{item.type} · {new Date(item.timestamp).toLocaleDateString('fr-FR')}</p>
                                </div>
                                <button
                                    onClick={() => handleColler(item.id)}
                                    className="rounded p-0.5 text-green-500 hover:bg-green-50"
                                    title="Coller dans la page"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                                <button
                                    onClick={() => handleExporter(item.id)}
                                    className="rounded p-0.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                                    title="Exporter JSON"
                                >
                                    <Copy className="h-3 w-3" />
                                </button>
                                <button
                                    onClick={() => supprimerItem(item.id)}
                                    className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
