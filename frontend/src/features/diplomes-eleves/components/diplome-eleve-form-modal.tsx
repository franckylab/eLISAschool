/**
 * ==================================
 * eLISAschool - Modal Formulaire Diplôme Élève
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useEffect, useState } from 'react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { GraduationCap } from 'lucide-react';
import type { DiplomeEleve } from '../types/diplome-eleve.types';

interface DiplomeEleveFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    diplome?: DiplomeEleve | null;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

export function DiplomeEleveFormModal({ open, onOpenChange, diplome, onSave, isLoading }: DiplomeEleveFormModalProps) {
    const [eleveId, setEleveId] = useState('');
    const [examenNationalId, setExamenNationalId] = useState('');
    const [numeroDiplome, setNumeroDiplome] = useState('');
    const [dateObtention, setDateObtention] = useState('');
    const [noteObtenue, setNoteObtenue] = useState<number>();
    const [mention, setMention] = useState('');
    const [dateDelivrance, setDateDelivrance] = useState('');
    const [observations, setObservations] = useState('');
    const [actif, setActif] = useState(true);

    useEffect(() => {
        if (diplome) {
            setEleveId(diplome.eleveId);
            setExamenNationalId(diplome.examenNationalId);
            setNumeroDiplome(diplome.numeroDiplome || '');
            setDateObtention(diplome.dateObtention ? new Date(diplome.dateObtention).toISOString().split('T')[0] : '');
            setNoteObtenue(diplome.noteObtenue);
            setMention(diplome.mention || '');
            setDateDelivrance(diplome.dateObtention ? new Date(diplome.dateObtention).toISOString().split('T')[0] : '');
            setObservations(diplome.observations || '');
        } else {
            setEleveId('');
            setExamenNationalId('');
            setNumeroDiplome('');
            setDateObtention('');
            setNoteObtenue(undefined);
            setMention('');
            setDateDelivrance('');
            setObservations('');
            setActif(true);
        }
    }, [diplome, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!eleveId || !examenNationalId) {
            return;
        }

        onSave({
            eleveId,
            examenNationalId,
            numeroDiplome: numeroDiplome.trim() || undefined,
            dateObtention: dateObtention || undefined,
            noteObtenue: noteObtenue || undefined,
            mention: mention.trim() || undefined,
            dateDelivrance: dateDelivrance || undefined,
            observations: observations.trim() || undefined,
            actif,
        });
    };

    const mentions = [
        'Passable',
        'Assez Bien',
        'Bien',
        'Très Bien',
        'Excellent',
        'Très Honorable',
    ];

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={diplome ? 'Modifier le diplôme' : 'Enregistrer un diplôme'}
            description={diplome ? 'Modifiez les informations du diplôme' : 'Enregistrez un nouveau diplôme obtenu par un élève'}
            size="xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!eleveId || !examenNationalId || isLoading}
                        icon={<GraduationCap className="h-4 w-4" />}
                    >
                        {isLoading ? 'Enregistrement...' : diplome ? 'Modifier' : 'Enregistrer'}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Élève <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={eleveId}
                            onChange={(e) => setEleveId(e.target.value)}
                            placeholder="ID de l'élève"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            TODO: Remplacer par dropdown avec useEleves
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Examen <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={examenNationalId}
                            onChange={(e) => setExamenNationalId(e.target.value)}
                            placeholder="ID de l'examen"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            TODO: Remplacer par dropdown avec useExamensNationaux
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">N° Diplôme</label>
                        <input
                            type="text"
                            value={numeroDiplome}
                            onChange={(e) => setNumeroDiplome(e.target.value)}
                            placeholder="Ex: BAC2024-001"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            maxLength={50}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Date d'obtention</label>
                        <input
                            type="date"
                            value={dateObtention}
                            onChange={(e) => setDateObtention(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Note obtenue</label>
                        <input
                            type="number"
                            value={noteObtenue || ''}
                            onChange={(e) => setNoteObtenue(e.target.value ? parseFloat(e.target.value) : undefined)}
                            placeholder="Ex: 15.5"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            min="0"
                            max="20"
                            step="0.25"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Mention</label>
                        <select
                            value={mention}
                            onChange={(e) => setMention(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        >
                            <option value="">Aucune</option>
                            {mentions.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Date de délivrance</label>
                    <input
                        type="date"
                        value={dateDelivrance}
                        onChange={(e) => setDateDelivrance(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Observations</label>
                    <textarea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Observations éventuelles..."
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                        rows={3}
                        maxLength={500}
                    />
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
                        Diplôme validé
                    </label>
                </div>
            </form>
        </CustomModal>
    );
}
