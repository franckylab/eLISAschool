import { Router } from 'express';
import { GamificationService } from '../services/gamification.service';
import { createBadgeSchema, attribuerPointsSchema, attribuerBadgeSchema } from '../dto';
import { authMiddleware, adminOnly } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const gamificationService = new GamificationService();

router.get('/badges', async (req, res, next) => {
  try {
    const badges = await gamificationService.getBadges();
    res.json({ success: true, data: badges, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

router.post('/badges', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const dto = validateDto(createBadgeSchema, req.body);
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
    const dto = validateDto(attribuerPointsSchema, req.body);
    const points = await gamificationService.attribuerPoints(dto);
    res.status(201).json({ success: true, data: points, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

router.post('/attribuer-badge', authMiddleware, adminOnly, async (req, res, next) => {
  try {
    const dto = validateDto(attribuerBadgeSchema, req.body);
    const badge = await gamificationService.attribuerBadge(dto);
    res.status(201).json({ success: true, data: badge, timestamp: new Date().toISOString() });
  } catch (error) { next(error); }
});

export const gamificationController = router;
