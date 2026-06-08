/**
 * ==================================
 * eLISAschool - Service Calcul Paie
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { BulletinPaie } from '../entities/bulletin-paie.entity';
import { ElementSalaire, TypeElementSalaire, CategorieElementSalaire } from '../entities/element-salaire.entity';
import { Cotisation } from '../entities/cotisation.entity';
import { TypePrime } from '../entities/type-prime.entity';
import { MembrePersonnel, ContratPersonnel } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export interface SimulationResult {
    salaireBase: number;
    heuresSup: number;
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
        this bulletinRepo = AppDataSource.getRepository(BulletinPaie);
        this.elementRepo = AppDataSource.getRepository(ElementSalaire);
        this.cotisationRepo = AppDataSource.getRepository(Cotisation);
        this.primeRepo = AppDataSource.getRepository(TypePrime);
        this.personnelRepo = AppDataSource.getRepository(MembrePersonnel);
        this.contratRepo = AppDataSource.getRepository(ContratPersonnel);
    }

    /**
     * Calcule le bulletin de paie pour un membre du personnel
     */
    async calculerBulletin(
        membrePersonnelId: string,
        mois: number,
        annee: number,
        etablissementId: string
    ): Promise<BulletinPaie> {
        // Vérifier si le bulletin existe déjà
        const existingBulletin = await this.bulletinRepo.findOne({
            where: { membrePersonnelId, mois, annee },
        });

        if (existingBulletin && existingBulletin.statut === 'PAYE') {
            throw new AppError('Bulletin déjà payé, non modifiable', 400, 'BULLETIN_DEJA_PAYE');
        }

        // Récupérer le membre et son contrat
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
        });

        if (!contrat) {
            throw new AppError('Aucun contrat trouvé pour ce membre', 404, 'NO_CONTRACT');
        }

        // Simulation du calcul
        const simulation = await this.simulerPaie(membrePersonnelId, etablissementId);

        // Créer ou mettre à jour le bulletin
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
        bulletin.heuresEffectuees = simulation.heuresSup;
        bulletin.montantHeuresSup = simulation.heuresSup;
        bulletin.primes = simulation.primes;
        bulletin.deductions = simulation.totalRetenues;
        bulletin.salaireNet = simulation.salaireNet;
        bulletin.statut = 'GENERE';

        await this.bulletinRepo.save(bulletin);

        // Créer les éléments détaillés
        await this.creerElementsBulletin(bulletin.id, simulation.elements, etablissementId);

        logger.info(`[Paie] Bulletin calculé: ${membre.matricule} - ${mois}/${annee}`);
        return bulletin;
    }

    /**
     * Simule le calcul de paie sans persister
     */
    async simulerPaie(membrePersonnelId: string, etablissementId: string): Promise<SimulationResult> {
        const elements: ElementSalaire[] = [];
        let ordre = 0;

        // Récupérer le contrat
        const contrat = await this.contratRepo.findOne({
            where: { membrePersonnelId },
            order: { dateDebut: 'DESC' },
        });

        if (!contrat) {
            throw new AppError('Aucun contrat trouvé', 404, 'NO_CONTRACT');
        }

        const salaireBase = contrat.salaireBase || 0;

        // 1. Salaire de base
        elements.push(this.creerElement('GAIN', 'SALAIRE_BASE', 'Salaire de base', salaireBase, salaireBase, undefined, ordre++));

        // 2. Heures supplémentaires (si applicable)
        // À implémenter selon les heures cours du mois

        // 3. Primes
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
                elements.push(this.creerElement('GAIN', 'PRIME', prime.nom, montantPrime, undefined, undefined, ordre++));
            }
        }

        // 4. Cotisations
        const cotisations = await this.cotisationRepo.find({
            where: { etablissementId, actif: true },
        });

        let totalCotisationsSalariales = 0;
        let totalCotisationsPatronales = 0;

        for (const cotisation of cotisations) {
            const baseCalcul = cotisation.plafond ? Math.min(salaireBase, cotisation.plafond) : salaireBase;

            // Cotisation salariale
            if (cotisation.type === 'SALARIALE' || cotisation.type === 'MIXTE') {
                const montantSalarial = baseCalcul * (cotisation.tauxSalarial / 100);
                totalCotisationsSalariales += montantSalarial;
                elements.push(this.creerElement('RETENUE', 'COTISATION', `${cotisation.nom} (Salarial)`, montantSalarial, baseCalcul, cotisation.tauxSalarial, ordre++));
            }

            // Cotisation patronale
            if (cotisation.type === 'PATRONALE' || cotisation.type === 'MIXTE') {
                const montantPatronal = baseCalcul * (cotisation.tauxPatronal / 100);
                totalCotisationsPatronales += montantPatronal;
                // Pas ajouté aux retenues salariales
            }
        }

        const salaireNet = salaireBase + totalPrimes - totalCotisationsSalariales;
        const coutTotalEmployeur = salaireBase + totalPrimes + totalCotisationsPatronales;

        return {
            salaireBase,
            heuresSup: 0,
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
        // Supprimer les anciens éléments
        await this.elementRepo.delete({ bulletinPaieId });

        // Créer les nouveaux
        for (const element of elements) {
            element.bulletinPaieId = bulletinPaieId;
            element.etablissementId = etablissementId;
            await this.elementRepo.save(element);
        }
    }
}

export const calculPaieService = new CalculPaieService();
