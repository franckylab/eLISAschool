/**
 * ==================================
 * eLISAschool - Modal Datepicker EDT
 * ==================================
 * Modal de navigation rapide par date — calendrier mensuel interactif
 * avec sélecteurs mois/année en dropdown, grille jour, footer Aujourd'hui + Semaine courante.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Crosshair, CalendarDays } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';

interface EDTDatePickerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Date actuellement sélectionnée dans la navigation */
    currentDate: Date;
    /** Callback quand l'utilisateur sélectionne une date */
    onDateSelect: (date: Date) => void;
    /** Callback pour retourner à la date courante */
    onToday: () => void;
    /** Callback pour aller à la semaine courante */
    onCurrentWeek: () => void;
    /** Dates avec créneaux (pour pastilles indicatrices) — format 'YYYY-MM-DD' */
    datesAvecCreneaux?: Set<string>;
    /** Dates des jours fériés */
    joursFeries?: Array<{ date?: string | null; nom: string; couleur?: string | null }>;
}

const JOURS_SEMAINE_LU = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const;
const JOURS_SEMAINE_DI = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const;

/**
 * Modal de navigation par date pour l'emploi du temps.
 * Calendrier mensuel avec dropdowns mois/année + footer actions rapides.
 * Badges créneaux/JF + toggle semaine Lu/Di.
 */
export function EDTDatePickerModal({
    open,
    onOpenChange,
    currentDate,
    onDateSelect,
    onToday,
    onCurrentWeek,
    datesAvecCreneaux,
    joursFeries,
}: EDTDatePickerModalProps) {
    const { t, i18n } = useTranslation('emplois');
    const locale = i18n.language || 'fr';

    // Mois/année en cours de visualisation dans le modal
    const [viewMonth, setViewMonth] = useState(currentDate.getMonth());
    const [viewYear, setViewYear] = useState(currentDate.getFullYear());

    // Toggle semaine : lundi (défaut) ou dimanche en première colonne
    const [semaineLundi, setSemaineLundi] = useState(true);
    const JOURS_SEMAINE_KEYS = semaineLundi ? JOURS_SEMAINE_LU : JOURS_SEMAINE_DI;

    // ─── Map jours fériés (date string → JF info) ─────
    const jfMap = useMemo(() => {
        const map = new Map<string, { nom: string; couleur?: string | null }>();
        if (joursFeries) {
            for (const jf of joursFeries) {
                if (jf.date) map.set(jf.date, { nom: jf.nom, couleur: jf.couleur });
            }
        }
        return map;
    }, [joursFeries]);

    // ─── Options mois/année ───────────────────────────
    const moisOptions = useMemo(() =>
        Array.from({ length: 12 }, (_, i) => ({
            value: i,
            label: new Date(2000, i, 1).toLocaleDateString(locale, { month: 'long' }),
        })),
        [locale]
    );

    const anneeOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => ({
            value: currentYear - 5 + i,
            label: String(currentYear - 5 + i),
        }));
    }, []);

    // ─── Grille calendrier ────────────────────────────
    const joursDuMois = useMemo(() => {
        const premierJour = new Date(viewYear, viewMonth, 1);
        const dernierJour = new Date(viewYear, viewMonth + 1, 0);

        // Jour de la semaine du 1er (0=dim, 1=lun, ..., 6=sam)
        const jourSemaine = premierJour.getDay();
        // Offset : si semaineLundi, lundi=0 → dim=6 ; si semaineDi, dimanche=0 direct
        const offset = semaineLundi ? (jourSemaine === 0 ? 6 : jourSemaine - 1) : jourSemaine;

        const cellules: Array<{ date: Date; jour: number; dansMois: boolean }> = [];

        // Jours du mois précédent (padding)
        for (let i = offset - 1; i >= 0; i--) {
            const d = new Date(viewYear, viewMonth, -i);
            cellules.push({ date: d, jour: d.getDate(), dansMois: false });
        }

        // Jours du mois courant
        for (let j = 1; j <= dernierJour.getDate(); j++) {
            cellules.push({ date: new Date(viewYear, viewMonth, j), jour: j, dansMois: true });
        }

        // Compléter jusqu'à 42 cellules (6 semaines)
        while (cellules.length < 42) {
            const next = cellules.length - offset - dernierJour.getDate() + 1;
            const d = new Date(viewYear, viewMonth + 1, next);
            cellules.push({ date: d, jour: d.getDate(), dansMois: false });
        }

        return cellules;
    }, [viewMonth, viewYear, semaineLundi]);

    // ─── Navigation interne au modal ──────────────────
    const moisPrecedent = useCallback(() => {
        setViewMonth(prev => {
            if (prev === 0) {
                setViewYear(y => y - 1);
                return 11;
            }
            return prev - 1;
        });
    }, []);

    const moisSuivant = useCallback(() => {
        setViewMonth(prev => {
            if (prev === 11) {
                setViewYear(y => y + 1);
                return 0;
            }
            return prev + 1;
        });
    }, []);

    /** Navigation par semaine : décale de ±7 jours */
    const semainePrecedente = useCallback(() => {
        const d = new Date(viewYear, viewMonth, 1);
        d.setDate(d.getDate() - 7);
        setViewMonth(d.getMonth());
        setViewYear(d.getFullYear());
    }, [viewMonth, viewYear]);

    const semaineSuivante = useCallback(() => {
        const d = new Date(viewYear, viewMonth, 1);
        d.setDate(d.getDate() + 7);
        setViewMonth(d.getMonth());
        setViewYear(d.getFullYear());
    }, [viewMonth, viewYear]);

    const handleDateClick = useCallback((date: Date) => {
        onDateSelect(date);
        onOpenChange(false);
    }, [onDateSelect, onOpenChange]);

    const handleAujourdhui = useCallback(() => {
        onToday();
        onOpenChange(false);
    }, [onToday, onOpenChange]);

    const handleSemaineCourante = useCallback(() => {
        onCurrentWeek();
        onOpenChange(false);
    }, [onCurrentWeek, onOpenChange]);

    // ─── Détection aujourd'hui ────────────────────────
    const today = new Date();
    const isToday = (d: Date) => d.toDateString() === today.toDateString();
    const isSelected = (d: Date) => d.toDateString() === currentDate.toDateString();

    // ─── Format date → 'YYYY-MM-DD' pour lookups ─────
    const formatDateKey = useCallback((d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }, []);

    const hasCreneaux = useCallback((d: Date) => {
        return datesAvecCreneaux?.has(formatDateKey(d)) ?? false;
    }, [datesAvecCreneaux, formatDateKey]);

    const getJF = useCallback((d: Date) => {
        return jfMap.get(formatDateKey(d));
    }, [jfMap, formatDateKey]);

    // ─── Titre du label mois/année ────────────────────
    const titreMoisAnnee = new Date(viewYear, viewMonth, 1)
        .toLocaleDateString(locale, { month: 'long', year: 'numeric' });

    // ─── Numéros de semaine ISO pour chaque rangée ────
    const numerosSemaine = useMemo(() => {
        const semaines: { num: number; visible: boolean }[] = [];
        for (let i = 0; i < joursDuMois.length; i += 7) {
            const row = joursDuMois.slice(i, i + 7);
            const premierJourSemaine = row[0];
            if (premierJourSemaine) {
                // Visible uniquement si la semaine a au moins un jour dans le mois affiché
                const aJoursDansMois = row.some(c => c.dansMois);
                semaines.push({ num: getISOWeek(premierJourSemaine.date), visible: aJoursDansMois });
            }
        }
        return semaines;
    }, [joursDuMois]);

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('navigation.titreDatepicker')}
            description={t('navigation.descriptionDatepicker')}
            size="md"
            draggable={false}
            resizable={false}
            footer={
                <div className="flex items-center justify-between gap-[var(--gap-sm)] w-full">
                    <ElisaButton
                        variant="ghost"
                        size="sm"
                        icon={<Crosshair className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        onClick={handleAujourdhui}
                    >
                        {t('navigation.aujourdhui')}
                    </ElisaButton>
                    <ElisaButton
                        variant="secondary"
                        size="sm"
                        icon={<CalendarDays className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        onClick={handleSemaineCourante}
                    >
                        {t('navigation.semaineCourante')}
                    </ElisaButton>
                </div>
            }
        >
            <div className="flex flex-col gap-[var(--gap-md)]">
                {/* ─── Header : dropdowns mois + année + navigation ─── */}
                <div className="flex items-center justify-between gap-[var(--gap-sm)]">
                    <div className="flex items-center gap-[var(--gap-xxs)]">
                        <ElisaButton
                            variant="ghost"
                            size="xs"
                            icon={<ChevronsLeft className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                            onClick={semainePrecedente}
                            aria-label={t('navigation.semainePrecedente', 'Semaine précédente')}
                        />
                        <ElisaButton
                            variant="ghost"
                            size="xs"
                            icon={<ChevronLeft className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                            onClick={moisPrecedent}
                            aria-label={t('navigation.moisPrecedent')}
                        />
                    </div>

                    <div className="flex items-center gap-[var(--gap-xs)] flex-1 justify-center">
                        {/* Dropdown mois */}
                        <ElisaSelect
                            value={String(viewMonth)}
                            onValueChange={(v) => setViewMonth(Number(v))}
                            options={moisOptions.map(opt => ({ value: String(opt.value), label: opt.label }))}
                            compact
                            aria-label={t('navigation.selectionnerMois')}
                        />

                        {/* Dropdown année */}
                        <ElisaSelect
                            value={String(viewYear)}
                            onValueChange={(v) => setViewYear(Number(v))}
                            options={anneeOptions.map(opt => ({ value: String(opt.value), label: opt.label }))}
                            compact
                            className="w-[clamp(4rem,10vw,5.5rem)]"
                            aria-label={t('navigation.selectionnerAnnee')}
                        />
                    </div>

                    <div className="flex items-center gap-[var(--gap-xxs)]">
                        <ElisaButton
                            variant="ghost"
                            size="xs"
                            icon={<ChevronRight className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                            onClick={moisSuivant}
                            aria-label={t('navigation.moisSuivant')}
                        />
                        <ElisaButton
                            variant="ghost"
                            size="xs"
                            icon={<ChevronsRight className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                            onClick={semaineSuivante}
                            aria-label={t('navigation.semaineSuivante', 'Semaine suivante')}
                        />
                    </div>
                </div>

                {/* ─── Label mois/année (accessibilité) + toggle semaine ─── */}
                <div className="flex items-center justify-center gap-[var(--gap-sm)]">
                    <span
                        className="font-semibold text-[var(--color-text-primary)] capitalize"
                        style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1.0625rem)' }}
                        aria-live="polite"
                    >
                        {titreMoisAnnee}
                    </span>
                    {/* Toggle début semaine Lu/Di */}
                    <div className="flex items-center rounded-md border border-[var(--color-bordure)] overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setSemaineLundi(true)}
                            className={`px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                                semaineLundi
                                    ? 'bg-[var(--color-dominant-600)] text-white'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                            }`}
                            aria-label={t('navigation.lundi')}
                            title={t('navigation.toggleSemaine')}
                        >
                            {t('navigation.lundi')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setSemaineLundi(false)}
                            className={`px-1.5 py-0.5 text-[10px] font-medium transition-colors border-l border-[var(--color-bordure)] ${
                                !semaineLundi
                                    ? 'bg-[var(--color-dominant-600)] text-white'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                            }`}
                            aria-label={t('navigation.dimanche')}
                            title={t('navigation.toggleSemaine')}
                        >
                            {t('navigation.dimanche')}
                        </button>
                    </div>
                </div>

                {/* ─── Grille jours de la semaine (en-têtes) ─── */}
                <div className="grid grid-cols-[1.5rem_repeat(7,1fr)] gap-[var(--gap-xs)] items-center">
                    <div className="w-6 text-center">
                        <span
                            className="font-medium text-[var(--color-text-muted)] uppercase"
                            style={{ fontSize: 'clamp(0.5rem, 0.45rem + 0.1vw, 0.5625rem)' }}
                        >
                            #
                        </span>
                    </div>
                    {JOURS_SEMAINE_KEYS.map((key) => (
                        <div
                            key={key}
                            className="text-center py-[var(--space-xxs)]"
                        >
                            <span
                                className="font-medium text-[var(--color-text-secondary)] uppercase"
                                style={{ fontSize: 'clamp(0.625rem, 0.58rem + 0.15vw, 0.6875rem)' }}
                            >
                                {t(`jours.${key}`).slice(0, 2)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ─── Grille calendrier (6 semaines max) ─── */}
                <div className="flex flex-col gap-[var(--gap-xs)]">
                    {numerosSemaine.map((sem, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-[1.5rem_repeat(7,1fr)] gap-[var(--gap-xs)] items-center">
                            {/* Numéro de semaine (visible si la semaine a ≥1 jour dans le mois) */}
                            <div className="w-6 text-center">
                                {sem.visible && (
                                    <span
                                        className="font-medium text-[var(--color-text-muted)]"
                                        style={{ fontSize: 'clamp(0.5rem, 0.45rem + 0.1vw, 0.5625rem)' }}
                                    >
                                        S{sem.num}
                                    </span>
                                )}
                            </div>
                            {/* Jours de la semaine */}
                            {joursDuMois.slice(rowIdx * 7, rowIdx * 7 + 7).map(({ date, jour, dansMois }, index) => {
                                const aujourdhui = isToday(date);
                                const selectionne = isSelected(date);
                                const avecCreneaux = dansMois && hasCreneaux(date);
                                const jf = dansMois ? getJF(date) : undefined;

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleDateClick(date)}
                                        className={`
                                            relative flex items-center justify-center rounded-[var(--radius-md)]
                                            transition-all duration-150
                                            h-[clamp(1.75rem,1.5rem+0.5vw,2.25rem)]
                                            w-full
                                            text-[var(--color-text-primary)]
                                            hover:bg-[var(--color-surface-hover)]
                                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dominant-400)]
                                            ${!dansMois ? 'text-[var(--color-text-muted)] opacity-30' : ''}
                                            ${aujourdhui && !selectionne ? 'ring-2 ring-[var(--color-dominant-400)] font-semibold' : ''}
                                            ${selectionne ? 'bg-[var(--color-dominant-600)] text-white font-bold shadow-sm hover:bg-[var(--color-dominant-700)]' : ''}
                                        `}
                                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                        aria-label={date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                                        aria-current={aujourdhui ? 'date' : undefined}
                                        title={jf ? `${jf.nom}` : undefined}
                                    >
                                        {jour}
                                        {/* Dot indicateur aujourd'hui (bottom-center) */}
                                        {aujourdhui && !selectionne && (
                                            <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 h-[5px] w-[5px] rounded-full bg-[var(--color-dominant-500)]" />
                                        )}
                                        {/* Dot créneaux (bottom-right) */}
                                        {avecCreneaux && !selectionne && (
                                            <span
                                                className="absolute bottom-[3px] right-[3px] h-[5px] w-[5px] rounded-full bg-[var(--color-success)]"
                                                title={t('navigation.creneauxDispo')}
                                            />
                                        )}
                                        {/* Dot jour férié (top-right) */}
                                        {jf && !selectionne && (
                                            <span
                                                className="absolute top-[3px] right-[3px] h-[5px] w-[5px] rounded-full"
                                                style={{ backgroundColor: jf.couleur || 'var(--color-accent-500)' }}
                                                title={jf.nom}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </CustomModal>
    );
}

// ─── Helper : Numéro de semaine ISO ─────────────────

/**
 * Calcule le numéro de semaine ISO 8601 pour une date donnée.
 * Semaine ISO : commence le lundi, semaine 1 = première semaine avec un jeudi.
 */
function getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
