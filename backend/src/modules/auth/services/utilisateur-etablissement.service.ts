/**
 * ==================================
 * eLISAschool - Service UtilisateurEtablissement
 * ==================================
 * Version: 2.0.0
 * 
 * Gère les affectations d'utilisateurs à plusieurs établissements.
 * Permet l'ajout, la suppression, le changement d'établissement principal.
 */

import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { UtilisateurEtablissement, RoleLimitationEtablissement } from '../entities';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { VerificationRetraitResponse, BlocageRetrait, AvertissementRetrait } from '../dto';

export interface AffecterUtilisateurDto {
    utilisateurId: string;
    etablissementId: string;
    role: Role;
    etablissementPrincipal?: boolean;
    dateDebut?: string;
    dateFin?: string;
    motif?: string;
}

export class UtilisateurEtablissementService {
    private repo: Repository<UtilisateurEtablissement>;
    private limitationRepo: Repository<RoleLimitationEtablissement>;

    constructor() {
        this.repo = AppDataSource.getRepository(UtilisateurEtablissement);
        this.limitationRepo = AppDataSource.getRepository(RoleLimitationEtablissement);
    }

    /**
     * Récupère la limitation pour un rôle donné
     * Utilise les valeurs par défaut si non configuré en base
     */
    private async getLimitation(role: Role): Promise<RoleLimitationEtablissement> {
        const limitation = await this.limitationRepo.findOne({ where: { role } });
        
        if (limitation) {
            return limitation;
        }

        // Valeurs par défaut selon le rôle
        const defaults: Partial<Record<Role, Partial<RoleLimitationEtablissement>>> = {
            [Role.SUPER_ADMIN]: { maxEtablissements: 999, peutChanger: true, necessiteValidation: false },
            [Role.ADMIN]: { maxEtablissements: 10, peutChanger: true, necessiteValidation: false },
            [Role.CHEF_ETABLISSEMENT]: { maxEtablissements: 5, peutChanger: true, necessiteValidation: false },
            [Role.ENSEIGNANT]: { maxEtablissements: 5, peutChanger: true, necessiteValidation: false },
            [Role.PERSONNEL]: { maxEtablissements: 3, peutChanger: true, necessiteValidation: false },
            [Role.RESPONSABLE_CANTINE]: { maxEtablissements: 2, peutChanger: true, necessiteValidation: true },
            [Role.RESPONSABLE_TRANSPORT]: { maxEtablissements: 2, peutChanger: true, necessiteValidation: true },
            [Role.PARENT]: { maxEtablissements: 10, peutChanger: true, necessiteValidation: false },
            [Role.ELEVE]: { maxEtablissements: 1, peutChanger: false, necessiteValidation: false },
        };

        return {
            role,
            maxEtablissements: defaults[role]?.maxEtablissements || 1,
            peutChanger: defaults[role]?.peutChanger || false,
            necessiteValidation: defaults[role]?.necessiteValidation || false,
        } as RoleLimitationEtablissement;
    }

    /**
     * Ajoute un établissement à un utilisateur
     */
    async ajouter(dto: AffecterUtilisateurDto, creePar?: string): Promise<UtilisateurEtablissement> {
        // Vérifier si l'affectation existe déjà
        const existing = await this.repo.findOne({
            where: {
                utilisateurId: dto.utilisateurId,
                etablissementId: dto.etablissementId
            }
        });

        if (existing) {
            if (existing.actif) {
                throw new AppError(
                    'L\'utilisateur est déjà affecté à cet établissement',
                    409,
                    'ALREADY_ASSIGNED'
                );
            }
            // Réactiver l'affectation existante
            existing.actif = true;
            existing.role = dto.role;
            existing.dateDebut = dto.dateDebut ? new Date(dto.dateDebut) : existing.dateDebut;
            existing.dateFin = dto.dateFin ? new Date(dto.dateFin) : undefined;
            existing.motif = dto.motif || existing.motif;
            return await this.repo.save(existing);
        }

        // VALIDATION MÉTIER : Vérifier les limitations par rôle
        const limitation = await this.getLimitation(dto.role);

        // Élève : interdiction stricte multi-établissements
        if (dto.role === Role.ELEVE) {
            const count = await this.repo.count({
                where: { utilisateurId: dto.utilisateurId, actif: true }
            });
            if (count > 0) {
                throw new AppError(
                    'Un élève ne peut être affecté qu\'à un seul établissement',
                    400,
                    'ELEVE_MULTI_ETABLISSEMENT_NOT_ALLOWED'
                );
            }
        }

        // Vérifier le nombre maximum d'établissements
        const currentCount = await this.repo.count({
            where: { utilisateurId: dto.utilisateurId, actif: true }
        });

        if (currentCount >= limitation.maxEtablissements) {
            throw new AppError(
                `Ce rôle est limité à ${limitation.maxEtablissements} établissement(s) maximum`,
                400,
                'MAX_ETABLISSEMENTS_REACHED'
            );
        }

        // Vérifier si validation requise
        if (limitation.necessiteValidation) {
            logger.warn(`[VALIDATION_REQUISE] Affectation de ${dto.utilisateurId} à ${dto.etablissementId} nécessite validation SUPER_ADMIN`);
            // TODO: Implémenter workflow de validation (notification SUPER_ADMIN)
        }

        // Si c'est l'établissement principal, désactiver les autres
        if (dto.etablissementPrincipal) {
            await this.repo.update(
                { utilisateurId: dto.utilisateurId, etablissementPrincipal: true },
                { etablissementPrincipal: false }
            );
        }

        // Créer la nouvelle affectation
        const affectation = this.repo.create({
            utilisateurId: dto.utilisateurId,
            etablissementId: dto.etablissementId,
            role: dto.role,
            etablissementPrincipal: dto.etablissementPrincipal || false,
            actif: true,
            dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : new Date(),
            dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
            motif: dto.motif,
            creePar,
        });

        await this.repo.save(affectation);
        logger.info(`Utilisateur ${dto.utilisateurId} affecté à l'établissement ${dto.etablissementId}`);

        return affectation;
    }

    /**
     * Retire un établissement à un utilisateur (désactivation logique)
     * 
     * Améliorations v5.0:
     * - Suppression du blocage du dernier établissement (retrait total autorisé)
     * - Support du paramètre nouveauPrincipalId pour choisir le nouvel établissement principal
     * - Transaction ACID pour garantir l'intégrité
     * - Logging détaillé pour audit trail
     */
    async retirer(
        utilisateurId: string,
        etablissementId: string,
        motifRetrait?: string,
        nouveauPrincipalId?: string
    ): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // RECHERCHE FLEXIBLE : Trouver l'affectation (active ou non)
            const affectation = await queryRunner.manager.findOne(UtilisateurEtablissement, {
                where: { utilisateurId, etablissementId }
            });

            // IDEMPOTENCE TOTALE : Si l'affectation n'existe pas, considérer comme succès
            if (!affectation) {
                logger.info(
                    `[IDEMPOTENCE] Aucune affectation trouvée pour ${utilisateurId} → ${etablissementId} (déjà retirée ou jamais assigné)`
                );
                await queryRunner.commitTransaction();
                return;
            }

            // IDEMPOTENCE : Si déjà inactive, considérer comme succès
            if (!affectation.actif) {
                logger.info(
                    `[IDEMPOTENCE] Affectation déjà inactive pour ${utilisateurId} → ${etablissementId}`
                );
                await queryRunner.commitTransaction();
                return;
            }

            // LOGIQUE DE RETRAIT (v5.0):
            // 1. Si c'était l'établissement principal, en attribuer un autre
            if (affectation.etablissementPrincipal) {
                let nouvelEtablissementPrincipal: UtilisateurEtablissement | null = null;

                // Si nouveauPrincipalId est spécifié, l'utiliser
                if (nouveauPrincipalId) {
                    nouvelEtablissementPrincipal = await queryRunner.manager.findOne(UtilisateurEtablissement, {
                        where: { utilisateurId, etablissementId: nouveauPrincipalId, actif: true }
                    });

                    if (!nouvelEtablissementPrincipal) {
                        throw new AppError(
                            'L\'établissement principal spécifié n\'est pas valide ou n\'est pas affecté à cet utilisateur',
                            400,
                            'NOUVEAU_PRINCIPAL_INVALIDE'
                        );
                    }
                } else {
                    // Sinon, choisir le plus ancien établissement actif
                    nouvelEtablissementPrincipal = await queryRunner.manager.findOne(UtilisateurEtablissement, {
                        where: { utilisateurId, actif: true, etablissementPrincipal: false },
                        order: { creeAt: 'ASC' }
                    });
                }

                if (nouvelEtablissementPrincipal) {
                    nouvelEtablissementPrincipal.etablissementPrincipal = true;
                    await queryRunner.manager.save(nouvelEtablissementPrincipal);
                    logger.info(
                        `[PRINCIPAL] Nouvel établissement principal pour ${utilisateurId}: ${nouvelEtablissementPrincipal.etablissementId}`
                    );
                } else {
                    logger.info(
                        `[PRINCIPAL] Aucun autre établissement pour ${utilisateurId} - etablissementPrincipal sera null`
                    );
                }
            }

            // 2. Désactiver l'affectation
            affectation.actif = false;
            affectation.dateFin = new Date();
            if (motifRetrait) {
                affectation.motif = motifRetrait;
            }
            await queryRunner.manager.save(affectation);

            // 3. Logger l'audit
            logger.info(
                `[RETRAIT] Utilisateur ${utilisateurId} retiré de ${etablissementId}` +
                (motifRetrait ? ` (Motif: ${motifRetrait})` : '')
            );

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Vérifie les données liées avant le retrait d'un utilisateur
     * Retourne des avertissements ou bloque selon la criticité
     */
    private async verifierDonneesLies(
        queryRunner: any,
        utilisateurId: string,
        etablissementId: string
    ): Promise<void> {
        // VÉRIFICATION 1: L'utilisateur est-il chef d'établissement ?
        const affectation = await queryRunner.manager.findOne(UtilisateurEtablissement, {
            where: { utilisateurId, etablissementId, actif: true }
        });

        if (affectation?.role === Role.CHEF_ETABLISSEMENT) {
            // Vérifier s'il y a un autre chef
            const autreChef = await queryRunner.manager.count(UtilisateurEtablissement, {
                where: {
                    etablissementId,
                    role: Role.CHEF_ETABLISSEMENT,
                    actif: true,
                    utilisateurId: queryRunner.manager.createQueryBuilder().raw('!= ?', [utilisateurId])
                }
            });

            if (autreChef === 0) {
                logger.warn(
                    `[ALERTE] Dernier chef d'établissement retiré de ${etablissementId}`
                );
                // On ne bloque pas, mais on logue pour audit
            }
        }

        // VÉRIFICATION 2: L'utilisateur a-t-il des classes assignées ?
        const classeRepo = queryRunner.manager.getRepository('Classe');
        const classesAssignees = await classeRepo.count({
            where: { 
                responsableId: utilisateurId,
                anneeScolaire: { etablissementId }
            },
            relations: ['anneeScolaire']
        });

        if (classesAssignees > 0) {
            logger.warn(
                `[ALERTE] Utilisateur ${utilisateurId} a ${classesAssignees} classe(s) assignée(s) dans ${etablissementId}`
            );
            // TODO: Notification au responsable pour réassignation
        }

        // VÉRIFICATION 3: L'utilisateur est-il responsable d'élèves ?
        const responsableRepo = queryRunner.manager.getRepository('ResponsableEleve');
        const responsablesEleves = await responsableRepo.count({
            where: { utilisateurId }
        });

        if (responsablesEleves > 0) {
            logger.info(
                `[INFO] Utilisateur ${utilisateurId} est responsable de ${responsablesEleves} élève(s)`
            );
            // Pas de blocage - les responsables peuvent être multi-établissements
        }

        // VÉRIFICATION 4: L'utilisateur a-t-il créé des données critiques ?
        // (notes, bulletins, etc.) - Vérification légère, juste un log
        const noteRepo = queryRunner.manager.getRepository('Note');
        const notesCreees = await noteRepo.count({
            where: { creePar: utilisateurId }
        });

        if (notesCreees > 0) {
            logger.info(
                `[INFO] Utilisateur ${utilisateurId} a créé ${notesCreees} note(s) - données conservées`
            );
            // Les notes restent (creePar est un historique)
        }
    }

    /**
     * Définit l'établissement principal d'un utilisateur
     */
    async definirPrincipal(utilisateurId: string, etablissementId: string): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Vérifier que l'affectation existe
            const affectation = await queryRunner.manager.findOne(UtilisateurEtablissement, {
                where: { utilisateurId, etablissementId, actif: true }
            });

            if (!affectation) {
                throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');
            }

            // Désactiver tous les autres établissements principaux
            await queryRunner.manager.update(
                UtilisateurEtablissement,
                { utilisateurId, etablissementPrincipal: true },
                { etablissementPrincipal: false }
            );

            // Définir le nouvel établissement principal
            affectation.etablissementPrincipal = true;
            await queryRunner.manager.save(affectation);

            await queryRunner.commitTransaction();
            logger.info(`Établissement principal de ${utilisateurId} défini sur ${etablissementId}`);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Liste les établissements d'un utilisateur
     */
    async findByUtilisateur(utilisateurId: string): Promise<UtilisateurEtablissement[]> {
        return this.repo.find({
            where: { utilisateurId, actif: true },
            relations: ['etablissement'],
            order: { etablissementPrincipal: 'DESC', creeAt: 'ASC' }
        });
    }

    /**
     * Vérifie si un utilisateur a accès à un établissement
     */
    async hasAccess(utilisateurId: string, etablissementId: string): Promise<boolean> {
        const count = await this.repo.count({
            where: { utilisateurId, etablissementId, actif: true }
        });
        return count > 0;
    }

    /**
     * Récupère l'établissement principal d'un utilisateur
     */
    async getPrincipal(utilisateurId: string): Promise<UtilisateurEtablissement | null> {
        return this.repo.findOne({
            where: { utilisateurId, etablissementPrincipal: true, actif: true },
            relations: ['etablissement']
        });
    }

    /**
     * Vérifie les impacts avant le retrait d'un utilisateur d'un établissement (v5.0)
     * 
     * Retourne une structure détaillée avec blocages et avertissements.
     * Toutes les vérifications sont filtrées par etablissementId.
     */
    async verifierRetrait(
        utilisateurId: string,
        etablissementId: string
    ): Promise<VerificationRetraitResponse> {
        const blocages: BlocageRetrait[] = [];
        const avertissements: AvertissementRetrait[] = [];

        // VÉRIFICATION 1: L'utilisateur est-il chef d'établissement ?
        const affectation = await this.repo.findOne({
            where: { utilisateurId, etablissementId, actif: true }
        });

        let estDernierChef = false;
        if (affectation?.role === Role.CHEF_ETABLISSEMENT) {
            // Compter les autres chefs (exclure l'utilisateur actuel)
            const tousLesChefs = await this.repo.find({
                where: {
                    etablissementId,
                    role: Role.CHEF_ETABLISSEMENT,
                    actif: true
                }
            });
            
            const autreChef = tousLesChefs.filter(chef => chef.utilisateurId !== utilisateurId).length;

            if (autreChef === 0) {
                estDernierChef = true;
                blocages.push({
                    code: 'DERNIER_CHEF_ETABLISSEMENT',
                    message: 'Cet utilisateur est le dernier chef d\'établissement dans cet établissement',
                    severite: 'bloquant',
                    actionRequise: 'Désignez un autre chef d\'établissement avant de retirer cet utilisateur'
                });
            }
        }

        // VÉRIFICATION 2: L'utilisateur a-t-il des classes assignées dans CET établissement ?
        // NOTE: Classe utilise professeurPrincipalId (MembrePersonnel), pas responsableId directement
        // On doit donc trouver le MembrePersonnel lié à cet utilisateur d'abord
        const membrePersonnelRepo = AppDataSource.getRepository('MembrePersonnel');
        const membrePersonnel = await membrePersonnelRepo.findOne({
            where: { utilisateurId }
        });

        let classesAssignees = 0;
        if (membrePersonnel) {
            const classeRepo = AppDataSource.getRepository('Classe');
            classesAssignees = await classeRepo.count({
                where: { 
                    professeurPrincipalId: membrePersonnel.id,
                    etablissementId
                }
            });
        }

        if (classesAssignees > 0) {
            avertissements.push({
                code: 'CLASSES_ASSIGNEES',
                message: `${classesAssignees} classe(s) sont assignées à cet utilisateur dans cet établissement`,
                severite: 'avertissement',
                nombre: classesAssignees,
                actionRecommandee: 'Réassignez les classes à un autre utilisateur avant le retrait'
            });
        }

        // VÉRIFICATION 3: L'utilisateur est-il responsable d'élèves dans CET établissement ?
        // NOTE: ResponsableEleve n'a pas d'etablissementId, il faut passer par Eleve
        // ResponsableEleve.enfantId = Utilisateur.id → Eleve.utilisateurId → Eleve.etablissementId
        const responsableRepo = AppDataSource.getRepository('ResponsableEleve');
        const eleveRepo = AppDataSource.getRepository('Eleve');
        
        // Trouver tous les enfants dont cet utilisateur est responsable
        const responsabilites = await responsableRepo.find({
            where: { utilisateurId, actif: true },
            select: ['enfantId']
        });

        let elevesResponsables = 0;
        if (responsabilites.length > 0) {
            const enfantIds = responsabilites.map(r => r.enfantId);
            // Compter combien de ces enfants sont élèves dans cet établissement
            elevesResponsables = await eleveRepo.count({
                where: {
                    utilisateurId: {
                        in: enfantIds
                    },
                    etablissementId
                }
            });
        }

        if (elevesResponsables > 0) {
            avertissements.push({
                code: 'RESPONSABLE_ELEVES',
                message: `Cet utilisateur est responsable de ${elevesResponsables} élève(s) dans cet établissement`,
                severite: 'avertissement',
                nombre: elevesResponsables,
                actionRecommandee: 'Les liens de responsabilité seront rompus dans cet établissement'
            });
        }

        // VÉRIFICATION 4: L'utilisateur a-t-il créé des données critiques dans CET établissement ?
        // NOTE: Note utilise enseignantId (MembrePersonnel), pas creePar directement
        // On utilise le membrePersonnel déjà récupéré plus haut
        let notesCreees = 0;
        if (membrePersonnel) {
            const noteRepo = AppDataSource.getRepository('Note');
            notesCreees = await noteRepo.count({
                where: { 
                    enseignantId: membrePersonnel.id,
                    etablissementId
                }
            });
        }

        // Notes créées = log uniquement (pas d'impact bloquant)
        if (notesCreees > 0) {
            logger.info(
                `[INFO] Utilisateur ${utilisateurId} a créé ${notesCreees} note(s) dans ${etablissementId} - données conservées`
            );
        }

        return {
            peutRetirer: blocages.length === 0,
            blocages,
            avertissements,
            resume: {
                nombreBlocages: blocages.length,
                nombreAvertissements: avertissements.length,
                classesAssignees: classesAssignees,
                elevesResponsables: elevesResponsables,
                estDernierChef
            }
        };
    }

    /**
     * Met à jour le rôle d'un utilisateur dans un établissement
     */
    async updateRole(
        utilisateurId: string,
        etablissementId: string,
        newRole: Role
    ): Promise<UtilisateurEtablissement> {
        const affectation = await this.repo.findOne({
            where: { utilisateurId, etablissementId, actif: true }
        });

        if (!affectation) {
            throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');
        }

        affectation.role = newRole;
        return await this.repo.save(affectation);
    }
}

export const utilisateurEtablissementService = new UtilisateurEtablissementService();
export default UtilisateurEtablissementService;
