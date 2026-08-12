/**
 * ==================================
 * eLISAschool - Modal de sélection d'établissement
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 * 
 * Modal ultra-responsive (250px → 2124px) avec tailles proportionnelles clamp().
 * Grid adaptatif auto-fit, animations avancées, optimisations performance.
 * Meilleures pratiques 2024 : fluid typography, container queries, micro-interactions.
 */

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    Check,
    ArrowRight,
    Timer,
    Search,
    Star,
    Info,
    Server,
} from 'lucide-react';
import { CustomModal } from '@/components/modals';
import { ElisaButton } from '@/components/ui';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface EtablissementItem {
    id: string;
    nom: string;
    code?: string;
    role: string;
    etablissementPrincipal: boolean;
    logoUrl?: string;
}

interface EtablissementSelectionModalProps {
    open: boolean;
    etablissements: EtablissementItem[];
    onSelect: (etablissementId: string) => Promise<void>;
    onCancel?: () => void;
    tokenTemporaire?: string;
    expiresIn?: number;
    // Dual-plane auto-detection (v10.1)
    hasPlatformAccess?: boolean;
    onPlatformAccess?: () => void;
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

/**
 * Label lisible pour un rôle
 */
function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
        'SUPER_ADMIN': 'Super Admin',
        'ADMIN': 'Administrateur',
        'CHEF_ETABLISSEMENT': 'Chef d\'établissement',
        'ENSEIGNANT': 'Enseignant',
        'PARENT': 'Parent',
        'ELEVE': 'Élève',
        'PERSONNEL': 'Personnel',
    };
    return labels[role] || role;
}

/**
 * Card établissement mémorisée pour performance
 */
const EtablissementCard = memo(function EtablissementCard({
    etab,
    index,
    isSelected,
    isSelecting,
    onSelect,
    onDoubleClick,
}: {
    etab: EtablissementItem;
    index: number;
    isSelected: boolean;
    isSelecting: boolean;
    onSelect: (id: string) => void;
    onDoubleClick: (id: string) => void;
}) {
    const etabInitials = getInitials(etab.nom);

    return (
        <motion.button
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
                delay: index * 0.04,
                duration: 0.2,
                layout: { duration: 0.2 }
            }}
            whileHover={!isSelecting ? { scale: 1.02, y: -2 } : {}}
            whileTap={!isSelecting ? { scale: 0.98 } : {}}
            onClick={() => !isSelecting && onSelect(etab.id)}
            onDoubleClick={() => onDoubleClick(etab.id)}
            disabled={isSelecting}
            role="option"
            aria-selected={isSelected}
            aria-label={`${etab.nom} — ${getRoleLabel(etab.role)}`}
            className="group relative flex flex-col gap-[clamp(0.5rem,0.4rem+0.5vw,0.75rem)] rounded-[clamp(0.625rem,0.5rem+0.5vw,0.75rem)] border-2 p-[clamp(0.75rem,0.6rem+0.5vw,1rem)] text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dominante)]/40"
            style={{
                borderColor: isSelected ? 'var(--color-dominante)' : 'var(--color-bordure)',
                backgroundColor: isSelected ? 'var(--color-dominante)/5' : 'var(--color-surface)',
                boxShadow: isSelected
                    ? '0 8px 24px var(--color-dominante)/10, 0 2px 8px var(--color-dominante)/5'
                    : isSelecting && !isSelected
                        ? 'none'
                        : '0 1px 3px rgba(0,0,0,0.05)',
                opacity: isSelecting && !isSelected ? 0.5 : 1,
            }}
        >
            {/* Badge établissement principal */}
            {etab.etablissementPrincipal && (
                <div className="absolute -top-[clamp(0.25rem,0.2rem+0.25vw,0.375rem)] -right-[clamp(0.25rem,0.2rem+0.25vw,0.375rem)] flex h-[clamp(1.25rem,1rem+0.5vw,1.5rem)] w-[clamp(1.25rem,1rem+0.5vw,1.5rem)] items-center justify-center rounded-full bg-amber-400 shadow-sm ring-2 ring-[var(--color-surface)]">
                    <Star
                        className="h-[clamp(0.625rem,0.5rem+0.5vw,0.75rem)] w-[clamp(0.625rem,0.5rem+0.5vw,0.75rem)] text-white"
                        fill="currentColor"
                    />
                </div>
            )}

            {/* Indicateur de sélection */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="absolute -top-[clamp(0.375rem,0.3rem+0.25vw,0.5rem)] -left-[clamp(0.375rem,0.3rem+0.25vw,0.5rem)] flex h-[clamp(1.375rem,1.1rem+0.5vw,1.5rem)] w-[clamp(1.375rem,1.1rem+0.5vw,1.5rem)] items-center justify-center rounded-full bg-[var(--color-dominante)] shadow-sm ring-2 ring-[var(--color-surface)]"
                    >
                        <Check className="h-[clamp(0.6875rem,0.55rem+0.5vw,0.875rem)] w-[clamp(0.6875rem,0.55rem+0.5vw,0.875rem)] text-white" strokeWidth={3} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header : Avatar + Nom */}
            <div className="flex items-center gap-[clamp(0.5rem,0.4rem+0.5vw,0.75rem)]">
                {/* Avatar */}
                {etab.logoUrl ? (
                    <img
                        src={etab.logoUrl}
                        alt={etab.nom}
                        className="h-[clamp(2.5rem,2rem+1vw,3rem)] w-[clamp(2.5rem,2rem+1vw,3rem)] rounded-[clamp(0.5rem,0.4rem+0.5vw,0.625rem)] object-cover shadow-sm"
                    />
                ) : (
                    <div
                        className="flex h-[clamp(2.5rem,2rem+1vw,3rem)] w-[clamp(2.5rem,2rem+1vw,3rem)] items-center justify-center rounded-[clamp(0.5rem,0.4rem+0.5vw,0.625rem)] shadow-sm transition-all duration-200"
                        style={{
                            backgroundColor: isSelected ? 'var(--color-dominante)' : 'var(--color-dominante)/10',
                            color: isSelected ? 'white' : 'var(--color-dominante)',
                        }}
                    >
                        <span className="text-[clamp(0.625rem,0.55rem+0.3vw,0.75rem)] font-bold">{etabInitials}</span>
                    </div>
                )}

                {/* Nom + Code */}
                <div className="flex-1 min-w-0">
                    <h3
                        className="font-semibold truncate transition-colors"
                        style={{
                            fontSize: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
                            color: isSelected ? 'var(--color-dominante)' : 'var(--color-texte)',
                        }}
                    >
                        {etab.nom}
                    </h3>
                    {etab.code && (
                        <span className="mt-[0.125rem] inline-block font-mono" style={{
                            fontSize: 'clamp(0.625rem, 0.6rem + 0.15vw, 0.75rem)',
                            color: 'var(--color-texte-secondaire)/70',
                        }}>
                            {etab.code}
                        </span>
                    )}
                </div>
            </div>

            {/* Footer : Badge rôle */}
            <div className="flex items-center gap-[clamp(0.375rem,0.3rem+0.25vw,0.5rem)]">
                <span
                    className="inline-flex items-center gap-[clamp(0.25rem,0.2rem+0.15vw,0.375rem)] rounded-md px-[clamp(0.375rem,0.3rem+0.25vw,0.5rem)] py-[clamp(0.1875rem,0.15rem+0.15vw,0.25rem)] font-medium transition-colors"
                    style={{
                        fontSize: 'clamp(0.625rem, 0.6rem + 0.15vw, 0.75rem)',
                        backgroundColor: isSelected ? 'var(--color-dominante)/15' : 'var(--color-surface-hover)',
                        color: isSelected ? 'var(--color-dominante)' : 'var(--color-texte-secondaire)',
                    }}
                >
                    <Building2 className="h-[clamp(0.625rem,0.5rem+0.5vw,0.75rem)] w-[clamp(0.625rem,0.5rem+0.5vw,0.75rem)]" />
                    {getRoleLabel(etab.role)}
                </span>
                {etab.etablissementPrincipal && (
                    <span className="font-medium text-amber-600" style={{
                        fontSize: 'clamp(0.625rem, 0.6rem + 0.15vw, 0.75rem)',
                    }}>
                        Principal
                    </span>
                )}
            </div>

            {/* Numéro raccourci clavier */}
            {index < 9 && (
                <div
                    className="absolute bottom-[clamp(0.375rem,0.3rem+0.25vw,0.5rem)] right-[clamp(0.375rem,0.3rem+0.25vw,0.5rem)] flex h-[clamp(1.125rem,0.9rem+0.5vw,1.25rem)] w-[clamp(1.125rem,0.9rem+0.5vw,1.25rem)] items-center justify-center rounded font-bold transition-colors"
                    style={{
                        fontSize: 'clamp(0.5rem, 0.45rem + 0.25vw, 0.625rem)',
                        backgroundColor: isSelected ? 'var(--color-dominante)' : 'var(--color-surface-hover)',
                        color: isSelected ? 'white' : 'var(--color-texte-secondaire)/60',
                    }}
                >
                    {index + 1}
                </div>
            )}
        </motion.button>
    );
});

EtablissementCard.displayName = 'EtablissementCard';

export function EtablissementSelectionModal({
    open,
    etablissements,
    onSelect,
    onCancel,
    expiresIn,
    hasPlatformAccess,
    onPlatformAccess,
}: EtablissementSelectionModalProps) {
    const { t } = useTranslation('common');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [timeLeft, setTimeLeft] = useState<number>(() => {
        // Le backend retourne des secondes, on convertit en millisecondes
        return expiresIn ? expiresIn * 1000 : 0;
    });
    const searchInputRef = useRef<HTMLInputElement>(null);
    const handleConfirmRef = useRef<() => void>(() => {});
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Annulation de la sélection d'établissement.
     * Appelle onCancel (qui doit faire un reset + navigation) pour éviter
     * que les tokens persistés ne provoquent une connexion fantôme au dashboard.
     */
    const handleCancel = useCallback(() => {
        if (onCancel) {
            onCancel();
        }
    }, [onCancel]);

    // Focus sur la recherche à l'ouverture
    useEffect(() => {
        if (open) {
            // Initialiser le temps restant (conversion secondes → millisecondes)
            setTimeLeft(expiresIn ? expiresIn * 1000 : 0);
            setTimeout(() => searchInputRef.current?.focus(), 150);
        } else {
            setSelectedId(null);
            setSearchQuery('');
            setIsSelecting(false);
            setTimeLeft(0);
        }
    }, [open, expiresIn]);

    // Timer décompte en temps réel
    useEffect(() => {
        if (!open || timeLeft <= 0) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        // Intervalle de 1 seconde
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1000) {
                    // Temps écoulé
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    toast.warning(
                        t('modalEtablissement.sessionExpiree', {
                            defaultValue: 'Session expirée. Veuillez vous reconnecter.'
                        })
                    );
                    // Annuler la session (reset + navigation)
                    setTimeout(() => {
                        handleCancel();
                    }, 1500);
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);

        // Cleanup
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [open, timeLeft > 0, t]);

    // Filtrage mémorisé
    const etablissementsFiltres = useMemo(() => {
        if (!searchQuery.trim()) return etablissements;
        const query = searchQuery.toLowerCase().trim();
        return etablissements.filter(e =>
            e.nom.toLowerCase().includes(query) ||
            e.code?.toLowerCase().includes(query) ||
            getRoleLabel(e.role).toLowerCase().includes(query)
        );
    }, [etablissements, searchQuery]);

    // handleConfirm avec useCallback
    const handleConfirm = useCallback(async () => {
        if (!selectedId) {
            toast.error(t('modalEtablissement.selectionRequise', {
                defaultValue: 'Veuillez sélectionner un établissement'
            }));
            return;
        }

        setIsSelecting(true);
        try {
            await onSelect(selectedId);
        } catch (error) {
            toast.error(t('modalEtablissement.erreurSelection', {
                defaultValue: 'Erreur lors de la sélection'
            }));
            setIsSelecting(false);
        }
    }, [selectedId, onSelect, t]);

    handleConfirmRef.current = handleConfirm;

    // Raccourcis clavier
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!open || isSelecting) return;

        const num = parseInt(e.key);
        if (num >= 1 && num <= 9 && num <= etablissementsFiltres.length) {
            e.preventDefault();
            const etab = etablissementsFiltres[num - 1];
            setSelectedId(etab.id);
            return;
        }

        if (e.key === 'Enter' && selectedId) {
            e.preventDefault();
            handleConfirmRef.current();
        }
    }, [open, isSelecting, etablissementsFiltres, selectedId]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Calculer le temps affiché
    const timeRemaining = Math.max(0, Math.floor(timeLeft / 1000));
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const isLowTime = timeRemaining <= 60; // Alerte si < 1 minute

    const handleDoubleClick = (etabId: string) => {
        if (isSelecting) return;
        setSelectedId(etabId);
        setIsSelecting(true);
        onSelect(etabId).catch(() => {
            toast.error(t('modalEtablissement.erreurSelection', {
                defaultValue: 'Erreur lors de la sélection'
            }));
            setIsSelecting(false);
        });
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={() => {}}
            title={t('modalEtablissement.titre', { defaultValue: 'Choisir un établissement' })}
            description={t('modalEtablissement.description', {
                defaultValue: 'Vous appartenez à plusieurs établissements. Sélectionnez celui dans lequel travailler.'
            })}
            size="full"
            initialWidth={Math.min(typeof window !== 'undefined' ? window.innerWidth - 40 : 672, 768)}
            initialHeight={Math.min(typeof window !== 'undefined' ? window.innerHeight - 100 : 500, 700)}
            showClose={false}
            closeOnOverlayClick={false}
            draggable={false}
            resizable={false}
            minimizable={false}
            maximizable={false}
            footer={
                <div className="flex w-full items-center justify-between gap-[clamp(0.5rem,0.4rem+0.5vw,0.75rem)]">
                    {/* Timer compact */}
                    {expiresIn && timeLeft > 0 ? (
                        <motion.div
                            className="flex items-center gap-[clamp(0.25rem,0.2rem+0.25vw,0.375rem)]"
                            animate={isLowTime ? { scale: [1, 1.05, 1] } : {}}
                            transition={{
                                duration: 0.5,
                                repeat: isLowTime ? Infinity : 0,
                            }}
                        >
                            <Timer
                                className="h-[clamp(0.875rem,0.7rem+0.5vw,1rem)] w-[clamp(0.875rem,0.7rem+0.5vw,1rem)]"
                                style={{
                                    color: isLowTime ? 'var(--color-error)' : 'var(--color-texte-secondaire)',
                                }}
                            />
                            <span
                                className="font-mono font-semibold"
                                style={{
                                    fontSize: 'clamp(0.625rem, 0.6rem + 0.15vw, 0.75rem)',
                                    color: isLowTime ? 'var(--color-error)' : 'rgb(217, 119, 6)', // amber-600
                                }}
                            >
                                {minutes}:{seconds.toString().padStart(2, '0')}
                            </span>
                            {isLowTime && (
                                <span
                                    className="ml-[clamp(0.25rem,0.2rem+0.25vw,0.375rem)] font-medium"
                                    style={{
                                        fontSize: 'clamp(0.5625rem, 0.5rem + 0.25vw, 0.6875rem)',
                                        color: 'var(--color-error)',
                                    }}
                                >
                                    {t('modalEtablissement.tempsFaible', { defaultValue: 'Temps restant' })}
                                </span>
                            )}
                        </motion.div>
                    ) : <div />}

                    <div className="flex gap-[clamp(0.5rem,0.4rem+0.5vw,0.75rem)]">
                        {/* Bouton accès plateforme — Dual-plane v10.1 */}
                        {hasPlatformAccess && onPlatformAccess && (
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                onClick={onPlatformAccess}
                                icon={<Server className="h-[clamp(0.875rem,0.7rem+0.5vw,1rem)] w-[clamp(0.875rem,0.7rem+0.5vw,1rem)]" />}
                            >
                                Plateforme
                            </ElisaButton>
                        )}
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                        >
                            {t('boutons.annuler', { defaultValue: 'Annuler' })}
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            onClick={handleConfirm}
                            disabled={!selectedId || isSelecting}
                            isLoading={isSelecting}
                            icon={<ArrowRight className="h-[clamp(0.875rem,0.7rem+0.5vw,1rem)] w-[clamp(0.875rem,0.7rem+0.5vw,1rem)]" />}
                        >
                            {t('modalEtablissement.continuer', { defaultValue: 'Continuer' })}
                        </ElisaButton>
                    </div>
                </div>
            }
        >
            <div className="space-y-[clamp(0.75rem,0.6rem+0.5vw,1rem)]">
                {/* ─── Barre de recherche ─────────────────────────── */}
                {etablissements.length > 3 && (
                    <div className="relative">
                        <Search className="absolute left-[clamp(0.625rem,0.5rem+0.5vw,0.75rem)] top-1/2 h-[clamp(0.875rem,0.7rem+0.5vw,1rem)] w-[clamp(0.875rem,0.7rem+0.5vw,1rem)] -translate-y-1/2 text-[var(--color-texte-secondaire)]" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('modalEtablissement.rechercher', {
                                defaultValue: 'Rechercher un établissement...'
                            })}
                            className="h-[clamp(2.25rem,2rem+0.5vw,2.5rem)] w-full rounded-[clamp(0.375rem,0.3rem+0.25vw,0.5rem)] border border-[var(--color-bordure)] bg-[var(--color-surface)] pl-[clamp(2rem,1.5rem+1vw,2.5rem)] pr-[clamp(2.5rem,2rem+1vw,3rem)] text-sm text-[var(--color-texte)] transition-all placeholder:text-[var(--color-texte-secondaire)]/60 focus:border-[var(--color-dominante)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominante)]/20"
                            style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)' }}
                        />
                        {searchQuery && (
                            <span
                                className="absolute right-[clamp(0.625rem,0.5rem+0.5vw,0.75rem)] top-1/2 -translate-y-1/2"
                                style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.15vw, 0.75rem)', color: 'var(--color-texte-secondaire)' }}
                            >
                                {etablissementsFiltres.length}/{etablissements.length}
                            </span>
                        )}
                    </div>
                )}

                {/* ─── Info compacte ──────────────────────────────── */}
                <div
                    className="flex items-start gap-[clamp(0.5rem,0.4rem+0.5vw,0.625rem)] rounded-[clamp(0.375rem,0.3rem+0.25vw,0.5rem)] border px-[clamp(0.625rem,0.5rem+0.5vw,0.75rem)] py-[clamp(0.5rem,0.4rem+0.5vw,0.625rem)]"
                    style={{
                        backgroundColor: 'var(--color-dominante)/5',
                        borderColor: 'var(--color-dominante)/15',
                    }}
                >
                    <Info className="mt-[0.125rem] shrink-0" style={{
                        height: 'clamp(0.875rem, 0.7rem + 0.5vw, 1rem)',
                        width: 'clamp(0.875rem, 0.7rem + 0.5vw, 1rem)',
                        color: 'var(--color-dominante)',
                    }} />
                    <p className="leading-relaxed" style={{
                        fontSize: 'clamp(0.625rem, 0.6rem + 0.15vw, 0.75rem)',
                        color: 'var(--color-texte-secondaire)',
                    }}>
                        {t('modalEtablissement.info', {
                            defaultValue: 'Sélection obligatoire pour l\'isolation des données. Vous pourrez changer à tout moment depuis le header.'
                        })}
                    </p>
                </div>

                {/* ─── Grid adaptatif responsive ─────────────────── */}
                <div
                    className="grid gap-[clamp(0.5rem,0.4rem+0.5vw,0.75rem)] max-h-[clamp(16rem,14rem+10vw,25rem)] overflow-y-auto pr-[0.125rem]"
                    role="listbox"
                    aria-label={t('modalEtablissement.titre', { defaultValue: 'Choisir un établissement' })}
                    style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, clamp(12.5rem, 10rem + 10vw, 16rem)), 1fr))',
                    }}
                >
                    <AnimatePresence mode="popLayout">
                        {etablissementsFiltres.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="col-span-full flex flex-col items-center gap-[clamp(0.375rem,0.3rem+0.25vw,0.5rem)] py-[clamp(1.5rem,1rem+2vw,2rem)]"
                            >
                                <Search className="h-[clamp(1.5rem,1.2rem+1vw,2rem)] w-[clamp(1.5rem,1.2rem+1vw,2rem)]" style={{ color: 'var(--color-texte-secondaire)/40' }} />
                                <p style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-secondaire)' }}>
                                    {t('modalEtablissement.aucunResultat', { defaultValue: 'Aucun établissement trouvé' })}
                                </p>
                            </motion.div>
                        ) : (
                            etablissementsFiltres.map((etab, index) => (
                                <EtablissementCard
                                    key={etab.id}
                                    etab={etab}
                                    index={index}
                                    isSelected={selectedId === etab.id}
                                    isSelecting={isSelecting}
                                    onSelect={(id) => !isSelecting && setSelectedId(id)}
                                    onDoubleClick={handleDoubleClick}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* ─── Aide raccourcis clavier ───────────────────── */}
                <div className="flex items-center justify-center gap-[clamp(0.75rem,0.6rem+0.5vw,1rem)]" style={{
                    fontSize: 'clamp(0.5625rem, 0.5rem + 0.25vw, 0.6875rem)',
                    color: 'var(--color-texte-secondaire)/70',
                }}>
                    <span className="flex items-center gap-[0.25rem]">
                        <kbd className="rounded px-[0.25rem] py-[0.125rem] font-mono" style={{ backgroundColor: 'var(--color-surface-hover)' }}>1</kbd>
                        <span>-</span>
                        <kbd className="rounded px-[0.25rem] py-[0.125rem] font-mono" style={{ backgroundColor: 'var(--color-surface-hover)' }}>9</kbd>
                        <span>{t('modalEtablissement.raccourciSelection', { defaultValue: 'Sélection rapide' })}</span>
                    </span>
                    <span className="flex items-center gap-[0.25rem]">
                        <kbd className="rounded px-[0.25rem] py-[0.125rem] font-mono" style={{ backgroundColor: 'var(--color-surface-hover)' }}>↵</kbd>
                        <span>{t('modalEtablissement.raccourciConfirmer', { defaultValue: 'Confirmer' })}</span>
                    </span>
                </div>
            </div>
        </CustomModal>
    );
}

export default EtablissementSelectionModal;
