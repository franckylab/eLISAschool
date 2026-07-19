import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Brain, Edit, Trash2, Layers, BookOpen, Calendar } from 'lucide-react';
import { useCompetence, useSupprimerCompetence } from '../hooks/use-competences';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
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

export function CompetenceDetailPage() {
    const { id } = useParams({ from: '/_auth/competences/$id' });
    const navigate = useNavigate();
    const { t } = useTranslation('competences');
    const { hasPermission } = usePermissions();
    const { data: competence, isLoading, error, refetch } = useCompetence(id);
    const supprimer = useSupprimerCompetence();
    const { ask: askDelete, ConfirmationModal: DeleteConfirmModal } = useConfirmation();

    const handleDelete = async () => {
        await supprimer.mutateAsync(id);
        navigate({ to: '/competences' });
    };

    if (isLoading) {
        return <PageSkeleton showHeader />;
    }

    if (error || !competence) {
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
                breadcrumbLabel={competence.libelle}
                onBack={() => navigate({ to: '/competences' })}
                actions={
                    <div className="flex gap-2">
                        {hasPermission('competences:edit') && (
                            <ElisaButton variant="outline" size="sm" icon={<Edit className="h-4 w-4" />}>
                                {t('actions.modifier')}
                            </ElisaButton>
                        )}
                        {hasPermission('competences:delete') && (
                            <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => askDelete({
                                title: t('supprimerTitre'),
                                message: t('supprimerMessage', { libelle: competence.libelle }),
                                onConfirm: handleDelete,
                            })}>
                                {t('actions.supprimer')}
                            </ElisaButton>
                        )}
                    </div>
                }
            >
                <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl shrink-0 p-[clamp(0.75rem,2.5vw,1rem)]">
                        <Brain className="h-[clamp(1.75rem,6vw,2.5rem)] w-[clamp(1.75rem,6vw,2.5rem)] text-white" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <h1 className="text-[clamp(1.5rem,4.5vw,3.5rem)] font-bold text-white leading-tight">{competence.libelle}</h1>
                        {competence.code && <p className="text-[clamp(0.75rem,2vw,1.125rem)] text-white/70 font-mono">{competence.code}</p>}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <StatutBadge actif={competence.actif} />
                        </div>
                    </div>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-[var(--color-dominant-600)]" />
                            {t('detail.informations')}
                        </CardTitle>
                    </CardHeader>
                    <div className="border-b border-[var(--color-bordure)] mx-4 sm:mx-5" />
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoField
                                label={t('detail.code')}
                                value={<span className="font-mono">{competence.code}</span>}
                            />
                            <InfoField
                                label={t('detail.libelle')}
                                value={competence.libelle}
                            />
                            <InfoField
                                label={t('detail.domaine')}
                                value={competence.domaine}
                            />
                            <InfoField
                                label={t('detail.ordre')}
                                value={competence.ordre}
                            />
                            <InfoField
                                label={t('detail.statut')}
                                value={<StatutBadge actif={competence.actif} />}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-[var(--color-dominant-600)]" />
                            {t('detail.classification')}
                        </CardTitle>
                    </CardHeader>
                    <div className="border-b border-[var(--color-bordure)] mx-4 sm:mx-5" />
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4">
                            <InfoField
                                label={t('detail.niveau')}
                                value={competence.niveau ? (
                                    <button
                                        onClick={() => navigate({ to: '/niveaux/$id', params: { id: competence.niveau!.id } })}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {competence.niveau.nom}
                                    </button>
                                ) : t('detail.aucunNiveau')}
                            />
                            <InfoField
                                label={t('detail.matiere')}
                                value={competence.matiere ? competence.matiere.nom : t('detail.aucuneMatiere')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {competence.description && (
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                {t('detail.description')}
                            </CardTitle>
                        </CardHeader>
                        <div className="border-b border-[var(--color-bordure)] mx-4 sm:mx-5" />
                        <CardContent>
                            <p className="text-sm text-[var(--color-texte)]">{competence.description}</p>
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
                            <InfoField label={t('detail.creeLe')} value={formatDate(competence.createdAt)} />
                            <InfoField label={t('detail.modifieLe')} value={formatDate(competence.updatedAt)} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {DeleteConfirmModal}
        </div>
    );
}
