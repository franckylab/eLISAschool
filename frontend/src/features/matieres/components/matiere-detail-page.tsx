/**
 * ==================================
 * eLISAschool - Page Détail Matière
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
    BookOpen, Clock, FileText, Users,
    Edit, Trash2, TrendingUp,
    Layers, CheckCircle, XCircle,
    Globe, UserCheck, UserPlus, History,
    ShieldCheck,
} from 'lucide-react';
import { useMatiere, useSupprimerMatiere, useModifierMatiere, useMatiereProgramme, useMatiereProgrammesPedagogiques, useMatiereAffectations, useCreerAffectation, useModifierAffectation, useSupprimerAffectation } from '../hooks/use-matieres';
import { MatiereFormModal } from './matiere-form-modal';
import { TabProgramme } from './tab-programme';
import { TabNiveaux } from './tab-niveaux';
import { useCreneaux } from '@/features/emploi-du-temps';
import { EDTCalendar } from '@/features/emploi-du-temps';
import { AffectationFormModal } from './affectation-form-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage, LoadingState } from '@/components/ui/ErrorMessage';
import { usePermissions, useTabState } from '@/hooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar } from '@/components/ui';
import type { Tab } from '@/components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { StatCard } from '@/components/ui/StatCard';
import { StatutBadge } from '@/components/ui/StatutBadge';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import { AuditTimeline } from '@/components/ui/AuditTimeline';
import type { AffectationMatiere, Matiere, CreerMatiereDto } from '../types/matiere.types';
import type { AffectationPayload } from '../hooks/use-matieres';
import { format } from 'date-fns';
import { fr as frLocale, enUS } from 'date-fns/locale';
import { ValidationTimeline, ValidationActions } from '@/components/ui';
import { useWorkflowByEntite } from '@/hooks/use-validation-workflow';

type OngletActif = 'informations' | 'niveaux' | 'programme' | 'affectations' | 'emploi-du-temps' | 'validation' | 'historique';

const SOUS_SYSTEME_STYLES: Record<string, { bg: string; text: string }> = {
    FRANCOPHONE: { bg: 'bg-info/10', text: 'text-info' },
    ANGLOPHONE: { bg: 'bg-success/10', text: 'text-success' },
    BICULTUREL: { bg: 'bg-purple/10', text: 'text-purple' },
};

function SousSystemeBadge({ value }: { value: string | null }) {
    const { t } = useTranslation('matieres');
    if (!value) return <span className="text-[clamp(0.625rem,1vw,0.75rem)] text-muted-foreground">{t('commun')}</span>;
    const style = SOUS_SYSTEME_STYLES[value] || { bg: 'bg-muted/10', text: 'text-secondary' };
    const labelMap: Record<string, string> = {
        FRANCOPHONE: t('francophone'),
        ANGLOPHONE: t('anglophone'),
        BICULTUREL: t('biculturel'),
    };
    const label = labelMap[value] || value;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-[clamp(0.25rem,0.75vw,0.375rem)] py-[clamp(0.0625rem,0.25vw,0.125rem)] text-[clamp(0.625rem,1vw,0.75rem)] font-medium ${style.bg} ${style.text}`}>
            <Globe className="h-3 w-3" />
            {label}
        </span>
    );
}

function formatDate(d: string, locale: string) {
    const date = new Date(d);
    const loc = locale.startsWith('en') ? enUS : frLocale;
    return format(date, 'dd MMMM yyyy', { locale: loc });
}

export function MatiereDetailPage() {
    const { id } = useParams({ from: '/_auth/matieres/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { t, i18n } = useTranslation('matieres');

    const { data: matiere, isLoading, error } = useMatiere(id);
    const [formOpen, setFormOpen] = useState(false);
    const modifier = useModifierMatiere();
    const supprimer = useSupprimerMatiere();
    const { ask: askDelete, ConfirmationModal: DeleteConfirmModal } = useConfirmation();
    const { ask: askDeleteAffectation, ConfirmationModal: DeleteAffectationConfirmModal } = useConfirmation();

    const [affectationModalOpen, setAffectationModalOpen] = useState(false);
    const [affectationToEdit, setAffectationToEdit] = useState<AffectationMatiere | null>(null);
    const [deleteAffectationId, setDeleteAffectationId] = useState<string | null>(null);
    const creerAffectation = useCreerAffectation();
    const modifierAffectation = useModifierAffectation();
    const supprimerAffectation = useSupprimerAffectation();

    const [ongletActif, setOngletActif] = useTabState<OngletActif>('informations');

    const programmeQuery = useMatiereProgramme(id);
    const programmesPedagogiquesQuery = useMatiereProgrammesPedagogiques(id);
    const affectationsQuery = useMatiereAffectations(id);
    const edtQuery = useCreneaux({ affectationMatiereId: id, limit: 100 });

    const peutValider = hasPermission('matieres:validate');
    const workflowQuery = useWorkflowByEntite('matieres', id);

    const affectationsInactives = useMemo(() => {
        const affectations = affectationsQuery.data ?? [];
        return affectations.filter((a) => !a.actif);
    }, [affectationsQuery.data]);

    const handleSave = async (data: CreerMatiereDto) => {
        await modifier.mutateAsync({ id, ...data });
        setFormOpen(false);
    };

    const handleDelete = async () => {
        await supprimer.mutateAsync(id);
        navigate({ to: '/matieres' });
    };

    const handleAffectationSave = async (data: AffectationPayload) => {
        if (affectationToEdit) {
            await modifierAffectation.mutateAsync({ id: affectationToEdit.id, ...data });
        } else {
            await creerAffectation.mutateAsync(data);
        }
        setAffectationModalOpen(false);
        setAffectationToEdit(null);
    };

    const handleDeleteAffectation = async () => {
        if (!deleteAffectationId) return;
        await supprimerAffectation.mutateAsync({ id: deleteAffectationId, matiereId: id });
        setDeleteAffectationId(null);
    };

    if (isLoading) {
        return <PageSkeleton showHeader />;
    }

    if (error || !matiere) {
        return (
            <div className="p-6">
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-[clamp(0.875rem,1.5vw,1rem)] text-secondary">{t('matiereNonTrouvee')}</p>
                        <ElisaButton variant="primary" onClick={() => navigate({ to: '/matieres' })}>
                            {t('retourListe')}
                        </ElisaButton>
                    </div>
                </div>
            </div>
        );
    }

    const onglets: Tab[] = [
        { id: 'informations', label: t('ongletInformations'), icon: BookOpen },
        { id: 'niveaux', label: t('niveaux'), icon: Layers, count: programmeQuery.data?.length },
        { id: 'programme', label: t('ongletProgrammes'), icon: BookOpen, count: programmesPedagogiquesQuery.data?.length },
        { id: 'affectations', label: t('enseignants'), icon: Users, count: affectationsQuery.data?.length },
        { id: 'emploi-du-temps', label: t('emploiDuTemps'), icon: Clock, count: edtQuery.data?.items?.length },
        ...(peutValider ? [{ id: 'validation' as const, label: t('validation'), icon: ShieldCheck }] : []),
        ...(hasPermission('audit:matieres:view') || hasPermission('audit:view')
            ? [{ id: 'historique' as const, label: t('historique'), icon: History }]
            : []),
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                showBreadcrumbs
                breadcrumbLabel={matiere.nom}
                onBack={() => navigate({ to: '/matieres' })}
                actions={
                    <div className="flex gap-2">
                        {hasPermission('config:edit') && (
                            <ElisaButton variant="outline" size="sm" icon={<Edit className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
                                {t('modifier')}
                            </ElisaButton>
                        )}
                        {hasPermission('config:edit') && (
                            <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => askDelete({
                                title: t('supprimerMatiereTitre'),
                                message: t('supprimerMatiereMessage', { nom: matiere.nom }),
                                details: t('supprimerMatiereDetails'),
                                onConfirm: handleDelete,
                            })}>
                                {t('supprimer')}
                            </ElisaButton>
                        )}
                    </div>
                }
            >
                <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl shrink-0 p-[clamp(0.75rem,2.5vw,1rem)]">
                        <BookOpen className="h-[clamp(1.75rem,6vw,2.5rem)] w-[clamp(1.75rem,6vw,2.5rem)] text-white" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <h1 className="text-[clamp(1.5rem,4.5vw,3.5rem)] font-bold text-white leading-tight">{matiere.nom}</h1>
                        {matiere.code && <p className="text-[clamp(0.75rem,2vw,1.125rem)] text-white/70">{matiere.code}</p>}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <StatutBadge statut={matiere.actif ? 'ACTIF' : 'INACTIF'} label={matiere.actif ? t('active') : t('inactive')} />
                            {matiere.sousSysteme && <SousSystemeBadge value={matiere.sousSysteme} />}
                        </div>
                    </div>
                </div>
            </PageHeader>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-[clamp(0.5rem,1.5vw,1rem)]">
                <StatCard icon={Layers} label={t('niveauxCount')} value={programmeQuery.data?.length ?? 0} tone="info" />
                <StatCard icon={Users} label={t('enseignantsCount')} value={affectationsQuery.data?.length ?? 0} tone="success" />
                <StatCard icon={BookOpen} label={t('programmesCount')} value={programmesPedagogiquesQuery.data?.length ?? 0} tone="purple" />
            </div>

            {affectationsInactives.length > 0 && (
                <ErrorMessage
                    message={t('affectationsInactives', { count: affectationsInactives.length })}
                />
            )}

            <TabsBar tabs={onglets} activeTab={ongletActif} onTabChange={(tabId) => setOngletActif(tabId as OngletActif)} variant="underline" />

            <motion.div key={ongletActif} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                {ongletActif === 'informations' && (
                    <InformationsTab matiere={matiere} locale={i18n.language} />
                )}
                {ongletActif === 'niveaux' && (
                    <TabNiveaux
                        matiereNiveaux={programmeQuery.data}
                        isLoading={programmeQuery.isLoading}
                        matiereId={id}
                        matiereNom={matiere.nom}
                    />
                )}
                {ongletActif === 'programme' && (
                    <TabProgramme
                        programmesPedagogiques={programmesPedagogiquesQuery.data}
                        isLoadingPP={programmesPedagogiquesQuery.isLoading}
                        matiereId={id}
                        matiereNom={matiere.nom}
                    />
                )}
                {ongletActif === 'affectations' && (
                    <AffectationsTab
                        data={affectationsQuery.data}
                        isLoading={affectationsQuery.isLoading}
                        matiereId={id}
                        locale={i18n.language}
                        onEdit={(a) => { setAffectationToEdit(a); setAffectationModalOpen(true); }}
                        onDelete={(aId) => {
                            setDeleteAffectationId(aId);
                            askDeleteAffectation({
                                title: t('supprimerAffectation'),
                                message: t('supprimerAffectationMessage'),
                                details: t('supprimerAffectationDetails'),
                                onConfirm: handleDeleteAffectation,
                            });
                        }}
                        onCreate={() => { setAffectationToEdit(null); setAffectationModalOpen(true); }}
                        hasPermission={hasPermission('config:edit')}
                    />
                )}
                {ongletActif === 'emploi-du-temps' && (
                    <div className="space-y-4">
                        {edtQuery.isLoading ? (
                            <div className="py-12"><LoadingState message={t('chargementEDT')} /></div>
                        ) : !edtQuery.data?.items?.length ? (
                        <div className="bg-card rounded-lg border border-border p-[clamp(1.5rem,5vw,3rem)] text-center">
                            <Clock className="h-[clamp(2rem,6vw,3rem)] w-[clamp(2rem,6vw,3rem)] text-muted-foreground mx-auto mb-[clamp(0.5rem,2vw,0.75rem)]" />
                            <p className="text-secondary font-medium mb-[clamp(0.125rem,0.5vw,0.25rem)] text-[clamp(0.875rem,1.5vw,1rem)]">{t('aucunCreneau')}</p>
                            <p className="text-[clamp(0.75rem,1.25vw,0.875rem)] text-muted-foreground">{t('aucunCreneauDescription')}</p>
                        </div>
                        ) : (
                            <EDTCalendar creneaux={edtQuery.data.items} />
                        )}
                    </div>
                )}

                {ongletActif === 'validation' && peutValider && (
                    <motion.div key="validation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        <Card>
                            <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                                <h3 className="flex items-center gap-[var(--gap-xs)] text-base font-semibold text-foreground mb-4">
                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                    {t('validation')}
                                </h3>
                                <div className="border-b border-border mb-6" />
                                {workflowQuery.isLoading ? (
                                    <LoadingState />
                                ) : workflowQuery.data ? (
                                    <>
                                        <ValidationTimeline
                                            historique={workflowQuery.data.historique}
                                            niveauxRequis={workflowQuery.data.niveauxRequis}
                                            niveauActuel={workflowQuery.data.niveauActuel}
                                            statut={workflowQuery.data.statut}
                                            className="mb-6"
                                        />
                                        <ValidationActions
                                            workflowId={workflowQuery.data.id}
                                            statut={workflowQuery.data.statut}
                                            niveauActuel={workflowQuery.data.niveauActuel}
                                            niveauxRequis={workflowQuery.data.niveauxRequis}
                                            module="matieres"
                                            onValidated={() => workflowQuery.refetch()}
                                        />
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{t('validation.aucunWorkflow')}</p>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {ongletActif === 'historique' && (
                    <Card>
                        <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                            <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                <History className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
                                {t('historique')}
                            </h3>
                            <div className="border-b border-border mb-4" />
                            <AuditTimeline cible="Matiere" cibleId={id} module="matieres" />
                        </div>
                    </Card>
                )}
            </motion.div>

            {formOpen && (
                <MatiereFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) setFormOpen(false); }}
                    matiere={matiere}
                    onSave={handleSave}
                    isLoading={modifier.isPending}
                />
            )}

            {affectationModalOpen && (
                <AffectationFormModal
                    open={affectationModalOpen}
                    onOpenChange={(v) => { if (!v) { setAffectationModalOpen(false); setAffectationToEdit(null); } }}
                    matiereId={id}
                    affectation={affectationToEdit}
                    onSave={handleAffectationSave}
                    isLoading={creerAffectation.isPending || modifierAffectation.isPending}
                />
            )}

            {DeleteConfirmModal}
            {DeleteAffectationConfirmModal}
        </div>
    );
}

function InformationsTab({ matiere, locale }: { matiere: Matiere; locale: string }) {
    const { t } = useTranslation('matieres');
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        {t('informationsGenerales')}
                    </CardTitle>
                </CardHeader>
                <div className="border-b border-border mx-4 sm:mx-5" />
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField label={t('nom')} value={matiere.nom} />
                        <InfoField label={t('code')} value={matiere.code || '-'} />
                        {matiere.nomAnglais && <InfoField label={t('nomAnglais')} value={matiere.nomAnglais} />}
                        <InfoField label={t('sousSysteme')} value={<SousSystemeBadge value={matiere.sousSysteme} />} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        {t('configuration')}
                    </CardTitle>
                </CardHeader>
                <div className="border-b border-border mx-4 sm:mx-5" />
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField
                            label={t('couleur')}
                            value={
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg border-2 border-border shadow-sm" style={{ backgroundColor: matiere.couleur || '#3B82F6' }} />
                                    <span className="font-mono text-[clamp(0.75rem,1.25vw,0.875rem)]">{matiere.couleur}</span>
                                </div>
                            }
                        />
                        <InfoField label={t('statut')} value={<StatutBadge statut={matiere.actif ? 'ACTIF' : 'INACTIF'} label={matiere.actif ? t('active') : t('inactive')} />} />
                    </div>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        {t('metadonnees')}
                    </CardTitle>
                </CardHeader>
                <div className="border-b border-border mx-4 sm:mx-5" />
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField label={t('creeeLe')} value={formatDate(matiere.createdAt, locale)} />
                        <InfoField label={t('derniereModification')} value={formatDate(matiere.updatedAt, locale)} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function AffectationsTab({ data, isLoading, onEdit, onDelete, onCreate, hasPermission, locale }: {
    data: AffectationMatiere[] | undefined;
    isLoading: boolean;
    matiereId: string;
    locale: string;
    onEdit: (a: AffectationMatiere) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
    hasPermission: boolean;
}) {
    const { t } = useTranslation('matieres');
    const navigate = useNavigate();

    if (isLoading) return <div className="py-12 text-center text-muted-foreground"><LoadingState message={t('chargementAffectations')} /></div>;

    return (
        <div className="space-y-4">
            {hasPermission && (
                <div className="flex justify-end">
                    <ElisaButton variant="primary" size="sm" icon={<UserPlus className="h-4 w-4" />} onClick={onCreate}>
                        {t('affecterEnseignantBouton')}
                    </ElisaButton>
                </div>
            )}

            {!data || data.length === 0 ? (
                <EmptyState icon={Users} message={t('aucunEnseignant')} sub={t('aucunEnseignantSub')} />
            ) : (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[clamp(0.75rem,1.25vw,0.875rem)]">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-secondary">{t('enseignant')}</th>
                                    <th className="text-left px-4 py-3 font-medium text-secondary">{t('classe')}</th>
                                    <th className="text-left px-4 py-3 font-medium text-secondary">{t('anneeScolaire')}</th>
                                    <th className="text-center px-4 py-3 font-medium text-secondary">{t('periode')}</th>
                                    <th className="text-center px-4 py-3 font-medium text-secondary">{t('statut')}</th>
                                    {hasPermission && <th className="text-center px-4 py-3 font-medium text-secondary">{t('actions')}</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {data.map((a) => (
                                    <tr key={a.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{a.enseignant ? `${a.enseignant.prenom} ${a.enseignant.nom}` : a.enseignantId}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {a.classeAnnee?.classe ? (
                                                <button
                                                    type="button"
                                                    className="font-medium text-foreground hover:text-primary transition-colors"
                                                    onClick={() => navigate({ to: '/classes/$id', params: { id: a.classeAnnee!.classe!.id } })}
                                                >
                                                    {a.classeAnnee.classe.nom}
                                                </button>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-secondary">{a.classeAnnee?.anneeScolaire?.libelle || '-'}</td>
                                        <td className="px-4 py-3 text-center text-[clamp(0.625rem,1vw,0.75rem)] text-muted-foreground">
                                            {a.dateDebut ? formatDate(a.dateDebut, locale) : '-'}
                                            {a.dateFin ? ` → ${formatDate(a.dateFin, locale)}` : ''}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {a.actif ? (
                                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[clamp(0.625rem,1vw,0.75rem)] font-medium bg-success/10 text-success">
                                                    <CheckCircle className="h-3 w-3" /> {t('statutActif')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[clamp(0.625rem,1vw,0.75rem)] font-medium bg-muted/10 text-muted-foreground">
                                                    <XCircle className="h-3 w-3" /> {t('statutInactif')}
                                                </span>
                                            )}
                                        </td>
                                        {hasPermission && (
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <ElisaButton variant="ghost" size="sm" onClick={() => onEdit(a)}>
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </ElisaButton>
                                                    <ElisaButton variant="ghost" size="sm" onClick={() => onDelete(a.id)}>
                                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                    </ElisaButton>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function EmptyState({ icon: Icon, message, sub }: { icon: LucideIcon; message: string; sub: string }) {
    return (
        <div className="bg-card rounded-lg border border-border p-[clamp(1.5rem,5vw,3rem)] text-center">
            <Icon className="h-[clamp(2rem,6vw,3rem)] w-[clamp(2rem,6vw,3rem)] text-muted-foreground mx-auto mb-[clamp(0.5rem,2vw,0.75rem)]" />
            <p className="text-secondary font-medium mb-[clamp(0.125rem,0.5vw,0.25rem)] text-[clamp(0.875rem,1.5vw,1rem)]">{message}</p>
            <p className="text-[clamp(0.75rem,1.25vw,0.875rem)] text-muted-foreground">{sub}</p>
        </div>
    );
}
