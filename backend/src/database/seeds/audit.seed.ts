/**
 * ==================================
 * eLISAschool - Seed Audit Trail
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Données de test pour le système d'audit trail
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AuditLog, AuditAction, AuditSeverity } from '@modules/auth/entities/audit-log.entity';
import { logger } from '@common/utils/logger.util';

/**
 * Crée des logs d'audit de démonstration
 */
export async function seedAuditLogs(): Promise<void> {
    logger.info('[SEED] Création de logs d\'audit de démonstration...');

    const auditRepo = AppDataSource.getRepository(AuditLog);

    // Vérifier s'il y a déjà des logs
    const count = await auditRepo.count();
    if (count > 0) {
        logger.info('[SEED] Des logs d\'audit existent déjà, skip');
        return;
    }

    // Données de test
    const testLogs: Partial<AuditLog>[] = [
        {
            utilisateurId: null,
            action: AuditAction.LOGIN_FAILED,
            severity: AuditSeverity.WARNING,
            description: 'Tentative de connexion échouée - email invalide',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            module: 'auth',
            estEchec: true,
            erreur: 'Email non trouvé',
        },
        {
            action: AuditAction.LOGIN,
            severity: AuditSeverity.INFO,
            description: 'Connexion réussie - admin@elischool.com',
            ipAddress: '192.168.1.50',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            module: 'auth',
        },
        {
            action: AuditAction.ELEVE_CREATE,
            severity: AuditSeverity.INFO,
            cible: 'Eleve',
            description: 'Création dossier élève: ELV-2026-001',
            nouvellesValeurs: { matricule: 'ELV-2026-001', nomTuteur: 'Dupont' },
            module: 'eleves',
        },
        {
            action: AuditAction.USER_CREATE,
            severity: AuditSeverity.INFO,
            cible: 'Utilisateur',
            description: 'Création utilisateur: prof.martin@elischool.com',
            nouvellesValeurs: { email: 'prof.martin@elischool.com', role: 'PROFESSEUR' },
            module: 'utilisateurs',
        },
        {
            action: AuditAction.NOTE_CREATE,
            severity: AuditSeverity.INFO,
            cible: 'Note',
            description: 'Création note - Mathématiques - Élève ELV-2026-001',
            nouvellesValeurs: { valeur: 15.5, coefficient: 2 },
            module: 'notes',
        },
        {
            action: AuditAction.ACCESS_DENIED,
            severity: AuditSeverity.WARNING,
            description: 'Accès refusé à /api/utilisateurs -权限不足',
            module: 'auth',
            estEchec: true,
        },
        {
            action: AuditAction.CONFIG_UPDATE,
            severity: AuditSeverity.WARNING,
            cible: 'Configuration',
            description: 'Modification paramètre: note_minimale_passage',
            anciennesValeurs: { valeur: '10' },
            nouvellesValeurs: { valeur: '12' },
            module: 'configuration',
        },
        {
            action: AuditAction.USER_SUSPEND,
            severity: AuditSeverity.WARNING,
            cible: 'Utilisateur',
            description: 'Suspension utilisateur: user@example.com',
            anciennesValeurs: { statut: 'ACTIF' },
            nouvellesValeurs: { statut: 'SUSPENDU' },
            module: 'utilisateurs',
        },
        {
            action: AuditAction.PASSWORD_CHANGE,
            severity: AuditSeverity.WARNING,
            description: 'Changement de mot de passe',
            module: 'auth',
        },
        {
            action: AuditAction.DATA_EXPORT,
            severity: AuditSeverity.INFO,
            description: 'Export des notes - Année scolaire 2025-2026',
            module: 'notes',
        },
    ];

    // Créer les logs
    const logs = auditRepo.create(testLogs);
    await auditRepo.save(logs);

    logger.info(`[SEED] ✅ ${logs.length} logs d'audit de démonstration créés`);
}

/**
 * Nettoie les logs de test
 */
export async function cleanAuditLogs(): Promise<void> {
    logger.info('[SEED] Nettoyage des logs d\'audit...');
    
    const auditRepo = AppDataSource.getRepository(AuditLog);
    const result = await auditRepo.clear();
    
    logger.info(`[SEED] ✅ Logs d'audit nettoyés`);
}
