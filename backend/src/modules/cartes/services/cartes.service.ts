import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Carte, TypeCarte, StatutCarte } from '../entities';
import { CreateCarteDto, UpdateCarteDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { generateQRCodeDataURL as generateQRCode } from '@common/utils/qr.util';

export class CartesService {
    private carteRepo: Repository<Carte>;

    constructor() {
        this.carteRepo = AppDataSource.getRepository(Carte);
    }

    async create(dto: CreateCarteDto): Promise<Carte> {
        const numeroCarte = this.genererNumeroCarte(dto.type);
        const qrCode = await generateQRCode(JSON.stringify({ id: numeroCarte, type: dto.type }));

        const carte = this.carteRepo.create({
            ...dto,
            numeroCarte,
            qrCode,
            dateExpiration: dto.dateExpiration ? new Date(dto.dateExpiration) : undefined,
        });
        await this.carteRepo.save(carte);
        return carte;
    }

    async findByUser(utilisateurId: string): Promise<Carte[]> {
        return this.carteRepo.find({ where: { utilisateurId } });
    }

    async findOne(id: string): Promise<Carte> {
        const carte = await this.carteRepo.findOne({ where: { id }, relations: ['utilisateur'] });
        if (!carte) throw new AppError('Carte non trouvée', 404, 'NOT_FOUND');
        return carte;
    }

    async findByNumero(numeroCarte: string): Promise<Carte> {
        const carte = await this.carteRepo.findOne({ where: { numeroCarte }, relations: ['utilisateur'] });
        if (!carte) throw new AppError('Carte non trouvée', 404, 'NOT_FOUND');
        return carte;
    }

    async update(id: string, dto: UpdateCarteDto): Promise<Carte> {
        const carte = await this.findOne(id);
        if (dto.statut) carte.statut = dto.statut as StatutCarte;
        if (dto.dateExpiration) carte.dateExpiration = new Date(dto.dateExpiration);
        await this.carteRepo.save(carte);
        return carte;
    }

    async desactiver(id: string): Promise<Carte> {
        const carte = await this.findOne(id);
        carte.statut = StatutCarte.INACTIVE;
        await this.carteRepo.save(carte);
        return carte;
    }

    async signalerPerte(id: string): Promise<Carte> {
        const carte = await this.findOne(id);
        carte.statut = StatutCarte.PERDUE;
        await this.carteRepo.save(carte);
        return carte;
    }

    private genererNumeroCarte(type: string): string {
        const prefix = type.substring(0, 3).toUpperCase();
        const annee = new Date().getFullYear().toString().slice(-2);
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}${annee}${random}`;
    }
}

export const cartesService = new CartesService();
