/**
 * ==================================
 * eLISAschool - Utilitaire mention Bulletin
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Retourne la clé i18n de la mention selon la moyenne générale sur 20.
 */

export function getMentionKey(moyenne: number): string {
    if (moyenne >= 16) return 'mentionTresBien';
    if (moyenne >= 14) return 'mentionBien';
    if (moyenne >= 12) return 'mentionAssezBien';
    if (moyenne >= 10) return 'mentionPassable';
    return 'mentionInsuffisant';
}
