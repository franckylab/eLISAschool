/**
 * ==================================
 * eLISAschool - Service Module Santé
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { DossierMedical, ConsultationMedicale, IncidentSante, TypePatient } from '../entities';
import { CreateDossierMedicalSchema, CreateConsultationMedicaleSchema, CreateIncidentSanteSchema } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService, AuditAction } from '@modules/auth';
import { Request } from 'express';
import { notificationService } from '@modules/notifications/services/notification.service';

export class SanteService {
    private dossierRepo: Repository<DossierMedical>;
    private consultationRepo: Repository<ConsultationMedicale>;
    private incidentRepo: Repository<IncidentSante>;
    
    // Cache in-memory pour dossiers médicaux (TTL 5 min)
    private cache = new Map<string, { value: any; timestamp: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor() {
        this.dossierRepo = AppDataSource.getRepository(DossierMedical);
        this.consultationRepo = AppDataSource.getRepository(ConsultationMedicale);
        this.incidentRepo = AppDataSource.getRepository(IncidentSante);
    }
    
    // Invalidation du cache après modification
    private invalidateDossierCache(patientId: string, etablissementId: string): void {
        const cacheKey = `dossier:${patientId}:${etablissementId}`;
        this.cache.delete(cacheKey);
    }

    // ==================== DOSSIERS MÉDICAUX ====================
    async createOrUpdateDossier(dto: CreateDossierMedicalSchema, etablissementId: string, req?: Request): Promise<DossierMedical> {
        // Vérifier si le dossier existe déjà
        let dossier = await this.dossierRepo.findOne({
            where: { patientId: dto.patientId, etablissementId },
        });

        const isUpdate = !!dossier;

        if (dossier) {
            // Mise à jour
            Object.assign(dossier, dto);
            await this.dossierRepo.save(dossier);
            
            // Invalider cache
            this.invalidateDossierCache(dto.patientId, etablissementId);
            
            // Audit trail
            if (req?.utilisateur?.id) {
                await auditService.log({
                    utilisateurId: req.utilisateur.id,
                    action: AuditAction.DOSSIER_MEDICAL_UPDATE,
                    cible: 'DossierMedical',
                    cibleId: dossier.id,
                    description: `Dossier médical mis à jour: ${dto.patientId}`,
                    nouvellesValeurs: dto,
                    module: 'sante',
                }, req);
            }
            
            logger.info(`[Santé] Dossier médical mis à jour: ${dto.patientId}`);
        } else {
            // Création
            dossier = this.dossierRepo.create({
                ...dto,
                etablissementId,
            });
            await this.dossierRepo.save(dossier);
            
            // Audit trail
            if (req?.utilisateur?.id) {
                await auditService.log({
                    utilisateurId: req.utilisateur.id,
                    action: AuditAction.DOSSIER_MEDICAL_CREATE,
                    cible: 'DossierMedical',
                    cibleId: dossier.id,
                    description: `Dossier médical créé: ${dto.patientId}`,
                    nouvellesValeurs: dto,
                    module: 'sante',
                }, req);
            }
            
            logger.info(`[Santé] Dossier médical créé: ${dto.patientId}`);
        }

        return dossier;
    }

    async getDossierByPatient(patientId: string, etablissementId: string): Promise<DossierMedical | null> {
        const cacheKey = `dossier:${patientId}:${etablissementId}`;
        
        // Vérifier cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.value;
        }
        
        // Cache miss → DB
        const dossier = await this.dossierRepo.findOne({
            where: { patientId, etablissementId },
        });
        
        // Mettre en cache
        if (dossier) {
            this.cache.set(cacheKey, { value: dossier, timestamp: Date.now() });
        }
        
        return dossier;
    }

    // ==================== CONSULTATIONS ====================
    async createConsultation(dto: CreateConsultationMedicaleSchema, consultantId: string, etablissementId: string, req?: Request): Promise<ConsultationMedicale> {
        // Vérifier que le dossier appartient à l'établissement
        const dossier = await this.dossierRepo.findOne({
            where: { id: dto.dossierMedicalId, etablissementId },
        });

        if (!dossier) {
            throw new AppError('Dossier médical non trouvé', 404, 'NOT_FOUND');
        }

        const consultation = this.consultationRepo.create({
            ...dto,
            consultantId,
            etablissementId,
            dateConsultation: new Date(),
        });

        await this.consultationRepo.save(consultation);
        
        // Invalider cache dossier
        this.invalidateDossierCache(dossier.patientId, etablissementId);
        
        // Audit trail
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.CONSULTATION_MEDICALE_CREATE,
                cible: 'ConsultationMedicale',
                cibleId: consultation.id,
                description: `Consultation créée: ${dto.type} - Patient: ${dossier.patientId}`,
                nouvellesValeurs: dto,
                module: 'sante',
            }, req);
        }
        
        logger.info(`[Santé] Consultation créée: ${consultation.id}`);
        return consultation;
    }

    async getConsultationsByPatient(patientId: string, etablissementId: string): Promise<ConsultationMedicale[]> {
        const dossier = await this.getDossierByPatient(patientId, etablissementId);
        if (!dossier) return [];

        return this.consultationRepo.find({
            where: { dossierMedicalId: dossier.id },
            relations: ['consultant'],
            order: { dateConsultation: 'DESC' },
        });
    }

    // ==================== INCIDENTS SANTÉ ====================
    async createIncidentSante(dto: CreateIncidentSanteSchema, declareParId: string, etablissementId: string, req?: Request): Promise<IncidentSante> {
        const dossier = await this.dossierRepo.findOne({
            where: { id: dto.dossierMedicalId, etablissementId },
        });

        if (!dossier) {
            throw new AppError('Dossier médical non trouvé', 404, 'NOT_FOUND');
        }

        const incident = this.incidentRepo.create({
            ...dto,
            declareParId,
            etablissementId,
            dateIncident: new Date(),
        });

        await this.incidentRepo.save(incident);
        
        // Invalider cache dossier
        this.invalidateDossierCache(dossier.patientId, etablissementId);
        
        // Notification pour incidents graves
        if (dto.gravite === 'GRAVE' || dto.gravite === 'CRITIQUE') {
            try {
                // Trouver les responsables du patient
                const responsableRepo = AppDataSource.getRepository('ResponsableEleve');
                const responsabilites = await responsableRepo.find({
                    where: { enfantId: dossier.patientId },
                }) as unknown as Array<{ utilisateurId: string }>;

                for (const resp of responsabilites) {
                    await notificationService.create({
                        destinataireId: resp.utilisateurId,
                        type: 'ALERTE',
                        titre: `Incident santé ${dto.gravite.toLowerCase()}`,
                        message: `Un incident de santé ${dto.gravite.toLowerCase()} a été signalé: ${dto.nature}`,
                        module: 'sante',
                        metadata: {
                            incidentId: incident.id,
                            gravite: dto.gravite,
                            nature: dto.nature,
                            typeIncident: dto.type,
                        },
                        etablissementId,
                    });
                }
                
                logger.info(`[Santé] Notifications envoyées pour incident grave: ${incident.id}`);
            } catch (error) {
                logger.warn(`[Santé] Échec notification incident grave (non bloquant)`, error);
            }
        }
        
        // Audit trail
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.INCIDENT_SANTE_CREATE,
                cible: 'IncidentSante',
                cibleId: incident.id,
                description: `Incident santé créé: ${dto.type} - Gravité: ${dto.gravite}`,
                nouvellesValeurs: dto,
                module: 'sante',
            }, req);
        }
        
        logger.info(`[Santé] Incident santé créé: ${incident.id} - Gravité: ${dto.gravite}`);
        return incident;
    }

    async getIncidentsByPatient(patientId: string, etablissementId: string): Promise<IncidentSante[]> {
        const dossier = await this.getDossierByPatient(patientId, etablissementId);
        if (!dossier) return [];

        return this.incidentRepo.find({
            where: { dossierMedicalId: dossier.id },
            order: { dateIncident: 'DESC' },
        });
    }

    // ==================== DASHBOARD ====================
    async getDashboardSante(patientId: string, etablissementId: string) {
        const dossier = await this.getDossierByPatient(patientId, etablissementId);
        if (!dossier) {
            throw new AppError('Aucun dossier médical trouvé', 404, 'NOT_FOUND');
        }

        const [consultations, incidents] = await Promise.all([
            this.getConsultationsByPatient(patientId, etablissementId),
            this.getIncidentsByPatient(patientId, etablissementId),
        ]);

        return {
            dossier: {
                groupeSanguin: dossier.groupeSanguin,
                allergies: dossier.allergiesConnues?.length || 0,
                handicaps: dossier.handicaps ? true : false,
                traitementsEnCours: dossier.traitementsEnCours?.length || 0,
            },
            consultations: consultations.length,
            consultationsUrgences: consultations.filter(c => c.type === 'URGENCES').length,
            incidents: incidents.length,
            incidentsGraves: incidents.filter(i => i.gravite === 'GRAVE' || i.gravite === 'CRITIQUE').length,
            dernierIncident: incidents[0] || null,
            derniereConsultation: consultations[0] || null,
        };
    }

    // ==================== STATISTIQUES ÉTABLISSEMENT ====================
    async getStatistiquesEtablissement(etablissementId: string, annee: number) {
        const dateDebut = new Date(`${annee}-01-01`);
        const dateFin = new Date(`${annee}-12-31`);

        const [totalDossiers, totalConsultations, totalIncidents] = await Promise.all([
            this.dossierRepo.count({ where: { etablissementId } }),
            this.consultationRepo.count({
                where: { 
                    etablissementId, 
                    dateConsultation: { between: [dateDebut, dateFin] } as unknown as any 
                } 
            }),
            this.incidentRepo.count({
                where: { 
                    etablissementId, 
                    dateIncident: { between: [dateDebut, dateFin] } as unknown as any 
                } 
            }),
        ]);

        return {
            totalDossiers,
            totalConsultations,
            totalIncidents,
            annee,
        };
    }
}

export const santeService = new SanteService();
