/**
 * ==================================
 * eLISAschool - Modal Édition CréneauHoraire
 * ==================================
 * 3 étapes (StepperModal partagé) :
 *  1. Identification (matière, enseignant, type)
 *  2. Planification (jour, heures, salle)
 *  3. Résumé + validation conflits temps réel
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Calendar, Clock, MapPin, CheckCircle2, AlertTriangle, AlertCircle, Trash2, ShieldCheck, GraduationCap, User, CalendarOff, Timer, Hash } from 'lucide-react';
import { StepperModal } from '@/components/modals/StepperModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from 'sonner';
import type { CreneauHoraire, JourSemaine, TypeCreneau, DonneesVerification } from '../types/edt.types';
import { useVerifierConflits, useCreerCreneau, useUpdateCreneau, useSupprimerCreneau, useValiderCreneau } from '../hooks/use-emploi-du-temps';

interface AffectationOption {
    id: string;
    matiere?: { id: string; nom: string; code?: string; couleur?: string };
    enseignant?: {
        id: string;
        matricule?: string;
        utilisateur?: {
            id: string;
            profil?: { id: string; nom: string; prenom: string };
        };
    };
    classeAnnee?: {
        id: string;
        classe?: { id: string; nom: string; niveau?: string };
        anneeScolaire?: { id: string; nom?: string; anneeDebut?: number; anneeFin?: number };
    };
}

interface SalleOption {
    id: string;
    nom: string;
    code?: string;
}

interface EDTCreneauModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    creneau?: CreneauHoraire | null;
    affectationMatiereId?: string;
    etablissementId: string;
    affectations?: AffectationOption[];
    salles?: SalleOption[];
    onSuccess?: () => void;
}

const JOURS: JourSemaine[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const TYPES_CRENEAU: TypeCreneau[] = ['COURS', 'TD', 'TP', 'RECREATION', 'PERMANENCE', 'ETUDE', 'AUTRE'];

interface FormData {
    affectationMatiereId: string;
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    typeCreneau: TypeCreneau;
    salleId: string;
    notes: string;
    couleur: string;
    genereAutomatiquement: boolean;
}

const FORM_INIT: FormData = {
    affectationMatiereId: '',
    jour: 'LUNDI',
    heureDebut: '08:00',
    heureFin: '09:00',
    typeCreneau: 'COURS',
    salleId: '',
    notes: '',
    couleur: '',
    genereAutomatiquement: true,
};

export function EDTCreneauModal({ open, onOpenChange, creneau, affectationMatiereId, etablissementId: _etablissementId, affectations = [], salles = [], onSuccess }: EDTCreneauModalProps) {
    const { t } = useTranslation('emplois');
    const [stepCourant, setStepCourant] = useState(1);
    const [form, setForm] = useState<FormData>(FORM_INIT);
    const [confirmSuppression, setConfirmSuppression] = useState(false);
    const [matiereSelectId, setMatiereSelectId] = useState('');
    const [enseignantSelectId, setEnseignantSelectId] = useState('');
    const [classeSelectId, setClasseSelectId] = useState('');

    const verifierConflits = useVerifierConflits();
    const creerCreneau = useCreerCreneau();
    const updateCreneau = useUpdateCreneau();
    const supprimerCreneau = useSupprimerCreneau();
    const validerCreneau = useValiderCreneau();

    const isEdit = !!creneau;
    const estPlanifie = creneau?.statut === 'PLANIFIE';

    // Initialiser le formulaire
    useEffect(() => {
        if (open) {
            if (creneau) {
                setForm({
                    affectationMatiereId: creneau.affectationMatiereId,
                    jour: creneau.jour,
                    heureDebut: creneau.heureDebut,
                    heureFin: creneau.heureFin,
                    typeCreneau: creneau.typeCreneau,
                    salleId: creneau.salleId ?? '',
                    notes: creneau.notes ?? '',
                    couleur: creneau.couleur ?? '',
                    genereAutomatiquement: creneau.genereAutomatiquement ?? true,
                });
            } else {
                setForm({ ...FORM_INIT, affectationMatiereId: affectationMatiereId ?? '' });
            }
            setStepCourant(1);
            // Initialiser cascade depuis l'affectation existante
            if (creneau?.affectationMatiereId) {
                const aff = affectations.find(a => a.id === creneau.affectationMatiereId);
                if (aff) {
                    setMatiereSelectId(aff.matiere?.id ?? '');
                    setEnseignantSelectId(aff.enseignant?.id ?? '');
                    setClasseSelectId(aff.classeAnnee?.classe?.id ?? '');
                }
            } else if (affectationMatiereId) {
                const aff = affectations.find(a => a.id === affectationMatiereId);
                if (aff) {
                    setMatiereSelectId(aff.matiere?.id ?? '');
                    setEnseignantSelectId(aff.enseignant?.id ?? '');
                    setClasseSelectId(aff.classeAnnee?.classe?.id ?? '');
                }
            }
        }
    }, [open, creneau, affectationMatiereId]);

    // Vérification conflits en temps réel
    const conflits = useMemo(() => {
        return verifierConflits.data ?? [];
    }, [verifierConflits.data]);

    const hasConflitsBloquants = conflits.some(c => c.severite === 'BLOQUANT');

    // ─── Cascading selects : Matière → Enseignant → Classe ────
    const matieresDisponibles = useMemo(() => {
        const map = new Map<string, string>();
        for (const a of affectations) {
            if (a.matiere?.id && a.matiere?.nom) map.set(a.matiere.id, a.matiere.nom);
        }
        return Array.from(map.entries()).map(([id, nom]) => ({ id, nom })).sort((a, b) => a.nom.localeCompare(b.nom));
    }, [affectations]);

    const enseignantsDisponibles = useMemo(() => {
        if (!matiereSelectId) return [];
        const map = new Map<string, string>();
        for (const a of affectations.filter(a => a.matiere?.id === matiereSelectId)) {
            if (a.enseignant?.id) {
                const nom = a.enseignant.utilisateur?.profil
                    ? `${a.enseignant.utilisateur.profil.prenom} ${a.enseignant.utilisateur.profil.nom}`
                    : a.enseignant.matricule ?? a.enseignant.id.substring(0, 8);
                map.set(a.enseignant.id, nom);
            }
        }
        return Array.from(map.entries()).map(([id, nom]) => ({ id, nom })).sort((a, b) => a.nom.localeCompare(b.nom));
    }, [affectations, matiereSelectId]);

    const classesDisponables = useMemo(() => {
        if (!matiereSelectId || !enseignantSelectId) return [];
        const map = new Map<string, { nom: string; niveau?: string }>();
        for (const a of affectations.filter(a => a.matiere?.id === matiereSelectId && a.enseignant?.id === enseignantSelectId)) {
            const classe = a.classeAnnee?.classe;
            if (classe?.id && classe?.nom) map.set(classe.id, { nom: classe.nom, niveau: classe.niveau });
        }
        return Array.from(map.entries()).map(([id, data]) => ({ id, ...data })).sort((a, b) => a.nom.localeCompare(b.nom));
    }, [affectations, matiereSelectId, enseignantSelectId]);

    useEffect(() => {
        if (form.affectationMatiereId && form.jour && form.heureDebut && form.heureFin) {
            const donnees: DonneesVerification = {
                affectationMatiereId: form.affectationMatiereId,
                jour: form.jour,
                heureDebut: form.heureDebut,
                heureFin: form.heureFin,
                salleId: form.salleId || undefined,
                excludeCreneauId: creneau?.id,
            };
            verifierConflits.mutate(donnees);
        }
    }, [form.affectationMatiereId, form.jour, form.heureDebut, form.heureFin, form.salleId, creneau?.id]);

    const handleSubmit = () => {
        if (!form.affectationMatiereId) {
            toast.error(t('creneau.modal.erreurAffectationRequise'));
            return;
        }
        const dto = {
            affectationMatiereId: form.affectationMatiereId,
            jour: form.jour,
            heureDebut: form.heureDebut,
            heureFin: form.heureFin,
            typeCreneau: form.typeCreneau,
            salleId: form.salleId || undefined,
            notes: form.notes || undefined,
            couleur: form.couleur || undefined,
            ...(isEdit ? {} : { genereAutomatiquement: form.genereAutomatiquement }),
        };

        if (isEdit && creneau) {
            updateCreneau.mutate(
                { id: creneau.id, ...dto },
                {
                    onSuccess: () => { onOpenChange(false); onSuccess?.(); },
                    onError: (err: unknown) => {
                        const e = err as { code?: string; message?: string };
                        if (e?.code === 'CONFLITS_PROPAGATION' && e.message) {
                            toast.error(e.message);
                        }
                    },
                }
            );
        } else {
            creerCreneau.mutate(dto, {
                onSuccess: () => { onOpenChange(false); onSuccess?.(); }
            });
        }
    };

    const update = (partial: Partial<FormData>) => setForm(prev => ({ ...prev, ...partial }));

    const etape1 = (
        <div className="space-y-4">
            <SectionSeparator title={t('creneau.modal.identification')} icon={<BookOpen className="h-4 w-4" />} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        {t('matiere')}
                    </label>
                    <select
                        value={matiereSelectId}
                        onChange={e => {
                            setMatiereSelectId(e.target.value);
                            setEnseignantSelectId('');
                            setClasseSelectId('');
                            update({ affectationMatiereId: '' });
                        }}
                        className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    >
                        <option value="">{t('selectionnerMatiere')}</option>
                        {matieresDisponibles.map(m => (
                            <option key={m.id} value={m.id}>{m.nom}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        {t('enseignant')}
                    </label>
                    <select
                        value={enseignantSelectId}
                        onChange={e => {
                            setEnseignantSelectId(e.target.value);
                            setClasseSelectId('');
                            // Résoudre si matière + enseignant + 1 seule classe
                            if (matiereSelectId && e.target.value) {
                                const matching = affectations.filter(
                                    a => a.matiere?.id === matiereSelectId && a.enseignant?.id === e.target.value
                                );
                                if (matching.length === 1) {
                                    setClasseSelectId(matching[0].classeAnnee?.classe?.id ?? '');
                                    update({ affectationMatiereId: matching[0].id });
                                } else {
                                    update({ affectationMatiereId: '' });
                                }
                            } else {
                                update({ affectationMatiereId: '' });
                            }
                        }}
                        disabled={!matiereSelectId}
                        className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">{t('selectionnerEnseignant')}</option>
                        {enseignantsDisponibles.map(e => (
                            <option key={e.id} value={e.id}>{e.nom}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        {t('classe')}
                    </label>
                    <select
                        value={classeSelectId}
                        onChange={e => {
                            setClasseSelectId(e.target.value);
                            if (matiereSelectId && enseignantSelectId && e.target.value) {
                                const found = affectations.find(
                                    a => a.matiere?.id === matiereSelectId
                                        && a.enseignant?.id === enseignantSelectId
                                        && a.classeAnnee?.classe?.id === e.target.value
                                );
                                update({ affectationMatiereId: found?.id ?? '' });
                            } else {
                                update({ affectationMatiereId: '' });
                            }
                        }}
                        disabled={!enseignantSelectId}
                        className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">{t('selectionnerClasse')}</option>
                        {classesDisponables.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.nom}{c.niveau ? ` (${c.niveau})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        {t('creneau.modal.typeCreneau')}
                    </label>
                    <select
                        value={form.typeCreneau}
                        onChange={e => update({ typeCreneau: e.target.value as TypeCreneau })}
                        className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    >
                        {TYPES_CRENEAU.map(type => (
                            <option key={type} value={type}>{t(`creneau.types.${type.toLowerCase()}`)}</option>
                        ))}
                    </select>
                </div>
            </div>



            <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    {t('creneau.modal.couleur')}
                </label>
                <input
                    type="color"
                    value={form.couleur || '#3b82f6'}
                    onChange={e => update({ couleur: e.target.value })}
                    className="h-10 w-20 rounded-lg border border-[var(--color-border)] cursor-pointer"
                />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
                <input
                    type="checkbox"
                    id="genere-automatiquement"
                    checked={form.genereAutomatiquement}
                    onChange={e => update({ genereAutomatiquement: e.target.checked })}
                    className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-dominante)] focus:ring-[var(--color-dominante)]"
                />
                <label htmlFor="genere-automatiquement" className="text-sm text-[var(--color-text-primary)] cursor-pointer">
                    {t('creneau.modal.genereAutomatiquement')}
                </label>
            </div>
        </div>
    );

    const etape2 = (
        <div className="space-y-4">
            <SectionSeparator title={t('creneau.modal.planification')} icon={<Calendar className="h-4 w-4" />} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        {t('creneau.modal.jour')}
                    </label>
                    <select
                        value={form.jour}
                        onChange={e => update({ jour: e.target.value as JourSemaine })}
                        className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    >
                        {JOURS.map(j => (
                            <option key={j} value={j}>{t(`jours.${j.toLowerCase()}`)}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        {t('creneau.modal.salle')}
                    </label>
                    <select
                        value={form.salleId}
                        onChange={e => update({ salleId: e.target.value })}
                        className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    >
                        <option value="">{t('creneau.modal.aucuneSalle')}</option>
                        {salles.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.nom}{s.code ? ` (${s.code})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        <Clock className="inline h-3.5 w-3.5 mr-1" />
                        {t('creneau.modal.heureDebut')}
                    </label>
                    <input
                        type="time"
                        value={form.heureDebut}
                        onChange={e => update({ heureDebut: e.target.value })}
                        className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        <Clock className="inline h-3.5 w-3.5 mr-1" />
                        {t('creneau.modal.heureFin')}
                    </label>
                    <input
                        type="time"
                        value={form.heureFin}
                        onChange={e => update({ heureFin: e.target.value })}
                        className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    />
                </div>
            </div>

            {/* Conflits détectés */}
            {conflits.length > 0 && (
                <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-danger)]">
                        <AlertTriangle className="h-4 w-4" />
                        {t('creneau.modal.conflitsDetectes', { count: conflits.length })}
                    </div>
                    {conflits.map((c, i) => (
                        <div key={i} className={`flex items-start gap-1.5 text-xs ${c.severite === 'BLOQUANT' ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'}`}>
                            {c.severite === 'BLOQUANT'
                                ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                : <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                            <span>{c.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // ─── Données enrichies pour le résumé ──────────────────────
    const affectationSelectionnee = affectations.find(a => a.id === form.affectationMatiereId);
    const matiereNom = affectationSelectionnee?.matiere?.nom;
    const matiereCode = affectationSelectionnee?.matiere?.code;
    const enseignantNom = affectationSelectionnee?.enseignant?.utilisateur?.profil
        ? `${affectationSelectionnee.enseignant.utilisateur.profil.prenom} ${affectationSelectionnee.enseignant.utilisateur.profil.nom}`
        : null;
    const classeNom = affectationSelectionnee?.classeAnnee?.classe?.nom;
    const classeNiveau = affectationSelectionnee?.classeAnnee?.classe?.niveau;
    const anneeScolaireNom = affectationSelectionnee?.classeAnnee?.anneeScolaire?.nom
        ?? (affectationSelectionnee?.classeAnnee?.anneeScolaire?.anneeDebut
            ? `${affectationSelectionnee.classeAnnee.anneeScolaire.anneeDebut}-${affectationSelectionnee.classeAnnee.anneeScolaire.anneeDebut + 1}`
            : null);

    // Durée calculée
    const dureeMinutes = useMemo(() => {
        const [h1, m1] = form.heureDebut.split(':').map(Number);
        const [h2, m2] = form.heureFin.split(':').map(Number);
        return (h2 * 60 + m2) - (h1 * 60 + m1);
    }, [form.heureDebut, form.heureFin]);
    const dureeFormatee = dureeMinutes > 0
        ? dureeMinutes >= 60
            ? `${Math.floor(dureeMinutes / 60)}h${dureeMinutes % 60 > 0 ? String(dureeMinutes % 60).padStart(2, '0') : ''}`
            : `${dureeMinutes}min`
        : null;

    // Jours fériés détectés depuis les conflits
    const joursFeriesDetectes = useMemo(() => {
        const conflitJF = conflits.find(c => c.type === 'CONFLIT_JOUR_FERIE');
        if (!conflitJF?.details?.joursFeries) return [];
        return conflitJF.details.joursFeries as Array<{ date: string; nom: string }>;
    }, [conflits]);

    const etape3 = (
        <div className="space-y-4">
            <SectionSeparator title={t('creneau.modal.resume')} icon={<CheckCircle2 className="h-4 w-4" />} />

            {/* ─── Bloc Contexte ──────────────────────────────── */}
            <div className="rounded-lg border border-[var(--color-dominant-200)] dark:border-[var(--color-dominant-800)] bg-[var(--color-dominant-50)] dark:bg-[var(--color-dominant-900)]/20 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-dominant-700)] dark:text-[var(--color-dominant-300)] mb-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    {t('creneau.modal.contexte')}
                </div>
                {matiereNom && (
                    <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                            <Hash className="h-3.5 w-3.5" /> {t('creneau.modal.matiere')} :
                        </span>
                        <span className="font-medium flex items-center gap-1.5">
                            {matiereNom}
                            {matiereCode && <span className="text-xs text-[var(--color-text-secondary)]">({matiereCode})</span>}
                        </span>
                    </div>
                )}
                {enseignantNom && (
                    <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                            <User className="h-3.5 w-3.5" /> {t('creneau.modal.enseignant')} :
                        </span>
                        <span className="font-medium">{enseignantNom}</span>
                    </div>
                )}
                {classeNom && (
                    <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5" /> {t('classe')} :
                        </span>
                        <span className="font-medium">
                            {classeNom}{classeNiveau && <span className="text-xs text-[var(--color-text-secondary)] ml-1">({classeNiveau})</span>}
                        </span>
                    </div>
                )}
                {anneeScolaireNom && (
                    <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> {t('creneau.modal.anneeScolaire')} :
                        </span>
                        <span className="font-medium">{anneeScolaireNom}</span>
                    </div>
                )}
            </div>

            {/* ─── Bloc Planification ─────────────────────────── */}
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 space-y-2 text-sm">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] mb-2">
                    <Clock className="h-3.5 w-3.5" />
                    {t('creneau.modal.planification')}
                </div>
                <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">{t('creneau.modal.jour')} :</span>
                    <span className="font-medium">{t(`jours.${form.jour.toLowerCase()}`)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">{t('creneau.modal.horaire')} :</span>
                    <span className="font-mono font-medium">{form.heureDebut} — {form.heureFin}</span>
                </div>
                {dureeFormatee && (
                    <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                            <Timer className="h-3.5 w-3.5" /> {t('creneau.modal.duree')} :
                        </span>
                        <span className="font-medium">{dureeFormatee}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">{t('creneau.modal.typeCreneau')} :</span>
                    <span className="font-medium">{t(`creneau.types.${form.typeCreneau.toLowerCase()}`)}</span>
                </div>
                {form.salleId && (
                    <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)] flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {t('creneau.modal.salle')} :
                        </span>
                        <span className="font-medium">{salles.find(s => s.id === form.salleId)?.nom ?? form.salleId.substring(0, 8)}</span>
                    </div>
                )}
            </div>

            {/* ─── Section Jours fériés détectés ──────────────── */}
            {joursFeriesDetectes.length > 0 && (
                <div className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-warning)]">
                        <CalendarOff className="h-4 w-4" />
                        {t('creneau.modal.joursFeriesDetectes', { count: joursFeriesDetectes.length })}
                    </div>
                    <ul className="space-y-1">
                        {joursFeriesDetectes.map((jf, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]" />
                                <span className="font-mono">{jf.date}</span>
                                <span>— {jf.nom}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs text-[var(--color-text-secondary)] italic">
                        {t('creneau.modal.exclusionJF automatique')}
                    </p>
                </div>
            )}

            {/* ─── Conflits ───────────────────────────────────── */}
            {hasConflitsBloquants && (
                <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-3 text-sm text-[var(--color-danger)]">
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    {t('creneau.modal.conflitsBloquants')}
                </div>
            )}

            {conflits.filter(c => c.severite === 'AVERTISSEMENT' && c.type !== 'CONFLIT_JOUR_FERIE').length > 0 && (
                <div className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-3 text-sm text-[var(--color-warning)]">
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    {t('creneau.modal.avertissements', { count: conflits.filter(c => c.severite === 'AVERTISSEMENT' && c.type !== 'CONFLIT_JOUR_FERIE').length })}
                </div>
            )}

            {/* ─── Notes ──────────────────────────────────────── */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    {t('creneau.modal.notes')}
                </label>
                <textarea
                    value={form.notes}
                    onChange={e => update({ notes: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    placeholder={t('creneau.modal.notesPlaceholder')}
                />
            </div>
        </div>
    );

    return (
        <>
            <StepperModal
                open={open}
                onOpenChange={onOpenChange}
                title={isEdit ? t('creneau.modal.titreModifier') : t('creneau.modal.titreCreer')}
                description={t('creneau.modal.description', { step: stepCourant })}
                size="2xl"
                initialStep={0}
                onStepChange={(index) => setStepCourant(index + 1)}
                nextLabel={t('suivant')}
                prevLabel={t('precedent')}
                submitLabel={isEdit ? t('modifier') : t('creer')}
                onSubmit={handleSubmit}
                footerActions={(
                    <>
                        {isEdit && estPlanifie && (
                            <ElisaButton
                                variant="secondary"
                                onClick={async () => {
                                    if (!creneau) return;
                                    await validerCreneau.mutateAsync(creneau.id);
                                    onSuccess?.();
                                }}
                                disabled={validerCreneau.isPending}
                            >
                                <ShieldCheck className="h-4 w-4 mr-1" /> {t('valider')}
                            </ElisaButton>
                        )}
                        {isEdit && (
                            <ElisaButton
                                variant="danger"
                                onClick={() => setConfirmSuppression(true)}
                                disabled={supprimerCreneau.isPending}
                            >
                                <Trash2 className="h-4 w-4 mr-1" /> {t('supprimer')}
                            </ElisaButton>
                        )}
                    </>
                )}
                steps={[
                    {
                        id: 'identification',
                        label: t('creneau.modal.etape1'),
                        icon: BookOpen,
                        content: etape1,
                        validate: () => !!form.affectationMatiereId,
                        validateError: t('creneau.modal.erreurAffectationRequise'),
                    },
                    {
                        id: 'planification',
                        label: t('creneau.modal.etape2'),
                        icon: Calendar,
                        content: etape2,
                    },
                    {
                        id: 'resume',
                        label: t('creneau.modal.etape3'),
                        icon: CheckCircle2,
                        content: etape3,
                        validate: () => !hasConflitsBloquants,
                        validateError: t('creneau.modal.conflitsBloquants'),
                    },
                ]}
            />

            {/* Q2 : confirmation suppression — avertissement instances futures annulées */}
            <ConfirmationModal
                isOpen={confirmSuppression}
                title={t('propagation.supprimerTitre')}
                message={t('propagation.supprimerMessage')}
                details={t('propagation.supprimerDetails')}
                variant="danger"
                confirmLabel={t('supprimer')}
                cancelLabel={t('annuler')}
                isLoading={supprimerCreneau.isPending}
                onConfirm={async () => {
                    if (!creneau) return;
                    await supprimerCreneau.mutateAsync(creneau.id);
                    setConfirmSuppression(false);
                    onOpenChange(false);
                    onSuccess?.();
                }}
                onCancel={() => setConfirmSuppression(false)}
            />
        </>
    );
}
