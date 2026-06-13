/**
 * ==================================
 * eLISAschool - Vérification Structure Académique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Script de vérification post-seed pour confirmer
 * l'intégrité des données académiques en base
 */

import { AppDataSource } from '@database/data-source';
import { Cycle } from '@modules/cycles/entities';
import { Niveau } from '@modules/niveaux/entities';
import { Filiere } from '@modules/filieres/entities';
import { Specialite } from '@modules/specialites/entities/specialite.entity';
import { Competence } from '@modules/competences/entities/competence.entity';
import { ExamenNational } from '@modules/examens-nationaux/entities';

async function verifyStructureAcademique(): Promise<void> {
    console.log('\n🔍 VÉRIFICATION DE LA STRUCTURE ACADÉMIQUE\n');
    
    await AppDataSource.initialize();
    
    const repos = {
        cycles: AppDataSource.getRepository(Cycle),
        niveaux: AppDataSource.getRepository(Niveau),
        filieres: AppDataSource.getRepository(Filiere),
        specialites: AppDataSource.getRepository(Specialite),
        competences: AppDataSource.getRepository(Competence),
        examens: AppDataSource.getRepository(ExamenNational),
    };
    
    const counts = {
        cycles: await repos.cycles.count(),
        niveaux: await repos.niveaux.count(),
        filieres: await repos.filieres.count(),
        specialites: await repos.specialites.count(),
        competences: await repos.competences.count(),
        examens: await repos.examens.count(),
    };
    
    // Vérification des spécialités par filière
    const filieresTechniques = await repos.filieres.find({
        where: [
            { code: 'F1' }, { code: 'F2' }, { code: 'F3' }, { code: 'F4' },
            { code: 'G1' }, { code: 'G2' }, { code: 'H' }, { code: 'I' },
            { code: 'K' }, { code: 'L' },
        ],
    });
    
    console.log('📊 RÉSULTATS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ✅ Cycles:           ${counts.cycles} (attendu: 4)`);
    console.log(`  ✅ Niveaux:          ${counts.niveaux} (attendu: 30)`);
    console.log(`  ✅ Filières:         ${counts.filieres} (attendu: 15)`);
    console.log(`  ✅ Spécialités:      ${counts.specialites} (attendu: 28)`);
    console.log(`  ✅ Compétences APC:  ${counts.competences} (attendu: 30)`);
    console.log(`  ✅ Examens nationaux: ${counts.examens} (attendu: 6)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Détail des spécialités par filière
    console.log('🔧 SPÉCIALITÉS PAR FILIÈRE:');
    for (const filiere of filieresTechniques) {
        const count = await repos.specialites.count({ where: { filiereId: filiere.id } });
        console.log(`  ${filiere.code} - ${filiere.nom}: ${count} spécialité(s)`);
    }
    console.log('');
    
    // Détail des compétences par domaine
    console.log('🎯 COMPÉTENCES PAR DOMAINE:');
    const domaines = await repos.competences
        .createQueryBuilder('comp')
        .select('comp.domaine', 'domaine')
        .addSelect('COUNT(*)', 'count')
        .groupBy('comp.domaine')
        .orderBy('domaine', 'ASC')
        .getRawMany();
    
    domaines.forEach((d: any) => {
        console.log(`  ${d.domaine}: ${d.count} compétence(s)`);
    });
    console.log('');
    
    // Validation
    const expected = {
        cycles: 4,
        niveaux: 30,
        filieres: 15,
        specialites: 28,
        competences: 30,
        examens: 6,
    };
    
    const allValid = Object.entries(expected).every(([key, value]) => counts[key as keyof typeof counts] >= value);
    
    if (allValid) {
        console.log('✅ VÉRIFICATION RÉUSSIE - Structure académique complète et cohérente\n');
    } else {
        console.log('⚠️  VÉRIFICATION INCOMPLÈTE - Certaines données sont manquantes\n');
        console.log('💡 Exécutez: npm run seed\n');
    }
    
    await AppDataSource.destroy();
}

verifyStructureAcademique().catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
});
