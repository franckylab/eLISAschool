/**
 * ==================================
 * eLISAschool - Export des services Organisation
 * ==================================
 * Version: 2.0.0 — post-refonte
 */

// Services principaux
export * from './organisation.service';
export * from './postes.service';
export * from './fonctions.service';

// Services nomenclature (éclatés)
export * from './niveau-organisation.service';
export * from './usage-unite.service';
export * from './categorie-poste.service';
export * from './niveau-responsabilite.service';
export * from './template-organisation.service';
export * from './type-relation.service';
export * from './type-personnel.service';

// Services spécialisés
export * from './generation.service';
export * from './organigramme.pdf.service';
export * from './postes-vacants.service';
export * from './statistiques-optimisees.service';
