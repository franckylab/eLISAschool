import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContratCentricSync1786000000000 implements MigrationInterface {
    name = 'ContratCentricSync1786000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ajouter posteId aux contrats_personnel (idempotent)
        await queryRunner.query(`
            ALTER TABLE contrats_personnel
            ADD COLUMN IF NOT EXISTS "posteId" UUID REFERENCES postes(id) ON DELETE SET NULL
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_contrats_personnel_poste
            ON contrats_personnel("posteId")
        `);

        // 2. Ajouter contratId aux membres_fonctions (idempotent)
        await queryRunner.query(`
            ALTER TABLE membres_fonctions
            ADD COLUMN IF NOT EXISTS "contratId" UUID REFERENCES contrats_personnel(id) ON DELETE SET NULL
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_membres_fonctions_contrat
            ON membres_fonctions("contratId")
        `);

        // 3. Ajouter contratId aux affectations_postes (idempotent)
        await queryRunner.query(`
            ALTER TABLE affectations_postes
            ADD COLUMN IF NOT EXISTS "contratId" UUID REFERENCES contrats_personnel(id) ON DELETE SET NULL
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_affectations_postes_contrat
            ON affectations_postes("contratId")
        `);

        // 4. Lier les postes aux contrats ACTIF via Poste.occupantId
        //    Pour chaque contrat ACTIF dont le membre occupe un poste,
        //    on remonte contrat.posteId = poste.id et poste.occupantId = contrat.membrePersonnelId
        await queryRunner.query(`
            UPDATE contrats_personnel c
            SET "posteId" = p.id
            FROM postes p
            WHERE c.statut = 'ACTIF'
              AND p."occupantId" = c."membrePersonnelId"
              AND c."posteId" IS NULL
        `);

        // 5. Pour les contrats ACTIF avec posteId, s'assurer que Poste.occupantId est synchro
        await queryRunner.query(`
            UPDATE postes p
            SET "occupantId" = c."membrePersonnelId",
                statut = 'ACTIF'
            FROM contrats_personnel c
            WHERE c.statut = 'ACTIF'
              AND c."posteId" = p.id
              AND (p."occupantId" IS DISTINCT FROM c."membrePersonnelId" OR p.statut IS DISTINCT FROM 'ACTIF')
        `);

        // 6. Pour les contrats non-ACTIF avec posteId → libérer le poste
        await queryRunner.query(`
            UPDATE postes p
            SET "occupantId" = NULL,
                "occupantNom" = NULL,
                statut = 'VACANT'
            FROM contrats_personnel c
            WHERE c.statut != 'ACTIF'
              AND c."posteId" = p.id
              AND p."occupantId" IS NOT NULL
        `);

        // 7. Lier les AffectationPoste existantes aux contrats
        //    Match par membrePersonnelId + chevauchement de dates
        await queryRunner.query(`
            UPDATE affectations_postes a
            SET "contratId" = c.id
            FROM contrats_personnel c
            WHERE a."membrePersonnelId" = c."membrePersonnelId"
              AND a."contratId" IS NULL
              AND a.statut = 'ACTIF'
              AND c.statut = 'ACTIF'
        `);

        // 8. Pour les affectations TERMINEES sans contratId
        //    on cherche un contrat avec chevauchement de dates
        await queryRunner.query(`
            UPDATE affectations_postes a
            SET "contratId" = c.id
            FROM contrats_personnel c
            WHERE a."membrePersonnelId" = c."membrePersonnelId"
              AND a."contratId" IS NULL
              AND a.statut = 'TERMINE'
              AND c."dateDebut" <= COALESCE(a."dateFin", NOW())
              AND COALESCE(c."dateFin", NOW()) >= a."dateDebut"
        `);

        // 9. Lier les MembreFonction existantes aux contrats ACTIF
        await queryRunner.query(`
            UPDATE membres_fonctions mf
            SET "contratId" = c.id
            FROM contrats_personnel c
            WHERE mf."membrePersonnelId" = c."membrePersonnelId"
              AND mf."contratId" IS NULL
              AND c.statut = 'ACTIF'
              AND mf."dateFin" IS NULL
        `);

        // 10. Pour les MembreFonction terminées, lier par chevauchement de dates
        await queryRunner.query(`
            UPDATE membres_fonctions mf
            SET "contratId" = c.id
            FROM contrats_personnel c
            WHERE mf."membrePersonnelId" = c."membrePersonnelId"
              AND mf."contratId" IS NULL
              AND mf."dateFin" IS NOT NULL
              AND c."dateDebut" <= mf."dateFin"
              AND COALESCE(c."dateFin", mf."dateFin") >= mf."dateDebut"
        `);

        // 11. S'assurer que la fonction principale du contrat est synchro
        //     Si contrat a une fonctionId mais aucun MembreFonction avec estPrincipale=true,
        //     créer le lien
        await queryRunner.query(`
            INSERT INTO membres_fonctions ("membrePersonnelId", "fonctionId", "dateDebut", "estPrincipale", "contratId", "etablissementId")
            SELECT c."membrePersonnelId", c."fonctionId", c."dateDebut", TRUE, c.id, c."etablissementId"
            FROM contrats_personnel c
            WHERE c."fonctionId" IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM membres_fonctions mf
                  WHERE mf."contratId" = c.id AND mf."estPrincipale" = TRUE
              )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Ne rien faire en down — cette migration est une sync data, pas structurelle
        // Les colonnes sont conservées
    }
}
