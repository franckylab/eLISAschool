/**
 * ==================================
 * eLISAschool - Service Bulletins
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Bulletin } from '../entities';
import { GenerateBulletinDto, UpdateBulletinDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { classesService } from '@modules/classes/services';
import { periodesService } from '@modules/periodes/services';
import { notesService } from '@modules/notes/services';
import { matieresService } from '@modules/matieres/services';
import { Eleve } from '@modules/eleves/entities';
import { getParamBoolean, getParamNumber, getParam } from '@modules/configuration/utils/config.helper';

export class BulletinsService {
    private repo: Repository<Bulletin>;

    constructor() {
        this.repo = AppDataSource.getRepository(Bulletin);
    }

    /**
     * Récupère les paramètres bulletins depuis la configuration
     */
    private async getBulletinsParams() {
        return {
            includeRanking: await getParamBoolean('bulletins.include_ranking', true),
            showAppreciations: await getParamBoolean('bulletins.show_appreciations', true),
            validationThreshold: await getParamNumber('bulletins.validation_threshold', 10),
            calculationMethod: await getParam<string>('bulletins.calculation_method', 'ponderee'),
            displayCoefficients: await getParamBoolean('bulletins.display_coefficients', true),
            templateId: await getParam<string>('bulletins.template_id', 'default'),
        };
    }

    async generate(dto: GenerateBulletinDto, etablissementId?: string): Promise<Bulletin[]> {
        const params = await this.getBulletinsParams();
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const classe = await classesService.findOne(dto.classeId, etablissementId);
            const periode = await periodesService.findOne(dto.periodeId);

            // Vérifier que la période appartient à la même année scolaire que la classe
            if (periode.anneeScolaireId !== classe.anneeScolaireId) {
                throw new AppError('La période ne correspond pas à l\'année scolaire de la classe', 400, 'PERIODE_MISMATCH');
            }

            // Récupérer les élèves (tous ou un seul)
            const eleveRepo = AppDataSource.getRepository(Eleve);
            let eleves: Eleve[] = [];
            if (dto.eleveId) {
                const eleve = await eleveRepo.findOne({ where: { id: dto.eleveId } });
                if (eleve) eleves.push(eleve);
            } else {
                // Find eleves in class via affectations
                const affectationRepo = AppDataSource.getRepository('AffectationEleve');
                const affectations = await affectationRepo.find({
                    where: { classeId: dto.classeId, actif: true },
                }) as any[];

                const eleveIds = affectations.map((a: any) => a.eleveId);
                if (eleveIds.length > 0) {
                    eleves = await eleveRepo.findByIds(eleveIds);
                }
            }

            if (eleves.length === 0) {
                throw new AppError('Aucun élève trouvé dans cette classe', 404, 'NO_ELEVES');
            }

            const bulletins: Bulletin[] = [];

            for (const eleve of eleves) {
                // Vérifier que l'élève appartient au même établissement
                if (etablissementId && eleve.etablissementId !== etablissementId) {
                    throw new AppError(`L'élève ${eleve.id} n'appartient pas à cet établissement`, 403, 'WRONG_ETABLISSEMENT');
                }

                // Calculer Moyenne Générale selon la méthode configurée
                const programme = await matieresService.getProgrammeNiveau(classe.niveauId);

                let totalPoints = 0;
                let totalCoeffs = 0;

                for (const matiereNiveau of programme) {
                    const moyenneMatiere = await notesService.calculerMoyenne(
                        eleve.id,
                        matiereNiveau.matiereId,
                        periode.id,
                        etablissementId
                    );
                    
                    // Méthode de calcul : arithmétique ou pondérée
                    const coefficient = params.calculationMethod === 'ponderee' 
                        ? matiereNiveau.coefficient 
                        : 1;
                    
                    totalPoints += moyenneMatiere * coefficient;
                    totalCoeffs += coefficient;
                }

                const moyenneGenerale = totalCoeffs > 0 ? totalPoints / totalCoeffs : 0;

                // Créer ou MAJ Bulletin
                let bulletin = await this.repo.findOne({
                    where: { eleveId: eleve.id, classeId: classe.id, periodeId: periode.id }
                });

                if (!bulletin) {
                    bulletin = this.repo.create({
                        eleveId: eleve.id,
                        classeId: classe.id,
                        periodeId: periode.id,
                        anneeScolaireId: classe.anneeScolaireId,
                        etablissementId,
                    });
                }

                bulletin.moyenneGenerale = parseFloat(moyenneGenerale.toFixed(2));

                await queryRunner.manager.save(bulletin);
                bulletins.push(bulletin);
            }

            // Calcul des rangs pour tous les bulletins de la classe/période (si activé)
            if (params.includeRanking) {
                await this.calculerRangs(classe.id, periode.id, etablissementId, queryRunner);
            }

            await queryRunner.commitTransaction();
            logger.info(`[${etablissementId}] ${bulletins.length} bulletins générés pour la classe ${classe.nom}`);
            return bulletins;
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            logger.error(`[${etablissementId}] Erreur génération bulletins: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Calcule les rangs de tous les élèves d'une classe pour une période donnée
     */
    private async calculerRangs(classeId: string, periodeId: string, etablissementId?: string, queryRunner?: any): Promise<void> {
        // Récupérer tous les bulletins de la classe pour cette période
        const where: any = { classeId, periodeId };
        if (etablissementId) where.etablissementId = etablissementId;
        
        const bulletins = await (queryRunner?.manager || this.repo).find(Bulletin, {
            where,
            order: { moyenneGenerale: 'DESC' }
        });

        if (bulletins.length === 0) return;

        // Trier par moyenne décroissante et assigner les rangs
        bulletins.sort((a: Bulletin, b: Bulletin) => (b.moyenneGenerale || 0) - (a.moyenneGenerale || 0));

        let rang = 1;
        for (let i = 0; i < bulletins.length; i++) {
            // Si même moyenne que le précédent, même rang
            if (i > 0 && bulletins[i].moyenneGenerale === bulletins[i - 1].moyenneGenerale) {
                bulletins[i].rang = bulletins[i - 1].rang;
            } else {
                bulletins[i].rang = rang;
            }
            rang++;
            
            await (queryRunner?.manager || this.repo).save(bulletins[i]);
        }

        logger.info(`[${etablissementId}] Rangs calculés pour ${bulletins.length} bulletins`);
    }

    async findByEleve(eleveId: string): Promise<Bulletin[]> {
        return this.repo.find({
            where: { eleveId },
            relations: ['periode', 'classe'],
            order: { periode: { dateDebut: 'ASC' } }
        });
    }

    async update(id: string, dto: UpdateBulletinDto): Promise<Bulletin> {
        const bulletin = await this.repo.findOne({ where: { id } });
        if (!bulletin) throw new AppError('Bulletin non trouvé', 404, 'NOT_FOUND');
        Object.assign(bulletin, dto);
        await this.repo.save(bulletin);
        return bulletin;
    }
}

export const bulletinsService = new BulletinsService();
