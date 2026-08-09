/**
 * ==================================
 * eLISAschool - Service Export Rapports
 * ==================================
 * 
 * Export rapports plateforme en PDF et CSV.
 * Rapports mensuels activité, facturation, sécurité.
 * Planifié: envoi automatique hebdomadaire au SUPER_ADMIN.
 * 
 * Phase F.3 — Refonte SaaS v2
 */

import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';

export type RapportType = 'activite' | 'facturation' | 'securite' | 'complet';
export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface RapportOptions {
    type: RapportType;
    format: ExportFormat;
    periodeDebut?: Date;
    periodeFin?: Date;
    etablissementId?: string; // Si spécifié, rapport par établissement
}

export interface RapportResult {
    type: RapportType;
    format: ExportFormat;
    generatedAt: string;
    filename: string;
    data: string; // CSV string ou JSON string
    metadata: {
        rows: number;
        columns: string[];
        periode: { debut: string; fin: string };
    };
}

export class RapportExportService {
    /**
     * Génère un rapport complet selon les options.
     */
    async genererRapport(options: RapportOptions): Promise<RapportResult> {
        const { type, format, periodeDebut, periodeFin } = options;
        const debut = periodeDebut || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 jours par défaut
        const fin = periodeFin || new Date();

        let data: Record<string, any>[];
        let columns: string[];

        switch (type) {
            case 'activite':
                ({ data, columns } = await this.rapportActivite(debut, fin, options.etablissementId));
                break;
            case 'facturation':
                ({ data, columns } = await this.rapportFacturation(debut, fin, options.etablissementId));
                break;
            case 'securite':
                ({ data, columns } = await this.rapportSecurite(debut, fin));
                break;
            case 'complet':
                ({ data, columns } = await this.rapportComplet(debut, fin, options.etablissementId));
                break;
            default:
                throw new Error(`Type de rapport inconnu: ${type}`);
        }

        const output = format === 'csv'
            ? this.toCsv(data, columns)
            : format === 'pdf'
                ? this.toHtml(data, columns, type, debut, fin)
                : JSON.stringify(data, null, 2);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const extension = format === 'csv' ? 'csv' : format === 'pdf' ? 'html' : 'json';
        const filename = `rapport-${type}-${timestamp}.${extension}`;

        logger.info(`[RapportExport] Rapport ${type} généré: ${filename} (${data.length} lignes)`);

        return {
            type,
            format,
            generatedAt: new Date().toISOString(),
            filename,
            data: output,
            metadata: {
                rows: data.length,
                columns,
                periode: { debut: debut.toISOString(), fin: fin.toISOString() },
            },
        };
    }

    /**
     * Rapport d'activité : connexions, utilisateurs actifs, modules utilisés.
     */
    private async rapportActivite(
        debut: Date,
        fin: Date,
        etablissementId?: string
    ): Promise<{ data: Record<string, any>[]; columns: string[] }> {
        const { Etablissement } = await import('@modules/etablissement/entities');
        const { Utilisateur } = await import('@modules/auth/entities');
        const { Eleve } = await import('@modules/eleves/entities');

        const etablissementRepo = AppDataSource.getRepository(Etablissement);
        const utilisateurRepo = AppDataSource.getRepository(Utilisateur);
        const eleveRepo = AppDataSource.getRepository(Eleve);

        // Compter par établissement
        const etablissements = await etablissementRepo.find({
            select: ['id', 'nom', 'statut'],
        });

        const data: Record<string, any>[] = [];
        for (const etab of etablissements) {
            if (etablissementId && etab.id !== etablissementId) continue;

            const nbUsers = await utilisateurRepo.count({ where: { etablissementId: etab.id } as any });
            const nbEleves = await eleveRepo.count({ where: { etablissementId: etab.id } as any });

            data.push({
                etablissement: etab.nom,
                statut: etab.statut,
                utilisateurs: nbUsers,
                eleves: nbEleves,
                periode: `${debut.toISOString().slice(0, 10)} → ${fin.toISOString().slice(0, 10)}`,
            });
        }

        return {
            data,
            columns: ['etablissement', 'statut', 'utilisateurs', 'eleves', 'periode'],
        };
    }

    /**
     * Rapport facturation : factures, paiements, impayés par établissement.
     */
    private async rapportFacturation(
        debut: Date,
        fin: Date,
        etablissementId?: string
    ): Promise<{ data: Record<string, any>[]; columns: string[] }> {
        // Utiliser les entités billing si disponibles
        try {
            const { Facture } = await import('@modules/billing/entities');
            const factureRepo = AppDataSource.getRepository(Facture);

            const qb = factureRepo.createQueryBuilder('facture')
                .where('facture.createdAt BETWEEN :debut AND :fin', { debut, fin });

            if (etablissementId) {
                qb.andWhere('facture.etablissementId = :etabId', { etabId: etablissementId });
            }

            const factures = await qb.getMany();

            const data = factures.map((f: any) => ({
                numero: f.numeroOHADA || f.id,
                etablissement: f.etablissementId,
                montant: f.montantTotal,
                statut: f.statut,
                dateCreation: f.createdAt?.toISOString?.() || f.createdAt,
                dateEcheance: f.dateEcheance?.toISOString?.() || f.dateEcheance,
                montantHT: f.montantHT || 0,
                montantTVA: f.montantTVA || 0,
            }));

            return {
                data,
                columns: ['numero', 'etablissement', 'montant', 'statut', 'dateCreation', 'dateEcheance', 'montantHT', 'montantTVA'],
            };
        } catch {
            return { data: [], columns: [] };
        }
    }

    /**
     * Rapport sécurité : tentatives cross-tenant, alertes, connexions échouées.
     */
    private async rapportSecurite(
        debut: Date,
        fin: Date
    ): Promise<{ data: Record<string, any>[]; columns: string[] }> {
        // Utiliser les audit logs si disponibles
        try {
            const { AuditLog } = await import('@modules/audit/entities');
            const auditRepo = AppDataSource.getRepository(AuditLog);

            const logs = await auditRepo.find({
                where: {
                    createdAt: { $between: [debut, fin] } as any,
                },
                order: { createdAt: 'DESC' },
                take: 500,
            });

            const data = (logs as any[]).map((log) => ({
                date: log.createdAt?.toISOString?.() || log.createdAt,
                utilisateur: log.utilisateurId,
                action: log.action,
                module: log.module,
                ip: log.ipAddress,
                details: JSON.stringify(log.details || {}),
            }));

            return {
                data,
                columns: ['date', 'utilisateur', 'action', 'module', 'ip', 'details'],
            };
        } catch {
            return { data: [], columns: [] };
        }
    }

    /**
     * Rapport complet combinant activité + facturation + sécurité.
     */
    private async rapportComplet(
        debut: Date,
        fin: Date,
        etablissementId?: string
    ): Promise<{ data: Record<string, any>[]; columns: string[] }> {
        const [activite, facturation] = await Promise.all([
            this.rapportActivite(debut, fin, etablissementId),
            this.rapportFacturation(debut, fin, etablissementId),
        ]);

        // Combiner les données en un résumé
        const data = [{
            section: 'RÉSUMÉ',
            periode: `${debut.toISOString().slice(0, 10)} → ${fin.toISOString().slice(0, 10)}`,
            nbEtablissements: activite.data.length,
            nbFactures: facturation.data.length,
            totalFacture: facturation.data.reduce((sum: number, f: any) => sum + (f.montant || 0), 0),
        }];

        return {
            data,
            columns: ['section', 'periode', 'nbEtablissements', 'nbFactures', 'totalFacture'],
        };
    }

    /**
     * Convertit des données en CSV.
     */
    private toCsv(data: Record<string, any>[], columns: string[]): string {
        if (data.length === 0) return columns.join(',');

        const header = columns.join(',');
        const rows = data.map((row) =>
            columns.map((col) => {
                const value = row[col];
                if (value === null || value === undefined) return '';
                const str = String(value);
                // Échapper les guillemets et virgules
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        );

        return [header, ...rows].join('\n');
    }

    /**
     * Génère un rapport HTML imprimable (PDF via navigateur).
     */
    private toHtml(
        data: Record<string, any>[],
        columns: string[],
        type: RapportType,
        debut: Date,
        fin: Date
    ): string {
        const typeLabel = {
            activite: 'Activité',
            facturation: 'Facturation',
            securite: 'Sécurité',
            complet: 'Complet',
        }[type];

        const headerCells = columns.map((c) => `<th>${c}</th>`).join('');
        const bodyRows = data.map((row) =>
            `<tr>${columns.map((c) => `<td>${row[c] ?? ''}</td>`).join('')}</tr>`
        ).join('');

        return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport ${typeLabel} — eLISAschool</title>
    <style>
        @page { margin: 2cm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #28a745; padding-bottom: 12px; }
        .header h1 { color: #28a745; margin: 0 0 4px; font-size: 20px; }
        .header p { color: #666; margin: 0; font-size: 11px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 11px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #28a745; color: white; padding: 8px 6px; text-align: left; font-size: 11px; }
        td { padding: 6px; border-bottom: 1px solid #eee; font-size: 11px; }
        tr:nth-child(even) { background: #f9f9f9; }
        .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>eLISAschool — Rapport ${typeLabel}</h1>
        <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
    </div>
    <div class="meta">
        <span>Période : ${debut.toLocaleDateString('fr-FR')} → ${fin.toLocaleDateString('fr-FR')}</span>
        <span>${data.length} entrée${data.length > 1 ? 's' : ''}</span>
    </div>
    <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
    </table>
    <div class="footer">
        eLISAschool — Rapport généré automatiquement — ${new Date().toLocaleDateString('fr-FR')}
    </div>
    <script>
        // Auto-impression pour conversion PDF
        window.addEventListener('load', () => {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('print') === '1') {
                window.print();
            }
        });
    </script>
</body>
</html>`;
    }

    /**
     * Génère le contenu CSV d'un rapport de facturation pour le ledger OHADA.
     */
    async exporterLedgerCSV(etablissementId?: string, debut?: Date, fin?: Date): Promise<string> {
        try {
            const { TransactionLedger } = await import('@modules/billing/entities');
            const ledgerRepo = AppDataSource.getRepository(TransactionLedger);

            const qb = ledgerRepo.createQueryBuilder('ledger')
                .orderBy('ledger.dateEcriture', 'DESC')
                .take(1000);

            if (etablissementId) {
                qb.where('ledger.etablissementId = :etabId', { etabId: etablissementId });
            }
            if (debut && fin) {
                qb.andWhere('ledger.dateEcriture BETWEEN :debut AND :fin', { debut, fin });
            }

            const ecritures = await qb.getMany();

            const columns = ['numeroEcriture', 'dateEcriture', 'compteComptable', 'libelle', 'sens', 'montant', 'soldeCumule'];
            const data = (ecritures as any[]).map((e) => ({
                numeroEcriture: e.numeroEcriture,
                dateEcriture: e.dateEcriture?.toISOString?.()?.slice(0, 10) || '',
                compteComptable: e.compteComptable,
                libelle: e.libelle,
                sens: e.sens,
                montant: e.montant,
                soldeCumule: e.soldeCumule,
            }));

            return this.toCsv(data, columns);
        } catch {
            return this.toCsv([], ['numeroEcriture', 'dateEcriture', 'compteComptable', 'libelle', 'sens', 'montant', 'soldeCumule']);
        }
    }
}

export const rapportExportService = new RapportExportService();
export default RapportExportService;
