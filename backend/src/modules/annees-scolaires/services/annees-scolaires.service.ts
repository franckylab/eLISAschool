/**
 * ==================================
 * eLISAschool - Service Années Scolaires
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AnneeScolaire, StatutAnneeScolaire } from '../entities';
import { CreateAnneeScolaireDto, UpdateAnneeScolaireDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';

export class AnneesScolairesService {
    private repo: Repository<AnneeScolaire>;

    constructor() {
        this.repo = AppDataSource.getRepository(AnneeScolaire);
    }

    async create(dto: CreateAnneeScolaireDto, createurId?: string, etablissementId?: string): Promise<AnneeScolaire> {
        // Vérifier si le workflow de validation est requis
        const requireValidation = await getParamBoolean('annees_scolaires.require_validation', { defaultValue: false });

        // Si nouvelle année active, désactiver les autres
        if (dto.enCours && !requireValidation) {
            await this.repo.update({ enCours: true }, { enCours: false });
        }

        const annee = this.repo.create({
            ...dto,
            dateDebut: new Date(dto.dateDebut),
            dateFin: new Date(dto.dateFin),
            enCours: requireValidation ? false : dto.enCours,
            statut: requireValidation ? StatutAnneeScolaire.OUVERTE : (dto.enCours ? StatutAnneeScolaire.EN_COURS : StatutAnneeScolaire.OUVERTE),
        });
        await this.repo.save(annee);

        // Créer le workflow de validation si requis
        if (requireValidation && createurId) {
            await validationWorkflowService.createWorkflow({
                module: 'annees_scolaires',
                entiteId: annee.id,
                entiteType: 'AnneeScolaire',
                niveauxRequis: 2,
                etablissementId,
                commentaire: `Création année scolaire: ${dto.libelle}`,
            }, createurId);
        }

        logger.info(`Année scolaire créée: ${dto.libelle}`);
        return annee;
    }

    async findAll(): Promise<AnneeScolaire[]> {
        return this.repo.find({ order: { dateDebut: 'DESC' } });
    }

    async findActive(): Promise<AnneeScolaire | null> {
        return this.repo.findOne({ where: { enCours: true } });
    }

    async findOne(id: string): Promise<AnneeScolaire> {
        const annee = await this.repo.findOne({ where: { id } });
        if (!annee) throw new AppError('Année scolaire non trouvée', 404, 'NOT_FOUND');
        return annee;
    }

    async update(id: string, dto: UpdateAnneeScolaireDto, createurId?: string, etablissementId?: string): Promise<AnneeScolaire> {
        const annee = await this.findOne(id);

        // Détecter une demande de clôture
        const demandeCloture = dto.cloturee === true && !annee.cloturee;

        if (demandeCloture) {
            const requireValidation = await getParamBoolean('annees_scolaires.require_validation', { defaultValue: false });
            if (requireValidation && createurId) {
                // Ne PAS clôturer, mettre en attente
                annee.statut = StatutAnneeScolaire.EN_ATTENTE_CLOTURE;
                const { cloturee, ...autresModifs } = dto;
                if (autresModifs.dateDebut) annee.dateDebut = new Date(autresModifs.dateDebut);
                if (autresModifs.dateFin) annee.dateFin = new Date(autresModifs.dateFin);
                if (autresModifs.libelle) annee.libelle = autresModifs.libelle;
                await this.repo.save(annee);

                await validationWorkflowService.createWorkflow({
                    module: 'annees_scolaires',
                    entiteId: annee.id,
                    entiteType: 'AnneeScolaire',
                    niveauxRequis: 2,
                    etablissementId,
                    commentaire: `Demande de clôture: ${annee.libelle}`,
                }, createurId);

                return annee;
            }
        }

        // Si on active cette année
        if (dto.enCours && !annee.enCours) {
            await this.repo.update({ enCours: true }, { enCours: false });
            annee.statut = StatutAnneeScolaire.EN_COURS;
        }

        // Si on clôture
        if (dto.cloturee === true && !annee.cloturee) {
            annee.statut = StatutAnneeScolaire.CLOTUREE;
        }

        if (dto.dateDebut) annee.dateDebut = new Date(dto.dateDebut);
        if (dto.dateFin) annee.dateFin = new Date(dto.dateFin);
        if (dto.libelle) annee.libelle = dto.libelle;
        if (dto.enCours !== undefined) annee.enCours = dto.enCours;
        if (dto.cloturee !== undefined) annee.cloturee = dto.cloturee;

        await this.repo.save(annee);
        return annee;
    }

    async delete(id: string): Promise<void> {
        const annee = await this.findOne(id);
        if (annee.enCours) {
            throw new AppError('Impossible de supprimer l\'année scolaire en cours', 400, 'CANNOT_DELETE_ACTIVE');
        }
        await this.repo.remove(annee);
        logger.info(`Année scolaire supprimée: ${id}`);
    }
}

export const anneesScolairesService = new AnneesScolairesService();
