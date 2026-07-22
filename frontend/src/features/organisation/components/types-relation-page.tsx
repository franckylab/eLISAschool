import { Network } from 'lucide-react';
import { NomenclatureCrudPage } from './nomenclature-crud-page';
import { NomenclatureFormModal } from './nomenclature-form-modal';
import {
    useTypesRelation, useCreerTypeRelation,
    useModifierTypeRelation, useSupprimerTypeRelation,
    type TypeRelationHierarchique,
} from '../hooks/use-types-relation';
import type { Column } from '@/components/ui/DataTable';
import { useTranslation } from 'react-i18next';

export function TypesRelationPage({ embedded }: { embedded?: boolean } = {}) {
    const { t } = useTranslation('organisation');

    const columns: Column<TypeRelationHierarchique>[] = [
        { key: 'code', header: t('code'), render: (r) => <span className="font-mono text-xs bg-surface-alt border border-border px-2 py-0.5 rounded">{r.code}</span> },
        { key: 'label', header: t('label') },
        { key: 'description', header: t('description'), render: (r) => r.description || '-' },
    ];

    return (
        <NomenclatureCrudPage
            embedded={embedded}
            tableId="types-relation"
            titleKey="typesRelation"
            icon={Network}
            permission="organisation:nomenclatures"
            columns={columns}
            useData={useTypesRelation}
            useCreate={useCreerTypeRelation}
            useUpdate={useModifierTypeRelation}
            useDelete={useSupprimerTypeRelation}
            formComponent={({ initialData, onSuccess, onCancel }) => (
                <NomenclatureFormModal
                    open
                    onOpenChange={(v) => { if (!v) onCancel(); }}
                    initialData={initialData}
                    titleKey={initialData ? 'modifierTypeRelation' : 'nouveauTypeRelation'}
                    icon={Network}
                    fields={[
                        { key: 'code', labelKey: 'code', required: true, span: 'col-span-1' },
                        { key: 'label', labelKey: 'label', required: true, span: 'col-span-1' },
                        { key: 'description', labelKey: 'description', required: false },
                    ]}
                    onSave={async (values) => {
                        if (initialData) {
                            await useModifierTypeRelation().mutateAsync({ id: initialData.id, ...values });
                        } else {
                            await useCreerTypeRelation().mutateAsync(values);
                        }
                        onSuccess();
                    }}
                />
            )}
        />
    );
}
