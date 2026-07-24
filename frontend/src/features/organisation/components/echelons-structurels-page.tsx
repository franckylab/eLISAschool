import { Layers } from 'lucide-react';
import { NomenclatureCrudPage } from './nomenclature-crud-page';
import { NomenclatureFormModal } from './nomenclature-form-modal';
import {
    useEchelonsStructurels, useCreerEchelonStructurel,
    useModifierEchelonStructurel, useSupprimerEchelonStructurel,
} from '../hooks/use-echelons-structurels';
import type { EchelonStructurel } from '../types/organisation.types';
import type { Column } from '@/components/ui/DataTable';
import { useTranslation } from 'react-i18next';

function EchelonFormWrapper({ initialData, onSuccess, onCancel }: { initialData?: EchelonStructurel | null; onSuccess: () => void; onCancel: () => void }) {
    const { mutateAsync: modifier } = useModifierEchelonStructurel();
    const { mutateAsync: creer } = useCreerEchelonStructurel();
    return (
        <NomenclatureFormModal
            open
            onOpenChange={(v: boolean) => { if (!v) onCancel(); }}
            initialData={initialData}
            titleKey={initialData ? 'modifierEchelon' : 'nouvelEchelon'}
            icon={Layers}
            fields={[
                { key: 'label', labelKey: 'label', required: true },
                { key: 'code', labelKey: 'code', required: true },
                { key: 'niveau', labelKey: 'niveau', type: 'number', span: 'col-span-1' },
                { key: 'description', labelKey: 'description', required: false },
            ]}
            onSave={async (values: Record<string, unknown>) => {
                if (initialData) {
                    await modifier({ id: initialData.id, ...values });
                } else {
                    await creer(values);
                }
                onSuccess();
            }}
        />
    );
}

export function EchelonsStructurelsPage({ embedded }: { embedded?: boolean } = {}) {
    const { t } = useTranslation('organisation');

    const columns: Column<EchelonStructurel>[] = [
        { key: 'niveau', header: t('niveau'), render: (n) => <span className="font-mono">{n.niveau}</span> },
        { key: 'code', header: t('code') },
        { key: 'label', header: t('label') },
        { key: 'description', header: t('description'), render: (n) => n.description || '-' },
    ];

    return (
        <NomenclatureCrudPage
            tableId="echelons-structurels"
            titleKey="echelonsStructurels"
            icon={Layers}
            permission="organisation:nomenclatures"
            embedded={embedded}
            columns={columns}
            useData={useEchelonsStructurels}
            useCreate={useCreerEchelonStructurel}
            useUpdate={useModifierEchelonStructurel}
            useDelete={useSupprimerEchelonStructurel}
            formComponent={EchelonFormWrapper}
        />
    );
}
