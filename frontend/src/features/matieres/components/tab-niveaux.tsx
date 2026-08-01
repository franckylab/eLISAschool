import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Plus, Edit, Trash2, CheckCircle, XCircle, Save, X } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { InlineSpinner } from '@/components/feedback';
import { formatVolumeMinutesToHours } from '@/lib/format-utils';
import { usePermissions } from '@/hooks';
import { useAjouterMatiereNiveau, useModifierMatiereNiveau, useSupprimerMatiereNiveau } from '../hooks/use-matieres';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import { useToutesFilieres } from '@/features/filieres/hooks/use-filieres';
import type { MatiereNiveau } from '../types/matiere.types';
import type { Niveau } from '@/features/niveaux/types/niveau.types';

interface TabNiveauxProps {
    matiereNiveaux: MatiereNiveau[] | undefined;
    isLoading: boolean;
    matiereId: string;
    matiereNom: string;
}

export function TabNiveaux({ matiereNiveaux, isLoading, matiereId, matiereNom }: TabNiveauxProps) {
    const { t } = useTranslation('matieres');
    const { hasPermission } = usePermissions();
    const { data: niveaux = [] } = useTousNiveaux();
    const { data: toutesFilieres = [] } = useToutesFilieres();
    const ajouter = useAjouterMatiereNiveau();
    const modifier = useModifierMatiereNiveau();
    const supprimer = useSupprimerMatiereNiveau();

    const canWrite = hasPermission('config:edit') || hasPermission('programmes:config:write');

    const [showAddForm, setShowAddForm] = useState(false);
    const [addNiveauId, setAddNiveauId] = useState('');
    const [addCoeff, setAddCoeff] = useState<number | ''>(1);
    const [addBareme, setAddBareme] = useState<number | ''>(20);
    const [addVol, setAddVol] = useState<number | ''>('');
    const [addOblig, setAddOblig] = useState(true);
    const [addFiliereId, setAddFiliereId] = useState('');

    const [editId, setEditId] = useState<string | null>(null);
    const [editCoeff, setEditCoeff] = useState<number | ''>('');
    const [editBareme, setEditBareme] = useState<number | ''>('');
    const [editVol, setEditVol] = useState<number | ''>('');
    const [editOblig, setEditOblig] = useState(true);

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const existingNiveauIds = new Set(matiereNiveaux?.map(mn => mn.niveauId) || []);
    const niveauxDisponibles = niveaux.filter((n: Niveau) => !existingNiveauIds.has(n.id));

    const handleAdd = async () => {
        if (!addNiveauId) return;
        await ajouter.mutateAsync({
            matiereId,
            niveauId: addNiveauId,
            coefficient: addCoeff !== '' ? Number(addCoeff) : undefined,
            bareme: addBareme !== '' ? Number(addBareme) : undefined,
            volumeHoraire: addVol !== '' ? Number(addVol) : undefined,
            obligatoire: addOblig,
            filiereId: addFiliereId || undefined,
        });
        setShowAddForm(false);
        setAddNiveauId('');
        setAddCoeff(1);
        setAddBareme(20);
        setAddVol('');
        setAddOblig(true);
        setAddFiliereId('');
    };

    const handleStartEdit = (mn: MatiereNiveau) => {
        setEditId(mn.id);
        setEditCoeff(mn.coefficient ?? '');
        setEditBareme(mn.bareme ?? '');
        setEditVol(mn.volumeHoraire ?? '');
        setEditOblig(mn.obligatoire);
    };

    const handleSaveEdit = async () => {
        if (!editId) return;
        await modifier.mutateAsync({
            id: editId,
            matiereId,
            coefficient: editCoeff !== '' ? Number(editCoeff) : undefined,
            bareme: editBareme !== '' ? Number(editBareme) : undefined,
            volumeHoraire: editVol !== '' ? Number(editVol) : undefined,
            obligatoire: editOblig,
        });
        setEditId(null);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        await supprimer.mutateAsync({ id: deleteId, matiereId });
        setDeleteId(null);
    };

    const maxVolume = matiereNiveaux && matiereNiveaux.length > 0
        ? Math.max(...matiereNiveaux.map(p => p.volumeHoraire || 0)) : 0;

    if (isLoading) {
        return <div className="py-12 flex justify-center"><InlineSpinner label={t('chargement')} /></div>;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-[clamp(0.5rem,1.5vw,0.75rem)]">
                        <CardTitle className="flex items-center gap-2 text-[clamp(0.875rem,2.5vw,1.125rem)] shrink-0">
                            <GraduationCap className="h-[clamp(0.875rem,2.5vw,1.125rem)] w-[clamp(0.875rem,2.5vw,1.125rem)] text-[var(--color-dominant-600)] shrink-0" />
                            {t('niveaux')}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-[clamp(0.375rem,1vw,0.5rem)] w-full sm:w-auto">
                            <span className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-text-muted bg-[var(--color-surface-alt)] px-[clamp(0.375rem,1vw,0.625rem)] py-[clamp(0.125rem,0.5vw,0.25rem)] rounded-full shrink-0 leading-tight">
                                {matiereNiveaux?.length || 0} {t('niveau')}(x)
                            </span>
                            {canWrite && !showAddForm && (
                                <ElisaButton variant="primary" size="sm"
                                    icon={<Plus className="h-4 w-4" />}
                                    onClick={() => setShowAddForm(true)}
                                >
                                    {t('ajouterNiveau')}
                                </ElisaButton>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <div className="border-b border-border mx-4 sm:mx-5" />
                <CardContent>
                    <p className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-text-muted mb-[clamp(0.5rem,1.5vw,1rem)]">
                        {t('niveauxLabel', { nom: matiereNom })}
                    </p>

                    {showAddForm && (
                        <div className="bg-[var(--color-surface)] border border-border rounded-lg p-[clamp(0.75rem,2vw,1rem)] space-y-4 mb-[clamp(0.75rem,2vw,1rem)]">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[clamp(0.75rem,1.5vw,0.875rem)] font-semibold text-[var(--color-dominant-600)]">{t('ajouterNiveau')}</h4>
                                <button onClick={() => setShowAddForm(false)}
                                    className="rounded-lg p-[clamp(0.25rem,0.75vw,0.375rem)] text-text-muted hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)] transition-colors"
                                >
                                    <X className="h-[clamp(0.875rem,2vw,1rem)] w-[clamp(0.875rem,2vw,1rem)]" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-[clamp(0.5rem,1.5vw,0.75rem)]">
                                <ElisaSelect
                                    label={t('niveau')}
                                    value={addNiveauId}
                                    onValueChange={setAddNiveauId}
                                    placeholder="Sélectionner..."
                                    options={niveauxDisponibles.map((n: Niveau) => ({
                                        value: n.id,
                                        label: `${n.nom} ${n.filiere ? `(${n.filiere.nom})` : ''}`,
                                    }))}
                                />
                                <div>
                                    <label className="block text-[clamp(0.625rem,1.25vw,0.75rem)] font-medium text-text-secondary mb-[clamp(0.125rem,0.5vw,0.25rem)]">{t('coefficient')}</label>
                                    <input type="number" step="0.5" min="0" value={addCoeff}
                                        onChange={e => setAddCoeff(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full px-[clamp(0.5rem,1.5vw,0.625rem)] py-[clamp(0.375rem,1vw,0.5rem)] border border-border bg-[var(--color-surface)] rounded-lg text-[clamp(0.75rem,1.25vw,0.875rem)] focus:border-[var(--color-dominante)] focus:ring-2 focus:ring-[var(--color-dominante)]/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[clamp(0.625rem,1.25vw,0.75rem)] font-medium text-text-secondary mb-[clamp(0.125rem,0.5vw,0.25rem)]">{t('bareme')}</label>
                                    <input type="number" min="1" value={addBareme}
                                        onChange={e => setAddBareme(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full px-[clamp(0.5rem,1.5vw,0.625rem)] py-[clamp(0.375rem,1vw,0.5rem)] border border-border bg-[var(--color-surface)] rounded-lg text-[clamp(0.75rem,1.25vw,0.875rem)] focus:border-[var(--color-dominante)] focus:ring-2 focus:ring-[var(--color-dominante)]/20 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-[clamp(0.5rem,1.5vw,0.75rem)]">
                                <div>
                                    <label className="block text-[clamp(0.625rem,1.25vw,0.75rem)] font-medium text-text-secondary mb-[clamp(0.125rem,0.5vw,0.25rem)]">{t('volumeHoraireMinutes')}</label>
                                    <input type="number" min="0" value={addVol}
                                        onChange={e => setAddVol(e.target.value ? Number(e.target.value) : '')}
                                        placeholder="Optionnel"
                                        className="w-full px-[clamp(0.5rem,1.5vw,0.625rem)] py-[clamp(0.375rem,1vw,0.5rem)] border border-border bg-[var(--color-surface)] rounded-lg text-[clamp(0.75rem,1.25vw,0.875rem)] focus:border-[var(--color-dominante)] focus:ring-2 focus:ring-[var(--color-dominante)]/20 outline-none"
                                    />
                                </div>
                                <ElisaSelect
                                    label={t('filiere')}
                                    value={addFiliereId}
                                    onValueChange={setAddFiliereId}
                                    placeholder="Optionnel"
                                    options={toutesFilieres.map(f => ({
                                        value: f.id,
                                        label: `${f.nom} (${f.code})`,
                                    }))}
                                />
                                <div className="flex items-end pb-[clamp(0.25rem,0.75vw,0.375rem)]">
                                    <label className="flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] cursor-pointer">
                                        <input type="checkbox" checked={addOblig}
                                            onChange={e => setAddOblig(e.target.checked)}
                                            className="h-[clamp(0.875rem,2vw,1rem)] w-[clamp(0.875rem,2vw,1rem)] rounded border-border text-[var(--color-dominante)] focus:ring-[var(--color-dominante)]"
                                        />
                                        <span className="text-[clamp(0.75rem,1.25vw,0.875rem)] font-medium text-text-secondary">{t('obligatoireLabel')}</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-[clamp(0.375rem,1vw,0.5rem)]">
                                <ElisaButton variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                                    {t('annuler')}
                                </ElisaButton>
                                <ElisaButton variant="primary" size="sm"
                                    isLoading={ajouter.isPending}
                                    disabled={!addNiveauId}
                                    onClick={handleAdd}
                                >
                                    <Save className="h-[clamp(0.875rem,2vw,1rem)] w-[clamp(0.875rem,2vw,1rem)] mr-1" /> {t('enregistrer')}
                                </ElisaButton>
                            </div>
                        </div>
                    )}

                    {!matiereNiveaux || matiereNiveaux.length === 0 ? (
                        <div className="bg-[var(--color-card)] rounded-lg border border-border p-[clamp(1.5rem,5vw,3rem)] text-center">
                            <GraduationCap className="h-[clamp(2rem,6vw,3rem)] w-[clamp(2rem,6vw,3rem)] text-text-muted mx-auto mb-[clamp(0.5rem,2vw,0.75rem)]" />
                            <p className="text-text-secondary font-medium mb-[clamp(0.125rem,0.5vw,0.25rem)] text-[clamp(0.875rem,1.5vw,1rem)]">{t('aucunNiveau')}</p>
                            <p className="text-[clamp(0.75rem,1.25vw,0.875rem)] text-text-muted">{t('niveauxLabel', { nom: matiereNom })}</p>
                        </div>
                    ) : (
                        <div className="bg-[var(--color-card)] rounded-lg border border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[clamp(0.75rem,1.25vw,0.875rem)]">
                                    <thead className="bg-[var(--color-surface-alt)]">
                                        <tr>
                                            <th className="text-left px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] font-medium text-text-secondary">{t('niveau')}</th>
                                            <th className="text-center px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] font-medium text-text-secondary">{t('coefficient')}</th>
                                            <th className="text-center px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] font-medium text-text-secondary">{t('bareme')}</th>
                                            <th className="text-center px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] font-medium text-text-secondary">{t('volumeHoraire')}</th>
                                            <th className="text-center px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] font-medium text-text-secondary">{t('obligatoire')}</th>
                                            <th className="text-center px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] font-medium text-text-secondary">{t('statut')}</th>
                                            {canWrite && <th className="text-center px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] font-medium text-text-secondary">{t('actions')}</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {matiereNiveaux.map(mn => {
                                            const isEditing = editId === mn.id;
                                            return (
                                                <tr key={mn.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                                                    <td className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] font-medium">
                                                        {mn.niveau?.nom || mn.niveauId}
                                                        {mn.filiere && <span className="text-text-muted ml-1">({mn.filiere.nom})</span>}
                                                        {mn.groupe && <span className="text-text-muted ml-1">- {mn.groupe.nom}</span>}
                                                    </td>
                                                    {isEditing ? (
                                                        <>
                                                            <td className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] text-center">
                                                                <input type="number" step="0.5" min="0" value={editCoeff}
                                                                    onChange={e => setEditCoeff(e.target.value ? Number(e.target.value) : '')}
                                                                    className="w-[clamp(4rem,8vw,5rem)] px-[clamp(0.25rem,0.75vw,0.375rem)] py-[clamp(0.125rem,0.5vw,0.25rem)] border border-border bg-[var(--color-surface)] rounded text-[clamp(0.75rem,1.25vw,0.875rem)] text-center focus:border-[var(--color-dominante)] focus:ring-2 focus:ring-[var(--color-dominante)]/20 outline-none"
                                                                />
                                                            </td>
                                                            <td className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] text-center">
                                                                <input type="number" min="1" value={editBareme}
                                                                    onChange={e => setEditBareme(e.target.value ? Number(e.target.value) : '')}
                                                                    className="w-[clamp(4rem,8vw,5rem)] px-[clamp(0.25rem,0.75vw,0.375rem)] py-[clamp(0.125rem,0.5vw,0.25rem)] border border-border bg-[var(--color-surface)] rounded text-[clamp(0.75rem,1.25vw,0.875rem)] text-center focus:border-[var(--color-dominante)] focus:ring-2 focus:ring-[var(--color-dominante)]/20 outline-none"
                                                                />
                                                            </td>
                                                            <td className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] text-center">
                                                                <input type="number" min="0" value={editVol}
                                                                    onChange={e => setEditVol(e.target.value ? Number(e.target.value) : '')}
                                                                    placeholder="—"
                                                                    className="w-[clamp(4rem,8vw,5rem)] px-[clamp(0.25rem,0.75vw,0.375rem)] py-[clamp(0.125rem,0.5vw,0.25rem)] border border-border bg-[var(--color-surface)] rounded text-[clamp(0.75rem,1.25vw,0.875rem)] text-center focus:border-[var(--color-dominante)] focus:ring-2 focus:ring-[var(--color-dominante)]/20 outline-none"
                                                                />
                                                            </td>
                                                            <td className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] text-center">
                                                                <input type="checkbox" checked={editOblig}
                                                                    onChange={e => setEditOblig(e.target.checked)}
                                                                    className="h-[clamp(0.875rem,2vw,1rem)] w-[clamp(0.875rem,2vw,1rem)] rounded border-border text-[var(--color-dominante)] focus:ring-[var(--color-dominante)]"
                                                                />
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] text-center font-semibold">{mn.coefficient}</td>
                                                            <td className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] text-center">/ {mn.bareme}</td>
                                                            <td className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] text-center">
                                                                {mn.volumeHoraire ? (
                                                                    <div className="flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] justify-center">
                                                                        <div className="w-[clamp(2rem,6vw,4rem)] h-[clamp(0.375rem,0.75vw,0.5rem)] bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                                                                            <div className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                                                                                style={{ width: `${maxVolume > 0 ? (mn.volumeHoraire / maxVolume) * 100 : 0}%` }} />
                                                                        </div>
                                                                        <span className="text-[clamp(0.625rem,1.25vw,0.75rem)] font-medium text-text-secondary">{formatVolumeMinutesToHours(mn.volumeHoraire)}</span>
                                                                    </div>
                                                                ) : '-'}
                                                            </td>
                                                            <td className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] text-center">
                                                                {mn.obligatoire ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-full px-[clamp(0.25rem,0.75vw,0.375rem)] py-[clamp(0.0625rem,0.25vw,0.125rem)] text-[clamp(0.625rem,1vw,0.75rem)] font-medium bg-success/10 text-success">
                                                                        <CheckCircle className="h-[clamp(0.75rem,1.25vw,0.875rem)] w-[clamp(0.75rem,1.25vw,0.875rem)]" /> {t('obligatoire')}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 rounded-full px-[clamp(0.25rem,0.75vw,0.375rem)] py-[clamp(0.0625rem,0.25vw,0.125rem)] text-[clamp(0.625rem,1vw,0.75rem)] font-medium bg-warning/10 text-warning">
                                                                        <XCircle className="h-[clamp(0.75rem,1.25vw,0.875rem)] w-[clamp(0.75rem,1.25vw,0.875rem)]" /> {t('optionnel')}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] text-center">
                                                        <span className={`rounded-full px-[clamp(0.25rem,0.75vw,0.375rem)] py-[clamp(0.0625rem,0.25vw,0.125rem)] text-[clamp(0.625rem,1vw,0.75rem)] font-medium ${
                                                            mn.statut === 'ACTIF' ? 'bg-success/10 text-success' :
                                                            mn.statut === 'EN_ATTENTE_VALIDATION' ? 'bg-warning/10 text-warning' :
                                                            'bg-muted/10 text-muted-foreground'
                                                        }`}>
                                                            {mn.statut === 'ACTIF' ? t('statutActif') : mn.statut === 'EN_ATTENTE_VALIDATION' ? t('statutEnAttente') : t('statutInactif')}
                                                        </span>
                                                    </td>
                                                    {canWrite && (
                                                        <td className="px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.375rem,1vw,0.5rem)] text-center">
                                                            {isEditing ? (
                                                                <div className="flex items-center justify-center gap-[clamp(0.125rem,0.5vw,0.25rem)]">
                                                                    <button onClick={handleSaveEdit}
                                                                        className="rounded-lg p-[clamp(0.25rem,0.75vw,0.375rem)] text-success hover:bg-success/10 transition-colors"
                                                                        title={t('enregistrer')}
                                                                    >
                                                                        <Save className="h-[clamp(0.875rem,2vw,1rem)] w-[clamp(0.875rem,2vw,1rem)]" />
                                                                    </button>
                                                                    <button onClick={() => setEditId(null)}
                                                                        className="rounded-lg p-[clamp(0.25rem,0.75vw,0.375rem)] text-text-muted hover:bg-[var(--color-surface-hover)] transition-colors"
                                                                        title={t('annuler')}
                                                                    >
                                                                        <X className="h-[clamp(0.875rem,2vw,1rem)] w-[clamp(0.875rem,2vw,1rem)]" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center gap-[clamp(0.125rem,0.5vw,0.25rem)]">
                                                                    <button onClick={() => handleStartEdit(mn)}
                                                                        className="rounded-lg p-[clamp(0.25rem,0.75vw,0.375rem)] text-text-muted hover:text-[var(--color-accent)] hover:bg-accent/10 transition-colors"
                                                                        title={t('modifier')}
                                                                    >
                                                                        <Edit className="h-[clamp(0.875rem,2vw,1rem)] w-[clamp(0.875rem,2vw,1rem)]" />
                                                                    </button>
                                                                    <button onClick={() => setDeleteId(mn.id)}
                                                                        className="rounded-lg p-[clamp(0.25rem,0.75vw,0.375rem)] text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                                                        title={t('supprimer')}
                                                                    >
                                                                        <Trash2 className="h-[clamp(0.875rem,2vw,1rem)] w-[clamp(0.875rem,2vw,1rem)]" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <ConfirmationModal
                isOpen={!!deleteId}
                title={t('retirerNiveau')}
                message={t('retirerNiveauMessage')}
                details={t('retirerNiveauDetails')}
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
