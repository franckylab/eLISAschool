-- ============================================
-- Migration 140: Audit enum — compétences, groupes, finances, diplômes, examens
-- ============================================
-- Ajoute les nouvelles valeurs AuditAction pour les modules non instrumentés.
-- Ajoute les permissions audit:{module}:view correspondantes.

-- ============================================
-- PARTIE 0 : Extension de l'enum audit_logs_action_enum
-- ============================================

-- Les ALTER TYPE ADD VALUE ne peuvent PAS être exécutés dans une transaction
-- (PG error: cannot run inside a transaction block)
-- Donc on force la transaction à s'exécuter en dehors d'un bloc BEGIN...COMMIT
-- En utilisant un bloc DO avec EXCEPTION pour chaque valeur.

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'COMPETENCE_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'COMPETENCE_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'COMPETENCE_DELETE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'MESSAGE_EDIT';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'CONVERSATION_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'CONVERSATION_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'CONVERSATION_DELETE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'DIPLOME_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'DIPLOME_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'DIPLOME_DELETE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'EXAMEN_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'EXAMEN_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'EXAMEN_DELETE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'GROUPE_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'GROUPE_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'GROUPE_DELETE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'GROUPE_ETAB_AJOUTER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'GROUPE_ETAB_RETIRER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'GROUPE_ADMIN_AJOUTER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'GROUPE_ADMIN_RETIRER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'FRAIS_SCOLARITE_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'FRAIS_SCOLARITE_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'PAIEMENT_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'PAIEMENT_VALIDER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'PAIEMENT_ANNULER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'REMISE_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'DEPENSE_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'DEPENSE_VALIDER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'DEPENSE_PAYER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'ECRITURE_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'ECRITURE_VALIDER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'ECRITURE_ANNULER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Fallback pour le nom alternatif généré par TypeORM
DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'COMPETENCE_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'COMPETENCE_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'COMPETENCE_DELETE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'MESSAGE_EDIT';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'CONVERSATION_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'CONVERSATION_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'CONVERSATION_DELETE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'DIPLOME_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'DIPLOME_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'DIPLOME_DELETE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'EXAMEN_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'EXAMEN_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'EXAMEN_DELETE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'GROUPE_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'GROUPE_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'GROUPE_DELETE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'GROUPE_ETAB_AJOUTER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'GROUPE_ETAB_RETIRER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'GROUPE_ADMIN_AJOUTER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'GROUPE_ADMIN_RETIRER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'FRAIS_SCOLARITE_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'FRAIS_SCOLARITE_UPDATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'PAIEMENT_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'PAIEMENT_VALIDER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'PAIEMENT_ANNULER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'REMISE_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'DEPENSE_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'DEPENSE_VALIDER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'DEPENSE_PAYER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'ECRITURE_CREATE';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'ECRITURE_VALIDER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE audit_action_enum ADD VALUE IF NOT EXISTS 'ECRITURE_ANNULER';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- ============================================
-- PARTIE 2 : Permissions audit:{module}:view
-- ============================================

INSERT INTO permissions (code, description, module, "categorie")
SELECT code, description, 'audit', categorie
FROM (VALUES
    ('audit:competences:view', 'Voir l historien des competences', 'competences'),
    ('audit:diplomes-eleves:view', 'Voir l historien des diplomes élèves', 'diplomes-eleves'),
    ('audit:examens-nationaux:view', 'Voir l historien des examens nationaux', 'examens-nationaux'),
    ('audit:groupes-etablissements:view', 'Voir l historien des groupes d établissements', 'groupes-etablissements'),
    ('audit:finances:view', 'Voir l historien des finances', 'finances'),
    ('audit:messagerie:view', 'Voir l historien de la messagerie', 'messagerie'),
    ('audit:sondages:view', 'Voir l historien des sondages', 'sondages'),
    ('audit:orientation:view', 'Voir l historien de l orientation', 'orientation'),
    ('audit:requetes:view', 'Voir l historien des requêtes', 'requetes'),
    ('audit:gamification:view', 'Voir l historien de la gamification', 'gamification'),
    ('audit:cartes:view', 'Voir l historien des cartes', 'cartes'),
    ('audit:clubs:view', 'Voir l historien des clubs', 'clubs'),
    ('audit:materiel:view', 'Voir l historien du matériel', 'materiel'),
    ('audit:configuration:view', 'Voir l historien de la configuration', 'configuration')
) AS v(code, description, categorie)
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.code = v.code);