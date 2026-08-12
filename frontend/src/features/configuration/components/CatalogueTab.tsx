/**
 * CatalogueTab — Onglet Catalogue des modules dans la page Configuration
 * P5.3 v7 — Utilise les composants réutilisables ModuleGrid + ModuleImpactAnalysis
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Package, Info } from 'lucide-react';
import { ModuleGrid } from '@/features/modules/components';
import { ModuleImpactAnalysis } from '@/features/modules/components';
import {
    useModuleRegistry,
    useToggleModule,
    useModuleImpact,
} from '@/features/configuration/hooks/use-configuration';
import { SchoolLoading } from '@/components/feedback';

export function CatalogueTab() {
    const { data: moduleStates, isLoading } = useModuleRegistry();
    const toggleMutation = useToggleModule();
    const [togglingModules, setTogglingModules] = useState<Set<string>>(new Set());
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [pendingToggle, setPendingToggle] = useState<{ code: string; actif: boolean } | null>(null);

    // Impact du module sélectionné
    const selectedEntry = moduleStates?.find(m => m.entry.name === selectedModule);
    const { data: impactData, isLoading: impactLoading } = useModuleImpact(
        pendingToggle?.code ?? selectedModule ?? '',
        pendingToggle?.actif ?? false,
    );

    const handleToggle = useCallback((code: string, actif: boolean) => {
        setPendingToggle({ code, actif });
        setSelectedModule(code);
    }, []);

    const confirmToggle = useCallback(() => {
        if (!pendingToggle) return;
        setTogglingModules(prev => new Set(prev).add(pendingToggle.code));

        toggleMutation.mutate(
            { moduleNom: pendingToggle.code, actif: pendingToggle.actif },
            {
                onSuccess: (data) => {
                    toast.success(data?.message || `Module ${pendingToggle.actif ? 'activé' : 'désactivé'}`);
                    if (data?.modulesAutoActive?.length) {
                        toast.info(`Auto-activation: ${data.modulesAutoActive.join(', ')}`);
                    }
                },
                onError: (error: any) => {
                    toast.error(error?.message || 'Erreur lors du toggle');
                },
                onSettled: () => {
                    setTogglingModules(prev => {
                        const next = new Set(prev);
                        next.delete(pendingToggle.code);
                        return next;
                    });
                    setPendingToggle(null);
                    setSelectedModule(null);
                },
            },
        );
    }, [pendingToggle, toggleMutation]);

    if (isLoading) {
        return <SchoolLoading message="Chargement du catalogue..." />;
    }

    if (!moduleStates || moduleStates.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                <p className="text-zinc-500">Aucun module disponible dans le catalogue</p>
            </div>
        );
    }

    const modules = moduleStates.map(ms => ({
        entry: ms.entry,
        actif: ms.actif,
    }));

    return (
        <div className="space-y-6">
            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
                <Info className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div className="text-sm text-sky-700 dark:text-sky-400">
                    <p className="font-medium">Catalogue des modules</p>
                    <p className="mt-1 text-sky-600/80 dark:text-sky-400/80">
                        Activez ou désactivez les modules pour votre établissement. Les modules critiques ne peuvent pas être désactivés.
                        Les dépendances sont automatiquement gérées.
                    </p>
                </div>
            </div>

            {/* Impact Analysis (si toggle en cours) */}
            {pendingToggle && selectedEntry && (
                <ModuleImpactAnalysis
                    moduleNom={pendingToggle.code}
                    moduleLabel={selectedEntry.entry.label}
                    action={pendingToggle.actif ? 'activate' : 'deactivate'}
                    impact={impactData}
                    isLoading={impactLoading}
                    onConfirm={confirmToggle}
                    onCancel={() => {
                        setPendingToggle(null);
                        setSelectedModule(null);
                    }}
                />
            )}

            {/* Module Grid */}
            <ModuleGrid
                modules={modules}
                onToggle={handleToggle}
                onSelect={(code) => setSelectedModule(code)}
                togglingModules={togglingModules}
            />
        </div>
    );
}

export default CatalogueTab;
