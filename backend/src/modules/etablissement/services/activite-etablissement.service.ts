/**
 * ==================================
 * eLISAschool - Service Activité Établissement
 * ==================================
 * 
 * Service dédié au calcul des métriques d'activité d'un établissement
 * pour le Control Plane (plateforme SuperAdmin).
 * 
 * Données retournées :
 * - Ventilation effectifs (par cycle, par genre, ratio, nouvelles inscriptions)
 * - Modules actifs (via ParametreSysteme, derniers changements)
 * - Timeline activité (AuditLog : compteurs + 20 derniers événements)
 * - Métriques financières (paiements, factures, abonnement)
 * 
 * Phase — Nettoyage Rôles SuperAdmin v8 + Page détail
 */

import { Repository, In, MoreThanOrEqual, LessThanOrEqual, Like } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { AuditAction } from '@modules/auth/entities';

// =============================================
// Interfaces
// =============================================

export interface ActiviteVentilation {
    parCycle: { cycle: string; code: string; nombre: number }[];
    parGenre: { masculin: number; feminin: number; autre: number };
    ratioPersonnelEleves: number;
    nouvellesInscriptions: number;
    dernieresInscriptions: { nomEleve: string; dateInscription: string; classe?: string }[];
}

export interface ActiviteModule {
    nom: string;
    actif: boolean;
    activeLe?: string;
}

export interface ActiviteModuleChangement {
    module: string;
    action: string;
    date: string;
}

export interface ActiviteModules {
    actifs: ActiviteModule[];
    totalActifs: number;
    derniersChangements: ActiviteModuleChangement[];
}

export interface AuditLogEntry {
    id: string;
    action: string;
    module?: string;
    cible?: string;
    cibleId?: string;
    description?: string;
    utilisateurId?: string;
    utilisateurEmail?: string;
    severity: string;
    createdAt: string;
}

export interface ActiviteTimeline {
    compteurs: { module: string; count: number }[];
    evenements: AuditLogEntry[];
}

export interface ActiviteFinances {
    paiementsMois: number;
    montantPaiementsMois: number;
    facturesEnAttente: number;
    montantEnAttente: number;
    tauxRecouvrement: number;
    retardMoyenJours: number;
    abonnement: {
        plan: string;
        statut: string;
        dateFin: string;
        montantMensuel: number;
        autoRenouvellement: boolean;
    } | null;
}

export interface ActiviteEtablissementResult {
    etablissementId: string;
    ventilation: ActiviteVentilation;
    modules: ActiviteModules;
    timeline: ActiviteTimeline;
    finances: ActiviteFinances;
}

// =============================================
// Service
// =============================================

export class ActiviteEtablissementService {

    // Repositories (lazy initialization)
    private get affectationRepo() { return AppDataSource.getRepository('AffectationEleve'); }
    private get eleveRepo() { return AppDataSource.getRepository('Eleve'); }
    private get membreRepo() { return AppDataSource.getRepository('MembrePersonnel'); }
    private get classeRepo() { return AppDataSource.getRepository('Classe'); }
    private get niveauRepo() { return AppDataSource.getRepository('Niveau'); }
    private get cycleRepo() { return AppDataSource.getRepository('Cycle'); }
    private get parametreRepo() { return AppDataSource.getRepository('ParametreSysteme'); }
    private get auditLogRepo() { return AppDataSource.getRepository('AuditLog'); }
    private get paiementRepo() { return AppDataSource.getRepository('Paiement'); }
    private get factureRepo() { return AppDataSource.getRepository('Facture'); }
    private get abonnementRepo() { return AppDataSource.getRepository('AbonnementClient'); }

    /**
     * Calculer l'activité complète d'un établissement.
     * Agrège 4 dimensions : ventilation, modules, timeline, finances.
     */
    async getActiviteComplete(etablissementId: string): Promise<ActiviteEtablissementResult> {
        // Vérifier l'existence de l'établissement
        const etablissementRepo = AppDataSource.getRepository('Etablissement');
        const etablissement = await etablissementRepo.findOne({ where: { id: etablissementId } });
        if (!etablissement) {
            throw new AppError('Établissement introuvable', 404, 'ETABLISSEMENT_NOT_FOUND');
        }

        // Exécuter les 4 agrégations en parallèle
        const [ventilation, modules, timeline, finances] = await Promise.all([
            this.calculerVentilation(etablissementId),
            this.calculerModules(etablissementId),
            this.calculerTimeline(etablissementId),
            this.calculerFinances(etablissementId),
        ]);

        return { etablissementId, ventilation, modules, timeline, finances };
    }

    // =============================================
    // 1. Ventilation effectifs
    // =============================================

    private async calculerVentilation(etablissementId: string): Promise<ActiviteVentilation> {
        // Récupérer les affectations actives avec leurs relations
        const affectations = await this.affectationRepo.find({
            where: { etablissementId, actif: true },
            relations: ['classe', 'classe.niveau', 'classe.niveau.cycle', 'eleve'],
            select: ['eleveId'],
        });

        // Récupérer les infos des élèves via les affectations
        const eleveIds = [...new Set(affectations.map((a: any) => a.eleveId))];
        const eleves = eleveIds.length > 0
            ? await this.eleveRepo.find({
                where: { id: In(eleveIds) },
                select: ['id', 'sexe'],
            })
            : [];

        const eleveMap = new Map(eleves.map((e: any) => [e.id, e]));

        // Par genre
        let masculin = 0, feminin = 0, autre = 0;
        for (const aff of affectations) {
            const eleve = eleveMap.get((aff as any).eleveId);
            if (!eleve) continue;
            if (eleve.sexe === 'M') masculin++;
            else if (eleve.sexe === 'F') feminin++;
            else autre++;
        }

        // Par cycle — grouper par cycle via niveau → cycle
        const cycleCounts = new Map<string, { nom: string; code: string; count: number }>();
        for (const aff of affectations) {
            const classe = (aff as any).classe;
            if (!classe?.niveau?.cycle) continue;
            const cycleId = classe.niveau.cycle.id;
            if (!cycleCounts.has(cycleId)) {
                cycleCounts.set(cycleId, {
                    nom: classe.niveau.cycle.nom,
                    code: classe.niveau.cycle.code,
                    count: 0,
                });
            }
            cycleCounts.get(cycleId)!.count++;
        }

        const parCycle = Array.from(cycleCounts.values())
            .map(c => ({ cycle: c.nom, code: c.code, nombre: c.count }))
            .sort((a, b) => a.code.localeCompare(b.code));

        // Personnel actif
        const nombrePersonnel = await this.membreRepo.count({
            where: { etablissementId, statut: 'ACTIF' as any },
        });

        // Ratio personnel/élèves
        const totalEleves = eleveIds.length;
        const ratioPersonnelEleves = totalEleves > 0
            ? Math.round((nombrePersonnel / totalEleves) * 1000) / 1000
            : 0;

        // Nouvelles inscriptions ce mois
        const debutMois = new Date();
        debutMois.setDate(1);
        debutMois.setHours(0, 0, 0, 0);

        const nouvellesInscriptions = await this.affectationRepo.count({
            where: {
                etablissementId,
                createdAt: MoreThanOrEqual(debutMois),
            },
        });

        // Dernières inscriptions (5 plus récentes affectations créées)
        const dernieresAffectations = await this.affectationRepo.find({
            where: { etablissementId },
            relations: ['eleve', 'classe'],
            order: { createdAt: 'DESC' },
            take: 5,
            select: ['createdAt'],
        });

        const dernieresInscriptions = await Promise.all(
            dernieresAffectations.map(async (aff: any) => {
                const eleve = aff.eleve;
                const nomEleve = eleve
                    ? `${eleve.prenom || ''} ${eleve.nom || ''}`.trim() || 'Élève inconnu'
                    : 'Élève inconnu';
                return {
                    nomEleve,
                    dateInscription: aff.createdAt?.toISOString?.() || new Date().toISOString(),
                    classe: aff.classe?.nom || undefined,
                };
            })
        );

        return {
            parCycle,
            parGenre: { masculin, feminin, autre },
            ratioPersonnelEleves,
            nouvellesInscriptions,
            dernieresInscriptions,
        };
    }

    // =============================================
    // 2. Modules actifs
    // =============================================

    private async calculerModules(etablissementId: string): Promise<ActiviteModules> {
        // Récupérer les paramètres système de type module actif
        const parametres = await this.parametreRepo.find({
            where: {
                etablissementId,
                cle: Like('%.actif'),
            },
        });

        const actifs: ActiviteModule[] = parametres
            .filter((p: any) => {
                const cle = p.cle as string;
                return cle.endsWith('.actif') && cle.split('.').length === 2;
            })
            .map((p: any) => ({
                nom: p.cle.split('.')[0],
                actif: p.valeur === 'true' || p.valeur === true,
                activeLe: p.updatedAt?.toISOString?.() || p.createdAt?.toISOString?.(),
            }))
            .sort((a, b) => a.nom.localeCompare(b.nom));

        const totalActifs = actifs.filter(m => m.actif).length;

        // Derniers changements de modules (via AuditLog)
        const changements = await this.auditLogRepo.find({
            where: {
                etablissementId,
                module: 'configuration',
                action: AuditAction.CONFIG_CHANGE,
            },
            order: { createdAt: 'DESC' },
            take: 5,
            select: ['description', 'createdAt'],
        });

        const derniersChangements: ActiviteModuleChangement[] = changements
            .filter((c: any) => c.description?.includes('module'))
            .map((c: any) => ({
                module: c.description?.match(/module\s+(\w+)/i)?.[1] || 'inconnu',
                action: c.description?.includes('activé') ? 'activé' : c.description?.includes('désactivé') ? 'désactivé' : 'modifié',
                date: c.createdAt?.toISOString?.() || new Date().toISOString(),
            }));

        return { actifs, totalActifs, derniersChangements };
    }

    // =============================================
    // 3. Timeline activité (AuditLog)
    // =============================================

    private async calculerTimeline(etablissementId: string): Promise<ActiviteTimeline> {
        // Compteurs par module (30 derniers jours)
        const trenteJours = new Date();
        trenteJours.setDate(trenteJours.getDate() - 30);

        const logs30j = await this.auditLogRepo.find({
            where: {
                etablissementId,
                createdAt: MoreThanOrEqual(trenteJours),
            },
            select: ['module'],
        });

        const compteurMap = new Map<string, number>();
        for (const log of logs30j) {
            const mod = (log as any).module || 'autre';
            compteurMap.set(mod, (compteurMap.get(mod) || 0) + 1);
        }

        const compteurs = Array.from(compteurMap.entries())
            .map(([module, count]) => ({ module, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 20 derniers événements
        const evenements = await this.auditLogRepo.find({
            where: { etablissementId },
            order: { createdAt: 'DESC' },
            take: 20,
            relations: ['utilisateur'],
        });

        const evenementsFormates: AuditLogEntry[] = evenements.map((e: any) => ({
            id: e.id,
            action: e.action,
            module: e.module,
            cible: e.cible,
            cibleId: e.cibleId,
            description: e.description,
            utilisateurId: e.utilisateurId,
            utilisateurEmail: e.utilisateur?.email,
            severity: e.severity,
            createdAt: e.createdAt?.toISOString?.() || new Date().toISOString(),
        }));

        return { compteurs, evenements: evenementsFormates };
    }

    // =============================================
    // 4. Métriques financières
    // =============================================

    private async calculerFinances(etablissementId: string): Promise<ActiviteFinances> {
        // Paiements du mois en cours
        const debutMois = new Date();
        debutMois.setDate(1);
        debutMois.setHours(0, 0, 0, 0);

        const paiementsResult = await this.paiementRepo
            .createQueryBuilder('p')
            .select('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(p.montantTotal), 0)', 'total')
            .where('p.etablissementId = :etablissementId', { etablissementId })
            .andWhere('p.datePaiement >= :debutMois', { debutMois })
            .getRawOne();

        const paiementsMois = parseInt(paiementsResult?.count || '0', 10);
        const montantPaiementsMois = parseFloat(paiementsResult?.total || '0');

        // Factures en attente (EMISE ou PARTIELLEMENT_PAYEE)
        const facturesEnAttenteResult = await this.factureRepo
            .createQueryBuilder('f')
            .select('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(f.montantTotal - f.montantPaye), 0)', 'restant')
            .addSelect('COALESCE(AVG(f.nombreJoursRetard), 0)', 'moyenneRetard')
            .where('f.etablissementId = :etablissementId', { etablissementId })
            .andWhere('f.statut IN (:...statuts)', {
                statuts: ['EMISE', 'PARTIELLEMENT_PAYEE', 'EN_RETARD'],
            })
            .getRawOne();

        const facturesEnAttente = parseInt(facturesEnAttenteResult?.count || '0', 10);
        const montantEnAttente = parseFloat(facturesEnAttenteResult?.restant || '0');
        const retardMoyenJours = Math.round(parseFloat(facturesEnAttenteResult?.moyenneRetard || '0'));

        // Taux de recouvrement (factures payées / total factures)
        const totalFacturesResult = await this.factureRepo
            .createQueryBuilder('f')
            .select('COUNT(*)', 'total')
            .addSelect('SUM(CASE WHEN f.statut = :payee THEN 1 ELSE 0 END)', 'payees')
            .where('f.etablissementId = :etablissementId', { etablissementId })
            .andWhere('f.statut != :brouillon', { brouillon: 'BROUILLON' })
            .andWhere('f.statut != :annulee', { annulee: 'ANNULEE' })
            .setParameters({ payee: 'PAYEE', etablissementId })
            .getRawOne();

        const totalFactures = parseInt(totalFacturesResult?.total || '0', 10);
        const facturesPayees = parseInt(totalFacturesResult?.payees || '0', 10);
        const tauxRecouvrement = totalFactures > 0
            ? Math.round((facturesPayees / totalFactures) * 100)
            : 100;

        // Abonnement plateforme
        const abonnement = await this.abonnementRepo.findOne({
            where: { etablissementId, statut: 'ACTIF' as any },
            relations: ['plan'],
            order: { dateDebut: 'DESC' },
        });

        const abonnementInfo = abonnement ? {
            plan: (abonnement as any).plan?.nom || 'Inconnu',
            statut: (abonnement as any).statut,
            dateFin: (abonnement as any).dateFin?.toISOString?.() || '',
            montantMensuel: parseFloat((abonnement as any).montantMensuel || '0'),
            autoRenouvellement: (abonnement as any).autoRenouvellement ?? false,
        } : null;

        return {
            paiementsMois,
            montantPaiementsMois,
            facturesEnAttente,
            montantEnAttente,
            tauxRecouvrement,
            retardMoyenJours,
            abonnement: abonnementInfo,
        };
    }
}

// =============================================
// Helpers
// =============================================

// =============================================
// Singleton
// =============================================

export const activiteEtablissementService = new ActiviteEtablissementService();
