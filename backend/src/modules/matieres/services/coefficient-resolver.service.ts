/**
 * ==================================
 * eLISAschool - Résolveur central Coefficient / Barème
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Source unique de vérité pour la résolution du coefficient et du barème
 * d'une matière dans le contexte d'une classe-année (arbitrage A1) :
 *
 *   1. AffectationMatiere active (coefficient uniquement — pas de barème)
 *   2. ProgrammeMatiere du programme de la ClasseAnnee (coefficient uniquement)
 *   3. MatiereNiveau (coefficient + barème)
 *   4. Défaut : { coefficient: 1, bareme: 20 }
 *
 * Le barème vit UNIQUEMENT sur MatiereNiveau (défaut 20).
 * Tous les consommateurs (notes, bulletins, matieres, dashboard) DOIVENT
 * passer par ce service — ne jamais dupliquer la chaîne de résolution.
 */

import { In, Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { MatiereNiveau, StatutMatiereNiveau } from '../entities/matiere-niveau.entity';
import { AffectationMatiere } from '../entities/affectation-matiere.entity';
import { ClasseAnnee } from '@modules/classes/entities';
import { ProgrammeMatiere } from '@modules/programmes/entities';

export interface CoefficientResolu {
    coefficient: number;
    bareme: number;
    source: 'affectation' | 'programme' | 'matiere_niveau' | 'defaut';
}

const COEFFICIENT_DEFAUT = 1;
const BAREME_DEFAUT = 20;

interface ContexteClasseAnnee {
    niveauId: string;
    filiereId?: string;
    programmeId?: string;
}

export class CoefficientResolverService {
    private classeAnneeRepo: Repository<ClasseAnnee>;
    private affectationRepo: Repository<AffectationMatiere>;
    private matiereNiveauRepo: Repository<MatiereNiveau>;
    private programmeMatiereRepo: Repository<ProgrammeMatiere>;

    constructor() {
        this.classeAnneeRepo = AppDataSource.getRepository(ClasseAnnee);
        this.affectationRepo = AppDataSource.getRepository(AffectationMatiere);
        this.matiereNiveauRepo = AppDataSource.getRepository(MatiereNiveau);
        this.programmeMatiereRepo = AppDataSource.getRepository(ProgrammeMatiere);
    }

    /**
     * Résout coefficient + barème pour une matière dans une classe-année.
     */
    async resoudreCoefficient(
        classeAnneeId: string,
        matiereId: string,
        etablissementId: string
    ): Promise<CoefficientResolu> {
        const resultats = await this.resoudreCoefficients(classeAnneeId, [matiereId], etablissementId);
        return resultats.get(matiereId) ?? { coefficient: COEFFICIENT_DEFAUT, bareme: BAREME_DEFAUT, source: 'defaut' };
    }

    /**
     * Résolution batch (3 requêtes max après le chargement du contexte — pas de N+1).
     * Retourne une Map matiereId → CoefficientResolu.
     */
    async resoudreCoefficients(
        classeAnneeId: string,
        matiereIds: string[],
        etablissementId: string
    ): Promise<Map<string, CoefficientResolu>> {
        const resultats = new Map<string, CoefficientResolu>();
        if (matiereIds.length === 0) return resultats;

        const contexte = await this.chargerContexte(classeAnneeId, etablissementId);

        // Requête 1 : affectations matières actives de la classe-année
        const affectations = await this.affectationRepo.find({
            where: {
                classeAnneeId,
                matiereId: In(matiereIds),
                etablissementId,
                actif: true,
            },
            select: ['matiereId', 'coefficient'],
        });
        const coefParAffectation = new Map<string, number>();
        for (const aff of affectations) {
            if (aff.coefficient !== null && aff.coefficient !== undefined) {
                coefParAffectation.set(aff.matiereId, aff.coefficient);
            }
        }

        // Requête 2 : grilles matière-niveau du niveau de la classe
        const matieresNiveaux = await this.matiereNiveauRepo.find({
            where: {
                matiereId: In(matiereIds),
                niveauId: contexte.niveauId,
            },
        });
        const mnParMatiere = this.selectionnerMatieresNiveaux(matieresNiveaux, contexte.filiereId);

        // Requête 3 : overrides du programme de la classe-année (si programme associé)
        const coefParProgramme = new Map<string, number>();
        if (contexte.programmeId && matieresNiveaux.length > 0) {
            const programmesMatieres = await this.programmeMatiereRepo.find({
                where: {
                    programmeId: contexte.programmeId,
                    matiereNiveauId: In(matieresNiveaux.map((mn) => mn.id)),
                },
                select: ['matiereNiveauId', 'coefficient'],
            });
            const mnById = new Map(matieresNiveaux.map((mn) => [mn.id, mn]));
            for (const pm of programmesMatieres) {
                const mn = mnById.get(pm.matiereNiveauId);
                if (!mn) continue;
                // La MatiereNiveau rattachée au programme prime sur la sélection heuristique
                mnParMatiere.set(mn.matiereId, mn);
                if (pm.coefficient !== null && pm.coefficient !== undefined) {
                    coefParProgramme.set(mn.matiereId, pm.coefficient);
                }
            }
        }

        for (const matiereId of matiereIds) {
            const mn = mnParMatiere.get(matiereId);
            const bareme = mn?.bareme ?? BAREME_DEFAUT;

            const coefAffectation = coefParAffectation.get(matiereId);
            if (coefAffectation !== undefined) {
                resultats.set(matiereId, { coefficient: coefAffectation, bareme, source: 'affectation' });
                continue;
            }

            const coefProgramme = coefParProgramme.get(matiereId);
            if (coefProgramme !== undefined) {
                resultats.set(matiereId, { coefficient: coefProgramme, bareme, source: 'programme' });
                continue;
            }

            if (mn && mn.coefficient !== null && mn.coefficient !== undefined) {
                resultats.set(matiereId, { coefficient: mn.coefficient, bareme, source: 'matiere_niveau' });
                continue;
            }

            resultats.set(matiereId, { coefficient: COEFFICIENT_DEFAUT, bareme, source: 'defaut' });
        }

        return resultats;
    }

    /**
     * Lookup déterministe d'une MatiereNiveau pour (matiereId, niveauId, filiereId?).
     * Applique le même scoring que la résolution batch (filière exacte > filière NULL,
     * ACTIF > autres, plus ancienne). Retourne null si aucune candidate éligible.
     */
    async resoudreMatiereNiveau(
        matiereId: string,
        niveauId: string,
        filiereId?: string
    ): Promise<MatiereNiveau | null> {
        if (!matiereId || !niveauId) return null;
        const candidates = await this.matiereNiveauRepo.find({
            where: { matiereId, niveauId },
        });
        const selection = this.selectionnerMatieresNiveaux(candidates, filiereId);
        return selection.get(matiereId) ?? null;
    }

    /**
     * Charge le contexte de la classe-année (niveau, filière, programme) avec garde tenant.
     */
    private async chargerContexte(classeAnneeId: string, etablissementId: string): Promise<ContexteClasseAnnee> {
        const classeAnnee = await this.classeAnneeRepo.findOne({
            where: { id: classeAnneeId, etablissementId },
            relations: ['classe'],
        });

        if (!classeAnnee || !classeAnnee.classe) {
            throw new AppError('Classe-année introuvable pour cet établissement', 404, 'CLASSE_ANNEE_NOT_FOUND');
        }

        return {
            niveauId: classeAnnee.classe.niveauId,
            filiereId: classeAnnee.classe.filiereId,
            programmeId: classeAnnee.programmeId,
        };
    }

    /**
     * Sélection déterministe d'une MatiereNiveau par matière quand plusieurs
     * candidates existent pour (matiereId, niveauId) :
     *   1. Filière exacte > filière NULL (toutes filières) ; autres filières exclues
     *   2. Statut ACTIF > autres statuts
     *   3. Plus ancienne (createdAt ASC) pour stabilité
     */
    private selectionnerMatieresNiveaux(
        candidates: MatiereNiveau[],
        filiereId?: string
    ): Map<string, MatiereNiveau> {
        const parMatiere = new Map<string, MatiereNiveau>();

        const score = (mn: MatiereNiveau): number => {
            let s = 0;
            if (filiereId && mn.filiereId === filiereId) s += 4;
            else if (!mn.filiereId) s += 2;
            else return -1; // filière différente → exclue
            if (mn.statut === StatutMatiereNiveau.ACTIF) s += 1;
            return s;
        };

        for (const mn of candidates) {
            const sMn = score(mn);
            if (sMn < 0) continue;
            const actuel = parMatiere.get(mn.matiereId);
            if (!actuel) {
                parMatiere.set(mn.matiereId, mn);
                continue;
            }
            const sActuel = score(actuel);
            if (sMn > sActuel || (sMn === sActuel && mn.createdAt < actuel.createdAt)) {
                parMatiere.set(mn.matiereId, mn);
            }
        }

        return parMatiere;
    }
}

// Singleton exporté
export const coefficientResolverService = new CoefficientResolverService();
