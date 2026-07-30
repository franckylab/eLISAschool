import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarRange, Clock, Trash2,
    AlertCircle, Lock, Unlock, FileText,
    BarChart3, CheckCircle2, Timer, Edit, Network, History, ShieldCheck,
} from 'lucide-react';
import {
    usePeriode, useSupprimerPeriode,
    useCloturerPeriode, useReouvrirPeriode,
    useCompositions, useNiveauxPeriode,
    useProgressionEnfants,
} from '../hooks/use-periodes';
import { StatutPeriode, niveauPeutAvoirEnfants } from '../types/periode.types';
import type { PeriodeComposition } from '../types/periode.types';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { InfoField, TextLabel } from '@/components/ui';
import { ModalCloturePeriode } from './modal-cloture-periode';
import { ModalFormPeriode } from './modal-form-periode';
import { ModalGestionCompositions } from './modal-gestion-compositions';
import { usePermissions } from '@/hooks';
import { StatutBadge } from '@/components/ui/StatutBadge';
import { RowActions } from '@/components/ui/RowActions';
import { AuditTimeline } from '@/components/ui/AuditTimeline';
import { ValidationTimeline, ValidationActions } from '@/components/ui';
import { useWorkflowByEntite } from '@/hooks/use-validation-workflow';

const EMPTY_COMPOSITIONS: PeriodeComposition[] = [];

type OngletActif = 'informations' | 'structure' | 'donnees' | 'validation' | 'historique';

function formatDateFr(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function calculeProgression(dateDebut: string, dateFin: string): number {
    const debut = new Date(dateDebut).getTime();
    const fin = new Date(dateFin).getTime();
    const maintenant = Date.now();
    if (maintenant < debut) return 0;
    if (maintenant > fin) return 100;
    return Math.round(((maintenant - debut) / (fin - debut)) * 100);
}

export function PeriodeDetailPage() {
    const { id } = useParams({ from: '/_auth/periodes/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { t } = useTranslation('periodes');
    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');
    const [confirmAction, setConfirmAction] = useState<'supprimer' | 'reouvrir' | null>(null);
    const [modalClotureOpen, setModalClotureOpen] = useState(false);
    const [modalFormOpen, setModalFormOpen] = useState(false);
    const [modalCompositionsOpen, setModalCompositionsOpen] = useState(false);

    const { data: periode, isLoading, isError, error, refetch } = usePeriode(id);
    const { data: compositionsEnfants = EMPTY_COMPOSITIONS } = useCompositions(id);
    const { data: progressionEnfants = [] } = useProgressionEnfants(id);
    const supprimer = useSupprimerPeriode();
    const cloturer = useCloturerPeriode();
    const reouvrir = useReouvrirPeriode();

    const peutValider = hasPermission('periodes:validate');
    const workflowQuery = useWorkflowByEntite('periodes', id);

    const estCloturee = periode?.statut === StatutPeriode.CLOTUREE;
    const estOuverte = periode?.statut === StatutPeriode.OUVERTE;

    const dureeJours = useMemo(() => {
        if (!periode) return 0;
        return Math.ceil(
            (new Date(periode.dateFin).getTime() - new Date(periode.dateDebut).getTime())
            / (1000 * 60 * 60 * 24)
        );
    }, [periode]);

    const progression = useMemo(() => {
        if (!periode) return 0;
        const debut = new Date(periode.dateDebut).getTime();
        const fin = new Date(periode.dateFin).getTime();
        const maintenant = Date.now();
        if (maintenant < debut) return 0;
        if (maintenant > fin) return 100;
        return Math.round(((maintenant - debut) / (fin - debut)) * 100);
    }, [periode]);

    const onglets = [
        { id: 'informations' as const, label: t('detail.informations'), icon: FileText },
        { id: 'structure' as const, label: t('detail.structure'), icon: Network },
        { id: 'donnees' as const, label: t('detail.donneesLiees'), icon: BarChart3 },
        ...(peutValider ? [{ id: 'validation' as const, label: t('detail.validation'), icon: ShieldCheck }] : []),
        ...(hasPermission('audit:periodes:view') || hasPermission('audit:view')
            ? [{ id: 'historique' as const, label: t('detail.historique'), icon: History }]
            : []),
    ];

    const { data: niveaux = [] } = useNiveauxPeriode();
    const peutAvoirEnfants = periode ? niveauPeutAvoirEnfants(niveaux, periode.niveauId) : false;

    if (isLoading) return <PageSkeleton showHeader />;

    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;

    if (!periode) return <ErrorMessage message={t('periodeNonTrouvee')} />;

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                tone="dominant"
                showBreadcrumbs
                breadcrumbLabel={periode.nom}
                onBack={() => navigate({ to: '/periodes' } as any)}
                actions={
                    <>
                        <div className="sm:hidden">
                            <RowActions actions={[
                                ...(estOuverte ? [{
                                    key: 'modifier',
                                    label: t('actions.modifier'),
                                    icon: Edit,
                                    onClick: () => setModalFormOpen(true),
                                    variant: 'primary' as const,
                                }] : []),
                                ...(estOuverte ? [{
                                    key: 'cloturer',
                                    label: t('actions.cloturer'),
                                    icon: Lock,
                                    onClick: () => setModalClotureOpen(true),
                                    variant: 'warning' as const,
                                    disabled: cloturer.isPending,
                                }] : []),
                                ...(estCloturee ? [{
                                    key: 'reouvrir',
                                    label: t('actions.reouvrir'),
                                    icon: Unlock,
                                    onClick: () => setConfirmAction('reouvrir'),
                                    variant: 'info' as const,
                                    disabled: reouvrir.isPending,
                                }] : []),
                                ...(estOuverte ? [{
                                    key: 'supprimer',
                                    label: t('actions.supprimer'),
                                    icon: Trash2,
                                    onClick: () => setConfirmAction('supprimer'),
                                    variant: 'danger' as const,
                                    disabled: supprimer.isPending,
                                }] : []),
                            ]} />
                        </div>

                        <div className="hidden sm:flex items-center gap-2 flex-wrap">
                            {estOuverte && (
                                <ElisaButton
                                    variant="outline"
                                    size="sm"
                                    icon={<Edit className="h-4 w-4" />}
                                    onClick={() => setModalFormOpen(true)}
                                >
                                    {t('actions.modifier')}
                                </ElisaButton>
                            )}
                            {estOuverte && (
                                <ElisaButton
                                    variant="outline"
                                    size="sm"
                                    icon={<Lock className="h-4 w-4" />}
                                    isLoading={cloturer.isPending}
                                    onClick={() => setModalClotureOpen(true)}
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
                                    onClick={() => setConfirmAction('reouvrir')}
                                >
                                    {t('actions.reouvrir')}
                                </ElisaButton>
                            )}
                            {estOuverte && (
                                <ElisaButton
                                    variant="danger"
                                    size="sm"
                                    icon={<Trash2 className="h-4 w-4" />}
                                    isLoading={supprimer.isPending}
                                    onClick={() => setConfirmAction('supprimer')}
                                >
                                    {t('actions.supprimer')}
                                </ElisaButton>
                            )}
                        </div>
                    </>
                }
            >
                <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl shrink-0 p-[clamp(0.75rem,2.5vw,1rem)]">
                        <CalendarRange className="h-[clamp(1.75rem,6vw,2.5rem)] w-[clamp(1.75rem,6vw,2.5rem)] text-white" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <h1 className="text-[clamp(1.5rem,4.5vw,3.5rem)] font-bold text-white leading-tight">{periode.nom}</h1>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <StatutBadge
                                statut={periode.statut}
                                label={t(`statut.${periode.statut}`)}
                                icon={
                                    periode.statut === StatutPeriode.OUVERTE ? <CheckCircle2 className="h-3.5 w-3.5" />
                                    : periode.statut === StatutPeriode.CLOTUREE ? <Lock className="h-3.5 w-3.5" />
                                    : <Timer className="h-3.5 w-3.5" />
                                }
                            />
                            {periode.niveau?.label && (
                                <span className="rounded-full border px-[clamp(0.375rem,1vw,0.625rem)] py-[clamp(0.125rem,0.5vw,0.25rem)] text-[clamp(0.75rem,1.25vw,0.875rem)] font-medium bg-white/10 text-white/80 border-white/20">
                                    {periode.niveau.label}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-white/70 text-[clamp(0.75rem,2vw,0.9375rem)]">
                            <span>{t('carte.dureeJours', { count: dureeJours })}</span>
                            {periode.anneeScolaire && (
                                <>
                                    <span>•</span>
                                    <span className="font-medium">{periode.anneeScolaire.libelle}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Cartes résumé */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--gap-sm)]">
                {[
                    { label: t('carte.debut'), value: formatDateFr(periode.dateDebut), icon: CalendarRange },
                    { label: t('carte.fin'), value: formatDateFr(periode.dateFin), icon: CalendarRange },
                    { label: t('carte.duree'), value: t('carte.dureeJours', { count: dureeJours }), icon: Clock },
                    { label: t('carte.progression'), value: `${progression}%`, icon: Timer },
                ].map((carte, i) => {
                    const Icon = carte.icon;
                    return (
                        <Card key={carte.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (i + 1) }}>
                            <CardContent className="p-[var(--space-md)]">
                                <div className="flex items-center gap-[var(--gap-xs)] mb-[var(--space-xxs)]">
                                    <Icon className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-tertiary)]" />
                                    <span className="text-[clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)] text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                                        {carte.label}
                                    </span>
                                </div>
                                <p className="font-semibold text-[var(--color-text-primary)] text-[clamp(0.875rem, 0.8rem + 0.3vw, 1.0625rem)]">
                                    {carte.value}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Barre de progression */}
            {estOuverte && progression > 0 && progression < 100 && (
                <Card>
                    <CardContent className="p-[var(--space-md)]">
                        <div className="flex items-center justify-between mb-[var(--space-xs)]">
                            <span className="flex items-center gap-[var(--gap-xs)] text-[var(--color-text-secondary)] text-[clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)]">
                                <Timer className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                {t('carte.progression')}
                            </span>
                            <span className="font-semibold text-[var(--color-dominant-700)] text-[clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)]">
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
                    </CardContent>
                </Card>
            )}

            {/* Onglets */}
            <div className="border-b border-[var(--color-bordure)]">
                <nav className="flex">
                    {onglets.map((onglet) => {
                        const Icon = onglet.icon;
                        const estActif = ongletActif === onglet.id;
                        return (
                            <button
                                key={onglet.id}
                                onClick={() => setOngletActif(onglet.id)}
                                className="flex-1 flex items-center justify-center gap-[var(--gap-xs)] py-[var(--space-sm)] px-[var(--space-xs)] border-b-2 font-medium transition-colors"
                                style={{
                                    fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)',
                                    borderColor: estActif ? 'var(--color-dominant-600)' : 'transparent',
                                    color: estActif ? 'var(--color-dominant-700)' : 'var(--color-text-secondary)',
                                }}
                                title={onglet.label}
                            >
                                <Icon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                <span className="hidden sm:inline">{onglet.id === 'donnees' ? t('detail.donneesLiees') : onglet.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Contenu onglets */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={ongletActif}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                >
                    {ongletActif === 'informations' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-md)]">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                        {t('detail.informationsGenerales')}
                                    </CardTitle>
                                </CardHeader>
                                <div className="border-b border-[var(--color-bordure)] mx-4 sm:mx-5" />
                                <CardContent>
                                    <div className="space-y-4">
                                        <InfoField label={t('nom')} value={periode.nom} />
                                        <InfoField label={t('niveau')} value={periode.niveau?.label || '-'} />
                                        <InfoField
                                            label={t('detail.statut')}
                                            value={
                                                <StatutBadge
                                                    statut={periode.statut}
                                                    label={t(`statut.${periode.statut}`)}
                                                    icon={
                                                        periode.statut === StatutPeriode.OUVERTE ? <CheckCircle2 className="h-3.5 w-3.5" />
                                                        : periode.statut === StatutPeriode.CLOTUREE ? <Lock className="h-3.5 w-3.5" />
                                                        : <Timer className="h-3.5 w-3.5" />
                                                    }
                                                />
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                        {t('detail.periode')}
                                    </CardTitle>
                                </CardHeader>
                                <div className="border-b border-[var(--color-bordure)] mx-4 sm:mx-5" />
                                <CardContent>
                                    <div className="space-y-4">
                                        <InfoField label={t('detail.dateDebut')} value={formatDateFr(periode.dateDebut)} />
                                        <InfoField label={t('detail.dateFin')} value={formatDateFr(periode.dateFin)} />
                                        <InfoField label={t('detail.dureeTotale')} value={t('carte.dureeJours', { count: dureeJours })} />
                                        <InfoField label={t('detail.anneeScolaire')} value={periode.anneeScolaire?.libelle || '-'} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-[var(--color-text-tertiary)]" />
                                        {t('detail.metadonnees')}
                                    </CardTitle>
                                </CardHeader>
                                <div className="border-b border-[var(--color-bordure)] mx-4 sm:mx-5" />
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InfoField label={t('detail.id')} value={<span className="font-mono text-sm">{periode.id}</span>} />
                                        <InfoField label={t('detail.etablissement')} value={<span className="font-mono text-sm">{(periode.etablissementId?.substring(0, 8) || '—') + '...'}</span>} />
                                        <InfoField label={t('detail.creeeLe')} value={new Date(periode.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
                                        <InfoField label={t('detail.modifieeLe')} value={new Date(periode.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {ongletActif === 'structure' && (
                        <div className="space-y-[var(--gap-md)]">
                            <div className="flex items-center justify-between flex-wrap gap-[var(--gap-sm)]">
                                <div>
                                    <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-[var(--gap-xs)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                                        <Network className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominant-600)]" />
                                        {t('detail.structure')}
                                    </h3>
                                    <p className="text-[var(--color-text-secondary)] mt-1" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                        {peutAvoirEnfants
                                            ? `${compositionsEnfants.length} enfant(s) lié(s) à cette période`
                                            : `Ce niveau de période (${periode.niveau?.label}) ne peut pas avoir d'enfants`
                                        }
                                    </p>
                                </div>
                                {estOuverte && peutAvoirEnfants && hasPermission('periodes:compositions:edit') && (
                                    <ElisaButton
                                        variant="outline"
                                        size="sm"
                                        icon={<Network className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                        onClick={() => setModalCompositionsOpen(true)}
                                    >
                                        Gérer
                                    </ElisaButton>
                                )}
                            </div>

                            {!peutAvoirEnfants ? (
                                <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--padding-modal-body)' }}>
                                    <div className="flex items-center gap-[var(--gap-sm)] text-[var(--color-text-tertiary)]">
                                        <AlertCircle className="h-[var(--icon-md)] w-[var(--icon-md)] shrink-0" />
                                        <p style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                            Les périodes de niveau « {periode.niveau?.label} » sont toujours au niveau le plus bas de la hiérarchie.
                                        </p>
                                    </div>
                                </div>
                            ) : compositionsEnfants.length === 0 ? (
                                <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'var(--padding-modal-body)' }}>
                                    <div className="flex flex-col items-center gap-[var(--gap-sm)] py-4">
                                        <Network className="h-[var(--icon-xl)] w-[var(--icon-xl)] text-[var(--color-text-tertiary)]" />
                                        <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                            Aucun enfant lié à cette période
                                        </p>
                                        {estOuverte && hasPermission('periodes:compositions:edit') && (
                                            <ElisaButton
                                                variant="outline"
                                                size="sm"
                                                icon={<Network className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                                                onClick={() => setModalCompositionsOpen(true)}
                                            >
                                                Ajouter des enfants
                                            </ElisaButton>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="hidden sm:block rounded-[var(--radius-lg)] border border-[var(--color-bordure)] overflow-hidden">
                                        <div className="grid grid-cols-[1fr_80px_100px_100px_60px] gap-[var(--gap-sm)] items-center px-[var(--space-md)] py-[var(--space-sm)] bg-[var(--color-surface-alt)] border-b border-[var(--color-bordure)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                            <span>Nom</span>
                                            <span>Type</span>
                                            <span>Période</span>
                                            <span>Progression</span>
                                            <span className="text-right">Ordre</span>
                                        </div>
                                        <div className="divide-y divide-[var(--color-bordure)]">
                                            {compositionsEnfants
                                                .sort((a, b) => a.ordre - b.ordre)
                                                .map((comp) => {
                                                    const enfant = comp.periodeEnfant;
                                                    if (!enfant) return null;
                                                    const progPct = calculeProgression(enfant.dateDebut, enfant.dateFin);
                                                    const noteCount = progressionEnfants.find(p => p.id === enfant.id)?.noteCount ?? 0;
                                                    return (
                                                        <div key={comp.id} className="grid grid-cols-[1fr_80px_100px_100px_60px] gap-[var(--gap-sm)] items-center px-[var(--space-md)] py-[var(--space-sm)] hover:bg-[var(--color-surface-alt)]/50 transition-colors">
                                                            <div className="flex items-center gap-[var(--gap-xs)] min-w-0">
                                                                <CalendarRange className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-muted)] shrink-0" />
                                                                <TextLabel size="sm" weight="semibold">{enfant.nom}</TextLabel>
                                                            </div>
                                                            <span className="rounded-full border px-1.5 py-0.5 text-xs font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-bordure)] text-center">
                                                                {enfant.niveau?.label}
                                                            </span>
                                                            <div style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.8125rem)' }}>
                                                                <p className="text-[var(--color-text-primary)]">{new Date(enfant.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                                                                <p className="text-xs text-[var(--color-text-muted)]">→ {new Date(enfant.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                                                            </div>
                                                            <div className="flex flex-col gap-1 min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                                                                        <div
                                                                            className="h-full rounded-full transition-all duration-500"
                                                                            style={{
                                                                                width: `${progPct}%`,
                                                                                background: progPct >= 100 ? 'var(--color-success)' : 'var(--color-dominant-500)',
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-medium text-[var(--color-text-tertiary)] tabular-nums w-7 text-right">
                                                                        {progPct}%
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-[var(--color-text-muted)]">
                                                                    {noteCount} note{noteCount !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                            <span className="text-right text-sm font-medium text-[var(--color-text-secondary)]">
                                                                {comp.ordre}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>

                                    <div className="flex sm:hidden flex-col gap-[var(--gap-sm)]">
                                        {compositionsEnfants
                                            .sort((a, b) => a.ordre - b.ordre)
                                            .map((comp) => {
                                                const enfant = comp.periodeEnfant;
                                                if (!enfant) return null;
                                                const progPct = calculeProgression(enfant.dateDebut, enfant.dateFin);
                                                const noteCount = progressionEnfants.find(p => p.id === enfant.id)?.noteCount ?? 0;
                                                return (
                                                    <div key={comp.id} className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]" style={{ padding: 'clamp(0.75rem, 0.6rem + 0.4vw, 1rem)' }}>
                                                        <div className="flex items-center justify-between mb-[var(--space-xs)]">
                                                            <div className="flex items-center gap-[var(--gap-xs)] min-w-0">
                                                                <CalendarRange className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-muted)] shrink-0" />
<TextLabel size="md" weight="semibold">{enfant.nom}</TextLabel>
                                                            </div>
                                                            <span className="text-xs font-medium text-[var(--color-text-tertiary)]">#{comp.ordre}</span>
                                                        </div>
                                                        <div className="flex items-center gap-[var(--gap-md)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                                            <span className="rounded-full border px-1.5 py-0.5 text-xs font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border-[var(--color-bordure)]">
                                                                {enfant.niveau?.label}
                                                            </span>
                                                            <span className="text-[var(--color-text-secondary)]">
                                                                {new Date(enfant.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                                {' → '}
                                                                {new Date(enfant.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <div className="flex items-center gap-1.5 flex-1">
                                                                <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full transition-all duration-500"
                                                                        style={{
                                                                            width: `${progPct}%`,
                                                                            background: progPct >= 100 ? 'var(--color-success)' : 'var(--color-dominant-500)',
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-medium text-[var(--color-text-tertiary)] tabular-nums">{progPct}%</span>
                                                            </div>
                                                            <span className="text-xs text-[var(--color-text-muted)]">{noteCount} note{noteCount !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {ongletActif === 'donnees' && (
                        <div className="space-y-[var(--gap-md)]">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--gap-sm)]">
                                <Card>
                                    <CardContent className="p-[var(--space-md)]">
                                        <div className="flex items-center gap-[var(--gap-xs)] mb-[var(--space-xxs)]">
                                            <CheckCircle2 className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-dominant-600)]" />
                                            <span className="text-[clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)] text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                                                {t('detail.notesLiees')}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-[var(--color-text-primary)] text-[clamp(1rem, 0.9rem + 0.4vw, 1.25rem)]">—</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-[var(--space-md)]">
                                        <div className="flex items-center gap-[var(--gap-xs)] mb-[var(--space-xxs)]">
                                            <FileText className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-secondary-600)]" />
                                            <span className="text-[clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)] text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                                                {t('detail.bulletinsLiees')}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-[var(--color-text-primary)] text-[clamp(1rem, 0.9rem + 0.4vw, 1.25rem)]">—</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-[var(--space-md)]">
                                        <div className="flex items-center gap-[var(--gap-xs)] mb-[var(--space-xxs)]">
                                            {estCloturee ? (
                                                <Lock className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-error-600)]" />
                                            ) : (
                                                <Unlock className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-tertiary)]" />
                                            )}
                                            <span className="text-[clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)] text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                                                {t('detail.verrouillage')}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-[var(--color-text-primary)] text-[clamp(1rem, 0.9rem + 0.4vw, 1.25rem)]">
                                            {estCloturee ? t('detail.actif') : t('detail.inactif')}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardContent className="p-[var(--padding-modal-body)]">
                                    <div className="flex items-start gap-[var(--gap-md)]">
                                        <BarChart3 className="h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-text-tertiary)] shrink-0 mt-[var(--space-xs)]" />
                                        <div>
                                            <h3 className="font-semibold text-[var(--color-text-primary)] mb-[var(--space-xs)]" style={{ fontSize: 'clamp(0.9375rem, 0.85rem + 0.3vw, 1.0625rem)' }}>
                                                {t('detail.donneesLieesDescription')}
                                            </h3>
                                            <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                                {estCloturee
                                                    ? t('detail.descriptionCloturee')
                                                    : t('detail.descriptionNonCloturee')
                                                }
                                            </p>
                                            {estCloturee && (
                                                <div className="flex items-center gap-[var(--gap-xs)] mt-[var(--space-md)] text-[var(--color-error-600)]">
                                                    <Lock className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                                    <span className="text-[clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)] font-medium">
                                                        {t('detail.verrouillageActif')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </motion.div>

                {ongletActif === 'validation' && peutValider && (
                    <motion.div
                        key="validation"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card>
                            <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                                <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                    <ShieldCheck className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
                                    {t('detail.validation')}
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
                                            module="periodes"
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
                    <motion.div
                        key="historique"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card>
                            <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                                <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                    <History className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
                                    {t('detail.historique')}
                                </h3>
                                <div className="border-b border-border mb-4" />
                                <AuditTimeline cible="Periode" cibleId={id} module="periodes" />
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <ModalFormPeriode
                periode={periode}
                isOpen={modalFormOpen}
                onClose={() => setModalFormOpen(false)}
                onSuccess={() => setModalFormOpen(false)}
            />

            <ModalCloturePeriode
                periode={periode}
                isOpen={modalClotureOpen}
                onClose={() => setModalClotureOpen(false)}
                onClotureSuccess={() => setModalClotureOpen(false)}
            />

            <ModalGestionCompositions
                periode={periode}
                isOpen={modalCompositionsOpen}
                onClose={() => setModalCompositionsOpen(false)}
                onSuccess={() => setModalCompositionsOpen(false)}
            />

            <ConfirmDialog
                open={confirmAction === 'reouvrir'}
                onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
                onConfirm={async () => {
                    try {
                        await reouvrir.mutateAsync({ id: periode.id, motif: 'Réouverture manuelle depuis le détail' });
                        setConfirmAction(null);
                    } catch (e) {}
                }}
                title={t('confirmerReouvrirTitre')}
                description={`${t('confirmerReouvrirMessage', { nom: periode.nom })}\n${t('confirmerReouvrirDetail')}`}
                confirmText={t('actions.reouvrir')}
                variant="warning"
                isLoading={reouvrir.isPending}
            />

            <ConfirmDialog
                open={confirmAction === 'supprimer'}
                onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
                onConfirm={async () => {
                    try {
                        await supprimer.mutateAsync(periode.id);
                        setConfirmAction(null);
                        navigate({ to: '/periodes' } as any);
                    } catch (e) {}
                }}
                title={t('confirmerSupprimerTitre')}
                description={`${t('confirmerSupprimerMessage', { nom: periode.nom })}\n${t('confirmerSupprimerDetail')}`}
                confirmText={t('actions.supprimer')}
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
