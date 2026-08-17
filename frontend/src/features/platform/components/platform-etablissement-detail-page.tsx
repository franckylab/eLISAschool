/**
 * ==================================
 * eLISAschool - Platform Etablissement Detail Page (Shell)
 * ==================================
 * Version: 2.0.0 — Decompose en 7 onglets extraits
 * Auteur: franck arlos chendjou
 *
 * Shell principal : header, KPI, navigation onglets, actions.
 * Les 7 onglets sont dans ./etablissement-detail/
 */

import { useCallback, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import {
    Building2, Activity, Settings, Heart,
    Users, GraduationCap, BookOpen,
    Pause, Play, ExternalLink, RefreshCw, Edit,
    CreditCard, DollarSign,
    MoreHorizontal, ChevronLeft, ChevronRight,
    Download, FileText, ScrollText,
    Shield, Globe, BarChart3,
    Upload, Trash2, CheckCircle2,
} from 'lucide-react';
import {
    useEtablissementDetail,
    useDesactiverEtablissement,
    useActiverEtablissement,
    useUploadLogo,
    useSupprimerLogo,
    useChangerPlan,
    useRecalculerSante,
} from '../hooks/use-etablissement-detail';
import { SanteEtablissement } from '@/features/platform/components/sante-etablissement';
import { EtablissementFormModal } from './etablissement-form-modal';
import type { AuditLogEntry } from '@/features/etablissements/types/etablissement.types';
import {
    TYPE_LABELS,
    SOUS_SYSTEME_LABELS,
    STATUT_CONFIG,
    PLAN_LABELS,
} from '@/features/etablissements/types/etablissement.types';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent } from '@/components/ui';
import { BreadcrumbLabelProvider } from '@/components/navigation/breadcrumb-context';
import { toast } from 'sonner';
import type { Tab } from '@/components/ui';
// Onglets extraits
import {
    IdentiteTab, SanteTab, ActiviteTab, ConfigurationTab,
    FinancesTab, UtilisateursTab, JournalTab,
    ActionButton, TabSkeleton, getScoreColor,
} from './etablissement-detail';

type Onglet = 'identite' | 'sante' | 'activite' | 'configuration' | 'finances' | 'utilisateurs' | 'journal';

// =============================================
// Composant principal
// =============================================

export function PlatformEtablissementDetailPage() {
    const { id } = useParams({ from: '/platform/etablissements/$id' });
    const navigate = useNavigate();
    const search = useSearch({ from: '/platform/etablissements/$id' });
    const { t } = useTranslation('admin');

    const ongletActif = ((search as any)?.tab as Onglet) || 'identite';
    const setOngletActif = (tab: Onglet) => navigate({
        to: '/platform/etablissements/$id',
        params: { id },
        search: { tab } as any,
    });

    const {
        etablissement, stats, sante, config, configComplete, activite, utilisateurs, factures, connexions, audit,
        historiqueSante, evolutionPaiements,
        isLoading, error, refetchAll,
    } = useEtablissementDetail(id);

    const desactiver = useDesactiverEtablissement();
    const activer = useActiverEtablissement();
    const uploadLogo = useUploadLogo();
    const supprimerLogo = useSupprimerLogo();
    const changerPlan = useChangerPlan();
    const recalculerSante = useRecalculerSante();
    const confirm = useConfirmation();

    // Navigation entre établissements — récupérer la liste des IDs
    const { data: navigationIds } = useQuery<string[]>({
        queryKey: ['platform-etablissements-navigation-ids'],
        queryFn: async () => {
            const res = await apiClient.get<{ id: string }[]>('/api/platform/etablissements', { limit: '500', sortBy: 'nom', sortOrder: 'ASC' });
            const rawData = res.data;
            if (Array.isArray(rawData)) return rawData.map((e) => e.id);
            return [];
        },
        staleTime: 5 * 60_000,
    });

    // Établis précédent/suivant pour navigation
    const { prevId, nextId } = useMemo(() => {
        if (!navigationIds || navigationIds.length === 0) return { prevId: null, nextId: null };
        const idx = navigationIds.indexOf(id);
        return {
            prevId: idx > 0 ? navigationIds[idx - 1] : null,
            nextId: idx < navigationIds.length - 1 ? navigationIds[idx + 1] : null,
        };
    }, [navigationIds, id]);
    const [modalEditOpen, setModalEditOpen] = useState(false);
    const [planMenuOpen, setPlanMenuOpen] = useState(false);
    const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const planMenuRef = useRef<HTMLDivElement>(null);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

    const displayName = etablissement?.nom || '';

    const onglets: Tab[] = useMemo(() => [
        { id: 'identite', label: t('etablissements.detail.tabIdentite', 'Identité'), icon: Building2 },
        { id: 'sante', label: t('etablissements.detail.tabSante', 'Santé'), icon: Heart },
        { id: 'activite', label: t('etablissements.detail.tabActivite', 'Activité'), icon: Activity },
        { id: 'configuration', label: t('etablissements.detail.tabConfig', 'Configuration'), icon: Settings },
        { id: 'finances', label: t('etablissements.detail.tabFinances', 'Finances'), icon: DollarSign },
        { id: 'utilisateurs', label: t('etablissements.detail.tabUtilisateurs', 'Utilisateurs'), icon: Users },
        { id: 'journal', label: t('etablissements.detail.tabJournal', 'Journal'), icon: ScrollText },
    ], [t]);

    const estActif = etablissement?.statut === 'ACTIF';

    // Handlers actions
    const handleToggleStatut = useCallback(() => {
        if (!etablissement) return;
        confirm.ask({
            title: estActif
                ? t('etablissements.detail.desactiverTitre', 'Désactiver cet établissement')
                : t('etablissements.detail.activerTitre', 'Réactiver cet établissement'),
            message: etablissement.nom,
            details: estActif
                ? t('etablissements.detail.desactiverDetails', 'Les utilisateurs ne pourront plus accéder à la plateforme.')
                : t('etablissements.detail.activerDetails', 'L\'établissement pourra à nouveau accéder à la plateforme.'),
            variant: estActif ? 'danger' : 'info',
            onConfirm: async () => {
                if (estActif) {
                    await desactiver.mutateAsync(etablissement.id);
                } else {
                    await activer.mutateAsync(etablissement.id);
                }
            },
        });
    }, [etablissement, estActif, confirm, desactiver, activer, t]);

    const handleAccederTenant = useCallback(() => {
        if (!etablissement) return;
        // Ouvrir le tenant dans un nouvel onglet (lien direct vers le dashboard)
        window.open(`/?etablissement=${etablissement.id}`, '_blank');
    }, [etablissement]);

    const handleChangerPlan = useCallback((plan: 'gratuit' | 'standard' | 'premium' | 'entreprise') => {
        if (!etablissement) return;
        setPlanMenuOpen(false);
        confirm.ask({
            title: t('etablissements.detail.changerPlanTitre', 'Changer de plan'),
            message: etablissement.nom,
            details: t('etablissements.detail.changerPlanDetails', `Passer au plan {{plan}} ? Les quotas seront ajustés automatiquement.`, { plan: PLAN_LABELS[plan] || plan }),
            variant: 'info',
            onConfirm: async () => {
                await changerPlan.mutateAsync({ id: etablissement.id, plan });
            },
        });
    }, [etablissement, changerPlan, confirm, t]);

    // Handler export CSV audit
    const handleExportAuditCSV = useCallback(() => {
        if (!audit?.data?.length) return;
        setActionsMenuOpen(false);
        const headers = ['Date', 'Action', 'Sévérité', 'Module', 'Utilisateur', 'Rôle', 'Description', 'Cible', 'IP', 'Échec'];
        const rows = audit.data.map((l: AuditLogEntry) => [
            new Date(l.createdAt).toLocaleString('fr-FR'),
            l.action?.replace(/_/g, ' ') || '',
            l.severity,
            l.module || '',
            l.utilisateur ? `${l.utilisateur.prenom || ''} ${l.utilisateur.nom || ''}`.trim() || l.utilisateur.email || '' : '',
            l.utilisateur?.role || '',
            l.description || '',
            l.cible || '',
            l.ipAddress || '',
            l.estEchec ? 'Oui' : 'Non',
        ]);
        const csv = [headers, ...rows].map((r: (string | number)[]) => r.map((c: string | number) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal-audit-${etablissement?.nom || 'etablissement'}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`${audit.data.length} lignes exportées`);
    }, [audit, etablissement]);

    // Export fiche complète établissement (CSV)
    const handleExportFicheCSV = useCallback(() => {
        if (!etablissement) return;
        setActionsMenuOpen(false);
        const sections = [
            ['=== IDENTITÉ ==='],
            ['Nom', etablissement.nom || ''],
            ['Code', etablissement.codeEtablissement || ''],
            ['Type', TYPE_LABELS[etablissement.type] || etablissement.type || ''],
            ['Statut', STATUT_CONFIG[etablissement.statut || '']?.label || etablissement.statut || ''],
            ['Ville', etablissement.ville || ''],
            ['Téléphone', etablissement.contactTelephone || ''],
            ['Email', etablissement.contactEmail || ''],
            ['Adresse', etablissement.adresse || ''],
            ['Directeur', etablissement.directeurNom || ''],
            ['Dir. adjoint', etablissement.directeurAdjointNom || ''],
            ['Censeur', etablissement.censeurNom || ''],
            ['Surveillant général', etablissement.surveillantGeneralNom || ''],
            ['Langue', etablissement.langueDefaut || ''],
            ['Devise', etablissement.devise || ''],
            ['Fuseau horaire', etablissement.fuseauHoraire || ''],
            ['Créé le', etablissement.createdAt ? new Date(etablissement.createdAt).toLocaleDateString('fr-FR') : ''],
            [''],
            ['=== SANTÉ ==='],
            ['Score', sante ? `${sante.score}/100` : ''],
            ['Catégorie', sante?.categorie || ''],
            ['Score abonnement', sante?.details?.abonnement ? `${Math.round(sante.details.abonnement.score)}/100` : ''],
            ['Score paiements', sante?.details?.paiements ? `${Math.round(sante.details.paiements.score)}/100` : ''],
            ['Score activité', sante?.details?.activite ? `${Math.round(sante.details.activite.score)}/100` : ''],
            ['Score modules', sante?.details?.modules ? `${Math.round(sante.details.modules.score)}/100` : ''],
            [''],
            ['=== STATISTIQUES ==='],
            ['Élèves', stats?.nombreEleves?.toString() || ''],
            ['Classes', stats?.nombreClasses?.toString() || ''],
            ['Personnel', stats?.nombrePersonnel?.toString() || ''],
            ['Taux occupation', stats?.tauxOccupation !== undefined ? `${stats.tauxOccupation}%` : ''],
            [''],
            ['=== CONFIGURATION ==='],
            ['Plan', config?.planAbonnement ? (PLAN_LABELS[config.planAbonnement] || config.planAbonnement) : ''],
            ['Expiration', config?.dateExpirationAbonnement ? new Date(config.dateExpirationAbonnement).toLocaleDateString('fr-FR') : ''],
        ];
        const csv = sections.map(([key, val]) => val !== undefined ? `"${key.replace(/"/g, '""')}";"${String(val).replace(/"/g, '""')}"` : `"`).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fiche-${etablissement.nom || 'etablissement'}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Fiche établissement exportée');
    }, [etablissement, sante, stats, config]);

    // Handlers logo
    const handleLogoClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleLogoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !etablissement) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Le logo ne doit pas dépasser 5 Mo');
            return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            await uploadLogo.mutateAsync({ id: etablissement.id, logoBase64: base64 });
        };
        reader.readAsDataURL(file);
        // Reset input
        e.target.value = '';
    }, [etablissement, uploadLogo]);

    const handleSupprimerLogo = useCallback(async () => {
        if (!etablissement) return;
        confirm.ask({
            title: 'Supprimer le logo',
            message: 'Voulez-vous vraiment supprimer le logo de cet établissement ?',
            variant: 'danger',
            onConfirm: async () => {
                await supprimerLogo.mutateAsync(etablissement.id);
            },
        });
    }, [etablissement, supprimerLogo, confirm]);

    // Loading / Error states
    if (isLoading && !etablissement) {
        return <PageSkeleton showHeader />;
    }

    if (error || !etablissement) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('etablissements.detail.introuvable', 'Établissement introuvable')}
                    message={(error as Error)?.message || t('etablissements.detail.impossibleCharger', 'Impossible de charger les détails')}
                    onRetry={() => refetchAll()}
                    retryLabel={t('common.actions.reessayer', 'Réessayer')}
                />
            </div>
        );
    }

    const statutCfg = STATUT_CONFIG[etablissement.statut] || STATUT_CONFIG.INACTIF;

    return (
        <BreadcrumbLabelProvider value={displayName}>
        <div className="flex flex-col gap-[var(--gap-lg)] p-[clamp(0.75rem,0.6rem+0.5vw,1.5rem)]">
            {/* Header avec gradient */}
            <PageHeader
                variant="gradient"
                tone="dominant"
                showBreadcrumbs
                breadcrumbLabel={displayName}
                onBack={() => navigate({ to: '/platform/etablissements' })}
            >
                <div className="flex items-start gap-[var(--gap-sm)] sm:gap-[var(--gap-md)]">
                    {/* Avatar établissement avec upload logo */}
                    <div className="relative group">
                        <div className="h-[clamp(2.5rem,8vw,6rem)] w-[clamp(2.5rem,8vw,6rem)] rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-[clamp(0.875rem,3vw,2rem)] font-bold text-white shadow-md shrink-0 overflow-hidden">
                            {etablissement.logoBase64 ? (
                                <img
                                    src={etablissement.logoBase64}
                                    alt={etablissement.nom}
                                    className="h-full w-full object-cover rounded-xl"
                                />
                            ) : (
                                <Building2 className="h-[clamp(1.25rem,4vw,2.5rem)] w-[clamp(1.25rem,4vw,2.5rem)]" />
                            )}
                        </div>
                        {/* Overlay hover avec actions logo */}
                        <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button
                                onClick={handleLogoClick}
                                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                title="Uploader un logo"
                            >
                                <Upload className="h-3.5 w-3.5 text-white" />
                            </button>
                            {etablissement.logoBase64 && (
                                <button
                                    onClick={handleSupprimerLogo}
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-red-500/50 transition-colors"
                                    title="Supprimer le logo"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-white" />
                                </button>
                            )}
                        </div>
                        {/* Input file caché */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                            className="hidden"
                            onChange={handleLogoChange}
                        />
                    </div>
                    <div className="space-y-[var(--space-xs)]">
                        <h1 className="text-[clamp(1.25rem,4vw,2.5rem)] font-bold text-white leading-tight">
                            {displayName}
                        </h1>
                        {etablissement.slogan && (
                            <p className="text-[clamp(0.6875rem,1.8vw,0.9375rem)] text-white/70 italic">
                                {etablissement.slogan}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-[var(--gap-xs)] pt-1">
                            {/* Badge statut */}
                            <span className={`inline-flex items-center gap-[var(--gap-xxs)] rounded-full px-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] py-[clamp(0.125rem,0.1rem+0.1vw,0.25rem)] ${statutCfg.bg} ${statutCfg.text}`}>
                                <span className={`w-[clamp(0.375rem,0.3rem+0.15vw,0.5rem)] h-[clamp(0.375rem,0.3rem+0.15vw,0.5rem)] rounded-full ${statutCfg.dot}`} />
                                <span style={{ fontSize: 'clamp(0.65rem,1.4vw,0.8rem)' }}>{statutCfg.label}</span>
                            </span>
                            {/* Badge type */}
                            <span className="inline-flex items-center gap-[var(--gap-xxs)] rounded-full bg-white/15 px-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] py-[clamp(0.125rem,0.1rem+0.1vw,0.25rem)] text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium text-white/80">
                                <Shield className="h-[clamp(0.625rem,1vw,0.75rem)] w-[clamp(0.625rem,1vw,0.75rem)]" />
                                {TYPE_LABELS[etablissement.type] || etablissement.type}
                            </span>
                            {/* Badge système */}
                            <span className="inline-flex items-center gap-[var(--gap-xxs)] rounded-full bg-white/15 px-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] py-[clamp(0.125rem,0.1rem+0.1vw,0.25rem)] text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium text-white/80">
                                <Globe className="h-[clamp(0.625rem,1vw,0.75rem)] w-[clamp(0.625rem,1vw,0.75rem)]" />
                                {SOUS_SYSTEME_LABELS[etablissement.sousSysteme] || etablissement.sousSysteme}
                            </span>
                            {/* Badge santé */}
                            {sante && (
                                <SanteEtablissement
                                    variant="badge"
                                    score={sante.score}
                                    categorie={sante.categorie}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </PageHeader>

            {/* Barre d'actions rapides */}
            <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                <ActionButton
                    icon={Edit}
                    label={t('common.actions.modifier', 'Modifier')}
                    onClick={() => setModalEditOpen(true)}
                />
                <ActionButton
                    icon={estActif ? Pause : Play}
                    label={estActif
                        ? t('etablissements.detail.suspendre', 'Suspendre')
                        : t('etablissements.detail.reactiver', 'Réactiver')}
                    onClick={handleToggleStatut}
                    variant={estActif ? 'danger' : 'success'}
                    loading={desactiver.isPending || activer.isPending}
                />
                {/* Dropdown changement de plan */}
                <div className="relative" ref={planMenuRef}>
                    <ActionButton
                        icon={CreditCard}
                        label={`${t('etablissements.detail.planActuel', 'Plan')}: ${PLAN_LABELS[config?.planAbonnement || 'gratuit'] || '—'}`}
                        onClick={() => setPlanMenuOpen(!planMenuOpen)}
                    />
                    {planMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setPlanMenuOpen(false)} />
                            <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border shadow-lg"
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderColor: 'var(--color-bordure)',
                                }}>
                                {(['gratuit', 'standard', 'premium', 'entreprise'] as const).map((p) => {
                                    const planColors: Record<string, string> = {
                                        gratuit: 'bg-gray-100 text-gray-700',
                                        standard: 'bg-blue-100 text-blue-700',
                                        premium: 'bg-purple-100 text-purple-700',
                                        entreprise: 'bg-amber-100 text-amber-700',
                                    };
                                    const isCurrent = config?.planAbonnement === p;
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => handleChangerPlan(p)}
                                            disabled={isCurrent}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
                                            style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}
                                        >
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${planColors[p]}`}>
                                                {PLAN_LABELS[p] || p}
                                            </span>
                                            {isCurrent && <CheckCircle2 className="ml-auto h-3.5 w-3.5" style={{ color: 'var(--color-success-500)' }} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
                <ActionButton
                    icon={ExternalLink}
                    label={t('etablissements.detail.accederTenant', 'Accéder au tenant')}
                    onClick={handleAccederTenant}
                />
                {/* Dropdown Plus d'actions */}
                <div className="relative" ref={actionsMenuRef}>
                    <ActionButton
                        icon={MoreHorizontal}
                        label={t('common.actions.plus', 'Plus')}
                        onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                    />
                    {actionsMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setActionsMenuOpen(false)} />
                            <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border shadow-lg"
                                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-bordure)' }}>
                                <button
                                    onClick={handleExportFicheCSV}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface-alt)]"
                                    style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte)' }}
                                >
                                    <Download className="h-3.5 w-3.5" style={{ color: 'var(--color-dominant-600)' }} />
                                    {t('etablissements.detail.exporterFiche', 'Exporter fiche (CSV)')}
                                </button>
                                <div className="my-1" style={{ borderTop: '1px solid var(--color-bordure)' }} />
                                <button
                                    onClick={handleExportAuditCSV}
                                    disabled={!audit?.data?.length}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
                                    style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte)' }}
                                >
                                    <FileText className="h-3.5 w-3.5" style={{ color: 'var(--color-dominant-600)' }} />
                                    {t('etablissements.detail.exporterJournalCSV', 'Exporter journal (CSV)')}
                                </button>
                                <button
                                    onClick={() => { setActionsMenuOpen(false); setOngletActif('journal'); }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface-alt)]"
                                    style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte)' }}
                                >
                                    <ScrollText className="h-3.5 w-3.5" style={{ color: 'var(--color-dominant-600)' }} />
                                    {t('etablissements.detail.voirJournal', 'Voir le journal')}
                                </button>
                                <button
                                    onClick={() => { setActionsMenuOpen(false); setOngletActif('configuration'); }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface-alt)]"
                                    style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte)' }}
                                >
                                    <Settings className="h-3.5 w-3.5" style={{ color: 'var(--color-dominant-600)' }} />
                                    {t('etablissements.detail.voirConfiguration', 'Voir configuration')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
                <ActionButton
                    icon={RefreshCw}
                    label={t('common.actions.rafraichir', 'Rafraîchir')}
                    onClick={() => refetchAll()}
                />
                {/* Navigation précédent/suivant */}
                <div className="flex items-center gap-[var(--gap-xxs)] ml-auto">
                    <button
                        onClick={() => prevId && navigate({ to: '/platform/etablissements/$id', params: { id: prevId }, search: { tab: 'identite' } })}
                        disabled={!prevId}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition-colors disabled:opacity-30"
                        style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)', color: 'var(--color-texte-muted)' }}
                        title={t('etablissements.detail.precedent', 'Établissement précédent')}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">{t('etablissements.detail.precedent', 'Précédent')}</span>
                    </button>
                    <button
                        onClick={() => nextId && navigate({ to: '/platform/etablissements/$id', params: { id: nextId }, search: { tab: 'identite' } })}
                        disabled={!nextId}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition-colors disabled:opacity-30"
                        style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)', color: 'var(--color-texte-muted)' }}
                        title={t('etablissements.detail.suivant', 'Établissement suivant')}
                    >
                        <span className="hidden md:inline">{t('etablissements.detail.suivant', 'Suivant')}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Bandeau KPI compact — résumé rapide des métriques clés */}
            {(stats || sante) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-[var(--gap-xs)]">
                    {stats?.nombreEleves !== undefined && (
                        <div className="flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                            <GraduationCap className="h-[var(--icon-sm)] w-[var(--icon-sm)] shrink-0" style={{ color: 'var(--color-accent-600)' }} />
                            <div className="min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: 'var(--color-texte)' }}>{stats.nombreEleves.toLocaleString('fr-FR')}</p>
                                <p className="text-[0.625rem] truncate" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.kpi.eleves', 'Élèves')}</p>
                            </div>
                        </div>
                    )}
                    {stats?.nombreClasses !== undefined && (
                        <div className="flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                            <BookOpen className="h-[var(--icon-sm)] w-[var(--icon-sm)] shrink-0" style={{ color: 'var(--color-info-600)' }} />
                            <div className="min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: 'var(--color-texte)' }}>{stats.nombreClasses}</p>
                                <p className="text-[0.625rem] truncate" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.kpi.classes', 'Classes')}</p>
                            </div>
                        </div>
                    )}
                    {stats?.nombrePersonnel !== undefined && (
                        <div className="flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                            <Users className="h-[var(--icon-sm)] w-[var(--icon-sm)] shrink-0" style={{ color: 'var(--color-success-600)' }} />
                            <div className="min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: 'var(--color-texte)' }}>{stats.nombrePersonnel}</p>
                                <p className="text-[0.625rem] truncate" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.kpi.personnel', 'Personnel')}</p>
                            </div>
                        </div>
                    )}
                    {stats?.tauxOccupation !== undefined && (
                        <div className="flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                            <BarChart3 className="h-[var(--icon-sm)] w-[var(--icon-sm)] shrink-0" style={{ color: stats.tauxOccupation > 85 ? 'var(--color-danger-600)' : 'var(--color-warning-600)' }} />
                            <div className="min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: 'var(--color-texte)' }}>{stats.tauxOccupation}%</p>
                                <p className="text-[0.625rem] truncate" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.kpi.occupation', 'Occupation')}</p>
                            </div>
                        </div>
                    )}
                    {sante && (
                        <div className="flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                            <Heart className="h-[var(--icon-sm)] w-[var(--icon-sm)] shrink-0" style={{ color: getScoreColor(sante.score) }} />
                            <div className="min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: getScoreColor(sante.score) }}>{sante.score}/100</p>
                                <p className="text-[0.625rem] truncate" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.kpi.sante', 'Santé')}</p>
                            </div>
                        </div>
                    )}
                    {config?.planAbonnement && (
                        <div className="flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                            <CreditCard className="h-[var(--icon-sm)] w-[var(--icon-sm)] shrink-0" style={{ color: 'var(--color-dominant-600)' }} />
                            <div className="min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: 'var(--color-texte)' }}>{PLAN_LABELS[config.planAbonnement] || config.planAbonnement}</p>
                                <p className="text-[0.625rem] truncate" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.kpi.plan', 'Plan')}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Onglets */}
            <TabsBar
                tabs={onglets}
                activeTab={ongletActif}
                onTabChange={(tabId) => setOngletActif(tabId as Onglet)}
                variant="underline"
                showHeader
            />

            <TabsContent activeTab={ongletActif}>
                {ongletActif === 'identite' && (
                    <IdentiteTab etablissement={etablissement} utilisateurs={utilisateurs} connexions={connexions} />
                )}
                {ongletActif === 'sante' && (
                    sante ? <SanteTab sante={sante} etablissementId={id} recalculerSante={recalculerSante} historique={historiqueSante} /> : (
                        <TabSkeleton variant="sante" />
                    )
                )}
                {ongletActif === 'activite' && (
                    stats ? <ActiviteTab stats={stats} etablissement={etablissement} activite={activite} /> : (
                        <TabSkeleton variant="activite" />
                    )
                )}
                {ongletActif === 'configuration' && (
                    config ? <ConfigurationTab config={config} etablissement={etablissement} configComplete={configComplete} stats={stats} utilisateurs={utilisateurs} etablissementId={id} onRefetch={refetchAll} /> : (
                        <TabSkeleton variant="configuration" />
                    )
                )}
                {ongletActif === 'finances' && (
                    <FinancesTab factures={factures || []} config={config} activite={activite} evolutionPaiements={evolutionPaiements} />
                )}
                {ongletActif === 'utilisateurs' && (
                    utilisateurs ? <UtilisateursTab utilisateurs={utilisateurs} /> : (
                        <TabSkeleton variant="utilisateurs" />
                    )
                )}
                {ongletActif === 'journal' && (
                    <JournalTab etablissementId={id} />
                )}
            </TabsContent>

            {/* Modal édition */}
            <EtablissementFormModal
                open={modalEditOpen}
                onOpenChange={(open) => {
                    if (!open) setModalEditOpen(false);
                }}
                mode="edit"
                etablissement={etablissement}
            />

            {confirm.ConfirmationModal}
        </div>
        </BreadcrumbLabelProvider>
    );
}

export default PlatformEtablissementDetailPage;
