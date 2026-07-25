/**
 * ==================================
 * eLISAschool - Page Saisie en masse des Notes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Grille type tableur : une ligne par élève de la classe sélectionnée.
 * Navigation clavier (Enter/ArrowDown/ArrowUp), validation inline 0..barème,
 * récapitulatif avec moyenne prévisionnelle, POST /api/notes/bulk.
 * Les lignes vides sont ignorées. Affichage cartes sous 480px.
 */

import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ListPlus, Save, Users, TrendingUp, ClipboardList, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { usePermissions } from '@/hooks';
import { useClasses, useElevesClasse } from '@/features/classes/hooks/use-classes';
import { useMatieres } from '@/features/matieres/hooks/use-matieres';
import { usePeriodes } from '@/features/periodes/hooks/use-periodes';
import { useAnneeScolaireActive } from '@/features/annees-scolaires/hooks/use-annees-scolaires';
import { useCreerNotesEnMasse } from '../hooks/use-notes';
import { getNoteColorClass } from '../utils/note-couleur';
import type { TypeEvaluation } from '../types/note.types';

interface EleveLigne {
    id: string;
    nom: string;
    prenom: string;
    matricule?: string;
}

interface SaisieLigne {
    valeur: string;
    commentaire: string;
}

const TYPES_EVALUATION: TypeEvaluation[] = [
    'DEVOIR',
    'INTERROGATION',
    'EXAMEN',
    'PROJET',
    'PARTICIPATION',
    'AUTRE',
];

export function NotesSaisieMassePage() {
    const { t } = useTranslation('notes');
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    // Contexte de saisie
    const [classeId, setClasseId] = useState('');
    const [classeAnneeId, setClasseAnneeId] = useState('');
    const [matiereId, setMatiereId] = useState('');
    const [periodeId, setPeriodeId] = useState('');
    const [typeEvaluation, setTypeEvaluation] = useState<TypeEvaluation>('DEVOIR');
    const [bareme, setBareme] = useState('20');
    const [coefficient, setCoefficient] = useState('1');

    // Saisie par élève
    const [saisies, setSaisies] = useState<Record<string, SaisieLigne>>({});
    const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const { data: classesData } = useClasses({ limit: 100 });
    const { data: matieresData } = useMatieres({ limit: 100 });
    const { data: anneeActive } = useAnneeScolaireActive();
    const { data: periodes } = usePeriodes({ anneeId: anneeActive?.id || '' });
    const { data: elevesData, isLoading: elevesLoading } = useElevesClasse(classeId, 1, 200);
    const creerEnMasse = useCreerNotesEnMasse();

    const classes = useMemo(
        () => (classesData?.items ?? []).filter((c) => !!c.classeAnneeId),
        [classesData]
    );

    const eleves: EleveLigne[] = useMemo(
        () => (elevesData?.eleves?.items ?? []).map((e) => ({
            id: String(e.id ?? ''),
            nom: String(e.nom ?? ''),
            prenom: String(e.prenom ?? ''),
            matricule: typeof e.matricule === 'string' ? e.matricule : undefined,
        })),
        [elevesData]
    );

    const baremeNum = parseFloat(bareme) > 0 ? parseFloat(bareme) : 20;
    const coefficientNum = parseFloat(coefficient) >= 0 ? parseFloat(coefficient) : 1;

    const validerValeur = (brut: string): string | null => {
        if (brut === '') return null; // ligne vide = ignorée, pas d'erreur
        const v = parseFloat(brut);
        if (Number.isNaN(v)) return t('validationValeurInvalide');
        if (v < 0) return t('validationValeurMin');
        if (v > baremeNum) return t('validationValeurMax');
        return null;
    };

    const lignesRemplies = useMemo(() => eleves
        .map((e) => ({ eleve: e, saisie: saisies[e.id] }))
        .filter((l): l is { eleve: EleveLigne; saisie: SaisieLigne } => !!l.saisie && l.saisie.valeur !== ''),
    [eleves, saisies]);

    const lignesValides = lignesRemplies.filter((l) => validerValeur(l.saisie.valeur) === null);
    const aErreurs = lignesRemplies.length !== lignesValides.length;

    const moyennePrevisionnelle = useMemo(() => {
        if (lignesValides.length === 0) return null;
        const somme = lignesValides.reduce((acc, l) => acc + parseFloat(l.saisie.valeur), 0);
        return Math.round((somme / lignesValides.length) * 100) / 100;
    }, [lignesValides]);

    const contexteComplet = !!classeAnneeId && !!matiereId && !!periodeId && baremeNum > 0;

    const handleClasseChange = (valeurClasseAnneeId: string) => {
        setClasseAnneeId(valeurClasseAnneeId);
        const classe = classes.find((c) => c.classeAnneeId === valeurClasseAnneeId);
        setClasseId(classe?.id ?? '');
        setSaisies({});
    };

    const handleValeurChange = (eleveId: string, valeur: string) => {
        setSaisies((prev) => ({
            ...prev,
            [eleveId]: { valeur, commentaire: prev[eleveId]?.commentaire ?? '' },
        }));
    };

    const handleCommentaireChange = (eleveId: string, commentaire: string) => {
        setSaisies((prev) => ({
            ...prev,
            [eleveId]: { valeur: prev[eleveId]?.valeur ?? '', commentaire },
        }));
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (event.key === 'Enter' || event.key === 'ArrowDown') {
            event.preventDefault();
            const suivant = inputRefs.current[index + 1];
            if (suivant) {
                suivant.focus();
                suivant.select();
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            const precedent = inputRefs.current[index - 1];
            if (precedent) {
                precedent.focus();
                precedent.select();
            }
        }
    };

    const handleSubmit = async () => {
        if (!contexteComplet || lignesValides.length === 0 || aErreurs) return;
        await creerEnMasse.mutateAsync({
            matiereId,
            classeAnneeId,
            periodeId,
            typeEvaluation,
            bareme: baremeNum,
            coefficient: coefficientNum,
            notes: lignesValides.map((l) => ({
                eleveId: l.eleve.id,
                valeur: parseFloat(l.saisie.valeur),
                commentaire: l.saisie.commentaire || undefined,
            })),
        });
        navigate({ to: '/notes' });
    };

    if (!hasPermission('notes:bulk:create')) {
        return (
            <div className="p-[clamp(0.75rem,2vw,1.5rem)]">
                <ErrorMessage
                    message={t('accesRefuse')}
                    onRetry={() => navigate({ to: '/notes' })}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[var(--gap-sm)] p-[clamp(0.75rem,2vw,1.5rem)]">
            <PageHeader
                variant="gradient"
                icon={ListPlus}
                title={t('saisieMasse')}
                subtitle={t('saisieMasseSousTitre')}
                onBack={() => navigate({ to: '/notes' })}
                actions={
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<ArrowLeft className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        onClick={() => navigate({ to: '/notes' })}
                    >
                        {t('retourListe')}
                    </ElisaButton>
                }
            />

            {/* Contexte de saisie */}
            <Card>
                <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                    <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                        <ClipboardList className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
                        {t('contexteSaisie')}
                    </h3>
                    <div className="border-b border-border mb-4" />
                    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-sm)]">
                        <ElisaSelect
                            label={t('classe') + ' *'}
                            value={classeAnneeId}
                            onValueChange={handleClasseChange}
                            options={classes.map((c) => ({ value: c.classeAnneeId as string, label: c.nom }))}
                            placeholder={t('selectionnerClasse')}
                        />
                        <ElisaSelect
                            label={t('matiere') + ' *'}
                            value={matiereId}
                            onValueChange={setMatiereId}
                            options={(matieresData?.items ?? []).map((m) => ({ value: m.id, label: m.nom }))}
                            placeholder={t('selectionnerMatiere')}
                        />
                        <ElisaSelect
                            label={t('periode') + ' *'}
                            value={periodeId}
                            onValueChange={setPeriodeId}
                            options={(periodes ?? []).map((p) => ({ value: p.id, label: p.nom }))}
                            placeholder={t('selectionnerPeriode')}
                        />
                        <ElisaSelect
                            label={t('type')}
                            value={typeEvaluation}
                            onValueChange={(v) => setTypeEvaluation(v as TypeEvaluation)}
                            options={TYPES_EVALUATION.map((type) => ({ value: type, label: t(type.toLowerCase()) }))}
                        />
                        <ElisaInput
                            label={t('bareme')}
                            type="number"
                            min={1}
                            step={1}
                            value={bareme}
                            onChange={(e) => setBareme(e.target.value)}
                        />
                        <ElisaInput
                            label={t('coefficient')}
                            type="number"
                            min={0}
                            step={0.5}
                            value={coefficient}
                            onChange={(e) => setCoefficient(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            {/* Grille de saisie */}
            {classeAnneeId && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                    <Card>
                        <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
                            <h3 className="text-[clamp(0.9375rem,1.5vw,1.0625rem)] font-semibold text-foreground mb-4">
                                <Users className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-primary inline mr-2" />
                                {t('elevesClasse', { count: eleves.length })}
                            </h3>
                            <div className="border-b border-border mb-4" />

                            {elevesLoading && (
                                <p className="text-sm text-muted-foreground">{t('chargementEleves')}</p>
                            )}

                            {!elevesLoading && eleves.length === 0 && (
                                <p className="text-sm text-muted-foreground">{t('aucunEleve')}</p>
                            )}

                            {!elevesLoading && eleves.length > 0 && (
                                <div className="flex flex-col gap-[var(--gap-sm)]">
                                    {/* Entête (masquée sous 480px) */}
                                    <div className="hidden min-[480px]:grid grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1fr)] gap-[var(--gap-sm)] px-[var(--padding-table-cell)] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        <span>{t('eleve')}</span>
                                        <span className="text-center">{t('noteSurBareme', { bareme: baremeNum })}</span>
                                        <span>{t('commentaire')}</span>
                                    </div>

                                    {eleves.map((eleve, index) => {
                                        const saisie = saisies[eleve.id] ?? { valeur: '', commentaire: '' };
                                        const erreur = validerValeur(saisie.valeur);
                                        return (
                                            <div
                                                key={eleve.id}
                                                className="grid grid-cols-1 min-[480px]:grid-cols-[minmax(0,1.2fr)_110px_minmax(0,1fr)] items-center gap-[var(--gap-sm)] rounded-[var(--radius-lg)] border border-border bg-card p-[var(--padding-table-cell)]"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-foreground">{eleve.prenom} {eleve.nom}</p>
                                                    {eleve.matricule && (
                                                        <p className="text-xs font-mono text-muted-foreground">{eleve.matricule}</p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-stretch">
                                                    <input
                                                        ref={(el) => { inputRefs.current[index] = el; }}
                                                        type="number"
                                                        inputMode="decimal"
                                                        min={0}
                                                        max={baremeNum}
                                                        step={0.25}
                                                        value={saisie.valeur}
                                                        aria-label={t('noteSurBareme', { bareme: baremeNum })}
                                                        onChange={(e) => handleValeurChange(eleve.id, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                                        className={`w-full rounded-[var(--radius-lg)] border bg-background px-2 py-1.5 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                                            erreur
                                                                ? 'border-danger text-danger'
                                                                : saisie.valeur !== ''
                                                                    ? `border-border ${getNoteColorClass(parseFloat(saisie.valeur), baremeNum)}`
                                                                    : 'border-border text-foreground'
                                                        }`}
                                                    />
                                                    {erreur && (
                                                        <span className="mt-0.5 text-center text-xs text-danger">{erreur}</span>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={saisie.commentaire}
                                                    aria-label={t('commentaire')}
                                                    onChange={(e) => handleCommentaireChange(eleve.id, e.target.value)}
                                                    placeholder={t('commentairePlaceholder')}
                                                    className="w-full rounded-[var(--radius-lg)] border border-border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* Récapitulatif + soumission */}
            {classeAnneeId && eleves.length > 0 && (
                <Card>
                    <div className="flex flex-col gap-[var(--gap-sm)] p-[clamp(0.75rem,1.5vw,1.25rem)] min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
                        <div className="flex flex-wrap items-center gap-[clamp(0.75rem,2vw,1.5rem)]">
                            <div className="flex items-center gap-2">
                                <Users className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                    {t('recapNotesSaisies', { saisies: lignesValides.length, total: eleves.length })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{t('moyennePrevisionnelle')}</span>
                                <span className={`text-sm font-bold ${moyennePrevisionnelle !== null ? getNoteColorClass(moyennePrevisionnelle, baremeNum) : 'text-muted-foreground'}`}>
                                    {moyennePrevisionnelle !== null ? `${moyennePrevisionnelle}/${baremeNum}` : '—'}
                                </span>
                            </div>
                            {aErreurs && (
                                <span className="text-sm font-medium text-danger">{t('recapErreurs')}</span>
                            )}
                        </div>
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            icon={<Save className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            isLoading={creerEnMasse.isPending}
                            disabled={!contexteComplet || lignesValides.length === 0 || aErreurs}
                            onClick={handleSubmit}
                        >
                            {t('enregistrerNotes', { count: lignesValides.length })}
                        </ElisaButton>
                    </div>
                </Card>
            )}
        </div>
    );
}
