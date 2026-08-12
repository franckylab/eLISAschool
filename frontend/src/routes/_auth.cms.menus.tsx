/**
 * ==================================
 * eLISAschool - Éditeur navigation CMS
 * ==================================
 * Route: /_auth/cms/menus
 * Gestion menus par emplacement (principal, pied_page, lateral),
 * ajout/suppression d'items, réorganisation.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import {
    useCmsMenus, useCreerMenu, useModifierMenu, useSupprimerMenu,
} from '@/features/cms/hooks/use-cms-admin';
import { EmplacementMenu } from '@/features/cms/types/cms.types';
import type { CmsMenu, CmsMenuItem } from '@/features/cms/types/cms.types';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, ExternalLink, Link2, Edit3, X, Check, Menu as MenuIcon } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_auth/cms/menus')({
    component: CmsMenusPage,
});

const EMPLACEMENT_LABELS: Record<EmplacementMenu, string> = {
    [EmplacementMenu.PRINCIPAL]: 'Navigation principale',
    [EmplacementMenu.PIED_PAGE]: 'Pied de page',
    [EmplacementMenu.LATERAL]: 'Menu latéral',
};

const EMPLACEMENT_COLORS: Record<EmplacementMenu, string> = {
    [EmplacementMenu.PRINCIPAL]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    [EmplacementMenu.PIED_PAGE]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    [EmplacementMenu.LATERAL]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

function CmsMenusPage() {
    const { data: menus, isLoading } = useCmsMenus();
    const creerMenu = useCreerMenu();
    const modifierMenu = useModifierMenu();
    const supprimerMenu = useSupprimerMenu();

    const [menuSelectionne, setMenuSelectionne] = useState<string | null>(null);
    const [showCreer, setShowCreer] = useState(false);
    const [nouveauNom, setNouveauNom] = useState('');
    const [nouvelEmplacement, setNouvelEmplacement] = useState<EmplacementMenu>(EmplacementMenu.PRINCIPAL);

    // Édition item
    const [itemEnEdition, setItemEnEdition] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const [editNouvelOnglet, setEditNouvelOnglet] = useState(false);

    // Grouper par emplacement
    const menusParEmplacement = useMemo(() => {
        const grouped: Record<string, CmsMenu[]> = {};
        for (const emp of Object.values(EmplacementMenu)) {
            grouped[emp] = (menus || []).filter(m => m.emplacement === emp);
        }
        return grouped;
    }, [menus]);

    const menuActif = useMemo(() => {
        return (menus || []).find(m => m.id === menuSelectionne) || null;
    }, [menus, menuSelectionne]);

    // Créer un menu
    const handleCreerMenu = async () => {
        if (!nouveauNom.trim()) return;
        try {
            await creerMenu.mutateAsync({
                nom: nouveauNom.trim(),
                emplacement: nouvelEmplacement,
                items: [],
            });
            setNouveauNom('');
            setShowCreer(false);
            toast.success('Menu créé');
        } catch {
            toast.error('Erreur lors de la création');
        }
    };

    // Supprimer un menu
    const handleSupprimerMenu = async (id: string) => {
        if (!confirm('Supprimer ce menu et tous ses items ?')) return;
        try {
            await supprimerMenu.mutateAsync(id);
            if (menuSelectionne === id) setMenuSelectionne(null);
            toast.success('Menu supprimé');
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    // Ajouter un item
    const handleAjouterItem = async (menuId: string) => {
        const menu = (menus || []).find(m => m.id === menuId);
        if (!menu) return;
        const maxOrdre = menu.items.length > 0 ? Math.max(...menu.items.map(i => i.ordre)) + 1 : 0;
        try {
            await modifierMenu.mutateAsync({
                id: menuId,
                items: [...menu.items, {
                    id: `temp-${Date.now()}`,
                    label: 'Nouvel élément',
                    url: '#',
                    ordre: maxOrdre,
                    ouvrirdansNouvelOnglet: false,
                }],
            });
        } catch {
            toast.error('Erreur lors de l\'ajout');
        }
    };

    // Supprimer un item
    const handleSupprimerItem = async (menuId: string, itemId: string) => {
        const menu = (menus || []).find(m => m.id === menuId);
        if (!menu) return;
        try {
            await modifierMenu.mutateAsync({
                id: menuId,
                items: menu.items.filter(i => i.id !== itemId),
            });
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    // Déplacer un item
    const handleDeplacerItem = async (menuId: string, index: number, direction: 'up' | 'down') => {
        const menu = (menus || []).find(m => m.id === menuId);
        if (!menu) return;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= menu.items.length) return;

        const nouveauxItems = [...menu.items];
        const temp = nouveauxItems[index];
        nouveauxItems[index] = { ...nouveauxItems[newIndex], ordre: index };
        nouveauxItems[newIndex] = { ...temp, ordre: newIndex };

        try {
            await modifierMenu.mutateAsync({ id: menuId, items: nouveauxItems });
        } catch {
            toast.error('Erreur lors du réordonnement');
        }
    };

    // Sauvegarder édition item
    const handleSauvegarderItem = async (menuId: string) => {
        const menu = (menus || []).find(m => m.id === menuId);
        if (!menu) return;
        try {
            await modifierMenu.mutateAsync({
                id: menuId,
                items: menu.items.map(i =>
                    i.id === itemEnEdition
                        ? { ...i, label: editLabel, url: editUrl, ouvrirdansNouvelOnglet: editNouvelOnglet }
                        : i
                ),
            });
            setItemEnEdition(null);
            toast.success('Élément sauvegardé');
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        }
    };

    // Commencer édition
    const handleCommencerEdition = (item: CmsMenuItem) => {
        setItemEnEdition(item.id);
        setEditLabel(item.label);
        setEditUrl(item.url || '');
        setEditNouvelOnglet(item.ouvrirdansNouvelOnglet);
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Navigation</h1>
                    <p className="text-sm text-muted-foreground">Gérez les menus de votre site public</p>
                </div>
                <button
                    onClick={() => setShowCreer(!showCreer)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    Nouveau menu
                </button>
            </div>

            {/* Formulaire création */}
            {showCreer && (
                <div className="rounded-xl border bg-card p-4">
                    <h3 className="mb-3 text-sm font-semibold">Créer un menu</h3>
                    <div className="flex flex-wrap gap-3">
                        <input
                            type="text"
                            value={nouveauNom}
                            onChange={(e) => setNouveauNom(e.target.value)}
                            placeholder="Nom du menu"
                            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                            style={{ minWidth: '200px' }}
                        />
                        <select
                            value={nouvelEmplacement}
                            onChange={(e) => setNouvelEmplacement(e.target.value as EmplacementMenu)}
                            className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {Object.entries(EMPLACEMENT_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleCreerMenu}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Créer
                        </button>
                    </div>
                </div>
            )}

            {/* Contenu */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                </div>
            ) : !menus?.length ? (
                <div className="rounded-xl border py-20 text-center">
                    <MenuIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm text-muted-foreground">Aucun menu</p>
                    <p className="text-xs text-muted-foreground">Créez votre premier menu pour commencer</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(EMPLACEMENT_LABELS).map(([emp, label]) => {
                        const menusEmp = menusParEmplacement[emp] || [];
                        if (!menusEmp.length) return null;
                        return (
                            <div key={emp}>
                                <div className="mb-3 flex items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${EMPLACEMENT_COLORS[emp as EmplacementMenu]}`}>
                                        {label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{menusEmp.length} menu{menusEmp.length > 1 ? 's' : ''}</span>
                                </div>
                                <div className="space-y-3">
                                    {menusEmp.map(menu => (
                                        <div
                                            key={menu.id}
                                            className={`rounded-xl border transition-all ${
                                                menuSelectionne === menu.id ? 'border-primary bg-primary/5' : 'bg-card hover:border-muted-foreground/30'
                                            }`}
                                        >
                                            {/* Header menu */}
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <button
                                                    onClick={() => setMenuSelectionne(menuSelectionne === menu.id ? null : menu.id)}
                                                    className="flex-1 text-left text-sm font-medium"
                                                >
                                                    {menu.nom}
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        ({menu.items.length} élément{menu.items.length > 1 ? 's' : ''})
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => handleSupprimerMenu(menu.id)}
                                                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Items (si déplié) */}
                                            {menuSelectionne === menu.id && (
                                                <div className="p-4">
                                                    {menu.items.length === 0 ? (
                                                        <p className="py-4 text-center text-xs text-muted-foreground">
                                                            Aucun élément — cliquez sur "Ajouter" pour commencer
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {menu.items
                                                                .sort((a, b) => a.ordre - b.ordre)
                                                                .map((item, index) => (
                                                                    <div key={item.id}>
                                                                        {itemEnEdition === item.id ? (
                                                                            /* Mode édition */
                                                                            <div className="rounded-lg border bg-card p-3">
                                                                                <div className="space-y-2">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editLabel}
                                                                                        onChange={(e) => setEditLabel(e.target.value)}
                                                                                        placeholder="Libellé"
                                                                                        className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                                                                    />
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editUrl}
                                                                                        onChange={(e) => setEditUrl(e.target.value)}
                                                                                        placeholder="URL (ex: /e/code/page)"
                                                                                        className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                                                                    />
                                                                                    <label className="flex items-center gap-2 text-xs">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={editNouvelOnglet}
                                                                                            onChange={(e) => setEditNouvelOnglet(e.target.checked)}
                                                                                            className="rounded"
                                                                                        />
                                                                                        Ouvrir dans un nouvel onglet
                                                                                    </label>
                                                                                </div>
                                                                                <div className="mt-2 flex justify-end gap-2">
                                                                                    <button
                                                                                        onClick={() => setItemEnEdition(null)}
                                                                                        className="rounded-lg border px-3 py-1 text-xs hover:bg-muted"
                                                                                    >
                                                                                        Annuler
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleSauvegarderItem(menu.id)}
                                                                                        className="rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                                                                                    >
                                                                                        <Check className="mr-1 inline h-3 w-3" />
                                                                                        Sauvegarder
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            /* Mode affichage */
                                                                            <div className="group flex items-center gap-2 rounded-lg border bg-card px-3 py-2 transition-colors hover:border-muted-foreground/30">
                                                                                <GripVertical className="h-4 w-4 cursor-grab opacity-30" />
                                                                                <span className="flex-1 truncate text-sm">{item.label}</span>
                                                                                <span className="max-w-[200px] truncate text-xs text-muted-foreground">
                                                                                    {item.url}
                                                                                </span>
                                                                                {item.ouvrirdansNouvelOnglet && (
                                                                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                                                                )}
                                                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                    <button
                                                                                        onClick={() => handleDeplacerItem(menu.id, index, 'up')}
                                                                                        disabled={index === 0}
                                                                                        className="rounded p-1 hover:bg-muted disabled:opacity-30"
                                                                                    >
                                                                                        <ChevronUp className="h-3 w-3" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDeplacerItem(menu.id, index, 'down')}
                                                                                        disabled={index === menu.items.length - 1}
                                                                                        className="rounded p-1 hover:bg-muted disabled:opacity-30"
                                                                                    >
                                                                                        <ChevronDown className="h-3 w-3" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleCommencerEdition(item)}
                                                                                        className="rounded p-1 text-blue-600 hover:bg-blue-50"
                                                                                    >
                                                                                        <Edit3 className="h-3 w-3" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleSupprimerItem(menu.id, item.id)}
                                                                                        className="rounded p-1 text-red-500 hover:bg-red-50"
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => handleAjouterItem(menu.id)}
                                                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        Ajouter un élément
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
