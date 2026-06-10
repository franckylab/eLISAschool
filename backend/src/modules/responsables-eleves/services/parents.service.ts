/**
 * ==================================
 * eLISAschool - Service Responsables Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Description: Service pour gérer les relations entre parents et élèves.
 * Permet de créer, modifier, supprimer et consulter les responsabilités.
 */

import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ResponsableEleve, LienParente } from '../entities';
import { LierParentDto, UpdateResponsableDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Role } from '@modules/auth/entities';
import { Utilisateur } from '@modules/auth/entities/utilisateur.entity';
import { auditService, AuditAction } from '@modules/auth';
import { Request } from 'express';
import { Eleve } from '@modules/eleves/entities';

export class ParentsService {
    private responsableRepo: Repository<ResponsableEleve>;
    private utilisateurRepo: Repository<Utilisateur>;
    private eleveRepo: Repository<Eleve>;

    constructor() {
        this.responsableRepo = AppDataSource.getRepository(ResponsableEleve);
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
        this.eleveRepo = AppDataSource.getRepository(Eleve);
    }

    /**
     * Lier un parent à un élève
     */
    async lierParent(dto: LierParentDto, req?: Request): Promise<ResponsableEleve> {
        // 1. Vérifier que l'utilisateur parent existe et a le rôle PARENT
        const parent = await this.utilisateurRepo.findOne({
            where: { id: dto.parentId },
        });

        if (!parent) {
            throw new AppError('Parent non trouvé', 404, 'PARENT_NOT_FOUND');
        }

        // Vérifier le rôle (peut être dans utilisateurRoles ou role principal)
        const estParent = parent.role === Role.PARENT || 
            (parent.utilisateurRoles?.some(ur => ur.role?.code === Role.PARENT) ?? false);
        
        // On permet aussi aux ADMIN de créer des relations
        if (!estParent && parent.role !== Role.ADMIN && parent.role !== Role.SUPER_ADMIN) {
            throw new AppError('L\'utilisateur doit avoir le rôle PARENT', 400, 'INVALID_PARENT_ROLE');
        }

        // 2. Vérifier que l'enfant existe
        const enfant = await this.utilisateurRepo.findOne({
            where: { id: dto.enfantId },
        });

        if (!enfant) {
            throw new AppError('Élève non trouvé', 404, 'CHILD_NOT_FOUND');
        }

        // 3. Vérifier que la relation n'existe pas déjà
        const existing = await this.responsableRepo.findOne({
            where: {
                utilisateurId: dto.parentId,
                enfantId: dto.enfantId,
            },
        });

        if (existing) {
            throw new AppError('Ce parent est déjà lié à cet élève', 409, 'RELATION_ALREADY_EXISTS');
        }

        // 4. Créer la relation
        const responsable = this.responsableRepo.create({
            utilisateurId: dto.parentId,
            enfantId: dto.enfantId,
            lienParente: dto.lienParente,
            responsableLegal: dto.responsableLegal,
            peutConsulter: dto.peutConsulter,
            peutPayer: dto.peutPayer,
            email: dto.email ?? undefined,
            telephone: dto.telephone ?? undefined,
            adresse: dto.adresse ?? undefined,
        });

        await this.responsableRepo.save(responsable);

        // 5. Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'CREATE' as any,
                cible: 'ResponsableEleve',
                cibleId: responsable.id,
                description: `Relation parent-élève créée: ${dto.lienParente}`,
                nouvellesValeurs: dto,
                module: 'responsables-eleves',
            }, req);
        }

        logger.info(`Relation parent-élève créée: ${dto.lienParente} - Parent: ${dto.parentId}, Enfant: ${dto.enfantId}`);
        
        // Retourner avec les relations
        return this.responsableRepo.findOne({
            where: { id: responsable.id },
            relations: ['utilisateur', 'enfant'],
        }) as Promise<ResponsableEleve>;
    }

    /**
     * Récupérer tous les parents d'un élève
     */
    async getParentsEleve(enfantUtilisateurId: string): Promise<ResponsableEleve[]> {
        return this.responsableRepo.find({
            where: {
                enfantId: enfantUtilisateurId,
                actif: true,
            },
            relations: ['utilisateur'],
            order: {
                responsableLegal: 'DESC',
                dateAjout: 'ASC',
            },
        });
    }

    /**
     * Récupérer tous les enfants d'un parent
     */
    async getEnfantsParent(parentUtilisateurId: string): Promise<ResponsableEleve[]> {
        return this.responsableRepo.find({
            where: {
                utilisateurId: parentUtilisateurId,
                actif: true,
            },
            relations: ['enfant'],
            order: {
                dateAjout: 'ASC',
            },
        });
    }

    /**
     * Récupérer les informations des parents d'un élève avec logique de fallback
     * 
     * PRIORITÉ 1 : ResponsableEleve (source de vérité pour inscriptions)
     * PRIORITÉ 2 : Champs directs dans Eleve (fallback pour préinscriptions)
     * 
     * @param eleveId ID de l'élève (UUID de l'entité Eleve, PAS utilisateurId)
     * @returns Liste des parents avec informations complètes
     */
    async getParentsInfo(eleveId: string): Promise<Array<{
        id: string;
        lienParente: string;
        nom: string;
        prenom?: string;
        telephone?: string;
        email?: string;
        profession?: string;
        adresse?: string;
        responsableLegal: boolean;
        peutConsulter: boolean;
        peutPayer: boolean;
        estCompte: boolean; // true = a un compte Utilisateur, false = champs directs seulement
    }>> {
        const eleve = await this.eleveRepo.findOne({
            where: { id: eleveId },
        });

        if (!eleve) {
            throw new AppError('Élève non trouvé', 404, 'NOT_FOUND');
        }

        // PRIORITÉ 1 : Essayer ResponsableEleve (source de vérité)
        const responsables = await this.responsableRepo.find({
            where: {
                enfantId: eleve.utilisateurId,
                actif: true,
            },
            relations: ['utilisateur'],
            order: {
                responsableLegal: 'DESC', // Responsable légal d'abord
                lienParente: 'ASC', // Père, puis Mère, puis autres
            },
        });

        if (responsables.length > 0) {
            logger.debug(`[ParentsInfo] ${responsables.length} parent(s) trouvé(s) via ResponsableEleve pour élève ${eleveId}`);
            
            return responsables.map(r => ({
                id: r.id,
                lienParente: r.lienParente,
                nom: (r.utilisateur as any).nom || r.utilisateur.email.split('@')[0],
                prenom: (r.utilisateur as any).prenom,
                telephone: r.telephone || (r.utilisateur as any).telephone || r.utilisateur.email,
                email: r.email || r.utilisateur.email,
                profession: (r as any).profession,
                adresse: r.adresse,
                responsableLegal: r.responsableLegal,
                peutConsulter: r.peutConsulter,
                peutPayer: r.peutPayer,
                estCompte: true, // ← A un compte Utilisateur
            }));
        }

        // PRIORITÉ 2 : Fallback sur champs directs (préinscriptions)
        logger.debug(`[ParentsInfo] Fallback sur champs directs pour élève ${eleveId} (préinscription)`);
        
        const parents: Array<any> = [];

        // Père
        if (eleve.nomPere) {
            parents.push({
                id: `direct-pere-${eleve.id}`,
                lienParente: LienParente.PERE,
                nom: eleve.nomPere,
                telephone: eleve.telephonePere,
                email: eleve.emailPere,
                profession: eleve.professionPere,
                adresse: eleve.adressePere,
                responsableLegal: true,
                peutConsulter: true,
                peutPayer: false, // Pas de compte = pas de paiement
                estCompte: false, // ← Pas de compte Utilisateur
            });
        }

        // Mère
        if (eleve.nomMere) {
            parents.push({
                id: `direct-mere-${eleve.id}`,
                lienParente: LienParente.MERE,
                nom: eleve.nomMere,
                telephone: eleve.telephoneMere,
                email: eleve.emailMere,
                profession: eleve.professionMere,
                adresse: eleve.adresseMere,
                responsableLegal: true,
                peutConsulter: true,
                peutPayer: false,
                estCompte: false,
            });
        }

        // Tuteur
        if (eleve.nomTuteur) {
            parents.push({
                id: `direct-tuteur-${eleve.id}`,
                lienParente: LienParente.TUTEUR_LEGAL,
                nom: eleve.nomTuteur,
                telephone: eleve.telephoneTuteur,
                email: eleve.emailTuteur,
                profession: eleve.professionTuteur,
                adresse: eleve.adresseTuteur,
                responsableLegal: true,
                peutConsulter: true,
                peutPayer: false,
                estCompte: false,
            });
        }

        return parents;
    }

    /**
     * Vérifier si un parent peut accéder à un élève
     */
    async peutAccederEleve(parentId: string, eleveUtilisateurId: string): Promise<boolean> {
        const responsable = await this.responsableRepo.findOne({
            where: {
                utilisateurId: parentId,
                enfantId: eleveUtilisateurId,
                actif: true,
                peutConsulter: true,
            },
        });

        return !!responsable;
    }

    /**
     * Vérifier si un parent peut payer pour un élève
     */
    async peutPayerPourEleve(parentId: string, eleveUtilisateurId: string): Promise<boolean> {
        const responsable = await this.responsableRepo.findOne({
            where: {
                utilisateurId: parentId,
                enfantId: eleveUtilisateurId,
                actif: true,
                peutPayer: true,
            },
        });

        return !!responsable;
    }

    /**
     * Modifier une relation parent-élève
     */
    async updateResponsable(
        parentId: string,
        enfantId: string,
        dto: UpdateResponsableDto,
        req?: Request
    ): Promise<ResponsableEleve> {
        const responsable = await this.responsableRepo.findOne({
            where: {
                utilisateurId: parentId,
                enfantId,
            },
        });

        if (!responsable) {
            throw new AppError('Relation parent-élève non trouvée', 404, 'RELATION_NOT_FOUND');
        }

        const anciennesValeurs = {
            lienParente: responsable.lienParente,
            responsableLegal: responsable.responsableLegal,
            peutConsulter: responsable.peutConsulter,
            peutPayer: responsable.peutPayer,
        };

        Object.assign(responsable, dto);
        await this.responsableRepo.save(responsable);

        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'UPDATE' as any,
                cible: 'ResponsableEleve',
                cibleId: responsable.id,
                description: `Relation parent-élève modifiée`,
                anciennesValeurs,
                nouvellesValeurs: dto,
                module: 'responsables-eleves',
            }, req);
        }

        logger.info(`Relation parent-élève modifiée: ${responsable.id}`);

        return this.responsableRepo.findOne({
            where: { id: responsable.id },
            relations: ['utilisateur', 'enfant'],
        }) as Promise<ResponsableEleve>;
    }

    /**
     * Supprimer une relation parent-élève (soft delete)
     */
    async deleteResponsable(parentId: string, enfantId: string, req?: Request): Promise<void> {
        const responsable = await this.responsableRepo.findOne({
            where: {
                utilisateurId: parentId,
                enfantId,
                actif: true,
            },
        });

        if (!responsable) {
            throw new AppError('Relation parent-élève non trouvée', 404, 'RELATION_NOT_FOUND');
        }

        const anciennesValeurs = {
            lienParente: responsable.lienParente,
            email: responsable.email,
            telephone: responsable.telephone,
        };

        // Soft delete
        responsable.actif = false;
        await this.responsableRepo.save(responsable);

        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'DELETE' as any,
                cible: 'ResponsableEleve',
                cibleId: responsable.id,
                description: `Relation parent-élève supprimée`,
                anciennesValeurs,
                module: 'responsables-eleves',
                severity: 'WARNING' as any,
            }, req);
        }

        logger.info(`Relation parent-élève supprimée: ${responsable.id}`);
    }

    /**
     * Récupérer les responsables pour notification (format simplifié)
     * Méthode utilitaire pour les autres services (notes, bulletins, cantine, etc.)
     */
    async getResponsablesForNotification(eleveUtilisateurId: string): Promise<Array<{
        utilisateurId: string;
        email?: string;
        telephone?: string;
        peutConsulter: boolean;
        peutPayer: boolean;
    }>> {
        const responsables = await this.responsableRepo.find({
            where: {
                enfantId: eleveUtilisateurId,
                actif: true,
            },
            select: ['utilisateurId', 'email', 'telephone', 'peutConsulter', 'peutPayer'],
        });

        return responsables.map(r => ({
            utilisateurId: r.utilisateurId,
            email: r.email,
            telephone: r.telephone,
            peutConsulter: r.peutConsulter,
            peutPayer: r.peutPayer,
        }));
    }

    /**
     * Récupérer une relation spécifique
     */
    async findOne(parentId: string, enfantId: string): Promise<ResponsableEleve> {
        const responsable = await this.responsableRepo.findOne({
            where: {
                utilisateurId: parentId,
                enfantId,
            },
            relations: ['utilisateur', 'enfant'],
        });

        if (!responsable) {
            throw new AppError('Relation parent-élève non trouvée', 404, 'RELATION_NOT_FOUND');
        }

        return responsable;
    }

    /**
     * Migrer les champs directs d'un élève vers ResponsableEleve
     * 
     * À appeler lors de la conversion préinscription → inscription.
     * Cette méthode :
     * 1. Crée des comptes Utilisateur pour les parents (si email fourni)
     * 2. Crée les liens ResponsableEleve
     * 3. Retourne le nombre de parents migrés
     * 
     * @param eleve L'élève avec des champs directs peuplés
     * @returns Objet avec nombre de parents créés et liste des responsables
     */
    async migrerDepuisChampsDirects(eleve: Eleve): Promise<{
        parentsCrees: number;
        responsables: ResponsableEleve[];
        erreurs: string[];
    }> {
        const responsables: ResponsableEleve[] = [];
        const erreurs: string[] = [];

        logger.info(`[Migration] Début migration parents pour élève ${eleve.id} (${eleve.matricule})`);

        // Structure des données à migrer
        const parentsData = [
            {
                nom: eleve.nomPere,
                email: eleve.emailPere,
                telephone: eleve.telephonePere,
                profession: eleve.professionPere,
                adresse: eleve.adressePere,
                lienParente: LienParente.PERE,
            },
            {
                nom: eleve.nomMere,
                email: eleve.emailMere,
                telephone: eleve.telephoneMere,
                profession: eleve.professionMere,
                adresse: eleve.adresseMere,
                lienParente: LienParente.MERE,
            },
            {
                nom: eleve.nomTuteur,
                email: eleve.emailTuteur,
                telephone: eleve.telephoneTuteur,
                profession: eleve.professionTuteur,
                adresse: eleve.adresseTuteur,
                lienParente: LienParente.TUTEUR_LEGAL,
            },
        ].filter(p => p.nom); // Ne garder que les parents avec un nom

        // Pour chaque parent, créer compte + lien
        for (const parentData of parentsData) {
            try {
                // Étape 1 : Chercher si un utilisateur existe déjà avec cet email
                let utilisateurParent: any = parentData.email
                    ? await this.utilisateurRepo.findOne({
                        where: { email: parentData.email },
                    })
                    : null;

                // Étape 2 : Créer le compte si n'existe pas et email fourni
                if (!utilisateurParent && parentData.email) {
                    logger.info(`[Migration] Création compte pour ${parentData.lienParente}: ${parentData.email}`);
                    
                    // Générer un mot de passe temporaire
                    const motDePasseTemp = this.genererMotDePasseTemporaire();
                    
                    const newUser = this.utilisateurRepo.create({
                        email: parentData.email,
                        nom: parentData.nom,
                        telephone: parentData.telephone,
                        role: Role.PARENT,
                        motDePasse: motDePasseTemp, // Sera hashé par le hook
                        actif: true,
                    } as any);

                    utilisateurParent = await this.utilisateurRepo.save(newUser);
                    
                    // TODO: Envoyer email avec mot de passe temporaire
                    logger.info(`[Migration] Compte créé pour ${parentData.lienParente} - Mot de passe temporaire généré`);
                }

                // Étape 3 : Créer le lien ResponsableEleve
                if (utilisateurParent) {
                    // Vérifier si le lien n'existe pas déjà
                    const existing = await this.responsableRepo.findOne({
                        where: {
                            utilisateurId: utilisateurParent.id,
                            enfantId: eleve.utilisateurId,
                        },
                    });

                    if (!existing) {
                        logger.info(`[Migration] Création lien ResponsableEleve pour ${parentData.lienParente}`);
                        
                        const responsable = this.responsableRepo.create({
                            utilisateurId: utilisateurParent.id,
                            enfantId: eleve.utilisateurId,
                            lienParente: parentData.lienParente,
                            responsableLegal: true,
                            peutConsulter: true,
                            peutPayer: true,
                            email: parentData.email,
                            telephone: parentData.telephone,
                            adresse: parentData.adresse,
                        });

                        await this.responsableRepo.save(responsable);
                        responsables.push(responsable);
                    } else {
                        logger.warn(`[Migration] Lien existe déjà pour ${parentData.lienParente}`);
                    }
                } else {
                    logger.warn(`[Migration] Pas d'email pour ${parentData.lienParente} (${parentData.nom}) - Compte non créé`);
                    erreurs.push(`Pas d'email pour ${parentData.lienParente}`);
                }
            } catch (error) {
                logger.error(`[Migration] Erreur migration ${parentData.lienParente}:`, error);
                erreurs.push(`Erreur migration ${parentData.lienParente}: ${(error as Error).message}`);
            }
        }

        logger.info(`[Migration] Terminée - ${responsables.length} parent(s) migré(s), ${erreurs.length} erreur(s)`);

        return {
            parentsCrees: responsables.length,
            responsables,
            erreurs,
        };
    }

    /**
     * Générer un mot de passe temporaire sécurisé
     */
    private genererMotDePasseTemporaire(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}

export const parentsService = new ParentsService();
export default ParentsService;
