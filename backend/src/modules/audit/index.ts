/**
 * ==================================
 * eLISAschool - Module Audit Trail
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Module de consultation et gestion des logs d'audit
 */

export * from './controllers/audit.controller';
export * from './services/archivage.service';
export { auditFiltersSchema, auditExportSchema } from './dto/audit-filters.dto';
export type { AuditFiltersDto, AuditExportDto } from './dto/audit-filters.dto';
