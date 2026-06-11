import { z } from 'zod';

export const createPlaceParkingSchema = z.object({
    numero: z.string().min(1).max(20),
    type: z.enum(['standard', 'pmr', 'visiteur', 'reservation']).default('standard'),
    tarifHoraire: z.number().min(0).optional(),
});

export const updatePlaceParkingSchema = z.object({
    statut: z.enum(['libre', 'occupee', 'reservee', 'maintenance']).optional(),
    vehiculeId: z.string().uuid().optional().nullable(),
    abonnementId: z.string().uuid().optional().nullable(),
});

export const createVehiculeSchema = z.object({
    proprietaireId: z.string().uuid(),
    immatriculation: z.string().min(1).max(50),
    marque: z.string().max(50).optional(),
    modele: z.string().max(50).optional(),
    couleur: z.string().max(30).optional(),
    type: z.enum(['voiture', 'moto', 'velo', 'autre']).default('voiture'),
    placeParkingId: z.string().uuid().optional(),
});

export const updateVehiculeSchema = z.object({
    marque: z.string().max(50).optional(),
    modele: z.string().max(50).optional(),
    couleur: z.string().max(30).optional(),
    placeParkingId: z.string().uuid().optional().nullable(),
});

export const createAbonnementSchema = z.object({
    titulaireId: z.string().uuid(),
    vehiculeId: z.string().uuid(),
    dateDebut: z.string(),
    dateFin: z.string(),
    tarif: z.number().min(0),
});

export const updateAbonnementSchema = z.object({
    statut: z.enum(['actif', 'expire', 'suspendu']).optional(),
    dateFin: z.string().optional(),
    tarif: z.number().min(0).optional(),
});

export type CreatePlaceParkingDto = z.infer<typeof createPlaceParkingSchema>;
export type UpdatePlaceParkingDto = z.infer<typeof updatePlaceParkingSchema>;
export type CreateVehiculeDto = z.infer<typeof createVehiculeSchema>;
export type UpdateVehiculeDto = z.infer<typeof updateVehiculeSchema>;
export type CreateAbonnementDto = z.infer<typeof createAbonnementSchema>;
export type UpdateAbonnementDto = z.infer<typeof updateAbonnementSchema>;
