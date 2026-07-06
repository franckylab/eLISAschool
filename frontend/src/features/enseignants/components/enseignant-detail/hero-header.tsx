import { motion } from 'framer-motion';
import {
    ArrowLeft, Edit, Trash2, BookOpen, Star, Clock, Ban,
} from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { StatCard } from '@/components/ui/StatCard';
import type { Enseignant } from '../../types/enseignant.types';

const LABELS_STATUT: Record<string, string> = {
    ACTIF: 'Actif', INACTIF: 'Inactif', CONGE: 'En congé',
    actif: 'Actif', inactif: 'Inactif', en_conge: 'En congé', demission: 'Démission',
};
const COULEURS_STATUT: Record<string, string> = {
    ACTIF: 'bg-green-100 text-green-800 border-green-200',
    INACTIF: 'bg-gray-100 text-gray-800 border-gray-200',
    CONGE: 'bg-blue-100 text-blue-800 border-blue-200',
    actif: 'bg-green-100 text-green-800 border-green-200',
    inactif: 'bg-gray-100 text-gray-800 border-gray-200',
    en_conge: 'bg-blue-100 text-blue-800 border-blue-200',
    demission: 'bg-red-100 text-red-800 border-red-200',
};

interface HeroHeaderProps {
    enseignant: Enseignant;
    nbMatieres?: number;
    moyenneEval?: { moyenne: number; total: number };
    totalHeures?: number;
    nbAbsences?: number;
    isDeleting: boolean;
    onDelete: () => void;
    onBack: () => void;
}

function formatAnciennete(anciennete: number) {
    if (anciennete <= 0) return 'Nouveau';
    const annees = Math.floor(anciennete);
    const mois = Math.round((anciennete - annees) * 12);
    if (annees === 0) return `${mois} mois`;
    return `${annees} an${annees > 1 ? 's' : ''}${mois > 0 ? ` ${mois} mois` : ''}`;
}

function nomPrenom(e: Enseignant): string {
    return e.utilisateur?.profil?.prenom ?? e.prenom ?? '';
}

function nomFamille(e: Enseignant): string {
    return e.utilisateur?.profil?.nom ?? e.nom ?? '';
}

export function HeroHeader({
    enseignant, nbMatieres, moyenneEval, totalHeures, nbAbsences,
    isDeleting, onDelete, onBack,
}: HeroHeaderProps) {
    const prenom = nomPrenom(enseignant);
    const nom = nomFamille(enseignant);
    const nomComplet = `${prenom} ${nom}`.trim() || 'Enseignant';
    const initials = `${prenom.charAt(0)}${nom.charAt(0)}`;
    const dateEmbauche = enseignant.dateEmbauche ?? enseignant.dateEntree;
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
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-5">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white shadow-lg">
                            {initials || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">{nomComplet}</h1>
                                <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${COULEURS_STATUT[enseignant.statut]}`}>
                                    {LABELS_STATUT[enseignant.statut] || enseignant.statut}
                                </span>
                            </div>
                            <p className="mt-1 text-gray-600">
                                {enseignant.specialite ?? enseignant.posteExact ?? enseignant.poste ?? 'Enseignant'}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    Ancienneté: {formatAnciennete(anciennete)}
                                </span>
                                {enseignant.departement && (
                                    <span className="inline-flex items-center gap-1.5">
                                        {enseignant.departement}
                                    </span>
                                )}
                                {enseignant.service && (
                                    <span className="inline-flex items-center gap-1.5">{enseignant.service}</span>
                                )}
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                    Enseignant
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2">
                        <ElisaButton variant="outline" size="sm" icon={<Edit className="h-4 w-4" />}>
                            Modifier
                        </ElisaButton>
                        <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />}
                            isLoading={isDeleting} onClick={onDelete}>
                            Supprimer
                        </ElisaButton>
                        <ElisaButton variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>
                            Retour
                        </ElisaButton>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard icon={BookOpen} label="Matières"
                    value={nbMatieres ?? '—'} color="blue" loading={!statsLoaded} />
                <StatCard icon={Star} label="Moyenne éval."
                    value={moyenneEval?.moyenne != null ? `${moyenneEval.moyenne.toFixed(1)}/5` : '—'}
                    color="purple" loading={!statsLoaded} />
                <StatCard icon={Clock} label="Heures"
                    value={totalHeures != null ? `${totalHeures}h` : '—'}
                    color="green" loading={!statsLoaded} />
                <StatCard icon={Ban} label="Absences"
                    value={nbAbsences ?? '—'} color="orange" loading={!statsLoaded} />
            </div>
        </div>
    );
}
