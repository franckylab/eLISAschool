/**
 * ==================================
 * eLISAschool - Modal Formulaire Filière
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useEffect, useState } from 'react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { BookOpen } from 'lucide-react';
import { useTousCycles } from '@/features/cycles/hooks/use-tous-cycles';
import type { Filiere } from '../types/filiere.types';

interface FiliereFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filiere?: Filiere | null;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

export function FiliereFormModal({ open, onOpenChange, filiere, onSave, isLoading }: FiliereFormModalProps) {
    const { data: cycles } = useTousCycles();
    
    const [nom, setNom] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [cycleId, setCycleId] = useState('');
    const [sousSysteme, setSousSysteme] = useState<'FRANCOPHONE' | 'ANGLOPHONE'>('FRANCOPHONE');
    const [actif, setActif] = useState(true);

    useEffect(() => {
        if (filiere) {
            setNom(filiere.nom);
            setCode(filiere.code);
            setDescription(filiere.description || '');
            setCycleId(filiere.cycleId);
            setSousSysteme(filiere.sousSysteme as any);
            setActif(filiere.actif);
        } else {
            setNom('');
            setCode('');
            setDescription('');
            setCycleId('');
            setSousSysteme('FRANCOPHONE');
            setActif(true);
        }
    }, [filiere, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!nom.trim() || !code.trim() || !cycleId) {
            return;
        }

        onSave({
            nom: nom.trim(),
            code: code.trim(),
            description: description.trim() || undefined,
            cycleId,
            sousSysteme,
            actif,
        });
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={filiere ? 'Modifier la filière' : 'Créer une filière'}
            description={filiere ? 'Modifiez les informations de la filière' : 'Ajoutez une nouvelle filière'}
            size="lg"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!nom.trim() || !code.trim() || !cycleId || isLoading}
                        icon={<BookOpen className="h-4 w-4" />}
                    >
                        {isLoading ? 'Enregistrement...' : filiere ? 'Modifier' : 'Créer'}
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
                            placeholder="Ex: C, D, E, A, A1"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                            maxLength={50}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Cycle <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={cycleId}
                            onChange={(e) => setCycleId(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                        >
                            <option value="">Sélectionner un cycle</option>
                            {cycles?.map((cycle) => (
                                <option key={cycle.id} value={cycle.id}>{cycle.nom}</option>
                            ))}
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
                        placeholder="Ex: Série C - Mathématiques et Physique"
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        required
                        maxLength={100}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description de la filière..."
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                        rows={3}
                        maxLength={500}
                    />
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
