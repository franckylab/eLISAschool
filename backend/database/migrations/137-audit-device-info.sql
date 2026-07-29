-- Migration 137 : Ajout colonnes navigateur, systèmeExploitation, appareil sur audit_logs
-- Informations parsées depuis le user-agent pour traçabilité enrichie

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "navigateur" varchar(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "systemeExploitation" varchar(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "appareil" varchar(100);
