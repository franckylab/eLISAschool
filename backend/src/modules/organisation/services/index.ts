/**
 * ==================================
 * eLISAschool - Export des services Organisation
 * ==================================
 * Version: 4.0.0 — post-refonte v4.0
 */

// Services principaux
export * from './organisation.service';
export * from './postes.service';
export * from './fonctions.service';

// Services nomenclature (éclatés — 4 nomenclatures)
export * from './echelon-structurel.service';
export * from './niveau-responsabilite.service';
export * from './template-organisation.service';
export * from './mode-remuneration.service';

// Services spécialisés
export * from './generation.service';
export * from './organigramme.pdf.service';
export * from './postes-vacants.service';
export * from './statistiques-optimisees.service';
