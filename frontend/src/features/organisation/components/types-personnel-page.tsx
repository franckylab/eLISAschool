import { UserCheck } from 'lucide-react';
import { NomenclatureCrudPage } from './nomenclature-crud-page';
import { NomenclatureFormModal } from './nomenclature-form-modal';
import {
    useTypesPersonnel, useCreerTypePersonnel,
    useModifierTypePersonnel, useSupprimerTypePersonnel,
} from '@/features/personnel/hooks/use-types-personnel';
import type { Column } from '@/components/ui/DataTable';
import { useTranslation } from 'react-i18next';

export function TypesPersonnelPage({ embedded }: { embedded?: boolean } = {}) {
    const { t } = useTranslation('organisation');

    const columns: Column<any>[] = [
        { key: 'code', header: t('code'), render: (tp) => <span className="font-mono text-xs bg-surface-alt border border-border px-2 py-0.5 rounded">{tp.code}</span> },
        { key: 'nom', header: t('nom') },
        { key: 'description', header: t('description'), render: (tp) => tp.description || '-' },
    ];

    return (
        <NomenclatureCrudPage
            tableId="types-personnel"
            titleKey="typesPersonnel"
            icon={UserCheck}
            permission="organisation:nomenclatures"
            embedded={embedded}
            columns={columns}
            useData={useTypesPersonnel}
            useCreate={useCreerTypePersonnel}
            useUpdate={useModifierTypePersonnel}
            useDelete={useSupprimerTypePersonnel}
            formComponent={({ initialData, onSuccess, onCancel }) => (
                <NomenclatureFormModal
                    open
                    onOpenChange={(v: boolean) => { if (!v) onCancel(); }}
                    initialData={initialData}
                    titleKey={initialData ? 'modifierTypePersonnel' : 'nouveauTypePersonnel'}
                    icon={UserCheck}
                    fields={[
                        { key: 'code', labelKey: 'code', required: true, span: 'col-span-1' },
                        { key: 'nom', labelKey: 'nom', required: true, span: 'col-span-1' },
                        { key: 'description', labelKey: 'description', required: false },
                    ]}
                    onSave={async (values: Record<string, unknown>) => {
                        if (initialData) {
                            await useModifierTypePersonnel().mutateAsync({ id: initialData.id, ...values });
                        } else {
                            await useCreerTypePersonnel().mutateAsync(values);
                        }
                        onSuccess();
                    }}
                />
            )}
        />
    );
}
