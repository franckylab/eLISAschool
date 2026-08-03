/**
 * ==================================
 * eLISAschool - Service du module Annonces
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion complète des annonces avec :
 * - CRUD avec validation Zod
 * - Workflow de validation multi-niveau
 * - Ciblage multi-critères (rôle, classe, utilisateur, etc.)
 * - Programmation temporelle (date début/fin)
 * - Notifications intégrées
 * - Multi-tenant (etablissementId)
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Annonce, AnnonceCiblage, AnnonceTypeContenu, AnnonceStatut, AnnonceValidation, CiblageType } from '../entities';
import { CreateAnnonceDto, UpdateAnnonceDto, AnnonceConfigurationDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { notificationsService } from '@modules/notifications/services/notifications.service';
import { configurationService } from '@modules/configuration/services/configuration.service';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities';

// ==================== HELPER FUNCTIONS ====================

/**
 * Détermine le statut d'une annonce selon ses dates
 */
function determinerStatut(
  dateDebut: Date,
  dateFin: Date,
  statutActuel: string
): string {
  const maintenant = new Date();

  if (statutActuel === 'archive' || statutActuel === 'brouillon') {
    return statutActuel;
  }

  if (maintenant < dateDebut) {
    return 'programmé';
  }

  if (maintenant > dateFin) {
    return 'expiré';
  }

  return 'actif';
}

/**
 * Sanitize le contenu HTML pour prévenir les failles XSS
 */
function sanitizeContenu(contenu: string, typeContenu: string): string {
  if (typeContenu === 'texte') {
    return contenu
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Pour HTML, supprimer les scripts et event handlers basiques
  return contenu
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

// ==================== SERVICE CLASS ====================

export class AnnoncesService {
  private annonceRepo: Repository<Annonce>;
  private ciblageRepo: Repository<AnnonceCiblage>;
  
  // Cache multi-niveaux avec TTL configurable
  private cache = new Map<string, { value: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL_CONFIG = {
    config: 5 * 60 * 1000,        // 5 min pour configuration
    annonces: 2 * 60 * 1000,      // 2 min pour listes d'annonces
    statistiques: 10 * 60 * 1000, // 10 min pour statistiques
    criteres: 15 * 60 * 1000,     // 15 min pour critères ciblage
  };
  
  // Compteur de performance pour monitoring
  private perfCounters = {
    cacheHits: 0,
    cacheMisses: 0,
    dbQueries: 0,
  };

  constructor() {
    this.annonceRepo = AppDataSource.getRepository(Annonce);
    this.ciblageRepo = AppDataSource.getRepository(AnnonceCiblage);
  }

  // ==================== MÉTHODES PRINCIPALES ====================

  /**
   * Récupère depuis le cache avec vérification TTL
   */
  private getFromCache(key: string, type: keyof typeof this.CACHE_TTL_CONFIG): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.value;
    }
    if (cached) {
      this.cache.delete(key); // Expiré, supprimer
    }
    return null;
  }

  /**
   * Met en cache avec TTL selon le type
   */
  private setCache(key: string, value: any, type: keyof typeof this.CACHE_TTL_CONFIG): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL_CONFIG[type],
    });
  }

  /**
   * Invalide le cache de configuration
   */
  private invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Get performance counters for monitoring
   */
  getPerfCounters() {
    return {
      ...this.perfCounters,
      cacheHitRate: this.perfCounters.cacheHits > 0
        ? (this.perfCounters.cacheHits / (this.perfCounters.cacheHits + this.perfCounters.cacheMisses) * 100).toFixed(1) + '%'
        : '0%',
      cacheSize: this.cache.size,
    };
  }

  /**
   * Récupère les annonces actives pour un utilisateur donné
   * OPTIMISÉ : Cache + requête sélective + filtre DB
   */
  async getAnnoncesActives(
    utilisateurId: string,
    etablissementId: string,
    utilisateurRoles: string[]
  ): Promise<Annonce[]> {
    // Vérifier cache
    const cacheKey = `annonces:actives:${etablissementId}:${utilisateurId}`;
    const cached = this.getFromCache(cacheKey, 'annonces');
    if (cached) {
      this.perfCounters.cacheHits++;
      return cached;
    }
    this.perfCounters.cacheMisses++;
    this.perfCounters.dbQueries++;

    const maintenant = new Date();
    
    // Requête optimisée avec select sélectif
    const annonces = await this.annonceRepo.createQueryBuilder('annonce')
      .select([
        'annonce.id',
        'annonce.titre',
        'annonce.contenu',
        'annonce.typeContenu',
        'annonce.priorite',
        'annonce.statut',
        'annonce.dateDebut',
        'annonce.dateFin',
        'annonce.cibleGlobale',
        'annonce.ordreAffichage',
        'annonce.createdAt',
      ])
      .where('annonce.etablissement_id = :etablissementId', { etablissementId })
      .andWhere('annonce.statut IN (:...statuts)', { statuts: ['actif', 'programmé'] })
      .andWhere('annonce.date_debut <= :maintenant', { maintenant })
      .andWhere('annonce.date_fin > :maintenant', { maintenant })
      .andWhere('annonce.deleted_at IS NULL')
      .leftJoin('annonce.ciblages', 'ciblage')
      .addSelect([
        'ciblage.id',
        'ciblage.typeCible',
        'ciblage.cibleId',
      ])
      .orderBy('annonce.priorite', 'DESC')
      .addOrderBy('annonce.ordre_affichage', 'ASC')
      .addOrderBy('annonce.date_debut', 'DESC')
      .getMany();

    // Filtrer selon le ciblage (optimisé avec Set pour rôles)
    const rolesSet = new Set(utilisateurRoles);
    const annoncesVisibles = annonces.filter((annonce) => {
      if (annonce.cibleGlobale) return true;

      if (!annonce.ciblages || annonce.ciblages.length === 0) return false;

      return annonce.ciblages.some((ciblage) => {
        if (ciblage.typeCible === 'role') {
          return rolesSet.has(ciblage.cibleId);
        }
        if (ciblage.typeCible === 'utilisateur') {
          return ciblage.cibleId === utilisateurId;
        }
        return false;
      });
    });

    // Mettre en cache (2 min)
    this.setCache(cacheKey, annoncesVisibles, 'annonces');

    return annoncesVisibles;
  }

  /**
   * Liste paginée de toutes les annonces avec filtres
   * OPTIMISÉ : QueryBuilder sélectif + pagination efficace
   */
  async findAll(
    etablissementId: string,
    page: number = 1,
    limit: number = 20,
    filtres?: { statut?: string; recherche?: string }
  ): Promise<{ data: Annonce[]; total: number; pagination: any }> {
    const offset = (page - 1) * limit;
    this.perfCounters.dbQueries++;

    const queryBuilder = this.annonceRepo
      .createQueryBuilder('annonce')
      .select([
        'annonce.id',
        'annonce.titre',
        'annonce.contenu',
        'annonce.type_contenu as "typeContenu"',
        'annonce.priorite',
        'annonce.statut',
        'annonce.cible_globale as "cibleGlobale"',
        'annonce.ordre_affichage as "ordreAffichage"',
        'annonce.date_debut as "dateDebut"',
        'annonce.date_fin as "dateFin"',
        'annonce.created_at as "createdAt"',
      ])
      .where('annonce.etablissement_id = :etablissementId', { etablissementId })
      .andWhere('annonce.deleted_at IS NULL');

    // Filtre par statut
    if (filtres?.statut) {
      queryBuilder.andWhere('annonce.statut = :statut', { statut: filtres.statut });
    }

    // Optimisation: utiliser count() séparément pour performance
    const totalQuery = this.annonceRepo
      .createQueryBuilder('annonce')
      .select('COUNT(*)::int', 'count')
      .where('annonce.etablissement_id = :etablissementId', { etablissementId })
      .andWhere('annonce.deleted_at IS NULL');

    if (filtres?.statut) {
      totalQuery.andWhere('annonce.statut = :statut', { statut: filtres.statut });
    }

    // Recherche plein texte (si activée)
    if (filtres?.recherche) {
      queryBuilder.andWhere(
        '(annonce.titre ILIKE :recherche OR annonce.contenu ILIKE :recherche)',
        { recherche: `%${filtres.recherche}%` }
      );
      totalQuery.andWhere(
        '(annonce.titre ILIKE :recherche OR annonce.contenu ILIKE :recherche)',
        { recherche: `%${filtres.recherche}%` }
      );
    }

    // Pagination efficace avec index
    const [data, totalResult] = await Promise.all([
      queryBuilder
        .orderBy('annonce.created_at', 'DESC')
        .limit(limit)
        .offset(offset)
        .getRawMany(),
      totalQuery.getRawOne(),
    ]);

    const total = parseInt(totalResult?.count || '0');

    return {
      data,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Récupère une annonce par son ID
   */
  async findOne(id: string, etablissementId?: string): Promise<Annonce> {
    const where: any = { id };
    if (etablissementId) {
      where.etablissementId = etablissementId;
    }

    const annonce = await this.annonceRepo.findOne({
      where,
      relations: ['ciblages', 'createur', 'validateur'],
    });

    if (!annonce) {
      throw new AppError('Annonce non trouvée', 404, 'NOT_FOUND');
    }

    return annonce;
  }

  /**
   * Crée une nouvelle annonce
   */
  async create(
    dto: CreateAnnonceDto,
    utilisateurId: string,
    etablissementId: string
  ): Promise<Annonce> {
    // Déterminer le statut selon les dates
    const dateDebut = new Date(dto.dateDebut);
    const dateFin = new Date(dto.dateFin);

    if (dateFin <= dateDebut) {
      throw new AppError(
        'La date de fin doit être postérieure à la date de début',
        400,
        'INVALID_DATES'
      );
    }

    const statut = determinerStatut(dateDebut, dateFin, 'brouillon');

    // Sanitize le contenu
    const contenuSecure = sanitizeContenu(dto.contenu, dto.typeContenu);

    // Créer l'annonce
    const annonce = this.annonceRepo.create({
      titre: dto.titre,
      contenu: contenuSecure,
      typeContenu: dto.typeContenu as AnnonceTypeContenu,
      dateDebut,
      dateFin,
      statut: statut as any,
      etablissementId,
      createdBy: utilisateurId,
      priorite: dto.priorite ?? 0,
      ordreAffichage: dto.ordreAffichage ?? 0,
      cibleGlobale: dto.cibleGlobale,
      validation: 'brouillon' as any,
    });

    await this.annonceRepo.save(annonce);

    // Créer les ciblages si fournis
    if (dto.ciblages && dto.ciblages.length > 0) {
      await this.gererCiblages(annonce.id, dto.ciblages);
    }

    logger.info(`Annonce créée: ${annonce.id} par ${utilisateurId}`);

    // Audit
    try {
      await auditService.log({
        action: AuditAction.ANNONCE_CREATE,
        module: 'annonces',
        cibleId: annonce.id,
        cible: 'Annonce',
        nouvellesValeurs: {
          titre: annonce.titre,
          statut: annonce.statut,
          cibleGlobale: annonce.cibleGlobale,
        },
        utilisateurId,
        etablissementId,
      });
    } catch (error) {
      logger.warn(`[Annonces] Échec audit création (non bloquant)`, error);
    }

    // Si l'annonce est active, notifier les utilisateurs ciblés
    if (statut === 'actif') {
      this.notifierNouvelleAnnonce(annonce).catch((err) => {
        logger.warn(`[Annonces] Échec notification (non bloquant)`, err);
      });
    }

    return this.findOne(annonce.id);
  }

  /**
   * Met à jour une annonce existante
   */
  async update(
    id: string,
    dto: UpdateAnnonceDto,
    utilisateurId: string,
    etablissementId: string
  ): Promise<Annonce> {
    const annonce = await this.findOne(id, etablissementId);

    // Préparer les champs à mettre à jour
    const updateData: Partial<Annonce> = {
      updatedBy: utilisateurId,
    };

    if (dto.titre) updateData.titre = dto.titre;
    if (dto.contenu) {
      updateData.contenu = sanitizeContenu(dto.contenu, dto.typeContenu || annonce.typeContenu);
    }
    if (dto.typeContenu) updateData.typeContenu = dto.typeContenu as AnnonceTypeContenu;
    if (dto.priorite !== undefined) updateData.priorite = dto.priorite;
    if (dto.statut) updateData.statut = dto.statut as AnnonceStatut;
    if (dto.cibleGlobale !== undefined) updateData.cibleGlobale = dto.cibleGlobale;
    if (dto.ordreAffichage !== undefined) updateData.ordreAffichage = dto.ordreAffichage;

    if (dto.dateDebut || dto.dateFin) {
      const dateDebut = dto.dateDebut ? new Date(dto.dateDebut) : annonce.dateDebut;
      const dateFin = dto.dateFin ? new Date(dto.dateFin) : annonce.dateFin;

      if (dateFin <= dateDebut) {
        throw new AppError(
          'La date de fin doit être postérieure à la date de début',
          400,
          'INVALID_DATES'
        );
      }

      updateData.dateDebut = dateDebut;
      updateData.dateFin = dateFin;
    }

    // Mettre à jour l'annonce
    Object.assign(annonce, updateData);
    await this.annonceRepo.save(annonce);

    // Mettre à jour les ciblages si fournis
    if (dto.ciblages !== undefined) {
      await this.gererCiblages(id, dto.ciblages);
    }

    logger.info(`Annonce modifiée: ${id} par ${utilisateurId}`);

    // Audit
    try {
      await auditService.log({
        action: AuditAction.ANNONCE_EDIT,
        module: 'annonces',
        cibleId: id,
        cible: 'Annonce',
        nouvellesValeurs: updateData,
        utilisateurId,
        etablissementId,
      });
    } catch (error) {
      logger.warn(`[Annonces] Échec audit modification (non bloquant)`, error);
    }

    // Si l'annonce est active, notifier la modification
    if (annonce.statut === 'actif') {
      this.notifierModificationAnnonce(annonce, utilisateurId).catch((err) => {
        logger.warn(`[Annonces] Échec notification modification (non bloquant)`, err);
      });
    }

    return this.findOne(id);
  }

  /**
   * Supprime une annonce (soft delete)
   */
  async delete(id: string, utilisateurId: string, etablissementId: string): Promise<void> {
    const annonce = await this.findOne(id, etablissementId);

    await this.annonceRepo.softDelete(id);

    logger.info(`Annonce supprimée: ${id} par ${utilisateurId}`);
  }

  // ==================== WORKFLOW DE VALIDATION ====================

  /**
   * Soumet une annonce pour validation
   */
  async soumettrePourValidation(
    id: string,
    utilisateurId: string,
    etablissementId: string
  ): Promise<Annonce> {
    const annonce = await this.findOne(id, etablissementId);

    if (annonce.validation === 'valide') {
      throw new AppError("L'annonce est déjà validée", 400, 'VALIDATION_ERROR');
    }

    annonce.validation = AnnonceValidation.EN_ATTENTE_VALIDATION;
    annonce.updatedBy = utilisateurId;
    await this.annonceRepo.save(annonce);

    logger.info(`Annonce soumise pour validation: ${id} par ${utilisateurId}`);

    // Notifier les validateurs
    this.notifierValidateurs(annonce).catch((err) => {
      logger.warn(`[Annonces] Échec notification validateurs (non bloquant)`, err);
    });

    return annonce;
  }

  /**
   * Valide une annonce
   */
  async validerAnnonce(
    id: string,
    validateurId: string,
    etablissementId: string
  ): Promise<Annonce> {
    const annonce = await this.findOne(id, etablissementId);

    if (annonce.validation === 'valide') {
      throw new AppError("L'annonce est déjà validée", 400, 'VALIDATION_ERROR');
    }

    if (annonce.validation !== 'en_attente_validation') {
      throw new AppError(
        "Seules les annonces en attente de validation peuvent être validées",
        400,
        'VALIDATION_ERROR'
      );
    }

    // Activer automatiquement l'annonce
    const maintenant = new Date();
    const deuxSemaines = new Date(maintenant);
    deuxSemaines.setDate(deuxSemaines.getDate() + 14);

    annonce.validation = AnnonceValidation.VALIDE;
    annonce.dateValidation = maintenant;
    annonce.validePar = validateurId;
    annonce.statut = AnnonceStatut.ACTIF;
    annonce.dateDebut = maintenant;
    annonce.dateFin = deuxSemaines;
    annonce.updatedBy = validateurId;

    await this.annonceRepo.save(annonce);

    logger.info(`Annonce validée: ${id} par ${validateurId}`);

    // Notifier les utilisateurs ciblés
    this.notifierNouvelleAnnonce(annonce).catch((err) => {
      logger.warn(`[Annonces] Échec notification après validation (non bloquant)`, err);
    });

    return this.findOne(id);
  }

  /**
   * Rejette une annonce
   */
  async rejeterAnnonce(
    id: string,
    validateurId: string,
    motifRejet: string,
    etablissementId: string
  ): Promise<Annonce> {
    const annonce = await this.findOne(id, etablissementId);

    if (annonce.validation !== 'en_attente_validation') {
      throw new AppError(
        "Seules les annonces en attente de validation peuvent être rejetées",
        400,
        'VALIDATION_ERROR'
      );
    }

    annonce.validation = AnnonceValidation.REJETE;
    annonce.motifRejet = motifRejet;
    annonce.updatedBy = validateurId;

    await this.annonceRepo.save(annonce);

    logger.info(`Annonce rejetée: ${id} par ${validateurId} - Motif: ${motifRejet}`);

    return annonce;
  }

  // ==================== ACTIONS DE GESTION ====================

  /**
   * Active une annonce
   */
  async activerAnnonce(
    id: string,
    utilisateurId: string,
    etablissementId: string,
    avecProgrammation: boolean = false
  ): Promise<Annonce> {
    const annonce = await this.findOne(id, etablissementId);

    if (annonce.validation !== 'valide') {
      throw new AppError(
        "Seules les annonces validées peuvent être activées",
        400,
        'VALIDATION_ERROR'
      );
    }

    annonce.statut = avecProgrammation ? AnnonceStatut.PROGRAMME : AnnonceStatut.ACTIF;
    annonce.updatedBy = utilisateurId;

    await this.annonceRepo.save(annonce);

    logger.info(`Annonce activée: ${id} (${annonce.statut}) par ${utilisateurId}`);

    if (annonce.statut === 'actif') {
      this.notifierNouvelleAnnonce(annonce).catch((err) => {
        logger.warn(`[Annonces] Échec notification activation (non bloquant)`, err);
      });
    }

    return annonce;
  }

  /**
   * Désactive une annonce
   */
  async desactiverAnnonce(
    id: string,
    utilisateurId: string,
    etablissementId: string
  ): Promise<Annonce> {
    const annonce = await this.findOne(id, etablissementId);

    if (annonce.statut !== 'actif' && annonce.statut !== 'programmé') {
      throw new AppError(
        "Seules les annonces actives ou programmées peuvent être désactivées",
        400,
        'VALIDATION_ERROR'
      );
    }

    annonce.statut = AnnonceStatut.BROUILLON;
    annonce.updatedBy = utilisateurId;

    await this.annonceRepo.save(annonce);

    logger.info(`Annonce désactivée: ${id} par ${utilisateurId}`);

    return annonce;
  }

  /**
   * Archive une annonce
   */
  async archiverAnnonce(
    id: string,
    utilisateurId: string,
    etablissementId: string
  ): Promise<Annonce> {
    const annonce = await this.findOne(id, etablissementId);

    if (annonce.statut === 'archive') {
      throw new AppError("L'annonce est déjà archivée", 400, 'VALIDATION_ERROR');
    }

    annonce.statut = AnnonceStatut.ARCHIVE;
    annonce.updatedBy = utilisateurId;

    await this.annonceRepo.save(annonce);

    logger.info(`Annonce archivée: ${id} par ${utilisateurId}`);

    return annonce;
  }

  /**
   * Met à jour automatiquement les statuts selon les dates
   */
  async mettreAJourStatutsAutomatiquement(): Promise<{ actif: number; archive: number }> {
    const maintenant = new Date();

    // Activer les annonces programmées
    const resultActif = await this.annonceRepo
      .createQueryBuilder()
      .update(Annonce)
      .set({ statut: AnnonceStatut.ACTIF as any, updatedAt: new Date() })
      .where('statut = :statut', { statut: 'programmé' })
      .andWhere('dateDebut <= :maintenant', { maintenant })
      .andWhere('dateFin > :maintenant', { maintenant })
      .execute();

    // Archiver les annonces expirées
    const resultArchive = await this.annonceRepo
      .createQueryBuilder()
      .update(Annonce)
      .set({ statut: AnnonceStatut.ARCHIVE as any, updatedAt: new Date() })
      .where('statut = :statut', { statut: 'actif' })
      .andWhere('dateFin <= :maintenant', { maintenant })
      .execute();

    logger.info(
      `Mise à jour auto statuts: ${resultActif.affected || 0} activées, ${resultArchive.affected || 0} archivées`
    );

    return {
      actif: resultActif.affected || 0,
      archive: resultArchive.affected || 0,
    };
  }

  // ==================== CIBLAGE ====================

  /**
   * Gère les ciblages d'une annonce (ajout/suppression)
   * OPTIMISÉ : Insertion batch avec repository.insert()
   */
  private async gererCiblages(
    annonceId: string,
    ciblages: Array<{ typeCible: string; cibleId: string; cibleValeur?: string }>
  ): Promise<void> {
    // Supprimer les anciens ciblages
    await this.ciblageRepo.delete({ annonceId });

    // Insérer les nouveaux ciblages en BATCH (1 seule requête SQL)
    if (ciblages.length > 0) {
      // Préparer les données pour insertion batch
      const ciblagesData = ciblages.map((ciblage) => ({
        annonceId,
        typeCible: ciblage.typeCible as CiblageType,
        cibleId: ciblage.cibleId,
        cibleValeur: ciblage.cibleValeur || null,
      }));

      // Insertion batch (beaucoup plus rapide que save() en boucle)
      await this.ciblageRepo.insert(ciblagesData as any);
    }
  }

  /**
   * Récupère les critères disponibles pour le ciblage
   */
  async getCriteresDisponibles(etablissementId: string): Promise<any> {
    return {
      roles: [
        { code: 'ADMIN', libelle: 'Administrateur' },
        { code: 'ENSEIGNANT', libelle: 'Enseignant' },
        { code: 'PARENT', libelle: 'Parent' },
        { code: 'ELEVE', libelle: 'Élève' },
        { code: 'PERSONNEL', libelle: 'Personnel' },
        { code: 'CHEF_ETABLISSEMENT', libelle: 'Chef d\'établissement' },
      ],
      // Classes, niveaux, fonctions à récupérer depuis les modules correspondants
      classes: [],
      niveaux: [],
      fonctions: [],
    };
  }

  /**
   * Récupère les statistiques détaillées des annonces
   * OPTIMISÉ : Cache 10 min + requêtes agrégées
   */
  async getStatistiques(etablissementId: string): Promise<any> {
    // Vérifier cache
    const cacheKey = `annonces:stats:${etablissementId}`;
    const cached = this.getFromCache(cacheKey, 'statistiques');
    if (cached) {
      this.perfCounters.cacheHits++;
      return cached;
    }
    this.perfCounters.cacheMisses++;
    this.perfCounters.dbQueries++;

    const maintenant = new Date();

    // Statistiques par statut (1 requête agrégée)
    const parStatut = await this.annonceRepo
      .createQueryBuilder('annonce')
      .select('annonce.statut', 'statut')
      .addSelect('COUNT(*)::int', 'nombre')
      .where('annonce.etablissement_id = :etablissementId', { etablissementId })
      .andWhere('annonce.deleted_at IS NULL')
      .groupBy('annonce.statut')
      .getRawMany();

    // Statistiques par validation (1 requête agrégée)
    const parValidation = await this.annonceRepo
      .createQueryBuilder('annonce')
      .select('annonce.validation', 'validation')
      .addSelect('COUNT(*)::int', 'nombre')
      .where('annonce.etablissement_id = :etablissementId', { etablissementId })
      .andWhere('annonce.deleted_at IS NULL')
      .groupBy('annonce.validation')
      .getRawMany();

    // Statistiques par type de contenu (1 requête agrégée)
    const parTypeContenu = await this.annonceRepo
      .createQueryBuilder('annonce')
      .select('annonce.type_contenu', 'typeContenu')
      .addSelect('COUNT(*)::int', 'nombre')
      .where('annonce.etablissement_id = :etablissementId', { etablissementId })
      .andWhere('annonce.deleted_at IS NULL')
      .groupBy('annonce.type_contenu')
      .getRawMany();

    // Annonces actives en ce moment (1 requête optimisée avec index)
    const annoncesActives = await this.annonceRepo
      .createQueryBuilder('annonce')
      .select('COUNT(*)::int', 'count')
      .where('annonce.etablissement_id = :etablissementId', { etablissementId })
      .andWhere('annonce.statut = :statut', { statut: 'actif' })
      .andWhere('annonce.date_debut <= :maintenant', { maintenant })
      .andWhere('annonce.date_fin > :maintenant', { maintenant })
      .andWhere('annonce.deleted_at IS NULL')
      .getRawOne();

    // Annonces expirées ce mois (1 requête avec index createdAt)
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const expireesCeMois = await this.annonceRepo
      .createQueryBuilder('annonce')
      .select('COUNT(*)::int', 'count')
      .where('annonce.etablissement_id = :etablissementId', { etablissementId })
      .andWhere('annonce.statut = :statut', { statut: 'archive' })
      .andWhere('annonce.updated_at >= :debutMois', { debutMois })
      .andWhere('annonce.deleted_at IS NULL')
      .getRawOne();

    // Total des ciblages (1 requête simple)
    const totalCiblages = await this.ciblageRepo
      .createQueryBuilder('ciblage')
      .select('COUNT(*)::int', 'count')
      .innerJoin('ciblage.annonce', 'annonce')
      .where('annonce.etablissement_id = :etablissementId', { etablissementId })
      .getRawOne();

    // Annonces par période (30 derniers jours) - 1 requête agrégée
    const trenteJours = new Date(maintenant);
    trenteJours.setDate(trenteJours.getDate() - 30);
    const parPeriode = await this.annonceRepo
      .createQueryBuilder('annonce')
      .select("DATE_TRUNC('day', annonce.created_at)::text", 'date')
      .addSelect('COUNT(*)::int', 'nombre')
      .where('annonce.etablissement_id = :etablissementId', { etablissementId })
      .andWhere('annonce.created_at >= :date', { date: trenteJours })
      .andWhere('annonce.deleted_at IS NULL')
      .groupBy("DATE_TRUNC('day', annonce.created_at)")
      .orderBy('date', 'DESC')
      .getRawMany();

    const result = {
      global: {
        total: parStatut.reduce((sum, s) => sum + parseInt(s.nombre), 0),
        actives: parseInt(annoncesActives?.count || '0'),
        expireesCeMois: parseInt(expireesCeMois?.count || '0'),
        totalCiblages: parseInt(totalCiblages?.count || '0'),
      },
      parStatut: parStatut.map((s) => ({
        statut: s.statut,
        nombre: parseInt(s.nombre),
      })),
      parValidation: parValidation.map((v) => ({
        validation: v.validation,
        nombre: parseInt(v.nombre),
      })),
      parTypeContenu: parTypeContenu.map((t) => ({
        typeContenu: t.typecontenu,
        nombre: parseInt(t.nombre),
      })),
      parPeriode: parPeriode.map((p) => ({
        date: p.date,
        nombre: parseInt(p.nombre),
      })),
      genereA: maintenant.toISOString(),
    };

    // Mettre en cache (10 min)
    this.setCache(cacheKey, result, 'statistiques');

    return result;
  }

  // ==================== CONFIGURATION ====================

  /**
   * Récupère la configuration des annonces depuis ParametreSysteme
   * avec valeurs par défaut et fallback
   */
  async getConfiguration(etablissementId: string): Promise<any> {
    const cacheKey = `annonces:config:${etablissementId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.value;
    }

    // Configuration par défaut (valeurs de référence)
    const defaultConfig = {
      vitesseDefilement: 50,
      hauteurBande: 40,
      intervalleActualisation: 30,
      typesContenuAutorises: ['texte', 'html'],
      tailleMaxContenu: 5000,
      pauseSurVol: true,
      actif: true,
      arretAutomatique: 0,
      delaiApparition: 600,
      delaiReapparition: 600,
      requireValidation: false,
      dureeMaxJours: 90,
      nbMaxAnnoncesActives: 50,
    };

    // Charger depuis les paramètres système avec fallback
    const config: any = { ...defaultConfig };

    try {
      const params = await configurationService.getParametresByModule('annonces');
      
      for (const param of params) {
        if (param.etablissementId === etablissementId || param.etablissementId === null) {
          try {
            const key = param.cle.replace('annonces.', '');
            if (key in config) {
              // Parser selon le type
              switch (param.typeValeur) {
                case 'BOOLEAN':
                  config[key] = param.valeur === 'true' || param.valeur === '1';
                  break;
                case 'NUMBER':
                  config[key] = parseFloat(param.valeur);
                  break;
                case 'JSON':
                  config[key] = JSON.parse(param.valeur);
                  break;
                default:
                  config[key] = param.valeur;
              }
            }
          } catch (error) {
            logger.warn(`[Annonces] Erreur parsing paramètre ${param.cle}`, error);
          }
        }
      }
    } catch (error) {
      logger.warn('[Annonces] Erreur chargement configuration, utilisation des valeurs par défaut', error);
    }

    this.cache.set(cacheKey, { value: config, timestamp: Date.now(), ttl: this.CACHE_TTL_CONFIG.config });
    return config;
  }

  /**
   * Met à jour la configuration des annonces
   * avec support de la réinitialisation
   */
  async updateConfiguration(
    dto: AnnonceConfigurationDto,
    utilisateurId: string,
    etablissementId: string
  ): Promise<any> {
    // Récupérer la configuration actuelle
    const currentConfig = await this.getConfiguration(etablissementId);

    // Mettre à jour les paramètres système
    const paramsToUpdate = Object.entries(dto);
    
    for (const [key, value] of paramsToUpdate) {
      if (value !== undefined) {
        const cle = `annonces.${key}`;
        
        // Déterminer le type de valeur
        let typeValeur = 'STRING';
        let valeurStr = String(value);
        
        if (typeof value === 'boolean') {
          typeValeur = 'BOOLEAN';
          valeurStr = value ? 'true' : 'false';
        } else if (typeof value === 'number') {
          typeValeur = 'NUMBER';
        } else if (Array.isArray(value) || typeof value === 'object') {
          typeValeur = 'JSON';
          valeurStr = JSON.stringify(value);
        }

        // Sauvegarder le paramètre
        try {
          await configurationService.setParametre(cle, valeurStr, etablissementId, utilisateurId);
        } catch (error) {
          logger.error(`[Annonces] Erreur sauvegarde paramètre ${cle}`, error);
        }
      }
    }

    // Invalider le cache
    this.invalidateCache();

    // Audit
    try {
      await auditService.log({
        action: AuditAction.CONFIG_CHANGE,
        module: 'annonces',
        cibleId: etablissementId,
        cible: 'Configuration',
        nouvellesValeurs: dto,
        utilisateurId,
      });
    } catch (error) {
      logger.warn('[Annonces] Échec audit (non bloquant)', error);
    }

    logger.info(`[Annonces] Configuration mise à jour par ${utilisateurId}`);

    return this.getConfiguration(etablissementId);
  }

  /**
   * Réinitialise la configuration aux valeurs par défaut
   * Supporte 3 niveaux : paramètre, catégorie, ou tout
   */
  async resetConfiguration(
    utilisateurId: string,
    etablissementId: string,
    scope: 'param' | 'categorie' | 'all' = 'all',
    cible?: string
  ): Promise<any> {
    try {
      let resetCount = 0;

      if (scope === 'param' && cible) {
        // Réinitialiser un seul paramètre
        await configurationService.resetParametre(`annonces.${cible}`, etablissementId);
        resetCount = 1;
      } else if (scope === 'categorie' && cible) {
        // Réinitialiser une catégorie
        const params = await configurationService.getParametresByModule('annonces');
        for (const param of params) {
          if (param.categorie === cible && param.etablissementId === etablissementId) {
            await configurationService.resetParametre(param.cle, etablissementId);
            resetCount++;
          }
        }
      } else {
        // Réinitialiser tous les paramètres du module
        const params = await configurationService.getParametresByModule('annonces');
        for (const param of params) {
          if (param.etablissementId === etablissementId || param.etablissementId === null) {
            await configurationService.resetParametre(param.cle, etablissementId);
            resetCount++;
          }
        }
      }

      // Invalider le cache
      this.invalidateCache();

      // Audit
      try {
        await auditService.log({
          action: AuditAction.CONFIG_CHANGE,
          module: 'annonces',
          cibleId: etablissementId,
          cible: 'Configuration',
          nouvellesValeurs: { scope, cible, resetCount },
          utilisateurId,
        });
      } catch (error) {
        logger.warn('[Annonces] Échec audit reset (non bloquant)', error);
      }

      logger.info(`[Annonces] Configuration réinitialisée (${resetCount} paramètres) par ${utilisateurId}`);

      return {
        success: true,
        resetCount,
        scope,
        configuration: await this.getConfiguration(etablissementId),
      };
    } catch (error) {
      logger.error('[Annonces] Erreur réinitialisation configuration', error);
      throw new AppError('Erreur lors de la réinitialisation', 500, 'CONFIG_RESET_ERROR');
    }
  }

  /**
   * Exporte la configuration actuelle
   */
  async exportConfiguration(etablissementId: string): Promise<any> {
    const config = await this.getConfiguration(etablissementId);
    
    return {
      module: 'annonces',
      etablissementId,
      exportedAt: new Date().toISOString(),
      configuration: config,
    };
  }

  /**
   * Importe une configuration
   */
  async importConfiguration(
    configData: any,
    utilisateurId: string,
    etablissementId: string
  ): Promise<any> {
    if (configData.module !== 'annonces') {
      throw new AppError('Configuration invalide: module incorrect', 400, 'INVALID_CONFIG');
    }

    // Mettre à jour tous les paramètres
    for (const [key, value] of Object.entries(configData.configuration)) {
      if (value !== undefined) {
        const cle = `annonces.${key}`;
        
        let typeValeur = 'STRING';
        let valeurStr = String(value);
        
        if (typeof value === 'boolean') {
          typeValeur = 'BOOLEAN';
          valeurStr = value ? 'true' : 'false';
        } else if (typeof value === 'number') {
          typeValeur = 'NUMBER';
        } else if (typeof value === 'object') {
          typeValeur = 'JSON';
          valeurStr = JSON.stringify(value);
        }

        await configurationService.setParametre({
          cle,
          valeur: valeurStr,
          typeValeur: typeValeur as any,
          categorie: 'MODULE',
          module: 'annonces',
          etablissementId,
          modifiableRuntime: true,
        }, utilisateurId);
      }
    }

    this.invalidateCache();

    // Audit
    try {
      await auditService.log({
        action: AuditAction.CONFIG_CHANGE,
        module: 'annonces',
        cibleId: etablissementId,
        cible: 'Configuration',
        nouvellesValeurs: { importedAt: new Date().toISOString() },
        utilisateurId,
      });
    } catch (error) {
      logger.warn('[Annonces] Échec audit import (non bloquant)', error);
    }

    logger.info(`[Annonces] Configuration importée par ${utilisateurId}`);

    return this.getConfiguration(etablissementId);
  }

  // ==================== NOTIFICATIONS ====================

  /**
   * Notifie les utilisateurs ciblés d'une nouvelle annonce
   */
  private async notifierNouvelleAnnonce(annonce: Annonce): Promise<void> {
    try {
      // Vérifier si les notifications sont activées
      const config = await this.getConfiguration(annonce.etablissementId);
      if (!config.actif) {
        return;
      }

      // Préparer le message
      const message = `📢 Nouvelle annonce: ${annonce.titre}`;
      const contenu = annonce.contenu.substring(0, 200) + (annonce.contenu.length > 200 ? '...' : '');

      // Si ciblage global, notifier tous les utilisateurs de l'établissement
      // Sinon, notifier uniquement les utilisateurs ciblés
      if (annonce.cibleGlobale) {
        // TODO: Récupérer tous les utilisateurs de l'établissement et notifier
        logger.info(`[Annonces] Notification globale à implémenter pour ${annonce.id}`);
      } else if (annonce.ciblages && annonce.ciblages.length > 0) {
        // Notifier selon les ciblages
        for (const ciblage of annonce.ciblages) {
          if (ciblage.typeCible === 'role') {
            // TODO: Notifier tous les utilisateurs avec ce rôle
            logger.info(`[Annonces] Notification par rôle ${ciblage.cibleId} à implémenter`);
          } else if (ciblage.typeCible === 'utilisateur') {
            // Notifier un utilisateur spécifique
            try {
              await notificationsService.create({
                titre: 'Nouvelle annonce',
                contenu,
                type: 'IN_APP',
                destinataireId: ciblage.cibleId,
                module: 'annonces',
                action: 'annonce:create',
                metadata: {
                  annonceId: annonce.id,
                  annonceTitre: annonce.titre,
                },
              }, annonce.createdBy);
            } catch (error) {
              logger.warn(`[Annonces] Échec notification utilisateur ${ciblage.cibleId}`, error);
            }
          }
        }
      }
    } catch (error) {
      logger.error(`[Annonces] Erreur notification nouvelle annonce`, error);
    }
  }

  /**
   * Notifie les utilisateurs ciblés d'une modification d'annonce
   */
  private async notifierModificationAnnonce(
    annonce: Annonce,
    utilisateurId: string
  ): Promise<void> {
    try {
      const message = `✏️ Annonce modifiée: ${annonce.titre}`;
      const contenu = 'Cette annonce a été modifiée. Consultez les updates.';

      if (annonce.cibleGlobale) {
        logger.info(`[Annonces] Notification modification globale à implémenter pour ${annonce.id}`);
      } else if (annonce.ciblages && annonce.ciblages.length > 0) {
        for (const ciblage of annonce.ciblages) {
          if (ciblage.typeCible === 'utilisateur') {
            try {
              await notificationsService.create({
                titre: 'Annonce modifiée',
                contenu,
                type: 'IN_APP',
                destinataireId: ciblage.cibleId,
                module: 'annonces',
                action: 'annonce:update',
                metadata: {
                  annonceId: annonce.id,
                  annonceTitre: annonce.titre,
                  modifiePar: utilisateurId,
                },
              }, utilisateurId);
            } catch (error) {
              logger.warn(`[Annonces] Échec notification modification`, error);
            }
          }
        }
      }
    } catch (error) {
      logger.error(`[Annonces] Erreur notification modification annonce`, error);
    }
  }

  /**
   * Notifie les validateurs d'une annonce en attente
   */
  private async notifierValidateurs(annonce: Annonce): Promise<void> {
    try {
      const message = `⏳ Annonce en attente de validation: ${annonce.titre}`;
      const contenu = `Une nouvelle annonce nécessite votre validation. Motif: ${annonce.titre}`;

      // Notifier les administrateurs et chefs d'établissement
      const rolesValidateurs = ['ADMIN', 'SUPER_ADMIN', 'CHEF_ETABLISSEMENT'];
      
      for (const role of rolesValidateurs) {
        // TODO: Notifier tous les utilisateurs avec ce rôle
        logger.info(`[Annonces] Notification validateurs rôle ${role} à implémenter`);
      }

      // Audit de la demande de validation
      try {
        await auditService.log({
          action: AuditAction.ANNONCE_EDIT,
          module: 'annonces',
          cibleId: annonce.id,
          cible: 'Annonce',
          nouvellesValeurs: {
            validation: 'en_attente_validation',
            titre: annonce.titre,
          },
          utilisateurId: annonce.updatedBy || annonce.createdBy,
          etablissementId: annonce.etablissementId,
        });
      } catch (error) {
        logger.warn('[Annonces] Échec audit validation (non bloquant)', error);
      }
    } catch (error) {
      logger.error(`[Annonces] Erreur notification validateurs`, error);
    }
  }
}

// Singleton exporté
export const annoncesService = new AnnoncesService();
