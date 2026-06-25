/**
 * ==================================
 * eLISAschool - Page Apparence (Fonds d'écran + Configuration)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Page de gestion des fonds d'écran SVG et configuration de la rotation automatique.
 * Accessible à /apparence
 */

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals/CustomModal';
import { toast } from 'sonner';
import {
    Image,
    Upload,
    Settings,
    Play,
    Pause,
    Clock,
    Trash2,
    Plus,
    Eye,
    EyeOff,
} from 'lucide-react';
import {
    useCatalogueFonds,
    useFondsEtablissement,
    useConfigRotation,
    useAjouterFondEtablissement,
    useSupprimerFondEtablissement,
    useUpdateConfigRotation,
} from './hooks';
import { CATEGORIE_LABELS, CategorieFond } from './types';
import type { Fond } from './types';

export function ApparencePage() {
    const [filtreCategorie, setFiltreCategorie] = useState<CategorieFond | 'toutes'>('toutes');
    const [showCatalogue, setShowCatalogue] = useState(false);

    // Hooks
    const { data: catalogue, isLoading: loadingCatalogue } = useCatalogueFonds();
    const { data: fondsEtab, isLoading: loadingFonds } = useFondsEtablissement();
    const { data: config, isLoading: loadingConfig } = useConfigRotation();
    const ajouterFond = useAjouterFondEtablissement();
    const supprimerFond = useSupprimerFondEtablissement();
    const updateConfig = useUpdateConfigRotation();

    const rotationActive = config?.actif ?? false;
    const delaiRotation = config?.delaiRotation ?? 86400;

    // Filtrer le catalogue par catégorie (avec fallback tableau vide)
    const catalogueSafe = catalogue ?? [];
    const catalogueFiltre = filtreCategorie === 'toutes'
        ? catalogueSafe
        : catalogueSafe.filter((f) => f.categorie === filtreCategorie);

    // Gestion toggle rotation
    const handleToggleRotation = async () => {
        try {
            await updateConfig.mutateAsync({
                actif: !rotationActive,
                delaiRotation,
            });
            toast.success(rotationActive ? 'Rotation désactivée' : 'Rotation activée');
        } catch {
            toast.error('Erreur lors de la modification de la rotation');
        }
    };

    // Gestion modification délai
    const handleChangerDelai = async (nouveauDelai: number) => {
        if (nouveauDelai < 10 || nouveauDelai > 700000) {
            toast.error('Le délai doit être entre 10s et 700000s (~8 jours)');
            return;
        }
        try {
            await updateConfig.mutateAsync({
                actif: rotationActive,
                delaiRotation: nouveauDelai,
            });
            toast.success('Délai de rotation mis à jour');
        } catch {
            toast.error('Erreur lors de la modification du délai');
        }
    };

    // Ajouter un fond à l'établissement
    const handleAjouterFond = async (fond: Fond) => {
        try {
            await ajouterFond.mutateAsync({ fondId: fond.id });
            toast.success(`Fond "${fond.nom}" ajouté à votre établissement`);
        } catch {
            toast.error('Erreur lors de l\'ajout du fond');
        }
    };

    // Supprimer un fond de l'établissement
    const handleSupprimerFond = async (id: string) => {
        try {
            await supprimerFond.mutateAsync(id);
            toast.success('Fond retiré de votre établissement');
        } catch {
            toast.error('Erreur lors de la suppression du fond');
        }
    };

    // Formater le délai en format lisible
    const formatDelai = (secondes: number): string => {
        if (secondes < 60) return `${secondes}s`;
        if (secondes < 3600) return `${Math.floor(secondes / 60)}min`;
        if (secondes < 86400) return `${Math.floor(secondes / 3600)}h`;
        return `${Math.floor(secondes / 86400)}j`;
    };

    return (
        <div className="min-h-screen">
            <PageHeader
                titre="Apparence"
                sousTitre="Gérez les fonds d'écran et la rotation automatique"
                actions={
                    <ElisaButton
                        variant="primary"
                        onClick={() => setShowCatalogue(true)}
                        icon={<Plus className="h-4 w-4" />}
                    >
                        Ajouter un fond
                    </ElisaButton>
                }
            />

            {/* Configuration de la rotation */}
            <section className="mx-auto max-w-4xl rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-lg)]">
                <div className="mb-[var(--space-md)] flex items-center gap-[var(--gap-sm)]">
                    <Settings className="h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-dominant-600)]" />
                    <h2 style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}>
                        Configuration de la rotation
                    </h2>
                </div>

                <div className="flex flex-col gap-[var(--gap-md)]">
                    {/* Toggle rotation */}
                    <div className="flex items-center justify-between rounded-lg bg-[var(--color-fond)] p-[var(--space-md)]">
                        <div className="flex items-center gap-[var(--gap-sm)]">
                            {rotationActive ? (
                                <Play className="h-[var(--icon-md)] w-[var(--icon-md)] text-green-600" />
                            ) : (
                                <Pause className="h-[var(--icon-md)] w-[var(--icon-md)] text-gray-400" />
                            )}
                            <div>
                                <p style={{ fontSize: 'var(--text-base)' }}>
                                    Rotation automatique
                                </p>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                    {rotationActive ? 'Activée' : 'Désactivée'}
                                </p>
                            </div>
                        </div>
                        <ElisaButton
                            variant={rotationActive ? 'danger' : 'primary'}
                            taille="sm"
                            onClick={handleToggleRotation}
                            chargement={updateConfig.isPending}
                        >
                            {rotationActive ? 'Désactiver' : 'Activer'}
                        </ElisaButton>
                    </div>

                    {/* Délai de rotation */}
                    <div className="flex items-center justify-between rounded-lg bg-[var(--color-fond)] p-[var(--space-md)]">
                        <div className="flex items-center gap-[var(--gap-sm)]">
                            <Clock className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-dominant-600)]" />
                            <div>
                                <p style={{ fontSize: 'var(--text-base)' }}>
                                    Délai de rotation
                                </p>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                    {formatDelai(delaiRotation)} ({delaiRotation}s)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-[var(--gap-xs)]">
                            {[60, 300, 3600, 86400].map((delai) => (
                                <ElisaButton
                                    key={delai}
                                    variant={delai === delaiRotation ? 'primary' : 'outline'}
                                    taille="xs"
                                    onClick={() => handleChangerDelai(delai)}
                                    chargement={updateConfig.isPending}
                                >
                                    {formatDelai(delai)}
                                </ElisaButton>
                            ))}
                        </div>
                    </div>

                    {/* Statistiques */}
                    <div className="rounded-lg bg-[var(--color-fond)] p-[var(--space-md)]">
                        <p style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                            Fonds actifs : {fondsEtab?.filter((f) => f.actif).length ?? 0} / {fondsEtab?.length ?? 0}
                        </p>
                    </div>
                </div>
            </section>

            {/* Liste des fonds de l'établissement */}
            <section className="mx-auto mt-[var(--space-lg)] max-w-4xl">
                <h2 style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}>
                    Fonds de votre établissement
                </h2>

                {loadingFonds ? (
                    <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)' }}>
                        Chargement...
                    </p>
                ) : !fondsEtab || fondsEtab.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--color-bordure)] p-[var(--space-xl)] text-center">
                        <Image className="mx-auto mb-[var(--space-md)] h-[var(--icon-lg)] w-[var(--icon-lg)] text-gray-400" />
                        <p style={{ fontSize: 'var(--text-base)' }}>Aucun fond configuré</p>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                            Cliquez sur "Ajouter un fond" pour commencer
                        </p>
                    </div>
                ) : (
                    <div className="mt-[var(--space-md)] grid grid-cols-1 gap-[var(--gap-md)] sm:grid-cols-2 lg:grid-cols-3">
                        {fondsEtab.map((fe) => (
                            <div
                                key={fe.id}
                                className="relative rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]"
                            >
                                <div className="mb-[var(--space-sm)] flex items-start justify-between">
                                    <div>
                                        <p style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                                            {fe.fond.nom}
                                        </p>
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                            {CATEGORIE_LABELS[fe.fond.categorie]}
                                        </p>
                                    </div>
                                    {fe.actif ? (
                                        <Eye className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-green-600" />
                                    ) : (
                                        <EyeOff className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-gray-400" />
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                        Ordre: {fe.ordre}
                                    </span>
                                    <ElisaButton
                                        variant="danger"
                                        taille="xs"
                                        onClick={() => handleSupprimerFond(fe.id)}
                                        chargement={supprimerFond.isPending}
                                        icon={<Trash2 className="h-3 w-3" />}
                                    >
                                        Retirer
                                    </ElisaButton>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Modal catalogue */}
            <CustomModal
                open={showCatalogue}
                onOpenChange={(v) => { if (!v) setShowCatalogue(false); }}
                title="Choisir un fond d'écran"
                description="Sélectionnez un fond dans le catalogue pour l'ajouter à votre établissement"
                size="3xl"
            >
                <div className="flex flex-col gap-[var(--gap-md)]">
                    {/* Filtres par catégorie */}
                    <div className="flex flex-wrap gap-[var(--gap-xs)]">
                        <ElisaButton
                            variant={filtreCategorie === 'toutes' ? 'primary' : 'outline'}
                            taille="xs"
                            onClick={() => setFiltreCategorie('toutes')}
                        >
                            Toutes
                        </ElisaButton>
                        {Object.entries(CATEGORIE_LABELS).map(([value, label]) => (
                            <ElisaButton
                                key={value}
                                variant={filtreCategorie === value ? 'primary' : 'outline'}
                                taille="xs"
                                onClick={() => setFiltreCategorie(value as CategorieFond)}
                            >
                                {label}
                            </ElisaButton>
                        ))}
                    </div>

                    {/* Grille de fonds */}
                    {loadingCatalogue ? (
                        <p style={{ fontSize: 'var(--text-base)' }}>Chargement du catalogue...</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-[var(--gap-md)] sm:grid-cols-2 md:grid-cols-3">
                            {catalogueFiltre?.map((fond) => {
                                const dejaAjoute = fondsEtab?.some((fe) => fe.fondId === fond.id);

                                return (
                                    <div
                                        key={fond.id}
                                        className="rounded-lg border border-[var(--color-bordure)] p-[var(--space-md)]"
                                    >
                                        <p style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                                            {fond.nom}
                                        </p>
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                            {CATEGORIE_LABELS[fond.categorie]}
                                        </p>

                                        <ElisaButton
                                            variant="primary"
                                            taille="sm"
                                            fullWidth
                                            className="mt-[var(--space-sm)]"
                                            onClick={() => handleAjouterFond(fond)}
                                            chargement={ajouterFond.isPending}
                                            disabled={dejaAjoute}
                                        >
                                            {dejaAjoute ? 'Déjà ajouté' : 'Ajouter'}
                                        </ElisaButton>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CustomModal>
        </div>
    );
}
