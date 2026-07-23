import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnrichTypePersonnel1790000000000 implements MigrationInterface {
    name = 'EnrichTypePersonnel1790000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "types_personnel"
            ADD COLUMN IF NOT EXISTS "roleIdParDefaut" uuid DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS "description" varchar(200) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS "modeRemunerationDefaut" varchar(30) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS "actif" boolean DEFAULT true NOT NULL,
            ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT now() NOT NULL
        `);

        const existing = await queryRunner.query(`SELECT code FROM "types_personnel"`);
        const existingCodes = new Set(existing.map((r: any) => r.code));

        const defaultTypes = [
            { code: 'ENSEIGNANT', nom: 'Enseignant', modeRemunerationDefaut: 'MIXTE' },
            { code: 'DIRECTION', nom: 'Direction', modeRemunerationDefaut: 'MENSUEL' },
            { code: 'ADMINISTRATIF', nom: 'Administratif', modeRemunerationDefaut: 'MENSUEL' },
            { code: 'TECHNIQUE', nom: 'Technique', modeRemunerationDefaut: 'HORAIRE' },
            { code: 'SERVICE', nom: 'Service', modeRemunerationDefaut: 'HORAIRE' },
            { code: 'STAGE', nom: 'Stagiaire', modeRemunerationDefaut: 'MENSUEL' },
            { code: 'TEMPORAIRE', nom: 'Temporaire', modeRemunerationDefaut: 'HORAIRE' },
            { code: 'AUTRE', nom: 'Autre', modeRemunerationDefaut: 'MENSUEL' },
        ];

        for (const tp of defaultTypes) {
            if (!existingCodes.has(tp.code)) {
                await queryRunner.query(
                    `INSERT INTO "types_personnel" (code, nom, "modeRemunerationDefaut", actif) VALUES ($1, $2, $3, true)`,
                    [tp.code, tp.nom, tp.modeRemunerationDefaut],
                );
            } else {
                await queryRunner.query(
                    `UPDATE "types_personnel" SET "modeRemunerationDefaut" = COALESCE("modeRemunerationDefaut", $1), actif = true WHERE code = $2`,
                    [tp.modeRemunerationDefaut, tp.code],
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "types_personnel"
            DROP COLUMN IF EXISTS "roleIdParDefaut",
            DROP COLUMN IF EXISTS "description",
            DROP COLUMN IF EXISTS "modeRemunerationDefaut",
            DROP COLUMN IF EXISTS "actif",
            DROP COLUMN IF EXISTS "updatedAt"
        `);
    }
}
