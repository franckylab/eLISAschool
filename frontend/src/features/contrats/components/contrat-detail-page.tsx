import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, FileSignature, CheckCircle, XCircle, Calendar, Wallet, Clock, User, Briefcase, History } from 'lucide-react';
import { useContrats, useSupprimerContrat } from '../hooks/use-contrats';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import { formatDate } from '@/lib/date-utils';
import { formatMontant } from '@/lib/format-utils';
import { ContratWizardModal } from './contrat-wizard-modal';
import { AuditTimeline } from '@/components/ui/AuditTimeline';

const STATUT_CLASSES: Record<string, string> = {
    EN_ATTENTE_VALIDATION: 'bg-warning/10 text-warning',
    ACTIF: 'bg-success/10 text-success',
    EXPIRE: 'bg-muted text-muted-foreground',
    ROMPU: 'bg-destructive/10 text-destructive',
    RENEGOCIE: 'bg-primary/10 text-primary',
};

export function ContratDetailPage({ contratId }: { contratId: string }) {
    const navigate = useNavigate();
    const { t } = useTranslation('contrats');
    const { hasPermission } = usePermissions();
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const { data: contrats, isLoading, isError, error, refetch } = useContrats();
    const supprimer = useSupprimerContrat();

    const contrat = contrats?.items.find((c) => c.id === contratId);

    const handleDelete = async () => {
        await supprimer.mutateAsync(contratId);
        navigate({ to: '/contrats' });
    };

    if (isLoading) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;
    if (!contrat) return <ErrorMessage message={t('introuvable')} />;

    const membreLabel = contrat.membrePersonnel?.utilisateur?.profil
        ? `${contrat.membrePersonnel.utilisateur.profil.prenom} ${contrat.membrePersonnel.utilisateur.profil.nom}`
        : contrat.membrePersonnel?.matricule || '-';

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]" style={{ padding: 'clamp(0.5rem, 0.4rem + 0.5vw, 1.5rem)' }}>
            <PageHeader
                variant="gradient"
                title={`${t('detail.titre')} — ${membreLabel}`}
                subtitle={contrat.typeContrat}
                icon={FileSignature}
                onBack={() => navigate({ to: '/contrats' })}
                actions={
                    <div className="flex gap-2">
                        {hasPermission('contrats:edit') && (
                            <ElisaButton variant="primary" size="sm" icon={<Edit className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
                                {t('actions.modifier')}
                            </ElisaButton>
                        )}
                        {hasPermission('contrats:delete') && (
                            <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteConfirmOpen(true)}>
                                {t('actions.supprimer')}
                            </ElisaButton>
                        )}
                    </div>
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
                                <InfoField label={t('colonne.membre')} value={membreLabel} icon={<User className="h-3.5 w-3.5" />} />
                                <InfoField label={t('colonne.typeContrat')} value={contrat.typeContrat} icon={<Briefcase className="h-3.5 w-3.5" />} />
                                <InfoField label={t('detail.dateDebut')} value={formatDate(contrat.dateDebut)} icon={<Calendar className="h-3.5 w-3.5" />} />
                                <InfoField label={t('detail.dateFin')} value={contrat.dateFin ? formatDate(contrat.dateFin) : '-'} icon={<Calendar className="h-3.5 w-3.5" />} />
                                <InfoField label={t('colonne.salaireBase')} value={formatMontant(contrat.salaireBase)} icon={<Wallet className="h-3.5 w-3.5" />} />
                                <InfoField label={t('detail.modeRemuneration')} value={contrat.modeRemuneration || '-'} icon={<Clock className="h-3.5 w-3.5" />} />
                                {contrat.tarifHoraire != null && (
                                    <InfoField label={t('detail.tarifHoraire')} value={`${formatMontant(contrat.tarifHoraire)}/h`} icon={<Clock className="h-3.5 w-3.5" />} />
                                )}
                                {contrat.heuresContractuellesMois != null && (
                                    <InfoField label={t('detail.heuresContractuellesMois')} value={`${contrat.heuresContractuellesMois} h`} icon={<Clock className="h-3.5 w-3.5" />} />
                                )}
                                {contrat.clauses && (
                                    <div className="col-span-2 pt-4 border-t border-[var(--color-bordure)]">
                                        <InfoField label={t('detail.clauses')} value={contrat.clauses} />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-[var(--gap-md)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('detail.metadonnees')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoField label={t('colonne.statut')} value={
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_CLASSES[contrat.statut] || 'bg-muted text-muted-foreground'}`}>
                                    {contrat.statut === 'ACTIF' ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                    {t(`statut.${contrat.statut}`)}
                                </span>
                            } />
                            <InfoField label={t('detail.renouvellementAuto')} value={contrat.renouvellementAuto ? t('oui') : t('non')} />
                            <div className="pt-4 border-t border-[var(--color-bordure)] space-y-3">
                                <InfoField label={t('detail.creeLe')} value={formatDate(contrat.createdAt)} />
                                <InfoField label={t('detail.modifieLe')} value={formatDate(contrat.updatedAt)} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {(hasPermission('audit:contrats:view') || hasPermission('audit:view')) && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('historique')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AuditTimeline cible="ContratPersonnel" cibleId={contratId} module="contrats" />
                    </CardContent>
                </Card>
            )}

            <ContratWizardModal
                open={editOpen}
                onOpenChange={setEditOpen}
                editing={contrat}
            />

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
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
