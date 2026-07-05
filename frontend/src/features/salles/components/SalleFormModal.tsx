import { useState, useEffect } from 'react';
import { useSalle, useCreerSalle, useModifierSalle } from '../hooks/use-salles';
import { TypeSalle, StatutSalle, CreerSalleDto } from '../types/salle.types';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import {
    Save, X, Plus, Building2,
    Monitor, FlaskConical, BookOpen,
    Theater, Dumbbell, Music, Palette,
    Briefcase, HelpCircle, CheckCircle,
    Wrench, AlertCircle,
} from 'lucide-react';

interface SalleFormModalProps {
    open: boolean;
    onClose: () => void;
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
    [StatutSalle.DISPONIBLE]: 'bg-green-50 text-green-700 border-green-200',
    [StatutSalle.EN_MAINTENANCE]: 'bg-amber-50 text-amber-700 border-amber-200',
    [StatutSalle.INDISPONIBLE]: 'bg-red-50 text-red-700 border-red-200',
};

const TYPE_LABELS: Record<TypeSalle, string> = {
    [TypeSalle.CLASSIQUE]: 'Classique',
    [TypeSalle.LABORATOIRE]: 'Laboratoire',
    [TypeSalle.INFORMATIQUE]: 'Informatique',
    [TypeSalle.AMPHITHEATRE]: 'Amphithéâtre',
    [TypeSalle.SPORT]: 'Sport',
    [TypeSalle.MUSIQUE]: 'Musique',
    [TypeSalle.ARTS]: 'Arts',
    [TypeSalle.BIBLIOTHEQUE]: 'Bibliothèque',
    [TypeSalle.ADMINISTRATION]: 'Administration',
    [TypeSalle.AUTRE]: 'Autre',
};

const EQUIPEMENT_PRESETS = [
    'Projecteur', 'Climatisation', 'Chauffage', 'Tableau blanc',
    'Tableau interactif', 'Ordinateur', 'Sonorisation', 'Micro',
    'Wi-Fi', 'Prise réseau', 'Caméra', 'Store',
];

const CAPACITE_MIN = 1;
const CAPACITE_MAX = 1000;

function getStatutDescription(statut: StatutSalle): string {
    switch (statut) {
        case StatutSalle.DISPONIBLE: return 'Visible et disponible pour les réservations.';
        case StatutSalle.EN_MAINTENANCE: return 'Temporairement indisponible (maintenance en cours).';
        case StatutSalle.INDISPONIBLE: return 'Masquée et non disponible pour les réservations.';
    }
}

export function SalleFormModal({ open, onClose, salleId, duplicateFromId }: SalleFormModalProps) {
    const isEdit = !!salleId;
    const isDuplicate = !!duplicateFromId;
    const { data: salleData, isLoading: isLoadingData } = useSalle((salleId || duplicateFromId) || '');
    const creerMutation = useCreerSalle();
    const modifierMutation = useModifierSalle();

    const [nom, setNom] = useState('');
    const [code, setCode] = useState('');
    const [capacite, setCapacite] = useState(30);
    const [localisation, setLocalisation] = useState('');
    const [typeSalle, setTypeSalle] = useState<TypeSalle>(TypeSalle.CLASSIQUE);
    const [statut, setStatut] = useState<StatutSalle>(StatutSalle.DISPONIBLE);
    const [equipementList, setEquipementList] = useState<string[]>([]);
    const [newEquipement, setNewEquipement] = useState('');
    const [description, setDescription] = useState('');
    const [errors, setErrors] = useState<{ nom?: string; code?: string }>({});

    const capacityPercent = Math.min((capacite / CAPACITE_MAX) * 100, 100);
    const TypeIcon = TYPE_ICONS[typeSalle];
    const StatutIcon = STATUT_ICONS[statut];

    useEffect(() => {
        if (salleData && (isEdit || isDuplicate)) {
            setNom(salleData.nom);
            setCode(salleData.code);
            setCapacite(salleData.capacite);
            setLocalisation(salleData.localisation || '');
            setTypeSalle(salleData.typeSalle);
            setStatut(salleData.statut);
            setEquipementList(salleData.equipements || []);
            setDescription(salleData.description || '');
        } else if (!isEdit && !isDuplicate && open) {
            setNom('');
            setCode('');
            setCapacite(30);
            setLocalisation('');
            setTypeSalle(TypeSalle.CLASSIQUE);
            setStatut(StatutSalle.DISPONIBLE);
            setEquipementList([]);
            setNewEquipement('');
            setDescription('');
            setErrors({});
        }
    }, [salleData, isEdit, isDuplicate, open]);

    const addEquipement = (equip: string) => {
        const trimmed = equip.trim();
        if (trimmed && !equipementList.includes(trimmed)) {
            setEquipementList(prev => [...prev, trimmed]);
        }
        setNewEquipement('');
    };

    const removeEquipement = (equip: string) => {
        setEquipementList(prev => prev.filter(e => e !== equip));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEquipement(newEquipement);
        }
    };

    const validate = (): boolean => {
        const newErrors: { nom?: string; code?: string } = {};
        if (!nom.trim()) newErrors.nom = 'Le nom est requis';
        if (!code.trim()) newErrors.code = 'Le code est requis';
        else if (code.trim().length < 2) newErrors.code = 'Minimum 2 caractères';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const dto: CreerSalleDto = {
            nom: nom.trim(),
            code: code.trim(),
            capacite,
            localisation: localisation.trim() || undefined,
            typeSalle,
            statut,
            equipements: equipementList.length > 0 ? equipementList : undefined,
            description: description.trim() || undefined,
            disponible: statut === StatutSalle.DISPONIBLE,
        };

        try {
            if (isEdit && salleId) {
                await modifierMutation.mutateAsync({ id: salleId, dto });
            } else {
                await creerMutation.mutateAsync(dto);
            }
            onClose();
        } catch {
            // Handled by the hooks
        }
    };

    const isLoading = creerMutation.isPending || modifierMutation.isPending || isLoadingData;

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title={isEdit ? 'Modifier la salle' : isDuplicate ? 'Dupliquer la salle' : 'Créer une salle'}
            description={isEdit
                ? 'Modifiez les informations de la salle'
                : isDuplicate
                    ? 'Créez une nouvelle salle à partir des informations existantes'
                    : 'Ajoutez une nouvelle salle à votre établissement'
            }
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onClose} disabled={isLoading}>
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                    </ElisaButton>
                    <ElisaButton onClick={handleSubmit} disabled={isLoading || isLoadingData}>
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
                {/* Section Identité */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Identité</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Code <span className="text-red-500">*</span>
                            </label>
                            <ElisaInput
                                value={code}
                                onChange={(e) => { setCode(e.target.value.toUpperCase()); setErrors(prev => ({ ...prev, code: undefined })); }}
                                placeholder="S101"
                                required
                                disabled={isLoading || isEdit}
                                error={errors.code}
                            />
                            <p className="text-xs text-gray-400">Unique, ex: S101, LABO_CHIM</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Nom <span className="text-red-500">*</span>
                            </label>
                            <ElisaInput
                                value={nom}
                                onChange={(e) => { setNom(e.target.value); setErrors(prev => ({ ...prev, nom: undefined })); }}
                                placeholder="Salle 101"
                                required
                                disabled={isLoading}
                                error={errors.nom}
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Section Caractéristiques */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Caractéristiques</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Type de salle</label>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gray-100">
                                    <TypeIcon className="h-5 w-5 text-gray-600" />
                                </div>
                                <ElisaSelect
                                    value={typeSalle}
                                    onValueChange={(v) => setTypeSalle(v as TypeSalle)}
                                    disabled={isLoading}
                                    className="flex-1"
                                    options={Object.values(TypeSalle).map((v) => ({
                                        value: v,
                                        label: TYPE_LABELS[v] || v,
                                    }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Capacité</label>
                            <ElisaInput
                                type="number"
                                min={CAPACITE_MIN}
                                max={CAPACITE_MAX}
                                value={capacite}
                                onChange={(e) => setCapacite(Math.max(CAPACITE_MIN, Math.min(CAPACITE_MAX, parseInt(e.target.value) || CAPACITE_MIN)))}
                                disabled={isLoading}
                            />
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${
                                            capacityPercent > 80 ? 'bg-red-400' :
                                            capacityPercent > 50 ? 'bg-amber-400' :
                                            'bg-emerald-400'
                                        }`}
                                        style={{ width: `${capacityPercent}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium">{capacite}/{CAPACITE_MAX}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="text-sm font-medium text-gray-700">Localisation</label>
                        <ElisaInput
                            value={localisation}
                            onChange={(e) => setLocalisation(e.target.value)}
                            placeholder="Bâtiment A, 1er étage"
                            disabled={isLoading}
                            className="mt-1"
                        />
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Section Équipements */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Équipements</h4>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={newEquipement}
                                onChange={(e) => setNewEquipement(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ajouter un équipement..."
                                disabled={isLoading}
                                list="equipement-suggestions"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            />
                            <datalist id="equipement-suggestions">
                                {EQUIPEMENT_PRESETS.filter(e => !equipementList.includes(e)).map(e => (
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
                            Ajouter
                        </ElisaButton>
                    </div>
                    {equipementList.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {equipementList.map((equip) => {
                                const colors = [
                                    'bg-blue-50 text-blue-700 border-blue-200',
                                    'bg-green-50 text-green-700 border-green-200',
                                    'bg-purple-50 text-purple-700 border-purple-200',
                                    'bg-amber-50 text-amber-700 border-amber-200',
                                    'bg-pink-50 text-pink-700 border-pink-200',
                                    'bg-cyan-50 text-cyan-700 border-cyan-200',
                                    'bg-indigo-50 text-indigo-700 border-indigo-200',
                                ];
                                const colorIdx = equipementList.indexOf(equip) % colors.length;
                                return (
                                    <span
                                        key={equip}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${colors[colorIdx]}`}
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
                        <p className="text-xs text-gray-400 italic">Aucun équipement ajouté</p>
                    )}
                </div>

                <hr className="border-gray-100" />

                {/* Section Statut */}
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Statut</h4>
                    <div className="space-y-3">
                        <ElisaSelect
                            value={statut}
                            onValueChange={(v) => setStatut(v as StatutSalle)}
                            disabled={isLoading}
                            options={Object.values(StatutSalle).map((v) => {
                                const Icon = STATUT_ICONS[v];
                                return {
                                    value: v,
                                    label: v === StatutSalle.DISPONIBLE ? 'Disponible'
                                        : v === StatutSalle.EN_MAINTENANCE ? 'En maintenance'
                                        : 'Indisponible',
                                };
                            })}
                        />
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${STATUT_COLORS[statut]}`}>
                            <StatutIcon className="h-4 w-4 flex-shrink-0" />
                            <span>{getStatutDescription(statut)}</span>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description optionnelle de la salle..."
                        rows={3}
                        disabled={isLoading}
                    />
                </div>
            </form>
        </CustomModal>
    );
}
