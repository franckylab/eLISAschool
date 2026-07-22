import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import {
    useTemplatesOrganisation, useCreerTemplateOrganisation,
    useModifierTemplateOrganisation, useSupprimerTemplateOrganisation,
} from '../hooks/use-templates';
import type { TemplateOrganisation } from '../types/organisation.types';

function BadgeSysteme({ estSysteme }: { estSysteme: boolean }) {
    const { t } = useTranslation('organisation');
    return estSysteme ? <Badge variant="secondary"><span className="mr-1">⚙</span>{t('systeme')}</Badge> : null;
}

function InlineEdit({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
    const [val, setVal] = useState(value);
    return (
        <div className="flex items-center gap-2">
            <input type="text" value={val} onChange={(e) => setVal(e.target.value)}
                className="w-32 px-2 py-1 text-sm border border-border rounded bg-background text-foreground"
                autoFocus onKeyDown={(e) => e.key === 'Enter' && onSave(val)} />
            <button onClick={() => onSave(val)} className="p-1 text-green-600 hover:text-green-800"><Save className="h-4 w-4" /></button>
            <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
    );
}

export function TemplatesPage() {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    const canEdit = hasPermission('organisation:templates:write');
    const { data, isLoading } = useTemplatesOrganisation();
    const creer = useCreerTemplateOrganisation();
    const modifier = useModifierTemplateOrganisation();
    const supprimer = useSupprimerTemplateOrganisation();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [nom, setNom] = useState('');
    const [description, setDescription] = useState('');
    const [structure, setStructure] = useState(JSON.stringify({
        niveau: 0, usageUnite: 'SERVICE', nom: '', count: 1,
        postes: [{ ref: 'RESP', intitule: 'Responsable', categoriePosteId: '', niveauResponsabiliteId: '', nombrePostes: 1 }],
        hierarchie: [],
        enfants: [],
    }, null, 2));
    const [error, setError] = useState('');

    if (isLoading && !data) return <PageSkeleton />;

    const columns: Column<TemplateOrganisation>[] = [
        {
            key: 'nom', header: t('nom'), render: (tpl) => editing === tpl.id
                ? <InlineEdit value={editVal} onSave={(v) => { modifier.mutate({ id: tpl.id, nom: v }); setEditing(null); }} onCancel={() => setEditing(null)} />
                : <span className="font-medium">{tpl.nom}</span>
        },
        { key: 'description', header: t('description'), render: (tpl) => tpl.description || '-' },
        {
            key: 'actif', header: t('statut'),
            render: (tpl) => tpl.actif ? <Badge variant="success">{t('actif')}</Badge> : <Badge variant="secondary">{t('inactif')}</Badge>
        },
        { key: 'systeme', header: '', render: (tpl) => <BadgeSysteme estSysteme={tpl.estSysteme} /> },
        ...(canEdit ? [{
            key: 'actions' as string, header: '',
            render: (tpl: TemplateOrganisation) => (
                <div className="flex gap-2">
                    <button onClick={() => setExpanded(expanded === tpl.id ? null : tpl.id)}
                        className="p-1 text-muted-foreground hover:text-foreground">
                        <FileText className="h-4 w-4" />
                    </button>
                    {!tpl.estSysteme && <>
                        <button onClick={() => { setEditing(tpl.id); setEditVal(tpl.nom); }}
                            className="p-1 text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(tpl.id)}
                            className="p-1 text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                    </>}
                </div>
            ),
        }] : []),
    ];

    const handleAddSave = () => {
        if (!nom || nom.trim().length < 2) {
            setError(`${t('nomTemplate')} : ${t('minimumCaracteres')}`);
            return;
        }
        try {
            const parsed = JSON.parse(structure);
            creer.mutate({ nom, description: description || undefined, structure: parsed });
            setAdding(false);
            setNom('');
            setDescription('');
            setStructure('');
        } catch {
            setError(t('jsonInvalide'));
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('templatesOrganisation')}
                icon={FileText}
                variant="gradient"
            />
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-card-foreground">{t('templatesOrganisation')}</h2>
                    {canEdit && <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}
                        onClick={() => setAdding(true)}>{t('nouveauTemplate')}</ElisaButton>}
                </div>
                <DataTable
                    tableId="nomenclatures-templates"
                    columns={columns}
                    data={data || []}
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    emptyMessage={t('aucuneDonnee')}
                />
                {expanded && data?.find(tpl => tpl.id === expanded) && (
                    <div className="mt-3 p-3 bg-surface-alt border border-border rounded text-xs font-mono overflow-auto max-h-48">
                        <pre>{JSON.stringify(data.find(tpl => tpl.id === expanded)?.structure, null, 2)}</pre>
                    </div>
                )}
                {adding && (
                    <div className="mt-2 bg-accent/20 p-3 rounded space-y-2 border border-border">
                        <div className="flex items-center gap-2">
                            <input placeholder={t('nomTemplate')} value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                className="px-2 py-1 text-sm border border-border rounded w-60 bg-background text-foreground" />
                            <input placeholder={t('description')} value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="px-2 py-1 text-sm border border-border rounded w-80 bg-background text-foreground" />
                        </div>
                        <textarea value={structure} onChange={(e) => { setStructure(e.target.value); setError(''); }}
                            className="w-full h-32 px-2 py-1 text-xs font-mono border border-border rounded bg-background text-foreground" />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                        <div className="flex gap-2">
                            <button onClick={handleAddSave}
                                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">
                                {t('creer')}
                            </button>
                            <button onClick={() => setAdding(false)}
                                className="px-3 py-1 text-sm border border-border rounded hover:bg-accent">
                                {t('annuler')}
                            </button>
                        </div>
                    </div>
                )}
                <ConfirmDialog
                    open={!!deleteId}
                    onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                    onConfirm={() => { supprimer.mutate(deleteId!); setDeleteId(null); }}
                    title={t('supprimer')}
                    description={t('supprimerTemplate')}
                    confirmText={t('supprimer')}
                    variant="danger"
                />
            </Card>
        </div>
    );
}
