/**
 * ==================================
 * eLISAschool - Service Notes
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Repository, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Note, TypeEvaluation, StatutNote } from '../entities';
import { CreateNoteDto, UpdateNoteDto, CreateBulkNotesDto, QueryNotesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

/**
 * Service de gestion des notes
 */
export class NotesService {
    private noteRepository: Repository<Note>;

    constructor() {
        this.noteRepository = AppDataSource.getRepository(Note);
    }

    /**
     * Créer une note
     */
    async create(createDto: CreateNoteDto, enseignantId: string): Promise<Note> {
        const note = this.noteRepository.create({
            ...createDto,
            enseignantId,
            dateEvaluation: createDto.dateEvaluation ? new Date(createDto.dateEvaluation) : undefined,
            statut: StatutNote.BROUILLON,
        });

        await this.noteRepository.save(note);
        logger.info(`Note créée pour élève ${createDto.eleveId} en ${createDto.matiere}`);
        return note;
    }

    /**
     * Créer des notes en masse
     */
    async createBulk(createDto: CreateBulkNotesDto, enseignantId: string): Promise<number> {
        const notes = createDto.notes.map((n) =>
            this.noteRepository.create({
                eleveId: n.eleveId,
                matiere: createDto.matiere,
                classe: createDto.classe,
                typeEvaluation: createDto.typeEvaluation as TypeEvaluation,
                description: createDto.description,
                valeur: n.valeur,
                bareme: createDto.bareme,
                coefficient: createDto.coefficient,
                commentaire: n.commentaire,
                trimestre: createDto.trimestre,
                anneeScolaire: createDto.anneeScolaire,
                dateEvaluation: createDto.dateEvaluation ? new Date(createDto.dateEvaluation) : undefined,
                enseignantId,
                statut: StatutNote.BROUILLON,
            })
        );

        await this.noteRepository.save(notes);
        logger.info(`${notes.length} notes créées en masse pour ${createDto.classe}`);
        return notes.length;
    }

    /**
     * Récupérer les notes avec filtres
     */
    async findAll(query: QueryNotesDto): Promise<{ items: Note[]; total: number }> {
        const { page, limit, eleveId, matiere, classe, trimestre, anneeScolaire, typeEvaluation, statut } = query;

        const where: FindOptionsWhere<Note> = {};
        if (eleveId) where.eleveId = eleveId;
        if (matiere) where.matiere = matiere;
        if (classe) where.classe = classe;
        if (trimestre) where.trimestre = trimestre;
        if (anneeScolaire) where.anneeScolaire = anneeScolaire;
        if (typeEvaluation) where.typeEvaluation = typeEvaluation as TypeEvaluation;
        if (statut) where.statut = statut as StatutNote;

        const [items, total] = await this.noteRepository.findAndCount({
            where,
            relations: ['eleve', 'enseignant'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { items, total };
    }

    /**
     * Récupérer une note par ID
     */
    async findOne(id: string): Promise<Note> {
        const note = await this.noteRepository.findOne({
            where: { id },
            relations: ['eleve', 'enseignant'],
        });

        if (!note) {
            throw new AppError('Note non trouvée', 404, 'NOTE_NOT_FOUND');
        }

        return note;
    }

    /**
     * Mettre à jour une note
     */
    async update(id: string, updateDto: UpdateNoteDto, utilisateurId: string): Promise<Note> {
        const note = await this.findOne(id);

        // Seul l'enseignant qui a créé la note peut la modifier (sauf validation)
        if (note.enseignantId !== utilisateurId && !updateDto.statut) {
            throw new AppError('Non autorisé à modifier cette note', 403, 'FORBIDDEN');
        }

        Object.assign(note, updateDto);

        if (updateDto.statut === StatutNote.VALIDEE) {
            note.validateurId = utilisateurId;
            note.valideeAt = new Date();
        }

        await this.noteRepository.save(note);
        return note;
    }

    /**
     * Valider une note
     */
    async valider(id: string, validateurId: string): Promise<Note> {
        const note = await this.findOne(id);
        note.statut = StatutNote.VALIDEE;
        note.validateurId = validateurId;
        note.valideeAt = new Date();
        await this.noteRepository.save(note);
        logger.info(`Note ${id} validée par ${validateurId}`);
        return note;
    }

    /**
     * Publier une note
     */
    async publier(id: string): Promise<Note> {
        const note = await this.findOne(id);
        if (note.statut !== StatutNote.VALIDEE) {
            throw new AppError('La note doit être validée avant publication', 400, 'NOTE_NOT_VALIDATED');
        }
        note.statut = StatutNote.PUBLIEE;
        await this.noteRepository.save(note);
        return note;
    }

    /**
     * Supprimer une note
     */
    async remove(id: string, utilisateurId: string): Promise<void> {
        const note = await this.findOne(id);
        if (note.enseignantId !== utilisateurId && note.statut !== StatutNote.BROUILLON) {
            throw new AppError('Non autorisé à supprimer cette note', 403, 'FORBIDDEN');
        }
        await this.noteRepository.remove(note);
    }

    /**
     * Calculer la moyenne d'un élève pour une matière
     */
    async calculerMoyenne(eleveId: string, matiere: string, trimestre?: string): Promise<number> {
        const where: FindOptionsWhere<Note> = { eleveId, matiere, statut: StatutNote.PUBLIEE };
        if (trimestre) where.trimestre = trimestre;

        const notes = await this.noteRepository.find({ where });

        if (notes.length === 0) return 0;

        let totalPondere = 0;
        let totalCoeff = 0;

        for (const note of notes) {
            const noteSur20 = (note.valeur / note.bareme) * 20;
            totalPondere += noteSur20 * note.coefficient;
            totalCoeff += note.coefficient;
        }

        return totalCoeff > 0 ? Math.round((totalPondere / totalCoeff) * 100) / 100 : 0;
    }
}

export const notesService = new NotesService();
export default NotesService;
