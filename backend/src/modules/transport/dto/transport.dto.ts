import { z } from 'zod';

export const createLigneSchema = z.object({
    nom: z.string().min(1).max(100),
    numeroLigne: z.string().max(20),
    arrets: z.array(z.object({ nom: z.string(), heure: z.string(), ordre: z.number() })).min(2),
    chauffeurId: z.string().uuid().optional(),
    immatriculation: z.string().max(50).optional(),
    capacite: z.number().min(1).default(50),
    tarif: z.number().min(0).default(0),
});

export const createInscriptionTransportSchema = z.object({
    eleveId: z.string().uuid(),
    ligneId: z.string().uuid(),
    arretMontee: z.string().max(100),
    arretDescente: z.string().max(100),
});

export const enregistrerPresenceSchema = z.object({
    inscriptionId: z.string().uuid(),
    date: z.string(),
    trajet: z.enum(['aller', 'retour']),
    present: z.boolean(),
    heureMontee: z.string().optional(),
});

export type CreateLigneDto = z.infer<typeof createLigneSchema>;
export type CreateInscriptionTransportDto = z.infer<typeof createInscriptionTransportSchema>;
export type EnregistrerPresenceDto = z.infer<typeof enregistrerPresenceSchema>;
