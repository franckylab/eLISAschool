/**
 * ==================================
 * eLISAschool - Service Élèves
 * ==================================
 */

import { Repository } from 'typeorm';
import { Request } from 'express';
import { AppDataSource } from '@database/data-source';
import { Eleve, StatutEleve } from '../entities';
import { CreateEleveDto, UpdateEleveDto, QueryElevesDto, PreinscriptionDto, ConvertirPreinscriptionDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService, AuditAction } from '@modules/auth';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { notificationsService } from '@modules/notifications/services/notifications.service';
import { TypeNotification, PrioriteNotification } from '@modules/notifications/entities';
import { parentsService } from '@modules/responsables-eleves/services';
import { Classe } from '@modules/classes/entities';
import { AffectationEleve } from '@modules/classes/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';

export class ElevesService {
    private repo: Repository<Eleve>;

    constructor() {
        this.repo = AppDataSource.getRepository(Eleve);
    }

    async create(dto: CreateEleveDto, etablissementId?: string, req?: Request): Promise<Eleve> {
        // OPTIMISATION : Vérifications en parallèle
        const [existing, userUsed] = await Promise.all([
            this.repo.findOne({ where: { matricule: dto.matricule } }),
            this.repo.findOne({ where: { utilisateurId: dto.utilisateurId } }),
        ]);

        if (existing) throw new AppError('Matricule élève déjà existant', 409, 'MATRICULE_EXISTS');
        if (userUsed) throw new AppError('Cet utilisateur est déjà lié à un dossier élève', 409, 'USER_ALREADY_LINKED');

        // Vérifier si le workflow de validation est requis
        const requireValidation = await getParamBoolean('eleves.require_validation', false);

        const eleve = this.repo.create({
            ...dto,
            dateNaissance: new Date(dto.dateNaissance),
            dateInscription: dto.dateInscription ? new Date(dto.dateInscription) : new Date(),
            etablissementId,
            statut: requireValidation ? StatutEleve.EN_ATTENTE_VALIDATION : StatutEleve.ACTIF,
        });

        await this.repo.save(eleve);

        // Créer le workflow de validation si requis
        if (requireValidation && req?.utilisateur?.id) {
            await validationWorkflowService.createWorkflow({
                module: 'eleves',
                entiteId: eleve.id,
                entiteType: 'Eleve',
                niveauxRequis: 2,
                etablissementId,
                commentaire: `Inscription élève: ${dto.matricule}`,
            }, req.utilisateur.id);
        }
        
        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_CREATE,
                cible: 'Eleve',
                cibleId: eleve.id,
                description: `Création dossier élève: ${dto.matricule}`,
                nouvellesValeurs: dto,
                module: 'eleves',
            }, req);
        }
        
        logger.info(`Dossier élève créé: ${dto.matricule}`);
        return eleve;
    }

    /**
     * Rechercher tous les élèves avec pagination et filtres
     */
    async findAll(query: QueryElevesDto, etablissementId?: string): Promise<PaginatedResult<Eleve>> {
        const { page, limit, search, sousSysteme, classeId, statut } = query;

        const qb = this.repo
            .createQueryBuilder('e')
            .leftJoinAndSelect('e.utilisateur', 'u')
            .where('1=1');

        // Filtre par établissement (multi-tenancy)
        if (etablissementId) {
            qb.andWhere('e.etablissementId = :etablissementId', { etablissementId });
        }

        // Filtres optionnels
        if (sousSysteme) {
            qb.andWhere('e.sousSysteme = :sousSysteme', { sousSysteme });
        }

        if (statut) {
            qb.andWhere('e.statut = :statut', { statut });
        }

        // Recherche textuelle
        if (search) {
            qb.andWhere(
                '(e.matricule ILIKE :search OR e.nomTuteur ILIKE :search OR e.lieuNaissance ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Tri avec validation
        const allowedFields = ['createdAt', 'matricule', 'nomTuteur', 'dateInscription', 'statut'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        qb.orderBy(`e.${orderField}`, query.sortOrder);

        // Pagination optimisée
        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    async findOne(id: string): Promise<Eleve> {
        const eleve = await this.repo.findOne({ where: { id }, relations: ['utilisateur'] });
        if (!eleve) throw new AppError('Élève non trouvé', 404, 'NOT_FOUND');
        return eleve;
    }

    async findByUserId(userId: string): Promise<Eleve | null> {
        return this.repo.findOne({ where: { utilisateurId: userId } });
    }

    async update(id: string, dto: UpdateEleveDto, req?: Request): Promise<Eleve> {
        const eleve = await this.findOne(id);
        const anciennesValeurs = {
            matricule: eleve.matricule,
            nomTuteur: eleve.nomTuteur,
            telephoneTuteur: eleve.telephoneTuteur,
        };

        if (dto.dateNaissance) dto.dateNaissance = new Date(dto.dateNaissance) as any;
        if (dto.dateInscription) dto.dateInscription = new Date(dto.dateInscription) as any;

        Object.assign(eleve, dto);
        await this.repo.save(eleve);
        
        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_UPDATE,
                cible: 'Eleve',
                cibleId: eleve.id,
                description: `Modification dossier élève: ${eleve.matricule}`,
                anciennesValeurs,
                nouvellesValeurs: dto,
                module: 'eleves',
            }, req);
        }
        
        return eleve;
    }

    async delete(id: string, req?: Request): Promise<void> {
        const eleve = await this.findOne(id);
        await this.repo.remove(eleve);
        
        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_DELETE,
                cible: 'Eleve',
                cibleId: id,
                description: `Suppression dossier élève: ${eleve.matricule}`,
                anciennesValeurs: { matricule: eleve.matricule },
                module: 'eleves',
                severity: 'WARNING' as any,
            }, req);
        }
        
        logger.info(`Dossier élève supprimé: ${id}`);
    }

    // ==================================
    // MÉTHODES DASHBOARD
    // ==================================

    /**
     * Statistiques générales pour le dashboard
     */
    async getDashboardStats(context?: { etablissementId?: string }): Promise<{
        total: number;
        actifs: number;
        inactifs: number;
        parGenre: { masculin: number; feminin: number };
    }> {
        const where: any = {};
        if (context?.etablissementId) {
            where.etablissementId = context.etablissementId;
        }

        const total = await this.repo.count({ where });
        const actifs = await this.repo.count({ where: { ...where, statut: 'ACTIF' } });
        const inactifs = await this.repo.count({ where: { ...where, statut: 'INACTIF' } });

        // Par genre
        const males = await this.repo.count({ where: { ...where, genre: 'M' } });
        const females = await this.repo.count({ where: { ...where, genre: 'F' } });

        return {
            total,
            actifs,
            inactifs,
            parGenre: {
                masculin: males,
                feminin: females,
            }
        };
    }

    /**
     * Répartition des élèves par classe
     */
    async getRepartitionParClasse(context?: { etablissementId?: string }): Promise<{
        classes: Array<{ nom: string; effectif: number }>;
    }> {
        const qb = this.repo
            .createQueryBuilder('e')
            .leftJoin('e.classe', 'c')
            .select('c.libelle', 'nom')
            .addSelect('COUNT(e.id)', 'effectif')
            .where('e.statut = :statut', { statut: 'ACTIF' });

        if (context?.etablissementId) {
            qb.andWhere('e.etablissementId = :etablissementId', { etablissementId: context.etablissementId });
        }

        qb.groupBy('c.libelle')
          .orderBy('effectif', 'DESC');

        const result = await qb.getRawMany();

        return {
            classes: result.map((r: any) => ({
                nom: r.nom || 'Sans classe',
                effectif: parseInt(r.effectif),
            }))
        };
    }

    /**
     * Dernières inscriptions d'élèves
     */
    async getDernieresInscriptions(
        limit: number = 10,
        context?: { etablissementId?: string }
    ): Promise<{
        inscriptions: Array<{
            id: string;
            matricule: string;
            nom: string;
            prenom: string;
            dateInscription: Date;
            classe?: string;
        }>;
    }> {
        const qb = this.repo
            .createQueryBuilder('e')
            .leftJoin('e.classe', 'c')
            .select(['e.id', 'e.matricule', 'e.nom', 'e.prenom', 'e.dateInscription', 'c.libelle'])
            .where('e.statut = :statut', { statut: 'ACTIF' });

        if (context?.etablissementId) {
            qb.andWhere('e.etablissementId = :etablissementId', { etablissementId: context.etablissementId });
        }

        qb.orderBy('e.dateInscription', 'DESC')
          .limit(limit);

        const inscriptions = await qb.getMany();

        return {
            inscriptions: inscriptions.map(e => ({
                id: e.id,
                matricule: e.matricule,
                nom: (e as any).nom || '',
                prenom: (e as any).prenom || '',
                dateInscription: e.dateInscription,
                classe: (e as any).classe?.libelle,
            }))
        };
    }

    // ==================================
    // PRÉINSCRIPTION ET INSCRIPTION
    // ==================================

    /**
     * Créer une préinscription (auto ou par personnel)
     */
    async createPreinscription(dto: PreinscriptionDto, etablissementId?: string): Promise<Eleve> {
        // Générer matricule provisoire
        const annee = new Date().getFullYear();
        const count = await this.repo.count({ where: { estPreinscription: true } });
        const matricule = `PRE-${annee}-${String(count + 1).padStart(5, '0')}`;

        // Construire les informations complètes des parents/responsables
        const informationsParents = {
            pere: {
                nom: dto.nomPere,
                profession: dto.professionPere,
                telephone: dto.telephonePere,
                email: dto.emailPere,
                adresse: dto.adressePere,
            },
            mere: {
                nom: dto.nomMere,
                profession: dto.professionMere,
                telephone: dto.telephoneMere,
                email: dto.emailMere,
                adresse: dto.adresseMere,
            },
            tuteur: {
                nom: dto.nomTuteur,
                lienParente: dto.lienParenteTuteur,
                profession: dto.professionTuteur,
                telephone: dto.telephoneTuteur,
                email: dto.emailTuteur,
                adresse: dto.adresseTuteur,
            },
            situationFamiliale: dto.situationFamiliale,
            personneAutorisee: dto.personneAutorisee,
            contactPrincipal: dto.email,
        };

        // Construire les informations complémentaires
        const informationsComplementaires = {
            transportScolaire: dto.transportScolaire,
            cantine: dto.cantine,
            commentaire: dto.commentaire,
            contactUrgence: {
                nom: dto.nomContactUrgence,
                telephone: dto.telephoneContactUrgence,
            },
        };

        const eleve = this.repo.create({
            utilisateurId: '', // Sera mis à jour lors de la conversion
            matricule,
            
            // IDENTITÉ DE L'ÉLÈVE
            nom: dto.nom,
            prenom: dto.prenom,
            dateNaissance: new Date(dto.dateNaissance),
            lieuNaissance: dto.lieuNaissance,
            sexe: dto.sexe,
            nationalite: dto.nationalite,
            sousSysteme: dto.sousSysteme,
            
            // INFORMATIONS MÉDICALES ET URGENCE
            photo: dto.photo,
            groupeSanguin: dto.groupeSanguin,
            allergies: dto.allergies,
            nomContactUrgence: dto.nomContactUrgence,
            telephoneContactUrgence: dto.telephoneContactUrgence,
            
            // ADRESSE
            adresseDomicile: dto.adresseDomicile,
            ville: dto.ville,
            quartier: dto.quartier,
            
            // HISTORIQUE SCOLAIRE
            ecoleProvenance: dto.ecoleProvenance,
            classeAnterieure: dto.classeAnterieure,
            redoublement: dto.redoublement || false,
            
            // SITUATION PARTICULIÈRE
            boursier: dto.boursier || false,
            regimeInterne: dto.regimeInterne || false,
            
            // INFORMATIONS PÈRE
            nomPere: dto.nomPere,
            professionPere: dto.professionPere,
            telephonePere: dto.telephonePere,
            emailPere: dto.emailPere,
            adressePere: dto.adressePere,
            
            // INFORMATIONS MÈRE
            nomMere: dto.nomMere,
            professionMere: dto.professionMere,
            telephoneMere: dto.telephoneMere,
            emailMere: dto.emailMere,
            adresseMere: dto.adresseMere,
            
            // INFORMATIONS TUTEUR
            nomTuteur: dto.nomTuteur,
            lienParenteTuteur: dto.lienParenteTuteur,
            professionTuteur: dto.professionTuteur,
            telephoneTuteur: dto.telephoneTuteur,
            emailTuteur: dto.emailTuteur,
            adresseTuteur: dto.adresseTuteur,
            
            // CONTACT PRINCIPAL ET SERVICES
            emailPrincipal: dto.email,
            transportScolaire: dto.transportScolaire || false,
            cantine: dto.cantine || false,
            situationFamiliale: dto.situationFamiliale,
            personneAutorisee: dto.personneAutorisee,
            
            // INSCRIPTION
            dateInscription: new Date(),
            etablissementId,
            typeInscription: dto.email ? 'PORTAIL' : 'MANUELLE',
            etatInscription: 'EN_ATTENTE_VALIDATION',
            statut: StatutEleve.EN_ATTENTE_VALIDATION,
            estPreinscription: true,
            classeSouhaiteeId: dto.classeSouhaiteeId,
            
            // DOCUMENTS
            documentsJustificatifs: dto.documentsJustificatifs?.map(doc => ({
                ...doc,
                dateUpload: new Date().toISOString(),
            })),
            
            // COMMENTAIRE
            commentaireRefus: dto.commentaire, // Utilisé pour remarques générales
        });

        // Si l'entity Eleve a un champ JSON pour les informations parents, le peupler
        // Pour l'instant, on utilise les champs existants et on log les infos supplémentaires
        logger.info(`Préinscription - Informations parents: ${JSON.stringify(informationsParents)}`);
        logger.info(`Préinscription - Informations complémentaires: ${JSON.stringify(informationsComplementaires)}`);

        await this.repo.save(eleve);

        // Audit enrichi
        await auditService.logCRUD(
            'CREATE',
            'Preinscription',
            'SYSTEM',
            eleve.id,
            undefined,
            {
                matricule,
                nom: dto.nom,
                prenom: dto.prenom,
                informationsParents,
                informationsComplementaires,
                classeSouhaiteeId: dto.classeSouhaiteeId,
                documentsCount: dto.documentsJustificatifs?.length || 0,
            }
        );

        logger.info(`Préinscription créée: ${matricule} - Élève: ${dto.nom} ${dto.prenom}`);

        // TODO: Envoyer notification au personnel de l'établissement
        // await notificationsService.create({...})

        return eleve;
    }

    /**
     * Convertir une préinscription en inscription complète
     */
    async convertirPreinscriptionEnInscription(
        preinscriptionId: string,
        dto: ConvertirPreinscriptionDto,
        personnelId: string,
        req?: Request
    ): Promise<Eleve> {
        const preinscription = await this.findOne(preinscriptionId);

        if (!preinscription.estPreinscription) {
            throw new AppError('Cet élève n\'est pas une préinscription', 400, 'NOT_PREINSCRIPTION');
        }

        if (preinscription.etatInscription !== 'EN_ATTENTE_VALIDATION') {
            throw new AppError('Cette préinscription ne peut pas être convertie', 400, 'INVALID_STATUS');
        }

        const anciennesValeurs = {
            estPreinscription: preinscription.estPreinscription,
            etatInscription: preinscription.etatInscription,
            statut: preinscription.statut,
        };

        preinscription.estPreinscription = false;
        preinscription.etatInscription = 'VALIDE';
        preinscription.statut = StatutEleve.ACTIF;
        preinscription.dateTraitementInscription = new Date();
        preinscription.traitePar = personnelId;

        await this.repo.save(preinscription);

        // ==================================
        // MIGRATION DES PARENTS VERS ResponsableEleve
        // ==================================
        let migrationResult = null;
        try {
            logger.info(`[Conversion] Migration des parents vers ResponsableEleve pour ${preinscription.matricule}`);
            
            migrationResult = await parentsService.migrerDepuisChampsDirects(preinscription);
            
            logger.info(`[Conversion] Migration terminée: ${migrationResult.parentsCrees} parent(s) créé(s)`);
            
            if (migrationResult.erreurs.length > 0) {
                logger.warn(`[Conversion] Erreurs de migration:`, migrationResult.erreurs);
            }
        } catch (error) {
            logger.error(`[Conversion] Erreur lors de la migration des parents:`, error);
            // Ne pas bloquer la conversion si la migration échoue
            // La migration pourra être relancée manuellement
        }

        // Audit enrichi
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_UPDATE,
                cible: 'Eleve',
                cibleId: preinscription.id,
                description: `Conversion préinscription → inscription: ${preinscription.matricule}`,
                anciennesValeurs,
                nouvellesValeurs: {
                    estPreinscription: false,
                    etatInscription: 'VALIDE',
                    statut: StatutEleve.ACTIF,
                    migrationParents: migrationResult ? {
                        parentsCrees: migrationResult.parentsCrees,
                        erreurs: migrationResult.erreurs.length,
                    } : null,
                },
                module: 'eleves',
            }, req);
        }

        logger.info(`Préinscription convertie en inscription: ${preinscription.matricule} (${migrationResult?.parentsCrees || 0} parents migrés)`);

        return preinscription;
    }

    /**
     * Refuser une préinscription
     */
    async refuserPreinscription(
        preinscriptionId: string,
        motif: string,
        personnelId: string,
        req?: Request
    ): Promise<Eleve> {
        const preinscription = await this.findOne(preinscriptionId);

        if (!preinscription.estPreinscription) {
            throw new AppError('Cet élève n\'est pas une préinscription', 400, 'NOT_PREINSCRIPTION');
        }

        if (preinscription.etatInscription !== 'EN_ATTENTE_VALIDATION') {
            throw new AppError('Cette préinscription ne peut pas être refusée', 400, 'INVALID_STATUS');
        }

        preinscription.etatInscription = 'REFUSE';
        preinscription.statut = StatutEleve.EXCLU;
        preinscription.commentaireRefus = motif;
        preinscription.dateTraitementInscription = new Date();
        preinscription.traitePar = personnelId;

        await this.repo.save(preinscription);

        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_UPDATE,
                cible: 'Eleve',
                cibleId: preinscription.id,
                description: `Refus préinscription: ${preinscription.matricule}`,
                nouvellesValeurs: {
                    etatInscription: 'REFUSE',
                    commentaireRefus: motif,
                },
                module: 'eleves',
                severity: 'WARNING' as any,
            }, req);
        }

        logger.info(`Préinscription refusée: ${preinscription.matricule} - Motif: ${motif}`);

        return preinscription;
    }

    /**
     * Lister les préinscriptions en attente
     */
    async findPreinscriptionsEnAttente(
        query: QueryElevesDto,
        etablissementId?: string
    ): Promise<PaginatedResult<Eleve>> {
        const { page, limit, search } = query;

        const qb = this.repo
            .createQueryBuilder('e')
            .leftJoinAndSelect('e.utilisateur', 'u')
            .where('e.estPreinscription = :estPreinscription', { estPreinscription: true })
            .andWhere('e.etatInscription = :etatInscription', { etatInscription: 'EN_ATTENTE_VALIDATION' });

        if (etablissementId) {
            qb.andWhere('e.etablissementId = :etablissementId', { etablissementId });
        }

        if (search) {
            qb.andWhere(
                '(e.matricule ILIKE :search OR e.nomTuteur ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        qb.orderBy('e.createdAt', 'DESC' as const);

        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    /**
     * Upload un document justificatif
     */
    async uploadDocumentJustificatif(
        eleveId: string,
        documentUrl: string,
        type: string,
        req?: Request
    ): Promise<Eleve> {
        const eleve = await this.findOne(eleveId);

        const documents = eleve.documentsJustificatifs || [];
        documents.push({
            url: documentUrl,
            type,
            dateUpload: new Date().toISOString(),
        });

        eleve.documentsJustificatifs = documents;
        await this.repo.save(eleve);

        logger.info(`Document justificatif ajouté pour élève ${eleveId}: ${type}`);

        return eleve;
    }

    /**
     * Exporte les élèves en CSV
     */
    async exportElevesCSV(
        filtres: { search?: string; classeId?: string; anneeScolaireId?: string; statut?: string },
        etablissementId: string
    ): Promise<string> {
        const eleves = await this.repo.find({
            where: {
                etablissementId,
                ...(filtres.search && {
                    nom: Like(`%${filtres.search}%`),
                }),
                ...(filtres.classeId && { classeId: filtres.classeId }),
                ...(filtres.anneeScolaireId && { anneeScolaireId: filtres.anneeScolaireId }),
                ...(filtres.statut && { statut: filtres.statut as any }),
            },
            relations: ['classe'],
            order: { createdAt: 'DESC' },
            take: 10000,
        });

        // En-têtes CSV
        const headers = [
            'Matricule',
            'Nom',
            'Prénom',
            'Date de naissance',
            'Lieu de naissance',
            'Sexe',
            'Nationalité',
            'Classe',
            'Statut',
            'Téléphone',
            'Email',
            'Adresse',
        ];

        // Données
        const rows = eleves.map((e) => [
            e.matricule,
            e.nom,
            e.prenom,
            e.dateNaissance?.toISOString().split('T')[0] || '',
            e.lieuNaissance || '',
            e.sexe === 'M' ? 'Masculin' : 'Féminin',
            e.nationalite || 'Camerounaise',
            e.classe?.nom || '',
            e.statut || 'ACTIF',
            e.utilisateur?.telephone || '',
            e.utilisateur?.email || '',
            e.utilisateur?.adresse || '',
        ]);

        // Construction CSV
        const csvContent = [
            headers.join(';'),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
        ].join('\n');

        logger.info(`Export CSV: ${eleves.length} élèves exportés`);
        return csvContent;
    }

    /**
     * Importe des élèves depuis CSV
     */
    async importElevesCSV(
        csvContent: string,
        etablissementId: string,
        classeAnneeId: string
    ): Promise<{ importe: number; erreurs: number; details: string[] }> {
        // Récupérer l'année scolaire depuis classeAnnee
        const classeAnneeRepo = AppDataSource.getRepository('ClasseAnnee');
        const classeAnnee = await classeAnneeRepo.findOne({
            where: { id: classeAnneeId },
            relations: ['anneeScolaire']
        }) as any;

        if (!classeAnnee) {
            throw new AppError('Classe/Année non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');
        }

        const anneeScolaireId = classeAnnee.anneeScolaireId;
        const lines = csvContent.split('\n').filter((line) => line.trim());
        if (lines.length < 2) {
            throw new AppError('Le fichier CSV est vide ou invalide', 400, 'CSV_INVALID');
        }

        // Ignorer l'en-tête
        const dataLines = lines.slice(1);
        let importe = 0;
        let erreurs = 0;
        const details: string[] = [];

        for (const line of dataLines) {
            try {
                const columns = line.split(';').map((col) => col.replace(/"/g, '').trim());

                if (columns.length < 3) {
                    erreurs++;
                    details.push(`Ligne ignorée (colonnes insuffisantes): ${line}`);
                    continue;
                }

                const [matricule, nom, prenom, dateNaissance, lieuNaissance, sexe] = columns;

                // Vérifier si l'élève existe déjà
                const exists = await this.repo.findOne({
                    where: { matricule, etablissementId },
                });

                if (exists) {
                    erreurs++;
                    details.push(`Matricule ${matricule} déjà existant`);
                    continue;
                }

                // Créer l'élève
                const eleve = this.repo.create({
                    matricule,
                    nom,
                    prenom,
                    dateNaissance: new Date(dateNaissance),
                    lieuNaissance: lieuNaissance || '',
                    sexe: sexe.toLowerCase().startsWith('m') ? 'M' : 'F',
                    nationalite: 'Camerounaise',
                    classeId,
                    anneeScolaireId,
                    etablissementId,
                    statut: 'ACTIF',
                });

                await this.repo.save(eleve);
                importe++;
            } catch (error: any) {
                erreurs++;
                details.push(`Erreur ligne: ${error.message}`);
            }
        }

        logger.info(`Import CSV: ${importe} importés, ${erreurs} erreurs`);
        return { importe, erreurs, details };
    }

    /**
     * NOUVEAU: Récupère la classe actuelle d'un élève via AffectationEleve
     * 
     * @param eleveId - ID de l'élève
     * @param anneeScolaireId - ID de l'année scolaire (optionnel, défaut: année en cours)
     * @returns La classe de l'élève ou null si aucune affectation active
     */
    async getClasseActuelle(
        eleveId: string,
        anneeScolaireId?: string
    ): Promise<Classe | null> {
        const affectationRepo = AppDataSource.getRepository(AffectationEleve);
        
        let anneeId = anneeScolaireId;
        
        // Si pas d'année spécifiée, trouver l'année en cours de l'établissement
        if (!anneeId) {
            const eleve = await this.findOne(eleveId);
            const anneeRepo = AppDataSource.getRepository(AnneeScolaire);
            const anneeEnCours = await anneeRepo.findOne({
                where: {
                    etablissementId: eleve.etablissementId,
                    enCours: true
                }
            });
            anneeId = anneeEnCours?.id;
        }

        if (!anneeId) return null;

        // Chercher l'affectation active
        const affectation = await affectationRepo.findOne({
            where: {
                eleveId,
                anneeScolaireId: anneeId,
                actif: true
            },
            relations: ['classe', 'classe.niveau', 'classe.filiere']
        });

        return affectation?.classe || null;
    }
}

export const elevesService = new ElevesService();
