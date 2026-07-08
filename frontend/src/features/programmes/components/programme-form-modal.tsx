import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Save } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useAnneeScolaireActive } from '@/features/annees-scolaires/hooks/use-annees-scolaires';
import type { ProgrammePedagogique, CreerProgrammeDto, ProgrammeType } from '../types/programme.types';

interface ProgrammeFormModalProps {
    open: boolean;
    programme: ProgrammePedagogique | null;
    onClose: () => void;
    onSubmit: (dto: CreerProgrammeDto) => Promise<void>;
}

interface CycleOption { id: string; nom: string; code: string; }
interface NiveauOption { id: string; nom: string; code: string; cycleId: string; }
interface PeriodeOption { id: string; nom: string; code: string; }

export function ProgrammeFormModal({ open, programme, onClose, onSubmit }: ProgrammeFormModalProps) {
    const { t } = useTranslation('programmes');
    const isEditMode = !!programme;

    const [nom, setNom] = useState('');
    const [description, setDescription] = useState('');
    const [code, setCode] = useState('');
    const [type, setType] = useState<ProgrammeType>('NIVEAU');
    const [cycleId, setCycleId] = useState('');
    const [niveauId, setNiveauId] = useState('');
    const [nbHeuresHebdo, setNbHeuresHebdo] = useState(0);
    const [objectifsGeneraux, setObjectifsGeneraux] = useState('');
    const [competencesVisees, setCompetencesVisees] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [periodeId, setPeriodeId] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setNom(programme?.nom || '');
            setDescription(programme?.description || '');
            setCode(programme?.code || '');
            setType(programme?.type || 'NIVEAU');
            setCycleId(programme?.cycleId || '');
            setNiveauId(programme?.niveauId || '');
            setNbHeuresHebdo(programme?.nbHeuresHebdo || 0);
            setObjectifsGeneraux(programme?.objectifsGeneraux || '');
            setCompetencesVisees(programme?.competencesVisees?.join(', ') || '');
            setDateDebut(programme?.dateDebut || '');
            setDateFin(programme?.dateFin || '');
            setPeriodeId(programme?.periodeId || '');
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

    const { data: cycles } = useQuery({
        queryKey: ['cycles', 'all'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: CycleOption[] }>('/api/cycles/all');
            return res.data || [];
        },
        staleTime: 10 * 60 * 1000,
    });

    const { data: niveaux } = useQuery({
        queryKey: ['niveaux', 'all'],
        queryFn: async () => {
            const res = await apiClient.get<{ data: NiveauOption[] }>('/api/niveaux/all');
            return res.data || [];
        },
        staleTime: 10 * 60 * 1000,
    });

    const { data: anneeActive } = useAnneeScolaireActive();

    const { data: periodes } = useQuery({
        queryKey: ['periodes', 'all', anneeActive?.id],
        queryFn: async () => {
            const res = await apiClient.get<PeriodeOption[]>('/api/periodes', { anneeId: anneeActive?.id });
            return res.data || [];
        },
        enabled: !!anneeActive?.id,
        staleTime: 10 * 60 * 1000,
    });

    const filteredNiveaux = niveaux?.filter((n) => !cycleId || n.cycleId === cycleId) || [];

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!nom.trim()) newErrors.nom = 'Le nom est requis';
        if (!code.trim()) newErrors.code = 'Le code est requis';
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
                cycleId: cycleId || null,
                niveauId: niveauId || null,
                nbHeuresHebdo: nbHeuresHebdo || 0,
                objectifsGeneraux: objectifsGeneraux || undefined,
                competencesVisees: competencesVisees ? competencesVisees.split(',').map(s => s.trim()).filter(Boolean) : undefined,
                dateDebut: dateDebut || undefined,
                dateFin: dateFin || undefined,
                periodeId: periodeId || null,
            });
            onClose();
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde du programme');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = (field: string) =>
        `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent ${
            errors[field] ? 'border-red-500' : 'border-gray-300'
        }`;

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title={isEditMode ? t('modifierProgramme') : t('nouveauProgramme')}
            description="Définissez le programme pédagogique, son cycle, ses matières"
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
                        icon={<Save className="h-4 w-4" />}
                    >
                        {isEditMode ? t('enregistrer') : t('creer')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('nom')} <span className="text-red-500">*</span></label>
                        <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} className={inputClass('nom')} placeholder="Ex: Programme 6ème" autoFocus />
                        {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('code')} <span className="text-red-500">*</span></label>
                        <input type="text" value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} className={`${inputClass('code')} font-mono`} placeholder="prog_6e_2024" />
                        {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                        {!isEditMode && <p className="text-xs text-gray-500 mt-1">Généré auto si vide</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('type')}</label>
                        <select value={type} onChange={(e) => setType(e.target.value as ProgrammeType)} className={inputClass('type')}>
                            <option value="NIVEAU">{t('programmeType.NIVEAU')}</option>
                            <option value="CYCLE">{t('programmeType.CYCLE')}</option>
                            <option value="PERSONNALISE">{t('programmeType.PERSONNALISE')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('cycle')}</label>
                        <select value={cycleId} onChange={(e) => { setCycleId(e.target.value); setNiveauId(''); }} className={inputClass('cycleId')}>
                            <option value="">{t('tousLesCycles')}</option>
                            {cycles?.map((c) => (
                                <option key={c.id} value={c.id}>{c.nom}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('niveau')}</label>
                        <select value={niveauId} onChange={(e) => setNiveauId(e.target.value)} className={inputClass('niveauId')}>
                            <option value="">{t('tousLesNiveaux')}</option>
                            {filteredNiveaux.map((n) => (
                                <option key={n.id} value={n.id}>{n.nom} ({n.code})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('nbHeuresHebdo')}</label>
                    <input type="number" min={0} max={60} value={nbHeuresHebdo} onChange={(e) => setNbHeuresHebdo(Number(e.target.value))} className={inputClass('nbHeuresHebdo')} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('objectifsGeneraux')}</label>
                    <textarea value={objectifsGeneraux} onChange={(e) => setObjectifsGeneraux(e.target.value)} rows={2} className={inputClass('objectifsGeneraux')} placeholder="Objectifs pédagogiques généraux du programme..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('dateDebut')}</label>
                        <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className={inputClass('dateDebut')} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('dateFin')}</label>
                        <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className={inputClass('dateFin')} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('periode')}</label>
                        <select value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} className={inputClass('periodeId')}>
                            <option value="">{t('aucunePeriode')}</option>
                            {periodes?.map((p) => (
                                <option key={p.id} value={p.id}>{p.nom}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('competencesVisees')}</label>
                        <input type="text" value={competencesVisees} onChange={(e) => setCompetencesVisees(e.target.value)} className={inputClass('competencesVisees')} placeholder="Ex: Comp1, Comp2, Comp3" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass('description')} placeholder="Description du programme..." />
                </div>
            </form>
        </CustomModal>
    );
}
