import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Layers, Tag, Briefcase, Star, FileText, Play,
    Plus, Edit, Trash2, Save, X, Shield, Users,
} from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { TabsBar, TabsContent } from '@/components/ui';
import type { Tab } from '@/components/ui';
import { usePermissions } from '@/hooks';
import { useOrganisations, useNiveauxOrganisation, useCreerNiveauOrganisation, useModifierNiveauOrganisation, useSupprimerNiveauOrganisation,
    useUsagesUnite, useCreerUsageUnite, useModifierUsageUnite, useSupprimerUsageUnite,
    useCategoriesPoste, useCreerCategoriePoste, useModifierCategoriePoste, useSupprimerCategoriePoste,
    useNiveauxResponsabilite, useCreerNiveauResponsabilite, useModifierNiveauResponsabilite, useSupprimerNiveauResponsabilite,
    useTemplatesOrganisation, useCreerTemplateOrganisation, useModifierTemplateOrganisation, useSupprimerTemplateOrganisation,
    useGenererOrganisation,
} from '../hooks/use-organisation';
import { useTypesPersonnel, useCreerTypePersonnel, useModifierTypePersonnel, useSupprimerTypePersonnel } from '@/features/personnel/hooks/use-types-personnel';
import type { NiveauOrganisation, UsageUnite, CategoriePoste, NiveauResponsabilite, TemplateOrganisation, ResultatGeneration } from '../types/organisation.types';

type Onglet = 'niveaux' | 'usages' | 'categories' | 'niveaux-resp' | 'templates' | 'generation' | 'types-personnel';

function InlineEdit({ value, onSave, onCancel, type = 'text' }: { value: string; onSave: (v: string) => void; onCancel: () => void; type?: string }) {
    const [val, setVal] = useState(value);
    return (
        <div className="flex items-center gap-2">
            <input type={type} value={val} onChange={(e) => setVal(e.target.value)}
                className="w-32 px-2 py-1 text-sm border border-[var(--color-bordure)] rounded bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                autoFocus onKeyDown={(e) => e.key === 'Enter' && onSave(val)} />
            <button onClick={() => onSave(val)} className="p-1 text-green-600 hover:text-green-800"><Save className="h-4 w-4" /></button>
            <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
    );
}

// @ts-expect-error kept for future inline add forms
function InlineAdd({ onSave, onCancel, fields }: { onSave: (vals: Record<string, string>) => void; onCancel: () => void; fields: { key: string; label: string; type?: string }[] }) {
    const [vals, setVals] = useState<Record<string, string>>({});
    return (
        <tr className="bg-blue-50 dark:bg-blue-900/20">
            <td colSpan={fields.length + 1} className="p-2">
                <div className="flex items-center gap-2 flex-wrap">
                    {fields.map((f) => (
                        <input key={f.key} type={f.type || 'text'} placeholder={f.label}
                            value={vals[f.key] || ''} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
                            className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded bg-[var(--color-surface)] text-[var(--color-text-primary)] w-32" />
                    ))}
                    <button onClick={() => onSave(vals)} className="p-1 text-green-600 hover:text-green-800"><Save className="h-4 w-4" /></button>
                    <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                </div>
            </td>
        </tr>
    );
}

function BadgeSysteme({ estSysteme }: { estSysteme: boolean }) {
    const { t } = useTranslation('organisation');
    return estSysteme ? <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />{t('systeme')}</Badge> : null;
}

export function NomenclaturesPage() {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    const canEdit = hasPermission('organisation:edit');
    const [ongletActif, setOngletActif] = useState<Onglet>('niveaux');

    const onglets: Tab[] = [
        { id: 'niveaux', label: t('niveauxOrganisation'), icon: Layers },
        { id: 'usages', label: t('usagesUnite'), icon: Tag },
        { id: 'categories', label: t('categoriesPoste'), icon: Briefcase },
        { id: 'types-personnel', label: t('typesPersonnel'), icon: Users },
        { id: 'niveaux-resp', label: t('niveauxResponsabilite'), icon: Star },
        { id: 'templates', label: t('templatesOrganisation'), icon: FileText },
        { id: 'generation', label: t('genererOrganisation'), icon: Play },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('nomenclaturesTitre')}
                icon={Layers}
                variant="gradient"
                onBack={() => navigate({ to: '/organisation' })}
            />

            <TabsBar
                tabs={onglets}
                activeTab={ongletActif}
                onTabChange={(tabId) => setOngletActif(tabId as Onglet)}
                variant="underline"
            />

            <TabsContent activeTab={ongletActif}>
                {ongletActif === 'niveaux' && <TabNiveaux canEdit={canEdit} />}
                {ongletActif === 'usages' && <TabUsages canEdit={canEdit} />}
                {ongletActif === 'categories' && <TabCategories canEdit={canEdit} />}
                {ongletActif === 'types-personnel' && <TabTypesPersonnel canEdit={canEdit} />}
                {ongletActif === 'niveaux-resp' && <TabNiveauxResp canEdit={canEdit} />}
                {ongletActif === 'templates' && <TabTemplates canEdit={canEdit} />}
                {ongletActif === 'generation' && <TabGeneration />}
            </TabsContent>
        </div>
    );
}

// ─── TAB: Niveaux d'Organisation ───

function TabNiveaux({ canEdit }: { canEdit: boolean }) {
    const { t } = useTranslation('organisation');
    const { data, isLoading } = useNiveauxOrganisation();
    const creer = useCreerNiveauOrganisation();
    const modifier = useModifierNiveauOrganisation();
    const supprimer = useSupprimerNiveauOrganisation();
    const [editing, setEditing] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');
    const [adding, setAdding] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    if (isLoading && !data) return <PageSkeleton />;

    const columns: Column<NiveauOrganisation>[] = [
        { key: 'niveau', header: t('niveau'), render: (n) => <span className="font-mono">{n.niveau}</span> },
        { key: 'label', header: t('label'), render: (n) => editing === n.id
            ? <InlineEdit value={editVal} onSave={(v) => { modifier.mutate({ id: n.id, label: v }); setEditing(null); }} onCancel={() => setEditing(null)} />
            : <span>{n.label}</span> },
        { key: 'description', header: t('description'), render: (n) => n.description || '-' },
        { key: 'systeme', header: '', render: (n) => <BadgeSysteme estSysteme={n.estSysteme} /> },
        ...(canEdit ? [{
            key: 'actions' as string, header: '',
            render: (n: NiveauOrganisation) => (
                <div className="flex gap-2">
                    {!n.estSysteme && <>
                        <button onClick={() => { setEditing(n.id); setEditVal(n.label); }} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(n.id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                    </>}
                </div>
            ),
        }] : []),
    ];

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">{t('niveauxOrganisation')}</h2>
                {canEdit && <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>{t('nouveauNiveau')}</ElisaButton>}
            </div>
            <DataTable
                tableId="nomenclatures-niveaux"
                columns={columns}
                data={data || []}
                enableReordering
                enablePinning
                enableColumnVisibility
                emptyMessage={t('aucuneOrganisation')}
            />
            {adding && <div className="mt-2"><NiveauAddForm onSave={(v) => { creer.mutate(v); setAdding(false); }} onCancel={() => setAdding(false)} /></div>}
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                onConfirm={() => { supprimer.mutate(deleteId!); setDeleteId(null); }}
                title={t('supprimer')}
                description={t('supprimerNiveau')}
                confirmText={t('supprimer')}
                variant="danger"
            />
        </Card>
    );
}

function NiveauAddForm({ onSave, onCancel }: { onSave: (v: any) => void; onCancel: () => void }) {
    const { t } = useTranslation('organisation');
    const [label, setLabel] = useState('');
    const [niveau, setNiveau] = useState('0');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const doSave = () => {
        if (!label || label.trim().length < 2) { setError(`${t('label')} : ${t('minimumCaracteres')}`); return; }
        onSave({ label, niveau: parseInt(niveau), description: description || undefined });
    };
    return (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <input placeholder={t('label')} value={label} onChange={(e) => setLabel(e.target.value)} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-40 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input type="number" placeholder={t('niveau')} value={niveau} onChange={(e) => setNiveau(e.target.value)} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-20 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input placeholder={t('description')} value={description} onChange={(e) => setDescription(e.target.value)} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-60 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <button onClick={doSave} className="p-1 text-green-600"><Save className="h-4 w-4" /></button>
            <button onClick={onCancel} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

// ─── TAB: Usages d'unité ───

function TabUsages({ canEdit }: { canEdit: boolean }) {
    const { t } = useTranslation('organisation');
    const { data, isLoading } = useUsagesUnite();
    const creer = useCreerUsageUnite();
    const modifier = useModifierUsageUnite();
    const supprimer = useSupprimerUsageUnite();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');

    if (isLoading && !data) return <PageSkeleton />;

    const columns: Column<UsageUnite>[] = [
        { key: 'code', header: t('code'), render: (u) => <span className="font-mono text-xs bg-[var(--color-surface-alt)] border border-[var(--color-bordure)] px-2 py-0.5 rounded">{u.code}</span> },
        { key: 'label', header: t('label'), render: (u) => editing === u.id
            ? <InlineEdit value={editVal} onSave={(v) => { modifier.mutate({ id: u.id, label: v }); setEditing(null); }} onCancel={() => setEditing(null)} />
            : <span>{u.label}</span> },
        { key: 'description', header: t('description'), render: (u) => u.description || '-' },
        { key: 'systeme', header: '', render: (u) => <BadgeSysteme estSysteme={u.estSysteme} /> },
        ...(canEdit ? [{
            key: 'actions' as string, header: '',
            render: (u: UsageUnite) => (
                <div className="flex gap-2">
                    {!u.estSysteme && <>
                        <button onClick={() => { setEditing(u.id); setEditVal(u.label); }} className="p-1 text-blue-600"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(u.id)} className="p-1 text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </>}
                </div>
            ),
        }] : []),
    ];

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">{t('usagesUnite')}</h2>
                {canEdit && <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>{t('nouvelUsage')}</ElisaButton>}
            </div>
            <DataTable
                tableId="nomenclatures-usages"
                columns={columns}
                data={data || []}
                enableReordering
                enablePinning
                enableColumnVisibility
                emptyMessage={t('aucuneOrganisation')}
            />
            {adding && <div className="mt-2"><UsageAddForm onSave={(v) => { creer.mutate(v); setAdding(false); }} onCancel={() => setAdding(false)} /></div>}
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                onConfirm={() => { supprimer.mutate(deleteId!); setDeleteId(null); }}
                title={t('supprimer')}
                description={t('supprimerUsage')}
                confirmText={t('supprimer')}
                variant="danger"
            />
        </Card>
    );
}

function UsageAddForm({ onSave, onCancel }: { onSave: (v: any) => void; onCancel: () => void }) {
    const { t } = useTranslation('organisation');
    const [code, setCode] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const doSave = () => {
        if (!code || code.trim().length < 2) { setError(`${t('code')} : ${t('minimumCaracteres')}`); return; }
        if (!label || label.trim().length < 2) { setError(`${t('label')} : ${t('minimumCaracteres')}`); return; }
        onSave({ code, label, description: description || undefined });
    };
    return (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <input placeholder={t('code')} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-24 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input placeholder={t('label')} value={label} onChange={(e) => setLabel(e.target.value)} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-40 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input placeholder={t('description')} value={description} onChange={(e) => setDescription(e.target.value)} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-60 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <button onClick={doSave} className="p-1 text-green-600"><Save className="h-4 w-4" /></button>
            <button onClick={onCancel} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

// ─── TAB: Catégories de Poste ───

function TabCategories({ canEdit }: { canEdit: boolean }) {
    const { t } = useTranslation('organisation');
    const { data, isLoading } = useCategoriesPoste();
    const creer = useCreerCategoriePoste();
    const modifier = useModifierCategoriePoste();
    const supprimer = useSupprimerCategoriePoste();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');

    if (isLoading && !data) return <PageSkeleton />;

    const columns: Column<CategoriePoste>[] = [
        { key: 'code', header: t('code'), render: (c) => <span className="font-mono text-xs bg-[var(--color-surface-alt)] border border-[var(--color-bordure)] px-2 py-0.5 rounded">{c.code}</span> },
        { key: 'label', header: t('label'), render: (c) => editing === c.id
            ? <InlineEdit value={editVal} onSave={(v) => { modifier.mutate({ id: c.id, label: v }); setEditing(null); }} onCancel={() => setEditing(null)} />
            : <span>{c.label}</span> },
        { key: 'description', header: t('description'), render: (c) => c.description || '-' },
        { key: 'systeme', header: '', render: (c) => <BadgeSysteme estSysteme={c.estSysteme} /> },
        ...(canEdit ? [{
            key: 'actions' as string, header: '',
            render: (c: CategoriePoste) => (
                <div className="flex gap-2">
                    {!c.estSysteme && <>
                        <button onClick={() => { setEditing(c.id); setEditVal(c.label); }} className="p-1 text-blue-600"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1 text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </>}
                </div>
            ),
        }] : []),
    ];

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">{t('categoriesPoste')}</h2>
                {canEdit && <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>{t('nouvelleCategorie')}</ElisaButton>}
            </div>
            <DataTable
                tableId="nomenclatures-categories"
                columns={columns}
                data={data || []}
                enableReordering
                enablePinning
                enableColumnVisibility
                emptyMessage={t('aucuneOrganisation')}
            />
            {adding && <div className="mt-2"><CategorieAddForm onSave={(v) => { creer.mutate(v); setAdding(false); }} onCancel={() => setAdding(false)} /></div>}
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                onConfirm={() => { supprimer.mutate(deleteId!); setDeleteId(null); }}
                title={t('supprimer')}
                description={t('supprimerCategorie')}
                confirmText={t('supprimer')}
                variant="danger"
            />
        </Card>
    );
}

function CategorieAddForm({ onSave, onCancel }: { onSave: (v: any) => void; onCancel: () => void }) {
    const { t } = useTranslation('organisation');
    const [code, setCode] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const doSave = () => {
        if (!code || code.trim().length < 2) { setError(`${t('code')} : ${t('minimumCaracteres')}`); return; }
        if (!label || label.trim().length < 2) { setError(`${t('label')} : ${t('minimumCaracteres')}`); return; }
        onSave({ code, label, description: description || undefined });
    };
    return (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <input placeholder={t('code')} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-24 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input placeholder={t('label')} value={label} onChange={(e) => setLabel(e.target.value)} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-40 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input placeholder={t('description')} value={description} onChange={(e) => setDescription(e.target.value)} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-60 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <button onClick={doSave} className="p-1 text-green-600"><Save className="h-4 w-4" /></button>
            <button onClick={onCancel} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

// ─── TAB: Niveaux de Responsabilité ───

function TabNiveauxResp({ canEdit }: { canEdit: boolean }) {
    const { t } = useTranslation('organisation');
    const { data, isLoading } = useNiveauxResponsabilite();
    const creer = useCreerNiveauResponsabilite();
    const modifier = useModifierNiveauResponsabilite();
    const supprimer = useSupprimerNiveauResponsabilite();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');

    if (isLoading && !data) return <PageSkeleton />;

    const columns: Column<NiveauResponsabilite>[] = [
        { key: 'code', header: t('code'), render: (n) => <span className="font-mono text-xs bg-[var(--color-surface-alt)] border border-[var(--color-bordure)] px-2 py-0.5 rounded">{n.code}</span> },
        { key: 'label', header: t('label'), render: (n) => editing === n.id
            ? <InlineEdit value={editVal} onSave={(v) => { modifier.mutate({ id: n.id, label: v }); setEditing(null); }} onCancel={() => setEditing(null)} />
            : <span>{n.label}</span> },
        { key: 'niveau', header: t('niveau'), render: (n) => <span className="font-mono">{n.niveau}</span> },
        { key: 'systeme', header: '', render: (n) => <BadgeSysteme estSysteme={n.estSysteme} /> },
        ...(canEdit ? [{
            key: 'actions' as string, header: '',
            render: (n: NiveauResponsabilite) => (
                <div className="flex gap-2">
                    {!n.estSysteme && <>
                        <button onClick={() => { setEditing(n.id); setEditVal(n.label); }} className="p-1 text-blue-600"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(n.id)} className="p-1 text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </>}
                </div>
            ),
        }] : []),
    ];

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">{t('niveauxResponsabilite')}</h2>
                {canEdit && <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>{t('nouveauNiveauResp')}</ElisaButton>}
            </div>
            <DataTable
                tableId="nomenclatures-niveaux-resp"
                columns={columns}
                data={data || []}
                enableReordering
                enablePinning
                enableColumnVisibility
                emptyMessage={t('aucuneOrganisation')}
            />
            {adding && <div className="mt-2"><NiveauRespAddForm onSave={(v) => { creer.mutate(v); setAdding(false); }} onCancel={() => setAdding(false)} /></div>}
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                onConfirm={() => { supprimer.mutate(deleteId!); setDeleteId(null); }}
                title={t('supprimer')}
                description={t('supprimerNiveauResp')}
                confirmText={t('supprimer')}
                variant="danger"
            />
        </Card>
    );
}

function NiveauRespAddForm({ onSave, onCancel }: { onSave: (v: any) => void; onCancel: () => void }) {
    const { t } = useTranslation('organisation');
    const [code, setCode] = useState('');
    const [label, setLabel] = useState('');
    const [niveau, setNiveau] = useState('0');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const doSave = () => {
        if (!code || code.trim().length < 2) { setError(`${t('code')} : ${t('minimumCaracteres')}`); return; }
        if (!label || label.trim().length < 2) { setError(`${t('label')} : ${t('minimumCaracteres')}`); return; }
        onSave({ code, label, niveau: parseInt(niveau), description: description || undefined });
    };
    return (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <input placeholder={t('code')} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-24 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input placeholder={t('label')} value={label} onChange={(e) => setLabel(e.target.value)} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-40 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input type="number" placeholder={t('niveau')} value={niveau} onChange={(e) => setNiveau(e.target.value)} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-20 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input placeholder={t('description')} value={description} onChange={(e) => setDescription(e.target.value)} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-40 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <button onClick={doSave} className="p-1 text-green-600"><Save className="h-4 w-4" /></button>
            <button onClick={onCancel} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

// ─── TAB: Templates ───

function TabTemplates({ canEdit }: { canEdit: boolean }) {
    const { t } = useTranslation('organisation');
    const { data, isLoading } = useTemplatesOrganisation();
    const creer = useCreerTemplateOrganisation();
    const modifier = useModifierTemplateOrganisation();
    const supprimer = useSupprimerTemplateOrganisation();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);

    if (isLoading && !data) return <PageSkeleton />;

    const columns: Column<TemplateOrganisation>[] = [
        { key: 'nom', header: t('nom'), render: (tpl) => editing === tpl.id
            ? <InlineEdit value={editVal} onSave={(v) => { modifier.mutate({ id: tpl.id, nom: v }); setEditing(null); }} onCancel={() => setEditing(null)} />
            : <span className="font-medium">{tpl.nom}</span> },
        { key: 'description', header: t('description'), render: (tpl) => tpl.description || '-' },
        { key: 'actif', header: t('statut'), render: (tpl) => tpl.actif ? <Badge variant="success">{t('actif')}</Badge> : <Badge variant="secondary">{t('inactif')}</Badge> },
        { key: 'systeme', header: '', render: (tpl) => <BadgeSysteme estSysteme={tpl.estSysteme} /> },
        ...(canEdit ? [{
            key: 'actions' as string, header: '',
            render: (tpl: TemplateOrganisation) => (
                <div className="flex gap-2">
                    <button onClick={() => setExpanded(expanded === tpl.id ? null : tpl.id)} className="p-1 text-gray-600 hover:text-gray-800">
                        <FileText className="h-4 w-4" />
                    </button>
                    {!tpl.estSysteme && <>
                        <button onClick={() => { setEditing(tpl.id); setEditVal(tpl.nom); }} className="p-1 text-blue-600"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(tpl.id)} className="p-1 text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </>}
                </div>
            ),
        }] : []),
    ];

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">{t('templatesOrganisation')}</h2>
                {canEdit && <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>{t('nouveauTemplate')}</ElisaButton>}
            </div>
            <DataTable
                tableId="nomenclatures-templates"
                columns={columns}
                data={data || []}
                enableReordering
                enablePinning
                enableColumnVisibility
                emptyMessage={t('aucuneOrganisation')}
            />
            {expanded && data?.find(tpl => tpl.id === expanded) && (
                <div className="mt-3 p-3 bg-[var(--color-surface-alt)] border border-[var(--color-bordure)] rounded text-xs font-mono overflow-auto max-h-48">
                    <pre>{JSON.stringify(data.find(tpl => tpl.id === expanded)?.structure, null, 2)}</pre>
                </div>
            )}
            {adding && <div className="mt-2"><TemplateAddForm onSave={(v) => { creer.mutate(v); setAdding(false); }} onCancel={() => setAdding(false)} /></div>}
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
    );
}

function TemplateAddForm({ onSave, onCancel }: { onSave: (v: any) => void; onCancel: () => void }) {
    const { t } = useTranslation('organisation');
    const [nom, setNom] = useState('');
    const [description, setDescription] = useState('');
    const [structure, setStructure] = useState(JSON.stringify({
        niveau: 0, usageUnite: 'SERVICE', nom: '', count: 1,
        postes: [{ ref: 'RESP', intitulé: 'Responsable', categoriePoste: 'ADMINISTRATIF', niveauResponsabilite: 'RESPONSABLE', nombrePostes: 1 }],
        hierarchie: [],
        enfants: [],
    }, null, 2));
    const [error, setError] = useState('');

    const handleSave = () => {
        if (!nom || nom.trim().length < 2) {
            setError(`${t('nomTemplate')} : ${t('minimumCaracteres')}`);
            return;
        }
        try {
            const parsed = JSON.parse(structure);
            onSave({ nom, description: description || undefined, structure: parsed });
        } catch {
            setError(t('jsonInvalide'));
        }
    };

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded space-y-2">
            <div className="flex items-center gap-2">
                <input placeholder={t('nomTemplate')} value={nom} onChange={(e) => setNom(e.target.value)} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-60 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
                <input placeholder={t('description')} value={description} onChange={(e) => setDescription(e.target.value)} className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-80 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            </div>
            <textarea value={structure} onChange={(e) => { setStructure(e.target.value); setError(''); }}
                className="w-full h-32 px-2 py-1 text-xs font-mono border border-[var(--color-bordure)] rounded bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
                <button onClick={handleSave} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">{t('creer')}</button>
                <button onClick={onCancel} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">{t('annuler')}</button>
            </div>
        </div>
    );
}

// ─── TAB: Types de Personnel ───

function TabTypesPersonnel({ canEdit }: { canEdit: boolean }) {
    const { t } = useTranslation('organisation');
    const { data, isLoading } = useTypesPersonnel();
    const creer = useCreerTypePersonnel();
    const modifier = useModifierTypePersonnel();
    const supprimer = useSupprimerTypePersonnel();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');

    if (isLoading && !data) return <PageSkeleton />;

    const columns: Column<any>[] = [
        {
            key: 'code', header: t('code'),
            render: (tp) => <span className="font-mono text-xs bg-[var(--color-surface-alt)] border border-[var(--color-bordure)] px-2 py-0.5 rounded">{tp.code}</span>,
        },
        {
            key: 'nom', header: t('nom'),
            render: (tp) => editing === tp.id
                ? <InlineEdit value={editVal} onSave={(v) => { modifier.mutate({ id: tp.id, nom: v }); setEditing(null); }} onCancel={() => setEditing(null)} />
                : <span>{tp.nom}</span>,
        },
        {
            key: 'description', header: t('description'),
            render: (tp) => tp.description || '-',
        },
        {
            key: 'modeRemunerationDefaut', header: t('modeRemunerationDefaut'),
            render: (tp) => tp.modeRemunerationDefaut
                ? <Badge variant="outline" size="sm">{tp.modeRemunerationDefaut}</Badge>
                : '-',
        },
        {
            key: 'actif', header: t('statut'),
            render: (tp) => tp.actif
                ? <Badge variant="success" size="sm">{t('actif')}</Badge>
                : <Badge variant="secondary" size="sm">{t('inactif')}</Badge>,
        },
        { key: 'systeme', header: '', render: (tp) => <BadgeSysteme estSysteme={tp.estSysteme} /> },
        ...(canEdit ? [{
            key: 'actions' as string, header: '',
            render: (tp: any) => (
                <div className="flex gap-2">
                    {!tp.estSysteme && <>
                        <button onClick={() => { setEditing(tp.id); setEditVal(tp.nom); }} className="p-1 text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(tp.id)} className="p-1 text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                    </>}
                </div>
            ),
        }] : []),
    ];

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-card-foreground">{t('typesPersonnel')}</h2>
                {canEdit && <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>{t('nouveauTypePersonnel')}</ElisaButton>}
            </div>
            <DataTable
                tableId="nomenclatures-types-personnel"
                columns={columns}
                data={data || []}
                enableReordering
                enablePinning
                enableColumnVisibility
                emptyMessage={t('aucunTypePersonnel')}
            />
            {adding && <div className="mt-2"><TypePersonnelAddForm onSave={(v) => { creer.mutate(v); setAdding(false); }} onCancel={() => setAdding(false)} /></div>}
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                onConfirm={() => { supprimer.mutate(deleteId!); setDeleteId(null); }}
                title={t('supprimer')}
                description={t('supprimerTypePersonnel')}
                confirmText={t('supprimer')}
                variant="danger"
            />
        </Card>
    );
}

function TypePersonnelAddForm({ onSave, onCancel }: { onSave: (v: any) => void; onCancel: () => void }) {
    const { t } = useTranslation('organisation');
    const [code, setCode] = useState('');
    const [nom, setNom] = useState('');
    const [description, setDescription] = useState('');
    const [modeRemuneration, setModeRemuneration] = useState('');
    const [error, setError] = useState('');
    const doSave = () => {
        if (!code || code.trim().length < 2) { setError(`${t('code')} : ${t('minimumCaracteres')}`); return; }
        if (!nom || nom.trim().length < 2) { setError(`${t('nom')} : ${t('minimumCaracteres')}`); return; }
        onSave({
            code: code.toUpperCase(),
            nom,
            description: description || undefined,
            modeRemunerationDefaut: modeRemuneration || undefined,
        });
    };
    return (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded flex-wrap">
            <input placeholder={t('code')} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-24 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input placeholder={t('nom')} value={nom} onChange={(e) => setNom(e.target.value)}
                className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-40 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input placeholder={t('modeRemuneration')} value={modeRemuneration} onChange={(e) => setModeRemuneration(e.target.value)}
                className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-36 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <input placeholder={t('description')} value={description} onChange={(e) => setDescription(e.target.value)}
                className="px-2 py-1 text-sm border border-[var(--color-bordure)] rounded w-48 bg-[var(--color-surface)] text-[var(--color-text-primary)]" />
            <button onClick={doSave} className="p-1 text-green-600"><Save className="h-4 w-4" /></button>
            <button onClick={onCancel} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

// ─── TAB: Génération ───

function TabGeneration() {
    const { t } = useTranslation('organisation');
    const { data: organisations } = useOrganisations();
    const { data: templates } = useTemplatesOrganisation();
    const generer = useGenererOrganisation();
    const [templateId, setTemplateId] = useState('');
    const [organisationId, setOrganisationId] = useState('');
    const [prefixeCode, setPrefixeCode] = useState('');
    const [modeConflit, setModeConflit] = useState<'ERROR' | 'SKIP' | 'OVERWRITE'>('OVERWRITE');
    const [creerHierarchie, setCreerHierarchie] = useState(true);
    const [result, setResult] = useState<ResultatGeneration | null>(null);

    const handleGenerate = () => {
        if (!templateId || !organisationId) return;
        generer.mutate({
            templateId,
            organisationId,
            options: {
                prefixeCode: prefixeCode || undefined,
                creerHierarchie,
                modeConflit,
            },
        }, {
            onSuccess: (data) => setResult(data ?? null),
        });
    };

    return (
        <Card>
            <h2 className="text-lg font-semibold text-card-foreground mb-4">{t('genererOrganisation')}</h2>
            <div className="space-y-4 max-w-xl">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('template')}</label>
                    <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-bordure)] rounded bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                        <option value="">{t('selectionnerTemplate')}</option>
                        {(templates || []).map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.nom}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('organisationCible')}</label>
                    <select value={organisationId} onChange={(e) => setOrganisationId(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--color-bordure)] rounded bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                        <option value="">{t('selectionnerOrganisation')}</option>
                        {(organisations?.items || []).map((org) => <option key={org.id} value={org.id}>{org.nom}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('prefixeCode')}</label>
                        <input value={prefixeCode} onChange={(e) => setPrefixeCode(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--color-bordure)] rounded bg-[var(--color-surface)] text-[var(--color-text-primary)]" placeholder={t('optionnel')} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('modeConflit')}</label>
                        <select value={modeConflit} onChange={(e) => setModeConflit(e.target.value as any)}
                            className="w-full px-3 py-2 border border-[var(--color-bordure)] rounded bg-[var(--color-surface)] text-[var(--color-text-primary)]">
                            <option value="ERROR">{t('modeConflitError')}</option>
                            <option value="SKIP">{t('modeConflitSkip')}</option>
                            <option value="OVERWRITE">{t('modeConflitOverwrite')}</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center gap-2 pb-2">
                            <input type="checkbox" checked={creerHierarchie} onChange={(e) => setCreerHierarchie(e.target.checked)}
                                className="rounded border-gray-300" />
                            <span className="text-sm">{t('creerHierarchie')}</span>
                        </label>
                    </div>
                </div>
                <ElisaButton variant="primary" icon={<Play className="h-4 w-4" />}
                    onClick={handleGenerate} disabled={!templateId || !organisationId || generer.isPending}>
                    {generer.isPending ? t('generationEnCours') : t('generer')}
                </ElisaButton>

                {result && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded space-y-3">
                        <h3 className="font-semibold text-green-800 dark:text-green-300">{t('resultatGeneration')}</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded shadow-sm text-center">
                                <p className="text-2xl font-bold text-blue-600">{result.unitesCrees}</p>
                                <p className="text-xs text-gray-500">{t('unitesCrees')}</p>
                            </div>
                            <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded shadow-sm text-center">
                                <p className="text-2xl font-bold text-purple-600">{result.postesCrees}</p>
                                <p className="text-xs text-gray-500">{t('postesCrees')}</p>
                            </div>
                            <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-bordure)] rounded shadow-sm text-center">
                                <p className="text-2xl font-bold text-green-600">{result.hierarchiesCrees}</p>
                                <p className="text-xs text-gray-500">{t('hierarchiesCrees')}</p>
                            </div>
                        </div>
                        <details>
                            <summary className="text-sm cursor-pointer text-gray-600 hover:text-gray-800">{t('voirDetail')}</summary>
                            <pre className="mt-2 p-2 bg-[var(--color-surface-alt)] border border-[var(--color-bordure)] rounded text-xs font-mono overflow-auto max-h-48">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </Card>
    );
}
