import { useState, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
    FileText, BookOpen, Calendar, Briefcase, Star, Ban, Route,
    AlertCircle, Loader2,
} from 'lucide-react';
import { useEnseignant, useEnseignantAffectationsMatiere, useEnseignantMoyenneEvaluations, useEnseignantHeures, useEnseignantAbsences } from '../hooks/use-enseignants';
import { useSupprimerPersonnel } from '@/features/personnel/hooks/use-personnel';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LoadingState } from '@/components/feedback';
import { HeroHeader } from './enseignant-detail/hero-header';
import { OngletInfos } from './enseignant-detail/onglet-infos';
import { OngletMatieres } from './enseignant-detail/onglet-matieres';
import { OngletEdt } from './enseignant-detail/onglet-edt';
import { OngletContrat } from './enseignant-detail/onglet-contrat';
import { OngletEvaluations } from './enseignant-detail/onglet-evaluations';
import { OngletAbsences } from './enseignant-detail/onglet-absences';
import { OngletParcours } from './enseignant-detail/onglet-parcours';

type OngletId = 'informations' | 'matieres-classes' | 'edt' | 'contrat-salaire' | 'evaluations' | 'absences' | 'parcours';

interface OngletConfig {
    id: OngletId;
    label: string;
    icon: any;
    lazy: boolean;
}

const ONGLETS: OngletConfig[] = [
    { id: 'informations', label: 'Informations', icon: FileText, lazy: false },
    { id: 'matieres-classes', label: 'Matières & Classes', icon: BookOpen, lazy: true },
    { id: 'edt', label: 'Emploi du temps', icon: Calendar, lazy: true },
    { id: 'contrat-salaire', label: 'Contrat & Salaire', icon: Briefcase, lazy: true },
    { id: 'evaluations', label: 'Évaluations', icon: Star, lazy: true },
    { id: 'absences', label: 'Absences', icon: Ban, lazy: true },
    { id: 'parcours', label: 'Parcours', icon: Route, lazy: true },
];

export function EnseignantDetailPage() {
    const { id } = useParams({ from: '/_auth/enseignants/$id' });
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletId>('informations');
    const supprimer = useSupprimerPersonnel();

    const { data: enseignantData, isLoading, isError } = useEnseignant(id);
    const enseignant = enseignantData;

    const affectations = useEnseignantAffectationsMatiere(id);
    const moyEval = useEnseignantMoyenneEvaluations(id);
    const heures = useEnseignantHeures(id);
    const absences = useEnseignantAbsences(id);

    const nbMatieres = affectations.data?.length;
    const moyenneEval = moyEval.data;
    const totalHeuresStats = heures.data;
    const totalHeures = totalHeuresStats?.totalHeures;
    const absencesData = absences.data;
    const nbAbsences = absencesData?.total ?? absencesData?.items?.length;

    const handleDelete = useCallback(() => {
        const nom = `${enseignant?.prenom ?? ''} ${enseignant?.nom ?? ''}`.trim() || 'cet enseignant';
        if (confirm(`Supprimer ${nom} ?`)) {
            supprimer.mutateAsync(id).then(() => navigate({ to: '/enseignants' }));
        }
    }, [enseignant, id, navigate, supprimer]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <LoadingState message="Chargement de l'enseignant..." />
            </div>
        );
    }

    if (isError || !enseignant) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <AlertCircle className="mb-4 h-16 w-16 text-gray-400" />
                <p className="text-lg text-gray-600">Enseignant non trouvé</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/enseignants' })} className="mt-4">
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <HeroHeader
                enseignant={enseignant}
                nbMatieres={nbMatieres}
                moyenneEval={moyenneEval ?? undefined}
                totalHeures={totalHeures}
                nbAbsences={nbAbsences}
                isDeleting={supprimer.isPending}
                onDelete={handleDelete}
                onBack={() => navigate({ to: '/enseignants' })}
            />

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide">
                    {ONGLETS.map((o) => {
                        const Icon = o.icon;
                        const isActive = ongletActif === o.id;
                        return (
                            <button key={o.id} onClick={() => setOngletActif(o.id)}
                                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {o.label}
                                {o.lazy && (
                                    <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={ongletActif}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                >
                    {ongletActif === 'informations' && <OngletInfos enseignant={enseignant} />}
                    {ongletActif === 'matieres-classes' && <OngletMatieres enseignantId={id} isActive />}
                    {ongletActif === 'edt' && <OngletEdt enseignantId={id} isActive />}
                    {ongletActif === 'contrat-salaire' && <OngletContrat enseignantId={id} isActive />}
                    {ongletActif === 'evaluations' && <OngletEvaluations enseignantId={id} isActive />}
                    {ongletActif === 'absences' && <OngletAbsences enseignantId={id} isActive />}
                    {ongletActif === 'parcours' && <OngletParcours enseignantId={id} isActive />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
