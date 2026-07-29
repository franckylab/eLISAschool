/**
 * ==================================
 * eLISAschool - Résolveur de relations pour l'audit (portée « avec entités liées »)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';

/**
 * Paire (cible, id) d'une entité enfant liée à une entité parente.
 * Utilisée pour élargir le filtre des logs d'audit aux entités liées
 * quand les colonnes parentCible/parentCibleId ne sont pas renseignées
 * (logs legacy antérieurs à la migration 135).
 */
export interface CibleLiee {
    cible: string;
    ids: string[];
}

/** Requête de résolution d'un type d'entité enfant lié à un parent. */
interface RelationEnfant {
    /** Nom de la cible audit de l'entité enfant (ex: 'Note') */
    cible: string;
    /** Table PostgreSQL de l'entité enfant */
    table: string;
    /** Colonne FK (camelCase, sera quotée) pointant vers le parent */
    colonneParent: string;
}

/**
 * Carte des relations parent → enfants par cible d'audit.
 * Chaque entrée décrit comment retrouver les ids des entités enfants
 * d'un parent donné via une requête SQL directe (performante, sans charger d'entités).
 */
const RELATIONS_PAR_CIBLE: Record<string, RelationEnfant[]> = {
    Classe: [
        { cible: 'ClasseAnnee', table: 'classes_annees', colonneParent: 'classeId' },
    ],
    ClasseAnnee: [
        { cible: 'Note', table: 'notes', colonneParent: 'classeAnneeId' },
        { cible: 'AffectationEleve', table: 'affectations_eleves', colonneParent: 'classeAnneeId' },
        { cible: 'AffectationMatiere', table: 'affectations_matieres', colonneParent: 'classeAnneeId' },
    ],
    Eleve: [
        { cible: 'Note', table: 'notes', colonneParent: 'eleveId' },
        { cible: 'Bulletin', table: 'bulletins', colonneParent: 'eleveId' },
        { cible: 'AffectationEleve', table: 'affectations_eleves', colonneParent: 'eleveId' },
    ],
    MembrePersonnel: [
        { cible: 'ContratPersonnel', table: 'contrats_personnel', colonneParent: 'membrePersonnelId' },
        { cible: 'BulletinPaie', table: 'bulletins_paie', colonneParent: 'membrePersonnelId' },
        { cible: 'AffectationPoste', table: 'affectations_postes', colonneParent: 'membrePersonnelId' },
    ],
    Matiere: [
        { cible: 'AffectationMatiere', table: 'affectations_matieres', colonneParent: 'matiereId' },
    ],
    Periode: [
        { cible: 'Note', table: 'notes', colonneParent: 'periodeId' },
        { cible: 'Bulletin', table: 'bulletins', colonneParent: 'periodeId' },
    ],
    AnneeScolaire: [
        { cible: 'ClasseAnnee', table: 'classes_annees', colonneParent: 'anneeScolaireId' },
        { cible: 'Periode', table: 'periodes', colonneParent: 'anneeScolaireId' },
    ],
    UniteOrganisationnelle: [
        { cible: 'Poste', table: 'postes', colonneParent: 'uniteOrganisationnelleId' },
    ],
    Poste: [
        { cible: 'AffectationPoste', table: 'affectations_postes', colonneParent: 'posteId' },
    ],
};

/** Limite d'ids enfants par relation pour borner la taille de la clause SQL. */
const MAX_IDS_PAR_RELATION = 500;

export class AuditRelationResolverService {
    /**
     * Résout les entités enfants liées à un parent (cible, cibleId).
     * Retourne les paires (cible enfant, ids) trouvées en base — utilisées
     * en fallback pour les logs legacy sans parentCible/parentCibleId.
     */
    async resoudreEnfants(cible: string, cibleId: string): Promise<CibleLiee[]> {
        const relations = RELATIONS_PAR_CIBLE[cible];
        if (!relations || relations.length === 0) return [];

        const resultats: CibleLiee[] = [];

        for (const relation of relations) {
            try {
                const lignes: { id: string }[] = await AppDataSource.query(
                    `SELECT id FROM ${relation.table} WHERE "${relation.colonneParent}" = $1 LIMIT ${MAX_IDS_PAR_RELATION}`,
                    [cibleId],
                );
                if (lignes.length > 0) {
                    resultats.push({ cible: relation.cible, ids: lignes.map((l) => l.id) });
                }
            } catch (error) {
                // Table absente ou schéma divergent : on ignore la relation (fallback best-effort)
                logger.warn(
                    `[AuditRelationResolver] Résolution ignorée pour ${cible} → ${relation.cible} (${relation.table}): ${(error as Error).message}`,
                );
            }
        }

        return resultats;
    }
}

// Singleton exporté
export const auditRelationResolverService = new AuditRelationResolverService();
