/**
 * ==================================
 * eLISAschool - Tests d'Isolation Multi-Tenant
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Tests d'intégration pour vérifier l'isolation des données entre établissements
 * pour les entités Filiere, Specialite, et Competence.
 */

import { AppDataSource } from '@database/data-source';
import { Filiere } from '@modules/filieres/entities';
import { Specialite } from '@modules/specialites/entities';
import { Competence } from '@modules/competences/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { Cycle } from '@modules/cycles/entities';
import { Niveau } from '@modules/niveaux/entities';
import { filieresService } from '@modules/filieres/services';
import { specialitesService } from '@modules/specialites/services';
import { competencesService } from '@modules/competences/services';
import { AppError } from '@common/filters/error.filter';

describe('Isolation Multi-Tenant - Structure Académique', () => {
    let etablissement1: Etablissement;
    let etablissement2: Etablissement;
    let cycle: Cycle;
    let niveau: Niveau;

    beforeAll(async () => {
        await AppDataSource.initialize();
        
        // Créer 2 établissements de test
        const etablissementRepo = AppDataSource.getRepository(Etablissement);
        const cycleRepo = AppDataSource.getRepository(Cycle);
        const niveauRepo = AppDataSource.getRepository(Niveau);

        // Idempotence : nettoyer les résidus d'un run précédent interrompu
        // (même ordre que afterAll pour respecter les FK)
        await AppDataSource.getRepository(Competence).createQueryBuilder().delete().execute();
        await AppDataSource.getRepository(Specialite).createQueryBuilder().delete().execute();
        await AppDataSource.getRepository(Filiere).createQueryBuilder().delete().execute();
        await etablissementRepo.delete({ codeEtablissement: 'TEST-001' });
        await etablissementRepo.delete({ codeEtablissement: 'TEST-002' });

        // Établissement 1
        etablissement1 = etablissementRepo.create({
            nom: 'Lycée Test 1',
            codeEtablissement: 'TEST-001',
            ville: 'Yaoundé',
            pays: 'Cameroun',
        });
        await etablissementRepo.save(etablissement1);

        // Établissement 2
        etablissement2 = etablissementRepo.create({
            nom: 'Lycée Test 2',
            codeEtablissement: 'TEST-002',
            ville: 'Douala',
            pays: 'Cameroun',
        });
        await etablissementRepo.save(etablissement2);

        // Cycle pour les tests
        const cycles = await cycleRepo.find({ take: 1 });
        if (cycles.length > 0) {
            cycle = cycles[0];
        } else {
            cycle = cycleRepo.create({
                nom: 'Cycle Test',
                code: 'TEST_CYCLE',
                ordre: 1,
                dureeAnnees: 3,
            });
            await cycleRepo.save(cycle);
        }

        // Niveau pour les tests
        const niveaux = await niveauRepo.find({ take: 1 });
        if (niveaux.length > 0) {
            niveau = niveaux[0];
        } else {
            niveau = niveauRepo.create({
                nom: 'Niveau Test',
                code: 'TEST_NIV',
                cycleId: cycle.id,
                ordre: 1,
                sousSysteme: 'FRANCOPHONE',
            });
            await niveauRepo.save(niveau);
        }
    });

    afterAll(async () => {
        // Nettoyage
        await AppDataSource.getRepository(Competence).createQueryBuilder().delete().execute();
        await AppDataSource.getRepository(Specialite).createQueryBuilder().delete().execute();
        await AppDataSource.getRepository(Filiere).createQueryBuilder().delete().execute();
        await AppDataSource.getRepository(Etablissement).delete({ codeEtablissement: 'TEST-001' });
        await AppDataSource.getRepository(Etablissement).delete({ codeEtablissement: 'TEST-002' });
        
        await AppDataSource.destroy();
    });

    describe('Filière - Isolation Multi-Tenant', () => {
        it('devrait créer une filière pour établissement 1', async () => {
            const filiere = await filieresService.create({
                nom: 'Série C Test',
                code: 'C_TEST',
                cycleId: cycle.id,
                sousSysteme: 'FRANCOPHONE',
            }, etablissement1.id);

            expect(filiere.etablissementId).toBe(etablissement1.id);
            expect(filiere.nom).toBe('Série C Test');
        });

        it('devrait créer une filière avec le même code pour établissement 2', async () => {
            // Même code mais établissement différent = autorisé
            const filiere = await filieresService.create({
                nom: 'Série C Test E2',
                code: 'C_TEST',
                cycleId: cycle.id,
                sousSysteme: 'FRANCOPHONE',
            }, etablissement2.id);

            expect(filiere.etablissementId).toBe(etablissement2.id);
        });

        it('ne devrait PAS voir les filières de l\'établissement 2 depuis l\'établissement 1', async () => {
            const result = await filieresService.findAll({}, etablissement1.id);
            
            const filieresEtab2 = result.items.filter(f => f.etablissementId === etablissement2.id);
            expect(filieresEtab2).toHaveLength(0);
        });

        it('ne devrait PAS permettre d\'accéder à une filière d\'un autre établissement', async () => {
            // Créer une filière pour établissement 2
            const filiereE2 = await filieresService.create({
                nom: 'Série D Privée',
                code: 'D_PRIVEE',
                cycleId: cycle.id,
                sousSysteme: 'FRANCOPHONE',
            }, etablissement2.id);

            // Établissement 1 ne devrait pas pouvoir y accéder
            await expect(
                filieresService.findOne(filiereE2.id, etablissement1.id)
            ).rejects.toThrow(AppError);
        });

        it('devrait permettre de trouver une filière de son propre établissement', async () => {
            const filiereE1 = await filieresService.create({
                nom: 'Série E Test',
                code: 'E_TEST',
                cycleId: cycle.id,
                sousSysteme: 'FRANCOPHONE',
            }, etablissement1.id);

            const found = await filieresService.findOne(filiereE1.id, etablissement1.id);
            expect(found.id).toBe(filiereE1.id);
            expect(found.etablissementId).toBe(etablissement1.id);
        });
    });

    describe('Spécialité - Isolation Multi-Tenant', () => {
        let filiereE1: Filiere;
        let filiereE2: Filiere;

        beforeEach(async () => {
            // Idempotence : nettoyer les spécialités puis les filières de test d'un test précédent
            await AppDataSource.getRepository(Specialite).delete({ code: 'MA_TEST' });
            await AppDataSource.getRepository(Specialite).delete({ code: 'MA_E2' });
            await AppDataSource.getRepository(Specialite).delete({ code: 'SPEC_E1' });
            await AppDataSource.getRepository(Specialite).delete({ code: 'SPEC_E2' });
            await AppDataSource.getRepository(Filiere).delete({ code: 'F1_E1' });
            await AppDataSource.getRepository(Filiere).delete({ code: 'F1_E2' });

            // Créer des filières pour les tests
            filiereE1 = await filieresService.create({
                nom: 'Filière F1 E1',
                code: 'F1_E1',
                cycleId: cycle.id,
                sousSysteme: 'FRANCOPHONE',
            }, etablissement1.id);

            filiereE2 = await filieresService.create({
                nom: 'Filière F1 E2',
                code: 'F1_E2',
                cycleId: cycle.id,
                sousSysteme: 'FRANCOPHONE',
            }, etablissement2.id);
        });

        it('devrait créer une spécialité pour établissement 1', async () => {
            const specialite = await specialitesService.create({
                nom: 'Maintenance Test',
                code: 'MA_TEST',
                filiereId: filiereE1.id,
                ordre: 1,
            }, etablissement1.id);

            expect(specialite.etablissementId).toBe(etablissement1.id);
        });

        it('ne devrait PAS voir les spécialités d\'un autre établissement', async () => {
            // Créer pour établissement 2
            await specialitesService.create({
                nom: 'Maintenance E2',
                code: 'MA_E2',
                filiereId: filiereE2.id,
                ordre: 1,
            }, etablissement2.id);

            const result = await specialitesService.findAll({}, etablissement1.id);
            const specialitesE2 = result.items.filter(s => s.etablissementId === etablissement2.id);
            
            expect(specialitesE2).toHaveLength(0);
        });

        it('devrait filtrer les spécialités par filière ET établissement', async () => {
            // Créer 2 spécialités pour la même filière mais établissements différents
            await specialitesService.create({
                nom: 'Spec E1',
                code: 'SPEC_E1',
                filiereId: filiereE1.id,
                ordre: 1,
            }, etablissement1.id);

            await specialitesService.create({
                nom: 'Spec E2',
                code: 'SPEC_E2',
                filiereId: filiereE1.id, // Même filière ID (impossible en réalité mais pour le test)
                ordre: 2,
            }, etablissement2.id);

            const specialitesE1 = await specialitesService.findByFiliere(filiereE1.id, etablissement1.id);
            
            expect(specialitesE1.every(s => s.etablissementId === etablissement1.id)).toBe(true);
        });
    });

    describe('Compétence - Isolation Multi-Tenant', () => {
        it('devrait créer une compétence avec unicité par établissement', async () => {
            // Même code pour 2 établissements différents = autorisé
            const compE1 = await competencesService.create({
                code: 'COMP_TEST_01',
                libelle: 'Compétence Test E1',
                domaine: 'Mathématiques',
                niveauId: niveau.id,
                ordre: 1,
            }, etablissement1.id);

            const compE2 = await competencesService.create({
                code: 'COMP_TEST_01', // Même code
                libelle: 'Compétence Test E2',
                domaine: 'Mathématiques',
                niveauId: niveau.id,
                ordre: 1,
            }, etablissement2.id);

            expect(compE1.etablissementId).toBe(etablissement1.id);
            expect(compE2.etablissementId).toBe(etablissement2.id);
        });

        it('ne devrait PAS permettre de créer une compétence avec le même code dans le même établissement', async () => {
            await competencesService.create({
                code: 'COMP_UNIQUE',
                libelle: 'Compétence Unique',
                domaine: 'Sciences',
                niveauId: niveau.id,
                ordre: 1,
            }, etablissement1.id);

            // Tentative de création avec le même code dans le même établissement
            await expect(
                competencesService.create({
                    code: 'COMP_UNIQUE',
                    libelle: 'Duplication',
                    domaine: 'Sciences',
                    niveauId: niveau.id,
                    ordre: 2,
                }, etablissement1.id)
            ).rejects.toThrow(AppError);
        });

        it('ne devrait PAS voir les compétences d\'un autre établissement', async () => {
            await competencesService.create({
                code: 'COMP_PRIVEE',
                libelle: 'Compétence Privée E2',
                domaine: 'Histoire',
                niveauId: niveau.id,
                ordre: 1,
            }, etablissement2.id);

            const result = await competencesService.findAll({}, etablissement1.id);
            const competencesE2 = result.items.filter(c => c.etablissementId === etablissement2.id);
            
            expect(competencesE2).toHaveLength(0);
        });

        it('devrait filtrer les compétences par niveau ET établissement', async () => {
            await competencesService.create({
                code: 'COMP_NIV_E1',
                libelle: 'Compétence Niveau E1',
                domaine: 'Français',
                niveauId: niveau.id,
                ordre: 1,
            }, etablissement1.id);

            const competences = await competencesService.findByNiveau(niveau.id, etablissement1.id);
            
            expect(competences.every(c => c.etablissementId === etablissement1.id)).toBe(true);
        });
    });

    describe('Suppression CASCADE - Multi-Tenant', () => {
        it('devrait bloquer la suppression d\'un établissement qui a des filières (intégrité référentielle)', async () => {
            const filiereCountBefore = await AppDataSource.getRepository(Filiere).count({
                where: { etablissementId: etablissement1.id }
            });

            expect(filiereCountBefore).toBeGreaterThan(0);

            // La FK filieres.etablissementId → etablissements.id est RESTRICT :
            // supprimer l'établissement doit échouer tant que des filières existent
            await expect(
                AppDataSource.getRepository(Etablissement).delete(etablissement1.id)
            ).rejects.toThrow();

            // Les filières sont toujours là
            const filiereCountAfter = await AppDataSource.getRepository(Filiere).count({
                where: { etablissementId: etablissement1.id }
            });
            expect(filiereCountAfter).toBe(filiereCountBefore);
        });
    });
});
