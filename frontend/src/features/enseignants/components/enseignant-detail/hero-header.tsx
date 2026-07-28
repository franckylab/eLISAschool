import { motion } from 'framer-motion';
import {
    ArrowLeft, Edit, Trash2, BookOpen, Star, Clock, Ban,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import type { Enseignant } from '../../types/enseignant.types';

type TFn = (key: string, opts?: Record<string, unknown>) => string;

function getStatutColor(statut: string): string {
    switch (statut) {
        case 'ACTIF': case 'actif':
            return 'bg-success/10 text-success border-success/20';
        case 'INACTIF': case 'inactif':
            return 'bg-muted text-muted-foreground border-border';
        case 'CONGE': case 'en_conge':
            return 'bg-primary/10 text-primary border-primary/20';
        case 'demission':
            return 'bg-destructive/10 text-destructive border-destructive/20';
        default:
            return 'bg-muted text-muted-foreground border-border';
    }
}

function getStatutLabel(statut: string, t: TFn): string {
    const key = `statut_${statut}`;
    const translated = t(key);
    return translated !== key ? translated : statut;
}

interface HeroHeaderProps {
    enseignant: Enseignant;
    nbMatieres?: number;
    moyenneEval?: { moyenne: number; total: number };
    totalHeures?: number;
    nbAbsences?: number;
    isDeleting: boolean;
    onDelete: () => void;
    onEdit?: () => void;
    onBack: () => void;
}

function formatAnciennete(anciennete: number, t: TFn) {
    if (anciennete <= 0) return t('detail.nouveau');
    const annees = Math.floor(anciennete);
    const mois = Math.round((anciennete - annees) * 12);
    if (annees === 0) return `${mois} ${t('detail.mois')}`;
    const anLabel = t('detail.an', { count: annees });
    const moisPart = mois > 0 ? ` ${mois} ${t('detail.mois')}` : '';
    return `${annees} ${anLabel}${moisPart}`;
}

function nomPrenom(e: Enseignant): string {
    return e.utilisateur?.profil?.prenom ?? '';
}

function nomFamille(e: Enseignant): string {
    return e.utilisateur?.profil?.nom ?? '';
}

export function HeroHeader({
    enseignant, nbMatieres, moyenneEval, totalHeures, nbAbsences,
    isDeleting, onDelete, onEdit, onBack,
}: HeroHeaderProps) {
    const { t } = useTranslation('personnel');
    const prenom = nomPrenom(enseignant);
    const nom = nomFamille(enseignant);
    const nomComplet = `${prenom} ${nom}`.trim() || t('detail.enseignant');
    const initials = `${prenom.charAt(0)}${nom.charAt(0)}`;
    const dateEmbauche = enseignant.dateEmbauche;
    const anciennete = dateEmbauche
        ? (Date.now() - new Date(dateEmbauche).getTime()) / (1000 * 60 * 60 * 24 * 365)
        : 0;
    const statsLoaded = nbMatieres !== undefined || totalHeures !== undefined || nbAbsences !== undefined;

    return (
        <div className="flex flex-col gap-6">
            <Breadcrumbs currentLabel={nomComplet} />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-5">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white shadow-lg">
                            {initials || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold text-foreground">{nomComplet}</h1>
                                <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${getStatutColor(enseignant.statut)}`}>
                                    {getStatutLabel(enseignant.statut, t)}
                                </span>
                            </div>
                            <p className="mt-1 text-secondary">
                                {enseignant.posteExact ?? t('detail.enseignantDefault')}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {t('detail.ancienneteLabel')}: {formatAnciennete(anciennete, t)}
                                </span>
                                {enseignant.departement && (
                                    <span className="inline-flex items-center gap-1.5">
                                        {enseignant.departement}
                                    </span>
                                )}
                                {enseignant.service && (
                                    <span className="inline-flex items-center gap-1.5">{enseignant.service}</span>
                                )}
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                                    {t('detail.enseignant')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2">
                        <ElisaButton variant="outline" size="sm" icon={<Edit className="h-4 w-4" />} onClick={onEdit}>
                            {t('detail.modifier')}
                        </ElisaButton>
                        <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />}
                            isLoading={isDeleting} onClick={onDelete}>
                            {t('detail.supprimer')}
                        </ElisaButton>
                        <ElisaButton variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>
                            {t('detail.retour')}
                        </ElisaButton>
                    </div>
                </div>
            </motion.div>

            <CardGrid columns={{ default: 2, md: 4 }}>
                <StatCard icon={BookOpen} label={t('detail.matieresCount')}
                    value={nbMatieres ?? '—'} color="blue" loading={!statsLoaded} />
                <StatCard icon={Star} label={t('detail.moyenneEval')}
                    value={moyenneEval?.moyenne != null ? `${moyenneEval.moyenne.toFixed(1)}/20` : '—'}
                    color="purple" loading={!statsLoaded} />
                <StatCard icon={Clock} label={t('detail.heures')}
                    value={totalHeures != null ? `${totalHeures}h` : '—'}
                    color="green" loading={!statsLoaded} />
                <StatCard icon={Ban} label={t('detail.absencesCount')}
                    value={nbAbsences ?? '—'} color="orange" loading={!statsLoaded} />
            </CardGrid>
        </div>
    );
}
