/**
 * ==================================
 * eLISAschool - Migration 040
 * ==================================
 * Programme Pédagogique Complet
 * Date: 9 juin 2026
 * 
 * Modifications:
 * 1. CREATE TABLE programme_chapitres
 * 2. ALTER TABLE progressions_programme (programmeChapitreId, modeCalcul, updatedAt)
 * 3. ALTER TABLE evaluations_enseignants (progressionId, noteElevesMoyenne)
 * 4. INSERT parametres_systeme (5 paramètres programme.*)
 * 5. INSERT permissions (8 permissions programmes:*)
 * 6. INSERT badges (5 badges enseignants)
 * 7. INSERT regles_scoring_personnel (3 règles)
 * ==================================
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgrammePedagogiqueComplet1717920000000 implements MigrationInterface {
    name = 'ProgrammePedagogiqueComplet1717920000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ==========================================
        // 1. CREATE TABLE programme_chapitres
        // ==========================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS programme_chapitres (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "matiereNiveauId" UUID NOT NULL,
                "periodeId" UUID,
                "titre" VARCHAR(255) NOT NULL,
                "description" TEXT,
                "objectifsPedagogiques" TEXT,
                "ordre" INT DEFAULT 0,
                "dureePrevueHeures" INT,
                "statut" VARCHAR(30) DEFAULT 'ACTIF',
                "etablissementId" UUID NOT NULL,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // FK constraints
        await queryRunner.query(`
            ALTER TABLE programme_chapitres
            ADD CONSTRAINT fk_programme_chapitres_matiere_niveau
            FOREIGN KEY ("matiereNiveauId") REFERENCES matieres_niveaux(id) ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE programme_chapitres
            ADD CONSTRAINT fk_programme_chapitres_periode
            FOREIGN KEY ("periodeId") REFERENCES periodes(id) ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE programme_chapitres
            ADD CONSTRAINT fk_programme_chapitres_etablissement
            FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE
        `);

        // Index pour performance
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_programme_chapitres_matiere_niveau ON programme_chapitres("matiereNiveauId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_programme_chapitres_periode ON programme_chapitres("periodeId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_programme_chapitres_etablissement ON programme_chapitres("etablissementId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_programme_chapitres_composite ON programme_chapitres("matiereNiveauId", "periodeId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_programme_chapitres_ordre ON programme_chapitres("ordre")`);

        // ==========================================
        // 2. ALTER TABLE progressions_programme
        // ==========================================
        await queryRunner.query(`
            ALTER TABLE progressions_programme
            ADD COLUMN IF NOT EXISTS "programmeChapitreId" UUID
        `);

        await queryRunner.query(`
            ALTER TABLE progressions_programme
            ADD COLUMN IF NOT EXISTS "modeCalcul" VARCHAR(30) DEFAULT 'LEGACY'
        `);

        await queryRunner.query(`
            ALTER TABLE progressions_programme
            ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ
        `);

        // FK vers programme_chapitres
        await queryRunner.query(`
            ALTER TABLE progressions_programme
            ADD CONSTRAINT fk_progressions_programme_chapitre
            FOREIGN KEY ("programmeChapitreId") REFERENCES programme_chapitres(id) ON DELETE SET NULL
        `);

        // Index
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_progressions_chapitre ON progressions_programme("programmeChapitreId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_progressions_mode_calcul ON progressions_programme("modeCalcul")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_progressions_composite_enseignant_matiere ON progressions_programme("enseignantId", "matiereId")`);

        // ==========================================
        // 3. ALTER TABLE evaluations_enseignants
        // ==========================================
        await queryRunner.query(`
            ALTER TABLE evaluations_enseignants
            ADD COLUMN IF NOT EXISTS "progressionId" UUID
        `);

        await queryRunner.query(`
            ALTER TABLE evaluations_enseignants
            ADD COLUMN IF NOT EXISTS "noteElevesMoyenne" DECIMAL(5,2)
        `);

        // Index
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_eval_enseignant_progression ON evaluations_enseignants("progressionId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_eval_enseignant_composite ON evaluations_enseignants("enseignantId", "dateEvaluation" DESC)`);

        // ==========================================
        // 4. INSERT parametres_systeme
        // ==========================================
        await queryRunner.query(`
            INSERT INTO parametres_systeme (cle, valeur, "typeValeur", categorie, module, description, "modifiableRuntime", visible, ordre, "createdAt")
            VALUES 
                ('programme.progression_auto_calcul', 'true', 'BOOLEAN', 'MODULE', 'programmes', 'Calculer automatiquement le % de progression basé sur les chapitres réalisés', true, true, 1, NOW()),
                ('programme.ecart_acceptable_progression', '10', 'NUMBER', 'MODULE', 'programmes', 'Écart acceptable (%) entre progression déclarée et programme officiel', true, true, 2, NOW()),
                ('programme.evaluation_correlation_notes', 'true', 'BOOLEAN', 'MODULE', 'programmes', 'Corréler automatiquement les évaluations enseignants avec les notes élèves', true, true, 3, NOW()),
                ('programme.gamification_enseignants_actif', 'true', 'BOOLEAN', 'MODULE', 'programmes', 'Activer la gamification pour les enseignants', true, true, 4, NOW()),
                ('programme.seuil_progression_conforme', '90', 'NUMBER', 'MODULE', 'programmes', 'Seuil (%) pour considérer une progression comme conforme', true, true, 5, NOW())
            ON CONFLICT (cle) DO NOTHING
        `);

        // ==========================================
        // 5. INSERT permissions
        // ==========================================
        await queryRunner.query(`
            INSERT INTO permissions (code, description, module, actif, "createdAt")
            VALUES 
                ('programmes:chapitre:read', 'Consulter chapitres programme', 'programmes', true, NOW()),
                ('programmes:chapitre:write', 'Créer/modifier chapitres programme', 'programmes', true, NOW()),
                ('programmes:chapitre:delete', 'Supprimer chapitres programme', 'programmes', true, NOW()),
                ('programmes:progression:read', 'Consulter progressions', 'programmes', true, NOW()),
                ('programmes:progression:write', 'Saisir progressions', 'programmes', true, NOW()),
                ('programmes:correlation:read', 'Voir corrélations', 'programmes', true, NOW()),
                ('programmes:dashboard:view', 'Voir dashboard programme', 'programmes', true, NOW()),
                ('programmes:config:write', 'Configurer programme pédagogique', 'programmes', true, NOW())
            ON CONFLICT (code) DO NOTHING
        `);

        // ==========================================
        // 6. Attribution permissions aux rôles
        // ==========================================
        // ADMIN et SUPER_ADMIN : toutes les permissions
        await queryRunner.query(`
            INSERT INTO role_permissions ("roleId", "permissionId")
            SELECT r.id, p.id
            FROM roles r
            CROSS JOIN permissions p
            WHERE r.nom IN ('ADMIN', 'SUPER_ADMIN')
            AND p.code LIKE 'programmes:%'
            ON CONFLICT ("roleId", "permissionId") DO NOTHING
        `);

        // ENSEIGNANT : lecture chapitres, lecture/écriture progressions
        await queryRunner.query(`
            INSERT INTO role_permissions ("roleId", "permissionId")
            SELECT r.id, p.id
            FROM roles r
            CROSS JOIN permissions p
            WHERE r.nom = 'ENSEIGNANT'
            AND p.code IN ('programmes:chapitre:read', 'programmes:progression:read', 'programmes:progression:write')
            ON CONFLICT ("roleId", "permissionId") DO NOTHING
        `);

        // DIRECTEUR_PEDAGOGIQUE : toutes sauf config:write
        await queryRunner.query(`
            INSERT INTO role_permissions ("roleId", "permissionId")
            SELECT r.id, p.id
            FROM roles r
            CROSS JOIN permissions p
            WHERE r.nom = 'DIRECTEUR_PEDAGOGIQUE'
            AND p.code LIKE 'programmes:%'
            AND p.code != 'programmes:config:write'
            ON CONFLICT ("roleId", "permissionId") DO NOTHING
        `);

        // INSPECTEUR : lecture chapitres, progressions, correlations, dashboard
        await queryRunner.query(`
            INSERT INTO role_permissions ("roleId", "permissionId")
            SELECT r.id, p.id
            FROM roles r
            CROSS JOIN permissions p
            WHERE r.nom = 'INSPECTEUR'
            AND p.code IN ('programmes:chapitre:read', 'programmes:progression:read', 'programmes:correlation:read', 'programmes:dashboard:view')
            ON CONFLICT ("roleId", "permissionId") DO NOTHING
        `);

        // ==========================================
        // 7. INSERT badges enseignants
        // ==========================================
        await queryRunner.query(`
            INSERT INTO badges (code, nom, description, "pointsRequis", categorie, actif, "createdAt")
            VALUES 
                ('PROGRESSIONNISTE', 'Progressionniste', 'A complété 100% du programme à temps', 500, 'enseignant', true, NOW()),
                ('PEDAGOGUE_EXCELLENT', 'Pédagogue Excellent', 'Note évaluation >= 16/20', 300, 'enseignant', true, NOW()),
                ('CONFORMITE_PARFAITE', 'Conformité Parfaite', 'Écart progression < 5% pendant 3 périodes', 400, 'enseignant', true, NOW()),
                ('CORRELATEUR', 'Corrélateur', 'Progression corrélée avec +10% notes élèves', 350, 'enseignant', true, NOW()),
                ('CHAPITRE_MASTER', 'Chapitre Master', 'A documenté tous les chapitres d''une année', 200, 'enseignant', true, NOW())
            ON CONFLICT (code) DO NOTHING
        `);

        // ==========================================
        // 8. INSERT regles_scoring_personnel
        // ==========================================
        await queryRunner.query(`
            INSERT INTO regles_scoring_personnel ("etablissementId", code, libelle, description, "typeAction", "pointsAttribues", "estAutomatique", "estActif", "categorieCible", "createdAt")
            SELECT e.id, 'programme:progression_conforme', 'Progression conforme au programme', 'Écart < 10% avec le programme officiel', 'PROGRESSION_CONFORME', 25, true, true, 'ENSEIGNANT', NOW()
            FROM etablissements e
            WHERE e.actif = true
            ON CONFLICT (code, "etablissementId") DO NOTHING
        `);

        await queryRunner.query(`
            INSERT INTO regles_scoring_personnel ("etablissementId", code, libelle, description, "typeAction", "pointsAttribues", "estAutomatique", "estActif", "categorieCible", "createdAt")
            SELECT e.id, 'programme:evaluation_excellente', 'Excellence pédagogique', 'Note moyenne >= 16/20', 'EVALUATION_EXCELLENTE', 30, true, true, 'ENSEIGNANT', NOW()
            FROM etablissements e
            WHERE e.actif = true
            ON CONFLICT (code, "etablissementId") DO NOTHING
        `);

        await queryRunner.query(`
            INSERT INTO regles_scoring_personnel ("etablissementId", code, libelle, description, "typeAction", "pointsAttribues", "estAutomatique", "estActif", "categorieCible", "createdAt")
            SELECT e.id, 'programme:progression_complete', 'Programme complété', '100% du programme réalisé', 'PROGRESSION_COMPLETE', 40, true, true, 'ENSEIGNANT', NOW()
            FROM etablissements e
            WHERE e.actif = true
            ON CONFLICT (code, "etablissementId") DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer FK progressions_programme
        await queryRunner.query(`ALTER TABLE progressions_programme DROP CONSTRAINT IF EXISTS fk_progressions_programme_chapitre`);
        
        // Supprimer FK evaluations_enseignants
        await queryRunner.query(`ALTER TABLE evaluations_enseignants DROP CONSTRAINT IF EXISTS fk_evaluations_enseignants_progression`);
        
        // Supprimer FK programme_chapitres
        await queryRunner.query(`ALTER TABLE programme_chapitres DROP CONSTRAINT IF EXISTS fk_programme_chapitres_matiere_niveau`);
        await queryRunner.query(`ALTER TABLE programme_chapitres DROP CONSTRAINT IF EXISTS fk_programme_chapitres_periode`);
        await queryRunner.query(`ALTER TABLE programme_chapitres DROP CONSTRAINT IF EXISTS fk_programme_chapitres_etablissement`);

        // Supprimer tables
        await queryRunner.query(`DROP TABLE IF EXISTS programme_chapitres CASCADE`);

        // Supprimer colonnes ajoutées
        await queryRunner.query(`ALTER TABLE progressions_programme DROP COLUMN IF EXISTS "programmeChapitreId"`);
        await queryRunner.query(`ALTER TABLE progressions_programme DROP COLUMN IF EXISTS "modeCalcul"`);
        await queryRunner.query(`ALTER TABLE progressions_programme DROP COLUMN IF EXISTS "updatedAt"`);
        
        await queryRunner.query(`ALTER TABLE evaluations_enseignants DROP COLUMN IF EXISTS "progressionId"`);
        await queryRunner.query(`ALTER TABLE evaluations_enseignants DROP COLUMN IF EXISTS "noteElevesMoyenne"`);

        // Supprimer paramètres
        await queryRunner.query(`DELETE FROM parametres_systeme WHERE cle LIKE 'programme.%'`);

        // Supprimer permissions
        await queryRunner.query(`DELETE FROM permissions WHERE code LIKE 'programmes:%'`);

        // Supprimer badges
        await queryRunner.query(`DELETE FROM badges WHERE code IN ('PROGRESSIONNISTE', 'PEDAGOGUE_EXCELLENT', 'CONFORMITE_PARFAITE', 'CORRELATEUR', 'CHAPITRE_MASTER')`);

        // Supprimer règles scoring
        await queryRunner.query(`DELETE FROM regles_scoring_personnel WHERE code LIKE 'programme:%'`);
    }
}
