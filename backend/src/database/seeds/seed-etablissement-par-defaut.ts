/**
 * ==================================
 * eLISAschool - Seed Établissement par défaut
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée un établissement par défaut lié à toutes les données du système
 */

import { AppDataSource } from '../data-source';
import { Etablissement, SousSysteme, TypeEtablissement, StatutEtablissement } from '@modules/etablissement/entities/etablissement.entity';
import { EtablissementConfig } from '@modules/etablissement/entities/etablissement-config.entity';
import { logger } from '@common/utils/logger.util';

/**
 * Seed de l'établissement par défaut
 * @returns L'ID de l'établissement créé ou existant
 */
export async function seedEtablissementParDefaut(): Promise<string> {
    const etablissementRepo = AppDataSource.getRepository(Etablissement);
    const configRepo = AppDataSource.getRepository(EtablissementConfig);

    // Vérifier si l'établissement existe déjà
    const existant = await etablissementRepo.findOne({
        where: { codeEtablissement: 'ETAB-001' },
    });

    if (existant) {
        logger.info('✅ Établissement par défaut déjà existant');
        return existant.id;
    }

    logger.info('🏫 Création de l\'établissement par défaut...');

    // Créer l'établissement
    const etablissement = etablissementRepo.create({
        nom: 'Lycée Bilingue eLISAschool',
        codeEtablissement: 'ETAB-001',
        slogan: 'L\'excellence éducative au service de la réussite',
        sousSysteme: SousSysteme.BICULTUREL,
        type: TypeEtablissement.LAIC,
        contactEmail: 'contact@elisaschool.cm',
        contactTelephone: '+237 690 000 000',
        adresse: 'Yaoundé, Cameroun',
        siteWeb: 'https://elisaschool.cm',
        actif: true,
        statut: StatutEtablissement.ACTIF,
        directeurNom: 'Dr. Jean Dupont',
        directeurAdjointNom: 'Mme. Marie Ngo Mback',
        censeurNom: 'M. Pierre Mbarga',
        surveillantGeneralNom: 'Mme. Aïcha Mahamat',
        heuresOuverture: '07:00',
        heuresFermeture: '18:00',
        effectifMax: 1000,
        effectifActuel: 0,
    });

    await etablissementRepo.save(etablissement);
    logger.info(`✅ Établissement créé: ${etablissement.nom} (ID: ${etablissement.id})`);

    // Créer la configuration associée
    const config = configRepo.create({
        etablissementId: etablissement.id,
        cyclesActifs: [], // Sera peuplé par seed-structure-academique
        configurationBulletin: {
            style: 'moderne',
            couleurPrimaire: '#2563EB',
            afficherRang: true,
            afficherMoyenneGenerale: true,
            afficherAppreciation: true,
            afficherPhoto: true,
            afficherCourbeProgression: true,
        },
        maxEleves: 1000,
        maxUtilisateurs: 100,
        maxClasses: 50,
        stockageMaxMB: 5000,
        planAbonnement: 'gratuit',
    });

    await configRepo.save(config);
    logger.info('✅ Configuration de l\'établissement créée');

    return etablissement.id;
}

/**
 * Supprime l'établissement par défaut (pour reset)
 */
export async function deleteEtablissementParDefaut(): Promise<void> {
    const etablissementRepo = AppDataSource.getRepository(Etablissement);
    const configRepo = AppDataSource.getRepository(EtablissementConfig);

    const etablissement = await etablissementRepo.findOne({
        where: { codeEtablissement: 'ETAB-001' },
    });

    if (!etablissement) {
        logger.info('Établissement par défaut n\'existe pas, skip...');
        return;
    }

    // Supprimer la config d'abord
    await configRepo.delete({ etablissementId: etablissement.id });
    
    // Supprimer l'établissement
    await etablissementRepo.remove(etablissement);
    
    logger.info('🗑️  Établissement par défaut supprimé');
}

export default seedEtablissementParDefaut;
