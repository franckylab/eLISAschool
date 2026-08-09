/**
 * eLISAschool - Shared CASL Exports
 * Package partagé frontend/backend
 * Dual-Plane : Data Plane (tenant) + Control Plane (plateforme)
 */
export { defineAbility } from './abilities';
export type { AppAbility, Action, Subject, AbilityContext } from './abilities';

export { definePlatformAbility } from './platform-abilities';
export type { PlatformAppAbility, PlatformAction, PlatformSubject, PlatformAbilityContext } from './platform-abilities';
