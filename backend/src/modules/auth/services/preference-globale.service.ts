/**
 * ==================================
 * eLISAschool - Service Préférences Globales
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { PreferenceGlobale } from '../entities/preference-globale.entity';
import { CategoriePreference } from '@modules/auth/entities/preference-utilisateur.entity';
import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';
import { AppError } from '@common/filters/error.filter';

// Préférences par défaut pour un établissement
export const DEFAULT_PREFERENCES_GLOBALES: Array<{
    cle: string;
    valeur: string;
    typeValeur: 'string' | 'number' | 'boolean' | 'json';
    categorie: CategoriePreference;
    libelle: string;
    description: string;
    estModifiableParUtilisateur: boolean;
    ordre: number;
}> = [
    // Affichage
    {
        cle: 'theme',
        valeur: 'default',
        typeValeur: 'string',
        categorie: CategoriePreference.AFFICHAGE,
        libelle: 'Thème par défaut',
        description: 'Thème appliqué à tous les utilisateurs',
        estModifiableParUtilisateur: true,
        ordre: 1,
    },
    {
        cle: 'langue',
        valeur: 'fr',
        typeValeur: 'string',
        categorie: CategoriePreference.LANGUE,
        libelle: 'Langue par défaut',
        description: 'Langue de l\'interface',
        estModifiableParUtilisateur: true,
        ordre: 2,
    },
    // Notifications
    {
        cle: 'notifications.email',
        valeur: 'true',
        typeValeur: 'boolean',
        categorie: CategoriePreference.NOTIFICATIONS,
        libelle: 'Notifications email activées',
        description: 'Activer les notifications par email par défaut',
        estModifiableParUtilisateur: true,
        ordre: 10,
    },
    {
        cle: 'notifications.sms',
        valeur: 'false',
        typeValeur: 'boolean',
        categorie: CategoriePreference.NOTIFICATIONS,
        libelle: 'Notifications SMS activées',
        description: 'Activer les notifications SMS par défaut',
        estModifiableParUtilisateur: true,
        ordre: 11,
    },
    // Sécurité
    {
        cle: 'security.mfa_enabled',
        valeur: 'false',
        typeValeur: 'boolean',
        categorie: CategoriePreference.SECURITE,
        libelle: 'Authentification multi-facteurs',
        description: 'Activer MFA pour tous les utilisateurs',
        estModifiableParUtilisateur: false,
        ordre: 20,
    },
    {
        cle: 'security.session_timeout',
        valeur: '30',
        typeValeur: 'number',
        categorie: CategoriePreference.SECURITE,
        libelle: 'Timeout session (minutes)',
        description: 'Durée d\'inactivité avant déconnexion',
        estModifiableParUtilisateur: false,
        ordre: 21,
    },
];

export class PreferenceGlobaleService {
    private repo: Repository<PreferenceGlobale>;
    private cache = new Map<string, { valeur: string; timestamp: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor() {
        this.repo = AppDataSource.getRepository(PreferenceGlobale);
    }

    /**
     * Initialiser les préférences par défaut pour un établissement
     */
    async initialiserDefaults(etablissementId: string, utilisateurId?: string): Promise<void> {
        for (const def of DEFAULT_PREFERENCES_GLOBALES) {
            const existante = await this.repo.findOne({
                where: { etablissementId, cle: def.cle },
            });

            if (!existante) {
                const pref = this.repo.create({
                    ...def,
                    etablissementId,
                    modifiePar: utilisateurId,
                });
                await this.repo.save(pref);
            }
        }

        logger.info(`[PrefGlobales] Defaults initialisés pour établissement ${etablissementId}`);
    }

    /**
     * Obtenir une préférence globale
     */
    async getPreference(
        cle: string,
        etablissementId: string
    ): Promise<PreferenceGlobale | null> {
        const cacheKey = `pref_globale:${etablissementId}:${cle}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return this.repo.findOne({
                where: { etablissementId, cle },
            });
        }

        const preference = await this.repo.findOne({
            where: { etablissementId, cle },
        });

        if (preference) {
            this.cache.set(cacheKey, {
                valeur: preference.valeur,
                timestamp: Date.now(),
            });
        }

        return preference;
    }

    /**
     * Obtenir toutes les préférences d'un établissement
     */
    async getToutesPreferences(
        etablissementId: string,
        categorie?: CategoriePreference
    ): Promise<PreferenceGlobale[]> {
        const where: any = { etablissementId };
        if (categorie) {
            where.categorie = categorie;
        }

        return this.repo.find({
            where,
            order: { categorie: 'ASC', ordre: 'ASC' },
        });
    }

    /**
     * Définir ou mettre à jour une préférence
     */
    async setPreference(
        cle: string,
        valeur: string,
        etablissementId: string,
        utilisateurId?: string
    ): Promise<PreferenceGlobale> {
        let preference = await this.repo.findOne({
            where: { etablissementId, cle },
        });

        if (preference) {
            preference.valeur = valeur;
            preference.modifiePar = utilisateurId || preference.modifiePar;
        } else {
            const def = DEFAULT_PREFERENCES_GLOBALES.find(d => d.cle === cle);
            if (!def) {
                throw new AppError(`Préférence inconnue: ${cle}`, 400);
            }

            preference = this.repo.create({
                cle,
                valeur,
                etablissementId,
                typeValeur: def.typeValeur,
                categorie: def.categorie,
                libelle: def.libelle,
                description: def.description,
                estModifiableParUtilisateur: def.estModifiableParUtilisateur,
                ordre: def.ordre,
                modifiePar: utilisateurId,
            });
        }

        const saved = await this.repo.save(preference);

        // Invalider cache
        this.invalidateCache(etablissementId, cle);

        // Invalider cache Redis
        await redisService.del(`pref_globale:${etablissementId}:${cle}`);

        logger.info(`[PrefGlobales] ${preference.libelle} mise à jour`, {
            etablissementId,
            cle,
            utilisateurId,
        });

        return saved;
    }

    /**
     * Réinitialiser une préférence à sa valeur par défaut
     */
    async resetPreference(
        cle: string,
        etablissementId: string,
        utilisateurId?: string
    ): Promise<PreferenceGlobale> {
        const def = DEFAULT_PREFERENCES_GLOBALES.find(d => d.cle === cle);
        if (!def) {
            throw new AppError(`Préférence inconnue: ${cle}`, 400);
        }

        return this.setPreference(cle, def.valeur, etablissementId, utilisateurId);
    }

    /**
     * Réinitialiser toutes les préférences d'une catégorie
     */
    async resetCategorie(
        categorie: CategoriePreference,
        etablissementId: string,
        utilisateurId?: string
    ): Promise<number> {
        const prefs = await this.getToutesPreferences(etablissementId, categorie);
        let count = 0;

        for (const pref of prefs) {
            await this.resetPreference(pref.cle, etablissementId, utilisateurId);
            count++;
        }

        logger.info(`[PrefGlobales] ${count} préférences réinitialisées`, {
            etablissementId,
            categorie,
        });

        return count;
    }

    /**
     * Réinitialiser toutes les préférences de l'établissement
     */
    async resetAll(
        etablissementId: string,
        utilisateurId?: string
    ): Promise<number> {
        const prefs = await this.getToutesPreferences(etablissementId);
        let count = 0;

        for (const pref of prefs) {
            await this.resetPreference(pref.cle, etablissementId, utilisateurId);
            count++;
        }

        logger.info(`[PrefGlobales] Toutes les préférences réinitialisées`, {
            etablissementId,
            count,
        });

        return count;
    }

    /**
     * Obtenir la valeur effective d'une préférence pour un utilisateur
     * (préférence personnelle > préférence globale > défaut système)
     */
    async getValeurEffective(
        cle: string,
        etablissementId: string,
        preferenceUtilisateurService: any,
        utilisateurId: string
    ): Promise<string> {
        // 1. Préférence personnelle
        const prefPerso = await preferenceUtilisateurService.getPreference(
            utilisateurId,
            cle
        );
        if (prefPerso) {
            return prefPerso.valeur;
        }

        // 2. Préférence globale
        const prefGlobale = await this.getPreference(cle, etablissementId);
        if (prefGlobale) {
            return prefGlobale.valeur;
        }

        // 3. Valeur par défaut du système
        const def = DEFAULT_PREFERENCES_GLOBALES.find(d => d.cle === cle);
        return def?.valeur || '';
    }

    /**
     * Invalider le cache pour un établissement
     */
    private invalidateCache(etablissementId: string, cle?: string): void {
        if (cle) {
            const key = `pref_globale:${etablissementId}:${cle}`;
            this.cache.delete(key);
        } else {
            // Invalider tout le cache de l'établissement
            for (const key of this.cache.keys()) {
                if (key.includes(etablissementId)) {
                    this.cache.delete(key);
                }
            }
        }
    }

    /**
     * Statistiques des préférences globales
     */
    async getStatistiques(etablissementId: string): Promise<{
        total: number;
        parCategorie: Record<string, number>;
        modifiables: number;
        nonModifiables: number;
    }> {
        const prefs = await this.getToutesPreferences(etablissementId);

        const parCategorie: Record<string, number> = {};
        let modifiables = 0;
        let nonModifiables = 0;

        for (const pref of prefs) {
            parCategorie[pref.categorie] = (parCategorie[pref.categorie] || 0) + 1;
            if (pref.estModifiableParUtilisateur) {
                modifiables++;
            } else {
                nonModifiables++;
            }
        }

        return {
            total: prefs.length,
            parCategorie,
            modifiables,
            nonModifiables,
        };
    }

    /**
     * Exporter toutes les préférences (JSON)
     */
    async exporterPreferences(etablissementId: string): Promise<string> {
        const prefs = await this.getToutesPreferences(etablissementId);

        const exportData = {
            version: '1.0',
            dateExport: new Date().toISOString(),
            etablissementId,
            preferences: prefs.map(p => ({
                cle: p.cle,
                valeur: p.valeur,
                typeValeur: p.typeValeur,
                categorie: p.categorie,
                libelle: p.libelle,
                description: p.description,
                estModifiableParUtilisateur: p.estModifiableParUtilisateur,
                ordre: p.ordre,
            })),
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Importer des préférences depuis un JSON
     */
    async importerPreferences(
        jsonData: string,
        etablissementId: string,
        utilisateurId?: string,
        mode: 'merge' | 'replace' = 'merge'
    ): Promise<{ importe: number; erreur: string[] }> {
        try {
            const data = JSON.parse(jsonData);

            if (!data.preferences || !Array.isArray(data.preferences)) {
                throw new AppError('Format JSON invalide: tableau de préférences attendu', 400);
            }

            const erreurs: string[] = [];
            let importe = 0;

            // Si mode replace, supprimer toutes les préférences existantes
            if (mode === 'replace') {
                const prefsExistantes = await this.getToutesPreferences(etablissementId);
                await this.repo.remove(prefsExistantes);
                this.cache.clear();
            }

            // Importer chaque préférence
            for (const prefData of data.preferences) {
                try {
                    await this.setPreference(
                        prefData.cle,
                        prefData.valeur,
                        etablissementId,
                        utilisateurId
                    );
                    importe++;
                } catch (error: any) {
                    erreurs.push(`Erreur sur ${prefData.cle}: ${error.message}`);
                }
            }

            logger.info(`[PrefGlobales] Import terminé: ${importe} préférences, ${erreurs.length} erreurs`, {
                etablissementId,
                mode,
            });

            return { importe, erreur: erreurs };
        } catch (error: any) {
            throw new AppError(`Erreur d'import: ${error.message}`, 400);
        }
    }
}

export const preferenceGlobaleService = new PreferenceGlobaleService();
