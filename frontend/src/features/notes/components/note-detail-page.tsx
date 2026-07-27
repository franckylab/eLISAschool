/**
 * ==================================
 * eLISAschool - Page détail Note
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Détail d'une note : onglets Informations / Statistiques (gated) /
 * Validation (workflow BROUILLON → VALIDEE → PUBLIEE, gated notes:validate).
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useTabState, usePermissions } from '@/hooks';
import { TabsBar, TabsContent } from '@/components/ui';
import type { Tab } from '@/components/ui';
import {
    ClipboardList, FileText, TrendingUp, Users,
    BookOpen, User, Hash, Percent,
    Award, BarChart3, Edit, Trash2, ShieldCheck,
    CheckCircle2, Send, Star,
} from 'lucide-react';
import { useNote, useStatistiquesNotes, useSupprimerNote, useModifierNote } from '../hooks/use-notes';
import { getNoteBadgeClass, formatNote } from '../utils/note-couleur';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { StatCard } from '@/components/ui/StatCard';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { NoteFormModal } from './note-form-modal';
import type { StatutNote } from '../types/note.types';

type OngletActif = 'informations' | 'statistiques' | 'validation';

const STATUT_BADGES: Record<StatutNote, string> = {
    BROUILLON: 'bg-warning/10 text-warning',
    VALIDEE: 'bg-success/10 text-success',
    PUBLIEE: 'bg-primary/10 text-primary',
};

const ETAPES_WORKFLOW: StatutNote[] = ['BROUILLON', 'VALIDEE', 'PUBLIEE'];

export function NoteDetailPage() {
    const { t, i18n } = useTranslation('notes');
    const { id } = useParams({ from: '/_auth/notes/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const { data: note, isLoading, error } = useNote(id);
    const peutVoirStats = hasPermission('notes:statistiques:view');
    const peutValider = hasPermission('notes:validate');

    const statsQuery = useStatistiquesNotes(
        {
            periodeId: note?.periodeId,
            classeAnneeId: note?.classeAnneeId,
            matiereId: note?.matiereId,
        },
        !!note && peutVoirStats
    );

    const [ongletActif, setOngletActif] = useTabState<OngletActif>('informations');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [statutCible, setStatutCible] = useState<StatutNote | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const supprimer = useSupprimerNote();
    const modifier = useModifierNote();

    const formatDate = (d: string): string =>
        new Date(d).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' });

    const handleDelete = async () => {
        await supprimer.mutateAsync(id);
        navigate({ to: '/notes' });
    };

    const handleChangerStatut = async () => {
        if (!statutCible) return;
        await modifier.mutateAsync({ id, statut: statutCible });
        setStatutCible(null);
    };

    if (isLoading) {
        return <div className="p-[clamp(0.75rem,2vw,1.5rem)]"><PageSkeleton showHeader /></div>;
    }

    if (error || !note) {
        return (
            <div className="p-[clamp(0.75rem,2vw,1.5rem)]">
                <ErrorMessage
                    message={t('introuvable')}
                    onRetry={() => navigate({ to: '/notes' })}
                />
            </div>
        );
    }

    const statut: StatutNote = note.statut ?? 'BROUILLON';
    const estPubliee = statut === 'PUBLIEE';
    const eleveLabel = note.eleve ? `${note.eleve.prenom} ${note.eleve.nom}` : '—';
    const matiereLabel = note.matiere?.nom ?? '—';
    const enseignantLabel = note.enseignant ? `${note.enseignant.prenom} ${note.enseignant.nom}` : '—';
    const bareme = note.bareme ?? 20;

    const statutLabels: Record<StatutNote, string> = {
        BROUILLON: t('statutBrouillon'),
        VALIDEE: t('statutValidee'),
        PUBLIEE: t('statutPubliee'),
    };

    const stats = statsQuery.data;
    const onglets: Tab[] = [
        { id: 'informations', label: t('informations'), icon: FileText },
        ...(peutVoirStats ? [{ id: 'statistiques', label: t('statistiques'), icon: TrendingUp }] : []),
        ...(peutValider ? [{ id: 'validation', label: t('validation'), icon: ShieldCheck }] : []),
    ];

    const maxDistribution = stats?.distribution?.length
        ? Math.max(...stats.distribution.map((d) => d.count), 1)
        : 1;

    return (
        <div className="flex flex-col gap-[var(--gap-sm)] p-[clamp(0.75rem,2vw,1.5rem)]">
            <PageHeader
                variant="gradient"
                icon={ClipboardList}
                title={`${eleveLabel} — ${matiereLabel}`}
                subtitle={formatNote(note.valeur, bareme)}
                onBack={() => navigate({ to: '/notes' })}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {hasPermission('notes:edit') && (
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<Edit className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                onClick={() => setFormOpen(true)}
                            >
                                {t('modifier')}
                            </ElisaButton>
                        )}
                        {hasPermission('notes:delete') && !estPubliee && (
                            <ElisaButton
                                variant="danger"
                                size="sm"
                                icon={<Trash2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
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
                {ongletActif === 'informations' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(0.75rem,2vw,1.5rem)]">
                        <Card>
                            <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                                <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                    <FileText className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
                                    {t('informations')}
                                </h3>
                                <div className="border-b border-border mb-4" />
                                <div className="space-y-3">
                                    <InfoField
                                        label={t('eleve')}
                                        value={
                                            note.eleve ? (
                                                <button
                                                    type="button"
                                                    className="font-medium text-foreground hover:text-primary transition-colors"
                                                    onClick={() => navigate({ to: '/eleves/$id', params: { id: note.eleve!.id } })}
                                                >
                                                    {eleveLabel}
                                                </button>
                                            ) : '—'
                                        }
                                        icon={<User className="h-3.5 w-3.5" />}
                                    />
                                    <InfoField
                                        label={t('matiere')}
                                        value={
                                            note.matiere ? (
                                                <button
                                                    type="button"
                                                    className="font-medium text-foreground hover:text-primary transition-colors"
                                                    onClick={() => navigate({ to: '/matieres/$id', params: { id: note.matiere!.id } })}
                                                >
                                                    {matiereLabel}
                                                </button>
                                            ) : '—'
                                        }
                                        icon={<BookOpen className="h-3.5 w-3.5" />}
                                    />
                                    <InfoField
                                        label={t('valeur')}
                                        value={
                                            <span className={`inline-flex items-center rounded-[var(--radius-lg)] px-2 py-0.5 font-bold ${getNoteBadgeClass(note.valeur, bareme)}`}>
                                                {formatNote(note.valeur, bareme)}
                                            </span>
                                        }
                                        icon={<Award className="h-3.5 w-3.5" />}
                                    />
                                    <InfoField label={t('coefficient')} value={note.coefficient ?? 1} icon={<Percent className="h-3.5 w-3.5" />} />
                                    <InfoField label={t('type')} value={t(note.typeEvaluation.toLowerCase())} icon={<Hash className="h-3.5 w-3.5" />} />
                                    <InfoField
                                        label={t('statut')}
                                        value={
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_BADGES[statut]}`}>
                                                {statutLabels[statut]}
                                            </span>
                                        }
                                        icon={<ShieldCheck className="h-3.5 w-3.5" />}
                                    />
                                    <InfoField label={t('enseignant')} value={enseignantLabel} icon={<User className="h-3.5 w-3.5" />} />
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                                <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                    <BarChart3 className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-success inline mr-2" />
                                    {t('metadonnees')}
                                </h3>
                                <div className="border-b border-border mb-4" />
                                <div className="space-y-3">
                                    <InfoField
                                        label={t('classe')}
                                        value={
                                            note.classeAnnee?.classe ? (
                                                <button
                                                    type="button"
                                                    className="font-medium text-foreground hover:text-primary transition-colors"
                                                    onClick={() => navigate({ to: '/classes/$id', params: { id: note.classeAnnee!.classe!.id } })}
                                                >
                                                    {note.classeAnnee.classe.nom}
                                                </button>
                                            ) : '—'
                                        }
                                    />
                                    <InfoField label={t('periode')} value={note.periode?.nom ?? '—'} />
                                    {note.commentaire && (
                                        <InfoField label={t('remarque')} value={note.commentaire} />
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

                {ongletActif === 'statistiques' && peutVoirStats && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-[var(--gap-sm)]">
                            <StatCard icon={TrendingUp} label={t('statMoyenne')} value={stats?.moyenne ?? '—'} tone="info" />
                            <StatCard icon={Award} label={t('statMediane')} value={stats?.mediane ?? '—'} tone="dominant" />
                            <StatCard icon={Star} label={t('statMax')} value={stats?.max ?? '—'} tone="success" />
                            <StatCard icon={TrendingUp} label={t('statMin')} value={stats?.min ?? '—'} tone="danger" />
                            <StatCard icon={BarChart3} label={t('statEcartType')} value={stats?.ecartType ?? '—'} tone="purple" />
                            <StatCard icon={Users} label={t('statNombreNotes')} value={stats?.nombreNotes ?? '—'} tone="info" />
                        </div>

                        {stats?.distribution && stats.distribution.length > 0 && (
                            <Card>
                                <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                                    <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                        <BarChart3 className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
                                        {t('distribution')}
                                    </h3>
                                    <div className="border-b border-border mb-4" />
                                    <div className="space-y-3">
                                        {stats.distribution.map((d) => (
                                            <div key={d.tranche} className="flex items-center gap-[var(--gap-sm)]">
                                                <span className="w-20 text-sm font-medium text-card-foreground">{d.tranche}</span>
                                                <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-dominant-500 transition-all duration-500"
                                                        style={{ width: `${(d.count / maxDistribution) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="w-16 text-right text-sm text-muted-foreground">{d.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(0.75rem,2vw,1.5rem)]">
                            {stats?.parType && stats.parType.length > 0 && (
                                <Card>
                                    <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                                        <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                            {t('statParType')}
                                        </h3>
                                        <div className="border-b border-border mb-4" />
                                        <div className="space-y-2">
                                            {stats.parType.map((pt) => (
                                                <div key={pt.typeEvaluation} className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border p-[var(--padding-table-cell)]">
                                                    <span className="text-sm font-medium">{t(pt.typeEvaluation.toLowerCase())}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-muted-foreground">{t('statCount', { count: pt.count })}</span>
                                                        <span className="text-sm font-bold text-foreground">{pt.moyenne}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {stats?.parStatut && stats.parStatut.length > 0 && (
                                <Card>
                                    <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                                        <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                            {t('statParStatut')}
                                        </h3>
                                        <div className="border-b border-border mb-4" />
                                        <div className="space-y-2">
                                            {stats.parStatut.map((ps) => (
                                                <div key={ps.statut} className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border p-[var(--padding-table-cell)]">
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_BADGES[ps.statut]}`}>
                                                        {statutLabels[ps.statut]}
                                                    </span>
                                                    <span className="text-sm font-bold text-foreground">{ps.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {ongletActif === 'validation' && peutValider && (
                    <Card>
                        <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                            <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                <ShieldCheck className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
                                {t('validation')}
                            </h3>
                            <div className="border-b border-border mb-4" />

                            {/* Frise du workflow */}
                            <div className="flex flex-wrap items-center gap-[var(--gap-sm)] mb-6">
                                {ETAPES_WORKFLOW.map((etape, index) => {
                                    const indexActuel = ETAPES_WORKFLOW.indexOf(statut);
                                    const atteinte = index <= indexActuel;
                                    return (
                                        <div key={etape} className="flex items-center gap-[var(--gap-sm)]">
                                            {index > 0 && (
                                                <div className={`h-0.5 w-[clamp(1rem,4vw,3rem)] ${atteinte ? 'bg-success' : 'bg-border'}`} />
                                            )}
                                            <span className={`rounded-full px-[clamp(0.5rem,1.5vw,0.875rem)] py-1 text-xs font-medium ${atteinte ? STATUT_BADGES[etape] : 'bg-muted text-muted-foreground'}`}>
                                                {statutLabels[etape]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-sm text-muted-foreground mb-4">
                                {statut === 'BROUILLON' && t('validationDescriptionBrouillon')}
                                {statut === 'VALIDEE' && t('validationDescriptionValidee')}
                                {statut === 'PUBLIEE' && t('validationDescriptionPubliee')}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {statut === 'BROUILLON' && (
                                    <ElisaButton
                                        variant="primary"
                                        size="sm"
                                        icon={<CheckCircle2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                        isLoading={modifier.isPending}
                                        onClick={() => setStatutCible('VALIDEE')}
                                    >
                                        {t('valider')}
                                    </ElisaButton>
                                )}
                                {statut === 'VALIDEE' && (
                                    <ElisaButton
                                        variant="primary"
                                        size="sm"
                                        icon={<Send className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                        isLoading={modifier.isPending}
                                        onClick={() => setStatutCible('PUBLIEE')}
                                    >
                                        {t('publier')}
                                    </ElisaButton>
                                )}
                            </div>
                        </div>
                    </Card>
                )}
            </TabsContent>

            <NoteFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                note={note}
            />

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

            <ConfirmDialog
                open={!!statutCible}
                onOpenChange={(o) => { if (!o) setStatutCible(null); }}
                title={statutCible === 'PUBLIEE' ? t('confirmerPublierTitre') : t('confirmerValiderTitre')}
                description={statutCible === 'PUBLIEE' ? t('confirmerPublierMessage') : t('confirmerValiderMessage')}
                confirmText={statutCible === 'PUBLIEE' ? t('publier') : t('valider')}
                variant="info"
                onConfirm={handleChangerStatut}
                isLoading={modifier.isPending}
            />
        </div>
    );
}
