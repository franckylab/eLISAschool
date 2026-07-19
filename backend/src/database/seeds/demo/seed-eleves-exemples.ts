/**
 * ==================================
 * eLISAschool - Seed Élèves Exemples
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée des élèves exemples pour tester le système
 * Support multi-tenant avec etablissementId
 */

import { AppDataSource } from '@database/data-source';
import { Eleve, StatutEleve } from '@modules/eleves/entities';
import { Utilisateur, StatutUtilisateur } from '@modules/auth/entities';
import { Role } from '@shared/enums/roles.enum';
import { Classe } from '@modules/classes/entities';
import { ClasseAnnee } from '@modules/classes/entities/classe-annee.entity';
import { AffectationEleve, StatutAffectationEleve } from '@modules/classes/entities/affectation-eleve.entity';
import { Genre } from '@shared/enums/statuts.enum';
import { logger } from '@common/utils/logger.util';

interface EleveTemplate {
    nom: string;
    prenom: string;
    matricule: string;
    dateNaissance: string;
    lieuNaissance: string;
    sexe: Genre;
    classeCode: string;
    nationalite?: string;
    ville?: string;
    quartier?: string;
}

export async function seedElevesExemples(
    etablissementId: string,
    anneeScolaireId: string
): Promise<void> {
    logger.info('👨‍🎓 Seed des élèves exemples...');

    const eleveRepo = AppDataSource.getRepository(Eleve);
    const utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    const classeRepo = AppDataSource.getRepository(Classe);
    const classeAnneeRepo = AppDataSource.getRepository(ClasseAnnee);
    const affectationRepo = AppDataSource.getRepository(AffectationEleve);

    // Récupérer les classes années actives pour l'établissement et l'année
    const classesAnnees = await classeAnneeRepo.find({
        where: {
            etablissementId,
            anneeScolaireId: anneeScolaireId,
            actif: true,
        },
        relations: ['classe'],
    });

    if (classesAnnees.length === 0) {
        logger.warn('⚠️ Aucune classe trouvée pour cet établissement et cette année');
        return;
    }

    // Mapper code de classe → classeAnneeId
    const classeAnneeMap = new Map<string, string>();
    classesAnnees.forEach(ca => {
        if (ca.classe) {
            classeAnneeMap.set(ca.classe.code, ca.id);
        }
    });

    const elevesData: EleveTemplate[] = [
        // Primaire Francophone
        { nom: 'NOAH', prenom: 'Jean', matricule: 'ELV-2025-001', dateNaissance: '2014-03-15', lieuNaissance: 'Yaoundé', sexe: Genre.MASCULIN, classeCode: 'CM2', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Bastos' },
        { nom: 'POUGA', prenom: 'Marie', matricule: 'ELV-2025-002', dateNaissance: '2014-07-22', lieuNaissance: 'Douala', sexe: Genre.FEMININ, classeCode: 'CM2', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Melen' },
        { nom: 'TCHUENTE', prenom: 'Paul', matricule: 'ELV-2025-003', dateNaissance: '2015-01-10', lieuNaissance: 'Yaoundé', sexe: Genre.MASCULIN, classeCode: 'CM1', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Essos' },
        { nom: 'NGO', prenom: 'Alice', matricule: 'ELV-2025-004', dateNaissance: '2015-05-18', lieuNaissance: 'Bafoussam', sexe: Genre.FEMININ, classeCode: 'CM1', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Nlongkak' },
        { nom: 'MBA', prenom: 'Pierre', matricule: 'ELV-2025-005', dateNaissance: '2016-09-05', lieuNaissance: 'Yaoundé', sexe: Genre.MASCULIN, classeCode: 'CE2', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Mokolo' },
        { nom: 'FOTA', prenom: 'Sophie', matricule: 'ELV-2025-006', dateNaissance: '2016-11-30', lieuNaissance: 'Yaoundé', sexe: Genre.FEMININ, classeCode: 'CE2', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Biyem-Assi' },

        // Collège Francophone
        { nom: 'DUPONT', prenom: 'Lucas', matricule: 'ELV-2025-007', dateNaissance: '2012-04-12', lieuNaissance: 'Yaoundé', sexe: Genre.MASCULIN, classeCode: '6EME', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Bastos' },
        { nom: 'KAMGA', prenom: 'Isabelle', matricule: 'ELV-2025-008', dateNaissance: '2012-08-25', lieuNaissance: 'Douala', sexe: Genre.FEMININ, classeCode: '6EME', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Odza' },
        { nom: 'BELL', prenom: 'François', matricule: 'ELV-2025-009', dateNaissance: '2011-02-14', lieuNaissance: 'Yaoundé', sexe: Genre.MASCULIN, classeCode: '5EME', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Mendong' },
        { nom: 'NKOUATOU', prenom: 'Brigitte', matricule: 'ELV-2025-010', dateNaissance: '2011-06-08', lieuNaissance: 'Bafoussam', sexe: Genre.FEMININ, classeCode: '5EME', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Tsinga' },
        { nom: 'TAGNE', prenom: 'Emmanuel', matricule: 'ELV-2025-011', dateNaissance: '2010-12-20', lieuNaissance: 'Yaoundé', sexe: Genre.MASCULIN, classeCode: '4EME', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Emana' },
        { nom: 'KWATSA', prenom: 'Catherine', matricule: 'ELV-2025-012', dateNaissance: '2010-03-30', lieuNaissance: 'Yaoundé', sexe: Genre.FEMININ, classeCode: '4EME', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Ngousso' },
        { nom: 'DJOUMESSI', prenom: 'Victor', matricule: 'ELV-2025-013', dateNaissance: '2009-07-15', lieuNaissance: 'Douala', sexe: Genre.MASCULIN, classeCode: '3EME', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Bastos' },
        { nom: 'MOUOKO', prenom: 'Anne', matricule: 'ELV-2025-014', dateNaissance: '2009-10-05', lieuNaissance: 'Yaoundé', sexe: Genre.FEMININ, classeCode: '3EME', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Nkoldongo' },

        // Lycée Francophone
        { nom: 'MBOMBOCK', prenom: 'Henri', matricule: 'ELV-2025-015', dateNaissance: '2008-01-18', lieuNaissance: 'Yaoundé', sexe: Genre.MASCULIN, classeCode: 'SECONDE', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Bastos' },
        { nom: 'TCHATAT', prenom: 'Sarah', matricule: 'ELV-2025-016', dateNaissance: '2008-05-22', lieuNaissance: 'Bafoussam', sexe: Genre.FEMININ, classeCode: 'SECONDE', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Melen' },
        { nom: 'KUIATE', prenom: 'Daniel', matricule: 'ELV-2025-017', dateNaissance: '2007-09-10', lieuNaissance: 'Yaoundé', sexe: Genre.MASCULIN, classeCode: 'PREMIERE', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Essos' },
        { nom: 'DONGMO', prenom: 'Nathalie', matricule: 'ELV-2025-018', dateNaissance: '2007-03-28', lieuNaissance: 'Douala', sexe: Genre.FEMININ, classeCode: 'PREMIERE', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Nlongkak' },
        { nom: 'TSAFACK', prenom: 'Robert', matricule: 'ELV-2025-019', dateNaissance: '2006-11-15', lieuNaissance: 'Yaoundé', sexe: Genre.MASCULIN, classeCode: 'TERMINALE', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Mokolo' },
        { nom: 'ATCHO', prenom: 'Marguerite', matricule: 'ELV-2025-020', dateNaissance: '2006-07-08', lieuNaissance: 'Yaoundé', sexe: Genre.FEMININ, classeCode: 'TERMINALE', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Biyem-Assi' },

        // Primaire Anglophone
        { nom: 'WILLIAMS', prenom: 'John', matricule: 'ELV-2025-021', dateNaissance: '2014-02-20', lieuNaissance: 'Buea', sexe: Genre.MASCULIN, classeCode: 'STD6', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Bastos' },
        { nom: 'TAYLOR', prenom: 'Mary', matricule: 'ELV-2025-022', dateNaissance: '2014-06-15', lieuNaissance: 'Kumba', sexe: Genre.FEMININ, classeCode: 'STD6', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Melen' },
        { nom: 'BROWN', prenom: 'Peter', matricule: 'ELV-2025-023', dateNaissance: '2015-04-10', lieuNaissance: 'Bamenda', sexe: Genre.MASCULIN, classeCode: 'STD5', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Essos' },
        { nom: 'DAVIS', prenom: 'Sarah', matricule: 'ELV-2025-024', dateNaissance: '2015-08-25', lieuNaissance: 'Limbe', sexe: Genre.FEMININ, classeCode: 'STD5', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Nlongkak' },

        // Collège Anglophone
        { nom: 'MARTIN', prenom: 'James', matricule: 'ELV-2025-025', dateNaissance: '2012-01-12', lieuNaissance: 'Buea', sexe: Genre.MASCULIN, classeCode: 'FORM1', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Bastos' },
        { nom: 'WILSON', prenom: 'Grace', matricule: 'ELV-2025-026', dateNaissance: '2012-05-30', lieuNaissance: 'Kumba', sexe: Genre.FEMININ, classeCode: 'FORM1', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Melen' },
        { nom: 'MOORE', prenom: 'David', matricule: 'ELV-2025-027', dateNaissance: '2011-09-18', lieuNaissance: 'Bamenda', sexe: Genre.MASCULIN, classeCode: 'FORM3', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Essos' },
        { nom: 'THOMAS', prenom: 'Rebecca', matricule: 'ELV-2025-028', dateNaissance: '2011-03-22', lieuNaissance: 'Limbe', sexe: Genre.FEMININ, classeCode: 'FORM3', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Nlongkak' },
        { nom: 'JACKSON', prenom: 'Michael', matricule: 'ELV-2025-029', dateNaissance: '2010-07-14', lieuNaissance: 'Buea', sexe: Genre.MASCULIN, classeCode: 'FORM5', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Bastos' },
        { nom: 'WHITE', prenom: 'Elizabeth', matricule: 'ELV-2025-030', dateNaissance: '2010-11-28', lieuNaissance: 'Kumba', sexe: Genre.FEMININ, classeCode: 'FORM5', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Melen' },

        // Lycée Anglophone
        { nom: 'HARRIS', prenom: 'Daniel', matricule: 'ELV-2025-031', dateNaissance: '2008-02-16', lieuNaissance: 'Bamenda', sexe: Genre.MASCULIN, classeCode: 'LOWER6', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Bastos' },
        { nom: 'CLARK', prenom: 'Victoria', matricule: 'ELV-2025-032', dateNaissance: '2008-06-20', lieuNaissance: 'Buea', sexe: Genre.FEMININ, classeCode: 'LOWER6', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Melen' },
        { nom: 'LEWIS', prenom: 'Christopher', matricule: 'ELV-2025-033', dateNaissance: '2007-10-08', lieuNaissance: 'Limbe', sexe: Genre.MASCULIN, classeCode: 'UPPER6', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Essos' },
        { nom: 'ROBINSON', prenom: 'Patricia', matricule: 'ELV-2025-034', dateNaissance: '2007-04-12', lieuNaissance: 'Kumba', sexe: Genre.FEMININ, classeCode: 'UPPER6', nationalite: 'Camerounaise', ville: 'Yaoundé', quartier: 'Nlongkak' },
    ];

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const data of elevesData) {
        try {
            // Vérifier si l'élève existe déjà
            const existing = await eleveRepo.findOne({
                where: { matricule: data.matricule },
            });

            if (existing) {
                logger.debug(`  ⏭️ Élève existant: ${data.matricule}`);
                skippedCount++;
                continue;
            }

            // Trouver la classe année
            const classeAnneeId = classeAnneeMap.get(data.classeCode);
            if (!classeAnneeId) {
                logger.warn(`  ⚠️ Classe ${data.classeCode} non trouvée`);
                skippedCount++;
                continue;
            }

            // Créer l'utilisateur associé
            const utilisateur = utilisateurRepo.create({
                email: `eleve.${data.matricule.toLowerCase()}@elisaschool.cm`,
                matricule: data.matricule,
                motDePasse: 'Test123456!',
                role: Role.ELEVE,
                statut: StatutUtilisateur.ACTIF,
                emailVerifie: true,
                langue: 'fr',
            });

            await utilisateurRepo.save(utilisateur);

            // Créer l'élève (sans classeAnneeId)
            const eleve = eleveRepo.create({
                utilisateurId: utilisateur.id,
                nom: data.nom,
                prenom: data.prenom,
                matricule: data.matricule,
                dateNaissance: new Date(data.dateNaissance),
                lieuNaissance: data.lieuNaissance,
                sexe: data.sexe,
                nationalite: data.nationalite || 'Camerounaise',
                dateInscription: new Date(),
                statut: StatutEleve.ACTIF,
                typeInscription: 'MANUELLE',
                etablissementId,
                ville: data.ville,
                quartier: data.quartier,
                redoublement: false,
                boursier: false,
            });

            await eleveRepo.save(eleve);

            // Créer l'affectation de l'élève à la classe année
            const classeAnnee = await classeAnneeRepo.findOne({ 
                where: { id: classeAnneeId },
                relations: ['classe'],
            });
            
            if (classeAnnee && classeAnnee.classe) {
                const affectation = affectationRepo.create({
                    eleveId: eleve.id,
                    classeId: classeAnnee.classe.id,
                    classeAnneeId: classeAnnee.id,
                    anneeScolaireId: anneeScolaireId,
                    dateAffectation: new Date(),
                    statut: StatutAffectationEleve.ACTIVE,
                    etablissementId,
                });

                await affectationRepo.save(affectation);

                // Mettre à jour l'effectif de la classe année
                classeAnnee.effectifActuel = (classeAnnee.effectifActuel || 0) + 1;
                await classeAnneeRepo.save(classeAnnee);
            }

            createdCount++;
            logger.info(`  ✅ Élève créé: ${data.prenom} ${data.nom} → ${data.classeCode}`);
        } catch (error) {
            errorCount++;
            logger.error(`  ❌ Erreur pour ${data.matricule}:`, error);
        }
    }

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('📊 Rapport de seed des élèves:');
    logger.info(`  ✅ Créés: ${createdCount}`);
    logger.info(`  ⏭️ Existants: ${skippedCount}`);
    logger.info(`  ❌ Erreurs: ${errorCount}`);
    logger.info(`  📈 Total: ${createdCount + skippedCount}/${elevesData.length}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (errorCount > 0) {
        logger.warn(`⚠️ ${errorCount} erreur(s) lors du seed des élèves`);
    } else {
        logger.info('✅ Seed des élèves terminé avec succès');
    }
}

// Exécution standalone
if (require.main === module) {
    (async () => {
        try {
            await AppDataSource.initialize();
            logger.info('Database connected');

            const { Etablissement } = await import('@modules/etablissement/entities');
            const etablissementRepo = AppDataSource.getRepository(Etablissement);
            const etablissement = await etablissementRepo.findOne({
                where: { codeEtablissement: 'ETAB-001' },
            });

            if (!etablissement) {
                logger.error('Établissement par défaut non trouvé');
                process.exit(1);
            }

            const { AnneeScolaire } = await import('@modules/annees-scolaires/entities');
            const anneeRepo = AppDataSource.getRepository(AnneeScolaire);
            const anneeActive = await anneeRepo.findOne({
                where: { enCours: true, etablissementId: etablissement.id },
            });

            if (!anneeActive) {
                logger.error('Aucune année scolaire active trouvée');
                process.exit(1);
            }

            logger.info(`Établissement: ${etablissement.nom}`);
            logger.info(`Année scolaire: ${anneeActive.libelle}`);

            await seedElevesExemples(etablissement.id, anneeActive.id);

            await AppDataSource.destroy();
            logger.info('✅ Seed des élèves terminé');
            process.exit(0);
        } catch (error) {
            logger.error('❌ Erreur lors du seed des élèves:', error);
            process.exit(1);
        }
    })();
}

export default seedElevesExemples;
