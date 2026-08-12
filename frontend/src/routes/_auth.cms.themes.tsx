/**
 * ==================================
 * eLISAschool - Gestion thèmes CMS
 * ==================================
 * Route: /_auth/cms/themes
 * Personnalisation couleurs, typographie, activation thème.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useCmsThemes, useActiverTheme } from '@/features/cms/hooks/use-cms-admin';
import { CmsThemeCustomizer } from '@/features/cms/components/CmsThemeCustomizer';
import type { CmsTheme } from '@/features/cms/types/cms.types';
import { Palette, Check, Plus, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const Route = createFileRoute('/_auth/cms/themes')({
    component: CmsThemesPage,
});

function CmsThemesPage() {
    const qc = useQueryClient();
    const { data: themes, isLoading } = useCmsThemes();
    const activerTheme = useActiverTheme();
    const [themeSelectionne, setThemeSelectionne] = useState<CmsTheme | null>(null);
    const [showCustomizer, setShowCustomizer] = useState(false);

    const creerThemeMutation = useMutation({
        mutationFn: (data: any) => apiClient.post('/api/cms/themes', data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });

    const modifierThemeMutation = useMutation({
        mutationFn: ({ id, ...data }: any) => apiClient.patch(`/api/cms/themes/${id}`, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); },
    });

    const handleActiver = async (id: string) => {
        try {
            await activerTheme.mutateAsync(id);
            toast.success('Thème activé');
        } catch {
            toast.error('Erreur lors de l\'activation');
        }
    };

    const handleCreerTheme = async () => {
        try {
            await creerThemeMutation.mutateAsync({
                nom: `Thème ${Date.now()}`,
                couleurs: { primaire: '#28a745', secondaire: '#20c997', accent: '#ffc107', fond: '#ffffff', texte: '#1a1a2e', texteClair: '#6c757d' },
                typographie: { titre: "'Inter', sans-serif", corps: "'Inter', sans-serif" },
            });
            toast.success('Thème créé');
        } catch {
            toast.error('Erreur lors de la création');
        }
    };

    const handleSauvegarderCustomizer = (updates: Partial<CmsTheme>) => {
        if (!themeSelectionne) return;
        modifierThemeMutation.mutate({
            id: themeSelectionne.id,
            ...updates,
        });
        toast.success('Thème sauvegardé');
    };

    const themeActif = themes?.find(t => t.actif);

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Thèmes</h1>
                    <p className="text-sm text-muted-foreground">
                        Personnalisez l'apparence de votre site public
                        {themeActif && <span className="ml-2 text-primary">• Thème actif : {themeActif.nom}</span>}
                    </p>
                </div>
                <button
                    onClick={handleCreerTheme}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    Nouveau thème
                </button>
            </div>

            {/* Grille thèmes */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                </div>
            ) : !themes?.length ? (
                <div className="rounded-xl border py-20 text-center">
                    <Palette className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm text-muted-foreground">Aucun thème</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {themes.map(theme => (
                        <div
                            key={theme.id}
                            className={`relative overflow-hidden rounded-xl border transition-all ${
                                theme.actif ? 'border-primary ring-2 ring-primary/20' : 'hover:border-muted-foreground/30'
                            }`}
                        >
                            {/* Preview couleurs */}
                            <div
                                className="h-32 p-4"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.couleurs?.primaire || '#28a745'}, ${theme.couleurs?.secondaire || '#20c997'})`,
                                }}
                            >
                                <div className="flex h-full flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="text-sm font-bold text-white"
                                            style={{ fontFamily: theme.typographie?.titre }}
                                        >
                                            {theme.nom}
                                        </span>
                                        {theme.actif && (
                                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                                                Actif
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {[theme.couleurs?.primaire, theme.couleurs?.secondaire, theme.couleurs?.accent].map((c, i) => (
                                            <div key={i} className="h-6 w-6 rounded-full border border-white/30" style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between border-t p-3">
                                <div className="text-xs text-muted-foreground">
                                    <span>{theme.typographie?.titre?.split("'")[1] || 'Inter'}</span>
                                </div>
                                <div className="flex gap-1">
                                    {!theme.actif && (
                                        <button
                                            onClick={() => handleActiver(theme.id)}
                                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                                        >
                                            Activer
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setThemeSelectionne(theme); setShowCustomizer(true); }}
                                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal customizer */}
            {showCustomizer && themeSelectionne && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCustomizer(false)}>
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="mb-4 text-lg font-bold">Personnaliser : {themeSelectionne.nom}</h2>
                        <CmsThemeCustomizer
                            theme={themeSelectionne}
                            onChange={(updates) => handleSauvegarderCustomizer(updates)}
                        />
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCustomizer(false)}
                                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
