-- ==================================
-- eLISAschool - Migration 129
-- ==================================
-- Table notes_versions (historique des modifications de notes)
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- ==================================

-- Création de la table notes_versions
CREATE TABLE IF NOT EXISTS notes_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "noteId" UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    "modifiePar" VARCHAR(100) NOT NULL,
    raison VARCHAR(50),
    "etablissementId" UUID NOT NULL,
    "creeeAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour recherches par note
CREATE INDEX IF NOT EXISTS idx_notes_versions_note_id ON notes_versions("noteId");

-- Index unique pour garantir l'unicité des versions par note
CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_versions_note_version ON notes_versions("noteId", version);

-- Index multi-tenant
CREATE INDEX IF NOT EXISTS idx_notes_versions_etablissement ON notes_versions("etablissementId");

-- Commentaire
COMMENT ON TABLE notes_versions IS 'Historique des modifications de notes — snapshot JSONB avant chaque update';
COMMENT ON COLUMN notes_versions.snapshot IS 'État complet de la note AVANT la modification';
COMMENT ON COLUMN notes_versions.version IS 'Numéro de version auto-incrémenté par note';
