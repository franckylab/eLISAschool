/**
 * ==================================
 * eLISAschool - Libellés des relations hiérarchiques
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Helpers de présentation : extrait un libellé lisible (jamais d'UUID)
 * pour chaque extrémité d'une relation personne→personne ou poste→poste.
 */

import type { HierarchiePersonnel } from '../types/organisation.types';

export interface ExtremiteHierarchie {
    label: string;
    sousLabel?: string;
    type: 'personne' | 'poste';
}

export function estRelationPoste(h: HierarchiePersonnel): boolean {
    return !!(h.posteId || h.superieurPosteId);
}

export function libelleExtremite(
    h: HierarchiePersonnel,
    cote: 'subordonne' | 'superieur',
): ExtremiteHierarchie {
    const personne = cote === 'subordonne' ? h.personnel : h.superieur;
    const poste = cote === 'subordonne' ? h.poste : h.superieurPoste;

    if (poste) {
        return {
            label: poste.intitule || poste.code || '—',
            sousLabel: poste.uniteOrganisationnelle?.nom,
            type: 'poste',
        };
    }
    if (personne) {
        const profil = personne.utilisateur?.profil;
        const nomComplet = [profil?.prenom, profil?.nom].filter(Boolean).join(' ');
        return {
            label: nomComplet || personne.matricule || '—',
            sousLabel: nomComplet ? personne.matricule : undefined,
            type: 'personne',
        };
    }
    return { label: '—', type: estRelationPoste(h) ? 'poste' : 'personne' };
}

export function uniteRelation(h: HierarchiePersonnel): string | undefined {
    return h.superieurPoste?.uniteOrganisationnelle?.nom || h.poste?.uniteOrganisationnelle?.nom;
}
