/**
 * ==================================
 * eLISAschool - Dropdown Salles (pour Emploi du temps)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Composant Select pour choisir une salle dans l'emploi du temps
 */

import { useSallesDisponibles } from '../hooks/use-salles';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { Loader2 } from 'lucide-react';

interface SalleSelectProps {
    value?: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
    capaciteMin?: number;
    typeSalle?: string;
    label?: string;
}

export function SalleSelect({
    value,
    onChange,
    disabled = false,
    required = false,
    capaciteMin,
    typeSalle,
    label = 'Salle',
}: SalleSelectProps) {
    const { data: salles, isLoading } = useSallesDisponibles(capaciteMin, typeSalle);

    const selectedSalle = salles?.find((s) => s.id === value);

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium">{label} {required && <span className="text-red-500">*</span>}</label>}
            {isLoading ? (
                <div className="flex items-center justify-center py-4 border rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Chargement...</span>
                </div>
            ) : (
                <ElisaSelect
                    value={value || ''}
                    onValueChange={onChange}
                    disabled={disabled}
                    placeholder="Sélectionner une salle"
                    options={salles?.map((salle) => ({
                        value: salle.id,
                        label: `${salle.nom} (${salle.capacite} places)`,
                    })) || []}
                />
            )}
            {selectedSalle && (
                <p className="text-xs text-gray-500">
                    Type: {selectedSalle.typeSalle}
                    {selectedSalle.equipements && selectedSalle.equipements.length > 0 && (
                        <>
                            {' '}
                            | Équipements: {selectedSalle.equipements.join(', ')}
                        </>
                    )}
                </p>
            )}
        </div>
    );
}
