/**
 * ==================================
 * eLISAschool - Switcher d'établissement (Header)
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 * 
 * Composant compact de switch rapide d'établissement.
 * Affiche uniquement l'icône + dropdown épuré (nom/déconnexion gérés par UserMenu).
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    Check,
    Loader2,
    Star,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface EtablissementInfo {
    id: string;
    nom: string;
    code?: string;
    role: string;
    etablissementPrincipal: boolean;
    logoUrl?: string;
}

/**
 * Génère initiales à partir du nom de l'établissement
 */
function getInitials(nom: string): string {
    return nom
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0]?.toUpperCase() || '')
        .join('');
}

export function EtablissementSwitcher() {
    const { t } = useTranslation('common');
    const { etablissementId } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [etablissements, setEtablissements] = useState<EtablissementInfo[]>([]);
    const [etablissementActuel, setEtablissementActuel] = useState<EtablissementInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Charger les établissements disponibles
    useEffect(() => {
        const loadEtablissements = async () => {
            if (!etablissementId) return;
            console.log('[EtablissementSwitcher] Établissement actif détecté par le composant:', etablissementId);

            try {
                const etablissementsDisponibles = await apiClient.getEtablissementsDisponibles();
                
                const transformed = etablissementsDisponibles.map(e => ({
                    id: e.id,
                    nom: e.nom,
                    code: e.code,
                    role: e.role,
                    etablissementPrincipal: e.etablissementPrincipal,
                    logoUrl: e.logoUrl, // ← Inclure le logo
                }));
                
                setEtablissements(transformed);

                const current = transformed.find(e => e.id === etablissementId);
                if (current) {
                    setEtablissementActuel(current);
                }
            } catch (error) {
                console.error('[EtablissementSwitcher] Erreur chargement:', error);
            }
        };

        loadEtablissements();
    }, [etablissementId]);

    const handleChangeEtablissement = async (nouveauId: string) => {
        setIsLoading(true);
        setIsOpen(false);

        try {
            // Un seul appel via le store (qui appelle déjà apiClient.switchEtablissement en interne)
            // Éviter le double appel qui provoquait un 400 Bad Request
            const { switchEtablissement: switchEtabStore } = useAuthStore.getState();
            await switchEtabStore(nouveauId);
            
            const selected = etablissements.find(e => e.id === nouveauId);
            if (selected) {
                setEtablissementActuel(selected);
            }

            toast.success(t('messages.etablissementChange', { defaultValue: 'Établissement changé' }));
            
            // Invalidation cache + reload
            try {
                const { queryClient } = await import('@/lib/query-client');
                queryClient.clear();
            } catch { /* non-bloquant */ }
            
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || t('messages.erreurChangement', { defaultValue: 'Erreur lors du changement' }));
            setIsLoading(false);
        }
    };

    // Fermer au clic extérieur
    useEffect(() => {
        if (!isOpen) return;
        
        const handleClickOutside = (e: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Raccourci clavier Escape
    useEffect(() => {
        if (!isOpen) return;
        
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    if (!etablissementActuel || etablissements.length <= 1) {
        return null;
    }

    return (
        <div className="relative">
            {/* ─── Bouton Trigger : Icône compacte uniquement ─── */}
            <motion.button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={`
                    relative flex h-7 w-7 items-center justify-center rounded-lg xs:h-8 xs:w-8 sm:h-9 sm:w-9
                    transition-all duration-200 ease-out
                    text-[var(--color-texte-secondaire)]
                    hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dominante-500)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isOpen ? 'bg-[var(--color-surface-hover)] text-[var(--color-texte)]' : ''}
                `}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-label={t('header.changerEtablissement', { defaultValue: 'Changer d\'établissement' })}
                title={etablissementActuel.nom}
            >
                {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin xs:h-4 xs:w-4 sm:h-[18px] sm:w-[18px]" />
                ) : etablissementActuel.logoUrl ? (
                    <img
                        src={etablissementActuel.logoUrl}
                        alt={etablissementActuel.nom}
                        className="h-3.5 w-3.5 rounded object-cover xs:h-4 xs:w-4 sm:h-5 sm:w-5"
                    />
                ) : (
                    <Building2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
                )}
            </motion.button>

            {/* ─── Dropdown Menu ─── */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay transparent pour fermer */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                            aria-hidden="true"
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            role="menu"
                            className="absolute right-0 top-full mt-1.5 w-[calc(100vw-2rem)] max-w-[220px] overflow-hidden rounded-xl bg-[var(--color-surface)] shadow-lg shadow-black/8 ring-1 ring-[var(--color-border)] z-50 xs:w-56 xs:max-w-[256px] sm:w-72 sm:max-w-[288px]"
                        >
                            {/* Header compact */}
                            <div className="px-2 py-1.5 border-b border-[var(--color-border)] xs:px-2.5 xs:py-2 sm:px-3 sm:py-2.5">
                                <p className="text-[9px] font-medium text-[var(--color-texte-secondaire)] uppercase tracking-wider xs:text-[10px] sm:text-xs">
                                    {t('header.etablissements', { defaultValue: 'Établissements' })}
                                    <span className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full bg-[var(--color-dominante-100)] text-[8px] font-bold text-[var(--color-dominante)] xs:h-3.5 xs:w-3.5 xs:text-[9px] sm:h-4 sm:w-4 sm:text-[10px]">
                                        {etablissements.length}
                                    </span>
                                </p>
                            </div>

                            {/* Liste compacte */}
                            <div className="max-h-[200px] overflow-y-auto py-0.5 xs:max-h-[240px] sm:max-h-[280px] sm:py-1" role="listbox">
                                {etablissements.map((etab) => {
                                    const isCurrent = etab.id === etablissementActuel.id;
                                    const etabInitials = getInitials(etab.nom);
                                    
                                    return (
                                        <motion.button
                                            key={etab.id}
                                            onClick={() => !isCurrent && handleChangeEtablissement(etab.id)}
                                            disabled={isCurrent || isLoading}
                                            whileHover={!isCurrent ? { x: 2 } : {}}
                                            role="option"
                                            aria-selected={isCurrent}
                                            className={`
                                                w-full flex items-center gap-1.5 px-1.5 py-1 transition-colors xs:gap-2 xs:px-2 xs:py-1.5 sm:gap-2.5 sm:px-3 sm:py-2
                                                ${isCurrent
                                                    ? 'bg-[var(--color-dominante-50)]'
                                                    : 'hover:bg-[var(--color-surface-hover)] cursor-pointer'
                                                }
                                                ${isLoading && !isCurrent ? 'opacity-50 pointer-events-none' : ''}
                                            `}
                                        >
                                            {/* Avatar compact */}
                                            {etab.logoUrl ? (
                                                <img
                                                    src={etab.logoUrl}
                                                    alt={etab.nom}
                                                    className="h-6 w-6 rounded-lg object-cover flex-shrink-0 xs:h-7 xs:w-7 sm:h-8 sm:w-8"
                                                />
                                            ) : (
                                                <div className={`
                                                    flex h-6 w-6 items-center justify-center rounded-lg flex-shrink-0 xs:h-7 xs:w-7 sm:h-8 sm:w-8
                                                    text-[9px] font-bold xs:text-[10px] sm:text-xs
                                                    ${isCurrent
                                                        ? 'bg-[var(--color-dominante)] text-white'
                                                        : 'bg-[var(--color-dominante-100)] text-[var(--color-dominante)]'
                                                    }
                                                `}>
                                                    {etabInitials}
                                                </div>
                                            )}

                                            {/* Nom établissement (tronqué) */}
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-1.5">
                                                    <span className={`text-[10px] break-words leading-tight xs:text-xs sm:text-sm ${isCurrent ? 'font-semibold text-[var(--color-dominante)]' : 'font-medium text-[var(--color-texte)]'}`}>
                                                        {etab.nom}
                                                    </span>
                                                    {etab.etablissementPrincipal && (
                                                        <Star className="h-2 w-2 text-amber-500 flex-shrink-0 xs:h-2.5 xs:w-2.5 sm:h-3 sm:w-3" fill="currentColor" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Indicateur actif */}
                                            {isCurrent ? (
                                                <Check className="h-3 w-3 text-[var(--color-dominante)] flex-shrink-0 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
                                            ) : isLoading ? (
                                                <Loader2 className="h-2.5 w-2.5 text-[var(--color-texte-secondaire)] animate-spin flex-shrink-0 xs:h-3 xs:w-3 sm:h-3.5 sm:w-3.5" />
                                            ) : null}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default EtablissementSwitcher;
