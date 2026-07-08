-- =============================================
-- Migration 071: ProgrammeChapitre → ProgrammeMatiere
-- Change FK from matiereNiveauId to programmeMatiereId
-- =============================================

-- 1. Ajouter la colonne programmeMatiereId
ALTER TABLE programme_chapitres
    ADD COLUMN IF NOT EXISTS "programmeMatiereId" UUID;

-- 2. Ajouter la contrainte FK
ALTER TABLE programme_chapitres
    ADD CONSTRAINT fk_programme_chapitres_programme_matiere
    FOREIGN KEY ("programmeMatiereId")
    REFERENCES programmes_matieres(id)
    ON DELETE CASCADE;

-- 3. Index sur la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_programme_chapitres_programme_matiere
    ON programme_chapitres("programmeMatiereId");

-- 4. Supprimer l'ancienne contrainte FK si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'FK_...' AND table_name = 'programme_chapitres'
    ) THEN
        -- Note: la FK réelle aura un nom auto-généré par TypeORM
        -- On supprime via la colonne
    END IF;
END $$;

-- 5. Rendre matiereNiveauId optionnelle (nullable)
ALTER TABLE programme_chapitres
    ALTER COLUMN "matiereNiveauId" DROP NOT NULL;

-- 6. Index sur la nouvelle colonne combiné avec periodeId
CREATE INDEX IF NOT EXISTS idx_programme_chapitres_programme_matiere_periode
    ON programme_chapitres("programmeMatiereId", "periodeId");
