/**
 * ==================================
 * eLISAschool - Audit des Conflits Emploi du Temps
 * ==================================
 * Composant d'audit global des conflits EDT
 * Affiche les conflits de classe, enseignant, salle groupés par sévérité
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Shield, AlertTriangle, CheckCircle2, RefreshCw,
    Users, Building2, BookOpen, Filter,
} from 'lucide-react';
import { useAuditConflits } from '../hooks/use-emploi-du-temps';
import type { AuditConflitDetail, TypeConflit } from '../types/edt.types';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';

type FiltreAudit = 'tous' | 'bloquants' | 'avertissements';

interface EDTAuditProps {
    /** Mode embarqué : pas de skeleton propre, utilise les données du parent */
    embedded?: boolean;
}

export function EDTAudit({ embedded = false }: EDTAuditProps) {
    const { t } = useTranslation('emplois');
    const [filtre, setFiltre] = useState<FiltreAudit>('tous');

    const { data: audit, isLoading, error, refetch, isRefetching } = useAuditConflits();

    const conflitsFiltres = useMemo(() => {
        if (!audit?.conflits) return [];
        switch (filtre) {
            case 'bloquants':
                return audit.conflits.filter(c => c.severite === 'BLOQUANT');
            case 'avertissements':
                return audit.conflits.filter(c => c.severite === 'AVERTISSEMENT');
            default:
                return audit.conflits;
        }
    }, [audit, filtre]);

    const conflitsGroupe = useMemo(() => {
        const groupes = new Map<TypeConflit, AuditConflitDetail[]>();
        for (const c of conflitsFiltres) {
            if (!groupes.has(c.type)) groupes.set(c.type, []);
            groupes.get(c.type)!.push(c);
        }
        return groupes;
    }, [conflitsFiltres]);

    if (error) {
        return <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />;
    }

    if (isLoading) return <PageSkeleton showHeader={false} showStats={false} showTable />;

    const totalConflits = audit?.totalConflits ?? 0;
    const bloquants = audit?.conflitsBloquants ?? 0;
    const avertissements = audit?.avertissements ?? 0;

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]">
            {embedded && (
                <h2
                    className="font-semibold text-[var(--color-text-primary)]"
                    style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
                >
                    {t('audit.titre')}
                </h2>
            )}
            {/* ─── KPIs Résumé ─────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--gap-md)]">
                <AuditKpi
                    icon={<AlertTriangle className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    label={t('audit.totalConflits')}
                    value={String(totalConflits)}
                    color={totalConflits > 0 ? 'danger' : 'success'}
                />
                <AuditKpi
                    icon={<Users className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    label={t('audit.bloquants')}
                    value={String(bloquants)}
                    color={bloquants > 0 ? 'danger' : 'success'}
                />
                <AuditKpi
                    icon={<BookOpen className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    label={t('audit.avertissements')}
                    value={String(avertissements)}
                    color={avertissements > 0 ? 'warning' : 'success'}
                />
            </div>

            {/* ─── État vide ───────────────────────────── */}
            {totalConflits === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-[var(--color-surface)] rounded-xl border border-[var(--color-bordure)]">
                    <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                    <h3
                        className="text-lg font-semibold text-[var(--color-text-primary)] mb-2"
                        style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}
                    >
                        {t('audit.aucunConflit')}
                    </h3>
                    <p
                        className="text-[var(--color-text-secondary)] max-w-md mx-auto"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                    >
                        {t('audit.aucunConflitDesc')}
                    </p>
                </div>
            )}

            {/* ─── Filtres + Actualiser ────────────────── */}
            {totalConflits > 0 && (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-[var(--gap-sm)]">
                        <div className="flex items-center gap-[var(--gap-xs)]">
                            <Filter className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-muted)]" />
                            {(['tous', 'bloquants', 'avertissements'] as FiltreAudit[]).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFiltre(f)}
                                    className={`px-[var(--space-sm)] py-[var(--space-xs)] rounded-lg font-medium transition-colors ${
                                        filtre === f
                                            ? 'bg-[var(--color-dominant-600)] text-white'
                                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                                    }`}
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                    aria-pressed={filtre === f}
                                >
                                    {t(`audit.filtres.${f}`)}
                                </button>
                            ))}
                        </div>
                        <ElisaButton
                            variant="outline"
                            size="xs"
                            icon={<RefreshCw className={`h-[var(--icon-xs)] w-[var(--icon-xs)] ${isRefetching ? 'animate-spin' : ''}`} />}
                            onClick={() => refetch()}
                        >
                            {t('audit.actualiser')}
                        </ElisaButton>
                    </div>

                    {/* ─── Liste groupée par type ──────────────── */}
                    <div className="flex flex-col gap-[var(--gap-md)]">
                        {Array.from(conflitsGroupe.entries()).map(([type, conflits]) => (
                            <div
                                key={type}
                                className="rounded-xl border border-[var(--color-bordure)] overflow-hidden"
                            >
                                {/* Header du groupe */}
                                <div className="flex items-center justify-between px-[var(--space-md)] py-[var(--space-sm)] bg-[var(--color-surface-alt)]">
                                    <div className="flex items-center gap-[var(--gap-xs)]">
                                        {iconeType(type)}
                                        <span
                                            className="font-semibold text-[var(--color-text-primary)]"
                                            style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                                        >
                                            {t(`audit.types.${type}`)}
                                        </span>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]">
                                        {conflits.length}
                                    </span>
                                </div>

                                {/* Conflits */}
                                <div className="divide-y divide-[var(--color-bordure)]">
                                    {conflits.map((conflit, i) => (
                                        <ConflitRow key={`${type}-${i}`} conflit={conflit} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Ligne de conflit ─────────────────────────────────

function ConflitRow({ conflit }: { conflit: AuditConflitDetail }) {
    const { t } = useTranslation('emplois');
    const estBloquant = conflit.severite === 'BLOQUANT';
    const jour = conflit.details.jour as string | undefined;

    return (
        <div className="flex flex-wrap items-center gap-[var(--gap-sm)] px-[var(--space-md)] py-[var(--space-sm)]">
            {/* Sévérité */}
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                estBloquant
                    ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                    : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
            }`}>
                {estBloquant ? (
                    <AlertTriangle className="h-3 w-3" />
                ) : (
                    <Building2 className="h-3 w-3" />
                )}
                {t(`audit.severites.${conflit.severite}`)}
            </span>

            {/* Message */}
            <span
                className="flex-1 text-[var(--color-text-primary)] min-w-0"
                style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
            >
                {conflit.message}
            </span>

            {/* Jour + horaire */}
            {jour && (
                <span className="text-xs text-[var(--color-text-secondary)] shrink-0">
                    {t(`jours.${jour.toLowerCase()}`)}
                </span>
            )}
        </div>
    );
}

// ─── KPI Card Audit ──────────────────────────────────

function AuditKpi({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: 'danger' | 'warning' | 'success';
}) {
    const bgMap = {
        danger: 'bg-[var(--color-danger)]/10',
        warning: 'bg-[var(--color-warning)]/10',
        success: 'bg-[var(--color-success)]/10',
    };
    const iconColorMap = {
        danger: 'text-[var(--color-danger)]',
        warning: 'text-[var(--color-warning)]',
        success: 'text-[var(--color-success)]',
    };

    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)] flex items-center gap-[var(--gap-sm)]">
            <div className={`p-[var(--space-xs)] rounded-[var(--radius-md)] ${bgMap[color]} ${iconColorMap[color]} shrink-0`}>
                {icon}
            </div>
            <div className="min-w-0">
                <div
                    className="font-bold text-[var(--color-text-primary)] truncate"
                    style={{ fontSize: 'clamp(1.25rem, 1rem + 0.8vw, 2rem)' }}
                >
                    {value}
                </div>
                <div
                    className="text-[var(--color-text-secondary)] truncate"
                    style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}
                >
                    {label}
                </div>
            </div>
        </div>
    );
}

// ─── Helpers ─────────────────────────────────────────

function iconeType(type: TypeConflit): React.ReactNode {
    const cls = 'h-[var(--icon-xs)] w-[var(--icon-xs)]';
    switch (type) {
        case 'CONFLIT_CLASSE':
            return <Users className={`${cls} text-[var(--color-danger)]`} />;
        case 'CONFLIT_ENSEIGNANT':
            return <Users className={`${cls} text-[var(--color-warning)]`} />;
        case 'CONFLIT_SALLE':
            return <Building2 className={`${cls} text-[var(--color-accent-600)]`} />;
        default:
            return <Shield className={`${cls} text-[var(--color-text-muted)]`} />;
    }
}
