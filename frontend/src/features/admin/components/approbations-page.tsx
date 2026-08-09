/**
 * ==================================
 * eLISAschool - Page Approbations (Actions Critiques)
 * ==================================
 * Page plateforme — Workflow d'approbation 2F pour actions sensibles.
 * Liste, détail, approbation MFA, rejet, annulation.
 *
 * Lot F — Refonte SaaS v7
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
    Shield,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    Ban,
    Play,
    RefreshCw,
    ShieldAlert,
    Timer,
} from 'lucide-react';
import {
    useListerActionsCritiques,
    useApprouverActionCritique,
    useRejeterActionCritique,
    useAnnulerActionCritique,
    getTypeActionLabels,
    getStatutLabels,
    STATUT_VARIANTS,
    type ActionCritique,
    type StatutActionCritique,
    type TypeActionCritique,
    type ListerActionsFilters,
} from '../hooks/use-actions-critiques';
import { CustomModal } from '@/components/modals/CustomModal';

// ==========================================
// Helpers
// ==========================================

function formaterDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

function tempsRestant(dateExpiration: string, t: TFunction): string {
    const now = Date.now();
    const exp = new Date(dateExpiration).getTime();
    const diff = exp - now;
    if (diff <= 0) return t('approbations.expire', { defaultValue: 'Expiré' });
    const heures = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (heures > 0) return `${heures}h ${minutes}min`;
    return `${minutes}min`;
}

// ==========================================
// Composant principal
// ==========================================

export default function ApprobationsPage() {
    const { t } = useTranslation('admin');
    const [filters, setFilters] = useState<ListerActionsFilters>({});
    const [actionSelectionnee, setActionSelectionnee] = useState<ActionCritique | null>(null);
    const [modalApprouver, setModalApprouver] = useState(false);
    const [modalRejeter, setModalRejeter] = useState(false);
    const [codeMFA, setCodeMFA] = useState('');
    const [motifRejet, setMotifRejet] = useState('');

    // Queries
    const { data, isLoading, refetch } = useListerActionsCritiques(filters);

    // Labels i18n
    const TYPE_ACTION_LABELS = getTypeActionLabels(t);
    const STATUT_LABELS = getStatutLabels(t);

    // Mutations
    const approuverMutation = useApprouverActionCritique(t);
    const rejeterMutation = useRejeterActionCritique(t);
    const annulerMutation = useAnnulerActionCritique(t);

    const actions = data?.data || [];
    const pagination = data?.pagination;
    const statsResponse = data?.stats;

    // Handlers
    const handleApprouver = () => {
        if (!actionSelectionnee || !codeMFA) return;
        approuverMutation.mutate(
            { id: actionSelectionnee.id, codeMFA },
            {
                onSuccess: () => {
                    setModalApprouver(false);
                    setCodeMFA('');
                    setActionSelectionnee(null);
                },
            },
        );
    };

    const handleRejeter = () => {
        if (!actionSelectionnee || !motifRejet) return;
        rejeterMutation.mutate(
            { id: actionSelectionnee.id, motif: motifRejet },
            {
                onSuccess: () => {
                    setModalRejeter(false);
                    setMotifRejet('');
                    setActionSelectionnee(null);
                },
            },
        );
    };

    const handleAnnuler = (action: ActionCritique) => {
        annulerMutation.mutate(action.id, {
            onSuccess: () => setActionSelectionnee(null),
        });
    };

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]">
            {/* Header */}
            <div className="flex flex-col gap-[var(--gap-sm)]">
                <div className="flex items-center gap-[var(--gap-md)]">
                    <Shield className="h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-accent-600)]" />
                    <div>
                        <h1 style={{ fontSize: 'clamp(1.125rem, 1rem + 0.5vw, 1.5rem)' }} className="font-bold text-[var(--color-texte)]">
                            {t('approbations.titre', { defaultValue: 'Approbations Actions Critiques' })}
                        </h1>
                        <p style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }} className="text-[var(--color-texte-secondaire)]">
                            {t('approbations.description', { defaultValue: 'Workflow 2F pour les opérations sensibles de la plateforme' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[var(--gap-md)]">
                <StatCard
                    icone={<Clock className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    label={t('approbations.enAttente', { defaultValue: 'En attente' })}
                    value={statsResponse?.enAttente ?? 0}
                    color="warning"
                />
                <StatCard
                    icone={<CheckCircle2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    label={t('approbations.approuvees', { defaultValue: 'Approuvées' })}
                    value={statsResponse?.approuvees ?? 0}
                    color="success"
                />
                <StatCard
                    icone={<XCircle className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    label={t('approbations.rejetees', { defaultValue: 'Rejetées' })}
                    value={statsResponse?.rejetees ?? 0}
                    color="danger"
                />
                <StatCard
                    icone={<Play className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    label={t('approbations.executees', { defaultValue: 'Exécutées' })}
                    value={statsResponse?.executees ?? 0}
                    color="info"
                />
                <StatCard
                    icone={<Timer className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    label={t('approbations.expirees', { defaultValue: 'Expirées' })}
                    value={statsResponse?.expirees ?? 0}
                    color="secondary"
                />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-[var(--gap-sm)] p-[var(--padding-toolbar)] rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)]">
                {/* Filtre statut */}
                <select
                    value={filters.statut || ''}
                    onChange={(e) => setFilters(f => ({ ...f, statut: (e.target.value || undefined) as StatutActionCritique | undefined }))}
                    className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-[clamp(0.25rem,0.2rem+0.2vw,0.5rem)]"
                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                >
                    <option value="">{t('approbations.tousStatuts', { defaultValue: 'Tous les statuts' })}</option>
                    {Object.entries(STATUT_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>

                {/* Filtre type */}
                <select
                    value={filters.typeAction || ''}
                    onChange={(e) => setFilters(f => ({ ...f, typeAction: (e.target.value || undefined) as TypeActionCritique | undefined }))}
                    className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-[clamp(0.25rem,0.2rem+0.2vw,0.5rem)]"
                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                >
                    <option value="">{t('approbations.tousTypes', { defaultValue: 'Tous les types' })}</option>
                    {Object.entries(TYPE_ACTION_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>

                <div className="flex-1" />

                {/* Refresh */}
                <button
                    onClick={() => refetch()}
                    className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] p-2 hover:bg-[var(--color-surface-hover)] transition-colors"
                    title={t('common:boutons.rafraichir', { defaultValue: 'Rafraîchir' })}
                >
                    <RefreshCw className={`h-[var(--icon-xs)] w-[var(--icon-xs)] ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Liste */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-[var(--icon-md)] w-[var(--icon-md)] animate-spin text-[var(--color-accent-600)]" />
                </div>
            ) : actions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-[var(--gap-md)] text-[var(--color-texte-secondaire)]">
                    <Shield className="h-[var(--icon-lg)] w-[var(--icon-lg)] opacity-40" />
                    <p style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                        {t('approbations.aucuneAction', { defaultValue: 'Aucune action critique trouvée' })}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-[var(--gap-sm)]">
                    {actions.map((action) => (
                        <ActionCritiqueCard
                            key={action.id}
                            action={action}
                            onVoir={() => setActionSelectionnee(action)}
                            onApprouver={() => { setActionSelectionnee(action); setModalApprouver(true); }}
                            onRejeter={() => { setActionSelectionnee(action); setModalRejeter(true); }}
                            onAnnuler={() => handleAnnuler(action)}
                        />
                    ))}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-[var(--gap-sm)] pt-4">
                            <button
                                disabled={!pagination.page || pagination.page <= 1}
                                onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) - 1 }))}
                                className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-3 py-1.5 text-sm disabled:opacity-40"
                            >
                                ← {t('common:boutons.precedent', { defaultValue: 'Précédent' })}
                            </button>
                            <span className="text-sm text-[var(--color-texte-secondaire)]">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) + 1 }))}
                                className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-3 py-1.5 text-sm disabled:opacity-40"
                            >
                                {t('common:boutons.suivant', { defaultValue: 'Suivant' })} →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Détail */}
            {actionSelectionnee && !modalApprouver && !modalRejeter && (
                <CustomModal
                    open={!!actionSelectionnee}
                    onOpenChange={(v) => { if (!v) setActionSelectionnee(null); }}
                    title={t('approbations.detailTitre', { defaultValue: 'Détail Action Critique' })}
                    size="2xl"
                >
                    <DetailAction action={actionSelectionnee} />
                </CustomModal>
            )}

            {/* Modal Approbation MFA */}
            <CustomModal
                open={modalApprouver}
                onOpenChange={(v) => { if (!v) { setModalApprouver(false); setCodeMFA(''); } }}
                title={t('approbations.approuverTitre', { defaultValue: 'Approuver avec MFA' })}
                size="md"
                footer={<>
                    <button
                        onClick={() => { setModalApprouver(false); setCodeMFA(''); }}
                        className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-4 py-2 text-sm"
                    >
                        {t('common:boutons.annuler', { defaultValue: 'Annuler' })}
                    </button>
                    <button
                        onClick={handleApprouver}
                        disabled={codeMFA.length !== 6 || approuverMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-success-600,var(--color-dominant-600))] px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                        {approuverMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4" />
                        )}
                        {t('approbations.confirmerApprobation', { defaultValue: 'Confirmer' })}
                    </button>
                </>}
            >
                <div className="flex flex-col gap-[var(--gap-md)]">
                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-accent-200,var(--color-accent-100))] bg-[var(--color-accent-50,var(--color-surface-hover))] p-[var(--padding-modal-body)]">
                        <p className="text-sm font-medium text-[var(--color-texte)]">
                            {actionSelectionnee?.typeAction && TYPE_ACTION_LABELS[actionSelectionnee.typeAction]}
                        </p>
                        {actionSelectionnee?.raison && (
                            <p className="mt-1 text-xs text-[var(--color-texte-secondaire)]">
                                {actionSelectionnee.raison}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-[var(--gap-xs)]">
                        <label className="text-sm font-medium text-[var(--color-texte)]">
                            {t('approbations.codeMFA', { defaultValue: 'Code MFA (6 chiffres)' })}
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={codeMFA}
                            onChange={(e) => setCodeMFA(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] bg-[var(--color-surface)] text-[var(--color-texte)]"
                            style={{ fontSize: 'clamp(1.125rem, 1rem + 0.5vw, 1.5rem)' }}
                            autoFocus
                        />
                        <p className="text-xs text-[var(--color-texte-secondaire)]">
                            {t('approbations.mfaExplication', 'Entrez le code TOTP de votre application d\'authentification')}
                        </p>
                    </div>
                </div>
            </CustomModal>

            {/* Modal Rejet */}
            <CustomModal
                open={modalRejeter}
                onOpenChange={(v) => { if (!v) { setModalRejeter(false); setMotifRejet(''); } }}
                title={t('approbations.rejeterTitre', 'Rejeter l\'action')}
                size="md"
                footer={<>
                    <button
                        onClick={() => { setModalRejeter(false); setMotifRejet(''); }}
                        className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-4 py-2 text-sm"
                    >
                        {t('common:boutons.annuler', { defaultValue: 'Annuler' })}
                    </button>
                    <button
                        onClick={handleRejeter}
                        disabled={!motifRejet.trim() || rejeterMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-danger-600,#dc2626)] px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                        {rejeterMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <XCircle className="h-4 w-4" />
                        )}
                        {t('approbations.confirmerRejet', { defaultValue: 'Rejeter' })}
                    </button>
                </>}
            >
                <div className="flex flex-col gap-[var(--gap-xs)]">
                    <label className="text-sm font-medium text-[var(--color-texte)]">
                        {t('approbations.motifRejet', { defaultValue: 'Motif du rejet' })}
                    </label>
                    <textarea
                        value={motifRejet}
                        onChange={(e) => setMotifRejet(e.target.value)}
                        rows={3}
                        className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-texte)]"
                        placeholder={t('approbations.motifPlaceholder', { defaultValue: 'Expliquez pourquoi vous rejetez cette action...' })}
                        autoFocus
                    />
                </div>
            </CustomModal>
        </div>
    );
}

// ==========================================
// Sous-composants
// ==========================================

function StatCard({ icone, label, value, color }: {
    icone: React.ReactNode;
    label: string;
    value: number;
    color: 'warning' | 'success' | 'danger' | 'info' | 'secondary';
}) {
    const colorMap: Record<string, string> = {
        warning: 'var(--color-warning-100, #fef3c7)',
        success: 'var(--color-success-100, var(--color-dominant-100, #dcfce7))',
        danger: 'var(--color-danger-100, #fee2e2)',
        info: 'var(--color-info-100, var(--color-accent-100, #dbeafe))',
        secondary: 'var(--color-secondary-100, #f3f4f6)',
    };

    return (
        <div
            className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] p-[clamp(0.5rem,0.4rem+0.3vw,1rem)]"
            style={{ backgroundColor: colorMap[color] }}
        >
            <div className="flex items-center gap-[var(--gap-xs)]">
                {icone}
                <span style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.2vw, 0.75rem)' }} className="text-[var(--color-texte-secondaire)]">
                    {label}
                </span>
            </div>
            <p style={{ fontSize: 'clamp(1.125rem, 1rem + 0.5vw, 1.5rem)' }} className="mt-1 font-bold text-[var(--color-texte)]">
                {value}
            </p>
        </div>
    );
}

function ActionCritiqueCard({ action, onVoir, onApprouver, onRejeter, onAnnuler }: {
    action: ActionCritique;
    onVoir: () => void;
    onApprouver: () => void;
    onRejeter: () => void;
    onAnnuler: () => void;
}) {
    const { t } = useTranslation('admin');
    const TYPE_ACTION_LABELS = getTypeActionLabels(t);
    const estExpiree = action.statut === 'EN_ATTENTE' && new Date() > new Date(action.dateExpiration);

    return (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[clamp(0.5rem,0.4rem+0.3vw,1rem)]">
            <div className="flex flex-wrap items-start gap-[var(--gap-sm)]">
                {/* Icône type */}
                <div className="rounded-[var(--radius-md)] bg-[var(--color-accent-100,var(--color-surface-hover))] p-2">
                    <ShieldAlert className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-accent-600)]" />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-[150px]">
                    <div className="flex flex-wrap items-center gap-[var(--gap-xs)]">
                        <span style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }} className="font-medium text-[var(--color-texte)]">
                            {TYPE_ACTION_LABELS[action.typeAction]}
                        </span>
                        <StatusBadge statut={action.statut} />
                        {estExpiree && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-warning-100,#fef3c7)] px-2 py-0.5 text-xs text-[var(--color-warning-800,#92400e)]">
                                <Timer className="h-3 w-3" />
                                Expiré
                            </span>
                        )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-texte-secondaire)]">
                        <span>{t('approbations.demandeur', { defaultValue: 'Demandeur' })} : {action.demandeur?.prenom} {action.demandeur?.nom}</span>
                        <span>{formaterDate(action.dateDemande)}</span>
                        {action.etablissement && <span>{t('approbations.etablissement', { defaultValue: 'Étab.' })} : {action.etablissement.nom}</span>}
                        {action.statut === 'EN_ATTENTE' && (
                            <span className="text-[var(--color-warning-700,#b45309)]">
                                ⏱ {tempsRestant(action.dateExpiration, t)}
                            </span>
                        )}
                    </div>
                    {action.raison && (
                        <p className="mt-1 text-xs text-[var(--color-texte-secondaire)] italic line-clamp-1">
                            {action.raison}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-[var(--gap-xs)]">
                    <button
                        onClick={onVoir}
                        className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] p-1.5 hover:bg-[var(--color-surface-hover)] transition-colors"
                        title={t('common:boutons.voir', { defaultValue: 'Voir' })}
                    >
                        <Eye className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                    </button>
                    {action.statut === 'EN_ATTENTE' && !estExpiree && (
                        <>
                            <button
                                onClick={onApprouver}
                                className="rounded-[var(--radius-md)] bg-[var(--color-success-600,var(--color-dominant-600))] p-1.5 text-white hover:opacity-90 transition-opacity"
                                title={t('approbations.approuver', { defaultValue: 'Approuver (MFA)' })}
                            >
                                <CheckCircle2 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                            </button>
                            <button
                                onClick={onRejeter}
                                className="rounded-[var(--radius-md)] bg-[var(--color-danger-600,#dc2626)] p-1.5 text-white hover:opacity-90 transition-opacity"
                                title={t('approbations.rejeter', { defaultValue: 'Rejeter' })}
                            >
                                <XCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                            </button>
                            <button
                                onClick={onAnnuler}
                                className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] p-1.5 hover:bg-[var(--color-surface-hover)] transition-colors"
                                title={t('approbations.annuler', { defaultValue: 'Annuler' })}
                            >
                                <Ban className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ statut }: { statut: StatutActionCritique }) {
    const { t } = useTranslation('admin');
    const STATUT_LABELS = getStatutLabels(t);
    const variant = STATUT_VARIANTS[statut];
    const colorMap: Record<string, string> = {
        warning: 'bg-[var(--color-warning-100,#fef3c7)] text-[var(--color-warning-800,#92400e)]',
        success: 'bg-[var(--color-success-100,var(--color-dominant-100,#dcfce7))] text-[var(--color-success-800,var(--color-dominant-800,#166534))]',
        danger: 'bg-[var(--color-danger-100,#fee2e2)] text-[var(--color-danger-800,#991b1b)]',
        info: 'bg-[var(--color-info-100,var(--color-accent-100,#dbeafe))] text-[var(--color-info-800,var(--color-accent-800,#1e40af))]',
        secondary: 'bg-[var(--color-secondary-100,#f3f4f6)] text-[var(--color-secondary-800,#374151)]',
        default: 'bg-[var(--color-secondary-100,#f3f4f6)] text-[var(--color-secondary-800,#374151)]',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[variant] || colorMap.default}`}>
            {STATUT_LABELS[statut]}
        </span>
    );
}

function DetailAction({ action }: { action: ActionCritique }) {
    const { t } = useTranslation('admin');
    const TYPE_ACTION_LABELS = getTypeActionLabels(t);

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            {/* Type + Statut */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <ShieldAlert className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-accent-600)]" />
                    <div>
                        <p className="font-medium text-[var(--color-texte)]">{TYPE_ACTION_LABELS[action.typeAction]}</p>
                        <StatusBadge statut={action.statut} />
                    </div>
                </div>
            </div>

            {/* Payload */}
            {action.payload && Object.keys(action.payload).length > 0 && (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] p-[var(--padding-modal-body)]">
                    <p className="text-xs font-medium text-[var(--color-texte-secondaire)] mb-2">
                        {t('approbations.donneesAction', 'Données de l\'action')}
                    </p>
                    <pre className="text-xs bg-[var(--color-surface-hover)] rounded-[var(--radius-md)] p-2 overflow-auto max-h-40">
                        {JSON.stringify(action.payload, null, 2)}
                    </pre>
                </div>
            )}

            {/* Métadonnées */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-sm)] text-xs">
                <InfoRow label={t('approbations.demandeur', { defaultValue: 'Demandeur' })} value={`${action.demandeur?.prenom || ''} ${action.demandeur?.nom || ''}`} />
                <InfoRow label={t('approbations.dateDemande', { defaultValue: 'Date demande' })} value={formaterDate(action.dateDemande)} />
                {action.approuveur && (
                    <InfoRow label={t('approbations.approuveur', { defaultValue: 'Approuveur' })} value={`${action.approuveur.prenom} ${action.approuveur.nom}`} />
                )}
                {action.dateApprobation && (
                    <InfoRow label={t('approbations.dateApprobation', { defaultValue: 'Date approbation' })} value={formaterDate(action.dateApprobation)} />
                )}
                {action.etablissement && (
                    <InfoRow label={t('approbations.etablissement', { defaultValue: 'Établissement' })} value={action.etablissement.nom} />
                )}
                {action.cibleType && (
                    <InfoRow label={t('approbations.cible', { defaultValue: 'Cible' })} value={`${action.cibleType}`} />
                )}
                <InfoRow label={t('approbations.expiration', { defaultValue: 'Expiration' })} value={formaterDate(action.dateExpiration)} />
                <InfoRow label={t('approbations.tentatives', { defaultValue: 'Tentatives' })} value={`${action.tentativesApprobation}/5`} />
            </div>

            {/* Raison */}
            {action.raison && (
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] p-[var(--padding-modal-body)]">
                    <p className="text-xs font-medium text-[var(--color-texte-secondaire)] mb-1">
                        {t('approbations.raison', { defaultValue: 'Raison de la demande' })}
                    </p>
                    <p className="text-sm text-[var(--color-texte)]">{action.raison}</p>
                </div>
            )}

            {/* Motif rejet */}
            {action.motifRejet && (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-danger-200,#fecaca)] bg-[var(--color-danger-50,#fef2f2)] p-[var(--padding-modal-body)]">
                    <p className="text-xs font-medium text-[var(--color-danger-700,#b91c1c)] mb-1">
                        {t('approbations.motifRejet', { defaultValue: 'Motif du rejet' })}
                    </p>
                    <p className="text-sm text-[var(--color-danger-800,#991b1b)]">{action.motifRejet}</p>
                </div>
            )}

            {/* Résultat exécution */}
            {action.resultatExecution && (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-success-200,var(--color-dominant-200,#bbf7d0))] bg-[var(--color-success-50,var(--color-dominant-50,#f0fdf4))] p-[var(--padding-modal-body)]">
                    <p className="text-xs font-medium text-[var(--color-success-700,var(--color-dominant-700,#15803d))] mb-1">
                        {t('approbations.resultatExecution', 'Résultat d\'exécution')}
                    </p>
                    <pre className="text-xs overflow-auto max-h-32">
                        {JSON.stringify(action.resultatExecution, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <span className="text-[var(--color-texte-secondaire)]">{label} : </span>
            <span className="font-medium text-[var(--color-texte)]">{value}</span>
        </div>
    );
}
