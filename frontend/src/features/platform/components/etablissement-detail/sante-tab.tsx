/**
 * ==================================
 * eLISAschool - SanteTab — Detail etablissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight,
    Activity, RefreshCw, Lightbulb,
} from 'lucide-react';
import { SectionCard, getScoreColor } from './shared';
import { SanteEtablissement } from '@/features/platform/components/sante-etablissement';
import type { SanteEtablissementResult } from '@/features/platform/components/sante-etablissement';
import type { HistoriqueScoreSante } from '@/features/etablissements/types/etablissement.types';
import type { UseMutationResult } from '@tanstack/react-query';

export function SanteTab({ sante, etablissementId, recalculerSante, historique }: {
    sante: SanteEtablissementResult;
    etablissementId: string;
    recalculerSante: UseMutationResult<unknown, Error, string>;
    historique?: HistoriqueScoreSante[];
}) {
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
                            const levels = [0.25, 0.5, 0.75, 1];
                            const getPoint = (index: number, radius: number) => {
                                const angle = index * angleStep - Math.PI / 2;
                                return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
                            };
                            const dataPoints = criteres.map((c, i) => getPoint(i, (c.score / 100) * R));
                            const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

                            return (
                                <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
                                    <svg viewBox="0 0 160 160" className="w-full h-full">
                                        {levels.map((lvl) => {
                                            const pts = criteres.map((_, i) => getPoint(i, R * lvl));
                                            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
                                            return <path key={lvl} d={path} fill="none" stroke="var(--color-bordure)" strokeWidth="0.5" />;
                                        })}
                                        {criteres.map((_, i) => {
                                            const end = getPoint(i, R);
                                            return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--color-bordure)" strokeWidth="0.5" />;
                                        })}
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
                        <div className="w-full h-16 sm:h-20">
                            <svg viewBox={`0 0 ${historique.length * 8} 80`} className="w-full h-full" preserveAspectRatio="none">
                                <line x1="0" y1="40" x2={historique.length * 8} y2="40" stroke="var(--color-bordure)" strokeWidth="0.5" strokeDasharray="2,2" />
                                <motion.path
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.15 }}
                                    transition={{ duration: 0.8 }}
                                    d={`M0,80 ${historique.map((h, i) => `L${i * 8},${80 - (h.score / 100) * 70}`).join(' ')} L${(historique.length - 1) * 8},80 Z`}
                                    fill={getScoreColor(sante.score)}
                                />
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
                                haute: { bg: 'var(--color-danger-50)', border: 'var(--color-danger-200)', text: 'var(--color-danger-700)', dot: 'bg-[var(--color-danger-400)]', label: t('etablissements.detail.sante.prioriteHaute', 'Haute') },
                                moyenne: { bg: 'var(--color-warning-50)', border: 'var(--color-warning-200)', text: 'var(--color-warning-700)', dot: 'bg-[var(--color-warning-400)]', label: t('etablissements.detail.sante.prioriteMoyenne', 'Moyenne') },
                                basse: { bg: 'var(--color-success-50)', border: 'var(--color-success-200)', text: 'var(--color-success-700)', dot: 'bg-[var(--color-success-400)]', label: t('etablissements.detail.sante.prioriteBasse', 'Basse') },
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
