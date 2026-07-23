/**
 * ==================================
 * eLISAschool - Wizard de Génération d'Organisation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * CustomModal 3 étapes (pattern eLISAschool) :
 *  1) Choix du modèle
 *  2) Options + prévisualisation de l'arbre
 *  3) Confirmation + résultat
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronRight as ChevronRightIcon, Play } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useAuthStore } from '@/stores/auth.store';
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
    if (!noeud) return null;
    return (
        <div className="text-xs" style={{ paddingLeft: depth ? '0.75rem' : 0 }}>
            <div className="flex items-center gap-1 text-muted-foreground">
                <ChevronRightIcon className="h-3 w-3" />
                <span className="font-medium text-foreground">{noeud.nom || '—'}</span>
                {(noeud.count ?? 0) > 1 && <span>×{noeud.count}</span>}
                {(noeud.postes?.length ?? 0) > 0 && <span className="text-[var(--color-dominant-600)]">· {noeud.postes!.length} poste(s)</span>}
            </div>
            {(noeud.enfants || []).slice(0, 5).map((e: ApercuNode, i: number) => <StructureApercu key={i} noeud={e} depth={depth + 1} />)}
        </div>
    );
}

export function GenerationWizard({ open, onOpenChange, templates, presetTemplateId }: Props) {
    const { t } = useTranslation('organisation');
    const etablissementId = useAuthStore((s) => s.etablissementId) || '';
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
        if (!templateId || !etablissementId) return;
        generer.mutate(
            { templateId, etablissementId, options: { prefixeCode: prefixeCode || undefined, creerHierarchie, modeConflit } },
            { onSuccess: (data) => { setResult(data ?? null); setStep(3); } },
        );
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('genererOrganisation')}
            size="2xl"
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
                        <ElisaButton variant="primary" size="sm" icon={<Play className="h-4 w-4" />} disabled={!templateId || !etablissementId || generer.isPending} onClick={handleGenerate}>
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

                {/* Étape 1 : choix du modèle */}
                {step === 1 && (
                    <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">{t('template')}</label>
                        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded bg-background text-foreground">
                            <option value="">{t('selectionnerTemplate')}</option>
                            {templates.map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.nom}</option>)}
                        </select>
                        {selected?.description && <p className="mt-2 text-sm text-muted-foreground">{selected.description}</p>}
                    </div>
                )}

                {/* Étape 2 : options + aperçu */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-foreground">{t('prefixeCode')}</label>
                                <input value={prefixeCode} onChange={(e) => setPrefixeCode(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground" placeholder={t('optionnel')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-foreground">{t('modeConflit')}</label>
                                <select value={modeConflit} onChange={(e) => setModeConflit(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-border rounded bg-background text-foreground">
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
                        <div>
                            <p className="text-sm font-medium text-foreground mb-2">{t('structureTemplate')}</p>
                            <div className="rounded-md border border-border bg-surface-alt/40 p-3 max-h-48 overflow-auto">
                                <StructureApercu noeud={selected?.structure as unknown as ApercuNode} />
                            </div>
                        </div>
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
