/**
 * ==================================
 * eLISAschool - Helper occupation des postes (multi-occupants)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { Poste, StatutPoste } from '@modules/organisation/entities';
import { AffectationPoste, StatutAffectation } from '../entities';

type Manager = { getRepository: typeof AppDataSource.getRepository };

/**
 * Recompte les affectations actives d'un poste et synchronise
 * occupantsCount + statut (ACTIF si occupé, VACANT sinon).
 * Source unique de vérité — utilisé par contrat.service et affectation.service.
 */
export async function recalculerOccupantsEtStatut(
    posteId: string,
    manager: Manager = AppDataSource,
): Promise<void> {
    const count = await manager.getRepository(AffectationPoste).count({
        where: { posteId, statut: StatutAffectation.ACTIF },
    });
    await manager.getRepository(Poste).update(posteId, {
        occupantsCount: count,
        statut: count > 0 ? StatutPoste.ACTIF : StatutPoste.VACANT,
    });
}

/**
 * Vérifie la capacité multi-occupants d'un poste.
 * Lève POSTE_COMPLET (409) si le nombre d'affectations actives atteint nombrePostes.
 * `membrePersonnelId` : si fourni et déjà affecté activement au poste, la garde passe
 * (ré-affectation du même membre = pas une occupation supplémentaire).
 */
export async function verifierCapacitePoste(
    poste: Poste,
    membrePersonnelId?: string,
    manager: Manager = AppDataSource,
): Promise<void> {
    const repo = manager.getRepository(AffectationPoste);
    const count = await repo.count({
        where: { posteId: poste.id, statut: StatutAffectation.ACTIF },
    });
    if (count < (poste.nombrePostes || 1)) return;

    if (membrePersonnelId) {
        const dejaAffecte = await repo.findOne({
            where: { posteId: poste.id, membrePersonnelId, statut: StatutAffectation.ACTIF },
        });
        if (dejaAffecte) return;
    }

    throw new AppError(
        `Ce poste a atteint son nombre maximum d'affectations (${poste.nombrePostes}/${poste.nombrePostes})`,
        409, 'POSTE_COMPLET',
    );
}
