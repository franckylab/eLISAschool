/**
 * ==================================
 * eLISAschool - Service Export Bulletin (HTML A4 imprimable)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Génère une page HTML A4 imprimable pour un bulletin scolaire.
 * NB: aucune librairie PDF n'est disponible dans le backend —
 * l'export est un document HTML autonome optimisé pour l'impression
 * (window.print() côté client ou conversion externe).
 */

import { Bulletin } from '../entities';

export class BulletinPdfService {
    /**
     * Génère le document HTML A4 d'un bulletin.
     * Le bulletin doit être chargé avec les relations :
     * eleve, classeAnnee.classe, classeAnnee.anneeScolaire, periode,
     * bulletinMatieres.matiere, etablissement
     */
    genererHtml(bulletin: Bulletin): string {
        const eleve = bulletin.eleve;
        const classe = bulletin.classeAnnee?.classe;
        const anneeScolaire: { libelle?: string } | undefined = (bulletin.classeAnnee as any)?.anneeScolaire;
        const periode = bulletin.periode;
        const etablissement = bulletin.etablissement;

        const matieres = [...(bulletin.bulletinMatieres || [])].sort(
            (a, b) => (a.matiere?.nom || '').localeCompare(b.matiere?.nom || '')
        );

        const totalCoefficients = matieres.reduce((acc, m) => acc + (m.coefficient || 0), 0);

        const lignesMatieres = matieres.map((m) => `
                <tr>
                    <td class="matiere">${this.escapeHtml(m.matiere?.nom || '—')}</td>
                    <td class="num">${this.formatNombre(m.coefficient)}</td>
                    <td class="num moyenne-eleve">${this.formatNombre(m.moyenne)}</td>
                    <td class="num">${m.moyenneClasse !== null && m.moyenneClasse !== undefined ? this.formatNombre(m.moyenneClasse) : '—'}</td>
                    <td class="num">${m.moyenneMinClasse !== null && m.moyenneMinClasse !== undefined ? this.formatNombre(m.moyenneMinClasse) : '—'}</td>
                    <td class="num">${m.moyenneMaxClasse !== null && m.moyenneMaxClasse !== undefined ? this.formatNombre(m.moyenneMaxClasse) : '—'}</td>
                    <td class="num">${m.rangMatiere ?? '—'}</td>
                    <td class="appreciation">${this.escapeHtml(m.appreciation || '')}</td>
                </tr>`).join('');

        const sanctions = (bulletin.sanctions || []).map((s) => `<li>${this.escapeHtml(s)}</li>`).join('');
        const encouragements = (bulletin.encouragements || []).map((e) => `<li>${this.escapeHtml(e)}</li>`).join('');

        const logoHtml = etablissement?.logoBase64
            ? `<img class="logo" src="data:image/${etablissement.logoType || 'png'};base64,${etablissement.logoBase64}" alt="Logo" />`
            : '';

        return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Bulletin - ${this.escapeHtml(eleve ? `${eleve.nom} ${eleve.prenom}` : '')} - ${this.escapeHtml(periode?.nom || '')}</title>
    <style>
        @page { size: A4; margin: 12mm; }
        * { box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1f2937;
            margin: 0;
            font-size: 12px;
        }
        .page {
            width: 186mm;
            margin: 0 auto;
            padding: 8mm 0;
        }
        .entete {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #1d4ed8;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .entete .logo { max-height: 60px; max-width: 100px; }
        .entete .etab h1 { margin: 0; font-size: 18px; color: #1d4ed8; }
        .entete .etab p { margin: 2px 0; color: #6b7280; font-size: 11px; }
        .titre {
            text-align: center;
            margin: 10px 0 14px 0;
        }
        .titre h2 { margin: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
        .titre p { margin: 3px 0 0 0; color: #4b5563; }
        .infos-eleve {
            display: flex;
            flex-wrap: wrap;
            gap: 6px 24px;
            background: #f3f4f6;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 14px;
        }
        .infos-eleve div { min-width: 160px; }
        .infos-eleve .label { color: #6b7280; font-size: 10px; text-transform: uppercase; }
        .infos-eleve .valeur { font-weight: 600; }
        table.matieres {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        table.matieres th, table.matieres td {
            border: 1px solid #d1d5db;
            padding: 5px 7px;
        }
        table.matieres th {
            background: #1d4ed8;
            color: #fff;
            font-size: 10px;
            text-transform: uppercase;
        }
        table.matieres td.num { text-align: center; }
        table.matieres td.moyenne-eleve { font-weight: 700; }
        table.matieres td.matiere { font-weight: 600; }
        table.matieres td.appreciation { font-size: 11px; color: #374151; }
        table.matieres tr:nth-child(even) td { background: #f9fafb; }
        .synthese {
            display: flex;
            gap: 12px;
            margin-bottom: 14px;
        }
        .synthese .carte {
            flex: 1;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 8px 10px;
            text-align: center;
        }
        .synthese .carte .valeur { font-size: 18px; font-weight: 700; color: #1d4ed8; }
        .synthese .carte .label { font-size: 10px; color: #6b7280; text-transform: uppercase; }
        .bloc {
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 12px;
        }
        .bloc h3 { margin: 0 0 6px 0; font-size: 12px; color: #1d4ed8; text-transform: uppercase; }
        .bloc ul { margin: 4px 0; padding-left: 18px; }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 24px;
        }
        .signatures .cadre {
            width: 30%;
            border-top: 1px solid #9ca3af;
            padding-top: 6px;
            text-align: center;
            font-size: 11px;
            color: #6b7280;
        }
        .pied {
            margin-top: 18px;
            text-align: center;
            font-size: 9px;
            color: #9ca3af;
        }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="entete">
            <div class="etab">
                <h1>${this.escapeHtml(etablissement?.nom || 'Établissement')}</h1>
                ${etablissement?.adresse ? `<p>${this.escapeHtml(etablissement.adresse)}</p>` : ''}
                <p>Année scolaire : ${this.escapeHtml(anneeScolaire?.libelle || '—')}</p>
            </div>
            ${logoHtml}
        </div>

        <div class="titre">
            <h2>Bulletin de notes</h2>
            <p>${this.escapeHtml(periode?.nom || 'Période')}</p>
        </div>

        <div class="infos-eleve">
            <div>
                <div class="label">Élève</div>
                <div class="valeur">${this.escapeHtml(eleve ? `${eleve.nom} ${eleve.prenom}` : '—')}</div>
            </div>
            <div>
                <div class="label">Matricule</div>
                <div class="valeur">${this.escapeHtml(eleve?.matricule || '—')}</div>
            </div>
            <div>
                <div class="label">Classe</div>
                <div class="valeur">${this.escapeHtml(classe?.nom || '—')}</div>
            </div>
            <div>
                <div class="label">Statut</div>
                <div class="valeur">${bulletin.publie ? 'Publié' : 'Non publié'}</div>
            </div>
        </div>

        <table class="matieres">
            <thead>
                <tr>
                    <th>Matière</th>
                    <th>Coef.</th>
                    <th>Moyenne élève /20</th>
                    <th>Moyenne classe</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Rang</th>
                    <th>Appréciation</th>
                </tr>
            </thead>
            <tbody>
                ${lignesMatieres || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">Aucune matière</td></tr>'}
            </tbody>
            <tfoot>
                <tr>
                    <td class="matiere">Total</td>
                    <td class="num">${this.formatNombre(totalCoefficients)}</td>
                    <td class="num moyenne-eleve">${this.formatNombre(bulletin.moyenneGenerale)}</td>
                    <td class="num">${bulletin.moyenneClasse !== null && bulletin.moyenneClasse !== undefined ? this.formatNombre(bulletin.moyenneClasse) : '—'}</td>
                    <td class="num">${bulletin.moyenneMin !== null && bulletin.moyenneMin !== undefined ? this.formatNombre(bulletin.moyenneMin) : '—'}</td>
                    <td class="num">${bulletin.moyenneMax !== null && bulletin.moyenneMax !== undefined ? this.formatNombre(bulletin.moyenneMax) : '—'}</td>
                    <td class="num">${bulletin.rang ?? '—'}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>

        <div class="synthese">
            <div class="carte">
                <div class="valeur">${this.formatNombre(bulletin.moyenneGenerale)}/20</div>
                <div class="label">Moyenne générale</div>
            </div>
            <div class="carte">
                <div class="valeur">${bulletin.rang ?? '—'}</div>
                <div class="label">Rang</div>
            </div>
            <div class="carte">
                <div class="valeur">${bulletin.moyenneClasse !== null && bulletin.moyenneClasse !== undefined ? this.formatNombre(bulletin.moyenneClasse) : '—'}</div>
                <div class="label">Moyenne classe</div>
            </div>
        </div>

        ${bulletin.appreciationConseil ? `
        <div class="bloc">
            <h3>Appréciation du conseil de classe</h3>
            <p>${this.escapeHtml(bulletin.appreciationConseil)}</p>
        </div>` : ''}

        ${encouragements ? `
        <div class="bloc">
            <h3>Encouragements</h3>
            <ul>${encouragements}</ul>
        </div>` : ''}

        ${sanctions ? `
        <div class="bloc">
            <h3>Sanctions</h3>
            <ul>${sanctions}</ul>
        </div>` : ''}

        <div class="signatures">
            <div class="cadre">Le Chef d'établissement</div>
            <div class="cadre">Le Professeur principal</div>
            <div class="cadre">Les Parents / Tuteur</div>
        </div>

        <div class="pied">
            Document généré par eLISAschool — ${this.escapeHtml(etablissement?.nom || '')}
        </div>
    </div>
</body>
</html>`;
    }

    private formatNombre(valeur: number | null | undefined): string {
        if (valeur === null || valeur === undefined || Number.isNaN(valeur)) return '—';
        return (Math.round(valeur * 100) / 100).toFixed(2);
    }

    private escapeHtml(texte: string): string {
        return String(texte)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

export const bulletinPdfService = new BulletinPdfService();
export default bulletinPdfService;
