/**
 * ==================================
 * eLISAschool - Utilitaires de téléchargement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Fonctions génériques de téléchargement, nommage de fichiers
 * et calcul de taille — réutilisables par tout module d'export
 * (organigramme, emploi du temps, bulletins, etc.).
 */

/** Déclenche le téléchargement d'un dataURL dans le navigateur */
export function telecharger(dataUrl: string, nomFichier: string): void {
    const link = document.createElement('a');
    link.download = nomFichier;
    link.href = dataUrl;
    link.click();
}

/**
 * Génère un nom de fichier normalisé pour un export.
 * Remplace les espaces par des underscores, fallback si nom vide.
 */
export function genererNomFichier(
    nomEtablissement: string,
    suffixe: string,
    format: string,
): string {
    const date = new Date().toISOString().slice(0, 10);
    const base = nomEtablissement.replace(/\s+/g, '_') || suffixe;
    return `${base}_${suffixe}_${date}.${format}`;
}

/** Taille réelle en octets d'un dataURL base64 */
export function tailleDataUrlOctets(dataUrl: string): number {
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    return Math.round(base64.length * 0.75);
}

/** Formate une taille en octets en chaîne lisible (Ko/Mo/Go) */
export function formaterTaille(octets: number): string {
    if (octets >= 1024 * 1024 * 1024) {
        return `${(octets / (1024 * 1024 * 1024)).toFixed(1)} Go`;
    }
    if (octets >= 1024 * 1024) {
        const mo = octets / (1024 * 1024);
        return `${mo < 10 ? mo.toFixed(1) : Math.round(mo)} Mo`;
    }
    if (octets >= 1024) {
        return `${Math.round(octets / 1024)} Ko`;
    }
    return `${octets} o`;
}
