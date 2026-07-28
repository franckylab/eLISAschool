import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, BookOpen } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { useProgrammes } from '../hooks/use-programmes';
import { useTousMatieresNiveaux } from '@/features/matieres/hooks/use-matieres';
import { useAjouterMatiereProgramme } from '@/features/matieres/hooks/use-matieres';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ProgrammeMatiereModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    matiereId: string;
    matiereNom: string;
    programmeIds?: string[];
    existingMatieres?: Array<{ matiereNiveauId: string; programmeId: string }>;
}

export function ProgrammeMatiereModal({
    open, onOpenChange, matiereId, matiereNom,
    programmeIds, existingMatieres,
}: ProgrammeMatiereModalProps) {
    const { t } = useTranslation('programmes');
    const queryClient = useQueryClient();
    const { data: programmesData } = useProgrammes({ actif: true, limit: 100 });
    const { data: matieresNiveaux } = useTousMatieresNiveaux();
    const ajouter = useAjouterMatiereProgramme();

    const programmeList = programmesData?.items || [];
    const mnList = matieresNiveaux || [];

    const [selectedProgrammeId, setSelectedProgrammeId] = useState('');
    const [selectedMnId, setSelectedMnId] = useState('');
    const [coefficient, setCoefficient] = useState<number | ''>('');
    const [obligatoire, setObligatoire] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProgrammeId || !selectedMnId) {
            toast.error(t('selectionnerProgrammeMatiere', 'Veuillez sélectionner un programme et une matière'));
            return;
        }

        await ajouter.mutateAsync({
            programmeId: selectedProgrammeId,
            matiereNiveauId: selectedMnId,
            coefficient: coefficient !== '' ? Number(coefficient) : undefined,
            obligatoire,
        });

        queryClient.invalidateQueries({ queryKey: ['matieres', 'programmes-pedagogiques', matiereId] });
        onOpenChange(false);
        setSelectedProgrammeId('');
        setSelectedMnId('');
        setCoefficient('');
        setObligatoire(true);
    };

    const filteredMn = mnList.filter(mn =>
        mn.matiereId === matiereId &&
        !existingMatieres?.some(em => em.matiereNiveauId === mn.id)
    );

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('ajouterAuxProgrammes', 'Ajouter aux programmes pédagogiques')}
            description={t('ajouterMatiereAProgramme', 'Ajouter {{matiere}} à un programme pédagogique', { matiere: matiereNom })}
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)} type="button">
                        {t('annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        type="submit"
                        isLoading={ajouter.isPending}
                        icon={<Save className="h-4 w-4" />}
                        disabled={!selectedProgrammeId || !selectedMnId}
                        onClick={handleSubmit}
                    >
                        {t('ajouter')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <ElisaSelect
                    label={t('programmePedagogique', 'Programme pédagogique')}
                    value={selectedProgrammeId}
                    onValueChange={setSelectedProgrammeId}
                    placeholder={t('selectionnerProgramme', 'Sélectionner un programme...')}
                    options={programmeList
                        .filter(p => !programmeIds?.includes(p.id))
                        .map(p => ({
                            value: p.id,
                            label: `${p.nom} (${p.code})${p.niveau ? ` - ${p.niveau.nom}` : ''}`,
                        }))}
                />

                <ElisaSelect
                    label={t('niveauGroupe', 'Niveau / Groupe')}
                    value={selectedMnId}
                    onValueChange={setSelectedMnId}
                    placeholder={t('selectionnerNiveau', 'Sélectionner un niveau...')}
                    options={filteredMn
                        .sort((a, b) => (a.niveau?.ordre || 0) - (b.niveau?.ordre || 0))
                        .map(mn => ({
                            value: mn.id,
                            label: `${mn.niveau?.nom || 'N/A'} ${mn.groupe ? `- ${mn.groupe.nom}` : ''} ${mn.filiere ? `(${mn.filiere.nom})` : ''}`,
                        }))}
                />

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        {t('coefficientSurcharge', 'Coefficient (surcharge)')}
                    </label>
                    <input
                        type="number" step="0.5" min="0"
                        value={coefficient}
                        onChange={(e) => setCoefficient(e.target.value ? Number(e.target.value) : '')}
                        placeholder={t('heriteMatiereNiveau', 'Hérité du MatiereNiveau')}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-card"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox" id="pm-obligatoire"
                        checked={obligatoire}
                        onChange={(e) => setObligatoire(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
                    />
                    <label htmlFor="pm-obligatoire" className="text-sm font-medium text-foreground">
                        {t('matiereObligatoire', 'Matière obligatoire dans ce programme')}
                    </label>
                </div>

                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg text-sm text-primary border border-primary/20">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>
                        {t('champsVidesHérité', 'Les champs laissés vides héritent des valeurs définies dans')} <strong>MatiereNiveau</strong>.
                        {t('utilisezSurcharges', ' Utilisez les surcharges pour personnaliser cette matière dans le programme.')}
                    </span>
                </div>
            </form>
        </CustomModal>
    );
}
