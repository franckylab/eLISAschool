/**
 * ==================================
 * eLISAschool - Service Calcul Paie
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Supporte les 4 modes de rémunération :
 *   MENSUEL      → Salaire fixe mensuel (salaireBase)
 *   HORAIRE      → tarifHoraire × heures effectuées (via HeureCours)
 *   MIXTE        → Fixe + heures sup au-delà de heuresContractuellesMois
 *   HEBDOMADAIRE → tarifHebdomadaire × 52 / 12
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { BulletinPaie, StatutBulletinPaie } from '../entities/bulletin-paie.entity';
import { ElementSalaire, TypeElementSalaire, CategorieElementSalaire } from '../entities/element-salaire.entity';
import { Cotisation } from '../entities/cotisation.entity';
import { TypePrime } from '../entities/type-prime.entity';
import { MembrePersonnel, ContratPersonnel } from '@modules/personnel/entities';
import { heureCoursService } from '@modules/personnel/services';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { validationWorkflowService } from '@modules/validation-workflow/services';

export interface DetailMatiereSimulation {
    matiereNom: string;
    heures: number;
    tarifHoraire: number;
    montant: number;
}

export interface SimulationResult {
    salaireBase: number;
    heuresEffectuees: number;
    heuresSup: number;
    montantHeuresSup: number;
    detailParMatiere: DetailMatiereSimulation[];
    primes: number;
    cotisationsPatronales: number;
    cotisationsSalariales: number;
    totalRetenues: number;
    salaireNet: number;
    coutTotalEmployeur: number;
    elements: ElementSalaire[];
}

export class CalculPaieService {
    private bulletinRepo: Repository<BulletinPaie>;
    private elementRepo: Repository<ElementSalaire>;
    private cotisationRepo: Repository<Cotisation>;
    private primeRepo: Repository<TypePrime>;
    private personnelRepo: Repository<MembrePersonnel>;
    private contratRepo: Repository<ContratPersonnel>;

    constructor() {
        this.bulletinRepo = AppDataSource.getRepository(BulletinPaie);
        this.elementRepo = AppDataSource.getRepository(ElementSalaire);
        this.cotisationRepo = AppDataSource.getRepository(Cotisation);
        this.primeRepo = AppDataSource.getRepository(TypePrime);
        this.personnelRepo = AppDataSource.getRepository(MembrePersonnel);
        this.contratRepo = AppDataSource.getRepository(ContratPersonnel);
    }

    async calculerBulletin(
        membrePersonnelId: string,
        mois: number,
        annee: number,
        etablissementId: string,
        options?: { userId?: string; req?: any; checkConflict?: 'THROW' | 'UPDATE' | 'AUTO' }
    ): Promise<BulletinPaie> {
        const existingBulletin = await this.bulletinRepo.findOne({
            where: { membrePersonnelId, mois, annee },
        });

        const conflictMode = options?.checkConflict || 'AUTO';
        if (existingBulletin) {
            if (conflictMode === 'THROW') {
                throw new AppError('Bulletin déjà existant', 409, 'CONFLICT');
            }
            if (existingBulletin.statut === 'PAYE') {
                throw new AppError('Bulletin déjà payé, non modifiable', 400, 'BULLETIN_DEJA_PAYE');
            }
        }

        const membre = await this.personnelRepo.findOne({
            where: { id: membrePersonnelId, etablissementId },
            relations: ['typePersonnel'],
        });

        if (!membre) {
            throw new AppError('Membre du personnel non trouvé', 404, 'NOT_FOUND');
        }

        const contrat = await this.contratRepo.findOne({
            where: { membrePersonnelId: membrePersonnelId },
            order: { dateDebut: 'DESC' },
            relations: ['typeContratEntity'],
        });

        if (!contrat) {
            throw new AppError('Aucun contrat trouvé pour ce membre', 404, 'NO_CONTRACT');
        }

        const simulation = await this.simulerPaie(membrePersonnelId, etablissementId, mois, annee);

        let bulletin: BulletinPaie;

        if (existingBulletin) {
            bulletin = existingBulletin;
        } else {
            bulletin = this.bulletinRepo.create({
                membrePersonnelId,
                contratId: contrat.id,
                mois,
                annee,
                etablissementId,
            });
        }

        bulletin.salaireBase = simulation.salaireBase;
        bulletin.heuresEffectuees = simulation.heuresEffectuees;
        bulletin.montantHeuresSup = simulation.montantHeuresSup;
        bulletin.primes = simulation.primes;
        bulletin.deductions = simulation.totalRetenues;
        bulletin.salaireNet = simulation.salaireNet;
        bulletin.statut = StatutBulletinPaie.GENERE;

        await this.bulletinRepo.save(bulletin);
        await this.creerElementsBulletin(bulletin.id, simulation.elements, etablissementId);

        // Workflow validation si requis (uniquement pour création)
        if (!existingBulletin && options?.userId) {
            const requireValidation = await getParamBoolean('personnel.paie.require_validation', { defaultValue: true });
            if (requireValidation) {
                try {
                    await validationWorkflowService.createWorkflow({
                        module: 'personnel',
                        entiteId: bulletin.id,
                        entiteType: 'BulletinPaie',
                        niveauxRequis: 2,
                        etablissementId,
                    }, options.userId);
                } catch (error) {
                    logger.warn(`[Paie] Échec création workflow bulletin (non bloquant)`, error);
                }
            }
        }

        // Audit
        if (options?.userId) {
            await auditService.log({
                utilisateurId: options.userId,
                action: existingBulletin ? AuditAction.BULLETIN_PAI_UPDATE : AuditAction.BULLETIN_PAI_CREATE,
                cible: 'BulletinPaie',
                cibleId: bulletin.id,
                description: existingBulletin
                    ? `Recalcul bulletin paie ${bulletin.id} pour ${mois}/${annee}`
                    : `Création bulletin paie ${bulletin.id} pour ${mois}/${annee}`,
                nouvellesValeurs: { mois, annee, salaireBase: simulation.salaireBase, salaireNet: simulation.salaireNet },
                module: 'personnel',
            }, options.req);
        }

        logger.info(`[Paie] Bulletin calculé: ${membre.matricule} - ${mois}/${annee}`);
        return bulletin;
    }

    async simulerPaie(
        membrePersonnelId: string,
        etablissementId: string,
        mois?: number,
        annee?: number
    ): Promise<SimulationResult> {
        const elements: ElementSalaire[] = [];
        let ordre = 0;

        const contrat = await this.contratRepo.findOne({
            where: { membrePersonnelId },
            order: { dateDebut: 'DESC' },
            relations: ['typeContratEntity'],
        });

        if (!contrat) {
            throw new AppError('Aucun contrat trouvé', 404, 'NO_CONTRACT');
        }

        const membre = await this.personnelRepo.findOne({
            where: { id: membrePersonnelId },
            relations: ['typePersonnel'],
        });

        const mode = contrat.modeRemuneration?.code
            || contrat.typeContratEntity?.modeRemuneration?.code
            || 'MENSUEL';

        let salaireBase = 0;
        let heuresEffectuees = 0;
        let heuresSup = 0;
        let montantHeuresSup = 0;
        let detailParMatiere: DetailMatiereSimulation[] = [];

        switch (mode) {
            case 'MENSUEL':
                salaireBase = contrat.salaireBase || 0;
                elements.push(this.creerElement(
                    TypeElementSalaire.GAIN, CategorieElementSalaire.SALAIRE_BASE,
                    'Salaire mensuel fixe',
                    salaireBase, salaireBase, undefined, ordre++
                ));
                break;

            case 'HORAIRE': {
                const tarifHoraire = contrat.tarifHoraire || 0;
                const resume = mois && annee
                    ? await heureCoursService.getResumeMensuel(membrePersonnelId, mois, annee, etablissementId)
                    : { heuresEffectuees: 0, detailParMatiere: [] as any[] };
                heuresEffectuees = resume.heuresEffectuees || 0;
                detailParMatiere = resume.detailParMatiere || [];
                for (const d of detailParMatiere) {
                    elements.push(this.creerElement(
                        TypeElementSalaire.GAIN, CategorieElementSalaire.HEURE_COURS, d.matiereNom,
                        d.montant, d.heures, d.tarifHoraire, ordre++
                    ));
                }
                salaireBase = +(tarifHoraire * heuresEffectuees).toFixed(2);
                elements.push(this.creerElement(
                    TypeElementSalaire.GAIN, CategorieElementSalaire.SALAIRE_BASE,
                    `Total heures (${heuresEffectuees}h × ${tarifHoraire} FCFA)`,
                    salaireBase, heuresEffectuees, tarifHoraire, ordre++
                ));
                break;
            }

            case 'MIXTE': {
                const fixe = contrat.salaireBase || 0;
                const tarifHoraire = contrat.tarifHoraire || 0;
                const seuil = contrat.heuresContractuellesMois || 0;
                const resume = mois && annee
                    ? await heureCoursService.getResumeMensuel(membrePersonnelId, mois, annee, etablissementId)
                    : { heuresEffectuees: 0, detailParMatiere: [] as any[] };
                heuresEffectuees = resume.heuresEffectuees || 0;
                detailParMatiere = resume.detailParMatiere || [];
                for (const d of detailParMatiere) {
                    elements.push(this.creerElement(
                        TypeElementSalaire.GAIN, CategorieElementSalaire.HEURE_COURS, d.matiereNom,
                        d.montant, d.heures, d.tarifHoraire, ordre++
                    ));
                }
                heuresSup = Math.max(0, heuresEffectuees - seuil);
                montantHeuresSup = +(heuresSup * tarifHoraire * 1.5).toFixed(2);
                salaireBase = fixe + montantHeuresSup;

                elements.push(this.creerElement(
                    TypeElementSalaire.GAIN, CategorieElementSalaire.SALAIRE_BASE,
                    'Salaire de base (fixe mensuel)',
                    fixe, fixe, undefined, ordre++
                ));
                if (heuresSup > 0) {
                    elements.push(this.creerElement(
                        TypeElementSalaire.GAIN, CategorieElementSalaire.HEURE_SUP,
                        `Heures sup (${heuresSup}h × ${tarifHoraire} × 1.5)`,
                        montantHeuresSup, heuresSup, tarifHoraire, ordre++
                    ));
                }
                break;
            }

            case 'HEBDOMADAIRE': {
                const tarifHebdo = contrat.tarifHebdomadaire || contrat.salaireBase || 0;
                salaireBase = +(tarifHebdo * 52 / 12).toFixed(2);
                elements.push(this.creerElement(
                    TypeElementSalaire.GAIN, CategorieElementSalaire.SALAIRE_BASE,
                    `Salaire hebdomadaire lissé (${tarifHebdo} × 52 / 12)`,
                    salaireBase, tarifHebdo, undefined, ordre++
                ));
                break;
            }
        }

        // Primes
        const primes = await this.primeRepo.find({
            where: { etablissementId, actif: true },
        });

        let totalPrimes = 0;
        for (const prime of primes) {
            let montantPrime = 0;
            if (prime.typeCalcul === 'FIXE') {
                montantPrime = prime.valeur;
            } else if (prime.typeCalcul === 'POURCENTAGE') {
                montantPrime = salaireBase * (prime.valeur / 100);
            }

            if (montantPrime > 0) {
                totalPrimes += montantPrime;
                elements.push(this.creerElement(
                    TypeElementSalaire.GAIN, CategorieElementSalaire.PRIME, prime.nom,
                    montantPrime, undefined, undefined, ordre++
                ));
            }
        }

        // Cotisations
        const cotisations = await this.cotisationRepo.find({
            where: { etablissementId, actif: true },
        });

        let totalCotisationsSalariales = 0;
        let totalCotisationsPatronales = 0;

        for (const cotisation of cotisations) {
            const baseCalcul = cotisation.plafond
                ? Math.min(salaireBase, cotisation.plafond)
                : salaireBase;

            if (cotisation.type === 'SALARIALE' || cotisation.type === 'MIXTE') {
                const montantSalarial = baseCalcul * (cotisation.tauxSalarial / 100);
                totalCotisationsSalariales += montantSalarial;
                elements.push(this.creerElement(
                    TypeElementSalaire.RETENUE, CategorieElementSalaire.COTISATION,
                    `${cotisation.nom} (Salarial)`,
                    montantSalarial, baseCalcul, cotisation.tauxSalarial, ordre++
                ));
            }

            if (cotisation.type === 'PATRONALE' || cotisation.type === 'MIXTE') {
                const montantPatronal = baseCalcul * (cotisation.tauxPatronal / 100);
                totalCotisationsPatronales += montantPatronal;
            }
        }

        const salaireNet = salaireBase + totalPrimes - totalCotisationsSalariales;
        const coutTotalEmployeur = salaireBase + totalPrimes + totalCotisationsPatronales;

        return {
            salaireBase,
            heuresEffectuees,
            heuresSup,
            montantHeuresSup,
            detailParMatiere,
            primes: totalPrimes,
            cotisationsPatronales: totalCotisationsPatronales,
            cotisationsSalariales: totalCotisationsSalariales,
            totalRetenues: totalCotisationsSalariales,
            salaireNet,
            coutTotalEmployeur,
            elements,
        };
    }

    private creerElement(
        type: TypeElementSalaire,
        categorie: CategorieElementSalaire,
        libelle: string,
        montant: number,
        baseCalcul?: number,
        taux?: number,
        ordre?: number
    ): ElementSalaire {
        const element = new ElementSalaire();
        element.type = type;
        element.categorie = categorie;
        element.libelle = libelle;
        element.montant = montant;
        element.baseCalcul = baseCalcul;
        element.taux = taux;
        element.ordreAffichage = ordre || 0;
        return element;
    }

    private async creerElementsBulletin(
        bulletinPaieId: string,
        elements: ElementSalaire[],
        etablissementId: string
    ): Promise<void> {
        await this.elementRepo.delete({ bulletinPaieId });

        for (const element of elements) {
            element.bulletinPaieId = bulletinPaieId;
            element.etablissementId = etablissementId;
            await this.elementRepo.save(element);
        }
    }
}

export const calculPaieService = new CalculPaieService();
