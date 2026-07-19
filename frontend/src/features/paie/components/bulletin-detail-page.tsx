import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Wallet, Edit, Trash2, FileDown } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePaiePermissions } from '../hooks/use-paie-permissions';
import { useSupprimerBulletin } from '../hooks/use-paie';
import { BulletinFormModal } from './bulletin-form-modal';

interface BulletinDetailPageProps {
    bulletinId: string;
}

export function BulletinDetailPage({ bulletinId }: BulletinDetailPageProps) {
    const navigate = useNavigate();
    const { t } = useTranslation('paie');
    const perms = usePaiePermissions();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const supprimer = useSupprimerBulletin();

    const handleDelete = async () => {
        await supprimer.mutateAsync(bulletinId);
        setShowDeleteDialog(false);
        navigate({ to: '/paie' });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                title={t('detailBulletin')}
                icon={Wallet}
                onBack={() => navigate({ to: '/paie' })}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {perms.canEdit && (
                            <ElisaButton variant="outline" size="sm" icon={<Edit className="h-4 w-4" />} onClick={() => setShowEditModal(true)}>
                                {t('actions.modifier')}
                            </ElisaButton>
                        )}
                        {perms.canExport && (
                            <ElisaButton variant="outline" size="sm" icon={<FileDown className="h-4 w-4" />} onClick={() => window.open(`/api/paie/bulletins/${bulletinId}/pdf`, '_blank')}>
                                {t('actions.pdf')}
                            </ElisaButton>
                        )}
                        {perms.canDelete && (
                            <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} isLoading={supprimer.isPending} onClick={() => setShowDeleteDialog(true)}>
                                {t('actions.supprimer')}
                            </ElisaButton>
                        )}
                    </div>
                }
            />

            <BulletinFormModal
                open={showEditModal}
                onOpenChange={(v) => { if (!v) setShowEditModal(false); }}
                bulletin={null}
                onSave={async () => {}}
                isLoading={false}
            />

            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={(open) => { if (!open) setShowDeleteDialog(false); }}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage')}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
