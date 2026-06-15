/**
 * ==================================
 * eLISAschool - Formulaire Salle (Modal)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Modal de création et édition de salle
 */

import { useState, useEffect } from 'react';
import { useSalle, useCreerSalle, useModifierSalle } from '../hooks/use-salles';
import { TypeSalle, StatutSalle, CreerSalleDto } from '../types/salle.types';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { Save, X } from 'lucide-react';

interface SalleFormModalProps {
    open: boolean;
    onClose: () => void;
    salleId?: string;
}

export function SalleFormModal({ open, onClose, salleId }: SalleFormModalProps) {
    const isEdit = !!salleId;
    
    // Données
    const { data: salleData, isLoading: isLoadingData } = useSalle(salleId || '');
    const creerMutation = useCreerSalle();
    const modifierMutation = useModifierSalle();

    // State du formulaire
    const [nom, setNom] = useState('');
    const [code, setCode] = useState('');
    const [capacite, setCapacite] = useState(30);
    const [localisation, setLocalisation] = useState('');
    const [typeSalle, setTypeSalle] = useState<TypeSalle>(TypeSalle.CLASSIQUE);
    const [statut, setStatut] = useState<StatutSalle>(StatutSalle.DISPONIBLE);
    const [equipements, setEquipements] = useState('');
    const [description, setDescription] = useState('');

    // Initialiser le formulaire en mode édition
    useEffect(() => {
        if (salleData && isEdit) {
            setNom(salleData.nom);
            setCode(salleData.code);
            setCapacite(salleData.capacite);
            setLocalisation(salleData.localisation || '');
            setTypeSalle(salleData.typeSalle);
            setStatut(salleData.statut);
            setEquipements(salleData.equipements?.join(', ') || '');
            setDescription(salleData.description || '');
        } else if (!isEdit) {
            // Reset en mode création
            setNom('');
            setCode('');
            setCapacite(30);
            setLocalisation('');
            setTypeSalle(TypeSalle.CLASSIQUE);
            setStatut(StatutSalle.DISPONIBLE);
            setEquipements('');
            setDescription('');
        }
    }, [salleData, isEdit, open]);

    // Soumission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nom.trim() || !code.trim()) {
            return;
        }

        const dto: CreerSalleDto = {
            nom: nom.trim(),
            code: code.trim(),
            capacite,
            localisation: localisation.trim() || undefined,
            typeSalle,
            statut,
            equipements: equipements
                ? equipements.split(',').map(e => e.trim()).filter(Boolean)
                : undefined,
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
        } catch (error) {
            // Erreur déjà gérée dans le hook
        }
    };

    const isLoading = creerMutation.isPending || modifierMutation.isPending || isLoadingData;

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title={isEdit ? 'Modifier la salle' : 'Créer une salle'}
            description={isEdit ? 'Modifiez les informations de la salle' : 'Ajoutez une nouvelle salle à l\'établissement'}
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onClose} disabled={isLoading}>
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                    </ElisaButton>
                    <ElisaButton onClick={handleSubmit} disabled={isLoading}>
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                {/* Code et Nom */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Code <span className="text-red-500">*</span>
                        </label>
                        <ElisaInput
                            value={code}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
                            placeholder="S101"
                            required
                            disabled={isLoading || isEdit}
                        />
                        <p className="text-xs text-gray-500">
                            Code unique (ex: S101, LABO_CHIM)
                        </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Nom <span className="text-red-500">*</span>
                        </label>
                        <ElisaInput
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            placeholder="Salle 101"
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Type et Capacité */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type de salle</label>
                        <ElisaSelect
                            value={typeSalle}
                            onValueChange={(v: string) => setTypeSalle(v as TypeSalle)}
                            disabled={isLoading}
                            options={Object.values(TypeSalle).map((v) => ({
                                value: v,
                                label: v.charAt(0).toUpperCase() + v.slice(1).toLowerCase(),
                            }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Capacité</label>
                        <ElisaInput
                            type="number"
                            min="1"
                            max="1000"
                            value={capacite}
                            onChange={(e) => setCapacite(parseInt(e.target.value) || 1)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Localisation et Statut */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Localisation</label>
                        <ElisaInput
                            value={localisation}
                            onChange={(e) => setLocalisation(e.target.value)}
                            placeholder="Bâtiment A, 1er étage"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Statut</label>
                        <ElisaSelect
                            value={statut}
                            onValueChange={(v: string) => setStatut(v as StatutSalle)}
                            disabled={isLoading}
                            options={Object.values(StatutSalle).map((v) => ({
                                value: v,
                                label: v.charAt(0).toUpperCase() + v.slice(1).toLowerCase().replace('_', ' '),
                            }))}
                        />
                    </div>
                </div>

                {/* Équipements */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Équipements</label>
                    <ElisaInput
                        value={equipements}
                        onChange={(e) => setEquipements(e.target.value)}
                        placeholder="projecteur, clim, ordinateurs (séparés par des virgules)"
                        disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500">
                        Séparez les équipements par des virgules
                    </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
