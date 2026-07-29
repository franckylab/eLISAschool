-- Migration 136: Ajout colonne metadata JSONB à audit_logs
-- Permet de stocker le contexte structuré des entités auditées
-- (nom, label, ref, relations nommées) pour identification sans requête supplémentaire

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "metadata" jsonb;
