import { AppDataSource } from '../../data-source';
import { ParametreSysteme, TypeValeurParametre, CategorieParametre } from '@modules/configuration/entities/parametre-systeme.entity';
import { logger } from '@common/utils/logger.util';

interface ParametreSeed {
    cle: string;
    valeur: string;
    typeValeur: TypeValeurParametre;
    description: string;
    visible: boolean;
}

function mapType(t: string): TypeValeurParametre {
    switch (t) {
        case 'NUMBER': return TypeValeurParametre.NUMBER;
        case 'BOOLEAN': return TypeValeurParametre.BOOLEAN;
        case 'JSON': return TypeValeurParametre.JSON;
        default: return TypeValeurParametre.STRING;
    }
}

const PARAMETRES_FINANCES: ParametreSeed[] = [
    { cle: 'finances.scolarite.frais_inscription_defaut', valeur: '50000', typeValeur: mapType('NUMBER'), description: 'Frais d\'inscription par défaut (FCFA)', visible: true },
    { cle: 'finances.scolarite.nombre_tranches_defaut', valeur: '3', typeValeur: mapType('NUMBER'), description: 'Nombre de tranches par défaut', visible: true },
    { cle: 'finances.scolarite.frequence_echeance_defaut', valeur: 'TRIMESTRIEL', typeValeur: mapType('ENUM'), description: 'Fréquence échéances (MENSUEL, TRIMESTRIEL, SEMESTRIEL, ANNUEL)', visible: true },
    { cle: 'finances.scolarite.jours_grace_defaut', valeur: '8', typeValeur: mapType('NUMBER'), description: 'Jours de grâce avant pénalité', visible: true },
    { cle: 'finances.scolarite.penalite_retard_pct', valeur: '5', typeValeur: mapType('NUMBER'), description: 'Pénalité retard (% par mois)', visible: true },
    { cle: 'finances.scolarite.penalite_plafond_pct', valeur: '25', typeValeur: mapType('NUMBER'), description: 'Plafond pénalité (% du montant)', visible: true },
    { cle: 'finances.scolarite.relance_auto_active', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Relances automatiques activées', visible: true },
    { cle: 'finances.scolarite.relance_frequence_jours', valeur: '7', typeValeur: mapType('NUMBER'), description: 'Fréquence relances (jours)', visible: true },
    { cle: 'finances.scolarite.relance_seuil_min', valeur: '10000', typeValeur: mapType('NUMBER'), description: 'Seuil minimum relance (FCFA)', visible: true },
    { cle: 'finances.scolarite.mode_paiement_mobile_actif', valeur: 'false', typeValeur: mapType('BOOLEAN'), description: 'Paiement Mobile Money activé', visible: true },
    { cle: 'finances.depenses.double_validation_seuil', valeur: '500000', typeValeur: mapType('NUMBER'), description: 'Seuil double validation (FCFA)', visible: true },
    { cle: 'finances.depenses.approbation_auto_active', valeur: 'false', typeValeur: mapType('BOOLEAN'), description: 'Approbation automatique si < seuil', visible: true },
    { cle: 'finances.depenses.tva_defaut_pct', valeur: '19.25', typeValeur: mapType('NUMBER'), description: 'TVA par défaut (%)', visible: true },
    { cle: 'finances.depenses.categorie_requise', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Catégorie obligatoire', visible: true },
    { cle: 'finances.depenses.facture_requise', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Facture obligatoire', visible: true },
    { cle: 'finances.depenses.budget_verification_active', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Vérification budget avant dépense', visible: true },
    { cle: 'finances.depenses.budget_bloquant', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Bloquer si budget dépassé', visible: true },
    { cle: 'finances.depenses.delai_paiement_jours', valeur: '30', typeValeur: mapType('NUMBER'), description: 'Délai paiement fournisseur (jours)', visible: true },
    { cle: 'finances.depenses.escompte_pct', valeur: '2', typeValeur: mapType('NUMBER'), description: 'Escompte paiement anticipé (%)', visible: true },
    { cle: 'finances.depenses.archivage_duree_mois', valeur: '60', typeValeur: mapType('NUMBER'), description: 'Durée archivage (mois)', visible: true },
    { cle: 'finances.depenses.export_format_defaut', valeur: 'PDF', typeValeur: mapType('ENUM'), description: 'Format export par défaut (PDF, EXCEL, CSV)', visible: true },
    { cle: 'finances.depenses.notification_demande_active', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Notifications demandes actives', visible: true },
    { cle: 'finances.comptabilite.plan_comptable', valeur: 'OHADA', typeValeur: mapType('ENUM'), description: 'Système comptable (OHADA, SYSCOHADA, SIMPLIFIE)', visible: true },
    { cle: 'finances.comptabilite.ecriture_auto_active', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Écritures automatiques activées', visible: true },
    { cle: 'finances.comptabilite.numero_sequence_prefix', valeur: 'EC', typeValeur: mapType('STRING'), description: 'Préfixe numéro écriture', visible: true },
    { cle: 'finances.comptabilite.exercice_comptable_debut', valeur: '09-01', typeValeur: mapType('STRING'), description: 'Début exercice comptable (MM-DD)', visible: true },
    { cle: 'finances.comptabilite.exercice_comptable_fin', valeur: '08-31', typeValeur: mapType('STRING'), description: 'Fin exercice comptable (MM-DD)', visible: true },
    { cle: 'finances.comptabilite.cloture_auto_active', valeur: 'false', typeValeur: mapType('BOOLEAN'), description: 'Clôture automatique exercice', visible: true },
    { cle: 'finances.comptabilite.validation_obligatoire', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Validation écritures obligatoire', visible: true },
    { cle: 'finances.comptabilite.archivage_legal_duree', valeur: '120', typeValeur: mapType('NUMBER'), description: 'Durée archivage légal (mois)', visible: true },
    { cle: 'finances.tresorerie.seuil_alerte_caisse', valeur: '100000', typeValeur: mapType('NUMBER'), description: 'Seuil alerte caisse (FCFA)', visible: true },
    { cle: 'finances.tresorerie.seuil_critique_caisse', valeur: '50000', typeValeur: mapType('NUMBER'), description: 'Seuil critique caisse (FCFA)', visible: true },
    { cle: 'finances.tresorerie.plafond_caisse_especes', valeur: '5000000', typeValeur: mapType('NUMBER'), description: 'Plafond espèces en caisse (FCFA)', visible: true },
    { cle: 'finances.tresorerie.verification_caisse_quotidienne', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Vérification quotidienne obligatoire', visible: true },
    { cle: 'finances.tresorerie.double_signature_seuil', valeur: '1000000', typeValeur: mapType('NUMBER'), description: 'Seuil double signature (FCFA)', visible: true },
    { cle: 'finances.tresorerie.cloture_caisse_heure', valeur: '17:00', typeValeur: mapType('STRING'), description: 'Heure clôture caisse (HH:MM)', visible: true },
    { cle: 'finances.tresorerie.ecart_tolerance', valeur: '5000', typeValeur: mapType('NUMBER'), description: 'Tolérance écart caisse (FCFA)', visible: true },
    { cle: 'finances.tresorerie.virement_approval_requise', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Approval virements requise', visible: true },
    { cle: 'finances.tresorerie.releve_bancaire_import_actif', valeur: 'false', typeValeur: mapType('BOOLEAN'), description: 'Import relevés bancaires', visible: true },
    { cle: 'finances.tresorerie.mode_gestion_caisse', valeur: 'MULTI_CAISSE', typeValeur: mapType('ENUM'), description: 'Mode gestion caisse (UNIQUE_CAISSE, MULTI_CAISSE)', visible: true },
    { cle: 'finances.budget.exercice_annuel', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Budget annuel (vs pluriannuel)', visible: true },
    { cle: 'finances.budget.validation_workflow_actif', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Workflow validation actif', visible: true },
    { cle: 'finances.budget.seuil_alerte_pct', valeur: '80', typeValeur: mapType('NUMBER'), description: 'Seuil alerte consommation (%)', visible: true },
    { cle: 'finances.budget.seuil_critique_pct', valeur: '95', typeValeur: mapType('NUMBER'), description: 'Seuil critique consommation (%)', visible: true },
    { cle: 'finances.budget.blocage_depassement', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Bloquer si dépassement', visible: true },
    { cle: 'finances.budget.report_excedent_actif', valeur: 'false', typeValeur: mapType('BOOLEAN'), description: 'Report excédent sur N+1', visible: true },
    { cle: 'finances.budget.virement_ligne_actif', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Virement entre lignes autorisé', visible: true },
    { cle: 'finances.budget.virement_ligne_seuil_pct', valeur: '20', typeValeur: mapType('NUMBER'), description: 'Seuil virement ligne (% du budget)', visible: true },
    { cle: 'finances.budget.budget_additionnel_actif', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Budgets additionnels autorisés', visible: true },
    { cle: 'finances.budget.notification_alerte_active', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Notifications alertes budget', visible: true },
    { cle: 'finances.dashboard.kpi_taux_recouvrement_cible', valeur: '85', typeValeur: mapType('NUMBER'), description: 'Objectif taux recouvrement (%)', visible: true },
    { cle: 'finances.dashboard.kpi_depenses_budget_max_pct', valeur: '90', typeValeur: mapType('NUMBER'), description: 'Ratio dépenses/budget max (%)', visible: true },
    { cle: 'finances.dashboard.cache_ttl_secondes', valeur: '300', typeValeur: mapType('NUMBER'), description: 'Cache dashboard TTL (secondes)', visible: true },
    { cle: 'finances.dashboard.graphique_periode_defaut', valeur: '30', typeValeur: mapType('NUMBER'), description: 'Période graphique par défaut (jours)', visible: true },
    { cle: 'finances.rapports.generation_auto_active', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Rapports automatiques activés', visible: true },
    { cle: 'finances.rapports.frequence_defaut', valeur: 'MENSUEL', typeValeur: mapType('ENUM'), description: 'Fréquence rapports (MENSUEL, TRIMESTRIEL, ANNUEL)', visible: true },
    { cle: 'finances.rapports.format_export_defaut', valeur: 'PDF', typeValeur: mapType('ENUM'), description: 'Format export par défaut', visible: true },
    { cle: 'finances.rapports.destinataires_defaut', valeur: '["CHEF_ETABLISSEMENT", "ADMIN"]', typeValeur: mapType('JSON'), description: 'Destinataires automatiques rapports', visible: true },
    { cle: 'finances.validation_paiement.require_validation', valeur: 'false', typeValeur: mapType('BOOLEAN'), description: 'Validation paiement requise', visible: true },
    { cle: 'finances.validation_paiement.levels', valeur: '[1]', typeValeur: mapType('JSON'), description: 'Niveaux validation paiement', visible: true },
    { cle: 'finances.validation_depense.require_validation', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Validation dépense requise', visible: true },
    { cle: 'finances.validation_depense.levels', valeur: '[1, 2]', typeValeur: mapType('JSON'), description: 'Niveaux validation dépense', visible: true },
    { cle: 'finances.validation_budget.require_validation', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Validation budget requise', visible: true },
    { cle: 'finances.validation_budget.levels', valeur: '[1, 2, 3]', typeValeur: mapType('JSON'), description: 'Niveaux validation budget', visible: true },
    { cle: 'finances.devise_defaut', valeur: 'FCFA', typeValeur: mapType('STRING'), description: 'Devise par défaut', visible: true },
    { cle: 'finances.monnaie_symbole', valeur: 'FCFA', typeValeur: mapType('STRING'), description: 'Symbole monétaire', visible: true },
    { cle: 'finances.arrondi_montant', valeur: 'SUPERIEUR', typeValeur: mapType('ENUM'), description: 'Méthode arrondi (SUPERIEUR, INFERIEUR, STANDARD)', visible: true },
    { cle: 'finances.decimales_montant', valeur: '0', typeValeur: mapType('NUMBER'), description: 'Nombre décimales montants', visible: true },
    { cle: 'finances.seuil_importance_montant', valeur: '10000000', typeValeur: mapType('NUMBER'), description: 'Seuil montant important (FCFA)', visible: true },
    { cle: 'finances.audit_operations_actif', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Audit toutes opérations', visible: true },
    { cle: 'finances.audit_duree_retention_mois', valeur: '60', typeValeur: mapType('NUMBER'), description: 'Rétention logs audit (mois)', visible: true },
    { cle: 'finances.chiffrement_donnees_actif', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Chiffrement données sensibles', visible: true },
    { cle: 'finances.backup_auto_actif', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Backup automatique', visible: true },
    { cle: 'finances.backup_frequence', valeur: 'QUOTIDIEN', typeValeur: mapType('ENUM'), description: 'Fréquence backup (QUOTIDIEN, HEBDOMADAIRE)', visible: true },
];

export async function seedParametresFinances(): Promise<void> {
    const paramRepo = AppDataSource.getRepository(ParametreSysteme);

    logger.info('[Seed] Insertion des paramètres finances...');

    let insertedCount = 0;
    let updatedCount = 0;

    for (const param of PARAMETRES_FINANCES) {
        const existing = await paramRepo.findOne({
            where: { cle: param.cle },
        });

        if (existing) {
            await paramRepo.update(existing.id, {
                valeur: param.valeur,
                typeValeur: param.typeValeur,
                description: param.description,
                visible: param.visible,
            });
            updatedCount++;
        } else {
            await paramRepo.save(paramRepo.create({
                cle: param.cle,
                valeur: param.valeur,
                typeValeur: param.typeValeur,
                description: param.description,
                visible: param.visible,
                module: 'finances',
                categorie: CategorieParametre.MODULE,
                modifiableRuntime: true,
            }));
            insertedCount++;
        }
    }

    logger.info(`[Seed] ✅ Paramètres finances: ${insertedCount} nouveaux, ${updatedCount} mis à jour`);
}
