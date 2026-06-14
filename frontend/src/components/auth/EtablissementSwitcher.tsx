/**
 * ==================================
 * eLISAschool - Sélecteur d'Établissement (Navbar)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * 
 * Composant avancé pour changer d'établissement depuis la navbar.
 * Design moderne avec dropdown animé et informations contextuelles.
 * 
 * Fonctionnalités :
 * - Dropdown animé avec Framer Motion
 * - Affichage de l'établissement actif
 * - Changement rapide avec rechargement intelligent
 * - Badge "Principal" sur l'établissement par défaut
 * - Tooltip et feedback visuel
 * - Accessibilité clavier
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    ChevronDown,
    Check,
    Loader2,
    ExternalLink,
} from 'lucide-react';
import { useAuthStore, Etablissement } from '@/stores/auth.store';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';

interface EtablissementSwitcherProps {
    className?: string;
}

export function EtablissementSwitcher({ className }: EtablissementSwitcherProps) {
    const {
        etablissementId,
        etablissements,
        switchEtablissement,
        isLoading,
    } = useAuthStore();

    const [isOpen, setIsOpen] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fermer le dropdown au clic extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Ne rien afficher si 0 ou 1 établissement
    if (!etablissements || etablissements.length <= 1) {
        return null;
    }

    const etablissementActif = etablissements.find(
        (e) => e.etablissementId === etablissementId
    );

    const handleSwitch = async (etab: Etablissement) => {
        if (etab.etablissementId === etablissementId || isSwitching) return;

        setIsSwitching(true);
        setIsOpen(false);

        try {
            await switchEtablissement(etab.etablissementId);
            toast.success(`Établissement changé : ${etab.nom}`);

            // Recharger la page pour rafraîchir toutes les données
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            toast.error('Erreur lors du changement d\'établissement');
            console.error(error);
        } finally {
            setIsSwitching(false);
        }
    };

    return (
        <div className={cn('relative', className)} ref={dropdownRef}>
            {/* Bouton principal */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isSwitching}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 transition-all',
                    'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md',
                    'focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    isOpen && 'border-green-500 bg-green-50 shadow-sm',
                )}
            >
                {isSwitching ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                ) : (
                    <>
                        <Building2 className="h-4 w-4 text-gray-700" />
                        <span className="max-w-[150px] truncate text-sm font-medium text-gray-900">
                            {etablissementActif?.nom || 'Établissement'}
                        </span>
                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        </motion.div>
                    </>
                )}
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl"
                        >
                            {/* Header */}
                            <div className="border-b border-gray-200 px-4 py-3">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Changer d'établissement
                                </h3>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    {etablissements.length} établissements disponibles
                                </p>
                            </div>

                            {/* Liste */}
                            <div className="max-h-96 overflow-y-auto p-2">
                                {etablissements.map((etab, index) => {
                                    const isActive = etab.etablissementId === etablissementId;

                                    return (
                                        <motion.button
                                            key={etab.etablissementId}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => handleSwitch(etab)}
                                            disabled={isActive || isSwitching}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
                                                isActive
                                                    ? 'bg-green-50'
                                                    : 'hover:bg-gray-50',
                                                'disabled:cursor-not-allowed',
                                            )}
                                        >
                                            {/* Icône */}
                                            <div
                                                className={cn(
                                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                                    isActive ? 'bg-green-100' : 'bg-gray-100',
                                                )}
                                            >
                                                <Building2
                                                    className={cn(
                                                        'h-5 w-5',
                                                        isActive ? 'text-green-600' : 'text-gray-600',
                                                    )}
                                                />
                                            </div>

                                            {/* Infos */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {etab.nom}
                                                    </span>
                                                    {etab.etablissementPrincipal && (
                                                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">
                                                            Principal
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {etab.role.replace(/_/g, ' ')}
                                                </p>
                                            </div>

                                            {/* Check si actif */}
                                            {isActive && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500"
                                                >
                                                    <Check className="h-4 w-4 text-white" />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-200 px-4 py-3">
                                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <ExternalLink className="h-3 w-3" />
                                    <span>
                                        Le changement rechargera la page automatiquement
                                    </span>
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
