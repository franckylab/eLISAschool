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

            try {
                const etablissementsDisponibles = await apiClient.getEtablissementsDisponibles();
                
                const transformed = etablissementsDisponibles.map(e => ({
                    id: e.id,
                    nom: e.nom,
                    code: e.code,
                    role: e.role,
                    etablissementPrincipal: e.etablissementPrincipal,
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
            await apiClient.switchEtablissement(nouveauId);
            
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
                className={`
                    relative flex h-9 w-9 items-center justify-center rounded-lg
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
                    <Loader2 className="h-[18px] w-[18px] animate-spin" />
                ) : etablissementActuel.logoUrl ? (
                    <img
                        src={etablissementActuel.logoUrl}
                        alt={etablissementActuel.nom}
                        className="h-5 w-5 rounded object-cover"
                    />
                ) : (
                    <Building2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
                )}

                {/* Pastille indicatrice */}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--color-dominante)] ring-2 ring-[var(--color-surface)]" />
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
                            className="absolute right-0 top-full mt-1.5 w-72 overflow-hidden rounded-xl bg-[var(--color-surface)] shadow-lg shadow-black/8 ring-1 ring-[var(--color-border)] z-50"
                        >
                            {/* Header compact */}
                            <div className="px-3 py-2.5 border-b border-[var(--color-border)]">
                                <p className="text-xs font-medium text-[var(--color-texte-secondaire)] uppercase tracking-wider">
                                    {t('header.etablissements', { defaultValue: 'Établissements' })}
                                    <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-dominante-100)] text-[10px] font-bold text-[var(--color-dominante)]">
                                        {etablissements.length}
                                    </span>
                                </p>
                            </div>

                            {/* Liste compacte */}
                            <div className="max-h-[280px] overflow-y-auto py-1" role="listbox">
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
                                                w-full flex items-center gap-2.5 px-3 py-2 transition-colors
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
                                                    className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className={`
                                                    flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0
                                                    text-xs font-bold
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
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-sm truncate ${isCurrent ? 'font-semibold text-[var(--color-dominante)]' : 'font-medium text-[var(--color-texte)]'}`}>
                                                        {etab.nom}
                                                    </span>
                                                    {etab.etablissementPrincipal && (
                                                        <Star className="h-3 w-3 text-amber-500 flex-shrink-0" fill="currentColor" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Indicateur actif */}
                                            {isCurrent ? (
                                                <Check className="h-4 w-4 text-[var(--color-dominante)] flex-shrink-0" strokeWidth={2.5} />
                                            ) : isLoading ? (
                                                <Loader2 className="h-3.5 w-3.5 text-[var(--color-texte-secondaire)] animate-spin flex-shrink-0" />
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
