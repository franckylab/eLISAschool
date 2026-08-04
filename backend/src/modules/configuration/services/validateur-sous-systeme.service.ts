/**
 * ==================================
 * eLISAschool - Service Validateur Sous-Système
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 * 
 * Valide la cohérence des entités avec le sous-système éducatif
 * Supporte les modes: francophone, anglophone, biculturel
 */

import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

/** Sous-système éducatif (enum local — non exporté dans @shared/enums) */
enum SousSysteme {
    FRANCOPHONE = 'FRANCOPHONE',
    ANGLOPHONE = 'ANGLOPHONE',
    BICULTUREL = 'BICULTUREL',
}

export interface ValidationSousSystemeResult {
    valide: boolean;
    erreurs: string[];
    avertissements: string[];
}

export class ValidateurSousSystemService {
    /**
     * Valide qu'une matière est compatible avec une classe/filière
     */
    async validerMatiereClasse(
        matiereId: string,
        classeId: string
    ): Promise<ValidationSousSystemeResult> {
        const result: ValidationSousSystemeResult = {
            valide: true,
            erreurs: [],
            avertissements: [],
        };

        // Charger la matière et la classe
        const matiereRepo = AppDataSource.getRepository('Matieres');
        const classeRepo = AppDataSource.getRepository('Classes');

        const matiere = await matiereRepo.findOne({ where: { id: matiereId } }) as any;
        const classe = await classeRepo.findOne({ 
            where: { id: classeId },
            relations: ['filiere']
        }) as any;

        if (!matiere || !classe) {
            result.valide = false;
            result.erreurs.push('Matière ou classe introuvable');
            return result;
        }

        // Si la matière n'a pas de sous-système, elle est commune
        if (!matiere.sousSysteme) {
            return result; // Matière commune, toujours valide
        }

        // Si la classe n'a pas de filière, elle est générale
        if (!classe.filiereId) {
            // Vérifier si l'établissement est biculturel
            const etablissementRepo = AppDataSource.getRepository('Etablissements');
            const etablissement = await etablissementRepo.findOne({ 
                where: { id: classe.etablissementId }
            }) as any;

            if (etablissement?.sousSysteme === SousSysteme.BICULTUREL) {
                result.avertissements.push(
                    `La matière "${matiere.nom}" est spécifique au sous-système ${matiere.sousSysteme}, ` +
                    `mais la classe n'a pas de filière définie dans un établissement biculturel`
                );
            }
            return result;
        }

        // Vérifier la compatibilité filière/sous-système
        const filiereRepo = AppDataSource.getRepository('Filieres');
        const filiere = await filiereRepo.findOne({ 
            where: { id: classe.filiereId }
        }) as any;

        if (!filiere) {
            return result;
        }

        // Si la filière a un sous-système, vérifier la compatibilité
        if (filiere.sousSysteme && filiere.sousSysteme !== matiere.sousSysteme) {
            result.valide = false;
            result.erreurs.push(
                `Incompatibilité: la matière "${matiere.nom}" (${matiere.sousSysteme}) ` +
                `ne peut pas être assignée à la filière "${filiere.nom}" (${filiere.sousSysteme})`
            );
        }

        return result;
    }

    /**
     * Valide qu'un élève peut être inscrit dans une classe
     */
    async validerInscriptionEleve(
        eleveId: string,
        classeId: string
    ): Promise<ValidationSousSystemeResult> {
        const result: ValidationSousSystemeResult = {
            valide: true,
            erreurs: [],
            avertissements: [],
        };

        const eleveRepo = AppDataSource.getRepository('Eleves');
        const classeRepo = AppDataSource.getRepository('Classes');

        const eleve = await eleveRepo.findOne({ 
            where: { id: eleveId },
            relations: ['classePrecedente']
        }) as any;
        const classe = await classeRepo.findOne({ 
            where: { id: classeId },
            relations: ['filiere', 'niveau']
        }) as any;

        if (!eleve || !classe) {
            result.valide = false;
            result.erreurs.push('Élève ou classe introuvable');
            return result;
        }

        // Vérifier la cohérence du sous-système si l'élève vient d'une autre classe
        if (eleve.classePrecedenteId) {
            const classePrecedente = await classeRepo.findOne({ 
                where: { id: eleve.classePrecedenteId },
                relations: ['filiere']
            }) as any;

            if (classePrecedente?.filiereId && classe.filiereId) {
                const filiereRepo = AppDataSource.getRepository('Filieres');
                const filierePrecedente = await filiereRepo.findOne({ 
                    where: { id: classePrecedente.filiereId }
                }) as any;
                const filiereActuelle = await filiereRepo.findOne({ 
                    where: { id: classe.filiereId }
                }) as any;

                // Vérifier le changement de sous-système
                if (filierePrecedente?.sousSysteme && filiereActuelle?.sousSysteme &&
                    filierePrecedente.sousSysteme !== filiereActuelle.sousSysteme) {
                    result.avertissements.push(
                        `Changement de sous-système détecté: ` +
                        `${filierePrecedente.sousSysteme} → ${filiereActuelle.sousSysteme}`
                    );
                }
            }
        }

        return result;
    }

    /**
     * Valide la cohérence globale d'un établissement
     */
    async validerEtablissement(etablissementId: string): Promise<ValidationSousSystemeResult> {
        const result: ValidationSousSystemeResult = {
            valide: true,
            erreurs: [],
            avertissements: [],
        };

        // Charger l'établissement
        const etablissementRepo = AppDataSource.getRepository('Etablissements');
        const etablissement = await etablissementRepo.findOne({ 
            where: { id: etablissementId }
        }) as any;

        if (!etablissement) {
            result.valide = false;
            result.erreurs.push('Établissement introuvable');
            return result;
        }

        // Si l'établissement est biculturel, vérifier qu'il a des filières des deux systèmes
        if (etablissement.sousSysteme === SousSysteme.BICULTUREL) {
            const filiereRepo = AppDataSource.getRepository('Filieres');
            const filieres = await filiereRepo.find({ 
                where: { etablissementId }
            }) as any[];

            const filieresFrancophone = filieres.filter(
                f => f.sousSysteme === SousSysteme.FRANCOPHONE
            );
            const filieresAnglophone = filieres.filter(
                f => f.sousSysteme === SousSysteme.ANGLOPHONE
            );

            if (filieresFrancophone.length === 0) {
                result.avertissements.push(
                    'Établissement biculturel sans filières francophones'
                );
            }

            if (filieresAnglophone.length === 0) {
                result.avertissements.push(
                    'Établissement biculturel sans filières anglophones'
                );
            }

            // Vérifier les matières
            const matiereRepo = AppDataSource.getRepository('Matieres');
            const matieres = await matiereRepo.find({ 
                where: { etablissementId }
            }) as any[];

            const matieresSansSousSysteme = matieres.filter(m => !m.sousSysteme).length;
            const matieresFrancophone = matieres.filter(
                m => m.sousSysteme === SousSysteme.FRANCOPHONE
            ).length;
            const matieresAnglophone = matieres.filter(
                m => m.sousSysteme === SousSysteme.ANGLOPHONE
            ).length;

            if (matieresSansSousSysteme === 0 && matieresFrancophone > 0 && matieresAnglophone > 0) {
                result.avertissements.push(
                    'Toutes les matières ont un sous-système défini. ' +
                    'Considérez créer des matières communes (sans sous-système) ' +
                    'comme Mathématiques, Sciences, etc.'
                );
            }
        }

        logger.info(`[ValidateurSousSysteme] Validation établissement ${etablissementId}: ${result.valide ? '✓' : '✗'}`);

        return result;
    }

    /**
     * Middleware de validation pour les contrôleurs
     */
    async validerEtLancer(
        validationFn: () => Promise<ValidationSousSystemeResult>,
        bloquant: boolean = true
    ): Promise<void> {
        const result = await validationFn();

        if (!result.valide && bloquant) {
            throw new AppError(
                `Erreur de cohérence sous-système: ${result.erreurs.join(', ')}`,
                400,
                'INCOHERENCE_SOUS_SYSTEME',
                true,
                { erreurs: result.erreurs, avertissements: result.avertissements }
            );
        }

        // Logger les avertissements même si valide
        if (result.avertissements.length > 0) {
            result.avertissements.forEach(avert => {
                logger.warn(`[ValidateurSousSysteme] ${avert}`);
            });
        }
    }
}

// Singleton export
export const validateurSousSystemService = new ValidateurSousSystemService();
