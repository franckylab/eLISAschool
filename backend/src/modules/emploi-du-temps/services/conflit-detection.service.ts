/**
 * ==================================
 * eLISAschool - Service de Détection de Conflits
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-07-24
 *
 * Détecte les 5 types de conflits pour les créneaux horaires :
 * - Bloquants (erreur 409) : conflit classe, enseignant, salle
 * - Avertissements : dépassement volume horaire, créneau imposable
 * ==================================
 */

import { AppDataSource } from '@database/data-source';
import { CreneauHoraire, JourSemaine } from '../entities';
import { AffectationMatiere } from '@modules/matieres/entities';
import { MatiereNiveau } from '@modules/matieres/entities';
import { PreferenceEmploiDuTemps, CreneauImposable } from '../entities/preference-emploi-du-temps.entity';
import { logger } from '@common/utils/logger.util';

/**
 * Types de conflits détectés
 */
export enum TypeConflit {
    CONFLIT_CLASSE = 'CONFLIT_CLASSE',
    CONFLIT_ENSEIGNANT = 'CONFLIT_ENSEIGNANT',
    CONFLIT_SALLE = 'CONFLIT_SALLE',
    DEPASSEMENT_VOLUME_HORAIRE = 'DEPASSEMENT_VOLUME_HORAIRE',
    CRENEAU_IMPOSABLE = 'CRENEAU_IMPOSABLE',
}

/**
 * Sévérité du conflit
 */
export enum SeveriteConflit {
    BLOQUANT = 'BLOQUANT',
    AVERTISSEMENT = 'AVERTISSEMENT',
}

/**
 * Résultat de détection de conflit
 */
export interface Conflit {
    type: TypeConflit;
    severite: SeveriteConflit;
    message: string;
    details: Record<string, unknown>;
}

/**
 * Données d'un créneau à vérifier
 */
export interface DonneesCreneau {
    affectationMatiereId?: string;
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    salleId?: string;
    excludeCreneauId?: string;
}

export class ConflitDetectionService {
    private creneauRepo = AppDataSource.getRepository(CreneauHoraire);
    private affectationRepo = AppDataSource.getRepository(AffectationMatiere);
    private matiereNiveauRepo = AppDataSource.getRepository(MatiereNiveau);
    private preferenceRepo = AppDataSource.getRepository(PreferenceEmploiDuTemps);

    /**
     * Détecte tous les conflits pour un créneau donné
     */
    async detecterConflits(
        donnees: DonneesCreneau,
        etablissementId: string,
    ): Promise<Conflit[]> {
        const conflits: Conflit[] = [];

        try {
            // Résoudre l'affectation pour obtenir classe, enseignant, matière
            let affectation: AffectationMatiere | null = null;
            if (donnees.affectationMatiereId) {
                affectation = await this.affectationRepo.findOne({
                    where: { id: donnees.affectationMatiereId },
                    relations: ['classeAnnee', 'classeAnnee.classe'],
                });
            }

            // 1. Conflit de classe (BLOQUANT)
            if (affectation?.classeAnneeId) {
                const conflitClasse = await this.detecterConflitClasse(
                    donnees, affectation.classeAnneeId, etablissementId,
                );
                if (conflitClasse) conflits.push(conflitClasse);
            }

            // 2. Conflit d'enseignant (BLOQUANT) — inclut co-enseignants
            if (affectation?.enseignantId) {
                const tousEnseignants = [
                    affectation.enseignantId,
                    ...(affectation.coEnseignantIds || []),
                ];
                for (const ensId of tousEnseignants) {
                    const conflitEnseignant = await this.detecterConflitEnseignant(
                        donnees, ensId, etablissementId,
                    );
                    if (conflitEnseignant) conflits.push(conflitEnseignant);
                }
            }

            // 3. Conflit de salle (BLOQUANT)
            if (donnees.salleId) {
                const conflitSalle = await this.detecterConflitSalle(
                    donnees, donnees.salleId, etablissementId,
                );
                if (conflitSalle) conflits.push(conflitSalle);
            }

            // 4. Dépassement volume horaire (AVERTISSEMENT)
            if (affectation) {
                const depassement = await this.detecterDepassementVolume(
                    donnees, affectation, etablissementId,
                );
                if (depassement) conflits.push(depassement);
            }

            // 5. Créneau imposable (AVERTISSEMENT)
            const imposable = await this.detecterCreneauImposable(
                donnees, etablissementId,
            );
            if (imposable) conflits.push(imposable);

        } catch (error) {
            logger.error('[ConflitDetection] Erreur lors de la détection des conflits', error);
        }

        return conflits;
    }

    /**
     * Vérifie s'il y a des conflits bloquants.
     */
    async aDesConflitsBloquants(
        donnees: DonneesCreneau,
        etablissementId: string,
    ): Promise<boolean> {
        const conflits = await this.detecterConflits(donnees, etablissementId);
        return conflits.some(c => c.severite === SeveriteConflit.BLOQUANT);
    }

    // ─── Détections privées ────────────────────────────────────

    private async detecterConflitClasse(
        donnees: DonneesCreneau, classeAnneeId: string, etablissementId: string,
    ): Promise<Conflit | null> {
        const creneauxExistants = await this.creneauRepo
            .createQueryBuilder('ch')
            .innerJoin('ch.affectationMatiere', 'am')
            .where('am.classeAnneeId = :classeAnneeId', { classeAnneeId })
            .andWhere('ch.jour = :jour', { jour: donnees.jour })
            .andWhere('ch.etablissementId = :etablissementId', { etablissementId })
            .andWhere('ch.heureDebut < :heureFin', { heureFin: donnees.heureFin })
            .andWhere('ch.heureFin > :heureDebut', { heureDebut: donnees.heureDebut })
            .getMany();

        const filtered = donnees.excludeCreneauId
            ? creneauxExistants.filter(c => c.id !== donnees.excludeCreneauId)
            : creneauxExistants;

        if (filtered.length > 0) {
            return {
                type: TypeConflit.CONFLIT_CLASSE,
                severite: SeveriteConflit.BLOQUANT,
                message: `Conflit de classe : ${filtered.length} créneau(x) existe(nt) déjà pour cette classe le ${donnees.jour} entre ${donnees.heureDebut} et ${donnees.heureFin}`,
                details: { creneauxEnConflit: filtered.map(c => ({ id: c.id, plage: c.plageHoraire })) },
            };
        }
        return null;
    }

    private async detecterConflitEnseignant(
        donnees: DonneesCreneau, enseignantId: string, etablissementId: string,
    ): Promise<Conflit | null> {
        const creneauxExistants = await this.creneauRepo
            .createQueryBuilder('ch')
            .innerJoin('ch.affectationMatiere', 'am')
            .where('(am.enseignantId = :enseignantId OR am."coEnseignantIds" LIKE :likeId)', {
                enseignantId,
                likeId: `%${enseignantId}%`,
            })
            .andWhere('ch.jour = :jour', { jour: donnees.jour })
            .andWhere('ch.etablissementId = :etablissementId', { etablissementId })
            .andWhere('ch.heureDebut < :heureFin', { heureFin: donnees.heureFin })
            .andWhere('ch.heureFin > :heureDebut', { heureDebut: donnees.heureDebut })
            .getMany();

        const filtered = donnees.excludeCreneauId
            ? creneauxExistants.filter(c => c.id !== donnees.excludeCreneauId)
            : creneauxExistants;

        if (filtered.length > 0) {
            return {
                type: TypeConflit.CONFLIT_ENSEIGNANT,
                severite: SeveriteConflit.BLOQUANT,
                message: `Conflit enseignant : cet enseignant est déjà occupé le ${donnees.jour} entre ${donnees.heureDebut} et ${donnees.heureFin}`,
                details: { creneauxEnConflit: filtered.map(c => ({ id: c.id, plage: c.plageHoraire })) },
            };
        }
        return null;
    }

    private async detecterConflitSalle(
        donnees: DonneesCreneau, salleId: string, etablissementId: string,
    ): Promise<Conflit | null> {
        const creneauxExistants = await this.creneauRepo.find({
            where: { salleId, jour: donnees.jour, etablissementId },
        });

        const enConflit = creneauxExistants.filter(c =>
            c.heureDebut < donnees.heureFin && c.heureFin > donnees.heureDebut
        );

        const filtered = donnees.excludeCreneauId
            ? enConflit.filter(c => c.id !== donnees.excludeCreneauId)
            : enConflit;

        if (filtered.length > 0) {
            return {
                type: TypeConflit.CONFLIT_SALLE,
                severite: SeveriteConflit.BLOQUANT,
                message: `Conflit de salle : cette salle est déjà occupée le ${donnees.jour} entre ${donnees.heureDebut} et ${donnees.heureFin}`,
                details: { creneauxEnConflit: filtered.map(c => ({ id: c.id, plage: c.plageHoraire })) },
            };
        }
        return null;
    }

    private async detecterDepassementVolume(
        donnees: DonneesCreneau, affectation: AffectationMatiere, etablissementId: string,
    ): Promise<Conflit | null> {
        const matiereNiveau = await this.matiereNiveauRepo.findOne({
            where: {
                matiereId: affectation.matiereId,
                niveauId: affectation.classeAnnee?.classe?.niveauId ?? '',
            },
        });

        if (!matiereNiveau?.volumeHoraire) return null;

        const creneauxMatiere = await this.creneauRepo
            .createQueryBuilder('ch')
            .innerJoin('ch.affectationMatiere', 'am')
            .where('am.matiereId = :matiereId', { matiereId: affectation.matiereId })
            .andWhere('am.classeAnneeId = :classeAnneeId', { classeAnneeId: affectation.classeAnneeId })
            .andWhere('ch.etablissementId = :etablissementId', { etablissementId })
            .getMany();

        const filtered = donnees.excludeCreneauId
            ? creneauxMatiere.filter(c => c.id !== donnees.excludeCreneauId)
            : creneauxMatiere;

        const totalMinutes = filtered.reduce((sum, c) => sum + c.dureeMinutes, 0);
        const nouvellesMinutes = this.calculerMinutes(donnees.heureDebut, donnees.heureFin);
        const totalApresAjout = (totalMinutes + nouvellesMinutes) / 60;

        if (totalApresAjout > matiereNiveau.volumeHoraire) {
            return {
                type: TypeConflit.DEPASSEMENT_VOLUME_HORAIRE,
                severite: SeveriteConflit.AVERTISSEMENT,
                message: `Volume horaire dépassé : ${totalApresAjout.toFixed(1)}h planifiées sur ${matiereNiveau.volumeHoraire}h requises pour cette matière`,
                details: {
                    volumeHoraireRequis: matiereNiveau.volumeHoraire,
                    totalPlanifie: totalApresAjout,
                    depassement: totalApresAjout - matiereNiveau.volumeHoraire,
                },
            };
        }
        return null;
    }

    private async detecterCreneauImposable(
        donnees: DonneesCreneau, etablissementId: string,
    ): Promise<Conflit | null> {
        const preference = await this.preferenceRepo.findOne({
            where: { etablissementId },
        });

        if (!preference?.creneauxImposables?.length) return null;

        const creneauxImposables = preference.creneauxImposables as CreneauImposable[];
        const imposable = creneauxImposables.find(ci =>
            ci.jour === donnees.jour &&
            ci.heureDebut < donnees.heureFin &&
            ci.heureFin > donnees.heureDebut
        );

        if (imposable) {
            return {
                type: TypeConflit.CRENEAU_IMPOSABLE,
                severite: SeveriteConflit.AVERTISSEMENT,
                message: `Créneau imposable : cette plage horaire est exclue (${imposable.motif || 'sans motif'})`,
                details: { creneauImposable: imposable },
            };
        }
        return null;
    }

    private calculerMinutes(heureDebut: string, heureFin: string): number {
        const [h1, m1] = heureDebut.split(':').map(Number);
        const [h2, m2] = heureFin.split(':').map(Number);
        return (h2 * 60 + m2) - (h1 * 60 + m1);
    }
}

export const conflitDetectionService = new ConflitDetectionService();
