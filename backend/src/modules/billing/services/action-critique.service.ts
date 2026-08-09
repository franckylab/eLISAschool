/**
 * ==================================
 * eLISAschool - Service ActionCritique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Workflow d'approbation 2 facteurs (MFA) pour les actions sensibles
 * de la plateforme eLISAschool.
 *
 * Flux complet :
 *   1. demanderAction() → EN_ATTENTE (demandeur initie)
 *   2. approuverAction() → APPROUVEE (2ᵉ admin + code TOTP vérifié)
 *      OU rejeterAction() → REJETEE (avec motif)
 *   3. executerAction() → EXECUTEE (action exécutée sur le système)
 *   4. expirerActionsObsoletes() → EXPIREE (après 24h sans approbation)
 *
 * Refonte SaaS v7 — Lot F.2
 */

import crypto from 'crypto';
import { Repository, FindOptionsWhere, Brackets } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    ActionCritique,
    TypeActionCritique,
    StatutActionCritique,
    ACTION_CRITIQUE_EXPIRATION_HEURES,
    ACTION_CRITIQUE_MAX_TENTATIVES,
} from '../entities/action-critique.entity';
import { MFAService } from '@modules/auth/services/mfa.service';
import { AuditService } from '@modules/auth/services/audit.service';
import { AuditAction, AuditSeverity } from '@modules/auth/entities/audit-log.entity';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Request } from 'express';

// ==========================================
// Types
// ==========================================

export interface DemanderActionCritiqueDTO {
    typeAction: TypeActionCritique;
    payload: Record<string, unknown>;
    raison?: string;
    cibleType?: string;
    cibleId?: string;
    etablissementId?: string;
}

export interface ApprouverActionCritiqueDTO {
    codeMFA: string;
    commentaire?: string;
}

export interface RejeterActionCritiqueDTO {
    motif: string;
}

export interface ListerActionsCritiquesFilters {
    statut?: StatutActionCritique;
    typeAction?: TypeActionCritique;
    demandeurId?: string;
    etablissementId?: string;
    page?: number;
    limit?: number;
}

export interface ActionsCritiquesListeResult {
    items: ActionCritique[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    enAttente: number;
    approuvees: number;
    rejetees: number;
    executees: number;
    expirees: number;
}

// ==========================================
// Service
// ==========================================

export class ActionCritiqueService {
    private actionRepo: Repository<ActionCritique>;
    private mfaService: MFAService;
    private auditService: AuditService;

    constructor() {
        this.actionRepo = AppDataSource.getRepository(ActionCritique);
        this.mfaService = new MFAService();
        this.auditService = new AuditService();
    }

    // ─── DEMANDER ────────────────────────────────────────────────

    /**
     * Initie une demande d'action critique.
     * Crée l'entrée avec statut EN_ATTENTE et expiration à 24h.
     */
    async demanderAction(
        dto: DemanderActionCritiqueDTO,
        demandeurId: string,
        req?: Request,
    ): Promise<ActionCritique> {
        // Vérifier qu'il n'y a pas déjà une action en attente du même type pour la même cible
        if (dto.cibleType && dto.cibleId) {
            const existante = await this.actionRepo.findOne({
                where: {
                    typeAction: dto.typeAction,
                    cibleType: dto.cibleType,
                    cibleId: dto.cibleId,
                    statut: StatutActionCritique.EN_ATTENTE,
                },
            });

            if (existante) {
                throw new AppError(
                    `Une action '${dto.typeAction}' est déjà en attente pour cette cible`,
                    409,
                    'ACTION_CRITIQUE_EXISTANTE',
                );
            }
        }

        // Calculer la date d'expiration
        const dateExpiration = new Date();
        dateExpiration.setHours(dateExpiration.getHours() + ACTION_CRITIQUE_EXPIRATION_HEURES);

        const action = this.actionRepo.create({
            typeAction: dto.typeAction,
            statut: StatutActionCritique.EN_ATTENTE,
            payload: dto.payload,
            demandeurId,
            etablissementId: dto.etablissementId,
            cibleType: dto.cibleType,
            cibleId: dto.cibleId,
            raison: dto.raison,
            dateExpiration,
            demandeurIp: req ? this.getClientIP(req) : undefined,
            demandeurUserAgent: req?.headers['user-agent'],
        });

        await this.actionRepo.save(action);

        // Audit
        await this.auditService.log({
            utilisateurId: demandeurId,
            action: AuditAction.ACTION_CRITIQUE_DEMANDEE,
            severity: AuditSeverity.WARNING,
            cible: dto.cibleType || 'action_critique',
            cibleId: dto.cibleId || action.id,
            description: `Action critique demandée : ${action.typeActionLabel}${dto.raison ? ` — ${dto.raison}` : ''}`,
            module: 'plateforme',
            nouvellesValeurs: { typeAction: dto.typeAction, payload: dto.payload },
        }, req);

        logger.info(`[ActionCritique] Demande créée : ${dto.typeAction} par ${demandeurId.substring(0, 8)}`);

        return action;
    }

    // ─── LISTE ───────────────────────────────────────────────────

    /**
     * Liste les actions critiques avec filtres et pagination.
     */
    async listerActions(
        filters: ListerActionsCritiquesFilters,
    ): Promise<ActionsCritiquesListeResult> {
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 100);
        const offset = (page - 1) * limit;

        const qb = this.actionRepo.createQueryBuilder('ac')
            .leftJoinAndSelect('ac.demandeur', 'demandeur')
            .leftJoinAndSelect('ac.approuveur', 'approuveur')
            .leftJoinAndSelect('ac.etablissement', 'etablissement');

        // Filtres
        if (filters.statut) {
            qb.andWhere('ac.statut = :statut', { statut: filters.statut });
        }
        if (filters.typeAction) {
            qb.andWhere('ac.typeAction = :typeAction', { typeAction: filters.typeAction });
        }
        if (filters.demandeurId) {
            qb.andWhere('ac.demandeurId = :demandeurId', { demandeurId: filters.demandeurId });
        }
        if (filters.etablissementId) {
            qb.andWhere('ac.etablissementId = :etablissementId', { etablissementId: filters.etablissementId });
        }

        qb.orderBy('ac.dateDemande', 'DESC')
            .take(limit)
            .skip(offset);

        const [items, total] = await qb.getManyAndCount();

        // Compteurs par statut
        const compteurQb = this.actionRepo.createQueryBuilder('ac')
            .select('ac.statut', 'statut')
            .addSelect('COUNT(*)', 'count')
            .groupBy('ac.statut');

        const compteurs = await compteurQb.getRawMany<{ statut: string; count: string }>();

        const stats: Record<string, number> = {};
        for (const c of compteurs) {
            stats[c.statut] = parseInt(c.count, 10);
        }

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            enAttente: stats[StatutActionCritique.EN_ATTENTE] || 0,
            approuvees: stats[StatutActionCritique.APPROUVEE] || 0,
            rejetees: stats[StatutActionCritique.REJETEE] || 0,
            executees: stats[StatutActionCritique.EXECUTEE] || 0,
            expirees: stats[StatutActionCritique.EXPIREE] || 0,
        };
    }

    // ─── DÉTAIL ──────────────────────────────────────────────────

    /**
     * Récupère le détail d'une action critique.
     */
    async getAction(id: string): Promise<ActionCritique> {
        const action = await this.actionRepo.findOne({
            where: { id },
            relations: ['demandeur', 'approuveur', 'etablissement'],
        });

        if (!action) {
            throw new AppError('Action critique introuvable', 404, 'ACTION_CRITIQUE_NOT_FOUND');
        }

        return action;
    }

    // ─── APPROUVER (2F MFA) ─────────────────────────────────────

    /**
     * Approuve une action critique avec vérification MFA TOTP.
     * L'approbateur doit être un SUPER_ADMIN différent du demandeur.
     * Le code TOTP est vérifié contre la config MFA de l'approbateur.
     */
    async approuverAction(
        id: string,
        approuveurId: string,
        dto: ApprouverActionCritiqueDTO,
        req?: Request,
    ): Promise<ActionCritique> {
        const action = await this.getAction(id);

        // Vérifications
        if (!action.estEnAttente) {
            throw new AppError(
                `L'action n'est pas en attente d'approbation (statut: ${action.statut})`,
                400,
                'ACTION_CRITIQUE_INVALIDE',
            );
        }

        if (action.estExpiree) {
            // Marquer comme expirée
            action.statut = StatutActionCritique.EXPIREE;
            await this.actionRepo.save(action);
            throw new AppError(
                'Cette action critique a expiré. Veuillez créer une nouvelle demande.',
                410,
                'ACTION_CRITIQUE_EXPIREE',
            );
        }

        if (action.tentativesApprobation >= ACTION_CRITIQUE_MAX_TENTATIVES) {
            throw new AppError(
                `Nombre maximum de tentatives d'approbation atteint (${ACTION_CRITIQUE_MAX_TENTATIVES}). Action bloquée.`,
                423,
                'ACTION_CRITIQUE_BLOQUEE',
            );
        }

        if (action.demandeurId === approuveurId) {
            throw new AppError(
                'Le demandeur ne peut pas approuver sa propre action. Un 2ᵉ approbateur est requis.',
                403,
                'AUTO_APPROBATION_INTERDITE',
            );
        }

        // Vérifier que l'approbateur a le MFA activé
        const mfaEnabled = await this.mfaService.isMFAEnabled(approuveurId);
        if (!mfaEnabled) {
            throw new AppError(
                'Le MFA doit être activé pour approuver une action critique.',
                403,
                'MFA_REQUIS_POUR_APPROBATION',
            );
        }

        // Vérifier le code TOTP
        const verification = await this.mfaService.verifierMFA(approuveurId, dto.codeMFA);
        if (!verification.success) {
            // Incrémenter les tentatives
            action.tentativesApprobation += 1;
            await this.actionRepo.save(action);

            // Audit échec
            await this.auditService.log({
                utilisateurId: approuveurId,
                action: AuditAction.ACTION_CRITIQUE_MFA_ECHEC,
                severity: AuditSeverity.WARNING,
                cible: 'action_critique',
                cibleId: id,
                description: `Échec vérification MFA lors de l'approbation (tentative ${action.tentativesApprobation}/${ACTION_CRITIQUE_MAX_TENTATIVES})`,
                module: 'plateforme',
                estEchec: true,
            }, req);

            throw new AppError(
                `Code MFA invalide. Tentative ${action.tentativesApprobation}/${ACTION_CRITIQUE_MAX_TENTATIVES}.`,
                401,
                'MFA_CODE_INVALIDE',
            );
        }

        // Hash de preuve MFA (timestamp + userId + code hash)
        const mfaHash = crypto
            .createHmac('sha256', process.env.JWT_SECRET || 'elisaschool-jwt-secret-default')
            .update(`${approuveurId}:${action.id}:${Date.now()}`)
            .digest('hex');

        // Approuver
        action.statut = StatutActionCritique.APPROUVEE;
        action.approuveurId = approuveurId;
        action.dateApprobation = new Date();
        action.mfaVerificationHash = mfaHash;
        action.approuveurIp = req ? this.getClientIP(req) : undefined;
        action.approuveurUserAgent = req?.headers?.['user-agent'];

        await this.actionRepo.save(action);

        // Audit succès
        await this.auditService.log({
            utilisateurId: approuveurId,
            action: AuditAction.ACTION_CRITIQUE_APPROUVEE,
            severity: AuditSeverity.CRITICAL,
            cible: action.cibleType || 'action_critique',
            cibleId: action.cibleId || action.id,
            description: `Action critique approuvée : ${action.typeActionLabel} (par ${approuveurId.substring(0, 8)})`,
            module: 'plateforme',
            nouvellesValeurs: { typeAction: action.typeAction, approuveurId },
        }, req);

        logger.info(`[ActionCritique] Action approuvée : ${action.typeAction} par ${approuveurId.substring(0, 8)}`);

        return action;
    }

    // ─── EXÉCUTER ────────────────────────────────────────────────

    /**
     * Marque l'action comme exécutée après que l'opération a été effectuée.
     * Le controller appelle cette méthode après avoir exécuté l'action réelle.
     */
    async executerAction(
        id: string,
        resultat?: Record<string, unknown>,
        req?: Request,
    ): Promise<ActionCritique> {
        const action = await this.getAction(id);

        if (action.statut !== StatutActionCritique.APPROUVEE) {
            throw new AppError(
                `L'action doit être approuvée avant exécution (statut actuel: ${action.statut})`,
                400,
                'ACTION_CRITIQUE_NON_APPROUVEE',
            );
        }

        action.statut = StatutActionCritique.EXECUTEE;
        action.dateExecution = new Date();
        action.resultatExecution = resultat || { succes: true };

        await this.actionRepo.save(action);

        // Audit
        await this.auditService.log({
            utilisateurId: action.approuveurId,
            action: AuditAction.ACTION_CRITIQUE_EXECUTEE,
            severity: AuditSeverity.CRITICAL,
            cible: action.cibleType || 'action_critique',
            cibleId: action.cibleId || action.id,
            description: `Action critique exécutée : ${action.typeActionLabel}`,
            module: 'plateforme',
            nouvellesValeurs: { resultat },
        }, req);

        logger.info(`[ActionCritique] Action exécutée : ${action.typeAction}`);

        return action;
    }

    // ─── REJETER ─────────────────────────────────────────────────

    /**
     * Rejette une action critique avec motif obligatoire.
     */
    async rejeterAction(
        id: string,
        rejecteurId: string,
        dto: RejeterActionCritiqueDTO,
        req?: Request,
    ): Promise<ActionCritique> {
        const action = await this.getAction(id);

        if (!action.estEnAttente) {
            throw new AppError(
                `Seules les actions en attente peuvent être rejetées (statut: ${action.statut})`,
                400,
                'ACTION_CRITIQUE_INVALIDE',
            );
        }

        action.statut = StatutActionCritique.REJETEE;
        action.approuveurId = rejecteurId;
        action.motifRejet = dto.motif;
        action.dateApprobation = new Date();

        await this.actionRepo.save(action);

        // Audit
        await this.auditService.log({
            utilisateurId: rejecteurId,
            action: AuditAction.ACTION_CRITIQUE_REJETEE,
            severity: AuditSeverity.WARNING,
            cible: action.cibleType || 'action_critique',
            cibleId: action.cibleId || action.id,
            description: `Action critique rejetée : ${action.typeActionLabel} — Motif : ${dto.motif}`,
            module: 'plateforme',
            nouvellesValeurs: { motif: dto.motif },
        }, req);

        logger.info(`[ActionCritique] Action rejetée : ${action.typeAction} par ${rejecteurId.substring(0, 8)}`);

        return action;
    }

    // ─── ANNULER (par le demandeur) ─────────────────────────────

    /**
     * Annule une action critique (uniquement par le demandeur initial).
     */
    async annulerAction(
        id: string,
        demandeurId: string,
        req?: Request,
    ): Promise<ActionCritique> {
        const action = await this.getAction(id);

        if (!action.estEnAttente) {
            throw new AppError(
                `Seules les actions en attente peuvent être annulées (statut: ${action.statut})`,
                400,
                'ACTION_CRITIQUE_INVALIDE',
            );
        }

        if (action.demandeurId !== demandeurId) {
            throw new AppError(
                'Seul le demandeur initial peut annuler une action critique.',
                403,
                'ANNULATION_NON_AUTORISEE',
            );
        }

        action.statut = StatutActionCritique.ANNULEE;

        await this.actionRepo.save(action);

        // Audit
        await this.auditService.log({
            utilisateurId: demandeurId,
            action: AuditAction.ACTION_CRITIQUE_ANNULEE,
            severity: AuditSeverity.INFO,
            cible: action.cibleType || 'action_critique',
            cibleId: action.cibleId || action.id,
            description: `Action critique annulée par le demandeur : ${action.typeActionLabel}`,
            module: 'plateforme',
        }, req);

        logger.info(`[ActionCritique] Action annulée : ${action.typeAction}`);

        return action;
    }

    // ─── EXPIRATION ──────────────────────────────────────────────

    /**
     * Marque toutes les actions en attente ayant dépassé leur date d'expiration.
     * Appelée par un cron job.
     */
    async expirerActionsObsoletes(): Promise<number> {
        const result = await this.actionRepo
            .createQueryBuilder()
            .update(ActionCritique)
            .set({ statut: StatutActionCritique.EXPIREE })
            .where('statut = :statut', { statut: StatutActionCritique.EN_ATTENTE })
            .andWhere('dateExpiration < NOW()')
            .execute();

        const nbExpirees = result.affected || 0;

        if (nbExpirees > 0) {
            logger.info(`[ActionCritique] ${nbExpirees} action(s) critique(s) expirée(s)`);

            // Audit groupé
            await this.auditService.log({
                action: AuditAction.ACTION_CRITIQUE_EXPIREE,
                severity: AuditSeverity.WARNING,
                description: `${nbExpirees} action(s) critique(s) expirée(s) automatiquement`,
                module: 'plateforme',
            });
        }

        return nbExpirees;
    }

    // ─── STATISTIQUES ────────────────────────────────────────────

    /**
     * Statistiques globales des actions critiques.
     */
    async getStatistiques(): Promise<{
        total: number;
        parStatut: Record<string, number>;
        parType: Record<string, number>;
        delaiMoyenApprobationHeures: number | null;
    }> {
        // Par statut
        const parStatutRaw = await this.actionRepo
            .createQueryBuilder('ac')
            .select('ac.statut', 'statut')
            .addSelect('COUNT(*)', 'count')
            .groupBy('ac.statut')
            .getRawMany<{ statut: string; count: string }>();

        const parStatut: Record<string, number> = {};
        for (const r of parStatutRaw) {
            parStatut[r.statut] = parseInt(r.count, 10);
        }

        // Par type
        const parTypeRaw = await this.actionRepo
            .createQueryBuilder('ac')
            .select('ac.typeAction', 'typeAction')
            .addSelect('COUNT(*)', 'count')
            .groupBy('ac.typeAction')
            .getRawMany<{ typeAction: string; count: string }>();

        const parType: Record<string, number> = {};
        for (const r of parTypeRaw) {
            parType[r.typeAction] = parseInt(r.count, 10);
        }

        // Délai moyen d'approbation (en heures)
        const delaiRaw = await this.actionRepo
            .createQueryBuilder('ac')
            .select('AVG(EXTRACT(EPOCH FROM (ac.dateApprobation - ac.dateDemande)) / 3600)', 'delaiMoyen')
            .where('ac.statut IN (:...statuts)', {
                statuts: [StatutActionCritique.APPROUVEE, StatutActionCritique.EXECUTEE],
            })
            .andWhere('ac.dateApprobation IS NOT NULL')
            .getRawOne<{ delaiMoyen: string | null }>();

        const total = Object.values(parStatut).reduce((sum, n) => sum + n, 0);

        return {
            total,
            parStatut,
            parType,
            delaiMoyenApprobationHeures: delaiRaw?.delaiMoyen
                ? parseFloat(parseFloat(delaiRaw.delaiMoyen).toFixed(2))
                : null,
        };
    }

    // ─── HELPERS ──────────────────────────────────────────────────

    private getClientIP(req: Request): string {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
            return ips.split(',')[0].trim();
        }
        return req.socket.remoteAddress || '';
    }
}

// Singleton
export const actionCritiqueService = new ActionCritiqueService();
