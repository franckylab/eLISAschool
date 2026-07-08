import { z } from 'zod';

export const genererOrganisationSchema = z.object({
    templateId: z.string().uuid().optional(),
    structure: z.record(z.any()).optional(),
    organisationId: z.string().uuid(),
    options: z.object({
        prefixeCode: z.string().max(20).optional(),
        creerHierarchie: z.boolean().default(true),
        modeConflit: z.enum(['ERROR', 'SKIP', 'OVERWRITE']).default('ERROR'),
    }).default({}),
}).refine(
    (data) => data.templateId || data.structure,
    { message: 'templateId ou structure requis' }
);

export type GenererOrganisationDto = z.infer<typeof genererOrganisationSchema>;

export interface ResultatGeneration {
    unitesCrees: number;
    postesCrees: number;
    hierarchiesCrees: number;
    unites: Array<{ ref: string; id: string; nom: string; code: string }>;
    postes: Array<{ ref: string; id: string; intitule: string; code: string }>;
    hierarchies: Array<{ superieurRef: string; subordonneRef: string; id: string }>;
    arborescence: any;
}

export const optionsGenerationSchema = z.object({
    prefixeCode: z.string().max(20).optional(),
    creerHierarchie: z.boolean().default(true),
    modeConflit: z.enum(['ERROR', 'SKIP', 'OVERWRITE']).default('ERROR'),
});
