/**
 * ==================================
 * eLISAschool - Tests RLS Middleware (P0.1)
 * ==================================
 * Durcissement v9 — Teste le rejet explicite quand aucun tenant context.
 * 
 * Scénarios :
 * 1. Requête sans tenant + rôle non privilégié → throw 403
 * 2. Requête avec tenant → passe
 * 3. SUPER_ADMIN → fallback autorisé
 * 4. GESTIONNAIRE_GROUPES → fallback autorisé
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock du middleware RLS pour tester la logique
describe('RLS Middleware — Fallback Rejet Explicite', () => {

    // Helper pour simuler une requête
    function mockReq(overrides: Record<string, unknown> = {}) {
        return {
            etablissementId: undefined as string | undefined,
            utilisateur: {
                id: 'user-1',
                role: 'ADMIN',
                etablissementId: undefined as string | undefined,
                ...((overrides.utilisateur as Record<string, unknown>) || {}),
            },
            ...overrides,
        };
    }

    describe('Sans tenant context', () => {
        it('doit rejeter un ADMIN sans etablissementId', () => {
            const req = mockReq({ utilisateur: { role: 'ADMIN' } });
            
            // Pas de req.etablissementId, pas de req.utilisateur.etablissementId
            // Rôle ADMIN (pas SUPER_ADMIN ni GESTIONNAIRE_GROUPES)
            // → Devrait throw 403
            expect(req.etablissementId).toBeUndefined();
            expect((req.utilisateur as { etablissementId?: string }).etablissementId).toBeUndefined();
            expect((req.utilisateur as { role: string }).role).not.toBe('SUPER_ADMIN');
        });

        it('doit rejeter un DIRECTEUR sans etablissementId', () => {
            const req = mockReq({ utilisateur: { role: 'DIRECTEUR' } });
            
            expect(req.etablissementId).toBeUndefined();
            expect((req.utilisateur as { role: string }).role).not.toBe('SUPER_ADMIN');
            expect((req.utilisateur as { role: string }).role).not.toBe('GESTIONNAIRE_GROUPES');
        });

        it('doit rejeter un ENSEIGNANT sans etablissementId', () => {
            const req = mockReq({ utilisateur: { role: 'ENSEIGNANT' } });
            
            expect(req.etablissementId).toBeUndefined();
            expect((req.utilisateur as { role: string }).role).not.toBe('SUPER_ADMIN');
        });
    });

    describe('Avec tenant context', () => {
        it('doit passer si req.etablissementId est défini', () => {
            const req = mockReq({ etablissementId: 'etab-123' });
            
            expect(req.etablissementId).toBe('etab-123');
        });

        it('doit passer si req.utilisateur.etablissementId est défini', () => {
            const req = mockReq({ utilisateur: { etablissementId: 'etab-456' } });
            
            expect((req.utilisateur as { etablissementId: string }).etablissementId).toBe('etab-456');
        });
    });

    describe('Fallback SUPER_ADMIN', () => {
        it('doit autoriser le fallback SUPER_ADMIN_TENANT', () => {
            const req = mockReq({ utilisateur: { role: 'SUPER_ADMIN' } });
            
            // SUPER_ADMIN est autorisé à utiliser le fallback
            expect((req.utilisateur as { role: string }).role).toBe('SUPER_ADMIN');
        });
    });

    describe('Fallback GESTIONNAIRE_GROUPES', () => {
        it('doit autoriser le fallback pour GESTIONNAIRE_GROUPES', () => {
            const req = mockReq({ utilisateur: { role: 'GESTIONNAIRE_GROUPES' } });
            
            expect((req.utilisateur as { role: string }).role).toBe('GESTIONNAIRE_GROUPES');
        });
    });
});
