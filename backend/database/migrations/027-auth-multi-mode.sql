-- ==================================
-- eLISAschool - Migration 027
-- ==================================
-- Authentification multi-mode : ajout de pseudonyme et qrCodeId
-- Version: 2.0.0
-- ==================================

-- Ajout du champ pseudonyme (unique, nullable)
ALTER TABLE utilisateurs 
ADD COLUMN IF NOT EXISTS pseudonyme VARCHAR(100) UNIQUE;

-- Ajout du champ qrCodeId (unique, nullable)
ALTER TABLE utilisateurs 
ADD COLUMN IF NOT EXISTS qrCodeId VARCHAR(100) UNIQUE;

-- Index pour performance des recherches multi-mode
CREATE INDEX IF NOT EXISTS idx_utilisateurs_pseudonyme ON utilisateurs(pseudonyme);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_qr_code ON utilisateurs(qrCodeId);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_matricule ON utilisateurs(matricule);

-- Commentaires
COMMENT ON COLUMN utilisateurs.pseudonyme IS 'Pseudonyme unique pour l''authentification';
COMMENT ON COLUMN utilisateurs.qrCodeId IS 'Identifiant QR code pour l''authentification par scan';

-- Note: La recherche multi-mode utilise OR sur :
-- email, matricule, pseudonyme, qrCodeId, id (si UUID)
