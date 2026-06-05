/**
 * ==================================
 * eLISAschool - Service Matériel v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Utilise le système de configuration centralisée
 */

import { Repository, LessThan } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Materiel, PretMateriel, CategorieMateriel, EtatMateriel } from '../entities';
import { CreateMaterielDto, PretMaterielDto, RetourMaterielDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamNumber, getParamBoolean } from '@modules/configuration/utils/config.helper';

/**
 * Service Matériel avec configuration centralisée
 */
export class MaterielService {
    private materielRepo: Repository<Materiel>;
    private pretRepo: Repository<PretMateriel>;

    constructor() {
        this.materielRepo = AppDataSource.getRepository(Materiel);
        this.pretRepo = AppDataSource.getRepository(PretMateriel);
    }

    private async getMaterielParams() {
        return {
            maxLoanDays: await getParamNumber('materiel.max_loan_days', 30),
            enableBarcode: await getParamBoolean('materiel.enable_barcode', true),
        };
    }

    async create(dto: CreateMaterielDto): Promise<Materiel> {
        const params = await this.getMaterielParams();

        const materiel: Materiel = this.materielRepo.create({
            ...dto,
            categorie: dto.categorie as CategorieMateriel,
            etat: dto.etat as EtatMateriel,
            dateAcquisition: dto.dateAcquisition ? new Date(dto.dateAcquisition) : undefined,
        });
        await this.materielRepo.save(materiel);
        logger.info(`Matériel créé: ${dto.nom}`);
        return materiel;
    }

    async findAll(categorie?: string): Promise<Materiel[]> {
        const where: any = {};
        if (categorie) where.categorie = categorie;
        return this.materielRepo.find({ where, order: { nom: 'ASC' } });
    }

    async findOne(id: string): Promise<Materiel> {
        const materiel = await this.materielRepo.findOne({ where: { id } });
        if (!materiel) throw new AppError('Matériel non trouvé', 404, 'NOT_FOUND');
        return materiel;
    }

    async preter(dto: PretMaterielDto): Promise<PretMateriel> {
        const params = await this.getMaterielParams();
        const materiel = await this.findOne(dto.materielId);

        if (!materiel.disponible || materiel.quantite < dto.quantite) {
            throw new AppError('Matériel non disponible', 400, 'NOT_AVAILABLE');
        }

        let dateRetourPrevue = dto.dateRetourPrevue ? new Date(dto.dateRetourPrevue) : null;
        if (!dateRetourPrevue) {
            dateRetourPrevue = new Date();
            dateRetourPrevue.setDate(dateRetourPrevue.getDate() + params.maxLoanDays);
        }

        const aujourdhui = new Date();
        const diffDays = Math.ceil((dateRetourPrevue.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > params.maxLoanDays) {
            throw new AppError(
                `La durée de prêt ne peut pas dépasser ${params.maxLoanDays} jours`,
                400,
                'LOAN_TOO_LONG'
            );
        }

        materiel.quantite -= dto.quantite;
        if (materiel.quantite === 0) materiel.disponible = false;
        await this.materielRepo.save(materiel);

        const pret: PretMateriel = this.pretRepo.create({
            ...dto,
            datePret: new Date(),
            dateRetourPrevue,
        });
        await this.pretRepo.save(pret);

        logger.info(`Prêt matériel: ${materiel.nom} à ${dto.emprunteurId}`);
        return pret;
    }

    async retourner(pretId: string, dto: RetourMaterielDto): Promise<PretMateriel> {
        const pret = await this.pretRepo.findOne({ where: { id: pretId }, relations: ['materiel'] });
        if (!pret) throw new AppError('Prêt non trouvé', 404, 'NOT_FOUND');
        if (pret.retourne) throw new AppError('Déjà retourné', 400, 'ALREADY_RETURNED');

        pret.retourne = true;
        pret.dateRetourEffective = new Date();
        if (dto.notes) pret.notes = (pret.notes || '') + '\n' + dto.notes;
        await this.pretRepo.save(pret);

        const materiel = await this.findOne(pret.materielId);
        materiel.quantite += pret.quantite;
        materiel.disponible = true;
        await this.materielRepo.save(materiel);

        logger.info(`Retour matériel: ${materiel.nom}`);
        return pret;
    }

    async getPretsEnCours(): Promise<PretMateriel[]> {
        return this.pretRepo.find({ where: { retourne: false }, relations: ['materiel', 'emprunteur'] });
    }

    async getPretsEnRetard(): Promise<PretMateriel[]> {
        return this.pretRepo.find({
            where: {
                retourne: false,
                dateRetourPrevue: LessThan(new Date()),
            },
            relations: ['materiel', 'emprunteur'],
        });
    }

    private generateBarcode(): string {
        return `MAT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }
}

export const materielService = new MaterielService();
