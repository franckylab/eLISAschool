/**
 * ==================================
 * eLISAschool - Service Export PDF Emploi-du-Temps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 * 
 * Génère des exports PDF/HTML des emplois du temps
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { EmploiDuTemps } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

interface ExportOptions {
    format: 'html' | 'pdf';
    includeHeader?: boolean;
    includeLegend?: boolean;
    colorBy?: 'matiere' | 'enseignant' | 'type';
}

export class EmploiDuTempsPdfService {
    private repo: Repository<EmploiDuTemps>;

    constructor() {
        this.repo = AppDataSource.getRepository(EmploiDuTemps);
    }

    /**
     * Génère un export HTML de l'emploi du temps
     */
    async generateHTML(
        classeId: string,
        anneeScolaireId: string,
        options: ExportOptions = { format: 'html' }
    ): Promise<string> {
        // Charger les créneaux
        const creneaux = await this.repo.find({
            where: { classeId, anneeScolaireId, actif: true },
            relations: ['matiere', 'enseignant', 'classe'],
            order: {
                jour: 'ASC',
                heureDebut: 'ASC',
            },
        });

        if (creneaux.length === 0) {
            throw new AppError('Aucun créneau trouvé pour cet emploi du temps', 404, 'NOT_FOUND');
        }

        // Organiser les données par jour
        const plan = this.organiserParJour(creneaux);

        // Générer le HTML
        return this.creerHTML(plan, creneaux[0].classe, options);
    }

    /**
     * Organise les créneaux par jour et heure
     */
    private organiserParJour(creneaux: EmploiDuTemps[]): Map<string, EmploiDuTemps[]> {
        const plan = new Map<string, EmploiDuTemps[]>();
        
        for (const creneau of creneaux) {
            if (!plan.has(creneau.jour)) {
                plan.set(creneau.jour, []);
            }
            plan.get(creneau.jour)!.push(creneau);
        }

        // Trier chaque jour par heure de début
        for (const [jour, creneauxJour] of plan) {
            creneauxJour.sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
        }

        return plan;
    }

    /**
     * Crée le HTML complet de l'emploi du temps
     */
    private creerHTML(
        plan: Map<string, EmploiDuTemps[]>,
        classe: any,
        options: ExportOptions
    ): string {
        const jours = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
        const heures = this.extraireHeures(plan);

        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Emploi du temps - ${classe?.nom || 'Classe'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }

        .header h1 {
            color: #1e293b;
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header .subtitle {
            color: #64748b;
            font-size: 16px;
        }

        .table-container {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th {
            background: #2563eb;
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: 600;
            border: 1px solid #1e40af;
        }

        td {
            padding: 8px;
            border: 1px solid #e2e8f0;
            text-align: center;
            min-width: 120px;
            height: 60px;
            vertical-align: middle;
        }

        .heure-cell {
            background: #f1f5f9;
            font-weight: 600;
            color: #475569;
            min-width: 80px;
        }

        .creneau {
            padding: 8px;
            border-radius: 6px;
            font-size: 12px;
            line-height: 1.4;
            transition: transform 0.2s;
        }

        .creneau:hover {
            transform: scale(1.05);
        }

        .creneau .matiere {
            font-weight: 700;
            font-size: 13px;
            margin-bottom: 4px;
        }

        .creneau .enseignant {
            font-size: 11px;
            opacity: 0.9;
        }

        .creneau .salle {
            font-size: 10px;
            opacity: 0.8;
            margin-top: 2px;
        }

        /* Couleurs par matière */
        .color-math { background: #dbeafe; color: #1e40af; border-left: 4px solid #3b82f6; }
        .color-francais { background: #fef3c7; color: #92400e; border-left: 4px solid #f59e0b; }
        .color-svt { background: #d1fae5; color: #065f46; border-left: 4px solid #10b981; }
        .color-physique { background: #fce7f3; color: #9f1239; border-left: 4px solid #ec4899; }
        .color-histoire { background: #e0e7ff; color: #3730a3; border-left: 4px solid #6366f1; }
        .color-anglais { background: #ccfbf1; color: #115e59; border-left: 4px solid #14b8a6; }
        .color-default { background: #f3f4f6; color: #374151; border-left: 4px solid #6b7280; }

        .legend {
            margin-top: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 6px;
        }

        .legend h3 {
            margin-bottom: 15px;
            color: #1e293b;
        }

        .legend-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            border-left: 4px solid;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }

        @media print {
            body {
                padding: 0;
                background: white;
            }
            .container {
                box-shadow: none;
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${options.includeHeader !== false ? `
        <div class="header">
            <h1>📅 Emploi du Temps</h1>
            <div class="subtitle">
                Classe : <strong>${classe?.nom || 'Non définie'}</strong> | 
                Année scolaire : <strong>${anneeScolaireId.substring(0, 8)}</strong>
            </div>
        </div>
        ` : ''}

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Heure</th>
                        ${jours.filter(j => plan.has(j)).map(jour => `<th>${this.formaterJour(jour)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${heures.map(heure => `
                        <tr>
                            <td class="heure-cell">${heure}</td>
                            ${jours.filter(j => plan.has(j)).map(jour => {
                                const creneau = this.trouverCreneau(plan.get(jour) || [], heure);
                                return creneau 
                                    ? `<td>${this.creerCelluleCreneau(creneau, options)}</td>`
                                    : '<td></td>';
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        ${options.includeLegend !== false ? `
        <div class="legend">
            <h3>📋 Légende</h3>
            <div class="legend-grid">
                ${this.creerLegend(plan)}
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>eLISAschool - Système de Gestion Scolaire</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    /**
     * Extrait toutes les heures uniques des créneaux
     */
    private extraireHeures(plan: Map<string, EmploiDuTemps[]>): string[] {
        const heures = new Set<string>();
        
        for (const creneaux of plan.values()) {
            for (const creneau of creneaux) {
                heures.add(creneau.heureDebut);
            }
        }

        return Array.from(heures).sort();
    }

    /**
     * Trouve un créneau à une heure donnée
     */
    private trouverCreneau(
        creneaux: EmploiDuTemps[],
        heure: string
    ): EmploiDuTemps | null {
        return creneaux.find(c => c.heureDebut === heure) || null;
    }

    /**
     * Crée le HTML d'une cellule de créneau
     */
    private creerCelluleCreneau(creneau: EmploiDuTemps, options: ExportOptions): string {
        const couleurClass = this.obtenirCouleurClass(creneau, options);
        const matiereNom = creneau.matiere?.nom || 'Matière';
        const enseignantNom = creneau.enseignant 
            ? `${creneau.enseignant.nom} ${creneau.enseignant.prenom}`
            : 'Enseignant non assigné';

        return `
            <div class="creneau ${couleurClass}">
                <div class="matiere">${matiereNom}</div>
                <div class="enseignant">👤 ${enseignantNom}</div>
                ${creneau.salleId ? `<div class="salle">🚪 Salle ${creneau.salleId.substring(0, 8)}</div>` : ''}
            </div>
        `;
    }

    /**
     * Obtient la classe CSS pour la couleur
     */
    private obtenirCouleurClass(creneau: EmploiDuTemps, options: ExportOptions): string {
        if (options.colorBy === 'matiere' && creneau.matiere) {
            const nom = creneau.matiere.nom.toLowerCase();
            if (nom.includes('math')) return 'color-math';
            if (nom.includes('français') || nom.includes('francais')) return 'color-francais';
            if (nom.includes('svt') || nom.includes('biologie')) return 'color-svt';
            if (nom.includes('physique') || nom.includes('chimie')) return 'color-physique';
            if (nom.includes('histoire') || nom.includes('géo')) return 'color-histoire';
            if (nom.includes('anglais')) return 'color-anglais';
        }
        
        return 'color-default';
    }

    /**
     * Crée la légende HTML
     */
    private creerLegend(plan: Map<string, EmploiDuTemps[]>): string {
        const matieres = new Map<string, string>();
        
        for (const creneaux of plan.values()) {
            for (const creneau of creneaux) {
                if (creneau.matiere && !matieres.has(creneau.matiere.id)) {
                    matieres.set(creneau.matiere.id, creneau.matiere.nom);
                }
            }
        }

        return Array.from(matieres.entries()).map(([id, nom]) => {
            const couleurClass = this.obtenirCouleurClass({ matiere: { id, nom } } as EmploiDuTemps, { format: 'html', colorBy: 'matiere' });
            return `
                <div class="legend-item">
                    <div class="legend-color ${couleurClass}"></div>
                    <span>${nom}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Formate le nom du jour
     */
    private formaterJour(jour: string): string {
        const joursMap: Record<string, string> = {
            'LUNDI': 'Lundi',
            'MARDI': 'Mardi',
            'MERCREDI': 'Mercredi',
            'JEUDI': 'Jeudi',
            'VENDREDI': 'Vendredi',
            'SAMEDI': 'Samedi',
        };
        return joursMap[jour] || jour;
    }

    /**
     * Génère un export PDF (via HTML)
     */
    async generatePDF(
        classeId: string,
        anneeScolaireId: string,
        options: ExportOptions = { format: 'pdf' }
    ): Promise<Buffer> {
        const html = await this.generateHTML(classeId, anneeScolaireId, { ...options, format: 'html' });
        
        // Note: Pour un vrai PDF, il faudrait utiliser une librairie comme puppeteer ou html-pdf
        // Pour l'instant, on retourne le HTML qui peut être imprimé en PDF via le navigateur
        logger.info('[EmploiDuTempsPDF] Export HTML généré (impression PDF via navigateur)');
        
        return Buffer.from(html, 'utf-8');
    }
}

export const emploiDuTempsPdfService = new EmploiDuTempsPdfService();
