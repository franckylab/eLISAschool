/**
 * ==================================
 * eLISAschool - Service Export PDF Emploi-du-Temps
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-07-27
 *
 * Refonte : migration de EmploiDuTemps vers CreneauHoraire.
 * Les créneaux référencent affectationMatiereId (source unique).
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { CreneauHoraire } from '../entities';
import { AffectationMatiere } from '@modules/matieres/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

interface ExportOptions {
    format: 'html' | 'pdf';
    includeHeader?: boolean;
    includeLegend?: boolean;
    colorBy?: 'matiere' | 'enseignant' | 'type';
}

interface CreneauEnrichi {
    creneau: CreneauHoraire;
    matiereNom?: string;
    matiereId?: string;
    enseignantNom?: string;
    classeNom?: string;
}

export class EmploiDuTempsPdfService {
    private creneauRepo: Repository<CreneauHoraire>;
    private affectationRepo: Repository<AffectationMatiere>;

    constructor() {
        this.creneauRepo = AppDataSource.getRepository(CreneauHoraire);
        this.affectationRepo = AppDataSource.getRepository(AffectationMatiere);
    }

    async generateHTML(
        classeAnneeId: string,
        anneeScolaireId: string,
        options: ExportOptions = { format: 'html' }
    ): Promise<string> {
        const affectations = await this.affectationRepo.find({
            where: { classeAnneeId },
            relations: ['matiere', 'enseignant', 'classeAnnee', 'classeAnnee.classe'],
        });

        if (affectations.length === 0) {
            throw new AppError('Aucune affectation trouvée pour cette classe', 404, 'NOT_FOUND');
        }

        const affectationIds = affectations.map(a => a.id);

        const creneaux = await this.creneauRepo
            .createQueryBuilder('ch')
            .leftJoinAndSelect('ch.affectationMatiere', 'am')
            .leftJoinAndSelect('am.matiere', 'matiere')
            .leftJoinAndSelect('am.enseignant', 'enseignant')
            .leftJoinAndSelect('am.classeAnnee', 'classeAnnee')
            .leftJoinAndSelect('classeAnnee.classe', 'classe')
            .where('ch.affectationMatiereId IN (:...affectationIds)', { affectationIds })
            .andWhere('ch.anneeScolaireId = :anneeScolaireId', { anneeScolaireId })
            .orderBy('ch.jour', 'ASC')
            .addOrderBy('ch.heureDebut', 'ASC')
            .getMany();

        if (creneaux.length === 0) {
            throw new AppError('Aucun créneau trouvé pour cet emploi du temps', 404, 'NOT_FOUND');
        }

        const enrichis: CreneauEnrichi[] = creneaux.map(c => ({
            creneau: c,
            matiereNom: c.affectationMatiere?.matiere?.nom,
            matiereId: c.affectationMatiere?.matiere?.id,
            enseignantNom: c.affectationMatiere?.enseignant
                ? `${c.affectationMatiere.enseignant.nom} ${c.affectationMatiere.enseignant.prenom}`
                : undefined,
            classeNom: c.affectationMatiere?.classeAnnee?.classe?.nom,
        }));

        const plan = this.organiserParJour(enrichis);
        const classeNom = enrichis[0]?.classeNom;

        return this.creerHTML(plan, classeNom, anneeScolaireId, options);
    }

    private organiserParJour(creneaux: CreneauEnrichi[]): Map<string, CreneauEnrichi[]> {
        const plan = new Map<string, CreneauEnrichi[]>();

        for (const creneau of creneaux) {
            const jour = creneau.creneau.jour;
            if (!plan.has(jour)) {
                plan.set(jour, []);
            }
            plan.get(jour)!.push(creneau);
        }

        for (const [, creneauxJour] of plan) {
            creneauxJour.sort((a, b) => a.creneau.heureDebut.localeCompare(b.creneau.heureDebut));
        }

        return plan;
    }

    private creerHTML(
        plan: Map<string, CreneauEnrichi[]>,
        classeNom: string | undefined,
        anneeScolaireId: string,
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
    <title>Emploi du temps - ${classeNom || 'Classe'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2563eb; }
        .header h1 { color: #1e293b; font-size: 28px; margin-bottom: 10px; }
        .header .subtitle { color: #64748b; font-size: 16px; }
        .table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #2563eb; color: white; padding: 12px; text-align: center; font-weight: 600; border: 1px solid #1e40af; }
        td { padding: 8px; border: 1px solid #e2e8f0; text-align: center; min-width: 120px; height: 60px; vertical-align: middle; }
        .heure-cell { background: #f1f5f9; font-weight: 600; color: #475569; min-width: 80px; }
        .creneau { padding: 8px; border-radius: 6px; font-size: 12px; line-height: 1.4; transition: transform 0.2s; }
        .creneau:hover { transform: scale(1.05); }
        .creneau .matiere { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
        .creneau .enseignant { font-size: 11px; opacity: 0.9; }
        .creneau .salle { font-size: 10px; opacity: 0.8; margin-top: 2px; }
        .color-math { background: #dbeafe; color: #1e40af; border-left: 4px solid #3b82f6; }
        .color-francais { background: #fef3c7; color: #92400e; border-left: 4px solid #f59e0b; }
        .color-svt { background: #d1fae5; color: #065f46; border-left: 4px solid #10b981; }
        .color-physique { background: #fce7f3; color: #9f1239; border-left: 4px solid #ec4899; }
        .color-histoire { background: #e0e7ff; color: #3730a3; border-left: 4px solid #6366f1; }
        .color-anglais { background: #ccfbf1; color: #115e59; border-left: 4px solid #14b8a6; }
        .color-default { background: #f3f4f6; color: #374151; border-left: 4px solid #6b7280; }
        .legend { margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 6px; }
        .legend h3 { margin-bottom: 15px; color: #1e293b; }
        .legend-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
        .legend-item { display: flex; align-items: center; gap: 10px; }
        .legend-color { width: 20px; height: 20px; border-radius: 4px; border-left: 4px solid; }
        .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        @media print { body { padding: 0; background: white; } .container { box-shadow: none; padding: 15px; } }
    </style>
</head>
<body>
    <div class="container">
        ${options.includeHeader !== false ? `
        <div class="header">
            <h1>Emploi du Temps</h1>
            <div class="subtitle">
                Classe : <strong>${classeNom || 'Non définie'}</strong> |
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
            <h3>Légende</h3>
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

    private extraireHeures(plan: Map<string, CreneauEnrichi[]>): string[] {
        const heures = new Set<string>();
        for (const creneaux of plan.values()) {
            for (const { creneau } of creneaux) {
                heures.add(creneau.heureDebut);
            }
        }
        return Array.from(heures).sort();
    }

    private trouverCreneau(creneaux: CreneauEnrichi[], heure: string): CreneauEnrichi | null {
        return creneaux.find(c => c.creneau.heureDebut === heure) || null;
    }

    private creerCelluleCreneau(enrichi: CreneauEnrichi, options: ExportOptions): string {
        const couleurClass = this.obtenirCouleurClass(enrichi, options);
        const matiereNom = enrichi.matiereNom || 'Matière';
        const enseignantNom = enrichi.enseignantNom || 'Enseignant non assigné';
        const salleNom = enrichi.creneau.salle
            ? enrichi.creneau.salle.nom || enrichi.creneau.salleId?.substring(0, 8)
            : null;

        return `
            <div class="creneau ${couleurClass}">
                <div class="matiere">${matiereNom}</div>
                <div class="enseignant">${enseignantNom}</div>
                ${salleNom ? `<div class="salle">${salleNom}</div>` : ''}
            </div>
        `;
    }

    private obtenirCouleurClass(enrichi: CreneauEnrichi, options: ExportOptions): string {
        if (options.colorBy === 'matiere' && enrichi.matiereNom) {
            const nom = enrichi.matiereNom.toLowerCase();
            if (nom.includes('math')) return 'color-math';
            if (nom.includes('français') || nom.includes('francais')) return 'color-francais';
            if (nom.includes('svt') || nom.includes('biologie')) return 'color-svt';
            if (nom.includes('physique') || nom.includes('chimie')) return 'color-physique';
            if (nom.includes('histoire') || nom.includes('géo')) return 'color-histoire';
            if (nom.includes('anglais')) return 'color-anglais';
        }
        return 'color-default';
    }

    private creerLegend(plan: Map<string, CreneauEnrichi[]>): string {
        const matieres = new Map<string, string>();
        for (const creneaux of plan.values()) {
            for (const enrichi of creneaux) {
                if (enrichi.matiereId && enrichi.matiereNom && !matieres.has(enrichi.matiereId)) {
                    matieres.set(enrichi.matiereId, enrichi.matiereNom);
                }
            }
        }

        return Array.from(matieres.entries()).map(([id, nom]) => {
            const couleurClass = this.obtenirCouleurClass(
                { creneau: {} as CreneauHoraire, matiereId: id, matiereNom: nom },
                { format: 'html', colorBy: 'matiere' }
            );
            return `
                <div class="legend-item">
                    <div class="legend-color ${couleurClass}"></div>
                    <span>${nom}</span>
                </div>
            `;
        }).join('');
    }

    private formaterJour(jour: string): string {
        const joursMap: Record<string, string> = {
            'LUNDI': 'Lundi', 'MARDI': 'Mardi', 'MERCREDI': 'Mercredi',
            'JEUDI': 'Jeudi', 'VENDREDI': 'Vendredi', 'SAMEDI': 'Samedi',
        };
        return joursMap[jour] || jour;
    }

    async generatePDF(
        classeAnneeId: string,
        anneeScolaireId: string,
        options: ExportOptions = { format: 'pdf' }
    ): Promise<Buffer> {
        const html = await this.generateHTML(classeAnneeId, anneeScolaireId, { ...options, format: 'html' });
        logger.info('[EmploiDuTempsPDF] Export HTML généré (impression PDF via navigateur)');
        return Buffer.from(html, 'utf-8');
    }
}

export const emploiDuTempsPdfService = new EmploiDuTempsPdfService();
