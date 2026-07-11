import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, ArrowRight, Building2 } from 'lucide-react';
import { SalleSelect } from '@/features/salles/components/SalleSelect';
import { useModifierClasse } from '../hooks/use-classes';
import { useSalles } from '@/features/salles/hooks/use-salles';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { TypeSalle } from '@/features/salles/types/salle.types';
import type { Classe } from '@/features/classes/types/classe.types';

interface ChangerSalleModalProps {
    classe: Classe;
    onClose: () => void;
}

const typeSalleLabels: Record<TypeSalle, string> = {
    CLASSIQUE: 'Classique',
    LABORATOIRE: 'Laboratoire',
    INFORMATIQUE: 'Informatique',
    AMPHITHEATRE: 'Amphithéâtre',
    SPORT: 'Sport',
    MUSIQUE: 'Musique',
    ARTS: 'Arts',
    BIBLIOTHEQUE: 'Bibliothèque',
    ADMINISTRATION: 'Administration',
    AUTRE: 'Autre',
};

export function ChangerSalleModal({ classe, onClose }: ChangerSalleModalProps) {
    const { t } = useTranslation('classes');
    const modifierClasse = useModifierClasse();

    const { data: allSallesData, isLoading: loadingSalles } = useSalles({ limit: 100 });
    const allSalles = allSallesData?.data;

    const [selectedSalleId, setSelectedSalleId] = useState(classe.sallePrincipaleId || '');
    const [selectedSalle, setSelectedSalle] = useState<{ nom: string; capacite: number; typeSalle: string; equipements?: string[] } | null>(
        classe.salle || null
    );

    const handleChange = (value: string, salle?: any) => {
        setSelectedSalleId(value);
        setSelectedSalle(salle || null);
    };

    const handleConfirm = async () => {
        await modifierClasse.mutateAsync({
            id: classe.id,
            sallePrincipaleId: selectedSalleId || null,
        });
        onClose();
    };

    const currentSalle = classe.salle;
    const hasChanged = selectedSalleId !== (classe.sallePrincipaleId || '');

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onClose(); }}
            title="Changer la salle principale"
            description={`Classe : ${classe.nom} (${classe.code})`}
            size="lg"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onClose}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={!hasChanged}
                        isLoading={modifierClasse.isPending}
                    >
                        Confirmer le changement
                    </ElisaButton>
                </>
            }
        >
            <div className="space-y-6">
                {currentSalle && (
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-[var(--space-md)]">
                        <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Salle actuelle
                        </p>
                    <p className="font-semibold text-[var(--color-text-primary)]">{currentSalle.nom}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {currentSalle.capacite} places · {typeSalleLabels[currentSalle.typeSalle] || currentSalle.typeSalle}
                    </p>
                    </div>
                )}

                <div className="relative">
                    {currentSalle && (
                        <div className="absolute -left-1 -right-1 top-1/2 -translate-y-1/2 flex justify-center z-10">
                            <div className="rounded-full bg-[var(--color-dominant-600)] p-1.5 shadow-md">
                                <ArrowRight className="h-4 w-4 text-white" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-[var(--space-md)]">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Nouvelle salle
                    </p>
                    <SalleSelect
                        value={selectedSalleId}
                        onChange={handleChange}
                        salles={allSalles}
                        loading={loadingSalles}
                    />
                </div>

                {selectedSalle && hasChanged && (
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-dominant-600)]/30 bg-[var(--color-dominant-600)]/5 p-[var(--space-md)]">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                            {selectedSalle.nom} ({selectedSalle.capacite} places)
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                            Type : {typeSalleLabels[selectedSalle.typeSalle] || selectedSalle.typeSalle}
                            {selectedSalle.equipements && selectedSalle.equipements.length > 0 && (
                                <> · Équipements : {selectedSalle.equipements.join(', ')}</>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </CustomModal>
    );
}
