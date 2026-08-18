/**
 * ==================================
 * eLISAschool - Section Packs Quota
 * ==================================
 * Liste des packs disponibles par ressource (élèves, stockage, SMS).
 * Affiche le prorata dynamique pour le cycle en cours.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Users, User, School, HardDrive, MessageSquare, Package, Check, ShoppingCart, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ElisaButton } from '@/components/ui';
import type { PackQuota } from '@/features/billing/types/plan.types';
import { formatPrix } from '@/features/billing/types/plan.types';

// =============================================
// Types
// =============================================

interface PacksSectionProps {
    /** Classe CSS personnalisée */
    className?: string;
}

// =============================================
// Hook — Liste des packs
// =============================================

function usePacks() {
    return useQuery<PackQuota[]>({
        queryKey: ['packs-quota-disponibles'],
        queryFn: async () => {
            const res = await apiClient.get<PackQuota[]>('/api/billing/packs');
            const payload = res.data as any;
            const liste = Array.isArray(payload) ? payload : payload?.data ?? [];
            return (liste as PackQuota[]).filter((p) => p.actif).sort((a, b) => a.ordre - b.ordre);
        },
    });
}

// =============================================
// Hook — Souscription pack
// =============================================

function useSouscrirePack() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (packId: string) => {
            const res = await apiClient.post(`/api/billing/packs/${packId}/souscrire`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['packs-quota-disponibles'] });
            queryClient.invalidateQueries({ queryKey: ['mon-abonnement'] });
        },
    });
}

// =============================================
// Label ressource
// =============================================

const RESSOURCE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    eleves: { label: 'Élèves', icon: Users },
    utilisateurs: { label: 'Utilisateurs', icon: User },
    classes: { label: 'Classes', icon: School },
    stockageGo: { label: 'Stockage (Go)', icon: HardDrive },
    sms: { label: 'SMS', icon: MessageSquare },
};

// =============================================
// Composant principal
// =============================================

export function PacksSection({ className }: PacksSectionProps) {
    const { t } = useTranslation('billing');
    const { data: packs, isLoading } = usePacks();
    const souscrirePack = useSouscrirePack();
    const [packSelectionne, setPackSelectionne] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className={cn('animate-pulse space-y-4', className)}>
                <div className="h-6 w-48 rounded bg-[var(--color-surface-hover)]" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-40 rounded-xl bg-[var(--color-surface-hover)]" />
                    ))}
                </div>
            </div>
        );
    }

    if (!packs || packs.length === 0) return null;

    // Grouper par ressource
    const parRessource = packs.reduce<Record<string, PackQuota[]>>((acc, pack) => {
        if (!acc[pack.ressource]) acc[pack.ressource] = [];
        acc[pack.ressource].push(pack);
        return acc;
    }, {});

    return (
        <section className={cn('space-y-8', className)}>
            <div className="text-center">
                <h2 className="text-2xl font-bold text-[var(--color-texte)]">
                    {t('packs.titre', 'Boostez votre abonnement')}
                </h2>
                <p className="mt-2 text-[var(--color-texte-secondaire)]">
                    {t('packs.description', 'Ajoutez des quotas supplémentaires à votre plan actuel')}
                </p>
            </div>

            {Object.entries(parRessource).map(([ressource, packsRessource]) => {
                const config = RESSOURCE_CONFIG[ressource] ?? { label: ressource, icon: Package };
                const RessourceIcon = config.icon;
                return (
                    <div key={ressource}>
                        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--color-texte)]">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-dominante)]/10">
                                <RessourceIcon className="h-4 w-4 text-[var(--color-dominante)]" />
                            </div>
                            <span>{config.label}</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {packsRessource.map((pack, idx) => (
                                <div
                                    key={pack.id}
                                    className={cn(
                                        'relative flex flex-col rounded-xl border p-5 transition-all',
                                        'border-[var(--color-bordure)] hover:border-[var(--color-dominante)]/50 hover:shadow-md',
                                        idx === 1 && 'ring-2 ring-[var(--color-dominante)]/20',
                                    )}
                                >
                                    {/* Badge populaire */}
                                    {idx === 1 && (
                                        <span className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-[var(--color-dominante)] px-2.5 py-0.5 text-xs font-bold text-white">
                                            <Star className="h-3 w-3" />
                                            {t('packs.populaire', 'Populaire')}
                                        </span>
                                    )}

                                    <div className="mb-3">
                                        <p className="font-semibold text-[var(--color-texte)]">{pack.nom}</p>
                                        {pack.description && (
                                            <p className="mt-1 text-xs text-[var(--color-texte-secondaire)]">{pack.description}</p>
                                        )}
                                    </div>

                                    <div className="mb-3 flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-[var(--color-texte)]">
                                            {formatPrix(Number(pack.prix))}
                                        </span>
                                        <span className="text-xs text-[var(--color-texte-secondaire)]">{pack.devise}</span>
                                    </div>

                                    <ul className="mb-4 flex-1 space-y-1 text-sm text-[var(--color-texte-secondaire)]">
                                        <li className="flex items-center gap-2">
                                            <Check className="h-3.5 w-3.5 text-[var(--color-success-600)]" />
                                            +{pack.quantite.toLocaleString('fr-FR')} {config.label.toLowerCase()}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="h-3.5 w-3.5 text-[var(--color-success-600)]" />
                                            {pack.dureeValidite === 'CYCLE_COURANT'
                                                ? t('packs.cycleCourant', 'Cycle en cours')
                                                : t('packs.illimite', 'Durée illimitée')}
                                        </li>
                                    </ul>

                                    <ElisaButton
                                        onClick={() => setPackSelectionne(pack.id)}
                                        disabled={souscrirePack.isPending}
                                        isLoading={souscrirePack.isPending}
                                        icon={<ShoppingCart className="h-4 w-4" />}
                                    >
                                        {t('packs.acheter', 'Acheter')}
                                    </ElisaButton>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Modal confirmation — ConfirmationModal (règle 23) */}
            <ConfirmationModal
                isOpen={!!packSelectionne}
                title={t('packs.confirmation.titre', 'Confirmer l\'achat')}
                message={t('packs.confirmation.message', 'Votre pack sera activé immédiatement et facturé au prorata du cycle en cours.')}
                confirmLabel={souscrirePack.isPending ? '...' : t('packs.confirmation.confirmer', 'Confirmer')}
                cancelLabel={t('packs.confirmation.annuler', 'Annuler')}
                variant="info"
                isLoading={souscrirePack.isPending}
                onConfirm={() => {
                    souscrirePack.mutate(packSelectionne!, {
                        onSuccess: () => {
                            setPackSelectionne(null);
                            toast.success(t('packs.succes', 'Pack activé avec succès'));
                        },
                        onError: () => {
                            setPackSelectionne(null);
                            toast.error(t('packs.erreur', 'Erreur lors de l\'achat du pack'));
                        },
                    });
                }}
                onCancel={() => setPackSelectionne(null)}
            />
        </section>
    );
}

export default PacksSection;
