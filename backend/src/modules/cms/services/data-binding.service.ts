/**
 * ==================================
 * eLISAschool - DataBindingService CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Résout les variables {{etablissement.nom}}, {{eleves.total}}, etc.
 * dans le contenu des sections CMS.
 * Cache in-memory TTL 60s.
 */

import { Repository, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Etablissement } from '@modules/etablissement/entities';
import { Eleve } from '@modules/eleves/entities';
import { Matiere } from '@modules/matieres/entities';
import { CmsActualite, CmsTemoignage, CmsEvenement, CmsPartenaire, StatutActualite } from '../entities/cms-content.entity';
import { logger } from '@common/utils/logger.util';

// ==================================
// Types
// ==================================

export interface BindingContexte {
    [key: string]: string | number | boolean | null | undefined;
}

interface CacheEntry {
    data: BindingContexte;
    timestamp: number;
}

// ==================================
// Service
// ==================================

export class DataBindingService {
    private etabRepo: Repository<Etablissement>;
    private eleveRepo: Repository<Eleve>;
    private matiereRepo: Repository<Matiere>;
    private actualiteRepo: Repository<CmsActualite>;
    private temoignageRepo: Repository<CmsTemoignage>;
    private evenementRepo: Repository<CmsEvenement>;
    private partenaireRepo: Repository<CmsPartenaire>;

    // Cache in-memory TTL 60s
    private cache = new Map<string, CacheEntry>();
    private readonly CACHE_TTL_MS = 60_000;

    constructor() {
        this.etabRepo = AppDataSource.getRepository(Etablissement);
        this.eleveRepo = AppDataSource.getRepository(Eleve);
        this.matiereRepo = AppDataSource.getRepository(Matiere);
        this.actualiteRepo = AppDataSource.getRepository(CmsActualite);
        this.temoignageRepo = AppDataSource.getRepository(CmsTemoignage);
        this.evenementRepo = AppDataSource.getRepository(CmsEvenement);
        this.partenaireRepo = AppDataSource.getRepository(CmsPartenaire);
    }

    /**
     * Résout toutes les variables {{...}} dans un contenu JSON.
     * Parcourt récursivement les objets et remplace les chaînes contenant {{var}}.
     */
    async resoudreContenu(
        contenu: Record<string, any>,
        etablissementId: string,
    ): Promise<Record<string, any>> {
        const contexte = await this.getContexte(etablissementId);
        return this.resoudreObjet(contenu, contexte);
    }

    /**
     * Retourne le contexte complet de binding pour un établissement.
     * Utilise le cache si disponible et non expiré.
     */
    async getContexte(etablissementId: string): Promise<BindingContexte> {
        const cacheKey = `binding:${etablissementId}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
            return cached.data;
        }

        try {
            const contexte = await this.construireContexte(etablissementId);
            this.cache.set(cacheKey, { data: contexte, timestamp: Date.now() });
            return contexte;
        } catch (error) {
            logger.error('DataBindingService.getContexte error', { etablissementId, error });
            return {};
        }
    }

    /**
     * Retourne les variables disponibles pour le preview éditeur.
     */
    async getVariablesDisponibles(etablissementId: string): Promise<BindingContexte> {
        return this.getContexte(etablissementId);
    }

    /**
     * Invalide le cache pour un établissement.
     */
    invaliderCache(etablissementId: string): void {
        this.cache.delete(`binding:${etablissementId}`);
    }

    // ==================================
    // Construction du contexte
    // ==================================

    private async construireContexte(etablissementId: string): Promise<BindingContexte> {
        const [etab, totalEleves, totalMatieres, actualitesRecentes, temoignagesVisibles, evenementsFuturs, partenairesVisibles] = await Promise.all([
            this.etabRepo.findOne({ where: { id: etablissementId } }),
            this.eleveRepo.count({ where: { etablissement: { id: etablissementId } } }),
            this.matiereRepo.count({ where: { etablissement: { id: etablissementId } } }),
            // Actualités récentes (3 dernières publiées)
            this.actualiteRepo.find({
                where: { etablissementId, statut: StatutActualite.PUBLIE },
                order: { datePublication: 'DESC' },
                take: 3,
            }),
            // Témoignages visibles (3 premiers)
            this.temoignageRepo.find({
                where: { etablissementId, estVisible: true },
                order: { ordre: 'ASC' },
                take: 3,
            }),
            // Événements futurs (3 prochains)
            this.evenementRepo.find({
                where: { etablissementId, dateDebut: MoreThanOrEqual(new Date()) },
                order: { dateDebut: 'ASC' },
                take: 3,
            }),
            // Partenaires visibles
            this.partenaireRepo.find({
                where: { etablissementId, estVisible: true },
                order: { ordre: 'ASC' },
                take: 10,
            }),
        ]);

        const ctx: BindingContexte = {};

        // ── Établissement ──
        if (etab) {
            ctx['etablissement.nom'] = etab.nom;
            ctx['etablissement.slogan'] = etab.slogan || '';
            ctx['etablissement.ville'] = etab.ville || '';
            ctx['etablissement.pays'] = etab.pays || '';
            ctx['etablissement.adresse'] = etab.adresse || '';
            ctx['etablissement.telephone'] = etab.contactTelephone || '';
            ctx['etablissement.email'] = etab.contactEmail || '';
            ctx['etablissement.siteWeb'] = etab.siteWeb || '';
            ctx['etablissement.facebook'] = etab.facebook || '';
            ctx['etablissement.twitter'] = etab.twitter || '';
            ctx['etablissement.description'] = etab.descriptionPublique || '';
            ctx['etablissement.directeur'] = etab.directeurNom || '';
            ctx['etablissement.devise'] = etab.devise || '';
            ctx['etablissement.code'] = etab.codeEtablissement || '';
            ctx['etablissement.type'] = etab.type || '';
            ctx['etablissement.heuresOuverture'] = etab.heuresOuverture || '';
            ctx['etablissement.heuresFermeture'] = etab.heuresFermeture || '';
        }

        // ── Élèves (stats) ──
        ctx['eleves.total'] = totalEleves;

        // ── Matières ──
        ctx['matieres.total'] = totalMatieres;

        // ── Date courante ──
        const now = new Date();
        ctx['date.jour'] = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        ctx['date.annee'] = now.getFullYear();
        ctx['date.mois'] = now.toLocaleDateString('fr-FR', { month: 'long' });

        // ── Actualités CMS ──
        ctx['actualites.total'] = actualitesRecentes.length;
        actualitesRecentes.forEach((a, i) => {
            ctx[`actualites.${i}.titre`] = a.titre;
            ctx[`actualites.${i}.resume`] = a.resume || '';
            ctx[`actualites.${i}.categorie`] = a.categorie || '';
            ctx[`actualites.${i}.date`] = a.datePublication ? new Date(a.datePublication).toLocaleDateString('fr-FR') : '';
            ctx[`actualites.${i}.slug`] = a.slug || '';
        });

        // ── Témoignages CMS ──
        ctx['temoignages.total'] = temoignagesVisibles.length;
        temoignagesVisibles.forEach((t, i) => {
            ctx[`temoignages.${i}.nom`] = t.nom;
            ctx[`temoignages.${i}.fonction`] = t.fonction || '';
            ctx[`temoignages.${i}.contenu`] = t.contenu;
            ctx[`temoignages.${i}.note`] = t.note;
            ctx[`temoignages.${i}.categorie`] = t.categorie || '';
        });

        // ── Événements CMS ──
        ctx['evenements.total'] = evenementsFuturs.length;
        evenementsFuturs.forEach((e, i) => {
            ctx[`evenements.${i}.titre`] = e.titre;
            ctx[`evenements.${i}.description`] = e.description || '';
            ctx[`evenements.${i}.lieu`] = e.lieu || '';
            ctx[`evenements.${i}.dateDebut`] = e.dateDebut ? new Date(e.dateDebut).toLocaleDateString('fr-FR') : '';
            ctx[`evenements.${i}.type`] = e.type || '';
        });

        // ── Partenaires CMS ──
        ctx['partenaires.total'] = partenairesVisibles.length;
        partenairesVisibles.forEach((p, i) => {
            ctx[`partenaires.${i}.nom`] = p.nom;
            ctx[`partenaires.${i}.description`] = p.description || '';
            ctx[`partenaires.${i}.categorie`] = p.categorie || '';
            ctx[`partenaires.${i}.siteWeb`] = p.siteWeb || '';
        });

        return ctx;
    }

    // ==================================
    // Résolution récursive
    // ==================================

    private resoudreObjet(obj: any, contexte: BindingContexte): any {
        if (typeof obj === 'string') {
            return this.resoudreChaine(obj, contexte);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.resoudreObjet(item, contexte));
        }
        if (obj !== null && typeof obj === 'object') {
            const result: Record<string, any> = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.resoudreObjet(value, contexte);
            }
            return result;
        }
        return obj;
    }

    /**
     * Remplace les {{variable}} dans une chaîne par leur valeur du contexte.
     */
    private resoudreChaine(str: string, contexte: BindingContexte): string {
        return str.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key: string) => {
            const value = contexte[key];
            if (value !== undefined && value !== null) {
                return String(value);
            }
            return match; // Variable non résolue → garder le placeholder
        });
    }
}

// Singleton
export const dataBindingService = new DataBindingService();
