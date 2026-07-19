import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { GitBranch, Edit, Trash2, Layers, Calendar } from 'lucide-react';
import { useSpecialite, useSupprimerSpecialite } from '../hooks/use-specialites';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { CheckCircle, XCircle } from 'lucide-react';

function StatutBadge({ actif }: { actif: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-[clamp(0.375rem,1vw,0.625rem)] py-[clamp(0.125rem,0.5vw,0.25rem)] text-[clamp(0.75rem,1.25vw,0.875rem)] font-medium ${
            actif ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted-foreground'
        }`}>
            {actif ? <CheckCircle className="h-[clamp(0.75rem,1.5vw,0.875rem)] w-[clamp(0.75rem,1.5vw,0.875rem)]" /> : <XCircle className="h-[clamp(0.75rem,1.5vw,0.875rem)] w-[clamp(0.75rem,1.5vw,0.875rem)]" />}
            {actif ? 'Actif' : 'Inactif'}
        </span>
    );
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function SpecialiteDetailPage() {
    const { id } = useParams({ from: '/_auth/specialites/$id' });
    const navigate = useNavigate();
    const { t } = useTranslation('specialites');
    const { hasPermission } = usePermissions();
    const { data: specialite, isLoading, error, refetch } = useSpecialite(id);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const supprimer = useSupprimerSpecialite();

    const handleDelete = async () => {
        await supprimer.mutateAsync(id);
        navigate({ to: '/specialites' });
    };

    if (isLoading) {
        return <PageSkeleton showHeader />;
    }

    if (error || !specialite) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('nonTrouvee')}
                    message={error instanceof Error ? error.message : t('nonTrouvee')}
                    onRetry={refetch}
                    retryLabel={t('retourListe')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                showBreadcrumbs
                breadcrumbLabel={specialite.nom}
                onBack={() => navigate({ to: '/specialites' })}
                actions={
                    <>
                        {hasPermission('specialites:edit') && (
                            <ElisaButton variant="outline" size="sm" icon={<Edit className="h-4 w-4" />}>
                                {t('detail.modifier')}
                            </ElisaButton>
                        )}
                        {hasPermission('specialites:delete') && (
                            <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteConfirmOpen(true)}>
                                {t('detail.supprimer')}
                            </ElisaButton>
                        )}
                    </>
                }
            >
                <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl shrink-0 p-[clamp(0.75rem,2.5vw,1rem)]">
                        <GitBranch className="h-[clamp(1.75rem,6vw,2.5rem)] w-[clamp(1.75rem,6vw,2.5rem)] text-white" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <h1 className="text-[clamp(1.5rem,4.5vw,3.5rem)] font-bold text-white leading-tight">{specialite.nom}</h1>
                        {specialite.code && <p className="text-[clamp(0.75rem,2vw,1.125rem)] text-white/70 font-mono">{specialite.code}</p>}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <StatutBadge actif={specialite.actif} />
                        </div>
                    </div>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GitBranch className="h-5 w-5 text-[var(--color-dominant-600)]" />
                            {t('detail.informations')}
                        </CardTitle>
                    </CardHeader>
                    <div className="border-b border-[var(--color-bordure)] mx-4 sm:mx-5" />
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoField
                                label={t('detail.nom')}
                                value={specialite.nom}
                            />
                            <InfoField
                                label={t('detail.code')}
                                value={<span className="font-mono">{specialite.code}</span>}
                            />
                            <InfoField
                                label={t('detail.ordre')}
                                value={specialite.ordre}
                            />
                            <InfoField
                                label={t('detail.statut')}
                                value={<StatutBadge actif={specialite.actif} />}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-[var(--color-dominant-600)]" />
                            {t('detail.filiere')}
                        </CardTitle>
                    </CardHeader>
                    <div className="border-b border-[var(--color-bordure)] mx-4 sm:mx-5" />
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4">
                            <InfoField
                                label={t('detail.filiere')}
                                value={specialite.filiere ? (
                                    <button
                                        onClick={() => navigate({ to: '/filieres/$id', params: { id: specialite.filiere!.id } })}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {specialite.filiere.nom}
                                    </button>
                                ) : t('detail.nonRattachee')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {specialite.description && (
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GitBranch className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                {t('detail.description')}
                            </CardTitle>
                        </CardHeader>
                        <div className="border-b border-[var(--color-bordure)] mx-4 sm:mx-5" />
                        <CardContent>
                            <p className="text-sm text-[var(--color-texte)]">{specialite.description}</p>
                        </CardContent>
                    </Card>
                )}

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-[var(--color-dominant-600)]" />
                            {t('detail.metadonnees')}
                        </CardTitle>
                    </CardHeader>
                    <div className="border-b border-[var(--color-bordure)] mx-4 sm:mx-5" />
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoField label={t('detail.creeLe')} value={formatDate(specialite.createdAt)} />
                            <InfoField label={t('detail.modifieLe')} value={formatDate(specialite.updatedAt)} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={t('supprimerTitre')}
                description={t('supprimerMessage', { nom: specialite.nom })}
                confirmText={t('supprimer')}
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
