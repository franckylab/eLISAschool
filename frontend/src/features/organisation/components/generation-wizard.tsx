/**
 * ==================================
 * eLISAschool - Wizard de Génération d'Organisation
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * CustomModal 3 étapes (pattern eLISAschool) :
 *  1) Choix du modèle — mini-cards avec badges
 *  2) Options + prévisualisation détaillée
 *  3) Confirmation + résultat
 *
 * v2.0 — Mini-cards, badges catégorisation, preview détaillée
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight as ChevronRightIcon, Play, FileText, Globe, GraduationCap, Shield, Layers } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { useGenererOrganisation } from '../hooks/use-templates';
import type { TemplateOrganisation, ResultatGeneration } from '../types/organisation.types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templates: TemplateOrganisation[];
    presetTemplateId?: string;
}

interface ApercuNode {
    nom: string;
    count?: number;
    postes?: Array<{ length: number }>;
    enfants?: ApercuNode[];
}

function StructureApercu({ noeud, depth = 0 }: { noeud: ApercuNode; depth?: number }) {
    const { t } = useTranslation('organisation');
    if (!noeud) return null;
    return (
        <div className="text-xs" style={{ paddingLeft: depth ? '0.75rem' : 0 }}>
            <div className="flex items-center gap-1 text-muted-foreground">
                <ChevronRightIcon className="h-3 w-3" />
                <span className="font-medium text-foreground">{noeud.nom || '—'}</span>
                {(noeud.count ?? 0) > 1 && <span>×{noeud.count}</span>}
                {(noeud.postes?.length ?? 0) > 0 && <span className="text-[var(--color-dominant-600)]">· {noeud.postes!.length} {t('postes')}</span>}
            </div>
            {(noeud.enfants || []).slice(0, 5).map((e: ApercuNode, i: number) => <StructureApercu key={i} noeud={e} depth={depth + 1} />)}
        </div>
    );
}

// ─── Mini-carte de template ───
function TemplateMiniCard({ tpl, selected, onClick }: {
    tpl: TemplateOrganisation; selected: boolean; onClick: () => void;
}) {
    const { t } = useTranslation('organisation');
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'relative flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-all',
                selected
                    ? 'border-[var(--color-dominant-500)] bg-[var(--color-dominant-50)] ring-2 ring-[var(--color-dominant-500)]/20 dark:bg-[var(--color-dominant-900)]/20'
                    : 'border-[var(--color-bordure)] bg-[var(--color-surface)] hover:border-[var(--color-dominant-300)] hover:shadow-sm',
            ].join(' ')}
        >
            {selected && (
                <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-dominant-600)] text-white">
                    <Check className="h-3 w-3" />
                </div>
            )}
            <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-[var(--color-dominant-600)] shrink-0" />
                <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{tpl.nom}</span>
            </div>
            {tpl.description && (
                <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2">{tpl.description}</p>
            )}
            <div className="flex flex-wrap gap-1 mt-0.5">
                {tpl.nature && (
                    <Badge variant="secondary" size="xs" className="bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] dark:bg-[var(--color-dominant-900)]/30 dark:text-[var(--color-dominant-300)]">
                        {t(`natures.${tpl.nature}`, tpl.nature)}
                    </Badge>
                )}
                {tpl.systeme && (
                    <Badge variant="secondary" size="xs">
                        {t(`systemes.${tpl.systeme}`, tpl.systeme)}
                    </Badge>
                )}
                {tpl.langue && (
                    <Badge variant="secondary" size="xs" className="bg-[var(--color-info-50)] text-[var(--color-info-700)] dark:bg-[var(--color-info-900)]/30 dark:text-[var(--color-info-300)]">
                        {t(`langues.${tpl.langue}`, tpl.langue)}
                    </Badge>
                )}
                {tpl.complexite === 'AVANCE' && (
                    <Badge variant="warning" size="xs">
                        {t('complexites.AVANCE', 'Avancé')}
                    </Badge>
                )}
            </div>
        </button>
    );
}

// ─── Panneau détaillé du template sélectionné ───
function TemplateDetailPanel({ tpl }: { tpl: TemplateOrganisation }) {
    const { t } = useTranslation('organisation');
    return (
        <div className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface-alt)] p-4 space-y-3">
            <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)] dark:bg-[var(--color-dominant-900)]/30 dark:text-[var(--color-dominant-300)]">
                    <FileText className="h-5 w-5" />
                </div>
                <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">{tpl.nom}</p>
                    {tpl.description && <p className="text-xs text-[var(--color-text-muted)]">{tpl.description}</p>}
                </div>
            </div>

            {/* Métadonnées de catégorisation */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {tpl.nature && (
                    <div className="flex items-center gap-1.5 text-xs">
                        <Shield className="h-3 w-3 text-[var(--color-dominant-600)]" />
                        <span className="text-[var(--color-text-muted)]">{t('natureJuridique', 'Nature')}:</span>
                        <span className="font-medium text-[var(--color-text-primary)]">{t(`natures.${tpl.nature}`, tpl.nature)}</span>
                    </div>
                )}
                {tpl.systeme && (
                    <div className="flex items-center gap-1.5 text-xs">
                        <GraduationCap className="h-3 w-3 text-[var(--color-dominant-600)]" />
                        <span className="text-[var(--color-text-muted)]">{t('systeme', 'Système')}:</span>
                        <span className="font-medium text-[var(--color-text-primary)]">{t(`systemes.${tpl.systeme}`, tpl.systeme)}</span>
                    </div>
                )}
                {tpl.langue && (
                    <div className="flex items-center gap-1.5 text-xs">
                        <Globe className="h-3 w-3 text-[var(--color-dominant-600)]" />
                        <span className="text-[var(--color-text-muted)]">{t('langue', 'Langue')}:</span>
                        <span className="font-medium text-[var(--color-text-primary)]">{t(`langues.${tpl.langue}`, tpl.langue)}</span>
                    </div>
                )}
                {tpl.complexite && (
                    <div className="flex items-center gap-1.5 text-xs">
                        <Layers className="h-3 w-3 text-[var(--color-dominant-600)]" />
                        <span className="text-[var(--color-text-muted)]">{t('complexite', 'Complexité')}:</span>
                        <span className="font-medium text-[var(--color-text-primary)]">{t(`complexites.${tpl.complexite}`, tpl.complexite)}</span>
                    </div>
                )}
            </div>

            {/* Niveaux */}
            {tpl.niveaux && tpl.niveaux.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                    <span className="text-xs text-[var(--color-text-muted)]">{t('niveaux', 'Niveaux')}:</span>
                    {tpl.niveaux.map((n) => (
                        <Badge key={n} variant="secondary" size="xs">
                            {t(`niveaux.${n}`, n)}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Aperçu structure */}
            <div>
                <p className="text-xs font-medium text-[var(--color-text-primary)] mb-1">{t('structureTemplate')}</p>
                <div className="rounded-md border border-[var(--color-bordure)] bg-[var(--color-surface)] p-2 max-h-36 overflow-auto">
                    <StructureApercu noeud={tpl.structure as unknown as ApercuNode} />
                </div>
            </div>
        </div>
    );
}

export function GenerationWizard({ open, onOpenChange, templates, presetTemplateId }: Props) {
    const { t } = useTranslation('organisation');
    const generer = useGenererOrganisation();

    const [step, setStep] = useState(1);
    const [templateId, setTemplateId] = useState('');
    const [prefixeCode, setPrefixeCode] = useState('');
    const [modeConflit, setModeConflit] = useState<'ERROR' | 'SKIP' | 'OVERWRITE'>('OVERWRITE');
    const [creerHierarchie, setCreerHierarchie] = useState(true);
    const [result, setResult] = useState<ResultatGeneration | null>(null);

    useEffect(() => {
        if (open) {
            setStep(1);
            setTemplateId(presetTemplateId || '');
            setPrefixeCode('');
            setModeConflit('OVERWRITE');
            setCreerHierarchie(true);
            setResult(null);
        }
    }, [open, presetTemplateId]);

    const selected = templates.find((tpl) => tpl.id === templateId);
    const etapes = [t('wizardChoixModele'), t('wizardOptions'), t('wizardConfirmation')];

    const handleGenerate = () => {
        if (!templateId) return;
        generer.mutate(
            { templateId, options: { prefixeCode: prefixeCode || undefined, creerHierarchie, modeConflit } },
            { onSuccess: (data) => { setResult(data ?? null); setStep(3); } },
        );
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('genererOrganisation')}
            size="3xl"
            footer={
                <>
                    <ElisaButton variant="outline" size="sm" onClick={() => onOpenChange(false)}>{t('annuler')}</ElisaButton>
                    {step > 1 && !result && (
                        <ElisaButton variant="outline" size="sm" onClick={() => setStep(step - 1)}>{t('precedent')}</ElisaButton>
                    )}
                    {step === 1 && (
                        <ElisaButton variant="primary" size="sm" disabled={!templateId} onClick={() => setStep(2)}>{t('suivant')}</ElisaButton>
                    )}
                    {step === 2 && (
                        <ElisaButton variant="primary" size="sm" icon={<Play className="h-4 w-4" />} disabled={!templateId || generer.isPending} onClick={handleGenerate}>
                            {generer.isPending ? t('generationEnCours') : t('generer')}
                        </ElisaButton>
                    )}
                    {step === 3 && (
                        <ElisaButton variant="primary" size="sm" onClick={() => onOpenChange(false)}>{t('fermer')}</ElisaButton>
                    )}
                </>
            }
        >
            <div className="space-y-5">
                {/* Indicateur de progression */}
                <div className="flex items-center justify-center gap-2">
                    {etapes.map((label, i) => {
                        const n = i + 1;
                        const done = step > n || (step === 3 && n <= 3);
                        const active = step === n;
                        return (
                            <div key={label} className="flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                                    active ? 'bg-[var(--color-dominant-600)] text-white' : done ? 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]' : 'bg-muted text-muted-foreground'
                                }`}>
                                    {done && !active ? <Check className="h-4 w-4" /> : n}
                                </div>
                                <span className={`text-xs font-medium hidden sm:inline ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                                {n < etapes.length && <div className="h-px w-6 bg-border" />}
                            </div>
                        );
                    })}
                </div>

                {/* Étape 1 : choix du modèle — mini-cards */}
                {step === 1 && (
                    <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">{t('template')}</label>
                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[60vh] overflow-auto pr-1"
                            style={{ scrollbarGutter: 'stable' }}
                        >
                            {templates.map((tpl) => (
                                <TemplateMiniCard
                                    key={tpl.id}
                                    tpl={tpl}
                                    selected={templateId === tpl.id}
                                    onClick={() => setTemplateId(tpl.id)}
                                />
                            ))}
                        </div>
                        {templates.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-6">{t('aucunTemplate')}</p>
                        )}
                    </div>
                )}

                {/* Étape 2 : options + aperçu détaillé */}
                {step === 2 && selected && (
                    <div className="space-y-4">
                        {/* Options de génération */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-foreground">{t('prefixeCode')}</label>
                                <input value={prefixeCode} onChange={(e) => setPrefixeCode(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground" placeholder={t('optionnel')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-foreground">{t('modeConflit')}</label>
                                <select value={modeConflit} onChange={(e) => setModeConflit(e.target.value as 'ERROR' | 'SKIP' | 'OVERWRITE')}
                                    className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground">
                                    <option value="ERROR">{t('modeConflitError')}</option>
                                    <option value="SKIP">{t('modeConflitSkip')}</option>
                                    <option value="OVERWRITE">{t('modeConflitOverwrite')}</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 pb-2">
                                    <input type="checkbox" checked={creerHierarchie} onChange={(e) => setCreerHierarchie(e.target.checked)} className="rounded border-border" />
                                    <span className="text-sm text-foreground">{t('creerHierarchie')}</span>
                                </label>
                            </div>
                        </div>

                        {/* Aperçu détaillé du template */}
                        <TemplateDetailPanel tpl={selected} />
                    </div>
                )}

                {/* Étape 3 : résultat */}
                {step === 3 && result && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[var(--color-dominant-700)]"><Check className="h-5 w-5" /><span className="font-semibold">{t('resultatGeneration')}</span></div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-background border border-border rounded"><p className="text-2xl font-bold text-primary">{result.unitesCrees}</p><p className="text-xs text-muted-foreground">{t('unitesCrees')}</p></div>
                            <div className="p-3 bg-background border border-border rounded"><p className="text-2xl font-bold text-secondary-foreground">{result.postesCrees}</p><p className="text-xs text-muted-foreground">{t('postesCrees')}</p></div>
                            <div className="p-3 bg-background border border-border rounded"><p className="text-2xl font-bold text-success">{result.hierarchiesCrees}</p><p className="text-xs text-muted-foreground">{t('hierarchiesCrees')}</p></div>
                        </div>
                    </div>
                )}
            </div>
        </CustomModal>
    );
}
