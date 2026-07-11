import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Plus, Trash2 } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useAnneeScolaireActive } from '@/features/annees-scolaires';
import { usePeriodes } from '@/features/periodes';
import type { ProgrammeChapitre, StatutChapitre, RessourcePedagogique } from '../types/programme.types';

const TYPE_RESSOURCES = ['MANUEL', 'VIDEO', 'DOCUMENT', 'LIEN'] as const;

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
        periodeId?: string;
        prerequis?: string[];
        ressourcesPedagogiques?: RessourcePedagogique[];
        competencesAssociees?: string[];
    }) => Promise<void>;
    chapitre?: ProgrammeChapitre | null;
    isLoading?: boolean;
}

export function ChapitreFormModal({ open, onClose, onSubmit, chapitre, isLoading }: ChapitreFormModalProps) {
    const { t } = useTranslation('programmes');
    const { data: anneeActive } = useAnneeScolaireActive();
    const { data: periodes } = usePeriodes({ anneeId: anneeActive?.id || '' });

    const [titre, setTitre] = useState('');
    const [description, setDescription] = useState('');
    const [objectifsPedagogiques, setObjectifsPedagogiques] = useState('');
    const [ordre, setOrdre] = useState(0);
    const [dureePrevueHeures, setDureePrevueHeures] = useState<number | ''>('');
    const [statut, setStatut] = useState<StatutChapitre>('ACTIF');
    const [periodeId, setPeriodeId] = useState('');
    const [prerequis, setPrerequis] = useState('');
    const [ressources, setRessources] = useState<RessourcePedagogique[]>([]);
    const [competencesAssociees, setCompetencesAssociees] = useState('');

    useEffect(() => {
        if (chapitre) {
            setTitre(chapitre.titre);
            setDescription(chapitre.description || '');
            setObjectifsPedagogiques(chapitre.objectifsPedagogiques || '');
            setOrdre(chapitre.ordre);
            setDureePrevueHeures(chapitre.dureePrevueHeures ?? '');
            setStatut(chapitre.statut);
            setPeriodeId(chapitre.periodeId || '');
            setPrerequis(chapitre.prerequis?.join(', ') || '');
            setRessources(chapitre.ressourcesPedagogiques || []);
            setCompetencesAssociees(chapitre.competencesAssociees?.join(', ') || '');
        } else {
            setTitre('');
            setDescription('');
            setObjectifsPedagogiques('');
            setOrdre(0);
            setDureePrevueHeures('');
            setStatut('ACTIF');
            setPeriodeId('');
            setPrerequis('');
            setRessources([]);
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
            periodeId: periodeId || undefined,
            prerequis: prerequis ? prerequis.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            ressourcesPedagogiques: ressources.length > 0 ? ressources : undefined,
            competencesAssociees: competencesAssociees ? competencesAssociees.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        });
    };

    const ajouterRessource = () => {
        setRessources([...ressources, { type: 'DOCUMENT', titre: '', url: '' }]);
    };

    const modifierRessource = (index: number, field: keyof RessourcePedagogique, value: string) => {
        const copy = [...ressources];
        (copy[index] as any)[field] = value;
        setRessources(copy);
    };

    const supprimerRessource = (index: number) => {
        setRessources(ressources.filter((_, i) => i !== index));
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
                        <label className="block text-sm font-medium mb-1">{t('periode')}</label>
                        <select value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent">
                            <option value="">— Aucune période —</option>
                            {(periodes || []).map((p: any) => (
                                <option key={p.id} value={p.id}>{p.nom}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                {/* Ressources pédagogiques */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium">{t('ressources')}</label>
                        <button type="button" onClick={ajouterRessource} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <Plus className="h-3 w-3" /> Ajouter
                        </button>
                    </div>
                    {ressources.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Aucune ressource</p>
                    ) : (
                        <div className="space-y-2">
                            {ressources.map((r, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                        <select
                                            value={r.type}
                                            onChange={(e) => modifierRessource(i, 'type', e.target.value)}
                                            className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                                        >
                                            {TYPE_RESSOURCES.map((t) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <input
                                            value={r.titre}
                                            onChange={(e) => modifierRessource(i, 'titre', e.target.value)}
                                            className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                                            placeholder="Titre"
                                        />
                                        <input
                                            value={r.url || ''}
                                            onChange={(e) => modifierRessource(i, 'url', e.target.value)}
                                            className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                                            placeholder="URL (optionnel)"
                                        />
                                    </div>
                                    <button type="button" onClick={() => supprimerRessource(i)} className="p-1 hover:bg-red-100 rounded mt-0.5">
                                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </form>
        </CustomModal>
    );
}
