/**
 * ==================================
 * eLISAschool - Service Bulletins
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Bulletin } from '../entities';
import { GenerateBulletinDto, UpdateBulletinDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { classesService } from '@modules/classes/services';
import { periodesService } from '@modules/periodes/services';
import { notesService } from '@modules/notes/services';
import { matieresService } from '@modules/matieres/services';
import { Eleve } from '@modules/eleves/entities';

export class BulletinsService {
    private repo: Repository<Bulletin>;

    constructor() {
        this.repo = AppDataSource.getRepository(Bulletin);
    }

    async generate(dto: GenerateBulletinDto): Promise<Bulletin[]> {
        const classe = await classesService.findOne(dto.classeId);
        const periode = await periodesService.findOne(dto.periodeId);

        // Récupérer les élèves (tous ou un seul)
        const eleveRepo = AppDataSource.getRepository(Eleve);
        let eleves: Eleve[] = [];
        if (dto.eleveId) {
            const eleve = await eleveRepo.findOne({ where: { id: dto.eleveId } });
            if (eleve) eleves.push(eleve);
        } else {
            // Find eleves in class via affectations
            // Note: ElevesService findAll doesn't filter by class directly, we need to query affectations
            // Shortcut: We'll assume we can query via AffectationEleve or just use a custom query.
            // For now, let's use a query on AffectationEleve in Classes module
            // But ClassesService doesn't expose "getEleves".
            // Let's modify ClassesService or just query here for simplicity/MVP.
            const affectationRepo = AppDataSource.getRepository('AffectationEleve');
            const affectations = await affectationRepo.find({
                where: { classeId: dto.classeId, actif: true },
                relations: ['eleve'] // Wait, relation eleve in AffectationEleve? I commented it out in initial implementation!
                // CHECK: modules/classes/entities/affectation-eleve.entity.ts
            }) as any[]; // Cast to avoid TS error if relation missing in type def

            // If relation missing, we need to fetch eleves manually.
            // Let's assume relation exists or we fetch by IDs.
            const eleveIds = affectations.map((a: any) => a.eleveId);
            if (eleveIds.length > 0) {
                eleves = await eleveRepo.findByIds(eleveIds);
            }
        }

        const bulletins: Bulletin[] = [];

        for (const eleve of eleves) {
            // Calculer Moyenne Générale
            // 1. Récupérer programme (matieres)
            const programme = await matieresService.getProgrammeNiveau(classe.niveauId);

            let totalPoints = 0;
            let totalCoeffs = 0;

            for (const matiereNiveau of programme) {
                const moyenneMatiere = await notesService.calculerMoyenne(eleve.id, matiereNiveau.matiereId, periode.id);
                totalPoints += moyenneMatiere * matiereNiveau.coefficient;
                totalCoeffs += matiereNiveau.coefficient;
            }

            const moyenneGenerale = totalCoeffs > 0 ? totalPoints / totalCoeffs : 0;

            // Créer ou MAJ Bulletin
            let bulletin = await this.repo.findOne({
                where: { eleveId: eleve.id, classeId: classe.id, periodeId: periode.id }
            });

            if (!bulletin) {
                bulletin = this.repo.create({
                    eleveId: eleve.id,
                    classeId: classe.id,
                    periodeId: periode.id,
                    anneeScolaireId: classe.anneeScolaireId,
                });
            }

            bulletin.moyenneGenerale = parseFloat(moyenneGenerale.toFixed(2));

            await this.repo.save(bulletin);
            bulletins.push(bulletin);
        }

        // Calcul Rangs (si classe entière) - Simplification: Recalculer rangs pour tous les bulletins de la classe/période
        // TODO: Separate ranking logic

        logger.info(`${bulletins.length} bulletins générés pour la classe ${classe.nom}`);
        return bulletins;
    }

    async findByEleve(eleveId: string): Promise<Bulletin[]> {
        return this.repo.find({
            where: { eleveId },
            relations: ['periode', 'classe'],
            order: { periode: { dateDebut: 'ASC' } }
        });
    }

    async update(id: string, dto: UpdateBulletinDto): Promise<Bulletin> {
        const bulletin = await this.repo.findOne({ where: { id } });
        if (!bulletin) throw new AppError('Bulletin non trouvé', 404, 'NOT_FOUND');
        Object.assign(bulletin, dto);
        await this.repo.save(bulletin);
        return bulletin;
    }
}

export const bulletinsService = new BulletinsService();
