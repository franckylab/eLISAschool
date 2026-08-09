/**
 * ==================================
 * eLISAschool - Module Platform Auth
 * ==================================
 * Authentification dual-plane pour la plateforme (Control Plane).
 */
export { platformAuthController } from './controllers/platform-auth.controller';
export { platformAuthService } from './services/platform-auth.service';
export type { PlatformLoginResponse, PlatformMeResponse } from './dto/platform-auth.dto';
