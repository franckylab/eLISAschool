/**
 * ==================================
 * eLISAschool - Migration Multi-Tenant Structure Académique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-13
 * 
 * Ce script met à jour les entités existantes pour ajouter l'etablissementId
 * après la migration SQL 058.
 * 
 * Usage:
 *   cd backend
 *   npx ts-node src/database/seeds/update-multi-tenant-structure.ts
 */

import { DataSource } from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';

async function main() {
    console.log('🚀 Migration multi-tenant structure académique...\n');

    const AppDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'elisaschool',
    });

    await AppDataSource.initialize();
    console.log('✓ Connecté à la base de données\n');

    const etablissementRepo = AppDataSource.getRepository(Etablissement);

    // Récupérer l'établissement par défaut
    const etablissement = await etablissementRepo.findOne({
        where: { codeEtablissement: 'ETAB-001' }
    });

    if (!etablissement) {
        console.error('❌ Établissement par défaut ETAB-001 non trouvé');
        process.exit(1);
    }

    console.log(`✓ Établissement trouvé: ${etablissement.nom}`);
    console.log(`  ID: ${etablissement.id}\n`);

    // Mettre à jour filières
    console.log('📚 Mise à jour des filières...');
    const filieresResult = await AppDataSource.query(
        `UPDATE filieres 
         SET "etablissementId" = $1 
         WHERE "etablissementId" IS NULL`,
        [etablissement.id]
    );
    console.log(`  ✓ ${filieresResult[1] || 0} filières mises à jour\n`);

    // Mettre à jour spécialités
    console.log('🎯 Mise à jour des spécialités...');
    const specialitesResult = await AppDataSource.query(
        `UPDATE specialites 
         SET "etablissementId" = $1 
         WHERE "etablissementId" IS NULL`,
        [etablissement.id]
    );
    console.log(`  ✓ ${specialitesResult[1] || 0} spécialités mises à jour\n`);

    // Mettre à jour compétences
    console.log('🎓 Mise à jour des compétences...');
    const competencesResult = await AppDataSource.query(
        `UPDATE competences 
         SET "etablissementId" = $1 
         WHERE "etablissementId" IS NULL`,
        [etablissement.id]
    );
    console.log(`  ✓ ${competencesResult[1] || 0} compétences mises à jour\n`);

    // Vérification
    console.log('🔍 Vérification...');
    const verification = await AppDataSource.query(`
        SELECT 
            (SELECT COUNT(*) FROM filieres WHERE "etablissementId" IS NULL) as filieres_sans_etab,
            (SELECT COUNT(*) FROM specialites WHERE "etablissementId" IS NULL) as specialites_sans_etab,
            (SELECT COUNT(*) FROM competences WHERE "etablissementId" IS NULL) as competences_sans_etab
    `);

    const stats = verification[0];
    const totalSansEtab = parseInt(stats.filieres_sans_etab) + 
                          parseInt(stats.specialites_sans_etab) + 
                          parseInt(stats.competences_sans_etab);

    if (totalSansEtab > 0) {
        console.warn(`⚠ Il reste ${totalSansEtab} enregistrements sans etablissementId!`);
    } else {
        console.log('✓ Migration multi-tenant complétée avec succès!\n');
    }

    await AppDataSource.destroy();
    console.log('✓ Déconnexion de la base de données');
}

main().catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
});
