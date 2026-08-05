-- ==================================
-- eLISAschool - Module Jours Fériés
-- ==================================
-- Table jours_feries + seed Cameroun (11 jours fériés officiels)
-- Multi-tenant : etablissementId NULL = global
-- Version: 1.0.0
-- ==================================

-- ─── Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS jours_feries (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nom" VARCHAR(150) NOT NULL,
    "date" DATE,
    "estRecurrent" BOOLEAN NOT NULL DEFAULT false,
    "mois" INTEGER,
    "jourMois" INTEGER,
    "couleur" VARCHAR(7),
    "description" TEXT,
    "etablissementId" UUID,
    "estSysteme" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT "FK_jours_feries_etablissement" FOREIGN KEY ("etablissementId")
        REFERENCES "etablissements"("id") ON DELETE CASCADE
);

-- Index
CREATE INDEX IF NOT EXISTS "IDX_jours_feries_etablissement" ON jours_feries ("etablissementId");
CREATE INDEX IF NOT EXISTS "IDX_jours_feries_date" ON jours_feries ("date");
CREATE INDEX IF NOT EXISTS "IDX_jours_feries_recurrent" ON jours_feries ("estRecurrent", "mois", "jourMois");

-- ─── Seed — Jours fériés Cameroun (globaux, système) ──────────

-- Jours fériés fixes (récurrents chaque année)
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme")
VALUES
    ('Nouvel An',            true, 1,  1,  '#dc3545', true),
    ('Fête de la Jeunesse',  true, 2,  11, '#dc3545', true),
    ('Fête du Travail',      true, 5,  1,  '#dc3545', true),
    ('Fête Nationale',       true, 5,  20, '#dc3545', true),
    ('Assomption',           true, 8,  15, '#6f42c1', true),
    ('Noël',                 true, 12, 25, '#28a745', true)
ON CONFLICT DO NOTHING;

-- Jours fériés variables 2025-2027 (non récurrents, date spécifique)
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme")
VALUES
    -- 2025
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien — variable', true),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien — variable', true),
    ('Ascension',            '2025-05-29', false, '#6f42c1', 'Calendrier chrétien — variable', true),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien — variable', true),
    -- 2026
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien — variable', true),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien — variable', true),
    ('Ascension',            '2026-05-14', false, '#6f42c1', 'Calendrier chrétien — variable', true),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien — variable', true),
    -- 2027
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien — variable', true),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien — variable', true),
    ('Ascension',            '2027-05-06', false, '#6f42c1', 'Calendrier chrétien — variable', true),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien — variable', true)
ON CONFLICT DO NOTHING;
