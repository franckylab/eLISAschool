/**
 * ==================================
 * eLISAschool - Service Scolarité et Paiements
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Gestion complète des frais de scolarité, échéanciers, paiements et relances
 */

import { Repository, In, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { FraisScolarite, Echeancier, Paiement, RecuPaiement, RelancePaiement, Remise, TypeRemise } from '../entities';
import { CreateFraisScolariteDto, CreatePaiementDto, GenerateEcheancierDto, CreateRemiseDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Eleve } from '@modules/eleves/entities';
import { StatutPaiement, TypePaiement } from '@shared/enums/statuts.enum';
import { notificationsService } from '@modules/notifications/services/notifications.service';
import { financeWorkflowService } from './finance-workflow.service';
import { TypeNotification, PrioriteNotification } from '@modules/notifications/entities';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

export class ScolariteService {
    private fraisRepo: Repository<FraisScolarite>;
    private echeancierRepo: Repository<Echeancier>;
    private paiementRepo: Repository<Paiement>;
    private recuRepo: Repository<RecuPaiement>;
    private relanceRepo: Repository<RelancePaiement>;
    private remiseRepo: Repository<Remise>;
    private eleveRepo: Repository<Eleve>;

    constructor() {
        this.fraisRepo = AppDataSource.getRepository(FraisScolarite);
        this.echeancierRepo = AppDataSource.getRepository(Echeancier);
        this.paiementRepo = AppDataSource.getRepository(Paiement);
        this.recuRepo = AppDataSource.getRepository(RecuPaiement);
        this.relanceRepo = AppDataSource.getRepository(RelancePaiement);
        this.remiseRepo = AppDataSource.getRepository(Remise);
        this.eleveRepo = AppDataSource.getRepository(Eleve);
    }

    // ==================================
    // FRAIS DE SCOLARITÉ
    // ==================================

    /**
     * Configurer les frais de scolarité pour une année/niveau
     */
    async configurerFraisScolarite(dto: CreateFraisScolariteDto, etablissementId?: string): Promise<FraisScolarite> {
        // Vérifier si la config existe déjà
        const existant = await this.fraisRepo.findOne({
            where: {
                etablissementId: etablissementId,
                anneeScolaireId: dto.anneeScolaireId,
                niveauId: dto.niveauId,
            },
        });

        if (existant) {
            throw new AppError('Configuration des frais déjà existante pour ce niveau et cette année', 409, 'FRAIS_EXISTS');
        }

        const frais = this.fraisRepo.create({
            ...dto,
            etablissementId,
            datePremiereEcheance: new Date(dto.datePremiereEcheance),
        });

        await this.fraisRepo.save(frais);
        logger.info(`[${etablissementId}] Frais de scolarité configurés pour niveau ${dto.niveauId}`);

        // Audit
        await auditService.logCRUD(
            'CREATE',
            'FraisScolarite',
            'SYSTEM',
            frais.id,
            undefined,
            {
                niveauId: dto.niveauId,
                anneeScolaireId: dto.anneeScolaireId,
                fraisScolariteAnnuel: dto.fraisScolariteAnnuel,
                nombreTranches: dto.nombreTranches,
            }
        );

        return frais;
    }

    /**
     * Récupérer les frais de scolarité
     */
    async getFraisScolarite(etablissementId?: string, anneeScolaireId?: string): Promise<FraisScolarite[]> {
        const qb = this.fraisRepo.createQueryBuilder('f')
            .leftJoinAndSelect('f.niveau', 'n')
            .leftJoinAndSelect('f.anneeScolaire', 'a')
            .where('f.etablissementId = :etablissementId', { etablissementId });

        if (anneeScolaireId) {
            qb.andWhere('f.anneeScolaireId = :anneeScolaireId', { anneeScolaireId });
        }

        return qb.orderBy('n.libelle', 'ASC').getMany();
    }

    // ==================================
    // ÉCHÉANCIER
    // ==================================

    /**
     * Générer l'échéancier de paiement pour un élève
     */
    async genererEcheancier(dto: GenerateEcheancierDto, etablissementId?: string): Promise<Echeancier[]> {
        const eleve = await this.eleveRepo.findOne({
            where: { id: dto.eleveId },
            relations: ['classe'],
        });

        if (!eleve) {
            throw new AppError('Élève non trouvé', 404, 'NOT_FOUND');
        }

        // Récupérer les frais applicables (simplifié - besoin d'une année scolaire)
        const frais = await this.fraisRepo.findOne({
            where: {
                etablissementId,
                // TODO: Ajouter annéeScolaireId dans Eleve ou récupérer depuis inscription
            },
            order: { createdAt: 'DESC' }
        });

        if (!frais) {
            throw new AppError('Aucune configuration de frais trouvée pour ce niveau', 404, 'FRAIS_NOT_FOUND');
        }

        // Vérifier si l'échéancier existe déjà
        const existant = await this.echeancierRepo.findOne({
            where: { eleveId: dto.eleveId, fraisScolariteId: frais.id },
        });

        if (existant) {
            throw new AppError('Échéancier déjà généré pour cet élève', 409, 'ECHEANCIER_EXISTS');
        }

        // Calculer le montant total
        const montantTotal = Number(frais.fraisScolariteAnnuel) + Number(frais.fraisInscription) + Number(frais.autresFrais);

        // Générer les tranches
        const echeanciers: Echeancier[] = [];
        const datePremiere = new Date(frais.datePremiereEcheance);
        const nombreTranches = frais.nombreTranches;
        const montantParTranche = Math.round(montantTotal / nombreTranches * 100) / 100;

        for (let i = 1; i <= nombreTranches; i++) {
            const dateEcheance = new Date(datePremiere);

            // Calculer la date selon la fréquence
            switch (frais.frequenceEcheance) {
                case 'mensuel':
                    dateEcheance.setMonth(datePremiere.getMonth() + (i - 1));
                    break;
                case 'trimestriel':
                    dateEcheance.setMonth(datePremiere.getMonth() + (i - 1) * 3);
                    break;
                case 'annuel':
                    dateEcheance.setFullYear(datePremiere.getFullYear() + (i - 1));
                    break;
            }

            const echeancier = this.echeancierRepo.create({
                eleveId: dto.eleveId,
                fraisScolariteId: frais.id,
                numeroTranche: i,
                montantAttendu: montantParTranche,
                dateEcheance,
                montantPaye: 0,
                statut: StatutPaiement.EN_ATTENTE,
                etablissementId,
            });

            echeanciers.push(echeancier);
        }

        await this.echeancierRepo.save(echeanciers);
        logger.info(`[${etablissementId}] Échéancier généré pour élève ${dto.eleveId} - ${nombreTranches} tranches`);

        return echeanciers;
    }

    /**
     * Récupérer l'échéancier d'un élève
     */
    async getEcheancierEleve(eleveId: string, etablissementId?: string): Promise<Echeancier[]> {
        return this.echeancierRepo.find({
            where: { eleveId, etablissementId },
            order: { numeroTranche: 'ASC' },
        });
    }

    /**
     * Trouver les frais de scolarité applicables pour un élève
     * Algorithme de priorité : section > classe > niveau > cycle > établissement
     */
    async trouverFraisScolarite(
        eleveId: string,
        anneeScolaireId: string,
        classeId: string,
        niveauId: string,
        cycleId: string,
        sectionId: string,
        etablissementId?: string
    ): Promise<FraisScolarite> {
        const cibleEtablissementId = etablissementId || '';

        logger.info(`[Finances] Recherche frais pour élève ${eleveId} - Section: ${sectionId}, Classe: ${classeId}, Niveau: ${niveauId}, Cycle: ${cycleId}`);

        // PRIORITÉ 1 : Frais par SECTION (plus spécifique)
        if (sectionId) {
            const fraisSection = await this.fraisRepo.findOne({
                where: {
                    etablissementId: cibleEtablissementId,
                    anneeScolaireId,
                    sectionId,
                },
                relations: ['section', 'classe', 'niveau', 'cycle'],
            });

            if (fraisSection) {
                logger.info(`[Finances] Frais trouvés par SECTION: ${fraisSection.id}`);
                return fraisSection;
            }
        }

        // PRIORITÉ 2 : Frais par classe
        if (classeId) {
            const fraisClasse = await this.fraisRepo.findOne({
                where: {
                    etablissementId: cibleEtablissementId,
                    anneeScolaireId,
                    niveauId,
                    classeId,
                    sectionId: IsNull(),
                },
                relations: ['classe', 'niveau', 'cycle'],
            });

            if (fraisClasse) {
                logger.info(`[Finances] Frais trouvés par CLASSE: ${fraisClasse.id}`);
                return fraisClasse;
            }
        }

        // PRIORITÉ 3 : Frais par niveau
        const fraisNiveau = await this.fraisRepo.findOne({
            where: {
                etablissementId: cibleEtablissementId,
                anneeScolaireId,
                niveauId,
                classeId: IsNull(), // Frais génériques du niveau
                sectionId: IsNull(),
            },
            relations: ['niveau', 'cycle'],
        });

        if (fraisNiveau) {
            logger.info(`[Finances] Frais trouvés par NIVEAU: ${fraisNiveau.id}`);
            return fraisNiveau;
        }

        // PRIORITÉ 4 : Frais par cycle
        if (cycleId) {
            const fraisCycle = await this.fraisRepo.findOne({
                where: {
                    etablissementId: cibleEtablissementId,
                    anneeScolaireId,
                    cycleId,
                    niveauId: IsNull(), // Frais génériques du cycle
                    sectionId: IsNull(),
                },
                relations: ['cycle'],
            });

            if (fraisCycle) {
                logger.info(`[Finances] Frais trouvés par CYCLE: ${fraisCycle.id}`);
                return fraisCycle;
            }
        }

        // PRIORITÉ 5 : Frais par établissement (fallback - le moins spécifique)
        const fraisEtablissement = await this.fraisRepo.findOne({
            where: {
                etablissementId: cibleEtablissementId,
                anneeScolaireId,
                niveauId: IsNull(),
                classeId: IsNull(),
                cycleId: IsNull(),
                sectionId: IsNull(),
            },
        });

        if (fraisEtablissement) {
            logger.info(`[Finances] Frais trouvés par ÉTABLISSEMENT: ${fraisEtablissement.id}`);
            return fraisEtablissement;
        }

        // Aucun frais configuré
        throw new AppError(
            `Aucun frais de scolarité configuré pour l'élève ${eleveId} (Année: ${anneeScolaireId})`,
            404,
            'FRAIS_NON_CONFIGURES'
        );
    }

    // ==================================
    // PAIEMENTS
    // ==================================

    /**
     * Enregistrer un paiement
     */
    async enregistrerPaiement(dto: CreatePaiementDto, userId: string, etablissementId?: string): Promise<Paiement> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Récupérer l'échéancier si fourni
            let echeancier: Echeancier | null = null;
            let penalite = 0;

            if (dto.echeancierId) {
                echeancier = await queryRunner.manager.findOne(Echeancier, {
                    where: { id: dto.echeancierId, etablissementId },
                    relations: ['fraisScolarite'],
                });

                if (!echeancier) {
                    throw new AppError('Échéancier non trouvé', 404, 'NOT_FOUND');
                }

                if (echeancier.statut === StatutPaiement.PAYE) {
                    throw new AppError('Cette tranche est déjà payée', 400, 'ECHEANCIER_PAYE');
                }

                // Calculer pénalité si retard
                const now = new Date();
                const dateEcheance = new Date(echeancier.dateEcheance);
                const frais = echeancier.fraisScolarite;

                if (now > dateEcheance && frais) {
                    const joursRetard = Math.floor((now.getTime() - dateEcheance.getTime()) / (1000 * 60 * 60 * 24));
                    if (joursRetard > Number(frais.joursGrace)) {
                        penalite = Math.round(Number(echeancier.montantAttendu) * Number(frais.penaliteRetard) / 100 * 100) / 100;
                    }
                }
            }

            // Calculer montant total
            const montantTotal = dto.montant + penalite;

            // Générer numéro de reçu
            const annee = new Date().getFullYear();
            const count = await queryRunner.manager.count(Paiement, {
                where: { etablissementId, datePaiement: In([new Date()]) },
            });
            const numeroRecu = `REC-${annee}-${String(count + 1).padStart(5, '0')}`;

            // Créer le paiement
            const paiement = queryRunner.manager.create(Paiement, {
                ...dto,
                montantPenalite: penalite,
                montantTotal,
                numeroRecu,
                typePaiement: TypePaiement.SCOLARITE,
                datePaiement: dto.datePaiement ? new Date(dto.datePaiement) : new Date(),
                effectuePar: userId,
                statut: StatutPaiement.PAYE,
                etablissementId,
            });

            await queryRunner.manager.save(Paiement, paiement);

            // Mettre à jour l'échéancier si fourni
            if (echeancier) {
                echeancier.montantPaye = Number(echeancier.montantPaye) + dto.montant;
                echeancier.datePaiementReel = new Date();

                if (penalite > 0) {
                    echeancier.penaliteAppliquee = (Number(echeancier.penaliteAppliquee || 0) + penalite);
                }

                // Vérifier si entièrement payé
                if (Number(echeancier.montantPaye) >= Number(echeancier.montantAttendu)) {
                    echeancier.statut = StatutPaiement.PAYE;
                } else {
                    echeancier.statut = StatutPaiement.PARTIELLEMENT_PAYE;
                }

                await queryRunner.manager.save(Echeancier, echeancier);
            }

            // Générer le reçu
            const eleve = await queryRunner.manager.findOne(Eleve, {
                where: { id: dto.eleveId },
            });

            if (eleve) {
                const recu = queryRunner.manager.create(RecuPaiement, {
                    paiementId: paiement.id,
                    numeroRecu,
                    dateEmission: new Date(),
                    eleveNom: `Élève ${eleve.matricule}`,
                    eleveMatricule: eleve.matricule,
                    classeNom: 'N/A', // TODO: Récupérer depuis inscription
                    montant: montantTotal,
                    methodePaiement: dto.methodePaiement,
                    objet: echeancier ? `Paiement tranche ${echeancier.numeroTranche}/${echeancier.fraisScolarite?.nombreTranches} - Scolarité` : 'Paiement scolarité',
                    genererPar: userId,
                    etablissementId,
                });

                await queryRunner.manager.save(RecuPaiement, recu);
            }

            await queryRunner.commitTransaction();

            logger.info(`[${etablissementId}] Paiement enregistré: ${montantTotal} FCFA - Reçu ${numeroRecu}`);

            // Audit - Opération financière critique
            await auditService.logCRUD(
                'CREATE',
                'Paiement',
                userId,
                paiement.id,
                undefined,
                {
                    eleveId: dto.eleveId,
                    montant: dto.montant,
                    montantTotal,
                    montantPenalite: penalite,
                    methodePaiement: dto.methodePaiement,
                    numeroRecu,
                    echeancierId: dto.echeancierId,
                }
            );

            // Envoyer notification de confirmation de paiement
            try {
                await notificationsService.create({
                    destinataireId: eleve?.id || dto.eleveId,
                    titre: '✅ Paiement reçu',
                    contenu: `Votre paiement de ${montantTotal.toLocaleString()} FCFA a été enregistré. Reçu: ${numeroRecu}`,
                    type: TypeNotification.IN_APP,
                    priorite: PrioriteNotification.HAUTE,
                    categorie: 'FINANCES',
                    metadata: {
                        paiementId: paiement.id,
                        montant: montantTotal,
                        numeroRecu,
                        methodePaiement: dto.methodePaiement,
                    },
                }, userId);

                // Notification SMS si montant important
                if (montantTotal >= 100000) {
                    await notificationsService.create({
                        destinataireId: eleve?.id || dto.eleveId,
                        titre: 'Paiement scolarité',
                        contenu: `Reçu ${numeroRecu}: ${montantTotal.toLocaleString()} FCFA`,
                        type: TypeNotification.SMS,
                        priorite: PrioriteNotification.HAUTE,
                        categorie: 'FINANCES',
                    }, userId);
                }
            } catch (notifError) {
                logger.error('[Scolarité] Erreur envoi notification:', notifError);
                // Ne pas bloquer le paiement si notification échoue
            }

            // Retourner le paiement avec relations
            return await this.paiementRepo.findOne({
                where: { id: paiement.id },
                relations: ['eleve', 'echeancier'],
            }) as Paiement;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Récupérer l'historique des paiements d'un élève
     */
    async getHistoriquePaiements(eleveId: string, etablissementId?: string): Promise<Paiement[]> {
        return this.paiementRepo.find({
            where: { eleveId, etablissementId },
            order: { datePaiement: 'DESC' },
            relations: ['echeancier'],
        });
    }

    /**
     * Récupérer un reçu par son numéro
     */
    async getRecu(numeroRecu: string): Promise<RecuPaiement | null> {
        return this.recuRepo.findOne({
            where: { numeroRecu },
            relations: ['paiement'],
        });
    }

    // ==================================
    // REMISES
    // ==================================

    /**
     * Attribuer une remise à un élève
     */
    async appliquerRemise(dto: CreateRemiseDto, userId: string, etablissementId?: string): Promise<Remise> {
        const remise = this.remiseRepo.create({
            eleveId: dto.eleveId,
            fraisScolariteId: dto.fraisScolariteId,
            typeRemise: dto.typeRemise as any, // Conversion pour TypeORM
            pourcentage: dto.pourcentage,
            montant: dto.montant,
            motif: dto.motif,
            validePar: userId,
            dateAttribution: new Date(),
            etablissementId,
        });

        await this.remiseRepo.save(remise);
        logger.info(`[${etablissementId}] Remise ${dto.typeRemise} attribuée à élève ${dto.eleveId}`);

        // Audit
        await auditService.logCRUD(
            'CREATE',
            'Remise',
            userId,
            remise.id,
            undefined,
            {
                eleveId: dto.eleveId,
                typeRemise: dto.typeRemise,
                pourcentage: dto.pourcentage,
                montant: dto.montant,
                motif: dto.motif,
            }
        );

        return remise;
    }

    /**
     * Trouver les remises applicables pour un élève selon le scope
     * @returns Tableau de toutes les remises applicables
     */
    async trouverRemisesApplicables(
        eleveId: string,
        classeId: string,
        niveauId: string,
        cycleId: string,
        sectionId: string,
        etablissementId: string
    ): Promise<Remise[]> {
        const remisesApplicables: Remise[] = [];

        logger.info(`[Finances] Recherche remises pour élève ${eleveId} - Section: ${sectionId}, Classe: ${classeId}, Niveau: ${niveauId}, Cycle: ${cycleId}`);

        // 1. Remises par ÉLÈVE (scope ELEVE)
        const remisesEleve = await this.remiseRepo.find({
            where: {
                eleveId,
                scopeRemise: 'ELEVE' as any,
                etablissementId,
            },
            relations: ['fraisScolarite'],
        });

        if (remisesEleve.length > 0) {
            logger.info(`[Finances] ${remisesEleve.length} remise(s) trouvée(s) par ÉLÈVE`);
            remisesApplicables.push(...remisesEleve);
        }

        // 2. Remises par SECTION (scope SECTION)
        if (sectionId) {
            const remisesSection = await this.remiseRepo.find({
                where: {
                    sectionId,
                    scopeRemise: 'SECTION' as any,
                    etablissementId,
                    eleveId: IsNull(),
                },
                relations: ['fraisScolarite'],
            });

            if (remisesSection.length > 0) {
                logger.info(`[Finances] ${remisesSection.length} remise(s) trouvée(s) par SECTION`);
                remisesApplicables.push(...remisesSection);
            }
        }

        // 3. Remises par CLASSE (scope CLASSE)
        if (classeId) {
            const remisesClasse = await this.remiseRepo.find({
                where: {
                    classeId,
                    scopeRemise: 'CLASSE' as any,
                    etablissementId,
                    eleveId: IsNull(),
                },
                relations: ['fraisScolarite'],
            });

            if (remisesClasse.length > 0) {
                logger.info(`[Finances] ${remisesClasse.length} remise(s) trouvée(s) par CLASSE`);
                remisesApplicables.push(...remisesClasse);
            }
        }

        // 4. Remises par NIVEAU (scope NIVEAU)
        const remisesNiveau = await this.remiseRepo.find({
            where: {
                scopeRemise: 'NIVEAU' as any,
                etablissementId,
                eleveId: IsNull(),
                classeId: IsNull(),
            },
            relations: ['fraisScolarite'],
        });

        if (remisesNiveau.length > 0) {
            logger.info(`[Finances] ${remisesNiveau.length} remise(s) trouvée(s) par NIVEAU`);
            remisesApplicables.push(...remisesNiveau);
        }

        // 5. Remises par CYCLE (scope CYCLE)
        if (cycleId) {
            const remisesCycle = await this.remiseRepo.find({
                where: {
                    cycleId,
                    scopeRemise: 'CYCLE' as any,
                    etablissementId,
                    eleveId: IsNull(),
                    classeId: IsNull(),
                },
                relations: ['fraisScolarite'],
            });

            if (remisesCycle.length > 0) {
                logger.info(`[Finances] ${remisesCycle.length} remise(s) trouvée(s) par CYCLE`);
                remisesApplicables.push(...remisesCycle);
            }
        }

        // 6. Remises par ÉTABLISSEMENT (scope ETABLISSEMENT)
        const remisesEtablissement = await this.remiseRepo.find({
            where: {
                scopeRemise: 'ETABLISSEMENT' as any,
                etablissementId,
                eleveId: IsNull(),
                classeId: IsNull(),
                cycleId: IsNull(),
            },
            relations: ['fraisScolarite'],
        });

        if (remisesEtablissement.length > 0) {
            logger.info(`[Finances] ${remisesEtablissement.length} remise(s) trouvée(s) par ÉTABLISSEMENT`);
            remisesApplicables.push(...remisesEtablissement);
        }

        logger.info(`[Finances] Total: ${remisesApplicables.length} remise(s) applicable(s) pour élève ${eleveId}`);
        return remisesApplicables;
    }

    /**
     * Détecter automatiquement la fratrie d'un élève
     * Retourne tous les élèves partageant les mêmes parents
     */
    async detecterFratrie(eleveId: string, etablissementId?: string): Promise<Eleve[]> {
        // Récupérer l'élève de référence
        const eleveRef = await this.eleveRepo.findOne({
            where: { id: eleveId, etablissementId },
        });

        if (!eleveRef) {
            throw new AppError('Élève non trouvé', 404, 'NOT_FOUND');
        }

        // Chercher les élèves avec mêmes noms de parents
        // Critère: nomPere ET nomMere identiques OU nomTuteur identique
        const qb = this.eleveRepo.createQueryBuilder('e')
            .where('e.id != :eleveId', { eleveId })
            .andWhere('e.etablissementId = :etablissementId', { etablissementId })
            .andWhere(
                '('
                + '(e.nomPere IS NOT NULL AND e.nomPere = :nomPere AND e.nomMere IS NOT NULL AND e.nomMere = :nomMere)'
                + ' OR '
                + '(e.nomTuteur IS NOT NULL AND e.nomTuteur = :nomTuteur)'
                + ')',
                {
                    eleveId,
                    etablissementId,
                    nomPere: eleveRef.nomPere,
                    nomMere: eleveRef.nomMere,
                    nomTuteur: eleveRef.nomTuteur,
                }
            );

        const fratrie = await qb.getMany();

        logger.info(`[Finances] Fratrie détectée pour élève ${eleveId}: ${fratrie.length} frère(s)/soeur(s)`);

        return fratrie;
    }

    /**
     * Appliquer automatiquement une remise de fratrie
     * Si un élève a des frères/soeurs, créer une remise FRATRIE
     */
    async appliquerRemiseFratrie(
        eleveId: string,
        fraisScolariteId: string,
        pourcentage: number,
        userId: string,
        etablissementId?: string
    ): Promise<Remise | null> {
        // Détecter la fratrie
        const fratrie = await this.detecterFratrie(eleveId, etablissementId);

        // Si moins de 2 enfants dans la fratrie, pas de remise
        if (fratrie.length < 1) {
            logger.info(`[Finances] Pas de fratrie détectée pour élève ${eleveId}`);
            return null;
        }

        // Vérifier si une remise FRATRIE existe déjà
        const remiseExistante = await this.remiseRepo.findOne({
            where: {
                eleveId,
                typeRemise: TypeRemise.FRATRIE,
                etablissementId,
            },
        });

        if (remiseExistante) {
            logger.info(`[Finances] Remise FRATRIE déjà existante pour élève ${eleveId}`);
            return remiseExistante;
        }

        // Récupérer les frais pour calculer le montant
        const frais = await this.fraisRepo.findOne({
            where: { id: fraisScolariteId },
        });

        if (!frais) {
            throw new AppError('Frais de scolarité non trouvés', 404, 'NOT_FOUND');
        }

        // Calculer le montant de la remise
        const montantRemise = Math.round(Number(frais.fraisScolariteAnnuel) * pourcentage / 100);

        // Créer la remise
        const remise = this.remiseRepo.create({
            eleveId,
            fraisScolariteId,
            typeRemise: TypeRemise.FRATRIE,
            scopeRemise: 'ELEVE' as any,
            pourcentage,
            montant: montantRemise,
            motif: `Fratrie: ${fratrie.length + 1} enfants (${fratrie.map(f => f.matricule).join(', ')})`,
            validePar: userId,
            dateAttribution: new Date(),
            etablissementId: etablissementId || '',
        });

        await this.remiseRepo.save(remise);

        logger.info(`[Finances] Remise FRATRIE créée pour élève ${eleveId}: ${pourcentage}% (${montantRemise} FCFA)`);

        // Audit
        await auditService.logCRUD(
            'CREATE',
            'Remise',
            userId,
            remise.id,
            undefined,
            {
                eleveId,
                typeRemise: TypeRemise.FRATRIE,
                pourcentage,
                montant: montantRemise,
                motif: remise.motif,
                fratrieCount: fratrie.length + 1,
            }
        );

        return remise;
    }

    // ==================================
    // RELANCES
    // ==================================

    /**
     * Détecter les impayés (échéances en retard)
     */
    async detecterImpayes(etablissementId?: string): Promise<Echeancier[]> {
        const now = new Date();

        const qb = this.echeancierRepo.createQueryBuilder('e')
            .where('e.statut != :statut', { statut: StatutPaiement.PAYE })
            .andWhere('e.dateEcheance < :now', { now })
            .andWhere('e.etablissementId = :etablissementId', { etablissementId });

        return qb.getMany();
    }

    /**
     * Envoyer des relances automatiques
     */
    async envoyerRelances(etablissementId?: string): Promise<number> {
        const impayes = await this.detecterImpayes(etablissementId);
        let count = 0;

        for (const echeancier of impayes) {
            try {
                // Vérifier si une relance récente existe déjà
                const relancesRecentes = await this.relanceRepo.count({
                    where: {
                        echeancierId: echeancier.id,
                        dateRelance: In([new Date()]),
                    },
                });

                if (relancesRecentes > 0) continue; // Déjà relancé aujourd'hui

                // Créer la relance
                const relance = this.relanceRepo.create({
                    eleveId: echeancier.eleveId,
                    echeancierId: echeancier.id,
                    numeroRelance: 1, // À améliorer : compter relances précédentes
                    dateRelance: new Date(),
                    typeRelance: 'EMAIL' as any,
                    statut: 'ENVOYEE' as any,
                    message: `Rappel : Votre échéance de paiement n°${echeancier.numeroTranche} d'un montant de ${echeancier.montantAttendu} FCFA est en retard depuis le ${echeancier.dateEcheance}.`,
                    effectuePar: 'SYSTEM',
                    etablissementId,
                });

                await this.relanceRepo.save(relance);
                count++;

                // Envoyer notification de relance
                try {
                    await notificationsService.create({
                        destinataireId: echeancier.eleveId,
                        titre: '⚠️ Rappel paiement en retard',
                        contenu: relance.message,
                        type: TypeNotification.IN_APP,
                        priorite: PrioriteNotification.URGENTE,
                        categorie: 'FINANCES',
                        metadata: {
                            echeancierId: echeancier.id,
                            relanceId: relance.id,
                            montantAttendu: echeancier.montantAttendu,
                            dateEcheance: echeancier.dateEcheance,
                        },
                    }, 'SYSTEM');

                    // SMS si retard > 15 jours
                    const now = new Date();
                    const joursRetard = Math.floor((now.getTime() - echeancier.dateEcheance.getTime()) / (1000 * 60 * 60 * 24));
                    if (joursRetard > 15) {
                        await notificationsService.create({
                            destinataireId: echeancier.eleveId,
                            titre: 'Relance paiement',
                            contenu: `Rappel: Échéance ${echeancier.numeroTranche} en retard de ${joursRetard} jours. Montant: ${echeancier.montantAttendu} FCFA`,
                            type: TypeNotification.SMS,
                            priorite: PrioriteNotification.URGENTE,
                            categorie: 'FINANCES',
                        }, 'SYSTEM');
                    }
                } catch (notifError) {
                    logger.error('[Scolarité] Erreur notification relance:', notifError);
                }
            } catch (error) {
                logger.warn(`[Finances] Erreur relance échéance ${echeancier.id}`, error);
            }
        }

        if (count > 0) {
            logger.info(`[Finances] ${count} relances envoyées`);
        }

        return count;
    }
}

// Singleton exporté
export const scolariteService = new ScolariteService();
