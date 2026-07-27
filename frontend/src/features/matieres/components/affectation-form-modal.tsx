import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Save, Search } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { usePersonnel } from '@/features/personnel/hooks/use-personnel';
import { useToutesClasses } from '@/features/classes/hooks/use-toutes-classes';
import type { AffectationPayload } from '../hooks/use-matieres';
import type { AffectationMatiere } from '../types/matiere.types';
import type { MembrePersonnel } from '@/features/personnel/types/personnel.types';
import type { Classe } from '@/features/classes/types/classe.types';

interface AffectationFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    matiereId: string;
    affectation?: AffectationMatiere | null;
    onSave: (data: AffectationPayload) => void;
    isLoading?: boolean;
}

export function AffectationFormModal({ open, onOpenChange, matiereId, affectation, onSave, isLoading }: AffectationFormModalProps) {
    const { t } = useTranslation('matieres');
    const [enseignantId, setEnseignantId] = useState('');
    const [classeAnneeId, setClasseAnneeId] = useState('');
    const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
    const [dateFin, setDateFin] = useState('');
    const [rechercheEnseignant, setRechercheEnseignant] = useState('');

    const { data: personnel, isLoading: personnelLoading } = usePersonnel({
        actif: true,
        recherche: rechercheEnseignant || undefined,
        limit: 50,
    });
    const { data: classes, isLoading: classesLoading } = useToutesClasses();

    const enseignants: MembrePersonnel[] = personnel?.items || [];
    const classesList: Classe[] = classes || [];

    useEffect(() => {
        if (affectation) {
            setEnseignantId(affectation.enseignantId || '');
            setClasseAnneeId(affectation.classeAnneeId || '');
            setDateDebut(affectation.dateDebut || new Date().toISOString().split('T')[0]);
            setDateFin(affectation.dateFin || '');
        } else {
            setEnseignantId('');
            setClasseAnneeId('');
            setDateDebut(new Date().toISOString().split('T')[0]);
            setDateFin('');
        }
    }, [affectation, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!enseignantId || !classeAnneeId) return;
        onSave({
            matiereId,
            enseignantId,
            classeAnneeId,
            dateDebut,
            ...(dateFin ? { dateFin } : {}),
        });
    };

    const titre = affectation ? t('affectationModifier') : t('affectationNouvelle');

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={titre}
            description={affectation ? t('affectationModifierDescription') : t('affectationDescription')}
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)} type="button">
                        {t('annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        type="submit"
                        isLoading={isLoading}
                        icon={<Save className="h-4 w-4" />}
                        disabled={!enseignantId || !classeAnneeId}
                        onClick={handleSubmit}
                    >
                        {affectation ? t('enregistrer') : t('affecterEnseignant')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-secondary mb-1">{t('enseignant')}</label>
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('rechercherEnseignant')}
                            value={rechercheEnseignant}
                            onChange={(e) => setRechercheEnseignant(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    {personnelLoading ? (
                        <div className="py-2 text-sm text-muted-foreground">{t('chargementEnseignants')}</div>
                    ) : (
                        <ElisaSelect
                            value={enseignantId}
                            onValueChange={setEnseignantId}
                            placeholder={t('selectionnerEnseignant')}
                            options={enseignants.map((e) => ({
                                value: e.id,
                                label: `${e.utilisateur?.profil?.prenom ?? ''} ${e.utilisateur?.profil?.nom ?? ''}${e.matricule ? ` (${e.matricule})` : ''}`,
                            }))}
                        />
                    )}
                </div>

                <ElisaSelect
                    label={t('classe')}
                    value={classeAnneeId}
                    onValueChange={setClasseAnneeId}
                    placeholder={t('selectionnerClasse')}
                    disabled={classesLoading}
                    options={classesList
                        .filter((c) => c.actif && c.classeAnneeId)
                        .map((c) => ({
                            value: c.classeAnneeId!,
                            label: `${c.nom}${c.niveau ? ` - ${c.niveau.nom}` : ''}`,
                        }))}
                />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">{t('dateDebut')}</label>
                        <input
                            type="date"
                            value={dateDebut}
                            onChange={(e) => setDateDebut(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">{t('dateFin')}</label>
                        <input
                            type="date"
                            value={dateFin}
                            onChange={(e) => setDateFin(e.target.value)}
                            min={dateDebut}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg text-sm text-primary">
                    <UserPlus className="h-4 w-4 shrink-0" />
                    <span>{t('infoAffectation')}</span>
                </div>
            </form>
        </CustomModal>
    );
}
