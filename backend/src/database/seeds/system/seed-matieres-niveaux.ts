/**
 * ==================================
 * eLISAschool - Seed Matières-Niveaux
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Associe les matières aux niveaux avec coefficients
 * Support multi-tenant avec etablissementId
 */

import { AppDataSource } from '@database/data-source';
import { Matiere } from '@modules/matieres/entities';
import { MatiereNiveau } from '@modules/matieres/entities/matiere-niveau.entity';
import { Niveau } from '@modules/niveaux/entities';
import { SousSysteme } from '@modules/etablissement/entities';
import { logger } from '@common/utils/logger.util';

export async function seedMatieresNiveaux(etablissementId: string): Promise<void> {
    logger.info('📚 Seed des matières par niveau...');

    const matiereRepo = AppDataSource.getRepository(Matiere);
    const matiereNiveauRepo = AppDataSource.getRepository(MatiereNiveau);
    const niveauRepo = AppDataSource.getRepository(Niveau);

    // Récupérer toutes les matières de l'établissement
    const matieres = await matiereRepo.find({ where: { etablissementId, actif: true } });
    if (matieres.length === 0) {
        logger.warn('⚠️ Aucune matière trouvée pour cet établissement');
        return;
    }

    // Récupérer tous les niveaux de l'établissement
    const niveaux = await niveauRepo.find({ where: { etablissementId } });
    if (niveaux.length === 0) {
        logger.warn('⚠️ Aucun niveau trouvé pour cet établissement');
        return;
    }

    const matiereMap = new Map<string, string>();
    matieres.forEach(m => matiereMap.set(m.code, m.id));

    const niveauMap = new Map<string, string>();
    niveaux.forEach(n => niveauMap.set(n.code, n.id));

    // Profils de programme partagés (coefficient + horaire hebdo par matière)
    type ProgrammeMatiere = { code: string; coefficient: number; horaireHebdo: number };

    const PROFILS: Record<string, ProgrammeMatiere[]> = {
        // Maternelle (FR: PS/MS/GS — EN: NURSERY1/2) : éveil
        MATERNELLE: [
            { code: 'FR', coefficient: 2, horaireHebdo: 6 },
            { code: 'MATH', coefficient: 2, horaireHebdo: 4 },
            { code: 'ANG', coefficient: 1, horaireHebdo: 2 },
            { code: 'ART', coefficient: 1, horaireHebdo: 3 },
            { code: 'MUS', coefficient: 1, horaireHebdo: 2 },
            { code: 'EPS', coefficient: 1, horaireHebdo: 3 },
        ],
        // Primaire cycle 1 (CI/CP/CE1/CE2 — STD1-3)
        PRIMAIRE_BAS: [
            { code: 'FR', coefficient: 3, horaireHebdo: 8 },
            { code: 'MATH', coefficient: 3, horaireHebdo: 6 },
            { code: 'ANG', coefficient: 1, horaireHebdo: 2 },
            { code: 'SVT', coefficient: 2, horaireHebdo: 2 },
            { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
            { code: 'ART', coefficient: 1, horaireHebdo: 2 },
            { code: 'EMC', coefficient: 1, horaireHebdo: 1 },
        ],
        // Primaire cycle 2 (CM1/CM2 — STD4-6)
        PRIMAIRE_HAUT: [
            { code: 'MATH', coefficient: 3, horaireHebdo: 6 },
            { code: 'FR', coefficient: 3, horaireHebdo: 8 },
            { code: 'ANG', coefficient: 2, horaireHebdo: 3 },
            { code: 'HG', coefficient: 2, horaireHebdo: 3 },
            { code: 'SVT', coefficient: 2, horaireHebdo: 2 },
            { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
            { code: 'ART', coefficient: 1, horaireHebdo: 2 },
            { code: 'EMC', coefficient: 1, horaireHebdo: 1 },
        ],
        // Collège 1er cycle (6EME/5EME — FORM1/2)
        COLLEGE_BAS: [
            { code: 'MATH', coefficient: 3, horaireHebdo: 5 },
            { code: 'FR', coefficient: 3, horaireHebdo: 5 },
            { code: 'ANG', coefficient: 2, horaireHebdo: 3 },
            { code: 'HG', coefficient: 2, horaireHebdo: 3 },
            { code: 'SVT', coefficient: 2, horaireHebdo: 2 },
            { code: 'PC', coefficient: 2, horaireHebdo: 2 },
            { code: 'INFO', coefficient: 1, horaireHebdo: 1 },
            { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
            { code: 'ART', coefficient: 1, horaireHebdo: 1 },
            { code: 'EMC', coefficient: 1, horaireHebdo: 1 },
        ],
        // Collège 2e cycle (4EME/3EME — FORM3/4/5)
        COLLEGE_HAUT: [
            { code: 'MATH', coefficient: 4, horaireHebdo: 5 },
            { code: 'FR', coefficient: 4, horaireHebdo: 5 },
            { code: 'ANG', coefficient: 3, horaireHebdo: 3 },
            { code: 'HG', coefficient: 3, horaireHebdo: 3 },
            { code: 'SVT', coefficient: 3, horaireHebdo: 2 },
            { code: 'PC', coefficient: 3, horaireHebdo: 2 },
            { code: 'INFO', coefficient: 1, horaireHebdo: 1 },
            { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
            { code: 'EMC', coefficient: 1, horaireHebdo: 1 },
        ],
        // Lycée 2nde/1ère (SECONDE/PREMIERE — LOWER6)
        LYCEE_BAS: [
            { code: 'MATH', coefficient: 5, horaireHebdo: 6 },
            { code: 'SVT', coefficient: 4, horaireHebdo: 4 },
            { code: 'PC', coefficient: 4, horaireHebdo: 4 },
            { code: 'FR', coefficient: 4, horaireHebdo: 4 },
            { code: 'ANG', coefficient: 3, horaireHebdo: 3 },
            { code: 'HG', coefficient: 3, horaireHebdo: 3 },
            { code: 'SE', coefficient: 2, horaireHebdo: 2 },
            { code: 'INFO', coefficient: 1, horaireHebdo: 1 },
            { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
        ],
        // Lycée terminal (TERMINALE — UPPER6) : Série D
        LYCEE_HAUT: [
            { code: 'MATH', coefficient: 7, horaireHebdo: 7 },
            { code: 'SVT', coefficient: 6, horaireHebdo: 6 },
            { code: 'PC', coefficient: 6, horaireHebdo: 6 },
            { code: 'FR', coefficient: 3, horaireHebdo: 3 },
            { code: 'ANG', coefficient: 3, horaireHebdo: 3 },
            { code: 'HG', coefficient: 2, horaireHebdo: 2 },
            { code: 'PHILO', coefficient: 3, horaireHebdo: 3 },
            { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
        ],
    };

    // Mapping niveau → profil (couvre les 31 niveaux des deux sous-systèmes)
    const NIVEAU_PROFILS: Array<{ niveauCode: string; sousSysteme: SousSysteme; profil: keyof typeof PROFILS }> = [
        // Francophone
        { niveauCode: 'PS', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'MATERNELLE' },
        { niveauCode: 'MS', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'MATERNELLE' },
        { niveauCode: 'GS', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'MATERNELLE' },
        { niveauCode: 'CI', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'PRIMAIRE_BAS' },
        { niveauCode: 'CP', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'PRIMAIRE_BAS' },
        { niveauCode: 'CE1', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'PRIMAIRE_BAS' },
        { niveauCode: 'CE2', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'PRIMAIRE_BAS' },
        { niveauCode: 'CM1', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'PRIMAIRE_HAUT' },
        { niveauCode: 'CM2', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'PRIMAIRE_HAUT' },
        { niveauCode: '6EME', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'COLLEGE_BAS' },
        { niveauCode: '5EME', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'COLLEGE_BAS' },
        { niveauCode: '4EME', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'COLLEGE_HAUT' },
        { niveauCode: '3EME', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'COLLEGE_HAUT' },
        { niveauCode: 'SECONDE', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'LYCEE_BAS' },
        { niveauCode: 'PREMIERE', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'LYCEE_BAS' },
        { niveauCode: 'TERMINALE', sousSysteme: SousSysteme.FRANCOPHONE, profil: 'LYCEE_HAUT' },
        // Anglophone
        { niveauCode: 'NURSERY1', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'MATERNELLE' },
        { niveauCode: 'NURSERY2', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'MATERNELLE' },
        { niveauCode: 'STD1', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'PRIMAIRE_BAS' },
        { niveauCode: 'STD2', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'PRIMAIRE_BAS' },
        { niveauCode: 'STD3', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'PRIMAIRE_BAS' },
        { niveauCode: 'STD4', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'PRIMAIRE_HAUT' },
        { niveauCode: 'STD5', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'PRIMAIRE_HAUT' },
        { niveauCode: 'STD6', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'PRIMAIRE_HAUT' },
        { niveauCode: 'FORM1', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'COLLEGE_BAS' },
        { niveauCode: 'FORM2', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'COLLEGE_BAS' },
        { niveauCode: 'FORM3', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'COLLEGE_HAUT' },
        { niveauCode: 'FORM4', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'COLLEGE_HAUT' },
        { niveauCode: 'FORM5', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'COLLEGE_HAUT' },
        { niveauCode: 'LOWER6', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'LYCEE_BAS' },
        { niveauCode: 'UPPER6', sousSysteme: SousSysteme.ANGLOPHONE, profil: 'LYCEE_HAUT' },
    ];

    const matieresNiveauxData: Array<{
        niveauCode: string;
        sousSysteme: SousSysteme;
        matieres: ProgrammeMatiere[];
    }> = NIVEAU_PROFILS.map((n) => ({
        niveauCode: n.niveauCode,
        sousSysteme: n.sousSysteme,
        matieres: PROFILS[n.profil],
    }));

    let createdCount = 0;
    let skippedCount = 0;

    for (const config of matieresNiveauxData) {
        const niveauId = niveauMap.get(config.niveauCode);
        if (!niveauId) {
            logger.debug(`  ⏭️ Niveau ${config.niveauCode} non trouvé`);
            continue;
        }

        for (const matiereConfig of config.matieres) {
            const matiereId = matiereMap.get(matiereConfig.code);
            if (!matiereId) {
                logger.debug(`  ⏭️ Matière ${matiereConfig.code} non trouvée`);
                continue;
            }

            // Vérifier si l'association existe déjà
            const existing = await matiereNiveauRepo.findOne({
                where: {
                    matiereId,
                    niveauId,
                },
            });

            if (existing) {
                skippedCount++;
                continue;
            }

            // Créer l'association
            const matiereNiveau = matiereNiveauRepo.create({
                matiereId,
                niveauId,
                coefficient: matiereConfig.coefficient,
                volumeHoraire: matiereConfig.horaireHebdo * 60, // Conversion en minutes
                obligatoire: true,
            });

            await matiereNiveauRepo.save(matiereNiveau);
            createdCount++;
        }
    }

    logger.info(`✅ Matières-Niveaux: ${createdCount} créées, ${skippedCount} existantes`);
}

// Exécution standalone
if (require.main === module) {
    (async () => {
        try {
            await AppDataSource.initialize();
            logger.info('Database connected');

            const { Etablissement } = await import('@modules/etablissement/entities');
            const etablissementRepo = AppDataSource.getRepository(Etablissement);
            const etablissements = await etablissementRepo.find();

            if (etablissements.length === 0) {
                logger.error('Aucun établissement trouvé');
                process.exit(1);
            }

            for (const etablissement of etablissements) {
                logger.info(`Établissement: ${etablissement.nom} (${etablissement.id})`);
                await seedMatieresNiveaux(etablissement.id);
            }

            await AppDataSource.destroy();
            logger.info('✅ Seed des matières-niveaux terminé');
            process.exit(0);
        } catch (error) {
            logger.error('❌ Erreur lors du seed des matières-niveaux:', error);
            process.exit(1);
        }
    })();
}

export default seedMatieresNiveaux;
