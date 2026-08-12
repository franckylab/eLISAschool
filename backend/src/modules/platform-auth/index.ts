/**
 * ==================================
 * eLISAschool - Module Platform Auth
 * ==================================
 * ADR-005 (v11) — Compatibilité routes plateforme.
 * Le login est unifié via auth.service.ts.
 */
export { platformAuthController } from './controllers/platform-auth.controller';
export { platformLoginSchema } from './dto/platform-auth.dto';
export type { PlatformLoginDto } from './dto/platform-auth.dto';
