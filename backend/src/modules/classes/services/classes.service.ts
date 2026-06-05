/**
 * ==================================
 * eLISAschool - Service Classes
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Classe, AffectationEleve } from '../entities';
import { CreateClasseDto, UpdateClasseDto, AffecterEleveDto } from '../dto';
import { anneesScolairesService } from '@modules/annees-scolaires/services';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class ClassesService {
    private classeRepo: Repository<Classe>;
    private affectationRepo: Repository<AffectationEleve>;

    constructor() {
        this.classeRepo = AppDataSource.getRepository(Classe);
        this.affectationRepo = AppDataSource.getRepository(AffectationEleve);
    }

    async create(dto: CreateClasseDto, etablissementId?: string): Promise<Classe> {
        const anneeId = dto.anneeScolaireId || (await anneesScolairesService.findActive())?.id;
        if (!anneeId) throw new AppError('Aucune année scolaire active', 400, 'NO_ACTIVE_YEAR');

        const classe = this.classeRepo.create({
            ...dto,
            anneeScolaireId: anneeId,
            etablissementId,
        });
        await this.classeRepo.save(classe);
        logger.info(`Classe créée: ${dto.nom}`);
        return classe;
    }

    async findAll(niveauId?: string, anneeId?: string, etablissementId?: string): Promise<Classe[]> {
        const where: any = {};
        if (niveauId) where.niveauId = niveauId;
        if (anneeId) where.anneeScolaireId = anneeId;
        if (etablissementId) where.etablissementId = etablissementId;

        // Si anneeId non fourni mais filtre par niveau, on essaie de filtrer par année active par défaut ?
        // Non, si pas de filtre, on retourne tout ou on laisse le controller décider.

        return this.classeRepo.find({
            where,
            relations: ['niveau', 'professeurPrincipal', 'professeurPrincipal.utilisateur', 'anneeScolaire'],
            order: { nom: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Classe> {
        const classe = await this.classeRepo.findOne({
            where: { id },
            relations: ['niveau', 'professeurPrincipal', 'anneeScolaire'],
        });
        if (!classe) throw new AppError('Classe non trouvée', 404, 'NOT_FOUND');
        return classe;
    }

    async update(id: string, dto: UpdateClasseDto): Promise<Classe> {
        const classe = await this.findOne(id);
        Object.assign(classe, dto);
        await this.classeRepo.save(classe);
        return classe;
    }

    async delete(id: string): Promise<void> {
        const classe = await this.findOne(id);
        // Vérifier s'il y a des élèves
        const count = await this.affectationRepo.count({ where: { classeId: id, actif: true } });
        if (count > 0) throw new AppError('La classe contient des élèves actifs', 400, 'CLASS_NOT_EMPTY');

        await this.classeRepo.remove(classe);
        logger.info(`Classe supprimée: ${id}`);
    }

    // ==== AFFECTATIONS ====

    async affecterEleve(dto: AffecterEleveDto, etablissementId?: string): Promise<AffectationEleve> {
        const classe = await this.findOne(dto.classeId);

        // Vérifier si déjà affecté cette année
        const existing = await this.affectationRepo.findOne({
            where: {
                eleveId: dto.eleveId,
                anneeScolaireId: classe.anneeScolaireId,
                actif: true
            }
        });

        if (existing) {
            // Si déjà dans cette classe, erreur ou ignore
            if (existing.classeId === dto.classeId) return existing;
            // Sinon, on pourrait désactiver l'ancienne et créer la nouvelle (changement de classe)
            // Pour l'instant on bloque
            throw new AppError('Élève déjà affecté à une classe pour cette année', 409, 'ALREADY_ASSIGNED');
        }

        const affectation = this.affectationRepo.create({
            eleveId: dto.eleveId,
            classeId: dto.classeId,
            anneeScolaireId: classe.anneeScolaireId,
            dateAffectation: dto.dateAffectation ? new Date(dto.dateAffectation) : new Date(),
            etablissementId,
        });

        await this.affectationRepo.save(affectation);

        // Mettre à jour effectif
        await this.classeRepo.increment({ id: dto.classeId }, 'effectifActuel', 1);

        return affectation;
    }
}

export const classesService = new ClassesService();
