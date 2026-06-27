/**
 * ==================================
 * eLISAschool - Controller Configuration Matière Classe
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { ConfigurationMatiereClasse } from '../entities';
import { createConfigurationMatiereClasseSchema, updateConfigurationMatiereClasseSchema } from '../dto';
import { authMiddleware } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const repo = AppDataSource.getRepository(ConfigurationMatiereClasse);

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// Routes CRUD Configuration Matière Classe
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const where: any = {};
        if (req.utilisateur?.etablissementId) {
            where.etablissementId = req.utilisateur.etablissementId;
        }
        
        const data = await repo.find({
            where,
            relations: ['matiere', 'classe', 'anneeScolaire'],
            order: { createdAt: 'DESC' },
        });
        
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createConfigurationMatiereClasseSchema, req.body);
        
        // Vérifier l'unicité
        const existing = await repo.findOne({
            where: {
                matiereId: dto.matiereId,
                classeAnneeId: dto.classeAnneeId,
                etablissementId: dto.etablissementId || req.utilisateur?.etablissementId,
            },
        });
        
        if (existing) {
            throw new AppError(
                'Cette matière est déjà configurée pour cette classe/année',
                409,
                'CONFIG_MATIERE_CLASSE_EXISTS'
            );
        }
        
        if (!dto.etablissementId && req.utilisateur?.etablissementId) {
            dto.etablissementId = req.utilisateur.etablissementId;
        }
        
        const created = repo.create(dto);
        await repo.save(created);
        
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await repo.findOne({
            where: { id: req.params.id },
            relations: ['matiere', 'classe', 'anneeScolaire'],
        });
        
        if (!data) {
            throw new AppError('Configuration matière-classe non trouvée', 404, 'NOT_FOUND');
        }
        
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await repo.findOne({ where: { id: req.params.id } });
        
        if (!config) {
            throw new AppError('Configuration matière-classe non trouvée', 404, 'NOT_FOUND');
        }
        
        const dto = validate(updateConfigurationMatiereClasseSchema, req.body);
        Object.assign(config, dto);
        await repo.save(config);
        
        res.json({ success: true, data: config });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await repo.findOne({ where: { id: req.params.id } });
        
        if (!config) {
            throw new AppError('Configuration matière-classe non trouvée', 404, 'NOT_FOUND');
        }
        
        await repo.remove(config);
        res.json({ success: true, message: 'Configuration supprimée' });
    } catch (error) { next(error); }
});

export const configurationMatiereClasseController = router;
export default router;
