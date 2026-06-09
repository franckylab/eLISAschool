/**
 * ==================================
 * eLISAschool - Service Génération Batch Cartes
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Génération en masse de cartes par classe ou groupe
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Carte, TypeCarte, StatutCarte } from '../entities/carte.entity';
import { ModeleCarte } from '../entities/modele-carte.entity';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamBoolean, getParamNumber } from '@modules/configuration/utils/config.helper';

export interface BatchResult {
    succes: number;
    echecs: number;
    cartes: Carte[];
    erreurs: string[];
}

export class GenerationBatchService {
    private carteRepo: Repository<Carte>;
    private modeleRepo: Repository<ModeleCarte>;

    constructor() {
        this.carteRepo = AppDataSource.getRepository(Carte);
        this.modeleRepo = AppDataSource.getRepository(ModeleCarte);
    }

    /**
     * Génère des cartes pour tous les élèves d'une classe
     */
    async genererCartesClasse(
        classeId: string,
        type: TypeCarte,
        etablissementId: string,
        modeleId?: string,
        createurId?: string
    ): Promise<BatchResult> {
        const result: BatchResult = {
            succes: 0,
            echecs: 0,
            cartes: [],
            erreurs: [],
        };

        try {
            // Récupérer les élèves de la classe
            const { Eleve } = await import('@modules/eleves/entities');
            const eleveRepo = AppDataSource.getRepository(Eleve);

            const eleves = await eleveRepo.find({
                where: {
                    etablissementId,
                    // Note: il faudrait une relation classeId dans Eleve
                    // Pour l'instant, on récupère tous les élèves actifs
                    statut: 'ACTIF',
                },
                relations: ['utilisateur'],
            });

            if (eleves.length === 0) {
                throw new AppError('Aucun élève trouvé pour cette classe', 404, 'NO_STUDENTS_FOUND');
            }

            // Récupérer le modèle (ou le modèle par défaut)
            let modele: ModeleCarte | null = null;
            if (modeleId) {
                modele = await this.modeleRepo.findOne({
                    where: { id: modeleId, etablissementId },
                });
            }

            if (!modele) {
                modele = await this.modeleRepo.findOne({
                    where: { etablissementId, type, parDefaut: true, actif: true },
                });
            }

            // Générer les cartes
            const params = await this.getCartesParams();

            for (const eleve of eleves) {
                try {
                    // Vérifier si une carte existe déjà
                    const existingCarte = await this.carteRepo.findOne({
                        where: {
                            utilisateurId: eleve.utilisateurId,
                            type,
                            etablissementId,
                            statut: StatutCarte.ACTIVE,
                        },
                    });

                    if (existingCarte) {
                        result.erreurs.push(`Carte déjà existante pour élève ${eleve.utilisateurId}`);
                        result.echecs++;
                        continue;
                    }

                    // Créer la carte
                    const dateExpiration = new Date();
                    dateExpiration.setMonth(dateExpiration.getMonth() + params.validityMonths);

                    const numeroCarte = this.generateNumeroCarte(type);

                    const carte = this.carteRepo.create({
                        utilisateurId: eleve.utilisateurId,
                        type,
                        numeroCarte,
                        dateExpiration,
                        statut: StatutCarte.ACTIVE,
                        qrCode: params.enableQRCode ? this.generateQRCode(numeroCarte, eleve.utilisateurId) : undefined,
                        etablissementId,
                        modeleCarteId: modele?.id,
                        categorieTitulaire: 'ELEVE',
                        photoUrl: eleve.photo || undefined,
                    });

                    await this.carteRepo.save(carte);
                    result.cartes.push(carte);
                    result.succes++;

                    // Synchroniser qrCodeId avec Utilisateur
                    if (params.enableQRCode && carte.qrCodeId) {
                        const { Utilisateur } = await import('@modules/auth/entities');
                        const userRepo = AppDataSource.getRepository(Utilisateur);
                        await userRepo.update(
                            { id: eleve.utilisateurId },
                            { qrCodeId: numeroCarte }
                        );
                    }
                } catch (error) {
                    result.erreurs.push(`Erreur pour élève ${eleve.utilisateurId}: ${error.message}`);
                    result.echecs++;
                }
            }

            logger.info(`[Cartes] Batch génération: ${result.succes} succès, ${result.echecs} échecs`);
            return result;
        } catch (error) {
            logger.error('[Cartes] Erreur batch génération', error);
            throw error;
        }
    }

    /**
     * Génère des cartes pour le personnel
     */
    async genererCartesPersonnel(
        type: TypeCarte,
        etablissementId: string,
        modeleId?: string
    ): Promise<BatchResult> {
        const result: BatchResult = {
            succes: 0,
            echecs: 0,
            cartes: [],
            erreurs: [],
        };

        try {
            const { MembrePersonnel } = await import('@modules/personnel/entities');
            const personnelRepo = AppDataSource.getRepository(MembrePersonnel);

            const membres = await personnelRepo.find({
                where: { etablissementId, statut: 'ACTIF' },
                relations: ['utilisateur'],
            });

            // Même logique que pour les élèves...
            // (simplifié pour l'exemple)

            return result;
        } catch (error) {
            logger.error('[Cartes] Erreur batch personnel', error);
            throw error;
        }
    }

    private async getCartesParams() {
        return {
            enableQRCode: await getParamBoolean('cartes.enable_qrcode', true),
            validityMonths: await getParamNumber('cartes.validity_months', 12),
        };
    }

    private generateNumeroCarte(type: TypeCarte): string {
        const prefix = type.substring(0, 3).toUpperCase();
        const year = new Date().getFullYear().toString().substring(2);
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}${year}${random}`;
    }

    private generateQRCode(numeroCarte: string, utilisateurId: string): string {
        // QR code dynamique avec JSON encodé
        const data = {
            id: utilisateurId,
            numeroCarte,
            timestamp: Date.now(),
        };
        return `QR:${Buffer.from(JSON.stringify(data)).toString('base64')}`;
    }
}

export const generationBatchService = new GenerationBatchService();
