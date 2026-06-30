/**
 * ==================================
 * eLISAschool - Formulaire Classe (2 étapes)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Formulaire en 2 étapes :
 * - Étape 1 : Modèle de classe (nom, code, niveau, filière, type, créneau)
 * - Étape 2 : Instance annuelle (année scolaire, professeur principal, salle, effectif max)
 *
 * Corrections :
 * - Typage strict (pas de any)
 * - Responsive design complet
 * - i18n complet
 * - Validation par étape
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, ChevronRight, ChevronLeft } from 'lucide-react';
import { useCreerClasse, useModifierClasse } from '../hooks/use-classes';
import { useToutesAnneesScolaires } from '@/features/annees-scolaires/hooks/use-toutes-annees-scolaires';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import { useToutesFilieres } from '@/features/filieres/hooks/use-filieres';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { useMediaQuery } from '@/hooks/use-media-query';
import type {
    Classe,
    TypeClasse,
    CreneauHoraire,
    CreerClasseModeleDto,
    CreerClasseInstanceDto,
    CreerClasseCompletDto,
} from '../types/classe.types';
import { TypeClasse as TypeClasseEnum, CreneauHoraire as CreneauHoraireEnum } from '../types/classe.types';

interface ClasseFormModalProps {
    mode: 'creation' | 'edition';
    classe?: Classe;
    onSuccess: () => void;
    onCancel: () => void;
}

type EtapeFormulaire = 1 | 2;

interface ErreursFormulaire {
    nom?: string;
    code?: string;
    niveauId?: string;
    anneeScolaireId?: string;
}

export function ClasseFormModal({ mode, classe, onSuccess, onCancel }: ClasseFormModalProps) {
    const { t } = useTranslation('classes');
    const estMobile = useMediaQuery('(max-width: 479px)');
    const creerClasse = useCreerClasse();
    const modifierClasse = useModifierClasse();
    const isLoading = creerClasse.isPending || modifierClasse.isPending;

    // Données de référence
    const { data: anneesScolaires = [] } = useToutesAnneesScolaires();
    const { data: niveaux = [] } = useTousNiveaux();
    const { data: filieres = [] } = useToutesFilieres();

    // État du formulaire
    const [etape, setEtape] = useState<EtapeFormulaire>(1);
    const [erreurs, setErreurs] = useState<ErreursFormulaire>({});

    // Données étape 1 : Modèle de classe
    const [modeleData, setModeleData] = useState<CreerClasseModeleDto>({
        nom: classe?.nom || '',
        code: classe?.code || '',
        niveauId: classe?.niveauId || '',
        filiereId: classe?.filiereId || null,
        typeClasse: classe?.typeClasse || TypeClasseEnum.NORMALE,
        creneauHoraire: classe?.creneauHoraire || CreneauHoraireEnum.MATIN,
        description: classe?.description || '',
    });

    // Données étape 2 : Instance annuelle
    const [instanceData, setInstanceData] = useState<CreerClasseInstanceDto>({
        anneeScolaireId: classe?.anneeScolaireId || '',
        professeurPrincipalId: classe?.professeurPrincipalId || null,
        sallePrincipale: classe?.sallePrincipale || '',
        effectifMax: classe?.effectifMax || 50,
    });

    // Initialisation en mode édition
    useEffect(() => {
        if (classe && mode === 'edition') {
            setModeleData({
                nom: classe.nom,
                code: classe.code || '',
                niveauId: classe.niveauId,
                filiereId: classe.filiereId || null,
                typeClasse: classe.typeClasse,
                creneauHoraire: classe.creneauHoraire,
                description: classe.description || '',
            });
            setInstanceData({
                anneeScolaireId: classe.anneeScolaireId || '',
                professeurPrincipalId: classe.professeurPrincipalId || null,
                sallePrincipale: classe.sallePrincipale || '',
                effectifMax: classe.effectifMax || 50,
            });
        }
    }, [classe, mode]);

    // Déterminer si le niveau sélectionné est du 2nd cycle (pour afficher les filières)
    const niveauSelectionne = niveaux.find(
        (n: { id: string; cycle?: { code: string } }) => n.id === modeleData.niveauId
    );
    const estSecondCycle = niveauSelectionne?.cycle?.code === 'LYCEE';

    // Options pour les selects
    const optionsNiveaux = niveaux.map((n: { id: string; nom: string }) => ({
        value: n.id,
        label: n.nom,
    }));

    const optionsFilieres = filieres.map((f: { id: string; nom: string; code: string }) => ({
        value: f.id,
        label: `${f.nom} (${f.code})`,
    }));

    const optionsAnneesScolaires = anneesScolaires.map((a: { id: string; libelle: string; statut: string }) => ({
        value: a.id,
        label: `${a.libelle} (${a.statut === 'active' ? t('annee.enCours') : t('annee.cloturee')})`,
    }));

    const optionsTypesClasse = [
        { value: TypeClasseEnum.NORMALE, label: t('types.normale') },
        { value: TypeClasseEnum.BILINGUE, label: t('types.bilingue') },
        { value: TypeClasseEnum.RENFORCEE, label: t('types.renforcee') },
        { value: TypeClasseEnum.INTERNATIONALE, label: t('types.internationale') },
    ];

    const optionsCreneaux = [
        { value: CreneauHoraireEnum.MATIN, label: t('creneaux.matin') },
        { value: CreneauHoraireEnum.APRES_MIDI, label: t('creneaux.apresMidi') },
        { value: CreneauHoraireEnum.JOURNEE_COMPLETE, label: t('creneaux.journeeComplete') },
    ];

    // Validation étape 1
    const validerEtape1 = (): boolean => {
        const nouvellesErreurs: ErreursFormulaire = {};

        if (!modeleData.nom?.trim()) {
            nouvellesErreurs.nom = t('validation.nomRequis');
        }
        if (!modeleData.niveauId) {
            nouvellesErreurs.niveauId = t('validation.niveauRequis');
        }

        setErreurs(nouvellesErreurs);
        return Object.keys(nouvellesErreurs).length === 0;
    };

    // Validation étape 2 (seulement en mode création)
    const validerEtape2 = (): boolean => {
        const nouvellesErreurs: ErreursFormulaire = {};

        if (mode === 'creation' && !instanceData.anneeScolaireId) {
            nouvellesErreurs.anneeScolaireId = t('validation.anneeRequise');
        }

        setErreurs(nouvellesErreurs);
        return Object.keys(nouvellesErreurs).length === 0;
    };

    // Navigation entre étapes
    const allerEtape2 = () => {
        if (validerEtape1()) {
            setEtape(2);
        }
    };

    const retournerEtape1 = () => {
        setErreurs({});
        setEtape(1);
    };

    // Soumission finale
    const handleSubmit = async () => {
        if (mode === 'creation' && !validerEtape2()) return;

        try {
            if (mode === 'creation') {
                // En création, on envoie les données combinées (modèle + instance)
                await creerClasse.mutateAsync({
                    ...modeleData,
                    ...instanceData,
                } as CreerClasseCompletDto);
            } else if (classe) {
                // En édition, on met à jour le modèle permanent
                await modifierClasse.mutateAsync({
                    id: classe.id,
                    ...modeleData,
                });
            }
            onSuccess();
        } catch {
            // L'erreur est gérée par le hook
        }
    };

    // Handlers typés pour les changements
    const handleChangeModele = (field: keyof CreerClasseModeleDto, value: string | null) => {
        setModeleData(prev => ({ ...prev, [field]: value }));
        if (erreurs[field as keyof ErreursFormulaire]) {
            setErreurs(prev => {
                const next = { ...prev };
                delete next[field as keyof ErreursFormulaire];
                return next;
            });
        }
    };

    const handleChangeInstance = (field: keyof CreerClasseInstanceDto, value: string | number | null) => {
        setInstanceData(prev => ({ ...prev, [field]: value }));
        if (erreurs[field as keyof ErreursFormulaire]) {
            setErreurs(prev => {
                const next = { ...prev };
                delete next[field as keyof ErreursFormulaire];
                return next;
            });
        }
    };

    const titre = mode === 'creation'
        ? t('formulaire.creerTitre')
        : t('formulaire.modifierTitre');

    const description = mode === 'creation'
        ? t('formulaire.creerDescription', { etape, total: 2 })
        : t('formulaire.modifierDescription');

    // Footer dynamique selon l'étape
    const footer = mode === 'creation' && etape === 1 ? (
        <>
            <ElisaButton variant="outline" onClick={onCancel}>
                {t('boutons.annuler')}
            </ElisaButton>
            <ElisaButton
                variant="primary"
                onClick={allerEtape2}
                icon={<ChevronRight className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
            >
                {t('boutons.suivant')}
            </ElisaButton>
        </>
    ) : (
        <>
            <ElisaButton variant="outline" onClick={onCancel}>
                {t('boutons.annuler')}
            </ElisaButton>
            {mode === 'creation' && etape === 2 && (
                <ElisaButton
                    variant="outline"
                    onClick={retournerEtape1}
                    icon={<ChevronLeft className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                >
                    {t('boutons.precedent')}
                </ElisaButton>
            )}
            <ElisaButton
                variant="primary"
                isLoading={isLoading}
                icon={<Save className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                onClick={handleSubmit}
            >
                {mode === 'creation' ? t('boutons.creer') : t('boutons.enregistrer')}
            </ElisaButton>
        </>
    );

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={titre}
            description={description}
            size="2xl"
            footer={footer}
        >
            <div className="space-y-[var(--space-md)]">
                {/* Indicateur d'étape (mode création) */}
                {mode === 'creation' && (
                    <div className="flex items-center gap-[var(--gap-sm)] mb-[var(--space-md)]">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            etape >= 1
                                ? 'bg-[var(--color-dominant-600)] text-white'
                                : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]'
                        }`}>
                            1
                        </div>
                        <div className={`flex-1 h-1 rounded ${etape >= 2 ? 'bg-[var(--color-dominant-600)]' : 'bg-[var(--color-surface-secondary)]'}`} />
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            etape >= 2
                                ? 'bg-[var(--color-dominant-600)] text-white'
                                : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]'
                        }`}>
                            2
                        </div>
                    </div>
                )}

                {/* Étape 1 : Modèle de classe */}
                {(mode === 'edition' || etape === 1) && (
                    <div className="space-y-[var(--space-md)]">
                        <h3
                            className="font-semibold text-[var(--color-text-primary)]"
                            style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.0625rem)' }}
                        >
                            {t('formulaire.titreModele')}
                        </h3>

                        {/* Nom et Code */}
                        <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                            <ElisaInput
                                label={t('champs.nom')}
                                value={modeleData.nom || ''}
                                onChange={(value) => handleChangeModele('nom', value as string)}
                                error={erreurs.nom}
                                placeholder={t('champs.nomPlaceholder')}
                                required
                            />
                            <ElisaInput
                                label={t('champs.code')}
                                value={modeleData.code || ''}
                                onChange={(value) => handleChangeModele('code', value as string)}
                                error={erreurs.code}
                                placeholder={t('champs.codePlaceholder')}
                            />
                        </div>

                        {/* Niveau et Filière */}
                        <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                            <ElisaSelect
                                label={t('champs.niveau')}
                                value={modeleData.niveauId || ''}
                                onValueChange={(value) => handleChangeModele('niveauId', value)}
                                error={erreurs.niveauId}
                                options={optionsNiveaux}
                                placeholder={t('champs.selectionnerNiveau')}
                                required
                            />
                            {estSecondCycle && (
                                <ElisaSelect
                                    label={t('champs.filiere')}
                                    value={modeleData.filiereId || ''}
                                    onValueChange={(value) => handleChangeModele('filiereId', value || null)}
                                    options={optionsFilieres}
                                    placeholder={t('champs.selectionnerFiliere')}
                                />
                            )}
                        </div>

                        {/* Type de classe et Créneau horaire */}
                        <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                            <ElisaSelect
                                label={t('champs.typeClasse')}
                                value={modeleData.typeClasse || TypeClasseEnum.NORMALE}
                                onValueChange={(value) => handleChangeModele('typeClasse', value as TypeClasse)}
                                options={optionsTypesClasse}
                            />
                            <ElisaSelect
                                label={t('champs.creneauHoraire')}
                                value={modeleData.creneauHoraire || CreneauHoraireEnum.MATIN}
                                onValueChange={(value) => handleChangeModele('creneauHoraire', value as CreneauHoraire)}
                                options={optionsCreneaux}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
                                style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                            >
                                {t('champs.description')}
                            </label>
                            <textarea
                                value={modeleData.description || ''}
                                onChange={(e) => handleChangeModele('description', e.target.value)}
                                placeholder={t('champs.descriptionPlaceholder')}
                                rows={3}
                                className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] resize-none focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent"
                                style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}
                            />
                        </div>
                    </div>
                )}

                {/* Étape 2 : Instance annuelle (mode création uniquement) */}
                {mode === 'creation' && etape === 2 && (
                    <div className="space-y-[var(--space-md)]">
                        <h3
                            className="font-semibold text-[var(--color-text-primary)]"
                            style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.0625rem)' }}
                        >
                            {t('formulaire.titreInstance')}
                        </h3>

                        {/* Année scolaire et Salle */}
                        <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                            <ElisaSelect
                                label={t('champs.anneeScolaire')}
                                value={instanceData.anneeScolaireId || ''}
                                onValueChange={(value) => handleChangeInstance('anneeScolaireId', value)}
                                error={erreurs.anneeScolaireId}
                                options={optionsAnneesScolaires}
                                placeholder={t('champs.selectionnerAnnee')}
                                required
                            />
                            <ElisaInput
                                label={t('champs.sallePrincipale')}
                                value={instanceData.sallePrincipale || ''}
                                onChange={(value) => handleChangeInstance('sallePrincipale', value as string)}
                                placeholder={t('champs.sallePlaceholder')}
                            />
                        </div>

                        {/* Effectif max */}
                        <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                            <ElisaInput
                                label={t('champs.effectifMax')}
                                type="number"
                                value={instanceData.effectifMax?.toString() || '50'}
                                onChange={(value) => handleChangeInstance('effectifMax', parseInt(value as string) || 50)}
                                min="1"
                                max="100"
                                hint={t('champs.effectifMaxHint')}
                            />
                        </div>

                        {/* Résumé de la création */}
                        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-[var(--space-md)]">
                            <h4
                                className="font-medium text-[var(--color-text-primary)] mb-2"
                                style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                            >
                                {t('formulaire.resume')}
                            </h4>
                            <dl className="space-y-1" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                <div className="flex justify-between">
                                    <dt className="text-[var(--color-text-secondary)]">{t('champs.nom')}:</dt>
                                    <dd className="font-medium text-[var(--color-text-primary)]">{modeleData.nom}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-[var(--color-text-secondary)]">{t('champs.niveau')}:</dt>
                                    <dd className="font-medium text-[var(--color-text-primary)]">
                                        {niveaux.find((n: { id: string; nom: string }) => n.id === modeleData.niveauId)?.nom || '-'}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-[var(--color-text-secondary)]">{t('champs.typeClasse')}:</dt>
                                    <dd className="font-medium text-[var(--color-text-primary)]">
                                        {optionsTypesClasse.find(o => o.value === modeleData.typeClasse)?.label || '-'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}
            </div>
        </CustomModal>
    );
}
