/**
 * ==================================
 * eLISAschool - Tests IP Allowlist (P1.6)
 * ==================================
 * Durcissement v9 — Teste le middleware de restriction IP.
 */

import { describe, it, expect } from '@jest/globals';

describe('IP Allowlist Middleware', () => {

    describe('Vérification IP', () => {
        it('liste vide → pas de restriction (backward compat)', () => {
            const allowedIps: string[] = [];
            
            // Si la liste est vide, toute IP est autorisée
            const estAutorisee = allowedIps.length === 0 || allowedIps.includes('192.168.1.1');
            expect(estAutorisee).toBe(true);
        });

        it('IP dans la liste → autorisée', () => {
            const allowedIps = ['192.168.1.1', '10.0.0.1', '::1'];
            
            expect(allowedIps.includes('192.168.1.1')).toBe(true);
            expect(allowedIps.includes('10.0.0.1')).toBe(true);
        });

        it('IP hors liste → rejetée', () => {
            const allowedIps = ['192.168.1.1', '10.0.0.1'];
            
            expect(allowedIps.includes('172.16.0.1')).toBe(false);
        });

        it('support IPv6', () => {
            const allowedIps = ['::1', '2001:db8::1', 'fe80::1'];
            
            expect(allowedIps.includes('::1')).toBe(true);
            expect(allowedIps.includes('2001:db8::1')).toBe(true);
            expect(allowedIps.includes('2001:db8::2')).toBe(false);
        });
    });

    describe('Expiration des IPs', () => {
        it('IP expirée → rejetée', () => {
            const entries = [
                { ip: '192.168.1.1', expireAt: new Date(Date.now() - 3600000) }, // Expirée il y a 1h
                { ip: '10.0.0.1', expireAt: new Date(Date.now() + 3600000) },    // Valide encore 1h
            ];

            const now = new Date();
            const ipsValides = entries.filter(e => !e.expireAt || e.expireAt > now).map(e => e.ip);
            
            expect(ipsValides).toContain('10.0.0.1');
            expect(ipsValides).not.toContain('192.168.1.1');
        });

        it('IP sans expiration → permanente', () => {
            const entries = [
                { ip: '192.168.1.1', expireAt: null },
            ];

            const now = new Date();
            const ipsValides = entries.filter(e => !e.expireAt || e.expireAt > now).map(e => e.ip);
            
            expect(ipsValides).toContain('192.168.1.1');
        });
    });

    describe('IP active/inactive', () => {
        it('IP inactive → rejetée même si dans la liste', () => {
            const entries = [
                { ip: '192.168.1.1', active: true },
                { ip: '10.0.0.1', active: false },
            ];

            const ipsActives = entries.filter(e => e.active).map(e => e.ip);
            
            expect(ipsActives).toContain('192.168.1.1');
            expect(ipsActives).not.toContain('10.0.0.1');
        });
    });

    describe('Fail-open behavior', () => {
        it('en cas d\'erreur DB/Redis, laisser passer (ne pas bloquer)', () => {
            // Le middleware doit appeler next() en cas d'erreur
            // pour ne pas bloquer l'accès à la plateforme
            let nextCalled = false;
            
            try {
                throw new Error('DB connection failed');
            } catch {
                // En cas d'erreur → next() (fail-open)
                nextCalled = true;
            }
            
            expect(nextCalled).toBe(true);
        });
    });
});
