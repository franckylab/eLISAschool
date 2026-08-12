/**
 * ==================================
 * eLISAschool - Composant Santé Établissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant réutilisable affichant la santé d'un établissement (score composite 0-100).
 * 4 variants : badge, score, barre, detail.
 * Ultra-responsif (100px → 2560px), dark mode, CSS variables.
 *
 * Refonte Santé Établissements v1.0
 */

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Activity,
    CreditCard,
    Package,
    Users,
    type LucideIcon,
} from 'lucide-react';

// =============================================
// Types
// =============================================

export type CategorieSante = 'sain' | 'attention' | 'critique';
export type PrioriteRecommandation = 'haute' | 'moyenne' | 'basse';

export interface RecommandationSante {
    critere: 'abonnement' | 'paiements' | 'activite' | 'modules';
    priorite: PrioriteRecommandation;
    titre: string;
    description: string;
    action: string;
}

export interface SanteDetailCritere {
    score: number;
    poids: number;
}

export interface SanteDetails {
    abonnement: SanteDetailCritere & { statut: string };
    paiements: SanteDetailCritere & { payees: number; total: number; tauxRecouvrement: number };
    activite: SanteDetailCritere & { elevesActifs: number; effectifMax: number; connexions30j: number; totalUtilisateurs: number };
    modules: SanteDetailCritere & { actifs: number; disponibles: number };
}

/** Résultat de score de santé par établissement (réponse API) */
export interface SanteEtablissementResult {
    etablissementId: string;
    nomEtablissement: string;
    score: number;
    categorie: CategorieSante;
    details: SanteDetails;
    recommandations?: RecommandationSante[];
}

export interface SanteEtablissementProps {
    variant: 'badge' | 'score' | 'barre' | 'detail';
    score?: number;
    categorie?: CategorieSante;
    details?: SanteDetails;
    nomEtablissement?: string;
    className?: string;
    loading?: boolean;
    /** Données agrégées pour le variant barre */
    resume?: {
        sains: number;
        attention: number;
        critiques: number;
        scoreMoyen: number;
        total: number;
    };
}

// =============================================
// Helpers
// =============================================

function getCouleurCategorie(categorie: CategorieSante): string {
    switch (categorie) {
        case 'sain': return 'var(--color-success-500)';
        case 'attention': return 'var(--color-warning-500)';
        case 'critique': return 'var(--color-danger-500)';
    }
}

function getCouleurBg(categorie: CategorieSante): string {
    switch (categorie) {
        case 'sain': return 'var(--color-success-100)';
        case 'attention': return 'var(--color-warning-100)';
        case 'critique': return 'var(--color-danger-100)';
    }
}

function getCouleurTexte(categorie: CategorieSante): string {
    switch (categorie) {
        case 'sain': return 'var(--color-success-700)';
        case 'attention': return 'var(--color-warning-700)';
        case 'critique': return 'var(--color-danger-700)';
    }
}

function determinerCategorie(score: number): CategorieSante {
    if (score >= 75) return 'sain';
    if (score >= 40) return 'attention';
    return 'critique';
}

function getScoreColor(score: number): string {
    if (score >= 75) return 'var(--color-success-500)';
    if (score >= 40) return 'var(--color-warning-500)';
    return 'var(--color-danger-500)';
}

// =============================================
// Variant : Badge
// =============================================

function SanteBadge({ categorie, score, className = '', loading }: SanteEtablissementProps) {
    const { t } = useTranslation('admin');

    if (loading) {
        return (
            <div className={`inline-flex items-center gap-[var(--gap-xxs)] ${className}`}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-bordure)' }} />
                <span className="w-12 h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bordure)' }} />
            </div>
        );
    }

    const cat = categorie || (score !== undefined ? determinerCategorie(score) : 'critique');
    const label = t(`sante.${cat}`, cat.charAt(0).toUpperCase() + cat.slice(1));

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-[var(--gap-xxs)] rounded-full px-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] py-[clamp(0.125rem,0.1rem+0.1vw,0.25rem)] ${className}`}
            style={{
                backgroundColor: getCouleurBg(cat),
                color: getCouleurTexte(cat),
                fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)',
                fontWeight: 500,
            }}
        >
            <span
                className="w-[clamp(0.375rem,0.3rem+0.15vw,0.5rem)] h-[clamp(0.375rem,0.3rem+0.15vw,0.5rem)] rounded-full"
                style={{ backgroundColor: getCouleurCategorie(cat) }}
            />
            {label}
            {score !== undefined && (
                <span style={{ fontWeight: 700 }}>{score}</span>
            )}
        </motion.span>
    );
}

// =============================================
// Variant : Score (pour MiniStat)
// =============================================

function SanteScore({ score, resume, className = '', loading }: SanteEtablissementProps) {
    const { t } = useTranslation('admin');
    const displayScore = score ?? resume?.scoreMoyen ?? 0;
    const cat = determinerCategorie(displayScore);
    const couleur = getScoreColor(displayScore);

    if (loading) {
        return (
            <div className={`rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-sm)] space-y-[var(--space-xs)] ${className}`}>
                <div className="flex items-center gap-[var(--gap-xs)]">
                    <span className="w-4 h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bordure)' }} />
                    <span className="w-16 h-3 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bordure)' }} />
                </div>
                <span className="w-12 h-6 rounded animate-pulse block" style={{ backgroundColor: 'var(--color-bordure)' }} />
            </div>
        );
    }

    return (
        <div className={`rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-sm)] space-y-[var(--space-xs)] ${className}`}>
            <div className="flex items-center gap-[var(--gap-xs)]">
                <Activity className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color: couleur }} />
                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                    {t('sante.scoreMoyen', 'Score moyen')}
                </span>
            </div>
            <div className="flex items-end gap-[var(--gap-xs)]">
                <motion.span
                    key={displayScore}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-bold"
                    style={{
                        fontSize: 'clamp(1rem, 0.85rem + 0.5vw, 1.25rem)',
                        color: couleur,
                    }}
                >
                    {displayScore}
                </motion.span>
                <span className="text-xs pb-0.5" style={{ color: 'var(--color-texte-muted)' }}>/100</span>
            </div>
            {/* Barre de progression */}
            <div className="w-full h-[clamp(0.25rem,0.2rem+0.1vw,0.375rem)] rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${displayScore}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: couleur }}
                />
            </div>
        </div>
    );
}

// =============================================
// Variant : Barre (section résumé)
// =============================================

function SanteBarre({ resume, className = '', loading }: SanteEtablissementProps) {
    const { t } = useTranslation('admin');

    if (loading || !resume) {
        return (
            <div className={`rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)] ${className}`}>
                <div className="w-full h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bordure)' }} />
            </div>
        );
    }

    const { sains, attention, critiques, total, scoreMoyen } = resume;
    const totalSafe = Math.max(total, 1);
    const pctSains = (sains / totalSafe) * 100;
    const pctAttention = (attention / totalSafe) * 100;
    const pctCritiques = (critiques / totalSafe) * 100;

    return (
        <div className={`rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)] space-y-[var(--space-sm)] ${className}`}>
            <div className="flex items-center justify-between">
                <span className="font-medium" style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte)' }}>
                    {t('sante.titre', 'Santé du parc')}
                </span>
                <span className="font-bold" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)', color: getScoreColor(scoreMoyen) }}>
                    {scoreMoyen}/100
                </span>
            </div>

            {/* Barre empilée */}
            <div className="w-full h-[clamp(0.5rem,0.4rem+0.2vw,0.75rem)] rounded-full overflow-hidden flex" style={{ backgroundColor: 'var(--color-bordure)' }}>
                {pctSains > 0 && (
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pctSains}%` }}
                        transition={{ duration: 0.5 }}
                        style={{ backgroundColor: 'var(--color-success-500)' }}
                    />
                )}
                {pctAttention > 0 && (
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pctAttention}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        style={{ backgroundColor: 'var(--color-warning-500)' }}
                    />
                )}
                {pctCritiques > 0 && (
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pctCritiques}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        style={{ backgroundColor: 'var(--color-danger-500)' }}
                    />
                )}
            </div>

            {/* Légende */}
            <div className="flex flex-wrap items-center gap-[var(--gap-md)]" style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)' }}>
                <span className="flex items-center gap-[var(--gap-xxs)]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success-500)' }} />
                    <span style={{ color: 'var(--color-texte-muted)' }}>{sains}</span>
                    <span style={{ color: 'var(--color-texte-muted)' }}>{t('sante.sains', 'sains')}</span>
                </span>
                <span className="flex items-center gap-[var(--gap-xxs)]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-warning-500)' }} />
                    <span style={{ color: 'var(--color-texte-muted)' }}>{attention}</span>
                    <span style={{ color: 'var(--color-texte-muted)' }}>{t('sante.attention', 'attention')}</span>
                </span>
                <span className="flex items-center gap-[var(--gap-xxs)]">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-danger-500)' }} />
                    <span style={{ color: 'var(--color-texte-muted)' }}>{critiques}</span>
                    <span style={{ color: 'var(--color-texte-muted)' }}>{t('sante.critiques', 'critiques')}</span>
                </span>
            </div>
        </div>
    );
}

// =============================================
// Variant : Detail (tooltip/popover)
// =============================================

function CritereRow({ icon: Icon, label, score, poids, subtitle }: {
    icon: LucideIcon;
    label: string;
    score: number;
    poids: number;
    subtitle: string;
}) {
    return (
        <div className="space-y-[var(--space-xxs)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--gap-xxs)]">
                    <Icon className="h-[var(--icon-xxs)] w-[var(--icon-xxs)]" style={{ color: 'var(--color-texte-muted)' }} />
                    <span style={{ fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)', color: 'var(--color-texte)' }}>
                        {label}
                    </span>
                    <span style={{ fontSize: 'clamp(0.5625rem, 0.52rem + 0.15vw, 0.6875rem)', color: 'var(--color-texte-muted)' }}>
                        ({Math.round(poids * 100)}%)
                    </span>
                </div>
                <span className="font-mono font-semibold" style={{
                    fontSize: 'clamp(0.6875rem, 0.63rem + 0.2vw, 0.8125rem)',
                    color: getScoreColor(score),
                }}>
                    {score}
                </span>
            </div>
            {/* Mini barre */}
            <div className="flex items-center gap-[var(--gap-xxs)]">
                <div className="flex-1 h-[clamp(0.1875rem,0.15rem+0.1vw,0.25rem)] rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: `${score}%`,
                            backgroundColor: getScoreColor(score),
                            transition: 'width 0.3s ease',
                        }}
                    />
                </div>
                <span style={{ fontSize: 'clamp(0.5625rem, 0.52rem + 0.15vw, 0.6875rem)', color: 'var(--color-texte-muted)' }}>
                    {subtitle}
                </span>
            </div>
        </div>
    );
}

function SanteDetail({ score, details, categorie, className = '', loading }: SanteEtablissementProps) {
    const { t } = useTranslation('admin');

    if (loading || !details) {
        return (
            <div className={`space-y-[var(--space-sm)] p-[var(--space-md)] ${className}`}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-full h-6 rounded animate-pulse" style={{ backgroundColor: 'var(--color-bordure)' }} />
                ))}
            </div>
        );
    }

    const cat = categorie || (score !== undefined ? determinerCategorie(score) : 'critique');
    const displayScore = score ?? 0;

    return (
        <div className={`space-y-[var(--space-sm)] ${className}`}>
            {/* Score global */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--gap-xs)]">
                    <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCouleurCategorie(cat) }}
                    />
                    <span className="font-semibold" style={{
                        fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)',
                        color: 'var(--color-texte)',
                    }}>
                        {t(`sante.${cat}`, cat.charAt(0).toUpperCase() + cat.slice(1))}
                    </span>
                </div>
                <span className="font-bold font-mono" style={{
                    fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)',
                    color: getScoreColor(displayScore),
                }}>
                    {displayScore}/100
                </span>
            </div>

            {/* 4 critères */}
            <div className="space-y-[var(--space-xs)]">
                <CritereRow
                    icon={CreditCard}
                    label={t('sante.detail.abonnement', 'Abonnement')}
                    score={details.abonnement.score}
                    poids={details.abonnement.poids}
                    subtitle={details.abonnement.statut}
                />
                <CritereRow
                    icon={CreditCard}
                    label={t('sante.detail.paiements', 'Paiements')}
                    score={details.paiements.score}
                    poids={details.paiements.poids}
                    subtitle={`${details.paiements.tauxRecouvrement}%`}
                />
                <CritereRow
                    icon={Users}
                    label={t('sante.detail.activite', 'Activité')}
                    score={details.activite.score}
                    poids={details.activite.poids}
                    subtitle={`${details.activite.elevesActifs} élèves`}
                />
                <CritereRow
                    icon={Package}
                    label={t('sante.detail.modules', 'Modules')}
                    score={details.modules.score}
                    poids={details.modules.poids}
                    subtitle={`${details.modules.actifs}/${details.modules.disponibles}`}
                />
            </div>
        </div>
    );
}

// =============================================
// Composant principal (switch variant)
// =============================================

export function SanteEtablissement(props: SanteEtablissementProps) {
    switch (props.variant) {
        case 'badge':
            return <SanteBadge {...props} />;
        case 'score':
            return <SanteScore {...props} />;
        case 'barre':
            return <SanteBarre {...props} />;
        case 'detail':
            return <SanteDetail {...props} />;
        default:
            return <SanteBadge {...props} />;
    }
}

export default SanteEtablissement;
