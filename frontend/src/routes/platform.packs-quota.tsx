/**
 * ==================================
 * eLISAschool - Plateforme — Packs de quota
 * ==================================
 *
 * CRUD des packs de quota supplémentaires (Refonte v3, migration 213).
 * Un pack augmente le quota effectif d'une ressource (élèves, stockage,
 * SMS…) au prorata du cycle restant lors de la souscription.
 *
 * Refonte v4.3 — Types partagés + modal CustomModal + i18n
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { PackFormModal } from '@/features/platform';
import { ElisaButton } from '@/components/ui';
import { PackagePlus, Plus, Pencil, Trash2, Users, HardDrive, MessageSquare } from 'lucide-react';
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
            const res = await apiClient.get<{ success: boolean; data: PackQuota[] }>('/api/platform/packs-quota');
            return res.data?.data ?? [];
        },
    });
}

// =============================================
// Page principale
// =============================================

function PacksQuotaPage() {
    const { t } = useTranslation('plans');
    const { data: packs, isLoading } = usePacks();
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

    const handleDelete = (pack: PackQuota) => {
        setPackToDelete(pack);
    };

    const confirmDelete = () => {
        if (packToDelete) {
            deleteMutation.mutate(packToDelete.id);
            setPackToDelete(null);
        }
    };

    return (
        <div className="space-y-[var(--space-lg)] p-[clamp(1rem,0.75rem+1vw,1.5rem)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <PackagePlus className="h-6 w-6 text-[var(--color-dominante)]" />
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

            {/* Grille packs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading && (
                    <div className="col-span-full py-8 text-center text-[var(--color-texte-secondaire)]">
                        {t('packs.chargement')}
                    </div>
                )}
                {(packs ?? []).map(pack => {
                    const RessourceIcon = pack.ressource === 'eleves' ? Users
                        : pack.ressource === 'stockage' ? HardDrive
                        : pack.ressource === 'sms' ? MessageSquare
                        : PackagePlus;
                    return (
                        <div key={pack.id} className="flex flex-col rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-md">
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
                            {/* Description (si définie) */}
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
                        </div>
                    );
                })}
                {/* Empty state */}
                {!isLoading && (packs ?? []).length === 0 && (
                    <div className="col-span-full flex flex-col items-center rounded-2xl border-2 border-dashed border-[var(--color-bordure)] py-12">
                        <PackagePlus className="mb-3 h-10 w-10 text-[var(--color-texte-muted)]" />
                        <p className="text-[var(--color-texte-secondaire)]">{t('packs.aucunPack')}</p>
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
            </div>

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
