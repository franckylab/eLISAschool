-- ==================================
-- eLISAschool - Jours Fériés : Modèles par Pays
-- ==================================
-- Migration 149 : Ajout colonne pays + seeds 15 pays
-- Afrique centrale + UEMOA
-- Seeds système modifiables (estSysteme=true)
-- Cameroun par défaut
-- Version: 1.0.0
-- ==================================

-- ─── Ajout colonne pays ────────────────────────────────────────

ALTER TABLE jours_feries ADD COLUMN IF NOT EXISTS "pays" VARCHAR(2);
CREATE INDEX IF NOT EXISTS "IDX_jours_feries_pays" ON jours_feries ("pays");

-- ─── Mise à jour seeds Cameroun existants (migration 147) ──────

UPDATE jours_feries SET "pays" = 'CM' WHERE "pays" IS NULL AND "estSysteme" = true;

-- ─── Ajout colonne exclureJoursFeries sur preferences_emploi_du_temps ──

ALTER TABLE preferences_emploi_du_temps ADD COLUMN IF NOT EXISTS "exclureJoursFeries" BOOLEAN NOT NULL DEFAULT true;

-- ═══════════════════════════════════════════════════════════════
-- SEEDS — Jours fériés fixes (récurrents) par pays
-- ═══════════════════════════════════════════════════════════════

-- ─── CM — Cameroun (6 fixes déjà en seed 147) ────
-- Note : Tabaski et Fin Ramadan sont des dates variables (lunaires).
-- Ils sont insérés comme ponctuels 2025-2027 plus bas dans cette migration.

-- ─── CI — Côte d'Ivoire ───────────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'CI'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'CI'),
    ('Fête de l''Indépendance',true, 8,  7,  '#28a745', true, 'CI'),
    ('Assomption',             true, 8,  15, '#6f42c1', true, 'CI'),
    ('Toussaint',              true, 11, 1,  '#6f42c1', true, 'CI'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'CI')
ON CONFLICT DO NOTHING;

-- ─── SN — Sénégal ─────────────────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'SN'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'SN'),
    ('Fête de l''Indépendance',true, 4,  4,  '#28a745', true, 'SN'),
    ('Assomption',             true, 8,  15, '#6f42c1', true, 'SN'),
    ('Toussaint',              true, 11, 1,  '#6f42c1', true, 'SN'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'SN')
ON CONFLICT DO NOTHING;

-- ─── CG — Congo-Brazzaville ───────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'CG'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'CG'),
    ('Fête Nationale',         true, 6,  10, '#28a745', true, 'CG'),
    ('Fête de la Révolution',  true, 8,  15, '#28a745', true, 'CG'),
    ('Assomption',             true, 8,  15, '#6f42c1', true, 'CG'),
    ('Toussaint',              true, 11, 1,  '#6f42c1', true, 'CG'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'CG')
ON CONFLICT DO NOTHING;

-- ─── CD — RD Congo ────────────────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'CD'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'CD'),
    ('Fête de l''Indépendance',true, 6,  30, '#28a745', true, 'CD'),
    ('Assomption',             true, 8,  15, '#6f42c1', true, 'CD'),
    ('Journée des Morts',      true, 11, 1,  '#6f42c1', true, 'CD'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'CD')
ON CONFLICT DO NOTHING;

-- ─── GA — Gabon ───────────────────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'GA'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'GA'),
    ('Fête de l''Indépendance',true, 8,  17, '#28a745', true, 'GA'),
    ('Assomption',             true, 8,  15, '#6f42c1', true, 'GA'),
    ('Toussaint',              true, 11, 1,  '#6f42c1', true, 'GA'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'GA')
ON CONFLICT DO NOTHING;

-- ─── BF — Burkina Faso ────────────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'BF'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'BF'),
    ('Fête de l''Indépendance',true, 8,  5,  '#28a745', true, 'BF'),
    ('Assomption',             true, 8,  15, '#6f42c1', true, 'BF'),
    ('Toussaint',              true, 11, 1,  '#6f42c1', true, 'BF'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'BF')
ON CONFLICT DO NOTHING;

-- ─── ML — Mali ────────────────────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'ML'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'ML'),
    ('Fête de l''Indépendance',true, 9,  22, '#28a745', true, 'ML'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'ML')
ON CONFLICT DO NOTHING;

-- ─── BJ — Bénin ───────────────────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'BJ'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'BJ'),
    ('Fête de l''Indépendance',true, 8,  1,  '#28a745', true, 'BJ'),
    ('Assomption',             true, 8,  15, '#6f42c1', true, 'BJ'),
    ('Toussaint',              true, 11, 1,  '#6f42c1', true, 'BJ'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'BJ')
ON CONFLICT DO NOTHING;

-- ─── TG — Togo ────────────────────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'TG'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'TG'),
    ('Fête de l''Indépendance',true, 4,  27, '#28a745', true, 'TG'),
    ('Assomption',             true, 8,  15, '#6f42c1', true, 'TG'),
    ('Toussaint',              true, 11, 1,  '#6f42c1', true, 'TG'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'TG')
ON CONFLICT DO NOTHING;

-- ─── NE — Niger ───────────────────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'NE'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'NE'),
    ('Fête de la Concorde',    true, 4,  24, '#28a745', true, 'NE'),
    ('Fête Nationale',         true, 8,  3,  '#28a745', true, 'NE'),
    ('Fête de la République',  true, 12, 18, '#28a745', true, 'NE'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'NE')
ON CONFLICT DO NOTHING;

-- ─── GN — Guinée ──────────────────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'GN'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'GN'),
    ('Fête de l''Indépendance',true, 10, 2,  '#28a745', true, 'GN'),
    ('Assomption',             true, 8,  15, '#6f42c1', true, 'GN'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'GN')
ON CONFLICT DO NOTHING;

-- ─── TD — Tchad ───────────────────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'TD'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'TD'),
    ('Fête de la République',  true, 1,  11, '#28a745', true, 'TD'),
    ('Fête Nationale',         true, 8,  11, '#28a745', true, 'TD'),
    ('Assomption',             true, 8,  15, '#6f42c1', true, 'TD'),
    ('Toussaint',              true, 11, 1,  '#6f42c1', true, 'TD'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'TD')
ON CONFLICT DO NOTHING;

-- ─── CF — RCA ─────────────────────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'CF'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'CF'),
    ('Fête Nationale',         true, 12, 1,  '#28a745', true, 'CF'),
    ('Assomption',             true, 8,  15, '#6f42c1', true, 'CF'),
    ('Toussaint',              true, 11, 1,  '#6f42c1', true, 'CF'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'CF')
ON CONFLICT DO NOTHING;

-- ─── GQ — Guinée Équatoriale ──────────────────────────────────
INSERT INTO jours_feries ("nom", "estRecurrent", "mois", "jourMois", "couleur", "estSysteme", "pays")
VALUES
    ('Nouvel An',              true, 1,  1,  '#dc3545', true, 'GQ'),
    ('Fête du Travail',        true, 5,  1,  '#dc3545', true, 'GQ'),
    ('Fête de l''Indépendance',true, 10, 12, '#28a745', true, 'GQ'),
    ('Assomption',             true, 8,  15, '#6f42c1', true, 'GQ'),
    ('Toussaint',              true, 11, 1,  '#6f42c1', true, 'GQ'),
    ('Noël',                   true, 12, 25, '#28a745', true, 'GQ')
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- SEEDS — Jours fériés variables chrétiens (2025-2027)
-- Pays observant le calendrier chrétien (majorité)
-- ═══════════════════════════════════════════════════════════════

-- ─── CI — Côte d'Ivoire (variables) ───────────────────────────
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien', true, 'CI'),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien', true, 'CI'),
    ('Ascension',            '2025-05-29', false, '#6f42c1', 'Calendrier chrétien', true, 'CI'),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien', true, 'CI'),
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien', true, 'CI'),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien', true, 'CI'),
    ('Ascension',            '2026-05-14', false, '#6f42c1', 'Calendrier chrétien', true, 'CI'),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien', true, 'CI'),
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien', true, 'CI'),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien', true, 'CI'),
    ('Ascension',            '2027-05-06', false, '#6f42c1', 'Calendrier chrétien', true, 'CI'),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien', true, 'CI')
ON CONFLICT DO NOTHING;

-- ─── SN — Sénégal (variables) ─────────────────────────────────
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien', true, 'SN'),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien', true, 'SN'),
    ('Ascension',            '2025-05-29', false, '#6f42c1', 'Calendrier chrétien', true, 'SN'),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien', true, 'SN'),
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien', true, 'SN'),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien', true, 'SN'),
    ('Ascension',            '2026-05-14', false, '#6f42c1', 'Calendrier chrétien', true, 'SN'),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien', true, 'SN'),
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien', true, 'SN'),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien', true, 'SN'),
    ('Ascension',            '2027-05-06', false, '#6f42c1', 'Calendrier chrétien', true, 'SN'),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien', true, 'SN')
ON CONFLICT DO NOTHING;

-- ─── CG — Congo-Brazzaville (variables) ───────────────────────
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien', true, 'CG'),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien', true, 'CG'),
    ('Ascension',            '2025-05-29', false, '#6f42c1', 'Calendrier chrétien', true, 'CG'),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien', true, 'CG'),
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien', true, 'CG'),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien', true, 'CG'),
    ('Ascension',            '2026-05-14', false, '#6f42c1', 'Calendrier chrétien', true, 'CG'),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien', true, 'CG'),
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien', true, 'CG'),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien', true, 'CG'),
    ('Ascension',            '2027-05-06', false, '#6f42c1', 'Calendrier chrétien', true, 'CG'),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien', true, 'CG')
ON CONFLICT DO NOTHING;

-- ─── CD — RD Congo (variables) ────────────────────────────────
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien', true, 'CD'),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien', true, 'CD'),
    ('Ascension',            '2025-05-29', false, '#6f42c1', 'Calendrier chrétien', true, 'CD'),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien', true, 'CD'),
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien', true, 'CD'),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien', true, 'CD'),
    ('Ascension',            '2026-05-14', false, '#6f42c1', 'Calendrier chrétien', true, 'CD'),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien', true, 'CD'),
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien', true, 'CD'),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien', true, 'CD'),
    ('Ascension',            '2027-05-06', false, '#6f42c1', 'Calendrier chrétien', true, 'CD'),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien', true, 'CD')
ON CONFLICT DO NOTHING;

-- ─── GA — Gabon (variables) ───────────────────────────────────
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien', true, 'GA'),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien', true, 'GA'),
    ('Ascension',            '2025-05-29', false, '#6f42c1', 'Calendrier chrétien', true, 'GA'),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien', true, 'GA'),
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien', true, 'GA'),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien', true, 'GA'),
    ('Ascension',            '2026-05-14', false, '#6f42c1', 'Calendrier chrétien', true, 'GA'),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien', true, 'GA'),
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien', true, 'GA'),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien', true, 'GA'),
    ('Ascension',            '2027-05-06', false, '#6f42c1', 'Calendrier chrétien', true, 'GA'),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien', true, 'GA')
ON CONFLICT DO NOTHING;

-- ─── BF — Burkina Faso (variables) ────────────────────────────
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien', true, 'BF'),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien', true, 'BF'),
    ('Ascension',            '2025-05-29', false, '#6f42c1', 'Calendrier chrétien', true, 'BF'),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien', true, 'BF'),
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien', true, 'BF'),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien', true, 'BF'),
    ('Ascension',            '2026-05-14', false, '#6f42c1', 'Calendrier chrétien', true, 'BF'),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien', true, 'BF'),
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien', true, 'BF'),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien', true, 'BF'),
    ('Ascension',            '2027-05-06', false, '#6f42c1', 'Calendrier chrétien', true, 'BF'),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien', true, 'BF')
ON CONFLICT DO NOTHING;

-- ─── BJ — Bénin (variables) ───────────────────────────────────
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien', true, 'BJ'),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien', true, 'BJ'),
    ('Ascension',            '2025-05-29', false, '#6f42c1', 'Calendrier chrétien', true, 'BJ'),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien', true, 'BJ'),
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien', true, 'BJ'),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien', true, 'BJ'),
    ('Ascension',            '2026-05-14', false, '#6f42c1', 'Calendrier chrétien', true, 'BJ'),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien', true, 'BJ'),
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien', true, 'BJ'),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien', true, 'BJ'),
    ('Ascension',            '2027-05-06', false, '#6f42c1', 'Calendrier chrétien', true, 'BJ'),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien', true, 'BJ')
ON CONFLICT DO NOTHING;

-- ─── TG — Togo (variables) ────────────────────────────────────
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien', true, 'TG'),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien', true, 'TG'),
    ('Ascension',            '2025-05-29', false, '#6f42c1', 'Calendrier chrétien', true, 'TG'),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien', true, 'TG'),
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien', true, 'TG'),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien', true, 'TG'),
    ('Ascension',            '2026-05-14', false, '#6f42c1', 'Calendrier chrétien', true, 'TG'),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien', true, 'TG'),
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien', true, 'TG'),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien', true, 'TG'),
    ('Ascension',            '2027-05-06', false, '#6f42c1', 'Calendrier chrétien', true, 'TG'),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien', true, 'TG')
ON CONFLICT DO NOTHING;

-- ─── GN — Guinée (variables) ──────────────────────────────────
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien', true, 'GN'),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien', true, 'GN'),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien', true, 'GN'),
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien', true, 'GN'),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien', true, 'GN'),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien', true, 'GN'),
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien', true, 'GN'),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien', true, 'GN'),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien', true, 'GN')
ON CONFLICT DO NOTHING;

-- ─── TD — Tchad (variables) ───────────────────────────────────
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien', true, 'TD'),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien', true, 'TD'),
    ('Ascension',            '2025-05-29', false, '#6f42c1', 'Calendrier chrétien', true, 'TD'),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien', true, 'TD'),
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien', true, 'TD'),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien', true, 'TD'),
    ('Ascension',            '2026-05-14', false, '#6f42c1', 'Calendrier chrétien', true, 'TD'),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien', true, 'TD'),
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien', true, 'TD'),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien', true, 'TD'),
    ('Ascension',            '2027-05-06', false, '#6f42c1', 'Calendrier chrétien', true, 'TD'),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien', true, 'TD')
ON CONFLICT DO NOTHING;

-- ─── CF — RCA (variables) ─────────────────────────────────────
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien', true, 'CF'),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien', true, 'CF'),
    ('Ascension',            '2025-05-29', false, '#6f42c1', 'Calendrier chrétien', true, 'CF'),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien', true, 'CF'),
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien', true, 'CF'),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien', true, 'CF'),
    ('Ascension',            '2026-05-14', false, '#6f42c1', 'Calendrier chrétien', true, 'CF'),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien', true, 'CF'),
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien', true, 'CF'),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien', true, 'CF'),
    ('Ascension',            '2027-05-06', false, '#6f42c1', 'Calendrier chrétien', true, 'CF'),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien', true, 'CF')
ON CONFLICT DO NOTHING;

-- ─── GQ — Guinée Équatoriale (variables) ──────────────────────
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    ('Vendredi Saint',       '2025-04-18', false, '#6f42c1', 'Calendrier chrétien', true, 'GQ'),
    ('Lundi de Pâques',      '2025-04-21', false, '#6f42c1', 'Calendrier chrétien', true, 'GQ'),
    ('Ascension',            '2025-05-29', false, '#6f42c1', 'Calendrier chrétien', true, 'GQ'),
    ('Lundi de Pentecôte',   '2025-06-09', false, '#6f42c1', 'Calendrier chrétien', true, 'GQ'),
    ('Vendredi Saint',       '2026-04-03', false, '#6f42c1', 'Calendrier chrétien', true, 'GQ'),
    ('Lundi de Pâques',      '2026-04-06', false, '#6f42c1', 'Calendrier chrétien', true, 'GQ'),
    ('Ascension',            '2026-05-14', false, '#6f42c1', 'Calendrier chrétien', true, 'GQ'),
    ('Lundi de Pentecôte',   '2026-05-25', false, '#6f42c1', 'Calendrier chrétien', true, 'GQ'),
    ('Vendredi Saint',       '2027-03-26', false, '#6f42c1', 'Calendrier chrétien', true, 'GQ'),
    ('Lundi de Pâques',      '2027-03-29', false, '#6f42c1', 'Calendrier chrétien', true, 'GQ'),
    ('Ascension',            '2027-05-06', false, '#6f42c1', 'Calendrier chrétien', true, 'GQ'),
    ('Lundi de Pentecôte',   '2027-05-17', false, '#6f42c1', 'Calendrier chrétien', true, 'GQ')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- SEEDS — Fêtes islamiques variables (2025-2027)
-- Tous les 15 pays (communautés musulmanes dans toute la zone)
-- Dates approximatives (calendrier lunaire, susceptibles ±1 jour)
-- ═══════════════════════════════════════════════════════════════

-- Fin Ramadan (1er Shawwal) et Tabaski (10 Dhou al-Hijja)
-- 2025: Fin Ramadan ≈ 30 mars, Tabaski ≈ 6 juin
-- 2026: Fin Ramadan ≈ 20 mars, Tabaski ≈ 27 mai
-- 2027: Fin Ramadan ≈ 10 mars, Tabaski ≈ 16 mai

-- Macro-insert pour tous les pays (15 pays × 6 entrées = 90 lignes)
INSERT INTO jours_feries ("nom", "date", "estRecurrent", "couleur", "description", "estSysteme", "pays")
VALUES
    -- CM — Cameroun
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CM'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CM'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CM'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CM'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CM'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CM'),
    -- CI — Côte d'Ivoire
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CI'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CI'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CI'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CI'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CI'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CI'),
    -- SN — Sénégal
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'SN'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'SN'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'SN'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'SN'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'SN'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'SN'),
    -- CG — Congo-Brazzaville
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CG'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CG'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CG'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CG'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CG'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CG'),
    -- CD — RD Congo
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CD'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CD'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CD'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CD'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CD'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CD'),
    -- GA — Gabon
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GA'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GA'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GA'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GA'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GA'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GA'),
    -- BF — Burkina Faso
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'BF'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'BF'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'BF'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'BF'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'BF'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'BF'),
    -- ML — Mali
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'ML'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'ML'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'ML'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'ML'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'ML'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'ML'),
    -- BJ — Bénin
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'BJ'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'BJ'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'BJ'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'BJ'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'BJ'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'BJ'),
    -- TG — Togo
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'TG'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'TG'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'TG'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'TG'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'TG'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'TG'),
    -- NE — Niger
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'NE'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'NE'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'NE'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'NE'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'NE'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'NE'),
    -- GN — Guinée
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GN'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GN'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GN'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GN'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GN'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GN'),
    -- TD — Tchad
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'TD'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'TD'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'TD'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'TD'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'TD'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'TD'),
    -- CF — RCA
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CF'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CF'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CF'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CF'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CF'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'CF'),
    -- GQ — Guinée Équatoriale
    ('Fin Ramadan',          '2025-03-30', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GQ'),
    ('Tabaski',              '2025-06-06', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GQ'),
    ('Fin Ramadan',          '2026-03-20', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GQ'),
    ('Tabaski',              '2026-05-27', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GQ'),
    ('Fin Ramadan',          '2027-03-10', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GQ'),
    ('Tabaski',              '2027-05-16', false, '#e67e22', 'Fête islamique — calendrier lunaire', true, 'GQ')
ON CONFLICT DO NOTHING;
