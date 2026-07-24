import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Briefcase, GraduationCap, DollarSign, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { CustomModal } from '@/components/modals/CustomModal';
import { usePersonnel } from '../hooks/use-personnel';
import { useTypesContrat, useCreerContrat, useModifierContrat } from '../hooks/use-paie';
import { useAffectationActiveMembre } from '../hooks/use-affectations';
import { usePostesVacants, useTousPostes } from '@/features/postes/hooks/use-postes';
import { useToutesFonctions } from '@/features/fonctions/hooks/use-fonctions';
import { useModesRemuneration } from '@/features/organisation/hooks/use-modes-remuneration';
import { PosteCapaciteIndicator } from '@/features/postes/components/PosteCapaciteIndicator';
import type { ContratPersonnel, MembrePersonnel } from '../types/personnel.types';
import type { Poste } from '@/features/postes/types/poste.types';

const STEPS = ['stepMembre', 'stepPoste', 'stepFonctions', 'stepRemuneration', 'stepRecap'] as const;

interface ContratWizardModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editing?: ContratPersonnel | null;
}

export function ContratWizardModal({ open, onOpenChange, editing }: ContratWizardModalProps) {
    const { t } = useTranslation('contrat');
    const { data: membresData } = usePersonnel({ limit: 100 });
    const { data: typesContrat } = useTypesContrat();
    const { data: postesVacants } = usePostesVacants();
    const { data: tousPostes } = useTousPostes();
    const { data: fonctions } = useToutesFonctions();
    const { data: modesRemuneration } = useModesRemuneration();
    const creer = useCreerContrat();
    const modifier = useModifierContrat();

    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        membrePersonnelId: '',
        typeContrat: '',
        posteId: '',
        fonctionId: '',
        fonctionsSecondairesIds: [] as string[],
        dateDebut: new Date().toISOString().split('T')[0],
        dateFin: '',
        modeRemunerationId: '',
        salaireBase: 0,
        tarifHoraire: 0,
        heuresContractuellesMois: 0,
        tarifHebdomadaire: 0,
        renouvellementAuto: false,
        clauses: '',
    });

    const membres: MembrePersonnel[] = membresData?.items || [];
    const membreOptions = [{ value: '', label: t('typeContratPlaceholder') } as const, ...membres.map((m) => {
        const p = m.utilisateur?.profil;
        const nom = p?.prenom && p?.nom ? `${p.prenom} ${p.nom}` : m.matricule || m.id.slice(0, 8);
        return { value: m.id, label: `${nom} (${m.matricule || '—'})` };
    })];
    const { data: affectationActive } = useAffectationActiveMembre(form.membrePersonnelId);
    const posteActuelDuMembre = affectationActive?.posteId
        ? tousPostes?.find((p: Poste) => p.id === affectationActive.posteId)
        : undefined;

    const typeOptions = [{ value: '', label: t('typeContratPlaceholder') } as const, ...(typesContrat || [])
        .filter((t: any) => t.actif)
        .map((t: any) => ({ value: t.code, label: `${t.code} — ${t.nom}` }))];
    if (typeOptions.length <= 1) {
        typeOptions.push({ value: 'CDI', label: t('fallbackTypeCDI') }, { value: 'CDD', label: t('fallbackTypeCDD') }, { value: 'VACATAIRE', label: t('fallbackTypeVacataire') }, { value: 'STAGIAIRE', label: t('fallbackTypeStagiaire') });
    }

    const modeOptions = [
        { value: '', label: t('modeHerite') },
        ...(modesRemuneration || []).map((m: any) => ({ value: m.id, label: m.label })),
    ];

    const mode = (modesRemuneration || []).find((m: any) => m.id === form.modeRemunerationId);
    const modeCode = mode?.code || '';

    const fonctionOptions = (fonctions || [])
        .filter((f: any) => f.actif !== false)
        .map((f: any) => ({ value: f.id, label: `${f.nom} (${f.code})` }));

    const fonctionsSecondairesDispo = (fonctions || [])
        .filter((f: any) => f.actif !== false && f.id !== form.fonctionId)
        .map((f: any) => ({ value: f.id, label: `${f.nom} (${f.code})` }));

    const membreSelectionne = membres.find((m) => m.id === form.membrePersonnelId);
    const membreTypeCode = membreSelectionne?.typePersonnel?.code;

    const isPosteCompatible = (_poste: Poste): boolean => {
        return true;
    };

    const posteOptions = [
        ...(posteActuelDuMembre && isPosteCompatible(posteActuelDuMembre)
            ? [{ value: posteActuelDuMembre.id, label: `📌 ${posteActuelDuMembre.intitule} (poste actuel)`, isActuel: true }]
            : []),
        ...(postesVacants || [])
            .filter((p: Poste) => p.id !== posteActuelDuMembre?.id && isPosteCompatible(p))
            .map((p: Poste) => ({
                value: p.id,
                label: `${p.intitule} (${p.code})${p.uniteOrganisationnelle ? ` — ${p.uniteOrganisationnelle.nom}` : ''}`,
                isVacant: true,
            })),
    ];

    const canNext = () => {
        switch (step) {
            case 0: return !!form.membrePersonnelId && !!form.typeContrat && !!form.dateDebut;
            case 1: return true; // poste optionnel
            case 2: return true; // fonctions optionnelles
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
        const matchedType = (typesContrat || []).find((t: any) => t.code === form.typeContrat);
        const payload: Record<string, any> = {
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
        Object.keys(payload).forEach((k) => { if (payload[k] === undefined) delete payload[k]; });

        if (editing) {
            await modifier.mutateAsync({ id: editing.id, ...payload } as any);
        } else {
            await creer.mutateAsync(payload as any);
        }
        onOpenChange(false);
    };

    const getFonctionName = (id: string) => fonctions?.find((f: any) => f.id === id)?.nom || id;

    const resetForm = () => {
        setStep(0);
        setForm({
            membrePersonnelId: editing?.membrePersonnelId || '',
            typeContrat: editing?.typeContrat || typesContrat?.[0]?.code || 'CDI',
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
        });
    };

    useEffect(() => {
        if (open) resetForm();
    }, [open]);

    const getMembreLabel = (id: string) => {
        const m = membres.find((x) => x.id === id);
        if (!m) return id;
        const p = m.utilisateur?.profil;
        return p?.prenom && p?.nom ? `${p.prenom} ${p.nom}` : m.matricule || id.slice(0, 8);
    };

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
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('posteDescription') || 'Sélectionnez le poste à assigner au membre via ce contrat.'}</p>
                        {posteActuelDuMembre && (
                            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg text-sm">
                                <span className="font-medium text-blue-700 dark:text-blue-300">{t('posteActuel')} :</span>{' '}
                                <span className="text-blue-600 dark:text-blue-400">{posteActuelDuMembre.intitule} ({posteActuelDuMembre.code})</span>
                            </div>
                        )}
                        <ElisaSelect label={t('poste')} options={[
                            { value: '', label: t('postePlaceholder') },
                            ...posteOptions,
                        ]} value={form.posteId} onValueChange={(v) => setForm({ ...form, posteId: v })} />
                        {form.posteId && (() => {
                            const p = tousPostes?.find((x: Poste) => x.id === form.posteId);
                            return p ? (
                                <div className="flex items-center gap-3 p-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('labelCapacite')}</span>
                                    <PosteCapaciteIndicator occupantsCount={p.occupantsCount} nombrePostes={p.nombrePostes} size="md" />
                                </div>
                            ) : null;
                        })()}
                        {posteOptions.length === 0 && !posteActuelDuMembre && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">{t('aucunPosteVacant')}</p>
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
                                            <button onClick={() => setForm({
                                                ...form,
                                                fonctionsSecondairesIds: form.fonctionsSecondairesIds.filter((x) => x !== fid),
                                            })} className="hover:text-red-500">
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
                        <ElisaSelect label={t('modeRemuneration')} options={modeOptions} value={form.modeRemunerationId}
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
                        <label className="flex items-center gap-2 text-sm cursor-pointer py-2">
                            <input type="checkbox" checked={form.renouvellementAuto}
                                onChange={(e) => setForm({ ...form, renouvellementAuto: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary" />
                            {t('renouvellementAuto')}
                        </label>
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-1">{t('clauses')}</label>
                            <textarea value={form.clauses}
                                onChange={(e) => setForm({ ...form, clauses: e.target.value })}
                                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm min-h-[80px] resize-y"
                                placeholder={t('clausesPlaceholder')} />
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 text-center">
                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <p className="font-medium text-green-800 dark:text-green-300">{t('recapVerifier')}</p>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('recapMembre')}</span><span className="font-medium">{getMembreLabel(form.membrePersonnelId)}</span></div>
                            <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('recapTypeContrat')}</span><span className="font-medium">{form.typeContrat}</span></div>
                            <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('recapPoste')}</span><span className="font-medium">{form.posteId ? (tousPostes?.find((p: Poste) => p.id === form.posteId)?.intitule || form.posteId) : t('recapAucun')}</span></div>
                            <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('recapFonctionPrincipale')}</span><span className="font-medium">{form.fonctionId ? getFonctionName(form.fonctionId) : t('recapAucune')}</span></div>
                            <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('recapFonctionsSecondaires')}</span><span className="font-medium">{form.fonctionsSecondairesIds.length > 0 ? form.fonctionsSecondairesIds.map(getFonctionName).join(', ') : t('recapAucune')}</span></div>
                            <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('recapModeRemuneration')}</span><span className="font-medium">{mode?.label || form.modeRemunerationId}</span></div>
                            {form.salaireBase > 0 && <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('recapSalaireBase')}</span><span className="font-medium">{form.salaireBase.toLocaleString('fr-FR')} F</span></div>}
                            {form.tarifHoraire > 0 && <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('recapTarifHoraire')}</span><span className="font-medium">{form.tarifHoraire.toLocaleString('fr-FR')} F/h</span></div>}
                            {form.heuresContractuellesMois > 0 && <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('recapHeuresContractuelles')}</span><span className="font-medium">{form.heuresContractuellesMois}h/mois</span></div>}
                            {form.tarifHebdomadaire > 0 && <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('recapTarifHebdomadaire')}</span><span className="font-medium">{form.tarifHebdomadaire.toLocaleString('fr-FR')} F/sem</span></div>}
                            <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('recapDateDebut')}</span><span className="font-medium">{new Date(form.dateDebut).toLocaleDateString('fr-FR')}</span></div>
                            <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('recapDateFin')}</span><span className="font-medium">{form.dateFin ? new Date(form.dateFin).toLocaleDateString('fr-FR') : t('recapAucun')}</span></div>
                            {form.renouvellementAuto && <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('renouvellementAuto')}</span><span className="font-medium text-green-600 dark:text-green-400">{t('oui')}</span></div>}
                            {form.clauses && <div className="flex justify-between py-2"><span className="text-gray-500 dark:text-gray-400">{t('clauses')}</span><span className="font-medium text-xs max-w-[200px] text-right">{form.clauses}</span></div>}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) { resetForm(); onOpenChange(v); } }}
            title={editing ? t('modifierContrat') : t('nouveauContrat')}
            size="lg"
            footer={
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1">
                        {STEPS.map((_, i) => (
                            <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <ElisaButton variant="secondary" onClick={() => { resetForm(); onOpenChange(false); }}>
                            {t('annuler')}
                        </ElisaButton>
                        {step > 0 && (
                            <ElisaButton variant="outline" onClick={prev} icon={<ChevronLeft className="h-4 w-4" />}>
                                {t('precedent')}
                            </ElisaButton>
                        )}
                        {step < STEPS.length - 1 ? (
                            <ElisaButton variant="primary" onClick={next} disabled={!canNext()} icon={<ChevronRight className="h-4 w-4" />}>
                                {t('suivant')}
                            </ElisaButton>
                        ) : (
                            <ElisaButton variant="primary" onClick={handleSubmit} loading={creer.isPending || modifier.isPending}
                                icon={<CheckCircle className="h-4 w-4" />}>
                                {editing ? t('enregistrer') : t('creer')}
                            </ElisaButton>
                        )}
                    </div>
                </div>
            }
        >
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    {STEPS.map((s, i) => {
                        const icons = [User, Briefcase, GraduationCap, DollarSign, CheckCircle];
                        const Icon = icons[i];
                        return (
                            <button key={s} onClick={() => i <= step && setStep(i)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    i === step ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : i < step ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30' : 'text-gray-400 dark:text-gray-500'
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{t(s)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
            <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
                    {stepContent()}
                </motion.div>
            </AnimatePresence>
        </CustomModal>
    );
}
