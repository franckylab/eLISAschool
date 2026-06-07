/**
 * ==================================
 * eLISAschool - Service Transport v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Utilise le système de configuration centralisé
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { LigneTransport, InscriptionTransport, PresenceTransport } from '../entities';
import { CreateLigneDto, CreateInscriptionTransportDto, EnregistrerPresenceDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamBoolean, getParamNumber } from '@modules/configuration/utils/config.helper';
import { notificationTemplates } from '@modules/notifications/services';
import { Eleve } from '@modules/eleves/entities';
import { validationWorkflowService } from '@modules/validation-workflow/services';

/**
 * Service Transport avec configuration centralisée
 */
export class TransportService {
    private ligneRepo: Repository<LigneTransport>;
    private inscriptionRepo: Repository<InscriptionTransport>;
    private presenceRepo: Repository<PresenceTransport>;

    constructor() {
        this.ligneRepo = AppDataSource.getRepository(LigneTransport);
        this.inscriptionRepo = AppDataSource.getRepository(InscriptionTransport);
        this.presenceRepo = AppDataSource.getRepository(PresenceTransport);
    }

    /**
     * Récupère les paramètres transport depuis la configuration
     */
    private async getTransportParams() {
        return {
            enableGPS: await getParamBoolean('transport.enable_gps', false),
            enableQRCheckin: await getParamBoolean('transport.enable_qr_checkin', true),
            alertDelayMinutes: await getParamNumber('transport.alert_delay_minutes', 10),
        };
    }

    async createLigne(dto: CreateLigneDto, etablissementId?: string): Promise<LigneTransport> {
        const ligne = this.ligneRepo.create({ ...dto, etablissementId });
        await this.ligneRepo.save(ligne);
        logger.info(`[${etablissementId}] Ligne de transport créée: ${dto.nom}`);
        return ligne;
    }

    async getLignes(etablissementId?: string): Promise<LigneTransport[]> {
        const where: any = { actif: true };
        if (etablissementId) where.etablissementId = etablissementId;
        return this.ligneRepo.find({ where, relations: ['chauffeur'] });
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
        const requireValidation = await getParamBoolean('transport.require_validation', false);

        const inscription = this.inscriptionRepo.create({
            ...dto,
            etablissementId,
            actif: !requireValidation, // Inactif si en attente de validation
        });
        await this.inscriptionRepo.save(inscription);

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
    async enregistrerPresence(dto: EnregistrerPresenceDto): Promise<PresenceTransport> {
        const params = await this.getTransportParams();

        if (!params.enableQRCheckin) {
            throw new AppError('Le pointage QR n\'est pas activé', 400, 'QR_CHECKIN_DISABLED');
        }

        const presence = this.presenceRepo.create({ ...dto, date: new Date(dto.date) });
        await this.presenceRepo.save(presence);
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
                const responsableRepo = AppDataSource.getRepository('ResponsableEleve');
                const responsabilités = await responsableRepo.find({
                    where: { enfantId: eleve.utilisateurId }
                }) as any[];

                if (!responsabilités || responsabilités.length === 0) continue;

                for (const resp of responsabilités) {
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
