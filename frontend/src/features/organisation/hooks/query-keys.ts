/**
 * ==================================
 * eLISAschool - Clés de cache TanStack Query — Module Organisation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Source unique de vérité pour les query keys du module organisation.
 * Utilisé par tous les hooks pour garantir la cohérence du cache.
 */

export const ORGA_KEYS = {
    unites: {
        all: ['organisation', 'unites'] as const,
        liste: (filtres: Record<string, unknown>) => [...ORGA_KEYS.unites.all, filtres] as const,
        detail: (id: string) => [...ORGA_KEYS.unites.all, 'detail', id] as const,
        arborescence: ['organisation', 'unites', 'arborescence'] as const,
        chemin: (uniteId: string) => [...ORGA_KEYS.unites.all, 'chemin', uniteId] as const,
    },
    organigramme: {
        all: ['organisation', 'organigramme'] as const,
    },
    stats: {
        all: ['organisation', 'statistiques'] as const,
    },
    hierarchie: {
        all: ['organisation', 'hierarchie'] as const,
        liste: (params?: { personnelId?: string }) => [...ORGA_KEYS.hierarchie.all, params] as const,
        superieurs: (personnelId: string) => [...ORGA_KEYS.hierarchie.all, 'superieurs', personnelId] as const,
        subordonnes: (superieurId: string) => [...ORGA_KEYS.hierarchie.all, 'subordonnes', superieurId] as const,
    },
    validation: {
        all: ['organisation', 'validation'] as const,
    },
    echelons: {
        all: ['organisation', 'echelons-structurels'] as const,
    },
    niveaux: {
        all: ['organisation', 'niveaux-responsabilite'] as const,
    },
    modes: {
        all: ['organisation', 'modes-remuneration'] as const,
    },
    templates: {
        all: ['organisation', 'templates'] as const,
    },
} as const;
