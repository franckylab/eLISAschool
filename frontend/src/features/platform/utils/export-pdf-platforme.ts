/**
 * ==================================
 * eLISAschool — Export PDF Plateforme
 * ==================================
 * Version: 1.0.0
 *
 * Génération de rapports PDF pour le panel admin plateforme :
 * - Liste des établissements
 * - Liste des utilisateurs plateforme
 * - Rapport de facturation
 *
 * Utilise jsPDF (déjà installé).
 */

import { jsPDF } from 'jspdf';

interface PdfHeader {
    titre: string;
    sousTitre?: string;
    date?: string;
}

interface PdfColumn {
    header: string;
    key: string;
    width: number; // percentage 0-100
}

/**
 * Génère un PDF de type tableau (liste d'éléments)
 */
export function genererPdfTableau(options: {
    header: PdfHeader;
    columns: PdfColumn[];
    data: Record<string, any>[];
    nomFichier: string;
}): void {
    const { header, columns, data, nomFichier } = options;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(header.titre, margin, margin + 8);

    if (header.sousTitre) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(header.sousTitre, margin, margin + 16);
    }

    const dateStr = header.date || new Date().toLocaleDateString('fr-FR');
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Généré le ${dateStr}`, pageWidth - margin, margin + 8, { align: 'right' });
    doc.setTextColor(0);

    // Ligne séparatrice
    const headerY = margin + 22;
    doc.setDrawColor(200);
    doc.line(margin, headerY, pageWidth - margin, headerY);

    // Tableau — Header colonnes
    const tableY = headerY + 8;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, tableY - 4, contentWidth, 8, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    let x = margin;
    for (const col of columns) {
        const colWidth = (col.width / 100) * contentWidth;
        doc.text(col.header, x + 2, tableY);
        x += colWidth;
    }

    // Tableau — Données
    doc.setFont('helvetica', 'normal');
    let rowY = tableY + 8;
    const rowHeight = 7;

    for (let i = 0; i < data.length; i++) {
        // Vérifier pagination
        if (rowY > pageHeight - margin - 10) {
            doc.addPage();
            rowY = margin + 10;
            // Re-dessiner l'en-tête de tableau
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, rowY - 4, contentWidth, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            x = margin;
            for (const col of columns) {
                const colWidth = (col.width / 100) * contentWidth;
                doc.text(col.header, x + 2, rowY);
                x += colWidth;
            }
            doc.setFont('helvetica', 'normal');
            rowY += 8;
        }

        // Ligne alternée
        if (i % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, rowY - 4, contentWidth, rowHeight, 'F');
        }

        doc.setFontSize(7);
        x = margin;
        for (const col of columns) {
            const colWidth = (col.width / 100) * contentWidth;
            const value = String(data[i][col.key] ?? '—');
            // Tronquer si trop long
            const truncated = value.length > Math.floor(colWidth / 2) ? value.substring(0, Math.floor(colWidth / 2) - 2) + '…' : value;
            doc.text(truncated, x + 2, rowY);
            x += colWidth;
        }

        rowY += rowHeight;
    }

    // Footer — nombre de lignes
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`${data.length} élément(s)`, margin, pageHeight - margin);

    // Sauvegarder
    doc.save(`${nomFichier}-${dateStr.replace(/\//g, '-')}.pdf`);
}

/**
 * Export PDF de la liste des établissements
 */
export function exportEtablissementsPdf(etablissements: Array<{
    nom: string;
    typeEtablissement?: string;
    ville?: string;
    statut?: string;
    nombreEleves?: number;
}>): void {
    genererPdfTableau({
        header: {
            titre: 'Liste des établissements',
            sousTitre: 'Plateforme eLISAschool — Control Plane',
        },
        columns: [
            { header: 'Nom', key: 'nom', width: 30 },
            { header: 'Type', key: 'typeEtablissement', width: 15 },
            { header: 'Ville', key: 'ville', width: 20 },
            { header: 'Statut', key: 'statut', width: 15 },
            { header: 'Élèves', key: 'nombreEleves', width: 20 },
        ],
        data: etablissements,
        nomFichier: 'etablissements',
    });
}

/**
 * Export PDF de la liste des utilisateurs plateforme
 */
export function exportUtilisateursPdf(utilisateurs: Array<{
    nom: string;
    email?: string;
    role?: string;
    statut?: string;
    mfaActive?: boolean;
    derniereConnexion?: string;
}>): void {
    genererPdfTableau({
        header: {
            titre: 'Utilisateurs plateforme',
            sousTitre: 'Comptes admin — Control Plane',
        },
        columns: [
            { header: 'Nom', key: 'nom', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Rôle', key: 'role', width: 20 },
            { header: 'Statut', key: 'statut', width: 12 },
            { header: 'MFA', key: 'mfaActive', width: 8 },
            { header: 'Dernière connexion', key: 'derniereConnexion', width: 10 },
        ],
        data: utilisateurs.map(u => ({
            ...u,
            mfaActive: u.mfaActive ? 'Oui' : 'Non',
        })),
        nomFichier: 'utilisateurs-plateforme',
    });
}

/**
 * Export PDF du rapport de facturation
 */
export function exportFacturationPdf(data: {
    mrr: number;
    arr: number;
    totalFacture: number;
    totalPaye: number;
    totalImpaye: number;
    nombreFactures: number;
    facturesEnRetard: number;
    tauxRecouvrement: number;
}): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport de facturation', margin, margin + 10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Plateforme eLISAschool — Control Plane', margin, margin + 18);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, doc.internal.pageSize.getWidth() - margin, margin + 10, { align: 'right' });
    doc.setTextColor(0);

    // KPIs
    const formatMontant = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' XAF';
    let y = margin + 35;

    const kpis = [
        { label: 'MRR (Revenu mensuel récurrent)', value: formatMontant(data.mrr) },
        { label: 'ARR (Revenu annuel récurrent)', value: formatMontant(data.arr) },
        { label: 'Total facturé', value: formatMontant(data.totalFacture) },
        { label: 'Total payé', value: formatMontant(data.totalPaye) },
        { label: 'Total impayé', value: formatMontant(data.totalImpaye) },
        { label: 'Nombre de factures', value: String(data.nombreFactures) },
        { label: 'Factures en retard', value: String(data.facturesEnRetard) },
        { label: 'Taux de recouvrement', value: `${data.tauxRecouvrement}%` },
    ];

    for (const kpi of kpis) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, y - 4, doc.internal.pageSize.getWidth() - 2 * margin, 10, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(kpi.label, margin + 4, y + 2);
        doc.setFont('helvetica', 'bold');
        doc.text(kpi.value, doc.internal.pageSize.getWidth() - margin - 4, y + 2, { align: 'right' });
        y += 14;
    }

    doc.save(`rapport-facturation-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`);
}
