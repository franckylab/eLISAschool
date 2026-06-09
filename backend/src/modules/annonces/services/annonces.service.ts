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
import { Annonce, AnnonceCiblage } from '../entities';
import { CreateAnnonceDto, UpdateAnnonceDto, AnnonceConfigurationDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParametre, getParamBoolean } from '@modules/configuration/services/parametres.service';
import { notificationService } from '@modules/notifications/services/notifications.service';

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
  private cache = new Map<string, { value: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.annonceRepo = AppDataSource.getRepository(Annonce);
    this.ciblageRepo = AppDataSource.getRepository(AnnonceCiblage);
  }

  // ==================== MÉTHODES PRINCIPALES ====================

  /**
   * Récupère les annonces actives pour un utilisateur donné
   * Filtre selon les dates, le statut et le ciblage
   */
  async getAnnoncesActives(
    utilisateurId: string,
    etablissementId: string,
    utilisateurRoles: string[]
  ): Promise<Annonce[]> {
    const maintenant = new Date();

    // Récupérer toutes les annonces actives de l'établissement
    const annonces = await this.annonceRepo.find({
      where: {
        etablissementId,
        statut: In(['actif', 'programmé']),
        dateDebut: Repository.createQueryBuilder
          .createQueryBuilder()
          .andWhere('dateDebut <= :maintenant', { maintenant }),
        dateFin: Repository.createQueryBuilder
          .createQueryBuilder()
          .andWhere('dateFin > :maintenant', { maintenant }),
      },
      relations: ['ciblages'],
      order: {
        priorite: 'DESC',
        ordreAffichage: 'ASC',
        dateDebut: 'DESC',
      },
    });

    // Filtrer selon le ciblage
    const annoncesVisibles = annonces.filter((annonce) => {
      // Ciblage global : visible par tous
      if (annonce.cibleGlobale) {
        return true;
      }

      // Ciblage spécifique : vérifier les ciblages
      if (!annonce.ciblages || annonce.ciblages.length === 0) {
        return false;
      }

      // Vérifier si l'utilisateur correspond à au moins un ciblage
      return annonce.ciblages.some((ciblage) => {
        if (ciblage.typeCible === 'role') {
          return utilisateurRoles.includes(ciblage.cibleId);
        }
        if (ciblage.typeCible === 'utilisateur') {
          return ciblage.cibleId === utilisateurId;
        }
        // Ciblage classe/niveau/fonction à implémenter selon besoin
        return false;
      });
    });

    return annoncesVisibles;
  }

  /**
   * Liste paginée de toutes les annonces avec filtres
   */
  async findAll(
    etablissementId: string,
    page: number = 1,
    limit: number = 20,
    filtres?: { statut?: string; recherche?: string }
  ): Promise<{ data: Annonce[]; total: number; pagination: any }> {
    const offset = (page - 1) * limit;

    const where: any = {
      etablissementId,
    };

    if (filtres?.statut) {
      where.statut = filtres.statut;
    }

    if (filtres?.recherche) {
      const [data, total] = await this.annonceRepo.findAndCount({
        where: [
          { ...where, titre: Repository.createQueryBuilder().createQueryBuilder().andWhere('titre ILIKE :recherche', { recherche: `%${filtres.recherche}%` }) },
          { ...where, contenu: Repository.createQueryBuilder().createQueryBuilder().andWhere('contenu ILIKE :recherche', { recherche: `%${filtres.recherche}%` }) },
        ],
        relations: ['createur', 'validateur'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

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

    const [data, total] = await this.annonceRepo.findAndCount({
      where,
      relations: ['createur', 'validateur'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

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
      ...dto,
      contenu: contenuSecure,
      dateDebut,
      dateFin,
      statut,
      etablissementId,
      createdBy: utilisateurId,
      priorite: dto.priorite ?? 0,
      ordreAffichage: dto.ordreAffichage ?? 0,
    });

    await this.annonceRepo.save(annonce);

    // Créer les ciblages si fournis
    if (dto.ciblages && dto.ciblages.length > 0) {
      await this.gererCiblages(annonce.id, dto.ciblages);
    }

    logger.info(`Annonce créée: ${annonce.id} par ${utilisateurId}`);

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
    if (dto.typeContenu) updateData.typeContenu = dto.typeContenu;
    if (dto.priorite !== undefined) updateData.priorite = dto.priorite;
    if (dto.statut) updateData.statut = dto.statut;
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

    annonce.validation = 'en_attente_validation';
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

    annonce.validation = 'valide';
    annonce.dateValidation = maintenant;
    annonce.validePar = validateurId;
    annonce.statut = 'actif';
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

    annonce.validation = 'rejete';
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

    annonce.statut = avecProgrammation ? 'programmé' : 'actif';
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

    annonce.statut = 'brouillon';
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

    annonce.statut = 'archive';
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
      .set({ statut: 'actif', updatedAt: new Date() })
      .where('statut = :statut', { statut: 'programmé' })
      .andWhere('dateDebut <= :maintenant', { maintenant })
      .andWhere('dateFin > :maintenant', { maintenant })
      .execute();

    // Archiver les annonces expirées
    const resultArchive = await this.annonceRepo
      .createQueryBuilder()
      .update(Annonce)
      .set({ statut: 'archive', updatedAt: new Date() })
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
   */
  private async gererCiblages(
    annonceId: string,
    ciblages: Array<{ typeCible: string; cibleId: string; cibleValeur?: string }>
  ): Promise<void> {
    // Supprimer les anciens ciblages
    await this.ciblageRepo.delete({ annonceId });

    // Insérer les nouveaux ciblages
    if (ciblages.length > 0) {
      const ciblagesToCreate = ciblages.map((ciblage) =>
        this.ciblageRepo.create({
          annonceId,
          typeCible: ciblage.typeCible as any,
          cibleId: ciblage.cibleId,
          cibleValeur: ciblage.cibleValeur,
        })
      );

      await this.ciblageRepo.save(ciblagesToCreate);
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
      ],
      // Classes, niveaux, fonctions à récupérer depuis les modules correspondants
      classes: [],
      niveaux: [],
      fonctions: [],
    };
  }

  // ==================== CONFIGURATION ====================

  /**
   * Récupère la configuration des annonces
   */
  async getConfiguration(etablissementId: string): Promise<any> {
    const cacheKey = `annonces:config:${etablissementId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    // Configuration par défaut
    const config = {
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
    };

    // Charger depuis les paramètres système
    try {
      const vitesseDefilement = await getParametre('annonces.vitesse_defilement', etablissementId);
      if (vitesseDefilement) config.vitesseDefilement = parseInt(vitesseDefilement);
    } catch (e) {
      // Ignorer si le paramètre n'existe pas
    }

    this.cache.set(cacheKey, { value: config, timestamp: Date.now() });
    return config;
  }

  /**
   * Met à jour la configuration des annonces
   */
  async updateConfiguration(
    dto: AnnonceConfigurationDto,
    utilisateurId: string,
    etablissementId: string
  ): Promise<any> {
    // Mettre à jour les paramètres système
    // Implémentation à faire avec le service de configuration

    // Invalider le cache
    this.cache.clear();

    logger.info(`Configuration annonces mise à jour par ${utilisateurId}`);

    return this.getConfiguration(etablissementId);
  }

  // ==================== NOTIFICATIONS ====================

  /**
   * Notifie les utilisateurs ciblés d'une nouvelle annonce
   */
  private async notifierNouvelleAnnonce(annonce: Annonce): Promise<void> {
    try {
      // Récupérer les utilisateurs ciblés
      const ciblages = await this.ciblageRepo.find({
        where: { annonceId: annonce.id },
      });

      // Notifier selon le type de ciblage
      for (const ciblage of ciblages) {
        if (ciblage.typeCible === 'role') {
          // Notifier tous les utilisateurs avec ce rôle
          await notificationService.sendToRole(
            ciblage.cibleId,
            'Nouvelle annonce',
            annonce.titre,
            {
              module: 'annonces',
              annonceId: annonce.id,
              etablissementId: annonce.etablissementId,
            }
          );
        } else if (ciblage.typeCible === 'utilisateur') {
          await notificationService.sendToUser(
            ciblage.cibleId,
            'Nouvelle annonce',
            annonce.titre,
            {
              module: 'annonces',
              annonceId: annonce.id,
              etablissementId: annonce.etablissementId,
            }
          );
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
      // Implémentation similaire à notifierNouvelleAnnonce
      // Avec un message différent
    } catch (error) {
      logger.error(`[Annonces] Erreur notification modification annonce`, error);
    }
  }

  /**
   * Notifie les validateurs d'une annonce en attente
   */
  private async notifierValidateurs(annonce: Annonce): Promise<void> {
    try {
      // Notifier les admins et chefs d'établissement
      await notificationService.sendToRole(
        'ADMIN',
        'Annonce à valider',
        `L'annonce "${annonce.titre}" est en attente de validation`,
        {
          module: 'annonces',
          annonceId: annonce.id,
          etablissementId: annonce.etablissementId,
        }
      );
    } catch (error) {
      logger.error(`[Annonces] Erreur notification validateurs`, error);
    }
  }
}

// Singleton exporté
export const annoncesService = new AnnoncesService();
