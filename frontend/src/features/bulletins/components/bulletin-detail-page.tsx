import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { FileText, Trash2, Download, Award } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useBulletin, useSupprimerBulletin, useExporterBulletin } from '../hooks/use-bulletins';
import { usePermissions } from '@/hooks';
import type { BulletinMatiere } from '../types/bulletin.types';

interface BulletinDetailPageProps {
    bulletinId: string;
}

function NoteMatiereRow({ m }: { m: BulletinMatiere }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                    {m.matiere?.nom?.charAt(0) || '?'}
                </div>
                <div>
                    <p className="font-medium">{m.matiere?.nom}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{m.matiere?.code} · Coef. {m.coefficient}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {m.appreciation && (
                    <span className="max-w-[200px] truncate text-xs italic text-[var(--color-text-muted)]">{m.appreciation}</span>
                )}
                <div className="text-right">
                    <span className={`inline-flex items-center justify-center rounded-lg px-3 py-1 text-lg font-bold ${
                        m.moyenne >= 16 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        m.moyenne >= 14 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        m.moyenne >= 12 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                        m.moyenne >= 10 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                        {m.moyenne.toFixed(2)}
                    </span>
                    {m.rang && (
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">#{m.rang}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export function BulletinDetailPage({ bulletinId }: BulletinDetailPageProps) {
    const navigate = useNavigate();
    const { t } = useTranslation('bulletins');
    const { hasPermission } = usePermissions();

    const { data: bulletin, isLoading, error, refetch } = useBulletin(bulletinId);
    const supprimer = useSupprimerBulletin();
    const exporter = useExporterBulletin();

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const handleDelete = async () => {
        await supprimer.mutateAsync(bulletinId);
        setDeleteConfirmOpen(false);
        navigate({ to: '/bulletins' });
    };

    if (isLoading) {
        return <div className="p-6"><PageSkeleton showHeader showTable /></div>;
    }

    if (error || !bulletin) {
        return (
            <div className="p-6">
                <ErrorMessage
                    message={t('chargement')}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                icon={FileText}
                title={t('titre')}
                subtitle={`${bulletin.eleve?.prenom} ${bulletin.eleve?.nom} · ${bulletin.classeAnnee?.classe?.nom} · ${bulletin.periode?.nom}`}
                onBack={() => navigate({ to: '/bulletins' })}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <ElisaButton variant="outline" size="sm" icon={<Download className="h-4 w-4" />} onClick={() => exporter.mutateAsync(bulletin.id)}>
                            {t('exporterPdf')}
                        </ElisaButton>
                        {hasPermission('bulletins:delete') && (
                            <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} isLoading={supprimer.isPending} onClick={() => setDeleteConfirmOpen(true)}>
                                {t('supprimer')}
                            </ElisaButton>
                        )}
                    </div>
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[var(--color-text-strong)]">{t('matieres')}</h3>
                    </div>
                    {bulletin.matieres?.length ? (
                        <div className="flex flex-col gap-2">
                            {bulletin.matieres.map((m) => (
                                <NoteMatiereRow key={m.id} m={m} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--color-text-muted)]">Aucune matière</p>
                    )}

                    {bulletin.appreciation && (
                        <div className="mt-4 rounded-lg border border-[var(--color-border)] p-4">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{t('appreciation')}</p>
                            <p className="text-sm italic">{bulletin.appreciation}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <div className="rounded-lg border border-[var(--color-border)] p-4">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{t('moyenne')}</p>
                        <span className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-2xl font-bold ${
                            bulletin.moyenneGenerale >= 16 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            bulletin.moyenneGenerale >= 14 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            bulletin.moyenneGenerale >= 12 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                            bulletin.moyenneGenerale >= 10 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                            {bulletin.moyenneGenerale.toFixed(2)}/20
                        </span>
                    </div>

                    <div className="rounded-lg border border-[var(--color-border)] p-4">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{t('rang')}</p>
                        <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-[var(--color-warning)]" />
                            <span className="text-xl font-bold">
                                {t('rang', { rang: bulletin.rang })}
                            </span>
                            <span className="text-sm text-[var(--color-text-muted)]">/ {bulletin.effectifClasse}</span>
                        </div>
                    </div>

                    {bulletin.dateGeneration && (
                        <div className="rounded-lg border border-[var(--color-border)] p-4">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{t('dateGeneration')}</p>
                            <p className="text-sm">{new Date(bulletin.dateGeneration).toLocaleDateString()}</p>
                        </div>
                    )}

                    <div className="rounded-lg border border-[var(--color-border)] p-4">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{t('effectif')}</p>
                        <p className="text-sm font-medium">{bulletin.effectifClasse}</p>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={handleDelete}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage')}
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}