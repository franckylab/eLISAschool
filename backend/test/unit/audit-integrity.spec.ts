/**
 * ==================================
 * eLISAschool - Tests Audit Log Integrity (P1.5)
 * ==================================
 * Durcissement v9 — Teste la chaîne HMAC-SHA256 des audit logs.
 * Vérifie que toute modification d'un log est détectée.
 */

import { describe, it, expect } from '@jest/globals';
import crypto from 'crypto';

// Reproduire la logique de calcul de hash pour les tests
function calculerHash(payload: string, hashPrecedent: string | null, hmacKey: string): string {
    const data = (hashPrecedent || 'GENESIS') + ':' + payload;
    return crypto.createHmac('sha256', hmacKey).update(data).digest('hex');
}

describe('Audit Log Integrity — Chaîne HMAC', () => {
    const hmacKey = 'test-hmac-key-32-chars-minimum';

    describe('Calcul de hash', () => {
        it('le premier log doit utiliser GENESIS comme hash précédent', () => {
            const hash = calculerHash('{"action":"LOGIN"}', null, hmacKey);
            
            expect(hash).toBeDefined();
            expect(hash.length).toBe(64); // SHA-256 = 64 hex chars
        });

        it('le deuxième log doit utiliser le hash du premier', () => {
            const hash1 = calculerHash('{"action":"LOGIN"}', null, hmacKey);
            const hash2 = calculerHash('{"action":"USER_CREATE"}', hash1, hmacKey);
            
            expect(hash2).toBeDefined();
            expect(hash2).not.toBe(hash1);
            expect(hash2.length).toBe(64);
        });

        it('deux payloads différents doivent produire des hash différents', () => {
            const hash1 = calculerHash('{"action":"LOGIN"}', null, hmacKey);
            const hash2 = calculerHash('{"action":"LOGOUT"}', null, hmacKey);
            
            expect(hash1).not.toBe(hash2);
        });
    });

    describe('Détection de falsification', () => {
        it('modifier un log doit invalider toute la chaîne suivante', () => {
            // Construire une chaîne de 3 logs
            const hash1 = calculerHash('{"action":"LOGIN"}', null, hmacKey);
            const hash2 = calculerHash('{"action":"USER_CREATE"}', hash1, hmacKey);
            const hash3 = calculerHash('{"action":"NOTE_CREATE"}', hash2, hmacKey);

            // Vérifier la chaîne
            expect(calculerHash('{"action":"LOGIN"}', null, hmacKey)).toBe(hash1);
            expect(calculerHash('{"action":"USER_CREATE"}', hash1, hmacKey)).toBe(hash2);
            expect(calculerHash('{"action":"NOTE_CREATE"}', hash2, hmacKey)).toBe(hash3);

            // Falsifier le premier log
            const hash1Falsifie = calculerHash('{"action":"LOGIN_FAKE"}', null, hmacKey);
            
            // Le hash1 falsifié est différent de l'original
            expect(hash1Falsifie).not.toBe(hash1);
            
            // Le hash2 calculé avec le hash falsifié est différent
            const hash2AvecFalsification = calculerHash('{"action":"USER_CREATE"}', hash1Falsifie, hmacKey);
            expect(hash2AvecFalsification).not.toBe(hash2);
        });

        it('modifier le payload d\'un log doit être détecté', () => {
            const originalPayload = '{"action":"LOGIN","userId":"user-1"}';
            const hashOriginal = calculerHash(originalPayload, null, hmacKey);

            const payloadModifie = '{"action":"LOGIN","userId":"user-2"}';
            const hashModifie = calculerHash(payloadModifie, null, hmacKey);

            expect(hashOriginal).not.toBe(hashModifie);
        });

        it('utiliser une clé HMAC différente doit invalider la chaîne', () => {
            const hash1 = calculerHash('{"action":"LOGIN"}', null, hmacKey);
            const hash1AutreCle = calculerHash('{"action":"LOGIN"}', null, 'autre-cle-hmac');

            expect(hash1).not.toBe(hash1AutreCle);
        });
    });

    describe('Vérification d\'intégrité', () => {
        it('une chaîne valide doit passer la vérification', () => {
            const logs = [
                { id: '1', action: 'LOGIN', integriteHash: '' },
                { id: '2', action: 'USER_CREATE', integriteHash: '' },
                { id: '3', action: 'NOTE_CREATE', integriteHash: '' },
            ];

            // Calculer les hashes en chaîne
            let hashPrecedent: string | null = null;
            for (const log of logs) {
                log.integriteHash = calculerHash(log.action, hashPrecedent, hmacKey);
                hashPrecedent = log.integriteHash;
            }

            // Vérifier la chaîne
            hashPrecedent = null;
            let valide = true;
            for (const log of logs) {
                const expected = calculerHash(log.action, hashPrecedent, hmacKey);
                if (expected !== log.integriteHash) {
                    valide = false;
                    break;
                }
                hashPrecedent = log.integriteHash;
            }

            expect(valide).toBe(true);
        });

        it('une chaîne avec un log modifié doit échouer', () => {
            const logs = [
                { id: '1', action: 'LOGIN', integriteHash: '' },
                { id: '2', action: 'USER_CREATE', integriteHash: '' },
                { id: '3', action: 'NOTE_CREATE', integriteHash: '' },
            ];

            // Construire la chaîne
            let hashPrecedent: string | null = null;
            for (const log of logs) {
                log.integriteHash = calculerHash(log.action, hashPrecedent, hmacKey);
                hashPrecedent = log.integriteHash;
            }

            // Falsifier le deuxième log
            logs[1].action = 'USER_DELETE';

            // Vérifier la chaîne
            hashPrecedent = null;
            let valide = true;
            for (const log of logs) {
                const expected = calculerHash(log.action, hashPrecedent, hmacKey);
                if (expected !== log.integriteHash) {
                    valide = false;
                    break;
                }
                hashPrecedent = log.integriteHash;
            }

            expect(valide).toBe(false);
        });
    });
});
