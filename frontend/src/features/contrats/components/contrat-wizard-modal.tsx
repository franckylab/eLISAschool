/**
 * ==================================
 * eLISAschool - Wizard Contrat (création / édition)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect, useCallback } from 'react';
import { X, User, Briefcase, GraduationCap, Wallet, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { CustomModal } from '@/components/modals/CustomModal';
import { usePersonnel } from '@/features/personnel/hooks/use-personnel';
import { useAffectationActiveMembre } from '@/features/personnel/hooks/use-affectations';
import { usePostesVacants, useTousPostes } from '@/features/postes/hooks/use-postes';
import { useToutesFonctions } from '@/features/fonctions/hooks/use-fonctions';
import { useModesRemuneration } from '@/features/organisation/hooks/use-modes-remuneration';
import { PosteCapaciteIndicator } from '@/features/postes/components/PosteCapaciteIndicator';
import { useTypesContrat, useCreerContrat, useModifierContrat } from '../hooks/use-contrats';
import type { ContratPersonnel, CreerContratDto, TypeContratPersonnalise } from '../types/contrat.types';
import type { MembrePersonnel } from '@/features/personnel/types/personnel.types';
import type { Poste } from '@/features/postes/types/poste.types';
import type { Fonction } from '@/features/fonctions/types/fonction.types';

const STEPS = ['stepMembre', 'stepPoste', 'stepFonctions', 'stepRemuneration', 'stepRecap'] as const;
const STEP_ICONS = [User, Briefcase, GraduationCap, Wallet, CheckCircle] as const;

interface ContratWizardModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editing?: ContratPersonnel | null;
}

interface FormState {
    membrePersonnelId: string;
    typeContrat: string;
    posteId: string;
    fonctionId: string;
    fonctionsSecondairesIds: string[];
    dateDebut: string;
    dateFin: string;
    modeRemunerationId: string;
    salaireBase: number;
    tarifHoraire: number;
    heuresContractuellesMois: number;
    tarifHebdomadaire: number;
    renouvellementAuto: boolean;
    clauses: string;
}

function formInitial(editing?: ContratPersonnel | null): FormState {
    return {
        membrePersonnelId: editing?.membrePersonnelId || '',
        typeContrat: editing?.typeContrat || '',
        posteId: editing?.posteId || '',
        fonctionId: editing?.fonctionId || '',
        fonctionsSecondairesIds: [],
        dateDebut: editing?.dateDebut?.split('T')[0] || new Date().toISOString().split('T')[0],
        dateFin: editing?.dateFin?.split('T')[0] || '',
        modeRemunerationId: editing?.modeRemunerationId || '',
        salaireBase: editing?.salaireBase || 0,
        tarifHoraire: editing?.tarifHoraire || 0,
        heuresContractuellesMois: editing?.heuresContractuellesMois || 0,
        tarifHebdomadaire: editing?.tarifHebdomadaire || 0,
        renouvellementAuto: editing?.renouvellementAuto || false,
        clauses: editing?.clauses || '',
    };
}

export function ContratWizardModal({ open, onOpenChange, editing }: ContratWizardModalProps) {
    const { t } = useTranslation('contrats');
    const { data: membresData } = usePersonnel({ limit: 100 });
    const { data: typesContrat } = useTypesContrat();
    const { data: postesVacants } = usePostesVacants();
    const { data: tousPostes } = useTousPostes();
    const { data: fonctions } = useToutesFonctions();
    const { data: modesRemuneration } = useModesRemuneration();
    const creer = useCreerContrat();
    const modifier = useModifierContrat();

    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormState>(() => formInitial(editing));

    const resetForm = useCallback(() => {
        setStep(0);
        setForm(formInitial(editing));
    }, [editing]);

    useEffect(() => {
        if (open) resetForm();
    }, [open, resetForm]);

    const membres: MembrePersonnel[] = membresData?.items || [];
    const membreOptions = [
        { value: '', label: t('typeContratPlaceholder') },
        ...membres.map((m) => {
            const p = m.utilisateur?.profil;
            const nom = p?.prenom && p?.nom ? `${p.prenom} ${p.nom}` : m.matricule || m.id.slice(0, 8);
            return { value: m.id, label: `${nom} (${m.matricule || '—'})` };
        }),
    ];

    const { data: affectationActive } = useAffectationActiveMembre(form.membrePersonnelId);
    const posteActuelDuMembre = affectationActive?.posteId
        ? tousPostes?.find((p: Poste) => p.id === affectationActive.posteId)
        : undefined;

    const typeOptions = [
        { value: '', label: t('typeContratPlaceholder') },
        ...(typesContrat || [])
            .filter((tc: TypeContratPersonnalise) => tc.actif)
            .map((tc: TypeContratPersonnalise) => ({ value: tc.code, label: `${tc.code} — ${tc.nom}` })),
    ];
    if (typeOptions.length <= 1) {
        typeOptions.push(
            { value: 'CDI', label: t('fallbackTypeCDI') },
            { value: 'CDD', label: t('fallbackTypeCDD') },
            { value: 'VACATAIRE', label: t('fallbackTypeVacataire') },
            { value: 'STAGIAIRE', label: t('fallbackTypeStagiaire') },
        );
    }

    const modeOptions = [
        { value: '', label: t('modeHerite') },
        ...(modesRemuneration || []).map((m) => ({ value: m.id, label: m.label })),
    ];
    const mode = (modesRemuneration || []).find((m) => m.id === form.modeRemunerationId);
    const modeCode = mode?.code || '';

    const fonctionOptions = (fonctions || [])
        .filter((f: Fonction) => f.actif !== false)
        .map((f: Fonction) => ({ value: f.id, label: `${f.nom} (${f.code})` }));

    const fonctionsSecondairesDispo = (fonctions || [])
        .filter((f: Fonction) => f.actif !== false && f.id !== form.fonctionId)
        .map((f: Fonction) => ({ value: f.id, label: `${f.nom} (${f.code})` }));

    const posteOptions = [
        ...(posteActuelDuMembre
            ? [{ value: posteActuelDuMembre.id, label: `${posteActuelDuMembre.intitule} ${t('posteActuelSuffixe')}` }]
            : []),
        ...(postesVacants || [])
            .filter((p: Poste) => p.id !== posteActuelDuMembre?.id)
            .map((p: Poste) => ({
                value: p.id,
                label: `${p.intitule} (${p.code})${p.uniteOrganisationnelle ? ` — ${p.uniteOrganisationnelle.nom}` : ''}`,
            })),
    ];

    const canNext = () => {
        switch (step) {
            case 0: return !!form.membrePersonnelId && !!form.typeContrat && !!form.dateDebut;
            case 1: return true;
            case 2: return true;
            case 3: return !!form.modeRemunerationId && (
                modeCode === 'MENSUEL' ? form.salaireBase > 0 :
                modeCode === 'HORAIRE' ? form.tarifHoraire > 0 :
                modeCode === 'MIXTE' ? form.salaireBase > 0 && form.tarifHoraire > 0 :
                modeCode === 'HEBDOMADAIRE' ? form.tarifHebdomadaire > 0 : true
            );
            case 4: return true;
            default: return false;
        }
    };

    const next = () => { if (canNext()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
    const prev = () => setStep((s) => Math.max(s - 1, 0));

    const handleSubmit = async () => {
        const matchedType = (typesContrat || []).find((tc: TypeContratPersonnalise) => tc.code === form.typeContrat);
        const payload: CreerContratDto = {
            membrePersonnelId: form.membrePersonnelId,
            typeContrat: form.typeContrat,
            typeContratId: matchedType?.id || undefined,
            posteId: form.posteId || undefined,
            fonctionId: form.fonctionId || undefined,
            fonctionsSecondairesIds: form.fonctionsSecondairesIds.length > 0 ? form.fonctionsSecondairesIds : undefined,
            dateDebut: form.dateDebut,
            dateFin: form.dateFin || undefined,
            modeRemunerationId: form.modeRemunerationId || undefined,
            renouvellementAuto: form.renouvellementAuto || undefined,
            clauses: form.clauses || undefined,
            salaireBase: Number(form.salaireBase),
            tarifHoraire: modeCode === 'HORAIRE' || modeCode === 'MIXTE' ? Number(form.tarifHoraire) : undefined,
            heuresContractuellesMois: modeCode === 'MIXTE' ? Number(form.heuresContractuellesMois) : undefined,
            tarifHebdomadaire: modeCode === 'HEBDOMADAIRE' ? Number(form.tarifHebdomadaire) : undefined,
        };

        if (editing) {
            const { membrePersonnelId: _omitted, ...updateDto } = payload;
            await modifier.mutateAsync({ id: editing.id, ...updateDto });
        } else {
            await creer.mutateAsync(payload);
        }
        onOpenChange(false);
    };

    const getFonctionName = (id: string) => fonctions?.find((f: Fonction) => f.id === id)?.nom || id;

    const getMembreLabel = (id: string) => {
        const m = membres.find((x) => x.id === id);
        if (!m) return id;
        const p = m.utilisateur?.profil;
        return p?.prenom && p?.nom ? `${p.prenom} ${p.nom}` : m.matricule || id.slice(0, 8);
    };

    const recapRow = (label: string, value: string) => (
        <div className="flex justify-between py-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground">{value}</span>
        </div>
    );

    const stepContent = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-4">
                        <ElisaSelect label={t('membre')} options={membreOptions} value={form.membrePersonnelId}
                            onValueChange={(v) => setForm({ ...form, membrePersonnelId: v })} required />
                        <ElisaSelect label={t('typeContrat')} options={typeOptions} value={form.typeContrat}
                            onValueChange={(v) => setForm({ ...form, typeContrat: v })} required />
                        <div className="grid grid-cols-2 gap-4">
                            <ElisaInput label={t('dateDebut')} type="date" value={form.dateDebut}
                                onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} required />
                            <ElisaInput label={t('dateFin')} type="date" value={form.dateFin}
                                onChange={(e) => setForm({ ...form, dateFin: e.target.value })} />
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{t('posteDescription')}</p>
                        {posteActuelDuMembre && (
                            <div className="bg-primary/10 border border-primary/20 rounded-[var(--radius-lg)] p-3 text-sm">
                                <span className="font-medium text-primary">{t('posteActuel')} :</span>{' '}
                                <span className="text-foreground">{posteActuelDuMembre.intitule} ({posteActuelDuMembre.code})</span>
                            </div>
                        )}
                        <ElisaSelect label={t('poste')} options={[
                            { value: '', label: t('postePlaceholder') },
                            ...posteOptions,
                        ]} value={form.posteId} onValueChange={(v) => setForm({ ...form, posteId: v })} />
                        {form.posteId && (() => {
                            const p = tousPostes?.find((x: Poste) => x.id === form.posteId);
                            return p ? (
                                <div className="flex items-center gap-3 p-2 px-3 bg-muted rounded-[var(--radius-lg)]">
                                    <span className="text-xs text-muted-foreground">{t('labelCapacite')}</span>
                                    <PosteCapaciteIndicator occupantsCount={p.occupantsCount} nombrePostes={p.nombrePostes} size="md" />
                                </div>
                            ) : null;
                        })()}
                        {posteOptions.length === 0 && !posteActuelDuMembre && (
                            <p className="text-xs text-muted-foreground">{t('aucunPosteVacant')}</p>
                        )}
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <ElisaSelect label={t('fonctionPrincipale')} options={[
                            { value: '', label: t('aucuneFonction') },
                            ...fonctionOptions,
                        ]} value={form.fonctionId} onValueChange={(v) => {
                            setForm({
                                ...form,
                                fonctionId: v,
                                fonctionsSecondairesIds: form.fonctionsSecondairesIds.filter((fid) => fid !== v),
                            });
                        }} />
                        {form.fonctionId && (
                            <>
                                <label className="text-sm font-medium text-foreground">{t('fonctionsSecondaires')}</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {form.fonctionsSecondairesIds.map((fid) => (
                                        <span key={fid} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                            {getFonctionName(fid)}
                                            <button type="button" onClick={() => setForm({
                                                ...form,
                                                fonctionsSecondairesIds: form.fonctionsSecondairesIds.filter((x) => x !== fid),
                                            })} className="hover:text-destructive">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <ElisaSelect label={t('fonctionsSecondairesPlaceholder')} options={[
                                    { value: '', label: `— ${t('fonctionsSecondairesPlaceholder')} —` },
                                    ...fonctionsSecondairesDispo,
                                ]} value="" onValueChange={(v) => {
                                    if (v && !form.fonctionsSecondairesIds.includes(v)) {
                                        setForm({ ...form, fonctionsSecondairesIds: [...form.fonctionsSecondairesIds, v] });
                                    }
                                }} />
                            </>
                        )}
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4">
                        <ElisaSelect label={t('modeRemunerationLabel')} options={modeOptions} value={form.modeRemunerationId}
                            onValueChange={(v) => setForm({ ...form, modeRemunerationId: v })} required />
                        {(!modeCode || modeCode === 'MENSUEL' || modeCode === 'MIXTE') && (
                            <ElisaInput label={t('salaireBase')} type="number" value={String(form.salaireBase)}
                                onChange={(e) => setForm({ ...form, salaireBase: Number(e.target.value) })} required />
                        )}
                        {(modeCode === 'HORAIRE' || modeCode === 'MIXTE') && (
                            <ElisaInput label={t('tarifHoraire')} type="number" value={String(form.tarifHoraire)}
                                onChange={(e) => setForm({ ...form, tarifHoraire: Number(e.target.value) })} />
                        )}
                        {modeCode === 'MIXTE' && (
                            <ElisaInput label={t('heuresContractuelles')} type="number" value={String(form.heuresContractuellesMois)}
                                onChange={(e) => setForm({ ...form, heuresContractuellesMois: Number(e.target.value) })} />
                        )}
                        {modeCode === 'HEBDOMADAIRE' && (
                            <ElisaInput label={t('tarifHebdomadaire')} type="number" value={String(form.tarifHebdomadaire)}
                                onChange={(e) => setForm({ ...form, tarifHebdomadaire: Number(e.target.value) })} />
                        )}
                        <label className="flex items-center gap-2 text-sm cursor-pointer py-2 text-foreground">
                            <input type="checkbox" checked={form.renouvellementAuto}
                                onChange={(e) => setForm({ ...form, renouvellementAuto: e.target.checked })}
                                className="w-4 h-4 rounded border-input text-primary focus:ring-primary" />
                            {t('renouvellementAuto')}
                        </label>
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-1">{t('clauses')}</label>
                            <textarea value={form.clauses}
                                onChange={(e) => setForm({ ...form, clauses: e.target.value })}
                                className="w-full px-3 py-2 border border-input rounded-[var(--radius-lg)] bg-background text-foreground text-sm min-h-[80px] resize-y"
                                placeholder={t('clausesPlaceholder')} />
                        </div>
                    </div>
                );
            case 4: {
                const posteLabel = form.posteId
                    ? (tousPostes?.find((p: Poste) => p.id === form.posteId)?.intitule || form.posteId)
                    : t('recapAucun');
                return (
                    <div className="space-y-4">
                        <div className="bg-success/10 border border-success/30 rounded-[var(--radius-lg)] p-4 text-center">
                            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                            <p className="font-medium text-foreground">{t('recapVerifier')}</p>
                        </div>
                        <div className="divide-y divide-border text-sm">
                            {recapRow(t('recapMembre'), getMembreLabel(form.membrePersonnelId))}
                            {recapRow(t('recapTypeContrat'), form.typeContrat)}
                            {recapRow(t('recapPoste'), posteLabel)}
                            {recapRow(t('recapFonctionPrincipale'), form.fonctionId ? getFonctionName(form.fonctionId) : t('recapAucune'))}
                            {recapRow(t('recapFonctionsSecondaires'), form.fonctionsSecondairesIds.length > 0
                                ? form.fonctionsSecondairesIds.map(getFonctionName).join(', ')
                                : t('recapAucune'))}
                            {recapRow(t('recapModeRemuneration'), mode?.label || t('recapAucun'))}
                            {(!modeCode || modeCode === 'MENSUEL' || modeCode === 'MIXTE') &&
                                recapRow(t('recapSalaireBase'), `${form.salaireBase.toLocaleString('fr-FR')} F`)}
                            {(modeCode === 'HORAIRE' || modeCode === 'MIXTE') &&
                                recapRow(t('recapTarifHoraire'), `${form.tarifHoraire.toLocaleString('fr-FR')} F/h`)}
                            {modeCode === 'MIXTE' &&
                                recapRow(t('recapHeuresContractuelles'), `${form.heuresContractuellesMois} h/mois`)}
                            {modeCode === 'HEBDOMADAIRE' &&
                                recapRow(t('recapTarifHebdomadaire'), `${form.tarifHebdomadaire.toLocaleString('fr-FR')} F/sem`)}
                            {recapRow(t('recapDateDebut'), form.dateDebut)}
                            {recapRow(t('recapDateFin'), form.dateFin || t('recapAucune'))}
                            {recapRow(t('renouvellementAuto'), form.renouvellementAuto ? t('oui') : t('non'))}
                            {form.clauses && recapRow(t('clauses'), form.clauses)}
                        </div>
                    </div>
                );
            }
            default:
                return null;
        }
    };

    const isPending = creer.isPending || modifier.isPending;

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={editing ? t('modifierContrat') : t('nouveauContrat')}
            size="2xl"
            footer={
                <div className="flex items-center justify-between w-full gap-[var(--gap-md)]">
                    <div className="flex items-center gap-1.5">
                        {STEPS.map((s, i) => (
                            <span key={s} className={`h-1.5 rounded-full transition-all ${
                                i === step ? 'w-6 bg-primary' : i < step ? 'w-3 bg-primary/50' : 'w-3 bg-muted'
                            }`} />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <ElisaButton variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            {t('annuler')}
                        </ElisaButton>
                        {step > 0 && (
                            <ElisaButton variant="outline" size="sm" onClick={prev}>
                                {t('precedent')}
                            </ElisaButton>
                        )}
                        {step < STEPS.length - 1 ? (
                            <ElisaButton variant="primary" size="sm" onClick={next} disabled={!canNext()}>
                                {t('suivant')}
                            </ElisaButton>
                        ) : (
                            <ElisaButton variant="primary" size="sm" onClick={handleSubmit} loading={isPending}>
                                {editing ? t('enregistrer') : t('creer')}
                            </ElisaButton>
                        )}
                    </div>
                </div>
            }
        >
            <div className="flex items-center justify-center gap-[var(--gap-sm)] mb-4 flex-wrap">
                {STEPS.map((s, i) => {
                    const Icon = STEP_ICONS[i];
                    const clickable = i <= step;
                    return (
                        <button
                            key={s}
                            type="button"
                            disabled={!clickable}
                            onClick={() => { if (clickable) setStep(i); }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                i === step
                                    ? 'bg-primary/10 text-primary'
                                    : i < step
                                        ? 'text-primary hover:bg-primary/5'
                                        : 'text-muted-foreground cursor-default'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{t(s)}</span>
                        </button>
                    );
                })}
            </div>
            {stepContent()}
        </CustomModal>
    );
}
