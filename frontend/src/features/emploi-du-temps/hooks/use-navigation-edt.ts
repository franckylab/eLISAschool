/**
 * ==================================
 * eLISAschool - Hook Navigation EDT
 * ==================================
 * Logique de navigation calendrier (semaine/mois/jour) extraite de la page
 * Version: 1.0.0
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export type PlanningView = 'semaine' | 'mois' | 'jour' | 'liste';

/**
 * Hook de navigation calendrier pour l'emploi du temps.
 * Gère : date courante, navigation précédent/suivant/aujourd'hui,
 * calcul des bornes (semaine/mois), label dynamique.
 */
export function useNavigationEDT() {
    const { t, i18n } = useTranslation('emplois');
    const locale = i18n.language || 'fr';
    const [planningView, setPlanningView] = useState<PlanningView>('semaine');
    const [navigationDate, setNavigationDate] = useState(new Date());

    /** Lundi de la semaine de référence */
    const semaineDebut = useMemo(() => {
        const d = new Date(navigationDate);
        const day = d.getDay();
        const diff = d.getDate() - (day === 0 ? 6 : day - 1);
        const lundi = new Date(d.setDate(diff));
        lundi.setHours(0, 0, 0, 0);
        return lundi;
    }, [navigationDate]);

    /** 1er du mois de référence */
    const moisDebut = useMemo(() => {
        const d = new Date(navigationDate);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [navigationDate]);

    /** Label dynamique selon le mode de vue */
    const navigationLabel = useMemo(() => {
        switch (planningView) {
            case 'semaine': {
                const fin = new Date(semaineDebut);
                fin.setDate(fin.getDate() + 5);
                const fmt = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
                return `S${numeroSemaineISO(semaineDebut)} — ${fmt(semaineDebut)} — ${fmt(fin)}`;
            }
            case 'mois':
                return navigationDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
            case 'jour':
                return navigationDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            case 'liste':
                return '';
        }
    }, [planningView, navigationDate, semaineDebut, locale]);

    /** Indique si la date affichée correspond à la période courante */
    const estCourant = useMemo(() => {
        const now = new Date();
        switch (planningView) {
            case 'semaine': return isSameWeek(navigationDate, now);
            case 'mois': return navigationDate.getMonth() === now.getMonth() && navigationDate.getFullYear() === now.getFullYear();
            case 'jour': return navigationDate.toDateString() === now.toDateString();
            default: return true;
        }
    }, [planningView, navigationDate]);

    const naviguerPrecedent = useCallback(() => {
        setNavigationDate(prev => {
            const d = new Date(prev);
            switch (planningView) {
                case 'semaine': d.setDate(d.getDate() - 7); break;
                case 'mois': d.setMonth(d.getMonth() - 1); break;
                case 'jour': d.setDate(d.getDate() - 1); break;
            }
            return d;
        });
    }, [planningView]);

    const naviguerSuivant = useCallback(() => {
        setNavigationDate(prev => {
            const d = new Date(prev);
            switch (planningView) {
                case 'semaine': d.setDate(d.getDate() + 7); break;
                case 'mois': d.setMonth(d.getMonth() + 1); break;
                case 'jour': d.setDate(d.getDate() + 1); break;
            }
            return d;
        });
    }, [planningView]);

    const naviguerAujourdhui = useCallback(() => {
        setNavigationDate(new Date());
    }, []);

    return {
        planningView, setPlanningView,
        navigationDate, setNavigationDate,
        semaineDebut, moisDebut,
        navigationLabel, estCourant,
        naviguerPrecedent, naviguerSuivant, naviguerAujourdhui,
    };
}

// ─── Helpers ─────────────────────────────────────────

function numeroSemaineISO(d: Date): number {
    const date = new Date(d);
    date.setDate(date.getDate() + 3);
    const yearStart = new Date(date.getFullYear(), 0, 1);
    return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
}

function isSameWeek(a: Date, b: Date): boolean {
    const getMonday = (d: Date) => {
        const r = new Date(d);
        const day = r.getDay();
        r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
        r.setHours(0, 0, 0, 0);
        return r;
    };
    return getMonday(a).getTime() === getMonday(b).getTime();
}
