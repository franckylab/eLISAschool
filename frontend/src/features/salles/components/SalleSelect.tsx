/**
 * ==================================
 * eLISAschool - Dropdown Salles (pour Emploi du temps et formulaires)
 * ==================================
 * Version: 1.1.0
 * Auteur: franck arlos chendjou
 * 
 * Composant Select pour choisir une salle
 * - Par défaut charge les salles disponibles depuis l'API
 * - Peut recevoir une liste pré-chargée via la prop `salles`
 */

import { useSallesDisponibles } from '../hooks/use-salles';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { Loader2 } from 'lucide-react';
import type { Salle } from '../types/salle.types';

interface SalleSelectProps {
    value?: string;
    onChange: (value: string, salle?: Salle) => void;
    disabled?: boolean;
    required?: boolean;
    capaciteMin?: number;
    typeSalle?: string;
    label?: string;
    /** Liste pré-chargée de salles (remplace le fetch interne si fourni) */
    salles?: Salle[];
    loading?: boolean;
}

export function SalleSelect({
    value,
    onChange,
    disabled = false,
    required = false,
    capaciteMin,
    typeSalle,
    label = 'Salle',
    salles: externalSalles,
    loading: externalLoading,
}: SalleSelectProps) {
    const { data: fetchedSalles, isLoading: fetching } = useSallesDisponibles(
        externalSalles ? undefined : capaciteMin,
        externalSalles ? undefined : typeSalle,
    );

    const salles = externalSalles ?? fetchedSalles;
    const isLoading = externalLoading ?? fetching;

    const selectedSalle = salles?.find((s) => s.id === value);

    const handleChange = (newValue: string) => {
        const salle = salles?.find((s) => s.id === newValue);
        onChange(newValue, salle);
    };

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
                    onValueChange={handleChange}
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
