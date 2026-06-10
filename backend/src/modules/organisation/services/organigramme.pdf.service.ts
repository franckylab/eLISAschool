/**
 * ==================================
 * eLISAschool - Service Export PDF Organigramme
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Génération d'organigrammes visuels en PDF
 * avec graphiques hiérarchiques et styling professionnel
 */

import { OrganisationService } from './organisation.service';
import { logger } from '@common/utils/logger.util';
import { AppError } from '@common/filters/error.filter';

export class OrganigrammePdfService {
    private organisationService: OrganisationService;

    constructor() {
        this.organisationService = new OrganisationService();
    }

    /**
     * Générer un organigramme HTML complet (prêt pour conversion PDF)
     */
    async genererOrganigrammeHTML(organisationId: string): Promise<string> {
        const organigramme = await this.organisationService.getOrganigramme(organisationId);
        
        if (!organigramme) {
            throw new AppError('Organigramme non trouvé', 404, 'ORGANIGRAMME_NOT_FOUND');
        }

        const html = this.construireHTML(organigramme);
        return html;
    }

    /**
     * Construire le HTML de l'organigramme
     */
    private construireHTML(organigramme: any): string {
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organigramme - ${organigramme.nom}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            min-height: 100vh;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .header {
            text-align: center;
            margin-bottom: 50px;
            padding-bottom: 30px;
            border-bottom: 3px solid #667eea;
        }

        .header h1 {
            font-size: 2.5em;
            color: #333;
            margin-bottom: 10px;
        }

        .header .meta {
            color: #666;
            font-size: 0.9em;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }

        .stat-card .value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .stat-card .label {
            font-size: 0.9em;
            opacity: 0.9;
        }

        .org-chart {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .unite {
            background: white;
            border: 2px solid #667eea;
            border-radius: 12px;
            padding: 20px;
            margin: 10px;
            min-width: 250px;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }

        .unite:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }

        .unite-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px;
            margin: -20px -20px 15px -20px;
            border-radius: 10px 10px 0 0;
        }

        .unite-header h3 {
            font-size: 1.2em;
            margin-bottom: 5px;
        }

        .unite-header .code {
            font-size: 0.8em;
            opacity: 0.9;
        }

        .unite-info {
            margin-bottom: 15px;
        }

        .unite-info p {
            color: #555;
            font-size: 0.9em;
            margin-bottom: 5px;
        }

        .postes {
            border-top: 1px solid #eee;
            padding-top: 15px;
        }

        .postes h4 {
            color: #667eea;
            font-size: 0.95em;
            margin-bottom: 10px;
        }

        .poste {
            background: #f8f9fa;
            padding: 8px 12px;
            margin-bottom: 8px;
            border-radius: 6px;
            border-left: 3px solid #667eea;
        }

        .poste .intitule {
            font-weight: 600;
            color: #333;
            font-size: 0.9em;
        }

        .poste .occupant {
            color: #666;
            font-size: 0.85em;
            margin-top: 3px;
        }

        .poste.vacant {
            border-left-color: #ff6b6b;
            background: #fff5f5;
        }

        .poste.vacant .intitule {
            color: #ff6b6b;
        }

        .enfants {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            margin-top: 20px;
            position: relative;
        }

        .enfants::before {
            content: '';
            position: absolute;
            top: -20px;
            left: 50%;
            width: 2px;
            height: 20px;
            background: #667eea;
        }

        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            color: #999;
            font-size: 0.85em;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Organigramme</h1>
            <div class="meta">
                <p><strong>${organigramme.nom || 'Organisation'}</strong></p>
                <p>Généré le ${new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</p>
            </div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="value">${this.compterUnites(organigramme)}</div>
                <div class="label">Unités</div>
            </div>
            <div class="stat-card">
                <div class="value">${this.compterPostes(organigramme)}</div>
                <div class="label">Postes</div>
            </div>
            <div class="stat-card">
                <div class="value">${this.compterPostesOccupes(organigramme)}</div>
                <div class="label">Postes occupés</div>
            </div>
            <div class="stat-card">
                <div class="value">${this.compterPostesVacants(organigramme)}</div>
                <div class="label">Postes vacants</div>
            </div>
        </div>

        <div class="org-chart">
            ${this.renderUnites(organigramme.enfants || [organigramme])}
        </div>

        <div class="footer">
            <p>eLISAschool - Système de Gestion Scolaire</p>
            <p>Document généré automatiquement</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    /**
     * Rendre récursivement les unités
     */
    private renderUnites(unites: any[]): string {
        if (!unites || unites.length === 0) return '';

        return unites.map(unite => `
            <div class="unite">
                <div class="unite-header">
                    <h3>${unite.nom}</h3>
                    <div class="code">${unite.code} - ${unite.type}</div>
                </div>
                
                <div class="unite-info">
                    ${unite.description ? `<p>${unite.description}</p>` : ''}
                    ${unite.responsableId ? `<p><strong>Responsable:</strong> ID ${unite.responsableId.substring(0, 8)}</p>` : ''}
                </div>

                ${unite.postes && unite.postes.length > 0 ? `
                    <div class="postes">
                        <h4>📋 Postes (${unite.postes.length})</h4>
                        ${unite.postes.map((poste: any) => `
                            <div class="poste ${poste.statut === 'vacant' ? 'vacant' : ''}">
                                <div class="intitule">${poste.intitulé}</div>
                                ${poste.occupantNom 
                                    ? `<div class="occupant">👤 ${poste.occupantNom}</div>`
                                    : '<div class="occupant">⚠️ Poste vacant</div>'
                                }
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${unite.enfants && unite.enfants.length > 0 ? `
                    <div class="enfants">
                        ${this.renderUnites(unite.enfants)}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * Compter les unités récursivement
     */
    private compterUnites(organigramme: any): number {
        let count = 1;
        if (organigramme.enfants) {
            organigramme.enfants.forEach((enfant: any) => {
                count += this.compterUnites(enfant);
            });
        }
        return count;
    }

    /**
     * Compter les postes récursivement
     */
    private compterPostes(organigramme: any): number {
        let count = (organigramme.postes || []).length;
        if (organigramme.enfants) {
            organigramme.enfants.forEach((enfant: any) => {
                count += this.compterPostes(enfant);
            });
        }
        return count;
    }

    /**
     * Compter les postes occupés
     */
    private compterPostesOccupes(organigramme: any): number {
        let count = (organigramme.postes || []).filter((p: any) => p.occupantId).length;
        if (organigramme.enfants) {
            organigramme.enfants.forEach((enfant: any) => {
                count += this.compterPostesOccupes(enfant);
            });
        }
        return count;
    }

    /**
     * Compter les postes vacants
     */
    private compterPostesVacants(organigramme: any): number {
        let count = (organigramme.postes || []).filter((p: any) => !p.occupantId).length;
        if (organigramme.enfants) {
            organigramme.enfants.forEach((enfant: any) => {
                count += this.compterPostesVacants(enfant);
            });
        }
        return count;
    }
}

// Singleton export
export const organigrammePdfService = new OrganigrammePdfService();
