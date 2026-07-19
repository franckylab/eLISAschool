/**
 * eLISAschool - Module Personnel/RH
 * Controller pour la gestion des bulletins de paie
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';
import { bulletinPaieService } from '../services/bulletin-paie.service';
import {
    createBulletinSchema,
    updateBulletinPaieSchema,
    queryBulletinSchema,
} from '../dto/bulletin-paie.dto';

const router = Router();

// Créer un bulletin
router.post(
    '/',
    authMiddleware,
    requirePermission('paie:create'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createBulletinSchema, req.body);
            const created = await bulletinPaieService.create(
                dto,
                (req as any).etablissementId,
                (req as any).utilisateur?.id,
                req
            );
            res.status(201).json({ success: true, data: created });
        } catch (error) {
            next(error);
        }
    }
);

// Lister les bulletins
router.get(
    '/',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryBulletinSchema, req.query);
            const result = await bulletinPaieService.findAll(
                query,
                (req as any).etablissementId
            );
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir l'historique des bulletins d'un membre
router.get(
    '/membres/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = validateDto(queryBulletinSchema, {
                ...req.query,
                membrePersonnelId: req.params.id,
            });
            const result = await bulletinPaieService.findAll(
                query,
                (req as any).etablissementId
            );
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

// Rapport comptable
router.get(
    '/rapport-comptable',
    authMiddleware,
    requirePermission('paie:export'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { mois, annee } = req.query;
            if (!mois || !annee) {
                throw new Error('Les paramètres mois et annee sont requis');
            }
            const rapport = await bulletinPaieService.getTotalPaiesMensuelles(
                parseInt(mois as string),
                parseInt(annee as string),
                (req as any).etablissementId
            );
            res.json({ success: true, data: rapport });
        } catch (error) {
            next(error);
        }
    }
);

// Générer un bulletin
router.post(
    '/generer/:membreId',
    authMiddleware,
    requirePermission('paie:generer'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { mois, annee } = req.body;
            if (!mois || !annee) {
                throw new Error('Les paramètres mois et annee sont requis');
            }
            const bulletin = await bulletinPaieService.genererBulletin(
                req.params.membreId,
                mois,
                annee,
                (req as any).etablissementId,
                (req as any).utilisateur?.id,
                req
            );
            res.status(201).json({ success: true, data: bulletin });
        } catch (error) {
            next(error);
        }
    }
);

// Obtenir un bulletin
router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const entity = await bulletinPaieService.findOne(
                req.params.id,
                (req as any).etablissementId
            );
            res.json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    }
);

// Mettre à jour un bulletin
router.patch(
    '/:id',
    authMiddleware,
    requirePermission('paie:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateBulletinPaieSchema, req.body);
            const updated = await bulletinPaieService.update(
                req.params.id,
                dto,
                (req as any).utilisateur?.id,
                (req as any).etablissementId,
                req
            );
            res.json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }
);

// Générer le PDF HTML d'un bulletin (print-friendly)
router.get(
    '/:id/pdf',
    authMiddleware,
    requirePermission('paie:export'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const bulletin = await bulletinPaieService.findOne(
                req.params.id,
                (req as any).etablissementId
            );
            const elements = await bulletinPaieService.getElements(
                req.params.id,
                (req as any).etablissementId
            );

            const nom = bulletin.membrePersonnel?.utilisateur?.profil?.prenom ?? '—';
            const prenom = bulletin.membrePersonnel?.utilisateur?.profil?.nom ?? bulletin.membrePersonnelId?.slice(0, 8) ?? '—';
            const matricule = bulletin.membrePersonnel?.matricule ?? '—';
            const moisNom = new Date(bulletin.annee, bulletin.mois - 1, 1)
                .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

            const categorieLabels: Record<string, string> = {
                SALAIRE_BASE: 'Salaire de base',
                PRIME: 'Primes',
                INDEMNITE: 'Indemnités',
                HEURE_SUP: 'Heures supplémentaires',
                HEURE_COURS: 'Heures de cours',
                COTISATION: 'Cotisations',
                RETENUE: 'Retenues',
                AUTRE: 'Autres',
            };

            let gainsHtml = '';
            let retenuesHtml = '';
            let totalGains = 0;
            let totalRetenues = 0;
            let currentCategorieGain = '';
            let currentCategorieRetenue = '';

            for (const el of elements) {
                if (el.type === 'GAIN') {
                    if (el.categorie !== currentCategorieGain) {
                        currentCategorieGain = el.categorie;
                        gainsHtml += `<tr class="sous-total"><td colspan="3" style="font-size:10px;color:#6b7280;padding-top:10px;">${categorieLabels[el.categorie] || el.categorie}</td></tr>`;
                    }
                    totalGains += el.montant;
                    gainsHtml += `<tr><td>${el.libelle}</td><td class="text-right">${el.baseCalcul ? el.baseCalcul.toLocaleString('fr-FR') : ''}</td><td class="text-right text-green">+${el.montant.toLocaleString('fr-FR')} F</td></tr>`;
                } else {
                    if (el.categorie !== currentCategorieRetenue) {
                        currentCategorieRetenue = el.categorie;
                        retenuesHtml += `<tr class="sous-total"><td colspan="3" style="font-size:10px;color:#6b7280;padding-top:10px;">${categorieLabels[el.categorie] || el.categorie}</td></tr>`;
                    }
                    totalRetenues += Math.abs(el.montant);
                    retenuesHtml += `<tr><td>${el.libelle}</td><td class="text-right">${el.baseCalcul ? el.baseCalcul.toLocaleString('fr-FR') : ''}</td><td class="text-right text-red">−${Math.abs(el.montant).toLocaleString('fr-FR')} F</td></tr>`;
                }
            }

            if (gainsHtml) {
                gainsHtml += `<tr class="total"><td>Total gains</td><td></td><td class="text-right text-green">+${totalGains.toLocaleString('fr-FR')} F</td></tr>`;
            }
            if (retenuesHtml) {
                retenuesHtml += `<tr class="total"><td>Total retenues</td><td></td><td class="text-right text-red">−${totalRetenues.toLocaleString('fr-FR')} F</td></tr>`;
            }

            const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Bulletin de paie - ${moisNom}</title>
<style>
@page { margin: 15mm; size: A4; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.4; padding: 20px; }
.header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #1e40af; }
.header h1 { font-size: 16px; color: #1e40af; margin-bottom: 4px; }
.header h2 { font-size: 13px; color: #4b5563; font-weight: normal; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.info-box { border: 1px solid #d1d5db; border-radius: 4px; padding: 10px; }
.info-box h3 { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.info-box p { font-size: 12px; font-weight: 600; }
table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
th { background: #f3f4f6; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; text-align: left; border-bottom: 2px solid #d1d5db; }
td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
tr.total td { font-weight: 700; border-top: 2px solid #1a1a1a; background: #f9fafb; }
tr.sous-total td { font-weight: 600; border-top: 1px solid #9ca3af; background: #f9fafb; }
.text-right { text-align: right; }
.text-green { color: #16a34a; }
.text-red { color: #dc2626; }
.recap { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px; }
.recap-item { border: 1px solid #d1d5db; border-radius: 4px; padding: 12px; text-align: center; }
.recap-item .label { font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
.recap-item .value { font-size: 16px; font-weight: 700; }
.recap-item.net { background: #eef2ff; border-color: #6366f1; }
.recap-item.net .value { color: #4f46e5; }
.footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #d1d5db; font-size: 9px; color: #9ca3af; }
@media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
    <h1>BULLETIN DE PAIE</h1>
    <h2>${moisNom}</h2>
</div>
<div class="info-grid">
    <div class="info-box">
        <h3>Employé</h3>
        <p>${nom} ${prenom}</p>
        <p style="font-weight:normal;font-size:10px;color:#6b7280;">Matricule: ${matricule}</p>
    </div>
    <div class="info-box">
        <h3>Période</h3>
        <p>${moisNom}</p>
        <p style="font-weight:normal;font-size:10px;color:#6b7280;">Statut: ${bulletin.statut}</p>
    </div>
</div>
<table>
<thead>
<tr><th>Libellé</th><th class="text-right">Base</th><th class="text-right">Montant</th></tr>
</thead>
<tbody>
${gainsHtml}
${retenuesHtml}
</tbody>
</table>
<div class="recap">
    <div class="recap-item">
        <div class="label">Salaire brut</div>
        <div class="value">${(bulletin.salaireBase + bulletin.montantHeuresSup + bulletin.primes).toLocaleString('fr-FR')} F</div>
    </div>
    <div class="recap-item">
        <div class="label">Déductions</div>
        <div class="value">${bulletin.deductions.toLocaleString('fr-FR')} F</div>
    </div>
    <div class="recap-item net">
        <div class="label">Net à payer</div>
        <div class="value">${bulletin.salaireNet.toLocaleString('fr-FR')} F</div>
    </div>
</div>
<div class="footer">Document généré automatiquement - eLISAschool RH</div>
</body>
</html>`;

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(html);
        } catch (error) {
            next(error);
        }
    }
);

// Supprimer un bulletin
router.delete(
    '/:id',
    authMiddleware,
    requirePermission('paie:delete'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await bulletinPaieService.delete(
                req.params.id,
                (req as any).utilisateur?.id,
                (req as any).etablissementId,
                req
            );
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

// ─── ÉLÉMENTS DE SALAIRE (CRUD nested sous bulletin) ───

router.get('/:id/elements', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const elements = await bulletinPaieService.getElements(req.params.id, (req as any).etablissementId);
        res.json({ success: true, data: elements });
    } catch (e) { next(e); }
});

router.post('/:id/elements', authMiddleware, requirePermission('paie:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { createElementSalaireSchema } = await import('../dto/paie-etendue.dto');
        const dto = validateDto(createElementSalaireSchema, req.body);
        const element = await bulletinPaieService.addElement(
            req.params.id, dto, (req as any).etablissementId,
            (req as any).utilisateur?.id, req
        );
        res.status(201).json({ success: true, data: element });
    } catch (e) { next(e); }
});

router.patch('/:id/elements/:elementId', authMiddleware, requirePermission('paie:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { updateElementSalaireSchema } = await import('../dto/paie-etendue.dto');
        const dto = validateDto(updateElementSalaireSchema, req.body);
        const element = await bulletinPaieService.updateElement(
            req.params.id, req.params.elementId, dto, (req as any).etablissementId,
            (req as any).utilisateur?.id, req
        );
        res.json({ success: true, data: element });
    } catch (e) { next(e); }
});

router.delete('/:id/elements/:elementId', authMiddleware, requirePermission('paie:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await bulletinPaieService.deleteElement(
            req.params.id, req.params.elementId, (req as any).etablissementId,
            (req as any).utilisateur?.id, req
        );
        res.json({ success: true });
    } catch (e) { next(e); }
});

export const bulletinPaieController = router;
