/**
 * ==================================
 * eLISAschool - Seed Structure Académique Complète
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée les cycles, niveaux, filières, spécialités et examens nationaux
 * conformes au système éducatif camerounais (francophone et anglophone)
 * 
 * Changements v2.0:
 * - Suppression de TypeCycle (fusionné dans Cycle)
 * - Ajout des filières technologiques/industrielles
 * - Ajout des spécialités pour les filières techniques
 */

import { AppDataSource } from '@database/data-source';
import { Cycle } from '@modules/cycles/entities';
import { Niveau } from '@modules/niveaux/entities';
import { Filiere } from '@modules/filieres/entities';
import { ExamenNational } from '@modules/examens-nationaux/entities';
import { SousSysteme } from '@modules/etablissement/entities';
import { logger } from '@common/utils/logger.util';

export async function seedStructureAcademique(): Promise<void> {
    logger.info('🎓 Seed de la structure académique...');

    const cycleRepo = AppDataSource.getRepository(Cycle);
    const niveauRepo = AppDataSource.getRepository(Niveau);
    const filiereRepo = AppDataSource.getRepository(Filiere);
    const examenRepo = AppDataSource.getRepository(ExamenNational);

    // ==================================
    // 1. CYCLES PÉDAGOGIQUES (avec attributs fusionnés de TypeCycle)
    // ==================================
    logger.info('🔄 Création des cycles pédagogiques...');

    const cyclesData = [
        {
            nom: 'Enseignement Maternel',
            code: 'MATERNELLE',
            description: 'Cycle préscolaire pour les enfants de 3 à 6 ans',
            dureeAnnees: 3,
            ordre: 1,
        },
        {
            nom: 'Enseignement Primaire',
            code: 'PRIMAIRE',
            description: 'Cycle de l\'enseignement élémentaire (6 ans)',
            dureeAnnees: 6,
            ordre: 2,
            diplomeSanctionnant: 'CEP',
        },
        {
            nom: 'Secondaire 1er Cycle',
            code: 'SECONDAIRE_1',
            description: 'Premier cycle de l\'enseignement secondaire - Collège (4 ans)',
            dureeAnnees: 4,
            ordre: 3,
            diplomeSanctionnant: 'BEPC',
        },
        {
            nom: 'Secondaire 2nd Cycle',
            code: 'SECONDAIRE_2',
            description: 'Second cycle de l\'enseignement secondaire - Lycée (3 ans)',
            dureeAnnees: 3,
            ordre: 4,
            diplomeSanctionnant: 'BACCALAUREAT',
        },
    ];

    const cycles: Cycle[] = [];
    for (const data of cyclesData) {
        const existing = await cycleRepo.findOne({ where: { code: data.code } });
        if (!existing) {
            const cycle = cycleRepo.create(data);
            await cycleRepo.save(cycle);
            cycles.push(cycle);
            logger.info(`  ✓ Cycle créé: ${data.nom}`);
        } else {
            cycles.push(existing);
        }
    }

    // ==================================
    // 3. NIVEAUX - SYSTÈME FRANCOPHONE
    // ==================================
    logger.info('📝 Création des niveaux (Francophone)...');

    // Maternelle Francophone
    const niveauxMaternelleFR = [
        { nom: 'Petite Section', code: 'PS', cycleId: cycles[0].id, ordre: 1, sousSysteme: SousSysteme.FRANCOPHONE },
        { nom: 'Moyenne Section', code: 'MS', cycleId: cycles[0].id, ordre: 2, sousSysteme: SousSysteme.FRANCOPHONE },
        { nom: 'Grande Section', code: 'GS', cycleId: cycles[0].id, ordre: 3, sousSysteme: SousSysteme.FRANCOPHONE },
    ];

    // Primaire Francophone
    const niveauxPrimaireFR = [
        { nom: 'Cours Initial', code: 'CI', cycleId: cycles[1].id, ordre: 1, sousSysteme: SousSysteme.FRANCOPHONE },
        { nom: 'Cours Préparatoire', code: 'CP', cycleId: cycles[1].id, ordre: 2, sousSysteme: SousSysteme.FRANCOPHONE },
        { nom: 'Cours Élémentaire 1', code: 'CE1', cycleId: cycles[1].id, ordre: 3, sousSysteme: SousSysteme.FRANCOPHONE },
        { nom: 'Cours Élémentaire 2', code: 'CE2', cycleId: cycles[1].id, ordre: 4, sousSysteme: SousSysteme.FRANCOPHONE },
        { nom: 'Cours Moyen 1', code: 'CM1', cycleId: cycles[1].id, ordre: 5, sousSysteme: SousSysteme.FRANCOPHONE },
        { nom: 'Cours Moyen 2', code: 'CM2', cycleId: cycles[1].id, ordre: 6, sousSysteme: SousSysteme.FRANCOPHONE, estClasseExamen: true },
    ];

    // Secondaire 1er Cycle Francophone
    const niveauxSecondaire1FR = [
        { nom: 'Sixième', code: '6EME', cycleId: cycles[2].id, ordre: 1, sousSysteme: SousSysteme.FRANCOPHONE },
        { nom: 'Cinquième', code: '5EME', cycleId: cycles[2].id, ordre: 2, sousSysteme: SousSysteme.FRANCOPHONE },
        { nom: 'Quatrième', code: '4EME', cycleId: cycles[2].id, ordre: 3, sousSysteme: SousSysteme.FRANCOPHONE },
        { nom: 'Troisième', code: '3EME', cycleId: cycles[2].id, ordre: 4, sousSysteme: SousSysteme.FRANCOPHONE, estClasseExamen: true },
    ];

    // Secondaire 2nd Cycle Francophone
    const niveauxSecondaire2FR = [
        { nom: 'Seconde', code: 'SECONDE', cycleId: cycles[3].id, ordre: 1, sousSysteme: SousSysteme.FRANCOPHONE },
        { nom: 'Première', code: 'PREMIERE', cycleId: cycles[3].id, ordre: 2, sousSysteme: SousSysteme.FRANCOPHONE },
        { nom: 'Terminale', code: 'TERMINALE', cycleId: cycles[3].id, ordre: 3, sousSysteme: SousSysteme.FRANCOPHONE, estClasseExamen: true },
    ];

    const tousNiveauxFR = [
        ...niveauxMaternelleFR,
        ...niveauxPrimaireFR,
        ...niveauxSecondaire1FR,
        ...niveauxSecondaire2FR,
    ];

    const niveauxFR: Niveau[] = [];
    for (const data of tousNiveauxFR) {
        const existing = await niveauRepo.findOne({ where: { code: data.code, sousSysteme: data.sousSysteme } });
        if (!existing) {
            const niveau = niveauRepo.create(data);
            await niveauRepo.save(niveau);
            niveauxFR.push(niveau);
        } else {
            niveauxFR.push(existing);
        }
    }
    logger.info(`  ✓ ${niveauxFR.length} niveaux francophones créés`);

    // ==================================
    // 4. NIVEAUX - SYSTÈME ANGLOPHONE
    // ==================================
    logger.info('📝 Création des niveaux (Anglophone)...');

    const niveauxNurseryEN = [
        { nom: 'Nursery 1', code: 'NURSERY1', cycleId: cycles[0].id, ordre: 1, sousSysteme: SousSysteme.ANGLOPHONE },
        { nom: 'Nursery 2', code: 'NURSERY2', cycleId: cycles[0].id, ordre: 2, sousSysteme: SousSysteme.ANGLOPHONE },
    ];

    const niveauxPrimaryEN = [
        { nom: 'Standard 1', code: 'STD1', cycleId: cycles[1].id, ordre: 1, sousSysteme: SousSysteme.ANGLOPHONE },
        { nom: 'Standard 2', code: 'STD2', cycleId: cycles[1].id, ordre: 2, sousSysteme: SousSysteme.ANGLOPHONE },
        { nom: 'Standard 3', code: 'STD3', cycleId: cycles[1].id, ordre: 3, sousSysteme: SousSysteme.ANGLOPHONE },
        { nom: 'Standard 4', code: 'STD4', cycleId: cycles[1].id, ordre: 4, sousSysteme: SousSysteme.ANGLOPHONE },
        { nom: 'Standard 5', code: 'STD5', cycleId: cycles[1].id, ordre: 5, sousSysteme: SousSysteme.ANGLOPHONE, estClasseExamen: true },
    ];

    const niveauxSecondary1EN = [
        { nom: 'Form 1', code: 'FORM1', cycleId: cycles[2].id, ordre: 1, sousSysteme: SousSysteme.ANGLOPHONE },
        { nom: 'Form 2', code: 'FORM2', cycleId: cycles[2].id, ordre: 2, sousSysteme: SousSysteme.ANGLOPHONE },
        { nom: 'Form 3', code: 'FORM3', cycleId: cycles[2].id, ordre: 3, sousSysteme: SousSysteme.ANGLOPHONE },
        { nom: 'Form 4', code: 'FORM4', cycleId: cycles[2].id, ordre: 4, sousSysteme: SousSysteme.ANGLOPHONE },
        { nom: 'Form 5', code: 'FORM5', cycleId: cycles[2].id, ordre: 5, sousSysteme: SousSysteme.ANGLOPHONE, estClasseExamen: true },
    ];

    const niveauxSecondary2EN = [
        { nom: 'Lower Sixth', code: 'LOWER6', cycleId: cycles[3].id, ordre: 1, sousSysteme: SousSysteme.ANGLOPHONE },
        { nom: 'Upper Sixth', code: 'UPPER6', cycleId: cycles[3].id, ordre: 2, sousSysteme: SousSysteme.ANGLOPHONE, estClasseExamen: true },
    ];

    const tousNiveauxEN = [
        ...niveauxNurseryEN,
        ...niveauxPrimaryEN,
        ...niveauxSecondary1EN,
        ...niveauxSecondary2EN,
    ];

    const niveauxEN: Niveau[] = [];
    for (const data of tousNiveauxEN) {
        const existing = await niveauRepo.findOne({ where: { code: data.code, sousSysteme: data.sousSysteme } });
        if (!existing) {
            const niveau = niveauRepo.create(data);
            await niveauRepo.save(niveau);
            niveauxEN.push(niveau);
        } else {
            niveauxEN.push(existing);
        }
    }
    logger.info(`  ✓ ${niveauxEN.length} niveaux anglophones créés`);

    // ==================================
    // 5. FILIÈRES - SECOND CYCLE FRANCOPHONE
    // ==================================
    logger.info('🎯 Création des filières (Second Cycle Francophone)...');

    const filieresData = [
        // === SÉRIES GÉNÉRALES ===
        {
            nom: 'Série C - Mathématiques et Physique',
            code: 'C',
            description: 'Mathématiques, Physique, Chimie',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série D - Sciences de la Nature',
            code: 'D',
            description: 'Biologie, Chimie, Sciences Naturelles',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série E - Génie Civil',
            code: 'E',
            description: 'Génie Civil, Construction',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série A - Lettres et Sciences Humaines',
            code: 'A',
            description: 'Lettres, Histoire, Géographie, Philosophie',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série A1 - Langues',
            code: 'A1',
            description: 'Langues vivantes et littérature',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        // === SÉRIES TECHNOLOGIQUES ET INDUSTRIELLES ===
        {
            nom: 'Série F1 - Génie Mécanique',
            code: 'F1',
            description: 'Mécanique automobile, maintenance industrielle, usinage',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série F2 - Génie Électrotechnique',
            code: 'F2',
            description: 'Électricité, électronique, automatismes, informatique industrielle',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série F3 - Génie Civil Bâtiment',
            code: 'F3',
            description: 'Construction, architecture, topographie, bâtiment',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série F4 - Génie Chimique',
            code: 'F4',
            description: 'Chimie industrielle, laboratoires, procédés chimiques',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série G1 - Techniques Administratives',
            code: 'G1',
            description: 'Secrétariat, bureautique, gestion administrative',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série G2 - Techniques Commerciales',
            code: 'G2',
            description: 'Commerce, vente, marketing, action commerciale',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série H - Techniques Économiques',
            code: 'H',
            description: 'Comptabilité, finance, économie, gestion',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série I - Informatique',
            code: 'I',
            description: 'Développement, réseaux, systèmes d\'information',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série K - Arts Appliqués',
            code: 'K',
            description: 'Design, mode, stylisme, arts graphiques',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
        {
            nom: 'Série L - Hôtellerie-Restauration',
            code: 'L',
            description: 'Cuisine, service, gestion hôtelière, tourisme',
            cycleId: cycles[3].id,
            sousSysteme: 'FRANCOPHONE',
        },
    ];

    const filieres: Filiere[] = [];
    for (const data of filieresData) {
        const existing = await filiereRepo.findOne({ where: { code: data.code, cycleId: data.cycleId } });
        if (!existing) {
            const filiere = filiereRepo.create(data);
            await filiereRepo.save(filiere);
            filieres.push(filiere);
            logger.info(`  ✓ Filière créée: ${data.nom}`);
        } else {
            filieres.push(existing);
        }
    }

    // ==================================
    // 6. EXAMENS NATIONAUX
    // ==================================
    logger.info('📜 Création des examens nationaux...');

    // Trouver les niveaux d'examen
    const cm2 = niveauxFR.find(n => n.code === 'CM2');
    const troisieme = niveauxFR.find(n => n.code === '3EME');
    const premiere = niveauxFR.find(n => n.code === 'PREMIERE');
    const terminale = niveauxFR.find(n => n.code === 'TERMINALE');
    const form5 = niveauxEN.find(n => n.code === 'FORM5');
    const upper6 = niveauxEN.find(n => n.code === 'UPPER6');

    const examensData = [
        // Francophone
        {
            nom: 'Certificat d\'Études Primaires',
            code: 'CEP',
            type: 'NATIONAL',
            niveauId: cm2?.id,
            diplomeDelivre: 'CEP',
            sousSysteme: 'FRANCOPHONE',
            estObligatoire: true,
        },
        {
            nom: 'Brevet d\'Études du Premier Cycle',
            code: 'BEPC',
            type: 'NATIONAL',
            niveauId: troisieme?.id,
            diplomeDelivre: 'BEPC',
            sousSysteme: 'FRANCOPHONE',
            estObligatoire: true,
        },
        {
            nom: 'PROBATOIRE',
            code: 'PROBATOIRE',
            type: 'NATIONAL',
            niveauId: premiere?.id,
            diplomeDelivre: 'PROBATOIRE',
            sousSysteme: 'FRANCOPHONE',
            estObligatoire: true,
        },
        {
            nom: 'BACCALAURÉAT',
            code: 'BACCALAUREAT',
            type: 'NATIONAL',
            niveauId: terminale?.id,
            diplomeDelivre: 'BACCALAUREAT',
            sousSysteme: 'FRANCOPHONE',
            estObligatoire: true,
        },
        // Anglophone
        {
            nom: 'GCE Ordinary Level',
            code: 'GCE_OL',
            type: 'NATIONAL',
            niveauId: form5?.id,
            diplomeDelivre: 'GCE_ORDINARY_LEVEL',
            sousSysteme: 'ANGLOPHONE',
            estObligatoire: true,
        },
        {
            nom: 'GCE Advanced Level',
            code: 'GCE_AL',
            type: 'NATIONAL',
            niveauId: upper6?.id,
            diplomeDelivre: 'GCE_ADVANCED_LEVEL',
            sousSysteme: 'ANGLOPHONE',
            estObligatoire: true,
        },
    ];

    const examens: ExamenNational[] = [];
    for (const data of examensData) {
        if (!data.niveauId) continue;

        const existing = await examenRepo.findOne({ where: { code: data.code } });
        if (!existing) {
            const examen = examenRepo.create(data);
            await examenRepo.save(examen);
            examens.push(examen);
            logger.info(`  ✓ Examen créé: ${data.nom}`);
        } else {
            examens.push(existing);
        }
    }

    // ==================================
    // RÉCAPITULATIF
    // ==================================
    logger.info('✅ Structure académique seedée avec succès:');
    logger.info(`  - ${cycles.length} cycles pédagogiques (avec attributs TypeCycle fusionnés)`);
    logger.info(`  - ${niveauxFR.length + niveauxEN.length} niveaux (${niveauxFR.length} FR + ${niveauxEN.length} EN)`);
    logger.info(`  - ${filieres.length} filières (générales + technologiques)`);
    logger.info(`  - ${examens.length} examens nationaux`);
}

export default seedStructureAcademique;
