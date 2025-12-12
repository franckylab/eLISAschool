import { Router } from 'express';
import { GamificationService } from '../services/gamification.service';
import { createBadgeSchema, attribuerPointsSchema, attribuerBadgeSchema } from '../dto';
import { authMiddleware, adminOnly } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const gamificationService = new GamificationService();

function validate<T>(schema: any, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
  return result.data;
}

router.get('/badges', async (req, res, next) => {
  try {
    const badges = await gamificationService.getBadges();
    res.json({ success: true, data: badges, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

router.post('/badges', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const dto = validate(createBadgeSchema, req.body);
    const badge = await gamificationService.createBadge(dto);
    res.status(201).json({ success: true, data: badge, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

router.get('/classement', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const classement = await gamificationService.getClassement(limit);
    res.json({ success: true, data: classement, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

router.get('/utilisateurs/:id/points', authMiddleware, async (req, res, next) => {
  try {
    const points = await gamificationService.getPointsUtilisateur(req.params.id);
    res.json({ success: true, data: points, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

router.get('/utilisateurs/:id/badges', authMiddleware, async (req, res, next) => {
  try {
    const badges = await gamificationService.getBadgesUtilisateur(req.params.id);
    res.json({ success: true, data: badges, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

router.get('/utilisateurs/:id/historique', authMiddleware, async (req, res, next) => {
  try {
    const historique = await gamificationService.getHistoriquePoints(req.params.id);
    res.json({ success: true, data: historique, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

router.post('/points', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const dto = validate(attribuerPointsSchema, req.body);
    const points = await gamificationService.attribuerPoints(dto);
    res.status(201).json({ success: true, data: points, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

router.post('/attribuer-badge', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const dto = validate(attribuerBadgeSchema, req.body);
    const badge = await gamificationService.attribuerBadge(dto);
    res.status(201).json({ success: true, data: badge, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

export const gamificationController = router;
