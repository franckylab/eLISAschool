/**
 * ==================================
 * eLISAschool - Gestion widgets CMS
 * ==================================
 * Route: /_auth/cms/widgets
 * CRUD widgets par emplacement (sidebar, pied_page, en_tete, flottant).
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import {
    useCmsWidgets, useCreerWidget, useModifierWidget, useSupprimerWidget,
} from '@/features/cms/hooks/use-cms-admin';
import { EmplacementWidget } from '@/features/cms/types/cms.types';
import type { CmsWidget } from '@/features/cms/types/cms.types';
import { Plus, Trash2, Edit3, Check, X, Settings, Eye, EyeOff, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_auth/cms/widgets')({
    component: CmsWidgetsPage,
});

const EMPLACEMENT_LABELS: Record<EmplacementWidget, string> = {
    [EmplacementWidget.SIDEBAR]: 'Barre latérale',
    [EmplacementWidget.PIED_PAGE]: 'Pied de page',
    [EmplacementWidget.EN_TETE]: 'En-tête',
    [EmplacementWidget.FLOTTANT]: 'Flottant',
};

const EMPLACEMENT_COLORS: Record<EmplacementWidget, string> = {
    [EmplacementWidget.SIDEBAR]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    [EmplacementWidget.PIED_PAGE]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    [EmplacementWidget.EN_TETE]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    [EmplacementWidget.FLOTTANT]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const TYPES_WIDGET = [
    { value: 'html', label: 'HTML personnalisé' },
    { value: 'texte', label: 'Bloc texte' },
    { value: 'image', label: 'Bannière image' },
    { value: 'contact', label: 'Formulaire contact rapide' },
    { value: 'reseaux', label: 'Réseaux sociaux' },
    { value: 'newsletter', label: 'Inscription newsletter' },
    { value: 'badge', label: 'Badge / Compteur' },
    { value: 'alerte', label: 'Bannière alerte' },
];

function CmsWidgetsPage() {
    const { data: widgets, isLoading } = useCmsWidgets();
    const creerWidget = useCreerWidget();
    const modifierWidget = useModifierWidget();
    const supprimerWidget = useSupprimerWidget();

    const [showCreer, setShowCreer] = useState(false);
    const [widgetEnEdition, setWidgetEnEdition] = useState<string | null>(null);

    // Formulaire création
    const [nouveauType, setNouveauType] = useState('html');
    const [nouveauTitre, setNouveauTitre] = useState('');
    const [nouvelEmplacement, setNouvelEmplacement] = useState<EmplacementWidget>(EmplacementWidget.SIDEBAR);

    // Formulaire édition
    const [editTitre, setEditTitre] = useState('');
    const [editContenu, setEditContenu] = useState('');
    const [editActif, setEditActif] = useState(true);

    // Grouper par emplacement
    const widgetsParEmplacement = useMemo(() => {
        const grouped: Record<string, CmsWidget[]> = {};
        for (const emp of Object.values(EmplacementWidget)) {
            grouped[emp] = (widgets || [])
                .filter(w => w.emplacement === emp)
                .sort((a, b) => a.ordre - b.ordre);
        }
        return grouped;
    }, [widgets]);

    // Créer widget
    const handleCreer = async () => {
        if (!nouveauTitre.trim()) return;
        try {
            const maxOrdre = (widgets || [])
                .filter(w => w.emplacement === nouvelEmplacement)
                .reduce((max, w) => Math.max(max, w.ordre), -1);
            await creerWidget.mutateAsync({
                type: nouveauType,
                titre: nouveauTitre.trim(),
                contenu: { html: '' },
                emplacement: nouvelEmplacement,
                ordre: maxOrdre + 1,
                actif: true,
            });
            setNouveauTitre('');
            setShowCreer(false);
            toast.success('Widget créé');
        } catch {
            toast.error('Erreur lors de la création');
        }
    };

    // Supprimer widget
    const handleSupprimer = async (id: string) => {
        if (!confirm('Supprimer ce widget ?')) return;
        try {
            await supprimerWidget.mutateAsync(id);
            toast.success('Widget supprimé');
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    // Toggle actif
    const handleToggleActif = async (widget: CmsWidget) => {
        try {
            await modifierWidget.mutateAsync({ id: widget.id, actif: !widget.actif });
            toast.success(widget.actif ? 'Widget désactivé' : 'Widget activé');
        } catch {
            toast.error('Erreur');
        }
    };

    // Commencer édition
    const handleCommencerEdition = (widget: CmsWidget) => {
        setWidgetEnEdition(widget.id);
        setEditTitre(widget.titre || '');
        setEditContenu(widget.contenu?.html || '');
        setEditActif(widget.actif);
    };

    // Sauvegarder édition
    const handleSauvegarder = async () => {
        if (!widgetEnEdition) return;
        try {
            await modifierWidget.mutateAsync({
                id: widgetEnEdition,
                titre: editTitre,
                contenu: { html: editContenu },
                actif: editActif,
            });
            setWidgetEnEdition(null);
            toast.success('Widget sauvegardé');
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Widgets</h1>
                    <p className="text-sm text-muted-foreground">
                        Gérez les widgets affichés sur votre site public
                    </p>
                </div>
                <button
                    onClick={() => setShowCreer(!showCreer)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    Nouveau widget
                </button>
            </div>

            {/* Formulaire création */}
            {showCreer && (
                <div className="rounded-xl border bg-card p-4">
                    <h3 className="mb-3 text-sm font-semibold">Créer un widget</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <input
                            type="text"
                            value={nouveauTitre}
                            onChange={(e) => setNouveauTitre(e.target.value)}
                            placeholder="Titre du widget"
                            className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <select
                            value={nouveauType}
                            onChange={(e) => setNouveauType(e.target.value)}
                            className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {TYPES_WIDGET.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        <select
                            value={nouvelEmplacement}
                            onChange={(e) => setNouvelEmplacement(e.target.value as EmplacementWidget)}
                            className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {Object.entries(EMPLACEMENT_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleCreer}
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
            ) : !widgets?.length ? (
                <div className="rounded-xl border py-20 text-center">
                    <Settings className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm text-muted-foreground">Aucun widget</p>
                    <p className="text-xs text-muted-foreground">Créez des widgets pour enrichir votre site</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(EMPLACEMENT_LABELS).map(([emp, label]) => {
                        const widgetsEmp = widgetsParEmplacement[emp] || [];
                        if (!widgetsEmp.length) return null;
                        return (
                            <div key={emp}>
                                <div className="mb-3 flex items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${EMPLACEMENT_COLORS[emp as EmplacementWidget]}`}>
                                        {label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{widgetsEmp.length} widget{widgetsEmp.length > 1 ? 's' : ''}</span>
                                </div>
                                <div className="space-y-2">
                                    {widgetsEmp.map(widget => (
                                        <div key={widget.id}>
                                            {widgetEnEdition === widget.id ? (
                                                /* Mode édition */
                                                <div className="rounded-xl border border-primary bg-primary/5 p-4">
                                                    <div className="space-y-3">
                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-muted-foreground">Titre</label>
                                                                <input
                                                                    type="text"
                                                                    value={editTitre}
                                                                    onChange={(e) => setEditTitre(e.target.value)}
                                                                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                                                                <div className="rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground">
                                                                    {TYPES_WIDGET.find(t => t.value === widget.type)?.label || widget.type}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Contenu HTML</label>
                                                            <textarea
                                                                value={editContenu}
                                                                onChange={(e) => setEditContenu(e.target.value)}
                                                                rows={4}
                                                                className="w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/50"
                                                                placeholder="<div>Contenu du widget...</div>"
                                                            />
                                                        </div>
                                                        <label className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={editActif}
                                                                onChange={(e) => setEditActif(e.target.checked)}
                                                                className="rounded"
                                                            />
                                                            Actif
                                                        </label>
                                                    </div>
                                                    <div className="mt-3 flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setWidgetEnEdition(null)}
                                                            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted"
                                                        >
                                                            Annuler
                                                        </button>
                                                        <button
                                                            onClick={handleSauvegarder}
                                                            className="rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
                                                        >
                                                            <Check className="mr-1 inline h-3 w-3" />
                                                            Sauvegarder
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Mode affichage */
                                                <div className={`group flex items-center gap-3 rounded-xl border p-3 transition-all ${
                                                    widget.actif
                                                        ? 'bg-card hover:border-muted-foreground/30'
                                                        : 'bg-muted/30 opacity-60'
                                                }`}>
                                                    <GripVertical className="h-4 w-4 cursor-grab opacity-30" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium truncate">{widget.titre || 'Sans titre'}</span>
                                                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                                {TYPES_WIDGET.find(t => t.value === widget.type)?.label || widget.type}
                                                            </span>
                                                        </div>
                                                        {widget.contenu?.html && (
                                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                                {widget.contenu.html.substring(0, 80)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleToggleActif(widget)}
                                                            className={`rounded-lg p-1.5 transition-colors ${
                                                                widget.actif
                                                                    ? 'text-green-600 hover:bg-green-50'
                                                                    : 'text-gray-400 hover:bg-muted'
                                                            }`}
                                                            title={widget.actif ? 'Désactiver' : 'Activer'}
                                                        >
                                                            {widget.actif ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleCommencerEdition(widget)}
                                                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSupprimer(widget.id)}
                                                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
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
