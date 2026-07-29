/**
 * ==================================
 * eLISAschool - Service de Rétention Audit
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Purge sélective des logs d'audit selon la politique de rétention.
 * Seuls les logs INFO sont purgés ; WARNING et CRITICAL sont conservés indéfiniment.
 * Si retention_jours = 0, la purge est désactivée (conservation illimitée).
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AuditLog, AuditSeverity } from '@modules/auth/entities/audit-log.entity';
import { getParamNumber } from '@modules/configuration/utils/config.helper';
import { logger } from '@common/utils/logger.util';

export class AuditRetentionService {
    private auditRepo: Repository<AuditLog>;

    constructor() {
        this.auditRepo = AppDataSource.getRepository(AuditLog);
    }

    async purgerLogsExpires(): Promise<{ purges: number; retentionJours: number }> {
        const retentionJours = await getParamNumber('audit.retention_jours', { defaultValue: 0 });

        if (retentionJours <= 0) {
            logger.info('[AUDIT RETENTION] Rétention désactivée (retention_jours = 0), aucune purge.');
            return { purges: 0, retentionJours: 0 };
        }

        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() - retentionJours);

        const result = await this.auditRepo
            .createQueryBuilder()
            .delete()
            .from(AuditLog)
            .where('severity = :severity', { severity: AuditSeverity.INFO })
            .andWhere('"createdAt" < :dateLimite', { dateLimite })
            .execute();

        const purges = result.affected || 0;

        if (purges > 0) {
            logger.info(
                `[AUDIT RETENTION] ${purges} logs INFO purgés (antérieurs au ${dateLimite.toISOString().split('T')[0]}, rétention ${retentionJours}j).`,
            );
        }

        return { purges, retentionJours };
    }
}

export const auditRetentionService = new AuditRetentionService();
