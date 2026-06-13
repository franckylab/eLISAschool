/**
 * ==================================
 * eLISAschool - Modal Formulaire Examen National
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useEffect, useState } from 'react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { FileText } from 'lucide-react';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import type { ExamenNational } from '../types/examen-national.types';

interface ExamenNationalFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    examen?: ExamenNational | null;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

export function ExamenNationalFormModal({ open, onOpenChange, examen, onSave, isLoading }: ExamenNationalFormModalProps) {
    const { data: niveaux } = useTousNiveaux();
    
    const [nom, setNom] = useState('');
    const [code, setCode] = useState('');
    const [type, setType] = useState<'NATIONAL' | 'REGIONAL' | 'INTERNATIONAL'>('NATIONAL');
    const [niveauId, setNiveauId] = useState('');
    const [diplomeDelivre, setDiplomeDelivre] = useState('');
    const [sousSysteme, setSousSysteme] = useState<'FRANCOPHONE' | 'ANGLOPHONE'>('FRANCOPHONE');
    const [estObligatoire, setEstObligatoire] = useState(true);
    const [coefficient, setCoefficient] = useState<number>();
    const [description, setDescription] = useState('');
    const [actif, setActif] = useState(true);

    useEffect(() => {
        if (examen) {
            setNom(examen.nom);
            setCode(examen.code);
            setType(examen.type as any);
            setNiveauId(examen.niveauId);
            setDiplomeDelivre(examen.diplomeDelivre || '');
            setSousSysteme(examen.sousSysteme as any);
            setEstObligatoire(examen.estObligatoire);
            setCoefficient(examen.coefficient);
            setDescription(examen.description || '');
            setActif(examen.actif);
        } else {
            setNom('');
            setCode('');
            setType('NATIONAL');
            setNiveauId('');
            setDiplomeDelivre('');
            setSousSysteme('FRANCOPHONE');
            setEstObligatoire(true);
            setCoefficient(undefined);
            setDescription('');
            setActif(true);
        }
    }, [examen, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!nom.trim() || !code.trim() || !niveauId) {
            return;
        }

        onSave({
            nom: nom.trim(),
            code: code.trim(),
            type,
            niveauId,
            diplomeDelivre: diplomeDelivre.trim() || undefined,
            sousSysteme,
            estObligatoire,
            coefficient: coefficient || undefined,
            description: description.trim() || undefined,
            actif,
        });
    };

    // Filtrer les niveaux selon le sous-système
    const niveauxFiltres = niveaux?.filter(n => (n as any).sousSysteme === sousSysteme) || [];

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={examen ? 'Modifier l\'examen national' : 'Créer un examen national'}
            description={examen ? 'Modifiez les informations de l\'examen' : 'Ajoutez un nouvel examen national'}
            size="xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!nom.trim() || !code.trim() || !niveauId || isLoading}
                        icon={<FileText className="h-4 w-4" />}
                    >
                        {isLoading ? 'Enregistrement...' : examen ? 'Modifier' : 'Créer'}
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
                            placeholder="Ex: BACCALAUREAT, BEPC"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                            maxLength={50}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        >
                            <option value="NATIONAL">National</option>
                            <option value="REGIONAL">Régional</option>
                            <option value="INTERNATIONAL">International</option>
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
                        placeholder="Ex: BACCALAURÉAT, GCE Advanced Level"
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        required
                        maxLength={100}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Niveau <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={niveauId}
                            onChange={(e) => setNiveauId(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                        >
                            <option value="">Sélectionner un niveau</option>
                            {niveauxFiltres.map((niveau) => (
                                <option key={niveau.id} value={niveau.id}>
                                    {niveau.nom} ({niveau.code})
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Les niveaux affichés correspondent au sous-système sélectionné
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Diplôme délivré</label>
                        <input
                            type="text"
                            value={diplomeDelivre}
                            onChange={(e) => setDiplomeDelivre(e.target.value.toUpperCase())}
                            placeholder="Ex: BACCALAUREAT"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            maxLength={100}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Sous-système</label>
                        <select
                            value={sousSysteme}
                            onChange={(e) => setSousSysteme(e.target.value as any)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        >
                            <option value="FRANCOPHONE">Francophone</option>
                            <option value="ANGLOPHONE">Anglophone</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Coefficient</label>
                        <input
                            type="number"
                            value={coefficient || ''}
                            onChange={(e) => setCoefficient(e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="Optionnel"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            min="0"
                            step="0.5"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description de l'examen..."
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                        rows={2}
                        maxLength={500}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="estObligatoire"
                            checked={estObligatoire}
                            onChange={(e) => setEstObligatoire(e.target.checked)}
                            className="w-4 h-4 rounded border-input"
                        />
                        <label htmlFor="estObligatoire" className="text-sm font-medium text-foreground">
                            Examen obligatoire
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
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
