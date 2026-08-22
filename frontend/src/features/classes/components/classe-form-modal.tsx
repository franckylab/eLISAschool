/**
 * ==================================
 * eLISAschool - Formulaire Classe (3 étapes)
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Formulaire en 3 étapes :
 * - Étape 1 : Modèle de classe (nom, code, niveau, filière, type, créneau)
 * - Étape 2 : Instance annuelle (année scolaire, salle, effectif max)
 * - Étape 3 : Résumé complet + Confirmation
 *
 * Corrections :
 * - Typage strict (pas de any)
 * - Responsive design complet
 * - i18n complet
 * - Validation par étape
 * - Étape 3 : récapitulatif complet avant soumission
 */

import { useState, useEffect, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Settings, CheckCircle2 } from 'lucide-react';
import { useCreerClasse, useModifierClasse } from '../hooks/use-classes';
import { useProgrammes } from '@/features/programmes/hooks/use-programmes';
import { useToutesAnneesScolaires } from '@/features/annees-scolaires/hooks/use-toutes-annees-scolaires';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import { useToutesFilieres } from '@/features/filieres/hooks/use-filieres';
import { SalleSelect } from '@/features/salles/components/SalleSelect';
import type { Salle } from '@/features/salles/types/salle.types';
import { StepperModal, type StepperStep } from '@/components/modals/StepperModal';
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
    const { data: programmesData } = useProgrammes({ limit: 100 });
    const optionsProgrammes = (programmesData?.items || []).map((p: { id: string; nom: string }) => ({
        value: p.id,
        label: p.nom,
    }));

    // État du formulaire
    const [erreurs, setErreurs] = useState<ErreursFormulaire>({});

    // Données étape 1 : Modèle de classe
    const [modeleData, setModeleData] = useState<CreerClasseModeleDto & { actif?: boolean }>({
        nom: classe?.nom || '',
        code: classe?.code || '',
        niveauId: classe?.niveauId || '',
        filiereId: classe?.filiereId || null,
        typeClasse: classe?.typeClasse || TypeClasseEnum.NORMALE,
        creneauHoraire: classe?.creneauHoraire || CreneauHoraireEnum.MATIN,
        description: classe?.description || '',
        actif: classe?.actif ?? true,
    });

    // Données étape 2 : Instance annuelle
    const [instanceData, setInstanceData] = useState<CreerClasseInstanceDto>({
        anneeScolaireId: classe?.anneeScolaireId || '',
        programmeId: classe?.programmeId || '',
        professeurPrincipalId: classe?.professeurPrincipalId || null,
        sallePrincipaleId: classe?.sallePrincipaleId || '',
        effectifMax: classe?.effectifMax || 50,
    });

    const [selectedCapacite, setSelectedCapacite] = useState<number | null>(
        classe?.salle?.capacite || null
    );
    const [selectedSalleNom, setSelectedSalleNom] = useState<string | null>(
        classe?.salle?.nom || null
    );

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
                actif: classe.actif ?? true,
            });
            setInstanceData({
                anneeScolaireId: classe.anneeScolaireId || '',
                programmeId: classe.programmeId || '',
                professeurPrincipalId: classe.professeurPrincipalId || null,
                sallePrincipaleId: classe.sallePrincipaleId || '',
                effectifMax: classe.effectifMax || 50,
            });
            setSelectedCapacite(classe?.salle?.capacite || null);
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
        label: `${a.libelle} (${a.statut === 'EN_COURS' ? t('annee.enCours') : t('annee.cloturee')})`,
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
        const nom = typeof modeleData.nom === 'string' ? modeleData.nom : '';
        if (!nom.trim()) {
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

    // Soumission finale (depuis la dernière étape)
    const handleSubmit = async () => {
        try {
            if (mode === 'creation') {
                await creerClasse.mutateAsync({
                    ...modeleData,
                    ...instanceData,
                } as CreerClasseCompletDto);
            } else if (classe) {
                await modifierClasse.mutateAsync({
                    id: classe.id,
                    ...modeleData,
                    sallePrincipaleId: instanceData.sallePrincipaleId ?? undefined,
                    effectifMax: instanceData.effectifMax,
                    programmeId: instanceData.programmeId ?? undefined,
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

    const handleSalleChange = (salleId: string, salle?: Salle) => {
        setInstanceData(prev => ({
            ...prev,
            sallePrincipaleId: salleId,
            effectifMax: salle ? salle.capacite : (prev.effectifMax || 50),
        }));
        setSelectedCapacite(salle?.capacite || null);
        setSelectedSalleNom(salle?.nom || null);
        if (erreurs.anneeScolaireId) {
            setErreurs(prev => {
                const next = { ...prev };
                delete next.anneeScolaireId;
                return next;
            });
        }
    };

    const titre = mode === 'creation'
        ? t('formulaire.creerTitre')
        : t('formulaire.modifierTitre');

    const description = mode === 'creation'
        ? t('formulaire.creerDescription', { etape: 1, total: 3 })
        : t('formulaire.modifierDescription');

    // Définition des étapes pour StepperModal
    const steps: StepperStep[] = mode === 'edition'
        ? [
            {
                id: 'modele',
                label: t('formulaire.titreModele'),
                icon: FileText,
                content: renderEtapeModele(),
                validate: validerEtape1,
                validateError: erreurs.nom || erreurs.niveauId,
            },
            {
                id: 'resume',
                label: t('formulaire.resume'),
                icon: CheckCircle2,
                content: renderEtapeResume(),
            },
        ]
        : [
            {
                id: 'modele',
                label: t('formulaire.titreModele'),
                icon: FileText,
                content: renderEtapeModele(),
                validate: validerEtape1,
                validateError: erreurs.nom || erreurs.niveauId,
            },
            {
                id: 'instance',
                label: t('formulaire.titreInstance'),
                icon: Settings,
                content: renderEtapeInstance(),
                validate: validerEtape2,
                validateError: erreurs.anneeScolaireId,
            },
            {
                id: 'resume',
                label: t('formulaire.resume'),
                icon: CheckCircle2,
                content: renderEtapeResume(),
            },
        ];

    // Rendu Étape 1 : Modèle de classe
    function renderEtapeModele() {
        return (
            <div className="space-y-[var(--space-md)]">
                {/* Nom et Code */}
                <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                    <ElisaInput
                        label={t('champs.nom')}
                        value={modeleData.nom || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleChangeModele('nom', e.target.value)}
                        error={erreurs.nom}
                        placeholder={t('champs.nomPlaceholder')}
                        required
                    />
                    <ElisaInput
                        label={t('champs.code')}
                        value={modeleData.code || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleChangeModele('code', e.target.value)}
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

                {/* Statut actif/inactif (mode édition uniquement) */}
                {mode === 'edition' && (
                    <div className="flex items-center gap-[var(--gap-md)]">
                        <label
                            className="flex items-center gap-[var(--gap-sm)] cursor-pointer"
                            style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                        >
                            <input
                                type="checkbox"
                                checked={modeleData.actif ?? true}
                                onChange={(e) => {
                                    const nouveauActif = e.target.checked;
                                    setModeleData(prev => ({ ...prev, actif: nouveauActif }));
                                }}
                                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-dominant-600)] focus:ring-[var(--color-dominant-500)]"
                            />
                            <span className="font-medium text-[var(--color-text-primary)]">
                                {t('champs.actif')}
                            </span>
                            <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                modeleData.actif
                                    ? 'bg-success/10 text-success'
                                    : 'bg-muted text-muted-foreground'
                            }`}>
                                {modeleData.actif ? t('statut.actif') : t('statut.inactif')}
                            </span>
                        </label>
                    </div>
                )}
            </div>
        );
    }

    // Rendu Étape 2 : Instance annuelle
    function renderEtapeInstance() {
        return (
            <div className="space-y-[var(--space-md)]">
                {/* Année scolaire et Salle */}
                <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                    {mode === 'creation' ? (
                        <ElisaSelect
                            label={t('champs.anneeScolaire')}
                            value={instanceData.anneeScolaireId || ''}
                            onValueChange={(value) => handleChangeInstance('anneeScolaireId', value)}
                            error={erreurs.anneeScolaireId}
                            options={optionsAnneesScolaires}
                            placeholder={t('champs.selectionnerAnnee')}
                            required
                        />
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">{t('champs.anneeScolaire')}</label>
                            <div className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-secondary">
                                {classe?.anneeScolaire?.libelle || '-'}
                            </div>
                        </div>
                    )}
                    <SalleSelect
                        value={instanceData.sallePrincipaleId || ''}
                        onChange={handleSalleChange}
                        label={t('champs.sallePrincipale')}
                    />
                </div>

                {/* Effectif max */}
                <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                    <div className="space-y-1">
                        {selectedCapacite && (
                            <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info">
                                    {t('champs.capaciteSalle', { count: selectedCapacite })}
                                </span>
                            </div>
                        )}
                        <ElisaInput
                            label={t('champs.effectifMax')}
                            type="number"
                            value={instanceData.effectifMax?.toString() || '50'}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChangeInstance('effectifMax', parseInt(e.target.value) || 50)}
                            min="1"
                            max={selectedCapacite || 200}
                            hint={selectedCapacite ? t('champs.limiteeParSalle', { max: selectedCapacite }) : t('champs.effectifMaxHint')}
                        />
                    </div>
                </div>

                {/* Programme pédagogique */}
                <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                    <ElisaSelect
                        label={t('champs.programme')}
                        value={instanceData.programmeId || ''}
                        onValueChange={(value) => handleChangeInstance('programmeId', value || null)}
                        options={optionsProgrammes}
                        placeholder={t('champs.selectionnerProgramme')}
                    />
                </div>
            </div>
        );
    }

    // Rendu Étape 3 : Résumé
    function renderEtapeResume() {
        return (
            <div className="space-y-[var(--space-md)]">
                {/* Message de confirmation */}
                <div className="flex items-center gap-[var(--gap-sm)] rounded-[var(--radius-md)] border border-[var(--color-dominant-600)]/30 bg-[var(--color-dominant-600)]/5 p-[var(--space-md)]">
                    <CheckCircle2 className="w-5 h-5 text-[var(--color-dominant-600)] shrink-0" />
                    <p
                        className="text-[var(--color-text-primary)]"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                    >
                        {mode === 'creation' ? t('formulaire.confirmMessage') : t('formulaire.verifierModifications')}
                    </p>
                </div>

                {/* Section Modèle de classe */}
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-[var(--space-md)]">
                    <h4
                        className="font-semibold text-[var(--color-text-primary)] mb-3"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                    >
                        {t('formulaire.resumeModele')}
                    </h4>
                    <dl className="grid grid-cols-2 gap-x-[var(--gap-md)] gap-y-2" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                        <div className="flex flex-col">
                            <dt className="text-[var(--color-text-secondary)]">{t('champs.nom')}</dt>
                            <dd className="font-medium text-[var(--color-text-primary)]">{modeleData.nom || '-'}</dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-[var(--color-text-secondary)]">{t('champs.code')}</dt>
                            <dd className="font-medium text-[var(--color-text-primary)]">{modeleData.code || '-'}</dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-[var(--color-text-secondary)]">{t('champs.niveau')}</dt>
                            <dd className="font-medium text-[var(--color-text-primary)]">
                                {niveaux.find((n: { id: string; nom: string }) => n.id === modeleData.niveauId)?.nom || '-'}
                            </dd>
                        </div>
                        {estSecondCycle && modeleData.filiereId && (
                            <div className="flex flex-col">
                                <dt className="text-[var(--color-text-secondary)]">{t('champs.filiere')}</dt>
                                <dd className="font-medium text-[var(--color-text-primary)]">
                                    {filieres.find((f: { id: string; nom: string }) => f.id === modeleData.filiereId)?.nom || '-'}
                                </dd>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <dt className="text-[var(--color-text-secondary)]">{t('champs.typeClasse')}</dt>
                            <dd className="font-medium text-[var(--color-text-primary)]">
                                {optionsTypesClasse.find(o => o.value === modeleData.typeClasse)?.label || '-'}
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-[var(--color-text-secondary)]">{t('champs.creneauHoraire')}</dt>
                            <dd className="font-medium text-[var(--color-text-primary)]">
                                {optionsCreneaux.find(o => o.value === modeleData.creneauHoraire)?.label || '-'}
                            </dd>
                        </div>
                        {modeleData.description && (
                            <div className="flex flex-col col-span-2">
                                <dt className="text-[var(--color-text-secondary)]">{t('champs.description')}</dt>
                                <dd className="font-medium text-[var(--color-text-primary)]">{modeleData.description}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Section Configuration annuelle */}
                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-[var(--space-md)]">
                    <h4
                        className="font-semibold text-[var(--color-text-primary)] mb-3"
                        style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                    >
                        {t('formulaire.resumeInstance')}
                    </h4>
                    <dl className="grid grid-cols-2 gap-x-[var(--gap-md)] gap-y-2" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                        <div className="flex flex-col">
                            <dt className="text-[var(--color-text-secondary)]">{t('champs.anneeScolaire')}</dt>
                            <dd className="font-medium text-[var(--color-text-primary)]">
                                {mode === 'creation'
                                    ? anneesScolaires.find((a: { id: string; libelle: string }) => a.id === instanceData.anneeScolaireId)?.libelle || '-'
                                    : classe?.anneeScolaire?.libelle || '-'
                                }
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-[var(--color-text-secondary)]">{t('champs.sallePrincipale')}</dt>
                            <dd className="font-medium text-[var(--color-text-primary)]">
                                {selectedSalleNom || '-'}
                                {selectedCapacite && ` (${selectedCapacite} places)`}
                            </dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-[var(--color-text-secondary)]">{t('champs.effectifMax')}</dt>
                            <dd className="font-medium text-[var(--color-text-primary)]">{instanceData.effectifMax || '-'}</dd>
                        </div>
                        <div className="flex flex-col">
                            <dt className="text-[var(--color-text-secondary)]">{t('champs.programme')}</dt>
                            <dd className="font-medium text-[var(--color-text-primary)]">
                                {optionsProgrammes.find(o => o.value === instanceData.programmeId)?.label || '-'}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        );
    }

    return (
        <StepperModal
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={titre}
            description={description}
            steps={steps}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            cancelLabel={t('boutons.annuler')}
            nextLabel={t('boutons.suivant')}
            prevLabel={t('boutons.precedent')}
            submitLabel={mode === 'creation' ? t('boutons.confirmer') : t('boutons.enregistrer')}
            size="2xl"
            isSubmitting={isLoading}
        />
    );
}
