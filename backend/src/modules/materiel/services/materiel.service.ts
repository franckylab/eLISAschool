import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Materiel, PretMateriel, CategorieMateriel } from '../entities';
import { CreateMaterielDto, PretMaterielDto, RetourMaterielDto } from '../dto';
import { AppError } from '@common/filters/error.filter';

export class MaterielService {
    private materielRepo: Repository<Materiel>;
    private pretRepo: Repository<PretMateriel>;

    constructor() {
        this.materielRepo = AppDataSource.getRepository(Materiel);
        this.pretRepo = AppDataSource.getRepository(PretMateriel);
    }

    async create(dto: CreateMaterielDto): Promise<Materiel> {
        const materiel = this.materielRepo.create({ ...dto, dateAcquisition: dto.dateAcquisition ? new Date(dto.dateAcquisition) : undefined });
        await this.materielRepo.save(materiel);
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
        const materiel = await this.findOne(dto.materielId);
        if (!materiel.disponible || materiel.quantite < dto.quantite) {
            throw new AppError('Matériel non disponible', 400, 'NOT_AVAILABLE');
        }
        materiel.quantite -= dto.quantite;
        if (materiel.quantite === 0) materiel.disponible = false;
        await this.materielRepo.save(materiel);

        const pret = this.pretRepo.create({ ...dto, datePret: new Date(), dateRetourPrevue: dto.dateRetourPrevue ? new Date(dto.dateRetourPrevue) : undefined });
        await this.pretRepo.save(pret);
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

        return pret;
    }

    async getPretsEnCours(): Promise<PretMateriel[]> {
        return this.pretRepo.find({ where: { retourne: false }, relations: ['materiel', 'emprunteur'] });
    }
}

export const materielService = new MaterielService();
