import { useState } from 'react';
import { GraduationCap, Building2, CheckCircle2 } from 'lucide-react';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useModifierClasse } from '@/features/classes/hooks/use-classes';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import type { Classe } from '@/features/classes/types/classe.types';

interface AssignerClasseModalProps {
    salleId: string;
    salleNom: string;
    onClose: () => void;
}

export function AssignerClasseModal({ salleId, salleNom, onClose }: AssignerClasseModalProps) {
    const modifierClasse = useModifierClasse();

    const { data: classesData } = useClasses({ limit: 500, actif: true });

    const [selectedClasseId, setSelectedClasseId] = useState('');

    const classes = classesData?.items || [];
    const classesSansSalle = classes.filter((c: Classe) => !c.sallePrincipaleId);

    const handleConfirm = async () => {
        if (!selectedClasseId) return;
        try {
            await modifierClasse.mutateAsync({
                id: selectedClasseId,
                sallePrincipaleId: salleId,
            });
            onClose();
        } catch {
            // Handled by mutation
        }
    };

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onClose(); }}
            title="Assigner une classe"
            description={`Salle : ${salleNom}`}
            size="lg"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onClose}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={!selectedClasseId}
                        isLoading={modifierClasse.isPending}
                    >
                        Assigner la classe
                    </ElisaButton>
                </>
            }
        >
            <div className="space-y-6">
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-[var(--space-md)]">
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Salle sélectionnée
                    </p>
                    <p className="font-semibold text-[var(--color-text-primary)]">{salleNom}</p>
                </div>

                <div className="relative">
                    {classesSansSalle.length > 0 && (
                        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                            <p className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                {classesSansSalle.length} classe{classesSansSalle.length !== 1 ? 's' : ''} sans salle assignée
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <ElisaSelect
                        label="Choisir une classe"
                        value={selectedClasseId}
                        onValueChange={setSelectedClasseId}
                        placeholder="Sélectionner une classe"
                        required
                        options={classes.map((c: Classe) => ({
                            value: c.id,
                            label: `${c.nom} (${c.code})${c.sallePrincipaleId ? ` · Salle: ${c.salle?.nom || 'N/A'}` : ''}`,
                        }))}
                    />

                    {selectedClasseId && (
                        <div className="rounded-[var(--radius-md)] border border-[var(--color-dominant-600)]/30 bg-[var(--color-dominant-600)]/5 p-[var(--space-md)]">
                            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                {classes.find((c: Classe) => c.id === selectedClasseId)?.nom || ''}
                                {classes.find((c: Classe) => c.id === selectedClasseId)?.sallePrincipaleId && (
                                    <> · <span className="text-amber-600">Changement de salle</span></>
                                )}
                            </p>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                                Cette action modifiera la salle principale de la classe sélectionnée.
                            </p>
                        </div>
                    )}
                </div>

                {classes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p>Aucune classe disponible</p>
                    </div>
                )}
            </div>
        </CustomModal>
    );
}