import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Calendar, ClockArrowUp, Clock, Trash2,
    Play, Lock, Unlock, FileText,
    CalendarDays, CheckCircle2, XCircle, Timer, Info, History, ShieldCheck,
} from 'lucide-react';
import {
    useAnneeScolaire, useSupprimerAnneeScolaire,
    useActiverAnneeScolaire, useCloturerAnneeScolaire,
    useReouvrirAnneeScolaire
} from '../hooks/use-annees-scolaires';
import type { Periode } from '../types/annee-scolaire.types';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Card } from '@/components/ui/Card';
import { StatCard, TabsBar, TabsContent, CardSection, InfoField } from '@/components/ui';
import type { Tab } from '@/components/ui';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { AuditTimeline } from '@/components/ui/AuditTimeline';
import { ValidationTimeline, ValidationActions } from '@/components/ui';
import { useWorkflowByEntite } from '@/hooks/use-validation-workflow';
import { usePermissions } from '@/hooks';

const COULEURS_STATUT: Record<string, string> = {
    active: 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] border-[var(--color-dominant-200)]',
    inactive: 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-bordure)]',
    future: 'bg-blue-50 text-blue-700 border-blue-200',
    archivee: 'bg-purple-50 text-purple-700 border-purple-200',
};

const COULEURS_STATUT_PERIODE: Record<string, string> = {
    OUVERTE: 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)]',
    EN_ATTENTE_CLOTURE: 'bg-amber-50 text-amber-700',
    CLOTUREE: 'bg-[var(--color-surface-alt)] text-[var(--color-text-tertiary)]',
};

function formatDate(dateStr: string, locale: string, options?: Intl.DateTimeFormatOptions): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, options || {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function calculerProgression(dateDebut: string, dateFin: string): number {
    const debut = new Date(dateDebut).getTime();
    const fin = new Date(dateFin).getTime();
    const maintenant = Date.now();
    if (maintenant < debut) return 0;
    if (maintenant > fin) return 100;
    return Math.round(((maintenant - debut) / (fin - debut)) * 100);
}

export function AnneeScolaireDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams({ from: '/_auth/annees-scolaires/$id' });
    const { t, i18n } = useTranslation('annees-scolaires');
    const { hasPermission } = usePermissions();
    const [ongletActif, setOngletActif] = useState('informations');
    const [confirmActiver, setConfirmActiver] = useState(false);
    const [confirmSupprimer, setConfirmSupprimer] = useState(false);
    const [confirmCloturer, setConfirmCloturer] = useState(false);
    const [confirmReouvrir, setConfirmReouvrir] = useState(false);

    const { data: annee, isLoading, isError, error, refetch } = useAnneeScolaire(id);
    const supprimer = useSupprimerAnneeScolaire();
    const activer = useActiverAnneeScolaire();
    const cloturer = useCloturerAnneeScolaire();
    const reouvrir = useReouvrirAnneeScolaire();

    const peutValider = hasPermission('annees-scolaires:validate');
    const workflowQuery = useWorkflowByEntite('annees_scolaires', id);

    const estCloturee = annee?.statut === 'archivee';

    const dureeJours = useMemo(() => {
        if (!annee) return 0;
        return Math.ceil(
            (new Date(annee.dateFin).getTime() - new Date(annee.dateDebut).getTime())
            / (1000 * 60 * 60 * 24)
        );
    }, [annee]);

    const joursRestants = useMemo(() => {
        if (!annee || annee.statut !== 'active') return null;
        const restants = Math.ceil(
            (new Date(annee.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return restants > 0 ? restants : null;
    }, [annee]);

    const progression = useMemo(() => {
        if (!annee) return 0;
        return calculerProgression(annee.dateDebut, annee.dateFin);
    }, [annee]);

    const periodesParType = useMemo(() => {
        if (!annee?.periodes?.length) return {};
        const groupes: Record<string, { typeNom: string; periodes: Periode[] }> = {};
        for (const periode of annee.periodes) {
            const niveauKey = periode.niveauId || 'AUTRE';
            const typeNom = periode.niveau?.label || periode.niveauId?.substring(0, 8) || 'AUTRE';
            if (!groupes[niveauKey]) {
                groupes[niveauKey] = { typeNom, periodes: [] };
            }
            groupes[niveauKey].periodes.push(periode);
        }
        for (const groupe of Object.values(groupes)) {
            groupe.periodes.sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
        }
        return groupes;
    }, [annee?.periodes]);

    const totalPeriodes = annee?.periodes?.length || 0;
    const periodesOuvertes = annee?.periodes?.filter(p => p.statut === 'OUVERTE').length || 0;

    const handleActiver = useCallback(async () => {
        await activer.mutateAsync(id);
        setConfirmActiver(false);
        navigate({ to: '/annees-scolaires' });
    }, [id, activer, navigate]);

    const handleCloturer = useCallback(async () => {
        await cloturer.mutateAsync(id);
        setConfirmCloturer(false);
    }, [id, cloturer]);

    const handleReouvrir = useCallback(async () => {
        await reouvrir.mutateAsync(id);
        setConfirmReouvrir(false);
    }, [id, reouvrir]);

    const handleSupprimer = useCallback(async () => {
        await supprimer.mutateAsync(id);
        setConfirmSupprimer(false);
        navigate({ to: '/annees-scolaires' });
    }, [id, supprimer, navigate]);

    const onglets: Tab[] = [
        { id: 'informations', label: t('detail.informations'), description: t('detail.tabInformationsDesc'), icon: FileText },
        { id: 'periodes', label: t('detail.periodes'), description: t('detail.tabPeriodesDesc'), icon: CalendarDays, count: totalPeriodes },
        ...(peutValider ? [{ id: 'validation', label: t('validation'), icon: ShieldCheck }] : []),
        ...(hasPermission('audit:annees-scolaires:view') || hasPermission('audit:view')
            ? [{ id: 'historique', label: t('detail.historique'), icon: History }]
            : []),
    ];

    if (isLoading) {
        return <PageSkeleton showHeader />;
    }

    if (isError) {
        return (
            <div className="p-6">
                <ErrorMessage message={error?.message} onRetry={() => refetch()} />
            </div>
        );
    }

    if (!annee) {
        return (
            <div className="p-6">
                <ErrorMessage message={t('detail.nonTrouvee')} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                showBreadcrumbs
                title={annee.libelle}
                icon={ClockArrowUp}
                onBack={() => navigate({ to: '/annees-scolaires' })}
                actions={
                    <div className="flex gap-2">
                        {!estCloturee && !annee.estActuelle && annee.statut !== 'active' && (
                            <ElisaButton
                                variant="primary"
                                size="sm"
                                icon={<Play className="h-4 w-4" />}
                                isLoading={activer.isPending}
                                onClick={() => setConfirmActiver(true)}
                            >
                                {t('actions.activer')}
                            </ElisaButton>
                        )}
                        {!estCloturee && (
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<Lock className="h-4 w-4" />}
                                isLoading={cloturer.isPending}
                                onClick={() => setConfirmCloturer(true)}
                            >
                                {t('actions.cloturer')}
                            </ElisaButton>
                        )}
                        {estCloturee && (
                            <ElisaButton
                                variant="accent"
                                size="sm"
                                icon={<Unlock className="h-4 w-4" />}
                                isLoading={reouvrir.isPending}
                                onClick={() => setConfirmReouvrir(true)}
                            >
                                {t('actions.reouvrir')}
                            </ElisaButton>
                        )}
                        <ElisaButton
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="h-4 w-4" />}
                            isLoading={supprimer.isPending}
                            onClick={() => setConfirmSupprimer(true)}
                        >
                            {t('actions.supprimer')}
                        </ElisaButton>
                    </div>
                }
            />

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Calendar}
                    label={t('detail.dateDebut')}
                    value={formatDate(annee.dateDebut, i18n.language)}
                    tone="accent"
                    delay={0.05}
                />
                <StatCard
                    icon={Calendar}
                    label={t('detail.dateFin')}
                    value={formatDate(annee.dateFin, i18n.language)}
                    tone="purple"
                    delay={0.1}
                />
                <StatCard
                    icon={Clock}
                    label={t('detail.duree')}
                    value={`${Math.floor(dureeJours / 30)}m ${dureeJours % 30}j`}
                    tone="success"
                    delay={0.15}
                />
                <StatCard
                    icon={CalendarDays}
                    label={t('detail.periodes')}
                    value={totalPeriodes}
                    tone="warning"
                    delay={0.2}
                />
            </div>

            {/* Progression bar */}
            {annee.statut === 'active' && (
                <Card>
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                <Timer className="h-4 w-4" />
                                {t('detail.progressionMessage')}
                            </span>
                            <span className="font-semibold text-[var(--color-dominant-700)] text-sm">
                                {progression}%
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: 'var(--color-dominant-600)' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progression}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                </Card>
            )}

            {/* Tabs */}
            <TabsBar
                tabs={onglets}
                activeTab={ongletActif}
                onTabChange={setOngletActif}
                variant="underline"
                showHeader
            />

            <TabsContent activeTab={ongletActif}>
                {/* Informations tab */}
                {ongletActif === 'informations' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <CardSection
                            icon={<FileText className="h-5 w-5" />}
                            title={t('detail.informations')}
                            delay={0.05}
                        >
                            <InfoField
                                label={t('form.libelle')}
                                value={annee.libelle}
                            />
                            <InfoField
                                label={t('form.code')}
                                value={annee.code}
                            />
                            <InfoField
                                label={t('detail.statut')}
                                value={
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${COULEURS_STATUT[annee.statut]}`}>
                                        {t(`statut.${annee.statut}`)}
                                    </span>
                                }
                            />
                            <InfoField
                                label={t('detail.anneeCourante')}
                                value={
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${annee.estActuelle ? 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)]' : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'}`}>
                                        {annee.estActuelle ? t('statut.actuelle') : t('statut.inactive')}
                                    </span>
                                }
                            />
                        </CardSection>

                        <CardSection
                            icon={<Clock className="h-5 w-5" />}
                            title={t('detail.dateDebut')}
                            delay={0.1}
                        >
                            <InfoField
                                label={t('detail.dateDebut')}
                                value={formatDate(annee.dateDebut, i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            />
                            <InfoField
                                label={t('detail.dateFin')}
                                value={formatDate(annee.dateFin, i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            />
                            <InfoField
                                label={t('detail.duree')}
                                value={`${dureeJours} jours (${Math.floor(dureeJours / 30)}m ${dureeJours % 30}j)`}
                            />
                            {joursRestants !== null && (
                                <InfoField
                                    label={t('detail.joursRestants')}
                                    value={<span className="text-amber-600 font-bold">{joursRestants} jours</span>}
                                />
                            )}
                        </CardSection>

                        <CardSection
                            icon={<Info className="h-5 w-5" />}
                            title={t('detail.metadonnees')}
                            delay={0.15}
                            className="lg:col-span-2"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InfoField
                                    label={t('detail.creerLe')}
                                    value={new Date(annee.createdAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                />
                                <InfoField
                                    label={t('detail.modifieeLe')}
                                    value={new Date(annee.updatedAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                />
                            </div>
                        </CardSection>
                    </div>
                )}

                {/* Periodes tab */}
                {ongletActif === 'periodes' && (
                    <div className="space-y-6">
                        {totalPeriodes === 0 ? (
                            <div className="rounded-xl border border-border bg-card text-center p-12">
                                <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <p className="text-base font-medium text-card-foreground">
                                    {t('detail.aucunePeriode')}
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {t('detail.aucunePeriodeDesc')}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Period summary */}
                                <div className="flex items-center gap-4 flex-wrap rounded-xl border border-border bg-card p-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-dominant-600" />
                                        <span className="text-sm text-muted-foreground">
                                            <strong className="text-card-foreground">{periodesOuvertes}</strong> ouverte{periodesOuvertes > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            <strong className="text-card-foreground">{totalPeriodes - periodesOuvertes}</strong> clôturée{totalPeriodes - periodesOuvertes > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Period groups by type */}
                                {Object.entries(periodesParType).map(([typeCode, { typeNom, periodes }]) => (
                                    <CardSection
                                        key={typeCode}
                                        icon={<CalendarDays className="h-5 w-5" />}
                                        title={`${typeNom} (${periodes.length})`}
                                    >
                                        <div className="space-y-2">
                                            {periodes.map((periode) => {
                                                const periodeJours = Math.ceil(
                                                    (new Date(periode.dateFin).getTime() - new Date(periode.dateDebut).getTime())
                                                    / (1000 * 60 * 60 * 24)
                                                );
                                                return (
                                                    <div
                                                        key={periode.id}
                                                        className="flex items-center justify-between flex-wrap gap-2 rounded-lg border border-border bg-surface-alt p-3"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-card-foreground truncate text-sm">
                                                                {periode.nom}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatDate(periode.dateDebut, i18n.language)} → {formatDate(periode.dateFin, i18n.language)}
                                                                <span className="ml-2">• {periodeJours}j</span>
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COULEURS_STATUT_PERIODE[periode.statut]}`}>
                                                            {t(`statutPeriode.${periode.statut}`)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardSection>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {ongletActif === 'validation' && peutValider && (
                    <Card>
                        <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                            <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                <ShieldCheck className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
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
                                        className="mb-6"
                                    />
                                    <ValidationActions
                                        workflowId={workflowQuery.data.id}
                                        statut={workflowQuery.data.statut}
                                        niveauActuel={workflowQuery.data.niveauActuel}
                                        niveauxRequis={workflowQuery.data.niveauxRequis}
                                        module="annees_scolaires"
                                        onValidated={() => workflowQuery.refetch()}
                                    />
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
                                {t('detail.historique')}
                            </h3>
                            <div className="border-b border-border mb-4" />
                            <AuditTimeline cible="AnneeScolaire" cibleId={id} module="annees-scolaires" />
                        </div>
                    </Card>
                )}
            </TabsContent>

            {/* Confirmation dialogs */}
            <ConfirmDialog
                open={confirmActiver}
                onOpenChange={(open) => { if (!open) setConfirmActiver(false); }}
                title={t('confirmerSupprimerTitre')}
                description={t('detail.confirmerActiverMessage', { libelle: annee?.libelle })}
                confirmText={t('actions.activer')}
                variant="warning"
                onConfirm={handleActiver}
                isLoading={activer.isPending}
            />

            <ConfirmDialog
                open={confirmCloturer}
                onOpenChange={(open) => { if (!open) setConfirmCloturer(false); }}
                title={t('confirmerCloturerTitre')}
                description={t('confirmerCloturerMessage', { libelle: annee?.libelle })}
                confirmText={t('actions.cloturer')}
                variant="warning"
                onConfirm={handleCloturer}
                isLoading={cloturer.isPending}
            />

            <ConfirmDialog
                open={confirmReouvrir}
                onOpenChange={(open) => { if (!open) setConfirmReouvrir(false); }}
                title={t('confirmerReouvrirTitre')}
                description={t('confirmerReouvrirMessage', { libelle: annee?.libelle })}
                confirmText={t('actions.reouvrir')}
                variant="info"
                onConfirm={handleReouvrir}
                isLoading={reouvrir.isPending}
            />

            <ConfirmDialog
                open={confirmSupprimer}
                onOpenChange={(open) => { if (!open) setConfirmSupprimer(false); }}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage', { libelle: annee?.libelle })}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={handleSupprimer}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
