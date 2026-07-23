-- ==================================
-- eLISAschool - Migration 113
-- Description: FK responsableId → membres_personnel + nettoyage telephone/email
-- ==================================

-- 1. Ajouter FK constraint sur responsableId
ALTER TABLE unites_organisationnelles
    ADD CONSTRAINT fk_unite_responsable
    FOREIGN KEY (responsableId)
    REFERENCES membres_personnel(id)
    ON DELETE SET NULL;

-- 2. Supprimer la colonne telephone (données de contact redondantes)
ALTER TABLE unites_organisationnelles
    DROP COLUMN IF EXISTS telephone;

-- 3. Supprimer la colonne email (données de contact redondantes)
ALTER TABLE unites_organisationnelles
    DROP COLUMN IF EXISTS email;
