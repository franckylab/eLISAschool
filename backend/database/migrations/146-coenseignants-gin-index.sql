-- ==================================
-- 146-coenseignants-gin-index.sql
-- ==================================
-- Index GIN d'expression pour rendre indexable la recherche de co-enseignants
-- dans conflit-detection.service (detecterConflitEnseignant).
--
-- coEnseignantIds = simple-array TypeORM (TEXT séparé par virgules).
-- La condition indexée : string_to_array("coEnseignantIds", ',') @> ARRAY[:id]
-- (BitmapOr en parallèle de l'index btree am.enseignantId).

CREATE INDEX IF NOT EXISTS idx_affectations_coenseignants_gin
    ON affectations_matieres
    USING gin (string_to_array("coEnseignantIds", ','));