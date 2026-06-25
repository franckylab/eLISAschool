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

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFondsRotation, useConfigRotation } from '@/features/apparence/hooks';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    opacity = 0.08,
    transitionDuration = 1500,
}: FondRotatorProps) {
    console.log('[FondRotator] Rendu du composant');
    
    const { data: fonds, isLoading: isLoadingFonds, isError: isErrorFonds, error: errorFonds } = useFondsRotation();
    const { data: config, isLoading: isLoadingConfig, isError: isErrorConfig, error: errorConfig } = useConfigRotation();

    console.log('[FondRotator] État des hooks:', {
        fonds: fonds?.length ?? 0,
        isLoadingFonds,
        isErrorFonds,
        errorFonds: errorFonds?.message,
        config,
        isLoadingConfig,
        isErrorConfig,
        errorConfig: errorConfig?.message,
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [preloadedImages, setPreloadedImages] = useState<Map<string, boolean>>(new Map());

    // Rotation activée ?
    const rotationActive = config?.actif ?? false;
    const delaiRotation = (config?.delaiRotation ?? 86400) * 1000; // Convertir secondes → ms

    console.log('[FondRotator] Configuration rotation:', { rotationActive, delaiRotation });

    // Précharger tous les fonds en mémoire
    useEffect(() => {
        console.log('[FondRotator] useEffect préchargement déclenché', {
            fondsCount: fonds?.length ?? 0,
            hasFonds: !!fonds,
        });

        if (!fonds || fonds.length === 0) {
            console.log('[FondRotator] Aucun fond à précharger');
            return;
        }

        const newPreloaded = new Map<string, boolean>();

        fonds.forEach((fond) => {
            const img = new Image();
            const imageUrl = fond.cheminFichier.startsWith('http')
                ? fond.cheminFichier
                : `${API_BASE_URL}/${fond.cheminFichier.replace(/^\//, '')}`;
            
            console.log('[FondRotator] Préchargement image:', {
                fondId: fond.id,
                fondNom: fond.nom,
                url: imageUrl,
            });

            img.onload = () => {
                console.log('[FondRotator] Image chargée avec succès:', fond.nom);
                newPreloaded.set(fond.id, true);
                setPreloadedImages(new Map(newPreloaded));
            };
            img.onerror = () => {
                console.error('[FondRotator] Échec chargement image:', fond.nom, imageUrl);
                newPreloaded.set(fond.id, false);
                setPreloadedImages(new Map(newPreloaded));
            };
            img.src = imageUrl;
        });
    }, [fonds]);

    // Gestion de la rotation automatique
    const avancerRotation = useCallback(() => {
        if (!fonds || fonds.length === 0) return;

        setCurrentIndex((prev) => {
            const next = (prev + 1) % fonds.length;
            // Vérifier que le suivant est préchargé, sinon passer au suivant
            const nextFond = fonds[next];
            const isPreloaded = preloadedImages.get(nextFond.id);
            if (isPreloaded === false) {
                // Image non préchargée, passer au suivant
                return (next + 1) % fonds.length;
            }
            return next;
        });
    }, [fonds, preloadedImages]);

    useEffect(() => {
        console.log('[FondRotator] useEffect rotation automatique', {
            rotationActive,
            delaiRotation,
            fondsCount: fonds?.length ?? 0,
        });

        if (!rotationActive || !fonds || fonds.length === 0) {
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

    if (!fonds || fonds.length === 0) {
        console.log('[FondRotator] Aucun fond disponible, affichage fallback');
        return (
            <div
                className="fixed inset-0 -z-10"
                style={{ backgroundColor: fallbackColor }}
            />
        );
    }

    // Afficher uniquement le fond actuel avec transition
    const fondActuel = fonds[currentIndex];
    const urlImage = fondActuel.cheminFichier.startsWith('http')
        ? fondActuel.cheminFichier
        : `${API_BASE_URL}/${fondActuel.cheminFichier.replace(/^\//, '')}`;

    console.log('[FondRotator] Affichage du fond:', {
        nom: fondActuel.nom,
        categorie: fondActuel.categorie,
        url: urlImage,
        currentIndex,
        total: fonds.length,
    });

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            {/* Couche de couleur fallback toujours présente */}
            <div
                className="absolute inset-0"
                style={{ backgroundColor: fallbackColor }}
            />

            {/* Fond actuel avec fondu */}
            <AnimatePresence mode="crossfade">
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
                    <div>Index: {currentIndex + 1}/{fonds.length}</div>
                    <div>Rotation: {rotationActive ? 'ON' : 'OFF'}</div>
                </div>
            )}
        </div>
    );
}
