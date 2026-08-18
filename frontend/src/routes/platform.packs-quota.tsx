/**
 * ==================================
 * eLISAschool - Plateforme — Packs de quota (v3.4)
 * ==================================
 *
 * CRUD des packs de quota supplémentaires (Refonte v3, migration 213).
 * Refonte v3.4 — Skeleton loading, animations, error states,
 * responsive 320px-2560px, dark mode.
 *
 * Version: 3.4.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api-client';
import { PackFormModal } from '@/features/platform';
import { ElisaButton } from '@/components/ui';
import { PackagePlus, Plus, Pencil, Trash2, Users, HardDrive, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import type { PackQuota } from '@/features/billing/types/plan.types';
import { formatPrix } from '@/features/billing/types/plan.types';

// =============================================
// Hooks
// =============================================

function usePacks() {
    return useQuery<PackQuota[]>({
        queryKey: ['platform-packs-quota'],
        queryFn: async () => {
            const res = await apiClient.get<PackQuota[]>('/api/platform/packs-quota');
            const payload = res.data as any;
            return Array.isArray(payload) ? payload : payload?.data ?? [];
        },
    });
}

// =============================================
// Skeleton
// =============================================

function PacksSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-4 rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[var(--color-surface-hover)]" />
                        <div className="space-y-1.5">
                            <div className="h-4 w-24 rounded bg-[var(--color-surface-hover)]" />
                            <div className="h-3 w-16 rounded bg-[var(--color-surface-hover)]" />
                        </div>
                    </div>
                    <div className="h-3 w-full rounded bg-[var(--color-surface-hover)]" />
                    <div className="space-y-2">
                        {[1, 2, 3].map((j) => (
                            <div key={j} className="h-4 w-full rounded bg-[var(--color-surface-hover)]" />
                        ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--color-bordure)] pt-3">
                        <div className="h-6 w-20 rounded bg-[var(--color-surface-hover)]" />
                        <div className="flex gap-1">
                            <div className="h-7 w-14 rounded bg-[var(--color-surface-hover)]" />
                            <div className="h-7 w-14 rounded bg-[var(--color-surface-hover)]" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// =============================================
// Page principale
// =============================================

function PacksQuotaPage() {
    const { t } = useTranslation('plans');
    const { data: packs, isLoading, isError, refetch } = usePacks();
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [packEdit, setPackEdit] = useState<PackQuota | null>(null);
    const [packToDelete, setPackToDelete] = useState<PackQuota | null>(null);

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => apiClient.delete(`/api/platform/packs-quota/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-packs-quota'] });
            toast.success(t('packs.supprimeAvecSucces'));
        },
    });

    const handleDelete = (pack: PackQuota) => setPackToDelete(pack);
    const confirmDelete = () => {
        if (packToDelete) {
            deleteMutation.mutate(packToDelete.id);
            setPackToDelete(null);
        }
    };

    return (
        <div className="space-y-[var(--space-lg)] p-[clamp(1rem,0.75rem+1vw,1.5rem)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-dominante)]/10">
                        <PackagePlus className="h-5 w-5 text-[var(--color-dominante)]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--color-texte)]">{t('packs.titre')}</h1>
                        <p className="text-sm text-[var(--color-texte-secondaire)]">
                            {t('packs.description')}
                        </p>
                    </div>
                </div>
                <ElisaButton
                    onClick={() => { setPackEdit(null); setModalOpen(true); }}
                    size="sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('packs.nouveau')}
                </ElisaButton>
            </div>

            {/* Loading */}
            {isLoading && <PacksSkeleton />}

            {/* Error */}
            {isError && (
                <div className="flex flex-col items-center rounded-2xl border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] py-8">
                    <AlertCircle className="mb-2 h-8 w-8 text-[var(--color-danger-500)]" />
                    <p className="text-[var(--color-texte)]">{t('packs.erreurChargement', 'Erreur de chargement des packs')}</p>
                    <ElisaButton variant="ghost" size="sm" className="mt-2" onClick={() => refetch()} icon={<RefreshCw className="h-4 w-4" />}>
                        {t('plans.reessayer', 'Réessayer')}
                    </ElisaButton>
                </div>
            )}

            {/* Grille packs */}
            {!isLoading && !isError && (
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {(packs ?? []).length === 0 && (
                            <div className="col-span-full flex flex-col items-center rounded-2xl border-2 border-dashed border-[var(--color-bordure)] py-12">
                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-hover)]">
                                    <PackagePlus className="h-7 w-7 text-[var(--color-texte-muted)]" />
                                </div>
                                <p className="text-[var(--color-texte-secondaire)]">{t('packs.aucunPack')}</p>
                                <p className="mt-1 text-xs text-[var(--color-texte-muted)]">{t('packs.aucunPackDesc', 'Créez des packs de quotas pour permettre aux établissements d\'augmenter leurs limites.')}</p>
                                <ElisaButton
                                    size="sm"
                                    className="mt-3"
                                    onClick={() => { setPackEdit(null); setModalOpen(true); }}
                                    icon={<Plus className="h-4 w-4" />}
                                >
                                    {t('packs.nouveau')}
                                </ElisaButton>
                            </div>
                        )}
                        {(packs ?? []).map((pack, index) => {
                            const RessourceIcon = pack.ressource === 'eleves' ? Users
                                : pack.ressource === 'stockageGo' ? HardDrive
                                : pack.ressource === 'sms' ? MessageSquare
                                : PackagePlus;
                            return (
                                <motion.div
                                    key={pack.id}
                                    layout
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    transition={{ delay: index * 0.04 }}
                                    className="flex flex-col rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-md"
                                >
                                    {/* Header : nom + statut */}
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className={cn(
                                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                                                pack.actif
                                                    ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                                    : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]',
                                            )}>
                                                <RessourceIcon className="h-4.5 w-4.5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold leading-tight text-[var(--color-texte)]">{pack.nom}</h3>
                                                <p className="font-mono text-xs text-[var(--color-texte-secondaire)]">{pack.code}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                            pack.actif
                                                ? 'bg-[var(--color-success-100)] text-[var(--color-success-700)]'
                                                : 'bg-[var(--color-surface-hover)] text-[var(--color-texte-muted)]',
                                        )}>
                                            <span className={cn('h-1.5 w-1.5 rounded-full', pack.actif ? 'bg-[var(--color-success-500)]' : 'bg-[var(--color-texte-muted)]')} />
                                            {pack.actif ? t('packs.actif') : t('packs.inactif')}
                                        </span>
                                    </div>
                                    {/* Description */}
                                    {pack.description && (
                                        <p className="mb-3 line-clamp-2 text-xs text-[var(--color-texte-secondaire)]">
                                            {pack.description}
                                        </p>
                                    )}
                                    {/* Détails ressource */}
                                    <div className="mb-4 space-y-1.5 text-sm text-[var(--color-texte-secondaire)]">
                                        <div className="flex items-center justify-between">
                                            <span>{t('packs.ressource')}</span>
                                            <span className="font-medium capitalize text-[var(--color-texte)]">{pack.ressource}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>{t('packs.quantite')}</span>
                                            <span className="font-semibold text-[var(--color-dominante)]">+{pack.quantite.toLocaleString('fr-FR')}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>{t('packs.dureeValidite')}</span>
                                            <span className="text-[var(--color-texte)]">{pack.dureeValidite === 'ILLIMITE' ? t('packs.illimite') : t('packs.cycleCourant')}</span>
                                        </div>
                                    </div>
                                    {/* Prix + Actions */}
                                    <div className="mt-auto flex items-center justify-between border-t border-[var(--color-bordure)]/50 pt-3">
                                        <div className="text-lg font-bold text-[var(--color-texte)]">
                                            {formatPrix(pack.prix)} <span className="text-xs font-normal text-[var(--color-texte-secondaire)]">{pack.devise}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <ElisaButton
                                                variant="ghost"
                                                size="xs"
                                                onClick={() => { setPackEdit(pack); setModalOpen(true); }}
                                                icon={<Pencil className="h-3.5 w-3.5" />}
                                            >
                                                <span className="hidden sm:inline">{t('plans.modifier')}</span>
                                            </ElisaButton>
                                            <ElisaButton
                                                variant="ghost"
                                                size="xs"
                                                onClick={() => handleDelete(pack)}
                                                className="text-[var(--color-danger-500)] hover:text-[var(--color-danger-700)]"
                                                icon={<Trash2 className="h-3.5 w-3.5" />}
                                            >
                                                <span className="hidden sm:inline">{t('plans.supprimer')}</span>
                                            </ElisaButton>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </AnimatePresence>
            )}

            <PackFormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                pack={packEdit}
            />

            <ConfirmationModal
                isOpen={!!packToDelete}
                title={t('packs.supprimerTitre', 'Supprimer ce pack')}
                message={t('packs.confirmerSuppression', { nom: packToDelete?.nom ?? '' })}
                variant="danger"
                confirmLabel={t('common:actions.supprimer', 'Supprimer')}
                cancelLabel={t('common:actions.annuler', 'Annuler')}
                onConfirm={confirmDelete}
                onCancel={() => setPackToDelete(null)}
            />
        </div>
    );
}

export const Route = createFileRoute('/platform/packs-quota')({
    component: PacksQuotaPage,
});
