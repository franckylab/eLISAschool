import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { Save, BookOpen, Settings } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ProgrammePedagogique, CreerProgrammeDto, ProgrammeType } from '../types/programme.types';

interface ProgrammeFormModalProps {
    open: boolean;
    programme: ProgrammePedagogique | null;
    onClose: () => void;
    onSubmit: (dto: CreerProgrammeDto) => Promise<void>;
}

interface CycleOption { id: string; nom: string; code: string; }
interface NiveauOption { id: string; nom: string; code: string; cycleId: string; }

const FORM_INIT = {
    nom: '',
    description: '',
    code: '',
    type: 'NIVEAU' as ProgrammeType,
    cycleId: '',
    niveauId: '',
    objectifsGeneraux: '',
    competencesVisees: '',
};

export function ProgrammeFormModal({ open, programme, onClose, onSubmit }: ProgrammeFormModalProps) {
    const { t } = useTranslation('programmes');
    const isEditMode = !!programme;

    const [nom, setNom] = useState(FORM_INIT.nom);
    const [description, setDescription] = useState(FORM_INIT.description);
    const [code, setCode] = useState(FORM_INIT.code);
    const [type, setType] = useState<ProgrammeType>(FORM_INIT.type);
    const [cycleId, setCycleId] = useState(FORM_INIT.cycleId);
    const [niveauId, setNiveauId] = useState(FORM_INIT.niveauId);
    const [objectifsGeneraux, setObjectifsGeneraux] = useState(FORM_INIT.objectifsGeneraux);
    const [competencesVisees, setCompetencesVisees] = useState(FORM_INIT.competencesVisees);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setNom(programme?.nom || FORM_INIT.nom);
            setDescription(programme?.description || FORM_INIT.description);
            setCode(programme?.code || FORM_INIT.code);
            setType(programme?.type || FORM_INIT.type);
            setCycleId(programme?.cycleId || FORM_INIT.cycleId);
            setNiveauId(programme?.niveauId || FORM_INIT.niveauId);
            setObjectifsGeneraux(programme?.objectifsGeneraux || FORM_INIT.objectifsGeneraux);
            setCompetencesVisees(programme?.competencesVisees?.join(', ') || FORM_INIT.competencesVisees);
            setErrors({});
        }
    }, [open, programme]);

    useEffect(() => {
        if (!isEditMode && nom && !code) {
            const generatedCode = nom
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_|_$/g, '');
            setCode(generatedCode);
        }
    }, [nom, code, isEditMode]);

    const { data: cyclesRaw } = useQuery({
        queryKey: ['cycles', 'all'],
        queryFn: async () => {
            const res = await apiClient.get<CycleOption[]>('/api/cycles/all');
            return res.data || [];
        },
        staleTime: 10 * 60 * 1000,
    });

    const cycles = cyclesRaw || [];

    const { data: niveauxRaw } = useQuery({
        queryKey: ['niveaux', 'all'],
        queryFn: async () => {
            const res = await apiClient.get<NiveauOption[]>('/api/niveaux/all');
            return res.data || [];
        },
        staleTime: 10 * 60 * 1000,
    });

    const niveaux = niveauxRaw || [];

    const filteredNiveaux = niveaux.filter((n: NiveauOption) => !cycleId || n.cycleId === cycleId) || [];

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!nom.trim()) newErrors.nom = t('champRequis', 'Ce champ est requis');
        if (!code.trim()) newErrors.code = t('champRequis', 'Ce champ est requis');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            await onSubmit({
                nom,
                description: description || undefined,
                code: code || undefined,
                type,
                cycleId: cycleId || undefined,
                niveauId: niveauId || undefined,
                objectifsGeneraux: objectifsGeneraux || undefined,
                competencesVisees: competencesVisees ? competencesVisees.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            });
            onClose();
        } catch (error) {
            toast.error(t('erreurSauvegarde', 'Erreur lors de la sauvegarde du programme'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = (field: string) =>
        `w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent ${
            errors[field] ? 'border-destructive' : 'border-input'
        }`;

    const labelClass = 'block text-sm font-medium text-[var(--color-texte)] mb-1';

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title={isEditMode ? t('modifierProgramme') : t('nouveauProgramme')}
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onClose} disabled={isSubmitting}>
                        {t('annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        leftIcon={<Save className="h-4 w-4" />}
                    >
                        {isEditMode ? t('enregistrer') : t('creer')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('infosGenerales')}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>{t('nom')} <span className="text-destructive">*</span></label>
                            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} className={inputClass('nom')} placeholder={t('nom')} autoFocus />
                            {errors.nom && <p className="text-destructive text-xs mt-1">{errors.nom}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>{t('code')} <span className="text-destructive">*</span></label>
                            <input type="text" value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} className={`${inputClass('code')} font-mono`} placeholder="prog_6e_2024" />
                            {errors.code && <p className="text-destructive text-xs mt-1">{errors.code}</p>}
                            {!isEditMode && <p className="text-xs text-[var(--color-texte-secondaire)] mt-1">{t('codeAutoGenere', 'Généré auto si vide')}</p>}
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>{t('description')}</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass('description')} placeholder={t('description')} />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <Settings className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('configurations', 'Configuration')}
                    </h3>
                    <SectionSeparator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>{t('type')}</label>
                            <select value={type} onChange={(e) => setType(e.target.value as ProgrammeType)} className={inputClass('type')}>
                                <option value="NIVEAU">{t('programmeType.NIVEAU')}</option>
                                <option value="CYCLE">{t('programmeType.CYCLE')}</option>
                                <option value="PERSONNALISE">{t('programmeType.PERSONNALISE')}</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>{t('cycle')}</label>
                            <select value={cycleId} onChange={(e) => { setCycleId(e.target.value); setNiveauId(''); }} className={inputClass('cycleId')}>
                                <option value="">{t('tousLesCycles')}</option>
                                    {cycles?.map((c: CycleOption) => (
                                    <option key={c.id} value={c.id}>{c.nom}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>{t('niveau')}</label>
                            <select value={niveauId} onChange={(e) => setNiveauId(e.target.value)} className={inputClass('niveauId')}>
                                <option value="">{t('tousLesNiveaux')}</option>
                                {filteredNiveaux.map((n: NiveauOption) => (
                                    <option key={n.id} value={n.id}>{n.nom} ({n.code})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>{t('competencesVisees')}</label>
                        <input type="text" value={competencesVisees} onChange={(e) => setCompetencesVisees(e.target.value)} className={inputClass('competencesVisees')} placeholder="Comp1, Comp2, Comp3" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {t('objectifsGeneraux')}
                    </h3>
                    <SectionSeparator />
                    <div>
                        <textarea value={objectifsGeneraux} onChange={(e) => setObjectifsGeneraux(e.target.value)} rows={2} className={inputClass('objectifsGeneraux')} placeholder={t('objectifsGeneraux')} />
                    </div>
                </div>
            </form>
        </CustomModal>
    );
}
