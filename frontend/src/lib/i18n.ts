/**
 * ==================================
 * eLISAschool - Configuration i18n
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonFr from '@/locales/fr/common.json';
import commonEn from '@/locales/en/common.json';
import authFr from '@/locales/fr/auth.json';
import authEn from '@/locales/en/auth.json';
import dashboardFr from '@/locales/fr/dashboard.json';
import dashboardEn from '@/locales/en/dashboard.json';
import configurationFr from '@/locales/fr/configuration.json';
import configurationEn from '@/locales/en/configuration.json';
import classesFr from '@/locales/fr/classes.json';
import classesEn from '@/locales/en/classes.json';
import personnelFr from '@/locales/fr/personnel.json';
import personnelEn from '@/locales/en/personnel.json';
import matieresFr from '@/locales/fr/matieres.json';
import matieresEn from '@/locales/en/matieres.json';
import anneesFr from '@/locales/fr/annees-scolaires.json';
import anneesEn from '@/locales/en/annees-scolaires.json';
import cyclesFr from '@/locales/fr/cycles.json';
import cyclesEn from '@/locales/en/cycles.json';
import niveauxFr from '@/locales/fr/niveaux.json';
import niveauxEn from '@/locales/en/niveaux.json';
import periodesFr from '@/locales/fr/periodes.json';
import periodesEn from '@/locales/en/periodes.json';
import utilisateursFr from '@/locales/fr/utilisateurs.json';
import utilisateursEn from '@/locales/en/utilisateurs.json';
import notesFr from '@/locales/fr/notes.json';
import notesEn from '@/locales/en/notes.json';
import bulletinsFr from '@/locales/fr/bulletins.json';
import bulletinsEn from '@/locales/en/bulletins.json';
import cantineFr from '@/locales/fr/cantine.json';
import cantineEn from '@/locales/en/cantine.json';
import transportFr from '@/locales/fr/transport.json';
import transportEn from '@/locales/en/transport.json';
import messagerieFr from '@/locales/fr/messagerie.json';
import messagerieEn from '@/locales/en/messagerie.json';
import annoncesFr from '@/locales/fr/annonces.json';
import annoncesEn from '@/locales/en/annonces.json';
import organisationFr from '@/locales/fr/organisation.json';
import organisationEn from '@/locales/en/organisation.json';
import financesFr from '@/locales/fr/finances.json';
import financesEn from '@/locales/en/finances.json';
import evenementsFr from '@/locales/fr/evenements.json';
import evenementsEn from '@/locales/en/evenements.json';
import documentsFr from '@/locales/fr/documents.json';
import documentsEn from '@/locales/en/documents.json';
import sondagesFr from '@/locales/fr/sondages.json';
import sondagesEn from '@/locales/en/sondages.json';
import disciplineFr from '@/locales/fr/discipline.json';
import disciplineEn from '@/locales/en/discipline.json';
import santeFr from '@/locales/fr/sante.json';
import santeEn from '@/locales/en/sante.json';
import absencesFr from '@/locales/fr/absences.json';
import absencesEn from '@/locales/en/absences.json';
import emploisFr from '@/locales/fr/emplois.json';
import emploisEn from '@/locales/en/emplois.json';
import examensFr from '@/locales/fr/examens.json';
import examensEn from '@/locales/en/examens.json';
import bibliothequeFr from '@/locales/fr/bibliotheque.json';
import bibliothequeEn from '@/locales/en/bibliotheque.json';
import courriersFr from '@/locales/fr/courriers.json';
import courriersEn from '@/locales/en/courriers.json';
import archivesFr from '@/locales/fr/archives.json';
import archivesEn from '@/locales/en/archives.json';
import inventaireFr from '@/locales/fr/inventaire.json';
import inventaireEn from '@/locales/en/inventaire.json';
import congesFr from '@/locales/fr/conges.json';
import congesEn from '@/locales/en/conges.json';
import statistiquesFr from '@/locales/fr/statistiques.json';
import statistiquesEn from '@/locales/en/statistiques.json';
import laboratoireFr from '@/locales/fr/laboratoire.json';
import laboratoireEn from '@/locales/en/laboratoire.json';
import elevesFr from '@/locales/fr/eleves.json';
import elevesEn from '@/locales/en/eleves.json';
import securiteConfigFr from '@/locales/fr/securite-config.json';
import securiteConfigEn from '@/locales/en/securite-config.json';
import securiteFr from '@/locales/fr/securite.json';
import securiteEn from '@/locales/en/securite.json';
import groupesEtablissementsFr from '@/locales/fr/groupes-etablissements.json';
import groupesEtablissementsEn from '@/locales/en/groupes-etablissements.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            fr: {
                common: commonFr,
                auth: authFr,
                dashboard: dashboardFr,
                configuration: configurationFr,
                classes: classesFr,
                personnel: personnelFr,
                matieres: matieresFr,
                'annees-scolaires': anneesFr,
                cycles: cyclesFr,
                niveaux: niveauxFr,
                periodes: periodesFr,
                utilisateurs: utilisateursFr,
                notes: notesFr,
                bulletins: bulletinsFr,
                cantine: cantineFr,
                transport: transportFr,
                messagerie: messagerieFr,
                annonces: annoncesFr,
                organisation: organisationFr,
                finances: financesFr,
                evenements: evenementsFr,
                documents: documentsFr,
                sondages: sondagesFr,
                discipline: disciplineFr,
                sante: santeFr,
                absences: absencesFr,
                emplois: emploisFr,
                examens: examensFr,
                bibliotheque: bibliothequeFr,
                courriers: courriersFr,
                archives: archivesFr,
                inventaire: inventaireFr,
                conges: congesFr,
                statistiques: statistiquesFr,
                laboratoire: laboratoireFr,
                eleves: elevesFr,
                'securite-config': securiteConfigFr,
                securite: securiteFr,
                'groupes-etablissements': groupesEtablissementsFr,
            },
            en: {
                common: commonEn,
                auth: authEn,
                dashboard: dashboardEn,
                configuration: configurationEn,
                classes: classesEn,
                personnel: personnelEn,
                matieres: matieresEn,
                'annees-scolaires': anneesEn,
                cycles: cyclesEn,
                niveaux: niveauxEn,
                periodes: periodesEn,
                utilisateurs: utilisateursEn,
                notes: notesEn,
                bulletins: bulletinsEn,
                cantine: cantineEn,
                transport: transportEn,
                messagerie: messagerieEn,
                annonces: annoncesEn,
                organisation: organisationEn,
                finances: financesEn,
                evenements: evenementsEn,
                documents: documentsEn,
                sondages: sondagesEn,
                discipline: disciplineEn,
                sante: santeEn,
                absences: absencesEn,
                emplois: emploisEn,
                examens: examensEn,
                bibliotheque: bibliothequeEn,
                courriers: courriersEn,
                archives: archivesEn,
                inventaire: inventaireEn,
                conges: congesEn,
                statistiques: statistiquesEn,
                laboratoire: laboratoireEn,
                eleves: elevesEn,
                'securite-config': securiteConfigEn,
                securite: securiteEn,
                'groupes-etablissements': groupesEtablissementsEn,
            },
        },
        fallbackLng: 'fr',
        defaultNS: 'common',
        ns: ['common', 'auth', 'dashboard', 'configuration', 'classes', 'personnel', 'matieres', 'annees-scolaires', 'cycles', 'niveaux', 'periodes', 'utilisateurs', 'notes', 'bulletins', 'cantine', 'transport', 'messagerie', 'annonces', 'organisation', 'finances', 'evenements', 'documents', 'sondages', 'discipline', 'sante', 'absences', 'emplois', 'examens', 'bibliotheque', 'courriers', 'archives', 'inventaire', 'conges', 'statistiques', 'laboratoire', 'eleves', 'securite-config', 'securite', 'groupes-etablissements'],
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
