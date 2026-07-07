import { useEffect, useState, useMemo } from 'react';
import { Save, Settings, Info } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { useToutesClasses } from '@/features/classes/hooks/use-toutes-classes';
import { useConfigurationEffective } from '../hooks/use-matieres';
import type { ConfigurationMatiereClasse } from '../types/matiere.types';

interface ConfigurationFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    matiereId: string;
    matiereNom: string;
    config?: ConfigurationMatiereClasse | null;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

export function ConfigurationFormModal({
    open, onOpenChange, matiereId, matiereNom,
    config, onSave, isLoading,
}: ConfigurationFormModalProps) {
    const { data: classes, isLoading: classesLoading } = useToutesClasses();

    const [classeAnneeId, setClasseAnneeId] = useState('');
    const [coefficient, setCoefficient] = useState<number | ''>('');
    const [bareme, setBareme] = useState<number | ''>('');
    const [volumeHoraireHebdo, setVolumeHoraireHebdo] = useState<number | ''>('');
    const [credits, setCredits] = useState<number | ''>('');
    const [obligatoire, setObligatoire] = useState(true);
    const [notes, setNotes] = useState('');

    const selectedClasseAnneeId = config?.classeAnneeId ?? classeAnneeId;
    const effectiveQuery = useConfigurationEffective(matiereId, selectedClasseAnneeId || null);

    const defaultValue = useMemo(() => {
        if (!effectiveQuery.data) return null;
        return effectiveQuery.data.defaults;
    }, [effectiveQuery.data]);

    useEffect(() => {
        if (config) {
            setClasseAnneeId(config.classeAnneeId);
            setCoefficient(config.coefficient ?? '');
            setBareme(config.bareme ?? '');
            setVolumeHoraireHebdo(config.volumeHoraireHebdo ?? '');
            setCredits(config.credits ?? '');
            setObligatoire(config.obligatoire);
            setNotes(config.notes ?? '');
        } else {
            setClasseAnneeId('');
            setCoefficient('');
            setBareme('');
            setVolumeHoraireHebdo('');
            setCredits('');
            setObligatoire(true);
            setNotes('');
        }
    }, [config, open]);

    const classesList = useMemo(() => {
        if (!classes) return [];
        return classes.filter((c) => c.classeAnneeId).sort((a, b) => a.nom.localeCompare(b.nom));
    }, [classes]);

    const selectedClasse = useMemo(() => {
        return classesList.find(c => c.classeAnneeId === selectedClasseAnneeId);
    }, [classesList, selectedClasseAnneeId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClasseAnneeId) return;

        const idClasse = selectedClasseAnneeId;
        const payload: any = {
            classeAnneeId: idClasse,
        };
        if (coefficient !== '') payload.coefficient = Number(coefficient);
        if (bareme !== '') payload.bareme = Number(bareme);
        if (volumeHoraireHebdo !== '') payload.volumeHoraireHebdo = Number(volumeHoraireHebdo);
        if (credits !== '') payload.credits = Number(credits);
        payload.obligatoire = obligatoire;
        if (notes) payload.notes = notes;

        onSave(payload);
    };

    const titre = config ? `Modifier la configuration — ${selectedClasse?.nom || ''}` : 'Ajouter une configuration';
    const description = config
        ? `Modifier la configuration de ${matiereNom} pour ${selectedClasse?.nom || 'cette classe'}`
        : `Configurer ${matiereNom} pour une classe spécifique`;

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={titre}
            description={description}
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)} type="button">
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        type="submit"
                        isLoading={isLoading}
                        icon={<Save className="h-4 w-4" />}
                        disabled={!selectedClasseAnneeId}
                        onClick={handleSubmit}
                    >
                        {config ? 'Enregistrer' : 'Créer'}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {!config && (
                    <ElisaSelect
                        label="Classe / Année scolaire"
                        value={classeAnneeId}
                        onValueChange={(v) => { setClasseAnneeId(v); setCoefficient(''); setBareme(''); setVolumeHoraireHebdo(''); setCredits(''); }}
                        placeholder="Sélectionner une classe..."
                        disabled={classesLoading}
                        options={classesList.map((c) => ({
                            value: c.classeAnneeId!,
                            label: `${c.nom} ${c.niveau?.nom ? `– ${c.niveau.nom}` : ''}${c.anneeScolaire ? ` (${c.anneeScolaire.libelle})` : ''}`,
                        }))}
                    />
                )}

                {selectedClasseAnneeId && effectiveQuery.isLoading && (
                    <div className="py-4 text-center text-sm text-gray-500">
                        Chargement de la configuration effective...
                    </div>
                )}

                {selectedClasseAnneeId && defaultValue && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                            <Info className="h-4 w-4 shrink-0" />
                            <span>
                                Configuration pour <strong>{selectedClasse?.nom}</strong>
                                {selectedClasse?.anneeScolaire?.libelle && ` (${selectedClasse.anneeScolaire.libelle})`}.
                                Les champs laissés vides héritent des valeurs du programme ({defaultValue.source}).
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Coefficient
                                    {defaultValue.coefficient != null && (
                                        <span className="ml-2 text-xs text-gray-400">(hérité: {defaultValue.coefficient})</span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={coefficient}
                                    onChange={(e) => setCoefficient(e.target.value ? Number(e.target.value) : '')}
                                    placeholder={defaultValue.coefficient != null ? `Hérité: ${defaultValue.coefficient}` : 'Coefficient'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Barème
                                    {defaultValue.bareme != null && (
                                        <span className="ml-2 text-xs text-gray-400">(hérité: /{defaultValue.bareme})</span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    value={bareme}
                                    onChange={(e) => setBareme(e.target.value ? Number(e.target.value) : '')}
                                    placeholder={defaultValue.bareme != null ? `Hérité: ${defaultValue.bareme}` : 'Barème'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Volume horaire hebdo (h)
                                    {defaultValue.volumeHoraire != null && (
                                        <span className="ml-2 text-xs text-gray-400">(hérité: {defaultValue.volumeHoraire}h)</span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={volumeHoraireHebdo}
                                    onChange={(e) => setVolumeHoraireHebdo(e.target.value ? Number(e.target.value) : '')}
                                    placeholder={defaultValue.volumeHoraire != null ? `Hérité: ${defaultValue.volumeHoraire}h` : 'Volume horaire'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Crédits
                                    {defaultValue.credits != null && (
                                        <span className="ml-2 text-xs text-gray-400">(hérité: {defaultValue.credits})</span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={credits}
                                    onChange={(e) => setCredits(e.target.value ? Number(e.target.value) : '')}
                                    placeholder={defaultValue.credits != null ? `Hérité: ${defaultValue.credits}` : 'Crédits'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="obligatoire"
                                    checked={obligatoire}
                                    onChange={(e) => setObligatoire(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="obligatoire" className="text-sm font-medium text-gray-700">
                                    Matière obligatoire
                                </label>
                                {defaultValue.obligatoire !== obligatoire && (
                                    <span className="text-xs text-gray-400">(défaut: {defaultValue.obligatoire ? 'Oui' : 'Non'})</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Commentaires sur cette configuration..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                            <Settings className="h-4 w-4 shrink-0" />
                            <span>
                                Seules les valeurs explicitement renseignées surchargent le programme. Les champs vides conservent les valeurs par défaut.
                                {config && ' Les valeurs actuelles de la configuration sont pré-remplies.'}
                            </span>
                        </div>
                    </div>
                )}
            </form>
        </CustomModal>
    );
}
