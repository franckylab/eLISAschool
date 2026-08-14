/**
 * ==================================
 * eLISAschool - Page Templates CMS
 * ==================================
 * Route: /_auth/cms/templates
 * Liste des templates disponibles avec aperçu et instanciation.
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCmsTemplates, useInstancierTemplate } from '@/features/cms/hooks/use-cms-admin';
import type { CmsTemplate } from '@/features/cms/types/cms.types';
import { Layers, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_auth/cms/templates')({
    component: CmsTemplatesPage,
});

function CmsTemplatesPage() {
    const navigate = useNavigate();
    const { data: templates, isLoading } = useCmsTemplates();
    const instancier = useInstancierTemplate();

    const handleInstancier = async (tpl: CmsTemplate) => {
        try {
            const result = await instancier.mutateAsync({
                code: tpl.code,
                titre: tpl.nom,
            });
            toast.success(`Page "${tpl.nom}" créée depuis le template`);
            if (result?.data?.id) {
                navigate({ to: '/cms/pages/$id', params: { id: result.data.id } });
            }
        } catch {
            toast.error('Erreur lors de la création');
        }
    };

    const categorieLabels: Record<string, { label: string; color: string }> = {
        accueil: { label: 'Accueil', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        page: { label: 'Page', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        special: { label: 'Spécial', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            {/* En-tête */}
            <div>
                <h1 className="text-2xl font-bold">Templates</h1>
                <p className="text-sm text-muted-foreground">
                    Modèles de pages pré-conçus pour démarrer rapidement
                </p>
            </div>

            {/* Liste des templates */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                </div>
            ) : !(templates || []).length ? (
                <div className="rounded-xl border py-20 text-center">
                    <Layers className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4 text-sm text-muted-foreground">Aucun template disponible</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {(templates || []).map((tpl: CmsTemplate) => {
                        const cat = categorieLabels[tpl.categorie] || categorieLabels.page;
                        return (
                            <div
                                key={tpl.id}
                                className="group flex flex-col overflow-hidden rounded-xl border transition-all hover:border-primary/30 hover:shadow-md"
                            >
                                {/* Preview gradient */}
                                <div
                                    className="flex h-32 items-center justify-center"
                                    style={{
                                        background: tpl.categorie === 'accueil'
                                            ? 'linear-gradient(135deg, #28a745, #007bff)'
                                            : tpl.categorie === 'special'
                                                ? 'linear-gradient(135deg, #7c3aed, #f59e0b)'
                                                : 'linear-gradient(135deg, #2563eb, #06b6d4)',
                                    }}
                                >
                                    <Layers className="h-10 w-10 text-white/80" />
                                </div>

                                {/* Contenu */}
                                <div className="flex flex-1 flex-col p-5">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cat.color}`}>
                                            {cat.label}
                                        </span>
                                        {tpl.estSysteme && (
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                Système
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="mb-1 text-base font-semibold">{tpl.nom}</h3>
                                    <p className="mb-4 flex-1 text-xs text-muted-foreground line-clamp-2">
                                        {tpl.description}
                                    </p>

                                    {/* Sections count */}
                                    <div className="mb-4 flex flex-wrap gap-1">
                                        {tpl.sectionsDef?.map((s, i) => (
                                            <span
                                                key={i}
                                                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                            >
                                                {s.type}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Bouton appliquer */}
                                    <button
                                        onClick={() => handleInstancier(tpl)}
                                        disabled={instancier.isPending}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {instancier.isPending ? 'Création...' : 'Appliquer ce template'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
