import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Search, BookOpen, Percent, Calendar } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { useToutesClasses } from '@/features/classes/hooks/use-toutes-classes';
import { useMatieres } from '@/features/matieres/hooks/use-matieres';
import type { AffectationEnseignant, AffectationPayload } from '../../types/personnel.types';
import type { Classe } from '@/features/classes/types/classe.types';
import type { Matiere } from '@/features/matieres/types/matiere.types';

interface AffectationFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    enseignantId: string;
    affectation?: AffectationEnseignant | null;
    onSave: (data: AffectationPayload) => void;
    isLoading?: boolean;
}

export function AffectationFormModal({
    open, onOpenChange, enseignantId, affectation, onSave, isLoading,
}: AffectationFormModalProps) {
    const { t } = useTranslation('personnel');
    const [matiereId, setMatiereId] = useState('');
    const [classeAnneeId, setClasseAnneeId] = useState('');
    const [coefficient, setCoefficient] = useState('');
    const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
    const [dateFin, setDateFin] = useState('');
    const [rechercheMatiere, setRechercheMatiere] = useState('');

    const { data: matieresData, isLoading: matieresLoading } = useMatieres({
        actif: true,
        recherche: rechercheMatiere || undefined,
        limit: 100,
    });
    const { data: classes, isLoading: classesLoading } = useToutesClasses();

    const matieresList: Matiere[] = matieresData?.items || [];
    const classesList: Classe[] = classes || [];

    useEffect(() => {
        if (affectation) {
            setMatiereId(affectation.matiereId);
            setClasseAnneeId(affectation.classeAnneeId);
            setCoefficient(affectation.coefficient != null && affectation.coefficient !== 1 ? String(affectation.coefficient) : '');
            setDateDebut(affectation.dateDebut || new Date().toISOString().split('T')[0]);
            setDateFin(affectation.dateFin || '');
        } else {
            setMatiereId('');
            setClasseAnneeId('');
            setCoefficient('');
            setDateDebut(new Date().toISOString().split('T')[0]);
            setDateFin('');
        }
    }, [affectation, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!matiereId || !classeAnneeId) return;
        const payload: AffectationPayload = {
            matiereId,
            classeAnneeId,
            enseignantId,
            dateDebut,
        };
        if (dateFin) payload.dateFin = dateFin;
        if (coefficient) payload.coefficient = parseFloat(coefficient);
        onSave(payload);
    };

    const estEdition = !!affectation;

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={estEdition ? t('affectations.modifierAffectation') : t('affectations.ajouterMatiere')}
            description={estEdition
                ? t('affectations.descModifier')
                : t('affectations.descAjouter')}
            size="2xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)} type="button">
                        {t('form.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        type="submit"
                        isLoading={isLoading}
                        icon={<Save className="h-4 w-4" />}
                        disabled={!matiereId || !classeAnneeId}
                        onClick={handleSubmit}
                    >
                        {estEdition ? t('form.enregistrer') : t('affectations.ajouter')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4 text-primary" />
                            {t('affectations.colMatiere')}
                        </span>
                    </label>
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('affectations.rechercherMatiere')}
                            value={rechercheMatiere}
                            onChange={(e) => setRechercheMatiere(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-card text-foreground"
                        />
                    </div>
                    {matieresLoading ? (
                        <div className="py-2 text-sm text-muted-foreground">{t('affectations.chargement')}</div>
                    ) : (
                        <ElisaSelect
                            value={matiereId}
                            onValueChange={setMatiereId}
                            placeholder={t('affectations.selectionnerMatiere')}
                            options={matieresList.map((m) => ({
                                value: m.id,
                                label: `${m.nom}${m.code ? ` (${m.code})` : ''}`,
                            }))}
                        />
                    )}
                </div>

                <ElisaSelect
                    label={t('affectations.colClasse')}
                    value={classeAnneeId}
                    onValueChange={setClasseAnneeId}
                    placeholder={t('affectations.selectionnerClasse')}
                    disabled={classesLoading}
                    options={classesList
                        .filter((c) => c.actif && c.classeAnneeId)
                        .map((c) => ({
                            value: c.classeAnneeId!,
                            label: `${c.nom}${c.niveau ? ` - ${c.niveau.nom}` : ''}${c.anneeScolaire ? ` (${c.anneeScolaire.libelle})` : ''}`,
                        }))}
                />

                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        <span className="inline-flex items-center gap-1.5">
                            <Percent className="h-4 w-4 text-warning" />
                            {t('affectations.colCoeff')} <span className="text-xs font-normal text-muted-foreground">({t('affectations.coeffOptionnel')})</span>
                        </span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={coefficient}
                        onChange={(e) => setCoefficient(e.target.value)}
                        placeholder={t('affectations.coeffPlaceholder')}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-card text-foreground"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-success" />
                                {t('affectations.dateDebut')}
                            </span>
                        </label>
                        <input
                            type="date"
                            value={dateDebut}
                            onChange={(e) => setDateDebut(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-card text-foreground"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t('affectations.dateFinOptionnelle')}</label>
                        <input
                            type="date"
                            value={dateFin}
                            onChange={(e) => setDateFin(e.target.value)}
                            min={dateDebut}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-card text-foreground"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg text-sm text-primary">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>{t('affectations.infoProgramme')}</span>
                </div>
            </form>
        </CustomModal>
    );
}
