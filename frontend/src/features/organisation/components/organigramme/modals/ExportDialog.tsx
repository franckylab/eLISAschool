/**
 * ==================================
 * eLISAschool - Dialog d'export organigramme
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Modal de configuration pour l'export PNG/PDF de l'organigramme.
 * Presets de taille (HD → Ultra ~20k px), qualité, estimation en direct,
 * coloration, orientation (PDF), minimap, portée, progression par étapes.
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    Download, FileImage, FileText, Monitor, Maximize, Info,
    RectangleHorizontal, RectangleVertical,
} from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { calculerGrilleTuiles, type GrilleTuiles } from '@/lib/export';
import { exporterOrganigramme, calculerEstimation } from '../utils/export';
import {
    TAILLE_PRESETS,
    QUALITE_CONFIGS,
    PAGE_FORMATS,
    type ExportOptions,
    type FormatExport,
    type ModeColoration,
    type Portee,
    type OrientationExport,
    type ModePagination,
    type EtapeExport,
    type EstimationExport,
} from '../utils/export-types';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    containerId: string;
    nomEtablissement: string;
}

const formatTaille = (mo: number): string => {
    if (mo >= 1000) return `${(mo / 1000).toFixed(1)} Go`;
    if (mo >= 10) return `${mo.toFixed(0)} Mo`;
    if (mo >= 1) return `${mo.toFixed(1)} Mo`;
    return `${Math.max(1, Math.round(mo * 1024))} Ko`;
};

/** Progression indicative par étape (l'export n'expose pas de granularité fine) */
const PROGRESSION_ETAPES: Record<EtapeExport, number> = {
    preparation: 10,
    depliage: 25,
    capture: 55,
    generation: 85,
    telechargement: 95,
};

/**
 * Aperçu visuel SVG du layout PDF (page + grille tuiles).
 * Dessine la page dans son orientation, l'image estimée à l'intérieur,
 * et la grille de tuiles en mode pagination 'tuiles'.
 */
function ApercuExport({
    estimation,
    pageFormat,
    orientation,
    pagination,
    grilleTuiles,
}: {
    estimation: EstimationExport;
    pageFormat: string;
    orientation: OrientationExport;
    pagination: ModePagination;
    grilleTuiles: GrilleTuiles | null;
}) {
    const { t } = useTranslation('organisation');
    const fmt = PAGE_FORMATS.find(f => f.id === pageFormat.toLowerCase());
    const pageW = fmt ? fmt.width : 210;
    const pageH = fmt ? fmt.height : 297;
    const isPaysage = orientation === 'paysage';
    const rectW = isPaysage ? Math.max(pageW, pageH) : Math.min(pageW, pageH);
    const rectH = isPaysage ? Math.min(pageW, pageH) : Math.max(pageW, pageH);

    const svgMaxW = 200;
    const svgMaxH = 120;
    const scale = Math.min(svgMaxW / rectW, svgMaxH / rectH);
    const drawW = rectW * scale;
    const drawH = rectH * scale;
    const svgW = drawW + 2;
    const svgH = drawH + 2;

    const marge = 10 * scale;
    const zoneX = marge;
    const zoneY = marge;
    const zoneW = drawW - 2 * marge;
    const zoneH = drawH - 2 * marge;

    const imgRatio = estimation.largeurPx / Math.max(estimation.hauteurPx, 1);
    const fitRatio = Math.min(zoneW / imgRatio, zoneH) / (estimation.largeurPx / Math.max(estimation.hauteurPx, 1));
    const imgDrawW = Math.min(estimation.largeurPx * fitRatio, zoneW);
    const imgDrawH = imgDrawW / imgRatio;
    const imgX = zoneX + (zoneW - imgDrawW) / 2;
    const imgY = zoneY + (zoneH - imgDrawH) / 2;

    return (
        <div className="flex flex-col items-center rounded-lg border px-3 py-2" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
            <span style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)', color: 'var(--color-text-muted)' }}>
                {t('organigramme.export.apercu', 'Aperçu')} — {fmt?.label ?? pageFormat} {isPaysage ? t('organigramme.export.paysage', 'Paysage') : t('organigramme.export.portrait', 'Portrait')}
            </span>
            <svg
                width={svgW}
                height={svgH}
                viewBox={`0 0 ${svgW} ${svgH}`}
                role="img"
                aria-label={t('organigramme.export.apercuLabel', 'Aperçu du layout PDF')}
            >
                <rect x={1} y={1} width={drawW} height={drawH} rx={1} fill="var(--color-surface, #fff)" stroke="var(--color-bordure, #e5e7eb)" strokeWidth={0.5} />
                <rect x={imgX} y={imgY} width={imgDrawW} height={imgDrawH} fill="var(--color-dominant-100, #dcfce7)" stroke="var(--color-dominant-400, #4ade80)" strokeWidth={0.3} rx={0.5} />
                {pagination === 'tuiles' && grilleTuiles && (
                    <>
                        {Array.from({ length: grilleTuiles.colonnes }, (_, c) =>
                            Array.from({ length: grilleTuiles.lignes }, (_, l) => {
                                const pasXMm = grilleTuiles.tuileUtileMm.largeur + grilleTuiles.chevauchementMm;
                                const pasYMm = grilleTuiles.tuileUtileMm.hauteur + grilleTuiles.chevauchementMm;
                                const imgLargeurMm = estimation.largeurPx / (150 / 25.4);
                                const imgHauteurMm = estimation.hauteurPx / (150 / 25.4);
                                const tileXMm = c * pasXMm;
                                const tileYMm = l * pasYMm;
                                const tileW = Math.min(pasXMm, imgLargeurMm - tileXMm);
                                const tileH = Math.min(pasYMm, imgHauteurMm - tileYMm);
                                const rx = imgX + tileXMm * (imgDrawW / imgLargeurMm);
                                const ry = imgY + tileYMm * (imgDrawH / imgHauteurMm);
                                const rw = tileW * (imgDrawW / imgLargeurMm);
                                const rh = tileH * (imgDrawH / imgHauteurMm);
                                return (
                                    <g key={`${c}-${l}`}>
                                        <rect x={rx} y={ry} width={rw} height={rh} fill="none" stroke="var(--color-accent-600, #007bff)" strokeWidth={0.3} strokeDasharray="1 0.5" />
                                        <text x={rx + rw / 2} y={ry + rh / 2 + 1} textAnchor="middle" fontSize={3} fill="var(--color-text-muted, #9ca3af)">
                                            {c + 1}×{l + 1}
                                        </text>
                                    </g>
                                );
                            }),
                        )}
                    </>
                )}
            </svg>
        </div>
    );
}

export function ExportDialog({
    open,
    onOpenChange,
    containerId,
    nomEtablissement,
}: ExportDialogProps) {
    const { t } = useTranslation('organisation');
    const [format, setFormat] = useState<FormatExport>('png');
    const [taillePreset, setTaillePreset] = useState('qhd');
    const [qualite, setQualite] = useState('maximale');
    const [coloration, setColoration] = useState<ModeColoration>('couleur');
    const [inclureTitre, setInclureTitre] = useState(true);
    const [inclureDate, setInclureDate] = useState(true);
    const [inclureLegende, setInclureLegende] = useState(true);
    const [inclureMinimap, setInclureMinimap] = useState(false);
    const [portee, setPortee] = useState<Portee>('visible');
    const [orientation, setOrientation] = useState<OrientationExport>('paysage');
    const [pageFormat, setPageFormat] = useState('a4');
    const [pagination, setPagination] = useState<ModePagination>('ajuster');
    const [exporting, setExporting] = useState(false);
    const [etapeExport, setEtapeExport] = useState<EtapeExport | null>(null);

    const estimation = useMemo(() => {
        if (!open) return null;
        return calculerEstimation(containerId, taillePreset, qualite);
    }, [open, containerId, taillePreset, qualite]);

    /** Grille de tuiles estimée (PDF mode tuiles uniquement) */
    const grilleTuiles = useMemo(() => {
        if (!estimation || format !== 'pdf' || pagination !== 'tuiles') return null;
        const pxParMm = 150 / 25.4;
        const largeurMm = estimation.largeurPx / pxParMm;
        const hauteurMm = estimation.hauteurPx / pxParMm;
        return calculerGrilleTuiles(largeurMm, hauteurMm, pageFormat, orientation);
    }, [estimation, format, pagination, pageFormat, orientation]);

    const handleExport = useCallback(async () => {
        setExporting(true);
        setEtapeExport(null);
        try {
            const options: ExportOptions = {
                format,
                taillePreset,
                qualite,
                coloration,
                inclureTitre,
                inclureDate,
                inclureLegende,
                inclureMinimap,
                titre: t('organigramme.export.titreDocument', 'Organigramme hiérarchique et fonctionnel'),
                nomEtablissement,
                portee,
                orientation,
                pageFormat,
                pagination,
            };
            const resultat = await exporterOrganigramme(
                containerId,
                options,
                (etape) => setEtapeExport(etape),
                {
                    hierarchie: t('organigramme.export.legendeHierarchie', 'Hiérarchie'),
                    directe: t('organigramme.export.legendeDirecte', 'Rel. directe'),
                    fonctionnelle: t('organigramme.export.legendeFonctionnelle', 'Rel. fonctionnelle'),
                },
            );
            if (resultat) {
                toast.success(t('organigramme.export.exportReussi', 'Export terminé'), {
                    description: t('organigramme.export.exportDetail', '{{format}} — {{largeur}} × {{hauteur}} px — {{taille}}', {
                        format: resultat.format.toUpperCase(),
                        largeur: resultat.largeurPx.toLocaleString('fr-FR'),
                        hauteur: resultat.hauteurPx.toLocaleString('fr-FR'),
                        taille: formatTaille(resultat.tailleOctets / (1024 * 1024)),
                    }),
                });
            }
            onOpenChange(false);
        } catch (error) {
            console.error('Erreur export:', error);
            toast.error(t('organigramme.export.exportEchec', 'Échec de l\'export'));
        } finally {
            setExporting(false);
            setEtapeExport(null);
        }
    }, [containerId, format, taillePreset, qualite, coloration, inclureTitre, inclureDate, inclureLegende, inclureMinimap, nomEtablissement, portee, orientation, pageFormat, pagination, onOpenChange, t]);

    const segmentBtn = (active: boolean) =>
        `cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            active
                ? 'bg-[var(--color-dominant-600)] text-white shadow-sm'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-dominant-50)] hover:text-[var(--color-dominant-600)]'
        }`;

    const progression = etapeExport ? PROGRESSION_ETAPES[etapeExport] : 0;

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v && !exporting) onOpenChange(false); }}
            title={t('organigramme.export.titre', 'Exporter l\'organigramme')}
            description={t('organigramme.export.description', 'Configurez les options d\'export')}
            size="lg"
            footer={<>
                <ElisaButton variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
                    {t('common:boutons.annuler', 'Annuler')}
                </ElisaButton>
                <ElisaButton
                    variant="primary"
                    icon={exporting ? undefined : <Download className="h-4 w-4" />}
                    onClick={handleExport}
                    disabled={exporting}
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
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }} disabled={exporting}>
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
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }} disabled={exporting}>
                    <legend className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}>
                        {t('organigramme.export.taille', 'Taille')}
                    </legend>
                    <div className="flex items-center rounded-lg border p-1 flex-wrap" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                        {TAILLE_PRESETS.map(p => (
                            <button key={p.id} type="button" className={segmentBtn(taillePreset === p.id)} aria-pressed={taillePreset === p.id} title={t(`organigramme.export.taille_${p.id}_desc`, p.description)} onClick={() => setTaillePreset(p.id)}>
                                {t(`organigramme.export.taille_${p.id}`, p.label)}
                            </button>
                        ))}
                    </div>
                </fieldset>

                {/* Qualité */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }} disabled={exporting}>
                    <legend className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}>
                        {t('organigramme.export.qualite', 'Qualité')}
                    </legend>
                    <div className="flex items-center rounded-lg border p-1 flex-wrap" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                        {QUALITE_CONFIGS.map(q => (
                            <button key={q.id} type="button" className={segmentBtn(qualite === q.id)} aria-pressed={qualite === q.id} title={t(`organigramme.export.qualite_${q.id}_desc`, q.description)} onClick={() => setQualite(q.id)}>
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
                            {estimation.plafonne && (
                                <span style={{ color: 'var(--color-warning)' }}> — {t('organigramme.export.resolutionPlafonnee', 'Résolution plafonnée (limite navigateur)')}</span>
                            )}
                            {grilleTuiles && (
                                <span style={{ color: 'var(--color-accent-600)' }}> — {t('organigramme.export.estimationTuiles', '{{total}} pages ({{colonnes}} × {{lignes}})', {
                                    total: grilleTuiles.totalPages + 1,
                                    colonnes: grilleTuiles.colonnes,
                                    lignes: grilleTuiles.lignes,
                                })}</span>
                            )}
                        </span>
                    </div>
                )}

                {/* Aperçu visuel */}
                {estimation && format === 'pdf' && (
                    <ApercuExport
                        estimation={estimation}
                        pageFormat={pageFormat}
                        orientation={orientation}
                        pagination={pagination}
                        grilleTuiles={grilleTuiles}
                    />
                )}

                {/* Coloration */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }} disabled={exporting}>
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
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }} disabled={exporting}>
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

                {/* Format page + orientation PDF */}
                {format === 'pdf' && (
                    <>
                        <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }} disabled={exporting}>
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

                        <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }} disabled={exporting}>
                            <legend className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}>
                                {t('organigramme.export.orientation', 'Orientation')}
                            </legend>
                            <div className="flex items-center rounded-lg border p-1" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                                <button type="button" className={segmentBtn(orientation === 'paysage')} aria-pressed={orientation === 'paysage'} onClick={() => setOrientation('paysage')}>
                                    <span className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                                        <RectangleHorizontal className="h-3.5 w-3.5" />
                                        {t('organigramme.export.paysage', 'Paysage')}
                                    </span>
                                </button>
                                <button type="button" className={segmentBtn(orientation === 'portrait')} aria-pressed={orientation === 'portrait'} onClick={() => setOrientation('portrait')}>
                                    <span className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                                        <RectangleVertical className="h-3.5 w-3.5" />
                                        {t('organigramme.export.portrait', 'Portrait')}
                                    </span>
                                </button>
                            </div>
                        </fieldset>

                        <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }} disabled={exporting}>
                            <legend className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}>
                                {t('organigramme.export.pagination', 'Pagination')}
                            </legend>
                            <div className="flex items-center rounded-lg border p-1" style={{ borderColor: 'var(--color-bordure)', gap: 'var(--gap-xxs, 0.25rem)' }}>
                                <button type="button" className={segmentBtn(pagination === 'ajuster')} aria-pressed={pagination === 'ajuster'} onClick={() => setPagination('ajuster')}>
                                    <span className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                                        <Monitor className="h-3.5 w-3.5" />
                                        {t('organigramme.export.paginationAjuster', 'Ajuster')}
                                    </span>
                                </button>
                                <button type="button" className={segmentBtn(pagination === 'tuiles')} aria-pressed={pagination === 'tuiles'} onClick={() => setPagination('tuiles')}>
                                    <span className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                                        <Maximize className="h-3.5 w-3.5" />
                                        {t('organigramme.export.paginationTuiles', 'Tuiles')}
                                    </span>
                                </button>
                            </div>
                            {pagination === 'tuiles' && (
                                <span style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)', color: 'var(--color-text-muted)' }}>
                                    {t('organigramme.export.paginationTuilesDesc', 'Découpage en pages avec repères de collage (chevauchement 10 mm)')}
                                </span>
                            )}
                        </fieldset>
                    </>
                )}

                {/* Options d'inclusion */}
                <fieldset className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }} disabled={exporting}>
                    <legend className="font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)', color: 'var(--color-text)' }}>
                        {t('organigramme.export.inclusions', 'Éléments inclus')}
                    </legend>
                    <div className="flex flex-col" style={{ gap: 'var(--gap-xxs, 0.25rem)' }}>
                        <label className="flex items-center cursor-pointer" style={{ gap: 'var(--gap-sm, 0.5rem)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                            <input type="checkbox" checked={inclureTitre} onChange={(e) => setInclureTitre(e.target.checked)} className="rounded border-[var(--color-bordure)]" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>{t('organigramme.export.avecTitre', 'Titre et nom de l\'établissement')}</span>
                        </label>
                        <label className="flex items-center cursor-pointer" style={{ gap: 'var(--gap-sm, 0.5rem)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                            <input type="checkbox" checked={inclureDate} onChange={(e) => setInclureDate(e.target.checked)} className="rounded border-[var(--color-bordure)]" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>{t('organigramme.export.avecDate', 'Date du jour')}</span>
                        </label>
                        <label className="flex items-center cursor-pointer" style={{ gap: 'var(--gap-sm, 0.5rem)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                            <input type="checkbox" checked={inclureLegende} onChange={(e) => setInclureLegende(e.target.checked)} className="rounded border-[var(--color-bordure)]" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>{t('organigramme.export.avecLegende', 'Légende des liens')}</span>
                        </label>
                        <label className="flex items-center cursor-pointer" style={{ gap: 'var(--gap-sm, 0.5rem)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem)' }}>
                            <input type="checkbox" checked={inclureMinimap} onChange={(e) => setInclureMinimap(e.target.checked)} className="rounded border-[var(--color-bordure)]" />
                            <span style={{ color: 'var(--color-text-secondary)' }}>{t('organigramme.export.avecMinimap', 'Vue miniature (minimap)')}</span>
                        </label>
                    </div>
                </fieldset>

                {/* Progression export */}
                {exporting && (
                    <div className="flex flex-col rounded-lg border px-3 py-2" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt, var(--org-node-surface-alt))', gap: 'var(--gap-xs, 0.375rem)' }} role="status" aria-live="polite">
                        <div className="flex items-center justify-between" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                                {etapeExport
                                    ? t(`organigramme.export.etape_${etapeExport}`, etapeExport)
                                    : t('organigramme.export.enCours', 'Export en cours...')}
                            </span>
                            <span style={{ color: 'var(--color-text-muted)' }}>{progression}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-dominant-100)' }}>
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${progression}%`, backgroundColor: 'var(--color-dominant-600)' }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </CustomModal>
    );
}
