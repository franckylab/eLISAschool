/**
 * ==================================
 * eLISAschool - Page Liste des Emplois du Temps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, FileDown, Plus, RefreshCw, Clock } from 'lucide-react';
import { useCreneaux } from '../hooks/use-emploi-du-temps';
import { EDTCalendar } from '../components/edt-calendar';
import { EDTGenerationModal } from '../components/edt-generation-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals/CustomModal';
import { ListLoading } from '@/components/feedback/ListLoading';
import { EmptyState } from '@/components/feedback/EmptyState';

interface EmploiDuTempsListeProps {
    classeAnneeId: string;
    anneeScolaireId: string;
    classeNom?: string;
}

export function EmploiDuTempsListe({ classeAnneeId, anneeScolaireId, classeNom }: EmploiDuTempsListeProps) {
    const [generationModalOpen, setGenerationModalOpen] = useState(false);
    
    const { data: paginated, isLoading, refetch } = useCreneaux({ classeAnneeId, anneeScolaireId });
    const creneaux = paginated?.items;

    const handleExportHTML = () => {
        window.open(
            `/api/emploi-du-temps/export/html/${classeAnneeId}?anneeScolaireId=${anneeScolaireId}`,
            '_blank'
        );
    };

    const handleExportPDF = () => {
        window.open(
            `/api/emploi-du-temps/export/pdf/${classeAnneeId}?anneeScolaireId=${anneeScolaireId}`,
            '_blank'
        );
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* En-tête */}
            <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-[var(--color-dominant-600)]" />
                        Emploi du Temps
                    </h1>
                    {classeNom && (
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                            Classe : <strong>{classeNom}</strong>
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<RefreshCw className="h-4 w-4" />}
                        onClick={() => refetch()}
                    >
                        Actualiser
                    </ElisaButton>

                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<FileDown className="h-4 w-4" />}
                        onClick={handleExportHTML}
                    >
                        Export HTML
                    </ElisaButton>

                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<FileDown className="h-4 w-4" />}
                        onClick={handleExportPDF}
                    >
                        Export PDF
                    </ElisaButton>

                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => setGenerationModalOpen(true)}
                    >
                        Générer / Modifier
                    </ElisaButton>
                </div>
            </motion.div>

            {/* Contenu */}
            {isLoading ? (
                <ListLoading />
            ) : !creneaux || creneaux.length === 0 ? (
                <EmptyState
                    icon={Clock}
                    title="Aucun emploi du temps"
                    description="Cet emploi du temps est vide. Générez-le automatiquement ou ajoutez des créneaux manuellement."
                    actionLabel="Générer l'emploi du temps"
                    onAction={() => setGenerationModalOpen(true)}
                />
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <EDTCalendar creneaux={creneaux} />
                </motion.div>
            )}

            {/* Modal de génération */}
            <CustomModal
                open={generationModalOpen}
                onOpenChange={setGenerationModalOpen}
                title="Générer l'emploi du temps"
                description="Configurez les paramètres de génération automatique"
                size="2xl"
            >
                <EDTGenerationModal
                    classeAnneeId={classeAnneeId}
                    onSuccess={() => {
                        setGenerationModalOpen(false);
                        refetch();
                    }}
                    onClose={() => setGenerationModalOpen(false)}
                />
            </CustomModal>
        </div>
    );
}
