/**
 * ==================================
 * eLISAschool - Dialog d'export organigramme
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Modal de configuration pour l'export PNG/PDF de l'organigramme.
 * Options : format, résolution, coloration, titre/date/légende, portée.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileImage, FileText } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { exporterOrganigramme, type ExportOptions } from '../utils/export';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    containerId: string;
    nomEtablissement: string;
}

type FormatExport = 'png' | 'pdf';
type Resolution = 1 | 2 | 3 | 4;
type ModeColoration = 'couleur' | 'monochrome' | 'noirBlanc';
type Portee = 'visible' | 'etendu';

const RESOLUTIONS: { value: Resolution; label: string }[] = [
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 3, label: '3x' },
    { value: 4, label: '4x' },
];

const COLORATIONS: { value: ModeColoration; labelKey: string }[] = [
    { value: 'couleur', labelKey: 'organigramme.export.couleur' },
    { value: 'monochrome', labelKey: 'organigramme.export.monochrome' },
    { value: 'noirBlanc', labelKey: 'organigramme.export.noirBlanc' },
];

export function ExportDialog({
    open,
    onOpenChange,
    containerId,
    nomEtablissement,
}: ExportDialogProps) {
    const { t } = useTranslation('organisation');
    const [format, setFormat] = useState<FormatExport>('png');
    const [resolution, setResolution] = useState<Resolution>(2);
    const [coloration, setColoration] = useState<ModeColoration>('couleur');
    const [inclureTitre, setInclureTitre] = useState(true);
    const [inclureDate, setInclureDate] = useState(true);
    const [inclureLegende, setInclureLegende] = useState(true);
    const [portee, setPortee] = useState<Portee>('visible');
    const [exporting, setExporting] = useState(false);

    const handleExport = useCallback(async () => {
        setExporting(true);
        try {
            const options: ExportOptions = {
                format,
                resolution,
                coloration,
                inclureTitre,
                inclureDate,
                inclureLegende,
                titre: nomEtablissement,
                portee,
            };
            await exporterOrganigramme(containerId, options);
            onOpenChange(false);
        } catch (error) {
            console.error('Erreur export:', error);
        } finally {
            setExporting(false);
        }
    }, [containerId, format, resolution, coloration, inclureTitre, inclureDate, inclureLegende, nomEtablissement, portee, onOpenChange]);

    const segmentBtn = (active: boolean) =>
        `rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            active
                ? 'bg-[var(--color-dominant-600)] text-white shadow-sm'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-dominant-50)] hover:text-[var(--color-dominant-600)]'
        }`;

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) onOpenChange(false); }}
            title={t('organigramme.export.titre', 'Exporter l\'organigramme')}
            description={t('organigramme.export.description', 'Configurez les options d\'export')}
            size="lg"
            footer={<>
                <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                    {t('common:boutons.annuler', 'Annuler')}
                </ElisaButton>
                <ElisaButton
                    variant="primary"
                    icon={exporting ? undefined : <Download className="h-4 w-4" />}
                    onClick={handleExport}
                >
                    {exporting
                        ? t('organigramme.export.enCours', 'Export en cours...')
                        : t('organigramme.export.exporter', 'Exporter')
                    }
                </ElisaButton>
            </>}
        >
            <div className="flex flex-col" style={{ gap: 'var(--gap-md, 0.75rem)' }}>
                {/* Format */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }}>
                    <legend
                        className="font-medium"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}
                    >
                        {t('organigramme.export.format', 'Format')}
                    </legend>
                    <div className="flex items-center rounded-lg border p-1" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                        <button
                            type="button"
                            className={segmentBtn(format === 'png')}
                            onClick={() => setFormat('png')}
                        >
                            <span className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                                <FileImage className="h-3.5 w-3.5" />
                                PNG
                            </span>
                        </button>
                        <button
                            type="button"
                            className={segmentBtn(format === 'pdf')}
                            onClick={() => setFormat('pdf')}
                        >
                            <span className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                                <FileText className="h-3.5 w-3.5" />
                                PDF
                            </span>
                        </button>
                    </div>
                </fieldset>

                {/* Résolution */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }}>
                    <legend
                        className="font-medium"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}
                    >
                        {t('organigramme.export.resolution', 'Résolution')}
                    </legend>
                    <div className="flex items-center rounded-lg border p-1" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                        {RESOLUTIONS.map(r => (
                            <button
                                key={r.value}
                                type="button"
                                className={segmentBtn(resolution === r.value)}
                                onClick={() => setResolution(r.value)}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </fieldset>

                {/* Coloration */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }}>
                    <legend
                        className="font-medium"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}
                    >
                        {t('organigramme.export.coloration', 'Coloration')}
                    </legend>
                    <div className="flex items-center rounded-lg border p-1 flex-wrap" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                        {COLORATIONS.map(c => (
                            <button
                                key={c.value}
                                type="button"
                                className={segmentBtn(coloration === c.value)}
                                onClick={() => setColoration(c.value)}
                            >
                                {t(c.labelKey, c.value === 'couleur' ? 'Couleur' : c.value === 'monochrome' ? 'Monochrome' : 'Noir & blanc')}
                            </button>
                        ))}
                    </div>
                </fieldset>

                {/* Portée */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }}>
                    <legend
                        className="font-medium"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}
                    >
                        {t('organigramme.export.portee', 'Portée')}
                    </legend>
                    <div className="flex items-center rounded-lg border p-1" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                        <button
                            type="button"
                            className={segmentBtn(portee === 'visible')}
                            onClick={() => setPortee('visible')}
                        >
                            {t('organigramme.export.porteeVisible', 'Vue actuelle')}
                        </button>
                        <button
                            type="button"
                            className={segmentBtn(portee === 'etendu')}
                            onClick={() => setPortee('etendu')}
                        >
                            {t('organigramme.export.porteeEtendu', 'Tout déplié')}
                        </button>
                    </div>
                </fieldset>

                {/* Options d'inclusion */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }}>
                    <legend
                        className="font-medium"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}
                    >
                        {t('organigramme.export.inclusions', 'Éléments inclus')}
                    </legend>
                    <div className="flex flex-col" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                        <label className="flex items-center cursor-pointer" style={{ gap: 'var(--gap-sm, 0.5rem)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                            <input
                                type="checkbox"
                                checked={inclureTitre}
                                onChange={(e) => setInclureTitre(e.target.checked)}
                                className="rounded border-[var(--color-bordure)]"
                            />
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                                {t('organigramme.export.avecTitre', 'Titre de l\'établissement')}
                            </span>
                        </label>
                        <label className="flex items-center cursor-pointer" style={{ gap: 'var(--gap-sm, 0.5rem)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                            <input
                                type="checkbox"
                                checked={inclureDate}
                                onChange={(e) => setInclureDate(e.target.checked)}
                                className="rounded border-[var(--color-bordure)]"
                            />
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                                {t('organigramme.export.avecDate', 'Date du jour')}
                            </span>
                        </label>
                        <label className="flex items-center cursor-pointer" style={{ gap: 'var(--gap-sm, 0.5rem)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                            <input
                                type="checkbox"
                                checked={inclureLegende}
                                onChange={(e) => setInclureLegende(e.target.checked)}
                                className="rounded border-[var(--color-bordure)]"
                            />
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                                {t('organigramme.export.avecLegende', 'Légende des liens')}
                            </span>
                        </label>
                    </div>
                </fieldset>
            </div>
        </CustomModal>
    );
}
