/**
 * ==================================
 * eLISAschool - Helpers Audit pour Modules
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Description: Fonctions utilitaires pour ajouter l'audit aux modules manquants
 */

import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction, AuditSeverity } from '@modules/auth/entities/audit-log.entity';
import { logger } from '@common/utils/logger.util';

/**
 * Helper pour auditer les actions sur les sondages
 */
export const auditSondage = {
    async creation(
        utilisateurId: string,
        sondageId: string,
        titre: string,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.SONDAGE_CREATE,
            severity: AuditSeverity.INFO,
            cible: 'Sondage',
            cibleId: sondageId,
            description: `Sondage créé: ${titre}`,
            module: 'sondages',
        });
    },

    async modification(
        utilisateurId: string,
        sondageId: string,
        modifications: Record<string, any>,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.SONDAGE_EDIT,
            severity: AuditSeverity.INFO,
            cible: 'Sondage',
            cibleId: sondageId,
            description: 'Sondage modifié',
            nouvellesValeurs: modifications,
            module: 'sondages',
        });
    },

    async suppression(
        utilisateurId: string,
        sondageId: string,
        titre: string,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.SONDAGE_DELETE,
            severity: AuditSeverity.WARNING,
            cible: 'Sondage',
            cibleId: sondageId,
            description: `Sondage supprimé: ${titre}`,
            module: 'sondages',
        });
    },

    async activation(
        utilisateurId: string,
        sondageId: string,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.SONDAGE_ACTIVATION,
            severity: AuditSeverity.INFO,
            cible: 'Sondage',
            cibleId: sondageId,
            description: 'Sondage activé',
            module: 'sondages',
        });
    },
};

/**
 * Helper pour auditer les actions sur les annonces
 */
export const auditAnnonce = {
    async creation(
        utilisateurId: string,
        annonceId: string,
        titre: string,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.ANNONCE_CREATE,
            severity: AuditSeverity.INFO,
            cible: 'Annonce',
            cibleId: annonceId,
            description: `Annonce créée: ${titre}`,
            module: 'annonces',
        });
    },

    async modification(
        utilisateurId: string,
        annonceId: string,
        modifications: Record<string, any>,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.ANNONCE_EDIT,
            severity: AuditSeverity.INFO,
            cible: 'Annonce',
            cibleId: annonceId,
            description: 'Annonce modifiée',
            nouvellesValeurs: modifications,
            module: 'annonces',
        });
    },

    async suppression(
        utilisateurId: string,
        annonceId: string,
        titre: string,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.ANNONCE_DELETE,
            severity: AuditSeverity.WARNING,
            cible: 'Annonce',
            cibleId: annonceId,
            description: `Annonce supprimée: ${titre}`,
            module: 'annonces',
        });
    },

    async publication(
        utilisateurId: string,
        annonceId: string,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.ANNONCE_PUBLICATION,
            severity: AuditSeverity.INFO,
            cible: 'Annonce',
            cibleId: annonceId,
            description: 'Annonce publiée',
            module: 'annonces',
        });
    },
};

/**
 * Helper pour auditer les actions sur la gamification
 */
export const auditGamification = {
    async pointsAttribues(
        utilisateurId: string,
        cibleId: string,
        points: number,
        raison: string,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.GAMIFICATION_POINTS,
            severity: AuditSeverity.INFO,
            cible: 'Gamification',
            cibleId,
            description: `${points} points attribués: ${raison}`,
            nouvellesValeurs: { points, raison },
            module: 'gamification',
        });
    },

    async badgeAttribue(
        utilisateurId: string,
        cibleId: string,
        badgeId: string,
        badgeNom: string,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.GAMIFICATION_BADGE,
            severity: AuditSeverity.INFO,
            cible: 'Gamification',
            cibleId,
            description: `Badge attribué: ${badgeNom}`,
            nouvellesValeurs: { badgeId, badgeNom },
            module: 'gamification',
        });
    },

    async classementConsulte(
        utilisateurId: string,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.GAMIFICATION_CLASSEMENT,
            severity: AuditSeverity.INFO,
            cible: 'Gamification',
            cibleId: utilisateurId,
            description: 'Classement consulté',
            module: 'gamification',
        });
    },
};

/**
 * Helper pour auditer les actions sur la santé
 */
export const auditSante = {
    async incidentCree(
        utilisateurId: string,
        incidentId: string,
        gravite: string,
        nature: string,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.SANTE_INCIDENT,
            severity: gravite === 'HAUTE' || gravite === 'CRITIQUE' ? AuditSeverity.CRITICAL : AuditSeverity.WARNING,
            cible: 'Incident Santé',
            cibleId: incidentId,
            description: `Incident de santé créé: ${gravite} - ${nature}`,
            nouvellesValeurs: { gravite, nature },
            module: 'sante',
        });
    },

    async visiteEnregistree(
        utilisateurId: string,
        visiteId: string,
        typeVisite: string,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.SANTE_VISITE,
            severity: AuditSeverity.INFO,
            cible: 'Visite Santé',
            cibleId: visiteId,
            description: `Visite enregistrée: ${typeVisite}`,
            module: 'sante',
        });
    },

    async consultationMedicale(
        utilisateurId: string,
        consultationId: string,
        etablissementId?: string
    ): Promise<void> {
        await auditService.log({
            utilisateurId,
            action: AuditAction.SANTE_CONSULTATION,
            severity: AuditSeverity.WARNING,
            cible: 'Consultation Médicale',
            cibleId: consultationId,
            description: 'Consultation médicale enregistrée',
            module: 'sante',
        });
    },
};

export {
    auditSondage,
    auditAnnonce,
    auditGamification,
    auditSante,
};
