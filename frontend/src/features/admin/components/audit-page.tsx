/**
 * ==================================
 * eLISAschool - Page Admin Audit
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Page d'administration du journal d'audit.
 * DataTable serveur avec filtres, export CSV/JSON, modal détail.
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
    Shield, Download, AlertCircle, AlertTriangle, Info, FileText, Eye, ExternalLink,
    Pencil, GitBranch, Copy, Check, Monitor, Clock, TrendingUp, Activity,
    ShieldCheck,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/cn';
import { apiClient } from '@/lib/api-client';
import { resolveAuditNavLink, resolveRelationNavLink } from '@/lib/audit-navigation';
import { usePermissions } from '@/hooks';
import type { AuditLogEntry } from '@/components/ui/AuditTimeline';

// ─── Types ───

interface AuditFiltres {
    page: number;
    limit: number;
    search?: string;
    module?: string;
    severity?: string;
    estEchec?: string;
    dateDebut?: string;
    dateFin?: string;
    action?: string;
    utilisateurSearch?: string;
}

const MODULES = [
    'notes', 'bulletins', 'personnel', 'contrats', 'paie',
    'eleves', 'classes', 'matieres', 'periodes', 'emploi-du-temps',
    'organisation', 'auth', 'configuration',
] as const;

const SEVERITES = ['INFO', 'WARNING', 'CRITICAL'] as const;

/** Actions groupées par catégorie pour le filtre select */
const ACTION_GROUPES = [
    { groupe: 'Authentification', actions: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'ACCESS_DENIED'] },
    { groupe: 'Utilisateurs', actions: ['USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_SUSPEND', 'USER_ACTIVATE', 'ROLE_ASSIGN', 'ROLE_REVOKE'] },
    { groupe: 'Notes', actions: ['NOTE_CREATE', 'NOTE_UPDATE', 'NOTE_DELETE', 'NOTE_VALIDATE'] },
    { groupe: 'Bulletins', actions: ['BULLETIN_GENERATE', 'BULLETIN_UPDATE', 'BULLETIN_DELETE', 'BULLETIN_PUBLIER', 'BULLETIN_EXPORT'] },
    { groupe: 'Personnel', actions: ['PERSONNEL_CREATE', 'PERSONNEL_UPDATE', 'PERSONNEL_DELETE'] },
    { groupe: 'Contrats', actions: ['CONTRAT_PERSONNEL_CREATE', 'CONTRAT_PERSONNEL_UPDATE', 'CONTRAT_PERSONNEL_DELETE'] },
    { groupe: 'Organisation', actions: ['UNITE_CREATE', 'UNITE_UPDATE', 'UNITE_DELETE', 'POSTE_CREATE', 'POSTE_UPDATE', 'POSTE_DELETE', 'FONCTION_CREATE', 'FONCTION_UPDATE', 'FONCTION_DELETE', 'HIERARCHIE_CREATE', 'HIERARCHIE_UPDATE', 'HIERARCHIE_DELETE'] },
    { groupe: 'Pédagogie', actions: ['CLASSE_CREATE', 'CLASSE_UPDATE', 'CLASSE_DELETE', 'MATIERE_CREATE', 'MATIERE_UPDATE', 'MATIERE_DELETE', 'PERIODE_CREATE', 'PERIODE_UPDATE', 'PERIODE_DELETE', 'ANNEE_SCOLAIRE_CREATE', 'ANNEE_SCOLAIRE_UPDATE', 'ANNEE_SCOLAIRE_DELETE', 'ANNEE_SCOLAIRE_ACTIVATE'] },
    { groupe: 'Validation', actions: ['VALIDATION_APPROUVE', 'VALIDATION_REJETE'] },
    { groupe: 'Finance', actions: ['PAYMENT_RECEIVE', 'DEPENSE_CREATE', 'DEPENSE_VALIDER', 'PAIEMENT_CREATE', 'PAIEMENT_VALIDER', 'PAIEMENT_ANNULER'] },
    { groupe: 'Système', actions: ['CONFIG_CHANGE', 'MODULE_ACTIVATE', 'MODULE_DEACTIVATE', 'DATA_EXPORT', 'DATA_IMPORT'] },
] as const;

// ─── Helpers ───

function SeveriteBadge({ severity }: { severity: string }) {
    const config = {
        CRITICAL: { icon: AlertCircle, cls: 'text-[var(--color-danger)] bg-[var(--color-danger)]/10' },
        WARNING: { icon: AlertTriangle, cls: 'text-[var(--color-warning)] bg-[var(--color-warning)]/10' },
        INFO: { icon: Info, cls: 'text-[var(--color-info)] bg-[var(--color-info)]/10' },
    }[severity] ?? { icon: Info, cls: 'text-[var(--color-info)] bg-[var(--color-info)]/10' };
    const Icon = config.icon;
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', config.cls)}>
            <Icon className="h-3 w-3" />
            {severity}
        </span>
    );
}

function libelleAction(action: string, t: (key: string) => string) {
    const key = `audit.actions.${action}`;
    const translated = t(key);
    return translated === key ? action.replace(/_/g, ' ').toLowerCase() : translated;
}

// ─── Main Page ───

export function AuditPage() {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'en' ? enUS : fr;
    const { hasPermission } = usePermissions();
    const [filtres, setFiltres] = useState<AuditFiltres>({ page: 1, limit: 30 });
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
    const [modalSection, setModalSection] = useState('general');

    // ── Statistiques rapides ──
    const { data: stats } = useQuery({
        queryKey: ['admin-audit-stats'],
        queryFn: async () => {
            const res = await apiClient.get<{
                totalLogs: number;
                last24h: number;
                failureRate: string;
                actionsCount: Record<string, number>;
                modulesCount: Record<string, number>;
                severityCount: Record<string, number>;
            }>('/api/audit/logs/statistics');
            return res.data;
        },
        staleTime: 60_000,
        refetchInterval: 120_000,
    });

    const queryParams = useMemo(() => {
        const p: Record<string, string> = {
            limit: String(filtres.limit),
            offset: String((filtres.page - 1) * filtres.limit),
        };
        if (filtres.search) p.search = filtres.search;
        if (filtres.module) p.module = filtres.module;
        if (filtres.severity) p.severity = filtres.severity;
        if (filtres.estEchec === 'true') p.estEchec = 'true';
        if (filtres.estEchec === 'false') p.estEchec = 'false';
        if (filtres.dateDebut) p.dateDebut = new Date(filtres.dateDebut).toISOString();
        if (filtres.dateFin) p.dateFin = new Date(filtres.dateFin + 'T23:59:59').toISOString();
        if (filtres.action) p.action = filtres.action;
        if (filtres.utilisateurSearch) p.utilisateurSearch = filtres.utilisateurSearch;
        return p;
    }, [filtres]);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['admin-audit-logs', queryParams],
        queryFn: async () => {
            const res = await apiClient.get<{ items: AuditLogEntry[]; total: number; limit: number; offset: number }>(
                '/api/audit/logs',
                queryParams,
            );
            return res.data;
        },
        staleTime: 15_000,
    });

    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / filtres.limit);

    // ── Callback filtres ──
    const setFiltre = useCallback((key: string, valeur: string) => {
        setFiltres(prev => ({ ...prev, [key]: valeur || undefined, page: 1 }));
    }, []);

    const clearFiltres = useCallback(() => {
        setFiltres({ page: 1, limit: filtres.limit });
    }, [filtres.limit]);

    // ── Export ──
    const handleExport = useCallback(async (format: 'csv' | 'json') => {
        const toastId = toast.loading(t('audit.page.exportEnCours'));
        try {
            const params = new URLSearchParams({ format });
            if (filtres.module) params.set('module', filtres.module);
            if (filtres.severity) params.set('severity', filtres.severity);
            if (filtres.dateDebut) params.set('dateDebut', new Date(filtres.dateDebut).toISOString());
            if (filtres.dateFin) params.set('dateFin', new Date(filtres.dateFin + 'T23:59:59').toISOString());

            const baseUrl = import.meta.env.VITE_API_URL ?? '';
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${baseUrl}/api/audit/logs/export?${params.toString()}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const content = await response.text();
            const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;';
            const blob = new Blob([content], { type: mimeType });
            const dateStr = new Date().toISOString().slice(0, 10);
            const filename = `audit-${dateStr}${filtres.module ? `-${filtres.module}` : ''}.${format}`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

            const taille = blob.size >= 1024 * 1024
                ? `${(blob.size / (1024 * 1024)).toFixed(1)} Mo`
                : `${(blob.size / 1024).toFixed(1)} Ko`;
            toast.success(t('audit.page.exportReussi', { format: format.toUpperCase(), taille }), { id: toastId });
        } catch {
            toast.error(t('messages.erreurServeur'), { id: toastId });
        }
    }, [filtres, t]);

    // ── Colonnes ──
    const colonnes = useMemo(() => [
        {
            key: 'id' as const,
            header: 'ID',
            hidden: true,
            size: 300,
            render: (log: AuditLogEntry) => (
                <button
                    type="button"
                    onClick={() => {
                        navigator.clipboard.writeText(log.id);
                        toast.success(t('audit.page.idCopie'));
                    }}
                    className="group inline-flex items-center gap-1 cursor-pointer rounded-[var(--radius-sm)] px-1 py-0.5 transition-colors hover:bg-[var(--color-surface-hover)]"
                    title={t('audit.page.copierId')}
                >
                    <span className="font-mono text-[var(--color-text-muted)] break-all"
                        style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.1vw, 0.625rem)' }}>
                        {log.id}
                    </span>
                    <Copy className="h-3 w-3 shrink-0 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-60 transition-opacity" />
                </button>
            ),
        },
        {
            key: 'createdAt' as const,
            header: t('audit.page.colonneDate'),
            render: (log: AuditLogEntry) => (
                <span className="text-[var(--color-texte)] whitespace-nowrap"
                    style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}>
                    {format(parseISO(log.createdAt), 'dd/MM/yy HH:mm', { locale })}
                </span>
            ),
            sortable: true,
        },
        {
            key: 'utilisateur' as const,
            header: t('audit.page.colonneUtilisateur'),
            render: (log: AuditLogEntry) => {
                const display = log.utilisateur
                    ? (log.utilisateur.nom && log.utilisateur.prenom
                        ? `${log.utilisateur.prenom} ${log.utilisateur.nom}`
                        : log.utilisateur.email ?? '—')
                    : '—';
                return (
                    <span className="text-[var(--color-texte-secondaire)] truncate max-w-[140px] inline-block"
                        style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}>
                        {display}
                    </span>
                );
            },
        },
        {
            key: 'action' as const,
            header: t('audit.page.colonneAction'),
            render: (log: AuditLogEntry) => {
                const isValidation = log.action.startsWith('VALIDATION_');
                return (
                    <span className="inline-flex items-center gap-1">
                        {isValidation && (
                            <ShieldCheck className="h-3 w-3 shrink-0 text-[var(--color-dominante)]" />
                        )}
                        <span className="font-medium text-[var(--color-texte)]"
                            style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}>
                            {libelleAction(log.action, t)}
                        </span>
                    </span>
                );
            },
        },
        {
            key: 'module' as const,
            header: t('audit.page.colonneModule'),
            render: (log: AuditLogEntry) => (
                <span className="rounded-full bg-[var(--color-surface-hover)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-texte-secondaire)]">
                    {log.module ? t(`audit.page.modules.${log.module}`, { defaultValue: log.module }) : '—'}
                </span>
            ),
        },
        {
            key: 'cible' as const,
            header: t('audit.page.colonneCible'),
            render: (log: AuditLogEntry) => {
                const navLink = resolveAuditNavLink(log);
                const label = log.metadata?.entiteLabel
                    ? `${log.metadata.entiteLabel}${log.metadata.entiteRef ? ` (${log.metadata.entiteRef})` : ''}`
                    : log.cible || '—';

                if (navLink && hasPermission(navLink.permission)) {
                    return (
                        <Link
                            to={navLink.to as string}
                            params={navLink.params}
                            className="inline-flex items-center gap-1 text-[var(--color-dominante)] hover:underline truncate max-w-[180px]"
                            style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.6875rem)' }}
                        >
                            {label}
                            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60" />
                        </Link>
                    );
                }
                return (
                    <span className="text-[var(--color-texte-secondaire)] truncate max-w-[120px] inline-block"
                        style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.6875rem)' }}>
                        {label}
                    </span>
                );
            },
        },
        {
            key: 'severity' as const,
            header: t('audit.page.colonneSeverite'),
            render: (log: AuditLogEntry) => <SeveriteBadge severity={log.severity} />,
        },
        {
            key: 'statut' as const,
            header: t('audit.page.colonneStatut'),
            render: (log: AuditLogEntry) => (
                <span className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    log.estEchec
                        ? 'text-[var(--color-danger)] bg-[var(--color-danger)]/10'
                        : 'text-[var(--color-success)] bg-[var(--color-success)]/10',
                )}>
                    {log.estEchec ? t('audit.echec') : t('audit.page.succes')}
                </span>
            ),
        },
        {
            key: 'actions' as const,
            header: '',
            size: 60,
            enableResizing: false,
            enableHiding: false,
            renderActions: (log: AuditLogEntry) => [
                {
                    key: 'detail',
                    icon: Eye,
                    label: t('audit.page.detail'),
                    onClick: () => { setSelectedLog(log); setModalSection('general'); },
                },
            ],
        },
    ], [t, locale]);

    // ── Configuration des 6 filtres ──
    const actionOptions = useMemo(() => {
        const opts: { value: string; label: string }[] = [];
        for (const groupe of ACTION_GROUPES) {
            for (const action of groupe.actions) {
                opts.push({
                    value: action,
                    label: `${libelleAction(action, t)}`,
                });
            }
        }
        return opts;
    }, [t]);

    const filtresConfig = useMemo(() => [
        {
            key: 'module',
            label: t('audit.page.filtreModule'),
            type: 'select' as const,
            allOptionLabel: t('audit.page.tousModules'),
            options: MODULES.map(m => ({
                value: m,
                label: t(`audit.page.modules.${m}`, { defaultValue: m }),
            })),
        },
        {
            key: 'severity',
            label: t('audit.page.filtreSeverite'),
            type: 'select' as const,
            allOptionLabel: t('audit.page.toutesSeverites'),
            options: SEVERITES.map(s => ({ value: s, label: s })),
        },
        {
            key: 'estEchec',
            label: t('audit.page.filtreStatut'),
            type: 'select' as const,
            allOptionLabel: t('audit.page.tousStatuts'),
            options: [
                { value: 'true', label: t('audit.echec') },
                { value: 'false', label: t('audit.page.succes') },
            ],
        },
        {
            key: 'dateDebut',
            label: t('audit.page.filtreDateDebut'),
            type: 'date' as const,
        },
        {
            key: 'dateFin',
            label: t('audit.page.filtreDateFin'),
            type: 'date' as const,
        },
        {
            key: 'action',
            label: t('audit.page.filtreAction'),
            type: 'select' as const,
            allOptionLabel: t('audit.page.toutesActions'),
            options: actionOptions,
        },
        {
            key: 'utilisateurSearch',
            label: t('audit.page.filtreUtilisateur'),
            type: 'text' as const,
            placeholder: t('audit.page.filtreUtilisateurPlaceholder'),
        },
    ], [t, actionOptions]);

    // ── Compteur de filtres actifs ──
    const filtresActifs = useMemo(() => {
        let count = 0;
        if (filtres.module) count++;
        if (filtres.severity) count++;
        if (filtres.estEchec) count++;
        if (filtres.dateDebut || filtres.dateFin) count++;
        if (filtres.action) count++;
        if (filtres.utilisateurSearch) count++;
        return count;
    }, [filtres]);

    // ── Stats display ──
    const statsTotal = stats?.totalLogs ?? total;
    const stats24h = stats?.last24h ?? 0;
    const statsTauxEchec = stats?.failureRate ? parseFloat(stats.failureRate) : 0;

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]">
            <PageHeader
                title={t('audit.page.titre')}
                subtitle={`${statsTotal} ${t('audit.page.sousTitre')}`}
                icon={Shield}
                variant="gradient"
                breadcrumbLabel={t('audit.page.titre')}
                actions={
                    <div className="flex items-center gap-[var(--gap-sm)]">
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<Download className="h-4 w-4" />}
                            onClick={() => handleExport('csv')}
                        >
                            {t('audit.page.exporter')}
                        </ElisaButton>
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            icon={<FileText className="h-4 w-4" />}
                            onClick={() => handleExport('json')}
                        >
                            {t('audit.page.exporterJson')}
                        </ElisaButton>
                    </div>
                }
            />

            {/* ── Statistiques rapides ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[var(--gap-sm)]">
                <StatCard
                    icon={FileText}
                    label={t('audit.page.statTotal')}
                    value={statsTotal}
                    tone="dominant"
                    compact
                />
                <StatCard
                    icon={Clock}
                    label={t('audit.page.stat24h')}
                    value={stats24h}
                    tone="info"
                    compact
                />
                <StatCard
                    icon={TrendingUp}
                    label={t('audit.page.statTauxEchec')}
                    value={`${statsTauxEchec.toFixed(1)}%`}
                    tone={statsTauxEchec > 10 ? 'danger' : 'success'}
                    compact
                />
                <StatCard
                    icon={Activity}
                    label={t('audit.page.statFiltresActifs')}
                    value={filtresActifs}
                    tone={filtresActifs > 0 ? 'warning' : 'dominant'}
                    compact
                />
            </div>

            <DataTable
                tableId="admin-audit-logs"
                data={items}
                columns={colonnes}
                isLoading={isLoading}
                isFetching={isFetching}
                disableClientSearch
                searchable
                searchPlaceholder={t('audit.page.rechercheAvancee')}
                onSearchChange={(search) => setFiltres(prev => ({ ...prev, search: search || undefined, page: 1 }))}
                filtres={filtresConfig}
                enableCollapsibleFilters
                onFilterChange={setFiltre}
                onClearFilters={clearFiltres}
                pagination={{
                    page: filtres.page,
                    limit: filtres.limit,
                    total,
                    totalPages,
                    hasNext: filtres.page < totalPages,
                    hasPrev: filtres.page > 1,
                }}
                onPageChange={(page) => setFiltres(prev => ({ ...prev, page }))}
                onLimitChange={(limit) => setFiltres(prev => ({ ...prev, limit, page: 1 }))}
                emptyMessage={t('audit.page.aucunResultat')}
                enableRowHeight
            />

            {/* Detail Modal */}
            <CustomModal
                open={!!selectedLog}
                onOpenChange={(open) => { if (!open) setSelectedLog(null); }}
                title={t('audit.page.detail')}
                size="3xl"
            >
                {selectedLog && (
                    <LogDetailContent
                        log={selectedLog}
                        t={t}
                        locale={locale}
                        hasPermission={hasPermission}
                        activeSection={modalSection}
                        onSectionChange={setModalSection}
                    />
                )}
            </CustomModal>
        </div>
    );
}

// ─── Sections du modal ───

const MODAL_SECTIONS = [
    { id: 'general', label: 'audit.page.sectionGeneral', icon: Info },
    { id: 'auteur', label: 'audit.page.sectionAuteur', icon: Shield },
    { id: 'cible', label: 'audit.page.colonneCible', icon: Eye },
    { id: 'environnement', label: 'audit.page.sectionEnvironnement', icon: Monitor },
    { id: 'modifications', label: 'audit.page.modifications', icon: Pencil },
] as const;

// ─── Detail Modal Content ───

function DetailSection({ title, icon: Icon, children }: { title: string; icon?: typeof Info; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-[var(--gap-sm)]">
            {title && (
                <div className="flex items-center gap-1.5">
                    {Icon && <Icon className="h-3.5 w-3.5 text-[var(--color-texte-secondaire)]" />}
                    <span className="text-[var(--color-texte-secondaire)] font-semibold uppercase tracking-wide"
                        style={{ fontSize: 'clamp(0.5625rem, 0.55rem + 0.08vw, 0.625rem)' }}>
                        {title}
                    </span>
                </div>
            )}
            {children}
        </div>
    );
}

function CopyableId({ id, t, label }: { id: string; t: (key: string) => string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(id).then(() => {
            setCopied(true);
            toast.success(t('audit.page.idCopie'));
            setTimeout(() => setCopied(false), 2000);
        });
    }, [id, t]);

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="group mt-1 inline-flex items-center gap-1 cursor-pointer rounded-[var(--radius-sm)] px-1.5 py-0.5 transition-colors hover:bg-[var(--color-surface-hover)]"
            title={t('audit.page.copierId')}
        >
            {label && (
                <span className="text-[var(--color-texte-secondaire)] opacity-60"
                    style={{ fontSize: 'clamp(0.5rem, 0.48rem + 0.06vw, 0.5625rem)' }}>
                    {label}:
                </span>
            )}
            <span className="font-mono text-[var(--color-texte-secondaire)] opacity-60 group-hover:opacity-90 transition-opacity"
                style={{ fontSize: 'clamp(0.5625rem, 0.55rem + 0.05vw, 0.625rem)' }}>
                {id}
            </span>
            {copied
                ? <Check className="h-3 w-3 shrink-0 text-[var(--color-success)]" />
                : <Copy className="h-3 w-3 shrink-0 text-[var(--color-texte-secondaire)] opacity-0 group-hover:opacity-60 transition-opacity" />
            }
        </button>
    );
}

function LogDetailContent({ log, t, locale, hasPermission, activeSection, onSectionChange }: {
    log: AuditLogEntry;
    t: (key: string) => string;
    locale: typeof fr;
    hasPermission: (perm: string) => boolean;
    activeSection: string;
    onSectionChange: (section: string) => void;
}) {
    const date = parseISO(log.createdAt);
    const fields = log.champsModifies ?? Object.keys(log.nouvellesValeurs ?? {});
    const navLink = resolveAuditNavLink(log);
    const parentNavLink = log.parentCible && log.parentCibleId
        ? resolveAuditNavLink({ cible: log.parentCible, cibleId: log.parentCibleId })
        : null;
    const hasRelations = log.metadata?.relations && Object.keys(log.metadata.relations).length > 0;
    const isValidation = log.action.startsWith('VALIDATION_');

    const userDisplay = log.utilisateur
        ? (log.utilisateur.nom && log.utilisateur.prenom
            ? `${log.utilisateur.prenom} ${log.utilisateur.nom}`
            : null)
        : null;
    const userEmail = log.utilisateur?.email;

    const moduleKey = log.module ? `audit.page.modules.${log.module}` : '';
    const moduleLabel = log.module
        ? (t(moduleKey) === moduleKey ? log.module : t(moduleKey))
        : '—';

    const sectionsVisibles = useMemo(() => {
        const visible: string[] = ['general', 'auteur'];
        if (log.cible || log.metadata?.entiteLabel || hasRelations || log.parentCible) visible.push('cible');
        if (log.ipAddress || log.navigateur || log.systemeExploitation || log.appareil) visible.push('environnement');
        if (fields.length > 0) visible.push('modifications');
        return visible;
    }, [log, hasRelations, fields.length]);

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            {/* ── Bandeau action + méta (sticky summary) ── */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface-hover)]"
                style={{ padding: 'clamp(0.75rem, 0.6rem + 0.4vw, 1rem)' }}>
                <div className="flex flex-wrap items-center justify-between gap-[var(--gap-sm)]">
                    <div className="flex items-center gap-[var(--gap-sm)] flex-wrap">
                        {isValidation && (
                            <ShieldCheck className="h-4 w-4 text-[var(--color-dominante)]" />
                        )}
                        <span className="font-semibold text-[var(--color-texte)]"
                            style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.25vw, 1rem)' }}>
                            {libelleAction(log.action, t)}
                        </span>
                        <span className="rounded-full bg-[var(--color-surface)] border border-[var(--color-bordure)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-texte-secondaire)]">
                            {moduleLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-[var(--gap-sm)]">
                        <SeveriteBadge severity={log.severity} />
                        <span className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-medium',
                            log.estEchec
                                ? 'text-[var(--color-danger)] bg-[var(--color-danger)]/10'
                                : 'text-[var(--color-success)] bg-[var(--color-success)]/10',
                        )}>
                            {log.estEchec ? t('audit.echec') : t('audit.page.succes')}
                        </span>
                    </div>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-[var(--gap-sm)]">
                    <span className="text-[var(--color-texte-secondaire)]"
                        style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.6875rem)' }}>
                        {format(date, 'PPPpp', { locale })}
                    </span>
                    <span className="text-[var(--color-bordure)]">•</span>
                    <CopyableId id={log.id} t={t} label="ID" />
                </div>

                {/* ── Mini-onglets navigation sticky ── */}
                {sectionsVisibles.length > 1 && (
                    <div className="mt-3 flex items-center gap-1 overflow-x-auto border-t border-[var(--color-bordure)]/50 pt-2">
                        {MODAL_SECTIONS.filter(s => sectionsVisibles.includes(s.id)).map((section) => {
                            const SectionIcon = section.icon;
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => onSectionChange(section.id)}
                                    className={cn(
                                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all whitespace-nowrap',
                                        isActive
                                            ? 'bg-[var(--color-dominante)] text-white'
                                            : 'bg-[var(--color-surface)] text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)]',
                                    )}
                                >
                                    <SectionIcon className="h-3 w-3" />
                                    {t(section.label)}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Section Auteur ── */}
            {(activeSection === 'general' || activeSection === 'auteur') && (
                <div className="flex items-center gap-[var(--gap-sm)] rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                    style={{ padding: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)' }}>
                    <div className="flex items-center justify-center shrink-0 rounded-full bg-[var(--color-dominante)]/10"
                        style={{ width: 'clamp(1.75rem, 1.5rem + 0.5vw, 2.25rem)', height: 'clamp(1.75rem, 1.5rem + 0.5vw, 2.25rem)' }}>
                        <span className="font-semibold text-[var(--color-dominante)]"
                            style={{ fontSize: 'clamp(0.625rem, 0.55rem + 0.2vw, 0.75rem)' }}>
                            {userDisplay ? userDisplay.charAt(0).toUpperCase() : '?'}
                        </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[var(--color-texte)] font-medium break-all"
                            style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem)' }}>
                            {userDisplay || userEmail || '—'}
                        </span>
                        {userDisplay && userEmail && (
                            <span className="text-[var(--color-texte-secondaire)] break-all"
                                style={{ fontSize: 'clamp(0.5625rem, 0.55rem + 0.08vw, 0.625rem)' }}>
                                {userEmail}
                            </span>
                        )}
                        {log.utilisateurId && (
                            <CopyableId id={log.utilisateurId} t={t} />
                        )}
                    </div>
                </div>
            )}

            {/* ── Section Entité cible ── */}
            {(activeSection === 'general' || activeSection === 'cible') && (log.cible || log.metadata?.entiteLabel) && (
                <DetailSection title={t('audit.page.colonneCible')} icon={Eye}>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                        style={{ padding: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)' }}>
                        <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                            {navLink && hasPermission(navLink.permission) ? (
                                <Link
                                    to={navLink.to as string}
                                    params={navLink.params}
                                    className="inline-flex items-center gap-1.5 text-[var(--color-dominante)] hover:underline font-medium"
                                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                                >
                                    {log.metadata?.entiteLabel || log.cible || '—'}
                                    <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                                </Link>
                            ) : (
                                <span className="font-medium text-[var(--color-texte)]"
                                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                                    {log.metadata?.entiteLabel || log.cible || '—'}
                                </span>
                            )}
                            {log.metadata?.entiteRef && log.metadata.entiteRef !== log.metadata.entiteLabel && (
                                <span className="rounded-full bg-[var(--color-dominante)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-dominante)]">
                                    {log.metadata.entiteRef}
                                </span>
                            )}
                            {log.cible && log.metadata?.entiteLabel && (
                                <span className="rounded-full bg-[var(--color-surface-hover)] px-2 py-0.5 text-[10px] text-[var(--color-texte-secondaire)]">
                                    {log.cible}
                                </span>
                            )}
                        </div>
                        {log.cibleId && (
                            <CopyableId id={log.cibleId} t={t} />
                        )}
                    </div>
                </DetailSection>
            )}

            {/* ── Section Relations contextuelles ── */}
            {(activeSection === 'general' || activeSection === 'cible') && hasRelations && (
                <DetailSection title={t('audit.page.contexte')} icon={GitBranch}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-sm)]">
                        {Object.entries(log.metadata!.relations!).map(([key, rel]) => {
                            const relNav = resolveRelationNavLink(key, rel);
                            const relKey = `audit.relations.${key}`;
                            const relLabel = t(relKey) === relKey ? key : t(relKey);

                            return (
                                <div key={key}
                                    className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                                    style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.625rem)' }}>
                                    <span className="text-[var(--color-texte-secondaire)] font-medium uppercase tracking-wide block"
                                        style={{ fontSize: 'clamp(0.5rem, 0.48rem + 0.06vw, 0.5625rem)' }}>
                                        {relLabel}
                                    </span>
                                    {rel.label && relNav && hasPermission(relNav.permission) ? (
                                        <Link
                                            to={relNav.to as string}
                                            params={relNav.params}
                                            className="inline-flex items-center gap-1 text-[var(--color-dominante)] hover:underline font-medium mt-0.5 break-all"
                                            style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}
                                        >
                                            <span>{rel.label}</span>
                                            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60" />
                                        </Link>
                                    ) : rel.label ? (
                                        <span className="text-[var(--color-texte)] font-medium block mt-0.5 break-all"
                                            style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}>
                                            {rel.label}
                                        </span>
                                    ) : null}
                                    <div className="flex items-center gap-1">
                                        <CopyableId id={rel.id} t={t} />
                                        {!rel.label && relNav && hasPermission(relNav.permission) && (
                                            <Link
                                                to={relNav.to as string}
                                                params={relNav.params}
                                                className="inline-flex shrink-0 text-[var(--color-dominante)] hover:opacity-80"
                                                aria-label={relLabel}
                                                title={relLabel}
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DetailSection>
            )}

            {/* ── Section Entité parente ── */}
            {(activeSection === 'general' || activeSection === 'cible') && log.parentCible && (
                <DetailSection title={t('audit.page.parentCible')} icon={GitBranch}>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                        style={{ padding: 'clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)' }}>
                        <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                            {parentNavLink && hasPermission(parentNavLink.permission) ? (
                                <Link
                                    to={parentNavLink.to as string}
                                    params={parentNavLink.params}
                                    className="inline-flex items-center gap-1.5 text-[var(--color-dominante)] hover:underline font-medium"
                                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}
                                >
                                    {log.parentCible}
                                    <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                                </Link>
                            ) : (
                                <span className="font-medium text-[var(--color-texte)]"
                                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                                    {log.parentCible}
                                </span>
                            )}
                        </div>
                        {log.parentCibleId && (
                            <CopyableId id={log.parentCibleId} t={t} />
                        )}
                    </div>
                </DetailSection>
            )}

            {/* ── Section Description ── */}
            {(activeSection === 'general') && log.description && (
                <div className="rounded-[var(--radius-md)] border-l-[3px] border-l-[var(--color-dominante)]/40 bg-[var(--color-surface-hover)] pl-[var(--space-md)] pr-[var(--space-sm)] py-[var(--space-sm)]">
                    <p className="text-[var(--color-texte)] italic"
                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem)' }}>
                        {log.description}
                    </p>
                </div>
            )}

            {/* ── Section Environnement technique ── */}
            {(activeSection === 'general' || activeSection === 'environnement') && (log.ipAddress || log.navigateur || log.systemeExploitation || log.appareil) && (
                <DetailSection title={t('audit.environnementTechnique')} icon={Monitor}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-sm)]">
                        {log.ipAddress && (
                            <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                                style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.625rem)' }}>
                                <span className="text-[var(--color-texte-secondaire)] font-medium uppercase tracking-wide block"
                                    style={{ fontSize: 'clamp(0.5rem, 0.48rem + 0.06vw, 0.5625rem)' }}>
                                    {t('audit.adresseIp')}
                                </span>
                                <span className="text-[var(--color-texte)] font-mono block mt-0.5"
                                    style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}>
                                    {log.ipAddress}
                                </span>
                            </div>
                        )}
                        {log.navigateur && (
                            <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                                style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.625rem)' }}>
                                <span className="text-[var(--color-texte-secondaire)] font-medium uppercase tracking-wide block"
                                    style={{ fontSize: 'clamp(0.5rem, 0.48rem + 0.06vw, 0.5625rem)' }}>
                                    {t('audit.navigateur')}
                                </span>
                                <span className="text-[var(--color-texte)] block mt-0.5"
                                    style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}>
                                    {log.navigateur}
                                </span>
                            </div>
                        )}
                        {log.systemeExploitation && (
                            <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                                style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.625rem)' }}>
                                <span className="text-[var(--color-texte-secondaire)] font-medium uppercase tracking-wide block"
                                    style={{ fontSize: 'clamp(0.5rem, 0.48rem + 0.06vw, 0.5625rem)' }}>
                                    {t('audit.systeme')}
                                </span>
                                <span className="text-[var(--color-texte)] block mt-0.5"
                                    style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}>
                                    {log.systemeExploitation}
                                </span>
                            </div>
                        )}
                        {log.appareil && (
                            <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)]"
                                style={{ padding: 'clamp(0.375rem, 0.3rem + 0.2vw, 0.625rem)' }}>
                                <span className="text-[var(--color-texte-secondaire)] font-medium uppercase tracking-wide block"
                                    style={{ fontSize: 'clamp(0.5rem, 0.48rem + 0.06vw, 0.5625rem)' }}>
                                    {t('audit.appareil')}
                                </span>
                                <span className="text-[var(--color-texte)] block mt-0.5"
                                    style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}>
                                    {log.appareil}
                                </span>
                            </div>
                        )}
                    </div>
                </DetailSection>
            )}

            {/* ── Section Diff (champs modifiés) ── */}
            {(activeSection === 'general' || activeSection === 'modifications') && fields.length > 0 && (
                <DetailSection title={`${t('audit.page.modifications')} (${fields.length})`} icon={Pencil}>
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] overflow-hidden">
                        <table className="w-full" style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem)' }}>
                            <thead>
                                <tr className="bg-[var(--color-surface-hover)] border-b border-[var(--color-bordure)]">
                                    <th className="px-3 py-2 text-left font-medium text-[var(--color-texte-secondaire)]">{t('audit.champ')}</th>
                                    <th className="px-3 py-2 text-left font-medium text-[var(--color-texte-secondaire)]">{t('audit.avant')}</th>
                                    <th className="px-3 py-2 text-left font-medium text-[var(--color-texte-secondaire)]">{t('audit.apres')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fields.map((field) => {
                                    const avant = log.anciennesValeurs?.[field];
                                    const apres = log.nouvellesValeurs?.[field];
                                    const hasChanged = JSON.stringify(avant) !== JSON.stringify(apres);
                                    return (
                                        <tr key={field} className={cn(
                                            'border-b border-[var(--color-bordure)] last:border-0',
                                            hasChanged && 'bg-[var(--color-warning)]/[0.03]',
                                        )}>
                                            <td className="px-3 py-2 font-mono text-[var(--color-texte)] whitespace-nowrap">{field}</td>
                                            <td className="px-3 py-2 text-[var(--color-danger)] break-all max-w-[200px]">
                                                {formatValue(avant)}
                                            </td>
                                            <td className="px-3 py-2 text-[var(--color-success)] break-all max-w-[200px]">
                                                {formatValue(apres)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </DetailSection>
            )}

        </div>
    );
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
}
