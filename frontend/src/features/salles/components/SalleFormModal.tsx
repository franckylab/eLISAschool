import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, Building2, Monitor, FlaskConical, BookOpen, Theater, Dumbbell, Music, Palette, Briefcase, HelpCircle, CheckCircle, Wrench, AlertCircle, Hash, FileText } from 'lucide-react';
import { useSalle, useCreerSalle, useModifierSalle } from '../hooks/use-salles';
import { TypeSalle, StatutSalle, CreerSalleDto } from '../types/salle.types';
import { CustomModal } from '@/components/modals/CustomModal';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';

interface SalleFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    salleId?: string;
    duplicateFromId?: string;
}

const TYPE_ICONS: Record<TypeSalle, React.ElementType> = {
    [TypeSalle.CLASSIQUE]: Building2,
    [TypeSalle.LABORATOIRE]: FlaskConical,
    [TypeSalle.INFORMATIQUE]: Monitor,
    [TypeSalle.AMPHITHEATRE]: Theater,
    [TypeSalle.SPORT]: Dumbbell,
    [TypeSalle.MUSIQUE]: Music,
    [TypeSalle.ARTS]: Palette,
    [TypeSalle.BIBLIOTHEQUE]: BookOpen,
    [TypeSalle.ADMINISTRATION]: Briefcase,
    [TypeSalle.AUTRE]: HelpCircle,
};

const STATUT_ICONS: Record<StatutSalle, React.ElementType> = {
    [StatutSalle.DISPONIBLE]: CheckCircle,
    [StatutSalle.EN_MAINTENANCE]: Wrench,
    [StatutSalle.INDISPONIBLE]: AlertCircle,
};

const STATUT_COLORS: Record<StatutSalle, string> = {
    [StatutSalle.DISPONIBLE]: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    [StatutSalle.EN_MAINTENANCE]: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    [StatutSalle.INDISPONIBLE]: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
};

const EQUIPEMENT_PRESETS = [
    'Projecteur', 'Climatisation', 'Chauffage', 'Tableau blanc',
    'Tableau interactif', 'Ordinateur', 'Sonorisation', 'Micro',
    'Wi-Fi', 'Prise réseau', 'Caméra', 'Store',
];

const CAPACITE_MIN = 1;
const CAPACITE_MAX = 1000;

const FORM_INIT = {
    nom: '',
    code: '',
    capacite: 30,
    localisation: '',
    typeSalle: TypeSalle.CLASSIQUE,
    statut: StatutSalle.DISPONIBLE,
    equipements: [] as string[],
    description: '',
};

export function SalleFormModal({ open, onOpenChange, salleId, duplicateFromId }: SalleFormModalProps) {
    const { t } = useTranslation('salles');
    const isEdit = !!salleId;
    const isDuplicate = !!duplicateFromId;
    const { data: salleData, isLoading: isLoadingData } = useSalle((salleId || duplicateFromId) || '');
    const creerMutation = useCreerSalle();
    const modifierMutation = useModifierSalle();

    const [formData, setFormData] = useState(FORM_INIT);
    const [newEquipement, setNewEquipement] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showConfirm, setShowConfirm] = useState(false);

    const capacityPercent = Math.min((formData.capacite / CAPACITE_MAX) * 100, 100);
    const TypeIcon = TYPE_ICONS[formData.typeSalle];
    const StatutIcon = STATUT_ICONS[formData.statut];

    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(formData) !== JSON.stringify(FORM_INIT),
        [formData],
    );

    useEffect(() => {
        if (salleData && (isEdit || isDuplicate)) {
            setFormData({
                nom: salleData.nom,
                code: salleData.code,
                capacite: salleData.capacite,
                localisation: salleData.localisation || '',
                typeSalle: salleData.typeSalle,
                statut: salleData.statut,
                equipements: salleData.equipements || [],
                description: salleData.description || '',
            });
        } else if (!salleData && open && !isEdit && !isDuplicate) {
            setFormData(FORM_INIT);
        }
        setErrors({});
    }, [salleData, isEdit, isDuplicate, open]);

    useEffect(() => {
        if (!open) {
            setFormData(FORM_INIT);
            setErrors({});
            setNewEquipement('');
        }
    }, [open]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const addEquipement = (equip: string) => {
        const trimmed = equip.trim();
        if (trimmed && !formData.equipements.includes(trimmed)) {
            handleChange('equipements', [...formData.equipements, trimmed]);
        }
        setNewEquipement('');
    };

    const removeEquipement = (equip: string) => {
        handleChange('equipements', formData.equipements.filter((e: string) => e !== equip));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEquipement(newEquipement);
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.nom.trim()) newErrors.nom = t('form.erreurNomRequis');
        if (!formData.code.trim()) newErrors.code = t('form.erreurCodeRequis');
        else if (formData.code.trim().length < 2) newErrors.code = t('form.erreurCodeMin');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        const keys = Object.keys(errors);
        if (keys.length > 0) {
            const el = document.querySelector(`[data-field="${keys[0]}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [errors]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const dto: CreerSalleDto = {
            nom: formData.nom.trim(),
            code: formData.code.trim(),
            capacite: formData.capacite,
            localisation: formData.localisation.trim() || undefined,
            typeSalle: formData.typeSalle,
            statut: formData.statut,
            equipements: formData.equipements.length > 0 ? formData.equipements : undefined,
            description: formData.description.trim() || undefined,
            disponible: formData.statut === StatutSalle.DISPONIBLE,
        };

        try {
            if (isEdit && salleId) {
                await modifierMutation.mutateAsync({ id: salleId, dto });
            } else {
                await creerMutation.mutateAsync(dto);
            }
            onOpenChange(false);
        } catch {
            // Handled by the hooks
        }
    };

    const isLoading = creerMutation.isPending || modifierMutation.isPending || isLoadingData;

    const handleOpenChange = (v: boolean) => {
        if (!v && hasUnsavedChanges) {
            setShowConfirm(true);
        } else {
            onOpenChange(v);
        }
    };

    const statutOptions = useMemo(() => Object.values(StatutSalle).map((v) => ({
        value: v,
        label: t(`form.statut${v.charAt(0) + v.slice(1).toLowerCase()}`),
    })), [t]);

    const typeOptions = useMemo(() => Object.values(TypeSalle).map((v) => ({
        value: v,
        label: t(v.toLowerCase()),
    })), [t]);

    const equipColors = useMemo(() => [
        'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
        'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
        'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
        'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    ], []);

    return (
        <>
            <CustomModal
                open={open}
                onOpenChange={handleOpenChange}
                title={isEdit ? t('modifierSalle') : isDuplicate ? t('dupliquerSalle') : t('creerSalle')}
                description={isEdit ? t('modifierSalleDesc') : isDuplicate ? t('dupliquerSalleDesc') : t('creerSalleDesc')}
                size="2xl"
                footer={
                    <>
                        <ElisaButton variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                            <X className="h-4 w-4 mr-2" />
                            {t('annuler')}
                        </ElisaButton>
                        <ElisaButton onClick={handleSubmit} disabled={isLoading || isLoadingData}>
                            {isLoading ? t('enregistrementEnCours') : t('enregistrer')}
                        </ElisaButton>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Section Identité */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                            <Hash className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                            {t('form.sectionIdentite')}
                        </h3>
                        <SectionSeparator />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2" data-field="code">
                                <label className="text-sm font-medium text-[var(--color-texte)]">
                                    {t('form.code')} <span className="text-red-500">*</span>
                                </label>
                                <ElisaInput
                                    value={formData.code}
                                    onChange={(e) => { handleChange('code', e.target.value.toUpperCase()); }}
                                    placeholder={t('form.codePlaceholder')}
                                    required
                                    disabled={isLoading || isEdit}
                                    error={errors.code}
                                    autoFocus
                                />
                                <p className="text-xs text-[var(--color-texte-muted)]">{t('form.codeHelper')}</p>
                            </div>
                            <div className="space-y-2" data-field="nom">
                                <label className="text-sm font-medium text-[var(--color-texte)]">
                                    {t('form.nom')} <span className="text-red-500">*</span>
                                </label>
                                <ElisaInput
                                    value={formData.nom}
                                    onChange={(e) => handleChange('nom', e.target.value)}
                                    placeholder={t('form.nomPlaceholder')}
                                    required
                                    disabled={isLoading}
                                    error={errors.nom}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section Caractéristiques */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                            {t('form.sectionCaracteristiques')}
                        </h3>
                        <SectionSeparator />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--color-texte)]">{t('form.typeSalle')}</label>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[var(--color-bg-tertiaire)]">
                                        <TypeIcon className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                                    </div>
                                    <ElisaSelect
                                        value={formData.typeSalle}
                                        onValueChange={(v) => handleChange('typeSalle', v as TypeSalle)}
                                        disabled={isLoading}
                                        className="flex-1"
                                        options={typeOptions}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--color-texte)]">{t('form.capacite')}</label>
                                <ElisaInput
                                    type="number"
                                    min={CAPACITE_MIN}
                                    max={CAPACITE_MAX}
                                    value={formData.capacite}
                                    onChange={(e) => handleChange('capacite', Math.max(CAPACITE_MIN, Math.min(CAPACITE_MAX, parseInt(e.target.value) || CAPACITE_MIN)))}
                                    disabled={isLoading}
                                />
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-tertiaire)] overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                                capacityPercent > 80 ? 'bg-red-400' :
                                                capacityPercent > 50 ? 'bg-amber-400' :
                                                'bg-emerald-400'
                                            }`}
                                            style={{ width: `${capacityPercent}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-[var(--color-texte-muted)] font-medium">{t('form.capaciteHelper', { count: formData.capacite, max: CAPACITE_MAX })}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-[var(--color-texte)]">{t('form.localisation')}</label>
                            <ElisaInput
                                value={formData.localisation}
                                onChange={(e) => handleChange('localisation', e.target.value)}
                                placeholder={t('form.localisationPlaceholder')}
                                disabled={isLoading}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Section Équipements */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                            <Monitor className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                            {t('form.sectionEquipements')}
                        </h3>
                        <SectionSeparator />
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={newEquipement}
                                    onChange={(e) => setNewEquipement(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={t('form.nouvelEquipementPlaceholder')}
                                    disabled={isLoading}
                                    list="equipement-suggestions"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-bordure)] bg-[var(--color-bg-secondaire)] focus:bg-[var(--color-bg)] focus:border-[var(--color-dominant-400)] focus:ring-2 focus:ring-[var(--color-dominant-100)] transition-all outline-none"
                                />
                                <datalist id="equipement-suggestions">
                                    {EQUIPEMENT_PRESETS.filter(e => !formData.equipements.includes(e)).map(e => (
                                        <option key={e} value={e} />
                                    ))}
                                </datalist>
                            </div>
                            <ElisaButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addEquipement(newEquipement)}
                                disabled={!newEquipement.trim() || isLoading}
                                icon={<Plus className="h-4 w-4" />}
                            >
                                {t('form.ajouterEquipement')}
                            </ElisaButton>
                        </div>
                        {formData.equipements.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {formData.equipements.map((equip: string) => {
                                    const colorIdx = formData.equipements.indexOf(equip) % equipColors.length;
                                    return (
                                        <span
                                            key={equip}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${equipColors[colorIdx]}`}
                                        >
                                            {equip}
                                            <button
                                                type="button"
                                                onClick={() => removeEquipement(equip)}
                                                disabled={isLoading}
                                                className="ml-0.5 hover:opacity-70 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-[var(--color-texte-muted)] italic">{t('form.aucunEquipement')}</p>
                        )}
                    </div>

                    {/* Section Statut */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                            {t('form.sectionStatut')}
                        </h3>
                        <SectionSeparator />
                        <div className="space-y-3">
                            <ElisaSelect
                                value={formData.statut}
                                onValueChange={(v) => handleChange('statut', v as StatutSalle)}
                                disabled={isLoading}
                                options={statutOptions}
                            />
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${STATUT_COLORS[formData.statut]}`}>
                                <StatutIcon className="h-4 w-4 flex-shrink-0" />
                                <span>{t(`form.statut${formData.statut.charAt(0) + formData.statut.slice(1).toLowerCase()}Desc`)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Section Description */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                            <FileText className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                            {t('form.sectionDescription')}
                        </h3>
                        <SectionSeparator />
                        <textarea
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-bordure)] bg-[var(--color-bg-secondaire)] focus:bg-[var(--color-bg)] focus:border-[var(--color-dominant-400)] focus:ring-2 focus:ring-[var(--color-dominant-100)] transition-all outline-none resize-none"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder={t('form.descriptionPlaceholder')}
                            rows={3}
                            disabled={isLoading}
                        />
                    </div>
                </form>
            </CustomModal>

            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                title={t('confirmerSuppression')}
                description={t('perteDonneesDescription', { ns: 'common' })}
                confirmText={t('confirmer', { ns: 'common' })}
                variant="warning"
                onConfirm={() => { setShowConfirm(false); onOpenChange(false); }}
            />
        </>
    );
}
