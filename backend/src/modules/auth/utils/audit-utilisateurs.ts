import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction, AuditSeverity } from '@modules/auth/entities/audit-log.entity';
import { logger } from '@common/utils/logger.util';

export const auditUtilisateur = {
    async profilModifie(
        utilisateurId: string,
        cibleId: string,
        email: string,
        req?: any
    ): Promise<void> {
        try {
            await auditService.log({
                utilisateurId,
                action: AuditAction.USER_UPDATE,
                cible: 'Utilisateur',
                cibleId,
                description: `Profil modifié: ${email}`,
                module: 'utilisateurs',
            }, req);
        } catch (error) {
            logger.warn('[Audit] Erreur audit profilModifie', error);
        }
    },

    async securiteModifiee(
        utilisateurId: string,
        cibleId: string,
        email: string,
        changements: Record<string, { ancien: any; nouveau: any }>,
        req?: any
    ): Promise<void> {
        try {
            await auditService.log({
                utilisateurId,
                action: AuditAction.USER_UPDATE,
                severity: AuditSeverity.WARNING,
                cible: 'Utilisateur',
                cibleId,
                description: `Sécurité modifiée: ${email}`,
                anciennesValeurs: Object.fromEntries(
                    Object.entries(changements).map(([k, v]) => [k, v.ancien])
                ),
                nouvellesValeurs: Object.fromEntries(
                    Object.entries(changements).map(([k, v]) => [k, v.nouveau])
                ),
                module: 'utilisateurs',
            }, req);
        } catch (error) {
            logger.warn('[Audit] Erreur audit securiteModifiee', error);
        }
    },

    async motDePasseForce(
        utilisateurId: string,
        cibleId: string,
        email: string,
        req?: any
    ): Promise<void> {
        try {
            await auditService.log({
                utilisateurId,
                action: AuditAction.PASSWORD_RESET,
                severity: AuditSeverity.WARNING,
                cible: 'Utilisateur',
                cibleId,
                description: `Réinitialisation forcée du mot de passe: ${email}`,
                module: 'utilisateurs',
            }, req);
        } catch (error) {
            logger.warn('[Audit] Erreur audit motDePasseForce', error);
        }
    },

    async sessionsRevokees(
        utilisateurId: string,
        cibleId: string,
        email: string,
        nombreTokens: number,
        req?: any
    ): Promise<void> {
        try {
            await auditService.log({
                utilisateurId,
                action: AuditAction.USER_UPDATE,
                severity: AuditSeverity.WARNING,
                cible: 'Utilisateur',
                cibleId,
                description: `${nombreTokens} session(s) révoquée(s): ${email}`,
                nouvellesValeurs: { sessionsRevokees: nombreTokens },
                module: 'utilisateurs',
            }, req);
        } catch (error) {
            logger.warn('[Audit] Erreur audit sessionsRevokees', error);
        }
    },

    async statutModifie(
        utilisateurId: string,
        cibleId: string,
        email: string,
        ancienStatut: string,
        nouveauStatut: string,
        req?: any
    ): Promise<void> {
        try {
            const action = nouveauStatut === 'SUSPENDU'
                ? AuditAction.USER_SUSPEND
                : nouveauStatut === 'ACTIF' && ancienStatut === 'SUSPENDU'
                    ? AuditAction.USER_ACTIVATE
                    : AuditAction.USER_UPDATE;

            await auditService.log({
                utilisateurId,
                action,
                severity: nouveauStatut === 'SUSPENDU' ? AuditSeverity.CRITICAL : AuditSeverity.INFO,
                cible: 'Utilisateur',
                cibleId,
                description: `Statut changé: ${email} (${ancienStatut} → ${nouveauStatut})`,
                anciennesValeurs: { statut: ancienStatut },
                nouvellesValeurs: { statut: nouveauStatut },
                module: 'utilisateurs',
            }, req);
        } catch (error) {
            logger.warn('[Audit] Erreur audit statutModifie', error);
        }
    },
};
