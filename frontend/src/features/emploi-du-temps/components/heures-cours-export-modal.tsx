/**
 * ==================================
 * eLISAschool - Modal Export Heures de Cours
 * ==================================
 * Choix format (CSV/HTML), filtres appliqués, aperçu.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Printer } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useExportHeuresCoursCSV, useExportHeuresCoursHTML } from '@/features/personnel/hooks/use-heure-cours';

interface HeuresCoursExportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filtres?: Record<string, string | undefined>;
}

type FormatExport = 'csv' | 'html';

export function HeuresCoursExportModal({ open, onOpenChange, filtres }: HeuresCoursExportModalProps) {
    const { t } = useTranslation('emplois');
    const [format, setFormat] = useState<FormatExport>('csv');
    const exportCSV = useExportHeuresCoursCSV();
    const exportHTML = useExportHeuresCoursHTML();

    const isPending = exportCSV.isPending || exportHTML.isPending;

    const handleExport = useCallback(() => {
        if (format === 'csv') {
            exportCSV.mutate(filtres);
        } else {
            exportHTML.mutate(filtres);
        }
        onOpenChange(false);
    }, [format, filtres, exportCSV, exportHTML, onOpenChange]);

    const formats: { id: FormatExport; label: string; icon: React.ReactNode; description: string }[] = [
        {
            id: 'csv',
            label: 'CSV',
            icon: <FileText className="h-[clamp(1.25rem,2vw,1.5rem)] w-[clamp(1.25rem,2vw,1.5rem)]" />,
            description: t('export.csvDescription'),
        },
        {
            id: 'html',
            label: 'HTML',
            icon: <Printer className="h-[clamp(1.25rem,2vw,1.5rem)] w-[clamp(1.25rem,2vw,1.5rem)]" />,
            description: t('export.htmlDescription'),
        },
    ];

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('export.titre')}
            description={t('export.description')}
            size="sm"
            footer={
                <div className="flex items-center justify-end gap-[var(--gap-sm)] w-full">
                    <ElisaButton variant="ghost" onClick={() => onOpenChange(false)}>
                        {t('fermer')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        icon={<Download className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        onClick={handleExport}
                        disabled={isPending}
                        loading={isPending}
                    >
                        {t('heuresCoursPage.actions.exportCSV')}
                    </ElisaButton>
                </div>
            }
        >
            <div className="flex flex-col gap-[var(--gap-sm)]">
                {formats.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => setFormat(f.id)}
                        className={`flex items-center gap-[var(--gap-sm)] rounded-lg border p-[var(--space-md)] text-left transition-colors hover:bg-[var(--color-surface-hover)] ${
                            format === f.id
                                ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/5'
                                : 'border-[var(--color-bordure)]'
                        }`}
                    >
                        <div className="text-[var(--color-text-secondary)]">{f.icon}</div>
                        <div>
                            <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.2vw, 1rem)' }}>
                                {f.label}
                            </p>
                            <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem)' }}>
                                {f.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </CustomModal>
    );
}
