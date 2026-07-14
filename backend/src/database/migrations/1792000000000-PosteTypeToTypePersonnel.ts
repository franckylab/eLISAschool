import { MigrationInterface, QueryRunner } from 'typeorm';

export class PosteTypeToTypePersonnel1792000000000 implements MigrationInterface {
    name = 'PosteTypeToTypePersonnel1792000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ajouter la colonne typePersonnelId (IF NOT EXISTS = safe si déjà présente)
        await queryRunner.query(`
            ALTER TABLE "postes"
            ADD COLUMN IF NOT EXISTS "typePersonnelId" uuid DEFAULT NULL
        `);

        // 2. Backfill: mapper les anciennes valeurs de l'enum type → TypePersonnel.id
        //    Ne backfill que les lignes où typePersonnelId est NULL et type n'est pas NULL
        const hasTypeColumn = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'postes' AND column_name = 'type'
            ) as exists
        `);

        if (hasTypeColumn[0]?.exists) {
            await queryRunner.query(`
                UPDATE "postes" p
                SET "typePersonnelId" = tp.id
                FROM "types_personnel" tp
                WHERE tp.code = p.type::varchar
                  AND p."typePersonnelId" IS NULL
            `);
        }

        // 3. Supprimer l'index sur l'ancienne colonne type (safe)
        await queryRunner.query(`
            DO $$ DECLARE
                idx_name text;
            BEGIN
                SELECT i.indexname INTO idx_name
                FROM pg_indexes i
                WHERE i.tablename = 'postes'
                  AND i.indexdef LIKE '%type%'
                  AND i.indexdef NOT LIKE '%typePersonnel%'
                  AND i.indexdef NOT LIKE '%typePersonnelId%';
                IF idx_name IS NOT NULL THEN
                    EXECUTE 'DROP INDEX IF EXISTS "' || idx_name || '"';
                END IF;
            END $$;
        `);

        // 4. Supprimer la colonne type (IF EXISTS = safe)
        await queryRunner.query(`ALTER TABLE "postes" DROP COLUMN IF EXISTS type`);

        // 5. Ajouter un index sur la nouvelle colonne (IF NOT EXISTS = safe)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_postes_typePersonnelId" ON "postes" ("typePersonnelId")
        `);

        // 6. Ajouter la FK si aucune FK n'existe déjà sur typePersonnelId
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint c
                    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
                    WHERE c.contype = 'f'
                      AND a.attrelid = 'postes'::regclass
                      AND a.attname = 'typePersonnelId'
                ) THEN
                    ALTER TABLE "postes"
                    ADD CONSTRAINT "FK_postes_typePersonnelId"
                    FOREIGN KEY ("typePersonnelId")
                    REFERENCES "types_personnel"(id)
                    ON DELETE SET NULL;
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_postes_typePersonnelId'
                ) THEN
                    ALTER TABLE "postes" DROP CONSTRAINT "FK_postes_typePersonnelId";
                END IF;
            END $$;
        `);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_postes_typePersonnelId"`);

        // Recréer la colonne type avec l'enum si elle n'existe pas déjà
        const hasTypeColumn = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'postes' AND column_name = 'type'
            ) as exists
        `);

        if (!hasTypeColumn[0]?.exists) {
            await queryRunner.query(`
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'postes_type_enum') THEN
                        CREATE TYPE "public"."postes_type_enum" AS ENUM(
                            'DIRECTION', 'ENSEIGNANT', 'ADMINISTRATIF', 'TECHNIQUE',
                            'SERVICE', 'STAGE', 'TEMPORAIRE', 'AUTRE'
                        );
                    END IF;
                END $$;
            `);
            await queryRunner.query(`
                ALTER TABLE "postes"
                ADD COLUMN IF NOT EXISTS "type" "public"."postes_type_enum" DEFAULT 'ADMINISTRATIF'
            `);

            // Restaurer les valeurs depuis typePersonnelId
            await queryRunner.query(`
                UPDATE "postes" p
                SET type = tp.code::public.postes_type_enum
                FROM "types_personnel" tp
                WHERE tp.id = p."typePersonnelId"
                  AND tp.code IN ('DIRECTION', 'ENSEIGNANT', 'ADMINISTRATIF', 'TECHNIQUE', 'SERVICE', 'STAGE', 'TEMPORAIRE', 'AUTRE')
            `);
        }

        await queryRunner.query(`ALTER TABLE "postes" DROP COLUMN IF EXISTS "typePersonnelId"`);
    }
}
