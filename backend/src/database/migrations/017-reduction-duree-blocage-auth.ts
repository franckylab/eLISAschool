/**
 * ==================================
 * eLISAschool - Migration: Réduction durée de blocage authentification
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Description: Réduction de la durée de blocage après échecs de connexion
 * de 15 minutes à 2 minutes pour améliorer l'expérience utilisateur
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReductionDureeBlocageAuth1718500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Mettre à jour le paramètre de configuration
        await queryRunner.query(`
            UPDATE parametres_systeme
            SET valeur = '2',
                updated_at = NOW()
            WHERE cle = 'auth.lockout_duration'
        `);

        console.log('✅ Durée de blocage réduite à 2 minutes');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revenir à 15 minutes
        await queryRunner.query(`
            UPDATE parametres_systeme
            SET valeur = '15',
                updated_at = NOW()
            WHERE cle = 'auth.lockout_duration'
        `);

        console.log('⚠️  Durée de blocage restaurée à 15 minutes');
    }
}
