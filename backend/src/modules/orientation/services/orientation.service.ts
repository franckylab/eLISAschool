/**
 * ==================================
 * eLISAschool - Service Orientation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ProfilOrientation, FicheMetier, RdvOrientation, TypeFiliere } from '../entities';
import { CreateProfilOrientationDto, UpdateProfilOrientationDto, CreateFicheMetierDto, CreateRdvDto, UpdateRdvDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';

/**
 * Service d'orientation avec configuration centralisée
 */
export class OrientationService {
    private profilRepo: Repository<ProfilOrientation>;
    private ficheRepo: Repository<FicheMetier>;
    private rdvRepo: Repository<RdvOrientation>;

    constructor() {
        this.profilRepo = AppDataSource.getRepository(ProfilOrientation);
        this.ficheRepo = AppDataSource.getRepository(FicheMetier);
        this.rdvRepo = AppDataSource.getRepository(RdvOrientation);
    }

    // ============ PROFILS ============

    async createProfil(dto: CreateProfilOrientationDto): Promise<ProfilOrientation> {
        const existing = await this.profilRepo.findOne({ where: { eleveId: dto.eleveId } });
        if (existing) {
            throw new AppError('Un profil existe déjà pour cet élève', 409, 'PROFILE_EXISTS');
        }

        const profil = this.profilRepo.create(dto);
        await this.profilRepo.save(profil);
        logger.info(`Profil orientation créé pour élève ${dto.eleveId}`);
        return profil;
    }

    async getProfil(eleveId: string): Promise<ProfilOrientation | null> {
        return this.profilRepo.findOne({ where: { eleveId } });
    }

    async updateProfil(eleveId: string, dto: UpdateProfilOrientationDto): Promise<ProfilOrientation> {
        let profil = await this.profilRepo.findOne({ where: { eleveId } });
        if (!profil) {
            profil = this.profilRepo.create({ eleveId, ...dto });
        } else {
            Object.assign(profil, dto);
        }
        await this.profilRepo.save(profil);
        return profil;
    }

    async suggestFilieres(eleveId: string): Promise<{ filiere: TypeFiliere; score: number }[]> {
        const profil = await this.getProfil(eleveId);
        if (!profil || !profil.aptitudes) {
            return [];
        }

        // Algorithme simple de suggestion basé sur les aptitudes
        const scores: Record<TypeFiliere, number> = {
            [TypeFiliere.SCIENTIFIQUE]: 0,
            [TypeFiliere.LITTERAIRE]: 0,
            [TypeFiliere.TECHNIQUE]: 0,
            [TypeFiliere.PROFESSIONNELLE]: 0,
            [TypeFiliere.ARTISTIQUE]: 0,
        };

        for (const apt of profil.aptitudes) {
            const domaine = apt.domaine.toLowerCase();
            if (domaine.includes('math') || domaine.includes('physique') || domaine.includes('science')) {
                scores[TypeFiliere.SCIENTIFIQUE] += apt.niveau;
            }
            if (domaine.includes('français') || domaine.includes('lettre') || domaine.includes('philo')) {
                scores[TypeFiliere.LITTERAIRE] += apt.niveau;
            }
            if (domaine.includes('tech') || domaine.includes('info') || domaine.includes('électro')) {
                scores[TypeFiliere.TECHNIQUE] += apt.niveau;
            }
            if (domaine.includes('art') || domaine.includes('musique') || domaine.includes('dessin')) {
                scores[TypeFiliere.ARTISTIQUE] += apt.niveau;
            }
        }

        return Object.entries(scores)
            .map(([filiere, score]) => ({ filiere: filiere as TypeFiliere, score }))
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score);
    }

    // ============ FICHES MÉTIERS ============

    async createFiche(dto: CreateFicheMetierDto): Promise<FicheMetier> {
        const fiche = this.ficheRepo.create(dto);
        await this.ficheRepo.save(fiche);
        logger.info(`Fiche métier créée: ${dto.nom}`);
        return fiche;
    }

    async getFiches(filiere?: TypeFiliere): Promise<FicheMetier[]> {
        const where: any = { actif: true };
        if (filiere) where.filiere = filiere;
        return this.ficheRepo.find({ where, order: { nom: 'ASC' } });
    }

    async getFiche(id: string): Promise<FicheMetier> {
        const fiche = await this.ficheRepo.findOne({ where: { id } });
        if (!fiche) throw new AppError('Fiche non trouvée', 404, 'NOT_FOUND');
        return fiche;
    }

    async searchFiches(query: string): Promise<FicheMetier[]> {
        return this.ficheRepo.createQueryBuilder('f')
            .where('f.actif = :actif', { actif: true })
            .andWhere('(f.nom ILIKE :query OR f.description ILIKE :query)', { query: `%${query}%` })
            .getMany();
    }

    // ============ RENDEZ-VOUS ============

    async createRdv(dto: CreateRdvDto): Promise<RdvOrientation> {
        const rdv = this.rdvRepo.create({
            ...dto,
            date: new Date(dto.date),
        });
        await this.rdvRepo.save(rdv);
        logger.info(`RDV orientation créé pour élève ${dto.eleveId}`);
        return rdv;
    }

    async getRdvsByEleve(eleveId: string): Promise<RdvOrientation[]> {
        return this.rdvRepo.find({
            where: { eleveId },
            order: { date: 'DESC' },
        });
    }

    async getRdvsByConseiller(conseillerId: string): Promise<RdvOrientation[]> {
        return this.rdvRepo.find({
            where: { conseillerId },
            order: { date: 'ASC' },
        });
    }

    async updateRdv(id: string, dto: UpdateRdvDto): Promise<RdvOrientation> {
        const rdv = await this.rdvRepo.findOne({ where: { id } });
        if (!rdv) throw new AppError('RDV non trouvé', 404, 'NOT_FOUND');

        if (dto.date) rdv.date = new Date(dto.date);
        if (dto.dureeMinutes) rdv.dureeMinutes = dto.dureeMinutes;
        if (dto.compteRendu) rdv.compteRendu = dto.compteRendu;
        if (dto.recommandations) rdv.recommandations = dto.recommandations;
        if (dto.statut) rdv.statut = dto.statut;

        await this.rdvRepo.save(rdv);
        return rdv;
    }

    async annulerRdv(id: string): Promise<RdvOrientation> {
        return this.updateRdv(id, { statut: 'ANNULE' });
    }
}

export const orientationService = new OrientationService();
