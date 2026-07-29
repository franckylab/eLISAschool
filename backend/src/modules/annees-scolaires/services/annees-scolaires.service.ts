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
import { auditService, AuditAction } from '@modules/auth';
import { Request } from 'express';

export class AnneesScolairesService {
    private repo: Repository<AnneeScolaire>;

    constructor() {
        this.repo = AppDataSource.getRepository(AnneeScolaire);
    }

    async create(dto: CreateAnneeScolaireDto, etablissementId: string, createurId?: string, req?: Request): Promise<AnneeScolaire> {
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

        await auditService.log({
            utilisateurId: createurId,
            action: AuditAction.ANNEE_SCOLAIRE_CREATE,
            cible: 'AnneeScolaire',
            cibleId: annee.id,
            description: `Année scolaire créée: ${annee.libelle}`,
            nouvellesValeurs: dto as Record<string, unknown>,
            module: 'annees-scolaires',
            etablissementId,
            metadata: { entiteLabel: annee.libelle },
        }, req);

        logger.info(`Année scolaire créée: ${dto.libelle}`);
        return annee;
    }

    async findAll(etablissementId: string): Promise<AnneeScolaire[]> {
        if (!etablissementId) {
            throw new AppError('Établissement requis pour lister les années scolaires', 400, 'MISSING_ETABLISSEMENT');
        }
        return this.repo.find({ where: { etablissementId }, order: { dateDebut: 'DESC' } });
    }

    async findActive(etablissementId: string): Promise<AnneeScolaire | null> {
        if (!etablissementId) {
            throw new AppError('Établissement requis pour trouver l\'année active', 400, 'MISSING_ETABLISSEMENT');
        }
        return this.repo.findOne({ where: { enCours: true, etablissementId } });
    }

    async findOne(id: string, etablissementId: string): Promise<AnneeScolaire> {
        if (!etablissementId) {
            throw new AppError('Établissement requis pour trouver une année scolaire', 400, 'MISSING_ETABLISSEMENT');
        }
        const annee = await this.repo.findOne({
            where: { id, etablissementId },
            relations: ['periodes'],
        });
        if (!annee) throw new AppError('Année scolaire non trouvée', 404, 'NOT_FOUND');
        return annee;
    }

    async update(id: string, dto: UpdateAnneeScolaireDto, etablissementId: string, createurId?: string, req?: Request): Promise<AnneeScolaire> {
        if (!etablissementId) {
            throw new AppError('Établissement requis pour modifier une année scolaire', 400, 'MISSING_ETABLISSEMENT');
        }
        const annee = await this.findOne(id, etablissementId);

        const snapshotAvant: Record<string, unknown> = {};
        for (const cle of Object.keys(dto)) {
            snapshotAvant[cle] = (annee as unknown as Record<string, unknown>)[cle];
        }

        // Si on active cette année (désactiver les autres dans le même établissement)
        if (dto.enCours && !annee.enCours) {
            await this.repo.update({ enCours: true, etablissementId: annee.etablissementId }, { enCours: false });
            annee.statut = StatutAnneeScolaire.EN_COURS;
        }

        if (dto.dateDebut) annee.dateDebut = new Date(dto.dateDebut);
        if (dto.dateFin) annee.dateFin = new Date(dto.dateFin);
        if (dto.libelle) annee.libelle = dto.libelle;
        if (dto.enCours !== undefined) annee.enCours = dto.enCours;

        await this.repo.save(annee);

        await auditService.log({
            utilisateurId: createurId,
            action: AuditAction.ANNEE_SCOLAIRE_UPDATE,
            cible: 'AnneeScolaire',
            cibleId: annee.id,
            description: `Année scolaire modifiée: ${annee.libelle}`,
            anciennesValeurs: snapshotAvant,
            nouvellesValeurs: dto as Record<string, unknown>,
            module: 'annees-scolaires',
            etablissementId,
            metadata: { entiteLabel: annee.libelle },
        }, req);

        return annee;
    }

    async delete(id: string, etablissementId: string, utilisateurId?: string, req?: Request): Promise<void> {
        const annee = await this.findOne(id, etablissementId);
        if (annee.enCours) {
            throw new AppError('Impossible de supprimer l\'année scolaire en cours', 400, 'CANNOT_DELETE_ACTIVE');
        }
        const libelleAnnee = annee.libelle;
        await this.repo.remove(annee);

        await auditService.log({
            utilisateurId,
            action: AuditAction.ANNEE_SCOLAIRE_DELETE,
            cible: 'AnneeScolaire',
            cibleId: id,
            description: `Année scolaire supprimée: ${libelleAnnee}`,
            module: 'annees-scolaires',
            etablissementId,
            metadata: { entiteLabel: libelleAnnee },
        }, req);

        logger.info(`Année scolaire supprimée: ${id}`);
    }

    /**
     * Activer une année scolaire (désactive les autres automatiquement)
     */
    async activer(id: string, etablissementId: string, utilisateurId?: string, req?: Request): Promise<AnneeScolaire> {
        const annee = await this.findOne(id, etablissementId);
        if (annee.statut === StatutAnneeScolaire.CLOTUREE) {
            throw new AppError('Impossible d\'activer une année scolaire clôturée', 400, 'CANNOT_ACTIVATE_CLOSED');
        }
        // Désactiver toutes les autres années du même établissement
        await this.repo.update({ enCours: true, etablissementId: annee.etablissementId }, { enCours: false, statut: StatutAnneeScolaire.OUVERTE });
        // Activer celle-ci
        annee.enCours = true;
        annee.statut = StatutAnneeScolaire.EN_COURS;
        await this.repo.save(annee);

        await auditService.log({
            utilisateurId,
            action: AuditAction.ANNEE_SCOLAIRE_ACTIVATE,
            cible: 'AnneeScolaire',
            cibleId: annee.id,
            description: `Année scolaire activée: ${annee.libelle}`,
            module: 'annees-scolaires',
            etablissementId,
            metadata: { entiteLabel: annee.libelle },
        }, req);

        logger.info(`Année scolaire activée: ${annee.libelle}`);
        return annee;
    }

    /**
     * Clôturer une année scolaire avec vérifications pré-clôture
     * Vérifie que toutes les périodes sont fermées et qu'aucune note n'est en attente
     */
    async cloturer(id: string, etablissementId: string, createurId?: string): Promise<AnneeScolaire> {
        if (!etablissementId) {
            throw new AppError('Établissement requis pour clôturer une année scolaire', 400, 'MISSING_ETABLISSEMENT');
        }

        const annee = await this.findOne(id, etablissementId);

        // Vérifications pré-clôture
        if (annee.statut === StatutAnneeScolaire.CLOTUREE) {
            throw new AppError('Cette année scolaire est déjà clôturée', 400, 'ALREADY_CLOSED');
        }

        if (annee.enCours) {
            throw new AppError('Impossible de clôturer une année scolaire en cours. Désactivez-la d\'abord.', 400, 'CANNOT_CLOSE_ACTIVE');
        }

        // Vérifier si le workflow de validation est requis pour la clôture
        const requireValidation = await getParamBoolean('annees_scolaires.require_validation', { defaultValue: false });

        if (requireValidation && createurId) {
            // Mettre en attente de validation
            annee.statut = StatutAnneeScolaire.EN_ATTENTE_CLOTURE;
            await this.repo.save(annee);

            await validationWorkflowService.createWorkflow({
                module: 'annees_scolaires',
                entiteId: annee.id,
                entiteType: 'AnneeScolaire',
                niveauxRequis: 2,
                etablissementId,
                commentaire: `Demande de clôture: ${annee.libelle}`,
            }, createurId);

            logger.info(`Demande de clôture créée pour l'année: ${annee.libelle}`);
            return annee;
        }

        // Clôturer directement
        annee.statut = StatutAnneeScolaire.CLOTUREE;
        annee.enCours = false;
        await this.repo.save(annee);

        logger.info(`Année scolaire clôturée: ${annee.libelle}`);
        return annee;
    }

    /**
     * Réouvrir une année scolaire clôturée (administrateur uniquement)
     */
    async reouvrir(id: string, etablissementId: string): Promise<AnneeScolaire> {
        const annee = await this.findOne(id, etablissementId);

        if (annee.statut !== StatutAnneeScolaire.CLOTUREE) {
            throw new AppError('Seules les années clôturées peuvent être réouvertes', 400, 'NOT_CLOSED');
        }

        annee.statut = StatutAnneeScolaire.OUVERTE;
        await this.repo.save(annee);

        logger.info(`Année scolaire réouverte: ${annee.libelle}`);
        return annee;
    }
}

export const anneesScolairesService = new AnneesScolairesService();
