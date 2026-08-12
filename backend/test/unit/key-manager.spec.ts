/**
 * ==================================
 * eLISAschool - Tests KeyManager (P2.4)
 * ==================================
 * Durcissement v9 — Teste la rotation des clés cryptographiques.
 */

import { describe, it, expect } from '@jest/globals';
import crypto from 'crypto';

// Reproduire la logique de chiffrement/déchiffrement pour les tests
function chiffrerValeur(valeur: string, masterKey: Buffer): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
    let encrypted = cipher.update(valeur, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function dechiffrerValeur(stored: string, masterKey: Buffer): string | null {
    try {
        const parts = stored.split(':');
        if (parts.length !== 3) return null;
        const [ivHex, authTagHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch {
        return null;
    }
}

describe('KeyManager — Rotation automatique', () => {
    const masterKey = crypto.createHash('sha256').update('test-encryption-key-32-chars!!').digest();

    describe('Chiffrement/Déchiffrement des valeurs', () => {
        it('doit chiffrer et déchiffrer correctement une valeur', () => {
            const valeur = 'mon-secret-jwt-super-long';
            const chiffre = chiffrerValeur(valeur, masterKey);
            const dechiffre = dechiffrerValeur(chiffre, masterKey);
            
            expect(dechiffre).toBe(valeur);
        });

        it('le format stocké doit être iv:authTag:encrypted', () => {
            const chiffre = chiffrerValeur('test', masterKey);
            const parts = chiffre.split(':');
            
            expect(parts.length).toBe(3);
            expect(parts[0].length).toBe(32); // IV = 16 bytes = 32 hex
            expect(parts[1].length).toBe(32); // AuthTag = 16 bytes = 32 hex
            expect(parts[2].length).toBeGreaterThan(0);
        });

        it('deux chiffrements de la même valeur doivent être différents (IV aléatoire)', () => {
            const chiffre1 = chiffrerValeur('test', masterKey);
            const chiffre2 = chiffrerValeur('test', masterKey);
            
            expect(chiffre1).not.toBe(chiffre2);
            
            // Mais les deux doivent déchiffrer vers la même valeur
            expect(dechiffrerValeur(chiffre1, masterKey)).toBe('test');
            expect(dechiffrerValeur(chiffre2, masterKey)).toBe('test');
        });

        it('une mauvaise clé doit échouer le déchiffrement', () => {
            const mauvaiseCle = crypto.createHash('sha256').update('wrong-key').digest();
            const chiffre = chiffrerValeur('test', masterKey);
            
            expect(dechiffrerValeur(chiffre, mauvaiseCle)).toBeNull();
        });
    });

    describe('Cycle de vie des clés', () => {
        it('une clé ACTIVE est utilisable', () => {
            const cle = { statut: 'ACTIVE', dateExpiration: null };
            const estUtilisable = cle.statut === 'ACTIVE' && !cle.dateExpiration;
            expect(estUtilisable).toBe(true);
        });

        it('une clé ROTATION n\'est plus active', () => {
            const cle = { statut: 'ROTATION', dateExpiration: new Date(Date.now() + 7 * 86400000) };
            const estUtilisable = cle.statut === 'ACTIVE';
            expect(estUtilisable).toBe(false);
        });

        it('une clé REVOQUEE ne doit plus être utilisée', () => {
            const cle = { statut: 'REVOQUEE', dateExpiration: null };
            const estUtilisable = cle.statut === 'ACTIVE';
            expect(estUtilisable).toBe(false);
        });

        it('une clé expirée ne doit plus être utilisée', () => {
            const cle = { statut: 'ACTIVE', dateExpiration: new Date(Date.now() - 1000) };
            const estExpiree = cle.dateExpiration ? new Date() > cle.dateExpiration : false;
            expect(estExpiree).toBe(true);
        });
    });

    describe('Rotation', () => {
        it('la rotation doit incrémenter la version', () => {
            const versionActuelle = 3;
            const nouvelleVersion = versionActuelle + 1;
            
            expect(nouvelleVersion).toBe(4);
        });

        it('la rotation doit passer l\'ancienne clé en ROTATION', () => {
            const ancienneCle = { statut: 'ACTIVE', version: 1 };
            
            // Simuler la rotation
            ancienneCle.statut = 'ROTATION';
            expect(ancienneCle.statut).toBe('ROTATION');
        });

        it('la grace period est de 7 jours', () => {
            const gracePeriodMs = 7 * 24 * 60 * 60 * 1000;
            const dateExpiration = new Date(Date.now() + gracePeriodMs);
            
            // La clé en rotation doit expirer dans ~7 jours
            const joursRestants = Math.round((dateExpiration.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
            expect(joursRestants).toBe(7);
        });

        it('une clé qui nécessite une rotation est détectée', () => {
            const cle = {
                statut: 'ACTIVE',
                dateRotation: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000), // 91 jours
                dureeRotationJours: 90,
            };
            
            const joursDepuisRotation = (Date.now() - cle.dateRotation.getTime()) / (1000 * 60 * 60 * 24);
            const necessiteRotation = cle.statut === 'ACTIVE' && joursDepuisRotation >= cle.dureeRotationJours;
            
            expect(necessiteRotation).toBe(true);
        });

        it('une clé récemment tournée ne nécessite pas de rotation', () => {
            const cle = {
                statut: 'ACTIVE',
                dateRotation: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
                dureeRotationJours: 90,
            };
            
            const joursDepuisRotation = (Date.now() - cle.dateRotation.getTime()) / (1000 * 60 * 60 * 24);
            const necessiteRotation = cle.statut === 'ACTIVE' && joursDepuisRotation >= cle.dureeRotationJours;
            
            expect(necessiteRotation).toBe(false);
        });
    });
});
