/**
 * ==================================
 * eLISAschool - Service d'Audit
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Journalisation sécurisée des actions sensibles
 */

import { Repository } from 'typeorm';
import { Request } from 'express';
import { AppDataSource } from '@database/data-source';
import { AuditLog, AuditAction, AuditSeverity } from '../entities/audit-log.entity';
import { logger } from '@common/utils/logger.util';

// Réexporter les enums pour utilisation dans les controllers
export { AuditAction, AuditSeverity } from '../entities/audit-log.entity';

/**
 * Options pour créer une entrée d'audit
 */
export interface AuditOptions {
    utilisateurId?: string;
    action: AuditAction;
    severity?: AuditSeverity;
    cible?: string;
    cibleId?: string;
    description?: string;
    anciennesValeurs?: Record<string, any>;
    nouvellesValeurs?: Record<string, any>;
    module?: string;
    estEchec?: boolean;
    erreur?: string;
}

/**
 * Service d'audit pour la journalisation des actions sensibles
 */
export class AuditService {
    private auditRepo: Repository<AuditLog>;

    constructor() {
        this.auditRepo = AppDataSource.getRepository(AuditLog);
    }

    /**
     * Enregistre une action dans le log d'audit
     */
    async log(options: AuditOptions, req?: Request): Promise<AuditLog> {
        const sanitizedOptions = {
            ...options,
            utilisateurId: this.isValidUUID(options.utilisateurId) ? options.utilisateurId : undefined,
            cibleId: this.isValidUUID(options.cibleId) ? options.cibleId : undefined,
            severity: options.severity || AuditSeverity.INFO,
            ipAddress: req ? this.getClientIP(req) : undefined,
            userAgent: req?.headers['user-agent'],
        };

        const auditLog = this.auditRepo.create(sanitizedOptions);

        await this.auditRepo.save(auditLog);

        // Log aussi dans Winston pour backup
        const logLevel = options.estEchec ? 'warn' : 'info';
        logger[logLevel](`[AUDIT] ${options.action}: ${options.description || ''}`);

        return auditLog;
    }

    /**
     * Raccourci pour les connexions
     */
    async logLogin(utilisateurId: string, success: boolean, req?: Request, erreur?: string): Promise<void> {
        await this.log({
            utilisateurId: success ? utilisateurId : undefined,
            action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
            severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
            description: success ? 'Connexion réussie' : `Échec de connexion: ${erreur}`,
            estEchec: !success,
            erreur,
            module: 'auth',
        }, req);
    }

    /**
     * Raccourci pour les changements de mot de passe
     */
    async logPasswordChange(utilisateurId: string, req?: Request): Promise<void> {
        await this.log({
            utilisateurId,
            action: AuditAction.PASSWORD_CHANGE,
            severity: AuditSeverity.WARNING,
            description: 'Changement de mot de passe',
            module: 'auth',
        }, req);
    }

    /**
     * Raccourci pour les modifications d'entités
     */
    async logEntityChange(
        action: AuditAction,
        utilisateurId: string,
        cible: string,
        cibleId: string,
        anciennesValeurs?: Record<string, any>,
        nouvellesValeurs?: Record<string, any>,
        module?: string,
        req?: Request
    ): Promise<void> {
        await this.log({
            utilisateurId,
            action,
            severity: AuditSeverity.WARNING,
            cible,
            cibleId,
            description: `Modification de ${cible}`,
            anciennesValeurs,
            nouvellesValeurs,
            module: module || cible,
        }, req);
    }

    /**
     * Raccourci pour audit de configuration
     */
    async logConfigChange(
        utilisateurId: string,
        cle: string,
        ancienneValeur?: any,
        nouvelleValeur?: any,
        etablissementId?: string,
        req?: Request
    ): Promise<void> {
        await this.log({
            utilisateurId,
            action: AuditAction.CONFIG_CHANGE,
            severity: AuditSeverity.WARNING,
            cible: 'configuration',
            cibleId: cle,
            description: `Modification config: ${cle}`,
            anciennesValeurs: { [cle]: ancienneValeur },
            nouvellesValeurs: { [cle]: nouvelleValeur },
            module: 'configuration',
        }, req);
    }

    /**
     * Raccourci pour audit de préférences utilisateur
     */
    async logPreferenceChange(
        utilisateurId: string,
        cle: string,
        action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESET',
        ancienneValeur?: any,
        nouvelleValeur?: any,
        req?: Request
    ): Promise<void> {
        await this.log({
            utilisateurId,
            action: action === 'RESET' ? AuditAction.PREFERENCE_RESET :
                    action === 'DELETE' ? AuditAction.PREFERENCE_DELETE :
                    action === 'CREATE' ? AuditAction.PREFERENCE_CREATE :
                    AuditAction.PREFERENCE_UPDATE,
            severity: AuditSeverity.INFO,
            cible: 'preferences',
            cibleId: cle,
            description: `Préférence ${action.toLowerCase()}: ${cle}`,
            anciennesValeurs: ancienneValeur ? { [cle]: ancienneValeur } : undefined,
            nouvellesValeurs: nouvelleValeur ? { [cle]: nouvelleValeur } : undefined,
            module: 'preferences',
        }, req);
    }

    /**
     * Récupérer l'historique d'audit pour une entité
     */
    async getAuditHistory(
        cibleId: string,
        options?: {
            limit?: number;
            page?: number;
            actions?: AuditAction[];
            dateDebut?: Date;
            dateFin?: Date;
        }
    ): Promise<{ items: AuditLog[]; total: number; page: number; totalPages: number }> {
        const { limit = 50, page = 1, actions, dateDebut, dateFin } = options || {};
        const offset = (page - 1) * limit;

        const where: any = { cibleId };

        if (actions && actions.length > 0) {
            where.action = actions;
        }

        if (dateDebut || dateFin) {
            where.createdAt = {};
            if (dateDebut) where.createdAt['>='] = dateDebut;
            if (dateFin) where.createdAt['<='] = dateFin;
        }

        const [items, total] = await this.auditRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });

        return {
            items,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Valide qu'une chaîne est un UUID v4
     */
    private isValidUUID(value?: string): value is string {
        if (!value) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    }

    /**
     * Extraire l'adresse IP du client
     */
    private getClientIP(req: Request): string {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        return req.ip || req.socket?.remoteAddress || 'unknown';
    }

    /**
     * Raccourci pour les accès refusés
     */
    async logAccessDenied(utilisateurId: string | undefined, ressource: string, req?: Request): Promise<void> {
        await this.log({
            utilisateurId,
            action: AuditAction.ACCESS_DENIED,
            severity: AuditSeverity.WARNING,
            description: `Accès refusé à ${ressource}`,
            estEchec: true,
        }, req);
    }

    /**
     * Méthode générique pour les opérations CRUD
     * Simplifie l'instrumentation des services
     */
    async logCRUD(
        operation: 'CREATE' | 'UPDATE' | 'DELETE',
        entityType: string,
        utilisateurId: string,
        entityId: string,
        anciennesValeurs?: Record<string, any>,
        nouvellesValeurs?: Record<string, any>,
        req?: Request
    ): Promise<void> {
        const actionMap: Record<string, AuditAction> = {
            'CREATE': AuditAction[`${entityType.toUpperCase()}_CREATE` as keyof typeof AuditAction],
            'UPDATE': AuditAction[`${entityType.toUpperCase()}_UPDATE` as keyof typeof AuditAction],
            'DELETE': AuditAction[`${entityType.toUpperCase()}_DELETE` as keyof typeof AuditAction],
        };

        const action = actionMap[operation] || AuditAction.USER_UPDATE; // Fallback
        const severity = operation === 'DELETE' ? AuditSeverity.WARNING : AuditSeverity.INFO;

        await this.logEntityChange(
            action,
            utilisateurId,
            entityType,
            entityId,
            anciennesValeurs,
            nouvellesValeurs,
            undefined,
            req
        );
    }

    /**
     * Récupère les logs d'audit avec filtres
     */
    async getLogs(options: {
        utilisateurId?: string;
        action?: AuditAction;
        cible?: string;
        dateDebut?: Date;
        dateFin?: Date;
        severity?: AuditSeverity;
        limit?: number;
        offset?: number;
    }): Promise<{ items: AuditLog[]; total: number }> {
        const qb = this.auditRepo.createQueryBuilder('a')
            .leftJoinAndSelect('a.utilisateur', 'u')
            .orderBy('a.createdAt', 'DESC');

        if (options.utilisateurId) {
            qb.andWhere('a.utilisateurId = :utilisateurId', { utilisateurId: options.utilisateurId });
        }
        if (options.action) {
            qb.andWhere('a.action = :action', { action: options.action });
        }
        if (options.cible) {
            qb.andWhere('a.cible = :cible', { cible: options.cible });
        }
        if (options.severity) {
            qb.andWhere('a.severity = :severity', { severity: options.severity });
        }
        if (options.dateDebut) {
            qb.andWhere('a.createdAt >= :dateDebut', { dateDebut: options.dateDebut });
        }
        if (options.dateFin) {
            qb.andWhere('a.createdAt <= :dateFin', { dateFin: options.dateFin });
        }

        const [items, total] = await qb
            .skip(options.offset || 0)
            .take(options.limit || 50)
            .getManyAndCount();

        return { items, total };
    }
}

export const auditService = new AuditService();
export default AuditService;
