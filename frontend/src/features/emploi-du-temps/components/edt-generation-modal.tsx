/**
 * ==================================
 * eLISAschool - Modal Génération EDT multi-étapes
 * ==================================
 * 3 étapes :
 *  1. Options (régénérer, contraintes)
 *  2. Preview (créneaux simulés + conflits)
 *  3. Confirmation (génération réelle)
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, Eye, CheckCircle2, Loader2, AlertTriangle,
    ChevronLeft, Calendar, Clock, MapPin,
    User, BookOpen, Info,
} from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { usePrevisualiserEDT, useGenererEDT, useTemplatesEDT } from '../hooks/use-emploi-du-temps';
import type { CreneauPreview, ConflitPreview, ResumePreview } from '../types/edt.types';

interface EDTGenerationModalProps {
    classeAnneeId: string;
    onSuccess: () => void;
    onClose: () => void;
}

type Etape = 1 | 2 | 3;

const JOURS_ORDRE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
};

export function EDTGenerationModal({ classeAnneeId, onSuccess, onClose }: EDTGenerationModalProps) {
    const { t } = useTranslation('emplois');
    const [etape, setEtape] = useState<Etape>(1);
    const [regenerer, setRegenerer] = useState(false);
    const [respecterContraintes, setRespecterContraintes] = useState(true);
    const [templateId, setTemplateId] = useState<string>('');

    const previsualiser = usePrevisualiserEDT();
    const generer = useGenererEDT();
    const { data: templates } = useTemplatesEDT();

    const [preview, setPreview] = useState<{
        creneaux: CreneauPreview[];
        conflits: ConflitPreview[];
        resume: ResumePreview;
    } | null>(null);

    const [filtreJour, setFiltreJour] = useState<string>('TOUS');
    const [filtreConflit, setFiltreConflit] = useState<string>('TOUS');

    // ─── Étape 1 → 2 : lancer preview ──────────────────
    const handlePrevisualiser = useCallback(async () => {
        try {
            const result = await previsualiser.mutateAsync({
                classeAnneeId,
                templateId: templateId || undefined,
                options: { regenerer, respecterContraintes },
            });
            if (result) setPreview(result);
            setEtape(2);
        } catch {
            // Error handled by hook
        }
    }, [classeAnneeId, templateId, regenerer, respecterContraintes, previsualiser]);

    // ─── Étape 2 → 3 : confirmer et générer ────────────
    const handleGenerer = useCallback(async () => {
        try {
            await generer.mutateAsync({
                classeAnneeId,
                templateId: templateId || undefined,
                options: { regenerer, respecterContraintes },
            });
            setEtape(3);
        } catch {
            // Error handled by hook
        }
    }, [classeAnneeId, templateId, regenerer, respecterContraintes, generer]);

    // ─── Navigation ────────────────────────────────────
    const peutPrevisualiser = !previsualiser.isPending;
    const peutGenerer = preview !== null;
    const hasConflitsBloquants = preview?.conflits?.some(c => c.type === 'PLACEMENT_IMPOSSIBLE') ?? false;

    // Filtrage preview
    const creneauxFiltres = preview?.creneaux?.filter(c =>
        filtreJour === 'TOUS' || c.jour === filtreJour
    ) ?? [];
    const conflitsFiltres = preview?.conflits?.filter(c =>
        filtreConflit === 'TOUS' || c.type === filtreConflit
    ) ?? [];
    const joursDisponibles = preview
        ? Array.from(new Set(preview.creneaux.map(c => c.jour))).sort((a, b) =>
            JOURS_ORDRE.indexOf(a) - JOURS_ORDRE.indexOf(b)
        )
        : [];

    return (
        <div className="space-y-5">
            {/* ─── Stepper ─────────────────────────────── */}
            <div className="flex items-center justify-center gap-2">
                {([1, 2, 3] as Etape[]).map((n) => (
                    <div key={n} className="flex items-center gap-2">
                        <div
                            className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-colors ${
                                etape === n
                                    ? 'bg-[var(--color-dominant-600)] text-white'
                                    : etape > n
                                        ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]'
                                        : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                            }`}
                        >
                            {etape > n ? <CheckCircle2 className="h-4 w-4" /> : n}
                        </div>
                        {n < 3 && (
                            <div className={`h-0.5 w-8 rounded ${etape > n ? 'bg-[var(--color-dominant-400)]' : 'bg-[var(--color-bordure)]'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* ─── Contenu animé ───────────────────────── */}
            <AnimatePresence mode="wait">
                {/* ═══ ÉTAPE 1 : Options ═══ */}
                {etape === 1 && (
                    <motion.div key="etape1" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Settings className="h-5 w-5 text-[var(--color-dominant-600)]" />
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{t('generation.options')}</h3>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={regenerer}
                                    onChange={(e) => setRegenerer(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-[var(--color-bordure)] text-[var(--color-dominant-600)] focus:ring-[var(--color-dominant-500)]"
                                />
                                <div>
                                    <div className="font-medium text-sm text-[var(--color-text-primary)]">{t('generation.regenerer')}</div>
                                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">{t('generation.regenererDesc')}</div>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-bordure)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={respecterContraintes}
                                    onChange={(e) => setRespecterContraintes(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-[var(--color-bordure)] text-[var(--color-dominant-600)] focus:ring-[var(--color-dominant-500)]"
                                />
                                <div>
                                    <div className="font-medium text-sm text-[var(--color-text-primary)]">{t('generation.respecterContraintes')}</div>
                                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">{t('generation.respecterContraintesDesc')}</div>
                                </div>
                            </label>
                        </div>

                        <div className="p-3 rounded-lg border border-[var(--color-accent-500)]/20 bg-[var(--color-accent-500)]/5">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Info className="h-3.5 w-3.5 text-[var(--color-accent-600)]" />
                                <h4 className="font-semibold text-xs text-[var(--color-text-primary)]">{t('generation.info.titre')}</h4>
                            </div>
                            <ul className="text-xs text-[var(--color-text-secondary)] space-y-0.5 ml-5 list-disc">
                                <li>{t('generation.info.l1')}</li>
                                <li>{t('generation.info.l2')}</li>
                                <li>{t('generation.info.l3')}</li>
                                <li>{t('generation.info.l4')}</li>
                            </ul>
                        </div>

                        {/* Sélecteur de template */}
                        {templates && templates.length > 0 && (
                            <div className="flex flex-col gap-[var(--gap-xs)]">
                                <label
                                    className="text-xs font-medium text-[var(--color-text-secondary)]"
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)' }}
                                >
                                    {t('templates.titre')} (optionnel)
                                </label>
                                <select
                                    value={templateId}
                                    onChange={(e) => setTemplateId(e.target.value)}
                                    className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominant-500)] transition-shadow"
                                    style={{
                                        fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)',
                                        padding: 'clamp(0.375rem, 0.3rem + 0.3vw, 0.5rem) clamp(0.5rem, 0.4rem + 0.4vw, 0.75rem)',
                                    }}
                                >
                                    <option value="">Aucun template (préférences par défaut)</option>
                                    {templates.filter(t => t.actif).map(tpl => (
                                        <option key={tpl.id} value={tpl.id}>
                                            {tpl.nom}{tpl.description ? ` — ${tpl.description}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <SectionSeparator />

                        <div className="flex justify-end gap-3">
                            <ElisaButton variant="outline" size="md" onClick={onClose}>
                                {t('generation.annuler')}
                            </ElisaButton>
                            <ElisaButton
                                variant="primary"
                                size="md"
                                icon={previsualiser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                onClick={handlePrevisualiser}
                                disabled={!peutPrevisualiser}
                            >
                                {previsualiser.isPending ? t('generation.previewEnCours') : t('generation.previsualiser')}
                            </ElisaButton>
                        </div>
                    </motion.div>
                )}

                {/* ═══ ÉTAPE 2 : Preview ═══ */}
                {etape === 2 && preview && (
                    <motion.div key="etape2" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
                        {/* Résumé */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <ResumeCard
                                icon={<Calendar className="h-4 w-4" />}
                                label={t('generation.preview.creneaux')}
                                value={preview.resume.totalCreneaux.toString()}
                                color="dominant"
                            />
                            <ResumeCard
                                icon={<Clock className="h-4 w-4" />}
                                label={t('generation.preview.heures')}
                                value={`${preview.resume.totalHeures.toFixed(1)}h`}
                                color="accent"
                            />
                            <ResumeCard
                                icon={<BookOpen className="h-4 w-4" />}
                                label={t('generation.preview.matieres')}
                                value={preview.resume.matieres.toString()}
                                color="success"
                            />
                            <ResumeCard
                                icon={<AlertTriangle className="h-4 w-4" />}
                                label={t('generation.preview.conflits')}
                                value={preview.resume.totalConflits.toString()}
                                color={preview.resume.totalConflits > 0 ? 'warning' : 'success'}
                            />
                        </div>

                        {/* Tabs Créneaux / Conflits */}
                        <div className="border-b border-[var(--color-bordure)]">
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                                        filtreConflit === 'TOUS'
                                            ? 'border-[var(--color-dominant-500)] text-[var(--color-dominant-600)]'
                                            : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                    }`}
                                    onClick={() => setFiltreConflit('TOUS')}
                                >
                                    {t('generation.preview.creneauxTitre')} ({preview.resume.totalCreneaux})
                                </button>
                                <button
                                    type="button"
                                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                                        filtreConflit !== 'TOUS' || preview.resume.totalConflits > 0
                                            ? preview.resume.totalConflits > 0
                                                ? 'border-[var(--color-warning)] text-[var(--color-warning)]'
                                                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                            : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                    }`}
                                    onClick={() => setFiltreConflit('CONFLITS')}
                                >
                                    {t('generation.preview.conflitsTitre')} ({preview.resume.totalConflits})
                                </button>
                            </div>
                        </div>

                        {/* Contenu tab */}
                        {filtreConflit === 'TOUS' ? (
                            <div className="space-y-3">
                                {/* Filtre jour */}
                                {joursDisponibles.length > 1 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setFiltreJour('TOUS')}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                                filtreJour === 'TOUS'
                                                    ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]'
                                                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                            }`}
                                        >
                                            {t('generation.preview.tousJours')}
                                        </button>
                                        {joursDisponibles.map(j => (
                                            <button
                                                key={j}
                                                type="button"
                                                onClick={() => setFiltreJour(j)}
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                                    filtreJour === j
                                                        ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]'
                                                        : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                                }`}
                                            >
                                                {t(`jours.${j.toLowerCase()}`)}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Liste créneaux */}
                                <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
                                    {creneauxFiltres.length === 0 ? (
                                        <p className="text-sm text-[var(--color-text-muted)] text-center py-6">{t('generation.preview.aucunCreneau')}</p>
                                    ) : (
                                        creneauxFiltres.map((c, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-bordure)]/50 hover:bg-[var(--color-surface-hover)] transition-colors">
                                                <div
                                                    className="h-8 w-1 rounded-full shrink-0"
                                                    style={{ backgroundColor: c.matiereCouleur || 'var(--color-dominant-500)' }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{c.matiereNom}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
                                                            {c.numeroSeance}/{c.totalSeances}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--color-text-secondary)]">
                                                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{c.enseignantNom}</span>
                                                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{t(`jours.${c.jour.toLowerCase()}`)}</span>
                                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.heureDebut}–{c.heureFin}</span>
                                                        {c.salleNom && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.salleNom}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {preview.conflits.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 text-center">
                                        <CheckCircle2 className="h-10 w-10 text-[var(--color-success)] mb-3" />
                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{t('generation.preview.aucunConflit')}</p>
                                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">{t('generation.preview.aucunConflitDesc')}</p>
                                    </div>
                                ) : (
                                    <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
                                        {conflitsFiltres.map((c, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5">
                                                <AlertTriangle className="h-4 w-4 text-[var(--color-warning)] shrink-0 mt-0.5" />
                                                <div>
                                                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{c.matiereNom} — {c.seance}</div>
                                                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{c.message}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <SectionSeparator />

                        <div className="flex justify-between gap-3">
                            <ElisaButton
                                variant="outline"
                                size="md"
                                icon={<ChevronLeft className="h-4 w-4" />}
                                onClick={() => setEtape(1)}
                            >
                                {t('precedent')}
                            </ElisaButton>
                            <div className="flex gap-3">
                                <ElisaButton variant="outline" size="md" onClick={onClose}>
                                    {t('generation.annuler')}
                                </ElisaButton>
                                <ElisaButton
                                    variant="primary"
                                    size="md"
                                    icon={generer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    onClick={handleGenerer}
                                    disabled={!peutGenerer || generer.isPending}
                                >
                                    {generer.isPending
                                        ? t('generation.enCours')
                                        : hasConflitsBloquants
                                            ? t('generation.genererMalgreConflits')
                                            : t('generation.confirmerGeneration')}
                                </ElisaButton>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ═══ ÉTAPE 3 : Succès ═══ */}
                {etape === 3 && (
                    <motion.div key="etape3" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
                        <div className="flex flex-col items-center py-8 text-center">
                            <div className="h-16 w-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mb-4">
                                <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                                {t('generation.succes.titre')}
                            </h3>
                            <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
                                {t('generation.succes.description', {
                                    creneaux: preview?.resume.totalCreneaux ?? 0,
                                    heures: (preview?.resume.totalHeures ?? 0).toFixed(1),
                                })}
                            </p>
                            {preview && preview.resume.totalConflits > 0 && (
                                <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-[var(--color-warning)]/10 text-xs text-[var(--color-warning)]">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    {t('generation.succes.conflitsRestants', { count: preview.resume.totalConflits })}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-3 pt-2">
                            <ElisaButton variant="outline" size="md" onClick={onClose}>
                                {t('generation.fermer')}
                            </ElisaButton>
                            <ElisaButton variant="primary" size="md" onClick={onSuccess}>
                                {t('generation.voirEDT')}
                            </ElisaButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Composant résumé ────────────────────────────────

function ResumeCard({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: 'dominant' | 'accent' | 'success' | 'warning';
}) {
    const colorMap = {
        dominant: 'bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] border-[var(--color-dominant-200)]',
        accent: 'bg-[var(--color-accent-50)] text-[var(--color-accent-700)] border-[var(--color-accent-200)]',
        success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20',
        warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20',
    };

    return (
        <div className={`p-3 rounded-lg border ${colorMap[color]}`}>
            <div className="flex items-center gap-1.5 mb-1 opacity-80">
                {icon}
                <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
            </div>
            <div className="text-xl font-bold">{value}</div>
        </div>
    );
}
