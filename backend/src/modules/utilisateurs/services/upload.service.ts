import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ProfilUtilisateur, Utilisateur } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { traiterPhotoProfil, traiterPieceIdentite, validerMimeUpload } from '@common/utils/image-processor.util';

export class UploadService {
    private profilRepository: Repository<ProfilUtilisateur>;
    private utilisateurRepository: Repository<Utilisateur>;

    constructor() {
        this.profilRepository = AppDataSource.getRepository(ProfilUtilisateur);
        this.utilisateurRepository = AppDataSource.getRepository(Utilisateur);
    }

    async uploadPhoto(utilisateurId: string, file: Express.Multer.File): Promise<{ photoUrl: string; photoThumbnail: string }> {
        const utilisateur = await this.utilisateurRepository.findOne({ where: { id: utilisateurId } });
        if (!utilisateur) throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');

        validerMimeUpload(file.mimetype);

        const resultat = await traiterPhotoProfil(file.buffer, file.mimetype);

        let profil = await this.profilRepository.findOne({ where: { utilisateurId } });
        if (!profil) {
            profil = this.profilRepository.create({ utilisateurId, nom: '', prenom: '' });
        }

        profil.photoUrl = resultat.url;
        profil.photoThumbnail = resultat.thumbnailUrl;
        await this.profilRepository.save(profil);

        logger.info(`Photo de profil uploadée: ${utilisateurId}`);

        return { photoUrl: resultat.url, photoThumbnail: resultat.thumbnailUrl };
    }

    async deletePhoto(utilisateurId: string): Promise<void> {
        const profil = await this.profilRepository.findOne({ where: { utilisateurId } });
        if (!profil) throw new AppError('Profil non trouvé', 404, 'PROFILE_NOT_FOUND');

        profil.photoUrl = null as any;
        profil.photoThumbnail = null as any;
        await this.profilRepository.save(profil);

        logger.info(`Photo de profil supprimée: ${utilisateurId}`);
    }

    async uploadPieceRecto(utilisateurId: string, file: Express.Multer.File): Promise<{ pieceRectoUrl: string }> {
        const utilisateur = await this.utilisateurRepository.findOne({ where: { id: utilisateurId } });
        if (!utilisateur) throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');

        validerMimeUpload(file.mimetype);

        const resultat = await traiterPieceIdentite(file.buffer, file.mimetype);

        let profil = await this.profilRepository.findOne({ where: { utilisateurId } });
        if (!profil) {
            profil = this.profilRepository.create({ utilisateurId, nom: '', prenom: '' });
        }

        profil.pieceRectoUrl = resultat.url;
        await this.profilRepository.save(profil);

        logger.info(`Pièce recto uploadée: ${utilisateurId}`);

        return { pieceRectoUrl: resultat.url };
    }

    async uploadPieceVerso(utilisateurId: string, file: Express.Multer.File): Promise<{ pieceVersoUrl: string }> {
        const utilisateur = await this.utilisateurRepository.findOne({ where: { id: utilisateurId } });
        if (!utilisateur) throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');

        validerMimeUpload(file.mimetype);

        const resultat = await traiterPieceIdentite(file.buffer, file.mimetype);

        let profil = await this.profilRepository.findOne({ where: { utilisateurId } });
        if (!profil) {
            profil = this.profilRepository.create({ utilisateurId, nom: '', prenom: '' });
        }

        profil.pieceVersoUrl = resultat.url;
        await this.profilRepository.save(profil);

        logger.info(`Pièce verso uploadée: ${utilisateurId}`);

        return { pieceVersoUrl: resultat.url };
    }
}

export const uploadService = new UploadService();
export default UploadService;
