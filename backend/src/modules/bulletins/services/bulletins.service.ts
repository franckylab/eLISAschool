/**
 * ==================================
 * eLISAschool - Service Bulletins
 * ==================================
 */

import { Repository, MoreThan } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Bulletin } from '../entities';
import { GenerateBulletinDto, UpdateBulletinDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { parentsService } from '@modules/responsables-eleves/services';
import { classesService } from '@modules/classes/services';
import { periodesService } from '@modules/periodes/services';
import { StatutPeriode } from '@modules/periodes/entities';
import { notesService } from '@modules/notes/services';
import { notesBatchLoaderService } from '@modules/notes/services/notes-batch-loader.service';
import { matieresService } from '@modules/matieres/services';
import { AffectationMatiere, StatutAffectationMatiere } from '@modules/matieres/entities';
import { Eleve } from '@modules/eleves/entities';
import { getParamBoolean, getParamNumber, getParam } from '@modules/configuration/utils/config.helper';
import { notificationTemplates } from '@modules/notifications/services';

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
            includeRanking: await getParamBoolean('bulletins.include_ranking', { defaultValue: true }),
            showAppreciations: await getParamBoolean('bulletins.show_appreciations', { defaultValue: true }),
            validationThreshold: await getParamNumber('bulletins.validation_threshold', { defaultValue: 10 }),
            calculationMethod: await getParam<string>('bulletins.calculation_method', { defaultValue: 'ponderee' }),
            displayCoefficients: await getParamBoolean('bulletins.display_coefficients', { defaultValue: true }),
            templateId: await getParam<string>('bulletins.template_id', { defaultValue: 'default' }),
        };
    }

    async generate(dto: GenerateBulletinDto, etablissementId?: string): Promise<Bulletin[]> {
        const params = await this.getBulletinsParams();
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Récupérer la classe/année et vérifier la cohérence
            const classeAnneeRepo = AppDataSource.getRepository('ClasseAnnee');
            const classeAnnee = await classeAnneeRepo.findOne({
                where: { id: dto.classeAnneeId },
                relations: ['classe', 'anneeScolaire']
            }) as any;

            if (!classeAnnee) {
                throw new AppError('Classe/Année non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');
            }

            const periode = await periodesService.findOne(dto.periodeId);

            // Vérifier le verrouillage de la période
            if (periode.statut === StatutPeriode.CLOTUREE) {
                const lockOnCloture = await getParamBoolean('periodes.lock_on_cloture', { defaultValue: true });
                if (lockOnCloture) {
                    throw new AppError(
                        'Impossible de générer des bulletins pour une période clôturée',
                        400,
                        'PERIODE_CLOTUREE_IMMUTABLE',
                    );
                }
            }

            // Vérifier que la période appartient à la même année scolaire
            if (periode.anneeScolaireId !== classeAnnee.anneeScolaireId) {
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
                    where: { classeAnneeId: dto.classeAnneeId, actif: true },
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

            // OPTIMISATION : Charger toutes les moyennes en UNE requête batch
            const programme = await matieresService.getMatieresParNiveau(classeAnnee.classe.niveauId);
            
            // CHARGEMENT des affectations matières de la classe pour les coefficients spécifiques
            const affectationRepo = AppDataSource.getRepository(AffectationMatiere);
            const affectationsClasse = await affectationRepo.find({
                where: { 
                    classeAnneeId: dto.classeAnneeId,
                    statut: StatutAffectationMatiere.ACTIVE
                }
            });
            
            // Créer un map matièreId -> coefficient de l'affectation
            const coeffAffectationMap = new Map<string, number>();
            for (const aff of affectationsClasse) {
                if (aff.coefficient !== null && aff.coefficient !== undefined) {
                    coeffAffectationMap.set(aff.matiereId, aff.coefficient);
                }
            }
            
            logger.info(`[Bulletins] ${affectationsClasse.length} affectations chargées, ${coeffAffectationMap.size} avec coefficients spécifiques`);
            
            // Préparer les clés de batch pour tous les élèves et matières
            const batchKeys = [];
            for (const eleve of eleves) {
                for (const matiereNiveau of programme) {
                    batchKeys.push({
                        eleveId: eleve.id,
                        matiereId: matiereNiveau.matiereId,
                        periodeId: periode.id,
                    });
                }
            }

            // Exécuter le batch loading (1 requête au lieu de N×M)
            const moyennesMap = await notesBatchLoaderService.batchLoadMoyennes(batchKeys);
            logger.info(`[Bulletins] Batch loading: ${batchKeys.length} combinaisons en 1 requête`);

            // Traiter chaque élève avec les données déjà chargées
            for (const eleve of eleves) {
                // Vérifier que l'élève appartient au même établissement
                if (etablissementId && eleve.etablissementId !== etablissementId) {
                    throw new AppError(`L'élève ${eleve.id} n'appartient pas à cet établissement`, 403, 'WRONG_ETABLISSEMENT');
                }

                // Calculer Moyenne Générale avec les données batchées
                let totalPoints = 0;
                let totalCoeffs = 0;

                const eleveMoyennes = moyennesMap.get(eleve.id) || new Map();

                for (const matiereNiveau of programme) {
                    const moyenneMatiere = eleveMoyennes.get(matiereNiveau.matiereId) || 0;
                    
                    // Méthode de calcul : arithmétique ou pondérée
                    // PRIORITÉ 1: Coefficient de l'affectation (spécifique à la classe/filière)
                    // PRIORITÉ 2: Coefficient de MatiereNiveau (général au niveau)
                    // PRIORITÉ 3: 1 (méthode arithmétique)
                    let coefficient = 1;
                    
                    if (params.calculationMethod === 'ponderee') {
                        coefficient = coeffAffectationMap.get(matiereNiveau.matiereId) 
                            ?? matiereNiveau.coefficient 
                            ?? 1;
                    }
                    
                    totalPoints += moyenneMatiere * coefficient;
                    totalCoeffs += coefficient;
                }

                const moyenneGenerale = totalCoeffs > 0 ? totalPoints / totalCoeffs : 0;

                // Créer ou MAJ Bulletin
                let bulletin = await this.repo.findOne({
                    where: { eleveId: eleve.id, classeAnneeId: dto.classeAnneeId, periodeId: periode.id }
                });

                if (!bulletin) {
                    bulletin = new Bulletin();
                    Object.assign(bulletin, {
                        eleveId: eleve.id,
                        classeAnneeId: dto.classeAnneeId,
                        periodeId: periode.id,
                        anneeScolaireId: classeAnnee.anneeScolaireId,
                        etablissementId,
                    });
                }

                bulletin.moyenneGenerale = parseFloat(moyenneGenerale.toFixed(2));

                await queryRunner.manager.save(bulletin);
                bulletins.push(bulletin);
            }

            // Calcul des rangs pour tous les bulletins de la classe/période (si activé)
            if (params.includeRanking) {
                await this.calculerRangs(dto.classeAnneeId, periode.id, etablissementId, queryRunner);
            }

            await queryRunner.commitTransaction();
            logger.info(`[${etablissementId}] ${bulletins.length} bulletins générés pour la classe ${classeAnnee.classe?.nom || dto.classeAnneeId}`);
            
            // NOTIFICATION : Envoyer les notifications aux parents (après commit)
            try {
                await this.envoyerNotificationsBulletins(bulletins, classeAnnee.classe, periode, etablissementId);
            } catch (error) {
                logger.warn('[Bulletins] Échec envoi notifications (non bloquant)', error);
            }
            
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
    private async calculerRangs(classeAnneeId: string, periodeId: string, etablissementId?: string, queryRunner?: any): Promise<void> {
        // Récupérer tous les bulletins de la classe pour cette période
        const where: any = { classeAnneeId, periodeId };
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

    /**
     * Statut de génération des bulletins pour le dashboard
     */
    async getGenerationStatus(context: { etablissementId?: string; periodeId?: string }): Promise<{
        total: number;
        generes: number;
        enCours: number;
        progression: number;
    }> {
        const where: any = {};
        if (context.etablissementId) where.etablissementId = context.etablissementId;
        if (context.periodeId) where.periodeId = context.periodeId;

        const total = await this.repo.count({ where });
        const generes = await this.repo.count({ where: { ...where, moyenneGenerale: MoreThan(0) } });
        const enCours = total - generes;
        const progression = total > 0 ? Math.round((generes / total) * 100) : 0;

        return { total, generes, enCours, progression };
    }

    async findByEleve(eleveId: string): Promise<Bulletin[]> {
        return this.repo.find({
            where: { eleveId },
            relations: ['periode', 'classeAnnee', 'classeAnnee.classe'],
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

    /**
     * Envoyer les notifications de bulletin disponible aux parents
     */
    private async envoyerNotificationsBulletins(
        bulletins: Bulletin[],
        classe: any,
        periode: any,
        etablissementId?: string
    ): Promise<void> {
        const eleveRepo = AppDataSource.getRepository(Eleve);
        
        // Compter le total d'élèves pour le rang
        const totalEleves = bulletins.length;
        
        for (const bulletin of bulletins) {
            try {
                // Récupérer l'élève avec son utilisateur
                const eleve = await eleveRepo.findOne({
                    where: { id: bulletin.eleveId },
                    relations: ['utilisateur'],
                });

                if (!eleve?.utilisateurId) {
                    continue;
                }

                // Trouver les responsables
                const responsables = await parentsService.getResponsablesForNotification(eleve.utilisateurId);

                if (!responsables || responsables.length === 0) {
                    continue;
                }

                // Notifier chaque responsable
                for (const resp of responsables) {
                    await notificationTemplates.bulletinDisponible({
                        destinataireId: resp.utilisateurId,
                        etablissementId,
                        metadata: {
                            bulletinId: bulletin.id,
                            eleveId: eleve.id,
                            email: resp.email, // Pour envoi email
                        },
                    }, {
                        eleveNom: `Élève ${eleve.id.substring(0, 8)}`,
                        periode: periode.nom,
                        moyenne: bulletin.moyenneGenerale || 0,
                        rang: bulletin.rang || undefined,
                        totalEleves: totalEleves,
                    });
                }

                logger.info(`[Bulletins] Notification envoyée pour élève ${eleve.id.substring(0, 8)}`);
            } catch (error) {
                logger.warn(`[Bulletins] Erreur notification bulletin ${bulletin.id}`, error);
            }
        }
    }
}

export const bulletinsService = new BulletinsService();
