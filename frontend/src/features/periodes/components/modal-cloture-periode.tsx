/**
 * ==================================
 * eLISAschool - Modal Clôture Période
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Vérifie les impacts avant clôture (notes, bulletins)
 * Affiche un résumé + avertissements + confirmation
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle, Lock, FileText,
    CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import { useVerifierImpacts, useCloturerPeriode } from '../hooks/use-periodes';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { Periode } from '../types/periode.types';

interface ModalCloturePeriodeProps {
    periode: Periode | null;
    isOpen: boolean;
    onClose: () => void;
    onClotureSuccess?: () => void;
}

export function ModalCloturePeriode({ periode, isOpen, onClose, onClotureSuccess }: ModalCloturePeriodeProps) {
    const [commentaire, setCommentaire] = useState('');
    const [forcer, setForcer] = useState(false);

    const { data: impacts, isLoading: isLoadingImpacts, refetch: refetchImpacts } = useVerifierImpacts(periode?.id || '');
    const cloturer = useCloturerPeriode();

    // Reset au changement de période
    useEffect(() => {
        if (periode) {
            setCommentaire('');
            setForcer(false);
            refetchImpacts();
        }
    }, [periode?.id]);

    if (!periode) return null;

    const peutCloturer = impacts?.peutCloturer ?? true;
    const estBloquant = impacts?.bloquant ?? false;

    const handleCloturer = async () => {
        try {
            await cloturer.mutateAsync({
                id: periode.id,
                commentaire: commentaire || undefined,
                forcer: forcer && !estBloquant ? false : forcer,
            });
            onClotureSuccess?.();
            onClose();
        } catch {
            // L'erreur est gérée par le hook (toast)
        }
    };

    return (
        <CustomModal
            open={isOpen}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title="Clôturer la période"
            description={`Vérification des impacts avant clôture de "${periode.nom}"`}
            size="2xl"
            footer={
                <div className="flex items-center gap-[var(--gap-sm)] justify-end">
                    <ElisaButton variant="outline" onClick={onClose}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        icon={<Lock className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        isLoading={cloturer.isPending}
                        disabled={!peutCloturer && !forcer}
                        onClick={handleCloturer}
                    >
                        {estBloquant && forcer ? 'Forcer la clôture' : 'Clôturer'}
                    </ElisaButton>
                </div>
            }
        >
            <div className="flex flex-col gap-[var(--gap-md)]">
                {/* Chargement des impacts */}
                {isLoadingImpacts && (
                    <div className="flex items-center justify-center py-[var(--space-lg)] gap-[var(--gap-sm)]">
                        <Loader2 className="h-[var(--icon-md)] w-[var(--icon-md)] animate-spin text-[var(--color-dominant-600)]" />
                        <span className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                            Vérification des impacts...
                        </span>
                    </div>
                )}

                {/* Résumé des impacts */}
                {impacts && !isLoadingImpacts && (
                    <>
                        {/* Message principal */}
                        <div className={`rounded-[var(--radius-lg)] border p-[var(--space-md)] ${
                            estBloquant
                                ? 'bg-red-50 border-red-200'
                                : impacts.notes.count > 0 || impacts.bulletins.count > 0
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-[var(--color-dominant-50)] border-[var(--color-dominant-200)]'
                        }`}>
                            <div className="flex items-start gap-[var(--gap-sm)]">
                                {estBloquant ? (
                                    <XCircle className="h-[var(--icon-md)] w-[var(--icon-md)] text-red-600 shrink-0 mt-[var(--space-xxs)]" />
                                ) : impacts.notes.count > 0 || impacts.bulletins.count > 0 ? (
                                    <AlertTriangle className="h-[var(--icon-md)] w-[var(--icon-md)] text-amber-600 shrink-0 mt-[var(--space-xxs)]" />
                                ) : (
                                    <CheckCircle2 className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-dominant-600)] shrink-0 mt-[var(--space-xxs)]" />
                                )}
                                <p className="text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                    {impacts.message}
                                </p>
                            </div>
                        </div>

                        {/* Détails des impacts */}
                        <div className="grid grid-cols-2 gap-[var(--gap-sm)]">
                            <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--space-md)' }}>
                                <div className="flex items-center gap-[var(--gap-xs)] mb-[var(--space-xxs)]">
                                    <FileText className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-dominant-600)]" />
                                    <span style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }} className="text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                                        Notes
                                    </span>
                                </div>
                                <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(1.125rem, 1rem + 0.5vw, 1.5rem)' }}>
                                    {impacts.notes.count}
                                </p>
                                {impacts.notes.enAttenteValidation > 0 && (
                                    <p className="text-red-600 font-medium mt-[var(--space-xxs)]" style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }}>
                                        {impacts.notes.enAttenteValidation} en attente de validation
                                    </p>
                                )}
                            </div>

                            <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--space-md)' }}>
                                <div className="flex items-center gap-[var(--gap-xs)] mb-[var(--space-xxs)]">
                                    <FileText className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-secondary-600)]" />
                                    <span style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }} className="text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                                        Bulletins
                                    </span>
                                </div>
                                <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(1.125rem, 1rem + 0.5vw, 1.5rem)' }}>
                                    {impacts.bulletins.count}
                                </p>
                            </div>
                        </div>

                        {/* Blocage dur — option forcer */}
                        {estBloquant && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50"
                                style={{ padding: 'var(--space-md)' }}
                            >
                                <label className="flex items-start gap-[var(--gap-sm)] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={forcer}
                                        onChange={(e) => setForcer(e.target.checked)}
                                        className="mt-[var(--space-xxs)] rounded border-[var(--color-bordure)]"
                                    />
                                    <div>
                                        <p className="font-medium text-red-800" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                            Forcer la clôture malgré les notes en attente
                                        </p>
                                        <p className="text-red-600" style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }}>
                                            Les notes non validées seront ignorées. Cette action nécessite les permissions appropriées.
                                        </p>
                                    </div>
                                </label>
                            </motion.div>
                        )}

                        {/* Commentaire */}
                        <div>
                            <label
                                className="block text-[var(--color-text-secondary)] mb-[var(--space-xxs)] font-medium"
                                style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                            >
                                Commentaire (optionnel)
                            </label>
                            <textarea
                                value={commentaire}
                                onChange={(e) => setCommentaire(e.target.value)}
                                placeholder="Raison de la clôture..."
                                rows={2}
                                className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] resize-none"
                                style={{
                                    padding: 'var(--space-sm)',
                                    fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)',
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        </CustomModal>
    );
}
