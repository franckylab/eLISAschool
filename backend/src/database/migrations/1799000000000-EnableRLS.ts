/**
 * ==================================
 * eLISAschool - Migration RLS (Row Level Security)
 * ==================================
 * Version: 5.1.0
 * 
 * Active Row Level Security sur les tables critiques multi-tenant.
 * Defense-in-depth : même si le filtrage applicatif est contourné,
 * PostgreSQL garantit l'isolation des données par établissement.
 * 
 * Phase 3.1 — Refonte SaaS
 * Rapport audit SaaS 2026-08-07
 * 
 * Tables protégées (8 tables critiques) :
 * - eleves, notes, bulletins, personnel
 * - creneaux_horaires, heures_cours, absences_personnel
 * - etablissement_config
 * 
 * Politique :
 * - SUPER_ADMIN bypass via app.current_tenant = '00000000-0000-0000-0000-000000000000'
 * - Autres rôles : filtrage automatique par etablissementId
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableRLS1799000000000 implements MigrationInterface {
    name = 'EnableRLS1799000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // =============================================
        // 1. Activer RLS sur les tables critiques
        // =============================================

        const tables = [
            'eleves',
            'notes',
            'bulletins',
            'personnel',
            'creneaux_horaires',
            'heures_cours',
            'absences_personnel',
            'etablissement_config',
        ];

        for (const table of tables) {
            await queryRunner.query(`
                ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
            `);
        }

        // =============================================
        // 2. Créer les policies de tenant isolation
        // =============================================

        // Policy permissive pour SUPER_ADMIN (bypass via UUID nul)
        // Quand app.current_tenant = '00000000-0000-0000-0000-000000000000',
        // la policy retourne TRUE pour toutes les lignes.
        await queryRunner.query(`
            -- Policy SUPER_ADMIN bypass (permissive — accès total)
            CREATE POLICY super_admin_bypass ON eleves
                AS PERMISSIVE
                FOR ALL
                USING (
                    current_setting('app.current_tenant', true) = '00000000-0000-0000-0000-000000000000'
                    OR "etablissementId" = current_setting('app.current_tenant', true)::uuid
                );
        `);

        await queryRunner.query(`
            CREATE POLICY super_admin_bypass ON notes
                AS PERMISSIVE
                FOR ALL
                USING (
                    current_setting('app.current_tenant', true) = '00000000-0000-0000-0000-000000000000'
                    OR "etablissementId" = current_setting('app.current_tenant', true)::uuid
                );
        `);

        await queryRunner.query(`
            CREATE POLICY super_admin_bypass ON bulletins
                AS PERMISSIVE
                FOR ALL
                USING (
                    current_setting('app.current_tenant', true) = '00000000-0000-0000-0000-000000000000'
                    OR "etablissementId" = current_setting('app.current_tenant', true)::uuid
                );
        `);

        await queryRunner.query(`
            CREATE POLICY super_admin_bypass ON personnel
                AS PERMISSIVE
                FOR ALL
                USING (
                    current_setting('app.current_tenant', true) = '00000000-0000-0000-0000-000000000000'
                    OR "etablissementId" = current_setting('app.current_tenant', true)::uuid
                );
        `);

        await queryRunner.query(`
            CREATE POLICY super_admin_bypass ON creneaux_horaires
                AS PERMISSIVE
                FOR ALL
                USING (
                    current_setting('app.current_tenant', true) = '00000000-0000-0000-0000-000000000000'
                    OR "etablissementId" = current_setting('app.current_tenant', true)::uuid
                );
        `);

        await queryRunner.query(`
            CREATE POLICY super_admin_bypass ON heures_cours
                AS PERMISSIVE
                FOR ALL
                USING (
                    current_setting('app.current_tenant', true) = '00000000-0000-0000-0000-000000000000'
                    OR "etablissementId" = current_setting('app.current_tenant', true)::uuid
                );
        `);

        await queryRunner.query(`
            CREATE POLICY super_admin_bypass ON absences_personnel
                AS PERMISSIVE
                FOR ALL
                USING (
                    current_setting('app.current_tenant', true) = '00000000-0000-0000-0000-000000000000'
                    OR "etablissementId" = current_setting('app.current_tenant', true)::uuid
                );
        `);

        await queryRunner.query(`
            CREATE POLICY super_admin_bypass ON etablissement_config
                AS PERMISSIVE
                FOR ALL
                USING (
                    current_setting('app.current_tenant', true) = '00000000-0000-0000-0000-000000000000'
                    OR "etablissementId" = current_setting('app.current_tenant', true)::uuid
                );
        `);

        // =============================================
        // 3. Policy restrictive pour les rôles non-SUPER_ADMIN
        // =============================================
        // Cette policy s'applique quand le setting n'est PAS le UUID nul.
        // Elle force le filtrage par etablissementId.

        for (const table of tables) {
            await queryRunner.query(`
                CREATE POLICY tenant_isolation ON "${table}"
                    AS RESTRICTIVE
                    FOR ALL
                    USING (
                        "etablissementId" = current_setting('app.current_tenant', true)::uuid
                    );
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tables = [
            'eleves',
            'notes',
            'bulletins',
            'personnel',
            'creneaux_horaires',
            'heures_cours',
            'absences_personnel',
            'etablissement_config',
        ];

        for (const table of tables) {
            await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON "${table}"`);
            await queryRunner.query(`DROP POLICY IF EXISTS super_admin_bypass ON "${table}"`);
            await queryRunner.query(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY`);
        }
    }
}
