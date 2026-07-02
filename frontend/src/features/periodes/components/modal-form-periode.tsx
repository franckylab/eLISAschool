/**
 * ==================================
 * eLISAschool - Formulaire Période (3 étapes)
 * ==================================
 * Version: 3.0.0 — Hiérarchique
 * Auteur: franck arlos chendjou
 *
 * Formulaire en 3 étapes (mode création) :
 * - Étape 1 : Identification (nom, type)
 * - Étape 2 : Période (année scolaire, dates, aperçu durée)
 * - Étape 3 : Résumé complet + Confirmation
 *
 * Mode édition : formulaire direct sans étapes
 *
 * Changements v3.0 :
 * - TypePeriode est un enum inline (plus de table externe)
 * - Suppression des champs ordre et poids (maintenant dans compositions)
 */

import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, ChevronRight, ChevronLeft, CheckCircle2, Calendar, Hash, Network } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useCreerPeriode, useModifierPeriode, useNiveauxPeriode } from '../hooks/use-periodes';
import { useToutesAnneesScolaires } from '@/features/annees-scolaires/hooks/use-toutes-annees-scolaires';
import type { Periode, CreerPeriodeDto } from '../types/periode.types';

interface ModalFormPeriodeProps {
    /** Période à éditer (null = mode création) */
    periode: Periode | null;
    /** Contrôle l'ouverture du modal */
    isOpen: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Année scolaire pré-sélectionnée (mode création) */
    anneeScolaireId?: string;
    /** Callback après succès */
    onSuccess?: () => void;
}

type EtapeFormulaire = 1 | 2 | 3;

interface ErreursFormulaire {
    nom?: string;
    niveauId?: string;
    anneeScolaireId?: string;
    dateDebut?: string;
    dateFin?: string;
}

export function ModalFormPeriode({
    periode,
    isOpen,
    onClose,
    anneeScolaireId = '',
    onSuccess,
}: ModalFormPeriodeProps) {
    const { t } = useTranslation('periodes');
    const estMobile = useMediaQuery('(max-width: 479px)');
    const estEdition = !!periode;

    // Hooks
    const { data: annees = [] } = useToutesAnneesScolaires();
    const { data: niveaux = [] } = useNiveauxPeriode();
    const creer = useCreerPeriode();
    const modifier = useModifierPeriode();
    const isLoading = creer.isPending || modifier.isPending;

    // Options pour le select de niveau (dynamique depuis les niveaux chargés)
    const optionsNiveaux = useMemo(
        () => niveaux
            .slice()
            .sort((a, b) => a.niveau - b.niveau)
            .map((n) => ({ value: n.id, label: `${n.label} (niv. ${n.niveau})` })),
        [niveaux],
    );

    // État du formulaire
    const [etape, setEtape] = useState<EtapeFormulaire>(1);
    const [erreurs, setErreurs] = useState<ErreursFormulaire>({});

    // Données formulaire
    const [nom, setNom] = useState('');
    const [niveauId, setNiveauId] = useState('');
    const [anneeId, setAnneeId] = useState(anneeScolaireId);
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');

    // Options pour les selects
    const optionsAnnees = useMemo(
        () => annees.map((a) => ({ value: a.id, label: a.libelle })),
        [annees],
    );

    // Année sélectionnée (pour affichage résumé)
    const anneeSelectionnee = useMemo(
        () => annees.find((a) => a.id === anneeId),
        [annees, anneeId],
    );

    // Calcul dynamique de la durée en jours
    const dureeJours = useMemo(() => {
        if (!dateDebut || !dateFin) return 0;
        const debut = new Date(dateDebut).getTime();
        const fin = new Date(dateFin).getTime();
        if (fin <= debut) return 0;
        return Math.ceil((fin - debut) / (1000 * 60 * 60 * 24));
    }, [dateDebut, dateFin]);

    // Pré-remplir en mode édition
    useEffect(() => {
        if (periode && estEdition) {
            setNom(periode.nom);
            setNiveauId(periode.niveauId);
            setAnneeId(periode.anneeScolaireId);
            setDateDebut(periode.dateDebut ? periode.dateDebut.substring(0, 10) : '');
            setDateFin(periode.dateFin ? periode.dateFin.substring(0, 10) : '');
        } else {
            setNom('');
            setNiveauId(niveaux.length > 0 ? niveaux[0].id : '');
            setAnneeId(anneeScolaireId);
            setDateDebut('');
            setDateFin('');
        }
        setErreurs({});
        setEtape(1);
    }, [periode, isOpen, anneeScolaireId, niveaux]);

    // Validation étape 1 : Identification
    const validerEtape1 = (): boolean => {
        const errs: ErreursFormulaire = {};
        if (!nom.trim()) errs.nom = t('validation.nomRequis');
        else if (nom.trim().length < 2) errs.nom = t('validation.nomMin');
        if (!niveauId) errs.niveauId = t('validation.typeRequis');
        setErreurs(errs);
        return Object.keys(errs).length === 0;
    };

    // Validation étape 2 : Période
    const validerEtape2 = (): boolean => {
        const errs: ErreursFormulaire = {};
        if (!anneeId) errs.anneeScolaireId = t('validation.anneeRequise');
        if (!dateDebut) errs.dateDebut = t('validation.dateDebutRequise');
        if (!dateFin) errs.dateFin = t('validation.dateFinRequise');
        if (dateDebut && dateFin && new Date(dateFin) <= new Date(dateDebut)) {
            errs.dateFin = t('validation.dateFinPosterieure');
        }
        setErreurs(errs);
        return Object.keys(errs).length === 0;
    };

    // Navigation entre étapes
    const allerEtape2 = () => { if (validerEtape1()) setEtape(2); };
    const allerEtape3 = () => { if (validerEtape2()) setEtape(3); };
    const retournerEtape1 = () => { setErreurs({}); setEtape(1); };
    const retournerEtape2 = () => { setErreurs({}); setEtape(2); };

    // Soumission finale
    const handleSubmit = async () => {
        try {
            if (estEdition && periode) {
                await modifier.mutateAsync({
                    id: periode.id,
                    nom: nom.trim(),
                    niveauId,
                    dateDebut: new Date(dateDebut).toISOString(),
                    dateFin: new Date(dateFin).toISOString(),
                });
            } else {
                const dto: CreerPeriodeDto = {
                    nom: nom.trim(),
                    niveauId,
                    anneeScolaireId: anneeId,
                    dateDebut: new Date(dateDebut).toISOString(),
                    dateFin: new Date(dateFin).toISOString(),
                };
                await creer.mutateAsync(dto);
            }
            onSuccess?.();
            onClose();
        } catch {
            // Erreur gérée par le hook (toast)
        }
    };

    // Handlers typés avec nettoyage d'erreur
    const handleChangeNom = (e: ChangeEvent<HTMLInputElement>) => {
        setNom(e.target.value);
        if (erreurs.nom) setErreurs((prev) => ({ ...prev, nom: undefined }));
    };

    // Titre et description du modal
    const titre = estEdition ? t('formulaire.modifierTitre') : t('formulaire.creerTitre');
    const description = estEdition
        ? t('formulaire.modifierDescription')
        : t('formulaire.creerDescription', { etape, total: 3 });

    // Footer dynamique selon l'étape
    const footer = (() => {
        if (estEdition) {
            return (
                <>
                    <ElisaButton variant="outline" onClick={onClose}>
                        {t('boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        isLoading={isLoading}
                        icon={<Save className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        onClick={handleSubmit}
                    >
                        {t('boutons.enregistrer')}
                    </ElisaButton>
                </>
            );
        }
        // Étape 1
        if (etape === 1) {
            return (
                <>
                    <ElisaButton variant="outline" onClick={onClose}>
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
            );
        }
        // Étape 2
        if (etape === 2) {
            return (
                <>
                    <ElisaButton variant="outline" onClick={onClose}>
                        {t('boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="outline"
                        onClick={retournerEtape1}
                        icon={<ChevronLeft className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    >
                        {t('boutons.precedent')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={allerEtape3}
                        icon={<ChevronRight className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    >
                        {t('boutons.suivant')}
                    </ElisaButton>
                </>
            );
        }
        // Étape 3
        return (
            <>
                <ElisaButton variant="outline" onClick={onClose}>
                    {t('boutons.annuler')}
                </ElisaButton>
                <ElisaButton
                    variant="outline"
                    onClick={retournerEtape2}
                    icon={<ChevronLeft className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                >
                    {t('boutons.precedent')}
                </ElisaButton>
                <ElisaButton
                    variant="primary"
                    isLoading={isLoading}
                    icon={<CheckCircle2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    onClick={handleSubmit}
                >
                    {t('boutons.confirmer')}
                </ElisaButton>
            </>
        );
    })();

    return (
        <CustomModal
            open={isOpen}
            onOpenChange={(v) => { if (!v && !isLoading) onClose(); }}
            title={titre}
            description={description}
            size="2xl"
            footer={footer}
        >
            <div className="space-y-[var(--space-md)]">
                {/* Indicateur d'étape (mode création uniquement) */}
                {!estEdition && (
                    <div className="flex items-center gap-[var(--gap-sm)] mb-[var(--space-md)]">
                        {[1, 2, 3].map((num, i) => (
                            <div key={num} className="flex items-center gap-[var(--gap-sm)] flex-1 last:flex-none">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                                    etape >= num
                                        ? 'bg-[var(--color-dominant-600)] text-white'
                                        : 'bg-[var(--color-surface-alt)] text-[var(--color-text-tertiary)]'
                                }`}>
                                    {num === 3 && etape >= 3 ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                        num
                                    )}
                                </div>
                                {i < 2 && (
                                    <div className={`flex-1 h-1 rounded transition-colors ${
                                        etape >= num + 1 ? 'bg-[var(--color-dominant-600)]' : 'bg-[var(--color-surface-alt)]'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ÉTAPE 1 : Identification */}
                {(!estEdition && etape === 1) && (
                    <div className="space-y-[var(--space-md)]">
                        <h3
                            className="font-semibold text-[var(--color-text-primary)] flex items-center gap-[var(--gap-xs)]"
                            style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.0625rem)' }}
                        >
                            <Hash className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominant-600)]" />
                            {t('formulaire.titreIdentification')}
                        </h3>

                        {/* Nom */}
                        <ElisaInput
                            label={t('champs.nom')}
                            value={nom}
                            onChange={handleChangeNom}
                            error={erreurs.nom}
                            placeholder={t('champs.nomPlaceholder')}
                            required
                            icon={<Calendar className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            autoFocus
                        />

                        {/* Niveau de périodicité */}
                        <ElisaSelect
                            label={t('champs.niveau') || 'Niveau de périodicité'}
                            value={niveauId}
                            onValueChange={(value) => {
                                setNiveauId(value);
                                if (erreurs.niveauId) setErreurs((prev) => ({ ...prev, niveauId: undefined }));
                            }}
                            error={erreurs.niveauId}
                            options={optionsNiveaux}
                            placeholder={t('champs.niveauPlaceholder') || 'Sélectionner un niveau'}
                            required
                        />
                    </div>
                )}

                {/* ÉTAPE 2 : Période */}
                {(!estEdition && etape === 2) && (
                    <div className="space-y-[var(--space-md)]">
                        <h3
                            className="font-semibold text-[var(--color-text-primary)] flex items-center gap-[var(--gap-xs)]"
                            style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.0625rem)' }}
                        >
                            <Calendar className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominant-600)]" />
                            {t('formulaire.titrePeriode')}
                        </h3>

                        {/* Année scolaire */}
                        <ElisaSelect
                            label={t('champs.anneeScolaire')}
                            value={anneeId}
                            onValueChange={(value) => {
                                setAnneeId(value);
                                if (erreurs.anneeScolaireId) setErreurs((prev) => ({ ...prev, anneeScolaireId: undefined }));
                            }}
                            error={erreurs.anneeScolaireId}
                            options={optionsAnnees}
                            placeholder={t('champs.anneePlaceholder')}
                            required
                        />

                        {/* Dates */}
                        <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                            <ElisaInput
                                label={t('champs.dateDebut')}
                                type="date"
                                value={dateDebut}
                                onChange={(e) => {
                                    setDateDebut(e.target.value);
                                    if (erreurs.dateDebut) setErreurs((prev) => ({ ...prev, dateDebut: undefined }));
                                }}
                                error={erreurs.dateDebut}
                                required
                            />
                            <ElisaInput
                                label={t('champs.dateFin')}
                                type="date"
                                value={dateFin}
                                onChange={(e) => {
                                    setDateFin(e.target.value);
                                    if (erreurs.dateFin) setErreurs((prev) => ({ ...prev, dateFin: undefined }));
                                }}
                                error={erreurs.dateFin}
                                required
                                min={dateDebut || undefined}
                            />
                        </div>

                        {/* Aperçu dynamique de la durée */}
                        {dureeJours > 0 && (
                            <div className="flex items-center gap-[var(--gap-sm)] rounded-[var(--radius-md)] border border-[var(--color-dominant-600)]/30 bg-[var(--color-dominant-600)]/5 p-[var(--space-md)]">
                                <Calendar className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-dominant-600)] shrink-0" />
                                <div>
                                    <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                                        {t('formulaire.duree')} : {t('formulaire.dureeJours', { count: dureeJours })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ÉTAPE 3 : Résumé + Confirmation */}
                {(!estEdition && etape === 3) && (
                    <div className="space-y-[var(--space-md)]">
                        {/* Message de confirmation */}
                        <div className="flex items-center gap-[var(--gap-sm)] rounded-[var(--radius-md)] border border-[var(--color-dominant-600)]/30 bg-[var(--color-dominant-600)]/5 p-[var(--space-md)]">
                            <CheckCircle2 className="w-5 h-5 text-[var(--color-dominant-600)] shrink-0" />
                            <p className="text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                {t('formulaire.resumeMessage')}
                            </p>
                        </div>

                        {/* Section Identification */}
                        <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface-alt)] p-[var(--space-md)]">
                            <h4
                                className="font-semibold text-[var(--color-text-primary)] mb-3"
                                style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                            >
                                {t('formulaire.resumeIdentification')}
                            </h4>
                            <dl className="grid grid-cols-2 gap-x-[var(--gap-md)] gap-y-2" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                <div className="flex flex-col">
                                    <dt className="text-[var(--color-text-secondary)]">{t('nom')}</dt>
                                    <dd className="font-medium text-[var(--color-text-primary)]">{nom}</dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-[var(--color-text-secondary)]">{t('niveau')}</dt>
                                    <dd className="font-medium text-[var(--color-text-primary)]">{niveaux.find(n => n.id === niveauId)?.label || (niveauId ? niveauId.substring(0, 8) : '—')}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Section Période */}
                        <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface-alt)] p-[var(--space-md)]">
                            <h4
                                className="font-semibold text-[var(--color-text-primary)] mb-3"
                                style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                            >
                                {t('formulaire.resumePeriode')}
                            </h4>
                            <dl className="grid grid-cols-2 gap-x-[var(--gap-md)] gap-y-2" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                                <div className="flex flex-col">
                                    <dt className="text-[var(--color-text-secondary)]">{t('anneeScolaire')}</dt>
                                    <dd className="font-medium text-[var(--color-text-primary)]">{anneeSelectionnee?.libelle || '-'}</dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-[var(--color-text-secondary)]">{t('formulaire.duree')}</dt>
                                    <dd className="font-medium text-[var(--color-text-primary)]">
                                        {dureeJours > 0 ? t('formulaire.dureeJours', { count: dureeJours }) : '-'}
                                    </dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-[var(--color-text-secondary)]">{t('dateDebut')}</dt>
                                    <dd className="font-medium text-[var(--color-text-primary)]">
                                        {dateDebut ? new Date(dateDebut).toLocaleDateString('fr-FR') : '-'}
                                    </dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-[var(--color-text-secondary)]">{t('dateFin')}</dt>
                                    <dd className="font-medium text-[var(--color-text-primary)]">
                                        {dateFin ? new Date(dateFin).toLocaleDateString('fr-FR') : '-'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Note : gestion des enfants après création */}
                        <div className="flex items-start gap-[var(--gap-xs)] rounded-[var(--radius-md)] border border-blue-200 bg-blue-50 p-[var(--space-sm)]">
                            <Network className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-blue-700" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem)' }}>
                                Après la création, utilisez le bouton <strong>« Gérer les enfants »</strong> dans la vue arborescente pour composer la hiérarchie des périodes.
                            </p>
                        </div>
                    </div>
                )}

                {/* Mode édition : formulaire direct */}
                {estEdition && (
                    <div className="space-y-[var(--space-md)]">
                        {/* Nom */}
                        <ElisaInput
                            label={t('champs.nom')}
                            value={nom}
                            onChange={handleChangeNom}
                            error={erreurs.nom}
                            placeholder={t('champs.nomPlaceholder')}
                            required
                            icon={<Calendar className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            autoFocus
                        />

                        {/* Type + Dates */}
                        <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                            <ElisaSelect
                                label={t('champs.niveau') || 'Niveau de périodicité'}
                                value={niveauId}
                                onValueChange={(value) => {
                                    setNiveauId(value);
                                    if (erreurs.niveauId) setErreurs((prev) => ({ ...prev, niveauId: undefined }));
                                }}
                                error={erreurs.niveauId}
                                options={optionsNiveaux}
                                placeholder={t('champs.niveauPlaceholder') || 'Sélectionner un niveau'}
                                required
                            />
                            <div /> {/* Spacer for grid alignment */}
                        </div>

                        {/* Dates */}
                        <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-[var(--gap-md)]`}>
                            <ElisaInput
                                label={t('champs.dateDebut')}
                                type="date"
                                value={dateDebut}
                                onChange={(e) => {
                                    setDateDebut(e.target.value);
                                    if (erreurs.dateDebut) setErreurs((prev) => ({ ...prev, dateDebut: undefined }));
                                }}
                                error={erreurs.dateDebut}
                                required
                            />
                            <ElisaInput
                                label={t('champs.dateFin')}
                                type="date"
                                value={dateFin}
                                onChange={(e) => {
                                    setDateFin(e.target.value);
                                    if (erreurs.dateFin) setErreurs((prev) => ({ ...prev, dateFin: undefined }));
                                }}
                                error={erreurs.dateFin}
                                required
                                min={dateDebut || undefined}
                            />
                        </div>

                        {/* Aperçu durée */}
                        {dureeJours > 0 && (
                            <div className="flex items-center gap-[var(--gap-sm)] rounded-[var(--radius-md)] border border-[var(--color-dominant-600)]/30 bg-[var(--color-dominant-600)]/5 p-[var(--space-md)]">
                                <Calendar className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominant-600)] shrink-0" />
                                <p className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                    {t('formulaire.duree')} : {t('formulaire.dureeJours', { count: dureeJours })}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </CustomModal>
    );
}
