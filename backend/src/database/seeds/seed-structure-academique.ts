/**
 * ==================================
 * eLISAschool - Seed Structure Académique Complète
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée les cycles, niveaux, filières, spécialités et examens nationaux
 * conformes au système éducatif camerounais (francophone et anglophone)
 * Liés à un établissement spécifique
 * 
 * Changements v3.0:
 * - Ajout du paramètre etablissementId pour le multi-tenant
 * - Toutes les entités sont liées à l'établissement
 */

import { AppDataSource } from '@database/data-source';
import { Cycle } from '@modules/cycles/entities';
import { Niveau } from '@modules/niveaux/entities';
import { Filiere } from '@modules/filieres/entities';
import { ExamenNational } from '@modules/examens-nationaux/entities';
import { Specialite } from '@modules/specialites/entities/specialite.entity';
import { Competence } from '@modules/competences/entities/competence.entity';
import { SousSysteme } from '@modules/etablissement/entities';
import { logger } from '@common/utils/logger.util';

export async function seedStructureAcademique(etablissementId: string): Promise<void> {
    logger.info('🎓 Seed de la structure académique...');

    const cycleRepo = AppDataSource.getRepository(Cycle);
    const niveauRepo = AppDataSource.getRepository(Niveau);
    const filiereRepo = AppDataSource.getRepository(Filiere);
    const examenRepo = AppDataSource.getRepository(ExamenNational);
    const specialiteRepo = AppDataSource.getRepository(Specialite);
    const competenceRepo = AppDataSource.getRepository(Competence);

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
            description: "Cycle de l'enseignement élémentaire (6 ans)",
            dureeAnnees: 6,
            ordre: 2,
            diplomeSanctionnant: 'CEP',
        },
        {
            nom: 'Secondaire 1er Cycle - Collège',
            code: 'COLLEGE',
            description: "Premier cycle de l'enseignement secondaire - Collège (4 ans)",
            dureeAnnees: 4,
            ordre: 3,
            diplomeSanctionnant: 'BEPC',
        },
        {
            nom: 'Secondaire 2nd Cycle - Lycée',
            code: 'LYCEE',
            description: "Second cycle de l'enseignement secondaire - Lycée (3 ans)",
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
        { nom: 'Standard 5', code: 'STD5', cycleId: cycles[1].id, ordre: 5, sousSysteme: SousSysteme.ANGLOPHONE },
        { nom: 'Standard 6', code: 'STD6', cycleId: cycles[1].id, ordre: 6, sousSysteme: SousSysteme.ANGLOPHONE, estClasseExamen: true },
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
        const existing = await filiereRepo.findOne({ 
            where: { 
                code: data.code, 
                cycleId: data.cycleId,
                etablissementId 
            } 
        });
        if (!existing) {
            const filiere = filiereRepo.create({
                nom: data.nom,
                code: data.code,
                description: data.description,
                cycleId: data.cycleId,
                etablissementId,
                sousSysteme: data.sousSysteme as SousSysteme,
                actif: true,
            });
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
    const std6 = niveauxEN.find(n => n.code === 'STD6');
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
            nom: 'First School Leaving Certificate',
            code: 'FSLC',
            type: 'NATIONAL',
            niveauId: std6?.id,
            diplomeDelivre: 'FSLC',
            sousSysteme: 'ANGLOPHONE',
            estObligatoire: true,
        },
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
    // 5. SPÉCIALITÉS PAR FILIÈRE TECHNIQUE
    // ==================================
    logger.info('🔧 Création des spécialités pour filières techniques...');

    const filieresTechniques = await filiereRepo.find({
        where: [
            { code: 'F1' }, { code: 'F2' }, { code: 'F3' }, { code: 'F4' },
            { code: 'G1' }, { code: 'G2' }, { code: 'H' }, { code: 'I' },
            { code: 'K' }, { code: 'L' },
        ],
    });

    const specialitesData: Array<{ nom: string; code: string; filiereCode: string; description: string; ordre: number }> = [
        // F1 - Génie Mécanique
        { nom: 'Maintenance Automobile', code: 'MA', filiereCode: 'F1', description: 'Maintenance et réparation des véhicules automobiles', ordre: 1 },
        { nom: 'Usinage Conventionnel', code: 'UC', filiereCode: 'F1', description: 'Usinage sur machines conventionnelles (tour, fraiseuse)', ordre: 2 },
        { nom: 'Usinage CNC', code: 'UCN', filiereCode: 'F1', description: 'Usinage sur machines à commande numérique', ordre: 3 },
        { nom: 'Soudure Industrielle', code: 'SI', filiereCode: 'F1', description: 'Techniques de soudure MIG, TIG, à l\'arc', ordre: 4 },

        // F2 - Génie Électrotechnique
        { nom: 'Électrotechnique Industrielle', code: 'EI', filiereCode: 'F2', description: 'Installation et maintenance électrique industrielle', ordre: 1 },
        { nom: 'Automatismes Industriels', code: 'AI', filiereCode: 'F2', description: 'Programmation d\'automates et systèmes automatisés', ordre: 2 },
        { nom: 'Électronique de Puissance', code: 'EP', filiereCode: 'F2', description: 'Circuits électroniques de puissance et variateurs', ordre: 3 },
        { nom: 'Informatique Industrielle', code: 'II', filiereCode: 'F2', description: 'Systèmes informatiques embarqués industriels', ordre: 4 },

        // F3 - Génie Civil Bâtiment
        { nom: 'Gros Œuvre Bâtiment', code: 'GOB', filiereCode: 'F3', description: 'Construction structure bâtiment (fondations, maçonnerie)', ordre: 1 },
        { nom: 'Finition Bâtiment', code: 'FIN', filiereCode: 'F3', description: 'Travaux de finition (enduit, carrelage, peinture)', ordre: 2 },
        { nom: 'Topographie', code: 'TOPO', filiereCode: 'F3', description: 'Mesures topographiques et implantation de chantiers', ordre: 3 },

        // F4 - Génie Chimique
        { nom: 'Procédés Chimiques Industriels', code: 'PCI', filiereCode: 'F4', description: 'Conduite de procédés de transformation chimique', ordre: 1 },
        { nom: 'Contrôle Qualité', code: 'CQ', filiereCode: 'F4', description: 'Analyses et contrôle qualité en laboratoire', ordre: 2 },

        // G1 - Techniques Administratives
        { nom: 'Secrétariat de Direction', code: 'SD', filiereCode: 'G1', description: 'Assistanat et secrétariat de direction', ordre: 1 },
        { nom: 'Gestion Administrative', code: 'GA', filiereCode: 'G1', description: 'Gestion des documents et procédures administratives', ordre: 2 },

        // G2 - Techniques Commerciales
        { nom: 'Commerce International', code: 'CI', filiereCode: 'G2', description: 'Techniques du commerce international et import-export', ordre: 1 },
        { nom: 'Marketing Digital', code: 'MD', filiereCode: 'G2', description: 'Stratégies marketing et commerce électronique', ordre: 2 },
        { nom: 'Gestion de la Clientèle', code: 'GC', filiereCode: 'G2', description: 'Relation client et gestion de portefeuille', ordre: 3 },

        // H - Techniques Économiques
        { nom: 'Comptabilité et Gestion', code: 'CG', filiereCode: 'H', description: 'Comptabilité générale et analytique', ordre: 1 },
        { nom: 'Finance d\'Entreprise', code: 'FE', filiereCode: 'H', description: 'Analyse financière et gestion de trésorerie', ordre: 2 },

        // I - Informatique
        { nom: 'Développement Logiciel', code: 'DL', filiereCode: 'I', description: 'Conception et développement d\'applications', ordre: 1 },
        { nom: 'Réseaux et Systèmes', code: 'RS', filiereCode: 'I', description: 'Administration réseaux et systèmes informatiques', ordre: 2 },
        { nom: 'Base de Données', code: 'BD', filiereCode: 'I', description: 'Conception et administration de bases de données', ordre: 3 },

        // K - Arts Appliqués
        { nom: 'Design Graphique', code: 'DG', filiereCode: 'K', description: 'Création visuelle et communication graphique', ordre: 1 },
        { nom: 'Arts Plastiques', code: 'AP', filiereCode: 'K', description: 'Techniques artistiques et création plastique', ordre: 2 },

        // L - Hôtellerie-Restauration
        { nom: 'Cuisine Professionnelle', code: 'CP', filiereCode: 'L', description: 'Techniques culinaires et cuisine gastronomique', ordre: 1 },
        { nom: 'Service en Salle', code: 'SS', filiereCode: 'L', description: 'Art du service et gestion de restaurant', ordre: 2 },
        { nom: 'Pâtisserie', code: 'PAT', filiereCode: 'L', description: 'Techniques de pâtisserie et viennoiserie', ordre: 3 },
    ];

    let specialitesCount = 0;
    const filiereMap = new Map<string, string>();
    filieresTechniques.forEach(f => filiereMap.set(f.code, f.id));

    for (const spec of specialitesData) {
        const filiereId = filiereMap.get(spec.filiereCode);
        if (!filiereId) {
            logger.warn(`  ⚠️ Filière ${spec.filiereCode} non trouvée, spécialité ${spec.code} ignorée`);
            continue;
        }

        const existing = await specialiteRepo.findOne({ 
            where: { 
                code: spec.code, 
                filiereId,
                etablissementId 
            } 
        });
        if (!existing) {
            const specialite = specialiteRepo.create({
                nom: spec.nom,
                code: spec.code,
                description: spec.description,
                filiereId,
                etablissementId,
                ordre: spec.ordre,
                actif: true,
            });
            await specialiteRepo.save(specialite);
            specialitesCount++;
        }
    }

    logger.info(`  ✓ ${specialitesCount} spécialités créées`);

    // ==================================
    // 6. COMPÉTENCES (APC - Approche Par Compétences)
    // ==================================
    logger.info('🎯 Création des compétences pour l\'évaluation APC...');

    const competencesData: Array<{ code: string; libelle: string; domaine: string; niveauCode: string; description: string; ordre: number }> = [
        // Mathématiques - 6ème
        { code: 'COMP_MATH_6_01', libelle: 'Effectuer des calculs numériques simples', domaine: 'Mathématiques', niveauCode: '6EME', description: 'Addition, soustraction, multiplication, division sur les nombres entiers et décimaux', ordre: 1 },
        { code: 'COMP_MATH_6_02', libelle: 'Résoudre des problèmes de proportionnalité', domaine: 'Mathématiques', niveauCode: '6EME', description: 'Utiliser les règles de trois et les pourcentages simples', ordre: 2 },
        { code: 'COMP_MATH_6_03', libelle: 'Reconnaître et tracer des figures géométriques', domaine: 'Mathématiques', niveauCode: '6EME', description: 'Triangle, quadrilatère, cercle, symétrie axiale', ordre: 3 },

        // Mathématiques - 3ème
        { code: 'COMP_MATH_3_01', libelle: 'Résoudre une équation du premier degré', domaine: 'Mathématiques', niveauCode: '3EME', description: 'Équations de forme ax + b = 0', ordre: 1 },
        { code: 'COMP_MATH_3_02', libelle: 'Calculer avec les racines carrées', domaine: 'Mathématiques', niveauCode: '3EME', description: 'Simplification et opérations sur les racines carrées', ordre: 2 },
        { code: 'COMP_MATH_3_03', libelle: 'Démontrer des propriétés géométriques', domaine: 'Mathématiques', niveauCode: '3EME', description: 'Théorème de Pythagore, Thalès, trigonométrie', ordre: 3 },

        // Mathématiques - Terminale
        { code: 'COMP_MATH_T_01', libelle: 'Résoudre une équation du second degré', domaine: 'Mathématiques', niveauCode: 'TERMINALE', description: 'Équations ax² + bx + c = 0, discriminant', ordre: 1 },
        { code: 'COMP_MATH_T_02', libelle: 'Étudier les limites et la continuité d\'une fonction', domaine: 'Mathématiques', niveauCode: 'TERMINALE', description: 'Calcul de limites, théorèmes des valeurs intermédiaires', ordre: 2 },
        { code: 'COMP_MATH_T_03', libelle: 'Calculer des dérivées et étudier les variations', domaine: 'Mathématiques', niveauCode: 'TERMINALE', description: 'Dérivation, tableau de variations, extremums', ordre: 3 },
        { code: 'COMP_MATH_T_04', libelle: 'Maîtriser le calcul intégral', domaine: 'Mathématiques', niveauCode: 'TERMINALE', description: 'Primitives, calcul d\'aires, intégrales définies', ordre: 4 },

        // Sciences - 6ème
        { code: 'COMP_SCI_6_01', libelle: 'Identifier les états de la matière', domaine: 'Sciences', niveauCode: '6EME', description: 'Solide, liquide, gazeux, changements d\'état', ordre: 1 },
        { code: 'COMP_SCI_6_02', libelle: 'Décrire le système solaire', domaine: 'Sciences', niveauCode: '6EME', description: 'Planètes, soleil, mouvements célestes', ordre: 2 },

        // Sciences - 3ème
        { code: 'COMP_SCI_3_01', libelle: 'Comprendre les réactions chimiques', domaine: 'Sciences', niveauCode: '3EME', description: 'Équations chimiques, conservation de la masse', ordre: 1 },
        { code: 'COMP_SCI_3_02', libelle: 'Maîtriser les bases de l\'électricité', domaine: 'Sciences', niveauCode: '3EME', description: 'Circuits, loi d\'Ohm, puissance électrique', ordre: 2 },

        // Sciences - Terminale
        { code: 'COMP_SCI_T_01', libelle: 'Analyser les mécanismes de l\'hérédité', domaine: 'Sciences', niveauCode: 'TERMINALE', description: 'ADN, gènes, chromosomes, lois de Mendel', ordre: 1 },
        { code: 'COMP_SCI_T_02', libelle: 'Étudier la mécanique newtonienne', domaine: 'Sciences', niveauCode: 'TERMINALE', description: 'Lois de Newton, énergie, mouvement', ordre: 2 },

        // Français - 6ème
        { code: 'COMP_FR_6_01', libelle: 'Rédiger un texte narratif cohérent', domaine: 'Français', niveauCode: '6EME', description: 'Structure narrative, temps verbaux, cohérence', ordre: 1 },
        { code: 'COMP_FR_6_02', libelle: 'Identifier les classes grammaticales', domaine: 'Français', niveauCode: '6EME', description: 'Nom, verbe, adjectif, déterminant, pronom', ordre: 2 },

        // Français - Terminale
        { code: 'COMP_FR_T_01', libelle: 'Analyser un texte littéraire', domaine: 'Français', niveauCode: 'TERMINALE', description: 'Procédés stylistiques, registres, argumentation', ordre: 1 },
        { code: 'COMP_FR_T_02', libelle: 'Rédiger une dissertation structurée', domaine: 'Français', niveauCode: 'TERMINALE', description: 'Introduction, développement, conclusion, problématique', ordre: 2 },

        // Anglais - 6ème
        { code: 'COMP_ANG_6_01', libelle: 'Se présenter en anglais', domaine: 'Anglais', niveauCode: '6EME', description: 'Name, age, nationality, family, hobbies', ordre: 1 },
        { code: 'COMP_ANG_6_02', libelle: 'Comprendre des instructions simples', domaine: 'Anglais', niveauCode: '6EME', description: 'Classroom instructions, basic vocabulary', ordre: 2 },

        // Anglais - Terminale
        { code: 'COMP_ANG_T_01', libelle: 'Tenir une conversation courante', domaine: 'Anglais', niveauCode: 'TERMINALE', description: 'Fluency, pronunciation, everyday topics', ordre: 1 },
        { code: 'COMP_ANG_T_02', libelle: 'Rédiger un essai argumentatif', domaine: 'Anglais', niveauCode: 'TERMINALE', description: 'Essay structure, linking words, formal register', ordre: 2 },

        // Informatique - Seconde
        { code: 'COMP_INFO_2_01', libelle: 'Maîtriser les bases de la programmation', domaine: 'Informatique', niveauCode: 'SECONDE', description: 'Variables, conditions, boucles, fonctions', ordre: 1 },
        { code: 'COMP_INFO_2_02', libelle: 'Créer une page HTML/CSS simple', domaine: 'Informatique', niveauCode: 'SECONDE', description: 'Balises HTML, CSS de base, mise en page', ordre: 2 },

        // Histoire-Géographie - 3ème
        { code: 'COMP_HG_3_01', libelle: 'Analyser les causes de la Seconde Guerre mondiale', domaine: 'Histoire-Géographie', niveauCode: '3EME', description: 'Contexte historique, traités, montée des totalitarismes', ordre: 1 },
        { code: 'COMP_HG_3_02', libelle: 'Comprendre la décolonisation', domaine: 'Histoire-Géographie', niveauCode: '3EME', description: 'Mouvements d\'indépendance, impacts géopolitiques', ordre: 2 },

        // Éducation Civique - 6ème
        { code: 'COMP_EC_6_01', libelle: 'Connaître les symboles de la République', domaine: 'Éducation Civique', niveauCode: '6EME', description: 'Drapeau, hymne national, devise, institutions', ordre: 1 },
        { code: 'COMP_EC_6_02', libelle: 'Comprendre les droits et devoirs du citoyen', domaine: 'Éducation Civique', niveauCode: '6EME', description: 'Libertés fondamentales, responsabilités civiques', ordre: 2 },
    ];

    let competencesCount = 0;
    const niveauMap = new Map<string, string>();
    const tousNiveaux = await niveauRepo.find();
    tousNiveaux.forEach(n => niveauMap.set(n.code, n.id));
    
    logger.info(`  📊 Niveaux trouvés en base: ${tousNiveaux.length}`);
    logger.info(`  📊 Codes disponibles: ${tousNiveaux.map(n => n.code).join(', ')}`);

    for (const comp of competencesData) {
        const niveauId = niveauMap.get(comp.niveauCode);
        if (!niveauId) {
            logger.warn(`  ⚠️ Niveau ${comp.niveauCode} non trouvé, compétence ${comp.code} ignorée`);
            continue;
        }

        const existing = await competenceRepo.findOne({ 
            where: { 
                code: comp.code,
                etablissementId 
            } 
        });
        if (!existing) {
            const competence = competenceRepo.create({
                code: comp.code,
                libelle: comp.libelle,
                domaine: comp.domaine,
                niveauId,
                etablissementId,
                description: comp.description,
                ordre: comp.ordre,
                actif: true,
            });
            await competenceRepo.save(competence);
            competencesCount++;
        }
    }

    logger.info(`  ✓ ${competencesCount} compétences créées`);

    // ==================================
    // RÉCAPITULATIF
    // ==================================
    logger.info('✅ Structure académique seedée avec succès:');
    logger.info(`  - ${cycles.length} cycles pédagogiques (avec attributs TypeCycle fusionnés)`);
    logger.info(`  - ${niveauxFR.length + niveauxEN.length} niveaux (${niveauxFR.length} FR + ${niveauxEN.length} EN)`);
    logger.info(`  - ${filieres.length} filières (générales + technologiques)`);
    logger.info(`  - ${specialitesCount} spécialités techniques`);
    logger.info(`  - ${examens.length} examens nationaux`);
    logger.info(`  - ${competencesCount} compétences APC`);
    logger.info('');
    logger.info('💡 Exécutez ensuite: seed-classes-par-defaut.ts pour créer les classes');
}

export default seedStructureAcademique;
