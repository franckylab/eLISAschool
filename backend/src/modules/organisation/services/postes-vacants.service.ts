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

/** Information sur un poste vacant */
export interface PosteVacantInfo {
    posteId: string;
    intitule: string;
    code: string;
    unite: string | undefined;
    joursVacance: number;
    dernierMAJ: Date;
}

/** Statistiques de vacance des postes */
export interface StatistiquesVacance {
    totalPostesVacants: number;
    moyenneJoursVacance: number;
    maxJoursVacance: number;
    critiques: number;
}

// Seuils par défaut (configurables via ParametreSysteme si besoin)
const SEUIL_VACANCE_CRITIQUE = 30;
const SEUIL_VACANCE_AVERTISSEMENT = 15;

export class PostesVacantsService {
    private posteRepo: Repository<Poste>;

    constructor() {
        this.posteRepo = AppDataSource.getRepository(Poste);
    }

    /**
     * Obtenir le seuil critique depuis la configuration
     */
    private getSeuilCritique(): number {
        return SEUIL_VACANCE_CRITIQUE;
    }

    /**
     * Obtenir le seuil d'avertissement
     */
    private getSeuilAvertissement(): number {
        return SEUIL_VACANCE_AVERTISSEMENT;
    }

    /**
     * Vérifier les postes vacants depuis plus de N jours
     */
    async verifierPostesVacants(etablissementId?: string): Promise<{
        total: number;
        critiques: PosteVacantInfo[];
        avertissements: PosteVacantInfo[];
    }> {
        const maintenant = new Date();
        const seuilCritique = this.getSeuilCritique();
        const seuilAvertissement = this.getSeuilAvertissement();

        // Requête pour trouver les postes avec capacité disponible
        const qb = this.posteRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.uniteOrganisationnelle', 'uo')
            .where('p.actif = :actif', { actif: true })
            .andWhere('p."occupantsCount" < p."nombrePostes"')
            .andWhere('p.statut != :supprime', { supprime: StatutPoste.SUPPRIME })
            .orderBy('p.updatedAt', 'ASC');

        if (etablissementId) {
            qb.andWhere('uo.etablissementId = :eid', { eid: etablissementId });
        }

        const postesVacants = await qb.getMany();

        const critiques: PosteVacantInfo[] = [];
        const avertissements: PosteVacantInfo[] = [];

        postesVacants.forEach((poste) => {
            const joursVacance = Math.floor(
                (maintenant.getTime() - poste.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
            );

            const info = {
                posteId: poste.id,
                intitule: poste.intitule,
                code: poste.code,
                unite: poste.uniteOrganisationnelle?.nom,
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
    async getStatistiquesVacance(etablissementId?: string): Promise<StatistiquesVacance> {
        const maintenant = new Date();
        const seuilCritique = this.getSeuilCritique();

        const qb = this.posteRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.uniteOrganisationnelle', 'uo')
            .where('p.actif = :actif', { actif: true })
            .andWhere('p."occupantsCount" < p."nombrePostes"')
            .andWhere('p.statut != :supprime', { supprime: StatutPoste.SUPPRIME });
        if (etablissementId) {
            qb.andWhere('uo.etablissementId = :eid', { eid: etablissementId });
        }

        const postesVacants = await qb.getMany();

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
