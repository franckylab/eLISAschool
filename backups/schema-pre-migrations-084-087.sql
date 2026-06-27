--
-- PostgreSQL database dump
--

\restrict KOcIZgbcrxJs8Gs7cpykoU86PQVddtSG9WCfCsk6UPAQyZ6jRGez2LehNcFM21A

-- Dumped from database version 16.14
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: audit_logs_action_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_logs_action_enum AS ENUM (
    'LOGIN',
    'LOGOUT',
    'LOGIN_FAILED',
    'PASSWORD_CHANGE',
    'PASSWORD_RESET',
    'USER_CREATE',
    'USER_UPDATE',
    'USER_DELETE',
    'USER_SUSPEND',
    'USER_ACTIVATE',
    'ROLE_CHANGE',
    'ELEVE_CREATE',
    'ELEVE_UPDATE',
    'ELEVE_DELETE',
    'ELEVE_INSCRIPTION',
    'BULLETIN_GENERATE',
    'BULLETIN_UPDATE',
    'CYCLE_CREATE',
    'CYCLE_UPDATE',
    'CYCLE_DELETE',
    'NIVEAU_CREATE',
    'NIVEAU_UPDATE',
    'NIVEAU_DELETE',
    'CLASSE_CREATE',
    'CLASSE_UPDATE',
    'CLASSE_DELETE',
    'MATIERE_CREATE',
    'MATIERE_UPDATE',
    'MATIERE_DELETE',
    'PERIODE_CREATE',
    'PERIODE_UPDATE',
    'PERIODE_DELETE',
    'ANNEE_SCOLAIRE_CREATE',
    'ANNEE_SCOLAIRE_UPDATE',
    'ANNEE_SCOLAIRE_DELETE',
    'ANNEE_SCOLAIRE_ACTIVATE',
    'ETABLISSEMENT_CREATE',
    'ETABLISSEMENT_UPDATE',
    'ETABLISSEMENT_DELETE',
    'PERSONNEL_CREATE',
    'PERSONNEL_UPDATE',
    'PERSONNEL_DELETE',
    'CONTRAT_PERSONNEL_CREATE',
    'CONTRAT_PERSONNEL_UPDATE',
    'CONTRAT_PERSONNEL_DELETE',
    'TYPE_CONTRAT_CREATE',
    'TYPE_CONTRAT_UPDATE',
    'TYPE_CONTRAT_DELETE',
    'AFFECTATION_POSTE_CREATE',
    'AFFECTATION_POSTE_UPDATE',
    'AFFECTATION_POSTE_TERMINER',
    'MUTATION_HIERARCHIQUE',
    'HEURE_COURS_CREATE',
    'HEURE_COURS_UPDATE',
    'HEURE_COURS_DELETE',
    'ABSENCE_PERSONNEL_CREATE',
    'ABSENCE_PERSONNEL_UPDATE',
    'ABSENCE_PERSONNEL_DELETE',
    'ABSENCE_PERSONNEL_JUSTIFIER',
    'EVALUATION_ENSEIGNANT_CREATE',
    'EVALUATION_ENSEIGNANT_UPDATE',
    'EVALUATION_ENSEIGNANT_DELETE',
    'PROGRESSION_PROGRAMME_CREATE',
    'PROGRESSION_PROGRAMME_UPDATE',
    'PROGRESSION_PROGRAMME_DELETE',
    'PROGRAMME_CHAPITRE_CREATE',
    'PROGRAMME_CHAPITRE_UPDATE',
    'PROGRAMME_CHAPITRE_DELETE',
    'BULLETIN_PAI_CREATE',
    'BULLETIN_PAI_UPDATE',
    'BULLETIN_PAI_DELETE',
    'BULLETIN_PAI_GENERER',
    'BULLETIN_PAI_VALIDER',
    'DOCUMENT_CREATE',
    'DOCUMENT_DELETE',
    'DOCUMENT_PRINT',
    'DOCUMENT_GENERATE',
    'INCIDENT_ELEVE_CREATE',
    'INCIDENT_ELEVE_UPDATE',
    'SANCTION_ELEVE_CREATE',
    'SANCTION_ELEVE_UPDATE',
    'FELICITATION_ELEVE_CREATE',
    'OBSERVATION_ELEVE_CREATE',
    'INCIDENT_PERSONNEL_CREATE',
    'INCIDENT_PERSONNEL_UPDATE',
    'EVALUATION_PERSONNEL_CREATE',
    'EVALUATION_PERSONNEL_UPDATE',
    'DOSSIER_MEDICAL_CREATE',
    'DOSSIER_MEDICAL_UPDATE',
    'CONSULTATION_MEDICALE_CREATE',
    'INCIDENT_SANTE_CREATE',
    'NOTE_CREATE',
    'NOTE_UPDATE',
    'NOTE_DELETE',
    'NOTE_VALIDATE',
    'MENU_CREATE',
    'MENU_UPDATE',
    'MENU_DELETE',
    'INSCRIPTION_CANTINE_CREATE',
    'INSCRIPTION_CANTINE_DELETE',
    'SOLDE_RECHARGE',
    'CONSOMMATION_ENREGISTRER',
    'LIGNE_CREATE',
    'LIGNE_UPDATE',
    'LIGNE_DELETE',
    'INSCRIPTION_TRANSPORT_CREATE',
    'INSCRIPTION_TRANSPORT_DELETE',
    'PRESENCE_TRANSPORT',
    'PLACE_PARKING_CREATE',
    'PLACE_PARKING_UPDATE',
    'PLACE_PARKING_DELETE',
    'VEHICULE_CREATE',
    'VEHICULE_UPDATE',
    'VEHICULE_DELETE',
    'ABONNEMENT_PARKING_CREATE',
    'ABONNEMENT_PARKING_UPDATE',
    'CARTE_CREATE',
    'CARTE_UPDATE',
    'CARTE_DESACTIVER',
    'CARTE_RENOUVELER',
    'CARTE_PERTE',
    'MATERIEL_CREATE',
    'MATERIEL_UPDATE',
    'MATERIEL_DELETE',
    'MATERIEL_ASSIGN',
    'MATERIEL_RETURN',
    'MESSAGE_SEND',
    'MESSAGE_DELETE',
    'MESSAGE_MARK_READ',
    'CLUB_CREATE',
    'CLUB_UPDATE',
    'CLUB_DELETE',
    'CLUB_JOIN',
    'CLUB_LEAVE',
    'BADGE_AWARD',
    'SCORE_UPDATE',
    'GAMIFICATION_POINTS',
    'GAMIFICATION_BADGE',
    'GAMIFICATION_CLASSEMENT',
    'SONDAGE_CREATE',
    'SONDAGE_EDIT',
    'SONDAGE_DELETE',
    'SONDAGE_ACTIVATION',
    'ANNONCE_CREATE',
    'ANNONCE_EDIT',
    'ANNONCE_DELETE',
    'ANNONCE_PUBLICATION',
    'SANTE_INCIDENT',
    'SANTE_VISITE',
    'SANTE_CONSULTATION',
    'ORIENTATION_CREATE',
    'ORIENTATION_UPDATE',
    'ORIENTATION_VALIDATE',
    'REQUETE_CREATE',
    'REQUETE_EXECUTE',
    'REQUETE_DELETE',
    'ROLE_CREATE',
    'ROLE_UPDATE',
    'ROLE_DELETE',
    'ROLE_ASSIGN',
    'ROLE_REVOKE',
    'PERMISSION_CREATE',
    'PERMISSION_UPDATE',
    'PERMISSION_DELETE',
    'CONFIG_CHANGE',
    'MODULE_ACTIVATE',
    'MODULE_DEACTIVATE',
    'PREFERENCE_CREATE',
    'PREFERENCE_UPDATE',
    'PREFERENCE_DELETE',
    'PREFERENCE_RESET',
    'NOTIFICATION_CREATE',
    'NOTIFICATION_UPDATE',
    'NOTIFICATION_DELETE',
    'NOTIFICATION_ENVOI_SUCCESS',
    'NOTIFICATION_ENVOI_FAILURE',
    'NOTIFICATION_PROVIDER_CREATE',
    'NOTIFICATION_PROVIDER_UPDATE',
    'NOTIFICATION_PROVIDER_DELETE',
    'NOTIFICATION_PROVIDER_TOGGLE',
    'NOTIFICATION_BULK_SEND',
    'PAYMENT_RECEIVE',
    'REFUND',
    'DATA_EXPORT',
    'DATA_IMPORT',
    'DATA_DELETE_BULK',
    'ACCESS_DENIED',
    'PERMISSION_CHANGE'
);


--
-- Name: audit_logs_severity_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_logs_severity_enum AS ENUM (
    'INFO',
    'WARNING',
    'CRITICAL'
);


--
-- Name: backup_records_backuptype_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.backup_records_backuptype_enum AS ENUM (
    'config',
    'database',
    'full'
);


--
-- Name: backup_records_storageprovider_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.backup_records_storageprovider_enum AS ENUM (
    'database',
    's3',
    'filesystem'
);


--
-- Name: bons_commande_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.bons_commande_statut_enum AS ENUM (
    'BROUILLON',
    'ENVOYE',
    'RECU',
    'FACTURE',
    'ANNULE'
);


--
-- Name: bulletins_workflow_statutvalidation_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.bulletins_workflow_statutvalidation_enum AS ENUM (
    'BROUILLON',
    'EN_VALIDATION',
    'VALIDE',
    'PUBLIE',
    'REJETE'
);


--
-- Name: cartes_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.cartes_type_enum AS ENUM (
    'SCOLAIRE',
    'ACCES',
    'CANTINE',
    'TRANSPORT',
    'BIBLIOTHEQUE'
);


--
-- Name: categories_depense_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.categories_depense_type_enum AS ENUM (
    'CHARGE_FIXE',
    'CHARGE_VARIABLE',
    'INVESTISSEMENT'
);


--
-- Name: consommations_cantine_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.consommations_cantine_statut_enum AS ENUM (
    'DISPONIBLE',
    'EPUISE',
    'ANNULE',
    'CONSOMME'
);


--
-- Name: conversations_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.conversations_type_enum AS ENUM (
    'INDIVIDUELLE',
    'GROUPE',
    'CLASSE',
    'FAMILLE'
);


--
-- Name: demandes_depense_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.demandes_depense_statut_enum AS ENUM (
    'BROUILLON',
    'SOUMISE',
    'APPROUVEE',
    'REJETEE',
    'ANNULEE'
);


--
-- Name: demandes_depense_urgence_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.demandes_depense_urgence_enum AS ENUM (
    'BASSE',
    'MOYENNE',
    'HAUTE',
    'CRITIQUE'
);


--
-- Name: depenses_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.depenses_statut_enum AS ENUM (
    'BROUILLON',
    'EN_COURS_VALIDATION',
    'VALIDEE',
    'PAYEE',
    'PARTIELLEMENT_PAYEE',
    'ANNULEE'
);


--
-- Name: echeanciers_paiement_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.echeanciers_paiement_statut_enum AS ENUM (
    'EN_ATTENTE',
    'PAYE',
    'PARTIELLEMENT_PAYE',
    'ANNULE',
    'REMBOURSE'
);


--
-- Name: eleves_soussysteme_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.eleves_soussysteme_enum AS ENUM (
    'FRANCOPHONE',
    'ANGLOPHONE',
    'BICULTUREL'
);


--
-- Name: etablissements_soussysteme_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.etablissements_soussysteme_enum AS ENUM (
    'FRANCOPHONE',
    'ANGLOPHONE',
    'BICULTUREL'
);


--
-- Name: etablissements_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.etablissements_type_enum AS ENUM (
    'LAIC',
    'CONFESSIONNEL_CATHOLIQUE',
    'CONFESSIONNEL_PROTESTANT',
    'CONFESSIONNEL_ISLAMIQUE',
    'AUTRE'
);


--
-- Name: factures_fournisseur_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.factures_fournisseur_statut_enum AS ENUM (
    'EN_ATTENTE',
    'VERIFIEE',
    'PAYEE',
    'ANNULEE'
);


--
-- Name: fiches_metiers_filiere_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fiches_metiers_filiere_enum AS ENUM (
    'SCIENTIFIQUE',
    'LITTERAIRE',
    'TECHNIQUE',
    'PROFESSIONNELLE',
    'ARTISTIQUE'
);


--
-- Name: file_impressions_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.file_impressions_statut_enum AS ENUM (
    'EN_ATTENTE',
    'EN_COURS',
    'TERMINE',
    'ECHEC',
    'ANNULE'
);


--
-- Name: file_impressions_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.file_impressions_type_enum AS ENUM (
    'BULLETIN',
    'CERTIFICAT',
    'CARTE_SCOLAIRE',
    'ATTESTATION',
    'RAPPORT',
    'FORMULAIRE',
    'RECUPAIEMENT',
    'AUTRE'
);


--
-- Name: filieres_soussysteme_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.filieres_soussysteme_enum AS ENUM (
    'FRANCOPHONE',
    'ANGLOPHONE',
    'BICULTUREL'
);


--
-- Name: hierarchie_personnel_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hierarchie_personnel_statut_enum AS ENUM (
    'ACTIVE',
    'HISTORIQUE',
    'PLANIFIEE'
);


--
-- Name: hierarchie_personnel_typerelation_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hierarchie_personnel_typerelation_enum AS ENUM (
    'SUPERVISE_DIRECT',
    'SUPERVISE_INDIRECT',
    'RATTACHEMENT_FONCTIONNEL',
    'COLLABORATION',
    'REPLACEMENT',
    'INTERIM'
);


--
-- Name: historique_configuration_action_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.historique_configuration_action_enum AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'RESET',
    'IMPORT',
    'EXPORT',
    'RESTORE'
);


--
-- Name: historique_configuration_cible_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.historique_configuration_cible_enum AS ENUM (
    'APP',
    'MODULE',
    'PARAMETRE'
);


--
-- Name: historique_scores_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.historique_scores_type_enum AS ENUM (
    'ACADEMIQUE',
    'COMPORTEMENT',
    'ASSIDUITE',
    'PARTICIPATION',
    'GLOBAL'
);


--
-- Name: inscriptions_cantine_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inscriptions_cantine_statut_enum AS ENUM (
    'ACTIVE',
    'SUSPENDUE',
    'RESILIEE',
    'EN_ATTENTE_VALIDATION'
);


--
-- Name: materiels_categorie_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.materiels_categorie_enum AS ENUM (
    'LIVRE',
    'BUREAU',
    'ORDINATEUR',
    'SPORTIF',
    'AUDIOVISUEL',
    'AUTRE'
);


--
-- Name: materiels_etat_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.materiels_etat_enum AS ENUM (
    'NEUF',
    'BON',
    'USAGE',
    'ABIME',
    'HS'
);


--
-- Name: matieres_soussysteme_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.matieres_soussysteme_enum AS ENUM (
    'FRANCOPHONE',
    'ANGLOPHONE',
    'BICULTUREL'
);


--
-- Name: menus_cantine_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.menus_cantine_statut_enum AS ENUM (
    'DISPONIBLE',
    'EPUISE',
    'ANNULE',
    'CONSOMME'
);


--
-- Name: message_reactions_emoji_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_reactions_emoji_enum AS ENUM (
    'like',
    'love',
    'rire',
    'triste',
    'colere',
    'pouce_haut'
);


--
-- Name: modeles_documents_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.modeles_documents_type_enum AS ENUM (
    'BULLETIN',
    'CERTIFICAT',
    'CARTE_SCOLAIRE',
    'ATTESTATION',
    'RAPPORT',
    'FORMULAIRE',
    'RECUPAIEMENT',
    'AUTRE'
);


--
-- Name: niveaux_soussysteme_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.niveaux_soussysteme_enum AS ENUM (
    'FRANCOPHONE',
    'ANGLOPHONE',
    'BICULTUREL'
);


--
-- Name: notes_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notes_statut_enum AS ENUM (
    'BROUILLON',
    'VALIDEE',
    'PUBLIEE'
);


--
-- Name: notes_typeevaluation_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notes_typeevaluation_enum AS ENUM (
    'DEVOIR',
    'INTERROGATION',
    'EXAMEN',
    'PROJET',
    'PARTICIPATION',
    'AUTRE'
);


--
-- Name: notification_providers_service_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_providers_service_enum AS ENUM (
    'nodemailer',
    'sendgrid',
    'mailgun',
    'aws-ses',
    'twilio',
    'vonage',
    'africas-talking',
    'ovh-sms',
    'firebase-fcm',
    'onesignal',
    'in-app'
);


--
-- Name: notification_providers_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_providers_type_enum AS ENUM (
    'PUSH',
    'EMAIL',
    'IN_APP',
    'SMS'
);


--
-- Name: notifications_priorite_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notifications_priorite_enum AS ENUM (
    'BASSE',
    'NORMALE',
    'HAUTE',
    'URGENTE'
);


--
-- Name: notifications_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notifications_statut_enum AS ENUM (
    'EN_ATTENTE',
    'ENVOYEE',
    'LUE',
    'ECHEC'
);


--
-- Name: notifications_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notifications_type_enum AS ENUM (
    'PUSH',
    'EMAIL',
    'IN_APP',
    'SMS'
);


--
-- Name: organisations_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.organisations_type_enum AS ENUM (
    'ETABLISSEMENT_SCOLAIRE',
    'GROUPE_SCOLAIRE',
    'ENTREPRISE',
    'ASSOCIATION'
);


--
-- Name: paiements_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.paiements_statut_enum AS ENUM (
    'EN_ATTENTE',
    'PAYE',
    'PARTIELLEMENT_PAYE',
    'ANNULE',
    'REMBOURSE'
);


--
-- Name: paiements_typepaiement_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.paiements_typepaiement_enum AS ENUM (
    'SCOLARITE',
    'INSCRIPTION',
    'CANTINE',
    'TRANSPORT',
    'CLUB',
    'AUTRE'
);


--
-- Name: parametres_systeme_categorie_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.parametres_systeme_categorie_enum AS ENUM (
    'SYSTEME',
    'SECURITE',
    'ETABLISSEMENT',
    'MODULE',
    'THEME',
    'NOTIFICATION',
    'REGIONAL',
    'CUSTOM'
);


--
-- Name: parametres_systeme_typevaleur_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.parametres_systeme_typevaleur_enum AS ENUM (
    'STRING',
    'NUMBER',
    'BOOLEAN',
    'JSON',
    'ARRAY'
);


--
-- Name: postes_niveauresponsabilite_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.postes_niveauresponsabilite_enum AS ENUM (
    'DIRECTION_GENERALE',
    'DIRECTION_ADJOINTE',
    'RESPONSABLE',
    'COORDINATEUR',
    'SUPERVISEUR',
    'EXECUTANT',
    'STAGIAIRE'
);


--
-- Name: postes_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.postes_statut_enum AS ENUM (
    'ACTIF',
    'VACANT',
    'SUPPRIME',
    'EN_ATTENTE'
);


--
-- Name: postes_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.postes_type_enum AS ENUM (
    'DIRECTION',
    'ENSEIGNANT',
    'ADMINISTRATIF',
    'TECHNIQUE',
    'SERVICE',
    'STAGE',
    'TEMPORAIRE',
    'AUTRE'
);


--
-- Name: preferences_utilisateur_categorie_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.preferences_utilisateur_categorie_enum AS ENUM (
    'AFFICHAGE',
    'NOTIFICATIONS',
    'LANGUE',
    'ACCESSIBILITE',
    'MESSAGERIE',
    'TABLEAU_BORD',
    'SECURITE',
    'PERSONNALISATION'
);


--
-- Name: profils_utilisateurs_genre_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.profils_utilisateurs_genre_enum AS ENUM (
    'M',
    'F',
    'A'
);


--
-- Name: regles_scoring_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.regles_scoring_type_enum AS ENUM (
    'ACADEMIQUE',
    'COMPORTEMENT',
    'ASSIDUITE',
    'PARTICIPATION',
    'GLOBAL'
);


--
-- Name: relances_paiement_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.relances_paiement_statut_enum AS ENUM (
    'ENVOYEE',
    'LUE',
    'IGNOREE',
    'PAYE_APRES'
);


--
-- Name: relances_paiement_typerelance_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.relances_paiement_typerelance_enum AS ENUM (
    'SMS',
    'EMAIL',
    'LETTER',
    'PHONE'
);


--
-- Name: remises_typeremise_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.remises_typeremise_enum AS ENUM (
    'FRATRIE',
    'BOURSE',
    'PERSONNEL',
    'ANTICIPE',
    'AUTRE'
);


--
-- Name: requetes_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.requetes_statut_enum AS ENUM (
    'EN_ATTENTE',
    'EN_COURS',
    'APPROUVEE',
    'REJETEE',
    'ANNULEE'
);


--
-- Name: requetes_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.requetes_type_enum AS ENUM (
    'CONGE',
    'CERTIFICAT',
    'ATTESTATION',
    'MATERIEL',
    'AUTRE'
);


--
-- Name: role_limitations_etablissements_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role_limitations_etablissements_role_enum AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'CHEF_ETABLISSEMENT',
    'ENSEIGNANT',
    'PERSONNEL',
    'RESPONSABLE_CANTINE',
    'RESPONSABLE_TRANSPORT',
    'RESPONSABLE_INFRASTRUCTURE',
    'PARENT',
    'ELEVE',
    'PROVISEUR',
    'PRINCIPAL',
    'DIRECTEUR',
    'CENSEUR',
    'DIRECTEUR_ADJOINT',
    'RESPONSABLE_PEDAGOGIQUE',
    'PROFESSEUR_CERTIFIE',
    'PROFESSEUR_AGREGE',
    'INSTITUTEUR',
    'MAITRE_AUXILIAIRE',
    'PROFESSEUR_TECHNIQUE',
    'EDUCATEUR_MATERNELLE',
    'PROFESSEUR_PRINCIPAL',
    'COORDINATEUR_DISCIPLINE',
    'PROFESSEUR_SPECIAL',
    'PROFESSEUR_LANGUES',
    'CONSEILLER_ORIENTEUR',
    'PSYCHOLOGUE_SCOLAIRE',
    'ASSISTANT_SOCIAL',
    'MEDECIN_SCOLAIRE',
    'SECRETAIRE_DIRECTION',
    'COMPTABLE',
    'GESTIONNAIRE',
    'BIBLIOTHECAIRE',
    'DOCUMENTALISTE',
    'ARCHIVISTE',
    'ACCUEIL_STANDARD',
    'TECHNICIEN_LABO',
    'TECHNICIEN_INFO',
    'CONSEILLER_TIC',
    'AIDE_EDUCATEUR',
    'ANIMATEUR_TICE',
    'SURVEILLANT_GENERAL',
    'SURVEILLANT',
    'MAITRE_INTERNAT',
    'CONSEILLER_VIE_SCOLAIRE',
    'INFIRMIER_SCOLAIRE',
    'NUTRITIONNISTE',
    'KINESITHERAPEUTE',
    'CUISINIER',
    'CHAUFFEUR',
    'AGENT_ENTRETIEN',
    'COORDINATEUR_CLUBS',
    'ENTRAINEUR_SPORTIF',
    'ANIMATEUR_CULTUREL',
    'COORDINATEUR_EXAMEN',
    'RESPONSABLE_BOURSES',
    'AUDITEUR_INTERNE',
    'STATISTICIEN',
    'CHARGE_COMMUNICATION'
);


--
-- Name: scores_eleves_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.scores_eleves_type_enum AS ENUM (
    'ACADEMIQUE',
    'COMPORTEMENT',
    'ASSIDUITE',
    'PARTICIPATION',
    'GLOBAL'
);


--
-- Name: templates_message_categorie_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.templates_message_categorie_enum AS ENUM (
    'absence',
    'retard',
    'discipline',
    'info_generale',
    'convocation'
);


--
-- Name: unites_organisationnelles_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.unites_organisationnelles_type_enum AS ENUM (
    'DIRECTION',
    'DEPARTEMENT',
    'SERVICE',
    'POLE',
    'FILIERE',
    'CYCLE',
    'SECTION',
    'COMMISSION',
    'EQUIPE',
    'AUTRE'
);


--
-- Name: utilisateur_permissions_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.utilisateur_permissions_type_enum AS ENUM (
    'GRANTED',
    'DENIED'
);


--
-- Name: utilisateurs_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.utilisateurs_role_enum AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'CHEF_ETABLISSEMENT',
    'ENSEIGNANT',
    'PERSONNEL',
    'RESPONSABLE_CANTINE',
    'RESPONSABLE_TRANSPORT',
    'RESPONSABLE_INFRASTRUCTURE',
    'PARENT',
    'ELEVE',
    'PROVISEUR',
    'PRINCIPAL',
    'DIRECTEUR',
    'CENSEUR',
    'DIRECTEUR_ADJOINT',
    'RESPONSABLE_PEDAGOGIQUE',
    'PROFESSEUR_CERTIFIE',
    'PROFESSEUR_AGREGE',
    'INSTITUTEUR',
    'MAITRE_AUXILIAIRE',
    'PROFESSEUR_TECHNIQUE',
    'EDUCATEUR_MATERNELLE',
    'PROFESSEUR_PRINCIPAL',
    'COORDINATEUR_DISCIPLINE',
    'PROFESSEUR_SPECIAL',
    'PROFESSEUR_LANGUES',
    'CONSEILLER_ORIENTEUR',
    'PSYCHOLOGUE_SCOLAIRE',
    'ASSISTANT_SOCIAL',
    'MEDECIN_SCOLAIRE',
    'SECRETAIRE_DIRECTION',
    'COMPTABLE',
    'GESTIONNAIRE',
    'BIBLIOTHECAIRE',
    'DOCUMENTALISTE',
    'ARCHIVISTE',
    'ACCUEIL_STANDARD',
    'TECHNICIEN_LABO',
    'TECHNICIEN_INFO',
    'CONSEILLER_TIC',
    'AIDE_EDUCATEUR',
    'ANIMATEUR_TICE',
    'SURVEILLANT_GENERAL',
    'SURVEILLANT',
    'MAITRE_INTERNAT',
    'CONSEILLER_VIE_SCOLAIRE',
    'INFIRMIER_SCOLAIRE',
    'NUTRITIONNISTE',
    'KINESITHERAPEUTE',
    'CUISINIER',
    'CHAUFFEUR',
    'AGENT_ENTRETIEN',
    'COORDINATEUR_CLUBS',
    'ENTRAINEUR_SPORTIF',
    'ANIMATEUR_CULTUREL',
    'COORDINATEUR_EXAMEN',
    'RESPONSABLE_BOURSES',
    'AUDITEUR_INTERNE',
    'STATISTICIEN',
    'CHARGE_COMMUNICATION'
);


--
-- Name: utilisateurs_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.utilisateurs_statut_enum AS ENUM (
    'ACTIF',
    'INACTIF',
    'SUSPENDU',
    'EN_ATTENTE_VALIDATION'
);


--
-- Name: workflows_validation_statut_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.workflows_validation_statut_enum AS ENUM (
    'EN_COURS',
    'COMPLETEE',
    'REJETEE',
    'ANNULEE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: abonnements_parking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.abonnements_parking (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "titulaireId" uuid NOT NULL,
    "vehiculeId" uuid NOT NULL,
    "dateDebut" date NOT NULL,
    "dateFin" date NOT NULL,
    tarif numeric(10,2) NOT NULL,
    statut character varying(20) DEFAULT 'actif'::character varying NOT NULL,
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: absences_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.absences_personnel (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "membrePersonnelId" uuid NOT NULL,
    date date NOT NULL,
    type character varying(50) NOT NULL,
    "statutJustification" character varying(30) DEFAULT 'NON_JUSTIFIE'::character varying NOT NULL,
    "heureDebut" time without time zone,
    "heureFin" time without time zone,
    motif text,
    justification text,
    "justificatifUrl" character varying(200),
    "valideParId" uuid,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: affectations_eleves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affectations_eleves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "classeId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "dateAffectation" date NOT NULL,
    "dateSortie" date,
    "motifChangement" character varying(100),
    commentaire text,
    actif boolean DEFAULT true NOT NULL,
    statut character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: affectations_matieres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affectations_matieres (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "matiereId" uuid NOT NULL,
    "classeId" uuid NOT NULL,
    "enseignantId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "volumeHoraireHebdo" integer,
    coefficient double precision,
    statut character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "etablissementId" uuid NOT NULL
);


--
-- Name: COLUMN affectations_matieres."etablissementId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.affectations_matieres."etablissementId" IS 'Établissement de l''affectation (multi-tenant) - doit correspondre à classe.etablissementId';


--
-- Name: affectations_postes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.affectations_postes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "membrePersonnelId" uuid NOT NULL,
    "posteId" uuid NOT NULL,
    "contratId" uuid,
    "uniteOrganisationnelleId" uuid,
    "dateDebut" timestamp without time zone DEFAULT now() NOT NULL,
    "dateFin" timestamp without time zone,
    statut character varying(30) DEFAULT 'ACTIF'::character varying NOT NULL,
    "typeMutation" character varying(30) DEFAULT 'NOUVELLE'::character varying NOT NULL,
    "salaireAssocie" numeric(12,0),
    commentaire text,
    "valideParId" uuid,
    "dateValidation" timestamp without time zone,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: annees_scolaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annees_scolaires (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    libelle character varying(50) NOT NULL,
    "dateDebut" date NOT NULL,
    "dateFin" date NOT NULL,
    "enCours" boolean DEFAULT false NOT NULL,
    cloturee boolean DEFAULT false NOT NULL,
    statut character varying(30) DEFAULT 'OUVERTE'::character varying NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: annonce_ciblages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annonce_ciblages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "annonceId" uuid NOT NULL,
    "typeCible" character varying(30) NOT NULL,
    "cibleId" character varying(100) NOT NULL,
    "cibleValeur" character varying(200),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: annonces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annonces (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titre character varying(200) NOT NULL,
    contenu text NOT NULL,
    "typeContenu" character varying(20) DEFAULT 'texte'::character varying NOT NULL,
    priorite integer DEFAULT 0 NOT NULL,
    statut character varying(20) DEFAULT 'brouillon'::character varying NOT NULL,
    validation character varying(30) DEFAULT 'brouillon'::character varying NOT NULL,
    "dateDebut" timestamp with time zone NOT NULL,
    "dateFin" timestamp with time zone NOT NULL,
    "dateValidation" timestamp with time zone,
    "validePar" uuid,
    "motifRejet" character varying(500),
    "cibleGlobale" boolean DEFAULT false NOT NULL,
    "ordreAffichage" integer DEFAULT 0 NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdBy" uuid NOT NULL,
    "updatedBy" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid,
    action public.audit_logs_action_enum NOT NULL,
    severity public.audit_logs_severity_enum DEFAULT 'INFO'::public.audit_logs_severity_enum NOT NULL,
    cible character varying(100),
    "cibleId" uuid,
    description text,
    "anciennesValeurs" text,
    "nouvellesValeurs" text,
    "ipAddress" character varying(45),
    "userAgent" text,
    module character varying(100),
    "estEchec" boolean DEFAULT false NOT NULL,
    erreur text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: backup_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "etablissementId" uuid,
    "backupType" public.backup_records_backuptype_enum NOT NULL,
    version character varying(100) NOT NULL,
    checksum character varying(64) NOT NULL,
    "storageProvider" public.backup_records_storageprovider_enum DEFAULT 'database'::public.backup_records_storageprovider_enum NOT NULL,
    "storageKey" character varying(500) NOT NULL,
    encrypted boolean DEFAULT false NOT NULL,
    compressed boolean DEFAULT false NOT NULL,
    "sizeBytes" bigint,
    metadata jsonb,
    "retentionUntil" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp without time zone
);


--
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(100) NOT NULL,
    nom character varying(255) NOT NULL,
    description text,
    icone character varying(500),
    "pointsRequis" integer DEFAULT 0 NOT NULL,
    categorie character varying(50),
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: badges_utilisateurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges_utilisateurs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    "badgeId" uuid NOT NULL,
    "obtenuAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: bons_commande; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bons_commande (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "numeroBon" character varying(50) NOT NULL,
    "demandeurId" uuid NOT NULL,
    fournisseur character varying(150) NOT NULL,
    "dateCommande" date NOT NULL,
    "dateLivraisonPrevue" date,
    "montantTotal" numeric(12,2) NOT NULL,
    articles text NOT NULL,
    statut public.bons_commande_statut_enum DEFAULT 'BROUILLON'::public.bons_commande_statut_enum NOT NULL,
    "depenseId" uuid,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budgets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(20) NOT NULL,
    libelle character varying(255) NOT NULL,
    "anneeDebut" date NOT NULL,
    "anneeFin" date NOT NULL,
    "montantTotalPrevu" numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    "montantTotalEngage" numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    "montantTotalConsomme" numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    statut character varying(30) DEFAULT 'BROUILLON'::character varying NOT NULL,
    observations text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: bulletins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bulletins (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "classeId" uuid NOT NULL,
    "periodeId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "moyenneGenerale" double precision DEFAULT '0'::double precision NOT NULL,
    "moyenneClasse" double precision,
    "moyenneMin" double precision,
    "moyenneMax" double precision,
    rang integer,
    "appreciationConseil" text,
    sanctions text,
    encouragements text,
    publie boolean DEFAULT false NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: bulletins_matieres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bulletins_matieres (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "bulletinId" uuid NOT NULL,
    "matiereId" uuid NOT NULL,
    moyenne double precision DEFAULT '0'::double precision NOT NULL,
    coefficient double precision DEFAULT '1'::double precision NOT NULL,
    "rangMatiere" integer,
    "moyenneMinClasse" double precision,
    "moyenneMaxClasse" double precision,
    "moyenneClasse" double precision,
    appreciation character varying(500),
    "nombreNotes" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: bulletins_paie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bulletins_paie (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "membrePersonnelId" uuid NOT NULL,
    "contratId" uuid NOT NULL,
    mois integer NOT NULL,
    annee integer NOT NULL,
    "salaireBase" numeric(12,2) NOT NULL,
    "heuresEffectuees" numeric(10,2) NOT NULL,
    "montantHeuresSup" numeric(10,2) NOT NULL,
    primes numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    deductions numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "salaireNet" numeric(12,2) NOT NULL,
    statut character varying(30) DEFAULT 'GENERE'::character varying NOT NULL,
    "datePaiement" date,
    notes text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: bulletins_workflow; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bulletins_workflow (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "bulletinId" uuid NOT NULL,
    "statutValidation" public.bulletins_workflow_statutvalidation_enum DEFAULT 'BROUILLON'::public.bulletins_workflow_statutvalidation_enum NOT NULL,
    "niveauValidationActuel" integer DEFAULT 0 NOT NULL,
    "niveauxRequis" integer DEFAULT 2 NOT NULL,
    "validateurId" uuid,
    "dateValidation" timestamp without time zone,
    "datePublication" timestamp without time zone,
    "commentaireValidation" text,
    "historiqueValidation" text
);


--
-- Name: candidatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidatures (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "offreEmploiId" uuid NOT NULL,
    "nomComplet" character varying(200) NOT NULL,
    email character varying(150) NOT NULL,
    telephone character varying(20),
    "cvUrl" text,
    "lettreMotivationUrl" text,
    "portfolioUrl" text,
    "niveauEtude" character varying(100),
    "anneesExperience" integer,
    competences text,
    commentaires text,
    statut character varying(30) DEFAULT 'RECUE'::character varying NOT NULL,
    "noteEvaluation" numeric(5,2),
    "evaluationCommentaire" text,
    "examineParId" uuid,
    "membrePersonnelId" uuid,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: cartes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cartes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    type public.cartes_type_enum NOT NULL,
    "numeroCarte" character varying(50) NOT NULL,
    "qrCode" text,
    statut character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    "dateExpiration" date,
    "photoUrl" character varying(500),
    "etablissementNom" character varying(255),
    "raisonDesactivation" text,
    metadata text,
    "modeleCarteId" uuid,
    "categorieTitulaire" character varying(20),
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: categories_depense; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories_depense (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(10) NOT NULL,
    libelle character varying(100) NOT NULL,
    type public.categories_depense_type_enum NOT NULL,
    "compteComptableCharge" character varying(6) NOT NULL,
    "compteComptableTVA" character varying(6) DEFAULT '445660'::character varying NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "budgetAnnuel" numeric(12,2),
    "responsableId" uuid,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    code character varying(50),
    "niveauId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "professeurPrincipalId" uuid,
    "filiereId" uuid,
    "effectifMax" integer DEFAULT 50 NOT NULL,
    "effectifActuel" integer DEFAULT 0 NOT NULL,
    "typeClasse" character varying(20) DEFAULT 'NORMALE'::character varying NOT NULL,
    "creneauHoraire" character varying(20) DEFAULT 'MATIN'::character varying NOT NULL,
    description text,
    actif boolean DEFAULT true NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: clubs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clubs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    description text,
    "responsableId" uuid,
    budget numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    horaires character varying(50),
    lieu character varying(100),
    "capaciteMax" integer,
    actif boolean DEFAULT true NOT NULL,
    statut character varying(30) DEFAULT 'ACTIF'::character varying NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: competences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    libelle character varying(200) NOT NULL,
    description text,
    domaine character varying(100) NOT NULL,
    "niveauId" uuid NOT NULL,
    "matiereId" uuid,
    "etablissementId" uuid NOT NULL,
    ordre integer DEFAULT 1 NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: comptes_bancaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comptes_bancaires (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(10) NOT NULL,
    libelle character varying(100) NOT NULL,
    banque character varying(50) NOT NULL,
    "numeroCompte" character varying(50) NOT NULL,
    type character varying(30) DEFAULT 'COURANT'::character varying NOT NULL,
    "soldeActuel" numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    "soldeInitial" numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    "decouvertAutorise" numeric(15,2),
    actif boolean DEFAULT true NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: comptes_caisse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comptes_caisse (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(10) NOT NULL,
    libelle character varying(100) NOT NULL,
    type character varying(30) DEFAULT 'PRINCIPALE'::character varying NOT NULL,
    "soldeActuel" numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    "soldeInitial" numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    "seuilAlerte" numeric(15,2),
    actif boolean DEFAULT true NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: configuration_app; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuration_app (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "nomEtablissement" character varying(255) NOT NULL,
    "typeEtablissement" character varying(100),
    "adresseEtablissement" text,
    "villeEtablissement" character varying(100),
    "paysEtablissement" character varying(100),
    "telephoneEtablissement" character varying(20),
    "emailEtablissement" character varying(255),
    "siteWebEtablissement" character varying(255),
    "numeroAdministratif" character varying(100),
    "sloganEtablissement" character varying(255),
    "logoUrl" character varying(500),
    "messageAccueil" text,
    "langueDefaut" character varying(10) DEFAULT 'fr'::character varying NOT NULL,
    devise character varying(10) DEFAULT 'XOF'::character varying NOT NULL,
    "fuseauHoraire" character varying(50) DEFAULT 'Africa/Douala'::character varying NOT NULL,
    "couleurPrimaire" character varying(10) DEFAULT '#28a745'::character varying NOT NULL,
    "couleurSecondaire" character varying(10) DEFAULT '#ffc107'::character varying NOT NULL,
    "couleurAccent" character varying(10) DEFAULT '#007bff'::character varying NOT NULL,
    theme character varying(20) DEFAULT 'default'::character varying NOT NULL,
    "licenceKey" character varying(255),
    "licenceExpiration" timestamp without time zone,
    "licenceActive" boolean DEFAULT false NOT NULL,
    "modulesActifs" text DEFAULT '{}'::text NOT NULL,
    "valeurDefaut" text,
    version character varying(20) DEFAULT '1.0.0'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: configuration_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuration_modules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "moduleNom" character varying(100) NOT NULL,
    "etablissementId" uuid,
    "champsPersonnalises" text DEFAULT '[]'::text NOT NULL,
    widgets text DEFAULT '[]'::text NOT NULL,
    parametres text DEFAULT '{}'::text NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "valeurDefaut" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: consommations_cantine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consommations_cantine (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "inscriptionId" uuid NOT NULL,
    "menuId" uuid NOT NULL,
    montant numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    date timestamp without time zone DEFAULT now() NOT NULL,
    statut public.consommations_cantine_statut_enum DEFAULT 'CONSOMME'::public.consommations_cantine_statut_enum NOT NULL,
    paye boolean DEFAULT false NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: consultations_medicales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultations_medicales (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "dossierMedicalId" uuid NOT NULL,
    "consultantId" uuid NOT NULL,
    "dateConsultation" timestamp without time zone NOT NULL,
    type character varying(20) NOT NULL,
    statut character varying(20) DEFAULT 'TERMINEE'::character varying NOT NULL,
    motif text NOT NULL,
    diagnostic text,
    traitement text,
    observations text,
    temperature numeric(4,1),
    "tensionArterielle" numeric(5,1),
    "frequenceCardiaque" integer,
    poids numeric(5,2),
    taille numeric(5,2),
    "signaleParent" boolean DEFAULT false NOT NULL,
    "etablissementId" uuid NOT NULL,
    "periodeId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: contrats_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contrats_personnel (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "membrePersonnelId" uuid NOT NULL,
    "typeContrat" character varying(50) NOT NULL,
    "typeContratId" uuid,
    "posteId" uuid,
    "uniteOrganisationnelleId" uuid,
    "dateDebut" date NOT NULL,
    "dateFin" date,
    "salaireBase" numeric(12,0) NOT NULL,
    "tarifHoraire" numeric(10,0),
    statut character varying(30) DEFAULT 'ACTIF'::character varying NOT NULL,
    "renouvellementAuto" boolean DEFAULT false NOT NULL,
    clauses text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    titre character varying(255),
    type public.conversations_type_enum DEFAULT 'INDIVIDUELLE'::public.conversations_type_enum NOT NULL,
    "createurId" uuid,
    "etablissementId" uuid NOT NULL,
    "entiteLieeType" character varying(50),
    "entiteLieeId" uuid,
    actif boolean DEFAULT true NOT NULL,
    archive boolean DEFAULT false NOT NULL,
    "dateArchive" timestamp without time zone,
    "dernierMessageId" uuid,
    "countMessages" integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: cotisations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cotisations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(20) NOT NULL,
    nom character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    "tauxPatronal" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    "tauxSalarial" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    plafond numeric(12,2),
    description text,
    "etablissementId" uuid NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cycles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    ordre integer DEFAULT 0 NOT NULL,
    dureeannees integer DEFAULT 0 NOT NULL,
    diplomesanctionnant character varying(50),
    actif boolean DEFAULT true NOT NULL,
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: dashboard_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_config (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    layout jsonb DEFAULT '[]'::jsonb NOT NULL,
    "widgetsActifs" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "widgetsMasques" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "widgetConfig" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "themeDashboard" character varying(50) DEFAULT 'default'::character varying NOT NULL,
    "nombreColonnes" integer DEFAULT 3 NOT NULL,
    "tailleCartes" character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    "triParDefaut" character varying(30) DEFAULT 'personnalise'::character varying NOT NULL,
    "afficherStatsRapides" boolean DEFAULT true NOT NULL,
    "afficherNotificationsRecents" boolean DEFAULT true NOT NULL,
    "nombreNotifications" integer DEFAULT 5 NOT NULL,
    "refreshInterval" integer DEFAULT 60 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: dashboard_layouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_layouts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    "etablissementId" uuid,
    nom character varying(100) NOT NULL,
    widgets text DEFAULT '[]'::text NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: demandes_depense; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demandes_depense (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "demandeurId" uuid NOT NULL,
    "categorieDepenseId" uuid NOT NULL,
    libelle character varying(255) NOT NULL,
    "montantEstime" numeric(12,2) NOT NULL,
    urgence public.demandes_depense_urgence_enum DEFAULT 'MOYENNE'::public.demandes_depense_urgence_enum NOT NULL,
    justification text NOT NULL,
    statut public.demandes_depense_statut_enum DEFAULT 'BROUILLON'::public.demandes_depense_statut_enum NOT NULL,
    "validePar" uuid,
    "dateValidation" timestamp without time zone,
    "motifRejet" text,
    "depenseId" uuid,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: depenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.depenses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "categorieDepenseId" uuid NOT NULL,
    "numeroPiece" character varying(50) NOT NULL,
    libelle character varying(255) NOT NULL,
    "montantHT" numeric(12,2) NOT NULL,
    tva numeric(5,2) DEFAULT 19.25 NOT NULL,
    "montantTTC" numeric(12,2) NOT NULL,
    "montantPaye" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "dateFacture" date NOT NULL,
    "dateEcheance" date,
    "datePaiement" timestamp without time zone,
    fournisseur character varying(150) NOT NULL,
    "referenceFacture" character varying(100),
    "justificatifPath" character varying(500),
    "methodePaiement" character varying(30) NOT NULL,
    "referenceTransaction" character varying(100),
    statut public.depenses_statut_enum DEFAULT 'BROUILLON'::public.depenses_statut_enum NOT NULL,
    "niveauValidation" integer DEFAULT 0 NOT NULL,
    "demandeePar" uuid,
    "effectuePar" uuid NOT NULL,
    "validePar" uuid,
    "exerciceComptable" integer NOT NULL,
    "periodeComptable" integer NOT NULL,
    observations text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: diplomes_eleves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diplomes_eleves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "examenNationalId" uuid NOT NULL,
    "noteObtenue" numeric(5,2),
    mention character varying(50),
    resultat character varying(20) NOT NULL,
    "dateObtention" date NOT NULL,
    "numeroDiplome" character varying(100),
    observations text,
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: dossiers_medicaux; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dossiers_medicaux (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "patientId" uuid NOT NULL,
    "typePatient" character varying(20) NOT NULL,
    "eleveId" uuid,
    "personnelId" uuid,
    "groupeSanguin" character varying(5),
    "allergiesConnues" text,
    "antecedentsMedicaux" text,
    "traitementsEnCours" text,
    handicaps text,
    "contraintesSpeciales" text,
    "medecinTraitant" character varying(200),
    "telephoneMedecin" character varying(50),
    "assuranceMaladie" character varying(200),
    "numeroAssurance" character varying(50),
    "etablissementId" uuid NOT NULL,
    "periodeId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: echeanciers_paiement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echeanciers_paiement (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "fraisScolariteId" uuid NOT NULL,
    "numeroTranche" integer NOT NULL,
    "montantAttendu" numeric(12,2) NOT NULL,
    "dateEcheance" date NOT NULL,
    "montantPaye" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    statut public.echeanciers_paiement_statut_enum DEFAULT 'EN_ATTENTE'::public.echeanciers_paiement_statut_enum NOT NULL,
    "datePaiementReel" timestamp without time zone,
    "penaliteAppliquee" numeric(12,2),
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: ecritures_comptables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecritures_comptables (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "numeroPiece" character varying(20) NOT NULL,
    "dateEcriture" date NOT NULL,
    libelle character varying(255) NOT NULL,
    "compteDebit" character varying(6) NOT NULL,
    "compteCredit" character varying(6) NOT NULL,
    "montantDebit" numeric(15,2) NOT NULL,
    "montantCredit" numeric(15,2) NOT NULL,
    type character varying(20) DEFAULT 'PAIEMENT'::character varying NOT NULL,
    statut character varying(30) DEFAULT 'BROUILLON'::character varying NOT NULL,
    "referenceExterne" character varying(255),
    observations text,
    "utilisateurId" uuid,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: elements_salaire; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.elements_salaire (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "bulletinPaieId" uuid NOT NULL,
    type character varying(20) NOT NULL,
    categorie character varying(50) NOT NULL,
    libelle character varying(200) NOT NULL,
    montant numeric(12,2) NOT NULL,
    "baseCalcul" numeric(12,2),
    taux numeric(5,2),
    "ordreAffichage" integer DEFAULT 0 NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: eleves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eleves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    matricule character varying(50) NOT NULL,
    "dateNaissance" date NOT NULL,
    "lieuNaissance" character varying(100) NOT NULL,
    sexe character varying(1) NOT NULL,
    nationalite character varying(100),
    "sousSysteme" public.eleves_soussysteme_enum DEFAULT 'FRANCOPHONE'::public.eleves_soussysteme_enum NOT NULL,
    "nomPere" character varying(150),
    "professionPere" character varying(150),
    "telephonePere" character varying(20),
    "emailPere" character varying(150),
    "adressePere" character varying(300),
    "nomMere" character varying(150),
    "professionMere" character varying(150),
    "telephoneMere" character varying(20),
    "emailMere" character varying(150),
    "adresseMere" character varying(300),
    "nomTuteur" character varying(150),
    "lienParenteTuteur" character varying(50),
    "professionTuteur" character varying(150),
    "telephoneTuteur" character varying(20),
    "emailTuteur" character varying(150),
    "adresseTuteur" character varying(300),
    "dateInscription" date NOT NULL,
    photo character varying(500),
    "groupeSanguin" character varying(5),
    allergies text,
    "nomContactUrgence" character varying(200),
    "telephoneContactUrgence" character varying(20),
    "adresseDomicile" text,
    ville character varying(100),
    quartier character varying(100),
    "ecoleProvenance" character varying(200),
    "classeAnterieure" character varying(100),
    redoublement boolean DEFAULT false NOT NULL,
    boursier boolean DEFAULT false NOT NULL,
    "regimeInterne" boolean DEFAULT false NOT NULL,
    "emailPrincipal" character varying(150),
    "transportScolaire" boolean DEFAULT false NOT NULL,
    cantine boolean DEFAULT false NOT NULL,
    "situationFamiliale" character varying(50),
    "personneAutorisee" character varying(300),
    statut character varying(30) DEFAULT 'ACTIF'::character varying NOT NULL,
    "etatDossier" character varying(20) DEFAULT 'INCOMPLET'::character varying NOT NULL,
    "typeInscription" character varying(20),
    "etatInscription" character varying(30) DEFAULT 'COMPLET'::character varying NOT NULL,
    "estPreinscription" boolean DEFAULT false NOT NULL,
    "documentsJustificatifs" text,
    "classeSouhaiteeId" uuid,
    "commentaireRefus" text,
    "dateTraitementInscription" timestamp without time zone,
    "traitePar" uuid,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: emploi_du_temps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emploi_du_temps (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "classeId" uuid NOT NULL,
    "matiereId" uuid NOT NULL,
    "enseignantId" uuid NOT NULL,
    "salleId" uuid,
    jour character varying(20) NOT NULL,
    "heureDebut" time without time zone NOT NULL,
    "heureFin" time without time zone NOT NULL,
    "typeCreneau" character varying(20) DEFAULT 'COURS'::character varying NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    couleur character varying(7),
    actif boolean DEFAULT true NOT NULL,
    "genereAutomatiquement" boolean DEFAULT false NOT NULL,
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: entretiens_recrutement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entretiens_recrutement (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "candidatureId" uuid NOT NULL,
    "offreEmploiId" uuid NOT NULL,
    type character varying(30) NOT NULL,
    "dateEntretien" timestamp with time zone NOT NULL,
    "heureDebut" time without time zone,
    "heureFin" time without time zone,
    lieu character varying(200),
    "lienVideoconference" text,
    "grilleEvaluation" text,
    "compteRendu" text,
    note numeric(5,2),
    "pointsFort" text,
    "pointsAmeliorer" text,
    decision text,
    statut character varying(30) DEFAULT 'PLANIFIE'::character varying NOT NULL,
    "evaluateurId" uuid,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: etablissement_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.etablissement_config (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "etablissementId" uuid NOT NULL,
    "cyclesActifs" text DEFAULT ''::text NOT NULL,
    "configurationBulletin" text,
    "maxEleves" integer,
    "maxUtilisateurs" integer,
    "maxClasses" integer,
    "stockageMaxMB" integer,
    "dateExpirationAbonnement" timestamp without time zone,
    "planAbonnement" character varying(50) DEFAULT 'gratuit'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: etablissements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.etablissements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    slogan character varying(500),
    "sousSysteme" public.etablissements_soussysteme_enum DEFAULT 'FRANCOPHONE'::public.etablissements_soussysteme_enum NOT NULL,
    type public.etablissements_type_enum DEFAULT 'LAIC'::public.etablissements_type_enum NOT NULL,
    "numeroArrete" character varying(255),
    "contactEmail" character varying(255),
    "contactTelephone" character varying(255),
    adresse text,
    actif boolean DEFAULT true NOT NULL,
    statut character varying(30) DEFAULT 'ACTIF'::character varying NOT NULL,
    "codeEtablissement" character varying(50),
    "numeroContribuable" character varying(50),
    "numeroCompteBancaire" character varying(50),
    "siteWeb" character varying(255),
    facebook character varying(255),
    twitter character varying(255),
    "heuresOuverture" character varying(10),
    "heuresFermeture" character varying(10),
    "effectifMax" integer,
    "effectifActuel" integer DEFAULT 0 NOT NULL,
    "directeurNom" character varying(200),
    "directeurAdjointNom" character varying(200),
    "censeurNom" character varying(200),
    "surveillantGeneralNom" character varying(200),
    "couleurPrimaire" character varying(20),
    "couleurSecondaire" character varying(20),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "langueDefaut" character varying(10) DEFAULT 'fr'::character varying NOT NULL,
    devise character varying(10) DEFAULT 'XAF'::character varying NOT NULL,
    "fuseauHoraire" character varying(50) DEFAULT 'Africa/Douala'::character varying NOT NULL,
    "logoBase64" text,
    "logoType" character varying(10),
    "logoTaille" integer
);


--
-- Name: evaluations_competences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluations_competences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "noteId" uuid NOT NULL,
    "competenceId" uuid NOT NULL,
    "niveauMaitrise" character varying(20) NOT NULL,
    score double precision,
    observation text,
    "enProgression" boolean DEFAULT false NOT NULL,
    "dateEvaluation" date,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: evaluations_enseignants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluations_enseignants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "enseignantId" uuid NOT NULL,
    "evaluateurId" uuid NOT NULL,
    "dateEvaluation" date NOT NULL,
    categorie character varying(30) NOT NULL,
    note numeric(5,2) NOT NULL,
    commentaire text,
    "planAction" text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: evaluations_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluations_personnel (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "membrePersonnelId" uuid NOT NULL,
    "evaluateurId" uuid NOT NULL,
    periodicite character varying(20) NOT NULL,
    statut character varying(20) DEFAULT 'PLANIFIEE'::character varying NOT NULL,
    periode character varying(50) NOT NULL,
    "noteGlobale" numeric(5,2),
    "pointsFort" text,
    "pointsAmeliorer" text,
    objectifs text,
    commentaires text,
    "visibleConcerned" boolean DEFAULT false NOT NULL,
    "etablissementId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "periodeId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: evenements_clubs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evenements_clubs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "clubId" uuid NOT NULL,
    titre character varying(255) NOT NULL,
    description text,
    "dateDebut" timestamp without time zone NOT NULL,
    "dateFin" timestamp without time zone,
    lieu character varying(100),
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: examens_nationaux; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.examens_nationaux (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(150) NOT NULL,
    code character varying(50) NOT NULL,
    type character varying(30) NOT NULL,
    "niveauId" uuid NOT NULL,
    "dateProgrammation" date,
    coefficient numeric(5,2),
    "estObligatoire" boolean DEFAULT true NOT NULL,
    "diplomeDelivre" character varying(100),
    description text,
    soussysteme character varying(20) DEFAULT 'FRANCOPHONE'::character varying NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: factures_fournisseur; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factures_fournisseur (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "numeroFacture" character varying(100) NOT NULL,
    "depenseId" uuid,
    fournisseur character varying(150) NOT NULL,
    "dateFacture" date NOT NULL,
    "dateEcheance" date,
    "montantHT" numeric(12,2) NOT NULL,
    tva numeric(5,2) NOT NULL,
    "montantTTC" numeric(12,2) NOT NULL,
    "pdfPath" character varying(500),
    "saisiePar" uuid NOT NULL,
    "verifieePar" uuid,
    statut public.factures_fournisseur_statut_enum DEFAULT 'EN_ATTENTE'::public.factures_fournisseur_statut_enum NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: felicitations_eleves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.felicitations_eleves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    type character varying(40) NOT NULL,
    motif text NOT NULL,
    description text,
    "pointsBonus" integer DEFAULT 0 NOT NULL,
    "visibleBulletin" boolean DEFAULT true NOT NULL,
    "visibleParent" boolean DEFAULT true NOT NULL,
    "attribueParId" uuid NOT NULL,
    "etablissementId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "periodeId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fiches_metiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fiches_metiers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    description text NOT NULL,
    filiere public.fiches_metiers_filiere_enum NOT NULL,
    "competencesRequises" text,
    "formationsRecommandees" text,
    "salaireEstime" character varying(100),
    debouches character varying(100),
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: file_impressions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_impressions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    type public.file_impressions_type_enum NOT NULL,
    "modeleId" uuid,
    titre character varying(255) NOT NULL,
    donnees text,
    statut public.file_impressions_statut_enum DEFAULT 'EN_ATTENTE'::public.file_impressions_statut_enum NOT NULL,
    "fichierUrl" character varying(500),
    "nombreCopies" integer DEFAULT 1 NOT NULL,
    erreur text,
    "dateTraitement" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: filieres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.filieres (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    "cycleId" uuid NOT NULL,
    "etablissementId" uuid NOT NULL,
    soussysteme public.filieres_soussysteme_enum DEFAULT 'FRANCOPHONE'::public.filieres_soussysteme_enum NOT NULL,
    ordre integer DEFAULT 1 NOT NULL,
    "coefficientFrais" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fonds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fonds (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    description character varying(255),
    categorie character varying(50) NOT NULL,
    "cheminFichier" character varying(500) NOT NULL,
    url character varying(500),
    source character varying(20) DEFAULT 'catalogue'::character varying NOT NULL,
    "estActif" boolean DEFAULT true NOT NULL,
    "estSysteme" boolean DEFAULT false NOT NULL,
    "tailleFichier" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fonds_etablissement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fonds_etablissement (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "etablissementId" uuid NOT NULL,
    "fondId" uuid NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    ordre integer DEFAULT 0 NOT NULL,
    "dateAjout" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: frais_scolarite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.frais_scolarite (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "etablissementId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "niveauId" uuid NOT NULL,
    "cycleId" uuid,
    "filiereId" uuid,
    "classeId" uuid,
    "fraisInscription" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "fraisScolariteAnnuel" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "fraisCantineOptionnel" numeric(12,2),
    "fraisTransportOptionnel" numeric(12,2),
    "autresFrais" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "nombreTranches" integer DEFAULT 3 NOT NULL,
    "datePremiereEcheance" date NOT NULL,
    "frequenceEcheance" character varying(20) DEFAULT 'mensuel'::character varying NOT NULL,
    "penaliteRetard" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    "joursGrace" integer DEFAULT 15 NOT NULL,
    "remisesPossibles" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: groupe_admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groupe_admins (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "groupeId" uuid NOT NULL,
    "utilisateurId" uuid NOT NULL,
    "assignePar" uuid,
    date_assignation timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: groupe_etablissement_liens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groupe_etablissement_liens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "groupeId" uuid NOT NULL,
    "etablissementId" uuid NOT NULL,
    "ajoutePar" uuid,
    date_ajout timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: groupes_etablissements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groupes_etablissements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    description text,
    "proprietaireId" uuid NOT NULL,
    code character varying(50) NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    cree_at timestamp without time zone DEFAULT now() NOT NULL,
    maj_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: groupes_matieres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groupes_matieres (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    ordre integer DEFAULT 1 NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: heures_cours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.heures_cours (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "enseignantId" uuid NOT NULL,
    "classeId" uuid NOT NULL,
    "matiereId" uuid NOT NULL,
    "periodeId" uuid NOT NULL,
    "salleId" uuid,
    date date NOT NULL,
    "heureDebut" time without time zone NOT NULL,
    "heureFin" time without time zone NOT NULL,
    "statutEffectue" character varying(30) DEFAULT 'PLANIFIE'::character varying NOT NULL,
    "salleObsolète" character varying(100),
    commentaire text,
    "remplacantId" uuid,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hierarchie_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hierarchie_personnel (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "personnelId" uuid NOT NULL,
    "personnelNom" character varying(200) NOT NULL,
    "superieurId" uuid NOT NULL,
    "superieurNom" character varying(200) NOT NULL,
    "typeRelation" public.hierarchie_personnel_typerelation_enum DEFAULT 'SUPERVISE_DIRECT'::public.hierarchie_personnel_typerelation_enum NOT NULL,
    statut public.hierarchie_personnel_statut_enum DEFAULT 'ACTIVE'::public.hierarchie_personnel_statut_enum NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "posteId" uuid,
    "posteIntitule" character varying(100),
    "uniteOrganisationnelleId" uuid,
    "uniteNom" character varying(100),
    "etablissementId" uuid NOT NULL,
    "dateDebut" timestamp without time zone,
    "dateFin" timestamp without time zone,
    commentaire text,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: historique_configuration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historique_configuration (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid,
    action public.historique_configuration_action_enum NOT NULL,
    cible public.historique_configuration_cible_enum NOT NULL,
    "cibleId" character varying(255),
    "cibleNom" character varying(255),
    description text,
    "ancienneValeur" text,
    "nouvelleValeur" text,
    "ipAddress" character varying(45),
    restaurable boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: historique_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historique_points (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    points integer NOT NULL,
    action character varying(50) NOT NULL,
    description text,
    "sourceModule" character varying(50),
    "sourceId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: historique_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historique_scores (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    type public.historique_scores_type_enum NOT NULL,
    score numeric(5,2) NOT NULL,
    date date NOT NULL,
    raison character varying(255),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: historique_scores_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historique_scores_personnel (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "scorePersonnelId" uuid NOT NULL,
    "membrePersonnelId" uuid NOT NULL,
    "etablissementId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "periodeId" uuid,
    "typeModification" character varying(50) NOT NULL,
    "sourceModule" character varying(50),
    "sourceId" uuid,
    "pointsAnciens" integer DEFAULT 0 NOT NULL,
    "pointsNouveaux" integer NOT NULL,
    "pointsDelta" integer NOT NULL,
    "categorieScore" character varying(50),
    raison text,
    "declencheurAutomatique" boolean DEFAULT false NOT NULL,
    "utilisateurId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: incidents_eleves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidents_eleves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "declarantId" uuid NOT NULL,
    "dateIncident" timestamp without time zone NOT NULL,
    gravite character varying(20) NOT NULL,
    statut character varying(20) DEFAULT 'SIGNALE'::character varying NOT NULL,
    type character varying(50) NOT NULL,
    description text NOT NULL,
    lieu character varying(100),
    temoins text,
    "actionPrise" text,
    "sanctionId" uuid,
    "signaleParent" boolean DEFAULT false NOT NULL,
    "dateSignalementParent" timestamp without time zone,
    "etablissementId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "periodeId" uuid,
    "classeId" uuid,
    "matiereId" uuid,
    "enseignantId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: incidents_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidents_personnel (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "membrePersonnelId" uuid NOT NULL,
    "declarantId" uuid NOT NULL,
    "dateIncident" timestamp without time zone NOT NULL,
    gravite character varying(20) NOT NULL,
    statut character varying(20) DEFAULT 'SIGNALE'::character varying NOT NULL,
    type character varying(200) NOT NULL,
    description text NOT NULL,
    "actionPrise" text,
    "etablissementId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "periodeId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: incidents_sante; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidents_sante (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "dossierMedicalId" uuid NOT NULL,
    "dateIncident" timestamp without time zone NOT NULL,
    type character varying(20) NOT NULL,
    gravite character varying(20) NOT NULL,
    nature character varying(200) NOT NULL,
    description text NOT NULL,
    lieu character varying(100),
    "premiersSecours" text,
    "suiteDonnee" text,
    hospitalisation boolean DEFAULT false NOT NULL,
    "signaleParent" boolean DEFAULT false NOT NULL,
    "dateSignalementParent" timestamp without time zone,
    "declareParId" uuid NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: indisponibilites_enseignants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.indisponibilites_enseignants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "enseignantId" uuid NOT NULL,
    "typeIndisponibilite" character varying(50) DEFAULT 'AUTRE'::character varying NOT NULL,
    "dateDebut" date NOT NULL,
    "dateFin" date NOT NULL,
    "heureDebut" time without time zone,
    "heureFin" time without time zone,
    "frequenceRecurrence" character varying(50) DEFAULT 'AUCUNE'::character varying NOT NULL,
    "joursRecurrence" text,
    motif text,
    "estValidée" boolean DEFAULT true NOT NULL,
    "valideePar" uuid,
    commentaire text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: inscriptions_cantine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscriptions_cantine (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    statut public.inscriptions_cantine_statut_enum DEFAULT 'ACTIVE'::public.inscriptions_cantine_statut_enum NOT NULL,
    "dateDebut" date,
    "dateFin" date,
    allergies text,
    "regimeAlimentaire" text,
    solde numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: inscriptions_clubs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscriptions_clubs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "clubId" uuid NOT NULL,
    "eleveId" uuid NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "etablissementId" uuid NOT NULL,
    "inscritAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: inscriptions_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscriptions_options (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "matiereId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "dateInscription" date NOT NULL,
    "dateAbandon" date,
    "motifAbandon" text,
    statut character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    coefficient double precision DEFAULT '1'::double precision NOT NULL,
    "estValidée" boolean DEFAULT false NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: inscriptions_transport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscriptions_transport (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "ligneId" uuid NOT NULL,
    "arretMontee" character varying(100) NOT NULL,
    "arretDescente" character varying(100) NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "soldePaye" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: lignes_budget; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lignes_budget (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "montantPrevu" numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    "montantEngage" numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    "montantConsomme" numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    "pourcentageAlerte" numeric(5,2),
    "bloquerSiDepasse" boolean DEFAULT true NOT NULL,
    observations text,
    "budgetId" uuid NOT NULL,
    "categorieDepenseId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: lignes_transport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lignes_transport (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    "numeroLigne" character varying(20) NOT NULL,
    arrets text NOT NULL,
    "chauffeurId" uuid,
    immatriculation character varying(50),
    capacite integer DEFAULT 50 NOT NULL,
    tarif numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: materiels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materiels (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    reference character varying(100),
    "numeroSerie" character varying(100),
    categorie public.materiels_categorie_enum NOT NULL,
    etat public.materiels_etat_enum DEFAULT 'BON'::public.materiels_etat_enum NOT NULL,
    quantite integer DEFAULT 1 NOT NULL,
    localisation character varying(100),
    valeur numeric(10,2),
    "dateAcquisition" date,
    notes text,
    disponible boolean DEFAULT true NOT NULL,
    statut character varying(30) DEFAULT 'DISPONIBLE'::character varying NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: matieres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matieres (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    code character varying(50),
    "nomAnglais" character varying(100),
    couleur character varying(20) DEFAULT '#000000'::character varying NOT NULL,
    "etablissementId" uuid NOT NULL,
    "sousSysteme" public.matieres_soussysteme_enum,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: matieres_niveaux; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matieres_niveaux (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "matiereId" uuid NOT NULL,
    "niveauId" uuid NOT NULL,
    "groupeId" uuid,
    "filiereId" uuid,
    coefficient double precision DEFAULT '1'::double precision NOT NULL,
    credits double precision,
    bareme integer DEFAULT 20 NOT NULL,
    "volumeHoraire" integer,
    obligatoire boolean DEFAULT true NOT NULL,
    statut character varying(30) DEFAULT 'ACTIF'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: membres_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membres_personnel (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    "typePersonnelId" uuid,
    matricule character varying(50) NOT NULL,
    "dateEmbauche" date NOT NULL,
    statut character varying(30) DEFAULT 'ACTIF'::character varying NOT NULL,
    specialites text,
    diplomes text,
    "posteExact" character varying(200),
    service character varying(100),
    "responsableHierarchiqueId" uuid,
    competences text,
    "specialitePrincipale" character varying(200),
    "anneesExperience" integer,
    "educationNiveau" character varying(50),
    "etablissementOrigine" character varying(200),
    disponibilites text,
    "heuresMaxSemaine" integer,
    "horairesTravail" text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: menus_cantine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menus_cantine (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    date date NOT NULL,
    "typeRepas" character varying(20) DEFAULT 'dejeuner'::character varying NOT NULL,
    "platPrincipal" character varying(255) NOT NULL,
    accompagnement character varying(255),
    dessert character varying(255),
    prix numeric(10,2) NOT NULL,
    statut public.menus_cantine_statut_enum DEFAULT 'DISPONIBLE'::public.menus_cantine_statut_enum NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    allergenes text,
    description text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: message_mentions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_mentions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "messageId" uuid NOT NULL,
    "mentionneId" uuid NOT NULL,
    lu boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: message_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_reactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "messageId" uuid NOT NULL,
    "utilisateurId" uuid NOT NULL,
    emoji public.message_reactions_emoji_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: message_read_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_read_status (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "messageId" uuid NOT NULL,
    "utilisateurId" uuid NOT NULL,
    "luA" timestamp without time zone NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "conversationId" uuid NOT NULL,
    "expediteurId" uuid NOT NULL,
    "reponseAId" uuid,
    contenu text NOT NULL,
    "typeContenu" character varying(50) DEFAULT 'text'::character varying NOT NULL,
    priorite character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    "etablissementId" uuid NOT NULL,
    "piecesJointes" text,
    modifie boolean DEFAULT false NOT NULL,
    supprime boolean DEFAULT false NOT NULL,
    mentions jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: messages_fichiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages_fichiers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "messageId" uuid NOT NULL,
    "nomFichier" character varying(255) NOT NULL,
    "cheminStockage" character varying(500) NOT NULL,
    "typeMime" character varying(100) NOT NULL,
    taille integer NOT NULL,
    "urlAcces" character varying(500),
    stockage character varying(20) DEFAULT 'local'::character varying NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: modeles_cartes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modeles_cartes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    "etablissementId" uuid NOT NULL,
    largeur numeric(6,2) DEFAULT 85.6 NOT NULL,
    hauteur numeric(6,2) DEFAULT 53.98 NOT NULL,
    orientation character varying(20) DEFAULT 'PORTRAIT'::character varying NOT NULL,
    "champsAffiches" text NOT NULL,
    "couleurPrimaire" character varying(7) DEFAULT '#1E40AF'::character varying NOT NULL,
    "couleurSecondaire" character varying(7) DEFAULT '#3B82F6'::character varying NOT NULL,
    "logoUrl" character varying(500),
    "templateHtml" text,
    "parDefaut" boolean DEFAULT false NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: modeles_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modeles_documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    type public.modeles_documents_type_enum NOT NULL,
    description text,
    template text NOT NULL,
    entete text,
    "piedDePage" text,
    styles text,
    actif boolean DEFAULT true NOT NULL,
    "parDefaut" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mouvements_caisse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mouvements_caisse (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "numeroOperation" character varying(20) NOT NULL,
    "dateMouvement" date NOT NULL,
    type character varying(30) NOT NULL,
    montant numeric(15,2) NOT NULL,
    motif character varying(255) NOT NULL,
    beneficiaire character varying(255),
    reference character varying(255),
    "soldeApresOperation" numeric(15,2) NOT NULL,
    "compteCaisseId" uuid NOT NULL,
    "utilisateurId" uuid,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: niveaux; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.niveaux (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    code character varying(50),
    "cycleId" uuid NOT NULL,
    "examenNationalId" uuid,
    "estClasseExamen" boolean DEFAULT false NOT NULL,
    "sousSysteme" public.niveaux_soussysteme_enum DEFAULT 'FRANCOPHONE'::public.niveaux_soussysteme_enum NOT NULL,
    ordre integer DEFAULT 1 NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "enseignantId" uuid NOT NULL,
    "matiereId" uuid NOT NULL,
    "periodeId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "typeEvaluation" public.notes_typeevaluation_enum DEFAULT 'DEVOIR'::public.notes_typeevaluation_enum NOT NULL,
    description character varying(255),
    valeur double precision NOT NULL,
    bareme double precision DEFAULT '20'::double precision NOT NULL,
    coefficient double precision DEFAULT '1'::double precision NOT NULL,
    commentaire text,
    "dateEvaluation" date,
    statut public.notes_statut_enum DEFAULT 'BROUILLON'::public.notes_statut_enum NOT NULL,
    "validateurId" uuid,
    "valideeAt" timestamp without time zone,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_providers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    type public.notification_providers_type_enum NOT NULL,
    service public.notification_providers_service_enum NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "estDefaut" boolean DEFAULT false NOT NULL,
    configuration text NOT NULL,
    "quotaJournalier" integer DEFAULT 0 NOT NULL,
    "quotaUtilise" integer DEFAULT 0 NOT NULL,
    priorite integer DEFAULT 1 NOT NULL,
    "etablissementId" uuid,
    description text,
    "derniereErreurAt" timestamp without time zone,
    "dernierMessageErreur" text,
    "erreursConsecutives" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "destinataireId" uuid NOT NULL,
    "expediteurId" uuid,
    titre character varying(255) NOT NULL,
    contenu text NOT NULL,
    type public.notifications_type_enum DEFAULT 'IN_APP'::public.notifications_type_enum NOT NULL,
    statut public.notifications_statut_enum DEFAULT 'EN_ATTENTE'::public.notifications_statut_enum NOT NULL,
    priorite public.notifications_priorite_enum DEFAULT 'NORMALE'::public.notifications_priorite_enum NOT NULL,
    categorie character varying(100),
    "lienAction" character varying(500),
    metadata text,
    "lueAt" timestamp without time zone,
    "envoyeeAt" timestamp without time zone,
    "programmeePour" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: observations_eleves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.observations_eleves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "observateurId" uuid NOT NULL,
    type character varying(20) NOT NULL,
    categorie character varying(200) NOT NULL,
    commentaire text NOT NULL,
    "pointsImpact" integer DEFAULT 0 NOT NULL,
    "visibleParent" boolean DEFAULT false NOT NULL,
    "etablissementId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "periodeId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: offres_emploi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offres_emploi (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "posteId" uuid,
    "uniteOrganisationnelleId" uuid,
    titre character varying(200) NOT NULL,
    description text NOT NULL,
    missions text,
    "profilRecherche" text,
    "competencesRequises" text,
    "experienceRequise" text,
    "niveauEtudeRequis" character varying(100),
    "salaireMin" numeric(10,0),
    "salaireMax" numeric(10,0),
    "typeContratPropose" character varying(50),
    statut character varying(30) DEFAULT 'BROUILLON'::character varying NOT NULL,
    "datePublication" timestamp with time zone,
    "dateLimite" timestamp with time zone,
    "nombrePostesDisponibles" integer DEFAULT 0 NOT NULL,
    "nombreCandidatures" integer DEFAULT 0 NOT NULL,
    "publieParId" uuid NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: onboarding_recrutement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.onboarding_recrutement (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "membrePersonnelId" uuid NOT NULL,
    "offreEmploiId" uuid NOT NULL,
    "dateDebut" date NOT NULL,
    "dateFinReel" date,
    "dateFinPrevu" date NOT NULL,
    statut character varying(30) DEFAULT 'EN_COURS'::character varying NOT NULL,
    checklist text,
    "tuteurId" uuid,
    "formationInitiale" text,
    "equipementFourni" text,
    "accesSystemes" text,
    commentaires text,
    "progressionPourcentage" integer DEFAULT 0 NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: organisations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organisations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    description text,
    type public.organisations_type_enum DEFAULT 'ETABLISSEMENT_SCOLAIRE'::public.organisations_type_enum NOT NULL,
    "logoUrl" character varying(500),
    code character varying(50),
    email character varying(255),
    telephone character varying(50),
    adresse text,
    "siteWeb" character varying(255),
    statut character varying(30) DEFAULT 'ACTIF'::character varying NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "etablissementId" uuid,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: paiements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paiements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "echeancierId" uuid,
    montant numeric(12,2) NOT NULL,
    "montantPenalite" numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    "montantTotal" numeric(12,2) NOT NULL,
    "typePaiement" public.paiements_typepaiement_enum DEFAULT 'SCOLARITE'::public.paiements_typepaiement_enum NOT NULL,
    "methodePaiement" character varying(30) NOT NULL,
    "referenceTransaction" character varying(100),
    "numeroRecu" character varying(50) NOT NULL,
    "datePaiement" timestamp without time zone NOT NULL,
    statut public.paiements_statut_enum DEFAULT 'PAYE'::public.paiements_statut_enum NOT NULL,
    "effectuePar" uuid NOT NULL,
    "validePar" uuid,
    observations text,
    "statutValidation" character varying(20) DEFAULT 'NON_REQUIS'::character varying NOT NULL,
    "niveauValidationActuel" integer DEFAULT 0 NOT NULL,
    "motifRefus" text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: parametre_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parametre_versions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "parametreId" uuid NOT NULL,
    "etablissementId" uuid,
    "ancienneValeur" text,
    "nouvelleValeur" text NOT NULL,
    version integer NOT NULL,
    "modifiedBy" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: parametres_systeme; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parametres_systeme (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cle character varying(255) NOT NULL,
    valeur text NOT NULL,
    "typeValeur" public.parametres_systeme_typevaleur_enum DEFAULT 'STRING'::public.parametres_systeme_typevaleur_enum NOT NULL,
    categorie public.parametres_systeme_categorie_enum DEFAULT 'CUSTOM'::public.parametres_systeme_categorie_enum NOT NULL,
    module character varying(100),
    "etablissementId" uuid,
    description text,
    "valeurDefaut" text,
    "modifiableRuntime" boolean DEFAULT true NOT NULL,
    visible boolean DEFAULT true NOT NULL,
    ordre integer DEFAULT 0 NOT NULL,
    validation character varying(500),
    options text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: participants_conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participants_conversation (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "conversationId" uuid NOT NULL,
    "utilisateurId" uuid NOT NULL,
    "estAdmin" boolean DEFAULT false NOT NULL,
    muet boolean DEFAULT false NOT NULL,
    epingle boolean DEFAULT false NOT NULL,
    "archivePerso" boolean DEFAULT false NOT NULL,
    "derniereLecture" timestamp without time zone,
    "dernierMessageLuId" uuid,
    "joinedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: periodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.periodes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    "typeId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "dateDebut" date NOT NULL,
    "dateFin" date NOT NULL,
    ordre integer DEFAULT 1 NOT NULL,
    poids double precision DEFAULT '1'::double precision NOT NULL,
    statut character varying(30) DEFAULT 'OUVERTE'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "etablissementId" uuid NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(100) NOT NULL,
    libelle character varying(255) NOT NULL,
    description text,
    module character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: places_parking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.places_parking (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    numero character varying(20) NOT NULL,
    type character varying(20) DEFAULT 'standard'::character varying NOT NULL,
    statut character varying(20) DEFAULT 'libre'::character varying NOT NULL,
    "vehiculeId" uuid,
    "abonnementId" uuid,
    "tarifHoraire" numeric(10,2),
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: points_utilisateurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.points_utilisateurs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    "pointsTotal" integer DEFAULT 0 NOT NULL,
    "pointsMois" integer DEFAULT 0 NOT NULL,
    "pointsSemaine" integer DEFAULT 0 NOT NULL,
    niveau integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: postes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.postes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "intitulé" character varying(100) NOT NULL,
    description text,
    code character varying(50) NOT NULL,
    type public.postes_type_enum DEFAULT 'ADMINISTRATIF'::public.postes_type_enum NOT NULL,
    "niveauResponsabilite" public.postes_niveauresponsabilite_enum DEFAULT 'EXECUTANT'::public.postes_niveauresponsabilite_enum NOT NULL,
    statut public.postes_statut_enum DEFAULT 'ACTIF'::public.postes_statut_enum NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "uniteOrganisationnelleId" uuid NOT NULL,
    "occupantId" uuid,
    "occupantNom" character varying(200),
    "nombrePostes" integer DEFAULT 1 NOT NULL,
    "superviseurId" uuid,
    "superviseurNom" character varying(200),
    "competencesRequises" jsonb,
    missions jsonb,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: preferences_emploi_du_temps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preferences_emploi_du_temps (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "etablissementId" uuid NOT NULL,
    "heureDebutCours" time without time zone DEFAULT '07:30:00'::time without time zone NOT NULL,
    "heureFinCours" time without time zone DEFAULT '17:00:00'::time without time zone NOT NULL,
    "dureeCreneauStandard" integer DEFAULT 55 NOT NULL,
    "dureeRecreation" integer DEFAULT 15 NOT NULL,
    "joursOuvrables" text[] DEFAULT '{LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI}'::text[] NOT NULL,
    "maxCreneauxParJour" integer DEFAULT 8 NOT NULL,
    "maxCreneauxMatiereParJour" integer DEFAULT 2 NOT NULL,
    "maxCreneauxConsecutifs" integer DEFAULT 2 NOT NULL,
    "pauseDebut" time without time zone,
    "pauseFin" time without time zone,
    "repartitionEquilibree" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: preferences_globales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preferences_globales (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "etablissementId" uuid NOT NULL,
    cle character varying(100) NOT NULL,
    valeur text NOT NULL,
    "typeValeur" character varying(20) DEFAULT 'string'::character varying NOT NULL,
    categorie character varying(30) NOT NULL,
    libelle character varying(200) NOT NULL,
    description text,
    "estModifiableParUtilisateur" boolean DEFAULT true NOT NULL,
    ordre integer DEFAULT 0 NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "modifiePar" uuid
);


--
-- Name: preferences_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preferences_role (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "roleId" uuid NOT NULL,
    cle character varying(100) NOT NULL,
    valeur text NOT NULL,
    "typeValeur" character varying(20) DEFAULT 'string'::character varying NOT NULL,
    categorie character varying(30) NOT NULL,
    "estModifiableParUtilisateur" boolean DEFAULT true NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: preferences_utilisateur; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preferences_utilisateur (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    cle character varying(100) NOT NULL,
    valeur text NOT NULL,
    "typeValeur" character varying(20) DEFAULT 'string'::character varying NOT NULL,
    categorie public.preferences_utilisateur_categorie_enum DEFAULT 'PERSONNALISATION'::public.preferences_utilisateur_categorie_enum NOT NULL,
    "valeurDefaut" text,
    "heriteGlobal" boolean DEFAULT false NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "etablissementId" uuid
);


--
-- Name: presences_transport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presences_transport (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "inscriptionId" uuid NOT NULL,
    date date NOT NULL,
    trajet character varying(20) DEFAULT 'aller'::character varying NOT NULL,
    present boolean DEFAULT false NOT NULL,
    "heureMontee" time without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: prets_materiels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prets_materiels (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "materielId" uuid NOT NULL,
    "emprunteurId" uuid NOT NULL,
    quantite integer DEFAULT 1 NOT NULL,
    "datePret" date NOT NULL,
    "dateRetourPrevue" date,
    "dateRetourEffective" date,
    notes text,
    retourne boolean DEFAULT false NOT NULL,
    statut character varying(30) DEFAULT 'EN_COURS'::character varying NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: profils_orientation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profils_orientation (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    interets text,
    aptitudes text,
    objectifs text,
    notes text,
    recommandations text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: profils_utilisateurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profils_utilisateurs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    genre public.profils_utilisateurs_genre_enum,
    "dateNaissance" date,
    "lieuNaissance" character varying(100),
    nationalite character varying(100),
    telephone character varying(20),
    "telephoneSecondaire" character varying(20),
    adresse text,
    ville character varying(100),
    quartier character varying(100),
    photo character varying(255),
    "pieceIdentite" character varying(255),
    "numeroPieceIdentite" character varying(50),
    notes text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: programme_chapitres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programme_chapitres (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "matiereNiveauId" uuid NOT NULL,
    "periodeId" uuid,
    titre character varying(255) NOT NULL,
    description text,
    "objectifsPedagogiques" text,
    ordre integer DEFAULT 0 NOT NULL,
    "dureePrevueHeures" integer,
    prerequis text,
    "progressionPourcentage" integer DEFAULT 0 NOT NULL,
    "ressourcesPedagogiques" text,
    "competencesAssociees" text,
    statut character varying(30) DEFAULT 'ACTIF'::character varying NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: progressions_programme; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progressions_programme (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "enseignantId" uuid NOT NULL,
    "matiereId" uuid NOT NULL,
    "classeId" uuid NOT NULL,
    "periodeId" uuid,
    "programmeChapitreId" uuid,
    "pourcentageRealise" numeric(5,2) NOT NULL,
    "modeCalcul" character varying(30) DEFAULT 'LEGACY'::character varying NOT NULL,
    "chapitreCourant" character varying(200) NOT NULL,
    "dateEvaluation" date NOT NULL,
    remarques text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: rdv_orientation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rdv_orientation (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "conseillerId" uuid NOT NULL,
    date timestamp without time zone NOT NULL,
    "dureeMinutes" integer DEFAULT 30 NOT NULL,
    motif character varying(500),
    "compteRendu" text,
    recommandations text,
    statut character varying(20) DEFAULT 'PLANIFIE'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: recus_paiement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recus_paiement (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "paiementId" uuid NOT NULL,
    "numeroRecu" character varying(50) NOT NULL,
    "dateEmission" timestamp without time zone NOT NULL,
    "eleveNom" character varying(150) NOT NULL,
    "eleveMatricule" character varying(50) NOT NULL,
    "classeNom" character varying(100) NOT NULL,
    montant numeric(12,2) NOT NULL,
    "methodePaiement" character varying(30) NOT NULL,
    objet character varying(255) NOT NULL,
    "genererPar" uuid NOT NULL,
    "signatureNumerique" character varying(64),
    "pdfPath" character varying(500),
    "envoyeParEmail" boolean DEFAULT false NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    token character varying(500) NOT NULL,
    "adresseIp" character varying(45),
    "userAgent" character varying(500),
    "expireAt" timestamp without time zone NOT NULL,
    revoque boolean DEFAULT false NOT NULL,
    "revoqueAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: regles_scoring; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regles_scoring (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(255) NOT NULL,
    description text,
    type public.regles_scoring_type_enum NOT NULL,
    evenement character varying(100) NOT NULL,
    points integer NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: regles_scoring_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regles_scoring_personnel (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "etablissementId" uuid NOT NULL,
    code character varying(100) NOT NULL,
    libelle character varying(200) NOT NULL,
    description text,
    "typeAction" character varying(50) NOT NULL,
    "pointsAttribues" integer NOT NULL,
    "estAutomatique" boolean DEFAULT true NOT NULL,
    "estActif" boolean DEFAULT true NOT NULL,
    priorite integer DEFAULT 0 NOT NULL,
    "conditionsSupplementaires" text,
    "categorieCible" character varying(50),
    "typePersonnelCible" character varying(50),
    "dateDebut" date,
    "dateFin" date,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: relances_paiement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relances_paiement (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "echeancierId" uuid NOT NULL,
    "numeroRelance" integer NOT NULL,
    "dateRelance" timestamp without time zone NOT NULL,
    "typeRelance" public.relances_paiement_typerelance_enum NOT NULL,
    statut public.relances_paiement_statut_enum DEFAULT 'ENVOYEE'::public.relances_paiement_statut_enum NOT NULL,
    message text NOT NULL,
    reponse text,
    "effectuePar" uuid NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: remises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.remises (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid,
    "fraisScolariteId" uuid NOT NULL,
    "typeRemise" public.remises_typeremise_enum NOT NULL,
    "scopeRemise" character varying(30) DEFAULT 'ELEVE'::character varying NOT NULL,
    "classeId" uuid,
    "cycleId" uuid,
    "filiereId" uuid,
    pourcentage numeric(5,2) NOT NULL,
    montant numeric(12,2) NOT NULL,
    motif text NOT NULL,
    "validePar" uuid NOT NULL,
    "dateAttribution" timestamp without time zone NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: repartitions_horaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repartitions_horaires (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "affectationId" uuid NOT NULL,
    "jourSemaine" character varying(20) NOT NULL,
    "heureDebut" time without time zone NOT NULL,
    "heureFin" time without time zone NOT NULL,
    "nombreHeures" double precision DEFAULT '2'::double precision NOT NULL,
    "sallePrefereeId" uuid,
    priorite integer DEFAULT 1 NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    commentaire text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: requetes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requetes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    numero character varying(50) NOT NULL,
    "demandeurId" uuid NOT NULL,
    type public.requetes_type_enum NOT NULL,
    sujet character varying(255) NOT NULL,
    description text NOT NULL,
    statut public.requetes_statut_enum DEFAULT 'EN_ATTENTE'::public.requetes_statut_enum NOT NULL,
    "piecesJointes" text,
    "niveauxApprobation" integer DEFAULT 1 NOT NULL,
    "niveauActuel" integer DEFAULT 0 NOT NULL,
    "approbateurId" uuid,
    "commentaireTraitement" text,
    "historiqueApprobation" text,
    "dateTraitement" timestamp without time zone,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: responsables_eleves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.responsables_eleves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    "enfantId" uuid NOT NULL,
    "lienParente" character varying(50) NOT NULL,
    "responsableLegal" boolean DEFAULT true NOT NULL,
    "peutConsulter" boolean DEFAULT true NOT NULL,
    "peutPayer" boolean DEFAULT false NOT NULL,
    email character varying(255),
    telephone character varying(20),
    adresse character varying(255),
    profession character varying(200),
    "lieuTravail" character varying(200),
    "telephoneTravail" character varying(20),
    "emailTravail" character varying(255),
    "adresseProfessionnelle" text,
    "revenuMensuel" numeric(12,2),
    "personneContactUrgence" character varying(200),
    "telephoneContactUrgence" character varying(20),
    "autorisationSortie" boolean DEFAULT true NOT NULL,
    "autorisationMedicale" boolean DEFAULT true NOT NULL,
    "dateAjout" timestamp without time zone DEFAULT now() NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: role_limitations_etablissements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_limitations_etablissements (
    role public.role_limitations_etablissements_role_enum NOT NULL,
    "maxEtablissements" integer DEFAULT 1 NOT NULL,
    "peutChanger" boolean DEFAULT true NOT NULL,
    "necessiteValidation" boolean DEFAULT false NOT NULL,
    description character varying(500),
    "creeAt" timestamp without time zone DEFAULT now() NOT NULL,
    "majAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    "roleId" uuid NOT NULL,
    "permissionId" uuid NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    libelle character varying(100) NOT NULL,
    description text,
    "estSysteme" boolean DEFAULT false NOT NULL,
    "estActif" boolean DEFAULT true NOT NULL,
    "parentId" uuid,
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: salles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    capacite integer DEFAULT 30 NOT NULL,
    localisation character varying(100),
    "typeSalle" character varying(50) DEFAULT 'CLASSIQUE'::character varying NOT NULL,
    equipements jsonb,
    description text,
    statut character varying(30) DEFAULT 'DISPONIBLE'::character varying NOT NULL,
    disponible boolean DEFAULT true NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sanctions_eleves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sanctions_eleves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "incidentId" uuid NOT NULL,
    type character varying(30) NOT NULL,
    statut character varying(20) DEFAULT 'PRONONCEE'::character varying NOT NULL,
    motif text NOT NULL,
    description text,
    "dateDebut" timestamp without time zone,
    "dateFin" timestamp without time zone,
    "joursExclusion" integer,
    "mesuresAccompagnement" text,
    "decideParId" uuid NOT NULL,
    "etablissementId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "periodeId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: scores_eleves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scores_eleves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "eleveId" uuid NOT NULL,
    "periodeId" uuid,
    type public.scores_eleves_type_enum NOT NULL,
    score numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    rang integer,
    details text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: scores_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scores_personnel (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "membrePersonnelId" uuid NOT NULL,
    "etablissementId" uuid NOT NULL,
    "anneeScolaireId" uuid NOT NULL,
    "periodeId" uuid,
    "typePersonnelId" uuid,
    "categoriePersonnel" character varying(50),
    "matiereId" uuid,
    "classeId" uuid,
    "scoreGlobal" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "scoreAssiduite" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "scoreComportement" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "scorePerformance" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "scorePedagogie" numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    "pointsPositifs" integer DEFAULT 0 NOT NULL,
    "pointsNegatifs" integer DEFAULT 0 NOT NULL,
    "nombreIncidents" integer DEFAULT 0 NOT NULL,
    "nombreAbsences" integer DEFAULT 0 NOT NULL,
    "nombreRetards" integer DEFAULT 0 NOT NULL,
    "nombreEvaluations" integer DEFAULT 0 NOT NULL,
    "noteMoyenneEvaluations" numeric(5,2),
    "rangGlobal" integer,
    "rangParCategorie" integer,
    "rangParMatiere" integer,
    "rangParClasse" integer,
    "derniereMAJ" timestamp with time zone DEFAULT now() NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sondage_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sondage_options (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    texte text NOT NULL,
    ordre integer DEFAULT 0 NOT NULL,
    "nombreVotes" integer DEFAULT 0 NOT NULL,
    "sondageId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sondage_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sondage_votes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "sondageId" uuid NOT NULL,
    "optionId" uuid NOT NULL,
    "utilisateurId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sondages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sondages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    question text NOT NULL,
    statut character varying(20) DEFAULT 'actif'::character varying NOT NULL,
    "estAnonyme" boolean DEFAULT false NOT NULL,
    "choixMultiple" boolean DEFAULT false NOT NULL,
    "dateLimite" timestamp without time zone,
    "dateProgrammation" timestamp without time zone,
    "dateFermeture" timestamp without time zone,
    "nombreDestinataires" integer DEFAULT 0 NOT NULL,
    "nombreVotes" integer DEFAULT 0 NOT NULL,
    "niveauAccesAnalyses" character varying(30) DEFAULT 'auteur_seul'::character varying NOT NULL,
    "utilisateursAutorisesAnalyses" uuid[],
    "creerConversation" boolean DEFAULT false NOT NULL,
    "templateId" uuid,
    "modeDestinataires" text,
    "estRecurrent" boolean DEFAULT false NOT NULL,
    "frequenceRecurrent" character varying(20),
    "jourRecurrent" integer,
    "heureRecurrent" time without time zone,
    "dateFinRecurrent" timestamp without time zone,
    "sondageParentId" uuid,
    "auteurId" uuid NOT NULL,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: specialites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specialites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    "filiereId" uuid NOT NULL,
    "etablissementId" uuid NOT NULL,
    ordre integer DEFAULT 1 NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: templates_emploi_du_temps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.templates_emploi_du_temps (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(200) NOT NULL,
    description text,
    "etablissementId" uuid,
    configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    "creneauxTypes" jsonb DEFAULT '[]'::jsonb NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "estPartage" boolean DEFAULT false NOT NULL,
    "creePar" character varying(100),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: templates_message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.templates_message (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "etablissementId" uuid NOT NULL,
    code character varying(50) NOT NULL,
    titre character varying(200) NOT NULL,
    contenu text NOT NULL,
    categorie public.templates_message_categorie_enum NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: templates_sondage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.templates_sondage (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(200) NOT NULL,
    description text,
    question text NOT NULL,
    options jsonb,
    parametres jsonb,
    categorie character varying(50),
    visibilite character varying(20) DEFAULT 'prive'::character varying NOT NULL,
    tags character varying(100),
    "estTemplateSysteme" boolean DEFAULT false NOT NULL,
    "utilisationCount" integer DEFAULT 0 NOT NULL,
    "createurId" uuid,
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tentatives_connexion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tentatives_connexion (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    identifiant character varying(255) NOT NULL,
    "adresseIp" character varying(45) NOT NULL,
    "empreinteMachine" character varying(255),
    "typeBlocage" character varying(20) DEFAULT 'specifique'::character varying NOT NULL,
    "nombreTentatives" integer DEFAULT 0 NOT NULL,
    "bloqueJusqua" timestamp without time zone,
    "derniereTentative" timestamp without time zone NOT NULL,
    "motifBlocage" character varying(255),
    "nbDeblocagesAuto" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: types_contrat_personnalises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.types_contrat_personnalises (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    nom character varying(100) NOT NULL,
    description text,
    categorie character varying(50) DEFAULT 'EMPLOI_PERMANENT'::character varying NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "estSysteme" boolean DEFAULT false NOT NULL,
    ordre integer DEFAULT 0 NOT NULL,
    "renouvellementAutoDefaut" boolean DEFAULT false NOT NULL,
    "dureeMaxMois" integer,
    "clausesDefaut" jsonb,
    "avantagesDefaut" jsonb,
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: types_enum; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.types_enum (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    categorie character varying(50) NOT NULL,
    code character varying(50) NOT NULL,
    libelle character varying(100) NOT NULL,
    description text,
    "estSysteme" boolean DEFAULT false NOT NULL,
    "estActif" boolean DEFAULT true NOT NULL,
    ordre integer DEFAULT 0 NOT NULL,
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: types_periodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.types_periodes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    nom character varying(100) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: types_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.types_personnel (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    nom character varying(100) NOT NULL,
    "permissionsDefaut" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: types_primes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.types_primes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(30) NOT NULL,
    nom character varying(100) NOT NULL,
    "typeCalcul" character varying(20) NOT NULL,
    valeur numeric(12,2) NOT NULL,
    description text,
    "etablissementId" uuid NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: types_retenues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.types_retenues (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(30) NOT NULL,
    nom character varying(100) NOT NULL,
    frequence character varying(20) NOT NULL,
    "montantMax" numeric(12,2),
    description text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: unites_organisationnelles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unites_organisationnelles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    description text,
    type public.unites_organisationnelles_type_enum DEFAULT 'SERVICE'::public.unites_organisationnelles_type_enum NOT NULL,
    code character varying(50) NOT NULL,
    statut character varying(30) DEFAULT 'ACTIF'::character varying NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "organisationId" uuid NOT NULL,
    "parentId" uuid,
    ordre integer DEFAULT 0 NOT NULL,
    "responsableNom" character varying(200),
    "responsableId" uuid,
    localisation character varying(100),
    telephone character varying(50),
    email character varying(255),
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: utilisateur_etablissements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utilisateur_etablissements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    "etablissementId" uuid NOT NULL,
    "roleId" uuid NOT NULL,
    "etablissementPrincipal" boolean DEFAULT false NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "dateDebut" timestamp without time zone,
    "dateFin" timestamp without time zone,
    motif character varying(500),
    "creePar" uuid,
    "creeAt" timestamp without time zone DEFAULT now() NOT NULL,
    "majAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: utilisateur_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utilisateur_permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    "permissionId" uuid NOT NULL,
    type public.utilisateur_permissions_type_enum DEFAULT 'GRANTED'::public.utilisateur_permissions_type_enum NOT NULL,
    motif text,
    "attribuePar" uuid,
    "dateAttribution" timestamp without time zone DEFAULT now() NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: utilisateurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utilisateurs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    matricule character varying(50) NOT NULL,
    pseudonyme character varying(100),
    "qrCodeId" character varying(100),
    "motDePasse" character varying(255) NOT NULL,
    role public.utilisateurs_role_enum DEFAULT 'ELEVE'::public.utilisateurs_role_enum NOT NULL,
    statut public.utilisateurs_statut_enum DEFAULT 'EN_ATTENTE_VALIDATION'::public.utilisateurs_statut_enum NOT NULL,
    "emailVerifie" boolean DEFAULT false NOT NULL,
    "tokenVerificationEmail" character varying(255),
    "tokenReinitialisationMdp" character varying(255),
    "expirationTokenMdp" timestamp without time zone,
    "derniereConnexion" timestamp without time zone,
    langue character varying(10) DEFAULT 'fr'::character varying NOT NULL,
    "maxEtablissementsPersonnel" integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: vehicules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "proprietaireId" uuid NOT NULL,
    immatriculation character varying(50) NOT NULL,
    marque character varying(50),
    modele character varying(50),
    couleur character varying(30),
    type character varying(20) DEFAULT 'voiture'::character varying NOT NULL,
    "placeParkingId" uuid,
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: workflows_validation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflows_validation (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    module character varying(50) NOT NULL,
    "entiteId" uuid NOT NULL,
    "entiteType" character varying(100) NOT NULL,
    "niveauxRequis" integer DEFAULT 1 NOT NULL,
    "niveauActuel" integer DEFAULT 0 NOT NULL,
    statut public.workflows_validation_statut_enum DEFAULT 'EN_COURS'::public.workflows_validation_statut_enum NOT NULL,
    "configRoles" text,
    historique text,
    "dernierValidateurId" uuid,
    "dateCompletion" timestamp without time zone,
    commentaire text,
    "etablissementId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: factures_fournisseur PK_00d6f119df96cc2e68c44daec8e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factures_fournisseur
    ADD CONSTRAINT "PK_00d6f119df96cc2e68c44daec8e" PRIMARY KEY (id);


--
-- Name: bons_commande PK_0167941b0a2109b72da312d66b0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bons_commande
    ADD CONSTRAINT "PK_0167941b0a2109b72da312d66b0" PRIMARY KEY (id);


--
-- Name: role_limitations_etablissements PK_03c63bd141d4f17504f36077a59; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_limitations_etablissements
    ADD CONSTRAINT "PK_03c63bd141d4f17504f36077a59" PRIMARY KEY (role);


--
-- Name: tentatives_connexion PK_0818ff2dae4bf13e24936843106; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tentatives_connexion
    ADD CONSTRAINT "PK_0818ff2dae4bf13e24936843106" PRIMARY KEY (id);


--
-- Name: postes PK_0b60c53959e6f994e8f2db432c9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postes
    ADD CONSTRAINT "PK_0b60c53959e6f994e8f2db432c9" PRIMARY KEY (id);


--
-- Name: historique_points PK_0c3256e43789491131ec0eb62a9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_points
    ADD CONSTRAINT "PK_0c3256e43789491131ec0eb62a9" PRIMARY KEY (id);


--
-- Name: templates_sondage PK_0c5136e9d2e4d32d45e4faa3dd5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates_sondage
    ADD CONSTRAINT "PK_0c5136e9d2e4d32d45e4faa3dd5" PRIMARY KEY (id);


--
-- Name: rdv_orientation PK_0e008dd446e0c12332a0570b12d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rdv_orientation
    ADD CONSTRAINT "PK_0e008dd446e0c12332a0570b12d" PRIMARY KEY (id);


--
-- Name: evaluations_enseignants PK_115a8c21a0bbfff1e7d3af15fd9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations_enseignants
    ADD CONSTRAINT "PK_115a8c21a0bbfff1e7d3af15fd9" PRIMARY KEY (id);


--
-- Name: scores_eleves PK_119895830d4f47178f7e747043f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores_eleves
    ADD CONSTRAINT "PK_119895830d4f47178f7e747043f" PRIMARY KEY (id);


--
-- Name: backup_records PK_13c40e36547fe8bc4903891715b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_records
    ADD CONSTRAINT "PK_13c40e36547fe8bc4903891715b" PRIMARY KEY (id);


--
-- Name: relances_paiement PK_155a76a0c2916dab655fabe42f2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relances_paiement
    ADD CONSTRAINT "PK_155a76a0c2916dab655fabe42f2" PRIMARY KEY (id);


--
-- Name: cotisations PK_172886b32b01d4328d3b2066797; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotisations
    ADD CONSTRAINT "PK_172886b32b01d4328d3b2066797" PRIMARY KEY (id);


--
-- Name: etablissement_config PK_17b61b4ddc9d3b7fd8409bac1c2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etablissement_config
    ADD CONSTRAINT "PK_17b61b4ddc9d3b7fd8409bac1c2" PRIMARY KEY (id);


--
-- Name: messages PK_18325f38ae6de43878487eff986; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY (id);


--
-- Name: dashboard_layouts PK_1850c429674a715d8cb13769efb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_layouts
    ADD CONSTRAINT "PK_1850c429674a715d8cb13769efb" PRIMARY KEY (id);


--
-- Name: fonds_etablissement PK_18ac4e3a3c992b56cd2a521f674; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fonds_etablissement
    ADD CONSTRAINT "PK_18ac4e3a3c992b56cd2a521f674" PRIMARY KEY (id);


--
-- Name: audit_logs PK_1bb179d048bbc581caa3b013439; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY (id);


--
-- Name: scores_personnel PK_1c95933c642aee4bbc2061f3b3e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores_personnel
    ADD CONSTRAINT "PK_1c95933c642aee4bbc2061f3b3e" PRIMARY KEY (id);


--
-- Name: competences PK_1e02a716ddbcbed830e60d5cbbf; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competences
    ADD CONSTRAINT "PK_1e02a716ddbcbed830e60d5cbbf" PRIMARY KEY (id);


--
-- Name: demandes_depense PK_2495a5b336b32e198a29829cd05; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandes_depense
    ADD CONSTRAINT "PK_2495a5b336b32e198a29829cd05" PRIMARY KEY (id);


--
-- Name: message_read_status PK_258e8d92b4e212a121dc10a74d3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_read_status
    ADD CONSTRAINT "PK_258e8d92b4e212a121dc10a74d3" PRIMARY KEY (id);


--
-- Name: messages_fichiers PK_25f75ffce187dc5f6c935e0c40a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages_fichiers
    ADD CONSTRAINT "PK_25f75ffce187dc5f6c935e0c40a" PRIMARY KEY (id);


--
-- Name: fiches_metiers PK_28a7a8b2a81030ad536783a69ac; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiches_metiers
    ADD CONSTRAINT "PK_28a7a8b2a81030ad536783a69ac" PRIMARY KEY (id);


--
-- Name: types_personnel PK_28b6bc701aa920fb97ce58d6c05; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_personnel
    ADD CONSTRAINT "PK_28b6bc701aa920fb97ce58d6c05" PRIMARY KEY (id);


--
-- Name: incidents_sante PK_298961a1e82d488a1ecfb950eb8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_sante
    ADD CONSTRAINT "PK_298961a1e82d488a1ecfb950eb8" PRIMARY KEY (id);


--
-- Name: consommations_cantine PK_29c15f3bbf25ac68b0485a06448; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consommations_cantine
    ADD CONSTRAINT "PK_29c15f3bbf25ac68b0485a06448" PRIMARY KEY (id);


--
-- Name: parametres_systeme PK_29c742a50f0b5fef1de93c7b618; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_systeme
    ADD CONSTRAINT "PK_29c742a50f0b5fef1de93c7b618" PRIMARY KEY (id);


--
-- Name: bulletins PK_2a8a95dd56d5a3507074c35954e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT "PK_2a8a95dd56d5a3507074c35954e" PRIMARY KEY (id);


--
-- Name: categories_depense PK_2be9c88d818098ae28655b16bdd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_depense
    ADD CONSTRAINT "PK_2be9c88d818098ae28655b16bdd" PRIMARY KEY (id);


--
-- Name: annonce_ciblages PK_2d8c1229166853361988a01d181; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonce_ciblages
    ADD CONSTRAINT "PK_2d8c1229166853361988a01d181" PRIMARY KEY (id);


--
-- Name: bulletins_workflow PK_2f5934e160435474a6ed4e49db3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins_workflow
    ADD CONSTRAINT "PK_2f5934e160435474a6ed4e49db3" PRIMARY KEY (id);


--
-- Name: onboarding_recrutement PK_30138598c60dccfc70462e297ff; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_recrutement
    ADD CONSTRAINT "PK_30138598c60dccfc70462e297ff" PRIMARY KEY (id);


--
-- Name: regles_scoring_personnel PK_3107af83ec277a568c4f360c8ce; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regles_scoring_personnel
    ADD CONSTRAINT "PK_3107af83ec277a568c4f360c8ce" PRIMARY KEY (id);


--
-- Name: historique_scores PK_39f8244a0508eb56484ee248c61; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_scores
    ADD CONSTRAINT "PK_39f8244a0508eb56484ee248c61" PRIMARY KEY (id);


--
-- Name: candidatures PK_3d3816f972665a5f0b67e0fbf7d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures
    ADD CONSTRAINT "PK_3d3816f972665a5f0b67e0fbf7d" PRIMARY KEY (id);


--
-- Name: filieres PK_3d799060d5ff97fcdb46b25c507; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filieres
    ADD CONSTRAINT "PK_3d799060d5ff97fcdb46b25c507" PRIMARY KEY (id);


--
-- Name: prets_materiels PK_3f6f42c4f4d26550866907a1949; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prets_materiels
    ADD CONSTRAINT "PK_3f6f42c4f4d26550866907a1949" PRIMARY KEY (id);


--
-- Name: types_primes PK_405766875490a206abdd55598bd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_primes
    ADD CONSTRAINT "PK_405766875490a206abdd55598bd" PRIMARY KEY (id);


--
-- Name: mouvements_caisse PK_43c25227b8fe156a37bc7e9aa26; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mouvements_caisse
    ADD CONSTRAINT "PK_43c25227b8fe156a37bc7e9aa26" PRIMARY KEY (id);


--
-- Name: emploi_du_temps PK_44f25e7acc90107dc433dec9fa7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emploi_du_temps
    ADD CONSTRAINT "PK_44f25e7acc90107dc433dec9fa7" PRIMARY KEY (id);


--
-- Name: notification_providers PK_460779799f3a0f9e24507c537a1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_providers
    ADD CONSTRAINT "PK_460779799f3a0f9e24507c537a1" PRIMARY KEY (id);


--
-- Name: badges_utilisateurs PK_462d55abe3a771b161692c7dac8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges_utilisateurs
    ADD CONSTRAINT "PK_462d55abe3a771b161692c7dac8" PRIMARY KEY (id);


--
-- Name: materiels PK_46a33de7cd630abfc7fb0e3ba91; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materiels
    ADD CONSTRAINT "PK_46a33de7cd630abfc7fb0e3ba91" PRIMARY KEY (id);


--
-- Name: bulletins_paie PK_473b8b4009358202b818c648c5e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins_paie
    ADD CONSTRAINT "PK_473b8b4009358202b818c648c5e" PRIMARY KEY (id);


--
-- Name: sanctions_eleves PK_49749a22aa2ed4745b5ce5c413c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sanctions_eleves
    ADD CONSTRAINT "PK_49749a22aa2ed4745b5ce5c413c" PRIMARY KEY (id);


--
-- Name: observations_eleves PK_4ce6ba9ee91054eedf3c278d3a0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.observations_eleves
    ADD CONSTRAINT "PK_4ce6ba9ee91054eedf3c278d3a0" PRIMARY KEY (id);


--
-- Name: inscriptions_transport PK_4da2d89e2c34bd4b220ee1fd7af; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_transport
    ADD CONSTRAINT "PK_4da2d89e2c34bd4b220ee1fd7af" PRIMARY KEY (id);


--
-- Name: affectations_postes PK_50a4d50d2c321c5960e752995f9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_postes
    ADD CONSTRAINT "PK_50a4d50d2c321c5960e752995f9" PRIMARY KEY (id);


--
-- Name: comptes_caisse PK_50c6d09d78636e7a20d8f6e1db2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comptes_caisse
    ADD CONSTRAINT "PK_50c6d09d78636e7a20d8f6e1db2" PRIMARY KEY (id);


--
-- Name: evaluations_competences PK_51b4e5d7701097bef96dee11c96; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations_competences
    ADD CONSTRAINT "PK_51b4e5d7701097bef96dee11c96" PRIMARY KEY (id);


--
-- Name: fonds PK_52b31b39e2acccdc72af92fdade; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fonds
    ADD CONSTRAINT "PK_52b31b39e2acccdc72af92fdade" PRIMARY KEY (id);


--
-- Name: cycles PK_52e5eeb9c7c6e4ad1aed657967a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycles
    ADD CONSTRAINT "PK_52e5eeb9c7c6e4ad1aed657967a" PRIMARY KEY (id);


--
-- Name: consultations_medicales PK_5303bcf16d76000918476778c82; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations_medicales
    ADD CONSTRAINT "PK_5303bcf16d76000918476778c82" PRIMARY KEY (id);


--
-- Name: incidents_eleves PK_548a14b779a713e8b12658a7ba2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_eleves
    ADD CONSTRAINT "PK_548a14b779a713e8b12658a7ba2" PRIMARY KEY (id);


--
-- Name: modeles_documents PK_5be430e5ffca187cfbc3b1c9cb7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modeles_documents
    ADD CONSTRAINT "PK_5be430e5ffca187cfbc3b1c9cb7" PRIMARY KEY (id);


--
-- Name: recus_paiement PK_5c14254df9ce65a9bd2ec1a8796; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recus_paiement
    ADD CONSTRAINT "PK_5c14254df9ce65a9bd2ec1a8796" PRIMARY KEY (id);


--
-- Name: echeanciers_paiement PK_5d9667c193c1ef471299d8ac482; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeanciers_paiement
    ADD CONSTRAINT "PK_5d9667c193c1ef471299d8ac482" PRIMARY KEY (id);


--
-- Name: modeles_cartes PK_5effd7c316596a734ff99ee9464; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modeles_cartes
    ADD CONSTRAINT "PK_5effd7c316596a734ff99ee9464" PRIMARY KEY (id);


--
-- Name: affectations_matieres PK_5f1f62714143e872c9b5547b5e8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_matieres
    ADD CONSTRAINT "PK_5f1f62714143e872c9b5547b5e8" PRIMARY KEY (id);


--
-- Name: evenements_clubs PK_61d44eebff5bc5719fe5f40b71e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenements_clubs
    ADD CONSTRAINT "PK_61d44eebff5bc5719fe5f40b71e" PRIMARY KEY (id);


--
-- Name: absences_personnel PK_643a72d7e1b58a5c5996f0f853f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absences_personnel
    ADD CONSTRAINT "PK_643a72d7e1b58a5c5996f0f853f" PRIMARY KEY (id);


--
-- Name: unites_organisationnelles PK_645c4328d0a205f7047ad669140; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unites_organisationnelles
    ADD CONSTRAINT "PK_645c4328d0a205f7047ad669140" PRIMARY KEY (id);


--
-- Name: preferences_utilisateur PK_64e2707273bf518ff9942fa1340; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferences_utilisateur
    ADD CONSTRAINT "PK_64e2707273bf518ff9942fa1340" PRIMARY KEY (id);


--
-- Name: message_reactions PK_654a9f0059ff93a8f156be66a5b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT "PK_654a9f0059ff93a8f156be66a5b" PRIMARY KEY (id);


--
-- Name: incidents_personnel PK_66863d5c3adc4de0cb8d7e78b3a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_personnel
    ADD CONSTRAINT "PK_66863d5c3adc4de0cb8d7e78b3a" PRIMARY KEY (id);


--
-- Name: parametre_versions PK_67de75a01dd95030958851369d8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametre_versions
    ADD CONSTRAINT "PK_67de75a01dd95030958851369d8" PRIMARY KEY (id);


--
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- Name: elements_salaire PK_6c54d9ae0c5d1f14808172e2169; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.elements_salaire
    ADD CONSTRAINT "PK_6c54d9ae0c5d1f14808172e2169" PRIMARY KEY (id);


--
-- Name: message_mentions PK_6d3047d9fb0dd841366be90fb87; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_mentions
    ADD CONSTRAINT "PK_6d3047d9fb0dd841366be90fb87" PRIMARY KEY (id);


--
-- Name: annonces PK_6f27d25a69c00d8b1795919635d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT "PK_6f27d25a69c00d8b1795919635d" PRIMARY KEY (id);


--
-- Name: templates_emploi_du_temps PK_6fc6a15a90d3f422599537c3580; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates_emploi_du_temps
    ADD CONSTRAINT "PK_6fc6a15a90d3f422599537c3580" PRIMARY KEY (id);


--
-- Name: repartitions_horaires PK_6fedfaace0978537aab4332b612; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repartitions_horaires
    ADD CONSTRAINT "PK_6fedfaace0978537aab4332b612" PRIMARY KEY (id);


--
-- Name: groupes_etablissements PK_73e8bd392699a19962feb99fac2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupes_etablissements
    ADD CONSTRAINT "PK_73e8bd392699a19962feb99fac2" PRIMARY KEY (id);


--
-- Name: etablissements PK_7451c2494e724b35040748d0a65; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etablissements
    ADD CONSTRAINT "PK_7451c2494e724b35040748d0a65" PRIMARY KEY (id);


--
-- Name: menus_cantine PK_74605a2893fdcd8ae604333cd63; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus_cantine
    ADD CONSTRAINT "PK_74605a2893fdcd8ae604333cd63" PRIMARY KEY (id);


--
-- Name: groupe_etablissement_liens PK_78f60c719f67723383c4ecbfad6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe_etablissement_liens
    ADD CONSTRAINT "PK_78f60c719f67723383c4ecbfad6" PRIMARY KEY (id);


--
-- Name: eleves PK_7a8504c765ab74e9fc0bb4cc5a2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT "PK_7a8504c765ab74e9fc0bb4cc5a2" PRIMARY KEY (id);


--
-- Name: organisations PK_7bf54cba378d5b2f1d4c10ef4df; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT "PK_7bf54cba378d5b2f1d4c10ef4df" PRIMARY KEY (id);


--
-- Name: diplomes_eleves PK_7cf3cb08d32b6ff258d52d5cbd2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diplomes_eleves
    ADD CONSTRAINT "PK_7cf3cb08d32b6ff258d52d5cbd2" PRIMARY KEY (id);


--
-- Name: refresh_tokens PK_7d8bee0204106019488c4c50ffa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY (id);


--
-- Name: frais_scolarite PK_7d963c17f933634936fcd83818e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais_scolarite
    ADD CONSTRAINT "PK_7d963c17f933634936fcd83818e" PRIMARY KEY (id);


--
-- Name: inscriptions_options PK_7df728ba22bdf83d8e3cabcabfd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_options
    ADD CONSTRAINT "PK_7df728ba22bdf83d8e3cabcabfd" PRIMARY KEY (id);


--
-- Name: utilisateur_etablissements PK_82168f9601d3dfc1a5eac82f7f8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_etablissements
    ADD CONSTRAINT "PK_82168f9601d3dfc1a5eac82f7f8" PRIMARY KEY (id);


--
-- Name: preferences_emploi_du_temps PK_83a1290895380b549e8f156c73f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferences_emploi_du_temps
    ADD CONSTRAINT "PK_83a1290895380b549e8f156c73f" PRIMARY KEY (id);


--
-- Name: salles PK_86ee5dc42eba98a2c07006c3c10; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salles
    ADD CONSTRAINT "PK_86ee5dc42eba98a2c07006c3c10" PRIMARY KEY (id);


--
-- Name: contrats_personnel PK_872ce9eb3eefacb5da8d1e1bdcd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats_personnel
    ADD CONSTRAINT "PK_872ce9eb3eefacb5da8d1e1bdcd" PRIMARY KEY (id);


--
-- Name: annees_scolaires PK_8831a3a8fd62fc0600bdc68a798; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annees_scolaires
    ADD CONSTRAINT "PK_8831a3a8fd62fc0600bdc68a798" PRIMARY KEY (id);


--
-- Name: indisponibilites_enseignants PK_8a233ef824de7f010769fe3f436; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indisponibilites_enseignants
    ADD CONSTRAINT "PK_8a233ef824de7f010769fe3f436" PRIMARY KEY (id);


--
-- Name: badges PK_8a651318b8de577e8e217676466; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT "PK_8a651318b8de577e8e217676466" PRIMARY KEY (id);


--
-- Name: hierarchie_personnel PK_8ea6071fe78fc933c26d7b1a82b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hierarchie_personnel
    ADD CONSTRAINT "PK_8ea6071fe78fc933c26d7b1a82b" PRIMARY KEY (id);


--
-- Name: permissions PK_920331560282b8bd21bb02290df; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY (id);


--
-- Name: historique_scores_personnel PK_937eef23b88a05b71c2a824332b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_scores_personnel
    ADD CONSTRAINT "PK_937eef23b88a05b71c2a824332b" PRIMARY KEY (id);


--
-- Name: membres_personnel PK_93c09b4c9c902b616ac6556f61c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membres_personnel
    ADD CONSTRAINT "PK_93c09b4c9c902b616ac6556f61c" PRIMARY KEY (id);


--
-- Name: configuration_modules PK_953ec3c61cf7355f83cfa16e7fa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuration_modules
    ADD CONSTRAINT "PK_953ec3c61cf7355f83cfa16e7fa" PRIMARY KEY (id);


--
-- Name: responsables_eleves PK_969456a3a7df47b0f39a9077c3c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsables_eleves
    ADD CONSTRAINT "PK_969456a3a7df47b0f39a9077c3c" PRIMARY KEY (id);


--
-- Name: types_periodes PK_9856bf453ed13daa760c6becba6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_periodes
    ADD CONSTRAINT "PK_9856bf453ed13daa760c6becba6" PRIMARY KEY (id);


--
-- Name: inscriptions_clubs PK_98d498aef83114580e8eb26aacb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_clubs
    ADD CONSTRAINT "PK_98d498aef83114580e8eb26aacb" PRIMARY KEY (id);


--
-- Name: sondages PK_9b2b8e638588ebf77d25f8c747c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sondages
    ADD CONSTRAINT "PK_9b2b8e638588ebf77d25f8c747c" PRIMARY KEY (id);


--
-- Name: sondage_options PK_9c71fa3aa32abe573bbee6dce77; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sondage_options
    ADD CONSTRAINT "PK_9c71fa3aa32abe573bbee6dce77" PRIMARY KEY (id);


--
-- Name: budgets PK_9c8a51748f82387644b773da482; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT "PK_9c8a51748f82387644b773da482" PRIMARY KEY (id);


--
-- Name: matieres PK_9d1b2fd315e08119416bdba8678; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matieres
    ADD CONSTRAINT "PK_9d1b2fd315e08119416bdba8678" PRIMARY KEY (id);


--
-- Name: heures_cours PK_a076e4ba5026bf1fa8d70177a18; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heures_cours
    ADD CONSTRAINT "PK_a076e4ba5026bf1fa8d70177a18" PRIMARY KEY (id);


--
-- Name: comptes_bancaires PK_a40b0d7b8afb2fa2c9f1fec2831; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comptes_bancaires
    ADD CONSTRAINT "PK_a40b0d7b8afb2fa2c9f1fec2831" PRIMARY KEY (id);


--
-- Name: groupes_matieres PK_a467de10fbd6aa87dad2891e3c7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupes_matieres
    ADD CONSTRAINT "PK_a467de10fbd6aa87dad2891e3c7" PRIMARY KEY (id);


--
-- Name: templates_message PK_a622e84958ce05cd473c210532a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates_message
    ADD CONSTRAINT "PK_a622e84958ce05cd473c210532a" PRIMARY KEY (id);


--
-- Name: points_utilisateurs PK_a62ed4fc636b5d37357f588d3cf; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_utilisateurs
    ADD CONSTRAINT "PK_a62ed4fc636b5d37357f588d3cf" PRIMARY KEY (id);


--
-- Name: profils_utilisateurs PK_adf32c67db4b9b2f4243371fcf6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profils_utilisateurs
    ADD CONSTRAINT "PK_adf32c67db4b9b2f4243371fcf6" PRIMARY KEY (id);


--
-- Name: abonnements_parking PK_af5f06112024b70ec499a744b1b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonnements_parking
    ADD CONSTRAINT "PK_af5f06112024b70ec499a744b1b" PRIMARY KEY (id);


--
-- Name: notes PK_af6206538ea96c4e77e9f400c3d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY (id);


--
-- Name: depenses PK_aff8a5d136d64b19661ecd962eb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depenses
    ADD CONSTRAINT "PK_aff8a5d136d64b19661ecd962eb" PRIMARY KEY (id);


--
-- Name: dossiers_medicaux PK_b5bd684db07380e48785c97595b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_medicaux
    ADD CONSTRAINT "PK_b5bd684db07380e48785c97595b" PRIMARY KEY (id);


--
-- Name: places_parking PK_b92aa9df0e756000f0be9403c20; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places_parking
    ADD CONSTRAINT "PK_b92aa9df0e756000f0be9403c20" PRIMARY KEY (id);


--
-- Name: programme_chapitres PK_b9ddadfe51fa83203325fb089b1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programme_chapitres
    ADD CONSTRAINT "PK_b9ddadfe51fa83203325fb089b1" PRIMARY KEY (id);


--
-- Name: vehicules PK_ba3a47ea8be2150ea0533653b26; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicules
    ADD CONSTRAINT "PK_ba3a47ea8be2150ea0533653b26" PRIMARY KEY (id);


--
-- Name: dashboard_config PK_baf8d577a68a1046c02f6690377; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_config
    ADD CONSTRAINT "PK_baf8d577a68a1046c02f6690377" PRIMARY KEY (id);


--
-- Name: clubs PK_bb09bd0c8d5238aeaa8f86ee0d4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT "PK_bb09bd0c8d5238aeaa8f86ee0d4" PRIMARY KEY (id);


--
-- Name: affectations_eleves PK_bb38881b009586a8ad515d8e11c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_eleves
    ADD CONSTRAINT "PK_bb38881b009586a8ad515d8e11c" PRIMARY KEY (id);


--
-- Name: offres_emploi PK_bf2a5fcce5a29dd4f01c77013b0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_emploi
    ADD CONSTRAINT "PK_bf2a5fcce5a29dd4f01c77013b0" PRIMARY KEY (id);


--
-- Name: types_retenues PK_c09b76421ce889e41f9b9206a4c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_retenues
    ADD CONSTRAINT "PK_c09b76421ce889e41f9b9206a4c" PRIMARY KEY (id);


--
-- Name: roles PK_c1433d71a4838793a49dcad46ab; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY (id);


--
-- Name: profils_orientation PK_c1af1862aef679c1f674d25b8c1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profils_orientation
    ADD CONSTRAINT "PK_c1af1862aef679c1f674d25b8c1" PRIMARY KEY (id);


--
-- Name: historique_configuration PK_c5ddc0080de9c7944187d610acb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_configuration
    ADD CONSTRAINT "PK_c5ddc0080de9c7944187d610acb" PRIMARY KEY (id);


--
-- Name: lignes_transport PK_ca41391fb52a198127c175c0969; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_transport
    ADD CONSTRAINT "PK_ca41391fb52a198127c175c0969" PRIMARY KEY (id);


--
-- Name: specialites PK_cc797c095fa8d6ebf4372e4daa1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialites
    ADD CONSTRAINT "PK_cc797c095fa8d6ebf4372e4daa1" PRIMARY KEY (id);


--
-- Name: examens_nationaux PK_d0d2aacf549ed015ec34bafcf37; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens_nationaux
    ADD CONSTRAINT "PK_d0d2aacf549ed015ec34bafcf37" PRIMARY KEY (id);


--
-- Name: entretiens_recrutement PK_d1bb5e6db05a63c53a32eed8e82; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entretiens_recrutement
    ADD CONSTRAINT "PK_d1bb5e6db05a63c53a32eed8e82" PRIMARY KEY (id);


--
-- Name: preferences_globales PK_d2fd4d78679106324e1606ca9d7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferences_globales
    ADD CONSTRAINT "PK_d2fd4d78679106324e1606ca9d7" PRIMARY KEY (id);


--
-- Name: bulletins_matieres PK_d3768d99d765d7d199aa729fa39; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins_matieres
    ADD CONSTRAINT "PK_d3768d99d765d7d199aa729fa39" PRIMARY KEY (id);


--
-- Name: requetes PK_d3b6f0933d0e8fb736baf667683; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requetes
    ADD CONSTRAINT "PK_d3b6f0933d0e8fb736baf667683" PRIMARY KEY (id);


--
-- Name: utilisateurs PK_d3c39b551c51a0bdc76e07b9197; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT "PK_d3c39b551c51a0bdc76e07b9197" PRIMARY KEY (id);


--
-- Name: role_permissions PK_d430a02aad006d8a70f3acd7d03; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "PK_d430a02aad006d8a70f3acd7d03" PRIMARY KEY ("roleId", "permissionId");


--
-- Name: paiements PK_d7a1e0ef2ae0e3a50cc4f41c35e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT "PK_d7a1e0ef2ae0e3a50cc4f41c35e" PRIMARY KEY (id);


--
-- Name: types_contrat_personnalises PK_d8c749992d597b4c8e7d0345db6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_contrat_personnalises
    ADD CONSTRAINT "PK_d8c749992d597b4c8e7d0345db6" PRIMARY KEY (id);


--
-- Name: ecritures_comptables PK_d9c5bd8b51c271702b567d2a9ea; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecritures_comptables
    ADD CONSTRAINT "PK_d9c5bd8b51c271702b567d2a9ea" PRIMARY KEY (id);


--
-- Name: sondage_votes PK_dadfaf47b5e2797014040ded511; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sondage_votes
    ADD CONSTRAINT "PK_dadfaf47b5e2797014040ded511" PRIMARY KEY (id);


--
-- Name: participants_conversation PK_de8978490834e2e9cb3c3fc8066; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants_conversation
    ADD CONSTRAINT "PK_de8978490834e2e9cb3c3fc8066" PRIMARY KEY (id);


--
-- Name: evaluations_personnel PK_df404ad7fcbda8528f6320b6449; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations_personnel
    ADD CONSTRAINT "PK_df404ad7fcbda8528f6320b6449" PRIMARY KEY (id);


--
-- Name: inscriptions_cantine PK_dfed3f92eb13027888e9a4127da; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_cantine
    ADD CONSTRAINT "PK_dfed3f92eb13027888e9a4127da" PRIMARY KEY (id);


--
-- Name: classes PK_e207aa15404e9b2ce35910f9f7f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY (id);


--
-- Name: remises PK_e24bf952023595d863d0ec23e58; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remises
    ADD CONSTRAINT "PK_e24bf952023595d863d0ec23e58" PRIMARY KEY (id);


--
-- Name: configuration_app PK_e4bfadb63fd349c9bda52df7990; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuration_app
    ADD CONSTRAINT "PK_e4bfadb63fd349c9bda52df7990" PRIMARY KEY (id);


--
-- Name: types_enum PK_e4fda6a40fd6604326cd4aa94eb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_enum
    ADD CONSTRAINT "PK_e4fda6a40fd6604326cd4aa94eb" PRIMARY KEY (id);


--
-- Name: cartes PK_e6578a264984a9e419b4d2d768f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartes
    ADD CONSTRAINT "PK_e6578a264984a9e419b4d2d768f" PRIMARY KEY (id);


--
-- Name: utilisateur_permissions PK_e6a07d33fc867a2157b067992f3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_permissions
    ADD CONSTRAINT "PK_e6a07d33fc867a2157b067992f3" PRIMARY KEY (id);


--
-- Name: progressions_programme PK_e6f688b252df3e147df4258d88c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progressions_programme
    ADD CONSTRAINT "PK_e6f688b252df3e147df4258d88c" PRIMARY KEY (id);


--
-- Name: groupe_admins PK_e967c49b8724f195b84cdec88e1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe_admins
    ADD CONSTRAINT "PK_e967c49b8724f195b84cdec88e1" PRIMARY KEY (id);


--
-- Name: file_impressions PK_ed628206ed9241b899e9d7a7f2a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_impressions
    ADD CONSTRAINT "PK_ed628206ed9241b899e9d7a7f2a" PRIMARY KEY (id);


--
-- Name: presences_transport PK_edf43622c25f668dbf78e49838d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences_transport
    ADD CONSTRAINT "PK_edf43622c25f668dbf78e49838d" PRIMARY KEY (id);


--
-- Name: conversations PK_ee34f4f7ced4ec8681f26bf04ef; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY (id);


--
-- Name: workflows_validation PK_ee634b7f45e612332636bb7d9b2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflows_validation
    ADD CONSTRAINT "PK_ee634b7f45e612332636bb7d9b2" PRIMARY KEY (id);


--
-- Name: preferences_role PK_f1bbb0432aaa4d1a026c75a9fc2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferences_role
    ADD CONSTRAINT "PK_f1bbb0432aaa4d1a026c75a9fc2" PRIMARY KEY (id);


--
-- Name: felicitations_eleves PK_f24ecec1c96763d578f83a510e4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.felicitations_eleves
    ADD CONSTRAINT "PK_f24ecec1c96763d578f83a510e4" PRIMARY KEY (id);


--
-- Name: regles_scoring PK_f4b78dbf95cbac5577692807b1c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regles_scoring
    ADD CONSTRAINT "PK_f4b78dbf95cbac5577692807b1c" PRIMARY KEY (id);


--
-- Name: matieres_niveaux PK_f8209ba936d02d9fe0e902cfe25; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matieres_niveaux
    ADD CONSTRAINT "PK_f8209ba936d02d9fe0e902cfe25" PRIMARY KEY (id);


--
-- Name: lignes_budget PK_f847ea953748de8fd7c1792e54a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_budget
    ADD CONSTRAINT "PK_f847ea953748de8fd7c1792e54a" PRIMARY KEY (id);


--
-- Name: periodes PK_fbb1b6a1c8506908a685dd23c8a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodes
    ADD CONSTRAINT "PK_fbb1b6a1c8506908a685dd23c8a" PRIMARY KEY (id);


--
-- Name: niveaux PK_ff3a5c7e0ba1467c4c04f8ffec8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niveaux
    ADD CONSTRAINT "PK_ff3a5c7e0ba1467c4c04f8ffec8" PRIMARY KEY (id);


--
-- Name: membres_personnel REL_9525f299224d9c9d919fd94ca4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membres_personnel
    ADD CONSTRAINT "REL_9525f299224d9c9d919fd94ca4" UNIQUE ("utilisateurId");


--
-- Name: eleves REL_e0b9241e7ac9c1793d68d9a773; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT "REL_e0b9241e7ac9c1793d68d9a773" UNIQUE ("utilisateurId");


--
-- Name: etablissement_config REL_e961012440c8c9c14acc20383e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etablissement_config
    ADD CONSTRAINT "REL_e961012440c8c9c14acc20383e" UNIQUE ("etablissementId");


--
-- Name: profils_utilisateurs REL_ecb296e7df42f4b9a8e1cdf959; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profils_utilisateurs
    ADD CONSTRAINT "REL_ecb296e7df42f4b9a8e1cdf959" UNIQUE ("utilisateurId");


--
-- Name: lignes_budget UQ_06c9a0578a82fdb889c13427f89; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_budget
    ADD CONSTRAINT "UQ_06c9a0578a82fdb889c13427f89" UNIQUE ("budgetId", "categorieDepenseId");


--
-- Name: organisations UQ_06f3139d67205a125c84f8c6c45; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organisations
    ADD CONSTRAINT "UQ_06f3139d67205a125c84f8c6c45" UNIQUE (code);


--
-- Name: dashboard_config UQ_0c4e83d684a6d413caeb7006d5a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_config
    ADD CONSTRAINT "UQ_0c4e83d684a6d413caeb7006d5a" UNIQUE ("utilisateurId");


--
-- Name: places_parking UQ_141c8bfad7ccc97f028c5b76597; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places_parking
    ADD CONSTRAINT "UQ_141c8bfad7ccc97f028c5b76597" UNIQUE (numero);


--
-- Name: cotisations UQ_15ee3bad4775d6edb9712ddf732; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotisations
    ADD CONSTRAINT "UQ_15ee3bad4775d6edb9712ddf732" UNIQUE (code);


--
-- Name: preferences_role UQ_1a917351d07c72e8e13ed71bd98; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferences_role
    ADD CONSTRAINT "UQ_1a917351d07c72e8e13ed71bd98" UNIQUE ("roleId", cle);


--
-- Name: utilisateurs UQ_26a11d7c6a276a8c62833bd3d95; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT "UQ_26a11d7c6a276a8c62833bd3d95" UNIQUE ("qrCodeId");


--
-- Name: requetes UQ_28cb86a7b4e8706dd5c113b9b74; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requetes
    ADD CONSTRAINT "UQ_28cb86a7b4e8706dd5c113b9b74" UNIQUE (numero);


--
-- Name: types_retenues UQ_3dc6778dc70c5fbb927f408c415; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_retenues
    ADD CONSTRAINT "UQ_3dc6778dc70c5fbb927f408c415" UNIQUE (code);


--
-- Name: refresh_tokens UQ_4542dd2f38a61354a040ba9fd57; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE (token);


--
-- Name: badges UQ_48fe47e292737e09162b08c4f7c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT "UQ_48fe47e292737e09162b08c4f7c" UNIQUE (code);


--
-- Name: ecritures_comptables UQ_60c2ab9a1b657dabba5a40140b0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecritures_comptables
    ADD CONSTRAINT "UQ_60c2ab9a1b657dabba5a40140b0" UNIQUE ("numeroPiece");


--
-- Name: preferences_globales UQ_62f45b482f22c80243dd922693b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferences_globales
    ADD CONSTRAINT "UQ_62f45b482f22c80243dd922693b" UNIQUE ("etablissementId", cle);


--
-- Name: etablissements UQ_67c1aa8e2725cd00c265bf84eaa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etablissements
    ADD CONSTRAINT "UQ_67c1aa8e2725cd00c265bf84eaa" UNIQUE ("codeEtablissement");


--
-- Name: types_personnel UQ_68343c0f3c24023eabf64e9989f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_personnel
    ADD CONSTRAINT "UQ_68343c0f3c24023eabf64e9989f" UNIQUE (code);


--
-- Name: utilisateurs UQ_6b14325a486fe68d16aa889e4dc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT "UQ_6b14325a486fe68d16aa889e4dc" UNIQUE (email);


--
-- Name: categories_depense UQ_72825f522c5a5c5c8538c6dd303; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_depense
    ADD CONSTRAINT "UQ_72825f522c5a5c5c8538c6dd303" UNIQUE (code);


--
-- Name: eleves UQ_786dcbf563668eb207b2359b33b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT "UQ_786dcbf563668eb207b2359b33b" UNIQUE (matricule);


--
-- Name: bons_commande UQ_84045ffa154152ccb8d63dff998; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bons_commande
    ADD CONSTRAINT "UQ_84045ffa154152ccb8d63dff998" UNIQUE ("numeroBon");


--
-- Name: factures_fournisseur UQ_8bf54b530c28bf9528d45d18027; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factures_fournisseur
    ADD CONSTRAINT "UQ_8bf54b530c28bf9528d45d18027" UNIQUE ("numeroFacture");


--
-- Name: permissions UQ_8dad765629e83229da6feda1c1d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "UQ_8dad765629e83229da6feda1c1d" UNIQUE (code);


--
-- Name: bulletins_workflow UQ_9938885de58b812d3d6ab50d126; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins_workflow
    ADD CONSTRAINT "UQ_9938885de58b812d3d6ab50d126" UNIQUE ("bulletinId");


--
-- Name: cartes UQ_9d3a6d100e02a7d644c8575ae2b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartes
    ADD CONSTRAINT "UQ_9d3a6d100e02a7d644c8575ae2b" UNIQUE ("numeroCarte");


--
-- Name: utilisateur_permissions UQ_a60e8220aef64506e33b658c432; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_permissions
    ADD CONSTRAINT "UQ_a60e8220aef64506e33b658c432" UNIQUE ("utilisateurId", "permissionId");


--
-- Name: sanctions_eleves UQ_ab7d577d38a679547192a161b86; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sanctions_eleves
    ADD CONSTRAINT "UQ_ab7d577d38a679547192a161b86" UNIQUE ("incidentId");


--
-- Name: mouvements_caisse UQ_ae8f96467da65981f307be56a16; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mouvements_caisse
    ADD CONSTRAINT "UQ_ae8f96467da65981f307be56a16" UNIQUE ("numeroOperation");


--
-- Name: depenses UQ_b6afbabb03b835a6398c8100968; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depenses
    ADD CONSTRAINT "UQ_b6afbabb03b835a6398c8100968" UNIQUE ("numeroPiece");


--
-- Name: recus_paiement UQ_b9bb181c652282ff699aef8062a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recus_paiement
    ADD CONSTRAINT "UQ_b9bb181c652282ff699aef8062a" UNIQUE ("numeroRecu");


--
-- Name: groupes_etablissements UQ_beafe4b18261d02851e17251928; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupes_etablissements
    ADD CONSTRAINT "UQ_beafe4b18261d02851e17251928" UNIQUE (code);


--
-- Name: utilisateurs UQ_c72fb651a0c656175a6146af8d4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT "UQ_c72fb651a0c656175a6146af8d4" UNIQUE (matricule);


--
-- Name: paiements UQ_c982cde17618f449f471001cb2a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT "UQ_c982cde17618f449f471001cb2a" UNIQUE ("numeroRecu");


--
-- Name: utilisateurs UQ_d3a35a0b10f22a643c88849e631; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT "UQ_d3a35a0b10f22a643c88849e631" UNIQUE (pseudonyme);


--
-- Name: membres_personnel UQ_da6f23a32dd7e5ddb8782dbae1e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membres_personnel
    ADD CONSTRAINT "UQ_da6f23a32dd7e5ddb8782dbae1e" UNIQUE (matricule);


--
-- Name: budgets UQ_e4532e3ee838cbafc67c349c393; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT "UQ_e4532e3ee838cbafc67c349c393" UNIQUE (code, "etablissementId");


--
-- Name: types_periodes UQ_f086a21dd56b9910fb4836a6325; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_periodes
    ADD CONSTRAINT "UQ_f086a21dd56b9910fb4836a6325" UNIQUE (code);


--
-- Name: examens_nationaux UQ_f277b48019cf75814d100814c26; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens_nationaux
    ADD CONSTRAINT "UQ_f277b48019cf75814d100814c26" UNIQUE (code);


--
-- Name: roles UQ_f6d54f95c31b73fb1bdd8e91d0c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c" UNIQUE (code);


--
-- Name: types_primes UQ_f8411d48631934f08bbbbc6e854; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_primes
    ADD CONSTRAINT "UQ_f8411d48631934f08bbbbc6e854" UNIQUE (code);


--
-- Name: IDX_00aa897a1c410a0564b320324c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_00aa897a1c410a0564b320324c" ON public.sondages USING btree ("etablissementId");


--
-- Name: IDX_00c1425b6eef7395746dda588e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_00c1425b6eef7395746dda588e" ON public.onboarding_recrutement USING btree (statut);


--
-- Name: IDX_0213eb53a6a22a3b3dc4f8718b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0213eb53a6a22a3b3dc4f8718b" ON public.message_reactions USING btree ("messageId", emoji);


--
-- Name: IDX_023cec097edf6e74a36ee6ad06; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_023cec097edf6e74a36ee6ad06" ON public.incidents_eleves USING btree ("anneeScolaireId", "periodeId");


--
-- Name: IDX_02c84c65975d347b6e7e1074ee; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_02c84c65975d347b6e7e1074ee" ON public.matieres_niveaux USING btree ("matiereId", "niveauId", "filiereId");


--
-- Name: IDX_02cd4f127a6c2dbbc7a458fb7c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_02cd4f127a6c2dbbc7a458fb7c" ON public.incidents_eleves USING btree ("anneeScolaireId");


--
-- Name: IDX_02dcb3c796de305cf02dbbf317; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_02dcb3c796de305cf02dbbf317" ON public.evaluations_competences USING btree ("noteId", "competenceId");


--
-- Name: IDX_02e58c07df560722903becc6d3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_02e58c07df560722903becc6d3" ON public.abonnements_parking USING btree ("vehiculeId");


--
-- Name: IDX_037d6f64423d9a769a73fe9497; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_037d6f64423d9a769a73fe9497" ON public.scores_personnel USING btree ("typePersonnelId");


--
-- Name: IDX_03cd211c73b78a17ee6295cf71; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_03cd211c73b78a17ee6295cf71" ON public.affectations_matieres USING btree ("classeId");


--
-- Name: IDX_04592f66fcda6d10bfbe8bf216; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_04592f66fcda6d10bfbe8bf216" ON public.inscriptions_transport USING btree ("ligneId");


--
-- Name: IDX_048f7796e1e2d69cfdf258feee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_048f7796e1e2d69cfdf258feee" ON public.historique_configuration USING btree ("utilisateurId", "createdAt");


--
-- Name: IDX_04db1e5ab69e83a9fa4330291c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_04db1e5ab69e83a9fa4330291c" ON public.affectations_eleves USING btree ("eleveId", "anneeScolaireId", statut);


--
-- Name: IDX_04fbff728d776e1a8c7d0afd2b; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_04fbff728d776e1a8c7d0afd2b" ON public.bulletins_paie USING btree ("membrePersonnelId", annee, mois);


--
-- Name: IDX_051b854e33b970b0be2eeb9008; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_051b854e33b970b0be2eeb9008" ON public.postes USING btree (type);


--
-- Name: IDX_052893362b8715cbd20baf6763; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_052893362b8715cbd20baf6763" ON public.regles_scoring_personnel USING btree ("estActif");


--
-- Name: IDX_052fc819381981dbb388a89a73; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_052fc819381981dbb388a89a73" ON public.dashboard_layouts USING btree ("utilisateurId", "etablissementId");


--
-- Name: IDX_05810701d95a5e720aeef28e63; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_05810701d95a5e720aeef28e63" ON public.types_retenues USING btree ("etablissementId");


--
-- Name: IDX_05a48cfccfac1e09899cf9c68d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_05a48cfccfac1e09899cf9c68d" ON public.incidents_sante USING btree ("dateIncident");


--
-- Name: IDX_06462d7d58310ee11fbf5bcd3f; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_06462d7d58310ee11fbf5bcd3f" ON public.fonds_etablissement USING btree ("etablissementId", "fondId");


--
-- Name: IDX_06792d0c62ce6b0203c03643cd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_06792d0c62ce6b0203c03643cd" ON public.role_permissions USING btree ("permissionId");


--
-- Name: IDX_06a536a60bb4f3a1c142285d05; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_06a536a60bb4f3a1c142285d05" ON public.niveaux USING btree ("cycleId");


--
-- Name: IDX_092695eff6c98a9ea054addf3f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_092695eff6c98a9ea054addf3f" ON public.parametre_versions USING btree ("modifiedBy", "createdAt");


--
-- Name: IDX_0a2ff4ffad5c8d1aae1b2f9738; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0a2ff4ffad5c8d1aae1b2f9738" ON public.templates_sondage USING btree ("etablissementId");


--
-- Name: IDX_0b3685cea9649dc51ac162cee8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0b3685cea9649dc51ac162cee8" ON public.vehicules USING btree ("proprietaireId");


--
-- Name: IDX_0b87c15cf94399b94aa3b03acf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0b87c15cf94399b94aa3b03acf" ON public.demandes_depense USING btree ("demandeurId");


--
-- Name: IDX_0bddad4e367d512582b17d62d0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0bddad4e367d512582b17d62d0" ON public.preferences_emploi_du_temps USING btree ("etablissementId");


--
-- Name: IDX_0c4e83d684a6d413caeb7006d5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0c4e83d684a6d413caeb7006d5" ON public.dashboard_config USING btree ("utilisateurId");


--
-- Name: IDX_0cad5d78e37125153f112c3822; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0cad5d78e37125153f112c3822" ON public.classes USING btree ("anneeScolaireId");


--
-- Name: IDX_0ccad6be7ad406727209720c96; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0ccad6be7ad406727209720c96" ON public.affectations_postes USING btree ("membrePersonnelId", "dateDebut", "dateFin");


--
-- Name: IDX_0cd0b77d41cf5a1d7636b5c04d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0cd0b77d41cf5a1d7636b5c04d" ON public.postes USING btree (statut);


--
-- Name: IDX_0d4e0bd9145b797a04c46ee0c7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0d4e0bd9145b797a04c46ee0c7" ON public.backup_records USING btree ("etablissementId");


--
-- Name: IDX_0e78d9fc39b61e85c1171c900b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0e78d9fc39b61e85c1171c900b" ON public.requetes USING btree ("etablissementId");


--
-- Name: IDX_0ec936941eb8556fcd7a1f0eae; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0ec936941eb8556fcd7a1f0eae" ON public.audit_logs USING btree (action, "createdAt");


--
-- Name: IDX_0f4ffec17e72e7513362434352; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0f4ffec17e72e7513362434352" ON public.affectations_eleves USING btree ("etablissementId");


--
-- Name: IDX_0f5eb91cfae746f29a32bc5062; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0f5eb91cfae746f29a32bc5062" ON public.cycles USING btree ("etablissementId");


--
-- Name: IDX_1067efff75498a4372e388e5eb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1067efff75498a4372e388e5eb" ON public.bulletins_matieres USING btree ("bulletinId");


--
-- Name: IDX_118dda165594d4998aceb7128a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_118dda165594d4998aceb7128a" ON public.programme_chapitres USING btree ("etablissementId");


--
-- Name: IDX_11b77896afdf08cd24dbdfb0dc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_11b77896afdf08cd24dbdfb0dc" ON public.sanctions_eleves USING btree ("anneeScolaireId", "periodeId");


--
-- Name: IDX_12372119d661a9201eaa9e0a36; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_12372119d661a9201eaa9e0a36" ON public.observations_eleves USING btree ("anneeScolaireId", "periodeId");


--
-- Name: IDX_12650af22b2e3d5e7692bd403d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_12650af22b2e3d5e7692bd403d" ON public.bulletins USING btree ("eleveId");


--
-- Name: IDX_12e6733e1bccb8071308c955c7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_12e6733e1bccb8071308c955c7" ON public.specialites USING btree ("filiereId");


--
-- Name: IDX_12fdf253a06141c23adf5263ce; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_12fdf253a06141c23adf5263ce" ON public.parametre_versions USING btree ("parametreId", version);


--
-- Name: IDX_14373ccfac8141ee48fc2cd0ab; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_14373ccfac8141ee48fc2cd0ab" ON public.types_contrat_personnalises USING btree (code, "etablissementId");


--
-- Name: IDX_14387396667b3df507e470f2c7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_14387396667b3df507e470f2c7" ON public.depenses USING btree ("categorieDepenseId");


--
-- Name: IDX_14847ba3ba3f41893bd5c5dabe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_14847ba3ba3f41893bd5c5dabe" ON public.incidents_sante USING btree (type);


--
-- Name: IDX_14cf171ba6aa049af98eb83fff; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_14cf171ba6aa049af98eb83fff" ON public.bulletins USING btree ("classeId");


--
-- Name: IDX_14d23287948d85e6b62b6546c7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_14d23287948d85e6b62b6546c7" ON public.matieres_niveaux USING btree ("matiereId");


--
-- Name: IDX_14d63664ce01e6890810858d03; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_14d63664ce01e6890810858d03" ON public.inscriptions_cantine USING btree ("eleveId");


--
-- Name: IDX_1543bfe89e52a01b6d8c759562; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1543bfe89e52a01b6d8c759562" ON public.absences_personnel USING btree ("membrePersonnelId");


--
-- Name: IDX_15ee3bad4775d6edb9712ddf73; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_15ee3bad4775d6edb9712ddf73" ON public.cotisations USING btree (code);


--
-- Name: IDX_1672a70cfad908fa8c68f1d7f7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1672a70cfad908fa8c68f1d7f7" ON public.sondages USING btree ("auteurId");


--
-- Name: IDX_1689637578e3165c29b409e3d8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1689637578e3165c29b409e3d8" ON public.modeles_cartes USING btree (type);


--
-- Name: IDX_16e5dad6fd0d3f4ab15c6d22ac; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_16e5dad6fd0d3f4ab15c6d22ac" ON public.salles USING btree ("etablissementId");


--
-- Name: IDX_17bbddaeb58553dd2fb1508e6f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_17bbddaeb58553dd2fb1508e6f" ON public.messages USING btree ("etablissementId", "expediteurId");


--
-- Name: IDX_1887500448d4621ca5723752a5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1887500448d4621ca5723752a5" ON public.message_mentions USING btree ("mentionneId", lu);


--
-- Name: IDX_1900cfdf6558edf01389db2818; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1900cfdf6558edf01389db2818" ON public.bulletins USING btree ("periodeId");


--
-- Name: IDX_198fd23880fdeee239f10c8a40; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_198fd23880fdeee239f10c8a40" ON public.incidents_eleves USING btree ("eleveId", "dateIncident");


--
-- Name: IDX_19ed7530adeaf5ac4cedf0443f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_19ed7530adeaf5ac4cedf0443f" ON public.preferences_utilisateur USING btree ("etablissementId");


--
-- Name: IDX_1ac2df5bfacc8b5e3f498ebfc0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1ac2df5bfacc8b5e3f498ebfc0" ON public.classes USING btree ("niveauId");


--
-- Name: IDX_1c6ad5e628415ec0613ab83942; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1c6ad5e628415ec0613ab83942" ON public.demandes_depense USING btree (statut);


--
-- Name: IDX_1ca792946391215c4e1e4a7a53; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1ca792946391215c4e1e4a7a53" ON public.notes USING btree ("etablissementId", "periodeId");


--
-- Name: IDX_1cd46de3c5de68425d69417a95; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1cd46de3c5de68425d69417a95" ON public.hierarchie_personnel USING btree ("etablissementId");


--
-- Name: IDX_1d738616d2aa096d72e5fdb292; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1d738616d2aa096d72e5fdb292" ON public.offres_emploi USING btree ("etablissementId");


--
-- Name: IDX_1dc82f957b4638c63ff7055dbe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1dc82f957b4638c63ff7055dbe" ON public.recus_paiement USING btree ("paiementId");


--
-- Name: IDX_1ded106d27f51c21e471486bca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1ded106d27f51c21e471486bca" ON public.offres_emploi USING btree ("posteId");


--
-- Name: IDX_1e097b5ebb2dfbd0d1d04ada8c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1e097b5ebb2dfbd0d1d04ada8c" ON public.remises USING btree ("scopeRemise", "etablissementId");


--
-- Name: IDX_20d3c6a02c7afbc72ef19ab410; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_20d3c6a02c7afbc72ef19ab410" ON public.bulletins_paie USING btree ("etablissementId", annee, mois);


--
-- Name: IDX_216f8a0ada8de9f23d00d7d23b; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_216f8a0ada8de9f23d00d7d23b" ON public.message_read_status USING btree ("messageId", "utilisateurId");


--
-- Name: IDX_21c17286924b3857f66c2c236a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_21c17286924b3857f66c2c236a" ON public.sanctions_eleves USING btree ("eleveId");


--
-- Name: IDX_23a6994b9318c431c736a50471; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_23a6994b9318c431c736a50471" ON public.sondage_votes USING btree ("utilisateurId");


--
-- Name: IDX_23c41bbe5ca7a415c45ef156ff; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_23c41bbe5ca7a415c45ef156ff" ON public.incidents_eleves USING btree ("anneeScolaireId", "eleveId");


--
-- Name: IDX_23d1bb72ab7b0832fa7723ecb6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_23d1bb72ab7b0832fa7723ecb6" ON public.candidatures USING btree ("offreEmploiId", statut);


--
-- Name: IDX_2502fdb5b5201278fdef7b72aa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2502fdb5b5201278fdef7b72aa" ON public.progressions_programme USING btree ("classeId");


--
-- Name: IDX_253afb50c73bf4adf1429b6fd8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_253afb50c73bf4adf1429b6fd8" ON public.repartitions_horaires USING btree ("jourSemaine");


--
-- Name: IDX_25b7d20074aa094e7c50022b12; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_25b7d20074aa094e7c50022b12" ON public.lignes_transport USING btree (actif);


--
-- Name: IDX_25c8c262ce5d560b22ca7432cf; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_25c8c262ce5d560b22ca7432cf" ON public.parametres_systeme USING btree (cle, "etablissementId");


--
-- Name: IDX_25d8f2a02f453811ea774d8188; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_25d8f2a02f453811ea774d8188" ON public.historique_scores_personnel USING btree ("createdAt");


--
-- Name: IDX_264a2db6ac53414682b2adebcc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_264a2db6ac53414682b2adebcc" ON public.scores_personnel USING btree ("membrePersonnelId");


--
-- Name: IDX_26a11d7c6a276a8c62833bd3d9; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_26a11d7c6a276a8c62833bd3d9" ON public.utilisateurs USING btree ("qrCodeId");


--
-- Name: IDX_26c1930f69d6c4488a1e493db0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_26c1930f69d6c4488a1e493db0" ON public.heures_cours USING btree ("periodeId");


--
-- Name: IDX_28b165651962e61585f6fe415a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_28b165651962e61585f6fe415a" ON public.offres_emploi USING btree ("dateLimite");


--
-- Name: IDX_28f333f59baa577aff134c679c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_28f333f59baa577aff134c679c" ON public.felicitations_eleves USING btree ("anneeScolaireId", "periodeId");


--
-- Name: IDX_295097df403e1811989fb6d3a2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_295097df403e1811989fb6d3a2" ON public.unites_organisationnelles USING btree ("organisationId");


--
-- Name: IDX_299494b1f516e6b0c42d3bef20; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_299494b1f516e6b0c42d3bef20" ON public.unites_organisationnelles USING btree (type);


--
-- Name: IDX_2a0286fbf4f42ad02f032c7165; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2a0286fbf4f42ad02f032c7165" ON public.templates_message USING btree ("etablissementId", categorie, actif);


--
-- Name: IDX_2b0c07ab0821287fb73d31b44b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2b0c07ab0821287fb73d31b44b" ON public.heures_cours USING btree ("enseignantId");


--
-- Name: IDX_2ba0bab4fa54ed62cbf2c1f778; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2ba0bab4fa54ed62cbf2c1f778" ON public.inscriptions_transport USING btree (actif);


--
-- Name: IDX_2baa7c6db65b89d359cdb2bab4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2baa7c6db65b89d359cdb2bab4" ON public.sondage_options USING btree ("sondageId");


--
-- Name: IDX_2c1426a4302c0107cbfcf3f2a7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2c1426a4302c0107cbfcf3f2a7" ON public.sanctions_eleves USING btree ("periodeId");


--
-- Name: IDX_2c653de3980ff7311914a72d34; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2c653de3980ff7311914a72d34" ON public.repartitions_horaires USING btree ("affectationId");


--
-- Name: IDX_2caca610f229c044a34f5fda90; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2caca610f229c044a34f5fda90" ON public.message_read_status USING btree ("utilisateurId", "luA");


--
-- Name: IDX_2ce4b7f24a0b6c4101b91c7161; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2ce4b7f24a0b6c4101b91c7161" ON public.entretiens_recrutement USING btree ("dateEntretien");


--
-- Name: IDX_2d1ce964cec16f4832292b43b2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2d1ce964cec16f4832292b43b2" ON public.entretiens_recrutement USING btree ("evaluateurId");


--
-- Name: IDX_2d6debc2f73895fef341f16497; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2d6debc2f73895fef341f16497" ON public.types_contrat_personnalises USING btree (categorie);


--
-- Name: IDX_2dc666e04cb3270901236dc8d3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2dc666e04cb3270901236dc8d3" ON public.organisations USING btree ("etablissementId");


--
-- Name: IDX_2de676a2ccbd8f91971623585d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2de676a2ccbd8f91971623585d" ON public.candidatures USING btree (telephone);


--
-- Name: IDX_2f2261d893edd62e185280c422; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_2f2261d893edd62e185280c422" ON public.groupe_admins USING btree ("groupeId", "utilisateurId");


--
-- Name: IDX_2f5c30dc42d4f3924fb4519200; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2f5c30dc42d4f3924fb4519200" ON public.incidents_personnel USING btree ("periodeId");


--
-- Name: IDX_30602c707518811cefc7d64399; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_30602c707518811cefc7d64399" ON public.offres_emploi USING btree (statut);


--
-- Name: IDX_30e84d7b772bd4e1281a463e34; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_30e84d7b772bd4e1281a463e34" ON public.annees_scolaires USING btree (libelle, "etablissementId");


--
-- Name: IDX_30ec2db1af37a3065937e3f1fe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_30ec2db1af37a3065937e3f1fe" ON public.consultations_medicales USING btree ("periodeId");


--
-- Name: IDX_312f76bc039e60e22c4eec94a0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_312f76bc039e60e22c4eec94a0" ON public.affectations_postes USING btree (statut);


--
-- Name: IDX_31496022684c30df6cb98ef8b3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_31496022684c30df6cb98ef8b3" ON public.regles_scoring_personnel USING btree ("typeAction");


--
-- Name: IDX_31a63e8e24198bd0965f908f47; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_31a63e8e24198bd0965f908f47" ON public.eleves USING btree (nom, prenom);


--
-- Name: IDX_329dcae45f2d2b23c6b2f8531f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_329dcae45f2d2b23c6b2f8531f" ON public.utilisateur_permissions USING btree ("permissionId");


--
-- Name: IDX_3372679a3041b4cb5698c6074a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3372679a3041b4cb5698c6074a" ON public.vehicules USING btree (immatriculation);


--
-- Name: IDX_33afb32936e1ff0c0afd751d21; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_33afb32936e1ff0c0afd751d21" ON public.affectations_matieres USING btree ("etablissementId");


--
-- Name: IDX_358a4de603e8aa860e597c1ff6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_358a4de603e8aa860e597c1ff6" ON public.inscriptions_options USING btree ("eleveId");


--
-- Name: IDX_35c8b97fd1ccfcccb91e035077; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_35c8b97fd1ccfcccb91e035077" ON public.tentatives_connexion USING btree ("adresseIp", "bloqueJusqua");


--
-- Name: IDX_35ddf0f00aaedd9b4bd19f1f49; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_35ddf0f00aaedd9b4bd19f1f49" ON public.permissions USING btree (module, action);


--
-- Name: IDX_369f4956359c928c86cb494954; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_369f4956359c928c86cb494954" ON public.rdv_orientation USING btree ("eleveId", date);


--
-- Name: IDX_38040eec6bcdce992a74429cea; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_38040eec6bcdce992a74429cea" ON public.historique_scores_personnel USING btree ("membrePersonnelId", "anneeScolaireId");


--
-- Name: IDX_38721c3662d1c187d9b1e81be6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_38721c3662d1c187d9b1e81be6" ON public.paiements USING btree ("echeancierId");


--
-- Name: IDX_3934c122525f0557e7f4fbf9e5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3934c122525f0557e7f4fbf9e5" ON public.depenses USING btree (statut);


--
-- Name: IDX_39bc3518c5e080d9ca9ed3cd56; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_39bc3518c5e080d9ca9ed3cd56" ON public.inscriptions_clubs USING btree ("etablissementId");


--
-- Name: IDX_39dcf34b18d7a54eff2b96d058; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_39dcf34b18d7a54eff2b96d058" ON public.inscriptions_options USING btree ("anneeScolaireId");


--
-- Name: IDX_3a06c447f4f000c7b9d714dc83; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3a06c447f4f000c7b9d714dc83" ON public.classes USING btree ("etablissementId", "anneeScolaireId");


--
-- Name: IDX_3a3232be75316fae0b3f14db3f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3a3232be75316fae0b3f14db3f" ON public.incidents_personnel USING btree ("anneeScolaireId", "periodeId");


--
-- Name: IDX_3ab8a27316e0a2c06279630ce7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3ab8a27316e0a2c06279630ce7" ON public.periodes USING btree ("typeId");


--
-- Name: IDX_3b32ae40c5326647d268104674; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3b32ae40c5326647d268104674" ON public.hierarchie_personnel USING btree ("typeRelation");


--
-- Name: IDX_3b96a63d60901701094a6c6f2b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3b96a63d60901701094a6c6f2b" ON public.evaluations_enseignants USING btree (categorie);


--
-- Name: IDX_3b9e2acf3ff3aefdd313bd0e6e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3b9e2acf3ff3aefdd313bd0e6e" ON public.emploi_du_temps USING btree ("salleId");


--
-- Name: IDX_3bf61655002e278e71e0fee86f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3bf61655002e278e71e0fee86f" ON public.offres_emploi USING btree ("datePublication");


--
-- Name: IDX_3cef4bf0307a59d471c10901c3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3cef4bf0307a59d471c10901c3" ON public.workflows_validation USING btree (module, "entiteId");


--
-- Name: IDX_3da4510a4f54bc5ddedb31cdf7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3da4510a4f54bc5ddedb31cdf7" ON public.programme_chapitres USING btree ("matiereNiveauId");


--
-- Name: IDX_3dc6778dc70c5fbb927f408c41; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_3dc6778dc70c5fbb927f408c41" ON public.types_retenues USING btree (code);


--
-- Name: IDX_3e35f44d14ae456197b765d438; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3e35f44d14ae456197b765d438" ON public.scores_personnel USING btree ("scoreGlobal");


--
-- Name: IDX_3ea308adae4192c4c611a212b7; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_3ea308adae4192c4c611a212b7" ON public.bulletins USING btree ("createdAt");


--
-- Name: IDX_3ee5535940a6120cb705bf6ddb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3ee5535940a6120cb705bf6ddb" ON public.templates_emploi_du_temps USING btree ("etablissementId");


--
-- Name: IDX_3f503a9141a6d4f4c92aab447d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3f503a9141a6d4f4c92aab447d" ON public.annonce_ciblages USING btree ("annonceId");


--
-- Name: IDX_3fc121afd6d48a8852d43f7018; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_3fc121afd6d48a8852d43f7018" ON public.comptes_bancaires USING btree ("etablissementId");


--
-- Name: IDX_40cc084427b093f882b21d3055; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_40cc084427b093f882b21d3055" ON public.examens_nationaux USING btree ("niveauId");


--
-- Name: IDX_40f05b610b524f3e712cdc8db8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_40f05b610b524f3e712cdc8db8" ON public.periodes USING btree ("etablissementId");


--
-- Name: IDX_4128d4893c2f08bff1d13e300b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4128d4893c2f08bff1d13e300b" ON public.elements_salaire USING btree (categorie);


--
-- Name: IDX_413b324f95642d04b8efe3128d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_413b324f95642d04b8efe3128d" ON public.contrats_personnel USING btree ("typeContrat");


--
-- Name: IDX_41572a89b9c9499ecb4745802d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_41572a89b9c9499ecb4745802d" ON public.unites_organisationnelles USING btree (code);


--
-- Name: IDX_416ddf0ab3b0e586f4aac94876; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_416ddf0ab3b0e586f4aac94876" ON public.vehicules USING btree ("etablissementId", "proprietaireId");


--
-- Name: IDX_418055b3c944fefb09bad068c1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_418055b3c944fefb09bad068c1" ON public.preferences_globales USING btree ("etablissementId");


--
-- Name: IDX_42c4e1d517b9673fa8da6fc542; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_42c4e1d517b9673fa8da6fc542" ON public.regles_scoring_personnel USING btree ("categorieCible");


--
-- Name: IDX_451947229942dee3c31b8b7021; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_451947229942dee3c31b8b7021" ON public.message_mentions USING btree ("messageId");


--
-- Name: IDX_45d023e383b5aaf8746d56a87a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_45d023e383b5aaf8746d56a87a" ON public.templates_emploi_du_temps USING btree (nom);


--
-- Name: IDX_464bd4e54c5bb6f98d3604b068; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_464bd4e54c5bb6f98d3604b068" ON public.evaluations_personnel USING btree (periode);


--
-- Name: IDX_465ba2f1996092519cb2a1334a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_465ba2f1996092519cb2a1334a" ON public.inscriptions_options USING btree ("matiereId");


--
-- Name: IDX_466305a3546c7bd651c9e3da98; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_466305a3546c7bd651c9e3da98" ON public.programme_chapitres USING btree ("periodeId");


--
-- Name: IDX_466bf85d603158abf97137cb55; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_466bf85d603158abf97137cb55" ON public.filieres USING btree ("cycleId");


--
-- Name: IDX_467caeea6af9f862f178a44e9d; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_467caeea6af9f862f178a44e9d" ON public.comptes_bancaires USING btree (code, "etablissementId");


--
-- Name: IDX_46c8f5e29dcab12626aaf949fd; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_46c8f5e29dcab12626aaf949fd" ON public.utilisateur_etablissements USING btree ("utilisateurId", "etablissementId");


--
-- Name: IDX_4723603197777a0e38aee28dca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4723603197777a0e38aee28dca" ON public.eleves USING btree ("etablissementId");


--
-- Name: IDX_47f3d9d43ba5829fa193d411dd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_47f3d9d43ba5829fa193d411dd" ON public.scores_personnel USING btree ("rangGlobal");


--
-- Name: IDX_47fe649d2ac89af3729be248ef; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_47fe649d2ac89af3729be248ef" ON public.mouvements_caisse USING btree ("etablissementId");


--
-- Name: IDX_4818f97080ffb8af155018a4f2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4818f97080ffb8af155018a4f2" ON public.consultations_medicales USING btree ("consultantId");


--
-- Name: IDX_4831497020dabe97e476ce8a48; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4831497020dabe97e476ce8a48" ON public.incidents_personnel USING btree ("etablissementId");


--
-- Name: IDX_48b5bb747e29e5b31cd2abb791; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_48b5bb747e29e5b31cd2abb791" ON public.matieres USING btree ("etablissementId");


--
-- Name: IDX_4b2a365ba185f2c50713d9830e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4b2a365ba185f2c50713d9830e" ON public.candidatures USING btree ("offreEmploiId");


--
-- Name: IDX_4ba1c7a79acc04686ec98c45a8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4ba1c7a79acc04686ec98c45a8" ON public.incidents_eleves USING btree ("etablissementId", "dateIncident");


--
-- Name: IDX_4ca9aae194b377c70386e59676; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4ca9aae194b377c70386e59676" ON public.inscriptions_transport USING btree ("etablissementId", "eleveId");


--
-- Name: IDX_4cc5e20f18ef9ecd04166c9e51; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4cc5e20f18ef9ecd04166c9e51" ON public.periodes USING btree ("anneeScolaireId", "etablissementId");


--
-- Name: IDX_4d55961db1299c65f5db4320fd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4d55961db1299c65f5db4320fd" ON public.affectations_postes USING btree ("membrePersonnelId");


--
-- Name: IDX_4d67d9bffa09b8bd02e470741d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4d67d9bffa09b8bd02e470741d" ON public.groupes_etablissements USING btree ("proprietaireId", actif);


--
-- Name: IDX_4d94beaa86b72f6a54fcb0f65d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4d94beaa86b72f6a54fcb0f65d" ON public.candidatures USING btree (statut);


--
-- Name: IDX_4e27f4a62d0cecd82f49d4af51; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4e27f4a62d0cecd82f49d4af51" ON public.evaluations_personnel USING btree ("evaluateurId");


--
-- Name: IDX_4e462d5b7fc648aa8520ed7257; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4e462d5b7fc648aa8520ed7257" ON public.tentatives_connexion USING btree (identifiant, "adresseIp");


--
-- Name: IDX_4f019be481e0773ba6ab445d4d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4f019be481e0773ba6ab445d4d" ON public.sanctions_eleves USING btree ("etablissementId");


--
-- Name: IDX_4f7ad64f1df99f5375cec0549d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4f7ad64f1df99f5375cec0549d" ON public.inscriptions_transport USING btree ("etablissementId");


--
-- Name: IDX_504779d164f4af694fcea1e013; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_504779d164f4af694fcea1e013" ON public.heures_cours USING btree ("salleId", date, "heureDebut");


--
-- Name: IDX_50ddde301674ec4a7258e9d4db; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_50ddde301674ec4a7258e9d4db" ON public.scores_personnel USING btree ("categoriePersonnel");


--
-- Name: IDX_510bbcadeb79adb7dcf97836a5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_510bbcadeb79adb7dcf97836a5" ON public.evaluations_personnel USING btree ("anneeScolaireId", "membrePersonnelId");


--
-- Name: IDX_52b8dfe62c228002d75fc73567; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_52b8dfe62c228002d75fc73567" ON public.cycles USING btree (code, "etablissementId");


--
-- Name: IDX_54182584e2920a38d9c5dfa70d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_54182584e2920a38d9c5dfa70d" ON public.historique_scores_personnel USING btree ("sourceModule", "sourceId");


--
-- Name: IDX_5583e3772184e53c5596c3aaca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_5583e3772184e53c5596c3aaca" ON public.affectations_matieres USING btree ("classeId", "etablissementId");


--
-- Name: IDX_580677492f08fa2fa598f58a93; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_580677492f08fa2fa598f58a93" ON public.participants_conversation USING btree ("conversationId", "utilisateurId");


--
-- Name: IDX_580de347435f06033b5ec664b4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_580de347435f06033b5ec664b4" ON public.abonnements_parking USING btree ("etablissementId", statut);


--
-- Name: IDX_59d16145f333f05dbcbfa45bc8; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_59d16145f333f05dbcbfa45bc8" ON public.responsables_eleves USING btree ("enfantId", "utilisateurId");


--
-- Name: IDX_5a5bdd4428d741453fc5bca472; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_5a5bdd4428d741453fc5bca472" ON public.niveaux USING btree ("etablissementId");


--
-- Name: IDX_5b4f9d0856ee8e9d462b6066e5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_5b4f9d0856ee8e9d462b6066e5" ON public.hierarchie_personnel USING btree ("superieurId");


--
-- Name: IDX_5c68f93a68f534d289e18a0c19; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_5c68f93a68f534d289e18a0c19" ON public.consultations_medicales USING btree ("dateConsultation");


--
-- Name: IDX_5cbcc5bf1b83bb140a071ab8af; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_5cbcc5bf1b83bb140a071ab8af" ON public.heures_cours USING btree (date);


--
-- Name: IDX_5db2d4d1bfb5fae537d954d6ed; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_5db2d4d1bfb5fae537d954d6ed" ON public.comptes_caisse USING btree (code, "etablissementId");


--
-- Name: IDX_5e7532030cf6811987c046e915; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_5e7532030cf6811987c046e915" ON public.indisponibilites_enseignants USING btree ("enseignantId");


--
-- Name: IDX_5f6c1bba4a8421ceb3aef6e167; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_5f6c1bba4a8421ceb3aef6e167" ON public.profils_orientation USING btree ("eleveId");


--
-- Name: IDX_60133837c50126be6ad4404cea; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_60133837c50126be6ad4404cea" ON public.bulletins_paie USING btree ("etablissementId");


--
-- Name: IDX_60c2ab9a1b657dabba5a40140b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_60c2ab9a1b657dabba5a40140b" ON public.ecritures_comptables USING btree ("numeroPiece");


--
-- Name: IDX_61141e60929ee9b67b4e59f4ea; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_61141e60929ee9b67b4e59f4ea" ON public.filieres USING btree ("cycleId", "etablissementId");


--
-- Name: IDX_611ab294bca7368818dcea4373; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_611ab294bca7368818dcea4373" ON public.entretiens_recrutement USING btree (type);


--
-- Name: IDX_623480bb8bba0b385057ff5bfc; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_623480bb8bba0b385057ff5bfc" ON public.affectations_eleves USING btree ("createdAt");


--
-- Name: IDX_6298393ca9e36302960f1c5382; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6298393ca9e36302960f1c5382" ON public.inscriptions_cantine USING btree (statut);


--
-- Name: IDX_62ea2220d9d736e185d7a95597; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_62ea2220d9d736e185d7a95597" ON public.dossiers_medicaux USING btree ("patientId");


--
-- Name: IDX_640ddfbc3ff81cf8a1e645bb99; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_640ddfbc3ff81cf8a1e645bb99" ON public.emploi_du_temps USING btree ("classeId", jour, "heureDebut", "heureFin");


--
-- Name: IDX_64ca3cc590a4ef3abd1db09156; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_64ca3cc590a4ef3abd1db09156" ON public.entretiens_recrutement USING btree ("etablissementId");


--
-- Name: IDX_64cdb31c1ab068815eb54705ae; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_64cdb31c1ab068815eb54705ae" ON public.annonces USING btree ("etablissementId");


--
-- Name: IDX_65366b7af4f889ebb51a517009; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_65366b7af4f889ebb51a517009" ON public.indisponibilites_enseignants USING btree ("typeIndisponibilite");


--
-- Name: IDX_653d4d149a9b367bffe636f9cc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_653d4d149a9b367bffe636f9cc" ON public.historique_scores_personnel USING btree ("anneeScolaireId");


--
-- Name: IDX_6961271b3efb91f0174702ba32; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6961271b3efb91f0174702ba32" ON public.affectations_postes USING btree ("posteId");


--
-- Name: IDX_69eb2cfa721baa66079237d269; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_69eb2cfa721baa66079237d269" ON public.heures_cours USING btree ("enseignantId", date, "heureDebut");


--
-- Name: IDX_6bbbeb8e10df100e0e7642219b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6bbbeb8e10df100e0e7642219b" ON public.competences USING btree ("niveauId");


--
-- Name: IDX_6c6ab625d79f15bc92322f7763; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6c6ab625d79f15bc92322f7763" ON public.places_parking USING btree ("etablissementId", statut);


--
-- Name: IDX_6e66e90ebca87f2876eb46c0ca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6e66e90ebca87f2876eb46c0ca" ON public.affectations_matieres USING btree ("enseignantId", "etablissementId");


--
-- Name: IDX_6e9db6eb753214621ce2e713ef; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_6e9db6eb753214621ce2e713ef" ON public.groupe_etablissement_liens USING btree ("groupeId", "etablissementId");


--
-- Name: IDX_6f4589d83c4d9c30c8989c7311; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6f4589d83c4d9c30c8989c7311" ON public.parametres_systeme USING btree ("etablissementId");


--
-- Name: IDX_6f60d360e592d7ebf58b610172; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6f60d360e592d7ebf58b610172" ON public.felicitations_eleves USING btree ("etablissementId");


--
-- Name: IDX_7036892777b8ef078946135572; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7036892777b8ef078946135572" ON public.observations_eleves USING btree (type);


--
-- Name: IDX_70862cc947243c56c1bb6406e1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_70862cc947243c56c1bb6406e1" ON public.sanctions_eleves USING btree (type);


--
-- Name: IDX_72825f522c5a5c5c8538c6dd30; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_72825f522c5a5c5c8538c6dd30" ON public.categories_depense USING btree (code);


--
-- Name: IDX_72936be7d2af77143b4450b9d1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_72936be7d2af77143b4450b9d1" ON public.consultations_medicales USING btree ("etablissementId");


--
-- Name: IDX_72c8dbc34d4b8b69d0bb4cf7f7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_72c8dbc34d4b8b69d0bb4cf7f7" ON public.observations_eleves USING btree ("observateurId");


--
-- Name: IDX_739aafdd1732d2164b0483b244; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_739aafdd1732d2164b0483b244" ON public.felicitations_eleves USING btree ("anneeScolaireId", "eleveId");


--
-- Name: IDX_751332fc6cc6fc576c6975cd07; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_751332fc6cc6fc576c6975cd07" ON public.messages USING btree ("conversationId", "createdAt");


--
-- Name: IDX_7530f6908441d4b95df6f5ebde; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7530f6908441d4b95df6f5ebde" ON public.audit_logs USING btree (cible, "cibleId");


--
-- Name: IDX_75f851e15b9986996847442526; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_75f851e15b9986996847442526" ON public.felicitations_eleves USING btree ("eleveId");


--
-- Name: IDX_7616a5320dc4600c441b60cfb3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7616a5320dc4600c441b60cfb3" ON public.incidents_personnel USING btree ("membrePersonnelId");


--
-- Name: IDX_76f74b0ac62bfc7c0ebcff763d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_76f74b0ac62bfc7c0ebcff763d" ON public.materiels USING btree ("etablissementId");


--
-- Name: IDX_76f9bb87e271cbce42c411de5d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_76f9bb87e271cbce42c411de5d" ON public.incidents_eleves USING btree ("etablissementId");


--
-- Name: IDX_76fb50a81ac3739377b4acb22b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_76fb50a81ac3739377b4acb22b" ON public.budgets USING btree ("anneeDebut", "anneeFin");


--
-- Name: IDX_77672288220cd20d069d5fe2c2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_77672288220cd20d069d5fe2c2" ON public.incidents_eleves USING btree ("dateIncident");


--
-- Name: IDX_779f002dd7d7716dc940adee71; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_779f002dd7d7716dc940adee71" ON public.parametres_systeme USING btree (categorie);


--
-- Name: IDX_786dcbf563668eb207b2359b33; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_786dcbf563668eb207b2359b33" ON public.eleves USING btree (matricule);


--
-- Name: IDX_78b9f03cf5261f89c93c792c93; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_78b9f03cf5261f89c93c792c93" ON public.hierarchie_personnel USING btree ("personnelId");


--
-- Name: IDX_78e18fb0557acb8f537c9c4ed7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_78e18fb0557acb8f537c9c4ed7" ON public.historique_scores_personnel USING btree ("scorePersonnelId");


--
-- Name: IDX_7955cc3a79bee196457f2ee31c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7955cc3a79bee196457f2ee31c" ON public.incidents_eleves USING btree (statut);


--
-- Name: IDX_797bc19cb72508cf9ff1d77759; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_797bc19cb72508cf9ff1d77759" ON public.classes USING btree ("etablissementId");


--
-- Name: IDX_79a2b83735e9f3c685372cc4e7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_79a2b83735e9f3c685372cc4e7" ON public.bulletins_paie USING btree ("membrePersonnelId");


--
-- Name: IDX_7ac565e0d2d444c4204e044e98; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7ac565e0d2d444c4204e044e98" ON public.specialites USING btree ("etablissementId");


--
-- Name: IDX_7c2d3cc5fbd3d10c30ce613381; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7c2d3cc5fbd3d10c30ce613381" ON public.preferences_role USING btree (cle);


--
-- Name: IDX_7e99ba915e8aa66fa84c696bb3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7e99ba915e8aa66fa84c696bb3" ON public.affectations_eleves USING btree (statut);


--
-- Name: IDX_7ed734e8bc61fe05cf508fc547; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7ed734e8bc61fe05cf508fc547" ON public.evaluations_competences USING btree ("noteId");


--
-- Name: IDX_7f1df4c85c7739fa830256198a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7f1df4c85c7739fa830256198a" ON public.contrats_personnel USING btree ("membrePersonnelId");


--
-- Name: IDX_7fc71c57fcd78b019203cef6fc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7fc71c57fcd78b019203cef6fc" ON public.budgets USING btree ("etablissementId");


--
-- Name: IDX_8013bbc670b9b31dce1868ae08; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8013bbc670b9b31dce1868ae08" ON public.emploi_du_temps USING btree (jour, "heureDebut");


--
-- Name: IDX_80485d73d159fc7b6faf3c146c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_80485d73d159fc7b6faf3c146c" ON public.absences_personnel USING btree (date);


--
-- Name: IDX_8097433ced2d652c80c8e08105; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8097433ced2d652c80c8e08105" ON public.bulletins_paie USING btree (annee);


--
-- Name: IDX_80b5beeb0c89c58141b6884539; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_80b5beeb0c89c58141b6884539" ON public.sondages USING btree ("dateProgrammation");


--
-- Name: IDX_814e5b0a0816a2144db24ef191; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_814e5b0a0816a2144db24ef191" ON public.cotisations USING btree ("etablissementId");


--
-- Name: IDX_815d6e76c5bb0fae935a452b5b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_815d6e76c5bb0fae935a452b5b" ON public.dashboard_layouts USING btree ("utilisateurId");


--
-- Name: IDX_81b66a9eb848cbebacc00788c6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_81b66a9eb848cbebacc00788c6" ON public.scores_personnel USING btree ("matiereId");


--
-- Name: IDX_821254d8317ddbb650afe2ce8d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_821254d8317ddbb650afe2ce8d" ON public.remises USING btree ("eleveId");


--
-- Name: IDX_83f545fcda6c86f9d1abf30da1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_83f545fcda6c86f9d1abf30da1" ON public.dossiers_medicaux USING btree ("typePatient");


--
-- Name: IDX_84045ffa154152ccb8d63dff99; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_84045ffa154152ccb8d63dff99" ON public.bons_commande USING btree ("numeroBon");


--
-- Name: IDX_841275ed524f52264b1c2f0825; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_841275ed524f52264b1c2f0825" ON public.backup_records USING btree ("etablissementId", "backupType", "createdAt");


--
-- Name: IDX_84d97fb454fb547cc3699de12d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_84d97fb454fb547cc3699de12d" ON public.types_enum USING btree (categorie);


--
-- Name: IDX_8539b6fcab3f3a692be48398a4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8539b6fcab3f3a692be48398a4" ON public.conversations USING btree ("etablissementId", "updatedAt");


--
-- Name: IDX_85a6b88131350fe56a2164c43c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_85a6b88131350fe56a2164c43c" ON public.programme_chapitres USING btree ("matiereNiveauId", "periodeId");


--
-- Name: IDX_85bc5b21564849e837a7d89aee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_85bc5b21564849e837a7d89aee" ON public.audit_logs USING btree ("utilisateurId", "createdAt");


--
-- Name: IDX_86354c5699f9aece0002f62c74; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_86354c5699f9aece0002f62c74" ON public.utilisateur_permissions USING btree ("utilisateurId");


--
-- Name: IDX_8657fa4f26cebf6dec0a2e444d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8657fa4f26cebf6dec0a2e444d" ON public.annees_scolaires USING btree ("etablissementId");


--
-- Name: IDX_86e0f44acac54b26d3eaddce41; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_86e0f44acac54b26d3eaddce41" ON public.lignes_transport USING btree ("etablissementId");


--
-- Name: IDX_8770d8b880a0e5f2048acead86; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8770d8b880a0e5f2048acead86" ON public.inscriptions_options USING btree ("etablissementId");


--
-- Name: IDX_88691c9e25339b1b08ad0cd80d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_88691c9e25339b1b08ad0cd80d" ON public.entretiens_recrutement USING btree ("candidatureId");


--
-- Name: IDX_8a06c910ea538c3e04a8b56318; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8a06c910ea538c3e04a8b56318" ON public.incidents_personnel USING btree ("anneeScolaireId");


--
-- Name: IDX_8a23fde7e482a411cd1b250076; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8a23fde7e482a411cd1b250076" ON public.echeanciers_paiement USING btree ("etablissementId", statut);


--
-- Name: IDX_8a4778cfb71f55da3ccd20aa5e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8a4778cfb71f55da3ccd20aa5e" ON public.scores_personnel USING btree ("etablissementId");


--
-- Name: IDX_8ba5c333a2025a21a1e0f24275; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8ba5c333a2025a21a1e0f24275" ON public.offres_emploi USING btree ("uniteOrganisationnelleId");


--
-- Name: IDX_8bab118b21ae82c46d8920c4f6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8bab118b21ae82c46d8920c4f6" ON public.backup_records USING btree ("retentionUntil");


--
-- Name: IDX_8bd1b94cc4c9c2f45ca53fc615; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8bd1b94cc4c9c2f45ca53fc615" ON public.fonds_etablissement USING btree ("etablissementId");


--
-- Name: IDX_8bf54b530c28bf9528d45d1802; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_8bf54b530c28bf9528d45d1802" ON public.factures_fournisseur USING btree ("numeroFacture");


--
-- Name: IDX_8c207fd9552c24b2e15a2e6e44; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8c207fd9552c24b2e15a2e6e44" ON public.elements_salaire USING btree ("bulletinPaieId");


--
-- Name: IDX_8c266c819db22d4d047ff1c2d3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8c266c819db22d4d047ff1c2d3" ON public.diplomes_eleves USING btree ("eleveId");


--
-- Name: IDX_8c43004bb689b19e29826029b8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8c43004bb689b19e29826029b8" ON public.niveaux USING btree ("cycleId", "etablissementId");


--
-- Name: IDX_8ccd2f51d06852287693a83cb5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8ccd2f51d06852287693a83cb5" ON public.factures_fournisseur USING btree ("depenseId");


--
-- Name: IDX_8cda0009557df267df95aea945; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8cda0009557df267df95aea945" ON public.notes USING btree ("periodeId");


--
-- Name: IDX_8d9b443ba149dcffef86f8e18a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8d9b443ba149dcffef86f8e18a" ON public.affectations_postes USING btree ("etablissementId");


--
-- Name: IDX_8da379d55b6973eba5fe12cc1a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8da379d55b6973eba5fe12cc1a" ON public.incidents_eleves USING btree ("periodeId");


--
-- Name: IDX_8dad765629e83229da6feda1c1; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_8dad765629e83229da6feda1c1" ON public.permissions USING btree (code);


--
-- Name: IDX_8e174e4d78bcd0fc3433ea28b1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8e174e4d78bcd0fc3433ea28b1" ON public.classes USING btree ("filiereId");


--
-- Name: IDX_8e85ab8c819af5a116b9efc559; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8e85ab8c819af5a116b9efc559" ON public.evaluations_personnel USING btree ("etablissementId");


--
-- Name: IDX_8ebfd6b25b8978ca268bd76d54; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8ebfd6b25b8978ca268bd76d54" ON public.incidents_sante USING btree ("dossierMedicalId");


--
-- Name: IDX_902b613a00ecff94a0f8f9d1b8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_902b613a00ecff94a0f8f9d1b8" ON public.parametre_versions USING btree ("etablissementId", "createdAt");


--
-- Name: IDX_910446f1e8a1bd1e48c1dcea2b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_910446f1e8a1bd1e48c1dcea2b" ON public.vehicules USING btree ("etablissementId");


--
-- Name: IDX_91baf3c28e4dc9489a074a25f9; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_91baf3c28e4dc9489a074a25f9" ON public.affectations_eleves USING btree ("eleveId");


--
-- Name: IDX_91e496758c01486246674ffaa9; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_91e496758c01486246674ffaa9" ON public.heures_cours USING btree ("classeId");


--
-- Name: IDX_91ef4aaafdc36da3b88fc8f560; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_91ef4aaafdc36da3b88fc8f560" ON public.affectations_postes USING btree ("contratId");


--
-- Name: IDX_9226bbc06cb534a6f17e637d70; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9226bbc06cb534a6f17e637d70" ON public.scores_personnel USING btree ("classeId");


--
-- Name: IDX_93b4f42f90c8771a717f6574ee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_93b4f42f90c8771a717f6574ee" ON public.fonds USING btree ("estSysteme");


--
-- Name: IDX_9414b94bead0c95562a39682e7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9414b94bead0c95562a39682e7" ON public.scores_eleves USING btree ("periodeId", type);


--
-- Name: IDX_941fb3093c186523a57ad3eadb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_941fb3093c186523a57ad3eadb" ON public.absences_personnel USING btree ("etablissementId");


--
-- Name: IDX_94902cba56d63da62075a15222; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_94902cba56d63da62075a15222" ON public.types_contrat_personnalises USING btree (actif);


--
-- Name: IDX_94fe9920789be35567aaef90d7; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_94fe9920789be35567aaef90d7" ON public.regles_scoring_personnel USING btree (code, "etablissementId");


--
-- Name: IDX_9525f299224d9c9d919fd94ca4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9525f299224d9c9d919fd94ca4" ON public.membres_personnel USING btree ("utilisateurId");


--
-- Name: IDX_95f7b67cadd416c0c0f3f22368; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_95f7b67cadd416c0c0f3f22368" ON public.affectations_matieres USING btree ("enseignantId");


--
-- Name: IDX_963559a2fc367f7b19074a6957; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_963559a2fc367f7b19074a6957" ON public.onboarding_recrutement USING btree ("dateFinPrevu");


--
-- Name: IDX_963cb9695b259a62acf8f2874b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_963cb9695b259a62acf8f2874b" ON public.incidents_eleves USING btree ("eleveId");


--
-- Name: IDX_97aacad0c00edd59ab1bedb7e5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_97aacad0c00edd59ab1bedb7e5" ON public.cartes USING btree ("etablissementId");


--
-- Name: IDX_98b011987512469a044c14ccb9; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_98b011987512469a044c14ccb9" ON public.annonces USING btree ("cibleGlobale");


--
-- Name: IDX_997787699a9e4a8f4900f29dd1; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_997787699a9e4a8f4900f29dd1" ON public.types_enum USING btree (categorie, code);


--
-- Name: IDX_9a6d5212fb697c8aa71e593096; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9a6d5212fb697c8aa71e593096" ON public.affectations_eleves USING btree ("anneeScolaireId");


--
-- Name: IDX_9a78f7f8c51aecde77a1f59b8e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9a78f7f8c51aecde77a1f59b8e" ON public.incidents_personnel USING btree ("anneeScolaireId", "membrePersonnelId");


--
-- Name: IDX_9b10a5d0337499c16556290ef2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9b10a5d0337499c16556290ef2" ON public.onboarding_recrutement USING btree ("dateDebut");


--
-- Name: IDX_9b43e01228694dcd25dbd10fc9; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9b43e01228694dcd25dbd10fc9" ON public.types_contrat_personnalises USING btree ("etablissementId");


--
-- Name: IDX_9b4597989f054bf95c8a5f0a39; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9b4597989f054bf95c8a5f0a39" ON public.notes USING btree ("enseignantId");


--
-- Name: IDX_9b6993268b267bc9cd45a70197; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9b6993268b267bc9cd45a70197" ON public.sondage_votes USING btree ("sondageId");


--
-- Name: IDX_9be0d716252de42d78a01e0b51; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9be0d716252de42d78a01e0b51" ON public.dossiers_medicaux USING btree ("etablissementId");


--
-- Name: IDX_9c709d7f4c5dffde06a9626b9f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9c709d7f4c5dffde06a9626b9f" ON public.echeanciers_paiement USING btree ("eleveId");


--
-- Name: IDX_9d5553ac515512ad30986832bd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9d5553ac515512ad30986832bd" ON public.messages_fichiers USING btree ("etablissementId");


--
-- Name: IDX_9dadb6096f818360735dc0a505; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9dadb6096f818360735dc0a505" ON public.relances_paiement USING btree ("echeancierId");


--
-- Name: IDX_9e3c99de79ee6c82700cb71bfe; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_9e3c99de79ee6c82700cb71bfe" ON public.bulletins_matieres USING btree ("bulletinId", "matiereId");


--
-- Name: IDX_9f22a79f3ced0ab1acead4c7dd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9f22a79f3ced0ab1acead4c7dd" ON public.scores_personnel USING btree ("matiereId", "scoreGlobal");


--
-- Name: IDX_9fb1c01d3f3d8518f86d818288; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9fb1c01d3f3d8518f86d818288" ON public.affectations_postes USING btree ("posteId", statut);


--
-- Name: IDX_9fb4723e8eb54a2777ff4ccabd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9fb4723e8eb54a2777ff4ccabd" ON public.progressions_programme USING btree ("periodeId");


--
-- Name: IDX_a024edd7ff3c1a1f67f19e0697; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a024edd7ff3c1a1f67f19e0697" ON public.progressions_programme USING btree ("matiereId");


--
-- Name: IDX_a06e62c5bc0c046b30ef5012ef; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a06e62c5bc0c046b30ef5012ef" ON public.emploi_du_temps USING btree ("classeId");


--
-- Name: IDX_a20565e47edb6b6aebd0a79e80; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a20565e47edb6b6aebd0a79e80" ON public.salles USING btree (disponible);


--
-- Name: IDX_a3899c1a722c3c9b3b27cc66cf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a3899c1a722c3c9b3b27cc66cf" ON public.contrats_personnel USING btree ("etablissementId");


--
-- Name: IDX_a38ef975102d04b7ed8906125c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a38ef975102d04b7ed8906125c" ON public.indisponibilites_enseignants USING btree ("dateDebut", "dateFin");


--
-- Name: IDX_a3f203809027815a31c3454ad9; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a3f203809027815a31c3454ad9" ON public.preferences_utilisateur USING btree (categorie, "updatedAt");


--
-- Name: IDX_a3fb9185308f52653aceaa2ebe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a3fb9185308f52653aceaa2ebe" ON public.entretiens_recrutement USING btree (statut);


--
-- Name: IDX_a4a92c6329df29d6e114204bfb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a4a92c6329df29d6e114204bfb" ON public.elements_salaire USING btree (type);


--
-- Name: IDX_a4affbc8e17978c0fcccbc7e0b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a4affbc8e17978c0fcccbc7e0b" ON public.observations_eleves USING btree ("etablissementId");


--
-- Name: IDX_a5057ae7a35f8010c4bdfc859c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a5057ae7a35f8010c4bdfc859c" ON public.historique_configuration USING btree (cible, "cibleId");


--
-- Name: IDX_a508048cb17088e4991a6f71be; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a508048cb17088e4991a6f71be" ON public.diplomes_eleves USING btree ("examenNationalId");


--
-- Name: IDX_a5c87872d19af4df4c30ec42af; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a5c87872d19af4df4c30ec42af" ON public.sanctions_eleves USING btree ("anneeScolaireId", "eleveId");


--
-- Name: IDX_a69aa148d70dc576eb1872ecd3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a69aa148d70dc576eb1872ecd3" ON public.menus_cantine USING btree ("etablissementId", date);


--
-- Name: IDX_a72bbbabedd8985705f2613c12; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a72bbbabedd8985705f2613c12" ON public.fonds_etablissement USING btree (actif);


--
-- Name: IDX_a7905fb833583a74ec2f752699; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a7905fb833583a74ec2f752699" ON public.messages_fichiers USING btree ("messageId");


--
-- Name: IDX_a79167147219e0e713b8c4d331; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a79167147219e0e713b8c4d331" ON public.comptes_caisse USING btree ("etablissementId");


--
-- Name: IDX_a7d3cedd5e5f9b5dd14479e0d5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a7d3cedd5e5f9b5dd14479e0d5" ON public.candidatures USING btree (email);


--
-- Name: IDX_a8b3f051a247ecb4dacadb7971; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a8b3f051a247ecb4dacadb7971" ON public.scores_personnel USING btree ("periodeId");


--
-- Name: IDX_a8f651908aa4f39721087a2430; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a8f651908aa4f39721087a2430" ON public.candidatures USING btree ("etablissementId");


--
-- Name: IDX_a949af81db727b3ad7b0c73abd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a949af81db727b3ad7b0c73abd" ON public.matieres USING btree (code, "etablissementId");


--
-- Name: IDX_aa4cbd70b33cf98765d2f0be9a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_aa4cbd70b33cf98765d2f0be9a" ON public.historique_scores_personnel USING btree ("etablissementId");


--
-- Name: IDX_aa8be5c18a31165cba4a2a848a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_aa8be5c18a31165cba4a2a848a" ON public.emploi_du_temps USING btree ("enseignantId");


--
-- Name: IDX_ab2e2e30e086abb082335ca8e8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ab2e2e30e086abb082335ca8e8" ON public.preferences_globales USING btree (categorie);


--
-- Name: IDX_ab545ca3c1069b340cfdeea554; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ab545ca3c1069b340cfdeea554" ON public.scores_eleves USING btree ("eleveId", type);


--
-- Name: IDX_ab7d577d38a679547192a161b8; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_ab7d577d38a679547192a161b8" ON public.sanctions_eleves USING btree ("incidentId");


--
-- Name: IDX_abaf413d400096a701fb5c2fe6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_abaf413d400096a701fb5c2fe6" ON public.ecritures_comptables USING btree ("etablissementId");


--
-- Name: IDX_abbd84dae4c02470de55f5777e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_abbd84dae4c02470de55f5777e" ON public.utilisateur_etablissements USING btree ("utilisateurId", "etablissementId", actif);


--
-- Name: IDX_ac556d88a7736df5184d3cb951; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ac556d88a7736df5184d3cb951" ON public.inscriptions_cantine USING btree ("etablissementId", "eleveId");


--
-- Name: IDX_ac704c4537199bffbd4cc0057f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ac704c4537199bffbd4cc0057f" ON public.evaluations_personnel USING btree ("anneeScolaireId");


--
-- Name: IDX_ad492bcc6e50a29d63e28fb702; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_ad492bcc6e50a29d63e28fb702" ON public.cycles USING btree (nom, "etablissementId");


--
-- Name: IDX_ad6a3e5dd273a9776b39b4d5de; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ad6a3e5dd273a9776b39b4d5de" ON public.conversations USING btree ("entiteLieeType", "entiteLieeId");


--
-- Name: IDX_ad8dc6bd6929dbcab71e0a07eb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ad8dc6bd6929dbcab71e0a07eb" ON public.postes USING btree (code);


--
-- Name: IDX_ada5c0b57eb5481b9e7546f23a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ada5c0b57eb5481b9e7546f23a" ON public.scores_personnel USING btree ("classeId", "scoreGlobal");


--
-- Name: IDX_adf3a132636508acea7def9b69; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_adf3a132636508acea7def9b69" ON public.abonnements_parking USING btree ("etablissementId");


--
-- Name: IDX_ae86c23edb90d3e164df4daf5f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ae86c23edb90d3e164df4daf5f" ON public.clubs USING btree ("etablissementId");


--
-- Name: IDX_af32d404998896711d573fc402; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_af32d404998896711d573fc402" ON public.utilisateur_etablissements USING btree ("etablissementId", actif);


--
-- Name: IDX_affectations_matieres_classe_etablissement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_affectations_matieres_classe_etablissement" ON public.affectations_matieres USING btree ("classeId", "etablissementId");


--
-- Name: IDX_affectations_matieres_enseignant_etablissement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_affectations_matieres_enseignant_etablissement" ON public.affectations_matieres USING btree ("enseignantId", "etablissementId");


--
-- Name: IDX_affectations_matieres_etablissement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_affectations_matieres_etablissement" ON public.affectations_matieres USING btree ("etablissementId");


--
-- Name: IDX_b0d299dcf1e1f73a47564ba9c3; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_b0d299dcf1e1f73a47564ba9c3" ON public.salles USING btree (code, "etablissementId");


--
-- Name: IDX_b151390b51c98e1c80abe6e01e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b151390b51c98e1c80abe6e01e" ON public.felicitations_eleves USING btree ("periodeId");


--
-- Name: IDX_b1a7bc7617447aa079fb3724ef; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b1a7bc7617447aa079fb3724ef" ON public.types_enum USING btree ("etablissementId");


--
-- Name: IDX_b2d985f238e369e249648262c3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b2d985f238e369e249648262c3" ON public.responsables_eleves USING btree ("enfantId");


--
-- Name: IDX_b3603a99063b9f0db41f14bd2f; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_b3603a99063b9f0db41f14bd2f" ON public.sondage_votes USING btree ("sondageId", "utilisateurId");


--
-- Name: IDX_b383cacae1daba5542fa5942b8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b383cacae1daba5542fa5942b8" ON public.menus_cantine USING btree ("etablissementId");


--
-- Name: IDX_b3b66124895e12271a81d38690; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b3b66124895e12271a81d38690" ON public.evaluations_personnel USING btree ("anneeScolaireId", "periodeId");


--
-- Name: IDX_b41c2ae7598cebc4ff910e613e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b41c2ae7598cebc4ff910e613e" ON public.programme_chapitres USING btree (ordre);


--
-- Name: IDX_b4599f8b8f548d35850afa2d12; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b4599f8b8f548d35850afa2d12" ON public.role_permissions USING btree ("roleId");


--
-- Name: IDX_b4787a3b5cfb803888432e9b8f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b4787a3b5cfb803888432e9b8f" ON public.types_enum USING btree (code);


--
-- Name: IDX_b5828949529faa3ec45306f59a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b5828949529faa3ec45306f59a" ON public.consultations_medicales USING btree ("periodeId", type);


--
-- Name: IDX_b5ed93b322e2ecc6d01a4c9384; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b5ed93b322e2ecc6d01a4c9384" ON public.competences USING btree ("etablissementId");


--
-- Name: IDX_b61da68004273911dfe2685daa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b61da68004273911dfe2685daa" ON public.heures_cours USING btree ("salleId");


--
-- Name: IDX_b6792964a803f546528ddc895e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b6792964a803f546528ddc895e" ON public.historique_scores USING btree ("eleveId", date);


--
-- Name: IDX_b6f5defde8c8d73571ac0cb5ce; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b6f5defde8c8d73571ac0cb5ce" ON public.notes USING btree ("eleveId");


--
-- Name: IDX_b7e7092afd4a747775d4043075; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b7e7092afd4a747775d4043075" ON public.parametres_systeme USING btree (module);


--
-- Name: IDX_b8a2ff148aecc0952e1ed1961b; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_b8a2ff148aecc0952e1ed1961b" ON public.dossiers_medicaux USING btree ("etablissementId", "patientId");


--
-- Name: IDX_b9bb181c652282ff699aef8062; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_b9bb181c652282ff699aef8062" ON public.recus_paiement USING btree ("numeroRecu");


--
-- Name: IDX_ba1c1157857901673b6f430e80; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ba1c1157857901673b6f430e80" ON public.regles_scoring_personnel USING btree ("etablissementId");


--
-- Name: IDX_bb3788bdb56061172385fe9723; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bb3788bdb56061172385fe9723" ON public.felicitations_eleves USING btree ("anneeScolaireId");


--
-- Name: IDX_bb6435fbb90e3e964a8b18c765; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bb6435fbb90e3e964a8b18c765" ON public.types_primes USING btree ("etablissementId");


--
-- Name: IDX_bbd4fe380b6138d9efd5dd1369; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bbd4fe380b6138d9efd5dd1369" ON public.historique_scores_personnel USING btree ("membrePersonnelId");


--
-- Name: IDX_bc282391d622c8d7c5d5eed2c8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bc282391d622c8d7c5d5eed2c8" ON public.repartitions_horaires USING btree ("etablissementId");


--
-- Name: IDX_bc2d1eef44291194cafbe19481; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bc2d1eef44291194cafbe19481" ON public.affectations_eleves USING btree ("classeId");


--
-- Name: IDX_bde4e676b01e16805a39197d9d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bde4e676b01e16805a39197d9d" ON public.evaluations_personnel USING btree ("membrePersonnelId");


--
-- Name: IDX_be374b7f4405bbb0ac3446c917; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_be374b7f4405bbb0ac3446c917" ON public.classes USING btree ("typeClasse");


--
-- Name: IDX_befb8e2e1f39a2fd0944f9b697; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_befb8e2e1f39a2fd0944f9b697" ON public.notification_providers USING btree ("estDefaut");


--
-- Name: IDX_bf9f6043ebbb7480291530fa77; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bf9f6043ebbb7480291530fa77" ON public.evaluations_competences USING btree ("competenceId");


--
-- Name: IDX_bfb6cfcb1afcbb14863e65cea0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bfb6cfcb1afcbb14863e65cea0" ON public.backup_records USING btree (checksum);


--
-- Name: IDX_c143eba6d7ca34ccb728cf36e2; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_c143eba6d7ca34ccb728cf36e2" ON public.preferences_utilisateur USING btree ("utilisateurId", cle, "etablissementId");


--
-- Name: IDX_c161de8943d6965e0e05b020e0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c161de8943d6965e0e05b020e0" ON public.mouvements_caisse USING btree ("compteCaisseId");


--
-- Name: IDX_c196c10ce1171fc343fd6995c7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c196c10ce1171fc343fd6995c7" ON public.preferences_utilisateur USING btree ("heriteGlobal", "utilisateurId");


--
-- Name: IDX_c1ad14c9fc99d9e5d56395e579; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c1ad14c9fc99d9e5d56395e579" ON public.bulletins_matieres USING btree ("matiereId");


--
-- Name: IDX_c1f54a114d71fcacf9948ee3d2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c1f54a114d71fcacf9948ee3d2" ON public.membres_personnel USING btree ("etablissementId");


--
-- Name: IDX_c281dc4d2f25ea023febeeb32e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c281dc4d2f25ea023febeeb32e" ON public.incidents_sante USING btree ("etablissementId");


--
-- Name: IDX_c2ad072211d595489a994ebe38; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c2ad072211d595489a994ebe38" ON public.fonds USING btree (categorie);


--
-- Name: IDX_c36e6a5c10b092c60b29642277; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c36e6a5c10b092c60b29642277" ON public.modeles_cartes USING btree ("etablissementId");


--
-- Name: IDX_c38ed1f55dc507b0de86b97801; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c38ed1f55dc507b0de86b97801" ON public.modeles_cartes USING btree ("parDefaut");


--
-- Name: IDX_c3b4681f1cdbda737ceb80e0d4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c3b4681f1cdbda737ceb80e0d4" ON public.contrats_personnel USING btree (statut);


--
-- Name: IDX_c3d310e7be2b44eea82b0c9793; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c3d310e7be2b44eea82b0c9793" ON public.sanctions_eleves USING btree (statut);


--
-- Name: IDX_c3e94b0f6f4d91b13ac0f1e3a7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c3e94b0f6f4d91b13ac0f1e3a7" ON public.onboarding_recrutement USING btree ("etablissementId");


--
-- Name: IDX_c4265dea3f4c56f93ab251218c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c4265dea3f4c56f93ab251218c" ON public.observations_eleves USING btree ("anneeScolaireId", "eleveId");


--
-- Name: IDX_c4583ee4f65328314e377ea574; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c4583ee4f65328314e377ea574" ON public.repartitions_horaires USING btree ("affectationId", "jourSemaine", "heureDebut");


--
-- Name: IDX_c46d95dc4d9c7afdd597cd15cd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c46d95dc4d9c7afdd597cd15cd" ON public.bulletins_paie USING btree (mois);


--
-- Name: IDX_c6a5f7d0000d1dc3b414e913c5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c6a5f7d0000d1dc3b414e913c5" ON public.workflows_validation USING btree ("etablissementId");


--
-- Name: IDX_c7199c02eb05a499f65ee191b0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c7199c02eb05a499f65ee191b0" ON public.mouvements_caisse USING btree ("dateMouvement");


--
-- Name: IDX_c75f412020eafb553413de9160; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c75f412020eafb553413de9160" ON public.inscriptions_transport USING btree ("eleveId");


--
-- Name: IDX_c78fd921d3660543ce5282f0f5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_c78fd921d3660543ce5282f0f5" ON public.inscriptions_cantine USING btree ("etablissementId");


--
-- Name: IDX_cafaf3a0591c7be85c6266ed47; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_cafaf3a0591c7be85c6266ed47" ON public.bulletins_paie USING btree (statut);


--
-- Name: IDX_cb720f99e69f84753ee7641cad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_cb720f99e69f84753ee7641cad" ON public.sondage_votes USING btree ("optionId");


--
-- Name: IDX_cc6bfe1a18f5cac30d319cd7bc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_cc6bfe1a18f5cac30d319cd7bc" ON public.annonce_ciblages USING btree ("typeCible", "cibleId");


--
-- Name: IDX_cd3e0e14bd61d00719cca6a32c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_cd3e0e14bd61d00719cca6a32c" ON public.depenses USING btree ("etablissementId", "dateFacture");


--
-- Name: IDX_cea7218a5fb8586d421d9ff90f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_cea7218a5fb8586d421d9ff90f" ON public.participants_conversation USING btree ("utilisateurId", "archivePerso");


--
-- Name: IDX_cf44b9ceba3c54b8d251535ae0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_cf44b9ceba3c54b8d251535ae0" ON public.incidents_eleves USING btree (gravite);


--
-- Name: IDX_cf9ebb807f7df3c85f30ada537; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_cf9ebb807f7df3c85f30ada537" ON public.incidents_eleves USING btree ("classeId");


--
-- Name: IDX_cfb28fdae3dd5b56cffd63d766; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_cfb28fdae3dd5b56cffd63d766" ON public.observations_eleves USING btree ("anneeScolaireId");


--
-- Name: IDX_d0037fb858904c4c047981a26c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d0037fb858904c4c047981a26c" ON public.scores_personnel USING btree ("anneeScolaireId");


--
-- Name: IDX_d0ab9945217b49e3d6423f6876; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d0ab9945217b49e3d6423f6876" ON public.heures_cours USING btree ("classeId", date, "heureDebut");


--
-- Name: IDX_d16b44ef3c9ed90da31525753e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d16b44ef3c9ed90da31525753e" ON public.specialites USING btree ("filiereId", "etablissementId");


--
-- Name: IDX_d1871d533cfd34a5229c5d9b10; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d1871d533cfd34a5229c5d9b10" ON public.historique_scores_personnel USING btree ("typeModification");


--
-- Name: IDX_d1cb19b4994bcd3a28ce4eabb2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d1cb19b4994bcd3a28ce4eabb2" ON public.file_impressions USING btree (statut, "createdAt");


--
-- Name: IDX_d2e8b08bbb8c6536b315508686; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d2e8b08bbb8c6536b315508686" ON public.responsables_eleves USING btree ("utilisateurId");


--
-- Name: IDX_d2ef0f5d7dfcc398c94cc6b291; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d2ef0f5d7dfcc398c94cc6b291" ON public.templates_sondage USING btree (visibilite);


--
-- Name: IDX_d391c24bf4d434aa5d8e54b61b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d391c24bf4d434aa5d8e54b61b" ON public.unites_organisationnelles USING btree ("parentId");


--
-- Name: IDX_d3a35a0b10f22a643c88849e63; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d3a35a0b10f22a643c88849e63" ON public.utilisateurs USING btree (pseudonyme);


--
-- Name: IDX_d4f5d9997674777b47e94ef0e9; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d4f5d9997674777b47e94ef0e9" ON public.evaluations_enseignants USING btree ("enseignantId");


--
-- Name: IDX_d622987744f614e42d19a1efb7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d622987744f614e42d19a1efb7" ON public.felicitations_eleves USING btree (type);


--
-- Name: IDX_d6fa8a4a150c90774629f7cb9e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d6fa8a4a150c90774629f7cb9e" ON public.incidents_eleves USING btree ("anneeScolaireId", gravite);


--
-- Name: IDX_d74efb9ef3418ee0f2c152ae98; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d74efb9ef3418ee0f2c152ae98" ON public.places_parking USING btree (statut);


--
-- Name: IDX_d760435310cbebfca824e97e78; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d760435310cbebfca824e97e78" ON public.notification_providers USING btree (type, actif);


--
-- Name: IDX_d783c0a3bb2fb16c05cf99acf8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d783c0a3bb2fb16c05cf99acf8" ON public.observations_eleves USING btree ("eleveId");


--
-- Name: IDX_d78a3ec524c52c4653b0631069; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d78a3ec524c52c4653b0631069" ON public.inscriptions_options USING btree ("eleveId", "anneeScolaireId", statut);


--
-- Name: IDX_d7b752f8028d5dff943e967020; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d7b752f8028d5dff943e967020" ON public.preferences_utilisateur USING btree ("utilisateurId", categorie);


--
-- Name: IDX_d8accc97931690ce7456baaee2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d8accc97931690ce7456baaee2" ON public.notification_providers USING btree ("etablissementId");


--
-- Name: IDX_daf4c72e5cc47c2ef166505dae; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_daf4c72e5cc47c2ef166505dae" ON public.evaluations_enseignants USING btree ("dateEvaluation");


--
-- Name: IDX_db0f13654e86c4d361a43e30ae; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_db0f13654e86c4d361a43e30ae" ON public.bulletins USING btree ("etablissementId");


--
-- Name: IDX_dcea38c4cbdeba23d4b543de8b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_dcea38c4cbdeba23d4b543de8b" ON public.lignes_budget USING btree ("budgetId");


--
-- Name: IDX_dd2f9f903870e163cdb3ab0ee8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_dd2f9f903870e163cdb3ab0ee8" ON public.places_parking USING btree ("etablissementId");


--
-- Name: IDX_dd422f79f543ea3bb1ccf7c033; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_dd422f79f543ea3bb1ccf7c033" ON public.matieres_niveaux USING btree ("niveauId");


--
-- Name: IDX_ddc3c8d7413863a52267db4702; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_ddc3c8d7413863a52267db4702" ON public.competences USING btree ("niveauId", "matiereId", "etablissementId");


--
-- Name: IDX_ddde526971bb34aa9fbcdec5cc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ddde526971bb34aa9fbcdec5cc" ON public.consultations_medicales USING btree ("dossierMedicalId");


--
-- Name: IDX_de1edfaffb39eb6331f1b39eaf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_de1edfaffb39eb6331f1b39eaf" ON public.notes USING btree ("etablissementId");


--
-- Name: IDX_de9d79ae7e36b053ed124d4f94; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_de9d79ae7e36b053ed124d4f94" ON public.paiements USING btree ("etablissementId", "datePaiement");


--
-- Name: IDX_dfd1425b29336514744f6c2ef1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_dfd1425b29336514744f6c2ef1" ON public.observations_eleves USING btree ("periodeId");


--
-- Name: IDX_e0b9241e7ac9c1793d68d9a773; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e0b9241e7ac9c1793d68d9a773" ON public.eleves USING btree ("utilisateurId");


--
-- Name: IDX_e0f12fecb0233b2aff82f1626f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e0f12fecb0233b2aff82f1626f" ON public.abonnements_parking USING btree ("titulaireId");


--
-- Name: IDX_e11de6d513cf6d6b84e236968e; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_e11de6d513cf6d6b84e236968e" ON public.niveaux USING btree (code, "sousSysteme", "etablissementId");


--
-- Name: IDX_e12e543150e410cfa9657668ed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e12e543150e410cfa9657668ed" ON public.incidents_eleves USING btree ("declarantId");


--
-- Name: IDX_e2a52b9e9a611cf227bb819a27; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e2a52b9e9a611cf227bb819a27" ON public.scores_personnel USING btree ("anneeScolaireId", "membrePersonnelId");


--
-- Name: IDX_e2f7ee20876c94cad4c95c954d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e2f7ee20876c94cad4c95c954d" ON public.places_parking USING btree (type);


--
-- Name: IDX_e463bac298fb87186da785818d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e463bac298fb87186da785818d" ON public.lignes_budget USING btree ("categorieDepenseId");


--
-- Name: IDX_e481d0965b8cd6b32e1b6988ca; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e481d0965b8cd6b32e1b6988ca" ON public.organisations USING btree (type);


--
-- Name: IDX_e50a0ff5071de03606377eafa4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e50a0ff5071de03606377eafa4" ON public.postes USING btree ("uniteOrganisationnelleId");


--
-- Name: IDX_e574ea41a02695c1b94f4b89d5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e574ea41a02695c1b94f4b89d5" ON public.menus_cantine USING btree (date);


--
-- Name: IDX_e5950d5485818be723b81179f6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e5950d5485818be723b81179f6" ON public.notes USING btree ("matiereId");


--
-- Name: IDX_e5e43c816d308ac8102b14d80e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e5e43c816d308ac8102b14d80e" ON public.matieres_niveaux USING btree ("filiereId");


--
-- Name: IDX_e6142848586980d507ae567322; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e6142848586980d507ae567322" ON public.sondages USING btree (statut);


--
-- Name: IDX_e66e9fd91ade9ea0c1e5b780c4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e66e9fd91ade9ea0c1e5b780c4" ON public.fonds USING btree ("estActif");


--
-- Name: IDX_e6de80deaac0bc7f036ff60438; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e6de80deaac0bc7f036ff60438" ON public.incidents_personnel USING btree ("declarantId");


--
-- Name: IDX_e798889a416c4b21c8f61a2769; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e798889a416c4b21c8f61a2769" ON public.preferences_role USING btree ("roleId");


--
-- Name: IDX_e812d2345f4cf3f40ce2bd5a1c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e812d2345f4cf3f40ce2bd5a1c" ON public.competences USING btree ("matiereId");


--
-- Name: IDX_e8bcbe205ffd56f49c66b6b61b; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_e8bcbe205ffd56f49c66b6b61b" ON public.eleves USING btree ("createdAt");


--
-- Name: IDX_e9723638a9b8b248b77513ed4e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e9723638a9b8b248b77513ed4e" ON public.heures_cours USING btree ("etablissementId");


--
-- Name: IDX_eb5446ffa3d1219e771eb58175; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_eb5446ffa3d1219e771eb58175" ON public.evaluations_personnel USING btree ("periodeId");


--
-- Name: IDX_eb54c722f79573140dca58ff05; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_eb54c722f79573140dca58ff05" ON public.tentatives_connexion USING btree ("typeBlocage", "bloqueJusqua");


--
-- Name: IDX_eb94ee7722313530bc0014aa77; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_eb94ee7722313530bc0014aa77" ON public.incidents_personnel USING btree (statut);


--
-- Name: IDX_ec203ffd05a5488445e1be4420; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ec203ffd05a5488445e1be4420" ON public.incidents_eleves USING btree ("etablissementId", "eleveId");


--
-- Name: IDX_ecb1ebb5675786ba2f571ea50b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ecb1ebb5675786ba2f571ea50b" ON public.emploi_du_temps USING btree ("matiereId");


--
-- Name: IDX_edaa6285d9706b86217397a2b2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_edaa6285d9706b86217397a2b2" ON public.matieres_niveaux USING btree ("niveauId", "filiereId");


--
-- Name: IDX_ee78e7bd914a5e5019f5e10412; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ee78e7bd914a5e5019f5e10412" ON public.dossiers_medicaux USING btree ("periodeId");


--
-- Name: IDX_ef389cc17446acebe4ff3d6607; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ef389cc17446acebe4ff3d6607" ON public.scores_personnel USING btree ("categoriePersonnel", "scoreGlobal");


--
-- Name: IDX_ef88a6af7059c4cd6e97c102ef; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ef88a6af7059c4cd6e97c102ef" ON public.incidents_eleves USING btree ("matiereId");


--
-- Name: IDX_efc14c369967119d2720d5b672; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_efc14c369967119d2720d5b672" ON public.abonnements_parking USING btree (statut);


--
-- Name: IDX_f02a20b70a465a36388a207a58; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f02a20b70a465a36388a207a58" ON public.progressions_programme USING btree ("enseignantId");


--
-- Name: IDX_f05eb0c135e91656b39c498625; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f05eb0c135e91656b39c498625" ON public.ecritures_comptables USING btree ("dateEcriture");


--
-- Name: IDX_f140210132d537deb6e7074cc9; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f140210132d537deb6e7074cc9" ON public.utilisateur_permissions USING btree (type);


--
-- Name: IDX_f277b48019cf75814d100814c2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f277b48019cf75814d100814c2" ON public.examens_nationaux USING btree (code);


--
-- Name: IDX_f426583e3f9f3038844c99b9a1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f426583e3f9f3038844c99b9a1" ON public.onboarding_recrutement USING btree ("tuteurId");


--
-- Name: IDX_f4764d0aa219c6d2d1bdd574bc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f4764d0aa219c6d2d1bdd574bc" ON public.utilisateur_etablissements USING btree ("roleId", actif);


--
-- Name: IDX_f4b8b6125c209d5383f982706a; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_f4b8b6125c209d5383f982706a" ON public.frais_scolarite USING btree ("etablissementId", "anneeScolaireId", "niveauId", "classeId");


--
-- Name: IDX_f4d2cd543f4c66736dc0fc4e95; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f4d2cd543f4c66736dc0fc4e95" ON public.historique_scores_personnel USING btree ("categorieScore");


--
-- Name: IDX_f510fba2696bddf2a1d9698513; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f510fba2696bddf2a1d9698513" ON public.annonces USING btree (statut, "dateDebut", "dateFin");


--
-- Name: IDX_f617be62fea45d9ed9dbe463b1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f617be62fea45d9ed9dbe463b1" ON public.salles USING btree ("typeSalle");


--
-- Name: IDX_f654733f0ae7d07e062bfd115e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f654733f0ae7d07e062bfd115e" ON public.paiements USING btree ("eleveId");


--
-- Name: IDX_f6d54f95c31b73fb1bdd8e91d0; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_f6d54f95c31b73fb1bdd8e91d0" ON public.roles USING btree (code);


--
-- Name: IDX_f6f0bd5aeb4e1ad2e24c422dc2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f6f0bd5aeb4e1ad2e24c422dc2" ON public.relances_paiement USING btree ("eleveId");


--
-- Name: IDX_f760a913843684c65876fec49b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f760a913843684c65876fec49b" ON public.indisponibilites_enseignants USING btree ("enseignantId", "dateDebut", "dateFin");


--
-- Name: IDX_f79a886af6efab8f4379418397; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f79a886af6efab8f4379418397" ON public.lignes_transport USING btree ("etablissementId", actif);


--
-- Name: IDX_f8411d48631934f08bbbbc6e85; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_f8411d48631934f08bbbbc6e85" ON public.types_primes USING btree (code);


--
-- Name: IDX_f85c87b95358dab1102da86853; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f85c87b95358dab1102da86853" ON public.cotisations USING btree (actif);


--
-- Name: IDX_f85d651fed0c1d83ecc935ea64; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f85d651fed0c1d83ecc935ea64" ON public.filieres USING btree ("etablissementId");


--
-- Name: IDX_f937024a0398bce32d12c23cb2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f937024a0398bce32d12c23cb2" ON public.indisponibilites_enseignants USING btree ("etablissementId");


--
-- Name: IDX_fa3cf439da48f3a197ceabdd4c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fa3cf439da48f3a197ceabdd4c" ON public.periodes USING btree ("anneeScolaireId");


--
-- Name: IDX_fabd8d6b832affb06b7eb4fe9e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fabd8d6b832affb06b7eb4fe9e" ON public.candidatures USING btree ("createdAt");


--
-- Name: IDX_fb2598139864d3621058f8f437; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fb2598139864d3621058f8f437" ON public.dashboard_layouts USING btree (actif);


--
-- Name: IDX_fb5f1c42f0ac207d1d0ff19468; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fb5f1c42f0ac207d1d0ff19468" ON public.workflows_validation USING btree (statut, "niveauActuel");


--
-- Name: IDX_fbab59305691a91a5d3141e61e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fbab59305691a91a5d3141e61e" ON public.classes USING btree ("etablissementId", "niveauId");


--
-- Name: IDX_fc010df4d4ea1a625154346941; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fc010df4d4ea1a625154346941" ON public.diplomes_eleves USING btree ("eleveId", "examenNationalId");


--
-- Name: IDX_fc7f57a4b6e9ff691a9dc40ef5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fc7f57a4b6e9ff691a9dc40ef5" ON public.incidents_personnel USING btree (gravite);


--
-- Name: IDX_fc9e8d2a3e46c363974a14ff07; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fc9e8d2a3e46c363974a14ff07" ON public.sanctions_eleves USING btree ("anneeScolaireId");


--
-- Name: IDX_fe1a7b9c8f8cfcf0ca35aa3f34; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fe1a7b9c8f8cfcf0ca35aa3f34" ON public.onboarding_recrutement USING btree ("membrePersonnelId");


--
-- Name: IDX_feaf2664af92885ae7f4a76cc8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_feaf2664af92885ae7f4a76cc8" ON public.utilisateur_etablissements USING btree ("utilisateurId", actif);


--
-- Name: IDX_fed433037870bc592e52cc09df; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_fed433037870bc592e52cc09df" ON public.templates_sondage USING btree ("createurId");


--
-- Name: IDX_ff3a144ddf131aecad6c57fdef; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ff3a144ddf131aecad6c57fdef" ON public.evenements_clubs USING btree ("etablissementId");


--
-- Name: IDX_ff4bbbc33159c9b2b011f851d6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ff4bbbc33159c9b2b011f851d6" ON public.historique_configuration USING btree (action, "createdAt");


--
-- Name: IDX_ff645b7444f86a24aa7d6682ed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ff645b7444f86a24aa7d6682ed" ON public.fonds_etablissement USING btree ("fondId");


--
-- Name: IDX_ff6b52571a73ec59d3e1864161; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ff6b52571a73ec59d3e1864161" ON public.absences_personnel USING btree (type);


--
-- Name: IDX_ffbd9985759430025657f72d08; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ffbd9985759430025657f72d08" ON public.categories_depense USING btree ("etablissementId", type);


--
-- Name: IDX_ffc421f23b84c944f77cbe7489; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ffc421f23b84c944f77cbe7489" ON public.incidents_sante USING btree (gravite);


--
-- Name: sondages FK_00aa897a1c410a0564b320324c5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sondages
    ADD CONSTRAINT "FK_00aa897a1c410a0564b320324c5" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: incidents_eleves FK_02cd4f127a6c2dbbc7a458fb7c6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_eleves
    ADD CONSTRAINT "FK_02cd4f127a6c2dbbc7a458fb7c6" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: contrats_personnel FK_02dbc449504eaef29e18434b741; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats_personnel
    ADD CONSTRAINT "FK_02dbc449504eaef29e18434b741" FOREIGN KEY ("posteId") REFERENCES public.postes(id);


--
-- Name: scores_personnel FK_037d6f64423d9a769a73fe94970; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores_personnel
    ADD CONSTRAINT "FK_037d6f64423d9a769a73fe94970" FOREIGN KEY ("typePersonnelId") REFERENCES public.types_personnel(id);


--
-- Name: affectations_matieres FK_03cd211c73b78a17ee6295cf714; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_matieres
    ADD CONSTRAINT "FK_03cd211c73b78a17ee6295cf714" FOREIGN KEY ("classeId") REFERENCES public.classes(id);


--
-- Name: inscriptions_transport FK_04592f66fcda6d10bfbe8bf2169; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_transport
    ADD CONSTRAINT "FK_04592f66fcda6d10bfbe8bf2169" FOREIGN KEY ("ligneId") REFERENCES public.lignes_transport(id);


--
-- Name: types_retenues FK_05810701d95a5e720aeef28e633; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_retenues
    ADD CONSTRAINT "FK_05810701d95a5e720aeef28e633" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: dossiers_medicaux FK_064598e7ca002a042b19413ff0e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_medicaux
    ADD CONSTRAINT "FK_064598e7ca002a042b19413ff0e" FOREIGN KEY ("personnelId") REFERENCES public.membres_personnel(id);


--
-- Name: role_permissions FK_06792d0c62ce6b0203c03643cdd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_06792d0c62ce6b0203c03643cdd" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id);


--
-- Name: niveaux FK_06a536a60bb4f3a1c142285d055; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niveaux
    ADD CONSTRAINT "FK_06a536a60bb4f3a1c142285d055" FOREIGN KEY ("cycleId") REFERENCES public.cycles(id);


--
-- Name: parametre_versions FK_0872a9b132e38016287f455b536; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametre_versions
    ADD CONSTRAINT "FK_0872a9b132e38016287f455b536" FOREIGN KEY ("modifiedBy") REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- Name: templates_message FK_0905391bc91a93201acc8942a6d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates_message
    ADD CONSTRAINT "FK_0905391bc91a93201acc8942a6d" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: templates_sondage FK_0a2ff4ffad5c8d1aae1b2f97382; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates_sondage
    ADD CONSTRAINT "FK_0a2ff4ffad5c8d1aae1b2f97382" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: prets_materiels FK_0c46f2e069f5e54253112cd9146; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prets_materiels
    ADD CONSTRAINT "FK_0c46f2e069f5e54253112cd9146" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: classes FK_0cad5d78e37125153f112c3822b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "FK_0cad5d78e37125153f112c3822b" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: backup_records FK_0d4e0bd9145b797a04c46ee0c74; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_records
    ADD CONSTRAINT "FK_0d4e0bd9145b797a04c46ee0c74" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: bulletins FK_0d637d4ad0944b74284e4ae3ccb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT "FK_0d637d4ad0944b74284e4ae3ccb" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: requetes FK_0e78d9fc39b61e85c1171c900be; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requetes
    ADD CONSTRAINT "FK_0e78d9fc39b61e85c1171c900be" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: affectations_eleves FK_0f4ffec17e72e75133624343522; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_eleves
    ADD CONSTRAINT "FK_0f4ffec17e72e75133624343522" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: cycles FK_0f5eb91cfae746f29a32bc50621; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycles
    ADD CONSTRAINT "FK_0f5eb91cfae746f29a32bc50621" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: bulletins_matieres FK_1067efff75498a4372e388e5eb7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins_matieres
    ADD CONSTRAINT "FK_1067efff75498a4372e388e5eb7" FOREIGN KEY ("bulletinId") REFERENCES public.bulletins(id) ON DELETE CASCADE;


--
-- Name: conversations FK_1096c19969da2370c366829ee42; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "FK_1096c19969da2370c366829ee42" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: clubs FK_111359489e2bb12c5e158b51b26; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT "FK_111359489e2bb12c5e158b51b26" FOREIGN KEY ("responsableId") REFERENCES public.utilisateurs(id);


--
-- Name: programme_chapitres FK_118dda165594d4998aceb7128af; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programme_chapitres
    ADD CONSTRAINT "FK_118dda165594d4998aceb7128af" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: bulletins FK_12650af22b2e3d5e7692bd403da; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT "FK_12650af22b2e3d5e7692bd403da" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: groupe_etablissement_liens FK_12aa3e1693589d80b1f53fa3e13; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe_etablissement_liens
    ADD CONSTRAINT "FK_12aa3e1693589d80b1f53fa3e13" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: specialites FK_12e6733e1bccb8071308c955c70; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialites
    ADD CONSTRAINT "FK_12e6733e1bccb8071308c955c70" FOREIGN KEY ("filiereId") REFERENCES public.filieres(id);


--
-- Name: refresh_tokens FK_1363d5d55dd6d7d99997f3f33db; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT "FK_1363d5d55dd6d7d99997f3f33db" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: depenses FK_14387396667b3df507e470f2c73; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depenses
    ADD CONSTRAINT "FK_14387396667b3df507e470f2c73" FOREIGN KEY ("categorieDepenseId") REFERENCES public.categories_depense(id);


--
-- Name: bulletins FK_14cf171ba6aa049af98eb83fff9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT "FK_14cf171ba6aa049af98eb83fff9" FOREIGN KEY ("classeId") REFERENCES public.classes(id);


--
-- Name: matieres_niveaux FK_14d23287948d85e6b62b6546c78; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matieres_niveaux
    ADD CONSTRAINT "FK_14d23287948d85e6b62b6546c78" FOREIGN KEY ("matiereId") REFERENCES public.matieres(id);


--
-- Name: inscriptions_cantine FK_14d63664ce01e6890810858d03a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_cantine
    ADD CONSTRAINT "FK_14d63664ce01e6890810858d03a" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: absences_personnel FK_1543bfe89e52a01b6d8c759562f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absences_personnel
    ADD CONSTRAINT "FK_1543bfe89e52a01b6d8c759562f" FOREIGN KEY ("membrePersonnelId") REFERENCES public.membres_personnel(id);


--
-- Name: sondages FK_1672a70cfad908fa8c68f1d7f7c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sondages
    ADD CONSTRAINT "FK_1672a70cfad908fa8c68f1d7f7c" FOREIGN KEY ("auteurId") REFERENCES public.utilisateurs(id);


--
-- Name: salles FK_16e5dad6fd0d3f4ab15c6d22acf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salles
    ADD CONSTRAINT "FK_16e5dad6fd0d3f4ab15c6d22acf" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: echeanciers_paiement FK_17046d6b993d1b8b81793229522; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeanciers_paiement
    ADD CONSTRAINT "FK_17046d6b993d1b8b81793229522" FOREIGN KEY ("fraisScolariteId") REFERENCES public.frais_scolarite(id);


--
-- Name: bulletins FK_1900cfdf6558edf01389db28188; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT "FK_1900cfdf6558edf01389db28188" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: classes FK_1ac2df5bfacc8b5e3f498ebfc0e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "FK_1ac2df5bfacc8b5e3f498ebfc0e" FOREIGN KEY ("niveauId") REFERENCES public.niveaux(id);


--
-- Name: presences_transport FK_1b2e93a6cbfd3b9199dd0a78bdf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences_transport
    ADD CONSTRAINT "FK_1b2e93a6cbfd3b9199dd0a78bdf" FOREIGN KEY ("inscriptionId") REFERENCES public.inscriptions_transport(id);


--
-- Name: offres_emploi FK_1d738616d2aa096d72e5fdb2921; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_emploi
    ADD CONSTRAINT "FK_1d738616d2aa096d72e5fdb2921" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: recus_paiement FK_1dc82f957b4638c63ff7055dbe3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recus_paiement
    ADD CONSTRAINT "FK_1dc82f957b4638c63ff7055dbe3" FOREIGN KEY ("paiementId") REFERENCES public.paiements(id);


--
-- Name: offres_emploi FK_1ded106d27f51c21e471486bca7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_emploi
    ADD CONSTRAINT "FK_1ded106d27f51c21e471486bca7" FOREIGN KEY ("posteId") REFERENCES public.postes(id);


--
-- Name: incidents_eleves FK_1e470f179259b2cbbcf81edc8e9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_eleves
    ADD CONSTRAINT "FK_1e470f179259b2cbbcf81edc8e9" FOREIGN KEY ("enseignantId") REFERENCES public.utilisateurs(id);


--
-- Name: entretiens_recrutement FK_1e4ce82dbd3f88b6f496693b355; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entretiens_recrutement
    ADD CONSTRAINT "FK_1e4ce82dbd3f88b6f496693b355" FOREIGN KEY ("offreEmploiId") REFERENCES public.offres_emploi(id);


--
-- Name: preferences_utilisateur FK_2022b9fef2b4916d967d61f8946; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferences_utilisateur
    ADD CONSTRAINT "FK_2022b9fef2b4916d967d61f8946" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: matieres_niveaux FK_209d7a30c626d684d7aad59f352; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matieres_niveaux
    ADD CONSTRAINT "FK_209d7a30c626d684d7aad59f352" FOREIGN KEY ("groupeId") REFERENCES public.groupes_matieres(id);


--
-- Name: sanctions_eleves FK_21c17286924b3857f66c2c236a1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sanctions_eleves
    ADD CONSTRAINT "FK_21c17286924b3857f66c2c236a1" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: points_utilisateurs FK_23397f8aa39a4a08d648481752b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_utilisateurs
    ADD CONSTRAINT "FK_23397f8aa39a4a08d648481752b" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id);


--
-- Name: sondage_votes FK_23a6994b9318c431c736a504710; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sondage_votes
    ADD CONSTRAINT "FK_23a6994b9318c431c736a504710" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id);


--
-- Name: utilisateur_etablissements FK_24ff1adba5de7214e4cce12640c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_etablissements
    ADD CONSTRAINT "FK_24ff1adba5de7214e4cce12640c" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: scores_personnel FK_264a2db6ac53414682b2adebcc5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores_personnel
    ADD CONSTRAINT "FK_264a2db6ac53414682b2adebcc5" FOREIGN KEY ("membrePersonnelId") REFERENCES public.membres_personnel(id);


--
-- Name: heures_cours FK_26c1930f69d6c4488a1e493db07; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heures_cours
    ADD CONSTRAINT "FK_26c1930f69d6c4488a1e493db07" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: groupe_etablissement_liens FK_27ee52c223e32cf629704a373cc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe_etablissement_liens
    ADD CONSTRAINT "FK_27ee52c223e32cf629704a373cc" FOREIGN KEY ("groupeId") REFERENCES public.groupes_etablissements(id) ON DELETE CASCADE;


--
-- Name: unites_organisationnelles FK_295097df403e1811989fb6d3a20; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unites_organisationnelles
    ADD CONSTRAINT "FK_295097df403e1811989fb6d3a20" FOREIGN KEY ("organisationId") REFERENCES public.organisations(id) ON DELETE CASCADE;


--
-- Name: messages FK_2adec74dd38c1090c93842c92da; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "FK_2adec74dd38c1090c93842c92da" FOREIGN KEY ("expediteurId") REFERENCES public.utilisateurs(id);


--
-- Name: heures_cours FK_2b0c07ab0821287fb73d31b44b5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heures_cours
    ADD CONSTRAINT "FK_2b0c07ab0821287fb73d31b44b5" FOREIGN KEY ("enseignantId") REFERENCES public.membres_personnel(id);


--
-- Name: sondage_options FK_2baa7c6db65b89d359cdb2bab4f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sondage_options
    ADD CONSTRAINT "FK_2baa7c6db65b89d359cdb2bab4f" FOREIGN KEY ("sondageId") REFERENCES public.sondages(id) ON DELETE CASCADE;


--
-- Name: inscriptions_clubs FK_2bc4a8fceba7c482c20a0a5df8f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_clubs
    ADD CONSTRAINT "FK_2bc4a8fceba7c482c20a0a5df8f" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: sanctions_eleves FK_2c1426a4302c0107cbfcf3f2a75; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sanctions_eleves
    ADD CONSTRAINT "FK_2c1426a4302c0107cbfcf3f2a75" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: repartitions_horaires FK_2c653de3980ff7311914a72d347; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repartitions_horaires
    ADD CONSTRAINT "FK_2c653de3980ff7311914a72d347" FOREIGN KEY ("affectationId") REFERENCES public.affectations_matieres(id) ON DELETE CASCADE;


--
-- Name: incidents_sante FK_2c7458dcf4dba71a16a4b099019; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_sante
    ADD CONSTRAINT "FK_2c7458dcf4dba71a16a4b099019" FOREIGN KEY ("declareParId") REFERENCES public.utilisateurs(id);


--
-- Name: entretiens_recrutement FK_2d1ce964cec16f4832292b43b2a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entretiens_recrutement
    ADD CONSTRAINT "FK_2d1ce964cec16f4832292b43b2a" FOREIGN KEY ("evaluateurId") REFERENCES public.membres_personnel(id);


--
-- Name: incidents_personnel FK_2f5c30dc42d4f3924fb45192009; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_personnel
    ADD CONSTRAINT "FK_2f5c30dc42d4f3924fb45192009" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: remises FK_2fbf49f249ede53e3419e055806; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remises
    ADD CONSTRAINT "FK_2fbf49f249ede53e3419e055806" FOREIGN KEY ("cycleId") REFERENCES public.cycles(id);


--
-- Name: consultations_medicales FK_30ec2db1af37a3065937e3f1feb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations_medicales
    ADD CONSTRAINT "FK_30ec2db1af37a3065937e3f1feb" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: utilisateur_permissions FK_329dcae45f2d2b23c6b2f8531f2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_permissions
    ADD CONSTRAINT "FK_329dcae45f2d2b23c6b2f8531f2" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: affectations_matieres FK_33afb32936e1ff0c0afd751d21d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_matieres
    ADD CONSTRAINT "FK_33afb32936e1ff0c0afd751d21d" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: eleves FK_3405ef4ac266db68f3a034c2756; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT "FK_3405ef4ac266db68f3a034c2756" FOREIGN KEY ("traitePar") REFERENCES public.utilisateurs(id);


--
-- Name: inscriptions_options FK_358a4de603e8aa860e597c1ff63; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_options
    ADD CONSTRAINT "FK_358a4de603e8aa860e597c1ff63" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: paiements FK_38721c3662d1c187d9b1e81be65; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT "FK_38721c3662d1c187d9b1e81be65" FOREIGN KEY ("echeancierId") REFERENCES public.echeanciers_paiement(id);


--
-- Name: contrats_personnel FK_38c6b5d3d81ca95ad6fcac67187; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats_personnel
    ADD CONSTRAINT "FK_38c6b5d3d81ca95ad6fcac67187" FOREIGN KEY ("uniteOrganisationnelleId") REFERENCES public.unites_organisationnelles(id);


--
-- Name: inscriptions_clubs FK_39bc3518c5e080d9ca9ed3cd566; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_clubs
    ADD CONSTRAINT "FK_39bc3518c5e080d9ca9ed3cd566" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: inscriptions_options FK_39dcf34b18d7a54eff2b96d0586; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_options
    ADD CONSTRAINT "FK_39dcf34b18d7a54eff2b96d0586" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: periodes FK_3ab8a27316e0a2c06279630ce7e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodes
    ADD CONSTRAINT "FK_3ab8a27316e0a2c06279630ce7e" FOREIGN KEY ("typeId") REFERENCES public.types_periodes(id);


--
-- Name: cartes FK_3b1fba7b1910e2fb45b941e24eb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartes
    ADD CONSTRAINT "FK_3b1fba7b1910e2fb45b941e24eb" FOREIGN KEY ("modeleCarteId") REFERENCES public.modeles_cartes(id);


--
-- Name: emploi_du_temps FK_3b9e2acf3ff3aefdd313bd0e6e6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emploi_du_temps
    ADD CONSTRAINT "FK_3b9e2acf3ff3aefdd313bd0e6e6" FOREIGN KEY ("salleId") REFERENCES public.salles(id);


--
-- Name: badges_utilisateurs FK_3c40228920a7d80f98362452cef; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges_utilisateurs
    ADD CONSTRAINT "FK_3c40228920a7d80f98362452cef" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id);


--
-- Name: historique_points FK_3d6b0b2c9b81b90e9da6fff3ff5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_points
    ADD CONSTRAINT "FK_3d6b0b2c9b81b90e9da6fff3ff5" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id);


--
-- Name: programme_chapitres FK_3da4510a4f54bc5ddedb31cdf77; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programme_chapitres
    ADD CONSTRAINT "FK_3da4510a4f54bc5ddedb31cdf77" FOREIGN KEY ("matiereNiveauId") REFERENCES public.matieres_niveaux(id) ON DELETE CASCADE;


--
-- Name: historique_scores_personnel FK_3e461913c63de56b62cd2294575; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_scores_personnel
    ADD CONSTRAINT "FK_3e461913c63de56b62cd2294575" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: annonce_ciblages FK_3f503a9141a6d4f4c92aab447d0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonce_ciblages
    ADD CONSTRAINT "FK_3f503a9141a6d4f4c92aab447d0" FOREIGN KEY ("annonceId") REFERENCES public.annonces(id) ON DELETE CASCADE;


--
-- Name: heures_cours FK_3f5246c6db7d901a95e0cc99132; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heures_cours
    ADD CONSTRAINT "FK_3f5246c6db7d901a95e0cc99132" FOREIGN KEY ("remplacantId") REFERENCES public.membres_personnel(id);


--
-- Name: comptes_bancaires FK_3fc121afd6d48a8852d43f7018d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comptes_bancaires
    ADD CONSTRAINT "FK_3fc121afd6d48a8852d43f7018d" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: examens_nationaux FK_40cc084427b093f882b21d3055c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens_nationaux
    ADD CONSTRAINT "FK_40cc084427b093f882b21d3055c" FOREIGN KEY ("niveauId") REFERENCES public.niveaux(id);


--
-- Name: periodes FK_40f05b610b524f3e712cdc8db82; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodes
    ADD CONSTRAINT "FK_40f05b610b524f3e712cdc8db82" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: remises FK_42ef9f1c1334b588e360eb82467; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remises
    ADD CONSTRAINT "FK_42ef9f1c1334b588e360eb82467" FOREIGN KEY ("classeId") REFERENCES public.classes(id);


--
-- Name: consommations_cantine FK_439a0f327ac4fb63d09df8f70c1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consommations_cantine
    ADD CONSTRAINT "FK_439a0f327ac4fb63d09df8f70c1" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: groupe_admins FK_441a7000dd4ae7213ec8effa4f2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe_admins
    ADD CONSTRAINT "FK_441a7000dd4ae7213ec8effa4f2" FOREIGN KEY ("groupeId") REFERENCES public.groupes_etablissements(id) ON DELETE CASCADE;


--
-- Name: message_mentions FK_451947229942dee3c31b8b70213; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_mentions
    ADD CONSTRAINT "FK_451947229942dee3c31b8b70213" FOREIGN KEY ("messageId") REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: requetes FK_45c78dbec77d96c58f1b027c175; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requetes
    ADD CONSTRAINT "FK_45c78dbec77d96c58f1b027c175" FOREIGN KEY ("approbateurId") REFERENCES public.utilisateurs(id);


--
-- Name: inscriptions_options FK_465ba2f1996092519cb2a1334a1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_options
    ADD CONSTRAINT "FK_465ba2f1996092519cb2a1334a1" FOREIGN KEY ("matiereId") REFERENCES public.matieres(id);


--
-- Name: programme_chapitres FK_466305a3546c7bd651c9e3da987; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programme_chapitres
    ADD CONSTRAINT "FK_466305a3546c7bd651c9e3da987" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id) ON DELETE SET NULL;


--
-- Name: filieres FK_466bf85d603158abf97137cb551; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filieres
    ADD CONSTRAINT "FK_466bf85d603158abf97137cb551" FOREIGN KEY ("cycleId") REFERENCES public.cycles(id);


--
-- Name: eleves FK_4723603197777a0e38aee28dcae; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT "FK_4723603197777a0e38aee28dcae" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: mouvements_caisse FK_47fe649d2ac89af3729be248efa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mouvements_caisse
    ADD CONSTRAINT "FK_47fe649d2ac89af3729be248efa" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: consultations_medicales FK_4818f97080ffb8af155018a4f2b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations_medicales
    ADD CONSTRAINT "FK_4818f97080ffb8af155018a4f2b" FOREIGN KEY ("consultantId") REFERENCES public.utilisateurs(id);


--
-- Name: incidents_personnel FK_4831497020dabe97e476ce8a484; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_personnel
    ADD CONSTRAINT "FK_4831497020dabe97e476ce8a484" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: matieres FK_48b5bb747e29e5b31cd2abb791a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matieres
    ADD CONSTRAINT "FK_48b5bb747e29e5b31cd2abb791a" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: candidatures FK_4b2a365ba185f2c50713d9830ea; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures
    ADD CONSTRAINT "FK_4b2a365ba185f2c50713d9830ea" FOREIGN KEY ("offreEmploiId") REFERENCES public.offres_emploi(id);


--
-- Name: affectations_postes FK_4d55961db1299c65f5db4320fd8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_postes
    ADD CONSTRAINT "FK_4d55961db1299c65f5db4320fd8" FOREIGN KEY ("membrePersonnelId") REFERENCES public.membres_personnel(id) ON DELETE CASCADE;


--
-- Name: evaluations_personnel FK_4e27f4a62d0cecd82f49d4af51c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations_personnel
    ADD CONSTRAINT "FK_4e27f4a62d0cecd82f49d4af51c" FOREIGN KEY ("evaluateurId") REFERENCES public.utilisateurs(id);


--
-- Name: sanctions_eleves FK_4f019be481e0773ba6ab445d4d0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sanctions_eleves
    ADD CONSTRAINT "FK_4f019be481e0773ba6ab445d4d0" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: inscriptions_transport FK_4f7ad64f1df99f5375cec0549d9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_transport
    ADD CONSTRAINT "FK_4f7ad64f1df99f5375cec0549d9" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: affectations_matieres FK_53a4ee583b90e83ada48ee3974d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_matieres
    ADD CONSTRAINT "FK_53a4ee583b90e83ada48ee3974d" FOREIGN KEY ("matiereId") REFERENCES public.matieres(id);


--
-- Name: groupes_etablissements FK_54d9d53ad51288c8a57c1f0b22d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupes_etablissements
    ADD CONSTRAINT "FK_54d9d53ad51288c8a57c1f0b22d" FOREIGN KEY ("proprietaireId") REFERENCES public.utilisateurs(id) ON DELETE RESTRICT;


--
-- Name: remises FK_572df48c9ed7faeb87cf16a8c13; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remises
    ADD CONSTRAINT "FK_572df48c9ed7faeb87cf16a8c13" FOREIGN KEY ("filiereId") REFERENCES public.filieres(id);


--
-- Name: message_reactions FK_582ac260193fe4c27b447daa2ba; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT "FK_582ac260193fe4c27b447daa2ba" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: messages FK_5867d48fc57fdb77cc9a9d9ca48; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "FK_5867d48fc57fdb77cc9a9d9ca48" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: consommations_cantine FK_599e191ddf66b349c719d9a2e59; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consommations_cantine
    ADD CONSTRAINT "FK_599e191ddf66b349c719d9a2e59" FOREIGN KEY ("menuId") REFERENCES public.menus_cantine(id);


--
-- Name: niveaux FK_5a5bdd4428d741453fc5bca4722; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niveaux
    ADD CONSTRAINT "FK_5a5bdd4428d741453fc5bca4722" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: participants_conversation FK_5de73a721caa36ea32465a912c0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants_conversation
    ADD CONSTRAINT "FK_5de73a721caa36ea32465a912c0" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: indisponibilites_enseignants FK_5e7532030cf6811987c046e9155; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indisponibilites_enseignants
    ADD CONSTRAINT "FK_5e7532030cf6811987c046e9155" FOREIGN KEY ("enseignantId") REFERENCES public.membres_personnel(id);


--
-- Name: conversations FK_5f68e32dcdb6ca87f66574a05d5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "FK_5f68e32dcdb6ca87f66574a05d5" FOREIGN KEY ("createurId") REFERENCES public.utilisateurs(id);


--
-- Name: bulletins_paie FK_60133837c50126be6ad4404cea7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins_paie
    ADD CONSTRAINT "FK_60133837c50126be6ad4404cea7" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: workflows_validation FK_60f327b5385dbcf187ed1ba2d08; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflows_validation
    ADD CONSTRAINT "FK_60f327b5385dbcf187ed1ba2d08" FOREIGN KEY ("dernierValidateurId") REFERENCES public.utilisateurs(id);


--
-- Name: roles FK_633896956090cdd56c930423f6d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "FK_633896956090cdd56c930423f6d" FOREIGN KEY ("parentId") REFERENCES public.roles(id);


--
-- Name: membres_personnel FK_646c6ecc53c5752c49d48fab453; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membres_personnel
    ADD CONSTRAINT "FK_646c6ecc53c5752c49d48fab453" FOREIGN KEY ("typePersonnelId") REFERENCES public.types_personnel(id);


--
-- Name: entretiens_recrutement FK_64ca3cc590a4ef3abd1db091560; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entretiens_recrutement
    ADD CONSTRAINT "FK_64ca3cc590a4ef3abd1db091560" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: annonces FK_64cdb31c1ab068815eb54705ae1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT "FK_64cdb31c1ab068815eb54705ae1" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: onboarding_recrutement FK_64f980e97a72b75ef7ae4be2ee6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_recrutement
    ADD CONSTRAINT "FK_64f980e97a72b75ef7ae4be2ee6" FOREIGN KEY ("offreEmploiId") REFERENCES public.offres_emploi(id);


--
-- Name: historique_scores_personnel FK_653d4d149a9b367bffe636f9cc1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_scores_personnel
    ADD CONSTRAINT "FK_653d4d149a9b367bffe636f9cc1" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: lignes_transport FK_67dfa261491ad13a9637e90b621; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_transport
    ADD CONSTRAINT "FK_67dfa261491ad13a9637e90b621" FOREIGN KEY ("chauffeurId") REFERENCES public.utilisateurs(id);


--
-- Name: affectations_postes FK_6961271b3efb91f0174702ba327; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_postes
    ADD CONSTRAINT "FK_6961271b3efb91f0174702ba327" FOREIGN KEY ("posteId") REFERENCES public.postes(id) ON DELETE CASCADE;


--
-- Name: competences FK_6bbbeb8e10df100e0e7642219b5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competences
    ADD CONSTRAINT "FK_6bbbeb8e10df100e0e7642219b5" FOREIGN KEY ("niveauId") REFERENCES public.niveaux(id);


--
-- Name: annonces FK_6c1195c98054ccd37757b241ae5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT "FK_6c1195c98054ccd37757b241ae5" FOREIGN KEY ("validePar") REFERENCES public.utilisateurs(id);


--
-- Name: frais_scolarite FK_6d7ef8e0bc9045db1c159fe0b38; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais_scolarite
    ADD CONSTRAINT "FK_6d7ef8e0bc9045db1c159fe0b38" FOREIGN KEY ("niveauId") REFERENCES public.niveaux(id);


--
-- Name: notes FK_6e1c8e7fd56fa259ab2e60b5d2d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "FK_6e1c8e7fd56fa259ab2e60b5d2d" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: felicitations_eleves FK_6f60d360e592d7ebf58b610172f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.felicitations_eleves
    ADD CONSTRAINT "FK_6f60d360e592d7ebf58b610172f" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: candidatures FK_7066a4671a4d03ef608c5db0922; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures
    ADD CONSTRAINT "FK_7066a4671a4d03ef608c5db0922" FOREIGN KEY ("examineParId") REFERENCES public.membres_personnel(id);


--
-- Name: consultations_medicales FK_72936be7d2af77143b4450b9d1e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations_medicales
    ADD CONSTRAINT "FK_72936be7d2af77143b4450b9d1e" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: observations_eleves FK_72c8dbc34d4b8b69d0bb4cf7f7c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.observations_eleves
    ADD CONSTRAINT "FK_72c8dbc34d4b8b69d0bb4cf7f7c" FOREIGN KEY ("observateurId") REFERENCES public.utilisateurs(id);


--
-- Name: affectations_matieres FK_7319bf4c623293d9417da6a80ac; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_matieres
    ADD CONSTRAINT "FK_7319bf4c623293d9417da6a80ac" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: felicitations_eleves FK_75f851e15b99869968474425260; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.felicitations_eleves
    ADD CONSTRAINT "FK_75f851e15b99869968474425260" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: incidents_personnel FK_7616a5320dc4600c441b60cfb32; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_personnel
    ADD CONSTRAINT "FK_7616a5320dc4600c441b60cfb32" FOREIGN KEY ("membrePersonnelId") REFERENCES public.membres_personnel(id);


--
-- Name: message_reactions FK_7623d77216e8457a552490259e0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT "FK_7623d77216e8457a552490259e0" FOREIGN KEY ("messageId") REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: materiels FK_76f74b0ac62bfc7c0ebcff763da; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materiels
    ADD CONSTRAINT "FK_76f74b0ac62bfc7c0ebcff763da" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: incidents_eleves FK_76f9bb87e271cbce42c411de5de; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_eleves
    ADD CONSTRAINT "FK_76f9bb87e271cbce42c411de5de" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: depenses FK_78a3a8939ea7f06147350e26fd5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depenses
    ADD CONSTRAINT "FK_78a3a8939ea7f06147350e26fd5" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: historique_scores_personnel FK_78e18fb0557acb8f537c9c4ed7d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_scores_personnel
    ADD CONSTRAINT "FK_78e18fb0557acb8f537c9c4ed7d" FOREIGN KEY ("scorePersonnelId") REFERENCES public.scores_personnel(id);


--
-- Name: classes FK_797bc19cb72508cf9ff1d777599; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "FK_797bc19cb72508cf9ff1d777599" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: bulletins_paie FK_79a2b83735e9f3c685372cc4e74; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins_paie
    ADD CONSTRAINT "FK_79a2b83735e9f3c685372cc4e74" FOREIGN KEY ("membrePersonnelId") REFERENCES public.membres_personnel(id) ON DELETE CASCADE;


--
-- Name: bulletins_workflow FK_79d5ed210311ab69ed0ad3de773; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins_workflow
    ADD CONSTRAINT "FK_79d5ed210311ab69ed0ad3de773" FOREIGN KEY ("validateurId") REFERENCES public.utilisateurs(id);


--
-- Name: specialites FK_7ac565e0d2d444c4204e044e982; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialites
    ADD CONSTRAINT "FK_7ac565e0d2d444c4204e044e982" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: progressions_programme FK_7b35d9df817c6aa3af712870e06; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progressions_programme
    ADD CONSTRAINT "FK_7b35d9df817c6aa3af712870e06" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: prets_materiels FK_7c3fd02a5a67963fdc7821f917f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prets_materiels
    ADD CONSTRAINT "FK_7c3fd02a5a67963fdc7821f917f" FOREIGN KEY ("materielId") REFERENCES public.materiels(id);


--
-- Name: utilisateur_etablissements FK_7ce7edcf242cf7de10460048d56; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_etablissements
    ADD CONSTRAINT "FK_7ce7edcf242cf7de10460048d56" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: evaluations_competences FK_7ed734e8bc61fe05cf508fc5477; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations_competences
    ADD CONSTRAINT "FK_7ed734e8bc61fe05cf508fc5477" FOREIGN KEY ("noteId") REFERENCES public.notes(id) ON DELETE CASCADE;


--
-- Name: contrats_personnel FK_7f1df4c85c7739fa830256198a9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats_personnel
    ADD CONSTRAINT "FK_7f1df4c85c7739fa830256198a9" FOREIGN KEY ("membrePersonnelId") REFERENCES public.membres_personnel(id) ON DELETE CASCADE;


--
-- Name: budgets FK_7fc71c57fcd78b019203cef6fc7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT "FK_7fc71c57fcd78b019203cef6fc7" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: cotisations FK_814e5b0a0816a2144db24ef1914; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cotisations
    ADD CONSTRAINT "FK_814e5b0a0816a2144db24ef1914" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: dashboard_layouts FK_815d6e76c5bb0fae935a452b5b8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_layouts
    ADD CONSTRAINT "FK_815d6e76c5bb0fae935a452b5b8" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: scores_personnel FK_81b66a9eb848cbebacc00788c60; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores_personnel
    ADD CONSTRAINT "FK_81b66a9eb848cbebacc00788c60" FOREIGN KEY ("matiereId") REFERENCES public.matieres(id);


--
-- Name: demandes_depense FK_84ac135d1e929e839ca411ab54c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandes_depense
    ADD CONSTRAINT "FK_84ac135d1e929e839ca411ab54c" FOREIGN KEY ("categorieDepenseId") REFERENCES public.categories_depense(id);


--
-- Name: utilisateur_permissions FK_86354c5699f9aece0002f62c74f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_permissions
    ADD CONSTRAINT "FK_86354c5699f9aece0002f62c74f" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: annees_scolaires FK_8657fa4f26cebf6dec0a2e444dd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annees_scolaires
    ADD CONSTRAINT "FK_8657fa4f26cebf6dec0a2e444dd" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: requetes FK_868cbdf947153c467549fc600c3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requetes
    ADD CONSTRAINT "FK_868cbdf947153c467549fc600c3" FOREIGN KEY ("demandeurId") REFERENCES public.utilisateurs(id);


--
-- Name: lignes_transport FK_86e0f44acac54b26d3eaddce415; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_transport
    ADD CONSTRAINT "FK_86e0f44acac54b26d3eaddce415" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: inscriptions_options FK_8770d8b880a0e5f2048acead868; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_options
    ADD CONSTRAINT "FK_8770d8b880a0e5f2048acead868" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: entretiens_recrutement FK_88691c9e25339b1b08ad0cd80dd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entretiens_recrutement
    ADD CONSTRAINT "FK_88691c9e25339b1b08ad0cd80dd" FOREIGN KEY ("candidatureId") REFERENCES public.candidatures(id);


--
-- Name: sanctions_eleves FK_88de968d36adeeb94949a325942; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sanctions_eleves
    ADD CONSTRAINT "FK_88de968d36adeeb94949a325942" FOREIGN KEY ("decideParId") REFERENCES public.utilisateurs(id);


--
-- Name: incidents_personnel FK_8a06c910ea538c3e04a8b563188; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_personnel
    ADD CONSTRAINT "FK_8a06c910ea538c3e04a8b563188" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: scores_personnel FK_8a4778cfb71f55da3ccd20aa5ef; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores_personnel
    ADD CONSTRAINT "FK_8a4778cfb71f55da3ccd20aa5ef" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: felicitations_eleves FK_8a4dc32d53ef8dc992312e45fd1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.felicitations_eleves
    ADD CONSTRAINT "FK_8a4dc32d53ef8dc992312e45fd1" FOREIGN KEY ("attribueParId") REFERENCES public.utilisateurs(id);


--
-- Name: offres_emploi FK_8ba5c333a2025a21a1e0f242755; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_emploi
    ADD CONSTRAINT "FK_8ba5c333a2025a21a1e0f242755" FOREIGN KEY ("uniteOrganisationnelleId") REFERENCES public.unites_organisationnelles(id);


--
-- Name: elements_salaire FK_8c207fd9552c24b2e15a2e6e447; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.elements_salaire
    ADD CONSTRAINT "FK_8c207fd9552c24b2e15a2e6e447" FOREIGN KEY ("bulletinPaieId") REFERENCES public.bulletins_paie(id) ON DELETE CASCADE;


--
-- Name: diplomes_eleves FK_8c266c819db22d4d047ff1c2d39; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diplomes_eleves
    ADD CONSTRAINT "FK_8c266c819db22d4d047ff1c2d39" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: annonces FK_8c9123e458e6faec8832ba94b2b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT "FK_8c9123e458e6faec8832ba94b2b" FOREIGN KEY ("updatedBy") REFERENCES public.utilisateurs(id);


--
-- Name: notes FK_8cda0009557df267df95aea9459; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "FK_8cda0009557df267df95aea9459" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: affectations_postes FK_8d9b443ba149dcffef86f8e18aa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_postes
    ADD CONSTRAINT "FK_8d9b443ba149dcffef86f8e18aa" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: incidents_eleves FK_8da379d55b6973eba5fe12cc1ab; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_eleves
    ADD CONSTRAINT "FK_8da379d55b6973eba5fe12cc1ab" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: classes FK_8e174e4d78bcd0fc3433ea28b12; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "FK_8e174e4d78bcd0fc3433ea28b12" FOREIGN KEY ("filiereId") REFERENCES public.filieres(id);


--
-- Name: evaluations_personnel FK_8e85ab8c819af5a116b9efc559b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations_personnel
    ADD CONSTRAINT "FK_8e85ab8c819af5a116b9efc559b" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: incidents_sante FK_8ebfd6b25b8978ca268bd76d549; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_sante
    ADD CONSTRAINT "FK_8ebfd6b25b8978ca268bd76d549" FOREIGN KEY ("dossierMedicalId") REFERENCES public.dossiers_medicaux(id);


--
-- Name: audit_logs FK_9097c44566a3c1fc5cd5b4132c1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "FK_9097c44566a3c1fc5cd5b4132c1" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id);


--
-- Name: vehicules FK_910446f1e8a1bd1e48c1dcea2b1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicules
    ADD CONSTRAINT "FK_910446f1e8a1bd1e48c1dcea2b1" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: affectations_eleves FK_91baf3c28e4dc9489a074a25f90; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_eleves
    ADD CONSTRAINT "FK_91baf3c28e4dc9489a074a25f90" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: heures_cours FK_91e496758c01486246674ffaa9d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heures_cours
    ADD CONSTRAINT "FK_91e496758c01486246674ffaa9d" FOREIGN KEY ("classeId") REFERENCES public.classes(id);


--
-- Name: affectations_postes FK_91ef4aaafdc36da3b88fc8f5608; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_postes
    ADD CONSTRAINT "FK_91ef4aaafdc36da3b88fc8f5608" FOREIGN KEY ("contratId") REFERENCES public.contrats_personnel(id);


--
-- Name: scores_personnel FK_9226bbc06cb534a6f17e637d70c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores_personnel
    ADD CONSTRAINT "FK_9226bbc06cb534a6f17e637d70c" FOREIGN KEY ("classeId") REFERENCES public.classes(id);


--
-- Name: absences_personnel FK_941fb3093c186523a57ad3eadb6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absences_personnel
    ADD CONSTRAINT "FK_941fb3093c186523a57ad3eadb6" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: participants_conversation FK_94aae84832d3f4eb66043d893a7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants_conversation
    ADD CONSTRAINT "FK_94aae84832d3f4eb66043d893a7" FOREIGN KEY ("conversationId") REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: membres_personnel FK_9525f299224d9c9d919fd94ca41; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membres_personnel
    ADD CONSTRAINT "FK_9525f299224d9c9d919fd94ca41" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id);


--
-- Name: affectations_matieres FK_95f7b67cadd416c0c0f3f22368a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_matieres
    ADD CONSTRAINT "FK_95f7b67cadd416c0c0f3f22368a" FOREIGN KEY ("enseignantId") REFERENCES public.membres_personnel(id);


--
-- Name: incidents_eleves FK_963cb9695b259a62acf8f2874b4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_eleves
    ADD CONSTRAINT "FK_963cb9695b259a62acf8f2874b4" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: cartes FK_97aacad0c00edd59ab1bedb7e5b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartes
    ADD CONSTRAINT "FK_97aacad0c00edd59ab1bedb7e5b" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: bulletins_workflow FK_9938885de58b812d3d6ab50d126; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins_workflow
    ADD CONSTRAINT "FK_9938885de58b812d3d6ab50d126" FOREIGN KEY ("bulletinId") REFERENCES public.bulletins(id) ON DELETE CASCADE;


--
-- Name: contrats_personnel FK_9a46b79d883d60c02ef365d76cd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats_personnel
    ADD CONSTRAINT "FK_9a46b79d883d60c02ef365d76cd" FOREIGN KEY ("typeContratId") REFERENCES public.types_contrat_personnalises(id);


--
-- Name: cartes FK_9a9ea6762e1f8ff0f79438f9fc0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartes
    ADD CONSTRAINT "FK_9a9ea6762e1f8ff0f79438f9fc0" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id);


--
-- Name: types_contrat_personnalises FK_9b43e01228694dcd25dbd10fc9d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_contrat_personnalises
    ADD CONSTRAINT "FK_9b43e01228694dcd25dbd10fc9d" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: notes FK_9b4597989f054bf95c8a5f0a399; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "FK_9b4597989f054bf95c8a5f0a399" FOREIGN KEY ("enseignantId") REFERENCES public.membres_personnel(id);


--
-- Name: sondage_votes FK_9b6993268b267bc9cd45a701976; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sondage_votes
    ADD CONSTRAINT "FK_9b6993268b267bc9cd45a701976" FOREIGN KEY ("sondageId") REFERENCES public.sondages(id) ON DELETE CASCADE;


--
-- Name: dossiers_medicaux FK_9be0d716252de42d78a01e0b511; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_medicaux
    ADD CONSTRAINT "FK_9be0d716252de42d78a01e0b511" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: echeanciers_paiement FK_9c709d7f4c5dffde06a9626b9f5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeanciers_paiement
    ADD CONSTRAINT "FK_9c709d7f4c5dffde06a9626b9f5" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: messages_fichiers FK_9d5553ac515512ad30986832bd6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages_fichiers
    ADD CONSTRAINT "FK_9d5553ac515512ad30986832bd6" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: emploi_du_temps FK_a06e62c5bc0c046b30ef5012ef0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emploi_du_temps
    ADD CONSTRAINT "FK_a06e62c5bc0c046b30ef5012ef0" FOREIGN KEY ("classeId") REFERENCES public.classes(id);


--
-- Name: contrats_personnel FK_a3899c1a722c3c9b3b27cc66cf4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats_personnel
    ADD CONSTRAINT "FK_a3899c1a722c3c9b3b27cc66cf4" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: historique_scores_personnel FK_a414d0f27713b9d752dd86eda59; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_scores_personnel
    ADD CONSTRAINT "FK_a414d0f27713b9d752dd86eda59" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id);


--
-- Name: observations_eleves FK_a4affbc8e17978c0fcccbc7e0bf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.observations_eleves
    ADD CONSTRAINT "FK_a4affbc8e17978c0fcccbc7e0bf" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: diplomes_eleves FK_a508048cb17088e4991a6f71beb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diplomes_eleves
    ADD CONSTRAINT "FK_a508048cb17088e4991a6f71beb" FOREIGN KEY ("examenNationalId") REFERENCES public.examens_nationaux(id);


--
-- Name: echeanciers_paiement FK_a6bac9f7e69845ad7e8c0038c3c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeanciers_paiement
    ADD CONSTRAINT "FK_a6bac9f7e69845ad7e8c0038c3c" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: messages_fichiers FK_a7905fb833583a74ec2f752699f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages_fichiers
    ADD CONSTRAINT "FK_a7905fb833583a74ec2f752699f" FOREIGN KEY ("messageId") REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: comptes_caisse FK_a79167147219e0e713b8c4d3311; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comptes_caisse
    ADD CONSTRAINT "FK_a79167147219e0e713b8c4d3311" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: heures_cours FK_a7e1c754fdaf425c90731967c8c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heures_cours
    ADD CONSTRAINT "FK_a7e1c754fdaf425c90731967c8c" FOREIGN KEY ("matiereId") REFERENCES public.matieres(id);


--
-- Name: prets_materiels FK_a80dd545c28e203976305bd956f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prets_materiels
    ADD CONSTRAINT "FK_a80dd545c28e203976305bd956f" FOREIGN KEY ("emprunteurId") REFERENCES public.utilisateurs(id);


--
-- Name: scores_personnel FK_a8b3f051a247ecb4dacadb7971a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores_personnel
    ADD CONSTRAINT "FK_a8b3f051a247ecb4dacadb7971a" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: candidatures FK_a8f651908aa4f39721087a24304; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures
    ADD CONSTRAINT "FK_a8f651908aa4f39721087a24304" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: historique_scores_personnel FK_aa4cbd70b33cf98765d2f0be9ae; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_scores_personnel
    ADD CONSTRAINT "FK_aa4cbd70b33cf98765d2f0be9ae" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: emploi_du_temps FK_aa8be5c18a31165cba4a2a848ae; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emploi_du_temps
    ADD CONSTRAINT "FK_aa8be5c18a31165cba4a2a848ae" FOREIGN KEY ("enseignantId") REFERENCES public.membres_personnel(id);


--
-- Name: message_read_status FK_ab27ff20485b9afa15f7e3d1ca8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_read_status
    ADD CONSTRAINT "FK_ab27ff20485b9afa15f7e3d1ca8" FOREIGN KEY ("messageId") REFERENCES public.messages(id) ON DELETE CASCADE;


--
-- Name: sanctions_eleves FK_ab7d577d38a679547192a161b86; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sanctions_eleves
    ADD CONSTRAINT "FK_ab7d577d38a679547192a161b86" FOREIGN KEY ("incidentId") REFERENCES public.incidents_eleves(id);


--
-- Name: ecritures_comptables FK_abaf413d400096a701fb5c2fe6c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecritures_comptables
    ADD CONSTRAINT "FK_abaf413d400096a701fb5c2fe6c" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: evaluations_personnel FK_ac704c4537199bffbd4cc0057f2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations_personnel
    ADD CONSTRAINT "FK_ac704c4537199bffbd4cc0057f2" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: abonnements_parking FK_adf3a132636508acea7def9b691; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abonnements_parking
    ADD CONSTRAINT "FK_adf3a132636508acea7def9b691" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: clubs FK_ae86c23edb90d3e164df4daf5fb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT "FK_ae86c23edb90d3e164df4daf5fb" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: felicitations_eleves FK_b151390b51c98e1c80abe6e01e4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.felicitations_eleves
    ADD CONSTRAINT "FK_b151390b51c98e1c80abe6e01e4" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: types_enum FK_b1a7bc7617447aa079fb3724ef5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_enum
    ADD CONSTRAINT "FK_b1a7bc7617447aa079fb3724ef5" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: frais_scolarite FK_b1cb036205416bcc9b8352241c2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais_scolarite
    ADD CONSTRAINT "FK_b1cb036205416bcc9b8352241c2" FOREIGN KEY ("cycleId") REFERENCES public.cycles(id);


--
-- Name: responsables_eleves FK_b2d985f238e369e249648262c3c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsables_eleves
    ADD CONSTRAINT "FK_b2d985f238e369e249648262c3c" FOREIGN KEY ("enfantId") REFERENCES public.utilisateurs(id);


--
-- Name: consommations_cantine FK_b31a1dfcb10b415b2026604f5cd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consommations_cantine
    ADD CONSTRAINT "FK_b31a1dfcb10b415b2026604f5cd" FOREIGN KEY ("inscriptionId") REFERENCES public.inscriptions_cantine(id);


--
-- Name: menus_cantine FK_b383cacae1daba5542fa5942b80; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus_cantine
    ADD CONSTRAINT "FK_b383cacae1daba5542fa5942b80" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: role_permissions FK_b4599f8b8f548d35850afa2d12c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_b4599f8b8f548d35850afa2d12c" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: competences FK_b5ed93b322e2ecc6d01a4c93849; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competences
    ADD CONSTRAINT "FK_b5ed93b322e2ecc6d01a4c93849" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: heures_cours FK_b61da68004273911dfe2685daa0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heures_cours
    ADD CONSTRAINT "FK_b61da68004273911dfe2685daa0" FOREIGN KEY ("salleId") REFERENCES public.salles(id);


--
-- Name: categories_depense FK_b6c99f8c16ab1f19c57a889e524; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_depense
    ADD CONSTRAINT "FK_b6c99f8c16ab1f19c57a889e524" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: notes FK_b6f5defde8c8d73571ac0cb5cef; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "FK_b6f5defde8c8d73571ac0cb5cef" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: regles_scoring_personnel FK_ba1c1157857901673b6f430e80c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regles_scoring_personnel
    ADD CONSTRAINT "FK_ba1c1157857901673b6f430e80c" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: frais_scolarite FK_ba9625b991d4db0a7d2ba01d3d4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais_scolarite
    ADD CONSTRAINT "FK_ba9625b991d4db0a7d2ba01d3d4" FOREIGN KEY ("filiereId") REFERENCES public.filieres(id);


--
-- Name: felicitations_eleves FK_bb3788bdb56061172385fe97234; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.felicitations_eleves
    ADD CONSTRAINT "FK_bb3788bdb56061172385fe97234" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: types_primes FK_bb6435fbb90e3e964a8b18c765c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.types_primes
    ADD CONSTRAINT "FK_bb6435fbb90e3e964a8b18c765c" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: historique_scores_personnel FK_bbd4fe380b6138d9efd5dd1369c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historique_scores_personnel
    ADD CONSTRAINT "FK_bbd4fe380b6138d9efd5dd1369c" FOREIGN KEY ("membrePersonnelId") REFERENCES public.membres_personnel(id);


--
-- Name: repartitions_horaires FK_bc282391d622c8d7c5d5eed2c80; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repartitions_horaires
    ADD CONSTRAINT "FK_bc282391d622c8d7c5d5eed2c80" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: affectations_eleves FK_bc2d1eef44291194cafbe19481b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_eleves
    ADD CONSTRAINT "FK_bc2d1eef44291194cafbe19481b" FOREIGN KEY ("classeId") REFERENCES public.classes(id);


--
-- Name: membres_personnel FK_bcd3536729e6de57198ae7a7bbc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membres_personnel
    ADD CONSTRAINT "FK_bcd3536729e6de57198ae7a7bbc" FOREIGN KEY ("responsableHierarchiqueId") REFERENCES public.membres_personnel(id);


--
-- Name: evaluations_personnel FK_bde4e676b01e16805a39197d9d8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations_personnel
    ADD CONSTRAINT "FK_bde4e676b01e16805a39197d9d8" FOREIGN KEY ("membrePersonnelId") REFERENCES public.membres_personnel(id);


--
-- Name: evaluations_competences FK_bf9f6043ebbb7480291530fa773; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations_competences
    ADD CONSTRAINT "FK_bf9f6043ebbb7480291530fa773" FOREIGN KEY ("competenceId") REFERENCES public.competences(id);


--
-- Name: affectations_postes FK_c0877958dc51c4e17ad9786a70b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_postes
    ADD CONSTRAINT "FK_c0877958dc51c4e17ad9786a70b" FOREIGN KEY ("uniteOrganisationnelleId") REFERENCES public.unites_organisationnelles(id);


--
-- Name: groupe_admins FK_c0ebeda82fbb49f33f0bd09591e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groupe_admins
    ADD CONSTRAINT "FK_c0ebeda82fbb49f33f0bd09591e" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: mouvements_caisse FK_c161de8943d6965e0e05b020e03; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mouvements_caisse
    ADD CONSTRAINT "FK_c161de8943d6965e0e05b020e03" FOREIGN KEY ("compteCaisseId") REFERENCES public.comptes_caisse(id);


--
-- Name: bulletins_matieres FK_c1ad14c9fc99d9e5d56395e5798; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins_matieres
    ADD CONSTRAINT "FK_c1ad14c9fc99d9e5d56395e5798" FOREIGN KEY ("matiereId") REFERENCES public.matieres(id);


--
-- Name: membres_personnel FK_c1f54a114d71fcacf9948ee3d27; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membres_personnel
    ADD CONSTRAINT "FK_c1f54a114d71fcacf9948ee3d27" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: annonces FK_c20955882aeb5a3ea23317c1bb8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT "FK_c20955882aeb5a3ea23317c1bb8" FOREIGN KEY ("createdBy") REFERENCES public.utilisateurs(id);


--
-- Name: incidents_sante FK_c281dc4d2f25ea023febeeb32e0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_sante
    ADD CONSTRAINT "FK_c281dc4d2f25ea023febeeb32e0" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: modeles_cartes FK_c36e6a5c10b092c60b29642277b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modeles_cartes
    ADD CONSTRAINT "FK_c36e6a5c10b092c60b29642277b" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: onboarding_recrutement FK_c3e94b0f6f4d91b13ac0f1e3a7f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_recrutement
    ADD CONSTRAINT "FK_c3e94b0f6f4d91b13ac0f1e3a7f" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: evenements_clubs FK_c555d329de9ca6d405e5fa383de; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenements_clubs
    ADD CONSTRAINT "FK_c555d329de9ca6d405e5fa383de" FOREIGN KEY ("clubId") REFERENCES public.clubs(id);


--
-- Name: message_mentions FK_c695d4b5da0266995ba3f6896e6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_mentions
    ADD CONSTRAINT "FK_c695d4b5da0266995ba3f6896e6" FOREIGN KEY ("mentionneId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: workflows_validation FK_c6a5f7d0000d1dc3b414e913c55; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflows_validation
    ADD CONSTRAINT "FK_c6a5f7d0000d1dc3b414e913c55" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: inscriptions_transport FK_c75f412020eafb553413de91609; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_transport
    ADD CONSTRAINT "FK_c75f412020eafb553413de91609" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: inscriptions_cantine FK_c78fd921d3660543ce5282f0f5d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_cantine
    ADD CONSTRAINT "FK_c78fd921d3660543ce5282f0f5d" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: eleves FK_c90544d2d9811051f36ba217339; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT "FK_c90544d2d9811051f36ba217339" FOREIGN KEY ("classeSouhaiteeId") REFERENCES public.classes(id);


--
-- Name: sondage_votes FK_cb720f99e69f84753ee7641cad0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sondage_votes
    ADD CONSTRAINT "FK_cb720f99e69f84753ee7641cad0" FOREIGN KEY ("optionId") REFERENCES public.sondage_options(id) ON DELETE CASCADE;


--
-- Name: recus_paiement FK_cc89bb31424fd98678371716fab; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recus_paiement
    ADD CONSTRAINT "FK_cc89bb31424fd98678371716fab" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: classes FK_ce9bb46dad0c927631086680752; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT "FK_ce9bb46dad0c927631086680752" FOREIGN KEY ("professeurPrincipalId") REFERENCES public.membres_personnel(id);


--
-- Name: incidents_eleves FK_cf9ebb807f7df3c85f30ada5371; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_eleves
    ADD CONSTRAINT "FK_cf9ebb807f7df3c85f30ada5371" FOREIGN KEY ("classeId") REFERENCES public.classes(id);


--
-- Name: observations_eleves FK_cfb28fdae3dd5b56cffd63d766a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.observations_eleves
    ADD CONSTRAINT "FK_cfb28fdae3dd5b56cffd63d766a" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: scores_personnel FK_d0037fb858904c4c047981a26cc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores_personnel
    ADD CONSTRAINT "FK_d0037fb858904c4c047981a26cc" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: responsables_eleves FK_d2e8b08bbb8c6536b3155086866; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsables_eleves
    ADD CONSTRAINT "FK_d2e8b08bbb8c6536b3155086866" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id);


--
-- Name: messages FK_d3774e36cea344490db2bfbf097; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "FK_d3774e36cea344490db2bfbf097" FOREIGN KEY ("reponseAId") REFERENCES public.messages(id);


--
-- Name: unites_organisationnelles FK_d391c24bf4d434aa5d8e54b61b2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unites_organisationnelles
    ADD CONSTRAINT "FK_d391c24bf4d434aa5d8e54b61b2" FOREIGN KEY ("parentId") REFERENCES public.unites_organisationnelles(id) ON DELETE SET NULL;


--
-- Name: progressions_programme FK_d47fa61bc73eab905941e72a609; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progressions_programme
    ADD CONSTRAINT "FK_d47fa61bc73eab905941e72a609" FOREIGN KEY ("programmeChapitreId") REFERENCES public.programme_chapitres(id) ON DELETE SET NULL;


--
-- Name: evaluations_enseignants FK_d4f5d9997674777b47e94ef0e92; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations_enseignants
    ADD CONSTRAINT "FK_d4f5d9997674777b47e94ef0e92" FOREIGN KEY ("enseignantId") REFERENCES public.membres_personnel(id) ON DELETE CASCADE;


--
-- Name: evaluations_enseignants FK_d6d426e2b2d5fa68ccfca439b92; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations_enseignants
    ADD CONSTRAINT "FK_d6d426e2b2d5fa68ccfca439b92" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: observations_eleves FK_d783c0a3bb2fb16c05cf99acf82; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.observations_eleves
    ADD CONSTRAINT "FK_d783c0a3bb2fb16c05cf99acf82" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: bulletins FK_db0f13654e86c4d361a43e30aea; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT "FK_db0f13654e86c4d361a43e30aea" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: inscriptions_clubs FK_db1dbe5d2c150add3048bf2b45e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_clubs
    ADD CONSTRAINT "FK_db1dbe5d2c150add3048bf2b45e" FOREIGN KEY ("clubId") REFERENCES public.clubs(id);


--
-- Name: lignes_budget FK_dcea38c4cbdeba23d4b543de8b1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_budget
    ADD CONSTRAINT "FK_dcea38c4cbdeba23d4b543de8b1" FOREIGN KEY ("budgetId") REFERENCES public.budgets(id);


--
-- Name: places_parking FK_dd2f9f903870e163cdb3ab0ee87; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places_parking
    ADD CONSTRAINT "FK_dd2f9f903870e163cdb3ab0ee87" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: matieres_niveaux FK_dd422f79f543ea3bb1ccf7c033c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matieres_niveaux
    ADD CONSTRAINT "FK_dd422f79f543ea3bb1ccf7c033c" FOREIGN KEY ("niveauId") REFERENCES public.niveaux(id);


--
-- Name: consultations_medicales FK_ddde526971bb34aa9fbcdec5ccd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations_medicales
    ADD CONSTRAINT "FK_ddde526971bb34aa9fbcdec5ccd" FOREIGN KEY ("dossierMedicalId") REFERENCES public.dossiers_medicaux(id);


--
-- Name: notes FK_de1edfaffb39eb6331f1b39eaf9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "FK_de1edfaffb39eb6331f1b39eaf9" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: observations_eleves FK_dfd1425b29336514744f6c2ef1d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.observations_eleves
    ADD CONSTRAINT "FK_dfd1425b29336514744f6c2ef1d" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: eleves FK_e0b9241e7ac9c1793d68d9a7735; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT "FK_e0b9241e7ac9c1793d68d9a7735" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id);


--
-- Name: notifications FK_e11c35f086b20d5bcf2f6a5e1bd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_e11c35f086b20d5bcf2f6a5e1bd" FOREIGN KEY ("destinataireId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: incidents_eleves FK_e12e543150e410cfa9657668eda; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_eleves
    ADD CONSTRAINT "FK_e12e543150e410cfa9657668eda" FOREIGN KEY ("declarantId") REFERENCES public.utilisateurs(id);


--
-- Name: parametre_versions FK_e13b70ff7959d3f595926baa990; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametre_versions
    ADD CONSTRAINT "FK_e13b70ff7959d3f595926baa990" FOREIGN KEY ("parametreId") REFERENCES public.parametres_systeme(id) ON DELETE CASCADE;


--
-- Name: lignes_budget FK_e463bac298fb87186da785818db; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_budget
    ADD CONSTRAINT "FK_e463bac298fb87186da785818db" FOREIGN KEY ("categorieDepenseId") REFERENCES public.categories_depense(id);


--
-- Name: postes FK_e50a0ff5071de03606377eafa45; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postes
    ADD CONSTRAINT "FK_e50a0ff5071de03606377eafa45" FOREIGN KEY ("uniteOrganisationnelleId") REFERENCES public.unites_organisationnelles(id) ON DELETE CASCADE;


--
-- Name: messages FK_e5663ce0c730b2de83445e2fd19; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: notes FK_e5950d5485818be723b81179f6d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "FK_e5950d5485818be723b81179f6d" FOREIGN KEY ("matiereId") REFERENCES public.matieres(id);


--
-- Name: matieres_niveaux FK_e5e43c816d308ac8102b14d80ee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matieres_niveaux
    ADD CONSTRAINT "FK_e5e43c816d308ac8102b14d80ee" FOREIGN KEY ("filiereId") REFERENCES public.filieres(id);


--
-- Name: incidents_personnel FK_e6de80deaac0bc7f036ff60438a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_personnel
    ADD CONSTRAINT "FK_e6de80deaac0bc7f036ff60438a" FOREIGN KEY ("declarantId") REFERENCES public.utilisateurs(id);


--
-- Name: notifications FK_e753e3af463ca7f90a7dbd95f6f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_e753e3af463ca7f90a7dbd95f6f" FOREIGN KEY ("expediteurId") REFERENCES public.utilisateurs(id);


--
-- Name: preferences_role FK_e798889a416c4b21c8f61a27698; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preferences_role
    ADD CONSTRAINT "FK_e798889a416c4b21c8f61a27698" FOREIGN KEY ("roleId") REFERENCES public.roles(id);


--
-- Name: competences FK_e812d2345f4cf3f40ce2bd5a1c4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competences
    ADD CONSTRAINT "FK_e812d2345f4cf3f40ce2bd5a1c4" FOREIGN KEY ("matiereId") REFERENCES public.matieres(id);


--
-- Name: frais_scolarite FK_e8990b60b361f1d5fe02edc15f6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais_scolarite
    ADD CONSTRAINT "FK_e8990b60b361f1d5fe02edc15f6" FOREIGN KEY ("classeId") REFERENCES public.classes(id);


--
-- Name: frais_scolarite FK_e91603a5eee39d94145623df5f6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais_scolarite
    ADD CONSTRAINT "FK_e91603a5eee39d94145623df5f6" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: etablissement_config FK_e961012440c8c9c14acc20383e3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etablissement_config
    ADD CONSTRAINT "FK_e961012440c8c9c14acc20383e3" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: heures_cours FK_e9723638a9b8b248b77513ed4ec; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.heures_cours
    ADD CONSTRAINT "FK_e9723638a9b8b248b77513ed4ec" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: message_read_status FK_e9a214a4afeda5ce9d85afbc32f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_read_status
    ADD CONSTRAINT "FK_e9a214a4afeda5ce9d85afbc32f" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: evaluations_personnel FK_eb5446ffa3d1219e771eb58175b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations_personnel
    ADD CONSTRAINT "FK_eb5446ffa3d1219e771eb58175b" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: candidatures FK_eb9cd0a4ed0d81f7b6e40d0e2b7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidatures
    ADD CONSTRAINT "FK_eb9cd0a4ed0d81f7b6e40d0e2b7" FOREIGN KEY ("membrePersonnelId") REFERENCES public.membres_personnel(id);


--
-- Name: emploi_du_temps FK_ecb1ebb5675786ba2f571ea50b8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emploi_du_temps
    ADD CONSTRAINT "FK_ecb1ebb5675786ba2f571ea50b8" FOREIGN KEY ("matiereId") REFERENCES public.matieres(id);


--
-- Name: profils_utilisateurs FK_ecb296e7df42f4b9a8e1cdf9598; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profils_utilisateurs
    ADD CONSTRAINT "FK_ecb296e7df42f4b9a8e1cdf9598" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: frais_scolarite FK_ee5e447a9f9f01f6911587b3fde; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais_scolarite
    ADD CONSTRAINT "FK_ee5e447a9f9f01f6911587b3fde" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: dossiers_medicaux FK_ee78e7bd914a5e5019f5e10412c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_medicaux
    ADD CONSTRAINT "FK_ee78e7bd914a5e5019f5e10412c" FOREIGN KEY ("periodeId") REFERENCES public.periodes(id);


--
-- Name: utilisateur_etablissements FK_ee7f37102358de90e1a86b2bca5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_etablissements
    ADD CONSTRAINT "FK_ee7f37102358de90e1a86b2bca5" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: paiements FK_ef15779b14b2c238120bdf1f7e2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT "FK_ef15779b14b2c238120bdf1f7e2" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: incidents_eleves FK_ef88a6af7059c4cd6e97c102efb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents_eleves
    ADD CONSTRAINT "FK_ef88a6af7059c4cd6e97c102efb" FOREIGN KEY ("matiereId") REFERENCES public.matieres(id);


--
-- Name: progressions_programme FK_f02a20b70a465a36388a207a588; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progressions_programme
    ADD CONSTRAINT "FK_f02a20b70a465a36388a207a588" FOREIGN KEY ("enseignantId") REFERENCES public.membres_personnel(id) ON DELETE CASCADE;


--
-- Name: niveaux FK_f1ce2250d07a5a8f1b7d610180e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.niveaux
    ADD CONSTRAINT "FK_f1ce2250d07a5a8f1b7d610180e" FOREIGN KEY ("examenNationalId") REFERENCES public.examens_nationaux(id);


--
-- Name: onboarding_recrutement FK_f426583e3f9f3038844c99b9a10; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_recrutement
    ADD CONSTRAINT "FK_f426583e3f9f3038844c99b9a10" FOREIGN KEY ("tuteurId") REFERENCES public.membres_personnel(id);


--
-- Name: badges_utilisateurs FK_f619f307e480e201cd53e7df1d4; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges_utilisateurs
    ADD CONSTRAINT "FK_f619f307e480e201cd53e7df1d4" FOREIGN KEY ("badgeId") REFERENCES public.badges(id);


--
-- Name: paiements FK_f654733f0ae7d07e062bfd115e6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT "FK_f654733f0ae7d07e062bfd115e6" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: filieres FK_f85d651fed0c1d83ecc935ea64c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filieres
    ADD CONSTRAINT "FK_f85d651fed0c1d83ecc935ea64c" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


--
-- Name: indisponibilites_enseignants FK_f937024a0398bce32d12c23cb23; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indisponibilites_enseignants
    ADD CONSTRAINT "FK_f937024a0398bce32d12c23cb23" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: periodes FK_fa3cf439da48f3a197ceabdd4c5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodes
    ADD CONSTRAINT "FK_fa3cf439da48f3a197ceabdd4c5" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: dossiers_medicaux FK_fab3bda7df2f026610601c3a061; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dossiers_medicaux
    ADD CONSTRAINT "FK_fab3bda7df2f026610601c3a061" FOREIGN KEY ("eleveId") REFERENCES public.eleves(id);


--
-- Name: elements_salaire FK_fb9695b55a567619ae26c48a042; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.elements_salaire
    ADD CONSTRAINT "FK_fb9695b55a567619ae26c48a042" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: sanctions_eleves FK_fc9e8d2a3e46c363974a14ff079; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sanctions_eleves
    ADD CONSTRAINT "FK_fc9e8d2a3e46c363974a14ff079" FOREIGN KEY ("anneeScolaireId") REFERENCES public.annees_scolaires(id);


--
-- Name: onboarding_recrutement FK_fe1a7b9c8f8cfcf0ca35aa3f347; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.onboarding_recrutement
    ADD CONSTRAINT "FK_fe1a7b9c8f8cfcf0ca35aa3f347" FOREIGN KEY ("membrePersonnelId") REFERENCES public.membres_personnel(id);


--
-- Name: offres_emploi FK_fe882fc8766465af181e2ab9e39; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres_emploi
    ADD CONSTRAINT "FK_fe882fc8766465af181e2ab9e39" FOREIGN KEY ("publieParId") REFERENCES public.membres_personnel(id);


--
-- Name: templates_sondage FK_fed433037870bc592e52cc09df5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.templates_sondage
    ADD CONSTRAINT "FK_fed433037870bc592e52cc09df5" FOREIGN KEY ("createurId") REFERENCES public.utilisateurs(id);


--
-- Name: evenements_clubs FK_ff3a144ddf131aecad6c57fdefa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evenements_clubs
    ADD CONSTRAINT "FK_ff3a144ddf131aecad6c57fdefa" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- Name: fonds_etablissement FK_ff645b7444f86a24aa7d6682edb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fonds_etablissement
    ADD CONSTRAINT "FK_ff645b7444f86a24aa7d6682edb" FOREIGN KEY ("fondId") REFERENCES public.fonds(id);


--
-- Name: affectations_matieres fk_affectations_matieres_etablissement; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.affectations_matieres
    ADD CONSTRAINT fk_affectations_matieres_etablissement FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KOcIZgbcrxJs8Gs7cpykoU86PQVddtSG9WCfCsk6UPAQyZ6jRGez2LehNcFM21A

