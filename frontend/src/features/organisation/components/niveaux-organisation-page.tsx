import { Layers } from 'lucide-react';
import { NomenclatureCrudPage } from './nomenclature-crud-page';
import { NomenclatureFormModal } from './nomenclature-form-modal';
import {
    useNiveauxOrganisation, useCreerNiveauOrganisation,
    useModifierNiveauOrganisation, useSupprimerNiveauOrganisation,
} from '../hooks/use-niveaux-organisation';
import type { NiveauOrganisation } from '../types/organisation.types';
import type { Column } from '@/components/ui/DataTable';
import { useTranslation } from 'react-i18next';

export function NiveauxOrganisationPage({ embedded }: { embedded?: boolean } = {}) {
    const { t } = useTranslation('organisation');

    const columns: Column<NiveauOrganisation>[] = [
        { key: 'niveau', header: t('niveau'), render: (n) => <span className="font-mono">{n.niveau}</span> },
        { key: 'label', header: t('label') },
        { key: 'description', header: t('description'), render: (n) => n.description || '-' },
    ];

    return (
        <NomenclatureCrudPage
            tableId="niveaux-organisation"
            titleKey="niveauxOrganisation"
            icon={Layers}
            permission="organisation:nomenclatures"
            embedded={embedded}
            columns={columns}
            useData={useNiveauxOrganisation}
            useCreate={useCreerNiveauOrganisation}
            useUpdate={useModifierNiveauOrganisation}
            useDelete={useSupprimerNiveauOrganisation}
            formComponent={({ initialData, onSuccess, onCancel }) => (
                <NomenclatureFormModal
                    open
                    onOpenChange={(v: boolean) => { if (!v) onCancel(); }}
                    initialData={initialData}
                    titleKey={initialData ? 'modifierNiveau' : 'nouveauNiveau'}
                    icon={Layers}
                    fields={[
                        { key: 'label', labelKey: 'label', required: true },
                        { key: 'niveau', labelKey: 'niveau', type: 'number', span: 'col-span-1' },
                        { key: 'description', labelKey: 'description', required: false },
                    ]}
                    onSave={async (values: Record<string, unknown>) => {
                        if (initialData) {
                            await useModifierNiveauOrganisation().mutateAsync({ id: initialData.id, ...values });
                        } else {
                            await useCreerNiveauOrganisation().mutateAsync(values);
                        }
                        onSuccess();
                    }}
                />
            )}
        />
    );
}
