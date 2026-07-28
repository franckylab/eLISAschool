/**
 * ==================================
 * eLISAschool - Utilitaires de formatage
 * ==================================
 * Fonctions de formatage monétaire, nombres, tailles de fichiers
 */

/**
 * Formate un montant monétaire avec Intl.NumberFormat
 * @example formatMontant(1250000, 'XAF') → "1 250 000 FCFA"
 */
export function formatMontant(
    montant: number | undefined | null,
    devise = 'XAF',
    locale?: string,
): string {
    if (montant === undefined || montant === null) return '—';
    const lang = locale || localStorage.getItem('i18nextLng') || 'fr';

    try {
        const formatter = new Intl.NumberFormat(lang, {
            style: 'currency',
            currency: devise,
            minimumFractionDigits: devise === 'XAF' || devise === 'XOF' ? 0 : 2,
            maximumFractionDigits: devise === 'XAF' || devise === 'XOF' ? 0 : 2,
        });
        return formatter.format(montant);
    } catch {
        // Fallback si la devise n'est pas supportée
        return `${nombreFormate(montant, lang)} ${devise}`;
    }
}

/**
 * Formate un nombre avec séparateurs de milliers
 * @example nombreFormate(1250000) → "1 250 000"
 */
export function nombreFormate(
    nombre: number | undefined | null,
    locale?: string,
    decimals = 0,
): string {
    if (nombre === undefined || nombre === null) return '—';
    const lang = locale || localStorage.getItem('i18nextLng') || 'fr';

    return new Intl.NumberFormat(lang, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(nombre);
}

/**
 * Formate un pourcentage
 * @example formatPourcentage(85.5) → "85,5 %"
 */
export function formatPourcentage(
    valeur: number | undefined | null,
    decimals = 1,
): string {
    if (valeur === undefined || valeur === null) return '—';
    const lang = localStorage.getItem('i18nextLng') || 'fr';

    return new Intl.NumberFormat(lang, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(valeur / 100);
}

/**
 * Formate une taille de fichier en unités lisibles
 * @example formatFileSize(1048576) → "1 Mo"
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 o';
    const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Tronque un texte à une longueur maximale
 */
export function tronquer(texte: string, max = 50): string {
    if (!texte) return '';
    if (texte.length <= max) return texte;
    return texte.slice(0, max) + '…';
}

/**
 * Formate un numéro de téléphone
 * @example formatTelephone('237690123456') → "+237 690 123 456"
 */
export function formatTelephone(
    telephone: string | undefined | null,
    indicatif = '+237',
): string {
    if (!telephone) return '—';
    // Nettoyer le numéro
    const clean = telephone.replace(/\D/g, '');
    if (clean.length === 9) {
        return `${indicatif} ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
    }
    if (clean.startsWith('237') && clean.length === 12) {
        return `+${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
    }
    return telephone;
}

/**
 * Génère les initiales d'un nom complet
 * @example getInitiales('Jean-Pierre', 'Dupont') → "JD"
 */
export function getInitiales(prenom?: string, nom?: string): string {
    const p = prenom?.trim()?.[0]?.toUpperCase() || '';
    const n = nom?.trim()?.[0]?.toUpperCase() || '';
    return p + n || '?';
}

/**
 * Formate un volume horaire hebdomadaire stocké en **minutes/semaine**
 * (source unique : `MatiereNiveau.volumeHoraire`, refonte EDT v4.0).
 *
 * L'affichage utilise le format "Xh" ou "XhMM" ; les minutes ne s'affichent
 * que si elles sont non nulles.
 *
 * @example formatVolumeMinutesToHours(240) → "4h"
 * @example formatVolumeMinutesToHours(150) → "2h30"
 * @example formatVolumeMinutesToHours(45)  → "45min"
 * @example formatVolumeMinutesToHours(null) → "—"
 */
export function formatVolumeMinutesToHours(minutes: number | null | undefined): string {
    if (minutes === undefined || minutes === null || Number.isNaN(minutes)) return '—';
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const heures = Math.floor(minutes / 60);
    const reste = Math.round(minutes % 60);
    return reste === 0 ? `${heures}h` : `${heures}h${reste.toString().padStart(2, '0')}`;
}
