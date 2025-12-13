/**
 * ==================================
 * eLISAschool - DTOs Orientation
 * ==================================
 */

import { z } from 'zod';
import { TypeFiliere } from '../entities';

export const createProfilOrientationSchema = z.object({
    eleveId: z.string().uuid(),
    interets: z.array(z.string()).optional(),
    aptitudes: z.array(z.object({
        domaine: z.string(),
        niveau: z.number().min(1).max(10),
    })).optional(),
    objectifs: z.array(z.string()).optional(),
    notes: z.string().optional(),
});

export const updateProfilOrientationSchema = createProfilOrientationSchema.partial().omit({ eleveId: true });

export const createFicheMetierSchema = z.object({
    nom: z.string().min(3).max(255),
    description: z.string().min(10),
    filiere: z.nativeEnum(TypeFiliere),
    competencesRequises: z.array(z.string()).optional(),
    formationsRecommandees: z.array(z.string()).optional(),
    salaireEstime: z.string().optional(),
    debouches: z.string().optional(),
});

export const createRdvSchema = z.object({
    eleveId: z.string().uuid(),
    conseillerId: z.string().uuid(),
    date: z.string().datetime(),
    dureeMinutes: z.number().min(15).max(120).default(30),
    motif: z.string().optional(),
});

export const updateRdvSchema = z.object({
    date: z.string().datetime().optional(),
    dureeMinutes: z.number().min(15).max(120).optional(),
    compteRendu: z.string().optional(),
    recommandations: z.array(z.string()).optional(),
    statut: z.enum(['PLANIFIE', 'TERMINE', 'ANNULE']).optional(),
});

export type CreateProfilOrientationDto = z.infer<typeof createProfilOrientationSchema>;
export type UpdateProfilOrientationDto = z.infer<typeof updateProfilOrientationSchema>;
export type CreateFicheMetierDto = z.infer<typeof createFicheMetierSchema>;
export type CreateRdvDto = z.infer<typeof createRdvSchema>;
export type UpdateRdvDto = z.infer<typeof updateRdvSchema>;
