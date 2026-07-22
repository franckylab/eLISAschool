import { useEffect, useState } from 'react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Briefcase } from 'lucide-react';
import { useToutesFonctions } from '../hooks/use-fonctions';
import { useTypePersonnelOptions } from '@/features/personnel/hooks/use-types-personnel';
import type { Fonction } from '../types/fonction.types';

interface FonctionFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fonction?: Fonction | null;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

export function FonctionFormModal({ open, onOpenChange, fonction, onSave, isLoading }: FonctionFormModalProps) {
    const { data: allFonctions } = useToutesFonctions();
    const typePersonnelOptions = useTypePersonnelOptions();
    const [nom, setNom] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [parentId, setParentId] = useState<string>('');
    const [ordre, setOrdre] = useState(1);
    const [typePersonnelId, setTypePersonnelId] = useState<string>('');
    const [majorationDefaut, setMajorationDefaut] = useState<string>('');
    const [actif, setActif] = useState(true);

    useEffect(() => {
        if (fonction) {
            setNom(fonction.nom);
            setCode(fonction.code);
            setDescription(fonction.description || '');
            setParentId(fonction.parentId || '');
            setOrdre(fonction.ordre);
            setTypePersonnelId(fonction.typePersonnelId || '');
            setMajorationDefaut(fonction.majorationDefaut != null ? String(fonction.majorationDefaut) : '');
            setActif(fonction.actif);
        } else {
            setNom('');
            setCode('');
            setDescription('');
            setParentId('');
            setOrdre(1);
            setTypePersonnelId('');
            setMajorationDefaut('');
            setActif(true);
        }
    }, [fonction, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nom.trim() || !code.trim()) return;

        onSave({
            nom: nom.trim(),
            code: code.trim(),
            description: description.trim() || undefined,
            parentId: parentId || null,
            ordre,
            typePersonnelId: typePersonnelId || null,
            majorationDefaut: majorationDefaut ? Number(majorationDefaut) : null,
            actif,
        });
    };

    const racines = allFonctions?.filter(f => !f.parentId && f.id !== fonction?.id) || [];
    const renderOptions = (list: Fonction[], depth: number = 0): React.ReactNode => {
        return list
            .filter(f => f.actif)
            .map(f => (
                <optgroup key={f.id} label={`${'  '.repeat(depth)}${f.nom} (${f.code})`}>
                    <option value={f.id}>{'  '.repeat(depth)}{f.nom}</option>
                    {allFonctions?.filter(e => e.parentId === f.id && e.actif).map(e => (
                        <option key={e.id} value={e.id}>
                            {'  '.repeat(depth + 1)}{e.nom}
                        </option>
                    ))}
                </optgroup>
            ));
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={fonction ? 'Modifier la fonction' : 'Créer une fonction'}
            description={fonction ? 'Modifiez les informations de la fonction' : 'Ajoutez une nouvelle fonction'}
            size="lg"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!nom.trim() || !code.trim() || isLoading}
                        icon={<Briefcase className="h-4 w-4" />}
                    >
                        {isLoading ? 'Enregistrement...' : fonction ? 'Modifier' : 'Créer'}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Ex: PROF_MATH, COMPTABLE"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                            maxLength={50}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Fonction parente
                        </label>
                        <select
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        >
                            <option value="">Aucune (racine)</option>
                            {renderOptions(racines)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        placeholder="Ex: Professeur de Mathématiques"
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        required
                        maxLength={150}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description de la fonction..."
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                        rows={3}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        Type de personnel (statut)
                    </label>
                    <select
                        value={typePersonnelId}
                        onChange={(e) => setTypePersonnelId(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                    >
                        <option value="">Aucun</option>
                        {typePersonnelOptions
                            .filter((o) => o.actif !== false)
                            .map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Détermine le type attendu des postes liés à cette fonction (ex. Professeur ⟹ Enseignant).
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Ordre</label>
                        <input
                            type="number"
                            value={ordre}
                            onChange={(e) => setOrdre(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            min={0}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Majoration %</label>
                        <input
                            type="number"
                            value={majorationDefaut}
                            onChange={(e) => setMajorationDefaut(e.target.value)}
                            placeholder="Ex: 15"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            min={0}
                            max={100}
                            step={0.5}
                        />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                        <input
                            type="checkbox"
                            id="actif"
                            checked={actif}
                            onChange={(e) => setActif(e.target.checked)}
                            className="w-4 h-4 rounded border-input"
                        />
                        <label htmlFor="actif" className="text-sm font-medium text-foreground">
                            Actif
                        </label>
                    </div>
                </div>
            </form>
        </CustomModal>
    );
}
