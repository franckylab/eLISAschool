/**
 * ==================================
 * eLISAschool - Dialog d'export organigramme
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Modal de configuration pour l'export PNG/PDF de l'organigramme.
 * Presets de taille, sélecteur de qualité, estimation en direct,
 * coloration, format, options d'inclusion.
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileImage, FileText, Monitor, Maximize, Info } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { exporterOrganigramme, calculerEstimation } from '../utils/export';
import {
    TAILLE_PRESETS,
    QUALITE_CONFIGS,
    PAGE_FORMATS,
    type ExportOptions,
    type FormatExport,
    type ModeColoration,
    type Portee,
} from '../utils/export-types';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    containerId: string;
    nomEtablissement: string;
}

export function ExportDialog({
    open,
    onOpenChange,
    containerId,
    nomEtablissement,
}: ExportDialogProps) {
    const { t } = useTranslation('organisation');
    const [format, setFormat] = useState<FormatExport>('png');
    const [taillePreset, setTaillePreset] = useState('grand');
    const [qualite, setQualite] = useState('haute');
    const [coloration, setColoration] = useState<ModeColoration>('couleur');
    const [inclureTitre, setInclureTitre] = useState(true);
    const [inclureDate, setInclureDate] = useState(true);
    const [inclureLegende, setInclureLegende] = useState(true);
    const [portee, setPortee] = useState<Portee>('visible');
    const [pageFormat, setPageFormat] = useState('a4');
    const [exporting, setExporting] = useState(false);

    const estimation = useMemo(() => {
        if (!open) return null;
        return calculerEstimation(containerId, taillePreset, qualite);
    }, [open, containerId, taillePreset, qualite]);

    const handleExport = useCallback(async () => {
        setExporting(true);
        try {
            const options: ExportOptions = {
                format,
                taillePreset,
                qualite,
                coloration,
                inclureTitre,
                inclureDate,
                inclureLegende,
                titre: nomEtablissement,
                portee,
                pageFormat,
            };
            await exporterOrganigramme(containerId, options);
            onOpenChange(false);
        } catch (error) {
            console.error('Erreur export:', error);
        } finally {
            setExporting(false);
        }
    }, [containerId, format, taillePreset, qualite, coloration, inclureTitre, inclureDate, inclureLegende, nomEtablissement, portee, pageFormat, onOpenChange]);

    const segmentBtn = (active: boolean) =>
        `cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            active
                ? 'bg-[var(--color-dominant-600)] text-white shadow-sm'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-dominant-50)] hover:text-[var(--color-dominant-600)]'
        }`;

    const formatTaille = (mo: number): string => {
        if (mo >= 1000) return `${(mo / 1000).toFixed(1)} Go`;
        if (mo >= 1) return `${mo.toFixed(0)} Mo`;
        return `${Math.round(mo * 1000)} Ko`;
    };

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
                    <legend className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}>
                        {t('organigramme.export.format', 'Format')}
                    </legend>
                    <div className="flex items-center rounded-lg border p-1" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                        <button type="button" className={segmentBtn(format === 'png')} aria-pressed={format === 'png'} onClick={() => setFormat('png')}>
                            <span className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                                <FileImage className="h-3.5 w-3.5" />PNG
                            </span>
                        </button>
                        <button type="button" className={segmentBtn(format === 'pdf')} aria-pressed={format === 'pdf'} onClick={() => setFormat('pdf')}>
                            <span className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                                <FileText className="h-3.5 w-3.5" />PDF
                            </span>
                        </button>
                    </div>
                </fieldset>

                {/* Taille */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }}>
                    <legend className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}>
                        {t('organigramme.export.taille', 'Taille')}
                    </legend>
                    <div className="flex items-center rounded-lg border p-1 flex-wrap" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                        {TAILLE_PRESETS.map(p => (
                            <button key={p.id} type="button" className={segmentBtn(taillePreset === p.id)} aria-pressed={taillePreset === p.id} onClick={() => setTaillePreset(p.id)}>
                                {t(`organigramme.export.taille_${p.id}`, p.label)}
                            </button>
                        ))}
                    </div>
                </fieldset>

                {/* Qualité */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }}>
                    <legend className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}>
                        {t('organigramme.export.qualite', 'Qualité')}
                    </legend>
                    <div className="flex items-center rounded-lg border p-1 flex-wrap" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                        {QUALITE_CONFIGS.map(q => (
                            <button key={q.id} type="button" className={segmentBtn(qualite === q.id)} aria-pressed={qualite === q.id} onClick={() => setQualite(q.id)}>
                                {t(`organigramme.export.qualite_${q.id}`, q.label)}
                            </button>
                        ))}
                    </div>
                </fieldset>

                {/* Estimation */}
                {estimation && (
                    <div className="flex items-center rounded-lg border px-3 py-2" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt, var(--org-node-surface-alt))', gap: 'var(--gap-sm, 0.5rem)' }}>
                        <Info className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                        <span style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)', color: 'var(--color-text-secondary)' }}>
                            {estimation.largeurPx.toLocaleString('fr-FR')} × {estimation.hauteurPx.toLocaleString('fr-FR')} px
                            <span style={{ color: 'var(--color-text-muted)' }}> — </span>
                            ~{formatTaille(estimation.tailleEstimeeMo)}
                            {estimation.tailleEstimeeMo > 50 && (
                                <span style={{ color: 'var(--color-warning)' }}> — {t('organigramme.export.tailleFichierElevee', 'Fichier volumineux')}</span>
                            )}
                        </span>
                    </div>
                )}

                {/* Coloration */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }}>
                    <legend className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}>
                        {t('organigramme.export.coloration', 'Coloration')}
                    </legend>
                    <div className="flex items-center rounded-lg border p-1 flex-wrap" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                        {([
                            { id: 'couleur' as ModeColoration, swatch: 'linear-gradient(135deg, #28a745, #007bff)' },
                            { id: 'monochrome' as ModeColoration, swatch: 'linear-gradient(135deg, #6b7280, #9ca3af)' },
                            { id: 'noirBlanc' as ModeColoration, swatch: 'linear-gradient(135deg, #111827, #f3f4f6)' },
                        ]).map(c => (
                            <button key={c.id} type="button" className={segmentBtn(coloration === c.id)} aria-pressed={coloration === c.id} onClick={() => setColoration(c.id)}>
                                <span className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                                    <span className="inline-block h-3 w-3 rounded-full border border-black/10 flex-shrink-0" style={{ background: c.swatch }} />
                                    {t(`organigramme.export.${c.id}`, c.id === 'couleur' ? 'Couleur' : c.id === 'monochrome' ? 'Monochrome' : 'Noir & blanc')}
                                </span>
                            </button>
                        ))}
                    </div>
                </fieldset>

                {/* Portée */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }}>
                    <legend className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}>
                        {t('organigramme.export.portee', 'Portée')}
                    </legend>
                    <div className="flex items-center rounded-lg border p-1" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                        <button type="button" className={segmentBtn(portee === 'visible')} aria-pressed={portee === 'visible'} onClick={() => setPortee('visible')}>
                            <span className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                                <Monitor className="h-3.5 w-3.5" />
                                {t('organigramme.export.porteeVisible', 'Vue actuelle')}
                            </span>
                        </button>
                        <button type="button" className={segmentBtn(portee === 'etendu')} aria-pressed={portee === 'etendu'} onClick={() => setPortee('etendu')}>
                            <span className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                                <Maximize className="h-3.5 w-3.5" />
                                {t('organigramme.export.porteeEtendu', 'Tout déplié')}
                            </span>
                        </button>
                    </div>
                </fieldset>

                {/* Format page PDF */}
                {format === 'pdf' && (
                    <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }}>
                        <legend className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}>
                            {t('organigramme.export.formatPage', 'Format de page')}
                        </legend>
                        <div className="flex items-center rounded-lg border p-1 flex-wrap" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                            {PAGE_FORMATS.map(f => (
                                <button key={f.id} type="button" className={segmentBtn(pageFormat === f.id)} aria-pressed={pageFormat === f.id} onClick={() => setPageFormat(f.id)}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </fieldset>
                )}

                {/* Options d'inclusion */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }}>
                    <legend className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}>
                        {t('organigramme.export.inclusions', 'Éléments inclus')}
                    </legend>
                    <div className="flex flex-col" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                        <label className="flex items-center cursor-pointer" style={{ gap: 'var(--gap-sm, 0.5rem)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                            <input type="checkbox" checked={inclureTitre} onChange={(e) => setInclureTitre(e.target.checked)} className="rounded border-[var(--color-bordure)]" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>{t('organigramme.export.avecTitre', 'Titre de l\'établissement')}</span>
                        </label>
                        <label className="flex items-center cursor-pointer" style={{ gap: 'var(--gap-sm, 0.5rem)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                            <input type="checkbox" checked={inclureDate} onChange={(e) => setInclureDate(e.target.checked)} className="rounded border-[var(--color-bordure)]" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>{t('organigramme.export.avecDate', 'Date du jour')}</span>
                        </label>
                        <label className="flex items-center cursor-pointer" style={{ gap: 'var(--gap-sm, 0.5rem)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                            <input type="checkbox" checked={inclureLegende} onChange={(e) => setInclureLegende(e.target.checked)} className="rounded border-[var(--color-bordure)]" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>{t('organigramme.export.avecLegende', 'Légende des liens')}</span>
                        </label>
                    </div>
                </fieldset>
            </div>
        </CustomModal>
    );
}
