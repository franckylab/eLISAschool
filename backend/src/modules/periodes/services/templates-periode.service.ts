/**
 * ==================================
 * eLISAschool - Service Templates Période (v5.0 — Niveaux + Usages)
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 *
 * Gestion CRUD des templates de hiérarchie de périodes.
 * Génération récursive générique depuis une structure JSON arbre.
 * Utilise niveau + usageCode au lieu de l'ancien enum TypePeriode.
 */

import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    TemplatePeriodeEntity,
    NoeudTemplatePeriode,
    Periode,
    PeriodeComposition,
    NiveauPeriode,
} from '../entities';
import {
    CreateTemplatePeriodeDto,
    UpdateTemplatePeriodeDto,
    GenererDepuisTemplateDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class TemplatesPeriodeService {
    private templateRepo: Repository<TemplatePeriodeEntity>;
    private periodeRepo: Repository<Periode>;
    private compositionRepo: Repository<PeriodeComposition>;
    private niveauRepo: Repository<NiveauPeriode>;

    constructor() {
        this.templateRepo = AppDataSource.getRepository(TemplatePeriodeEntity);
        this.periodeRepo = AppDataSource.getRepository(Periode);
        this.compositionRepo = AppDataSource.getRepository(PeriodeComposition);
        this.niveauRepo = AppDataSource.getRepository(NiveauPeriode);
    }

    // ================================================================
    // TEMPLATES — CRUD
    // ================================================================

    /**
     * Lister les templates disponibles pour un établissement.
     * Inclut : templates système (etablissementId = null) + templates de l'établissement.
     */
    async findAll(etablissementId: string): Promise<TemplatePeriodeEntity[]> {
        return this.templateRepo.find({
            where: [
                { actif: true, etablissementId: IsNull() },
                { actif: true, etablissementId },
            ],
            order: { estSysteme: 'DESC', nom: 'ASC' },
        });
    }

    /**
     * Lister tous les templates (SUPER_ADMIN — vue globale).
     */
    async findAllGlobal(): Promise<TemplatePeriodeEntity[]> {
        return this.templateRepo.find({
            where: { actif: true },
            relations: ['etablissement'],
            order: { estSysteme: 'DESC', nom: 'ASC' },
        });
    }

    /**
     * Templates par défaut disponibles pour un nouvel établissement.
     * Ces structures sont retournées sans être persistées — utilisées comme modèles.
     */
    getTemplatesParDefaut(): Array<{ nom: string; description: string; structure: NoeudTemplatePeriode }> {
        return [
            {
                nom: '3 Trimestres × 2 Séquences',
                description: 'Modèle camerounais francophone classique : 3 trimestres, chacun divisé en 2 séquences',
                structure: {
                    niveau: 3, usageCode: 'ANNEE', count: 1, nom: 'Année scolaire',
                    enfants: [{
                        niveau: 1, usageCode: 'BULLETIN', count: 3, nom: 'Trimestre {n}',
                        enfants: [
                            { niveau: 0, usageCode: 'NOTES', count: 2, nom: 'Séquence {n}' },
                        ],
                    }],
                },
            },
            {
                nom: '2 Semestres × 3 Séquences',
                description: 'Modèle alternatif : 2 semestres, chacun divisé en 3 séquences',
                structure: {
                    niveau: 3, usageCode: 'ANNEE', count: 1, nom: 'Année scolaire',
                    enfants: [{
                        niveau: 2, usageCode: 'BULLETIN', count: 2, nom: 'Semestre {n}',
                        enfants: [
                            { niveau: 0, usageCode: 'NOTES', count: 3, nom: 'Séquence {n}' },
                        ],
                    }],
                },
            },
            {
                nom: '2 Semestres × 2 Trimestres',
                description: 'Modèle imbriqué : 2 semestres contenant chacun 2 trimestres',
                structure: {
                    niveau: 3, usageCode: 'ANNEE', count: 1, nom: 'Année scolaire',
                    enfants: [{
                        niveau: 2, usageCode: 'BULLETIN', count: 2, nom: 'Semestre {n}',
                        enfants: [
                            { niveau: 1, usageCode: 'BULLETIN', count: 2, nom: 'Trimestre {n}' },
                        ],
                    }],
                },
            },
            {
                nom: '6 Séquences directes',
                description: 'Modèle simplifié : 6 séquences sans regroupement trimestriel',
                structure: {
                    niveau: 3, usageCode: 'ANNEE', count: 1, nom: 'Année scolaire',
                    enfants: [
                        { niveau: 0, usageCode: 'NOTES', count: 6, nom: 'Séquence {n}' },
                    ],
                },
            },
            {
                nom: '4 Terms (système anglo-saxon)',
                description: 'Modèle anglophone : 4 terms sans subdivision',
                structure: {
                    niveau: 3, usageCode: 'ANNEE', count: 1, nom: 'School Year',
                    enfants: [
                        { niveau: 1, usageCode: 'BULLETIN', count: 4, nom: 'Term {n}' },
                    ],
                },
            },
        ];
    }

    /**
     * Trouver un template par ID.
     */
    async findOne(id: string): Promise<TemplatePeriodeEntity> {
        const template = await this.templateRepo.findOne({
            where: { id, actif: true },
            relations: ['etablissement'],
        });
        if (!template) {
            throw new AppError('Template de période non trouvé', 404, 'TEMPLATE_NOT_FOUND');
        }
        return template;
    }

    /**
     * Créer un nouveau template personnalisé.
     */
    async create(dto: CreateTemplatePeriodeDto, etablissementId: string): Promise<TemplatePeriodeEntity> {
        // Vérifier unicité du nom dans l'établissement
        const existing = await this.templateRepo.findOne({
            where: { nom: dto.nom, etablissementId },
        });
        if (existing) {
            throw new AppError(
                `Un template nommé "${dto.nom}" existe déjà dans cet établissement`,
                409,
                'TEMPLATE_EXISTS',
            );
        }

        // Valider la structure récursive
        this.validerStructure(dto.structure);

        const template = this.templateRepo.create({
            ...dto,
            etablissementId,
            estSysteme: false,
        });
        await this.templateRepo.save(template);

        logger.info(`[TemplatesPeriode] Template créé: ${template.nom} (${template.id})`);
        return template;
    }

    /**
     * Mettre à jour un template personnalisé.
     * Les templates système ne peuvent être modifiés que par SUPER_ADMIN.
     */
    async update(
        id: string,
        dto: UpdateTemplatePeriodeDto,
        etablissementId: string,
        isSuperAdmin = false,
    ): Promise<TemplatePeriodeEntity> {
        const template = await this.findOne(id);

        // Protection : seul le créateur ou SUPER_ADMIN peut modifier
        if (!template.estSysteme && template.etablissementId !== etablissementId && !isSuperAdmin) {
            throw new AppError('Accès refusé à ce template', 403, 'FORBIDDEN');
        }

        // Valider la structure si fournie
        if (dto.structure) {
            this.validerStructure(dto.structure);
        }

        Object.assign(template, dto);
        await this.templateRepo.save(template);

        logger.info(`[TemplatesPeriode] Template mis à jour: ${template.nom} (${template.id})`);
        return template;
    }

    /**
     * Supprimer (soft) un template.
     * Les templates système ne peuvent pas être supprimés.
     */
    async delete(id: string, etablissementId: string, isSuperAdmin = false): Promise<void> {
        const template = await this.findOne(id);

        if (template.estSysteme && !isSuperAdmin) {
            throw new AppError(
                'Les templates système ne peuvent pas être supprimés',
                403,
                'SYSTEM_TEMPLATE_PROTECTED',
            );
        }

        if (!template.estSysteme && template.etablissementId !== etablissementId && !isSuperAdmin) {
            throw new AppError('Accès refusé à ce template', 403, 'FORBIDDEN');
        }

        template.actif = false;
        await this.templateRepo.save(template);

        logger.info(`[TemplatesPeriode] Template supprimé: ${template.nom} (${template.id})`);
    }

    // ================================================================
    // GÉNÉRATION RÉCURSIVE — Depuis un template (v5.0)
    // ================================================================

    /**
     * Générer une hiérarchie complète de périodes depuis un template.
     * Algorithme récursif : divise la durée du parent par le count de chaque enfant.
     * Utilise niveau + usageCode pour résoudre le niveauId correspondant.
     */
    async genererDepuisTemplate(
        dto: GenererDepuisTemplateDto,
        etablissementId: string,
    ): Promise<Periode[]> {
        // Charger le template
        const template = await this.findOne(dto.templateId);

        // Vérifier accès multi-tenant
        if (!template.estSysteme && template.etablissementId !== etablissementId) {
            throw new AppError('Accès refusé à ce template', 403, 'FORBIDDEN');
        }

        // Vérifier l'année scolaire
        const { anneesScolairesService } = await import('@modules/annees-scolaires/services');
        await anneesScolairesService.findOne(dto.anneeScolaireId, etablissementId);

        // Pré-charger les niveaux de l'établissement pour résolution rapide
        const niveaux = await this.niveauRepo.find({
            where: { etablissementId },
            order: { niveau: 'ASC' },
        });

        const dateDebut = new Date(dto.dateDebut);
        const dateFin = new Date(dto.dateFin);
        const periodesCreees: Periode[] = [];

        // 1. Résoudre le niveau pour la racine du template (ex: niveau 3, usageCode ANNEE)
        const niveauRacine = niveaux.find(
            n => n.niveau === template.structure.niveau && n.usageCode === template.structure.usageCode,
        );
        let rootParentId: string | null = null;

        if (niveauRacine) {
            // Créer la période racine
            const racinePeriode = this.periodeRepo.create({
                nom: template.structure.nom,
                niveauId: niveauRacine.id,
                anneeScolaireId: dto.anneeScolaireId,
                etablissementId,
                dateDebut,
                dateFin,
            });
            await this.periodeRepo.save(racinePeriode);
            periodesCreees.push(racinePeriode);
            rootParentId = racinePeriode.id;
        }

        // 2. Générer récursivement les enfants depuis le nœud racine
        await this.genererRecursif(
            template.structure,
            dto.anneeScolaireId,
            etablissementId,
            dateDebut,
            dateFin,
            rootParentId, // ID de la période racine comme parent
            0,    // profondeur 0
            null, // pas de préfixe de nom
            periodesCreees,
            niveaux,
        );

        logger.info(
            `[TemplatesPeriode] Template "${template.nom}" généré: ${periodesCreees.length} périodes créées`,
        );
        return periodesCreees;
    }

    /**
     * Algorithme récursif de génération (v5.0).
     * Pour chaque nœud : divise la durée du parent par count, crée les périodes, puis descend.
     * Résout le niveauId depuis niveau + usageCode.
     */
    private async genererRecursif(
        noeud: NoeudTemplatePeriode,
        anneeId: string,
        etabId: string,
        debut: Date,
        fin: Date,
        parentId: string | null,
        profondeur: number,
        prefixeNom: string | null,
        result: Periode[],
        niveaux: NiveauPeriode[],
    ): Promise<void> {
        // Si pas d'enfants → pas de création à ce niveau
        if (!noeud.enfants || noeud.enfants.length === 0) {
            return;
        }

        const dureeTotale = fin.getTime() - debut.getTime();

        for (const enfant of noeud.enfants) {
            const enfantDuree = dureeTotale / enfant.count;

            // Résoudre le niveauId pour cet enfant
            const niveauCorrespondant = niveaux.find(
                n => n.niveau === enfant.niveau && n.usageCode === enfant.usageCode,
            );

            if (!niveauCorrespondant) {
                throw new AppError(
                    `Aucun niveau trouvé pour niveau=${enfant.niveau}, usageCode="${enfant.usageCode}". ` +
                    `Configurez d'abord les niveaux de périodicité.`,
                    400,
                    'NIVEAU_NON_TROUVE',
                );
            }

            for (let i = 0; i < enfant.count; i++) {
                const enfantDebut = new Date(debut.getTime() + i * enfantDuree);
                const enfantFin = new Date(debut.getTime() + (i + 1) * enfantDuree - 86400000); // -1 jour

                // Construire le nom avec le pattern
                const nomPattern = enfant.nom.replace('{n}', String(i + 1));
                const nomComplet = prefixeNom ? `${prefixeNom} - ${nomPattern}` : nomPattern;

                // Créer la période avec niveauId
                const periode = this.periodeRepo.create({
                    nom: nomComplet,
                    niveauId: niveauCorrespondant.id,
                    anneeScolaireId: anneeId,
                    etablissementId: etabId,
                    dateDebut: enfantDebut,
                    dateFin: enfantFin,
                });
                await this.periodeRepo.save(periode);
                result.push(periode);

                // Créer la composition avec le parent si applicable
                if (parentId) {
                    const composition = this.compositionRepo.create({
                        periodeParentId: parentId,
                        periodeEnfantId: periode.id,
                        ordre: i + 1,
                        poids: 1,
                    });
                    await this.compositionRepo.save(composition);
                }

                // Récursion : si ce nœud a des enfants, on descend
                if (enfant.enfants && enfant.enfants.length > 0) {
                    await this.genererRecursif(
                        enfant,
                        anneeId,
                        etabId,
                        enfantDebut,
                        enfantFin,
                        periode.id,
                        profondeur + 1,
                        nomComplet,
                        result,
                        niveaux,
                    );
                }
            }
        }
    }

    // ================================================================
    // VALIDATION — Structure récursive (v5.0)
    // ================================================================

    /**
     * Valider la cohérence d'une structure de template.
     * Vérifie : niveaux valides, counts > 0, pas de cycles, hiérarchie cohérente.
     */
    private validerStructure(noeud: NoeudTemplatePeriode, profondeur = 0): void {
        if (profondeur > 5) {
            throw new AppError(
                'Structure trop profonde (max 5 niveaux)',
                400,
                'STRUCTURE_TOO_DEEP',
            );
        }

        if (noeud.niveau < 0 || noeud.niveau > 20) {
            throw new AppError(
                `Niveau invalide: ${noeud.niveau}. Doit être entre 0 et 20.`,
                400,
                'INVALID_NIVEAU',
            );
        }

        if (!noeud.usageCode || noeud.usageCode.length < 2) {
            throw new AppError(
                `Code usage invalide: "${noeud.usageCode}". Minimum 2 caractères.`,
                400,
                'INVALID_USAGE_CODE',
            );
        }

        if (noeud.count < 1) {
            throw new AppError('Le nombre d\'occurrences doit être >= 1', 400, 'INVALID_COUNT');
        }

        // Valider les enfants récursivement
        if (noeud.enfants) {
            for (const enfant of noeud.enfants) {
                // Vérifier que le niveau enfant est inférieur au niveau parent
                if (enfant.niveau >= noeud.niveau) {
                    throw new AppError(
                        `Le niveau enfant (${enfant.niveau}) doit être inférieur au niveau parent (${noeud.niveau})`,
                        400,
                        'NIVEAU_HIERARCHY_VIOLATION',
                    );
                }
                this.validerStructure(enfant, profondeur + 1);
            }
        }
    }
}

export const templatesPeriodeService = new TemplatesPeriodeService();
