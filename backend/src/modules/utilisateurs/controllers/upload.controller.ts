import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadService } from '../services/upload.service';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new AppError('Format non supporté. JPEG, PNG, WEBP, AVIF acceptés.', 400, 'FORMAT_NON_SUPPORTE'));
        }
        cb(null, true);
    },
});

router.use(authMiddleware);

router.post('/:id/upload/photo', requirePermission('utilisateurs:profil:update') as any, upload.single('file') as any, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!req.file) throw new AppError('Fichier requis', 400, 'FILE_REQUIRED');

        const result = await uploadService.uploadPhoto(id, req.file);

        res.status(200).json({ success: true, data: result, message: 'Photo uploadée avec succès' });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id/upload/photo', requirePermission('utilisateurs:profil:update') as any, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await uploadService.deletePhoto(id);

        res.status(200).json({ success: true, message: 'Photo supprimée avec succès' });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/upload/piece-recto', requirePermission('utilisateurs:profil:update') as any, upload.single('file') as any, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!req.file) throw new AppError('Fichier requis', 400, 'FILE_REQUIRED');

        const result = await uploadService.uploadPieceRecto(id, req.file);

        res.status(200).json({ success: true, data: result, message: 'Pièce recto uploadée avec succès' });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/upload/piece-verso', requirePermission('utilisateurs:profil:update') as any, upload.single('file') as any, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!req.file) throw new AppError('Fichier requis', 400, 'FILE_REQUIRED');

        const result = await uploadService.uploadPieceVerso(id, req.file);

        res.status(200).json({ success: true, data: result, message: 'Pièce verso uploadée avec succès' });
    } catch (error) {
        next(error);
    }
});

export const uploadController = router;
export default router;
