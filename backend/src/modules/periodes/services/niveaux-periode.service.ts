/**
 * ==================================
 * eLISAschool - Service Niveaux Période
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Gestion CRUD des niveaux de périodicité par établissement.
 * Supporte :
 * - Configuration initiale (wizard)
 * - Réordonnancement (drag & drop)
 * - Validation hiérarchique (niveau + usage)
 * - Seed automatique des niveaux par défaut
 */

import { Repository, LessThan } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { NiveauPeriode } from '../entities';
import {
    CreateNiveauPeriodeDto,
    UpdateNiveauPeriodeDto,
    ReorderNiveauxDto,
    ConfigInitialeNiveauxDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

/**
 * Niveaux par défaut pour un nouvel établissement (modèle camerounais francophone).
 */
export const NIVEAUX_DEFAUT = [
    { niveau: 0, label: 'Séquence', usageCode: 'NOTES' },
    { niveau: 1, label: 'Trimestre', usageCode: 'BULLETIN' },
    { niveau: 2, label: 'Semestre', usageCode: 'BULLETIN' },
    { niveau: 3, label: 'Année', usageCode: 'ANNEE' },
];

export class NiveauxPeriodeService {
    private repo: Repository<NiveauPeriode>;

    constructor() {
        this.repo = AppDataSource.getRepository(NiveauPeriode);
    }

    /**
     * Lister les niveaux d'un établissement, triés par niveau croissant.
     */
    async findAll(etablissementId: string): Promise<NiveauPeriode[]> {
        return this.repo.find({
            where: { etablissementId },
            order: { niveau: 'ASC' },
        });
    }

    /**
     * Trouver un niveau par ID.
     */
    async findOne(id: string, etablissementId: string): Promise<NiveauPeriode> {
        const niveau = await this.repo.findOne({
            where: { id, etablissementId },
        });
        if (!niveau) {
            throw new AppError('Niveau de période non trouvé', 404, 'NIVEAU_NOT_FOUND');
        }
        return niveau;
    }

    /**
     * Trouver un niveau par sa valeur numérique.
     */
    async findByNiveau(niveau: number, etablissementId: string): Promise<NiveauPeriode> {
        const found = await this.repo.findOne({
            where: { niveau, etablissementId },
        });
        if (!found) {
            throw new AppError(`Niveau ${niveau} non trouvé pour cet établissement`, 404, 'NIVEAU_NOT_FOUND');
        }
        return found;
    }

    /**
     * Créer un niveau pour un établissement.
     */
    async create(dto: CreateNiveauPeriodeDto, etablissementId: string): Promise<NiveauPeriode> {
        // Vérifier unicité du niveau pour l'établissement
        const existing = await this.repo.findOne({
            where: { niveau: dto.niveau, etablissementId },
        });
        if (existing) {
            throw new AppError(
                `Un niveau ${dto.niveau} existe déjà pour cet établissement (« ${existing.label} »)`,
                409,
                'NIVEAU_EXISTS',
            );
        }

        // Vérifier que l'usage existe
        const { usagesNiveauService } = await import('./usages-niveau.service');
        await usagesNiveauService.findByCode(dto.usageCode, etablissementId);

        const niveau = this.repo.create({
            ...dto,
            etablissementId,
        });
        await this.repo.save(niveau);

        logger.info(`[NiveauxPeriode] Niveau créé: ${niveau.label} (niveau=${niveau.niveau}, usage=${niveau.usageCode}) — ${niveau.id}`);
        return niveau;
    }

    /**
     * Mettre à jour un niveau (label, usage, description).
     * Le champ `niveau` (numéro) n'est pas modifiable via cette méthode — utiliser reorder.
     */
    async update(id: string, dto: UpdateNiveauPeriodeDto, etablissementId: string): Promise<NiveauPeriode> {
        const niveau = await this.findOne(id, etablissementId);

        // Vérifier l'usage si modifié
        if (dto.usageCode && dto.usageCode !== niveau.usageCode) {
            const { usagesNiveauService } = await import('./usages-niveau.service');
            await usagesNiveauService.findByCode(dto.usageCode, etablissementId);
        }

        Object.assign(niveau, dto);
        await this.repo.save(niveau);

        logger.info(`[NiveauxPeriode] Niveau mis à jour: ${niveau.label} (${id})`);
        return niveau;
    }

    /**
     * Supprimer un niveau.
     * Bloqué si des périodes utilisent ce niveau.
     */
    async delete(id: string, etablissementId: string): Promise<void> {
        const niveau = await this.findOne(id, etablissementId);

        // Vérifier si des périodes utilisent ce niveau
        const periodesRepo = AppDataSource.getRepository('Periode');
        const periodesUtilisant = await periodesRepo.count({
            where: { niveauId: niveau.id, etablissementId },
        });
        if (periodesUtilisant > 0) {
            throw new AppError(
                `Impossible de supprimer le niveau « ${niveau.label} » : ${periodesUtilisant} période(s) l'utilisent`,
                400,
                'NIVEAU_IN_USE',
            );
        }

        await this.repo.remove(niveau);
        logger.info(`[NiveauxPeriode] Niveau supprimé: ${niveau.label} (${id})`);
    }

    /**
     * Réordonner les niveaux (drag & drop).
     * Met à jour le champ `niveau` de chaque entrée.
     */
    async reorder(dto: ReorderNiveauxDto, etablissementId: string): Promise<NiveauPeriode[]> {
        // Vérifier que tous les IDs existent
        const niveaux = await this.repo.find({
            where: { etablissementId },
        });
        const niveauMap = new Map(niveaux.map(n => [n.id, n]));

        for (const item of dto.niveaux) {
            if (!niveauMap.has(item.id)) {
                throw new AppError(`Niveau ${item.id} non trouvé`, 404, 'NIVEAU_NOT_FOUND');
            }
        }

        // Mettre à jour les niveaux en transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const item of dto.niveaux) {
                await queryRunner.manager.update(
                    NiveauPeriode,
                    { id: item.id, etablissementId },
                    { niveau: item.niveau },
                );
            }
            await queryRunner.commitTransaction();

            logger.info(`[NiveauxPeriode] Réordonnancement effectué: ${dto.niveaux.length} niveau(x)`);
            return this.findAll(etablissementId);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Configuration initiale (wizard) — crée tous les niveaux d'un coup.
     * Utilisé lors de la première configuration d'un établissement.
     */
    async configInitiale(dto: ConfigInitialeNiveauxDto, etablissementId: string): Promise<NiveauPeriode[]> {
        // Vérifier qu'aucun niveau n'existe déjà
        const existing = await this.repo.count({ where: { etablissementId } });
        if (existing > 0) {
            throw new AppError(
                `Des niveaux existent déjà (${existing}). Utilisez l'interface de gestion pour les modifier.`,
                409,
                'NIVEAUX_ALREADY_CONFIGURED',
            );
        }

        // Vérifier unicité des niveaux dans le DTO
        const niveauxSet = new Set(dto.niveaux.map(n => n.niveau));
        if (niveauxSet.size !== dto.niveaux.length) {
            throw new AppError('Des niveaux dupliqués ont été détectés', 400, 'DUPLICATE_LEVELS');
        }

        // Vérifier les usages
        const { usagesNiveauService } = await import('./usages-niveau.service');
        for (const n of dto.niveaux) {
            await usagesNiveauService.findByCode(n.usageCode, etablissementId);
        }

        // Créer tous les niveaux
        const niveaux = dto.niveaux.map(n =>
            this.repo.create({
                ...n,
                etablissementId,
            }),
        );
        await this.repo.save(niveaux);

        logger.info(`[NiveauxPeriode] Configuration initiale: ${niveaux.length} niveau(x) créé(s) pour ${etablissementId}`);
        return this.findAll(etablissementId);
    }

    /**
     * Seed automatique des niveaux par défaut pour un nouvel établissement.
     * Appelé lors de la création d'un établissement.
     */
    async seedNiveauxDefaut(etablissementId: string): Promise<NiveauPeriode[]> {
        const existing = await this.repo.count({ where: { etablissementId } });
        if (existing > 0) {
            return this.findAll(etablissementId);
        }

        const niveaux = NIVEAUX_DEFAUT.map(n =>
            this.repo.create({
                ...n,
                etablissementId,
            }),
        );
        await this.repo.save(niveaux);

        logger.info(`[NiveauxPeriode] Seed niveaux par défaut pour établissement ${etablissementId}`);
        return this.findAll(etablissementId);
    }

    /**
     * Retourne les niveaux inférieurs à un niveau donné (pour validation hiérarchique).
     */
    async getNiveauxInferieurs(niveauParent: number, etablissementId: string): Promise<NiveauPeriode[]> {
        return this.repo.find({
            where: {
                etablissementId,
                niveau: LessThan(niveauParent),
            },
            order: { niveau: 'ASC' },
        });
    }

    /**
     * Vérifie si un niveau peut être enfant d'un autre (validation hybride niveau + usage).
     * Règles :
     * 1. Le niveau enfant doit être strictement inférieur au niveau parent
     * 2. L'usage enfant ne doit pas être 'ANNEE' (racine)
     */
    async validerEnfant(niveauEnfantId: string, niveauParentId: string, etablissementId: string): Promise<boolean> {
        const parent = await this.findOne(niveauParentId, etablissementId);
        const enfant = await this.findOne(niveauEnfantId, etablissementId);

        if (enfant.niveau >= parent.niveau) {
            throw new AppError(
                `Le niveau « ${enfant.label} » (niveau ${enfant.niveau}) doit être inférieur à « ${parent.label} » (niveau ${parent.niveau})`,
                400,
                'NIVEAU_INCOMPATIBLE',
            );
        }

        if (enfant.usageCode === 'ANNEE') {
            throw new AppError(
                `Un niveau avec l'usage "ANNEE" ne peut pas être enfant`,
                400,
                'ANNEE_CANNOT_BE_CHILD',
            );
        }

        return true;
    }
}

export const niveauxPeriodeService = new NiveauxPeriodeService();
