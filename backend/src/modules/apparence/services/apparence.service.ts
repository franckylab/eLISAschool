/**
 * ==================================
 * eLISAschool - Service Apparence (Fonds d'écran)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion des fonds d'écran SVG par établissement
 */

import { Repository, In } from 'typeorm';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '@database/data-source';
import { Fond, FondEtablissement, CategorieFond } from '../entities';
import {
    AjouterFondDto,
    ModifierFondEtablissementDto,
    ConfigRotationDto,
    UploadFondDto,
    FilterCatalogueDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { ParametreSysteme } from '@modules/configuration/entities/parametre-systeme.entity';

/**
 * Service Apparence
 */
export class ApparenceService {
    private fondRepo: Repository<Fond>;
    private fondEtabRepo: Repository<FondEtablissement>;
    private parametreRepo: Repository<ParametreSysteme>;
    private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'fonds');

    constructor() {
        this.fondRepo = AppDataSource.getRepository(Fond);
        this.fondEtabRepo = AppDataSource.getRepository(FondEtablissement);
        this.parametreRepo = AppDataSource.getRepository(ParametreSysteme);
        
        // Créer le dossier d'upload s'il n'existe pas
        if (!fs.existsSync(this.UPLOAD_DIR)) {
            fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
        }
    }

    // ============================================
    // CATALOGUE GLOBAL
    // ============================================

    /**
     * Lister tous les fonds du catalogue (avec pagination)
     */
    async getCatalogue(query: FilterCatalogueDto): Promise<{ fonds: Fond[]; total: number }> {
        const { categorie, estActif, source, page, limit } = query;
        const where: any = {};
        
        if (categorie) where.categorie = categorie;
        if (estActif !== undefined) where.estActif = estActif;
        if (source) where.source = source;

        const [fonds, total] = await this.fondRepo.findAndCount({
            where,
            order: { categorie: 'ASC', nom: 'ASC' },
            take: limit,
            skip: (page - 1) * limit,
        });

        return { fonds, total };
    }

    /**
     * Obtenir un fond par son ID
     */
    async getFondById(id: string): Promise<Fond> {
        const fond = await this.fondRepo.findOne({ where: { id } });
        if (!fond) {
            throw new AppError('Fond introuvable', 404, 'NOT_FOUND');
        }
        return fond;
    }

    // ============================================
    // GESTION PAR ÉTABLISSEMENT
    // ============================================

    /**
     * Obtenir les fonds sélectionnés par un établissement
     * Si aucun fond sélectionné, retourne tous les fonds système actifs
     */
    async getFondsEtablissement(etablissementId: string): Promise<FondEtablissement[]> {
        // Chercher les fonds sélectionnés par l'établissement
        const fondsSelectionnes = await this.fondEtabRepo.find({
            where: { etablissementId },
            relations: ['fond'],
            order: { ordre: 'ASC', dateAjout: 'DESC' },
        });

        // Si des fonds sont sélectionnés, les retourner
        if (fondsSelectionnes.length > 0) {
            return fondsSelectionnes;
        }

        // Sinon, retourner tous les fonds système actifs (fallback automatique)
        logger.info(`[Apparence] Aucun fond sélectionné pour l'établissement ${etablissementId}, utilisant les fonds système`);
        const fondsSysteme = await this.fondRepo.find({
            where: { estActif: true, estSysteme: true },
            order: { categorie: 'ASC', nom: 'ASC' },
        });

        // Retourner sous forme de FondEtablissement virtuel (sans persister)
        return fondsSysteme.map((fond) => {
            const fondEtab = new FondEtablissement();
            fondEtab.id = `systeme-${fond.id}`;
            fondEtab.etablissementId = etablissementId;
            fondEtab.fondId = fond.id;
            fondEtab.fond = fond;
            fondEtab.actif = true;
            fondEtab.ordre = 0;
            fondEtab.dateAjout = new Date();
            return fondEtab;
        });
    }

    /**
     * Ajouter un fond à la sélection d'un établissement
     */
    async ajouterFondEtablissement(
        etablissementId: string,
        dto: AjouterFondDto
    ): Promise<FondEtablissement> {
        // Vérifier que le fond existe
        const fond = await this.getFondById(dto.fondId);
        if (!fond.estActif) {
            throw new AppError('Ce fond n\'est plus disponible', 400, 'FOND_INACTIF');
        }

        // Vérifier si déjà sélectionné
        const existant = await this.fondEtabRepo.findOne({
            where: { etablissementId, fondId: dto.fondId },
        });

        if (existant) {
            throw new AppError('Ce fond est déjà sélectionné', 409, 'FOND_DEJA_SELECTIONNE');
        }

        // Créer la relation
        const fondEtab = this.fondEtabRepo.create({
            etablissementId,
            fondId: dto.fondId,
            ordre: dto.ordre,
            actif: true,
        });

        // Si on définit un ordre, réorganiser les autres fonds
        if (dto.ordre !== undefined) {
            // Récupérer tous les fonds actifs de l'établissement
            const autresFonds = await this.fondEtabRepo.find({
                where: { etablissementId, actif: true },
                order: { ordre: 'ASC' },
            });

            // Incrémenter l'ordre de tous les fonds qui ont un ordre >= au nouveau
            for (const autre of autresFonds) {
                if (autre.ordre >= dto.ordre) {
                    autre.ordre += 1;
                    await this.fondEtabRepo.save(autre);
                }
            }
        }

        await this.fondEtabRepo.save(fondEtab);
        logger.info(`[Apparence] Fond ${fond.nom} ajouté à l'établissement ${etablissementId}`);

        return this.fondEtabRepo.findOne({
            where: { id: fondEtab.id },
            relations: ['fond'],
        }) as Promise<FondEtablissement>;
    }

    /**
     * Modifier un fond d'un établissement (actif/ordre)
     * Ignore silencieusement les fonds système virtuels (non persistés)
     */
    async modifierFondEtablissement(
        etablissementId: string,
        fondEtabId: string,
        dto: ModifierFondEtablissementDto
    ): Promise<FondEtablissement> {
        // Ignorer silencieusement les fonds système virtuels (ID commence par "systeme-")
        if (fondEtabId.startsWith('systeme-')) {
            logger.info(`[Apparence] Modification d'un fond système virtuel ignorée: ${fondEtabId}`);
            // Retourner un objet factice pour éviter l'erreur
            throw new AppError('Les fonds système ne peuvent pas être modifiés', 400, 'SYSTEME_FOND_IMMUTABLE');
        }

        const fondEtab = await this.fondEtabRepo.findOne({
            where: { id: fondEtabId, etablissementId },
            relations: ['fond'],
        });

        if (!fondEtab) {
            throw new AppError('Fond non trouvé pour cet établissement', 404, 'NOT_FOUND');
        }

        // Si on change l'ordre, réorganiser les autres fonds
        if (dto.ordre !== undefined) {
            // Récupérer tous les fonds actifs de l'établissement (sauf celui-ci)
            const autresFonds = await this.fondEtabRepo.find({
                where: { etablissementId, actif: true },
                order: { ordre: 'ASC' },
            });

            // Incrémenter l'ordre de tous les fonds qui ont un ordre >= au nouveau
            for (const autre of autresFonds) {
                if (autre.id !== fondEtabId && autre.ordre >= dto.ordre) {
                    autre.ordre += 1;
                    await this.fondEtabRepo.save(autre);
                }
            }
        }

        Object.assign(fondEtab, dto);
        await this.fondEtabRepo.save(fondEtab);

        logger.info(`[Apparence] Fond ${fondEtab.fond.nom} modifié pour l'établissement ${etablissementId}`);
        return fondEtab;
    }

    /**
     * Retirer un fond de la sélection d'un établissement
     * Ignore silencieusement les fonds système virtuels (non persistés)
     */
    async retirerFondEtablissement(
        etablissementId: string,
        fondEtabId: string
    ): Promise<void> {
        // Ignorer silencieusement les fonds système virtuels (ID commence par "systeme-")
        if (fondEtabId.startsWith('systeme-')) {
            logger.info(`[Apparence] Tentative de retrait d'un fond système virtuel ignorée: ${fondEtabId}`);
            return; // Pas d'erreur, on ignore simplement
        }

        const fondEtab = await this.fondEtabRepo.findOne({
            where: { id: fondEtabId, etablissementId },
            relations: ['fond'],
        });

        if (!fondEtab) {
            throw new AppError('Fond non trouvé pour cet établissement', 404, 'NOT_FOUND');
        }

        // Ne pas supprimer les fonds système
        if (fondEtab.fond.estSysteme) {
            throw new AppError('Impossible de retirer un fond système', 403, 'FOND_SYSTEME');
        }

        await this.fondEtabRepo.remove(fondEtab);
        logger.info(`[Apparence] Fond ${fondEtab.fond.nom} retiré de l'établissement ${etablissementId}`);
    }

    // ============================================
    // CONFIGURATION ROTATION
    // ============================================

    /**
     * Obtenir la configuration de rotation d'un établissement
     */
    async getConfigRotation(etablissementId: string): Promise<{ actif: boolean; delaiRotation: number }> {
        const [actifParam, delaiParam] = await Promise.all([
            this.parametreRepo.findOne({ where: { cle: 'fonds.actif', etablissementId } }),
            this.parametreRepo.findOne({ where: { cle: 'fonds.delai_rotation', etablissementId } }),
        ]);

        return {
            actif: actifParam ? JSON.parse(actifParam.valeur) : true,
            delaiRotation: delaiParam ? JSON.parse(delaiParam.valeur) : 86400,
        };
    }

    /**
     * Mettre à jour la configuration de rotation
     */
    async updateConfigRotation(
        etablissementId: string,
        dto: ConfigRotationDto,
        utilisateurId?: string
    ): Promise<void> {
        const { actif, delaiRotation } = dto;

        // Validation de la plage
        if (delaiRotation < 10 || delaiRotation > 700000) {
            throw new AppError(
                'Le délai de rotation doit être entre 10 et 700000 secondes',
                400,
                'DELAI_INVALIDE'
            );
        }

        // Sauvegarder les paramètres
        await Promise.all([
            this.upsertParametre('fonds.actif', JSON.stringify(actif), etablissementId),
            this.upsertParametre('fonds.delai_rotation', JSON.stringify(delaiRotation), etablissementId),
        ]);

        logger.info(
            `[Apparence] Configuration rotation mise à jour pour l'établissement ${etablissementId} (actif: ${actif}, délai: ${delaiRotation}s)`
        );
    }

    // ============================================
    // UPLOAD DE FOND PERSONNALISÉ
    // ============================================

    /**
     * Uploader un fond personnalisé
     */
    async uploadFond(
        dto: UploadFondDto,
        etablissementId: string,
        utilisateurId?: string
    ): Promise<Fond> {
        // Générer un nom de fichier unique
        const timestamp = Date.now();
        const fileName = `upload-${etablissementId}-${timestamp}.svg`;
        const filePath = path.join(this.UPLOAD_DIR, fileName);

        // Écrire le fichier (base64)
        const base64Data = dto.fichier.replace(/^data:image\/svg\+xml;base64,/, '');
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        // Créer l'entrée dans le catalogue
        const fond = this.fondRepo.create({
            nom: dto.nom,
            description: dto.description,
            categorie: dto.categorie,
            cheminFichier: `uploads/fonds/${fileName}`,
            url: `/uploads/fonds/${fileName}`,
            source: 'upload',
            estActif: true,
            estSysteme: false,
            tailleFichier: Buffer.byteLength(base64Data),
        });

        await this.fondRepo.save(fond);
        logger.info(`[Apparence] Fond personnalisé uploadé: ${dto.nom} par ${utilisateurId}`);

        return fond;
    }

    /**
     * Supprimer un fond personnalisé
     */
    async supprimerFond(fondId: string, utilisateurId?: string): Promise<void> {
        const fond = await this.getFondById(fondId);

        if (fond.estSysteme) {
            throw new AppError('Impossible de supprimer un fond système', 403, 'FOND_SYSTEME');
        }

        if (fond.source === 'catalogue') {
            throw new AppError('Les fonds du catalogue ne peuvent pas être supprimés', 403, 'FOND_CATALOGUE');
        }

        // Supprimer le fichier physique
        const cheminComplet = path.join(process.cwd(), fond.cheminFichier);
        if (fs.existsSync(cheminComplet)) {
            fs.unlinkSync(cheminComplet);
        }

        // Supprimer les relations établissements
        await this.fondEtabRepo.delete({ fondId });

        // Supprimer le fond
        await this.fondRepo.remove(fond);
        logger.info(`[Apparence] Fond supprimé: ${fond.nom} par ${utilisateurId}`);
    }

    // ============================================
    // MÉTHODES AUXILIAIRES
    // ============================================

    /**
     * Créer ou mettre à jour un paramètre système (upsert atomique)
     */
    private async upsertParametre(cle: string, valeur: string, etablissementId: string): Promise<void> {
        await this.parametreRepo.upsert(
            {
                cle,
                valeur,
                etablissementId,
                typeValeur: 'JSON' as any,
                categorie: 'THEME' as any,
            },
            ['cle', 'etablissementId'], // Contrainte unique pour conflit
        );
        
        logger.debug(`[Apparence] Paramètre ${cle} upserté pour l'établissement ${etablissementId}`);
    }

    /**
     * Obtenir les fonds actifs pour la rotation d'un établissement
     * Si aucun fond sélectionné, retourne tous les fonds système actifs
     */
    async getFondsRotation(etablissementId: string): Promise<Fond[]> {
        // Chercher les fonds sélectionnés et actifs
        const fondsEtab = await this.fondEtabRepo.find({
            where: { etablissementId, actif: true },
            relations: ['fond'],
            order: { ordre: 'ASC' },
        });

        // Si des fonds sont sélectionnés, les retourner
        if (fondsEtab.length > 0) {
            return fondsEtab.map((fe) => fe.fond);
        }

        // Sinon, retourner tous les fonds système actifs (fallback automatique)
        logger.info(`[Apparence] Rotation: aucun fond sélectionné pour ${etablissementId}, utilisant les fonds système`);
        return this.fondRepo.find({
            where: { estActif: true, estSysteme: true },
            order: { categorie: 'ASC', nom: 'ASC' },
        });
    }
}

// Singleton exporté
export const apparenceService = new ApparenceService();
