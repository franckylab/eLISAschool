/**
 * ==================================
 * eLISAschool - Service Cartes v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Utilise le système de configuration centralisée
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { CarteScolaire, StatutCarte, TypeCarte } from '../entities';
import { CreateCarteDto, UpdateCarteDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamBoolean, getParamNumber, getParam } from '@modules/configuration/utils/config.helper';
import { validationWorkflowService } from '@modules/validation-workflow/services';

/**
 * Service Cartes avec configuration centralisée
 */
export class CartesService {
    private carteRepo: Repository<CarteScolaire>;

    constructor() {
        this.carteRepo = AppDataSource.getRepository(CarteScolaire);
    }

    /**
     * Récupère les paramètres cartes depuis la configuration
     */
    private async getCartesParams() {
        return {
            enableQRCode: await getParamBoolean('cartes.enable_qrcode', true),
            validityMonths: await getParamNumber('cartes.validity_months', 12),
            includePhoto: await getParamBoolean('cartes.include_photo', true),
        };
    }

    /**
     * Crée une nouvelle carte avec paramètres de configuration
     */
    async create(dto: CreateCarteDto, etablissementId?: string, createurId?: string): Promise<CarteScolaire> {
        const params = await this.getCartesParams();
        
        // Récupérer le nom de l'établissement
        let etablissementNom = '';
        if (etablissementId) {
            const { Etablissement } = await import('@modules/etablissement/entities');
            const etab = await AppDataSource.getRepository(Etablissement).findOne({ where: { id: etablissementId } });
            if (etab) etablissementNom = etab.nom;
        }

        // Calculer la date d'expiration
        const dateExpiration = new Date();
        dateExpiration.setMonth(dateExpiration.getMonth() + params.validityMonths);

        // Générer le numéro de carte
        const numeroCarte = this.generateNumeroCarte(dto.type as TypeCarte);

        // Vérifier si le workflow de validation est requis
        const requireValidation = await getParamBoolean('cartes.require_validation', false);

        const carte: CarteScolaire = this.carteRepo.create({
            ...dto,
            etablissementId,
            type: dto.type as TypeCarte,
            numeroCarte,
            dateExpiration,
            statut: requireValidation ? StatutCarte.EN_ATTENTE_VALIDATION : StatutCarte.ACTIVE,
            qrCode: params.enableQRCode ? this.generateQRCode(numeroCarte) : undefined,
            etablissementNom,
        });

        await this.carteRepo.save(carte);

        // Créer le workflow de validation si requis
        if (requireValidation && createurId) {
            await validationWorkflowService.createWorkflow({
                module: 'cartes',
                entiteId: carte.id,
                entiteType: 'CarteScolaire',
                niveauxRequis: 2,
                etablissementId,
                commentaire: `Demande de carte: ${numeroCarte}`,
            }, createurId);
        }

        logger.info(`[${etablissementId}] Carte créée: ${numeroCarte} pour ${dto.utilisateurId}`);
        return carte;
    }

    async findAll(type?: TypeCarte, statut?: StatutCarte, etablissementId?: string, page: number = 1, limit: number = 20): Promise<{ data: CarteScolaire[]; total: number; page: number; limit: number }> {
        const where: any = {};
        if (type) where.type = type;
        if (statut) where.statut = statut;
        if (etablissementId) where.etablissementId = etablissementId;
        const [data, total] = await this.carteRepo.findAndCount({ where, relations: ['utilisateur'], order: { createdAt: 'DESC' }, skip: (page - 1) * limit, take: limit });
        return { data, total, page, limit };
    }

    async findOne(id: string, etablissementId?: string): Promise<CarteScolaire> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        const carte = await this.carteRepo.findOne({ where, relations: ['utilisateur'] });
        if (!carte) throw new AppError('Carte non trouvée', 404, 'NOT_FOUND');
        return carte;
    }

    async findByUtilisateur(utilisateurId: string): Promise<CarteScolaire[]> {
        return this.carteRepo.find({ where: { utilisateurId }, order: { createdAt: 'DESC' } });
    }

    async update(id: string, dto: UpdateCarteDto): Promise<CarteScolaire> {
        const carte = await this.findOne(id);
        Object.assign(carte, dto);
        await this.carteRepo.save(carte);
        return carte;
    }

    /**
     * Désactive une carte
     */
    async desactiver(id: string, raison?: string): Promise<CarteScolaire> {
        const carte = await this.findOne(id);
        carte.statut = StatutCarte.DESACTIVEE;
        carte.raisonDesactivation = raison;
        await this.carteRepo.save(carte);
        logger.info(`Carte désactivée: ${carte.numeroCarte}`);
        return carte;
    }

    /**
     * Renouvelle une carte avec les paramètres configurés
     */
    async renouveler(id: string, createurId?: string, etablissementId?: string): Promise<CarteScolaire> {
        const params = await this.getCartesParams();
        const oldCarte = await this.findOne(id);

        // Vérifier si le workflow de validation est requis pour le renouvellement
        const requireValidation = await getParamBoolean('cartes.renouvellement_require_validation', false);

        if (requireValidation && createurId) {
            // Ne PAS désactiver l'ancienne carte, créer un workflow
            const workflow = await validationWorkflowService.createWorkflow({
                module: 'cartes',
                entiteId: oldCarte.id,
                entiteType: 'CarteScolaire',
                niveauxRequis: 2,
                etablissementId: etablissementId || oldCarte.etablissementId,
                commentaire: `Renouvellement carte: ${oldCarte.numeroCarte}`,
            }, createurId);

            // Retourner l'ancienne carte avec un flag de workflow en cours
            logger.info(`Renouvellement en attente de validation pour carte: ${oldCarte.numeroCarte}`);
            return oldCarte;
        }

        // Désactiver l'ancienne
        oldCarte.statut = StatutCarte.EXPIREE;
        await this.carteRepo.save(oldCarte);

        // Créer la nouvelle
        const dateExpiration = new Date();
        dateExpiration.setMonth(dateExpiration.getMonth() + params.validityMonths);

        const numeroCarte = this.generateNumeroCarte(oldCarte.type);

        const nouvelleCarte = this.carteRepo.create({
            utilisateurId: oldCarte.utilisateurId,
            type: oldCarte.type,
            numeroCarte,
            dateExpiration,
            statut: StatutCarte.ACTIVE,
            qrCode: params.enableQRCode ? this.generateQRCode(numeroCarte) : undefined,
            etablissementNom: oldCarte.etablissementNom,
        });

        await this.carteRepo.save(nouvelleCarte);
        logger.info(`Carte renouvelée: ${oldCarte.numeroCarte} -> ${numeroCarte}`);
        return nouvelleCarte;
    }

    /**
     * Vérifie si une carte est valide (scanning)
     */
    async verifier(numeroCarte: string): Promise<{ valide: boolean; carte?: CarteScolaire; raison?: string }> {
        const carte = await this.carteRepo.findOne({
            where: { numeroCarte },
            relations: ['utilisateur'],
        });

        if (!carte) {
            return { valide: false, raison: 'Carte inconnue' };
        }

        if (carte.statut !== StatutCarte.ACTIVE) {
            return { valide: false, carte, raison: `Carte ${carte.statut.toLowerCase()}` };
        }

        if (carte.dateExpiration && new Date() > carte.dateExpiration) {
            return { valide: false, carte, raison: 'Carte expirée' };
        }

        return { valide: true, carte };
    }

    /**
     * Génère un numéro de carte unique
     */
    private generateNumeroCarte(type: TypeCarte): string {
        const prefix = type.substring(0, 3).toUpperCase();
        const year = new Date().getFullYear().toString().substring(2);
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}${year}${random}`;
    }

    /**
     * Génère un QR code (placeholder - en production utiliser qrcode library)
     */
    private generateQRCode(numeroCarte: string): string {
        // En production, générer un vrai QR code avec la librairie qrcode
        return `QR:${numeroCarte}`;
    }

    /**
     * Cartes expirant bientôt (dans X jours)
     */
    async getCartesExpirantBientot(jours: number = 30): Promise<CarteScolaire[]> {
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() + jours);

        return this.carteRepo.createQueryBuilder('c')
            .where('c.statut = :statut', { statut: StatutCarte.ACTIVE })
            .andWhere('c.dateExpiration <= :dateLimite', { dateLimite })
            .andWhere('c.dateExpiration > :now', { now: new Date() })
            .leftJoinAndSelect('c.utilisateur', 'u')
            .getMany();
    }

    /**
     * Signale la perte d'une carte
     */
    async signalerPerte(id: string): Promise<CarteScolaire> {
        const carte = await this.findOne(id);
        carte.statut = StatutCarte.PERDUE;
        carte.raisonDesactivation = 'Perte signalée';
        await this.carteRepo.save(carte);
        logger.info(`Perte signalée: ${carte.numeroCarte}`);
        return carte;
    }

    /**
     * Recherche par numéro de carte
     */
    async findByNumero(numeroCarte: string): Promise<CarteScolaire> {
        const carte = await this.carteRepo.findOne({ where: { numeroCarte }, relations: ['utilisateur'] });
        if (!carte) throw new AppError('Carte non trouvée', 404, 'NOT_FOUND');
        return carte;
    }

    /**
     * Alias pour findByUtilisateur
     */
    async findByUser(utilisateurId: string): Promise<CarteScolaire[]> {
        return this.findByUtilisateur(utilisateurId);
    }
}

export const cartesService = new CartesService();
