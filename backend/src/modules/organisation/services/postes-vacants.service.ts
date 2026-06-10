/**
 * ==================================
 * eLISAschool - Service Vérification Postes Vacants
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Vérification et notification des postes vacants depuis trop longtemps
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Poste, StatutPoste } from '../entities';
import { logger } from '@common/utils/logger.util';
import { configurationOrganisationService } from './configuration.service';

export class PostesVacantsService {
    private posteRepo: Repository<Poste>;

    constructor() {
        this.posteRepo = AppDataSource.getRepository(Poste);
    }

    /**
     * Obtenir le seuil critique depuis la configuration
     */
    private async getSeuilCritique(): Promise<number> {
        return await configurationOrganisationService.getValeur<number>('organisation.seuil_vacance_critique') || 30;
    }

    /**
     * Obtenir le seuil d'avertissement depuis la configuration
     */
    private async getSeuilAvertissement(): Promise<number> {
        return await configurationOrganisationService.getValeur<number>('organisation.seuil_vacance_avertissement') || 15;
    }

    /**
     * Vérifier les postes vacants depuis plus de N jours
     */
    async verifierPostesVacants(etablissementId?: string): Promise<{
        total: number;
        critiques: any[];
        avertissements: any[];
    }> {
        const maintenant = new Date();
        const seuilCritique = await this.getSeuilCritique();
        const seuilAvertissement = await this.getSeuilAvertissement();

        // Requête pour trouver les postes vacants
        const where: any = {
            statut: StatutPoste.VACANT,
        };

        if (etablissementId) {
            where.uniteOrganisationnelle = {
                organisation: { etablissementId },
            };
        }

        const postesVacants = await this.posteRepo.find({
            where,
            relations: ['uniteOrganisationnelle', 'uniteOrganisationnelle.organisation'],
            order: { updatedAt: 'ASC' },
        });

        const critiques: any[] = [];
        const avertissements: any[] = [];

        postesVacants.forEach((poste) => {
            const joursVacance = Math.floor(
                (maintenant.getTime() - poste.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
            );

            const info = {
                posteId: poste.id,
                intitule: poste.intitulé,
                code: poste.code,
                unite: poste.uniteOrganisationnelle?.nom,
                organisation: poste.uniteOrganisationnelle?.organisation?.nom,
                joursVacance,
                dernierMAJ: poste.updatedAt,
            };

            if (joursVacance > seuilCritique) {
                critiques.push(info);
            } else if (joursVacance > seuilAvertissement) {
                avertissements.push(info);
            }
        });

        return {
            total: postesVacants.length,
            critiques,
            avertissements,
        };
    }

    /**
     * Obtenir les statistiques de vacance
     */
    async getStatistiquesVacance(etablissementId?: string): Promise<any> {
        const maintenant = new Date();
        const seuilCritique = await this.getSeuilCritique();

        const where: any = { statut: StatutPoste.VACANT };
        if (etablissementId) {
            where.uniteOrganisationnelle = {
                organisation: { etablissementId },
            };
        }

        const postesVacants = await this.posteRepo.find({
            where,
            relations: ['uniteOrganisationnelle'],
        });

        const joursVacance = postesVacants.map((p) =>
            Math.floor((maintenant.getTime() - p.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
        );

        const moyenne = joursVacance.length > 0
            ? joursVacance.reduce((a, b) => a + b, 0) / joursVacance.length
            : 0;

        const max = joursVacance.length > 0 ? Math.max(...joursVacance) : 0;

        return {
            totalPostesVacants: postesVacants.length,
            moyenneJoursVacance: Math.round(moyenne),
            maxJoursVacance: max,
            critiques: joursVacance.filter((j) => j > seuilCritique).length,
        };
    }
}

export const postesVacantsService = new PostesVacantsService();
