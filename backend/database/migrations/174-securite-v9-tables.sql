-- ==================================
-- eLISAschool - Durcissement Sécurité v9
-- ==================================
-- Migration 174 : Tables sécurité v9
-- - webauthn_credentials : credentials FIDO2/WebAuthn (passwordless + MFA)
-- - cles_cryptographiques : gestion cycle de vie clés (KeyManager)
-- - ip_autorisees : IP allowlist pour routes plateforme
--
-- Auteur: franck arlos chendjou
-- ==================================

BEGIN;

-- =============================================
-- 1. WebAuthn Credentials (FIDO2/Passkeys)
-- =============================================
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "utilisateurId" uuid NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    "credentialId" text NOT NULL,
    "publicKey" text NOT NULL,
    "counter" bigint NOT NULL DEFAULT 0,
    "transports" jsonb,
    "estBackedUp" boolean NOT NULL DEFAULT false,
    "label" varchar(100),
    "derniereUtilisation" timestamp,
    "aaguid" varchar(36),
    "authenticatorType" varchar(20),
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "updatedAt" timestamp NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_webauthn_credential_id" ON webauthn_credentials ("credentialId");
CREATE INDEX IF NOT EXISTS "IDX_webauthn_utilisateur" ON webauthn_credentials ("utilisateurId");

COMMENT ON TABLE webauthn_credentials IS 'Durcissement v9 — Credentials WebAuthn/FIDO2 pour authentification passwordless et MFA';

-- =============================================
-- 2. Clés Cryptographiques (KeyManager)
-- =============================================
CREATE TABLE IF NOT EXISTS cles_cryptographiques (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "nom" varchar(100) NOT NULL UNIQUE,
    "type" varchar(20) NOT NULL CHECK ("type" IN ('JWT', 'ENCRYPTION', 'MFA', 'AUDIT_HMAC')),
    "valeur" text NOT NULL,
    "statut" varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK ("statut" IN ('ACTIVE', 'ROTATION', 'REVOQUEE')),
    "dateRotation" timestamp,
    "dateExpiration" timestamp,
    "version" integer NOT NULL DEFAULT 1,
    "dureeRotationJours" integer NOT NULL DEFAULT 90,
    "creePar" uuid,
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "updatedAt" timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IDX_cles_type_statut" ON cles_cryptographiques ("type", "statut");
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cles_nom" ON cles_cryptographiques ("nom");

COMMENT ON TABLE cles_cryptographiques IS 'Durcissement v9 — Gestion cycle de vie clés cryptographiques avec rotation automatique';

-- =============================================
-- 3. IP Autorisées (Allowlist Plateforme)
-- =============================================
CREATE TABLE IF NOT EXISTS ip_autorisees (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "ip" varchar(45) NOT NULL UNIQUE,
    "label" varchar(100),
    "active" boolean NOT NULL DEFAULT true,
    "expireAt" timestamp,
    "createdBy" uuid,
    "createdAt" timestamp NOT NULL DEFAULT NOW(),
    "updatedAt" timestamp NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ip_autorisee_ip" ON ip_autorisees ("ip");

COMMENT ON TABLE ip_autorisees IS 'Durcissement v9 — IP allowlist pour restreindre accès routes plateforme (/api/platform/*)';

-- =============================================
-- 4. Colonne integriteHash pour Audit Logs (HMAC chain)
-- =============================================
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "integriteHash" text;

COMMENT ON COLUMN audit_logs."integriteHash" IS 'Durcissement v9 — Signature HMAC-SHA256 pour chaîne intégrité (détection falsification)';

COMMIT;
