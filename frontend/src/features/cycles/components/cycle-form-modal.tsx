/**
 * ==================================
 * eLISAschool - Modal Formulaire Cycle
 * ==================================
 * Version: 3.0.0 (refactorisé - TypeCycle supprimé)
 * Auteur: franck arlos chendjou
 * 
 * Modal de création/modification de cycle avec nouveaux champs fusionnés
 */

import { useEffect, useState } from 'react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { School } from 'lucide-react';
import type { Cycle } from '../types/cycle.types';

interface CycleFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cycle?: Cycle | null;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

export function CycleFormModal({ open, onOpenChange, cycle, onSave, isLoading }: CycleFormModalProps) {
    const [nom, setNom] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [dureeAnnees, setDureeAnnees] = useState(0);
    const [diplomeSanctionnant, setDiplomeSanctionnant] = useState('');
    const [ordre, setOrdre] = useState(1);
    const [actif, setActif] = useState(true);

    useEffect(() => {
        if (cycle) {
            setNom(cycle.nom);
            setCode(cycle.code);
            setDescription(cycle.description || '');
            setDureeAnnees(cycle.dureeAnnees || 0);
            setDiplomeSanctionnant(cycle.diplomeSanctionnant || '');
            setOrdre(cycle.ordre);
            setActif(cycle.actif);
        } else {
            setNom('');
            setCode('');
            setDescription('');
            setDureeAnnees(0);
            setDiplomeSanctionnant('');
            setOrdre(1);
            setActif(true);
        }
    }, [cycle, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!nom.trim() || !code.trim()) {
            return;
        }

        onSave({
            nom: nom.trim(),
            code: code.trim(),
            description: description.trim() || undefined,
            dureeAnnees: dureeAnnees || 0,
            diplomeSanctionnant: diplomeSanctionnant.trim() || undefined,
            ordre,
            actif,
        });
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={cycle ? 'Modifier le cycle' : 'Créer un cycle'}
            description={cycle ? 'Modifiez les informations du cycle' : 'Ajoutez un nouveau cycle d\'enseignement'}
            size="xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!nom.trim() || !code.trim() || isLoading}
                        icon={<School className="h-4 w-4" />}
                    >
                        {isLoading ? 'Enregistrement...' : cycle ? 'Modifier' : 'Créer'}
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
                            placeholder="Ex: MATERNELLE, PRIMAIRE"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                            maxLength={50}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Ordre <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={ordre}
                            onChange={(e) => setOrdre(parseInt(e.target.value) || 1)}
                            placeholder="1"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                            min={1}
                        />
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
                        placeholder="Ex: Enseignement Primaire"
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
                        placeholder="Description du cycle..."
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                        rows={2}
                        maxLength={500}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Durée (années)
                        </label>
                        <input
                            type="number"
                            value={dureeAnnees}
                            onChange={(e) => setDureeAnnees(parseInt(e.target.value) || 0)}
                            placeholder="6"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            min={0}
                            max={10}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Ex: 3 (Maternelle), 6 (Primaire), 4 (Secondaire 1), 3 (Secondaire 2)
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Diplôme sanctionnant
                        </label>
                        <input
                            type="text"
                            value={diplomeSanctionnant}
                            onChange={(e) => setDiplomeSanctionnant(e.target.value.toUpperCase())}
                            placeholder="Ex: CEP, BEPC, BACCALAUREAT"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            maxLength={50}
                        />
                    </div>
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
                        Cycle actif
                    </label>
                </div>
            </form>
        </CustomModal>
    );
}
