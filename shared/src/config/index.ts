/**
 * ==================================
 * eLISAschool - Export des configurations
 * ==================================
 *
 * Refonte SaaS (migration 200) — MODULE_REGISTRY supprimé.
 * La configuration des modules est désormais dans le champ JSONB
 * `config` de la table `modules_catalogue`.
 */

// Plus d'export registre — tout vient de la DB (modules_catalogue.config)
