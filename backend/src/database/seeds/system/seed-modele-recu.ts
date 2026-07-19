import { AppDataSource } from '../../data-source';
import { ModeleDocument, TypeDocument } from '@modules/impressions/entities';
import { logger } from '@common/utils/logger.util';

const templateHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reçu de Paiement - {{etablissement.nom}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; font-size: 12px; line-height: 1.6; color: #333; padding: 20px; background: #f5f5f5; }
        .recu-container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #2c5aa0; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2c5aa0; font-size: 24px; margin-bottom: 5px; }
        .header h2 { color: #666; font-size: 18px; font-weight: normal; margin-bottom: 10px; }
        .recu-info { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #f9f9f9; border-radius: 5px; }
        .recu-info strong { color: #2c5aa0; }
        .eleve-section { margin-bottom: 30px; padding: 15px; background: #e8f4f8; border-left: 4px solid #2c5aa0; }
        .eleve-section h3 { color: #2c5aa0; margin-bottom: 10px; font-size: 16px; }
        .eleve-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .paiement-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .paiement-table th { background: #2c5aa0; color: white; padding: 12px; text-align: left; font-weight: bold; }
        .paiement-table td { padding: 12px; border-bottom: 1px solid #ddd; }
        .paiement-table tr:nth-child(even) { background: #f9f9f9; }
        .montant-total { text-align: right; font-size: 18px; font-weight: bold; color: #2c5aa0; margin-top: 20px; padding: 15px; background: #f0f7ff; border-radius: 5px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 11px; }
        .signature { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 200px; text-align: center; padding-top: 60px; border-top: 1px solid #333; }
        @media print { body { background: white; padding: 0; } .recu-container { box-shadow: none; padding: 20px; } }
    </style>
</head>
<body>
    <div class="recu-container">
        <div class="header">
            <h1>{{etablissement.nom}}</h1>
            <h2>Reçu de Paiement Officiel</h2>
            <p>{{etablissement.adresse}} | Tél: {{etablissement.telephone}}</p>
        </div>
        <div class="recu-info">
            <div><strong>Numéro de reçu:</strong><br>{{recu.numeroRecu}}</div>
            <div><strong>Date d'émission:</strong><br>{{recu.dateEmission}}</div>
            <div><strong>Année scolaire:</strong><br>{{anneeScolaire}}</div>
        </div>
        <div class="eleve-section">
            <h3>📚 Informations de l'Élève</h3>
            <div class="eleve-info">
                <div><strong>Nom et Prénom:</strong><br>{{recu.eleveNom}}</div>
                <div><strong>Matricule:</strong><br>{{recu.eleveMatricule}}</div>
                <div><strong>Classe:</strong><br>{{recu.classeNom}}</div>
                <div><strong>Méthode de paiement:</strong><br>{{recu.methodePaiement}}</div>
            </div>
        </div>
        <div class="paiement-section">
            <h3>💰 Détails du Paiement</h3>
            <table class="paiement-table">
                <thead><tr><th>Objet</th><th>Montant</th></tr></thead>
                <tbody>
                    <tr><td>{{recu.objet}}</td><td>{{recu.montant}} FCFA</td></tr>
                    <tr><td><strong>TOTAL PAYÉ</strong></td><td><strong>{{recu.montant}} FCFA</strong></td></tr>
                </tbody>
            </table>
            <div class="montant-total">Montant Total: {{recu.montant}} FCFA</div>
        </div>
        <div class="signature">
            <div class="signature-box">Signature du Caissier</div>
            <div class="signature-box">Signature du Parent</div>
        </div>
        <div class="footer">
            <p>Ce reçu est un document officiel. Veuillez le conserver pour vos archives.</p>
            <p>Document généré automatiquement par eLISAschool le {{dateGeneration}}</p>
            <p>© {{annee}} {{etablissement.nom}} - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>`;

export async function seedModeleRecu(): Promise<void> {
    logger.info('[Seed] Modèle de Reçu de Paiement');

    const modeleRepo = AppDataSource.getRepository(ModeleDocument);

    const modeleExistant = await modeleRepo.findOne({
        where: { nom: 'Reçu de Paiement Standard', type: TypeDocument.RECUPAIEMENT },
    });

    if (modeleExistant) {
        logger.info('Modèle de reçu déjà existant, mise à jour...');

        await modeleRepo.update(modeleExistant.id, {
            template: templateHTML,
            updatedAt: new Date(),
        });

        logger.info('✅ Modèle de reçu mis à jour avec succès');
    } else {
        logger.info('Création du modèle de reçu...');

        const modele = modeleRepo.create({
            nom: 'Reçu de Paiement Standard',
            description: 'Modèle officiel de reçu de paiement pour les frais de scolarité et d\'inscription',
            type: TypeDocument.RECUPAIEMENT,
            template: templateHTML,
            actif: true,
            parDefaut: true,
        });

        await modeleRepo.save(modele);
        logger.info(`✅ Modèle de reçu créé avec succès (ID: ${modele.id})`);
    }

    const totalModeles = await modeleRepo.count();
    logger.info(`📊 Total modèles de documents: ${totalModeles}`);
}
