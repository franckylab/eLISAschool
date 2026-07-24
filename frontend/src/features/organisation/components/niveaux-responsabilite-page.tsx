import { ArrowUpDown } from 'lucide-react';
import { NomenclatureCrudPage } from './nomenclature-crud-page';
import { NomenclatureFormModal } from './nomenclature-form-modal';
import {
    useNiveauxResponsabilite, useCreerNiveauResponsabilite,
    useModifierNiveauResponsabilite, useSupprimerNiveauResponsabilite,
} from '../hooks/use-niveaux-responsabilite';
import type { NiveauResponsabilite } from '../types/organisation.types';
import type { Column } from '@/components/ui/DataTable';
import { useTranslation } from 'react-i18next';

function NiveauFormWrapper({ initialData, onSuccess, onCancel }: { initialData?: NiveauResponsabilite | null; onSuccess: () => void; onCancel: () => void }) {
    const { mutateAsync: modifier } = useModifierNiveauResponsabilite();
    const { mutateAsync: creer } = useCreerNiveauResponsabilite();
    return (
        <NomenclatureFormModal
            open
            onOpenChange={(v: boolean) => { if (!v) onCancel(); }}
            initialData={initialData}
            titleKey={initialData ? 'modifierNiveauResp' : 'nouveauNiveauResp'}
            icon={ArrowUpDown}
            fields={[
                { key: 'code', labelKey: 'code', required: true, span: 'col-span-1' },
                { key: 'label', labelKey: 'label', required: true, span: 'col-span-1' },
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

export function NiveauxResponsabilitePage({ embedded }: { embedded?: boolean } = {}) {
    const { t } = useTranslation('organisation');

    const columns: Column<NiveauResponsabilite>[] = [
        { key: 'code', header: t('code'), render: (n) => <span className="font-mono text-xs bg-surface-alt border border-border px-2 py-0.5 rounded">{n.code}</span> },
        { key: 'label', header: t('label') },
        { key: 'niveau', header: t('niveau'), render: (n) => <span className="font-mono">{n.niveau}</span> },
        { key: 'description', header: t('description'), render: (n) => n.description || '-' },
    ];

    return (
        <NomenclatureCrudPage
            tableId="niveaux-responsabilite"
            titleKey="niveauxResponsabilite"
            icon={ArrowUpDown}
            permission="organisation:nomenclatures"
            embedded={embedded}
            columns={columns}
            useData={useNiveauxResponsabilite}
            useCreate={useCreerNiveauResponsabilite}
            useUpdate={useModifierNiveauResponsabilite}
            useDelete={useSupprimerNiveauResponsabilite}
            formComponent={NiveauFormWrapper}
        />
    );
}
