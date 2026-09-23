/**
 * ==================================
 * eLISAschool - ActiviteTab — Detail etablissement
 * ==================================
 * Version: 2.0.0 — Spécialisé pédagogique (sans redondances)
 * Auteur: franck arlos chendjou
 *
 * Spécialisation : vie scolaire UNIQUEMENT (effectifs, occupation,
 * ventilation, timeline d'activité, comparaison plateforme).
 * - Les modules vivent dans l'onglet Configuration (canonique).
 * - Les métriques financières vivent dans l'onglet Finances (canonique).
 * - La timeline est un APERÇU (compteurs + 5 derniers) ; le Journal
 *   reste l'exhaustif paginé avec filtres.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    Users, GraduationCap, BookOpen, Layers,
    TrendingUp, BarChart3, Activity,
    UserCheck, UserX, ArrowUpRight, ArrowDownRight, Heart,
    Package, DollarSign, ArrowRight,
} from 'lucide-react';
import { SectionCard, getTauxColor, formatRelativeTime } from './shared';
import { usePlatformStats, useEtablissementComparaison } from '../../hooks/use-etablissement-detail';
import type { Etablissement, EtablissementDetailStats, ActiviteEtablissementResult } from '@/features/etablissements/types/etablissement.types';

export function ActiviteTab({ stats, etablissement, activite }: {
    stats: EtablissementDetailStats;
    etablissement: Etablissement;
    // Optionnel : l'onglet reste utilisable (stats de base) pendant
    // le chargement ou en cas d'échec de la requête activité.
    activite?: ActiviteEtablissementResult;
}) {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const goTab = (tab: 'configuration' | 'finances' | 'journal') =>
        navigate({ to: '/platform/etablissements/$id', params: { id: etablissement.id }, search: { tab } as never });

    // Données de ventilation (depuis activite ou fallback sur stats)
    const ventilation = activite?.ventilation;
    const timeline = activite?.timeline;

    // Stats plateforme pour comparaison (hook centralisé — voir use-etablissement-detail.ts)
    const { data: platformStats } = usePlatformStats();

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

            {/* ===== Aperçu activité récente (compteurs + 5 derniers, sans doublonner le Journal) ===== */}
            {timeline && (timeline.compteurs.length > 0 || timeline.evenements.length > 0) && (
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

                    {/* 5 derniers événements + renvoi vers le Journal exhaustif */}
                    {timeline.evenements.length > 0 && (
                        <div className="space-y-[var(--space-sm)]">
                            <p className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.activite.timeline.derniersEvenements', 'Derniers événements')}
                            </p>
                            <div className="space-y-1">
                                {timeline.evenements.slice(0, 5).map((evt) => (
                                    <div key={evt.id} className="flex items-start gap-[var(--gap-xs)] rounded-lg p-[var(--space-xs)]"
                                        style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                                        {/* Indicateur sévérité */}
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                            evt.severity === 'CRITICAL' ? 'bg-[var(--color-danger-400)]' :
                                            evt.severity === 'WARNING' ? 'bg-[var(--color-warning-400)]' : 'bg-[var(--color-accent-400)]'
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
                            <button
                                onClick={() => goTab('journal')}
                                className="inline-flex items-center gap-[var(--gap-xxs)] text-xs font-medium transition-opacity hover:opacity-80"
                                style={{ color: 'var(--color-dominant-600)' }}
                            >
                                {t('etablissements.detail.activite.voirJournalComplet', 'Voir le journal complet')}
                                <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </SectionCard>
            )}

            {/* ===== Renvois vers les onglets canoniques (modules, finances) ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                <button
                    onClick={() => goTab('configuration')}
                    className="flex items-center justify-between gap-[var(--gap-sm)] rounded-xl border px-[clamp(1rem,0.8rem+0.5vw,1.5rem)] py-[clamp(0.75rem,0.6rem+0.4vw,1rem)] text-left transition-colors hover:bg-[var(--color-surface-alt)]"
                    style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                >
                    <span className="flex items-center gap-[var(--gap-sm)]">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-success-100)' }}>
                            <Package className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: 'var(--color-success-700)' }} />
                        </span>
                        <span>
                            <span className="block text-sm font-semibold" style={{ color: 'var(--color-texte)' }}>
                                {t('etablissements.detail.activite.voirModules', 'Voir les modules')}
                            </span>
                            <span className="block text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.activite.voirModulesHint', 'Modules actifs et quotas dans Configuration')}
                            </span>
                        </span>
                    </span>
                    <ArrowRight className="h-[var(--icon-sm)] w-[var(--icon-sm)] shrink-0" style={{ color: 'var(--color-texte-muted)' }} />
                </button>
                <button
                    onClick={() => goTab('finances')}
                    className="flex items-center justify-between gap-[var(--gap-sm)] rounded-xl border px-[clamp(1rem,0.8rem+0.5vw,1.5rem)] py-[clamp(0.75rem,0.6rem+0.4vw,1rem)] text-left transition-colors hover:bg-[var(--color-surface-alt)]"
                    style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                >
                    <span className="flex items-center gap-[var(--gap-sm)]">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-warning-100)' }}>
                            <DollarSign className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: 'var(--color-warning-700)' }} />
                        </span>
                        <span>
                            <span className="block text-sm font-semibold" style={{ color: 'var(--color-texte)' }}>
                                {t('etablissements.detail.activite.voirFinances', 'Voir les finances')}
                            </span>
                            <span className="block text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.activite.voirFinancesHint', 'Factures, recouvrement et abonnement')}
                            </span>
                        </span>
                    </span>
                    <ArrowRight className="h-[var(--icon-sm)] w-[var(--icon-sm)] shrink-0" style={{ color: 'var(--color-texte-muted)' }} />
                </button>
            </div>

            {/* ===== Comparaison vs moyenne plateforme ===== */}
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

export function ComparaisonPlateforme({
    stats,
    etablissement,
    platformStats,
    t,
}: {
    stats: EtablissementDetailStats;
    etablissement: Etablissement;
    platformStats: { total: number; totalEleves: number; totalUtilisateurs: number; scoreMoyen: number };
    t: (key: string, fallback: string, options?: Record<string, unknown>) => string;
}) {
    // Données de comparaison enrichies depuis le backend (hook centralisé)
    const { data: comparaison } = useEtablissementComparaison(etablissement.id);

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
