/**
 * ==================================
 * eLISAschool - Migration 014: Table Responsables Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Description: Crée la table de jointure pour gérer les relations
 * multi-parents entre utilisateurs (rôle PARENT) et élèves.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration014ResponsablesEleves1720000000000 implements MigrationInterface {
    name = 'Migration014ResponsablesEleves1720000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Créer la table responsables_eleves
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS responsables_eleves (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
                enfant_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
                lien_parente VARCHAR(50) NOT NULL,
                responsable_legal BOOLEAN DEFAULT true,
                peut_consulter BOOLEAN DEFAULT true,
                peut_payer BOOLEAN DEFAULT false,
                email VARCHAR(255),
                telephone VARCHAR(20),
                adresse VARCHAR(255),
                date_ajout TIMESTAMP DEFAULT NOW(),
                actif BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(utilisateur_id, enfant_id)
            )
        `);

        // 2. Créer les index pour performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_responsables_eleves_enfant 
            ON responsables_eleves(enfant_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_responsables_eleves_utilisateur 
            ON responsables_eleves(utilisateur_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_responsables_eleves_actif 
            ON responsables_eleves(actif)
            WHERE actif = true
        `);

        // 3. Ajouter un trigger pour updated_at
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS update_responsables_eleves_updated_at 
            ON responsables_eleves
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_responsables_eleves_updated_at
                BEFORE UPDATE ON responsables_eleves
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()
        `);

        // 4. Ajouter des permissions RBAC pour le module
        await queryRunner.query(`
            INSERT INTO permissions (code, libelle, description, module, action, ressource)
            VALUES 
                ('responsables:view', 'Voir les responsables', 'Consulter la liste des responsables d''un élève', 'responsables-eleves', 'view', 'responsable-eleve'),
                ('responsables:create', 'Créer un responsable', 'Ajouter un responsable à un élève', 'responsables-eleves', 'create', 'responsable-eleve'),
                ('responsables:update', 'Modifier un responsable', 'Modifier les informations d''un responsable', 'responsables-eleves', 'update', 'responsable-eleve'),
                ('responsables:delete', 'Supprimer un responsable', 'Retirer un responsable d''un élève', 'responsables-eleves', 'delete', 'responsable-eleve'),
                ('parents:view-enfants', 'Voir mes enfants', 'Consulter la liste de ses enfants (parent)', 'responsables-eleves', 'view', 'parent-enfants'),
                ('parents:view-notes', 'Voir notes enfants', 'Consulter les notes de ses enfants', 'responsables-eleves', 'view', 'parent-notes'),
                ('parents:view-bulletins', 'Voir bulletins enfants', 'Consulter les bulletins de ses enfants', 'responsables-eleves', 'view', 'parent-bulletins'),
                ('parents:pay', 'Payer pour enfants', 'Effectuer des paiements pour ses enfants', 'responsables-eleves', 'pay', 'parent-paiements')
            ON CONFLICT (code) DO NOTHING
        `);

        // 5. Attribuer les permissions de base au rôle ADMIN
        await queryRunner.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT 
                r.id as role_id,
                p.id as permission_id
            FROM roles r
            CROSS JOIN permissions p
            WHERE r.code = 'ADMIN'
            AND p.code IN (
                'responsables:view',
                'responsables:create',
                'responsables:update',
                'responsables:delete'
            )
            AND NOT EXISTS (
                SELECT 1 FROM role_permissions rp 
                WHERE rp.role_id = r.id AND rp.permission_id = p.id
            )
        `);

        // 6. Attribuer les permissions parent au rôle PARENT
        await queryRunner.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT 
                r.id as role_id,
                p.id as permission_id
            FROM roles r
            CROSS JOIN permissions p
            WHERE r.code = 'PARENT'
            AND p.code IN (
                'parents:view-enfants',
                'parents:view-notes',
                'parents:view-bulletins',
                'parents:pay'
            )
            AND NOT EXISTS (
                SELECT 1 FROM role_permissions rp 
                WHERE rp.role_id = r.id AND rp.permission_id = p.id
            )
        `);

        console.log('✅ Migration 014: Table responsables_eleves créée avec succès');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer le trigger
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS update_responsables_eleves_updated_at 
            ON responsables_eleves
        `);

        // Supprimer la fonction trigger
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS update_updated_at_column()
        `);

        // Supprimer la table
        await queryRunner.query(`
            DROP TABLE IF EXISTS responsables_eleves
        `);

        // Supprimer les permissions
        await queryRunner.query(`
            DELETE FROM permissions 
            WHERE module = 'responsables-eleves'
        `);

        console.log('✅ Migration 014: Rollback effectué');
    }
}
