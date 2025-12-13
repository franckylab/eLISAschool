/**
 * ==================================
 * eLISAschool - Service Matières
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Matiere, GroupeMatiere, MatiereNiveau, AffectationMatiere } from '../entities';
import { CreateMatiereDto, UpdateMatiereDto, CreateGroupeMatiereDto, CreateMatiereNiveauDto, UpdateMatiereNiveauDto, AffecterEnseignantDto } from '../dto';
import { anneesScolairesService } from '@modules/annees-scolaires/services';
import { classesService } from '@modules/classes/services';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class MatieresService {
    private matiereRepo: Repository<Matiere>;
    private groupeRepo: Repository<GroupeMatiere>;
    private niveauRepo: Repository<MatiereNiveau>;
    private affectationRepo: Repository<AffectationMatiere>;

    constructor() {
        this.matiereRepo = AppDataSource.getRepository(Matiere);
        this.groupeRepo = AppDataSource.getRepository(GroupeMatiere);
        this.niveauRepo = AppDataSource.getRepository(MatiereNiveau);
        this.affectationRepo = AppDataSource.getRepository(AffectationMatiere);
    }

    // ==== MATIERES ====

    async create(dto: CreateMatiereDto): Promise<Matiere> {
        const existing = await this.matiereRepo.findOne({ where: { nom: dto.nom } });
        if (existing) throw new AppError('Matière déjà existante', 409, 'MATIERE_EXISTS');

        const matiere = this.matiereRepo.create(dto);
        await this.matiereRepo.save(matiere);
        return matiere;
    }

    async findAll(): Promise<Matiere[]> {
        return this.matiereRepo.find({ order: { nom: 'ASC' } });
    }

    async update(id: string, dto: UpdateMatiereDto): Promise<Matiere> {
        const matiere = await this.matiereRepo.findOne({ where: { id } });
        if (!matiere) throw new AppError('Matière non trouvée', 404, 'NOT_FOUND');
        Object.assign(matiere, dto);
        await this.matiereRepo.save(matiere);
        return matiere;
    }

    // ==== GROUPES ====

    async createGroupe(dto: CreateGroupeMatiereDto): Promise<GroupeMatiere> {
        const groupe = this.groupeRepo.create(dto);
        await this.groupeRepo.save(groupe);
        return groupe;
    }

    async findAllGroupes(): Promise<GroupeMatiere[]> {
        return this.groupeRepo.find({ order: { ordre: 'ASC' } });
    }

    // ==== PROGRAMME (Matière-Niveau) ====

    async addMatiereToNiveau(dto: CreateMatiereNiveauDto): Promise<MatiereNiveau> {
        const existing = await this.niveauRepo.findOne({
            where: { matiereId: dto.matiereId, niveauId: dto.niveauId }
        });
        if (existing) throw new AppError('Matière déjà dans ce niveau', 409, 'MATIERE_IN_LEVEL_EXISTS');

        const prog = this.niveauRepo.create(dto);
        await this.niveauRepo.save(prog);
        return prog;
    }

    async getProgrammeNiveau(niveauId: string): Promise<MatiereNiveau[]> {
        return this.niveauRepo.find({
            where: { niveauId },
            relations: ['matiere', 'groupe'],
            order: { groupe: { ordre: 'ASC' }, matiere: { nom: 'ASC' } }
        });
    }

    async updateProgramme(id: string, dto: UpdateMatiereNiveauDto): Promise<MatiereNiveau> {
        const prog = await this.niveauRepo.findOne({ where: { id } });
        if (!prog) throw new AppError('Programme non trouvé', 404, 'NOT_FOUND');
        Object.assign(prog, dto);
        await this.niveauRepo.save(prog);
        return prog;
    }

    // ==== AFFECTATIONS ENSEIGNANTS ====

    async affecterEnseignant(dto: AffecterEnseignantDto): Promise<AffectationMatiere> {
        const classe = await classesService.findOne(dto.classeId);

        // Vérifier si matière est enseignée dans ce niveau (programme)
        const prog = await this.niveauRepo.findOne({
            where: { matiereId: dto.matiereId, niveauId: classe.niveauId }
        });
        // Warning: Pas obligatoire que ce soit dans le programme pour être enseigné ? Si, logiquement.
        if (!prog) throw new AppError('Cette matière n\'est pas au programme de ce niveau', 400, 'MATIERE_NOT_IN_LEVEL');

        // Vérifier doublons ? Un enseignant par matière par classe par année ?
        // Ou plusieurs enseignants possible (co-enseignement) ?
        // Simplification: unique pour l'instant
        const existing = await this.affectationRepo.findOne({
            where: {
                matiereId: dto.matiereId,
                classeId: dto.classeId,
                anneeScolaireId: classe.anneeScolaireId
            }
        });

        if (existing) {
            existing.enseignantId = dto.enseignantId; // Mise à jour de l'enseignant
            if (dto.volumeHoraireHebdo) existing.volumeHoraireHebdo = dto.volumeHoraireHebdo;
            await this.affectationRepo.save(existing);
            return existing;
        }

        const affectation = this.affectationRepo.create({
            ...dto,
            anneeScolaireId: classe.anneeScolaireId
        });
        await this.affectationRepo.save(affectation);
        return affectation;
    }
}

export const matieresService = new MatieresService();
