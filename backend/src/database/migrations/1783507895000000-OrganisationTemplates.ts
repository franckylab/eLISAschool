import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrganisationTemplates1783507895000000 implements MigrationInterface {
    name = 'OrganisationTemplates1783507895000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ==========================================
        // 1. Niveaux d'organisation
        // ==========================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS niveaux_organisation (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                niveau INTEGER NOT NULL,
                label VARCHAR(50) NOT NULL,
                description TEXT,
                etablissementId UUID REFERENCES etablissements(id) ON DELETE CASCADE,
                estSysteme BOOLEAN DEFAULT FALSE,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_niveaux_organisation_niveau_etablissement
            ON niveaux_organisation(niveau, etablissementId)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_niveaux_organisation_etablissement
            ON niveaux_organisation(etablissementId)
        `);

        // ==========================================
        // 2. Usages d'unité
        // ==========================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS usages_unite (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(50) NOT NULL,
                label VARCHAR(100) NOT NULL,
                description TEXT,
                etablissementId UUID REFERENCES etablissements(id) ON DELETE CASCADE,
                estSysteme BOOLEAN DEFAULT FALSE,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_usages_unite_code_etablissement
            ON usages_unite(code, etablissementId)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_usages_unite_etablissement
            ON usages_unite(etablissementId)
        `);

        // ==========================================
        // 3. Catégories de poste
        // ==========================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS categories_poste (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(50) NOT NULL,
                label VARCHAR(100) NOT NULL,
                description TEXT,
                etablissementId UUID REFERENCES etablissements(id) ON DELETE CASCADE,
                estSysteme BOOLEAN DEFAULT FALSE,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_poste_code_etablissement
            ON categories_poste(code, etablissementId)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_categories_poste_etablissement
            ON categories_poste(etablissementId)
        `);

        // ==========================================
        // 4. Niveaux de responsabilité
        // ==========================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS niveaux_responsabilite (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                niveau INTEGER NOT NULL,
                code VARCHAR(50) NOT NULL,
                label VARCHAR(100) NOT NULL,
                description TEXT,
                etablissementId UUID REFERENCES etablissements(id) ON DELETE CASCADE,
                estSysteme BOOLEAN DEFAULT FALSE,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_niveaux_resp_code_etablissement
            ON niveaux_responsabilite(code, etablissementId)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_niveaux_resp_etablissement
            ON niveaux_responsabilite(etablissementId)
        `);

        // ==========================================
        // 5. Templates d'organisation
        // ==========================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS templates_organisation (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                nom VARCHAR(200) NOT NULL,
                description TEXT,
                structure JSONB NOT NULL,
                etablissementId UUID REFERENCES etablissements(id) ON DELETE CASCADE,
                estSysteme BOOLEAN DEFAULT FALSE,
                actif BOOLEAN DEFAULT TRUE,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_templates_organisation_etablissement
            ON templates_organisation(etablissementId)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_templates_organisation_actif
            ON templates_organisation(actif)
        `);

        // ==========================================
        // 6. ALTER unites_organisationnelles
        // ==========================================
        await queryRunner.query(`
            ALTER TABLE unites_organisationnelles
            ADD COLUMN IF NOT EXISTS "usageUniteCode" VARCHAR(50)
        `);
        await queryRunner.query(`
            ALTER TABLE unites_organisationnelles
            ADD COLUMN IF NOT EXISTS "niveauOrganisationId" UUID
            REFERENCES niveaux_organisation(id) ON DELETE SET NULL
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_unites_usage_unite_code
            ON unites_organisationnelles("usageUniteCode")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_unites_niveau_organisation
            ON unites_organisationnelles("niveauOrganisationId")
        `);

        // ==========================================
        // 7. ALTER postes
        // ==========================================
        await queryRunner.query(`
            ALTER TABLE postes
            ADD COLUMN IF NOT EXISTS "categoriePosteCode" VARCHAR(50)
        `);
        await queryRunner.query(`
            ALTER TABLE postes
            ADD COLUMN IF NOT EXISTS "niveauResponsabiliteCode" VARCHAR(50)
        `);

        // ==========================================
        // 8. ALTER hierarchie_personnel
        // ==========================================
        await queryRunner.query(`
            ALTER TABLE hierarchie_personnel
            ALTER COLUMN "personnelId" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE hierarchie_personnel
            ALTER COLUMN "personnelNom" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE hierarchie_personnel
            ALTER COLUMN "superieurId" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE hierarchie_personnel
            ALTER COLUMN "superieurNom" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE hierarchie_personnel
            ADD COLUMN IF NOT EXISTS "posteId" UUID
            REFERENCES postes(id) ON DELETE SET NULL
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_hierarchie_poste
            ON hierarchie_personnel("posteId")
        `);

        // ==========================================
        // 9. Seed données système — Niveaux d'organisation
        // ==========================================
        await queryRunner.query(`
            INSERT INTO niveaux_organisation (niveau, label, estSysteme) VALUES
                (0, 'Poste', TRUE),
                (1, 'Bureau', TRUE),
                (2, 'Service', TRUE),
                (3, 'Département', TRUE),
                (4, 'Direction', TRUE),
                (5, 'Direction Générale', TRUE)
            ON CONFLICT (niveau, etablissementId)
            WHERE etablissementId IS NULL
            DO NOTHING
        `);

        // ==========================================
        // 10. Seed — Usages d'unité système
        // ==========================================
        await queryRunner.query(`
            INSERT INTO usages_unite (code, label, description, estSysteme) VALUES
                ('DIRECTION', 'Direction', 'Unité de direction générale', TRUE),
                ('DEPARTEMENT', 'Département', 'Département pédagogique ou administratif', TRUE),
                ('SERVICE', 'Service', 'Service spécialisé', TRUE),
                ('POLE', 'Pôle', 'Pôle d activité', TRUE),
                ('FILIERE', 'Filière', 'Filière de formation', TRUE),
                ('CYCLE', 'Cycle', 'Cycle d enseignement', TRUE),
                ('SECTION', 'Section', 'Section linguistique ou spécialisée', TRUE),
                ('COMMISSION', 'Commission', 'Commission temporaire ou permanente', TRUE),
                ('EQUIPE', 'Équipe', 'Équipe de travail', TRUE),
                ('BUREAU', 'Bureau', 'Bureau administratif', TRUE),
                ('ATELIER', 'Atelier', 'Atelier technique', TRUE),
                ('CENSORAT', 'Censorat', 'Censorat (adjoint pédagogique lycée)', TRUE),
                ('SURVEILLANCE', 'Surveillance Générale', 'Surveillance générale (discipline)', TRUE),
                ('INTENDANCE', 'Intendance', 'Intendance / Économat', TRUE),
                ('CDI', 'Centre de Documentation', 'Centre de documentation et d information', TRUE),
                ('ORIENTATION', 'Orientation Scolaire', 'Service d orientation scolaire', TRUE),
                ('MEDECINE', 'Médecine Scolaire', 'Service social et de médecine scolaire', TRUE),
                ('SPORTS', 'Sports Scolaires', 'Service des sports scolaires', TRUE),
                ('APPS', 'Activités Post/Périscolaires', 'Activités post et périscolaires', TRUE),
                ('ENSEIGNEMENT', 'Enseignement', 'Corps enseignant', TRUE),
                ('AUTRE', 'Autre', 'Autre type d unité', TRUE)
            ON CONFLICT (code, etablissementId)
            WHERE etablissementId IS NULL
            DO NOTHING
        `);

        // ==========================================
        // 11. Seed — Catégories de poste système
        // ==========================================
        await queryRunner.query(`
            INSERT INTO categories_poste (code, label, description, estSysteme) VALUES
                ('DIRECTION', 'Direction', 'Poste de direction', TRUE),
                ('ENSEIGNANT', 'Enseignant', 'Personnel enseignant', TRUE),
                ('ADMINISTRATIF', 'Administratif', 'Personnel administratif', TRUE),
                ('TECHNIQUE', 'Technique', 'Personnel technique', TRUE),
                ('SERVICE', 'Service', 'Personnel de service', TRUE),
                ('EDUCATIF', 'Éducatif', 'Personnel d éducation et de surveillance', TRUE),
                ('SANTE', 'Santé', 'Personnel de santé scolaire', TRUE),
                ('ORIENTATION', 'Orientation', 'Conseiller d orientation', TRUE),
                ('DOCUMENTATION', 'Documentation', 'Personnel de documentation', TRUE),
                ('STAGE', 'Stage', 'Stagiaire', TRUE),
                ('TEMPORAIRE', 'Temporaire', 'Personnel temporaire ou vacataire', TRUE),
                ('AUTRE', 'Autre', 'Autre type de poste', TRUE)
            ON CONFLICT (code, etablissementId)
            WHERE etablissementId IS NULL
            DO NOTHING
        `);

        // ==========================================
        // 12. Seed — Niveaux de responsabilité système
        // ==========================================
        await queryRunner.query(`
            INSERT INTO niveaux_responsabilite (niveau, code, label, description, estSysteme) VALUES
                (6, 'DIRECTION_GENERALE', 'Direction Générale', 'Direction générale de l établissement', TRUE),
                (5, 'DIRECTION', 'Direction', 'Direction d unité', TRUE),
                (4, 'DIRECTION_ADJOINTE', 'Direction Adjointe', 'Direction adjointe', TRUE),
                (3, 'RESPONSABLE', 'Responsable', 'Responsable de service ou département', TRUE),
                (2, 'COORDINATEUR', 'Coordinateur', 'Coordinateur pédagogique', TRUE),
                (1, 'SUPERVISEUR', 'Superviseur', 'Superviseur / Contrôleur', TRUE),
                (0, 'EXECUTANT', 'Exécutant', 'Personnel d exécution', TRUE)
            ON CONFLICT (code, etablissementId)
            WHERE etablissementId IS NULL
            DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_hierarchie_poste`);
        await queryRunner.query(`ALTER TABLE hierarchie_personnel DROP COLUMN IF EXISTS "posteId"`);
        await queryRunner.query(`ALTER TABLE hierarchie_personnel ALTER COLUMN "personnelId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE hierarchie_personnel ALTER COLUMN "superieurId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE postes DROP COLUMN IF EXISTS "niveauResponsabiliteCode"`);
        await queryRunner.query(`ALTER TABLE postes DROP COLUMN IF EXISTS "categoriePosteCode"`);
        await queryRunner.query(`ALTER TABLE unites_organisationnelles DROP COLUMN IF EXISTS "niveauOrganisationId"`);
        await queryRunner.query(`ALTER TABLE unites_organisationnelles DROP COLUMN IF EXISTS "usageUniteCode"`);
        await queryRunner.query(`DROP TABLE IF EXISTS templates_organisation`);
        await queryRunner.query(`DROP TABLE IF EXISTS niveaux_responsabilite`);
        await queryRunner.query(`DROP TABLE IF EXISTS categories_poste`);
        await queryRunner.query(`DROP TABLE IF EXISTS usages_unite`);
        await queryRunner.query(`DROP TABLE IF EXISTS niveaux_organisation`);
    }
}
