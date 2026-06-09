/**
 * ==================================
 * eLISAschool - Service Gestion des Dépenses
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion complète des dépenses, demandes, bons de commande et factures
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { CategorieDepense, Depense, DemandeDepense, BonCommande, FactureFournisseur, StatutDepense, StatutDemande, StatutBonCommande, StatutFacture } from '../entities';
import { CreateCategorieDepenseDto, CreateDepenseDto, PayerDepenseDto, CreateDemandeDepenseDto, ValiderDemandeDto, CreateBonCommandeDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { notificationsService } from '@modules/notifications/services/notifications.service';
import { financeWorkflowService } from './finance-workflow.service';
import { TypeNotification, PrioriteNotification } from '@modules/notifications/entities';
import { auditService } from '@modules/auth/services/audit.service';

export class DepensesService {
    private categorieRepo: Repository<CategorieDepense>;
    private depenseRepo: Repository<Depense>;
    private demandeRepo: Repository<DemandeDepense>;
    private bonCommandeRepo: Repository<BonCommande>;
    private factureRepo: Repository<FactureFournisseur>;

    constructor() {
        this.categorieRepo = AppDataSource.getRepository(CategorieDepense);
        this.depenseRepo = AppDataSource.getRepository(Depense);
        this.demandeRepo = AppDataSource.getRepository(DemandeDepense);
        this.bonCommandeRepo = AppDataSource.getRepository(BonCommande);
        this.factureRepo = AppDataSource.getRepository(FactureFournisseur);
    }

    // ==================================
    // CATÉGORIES DE DÉPENSES
    // ==================================

    async creerCategorie(dto: CreateCategorieDepenseDto, etablissementId?: string): Promise<CategorieDepense> {
        const existant = await this.categorieRepo.findOne({
            where: { code: dto.code },
        });

        if (existant) {
            throw new AppError('Code catégorie déjà utilisé', 409, 'CATEGORIE_EXISTS');
        }

        const categorie = this.categorieRepo.create({
            etablissementId,
            code: dto.code,
            libelle: dto.libelle,
            type: dto.type as any, // Conversion pour TypeORM
            compteComptableCharge: dto.compteComptableCharge,
            compteComptableTVA: dto.compteComptableTVA,
            responsableId: dto.responsableId,
            budgetAnnuel: dto.budgetAnnuel,
        });

        await this.categorieRepo.save(categorie);
        logger.info(`[${etablissementId}] Catégorie dépense créée: ${dto.code}`);

        return categorie;
    }

    async listCategories(etablissementId?: string, type?: string): Promise<CategorieDepense[]> {
        const qb = this.categorieRepo.createQueryBuilder('c')
            .where('c.etablissementId = :etablissementId', { etablissementId })
            .andWhere('c.actif = true');

        if (type) {
            qb.andWhere('c.type = :type', { type });
        }

        return qb.orderBy('c.libelle', 'ASC').getMany();
    }

    async updateCategorie(id: string, dto: Partial<CreateCategorieDepenseDto>, userId: string): Promise<CategorieDepense> {
        const categorie = await this.categorieRepo.findOne({ where: { id } });
        if (!categorie) {
            throw new AppError('Catégorie non trouvée', 404, 'NOT_FOUND');
        }

        Object.assign(categorie, dto);
        await this.categorieRepo.save(categorie);

        return categorie;
    }

    // ==================================
    // DÉPENSES
    // ==================================

    async creerDepense(dto: CreateDepenseDto, userId: string, etablissementId?: string): Promise<Depense> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Générer numéro de pièce
            const annee = new Date().getFullYear();
            const count = await queryRunner.manager.count(Depense, {
                where: { exerciceComptable: annee },
            });
            const numeroPiece = `DEP-${annee}-${String(count + 1).padStart(5, '0')}`;

            // Calculer montant TTC
            const montantHT = dto.montantHT;
            const tva = dto.tva || 19.25;
            const montantTTC = Math.round(montantHT * (1 + tva / 100) * 100) / 100;

            const now = new Date();
            const depense = queryRunner.manager.create(Depense, {
                ...dto,
                numeroPiece,
                montantHT,
                tva,
                montantTTC,
                montantPaye: 0,
                dateFacture: new Date(dto.dateFacture),
                dateEcheance: dto.dateEcheance ? new Date(dto.dateEcheance) : undefined,
                statut: StatutDepense.BROUILLON,
                effectuePar: userId,
                exerciceComptable: now.getFullYear(),
                periodeComptable: now.getMonth() + 1,
                etablissementId,
            });

            await queryRunner.manager.save(Depense, depense);
            await queryRunner.commitTransaction();

            logger.info(`[${etablissementId}] Dépense créée: ${numeroPiece} - ${montantTTC} FCFA`);

            // Audit - Création dépense
            await auditService.logCRUD(
                'CREATE',
                'Depense',
                userId,
                depense.id,
                undefined,
                {
                    numeroPiece,
                    libelle: dto.libelle,
                    montantHT: dto.montantHT,
                    montantTTC: montantTTC,
                    categorieDepenseId: dto.categorieDepenseId,
                    fournisseur: dto.fournisseur,
                    dateFacture: dto.dateFacture,
                }
            );

            return await this.depenseRepo.findOne({
                where: { id: depense.id },
                relations: ['categorieDepense'],
            }) as Depense;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async validerDepense(
        depenseId: string,
        userId: string,
        utilisateurRole: string,
        etablissementId?: string
    ): Promise<Depense> {
        const depense = await this.depenseRepo.findOne({
            where: { id: depenseId, etablissementId },
        });

        if (!depense) {
            throw new AppError('Dépense non trouvée', 404, 'NOT_FOUND');
        }

        if (depense.statut !== StatutDepense.BROUILLON && depense.statut !== StatutDepense.EN_COURS_VALIDATION) {
            throw new AppError('Cette dépense ne peut pas être validée', 400, 'STATUT_INVALID');
        }

        // Intégration workflow multi-niveau
        const workflowResult = await financeWorkflowService.valider({
            entityId: depenseId,
            entityType: 'DEPENSE',
            montant: Number(depense.montantTTC),
            etablissementId: etablissementId || '',
            utilisateurId: userId,
            utilisateurRole,
        });

        // Mettre à jour le statut selon le résultat du workflow
        if (workflowResult.statut === 'EN_COURS') {
            depense.statut = StatutDepense.EN_COURS_VALIDATION;
            depense.niveauValidation = workflowResult.niveauActuel;
        } else if (workflowResult.statut === 'VALIDE') {
            depense.statut = StatutDepense.VALIDEE;
            depense.niveauValidation = workflowResult.niveauActuel;
        }

        depense.validePar = userId;
        await this.depenseRepo.save(depense);

        logger.info(`[${etablissementId}] Dépense validée niveau ${workflowResult.niveauActuel}: ${depense.numeroPiece}`);

        // Audit - Validation dépense avec workflow
        await auditService.log(
            {
                utilisateurId: userId,
                action: 'UPDATE' as any,
                cible: 'Depense',
                cibleId: depenseId,
                description: `Dépense validée niveau ${workflowResult.niveauActuel}/${workflowResult.niveauRequis} - Statut: ${workflowResult.statut}`,
                nouvellesValeurs: {
                    statut: depense.statut,
                    niveauValidation: workflowResult.niveauActuel,
                    montantTTC: depense.montantTTC,
                },
                module: 'finances',
            }
        );

        // Notifications
        try {
            // Notification au demandeur
            await notificationsService.create({
                destinataireId: depense.demandeePar || userId,
                titre: workflowResult.statut === 'VALIDE' ? '✅ Dépense validée' : '⏳ Validation en cours',
                contenu: workflowResult.statut === 'VALIDE'
                    ? `Votre demande de dépense ${depense.numeroPiece} a été entièrement validée.`
                    : `Votre demande de dépense ${depense.numeroPiece} est en cours de validation. Niveau ${workflowResult.niveauActuel}/${workflowResult.niveauRequis}.`,
                type: TypeNotification.IN_APP,
                priorite: PrioriteNotification.HAUTE,
                categorie: 'FINANCES',
                metadata: {
                    depenseId: depense.id,
                    numeroPiece: depense.numeroPiece,
                    montant: depense.montantTTC,
                    workflowResult,
                },
            }, userId);

            // Notification au prochain validateur si validation en cours
            if (workflowResult.statut === 'EN_COURS' && workflowResult.prochainesActions.length > 0) {
                const rolesRequis = financeWorkflowService.getRolesRequisPourMontant(
                    Number(depense.montantTTC),
                    'DEPENSE'
                );
                
                // TODO: Envoyer notification aux utilisateurs avec ces rôles
                logger.info(`[Workflow] Prochains validateurs requis: ${rolesRequis.join(', ')}`);
            }
        } catch (notifError) {
            logger.error('[Dépenses] Erreur notification validation:', notifError);
        }

        return depense;
    }

    async payerDepense(depenseId: string, dto: PayerDepenseDto, userId: string, etablissementId?: string): Promise<Depense> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const depense = await queryRunner.manager.findOne(Depense, {
                where: { id: depenseId, etablissementId },
            });

            if (!depense) {
                throw new AppError('Dépense non trouvée', 404, 'NOT_FOUND');
            }

            if (depense.statut !== StatutDepense.VALIDEE && depense.statut !== StatutDepense.PARTIELLEMENT_PAYEE) {
                throw new AppError('La dépense doit être validée avant paiement', 400, 'STATUT_INVALID');
            }

            const resteDû = Number(depense.montantTTC) - Number(depense.montantPaye);
            if (dto.montantPaye > resteDû) {
                throw new AppError(`Montant exceeds le reste dû (${resteDû} FCFA)`, 400, 'MONTANT_INVALID');
            }

            depense.montantPaye = Number(depense.montantPaye) + dto.montantPaye;
            depense.methodePaiement = dto.methodePaiement;
            depense.referenceTransaction = dto.referenceTransaction || depense.referenceTransaction;
            depense.datePaiement = dto.datePaiement ? new Date(dto.datePaiement) : new Date();

            // Mettre à jour le statut
            if (Number(depense.montantPaye) >= Number(depense.montantTTC)) {
                depense.statut = StatutDepense.PAYEE;
            } else {
                depense.statut = StatutDepense.PARTIELLEMENT_PAYEE;
            }

            await queryRunner.manager.save(Depense, depense);
            await queryRunner.commitTransaction();

            logger.info(`[${etablissementId}] Paiement dépense: ${depense.numeroPiece} - ${dto.montantPaye} FCFA`);

            // Audit - Paiement dépense
            await auditService.logCRUD(
                'UPDATE',
                'Depense',
                userId,
                depenseId,
                {
                    statut: depense.statut,
                    montantPaye: Number(depense.montantPaye) - dto.montantPaye,
                },
                {
                    statut: depense.statut,
                    montantPaye: depense.montantPaye,
                    methodePaiement: dto.methodePaiement,
                    referenceTransaction: dto.referenceTransaction,
                }
            );

            // Notification de confirmation de paiement
            try {
                const estPayee = Number(depense.montantPaye) >= Number(depense.montantTTC);
                await notificationsService.create({
                    destinataireId: depense.demandeePar || userId,
                    titre: estPayee ? '✅ Dépense entièrement payée' : '💰 Paiement partiel enregistré',
                    contenu: estPayee
                        ? `La dépense ${depense.numeroPiece} (${depense.montantTTC.toLocaleString()} FCFA) a été entièrement payée.`
                        : `Paiement de ${dto.montantPaye.toLocaleString()} FCFA enregistré pour ${depense.numeroPiece}. Reste: ${(Number(depense.montantTTC) - Number(depense.montantPaye)).toLocaleString()} FCFA`,
                    type: TypeNotification.IN_APP,
                    priorite: PrioriteNotification.HAUTE,
                    categorie: 'FINANCES',
                    metadata: {
                        depenseId: depense.id,
                        numeroPiece: depense.numeroPiece,
                        montantPaye: dto.montantPaye,
                        resteDû: Number(depense.montantTTC) - Number(depense.montantPaye),
                        statut: depense.statut,
                    },
                }, userId);
            } catch (notifError) {
                logger.error('[Dépenses] Erreur notification paiement:', notifError);
            }

            return depense;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getDepenses(filters: any, etablissementId?: string): Promise<{ data: Depense[]; total: number }> {
        const qb = this.depenseRepo.createQueryBuilder('d')
            .leftJoinAndSelect('d.categorieDepense', 'c')
            .where('d.etablissementId = :etablissementId', { etablissementId });

        if (filters.categorieDepenseId) {
            qb.andWhere('d.categorieDepenseId = :categorieId', { categorieId: filters.categorieDepenseId });
        }
        if (filters.dateDebut) {
            qb.andWhere('d.dateFacture >= :dateDebut', { dateDebut: filters.dateDebut });
        }
        if (filters.dateFin) {
            qb.andWhere('d.dateFacture <= :dateFin', { dateFin: filters.dateFin });
        }
        if (filters.statut) {
            qb.andWhere('d.statut = :statut', { statut: filters.statut });
        }
        if (filters.fournisseur) {
            qb.andWhere('d.fournisseur ILIKE :fournisseur', { fournisseur: `%${filters.fournisseur}%` });
        }

        const total = await qb.getCount();
        const data = await qb
            .orderBy('d.dateFacture', 'DESC')
            .skip((filters.page - 1) * filters.limit)
            .take(filters.limit)
            .getMany();

        return { data, total };
    }

    // ==================================
    // DEMANDES DE DÉPENSES
    // ==================================

    async creerDemandeDepense(dto: CreateDemandeDepenseDto, userId: string, etablissementId?: string): Promise<DemandeDepense> {
        const demande = this.demandeRepo.create({
            demandeurId: userId,
            etablissementId,
            libelle: dto.libelle,
            montantEstime: dto.montantEstime,
            urgence: dto.urgence as any, // Conversion pour TypeORM
            categorieDepenseId: dto.categorieDepenseId,
            justification: dto.justification,
            statut: 'BROUILLON' as any,
        });

        await this.demandeRepo.save(demande);
        logger.info(`[${etablissementId}] Demande de dépense créée par ${userId}`);

        return demande;
    }

    async soumettreDemande(demandeId: string, userId: string): Promise<DemandeDepense> {
        const demande = await this.demandeRepo.findOne({ where: { id: demandeId, demandeurId: userId } });
        if (!demande) {
            throw new AppError('Demande non trouvée', 404, 'NOT_FOUND');
        }

        demande.statut = StatutDemande.SOUMISE;
        await this.demandeRepo.save(demande);

        return demande;
    }

    async validerDemande(demandeId: string, dto: ValiderDemandeDto, validateurId: string, etablissementId?: string): Promise<any> {
        const demande = await this.demandeRepo.findOne({
            where: { id: demandeId, etablissementId },
        });

        if (!demande) {
            throw new AppError('Demande non trouvée', 404, 'NOT_FOUND');
        }

        if (demande.statut !== StatutDemande.SOUMISE) {
            throw new AppError('Seules les demandes soumises peuvent être validées', 400, 'STATUT_INVALID');
        }

        demande.validePar = validateurId;
        demande.dateValidation = new Date();

        if (dto.decision === 'APPROUVEE') {
            demande.statut = StatutDemande.APPROUVEE;

            // Créer automatiquement la dépense
            const depense = await this.creerDepense({
                categorieDepenseId: demande.categorieDepenseId,
                libelle: demande.libelle,
                montantHT: demande.montantEstime,
                tva: 19.25,
                dateFacture: new Date().toISOString().split('T')[0],
                fournisseur: 'À définir',
                methodePaiement: 'ESPECES',
            }, validateurId, etablissementId);

            demande.depenseId = depense.id;
        } else {
            demande.statut = StatutDemande.REJETEE;
            demande.motifRejet = dto.motifRejet || 'Non spécifié';
        }

        await this.demandeRepo.save(demande);

        logger.info(`[${etablissementId}] Demande ${dto.decision}: ${demandeId}`);

        return demande;
    }

    async getDemandesAValider(etablissementId?: string): Promise<DemandeDepense[]> {
        return this.demandeRepo.find({
            where: { statut: StatutDemande.SOUMISE, etablissementId },
            order: { createdAt: 'DESC' },
            relations: ['categorieDepense'],
        });
    }

    // ==================================
    // BONS DE COMMANDE
    // ==================================

    async creerBonCommande(dto: CreateBonCommandeDto, userId: string, etablissementId?: string): Promise<BonCommande> {
        const annee = new Date().getFullYear();
        const count = await this.bonCommandeRepo.count({
            where: { createdAt: new Date() },
        });
        const numeroBon = `BC-${annee}-${String(count + 1).padStart(5, '0')}`;

        const montantTotal = dto.articles.reduce((sum, art) => sum + art.montantTotal, 0);

        const bonCommande = this.bonCommandeRepo.create({
            ...dto,
            numeroBon,
            demandeurId: userId,
            dateCommande: new Date(dto.dateCommande),
            dateLivraisonPrevue: dto.dateLivraisonPrevue ? new Date(dto.dateLivraisonPrevue) : undefined,
            montantTotal,
            etablissementId,
        });

        await this.bonCommandeRepo.save(bonCommande);
        logger.info(`[${etablissementId}] Bon de commande créé: ${numeroBon}`);

        return bonCommande;
    }

    // ==================================
    // RAPPORTS
    // ==================================

    async getRapportDepenses(dateDebut: string, dateFin: string, etablissementId?: string): Promise<any> {
        const qb = this.depenseRepo.createQueryBuilder('d')
            .select('c.libelle', 'categorie')
            .addSelect('SUM(d.montantTTC)', 'total')
            .addSelect('COUNT(d.id)', 'nombre')
            .leftJoin('d.categorieDepense', 'c')
            .where('d.etablissementId = :etablissementId', { etablissementId })
            .andWhere('d.dateFacture BETWEEN :dateDebut AND :dateFin', { dateDebut, dateFin })
            .andWhere('d.statut IN (:...statuts)', { statuts: [StatutDepense.VALIDEE, StatutDepense.PAYEE, StatutDepense.PARTIELLEMENT_PAYEE] })
            .groupBy('c.libelle')
            .orderBy('total', 'DESC');

        const parCategorie = await qb.getRawMany();

        const totalGeneral = await this.depenseRepo
            .createQueryBuilder('d')
            .select('SUM(d.montantTTC)', 'total')
            .where('d.etablissementId = :etablissementId', { etablissementId })
            .andWhere('d.dateFacture BETWEEN :dateDebut AND :dateFin', { dateDebut, dateFin })
            .andWhere('d.statut IN (:...statuts)', { statuts: [StatutDepense.VALIDEE, StatutDepense.PAYEE, StatutDepense.PARTIELLEMENT_PAYEE] })
            .getRawOne();

        return {
            parCategorie,
            totalGeneral: totalGeneral.total || 0,
            periode: { dateDebut, dateFin },
        };
    }
}

// Singleton exporté
export const depensesService = new DepensesService();
