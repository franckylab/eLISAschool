/**
 * ==================================
 * eLISAschool - Bibliothèque de sections CMS sauvegardables
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Système de sauvegarde/chargement de sections individuelles
 * comme templates réutilisables. Stockage localStorage par établissement.
 * Panneau intégré dans l'éditeur Puck.
 */

import { useState, useCallback, useMemo } from 'react';
import { Bookmark, Trash2, Plus, Search, FolderOpen, Copy } from 'lucide-react';
import type { Data } from '@puckeditor/core';
import { PUCK_TO_SECTION_TYPE } from '../puck/config';
import { toast } from 'sonner';

// ==================================
// Types
// ==================================

export interface SavedSection {
    id: string;
    nom: string;
    type: string;
    description?: string;
    data: {
        type: string;
        props: Record<string, any>;
    };
    createdAt: string;
    updatedAt: string;
}

// ==================================
// Storage key
// ==================================

const STORAGE_KEY = 'cms:section-library';

// ==================================
// Helpers localStorage
// ==================================

function chargerBibliotheque(): SavedSection[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function sauvegarderBibliotheque(sections: SavedSection[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    } catch {
        // localStorage plein ou désactivé
    }
}

// ==================================
// Hook useSectionLibrary
// ==================================

export function useSectionLibrary() {
    const [bibliotheque, setBibliotheque] = useState<SavedSection[]>(chargerBibliotheque);
    const [recherche, setRecherche] = useState('');

    const bibliothequeFiltree = useMemo(() => {
        if (!recherche) return bibliotheque;
        const q = recherche.toLowerCase();
        return bibliotheque.filter(s =>
            s.nom.toLowerCase().includes(q) ||
            s.type.toLowerCase().includes(q) ||
            (s.description || '').toLowerCase().includes(q)
        );
    }, [bibliotheque, recherche]);

    /** Sauvegarder une section depuis Puck */
    const sauvegarderSection = useCallback((puckItem: { type: string; props: Record<string, any> }, nom: string, description?: string) => {
        const sectionType = PUCK_TO_SECTION_TYPE[puckItem.type] || puckItem.type;
        const { id: _oldId, ...props } = puckItem.props;

        const nouvelle: SavedSection = {
            id: `saved_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            nom,
            type: sectionType,
            description,
            data: {
                type: puckItem.type,
                props: { ...props, id: `new_${Date.now()}` },
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setBibliotheque(prev => {
            const updated = [...prev, nouvelle];
            sauvegarderBibliotheque(updated);
            return updated;
        });

        toast.success(`Section "${nom}" sauvegardée`);
    }, []);

    /** Supprimer une section sauvegardée */
    const supprimerSection = useCallback((id: string) => {
        setBibliotheque(prev => {
            const updated = prev.filter(s => s.id !== id);
            sauvegarderBibliotheque(updated);
            return updated;
        });
        toast.info('Section supprimée de la bibliothèque');
    }, []);

    /** Insérer une section sauvegardée dans Puck */
    const insererSection = useCallback((saved: SavedSection, currentData: Data): Data => {
        const newContent = [
            ...currentData.content,
            { ...saved.data, props: { ...saved.data.props, id: `new_${Date.now()}` } },
        ];
        return { content: newContent, root: currentData.root };
    }, []);

    return {
        bibliotheque: bibliothequeFiltree,
        total: bibliotheque.length,
        recherche,
        setRecherche,
        sauvegarderSection,
        supprimerSection,
        insererSection,
    };
}

// ==================================
// Composant SectionLibraryPanel
// ==================================

interface SectionLibraryPanelProps {
    onInsert: (data: Data) => void;
    currentData: Data;
}

export function SectionLibraryPanel({ onInsert, currentData }: SectionLibraryPanelProps) {
    const {
        bibliotheque,
        total,
        recherche,
        setRecherche,
        sauvegarderSection,
        supprimerSection,
        insererSection,
    } = useSectionLibrary();

    const [showSaveForm, setShowSaveForm] = useState(false);
    const [nomNouveau, setNomNouveau] = useState('');
    const [descNouveau, setDescNouveau] = useState('');
    const [selectedForSave, setSelectedForSave] = useState<number | null>(null);

    // Sauvegarder la section sélectionnée du Puck data
    const handleSauvegarder = useCallback(() => {
        if (selectedForSave === null || !nomNouveau.trim()) return;
        const item = currentData.content[selectedForSave];
        if (!item) return;

        sauvegarderSection(item, nomNouveau.trim(), descNouveau.trim() || undefined);
        setNomNouveau('');
        setDescNouveau('');
        setSelectedForSave(null);
        setShowSaveForm(false);
    }, [selectedForSave, nomNouveau, descNouveau, currentData, sauvegarderSection]);

    return (
        <div className="p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    {total} section{total > 1 ? 's' : ''} sauvegardée{total > 1 ? 's' : ''}
                </p>
                <button
                    onClick={() => setShowSaveForm(!showSaveForm)}
                    className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                >
                    <Plus className="h-3 w-3" />
                    Sauvegarder
                </button>
            </div>

            {/* Formulaire de sauvegarde */}
            {showSaveForm && (
                <div className="space-y-2 rounded-lg border bg-gray-50 p-2 dark:bg-gray-800/50">
                    <p className="text-xs font-medium">Sauvegarder une section</p>
                    {/* Sélection de la section dans Puck */}
                    <select
                        value={selectedForSave ?? ''}
                        onChange={(e) => setSelectedForSave(e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded border px-2 py-1 text-xs"
                    >
                        <option value="">— Choisir une section —</option>
                        {currentData.content.map((item, i) => {
                            const type = PUCK_TO_SECTION_TYPE[item.type] || item.type;
                            const titre = (item.props as any)?.titre || type;
                            return (
                                <option key={i} value={i}>
                                    {i + 1}. {titre} ({type})
                                </option>
                            );
                        })}
                    </select>
                    <input
                        type="text"
                        placeholder="Nom du template"
                        value={nomNouveau}
                        onChange={(e) => setNomNouveau(e.target.value)}
                        className="w-full rounded border px-2 py-1 text-xs"
                    />
                    <input
                        type="text"
                        placeholder="Description (optionnel)"
                        value={descNouveau}
                        onChange={(e) => setDescNouveau(e.target.value)}
                        className="w-full rounded border px-2 py-1 text-xs"
                    />
                    <div className="flex gap-1">
                        <button
                            onClick={handleSauvegarder}
                            disabled={selectedForSave === null || !nomNouveau.trim()}
                            className="flex-1 rounded bg-primary px-2 py-1 text-xs text-white disabled:opacity-50"
                        >
                            Sauvegarder
                        </button>
                        <button
                            onClick={() => setShowSaveForm(false)}
                            className="rounded px-2 py-1 text-xs hover:bg-gray-200"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Recherche */}
            {total > 3 && (
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full rounded-lg border py-1.5 pl-7 pr-2 text-xs"
                    />
                </div>
            )}

            {/* Liste des sections sauvegardées */}
            {bibliotheque.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <FolderOpen className="h-8 w-8 text-gray-300" />
                    <p className="text-xs text-gray-500">
                        {recherche ? 'Aucun résultat' : 'Aucune section sauvegardée'}
                    </p>
                    {!recherche && (
                        <p className="text-[10px] text-gray-400">
                            Sélectionnez une section dans l'éditeur et sauvegardez-la comme template.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-1.5">
                    {bibliotheque.map((saved) => (
                        <div
                            key={saved.id}
                            className="group flex items-center gap-2 rounded-lg border p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                            <Bookmark className="h-4 w-4 shrink-0 text-primary/60" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">{saved.nom}</p>
                                <p className="truncate text-[10px] text-gray-500">
                                    {saved.type} {saved.description && `· ${saved.description}`}
                                </p>
                            </div>
                            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                    onClick={() => {
                                        const newData = insererSection(saved, currentData);
                                        onInsert(newData);
                                        toast.success(`"${saved.nom}" insérée`);
                                    }}
                                    className="rounded p-1 text-green-600 hover:bg-green-50"
                                    title="Insérer"
                                >
                                    <Copy className="h-3 w-3" />
                                </button>
                                <button
                                    onClick={() => supprimerSection(saved.id)}
                                    className="rounded p-1 text-red-500 hover:bg-red-50"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
