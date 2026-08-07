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
    Shield, AlertTriangle, AlertCircle, CheckCircle2, RefreshCw,
    Users, Building2, BookOpen, Filter, CalendarOff,
} from 'lucide-react';
import { useAuditConflits } from '../hooks/use-emploi-du-temps';
import type { AuditConflitDetail, TypeConflit } from '../types/edt.types';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { StatCard } from '@/components/ui';

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
                <StatCard
                    icon={AlertTriangle}
                    label={t('audit.totalConflits')}
                    value={String(totalConflits)}
                    tone={totalConflits > 0 ? 'danger' : 'success'}
                    orientation="horizontal"
                    compact
                />
                <StatCard
                    icon={Users}
                    label={t('audit.bloquants')}
                    value={String(bloquants)}
                    tone={bloquants > 0 ? 'danger' : 'success'}
                    orientation="horizontal"
                    compact
                />
                <StatCard
                    icon={BookOpen}
                    label={t('audit.avertissements')}
                    value={String(avertissements)}
                    tone={avertissements > 0 ? 'warning' : 'success'}
                    orientation="horizontal"
                    compact
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
                                className={`rounded-xl border border-[var(--color-bordure)] overflow-hidden border-l-[3px] ${borderLColor(type)}`}
                            >
                                {/* Header du groupe */}
                                <div className={`flex items-center justify-between px-[var(--space-md)] py-[var(--space-sm)] ${headerBgColor(type)}`}>
                                    <div className="flex items-center gap-[var(--gap-xs)]">
                                        {iconeType(type)}
                                        <span
                                            className="font-semibold text-[var(--color-text-primary)]"
                                            style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                                        >
                                            {t(`audit.types.${type}`)}
                                        </span>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor(type)}`}>
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
                    <AlertCircle className="h-3 w-3" />
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
        case 'CONFLIT_JOUR_FERIE':
            return <CalendarOff className={`${cls} text-[var(--color-accent-600)]`} />;
        default:
            return <Shield className={`${cls} text-[var(--color-text-muted)]`} />;
    }
}

/** Couleur de la bordure gauche selon le type de conflit */
function borderLColor(type: TypeConflit): string {
    switch (type) {
        case 'CONFLIT_CLASSE': return 'border-l-[var(--color-danger)]';
        case 'CONFLIT_ENSEIGNANT': return 'border-l-[var(--color-warning)]';
        case 'CONFLIT_SALLE': return 'border-l-[var(--color-accent-600)]';
        case 'CONFLIT_JOUR_FERIE': return 'border-l-[var(--color-accent-600)]';
        default: return 'border-l-[var(--color-text-muted)]';
    }
}

/** Background du header selon le type de conflit */
function headerBgColor(type: TypeConflit): string {
    switch (type) {
        case 'CONFLIT_CLASSE': return 'bg-[var(--color-danger)]/5';
        case 'CONFLIT_ENSEIGNANT': return 'bg-[var(--color-warning)]/5';
        case 'CONFLIT_SALLE': return 'bg-[var(--color-accent-600)]/5';
        case 'CONFLIT_JOUR_FERIE': return 'bg-[var(--color-accent-600)]/5';
        default: return 'bg-[var(--color-surface-alt)]';
    }
}

/** Couleur du badge count selon le type de conflit */
function badgeColor(type: TypeConflit): string {
    switch (type) {
        case 'CONFLIT_CLASSE': return 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]';
        case 'CONFLIT_ENSEIGNANT': return 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]';
        case 'CONFLIT_SALLE': return 'bg-[var(--color-accent-600)]/10 text-[var(--color-accent-700)]';
        case 'CONFLIT_JOUR_FERIE': return 'bg-[var(--color-accent-600)]/10 text-[var(--color-accent-700)]';
        default: return 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]';
    }
}
