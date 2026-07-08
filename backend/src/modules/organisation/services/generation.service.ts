import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import {
    Organisation,
    UniteOrganisationnelle,
    Poste,
    HierarchiePersonnel,
    TypeUniteOrganisationnelle,
    StatutUnite,
    StatutPoste,
    TypeRelationHierarchique,
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
import { niveauOrganisationService, usageUniteService, categoriePosteService, niveauResponsabiliteService } from './nomenclature.service';
import { organisationService } from './organisation.service';

interface GenerationContext {
    etablissementId: string;
    organisationId: string;
    prefixeCode: string;
    creerHierarchie: boolean;
    modeConflit: 'ERROR' | 'SKIP' | 'OVERWRITE';
    uniteRepo: Repository<UniteOrganisationnelle>;
    posteRepo: Repository<Poste>;
    hierarchieRepo: Repository<HierarchiePersonnel>;
    result: ResultatGeneration;
    uniteRefMap: Map<string, string>;
    posteRefMap: Map<string, string>;
    niveauOrgMap: Map<string, string>;
    categorieMap: Map<string, string>;
    niveauRespMap: Map<string, string>;
}

export class GenerationService {
    private organisationRepo: Repository<Organisation>;
    private uniteRepo: Repository<UniteOrganisationnelle>;
    private posteRepo: Repository<Poste>;
    private hierarchieRepo: Repository<HierarchiePersonnel>;
    private templateRepo: Repository<TemplateOrganisation>;

    constructor() {
        this.organisationRepo = AppDataSource.getRepository(Organisation);
        this.uniteRepo = AppDataSource.getRepository(UniteOrganisationnelle);
        this.posteRepo = AppDataSource.getRepository(Poste);
        this.hierarchieRepo = AppDataSource.getRepository(HierarchiePersonnel);
        this.templateRepo = AppDataSource.getRepository(TemplateOrganisation);
    }

    async generer(dto: GenererOrganisationDto, etablissementId: string): Promise<ResultatGeneration> {
        // 1. Résoudre la structure
        let structure: NoeudTemplateOrganisation;
        if (dto.templateId) {
            const template = await this.templateRepo.findOne({ where: { id: dto.templateId } });
            if (!template) throw new AppError('Template non trouvé', 404, 'TEMPLATE_NOT_FOUND');
            structure = template.structure as NoeudTemplateOrganisation;
        } else if (dto.structure) {
            structure = dto.structure as NoeudTemplateOrganisation;
        } else {
            throw new AppError('templateId ou structure requis', 400, 'VALIDATION_ERROR');
        }

        // 2. Valider organisation cible
        const organisation = await this.organisationRepo.findOne({
            where: { id: dto.organisationId, etablissementId },
        });
        if (!organisation) throw new AppError('Organisation non trouvée', 404, 'ORG_NOT_FOUND');

        // 3. Pré-charger les références (niveaux, usages, catégories)
        const context = await this.preparerContexte(etablissementId, dto);

        // 4. Générer récursivement
        await this.genererNoeud(structure, null, context);

        // 5. Créer hiérarchie si demandé
        if (context.creerHierarchie && structure.hierarchie) {
            await this.genererHierarchie(structure, context);
        }

        // 6. Construire arborescence retour
        context.result.arborescence = await organisationService.buildArborescence(dto.organisationId);

        return context.result;
    }

    private async preparerContexte(etablissementId: string, dto: GenererOrganisationDto): Promise<GenerationContext> {
        const context: GenerationContext = {
            etablissementId,
            organisationId: dto.organisationId,
            prefixeCode: dto.options?.prefixeCode || '',
            creerHierarchie: dto.options?.creerHierarchie ?? true,
            modeConflit: dto.options?.modeConflit || 'ERROR',
            uniteRepo: this.uniteRepo,
            posteRepo: this.posteRepo,
            hierarchieRepo: this.hierarchieRepo,
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

        // Charger les mappings des références système
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

    private async genererNoeud(
        noeud: NoeudTemplateOrganisation,
        parentId: string | null,
        ctx: GenerationContext,
        index: number = 0,
    ): Promise<string | null> {
        const baseCode = `${ctx.prefixeCode}${noeud.nom.toUpperCase().replace(/\s+/g, '_')}`;
        const code = noeud.count > 1 ? `${baseCode}_${index + 1}` : baseCode;
        const nom = noeud.count > 1 ? `${noeud.nom} ${index + 1}` : noeud.nom;

        // Vérifier conflit
        if (ctx.modeConflit !== 'OVERWRITE') {
            const existing = await ctx.uniteRepo.findOne({
                where: { code, organisationId: ctx.organisationId },
            });
            if (existing) {
                if (ctx.modeConflit === 'ERROR') {
                    throw new AppError(
                        `Une unité avec le code "${code}" existe déjà dans cette organisation`,
                        409,
                        'UNITE_CODE_CONFLICT',
                    );
                }
                // SKIP: retourner l'ID existant, ne pas recréer
                ctx.uniteRefMap.set(noeud.nom, existing.id);
                return existing.id;
            }
        }

        // Créer l'unité
        const typeVal = noeud.usageUnite as TypeUniteOrganisationnelle;
        const type = Object.values(TypeUniteOrganisationnelle).includes(typeVal)
            ? typeVal
            : TypeUniteOrganisationnelle.SERVICE;

        const unite = ctx.uniteRepo.create({
            nom,
            code,
            type,
            usageUniteCode: noeud.usageUnite,
            ordre: index,
            organisationId: ctx.organisationId,
            parentId: parentId ?? undefined,
            statut: StatutUnite.ACTIF,
            actif: true,
        });
        const savedUnite = await ctx.uniteRepo.save(unite);
        ctx.result.unitesCrees++;
        ctx.result.unites.push({ ref: noeud.nom, id: savedUnite.id, nom, code });
        ctx.uniteRefMap.set(noeud.nom, savedUnite.id);

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
            const intitule = count > 1
                ? `${templatePoste.intitulé} ${i + 1}`
                : templatePoste.intitulé;

            const poste = ctx.posteRepo.create({
                intitulé,
                code: posteCode,
                type: (templatePoste.categoriePoste as any) || 'ADMINISTRATIF',
                categoriePosteCode: templatePoste.categoriePoste,
                niveauResponsabiliteCode: templatePoste.niveauResponsabilite,
                uniteOrganisationnelleId: uniteId,
                nombrePostes: 1,
                statut: StatutPoste.VACANT,
                actif: true,
            });
            const savedPoste = await ctx.posteRepo.save(poste);
            ctx.result.postesCrees++;
            const posteRef = `${noeud.nom}.${templatePoste.ref}${count > 1 ? `_${i + 1}` : ''}`;
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

            // Chercher les postes responsables dans chaque unité
            const superieurPoste = await ctx.posteRepo.findOne({
                where: {
                    uniteOrganisationnelleId: superieurUniteId,
                    actif: true,
                },
                order: { createdAt: 'ASC' },
            });

            const subordonnePoste = await ctx.posteRepo.findOne({
                where: {
                    uniteOrganisationnelleId: subordonneUniteId,
                    actif: true,
                },
                order: { createdAt: 'ASC' },
            });

            if (superieurPoste && subordonnePoste) {
                const hierarchie = ctx.hierarchieRepo.create({
                    posteId: subordonnePoste.id,
                    posteIntitule: subordonnePoste.intitulé,
                    typeRelation: (lien.typeRelation as TypeRelationHierarchique) || TypeRelationHierarchique.SUPERVISE_DIRECT,
                    statut: StatutRelation.ACTIVE,
                    actif: true,
                });
                const saved = await ctx.hierarchieRepo.save(hierarchie);
                ctx.result.hierarchiesCrees++;
                ctx.result.hierarchies.push({
                    superieurRef: lien.superieurRef,
                    subordonneRef: lien.subordonneRef,
                    id: saved.id,
                });
            }
        }

        // Traiter récursivement les enfants
        if (noeud.enfants) {
            for (const enfant of noeud.enfants) {
                await this.genererHierarchie(enfant, ctx);
            }
        }
    }
}

export const generationService = new GenerationService();
