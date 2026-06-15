/**
 * ==================================
 * eLISAschool - Utilitaires de dates
 * ==================================
 * Fonctions de formatage de dates avec date-fns et locale
 */

import { format, formatDistanceToNow, parseISO, isValid, Locale } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { enUS } from 'date-fns/locale/en-US';

const LOCALES: Record<string, Locale> = { fr, en: enUS };

function getLocale(): Locale {
    const lang = localStorage.getItem('i18nextLng') || 'fr';
    return LOCALES[lang.split('-')[0]] || fr;
}

/**
 * Formate une date au format lisible
 * @example formatDate('2025-01-15T10:30:00Z') → "15 janvier 2025"
 */
export function formatDate(
    date: string | Date | undefined | null,
    pattern = 'dd MMMM yyyy',
): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, pattern, { locale: getLocale() });
}

/**
 * Formate une date avec l'heure
 * @example formatDateTime('2025-01-15T10:30:00Z') → "15 janv. 2025, 10:30"
 */
export function formatDateTime(
    date: string | Date | undefined | null,
    pattern = 'dd MMM yyyy, HH:mm',
): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, pattern, { locale: getLocale() });
}

/**
 * Retourne la date relative ("il y a 5 minutes")
 */
export function formatRelative(
    date: string | Date | undefined | null,
): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return formatDistanceToNow(d, { addSuffix: true, locale: getLocale() });
}

/**
 * Formate pour un champ input (YYYY-MM-DD)
 */
export function formatDateInput(date: string | Date | undefined | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '';
    return format(d, 'yyyy-MM-dd');
}

/**
 * Vérifie si une date est dans le passé
 */
export function isDatePast(date: string | Date): boolean {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isValid(d) && d < new Date();
}

/**
 * Retourne le début et la fin d'une plage de dates
 */
export function getDateRange(periode: 'today' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    switch (periode) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;
        case 'week':
            start.setDate(start.getDate() - start.getDay() + 1);
            start.setHours(0, 0, 0, 0);
            break;
        case 'month':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            break;
        case 'year':
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            break;
    }

    return { start, end };
}
