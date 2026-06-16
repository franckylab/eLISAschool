/**
 * ==================================
 * eLISAschool - Service de Gestion de Blocage Authentification
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Système de blocage à deux niveaux professionnel :
 * - Niveau 1 : Blocage spécifique par identifiant (max 3 tentatives, 1 minute)
 * - Niveau 2 : Blocage général par machine (max 20 tentatives, 2 minutes)
 * 
 * Toutes les variables sont gérées côté backend
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TentativeConnexion, TypeBlocage } from '../entities';
import { getParamNumber } from '@modules/configuration/utils/config.helper';
import { logger } from '@common/utils/logger.util';
import * as crypto from 'crypto';

/**
 * Interface pour le statut de blocage complet
 */
export interface StatutBlocageComplet {
    bloqueSpecifique: boolean;
    bloqueGeneral: boolean;
    bloque: boolean;
    blocageSpecifique: {
        tentativesActuelles: number;
        tentativesRestantes: number;
        maxTentatives: number;
        bloqueJusqua: string | null;
        tempsRestantSecondes: number;
    };
    blocageGeneral: {
        tentativesActuelles: number;
        tentativesRestantes: number;
        maxTentatives: number;
        bloqueJusqua: string | null;
        tempsRestantSecondes: number;
    };
    typeBlocage: 'specifique' | 'general' | null;
}

/**
 * Service de gestion de blocage avec traçage par machine
 */
export class BlocageAuthService {
    private repo: Repository<TentativeConnexion>;

    // Cache pour les paramètres (TTL: 1 minute)
    private paramsCache: { data: any; timestamp: number } | null = null;
    private readonly PARAMS_TTL = 60000;

    constructor() {
        this.repo = AppDataSource.getRepository(TentativeConnexion);
    }

    /**
     * Récupère les paramètres de blocage depuis la configuration
     */
    private async getBlocageParams() {
        // Vérifier le cache
        if (this.paramsCache) {
            const age = Date.now() - this.paramsCache.timestamp;
            if (age < this.PARAMS_TTL) {
                return this.paramsCache.data;
            }
        }

        // Charger depuis ParametreSysteme
        const params = {
            // Niveau 1 : Blocage spécifique (identifiant)
            maxTentativesSpecifique: await getParamNumber('auth.max_tentatives_specifique', { defaultValue: 3 }),
            dureeBlocageSpecifique: await getParamNumber('auth.duree_blocage_specifique', { defaultValue: 1 }),

            // Niveau 2 : Blocage général (machine)
            maxTentativesGeneral: await getParamNumber('auth.max_tentatives_general', { defaultValue: 20 }),
            dureeBlocageGeneral: await getParamNumber('auth.duree_blocage_general', { defaultValue: 2 }),
        };

        // Mettre en cache
        this.paramsCache = { data: params, timestamp: Date.now() };

        return params;
    }

    /**
     * Génère une empreinte de machine à partir du user-agent et d'autres facteurs
     */
    genererEmpreinteMachine(userAgent: string, adresseIp: string): string {
        const donnees = `${userAgent}|${adresseIp}`;
        return crypto.createHash('sha256').update(donnees).digest('hex');
    }

    /**
     * Vérifie le statut de blocage complet (spécifique + général)
     */
    async verifierBlocage(
        identifiant: string,
        adresseIp: string,
        userAgent?: string
    ): Promise<StatutBlocageComplet> {
        const empreinteMachine = userAgent ? this.genererEmpreinteMachine(userAgent, adresseIp) : undefined;
        const params = await this.getBlocageParams();

        // Vérifier blocage spécifique (par identifiant)
        const blocageSpecifique = await this.repo.findOne({
            where: {
                identifiant,
                adresseIp,
                typeBlocage: TypeBlocage.SPECIFIQUE,
            },
        });

        // Vérifier blocage général (par machine)
        const blocageGeneral = await this.repo.findOne({
            where: {
                adresseIp,
                empreinteMachine: empreinteMachine || undefined,
                typeBlocage: TypeBlocage.GENERAL,
            },
        });

        // Nettoyer les blocages expirés
        const maintenant = new Date();

        let specifiqueBloque = false;
        let specifiqueTempsRestant = 0;
        let specifiqueTentatives = blocageSpecifique?.nombreTentatives || 0;

        if (blocageSpecifique && blocageSpecifique.bloqueJusqua) {
            if (blocageSpecifique.bloqueJusqua > maintenant) {
                specifiqueBloque = true;
                specifiqueTempsRestant = Math.ceil((blocageSpecifique.bloqueJusqua.getTime() - maintenant.getTime()) / 1000);
            } else {
                // Blocage expiré - nettoyer
                blocageSpecifique.reinitialiser();
                blocageSpecifique.nbDeblocagesAuto += 1;
                await this.repo.save(blocageSpecifique);
                specifiqueTentatives = 0;
            }
        }

        let generalBloque = false;
        let generalTempsRestant = 0;
        let generalTentatives = blocageGeneral?.nombreTentatives || 0;

        if (blocageGeneral && blocageGeneral.bloqueJusqua) {
            if (blocageGeneral.bloqueJusqua > maintenant) {
                generalBloque = true;
                generalTempsRestant = Math.ceil((blocageGeneral.bloqueJusqua.getTime() - maintenant.getTime()) / 1000);
            } else {
                // Blocage expiré - nettoyer
                blocageGeneral.reinitialiser();
                blocageGeneral.nbDeblocagesAuto += 1;
                await this.repo.save(blocageGeneral);
                generalTentatives = 0;
            }
        }

        const bloque = specifiqueBloque || generalBloque;
        const typeBlocage = specifiqueBloque ? 'specifique' : (generalBloque ? 'general' : null);

        return {
            bloqueSpecifique: specifiqueBloque,
            bloqueGeneral: generalBloque,
            bloque,
            blocageSpecifique: {
                tentativesActuelles: specifiqueTentatives,
                tentativesRestantes: Math.max(0, params.maxTentativesSpecifique - specifiqueTentatives),
                maxTentatives: params.maxTentativesSpecifique,
                bloqueJusqua: specifiqueBloque && blocageSpecifique?.bloqueJusqua ? blocageSpecifique.bloqueJusqua.toISOString() : null,
                tempsRestantSecondes: specifiqueTempsRestant,
            },
            blocageGeneral: {
                tentativesActuelles: generalTentatives,
                tentativesRestantes: Math.max(0, params.maxTentativesGeneral - generalTentatives),
                maxTentatives: params.maxTentativesGeneral,
                bloqueJusqua: generalBloque && blocageGeneral?.bloqueJusqua ? blocageGeneral.bloqueJusqua.toISOString() : null,
                tempsRestantSecondes: generalTempsRestant,
            },
            typeBlocage,
        };
    }

    /**
     * Enregistre une tentative échouée
     */
    async enregistrerEchec(
        identifiant: string,
        adresseIp: string,
        motif: string,
        userAgent?: string
    ): Promise<{ bloque: boolean; statut: StatutBlocageComplet }> {
        const empreinteMachine = userAgent ? this.genererEmpreinteMachine(userAgent, adresseIp) : undefined;
        const params = await this.getBlocageParams();
        const maintenant = new Date();

        let bloqueSpecifique = false;
        let bloqueGeneral = false;

        // === NIVEAU 1 : Blocage spécifique par identifiant ===
        let tentativeSpecifique = await this.repo.findOne({
            where: {
                identifiant,
                adresseIp,
                typeBlocage: TypeBlocage.SPECIFIQUE,
            },
        });

        if (!tentativeSpecifique) {
            tentativeSpecifique = this.repo.create({
                identifiant,
                adresseIp,
                empreinteMachine,
                typeBlocage: TypeBlocage.SPECIFIQUE,
                nombreTentatives: 0,
                derniereTentative: maintenant,
            });
        }

        // Incrémenter et vérifier blocage
        bloqueSpecifique = tentativeSpecifique.incrementer(
            params.maxTentativesSpecifique,
            params.dureeBlocageSpecifique,
            `Échec authentification identifiant "${identifiant}": ${motif}`
        );

        await this.repo.save(tentativeSpecifique);

        if (bloqueSpecifique) {
            logger.warn(
                `[Blocage N1] Identifiant "${identifiant}" bloqué depuis IP ${adresseIp} ` +
                `(${tentativeSpecifique.nombreTentatives} tentatives, ${params.dureeBlocageSpecifique} min)`
            );
        }

        // === NIVEAU 2 : Blocage général par machine ===
        let tentativeGeneral = await this.repo.findOne({
            where: {
                adresseIp,
                empreinteMachine: empreinteMachine || undefined,
                typeBlocage: TypeBlocage.GENERAL,
            },
        });

        if (!tentativeGeneral) {
            tentativeGeneral = this.repo.create({
                identifiant: '*', // Tous identifiants
                adresseIp,
                empreinteMachine,
                typeBlocage: TypeBlocage.GENERAL,
                nombreTentatives: 0,
                derniereTentative: maintenant,
            });
        }

        // Incrémenter et vérifier blocage
        bloqueGeneral = tentativeGeneral.incrementer(
            params.maxTentativesGeneral,
            params.dureeBlocageGeneral,
            `Blocage général machine ${adresseIp}: ${motif}`
        );

        await this.repo.save(tentativeGeneral);

        if (bloqueGeneral) {
            logger.warn(
                `[Blocage N2] Machine ${adresseIp} bloquée globalement ` +
                `(${tentativeGeneral.nombreTentatives} tentatives, ${params.dureeBlocageGeneral} min)`
            );
        }

        // Retourner le statut complet
        const statut = await this.verifierBlocage(identifiant, adresseIp, userAgent);

        return {
            bloque: bloqueSpecifique || bloqueGeneral,
            statut,
        };
    }

    /**
     * Réinitialise les tentatives après connexion réussie
     */
    async reinitialiserApresSucces(
        identifiant: string,
        adresseIp: string,
        userAgent?: string
    ): Promise<void> {
        const empreinteMachine = userAgent ? this.genererEmpreinteMachine(userAgent, adresseIp) : undefined;

        // Réinitialiser blocage spécifique
        const tentativeSpecifique = await this.repo.findOne({
            where: {
                identifiant,
                adresseIp,
                typeBlocage: TypeBlocage.SPECIFIQUE,
            },
        });

        if (tentativeSpecifique) {
            tentativeSpecifique.reinitialiser();
            await this.repo.save(tentativeSpecifique);
        }

        // Réinitialiser blocage général (seulement si pas d'autres échecs récents)
        const tentativeGeneral = await this.repo.findOne({
            where: {
                adresseIp,
                empreinteMachine: empreinteMachine || undefined,
                typeBlocage: TypeBlocage.GENERAL,
            },
        });

        if (tentativeGeneral) {
            // Ne réinitialiser que si moins de 50% du max
            const params = await this.getBlocageParams();
            if (tentativeGeneral.nombreTentatives < params.maxTentativesGeneral * 0.5) {
                tentativeGeneral.reinitialiser();
                await this.repo.save(tentativeGeneral);
                logger.info(`[Blocage] Tentatives générales réinitialisées pour IP ${adresseIp}`);
            }
        }
    }

    /**
     * Endpoint pour le polling frontend - vérifie le statut sans incrémenter
     */
    async getStatutBlocage(identifiant: string, adresseIp: string, userAgent?: string): Promise<StatutBlocageComplet> {
        return this.verifierBlocage(identifiant, adresseIp, userAgent);
    }

    /**
     * Nettoie les anciennes tentatives (plus de 24h)
     * À appeler via cron job
     */
    async nettoyerAnciennesTentatives(): Promise<number> {
        const hier = new Date();
        hier.setHours(hier.getHours() - 24);

        const result = await this.repo
            .createQueryBuilder()
            .delete()
            .from(TentativeConnexion)
            .where('derniereTentative < :hier', { hier })
            .andWhere('bloqueJusqua IS NULL OR bloqueJusqua < :maintenant', { maintenant: new Date() })
            .execute();

        const nbSupprimes = result.affected || 0;

        if (nbSupprimes > 0) {
            logger.info(`[Blocage] Nettoyage: ${nbSupprimes} anciennes tentatives supprimées`);
        }

        return nbSupprimes;
    }

    /**
     * Débloque manuellement un identifiant (pour admin)
     */
    async debloquerIdentifiant(identifiant: string, adresseIp?: string): Promise<void> {
        const where: any = {
            identifiant,
            typeBlocage: TypeBlocage.SPECIFIQUE,
        };

        if (adresseIp) {
            where.adresseIp = adresseIp;
        }

        const tentatives = await this.repo.find({ where });

        for (const tentative of tentatives) {
            tentative.reinitialiser();
            await this.repo.save(tentative);
        }

        logger.info(`[Blocage] Déblocage manuel de l'identifiant "${identifiant}"`);
    }

    /**
     * Débloque manuellement une machine (pour admin)
     */
    async debloquerMachine(adresseIp: string, empreinteMachine?: string): Promise<void> {
        const where: any = {
            adresseIp,
            typeBlocage: TypeBlocage.GENERAL,
        };

        if (empreinteMachine) {
            where.empreinteMachine = empreinteMachine;
        }

        const tentatives = await this.repo.find({ where });

        for (const tentative of tentatives) {
            tentative.reinitialiser();
            await this.repo.save(tentative);
        }

        logger.info(`[Blocage] Déblocage manuel de la machine ${adresseIp}`);
    }
}

export const blocageAuthService = new BlocageAuthService();
