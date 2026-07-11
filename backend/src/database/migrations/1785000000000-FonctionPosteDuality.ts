import { MigrationInterface, QueryRunner } from 'typeorm';

export class FonctionPosteDuality1785000000000 implements MigrationInterface {
    name = 'FonctionPosteDuality1785000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Table fonctions
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS fonctions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                nom VARCHAR(150) NOT NULL,
                code VARCHAR(50) NOT NULL,
                description TEXT,
                "parentId" UUID REFERENCES fonctions(id) ON DELETE SET NULL,
                niveau INTEGER DEFAULT 0,
                chemin VARCHAR(500),
                "primesDefaut" JSONB,
                "majorationDefaut" NUMERIC(5,2),
                "estSysteme" BOOLEAN DEFAULT FALSE,
                actif BOOLEAN DEFAULT TRUE,
                ordre INTEGER DEFAULT 1,
                "etablissementId" UUID NOT NULL REFERENCES etablissements(id),
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_fonctions_code_etablissement
            ON fonctions(code, "etablissementId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_fonctions_parent
            ON fonctions("parentId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_fonctions_etablissement
            ON fonctions("etablissementId")
        `);

        // 2. Ajout fonctionId à postes
        await queryRunner.query(`
            ALTER TABLE postes
            ADD COLUMN IF NOT EXISTS "fonctionId" UUID REFERENCES fonctions(id) ON DELETE SET NULL
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_postes_fonction
            ON postes("fonctionId")
        `);

        // 3. Table membres_fonctions (historique des fonctions par membre)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS membres_fonctions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "membrePersonnelId" UUID NOT NULL REFERENCES membres_personnel(id) ON DELETE CASCADE,
                "fonctionId" UUID NOT NULL REFERENCES fonctions(id) ON DELETE CASCADE,
                "dateDebut" DATE NOT NULL,
                "dateFin" DATE,
                "estPrincipale" BOOLEAN DEFAULT FALSE,
                commentaire TEXT,
                "etablissementId" UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_membres_fonctions_membre
            ON membres_fonctions("membrePersonnelId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_membres_fonctions_fonction
            ON membres_fonctions("fonctionId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_membres_fonctions_etablissement
            ON membres_fonctions("etablissementId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_membres_fonctions_principale
            ON membres_fonctions("membrePersonnelId", "estPrincipale")
        `);

        // 4. Ajout fonctionId à contrats_personnel
        await queryRunner.query(`
            ALTER TABLE contrats_personnel
            ADD COLUMN IF NOT EXISTS "fonctionId" UUID REFERENCES fonctions(id) ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE contrats_personnel DROP COLUMN IF EXISTS "fonctionId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS membres_fonctions`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_postes_fonction`);
        await queryRunner.query(`ALTER TABLE postes DROP COLUMN IF EXISTS "fonctionId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS fonctions`);
    }
}
