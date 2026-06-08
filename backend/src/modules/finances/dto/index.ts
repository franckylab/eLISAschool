/**
 * ==================================
 * eLISAschool - Export des DTOs Finances
 * ==================================
 */

// Scolarité et Paiements
export {
    createFraisScolariteSchema,
    updateFraisScolariteSchema,
    generateEcheancierSchema,
    createPaiementSchema,
    updatePaiementSchema,
    createRemiseSchema,
    queryPaiementsSchema,
    queryEcheanciersSchema,
} from './scolarite.dto';

export type {
    CreateFraisScolariteDto,
    UpdateFraisScolariteDto,
    GenerateEcheancierDto,
    CreatePaiementDto,
    UpdatePaiementDto,
    CreateRemiseDto,
    QueryPaiementsDto,
    QueryEcheanciersDto,
} from './scolarite.dto';

// Dépenses
export {
    createCategorieDepenseSchema,
    updateCategorieDepenseSchema,
    createDepenseSchema,
    updateDepenseSchema,
    payerDepenseSchema,
    createDemandeDepenseSchema,
    validerDemandeSchema,
    createBonCommandeSchema,
    createFactureFournisseurSchema,
    queryDepensesSchema,
    queryDemandesSchema,
} from './depenses.dto';

export type {
    CreateCategorieDepenseDto,
    UpdateCategorieDepenseDto,
    CreateDepenseDto,
    UpdateDepenseDto,
    PayerDepenseDto,
    CreateDemandeDepenseDto,
    ValiderDemandeDto,
    CreateBonCommandeDto,
    CreateFactureFournisseurDto,
    QueryDepensesDto,
    QueryDemandesDto,
} from './depenses.dto';
