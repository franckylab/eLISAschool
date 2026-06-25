import { Router } from 'express';
import { CartesService } from '../services/cartes.service';
import { modeleCarteService } from '../services/modele-carte.service';
import { generationBatchService } from '../services/generation-batch.service';
import { createCarteSchema, updateCarteSchema, createModeleCarteSchema, updateModeleCarteSchema } from '../dto';
import { authMiddleware } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const cartesService = new CartesService();

router.use(authMiddleware);

router.get('/utilisateur/:utilisateurId', async (req, res, next) => {
    try {
        const cartes = await cartesService.findByUser(req.params.utilisateurId);
        res.json({ success: true, data: cartes, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/numero/:numeroCarte', async (req, res, next) => {
    try {
        const carte = await cartesService.findByNumero(req.params.numeroCarte);
        res.json({ success: true, data: carte, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
    try {
        const carte = await cartesService.findOne(req.params.id);
        res.json({ success: true, data: carte, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
    try {
        const dto = validateDto(createCarteSchema, req.body);
        const carte = await cartesService.create(dto, req.etablissementId, req.utilisateur?.id);
        res.status(201).json({ success: true, data: carte, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const dto = validateDto(updateCarteSchema, req.body);
        const carte = await cartesService.update(req.params.id, dto);
        res.json({ success: true, data: carte, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/:id/desactiver', async (req, res, next) => {
    try {
        const carte = await cartesService.desactiver(req.params.id);
        res.json({ success: true, data: carte, message: 'Carte désactivée', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/:id/renouveler', async (req, res, next) => {
    try {
        const carte = await cartesService.renouveler(req.params.id, req.utilisateur?.id, req.etablissementId);
        res.json({ success: true, data: carte, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/:id/perte', async (req, res, next) => {
    try {
        const carte = await cartesService.signalerPerte(req.params.id);
        res.json({ success: true, data: carte, message: 'Perte signalée', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// Routes Modèles de Cartes (v2.0)
// ==================================

router.get('/modeles', async (req, res, next) => {
    try {
        const type = req.query.type as string;
        const modeles = await modeleCarteService.findAll(req.etablissementId, type);
        res.json({ success: true, data: modeles, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/modeles', async (req, res, next) => {
    try {
        const dto = validateDto(createModeleCarteSchema, req.body);
        const modele = await modeleCarteService.create(dto, req.etablissementId);
        res.status(201).json({ success: true, data: modele, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/modeles/:id', async (req, res, next) => {
    try {
        const modele = await modeleCarteService.findOne(req.params.id, req.etablissementId);
        res.json({ success: true, data: modele, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.patch('/modeles/:id', async (req, res, next) => {
    try {
        const dto = validateDto(updateModeleCarteSchema, req.body);
        const modele = await modeleCarteService.update(req.params.id, dto, req.etablissementId);
        res.json({ success: true, data: modele, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.delete('/modeles/:id', async (req, res, next) => {
    try {
        await modeleCarteService.delete(req.params.id, req.etablissementId);
        res.json({ success: true, message: 'Modèle supprimé', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// Routes Génération Batch (v2.0)
// ==================================

router.post('/batch/classe/:classeId', async (req, res, next) => {
    try {
        const { type, modeleId } = req.body;
        if (!type) {
            throw new Error('Le type de carte est requis');
        }
        const result = await generationBatchService.genererCartesClasse(
            req.params.classeId,
            type,
            req.etablissementId,
            modeleId,
            req.utilisateur?.id
        );
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/batch/personnel', async (req, res, next) => {
    try {
        const { type, modeleId } = req.body;
        if (!type) {
            throw new Error('Le type de carte est requis');
        }
        const result = await generationBatchService.genererCartesPersonnel(
            type,
            req.etablissementId,
            modeleId
        );
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

export const cartesController = router;
