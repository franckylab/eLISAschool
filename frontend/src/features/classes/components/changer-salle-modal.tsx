/**
 * ==================================
 * eLISAschool - Modal Changer Salle
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, ArrowRight, Building2 } from 'lucide-react';
import { SalleSelect } from '@/features/salles/components/SalleSelect';
import { useModifierClasse } from '../hooks/use-classes';
import { useSalles } from '@/features/salles/hooks/use-salles';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { Salle, TypeSalle } from '@/features/salles/types/salle.types';
import type { Classe } from '@/features/classes/types/classe.types';

const TYPE_SALLE_KEYS: Record<TypeSalle, string> = {
    CLASSIQUE: 'classique',
    LABORATOIRE: 'laboratoire',
    INFORMATIQUE: 'informatique',
    AMPHITHEATRE: 'amphitheatre',
    SPORT: 'sport',
    MUSIQUE: 'musique',
    ARTS: 'arts',
    BIBLIOTHEQUE: 'bibliotheque',
    ADMINISTRATION: 'administration',
    AUTRE: 'autre',
};

interface ChangerSalleModalProps {
    classe: Classe;
    onClose: () => void;
}

export function ChangerSalleModal({ classe, onClose }: ChangerSalleModalProps) {
    const { t } = useTranslation(['classes', 'salles']);
    const modifierClasse = useModifierClasse();

    const { data: allSallesData, isLoading: loadingSalles } = useSalles({ limit: 100 });
    const allSalles = allSallesData?.data;

    const [selectedSalleId, setSelectedSalleId] = useState(classe.sallePrincipaleId || '');
    const [selectedSalle, setSelectedSalle] = useState<Salle | null>(
        classe.salle ? (classe.salle as Salle) : null
    );

    const handleChange = (value: string, salle?: Salle) => {
        setSelectedSalleId(value);
        setSelectedSalle(salle || null);
    };

    const handleConfirm = async () => {
        await modifierClasse.mutateAsync({
            id: classe.id,
            sallePrincipaleId: selectedSalleId || undefined,
        });
        onClose();
    };

    const currentSalle = classe.salle as (Salle & { typeSalle?: string }) | undefined;
    const hasChanged = selectedSalleId !== (classe.sallePrincipaleId || '');

    const labelTypeSalle = (type: string) =>
        t(`salles:${TYPE_SALLE_KEYS[type as TypeSalle] || 'autre'}`);

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onClose(); }}
            title={t('classes:changerSalle.titre')}
            description={t('classes:changerSalle.classeLabel', { nom: classe.nom, code: classe.code })}
            size="lg"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onClose}>
                        {t('classes:boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={!hasChanged}
                        isLoading={modifierClasse.isPending}
                    >
                        {t('classes:changerSalle.confirmer')}
                    </ElisaButton>
                </>
            }
        >
            <div className="space-y-6">
                {currentSalle && (
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-[var(--space-md)]">
                        <p className="text-sm font-medium text-secondary mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {t('classes:changerSalle.salleActuelle')}
                        </p>
                    <p className="font-semibold text-foreground">{currentSalle.nom}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('classes:changerSalle.places', { count: currentSalle.capacite })} · {labelTypeSalle(currentSalle.typeSalle)}
                    </p>
                    </div>
                )}

                <div className="relative">
                    {currentSalle && (
                        <div className="absolute -left-1 -right-1 top-1/2 -translate-y-1/2 flex justify-center z-10">
                            <div className="rounded-full bg-primary p-1.5 shadow-md">
                                <ArrowRight className="h-4 w-4 text-primary-foreground" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-[var(--space-md)]">
                    <p className="text-sm font-medium text-secondary mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {t('classes:changerSalle.nouvelleSalle')}
                    </p>
                    <SalleSelect
                        value={selectedSalleId}
                        onChange={handleChange}
                        salles={allSalles}
                        loading={loadingSalles}
                    />
                </div>

                {selectedSalle && hasChanged && (
                    <div className="rounded-[var(--radius-md)] border border-primary/30 bg-primary/5 p-[var(--space-md)]">
                        <p className="text-sm font-medium text-foreground mb-1">
                            {selectedSalle.nom} ({t('classes:changerSalle.places', { count: selectedSalle.capacite })})
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('classes:changerSalle.type')} : {labelTypeSalle(selectedSalle.typeSalle)}
                            {selectedSalle.equipements && selectedSalle.equipements.length > 0 && (
                                <> · {t('classes:changerSalle.equipements')} : {selectedSalle.equipements.join(', ')}</>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </CustomModal>
    );
}
