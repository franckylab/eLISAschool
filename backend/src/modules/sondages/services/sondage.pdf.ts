/**
 * ==================================
 * eLISAschool - Service Export PDF pour Sondages
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Génération de rapports PDF pour les analyses de sondages
 */

import { logger } from '@common/utils/logger.util';

interface SondageAnalyseData {
    question: string;
    statut: string;
    dateFermeture?: Date;
    totalVotes: number;
    totalDestinataires: number;
    tauxParticipation: number;
    repartition: Array<{
        option_texte: string;
        nombre_votes: number;
        pourcentage: number;
    }>;
}

/**
 * Service d'export PDF pour les sondages
 * Utilise une approche simple avec génération HTML → PDF
 */
export class SondagePdfService {
    /**
     * Générer un PDF d'analyse de sondage
     * Retourne le contenu HTML prêt pour conversion PDF
     */
    genererPdf(analyses: SondageAnalyseData): string {
        const html = this.buildHtmlTemplate(analyses);
        return html;
    }

    /**
     * Construire le template HTML pour le PDF
     */
    private buildHtmlTemplate(data: SondageAnalyseData): string {
        const stats = data.repartition;
        const maxVotes = Math.max(...stats.map(s => s.nombre_votes));

        // Générer les barres de graphique
        const barresHtml = stats.map((item) => {
            const largeur = maxVotes > 0 ? (item.nombre_votes / maxVotes) * 100 : 0;
            return `
                <div class="barre-container">
                    <div class="barre-label">
                        <span class="option-texte">${this.escapeHtml(item.option_texte)}</span>
                        <span class="votes">${item.nombre_votes} votes (${item.pourcentage.toFixed(1)}%)</span>
                    </div>
                    <div class="barre">
                        <div class="barre-fill" style="width: ${largeur}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 40px;
            color: #333;
        }
        .header {
            border-bottom: 3px solid #4A90E2;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4A90E2;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .meta {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #4A90E2;
        }
        .stat-label {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        .question {
            background: #e8f4f8;
            padding: 20px;
            border-left: 4px solid #4A90E2;
            margin: 20px 0;
            font-size: 16px;
            font-weight: 500;
        }
        .barre-container {
            margin: 15px 0;
        }
        .barre-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 14px;
        }
        .option-texte {
            font-weight: 500;
        }
        .votes {
            color: #666;
        }
        .barre {
            background: #e0e0e0;
            height: 30px;
            border-radius: 4px;
            overflow: hidden;
        }
        .barre-fill {
            background: linear-gradient(90deg, #4A90E2, #5BA3F5);
            height: 100%;
            transition: width 0.3s ease;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #999;
            font-size: 12px;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        .badge-actif {
            background: #d4edda;
            color: #155724;
        }
        .badge-ferme {
            background: #f8d7da;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Rapport d'Analyse - Sondage</h1>
        <div class="meta">Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
        <div class="meta">Statut: <span class="badge badge-${data.statut}">${data.statut.toUpperCase()}</span></div>
    </div>

    <div class="question">
        ${this.escapeHtml(data.question)}
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">${data.totalVotes}</div>
            <div class="stat-label">Total des votes</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.totalDestinataires}</div>
            <div class="stat-label">Destinataires</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.tauxParticipation.toFixed(1)}%</div>
            <div class="stat-label">Taux de participation</div>
        </div>
    </div>

    <h2>Répartition des votes</h2>
    ${barresHtml}

    <div class="footer">
        eLISAschool - Système de gestion scolaire<br>
        Document généré automatiquement
    </div>
</body>
</html>
        `;
    }

    /**
     * Échapper les caractères HTML
     */
    private escapeHtml(text: string): string {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
}

export const sondagePdfService = new SondagePdfService();
