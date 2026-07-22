import { Briefcase } from 'lucide-react';
import { NomenclatureCrudPage } from './nomenclature-crud-page';
import { NomenclatureFormModal } from './nomenclature-form-modal';
import {
    useCategoriesPoste, useCreerCategoriePoste,
    useModifierCategoriePoste, useSupprimerCategoriePoste,
} from '../hooks/use-categories-poste';
import type { CategoriePoste } from '../types/organisation.types';
import type { Column } from '@/components/ui/DataTable';
import { useTranslation } from 'react-i18next';

export function CategoriesPostePage({ embedded }: { embedded?: boolean } = {}) {
    const { t } = useTranslation('organisation');

    const columns: Column<CategoriePoste>[] = [
        { key: 'code', header: t('code'), render: (c) => <span className="font-mono text-xs bg-surface-alt border border-border px-2 py-0.5 rounded">{c.code}</span> },
        { key: 'label', header: t('label') },
        { key: 'description', header: t('description'), render: (c) => c.description || '-' },
    ];

    return (
        <NomenclatureCrudPage
            tableId="categories-poste"
            titleKey="categoriesPoste"
            icon={Briefcase}
            permission="organisation:nomenclatures"
            embedded={embedded}
            columns={columns}
            useData={useCategoriesPoste}
            useCreate={useCreerCategoriePoste}
            useUpdate={useModifierCategoriePoste}
            useDelete={useSupprimerCategoriePoste}
            formComponent={({ initialData, onSuccess, onCancel }) => (
                <NomenclatureFormModal
                    open
                    onOpenChange={(v) => { if (!v) onCancel(); }}
                    initialData={initialData}
                    titleKey={initialData ? 'modifierCategorie' : 'nouvelleCategorie'}
                    icon={Briefcase}
                    fields={[
                        { key: 'code', labelKey: 'code', required: true, span: 'col-span-1' },
                        { key: 'label', labelKey: 'label', required: true, span: 'col-span-1' },
                        { key: 'description', labelKey: 'description', required: false },
                    ]}
                    onSave={async (values) => {
                        if (initialData) {
                            await useModifierCategoriePoste().mutateAsync({ id: initialData.id, ...values });
                        } else {
                            await useCreerCategoriePoste().mutateAsync(values);
                        }
                        onSuccess();
                    }}
                />
            )}
        />
    );
}
