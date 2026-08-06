/**
 * ==================================
 * eLISAschool - Service de Détection de Conflits
 * ==================================
 * Version: 1.1.0
 * Auteur: franck arlos chendjou
 * Date: 2026-07-24
 *
 * Détecte les 6 types de conflits pour les créneaux horaires :
 * - Bloquants (erreur 409) : conflit classe, enseignant, salle
 * - Avertissements : dépassement volume horaire, créneau imposable, jour férié
 * ==================================
 */

import { AppDataSource } from '@database/data-source';
import { CreneauHoraire, JourSemaine, JourFerie } from '../entities';
import { AffectationMatiere } from '@modules/matieres/entities';
import { ClasseAnnee } from '@modules/classes/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { coefficientResolverService } from '@modules/matieres/services/coefficient-resolver.service';
import { PreferenceEmploiDuTemps, CreneauImposable } from '../entities/preference-emploi-du-temps.entity';
import { logger } from '@common/utils/logger.util';
import { verifierOverlapHoraire, calculerDureeMinutes } from './conflit-commun.service';

/**
 * Types de conflits détectés
 */
export enum TypeConflit {
    CONFLIT_CLASSE = 'CONFLIT_CLASSE',
    CONFLIT_ENSEIGNANT = 'CONFLIT_ENSEIGNANT',
    CONFLIT_SALLE = 'CONFLIT_SALLE',
    DEPASSEMENT_VOLUME_HORAIRE = 'DEPASSEMENT_VOLUME_HORAIRE',
    CRENEAU_IMPOSABLE = 'CRENEAU_IMPOSABLE',
    CONFLIT_JOUR_FERIE = 'CONFLIT_JOUR_FERIE',
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
    salleId?: string | null;
    excludeCreneauId?: string;
}

export class ConflitDetectionService {
    private creneauRepo = AppDataSource.getRepository(CreneauHoraire);
    private affectationRepo = AppDataSource.getRepository(AffectationMatiere);
    private preferenceRepo = AppDataSource.getRepository(PreferenceEmploiDuTemps);
    private jourFerieRepo = AppDataSource.getRepository(JourFerie);

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

            // 6. Jour férié (AVERTISSEMENT) — résout le jour de semaine en date réelle via l'année scolaire
            const jourFerie = await this.detecterConflitJourFerie(
                donnees, affectation, etablissementId,
            );
            if (jourFerie) conflits.push(jourFerie);

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
            .where(
                '(am.enseignantId = :enseignantId OR (am."coEnseignantIds" IS NOT NULL AND string_to_array(am."coEnseignantIds", \',\') @> ARRAY[:enseignantId]::text[]))',
                { enseignantId },
            )
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
            verifierOverlapHoraire(c.heureDebut, c.heureFin, donnees.heureDebut, donnees.heureFin)
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
        const matiereNiveau = await coefficientResolverService.resoudreMatiereNiveau(
            affectation.matiereId,
            affectation.classeAnnee?.classe?.niveauId ?? '',
            affectation.classeAnnee?.classe?.filiereId,
        );

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
        const nouvellesMinutes = calculerDureeMinutes(donnees.heureDebut, donnees.heureFin);
        // volumeHoraire est en minutes/semaine (source : MatiereNiveau) — comparaison en minutes
        const totalApresAjoutMinutes = totalMinutes + nouvellesMinutes;

        if (totalApresAjoutMinutes > matiereNiveau.volumeHoraire) {
            const totalHeures = (totalApresAjoutMinutes / 60).toFixed(1);
            const requisHeures = (matiereNiveau.volumeHoraire / 60).toFixed(1);
            return {
                type: TypeConflit.DEPASSEMENT_VOLUME_HORAIRE,
                severite: SeveriteConflit.AVERTISSEMENT,
                message: `Volume horaire dépassé : ${totalHeures}h planifiées sur ${requisHeures}h requises pour cette matière`,
                details: {
                    volumeHoraireRequisMinutes: matiereNiveau.volumeHoraire,
                    totalPlanifieMinutes: totalApresAjoutMinutes,
                    depassementMinutes: totalApresAjoutMinutes - matiereNiveau.volumeHoraire,
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

    /**
     * 6. Détection de conflit avec un jour férié (AVERTISSEMENT).
     * Résout le jour de semaine en dates réelles dans l'année scolaire,
     * puis vérifie si l'une de ces dates est un jour férié.
     */
    private async detecterConflitJourFerie(
        donnees: DonneesCreneau,
        affectation: AffectationMatiere | null,
        etablissementId: string,
    ): Promise<Conflit | null> {
        // Résoudre l'année scolaire via l'affectation → classeAnnee → anneeScolaire
        let anneeScolaire: AnneeScolaire | null = null;

        if (affectation?.classeAnneeId) {
            const classeAnnee = await AppDataSource.getRepository(ClasseAnnee).findOne({
                where: { id: affectation.classeAnneeId },
                relations: ['anneeScolaire'],
            });
            anneeScolaire = classeAnnee?.anneeScolaire ?? null;
        }

        if (!anneeScolaire) return null;

        // Charger les jours fériés de l'établissement (ou globaux)
        const joursFeries = await this.jourFerieRepo
            .createQueryBuilder('jf')
            .where('jf.etablissementId = :etablissementId OR jf.etablissementId IS NULL', { etablissementId })
            .getMany();

        if (joursFeries.length === 0) return null;

        // Mapper le jour de semaine au numéro JS (LUNDI=1 ... DIMANCHE=0)
        const jourMap: Record<JourSemaine, number> = {
            LUNDI: 1, MARDI: 2, MERCREDI: 3, JEUDI: 4,
            VENDREDI: 5, SAMEDI: 6, DIMANCHE: 0,
        };
        const targetDay = jourMap[donnees.jour];

        // Résoudre toutes les dates du jour cible dans la période de l'année scolaire
        const dateDebut = new Date(anneeScolaire.dateDebut);
        const dateFin = new Date(anneeScolaire.dateFin);
        const datesConcernees: Date[] = [];

        const current = new Date(dateDebut);
        // Avancer au premier jour cible
        while (current.getDay() !== targetDay && current <= dateFin) {
            current.setDate(current.getDate() + 1);
        }
        // Collecter toutes les occurrences du jour cible
        while (current <= dateFin) {
            datesConcernees.push(new Date(current));
            current.setDate(current.getDate() + 7);
        }

        // Vérifier si l'une de ces dates est un jour férié
        const joursFeriesTrouves: Array<{ date: Date; nom: string }> = [];
        for (const date of datesConcernees) {
            for (const jf of joursFeries) {
                if (jf.correspondADate(date)) {
                    joursFeriesTrouves.push({ date, nom: jf.nom });
                }
            }
        }

        if (joursFeriesTrouves.length > 0) {
            const dateStr = joursFeriesTrouves.map(jf =>
                `${jf.date.toLocaleDateString('fr-FR')} (${jf.nom})`
            ).join(', ');
            return {
                type: TypeConflit.CONFLIT_JOUR_FERIE,
                severite: SeveriteConflit.AVERTISSEMENT,
                message: `Jour férié : ce ${donnees.jour} tombe un jour férié les dates suivantes : ${dateStr}`,
                details: {
                    joursFeries: joursFeriesTrouves.map(jf => ({
                        date: jf.date.toISOString().slice(0, 10),
                        nom: jf.nom,
                    })),
                },
            };
        }
        return null;
    }

    /**
     * Audit global : scan tous les créneaux de l'établissement et détecte les conflits existants.
     * Retourne la liste complète des conflits avec les créneaux impliqués.
     */
    async auditConflitsGlobaux(
        etablissementId: string,
        options?: { periodeId?: string; anneeScolaireId?: string },
    ): Promise<{
        totalConflits: number;
        conflitsBloquants: number;
        avertissements: number;
        conflits: Array<{
            type: TypeConflit;
            severite: SeveriteConflit;
            message: string;
            creneauxIds: string[];
            details: Record<string, unknown>;
        }>;
    }> {
        const qb = this.creneauRepo
            .createQueryBuilder('ch')
            .leftJoinAndSelect('ch.affectationMatiere', 'am')
            .leftJoinAndSelect('am.matiere', 'matiere')
            .leftJoinAndSelect('am.enseignant', 'enseignant')
            .leftJoinAndSelect('am.classeAnnee', 'classeAnnee')
            .leftJoinAndSelect('classeAnnee.classe', 'classe')
            .leftJoinAndSelect('ch.salle', 'salle')
            .where('ch.etablissementId = :etablissementId', { etablissementId });

        if (options?.periodeId) {
            qb.andWhere('ch.periodeId = :periodeId', { periodeId: options.periodeId });
        }
        if (options?.anneeScolaireId) {
            qb.andWhere('ch.anneeScolaireId = :anneeScolaireId', { anneeScolaireId: options.anneeScolaireId });
        }

        qb.orderBy('ch.jour', 'ASC').addOrderBy('ch.heureDebut', 'ASC');
        const creneaux = await qb.getMany();

        const conflits: Array<{
            type: TypeConflit;
            severite: SeveriteConflit;
            message: string;
            creneauxIds: string[];
            details: Record<string, unknown>;
        }> = [];

        // Passage unique : regroupement classe/enseignant/salle par jour (3 scans → 1)
        const parClasseJour = new Map<string, typeof creneaux>();
        const parEnseignantJour = new Map<string, typeof creneaux>();
        const parSalleJour = new Map<string, typeof creneaux>();
        for (const c of creneaux) {
            const classeId = c.affectationMatiere?.classeAnneeId;
            if (classeId) {
                const key = `${classeId}:${c.jour}`;
                if (!parClasseJour.has(key)) parClasseJour.set(key, []);
                parClasseJour.get(key)!.push(c);
            }
            const ensId = c.affectationMatiere?.enseignantId;
            if (ensId) {
                const key = `${ensId}:${c.jour}`;
                if (!parEnseignantJour.has(key)) parEnseignantJour.set(key, []);
                parEnseignantJour.get(key)!.push(c);
            }
            if (c.salleId) {
                const key = `${c.salleId}:${c.jour}`;
                if (!parSalleJour.has(key)) parSalleJour.set(key, []);
                parSalleJour.get(key)!.push(c);
            }
        }
        for (const [, groupe] of parClasseJour) {
            for (let i = 0; i < groupe.length; i++) {
                for (let j = i + 1; j < groupe.length; j++) {
                    if (groupe[i].heureDebut < groupe[j].heureFin && groupe[i].heureFin > groupe[j].heureDebut) {
                        conflits.push({
                            type: TypeConflit.CONFLIT_CLASSE,
                            severite: SeveriteConflit.BLOQUANT,
                            message: `Conflit classe: ${groupe[i].id.substring(0, 8)} et ${groupe[j].id.substring(0, 8)} le ${groupe[i].jour} ${groupe[i].heureDebut}-${groupe[i].heureFin}`,
                            creneauxIds: [groupe[i].id, groupe[j].id],
                            details: {
                                classeAnneeId: groupe[i].affectationMatiere?.classeAnneeId,
                                jour: groupe[i].jour,
                            },
                        });
                    }
                }
            }
        }

        // 2. Conflits enseignant (même enseignant, même jour, heures qui se chevauchent)
        for (const [, groupe] of parEnseignantJour) {
            for (let i = 0; i < groupe.length; i++) {
                for (let j = i + 1; j < groupe.length; j++) {
                    if (groupe[i].heureDebut < groupe[j].heureFin && groupe[i].heureFin > groupe[j].heureDebut) {
                        conflits.push({
                            type: TypeConflit.CONFLIT_ENSEIGNANT,
                            severite: SeveriteConflit.BLOQUANT,
                            message: `Conflit enseignant: ${groupe[i].id.substring(0, 8)} et ${groupe[j].id.substring(0, 8)} le ${groupe[i].jour} ${groupe[i].heureDebut}-${groupe[i].heureFin}`,
                            creneauxIds: [groupe[i].id, groupe[j].id],
                            details: {
                                enseignantId: groupe[i].affectationMatiere?.enseignantId,
                                jour: groupe[i].jour,
                            },
                        });
                    }
                }
            }
        }

        // 3. Conflits de salle (même salle, même jour, heures qui se chevauchent)
        for (const [, groupe] of parSalleJour) {
            for (let i = 0; i < groupe.length; i++) {
                for (let j = i + 1; j < groupe.length; j++) {
                    if (groupe[i].heureDebut < groupe[j].heureFin && groupe[i].heureFin > groupe[j].heureDebut) {
                        conflits.push({
                            type: TypeConflit.CONFLIT_SALLE,
                            severite: SeveriteConflit.BLOQUANT,
                            message: `Conflit salle: ${groupe[i].id.substring(0, 8)} et ${groupe[j].id.substring(0, 8)} le ${groupe[i].jour} ${groupe[i].heureDebut}-${groupe[i].heureFin}`,
                            creneauxIds: [groupe[i].id, groupe[j].id],
                            details: {
                                salleId: groupe[i].salleId,
                                jour: groupe[i].jour,
                            },
                        });
                    }
                }
            }
        }

        // 4. Conflits jours fériés — créneaux existants tombant sur un jour férié
        const joursFeries = await this.jourFerieRepo
            .createQueryBuilder('jf')
            .where('jf.etablissementId = :etablissementId OR jf.etablissementId IS NULL', { etablissementId })
            .getMany();

        if (joursFeries.length > 0) {
            // Grouper les créneaux par année scolaire pour résoudre les dates
            const parAnneeScolaire = new Map<string, typeof creneaux>();
            for (const c of creneaux) {
                const anneeId = c.anneeScolaireId;
                if (!anneeId) continue;
                if (!parAnneeScolaire.has(anneeId)) parAnneeScolaire.set(anneeId, []);
                parAnneeScolaire.get(anneeId)!.push(c);
            }

            const jourMap: Record<JourSemaine, number> = {
                LUNDI: 1, MARDI: 2, MERCREDI: 3, JEUDI: 4,
                VENDREDI: 5, SAMEDI: 6, DIMANCHE: 0,
            };

            for (const [anneeId, creneauxAnnee] of parAnneeScolaire) {
                // Charger l'année scolaire pour cette période
                const anneeScolaire = await AppDataSource.getRepository(AnneeScolaire).findOne({
                    where: { id: anneeId },
                });
                if (!anneeScolaire) continue;

                const dateDebut = new Date(anneeScolaire.dateDebut);
                const dateFin = new Date(anneeScolaire.dateFin);

                // Grouper par jour de semaine pour éviter de recalculer les dates
                const parJour = new Map<JourSemaine, typeof creneaux>();
                for (const c of creneauxAnnee) {
                    if (!parJour.has(c.jour)) parJour.set(c.jour, []);
                    parJour.get(c.jour)!.push(c);
                }

                for (const [jour, creneauxJour] of parJour) {
                    // Résoudre toutes les dates de ce jour dans l'année
                    const targetDay = jourMap[jour];
                    const dates: Date[] = [];
                    const current = new Date(dateDebut);
                    while (current.getDay() !== targetDay && current <= dateFin) {
                        current.setDate(current.getDate() + 1);
                    }
                    while (current <= dateFin) {
                        dates.push(new Date(current));
                        current.setDate(current.getDate() + 7);
                    }

                    // Trouver les JF pour ce jour
                    const jfDates: Array<{ date: Date; nom: string }> = [];
                    for (const date of dates) {
                        for (const jf of joursFeries) {
                            if (jf.correspondADate(date)) {
                                jfDates.push({ date, nom: jf.nom });
                            }
                        }
                    }

                    // Signaler chaque créneau qui tombe sur un JF
                    if (jfDates.length > 0) {
                        for (const c of creneauxJour) {
                            conflits.push({
                                type: TypeConflit.CONFLIT_JOUR_FERIE,
                                severite: SeveriteConflit.AVERTISSEMENT,
                                message: `Le créneau ${c.id.substring(0, 8)} (${c.affectationMatiere?.matiere?.nom || 'Matière'}) le ${jour} tombe sur ${jfDates.length} jour(s) férié(s) : ${jfDates.map(j => `${j.date.toLocaleDateString('fr-FR')} (${j.nom})`).join(', ')}`,
                                creneauxIds: [c.id],
                                details: {
                                    jour: c.jour,
                                    joursFeries: jfDates.map(j => ({ date: j.date.toISOString().slice(0, 10), nom: j.nom })),
                                },
                            });
                        }
                    }
                }
            }
        }

        const conflitsBloquants = conflits.filter(c => c.severite === SeveriteConflit.BLOQUANT).length;
        const avertissements = conflits.filter(c => c.severite === SeveriteConflit.AVERTISSEMENT).length;

        logger.info(`[Audit EDT] ${conflits.length} conflit(s) détectés pour établissement ${etablissementId}`);

        return {
            totalConflits: conflits.length,
            conflitsBloquants,
            avertissements,
            conflits,
        };
    }

}

export const conflitDetectionService = new ConflitDetectionService();
