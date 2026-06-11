/**
 * ==================================
 * eLISAschool - Modale Formulaire Élève
 * ==================================
 * Wrapper modale pour le formulaire élève
 */

import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { EleveForm } from './eleve-form';
import type { Eleve } from '../types/eleve.types';

interface EleveFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'creation' | 'edition';
    eleve?: Eleve;
}

export function EleveFormModal({ open, onOpenChange, mode, eleve }: EleveFormModalProps) {
    const { t } = useTranslation('eleves');

    const titre = mode === 'creation' ? t('formulaire.titreCreation') : t('formulaire.titreModification');

    const handleSuccess = () => {
        onOpenChange(false);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            titre={titre}
            size="2xl"
        >
            <EleveForm
                mode={mode}
                eleve={eleve}
                onSuccess={handleSuccess}
                onCancel={() => onOpenChange(false)}
            />
        </CustomModal>
    );
}
