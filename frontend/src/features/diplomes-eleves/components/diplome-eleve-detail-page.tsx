import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Edit, Medal, CheckCircle, XCircle } from 'lucide-react';
import { useDiplomeEleve, useModifierDiplomeEleve } from '../hooks/use-diplomes-eleves';
import { DiplomeEleveFormModal } from './diplome-eleve-form-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';

function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

export function DiplomeEleveDetailPage() {
    const { id } = useParams({ from: '/_auth/diplomes-eleves/$id' });
    const { t } = useTranslation('diplomes-eleves');
    const { hasPermission } = usePermissions();
    const { data: diplome, isLoading, isError, error, refetch } = useDiplomeEleve(id);
    const [formOpen, setFormOpen] = useState(false);
    const modifier = useModifierDiplomeEleve();

    const handleSave = async (data: any) => {
        await modifier.mutateAsync({ id: diplome!.id, ...data });
        setFormOpen(false);
    };

    if (isLoading) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;
    if (!diplome) return <ErrorMessage message={t('detail.nonTrouvee')} />;

    const titre = diplome.eleve ? `${diplome.eleve.prenom} ${diplome.eleve.nom}` : '—';

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>
            <PageHeader
                title={titre}
                icon={Medal}
                actions={
                    hasPermission('diplomes-eleves:edit') ? (
                        <ElisaButton
                            onClick={() => setFormOpen(true)}
                            icon={<Edit className="h-4 w-4" />}
                            variant="primary"
                        >
                            {t('actions.modifier')}
                        </ElisaButton>
                    ) : undefined
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
                                <InfoField
                                    label={t('detail.eleve')}
                                    value={diplome.eleve ? `${diplome.eleve.prenom} ${diplome.eleve.nom}` : '-'}
                                />
                                <InfoField
                                    label={t('detail.examenNational')}
                                    value={diplome.examenNational?.nom || '-'}
                                />
                                <InfoField label={t('detail.numeroDiplome')} value={diplome.numeroDiplome || '-'} />
                                <InfoField label={t('detail.dateObtention')} value={formatDate(diplome.dateObtention)} />
                                <InfoField
                                    label={t('detail.resultat')}
                                    value={
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            diplome.resultat === 'ADMIS'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : diplome.resultat === 'AJOURNE'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                            {t(`resultat.${diplome.resultat}`)}
                                        </span>
                                    }
                                />
                                <InfoField label={t('detail.noteObtenue')} value={diplome.noteObtenue?.toString() ?? '-'} />
                                <InfoField label={t('detail.mention')} value={diplome.mention || '-'} />
                            </div>
                            {diplome.observations && (
                                <div className="col-span-2 pt-4 border-t border-[var(--color-bordure)]">
                                    <InfoField label={t('detail.observations')} value={diplome.observations} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-[var(--gap-md)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('detail.resultat')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`rounded-lg p-4 ${
                                diplome.resultat === 'ADMIS'
                                    ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                                    : diplome.resultat === 'AJOURNE'
                                    ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800'
                                    : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                            }`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {diplome.resultat === 'ADMIS'
                                        ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        : diplome.resultat === 'AJOURNE'
                                        ? <CheckCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                        : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    }
                                    <span className={`font-semibold ${
                                        diplome.resultat === 'ADMIS'
                                            ? 'text-green-800 dark:text-green-200'
                                            : diplome.resultat === 'AJOURNE'
                                            ? 'text-yellow-800 dark:text-yellow-200'
                                            : 'text-red-800 dark:text-red-200'
                                    }`}>
                                        {t(`resultat.${diplome.resultat}`)}
                                    </span>
                                </div>
                                {diplome.mention && (
                                    <p className="text-sm text-muted-foreground">{t('detail.mention')}: {diplome.mention}</p>
                                )}
                                {diplome.noteObtenue !== undefined && (
                                    <p className="text-sm text-muted-foreground">{t('detail.note')}: {diplome.noteObtenue}/20</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('detail.configuration')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('detail.diplome')}</span>
                                <span className="font-medium">{diplome.examenNational?.diplomeDelivre || diplome.examenNational?.nom || '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('detail.date')}</span>
                                <span className="font-medium">{formatDate(diplome.dateObtention)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('detail.resultat')}</span>
                                <span className={`font-medium ${
                                    diplome.resultat === 'ADMIS'
                                        ? 'text-green-600 dark:text-green-400'
                                        : diplome.resultat === 'AJOURNE'
                                        ? 'text-yellow-600 dark:text-yellow-400'
                                        : 'text-red-600 dark:text-red-400'
                                }`}>
                                    {t(`resultat.${diplome.resultat}`)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {formOpen && (
                <DiplomeEleveFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) setFormOpen(false); }}
                    diplome={diplome}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
