/**
 * ==================================
 * eLISAschool - Service Rotation Logs d'Audit
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Description: Gestion automatique de l'archivage et suppression des anciens logs
 */

import { Repository, LessThan } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AuditLog } from '@modules/auth/entities/audit-log.entity';
import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';
import * as fs from 'fs';
import * as path from 'path';

export class AuditRotationService {
    private repo: Repository<AuditLog>;
    private readonly ARCHIVE_DIR = path.join(process.cwd(), 'logs', 'audit-archive');
    private readonly DEFAULT_RETENTION_DAYS = 90;
    private readonly ARCHIVE_AFTER_DAYS = 30;

    constructor() {
        this.repo = AppDataSource.getRepository(AuditLog);
        this.ensureArchiveDir();
    }

    /**
     * Créer le dossier d'archive s'il n'existe pas
     */
    private ensureArchiveDir(): void {
        if (!fs.existsSync(this.ARCHIVE_DIR)) {
            fs.mkdirSync(this.ARCHIVE_DIR, { recursive: true });
        }
    }

    /**
     * Archiver les logs de plus de X jours (configurable)
     */
    async archiverAnciensLogs(
        joursAvantArchive: number = this.ARCHIVE_AFTER_DAYS
    ): Promise<{ archives: number; tailleKo: number }> {
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() - joursAvantArchive);

        logger.info(`[AuditRotation] Archivage des logs avant ${dateLimite.toISOString()}`);

        // Récupérer les logs à archiver
        const logsAArchiver = await this.repo.find({
            where: {
                createdAt: LessThan(dateLimite),
            },
            order: {
                createdAt: 'ASC',
            },
        });

        if (logsAArchiver.length === 0) {
            logger.info('[AuditRotation] Aucun log à archiver');
            return { archives: 0, tailleKo: 0 };
        }

        // Créer le fichier d'archive
        const dateFichier = new Date().toISOString().split('T')[0];
        const nomArchive = `audit-${dateFichier}-${joursAvantArchive}j.json`;
        const cheminArchive = path.join(this.ARCHIVE_DIR, nomArchive);

        const contenu = JSON.stringify(logsAArchiver, null, 2);
        const tailleKo = Buffer.byteLength(contenu, 'utf8') / 1024;

        fs.writeFileSync(cheminArchive, contenu, 'utf8');

        logger.info(`[AuditRotation] ${logsAArchiver.length} logs archivés (${tailleKo.toFixed(2)} Ko)`);

        // Supprimer les logs archivés de la base
        await this.repo.remove(logsAArchiver);

        // Invalider cache Redis (supprimer toutes les clés d'audit)
        // Note: deleteByPattern n'existe pas, on utilise del avec les clés connues
        // await redisService.del('audit:*'); // Pattern non supporté par ioredis directement

        return {
            archives: logsAArchiver.length,
            tailleKo: Math.round(tailleKo * 100) / 100,
        };
    }

    /**
     * Supprimer les archives de plus de X jours
     */
    async supprimerAnciennesArchives(
        joursConservation: number = this.DEFAULT_RETENTION_DAYS
    ): Promise<{ supprimes: number }> {
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() - joursConservation);

        // Lister les fichiers d'archive
        const fichiers = fs.readdirSync(this.ARCHIVE_DIR);
        let supprimes = 0;

        for (const fichier of fichiers) {
            const chemin = path.join(this.ARCHIVE_DIR, fichier);
            const stats = fs.statSync(chemin);

            if (stats.mtime < dateLimite) {
                fs.unlinkSync(chemin);
                supprimes++;
                logger.info(`[AuditRotation] Archive supprimée: ${fichier}`);
            }
        }

        return { supprimes };
    }

    /**
     * Nettoyer les logs obsolètes (sans les archiver)
     * Pour les logs de type INFO très anciens
     */
    async nettoyerLogsObsolètes(
        joursAvantNettoyage: number = 180
    ): Promise<{ supprimes: number }> {
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() - joursAvantNettoyage);

        const result = await this.repo
            .createQueryBuilder()
            .delete()
            .from(AuditLog)
            .where('created_at < :date', { date: dateLimite })
            .andWhere('severite = :severite', { severite: 'INFO' })
            .execute();

        const supprimes = result.affected || 0;

        logger.info(`[AuditRotation] ${supprimes} logs INFO obsolètes supprimés`);

        return { supprimes };
    }

    /**
     * Exécuter la rotation complète (archive + nettoyage + suppression archives)
     */
    async executerRotation(): Promise<{
        archives: number;
        tailleArchiveKo: number;
        archivesSupprimees: number;
        logsNettoyes: number;
    }> {
        logger.info('[AuditRotation] Début de la rotation complète');

        // 1. Archiver les logs de > 30 jours
        const { archives, tailleKo } = await this.archiverAnciensLogs(30);

        // 2. Supprimer les archives de > 90 jours
        const { supprimes: archivesSupprimees } = await this.supprimerAnciennesArchives(90);

        // 3. Nettoyer les logs INFO de > 180 jours
        const { supprimes: logsNettoyes } = await this.nettoyerLogsObsolètes(180);

        logger.info('[AuditRotation] Rotation complète terminée', {
            archives,
            tailleKo,
            archivesSupprimees,
            logsNettoyes,
        });

        return {
            archives,
            tailleArchiveKo: tailleKo,
            archivesSupprimees,
            logsNettoyes,
        };
    }

    /**
     * Obtenir les statistiques de stockage
     */
    async getStatistiquesStockage(): Promise<{
        totalLogs: number;
        logsParSeverite: Record<string, number>;
        logsParModule: Record<string, number>;
        tailleArchivesKo: number;
        nombreArchives: number;
        ageMoyenJours: number;
    }> {
        // Compter les logs actuels
        const totalLogs = await this.repo.count();

        // Répartition par sévérité
        const logsParSeverite = await this.repo
            .createQueryBuilder('audit')
            .select('audit.severite', 'severite')
            .addSelect('COUNT(*)', 'count')
            .groupBy('audit.severite')
            .getRawMany();

        // Répartition par module
        const logsParModule = await this.repo
            .createQueryBuilder('audit')
            .select('audit.module', 'module')
            .addSelect('COUNT(*)', 'count')
            .where('audit.module IS NOT NULL')
            .groupBy('audit.module')
            .getRawMany();

        // Âge moyen des logs
        const ageMoyen = await this.repo
            .createQueryBuilder('audit')
            .select('AVG(EXTRACT(EPOCH FROM (NOW() - audit.created_at)) / 86400)', 'avg_age')
            .getRawOne();

        // Statistiques des archives
        const fichiers = fs.readdirSync(this.ARCHIVE_DIR);
        let tailleTotaleKo = 0;

        for (const fichier of fichiers) {
            const chemin = path.join(this.ARCHIVE_DIR, fichier);
            const stats = fs.statSync(chemin);
            tailleTotaleKo += stats.size / 1024;
        }

        return {
            totalLogs,
            logsParSeverite: this.transformerResultats(logsParSeverite),
            logsParModule: this.transformerResultats(logsParModule),
            tailleArchivesKo: Math.round(tailleTotaleKo * 100) / 100,
            nombreArchives: fichiers.length,
            ageMoyenJours: Math.round(ageMoyen.avg_age || 0),
        };
    }

    /**
     * Transformer les résultats de requête brute
     */
    private transformerResultats(
        resultats: Array<{ [key: string]: any }>
    ): Record<string, number> {
        const resultat: Record<string, number> = {};

        for (const row of resultats) {
            const cle = Object.values(row)[0] as string;
            const valeur = parseInt(Object.values(row)[1] as string, 10);
            resultat[cle] = valeur;
        }

        return resultat;
    }

    /**
     * Lister les archives disponibles
     */
    listerArchives(): Array<{
        nom: string;
        taille: number;
        dateCreation: Date;
    }> {
        const fichiers = fs.readdirSync(this.ARCHIVE_DIR);

        return fichiers.map(fichier => {
            const chemin = path.join(this.ARCHIVE_DIR, fichier);
            const stats = fs.statSync(chemin);

            return {
                nom: fichier,
                taille: Math.round(stats.size / 1024 * 100) / 100,
                dateCreation: stats.mtime,
            };
        });
    }
}

export const auditRotationService = new AuditRotationService();
