import { Tag } from 'lucide-react';
import { NomenclatureCrudPage } from './nomenclature-crud-page';
import { NomenclatureFormModal } from './nomenclature-form-modal';
import {
    useUsagesUnite, useCreerUsageUnite,
    useModifierUsageUnite, useSupprimerUsageUnite,
} from '../hooks/use-usages-unite';
import type { UsageUnite } from '../types/organisation.types';
import type { Column } from '@/components/ui/DataTable';
import { useTranslation } from 'react-i18next';

export function UsagesUnitePage({ embedded }: { embedded?: boolean } = {}) {
    const { t } = useTranslation('organisation');

    const columns: Column<UsageUnite>[] = [
        { key: 'code', header: t('code'), render: (u) => <span className="font-mono text-xs bg-surface-alt border border-border px-2 py-0.5 rounded">{u.code}</span> },
        { key: 'label', header: t('label') },
        { key: 'description', header: t('description'), render: (u) => u.description || '-' },
    ];

    return (
        <NomenclatureCrudPage
            tableId="usages-unite"
            titleKey="usagesUnite"
            icon={Tag}
            permission="organisation:nomenclatures"
            embedded={embedded}
            columns={columns}
            useData={useUsagesUnite}
            useCreate={useCreerUsageUnite}
            useUpdate={useModifierUsageUnite}
            useDelete={useSupprimerUsageUnite}
            formComponent={({ initialData, onSuccess, onCancel }) => (
                <NomenclatureFormModal
                    open
                    onOpenChange={(v) => { if (!v) onCancel(); }}
                    initialData={initialData}
                    titleKey={initialData ? 'modifierUsage' : 'nouvelUsage'}
                    icon={Tag}
                    fields={[
                        { key: 'code', labelKey: 'code', required: true, span: 'col-span-1' },
                        { key: 'label', labelKey: 'label', required: true, span: 'col-span-1' },
                        { key: 'description', labelKey: 'description', required: false },
                    ]}
                    onSave={async (values) => {
                        if (initialData) {
                            await useModifierUsageUnite().mutateAsync({ id: initialData.id, ...values });
                        } else {
                            await useCreerUsageUnite().mutateAsync(values);
                        }
                        onSuccess();
                    }}
                />
            )}
        />
    );
}
