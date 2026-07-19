import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, FileBadge2, CheckCircle, XCircle } from 'lucide-react';
import { useExamenNational, useModifierExamenNational, useSupprimerExamenNational } from '../hooks/use-examens-nationaux';
import { ExamenNationalFormModal } from './examen-national-form-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';

function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

export function ExamenNationalDetailPage() {
    const { id } = useParams({ from: '/_auth/examens-nationaux/$id' });
    const navigate = useNavigate();
    const { t } = useTranslation('examens-nationaux');
    const { hasPermission } = usePermissions();
    const { data: examen, isLoading, isError, error, refetch } = useExamenNational(id);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const modifier = useModifierExamenNational();
    const supprimer = useSupprimerExamenNational();

    const handleSave = async (data: any) => {
        await modifier.mutateAsync({ id: examen!.id, ...data });
        setFormOpen(false);
    };

    const handleDelete = async () => {
        await supprimer.mutateAsync(id);
        navigate({ to: '/examens-nationaux' });
    };

    if (isLoading) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;
    if (!examen) return <ErrorMessage message={t('detail.nonTrouvee')} />;

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>
            <PageHeader
                variant="gradient"
                title={examen.nom}
                subtitle={examen.code}
                icon={FileBadge2}
                onBack={() => navigate({ to: '/examens-nationaux' })}
                actions={
                    <>
                        {hasPermission('examens-nationaux:edit') && (
                            <ElisaButton
                                onClick={() => setFormOpen(true)}
                                icon={<Edit className="h-4 w-4" />}
                                variant="primary"
                            >
                                {t('actions.modifier')}
                            </ElisaButton>
                        )}
                        {hasPermission('examens-nationaux:delete') && (
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
                                <InfoField label={t('detail.code')} value={examen.code} />
                                <InfoField
                                    label={t('detail.type')}
                                    value={t(`form.types.${examen.type}`)}
                                />
                                <InfoField
                                    label={t('detail.niveau')}
                                    value={examen.niveau?.nom || '-'}
                                />
                                <InfoField
                                    label={t('detail.sousSysteme')}
                                    value={t(`sousSysteme.${examen.sousSysteme}`)}
                                />
                                <InfoField
                                    label={t('detail.obligatoire')}
                                    value={examen.estObligatoire ? t('oui') : t('non')}
                                />
                                <InfoField label={t('detail.diplomeDelivre')} value={examen.diplomeDelivre || '-'} />
                                <InfoField label={t('detail.coefficient')} value={examen.coefficient?.toString() ?? '-'} />
                                <InfoField label={t('detail.dateProgrammation')} value={formatDate(examen.dateProgrammation)} />
                                <InfoField
                                    label={t('detail.statut')}
                                    value={
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${examen.actif ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                            {examen.actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            {examen.actif ? t('statut.actif') : t('statut.inactif')}
                                        </span>
                                    }
                                />
                            </div>
                            {examen.description && (
                                <div className="col-span-2 pt-4 border-t border-[var(--color-bordure)]">
                                    <InfoField label={t('detail.description')} value={examen.description} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-[var(--gap-md)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('detail.statut')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`rounded-lg p-4 ${examen.actif ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {examen.actif
                                        ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    }
                                    <span className={`font-semibold ${examen.actif ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                        {examen.actif ? t('statut.actif') : t('statut.inactif')}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('detail.configuration')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('detail.type')}</span>
                                <span className="font-medium">{t(`form.types.${examen.type}`)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('detail.niveau')}</span>
                                <span className="font-medium">{examen.niveau?.nom || '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('detail.coefficient')}</span>
                                <span className="font-medium">{examen.coefficient ?? '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('detail.obligatoire')}</span>
                                <span className="font-medium">{examen.estObligatoire ? t('oui') : t('non')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {formOpen && (
                <ExamenNationalFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) setFormOpen(false); }}
                    examen={examen}
                    onSave={handleSave}
                    isLoading={modifier.isPending}
                />
            )}

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage', { nom: examen.nom })}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
