/**
 * ==================================
 * eLISAschool - Service Historique Configuration
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Suivi, sauvegarde et restauration des modifications de configuration
 */

import { Repository } from 'typeorm';
import { Request } from 'express';
import { AppDataSource } from '@database/data-source';
import { HistoriqueConfiguration, ActionConfiguration, CibleConfiguration } from '../entities/historique-configuration.entity';
import { ConfigurationApp } from '../entities/configuration-app.entity';
import { ParametreSysteme } from '../entities/parametre-systeme.entity';
import { logger } from '@common/utils/logger.util';
import { getClientIP } from '@common/utils/client-ip.util';
import { AppError } from '@common/filters/error.filter';

/**
 * Options pour enregistrer une action dans l'historique
 */
export interface LogConfigActionOptions {
    utilisateurId?: string;
    action: ActionConfiguration;
    cible: CibleConfiguration;
    cibleId?: string;
    cibleNom?: string;
    description?: string;
    ancienneValeur?: any;
    nouvelleValeur?: any;
    restaurable?: boolean;
    req?: Request;
}

/**
 * Service de gestion de l'historique des configurations
 */
export class ConfigurationHistoryService {
    private historiqueRepo: Repository<HistoriqueConfiguration>;
    private configAppRepo: Repository<ConfigurationApp>;
    private parametreRepo: Repository<ParametreSysteme>;

    constructor() {
        this.historiqueRepo = AppDataSource.getRepository(HistoriqueConfiguration);
        this.configAppRepo = AppDataSource.getRepository(ConfigurationApp);
        this.parametreRepo = AppDataSource.getRepository(ParametreSysteme);
    }

    /**
     * Enregistre une action dans l'historique
     */
    async logAction(options: LogConfigActionOptions): Promise<HistoriqueConfiguration> {
        const entry = this.historiqueRepo.create({
            utilisateurId: options.utilisateurId,
            action: options.action,
            cible: options.cible,
            cibleId: options.cibleId,
            cibleNom: options.cibleNom,
            description: options.description,
            ancienneValeur: options.ancienneValeur,
            nouvelleValeur: options.nouvelleValeur,
            restaurable: options.restaurable ?? (options.action === ActionConfiguration.UPDATE),
            ipAddress: options.req ? getClientIP(options.req) : undefined,
        });

        await this.historiqueRepo.save(entry);
        return entry;
    }

    /**
     * Récupère l'historique des modifications
     */
    async getHistorique(options: {
        cible?: CibleConfiguration;
        cibleId?: string;
        action?: ActionConfiguration;
        utilisateurId?: string;
        dateDebut?: Date;
        dateFin?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{ items: HistoriqueConfiguration[]; total: number }> {
        const qb = this.historiqueRepo.createQueryBuilder('h')
            .orderBy('h.createdAt', 'DESC');

        if (options.cible) qb.andWhere('h.cible = :cible', { cible: options.cible });
        if (options.cibleId) qb.andWhere('h.cibleId = :cibleId', { cibleId: options.cibleId });
        if (options.action) qb.andWhere('h.action = :action', { action: options.action });
        if (options.utilisateurId) qb.andWhere('h.utilisateurId = :utilisateurId', { utilisateurId: options.utilisateurId });
        if (options.dateDebut) qb.andWhere('h.createdAt >= :dateDebut', { dateDebut: options.dateDebut });
        if (options.dateFin) qb.andWhere('h.createdAt <= :dateFin', { dateFin: options.dateFin });

        const [items, total] = await qb
            .skip(options.offset || 0)
            .take(options.limit || 50)
            .getManyAndCount();

        return { items, total };
    }

    /**
     * Restaure une configuration depuis l'historique
     */
    async restaurer(historiqueId: string, utilisateurId?: string): Promise<void> {
        const entry = await this.historiqueRepo.findOne({ where: { id: historiqueId } });
        if (!entry) {
            throw new AppError('Entrée historique non trouvée', 404, 'HISTORY_NOT_FOUND');
        }

        if (!entry.restaurable || !entry.ancienneValeur) {
            throw new AppError('Cette entrée ne peut pas être restaurée', 400, 'NOT_RESTORABLE');
        }

        // Restaurer selon le type de cible
        switch (entry.cible) {
            case CibleConfiguration.APP:
                await this.restaurerConfigApp(entry.ancienneValeur, utilisateurId);
                break;
            case CibleConfiguration.PARAMETRE:
                await this.restaurerParametre(entry.cibleNom || '', entry.ancienneValeur, utilisateurId);
                break;
            default:
                throw new AppError('Type de restauration non supporté', 400, 'UNSUPPORTED_RESTORE');
        }

        logger.info(`Configuration restaurée depuis historique ${historiqueId}`);
    }

    /**
     * Restaure la configuration app
     */
    private async restaurerConfigApp(ancienneValeur: any, utilisateurId?: string): Promise<void> {
        const config = await this.configAppRepo.findOne({ where: {} });
        if (!config) return;

        const valeurActuelle = { ...config };
        Object.assign(config, ancienneValeur);
        await this.configAppRepo.save(config);

        await this.logAction({
            utilisateurId,
            action: ActionConfiguration.RESTORE,
            cible: CibleConfiguration.APP,
            description: 'Configuration app restaurée',
            ancienneValeur: valeurActuelle,
            nouvelleValeur: ancienneValeur,
        });
    }

    /**
     * Restaure un paramètre
     */
    private async restaurerParametre(cle: string, ancienneValeur: any, utilisateurId?: string): Promise<void> {
        const param = await this.parametreRepo.findOne({ where: { cle } });
        if (!param) return;

        const valeurActuelle = param.valeur;
        param.valeur = JSON.stringify(ancienneValeur);
        await this.parametreRepo.save(param);

        await this.logAction({
            utilisateurId,
            action: ActionConfiguration.RESTORE,
            cible: CibleConfiguration.PARAMETRE,
            cibleNom: cle,
            description: `Paramètre ${cle} restauré`,
            ancienneValeur: valeurActuelle,
            nouvelleValeur: ancienneValeur,
        });
    }

    /**
     * Crée un point de sauvegarde complet
     */
    async creerSauvegarde(utilisateurId?: string): Promise<{ id: string; timestamp: Date }> {
        const config = await this.configAppRepo.findOne({ where: {} });
        const parametres = await this.parametreRepo.find();

        const sauvegarde = {
            app: config,
            parametres: parametres.map(p => ({ cle: p.cle, valeur: p.valeur })),
        };

        const entry = await this.logAction({
            utilisateurId,
            action: ActionConfiguration.EXPORT,
            cible: CibleConfiguration.APP,
            description: 'Sauvegarde complète de la configuration',
            nouvelleValeur: sauvegarde,
            restaurable: true,
        });

        logger.info('Sauvegarde de configuration créée');
        return { id: entry.id, timestamp: entry.createdAt };
    }

    /**
     * Restaure depuis une sauvegarde
     */
    async restaurerSauvegarde(sauvegardeId: string, utilisateurId?: string): Promise<void> {
        const entry = await this.historiqueRepo.findOne({ where: { id: sauvegardeId } });
        if (!entry || entry.action !== ActionConfiguration.EXPORT) {
            throw new AppError('Sauvegarde non trouvée', 404, 'BACKUP_NOT_FOUND');
        }

        const sauvegarde = entry.nouvelleValeur;
        if (!sauvegarde) {
            throw new AppError('Données de sauvegarde invalides', 400, 'INVALID_BACKUP');
        }

        // Restaurer app
        if (sauvegarde.app) {
            await this.restaurerConfigApp(sauvegarde.app, utilisateurId);
        }

        // Restaurer paramètres
        if (sauvegarde.parametres) {
            for (const p of sauvegarde.parametres) {
                try {
                    const param = await this.parametreRepo.findOne({ where: { cle: p.cle } });
                    if (param) {
                        param.valeur = p.valeur;
                        await this.parametreRepo.save(param);
                    }
                } catch (e) {
                    logger.warn(`Échec restauration paramètre ${p.cle}`);
                }
            }
        }

        await this.logAction({
            utilisateurId,
            action: ActionConfiguration.RESTORE,
            cible: CibleConfiguration.APP,
            description: `Configuration restaurée depuis sauvegarde ${sauvegardeId}`,
        });

        logger.info(`Configuration restaurée depuis sauvegarde ${sauvegardeId}`);
    }

    /**
     * Liste les sauvegardes disponibles
     */
    async getSauvegardes(limit: number = 10): Promise<HistoriqueConfiguration[]> {
        return this.historiqueRepo.find({
            where: { action: ActionConfiguration.EXPORT, cible: CibleConfiguration.APP },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

}

export const configurationHistoryService = new ConfigurationHistoryService();
export default ConfigurationHistoryService;
