/**
 * ==================================
 * eLISAschool - Controller Élèves
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ElevesService } from '../services';
import { createEleveSchema, updateEleveSchema, preinscriptionSchema, convertirPreinscriptionSchema, queryInscriptionsSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';
import { Etablissement } from '@modules/etablissement/entities';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new ElevesService();

// ==================================
// LISTE GÉNÉRIQUE
// ==================================

router.get('/', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            sortBy: 'createdAt',
            sortOrder: 'DESC' as const,
            search: req.query.search as string,
            sousSysteme: req.query.sousSysteme as any,
            statut: req.query.statut as any,
            classeId: req.query.classeId as string,
        };
        const eleves = await service.findAll(query, req.etablissementId);
        res.json({ success: true, data: eleves });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createEleveSchema, req.body);
        const eleve = await service.create(dto, req.etablissementId, req);
        res.status(201).json({ success: true, data: eleve });
    } catch (error) { next(error); }
});

// ==================================
// PRÉINSCRIPTION (Route publique)
// ==================================

router.post('/preinscription', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(preinscriptionSchema, req.body);
        
        const etablissementRepo = AppDataSource.getRepository(Etablissement);
        const etablissement = await etablissementRepo.createQueryBuilder('e')
            .where('e.code = :code OR e.nom LIKE :code', { code: dto.codeEtablissement })
            .getOne();
        
        if (!etablissement) {
            throw new AppError('Code établissement invalide', 400, 'INVALID_CODE_ETABLISSEMENT');
        }
        
        const preinscription = await service.createPreinscription(dto, etablissement.id);
        res.status(201).json({ 
            success: true, 
            data: preinscription,
            message: 'Préinscription soumise avec succès. Elle sera traitée par l\'établissement.'
        });
    } catch (error) { next(error); }
});

// ==================================
// GESTION DES PRÉINSCRIPTIONS (Auth requis)
// ==================================

router.get('/preinscriptions/en-attente', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            sortBy: 'createdAt',
            sortOrder: 'DESC' as const,
            search: req.query.search as string,
        };
        const preinscriptions = await service.findPreinscriptionsEnAttente(query, req.etablissementId);
        res.json({ success: true, data: preinscriptions });
    } catch (error) { next(error); }
});

router.post('/preinscription/:id/convertir', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(convertirPreinscriptionSchema, req.body);
        const personnelId = req.utilisateur?.id;
        const preinscription = await service.convertirPreinscriptionEnInscription(
            req.params.id,
            dto,
            personnelId || '',
            req.etablissementId,
            req
        );
        res.json({ 
            success: true, 
            data: preinscription,
            message: 'Préinscription convertie en inscription avec succès'
        });
    } catch (error) { next(error); }
});

router.post('/preinscription/:id/refuser', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { motif } = req.body;
        if (!motif || motif.trim().length === 0) {
            throw new AppError('Le motif de refus est obligatoire', 400, 'MISSING_MOTIF');
        }
        const personnelId = req.utilisateur?.id;
        const preinscription = await service.refuserPreinscription(
            req.params.id,
            motif,
            personnelId || '',
            req.etablissementId,
            req
        );
        res.json({ 
            success: true, 
            data: preinscription,
            message: 'Préinscription refusée'
        });
    } catch (error) { next(error); }
});

// ==================================
// LISTE DES INSCRIPTIONS (avec filtres)
// ==================================

router.get('/inscriptions', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
            sortBy: req.query.sortBy as string || 'createdAt',
            sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
            search: req.query.search as string,
            etatInscription: req.query.etatInscription as any,
            typeInscription: req.query.typeInscription as any,
            estPreinscription: req.query.estPreinscription === 'true' ? true : req.query.estPreinscription === 'false' ? false : undefined,
            dateDebut: req.query.dateDebut as string,
            dateFin: req.query.dateFin as string,
        };
        
        const result = await service.findAll(query, req.etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// ==================================
// EXPORT CSV
// ==================================

router.get('/export', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filtres = {
            search: req.query.search as string,
            classeId: req.query.classeId as string,
            anneeScolaireId: req.query.anneeScolaireId as string,
            statut: req.query.statut as string,
        };
        
        const csvContent = await service.exportElevesCSV(filtres, req.etablissementId!);
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="eleves_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send('\ufeff' + csvContent);
    } catch (error) { next(error); }
});

// ==================================
// IMPORT CSV
// ==================================

router.post('/import', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { csvContent, classeAnneeId } = req.body;
        
        if (!csvContent || !classeAnneeId) {
            throw new AppError('csvContent et classeAnneeId sont obligatoires', 400, 'MISSING_FIELDS');
        }
        
        const result = await service.importElevesCSV(csvContent, req.etablissementId!, classeAnneeId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// ==================================
// ROUTES PARAMÉTRÉES (EN DERNIER pour ne pas shadow les routes littérales)
// ==================================

router.get('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const eleve = await service.findOne(req.params.id, req.etablissementId);
        res.json({ success: true, data: eleve });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateEleveSchema, req.body);
        const eleve = await service.update(req.params.id, dto, req.etablissementId, req);
        res.json({ success: true, data: eleve });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id, req.etablissementId, req);
        res.json({ success: true, message: 'Dossier élève supprimé' });
    } catch (error) { next(error); }
});

router.post('/:id/restaurer', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const eleve = await service.restaurer(req.params.id, req.etablissementId!, req);
        res.json({ success: true, data: eleve, message: 'Dossier élève restauré' });
    } catch (error) { next(error); }
});

router.post('/:id/documents', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { documentUrl, type } = req.body;
        if (!documentUrl || !type) {
            throw new AppError('documentUrl et type sont obligatoires', 400, 'MISSING_FIELDS');
        }
        const eleve = await service.uploadDocumentJustificatif(
            req.params.id,
            documentUrl,
            type,
            req.etablissementId,
            req
        );
        res.json({ success: true, data: eleve });
    } catch (error) { next(error); }
});

export const elevesController = router;
export default router;
