import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Layers, Tag, Briefcase, Star, FileText, Play,
    Plus, Edit, Trash2, Save, X, Shield,
} from 'lucide-react';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { LoadingState } from '@/components/feedback';
import { Badge } from '@/components/ui/Badge';
import { usePermissions } from '@/hooks';
import { useOrganisations, useNiveauxOrganisation, useCreerNiveauOrganisation, useModifierNiveauOrganisation, useSupprimerNiveauOrganisation,
    useUsagesUnite, useCreerUsageUnite, useModifierUsageUnite, useSupprimerUsageUnite,
    useCategoriesPoste, useCreerCategoriePoste, useModifierCategoriePoste, useSupprimerCategoriePoste,
    useNiveauxResponsabilite, useCreerNiveauResponsabilite, useModifierNiveauResponsabilite, useSupprimerNiveauResponsabilite,
    useTemplatesOrganisation, useCreerTemplateOrganisation, useModifierTemplateOrganisation, useSupprimerTemplateOrganisation,
    useGenererOrganisation,
} from '../hooks/use-organisation';
import type { NiveauOrganisation, UsageUnite, CategoriePoste, NiveauResponsabilite, TemplateOrganisation, ResultatGeneration } from '../types/organisation.types';

type Onglet = 'niveaux' | 'usages' | 'categories' | 'niveaux-resp' | 'templates' | 'generation';

function InlineEdit({ value, onSave, onCancel, type = 'text' }: { value: string; onSave: (v: string) => void; onCancel: () => void; type?: string }) {
    const [val, setVal] = useState(value);
    return (
        <div className="flex items-center gap-2">
            <input type={type} value={val} onChange={(e) => setVal(e.target.value)}
                className="w-32 px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
                autoFocus onKeyDown={(e) => e.key === 'Enter' && onSave(val)} />
            <button onClick={() => onSave(val)} className="p-1 text-green-600 hover:text-green-800"><Save className="h-4 w-4" /></button>
            <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
    );
}

function InlineAdd({ onSave, onCancel, fields }: { onSave: (vals: Record<string, string>) => void; onCancel: () => void; fields: { key: string; label: string; type?: string }[] }) {
    const [vals, setVals] = useState<Record<string, string>>({});
    return (
        <tr className="bg-blue-50 dark:bg-blue-900/20">
            <td colSpan={fields.length + 1} className="p-2">
                <div className="flex items-center gap-2 flex-wrap">
                    {fields.map((f) => (
                        <input key={f.key} type={f.type || 'text'} placeholder={f.label}
                            value={vals[f.key] || ''} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
                            className="px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600 w-32" />
                    ))}
                    <button onClick={() => onSave(vals)} className="p-1 text-green-600 hover:text-green-800"><Save className="h-4 w-4" /></button>
                    <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                </div>
            </td>
        </tr>
    );
}

function BadgeSysteme({ estSysteme }: { estSysteme: boolean }) {
    return estSysteme ? <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Système</Badge> : null;
}

export function NomenclaturesPage() {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    const canEdit = hasPermission('organisation:edit');
    const [ongletActif, setOngletActif] = useState<Onglet>('niveaux');

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nomenclatures & Organisation</h1>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex gap-6 overflow-x-auto">
                    {([
                        { id: 'niveaux' as Onglet, label: 'Niveaux', icon: Layers },
                        { id: 'usages' as Onglet, label: 'Usages', icon: Tag },
                        { id: 'categories' as Onglet, label: 'Catégories', icon: Briefcase },
                        { id: 'niveaux-resp' as Onglet, label: 'Resp.', icon: Star },
                        { id: 'templates' as Onglet, label: 'Templates', icon: FileText },
                        { id: 'generation' as Onglet, label: 'Génération', icon: Play },
                    ]).map((o) => {
                        const Icon = o.icon;
                        return (
                            <button key={o.id} onClick={() => setOngletActif(o.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                    ongletActif === o.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}>
                                <Icon className="h-4 w-4" />
                                {o.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {ongletActif === 'niveaux' && <TabNiveaux canEdit={canEdit} />}
            {ongletActif === 'usages' && <TabUsages canEdit={canEdit} />}
            {ongletActif === 'categories' && <TabCategories canEdit={canEdit} />}
            {ongletActif === 'niveaux-resp' && <TabNiveauxResp canEdit={canEdit} />}
            {ongletActif === 'templates' && <TabTemplates canEdit={canEdit} />}
            {ongletActif === 'generation' && <TabGeneration />}
        </div>
    );
}

// ─── TAB: Niveaux d'Organisation ───

function TabNiveaux({ canEdit }: { canEdit: boolean }) {
    const { data, isLoading } = useNiveauxOrganisation();
    const creer = useCreerNiveauOrganisation();
    const modifier = useModifierNiveauOrganisation();
    const supprimer = useSupprimerNiveauOrganisation();
    const [editing, setEditing] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');
    const [adding, setAdding] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    if (isLoading) return <LoadingState message="Chargement..." />;

    const columns: Column<NiveauOrganisation>[] = [
        { key: 'niveau', header: 'Niveau', render: (n) => <span className="font-mono">{n.niveau}</span> },
        { key: 'label', header: 'Label', render: (n) => editing === n.id
            ? <InlineEdit value={editVal} onSave={(v) => { modifier.mutate({ id: n.id, label: v }); setEditing(null); }} onCancel={() => setEditing(null)} />
            : <span>{n.label}</span> },
        { key: 'description', header: 'Description', render: (n) => n.description || '-' },
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
                <h2 className="text-lg font-semibold">Niveaux d'organisation</h2>
                {canEdit && <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Ajouter</ElisaButton>}
            </div>
            <DataTable columns={columns} data={data || []} />
            {adding && <div className="mt-2"><NiveauAddForm onSave={(v) => { creer.mutate(v); setAdding(false); }} onCancel={() => setAdding(false)} /></div>}
            <ConfirmationModal isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={() => { supprimer.mutate(deleteId!); setDeleteId(null); }}
                title="Supprimer" message="Supprimer ce niveau ?" confirmLabel="Supprimer" cancelLabel="Annuler" variant="danger" />
        </Card>
    );
}

function NiveauAddForm({ onSave, onCancel }: { onSave: (v: any) => void; onCancel: () => void }) {
    const [label, setLabel] = useState('');
    const [niveau, setNiveau] = useState('0');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const doSave = () => {
        if (!label || label.trim().length < 2) { setError('Label : minimum 2 caractères'); return; }
        onSave({ label, niveau: parseInt(niveau), description: description || undefined });
    };
    return (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} className="px-2 py-1 text-sm border rounded w-40 dark:bg-gray-800" />
            <input type="number" placeholder="Niveau" value={niveau} onChange={(e) => setNiveau(e.target.value)} className="px-2 py-1 text-sm border rounded w-20 dark:bg-gray-800" />
            <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="px-2 py-1 text-sm border rounded w-60 dark:bg-gray-800" />
            <button onClick={doSave} className="p-1 text-green-600"><Save className="h-4 w-4" /></button>
            <button onClick={onCancel} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

// ─── TAB: Usages d'unité ───

function TabUsages({ canEdit }: { canEdit: boolean }) {
    const { data, isLoading } = useUsagesUnite();
    const creer = useCreerUsageUnite();
    const modifier = useModifierUsageUnite();
    const supprimer = useSupprimerUsageUnite();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');

    if (isLoading) return <LoadingState message="Chargement..." />;

    const columns: Column<UsageUnite>[] = [
        { key: 'code', header: 'Code', render: (u) => <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{u.code}</span> },
        { key: 'label', header: 'Label', render: (u) => editing === u.id
            ? <InlineEdit value={editVal} onSave={(v) => { modifier.mutate({ id: u.id, label: v }); setEditing(null); }} onCancel={() => setEditing(null)} />
            : <span>{u.label}</span> },
        { key: 'description', header: 'Description', render: (u) => u.description || '-' },
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
                <h2 className="text-lg font-semibold">Usages d'unité</h2>
                {canEdit && <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Ajouter</ElisaButton>}
            </div>
            <DataTable columns={columns} data={data || []} />
            {adding && <div className="mt-2"><UsageAddForm onSave={(v) => { creer.mutate(v); setAdding(false); }} onCancel={() => setAdding(false)} /></div>}
            <ConfirmationModal isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={() => { supprimer.mutate(deleteId!); setDeleteId(null); }}
                title="Supprimer" message="Supprimer cet usage ?" confirmLabel="Supprimer" cancelLabel="Annuler" variant="danger" />
        </Card>
    );
}

function UsageAddForm({ onSave, onCancel }: { onSave: (v: any) => void; onCancel: () => void }) {
    const [code, setCode] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const doSave = () => {
        if (!code || code.trim().length < 2) { setError('Code : minimum 2 caractères'); return; }
        if (!label || label.trim().length < 2) { setError('Label : minimum 2 caractères'); return; }
        onSave({ code, label, description: description || undefined });
    };
    return (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="px-2 py-1 text-sm border rounded w-24 dark:bg-gray-800" />
            <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} className="px-2 py-1 text-sm border rounded w-40 dark:bg-gray-800" />
            <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="px-2 py-1 text-sm border rounded w-60 dark:bg-gray-800" />
            <button onClick={doSave} className="p-1 text-green-600"><Save className="h-4 w-4" /></button>
            <button onClick={onCancel} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

// ─── TAB: Catégories de Poste ───

function TabCategories({ canEdit }: { canEdit: boolean }) {
    const { data, isLoading } = useCategoriesPoste();
    const creer = useCreerCategoriePoste();
    const modifier = useModifierCategoriePoste();
    const supprimer = useSupprimerCategoriePoste();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');

    if (isLoading) return <LoadingState message="Chargement..." />;

    const columns: Column<CategoriePoste>[] = [
        { key: 'code', header: 'Code', render: (c) => <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{c.code}</span> },
        { key: 'label', header: 'Label', render: (c) => editing === c.id
            ? <InlineEdit value={editVal} onSave={(v) => { modifier.mutate({ id: c.id, label: v }); setEditing(null); }} onCancel={() => setEditing(null)} />
            : <span>{c.label}</span> },
        { key: 'description', header: 'Description', render: (c) => c.description || '-' },
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
                <h2 className="text-lg font-semibold">Catégories de poste</h2>
                {canEdit && <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Ajouter</ElisaButton>}
            </div>
            <DataTable columns={columns} data={data || []} />
            {adding && <div className="mt-2"><CategorieAddForm onSave={(v) => { creer.mutate(v); setAdding(false); }} onCancel={() => setAdding(false)} /></div>}
            <ConfirmationModal isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={() => { supprimer.mutate(deleteId!); setDeleteId(null); }}
                title="Supprimer" message="Supprimer cette catégorie ?" confirmLabel="Supprimer" cancelLabel="Annuler" variant="danger" />
        </Card>
    );
}

function CategorieAddForm({ onSave, onCancel }: { onSave: (v: any) => void; onCancel: () => void }) {
    const [code, setCode] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const doSave = () => {
        if (!code || code.trim().length < 2) { setError('Code : minimum 2 caractères'); return; }
        if (!label || label.trim().length < 2) { setError('Label : minimum 2 caractères'); return; }
        onSave({ code, label, description: description || undefined });
    };
    return (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="px-2 py-1 text-sm border rounded w-24 dark:bg-gray-800" />
            <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} className="px-2 py-1 text-sm border rounded w-40 dark:bg-gray-800" />
            <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="px-2 py-1 text-sm border rounded w-60 dark:bg-gray-800" />
            <button onClick={doSave} className="p-1 text-green-600"><Save className="h-4 w-4" /></button>
            <button onClick={onCancel} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

// ─── TAB: Niveaux de Responsabilité ───

function TabNiveauxResp({ canEdit }: { canEdit: boolean }) {
    const { data, isLoading } = useNiveauxResponsabilite();
    const creer = useCreerNiveauResponsabilite();
    const modifier = useModifierNiveauResponsabilite();
    const supprimer = useSupprimerNiveauResponsabilite();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');

    if (isLoading) return <LoadingState message="Chargement..." />;

    const columns: Column<NiveauResponsabilite>[] = [
        { key: 'code', header: 'Code', render: (n) => <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{n.code}</span> },
        { key: 'label', header: 'Label', render: (n) => editing === n.id
            ? <InlineEdit value={editVal} onSave={(v) => { modifier.mutate({ id: n.id, label: v }); setEditing(null); }} onCancel={() => setEditing(null)} />
            : <span>{n.label}</span> },
        { key: 'niveau', header: 'Niveau', render: (n) => <span className="font-mono">{n.niveau}</span> },
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
                <h2 className="text-lg font-semibold">Niveaux de responsabilité</h2>
                {canEdit && <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Ajouter</ElisaButton>}
            </div>
            <DataTable columns={columns} data={data || []} />
            {adding && <div className="mt-2"><NiveauRespAddForm onSave={(v) => { creer.mutate(v); setAdding(false); }} onCancel={() => setAdding(false)} /></div>}
            <ConfirmationModal isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={() => { supprimer.mutate(deleteId!); setDeleteId(null); }}
                title="Supprimer" message="Supprimer ce niveau ?" confirmLabel="Supprimer" cancelLabel="Annuler" variant="danger" />
        </Card>
    );
}

function NiveauRespAddForm({ onSave, onCancel }: { onSave: (v: any) => void; onCancel: () => void }) {
    const [code, setCode] = useState('');
    const [label, setLabel] = useState('');
    const [niveau, setNiveau] = useState('0');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const doSave = () => {
        if (!code || code.trim().length < 2) { setError('Code : minimum 2 caractères'); return; }
        if (!label || label.trim().length < 2) { setError('Label : minimum 2 caractères'); return; }
        onSave({ code, label, niveau: parseInt(niveau), description: description || undefined });
    };
    return (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="px-2 py-1 text-sm border rounded w-24 dark:bg-gray-800" />
            <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} className="px-2 py-1 text-sm border rounded w-40 dark:bg-gray-800" />
            <input type="number" placeholder="Niveau" value={niveau} onChange={(e) => setNiveau(e.target.value)} className="px-2 py-1 text-sm border rounded w-20 dark:bg-gray-800" />
            <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="px-2 py-1 text-sm border rounded w-40 dark:bg-gray-800" />
            <button onClick={doSave} className="p-1 text-green-600"><Save className="h-4 w-4" /></button>
            <button onClick={onCancel} className="p-1 text-gray-400"><X className="h-4 w-4" /></button>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
    );
}

// ─── TAB: Templates ───

function TabTemplates({ canEdit }: { canEdit: boolean }) {
    const { data, isLoading } = useTemplatesOrganisation();
    const creer = useCreerTemplateOrganisation();
    const modifier = useModifierTemplateOrganisation();
    const supprimer = useSupprimerTemplateOrganisation();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);

    if (isLoading) return <LoadingState message="Chargement..." />;

    const columns: Column<TemplateOrganisation>[] = [
        { key: 'nom', header: 'Nom', render: (t) => editing === t.id
            ? <InlineEdit value={editVal} onSave={(v) => { modifier.mutate({ id: t.id, nom: v }); setEditing(null); }} onCancel={() => setEditing(null)} />
            : <span className="font-medium">{t.nom}</span> },
        { key: 'description', header: 'Description', render: (t) => t.description || '-' },
        { key: 'actif', header: 'Statut', render: (t) => t.actif ? <Badge variant="success">Actif</Badge> : <Badge variant="secondary">Inactif</Badge> },
        { key: 'systeme', header: '', render: (t) => <BadgeSysteme estSysteme={t.estSysteme} /> },
        ...(canEdit ? [{
            key: 'actions' as string, header: '',
            render: (t: TemplateOrganisation) => (
                <div className="flex gap-2">
                    <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} className="p-1 text-gray-600 hover:text-gray-800">
                        <FileText className="h-4 w-4" />
                    </button>
                    {!t.estSysteme && <>
                        <button onClick={() => { setEditing(t.id); setEditVal(t.nom); }} className="p-1 text-blue-600"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(t.id)} className="p-1 text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </>}
                </div>
            ),
        }] : []),
    ];

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Templates d'organisation</h2>
                {canEdit && <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Ajouter</ElisaButton>}
            </div>
            <DataTable columns={columns} data={data || []} />
            {expanded && data?.find(t => t.id === expanded) && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border text-xs font-mono overflow-auto max-h-48">
                    <pre>{JSON.stringify(data.find(t => t.id === expanded)?.structure, null, 2)}</pre>
                </div>
            )}
            {adding && <div className="mt-2"><TemplateAddForm onSave={(v) => { creer.mutate(v); setAdding(false); }} onCancel={() => setAdding(false)} /></div>}
            <ConfirmationModal isOpen={!!deleteId} onCancel={() => setDeleteId(null)} onConfirm={() => { supprimer.mutate(deleteId!); setDeleteId(null); }}
                title="Supprimer" message="Supprimer ce template ?" confirmLabel="Supprimer" cancelLabel="Annuler" variant="danger" />
        </Card>
    );
}

function TemplateAddForm({ onSave, onCancel }: { onSave: (v: any) => void; onCancel: () => void }) {
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
            setError('Le nom doit contenir au moins 2 caractères');
            return;
        }
        try {
            const parsed = JSON.parse(structure);
            onSave({ nom, description: description || undefined, structure: parsed });
        } catch {
            setError('JSON invalide');
        }
    };

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded space-y-2">
            <div className="flex items-center gap-2">
                <input placeholder="Nom du template" value={nom} onChange={(e) => setNom(e.target.value)} className="px-2 py-1 text-sm border rounded w-60 dark:bg-gray-800" />
                <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="px-2 py-1 text-sm border rounded w-80 dark:bg-gray-800" />
            </div>
            <textarea value={structure} onChange={(e) => { setStructure(e.target.value); setError(''); }}
                className="w-full h-32 px-2 py-1 text-xs font-mono border rounded dark:bg-gray-800 dark:border-gray-600" />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
                <button onClick={handleSave} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Créer</button>
                <button onClick={onCancel} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">Annuler</button>
            </div>
        </div>
    );
}

// ─── TAB: Génération ───

function TabGeneration() {
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
            onSuccess: (data) => setResult(data),
        });
    };

    return (
        <Card>
            <h2 className="text-lg font-semibold mb-4">Générer une organisation</h2>
            <div className="space-y-4 max-w-xl">
                <div>
                    <label className="block text-sm font-medium mb-1">Template</label>
                    <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600">
                        <option value="">Sélectionner un template...</option>
                        {(templates || []).map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Organisation cible</label>
                    <select value={organisationId} onChange={(e) => setOrganisationId(e.target.value)}
                        className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600">
                        <option value="">Sélectionner une organisation...</option>
                        {(organisations?.items || []).map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Préfixe code</label>
                        <input value={prefixeCode} onChange={(e) => setPrefixeCode(e.target.value)}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600" placeholder="Optionnel" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mode conflit</label>
                        <select value={modeConflit} onChange={(e) => setModeConflit(e.target.value as any)}
                            className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-600">
                            <option value="ERROR">Erreur</option>
                            <option value="SKIP">Ignorer</option>
                            <option value="OVERWRITE">Écraser</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center gap-2 pb-2">
                            <input type="checkbox" checked={creerHierarchie} onChange={(e) => setCreerHierarchie(e.target.checked)}
                                className="rounded border-gray-300" />
                            <span className="text-sm">Créer hiérarchie</span>
                        </label>
                    </div>
                </div>
                <ElisaButton variant="primary" icon={<Play className="h-4 w-4" />}
                    onClick={handleGenerate} disabled={!templateId || !organisationId || generer.isPending}>
                    {generer.isPending ? 'Génération en cours...' : 'Générer'}
                </ElisaButton>

                {result && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded space-y-3">
                        <h3 className="font-semibold text-green-800 dark:text-green-300">Résultat de la génération</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm text-center">
                                <p className="text-2xl font-bold text-blue-600">{result.unitesCrees}</p>
                                <p className="text-xs text-gray-500">Unités créées</p>
                            </div>
                            <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm text-center">
                                <p className="text-2xl font-bold text-purple-600">{result.postesCrees}</p>
                                <p className="text-xs text-gray-500">Postes créés</p>
                            </div>
                            <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm text-center">
                                <p className="text-2xl font-bold text-green-600">{result.hierarchiesCrees}</p>
                                <p className="text-xs text-gray-500">Hiérarchies créées</p>
                            </div>
                        </div>
                        <details>
                            <summary className="text-sm cursor-pointer text-gray-600 hover:text-gray-800">Voir le détail</summary>
                            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto max-h-48">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </Card>
    );
}

// ─── Card wrapper ───

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            {children}
        </div>
    );
}
