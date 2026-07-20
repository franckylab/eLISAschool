/**
 * ==================================
 * eLISAschool - Composant FondRotator (slideshow fonds d'écran)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Affiche les fonds d'écran en rotation avec transition en fondu (1.5s).
 * Précharge tous les fonds en mémoire pour une rotation fluide.
 * Fond semi-transparent superposé au fond alvéole fixe (NidAlveoleBackground).
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFondsRotation, useConfigRotation } from '@/features/apparence/hooks';
import type { Fond, ConfigRotation } from '@/features/apparence/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

// Context pour partager le fond actuel avec d'autres composants
interface FondActuelContextType {
    fondActuelId: string | null;
    fondActuelNom: string | null;
}

export const FondActuelContext = createContext<FondActuelContextType>({
    fondActuelId: null,
    fondActuelNom: null,
});

export function useFondActuel() {
    return useContext(FondActuelContext);
}

interface FondRotatorProps {
    /** Durée de la transition en ms (défaut: 1500) */
    transitionDuration?: number;
}

export function FondRotator({
    transitionDuration = 1500,
}: FondRotatorProps) {
    console.log('[FondRotator] Rendu du composant');
    
    const { data: fonds, isLoading: isLoadingFonds, isError: isErrorFonds, error: errorFonds } = useFondsRotation();
    const { data: config, isLoading: isLoadingConfig, isError: isErrorConfig, error: errorConfig } = useConfigRotation();

    // Typage explicite pour éviter les erreurs TypeScript
    const fondsTyped = (fonds as Fond[]) ?? [];
    const configTyped = config as ConfigRotation | undefined;

    console.log('[FondRotator] État des hooks:', {
        fonds: fondsTyped.length,
        isLoadingFonds,
        isErrorFonds,
        errorFonds: errorFonds?.message,
        config: configTyped,
        isLoadingConfig,
        isErrorConfig,
        errorConfig: errorConfig?.message,
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [preloadedImages, setPreloadedImages] = useState<Map<string, boolean>>(new Map());

    // Réinitialiser l'index quand les fonds changent (ex: nouveau fond appliqué)
    useEffect(() => {
        if (fondsTyped.length > 0) {
            console.log('[FondRotator] Fonds mis à jour, réinitialisation de l\'index à 0');
            setCurrentIndex(0);
        }
    }, [fondsTyped]);

    // Rotation activée ?
    const rotationActive = configTyped?.actif ?? false;
    const delaiRotation = (configTyped?.delaiRotation ?? 86400) * 1000; // Convertir secondes → ms

    console.log('[FondRotator] Configuration rotation:', { rotationActive, delaiRotation });

    // Précharger tous les fonds en mémoire
    useEffect(() => {
        console.log('[FondRotator] useEffect préchargement déclenché', {
            fondsCount: fondsTyped.length,
            hasFonds: fondsTyped.length > 0,
        });

        if (fondsTyped.length === 0) {
            console.log('[FondRotator] Aucun fond à précharger');
            return;
        }

        const newPreloaded = new Map<string, boolean>();

        fondsTyped.forEach((fond: Fond) => {
            const img = new Image();
            
            // Construction de l'URL de l'image
            let imageUrl: string;
            if (fond.cheminFichier.startsWith('http')) {
                // URL absolue (externe)
                imageUrl = fond.cheminFichier;
            } else {
                // Chemin relatif
                const cheminNormalise = fond.cheminFichier.startsWith('/')
                    ? fond.cheminFichier
                    : `/${fond.cheminFichier}`;
                
                // Toujours utiliser le backend qui sert avec le bon Content-Type
                // Cache-bust via updatedAt pour éviter les erreurs CORP/CORS d'une version précédente
                const version = fond.updatedAt ? Date.parse(fond.updatedAt) : Date.now();
                imageUrl = `${BACKEND_ORIGIN}${cheminNormalise}?v=${version}`;
            }
            
            console.log('[FondRotator] Préchargement image:', {
                fondId: fond.id,
                fondNom: fond.nom,
                url: imageUrl,
                mode: 'backend',
            });

            img.onload = () => {
                console.log('[FondRotator] Image chargée avec succès:', fond.nom);
                newPreloaded.set(fond.id, true);
                setPreloadedImages(new Map(newPreloaded));
            };
            img.onerror = () => {
                console.error('[FondRotator] Échec chargement image:', {
                    fondNom: fond.nom,
                    fondId: fond.id,
                    url: imageUrl,
                    mode: 'backend',
                    cheminFichier: fond.cheminFichier,
                });
                newPreloaded.set(fond.id, false);
                setPreloadedImages(new Map(newPreloaded));
            };
            img.src = imageUrl;
        });
    }, [fonds]);

    // Gestion de la rotation automatique
    const avancerRotation = useCallback(() => {
        if (fondsTyped.length === 0) return;

        setCurrentIndex((prev) => {
            const next = (prev + 1) % fondsTyped.length;
            // Vérifier que le suivant est préchargé, sinon passer au suivant
            const nextFond = fondsTyped[next];
            const isPreloaded = preloadedImages.get(nextFond.id);
            if (isPreloaded === false) {
                // Image non préchargée, passer au suivant
                return (next + 1) % fondsTyped.length;
            }
            return next;
        });
    }, [fondsTyped, preloadedImages]);

    useEffect(() => {
        console.log('[FondRotator] useEffect rotation automatique', {
            rotationActive,
            delaiRotation,
            fondsCount: fondsTyped.length,
        });

        if (!rotationActive || fondsTyped.length === 0) {
            console.log('[FondRotator] Rotation désactivée ou aucun fond');
            return;
        }

        const timer = setInterval(avancerRotation, delaiRotation);
        console.log('[FondRotator] Timer rotation démarré, intervalle:', delaiRotation, 'ms');
        return () => {
            console.log('[FondRotator] Timer rotation nettoyé');
            clearInterval(timer);
        };
    }, [rotationActive, delaiRotation, fonds, avancerRotation]);

    // ============================================
    // RETURNS CONDITIONNELS (APRÈS tous les hooks)
    // ============================================

    if (isErrorFonds || isErrorConfig) {
        console.warn('[FondRotator] Erreur API, rendu transparent (nid alvéole visible)', {
            errorFonds: errorFonds?.message,
            errorConfig: errorConfig?.message,
        });
        return null;
    }

    if (isLoadingFonds || isLoadingConfig) {
        console.log('[FondRotator] Chargement, rendu transparent (nid alvéole visible)');
        return null;
    }

    if (!fondsTyped || fondsTyped.length === 0) {
        console.log('[FondRotator] Aucun fond disponible, rendu transparent (nid alvéole visible)');
        return null;
    }

    // Afficher uniquement le fond actuel avec transition
    const fondActuel = fondsTyped[currentIndex];
    
    // Construction de l'URL de l'image
    let urlImage: string;
    if (fondActuel.cheminFichier.startsWith('http')) {
        urlImage = fondActuel.cheminFichier;
    } else {
        const cheminNormalise = fondActuel.cheminFichier.startsWith('/')
            ? fondActuel.cheminFichier
            : `/${fondActuel.cheminFichier}`;
        
        urlImage = `${BACKEND_ORIGIN}${cheminNormalise}`;
    }

    console.log('[FondRotator] Affichage du fond:', {
        nom: fondActuel.nom,
        categorie: fondActuel.categorie,
        url: urlImage,
        currentIndex,
        total: fondsTyped.length,
    });

    return (
        <FondActuelContext.Provider value={{ fondActuelId: fondActuel.id, fondActuelNom: fondActuel.nom }}>
            <div className="fixed inset-0 -z-10 overflow-hidden">
                {/* Fond actuel avec fondu — filtre dark mode via CSS variables */}
                <div
                    className="absolute inset-0"
                    style={{
                        opacity: 'var(--fond-opacity, 0.3)',
                        filter: 'var(--fond-filter, none)',
                        willChange: 'opacity, filter',
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={fondActuel.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: transitionDuration / 1000, ease: 'easeInOut' }}
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                            style={{
                                backgroundImage: `url('${urlImage}')`,
                                willChange: 'opacity',
                            }}
                        />
                    </AnimatePresence>
                </div>

                {/* Indicateur de débogage (uniquement en développement) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-black/70 px-3 py-2 text-xs text-white">
                        <div>Fond: {fondActuel.nom}</div>
                        <div>Catégorie: {fondActuel.categorie}</div>
                        <div>Index: {currentIndex + 1}/{fondsTyped.length}</div>
                        <div>Rotation: {rotationActive ? 'ON' : 'OFF'}</div>
                    </div>
                )}
            </div>
        </FondActuelContext.Provider>
    );
}
