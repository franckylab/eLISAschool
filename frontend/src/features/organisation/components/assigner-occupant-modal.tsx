import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus } from 'lucide-react';
import { useAssignerOccupant } from '../hooks/use-organisation';
import { assignerOccupantSchema } from '../types/organisation.zod';
import { BaseFormModal } from './base-form-modal';
import { PersonnelSearchField } from './personnel-search-field';
import type { Poste } from '../types/organisation.types';

interface PersonnelSearchResult {
    id: string;
    nom: string;
    prenom: string;
    matricule?: string;
    email?: string;
    poste?: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    poste: Poste;
}

export function AssignerOccupantModal({ open, onOpenChange, poste }: Props) {
    const { t } = useTranslation('organisation');
    const assigner = useAssignerOccupant();
    const [apiError, setApiError] = useState<string | null>(null);
    const [selectedPersonnel, setSelectedPersonnel] = useState<PersonnelSearchResult | null>(null);
    const [loading, setLoading] = useState(false);

    if (!poste) return null;

    const handleSubmit = async () => {
        if (!selectedPersonnel) return;
        setLoading(true);
        setApiError(null);
        try {
            const data = assignerOccupantSchema.parse({
                occupantId: selectedPersonnel.id,
                occupantNom: `${selectedPersonnel.prenom} ${selectedPersonnel.nom}`,
            });
            await assigner.mutateAsync({
                posteId: poste.id,
                occupantId: data.occupantId,
                occupantNom: data.occupantNom,
            });
            onOpenChange(false);
        } catch (err: any) {
            setApiError(err?.response?.data?.message || err?.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseFormModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('assignerOccupant')}
            icon={UserPlus}
            color="green"
            size="md"
            submitLabel={t('assigner')}
            loading={loading}
            disabled={!selectedPersonnel}
            onSubmit={handleSubmit}
            apiError={apiError}
        >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {t('poste')} : <span className="font-medium text-gray-900 dark:text-gray-100">{poste.intitulé}</span>
            </p>

            <PersonnelSearchField
                value={selectedPersonnel}
                onChange={setSelectedPersonnel}
                label={t('occupant')}
            />
        </BaseFormModal>
    );
}
