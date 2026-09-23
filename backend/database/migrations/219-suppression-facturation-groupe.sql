-- =============================================
-- eLISAschool - Suppression Facturation Groupe
-- =============================================
-- Migration brutale : suppression complète de la facturation groupe
-- Remplacée par : dégressivité ligne REMISE sur factures individuelles + Vue Consolidée lecture seule
-- Date: 2026-09-22
-- =============================================

-- 1. Archivage factures groupe existantes (si table existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'factures' AND column_name = 'groupe_id') THEN
        -- Créer table archive si pas existante
        CREATE TABLE IF NOT EXISTS factures_groupe_archive (
            LIKE factures INCLUDING ALL
        );
        
        -- Archiver factures avec groupe_id non null
        INSERT INTO factures_groupe_archive
        SELECT * FROM factures WHERE "groupeId" IS NOT NULL;
        
        -- Supprimer les factures archivées de la table principale
        DELETE FROM factures WHERE "groupeId" IS NOT NULL;
        
        RAISE NOTICE 'Factures groupe archivées: % lignes', SQLERRM;
    END IF;
END $$;

-- 2. Suppression colonnes facturation groupe sur abonnements_groupe
ALTER TABLE "abonnements_groupe" 
DROP COLUMN IF EXISTS "modeFacturation",
DROP COLUMN IF EXISTS "repartitionFacturation",
DROP COLUMN IF EXISTS "tarifDegressif";

-- 3. Ajout colonne groupeId sur factures pour traçabilité (nullable, FK optionnelle)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'factures' AND column_name = 'groupe_id') THEN
        ALTER TABLE factures ADD COLUMN "groupeId" uuid;
        CREATE INDEX IF NOT EXISTS idx_factures_groupe_id ON factures("groupeId");
        -- FK optionnelle (pas de contrainte pour permettre suppression groupe)
    END IF;
END $$;

-- 4. Suppression tables facturation groupe spécifiques si elles existent
DROP TABLE IF EXISTS "factures_groupe" CASCADE;
DROP TABLE IF EXISTS "facture_groupe_lignes" CASCADE;

-- 5. Index pour performance Vue Consolidée
CREATE INDEX IF NOT EXISTS idx_factures_etablissement_date ON factures("etablissementId", "dateEmission" DESC);
CREATE INDEX IF NOT EXISTS idx_abonnements_groupe_plan ON "abonnements_groupe"("planId");
CREATE INDEX IF NOT EXISTS idx_groupe_etablissement_liens_groupe ON "groupe_etablissement_liens"("groupeId");

-- 6. Nettoyage données orphelines (factures sans etablissementId valide)
DELETE FROM factures f
WHERE NOT EXISTS (
    SELECT 1 FROM etablissements e WHERE e.id = f."etablissementId"
);

-- 7. Vérification cohérence
DO $$
DECLARE
    v_count integer;
BEGIN
    -- Vérifier qu'il n'y a plus de factures avec groupeId sans groupe valide
    SELECT COUNT(*) INTO v_count
    FROM factures f
    WHERE f."groupeId" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "abonnements_groupe" ag WHERE ag.id = f."groupeId");
    
    IF v_count > 0 THEN
        RAISE NOTICE 'ATTENTION: % factures avec groupeId orphelin', v_count;
    ELSE
        RAISE NOTICE 'OK: Aucune facture avec groupeId orphelin';
    END IF;
    
    -- Vérifier colonnes supprimées
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'abonnements_groupe' AND column_name = 'modeFacturation') THEN
        RAISE EXCEPTION 'ERREUR: Colonnes facturation groupe non supprimées';
    ELSE
        RAISE NOTICE 'OK: Colonnes facturation groupe supprimées';
    END IF;
END $$;

-- =============================================
-- FIN MIGRATION 219
-- =============================================