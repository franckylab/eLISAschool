/**
 * ==================================
 * eLISAschool - Migration 015: Tables Parking
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Description: Crée les tables pour la gestion du parking :
 * - places_parking : gestion des places de stationnement
 * - vehicules : registre des véhicules
 * - abonnements_parking : abonnements de stationnement
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration015Parking1720100000000 implements MigrationInterface {
    name = 'Migration015Parking1720100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Créer la table places_parking
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS places_parking (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                numero VARCHAR(20) NOT NULL UNIQUE,
                type VARCHAR(20) NOT NULL DEFAULT 'standard',
                statut VARCHAR(20) NOT NULL DEFAULT 'libre',
                vehicule_id UUID,
                abonnement_id UUID,
                tarif_horaire DECIMAL(10, 2),
                etablissement_id UUID REFERENCES etablissements(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CHECK (type IN ('standard', 'pmr', 'visiteur', 'reservation')),
                CHECK (statut IN ('libre', 'occupee', 'reservee', 'maintenance'))
            )
        `);

        // 2. Créer les index pour places_parking
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_places_parking_etablissement 
            ON places_parking(etablissement_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_places_parking_statut 
            ON places_parking(statut)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_places_parking_type 
            ON places_parking(type)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_places_parking_etablissement_statut 
            ON places_parking(etablissement_id, statut)
        `);

        // 3. Créer la table vehicules
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS vehicules (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                proprietaire_id UUID NOT NULL,
                immatriculation VARCHAR(50) NOT NULL,
                marque VARCHAR(50),
                modele VARCHAR(50),
                couleur VARCHAR(30),
                type VARCHAR(20) NOT NULL DEFAULT 'voiture',
                place_parking_id UUID REFERENCES places_parking(id) ON DELETE SET NULL,
                etablissement_id UUID REFERENCES etablissements(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CHECK (type IN ('voiture', 'moto', 'velo', 'autre'))
            )
        `);

        // 4. Créer les index pour vehicules
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_vehicules_etablissement 
            ON vehicules(etablissement_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_vehicules_proprietaire 
            ON vehicules(proprietaire_id)
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicules_immatriculation 
            ON vehicules(immatriculation, etablissement_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_vehicules_etablissement_proprietaire 
            ON vehicules(etablissement_id, proprietaire_id)
        `);

        // 5. Créer la table abonnements_parking
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS abonnements_parking (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                titulaire_id UUID NOT NULL,
                vehicule_id UUID NOT NULL,
                date_debut DATE NOT NULL,
                date_fin DATE NOT NULL,
                tarif DECIMAL(10, 2) NOT NULL,
                statut VARCHAR(20) NOT NULL DEFAULT 'actif',
                etablissement_id UUID REFERENCES etablissements(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                CHECK (statut IN ('actif', 'expire', 'suspendu')),
                CHECK (date_fin > date_debut)
            )
        `);

        // 6. Créer les index pour abonnements_parking
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_abonnements_parking_etablissement 
            ON abonnements_parking(etablissement_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_abonnements_parking_titulaire 
            ON abonnements_parking(titulaire_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_abonnements_parking_vehicule 
            ON abonnements_parking(vehicule_id)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_abonnements_parking_statut 
            ON abonnements_parking(statut)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_abonnements_parking_etablissement_statut 
            ON abonnements_parking(etablissement_id, statut)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les tables dans l'ordre inverse (contraintes de clé étrangère)
        await queryRunner.query(`DROP TABLE IF EXISTS abonnements_parking CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS vehicules CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS places_parking CASCADE`);
    }
}
