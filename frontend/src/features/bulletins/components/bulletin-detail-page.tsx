/**
 * ==================================
 * eLISAschool - Page détail Bulletin
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Détail d'un bulletin : onglets Synthèse / Matières,
 * actions Publier-Dépublier (bulletins:publier), Exporter (bulletins:export),
 * Modifier appréciations (bulletins:edit), Supprimer (bulletins:delete, refusé si publié).
 */

import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    FileText, Trash2, Download, Award, Edit,
    Send, Undo2, BookOpen, LayoutDashboard, TrendingUp, Users, Star, History, ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Card } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { StatCard } from '@/components/ui/StatCard';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { CustomModal } from '@/components/modals/CustomModal';
import { AuditTimeline } from '@/components/ui/AuditTimeline';
import { ValidationTimeline, ValidationActions } from '@/components/ui';
import { TabsBar, TabsContent } from '@/components/ui';
import type { Tab } from '@/components/ui';
import { useTabState, usePermissions, useWorkflowByEntite } from '@/hooks';
import { useBulletin, useSupprimerBulletin, useExporterBulletin, useModifierBulletin } from '../hooks/use-bulletins';
import { getMentionKey } from '../utils/bulletin-mention';
import { getNoteBadgeClass, formatNote } from '@/features/notes/utils/note-couleur';
import type { BulletinMatiere } from '../types/bulletin.types';

interface BulletinDetailPageProps {
    bulletinId: string;
}

type OngletActif = 'synthese' | 'matieres' | 'validation' | 'historique';

function MatiereRow({ m }: { m: BulletinMatiere }) {
    const { t } = useTranslation('bulletins');
    return (
        <div className="flex flex-col gap-[var(--gap-sm)] rounded-[var(--radius-lg)] border border-border bg-card p-[var(--padding-table-cell)] min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
            <div className="flex items-center gap-[var(--gap-sm)] min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                    {m.matiere?.nom?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{m.matiere?.nom}</p>
                    <p className="text-xs text-muted-foreground">
                        {m.matiere?.code} · {t('coefficientCourt', { coefficient: m.coefficient })} · {t('nombreNotes', { count: m.nombreNotes })}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-[clamp(0.5rem,1.5vw,1rem)]">
                {m.appreciation && (
                    <span className="max-w-[200px] truncate text-xs italic text-muted-foreground">{m.appreciation}</span>
                )}
                {typeof m.moyenneClasse === 'number' && (
                    <span className="text-xs text-muted-foreground">
                        {t('moyenneClasseCourt', { moyenne: Math.round(m.moyenneClasse * 100) / 100 })}
                    </span>
                )}
                <div className="text-right">
                    <span className={`inline-flex items-center justify-center rounded-[var(--radius-lg)] px-[clamp(0.5rem,1vw,0.75rem)] py-1 text-[clamp(0.875rem,1.2vw,1.125rem)] font-bold ${getNoteBadgeClass(m.moyenne, 20)}`}>
                        {formatNote(m.moyenne, 20)}
                    </span>
                    {typeof m.rangMatiere === 'number' && (
                        <p className="mt-0.5 text-xs text-muted-foreground">#{m.rangMatiere}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export function BulletinDetailPage({ bulletinId }: BulletinDetailPageProps) {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation('bulletins');
    const { hasPermission } = usePermissions();

    const peutValider = hasPermission('bulletins:validate');

    const { data: bulletin, isLoading, error, refetch } = useBulletin(bulletinId);
    const supprimer = useSupprimerBulletin();
    const exporter = useExporterBulletin();
    const modifier = useModifierBulletin();

    const workflowQuery = useWorkflowByEntite('bulletins', bulletinId);

    const [ongletActif, setOngletActif] = useTabState<OngletActif>('synthese');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [publierConfirmOpen, setPublierConfirmOpen] = useState(false);
    const [appreciationOpen, setAppreciationOpen] = useState(false);
    const [appreciationBrouillon, setAppreciationBrouillon] = useState('');

    useEffect(() => {
        if (appreciationOpen) {
            setAppreciationBrouillon(bulletin?.appreciationConseil ?? '');
        }
    }, [appreciationOpen, bulletin]);

    const formatDate = (d: string): string =>
        new Date(d).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' });

    const handleDelete = async () => {
        await supprimer.mutateAsync(bulletinId);
        setDeleteConfirmOpen(false);
        navigate({ to: '/bulletins' });
    };

    const handleTogglePublication = async () => {
        if (!bulletin) return;
        await modifier.mutateAsync({ id: bulletinId, publie: !bulletin.publie });
        setPublierConfirmOpen(false);
    };

    const handleEnregistrerAppreciation = async () => {
        await modifier.mutateAsync({ id: bulletinId, appreciationConseil: appreciationBrouillon });
        setAppreciationOpen(false);
    };

    if (isLoading) {
        return <div className="p-[clamp(0.75rem,2vw,1.5rem)]"><PageSkeleton showHeader showTable /></div>;
    }

    if (error || !bulletin) {
        return (
            <div className="p-[clamp(0.75rem,2vw,1.5rem)]">
                <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />
            </div>
        );
    }

    const onglets: Tab[] = [
        { id: 'synthese', label: t('synthese'), icon: LayoutDashboard },
        { id: 'matieres', label: t('matieres'), icon: BookOpen },
        ...(peutValider ? [{ id: 'validation' as const, label: t('validation'), icon: ShieldCheck }] : []),
        ...(hasPermission('audit:bulletins:view') || hasPermission('audit:view')
            ? [{ id: 'historique' as const, label: t('historique'), icon: History }]
            : []),
    ];

    return (
        <div className="flex flex-col gap-[var(--gap-sm)] p-[clamp(0.75rem,2vw,1.5rem)]">
            <PageHeader
                variant="gradient"
                icon={FileText}
                title={`${bulletin.eleve?.prenom ?? ''} ${bulletin.eleve?.nom ?? ''}`.trim() || t('titre')}
                subtitle={`${bulletin.classeAnnee?.classe?.nom ?? '—'} · ${bulletin.periode?.nom ?? '—'}`}
                onBack={() => navigate({ to: '/bulletins' })}
                status={{
                    label: bulletin.publie ? t('publie') : t('nonPublie'),
                    variant: bulletin.publie ? 'success' : 'warning',
                }}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {hasPermission('bulletins:publier') && (
                            <ElisaButton
                                variant={bulletin.publie ? 'outline' : 'primary'}
                                size="sm"
                                icon={bulletin.publie
                                    ? <Undo2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                    : <Send className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                isLoading={modifier.isPending}
                                onClick={() => setPublierConfirmOpen(true)}
                            >
                                {bulletin.publie ? t('depublier') : t('publier')}
                            </ElisaButton>
                        )}
                        {hasPermission('bulletins:export') && (
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<Download className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                isLoading={exporter.isPending}
                                onClick={() => { void exporter.mutateAsync(bulletin.id); }}
                            >
                                {t('exporter')}
                            </ElisaButton>
                        )}
                        {hasPermission('bulletins:edit') && (
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<Edit className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                onClick={() => setAppreciationOpen(true)}
                            >
                                {t('modifierAppreciation')}
                            </ElisaButton>
                        )}
                        {hasPermission('bulletins:delete') && !bulletin.publie && (
                            <ElisaButton
                                variant="danger"
                                size="sm"
                                icon={<Trash2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                isLoading={supprimer.isPending}
                                onClick={() => setDeleteConfirmOpen(true)}
                            >
                                {t('supprimer')}
                            </ElisaButton>
                        )}
                    </div>
                }
            />

            <TabsBar
                tabs={onglets}
                activeTab={ongletActif}
                onTabChange={(tabId) => setOngletActif(tabId as OngletActif)}
                variant="underline"
            />

            <TabsContent activeTab={ongletActif}>
                {ongletActif === 'synthese' && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-[var(--gap-sm)]">
                            <StatCard icon={TrendingUp} label={t('moyenne')} value={formatNote(bulletin.moyenneGenerale, 20)} tone="dominant" />
                            {typeof bulletin.moyenneClasse === 'number' && (
                                <StatCard icon={Users} label={t('moyenneClasse')} value={formatNote(bulletin.moyenneClasse, 20)} tone="info" />
                            )}
                            {typeof bulletin.moyenneMax === 'number' && (
                                <StatCard icon={Star} label={t('moyenneMax')} value={formatNote(bulletin.moyenneMax, 20)} tone="success" />
                            )}
                            {typeof bulletin.moyenneMin === 'number' && (
                                <StatCard icon={TrendingUp} label={t('moyenneMin')} value={formatNote(bulletin.moyenneMin, 20)} tone="danger" />
                            )}
                            {typeof bulletin.rang === 'number' && (
                                <StatCard icon={Award} label={t('rangLabel')} value={bulletin.rang} tone="purple" />
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(0.75rem,2vw,1.5rem)]">
                            <Card>
                                <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                                    <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                        <FileText className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
                                        {t('informations')}
                                    </h3>
                                    <div className="border-b border-border mb-4" />
                                    <div className="space-y-3">
                                        <InfoField label={t('eleve')} value={`${bulletin.eleve?.prenom ?? ''} ${bulletin.eleve?.nom ?? ''}`.trim() || '—'} />
                                        <InfoField label={t('classe')} value={bulletin.classeAnnee?.classe?.nom ?? '—'} />
                                        <InfoField label={t('periode')} value={bulletin.periode?.nom ?? '—'} />
                                        <InfoField label={t('mention')} value={t(getMentionKey(bulletin.moyenneGenerale))} />
                                        <InfoField
                                            label={t('statut')}
                                            value={
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bulletin.publie ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                                    {bulletin.publie ? t('publie') : t('nonPublie')}
                                                </span>
                                            }
                                        />
                                        <InfoField label={t('dateGeneration')} value={formatDate(bulletin.createdAt)} />
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                                    <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                        <Award className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-success inline mr-2" />
                                        {t('appreciation')}
                                    </h3>
                                    <div className="border-b border-border mb-4" />
                                    <div className="space-y-4">
                                        <p className="text-sm italic text-foreground">
                                            {bulletin.appreciationConseil || t('aucuneAppreciation')}
                                        </p>
                                        {bulletin.encouragements && bulletin.encouragements.length > 0 && (
                                            <div>
                                                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('encouragements')}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {bulletin.encouragements.map((e) => (
                                                        <span key={e} className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">{e}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {bulletin.sanctions && bulletin.sanctions.length > 0 && (
                                            <div>
                                                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('sanctions')}</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {bulletin.sanctions.map((s) => (
                                                        <span key={s} className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {ongletActif === 'matieres' && (
                    <Card>
                        <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                            <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                <BookOpen className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
                                {t('matieres')}
                            </h3>
                            <div className="border-b border-border mb-4" />
                            {bulletin.bulletinMatieres?.length ? (
                                <div className="flex flex-col gap-[var(--gap-sm)]">
                                    {bulletin.bulletinMatieres.map((m) => (
                                        <MatiereRow key={m.id} m={m} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t('aucuneMatiere')}</p>
                            )}
                        </div>
                    </Card>
                )}

                {ongletActif === 'validation' && peutValider && (
                    <Card>
                        <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                            <h3 className="flex items-center gap-[var(--gap-xs)] text-base font-semibold text-foreground mb-4">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                {t('validation')}
                            </h3>
                            <div className="border-b border-border mb-6" />
                            {workflowQuery.isLoading ? (
                                <p className="text-sm text-muted-foreground">{t('chargement')}</p>
                            ) : workflowQuery.data ? (
                                <>
                                    <ValidationTimeline
                                        historique={workflowQuery.data.historique}
                                        niveauxRequis={workflowQuery.data.niveauxRequis}
                                        niveauActuel={workflowQuery.data.niveauActuel}
                                        statut={workflowQuery.data.statut}
                                    />
                                    <div className="mt-6">
                                        <ValidationActions
                                            workflowId={workflowQuery.data.id}
                                            statut={workflowQuery.data.statut}
                                            niveauActuel={workflowQuery.data.niveauActuel}
                                            niveauxRequis={workflowQuery.data.niveauxRequis}
                                            module="bulletins"
                                            onValidated={() => workflowQuery.refetch()}
                                        />
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t('validation.aucunWorkflow')}</p>
                            )}
                        </div>
                    </Card>
                )}

                {ongletActif === 'historique' && (
                    <Card>
                        <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                            <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                <History className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
                                {t('historique')}
                            </h3>
                            <div className="border-b border-border mb-4" />
                            <AuditTimeline cible="Bulletin" cibleId={bulletinId} module="bulletins" />
                        </div>
                    </Card>
                )}
            </TabsContent>

            {/* Modal appréciation du conseil */}
            <CustomModal
                open={appreciationOpen}
                onOpenChange={setAppreciationOpen}
                title={t('modifierAppreciation')}
                size="md"
                footer={
                    <div className="flex justify-end gap-[var(--gap-sm)]">
                        <ElisaButton variant="outline" size="sm" onClick={() => setAppreciationOpen(false)}>
                            {t('annuler')}
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            isLoading={modifier.isPending}
                            onClick={handleEnregistrerAppreciation}
                        >
                            {t('enregistrer')}
                        </ElisaButton>
                    </div>
                }
            >
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="bulletin-appreciation" className="text-sm font-medium text-foreground">{t('appreciation')}</label>
                    <textarea
                        id="bulletin-appreciation"
                        className="flex min-h-[120px] w-full rounded-[var(--radius-lg)] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={appreciationBrouillon}
                        onChange={(e) => setAppreciationBrouillon(e.target.value)}
                        placeholder={t('appreciationPlaceholder')}
                    />
                </div>
            </CustomModal>

            <ConfirmDialog
                open={publierConfirmOpen}
                onOpenChange={setPublierConfirmOpen}
                onConfirm={handleTogglePublication}
                title={bulletin.publie ? t('confirmerDepublierTitre') : t('confirmerPublierTitre')}
                description={bulletin.publie ? t('confirmerDepublierMessage') : t('confirmerPublierMessage')}
                confirmText={bulletin.publie ? t('depublier') : t('publier')}
                variant="info"
                isLoading={modifier.isPending}
            />

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={handleDelete}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage')}
                confirmText={t('supprimer')}
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
