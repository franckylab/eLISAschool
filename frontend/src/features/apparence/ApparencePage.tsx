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
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
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
    Check,
    X,
    Maximize2,
    Monitor,
} from 'lucide-react';
import {
    useCatalogueFonds,
    useFondsEtablissement,
    useConfigRotation,
    useAjouterFondEtablissement,
    useSupprimerFondEtablissement,
    useUpdateConfigRotation,
    useModifierFondEtablissement,
} from './hooks';
import { CATEGORIE_LABELS, CategorieFond } from './types';
import type { Fond } from './types';
import { useFondActuel } from '@/components/layout/FondRotator';

export function ApparencePage() {
    const [filtreCategorie, setFiltreCategorie] = useState<CategorieFond | 'toutes'>('toutes');
    const [showCatalogue, setShowCatalogue] = useState(false);
    const [fondApercu, setFondApercu] = useState<string | null>(null);
    const [selectionnes, setSelectionnes] = useState<Set<string>>(new Set()); // IDs des fonds sélectionnés
    const [ajoutEnCours, setAjoutEnCours] = useState(false); // État pour ajout en batch

    // Hook pour connaître le fond actuellement affiché
    const { fondActuelId } = useFondActuel();

    // Mutation pour définir un fond comme actif
    const queryClient = useQueryClient();
    const appliquerFond = useMutation({
        mutationFn: async (fondEtabId: string) => {
            console.log('[Apparence] appliquerFond.mutate called avec:', { fondEtabId });
            
            // Pour les fonds système virtuels, créer une association réelle
            if (fondEtabId.startsWith('systeme-')) {
                // Extraire l'ID du fond catalogue
                const fondCatalogueId = fondEtabId.replace('systeme-', '');
                console.log('[Apparence] Fond système détecté, création association avec fondCatalogueId:', fondCatalogueId);
                
                // Créer une association réelle dans fonds_etablissement avec ordre=1
                const response = await apiClient.post('/api/apparence/fonds/etablissement', {
                    fondId: fondCatalogueId,
                    ordre: 1,
                    actif: true,
                });
                console.log('[Apparence] Association créée:', response.data);
                return response.data;
            }
            
            // Mettre à jour le fond pour le passer à ordre=1 et actif=true
            console.log('[Apparence] PATCH /api/apparence/fonds/etablissement/', fondEtabId, { ordre: 1, actif: true });
            const response = await apiClient.patch(`/api/apparence/fonds/etablissement/${fondEtabId}`, {
                ordre: 1,
                actif: true,
            });
            console.log('[Apparence] Réponse PATCH:', response.data);
            return response.data;
        },
        onSuccess: () => {
            console.log('[Apparence] onSuccess - invalidation et refetch');
            // Invalider et forcer le rechargement immédiat des caches
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'fonds'] });
            queryClient.invalidateQueries({ queryKey: ['apparence', 'etablissement', 'rotation'] });
            
            // Forcer le refetch immédiat pour que le FondRotator récupère les nouveaux fonds
            queryClient.refetchQueries({ 
                queryKey: ['apparence', 'etablissement', 'rotation'],
                type: 'active'
            });
            
            toast.success('Fond appliqué immédiatement');
        },
        onError: (error: any) => {
            console.error('[Apparence] Erreur application fond:', error);
            toast.error(error?.message || 'Erreur lors de l\'application du fond');
        },
    });

    // Hooks
    const { data: catalogueData, isLoading: loadingCatalogue } = useCatalogueFonds();
    const { data: fondsEtab, isLoading: loadingFonds } = useFondsEtablissement();
    const { data: config, isLoading: loadingConfig } = useConfigRotation();
    const ajouterFond = useAjouterFondEtablissement();
    const supprimerFond = useSupprimerFondEtablissement();
    const updateConfig = useUpdateConfigRotation();
    const modifierFond = useModifierFondEtablissement();

    const rotationActive = config?.actif ?? false;
    const delaiRotation = config?.delaiRotation ?? 86400;

    // Le catalogue retourne maintenant { fonds: Fond[], total: number }
    const catalogue = catalogueData?.fonds ?? [];

    // Filtrer le catalogue par catégorie (avec fallback tableau vide)
    const catalogueFiltre = filtreCategorie === 'toutes'
        ? catalogue
        : catalogue.filter((f) => f.categorie === filtreCategorie);

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

    // Ajouter plusieurs fonds en batch (performance optimisée)
    const handleAjouterSelection = async (fondIds: string[]) => {
        if (fondIds.length === 0) {
            toast.warning('Aucun fond à ajouter');
            return;
        }

        setAjoutEnCours(true);
        let succes = 0;
        let echecs = 0;

        try {
            // Ajout séquentiel pour éviter les race conditions
            for (const fondId of fondIds) {
                try {
                    await ajouterFond.mutateAsync({ fondId });
                    succes++;
                } catch (error) {
                    // Ignorer les erreurs "déjà ajouté" (409)
                    if (error?.response?.status !== 409) {
                        echecs++;
                        console.error(`[Apparence] Erreur ajout fond ${fondId}:`, error);
                    }
                }
            }

            // Message de synthèse
            if (succes > 0 && echecs === 0) {
                toast.success(`${succes} fond(s) ajouté(s) avec succès`);
            } else if (succes > 0 && echecs > 0) {
                toast.warning(`${succes} ajouté(s), ${echecs} échec(s)`);
            } else {
                toast.error('Erreur lors de l\'ajout des fonds');
            }

            // Vider la sélection après ajout
            setSelectionnes(new Set());
        } finally {
            setAjoutEnCours(false);
        }
    };

    // Ajouter tous les fonds filtrés (non déjà ajoutés)
    const handleAjouterTous = async () => {
        const fondsAAjouter = catalogueFiltre
            .filter((fond) => !fondsEtab?.some((fe) => fe.fondId === fond.id))
            .map((fond) => fond.id);

        if (fondsAAjouter.length === 0) {
            toast.info('Tous les fonds sont déjà ajoutés');
            return;
        }

        await handleAjouterSelection(fondsAAjouter);
    };

    // Toggle sélection d'un fond
    const toggleSelection = (fondId: string) => {
        setSelectionnes((prev) => {
            const nouveau = new Set(prev);
            if (nouveau.has(fondId)) {
                nouveau.delete(fondId);
            } else {
                nouveau.add(fondId);
            }
            return nouveau;
        });
    };

    // Sélectionner/désélectionner tous les fonds filtrés
    const toggleSelectionTous = () => {
        const idsDisponibles = catalogueFiltre
            .filter((fond) => !fondsEtab?.some((fe) => fe.fondId === fond.id))
            .map((fond) => fond.id);

        if (selectionnes.size === idsDisponibles.length && idsDisponibles.length > 0) {
            // Désélectionner tout
            setSelectionnes(new Set());
        } else {
            // Sélectionner tous les disponibles
            setSelectionnes(new Set(idsDisponibles));
        }
    };

    // Vérifier si tous les fonds disponibles sont sélectionnés
    const tousSelectionnes = () => {
        const idsDisponibles = catalogueFiltre
            .filter((fond) => !fondsEtab?.some((fe) => fe.fondId === fond.id))
            .map((fond) => fond.id);
        
        return idsDisponibles.length > 0 && selectionnes.size === idsDisponibles.length;
    };

    // Compter les fonds sélectionnés disponibles
    const nbSelectionnesDisponibles = () => {
        const idsDisponibles = new Set(
            catalogueFiltre
                .filter((fond) => !fondsEtab?.some((fe) => fe.fondId === fond.id))
                .map((fond) => fond.id)
        );
        
        return [...selectionnes].filter((id) => idsDisponibles.has(id)).length;
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

    // Activer/désactiver un fond manuellement
    const handleToggleActif = async (feId: string, actifActuel: boolean) => {
        try {
            await modifierFond.mutateAsync({
                id: feId,
                actif: !actifActuel,
            });
            toast.success(actifActuel ? 'Fond désactivé' : 'Fond activé');
        } catch {
            toast.error('Erreur lors de la modification du statut');
        }
    };

    // Obtenir l'URL complète d'un fond pour l'aperçu
    const getUrlImageFond = (fond: Fond): string => {
        // Si c'est une URL absolue, la retourner directement
        if (fond.cheminFichier.startsWith('http')) {
            return fond.cheminFichier;
        }
        
        // Chemin relatif: normaliser avec slash initial
        const cheminNormalise = fond.cheminFichier.startsWith('/')
            ? fond.cheminFichier
            : `/${fond.cheminFichier}`;
        
        if (import.meta.env.DEV) {
            // En dev: Vite sert depuis frontend/public/ via le lien symbolique
            return cheminNormalise;
        }
        
        // En prod: utiliser l'URL du backend
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';
        return `${API_BASE_URL}${cheminNormalise}`;
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
                        {fondsEtab.map((fe) => {
                            // Comparer avec fondId (ID du fond catalogue), pas fe.id (ID de l'association)
                            const estFondActif = fondActuelId === fe.fondId || fondActuelId === fe.fond.id;
                            
                            // Log de débogage pour tracer la comparaison
                            if (estFondActif) {
                                console.log('[Apparence] Fond ACTIF détecté:', {
                                    feId: fe.id,
                                    feFondId: fe.fondId,
                                    feFondDotId: fe.fond?.id,
                                    fondActuelId,
                                    estFondActif,
                                });
                            }
                            
                            return (
                                <div
                                    key={fe.id}
                                    className={`relative rounded-lg border p-[var(--space-md)] transition-all ${
                                        estFondActif
                                            ? 'border-[var(--color-dominant-600)] bg-[var(--color-dominant-50)] shadow-lg'
                                            : 'border-[var(--color-bordure)] bg-[var(--color-surface)]'
                                    }`}
                                >
                                    {/* Badge "Fond actif" - z-20 pour être au-dessus de tout */}
                                    {estFondActif && (
                                        <div className="absolute -top-2 -right-2 z-20 rounded-full bg-[var(--color-dominant-600)] px-2 py-1 text-xs font-semibold text-white shadow-lg animate-pulse">
                                            Actif
                                        </div>
                                    )}

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

                                    {/* Boutons d'action */}
                                    <div className="mt-[var(--space-sm)] flex flex-wrap items-center gap-[var(--gap-xs)]">
                                        {/* Bouton Appliquer - pour tous les fonds */}
                                        <ElisaButton
                                            variant={estFondActif ? 'primary' : 'outline'}
                                            taille="xs"
                                            onClick={() => appliquerFond.mutate(fe.id)}  // fe.id = ID de l'association (attendu par l'API)
                                            chargement={appliquerFond.isPending}
                                            icon={<Monitor className="h-3 w-3" />}
                                        >
                                            {estFondActif ? 'Appliqué' : 'Appliquer'}
                                        </ElisaButton>

                                        {/* Bouton Activer/Désactiver - uniquement pour les fonds non-système */}
                                        {!fe.id.startsWith('systeme-') && (
                                            <ElisaButton
                                                variant={fe.actif ? 'outline' : 'primary'}
                                                taille="xs"
                                                onClick={() => handleToggleActif(fe.id, fe.actif)}
                                                chargement={modifierFond.isPending}
                                                icon={fe.actif ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                            >
                                                {fe.actif ? 'Désactiver' : 'Activer'}
                                            </ElisaButton>
                                        )}

                                        {/* Bouton Aperçu */}
                                        <ElisaButton
                                            variant="outline"
                                            taille="xs"
                                            onClick={() => setFondApercu(getUrlImageFond(fe.fond))}
                                            icon={<Maximize2 className="h-3 w-3" />}
                                        >
                                            Aperçu
                                        </ElisaButton>
                                    </div>

                                    <div className="mt-[var(--space-sm)] flex items-center justify-between">
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                            Ordre: {fe.ordre}
                                        </span>
                                        {fe.id.startsWith('systeme-') ? (
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                                Fond système
                                            </span>
                                        ) : (
                                            <ElisaButton
                                                variant="danger"
                                                taille="xs"
                                                onClick={() => handleSupprimerFond(fe.id)}
                                                chargement={supprimerFond.isPending}
                                                icon={<Trash2 className="h-3 w-3" />}
                                            >
                                                Retirer
                                            </ElisaButton>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Modal catalogue */}
            <CustomModal
                open={showCatalogue}
                onOpenChange={(v) => {
                    if (!v) {
                        setShowCatalogue(false);
                        setSelectionnes(new Set()); // Vider la sélection à la fermeture
                    }
                }}
                title="Choisir un fond d'écran"
                description="Sélectionnez un fond dans le catalogue pour l'ajouter à votre établissement"
                size="3xl"
                footer={
                    selectionnes.size > 0 && (
                        <div className="flex items-center justify-between w-full">
                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                {nbSelectionnesDisponibles()} fond(s) sélectionné(s)
                            </span>
                            <div className="flex items-center gap-[var(--gap-sm)]">
                                <ElisaButton
                                    variant="outline"
                                    taille="sm"
                                    onClick={() => setSelectionnes(new Set())}
                                    icon={<X className="h-4 w-4" />}
                                >
                                    Annuler
                                </ElisaButton>
                                <ElisaButton
                                    variant="primary"
                                    taille="sm"
                                    onClick={() => handleAjouterSelection([...selectionnes])}
                                    chargement={ajoutEnCours || ajouterFond.isPending}
                                    icon={<Plus className="h-4 w-4" />}
                                >
                                    Ajouter ({nbSelectionnesDisponibles()})
                                </ElisaButton>
                            </div>
                        </div>
                    )
                }
            >
                <div className="flex flex-col gap-[var(--gap-md)]">
                    {/* Barre d'actions : filtres + sélection */}
                    <div className="flex flex-col gap-[var(--gap-sm)]">
                        {/* Filtres par catégorie */}
                        <div className="flex flex-wrap gap-[var(--gap-xs)]">
                            <ElisaButton
                                variant={filtreCategorie === 'toutes' ? 'primary' : 'outline'}
                                taille="xs"
                                onClick={() => {
                                    setFiltreCategorie('toutes');
                                    setSelectionnes(new Set()); // Vider sélection quand on change de filtre
                                }}
                            >
                                Toutes
                            </ElisaButton>
                            {Object.entries(CATEGORIE_LABELS).map(([value, label]) => (
                                <ElisaButton
                                    key={value}
                                    variant={filtreCategorie === value ? 'primary' : 'outline'}
                                    taille="xs"
                                    onClick={() => {
                                        setFiltreCategorie(value as CategorieFond);
                                        setSelectionnes(new Set()); // Vider sélection quand on change de filtre
                                    }}
                                >
                                    {label}
                                </ElisaButton>
                            ))}
                        </div>

                        {/* Actions de sélection en masse */}
                        {!loadingCatalogue && catalogueFiltre.length > 0 && (
                            <div className="flex items-center justify-between rounded-lg bg-[var(--color-fond)] px-[var(--space-md)] py-[var(--space-sm)]">
                                <div className="flex items-center gap-[var(--gap-sm)]">
                                    <label className="flex items-center gap-[var(--gap-xs)] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={tousSelectionnes()}
                                            onChange={toggleSelectionTous}
                                            className="h-4 w-4 rounded border-[var(--color-bordure)] text-[var(--color-dominant-600)] focus:ring-[var(--color-dominant-600)]"
                                        />
                                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                                            Sélectionner tout
                                        </span>
                                    </label>
                                    {selectionnes.size > 0 && (
                                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                            ({nbSelectionnesDisponibles()} sélectionné(s))
                                        </span>
                                    )}
                                </div>
                                <ElisaButton
                                    variant="primary"
                                    taille="xs"
                                    onClick={handleAjouterTous}
                                    chargement={ajoutEnCours || ajouterFond.isPending}
                                    disabled={catalogueFiltre.every((fond) => fondsEtab?.some((fe) => fe.fondId === fond.id))}
                                    icon={<Upload className="h-3 w-3" />}
                                >
                                    Ajouter tous
                                </ElisaButton>
                            </div>
                        )}
                    </div>

                    {/* Grille de fonds */}
                    {loadingCatalogue ? (
                        <p style={{ fontSize: 'var(--text-base)' }}>Chargement du catalogue...</p>
                    ) : !catalogueFiltre || catalogueFiltre.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[var(--color-bordure)] p-[var(--space-xl)] text-center">
                            <Image className="mx-auto mb-[var(--space-md)] h-[var(--icon-lg)] w-[var(--icon-lg)] text-gray-400" />
                            <p style={{ fontSize: 'var(--text-base)' }}>Aucun fond dans cette catégorie</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-[var(--gap-md)] sm:grid-cols-2 md:grid-cols-3">
                            {catalogueFiltre.map((fond) => {
                                const dejaAjoute = fondsEtab?.some((fe) => fe.fondId === fond.id);
                                const estSelectionne = selectionnes.has(fond.id);

                                return (
                                    <div
                                        key={fond.id}
                                        className={`relative rounded-lg border p-[var(--space-md)] transition-all cursor-pointer ${
                                            estSelectionne
                                                ? 'border-[var(--color-dominant-600)] bg-[var(--color-dominant-50)] shadow-md'
                                                : dejaAjoute
                                                ? 'border-[var(--color-bordure)] bg-[var(--color-fond)] opacity-75'
                                                : 'border-[var(--color-bordure)] bg-[var(--color-surface)] hover:border-[var(--color-dominant-400)] hover:shadow-sm'
                                        }`}
                                        onClick={() => !dejaAjoute && toggleSelection(fond.id)}
                                    >
                                        {/* Badge "Déjà ajouté" */}
                                        {dejaAjoute && (
                                            <div className="absolute -top-2 -right-2 z-20 rounded-full bg-gray-500 px-2 py-1 text-xs font-semibold text-white shadow-lg">
                                                Déjà ajouté
                                            </div>
                                        )}

                                        {/* Checkbox de sélection */}
                                        {!dejaAjoute && (
                                            <div className="absolute top-[var(--space-sm)] right-[var(--space-sm)]">
                                                <div
                                                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                                                        estSelectionne
                                                            ? 'border-[var(--color-dominant-600)] bg-[var(--color-dominant-600)]'
                                                            : 'border-[var(--color-bordure)] bg-white'
                                                    }`}
                                                >
                                                    {estSelectionne && (
                                                        <Check className="h-3 w-3 text-white" />
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="pr-6">
                                            <p style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                                                {fond.nom}
                                            </p>
                                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                                {CATEGORIE_LABELS[fond.categorie]}
                                            </p>
                                        </div>

                                        {/* Bouton d'ajout individuel */}
                                        {!dejaAjoute && (
                                            <ElisaButton
                                                variant={estSelectionne ? 'outline' : 'primary'}
                                                taille="sm"
                                                fullWidth
                                                className="mt-[var(--space-sm)]"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Empêcher la propagation au clic sur la carte
                                                    handleAjouterFond(fond);
                                                }}
                                                chargement={ajouterFond.isPending}
                                            >
                                                {estSelectionne ? 'Sélectionné ✓' : 'Ajouter'}
                                            </ElisaButton>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CustomModal>

            {/* Modal aperçu du fond */}
            <CustomModal
                open={fondApercu !== null}
                onOpenChange={(v) => { if (!v) setFondApercu(null); }}
                title="Aperçu du fond d'écran"
                description="Visualisation en taille réelle du fond sélectionné"
                size="3xl"
                footer={
                    <ElisaButton
                        variant="outline"
                        onClick={() => setFondApercu(null)}
                        icon={<X className="h-4 w-4" />}
                    >
                        Fermer
                    </ElisaButton>
                }
            >
                {fondApercu && (
                    <div className="flex items-center justify-center">
                        <img
                            src={fondApercu}
                            alt="Aperçu du fond d'écran"
                            className="max-h-[70vh] w-full rounded-lg object-contain"
                            style={{
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                            }}
                        />
                    </div>
                )}
            </CustomModal>
        </div>
    );
}
