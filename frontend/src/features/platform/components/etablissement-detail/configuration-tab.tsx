/**
 * ==================================
 * eLISAschool - ConfigurationTab — Detail etablissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Settings, Package, Shield, CheckCircle2, XCircle,
    AlertTriangle, ExternalLink, Edit, RefreshCw,
    Users, GraduationCap, BookOpen, Layers,
} from 'lucide-react';
import { SectionCard, InfoGrid, InfoField, ActionButton, ConfigBadge } from './shared';
import type { Etablissement, EtablissementConfig, ConfigCompleteResult, EtablissementDetailStats, UtilisateursResumeResult } from '@/features/etablissements/types/etablissement.types';
import { TYPE_LABELS, SOUS_SYSTEME_LABELS, PLAN_LABELS } from '@/features/etablissements/types/etablissement.types';

export function ConfigurationTab({ config, etablissement, configComplete, stats, utilisateurs, etablissementId, onRefetch }: {
    config: EtablissementConfig;
    etablissement: Etablissement;
    configComplete: ConfigCompleteResult;
    stats: EtablissementDetailStats;
    utilisateurs: UtilisateursResumeResult;
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

    // Labels catégories (alignées sur CategorieModule backend : GRATUIT | PAYANT)
    const CATEGORIE_LABELS: Record<string, string> = {
        GRATUIT: t('etablissements.detail.config.catGratuit', 'Gratuit'),
        PAYANT: t('etablissements.detail.config.catPayant', 'Payant'),
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
                        ? { bg: 'var(--color-danger-50)', border: 'var(--color-danger-200)', text: 'var(--color-danger-700)', dot: 'bg-[var(--color-danger-500)]' }
                        : expireBientot
                            ? { bg: 'var(--color-warning-50)', border: 'var(--color-warning-200)', text: 'var(--color-warning-700)', dot: 'bg-[var(--color-warning-500)]' }
                            : { bg: 'var(--color-success-50)', border: 'var(--color-success-200)', text: 'var(--color-success-700)', dot: 'bg-[var(--color-success-500)]' };
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
                                                : expiration
                                                    ? t('etablissements.detail.config.expireLe', 'Expire le {{date}}', { date: expiration.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) })
                                                    : null
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
                                            <span className={`w-1.5 h-1.5 rounded-full ${mod.actif ? 'bg-[var(--color-success-400)]' : 'bg-[var(--color-text-muted)]'}`} />
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
                            {config.cyclesActifs.map((_cycleId, idx) => (
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
