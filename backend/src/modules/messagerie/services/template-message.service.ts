/**
 * ==================================
 * eLISAschool - Service Templates Messages
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TemplateMessage, CategorieTemplate } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class TemplateMessageService {
    private templateRepo: Repository<TemplateMessage>;

    constructor() {
        this.templateRepo = AppDataSource.getRepository(TemplateMessage);
    }

    /**
     * Créer un template
     */
    async createTemplate(
        code: string,
        titre: string,
        contenu: string,
        categorie: CategorieTemplate,
        etablissementId: string
    ): Promise<TemplateMessage> {
        // Vérifier unicité du code par établissement
        const existing = await this.templateRepo.findOne({
            where: { code, etablissementId },
        });
        if (existing) {
            throw new AppError(`Le code "${code}" existe déjà`, 409, 'TEMPLATE_CODE_EXISTS');
        }

        const template = this.templateRepo.create({
            code,
            titre,
            contenu,
            categorie,
            etablissementId,
        });
        await this.templateRepo.save(template);

        logger.info(`Template créé: ${code} pour établissement ${etablissementId}`);
        return template;
    }

    /**
     * Récupérer les templates d'un établissement
     */
    async getTemplates(
        etablissementId: string,
        categorie?: CategorieTemplate,
        actif?: boolean
    ): Promise<TemplateMessage[]> {
        const where: any = { etablissementId };
        if (categorie) where.categorie = categorie;
        if (actif !== undefined) where.actif = actif;

        return this.templateRepo.find({
            where,
            order: { categorie: 'ASC', titre: 'ASC' },
        });
    }

    /**
     * Rendre un template avec des variables
     */
    renderTemplate(
        template: TemplateMessage,
        variables: Record<string, string>
    ): string {
        let contenu = template.contenu;

        // Remplacer les variables {{nom}} par leur valeur
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            contenu = contenu.replace(regex, value);
        }

        return contenu;
    }

    /**
     * Supprimer un template
     */
    async deleteTemplate(templateId: string, etablissementId: string): Promise<void> {
        const template = await this.templateRepo.findOne({
            where: { id: templateId, etablissementId },
        });
        if (!template) {
            throw new AppError('Template non trouvé', 404, 'NOT_FOUND');
        }

        await this.templateRepo.remove(template);
        logger.info(`Template supprimé: ${templateId}`);
    }

    /**
     * Mettre à jour un template
     */
    async updateTemplate(
        templateId: string,
        updates: Partial<Pick<TemplateMessage, 'titre' | 'contenu' | 'categorie' | 'actif'>>,
        etablissementId: string
    ): Promise<TemplateMessage> {
        const template = await this.templateRepo.findOne({
            where: { id: templateId, etablissementId },
        });
        if (!template) {
            throw new AppError('Template non trouvé', 404, 'NOT_FOUND');
        }

        Object.assign(template, updates);
        await this.templateRepo.save(template);

        return template;
    }
}

export const templateMessageService = new TemplateMessageService();
