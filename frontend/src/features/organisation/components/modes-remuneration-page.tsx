import { Wallet } from 'lucide-react';
import { NomenclatureCrudPage } from './nomenclature-crud-page';
import { NomenclatureFormModal } from './nomenclature-form-modal';
import {
    useModesRemuneration, useCreerModeRemuneration,
    useModifierModeRemuneration, useSupprimerModeRemuneration,
} from '../hooks/use-modes-remuneration';
import type { ModeRemuneration } from '../types/organisation.types';
import type { Column } from '@/components/ui/DataTable';
import { useTranslation } from 'react-i18next';

function ModeFormWrapper({ initialData, onSuccess, onCancel }: { initialData?: ModeRemuneration | null; onSuccess: () => void; onCancel: () => void }) {
    const { mutateAsync: modifier } = useModifierModeRemuneration();
    const { mutateAsync: creer } = useCreerModeRemuneration();
    return (
        <NomenclatureFormModal
            open
            onOpenChange={(v: boolean) => { if (!v) onCancel(); }}
            initialData={initialData}
            titleKey={initialData ? 'modifierModeRemuneration' : 'nouveauModeRemuneration'}
            icon={Wallet}
            fields={[
                { key: 'code', labelKey: 'code', required: true, span: 'col-span-1' },
                { key: 'label', labelKey: 'label', required: true, span: 'col-span-1' },
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

export function ModesRemunerationPage({ embedded }: { embedded?: boolean } = {}) {
    const { t } = useTranslation('organisation');

    const columns: Column<ModeRemuneration>[] = [
        { key: 'code', header: t('code'), render: (m) => <span className="font-mono text-xs bg-surface-alt border border-border px-2 py-0.5 rounded">{m.code}</span> },
        { key: 'label', header: t('label') },
        { key: 'description', header: t('description'), render: (m) => m.description || '-' },
    ];

    return (
        <NomenclatureCrudPage
            tableId="modes-remuneration"
            titleKey="modesRemuneration"
            icon={Wallet}
            permission="organisation:nomenclatures"
            embedded={embedded}
            columns={columns}
            useData={useModesRemuneration}
            useCreate={useCreerModeRemuneration}
            useUpdate={useModifierModeRemuneration}
            useDelete={useSupprimerModeRemuneration}
            formComponent={ModeFormWrapper}
        />
    );
}
