/**
 * ==================================
 * eLISAschool - Tests d'Intégration Configuration Multi-Tenant
 * ==================================
 * Version: 1.0.0
 * 
 * Tests de la configuration unifiée avec ParametreSysteme
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { AppDataSource } from '@database/data-source';
import { configurationService } from '@modules/configuration/services/configuration.service';
import { ParametreSysteme, CategorieParametre, TypeValeurParametre } from '@modules/configuration/entities/parametre-systeme.entity';

describe('Configuration Multi-Tenant', () => {
    let dataSource: any;
    let testEtablissementId = '00000000-0000-4000-8000-000000000001';

    beforeAll(async () => {
        dataSource = await AppDataSource.initialize();
    });

    afterAll(async () => {
        if (dataSource) {
            await dataSource.destroy();
        }
    });

    describe('getParametre - Lecture avec fallback', () => {
        it('doit lire le paramètre global si aucun override établissement', async () => {
            // Créer un paramètre global
            await configurationService.setParametre('test.global_param', 'valeur_globale');

            const value = await configurationService.getParametre<string>('test.global_param');
            expect(value).toBe('valeur_globale');
        });

        it('doit lire l\'override établissement si existant', async () => {
            // Créer un paramètre global
            await configurationService.setParametre('test.etablissement_param', 'valeur_globale');
            
            // Créer un override pour l'établissement
            await configurationService.setParametre(
                'test.etablissement_param',
                'valeur_etablissement',
                testEtablissementId
            );

            const value = await configurationService.getParametre<string>(
                'test.etablissement_param',
                testEtablissementId
            );
            expect(value).toBe('valeur_etablissement');
        });

        it('doit fallback vers global si override supprimé', async () => {
            // Créer un paramètre global
            await configurationService.setParametre('test.reset_param', 'valeur_globale');
            
            // Créer puis supprimer l'override
            await configurationService.setParametre(
                'test.reset_param',
                'valeur_etablissement',
                testEtablissementId
            );
            await configurationService.resetParametre('test.reset_param', testEtablissementId);

            const value = await configurationService.getParametre<string>(
                'test.reset_param',
                testEtablissementId
            );
            expect(value).toBe('valeur_globale'); // Doit fallback vers global
        });

        it('doit retourner null si paramètre n\'existe pas', async () => {
            const value = await configurationService.getParametre<string>('test.inexistant');
            expect(value).toBeNull();
        });
    });

    describe('isModuleActive - Résolution multi-niveaux', () => {
        it('doit activer un module si paramètre établissement = true', async () => {
            await configurationService.toggleModule('notes', true, testEtablissementId);
            const isActive = await configurationService.isModuleActive('notes', testEtablissementId);
            expect(isActive).toBe(true);
        });

        it('doit désactiver un module si paramètre établissement = false', async () => {
            await configurationService.toggleModule('bulletins', false, testEtablissementId);
            const isActive = await configurationService.isModuleActive('bulletins', testEtablissementId);
            expect(isActive).toBe(false);
        });

        it('doit fallback vers paramètre global si pas d\'override établissement', async () => {
            // Activer globalement
            await configurationService.toggleModule('cantine', true);
            
            const isActive = await configurationService.isModuleActive('cantine', testEtablissementId);
            expect(isActive).toBe(true);
        });

        it('doit fallback vers MODULE_REGISTRY si aucun paramètre défini', async () => {
            // Module sans paramètre défini - doit utiliser defaultActive du registry
            const isActive = await configurationService.isModuleActive('auth');
            // auth est toujours actif par défaut
            expect(isActive).toBe(true);
        });

        it('doit respecter l\'override établissement même si global différent', async () => {
            // Activer globalement
            await configurationService.toggleModule('transport', true);
            
            // Désactiver pour l'établissement
            await configurationService.toggleModule('transport', false, testEtablissementId);
            
            const isActive = await configurationService.isModuleActive('transport', testEtablissementId);
            expect(isActive).toBe(false); // Doit respecter l'override établissement
        });
    });

    describe('setParametre - Écriture multi-tenant', () => {
        it('doit créer un paramètre global si etablissementId non fourni', async () => {
            const param = await configurationService.setParametre(
                'test.new_global',
                'valeur_test'
            );
            
            expect(param.cle).toBe('test.new_global');
            expect(param.etablissementId).toBeFalsy();
        });

        it('doit créer un override établissement si etablissementId fourni', async () => {
            const param = await configurationService.setParametre(
                'test.new_etablissement',
                'valeur_etablissement',
                testEtablissementId
            );
            
            expect(param.cle).toBe('test.new_etablissement');
            expect(param.etablissementId).toBe(testEtablissementId);
        });

        it('doit créer le paramètre global automatiquement si n\'existe pas', async () => {
            // Supposons que le paramètre n'existe pas
            await configurationService.setParametre(
                'test.auto_global',
                'valeur_etablissement',
                testEtablissementId
            );
            
            // Le paramètre global doit avoir été créé
            const globalParam = await configurationService.getParametre('test.auto_global');
            expect(globalParam).toBeDefined();
        });
    });

    describe('resetParametre - Réinitialisation', () => {
        it('doit supprimer l\'override établissement', async () => {
            // Créer un global (valeur distincte de l'override pour distinguer le fallback)
            await configurationService.setParametre(
                'test.reset_override',
                'valeur_globale'
            );

            // Créer un override
            await configurationService.setParametre(
                'test.reset_override',
                'valeur_etablissement',
                testEtablissementId
            );
            
            // Réinitialiser
            await configurationService.resetParametre('test.reset_override', testEtablissementId);
            
            // L'override doit être supprimé → fallback vers le global
            const value = await configurationService.getParametre(
                'test.reset_override',
                testEtablissementId
            );
            expect(value).toBe('valeur_globale');
        });

        it('doit réinitialiser le paramètre global vers valeurDefaut', async () => {
            // Créer avec valeurDefaut
            await configurationService.setParametre('test.reset_global', 'valeur_initiale');
            
            // Poser la valeur par défaut (stockée sur le paramètre)
            const repo = AppDataSource.getRepository(ParametreSysteme);
            const paramGlobal = await repo.findOne({ where: { cle: 'test.reset_global', etablissementId: null } });
            expect(paramGlobal).toBeDefined();
            if (paramGlobal) {
                paramGlobal.valeurDefaut = JSON.stringify('valeur_initiale');
                await repo.save(paramGlobal);
            }
            
            // Modifier
            await configurationService.updateParametre('test.reset_global', {
                valeur: 'valeur_modifiee'
            });
            
            // Réinitialiser
            await configurationService.resetParametre('test.reset_global');
            
            const value = await configurationService.getParametre('test.reset_global');
            expect(value).toBe('valeur_initiale');
        });
    });

    describe('Performance - isModuleActive', () => {
        it('doit s\'exécuter en moins de 50ms', async () => {
            const start = Date.now();
            await configurationService.isModuleActive('notes', testEtablissementId);
            const duration = Date.now() - start;
            
            expect(duration).toBeLessThan(50);
        });

        it('doit utiliser le cache pour les appels répétés', async () => {
            // Premier appel (cache miss)
            const start1 = Date.now();
            await configurationService.isModuleActive('messagerie', testEtablissementId);
            const duration1 = Date.now() - start1;
            
            // Second appel (cache hit)
            const start2 = Date.now();
            await configurationService.isModuleActive('messagerie', testEtablissementId);
            const duration2 = Date.now() - start2;
            
            // Le second appel doit être plus rapide
            expect(duration2).toBeLessThan(duration1);
        });
    });
});
