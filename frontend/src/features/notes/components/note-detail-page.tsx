import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useTabState } from '@/hooks';
import { TabsBar, TabsContent } from '@/components/ui';
import type { Tab } from '@/components/ui';
import {
    ClipboardList, FileText, TrendingUp, Users,
    BookOpen, User, Hash, Percent, Star,
    Award, BarChart3, Edit, Trash2,
} from 'lucide-react';
import { useNote, useStatistiquesNotes, useSupprimerNote } from '../hooks/use-notes';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { StatCard } from '@/components/ui/StatCard';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';

type OngletActif = 'informations' | 'statistiques';

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

export function NoteDetailPage() {
    const { t } = useTranslation('notes');
    const { id } = useParams({ from: '/_auth/notes/$id' });
    const navigate = useNavigate();

    const { data: note, isLoading, error } = useNote(id);
    const statsQuery = useStatistiquesNotes(note?.periodeId ?? '');
    const [ongletActif, setOngletActif] = useTabState<OngletActif>('informations');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const supprimer = useSupprimerNote();

    const handleDelete = async () => {
        await supprimer.mutateAsync(id);
        navigate({ to: '/notes' });
    };

    if (isLoading) {
        return <div className="p-6"><PageSkeleton showHeader /></div>;
    }

    if (error || !note) {
        return (
            <div className="p-6">
                <ErrorMessage
                    message={t('introuvable')}
                    onRetry={() => navigate({ to: '/notes' })}
                />
            </div>
        );
    }

    const eleveLabel = note.eleve ? `${note.eleve.prenom} ${note.eleve.nom}` : '-';
    const matiereLabel = note.matiere?.nom ?? '-';
    const enseignantLabel = note.enseignant ? `${note.enseignant.prenom} ${note.enseignant.nom}` : '-';

    const stats = statsQuery.data;
    const onglets: Tab[] = [
        { id: 'informations', label: t('informations'), icon: FileText },
        { id: 'statistiques', label: t('statistiques'), icon: TrendingUp },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                icon={ClipboardList}
                title={`${eleveLabel} — ${matiereLabel}`}
                subtitle={`${note.valeur}/20`}
                onBack={() => navigate({ to: '/notes' })}
                actions={
                    <div className="flex gap-2">
                        <ElisaButton variant="outline" size="sm" icon={<Edit className="h-4 w-4" />}>
                            {t('modifier')}
                        </ElisaButton>
                        <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteConfirmOpen(true)}>
                            {t('supprimer')}
                        </ElisaButton>
                    </div>
                }
            />

            <TabsBar tabs={onglets} activeTab={ongletActif} onTabChange={(tabId) => setOngletActif(tabId as OngletActif)} variant="underline" />

            <TabsContent activeTab={ongletActif}>
                {ongletActif === 'informations' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <div className="p-4 sm:p-5">
                                <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                    <FileText className="h-5 w-5 text-blue-600 inline mr-2" />
                                    {t('informations')}
                                </h3>
                                <div className="border-b border-border mb-4" />
                                <div className="space-y-3">
                                    <InfoField label={t('eleve')} value={eleveLabel} icon={<User className="h-3.5 w-3.5" />} />
                                    <InfoField label={t('matiere')} value={matiereLabel} icon={<BookOpen className="h-3.5 w-3.5" />} />
                                    <InfoField label={t('valeur')} value={`${note.valeur}/20`} icon={<Award className="h-3.5 w-3.5" />} />
                                    <InfoField label={t('coefficient')} value={note.coefficient || 1} icon={<Percent className="h-3.5 w-3.5" />} />
                                    <InfoField label={t('type')} value={t(note.type)} icon={<Hash className="h-3.5 w-3.5" />} />
                                    <InfoField label={t('enseignant')} value={enseignantLabel} icon={<User className="h-3.5 w-3.5" />} />
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="p-4 sm:p-5">
                                <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                    <BarChart3 className="h-5 w-5 text-green-600 inline mr-2" />
                                    {t('metadonnees')}
                                </h3>
                                <div className="border-b border-border mb-4" />
                                <div className="space-y-3">
                                    {note.remarque && (
                                        <InfoField label={t('remarque')} value={note.remarque} />
                                    )}
                                    {note.dateEvaluation && (
                                        <InfoField label={t('dateEvaluation')} value={formatDate(note.dateEvaluation)} />
                                    )}
                                    <InfoField label={t('creeLe')} value={formatDate(note.createdAt)} />
                                    <InfoField label={t('modifieLe')} value={formatDate(note.updatedAt)} />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {ongletActif === 'statistiques' && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-4">
                            <StatCard icon={TrendingUp} label={t('moyenneClasse')} value={stats?.moyenneClasse ?? '-'} tone="info" />
                            <StatCard icon={Award} label={t('moyenneGenerale')} value={stats?.moyenneGenerale ?? '-'} tone="dominant" />
                            <StatCard icon={Star} label={t('noteMax')} value={stats?.noteMax ?? '-'} tone="success" />
                            <StatCard icon={TrendingUp} label={t('noteMin')} value={stats?.noteMin ?? '-'} tone="danger" />
                            <StatCard icon={Users} label={t('totalNotes')} value={stats?.totalNotes ?? '-'} tone="purple" />
                        </div>

                        {stats?.distribution && stats.distribution.length > 0 && (
                            <Card>
                                <div className="p-4 sm:p-5">
                                    <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                        <BarChart3 className="h-5 w-5 text-blue-600 inline mr-2" />
                                        {t('distribution')}
                                    </h3>
                                    <div className="border-b border-border mb-4" />
                                    <div className="space-y-3">
                                        {stats.distribution.map((d, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="w-20 text-sm font-medium text-card-foreground">{d.tranche}</span>
                                                <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-dominant-500 transition-all duration-500"
                                                        style={{ width: `${d.pourcentage}%` }}
                                                    />
                                                </div>
                                                <span className="w-16 text-right text-sm text-muted-foreground">
                                                    {d.nombre} ({d.pourcentage}%)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </TabsContent>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage')}
                confirmText={t('supprimer')}
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}

