/**
 * ==================================
 * eLISAschool - Service Impressions
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ModeleDocument, FileImpression, TypeDocument, StatutImpression } from '../entities';
import { CreateModeleDto, UpdateModeleDto, CreateImpressionDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getAppConfig } from '@modules/configuration/utils/config.helper';

/**
 * Service d'impressions et génération de documents
 */
export class ImpressionsService {
    private modeleRepo: Repository<ModeleDocument>;
    private fileRepo: Repository<FileImpression>;

    constructor() {
        this.modeleRepo = AppDataSource.getRepository(ModeleDocument);
        this.fileRepo = AppDataSource.getRepository(FileImpression);
    }

    // ============ MODÈLES ============

    async createModele(dto: CreateModeleDto): Promise<ModeleDocument> {
        // Si parDefaut, désactiver les autres modèles par défaut du même type
        if (dto.parDefaut) {
            await this.modeleRepo.update({ type: dto.type, parDefaut: true }, { parDefaut: false });
        }

        const modele = this.modeleRepo.create(dto);
        await this.modeleRepo.save(modele);
        logger.info(`Modèle document créé: ${dto.nom}`);
        return modele;
    }

    async getModeles(type?: TypeDocument): Promise<ModeleDocument[]> {
        const where: any = { actif: true };
        if (type) where.type = type;
        return this.modeleRepo.find({ where, order: { nom: 'ASC' } });
    }

    async getModele(id: string): Promise<ModeleDocument> {
        const modele = await this.modeleRepo.findOne({ where: { id } });
        if (!modele) throw new AppError('Modèle non trouvé', 404, 'NOT_FOUND');
        return modele;
    }

    async getModeleParDefaut(type: TypeDocument): Promise<ModeleDocument | null> {
        return this.modeleRepo.findOne({ where: { type, parDefaut: true, actif: true } });
    }

    async updateModele(id: string, dto: UpdateModeleDto): Promise<ModeleDocument> {
        const modele = await this.getModele(id);

        if (dto.parDefaut) {
            await this.modeleRepo.update({ type: modele.type, parDefaut: true }, { parDefaut: false });
        }

        Object.assign(modele, dto);
        await this.modeleRepo.save(modele);
        return modele;
    }

    async deleteModele(id: string): Promise<void> {
        const modele = await this.getModele(id);
        modele.actif = false;
        await this.modeleRepo.save(modele);
    }

    // ============ FILE D'IMPRESSION ============

    async createImpression(dto: CreateImpressionDto, utilisateurId: string): Promise<FileImpression> {
        const impression = this.fileRepo.create({
            ...dto,
            utilisateurId,
            statut: StatutImpression.EN_ATTENTE,
        });
        await this.fileRepo.save(impression);
        logger.info(`Impression ajoutée à la file: ${dto.titre}`);
        return impression;
    }

    async getFileImpression(utilisateurId?: string): Promise<FileImpression[]> {
        const where: any = {};
        if (utilisateurId) where.utilisateurId = utilisateurId;
        return this.fileRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async getImpression(id: string): Promise<FileImpression> {
        const impression = await this.fileRepo.findOne({ where: { id } });
        if (!impression) throw new AppError('Impression non trouvée', 404, 'NOT_FOUND');
        return impression;
    }

    async annulerImpression(id: string, utilisateurId: string): Promise<FileImpression> {
        const impression = await this.getImpression(id);
        if (impression.utilisateurId !== utilisateurId) {
            throw new AppError('Non autorisé', 403, 'FORBIDDEN');
        }
        if (impression.statut !== StatutImpression.EN_ATTENTE) {
            throw new AppError('Impression déjà en cours ou terminée', 400, 'INVALID_STATUS');
        }

        impression.statut = StatutImpression.ANNULE;
        await this.fileRepo.save(impression);
        return impression;
    }

    // ============ GÉNÉRATION ============

    async genererDocument(impressionId: string): Promise<string> {
        const impression = await this.getImpression(impressionId);
        impression.statut = StatutImpression.EN_COURS;
        await this.fileRepo.save(impression);

        try {
            const modele = impression.modeleId
                ? await this.getModele(impression.modeleId)
                : await this.getModeleParDefaut(impression.type);

            if (!modele) {
                throw new Error('Aucun modèle disponible');
            }

            // Récupérer la configuration de l'établissement
            const appConfig = await getAppConfig();

            // Générer l'entête
            const entete = await this.genererEntete(modele, appConfig);

            // Remplacer les placeholders dans le template
            let html = modele.template;
            html = this.replacePlaceholders(html, impression.donnees || {});

            // Ajouter entête et pied de page
            const documentFinal = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${JSON.stringify(modele.styles || {})}</style>
        </head>
        <body>
          ${entete}
          <div class="content">${html}</div>
          ${this.genererPiedDePage(modele, appConfig)}
        </body>
        </html>
      `;

            // TODO: Utiliser une lib comme Puppeteer pour générer le PDF
            const fichierUrl = `/documents/${impression.id}.pdf`;

            impression.statut = StatutImpression.TERMINE;
            impression.fichierUrl = fichierUrl;
            impression.dateTraitement = new Date();
            await this.fileRepo.save(impression);

            logger.info(`Document généré: ${fichierUrl}`);
            return fichierUrl;
        } catch (error: any) {
            impression.statut = StatutImpression.ECHEC;
            impression.erreur = error.message;
            await this.fileRepo.save(impression);
            throw error;
        }
    }

    private async genererEntete(modele: ModeleDocument, appConfig: any): Promise<string> {
        if (!modele.entete) return '';

        let entete = '<div class="entete">';

        if (modele.entete.logoEtablissement && appConfig.logoUrl) {
            entete += `<img src="${appConfig.logoUrl}" class="logo-etablissement" />`;
        }

        if (modele.entete.nomEtablissement) {
            entete += `<h1>${appConfig.nomEtablissement || 'Établissement'}</h1>`;
        }

        if (modele.entete.numeroAdmin && appConfig.numeroAdministratif) {
            entete += `<p>Arrêté N° ${appConfig.numeroAdministratif}</p>`;
        }

        if (modele.entete.adresse && appConfig.adresseEtablissement) {
            entete += `<p>${appConfig.adresseEtablissement}</p>`;
        }

        if (modele.entete.slogan && appConfig.sloganEtablissement) {
            entete += `<p class="slogan">${appConfig.sloganEtablissement}</p>`;
        }

        if (modele.entete.logoElisaschool) {
            entete += `<img src="/assets/elisaschool-logo.png" class="logo-elisaschool" />`;
        }

        entete += '</div>';
        return entete;
    }

    private genererPiedDePage(modele: ModeleDocument, appConfig: any): string {
        if (!modele.piedDePage) return '';

        let pied = '<div class="pied-page">';

        if (modele.piedDePage.date) {
            pied += `<span>Date: ${new Date().toLocaleDateString('fr-FR')}</span>`;
        }

        if (modele.piedDePage.version) {
            pied += `<span>eLISAschool - franck arlos chendjou - v${appConfig.version || '1.0.0'}</span>`;
        }

        pied += '</div>';
        return pied;
    }

    private replacePlaceholders(template: string, data: Record<string, any>): string {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
        return result;
    }

    // ============ TRAITEMENT BATCH ============

    async traiterFileImpression(): Promise<number> {
        const impressions = await this.fileRepo.find({
            where: { statut: StatutImpression.EN_ATTENTE },
            order: { createdAt: 'ASC' },
            take: 10,
        });

        let traites = 0;
        for (const impression of impressions) {
            try {
                await this.genererDocument(impression.id);
                traites++;
            } catch (e) {
                logger.error(`Échec génération impression ${impression.id}`);
            }
        }

        return traites;
    }
}

export const impressionsService = new ImpressionsService();
