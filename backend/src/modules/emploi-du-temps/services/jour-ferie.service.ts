/**
 * ==================================
 * eLISAschool - Service Jours Fériés
 * ==================================
 * CRUD + vérification jours fériés pour une plage de dates
 * Multi-tenant : global (null) + par établissement
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository, Brackets, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { JourFerie, PaysJourFerie } from '../entities/jour-ferie.entity';
import { CreateJourFerieDto, UpdateJourFerieDto } from '../dto/jour-ferie.dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { auditService, AuditAction } from '@modules/auth';
import { Request } from 'express';
import { MODELES_PAYS, genererJFPourPays } from '@database/seeds/system/seed-jours-feries';

/**
 * Formate une Date en chaîne 'YYYY-MM-DD' en heure locale (pas UTC).
 * Évite le bug toISOString() qui décale d'un jour pour les fuseaux positifs.
 */
export function formatDateLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const j = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${j}`;
}

/**
 * Algorithme de Computus (Meeus/Jones/Butcher) — Calcul de la date de Pâques.
 * Retourne un objet Date (Pâques = dimanche) pour l'année donnée.
 * Valide pour le calendrier grégorien (années 1583+).
 */
export function calculerPaques(annee: number): Date {
    const a = annee % 19;
    const b = Math.floor(annee / 100);
    const c = annee % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mois = Math.floor((h + l - 7 * m + 114) / 31); // 3=mars, 4=avril
    const jour = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(annee, mois - 1, jour);
}

/**
 * Jours fériés variables chrétiens dérivés de Pâques.
 * Retourne un map { nom: Date } pour l'année donnée.
 */
export function calculerVariablesChretiennes(annee: number): Record<string, Date> {
    const paques = calculerPaques(annee);
    const lundiPaques = new Date(paques);
    lundiPaques.setDate(paques.getDate() + 1);
    const ascension = new Date(paques);
    ascension.setDate(paques.getDate() + 39); // Jeudi, 39 jours après Pâques
    const lundiPentecote = new Date(paques);
    lundiPentecote.setDate(paques.getDate() + 50); // Lundi, 50 jours après Pâques
    return {
        'Lundi de Pâques': lundiPaques,
        'Ascension': ascension,
        'Lundi de Pentecôte': lundiPentecote,
    };
}

export class JourFerieService {
    private repo: Repository<JourFerie>;

    constructor() {
        this.repo = AppDataSource.getRepository(JourFerie);
    }

    /**
     * Filtre QueryBuilder : exclut les JF globaux quand une copie établissement
     * existe (même nom + même pays). Résout la duplication global/copie.
     */
    private appliquerDeduplication(qb: ReturnType<typeof this.repo.createQueryBuilder>, alias = 'jf'): void {
        qb.andWhere(
            `NOT EXISTS (
                SELECT 1 FROM jours_feries copie
                WHERE copie."nom" = ${alias}."nom"
                  AND copie."pays" IS NOT DISTINCT FROM ${alias}."pays"
                  AND copie."etablissementId" IS NOT NULL
                  AND ${alias}."etablissementId" IS NULL
            )`
        );
    }

    /**
     * Créer un jour férié.
     * Vérifie l'unicité par nom + pays + établissement.
     * Force etablissementId depuis le contexte si disponible.
     */
    async create(dto: CreateJourFerieDto, req?: Request): Promise<JourFerie> {
        // Forcer etablissementId depuis le contexte (multi-tenant)
        const contexteEtabId = (req as any)?.etablissementId;
        const etablissementId = contexteEtabId || dto.etablissementId;

        // Vérifier unicité (même nom + même pays + même établissement)
        const where: Record<string, any> = {
            nom: dto.nom,
            pays: dto.pays ?? undefined,
            etablissementId: etablissementId ?? undefined,
        };
        const existing = await this.repo.findOne({ where });
        if (existing) {
            throw new AppError('Un jour férié avec ce nom existe déjà pour ce contexte', 409, 'JOUR_FERIE_EXISTS');
        }

        const entity = this.repo.create({
            ...dto,
            etablissementId,
            date: dto.date ? new Date(dto.date) : null,
        });
        const saved = await this.repo.save(entity);

        // Audit trail
        await auditService.log({
            action: AuditAction.JOUR_FERIE_CREATE,
            utilisateurId: (req as any)?.utilisateur?.id,
            cible: 'JourFerie',
            cibleId: saved.id,
            description: `Création jour férié : ${saved.nom}`,
            nouvellesValeurs: { nom: saved.nom, pays: saved.pays, estRecurrent: saved.estRecurrent },
            etablissementId: saved.etablissementId ?? undefined,
        }, req);

        logger.info(`[JoursFeries] Créé : ${saved.nom}`);
        return saved;
    }

    /**
     * Lister tous les jours fériés (global + établissement spécifique)
     * Avec pagination optionnelle et déduplication global/copie.
     */
    async findAll(etablissementId?: string, page?: number, limit?: number): Promise<JourFerie[] | PaginatedResult<JourFerie>> {
        const qb = this.repo.createQueryBuilder('jf');
        qb.where(
            new Brackets((sub) => {
                sub.where('jf.etablissementId IS NULL');
                if (etablissementId) {
                    sub.orWhere('jf.etablissementId = :etabId', { etabId: etablissementId });
                }
            })
        );
        // Déduplication : exclure les globaux dont une copie établissement existe
        this.appliquerDeduplication(qb);
        qb.orderBy('jf.mois', 'ASC').addOrderBy('jf.jourMois', 'ASC').addOrderBy('jf.date', 'ASC');

        if (page && limit) {
            return paginateWithQueryBuilder(qb, page, limit);
        }
        return qb.getMany();
    }

    /**
     * Lister les jours fériés pour une année donnée (récurrents + ponctuels de l'année)
     * Avec déduplication global/copie.
     */
    async findByAnnee(annee: number, etablissementId?: string): Promise<JourFerie[]> {
        const qb = this.repo.createQueryBuilder('jf');

        qb.where(
            new Brackets((sub) => {
                sub.where('jf.etablissementId IS NULL');
                if (etablissementId) {
                    sub.orWhere('jf.etablissementId = :etabId', { etabId: etablissementId });
                }
            })
        );

        // Récurrents (tous les ans) OU ponctuels dans l'année
        qb.andWhere(
            new Brackets((sub) => {
                sub.where('jf.estRecurrent = true')
                    .orWhere(
                        'jf.date >= :debut AND jf.date <= :fin',
                        {
                            debut: `${annee}-01-01`,
                            fin: `${annee}-12-31`,
                        }
                    );
            })
        );

        // Déduplication : exclure les globaux dont une copie établissement existe
        this.appliquerDeduplication(qb);

        qb.orderBy('jf.mois', 'ASC').addOrderBy('jf.jourMois', 'ASC').addOrderBy('jf.date', 'ASC');
        return qb.getMany();
    }

    /**
     * Lister les jours fériés pour une plage de dates
     * Avec déduplication global/copie.
     */
    async findByPlageDates(dateDebut: string, dateFin: string, etablissementId?: string): Promise<JourFerie[]> {
        // Parser les dates comme des dates locales (pas UTC)
        const debut = new Date(dateDebut + 'T00:00:00');
        const fin = new Date(dateFin + 'T23:59:59');
        const anneeDebut = debut.getFullYear();
        const anneeFin = fin.getFullYear();

        // Récupérer les jours fériés récurrents + ponctuels de la plage
        const qb = this.repo.createQueryBuilder('jf');
        qb.where(
            new Brackets((sub) => {
                sub.where('jf.etablissementId IS NULL');
                if (etablissementId) {
                    sub.orWhere('jf.etablissementId = :etabId', { etabId: etablissementId });
                }
            })
        );
        qb.andWhere(
            new Brackets((sub) => {
                sub.where('jf.estRecurrent = true')
                    .orWhere('jf.date >= :debut AND jf.date <= :fin', { debut: dateDebut, fin: dateFin });
            })
        );
        // Déduplication : exclure les globaux dont une copie établissement existe
        this.appliquerDeduplication(qb);
        const jfGlobal = await qb.getMany();

        // Pour les récurrents, filtrer ceux qui tombent dans la plage
        const result: JourFerie[] = [];
        for (const jf of jfGlobal) {
            if (jf.estRecurrent && jf.mois && jf.jourMois) {
                // Vérifier chaque année de la plage
                for (let annee = anneeDebut; annee <= anneeFin; annee++) {
                    const dateCalc = new Date(annee, jf.mois - 1, jf.jourMois);
                    if (dateCalc >= debut && dateCalc <= fin) {
                        // Clone pur (pas d'instance TypeORM) pour éviter corruption si save() accidentel
                        const enriched = { ...jf, dateCalculee: dateCalc } as JourFerie;
                        result.push(enriched);
                    }
                }
            } else {
                result.push(jf);
            }
        }

        return result.sort((a, b) => {
            const dA = a.dateCalculee ?? (a.date ? new Date(a.date + 'T00:00:00') : new Date());
            const dB = b.dateCalculee ?? (b.date ? new Date(b.date + 'T00:00:00') : new Date());
            return dA.getTime() - dB.getTime();
        });
    }

    /**
     * Trouver un jour férié par ID
     */
    async findOne(id: string): Promise<JourFerie> {
        const jf = await this.repo.findOne({ where: { id } });
        if (!jf) {
            throw new AppError('Jour férié introuvable', 404, 'JOUR_FERIE_NOT_FOUND');
        }
        return jf;
    }

    /**
     * Mettre à jour un jour férié
     */
    async update(id: string, dto: UpdateJourFerieDto, req?: Request): Promise<JourFerie> {
        const jf = await this.findOne(id);
        const anciennesValeurs = { nom: jf.nom, date: jf.date, estRecurrent: jf.estRecurrent, mois: jf.mois, jourMois: jf.jourMois };
        Object.assign(jf, { ...dto, date: undefined });
        if (dto.date !== undefined) {
            jf.date = dto.date ? new Date(dto.date) : null;
        }
        const saved = await this.repo.save(jf);

        // Audit trail
        await auditService.log({
            action: AuditAction.JOUR_FERIE_UPDATE,
            utilisateurId: (req as any)?.utilisateur?.id,
            cible: 'JourFerie',
            cibleId: saved.id,
            description: `Modification jour férié : ${saved.nom}`,
            anciennesValeurs,
            nouvellesValeurs: { nom: saved.nom, date: saved.date, estRecurrent: saved.estRecurrent },
            etablissementId: saved.etablissementId ?? undefined,
        }, req);

        logger.info(`[JoursFeries] Mis à jour : ${saved.nom}`);
        return saved;
    }

    /**
     * Supprimer un jour férié.
     * Seuls les templates globaux (etablissementId=NULL + estSysteme=true) sont protégés.
     * Les copies établissement sont toujours supprimables.
     */
    async delete(id: string, req?: Request): Promise<void> {
        const jf = await this.findOne(id);
        // Protéger uniquement les templates système GLOBAUX (pas les copies établissement)
        if (jf.estSysteme && !jf.etablissementId) {
            throw new AppError(
                'Impossible de supprimer un jour férié système global. Dupliquez-le ou modifiez la copie établissement.',
                403,
                'JOUR_FERIE_SYSTEME'
            );
        }
        await this.repo.remove(jf);

        // Audit trail
        await auditService.log({
            action: AuditAction.JOUR_FERIE_DELETE,
            utilisateurId: (req as any)?.utilisateur?.id,
            cible: 'JourFerie',
            cibleId: id,
            description: `Suppression jour férié : ${jf.nom}`,
            anciennesValeurs: { nom: jf.nom, pays: jf.pays, estRecurrent: jf.estRecurrent },
            etablissementId: jf.etablissementId ?? undefined,
        }, req);

        logger.info(`[JoursFeries] Supprimé : ${jf.nom}`);
    }

    /**
     * Vérifier si une date est un jour férié
     * Requête directe optimisée (pas de findByPlageDates qui expand les récurrents)
     */
    async estJourFerie(date: Date, etablissementId?: string): Promise<{ estFerie: boolean; nom?: string }> {
        const mois = date.getMonth() + 1;
        const jour = date.getDate();
        // ⚠ Utiliser formatDateLocal (heure locale) — PAS toISOString() (UTC, décalage fuseau)
        const dateStr = formatDateLocal(date);

        const qb = this.repo.createQueryBuilder('jf');
        qb.where(
            new Brackets((sub) => {
                sub.where('jf.etablissementId IS NULL');
                if (etablissementId) {
                    sub.orWhere('jf.etablissementId = :etabId', { etabId: etablissementId });
                }
            })
        );
        qb.andWhere(
            new Brackets((sub) => {
                sub.where(
                    '(jf."estRecurrent" = true AND jf.mois = :mois AND jf."jourMois" = :jour)',
                    { mois, jour }
                ).orWhere(
                    'jf."date" = :dateStr',
                    { dateStr }
                );
            })
        );
        qb.select(['jf.nom']);
        qb.limit(1);

        const jf = await qb.getOne();
        if (jf) {
            return { estFerie: true, nom: jf.nom };
        }
        return { estFerie: false };
    }

    /**
     * Charger un modèle de jours fériés par pays pour un établissement.
     * Génère depuis les constantes TypeScript (pas depuis la DB).
     * Vérifie les doublons, conflits et incohérences avant insertion.
     */
    async chargerModelePays(pays: string, etablissementId: string, req?: Request): Promise<JourFerie[]> {
        // Vérifier que le pays est valide
        if (!Object.values(PaysJourFerie).includes(pays as PaysJourFerie)) {
            throw new AppError(`Code pays invalide : ${pays}`, 400, 'PAYS_INVALIDE');
        }

        // Vérifier que le modèle existe dans les constantes
        const modele = MODELES_PAYS.find(m => m.pays === pays);
        if (!modele) {
            throw new AppError(`Aucun modèle de jours fériés trouvé pour le pays ${pays}`, 404, 'MODELE_PAYS_NOT_FOUND');
        }

        // Générer tous les JF pour ce pays (années 2025-2027)
        const jfGeneres = genererJFPourPays(pays, [2025, 2026, 2027]);
        if (jfGeneres.length === 0) {
            throw new AppError(`Modèle vide pour le pays ${pays}`, 500, 'MODELE_VIDE');
        }

        // Transaction pour atomicité (check doublons → insert)
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Vérifier les doublons existants pour cet établissement (par nom + pays)
            // Clé de déduplication :
            // - Récurrents : nom + pays + etablissementId (match l'index unique partiel)
            // - Non récurrents : nom + pays + date + etablissementId (même nom, années différentes OK)
            const existants = await queryRunner.manager.find(JourFerie, {
                where: { pays, etablissementId },
            });
            const clesExistantes = new Set(existants.map(e => {
                if (e.estRecurrent) {
                    return `R::${e.nom}::${e.pays ?? ''}`;
                }
                const dateStr = e.date ? (e.date instanceof Date ? e.date.toISOString().slice(0, 10) : e.date) : '';
                return `NR::${e.nom}::${e.pays ?? ''}::${dateStr}`;
            }));

            // Filtrer : ne copier que les JF qui n'existent pas déjà
            const aCopier = jfGeneres.filter(jf => {
                if (jf.estRecurrent) {
                    const cle = `R::${jf.nom}::${jf.pays}`;
                    return !clesExistantes.has(cle);
                }
                const cle = `NR::${jf.nom}::${jf.pays}::${jf.date ?? ''}`;
                return !clesExistantes.has(cle);
            });

            if (aCopier.length === 0) {
                logger.info(`[JoursFeries] Modèle ${pays} déjà chargé pour l'établissement ${etablissementId}`);
                await queryRunner.commitTransaction();
                return existants;
            }

            // Créer les entités
            const entities = aCopier.map(jf => queryRunner.manager.create(JourFerie, {
                nom: jf.nom,
                date: jf.date ? new Date(jf.date + 'T00:00:00') : null,
                estRecurrent: jf.estRecurrent,
                mois: jf.estRecurrent ? jf.mois : null,
                jourMois: jf.estRecurrent ? jf.jourMois : null,
                couleur: jf.couleur,
                description: jf.description ?? null,
                pays: jf.pays,
                etablissementId,
                estSysteme: false, // Copie établissement = modifiable
            }));

            const saved = await queryRunner.manager.save(entities);
            await queryRunner.commitTransaction();

            // Audit trail (hors transaction, non-bloquant)
            try {
                await auditService.log({
                    action: AuditAction.JOUR_FERIE_CHARGER_MODELE,
                    utilisateurId: (req as any)?.utilisateur?.id,
                    cible: 'JourFerie',
                    description: `Chargement modèle ${pays} : ${saved.length} jours fériés copiés`,
                    nouvellesValeurs: { pays, count: saved.length, etablissementId },
                    etablissementId,
                }, req);
            } catch (auditErr) {
                logger.warn('[JoursFeries] Échec audit trail (non bloquant)', auditErr);
            }

            logger.info(`[JoursFeries] Modèle ${pays} chargé : ${saved.length} jours fériés copiés pour l'établissement ${etablissementId}`);

            // Retourner tous les JF de l'établissement pour ce pays (existants + nouveaux)
            return [...existants, ...saved];
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            // Si contrainte UNIQUE violée (race condition), recharger les existants
            if (error?.code === '23505') {
                logger.warn(`[JoursFeries] Race condition détectée sur chargerModelePays(${pays}, ${etablissementId}), rechargement`);
                return this.repo.find({ where: { pays, etablissementId } });
            }
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Lister les pays disponibles (modèles système).
     * Lit depuis les constantes TypeScript (pas depuis la DB).
     */
    async listerModelesPays(): Promise<{ pays: string; count: number }[]> {
        return MODELES_PAYS.map(m => {
            const total = genererJFPourPays(m.pays, [2025, 2026, 2027]).length;
            return { pays: m.pays, count: total };
        });
    }

    /**
     * Générer les jours fériés variables (chrétiens) pour une année donnée.
     * Utilise l'algorithme de Computus pour calculer Pâques, puis dérive
     * Lundi de Pâques, Ascension, Lundi de Pentecôte.
     * Insère uniquement ceux qui n'existent pas déjà pour l'établissement.
     *
     * Note : les JF islamiques (Aïd, Maouloud...) ne sont PAS calculés ici —
     * calendrier lunaire non déterministe. Ils doivent être saisis manuellement
     * ou chargés via un modèle pays (seeds).
     */
    async genererVariablesAnnee(
        annee: number,
        etablissementId: string,
        pays?: string,
        req?: Request
    ): Promise<JourFerie[]> {
        const variables = calculerVariablesChretiennes(annee);

        // Transaction pour atomicité (check + insert en bloc)
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const created: JourFerie[] = [];

            for (const [nom, date] of Object.entries(variables)) {
                const dateStr = formatDateLocal(date);
                // Vérifier doublon par nom ET par date (évite les doublons si nom différent pour même date)
                const existingByNom = await queryRunner.manager.findOne(JourFerie, {
                    where: {
                        nom,
                        date: new Date(dateStr + 'T00:00:00'),
                        etablissementId: etablissementId ?? undefined,
                    },
                });
                if (existingByNom) continue;

                // Aussi vérifier si un JF existe déjà à cette date (même date, nom différent)
                const existingByDate = await queryRunner.manager.findOne(JourFerie, {
                    where: {
                        date: new Date(dateStr + 'T00:00:00'),
                        etablissementId: etablissementId ?? undefined,
                    },
                });
                if (existingByDate) continue;

                const entity = queryRunner.manager.create(JourFerie, {
                    nom,
                    date: dateStr,
                    estRecurrent: false,
                    couleur: '#6f42c1',
                    pays: pays ?? null,
                    etablissementId,
                    estSysteme: false,
                    description: `Jour férié variable calculé automatiquement (Computus) pour ${annee}`,
                });
                const saved = await queryRunner.manager.save(entity);
                created.push(saved);
            }

            await queryRunner.commitTransaction();

            // Audit trail (hors transaction, non-bloquant)
            if (created.length > 0) {
                try {
                    await auditService.log({
                        action: AuditAction.JOUR_FERIE_CREATE,
                        utilisateurId: (req as any)?.utilisateur?.id,
                        cible: 'JourFerie',
                        description: `Génération variables ${annee} : ${created.length} JF créés (Computus)`,
                        nouvellesValeurs: { annee, count: created.length, pays },
                        etablissementId,
                    }, req);
                } catch (auditErr) {
                    logger.warn('[JoursFeries] Échec audit trail (non bloquant)', auditErr);
                }
                logger.info(`[JoursFeries] Variables ${annee} générées : ${created.length} jours fériés créés`);
            }

            return created;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}

export const jourFerieService = new JourFerieService();
