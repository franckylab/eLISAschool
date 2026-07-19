/**
 * ==================================
 * eLISAschool - Page Détail Filière
 * ==================================
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Split, CheckCircle, XCircle } from 'lucide-react';
import { useFiliere, useModifierFiliere, useSupprimerFiliere } from '../hooks/use-filieres';
import { FiliereFormModal } from './filiere-form-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';

export function FiliereDetailPage() {
    const { id } = useParams({ from: '/_auth/filieres/$id' });
    const navigate = useNavigate();
    const { t } = useTranslation('filieres');
    const { hasPermission } = usePermissions();
    const { data: filiere, isLoading, isError, error, refetch } = useFiliere(id);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const modifier = useModifierFiliere();
    const supprimer = useSupprimerFiliere();

    const handleSave = async (data: any) => {
        await modifier.mutateAsync({ id: filiere!.id, ...data });
        setFormOpen(false);
    };

    const handleDelete = async () => {
        await supprimer.mutateAsync(id);
        navigate({ to: '/filieres' });
    };

    if (isLoading) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;
    if (!filiere) return <ErrorMessage message={t('detail.nonTrouvee')} />;

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>
            <PageHeader
                variant="gradient"
                title={filiere.nom}
                subtitle={filiere.code}
                icon={Split}
                onBack={() => navigate({ to: '/filieres' })}
                actions={
                    <>
                        {hasPermission('filieres:edit') && (
                            <ElisaButton
                                onClick={() => setFormOpen(true)}
                                icon={<Edit className="h-4 w-4" />}
                                variant="primary"
                            >
                                {t('actions.modifier')}
                            </ElisaButton>
                        )}
                        {hasPermission('filieres:delete') && (
                            <ElisaButton
                                onClick={() => setDeleteConfirmOpen(true)}
                                icon={<Trash2 className="h-4 w-4" />}
                                variant="danger"
                            >
                                {t('actions.supprimer')}
                            </ElisaButton>
                        )}
                    </>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--gap-md)]">
                <div className="lg:col-span-2 space-y-[var(--gap-md)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('detail.informations')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <InfoField label={t('colonne.nom')} value={filiere.nom} />
                                <InfoField label={t('colonne.code')} value={filiere.code} />
                                <InfoField
                                    label={t('detail.sousSysteme')}
                                    value={t(`sousSysteme.${filiere.sousSysteme}`)}
                                />
                                <InfoField
                                    label={t('detail.cycle')}
                                    value={filiere.cycle?.nom || '-'}
                                />
                                <InfoField
                                    label={t('detail.statut')}
                                    value={
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${filiere.actif ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                            {filiere.actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            {filiere.actif ? t('statut.actif') : t('statut.inactif')}
                                        </span>
                                    }
                                />
                                {filiere.description && (
                                    <div className="col-span-2 pt-4 border-t border-[var(--color-bordure)]">
                                        <InfoField label={t('detail.description')} value={filiere.description} />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-[var(--gap-md)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('detail.statut')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`rounded-lg p-4 ${filiere.actif ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {filiere.actif
                                        ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    }
                                    <span className={`font-semibold ${filiere.actif ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                        {filiere.actif ? t('statut.actif') : t('statut.inactif')}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {formOpen && (
                <FiliereFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) setFormOpen(false); }}
                    filiere={filiere}
                    onSave={handleSave}
                    isLoading={modifier.isPending}
                />
            )}

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage', { nom: filiere.nom })}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
