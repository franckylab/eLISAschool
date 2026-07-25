/**
 * ==================================
 * eLISAschool - Service TemplateOrganisation
 * ==================================
 * Éclaté depuis nomenclature.service.ts
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TemplateOrganisation } from '../entities';
import {
    CreateTemplateOrganisationDto,
    UpdateTemplateOrganisationDto,
    FiltrerTemplatesDto,
    ClonerTemplateDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';

class TemplateOrganisationService {
    private repo: Repository<TemplateOrganisation>;

    constructor() {
        this.repo = AppDataSource.getRepository(TemplateOrganisation);
    }

    async create(dto: CreateTemplateOrganisationDto): Promise<TemplateOrganisation> {
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<TemplateOrganisation[]> {
        const qb = this.repo.createQueryBuilder('t');
        if (etablissementId) {
            qb.where('(t.etablissementId = :eid OR t.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(t.etablissementId IS NULL OR t.estSysteme = TRUE)');
        }
        qb.andWhere('t.actif = TRUE').orderBy('t.nom', 'ASC');
        return qb.getMany();
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string, actif?: boolean) {
        const qb = this.repo.createQueryBuilder('t');
        if (etablissementId) {
            qb.where('(t.etablissementId = :eid OR t.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(t.etablissementId IS NULL OR t.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(t.nom ILIKE :search OR t.description ILIKE :search)', { search: `%${search}%` });
        }
        if (actif !== undefined) {
            qb.andWhere('t.actif = :actif', { actif });
        }
        qb.orderBy('t.nom', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string, etablissementId?: string): Promise<TemplateOrganisation> {
        const qb = this.repo.createQueryBuilder('t').where('t.id = :id', { id });
        if (etablissementId) {
            // Visible si tenant OU global/système (templates partagés)
            qb.andWhere('(t.etablissementId = :eid OR t.etablissementId IS NULL OR t.estSysteme = TRUE)', { eid: etablissementId });
        }
        const entity = await qb.getOne();
        if (!entity) throw new AppError('Template d\'organisation non trouvé', 404, 'TEMPLATE_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateTemplateOrganisationDto, etablissementId?: string): Promise<TemplateOrganisation> {
        const entity = await this.findById(id, etablissementId);
        assertNotSystem(entity, 'modifier');
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }

    async delete(id: string, etablissementId?: string): Promise<void> {
        const entity = await this.findById(id, etablissementId);
        assertNotSystem(entity, 'supprimer');
        await this.repo.remove(entity);
    }

    /**
     * Recherche filtrée par facettes de catégorisation (v5.1)
     */
    async findAllFiltered(
        filtres: FiltrerTemplatesDto,
        etablissementId: string,
    ): Promise<{ data: TemplateOrganisation[]; total: number }> {
        const qb = this.repo.createQueryBuilder('t');

        // Isolation multi-tenant : systèmes + établissement
        qb.where('(t.etablissementId = :eid OR t.estSysteme = TRUE)', { eid: etablissementId });
        qb.andWhere('t.actif = :actif', { actif: filtres.actif ?? true });

        // Recherche textuelle
        if (filtres.search) {
            qb.andWhere('(t.nom ILIKE :search OR t.description ILIKE :search OR t.nomEn ILIKE :search)', {
                search: `%${filtres.search}%`,
            });
        }

        // Filtres de catégorisation
        if (filtres.nature) {
            qb.andWhere('t.nature = :nature', { nature: filtres.nature });
        }
        if (filtres.systeme) {
            qb.andWhere('t.systeme = :systeme', { systeme: filtres.systeme });
        }
        if (filtres.langue) {
            qb.andWhere('t.langue = :langue', { langue: filtres.langue });
        }
        if (filtres.niveau) {
            // niveaux est un simple-array (stocké comme string séparée par virgules)
            qb.andWhere('t.niveaux LIKE :niveau', { niveau: `%${filtres.niveau}%` });
        }
        if (filtres.complexite) {
            qb.andWhere('t.complexite = :complexite', { complexite: filtres.complexite });
        }
        if (filtres.categorie) {
            qb.andWhere('t.categorie = :categorie', { categorie: filtres.categorie });
        }

        // Tri : ordre croissant puis nom
        qb.orderBy('t.ordre', 'ASC', 'NULLS LAST')
            .addOrderBy('t.nom', 'ASC');

        // Pagination
        const page = filtres.page ?? 1;
        const limit = Math.min(filtres.limit ?? 50, 100);
        qb.skip((page - 1) * limit).take(limit);

        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    /**
     * Retourne les combinaisons de facettes disponibles pour le filtrage (v5.1)
     * Permet au frontend de savoir quelles valeurs sont disponibles pour chaque filtre.
     */
    async getCombinaisonsValides(etablissementId: string): Promise<{
        natures: string[];
        systemes: string[];
        langues: string[];
        niveaux: string[];
        complexites: string[];
        categories: string[];
        compteurs: Record<string, number>;
    }> {
        const qb = this.repo.createQueryBuilder('t');
        qb.where('(t.etablissementId = :eid OR t.estSysteme = TRUE)', { eid: etablissementId });
        qb.andWhere('t.actif = TRUE');

        const templates = await qb.select([
            't.nature', 't.systeme', 't.langue', 't.niveaux', 't.complexite', 't.categorie',
        ]).getMany();

        const natures = new Set<string>();
        const systemes = new Set<string>();
        const langues = new Set<string>();
        const niveaux = new Set<string>();
        const complexites = new Set<string>();
        const categories = new Set<string>();
        const compteurs: Record<string, number> = {};

        for (const t of templates) {
            if (t.nature) natures.add(t.nature);
            if (t.systeme) systemes.add(t.systeme);
            if (t.langue) langues.add(t.langue);
            if (t.complexite) complexites.add(t.complexite);
            if (t.categorie) categories.add(t.categorie);
            // niveaux est un simple-array
            if (t.niveaux && Array.isArray(t.niveaux)) {
                for (const n of t.niveaux) {
                    if (n) niveaux.add(n);
                }
            }
            // Compteur par catégorie
            if (t.categorie) {
                compteurs[t.categorie] = (compteurs[t.categorie] ?? 0) + 1;
            }
        }

        return {
            natures: [...natures].sort(),
            systemes: [...systemes].sort(),
            langues: [...langues].sort(),
            niveaux: [...niveaux].sort(),
            complexites: [...complexites].sort(),
            categories: [...categories].sort(),
            compteurs,
        };
    }

    /**
     * Cloner un template pour un établissement (v5.1)
     * Copie profonde de la structure, avec nouveau nom optionnel.
     */
    async clonerTemplate(
        id: string,
        dto: ClonerTemplateDto,
    ): Promise<TemplateOrganisation> {
        const original = await this.findById(id);

        const clone = this.repo.create({
            nom: dto.nom ?? `${original.nom} (copie)`,
            nomEn: original.nomEn ? `${original.nomEn} (copy)` : undefined,
            description: original.description,
            structure: JSON.parse(JSON.stringify(original.structure)),
            etablissementId: dto.etablissementId,
            estSysteme: false,
            actif: true,
            nature: original.nature,
            systeme: original.systeme,
            langue: original.langue,
            niveaux: original.niveaux ? [...original.niveaux] : undefined,
            complexite: original.complexite,
            categorie: original.categorie,
            ordre: original.ordre,
            icone: original.icone,
            metadata: original.metadata ? { ...original.metadata, clonedFrom: original.id } : { clonedFrom: original.id },
        });

        return this.repo.save(clone);
    }
}

export const templateOrganisationService = new TemplateOrganisationService();
