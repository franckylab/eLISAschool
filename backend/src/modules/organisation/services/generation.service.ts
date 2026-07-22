import { Repository, QueryRunner, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import {
    UniteOrganisationnelle,
    Poste,
    HierarchiePersonnel,
    StatutUnite,
    StatutPoste,
    StatutRelation,
    TemplateOrganisation,
    NoeudTemplateOrganisation,
    TemplatePoste,
    TemplateLienHierarchique,
} from '../entities';
import {
    GenererOrganisationDto,
    ResultatGeneration,
} from '../dto';
import { niveauOrganisationService } from './niveau-organisation.service';
import { usageUniteService } from './usage-unite.service';
import { categoriePosteService } from './categorie-poste.service';
import { niveauResponsabiliteService } from './niveau-responsabilite.service';
import { organisationService } from './organisation.service';

interface GenerationContext {
    etablissementId: string;
    prefixeCode: string;
    creerHierarchie: boolean;
    modeConflit: 'ERROR' | 'SKIP' | 'OVERWRITE';
    queryRunner: QueryRunner;
    result: ResultatGeneration;
    uniteRefMap: Map<string, string>;
    posteRefMap: Map<string, string>;
    niveauOrgMap: Map<string, string>;
    categorieMap: Map<string, string>;
    niveauRespMap: Map<string, string>;
}

function fallbackNiveauResponsabiliteCode(valeur?: string): string | undefined {
    if (valeur && ['DIRECTION_GENERALE', 'DIRECTION_ADJOINTE', 'RESPONSABLE', 'COORDINATEUR', 'SUPERVISEUR', 'EXECUTANT', 'STAGIAIRE'].includes(valeur)) {
        return valeur;
    }
    return 'EXECUTANT';
}

function validerNoeud(noeud: NoeudTemplateOrganisation, chemin: string): void {
    if (!noeud.nom || !noeud.nom.trim()) {
        throw new AppError(
            `Le nœud "${chemin}" a un nom vide. Chaque nœud doit avoir un nom non vide.`,
            400,
            'VALIDATION_ERROR',
        );
    }
    if (noeud.enfants) {
        for (let i = 0; i < noeud.enfants.length; i++) {
            validerNoeud(noeud.enfants[i], `${chemin} > enfant[${i}]`);
        }
    }
}

export class GenerationService {

    async generer(dto: GenererOrganisationDto, etablissementId: string): Promise<ResultatGeneration> {
        // 1. Résoudre la structure
        let structure: NoeudTemplateOrganisation;
        if (dto.templateId) {
            const repo = AppDataSource.getRepository(TemplateOrganisation);
            const template = await repo.findOne({ where: { id: dto.templateId } });
            if (!template) throw new AppError('Template non trouvé', 404, 'TEMPLATE_NOT_FOUND');
            structure = template.structure as NoeudTemplateOrganisation;
        } else if (dto.structure) {
            structure = dto.structure as NoeudTemplateOrganisation;
        } else {
            throw new AppError('templateId ou structure requis', 400, 'VALIDATION_ERROR');
        }

        // 1b. Valider la structure AVANT toute écriture
        validerNoeud(structure, 'racine');

        // 2. Contexte = etablissementId direct
        const context_etablissementId = dto.etablissementId || etablissementId;

        // 3. Préparer contexte et ouvrir transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const context = await this.preparerContexte(context_etablissementId, dto, queryRunner);

            // 4. Générer récursivement
            await this.genererNoeud(structure, null, context);

            // 5. Créer hiérarchie si demandé
            if (context.creerHierarchie && structure.hierarchie) {
                await this.genererHierarchie(structure, context);
            }

            // 6. Construire arborescence retour
            context.result.arborescence = await organisationService.buildArborescence(context_etablissementId);

            await queryRunner.commitTransaction();
            return context.result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async preparerContexte(
        etablissementId: string,
        dto: GenererOrganisationDto,
        queryRunner: QueryRunner,
    ): Promise<GenerationContext> {
        const context: GenerationContext = {
            etablissementId,
            prefixeCode: dto.options?.prefixeCode || '',
            creerHierarchie: dto.options?.creerHierarchie ?? true,
            modeConflit: dto.options?.modeConflit || 'ERROR',
            queryRunner,
            result: {
                unitesCrees: 0,
                postesCrees: 0,
                hierarchiesCrees: 0,
                unites: [],
                postes: [],
                hierarchies: [],
                arborescence: null,
            },
            uniteRefMap: new Map(),
            posteRefMap: new Map(),
            niveauOrgMap: new Map(),
            categorieMap: new Map(),
            niveauRespMap: new Map(),
        };

        const niveaux = await niveauOrganisationService.findAll(etablissementId);
        for (const n of niveaux) {
            context.niveauOrgMap.set(n.label.toLowerCase(), n.id);
        }

        const categories = await categoriePosteService.findAll(etablissementId);
        for (const c of categories) {
            context.categorieMap.set(c.code, c.id);
        }

        const niveauxResp = await niveauResponsabiliteService.findAll(etablissementId);
        for (const nr of niveauxResp) {
            context.niveauRespMap.set(nr.code, nr.code);
        }

        return context;
    }

    private async supprimerArbreUnites(
        uniteId: string,
        queryRunner: QueryRunner,
    ): Promise<void> {
        // 1. Supprimer récursivement les enfants d'abord (feuilles → racine)
        const enfants = await queryRunner.manager.find(UniteOrganisationnelle, {
            where: { parentId: uniteId },
        });
        for (const enfant of enfants) {
            await this.supprimerArbreUnites(enfant.id, queryRunner);
        }

        // 2. Récupérer les postes rattachés à cette unité
        const postes = await queryRunner.manager.find(Poste, {
            where: { uniteOrganisationnelleId: uniteId },
        });
        const posteIds = postes.map((p) => p.id);

        // 3. Nettoyer les dépendances AVANT de supprimer l'unité (respect des contraintes FK)
        if (posteIds.length > 0) {
            // Affectations rattachées aux postes supprimés (CASCADE, mais on anticipe)
            await queryRunner.query(
                'DELETE FROM "affectations_postes" WHERE "posteId" = ANY($1)',
                [posteIds],
            );
            // Liens hiérarchiques référençant ces postes (SET NULL auto, mais on anticipe)
            await queryRunner.manager.delete(HierarchiePersonnel, { posteId: In(posteIds) });
            await queryRunner.manager.delete(HierarchiePersonnel, { superieurId: In(posteIds) });
            // Contrats, bulletins et offres d'emploi référençant ces postes (FK NO ACTION)
            await queryRunner.query(
                'UPDATE "contrats_personnel" SET "posteId" = NULL WHERE "posteId" = ANY($1)',
                [posteIds],
            );
            await queryRunner.query(
                'UPDATE "bulletins_paie" SET "posteId" = NULL WHERE "posteId" = ANY($1)',
                [posteIds],
            );
            await queryRunner.query(
                'UPDATE "offres_emploi" SET "posteId" = NULL WHERE "posteId" = ANY($1)',
                [posteIds],
            );
        }
        // Affectations pointant directement vers l'unité (FK sans ON DELETE = bloquante) :
        // on neutralise la référence dénormalisée sans détruire l'affectation d'un poste survivant.
        await queryRunner.query(
            'UPDATE "affectations_postes" SET "uniteOrganisationnelleId" = NULL WHERE "uniteOrganisationnelleId" = $1',
            [uniteId],
        );
        // Contrats et offres d'emploi référençant directement l'unité (FK NO ACTION)
        await queryRunner.query(
            'UPDATE "contrats_personnel" SET "uniteOrganisationnelleId" = NULL WHERE "uniteOrganisationnelleId" = $1',
            [uniteId],
        );
        await queryRunner.query(
            'UPDATE "offres_emploi" SET "uniteOrganisationnelleId" = NULL WHERE "uniteOrganisationnelleId" = $1',
            [uniteId],
        );

        // 4. Supprimer les postes de l'unité
        if (posteIds.length > 0) {
            await queryRunner.manager.delete(Poste, { uniteOrganisationnelleId: uniteId });
        }

        // 5. Supprimer l'unité elle-même
        await queryRunner.manager.delete(UniteOrganisationnelle, uniteId);
    }

    private async genererNoeud(
        noeud: NoeudTemplateOrganisation,
        parentId: string | null,
        ctx: GenerationContext,
        index: number = 0,
    ): Promise<string | null> {
        const nomNet = noeud.nom.trim();
        const baseCode = `${ctx.prefixeCode}${nomNet.toUpperCase().replace(/\s+/g, '_')}`;
        const code = noeud.count > 1 ? `${baseCode}_${index + 1}` : baseCode;
        const nom = noeud.count > 1 ? `${nomNet} ${index + 1}` : nomNet;

        // Vérifier conflit
        if (ctx.modeConflit !== 'OVERWRITE') {
            const existing = await ctx.queryRunner.manager.findOne(UniteOrganisationnelle, {
                where: { code, etablissementId: ctx.etablissementId },
            });
            if (existing) {
                if (ctx.modeConflit === 'ERROR') {
                    throw new AppError(
                        `Une unité avec le code "${code}" existe déjà dans cette organisation`,
                        409,
                        'UNITE_CODE_CONFLICT',
                    );
                }
                ctx.uniteRefMap.set(nomNet, existing.id);
                ctx.uniteRefMap.set(noeud.usageUnite, existing.id);
                return existing.id;
            }
        } else {
            // OVERWRITE : supprimer l'arbre existant avant de recréer
            const existing = await ctx.queryRunner.manager.findOne(UniteOrganisationnelle, {
                where: { code, etablissementId: ctx.etablissementId },
            });
            if (existing) {
                await this.supprimerArbreUnites(existing.id, ctx.queryRunner);
            }
        }

        const unite = ctx.queryRunner.manager.create(UniteOrganisationnelle, {
            nom,
            code,
            ordre: index,
            etablissementId: ctx.etablissementId,
            parentId: parentId ?? undefined,
            statut: StatutUnite.ACTIF,
            actif: true,
        });
        const savedUnite = await ctx.queryRunner.manager.save(unite);
        ctx.result.unitesCrees++;
        ctx.result.unites.push({ ref: nomNet, id: savedUnite.id, nom, code });
        ctx.uniteRefMap.set(nomNet, savedUnite.id);
        ctx.uniteRefMap.set(noeud.usageUnite, savedUnite.id);

        // Créer les postes
        if (noeud.postes) {
            for (const p of noeud.postes) {
                await this.genererPoste(p, savedUnite.id, ctx, noeud);
            }
        }

        // Générer les enfants (multiplicité)
        if (noeud.enfants && noeud.enfants.length > 0) {
            const count = noeud.count || 1;
            for (let i = 0; i < count; i++) {
                for (const enfant of noeud.enfants) {
                    await this.genererNoeud(enfant, savedUnite.id, ctx, i);
                }
            }
        }

        return savedUnite.id;
    }

    private async genererPoste(
        templatePoste: TemplatePoste,
        uniteId: string,
        ctx: GenerationContext,
        noeud: NoeudTemplateOrganisation,
    ): Promise<string | null> {
        const count = templatePoste.nombrePostes || 1;

        for (let i = 0; i < count; i++) {
            const posteCode = `${ctx.prefixeCode}${templatePoste.ref.toUpperCase()}`;
            const intituleBrut = templatePoste.intitule ?? 'Poste';
            const intitule = count > 1
                ? `${intituleBrut} ${i + 1}`
                : intituleBrut;

            const poste = ctx.queryRunner.manager.create(Poste, {
                intitule,
                code: posteCode,
                uniteOrganisationnelleId: uniteId,
                nombrePostes: 1,
                statut: StatutPoste.VACANT,
                actif: true,
            });
            const savedPoste = await ctx.queryRunner.manager.save(poste);
            ctx.result.postesCrees++;
            const nomNet = noeud.nom.trim();
            const posteRef = `${nomNet}.${templatePoste.ref}${count > 1 ? `_${i + 1}` : ''}`;
            ctx.result.postes.push({ ref: posteRef, id: savedPoste.id, intitule, code: posteCode });
            ctx.posteRefMap.set(posteRef, savedPoste.id);
        }

        return null;
    }

    private async genererHierarchie(
        noeud: NoeudTemplateOrganisation,
        ctx: GenerationContext,
    ): Promise<void> {
        if (!noeud.hierarchie) return;

        for (const lien of noeud.hierarchie) {
            const superieurUniteId = ctx.uniteRefMap.get(lien.superieurRef);
            const subordonneUniteId = ctx.uniteRefMap.get(lien.subordonneRef);

            if (!superieurUniteId || !subordonneUniteId) {
                continue;
            }

            const superieurPoste = await ctx.queryRunner.manager.findOne(Poste, {
                where: {
                    uniteOrganisationnelleId: superieurUniteId,
                    actif: true,
                },
                order: { createdAt: 'ASC' },
            });

            const subordonnePoste = await ctx.queryRunner.manager.findOne(Poste, {
                where: {
                    uniteOrganisationnelleId: subordonneUniteId,
                    actif: true,
                },
                order: { createdAt: 'ASC' },
            });

            if (superieurPoste && subordonnePoste) {
                const hierarchie = ctx.queryRunner.manager.create(HierarchiePersonnel, {
                    superieurId: superieurPoste.id,
                    posteId: subordonnePoste.id,
                    statut: StatutRelation.ACTIVE,
                    actif: true,
                });
                const saved = await ctx.queryRunner.manager.save(hierarchie);
                ctx.result.hierarchiesCrees++;
                ctx.result.hierarchies.push({
                    superieurRef: lien.superieurRef,
                    subordonneRef: lien.subordonneRef,
                    id: saved.id,
                });
            }
        }

        if (noeud.enfants) {
            for (const enfant of noeud.enfants) {
                await this.genererHierarchie(enfant, ctx);
            }
        }
    }
}

export const generationService = new GenerationService();
