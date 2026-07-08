import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { ProgrammeChapitre, StatutChapitre } from '../types/programme.types';

interface ChapitreFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (dto: {
        titre: string;
        description?: string;
        objectifsPedagogiques?: string;
        ordre?: number;
        dureePrevueHeures?: number;
        statut?: StatutChapitre;
        prerequis?: string[];
        ressourcesPedagogiques?: { type: string; titre: string; url?: string }[];
        competencesAssociees?: string[];
    }) => Promise<void>;
    chapitre?: ProgrammeChapitre | null;
    isLoading?: boolean;
}

export function ChapitreFormModal({ open, onClose, onSubmit, chapitre, isLoading }: ChapitreFormModalProps) {
    const { t } = useTranslation('programmes');
    const [titre, setTitre] = useState('');
    const [description, setDescription] = useState('');
    const [objectifsPedagogiques, setObjectifsPedagogiques] = useState('');
    const [ordre, setOrdre] = useState(0);
    const [dureePrevueHeures, setDureePrevueHeures] = useState<number | ''>('');
    const [statut, setStatut] = useState<StatutChapitre>('ACTIF');
    const [prerequis, setPrerequis] = useState('');
    const [competencesAssociees, setCompetencesAssociees] = useState('');

    useEffect(() => {
        if (chapitre) {
            setTitre(chapitre.titre);
            setDescription(chapitre.description || '');
            setObjectifsPedagogiques(chapitre.objectifsPedagogiques || '');
            setOrdre(chapitre.ordre);
            setDureePrevueHeures(chapitre.dureePrevueHeures ?? '');
            setStatut(chapitre.statut);
            setPrerequis(chapitre.prerequis?.join(', ') || '');
            setCompetencesAssociees(chapitre.competencesAssociees?.join(', ') || '');
        } else {
            setTitre('');
            setDescription('');
            setObjectifsPedagogiques('');
            setOrdre(0);
            setDureePrevueHeures('');
            setStatut('ACTIF');
            setPrerequis('');
            setCompetencesAssociees('');
        }
    }, [chapitre, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titre.trim()) return;
        await onSubmit({
            titre: titre.trim(),
            description: description.trim() || undefined,
            objectifsPedagogiques: objectifsPedagogiques.trim() || undefined,
            ordre,
            dureePrevueHeures: dureePrevueHeures || undefined,
            statut,
            prerequis: prerequis ? prerequis.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            competencesAssociees: competencesAssociees ? competencesAssociees.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        });
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title={chapitre ? t('modifierChapitre') : t('nouveauChapitre')}
            size="lg"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onClose} disabled={isLoading}>
                        {t('annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        disabled={!titre.trim()}
                        icon={<Save className="h-4 w-4" />}
                    >
                        {chapitre ? t('enregistrer') : t('creer')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('titre')} <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={titre}
                        onChange={(e) => setTitre(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        placeholder="Titre du chapitre"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('ordre')}</label>
                        <input
                            type="number"
                            min={0}
                            value={ordre}
                            onChange={(e) => setOrdre(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('dureePrevue')}</label>
                        <input
                            type="number"
                            min={0}
                            value={dureePrevueHeures}
                            onChange={(e) => setDureePrevueHeures(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                            placeholder="ex: 3"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('statut')}</label>
                        <select value={statut} onChange={(e) => setStatut(e.target.value as StatutChapitre)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent">
                            <option value="ACTIF">{t('statutChapitre.ACTIF')}</option>
                            <option value="EN_ATTENTE_VALIDATION">{t('statutChapitre.EN_ATTENTE_VALIDATION')}</option>
                            <option value="INACTIF">{t('statutChapitre.INACTIF')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('prerequis')}</label>
                        <input
                            type="text"
                            value={prerequis}
                            onChange={(e) => setPrerequis(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                            placeholder="Ex: Chap1, Chap2"
                        />
                    </div>
                </div>

                <div>
                        <label className="block text-sm font-medium mb-1">{t('description')}</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        rows={2}
                        placeholder="Description du chapitre"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">{t('objectifsPedagogiques')}</label>
                    <textarea
                        value={objectifsPedagogiques}
                        onChange={(e) => setObjectifsPedagogiques(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        rows={2}
                        placeholder="Objectifs pédagogiques"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">{t('competencesAssociees')}</label>
                    <input
                        type="text"
                        value={competencesAssociees}
                        onChange={(e) => setCompetencesAssociees(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        placeholder="Ex: C1, C2, C3"
                    />
                </div>
            </form>
        </CustomModal>
    );
}
