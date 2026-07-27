import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, FileDown, Plus, RefreshCw, Clock } from 'lucide-react';
import { useCreneaux } from '../hooks/use-emploi-du-temps';
import { EDTCalendar } from '../components/edt-calendar';
import { EDTGenerationModal } from '../components/edt-generation-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals/CustomModal';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface EmploiDuTempsListeProps {
    classeAnneeId: string;
    anneeScolaireId: string;
    classeNom?: string;
}

export function EmploiDuTempsListe({ classeAnneeId, anneeScolaireId }: EmploiDuTempsListeProps) {
    const { t } = useTranslation('emplois');
    const [generationModalOpen, setGenerationModalOpen] = useState(false);

    const { data: paginated, isLoading, error, refetch } = useCreneaux({ classeAnneeId, anneeScolaireId });
    const creneaux = paginated?.data?.items;

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

    if (error) {
        return <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <ElisaButton variant="ghost" size="xs" icon={<RefreshCw className="h-4 w-4" />} onClick={() => refetch()}>
                        {t('liste.actualiser')}
                    </ElisaButton>
                    <ElisaButton variant="ghost" size="xs" icon={<FileDown className="h-4 w-4" />} onClick={handleExportHTML}>
                        {t('liste.exportHtml')}
                    </ElisaButton>
                    <ElisaButton variant="ghost" size="xs" icon={<FileDown className="h-4 w-4" />} onClick={handleExportPDF}>
                        {t('liste.exportPdf')}
                    </ElisaButton>
                </div>
                <ElisaButton variant="primary" size="xs" icon={<Plus className="h-4 w-4" />} onClick={() => setGenerationModalOpen(true)}>
                    {t('liste.genererModifier')}
                </ElisaButton>
            </div>

            {isLoading ? (
                <PageSkeleton showHeader={false} showStats={false} showTable />
            ) : !creneaux || creneaux.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Clock className="h-16 w-16 text-[var(--color-text-muted)] mb-4" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{t('liste.vide.titre')}</h3>
                    <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">{t('liste.vide.description')}</p>
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setGenerationModalOpen(true)}>
                        {t('liste.vide.action')}
                    </ElisaButton>
                </div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <EDTCalendar creneaux={creneaux} />
                </motion.div>
            )}

            <CustomModal
                open={generationModalOpen}
                onOpenChange={setGenerationModalOpen}
                title={t('generation.titre')}
                description={t('descriptionGeneration')}
                size="2xl"
            >
                <EDTGenerationModal
                    classeAnneeId={classeAnneeId}
                    onSuccess={() => { setGenerationModalOpen(false); refetch(); }}
                    onClose={() => setGenerationModalOpen(false)}
                />
            </CustomModal>
        </div>
    );
}