/**
 * ==================================
 * eLISAschool - Service Templates Emploi-du-Temps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 * 
 * CRUD et application des templates d'emploi du temps
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TemplateEmploiDuTemps, CreneauType } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export interface CreerTemplateDto {
    nom: string;
    description?: string;
    configuration: {
        joursTravailles: string[];
        heureDebutCours: string;
        heureFinCours: string;
        dureeCreneauDefaut: number;
    };
    creneauxTypes: CreneauType[];
    estPartage?: boolean;
}

export class TemplateService {
    private repo: Repository<TemplateEmploiDuTemps>;

    constructor() {
        this.repo = AppDataSource.getRepository(TemplateEmploiDuTemps);
    }

    async create(dto: CreerTemplateDto, etablissementId: string, creePar?: string): Promise<TemplateEmploiDuTemps> {
        const template = this.repo.create({
            ...dto,
            etablissementId,
            creePar,
        });

        await this.repo.save(template);
        logger.info(`[TemplateEDT] Template créé: ${template.nom}`);

        return template;
    }

    async findAll(etablissementId: string, includePartages = true): Promise<TemplateEmploiDuTemps[]> {
        const where: any = [
            { etablissementId, actif: true },
        ];

        if (includePartages) {
            where.push({ estPartage: true, actif: true });
        }

        return this.repo.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, etablissementId: string): Promise<TemplateEmploiDuTemps> {
        const template = await this.repo.findOne({
            where: {
                id,
                actif: true,
            },
        });

        if (!template) {
            throw new AppError('Template non trouvé', 404, 'NOT_FOUND');
        }

        // Vérifier l'accès
        if (template.etablissementId !== etablissementId && !template.estPartage) {
            throw new AppError('Accès non autorisé à ce template', 403, 'FORBIDDEN');
        }

        return template;
    }

    async update(id: string, dto: Partial<CreerTemplateDto>, etablissementId: string): Promise<TemplateEmploiDuTemps> {
        const template = await this.findOne(id, etablissementId);

        Object.assign(template, dto);
        await this.repo.save(template);

        logger.info(`[TemplateEDT] Template modifié: ${template.nom}`);
        return template;
    }

    async delete(id: string, etablissementId: string): Promise<void> {
        const template = await this.findOne(id, etablissementId);

        // Soft delete
        template.actif = false;
        await this.repo.save(template);

        logger.info(`[TemplateEDT] Template supprimé: ${template.nom}`);
    }

    async dupliquer(id: string, etablissementId: string, nouveauNom?: string): Promise<TemplateEmploiDuTemps> {
        const template = await this.findOne(id, etablissementId);

        const nouveauTemplate = this.repo.create({
            nom: nouveauNom || `${template.nom} (copie)`,
            description: template.description,
            etablissementId,
            configuration: template.configuration,
            creneauxTypes: template.creneauxTypes,
        });

        await this.repo.save(nouveauTemplate);
        logger.info(`[TemplateEDT] Template dupliqué: ${template.nom} → ${nouveauTemplate.nom}`);

        return nouveauTemplate;
    }
}

export const templateService = new TemplateService();
