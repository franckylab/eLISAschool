import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
    FileText, BookOpen, Calendar, Briefcase, Star, Ban, Route,
    AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useEnseignant, useEnseignantAffectationsMatiere, useEnseignantMoyenneEvaluations, useEnseignantHeures, useEnseignantAbsences } from '../hooks/use-enseignants';
import { useSupprimerPersonnel } from '@/features/personnel/hooks/use-personnel';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { LoadingState } from '@/components/feedback';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { EnseignantFormModal } from './enseignant-form-modal';
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
}

const ONGLETS: OngletConfig[] = [
    { id: 'informations', label: 'Informations', icon: FileText },
    { id: 'matieres-classes', label: 'Matières & Classes', icon: BookOpen },
    { id: 'edt', label: 'Emploi du temps', icon: Calendar },
    { id: 'contrat-salaire', label: 'Contrat & Salaire', icon: Briefcase },
    { id: 'evaluations', label: 'Évaluations', icon: Star },
    { id: 'absences', label: 'Absences', icon: Ban },
    { id: 'parcours', label: 'Parcours', icon: Route },
];

export function EnseignantDetailPage() {
    const { id } = useParams({ from: '/_auth/enseignants/$id' });
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletId>('informations');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const queryClient = useQueryClient();
    const supprimer = useSupprimerPersonnel();
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const { data: enseignant, isLoading, isError } = useEnseignant(id);

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

    const handleDelete = useCallback(async () => {
        try {
            await supprimer.mutateAsync(id);
            navigate({ to: '/enseignants' });
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    }, [id, navigate, supprimer]);

    const handleTabChange = useCallback((tabId: OngletId) => {
        setOngletActif(tabId);
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const idx = ONGLETS.findIndex((o) => o.id === ongletActif);
                const next = e.key === 'ArrowRight' ? Math.min(idx + 1, ONGLETS.length - 1) : Math.max(idx - 1, 0);
                if (next !== idx) {
                    e.preventDefault();
                    handleTabChange(ONGLETS[next].id);
                    tabRefs.current[ONGLETS[next].id]?.focus();
                }
            }
        };
        const tabChangeHandler = (e: CustomEvent) => {
            if (e.detail?.tab) {
                handleTabChange(e.detail.tab as OngletId);
            }
        };
        window.addEventListener('keydown', handler);
        window.addEventListener('enseignant-tab-change', tabChangeHandler as EventListener);
        return () => {
            window.removeEventListener('keydown', handler);
            window.removeEventListener('enseignant-tab-change', tabChangeHandler as EventListener);
        };
    }, [ongletActif, handleTabChange]);

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

    const renderOnglet = () => {
        const Component = (() => {
            switch (ongletActif) {
                case 'informations': return () => <OngletInfos enseignant={enseignant} />;
                case 'matieres-classes': return () => <OngletMatieres enseignantId={id} isActive />;
                case 'edt': return () => <OngletEdt enseignantId={id} isActive />;
                case 'contrat-salaire': return () => <OngletContrat enseignantId={id} isActive />;
                case 'evaluations': return () => <OngletEvaluations enseignantId={id} isActive />;
                case 'absences': return () => <OngletAbsences enseignantId={id} isActive />;
                case 'parcours': return () => <OngletParcours enseignantId={id} isActive />;
                default: return () => null;
            }
        })();

        return (
            <ErrorBoundary key={ongletActif}>
                <Component />
            </ErrorBoundary>
        );
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <HeroHeader
                enseignant={enseignant}
                nbMatieres={nbMatieres}
                moyenneEval={moyenneEval ?? undefined}
                totalHeures={totalHeures}
                nbAbsences={nbAbsences}
                isDeleting={supprimer.isPending}
                onDelete={() => setShowDeleteConfirm(true)}
                onEdit={() => setShowEditModal(true)}
                onBack={() => navigate({ to: '/enseignants' })}
            />

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Onglets enseignant">
                    {ONGLETS.map((o, idx) => {
                        const Icon = o.icon;
                        const isActive = ongletActif === o.id;
                        return (
                            <button
                                key={o.id}
                                ref={(el) => { tabRefs.current[o.id] = el; }}
                                onClick={() => handleTabChange(o.id)}
                                role="tab"
                                aria-selected={isActive}
                                tabIndex={isActive ? 0 : -1}
                                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{o.label}</span>
                                <span className="sm:hidden">{o.label.split('&')[0].trim()}</span>
                                {idx > 0 && idx < ONGLETS.length - 1 && (
                                    <span className="hidden md:inline text-xs text-gray-400">
                                        <kbd className="ml-1 px-1 py-0.5 bg-gray-100 rounded text-[10px]">
                                            {idx + 1}
                                        </kbd>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="flex items-center justify-between sm:hidden">
                <button onClick={() => {
                    const idx = ONGLETS.findIndex((o) => o.id === ongletActif);
                    if (idx > 0) handleTabChange(ONGLETS[idx - 1].id);
                }} className="p-2 text-gray-500 hover:text-gray-700">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-gray-600">
                    {ONGLETS.find((o) => o.id === ongletActif)?.label}
                </span>
                <button onClick={() => {
                    const idx = ONGLETS.findIndex((o) => o.id === ongletActif);
                    if (idx < ONGLETS.length - 1) handleTabChange(ONGLETS[idx + 1].id);
                }} className="p-2 text-gray-500 hover:text-gray-700">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={ongletActif}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderOnglet()}
                </motion.div>
            </AnimatePresence>

            {showEditModal && (
                <EnseignantFormModal
                    mode="edition"
                    enseignant={enseignant}
                    onSuccess={() => {
                        setShowEditModal(false);
                        queryClient.invalidateQueries({ queryKey: ['enseignants', 'detail', id] });
                    }}
                    onCancel={() => setShowEditModal(false)}
                />
            )}

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={(v) => { if (!v) setShowDeleteConfirm(false); }}
                onConfirm={handleDelete}
                title="Supprimer l'enseignant"
                description={`Êtes-vous sûr de vouloir supprimer ${enseignant.prenom ?? ''} ${enseignant.nom ?? ''} ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
