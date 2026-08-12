-- ==================================
-- eLISAschool - Migration 178 : Type ENCRYPTED pour paramètres sensibles
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- 
-- R3 v7.1 — Ajoute le type 'ENCRYPTED' à l'enum type_valeur_parametre
-- pour le chiffrement automatique AES-256-GCM des valeurs sensibles
-- (credentials, secrets, tokens, clés API).
--
-- Impact : aucun changement de données existantes.
-- Les paramètres existants restent STRING/NUMBER/BOOLEAN/JSON/ARRAY.
-- Seuls les nouveaux paramètres créés avec typeValeur='ENCRYPTED' seront chiffrés.
-- ==================================

-- Ajouter la valeur ENCRYPTED à l'enum PostgreSQL
-- TypeORM nomme l'enum : {table}_{column}_enum → parametres_systeme_typeValeur_enum
DO $$ BEGIN
    ALTER TYPE "parametres_systeme_typeValeur_enum" ADD VALUE IF NOT EXISTS 'ENCRYPTED';
EXCEPTION WHEN undefined_object THEN
    -- Fallback : nom lowercase (certaines versions TypeORM)
    ALTER TYPE "parametres_systeme_typevaleur_enum" ADD VALUE IF NOT EXISTS 'ENCRYPTED';
END $$;
