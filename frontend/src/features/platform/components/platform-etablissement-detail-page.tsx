/**
 * ==================================
 * eLISAschool - Platform Etablissement Detail Page
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Détail d'un établissement plateforme avec 4 onglets :
 * - Identité : profil, contact, direction, paramètres régionaux
 * - Santé : score composite 0-100 avec 4 critères détaillés
 * - Activité : effectifs, classes, personnel, taux occupation
 * - Configuration : cycles, bulletin, quotas, abonnement
 *
 * Ultra-responsif (100px → 2560px), dark mode, CSS variables.
 */

import { useCallback, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import {
    Building2, Activity, Settings, Heart,
    MapPin, Phone, Mail, Globe, Clock, Calendar,
    Users, GraduationCap, BookOpen, Layers,
    CheckCircle2, XCircle, AlertTriangle, Pause, Play,
    ExternalLink, RefreshCw, Edit, Shield,
    CreditCard, Package, TrendingUp, Hash,
    Facebook, Twitter, FileText, Banknote,
    UserCheck, UserX, ArrowUpRight, ArrowDownRight,
    DollarSign, Receipt, Percent, AlertCircle,
    UserCircle, LogIn, Upload, Trash2, BarChart3, Lightbulb,
    ScrollText, ShieldAlert, Info, MoreHorizontal,
    ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
    Download,
    type LucideIcon,
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
import { SanteEtablissement } from '@/features/admin/components/sante-etablissement';
import { EtablissementFormModal } from '@/features/admin/components/etablissement-form-modal';
import type { Etablissement, EtablissementDetailStats, EtablissementConfig, ConfigCompleteResult, ActiviteEtablissementResult, UtilisateursResumeResult, FactureEtablissement, HistoriqueConnexionsResult, AuditLogResponse } from '@/features/etablissements/types/etablissement.types';
import {
    TYPE_LABELS,
    SOUS_SYSTEME_LABELS,
    STATUT_CONFIG,
    PLAN_LABELS,
} from '@/features/etablissements/types/etablissement.types';
import type { SanteEtablissementResult, RecommandationSante } from '@/features/admin/components/sante-etablissement';
import type { HistoriqueScoreSante, EvolutionPaiementMois } from '@/features/etablissements/types/etablissement.types';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent } from '@/components/ui';
import { BreadcrumbLabelProvider } from '@/components/navigation/breadcrumb-context';
import { toast } from 'sonner';
import type { Tab } from '@/components/ui';

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
        const rows = audit.data.map((l) => [
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
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
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
                        <TabSkeleton variant="config" />
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

// =============================================
// Tab 1 — Identité & Contact
// =============================================

function IdentiteTab({ etablissement, utilisateurs, connexions }: { etablissement: Etablissement; utilisateurs?: UtilisateursResumeResult; connexions?: HistoriqueConnexionsResult }) {
    const { t } = useTranslation('admin');

    // Statut et plan pour le résumé
    const statut = etablissement.statut || 'INACTIF';
    const plan = etablissement.configuration?.planAbonnement;
    const planLabel = plan ? (PLAN_LABELS[plan] || plan) : '—';
    const statutLabel = STATUT_CONFIG[statut]?.label || statut;

    // Max du graphique connexions pour normaliser les barres
    const maxConnexions = connexions?.serie?.reduce((max, d) => Math.max(max, d.connexions), 0) || 1;

    return (
        <div className="space-y-[var(--gap-lg)]">
            {/* ===== Carte résumé en en-tête ===== */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                {/* Bandeau couleur selon statut */}
                <div className="h-1.5" style={{
                    backgroundColor: statut === 'ACTIF' ? 'var(--color-success-500)' : statut === 'EN_ATTENTE_VALIDATION' ? 'var(--color-warning-500)' : 'var(--color-danger-500)',
                }} />
                <div className="p-[clamp(1rem,0.8rem+0.6vw,1.5rem)]">
                    <div className="flex flex-col sm:flex-row items-start gap-[var(--gap-md)]">
                        {/* Logo ou avatar */}
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 font-bold text-xl overflow-hidden"
                            style={{
                                backgroundColor: 'var(--color-dominant-100)',
                                color: 'var(--color-dominant-700)',
                            }}>
                            {etablissement.logoBase64 ? (
                                <img
                                    src={`data:${etablissement.logoType || 'image/png'};base64,${etablissement.logoBase64}`}
                                    alt={etablissement.nom}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                etablissement.nom?.[0]?.toUpperCase() || '?'
                            )}
                        </div>
                        {/* Infos principales */}
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold truncate" style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)', color: 'var(--color-texte)' }}>
                                {etablissement.nom}
                            </h2>
                            {etablissement.slogan && (
                                <p className="text-sm mt-0.5" style={{ color: 'var(--color-texte-muted)' }}>{etablissement.slogan}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-[var(--gap-xs)] mt-[var(--space-xs)]">
                                {/* Code */}
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                                    style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-texte-muted)' }}>
                                    <Hash className="h-3 w-3" />
                                    {etablissement.codeEtablissement || '—'}
                                </span>
                                {/* Statut */}
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_CONFIG[statut]?.style || 'bg-gray-100 text-gray-800'}`}>
                                    {statutLabel}
                                </span>
                                {/* Plan */}
                                {plan && (
                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                        style={{ backgroundColor: 'var(--color-accent-100)', color: 'var(--color-accent-700)' }}>
                                        {planLabel}
                                    </span>
                                )}
                                {/* Type */}
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {TYPE_LABELS[etablissement.type || ''] || etablissement.type}
                                </span>
                                {/* Ville */}
                                {etablissement.ville && (
                                    <span className="inline-flex items-center gap-0.5 text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                        <MapPin className="h-3 w-3" />
                                        {etablissement.ville}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* KPIs rapides */}
                        <div className="flex items-center gap-[var(--gap-md)] shrink-0">
                            {utilisateurs && (
                                <div className="text-center">
                                    <span className="block text-lg font-bold" style={{ color: 'var(--color-texte)' }}>{utilisateurs.total}</span>
                                    <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.identite.utilisateurs', 'utilisateurs')}</span>
                                </div>
                            )}
                            {connexions && (
                                <div className="text-center">
                                    <span className="block text-lg font-bold" style={{ color: 'var(--color-dominant-600)' }}>{connexions.utilisateursActifs30j}</span>
                                    <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.identite.actifs30j', 'actifs 30j')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Historique connexions (mini graphique) ===== */}
            {connexions && connexions.serie.length > 0 && (
                <SectionCard title={t('etablissements.detail.identite.connexionsTitre', 'Activité connexions (30 jours)')} icon={BarChart3}>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-[var(--gap-sm)] mb-[var(--space-md)]">
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <span className="text-xs block" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.identite.totalConnexions', 'Total 30j')}</span>
                            <span className="text-lg font-bold" style={{ color: 'var(--color-texte)' }}>{connexions.total30j}</span>
                        </div>
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <span className="text-xs block" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.identite.moyenneJour', 'Moy./jour')}</span>
                            <span className="text-lg font-bold" style={{ color: 'var(--color-texte)' }}>{connexions.moyenneJour}</span>
                        </div>
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <span className="text-xs block" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.identite.picJour', 'Pic')}</span>
                            <span className="text-lg font-bold" style={{ color: 'var(--color-dominant-600)' }}>{connexions.picJour}</span>
                        </div>
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <span className="text-xs block" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.identite.utilisateursActifs', 'Util. actifs')}</span>
                            <span className="text-lg font-bold" style={{ color: 'var(--color-success-600)' }}>{connexions.utilisateursActifs30j}</span>
                        </div>
                    </div>
                    {/* Graphique barres CSS avec axe Y */}
                    <div className="flex gap-[var(--gap-xs)]">
                        {/* Axe Y — graduations */}
                        <div className="hidden sm:flex flex-col justify-between h-20 text-right shrink-0 w-6">
                            {[maxConnexions, Math.round(maxConnexions * 0.75), Math.round(maxConnexions * 0.5), Math.round(maxConnexions * 0.25), 0].map((v, i) => (
                                <span key={i} className="text-[0.55rem] leading-none" style={{ color: 'var(--color-texte-muted)' }}>{v}</span>
                            ))}
                        </div>
                        {/* Barres */}
                        <div className="flex-1 space-y-[var(--space-xxs)]">
                            <div className="flex items-end gap-[1px] h-20" role="img" aria-label="Graphique connexions 30 jours">
                                {connexions.serie.map((day) => {
                                    const heightPct = maxConnexions > 0 ? (day.connexions / maxConnexions) * 100 : 0;
                                    return (
                                        <div
                                            key={day.date}
                                            className="flex-1 rounded-t transition-all hover:opacity-80 relative group"
                                            style={{
                                                height: `${Math.max(heightPct, 2)}%`,
                                                backgroundColor: day.connexions > 0 ? 'var(--color-dominant-500)' : 'var(--color-bordure)',
                                                minWidth: '3px',
                                            }}
                                            title={`${day.date}: ${day.connexions} connexions, ${day.utilisateursUniques} utilisateur(s)`}
                                        >
                                            {/* Tooltip au survol */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                                                <div className="rounded-md border px-2 py-1 text-[0.6rem] whitespace-nowrap shadow-sm"
                                                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}>
                                                    <p className="font-semibold">{day.date}</p>
                                                    <p>{day.connexions} connexions</p>
                                                    <p>{day.utilisateursUniques} utilisateur(s)</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Axe X — dates extrêmes */}
                            <div className="flex justify-between">
                                <span className="text-[0.6rem]" style={{ color: 'var(--color-texte-muted)' }}>
                                    {connexions.serie[0]?.date}
                                </span>
                                <span className="text-[0.6rem]" style={{ color: 'var(--color-texte-muted)' }}>
                                    {connexions.serie[connexions.serie.length - 1]?.date}
                                </span>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ===== Sections détails en grille ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-lg)]">
            <SectionCard title={t('etablissements.detail.identite.titre', 'Informations générales')} icon={Building2}>
                <InfoGrid>
                    <InfoField icon={Hash} label={t('etablissements.detail.identite.code', 'Code')} value={etablissement.codeEtablissement} />
                    <InfoField icon={FileText} label={t('etablissements.detail.identite.arrete', 'N° Arrêté')} value={etablissement.numeroArrete} />
                    <InfoField icon={Banknote} label={t('etablissements.detail.identite.contribuable', 'N° Contribuable')} value={etablissement.numeroContribuable} />
                    <InfoField icon={CreditCard} label={t('etablissements.detail.identite.compteBancaire', 'Compte bancaire')} value={etablissement.numeroCompteBancaire} />
                </InfoGrid>
            </SectionCard>

            {/* Contact */}
            <SectionCard title={t('etablissements.detail.identite.contact', 'Contact & Localisation')} icon={MapPin}>
                <InfoGrid>
                    <InfoField icon={Mail} label="Email" value={etablissement.contactEmail} href={etablissement.contactEmail ? `mailto:${etablissement.contactEmail}` : undefined} />
                    <InfoField icon={Phone} label={t('etablissements.detail.identite.telephone', 'Téléphone')} value={etablissement.contactTelephone} href={etablissement.contactTelephone ? `tel:${etablissement.contactTelephone}` : undefined} />
                    <InfoField icon={MapPin} label={t('etablissements.detail.identite.adresse', 'Adresse')} value={etablissement.adresse} />
                    <InfoField icon={MapPin} label={t('etablissements.detail.identite.ville', 'Ville')} value={etablissement.ville} />
                    <InfoField icon={Globe} label={t('etablissements.detail.identite.siteWeb', 'Site web')} value={etablissement.siteWeb} href={etablissement.siteWeb} />
                </InfoGrid>
                {/* Réseaux sociaux */}
                {(etablissement.facebook || etablissement.twitter) && (
                    <div className="mt-[var(--space-md)] pt-[var(--space-md)]" style={{ borderTop: '1px solid var(--color-bordure)' }}>
                        <p className="text-xs font-medium mb-[var(--space-xs)]" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.identite.reseaux', 'Réseaux sociaux')}
                        </p>
                        <div className="flex items-center gap-[var(--gap-sm)]">
                            {etablissement.facebook && (
                                <a href={etablissement.facebook} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-[var(--gap-xxs)] text-sm hover:opacity-80 transition-opacity"
                                    style={{ color: 'var(--color-accent-600)' }}>
                                    <Facebook className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                    Facebook
                                </a>
                            )}
                            {etablissement.twitter && (
                                <a href={etablissement.twitter} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-[var(--gap-xxs)] text-sm hover:opacity-80 transition-opacity"
                                    style={{ color: 'var(--color-accent-600)' }}>
                                    <Twitter className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                    Twitter
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* Direction */}
            <SectionCard title={t('etablissements.detail.identite.direction', 'Direction')} icon={Users}>
                <InfoGrid>
                    <InfoField icon={Users} label={t('etablissements.detail.identite.directeur', 'Directeur')} value={etablissement.directeurNom} />
                    <InfoField icon={Users} label={t('etablissements.detail.identite.directeurAdjoint', 'Dir. adjoint')} value={etablissement.directeurAdjointNom} />
                    <InfoField icon={Users} label={t('etablissements.detail.identite.censeur', 'Censeur')} value={etablissement.censeurNom} />
                    <InfoField icon={Users} label={t('etablissements.detail.identite.surveillant', 'Surveillant général')} value={etablissement.surveillantGeneralNom} />
                </InfoGrid>
            </SectionCard>

            {/* Paramètres régionaux */}
            <SectionCard title={t('etablissements.detail.identite.parametres', 'Paramètres régionaux')} icon={Globe}>
                <InfoGrid>
                    <InfoField icon={Globe} label={t('etablissements.detail.identite.langue', 'Langue')} value={etablissement.langueDefaut?.toUpperCase()} />
                    <InfoField icon={Banknote} label={t('etablissements.detail.identite.devise', 'Devise')} value={etablissement.devise} />
                    <InfoField icon={Clock} label={t('etablissements.detail.identite.fuseau', 'Fuseau horaire')} value={etablissement.fuseauHoraire} />
                    <InfoField icon={Clock} label={t('etablissements.detail.identite.horaires', 'Horaires')}
                        value={etablissement.heuresOuverture && etablissement.heuresFermeture
                            ? `${etablissement.heuresOuverture} — ${etablissement.heuresFermeture}`
                            : undefined} />
                </InfoGrid>
                {/* Couleurs */}
                {(etablissement.couleurPrimaire || etablissement.couleurSecondaire) && (
                    <div className="mt-[var(--space-md)] pt-[var(--space-md)]" style={{ borderTop: '1px solid var(--color-bordure)' }}>
                        <p className="text-xs font-medium mb-[var(--space-xs)]" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.identite.couleurs', 'Couleurs')}
                        </p>
                        <div className="flex items-center gap-[var(--gap-md)]">
                            {etablissement.couleurPrimaire && (
                                <div className="flex items-center gap-[var(--gap-xxs)]">
                                    <div className="w-5 h-5 rounded border" style={{ backgroundColor: etablissement.couleurPrimaire, borderColor: 'var(--color-bordure)' }} />
                                    <span className="text-xs font-mono" style={{ color: 'var(--color-texte-muted)' }}>{etablissement.couleurPrimaire}</span>
                                </div>
                            )}
                            {etablissement.couleurSecondaire && (
                                <div className="flex items-center gap-[var(--gap-xxs)]">
                                    <div className="w-5 h-5 rounded border" style={{ backgroundColor: etablissement.couleurSecondaire, borderColor: 'var(--color-bordure)' }} />
                                    <span className="text-xs font-mono" style={{ color: 'var(--color-texte-muted)' }}>{etablissement.couleurSecondaire}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* Dates */}
            <SectionCard title={t('etablissements.detail.identite.dates', 'Dates')} icon={Calendar} fullWidth>
                <InfoGrid>
                    <InfoField icon={Calendar} label={t('etablissements.detail.identite.creeLe', 'Créé le')}
                        value={etablissement.createdAt ? new Date(etablissement.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                    <InfoField icon={Calendar} label={t('etablissements.detail.identite.modifieLe', 'Modifié le')}
                        value={etablissement.updatedAt ? new Date(etablissement.updatedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                </InfoGrid>
            </SectionCard>

            {/* Comptes liés */}
            {utilisateurs && (
                <SectionCard title={t('etablissements.detail.utilisateurs.titre', 'Comptes liés')} icon={UserCircle} fullWidth>
                    {/* Résumé */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[var(--gap-sm)]">
                        {/* Total */}
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <div className="flex items-center gap-[var(--gap-xxs)]">
                                <Users className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color: 'var(--color-dominant-600)' }} />
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>Total</span>
                            </div>
                            <span className="text-xl font-bold" style={{ color: 'var(--color-texte)' }}>{utilisateurs.total}</span>
                            <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                {utilisateurs.actifs} {t('etablissements.detail.utilisateurs.actifs', 'actifs')}
                            </span>
                        </div>
                        {/* Rôles */}
                        {utilisateurs.parRole.slice(0, 4).map((r) => (
                            <div key={r.code} className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>{r.role}</span>
                                <span className="block text-xl font-bold" style={{ color: 'var(--color-texte)' }}>{r.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* Derniers utilisateurs */}
                    {utilisateurs.derniers.length > 0 && (
                        <div className="pt-[var(--space-sm)]" style={{ borderTop: '1px solid var(--color-bordure)' }}>
                            <p className="text-xs font-medium mb-[var(--space-xs)]" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.utilisateurs.nbUtilisateurs', '{{count}} comptes utilisateurs', { count: utilisateurs.total })}
                            </p>
                            <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                {utilisateurs.derniers.slice(0, 10).map((u) => (
                                    <div key={u.id} className="flex items-center gap-[var(--gap-xs)] rounded-lg p-[var(--space-xs)]"
                                        style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                                        {/* Avatar */}
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${u.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {u.prenom?.[0] || u.email[0].toUpperCase()}
                                        </div>
                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-[var(--gap-xxs)]">
                                                <span className="text-xs font-medium truncate" style={{ color: 'var(--color-texte)' }}>
                                                    {u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email}
                                                </span>
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${u.actif ? 'bg-green-400' : 'bg-gray-400'}`} />
                                            </div>
                                            <p className="text-xs truncate" style={{ color: 'var(--color-texte-muted)' }}>
                                                {u.email}
                                            </p>
                                        </div>
                                        {/* Rôle + dernière connexion */}
                                        <div className="text-right shrink-0">
                                            <span className="text-xs px-1.5 py-0.5 rounded" style={{
                                                backgroundColor: 'var(--color-dominant-100)',
                                                color: 'var(--color-dominant-700)',
                                            }}>
                                                {u.role}
                                            </span>
                                            {u.derniereConnexion && (
                                                <p className="text-xs flex items-center gap-0.5 justify-end mt-0.5" style={{ color: 'var(--color-texte-muted)' }}>
                                                    <LogIn className="h-2.5 w-2.5" />
                                                    {formatRelativeTime(u.derniereConnexion)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {utilisateurs.total === 0 && (
                        <p className="text-sm text-center py-[var(--space-md)]" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.utilisateurs.aucun', 'Aucun compte lié')}
                        </p>
                    )}
                </SectionCard>
            )}
            </div>
        </div>
    );
}

// =============================================
// Tab 2 — Santé composite
// =============================================

function SanteTab({ sante, etablissementId, recalculerSante, historique }: { sante: SanteEtablissementResult; etablissementId: string; recalculerSante: ReturnType<typeof useRecalculerSante>; historique?: HistoriqueScoreSante[] }) {
    const { t } = useTranslation('admin');

    return (
        <div className="space-y-[var(--gap-lg)]">
            {/* Score global — grande carte */}
            <div className="rounded-xl border p-[clamp(1.5rem,1.2rem+1vw,2.5rem)]"
                style={{
                    borderColor: 'var(--color-bordure)',
                    backgroundColor: 'var(--color-surface)',
                }}>
                <div className="flex flex-col sm:flex-row items-center gap-[var(--gap-lg)]">
                    {/* Cercle score */}
                    <div className="relative">
                        <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
                            <circle cx="60" cy="60" r="52" fill="none" strokeWidth="8"
                                style={{ stroke: 'var(--color-bordure)' }} />
                            <motion.circle
                                cx="60" cy="60" r="52" fill="none" strokeWidth="8"
                                strokeLinecap="round"
                                style={{ stroke: getScoreColor(sante.score) }}
                                initial={{ strokeDasharray: '0 327' }}
                                animate={{ strokeDasharray: `${(sante.score / 100) * 327} 327` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                className="text-3xl font-bold"
                                style={{ color: getScoreColor(sante.score) }}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                {sante.score}
                            </motion.span>
                            <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>/100</span>
                        </div>
                    </div>
                    {/* Info santé */}
                    <div className="text-center sm:text-left space-y-[var(--space-sm)] flex-1">
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-texte)' }}>
                            {sante.nomEtablissement}
                        </h3>
                        <SanteEtablissement variant="badge" score={sante.score} categorie={sante.categorie} />
                        {/* Tendance depuis l'historique */}
                        {historique && historique.length >= 2 && (() => {
                            const premier = historique[0].score;
                            const courant = sante.score;
                            const diff = courant - premier;
                            const trendLabel = diff >= 3 ? 'en hausse' : diff <= -3 ? 'en baisse' : 'stable';
                            const trendColor = diff >= 3 ? 'var(--color-success-600)' : diff <= -3 ? 'var(--color-danger-600)' : 'var(--color-texte-muted)';
                            const TrendIcon = diff >= 3 ? ArrowUpRight : diff <= -3 ? ArrowDownRight : Activity;
                            return (
                                <div className="inline-flex items-center gap-[var(--gap-xxs)] text-xs font-medium" style={{ color: trendColor }}>
                                    <TrendIcon className="h-3 w-3" />
                                    {trendLabel} ({diff > 0 ? '+' : ''}{diff} pts)
                                </div>
                            );
                        })()}
                        <p className="text-sm" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.sante.description', 'Score composite basé sur 4 critères : abonnement, paiements, activité et modules.')}
                        </p>
                    </div>
                    {/* Bouton recalcul */}
                    <div className="shrink-0">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => recalculerSante.mutate(etablissementId)}
                            disabled={recalculerSante.isPending}
                            className="inline-flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.625rem,0.5rem+0.3vw,1rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] text-sm font-medium transition-colors disabled:opacity-50"
                            style={{
                                borderColor: 'var(--color-dominant-200)',
                                backgroundColor: recalculerSante.isPending ? 'var(--color-surface-alt)' : 'var(--color-dominant-50)',
                                color: 'var(--color-dominant-700)',
                            }}
                        >
                            <RefreshCw className={`h-[var(--icon-sm)] w-[var(--icon-sm)] ${recalculerSante.isPending ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">
                                {recalculerSante.isPending
                                    ? t('etablissements.detail.sante.recalculEnCours', 'Recalcul...')
                                    : t('etablissements.detail.sante.recalculer', 'Recalculer le score')}
                            </span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* 4 critères détaillés */}
            <SanteEtablissement variant="detail" score={sante.score} categorie={sante.categorie} details={sante.details} />

            {/* Radar chart SVG — 4 critères */}
            {sante.details && (
                <SectionCard title={t('etablissements.detail.sante.radarTitre', 'Profil santé')} icon={BarChart3}>
                    <div className="flex flex-col sm:flex-row items-center gap-[var(--gap-lg)]">
                        {/* Radar SVG */}
                        {(() => {
                            const criteres = [
                                { label: t('etablissements.detail.sante.critereAbonnement', 'Abonnement'), score: sante.details.abonnement.score, color: 'var(--color-info-500)' },
                                { label: t('etablissements.detail.sante.criterePaiements', 'Paiements'), score: sante.details.paiements.score, color: 'var(--color-success-500)' },
                                { label: t('etablissements.detail.sante.critereActivite', 'Activité'), score: sante.details.activite.score, color: 'var(--color-accent-500)' },
                                { label: t('etablissements.detail.sante.critereModules', 'Modules'), score: sante.details.modules.score, color: 'var(--color-warning-500)' },
                            ];
                            const cx = 80, cy = 80, R = 60;
                            const angleStep = (2 * Math.PI) / criteres.length;
                            // Points du polygone de fond (niveaux 25%, 50%, 75%, 100%)
                            const levels = [0.25, 0.5, 0.75, 1];
                            const getPoint = (index: number, radius: number) => {
                                const angle = index * angleStep - Math.PI / 2;
                                return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
                            };
                            // Points du polygone de données
                            const dataPoints = criteres.map((c, i) => getPoint(i, (c.score / 100) * R));
                            const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

                            return (
                                <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
                                    <svg viewBox="0 0 160 160" className="w-full h-full">
                                        {/* Grille de fond */}
                                        {levels.map((lvl) => {
                                            const pts = criteres.map((_, i) => getPoint(i, R * lvl));
                                            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
                                            return <path key={lvl} d={path} fill="none" stroke="var(--color-bordure)" strokeWidth="0.5" />;
                                        })}
                                        {/* Axes */}
                                        {criteres.map((_, i) => {
                                            const end = getPoint(i, R);
                                            return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--color-bordure)" strokeWidth="0.5" />;
                                        })}
                                        {/* Polygone de données */}
                                        <motion.path
                                            d={dataPath}
                                            fill={getScoreColor(sante.score)}
                                            fillOpacity={0.2}
                                            stroke={getScoreColor(sante.score)}
                                            strokeWidth="2"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                            style={{ transformOrigin: `${cx}px ${cy}px` }}
                                        />
                                        {/* Points de données */}
                                        {dataPoints.map((p, i) => (
                                            <motion.circle
                                                key={i}
                                                cx={p.x} cy={p.y} r="3.5"
                                                fill={criteres[i].color}
                                                stroke="var(--color-surface)"
                                                strokeWidth="1.5"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.3 + i * 0.1 }}
                                            >
                                                <title>{`${criteres[i].label}: ${criteres[i].score}/100`}</title>
                                            </motion.circle>
                                        ))}
                                    </svg>
                                </div>
                            );
                        })()}
                        {/* Légende */}
                        <div className="flex-1 grid grid-cols-2 gap-[var(--gap-sm)]">
                            {[
                                { label: t('etablissements.detail.sante.critereAbonnement', 'Abonnement'), score: sante.details.abonnement.score, color: 'var(--color-info-500)', sub: sante.details.abonnement.statut },
                                { label: t('etablissements.detail.sante.criterePaiements', 'Paiements'), score: sante.details.paiements.score, color: 'var(--color-success-500)', sub: `${sante.details.paiements.tauxRecouvrement}%` },
                                { label: t('etablissements.detail.sante.critereActivite', 'Activité'), score: sante.details.activite.score, color: 'var(--color-accent-500)', sub: `${sante.details.activite.elevesActifs} élèves` },
                                { label: t('etablissements.detail.sante.critereModules', 'Modules'), score: sante.details.modules.score, color: 'var(--color-warning-500)', sub: `${sante.details.modules.actifs}/${sante.details.modules.disponibles}` },
                            ].map((c) => (
                                <div key={c.label} className="flex items-center gap-[var(--gap-xs)]">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium truncate" style={{ color: 'var(--color-texte)' }}>{c.label}</p>
                                        <p className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                            <span className="font-bold" style={{ color: c.color }}>{c.score}</span>/100 · {c.sub}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* Sparkline — Évolution du score */}
            {historique && historique.length >= 2 && (
                <SectionCard title={t('etablissements.detail.sante.evolution', 'Évolution du score')} icon={TrendingUp} fullWidth>
                    <div className="space-y-[var(--space-sm)]">
                        {/* Sparkline SVG */}
                        <div className="w-full h-16 sm:h-20">
                            <svg viewBox={`0 0 ${historique.length * 8} 80`} className="w-full h-full" preserveAspectRatio="none">
                                {/* Ligne de fond */}
                                <line x1="0" y1="40" x2={historique.length * 8} y2="40" stroke="var(--color-bordure)" strokeWidth="0.5" strokeDasharray="2,2" />
                                {/* Area fill */}
                                <motion.path
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.15 }}
                                    transition={{ duration: 0.8 }}
                                    d={`M0,80 ${historique.map((h, i) => `L${i * 8},${80 - (h.score / 100) * 70}`).join(' ')} L${(historique.length - 1) * 8},80 Z`}
                                    fill={getScoreColor(sante.score)}
                                />
                                {/* Line */}
                                <motion.path
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    d={`M${historique.map((h, i) => `${i === 0 ? '' : 'L'}${i * 8},${80 - (h.score / 100) * 70}`).join(' ')}`}
                                    fill="none"
                                    stroke={getScoreColor(sante.score)}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                {/* Points */}
                                {historique.map((h, i) => (
                                    <motion.circle
                                        key={i}
                                        cx={i * 8}
                                        cy={80 - (h.score / 100) * 70}
                                        r="2.5"
                                        fill={getScoreColor(h.score)}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.02 }}
                                    >
                                        <title>{`${new Date(h.createdAt).toLocaleDateString('fr-FR')}: ${h.score}/100`}</title>
                                    </motion.circle>
                                ))}
                            </svg>
                        </div>
                        {/* Stats évolution */}
                        <div className="flex items-center gap-[var(--gap-md)] text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                            <span>{historique.length} {t('etablissements.detail.sante.mesures', 'mesure(s)')}</span>
                            {historique.length >= 2 && (() => {
                                const premier = historique[0].score;
                                const dernier = historique[historique.length - 1].score;
                                const diff = dernier - premier;
                                return (
                                    <span className="inline-flex items-center gap-0.5" style={{ color: diff >= 0 ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
                                        {diff >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        {diff > 0 ? '+' : ''}{diff} pts
                                    </span>
                                );
                            })()}
                            {historique.length >= 2 && (
                                <span>
                                    {new Date(historique[0].createdAt).toLocaleDateString('fr-FR')} → {new Date(historique[historique.length - 1].createdAt).toLocaleDateString('fr-FR')}
                                </span>
                            )}
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* Recommandations personnalisées */}
            {sante.recommandations && sante.recommandations.length > 0 && (
                <SectionCard title={t('etablissements.detail.sante.recommandations', 'Recommandations')} icon={Lightbulb} fullWidth>
                    <div className="space-y-[var(--space-sm)]">
                        {sante.recommandations.map((reco, index) => {
                            const prioriteConfig: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
                                haute: { bg: 'var(--color-danger-50)', border: 'var(--color-danger-200)', text: 'var(--color-danger-700)', dot: 'bg-red-400', label: t('etablissements.detail.sante.prioriteHaute', 'Haute') },
                                moyenne: { bg: 'var(--color-warning-50)', border: 'var(--color-warning-200)', text: 'var(--color-warning-700)', dot: 'bg-yellow-400', label: t('etablissements.detail.sante.prioriteMoyenne', 'Moyenne') },
                                basse: { bg: 'var(--color-success-50)', border: 'var(--color-success-200)', text: 'var(--color-success-700)', dot: 'bg-green-400', label: t('etablissements.detail.sante.prioriteBasse', 'Basse') },
                            };
                            const cfg = prioriteConfig[reco.priorite] || prioriteConfig.moyenne;
                            const critereLabels: Record<string, string> = {
                                abonnement: t('etablissements.detail.sante.critereAbonnement', 'Abonnement'),
                                paiements: t('etablissements.detail.sante.criterePaiements', 'Paiements'),
                                activite: t('etablissements.detail.sante.critereActivite', 'Activité'),
                                modules: t('etablissements.detail.sante.critereModules', 'Modules'),
                            };
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.06 }}
                                    className="rounded-lg border p-[clamp(0.75rem,0.6rem+0.4vw,1rem)]"
                                    style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                                >
                                    <div className="flex items-start gap-[var(--gap-sm)]">
                                        {/* Indicateur priorité */}
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-[var(--gap-xs)] flex-wrap">
                                                <span className="text-sm font-semibold" style={{ color: 'var(--color-texte)' }}>
                                                    {reco.titre}
                                                </span>
                                                <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                                                    style={{ backgroundColor: cfg.border, color: cfg.text }}>
                                                    {cfg.label}
                                                </span>
                                                <span className="text-xs px-1.5 py-0.5 rounded"
                                                    style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-texte-muted)' }}>
                                                    {critereLabels[reco.critere] || reco.critere}
                                                </span>
                                            </div>
                                            <p className="text-xs mt-1" style={{ color: 'var(--color-texte-muted)' }}>
                                                {reco.description}
                                            </p>
                                            <p className="text-xs mt-1 font-medium" style={{ color: cfg.text }}>
                                                → {reco.action}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </SectionCard>
            )}
        </div>
    );
}

// =============================================
// Tab 3 — Activité & Effectifs (enrichi v2)
// =============================================

function ActiviteTab({ stats, etablissement, activite }: {
    stats: EtablissementDetailStats;
    etablissement: Etablissement;
    activite?: ActiviteEtablissementResult;
}) {
    const { t } = useTranslation('admin');

    // Données de ventilation (depuis activite ou fallback sur stats)
    const ventilation = activite?.ventilation;
    const modules = activite?.modules;
    const timeline = activite?.timeline;
    const finances = activite?.finances;

    // Stats plateforme pour comparaison
    const { data: platformStats } = useQuery({
        queryKey: ['platform-etablissements-stats'],
        queryFn: async () => {
            const res = await apiClient.get<{ total: number; totalEleves: number; totalUtilisateurs: number; scoreMoyen: number }>('/api/platform/etablissements/stats');
            return res.data;
        },
        staleTime: 5 * 60_000,
    });

    // Cards de base (toujours visibles)
    const cards = [
        { icon: GraduationCap, label: t('etablissements.detail.activite.eleves', 'Élèves'), value: stats.nombreEleves, color: 'var(--color-accent-600)' },
        { icon: Users, label: t('etablissements.detail.activite.personnel', 'Personnel'), value: stats.nombrePersonnel, color: 'var(--color-info-600)' },
        { icon: BookOpen, label: t('etablissements.detail.activite.classes', 'Classes'), value: stats.nombreClasses, color: 'var(--color-success-600)' },
        { icon: Layers, label: t('etablissements.detail.activite.niveaux', 'Niveaux'), value: stats.nombreNiveaux, color: 'var(--color-warning-600)' },
    ];

    return (
        <div className="space-y-[var(--gap-lg)]">
            {/* ===== Section 1 — Stats de base + Taux occupation ===== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--gap-md)]">
                {cards.map((card) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-[var(--space-sm)]"
                        style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                    >
                        <div className="flex items-center gap-[var(--gap-xs)]">
                            <card.icon className="h-[var(--icon-md)] w-[var(--icon-md)]" style={{ color: card.color }} />
                            <span className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>{card.label}</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: 'var(--color-texte)' }}>
                            {card.value.toLocaleString('fr-FR')}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Taux d'occupation */}
            <SectionCard title={t('etablissements.detail.activite.tauxOccupation', 'Taux d\'occupation')} icon={TrendingUp}>
                <div className="space-y-[var(--space-sm)]">
                    <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--color-texte-muted)' }}>
                            {etablissement.effectifActuel ?? 0} / {etablissement.effectifMax ?? '—'}
                        </span>
                        <span className="text-lg font-bold" style={{ color: getTauxColor(stats.tauxOccupation) }}>
                            {stats.tauxOccupation}%
                        </span>
                    </div>
                    <div className="w-full h-[clamp(0.5rem,0.4rem+0.2vw,0.75rem)] rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--color-bordure)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(stats.tauxOccupation, 100)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: getTauxColor(stats.tauxOccupation) }}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* ===== Section 2 — Ventilation effectifs (si données activite) ===== */}
            {ventilation && (
                <SectionCard title={t('etablissements.detail.activite.ventilation.titre', 'Ventilation des effectifs')} icon={UserCheck}>
                    {/* Cards genre + ratio */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--gap-sm)]">
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <div className="flex items-center gap-[var(--gap-xxs)]">
                                <UserCheck className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color: 'var(--color-info-600)' }} />
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {t('etablissements.detail.activite.ventilation.filles', 'Filles')}
                                </span>
                            </div>
                            <span className="text-xl font-bold" style={{ color: 'var(--color-texte)' }}>
                                {ventilation.parGenre.feminin.toLocaleString('fr-FR')}
                            </span>
                        </div>
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <div className="flex items-center gap-[var(--gap-xxs)]">
                                <UserX className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color: 'var(--color-accent-600)' }} />
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {t('etablissements.detail.activite.ventilation.garcons', 'Garçons')}
                                </span>
                            </div>
                            <span className="text-xl font-bold" style={{ color: 'var(--color-texte)' }}>
                                {ventilation.parGenre.masculin.toLocaleString('fr-FR')}
                            </span>
                        </div>
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <div className="flex items-center gap-[var(--gap-xxs)]">
                                <Users className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color: 'var(--color-success-600)' }} />
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {t('etablissements.detail.activite.ventilation.ratio', 'Ratio P/E')}
                                </span>
                            </div>
                            <span className="text-xl font-bold" style={{ color: 'var(--color-texte)' }}>
                                1/{ventilation.ratioPersonnelEleves > 0 ? Math.round(1 / ventilation.ratioPersonnelEleves) : '—'}
                            </span>
                        </div>
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <div className="flex items-center gap-[var(--gap-xxs)]">
                                <ArrowUpRight className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color: 'var(--color-dominant-600)' }} />
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {t('etablissements.detail.activite.ventilation.nouvelles', 'Nouvelles inscriptions')}
                                </span>
                            </div>
                            <span className="text-xl font-bold" style={{ color: 'var(--color-dominant-600)' }}>
                                +{ventilation.nouvellesInscriptions}
                            </span>
                        </div>
                    </div>

                    {/* Barres par cycle */}
                    {ventilation.parCycle.length > 0 && (() => {
                        const maxCount = Math.max(...ventilation.parCycle.map(c => c.nombre), 1);
                        return (
                        <div className="space-y-[var(--space-sm)]">
                            <p className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.activite.ventilation.parCycle', 'Par cycle')}
                            </p>
                            {ventilation.parCycle.map((cycle) => {
                                const pct = Math.round((cycle.nombre / maxCount) * 100);
                                return (
                                    <div key={cycle.code} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium" style={{ color: 'var(--color-texte)' }}>{cycle.cycle}</span>
                                            <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>{cycle.nombre}</span>
                                        </div>
                                        <div className="w-full h-[clamp(0.375rem,0.3rem+0.15vw,0.5rem)] rounded-full overflow-hidden"
                                            style={{ backgroundColor: 'var(--color-bordure)' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: 'var(--color-dominant-500)' }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        );
                    })()}

                    {/* Dernières inscriptions */}
                    {ventilation.dernieresInscriptions?.length > 0 && (
                        <div className="pt-[var(--space-sm)]" style={{ borderTop: '1px solid var(--color-bordure)' }}>
                            <p className="text-xs font-medium mb-[var(--space-xs)]" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.activite.ventilation.dernieresInscriptions', 'Dernières inscriptions')}
                            </p>
                            <div className="space-y-1">
                                {ventilation.dernieresInscriptions.map((insc, idx) => (
                                    <div key={idx} className="flex items-center gap-[var(--gap-xs)] rounded-lg p-[var(--space-xs)]"
                                        style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold shrink-0"
                                            style={{ backgroundColor: 'var(--color-dominant-100)', color: 'var(--color-dominant-700)' }}>
                                            {(insc.nomEleve[0] || '?').toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-medium truncate" style={{ color: 'var(--color-texte)' }}>
                                                {insc.nomEleve}
                                            </p>
                                            {insc.classe && (
                                                <p className="text-[0.6rem] truncate" style={{ color: 'var(--color-texte-muted)' }}>{insc.classe}</p>
                                            )}
                                        </div>
                                        <span className="text-[0.6rem] shrink-0" style={{ color: 'var(--color-texte-muted)' }}>
                                            {formatRelativeTime(insc.dateInscription)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </SectionCard>
            )}

            {/* ===== Section 3 — Modules actifs ===== */}
            {modules && (
                <SectionCard title={t('etablissements.detail.activite.modules.titre', 'Modules actifs')} icon={Package}>
                    <div className="space-y-[var(--space-md)]">
                        {/* Résumé */}
                        <div className="flex items-center gap-[var(--gap-sm)]">
                            <span className="text-2xl font-bold" style={{ color: 'var(--color-dominant-600)' }}>
                                {modules.totalActifs}
                            </span>
                            <span className="text-sm" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.activite.modules.actifsSur', 'actifs sur')} {modules.actifs.length}
                            </span>
                        </div>

                        {/* Grille modules */}
                        {modules.actifs.length > 0 && (
                            <div className="flex flex-wrap gap-[var(--gap-xs)]">
                                {modules.actifs.slice(0, 20).map((mod) => (
                                    <span
                                        key={mod.nom}
                                        className="inline-flex items-center gap-[var(--gap-xxs)] rounded-full px-[clamp(0.375rem,0.3rem+0.2vw,0.75rem)] py-[clamp(0.125rem,0.1rem+0.1vw,0.375rem)] text-xs font-medium"
                                        style={{
                                            backgroundColor: mod.actif ? 'var(--color-success-50)' : 'var(--color-surface-alt)',
                                            color: mod.actif ? 'var(--color-success-700)' : 'var(--color-texte-muted)',
                                            border: `1px solid ${mod.actif ? 'var(--color-success-200)' : 'var(--color-bordure)'}`,
                                        }}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${mod.actif ? 'bg-green-400' : 'bg-gray-400'}`} />
                                        {mod.nom}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Derniers changements */}
                        {modules.derniersChangements.length > 0 && (
                            <div className="pt-[var(--space-sm)]" style={{ borderTop: '1px solid var(--color-bordure)' }}>
                                <p className="text-xs font-medium mb-[var(--space-xs)]" style={{ color: 'var(--color-texte-muted)' }}>
                                    {t('etablissements.detail.activite.modules.derniersChangements', 'Derniers changements')}
                                </p>
                                <div className="space-y-1">
                                    {modules.derniersChangements.slice(0, 5).map((ch, idx) => (
                                        <div key={idx} className="flex items-center gap-[var(--gap-xs)] text-xs">
                                            <Package className="h-3 w-3" style={{ color: 'var(--color-texte-muted)' }} />
                                            <span style={{ color: 'var(--color-texte)' }}>{ch.module}</span>
                                            <span style={{ color: ch.action === 'activé' ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
                                                {ch.action}
                                            </span>
                                            <span className="ml-auto" style={{ color: 'var(--color-texte-muted)' }}>
                                                {formatRelativeTime(ch.date)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>
            )}

            {/* ===== Section 4 — Timeline activité ===== */}
            {timeline && (
                <SectionCard title={t('etablissements.detail.activite.timeline.titre', 'Activité récente')} icon={Activity}>
                    {/* Compteurs par module */}
                    {timeline.compteurs.length > 0 && (
                        <div className="space-y-[var(--space-sm)]">
                            <p className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.activite.timeline.compteurs30j', 'Opérations (30 derniers jours)')}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[var(--gap-xs)]">
                                {timeline.compteurs.slice(0, 5).map((c) => (
                                    <div key={c.module} className="rounded-lg border p-[var(--space-xs)] text-center"
                                        style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                                        <span className="text-lg font-bold" style={{ color: 'var(--color-dominant-600)' }}>{c.count}</span>
                                        <p className="text-xs truncate" style={{ color: 'var(--color-texte-muted)' }}>{c.module}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Timeline événements */}
                    {timeline.evenements.length > 0 && (
                        <div className="space-y-[var(--space-sm)]">
                            <p className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.activite.timeline.derniersEvenements', 'Derniers événements')}
                            </p>
                            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                {timeline.evenements.slice(0, 15).map((evt) => (
                                    <div key={evt.id} className="flex items-start gap-[var(--gap-xs)] rounded-lg p-[var(--space-xs)]"
                                        style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                                        {/* Indicateur sévérité */}
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                            evt.severity === 'CRITICAL' ? 'bg-red-400' :
                                            evt.severity === 'WARNING' ? 'bg-yellow-400' : 'bg-blue-400'
                                        }`} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-[var(--gap-xxs)] flex-wrap">
                                                <span className="text-xs font-medium" style={{ color: 'var(--color-texte)' }}>
                                                    {evt.action}
                                                </span>
                                                {evt.module && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded" style={{
                                                        backgroundColor: 'var(--color-dominant-100)',
                                                        color: 'var(--color-dominant-700)',
                                                    }}>
                                                        {evt.module}
                                                    </span>
                                                )}
                                                {evt.cible && (
                                                    <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                                        {evt.cible}
                                                    </span>
                                                )}
                                            </div>
                                            {evt.utilisateurEmail && (
                                                <p className="text-xs truncate" style={{ color: 'var(--color-texte-muted)' }}>
                                                    {evt.utilisateurEmail}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs shrink-0" style={{ color: 'var(--color-texte-muted)' }}>
                                            {formatRelativeTime(evt.createdAt)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {timeline.evenements.length === 0 && timeline.compteurs.length === 0 && (
                        <p className="text-sm text-center py-[var(--space-md)]" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.activite.timeline.aucuneActivite', 'Aucune activité enregistrée')}
                        </p>
                    )}
                </SectionCard>
            )}

            {/* ===== Section 5 — Métriques financières ===== */}
            {finances && (
                <SectionCard title={t('etablissements.detail.activite.finances.titre', 'Métriques financières')} icon={DollarSign}>
                    {/* Cards financières */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-[var(--gap-md)]">
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <div className="flex items-center gap-[var(--gap-xxs)]">
                                <DollarSign className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color: 'var(--color-success-600)' }} />
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {t('etablissements.detail.activite.finances.paiementsMois', 'Paiements ce mois')}
                                </span>
                            </div>
                            <span className="text-xl font-bold" style={{ color: 'var(--color-texte)' }}>
                                {finances.paiementsMois.toLocaleString('fr-FR')}
                            </span>
                            {finances.montantPaiementsMois > 0 && (
                                <p className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {finances.montantPaiementsMois.toLocaleString('fr-FR')} FCFA
                                </p>
                            )}
                        </div>
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <div className="flex items-center gap-[var(--gap-xxs)]">
                                <Receipt className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color: 'var(--color-warning-600)' }} />
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {t('etablissements.detail.activite.finances.facturesEnAttente', 'Factures en attente')}
                                </span>
                            </div>
                            <span className="text-xl font-bold" style={{ color: 'var(--color-texte)' }}>
                                {finances.facturesEnAttente}
                            </span>
                            {finances.montantEnAttente > 0 && (
                                <p className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {finances.montantEnAttente.toLocaleString('fr-FR')} FCFA
                                </p>
                            )}
                        </div>
                        <div className="rounded-lg border p-[var(--space-sm)] col-span-2 lg:col-span-1" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <div className="flex items-center gap-[var(--gap-xxs)]">
                                <Percent className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color: 'var(--color-dominant-600)' }} />
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {t('etablissements.detail.activite.finances.tauxRecouvrement', 'Taux recouvrement')}
                                </span>
                            </div>
                            <span className="text-xl font-bold" style={{ color: getTauxColor(100 - finances.tauxRecouvrement) }}>
                                {finances.tauxRecouvrement}%
                            </span>
                            <div className="w-full h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${finances.tauxRecouvrement}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: finances.tauxRecouvrement >= 80 ? 'var(--color-success-500)' : finances.tauxRecouvrement >= 50 ? 'var(--color-warning-500)' : 'var(--color-danger-500)' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Info abonnement */}
                    {finances.abonnement && (
                        <div className="pt-[var(--space-sm)]" style={{ borderTop: '1px solid var(--color-bordure)' }}>
                            <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                                <span className="text-xs font-medium px-2 py-1 rounded" style={{
                                    backgroundColor: 'var(--color-dominant-100)',
                                    color: 'var(--color-dominant-700)',
                                }}>
                                    {finances.abonnement.plan}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {finances.abonnement.statut}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {finances.abonnement.dateFin ? new Date(finances.abonnement.dateFin).toLocaleDateString('fr-FR') : '—'}
                                </span>
                                {finances.abonnement.autoRenouvellement && (
                                    <span className="text-xs flex items-center gap-0.5" style={{ color: 'var(--color-success-600)' }}>
                                        <RefreshCw className="h-3 w-3" />
                                        Auto-renouvellement
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </SectionCard>
            )}

            {/* ===== Section 6 — Comparaison vs moyenne plateforme ===== */}
            {platformStats && platformStats.total > 1 && (
                <SectionCard title={t('etablissements.detail.activite.comparaison.titre', 'Comparaison plateforme')} icon={BarChart3}>
                    <ComparaisonPlateforme
                        stats={stats}
                        etablissement={etablissement}
                        platformStats={platformStats}
                        t={t}
                    />
                </SectionCard>
            )}
        </div>
    );
}

// =============================================
// Composant ComparaisonPlateforme
// =============================================

function ComparaisonPlateforme({
    stats,
    etablissement,
    platformStats,
    t,
}: {
    stats: EtablissementDetailStats;
    etablissement: Etablissement;
    platformStats: { total: number; totalEleves: number; totalUtilisateurs: number; scoreMoyen: number };
    t: (key: string, fallback: string) => string;
}) {
    // Données de comparaison enrichies depuis le backend
    const { data: comparaison } = useQuery({
        queryKey: ['etablissement-comparaison', etablissement.id],
        queryFn: async () => {
            const res = await apiClient.get<{ data: {
                local: { eleves: number; personnel: number; classes: number; tauxOccupation: number; scoreSante: number | null; modulesActifs: number | null; inscriptionsMois: number };
                plateforme: { totalEtablissements: number; moyenneEleves: number; moyenneCapacite: number; moyenneTauxOccupation: number; moyenneScoreSante: number; moyenneClasses: number; moyennePersonnel: number };
            } }>(`/api/platform/etablissements/${etablissement.id}/comparaison`);
            return res.data;
        },
        staleTime: 5 * 60_000,
        retry: 1,
    });

    // Fallback sur les anciennes données si l'endpoint échoue
    const moyEleves = platformStats.total > 0 ? Math.round(platformStats.totalEleves / platformStats.total) : 0;
    const moyTauxOccupation = comparaison?.plateforme.moyenneTauxOccupation ?? 65;

    const comparaisons = [
        {
            label: t('etablissements.detail.activite.comparaison.eleves', 'Élèves'),
            valeur: comparaison?.local.eleves ?? stats.nombreEleves,
            moyenne: comparaison?.plateforme.moyenneEleves ?? moyEleves,
            unite: '',
            icon: GraduationCap,
            color: 'var(--color-accent-600)',
        },
        {
            label: t('etablissements.detail.activite.comparaison.personnel', 'Personnel'),
            valeur: comparaison?.local.personnel ?? stats.nombrePersonnel,
            moyenne: comparaison?.plateforme.moyennePersonnel ?? Math.round(moyEleves / 15),
            unite: '',
            icon: Users,
            color: 'var(--color-info-600)',
        },
        {
            label: t('etablissements.detail.activite.comparaison.classes', 'Classes'),
            valeur: comparaison?.local.classes ?? stats.nombreClasses,
            moyenne: comparaison?.plateforme.moyenneClasses ?? (moyEleves > 0 ? Math.round(moyEleves / 30) : 0),
            unite: '',
            icon: BookOpen,
            color: 'var(--color-success-600)',
        },
        {
            label: t('etablissements.detail.activite.comparaison.tauxOccupation', 'Taux occupation'),
            valeur: comparaison?.local.tauxOccupation ?? stats.tauxOccupation,
            moyenne: moyTauxOccupation,
            unite: '%',
            icon: TrendingUp,
            color: 'var(--color-warning-600)',
        },
        ...(comparaison?.local.scoreSante != null && comparaison.plateforme.moyenneScoreSante > 0 ? [{
            label: t('etablissements.detail.activite.comparaison.scoreSante', 'Score santé'),
            valeur: comparaison.local.scoreSante,
            moyenne: comparaison.plateforme.moyenneScoreSante,
            unite: '',
            icon: Heart,
            color: 'var(--color-danger-600)',
        }] : []),
    ];

    return (
        <div className="space-y-[var(--space-md)]">
            <p className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                {t('etablissements.detail.activite.comparaison.description', 'Positionnement par rapport à la moyenne des {{total}} établissements de la plateforme.', {
                    total: comparaison?.plateforme.totalEtablissements ?? platformStats.total,
                })}
            </p>
            <div className="space-y-[var(--space-sm)]">
                {comparaisons.map((c) => {
                    const ecart = c.valeur - c.moyenne;
                    const estAuDessus = ecart >= 0;
                    const pctBar = c.moyenne > 0 ? Math.min(Math.round((c.valeur / (c.moyenne * 2)) * 100), 100) : 50;
                    return (
                        <div key={c.label} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-[var(--gap-xxs)]">
                                    <c.icon className="h-3.5 w-3.5" style={{ color: c.color }} />
                                    <span className="text-xs font-medium" style={{ color: 'var(--color-texte)' }}>{c.label}</span>
                                </div>
                                <div className="flex items-center gap-[var(--gap-xs)]">
                                    <span className="text-sm font-bold" style={{ color: 'var(--color-texte)' }}>
                                        {c.valeur.toLocaleString('fr-FR')}{c.unite}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                        {t('etablissements.detail.activite.comparaison.moyenne', 'moy.')}&nbsp;
                                        {c.moyenne.toLocaleString('fr-FR')}{c.unite}
                                    </span>
                                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium`}
                                        style={{ color: estAuDessus ? 'var(--color-success-600)' : 'var(--color-warning-600)' }}>
                                        {estAuDessus
                                            ? <ArrowUpRight className="h-3 w-3" />
                                            : <ArrowDownRight className="h-3 w-3" />
                                        }
                                        {estAuDessus ? '+' : ''}{ecart}{c.unite}
                                    </span>
                                </div>
                            </div>
                            {/* Barre de positionnement */}
                            <div className="relative w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                                {/* Marqueur moyenne */}
                                <div className="absolute top-0 bottom-0 w-0.5 z-10" style={{
                                    left: '50%',
                                    backgroundColor: 'var(--color-texte-muted)',
                                }} />
                                {/* Barre valeur */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pctBar}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: estAuDessus ? 'var(--color-success-500)' : 'var(--color-warning-500)' }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// =============================================
// Tab 5 — Finances & Facturation
// =============================================

const STATUT_FACTURE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
    PAYEE: { label: 'Payée', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300' },
    EMISE: { label: 'Émise', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
    EN_RETARD: { label: 'En retard', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' },
    PARTIELLEMENT_PAYEE: { label: 'Partielle', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300' },
    BROUILLON: { label: 'Brouillon', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300' },
    ANNULEE: { label: 'Annulée', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400' },
    EN_PAIEMENT: { label: 'En paiement', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300' },
    AVOIR: { label: 'Avoir', bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-300' },
};

function FinancesTab({ factures, config, activite, evolutionPaiements }: {
    factures: FactureEtablissement[];
    config?: EtablissementConfig;
    activite?: ActiviteEtablissementResult;
    evolutionPaiements?: EvolutionPaiementMois[];
}) {
    const { t } = useTranslation('admin');
    const finances = activite?.finances;

    // Calculs résumé
    const totalFacture = factures.reduce((sum, f) => sum + f.montantTotal, 0);
    const totalPaye = factures.reduce((sum, f) => sum + f.montantPaye, 0);
    const totalEnAttente = totalFacture - totalPaye;
    const nbPayees = factures.filter(f => f.statut === 'PAYEE').length;
    const nbEnRetard = factures.filter(f => f.statut === 'EN_RETARD').length;
    const tauxRecouvrement = totalFacture > 0 ? Math.round((totalPaye / totalFacture) * 100) : 0;

    // Distribution des statuts
    const distributionStatuts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const f of factures) {
            counts.set(f.statut, (counts.get(f.statut) || 0) + 1);
        }
        return Array.from(counts.entries())
            .map(([statut, count]) => ({ statut, count, pct: factures.length > 0 ? (count / factures.length) * 100 : 0 }))
            .sort((a, b) => b.count - a.count);
    }, [factures]);

    // Export CSV des factures
    const handleExportFacturesCSV = useCallback(() => {
        if (!factures.length) return;
        const headers = ['Date émission', 'Numéro', 'Montant HT', 'TVA', 'Montant total', 'Montant payé', 'Reste', 'Statut', 'Échéance'];
        const rows = factures.map((f) => [
            f.dateEmission ? new Date(f.dateEmission).toLocaleDateString('fr-FR') : '',
            f.numero || f.id?.substring(0, 8) || '',
            (f.montantHT ?? 0).toFixed(2),
            (f.montantTVA ?? 0).toFixed(2),
            (f.montantTotal ?? 0).toFixed(2),
            (f.montantPaye ?? 0).toFixed(2),
            ((f.montantTotal ?? 0) - (f.montantPaye ?? 0)).toFixed(2),
            f.statut || '',
            f.dateEcheance ? new Date(f.dateEcheance).toLocaleDateString('fr-FR') : '',
        ]);
        const csv = [headers.join(';'), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n');
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factures_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [factures]);

    return (
        <div className="space-y-[var(--gap-lg)]">
            {/* Bouton export */}
            {factures.length > 0 && (
                <div className="flex justify-end">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExportFacturesCSV}
                        className="inline-flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] text-sm font-medium transition-colors"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte-muted)' }}
                    >
                        <Download className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                        {t('etablissements.exporterFactures', 'Exporter factures (CSV)')}
                    </motion.button>
                </div>
            )}
            {/* ===== Section 1 — Résumé financier ===== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--gap-md)]">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-[var(--space-sm)]"
                    style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                >
                    <div className="flex items-center gap-[var(--gap-xs)]">
                        <DollarSign className="h-[var(--icon-md)] w-[var(--icon-md)]" style={{ color: 'var(--color-success-600)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.totalFacture', 'Total facturé')}
                        </span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: 'var(--color-texte)' }}>
                        {totalFacture.toLocaleString('fr-FR')} <span className="text-sm font-normal" style={{ color: 'var(--color-texte-muted)' }}>FCFA</span>
                    </span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-[var(--space-sm)]"
                    style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                >
                    <div className="flex items-center gap-[var(--gap-xs)]">
                        <CheckCircle2 className="h-[var(--icon-md)] w-[var(--icon-md)]" style={{ color: 'var(--color-dominant-600)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.totalPaye', 'Total payé')}
                        </span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: 'var(--color-success-600)' }}>
                        {totalPaye.toLocaleString('fr-FR')} <span className="text-sm font-normal" style={{ color: 'var(--color-texte-muted)' }}>FCFA</span>
                    </span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-[var(--space-sm)]"
                    style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                >
                    <div className="flex items-center gap-[var(--gap-xs)]">
                        <AlertCircle className="h-[var(--icon-md)] w-[var(--icon-md)]" style={{ color: 'var(--color-warning-600)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.enAttente', 'En attente')}
                        </span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: totalEnAttente > 0 ? 'var(--color-warning-600)' : 'var(--color-texte)' }}>
                        {totalEnAttente.toLocaleString('fr-FR')} <span className="text-sm font-normal" style={{ color: 'var(--color-texte-muted)' }}>FCFA</span>
                    </span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-[var(--space-sm)]"
                    style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                >
                    <div className="flex items-center gap-[var(--gap-xs)]">
                        <Receipt className="h-[var(--icon-md)] w-[var(--icon-md)]" style={{ color: 'var(--color-info-600)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.nbFactures', 'Factures')}
                        </span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: 'var(--color-texte)' }}>
                        {factures.length}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                        {nbPayees} {t('etablissements.detail.finances.payees', 'payées')}
                        {nbEnRetard > 0 && (
                            <span style={{ color: 'var(--color-danger-600)' }}> · {nbEnRetard} en retard</span>
                        )}
                    </span>
                </motion.div>
            </div>

            {/* ===== Taux de recouvrement + Distribution statuts ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-lg)]">
                {/* Taux de recouvrement */}
                <SectionCard title={t('etablissements.detail.finances.tauxRecouvrement', 'Taux de recouvrement')} icon={TrendingUp}>
                    <div className="space-y-[var(--space-sm)]">
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-bold" style={{ color: tauxRecouvrement >= 80 ? 'var(--color-success-600)' : tauxRecouvrement >= 50 ? 'var(--color-warning-600)' : 'var(--color-danger-600)' }}>
                                {tauxRecouvrement}%
                            </span>
                            <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                {totalPaye.toLocaleString('fr-FR')} / {totalFacture.toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${tauxRecouvrement}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: tauxRecouvrement >= 80 ? 'var(--color-success-500)' : tauxRecouvrement >= 50 ? 'var(--color-warning-500)' : 'var(--color-danger-500)' }}
                            />
                        </div>
                        {totalEnAttente > 0 && (
                            <p className="text-xs" style={{ color: 'var(--color-warning-600)' }}>
                                <AlertCircle className="inline h-3 w-3 mr-1" />
                                {totalEnAttente.toLocaleString('fr-FR')} FCFA {t('etablissements.detail.finances.enAttenteReste', 'en attente de paiement')}
                            </p>
                        )}
                    </div>
                </SectionCard>

                {/* Distribution des statuts */}
                <SectionCard title={t('etablissements.detail.finances.distributionStatuts', 'Distribution des statuts')} icon={Receipt}>
                    {distributionStatuts.length > 0 ? (
                        <div className="flex flex-col sm:flex-row items-center gap-[var(--gap-lg)]">
                            {/* Donut SVG animé */}
                            {(() => {
                                const colorMap: Record<string, string> = {
                                    PAYEE: 'var(--color-success-500)',
                                    EMISE: 'var(--color-info-500)',
                                    EN_RETARD: 'var(--color-danger-500)',
                                    PARTIELLEMENT_PAYEE: 'var(--color-warning-500)',
                                    BROUILLON: 'var(--color-texte-muted)',
                                    ANNULEE: 'var(--color-texte-muted)',
                                    EN_PAIEMENT: 'var(--color-accent-500)',
                                    AVOIR: 'var(--color-teal-500, #14b8a6)',
                                };
                                const R = 40;
                                const C = 2 * Math.PI * R;
                                let cumul = 0;
                                return (
                                    <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
                                        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                                            {/* Fond */}
                                            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-bordure)" strokeWidth="14" />
                                            {/* Segments */}
                                            {distributionStatuts.map(({ statut, pct }) => {
                                                const dashLen = (pct / 100) * C;
                                                const offset = -(cumul / 100) * C;
                                                cumul += pct;
                                                return (
                                                    <motion.circle
                                                        key={statut}
                                                        cx="60" cy="60" r={R}
                                                        fill="none"
                                                        strokeWidth="14"
                                                        strokeLinecap="butt"
                                                        style={{ stroke: colorMap[statut] || 'var(--color-texte-muted)' }}
                                                        initial={{ strokeDasharray: '0 ' + C, strokeDashoffset: '0' }}
                                                        animate={{ strokeDasharray: `${dashLen} ${C - dashLen}`, strokeDashoffset: `${offset}` }}
                                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    />
                                                );
                                            })}
                                        </svg>
                                        {/* Centre — total */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-lg font-bold leading-none" style={{ color: 'var(--color-texte)' }}>{factures.length}</span>
                                            <span className="text-[0.6rem]" style={{ color: 'var(--color-texte-muted)' }}>
                                                {t('etablissements.detail.finances.factures', 'factures')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}
                            {/* Barres + légende */}
                            <div className="flex-1 min-w-0 space-y-[var(--space-sm)]">
                                {/* Barre empilée */}
                                <div className="h-4 rounded-full overflow-hidden flex" style={{ backgroundColor: 'var(--color-bordure)' }}>
                                    {distributionStatuts.map(({ statut, pct }) => {
                                        const cfg = STATUT_FACTURE_LABELS[statut] || STATUT_FACTURE_LABELS.BROUILLON;
                                        const colorMap: Record<string, string> = {
                                            PAYEE: 'var(--color-success-500)',
                                            EMISE: 'var(--color-info-500)',
                                            EN_RETARD: 'var(--color-danger-500)',
                                            PARTIELLEMENT_PAYEE: 'var(--color-warning-500)',
                                            BROUILLON: 'var(--color-texte-muted)',
                                            ANNULEE: 'var(--color-texte-muted)',
                                            EN_PAIEMENT: 'var(--color-accent-500)',
                                            AVOIR: 'var(--color-teal-500, #14b8a6)',
                                        };
                                        return (
                                            <motion.div
                                                key={statut}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.5 }}
                                                className="h-full"
                                                style={{ backgroundColor: colorMap[statut] || 'var(--color-texte-muted)' }}
                                                title={`${cfg.label}: ${Math.round(pct)}%`}
                                            />
                                        );
                                    })}
                                </div>
                                {/* Légende */}
                                <div className="flex flex-wrap gap-x-[var(--gap-md)] gap-y-[var(--gap-xs)]">
                                    {distributionStatuts.map(({ statut, count }) => {
                                        const cfg = STATUT_FACTURE_LABELS[statut] || STATUT_FACTURE_LABELS.BROUILLON;
                                        return (
                                            <div key={statut} className="flex items-center gap-[var(--gap-xxs)]">
                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${cfg.bg} ${cfg.text}`} />
                                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                                    {cfg.label} ({count})
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-center py-[var(--space-md)]" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.aucuneFacture', 'Aucune facture enregistrée')}
                        </p>
                    )}
                </SectionCard>
            </div>

            {/* ===== Section — Évolution mensuelle des paiements ===== */}
            {evolutionPaiements && evolutionPaiements.length > 0 && (() => {
                const maxMontant = Math.max(...evolutionPaiements.map(m => m.montantTotal), 1);
                const totalEvo = evolutionPaiements.reduce((s, m) => s + m.montantTotal, 0);
                const totalPayeEvo = evolutionPaiements.reduce((s, m) => s + m.montantPaye, 0);
                const tauxEvo = totalEvo > 0 ? Math.round((totalPayeEvo / totalEvo) * 100) : 0;
                return (
                <SectionCard title={t('etablissements.detail.finances.evolutionMensuelle', 'Évolution mensuelle (12 mois)')} icon={BarChart3} fullWidth>
                    <div className="space-y-[var(--space-sm)]">
                        {/* Graphique à barres groupées */}
                        <div className="w-full overflow-x-auto">
                            <div className="flex items-end gap-[clamp(2px,0.3vw,6px)]" style={{ minHeight: 'clamp(80px, 12vw, 160px)' }}>
                                {evolutionPaiements.map((mois, idx) => {
                                    const hauteurTotal = (mois.montantTotal / maxMontant) * 100;
                                    const hauteurPaye = (mois.montantPaye / maxMontant) * 100;
                                    const moisLabel = new Date(mois.mois + '-01').toLocaleDateString('fr-FR', { month: 'short' });
                                    const moisComplet = new Date(mois.mois + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                                    const reste = mois.montantTotal - mois.montantPaye;
                                    return (
                                        <div key={mois.mois} className="relative flex-1 flex flex-col items-center gap-0.5 min-w-[clamp(20px,3vw,40px)] group">
                                            {/* Barres */}
                                            <div className="w-full flex items-end gap-px" style={{ height: `clamp(60px, 10vw, 130px)` }}>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${hauteurTotal}%` }}
                                                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                                                    className="flex-1 rounded-t-sm cursor-pointer"
                                                    style={{ backgroundColor: 'var(--color-bordure)', minWidth: '4px' }}
                                                />
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${hauteurPaye}%` }}
                                                    transition={{ duration: 0.5, delay: idx * 0.05 + 0.1 }}
                                                    className="flex-1 rounded-t-sm cursor-pointer"
                                                    style={{ backgroundColor: 'var(--color-success-500)', minWidth: '4px' }}
                                                />
                                            </div>
                                            {/* Tooltip au hover */}
                                            <div className="absolute z-10 hidden group-hover:block rounded-lg border px-2 py-1 text-xs shadow-lg pointer-events-none"
                                                style={{
                                                    backgroundColor: 'var(--color-surface)',
                                                    borderColor: 'var(--color-bordure)',
                                                    bottom: '100%',
                                                    marginBottom: '4px',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                <p className="font-semibold" style={{ color: 'var(--color-texte)' }}>{moisComplet}</p>
                                                <p style={{ color: 'var(--color-texte-muted)' }}>Total : {mois.montantTotal.toLocaleString('fr-FR')} FCFA</p>
                                                <p style={{ color: 'var(--color-success-600)' }}>Payé : {mois.montantPaye.toLocaleString('fr-FR')} FCFA</p>
                                                {reste > 0 && <p style={{ color: 'var(--color-warning-600)' }}>Reste : {reste.toLocaleString('fr-FR')} FCFA</p>}
                                                <p style={{ color: 'var(--color-texte-muted)' }}>{mois.nbFactures} facture(s)</p>
                                            </div>
                                            {/* Label mois */}
                                            <span className="text-xs truncate w-full text-center" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.55rem, 0.5rem + 0.2vw, 0.7rem)' }}>
                                                {moisLabel}
                                            </span>
                                            {/* Nb factures */}
                                            <span className="text-xs" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.5rem, 0.45rem + 0.15vw, 0.65rem)' }}>
                                                {mois.nbFactures}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Légende + stats */}
                        <div className="flex flex-wrap items-center gap-[var(--gap-md)] text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-bordure)' }} />
                                {t('etablissements.detail.finances.montantTotal', 'Montant total')}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-success-500)' }} />
                                {t('etablissements.detail.finances.montantPaye', 'Montant payé')}
                            </span>
                            <span>
                                {evolutionPaiements.length} {t('etablissements.detail.finances.moisDonnees', 'mois')} · {tauxEvo}% recouvré
                            </span>
                        </div>
                    </div>
                </SectionCard>
                );
            })()}

            {/* État vide — pas de données évolution */}
            {(!evolutionPaiements || evolutionPaiements.length === 0) && (
                <SectionCard title={t('etablissements.detail.finances.evolutionMensuelle', 'Évolution mensuelle (12 mois)')} icon={BarChart3} fullWidth>
                    <div className="flex flex-col items-center justify-center py-[var(--space-xl)] gap-[var(--space-sm)]">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                            <BarChart3 className="h-[var(--icon-lg)] w-[var(--icon-lg)]" style={{ color: 'var(--color-texte-muted)' }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.aucuneEvolution', 'Aucune donnée de paiement sur les 12 derniers mois')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.aucuneEvolutionHint', 'Les graphiques apparaîtront automatiquement dès la première facture enregistrée.')}
                        </p>
                    </div>
                </SectionCard>
            )}

            {/* ===== Section 2 — Abonnement ===== */}
            {config && (
                <SectionCard title={t('etablissements.detail.finances.abonnement', 'Abonnement')} icon={CreditCard}>
                    <InfoGrid>
                        <InfoField icon={CreditCard} label={t('etablissements.detail.config.plan', 'Plan')}
                            value={config.planAbonnement ? (PLAN_LABELS[config.planAbonnement] || config.planAbonnement) : undefined} />
                        <InfoField icon={Calendar} label={t('etablissements.detail.config.expiration', 'Expiration')}
                            value={config.dateExpirationAbonnement
                                ? new Date(config.dateExpirationAbonnement).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
                                : undefined} />
                        {finances?.abonnement?.montantMensuel !== undefined && (
                            <InfoField icon={DollarSign} label={t('etablissements.detail.finances.montantMensuel', 'Montant mensuel')}
                                value={`${finances.abonnement.montantMensuel.toLocaleString('fr-FR')} FCFA`} />
                        )}
                        {finances?.abonnement?.autoRenouvellement !== undefined && (
                            <InfoField icon={RefreshCw} label={t('etablissements.detail.finances.autoRenouvellement', 'Auto-renouvellement')}
                                value={finances.abonnement.autoRenouvellement ? 'Oui' : 'Non'} />
                        )}
                    </InfoGrid>
                </SectionCard>
            )}

            {/* ===== Section 3 — Historique des factures ===== */}
            <SectionCard title={t('etablissements.detail.finances.historique', 'Historique des factures')} icon={FileText} fullWidth>
                {factures.length > 0 ? (
                    <div className="space-y-[var(--space-sm)]">
                        {/* Tableau des factures */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-bordure)' }}>
                                        <th className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                            {t('etablissements.detail.finances.numero', 'N°')}
                                        </th>
                                        <th className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                            {t('etablissements.detail.finances.dateEmission', 'Émission')}
                                        </th>
                                        <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                            {t('etablissements.detail.finances.montantTTC', 'Montant TTC')}
                                        </th>
                                        <th className="text-right py-2 px-2 text-xs font-medium hidden sm:table-cell" style={{ color: 'var(--color-texte-muted)' }}>
                                            {t('etablissements.detail.finances.montantPaye', 'Payé')}
                                        </th>
                                        <th className="text-center py-2 px-2 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                            {t('etablissements.detail.finances.statut', 'Statut')}
                                        </th>
                                        <th className="text-left py-2 px-2 text-xs font-medium hidden md:table-cell" style={{ color: 'var(--color-texte-muted)' }}>
                                            {t('etablissements.detail.finances.echeance', 'Échéance')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {factures.slice(0, 20).map((facture) => {
                                        const statutCfg = STATUT_FACTURE_LABELS[facture.statut] || STATUT_FACTURE_LABELS.BROUILLON;
                                        const reste = facture.montantTotal - facture.montantPaye;
                                        return (
                                            <tr key={facture.id} className="transition-colors hover:bg-[var(--color-surface-alt)]"
                                                style={{ borderBottom: '1px solid var(--color-bordure)' }}>
                                                <td className="py-2 px-2 text-xs font-medium" style={{ color: 'var(--color-texte)' }}>
                                                    {facture.numeroOHADA || facture.numero}
                                                </td>
                                                <td className="py-2 px-2 text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                                    {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="py-2 px-2 text-xs text-right font-mono" style={{ color: 'var(--color-texte)' }}>
                                                    {facture.montantTotal.toLocaleString('fr-FR')}
                                                </td>
                                                <td className="py-2 px-2 text-xs text-right font-mono hidden sm:table-cell" style={{ color: reste <= 0 ? 'var(--color-success-600)' : 'var(--color-texte)' }}>
                                                    {facture.montantPaye.toLocaleString('fr-FR')}
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statutCfg.bg} ${statutCfg.text}`}>
                                                        {statutCfg.label}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-2 text-xs hidden md:table-cell" style={{ color: facture.dateEcheance && new Date(facture.dateEcheance) < new Date() && reste > 0 ? 'var(--color-danger-600)' : 'var(--color-texte-muted)' }}>
                                                    {facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString('fr-FR') : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {factures.length > 20 && (
                            <p className="text-xs text-center pt-2" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.finances.plusFactures', '{{count}} factures au total', { count: factures.length })}
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-center py-[var(--space-md)]" style={{ color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.detail.finances.aucuneFacture', 'Aucune facture enregistrée')}
                    </p>
                )}
            </SectionCard>
        </div>
    );
}

// =============================================
// Tab 4 — Configuration & Modules
// =============================================

function ConfigurationTab({ config, etablissement, configComplete, stats, utilisateurs, etablissementId, onRefetch }: {
    config: EtablissementConfig;
    etablissement: Etablissement;
    configComplete?: ConfigCompleteResult;
    stats?: EtablissementDetailStats;
    utilisateurs?: UtilisateursResumeResult;
    etablissementId: string;
    onRefetch: () => void;
}) {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const [syncing, setSyncing] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    // Action rapide : synchroniser la configuration
    const handleSyncConfig = useCallback(async () => {
        setSyncing(true);
        try {
            await apiClient.post(`/api/platform/etablissements/${etablissementId}/sync-config`);
            toast.success(t('etablissements.detail.config.syncSuccess', 'Configuration synchronisée'));
            onRefetch();
        } catch {
            toast.error(t('etablissements.detail.config.syncError', 'Erreur de synchronisation'));
        } finally {
            setSyncing(false);
        }
    }, [etablissementId, onRefetch, t]);

    // Action rapide : réinitialiser les paramètres (avec confirmation)
    const handleResetConfig = useCallback(async () => {
        setConfirmReset(false);
        try {
            await apiClient.post(`/api/platform/etablissements/${etablissementId}/reset-config`);
            toast.success(t('etablissements.detail.config.resetSuccess', 'Configuration réinitialisée'));
            onRefetch();
        } catch {
            toast.error(t('etablissements.detail.config.resetError', 'Erreur de réinitialisation'));
        }
    }, [etablissementId, onRefetch, t]);

    // Modules actifs depuis config-complete (ou fallback vide)
    const modules = configComplete?.modulesActifs || [];
    const modulesActifsCount = configComplete?.resume?.totalModulesActifs ?? modules.filter(m => m.actif).length;
    const modulesTotal = configComplete?.resume?.totalModulesCatalogue ?? modules.length;

    // Grouper les modules par catégorie
    const modulesParCategorie = useMemo(() => {
        const grouped = new Map<string, typeof modules>();
        for (const mod of modules) {
            const cat = mod.categorie || 'AUTRE';
            if (!grouped.has(cat)) grouped.set(cat, []);
            grouped.get(cat)!.push(mod);
        }
        return grouped;
    }, [modules]);

    // Labels catégories (alignées sur CategorieModule backend : CRITIQUE | PREMIUM | ADDON)
    const CATEGORIE_LABELS: Record<string, string> = {
        CRITIQUE: t('etablissements.detail.config.catCritique', 'Système'),
        PREMIUM: t('etablissements.detail.config.catPremium', 'Premium'),
        ADDON: t('etablissements.detail.config.catAddon', 'Add-on'),
    };

    // Score de complétion de configuration
    const scoreCompletion = useMemo(() => {
        let score = 0;
        let total = 5;
        // Plan défini
        if (config.planAbonnement) score++;
        // Modules actifs (>50%)
        if (modulesTotal > 0 && modulesActifsCount / modulesTotal > 0.5) score++;
        // Cycles configurés
        if (config.cyclesActifs && config.cyclesActifs.length > 0) score++;
        // Quotas définis
        if ((config.maxEleves ?? 0) > 0 || (config.maxUtilisateurs ?? 0) > 0) score++;
        // Bulletin configuré
        if (config.configurationBulletin && Object.values(config.configurationBulletin).some(v => v !== undefined && v !== null)) score++;
        return { score, total, pct: Math.round((score / total) * 100) };
    }, [config, modulesActifsCount, modulesTotal]);

    // Données quotas (utilisation réelle vs limites configurées)
    const quotaItems = useMemo(() => {
        const items: { label: string; icon: LucideIcon; current: number; max: number; color: string }[] = [];

        // Élèves
        const nbEleves = stats?.nombreEleves ?? etablissement.effectifActuel ?? 0;
        const maxEleves = config.maxEleves ?? etablissement.effectifMax ?? 0;
        if (maxEleves > 0) {
            items.push({
                label: t('etablissements.detail.config.quotas.eleves', 'Élèves'),
                icon: GraduationCap,
                current: nbEleves,
                max: maxEleves,
                color: 'var(--color-accent-600)',
            });
        }

        // Utilisateurs
        const nbUtilisateurs = utilisateurs?.total ?? 0;
        const maxUtilisateurs = config.maxUtilisateurs ?? 0;
        if (maxUtilisateurs > 0) {
            items.push({
                label: t('etablissements.detail.config.quotas.utilisateurs', 'Utilisateurs'),
                icon: Users,
                current: nbUtilisateurs,
                max: maxUtilisateurs,
                color: 'var(--color-info-600)',
            });
        }

        // Classes
        const nbClasses = stats?.nombreClasses ?? 0;
        const maxClasses = config.maxClasses ?? 0;
        if (maxClasses > 0) {
            items.push({
                label: t('etablissements.detail.config.quotas.classes', 'Classes'),
                icon: BookOpen,
                current: nbClasses,
                max: maxClasses,
                color: 'var(--color-success-600)',
            });
        }

        return items;
    }, [stats, utilisateurs, config, etablissement, t]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-lg)]">
            {/* Actions rapides */}
            <SectionCard title={t('etablissements.detail.config.actionsRapides', 'Actions rapides')} icon={RefreshCw} fullWidth>
                <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSyncConfig}
                        disabled={syncing}
                        className="inline-flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] text-sm font-medium transition-colors disabled:opacity-50"
                        style={{
                            borderColor: 'var(--color-dominant-200)',
                            backgroundColor: 'var(--color-dominant-50)',
                            color: 'var(--color-dominant-700)',
                        }}
                    >
                        <RefreshCw className={`h-[var(--icon-sm)] w-[var(--icon-sm)] ${syncing ? 'animate-spin' : ''}`} />
                        {t('etablissements.detail.config.syncConfig', 'Synchroniser')}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setConfirmReset(true)}
                        className="inline-flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] text-sm font-medium transition-colors"
                        style={{
                            borderColor: 'var(--color-warning-200)',
                            backgroundColor: 'var(--color-warning-50)',
                            color: 'var(--color-warning-700)',
                        }}
                    >
                        <AlertCircle className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                        {t('etablissements.detail.config.resetConfig', 'Réinitialiser les paramètres')}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate({ to: '/platform/etablissements/$id', params: { id: etablissementId }, search: { tab: 'sante' } })}
                        className="inline-flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] text-sm font-medium transition-colors"
                        style={{
                            borderColor: 'var(--color-success-200)',
                            backgroundColor: 'var(--color-success-50)',
                            color: 'var(--color-success-700)',
                        }}
                    >
                        <Heart className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                        {t('etablissements.detail.config.voirSante', 'Voir la santé')}
                    </motion.button>
                </div>
                {/* Confirmation reset */}
                {confirmReset && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-col gap-[var(--gap-sm)] rounded-lg border p-[clamp(0.75rem,0.6rem+0.4vw,1rem)]"
                        style={{ borderColor: 'var(--color-warning-300)', backgroundColor: 'var(--color-warning-50)' }}
                    >
                        <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-warning-800)' }}>
                            {t('etablissements.detail.config.resetConfirmMessage', 'Cette action va réinitialiser tous les paramètres de configuration de cet établissement.')}
                        </p>
                        <div className="flex items-center gap-[var(--gap-sm)]">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleResetConfig}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white"
                                style={{ backgroundColor: 'var(--color-warning-600)' }}
                            >
                                {t('etablissements.detail.config.resetConfig', 'Réinitialiser')}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setConfirmReset(false)}
                                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium"
                                style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte-muted)' }}
                            >
                                {t('common.actions.annuler', 'Annuler')}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </SectionCard>

            {/* Score de complétion */}
            <SectionCard title={t('etablissements.detail.config.scoreTitre', 'Complétion configuration')} icon={Settings} fullWidth>
                <div className="flex items-center gap-[var(--gap-lg)]">
                    {/* Jauge circulaire */}
                    <div className="relative shrink-0">
                        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                            <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6"
                                style={{ stroke: 'var(--color-bordure)' }} />
                            <motion.circle cx="40" cy="40" r="34" fill="none" strokeWidth="6"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: '0 214' }}
                                animate={{ strokeDasharray: `${(scoreCompletion.pct / 100) * 214} 214` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                style={{ stroke: scoreCompletion.pct >= 80 ? 'var(--color-success-500)' : scoreCompletion.pct >= 50 ? 'var(--color-warning-500)' : 'var(--color-danger-500)' }}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold"
                            style={{ color: scoreCompletion.pct >= 80 ? 'var(--color-success-600)' : scoreCompletion.pct >= 50 ? 'var(--color-warning-600)' : 'var(--color-danger-600)' }}>
                            {scoreCompletion.pct}%
                        </span>
                    </div>
                    {/* Détails */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-[var(--gap-sm)]">
                        {[
                            { label: t('etablissements.detail.config.plan', 'Plan'), ok: !!config.planAbonnement },
                            { label: t('etablissements.detail.config.modulesActifs', 'Modules'), ok: modulesTotal > 0 && modulesActifsCount / modulesTotal > 0.5 },
                            { label: t('etablissements.detail.config.cycles', 'Cycles'), ok: !!config.cyclesActifs?.length },
                            { label: t('etablissements.detail.config.quotas.titre', 'Quotas'), ok: (config.maxEleves ?? 0) > 0 || (config.maxUtilisateurs ?? 0) > 0 },
                            { label: t('etablissements.detail.config.bulletin', 'Bulletin'), ok: !!config.configurationBulletin && Object.values(config.configurationBulletin).some(v => v != null) },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-[var(--gap-xxs)]">
                                {item.ok ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-success-500)' }} />
                                ) : (
                                    <XCircle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-danger-400)' }} />
                                )}
                                <span className="text-xs" style={{ color: item.ok ? 'var(--color-texte)' : 'var(--color-texte-muted)' }}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionCard>

            {/* Abonnement — carte enrichie avec countdown et alertes */}
            <SectionCard title={t('etablissements.detail.config.abonnement', 'Abonnement')} icon={CreditCard} fullWidth>
                {(() => {
                    const plan = config.planAbonnement;
                    const expiration = config.dateExpirationAbonnement ? new Date(config.dateExpirationAbonnement) : null;
                    const maintenant = new Date();
                    const joursRestants = expiration ? Math.ceil((expiration.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    const estExpire = joursRestants !== null && joursRestants < 0;
                    const expireBientot = joursRestants !== null && joursRestants >= 0 && joursRestants <= 30;
                    const statutColor = estExpire
                        ? { bg: 'var(--color-danger-50)', border: 'var(--color-danger-200)', text: 'var(--color-danger-700)', dot: 'bg-red-500' }
                        : expireBientot
                            ? { bg: 'var(--color-warning-50)', border: 'var(--color-warning-200)', text: 'var(--color-warning-700)', dot: 'bg-yellow-500' }
                            : { bg: 'var(--color-success-50)', border: 'var(--color-success-200)', text: 'var(--color-success-700)', dot: 'bg-green-500' };
                    const statutLabel = estExpire
                        ? t('etablissements.detail.config.abonnementExpire', 'Expiré')
                        : expireBientot
                            ? t('etablissements.detail.config.expireBientot', 'Expire bientôt')
                            : t('etablissements.detail.config.actif', 'Actif');

                    return (
                        <div className="space-y-[var(--space-md)]">
                            {/* Ligne principale : plan + statut */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-[var(--gap-sm)]">
                                {/* Badge plan */}
                                <span className="inline-flex items-center gap-[var(--gap-xs)] rounded-full px-[clamp(0.5rem,0.4rem+0.3vw,1rem)] py-[clamp(0.25rem,0.2rem+0.1vw,0.5rem)] text-sm font-semibold"
                                    style={{
                                        backgroundColor: plan === 'enterprise' ? 'var(--color-warning-100)' : plan === 'premium' ? 'var(--color-accent-100)' : plan === 'standard' ? 'var(--color-info-100)' : 'var(--color-surface-alt)',
                                        color: plan === 'enterprise' ? 'var(--color-warning-700)' : plan === 'premium' ? 'var(--color-accent-700)' : plan === 'standard' ? 'var(--color-info-700)' : 'var(--color-texte-muted)',
                                    }}>
                                    <CreditCard className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                    {plan ? (PLAN_LABELS[plan] || plan) : t('etablissements.detail.config.aucunPlan', 'Aucun plan')}
                                </span>
                                {/* Badge statut */}
                                <span className="inline-flex items-center gap-[var(--gap-xxs)] rounded-full px-2 py-0.5 text-xs font-medium"
                                    style={{ backgroundColor: statutColor.bg, color: statutColor.text, border: `1px solid ${statutColor.border}` }}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statutColor.dot}`} />
                                    {statutLabel}
                                </span>
                                {/* Countdown */}
                                {joursRestants !== null && (
                                    <span className="text-xs font-medium" style={{ color: estExpire ? 'var(--color-danger-600)' : expireBientot ? 'var(--color-warning-600)' : 'var(--color-texte-muted)' }}>
                                        {estExpire
                                            ? t('etablissements.detail.config.expireDepuis', 'Expiré depuis {{jours}} jour(s)', { jours: Math.abs(joursRestants) })
                                            : joursRestants <= 30
                                                ? t('etablissements.detail.config.joursRestants', '{{jours}} jour(s) restant(s)', { jours: joursRestants })
                                                : t('etablissements.detail.config.expireLe', 'Expire le {{date}}', { date: expiration.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) })
                                        }
                                    </span>
                                )}
                                <div className="sm:ml-auto flex items-center gap-[var(--gap-xs)]">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate({ to: '/platform/etablissements/$id', params: { id: etablissementId }, search: { tab: 'configuration' } })}
                                        className="inline-flex items-center gap-[var(--gap-xxs)] rounded-lg border px-[clamp(0.375rem,0.3rem+0.2vw,0.75rem)] py-[clamp(0.25rem,0.2rem+0.1vw,0.5rem)] text-xs font-medium transition-colors"
                                        style={{ borderColor: 'var(--color-dominant-200)', backgroundColor: 'var(--color-dominant-50)', color: 'var(--color-dominant-700)' }}
                                    >
                                        <Edit className="h-3 w-3" />
                                        {t('etablissements.detail.config.changerPlan', 'Changer le plan')}
                                    </motion.button>
                                </div>
                            </div>
                            {/* Barre de progression expiration (30 jours = critique) */}
                            {joursRestants !== null && joursRestants >= 0 && (
                                <div className="space-y-[var(--space-xs)]">
                                    <div className="flex justify-between text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                        <span>{t('etablissements.detail.config.dureeAbonnement', 'Durée abonnement')}</span>
                                        <span style={{ color: joursRestants <= 30 ? 'var(--color-warning-600)' : 'var(--color-texte-muted)' }}>
                                            {joursRestants}j restants
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                                        <motion.div
                                            initial={{ width: '100%' }}
                                            animate={{ width: `${Math.max(Math.min((joursRestants / 365) * 100, 100), 2)}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: joursRestants <= 7 ? 'var(--color-danger-500)' : joursRestants <= 30 ? 'var(--color-warning-500)' : 'var(--color-success-500)' }}
                                        />
                                    </div>
                                </div>
                            )}
                            {/* Détails */}
                            <InfoGrid>
                                <InfoField icon={Calendar} label={t('etablissements.detail.config.expiration', 'Expiration')}
                                    value={expiration
                                        ? expiration.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
                                        : undefined} />
                                <InfoField icon={CreditCard} label={t('etablissements.detail.config.autoRenouvellement', 'Auto-renouvellement')}
                                    value={config.autoRenouvellement !== undefined
                                        ? (config.autoRenouvellement ? t('common.oui', 'Oui') : t('common.non', 'Non'))
                                        : joursRestants !== null ? t('common.oui', 'Oui') : undefined} />
                            </InfoGrid>
                        </div>
                    );
                })()}
            </SectionCard>

            {/* Quotas — barres de progression */}
            <SectionCard title={t('etablissements.detail.config.quotas.titre', 'Utilisation des quotas')} icon={Package}>
                {quotaItems.length > 0 ? (
                    <div className="space-y-[var(--space-md)]">
                        {quotaItems.map((q) => {
                            const pct = Math.min(Math.round((q.current / q.max) * 100), 100);
                            const barColor = pct >= 90 ? 'var(--color-danger-500)' : pct >= 60 ? 'var(--color-warning-500)' : 'var(--color-success-500)';
                            return (
                                <div key={q.label} className="space-y-[var(--space-xs)]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-[var(--gap-xxs)]">
                                            <q.icon className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color: q.color }} />
                                            <span className="text-xs font-medium" style={{ color: 'var(--color-texte)' }}>{q.label}</span>
                                        </div>
                                        <span className="text-xs font-medium" style={{ color: barColor }}>
                                            {t('etablissements.detail.config.quotas.pourcentage', '{{pct}}% utilisé', { pct })}
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: barColor }}
                                        />
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                        {t('etablissements.detail.config.quotas.utiliseSur', '{{utilise}} sur {{max}}', { utilise: q.current.toLocaleString('fr-FR'), max: q.max.toLocaleString('fr-FR') })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <InfoGrid>
                        <InfoField icon={GraduationCap} label={t('etablissements.detail.config.maxEleves', 'Max élèves')}
                            value={config.maxEleves?.toLocaleString('fr-FR')} />
                        <InfoField icon={Users} label={t('etablissements.detail.config.maxUtilisateurs', 'Max utilisateurs')}
                            value={config.maxUtilisateurs?.toLocaleString('fr-FR')} />
                        <InfoField icon={BookOpen} label={t('etablissements.detail.config.maxClasses', 'Max classes')}
                            value={config.maxClasses?.toLocaleString('fr-FR')} />
                        <InfoField icon={Package} label={t('etablissements.detail.config.stockage', 'Stockage max')}
                            value={config.stockageMaxMB ? `${config.stockageMaxMB} MB` : undefined} />
                    </InfoGrid>
                )}
                {/* Stockage (toujours affiché en complément si défini) */}
                {config.stockageMaxMB && quotaItems.length > 0 && (
                    <div className="mt-[var(--space-sm)] pt-[var(--space-sm)]" style={{ borderTop: '1px solid var(--color-bordure)' }}>
                        <InfoField icon={Package} label={t('etablissements.detail.config.stockage', 'Stockage max')}
                            value={`${config.stockageMaxMB} MB`} />
                    </div>
                )}
            </SectionCard>

            {/* Modules actifs — résumé + grille */}
            <SectionCard title={t('etablissements.detail.config.modulesActifs', 'Modules actifs')} icon={Package} fullWidth>
                {/* Résumé */}
                <div className="flex items-center gap-[var(--gap-sm)] mb-[var(--space-md)]">
                    <span className="text-2xl font-bold" style={{ color: 'var(--color-dominant-600)' }}>
                        {modulesActifsCount}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.detail.config.modulesSur', 'actifs sur')} {modulesTotal}
                    </span>
                    {/* Barre de progression */}
                    <div className="flex-1 h-2 rounded-full overflow-hidden ml-2" style={{ backgroundColor: 'var(--color-bordure)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${modulesTotal > 0 ? (modulesActifsCount / modulesTotal) * 100 : 0}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: 'var(--color-dominant-500)' }}
                        />
                    </div>
                </div>

                {/* Modules groupés par catégorie */}
                {modulesParCategorie.size > 0 ? (
                    <div className="space-y-[var(--space-md)]">
                        {Array.from(modulesParCategorie.entries()).map(([categorie, mods]) => (
                            <div key={categorie}>
                                <p className="text-xs font-semibold mb-[var(--space-xs)]" style={{ color: 'var(--color-texte-muted)' }}>
                                    {CATEGORIE_LABELS[categorie] || categorie}
                                    <span className="ml-1 font-normal" style={{ color: 'var(--color-texte-muted)' }}>
                                        ({mods.filter(m => m.actif).length}/{mods.length})
                                    </span>
                                </p>
                                <div className="flex flex-wrap gap-[var(--gap-xs)]">
                                    {mods.map((mod) => (
                                        <span
                                            key={mod.code}
                                            className="inline-flex items-center gap-[var(--gap-xxs)] rounded-full px-[clamp(0.375rem,0.3rem+0.2vw,0.75rem)] py-[clamp(0.125rem,0.1rem+0.1vw,0.375rem)] text-xs font-medium"
                                            style={{
                                                backgroundColor: mod.actif ? 'var(--color-success-50)' : 'var(--color-surface-alt)',
                                                color: mod.actif ? 'var(--color-success-700)' : 'var(--color-texte-muted)',
                                                border: `1px solid ${mod.actif ? 'var(--color-success-200)' : 'var(--color-bordure)'}`,
                                            }}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${mod.actif ? 'bg-green-400' : 'bg-gray-400'}`} />
                                            {mod.nom}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm" style={{ color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.detail.config.aucunModule', 'Aucun module configuré')}
                    </p>
                )}
            </SectionCard>

            {/* Cycles actifs */}
            <SectionCard title={t('etablissements.detail.config.cycles', 'Cycles actifs')} icon={Layers}>
                {config.cyclesActifs && config.cyclesActifs.length > 0 ? (
                    <div>
                        <div className="flex items-center gap-[var(--gap-sm)] mb-[var(--space-sm)]">
                            <span className="text-2xl font-bold" style={{ color: 'var(--color-dominant-600)' }}>
                                {config.cyclesActifs.length}
                            </span>
                            <span className="text-sm" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.config.cyclesActifsCount', 'cycle(s) actif(s)')}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-[var(--gap-xs)]">
                            {config.cyclesActifs.map((cycleId, idx) => (
                                <span key={idx}
                                    className="inline-flex items-center gap-[var(--gap-xxs)] rounded-full px-[clamp(0.375rem,0.3rem+0.2vw,0.75rem)] py-[clamp(0.125rem,0.1rem+0.1vw,0.375rem)] text-xs font-medium"
                                    style={{
                                        backgroundColor: 'var(--color-dominant-100)',
                                        color: 'var(--color-dominant-700)',
                                    }}>
                                    <Layers className="h-3 w-3" />
                                    {t(`etablissements.detail.config.cycleLabel`, 'Cycle')} {idx + 1}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm" style={{ color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.detail.config.aucunCycle', 'Aucun cycle configuré')}
                    </p>
                )}
            </SectionCard>

            {/* Configuration bulletin */}
            {config.configurationBulletin && (
                <SectionCard title={t('etablissements.detail.config.bulletin', 'Configuration bulletin')} icon={FileText} fullWidth>
                    <div className="flex flex-wrap gap-[var(--gap-sm)]">
                        {config.configurationBulletin.style && (
                            <ConfigBadge label={t('etablissements.detail.config.style', 'Style')} value={config.configurationBulletin.style} />
                        )}
                        {config.configurationBulletin.afficherRang !== undefined && (
                            <ConfigBadge label={t('etablissements.detail.config.rang', 'Rang')} value={config.configurationBulletin.afficherRang ? 'Oui' : 'Non'} />
                        )}
                        {config.configurationBulletin.afficherMoyenneGenerale !== undefined && (
                            <ConfigBadge label={t('etablissements.detail.config.moyenne', 'Moyenne générale')} value={config.configurationBulletin.afficherMoyenneGenerale ? 'Oui' : 'Non'} />
                        )}
                        {config.configurationBulletin.afficherAppreciation !== undefined && (
                            <ConfigBadge label={t('etablissements.detail.config.appreciation', 'Appréciation')} value={config.configurationBulletin.afficherAppreciation ? 'Oui' : 'Non'} />
                        )}
                        {config.configurationBulletin.afficherPhoto !== undefined && (
                            <ConfigBadge label={t('etablissements.detail.config.photo', 'Photo')} value={config.configurationBulletin.afficherPhoto ? 'Oui' : 'Non'} />
                        )}
                        {config.configurationBulletin.afficherCourbeProgression !== undefined && (
                            <ConfigBadge label={t('etablissements.detail.config.courbe', 'Courbe progression')} value={config.configurationBulletin.afficherCourbeProgression ? 'Oui' : 'Non'} />
                        )}
                    </div>
                </SectionCard>
            )}
        </div>
    );
}

// =============================================
// Tab 6 — Utilisateurs & Rôles
// =============================================

function UtilisateursTab({ utilisateurs }: { utilisateurs: UtilisateursResumeResult }) {
    const { t } = useTranslation('admin');

    const ROLE_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
        ADMIN: { bg: 'bg-red-100', text: 'text-red-700', hex: '#ef4444' },
        CHEF_ETABLISSEMENT: { bg: 'bg-purple-100', text: 'text-purple-700', hex: '#a855f7' },
        ENSEIGNANT: { bg: 'bg-blue-100', text: 'text-blue-700', hex: '#3b82f6' },
        PERSONNEL: { bg: 'bg-gray-100', text: 'text-gray-700', hex: '#6b7280' },
        PARENT: { bg: 'bg-green-100', text: 'text-green-700', hex: '#22c55e' },
        ELEVE: { bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
        RESPONSABLE_CANTINE: { bg: 'bg-orange-100', text: 'text-orange-700', hex: '#f97316' },
        RESPONSABLE_TRANSPORT: { bg: 'bg-teal-100', text: 'text-teal-700', hex: '#14b8a6' },
    };

    const tauxActifs = utilisateurs.total > 0 ? Math.round((utilisateurs.actifs / utilisateurs.total) * 100) : 0;

    // Export CSV des utilisateurs
    const handleExportUtilisateursCSV = useCallback(() => {
        if (!utilisateurs.derniers?.length) return;
        const headers = ['Nom', 'Prénom', 'Email', 'Rôle', 'Actif', 'Dernière connexion', 'Créé le'];
        const rows = utilisateurs.derniers.map((u) => [
            u.nom || '',
            u.prenom || '',
            u.email || '',
            u.role || '',
            u.actif ? 'Oui' : 'Non',
            u.derniereConnexion ? new Date(u.derniereConnexion).toLocaleDateString('fr-FR') : 'Jamais',
            new Date(u.creeLe).toLocaleDateString('fr-FR'),
        ]);
        const csv = [headers.join(';'), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n');
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utilisateurs_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [utilisateurs]);

    return (
        <div className="space-y-[var(--gap-lg)]">
            {/* Bouton export */}
            {utilisateurs.derniers && utilisateurs.derniers.length > 0 && (
                <div className="flex justify-end">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExportUtilisateursCSV}
                        className="inline-flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] text-sm font-medium transition-colors"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte-muted)' }}
                    >
                        <Download className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                        {t('etablissements.exporterUtilisateurs', 'Exporter utilisateurs (CSV)')}
                    </motion.button>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-lg)]">
            {/* Statistiques globales */}
            <SectionCard title={t('etablissements.detail.utilisateurs.vueEnsemble', 'Vue d\'ensemble')} icon={Users}>
                <div className="grid grid-cols-3 gap-[var(--gap-md)]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-lg p-[clamp(0.75rem,0.6rem+0.4vw,1.25rem)] text-center"
                        style={{ backgroundColor: 'var(--color-surface-alt)', border: '1px solid var(--color-bordure)' }}
                    >
                        <p className="text-[clamp(1.25rem,3vw,2rem)] font-bold" style={{ color: 'var(--color-dominant-600)' }}>
                            {utilisateurs.total}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.utilisateurs.total', 'Total')}
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 }}
                        className="rounded-lg p-[clamp(0.75rem,0.6rem+0.4vw,1.25rem)] text-center"
                        style={{ backgroundColor: 'var(--color-surface-alt)', border: '1px solid var(--color-bordure)' }}
                    >
                        <p className="text-[clamp(1.25rem,3vw,2rem)] font-bold" style={{ color: 'var(--color-success-600)' }}>
                            {utilisateurs.actifs}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.utilisateurs.actifs', 'Actifs')}
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-lg p-[clamp(0.75rem,0.6rem+0.4vw,1.25rem)] text-center"
                        style={{ backgroundColor: 'var(--color-surface-alt)', border: '1px solid var(--color-bordure)' }}
                    >
                        <p className="text-[clamp(1.25rem,3vw,2rem)] font-bold" style={{ color: tauxActifs >= 70 ? 'var(--color-success-600)' : tauxActifs >= 40 ? 'var(--color-warning-600)' : 'var(--color-danger-600)' }}>
                            {tauxActifs}%
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.utilisateurs.tauxActivite', 'Taux activité')}
                        </p>
                    </motion.div>
                </div>

                {/* Barre de progression actifs/inactifs */}
                <div className="mt-[var(--space-md)]">
                    <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'var(--color-success-600)' }}>
                            {t('etablissements.detail.utilisateurs.actifs', 'Actifs')}: {utilisateurs.actifs}
                        </span>
                        <span style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.utilisateurs.inactifs', 'Inactifs')}: {utilisateurs.total - utilisateurs.actifs}
                        </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${tauxActifs}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: 'var(--color-success-500)' }}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Répartition par rôle */}
            <SectionCard title={t('etablissements.detail.utilisateurs.repartitionRoles', 'Répartition par rôle')} icon={Shield}>
                {utilisateurs.parRole.length > 0 ? (
                    <div className="space-y-[var(--space-md)]">
                        {/* Donut chart SVG */}
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
                                    {(() => {
                                        const sorted = [...utilisateurs.parRole].sort((a, b) => b.count - a.count);
                                        const total = sorted.reduce((s, r) => s + r.count, 0) || 1;
                                        let cumPct = 0;
                                        return sorted.map((r) => {
                                            const pct = (r.count / total) * 100;
                                            const colors = ROLE_COLORS[r.code] || { hex: '#9ca3af' };
                                            const circumference = 2 * Math.PI * 52;
                                            const dashLen = (pct / 100) * circumference;
                                            const dashOffset = -(cumPct / 100) * circumference;
                                            cumPct += pct;
                                            return (
                                                <motion.circle
                                                    key={r.code}
                                                    cx="70" cy="70" r="52"
                                                    fill="none" strokeWidth="16"
                                                    stroke={colors.hex}
                                                    strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                                                    strokeDashoffset={dashOffset}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.2, duration: 0.5 }}
                                                />
                                            );
                                        });
                                    })()}
                                </svg>
                                {/* Centre du donut */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-bold" style={{ color: 'var(--color-texte)' }}>
                                        {utilisateurs.total}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                        {t('etablissements.detail.utilisateurs.total', 'Total')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Barres horizontales */}
                        {utilisateurs.parRole
                            .sort((a, b) => b.count - a.count)
                            .map((r, index) => {
                                const colors = ROLE_COLORS[r.code] || { bg: 'bg-gray-100', text: 'text-gray-700', hex: '#9ca3af' };
                                const maxCount = utilisateurs.parRole[0]?.count || 1;
                                const pct = Math.round((r.count / maxCount) * 100);
                                return (
                                    <motion.div
                                        key={r.code}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="flex items-center gap-[var(--gap-sm)]"
                                    >
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium min-w-[80px] justify-center ${colors.bg} ${colors.text}`}>
                                            {r.role}
                                        </span>
                                        <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.5, delay: index * 0.04 }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: 'var(--color-dominant-400)', opacity: 0.7 }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold min-w-[2rem] text-right" style={{ color: 'var(--color-texte)' }}>
                                            {r.count}
                                        </span>
                                    </motion.div>
                                );
                            })}
                    </div>
                ) : (
                    <p className="text-sm text-center py-[var(--space-md)]" style={{ color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.detail.utilisateurs.aucunRole', 'Aucun utilisateur enregistré')}
                    </p>
                )}
            </SectionCard>

            {/* Derniers utilisateurs inscrits */}
            <SectionCard title={t('etablissements.detail.utilisateurs.derniersInscrits', 'Derniers inscrits')} icon={UserCircle} fullWidth>
                {utilisateurs.derniers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-bordure)' }}>
                                    <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                        {t('etablissements.detail.utilisateurs.nom', 'Nom')}
                                    </th>
                                    <th className="text-left py-2 px-3 text-xs font-medium hidden sm:table-cell" style={{ color: 'var(--color-texte-muted)' }}>
                                        {t('etablissements.detail.utilisateurs.role', 'Rôle')}
                                    </th>
                                    <th className="text-center py-2 px-3 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                        {t('etablissements.detail.utilisateurs.statut', 'Statut')}
                                    </th>
                                    <th className="text-right py-2 px-3 text-xs font-medium hidden md:table-cell" style={{ color: 'var(--color-texte-muted)' }}>
                                        {t('etablissements.detail.utilisateurs.derniereConnexion', 'Dernière connexion')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {utilisateurs.derniers.map((u, index) => {
                                    const roleColors = ROLE_COLORS[u.code || ''] || { bg: 'bg-gray-100', text: 'text-gray-700', hex: '#9ca3af' };
                                    return (
                                        <motion.tr
                                            key={u.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="transition-colors hover:bg-[var(--color-surface-alt)]"
                                            style={{ borderBottom: '1px solid var(--color-bordure)' }}
                                        >
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold"
                                                        style={{ backgroundColor: 'var(--color-dominant-100)', color: 'var(--color-dominant-700)' }}>
                                                        {(u.prenom?.[0] || u.nom?.[0] || '?').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-xs" style={{ color: 'var(--color-texte)' }}>
                                                            {u.prenom} {u.nom}
                                                        </p>
                                                        <p className="text-[0.65rem] sm:hidden" style={{ color: 'var(--color-texte-muted)' }}>
                                                            {u.role}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 hidden sm:table-cell">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleColors.bg} ${roleColors.text}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                {u.actif ? (
                                                    <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--color-success-600)' }}>
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        <span className="hidden sm:inline">{t('etablissements.detail.utilisateurs.actif', 'Actif')}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                                        <XCircle className="h-3 w-3" />
                                                        <span className="hidden sm:inline">{t('etablissements.detail.utilisateurs.inactif', 'Inactif')}</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-right text-xs hidden md:table-cell" style={{ color: 'var(--color-texte-muted)' }}>
                                                {u.derniereConnexion ? formatRelativeTime(u.derniereConnexion) : '—'}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-center py-[var(--space-md)]" style={{ color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.detail.utilisateurs.aucunUtilisateur', 'Aucun utilisateur enregistré')}
                    </p>
                )}
            </SectionCard>
            </div>
        </div>
    );
}

// =============================================
// JournalTab — Historique des actions (audit logs)
// =============================================

const SEVERITY_CONFIG: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
    info:     { icon: Info,          color: 'var(--color-info-600, #2563eb)',    bg: 'bg-blue-100',    label: 'Info' },
    warning:  { icon: AlertTriangle, color: 'var(--color-warning-600, #d97706)', bg: 'bg-amber-100',   label: 'Avertissement' },
    error:    { icon: XCircle,       color: 'var(--color-danger-600, #dc2626)',  bg: 'bg-red-100',     label: 'Erreur' },
    critical: { icon: ShieldAlert,   color: 'var(--color-danger-700, #991b1b)', bg: 'bg-red-200',     label: 'Critique' },
};

function JournalTab({ etablissementId }: { etablissementId: string }) {
    const { t } = useTranslation('admin');
    const [filtreSeverity, setFiltreSeverity] = useState<string>('');
    const [filtreModule, setFiltreModule] = useState<string>('');
    const [page, setPage] = useState(1);
    const limit = 20;

    // Query serveur avec pagination et filtres
    const { data: audit, isLoading } = useQuery<AuditLogResponse>({
        queryKey: ['platform-etablissement-detail', 'audit', etablissementId, page, limit, filtreSeverity, filtreModule],
        queryFn: async () => {
            const params: Record<string, string> = { page: String(page), limit: String(limit) };
            if (filtreSeverity) params.severity = filtreSeverity;
            if (filtreModule) params.module = filtreModule;
            const res = await apiClient.get<AuditLogResponse>(`/api/platform/etablissements/${etablissementId}/audit`, params);
            return res.data;
        },
        staleTime: 30_000,
        keepPreviousData: true,
    });

    // Modules uniques pour le filtre (chargés une fois depuis les données disponibles)
    const { data: modulesUniques = [] } = useQuery<string[]>({
        queryKey: ['platform-etablissement-detail', 'audit-modules', etablissementId],
        queryFn: async () => {
            const res = await apiClient.get<AuditLogResponse>(`/api/platform/etablissements/${etablissementId}/audit`, { page: '1', limit: '100' });
            const mods = new Set(res.data?.map((l) => l.module).filter(Boolean) as string[]);
            return Array.from(mods).sort();
        },
        staleTime: 5 * 60_000,
    });

    const logsPage = audit?.data || [];
    const total = audit?.meta?.totalItems ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Reset page quand filtres changent
    const handleFiltreSeverity = useCallback((v: string) => { setFiltreSeverity(v); setPage(1); }, []);
    const handleFiltreModule = useCallback((v: string) => { setFiltreModule(v); setPage(1); }, []);
    const handleResetFiltres = useCallback(() => { setFiltreSeverity(''); setFiltreModule(''); setPage(1); }, []);

    // Stats rapides (depuis le total serveur)
    const countBySeverity = useMemo(() => {
        const counts: Record<string, number> = { info: 0, warning: 0, error: 0, critical: 0 };
        // Utiliser les données de la page courante comme indicateur
        logsPage.forEach((l) => { if (counts[l.severity] !== undefined) counts[l.severity]++; });
        return counts;
    }, [logsPage]);

    const countEchecs = useMemo(() => logsPage.filter((l) => l.estEchec).length, [logsPage]);

    // Export CSV des logs de la page courante
    const handleExportCSV = useCallback(() => {
        if (!logsPage.length) return;
        const headers = ['Date', 'Action', 'Sévérité', 'Module', 'Utilisateur', 'Email', 'Rôle', 'Cible', 'Description', 'Échec', 'IP'];
        const rows = logsPage.map((l) => [
            new Date(l.createdAt).toLocaleString('fr-FR'),
            l.action?.replace(/_/g, ' ') || '',
            l.severity,
            l.module || '',
            l.utilisateur ? `${l.utilisateur.prenom || ''} ${l.utilisateur.nom || ''}`.trim() : '',
            l.utilisateur?.email || '',
            l.utilisateur?.role || '',
            l.cible || '',
            l.description || '',
            l.estEchec ? 'Oui' : 'Non',
            l.ipAddress || '',
        ]);
        const csv = [headers.join(';'), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n');
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal_audit_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [logsPage]);

    return (
        <div className="space-y-[var(--space-lg)]">
            {/* Stats rapides */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-[var(--gap-sm)]">
                {[
                    { label: t('etablissements.detail.journal.totalActions', 'Total actions'), value: total, color: 'var(--color-dominant-600)' },
                    { label: t('etablissements.detail.journal.info', 'Info'), value: countBySeverity.info, color: 'var(--color-info-600, #2563eb)' },
                    { label: t('etablissements.detail.journal.avertissements', 'Avertissements'), value: countBySeverity.warning, color: 'var(--color-warning-600, #d97706)' },
                    { label: t('etablissements.detail.journal.erreurs', 'Erreurs'), value: countBySeverity.error + countBySeverity.critical, color: 'var(--color-danger-600, #dc2626)' },
                    { label: t('etablissements.detail.journal.echecs', 'Échecs'), value: countEchecs, color: 'var(--color-danger-500)' },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="rounded-xl border p-[clamp(0.625rem,0.5rem+0.3vw,1rem)] text-center"
                        style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                    >
                        <p className="text-[clamp(1.125rem,2.5vw,1.75rem)] font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[clamp(0.625rem,1.2vw,0.75rem)]" style={{ color: 'var(--color-texte-muted)' }}>{s.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Distribution sévérité — barre empilée */}
            {logsPage.length > 0 && (() => {
                const totalSev = countBySeverity.info + countBySeverity.warning + countBySeverity.error + countBySeverity.critical;
                if (totalSev === 0) return null;
                const sevs = [
                    { key: 'info', count: countBySeverity.info, color: 'var(--color-info-500)', label: 'Info' },
                    { key: 'warning', count: countBySeverity.warning, color: 'var(--color-warning-500)', label: 'Warning' },
                    { key: 'error', count: countBySeverity.error, color: 'var(--color-danger-500)', label: 'Error' },
                    { key: 'critical', count: countBySeverity.critical, color: 'var(--color-danger-700, #b91c1c)', label: 'Critical' },
                ].filter(s => s.count > 0);
                return (
                    <div className="rounded-xl border p-[clamp(0.625rem,0.5rem+0.3vw,1rem)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                        <div className="flex items-center justify-between mb-[var(--space-xs)]">
                            <span className="text-xs font-medium" style={{ color: 'var(--color-texte)' }}>
                                {t('etablissements.detail.journal.distributionSeverite', 'Distribution sévérité')}
                            </span>
                            <div className="flex items-center gap-[var(--gap-sm)]">
                                {sevs.map(s => (
                                    <span key={s.key} className="flex items-center gap-1 text-[0.6rem]" style={{ color: 'var(--color-texte-muted)' }}>
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                        {s.label} ({s.count})
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: 'var(--color-bordure)' }}>
                            {sevs.map(s => (
                                <motion.div
                                    key={s.key}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(s.count / totalSev) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                    className="h-full"
                                    style={{ backgroundColor: s.color }}
                                    title={`${s.label}: ${Math.round((s.count / totalSev) * 100)}%`}
                                />
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                <select
                    value={filtreSeverity}
                    onChange={(e) => handleFiltreSeverity(e.target.value)}
                    className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm"
                    style={{
                        borderColor: 'var(--color-bordure)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-texte)',
                        fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                    }}
                >
                    <option value="">{t('etablissements.detail.journal.toutesSeverites', 'Toutes sévérités')}</option>
                    <option value="info">{t('etablissements.detail.journal.info', 'Info')}</option>
                    <option value="warning">{t('etablissements.detail.journal.avertissement', 'Avertissement')}</option>
                    <option value="error">{t('etablissements.detail.journal.erreur', 'Erreur')}</option>
                    <option value="critical">{t('etablissements.detail.journal.critique', 'Critique')}</option>
                </select>

                {modulesUniques.length > 0 && (
                    <select
                        value={filtreModule}
                        onChange={(e) => handleFiltreModule(e.target.value)}
                        className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm"
                        style={{
                            borderColor: 'var(--color-bordure)',
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-texte)',
                            fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                        }}
                    >
                        <option value="">{t('etablissements.detail.journal.tousModules', 'Tous modules')}</option>
                        {modulesUniques.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                )}

                {(filtreSeverity || filtreModule) && (
                    <button
                        onClick={handleResetFiltres}
                        className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm transition-colors hover:bg-[var(--color-surface-alt)]"
                        style={{
                            borderColor: 'var(--color-bordure)',
                            color: 'var(--color-texte-muted)',
                            fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                        }}
                    >
                        {t('common.actions.reinitialiserFiltres', 'Réinitialiser')}
                    </button>
                )}

                {/* Bouton export CSV */}
                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                    {total} {t('etablissements.detail.journal.resultats', 'résultats')}
                </span>
                <button
                    onClick={handleExportCSV}
                    disabled={!logsPage.length}
                    className="inline-flex items-center gap-[var(--gap-xxs)] rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm font-medium transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
                    style={{
                        borderColor: 'var(--color-bordure)',
                        color: 'var(--color-dominant-700)',
                        fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                    }}
                >
                    <FileText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('etablissements.detail.journal.exporterCSV', 'Exporter CSV')}</span>
                </button>
            </div>

            {/* Liste des logs */}
            {isLoading ? (
                <div className="space-y-[var(--space-xs)]">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-[var(--gap-sm)] rounded-xl border p-[clamp(0.625rem,0.5rem+0.3vw,1rem)] animate-pulse"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                            <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/3 rounded" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
                                <div className="h-2 w-2/3 rounded" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : logsPage.length > 0 ? (
                <div className="space-y-[var(--space-xs)]">
                    {logsPage.map((log, index) => {
                        const sev = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info;
                        const SevIcon = sev.icon;
                        const nomUtilisateur = log.utilisateur
                            ? `${log.utilisateur.prenom || ''} ${log.utilisateur.nom || ''}`.trim() || log.utilisateur.email || '—'
                            : '—';

                        return (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(index * 0.02, 0.4) }}
                                className="flex items-start gap-[var(--gap-sm)] rounded-xl border p-[clamp(0.625rem,0.5rem+0.3vw,1rem)] transition-colors hover:bg-[var(--color-surface-alt)]"
                                style={{
                                    borderColor: log.estEchec ? 'var(--color-danger-300, #fca5a5)' : 'var(--color-bordure)',
                                    backgroundColor: log.estEchec ? 'var(--color-danger-50, #fef2f2)' : 'var(--color-surface)',
                                }}
                            >
                                {/* Icône sévérité */}
                                <div
                                    className="mt-0.5 flex h-[clamp(1.75rem,3vw,2.25rem)] w-[clamp(1.75rem,3vw,2.25rem)] shrink-0 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: `${sev.color}15` }}
                                >
                                    <SevIcon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: sev.color }} />
                                </div>

                                {/* Contenu */}
                                <div className="min-w-0 flex-1 space-y-[var(--space-xxs)]">
                                    <div className="flex flex-wrap items-center gap-[var(--gap-xs)]">
                                        {/* Action */}
                                        <span
                                            className="font-medium truncate"
                                            style={{
                                                color: 'var(--color-texte)',
                                                fontSize: 'clamp(0.8125rem, 0.72rem + 0.3vw, 0.9375rem)',
                                            }}
                                        >
                                            {log.action?.replace(/_/g, ' ')}
                                        </span>
                                        {/* Badge module */}
                                        {log.module && (
                                            <span className="inline-flex rounded-full px-[var(--space-xs)] py-[clamp(0.0625rem,0.05rem+0.05vw,0.125rem)] text-[clamp(0.6rem,1vw,0.7rem)] font-medium"
                                                style={{ backgroundColor: 'var(--color-dominant-100)', color: 'var(--color-dominant-700)' }}>
                                                {log.module}
                                            </span>
                                        )}
                                        {/* Badge échec */}
                                        {log.estEchec && (
                                            <span className="inline-flex items-center gap-[var(--gap-xxs)] rounded-full bg-red-100 px-[var(--space-xs)] py-[clamp(0.0625rem,0.05rem+0.05vw,0.125rem)] text-[clamp(0.6rem,1vw,0.7rem)] font-medium text-red-700">
                                                <XCircle className="h-3 w-3" />
                                                {t('etablissements.detail.journal.echec', 'Échec')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {log.description && (
                                        <p
                                            className="truncate"
                                            style={{
                                                color: 'var(--color-texte-muted)',
                                                fontSize: 'clamp(0.6875rem, 0.62rem + 0.25vw, 0.8125rem)',
                                            }}
                                        >
                                            {log.description}
                                        </p>
                                    )}

                                    {/* Métadonnées */}
                                    <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                                        <span className="inline-flex items-center gap-[var(--gap-xxs)]" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.625rem, 0.56rem + 0.2vw, 0.75rem)' }}>
                                            <UserCircle className="h-3 w-3" />
                                            {nomUtilisateur}
                                            {log.utilisateur?.role && (
                                                <span className="rounded bg-gray-100 px-1 text-[0.6rem] font-medium text-gray-600">
                                                    {log.utilisateur.role}
                                                </span>
                                            )}
                                        </span>
                                        {log.cible && (
                                            <span className="inline-flex items-center gap-[var(--gap-xxs)]" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.625rem, 0.56rem + 0.2vw, 0.75rem)' }}>
                                                <ArrowUpRight className="h-3 w-3" />
                                                {log.cible}
                                            </span>
                                        )}
                                        {log.ipAddress && (
                                            <span className="hidden md:inline text-[0.65rem]" style={{ color: 'var(--color-texte-muted)' }}>
                                                {log.ipAddress}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Timestamp */}
                                <div className="shrink-0 text-right">
                                    <p style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.625rem, 0.56rem + 0.2vw, 0.75rem)' }}>
                                        {formatRelativeTime(log.createdAt)}
                                    </p>
                                    <p className="hidden sm:block" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.5625rem, 0.5rem + 0.15vw, 0.6875rem)' }}>
                                        {new Date(log.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-[var(--space-xl)]">
                    <ScrollText className="h-10 w-10 mb-3" style={{ color: 'var(--color-texte-muted)', opacity: 0.4 }} />
                    <p className="text-sm" style={{ color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.detail.journal.aucunLog', 'Aucune action enregistrée')}
                    </p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-[var(--gap-xs)] pt-[var(--space-sm)]">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)', fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}
                    >
                        ← {t('common.pagination.precedent', 'Précédent')}
                    </button>
                    <span className="text-sm" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}>
                        {t('common.pagination.pageSur', 'Page {{page}} sur {{total}}', { page, total: totalPages })}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)', fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)' }}
                    >
                        {t('common.pagination.suivant', 'Suivant')} →
                    </button>
                </div>
            )}
        </div>
    );
}

// =============================================
// Skeleton loaders par onglet
// =============================================

function TabSkeleton({ variant }: { variant: 'sante' | 'activite' | 'config' | 'utilisateurs' }) {
    const pulseStyle = { backgroundColor: 'var(--color-bordure)' };

    if (variant === 'sante') {
        return (
            <div className="space-y-[var(--gap-lg)]">
                {/* Score global */}
                <div className="rounded-xl border p-[clamp(1.5rem,1.2rem+1vw,2.5rem)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                    <div className="flex items-center gap-[var(--gap-lg)]">
                        <div className="h-[120px] w-[120px] rounded-full animate-pulse" style={pulseStyle} />
                        <div className="flex-1 space-y-[var(--space-sm)]">
                            <div className="h-5 w-40 rounded animate-pulse" style={pulseStyle} />
                            <div className="h-6 w-24 rounded-full animate-pulse" style={pulseStyle} />
                            <div className="h-3 w-64 rounded animate-pulse" style={pulseStyle} />
                        </div>
                    </div>
                </div>
                {/* 4 critères */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--gap-md)]">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border p-[var(--space-md)] space-y-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)' }}>
                            <div className="h-3 w-20 rounded animate-pulse" style={pulseStyle} />
                            <div className="h-8 w-12 rounded animate-pulse" style={pulseStyle} />
                            <div className="h-2 w-full rounded-full animate-pulse" style={pulseStyle} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (variant === 'activite') {
        return (
            <div className="space-y-[var(--gap-lg)]">
                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--gap-md)]">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border p-[var(--space-md)] space-y-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)' }}>
                            <div className="h-3 w-16 rounded animate-pulse" style={pulseStyle} />
                            <div className="h-7 w-14 rounded animate-pulse" style={pulseStyle} />
                        </div>
                    ))}
                </div>
                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-lg)]">
                    <div className="rounded-xl border p-[var(--space-md)] space-y-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)' }}>
                        <div className="h-4 w-32 rounded animate-pulse" style={pulseStyle} />
                        <div className="h-32 w-full rounded animate-pulse" style={pulseStyle} />
                    </div>
                    <div className="rounded-xl border p-[var(--space-md)] space-y-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)' }}>
                        <div className="h-4 w-32 rounded animate-pulse" style={pulseStyle} />
                        <div className="h-32 w-full rounded animate-pulse" style={pulseStyle} />
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'config') {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-lg)]">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border p-[var(--space-md)] space-y-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)' }}>
                        <div className="flex items-center gap-[var(--gap-sm)]">
                            <div className="h-5 w-5 rounded animate-pulse" style={pulseStyle} />
                            <div className="h-4 w-28 rounded animate-pulse" style={pulseStyle} />
                        </div>
                        <div className="space-y-[var(--space-xs)]">
                            {Array.from({ length: 3 }).map((__, j) => (
                                <div key={j} className="h-3 w-full rounded animate-pulse" style={pulseStyle} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // utilisateurs
    return (
        <div className="space-y-[var(--gap-lg)]">
            <div className="grid grid-cols-3 gap-[var(--gap-md)]">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-[var(--space-md)] text-center space-y-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)' }}>
                        <div className="h-8 w-12 mx-auto rounded animate-pulse" style={pulseStyle} />
                        <div className="h-3 w-16 mx-auto rounded animate-pulse" style={pulseStyle} />
                    </div>
                ))}
            </div>
            <div className="rounded-xl border p-[var(--space-md)] space-y-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)' }}>
                <div className="h-4 w-40 rounded animate-pulse" style={pulseStyle} />
                <div className="h-32 w-full rounded animate-pulse" style={pulseStyle} />
            </div>
        </div>
    );
}

// =============================================
// Sous-composants réutilisables
// =============================================

function SectionCard({ title, icon: Icon, children, fullWidth }: {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
    fullWidth?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-[var(--space-md)] ${fullWidth ? 'lg:col-span-2' : ''}`}
            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
        >
            <div className="flex items-center gap-[var(--gap-xs)]">
                <Icon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: 'var(--color-dominant-600)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-texte)' }}>{title}</h3>
            </div>
            {children}
        </motion.div>
    );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-sm)]">
            {children}
        </div>
    );
}

function InfoField({ icon: Icon, label, value, href }: {
    icon: LucideIcon;
    label: string;
    value?: string;
    href?: string;
}) {
    const content = (
        <div className="flex items-start gap-[var(--gap-xs)]">
            <Icon className="h-[var(--icon-sm)] w-[var(--icon-sm)] mt-0.5 shrink-0" style={{ color: 'var(--color-texte-muted)' }} />
            <div className="min-w-0 flex-1">
                <p className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>{label}</p>
                <p className="text-sm font-medium truncate" style={{ color: value ? 'var(--color-texte)' : 'var(--color-texte-muted)' }}>
                    {value || '—'}
                </p>
            </div>
        </div>
    );

    if (href && value) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer"
                className="block rounded-lg p-[var(--space-xs)] transition-colors hover:opacity-80"
                style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                {content}
            </a>
        );
    }

    return (
        <div className="rounded-lg p-[var(--space-xs)]" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
            {content}
        </div>
    );
}

function ActionButton({ icon: Icon, label, onClick, variant = 'default', loading }: {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'success';
    loading?: boolean;
}) {
    const variantStyles = {
        default: {
            bg: 'var(--color-surface)',
            border: 'var(--color-bordure)',
            text: 'var(--color-texte)',
            hoverBg: 'var(--color-surface-alt)',
        },
        danger: {
            bg: 'var(--color-danger-50)',
            border: 'var(--color-danger-200)',
            text: 'var(--color-danger-700)',
            hoverBg: 'var(--color-danger-100)',
        },
        success: {
            bg: 'var(--color-success-50)',
            border: 'var(--color-success-200)',
            text: 'var(--color-success-700)',
            hoverBg: 'var(--color-success-100)',
        },
    };

    const vs = variantStyles[variant];

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            disabled={loading}
            className="inline-flex items-center gap-[var(--gap-xxs)] rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)] text-sm font-medium transition-colors disabled:opacity-50"
            style={{
                backgroundColor: vs.bg,
                borderColor: vs.border,
                color: vs.text,
                fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
            }}
        >
            {loading ? (
                <RefreshCw className="h-[var(--icon-xs)] w-[var(--icon-xs)] animate-spin" />
            ) : (
                <Icon className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
            )}
            <span className="hidden sm:inline">{label}</span>
        </motion.button>
    );
}

function ConfigBadge({ label, value }: { label: string; value: string }) {
    return (
        <span className="inline-flex items-center gap-[var(--gap-xxs)] rounded-lg border px-[var(--space-sm)] py-[var(--space-xs)]"
            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
            <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>{label}:</span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-texte)' }}>{value}</span>
        </span>
    );
}

// =============================================
// Helpers
// =============================================

function getScoreColor(score: number): string {
    if (score >= 75) return 'var(--color-success-500)';
    if (score >= 40) return 'var(--color-warning-500)';
    return 'var(--color-danger-500)';
}

function getTauxColor(taux: number): string {
    if (taux >= 90) return 'var(--color-danger-500)';
    if (taux >= 60) return 'var(--color-warning-500)';
    return 'var(--color-success-500)';
}

function formatRelativeTime(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes}min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 7) return `il y a ${days}j`;
    if (days < 30) return `il y a ${Math.floor(days / 7)}sem`;
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default PlatformEtablissementDetailPage;
