import { Router, Request, Response } from 'express';
import { networkService } from '../services/network.service';

const router = Router();

router.get('/ping', async (_req: Request, res: Response) => {
    try {
        const result = await networkService.ping();
        res.json(result);
    } catch {
        res.status(503).json({
            status: 'down',
            serverHealth: 'down',
            timestamp: new Date().toISOString(),
            details: {
                database: false,
                memory: false,
                freeMemoryMB: 0,
                internet: null,
            },
        });
    }
});

export { router as networkController };
