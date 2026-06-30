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
        if (!etablissementId) {
            throw new AppError('Établissement requis pour créer une année scolaire', 400, 'MISSING_ETABLISSEMENT');
        }

        // Vérifier si le workflow de validation est requis
        const requireValidation = await getParamBoolean('annees_scolaires.require_validation', { defaultValue: false });

        // Si nouvelle année active, désactiver les autres (dans le même établissement)
        if (dto.enCours && !requireValidation) {
            await this.repo.update({ enCours: true, etablissementId }, { enCours: false });
        }

        const annee = this.repo.create({
            ...dto,
            dateDebut: new Date(dto.dateDebut),
            dateFin: new Date(dto.dateFin),
            enCours: requireValidation ? false : dto.enCours,
            statut: requireValidation ? StatutAnneeScolaire.OUVERTE : (dto.enCours ? StatutAnneeScolaire.EN_COURS : StatutAnneeScolaire.OUVERTE),
            etablissementId,
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

    async findAll(etablissementId?: string): Promise<AnneeScolaire[]> {
        const where: any = {};
        if (etablissementId) where.etablissementId = etablissementId;
        return this.repo.find({ where, order: { dateDebut: 'DESC' } });
    }

    async findActive(etablissementId?: string): Promise<AnneeScolaire | null> {
        const where: any = { enCours: true };
        if (etablissementId) where.etablissementId = etablissementId;
        return this.repo.findOne({ where });
    }

    async findOne(id: string, etablissementId?: string): Promise<AnneeScolaire> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        const annee = await this.repo.findOne({ where });
        if (!annee) throw new AppError('Année scolaire non trouvée', 404, 'NOT_FOUND');
        return annee;
    }

    async update(id: string, dto: UpdateAnneeScolaireDto, createurId?: string, etablissementId?: string): Promise<AnneeScolaire> {
        const annee = await this.findOne(id, etablissementId);

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

        // Si on active cette année (désactiver les autres dans le même établissement)
        if (dto.enCours && !annee.enCours) {
            await this.repo.update({ enCours: true, etablissementId: annee.etablissementId }, { enCours: false });
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

    async delete(id: string, etablissementId?: string): Promise<void> {
        const annee = await this.findOne(id, etablissementId);
        if (annee.enCours) {
            throw new AppError('Impossible de supprimer l\'année scolaire en cours', 400, 'CANNOT_DELETE_ACTIVE');
        }
        await this.repo.remove(annee);
        logger.info(`Année scolaire supprimée: ${id}`);
    }

    /**
     * Activer une année scolaire (désactive les autres automatiquement)
     */
    async activer(id: string, etablissementId?: string): Promise<AnneeScolaire> {
        const annee = await this.findOne(id, etablissementId);
        if (annee.cloturee) {
            throw new AppError('Impossible d\'activer une année scolaire clôturée', 400, 'CANNOT_ACTIVATE_CLOSED');
        }
        // Désactiver toutes les autres années du même établissement
        await this.repo.update({ enCours: true, etablissementId: annee.etablissementId }, { enCours: false, statut: StatutAnneeScolaire.OUVERTE });
        // Activer celle-ci
        annee.enCours = true;
        annee.statut = StatutAnneeScolaire.EN_COURS;
        await this.repo.save(annee);
        logger.info(`Année scolaire activée: ${annee.libelle}`);
        return annee;
    }
}

export const anneesScolairesService = new AnneesScolairesService();
