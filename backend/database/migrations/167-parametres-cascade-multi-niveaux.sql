-- =============================================
-- Migration 167 — Paramètres cascade multi-niveaux
-- =============================================
-- Ajout du niveau "groupe" dans la cascade de paramètres
-- pour permettre des overrides par groupe d'établissements.
--
-- Cascade complète : Système → Global → Groupe → Établissement
-- =============================================

-- 1. Ajouter colonne groupe_etablissement_id sur parametres_systeme
ALTER TABLE parametres_systeme
    ADD COLUMN IF NOT EXISTS "groupeEtablissementId" UUID;

-- 2. Index pour les recherches par groupe
CREATE INDEX IF NOT EXISTS idx_parametres_systeme_groupe
    ON parametres_systeme ("groupeEtablissementId");

-- 3. Index composite unique : cle + groupe (un override par groupe max)
CREATE UNIQUE INDEX IF NOT EXISTS idx_parametres_systeme_cle_groupe
    ON parametres_systeme ("cle", "groupeEtablissementId")
    WHERE "groupeEtablissementId" IS NOT NULL AND "etablissementId" IS NULL;

-- 4. Contrainte FK optionnelle vers groupes_etablissements
ALTER TABLE parametres_systeme
    ADD CONSTRAINT fk_parametres_groupe_etablissement
    FOREIGN KEY ("groupeEtablissementId")
    REFERENCES groupes_etablissements(id)
    ON DELETE SET NULL;

-- 5. Colonne "propageable" pour marquer les paramètres qui supportent la cascade
ALTER TABLE parametres_systeme
    ADD COLUMN IF NOT EXISTS "propageable" BOOLEAN DEFAULT true;

-- 6. Commentaire documentation
COMMENT ON COLUMN parametres_systeme."groupeEtablissementId" IS
    'ID du groupe pour override niveau 3 (cascade: système→global→groupe→établissement). NULL = non scopé groupe.';
COMMENT ON COLUMN parametres_systeme."propageable" IS
    'Si true, la valeur globale peut être propagée aux établissements qui n''ont pas d''override.';
