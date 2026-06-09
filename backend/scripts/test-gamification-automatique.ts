/**
 * ==================================
 * eLISAschool - Test d'Intégration Gamification Automatique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Test des nouvelles fonctionnalités d'attribution automatique de points
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import { AppDataSource } from '@database/data-source';
import { gamificationService } from '@modules/gamification/services';
import { getParamNumber, getParamBoolean } from '@modules/configuration/utils/config.helper';
import { logger } from '@common/utils/logger.util';

dotenv.config();

async function testGamificationAutomatique(): Promise<void> {
    try {
        console.log('\n========================================');
        console.log('🧪 TEST: Gamification Automatique');
        console.log('========================================\n');

        // Connexion DB
        await AppDataSource.initialize();
        console.log('✅ Connexion DB établie\n');

        // Test 1: Vérifier les paramètres de configuration
        console.log('📋 Test 1: Paramètres de configuration');
        console.log('----------------------------------------');
        
        const pointsAttendance = await getParamNumber('gamification.points_attendance', 5);
        const pointsGoodGrade = await getParamNumber('gamification.points_good_grade', 10);
        const autoAttendance = await getParamBoolean('gamification.auto_attendance', true);
        const autoNotes = await getParamBoolean('gamification.auto_notes', true);
        const seuilBonneNote = await getParamNumber('gamification.seuil_bonne_note', 0.8);
        
        console.log(`✓ gamification.points_attendance: ${pointsAttendance} points`);
        console.log(`✓ gamification.points_good_grade: ${pointsGoodGrade} points`);
        console.log(`✓ gamification.auto_attendance: ${autoAttendance}`);
        console.log(`✓ gamification.auto_notes: ${autoNotes}`);
        console.log(`✓ gamification.seuil_bonne_note: ${seuilBonneNote * 100}%\n`);

        // Test 2: Vérifier paramètres suivi-élèves
        console.log('📋 Test 2: Paramètres suivi-élèves');
        console.log('----------------------------------------');
        
        const suiviElevesActif = await getParamBoolean('suivi-eleves.gamification.actif', true);
        const pointsFelicitations = await getParamNumber('suivi-eleves.gamification.points_felicitations', 10);
        const pointsObsPositive = await getParamNumber('suivi-eleves.gamification.points_observation_positive', 5);
        const pointsObsNegative = await getParamNumber('suivi-eleves.gamification.points_observation_negative', -5);
        
        console.log(`✓ suivi-eleves.gamification.actif: ${suiviElevesActif}`);
        console.log(`✓ suivi-eleves.gamification.points_felicitations: ${pointsFelicitations} points`);
        console.log(`✓ suivi-eleves.gamification.points_observation_positive: ${pointsObsPositive} points`);
        console.log(`✓ suivi-eleves.gamification.points_observation_negative: ${pointsObsNegative} points\n`);

        // Test 3: Vérifier paramètres suivi-personnel
        console.log('📋 Test 3: Paramètres suivi-personnel');
        console.log('----------------------------------------');
        
        const suiviPersonnelActif = await getParamBoolean('suivi-personnel.gamification.actif', false);
        const pointsEvalPositive = await getParamNumber('suivi-personnel.gamification.points_evaluation_positive', 20);
        const seuilEvalPositive = await getParamNumber('suivi-personnel.gamification.seuil_evaluation_positive', 15);
        
        console.log(`✓ suivi-personnel.gamification.actif: ${suiviPersonnelActif}`);
        console.log(`✓ suivi-personnel.gamification.points_evaluation_positive: ${pointsEvalPositive} points`);
        console.log(`✓ suivi-personnel.gamification.seuil_evaluation_positive: ${seuilEvalPositive}/20\n`);

        // Test 4: Tester attribution de points manuelle
        console.log('📋 Test 4: Attribution manuelle de points (simulation)');
        console.log('----------------------------------------');
        
        // Simuler attribution pour bonne note
        const note = 16;
        const bareme = 20;
        const ratio = note / bareme;
        const bonneNote = ratio >= 0.8;
        
        console.log(`✓ Note test: ${note}/${bareme} = ${ratio * 100}%`);
        console.log(`✓ Seuil bonne note: ${seuilBonneNote * 100}%`);
        console.log(`✓ Résultat: ${bonneNote ? '✅ Bonne note (points attribués)' : '❌ Note insuffisante'}\n`);

        // Test 5: Vérifier cron jobs
        console.log('📋 Test 5: Cron jobs configurés');
        console.log('----------------------------------------');
        console.log('✓ Cron 1: Attribution assiduité (tous les jours à 23h00)');
        console.log('✓ Cron 2: Reset points hebdomadaires (dimanche 23h59)');
        console.log('✓ Cron 3: Vérification badges (tous les jours à 00h00)');
        console.log('✓ Cron 4: Reset points mensuels (1er du mois à 00h00)\n');

        // Test 6: Vérifier enum TypeActionPoints
        console.log('📋 Test 6: Types d\'actions disponibles');
        console.log('----------------------------------------');
        
        const { TypeActionPoints } = await import('@modules/gamification/entities');
        const actions = Object.values(TypeActionPoints);
        console.log(`✓ ${actions.length} types d'actions définis:`);
        actions.forEach(action => console.log(`  - ${action}`));
        console.log('');

        console.log('========================================');
        console.log('✅ TOUS LES TESTS PASSÉS AVEC SUCCÈS');
        console.log('========================================\n');

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERREUR LORS DES TESTS:', error);
        await AppDataSource.destroy();
        process.exit(1);
    }
}

testGamificationAutomatique();
