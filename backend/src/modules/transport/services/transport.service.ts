/**
 * ==================================
 * eLISAschool - Service Transport v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Utilise le système de configuration centralisé
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { LigneTransport, InscriptionTransport, PresenceTransport } from '../entities';
import { CreateLigneDto, CreateInscriptionTransportDto, EnregistrerPresenceDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { parentsService } from '@modules/responsables-eleves/services';
import { getParamBoolean, getParamNumber } from '@modules/configuration/utils/config.helper';
import { notificationTemplates } from '@modules/notifications/services';
import { Eleve } from '@modules/eleves/entities';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { auditService, AuditAction } from '@modules/auth';

/**
 * Service Transport avec configuration centralisée et cache
 */
export class TransportService {
    private ligneRepo: Repository<LigneTransport>;
    private inscriptionRepo: Repository<InscriptionTransport>;
    private presenceRepo: Repository<PresenceTransport>;

    // Cache pour les paramètres (TTL 5 min)
    private paramsCache: Map<string, { value: any; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor() {
        this.ligneRepo = AppDataSource.getRepository(LigneTransport);
        this.inscriptionRepo = AppDataSource.getRepository(InscriptionTransport);
        this.presenceRepo = AppDataSource.getRepository(PresenceTransport);
    }

    /**
     * Récupère les paramètres transport depuis la configuration (avec cache)
     */
    private async getTransportParams() {
        const cacheKey = 'transport:params';
        const cached = this.paramsCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.value;
        }

        const params = {
            enableGPS: await getParamBoolean('transport.enable_gps', { defaultValue: false }),
            enableQRCheckin: await getParamBoolean('transport.enable_qr_checkin', { defaultValue: true }),
            alertDelayMinutes: await getParamNumber('transport.alert_delay_minutes', { defaultValue: 10 }),
        };

        this.paramsCache.set(cacheKey, { value: params, timestamp: Date.now() });
        return params;
    }

    /**
     * Invalider le cache des paramètres
     */
    private invalidateParamsCache(): void {
        this.paramsCache.delete('transport:params');
    }

    async createLigne(dto: CreateLigneDto, createurId?: string, etablissementId?: string): Promise<LigneTransport> {
        const ligne = this.ligneRepo.create({ ...dto, etablissementId });
        await this.ligneRepo.save(ligne);
        logger.info(`[${etablissementId}] Ligne de transport créée: ${dto.nom}`);

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: createurId || 'system',
                action: AuditAction.LIGNE_CREATE,
                cible: 'LigneTransport',
                cibleId: ligne.id,
                description: `Ligne de transport créée: ${dto.nom}`,
                module: 'transport',
            });
        } catch (error) {
            logger.warn('[Transport] Erreur audit createLigne', error);
        }

        return ligne;
    }

    async getLignes(etablissementId?: string, page: number = 1, limit: number = 20): Promise<{ data: LigneTransport[]; total: number; page: number; limit: number }> {
        const qb = this.ligneRepo.createQueryBuilder('l')
            .where('l.actif = true');
        if (etablissementId) qb.andWhere('l.etablissementId = :etablissementId', { etablissementId });
        
        const total = await qb.getCount();
        const data = await qb
            .leftJoinAndSelect('l.chauffeur', 'chauffeur')
            .orderBy('l.nom', 'ASC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        
        return { data, total, page, limit };
    }

    async getLigne(id: string, etablissementId?: string): Promise<LigneTransport> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        const ligne = await this.ligneRepo.findOne({ where, relations: ['chauffeur'] });
        if (!ligne) throw new AppError('Ligne non trouvée', 404, 'NOT_FOUND');
        return ligne;
    }

    async createInscription(dto: CreateInscriptionTransportDto, createurId: string, etablissementId?: string): Promise<InscriptionTransport> {
        // Vérifier si déjà inscrit
        const where: any = { eleveId: dto.eleveId, actif: true };
        if (etablissementId) where.etablissementId = etablissementId;
        const existant = await this.inscriptionRepo.findOne({ where });
        if (existant) throw new AppError('Élève déjà inscrit au transport', 409, 'ALREADY_ENROLLED');

        // Vérifier si la validation est requise
        const requireValidation = await getParamBoolean('transport.require_validation', { defaultValue: false });

        const inscription = this.inscriptionRepo.create({
            ...dto,
            etablissementId,
            actif: !requireValidation, // Inactif si en attente de validation
        });

        // Transaction pour inscription + workflow + audit
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            await queryRunner.manager.save(inscription);

            // Créer un workflow de validation si requis
            if (requireValidation) {
                await validationWorkflowService.createWorkflow({
                    module: 'transport',
                    entiteId: inscription.id,
                    entiteType: 'InscriptionTransport',
                    niveauxRequis: 2,
                    etablissementId,
                }, createurId);

                logger.info(`[${etablissementId}] Inscription transport créée en attente de validation pour élève ${dto.eleveId}`);
            } else {
                logger.info(`[${etablissementId}] Inscription transport créée pour élève ${dto.eleveId}`);
            }

            // Audit trail
            await queryRunner.manager.query(`
                INSERT INTO audit_logs (id, "utilisateurId", action, cible, "cibleId", description, module, "etablissementId", "createdAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `, [
                require('crypto').randomUUID(),
                createurId,
                'INSCRIPTION_TRANSPORT_CREATE',
                'InscriptionTransport',
                inscription.id,
                `Inscription transport créée pour élève ${dto.eleveId}`,
                'transport',
                etablissementId,
            ]);

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        return inscription;
    }

    async getInscriptionsByLigne(ligneId: string, etablissementId?: string): Promise<InscriptionTransport[]> {
        const where: any = { ligneId, actif: true };
        if (etablissementId) where.etablissementId = etablissementId;
        return this.inscriptionRepo.find({ where, relations: ['eleve'] });
    }

    /**
     * Enregistrer une présence (vérifie si QR checkin est activé)
     */
    async enregistrerPresence(dto: EnregistrerPresenceDto, createurId?: string, etablissementId?: string): Promise<PresenceTransport> {
        const params = await this.getTransportParams();

        if (!params.enableQRCheckin) {
            throw new AppError('Le pointage QR n\'est pas activé', 400, 'QR_CHECKIN_DISABLED');
        }

        const presence = this.presenceRepo.create({ ...dto, date: new Date(dto.date) });
        await this.presenceRepo.save(presence);

        // Audit trail
        try {
            await auditService.log({
                utilisateurId: createurId || 'system',
                action: AuditAction.PRESENCE_TRANSPORT,
                cible: 'PresenceTransport',
                cibleId: presence.id,
                description: `Présence enregistrée pour inscription ${dto.inscriptionId}`,
                module: 'transport',
            });
        } catch (error) {
            logger.warn('[Transport] Erreur audit enregistrerPresence', error);
        }

        return presence;
    }

    async getPresencesDuJour(ligneId: string, etablissementId?: string): Promise<PresenceTransport[]> {
        const today = new Date().toISOString().split('T')[0];
        const qb = this.presenceRepo.createQueryBuilder('p')
            .innerJoin('p.inscription', 'i')
            .where('i.ligneId = :ligneId', { ligneId })
            .andWhere('p.date = :today', { today });
        if (etablissementId) qb.andWhere('p.etablissementId = :etablissementId', { etablissementId });
        return qb.getMany();
    }

    /**
     * Vérifie si le GPS est activé (pour l'interface)
     */
    async isGPSEnabled(): Promise<boolean> {
        const params = await this.getTransportParams();
        return params.enableGPS;
    }

    /**
     * Calculer le délai d'alerte en fonction de la configuration
     */
    getAlertDelayMinutes(): number {
        // Valeur mise en cache localement pour performance
        return 10; // Sera remplacé par getParamNumber lors de l'appel
    }

    /**
     * Vérifier si un bus est en retard selon la configuration
     */
    async verifierRetard(ligneId: string, heurePrevu: Date, etablissementId?: string): Promise<{ enRetard: boolean; minutesRetard: number }> {
        const params = await this.getTransportParams();
        const maintenant = new Date();
        const diffMinutes = (maintenant.getTime() - heurePrevu.getTime()) / (1000 * 60);
        
        const enRetard = diffMinutes > params.alertDelayMinutes;
        
        // NOTIFICATION : Alerter les parents si retard significatif
        if (enRetard && diffMinutes > 5) {
            try {
                await this.notifierRetardBus(ligneId, Math.floor(diffMinutes), etablissementId);
            } catch (error) {
                logger.warn('[Transport] Échec notification retard (non bloquant)', error);
            }
        }
        
        return {
            enRetard,
            minutesRetard: Math.floor(diffMinutes),
        };
    }

    /**
     * Notifier les parents d'un retard de bus
     */
    private async notifierRetardBus(
        ligneId: string,
        minutesRetard: number,
        etablissementId?: string
    ): Promise<void> {
        try {
            // Récupérer la ligne
            const ligne = await this.ligneRepo.findOne({
                where: { id: ligneId },
            });

            if (!ligne) return;

            // Récupérer les inscriptions actives
            const where: any = { ligneId, actif: true };
            if (etablissementId) where.etablissementId = etablissementId;
            const inscriptions = await this.inscriptionRepo.find({
                where,
                relations: ['eleve'],
            });

            // Notifier chaque parent
            const eleveRepo = AppDataSource.getRepository(Eleve);
            for (const inscription of inscriptions) {
                const eleve = await eleveRepo.findOne({
                    where: { id: inscription.eleveId },
                    relations: ['utilisateur'],
                });

                if (!eleve?.utilisateurId) continue;

                // Trouver les responsables
                const responsables = await parentsService.getResponsablesForNotification(eleve.utilisateurId);

                if (!responsables || responsables.length === 0) continue;

                for (const resp of responsables) {
                    await notificationTemplates.retardBus({
                        destinataireId: resp.utilisateurId,
                        etablissementId,
                        metadata: {
                            email: resp.email,
                            ligneId: ligne.id,
                            inscriptionId: inscription.id,
                        },
                    }, {
                        ligne: ligne.nom,
                        retard: minutesRetard,
                    });
                }
            }

            logger.info(`[Transport] Notification retard ${minutesRetard}min envoyée pour ligne ${ligne.nom}`);
        } catch (error) {
            logger.warn('[Transport] Erreur notification retard', error);
        }
    }
}

export const transportService = new TransportService();
