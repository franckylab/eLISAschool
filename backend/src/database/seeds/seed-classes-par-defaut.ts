/**
 * ==================================
 * eLISAschool - Seed Classes Par Défaut
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée un template de classes par défaut pour un établissement biculturel.
 * À exécuter après le seed de la structure académique et la création d'une année scolaire.
 * 
 * Usage:
 * - Seed automatique lors de la création d'un établissement
 * - Ou exécution manuelle via script
 */

import { AppDataSource } from '@database/data-source';
import { Classe, TypeClasse, CreneauHoraire } from '@modules/classes/entities';
import { Niveau } from '@modules/niveaux/entities';
import { Filiere } from '@modules/filieres/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { SousSysteme } from '@modules/etablissement/entities';
import { logger } from '@common/utils/logger.util';

interface ClasseTemplate {
    niveauCode: string;
    sousSysteme: SousSysteme;
    sections: string[];
    filiereCode?: string;
    typeClasse?: TypeClasse;
    creneauHoraire?: CreneauHoraire;
    effectifMax?: number;
}

export async function seedClassesParDefaut(etablissementId: string, anneeScolaireId?: string): Promise<void> {
    logger.info('🏫 Seed des classes par défaut...');

    const classeRepo = AppDataSource.getRepository(Classe);
    const niveauRepo = AppDataSource.getRepository(Niveau);
    const filiereRepo = AppDataSource.getRepository(Filiere);
    const anneeRepo = AppDataSource.getRepository(AnneeScolaire);

    // Récupérer l'année scolaire
    let anneeActive: AnneeScolaire | null;
    if (anneeScolaireId) {
        anneeActive = await anneeRepo.findOne({ where: { id: anneeScolaireId, etablissementId } });
    } else {
        anneeActive = await anneeRepo.findOne({ where: { enCours: true, etablissementId } });
    }

    if (!anneeActive) {
        logger.warn('⚠️ Aucune année scolaire trouvée, seed classes ignoré');
        return;
    }

    // Récupérer tous les niveaux et filières
    const niveaux = await niveauRepo.find();
    const filieres = await filiereRepo.find();

    // ==================================
    // TEMPLATES DE CLASSES BICULTUREL
    // ==================================

    const classesTemplates: ClasseTemplate[] = [
        // === MATERNELLE FRANCOPHONE ===
        { niveauCode: 'PS', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B'], effectifMax: 30 },
        { niveauCode: 'MS', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B'], effectifMax: 30 },
        { niveauCode: 'GS', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B'], effectifMax: 30 },

        // === PRIMAIRE FRANCOPHONE ===
        { niveauCode: 'CI', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B'], effectifMax: 45 },
        { niveauCode: 'CP', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B', 'C'], effectifMax: 45 },
        { niveauCode: 'CE1', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B', 'C'], effectifMax: 45 },
        { niveauCode: 'CE2', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B', 'C'], effectifMax: 45 },
        { niveauCode: 'CM1', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B'], effectifMax: 45 },
        { niveauCode: 'CM2', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B'], effectifMax: 45 },

        // === COLLÈGE FRANCOPHONE ===
        { niveauCode: '6EME', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B', 'C'], effectifMax: 45 },
        { niveauCode: '5EME', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B', 'C'], effectifMax: 45 },
        { niveauCode: '4EME', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B'], effectifMax: 45 },
        { niveauCode: '3EME', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A', 'B'], effectifMax: 45 },

        // === LYCÉE FRANCOPHONE (avec filières) ===
        { niveauCode: 'SECONDE', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A'], filiereCode: 'C', effectifMax: 40 },
        { niveauCode: 'SECONDE', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A'], filiereCode: 'D', effectifMax: 40 },
        { niveauCode: 'SECONDE', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A'], filiereCode: 'A', effectifMax: 40 },
        { niveauCode: 'PREMIERE', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A'], filiereCode: 'C', effectifMax: 40 },
        { niveauCode: 'PREMIERE', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A'], filiereCode: 'D', effectifMax: 40 },
        { niveauCode: 'PREMIERE', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A'], filiereCode: 'A', effectifMax: 40 },
        { niveauCode: 'PREMIERE', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A'], filiereCode: 'G2', effectifMax: 40 },
        { niveauCode: 'TERMINALE', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A'], filiereCode: 'C', effectifMax: 40 },
        { niveauCode: 'TERMINALE', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A'], filiereCode: 'D', effectifMax: 40 },
        { niveauCode: 'TERMINALE', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A'], filiereCode: 'A', effectifMax: 40 },
        { niveauCode: 'TERMINALE', sousSysteme: SousSysteme.FRANCOPHONE, sections: ['A'], filiereCode: 'G2', effectifMax: 40 },

        // === MATERNELLE ANGLOPHONE ===
        { niveauCode: 'NURSERY1', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A'], effectifMax: 25 },
        { niveauCode: 'NURSERY2', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A'], effectifMax: 25 },

        // === PRIMAIRE ANGLOPHONE ===
        { niveauCode: 'STD1', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'STD2', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'STD3', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'STD4', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'STD5', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A'], effectifMax: 40 },

        // === COLLÈGE ANGLOPHONE ===
        { niveauCode: 'FORM1', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'FORM2', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'FORM3', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A', 'B'], effectifMax: 40 },
        { niveauCode: 'FORM4', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A'], effectifMax: 40 },
        { niveauCode: 'FORM5', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A'], effectifMax: 40 },

        // === LYCÉE ANGLOPHONE ===
        { niveauCode: 'LOWER6', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A'], effectifMax: 35 },
        { niveauCode: 'UPPER6', sousSysteme: SousSysteme.ANGLOPHONE, sections: ['A'], effectifMax: 35 },
    ];

    let classesCount = 0;
    let skippedCount = 0;

    for (const template of classesTemplates) {
        // Trouver le niveau
        const niveau = niveaux.find(n =>
            n.code === template.niveauCode && n.sousSysteme === template.sousSysteme
        );

        if (!niveau) {
            logger.warn(`  ⚠️ Niveau ${template.niveauCode} (${template.sousSysteme}) non trouvé`);
            continue;
        }

        // Trouver la filière si applicable
        let filiereId: string | null = null;
        if (template.filiereCode) {
            const filiere = filieres.find(f => f.code === template.filiereCode);
            if (filiere) {
                filiereId = filiere.id;
            } else {
                logger.warn(`  ⚠️ Filière ${template.filiereCode} non trouvée`);
            }
        }

        // Créer les sections
        for (const section of template.sections) {
            const nom = `${niveau.nom} ${section}${filiereId ? ` (${template.filiereCode})` : ''}`;
            const code = `${niveau.code}_${section}${template.filiereCode ? `_${template.filiereCode}` : ''}`;

            // Vérifier si la classe existe déjà
            const existing = await classeRepo.findOne({
                where: { code, anneeScolaireId: anneeActive.id, etablissementId }
            });

            if (existing) {
                skippedCount++;
                continue;
            }

            // Créer la classe
            const classe = classeRepo.create({
                nom,
                code,
                niveauId: niveau.id,
                filiereId,
                anneeScolaireId: anneeActive.id,
                etablissementId,
                typeClasse: template.typeClasse || TypeClasse.NORMALE,
                creneauHoraire: template.creneauHoraire || CreneauHoraire.MATIN,
                effectifMax: template.effectifMax || 45,
                effectifActuel: 0,
                actif: true,
            });

            await classeRepo.save(classe);
            classesCount++;
        }
    }

    logger.info(`  ✓ ${classesCount} classes créées (${skippedCount} ignorées - existantes)`);
}

export default seedClassesParDefaut;
