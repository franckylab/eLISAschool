/**
 * ==================================
 * eLISAschool - Seed Établissements par défaut
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée deux établissements par défaut liés à toutes les données du système
 */

import { AppDataSource } from '../../data-source';
import { Etablissement, SousSysteme, TypeEtablissement, StatutEtablissement } from '@modules/etablissement/entities/etablissement.entity';
import { EtablissementConfig } from '@modules/etablissement/entities/etablissement-config.entity';
import { logger } from '@common/utils/logger.util';

export interface EtablissementsDefaut {
    principal: string; // ETAB-001
    secondaire: string; // ETAB-002
}

/**
 * Seed des établissements par défaut (2 établissements)
 * @returns Les IDs des établissements créés
 */
export async function seedEtablissementsParDefaut(): Promise<EtablissementsDefaut> {
    const etablissementRepo = AppDataSource.getRepository(Etablissement);
    const configRepo = AppDataSource.getRepository(EtablissementConfig);

    // ==================================
    // ÉTABLISSEMENT 1 : Principal
    // ==================================
    
    // Vérifier si l'établissement principal existe déjà
    const existant1 = await etablissementRepo.findOne({
        where: { codeEtablissement: 'ETAB-001' },
    });

    let etablissementPrincipal: Etablissement;

    if (existant1) {
        logger.info('✅ Établissement principal déjà existant');
        etablissementPrincipal = existant1;
    } else {
        logger.info('🏫 Création de l\'établissement principal...');

        etablissementPrincipal = etablissementRepo.create({
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
            // Paramètres régionaux (v3.0)
            langueDefaut: 'fr',
            devise: 'XAF',
            fuseauHoraire: 'Africa/Douala',
        });

        await etablissementRepo.save(etablissementPrincipal);
        logger.info(`✅ Établissement principal créé: ${etablissementPrincipal.nom} (ID: ${etablissementPrincipal.id})`);

        // Créer la configuration associée
        const config1 = configRepo.create({
            etablissementId: etablissementPrincipal.id,
            cyclesActifs: [],
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

        await configRepo.save(config1);
        logger.info('✅ Configuration de l\'établissement principal créée');
    }

    // ==================================
    // ÉTABLISSEMENT 2 : Secondaire
    // ==================================
    
    // Vérifier si l'établissement secondaire existe déjà
    const existant2 = await etablissementRepo.findOne({
        where: { codeEtablissement: 'ETAB-002' },
    });

    let etablissementSecondaire: Etablissement;

    if (existant2) {
        logger.info('✅ Établissement secondaire déjà existant');
        etablissementSecondaire = existant2;
    } else {
        logger.info('🏫 Création de l\'établissement secondaire...');

        etablissementSecondaire = etablissementRepo.create({
            nom: 'Collège Privé Les Palmiers',
            codeEtablissement: 'ETAB-002',
            slogan: 'Former les leaders de demain',
            sousSysteme: SousSysteme.FRANCOPHONE,
            type: TypeEtablissement.CONFESSIONNEL_CATHOLIQUE,
            contactEmail: 'contact@palmiers.cm',
            contactTelephone: '+237 690 111 111',
            adresse: 'Douala, Cameroun',
            siteWeb: 'https://palmiers.cm',
            actif: true,
            statut: StatutEtablissement.ACTIF,
            directeurNom: 'Mme. Claire Onguene',
            directeurAdjointNom: 'M. Thomas Ndongo',
            censeurNom: 'Mme. Brigitte Ekoa',
            surveillantGeneralNom: 'M. Robert Bell',
            heuresOuverture: '07:30',
            heuresFermeture: '17:30',
            effectifMax: 500,
            effectifActuel: 0,
            // Paramètres régionaux (v3.0)
            langueDefaut: 'fr',
            devise: 'XAF',
            fuseauHoraire: 'Africa/Douala',
        });

        await etablissementRepo.save(etablissementSecondaire);
        logger.info(`✅ Établissement secondaire créé: ${etablissementSecondaire.nom} (ID: ${etablissementSecondaire.id})`);

        // Créer la configuration associée
        const config2 = configRepo.create({
            etablissementId: etablissementSecondaire.id,
            cyclesActifs: [],
            configurationBulletin: {
                style: 'classique',
                couleurPrimaire: '#059669',
                afficherRang: true,
                afficherMoyenneGenerale: true,
                afficherAppreciation: true,
                afficherPhoto: true,
                afficherCourbeProgression: false,
            },
            maxEleves: 500,
            maxUtilisateurs: 50,
            maxClasses: 30,
            stockageMaxMB: 2000,
            planAbonnement: 'gratuit',
        });

        await configRepo.save(config2);
        logger.info('✅ Configuration de l\'établissement secondaire créée');
    }

    // Seed les usages sémantiques système par défaut (nécessaires pour les niveaux de période)
    const { UsageNiveau } = await import('@modules/periodes/entities/usage-niveau.entity');
    const usageRepo = AppDataSource.getRepository(UsageNiveau);
    const usagesDefaut = [
        { code: 'NOTES', label: 'Saisie des notes', estSysteme: true },
        { code: 'BULLETIN', label: 'Génération des bulletins', estSysteme: true },
        { code: 'COMPOSITION', label: 'Création de compositions', estSysteme: true },
        { code: 'ANNEE', label: 'Niveau racine (Année)', estSysteme: true },
        { code: 'AUTRE', label: 'Autre usage', estSysteme: true }
    ];
    for (const u of usagesDefaut) {
        const exist = await usageRepo.findOne({ where: { code: u.code } });
        if (!exist) {
            const usage = usageRepo.create(u);
            await usageRepo.save(usage);
            logger.info(`✅ Usage système créé: ${u.code}`);
        }
    }

    // Seed les niveaux de périodicité par défaut pour les deux établissements
    const { NiveauxPeriodeService } = await import('@modules/periodes/services/niveaux-periode.service');
    const niveauxService = new NiveauxPeriodeService();
    await niveauxService.seedNiveauxDefaut(etablissementPrincipal.id);
    await niveauxService.seedNiveauxDefaut(etablissementSecondaire.id);

    return {
        principal: etablissementPrincipal.id,
        secondaire: etablissementSecondaire.id,
    };
}

/**
 * Supprime les établissements par défaut (pour reset)
 */
export async function deleteEtablissementsParDefaut(): Promise<void> {
    const etablissementRepo = AppDataSource.getRepository(Etablissement);
    const configRepo = AppDataSource.getRepository(EtablissementConfig);

    for (const code of ['ETAB-001', 'ETAB-002']) {
        const etablissement = await etablissementRepo.findOne({
            where: { codeEtablissement: code },
        });

        if (!etablissement) {
            logger.info(`Établissement ${code} n'existe pas, skip...`);
            continue;
        }

        // Supprimer la config d'abord
        await configRepo.delete({ etablissementId: etablissement.id });
        
        // Supprimer l'établissement
        await etablissementRepo.remove(etablissement);
        
        logger.info(`🗑️  Établissement ${code} supprimé`);
    }
}

export default seedEtablissementsParDefaut;
