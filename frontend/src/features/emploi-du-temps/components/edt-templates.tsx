import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Copy, FileText, Plus, Trash2, Edit2 } from 'lucide-react';
import {
    useTemplatesEDT,
    useSupprimerTemplateEDT,
    useDupliquerTemplateEDT,
} from '../hooks/use-emploi-du-temps';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals/CustomModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';

export function EDTTemplatesPage() {
    const { t } = useTranslation('emplois');
    const navigate = useNavigate();
    const { data: templates, isLoading, error, refetch } = useTemplatesEDT();
    const supprimerTemplate = useSupprimerTemplateEDT();
    const dupliquerTemplate = useDupliquerTemplateEDT();

    const [creationModalOpen, setCreationModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

    const handleDupliquer = async (id: string) => {
        await dupliquerTemplate.mutateAsync({ id });
    };

    const handleSupprimer = async () => {
        if (templateToDelete) {
            await supprimerTemplate.mutateAsync(templateToDelete);
            setTemplateToDelete(null);
        }
    };

    if (error) {
        return <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />;
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                variant="gradient"
                icon={FileText}
                title={t('templates.titre')}
                subtitle={t('templates.description')}
                onBack={() => navigate({ to: '/emploi-du-temps' })}
                actions={
                    <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-2">
                        <ElisaButton variant="primary" size="xs" icon={<Plus className="h-4 w-4" />} onClick={() => setCreationModalOpen(true)}>
                            {t('templates.nouveau')}
                        </ElisaButton>
                    </div>
                }
            />

            {isLoading ? (
                <PageSkeleton showHeader={false} showStats={false} showTable={false} />
            ) : !templates?.data || templates.data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="h-16 w-16 text-[var(--color-text-muted)] mb-4" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{t('templates.vide.titre')}</h3>
                    <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">{t('templates.vide.description')}</p>
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setCreationModalOpen(true)}>
                        {t('templates.vide.action')}
                    </ElisaButton>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.data.map((template: { id: string; nom: string; description?: string; actif: boolean; configuration?: any; creneauxTypes?: any[]; estPartage?: boolean }, index: number) => (
                        <motion.div
                            key={template.id}
                            className="p-6 rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm hover:shadow-md transition-shadow"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">
                                        {template.nom}
                                    </h3>
                                    {template.description && (
                                        <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                                            {template.description}
                                        </p>
                                    )}
                                </div>

                                {template.estPartage && (
                                    <span className="shrink-0 ml-2 px-2 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium rounded-full">
                                        {t('templates.partage')}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2 text-sm text-[var(--color-text-secondary)] mb-4">
                                <div className="flex justify-between">
                                    <span>{t('templates.creneauxTypes')}</span>
                                    <span className="font-semibold text-[var(--color-text-primary)]">
                                        {template.creneauxTypes?.length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('templates.joursTravailles')}</span>
                                    <span className="font-semibold text-[var(--color-text-primary)]">
                                        {template.configuration?.joursTravailles?.length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('templates.heureDebut')}</span>
                                    <span className="font-semibold text-[var(--color-text-primary)]">
                                        {template.configuration?.heureDebutCours || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('templates.heureFin')}</span>
                                    <span className="font-semibold text-[var(--color-text-primary)]">
                                        {template.configuration?.heureFinCours || '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-[var(--color-bordure)]">
                                <ElisaButton variant="outline" size="xs" icon={<Copy className="h-3 w-3" />}
                                    onClick={() => handleDupliquer(template.id)}
                                    disabled={dupliquerTemplate.isPending}
                                >
                                    {t('templates.dupliquer')}
                                </ElisaButton>
                                <ElisaButton variant="ghost" size="xs" icon={<Edit2 className="h-3 w-3" />}
                                    onClick={() => toast.info('Fonctionnalité à venir')}
                                >
                                    {t('templates.modifier')}
                                </ElisaButton>
                                <ElisaButton variant="ghost" size="xs" icon={<Trash2 className="h-3 w-3" />}
                                    onClick={() => setTemplateToDelete(template.id)}
                                    disabled={supprimerTemplate.isPending}
                                >
                                    {t('templates.supprimer')}
                                </ElisaButton>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <CustomModal open={creationModalOpen} onOpenChange={setCreationModalOpen}
                title={t('templates.creationTitre')}
                description={t('templates.creationDesc')}
                size="lg"
            >
                <div className="p-6 text-center">
                    <p className="text-[var(--color-text-secondary)] mb-4">{t('templates.creationDesc')}</p>
                    <ElisaButton variant="primary" onClick={() => setCreationModalOpen(false)}>
                        {t('templates.creationFermer')}
                    </ElisaButton>
                </div>
            </CustomModal>

            <ConfirmDialog
                open={!!templateToDelete}
                onOpenChange={(v) => { if (!v) setTemplateToDelete(null); }}
                title={t('templates.supprimerTitre')}
                description={t('templates.supprimerMessage')}
                confirmText={t('templates.supprimerConfirmer')}
                variant="danger"
                onConfirm={handleSupprimer}
            />
        </div>
    );
}