/**
 * ==================================
 * eLISAschool - Service Scolarité et Paiements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion complète des frais de scolarité, échéanciers, paiements et relances
 */

import { Repository, In, IsNull, Between } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { FraisScolarite, Echeancier, Paiement, RecuPaiement, RelancePaiement, Remise, TypeRemise, ScopeRemise } from '../entities';
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
import { Request } from 'express';

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
        await auditService.log({
            utilisateurId: 'SYSTEM',
            action: AuditAction.FRAIS_SCOLARITE_CREATE,
            cible: 'FraisScolarite',
            cibleId: frais.id,
            description: `Frais de scolarité configurés pour niveau ${dto.niveauId}: ${dto.fraisScolariteAnnuel}€`,
            module: 'finances',
            etablissementId,
            metadata: {
                entiteLabel: `${dto.fraisScolariteAnnuel}€`,
                niveauId: dto.niveauId,
                anneeScolaireId: dto.anneeScolaireId,
                nombreTranches: dto.nombreTranches,
            },
        });

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
     * Algorithme de priorité : filière > classe > niveau > cycle > établissement
     */
    async trouverFraisScolarite(
        eleveId: string,
        anneeScolaireId: string,
        classeId: string,
        niveauId: string,
        cycleId: string,
        filiereId: string,
        etablissementId?: string
    ): Promise<FraisScolarite> {
        const cibleEtablissementId = etablissementId || '';

        logger.info(`[Finances] Recherche frais pour élève ${eleveId} - Filière: ${filiereId}, Classe: ${classeId}, Niveau: ${niveauId}, Cycle: ${cycleId}`);

        // PRIORITÉ 1 : Frais par FILIÈRE (plus spécifique)
        if (filiereId) {
            const fraisFiliere = await this.fraisRepo.findOne({
                where: {
                    etablissementId: cibleEtablissementId,
                    anneeScolaireId,
                    filiereId,
                },
                relations: ['filiere', 'classe', 'niveau', 'cycle'],
            });

            if (fraisFiliere) {
                logger.info(`[Finances] Frais trouvés par FILIÈRE: ${fraisFiliere.id}`);
                return fraisFiliere;
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
                    filiereId: IsNull(),
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
                filiereId: IsNull(),
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
                    filiereId: IsNull(),
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
                filiereId: IsNull(),
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
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.PAIEMENT_CREATE,
                cible: 'Paiement',
                cibleId: paiement.id,
                description: `Paiement enregistré: ${montantTotal} FCFA - Reçu ${numeroRecu}`,
                module: 'finances',
                etablissementId,
                metadata: {
                    entiteLabel: `${montantTotal} FCFA`,
                    eleveId: dto.eleveId,
                    montant: dto.montant,
                    montantPenalite: penalite,
                    methodePaiement: dto.methodePaiement,
                    numeroRecu,
                    echeancierId: dto.echeancierId,
                },
            });

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
        // Validation de cohérence scope ↔ FK
        const scope = dto.scopeRemise || ScopeRemise.ELEVE;
        if (scope === ScopeRemise.ELEVE && !dto.eleveId) {
            throw new AppError('Remise élève : eleveId requis', 400, 'VALIDATION_ERROR');
        }
        if (scope === ScopeRemise.CLASSE && !dto.classeId) {
            throw new AppError('Remise classe : classeId requis', 400, 'VALIDATION_ERROR');
        }
        if (scope === ScopeRemise.CYCLE && !dto.cycleId) {
            throw new AppError('Remise cycle : cycleId requis', 400, 'VALIDATION_ERROR');
        }
        if (scope === ScopeRemise.FILIERE && !dto.filiereId) {
            throw new AppError('Remise filière : filiereId requis', 400, 'VALIDATION_ERROR');
        }

        const remise = this.remiseRepo.create({
            eleveId: dto.eleveId,
            fraisScolariteId: dto.fraisScolariteId,
            typeRemise: dto.typeRemise as any, // Conversion pour TypeORM
            scopeRemise: scope as any,
            classeId: dto.classeId,
            cycleId: dto.cycleId,
            filiereId: dto.filiereId,
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
        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.REMISE_CREATE,
            cible: 'Remise',
            cibleId: remise.id,
            description: `Remise ${dto.typeRemise} attribuée à élève ${dto.eleveId}: ${dto.pourcentage}% (${dto.montant} FCFA)`,
            module: 'finances',
            etablissementId,
            metadata: {
                entiteLabel: `${dto.pourcentage}%`,
                eleveId: dto.eleveId,
                typeRemise: dto.typeRemise,
                pourcentage: dto.pourcentage,
                montant: dto.montant,
                motif: dto.motif,
            },
        });

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
        filiereId: string,
        etablissementId: string
    ): Promise<Remise[]> {
        const remisesApplicables: Remise[] = [];

        logger.info(`[Finances] Recherche remises pour élève ${eleveId} - Filière: ${filiereId}, Classe: ${classeId}, Niveau: ${niveauId}, Cycle: ${cycleId}`);

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

        // 2. Remises par FILIÈRE (scope FILIERE)
        if (filiereId) {
            const remisesFiliere = await this.remiseRepo.find({
                where: {
                    filiereId,
                    scopeRemise: 'FILIERE' as any,
                    etablissementId,
                    eleveId: IsNull(),
                },
                relations: ['fraisScolarite'],
            });

            if (remisesFiliere.length > 0) {
                logger.info(`[Finances] ${remisesFiliere.length} remise(s) trouvée(s) par FILIÈRE`);
                remisesApplicables.push(...remisesFiliere);
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
        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.REMISE_CREATE,
            cible: 'Remise',
            cibleId: remise.id,
            description: `Remise FRATRIE créée pour élève ${eleveId}: ${pourcentage}% (${montantRemise} FCFA) - ${fratrie.length + 1} enfants`,
            module: 'finances',
            etablissementId,
            metadata: {
                entiteLabel: `${pourcentage}%`,
                eleveId,
                typeRemise: TypeRemise.FRATRIE,
                pourcentage,
                montant: montantRemise,
                motif: remise.motif,
                fratrieCount: fratrie.length + 1,
            },
        });

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

        // Récupérer la configuration du nombre max de relances
        const maxRelances = await this.getParametreNumber('relance.max_nombre', 5);
        const seuilInsolvable = await this.getParametreNumber('relance.insolvable_seuil', 5);

        for (const echeancier of impayes) {
            try {
                // CORRECTION BUG: Utiliser Between pour matcher toute la journée
                const debutJour = new Date();
                debutJour.setHours(0, 0, 0, 0);
                const finJour = new Date();
                finJour.setHours(23, 59, 59, 999);

                const relancesRecentes = await this.relanceRepo.count({
                    where: {
                        echeancierId: echeancier.id,
                        dateRelance: Between(debutJour, finJour),
                    },
                });

                if (relancesRecentes > 0) continue; // Déjà relancé aujourd'hui

                // CORRECTION BUG: Compter le nombre total de relances pour cet échéancier
                const nbRelancesPrecedentes = await this.relanceRepo.count({
                    where: { echeancierId: echeancier.id },
                });
                const numeroRelance = nbRelancesPrecedentes + 1;

                // VÉRIFIER QUOTA: Si nombre max de relances atteint, marquer comme insolvable
                if (nbRelancesPrecedentes >= maxRelances) {
                    await this.marquerInsolvable(echeancier.eleveId, 
                        `Quota de ${maxRelances} relances atteint pour l'échéancier ${echeancier.numeroTranche}`,
                        'SYSTEM'
                    );
                    continue;
                }

                // Créer la relance avec numéro incrémenté
                const relance = this.relanceRepo.create({
                    eleveId: echeancier.eleveId,
                    echeancierId: echeancier.id,
                    numeroRelance,
                    dateRelance: new Date(),
                    typeRelance: 'EMAIL' as any,
                    statut: 'ENVOYEE' as any,
                    message: `Rappel n°${numeroRelance} : Votre échéance de paiement n°${echeancier.numeroTranche} d'un montant de ${echeancier.montantAttendu} FCFA est en retard depuis le ${echeancier.dateEcheance}.`,
                    effectuePar: 'SYSTEM',
                    etablissementId,
                });

                await this.relanceRepo.save(relance);
                count++;

                // Incrémenter le compteur de relances sur l'élève
                await this.eleveRepo.increment(
                    { id: echeancier.eleveId },
                    'nombreRelancesEnvoyees',
                    1
                );

                // Vérifier si seuil insolvable atteint
                if (numeroRelance >= seuilInsolvable) {
                    await this.marquerInsolvable(echeancier.eleveId,
                        `Seuil de ${seuilInsolvable} relances atteint automatiquement`,
                        'SYSTEM'
                    );
                }

                // Envoyer notification de relance
                try {
                    await notificationsService.create({
                        destinataireId: echeancier.eleveId,
                        titre: `⚠️ Rappel paiement en retard (n°${numeroRelance})`,
                        contenu: relance.message,
                        type: TypeNotification.IN_APP,
                        priorite: PrioriteNotification.URGENTE,
                        categorie: 'FINANCES',
                        metadata: {
                            echeancierId: echeancier.id,
                            relanceId: relance.id,
                            numeroRelance,
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

    /**
     * Marquer un élève comme insolvable
     */
    async marquerInsolvable(eleveId: string, motif: string, userId: string): Promise<void> {
        const eleve = await this.eleveRepo.findOne({ where: { id: eleveId } });
        if (!eleve) {
            throw new AppError('Élève non trouvé', 404, 'NOT_FOUND');
        }

        // Ne marquer que si pas déjà insolvable
        if (eleve.statutPaiement === 'INSOLVABLE' || eleve.statutPaiement === 'CONTENTIEUX') {
            logger.info(`[Insolvable] Élève ${eleveId} déjà marqué comme ${eleve.statutPaiement}`);
            return;
        }

        await this.eleveRepo.update(eleveId, {
            statutPaiement: 'INSOLVABLE',
            dateMarquageInsolvable: new Date(),
        });

        logger.warn(`[Insolvable] Élève ${eleveId} marqué comme INSOLVABLE - Motif: ${motif}`);

        // Notification au chef d'établissement
        try {
            await notificationsService.create({
                destinataireId: userId,
                titre: '🚨 Élève marqué comme insolvable',
                contenu: `L'élève ${eleve.matricule} a été marqué comme insolvable. Motif: ${motif}. Un document de rappel doit être remis au responsable.`,
                type: TypeNotification.IN_APP,
                priorite: PrioriteNotification.URGENTE,
                categorie: 'FINANCES',
                metadata: {
                    eleveId,
                    eleveMatricule: eleve.matricule,
                    motif,
                },
            }, 'SYSTEM');
        } catch (error) {
            logger.error('[Insolvable] Erreur notification:', error);
        }
    }

    /**
     * Obtenir un paramètre numérique depuis la configuration
     */
    private async getParametreNumber(cle: string, defaut: number): Promise<number> {
        try {
            const { getParametre } = await import('@modules/configuration/services/configuration.service');
            const valeur = await getParametre(cle);
            return valeur ? parseInt(valeur, 10) : defaut;
        } catch {
            return defaut;
        }
    }

    // ==================================
    // FRAIS D'INSCRIPTION (NOUVEAU - v2.0)
    // ==================================

    /**
     * Générer les frais d'inscription pour un élève nouvellement inscrit
     * Appelé lors de la conversion d'une préinscription en inscription
     */
    async genererFraisInscription(
        eleveId: string,
        anneeScolaireId: string,
        userId: string,
        etablissementId?: string,
        req?: Request
    ): Promise<FraisScolarite> {
        // Vérifier si les frais existent déjà
        const fraisExistants = await this.fraisRepo.findOne({
            where: {
                etablissementId,
                anneeScolaireId,
                // Frais d'inscription sont génériques à l'établissement
                niveauId: IsNull(),
                classeId: IsNull(),
            },
        });

        if (fraisExistants) {
            logger.info(`[${etablissementId}] Frais d'inscription déjà configurés pour année ${anneeScolaireId}`);
            return fraisExistants;
        }

        // Créer les frais d'inscription par défaut
        // Note: Ces valeurs devraient venir de la configuration
        const frais = this.fraisRepo.create({
            anneeScolaireId,
            etablissementId,
            fraisInscription: 50000, // 50 000 FCFA par défaut
            fraisScolariteAnnuel: 0, // Sera configuré par niveau/classe
            autresFrais: 0,
            nombreTranches: 1, // Frais d'inscription en une seule fois
            frequenceEcheance: 'annuel',
            datePremiereEcheance: new Date(),
            joursGrace: 0,
            penaliteRetard: 0,
        });

        await this.fraisRepo.save(frais);
        logger.info(`[${etablissementId}] Frais d'inscription créés: ${frais.fraisInscription} FCFA`);

        // Audit
        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.FRAIS_SCOLARITE_CREATE,
            cible: 'FraisScolarite',
            cibleId: frais.id,
            description: `Frais d'inscription créés: ${frais.fraisInscription} FCFA`,
            module: 'finances',
            etablissementId,
            metadata: {
                entiteLabel: `${frais.fraisInscription} FCFA`,
                eleveId,
                anneeScolaireId,
                fraisInscription: frais.fraisInscription,
            },
        });

        return frais;
    }

    /**
     * Enregistrer le paiement des frais d'inscription avec workflow de validation
     */
    async payerFraisInscription(
        eleveId: string,
        montant: number,
        methodePaiement: string,
        userId: string,
        etablissementId?: string,
        req?: Request
    ): Promise<Paiement> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Générer numéro de reçu
            const annee = new Date().getFullYear();
            const count = await queryRunner.manager.count(Paiement, {
                where: { 
                    etablissementId, 
                    typePaiement: TypePaiement.INSCRIPTION,
                    datePaiement: In([new Date()]) 
                },
            });
            const numeroRecu = `REC-INSCR-${annee}-${String(count + 1).padStart(5, '0')}`;

            // Créer le paiement
            const paiement = queryRunner.manager.create(Paiement, {
                eleveId,
                montant,
                montantTotal: montant,
                montantPenalite: 0,
                numeroRecu,
                typePaiement: TypePaiement.INSCRIPTION,
                methodePaiement,
                datePaiement: new Date(),
                effectuePar: userId,
                statut: StatutPaiement.PAYE,
                etablissementId,
                statutValidation: 'NON_REQUIS', // Par défaut pour inscription
                niveauValidationActuel: 0,
            });

            await queryRunner.manager.save(Paiement, paiement);

            // Générer le reçu
            const eleve = await queryRunner.manager.findOne(Eleve, {
                where: { id: eleveId },
            });

            if (eleve) {
                const recu = queryRunner.manager.create(RecuPaiement, {
                    paiementId: paiement.id,
                    numeroRecu,
                    dateEmission: new Date(),
                    eleveNom: `Élève ${eleve.matricule}`,
                    eleveMatricule: eleve.matricule,
                    classeNom: 'Inscription',
                    montant,
                    methodePaiement,
                    objet: 'Frais d\'inscription',
                    genererPar: userId,
                    etablissementId,
                });

                await queryRunner.manager.save(RecuPaiement, recu);
            }

            await queryRunner.commitTransaction();

            logger.info(`[${etablissementId}] Frais d'inscription payés: ${montant} FCFA - Reçu ${numeroRecu}`);

            // Notification de confirmation
            try {
                await notificationsService.create({
                    destinataireId: eleveId,
                    titre: '✅ Frais d\'inscription payés',
                    contenu: `Votre paiement de ${montant.toLocaleString()} FCFA a été enregistré. Reçu: ${numeroRecu}`,
                    type: TypeNotification.IN_APP,
                    priorite: PrioriteNotification.HAUTE,
                    categorie: 'FINANCES',
                    metadata: {
                        paiementId: paiement.id,
                        montant,
                        numeroRecu,
                        typePaiement: 'INSCRIPTION',
                    },
                }, userId);
            } catch (notifError) {
                logger.warn('[Scolarité] Échec notification frais d\'inscription (non bloquant)', notifError);
            }

            return await this.paiementRepo.findOne({
                where: { id: paiement.id },
                relations: ['eleve'],
            }) as Paiement;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}

// Singleton exporté
export const scolariteService = new ScolariteService();
