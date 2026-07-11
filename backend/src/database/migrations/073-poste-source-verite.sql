-- ==================================
-- Migration 073: Poste comme source de vérité
-- ==================================
-- 1. Supprime superviseurId/superviseurNom (colonnes mortes)
-- 2. Ajoute modeRemunerationDefaut
-- 3. Trigger pour synchroniser Poste.occupantId depuis AffectationPoste
-- 4. Supprime posteId de contrats_personnel (poste porté par AffectationPoste)
-- ==================================
-- NOTE: Tous les identifiants camelCase sont entre guillemets pour PostgreSQL

-- 1. Supprimer les colonnes mortes
ALTER TABLE postes DROP COLUMN IF EXISTS "superviseurId";
ALTER TABLE postes DROP COLUMN IF EXISTS "superviseurNom";

-- 1b. Supprimer posteId de contrats_personnel (poste porté par AffectationPoste uniquement)
ALTER TABLE contrats_personnel DROP COLUMN IF EXISTS "posteId";

-- 2. Ajouter le mode de rémunération par défaut
ALTER TABLE postes ADD COLUMN IF NOT EXISTS "modeRemunerationDefaut" varchar(30) DEFAULT NULL;

-- 3. Fonction trigger pour synchroniser Poste.occupantId
CREATE OR REPLACE FUNCTION sync_poste_occupant()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW."statut" = 'ACTIF' THEN
    UPDATE postes SET "occupantId" = NEW."membrePersonnelId", statut = 'ACTIF'
    WHERE id = NEW."posteId" AND "occupantId" IS DISTINCT FROM NEW."membrePersonnelId";
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW."statut" = 'ACTIF' AND (OLD."statut" IS DISTINCT FROM 'ACTIF') THEN
      UPDATE postes SET "occupantId" = NEW."membrePersonnelId", statut = 'ACTIF'
      WHERE id = NEW."posteId";
    ELSIF NEW."statut" = 'TERMINE' AND OLD."statut" = 'ACTIF' THEN
      UPDATE postes SET "occupantId" = NULL, statut = 'VACANT'
      WHERE id = NEW."posteId";
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD."statut" = 'ACTIF' THEN
    UPDATE postes SET "occupantId" = NULL, statut = 'VACANT'
    WHERE id = OLD."posteId";
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà (idempotent)
DROP TRIGGER IF EXISTS trg_sync_poste_occupant ON affectations_postes;

CREATE TRIGGER trg_sync_poste_occupant
AFTER INSERT OR UPDATE OR DELETE ON affectations_postes
FOR EACH ROW EXECUTE FUNCTION sync_poste_occupant();

-- 4. Synchroniser les données existantes
UPDATE postes p SET "occupantId" = NULL, statut = 'VACANT'
WHERE (SELECT COUNT(*) FROM affectations_postes ae
       WHERE ae."posteId" = p.id AND ae.statut = 'ACTIF') = 0
  AND p."occupantId" IS NOT NULL;

UPDATE postes p SET "occupantId" = ae."membrePersonnelId", statut = 'ACTIF'
FROM affectations_postes ae
WHERE ae."posteId" = p.id AND ae.statut = 'ACTIF'
  AND p."occupantId" IS DISTINCT FROM ae."membrePersonnelId";
