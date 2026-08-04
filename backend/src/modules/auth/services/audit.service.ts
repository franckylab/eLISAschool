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
import UAParser from 'ua-parser-js';
import { AppDataSource } from '@database/data-source';
import { AuditLog, AuditAction, AuditSeverity } from '../entities/audit-log.entity';
import { logger } from '@common/utils/logger.util';
import { getClientIP } from '@common/utils/client-ip.util';
import { auditRelationResolverService } from '@modules/audit/services/audit-relation-resolver.service';

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
    etablissementId?: string;
    parentCible?: string;
    parentCibleId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
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
        const rawUserAgent = options.userAgent ?? req?.headers['user-agent'];
        const parsed = this.parseUserAgent(rawUserAgent);

        const sanitizedOptions = {
            ...options,
            utilisateurId: this.isValidUUID(options.utilisateurId) ? options.utilisateurId : undefined,
            cibleId: this.isValidUUID(options.cibleId) ? options.cibleId : undefined,
            severity: options.severity || AuditSeverity.INFO,
            ipAddress: options.ipAddress ?? (req ? getClientIP(req) : undefined),
            userAgent: rawUserAgent,
            navigateur: parsed.navigateur,
            systemeExploitation: parsed.systemeExploitation,
            appareil: parsed.appareil,
            champsModifies: this.calculerChampsModifies(options.anciennesValeurs, options.nouvellesValeurs),
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
            etablissementId,
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
     * Calcule la liste des champs modifiés entre deux snapshots
     */
    private calculerChampsModifies(
        anciennes?: Record<string, any>,
        nouvelles?: Record<string, any>
    ): string[] | undefined {
        if (!anciennes || !nouvelles) return undefined;
        const champs = Object.keys(nouvelles).filter(
            (cle) => JSON.stringify(nouvelles[cle]) !== JSON.stringify(anciennes[cle])
        );
        return champs.length > 0 ? champs : undefined;
    }

    private parseUserAgent(rawUA?: string): { navigateur?: string; systemeExploitation?: string; appareil?: string } {
        if (!rawUA) return {};
        const parser = new (UAParser as any)(rawUA);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const device = parser.getDevice();

        const navigateur = browser.name
            ? `${browser.name}${browser.version ? ' ' + browser.version : ''}`
            : undefined;

        const systemeExploitation = os.name
            ? `${os.name}${os.version ? ' ' + os.version : ''}`
            : undefined;

        const type = device.type || 'desktop';
        const appareil = device.model
            ? `${type} — ${device.vendor ? device.vendor + ' ' : ''}${device.model}`
            : type;

        return { navigateur, systemeExploitation, appareil };
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
        utilisateurSearch?: string;
        action?: AuditAction | AuditAction[];
        cible?: string;
        cibleId?: string;
        module?: string;
        estEchec?: boolean;
        search?: string;
        dateDebut?: Date;
        dateFin?: Date;
        severity?: AuditSeverity;
        scope?: 'entite' | 'avec-liees';
        etablissementId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ items: AuditLog[]; total: number }> {
        const qb = this.auditRepo.createQueryBuilder('a')
            .leftJoin('a.utilisateur', 'u')
            .addSelect(['u.id', 'u.email', 'u.matricule'])
            .leftJoin('u.profil', 'profil')
            .addSelect(['profil.nom', 'profil.prenom'])
            .orderBy('a.createdAt', 'DESC');

        if (options.utilisateurId) {
            qb.andWhere('a.utilisateurId = :utilisateurId', { utilisateurId: options.utilisateurId });
        }
        if (options.utilisateurSearch) {
            qb.andWhere(
                "(profil.nom ILIKE :utilisateurSearch OR profil.prenom ILIKE :utilisateurSearch OR u.email ILIKE :utilisateurSearch OR CONCAT(COALESCE(profil.prenom, ''), ' ', COALESCE(profil.nom, '')) ILIKE :utilisateurSearch)",
                { utilisateurSearch: `%${options.utilisateurSearch}%` },
            );
        }
        if (options.action) {
            const actions = Array.isArray(options.action) ? options.action : [options.action];
            qb.andWhere('a.action IN (:...actions)', { actions });
        }
        if (options.scope === 'avec-liees' && options.cible && options.cibleId) {
            const ciblesLiees = await auditRelationResolverService.resoudreEnfants(
                options.cible,
                options.cibleId,
            );

            if (ciblesLiees.length === 0) {
                qb.andWhere(
                    '((a.cible = :cible AND a.cibleId = :cibleId) OR (a.parentCible = :cible AND a.parentCibleId = :cibleId))',
                    { cible: options.cible, cibleId: options.cibleId },
                );
            } else {
                const orConditions: string[] = [
                    '(a.cible = :cible AND a.cibleId = :cibleId)',
                    '(a.parentCible = :cible AND a.parentCibleId = :cibleId)',
                ];
                const params: Record<string, any> = {
                    cible: options.cible,
                    cibleId: options.cibleId,
                };

                ciblesLiees.forEach((liee, idx) => {
                    const paramName = `lieeIds_${idx}`;
                    orConditions.push(
                        `(a.cible = :lieeCible_${idx} AND a.cibleId IN (:...${paramName}))`,
                    );
                    params[`lieeCible_${idx}`] = liee.cible;
                    params[paramName] = liee.ids;
                });

                qb.andWhere(`(${orConditions.join(' OR ')})`, params);
            }
        } else {
            if (options.cible) {
                qb.andWhere('a.cible = :cible', { cible: options.cible });
            }
            if (options.cibleId) {
                qb.andWhere('a.cibleId = :cibleId', { cibleId: options.cibleId });
            }
        }
        if (options.etablissementId) {
            qb.andWhere('a.etablissementId = :etablissementId', { etablissementId: options.etablissementId });
        }
        if (options.module) {
            qb.andWhere('a.module = :module', { module: options.module });
        }
        if (options.estEchec !== undefined) {
            qb.andWhere('a.estEchec = :estEchec', { estEchec: options.estEchec });
        }
        if (options.search) {
            // Détection automatique de date dans la recherche (DD/MM/YYYY ou YYYY-MM-DD)
            const dateMatch = options.search.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            const isoDateMatch = options.search.match(/^(\d{4})-(\d{2})-(\d{2})$/);

            if (dateMatch) {
                const [, jour, mois, annee] = dateMatch;
                const dateStr = `${annee}-${mois.padStart(2, '0')}-${jour.padStart(2, '0')}`;
                const dateDebut = new Date(`${dateStr}T00:00:00.000Z`);
                const dateFin = new Date(`${dateStr}T23:59:59.999Z`);
                if (!isNaN(dateDebut.getTime())) {
                    qb.andWhere('a.createdAt >= :searchDateDebut AND a.createdAt <= :searchDateFin', {
                        searchDateDebut: dateDebut,
                        searchDateFin: dateFin,
                    });
                }
            } else if (isoDateMatch) {
                const [, annee, mois, jour] = isoDateMatch;
                const dateStr = `${annee}-${mois}-${jour}`;
                const dateDebut = new Date(`${dateStr}T00:00:00.000Z`);
                const dateFin = new Date(`${dateStr}T23:59:59.999Z`);
                if (!isNaN(dateDebut.getTime())) {
                    qb.andWhere('a.createdAt >= :searchDateDebut AND a.createdAt <= :searchDateFin', {
                        searchDateDebut: dateDebut,
                        searchDateFin: dateFin,
                    });
                }
            } else {
                // Recherche hybride i18n : cherche dans tous les champs + labels d'actions FR/EN
                qb.andWhere(
                    `(a.description ILIKE :search
                     OR a.cible ILIKE :search
                     OR a.action::text ILIKE :search
                     OR a.ipAddress ILIKE :search
                     OR a.navigateur ILIKE :search
                     OR a."systemeExploitation" ILIKE :search
                     OR a.appareil ILIKE :search
                     OR a.erreur ILIKE :search
                     OR a.parentCible ILIKE :search
                     OR a.id::text ILIKE :search
                     OR profil.nom ILIKE :search
                     OR profil.prenom ILIKE :search
                     OR u.email ILIKE :search
                     OR a.metadata->>'entiteLabel' ILIKE :search
                     OR a.metadata->>'entiteRef' ILIKE :search
                     OR "a"."anciennesValeurs"::text ILIKE :search
                     OR "a"."nouvellesValeurs"::text ILIKE :search
                     OR ${AuditService.getActionSearchExpr()} ILIKE :search)`,
                    { search: `%${options.search}%` },
                );
            }
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

    /**
     * Expression SQL pour la recherche hybride i18n sur les actions.
     * Concatène les labels FR et EN des actions courantes pour une recherche multi-locale.
     */
    private static getActionSearchExpr(): string {
        return `CASE a.action
            WHEN 'LOGIN' THEN 'connexion login'
            WHEN 'LOGOUT' THEN 'déconnexion logout'
            WHEN 'LOGIN_FAILED' THEN 'échec connexion login failed'
            WHEN 'PASSWORD_CHANGE' THEN 'changement mot de passe password change'
            WHEN 'PASSWORD_RESET' THEN 'réinitialisation mot de passe password reset'
            WHEN 'USER_CREATE' THEN 'utilisateur créé user created'
            WHEN 'USER_UPDATE' THEN 'utilisateur modifié user updated'
            WHEN 'USER_DELETE' THEN 'utilisateur supprimé user deleted'
            WHEN 'USER_SUSPEND' THEN 'utilisateur suspendu user suspended'
            WHEN 'USER_ACTIVATE' THEN 'utilisateur activé user activated'
            WHEN 'ELEVE_CREATE' THEN 'élève créé student created'
            WHEN 'ELEVE_UPDATE' THEN 'élève modifié student updated'
            WHEN 'ELEVE_DELETE' THEN 'élève supprimé student deleted'
            WHEN 'ELEVE_INSCRIPTION' THEN 'élève inscription student enrollment'
            WHEN 'NOTE_CREATE' THEN 'note créée grade created'
            WHEN 'NOTE_UPDATE' THEN 'note modifiée grade updated'
            WHEN 'NOTE_DELETE' THEN 'note supprimée grade deleted'
            WHEN 'NOTE_VALIDATE' THEN 'note validée grade validated'
            WHEN 'BULLETIN_GENERATE' THEN 'bulletin généré report card generated'
            WHEN 'BULLETIN_UPDATE' THEN 'bulletin modifié report card updated'
            WHEN 'BULLETIN_DELETE' THEN 'bulletin supprimé report card deleted'
            WHEN 'BULLETIN_PUBLIER' THEN 'bulletin publié report card published'
            WHEN 'BULLETIN_EXPORT' THEN 'bulletin exporté report card exported'
            WHEN 'PERSONNEL_CREATE' THEN 'membre créé staff created'
            WHEN 'PERSONNEL_UPDATE' THEN 'membre modifié staff updated'
            WHEN 'PERSONNEL_DELETE' THEN 'membre supprimé staff deleted'
            WHEN 'CONTRAT_PERSONNEL_CREATE' THEN 'contrat créé contract created'
            WHEN 'CONTRAT_PERSONNEL_UPDATE' THEN 'contrat modifié contract updated'
            WHEN 'CONTRAT_PERSONNEL_DELETE' THEN 'contrat supprimé contract deleted'
            WHEN 'CLASSE_CREATE' THEN 'classe créée class created'
            WHEN 'CLASSE_UPDATE' THEN 'classe modifiée class updated'
            WHEN 'CLASSE_DELETE' THEN 'classe supprimée class deleted'
            WHEN 'MATIERE_CREATE' THEN 'matière créée subject created'
            WHEN 'MATIERE_UPDATE' THEN 'matière modifiée subject updated'
            WHEN 'MATIERE_DELETE' THEN 'matière supprimée subject deleted'
            WHEN 'PERIODE_CREATE' THEN 'période créée period created'
            WHEN 'PERIODE_UPDATE' THEN 'période modifiée period updated'
            WHEN 'PERIODE_DELETE' THEN 'période supprimée period deleted'
            WHEN 'ANNEE_SCOLAIRE_CREATE' THEN 'année scolaire créée school year created'
            WHEN 'ANNEE_SCOLAIRE_UPDATE' THEN 'année scolaire modifiée school year updated'
            WHEN 'ANNEE_SCOLAIRE_DELETE' THEN 'année scolaire supprimée school year deleted'
            WHEN 'ANNEE_SCOLAIRE_ACTIVATE' THEN 'année scolaire activée school year activated'
            WHEN 'CONFIG_CHANGE' THEN 'configuration modifiée config changed'
            WHEN 'MODULE_ACTIVATE' THEN 'module activé module activated'
            WHEN 'MODULE_DEACTIVATE' THEN 'module désactivé module deactivated'
            WHEN 'VALIDATION_APPROUVE' THEN 'validation approuvée validation approved'
            WHEN 'VALIDATION_REJETE' THEN 'validation rejetée validation rejected'
            WHEN 'UNITE_CREATE' THEN 'unité créée unit created'
            WHEN 'UNITE_UPDATE' THEN 'unité modifiée unit updated'
            WHEN 'UNITE_DELETE' THEN 'unité supprimée unit deleted'
            WHEN 'POSTE_CREATE' THEN 'poste créé position created'
            WHEN 'POSTE_UPDATE' THEN 'poste modifié position updated'
            WHEN 'POSTE_DELETE' THEN 'poste supprimé position deleted'
            WHEN 'FONCTION_CREATE' THEN 'fonction créée function created'
            WHEN 'FONCTION_UPDATE' THEN 'fonction modifiée function updated'
            WHEN 'FONCTION_DELETE' THEN 'fonction supprimée function deleted'
            WHEN 'HIERARCHIE_CREATE' THEN 'hiérarchie créée hierarchy created'
            WHEN 'HIERARCHIE_UPDATE' THEN 'hiérarchie modifiée hierarchy updated'
            WHEN 'HIERARCHIE_DELETE' THEN 'hiérarchie supprimée hierarchy deleted'
            WHEN 'ACCESS_DENIED' THEN 'accès refusé access denied'
            WHEN 'ROLE_CREATE' THEN 'rôle créé role created'
            WHEN 'ROLE_UPDATE' THEN 'rôle modifié role updated'
            WHEN 'ROLE_DELETE' THEN 'rôle supprimé role deleted'
            WHEN 'ROLE_ASSIGN' THEN 'rôle attribué role assigned'
            WHEN 'ROLE_REVOKE' THEN 'rôle révoqué role revoked'
            WHEN 'PAYMENT_RECEIVE' THEN 'paiement reçu payment received'
            WHEN 'DEPENSE_CREATE' THEN 'dépense créée expense created'
            WHEN 'DEPENSE_VALIDER' THEN 'dépense validée expense validated'
            WHEN 'PAIEMENT_CREATE' THEN 'paiement créé payment created'
            WHEN 'PAIEMENT_VALIDER' THEN 'paiement validé payment validated'
            WHEN 'PAIEMENT_ANNULER' THEN 'paiement annulé payment cancelled'
            WHEN 'DATA_EXPORT' THEN 'export données data export'
            WHEN 'DATA_IMPORT' THEN 'import données data import'
            ELSE lower(replace(a.action::text, '_', ' '))
        END`;
    }

    /**
     * Récupère un log d'audit par son id
     */
    async findLogById(id: string): Promise<AuditLog | null> {
        return this.auditRepo.createQueryBuilder('a')
            .leftJoin('a.utilisateur', 'u')
            .addSelect(['u.id', 'u.email', 'u.matricule'])
            .leftJoin('u.profil', 'profil')
            .addSelect(['profil.nom', 'profil.prenom'])
            .where('a.id = :id', { id })
            .getOne();
    }
}

export const auditService = new AuditService();
export default AuditService;
