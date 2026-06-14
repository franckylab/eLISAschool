/**
 * ==================================
 * eLISAschool - Modal de Sélection d'Établissement
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * 
 * Modal moderne et élégant pour la sélection d'établissement
 * après connexion pour les utilisateurs multi-tenants.
 * 
 * Fonctionnalités :
 * - Design moderne avec animations Framer Motion
 * - Affichage des détails (nom, logo, rôle)
 * - Badge "Principal" sur l'établissement par défaut
 * - Accessibilité clavier
 * - Responsive design
 * - Feedback visuel au survol et sélection
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Check, ArrowRight, Loader2 } from 'lucide-react';
import { CustomModal } from '@/components/modals';
import { cn } from '@/lib/cn';

export interface EtablissementDisponible {
    id: string;
    nom: string;
    code?: string;
    role: string;
    etablissementPrincipal: boolean;
    logoUrl?: string;
}

interface EtablissementSelectionModalProps {
    open: boolean;
    etablissements: EtablissementDisponible[];
    onSelect: (etablissementId: string) => Promise<void>;
    tokenTemporaire?: string;
    expiresIn?: number;
}

export function EtablissementSelectionModal({
    open,
    etablissements,
    onSelect,
    tokenTemporaire,
    expiresIn,
}: EtablissementSelectionModalProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    // Timer pour token temporaire
    useEffect(() => {
        if (!open || !expiresIn) return;

        setCountdown(expiresIn);
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [open, expiresIn]);

    // Sélectionner automatiquement l'établissement principal
    useEffect(() => {
        if (open && etablissements.length > 0 && !selectedId) {
            const principal = etablissements.find((e) => e.etablissementPrincipal);
            if (principal) {
                setSelectedId(principal.id);
            } else {
                setSelectedId(etablissements[0].id);
            }
        }
    }, [open, etablissements]);

    const handleConfirm = async () => {
        if (!selectedId || isLoading) return;

        setIsLoading(true);
        try {
            await onSelect(selectedId);
        } catch (error) {
            console.error('Erreur lors de la sélection:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={() => {}}
            title="Sélectionnez votre établissement"
            description="Vous êtes associé à plusieurs établissements. Choisissez celui auquel vous souhaitez accéder."
            size="2xl"
            draggable={false}
            resizable={false}
            minimizable={false}
            maximizable={false}
            showClose={false}
            closeOnOverlayClick={false}
            footer={
                <div className="flex w-full items-center justify-between">
                    {countdown !== null && countdown > 0 && (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Session temporaire expire dans {formatTime(countdown)}</span>
                        </div>
                    )}
                    <div className="ml-auto flex gap-3">
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedId || isLoading}
                            className={cn(
                                'flex items-center gap-2 rounded-lg px-6 py-2.5 font-medium text-white transition-all',
                                'bg-gradient-to-r from-green-600 to-green-700 shadow-lg shadow-green-600/25',
                                'hover:shadow-xl hover:shadow-green-600/30 hover:from-green-700 hover:to-green-800',
                                'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
                                'focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:ring-offset-2',
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Connexion...</span>
                                </>
                            ) : (
                                <>
                                    <span>Continuer</span>
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                {/* Liste des établissements */}
                <div className="grid gap-3">
                    <AnimatePresence>
                        {etablissements.map((etab, index) => (
                            <motion.button
                                key={etab.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedId(etab.id)}
                                className={cn(
                                    'relative w-full rounded-xl border-2 p-4 text-left transition-all',
                                    selectedId === etab.id
                                        ? 'border-green-500 bg-green-50 shadow-md shadow-green-500/10'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md',
                                )}
                            >
                                {/* Icône de sélection */}
                                <div
                                    className={cn(
                                        'absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                                        selectedId === etab.id
                                            ? 'border-green-500 bg-green-500'
                                            : 'border-gray-300',
                                    )}
                                >
                                    {selectedId === etab.id && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        >
                                            <Check className="h-4 w-4 text-white" />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Contenu */}
                                <div className="flex items-start gap-4 pr-10">
                                    {/* Logo ou icône */}
                                    <div
                                        className={cn(
                                            'flex h-14 w-14 shrink-0 items-center justify-center rounded-lg',
                                            selectedId === etab.id
                                                ? 'bg-green-100'
                                                : 'bg-gray-100',
                                        )}
                                    >
                                        {etab.logoUrl ? (
                                            <img
                                                src={etab.logoUrl}
                                                alt={etab.nom}
                                                className="h-full w-full rounded-lg object-contain"
                                            />
                                        ) : (
                                            <Building2
                                                className={cn(
                                                    'h-7 w-7',
                                                    selectedId === etab.id
                                                        ? 'text-green-600'
                                                        : 'text-gray-600',
                                                )}
                                            />
                                        )}
                                    </div>

                                    {/* Infos */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {etab.nom}
                                            </h3>
                                            {etab.etablissementPrincipal && (
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                                                >
                                                    Principal
                                                </motion.span>
                                            )}
                                        </div>

                                        {etab.code && (
                                            <p className="mt-0.5 text-sm text-gray-500">
                                                Code: {etab.code}
                                            </p>
                                        )}

                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                                {etab.role.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Message d'aide */}
                <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Astuce :</strong> Vous pourrez changer d'établissement à tout moment
                        depuis le menu en haut à droite de l'application.
                    </p>
                </div>
            </div>
        </CustomModal>
    );
}
