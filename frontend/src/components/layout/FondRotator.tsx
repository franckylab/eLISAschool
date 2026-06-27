/**
 * ==================================
 * eLISAschool - Composant FondRotator (slideshow fonds d'écran)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Affiche les fonds d'écran en rotation avec transition en fondu (1.5s).
 * Précharge tous les fonds en mémoire pour une rotation fluide.
 * Fallback sur couleur unie si aucun fond configuré.
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFondsRotation, useConfigRotation } from '@/features/apparence/hooks';
import type { Fond, ConfigRotation } from '@/features/apparence/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    /** Couleur de fond fallback (CSS variable ou valeur hex) */
    fallbackColor?: string;
    /** Opacité des fonds (0-1, défaut: 0.08 = 8%) */
    opacity?: number;
    /** Durée de la transition en ms (défaut: 1500) */
    transitionDuration?: number;
}

export function FondRotator({
    fallbackColor = 'var(--color-fond, #f5f5f5)',
    opacity = 0.3,  // Réduit pour ne pas gêner la lecture (SVG interne = 0.08 → réel = 3.2%)
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
                
                if (import.meta.env.DEV) {
                    // En dev: Vite sert depuis frontend/public/ via le lien symbolique
                    imageUrl = cheminNormalise;
                } else {
                    // En prod: utiliser l'URL du backend
                    imageUrl = `${API_BASE_URL}${cheminNormalise}`;
                }
            }
            
            console.log('[FondRotator] Préchargement image:', {
                fondId: fond.id,
                fondNom: fond.nom,
                url: imageUrl,
                mode: import.meta.env.DEV ? 'dev (vite public)' : 'prod (backend)',
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
                    mode: import.meta.env.DEV ? 'dev (vite public)' : 'prod (backend)',
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

    // En cas d'erreur API (backend non démarré, non authentifié, etc.)
    if (isErrorFonds || isErrorConfig) {
        console.warn('[FondRotator] Erreur API détectée, affichage fallback', {
            errorFonds: errorFonds?.message,
            errorConfig: errorConfig?.message,
        });
        return (
            <div
                className="fixed inset-0 -z-10"
                style={{ backgroundColor: fallbackColor }}
            />
        );
    }

    // Pas de fonds ou chargement → afficher fallback
    if (isLoadingFonds || isLoadingConfig) {
        console.log('[FondRotator] Chargement en cours, affichage fallback');
        return (
            <div
                className="fixed inset-0 -z-10"
                style={{ backgroundColor: fallbackColor }}
            />
        );
    }

    if (!fondsTyped || fondsTyped.length === 0) {
        console.log('[FondRotator] Aucun fond disponible, affichage fallback');
        return (
            <div
                className="fixed inset-0 -z-10"
                style={{ backgroundColor: fallbackColor }}
            />
        );
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
        
        urlImage = import.meta.env.DEV
            ? cheminNormalise  // En dev: servi par Vite depuis public/
            : `${API_BASE_URL}${cheminNormalise}`;  // En prod: backend
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
                {/* Couche de couleur fallback toujours présente */}
                <div
                    className="absolute inset-0"
                    style={{ backgroundColor: fallbackColor }}
                />

                {/* Fond actuel avec fondu */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={fondActuel.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: opacity }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: transitionDuration / 1000, ease: 'easeInOut' }}
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: `url('${urlImage}')`,
                        }}
                    />
                </AnimatePresence>

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
