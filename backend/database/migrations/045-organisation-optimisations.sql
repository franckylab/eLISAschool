-- ==================================
-- eLISAschool - Migration Optimisations Organisation
-- ==================================
-- Version: 1.1.0
-- Auteur: franck arlos chendjou
-- Description: Index composites uniques et optimisations
-- ==================================

-- ==================================
-- Index uniques composites pour codes
-- ==================================

-- Supprimer l'ancien index simple sur code des unités
DROP INDEX IF EXISTS idx_unites_code;

-- Créer un index unique composite (code + organisationId)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unites_code_unique 
    ON unites_organisationnelles(code, organisationId);

-- Supprimer l'ancien index simple sur code des postes
DROP INDEX IF EXISTS idx_postes_code;

-- Créer un index unique composite (code + uniteOrganisationnelleId)
CREATE UNIQUE INDEX IF EXISTS idx_postes_code_unique 
    ON postes(code, uniteOrganisationnelleId);

-- ==================================
-- Index supplémentaires pour performance
-- ==================================

-- Index sur statut des unités pour les filtres
CREATE INDEX IF NOT EXISTS idx_unites_statut 
    ON unites_organisationnelles(statut);

-- Index sur statut des postes pour les filtres
CREATE INDEX IF NOT EXISTS idx_postes_occupant 
    ON postes(occupantId) WHERE occupantId IS NOT NULL;

-- Index composite pour hiérarchie (recherche par personnel + etablissement)
CREATE INDEX IF NOT EXISTS idx_hierarchie_personnel_etablissement 
    ON hierarchie_personnel(personnelId, etablissementId) WHERE actif = true;

-- Index composite pour hiérarchie (recherche par superieur + etablissement)
CREATE INDEX IF NOT EXISTS idx_hierarchie_superieur_etablissement 
    ON hierarchie_personnel(superieurId, etablissementId) WHERE actif = true;

-- ==================================
-- Vérification
-- ==================================

SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename IN ('organisations', 'unites_organisationnelles', 'postes', 'hierarchie_personnel')
ORDER BY tablename, indexname;
