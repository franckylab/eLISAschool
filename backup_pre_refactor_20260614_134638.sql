--
-- PostgreSQL database dump
--

\restrict H0pUumCjTxgi4iNdkEX7kw7ohZmKdntvMp2dbexrTtpMV1X3RcGaSe94dxiwCVg

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
-- Name: sections_typesection_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sections_typesection_enum AS ENUM (
    'SCIENTIFIQUE',
    'LITTERAIRE',
    'ECONOMIQUE',
    'TECHNIQUE',
    'ARTS',
    'SPORT_ETUDES',
    'BILINGUE',
    'INTERNATIONALE',
    'AUTRE'
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
-- Name: utilisateur_etablissements_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.utilisateur_etablissements_role_enum AS ENUM (
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
    statut character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    coefficient double precision
);


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
    "sallePrincipale" character varying(100),
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
    ordre integer DEFAULT 1 NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "etablissementId" uuid NOT NULL
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
    "logoUrl" character varying(500),
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
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
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
    soussysteme public.filieres_soussysteme_enum DEFAULT 'FRANCOPHONE'::public.filieres_soussysteme_enum NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "etablissementId" uuid NOT NULL
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
    "sectionId" uuid,
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
    "periodeId" uuid,
    date date NOT NULL,
    "heureDebut" time without time zone NOT NULL,
    "heureFin" time without time zone NOT NULL,
    "statutEffectue" character varying(30) DEFAULT 'PLANIFIE'::character varying NOT NULL,
    salle character varying(100),
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
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "etablissementId" uuid NOT NULL,
    "sousSysteme" public.matieres_soussysteme_enum
);


--
-- Name: matieres_niveaux; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matieres_niveaux (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "matiereId" uuid NOT NULL,
    "niveauId" uuid NOT NULL,
    "groupeId" uuid,
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
    "classeId" uuid NOT NULL,
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
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
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
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
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
    "sectionId" uuid,
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
-- Name: sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    code character varying(20) NOT NULL,
    "typeSection" public.sections_typesection_enum DEFAULT 'AUTRE'::public.sections_typesection_enum NOT NULL,
    description text,
    ordre integer DEFAULT 1 NOT NULL,
    "cycleId" uuid,
    "etablissementId" uuid NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "coefficientFrais" numeric(5,2) DEFAULT '0'::numeric NOT NULL,
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
    ordre integer DEFAULT 1 NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "etablissementId" uuid NOT NULL
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
    role public.utilisateur_etablissements_role_enum NOT NULL,
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
-- Name: utilisateur_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utilisateur_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "utilisateurId" uuid NOT NULL,
    "roleId" uuid NOT NULL,
    "estPrincipal" boolean DEFAULT false NOT NULL,
    "dateAttribution" timestamp without time zone DEFAULT now() NOT NULL,
    "attribuePar" uuid,
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
    "tentativesConnexion" integer DEFAULT 0 NOT NULL,
    "bloqueJusqua" timestamp without time zone,
    "derniereConnexion" timestamp without time zone,
    langue character varying(10) DEFAULT 'fr'::character varying NOT NULL,
    "etablissementId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "maxEtablissementsPersonnel" integer DEFAULT 1 NOT NULL
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
-- Data for Name: abonnements_parking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.abonnements_parking (id, "titulaireId", "vehiculeId", "dateDebut", "dateFin", tarif, statut, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: absences_personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.absences_personnel (id, "membrePersonnelId", date, type, "statutJustification", "heureDebut", "heureFin", motif, justification, "justificatifUrl", "valideParId", "etablissementId", "createdAt") FROM stdin;
\.


--
-- Data for Name: affectations_eleves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.affectations_eleves (id, "eleveId", "classeId", "anneeScolaireId", "dateAffectation", actif, statut, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: affectations_matieres; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.affectations_matieres (id, "matiereId", "classeId", "enseignantId", "anneeScolaireId", "volumeHoraireHebdo", statut, "createdAt", "updatedAt", coefficient) FROM stdin;
\.


--
-- Data for Name: affectations_postes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.affectations_postes (id, "membrePersonnelId", "posteId", "contratId", "uniteOrganisationnelleId", "dateDebut", "dateFin", statut, "typeMutation", "salaireAssocie", commentaire, "valideParId", "dateValidation", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: annees_scolaires; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.annees_scolaires (id, libelle, "dateDebut", "dateFin", "enCours", cloturee, statut, "etablissementId", "createdAt", "updatedAt") FROM stdin;
5d2186e2-bd13-4732-b4af-d56a9a5509ad	2024-2025	2024-09-01	2025-07-31	t	f	OUVERTE	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:09.498324	2026-06-14 07:10:09.498324
\.


--
-- Data for Name: annonce_ciblages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.annonce_ciblages (id, "annonceId", "typeCible", "cibleId", "cibleValeur", "createdAt") FROM stdin;
\.


--
-- Data for Name: annonces; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.annonces (id, titre, contenu, "typeContenu", priorite, statut, validation, "dateDebut", "dateFin", "dateValidation", "validePar", "motifRejet", "cibleGlobale", "ordreAffichage", "etablissementId", "createdBy", "updatedBy", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "utilisateurId", action, severity, cible, "cibleId", description, "anciennesValeurs", "nouvellesValeurs", "ipAddress", "userAgent", module, "estEchec", erreur, "createdAt") FROM stdin;
15e78937-ccfd-464e-9a68-7b08c3cc5e65	acfb60ea-3913-48b5-9045-fc1a8fac9986	LOGIN	INFO	\N	\N	Connexion réussie	\N	\N	\N	\N	auth	f	\N	2026-06-14 03:26:08.249211
9b0bed21-5fca-4d1a-a8d3-fa554faab5af	78e04134-22fb-4f69-bce1-19c6ed7e3cf0	LOGIN	INFO	\N	\N	Connexion réussie	\N	\N	\N	\N	auth	f	\N	2026-06-14 03:28:22.677237
b7afa06e-e0a1-41de-a3cc-38b2062edce6	78e04134-22fb-4f69-bce1-19c6ed7e3cf0	ACCESS_DENIED	WARNING	\N	\N	Accès refusé à Permission configuration requise: config:param:view	\N	\N	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	t	\N	2026-06-14 03:28:39.376216
3e430835-b4d8-4957-b547-2d36bbdf481f	78e04134-22fb-4f69-bce1-19c6ed7e3cf0	ACCESS_DENIED	WARNING	\N	\N	Accès refusé à Permission configuration requise: config:param:view	\N	\N	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	t	\N	2026-06-14 03:28:40.424938
7aea175f-530a-4055-9f3d-7ed9b1ac6ff9	78e04134-22fb-4f69-bce1-19c6ed7e3cf0	ACCESS_DENIED	WARNING	\N	\N	Accès refusé à Permission configuration requise: config:param:view	\N	\N	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	t	\N	2026-06-14 03:28:42.465776
4355bd60-e9cd-49b4-a3b5-b90675255328	78e04134-22fb-4f69-bce1-19c6ed7e3cf0	ACCESS_DENIED	WARNING	\N	\N	Accès refusé à Permission configuration requise: config:module:view	\N	\N	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	t	\N	2026-06-14 03:28:50.392399
86a42d12-f392-483e-b56c-7420c35d59b0	78e04134-22fb-4f69-bce1-19c6ed7e3cf0	ACCESS_DENIED	WARNING	\N	\N	Accès refusé à Permission configuration requise: config:module:view	\N	\N	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	t	\N	2026-06-14 03:28:51.46149
2d0f13e8-683c-4d74-aeba-fbcd88a69049	78e04134-22fb-4f69-bce1-19c6ed7e3cf0	ACCESS_DENIED	WARNING	\N	\N	Accès refusé à Permission configuration requise: config:module:view	\N	\N	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	t	\N	2026-06-14 03:28:53.479101
373f1f3f-de4e-4235-a369-3a644d0eb17e	78e04134-22fb-4f69-bce1-19c6ed7e3cf0	ACCESS_DENIED	WARNING	\N	\N	Accès refusé à Permission configuration requise: config:param:view	\N	\N	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	t	\N	2026-06-14 03:28:59.030626
d58ef8ec-c755-46c5-ac21-94637008af9f	78e04134-22fb-4f69-bce1-19c6ed7e3cf0	ACCESS_DENIED	WARNING	\N	\N	Accès refusé à Permission configuration requise: config:param:view	\N	\N	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	t	\N	2026-06-14 03:29:00.099024
b52f7393-184f-4d17-bd16-1e96b9bc231d	\N	LOGIN_FAILED	WARNING	\N	\N	Échec de connexion: Identifiant non trouvé	\N	\N	\N	\N	auth	t	Identifiant non trouvé	2026-06-14 03:30:37.848881
d0138bec-b7b6-4c21-a79c-601b2f5f2293	acfb60ea-3913-48b5-9045-fc1a8fac9986	LOGIN	INFO	\N	\N	Connexion réussie	\N	\N	\N	\N	auth	f	\N	2026-06-14 03:31:19.545939
4a17124c-3ae5-44b0-80ba-7868f3e29bd3	acfb60ea-3913-48b5-9045-fc1a8fac9986	LOGIN	INFO	\N	\N	Connexion réussie	\N	\N	\N	\N	auth	f	\N	2026-06-14 09:00:16.717741
a105e65e-b94e-43ad-8980-96e7d6aa8dd5	acfb60ea-3913-48b5-9045-fc1a8fac9986	LOGIN	INFO	\N	\N	Connexion réussie	\N	\N	\N	\N	auth	f	\N	2026-06-14 11:35:58.991605
\.


--
-- Data for Name: backup_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_records (id, "etablissementId", "backupType", version, checksum, "storageProvider", "storageKey", encrypted, compressed, "sizeBytes", metadata, "retentionUntil", "createdAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.badges (id, code, nom, description, icone, "pointsRequis", categorie, actif, "createdAt") FROM stdin;
\.


--
-- Data for Name: badges_utilisateurs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.badges_utilisateurs (id, "utilisateurId", "badgeId", "obtenuAt") FROM stdin;
\.


--
-- Data for Name: bons_commande; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bons_commande (id, "numeroBon", "demandeurId", fournisseur, "dateCommande", "dateLivraisonPrevue", "montantTotal", articles, statut, "depenseId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.budgets (id, code, libelle, "anneeDebut", "anneeFin", "montantTotalPrevu", "montantTotalEngage", "montantTotalConsomme", statut, observations, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bulletins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bulletins (id, "eleveId", "classeId", "periodeId", "anneeScolaireId", "moyenneGenerale", "moyenneClasse", "moyenneMin", "moyenneMax", rang, "appreciationConseil", sanctions, encouragements, publie, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bulletins_matieres; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bulletins_matieres (id, "bulletinId", "matiereId", moyenne, coefficient, "rangMatiere", "moyenneMinClasse", "moyenneMaxClasse", "moyenneClasse", appreciation, "nombreNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bulletins_paie; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bulletins_paie (id, "membrePersonnelId", "contratId", mois, annee, "salaireBase", "heuresEffectuees", "montantHeuresSup", primes, deductions, "salaireNet", statut, "datePaiement", notes, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bulletins_workflow; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bulletins_workflow (id, "bulletinId", "statutValidation", "niveauValidationActuel", "niveauxRequis", "validateurId", "dateValidation", "datePublication", "commentaireValidation", "historiqueValidation") FROM stdin;
\.


--
-- Data for Name: candidatures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.candidatures (id, "offreEmploiId", "nomComplet", email, telephone, "cvUrl", "lettreMotivationUrl", "portfolioUrl", "niveauEtude", "anneesExperience", competences, commentaires, statut, "noteEvaluation", "evaluationCommentaire", "examineParId", "membrePersonnelId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: cartes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cartes (id, "utilisateurId", type, "numeroCarte", "qrCode", statut, "dateExpiration", "photoUrl", "etablissementNom", "raisonDesactivation", metadata, "modeleCarteId", "categorieTitulaire", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: categories_depense; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories_depense (id, code, libelle, type, "compteComptableCharge", "compteComptableTVA", actif, "budgetAnnuel", "responsableId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.classes (id, nom, code, "niveauId", "anneeScolaireId", "professeurPrincipalId", "filiereId", "sallePrincipale", "effectifMax", "effectifActuel", "typeClasse", "creneauHoraire", description, actif, "etablissementId", "createdAt", "updatedAt") FROM stdin;
0ed8a1c7-38c7-4cc5-b86a-5f7ade85220d	Petite Section	PS	6bae151b-6dd6-428b-8124-9198396215d1	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	25	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.643475	2026-06-14 07:10:52.643475
17d285fb-bb85-4e05-bc9b-3d0295d2486b	Moyenne Section	MS	f2a256d4-6756-44ba-b963-4b355cff6ea1	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	25	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.677032	2026-06-14 07:10:52.677032
2b5afce4-a75d-4dc4-a2ee-8a044409619e	Grande Section	GS	09a07a05-f1c4-4f10-bb36-407829d4c814	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	30	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.683047	2026-06-14 07:10:52.683047
745d5d2b-ca81-4493-b56d-5aa41649b755	Cours Initial	CI	70d5bcb0-3098-4aa0-9ea6-803bdf9461ac	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.689877	2026-06-14 07:10:52.689877
902ac414-04f9-43eb-b37e-1105e1d57313	Cours Préparatoire	CP	a1f49c9e-6410-4e7a-8b53-7e90e554b20c	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.696082	2026-06-14 07:10:52.696082
17296f5c-28f3-44f3-8619-f9957316bce6	Cours Élémentaire 1	CE1	f6d441d7-5c1a-427e-87ad-dd2f76fb54a5	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.702059	2026-06-14 07:10:52.702059
bb3a4dba-fe99-427c-89aa-822a179be14b	Cours Élémentaire 2	CE2	aa3c32fc-1d9a-4336-a6e6-cea7ec649beb	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.70873	2026-06-14 07:10:52.70873
791f4e85-cd52-498f-b2ef-b99b0bd3649e	Cours Moyen 1	CM1	7f360cb1-e7ea-4715-8d41-029432ace47d	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.715161	2026-06-14 07:10:52.715161
c3630bd1-8e0f-41d1-9e42-f47272cfb12c	Cours Moyen 2	CM2	571e2115-961b-4367-8aa7-e279a0948881	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.722193	2026-06-14 07:10:52.722193
59e96931-39d1-42e8-867c-9dc29e6cf662	Sixième	6EME	f6395176-4a66-43d2-8c05-83b99d0f8432	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	45	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.73029	2026-06-14 07:10:52.73029
e1aa4781-b8be-4a5e-9c34-13860187f64f	Cinquième	5EME	f92dc956-0984-41eb-9e98-875ae96f84b5	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	45	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.738717	2026-06-14 07:10:52.738717
611e8b17-344e-4c7f-b64a-5b4b7b51d7ec	Quatrième	4EME	2cbfb710-1f2d-4b6d-ad2a-6b073d496291	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	45	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.743984	2026-06-14 07:10:52.743984
7b2d32fc-f294-4dda-b052-ba66693cb83d	Troisième	3EME	d4be03c4-3727-4100-90c3-79e944736b74	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	45	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.751073	2026-06-14 07:10:52.751073
e2496c09-9aca-4101-87e7-8c2b1e66dcd9	Seconde	SECONDE	b9f1bf49-9d27-42b2-ab2c-dcc56d78c443	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.756707	2026-06-14 07:10:52.756707
427a013d-0d42-4cf5-91d5-bc005203d234	Première	PREMIERE	dc6056c7-3ccc-4c5d-830c-661db8290326	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.761933	2026-06-14 07:10:52.761933
f8341a71-cd4d-4b05-b2dd-f17e3ca3dfcc	Terminale	TERMINALE	3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.767467	2026-06-14 07:10:52.767467
acc1cd91-5866-4316-bc12-be8730cfaaf8	Nursery 1	NURSERY1	9fd383a2-4b86-4c23-9ae8-bc0283de8eb9	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	25	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.773455	2026-06-14 07:10:52.773455
58f68206-56ed-4764-b8d3-dcfa1fb7ed77	Nursery 2	NURSERY2	b06ef7c8-9216-467d-8777-09e5eeca02a1	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	25	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.779346	2026-06-14 07:10:52.779346
8cf0c17a-972d-41d5-b6b1-2f179bd1b99b	Standard 1	STD1	a1dca7bd-d1a4-4570-a4e7-7e63199b849a	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.784947	2026-06-14 07:10:52.784947
4de0d6e2-0eb5-4698-a7b0-39317fe50098	Standard 2	STD2	29cbbec3-1ef1-43cf-96b6-99b1d4efe0e9	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.79102	2026-06-14 07:10:52.79102
fd64ae36-3391-4409-be63-f813f1f0a1c0	Standard 3	STD3	5a234387-daf8-44ac-9fda-aa3b289349dc	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.796731	2026-06-14 07:10:52.796731
dd4896f6-bd10-45f3-ad69-a23632d374ab	Standard 4	STD4	afe11a5b-31e3-4315-a3d9-4d640393afcc	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.801899	2026-06-14 07:10:52.801899
b1e34f2e-fb5a-4590-b828-1907b6ad2b26	Standard 5	STD5	1ce09e5c-642d-4763-85f3-31d66f28f519	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.807774	2026-06-14 07:10:52.807774
0e4517b5-27a7-4e38-a388-bcc6f5ac3746	Standard 6	STD6	e88c9e6f-4b04-43f3-b3e3-9654b18288f2	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.814514	2026-06-14 07:10:52.814514
73fd7654-7de2-45f8-8c90-625752f7cfae	Form 1	FORM1	3c9fe5b4-8b19-44e2-a0b3-9f84bb39cb87	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.820888	2026-06-14 07:10:52.820888
bae3db20-5b2d-470e-8d16-4d877da1ba22	Form 2	FORM2	dec8acb7-6c2a-4892-9744-e59e1b237588	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.827246	2026-06-14 07:10:52.827246
c5de2714-7cec-40ac-9b9c-6e2eb11bea86	Form 3	FORM3	d451bf73-422a-420e-8c2c-853342558644	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.833419	2026-06-14 07:10:52.833419
2d24637f-febc-47ab-9832-486cf1364f61	Form 4	FORM4	ee0b48a5-9348-4b1c-8b06-bd6826663f03	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.838925	2026-06-14 07:10:52.838925
2bf8fbf2-b28f-4c6e-87c7-b48dd1508177	Form 5	FORM5	2443fc48-3ead-4b89-ab62-a748d9022208	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	40	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.843811	2026-06-14 07:10:52.843811
74d3dceb-fbb4-4dca-9e7e-b3dcce6f3717	Lower Sixth	LOWER6	1ea49ab8-640d-4cc4-aa52-0734fa4aebf2	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	35	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.850368	2026-06-14 07:10:52.850368
8cdccd0b-0dbf-424e-bb0d-a5bf280c0741	Upper Sixth	UPPER6	abc01f38-6d02-48bf-b2a5-a8fdfc649aaa	5d2186e2-bd13-4732-b4af-d56a9a5509ad	\N	\N	\N	35	0	NORMALE	MATIN	\N	t	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 07:10:52.856242	2026-06-14 07:10:52.856242
\.


--
-- Data for Name: clubs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clubs (id, nom, description, "responsableId", budget, horaires, lieu, "capaciteMax", actif, statut, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: competences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.competences (id, code, libelle, description, domaine, "niveauId", "matiereId", ordre, actif, "createdAt", "updatedAt", "etablissementId") FROM stdin;
9c7c923e-8a1f-45c2-be7a-6198ae738b50	COMP_MATH_6_01	Effectuer des calculs numériques simples	Addition, soustraction, multiplication, division sur les nombres entiers et décimaux	Mathématiques	f6395176-4a66-43d2-8c05-83b99d0f8432	\N	1	t	2026-06-14 03:05:35.141205	2026-06-14 03:05:35.141205	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
41835475-67fd-4580-97aa-2791569d8345	COMP_MATH_6_02	Résoudre des problèmes de proportionnalité	Utiliser les règles de trois et les pourcentages simples	Mathématiques	f6395176-4a66-43d2-8c05-83b99d0f8432	\N	2	t	2026-06-14 03:05:35.146175	2026-06-14 03:05:35.146175	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
17b7f06f-c054-4f83-9c1d-6a84c4c3f182	COMP_MATH_6_03	Reconnaître et tracer des figures géométriques	Triangle, quadrilatère, cercle, symétrie axiale	Mathématiques	f6395176-4a66-43d2-8c05-83b99d0f8432	\N	3	t	2026-06-14 03:05:35.150012	2026-06-14 03:05:35.150012	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
d10955f0-2c6c-4e6e-a816-dfc40719ec11	COMP_MATH_3_01	Résoudre une équation du premier degré	Équations de forme ax + b = 0	Mathématiques	d4be03c4-3727-4100-90c3-79e944736b74	\N	1	t	2026-06-14 03:05:35.154317	2026-06-14 03:05:35.154317	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
4ee46aaa-068a-4768-88f5-ef56a8568d81	COMP_MATH_3_02	Calculer avec les racines carrées	Simplification et opérations sur les racines carrées	Mathématiques	d4be03c4-3727-4100-90c3-79e944736b74	\N	2	t	2026-06-14 03:05:35.158716	2026-06-14 03:05:35.158716	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
0f5e067e-ba18-46d6-97ca-d907d5181374	COMP_MATH_3_03	Démontrer des propriétés géométriques	Théorème de Pythagore, Thalès, trigonométrie	Mathématiques	d4be03c4-3727-4100-90c3-79e944736b74	\N	3	t	2026-06-14 03:05:35.162439	2026-06-14 03:05:35.162439	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
17875b73-5d18-457f-89d5-046b52db8e59	COMP_MATH_T_01	Résoudre une équation du second degré	Équations ax² + bx + c = 0, discriminant	Mathématiques	3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	\N	1	t	2026-06-14 03:05:35.166051	2026-06-14 03:05:35.166051	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
7ad6b824-97d7-4d8b-9aea-79d6a6a92ab8	COMP_MATH_T_02	Étudier les limites et la continuité d'une fonction	Calcul de limites, théorèmes des valeurs intermédiaires	Mathématiques	3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	\N	2	t	2026-06-14 03:05:35.170417	2026-06-14 03:05:35.170417	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
0b0df3d3-2e88-4d1a-a613-937b33eaaa06	COMP_MATH_T_03	Calculer des dérivées et étudier les variations	Dérivation, tableau de variations, extremums	Mathématiques	3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	\N	3	t	2026-06-14 03:05:35.174979	2026-06-14 03:05:35.174979	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
ad024665-bba1-4600-a03e-b9ff8a797798	COMP_MATH_T_04	Maîtriser le calcul intégral	Primitives, calcul d'aires, intégrales définies	Mathématiques	3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	\N	4	t	2026-06-14 03:05:35.179349	2026-06-14 03:05:35.179349	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
0c438899-29e4-4cd1-85f5-afa17323c1c4	COMP_SCI_6_01	Identifier les états de la matière	Solide, liquide, gazeux, changements d'état	Sciences	f6395176-4a66-43d2-8c05-83b99d0f8432	\N	1	t	2026-06-14 03:05:35.184059	2026-06-14 03:05:35.184059	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
e8e6c6f9-3d39-4bac-8c96-ef998abe00bc	COMP_SCI_6_02	Décrire le système solaire	Planètes, soleil, mouvements célestes	Sciences	f6395176-4a66-43d2-8c05-83b99d0f8432	\N	2	t	2026-06-14 03:05:35.188223	2026-06-14 03:05:35.188223	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
b40b6bdc-9782-4bd4-a018-1e6d40c927fc	COMP_SCI_3_01	Comprendre les réactions chimiques	Équations chimiques, conservation de la masse	Sciences	d4be03c4-3727-4100-90c3-79e944736b74	\N	1	t	2026-06-14 03:05:35.192378	2026-06-14 03:05:35.192378	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
d9f87875-ee33-4d95-9125-802082783911	COMP_SCI_3_02	Maîtriser les bases de l'électricité	Circuits, loi d'Ohm, puissance électrique	Sciences	d4be03c4-3727-4100-90c3-79e944736b74	\N	2	t	2026-06-14 03:05:35.196909	2026-06-14 03:05:35.196909	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
dc5a257e-2218-494f-aca2-26c4bc74f5a9	COMP_SCI_T_01	Analyser les mécanismes de l'hérédité	ADN, gènes, chromosomes, lois de Mendel	Sciences	3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	\N	1	t	2026-06-14 03:05:35.200459	2026-06-14 03:05:35.200459	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
b44db13a-ff30-45c3-ae18-4046e7792caa	COMP_SCI_T_02	Étudier la mécanique newtonienne	Lois de Newton, énergie, mouvement	Sciences	3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	\N	2	t	2026-06-14 03:05:35.20523	2026-06-14 03:05:35.20523	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
97c1d1b4-b48c-4904-96e5-259c39e898cc	COMP_FR_6_01	Rédiger un texte narratif cohérent	Structure narrative, temps verbaux, cohérence	Français	f6395176-4a66-43d2-8c05-83b99d0f8432	\N	1	t	2026-06-14 03:05:35.209789	2026-06-14 03:05:35.209789	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
fdc479d3-6365-446b-a088-825aaa7dfc2d	COMP_FR_6_02	Identifier les classes grammaticales	Nom, verbe, adjectif, déterminant, pronom	Français	f6395176-4a66-43d2-8c05-83b99d0f8432	\N	2	t	2026-06-14 03:05:35.214635	2026-06-14 03:05:35.214635	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
369eb7ae-3d2d-4d40-aba9-7561488e0e49	COMP_FR_T_01	Analyser un texte littéraire	Procédés stylistiques, registres, argumentation	Français	3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	\N	1	t	2026-06-14 03:05:35.219296	2026-06-14 03:05:35.219296	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
7c534863-eb24-4f96-a05f-6cd6ddb6c861	COMP_FR_T_02	Rédiger une dissertation structurée	Introduction, développement, conclusion, problématique	Français	3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	\N	2	t	2026-06-14 03:05:35.223583	2026-06-14 03:05:35.223583	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
3b516fb0-863a-427f-8c4e-32cbe9e8a36b	COMP_ANG_6_01	Se présenter en anglais	Name, age, nationality, family, hobbies	Anglais	f6395176-4a66-43d2-8c05-83b99d0f8432	\N	1	t	2026-06-14 03:05:35.228308	2026-06-14 03:05:35.228308	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
787b0eed-e631-4ecb-87e8-b79577d03392	COMP_ANG_6_02	Comprendre des instructions simples	Classroom instructions, basic vocabulary	Anglais	f6395176-4a66-43d2-8c05-83b99d0f8432	\N	2	t	2026-06-14 03:05:35.232916	2026-06-14 03:05:35.232916	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
1111ddf1-c032-4492-b079-f90fed84890f	COMP_ANG_T_01	Tenir une conversation courante	Fluency, pronunciation, everyday topics	Anglais	3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	\N	1	t	2026-06-14 03:05:35.237594	2026-06-14 03:05:35.237594	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
8efeeeb5-ab25-4dc7-8306-11bc43ea0a64	COMP_ANG_T_02	Rédiger un essai argumentatif	Essay structure, linking words, formal register	Anglais	3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	\N	2	t	2026-06-14 03:05:35.241077	2026-06-14 03:05:35.241077	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
ed1fa78f-c34f-400f-8d11-c1249a65c1a7	COMP_INFO_2_01	Maîtriser les bases de la programmation	Variables, conditions, boucles, fonctions	Informatique	b9f1bf49-9d27-42b2-ab2c-dcc56d78c443	\N	1	t	2026-06-14 03:05:35.24399	2026-06-14 03:05:35.24399	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
43b7824a-ab2f-4560-bf9d-ad5f4e1d21be	COMP_INFO_2_02	Créer une page HTML/CSS simple	Balises HTML, CSS de base, mise en page	Informatique	b9f1bf49-9d27-42b2-ab2c-dcc56d78c443	\N	2	t	2026-06-14 03:05:35.247066	2026-06-14 03:05:35.247066	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
f3c8486c-2995-4431-8fd9-32c9c13851c7	COMP_HG_3_01	Analyser les causes de la Seconde Guerre mondiale	Contexte historique, traités, montée des totalitarismes	Histoire-Géographie	d4be03c4-3727-4100-90c3-79e944736b74	\N	1	t	2026-06-14 03:05:35.250403	2026-06-14 03:05:35.250403	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
976a6b5f-5f59-4073-bdd8-8d08d180df81	COMP_HG_3_02	Comprendre la décolonisation	Mouvements d'indépendance, impacts géopolitiques	Histoire-Géographie	d4be03c4-3727-4100-90c3-79e944736b74	\N	2	t	2026-06-14 03:05:35.25493	2026-06-14 03:05:35.25493	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
391f9a6c-d5ae-4a47-9993-0bd0300e6760	COMP_EC_6_01	Connaître les symboles de la République	Drapeau, hymne national, devise, institutions	Éducation Civique	f6395176-4a66-43d2-8c05-83b99d0f8432	\N	1	t	2026-06-14 03:05:35.259197	2026-06-14 03:05:35.259197	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
7d60d888-1857-4aef-862b-56fef07d881d	COMP_EC_6_02	Comprendre les droits et devoirs du citoyen	Libertés fondamentales, responsabilités civiques	Éducation Civique	f6395176-4a66-43d2-8c05-83b99d0f8432	\N	2	t	2026-06-14 03:05:35.263204	2026-06-14 03:05:35.263204	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
\.


--
-- Data for Name: comptes_bancaires; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comptes_bancaires (id, code, libelle, banque, "numeroCompte", type, "soldeActuel", "soldeInitial", "decouvertAutorise", actif, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: comptes_caisse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comptes_caisse (id, code, libelle, type, "soldeActuel", "soldeInitial", "seuilAlerte", actif, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: configuration_app; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configuration_app (id, "nomEtablissement", "typeEtablissement", "adresseEtablissement", "villeEtablissement", "paysEtablissement", "telephoneEtablissement", "emailEtablissement", "siteWebEtablissement", "numeroAdministratif", "sloganEtablissement", "logoUrl", "messageAccueil", "langueDefaut", devise, "fuseauHoraire", "couleurPrimaire", "couleurSecondaire", "couleurAccent", theme, "licenceKey", "licenceExpiration", "licenceActive", "modulesActifs", "valeurDefaut", version, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: configuration_modules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configuration_modules (id, "moduleNom", "etablissementId", "champsPersonnalises", widgets, parametres, actif, "valeurDefaut", "createdAt", "updatedAt") FROM stdin;
901b798c-8f7e-4d66-aa02-cf24919baec9	auth	\N	[]	[]	{"sessionDuration":1440,"maxLoginAttempts":5,"lockoutDuration":15,"require2FA":false,"passwordMinLength":8}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"sessionDuration":1440,"maxLoginAttempts":5,"lockoutDuration":15,"require2FA":false,"passwordMinLength":8},"actif":true}	2026-06-14 03:05:30.589277	2026-06-14 03:05:30.589277
da88c6fb-ac75-487b-ad08-e28d35c52f85	utilisateurs	\N	[]	[]	{"allowSelfRegistration":false,"requireEmailVerification":true,"defaultRole":"ELEVE"}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"allowSelfRegistration":false,"requireEmailVerification":true,"defaultRole":"ELEVE"},"actif":true}	2026-06-14 03:05:30.598017	2026-06-14 03:05:30.598017
6f168a9f-b1bf-4761-8c5e-8542f907ac65	configuration	\N	[]	[]	{}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{},"actif":true}	2026-06-14 03:05:30.604499	2026-06-14 03:05:30.604499
e9c77ea4-3928-4e2d-8b92-8599c0b0f96d	notifications	\N	[]	[]	{"enablePush":true,"enableEmail":true,"enableSMS":false,"defaultChannel":"IN_APP"}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"enablePush":true,"enableEmail":true,"enableSMS":false,"defaultChannel":"IN_APP"},"actif":true}	2026-06-14 03:05:30.611623	2026-06-14 03:05:30.611623
c7155cf9-16b8-4e1b-a40d-e99b37a95452	messagerie	\N	[]	[]	{"allowAttachments":true,"maxAttachmentSize":5242880,"allowGroupChats":true}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"allowAttachments":true,"maxAttachmentSize":5242880,"allowGroupChats":true},"actif":true}	2026-06-14 03:05:30.616717	2026-06-14 03:05:30.616717
5a16172f-ac83-45d1-9172-73231fc06e65	requetes	\N	[]	[]	{"requireApproval":true,"approvalLevels":1}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"requireApproval":true,"approvalLevels":1},"actif":true}	2026-06-14 03:05:30.625431	2026-06-14 03:05:30.625431
c949fa86-69fd-4dc2-8ff5-c2a9415894f0	sondages	\N	[]	[]	{"maxDestinataires":500,"maxOptions":20,"dureeParDefaut":"7j","allowAnonymous":true,"allowMultipleChoice":true}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"maxDestinataires":500,"maxOptions":20,"dureeParDefaut":"7j","allowAnonymous":true,"allowMultipleChoice":true},"actif":true}	2026-06-14 03:05:30.634481	2026-06-14 03:05:30.634481
f697f76c-a8d0-4fbc-a67d-be4887a6482b	annonces	\N	[]	[]	{"vitesseDefilement":50,"hauteurBande":40,"intervalleActualisation":30,"pauseSurVol":true,"delaiApparition":600,"delaiReapparition":600,"requireValidation":false}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"vitesseDefilement":50,"hauteurBande":40,"intervalleActualisation":30,"pauseSurVol":true,"delaiApparition":600,"delaiReapparition":600,"requireValidation":false},"actif":true}	2026-06-14 03:05:30.643025	2026-06-14 03:05:30.643025
ded9ce03-2691-4332-85b7-7b25b6ed6c05	notes	\N	[]	[]	{"defaultBareme":20,"allowBulkEntry":true,"requireValidation":true,"showClassRanking":true}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"defaultBareme":20,"allowBulkEntry":true,"requireValidation":true,"showClassRanking":true},"actif":true}	2026-06-14 03:05:30.649916	2026-06-14 03:05:30.649916
e3692197-0322-4f92-b9f0-6a55b2ad4b29	bulletins	\N	[]	[]	{"includeRanking":true,"includeComments":true,"templateId":"default"}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{"includeRanking":true,"includeComments":true,"templateId":"default"},"actif":false}	2026-06-14 03:05:30.655315	2026-06-14 03:05:30.655315
638349ee-4124-4f0a-a738-832f90ec6327	eleves	\N	[]	[]	{"requireValidation":false,"validationLevels":2,"autoGenerateMatricule":true}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"requireValidation":false,"validationLevels":2,"autoGenerateMatricule":true},"actif":true}	2026-06-14 03:05:30.659843	2026-06-14 03:05:30.659843
0ba717c0-5e96-4f23-aa4c-2bd4925cbb33	orientation	\N	[]	[]	{}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{},"actif":false}	2026-06-14 03:05:30.663604	2026-06-14 03:05:30.663604
72d8d78a-1945-416a-b3d3-58657aca4056	responsables-eleves	\N	[]	[]	{"allowMultipleParents":true,"requireLegalGuardian":true,"enablePaymentAccess":false}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"allowMultipleParents":true,"requireLegalGuardian":true,"enablePaymentAccess":false},"actif":true}	2026-06-14 03:05:30.668346	2026-06-14 03:05:30.668346
55e7e086-9292-4d4c-bc35-54fbe154a26d	programmes	\N	[]	[]	{"enableGamification":true,"autoCalculProgression":true,"seuilConformite":90}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"enableGamification":true,"autoCalculProgression":true,"seuilConformite":90},"actif":true}	2026-06-14 03:05:30.673135	2026-06-14 03:05:30.673135
0b2fa3ff-3023-430d-b9d7-fe4affc819f9	cantine	\N	[]	[]	{"defaultCurrency":"XOF","menuPlanningDays":7,"allowPreorder":true}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"defaultCurrency":"XOF","menuPlanningDays":7,"allowPreorder":true},"actif":true}	2026-06-14 03:05:30.677876	2026-06-14 03:05:30.677876
4df33091-063e-416c-aec8-1893ba2a24ed	transport	\N	[]	[]	{"enableGPS":false,"enableQRCheckin":true}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"enableGPS":false,"enableQRCheckin":true},"actif":true}	2026-06-14 03:05:30.68131	2026-06-14 03:05:30.68131
168d71e2-a03b-4de7-9b0d-bf2812e80c68	parking	\N	[]	[]	{"tarifStandardHoraire":500,"tarifPMRHoraire":0,"tarifAbonnementMensuel":25000,"placesTotales":100}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{"tarifStandardHoraire":500,"tarifPMRHoraire":0,"tarifAbonnementMensuel":25000,"placesTotales":100},"actif":false}	2026-06-14 03:05:30.685408	2026-06-14 03:05:30.685408
b3f96de6-c331-496e-949e-62b62cdecc46	materiel	\N	[]	[]	{"enableBarcode":true,"maxLoanDays":30}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{"enableBarcode":true,"maxLoanDays":30},"actif":false}	2026-06-14 03:05:30.689684	2026-06-14 03:05:30.689684
621713ec-d4b0-4302-adb6-d0651e3fc640	finances	\N	[]	[]	{"defaultCurrency":"XOF","enableOnlinePayment":false}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{"defaultCurrency":"XOF","enableOnlinePayment":false},"actif":false}	2026-06-14 03:05:30.693975	2026-06-14 03:05:30.693975
484f7417-b0b3-4fec-8565-a803ad8daa71	clubs	\N	[]	[]	{"maxClubsPerStudent":3}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{"maxClubsPerStudent":3},"actif":false}	2026-06-14 03:05:30.697392	2026-06-14 03:05:30.697392
19ce6ef2-f87d-4e25-bbc1-60bdfcfb3f0b	gamification	\N	[]	[]	{"pointsPerAttendance":5,"pointsPerGoodGrade":10,"enableLeaderboard":true,"anonymizeRanking":false}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{"pointsPerAttendance":5,"pointsPerGoodGrade":10,"enableLeaderboard":true,"anonymizeRanking":false},"actif":false}	2026-06-14 03:05:30.700631	2026-06-14 03:05:30.700631
ea78e493-ce3c-4bc0-ac7d-2a3f06b0a297	cartes	\N	[]	[]	{"enableQRCode":true,"cardValidityMonths":12}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"enableQRCode":true,"cardValidityMonths":12},"actif":true}	2026-06-14 03:05:30.705151	2026-06-14 03:05:30.705151
879a7975-6f02-45f4-8246-b0524ba41ad7	documents	\N	[]	[]	{}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{},"actif":false}	2026-06-14 03:05:30.710785	2026-06-14 03:05:30.710785
2f7a813e-b3d7-4fc8-bf61-a9466757a818	impressions	\N	[]	[]	{"defaultPrinter":null}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{"defaultPrinter":null},"actif":false}	2026-06-14 03:05:30.715316	2026-06-14 03:05:30.715316
6b4be685-9507-41c0-8676-ce919253704d	suivi-eleves	\N	[]	[]	{}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{},"actif":true}	2026-06-14 03:05:30.719905	2026-06-14 03:05:30.719905
811b5ecf-5ae2-4526-a689-c0f365614f78	suivi-personnel	\N	[]	[]	{}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{},"actif":true}	2026-06-14 03:05:30.7243	2026-06-14 03:05:30.7243
7c5c4257-e526-4467-9043-18c9d26d79bc	sante	\N	[]	[]	{}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{},"actif":false}	2026-06-14 03:05:30.730623	2026-06-14 03:05:30.730623
1991cd25-c500-4d8b-af93-3210a089a091	scoring	\N	[]	[]	{}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{},"actif":false}	2026-06-14 03:05:30.735265	2026-06-14 03:05:30.735265
5089da0e-35a1-4add-9b68-0a6da629924f	monitoring	\N	[]	[]	{"retentionDays":30}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{"retentionDays":30},"actif":false}	2026-06-14 03:05:30.739517	2026-06-14 03:05:30.739517
0df45076-5136-4973-9867-5824bffa485c	dashboard	\N	[]	[]	{"autoRefresh":true,"refreshInterval":300,"defaultLayout":"grid"}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"autoRefresh":true,"refreshInterval":300,"defaultLayout":"grid"},"actif":true}	2026-06-14 03:05:30.744011	2026-06-14 03:05:30.744011
467901b0-d9cb-4a28-b508-afa18340d80b	peripheriques	\N	[]	[]	{}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{},"actif":false}	2026-06-14 03:05:30.749406	2026-06-14 03:05:30.749406
d31b713b-6c4d-44d8-b9d5-54f99faa532c	organisation	\N	[]	[]	{"typesUnitesActifs":["DIRECTION","DEPARTEMENT","SERVICE","POLE"]}	t	{"champsPersonnalises":[],"widgets":[],"parametres":{"typesUnitesActifs":["DIRECTION","DEPARTEMENT","SERVICE","POLE"]},"actif":true}	2026-06-14 03:05:30.754293	2026-06-14 03:05:30.754293
0484dbd2-04d3-4123-b1e1-3b38c875c1fb	recrutement	\N	[]	[]	{"autoPublishOffres":false,"delaiRelanceCandidatureJours":7,"dureeOnboardingDefautJours":30,"exigerLettreMotivation":true,"nombreEntretiensMinimum":2}	f	{"champsPersonnalises":[],"widgets":[],"parametres":{"autoPublishOffres":false,"delaiRelanceCandidatureJours":7,"dureeOnboardingDefautJours":30,"exigerLettreMotivation":true,"nombreEntretiensMinimum":2},"actif":false}	2026-06-14 03:05:30.759058	2026-06-14 03:05:30.759058
\.


--
-- Data for Name: consommations_cantine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.consommations_cantine (id, "inscriptionId", "menuId", montant, date, statut, paye, "etablissementId", "createdAt") FROM stdin;
\.


--
-- Data for Name: consultations_medicales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.consultations_medicales (id, "dossierMedicalId", "consultantId", "dateConsultation", type, statut, motif, diagnostic, traitement, observations, temperature, "tensionArterielle", "frequenceCardiaque", poids, taille, "signaleParent", "etablissementId", "periodeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: contrats_personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contrats_personnel (id, "membrePersonnelId", "typeContrat", "typeContratId", "posteId", "uniteOrganisationnelleId", "dateDebut", "dateFin", "salaireBase", "tarifHoraire", statut, "renouvellementAuto", clauses, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversations (id, titre, type, "createurId", "etablissementId", "entiteLieeType", "entiteLieeId", actif, archive, "dateArchive", "dernierMessageId", "countMessages", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: cotisations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cotisations (id, code, nom, type, "tauxPatronal", "tauxSalarial", plafond, description, "etablissementId", actif, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: cycles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cycles (id, nom, code, description, ordre, dureeannees, diplomesanctionnant, actif, "createdAt", "updatedAt") FROM stdin;
5357501a-28fd-49e4-9671-c8fa279cb70f	Enseignement Maternel	MATERNELLE	Cycle préscolaire pour les enfants de 3 à 6 ans	1	3	\N	t	2026-06-14 03:05:34.731424	2026-06-14 03:05:34.731424
4cc42c17-6502-4553-b312-2bee8678ae1e	Enseignement Primaire	PRIMAIRE	Cycle de l'enseignement élémentaire (6 ans)	2	6	CEP	t	2026-06-14 03:05:34.739421	2026-06-14 03:05:34.739421
1efbfc33-cb8e-41e5-bd92-ca3b5aad3e7c	Secondaire 1er Cycle - Collège	COLLEGE	Premier cycle de l'enseignement secondaire - Collège (4 ans)	3	4	BEPC	t	2026-06-14 03:05:34.744978	2026-06-14 03:05:34.744978
20de2237-0db0-4afc-a6dd-2ea1557b93ad	Secondaire 2nd Cycle - Lycée	LYCEE	Second cycle de l'enseignement secondaire - Lycée (3 ans)	4	3	BACCALAUREAT	t	2026-06-14 03:05:34.749491	2026-06-14 03:05:34.749491
\.


--
-- Data for Name: dashboard_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dashboard_config (id, "utilisateurId", layout, "widgetsActifs", "widgetsMasques", "widgetConfig", "themeDashboard", "nombreColonnes", "tailleCartes", "triParDefaut", "afficherStatsRapides", "afficherNotificationsRecents", "nombreNotifications", "refreshInterval", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: dashboard_layouts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dashboard_layouts (id, "utilisateurId", "etablissementId", nom, widgets, actif, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: demandes_depense; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.demandes_depense (id, "demandeurId", "categorieDepenseId", libelle, "montantEstime", urgence, justification, statut, "validePar", "dateValidation", "motifRejet", "depenseId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: depenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.depenses (id, "categorieDepenseId", "numeroPiece", libelle, "montantHT", tva, "montantTTC", "montantPaye", "dateFacture", "dateEcheance", "datePaiement", fournisseur, "referenceFacture", "justificatifPath", "methodePaiement", "referenceTransaction", statut, "niveauValidation", "demandeePar", "effectuePar", "validePar", "exerciceComptable", "periodeComptable", observations, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: diplomes_eleves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.diplomes_eleves (id, "eleveId", "examenNationalId", "noteObtenue", mention, resultat, "dateObtention", "numeroDiplome", observations, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: dossiers_medicaux; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dossiers_medicaux (id, "patientId", "typePatient", "eleveId", "personnelId", "groupeSanguin", "allergiesConnues", "antecedentsMedicaux", "traitementsEnCours", handicaps, "contraintesSpeciales", "medecinTraitant", "telephoneMedecin", "assuranceMaladie", "numeroAssurance", "etablissementId", "periodeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: echeanciers_paiement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.echeanciers_paiement (id, "eleveId", "fraisScolariteId", "numeroTranche", "montantAttendu", "dateEcheance", "montantPaye", statut, "datePaiementReel", "penaliteAppliquee", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ecritures_comptables; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ecritures_comptables (id, "numeroPiece", "dateEcriture", libelle, "compteDebit", "compteCredit", "montantDebit", "montantCredit", type, statut, "referenceExterne", observations, "utilisateurId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: elements_salaire; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.elements_salaire (id, "bulletinPaieId", type, categorie, libelle, montant, "baseCalcul", taux, "ordreAffichage", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: eleves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.eleves (id, "utilisateurId", nom, prenom, matricule, "dateNaissance", "lieuNaissance", sexe, nationalite, "sousSysteme", "nomPere", "professionPere", "telephonePere", "emailPere", "adressePere", "nomMere", "professionMere", "telephoneMere", "emailMere", "adresseMere", "nomTuteur", "lienParenteTuteur", "professionTuteur", "telephoneTuteur", "emailTuteur", "adresseTuteur", "dateInscription", photo, "groupeSanguin", allergies, "nomContactUrgence", "telephoneContactUrgence", "adresseDomicile", ville, quartier, "ecoleProvenance", "classeAnterieure", redoublement, boursier, "regimeInterne", "emailPrincipal", "transportScolaire", cantine, "situationFamiliale", "personneAutorisee", statut, "etatDossier", "typeInscription", "etatInscription", "estPreinscription", "documentsJustificatifs", "classeSouhaiteeId", "commentaireRefus", "dateTraitementInscription", "traitePar", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: entretiens_recrutement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.entretiens_recrutement (id, "candidatureId", "offreEmploiId", type, "dateEntretien", "heureDebut", "heureFin", lieu, "lienVideoconference", "grilleEvaluation", "compteRendu", note, "pointsFort", "pointsAmeliorer", decision, statut, "evaluateurId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: etablissement_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.etablissement_config (id, "etablissementId", "cyclesActifs", "configurationBulletin", "maxEleves", "maxUtilisateurs", "maxClasses", "stockageMaxMB", "dateExpirationAbonnement", "planAbonnement", "createdAt", "updatedAt") FROM stdin;
44a6f49e-9792-48fe-a280-9a175056978c	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266		{"style":"moderne","couleurPrimaire":"#2563EB","afficherRang":true,"afficherMoyenneGenerale":true,"afficherAppreciation":true,"afficherPhoto":true,"afficherCourbeProgression":true}	1000	100	50	5000	\N	gratuit	2026-06-14 03:05:30.578736	2026-06-14 03:05:30.578736
\.


--
-- Data for Name: etablissements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.etablissements (id, nom, slogan, "logoUrl", "sousSysteme", type, "numeroArrete", "contactEmail", "contactTelephone", adresse, actif, statut, "codeEtablissement", "numeroContribuable", "numeroCompteBancaire", "siteWeb", facebook, twitter, "heuresOuverture", "heuresFermeture", "effectifMax", "effectifActuel", "directeurNom", "directeurAdjointNom", "censeurNom", "surveillantGeneralNom", "createdAt", "updatedAt") FROM stdin;
49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	Lycée Bilingue eLISAschool	L'excellence éducative au service de la réussite	\N	BICULTUREL	LAIC	\N	contact@elisaschool.cm	+237 690 000 000	Yaoundé, Cameroun	t	ACTIF	ETAB-001	\N	\N	https://elisaschool.cm	\N	\N	07:00	18:00	1000	0	Dr. Jean Dupont	Mme. Marie Ngo Mback	M. Pierre Mbarga	Mme. Aïcha Mahamat	2026-06-14 03:05:30.562471	2026-06-14 03:05:30.562471
\.


--
-- Data for Name: evaluations_competences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluations_competences (id, "noteId", "competenceId", "niveauMaitrise", score, observation, "enProgression", "dateEvaluation", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: evaluations_enseignants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluations_enseignants (id, "enseignantId", "evaluateurId", "dateEvaluation", categorie, note, commentaire, "planAction", "etablissementId", "createdAt") FROM stdin;
\.


--
-- Data for Name: evaluations_personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluations_personnel (id, "membrePersonnelId", "evaluateurId", periodicite, statut, periode, "noteGlobale", "pointsFort", "pointsAmeliorer", objectifs, commentaires, "visibleConcerned", "etablissementId", "anneeScolaireId", "periodeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: evenements_clubs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evenements_clubs (id, "clubId", titre, description, "dateDebut", "dateFin", lieu, "etablissementId", "createdAt") FROM stdin;
\.


--
-- Data for Name: examens_nationaux; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.examens_nationaux (id, nom, code, type, "niveauId", "dateProgrammation", coefficient, "estObligatoire", "diplomeDelivre", description, soussysteme, actif, "createdAt", "updatedAt") FROM stdin;
48e30652-2ea1-452f-8d3d-f1f977a92ce0	Certificat d'Études Primaires	CEP	NATIONAL	571e2115-961b-4367-8aa7-e279a0948881	\N	\N	t	CEP	\N	FRANCOPHONE	t	2026-06-14 03:05:34.971807	2026-06-14 03:05:34.971807
e132ad6f-17a9-45a3-b3f0-ecfa4c5293d4	Brevet d'Études du Premier Cycle	BEPC	NATIONAL	d4be03c4-3727-4100-90c3-79e944736b74	\N	\N	t	BEPC	\N	FRANCOPHONE	t	2026-06-14 03:05:34.978857	2026-06-14 03:05:34.978857
9f1f4a69-f252-463f-a9de-6e1f6e326e54	PROBATOIRE	PROBATOIRE	NATIONAL	dc6056c7-3ccc-4c5d-830c-661db8290326	\N	\N	t	PROBATOIRE	\N	FRANCOPHONE	t	2026-06-14 03:05:34.984285	2026-06-14 03:05:34.984285
0f12b9ef-ef05-44cc-b0f8-80cc7faf7c50	BACCALAURÉAT	BACCALAUREAT	NATIONAL	3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	\N	\N	t	BACCALAUREAT	\N	FRANCOPHONE	t	2026-06-14 03:05:34.988842	2026-06-14 03:05:34.988842
d3dd6cf1-9364-47a7-a1df-388e40c0f430	First School Leaving Certificate	FSLC	NATIONAL	e88c9e6f-4b04-43f3-b3e3-9654b18288f2	\N	\N	t	FSLC	\N	ANGLOPHONE	t	2026-06-14 03:05:34.994792	2026-06-14 03:05:34.994792
e849dc72-6768-4f11-8b42-a9792e730b36	GCE Ordinary Level	GCE_OL	NATIONAL	2443fc48-3ead-4b89-ab62-a748d9022208	\N	\N	t	GCE_ORDINARY_LEVEL	\N	ANGLOPHONE	t	2026-06-14 03:05:35.000787	2026-06-14 03:05:35.000787
08637327-439f-4748-83cb-34070060a764	GCE Advanced Level	GCE_AL	NATIONAL	abc01f38-6d02-48bf-b2a5-a8fdfc649aaa	\N	\N	t	GCE_ADVANCED_LEVEL	\N	ANGLOPHONE	t	2026-06-14 03:05:35.006032	2026-06-14 03:05:35.006032
\.


--
-- Data for Name: factures_fournisseur; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.factures_fournisseur (id, "numeroFacture", "depenseId", fournisseur, "dateFacture", "dateEcheance", "montantHT", tva, "montantTTC", "pdfPath", "saisiePar", "verifieePar", statut, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: felicitations_eleves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.felicitations_eleves (id, "eleveId", type, motif, description, "pointsBonus", "visibleBulletin", "visibleParent", "attribueParId", "etablissementId", "anneeScolaireId", "periodeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: fiches_metiers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fiches_metiers (id, nom, description, filiere, "competencesRequises", "formationsRecommandees", "salaireEstime", debouches, actif, "createdAt") FROM stdin;
\.


--
-- Data for Name: file_impressions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.file_impressions (id, "utilisateurId", type, "modeleId", titre, donnees, statut, "fichierUrl", "nombreCopies", erreur, "dateTraitement", "createdAt") FROM stdin;
\.


--
-- Data for Name: filieres; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.filieres (id, nom, code, description, "cycleId", soussysteme, actif, "createdAt", "updatedAt", "etablissementId") FROM stdin;
5f709146-c2fc-477e-9daf-93161c7aaf4a	Série C - Mathématiques et Physique	C	Mathématiques, Physique, Chimie	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.891589	2026-06-14 03:05:34.891589	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
7840af98-eeac-42b4-b1e7-5c2b971bd590	Série D - Sciences de la Nature	D	Biologie, Chimie, Sciences Naturelles	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.897246	2026-06-14 03:05:34.897246	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
8a3ac05c-3eff-4901-977d-6d73ff02172e	Série E - Génie Civil	E	Génie Civil, Construction	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.901686	2026-06-14 03:05:34.901686	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
602901f1-cda9-43e5-8c42-73f62d533916	Série A - Lettres et Sciences Humaines	A	Lettres, Histoire, Géographie, Philosophie	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.906711	2026-06-14 03:05:34.906711	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
95010211-9a5b-4030-b7e8-abe3509d4ef7	Série A1 - Langues	A1	Langues vivantes et littérature	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.910867	2026-06-14 03:05:34.910867	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
95f2d42a-6c41-4c36-bfc0-5a96c929b603	Série F1 - Génie Mécanique	F1	Mécanique automobile, maintenance industrielle, usinage	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.915695	2026-06-14 03:05:34.915695	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
af436829-a165-49af-a510-e53964100645	Série F2 - Génie Électrotechnique	F2	Électricité, électronique, automatismes, informatique industrielle	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.920182	2026-06-14 03:05:34.920182	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
9dc2bdc3-fba7-486f-9c5e-8257c6064d7d	Série F3 - Génie Civil Bâtiment	F3	Construction, architecture, topographie, bâtiment	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.926703	2026-06-14 03:05:34.926703	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
2c49ad5f-9f79-4013-93e6-b8f362ba886d	Série F4 - Génie Chimique	F4	Chimie industrielle, laboratoires, procédés chimiques	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.932129	2026-06-14 03:05:34.932129	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
a08c9a71-330f-486c-963e-a5dea05feec4	Série G1 - Techniques Administratives	G1	Secrétariat, bureautique, gestion administrative	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.938495	2026-06-14 03:05:34.938495	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
c6c25a00-a58f-4a32-846b-5bb62f93f3bd	Série G2 - Techniques Commerciales	G2	Commerce, vente, marketing, action commerciale	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.942814	2026-06-14 03:05:34.942814	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
22cd02c5-6744-4419-863a-22a32a8a0284	Série H - Techniques Économiques	H	Comptabilité, finance, économie, gestion	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.949173	2026-06-14 03:05:34.949173	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
bef352cb-542a-444d-a858-8096271dacd5	Série I - Informatique	I	Développement, réseaux, systèmes d'information	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.955431	2026-06-14 03:05:34.955431	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
fc5798ad-04b5-4bfd-ad2f-cdbc96f2419e	Série K - Arts Appliqués	K	Design, mode, stylisme, arts graphiques	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.960529	2026-06-14 03:05:34.960529	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
ef5aca3e-beb8-490e-a03e-1d1ac6dccfe9	Série L - Hôtellerie-Restauration	L	Cuisine, service, gestion hôtelière, tourisme	20de2237-0db0-4afc-a6dd-2ea1557b93ad	FRANCOPHONE	t	2026-06-14 03:05:34.965153	2026-06-14 03:05:34.965153	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
\.


--
-- Data for Name: frais_scolarite; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.frais_scolarite (id, "etablissementId", "anneeScolaireId", "niveauId", "cycleId", "sectionId", "classeId", "fraisInscription", "fraisScolariteAnnuel", "fraisCantineOptionnel", "fraisTransportOptionnel", "autresFrais", "nombreTranches", "datePremiereEcheance", "frequenceEcheance", "penaliteRetard", "joursGrace", "remisesPossibles", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: groupe_admins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groupe_admins (id, "groupeId", "utilisateurId", "assignePar", date_assignation) FROM stdin;
\.


--
-- Data for Name: groupe_etablissement_liens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groupe_etablissement_liens (id, "groupeId", "etablissementId", "ajoutePar", date_ajout) FROM stdin;
\.


--
-- Data for Name: groupes_etablissements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groupes_etablissements (id, nom, description, "proprietaireId", code, actif, cree_at, maj_at) FROM stdin;
\.


--
-- Data for Name: groupes_matieres; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groupes_matieres (id, nom, ordre, description, "createdAt") FROM stdin;
\.


--
-- Data for Name: heures_cours; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.heures_cours (id, "enseignantId", "classeId", "matiereId", "periodeId", date, "heureDebut", "heureFin", "statutEffectue", salle, "remplacantId", "etablissementId", "createdAt") FROM stdin;
\.


--
-- Data for Name: hierarchie_personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hierarchie_personnel (id, "personnelId", "personnelNom", "superieurId", "superieurNom", "typeRelation", statut, actif, "posteId", "posteIntitule", "uniteOrganisationnelleId", "uniteNom", "etablissementId", "dateDebut", "dateFin", commentaire, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: historique_configuration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historique_configuration (id, "utilisateurId", action, cible, "cibleId", "cibleNom", description, "ancienneValeur", "nouvelleValeur", "ipAddress", restaurable, "createdAt") FROM stdin;
\.


--
-- Data for Name: historique_points; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historique_points (id, "utilisateurId", points, action, description, "sourceModule", "sourceId", "createdAt") FROM stdin;
\.


--
-- Data for Name: historique_scores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historique_scores (id, "eleveId", type, score, date, raison, "createdAt") FROM stdin;
\.


--
-- Data for Name: historique_scores_personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historique_scores_personnel (id, "scorePersonnelId", "membrePersonnelId", "etablissementId", "anneeScolaireId", "periodeId", "typeModification", "sourceModule", "sourceId", "pointsAnciens", "pointsNouveaux", "pointsDelta", "categorieScore", raison, "declencheurAutomatique", "utilisateurId", "createdAt") FROM stdin;
\.


--
-- Data for Name: incidents_eleves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incidents_eleves (id, "eleveId", "declarantId", "dateIncident", gravite, statut, type, description, lieu, temoins, "actionPrise", "sanctionId", "signaleParent", "dateSignalementParent", "etablissementId", "anneeScolaireId", "periodeId", "classeId", "matiereId", "enseignantId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: incidents_personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incidents_personnel (id, "membrePersonnelId", "declarantId", "dateIncident", gravite, statut, type, description, "actionPrise", "etablissementId", "anneeScolaireId", "periodeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: incidents_sante; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incidents_sante (id, "dossierMedicalId", "dateIncident", type, gravite, nature, description, lieu, "premiersSecours", "suiteDonnee", hospitalisation, "signaleParent", "dateSignalementParent", "declareParId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: inscriptions_cantine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inscriptions_cantine (id, "eleveId", statut, "dateDebut", "dateFin", allergies, "regimeAlimentaire", solde, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: inscriptions_clubs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inscriptions_clubs (id, "clubId", "eleveId", actif, "etablissementId", "inscritAt") FROM stdin;
\.


--
-- Data for Name: inscriptions_transport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inscriptions_transport (id, "eleveId", "ligneId", "arretMontee", "arretDescente", actif, "soldePaye", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: lignes_budget; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lignes_budget (id, "montantPrevu", "montantEngage", "montantConsomme", "pourcentageAlerte", "bloquerSiDepasse", observations, "budgetId", "categorieDepenseId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: lignes_transport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lignes_transport (id, nom, "numeroLigne", arrets, "chauffeurId", immatriculation, capacite, tarif, actif, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: materiels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.materiels (id, nom, reference, "numeroSerie", categorie, etat, quantite, localisation, valeur, "dateAcquisition", notes, disponible, statut, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: matieres; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.matieres (id, nom, code, "nomAnglais", couleur, actif, "createdAt", "updatedAt", "etablissementId", "sousSysteme") FROM stdin;
e8686966-afe9-450c-ab3b-edbae28aa779	Mathématiques	MATH	\N	#FF6B6B	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
922540c0-5391-4a15-8533-9e8955d9c394	Physique-Chimie	PC	\N	#4ECDC4	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
a5fe7ed8-60d3-4f6f-956d-c96d82c245d7	Sciences de la Vie et de la Terre	SVT	\N	#45B7D1	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
4ee2842b-4b6b-4992-ba32-740b5669f6b0	Informatique	INFO	\N	#96CEB4	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
09f7498f-4b13-4157-b5e1-1e3aa382ee7a	Français	FR	\N	#FFEAA7	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
ff6fd577-85c7-4a08-bc13-ff686e5b1f64	Anglais	ANG	\N	#DDA0DD	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
46ca0360-dfca-471d-adc6-b6be4b8cd010	Histoire-Géographie	HG	\N	#98D8C8	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
f06736e4-2408-4ee2-a1c3-051ed7e6e3f3	Philosophie	PHILO	\N	#F7DC6F	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
823bf060-e648-4556-bfaa-0ae04e616a0a	Lettres	LETT	\N	#BB8FCE	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
92da8251-da2e-498b-94a0-3e121ab52e3d	Éducation Physique et Sportive	EPS	\N	#82E0AA	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
bf6397ce-a6b4-4140-b12c-e7959b1428ba	Éducation Artistique	ART	\N	#F8C471	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
f6de173e-a1ae-4d95-8972-fccc7a2b19a0	Musique	MUS	\N	#85C1E9	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
e83627ef-339b-450d-901d-519598910f21	Éducation Morale et Civique	EMC	\N	#D7BDE2	t	2026-06-14 05:27:11.416607	2026-06-14 05:27:11.416607	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	\N
\.


--
-- Data for Name: matieres_niveaux; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.matieres_niveaux (id, "matiereId", "niveauId", "groupeId", coefficient, credits, bareme, "volumeHoraire", obligatoire, statut, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: membres_personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.membres_personnel (id, "utilisateurId", "typePersonnelId", matricule, "dateEmbauche", statut, specialites, diplomes, "posteExact", service, "responsableHierarchiqueId", competences, "specialitePrincipale", "anneesExperience", "educationNiveau", "etablissementOrigine", disponibilites, "heuresMaxSemaine", "horairesTravail", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: menus_cantine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menus_cantine (id, date, "typeRepas", "platPrincipal", accompagnement, dessert, prix, statut, actif, allergenes, description, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: message_mentions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_mentions (id, "messageId", "mentionneId", lu, "createdAt") FROM stdin;
\.


--
-- Data for Name: message_reactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_reactions (id, "messageId", "utilisateurId", emoji, "createdAt") FROM stdin;
\.


--
-- Data for Name: message_read_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_read_status (id, "messageId", "utilisateurId", "luA") FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, "conversationId", "expediteurId", "reponseAId", contenu, "typeContenu", priorite, "etablissementId", "piecesJointes", modifie, supprime, mentions, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: messages_fichiers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages_fichiers (id, "messageId", "nomFichier", "cheminStockage", "typeMime", taille, "urlAcces", stockage, "etablissementId", "createdAt") FROM stdin;
\.


--
-- Data for Name: modeles_cartes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modeles_cartes (id, nom, type, "etablissementId", largeur, hauteur, orientation, "champsAffiches", "couleurPrimaire", "couleurSecondaire", "logoUrl", "templateHtml", "parDefaut", actif, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: modeles_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modeles_documents (id, nom, type, description, template, entete, "piedDePage", styles, actif, "parDefaut", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: mouvements_caisse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mouvements_caisse (id, "numeroOperation", "dateMouvement", type, montant, motif, beneficiaire, reference, "soldeApresOperation", "compteCaisseId", "utilisateurId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: niveaux; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.niveaux (id, nom, code, "cycleId", "examenNationalId", "estClasseExamen", "sousSysteme", ordre, actif, "createdAt", "updatedAt") FROM stdin;
6bae151b-6dd6-428b-8124-9198396215d1	Petite Section	PS	5357501a-28fd-49e4-9671-c8fa279cb70f	\N	f	FRANCOPHONE	1	t	2026-06-14 03:05:34.75821	2026-06-14 03:05:34.75821
f2a256d4-6756-44ba-b963-4b355cff6ea1	Moyenne Section	MS	5357501a-28fd-49e4-9671-c8fa279cb70f	\N	f	FRANCOPHONE	2	t	2026-06-14 03:05:34.765322	2026-06-14 03:05:34.765322
09a07a05-f1c4-4f10-bb36-407829d4c814	Grande Section	GS	5357501a-28fd-49e4-9671-c8fa279cb70f	\N	f	FRANCOPHONE	3	t	2026-06-14 03:05:34.76952	2026-06-14 03:05:34.76952
70d5bcb0-3098-4aa0-9ea6-803bdf9461ac	Cours Initial	CI	4cc42c17-6502-4553-b312-2bee8678ae1e	\N	f	FRANCOPHONE	1	t	2026-06-14 03:05:34.773396	2026-06-14 03:05:34.773396
a1f49c9e-6410-4e7a-8b53-7e90e554b20c	Cours Préparatoire	CP	4cc42c17-6502-4553-b312-2bee8678ae1e	\N	f	FRANCOPHONE	2	t	2026-06-14 03:05:34.777131	2026-06-14 03:05:34.777131
f6d441d7-5c1a-427e-87ad-dd2f76fb54a5	Cours Élémentaire 1	CE1	4cc42c17-6502-4553-b312-2bee8678ae1e	\N	f	FRANCOPHONE	3	t	2026-06-14 03:05:34.78053	2026-06-14 03:05:34.78053
aa3c32fc-1d9a-4336-a6e6-cea7ec649beb	Cours Élémentaire 2	CE2	4cc42c17-6502-4553-b312-2bee8678ae1e	\N	f	FRANCOPHONE	4	t	2026-06-14 03:05:34.785689	2026-06-14 03:05:34.785689
7f360cb1-e7ea-4715-8d41-029432ace47d	Cours Moyen 1	CM1	4cc42c17-6502-4553-b312-2bee8678ae1e	\N	f	FRANCOPHONE	5	t	2026-06-14 03:05:34.789793	2026-06-14 03:05:34.789793
571e2115-961b-4367-8aa7-e279a0948881	Cours Moyen 2	CM2	4cc42c17-6502-4553-b312-2bee8678ae1e	\N	t	FRANCOPHONE	6	t	2026-06-14 03:05:34.794071	2026-06-14 03:05:34.794071
f6395176-4a66-43d2-8c05-83b99d0f8432	Sixième	6EME	1efbfc33-cb8e-41e5-bd92-ca3b5aad3e7c	\N	f	FRANCOPHONE	1	t	2026-06-14 03:05:34.797779	2026-06-14 03:05:34.797779
f92dc956-0984-41eb-9e98-875ae96f84b5	Cinquième	5EME	1efbfc33-cb8e-41e5-bd92-ca3b5aad3e7c	\N	f	FRANCOPHONE	2	t	2026-06-14 03:05:34.801892	2026-06-14 03:05:34.801892
2cbfb710-1f2d-4b6d-ad2a-6b073d496291	Quatrième	4EME	1efbfc33-cb8e-41e5-bd92-ca3b5aad3e7c	\N	f	FRANCOPHONE	3	t	2026-06-14 03:05:34.807376	2026-06-14 03:05:34.807376
d4be03c4-3727-4100-90c3-79e944736b74	Troisième	3EME	1efbfc33-cb8e-41e5-bd92-ca3b5aad3e7c	\N	t	FRANCOPHONE	4	t	2026-06-14 03:05:34.811551	2026-06-14 03:05:34.811551
b9f1bf49-9d27-42b2-ab2c-dcc56d78c443	Seconde	SECONDE	20de2237-0db0-4afc-a6dd-2ea1557b93ad	\N	f	FRANCOPHONE	1	t	2026-06-14 03:05:34.816162	2026-06-14 03:05:34.816162
dc6056c7-3ccc-4c5d-830c-661db8290326	Première	PREMIERE	20de2237-0db0-4afc-a6dd-2ea1557b93ad	\N	f	FRANCOPHONE	2	t	2026-06-14 03:05:34.820137	2026-06-14 03:05:34.820137
3be719b6-6bf9-4c3d-a873-92c1f6c2fec3	Terminale	TERMINALE	20de2237-0db0-4afc-a6dd-2ea1557b93ad	\N	t	FRANCOPHONE	3	t	2026-06-14 03:05:34.825735	2026-06-14 03:05:34.825735
9fd383a2-4b86-4c23-9ae8-bc0283de8eb9	Nursery 1	NURSERY1	5357501a-28fd-49e4-9671-c8fa279cb70f	\N	f	ANGLOPHONE	1	t	2026-06-14 03:05:34.830196	2026-06-14 03:05:34.830196
b06ef7c8-9216-467d-8777-09e5eeca02a1	Nursery 2	NURSERY2	5357501a-28fd-49e4-9671-c8fa279cb70f	\N	f	ANGLOPHONE	2	t	2026-06-14 03:05:34.834148	2026-06-14 03:05:34.834148
a1dca7bd-d1a4-4570-a4e7-7e63199b849a	Standard 1	STD1	4cc42c17-6502-4553-b312-2bee8678ae1e	\N	f	ANGLOPHONE	1	t	2026-06-14 03:05:34.838301	2026-06-14 03:05:34.838301
29cbbec3-1ef1-43cf-96b6-99b1d4efe0e9	Standard 2	STD2	4cc42c17-6502-4553-b312-2bee8678ae1e	\N	f	ANGLOPHONE	2	t	2026-06-14 03:05:34.842347	2026-06-14 03:05:34.842347
5a234387-daf8-44ac-9fda-aa3b289349dc	Standard 3	STD3	4cc42c17-6502-4553-b312-2bee8678ae1e	\N	f	ANGLOPHONE	3	t	2026-06-14 03:05:34.8466	2026-06-14 03:05:34.8466
afe11a5b-31e3-4315-a3d9-4d640393afcc	Standard 4	STD4	4cc42c17-6502-4553-b312-2bee8678ae1e	\N	f	ANGLOPHONE	4	t	2026-06-14 03:05:34.850148	2026-06-14 03:05:34.850148
1ce09e5c-642d-4763-85f3-31d66f28f519	Standard 5	STD5	4cc42c17-6502-4553-b312-2bee8678ae1e	\N	f	ANGLOPHONE	5	t	2026-06-14 03:05:34.853973	2026-06-14 03:05:34.853973
e88c9e6f-4b04-43f3-b3e3-9654b18288f2	Standard 6	STD6	4cc42c17-6502-4553-b312-2bee8678ae1e	\N	t	ANGLOPHONE	6	t	2026-06-14 03:05:34.858184	2026-06-14 03:05:34.858184
3c9fe5b4-8b19-44e2-a0b3-9f84bb39cb87	Form 1	FORM1	1efbfc33-cb8e-41e5-bd92-ca3b5aad3e7c	\N	f	ANGLOPHONE	1	t	2026-06-14 03:05:34.861905	2026-06-14 03:05:34.861905
dec8acb7-6c2a-4892-9744-e59e1b237588	Form 2	FORM2	1efbfc33-cb8e-41e5-bd92-ca3b5aad3e7c	\N	f	ANGLOPHONE	2	t	2026-06-14 03:05:34.866804	2026-06-14 03:05:34.866804
d451bf73-422a-420e-8c2c-853342558644	Form 3	FORM3	1efbfc33-cb8e-41e5-bd92-ca3b5aad3e7c	\N	f	ANGLOPHONE	3	t	2026-06-14 03:05:34.86993	2026-06-14 03:05:34.86993
ee0b48a5-9348-4b1c-8b06-bd6826663f03	Form 4	FORM4	1efbfc33-cb8e-41e5-bd92-ca3b5aad3e7c	\N	f	ANGLOPHONE	4	t	2026-06-14 03:05:34.873525	2026-06-14 03:05:34.873525
2443fc48-3ead-4b89-ab62-a748d9022208	Form 5	FORM5	1efbfc33-cb8e-41e5-bd92-ca3b5aad3e7c	\N	t	ANGLOPHONE	5	t	2026-06-14 03:05:34.877614	2026-06-14 03:05:34.877614
1ea49ab8-640d-4cc4-aa52-0734fa4aebf2	Lower Sixth	LOWER6	20de2237-0db0-4afc-a6dd-2ea1557b93ad	\N	f	ANGLOPHONE	1	t	2026-06-14 03:05:34.881592	2026-06-14 03:05:34.881592
abc01f38-6d02-48bf-b2a5-a8fdfc649aaa	Upper Sixth	UPPER6	20de2237-0db0-4afc-a6dd-2ea1557b93ad	\N	t	ANGLOPHONE	2	t	2026-06-14 03:05:34.886346	2026-06-14 03:05:34.886346
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notes (id, "eleveId", "enseignantId", "matiereId", "classeId", "periodeId", "anneeScolaireId", "typeEvaluation", description, valeur, bareme, coefficient, commentaire, "dateEvaluation", statut, "validateurId", "valideeAt", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notification_providers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_providers (id, nom, type, service, actif, "estDefaut", configuration, "quotaJournalier", "quotaUtilise", priorite, "etablissementId", description, "derniereErreurAt", "dernierMessageErreur", "erreursConsecutives", "createdAt", "updatedAt") FROM stdin;
56cb890b-e352-420a-9995-e59d0db0cb5c	In-App (Défaut)	IN_APP	in-app	t	t	{}	0	0	1	\N	Provider In-App par défaut - Notifications dans l'application	\N	\N	0	2026-06-14 01:49:12.982965	2026-06-14 01:49:12.982965
3628133a-f16f-4650-b385-e50fb27572e6	SMTP (À configurer)	EMAIL	nodemailer	f	t	{"host":"smtp.example.com","port":587,"secure":false,"auth":{"user":"votre-email@example.com","pass":"votre-mot-de-passe"},"from":{"name":"eLISAschool","email":"noreply@elisaschool.cm"}}	1000	0	1	\N	Provider Email SMTP - À configurer avec vos identifiants	\N	\N	0	2026-06-14 01:49:12.982965	2026-06-14 01:49:12.982965
4afd2816-7ee9-448e-914b-5905bb4e294b	Twilio (À configurer)	SMS	twilio	f	t	{"accountSid":"votre-account-sid","authToken":"votre-auth-token","fromNumber":"+1234567890"}	500	0	1	\N	Provider SMS Twilio - À configurer avec vos identifiants	\N	\N	0	2026-06-14 01:49:12.982965	2026-06-14 01:49:12.982965
a517ba4c-167d-49f6-8b85-f4523cbd9add	Firebase FCM (À configurer)	PUSH	firebase-fcm	f	t	{"projectId":"votre-project-id","serverKey":"votre-server-key","vapidKey":"votre-vapid-key"}	5000	0	1	\N	Provider Push Firebase FCM - À configurer avec vos identifiants	\N	\N	0	2026-06-14 01:49:12.982965	2026-06-14 01:49:12.982965
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, "destinataireId", "expediteurId", titre, contenu, type, statut, priorite, categorie, "lienAction", metadata, "lueAt", "envoyeeAt", "programmeePour", "createdAt") FROM stdin;
\.


--
-- Data for Name: observations_eleves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.observations_eleves (id, "eleveId", "observateurId", type, categorie, commentaire, "pointsImpact", "visibleParent", "etablissementId", "anneeScolaireId", "periodeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: offres_emploi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.offres_emploi (id, "posteId", "uniteOrganisationnelleId", titre, description, missions, "profilRecherche", "competencesRequises", "experienceRequise", "niveauEtudeRequis", "salaireMin", "salaireMax", "typeContratPropose", statut, "datePublication", "dateLimite", "nombrePostesDisponibles", "nombreCandidatures", "publieParId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: onboarding_recrutement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.onboarding_recrutement (id, "membrePersonnelId", "offreEmploiId", "dateDebut", "dateFinReel", "dateFinPrevu", statut, checklist, "tuteurId", "formationInitiale", "equipementFourni", "accesSystemes", commentaires, "progressionPourcentage", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: organisations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organisations (id, nom, description, type, "logoUrl", code, email, telephone, adresse, "siteWeb", statut, actif, "etablissementId", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: paiements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.paiements (id, "eleveId", "echeancierId", montant, "montantPenalite", "montantTotal", "typePaiement", "methodePaiement", "referenceTransaction", "numeroRecu", "datePaiement", statut, "effectuePar", "validePar", observations, "statutValidation", "niveauValidationActuel", "motifRefus", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: parametre_versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parametre_versions (id, "parametreId", "etablissementId", "ancienneValeur", "nouvelleValeur", version, "modifiedBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: parametres_systeme; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parametres_systeme (id, cle, valeur, "typeValeur", categorie, module, "etablissementId", description, "valeurDefaut", "modifiableRuntime", visible, ordre, validation, options, "createdAt", "updatedAt") FROM stdin;
c7087593-8448-4a59-bd7b-42421ba67ee3	auth.session_duration	1440	NUMBER	SECURITE	auth	\N	Durée de session en minutes (24h par défaut)	1440	t	t	1	\N	\N	2026-06-14 03:05:30.769482	2026-06-14 03:05:30.769482
b25174c9-abdf-4bb2-b70f-2ca8639f02e5	auth.max_login_attempts	5	NUMBER	SECURITE	auth	\N	Nombre max de tentatives de connexion	5	t	t	2	\N	\N	2026-06-14 03:05:30.775839	2026-06-14 03:05:30.775839
5e70fe06-2ead-4945-9c5f-24543556e67e	auth.lockout_duration	15	NUMBER	SECURITE	auth	\N	Durée de blocage après échecs (minutes)	15	t	t	3	\N	\N	2026-06-14 03:05:30.780542	2026-06-14 03:05:30.780542
b06c38ec-e379-4c23-bd7f-36b79975c182	auth.require_2fa	false	BOOLEAN	SECURITE	auth	\N	Exiger l'authentification 2FA	false	t	t	4	\N	\N	2026-06-14 03:05:30.785945	2026-06-14 03:05:30.785945
beb07f91-5b74-48cf-9661-e1e4dce7bebe	auth.password_min_length	8	NUMBER	SECURITE	auth	\N	Longueur minimale du mot de passe	8	t	t	5	\N	\N	2026-06-14 03:05:30.791333	2026-06-14 03:05:30.791333
574adb81-0388-4f00-b3ad-bc7477abb9fa	auth.password_require_uppercase	true	BOOLEAN	SECURITE	auth	\N	Exiger une majuscule	true	t	t	6	\N	\N	2026-06-14 03:05:30.796266	2026-06-14 03:05:30.796266
f1caa4f5-6924-47fb-8046-bcdddbd8bc47	auth.password_require_number	true	BOOLEAN	SECURITE	auth	\N	Exiger un chiffre	true	t	t	7	\N	\N	2026-06-14 03:05:30.800529	2026-06-14 03:05:30.800529
9b3ed2cf-0201-4da1-9656-173c562e98d8	auth.password_require_lowercase	true	BOOLEAN	SECURITE	auth	\N	Exiger au moins une lettre minuscule	true	t	t	8	\N	\N	2026-06-14 03:05:30.805252	2026-06-14 03:05:30.805252
c69c19ef-a025-43b2-846d-372ce6c05fbc	auth.password_require_special	true	BOOLEAN	SECURITE	auth	\N	Exiger au moins un caractère spécial (!@#$%^&*)	true	t	t	9	\N	\N	2026-06-14 03:05:30.811216	2026-06-14 03:05:30.811216
32ee4247-59e2-433b-ae9e-aec75904a239	auth.password_history_count	3	NUMBER	SECURITE	auth	\N	Nombre de mots de passe conservés dans l'historique (0-12, 0 = désactivé)	3	t	t	10	\N	\N	2026-06-14 03:05:30.81614	2026-06-14 03:05:30.81614
28eb35ba-6446-43ae-b406-946964a71474	auth.password_expiry_days	0	NUMBER	SECURITE	auth	\N	Expiration du mot de passe en jours (0 = jamais expirer)	0	t	t	11	\N	\N	2026-06-14 03:05:30.820769	2026-06-14 03:05:30.820769
1e3af3ae-d087-446d-81c3-26aa8c59509e	auth.require_email_verification	true	BOOLEAN	SECURITE	auth	\N	Exiger la vérification de l'email avant connexion	true	t	t	12	\N	\N	2026-06-14 03:05:30.826216	2026-06-14 03:05:30.826216
9795bac9-3f91-404a-8c95-17e88a62d64a	auth.allow_self_registration	false	BOOLEAN	SECURITE	auth	\N	Autoriser l'auto-inscription des utilisateurs	false	t	t	13	\N	\N	2026-06-14 03:05:30.832191	2026-06-14 03:05:30.832191
33e7a1c3-c251-420b-8446-4542cc1dd677	auth.inactivity_timeout	30	NUMBER	SECURITE	auth	\N	Délai d'inactivité avant déconnexion automatique (minutes)	30	t	t	14	\N	\N	2026-06-14 03:05:30.837075	2026-06-14 03:05:30.837075
eb34185b-3e7f-4ad0-b9f0-8fa2332a1058	auth.ip_whitelist	""	STRING	SECURITE	auth	\N	Liste blanche d'adresses IP autorisées (séparées par des virgules, vide = toutes autorisées)	""	t	t	15	\N	\N	2026-06-14 03:05:30.840752	2026-06-14 03:05:30.840752
c281680d-f9cd-4615-b181-472d2cc5b041	auth.log_sensitive_actions	true	BOOLEAN	SECURITE	auth	\N	Journaliser toutes les actions sensibles dans l'audit trail	true	t	t	16	\N	\N	2026-06-14 03:05:30.844999	2026-06-14 03:05:30.844999
c298cecf-87e6-4e5c-9ac2-6f740fac32ba	auth.brute_force_protection	true	BOOLEAN	SECURITE	auth	\N	Activer la protection contre les attaques par force brute	true	t	t	17	\N	\N	2026-06-14 03:05:30.849605	2026-06-14 03:05:30.849605
36feecee-dd6d-473e-9e8c-bb05a979c99a	auth.rate_limiting	"medium"	STRING	SECURITE	auth	\N	Niveau de limitation du débit des requêtes	"medium"	t	t	18	\N	[{"value":"low","label":"Faible (100 req/min)"},{"value":"medium","label":"Moyen (50 req/min)"},{"value":"high","label":"Élevé (20 req/min)"}]	2026-06-14 03:05:30.854552	2026-06-14 03:05:30.854552
a66cc38c-f7a6-4aca-b623-cef1f65459c2	auth.security_email_alerts	false	BOOLEAN	SECURITE	auth	\N	Envoyer des alertes par email pour les événements de sécurité critiques	false	t	t	19	\N	\N	2026-06-14 03:05:30.858912	2026-06-14 03:05:30.858912
38bc8238-15b0-4ab1-ac6b-6330beb3e01d	auth.suspicious_activity_notifications	true	BOOLEAN	SECURITE	auth	\N	Notifier les utilisateurs en cas d'activité suspecte sur leur compte	true	t	t	20	\N	\N	2026-06-14 03:05:30.862797	2026-06-14 03:05:30.862797
22f5bab1-f097-4e22-b6fb-4736a5b986ca	notifications.enable_push	true	BOOLEAN	NOTIFICATION	notifications	\N	Activer les notifications push	true	t	t	1	\N	\N	2026-06-14 03:05:30.867965	2026-06-14 03:05:30.867965
b2418485-9123-446f-aada-cd80a604dc31	notifications.enable_email	true	BOOLEAN	NOTIFICATION	notifications	\N	Activer les notifications email	true	t	t	2	\N	\N	2026-06-14 03:05:30.873012	2026-06-14 03:05:30.873012
1b34cfe2-b214-41a2-93e7-a89b3d1f3fdc	notifications.enable_sms	false	BOOLEAN	NOTIFICATION	notifications	\N	Activer les notifications SMS	false	t	t	3	\N	\N	2026-06-14 03:05:30.877171	2026-06-14 03:05:30.877171
04ed3a33-9c47-4296-a71b-6daf25b3e3fa	notifications.default_channel	"IN_APP"	STRING	NOTIFICATION	notifications	\N	Canal par défaut	"IN_APP"	t	t	4	\N	[{"value":"IN_APP","label":"Application"},{"value":"EMAIL","label":"Email"},{"value":"PUSH","label":"Push"},{"value":"SMS","label":"SMS"}]	2026-06-14 03:05:30.880885	2026-06-14 03:05:30.880885
2d7d22e0-569d-48c9-9939-e58059854a3e	notifications.providers.auto_load	true	BOOLEAN	NOTIFICATION	notifications	\N	Charger automatiquement les providers au démarrage	true	t	t	5	\N	\N	2026-06-14 03:05:30.885988	2026-06-14 03:05:30.885988
5a603b55-fc31-44e2-acc2-c0e5a7298884	notifications.retries.max_attempts	3	NUMBER	NOTIFICATION	notifications	\N	Nombre maximal de tentatives d'envoi	3	t	t	6	\N	\N	2026-06-14 03:05:30.891824	2026-06-14 03:05:30.891824
177ac643-0122-41f4-8b48-3be86e655aed	notifications.rate_limit.per_hour	100	NUMBER	NOTIFICATION	notifications	\N	Limite de notifications par utilisateur par heure	100	t	t	7	\N	\N	2026-06-14 03:05:30.897427	2026-06-14 03:05:30.897427
86240644-7219-4bb1-ae26-00381267e818	notes.bareme_defaut	20	NUMBER	MODULE	notes	\N	Barème par défaut des évaluations	20	t	t	1	\N	\N	2026-06-14 03:05:30.901176	2026-06-14 03:05:30.901176
d17409d3-fd42-4d6f-9721-a30eb298b77b	notes.show_ranking	true	BOOLEAN	MODULE	notes	\N	Afficher le classement	true	t	t	2	\N	\N	2026-06-14 03:05:30.905881	2026-06-14 03:05:30.905881
b37f2df5-e139-4def-8587-2e0006eea3f3	notes.require_validation	true	BOOLEAN	MODULE	notes	\N	Validation obligatoire des notes	true	t	t	3	\N	\N	2026-06-14 03:05:30.910804	2026-06-14 03:05:30.910804
448309de-3d17-4121-ba38-ae7e83488e6b	notes.allow_bulk_entry	true	BOOLEAN	MODULE	notes	\N	Autoriser la saisie en masse	true	t	t	4	\N	\N	2026-06-14 03:05:30.915393	2026-06-14 03:05:30.915393
560aec4f-10bc-4859-a4fe-fa809874e90d	notes.validation_levels	2	NUMBER	MODULE	notes	\N	Niveaux de validation des notes	2	t	t	5	\N	\N	2026-06-14 03:05:30.919569	2026-06-14 03:05:30.919569
fa53aecb-5e23-41b9-9d12-2bd4ed496f5d	notes.validation_roles	"{\\"1\\":\\"ENSEIGNANT\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	JSON	MODULE	notes	\N	Rôles requis par niveau de validation	"{\\"1\\":\\"ENSEIGNANT\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	t	t	6	\N	\N	2026-06-14 03:05:30.924008	2026-06-14 03:05:30.924008
bd5ee098-955f-4103-8bf5-d45cf26edf1d	notes.auto_notify_on_validation	true	BOOLEAN	MODULE	notes	\N	Notifier les parents après validation	true	t	t	7	\N	\N	2026-06-14 03:05:30.929905	2026-06-14 03:05:30.929905
0f7bb78b-d290-43b1-9433-85306e69b2e7	cantine.menu_planning_days	7	NUMBER	MODULE	cantine	\N	Jours de planification des menus	7	t	t	1	\N	\N	2026-06-14 03:05:30.935044	2026-06-14 03:05:30.935044
25cc30bf-c0f2-4944-9ff1-90e34ac3159f	cantine.allow_preorder	true	BOOLEAN	MODULE	cantine	\N	Autoriser les précommandes	true	t	t	2	\N	\N	2026-06-14 03:05:30.939023	2026-06-14 03:05:30.939023
dd883e75-00c3-4ea0-856a-ac7212d11cda	cantine.max_debt	10000	NUMBER	MODULE	cantine	\N	Dette maximale autorisée (FCFA)	10000	t	t	3	\N	\N	2026-06-14 03:05:30.942702	2026-06-14 03:05:30.942702
daf6a421-93da-4c03-be8a-74bf3c01ece4	cantine.validation_levels	2	NUMBER	MODULE	cantine	\N	Niveaux de validation inscriptions	2	t	t	4	\N	\N	2026-06-14 03:05:30.947587	2026-06-14 03:05:30.947587
80e6aee1-aec6-4b07-aa73-e85c22145198	cantine.validation_roles	"{\\"1\\":\\"PERSONNEL\\",\\"2\\":\\"RESPONSABLE_CANTINE\\",\\"3\\":\\"ADMIN\\"}"	JSON	MODULE	cantine	\N	Rôles requis par niveau	"{\\"1\\":\\"PERSONNEL\\",\\"2\\":\\"RESPONSABLE_CANTINE\\",\\"3\\":\\"ADMIN\\"}"	t	t	5	\N	\N	2026-06-14 03:05:30.952272	2026-06-14 03:05:30.952272
954bc78d-0d3a-4d8a-8d1c-cc6a9bf34bfb	cantine.require_validation	false	BOOLEAN	MODULE	cantine	\N	Validation obligatoire des inscriptions cantine	false	t	t	6	\N	\N	2026-06-14 03:05:30.956487	2026-06-14 03:05:30.956487
2a73c10d-f28a-4487-86f7-bf8bd39e18db	transport.enable_gps	false	BOOLEAN	MODULE	transport	\N	Activer le suivi GPS	false	t	t	1	\N	\N	2026-06-14 03:05:30.960889	2026-06-14 03:05:30.960889
72901903-7cfa-4a21-ab5b-696f9aba9eb4	transport.enable_qr_checkin	true	BOOLEAN	MODULE	transport	\N	Activer le pointage par QR code	true	t	t	2	\N	\N	2026-06-14 03:05:30.965555	2026-06-14 03:05:30.965555
32b595f9-948d-478b-8047-3f44244faa5b	transport.alert_delay_minutes	10	NUMBER	MODULE	transport	\N	Délai avant alerte retard (minutes)	10	t	t	3	\N	\N	2026-06-14 03:05:30.970393	2026-06-14 03:05:30.970393
dcc50b63-7e7c-4995-9d4f-b2780ccb0c99	transport.validation_levels	2	NUMBER	MODULE	transport	\N	Niveaux de validation inscriptions	2	t	t	4	\N	\N	2026-06-14 03:05:30.975136	2026-06-14 03:05:30.975136
caef42a1-3b2d-4b60-8100-f9727fe9cbe3	transport.validation_roles	"{\\"1\\":\\"PERSONNEL\\",\\"2\\":\\"RESPONSABLE_TRANSPORT\\",\\"3\\":\\"ADMIN\\"}"	JSON	MODULE	transport	\N	Rôles requis par niveau	"{\\"1\\":\\"PERSONNEL\\",\\"2\\":\\"RESPONSABLE_TRANSPORT\\",\\"3\\":\\"ADMIN\\"}"	t	t	5	\N	\N	2026-06-14 03:05:30.978786	2026-06-14 03:05:30.978786
0bd4cd98-b871-42fd-ad21-2ef9d4f61612	transport.require_validation	false	BOOLEAN	MODULE	transport	\N	Validation obligatoire des inscriptions transport	false	t	t	6	\N	\N	2026-06-14 03:05:30.983274	2026-06-14 03:05:30.983274
ac9533e0-c8b0-4f8d-ba91-d7bab6edd8a0	bulletins.include_ranking	true	BOOLEAN	MODULE	bulletins	\N	Inclure le classement	true	t	t	1	\N	\N	2026-06-14 03:05:30.988272	2026-06-14 03:05:30.988272
f01587c1-ce8e-4632-a75c-4f0e8e3ee7ac	bulletins.show_appreciations	true	BOOLEAN	MODULE	bulletins	\N	Afficher les appréciations	true	t	t	2	\N	\N	2026-06-14 03:05:30.992906	2026-06-14 03:05:30.992906
1cb6d56b-c7b7-41ce-bcbd-6cca290ae265	bulletins.validation_threshold	10	NUMBER	MODULE	bulletins	\N	Seuil de validation (/20)	10	t	t	3	\N	\N	2026-06-14 03:05:30.996702	2026-06-14 03:05:30.996702
846f313c-e084-44e2-91e7-cb32a4140202	bulletins.calculation_method	"ponderee"	STRING	MODULE	bulletins	\N	Méthode de calcul	"ponderee"	t	t	4	\N	\N	2026-06-14 03:05:31.000343	2026-06-14 03:05:31.000343
e03ede09-d333-4d05-b432-3237b8568f30	bulletins.display_coefficients	true	BOOLEAN	MODULE	bulletins	\N	Afficher les coefficients	true	t	t	5	\N	\N	2026-06-14 03:05:31.004377	2026-06-14 03:05:31.004377
c06d160a-46cf-4dd3-a26e-2da070374452	bulletins.template_id	"default"	STRING	MODULE	bulletins	\N	Template par défaut	"default"	t	t	6	\N	\N	2026-06-14 03:05:31.009313	2026-06-14 03:05:31.009313
165f6862-48c6-483a-9e57-b71eb96c5abd	bulletins.validation_workflow	true	BOOLEAN	MODULE	bulletins	\N	Activer workflow validation	true	t	t	7	\N	\N	2026-06-14 03:05:31.014072	2026-06-14 03:05:31.014072
8ee6948f-dab5-4324-a2d4-b1195d7eae13	bulletins.validation_levels	2	NUMBER	MODULE	bulletins	\N	Niveaux de validation	2	t	t	8	\N	\N	2026-06-14 03:05:31.018055	2026-06-14 03:05:31.018055
a680c9ff-4952-4926-b403-b560b851cb19	bulletins.validation_roles	"{\\"1\\":\\"ENSEIGNANT\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	JSON	MODULE	bulletins	\N	Rôles requis par niveau	"{\\"1\\":\\"ENSEIGNANT\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	t	t	9	\N	\N	2026-06-14 03:05:31.022044	2026-06-14 03:05:31.022044
10b2fe0e-0bf5-46b5-b3f0-f6a2eb9725e9	gamification.points_attendance	5	NUMBER	MODULE	gamification	\N	Points par présence journalière	5	t	t	1	\N	\N	2026-06-14 03:05:31.027336	2026-06-14 03:05:31.027336
4f3486a9-00db-4c60-b9ac-98b85c7fbc8e	gamification.points_good_grade	10	NUMBER	MODULE	gamification	\N	Points pour bonne note (≥80%)	10	t	t	2	\N	\N	2026-06-14 03:05:31.032783	2026-06-14 03:05:31.032783
82ef4f1d-c076-4df6-b71a-7139b23af5fe	gamification.enable_leaderboard	true	BOOLEAN	MODULE	gamification	\N	Activer le leaderboard	true	t	t	3	\N	\N	2026-06-14 03:05:31.037172	2026-06-14 03:05:31.037172
3e66056f-15e6-4985-9115-a1dbd241df56	gamification.anonymize_ranking	false	BOOLEAN	MODULE	gamification	\N	Anonymiser le classement	false	t	t	4	\N	\N	2026-06-14 03:05:31.04103	2026-06-14 03:05:31.04103
a0c6026a-1eff-4275-8e69-fd8252a2c8e4	gamification.auto_attendance	true	BOOLEAN	MODULE	gamification	\N	Attribution automatique des points d'assiduité (cron job)	true	t	t	5	\N	\N	2026-06-14 03:05:31.045239	2026-06-14 03:05:31.045239
b81be34d-3724-4f77-8c3b-9ec205686f93	gamification.auto_notes	true	BOOLEAN	MODULE	gamification	\N	Attribution automatique des points pour bonnes notes	true	t	t	6	\N	\N	2026-06-14 03:05:31.050087	2026-06-14 03:05:31.050087
31cf002c-9d56-4991-87a8-60677a1497c1	gamification.seuil_bonne_note	0.8	NUMBER	MODULE	gamification	\N	Seuil pour bonne note (80% du barème)	0.8	t	t	7	\N	\N	2026-06-14 03:05:31.054714	2026-06-14 03:05:31.054714
05458f43-c5b1-453f-8f2a-f28097023ea2	programmes.actif	true	BOOLEAN	MODULE	programmes	\N	Activer le module programmes pédagogiques	true	t	t	1	\N	\N	2026-06-14 03:05:31.058593	2026-06-14 03:05:31.058593
666fa4fb-cf5f-47a6-a7fe-eab6966a62fa	programmes.enable_gamification	true	BOOLEAN	MODULE	programmes	\N	Activer la gamification pour les enseignants (points/badges)	true	t	t	2	\N	\N	2026-06-14 03:05:31.0625	2026-06-14 03:05:31.0625
7a96ec21-3e8c-4c32-a4ad-a84c4bd8547e	programmes.auto_calcul_progression	true	BOOLEAN	MODULE	programmes	\N	Calcul automatique de la progression à partir des chapitres validés	true	t	t	3	\N	\N	2026-06-14 03:05:31.067276	2026-06-14 03:05:31.067276
951e17f7-5c26-457e-8d98-3578addb1abd	programmes.seuil_conformite	90	NUMBER	MODULE	programmes	\N	Seuil de conformité programme (%) pour badge "programme conforme"	90	t	t	4	\N	\N	2026-06-14 03:05:31.072456	2026-06-14 03:05:31.072456
702eacc5-ca87-4cde-b144-54d8087c5810	programmes.require_validation	false	BOOLEAN	MODULE	programmes	\N	Validation obligatoire des chapitres créés	false	t	t	5	\N	\N	2026-06-14 03:05:31.076926	2026-06-14 03:05:31.076926
60a1cb64-aa26-43d3-b7a7-4c291c516254	programmes.validation_levels	2	NUMBER	MODULE	programmes	\N	Niveaux de validation des chapitres	2	t	t	6	\N	\N	2026-06-14 03:05:31.08053	2026-06-14 03:05:31.08053
95c3b5eb-922c-48fd-8602-4c8d90bbb41f	programmes.validation_roles	"{\\"1\\":\\"ENSEIGNANT\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	JSON	MODULE	programmes	\N	Rôles requis par niveau de validation	"{\\"1\\":\\"ENSEIGNANT\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	t	t	7	\N	\N	2026-06-14 03:05:31.085215	2026-06-14 03:05:31.085215
b809bfb9-c53f-4adb-8c56-c57839811a87	cartes.enable_qrcode	true	BOOLEAN	MODULE	cartes	\N	Inclure QR code sur les cartes	true	t	t	1	\N	\N	2026-06-14 03:05:31.090496	2026-06-14 03:05:31.090496
58ab4003-9a4a-451f-9610-e5f3b40e9ea8	cartes.validity_months	12	NUMBER	MODULE	cartes	\N	Durée de validité (mois)	12	t	t	2	\N	\N	2026-06-14 03:05:31.095121	2026-06-14 03:05:31.095121
12238932-86ed-4cf3-b6e7-62a7fa89a199	cartes.include_photo	true	BOOLEAN	MODULE	cartes	\N	Inclure la photo	true	t	t	3	\N	\N	2026-06-14 03:05:31.098973	2026-06-14 03:05:31.098973
6b62b2a0-f9e0-4ece-84ee-9360284b6807	clubs.max_per_student	3	NUMBER	MODULE	clubs	\N	Nombre max de clubs par élève	3	t	t	1	\N	\N	2026-06-14 03:05:31.102455	2026-06-14 03:05:31.102455
c851a97f-8aa1-4d0a-b65d-9611fcc5ebfd	clubs.require_approval	true	BOOLEAN	MODULE	clubs	\N	Approbation requise pour inscription	true	t	t	2	\N	\N	2026-06-14 03:05:31.107205	2026-06-14 03:05:31.107205
de87b3db-758f-4096-a7a9-63b62d7b77e2	materiel.max_loan_days	30	NUMBER	MODULE	materiel	\N	Durée max de prêt (jours)	30	t	t	1	\N	\N	2026-06-14 03:05:31.111977	2026-06-14 03:05:31.111977
225306ce-acd6-4b7d-87d1-c45eb61dca86	materiel.enable_barcode	true	BOOLEAN	MODULE	materiel	\N	Activer les codes-barres	true	t	t	2	\N	\N	2026-06-14 03:05:31.116199	2026-06-14 03:05:31.116199
4d7e7887-df8b-4cf8-91dc-4bbd92180879	requetes.approval_levels	1	NUMBER	MODULE	requetes	\N	Niveaux d'approbation	1	t	t	1	\N	\N	2026-06-14 03:05:31.119807	2026-06-14 03:05:31.119807
5af81f76-1f01-442c-8d81-12c32aa44365	requetes.auto_notify	true	BOOLEAN	MODULE	requetes	\N	Notification automatique	true	t	t	2	\N	\N	2026-06-14 03:05:31.123961	2026-06-14 03:05:31.123961
c3e55067-2fae-4220-be99-aa28279fffde	classes.require_validation	false	BOOLEAN	MODULE	classes	\N	Validation obligatoire des affectations d'élèves	false	t	t	1	\N	\N	2026-06-14 03:05:31.13029	2026-06-14 03:05:31.13029
9067fbed-d20f-4351-ba41-b284ee6013c5	classes.validation_levels	2	NUMBER	MODULE	classes	\N	Niveaux de validation des affectations	2	t	t	2	\N	\N	2026-06-14 03:05:31.135253	2026-06-14 03:05:31.135253
58a415ac-9b92-4e71-aea9-2d49e16c2f02	classes.validation_roles	"{\\"1\\":\\"ENSEIGNANT\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	JSON	MODULE	classes	\N	Rôles requis par niveau de validation	"{\\"1\\":\\"ENSEIGNANT\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	t	t	3	\N	\N	2026-06-14 03:05:31.138515	2026-06-14 03:05:31.138515
5c2ce724-0227-4fb4-9d4b-d0a6fbaa6529	matieres.require_validation	false	BOOLEAN	MODULE	matieres	\N	Validation obligatoire des affectations enseignants et programmes	false	t	t	1	\N	\N	2026-06-14 03:05:31.141902	2026-06-14 03:05:31.141902
0a437163-7946-4490-90d9-8aadb2359588	matieres.validation_levels	2	NUMBER	MODULE	matieres	\N	Niveaux de validation des affectations/programmes	2	t	t	2	\N	\N	2026-06-14 03:05:31.146385	2026-06-14 03:05:31.146385
33af3889-ca47-44e9-8fbf-8af25392d054	matieres.validation_roles	"{\\"1\\":\\"ENSEIGNANT\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	JSON	MODULE	matieres	\N	Rôles requis par niveau de validation	"{\\"1\\":\\"ENSEIGNANT\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	t	t	3	\N	\N	2026-06-14 03:05:31.15104	2026-06-14 03:05:31.15104
20bc72d9-1159-43e4-88c1-d28a5a34e766	periodes.require_validation	false	BOOLEAN	MODULE	periodes	\N	Validation obligatoire de la clôture des périodes	false	t	t	1	\N	\N	2026-06-14 03:05:31.155628	2026-06-14 03:05:31.155628
767b6697-e2a0-4875-9274-46fcc6da5f67	periodes.validation_levels	2	NUMBER	MODULE	periodes	\N	Niveaux de validation de la clôture	2	t	t	2	\N	\N	2026-06-14 03:05:31.159596	2026-06-14 03:05:31.159596
d23e2bc7-e4d5-44ca-80a8-439d44dd908c	periodes.validation_roles	"{\\"1\\":\\"CHEF_ETABLISSEMENT\\",\\"2\\":\\"ADMIN\\"}"	JSON	MODULE	periodes	\N	Rôles requis par niveau de validation	"{\\"1\\":\\"CHEF_ETABLISSEMENT\\",\\"2\\":\\"ADMIN\\"}"	t	t	3	\N	\N	2026-06-14 03:05:31.163669	2026-06-14 03:05:31.163669
26a7763f-01c8-4ce5-b937-bc8539a99192	eleves.require_validation	false	BOOLEAN	MODULE	eleves	\N	Validation obligatoire des inscriptions d'élèves	false	t	t	1	\N	\N	2026-06-14 03:05:31.168877	2026-06-14 03:05:31.168877
c3ea547b-0d20-4b85-870a-07be607ebda9	eleves.validation_levels	2	NUMBER	MODULE	eleves	\N	Niveaux de validation des inscriptions	2	t	t	2	\N	\N	2026-06-14 03:05:31.174031	2026-06-14 03:05:31.174031
0e806ed6-f53e-4a8b-b833-4c199716b3a9	eleves.validation_roles	"{\\"1\\":\\"PERSONNEL\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	JSON	MODULE	eleves	\N	Rôles requis par niveau de validation	"{\\"1\\":\\"PERSONNEL\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	t	t	3	\N	\N	2026-06-14 03:05:31.178909	2026-06-14 03:05:31.178909
fc09b804-c7ea-4410-bab7-8f1ca16da582	personnel.require_validation	false	BOOLEAN	MODULE	personnel	\N	Validation obligatoire des embauches de personnel	false	t	t	1	\N	\N	2026-06-14 03:05:31.183349	2026-06-14 03:05:31.183349
689c35db-aab7-4b89-95a5-73e6fe6c31c9	personnel.validation_levels	2	NUMBER	MODULE	personnel	\N	Niveaux de validation des embauches	2	t	t	2	\N	\N	2026-06-14 03:05:31.188803	2026-06-14 03:05:31.188803
a9d63490-014e-46ea-bfdd-cd71de816213	personnel.validation_roles	"{\\"1\\":\\"CHEF_ETABLISSEMENT\\",\\"2\\":\\"ADMIN\\"}"	JSON	MODULE	personnel	\N	Rôles requis par niveau de validation	"{\\"1\\":\\"CHEF_ETABLISSEMENT\\",\\"2\\":\\"ADMIN\\"}"	t	t	3	\N	\N	2026-06-14 03:05:31.194073	2026-06-14 03:05:31.194073
683be27c-8063-4d80-984d-0ff36f88499a	clubs.require_validation	false	BOOLEAN	MODULE	clubs	\N	Validation obligatoire de la création de clubs	false	t	t	3	\N	\N	2026-06-14 03:05:31.198508	2026-06-14 03:05:31.198508
4ee64742-c083-4f4f-b271-5ecc7c5fc8c2	clubs.validation_levels	2	NUMBER	MODULE	clubs	\N	Niveaux de validation des clubs	2	t	t	4	\N	\N	2026-06-14 03:05:31.202492	2026-06-14 03:05:31.202492
2c05b7e2-8dde-4aac-806c-a68fca95fc1c	clubs.validation_roles	"{\\"1\\":\\"COORDINATEUR_CLUBS\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	JSON	MODULE	clubs	\N	Rôles requis par niveau de validation	"{\\"1\\":\\"COORDINATEUR_CLUBS\\",\\"2\\":\\"CHEF_ETABLISSEMENT\\",\\"3\\":\\"ADMIN\\"}"	t	t	5	\N	\N	2026-06-14 03:05:31.207561	2026-06-14 03:05:31.207561
7f3fa5b2-7b82-440f-b79a-18dda98fe1b0	clubs.inscription_require_validation	false	BOOLEAN	MODULE	clubs	\N	Validation obligatoire des inscriptions aux clubs	false	t	t	6	\N	\N	2026-06-14 03:05:31.21289	2026-06-14 03:05:31.21289
a74a2a8a-960b-4e15-a4bf-d9f01d93eed2	materiel.require_validation	false	BOOLEAN	MODULE	materiel	\N	Validation obligatoire des acquisitions de matériel	false	t	t	3	\N	\N	2026-06-14 03:05:31.21719	2026-06-14 03:05:31.21719
ae6253bc-1307-4169-805b-8e8b66b3e3ea	materiel.validation_levels	2	NUMBER	MODULE	materiel	\N	Niveaux de validation du matériel	2	t	t	4	\N	\N	2026-06-14 03:05:31.22118	2026-06-14 03:05:31.22118
03a95a76-c64a-41db-b07e-5ffeaf6e9957	materiel.validation_roles	"{\\"1\\":\\"GESTIONNAIRE\\",\\"2\\":\\"ADMIN\\"}"	JSON	MODULE	materiel	\N	Rôles requis par niveau de validation	"{\\"1\\":\\"GESTIONNAIRE\\",\\"2\\":\\"ADMIN\\"}"	t	t	5	\N	\N	2026-06-14 03:05:31.225962	2026-06-14 03:05:31.225962
cac16d31-39f5-44c2-bf6e-2ae114c086ed	materiel.pret_require_validation	false	BOOLEAN	MODULE	materiel	\N	Validation obligatoire des prêts de matériel	false	t	t	6	\N	\N	2026-06-14 03:05:31.231046	2026-06-14 03:05:31.231046
a13f73fe-ba6d-4c37-bb71-285f453b5e1a	cartes.require_validation	false	BOOLEAN	MODULE	cartes	\N	Validation obligatoire des demandes de carte	false	t	t	3	\N	\N	2026-06-14 03:05:31.236944	2026-06-14 03:05:31.236944
c9871cf9-adc8-4154-8bdb-8baba1c657f1	cartes.validation_levels	2	NUMBER	MODULE	cartes	\N	Niveaux de validation des cartes	2	t	t	4	\N	\N	2026-06-14 03:05:31.240376	2026-06-14 03:05:31.240376
8fa398f9-7f8e-487f-8b6d-988d105fa7a7	cartes.validation_roles	"{\\"1\\":\\"CHEF_ETABLISSEMENT\\",\\"2\\":\\"ADMIN\\"}"	JSON	MODULE	cartes	\N	Rôles requis par niveau de validation des cartes	"{\\"1\\":\\"CHEF_ETABLISSEMENT\\",\\"2\\":\\"ADMIN\\"}"	t	t	5	\N	\N	2026-06-14 03:05:31.244519	2026-06-14 03:05:31.244519
e0e55cd6-bd4e-4bea-abee-34236f637ba5	cartes.renouvellement_require_validation	false	BOOLEAN	MODULE	cartes	\N	Validation obligatoire des renouvellements de carte	false	t	t	6	\N	\N	2026-06-14 03:05:31.248718	2026-06-14 03:05:31.248718
6be0f8c4-3068-4d2a-ae4e-8690941e77e8	annees_scolaires.require_validation	false	BOOLEAN	MODULE	annees-scolaires	\N	Validation obligatoire des années scolaires (création et clôture)	false	t	t	3	\N	\N	2026-06-14 03:05:31.254135	2026-06-14 03:05:31.254135
04586333-518f-4491-a596-65422bd48934	annees_scolaires.validation_levels	2	NUMBER	MODULE	annees-scolaires	\N	Niveaux de validation des années scolaires	2	t	t	4	\N	\N	2026-06-14 03:05:31.257727	2026-06-14 03:05:31.257727
47e7195b-592f-4c51-b3f2-a1509494a5b6	annees_scolaires.validation_roles	"{\\"1\\":\\"CHEF_ETABLISSEMENT\\",\\"2\\":\\"ADMIN\\"}"	JSON	MODULE	annees-scolaires	\N	Rôles requis par niveau de validation des années scolaires	"{\\"1\\":\\"CHEF_ETABLISSEMENT\\",\\"2\\":\\"ADMIN\\"}"	t	t	5	\N	\N	2026-06-14 03:05:31.261321	2026-06-14 03:05:31.261321
0f656c89-70af-4784-875b-113942168df4	etablissement.require_validation	false	BOOLEAN	MODULE	etablissement	\N	Validation obligatoire des créations/désactivations d'établissement	false	t	t	3	\N	\N	2026-06-14 03:05:31.265582	2026-06-14 03:05:31.265582
769bd817-91e6-462e-900a-404af8306b81	etablissement.validation_levels	2	NUMBER	MODULE	etablissement	\N	Niveaux de validation des établissements	2	t	t	4	\N	\N	2026-06-14 03:05:31.26946	2026-06-14 03:05:31.26946
825b38d5-6165-477f-a6a2-6c0f60bad897	etablissement.validation_roles	"{\\"1\\":\\"ADMIN\\",\\"2\\":\\"SUPER_ADMIN\\"}"	JSON	MODULE	etablissement	\N	Rôles requis par niveau de validation des établissements	"{\\"1\\":\\"ADMIN\\",\\"2\\":\\"SUPER_ADMIN\\"}"	t	t	5	\N	\N	2026-06-14 03:05:31.27341	2026-06-14 03:05:31.27341
11f972df-1ed9-43c6-8703-fd9602191cc4	suivi-eleves.gamification.actif	true	BOOLEAN	MODULE	suivi-eleves	\N	Activer la gamification dans le suivi-élèves	true	t	t	10	\N	\N	2026-06-14 03:05:31.276993	2026-06-14 03:05:31.276993
635f2ba3-d1a6-408c-bc2a-57c1a0be9a7b	suivi-eleves.gamification.points_felicitations	10	NUMBER	MODULE	suivi-eleves	\N	Points pour une félicitation	10	t	t	11	\N	\N	2026-06-14 03:05:31.280505	2026-06-14 03:05:31.280505
300df0f6-8d86-4e7e-a006-613a8ff7c8b6	suivi-eleves.gamification.points_observation_positive	5	NUMBER	MODULE	suivi-eleves	\N	Points pour observation positive	5	t	t	12	\N	\N	2026-06-14 03:05:31.284444	2026-06-14 03:05:31.284444
48a9ae23-8354-4737-a3ae-1f56a5d5e562	suivi-eleves.gamification.points_observation_negative	-5	NUMBER	MODULE	suivi-eleves	\N	Points pour observation négative	-5	t	t	13	\N	\N	2026-06-14 03:05:31.289946	2026-06-14 03:05:31.289946
b409d796-68f7-431a-9a2d-ae71f0067d7b	suivi-personnel.gamification.actif	false	BOOLEAN	MODULE	suivi-personnel	\N	Activer la gamification dans le suivi-personnel	false	t	t	10	\N	\N	2026-06-14 03:05:31.294643	2026-06-14 03:05:31.294643
37db4332-ddbd-4d24-b808-a50d751f69b3	suivi-personnel.gamification.points_evaluation_positive	20	NUMBER	MODULE	suivi-personnel	\N	Points pour évaluation positive du personnel	20	t	t	11	\N	\N	2026-06-14 03:05:31.298073	2026-06-14 03:05:31.298073
f0d089ba-55e6-4366-ba6f-336afc9593d4	suivi-personnel.gamification.seuil_evaluation_positive	15	NUMBER	MODULE	suivi-personnel	\N	Seuil de note pour évaluation positive (/20)	15	t	t	12	\N	\N	2026-06-14 03:05:31.301786	2026-06-14 03:05:31.301786
57e7f73b-803a-44fd-a4b6-9a641f6864e1	suivi-personnel.gamification.points_assiduite	5	NUMBER	MODULE	suivi-personnel	\N	Points d'assiduité pour le personnel	5	t	t	13	\N	\N	2026-06-14 03:05:31.30663	2026-06-14 03:05:31.30663
fd41ad42-4629-4421-8f4d-840efc97480f	scoring-personnel.actif	false	BOOLEAN	MODULE	suivi-personnel	\N	Activer le système de scoring du personnel	false	t	t	20	\N	\N	2026-06-14 03:05:31.311743	2026-06-14 03:05:31.311743
b4cd4471-16ae-458b-b5aa-66d12c9ee3b9	scoring-personnel.auto_recalcul_quotidien	true	BOOLEAN	MODULE	suivi-personnel	\N	Recalcul automatique quotidien des scores	true	t	t	21	\N	\N	2026-06-14 03:05:31.31558	2026-06-14 03:05:31.31558
7fb47a13-172b-4a56-b22d-b169c33d7295	scoring-personnel.auto_classement	true	BOOLEAN	MODULE	suivi-personnel	\N	Mise à jour automatique des classements	true	t	t	22	\N	\N	2026-06-14 03:05:31.319024	2026-06-14 03:05:31.319024
3d7f439c-340f-44eb-8c96-2ce590b0db59	scoring-personnel.reset_mensuel	false	BOOLEAN	MODULE	suivi-personnel	\N	Reset mensuel des scores	false	t	t	23	\N	\N	2026-06-14 03:05:31.323212	2026-06-14 03:05:31.323212
2f9be54d-bb60-4bdb-880e-f18d1b1f58f2	scoring-personnel.nettoyage_historique	false	BOOLEAN	MODULE	suivi-personnel	\N	Nettoyage automatique de l'historique (> 1 an)	false	t	t	24	\N	\N	2026-06-14 03:05:31.32877	2026-06-14 03:05:31.32877
4012cdb7-35fd-44a0-9078-31a92c0c7b91	scoring-personnel.ponderation_assiduite	0.25	NUMBER	MODULE	suivi-personnel	\N	Pondération score assiduité (0-1)	0.25	t	t	25	\N	\N	2026-06-14 03:05:31.333747	2026-06-14 03:05:31.333747
7132ea83-f138-4956-9e95-2d1edd439162	scoring-personnel.ponderation_comportement	0.25	NUMBER	MODULE	suivi-personnel	\N	Pondération score comportement (0-1)	0.25	t	t	26	\N	\N	2026-06-14 03:05:31.337335	2026-06-14 03:05:31.337335
c99e75ae-6c59-493f-8ba7-9f9422661aa3	scoring-personnel.ponderation_performance	0.3	NUMBER	MODULE	suivi-personnel	\N	Pondération score performance (0-1)	0.3	t	t	27	\N	\N	2026-06-14 03:05:31.340569	2026-06-14 03:05:31.340569
79845348-f32a-40e5-a387-766d8151fd0f	scoring-personnel.ponderation_pedagogie	0.2	NUMBER	MODULE	suivi-personnel	\N	Pondération score pédagogie (0-1)	0.2	t	t	28	\N	\N	2026-06-14 03:05:31.344505	2026-06-14 03:05:31.344505
46b8fc5a-fc4c-4d91-b342-b37f4f3afa91	scoring-personnel.points_incident_mineur	-5	NUMBER	MODULE	suivi-personnel	\N	Points pour incident mineur	-5	t	t	29	\N	\N	2026-06-14 03:05:31.349307	2026-06-14 03:05:31.349307
127f9864-f00f-4c55-8024-3c542bc3a336	scoring-personnel.points_incident_modere	-10	NUMBER	MODULE	suivi-personnel	\N	Points pour incident modéré	-10	t	t	30	\N	\N	2026-06-14 03:05:31.353294	2026-06-14 03:05:31.353294
e6b26445-9c7a-4baf-9f2e-cb5f8e2bbc72	scoring-personnel.points_incident_grave	-20	NUMBER	MODULE	suivi-personnel	\N	Points pour incident grave	-20	t	t	31	\N	\N	2026-06-14 03:05:31.356794	2026-06-14 03:05:31.356794
e8db7ac3-48e3-4e90-bf7d-598373bce33d	scoring-personnel.points_incident_tres_grave	-40	NUMBER	MODULE	suivi-personnel	\N	Points pour incident très grave	-40	t	t	32	\N	\N	2026-06-14 03:05:31.360068	2026-06-14 03:05:31.360068
e2c1b904-10b9-4b67-b2e6-465928bd0848	scoring-personnel.points_absence_non_justifiee	-10	NUMBER	MODULE	suivi-personnel	\N	Points pour absence non justifiée	-10	t	t	33	\N	\N	2026-06-14 03:05:31.363442	2026-06-14 03:05:31.363442
c50bacf9-3875-48e7-b116-46dac33048bf	scoring-personnel.points_retard	-3	NUMBER	MODULE	suivi-personnel	\N	Points pour retard	-3	t	t	34	\N	\N	2026-06-14 03:05:31.368163	2026-06-14 03:05:31.368163
877ec2a9-7f37-41b9-b77e-74ab0c572747	regional.currency	"XOF"	STRING	REGIONAL	\N	\N	Devise monétaire	"XOF"	t	t	1	\N	[{"value":"XOF","label":"Franc CFA (FCFA)"},{"value":"EUR","label":"Euro (€)"},{"value":"USD","label":"Dollar ($)"}]	2026-06-14 03:05:31.372624	2026-06-14 03:05:31.372624
436222e5-4d9e-4026-b194-21fb15dcce20	regional.timezone	"Africa/Douala"	STRING	REGIONAL	\N	\N	Fuseau horaire	"Africa/Douala"	t	t	2	\N	\N	2026-06-14 03:05:31.376627	2026-06-14 03:05:31.376627
7e3cde20-a54d-4392-aab3-b22b121f47f1	regional.language	"fr"	STRING	REGIONAL	\N	\N	Langue par défaut	"fr"	t	t	3	\N	[{"value":"fr","label":"Français"},{"value":"en","label":"English"}]	2026-06-14 03:05:31.380651	2026-06-14 03:05:31.380651
a58cd5f2-db66-4ed0-a0a3-f227786e7dca	regional.date_format	"DD/MM/YYYY"	STRING	REGIONAL	\N	\N	Format de date	"DD/MM/YYYY"	t	t	4	\N	\N	2026-06-14 03:05:31.38485	2026-06-14 03:05:31.38485
d886ae69-3acf-4218-aa6e-082d8fd33a6b	utilisateurs.default_role	"ELEVE"	STRING	MODULE	utilisateurs	\N	Rôle par défaut à l'inscription	"ELEVE"	t	t	1	\N	\N	2026-06-14 03:05:31.389544	2026-06-14 03:05:31.389544
5e1011af-b21c-4405-939b-f45587f4b949	utilisateurs.allow_self_registration	false	BOOLEAN	MODULE	utilisateurs	\N	Autoriser l'auto-inscription	false	t	t	2	\N	\N	2026-06-14 03:05:31.393801	2026-06-14 03:05:31.393801
a97ba775-2c68-46aa-ac47-73a141694951	utilisateurs.require_email_verification	true	BOOLEAN	MODULE	utilisateurs	\N	Exiger la vérification email	true	t	t	3	\N	\N	2026-06-14 03:05:31.397196	2026-06-14 03:05:31.397196
e475deea-b4cf-4351-a201-259c2c94ccc3	system.backup_retention_days	30	NUMBER	SYSTEME	\N	\N	Jours de rétention des sauvegardes	30	f	t	1	\N	\N	2026-06-14 03:05:31.400507	2026-06-14 03:05:31.400507
3847d41b-849d-4ebb-b29e-438717daa352	system.log_level	"info"	STRING	SYSTEME	\N	\N	Niveau de log	"info"	t	t	2	\N	[{"value":"debug","label":"Debug"},{"value":"info","label":"Info"},{"value":"warn","label":"Warning"},{"value":"error","label":"Error"}]	2026-06-14 03:05:31.404254	2026-06-14 03:05:31.404254
6d600a5f-ec29-4888-a108-f35b5f906971	auth.actif	true	BOOLEAN	MODULE	auth	\N	Module Authentification actif	true	t	t	100	\N	\N	2026-06-14 03:05:31.408975	2026-06-14 03:05:31.408975
32c4a037-e3d2-4993-b3fc-c357dcb620c4	utilisateurs.actif	true	BOOLEAN	MODULE	utilisateurs	\N	Module Utilisateurs actif	true	t	t	101	\N	\N	2026-06-14 03:05:31.413308	2026-06-14 03:05:31.413308
e0fb9375-3fc7-41cc-80d2-b2ae8765d6b4	configuration.actif	true	BOOLEAN	MODULE	configuration	\N	Module Configuration actif	true	t	t	102	\N	\N	2026-06-14 03:05:31.41739	2026-06-14 03:05:31.41739
7bbcff0f-e3c4-4f31-8483-5053e5043f23	notifications.actif	true	BOOLEAN	MODULE	notifications	\N	Module Notifications actif	true	t	t	103	\N	\N	2026-06-14 03:05:31.421498	2026-06-14 03:05:31.421498
860e41e5-0db1-4a46-9501-94e6e93c80d7	messagerie.actif	true	BOOLEAN	MODULE	messagerie	\N	Module Messagerie actif	true	t	t	104	\N	\N	2026-06-14 03:05:31.427263	2026-06-14 03:05:31.427263
0e21bfbb-dc79-45ba-aea6-c5ae2035734f	requetes.actif	true	BOOLEAN	MODULE	requetes	\N	Module Requêtes actif	true	t	t	105	\N	\N	2026-06-14 03:05:31.432784	2026-06-14 03:05:31.432784
ef058805-f0a4-4485-b9ed-b5c132358e4c	sondages.actif	true	BOOLEAN	MODULE	sondages	\N	Module Sondages actif	true	t	t	106	\N	\N	2026-06-14 03:05:31.437027	2026-06-14 03:05:31.437027
105249ba-50c0-4745-a2b9-ccbdc3f393a9	annonces.actif	true	BOOLEAN	MODULE	annonces	\N	Module Annonces actif	true	t	t	107	\N	\N	2026-06-14 03:05:31.440608	2026-06-14 03:05:31.440608
bcddb37f-8d2c-4710-9c1a-66be9ac19ecb	notes.actif	true	BOOLEAN	MODULE	notes	\N	Module Notes actif	true	t	t	108	\N	\N	2026-06-14 03:05:31.444996	2026-06-14 03:05:31.444996
db880d8f-44c9-4230-a984-6a48353f94e5	bulletins.actif	false	BOOLEAN	MODULE	bulletins	\N	Module Bulletins actif	false	t	t	109	\N	\N	2026-06-14 03:05:31.449764	2026-06-14 03:05:31.449764
833648b5-acbb-40ed-b768-2a409d92320e	eleves.actif	true	BOOLEAN	MODULE	eleves	\N	Module Élèves actif	true	t	t	110	\N	\N	2026-06-14 03:05:31.454173	2026-06-14 03:05:31.454173
386eb239-57a2-4ffe-babf-414cd77d76b1	orientation.actif	false	BOOLEAN	MODULE	orientation	\N	Module Orientation actif	false	t	t	111	\N	\N	2026-06-14 03:05:31.458355	2026-06-14 03:05:31.458355
8e69b7bd-f762-4d4b-892f-77b7cf0edbd7	responsables-eleves.actif	true	BOOLEAN	MODULE	responsables-eleves	\N	Module Responsables Élèves actif	true	t	t	112	\N	\N	2026-06-14 03:05:31.461861	2026-06-14 03:05:31.461861
66d21110-bb94-4c1b-ad8c-42d830942e24	cantine.actif	true	BOOLEAN	MODULE	cantine	\N	Module Cantine actif	true	t	t	114	\N	\N	2026-06-14 03:05:31.469534	2026-06-14 03:05:31.469534
bab2061b-7848-43a6-92a0-452947d91c36	transport.actif	true	BOOLEAN	MODULE	transport	\N	Module Transport actif	true	t	t	115	\N	\N	2026-06-14 03:05:31.474057	2026-06-14 03:05:31.474057
d6501f0f-59a3-4b7e-b2d2-26870f0ff933	parking.actif	false	BOOLEAN	MODULE	parking	\N	Module Parking actif	false	t	t	116	\N	\N	2026-06-14 03:05:31.477883	2026-06-14 03:05:31.477883
3dd4cd3f-2942-4298-bb2c-da98c7e9d7e3	materiel.actif	false	BOOLEAN	MODULE	materiel	\N	Module Matériel actif	false	t	t	117	\N	\N	2026-06-14 03:05:31.481542	2026-06-14 03:05:31.481542
36d43c09-48f4-4115-a8c7-5911e1f9d210	finances.actif	false	BOOLEAN	MODULE	finances	\N	Module Finances actif	false	t	t	118	\N	\N	2026-06-14 03:05:31.487175	2026-06-14 03:05:31.487175
f0d4f924-ffc2-4acb-8b00-c97fde4527fc	clubs.actif	false	BOOLEAN	MODULE	clubs	\N	Module Clubs actif	false	t	t	119	\N	\N	2026-06-14 03:05:31.492389	2026-06-14 03:05:31.492389
c5200325-73f4-4a43-ab11-9311b8508d6b	gamification.actif	false	BOOLEAN	MODULE	gamification	\N	Module Gamification actif	false	t	t	120	\N	\N	2026-06-14 03:05:31.497934	2026-06-14 03:05:31.497934
204dc12f-45c5-4244-8500-fe3ff512c4ec	cartes.actif	true	BOOLEAN	MODULE	cartes	\N	Module Cartes actif	true	t	t	121	\N	\N	2026-06-14 03:05:31.501526	2026-06-14 03:05:31.501526
08a91157-f311-429f-9644-98d2cbf7aae9	documents.actif	false	BOOLEAN	MODULE	documents	\N	Module Documents actif	false	t	t	122	\N	\N	2026-06-14 03:05:31.507278	2026-06-14 03:05:31.507278
f2e5869a-fcd9-44b5-a463-61336ed1417c	impressions.actif	false	BOOLEAN	MODULE	impressions	\N	Module Impressions actif	false	t	t	123	\N	\N	2026-06-14 03:05:31.512618	2026-06-14 03:05:31.512618
91ac3955-d8b2-4b9d-878c-7a7ad3c5ee8c	suivi-eleves.actif	true	BOOLEAN	MODULE	suivi-eleves	\N	Module Suivi Élèves actif	true	t	t	124	\N	\N	2026-06-14 03:05:31.518744	2026-06-14 03:05:31.518744
dfa45d9f-6d8a-4e9e-966d-7172b018065a	suivi-personnel.actif	true	BOOLEAN	MODULE	suivi-personnel	\N	Module Suivi Personnel actif	true	t	t	125	\N	\N	2026-06-14 03:05:31.531622	2026-06-14 03:05:31.531622
f5eaf43a-0cff-4094-89c0-c6bed350d77a	sante.actif	false	BOOLEAN	MODULE	sante	\N	Module Santé actif	false	t	t	126	\N	\N	2026-06-14 03:05:31.536759	2026-06-14 03:05:31.536759
e8d3e768-12a6-4917-89ab-a2d65476b1a2	scoring.actif	false	BOOLEAN	MODULE	scoring	\N	Module Scoring actif	false	t	t	127	\N	\N	2026-06-14 03:05:31.540135	2026-06-14 03:05:31.540135
4ce7e867-6587-4c3b-b4e4-7b394b11f632	monitoring.actif	false	BOOLEAN	MODULE	monitoring	\N	Module Monitoring actif	false	t	t	128	\N	\N	2026-06-14 03:05:31.543557	2026-06-14 03:05:31.543557
eb501c86-5d0c-4d68-8878-fdafd6fdd779	peripheriques.actif	false	BOOLEAN	MODULE	peripheriques	\N	Module Périphériques actif	false	t	t	129	\N	\N	2026-06-14 03:05:31.548335	2026-06-14 03:05:31.548335
15a006e6-c9e0-46b4-9e07-82cd6721518a	organisation.actif	true	BOOLEAN	MODULE	organisation	\N	Module Organisation actif	true	t	t	130	\N	\N	2026-06-14 03:05:31.552377	2026-06-14 03:05:31.552377
4e15f386-7595-422e-b1da-9fd0151cae64	recrutement.actif	false	BOOLEAN	MODULE	recrutement	\N	Module Recrutement actif	false	t	t	131	\N	\N	2026-06-14 03:05:31.5566	2026-06-14 03:05:31.5566
07e216e8-abff-48ec-9bd8-abae3bd0c138	dashboard.actif	true	BOOLEAN	MODULE	dashboard	\N	Module Dashboard actif	true	t	t	132	\N	\N	2026-06-14 03:05:31.560563	2026-06-14 03:05:31.560563
4d24ddad-7c99-4933-be8d-36cb63321d3c	system.maintenance_mode	false	BOOLEAN	SYSTEME	\N	\N	Mode maintenance	false	t	t	3	\N	\N	2026-06-14 03:05:31.56466	2026-06-14 03:05:31.56466
\.


--
-- Data for Name: participants_conversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.participants_conversation (id, "conversationId", "utilisateurId", "estAdmin", muet, epingle, "archivePerso", "derniereLecture", "dernierMessageLuId", "joinedAt") FROM stdin;
\.


--
-- Data for Name: periodes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.periodes (id, nom, "typeId", "anneeScolaireId", "dateDebut", "dateFin", ordre, poids, statut, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt") FROM stdin;
6a38a523-111d-406b-8fc3-ba16e12a0f17	etablissements:list	Lister tous les établissements	\N	etablissements	list	t	2026-06-14 03:05:31.907461	2026-06-14 03:05:31.907461
9969d77d-c725-46bb-8000-6310245e51ec	etablissements:create	Créer un établissement	\N	etablissements	create	t	2026-06-14 03:05:31.911801	2026-06-14 03:05:31.911801
7d58634b-89c0-4f18-8600-f70b67c13812	etablissements:desactiver	Désactiver un établissement	\N	etablissements	desactiver	t	2026-06-14 03:05:31.917202	2026-06-14 03:05:31.917202
5c62b59b-4042-4edf-8a7d-60f1bef54b4f	etablissements:activer	Activer un établissement	\N	etablissements	activer	t	2026-06-14 03:05:31.921278	2026-06-14 03:05:31.921278
e064529e-9c6f-443a-b270-cef1dbb64fcf	etablissements:config:view	Voir la configuration	\N	etablissements	config:view	t	2026-06-14 03:05:31.925308	2026-06-14 03:05:31.925308
47940bfe-7f6f-46ff-b95b-5cf66b357e5e	etablissements:config:edit	Modifier la configuration	\N	etablissements	config:edit	t	2026-06-14 03:05:31.929097	2026-06-14 03:05:31.929097
471f24ca-2351-4584-b37c-468165c75887	permissions:view	Voir les permissions	\N	permissions	view	t	2026-06-14 03:05:31.933654	2026-06-14 03:05:31.933654
a9c2c530-00cd-4736-a6ea-2694470b05c0	permissions:create	Créer une permission	\N	permissions	create	t	2026-06-14 03:05:31.939184	2026-06-14 03:05:31.939184
0fabf802-9483-447e-848b-824a2921de1c	permissions:edit	Modifier une permission	\N	permissions	edit	t	2026-06-14 03:05:31.943047	2026-06-14 03:05:31.943047
06ec2606-fa89-4993-81ce-dbfba83ff1f0	permissions:delete	Supprimer une permission	\N	permissions	delete	t	2026-06-14 03:05:31.946282	2026-06-14 03:05:31.946282
7e99f450-be25-4846-a03d-05f9311e17ed	configuration:seed	Exécuter les seeds	\N	configuration	seed	t	2026-06-14 03:05:31.949514	2026-06-14 03:05:31.949514
51b960d6-13f8-4e69-86cf-1f61b97ed763	configuration:licence:activer	Activer une licence	\N	configuration	licence:activer	t	2026-06-14 03:05:31.953985	2026-06-14 03:05:31.953985
f63ee569-2e7c-4d63-bd93-78bd86843305	monitoring:maintenance:toggle	Activer/désactiver maintenance	\N	monitoring	maintenance:toggle	t	2026-06-14 03:05:31.958527	2026-06-14 03:05:31.958527
e51014e0-b7a2-4720-b93e-f619e60188e0	monitoring:metrics:view	Voir les métriques	\N	monitoring	metrics:view	t	2026-06-14 03:05:31.962307	2026-06-14 03:05:31.962307
406d8863-0de3-4a44-823b-65427c4ca6d6	monitoring:stats:view	Voir les statistiques	\N	monitoring	stats:view	t	2026-06-14 03:05:31.965609	2026-06-14 03:05:31.965609
5f8266a8-c3d2-4cc6-b254-6de01729caf0	monitoring:health:view	Voir l'état de santé	\N	monitoring	health:view	t	2026-06-14 03:05:31.969018	2026-06-14 03:05:31.969018
3a9e43ea-dabe-400b-96a8-8a7c5474369d	utilisateurs:manage	Gestion avancée des utilisateurs	\N	utilisateurs	manage	t	2026-06-14 03:05:31.973577	2026-06-14 03:05:31.973577
d23d1147-1a5f-4110-ac99-cc9c7aa71bcd	utilisateurs:import	Importer des utilisateurs	\N	utilisateurs	import	t	2026-06-14 03:05:31.979084	2026-06-14 03:05:31.979084
63a86b96-da1c-4153-842e-a12f62cadc2e	utilisateurs:export	Exporter les utilisateurs	\N	utilisateurs	export	t	2026-06-14 03:05:31.983643	2026-06-14 03:05:31.983643
e34859da-4a33-4d94-9e36-b281728720f5	utilisateurs:reset-password	Réinitialiser mot de passe	\N	utilisateurs	reset-password	t	2026-06-14 03:05:31.987736	2026-06-14 03:05:31.987736
b7035ff6-b391-4531-87d6-dea2be285dc2	utilisateurs:profil:update	Mettre à jour le profil	\N	utilisateurs	profil:update	t	2026-06-14 03:05:31.991937	2026-06-14 03:05:31.991937
3f008e8f-1621-4081-8281-d5bcec928031	utilisateurs:statut:change	Changer le statut	\N	utilisateurs	statut:change	t	2026-06-14 03:05:31.997366	2026-06-14 03:05:31.997366
c234a053-2b3e-4dff-afb9-adb5b2f060a8	utilisateurs:etablissements:manage	Gérer les établissements	\N	utilisateurs	etablissements:manage	t	2026-06-14 03:05:32.001826	2026-06-14 03:05:32.001826
3c94930e-75e7-4563-af3f-de12d7f8c05c	auth:sessions:manage	Gérer les sessions	\N	auth	sessions:manage	t	2026-06-14 03:05:32.005599	2026-06-14 03:05:32.005599
4d914621-52e5-4469-92d9-2c3fa251dfdf	annees:cloturer	Clôturer une année	\N	annees	cloturer	t	2026-06-14 03:05:32.008473	2026-06-14 03:05:32.008473
00a29d57-ec65-4976-90a2-4aa11cb33d1f	annees:dupliquer	Dupliquer une année	\N	annees	dupliquer	t	2026-06-14 03:05:32.011846	2026-06-14 03:05:32.011846
635999fc-7e32-44b1-925a-3f087df671b4	eleves:radiation	Radier un élève	\N	eleves	radiation	t	2026-06-14 03:05:32.016435	2026-06-14 03:05:32.016435
c179e317-1fee-4e43-9405-700d4f494722	eleves:reinscription	Réinscrire un élève	\N	eleves	reinscription	t	2026-06-14 03:05:32.021096	2026-06-14 03:05:32.021096
a2b48da4-112b-49ef-8749-67396833e065	eleves:documents:generate	Générer des documents	\N	eleves	documents:generate	t	2026-06-14 03:05:32.024614	2026-06-14 03:05:32.024614
fadaee92-2617-44c0-88ce-af35c1b82f0c	eleves:historique:view	Voir l'historique	\N	eleves	historique:view	t	2026-06-14 03:05:32.028201	2026-06-14 03:05:32.028201
986d7a7c-e776-4184-b1bf-330b5a464bc3	bulletins:edit	Modifier un bulletin	\N	bulletins	edit	t	2026-06-14 03:05:32.032377	2026-06-14 03:05:32.032377
e5716b20-c81f-4b10-b893-3f1f75443ab6	bulletins:publier	Publier un bulletin	\N	bulletins	publier	t	2026-06-14 03:05:32.037723	2026-06-14 03:05:32.037723
11b3df62-bc67-485e-8e1b-54ec0e79170f	bulletins:export	Exporter les bulletins	\N	bulletins	export	t	2026-06-14 03:05:32.042019	2026-06-14 03:05:32.042019
75c336e4-87f6-42d0-aae1-a4334fdd0dff	cantine:menus:create	Créer un menu	\N	cantine	menus:create	t	2026-06-14 03:05:32.045199	2026-06-14 03:05:32.045199
f947c8db-db72-4002-b7af-949c3180b802	cantine:menus:edit	Modifier un menu	\N	cantine	menus:edit	t	2026-06-14 03:05:32.048191	2026-06-14 03:05:32.048191
af94a842-c7fc-4b36-ab7b-25d0aa51e480	cantine:menus:delete	Supprimer un menu	\N	cantine	menus:delete	t	2026-06-14 03:05:32.0517	2026-06-14 03:05:32.0517
5d4f7e63-6d25-4441-baba-2f37b09a4dcd	cantine:inscriptions:create	Inscrire à la cantine	\N	cantine	inscriptions:create	t	2026-06-14 03:05:32.056938	2026-06-14 03:05:32.056938
6999cefc-6f94-4f82-9323-9b9692cfe23f	cantine:inscriptions:view	Voir les inscriptions	\N	cantine	inscriptions:view	t	2026-06-14 03:05:32.061993	2026-06-14 03:05:32.061993
fcb2302d-3dc4-48e0-8a8c-22994b85e528	cantine:solde:recharger	Recharger le solde	\N	cantine	solde:recharger	t	2026-06-14 03:05:32.06569	2026-06-14 03:05:32.06569
27b89e6e-2496-4645-9adc-2976d70e2a81	cantine:consommations:enregistrer	Enregistrer une consommation	\N	cantine	consommations:enregistrer	t	2026-06-14 03:05:32.069025	2026-06-14 03:05:32.069025
7005b482-dc6b-4592-a340-b071f24c6927	cantine:consommations:view	Voir les consommations	\N	cantine	consommations:view	t	2026-06-14 03:05:32.072562	2026-06-14 03:05:32.072562
5d04c5e0-958f-40a7-b156-23507835745a	cantine:statistiques:view	Voir les statistiques cantine	\N	cantine	statistiques:view	t	2026-06-14 03:05:32.076516	2026-06-14 03:05:32.076516
4c0c370d-b3bd-4734-8f80-94721ade1f6d	cartes:create	Créer une carte	\N	cartes	create	t	2026-06-14 03:05:32.080522	2026-06-14 03:05:32.080522
743ad1e2-048c-4e8a-a2c2-b0bab8b7dfc1	cartes:edit	Modifier une carte	\N	cartes	edit	t	2026-06-14 03:05:32.083957	2026-06-14 03:05:32.083957
0984fd9c-cc82-46c3-9440-d203ce7b91fe	cartes:desactiver	Désactiver une carte	\N	cartes	desactiver	t	2026-06-14 03:05:32.087413	2026-06-14 03:05:32.087413
c01318b6-304a-41d1-a376-d40ac746c4fb	cartes:perte:signaler	Signaler une perte	\N	cartes	perte:signaler	t	2026-06-14 03:05:32.090534	2026-06-14 03:05:32.090534
b105cda3-ccdc-4129-a876-d8b2863c103f	cartes:import	Importer des cartes	\N	cartes	import	t	2026-06-14 03:05:32.09522	2026-06-14 03:05:32.09522
3be25b28-914e-4abd-9a3b-eaa25ee3b6c3	classes:affecter	Affecter un élève	\N	classes	affecter	t	2026-06-14 03:05:32.100302	2026-06-14 03:05:32.100302
02db5dbc-3743-4e27-ac65-76778236a4e0	classes:desaffecter	Désaffecter un élève	\N	classes	desaffecter	t	2026-06-14 03:05:32.103877	2026-06-14 03:05:32.103877
89654873-7ba9-40eb-9efb-ce6cb073f262	classes:effectifs:view	Voir les effectifs	\N	classes	effectifs:view	t	2026-06-14 03:05:32.108284	2026-06-14 03:05:32.108284
52e4562c-6ed7-4245-9487-23a8b19f2bb4	classes:export	Exporter les classes	\N	classes	export	t	2026-06-14 03:05:32.111582	2026-06-14 03:05:32.111582
b7628cc9-8589-43ee-8b95-2b947e8f9702	clubs:create	Créer un club	\N	clubs	create	t	2026-06-14 03:05:32.116377	2026-06-14 03:05:32.116377
456b26a9-51fd-4210-be22-f4c2dd17c131	clubs:edit	Modifier un club	\N	clubs	edit	t	2026-06-14 03:05:32.121323	2026-06-14 03:05:32.121323
91cbb291-a6a3-4e64-8954-713ff9221d8c	clubs:delete	Supprimer un club	\N	clubs	delete	t	2026-06-14 03:05:32.1251	2026-06-14 03:05:32.1251
287d635f-a266-4b59-ac8c-d45d54435684	clubs:inscriptions:manage	Gérer les inscriptions	\N	clubs	inscriptions:manage	t	2026-06-14 03:05:32.128494	2026-06-14 03:05:32.128494
84fcc7e9-65a7-4f9c-86fc-8583b8fbddf1	clubs:evenements:create	Créer un événement	\N	clubs	evenements:create	t	2026-06-14 03:05:32.132681	2026-06-14 03:05:32.132681
ca3c6233-5a58-4e96-93c9-4a2d17164ff3	clubs:evenements:edit	Modifier un événement	\N	clubs	evenements:edit	t	2026-06-14 03:05:32.138237	2026-06-14 03:05:32.138237
1d20b4e2-b48b-4d16-a8ad-0121a66a8623	clubs:evenements:delete	Supprimer un événement	\N	clubs	evenements:delete	t	2026-06-14 03:05:32.142733	2026-06-14 03:05:32.142733
3210f785-5360-4def-87ad-895196191311	clubs:evenements:view	Voir les événements	\N	clubs	evenements:view	t	2026-06-14 03:05:32.146509	2026-06-14 03:05:32.146509
19f3e749-9e70-44d2-a98c-ef553cc66bd8	gamification:badges:create	Créer un badge	\N	gamification	badges:create	t	2026-06-14 03:05:32.150097	2026-06-14 03:05:32.150097
5e94cbd0-12e1-4976-bb89-aa741494d92c	gamification:badges:edit	Modifier un badge	\N	gamification	badges:edit	t	2026-06-14 03:05:32.155067	2026-06-14 03:05:32.155067
e3780b09-2c40-44fb-966f-33d2d3fb3074	gamification:badges:delete	Supprimer un badge	\N	gamification	badges:delete	t	2026-06-14 03:05:32.159941	2026-06-14 03:05:32.159941
4478cdca-b602-4724-8a77-e268e775b53e	gamification:points:attribuer	Attribuer des points	\N	gamification	points:attribuer	t	2026-06-14 03:05:32.163882	2026-06-14 03:05:32.163882
827e2974-93b0-4190-9342-e8f706cdf171	gamification:badges:attribuer	Attribuer un badge	\N	gamification	badges:attribuer	t	2026-06-14 03:05:32.167603	2026-06-14 03:05:32.167603
1cbe78c2-a8e2-4c1b-87e8-bfcf7318bedb	gamification:classement:view	Voir le classement	\N	gamification	classement:view	t	2026-06-14 03:05:32.171701	2026-06-14 03:05:32.171701
98c34ccb-e2c7-4cdd-9891-a4361f385e4a	gamification:historique:view	Voir l'historique	\N	gamification	historique:view	t	2026-06-14 03:05:32.176618	2026-06-14 03:05:32.176618
91127a5c-dc31-4bd1-98ae-a4c54bd9a3c8	impressions:modeles:view	Voir les modèles	\N	impressions	modeles:view	t	2026-06-14 03:05:32.181692	2026-06-14 03:05:32.181692
a1030013-4934-48b6-bf62-53f5f95daeca	impressions:modeles:create	Créer un modèle	\N	impressions	modeles:create	t	2026-06-14 03:05:32.18556	2026-06-14 03:05:32.18556
2dc1426d-ee87-455c-a359-b27220bb463b	impressions:modeles:edit	Modifier un modèle	\N	impressions	modeles:edit	t	2026-06-14 03:05:32.189456	2026-06-14 03:05:32.189456
5fcf978b-92fe-4495-92f3-71db501d32d9	impressions:modeles:delete	Supprimer un modèle	\N	impressions	modeles:delete	t	2026-06-14 03:05:32.193801	2026-06-14 03:05:32.193801
c324bafe-36da-4e73-b227-2a84dd6763c9	impressions:file:view	Voir les fichiers	\N	impressions	file:view	t	2026-06-14 03:05:32.19914	2026-06-14 03:05:32.19914
e6e7b651-6379-4916-974d-fb410c3fac77	impressions:file:create	Créer un fichier	\N	impressions	file:create	t	2026-06-14 03:05:32.203647	2026-06-14 03:05:32.203647
fe426b0d-609d-40f5-98c0-477964d925fd	impressions:file:generer	Générer un fichier	\N	impressions	file:generer	t	2026-06-14 03:05:32.207374	2026-06-14 03:05:32.207374
338bfce5-887d-43b0-8d0b-c97ab7361292	impressions:file:annuler	Annuler une impression	\N	impressions	file:annuler	t	2026-06-14 03:05:32.211033	2026-06-14 03:05:32.211033
14825cf0-56a1-4e53-857d-451483745145	impressions:traiter	Traiter en batch	\N	impressions	traiter	t	2026-06-14 03:05:32.215757	2026-06-14 03:05:32.215757
a76ca499-ec0d-40fd-aec9-1d55d0fcbfda	materiel:create	Créer un matériel	\N	materiel	create	t	2026-06-14 03:05:32.220754	2026-06-14 03:05:32.220754
df2fb3c7-5cb1-4077-979f-34f2b00d64b9	materiel:edit	Modifier un matériel	\N	materiel	edit	t	2026-06-14 03:05:32.224376	2026-06-14 03:05:32.224376
dfb10ff9-ac1b-474c-9a43-d8598c5f3ba4	materiel:delete	Supprimer un matériel	\N	materiel	delete	t	2026-06-14 03:05:32.227888	2026-06-14 03:05:32.227888
7d69d441-be0f-4c5a-bc4f-8a6c089d0260	materiel:prets:view	Voir les prêts	\N	materiel	prets:view	t	2026-06-14 03:05:32.231683	2026-06-14 03:05:32.231683
dae3e013-c6cc-4f50-9fbb-71e043cc1b3f	materiel:prets:create	Créer un prêt	\N	materiel	prets:create	t	2026-06-14 03:05:32.236308	2026-06-14 03:05:32.236308
a9aa394f-9d3e-466d-8f43-e3c800456836	materiel:prets:retour	Enregistrer un retour	\N	materiel	prets:retour	t	2026-06-14 03:05:32.240739	2026-06-14 03:05:32.240739
6040a507-6889-4356-8958-2a9d168b094d	materiel:inventaire:manage	Gérer l'inventaire	\N	materiel	inventaire:manage	t	2026-06-14 03:05:32.24443	2026-06-14 03:05:32.24443
aee67a82-6934-4ecc-aa6a-039460732519	matieres:groupes:view	Voir les groupes	\N	matieres	groupes:view	t	2026-06-14 03:05:32.247513	2026-06-14 03:05:32.247513
9ebe15fc-98f8-46cd-83a1-6987019332b8	matieres:groupes:create	Créer un groupe	\N	matieres	groupes:create	t	2026-06-14 03:05:32.250791	2026-06-14 03:05:32.250791
a178e3db-09b0-4eb3-b7e2-8e0acb4eba95	matieres:programme:view	Voir le programme	\N	matieres	programme:view	t	2026-06-14 03:05:32.255376	2026-06-14 03:05:32.255376
af88ed12-c969-4368-b5ed-04ee9bc3c7c0	matieres:programme:create	Créer un programme	\N	matieres	programme:create	t	2026-06-14 03:05:32.260061	2026-06-14 03:05:32.260061
f98dafb2-e23f-438c-acc7-8f287c636fa9	matieres:programme:edit	Modifier un programme	\N	matieres	programme:edit	t	2026-06-14 03:05:32.264068	2026-06-14 03:05:32.264068
824abaec-eb96-44ba-a75f-0cd635364ee1	matieres:affectations:create	Créer une affectation	\N	matieres	affectations:create	t	2026-06-14 03:05:32.267439	2026-06-14 03:05:32.267439
e3c12724-f36b-4500-8b19-f2865f6ef2f3	messagerie:conversations:create	Créer une conversation	\N	messagerie	conversations:create	t	2026-06-14 03:05:32.27138	2026-06-14 03:05:32.27138
41604b35-7791-488c-9bef-6e9d06340a3a	messagerie:broadcast	Envoyer un broadcast	\N	messagerie	broadcast	t	2026-06-14 03:05:32.276466	2026-06-14 03:05:32.276466
c2cc3267-bf5c-4d4c-ae17-f57384c91eee	messagerie:messages:read	Marquer comme lu	\N	messagerie	messages:read	t	2026-06-14 03:05:32.281211	2026-06-14 03:05:32.281211
c4ddbff4-ec44-4577-9ccb-daea3386a1b9	notes:bulk:create	Créer des notes en masse	\N	notes	bulk:create	t	2026-06-14 03:05:32.285027	2026-06-14 03:05:32.285027
ed04e05e-8e12-438e-b408-d40d5387224b	notes:import	Importer des notes	\N	notes	import	t	2026-06-14 03:05:32.288685	2026-06-14 03:05:32.288685
4b9f486f-f658-474d-ad00-24021b370f26	notes:export	Exporter les notes	\N	notes	export	t	2026-06-14 03:05:32.292913	2026-06-14 03:05:32.292913
f4cf7336-f959-4bb7-b1a6-a3e957a258ad	notes:statistiques:view	Voir les statistiques	\N	notes	statistiques:view	t	2026-06-14 03:05:32.297912	2026-06-14 03:05:32.297912
c6533ff3-3589-47df-8b91-cf69ac233d9a	notifications:create	Créer une notification	\N	notifications	create	t	2026-06-14 03:05:32.302151	2026-06-14 03:05:32.302151
eaed9ec5-6635-43f1-b84c-1a58ab001bec	notifications:bulk:create	Créer en masse	\N	notifications	bulk:create	t	2026-06-14 03:05:32.305677	2026-06-14 03:05:32.305677
4a1a1be9-8d1d-404d-8b23-a66b6a2abd13	notifications:read	Marquer comme lue	\N	notifications	read	t	2026-06-14 03:05:32.309701	2026-06-14 03:05:32.309701
2bc5dea3-0443-405f-bd03-b02c76445fc3	notifications:read-all	Marquer tout comme lu	\N	notifications	read-all	t	2026-06-14 03:05:32.314172	2026-06-14 03:05:32.314172
10e27fae-38cb-4bb1-aea3-d8be0399dea8	notifications:delete	Supprimer une notification	\N	notifications	delete	t	2026-06-14 03:05:32.318527	2026-06-14 03:05:32.318527
3dcd4257-ea9c-421d-8623-d6e1302287ed	notifications:count	Voir le compteur	\N	notifications	count	t	2026-06-14 03:05:32.322819	2026-06-14 03:05:32.322819
0596b179-f03e-4494-834c-55a1a564170a	orientation:profils:view	Voir les profils	\N	orientation	profils:view	t	2026-06-14 03:05:32.326207	2026-06-14 03:05:32.326207
e7e92c15-5c85-48bd-ab0d-ec95c8025905	orientation:profils:create	Créer un profil	\N	orientation	profils:create	t	2026-06-14 03:05:32.329981	2026-06-14 03:05:32.329981
6b231f55-36d2-4c65-81c3-937ec8840484	orientation:profils:edit	Modifier un profil	\N	orientation	profils:edit	t	2026-06-14 03:05:32.335226	2026-06-14 03:05:32.335226
e7c363e6-8387-4802-a51c-63b7169abf4b	orientation:suggestions:view	Voir les suggestions	\N	orientation	suggestions:view	t	2026-06-14 03:05:32.339921	2026-06-14 03:05:32.339921
d3be48d9-5430-4ca4-9a1a-5f3298668f82	orientation:fiches:view	Voir les fiches	\N	orientation	fiches:view	t	2026-06-14 03:05:32.343409	2026-06-14 03:05:32.343409
2c613912-53d1-4aff-84af-f5f12f1ac81f	orientation:fiches:create	Créer une fiche	\N	orientation	fiches:create	t	2026-06-14 03:05:32.346664	2026-06-14 03:05:32.346664
0e29679b-4697-4838-aeab-a0da25e5cb2f	orientation:rdv:view	Voir les rendez-vous	\N	orientation	rdv:view	t	2026-06-14 03:05:32.350164	2026-06-14 03:05:32.350164
5def6cc8-dcae-4216-b549-3f7e00d89efb	orientation:rdv:create	Créer un rendez-vous	\N	orientation	rdv:create	t	2026-06-14 03:05:32.354018	2026-06-14 03:05:32.354018
61d883aa-a7dc-44c5-aacc-6888d521c0d5	orientation:rdv:edit	Modifier un rendez-vous	\N	orientation	rdv:edit	t	2026-06-14 03:05:32.358362	2026-06-14 03:05:32.358362
1c87ba01-6712-4537-913b-b6cb712f0447	orientation:rdv:annuler	Annuler un rendez-vous	\N	orientation	rdv:annuler	t	2026-06-14 03:05:32.362241	2026-06-14 03:05:32.362241
f16490c2-5694-48c7-a867-dbfa6cd87f7e	periodes:types:view	Voir les types	\N	periodes	types:view	t	2026-06-14 03:05:32.365384	2026-06-14 03:05:32.365384
3f9cebb9-b3ae-4241-a670-9aabcfe4771c	periodes:types:create	Créer un type	\N	periodes	types:create	t	2026-06-14 03:05:32.368787	2026-06-14 03:05:32.368787
e9a3b8c9-e203-4d4c-a7da-21321e793e31	personnel:view	Voir le personnel	\N	personnel	view	t	2026-06-14 03:05:32.372817	2026-06-14 03:05:32.372817
7b2423cd-bf7c-4831-9498-72ffbde8f013	personnel:create	Créer un membre	\N	personnel	create	t	2026-06-14 03:05:32.37726	2026-06-14 03:05:32.37726
9bdac62f-7c29-4fa0-ae8b-bfb064b14d15	personnel:edit	Modifier un membre	\N	personnel	edit	t	2026-06-14 03:05:32.381421	2026-06-14 03:05:32.381421
27fcbeb7-7c1a-42ab-84f1-93f374fe6b06	personnel:delete	Supprimer un membre	\N	personnel	delete	t	2026-06-14 03:05:32.384604	2026-06-14 03:05:32.384604
ff7f0cef-478c-4c19-83b6-6b90bbdffd8d	personnel:types:view	Voir les types	\N	personnel	types:view	t	2026-06-14 03:05:32.387731	2026-06-14 03:05:32.387731
500d006d-1ab4-45d0-96a1-7a3fe7b10dbd	personnel:types:create	Créer un type	\N	personnel	types:create	t	2026-06-14 03:05:32.391049	2026-06-14 03:05:32.391049
3207e98a-48cd-436b-bfde-317de4a87c7f	requetes:traiter	Traiter une requête	\N	requetes	traiter	t	2026-06-14 03:05:32.395219	2026-06-14 03:05:32.395219
8aa2682a-b80f-4fba-b882-a600c4aa86c7	requetes:annuler	Annuler une requête	\N	requetes	annuler	t	2026-06-14 03:05:32.399567	2026-06-14 03:05:32.399567
8db6dc46-5054-420b-ac00-deba6cb81ac7	scoring:points:attribuer	Attribuer des points	\N	scoring	points:attribuer	t	2026-06-14 03:05:32.402961	2026-06-14 03:05:32.402961
24e302ce-9430-4f0c-867b-1f1342764bcd	scoring:rangs:calculer	Calculer les rangs	\N	scoring	rangs:calculer	t	2026-06-14 03:05:32.406009	2026-06-14 03:05:32.406009
941246ab-1b73-4bb2-957e-54e8da001d37	scoring:classement:view	Voir le classement	\N	scoring	classement:view	t	2026-06-14 03:05:32.408953	2026-06-14 03:05:32.408953
69d20d05-509d-4122-945d-af77628c8dda	scoring:regles:view	Voir les règles	\N	scoring	regles:view	t	2026-06-14 03:05:32.412473	2026-06-14 03:05:32.412473
e4ae9603-f3e7-4379-b978-ff2a5e475dc3	scoring:regles:create	Créer une règle	\N	scoring	regles:create	t	2026-06-14 03:05:32.417008	2026-06-14 03:05:32.417008
0bc18610-ef4a-4a8d-909c-7efba603cadc	scoring:historique:view	Voir l'historique	\N	scoring	historique:view	t	2026-06-14 03:05:32.421597	2026-06-14 03:05:32.421597
ded57887-670b-4f10-8085-8984d2416777	scoring:recalculer	Recalculer les scores	\N	scoring	recalculer	t	2026-06-14 03:05:32.425058	2026-06-14 03:05:32.425058
c833cd4c-e93b-4ef6-bd65-c8a20af9cef1	transport:lignes:view	Voir les lignes	\N	transport	lignes:view	t	2026-06-14 03:05:32.428971	2026-06-14 03:05:32.428971
e8087e70-fbee-425d-bc43-ef330185c140	transport:lignes:create	Créer une ligne	\N	transport	lignes:create	t	2026-06-14 03:05:32.433499	2026-06-14 03:05:32.433499
91fc7858-09a7-426c-b3d4-4f4200d99204	transport:lignes:edit	Modifier une ligne	\N	transport	lignes:edit	t	2026-06-14 03:05:32.438355	2026-06-14 03:05:32.438355
e8716c87-656c-40bd-8269-9b86fe0ee185	transport:lignes:delete	Supprimer une ligne	\N	transport	lignes:delete	t	2026-06-14 03:05:32.442206	2026-06-14 03:05:32.442206
ae01562e-cb04-46a9-a821-cb349d243448	transport:inscriptions:create	Inscrire au transport	\N	transport	inscriptions:create	t	2026-06-14 03:05:32.445446	2026-06-14 03:05:32.445446
b114f108-e2d0-4322-9c8b-52684117e9c9	transport:inscriptions:view	Voir les inscriptions	\N	transport	inscriptions:view	t	2026-06-14 03:05:32.448625	2026-06-14 03:05:32.448625
75eac99a-2928-45ae-9f0b-050044c8a58e	transport:presences:enregistrer	Enregistrer une présence	\N	transport	presences:enregistrer	t	2026-06-14 03:05:32.452195	2026-06-14 03:05:32.452195
a319c24d-d196-4f9e-8007-6dd4b1f9f5eb	transport:presences:view	Voir les présences	\N	transport	presences:view	t	2026-06-14 03:05:32.456627	2026-06-14 03:05:32.456627
91636e6b-00c5-49b4-abf6-6764099c775e	users:view	Voir les utilisateurs	\N	users	view	t	2026-06-14 03:05:32.460682	2026-06-14 03:05:32.460682
a36f9f85-48f1-4227-9a1b-74bb8ae0b785	users:create	Créer les utilisateurs	\N	users	create	t	2026-06-14 03:05:32.46418	2026-06-14 03:05:32.46418
8a9338d1-b719-4923-82c4-7a27bdf91730	users:edit	Modifier les utilisateurs	\N	users	edit	t	2026-06-14 03:05:32.467304	2026-06-14 03:05:32.467304
3546065a-9fec-4150-9bca-6391c78f3a51	users:delete	Supprimer les utilisateurs	\N	users	delete	t	2026-06-14 03:05:32.470547	2026-06-14 03:05:32.470547
7de2c572-a4f2-440d-bee0-f245c1158026	roles:view	Voir les rôles	\N	roles	view	t	2026-06-14 03:05:32.474689	2026-06-14 03:05:32.474689
6d6bf91a-6c54-4cac-9a1e-b07185374754	roles:manage	Gérer les rôles	\N	roles	manage	t	2026-06-14 03:05:32.478282	2026-06-14 03:05:32.478282
c209b4ed-d9d5-45ca-89e5-2277fcc52f3e	notes:view	Voir les notes	\N	notes	view	t	2026-06-14 03:05:32.483632	2026-06-14 03:05:32.483632
0e4ce8e2-f5a7-44a4-91e2-c8157ff57e61	notes:create	Créer les notes	\N	notes	create	t	2026-06-14 03:05:32.486985	2026-06-14 03:05:32.486985
f1f00f22-645d-45db-ba6d-2950512b07e1	notes:edit	Modifier les notes	\N	notes	edit	t	2026-06-14 03:05:32.490294	2026-06-14 03:05:32.490294
f763674b-1d85-4496-b043-145082ce0e26	notes:delete	Supprimer les notes	\N	notes	delete	t	2026-06-14 03:05:32.494467	2026-06-14 03:05:32.494467
897b0471-cb96-49de-826c-b9b8c512a342	notes:validate	Valider les notes	\N	notes	validate	t	2026-06-14 03:05:32.498515	2026-06-14 03:05:32.498515
dd1597d0-6222-412b-82d3-b4395b00b4c9	bulletins:view	Voir les bulletins	\N	bulletins	view	t	2026-06-14 03:05:32.502334	2026-06-14 03:05:32.502334
3396ac25-2554-407b-9e72-a765be3778e7	bulletins:generate	Générer les bulletins	\N	bulletins	generate	t	2026-06-14 03:05:32.505228	2026-06-14 03:05:32.505228
d2aa621a-a65e-46c1-b910-c4fb4c84259c	bulletins:print	Imprimer les bulletins	\N	bulletins	print	t	2026-06-14 03:05:32.507994	2026-06-14 03:05:32.507994
7b0f0dbb-ceea-48f7-bdf5-113a2217b46a	eleves:view	Voir eleves	\N	eleves	view	t	2026-06-14 03:05:32.511335	2026-06-14 03:05:32.511335
81132ccb-4aa4-449b-8a23-5c634143aa9b	eleves:create	Créer eleves	\N	eleves	create	t	2026-06-14 03:05:32.515561	2026-06-14 03:05:32.515561
6ddfb745-3b51-40a6-a4ac-f2080b03e24d	eleves:edit	Modifier eleves	\N	eleves	edit	t	2026-06-14 03:05:32.519889	2026-06-14 03:05:32.519889
b45ea352-7845-4840-aa5c-d418a0ce07f9	eleves:delete	Supprimer eleves	\N	eleves	delete	t	2026-06-14 03:05:32.523934	2026-06-14 03:05:32.523934
7b586363-f258-4a87-b029-bc736799a8b1	eleves:import	import eleves	\N	eleves	import	t	2026-06-14 03:05:32.52742	2026-06-14 03:05:32.52742
f0b2b4b2-3e40-49ac-97fc-a37da39e92ce	eleves:export	export eleves	\N	eleves	export	t	2026-06-14 03:05:32.530988	2026-06-14 03:05:32.530988
77e37a07-5d49-4a2f-be8e-add64fc1bc7b	enseignants:view	Voir enseignants	\N	enseignants	view	t	2026-06-14 03:05:32.535451	2026-06-14 03:05:32.535451
1a3790b0-7ffb-4a51-97b5-280ce0356350	enseignants:create	Créer enseignants	\N	enseignants	create	t	2026-06-14 03:05:32.540076	2026-06-14 03:05:32.540076
ce63e7d1-7d47-4f15-85b2-e56c4011d9b7	enseignants:edit	Modifier enseignants	\N	enseignants	edit	t	2026-06-14 03:05:32.5444	2026-06-14 03:05:32.5444
04f8e4dc-aea8-4f61-ad4b-1b3d45f1a3d6	enseignants:delete	Supprimer enseignants	\N	enseignants	delete	t	2026-06-14 03:05:32.547935	2026-06-14 03:05:32.547935
f04a0038-2018-4630-ab78-7b07916005b5	enseignants:assign	assign enseignants	\N	enseignants	assign	t	2026-06-14 03:05:32.552339	2026-06-14 03:05:32.552339
bedd5e5b-4400-4986-ae3b-7ad3858f6f74	classes:view	Voir classes	\N	classes	view	t	2026-06-14 03:05:32.556577	2026-06-14 03:05:32.556577
52746f05-e3c0-4729-9b9a-999edbd7cf0f	classes:create	Créer classes	\N	classes	create	t	2026-06-14 03:05:32.560779	2026-06-14 03:05:32.560779
73deac03-ecdb-43a1-848c-d029f9368edd	classes:edit	Modifier classes	\N	classes	edit	t	2026-06-14 03:05:32.564969	2026-06-14 03:05:32.564969
c059adfc-f02b-4162-9dcf-2e78bb0e6563	classes:delete	Supprimer classes	\N	classes	delete	t	2026-06-14 03:05:32.568641	2026-06-14 03:05:32.568641
8a0eba4b-01b9-49ef-93bb-ac6b191c07a4	matieres:view	Voir matieres	\N	matieres	view	t	2026-06-14 03:05:32.572426	2026-06-14 03:05:32.572426
d8187574-fd69-4bf3-a625-50bddd25436c	matieres:create	Créer matieres	\N	matieres	create	t	2026-06-14 03:05:32.576472	2026-06-14 03:05:32.576472
0f8365f6-d8ed-498a-a870-ed260488b6cb	matieres:edit	Modifier matieres	\N	matieres	edit	t	2026-06-14 03:05:32.581623	2026-06-14 03:05:32.581623
3682c9da-cda6-4457-83d8-146463d667da	matieres:delete	Supprimer matieres	\N	matieres	delete	t	2026-06-14 03:05:32.58601	2026-06-14 03:05:32.58601
8ebaeff4-62b7-4f45-b5ac-4f3a17a3997e	matieres:assign	assign matieres	\N	matieres	assign	t	2026-06-14 03:05:32.592409	2026-06-14 03:05:32.592409
aa552cf9-c553-4e71-873a-f18d1c0ef1fd	annees:view	Voir annees	\N	annees	view	t	2026-06-14 03:05:32.597754	2026-06-14 03:05:32.597754
cb993d1a-83ef-4e37-875c-55ebc944430f	annees:create	Créer annees	\N	annees	create	t	2026-06-14 03:05:32.602749	2026-06-14 03:05:32.602749
6b270a19-b092-415e-8685-d393dc86f768	annees:edit	Modifier annees	\N	annees	edit	t	2026-06-14 03:05:32.606656	2026-06-14 03:05:32.606656
c90d596a-5065-4463-86b5-74b4f3ba70f8	annees:delete	Supprimer annees	\N	annees	delete	t	2026-06-14 03:05:32.610862	2026-06-14 03:05:32.610862
681a2d1c-f593-4ab3-ba9d-39b0430ce557	annees:activer	activer annees	\N	annees	activer	t	2026-06-14 03:05:32.617395	2026-06-14 03:05:32.617395
0d905c43-b93b-4f35-9f97-3578d51c1559	periodes:view	Voir periodes	\N	periodes	view	t	2026-06-14 03:05:32.623613	2026-06-14 03:05:32.623613
3fbc63b1-07b8-4ff4-916e-404bbc2639b6	periodes:create	Créer periodes	\N	periodes	create	t	2026-06-14 03:05:32.627736	2026-06-14 03:05:32.627736
d9a28da6-a08c-447f-919c-c4138dcc6a9b	periodes:edit	Modifier periodes	\N	periodes	edit	t	2026-06-14 03:05:32.63223	2026-06-14 03:05:32.63223
4a1529c4-7b4a-4b17-b724-98247b2fea37	periodes:delete	Supprimer periodes	\N	periodes	delete	t	2026-06-14 03:05:32.636918	2026-06-14 03:05:32.636918
1a85abec-a7ee-4857-b3be-7eff4f0296a8	periodes:cloturer	cloturer periodes	\N	periodes	cloturer	t	2026-06-14 03:05:32.641466	2026-06-14 03:05:32.641466
a8732045-7596-4d18-8301-462527505582	cycles:view	Voir cycles	\N	cycles	view	t	2026-06-14 03:05:32.645468	2026-06-14 03:05:32.645468
9ba01bed-5fa5-4879-9b55-24cd0afe4966	cycles:create	Créer cycles	\N	cycles	create	t	2026-06-14 03:05:32.64873	2026-06-14 03:05:32.64873
408e9272-2b58-49f6-b7da-8686278ba101	cycles:edit	Modifier cycles	\N	cycles	edit	t	2026-06-14 03:05:32.652913	2026-06-14 03:05:32.652913
a68149f0-e9e6-462e-8ec1-3a6b893b8333	cycles:delete	Supprimer cycles	\N	cycles	delete	t	2026-06-14 03:05:32.657023	2026-06-14 03:05:32.657023
04f0828a-2f0a-481f-9ada-112df99aa4c7	niveaux:view	Voir niveaux	\N	niveaux	view	t	2026-06-14 03:05:32.661244	2026-06-14 03:05:32.661244
63303fec-1423-48b9-ae66-8971bc9a7d9f	niveaux:create	Créer niveaux	\N	niveaux	create	t	2026-06-14 03:05:32.665315	2026-06-14 03:05:32.665315
ba46fdfb-cada-4245-8130-314997c3c95c	niveaux:edit	Modifier niveaux	\N	niveaux	edit	t	2026-06-14 03:05:32.668342	2026-06-14 03:05:32.668342
484bb4c6-bd4c-4e9d-8b99-ff43d59c5f97	niveaux:delete	Supprimer niveaux	\N	niveaux	delete	t	2026-06-14 03:05:32.67213	2026-06-14 03:05:32.67213
ccabc83a-7084-4d5d-b2fb-c7e65c0c3c25	cantine:view	Voir la cantine	\N	cantine	view	t	2026-06-14 03:05:32.677668	2026-06-14 03:05:32.677668
f627d602-9494-417d-a266-c11889f5e6e6	cantine:manage	Gérer la cantine	\N	cantine	manage	t	2026-06-14 03:05:32.682599	2026-06-14 03:05:32.682599
2b28e972-880e-4e36-898d-07c2b8c34ac7	transport:view	Voir le transport	\N	transport	view	t	2026-06-14 03:05:32.687058	2026-06-14 03:05:32.687058
509224ce-8b72-4a85-89b3-465e10492f4e	transport:manage	Gérer le transport	\N	transport	manage	t	2026-06-14 03:05:32.691431	2026-06-14 03:05:32.691431
48924f3d-2393-41ea-853d-b4e69bd57de5	parking:view	Voir parking	\N	parking	view	t	2026-06-14 03:05:32.696081	2026-06-14 03:05:32.696081
9cfd3e00-712b-4e13-b1e8-790b37026d83	parking:manage	Gérer parking	\N	parking	manage	t	2026-06-14 03:05:32.699897	2026-06-14 03:05:32.699897
a1a7e2c0-af52-490d-b0fd-a86be023c202	parking:places:view	places parking	\N	parking	places	t	2026-06-14 03:05:32.703974	2026-06-14 03:05:32.703974
5f3359bf-3477-4d7e-934f-8bc79c7786e1	parking:places:create	places parking	\N	parking	places	t	2026-06-14 03:05:32.70718	2026-06-14 03:05:32.70718
52d175a2-ed50-4e88-a905-74a303739d67	parking:places:edit	places parking	\N	parking	places	t	2026-06-14 03:05:32.710042	2026-06-14 03:05:32.710042
84a4116a-e388-4695-beb1-858dddcbe9b0	parking:places:delete	places parking	\N	parking	places	t	2026-06-14 03:05:32.714179	2026-06-14 03:05:32.714179
d59a4a41-08aa-4db2-8c0b-0f26e19b493f	parking:vehicules:view	vehicules parking	\N	parking	vehicules	t	2026-06-14 03:05:32.718129	2026-06-14 03:05:32.718129
6c1bf982-23a8-403d-bdc0-c89c976601b1	parking:vehicules:create	vehicules parking	\N	parking	vehicules	t	2026-06-14 03:05:32.721854	2026-06-14 03:05:32.721854
ee4e4e23-cd64-414d-bba0-6dd609f9c973	parking:vehicules:edit	vehicules parking	\N	parking	vehicules	t	2026-06-14 03:05:32.725524	2026-06-14 03:05:32.725524
a4eeabe2-6d29-406a-a4d6-9445c1faeb70	parking:vehicules:delete	vehicules parking	\N	parking	vehicules	t	2026-06-14 03:05:32.728724	2026-06-14 03:05:32.728724
5eef00bb-7222-406e-93f9-601900ec7c0c	parking:abonnements:view	abonnements parking	\N	parking	abonnements	t	2026-06-14 03:05:32.733392	2026-06-14 03:05:32.733392
72a7b751-b2b4-44bc-bfc5-ed4b101d17b4	parking:abonnements:create	abonnements parking	\N	parking	abonnements	t	2026-06-14 03:05:32.737695	2026-06-14 03:05:32.737695
dec434fb-79da-4c39-8375-49791900c354	parking:abonnements:edit	abonnements parking	\N	parking	abonnements	t	2026-06-14 03:05:32.740992	2026-06-14 03:05:32.740992
e63ac65f-4003-4f7f-bf1f-3957972db08f	parking:statistiques:view	statistiques parking	\N	parking	statistiques	t	2026-06-14 03:05:32.744491	2026-06-14 03:05:32.744491
a317995b-c64e-45c2-b8a4-a850dd06a6c2	materiel:view	Voir le matériel	\N	materiel	view	t	2026-06-14 03:05:32.74754	2026-06-14 03:05:32.74754
e9420a04-2b49-4954-966c-b91b67cafd26	materiel:manage	Gérer le matériel	\N	materiel	manage	t	2026-06-14 03:05:32.750928	2026-06-14 03:05:32.750928
d168a26f-a801-4c28-9297-9a26d6e62955	cartes:view	Voir les cartes	\N	cartes	view	t	2026-06-14 03:05:32.755101	2026-06-14 03:05:32.755101
7ef7c8b7-4d97-4f7b-ab30-1f5f69c20407	cartes:generate	Générer les cartes	\N	cartes	generate	t	2026-06-14 03:05:32.759297	2026-06-14 03:05:32.759297
115f9786-6c8c-49fa-8773-c9f33ddef885	cartes:print	Imprimer les cartes	\N	cartes	print	t	2026-06-14 03:05:32.763208	2026-06-14 03:05:32.763208
5d786481-3bb3-4612-999f-54501bc786d3	finances:view	Voir finances	\N	finances	view	t	2026-06-14 03:05:32.766525	2026-06-14 03:05:32.766525
36c1ebdb-411f-4f47-a797-ab5923fce21f	finances:manage	Gérer finances	\N	finances	manage	t	2026-06-14 03:05:32.770231	2026-06-14 03:05:32.770231
481089e5-2c8e-426f-bdce-4298062aafb7	finances:paiements:create	paiements finances	\N	finances	paiements	t	2026-06-14 03:05:32.775666	2026-06-14 03:05:32.775666
91bcdef4-44fd-4ac4-ac74-e90da8218463	finances:paiements:edit	paiements finances	\N	finances	paiements	t	2026-06-14 03:05:32.779789	2026-06-14 03:05:32.779789
e28851da-5ea1-439e-8ae6-331c21bac638	finances:paiements:delete	paiements finances	\N	finances	paiements	t	2026-06-14 03:05:32.783878	2026-06-14 03:05:32.783878
ee2e76c3-c6de-47c2-b88b-ad263d2dbd9a	finances:factures:create	factures finances	\N	finances	factures	t	2026-06-14 03:05:32.787285	2026-06-14 03:05:32.787285
ee27d42d-282b-4688-8dfe-9bea12d68128	finances:factures:edit	factures finances	\N	finances	factures	t	2026-06-14 03:05:32.791581	2026-06-14 03:05:32.791581
fd284da0-0296-4866-99b9-7e642b9b1b34	finances:statistiques:view	statistiques finances	\N	finances	statistiques	t	2026-06-14 03:05:32.798421	2026-06-14 03:05:32.798421
8ae07a3c-718e-4acb-95e3-4729cdee8b80	finances:export	export finances	\N	finances	export	t	2026-06-14 03:05:32.802378	2026-06-14 03:05:32.802378
64357bde-020a-49af-8ad3-9f8c139f3c07	clubs:view	Voir les clubs	\N	clubs	view	t	2026-06-14 03:05:32.807675	2026-06-14 03:05:32.807675
ee8d9bfa-a1fb-4bad-bb07-5b17fa08c1c1	clubs:manage	Gérer les clubs	\N	clubs	manage	t	2026-06-14 03:05:32.811878	2026-06-14 03:05:32.811878
0282cc71-2897-4181-b6a9-f555704771fc	gamification:view	Voir la gamification	\N	gamification	view	t	2026-06-14 03:05:32.816674	2026-06-14 03:05:32.816674
cb7c0be5-4b79-4343-a9a9-490c023a8b99	gamification:manage	Gérer la gamification	\N	gamification	manage	t	2026-06-14 03:05:32.81998	2026-06-14 03:05:32.81998
8f82cff6-a5bc-48b3-9c38-cd04424f47a9	programmes:chapitre:read	chapitre programmes	\N	programmes	chapitre	t	2026-06-14 03:05:32.824449	2026-06-14 03:05:32.824449
1095336e-87e8-4bae-9030-3ef31a912faa	programmes:chapitre:create	chapitre programmes	\N	programmes	chapitre	t	2026-06-14 03:05:32.828351	2026-06-14 03:05:32.828351
62d1e580-87c8-4809-a00d-ee56d6342b20	programmes:chapitre:edit	chapitre programmes	\N	programmes	chapitre	t	2026-06-14 03:05:32.834245	2026-06-14 03:05:32.834245
0e4a6cca-6bca-4584-bc54-c8c8c06c7680	programmes:chapitre:delete	chapitre programmes	\N	programmes	chapitre	t	2026-06-14 03:05:32.839584	2026-06-14 03:05:32.839584
3c369693-3dad-44e7-b7e6-3d40354e9c26	programmes:chapitre:validate	chapitre programmes	\N	programmes	chapitre	t	2026-06-14 03:05:32.84402	2026-06-14 03:05:32.84402
33b37a0d-4084-4b82-a8c9-9d62dafbb920	programmes:correlation:read	correlation programmes	\N	programmes	correlation	t	2026-06-14 03:05:32.84819	2026-06-14 03:05:32.84819
47de5569-d564-4921-b84d-429de1473f17	programmes:correlation:evaluate	correlation programmes	\N	programmes	correlation	t	2026-06-14 03:05:32.852769	2026-06-14 03:05:32.852769
19ed0257-02df-4af1-9122-4e6dba71ad01	programmes:dashboard:read	dashboard programmes	\N	programmes	dashboard	t	2026-06-14 03:05:32.857401	2026-06-14 03:05:32.857401
a79d87dd-cf4e-4871-8125-a5a5b9fac79e	orientation:view	Voir orientation	\N	orientation	view	t	2026-06-14 03:05:32.861382	2026-06-14 03:05:32.861382
7244ebb1-17e0-4951-aa16-c59867eb6d84	orientation:create	Créer orientation	\N	orientation	create	t	2026-06-14 03:05:32.865347	2026-06-14 03:05:32.865347
40147c5d-2280-4636-a152-bfb18bd3c281	orientation:edit	Modifier orientation	\N	orientation	edit	t	2026-06-14 03:05:32.869177	2026-06-14 03:05:32.869177
dbc4baea-b290-4a8d-bb2f-6427a6ed767d	orientation:valider	valider orientation	\N	orientation	valider	t	2026-06-14 03:05:32.87348	2026-06-14 03:05:32.87348
ed1fbc80-57a3-49bd-afd2-c433d37db60e	scoring:view	Voir scoring	\N	scoring	view	t	2026-06-14 03:05:32.877923	2026-06-14 03:05:32.877923
71b43bcd-68d6-4a87-b6ad-1a2258fc38b2	scoring:configurer	configurer scoring	\N	scoring	configurer	t	2026-06-14 03:05:32.881649	2026-06-14 03:05:32.881649
caa61bed-4640-490c-a912-63ce396e4b24	scoring:generer	generer scoring	\N	scoring	generer	t	2026-06-14 03:05:32.885699	2026-06-14 03:05:32.885699
e7c6b411-b93c-4855-b075-00396d9d355e	impressions:view	Voir impressions	\N	impressions	view	t	2026-06-14 03:05:32.890575	2026-06-14 03:05:32.890575
ba36e031-08c8-4ac4-9008-5e05ec3c8ddf	impressions:gerer	gerer impressions	\N	impressions	gerer	t	2026-06-14 03:05:32.895075	2026-06-14 03:05:32.895075
3364be9d-4668-40ba-8db0-ee2f4a98d611	documents:view	Voir les documents	\N	documents	view	t	2026-06-14 03:05:32.899079	2026-06-14 03:05:32.899079
ec55463c-2f8e-46b1-84ce-3abf434532c6	documents:create	Créer les documents	\N	documents	create	t	2026-06-14 03:05:32.902087	2026-06-14 03:05:32.902087
51b8dcf5-2df4-48ff-bd43-4773817a4773	documents:print	Imprimer les documents	\N	documents	print	t	2026-06-14 03:05:32.905894	2026-06-14 03:05:32.905894
0774095f-c55e-4be1-827e-99ce5147620a	messages:send	Envoyer les messages	\N	messages	send	t	2026-06-14 03:05:32.909393	2026-06-14 03:05:32.909393
ad350804-0a5c-4c3c-91ca-88d8228b2575	messages:broadcast	Diffuser les messages	\N	messages	broadcast	t	2026-06-14 03:05:32.913671	2026-06-14 03:05:32.913671
0ffb61f4-0e43-409a-a125-c78e404171f3	messagerie:view	Voir messagerie	\N	messagerie	view	t	2026-06-14 03:05:32.918321	2026-06-14 03:05:32.918321
5c63faa1-db8f-4974-af86-562d450ba73f	messagerie:envoyer	envoyer messagerie	\N	messagerie	envoyer	t	2026-06-14 03:05:32.922241	2026-06-14 03:05:32.922241
8ec79b65-14af-4925-a6f0-3919cfc9fa17	messagerie:supprimer	supprimer messagerie	\N	messagerie	supprimer	t	2026-06-14 03:05:32.926133	2026-06-14 03:05:32.926133
a541696c-8280-4840-9acb-c98a69bc0dc7	notifications:manage	Gérer les notifications	\N	notifications	manage	t	2026-06-14 03:05:32.929892	2026-06-14 03:05:32.929892
2eb0e218-9330-492e-9d56-ccfe21048151	notifications:view	Voir les notifications	\N	notifications	view	t	2026-06-14 03:05:32.934603	2026-06-14 03:05:32.934603
711cee0e-5542-4c34-b861-fb181d7f187f	notifications:envoyer	envoyer les notifications	\N	notifications	envoyer	t	2026-06-14 03:05:32.938742	2026-06-14 03:05:32.938742
2e936d5e-833c-4988-bb37-2602e1a35623	notifications:configurer	configurer les notifications	\N	notifications	configurer	t	2026-06-14 03:05:32.94282	2026-06-14 03:05:32.94282
66208caa-a185-4954-a89d-33d0a77df85a	requetes:view	Voir les requêtes	\N	requetes	view	t	2026-06-14 03:05:32.946441	2026-06-14 03:05:32.946441
4948fb4c-a3b8-46b4-b23c-13aec7ecac80	requetes:create	Créer les requêtes	\N	requetes	create	t	2026-06-14 03:05:32.950173	2026-06-14 03:05:32.950173
5644e220-8aba-4f7d-bb10-065af0fa5b1d	requetes:approve	Approuver les requêtes	\N	requetes	approve	t	2026-06-14 03:05:32.954176	2026-06-14 03:05:32.954176
a9d3240c-8b61-4144-896c-607b14fba00c	requetes:refuser	refuser les requêtes	\N	requetes	refuser	t	2026-06-14 03:05:32.958294	2026-06-14 03:05:32.958294
334bd3d6-e6bb-47ed-be92-163c2854d2b4	sondages:create	Créer sondages	\N	sondages	create	t	2026-06-14 03:05:32.962481	2026-06-14 03:05:32.962481
24d4ffd2-2c79-488b-9c2c-cda966ffccdb	sondages:vote	vote sondages	\N	sondages	vote	t	2026-06-14 03:05:32.966327	2026-06-14 03:05:32.966327
dd91e84f-e9bf-459a-8c21-fd8f87696320	sondages:analyze	analyze sondages	\N	sondages	analyze	t	2026-06-14 03:05:32.969918	2026-06-14 03:05:32.969918
678ce342-14ab-418a-acf2-79ba4dd7cdd9	sondages:view	Voir sondages	\N	sondages	view	t	2026-06-14 03:05:32.974558	2026-06-14 03:05:32.974558
67a7c7aa-a69d-4eaf-ae67-b628b67609a4	sondages:edit	Modifier sondages	\N	sondages	edit	t	2026-06-14 03:05:32.97913	2026-06-14 03:05:32.97913
498052c1-346c-468e-9bc3-1bf6dfe6eb6a	sondages:delete	Supprimer sondages	\N	sondages	delete	t	2026-06-14 03:05:32.983163	2026-06-14 03:05:32.983163
72d17a78-49f0-4da3-bc99-39132729d8e4	sondages:templates:manage	templates sondages	\N	sondages	templates	t	2026-06-14 03:05:32.986832	2026-06-14 03:05:32.986832
3a5de9a5-5917-4f15-aa31-fae687d60b3a	etablissement:view	Voir etablissement	\N	etablissement	view	t	2026-06-14 03:05:32.990308	2026-06-14 03:05:32.990308
cdaabece-61df-41bc-b280-18f964915cce	etablissement:edit	Modifier etablissement	\N	etablissement	edit	t	2026-06-14 03:05:32.99445	2026-06-14 03:05:32.99445
5e845b17-ace2-4721-8ceb-60f6508982c1	config:view	Voir la configuration	\N	config	view	t	2026-06-14 03:05:32.998197	2026-06-14 03:05:32.998197
211fadc1-1c87-47e4-9c76-964a4100088d	config:edit	Modifier la configuration	\N	config	edit	t	2026-06-14 03:05:33.002153	2026-06-14 03:05:33.002153
a510927b-975c-4139-8eb8-71fa6e2bdd1c	monitoring:view	Voir le monitoring	\N	monitoring	view	t	2026-06-14 03:05:33.005777	2026-06-14 03:05:33.005777
0143cefe-2b32-4422-bf60-6bed19cafe6e	monitoring:logs	logs le monitoring	\N	monitoring	logs	t	2026-06-14 03:05:33.00932	2026-06-14 03:05:33.00932
432c0dfe-e801-45e7-96af-4136225cdaa9	monitoring:export	export le monitoring	\N	monitoring	export	t	2026-06-14 03:05:33.013626	2026-06-14 03:05:33.013626
c06c6401-ca05-46da-8d9e-14809260df45	validation:notes:level1	notes validation	\N	validation	notes	t	2026-06-14 03:05:33.018012	2026-06-14 03:05:33.018012
bd3ee3ad-7578-4f4b-92f2-ab77ccc1e09c	validation:notes:level2	notes validation	\N	validation	notes	t	2026-06-14 03:05:33.022337	2026-06-14 03:05:33.022337
7155d123-11c5-4ccd-80a5-e9e41d2e0331	validation:notes:level3	notes validation	\N	validation	notes	t	2026-06-14 03:05:33.025973	2026-06-14 03:05:33.025973
a172578f-9502-4bf0-8070-7b966be06af7	validation:bulletins:level1	bulletins validation	\N	validation	bulletins	t	2026-06-14 03:05:33.029409	2026-06-14 03:05:33.029409
9891f7bc-f8fc-47a6-8263-75d88913fb68	validation:bulletins:level2	bulletins validation	\N	validation	bulletins	t	2026-06-14 03:05:33.034424	2026-06-14 03:05:33.034424
fc40e933-9cf5-4838-8815-2385bb163c91	validation:bulletins:level3	bulletins validation	\N	validation	bulletins	t	2026-06-14 03:05:33.038694	2026-06-14 03:05:33.038694
77bd5602-b5f4-4712-85ef-138219207369	validation:cantine:level1	cantine validation	\N	validation	cantine	t	2026-06-14 03:05:33.04259	2026-06-14 03:05:33.04259
c86dc0e3-059e-474a-a5ee-41caca9cc50c	validation:cantine:level2	cantine validation	\N	validation	cantine	t	2026-06-14 03:05:33.045863	2026-06-14 03:05:33.045863
856f48b1-1c2e-4fcc-b0cd-fc2d83e93ea9	validation:cantine:level3	cantine validation	\N	validation	cantine	t	2026-06-14 03:05:33.049001	2026-06-14 03:05:33.049001
7c161b04-b823-4f7a-ab24-f22c023f8217	validation:transport:level1	transport validation	\N	validation	transport	t	2026-06-14 03:05:33.057143	2026-06-14 03:05:33.057143
ba3bb0a8-4745-4dce-aa34-c5a67a615ca7	validation:transport:level2	transport validation	\N	validation	transport	t	2026-06-14 03:05:33.061637	2026-06-14 03:05:33.061637
799b03e3-b644-4b48-8ad0-5d0ca8e7be54	validation:transport:level3	transport validation	\N	validation	transport	t	2026-06-14 03:05:33.066305	2026-06-14 03:05:33.066305
aa422596-aca0-4b78-b063-a6b3116f46ba	validation:dashboard:view	dashboard validation	\N	validation	dashboard	t	2026-06-14 03:05:33.0697	2026-06-14 03:05:33.0697
7cc5f70c-54e8-494b-b430-7890601ef0ed	validation:rapports:view	rapports validation	\N	validation	rapports	t	2026-06-14 03:05:33.074146	2026-06-14 03:05:33.074146
2b48ce2a-b30c-49fb-80a1-026be9c6b29f	validation:rapports:export	rapports validation	\N	validation	rapports	t	2026-06-14 03:05:33.077568	2026-06-14 03:05:33.077568
c4d15a53-40f6-4e14-80f7-ef757ff2013b	validation:classes:level1	classes validation	\N	validation	classes	t	2026-06-14 03:05:33.080964	2026-06-14 03:05:33.080964
69d28e63-035f-4a76-92db-865ef917faa8	validation:classes:level2	classes validation	\N	validation	classes	t	2026-06-14 03:05:33.084589	2026-06-14 03:05:33.084589
1bad04e9-c09b-4f74-a5fc-8130d4099e21	validation:classes:level3	classes validation	\N	validation	classes	t	2026-06-14 03:05:33.087887	2026-06-14 03:05:33.087887
24d13168-8fba-4f72-935c-3d9588024c7d	validation:matieres:level1	matieres validation	\N	validation	matieres	t	2026-06-14 03:05:33.091249	2026-06-14 03:05:33.091249
f6bd7a7b-d174-4839-b552-7feaec82648c	validation:matieres:level2	matieres validation	\N	validation	matieres	t	2026-06-14 03:05:33.096209	2026-06-14 03:05:33.096209
5a9acda8-58fe-4cd0-8f24-9988da0c20fd	validation:matieres:level3	matieres validation	\N	validation	matieres	t	2026-06-14 03:05:33.100894	2026-06-14 03:05:33.100894
8828e6c3-4747-4ffa-8627-fa0007cfad7b	validation:periodes:level1	periodes validation	\N	validation	periodes	t	2026-06-14 03:05:33.104836	2026-06-14 03:05:33.104836
d307cdae-e1b6-476b-a535-ee6937862295	validation:periodes:level2	periodes validation	\N	validation	periodes	t	2026-06-14 03:05:33.108521	2026-06-14 03:05:33.108521
3cd66d60-6c93-45f5-b1c2-734394ac2719	validation:eleves:level1	eleves validation	\N	validation	eleves	t	2026-06-14 03:05:33.112415	2026-06-14 03:05:33.112415
c50f67b9-205e-4576-974d-48cb3dc422c0	validation:eleves:level2	eleves validation	\N	validation	eleves	t	2026-06-14 03:05:33.117187	2026-06-14 03:05:33.117187
1a84b01d-2240-47ae-aff0-e40e9d6ba84d	validation:eleves:level3	eleves validation	\N	validation	eleves	t	2026-06-14 03:05:33.120884	2026-06-14 03:05:33.120884
65c1fdb2-6e28-4589-9b95-6c5f9d10ccc8	validation:personnel:level1	personnel validation	\N	validation	personnel	t	2026-06-14 03:05:33.125385	2026-06-14 03:05:33.125385
d3f40435-5d75-4e15-90f8-1e969e6a95ba	validation:personnel:level2	personnel validation	\N	validation	personnel	t	2026-06-14 03:05:33.128665	2026-06-14 03:05:33.128665
ca866cf7-49df-41bf-863e-24859ed9a8fa	validation:clubs:level1	clubs validation	\N	validation	clubs	t	2026-06-14 03:05:33.132129	2026-06-14 03:05:33.132129
c16b6a19-f1b4-4687-a096-c7f425c4dfca	validation:clubs:level2	clubs validation	\N	validation	clubs	t	2026-06-14 03:05:33.13713	2026-06-14 03:05:33.13713
e8d47565-bcb0-4b14-8eea-df1021014e0b	validation:clubs:level3	clubs validation	\N	validation	clubs	t	2026-06-14 03:05:33.141515	2026-06-14 03:05:33.141515
8917333c-f663-43f6-a34b-7a1a8c500b37	validation:materiel:level1	materiel validation	\N	validation	materiel	t	2026-06-14 03:05:33.144627	2026-06-14 03:05:33.144627
96df1c2a-2bf5-46b4-bb32-7a1ddf6cfcc0	validation:materiel:level2	materiel validation	\N	validation	materiel	t	2026-06-14 03:05:33.147218	2026-06-14 03:05:33.147218
341a92fa-f1d4-4d22-a9dc-6d99c10f5db9	validation:cartes:level1	cartes validation	\N	validation	cartes	t	2026-06-14 03:05:33.150007	2026-06-14 03:05:33.150007
34b8b827-2eea-4ec9-a624-6e5f144cd099	validation:cartes:level2	cartes validation	\N	validation	cartes	t	2026-06-14 03:05:33.154728	2026-06-14 03:05:33.154728
fb009307-4a65-4ab2-bc44-04fb0307761e	validation:annees_scolaires:level1	annees_scolaires validation	\N	validation	annees_scolaires	t	2026-06-14 03:05:33.159175	2026-06-14 03:05:33.159175
10e89bf3-efac-4cb9-b6f7-c76b60ca8fd7	validation:annees_scolaires:level2	annees_scolaires validation	\N	validation	annees_scolaires	t	2026-06-14 03:05:33.163115	2026-06-14 03:05:33.163115
0d8eb0ad-8209-4e00-bfc4-663e53721c78	validation:etablissement:level1	etablissement validation	\N	validation	etablissement	t	2026-06-14 03:05:33.166932	2026-06-14 03:05:33.166932
b68d09db-1ea5-4306-b160-ce9689e52701	validation:etablissement:level2	etablissement validation	\N	validation	etablissement	t	2026-06-14 03:05:33.171237	2026-06-14 03:05:33.171237
409a5752-eba5-49cc-bae3-2bf0a5091bdc	finances:scolarite:view	scolarite finances	\N	finances	scolarite	t	2026-06-14 03:05:33.175967	2026-06-14 03:05:33.175967
82287431-e174-469a-9e3c-c9786a6c0e50	finances:scolarite:config	scolarite finances	\N	finances	scolarite	t	2026-06-14 03:05:33.180364	2026-06-14 03:05:33.180364
d384612f-09a1-4414-a4b7-4d0133ea6c83	finances:paiement:create	paiement finances	\N	finances	paiement	t	2026-06-14 03:05:33.183991	2026-06-14 03:05:33.183991
0b1f004c-36b6-4c6b-99d7-fb0980c39b74	finances:paiement:validate	paiement finances	\N	finances	paiement	t	2026-06-14 03:05:33.187313	2026-06-14 03:05:33.187313
4fc403a6-4d05-48b0-a6c2-b707eedcb642	finances:paiement:refund	paiement finances	\N	finances	paiement	t	2026-06-14 03:05:33.190522	2026-06-14 03:05:33.190522
6a47e0e2-7471-4c78-9feb-5e74fa6f0375	finances:paiement:delete	paiement finances	\N	finances	paiement	t	2026-06-14 03:05:33.194626	2026-06-14 03:05:33.194626
d17313b3-6847-48c3-b925-3281efdc8a7e	finances:recu:generate	recu finances	\N	finances	recu	t	2026-06-14 03:05:33.19816	2026-06-14 03:05:33.19816
e642c938-895f-4e06-883e-44e1ba94669e	finances:recu:download	recu finances	\N	finances	recu	t	2026-06-14 03:05:33.202081	2026-06-14 03:05:33.202081
40a25369-020f-4591-911d-46c6b2f7fa2b	finances:relance:send	relance finances	\N	finances	relance	t	2026-06-14 03:05:33.205452	2026-06-14 03:05:33.205452
1f9a3f56-ce6b-4d42-b07b-898d4a19ccd2	finances:etat-compte:view	etat-compte finances	\N	finances	etat-compte	t	2026-06-14 03:05:33.208746	2026-06-14 03:05:33.208746
8d51d66a-66a1-4d8b-8f38-b82f74385a9b	finances:remise:grant	remise finances	\N	finances	remise	t	2026-06-14 03:05:33.212607	2026-06-14 03:05:33.212607
dbdfab7f-a4f4-4a57-a446-93d9eff1d83a	finances:echeancier:generate	echeancier finances	\N	finances	echeancier	t	2026-06-14 03:05:33.216836	2026-06-14 03:05:33.216836
9877957b-ebc5-415f-a67c-1622a5634595	finances:depenses:view	depenses finances	\N	finances	depenses	t	2026-06-14 03:05:33.221314	2026-06-14 03:05:33.221314
53e2bb1d-f51b-4b9a-b3c2-c37d635d6587	finances:depenses:create	depenses finances	\N	finances	depenses	t	2026-06-14 03:05:33.22487	2026-06-14 03:05:33.22487
37dff388-f58e-4669-90b6-d6b42b5acfb8	finances:depenses:edit	depenses finances	\N	finances	depenses	t	2026-06-14 03:05:33.228047	2026-06-14 03:05:33.228047
4a39413d-82ea-4601-94cf-2b170b3a1b3b	finances:depenses:validate	depenses finances	\N	finances	depenses	t	2026-06-14 03:05:33.231355	2026-06-14 03:05:33.231355
9d9dba02-61bb-44ed-8aa4-b46bc9576876	finances:depenses:payer	depenses finances	\N	finances	depenses	t	2026-06-14 03:05:33.235638	2026-06-14 03:05:33.235638
f30d142a-4b8b-43c2-be13-19a83f153e48	finances:depenses:delete	depenses finances	\N	finances	depenses	t	2026-06-14 03:05:33.23929	2026-06-14 03:05:33.23929
4df36a47-0d8f-411e-b33b-9a05b434e348	finances:depenses:export	depenses finances	\N	finances	depenses	t	2026-06-14 03:05:33.242867	2026-06-14 03:05:33.242867
811f52ef-be44-4193-8fa4-a6d874d6ef26	finances:depenses:config	depenses finances	\N	finances	depenses	t	2026-06-14 03:05:33.245706	2026-06-14 03:05:33.245706
6350ed08-6ceb-437c-a688-3207c31daffc	finances:depenses:rapports	depenses finances	\N	finances	depenses	t	2026-06-14 03:05:33.248549	2026-06-14 03:05:33.248549
91488504-2065-441d-b2a5-04128f83f4ca	finances:demande:create	demande finances	\N	finances	demande	t	2026-06-14 03:05:33.251512	2026-06-14 03:05:33.251512
b1954232-3fc1-449c-a848-749e44d6af64	finances:demande:validate	demande finances	\N	finances	demande	t	2026-06-14 03:05:33.255655	2026-06-14 03:05:33.255655
5f1c39c2-0a75-4fb8-b1e5-b9744e68e803	finances:demande:reject	demande finances	\N	finances	demande	t	2026-06-14 03:05:33.259778	2026-06-14 03:05:33.259778
1cc67f1e-7d61-4971-a7c4-cb7583794569	finances:demande:view-all	demande finances	\N	finances	demande	t	2026-06-14 03:05:33.263367	2026-06-14 03:05:33.263367
76dd10f6-c8c1-47ff-942f-16796d7d18ce	finances:bon-commande:create	bon-commande finances	\N	finances	bon-commande	t	2026-06-14 03:05:33.266592	2026-06-14 03:05:33.266592
8fa9704d-68b6-4cf0-9285-15ce22fdf6cc	finances:bon-commande:validate	bon-commande finances	\N	finances	bon-commande	t	2026-06-14 03:05:33.269639	2026-06-14 03:05:33.269639
7aa9855f-cd61-4537-8459-3b9c19149f51	finances:fournisseurs:view	fournisseurs finances	\N	finances	fournisseurs	t	2026-06-14 03:05:33.274851	2026-06-14 03:05:33.274851
63fc86ab-9e21-4105-a9be-779c9f9f008c	finances:fournisseurs:manage	fournisseurs finances	\N	finances	fournisseurs	t	2026-06-14 03:05:33.278958	2026-06-14 03:05:33.278958
b363d041-5721-4d3b-b92a-07cf10b83723	finances:facture:validate	facture finances	\N	finances	facture	t	2026-06-14 03:05:33.282799	2026-06-14 03:05:33.282799
daf91d1a-a35a-40e7-9033-59c9dd417d9f	finances:comptabilite:view	comptabilite finances	\N	finances	comptabilite	t	2026-06-14 03:05:33.28601	2026-06-14 03:05:33.28601
cfbe5203-8f17-410b-b969-65156bddafea	finances:comptabilite:ecrire	comptabilite finances	\N	finances	comptabilite	t	2026-06-14 03:05:33.289096	2026-06-14 03:05:33.289096
e8fac3df-72b3-4ffd-abec-697c8c35cb53	finances:comptabilite:valider	comptabilite finances	\N	finances	comptabilite	t	2026-06-14 03:05:33.292913	2026-06-14 03:05:33.292913
276fa532-4eb4-429b-87a4-28ba188a4563	finances:comptabilite:annuler	comptabilite finances	\N	finances	comptabilite	t	2026-06-14 03:05:33.296893	2026-06-14 03:05:33.296893
d0ed0a4b-1902-4d20-ac81-d53b39273f9a	finances:comptabilite:balance	comptabilite finances	\N	finances	comptabilite	t	2026-06-14 03:05:33.299944	2026-06-14 03:05:33.299944
5762d8c1-b9d2-4bcd-965f-5525fc2dcaed	finances:comptabilite:rapport	comptabilite finances	\N	finances	comptabilite	t	2026-06-14 03:05:33.302906	2026-06-14 03:05:33.302906
bbfa2be6-42a7-4c3e-a6f0-012f938a7b15	finances:comptabilite:export	comptabilite finances	\N	finances	comptabilite	t	2026-06-14 03:05:33.305607	2026-06-14 03:05:33.305607
6e544016-e480-460f-92e8-d0574bb5911a	finances:tresorerie:view	tresorerie finances	\N	finances	tresorerie	t	2026-06-14 03:05:33.308166	2026-06-14 03:05:33.308166
6aca9891-4527-4191-8191-94dc00bd4bd9	finances:tresorerie:manage	tresorerie finances	\N	finances	tresorerie	t	2026-06-14 03:05:33.310993	2026-06-14 03:05:33.310993
2a1bf877-16e8-488c-bb3e-5523c76d1ac8	finances:caisse:entrer	caisse finances	\N	finances	caisse	t	2026-06-14 03:05:33.314475	2026-06-14 03:05:33.314475
62003316-bad4-409f-bcc5-aa3c8d628773	finances:caisse:sortir	caisse finances	\N	finances	caisse	t	2026-06-14 03:05:33.318205	2026-06-14 03:05:33.318205
a5517342-5522-4456-8db2-87b3813d7f8d	finances:caisse:cloturer	caisse finances	\N	finances	caisse	t	2026-06-14 03:05:33.322207	2026-06-14 03:05:33.322207
12f36542-128f-4719-bbd4-bab2d4f3e98f	finances:banque:virer	banque finances	\N	finances	banque	t	2026-06-14 03:05:33.327533	2026-06-14 03:05:33.327533
c6f31724-0db8-4eb1-917e-4a41af3167f8	finances:budget:view	budget finances	\N	finances	budget	t	2026-06-14 03:05:33.332137	2026-06-14 03:05:33.332137
e7fd3821-d49b-4538-9e8d-dd92d5288864	finances:budget:create	budget finances	\N	finances	budget	t	2026-06-14 03:05:33.336458	2026-06-14 03:05:33.336458
7736ac7e-ddd6-4c04-a767-caeca3ded977	finances:budget:validate	budget finances	\N	finances	budget	t	2026-06-14 03:05:33.340003	2026-06-14 03:05:33.340003
a08203dc-afe0-4466-a0c6-5be18b46d364	finances:budget:edit	budget finances	\N	finances	budget	t	2026-06-14 03:05:33.343418	2026-06-14 03:05:33.343418
0eb1b21a-33f5-45e5-8424-a0c72356c7df	finances:budget:cloturer	budget finances	\N	finances	budget	t	2026-06-14 03:05:33.346507	2026-06-14 03:05:33.346507
fc39ce1f-9f72-4781-b7f4-7d7661c12258	finances:budget:rapports	budget finances	\N	finances	budget	t	2026-06-14 03:05:33.349482	2026-06-14 03:05:33.349482
8645b659-2d69-4a0c-9b81-dcd39ef8519a	finances:budget:engager	budget finances	\N	finances	budget	t	2026-06-14 03:05:33.353601	2026-06-14 03:05:33.353601
34c53234-dd47-48bb-ac19-a2f2c760cadb	finances:budget:consommer	budget finances	\N	finances	budget	t	2026-06-14 03:05:33.357493	2026-06-14 03:05:33.357493
3869381f-ede9-4b73-9296-76ee4f5daffc	finances:dashboard:view	dashboard finances	\N	finances	dashboard	t	2026-06-14 03:05:33.361877	2026-06-14 03:05:33.361877
52671b83-0e02-4d96-a011-8f37ff8cba01	finances:dashboard:export	dashboard finances	\N	finances	dashboard	t	2026-06-14 03:05:33.365936	2026-06-14 03:05:33.365936
b9b512b2-4b4a-4675-b0a5-f6db75fec00c	finances:dashboard:kpi	dashboard finances	\N	finances	dashboard	t	2026-06-14 03:05:33.369388	2026-06-14 03:05:33.369388
dded6a07-cea5-491b-81d2-19f3dcf88366	finances:rapports:generer	rapports finances	\N	finances	rapports	t	2026-06-14 03:05:33.373192	2026-06-14 03:05:33.373192
5d6e4535-f23e-410a-8a68-ee6e0af9b149	groupes:view	Voir groupes	\N	groupes	view	t	2026-06-14 03:05:33.377287	2026-06-14 03:05:33.377287
2bca06a4-52ea-4d56-8afa-1631731d70d7	groupes:manage	Gérer groupes	\N	groupes	manage	t	2026-06-14 03:05:33.381208	2026-06-14 03:05:33.381208
e9c26bf5-06e2-4378-ba96-3096bb148a9b	groupes:dashboard:consolide	dashboard groupes	\N	groupes	dashboard	t	2026-06-14 03:05:33.38516	2026-06-14 03:05:33.38516
b7ea7b30-1b2c-45d2-87b4-6d030cf5de19	groupes:rapports:scolarite	rapports groupes	\N	groupes	rapports	t	2026-06-14 03:05:33.388752	2026-06-14 03:05:33.388752
b63aec61-7f8f-4d81-81b2-c83b6c011cc0	groupes:rapports:finances	rapports groupes	\N	groupes	rapports	t	2026-06-14 03:05:33.392725	2026-06-14 03:05:33.392725
5f0a970d-22c7-47f1-aab7-ad41dcfeb7d4	groupes:etablissements:manage	etablissements groupes	\N	groupes	etablissements	t	2026-06-14 03:05:33.397332	2026-06-14 03:05:33.397332
4cf6a152-7ebb-4c12-b8d8-457c8eec5ed8	organisation:view	Voir organisation	\N	organisation	view	t	2026-06-14 03:05:33.402618	2026-06-14 03:05:33.402618
fc9579bb-a94c-4976-9d50-2b48967e601f	organisation:create	Créer organisation	\N	organisation	create	t	2026-06-14 03:05:33.406987	2026-06-14 03:05:33.406987
479d55f4-df2a-4718-b732-1e0b5c17e977	organisation:edit	Modifier organisation	\N	organisation	edit	t	2026-06-14 03:05:33.41068	2026-06-14 03:05:33.41068
425c78e9-5054-4986-8867-87c1417abe26	organisation:delete	Supprimer organisation	\N	organisation	delete	t	2026-06-14 03:05:33.414685	2026-06-14 03:05:33.414685
52d99454-f27f-41ce-a18a-aaf4241574bb	unites:view	Voir unites	\N	unites	view	t	2026-06-14 03:05:33.417858	2026-06-14 03:05:33.417858
b7c8be94-31de-4e1e-90ff-540e212a98b9	unites:create	Créer unites	\N	unites	create	t	2026-06-14 03:05:33.421515	2026-06-14 03:05:33.421515
9a960c06-d4fe-4a05-a2bb-495520c8d672	unites:edit	Modifier unites	\N	unites	edit	t	2026-06-14 03:05:33.425122	2026-06-14 03:05:33.425122
70aed2ca-b35d-4af0-8acf-68c17d17efa4	unites:delete	Supprimer unites	\N	unites	delete	t	2026-06-14 03:05:33.42826	2026-06-14 03:05:33.42826
16fb168d-3006-4073-9697-1e44da8846d4	unites:arborescence:view	arborescence unites	\N	unites	arborescence	t	2026-06-14 03:05:33.433426	2026-06-14 03:05:33.433426
847f530b-9d39-47c2-ab26-6f7bb4242f1f	postes:view	Voir postes	\N	postes	view	t	2026-06-14 03:05:33.437745	2026-06-14 03:05:33.437745
f910ed4c-2aa0-4413-9e81-74c513d14164	postes:create	Créer postes	\N	postes	create	t	2026-06-14 03:05:33.441339	2026-06-14 03:05:33.441339
f9900b67-3209-4897-bcbd-e58cb217db15	postes:edit	Modifier postes	\N	postes	edit	t	2026-06-14 03:05:33.445034	2026-06-14 03:05:33.445034
d455877c-01e8-408c-9ac2-c4458dad9473	postes:delete	Supprimer postes	\N	postes	delete	t	2026-06-14 03:05:33.448324	2026-06-14 03:05:33.448324
86d56048-a62e-494d-86b1-ace4f0d7a1e3	postes:assigner	assigner postes	\N	postes	assigner	t	2026-06-14 03:05:33.452372	2026-06-14 03:05:33.452372
fd125f06-845e-4e06-b806-e04ed703b6fc	hierarchie:view	Voir hierarchie	\N	hierarchie	view	t	2026-06-14 03:05:33.456297	2026-06-14 03:05:33.456297
3ef4f942-5c23-4966-9edb-f0b9552f9f0f	hierarchie:create	Créer hierarchie	\N	hierarchie	create	t	2026-06-14 03:05:33.460057	2026-06-14 03:05:33.460057
e40d1ce5-0ed6-4f87-9288-bbe9724edd32	hierarchie:edit	Modifier hierarchie	\N	hierarchie	edit	t	2026-06-14 03:05:33.463581	2026-06-14 03:05:33.463581
cd50b1b9-8324-49bf-9e10-1a71740db333	hierarchie:delete	Supprimer hierarchie	\N	hierarchie	delete	t	2026-06-14 03:05:33.467093	2026-06-14 03:05:33.467093
afec470a-4bbc-471d-a58e-f1f96a9e2863	organigramme:view	Voir organigramme	\N	organigramme	view	t	2026-06-14 03:05:33.470291	2026-06-14 03:05:33.470291
\.


--
-- Data for Name: places_parking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.places_parking (id, numero, type, statut, "vehiculeId", "abonnementId", "tarifHoraire", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: points_utilisateurs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.points_utilisateurs (id, "utilisateurId", "pointsTotal", "pointsMois", "pointsSemaine", niveau, "createdAt") FROM stdin;
\.


--
-- Data for Name: postes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.postes (id, "intitulé", description, code, type, "niveauResponsabilite", statut, actif, "uniteOrganisationnelleId", "occupantId", "occupantNom", "nombrePostes", "superviseurId", "superviseurNom", "competencesRequises", missions, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: preferences_globales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.preferences_globales (id, "etablissementId", cle, valeur, "typeValeur", categorie, libelle, description, "estModifiableParUtilisateur", ordre, metadata, "createdAt", "updatedAt", "modifiePar") FROM stdin;
\.


--
-- Data for Name: preferences_role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.preferences_role (id, "roleId", cle, valeur, "typeValeur", categorie, "estModifiableParUtilisateur", description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: preferences_utilisateur; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.preferences_utilisateur (id, "utilisateurId", cle, valeur, "typeValeur", categorie, "valeurDefaut", "heriteGlobal", description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: presences_transport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.presences_transport (id, "inscriptionId", date, trajet, present, "heureMontee", "createdAt") FROM stdin;
\.


--
-- Data for Name: prets_materiels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prets_materiels (id, "materielId", "emprunteurId", quantite, "datePret", "dateRetourPrevue", "dateRetourEffective", notes, retourne, statut, "etablissementId", "createdAt") FROM stdin;
\.


--
-- Data for Name: profils_orientation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profils_orientation (id, "eleveId", interets, aptitudes, objectifs, notes, recommandations, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: profils_utilisateurs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profils_utilisateurs (id, "utilisateurId", nom, prenom, genre, "dateNaissance", "lieuNaissance", nationalite, telephone, "telephoneSecondaire", adresse, ville, quartier, photo, "pieceIdentite", "numeroPieceIdentite", notes, "createdAt", "updatedAt") FROM stdin;
bc6c79d9-39b6-49bd-8440-6427f20d2db9	acfb60ea-3913-48b5-9045-fc1a8fac9986	ADMINISTRATEUR	Super	\N	\N	\N	\N	+237690000000	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:35.83799	2026-06-14 03:05:35.83799
200d1286-4219-48f4-b89a-f7d4ebb04783	f77dfb17-d8cc-40d5-bb52-505610b3dc37	ADMIN	Test	\N	\N	\N	\N	+237690000001	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:36.363537	2026-06-14 03:05:36.363537
11baca9d-5aa4-46ca-87ea-74950e2dcb81	ce2e480d-1b39-4162-bfc8-fa2a6503103f	DUPONT	Jean	\N	\N	\N	\N	+237690000002	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:36.884807	2026-06-14 03:05:36.884807
f7e2af19-af47-42a4-99aa-608b334a53af	39ff99d5-f9f3-49d2-855f-1121d24c84e2	MBA	Pierre	\N	\N	\N	\N	+237690000003	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:37.377497	2026-06-14 03:05:37.377497
c3845db8-74c5-4c90-86b4-4a13f524700e	db714f47-9509-4edb-89d2-406d8f9249e2	NGO	Marie	\N	\N	\N	\N	+237690000004	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:37.833648	2026-06-14 03:05:37.833648
e4327972-3059-43f0-b4b9-ebcf61ca1b64	89cca293-caa1-4d71-b69f-a4074e197939	TCHUENTE	Paul	\N	\N	\N	\N	+237690000005	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:38.317377	2026-06-14 03:05:38.317377
0868d01b-1c85-43b1-af9e-fc0fac7c74f3	7a3e08ec-461f-4f53-8b23-eaf96a6db06c	FOGUET	André	\N	\N	\N	\N	+237690000006	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:38.806588	2026-06-14 03:05:38.806588
0521dbac-c7d0-429b-89ed-0ec7e5b0cb0b	bd173360-635d-4d13-8943-87dd15895ea3	KAMGA	Rose	\N	\N	\N	\N	+237690000007	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:39.288498	2026-06-14 03:05:39.288498
ee0bc7bd-e92d-4c5e-b976-d3a9c7dbd04c	3ee8f4bc-dd13-48b0-8e9c-703655822d8b	TSONDE	Claire	\N	\N	\N	\N	+237690000008	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:39.776168	2026-06-14 03:05:39.776168
08c7bacc-5af7-472a-bc3b-0872edb88900	247d785c-ef25-4ae4-bade-45a8e33feb1b	MARTIN	Luc	\N	\N	\N	\N	+237690000009	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:40.288507	2026-06-14 03:05:40.288507
4797e788-22c5-49e1-86f1-a8c122f0504c	86a246c4-ece4-45dd-b8a9-af35286957de	BELL	François	\N	\N	\N	\N	+237690000010	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:40.847707	2026-06-14 03:05:40.847707
ada17aa9-cddd-4886-a7a8-0491fb286a17	4c837c10-351a-4555-9c91-f97ea11ff180	FOTA	Emmanuel	\N	\N	\N	\N	+237690000011	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:41.366663	2026-06-14 03:05:41.366663
c623454b-f4bd-437a-8be1-cde64dcbdc01	1fadafe6-5a9a-49f0-a2bd-51acd1755295	POUGA	Alice	\N	\N	\N	\N	+237690000012	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:41.872869	2026-06-14 03:05:41.872869
84a4ecc0-15ef-4103-be78-0125f954a2e4	95c0c8c9-99f1-4a1b-8bb5-15c7bf482191	TEMGOUA	David	\N	\N	\N	\N	+237690000013	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:42.374671	2026-06-14 03:05:42.374671
f8910ab0-a3b4-4dae-87f2-051fc55ef3a3	ba2a8262-6bbd-4ca9-afd2-25a1d07fcd37	KENGNE	Robert	\N	\N	\N	\N	+237690000014	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:42.945788	2026-06-14 03:05:42.945788
f833dc0d-9d53-4e48-befa-eb6a055a9040	228e45de-bb59-43f1-955b-4b34921e37d1	NJOCK	Sarah	\N	\N	\N	\N	+237690000015	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:43.438779	2026-06-14 03:05:43.438779
e2bfb2c0-0bdc-4d94-83c2-ebc4120a974e	e04601d3-f069-4dc0-9a0e-d853acc3b5eb	MBAPPE	Henri	\N	\N	\N	\N	+237690000016	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:43.948526	2026-06-14 03:05:43.948526
d846b164-14fe-4bab-b17f-04efd54d8a32	f9b11fec-f19e-40db-ba38-0bc151cd3679	ATCHO	Michel	\N	\N	\N	\N	+237690000017	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:44.426642	2026-06-14 03:05:44.426642
d854fe12-44fc-4806-b474-f415d6f4f85c	016749bb-aa1e-4018-a958-8519fb87465c	BILA	Sophie	\N	\N	\N	\N	+237690000018	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:44.962471	2026-06-14 03:05:44.962471
62d248ae-5d16-4d90-8b90-9955d5956ecc	4c3e1157-e955-4940-a528-467d96a13c9d	ESSOMBA	Catherine	\N	\N	\N	\N	+237690000019	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:45.46005	2026-06-14 03:05:45.46005
ab750a0e-3e8f-4b06-b613-2ccb3a3e9bf7	6d6a5de1-6af5-4a93-9c68-da8b0f5e19d5	MBOCK	Thérèse	\N	\N	\N	\N	+237690000020	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:45.962611	2026-06-14 03:05:45.962611
1cc745bb-cf7c-4d36-8c5b-ebf2848418d3	d4347fa8-52cc-4956-9e74-056d06453155	PERSONNEL	Test	\N	\N	\N	\N	+237690000021	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:46.461644	2026-06-14 03:05:46.461644
7377afd3-215c-4854-a92a-c009652a7b54	78e04134-22fb-4f69-bce1-19c6ed7e3cf0	NGOUBA	Isabelle	\N	\N	\N	\N	+237690000022	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:46.968718	2026-06-14 03:05:46.968718
f9d12c8d-947d-462b-b0a2-c953d15385db	8b9d70ba-d9e9-4436-8090-3fca01c0197b	TAGNE	Patrick	\N	\N	\N	\N	+237690000023	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:47.439396	2026-06-14 03:05:47.439396
9f3914c1-8320-4c03-918d-4ad05a923346	39de311e-e280-4baa-8907-ae0937aa454f	KWATSA	Joseph	\N	\N	\N	\N	+237690000024	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:47.962606	2026-06-14 03:05:47.962606
9da63877-0a54-402c-b20a-ba69b6c3dca8	f348e16a-ceef-43c3-9a46-d31f7dce82d2	MOUOKO	Anne	\N	\N	\N	\N	+237690000025	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:48.423772	2026-06-14 03:05:48.423772
29424aaa-29cd-4c93-93d1-6aa82ffa2a66	dfcd737b-6809-4457-a193-b24e9350cf73	EYONG	Louis	\N	\N	\N	\N	+237690000026	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:48.84933	2026-06-14 03:05:48.84933
e144bb37-59a5-4b5f-94d0-981c82837b73	6427200c-3e66-4432-8103-674d0cf24eb8	FOSSOUO	Marguerite	\N	\N	\N	\N	+237690000027	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:49.304939	2026-06-14 03:05:49.304939
1f00cc11-c687-4cd9-abaa-6dd383553ed1	6acba1ec-24de-49f4-b06e-a0917c2a3b32	TCHATAT	Daniel	\N	\N	\N	\N	+237690000028	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:49.813427	2026-06-14 03:05:49.813427
7c4325c6-0d47-4703-a026-192f462eb3a9	950c5aeb-2a78-4ae0-95b2-bf2f4d5698b9	KUIATE	Serge	\N	\N	\N	\N	+237690000029	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:50.318812	2026-06-14 03:05:50.318812
20bd430f-6cbd-4d50-9458-efc10e359440	341628e9-763a-4f7c-beba-bf0856435a7d	DONGMO	Patrick	\N	\N	\N	\N	+237690000030	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:50.794697	2026-06-14 03:05:50.794697
301e2e0f-4520-4c7a-9c87-a885d550a905	55e11115-1b98-4170-abcd-f3b69338000a	TSAFACK	Nathalie	\N	\N	\N	\N	+237690000031	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:51.273821	2026-06-14 03:05:51.273821
8625fe40-cb0c-410b-8b8d-cd48205ecd7f	87db2b9c-233a-4913-a674-6a6ed97ed4b8	MBOMBOCK	Jacques	\N	\N	\N	\N	+237690000032	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:51.773594	2026-06-14 03:05:51.773594
c86ecebf-07e1-4192-90b6-294013f72b50	ecfdeaeb-3619-4e08-a682-58ae148e3f34	NKOUATOU	Bernard	\N	\N	\N	\N	+237690000033	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:52.269883	2026-06-14 03:05:52.269883
28852be8-0d3e-40a2-9520-be896a5565c0	67ac40d5-e92b-4f07-ae27-1e681609b6d8	NJENGAT	Cécile	\N	\N	\N	\N	+237690000034	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:52.746625	2026-06-14 03:05:52.746625
37d56084-13b9-490f-b11f-1ed0c038b782	9cebe557-6d20-48ec-9d49-e6420278e426	TCHOUPO	Marc	\N	\N	\N	\N	+237690000035	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:53.244129	2026-06-14 03:05:53.244129
c5f283a8-92c8-439c-ae9e-6ff3c99cb432	85362b44-2cb2-4f30-94a2-894045426c20	DJOUMESSI	Victor	\N	\N	\N	\N	+237690000036	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:53.733135	2026-06-14 03:05:53.733135
7732fdf7-3378-4367-9c48-687460ae1e84	5cd20fce-903c-4106-ae89-95c61a9f9d7a	PARENT	Test	\N	\N	\N	\N	+237690000037	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:54.211962	2026-06-14 03:05:54.211962
b16495bc-9a06-4a85-a242-70b0136231e6	b89c0db8-6573-4763-8991-a900ad290901	ELEVE	Test	\N	\N	\N	\N	+237690000038	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-14 03:05:54.701395	2026-06-14 03:05:54.701395
\.


--
-- Data for Name: programme_chapitres; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.programme_chapitres (id, "matiereNiveauId", "periodeId", titre, description, "objectifsPedagogiques", ordre, "dureePrevueHeures", statut, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: progressions_programme; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.progressions_programme (id, "enseignantId", "matiereId", "classeId", "periodeId", "programmeChapitreId", "pourcentageRealise", "modeCalcul", "chapitreCourant", "dateEvaluation", remarques, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: rdv_orientation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rdv_orientation (id, "eleveId", "conseillerId", date, "dureeMinutes", motif, "compteRendu", recommandations, statut, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: recus_paiement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recus_paiement (id, "paiementId", "numeroRecu", "dateEmission", "eleveNom", "eleveMatricule", "classeNom", montant, "methodePaiement", objet, "genererPar", "signatureNumerique", "pdfPath", "envoyeParEmail", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, "utilisateurId", token, "adresseIp", "userAgent", "expireAt", revoque, "revoqueAt", "createdAt") FROM stdin;
80ba9a75-fcf9-4361-a6b5-b44761921dcd	acfb60ea-3913-48b5-9045-fc1a8fac9986	7d14b62a813c58f7aa50633afcd18ef62a8798225184516bf0dab78ae1cb570e7af405805515183e1c2376f23e112c6edc66490ce8410e3583783f151ce0fd4a	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 04:26:08.239	t	2026-06-14 04:26:22.33	2026-06-14 03:26:08.240043
03444cc1-40d7-490c-8d21-23cf4a3c39ac	78e04134-22fb-4f69-bce1-19c6ed7e3cf0	73134b5306b18789f1f288783537854fe5aa9dc6e110590dcae2b177436135f6b10f512967fd2954e63a3d27dd7cd6fcb7fe71d7522ba61766fd7bbd6c17aa32	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 04:28:22.663	t	2026-06-14 04:30:07.376	2026-06-14 03:28:22.666346
3406dcd3-ffd5-45f8-aee3-c8ae7dfb0173	acfb60ea-3913-48b5-9045-fc1a8fac9986	ce62d3a89bdbf5a7e39a07b1083827d143d4b01908e13d97e7464af1fed0a1b44f0db87a336e80a22e7a2837667094a6b1e22eb6549f084184791ee457b78c94	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 04:31:19.541	t	2026-06-14 09:10:29.255	2026-06-14 03:31:19.541808
40c6a815-b689-43f3-bbca-113a5cfaaf57	acfb60ea-3913-48b5-9045-fc1a8fac9986	8cf31a57cb1574d47bc6f0a7239c41a1ffcc9ff9e0f1940debfbd5702cdf72984f14be011a409031d13a92847fa8438d88b351ff2446532056ceb3752b02cde0	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:10:29.362	t	2026-06-14 09:10:30.569	2026-06-14 08:10:29.365038
21431ee0-5e92-46ea-b639-9f0df637b712	acfb60ea-3913-48b5-9045-fc1a8fac9986	a433f444ca54e9a3ea498a882645c827c233467a1bfc7a3369708577be5e930f0590175489bbde652036ce64930f36a27cbc4f0cf9c6ab1b7fd19ff26c3357f4	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:10:30.611	t	2026-06-14 09:10:32.907	2026-06-14 08:10:30.613196
0adb8f0f-6169-41df-9b13-0e911dd250cd	acfb60ea-3913-48b5-9045-fc1a8fac9986	41057a45eb692dcc4c291032cda684b8b3b83465351104455377f1e2aa1006b7db60410ae1beff1e8baf5828b3b515feb18bd86b62187c98dcac5f0036a8cdff	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:10:32.938	t	2026-06-14 09:29:25.707	2026-06-14 08:10:32.942199
06a44b34-107f-4db2-aa1d-40183c41e1ac	acfb60ea-3913-48b5-9045-fc1a8fac9986	bfd86c8970dfc01568eb01e63b062b9c1ac4b9a86c008b44a792639928846d5be783d66bc074b9a5ecf8df6c73b80b84224772531bf4af9c5c653e1c1536f3e1	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:29:25.871	t	2026-06-14 09:29:27.732	2026-06-14 08:29:25.874038
f8fe3d5b-9281-48a1-a1cc-1bc53d3856b5	acfb60ea-3913-48b5-9045-fc1a8fac9986	94771a20566e670282d5d8ec1d6410ba3d645f1fa6b7843f1cf1f65603c8ce2fce50dcbd14cf392531bb2347566a9c8946b0f709d16fcc9cb47d569f61eb143e	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:29:27.81	t	2026-06-14 09:29:30.391	2026-06-14 08:29:27.812466
20b60220-4889-474f-9fc8-d6d242e033ef	acfb60ea-3913-48b5-9045-fc1a8fac9986	96d6cbacc10f2d9730896b5f86f1d8f17037207c2c24159d23dc897ec42cdd80eff437153d934d5cc65a9e2a8cc244e4dffa0ee1051f7d1fe5764db4061e561d	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:29:30.539	t	2026-06-14 09:29:49.17	2026-06-14 08:29:30.55607
5fe510ea-cbea-407a-93f7-2862551ead07	acfb60ea-3913-48b5-9045-fc1a8fac9986	32e516fb106eaf183fe01f22d6db72b355f1c6be8a2b6f09dedf9687c59490532e3cff0f2dcc72f8493162142760b58d08337f95325cd4b15d2814ee02d21034	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:29:49.267	t	2026-06-14 09:29:52.258	2026-06-14 08:29:49.268414
da23d2df-543c-48ad-82f7-cdf5143d17dc	acfb60ea-3913-48b5-9045-fc1a8fac9986	d2fe5983f1d539816ae9f92a9e6a2bacee3d1c18fa4c0ed814c4490de3d3db5477b8458ff5ff58581c0fdaee011c349562b8930fe6b9d4f0f5a5ae3c729000ec	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:29:52.337	t	2026-06-14 09:29:54.959	2026-06-14 08:29:52.339256
8e3b4333-d50c-4844-acb6-305ed8022fa4	acfb60ea-3913-48b5-9045-fc1a8fac9986	7323e96db4514ec8186080e31d5bd2136d248428d19e04706673f574dc1f8bcdc1bb7ac3ffa1316bc229928cf2ae8c779935d91e56999e2ee19b07e25c93a42d	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:29:55.033	t	2026-06-14 09:30:27.785	2026-06-14 08:29:55.034437
88d1497c-ac14-4885-9603-375aeaa5c153	acfb60ea-3913-48b5-9045-fc1a8fac9986	9d9c03e80c0e29ec6de868bf81f6a2a4730393c2d3a94c5ad505a2c34a1a76dd07496e1d05e32931fa1335b67f0604ba24b04d914a054e6fa0fa2c77cb1006bd	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:30:27.964	t	2026-06-14 09:30:29.372	2026-06-14 08:30:27.96732
ac8a5222-8b2f-4c7c-821b-21d5f4f831eb	acfb60ea-3913-48b5-9045-fc1a8fac9986	6817b2b7b93b510e7b0bf119db4eef35ab78ce63aff289929591bfd899c4c7a352044e2dd9141477ffbaf686bebb2f0df0922e78c7cc44d49c8d900685644cba	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:30:29.424	t	2026-06-14 09:30:31.747	2026-06-14 08:30:29.425741
5ca0391e-ba0c-4395-8f5c-bfad73246c95	acfb60ea-3913-48b5-9045-fc1a8fac9986	07a60682b93da7af8b63798ee1bfdec58d3a273468c47ac090cd4f9ab009e4a803f61a4bd7b0ffa535c866ee957fe35d24828b4db485a0178a3a75b34172ccc5	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:30:31.836	t	2026-06-14 09:57:34.939	2026-06-14 08:30:31.848632
886eeace-14f6-4068-ad3f-9044bba3e668	acfb60ea-3913-48b5-9045-fc1a8fac9986	7e065b74b8455a957ae9774c92662493453f81bded1cb2594c83f8a44f5242ef6af48e575bc5b561de3b95ef29dfbb6b6cff4dd57c57a68973dbd39781cec297	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:57:34.978	t	2026-06-14 09:57:37.169	2026-06-14 08:57:34.981325
2ad701a7-f4a6-4091-8644-bd7399aae872	acfb60ea-3913-48b5-9045-fc1a8fac9986	5acfb5cefbd54e3d08e7f220b062a306511ea286c02963d1e7541d581d23a87dec2d0adea5d37cc8c5b6044671b0f4b53409cb9af05bf13183a7bdbd072dfdb9	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:57:37.185	t	2026-06-14 09:57:39.259	2026-06-14 08:57:37.186768
f5f79d29-ce24-42a4-9faf-764bd5f0f9b6	acfb60ea-3913-48b5-9045-fc1a8fac9986	125fbc5fbcad8c03c0af3310daf1d0fdd2569f6a80d6ec6c3bf06cf040da24ad8d851059b1aac8429da69ccb0c23704b15469692a3e8b6c62bcecd18450cdde0	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:57:39.278	t	2026-06-14 09:57:49.794	2026-06-14 08:57:39.279787
7d7fb002-dc24-4599-b745-f06dbc361667	acfb60ea-3913-48b5-9045-fc1a8fac9986	0322cd98dbb4d6edfca2b8ba54549bea579fd2c5343cfaff01b2404187f93062370f58c0b2b188a32997179a1199073f19ed4b4c6b8daeb8d08e670c8361ae5a	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:57:49.823	t	2026-06-14 09:57:50.935	2026-06-14 08:57:49.824855
0d8f28e6-a3ac-4b03-b112-699eb5773686	acfb60ea-3913-48b5-9045-fc1a8fac9986	3d81552e003ba10271dd34ab53f699c542b9767774769d2dd7aea49852effcdc91cfb7621bc6a7dacf210af176aa71585846650f7dcbb964ca9d007010fdd4fb	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:57:50.95	t	2026-06-14 09:57:53.006	2026-06-14 08:57:50.951028
b92e8451-a8d1-4337-85b2-8119d597dab4	acfb60ea-3913-48b5-9045-fc1a8fac9986	a63130befa9b6ea1c8a7471785686f6f11608f5ba647c9b17dd1e6dff92a5d4d670185db2a49651742a1bbbe70dbdaab1ab0d2eaadbe8f3c64d735fc44e36937	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 09:57:53.019	t	2026-06-14 09:59:52.767	2026-06-14 08:57:53.021521
fb17948a-a650-40ac-8e9f-b8b900ece4de	acfb60ea-3913-48b5-9045-fc1a8fac9986	b689321e0a9a9910dfc56eff5b2d0b4d064c590f656f3f772b72d2d92272866b2a74f953b219ccdda8f82f7113f08af87f59e3246c2c9f6c166a0484ea878007	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:00:16.666	t	2026-06-14 10:00:21.221	2026-06-14 09:00:16.668628
86cf0b44-6a56-41df-930b-17c69423a587	acfb60ea-3913-48b5-9045-fc1a8fac9986	7284e011114218351f03bfc2ff741843a7dd939c1dc068a5f50c19033a023a29b403070d530ac67e766cf3c3d6d765f15e70d27d18b9f584de7a1ae1ab5d41ca	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:00:21.328	t	2026-06-14 10:00:23.531	2026-06-14 09:00:21.330565
846a57b3-7506-450d-b38c-078723d72ec2	acfb60ea-3913-48b5-9045-fc1a8fac9986	5d4dd32c633bbb73a60c5f5c413198e1b946800e5280fcc6e5c45eedf26ad28ec0faf750400fbf513c7d3af4f0786491e20f15e30c6ac693c339b75250928ee4	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:00:23.557	t	2026-06-14 10:00:35.347	2026-06-14 09:00:23.55922
1ce08ef9-ae29-4af4-be16-6afa160ae36e	acfb60ea-3913-48b5-9045-fc1a8fac9986	96cdb5121d24d2285276b088c17607e403e921eca5cd04ad5411a0d4ac4c9ff390ecd9a7e30ad327897b57440c12169388196252b261aee499e963948f3b0ba0	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:00:35.392	t	2026-06-14 10:00:36.881	2026-06-14 09:00:35.393974
e93adf4a-78c4-4d45-8845-770efb34e3b7	acfb60ea-3913-48b5-9045-fc1a8fac9986	c2ffc6327cd09d33ed437229871e100ab9dee7aa064f7b35a7a4b2df51c54d1ea8e55e1d5d2c7544b42ed928eac71f26b179c97c630cf6b6b5af7143ef1e0e0b	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:00:36.902	t	2026-06-14 10:00:38.988	2026-06-14 09:00:36.903677
1a591d88-ee5d-4069-876d-4e64a501b85e	acfb60ea-3913-48b5-9045-fc1a8fac9986	68d09b0d89ba3ab2b6343ecf27b25efae85879b850ad0f32743601e4da8563b04918fc822f7210d22b643a1147a8a3d4b5f826cf9c2fa801a5b3b5c442fed886	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:00:39.005	t	2026-06-14 10:02:42.126	2026-06-14 09:00:39.008245
8d7f3660-af08-456d-9ed0-2bf4f6b1da0c	acfb60ea-3913-48b5-9045-fc1a8fac9986	96b2148564aa5409ab99259adfaa75ffb81d649283b16369ea9f025cc2a4fa3d06510cec21468f32be8ad49a0a55a0f1c5d985a2a88224a5d1d388fbe611c6e6	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:02:42.153	t	2026-06-14 10:02:43.542	2026-06-14 09:02:42.154385
40be6888-e9fd-497b-9768-a337c4cbe6c3	acfb60ea-3913-48b5-9045-fc1a8fac9986	68e2e7961c9c50a9bb3aa390adb817aa60bfcfb32257b94e5c0b5e2877d3190a73d47cbedd351953cca191d4df872b592b3902751e9e2b62df83edd1e9213806	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:02:43.578	t	2026-06-14 10:02:45.776	2026-06-14 09:02:43.579705
f8cf8d0d-f9e7-4257-b082-836718a19a03	acfb60ea-3913-48b5-9045-fc1a8fac9986	e6a504349379cb36e4be3f8943e21a28e8aa2681c9fee76449e21af85ceb454bac04335e20a636b4efc7b031b7952f81e3a8fb1b9663bd2299cfefa5974eed0a	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:02:45.832	t	2026-06-14 10:02:48.9	2026-06-14 09:02:45.836911
dd9231cf-fd06-4e4c-bebc-fec3ea70ae1c	acfb60ea-3913-48b5-9045-fc1a8fac9986	07fb17d3613b7d127620a421ef7194eaa0e687ce5d0a28eec7c9f4e6081afdeaee88cae845ea364f2a3c68f4795e30dcde1b43b8487917e9ab37c33868caffee	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:02:48.923	t	2026-06-14 10:02:50.308	2026-06-14 09:02:48.925844
f017da7f-afa0-4db1-86b2-edbb34adbe9c	acfb60ea-3913-48b5-9045-fc1a8fac9986	71fd82ba12e7316027137a0f0965a64641ce3ae5c7ba13f69502e402a911e48b8e63ce9725d6bc6b37a979cdc666950b22881525e07ea3e094cfa76c9170eddb	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:02:50.322	t	2026-06-14 10:02:52.377	2026-06-14 09:02:50.323036
298fa0c4-9b67-4fa7-bf52-233b26beb2e3	acfb60ea-3913-48b5-9045-fc1a8fac9986	1439ae53ed0c46a10817a6b8eba61f10faa86a43447fc6c0c765700b80c357087608daf9b0e958e80b0b5c8e4d54f8c200c36a2d9f13f4022f017fa27f2c4e52	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:02:52.392	t	2026-06-14 10:02:57.036	2026-06-14 09:02:52.393118
9c21eccb-79e7-43e2-8466-947eb5633877	acfb60ea-3913-48b5-9045-fc1a8fac9986	f9447e7c75c50e33f4a5417a93656ea7b29893382a50cf866159b81dd23ff5047f04c3747cd036a842fbce5b1b2f41487020c4ff0ef04ebb98b8a663100a7418	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:02:57.061	t	2026-06-14 10:02:58.206	2026-06-14 09:02:57.062597
6c31737f-0725-4981-8d9d-8520357b68c3	acfb60ea-3913-48b5-9045-fc1a8fac9986	cb975b232d2bc4123f24eefc5374e0104633e004ef91011eb13cabab8aa1e785db1deeeb6b4307b0987712586804a2605319f486c908221ce832c934d2315d27	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:02:58.238	t	2026-06-14 10:03:00.404	2026-06-14 09:02:58.24008
ad2f7f24-258c-49b4-bc9f-7860f270d1d1	acfb60ea-3913-48b5-9045-fc1a8fac9986	9610e42a3747d9b74878fe61c7cef709a9294aede5a654a39bffe5fff8e71a324784dd21c745570377296fc21c68c4d2d01557687730dbc2439a17cd9442809c	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:03:00.423	t	2026-06-14 10:03:01.604	2026-06-14 09:03:00.424573
8a00e16b-2ebf-4e86-b5af-3a86c93cfbf1	acfb60ea-3913-48b5-9045-fc1a8fac9986	5c83a7aca8bcd3f1c172097aada6ffd27eaa2ef27885c2f5df4447fa14cc77465383255f4dec237d4a3979ccb1a9081aa37bf8c25a0135bad6d8be136c7a432c	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:03:01.625	t	2026-06-14 10:03:03.019	2026-06-14 09:03:01.626675
9629e573-3f4c-4720-8b2a-d427a7c37e92	acfb60ea-3913-48b5-9045-fc1a8fac9986	1def6b513f50a49eba67d75de8eacfa64fd61a2ab238fabd9e4e74d65917d32d37d28a5899e3df86f1219af8e04c0187196e0ecba421b8b86510e89a337e53b3	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:03:03.039	t	2026-06-14 10:03:05.125	2026-06-14 09:03:03.040034
b32a19e4-6755-49b5-a1c1-c8e59e0bf5dc	acfb60ea-3913-48b5-9045-fc1a8fac9986	6fb293a950d3f1741a7cd9f6f01c8069302d447fdf947fbee15b58ba6483f04590cdb54d4cdd3aca405d271b02ae14b86a3926eac9ada9d74566ec32ed324f95	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:03:05.138	t	2026-06-14 10:05:37.981	2026-06-14 09:03:05.139444
a3988ea6-34e1-43a4-a3a3-d6ecb5ed18ba	acfb60ea-3913-48b5-9045-fc1a8fac9986	e25a807a715bf4e063749f23a483a5a852637ebd2b5473bb97731d8e1ccd7b14ff87871c5c4ee561959db3907e6a8e43a72abfe1d5d169f5a46d145dadb9ee98	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:05:38.017	t	2026-06-14 10:05:39.677	2026-06-14 09:05:38.022651
8d27b666-6ba4-44bd-b1c0-b01c2c1525df	acfb60ea-3913-48b5-9045-fc1a8fac9986	a61fd87671beb0f8eb2057df2f5bf451fadc7f29c202d2f930af0f93f7e4e31a6770d66e0ef9e5b4cfad1582d7235dda0417b2f8b76fc08e2ed8ab7ee6076720	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:05:39.716	t	2026-06-14 10:05:41.854	2026-06-14 09:05:39.718689
7eaf2d1a-3d27-47c4-ae4d-770a526aae73	acfb60ea-3913-48b5-9045-fc1a8fac9986	8f69038e28e26aef05ceef387add4c1d874f516a4910b295ace6ce046bb0beaafbca715f21f05980d8fc3bf696a2f4e0eb45aa2b237f689e1f09fea6b36cdab9	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 10:05:41.873	t	2026-06-14 12:35:31.728	2026-06-14 09:05:41.874566
f2b61d27-2a86-4a10-ad17-8f92baf8688f	acfb60ea-3913-48b5-9045-fc1a8fac9986	3a81406b0a262fe57891cf47a3128b2334149609291a070c18c96c916291d5e6762df34b9aba7ba66a409171d3801fbbfce892738f8d410f87d5c6ec7c14631d	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 12:35:31.805	t	2026-06-14 12:35:33.877	2026-06-14 11:35:31.807434
08d9faa7-09be-47bc-a37f-482bcb15b819	acfb60ea-3913-48b5-9045-fc1a8fac9986	b078f946b47f87bff7ca8f18a53ef43fdca21404299e8eabfc7a25590ee2a6549ce8190a6e1950dada1f8048f5f71b9b99047a86331623ab0e2eb2a545878909	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 12:35:33.915	t	2026-06-14 12:35:36.189	2026-06-14 11:35:33.917585
a334e127-9aed-4e40-bab9-d2b4513d79a6	acfb60ea-3913-48b5-9045-fc1a8fac9986	3405e49830e238e56f3973a1f46c0ae4840ae324ef478f8c6793b6d4edc7f0b26436b57c7406244d07714a7f403a45e723efbbcedd678cc49678bcb7f61a0744	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 12:35:36.237	t	2026-06-14 12:35:42.347	2026-06-14 11:35:36.248577
e1b324b6-7ee4-4b89-b631-04d716f0c0f7	acfb60ea-3913-48b5-9045-fc1a8fac9986	bb271bf24ec35e93f6ac0a42d780097e0915583b755992f6890dd29f777b48608849e9760d49f89639d66a0976bd8a35a7afc207d60f94ff1714aaae2d29661c	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 12:35:58.935	t	2026-06-14 12:36:01.606	2026-06-14 11:35:58.939175
191d0878-90c8-46e5-af0e-d1b85974751c	acfb60ea-3913-48b5-9045-fc1a8fac9986	3e2d0a1e3d5cdaf48590ba015562995373ac25ec3b64dee3c8bda51058d88d3802fd9154c50fd989228abbb5f354b4bf9258e57cf5fbd1c5f12d07dbfd488e39	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 12:36:01.662	t	2026-06-14 12:36:02.765	2026-06-14 11:36:01.663435
8cad5fe3-c038-43ad-93ba-dbe2d44cb13f	acfb60ea-3913-48b5-9045-fc1a8fac9986	645b37602b8e9c669a123fefa2949db49ec093f327b13ae408e22575f58b75917d818423b052c782d955a7311be0f7c414bddce78bc231dc8e997199433ce94a	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 12:36:02.777	t	2026-06-14 12:36:17.725	2026-06-14 11:36:02.778937
3d4f465b-fd03-4927-837b-78567d641ef2	acfb60ea-3913-48b5-9045-fc1a8fac9986	f41841184f623c0b636e0632f300135dd003946d060ac9504b551f3f9fd3017ee9e0d3fc2a951008f64102d28a3a1ff59d4fbd6d8e516c0c34284b5f95c8ad43	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 12:36:17.764	t	2026-06-14 12:36:18.886	2026-06-14 11:36:17.768792
9e5bf724-f5c1-403b-9359-ad2e7046c57b	acfb60ea-3913-48b5-9045-fc1a8fac9986	719eea88805196c6e2edbc89f607268b09986bffeeff406d773c3910412b8ef38596c8ead27c0e9d8954b96d65bf41ef9a725f9bf7e4cb002f9a209f2e386210	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 12:36:18.914	t	2026-06-14 12:36:21.025	2026-06-14 11:36:18.915124
62bc8481-4c1c-441d-9fb1-6f3508d7eb82	acfb60ea-3913-48b5-9045-fc1a8fac9986	274311c9e6911133310a96c1bafb79542f2b14e34b296ea39b2c2cd08ec8751d5e833a0fce8058c4da17b67c4fdc07ec574d1e8f7a4e7dbc293328c779e605bc	::1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-07-14 12:36:21.042	f	\N	2026-06-14 11:36:21.043328
\.


--
-- Data for Name: regles_scoring; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.regles_scoring (id, nom, description, type, evenement, points, actif, "createdAt") FROM stdin;
\.


--
-- Data for Name: regles_scoring_personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.regles_scoring_personnel (id, "etablissementId", code, libelle, description, "typeAction", "pointsAttribues", "estAutomatique", "estActif", priorite, "conditionsSupplementaires", "categorieCible", "typePersonnelCible", "dateDebut", "dateFin", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: relances_paiement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.relances_paiement (id, "eleveId", "echeancierId", "numeroRelance", "dateRelance", "typeRelance", statut, message, reponse, "effectuePar", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: remises; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.remises (id, "eleveId", "fraisScolariteId", "typeRemise", "scopeRemise", "classeId", "cycleId", "sectionId", pourcentage, montant, motif, "validePar", "dateAttribution", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: requetes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.requetes (id, numero, "demandeurId", type, sujet, description, statut, "piecesJointes", "niveauxApprobation", "niveauActuel", "approbateurId", "commentaireTraitement", "historiqueApprobation", "dateTraitement", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: responsables_eleves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.responsables_eleves (id, "utilisateurId", "enfantId", "lienParente", "responsableLegal", "peutConsulter", "peutPayer", email, telephone, adresse, profession, "lieuTravail", "telephoneTravail", "emailTravail", "adresseProfessionnelle", "revenuMensuel", "personneContactUrgence", "telephoneContactUrgence", "autorisationSortie", "autorisationMedicale", "dateAjout", actif, "updatedAt") FROM stdin;
\.


--
-- Data for Name: role_limitations_etablissements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_limitations_etablissements (role, "maxEtablissements", "peutChanger", "necessiteValidation", description, "creeAt", "majAt") FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions ("roleId", "permissionId") FROM stdin;
cb3d362c-108d-4a7c-8c2a-25f10599c832	91636e6b-00c5-49b4-abf6-6764099c775e
cb3d362c-108d-4a7c-8c2a-25f10599c832	a36f9f85-48f1-4227-9a1b-74bb8ae0b785
cb3d362c-108d-4a7c-8c2a-25f10599c832	8a9338d1-b719-4923-82c4-7a27bdf91730
cb3d362c-108d-4a7c-8c2a-25f10599c832	3546065a-9fec-4150-9bca-6391c78f3a51
cb3d362c-108d-4a7c-8c2a-25f10599c832	3a9e43ea-dabe-400b-96a8-8a7c5474369d
cb3d362c-108d-4a7c-8c2a-25f10599c832	d23d1147-1a5f-4110-ac99-cc9c7aa71bcd
cb3d362c-108d-4a7c-8c2a-25f10599c832	63a86b96-da1c-4153-842e-a12f62cadc2e
cb3d362c-108d-4a7c-8c2a-25f10599c832	e34859da-4a33-4d94-9e36-b281728720f5
cb3d362c-108d-4a7c-8c2a-25f10599c832	b7035ff6-b391-4531-87d6-dea2be285dc2
cb3d362c-108d-4a7c-8c2a-25f10599c832	3f008e8f-1621-4081-8281-d5bcec928031
cb3d362c-108d-4a7c-8c2a-25f10599c832	c234a053-2b3e-4dff-afb9-adb5b2f060a8
cb3d362c-108d-4a7c-8c2a-25f10599c832	7de2c572-a4f2-440d-bee0-f245c1158026
cb3d362c-108d-4a7c-8c2a-25f10599c832	6d6bf91a-6c54-4cac-9a1e-b07185374754
cb3d362c-108d-4a7c-8c2a-25f10599c832	471f24ca-2351-4584-b37c-468165c75887
cb3d362c-108d-4a7c-8c2a-25f10599c832	a9c2c530-00cd-4736-a6ea-2694470b05c0
cb3d362c-108d-4a7c-8c2a-25f10599c832	0fabf802-9483-447e-848b-824a2921de1c
cb3d362c-108d-4a7c-8c2a-25f10599c832	06ec2606-fa89-4993-81ce-dbfba83ff1f0
cb3d362c-108d-4a7c-8c2a-25f10599c832	3c94930e-75e7-4563-af3f-de12d7f8c05c
cb3d362c-108d-4a7c-8c2a-25f10599c832	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
cb3d362c-108d-4a7c-8c2a-25f10599c832	0e4ce8e2-f5a7-44a4-91e2-c8157ff57e61
cb3d362c-108d-4a7c-8c2a-25f10599c832	f1f00f22-645d-45db-ba6d-2950512b07e1
cb3d362c-108d-4a7c-8c2a-25f10599c832	f763674b-1d85-4496-b043-145082ce0e26
cb3d362c-108d-4a7c-8c2a-25f10599c832	897b0471-cb96-49de-826c-b9b8c512a342
cb3d362c-108d-4a7c-8c2a-25f10599c832	c4ddbff4-ec44-4577-9ccb-daea3386a1b9
cb3d362c-108d-4a7c-8c2a-25f10599c832	ed04e05e-8e12-438e-b408-d40d5387224b
cb3d362c-108d-4a7c-8c2a-25f10599c832	4b9f486f-f658-474d-ad00-24021b370f26
cb3d362c-108d-4a7c-8c2a-25f10599c832	f4cf7336-f959-4bb7-b1a6-a3e957a258ad
cb3d362c-108d-4a7c-8c2a-25f10599c832	dd1597d0-6222-412b-82d3-b4395b00b4c9
cb3d362c-108d-4a7c-8c2a-25f10599c832	3396ac25-2554-407b-9e72-a765be3778e7
cb3d362c-108d-4a7c-8c2a-25f10599c832	d2aa621a-a65e-46c1-b910-c4fb4c84259c
cb3d362c-108d-4a7c-8c2a-25f10599c832	986d7a7c-e776-4184-b1bf-330b5a464bc3
cb3d362c-108d-4a7c-8c2a-25f10599c832	e5716b20-c81f-4b10-b893-3f1f75443ab6
cb3d362c-108d-4a7c-8c2a-25f10599c832	11b3df62-bc67-485e-8e1b-54ec0e79170f
cb3d362c-108d-4a7c-8c2a-25f10599c832	7b0f0dbb-ceea-48f7-bdf5-113a2217b46a
cb3d362c-108d-4a7c-8c2a-25f10599c832	81132ccb-4aa4-449b-8a23-5c634143aa9b
cb3d362c-108d-4a7c-8c2a-25f10599c832	6ddfb745-3b51-40a6-a4ac-f2080b03e24d
cb3d362c-108d-4a7c-8c2a-25f10599c832	b45ea352-7845-4840-aa5c-d418a0ce07f9
cb3d362c-108d-4a7c-8c2a-25f10599c832	7b586363-f258-4a87-b029-bc736799a8b1
cb3d362c-108d-4a7c-8c2a-25f10599c832	f0b2b4b2-3e40-49ac-97fc-a37da39e92ce
cb3d362c-108d-4a7c-8c2a-25f10599c832	635999fc-7e32-44b1-925a-3f087df671b4
cb3d362c-108d-4a7c-8c2a-25f10599c832	c179e317-1fee-4e43-9405-700d4f494722
cb3d362c-108d-4a7c-8c2a-25f10599c832	a2b48da4-112b-49ef-8749-67396833e065
cb3d362c-108d-4a7c-8c2a-25f10599c832	fadaee92-2617-44c0-88ce-af35c1b82f0c
cb3d362c-108d-4a7c-8c2a-25f10599c832	77e37a07-5d49-4a2f-be8e-add64fc1bc7b
cb3d362c-108d-4a7c-8c2a-25f10599c832	1a3790b0-7ffb-4a51-97b5-280ce0356350
cb3d362c-108d-4a7c-8c2a-25f10599c832	ce63e7d1-7d47-4f15-85b2-e56c4011d9b7
cb3d362c-108d-4a7c-8c2a-25f10599c832	04f8e4dc-aea8-4f61-ad4b-1b3d45f1a3d6
cb3d362c-108d-4a7c-8c2a-25f10599c832	f04a0038-2018-4630-ab78-7b07916005b5
cb3d362c-108d-4a7c-8c2a-25f10599c832	e9a3b8c9-e203-4d4c-a7da-21321e793e31
cb3d362c-108d-4a7c-8c2a-25f10599c832	7b2423cd-bf7c-4831-9498-72ffbde8f013
cb3d362c-108d-4a7c-8c2a-25f10599c832	9bdac62f-7c29-4fa0-ae8b-bfb064b14d15
cb3d362c-108d-4a7c-8c2a-25f10599c832	27fcbeb7-7c1a-42ab-84f1-93f374fe6b06
cb3d362c-108d-4a7c-8c2a-25f10599c832	ff7f0cef-478c-4c19-83b6-6b90bbdffd8d
cb3d362c-108d-4a7c-8c2a-25f10599c832	500d006d-1ab4-45d0-96a1-7a3fe7b10dbd
cb3d362c-108d-4a7c-8c2a-25f10599c832	bedd5e5b-4400-4986-ae3b-7ad3858f6f74
cb3d362c-108d-4a7c-8c2a-25f10599c832	52746f05-e3c0-4729-9b9a-999edbd7cf0f
cb3d362c-108d-4a7c-8c2a-25f10599c832	73deac03-ecdb-43a1-848c-d029f9368edd
cb3d362c-108d-4a7c-8c2a-25f10599c832	c059adfc-f02b-4162-9dcf-2e78bb0e6563
cb3d362c-108d-4a7c-8c2a-25f10599c832	3be25b28-914e-4abd-9a3b-eaa25ee3b6c3
cb3d362c-108d-4a7c-8c2a-25f10599c832	02db5dbc-3743-4e27-ac65-76778236a4e0
cb3d362c-108d-4a7c-8c2a-25f10599c832	89654873-7ba9-40eb-9efb-ce6cb073f262
cb3d362c-108d-4a7c-8c2a-25f10599c832	52e4562c-6ed7-4245-9487-23a8b19f2bb4
cb3d362c-108d-4a7c-8c2a-25f10599c832	8a0eba4b-01b9-49ef-93bb-ac6b191c07a4
cb3d362c-108d-4a7c-8c2a-25f10599c832	d8187574-fd69-4bf3-a625-50bddd25436c
cb3d362c-108d-4a7c-8c2a-25f10599c832	0f8365f6-d8ed-498a-a870-ed260488b6cb
cb3d362c-108d-4a7c-8c2a-25f10599c832	3682c9da-cda6-4457-83d8-146463d667da
cb3d362c-108d-4a7c-8c2a-25f10599c832	8ebaeff4-62b7-4f45-b5ac-4f3a17a3997e
cb3d362c-108d-4a7c-8c2a-25f10599c832	aee67a82-6934-4ecc-aa6a-039460732519
cb3d362c-108d-4a7c-8c2a-25f10599c832	9ebe15fc-98f8-46cd-83a1-6987019332b8
cb3d362c-108d-4a7c-8c2a-25f10599c832	a178e3db-09b0-4eb3-b7e2-8e0acb4eba95
cb3d362c-108d-4a7c-8c2a-25f10599c832	af88ed12-c969-4368-b5ed-04ee9bc3c7c0
cb3d362c-108d-4a7c-8c2a-25f10599c832	f98dafb2-e23f-438c-acc7-8f287c636fa9
cb3d362c-108d-4a7c-8c2a-25f10599c832	824abaec-eb96-44ba-a75f-0cd635364ee1
cb3d362c-108d-4a7c-8c2a-25f10599c832	aa552cf9-c553-4e71-873a-f18d1c0ef1fd
cb3d362c-108d-4a7c-8c2a-25f10599c832	cb993d1a-83ef-4e37-875c-55ebc944430f
cb3d362c-108d-4a7c-8c2a-25f10599c832	6b270a19-b092-415e-8685-d393dc86f768
cb3d362c-108d-4a7c-8c2a-25f10599c832	c90d596a-5065-4463-86b5-74b4f3ba70f8
cb3d362c-108d-4a7c-8c2a-25f10599c832	681a2d1c-f593-4ab3-ba9d-39b0430ce557
cb3d362c-108d-4a7c-8c2a-25f10599c832	4d914621-52e5-4469-92d9-2c3fa251dfdf
cb3d362c-108d-4a7c-8c2a-25f10599c832	00a29d57-ec65-4976-90a2-4aa11cb33d1f
cb3d362c-108d-4a7c-8c2a-25f10599c832	0d905c43-b93b-4f35-9f97-3578d51c1559
cb3d362c-108d-4a7c-8c2a-25f10599c832	3fbc63b1-07b8-4ff4-916e-404bbc2639b6
cb3d362c-108d-4a7c-8c2a-25f10599c832	d9a28da6-a08c-447f-919c-c4138dcc6a9b
cb3d362c-108d-4a7c-8c2a-25f10599c832	4a1529c4-7b4a-4b17-b724-98247b2fea37
cb3d362c-108d-4a7c-8c2a-25f10599c832	1a85abec-a7ee-4857-b3be-7eff4f0296a8
cb3d362c-108d-4a7c-8c2a-25f10599c832	f16490c2-5694-48c7-a867-dbfa6cd87f7e
cb3d362c-108d-4a7c-8c2a-25f10599c832	3f9cebb9-b3ae-4241-a670-9aabcfe4771c
cb3d362c-108d-4a7c-8c2a-25f10599c832	a8732045-7596-4d18-8301-462527505582
cb3d362c-108d-4a7c-8c2a-25f10599c832	9ba01bed-5fa5-4879-9b55-24cd0afe4966
cb3d362c-108d-4a7c-8c2a-25f10599c832	408e9272-2b58-49f6-b7da-8686278ba101
cb3d362c-108d-4a7c-8c2a-25f10599c832	a68149f0-e9e6-462e-8ec1-3a6b893b8333
cb3d362c-108d-4a7c-8c2a-25f10599c832	04f0828a-2f0a-481f-9ada-112df99aa4c7
cb3d362c-108d-4a7c-8c2a-25f10599c832	63303fec-1423-48b9-ae66-8971bc9a7d9f
cb3d362c-108d-4a7c-8c2a-25f10599c832	ba46fdfb-cada-4245-8130-314997c3c95c
cb3d362c-108d-4a7c-8c2a-25f10599c832	484bb4c6-bd4c-4e9d-8b99-ff43d59c5f97
cb3d362c-108d-4a7c-8c2a-25f10599c832	ccabc83a-7084-4d5d-b2fb-c7e65c0c3c25
cb3d362c-108d-4a7c-8c2a-25f10599c832	f627d602-9494-417d-a266-c11889f5e6e6
cb3d362c-108d-4a7c-8c2a-25f10599c832	75c336e4-87f6-42d0-aae1-a4334fdd0dff
cb3d362c-108d-4a7c-8c2a-25f10599c832	f947c8db-db72-4002-b7af-949c3180b802
cb3d362c-108d-4a7c-8c2a-25f10599c832	af94a842-c7fc-4b36-ab7b-25d0aa51e480
cb3d362c-108d-4a7c-8c2a-25f10599c832	5d4f7e63-6d25-4441-baba-2f37b09a4dcd
cb3d362c-108d-4a7c-8c2a-25f10599c832	6999cefc-6f94-4f82-9323-9b9692cfe23f
cb3d362c-108d-4a7c-8c2a-25f10599c832	fcb2302d-3dc4-48e0-8a8c-22994b85e528
cb3d362c-108d-4a7c-8c2a-25f10599c832	27b89e6e-2496-4645-9adc-2976d70e2a81
cb3d362c-108d-4a7c-8c2a-25f10599c832	7005b482-dc6b-4592-a340-b071f24c6927
cb3d362c-108d-4a7c-8c2a-25f10599c832	5d04c5e0-958f-40a7-b156-23507835745a
cb3d362c-108d-4a7c-8c2a-25f10599c832	2b28e972-880e-4e36-898d-07c2b8c34ac7
cb3d362c-108d-4a7c-8c2a-25f10599c832	509224ce-8b72-4a85-89b3-465e10492f4e
cb3d362c-108d-4a7c-8c2a-25f10599c832	c833cd4c-e93b-4ef6-bd65-c8a20af9cef1
cb3d362c-108d-4a7c-8c2a-25f10599c832	e8087e70-fbee-425d-bc43-ef330185c140
cb3d362c-108d-4a7c-8c2a-25f10599c832	91fc7858-09a7-426c-b3d4-4f4200d99204
cb3d362c-108d-4a7c-8c2a-25f10599c832	e8716c87-656c-40bd-8269-9b86fe0ee185
cb3d362c-108d-4a7c-8c2a-25f10599c832	ae01562e-cb04-46a9-a821-cb349d243448
cb3d362c-108d-4a7c-8c2a-25f10599c832	b114f108-e2d0-4322-9c8b-52684117e9c9
cb3d362c-108d-4a7c-8c2a-25f10599c832	75eac99a-2928-45ae-9f0b-050044c8a58e
cb3d362c-108d-4a7c-8c2a-25f10599c832	a319c24d-d196-4f9e-8007-6dd4b1f9f5eb
cb3d362c-108d-4a7c-8c2a-25f10599c832	48924f3d-2393-41ea-853d-b4e69bd57de5
cb3d362c-108d-4a7c-8c2a-25f10599c832	9cfd3e00-712b-4e13-b1e8-790b37026d83
cb3d362c-108d-4a7c-8c2a-25f10599c832	a1a7e2c0-af52-490d-b0fd-a86be023c202
cb3d362c-108d-4a7c-8c2a-25f10599c832	5f3359bf-3477-4d7e-934f-8bc79c7786e1
cb3d362c-108d-4a7c-8c2a-25f10599c832	52d175a2-ed50-4e88-a905-74a303739d67
cb3d362c-108d-4a7c-8c2a-25f10599c832	84a4116a-e388-4695-beb1-858dddcbe9b0
cb3d362c-108d-4a7c-8c2a-25f10599c832	d59a4a41-08aa-4db2-8c0b-0f26e19b493f
cb3d362c-108d-4a7c-8c2a-25f10599c832	6c1bf982-23a8-403d-bdc0-c89c976601b1
cb3d362c-108d-4a7c-8c2a-25f10599c832	ee4e4e23-cd64-414d-bba0-6dd609f9c973
cb3d362c-108d-4a7c-8c2a-25f10599c832	a4eeabe2-6d29-406a-a4d6-9445c1faeb70
cb3d362c-108d-4a7c-8c2a-25f10599c832	5eef00bb-7222-406e-93f9-601900ec7c0c
cb3d362c-108d-4a7c-8c2a-25f10599c832	72a7b751-b2b4-44bc-bfc5-ed4b101d17b4
cb3d362c-108d-4a7c-8c2a-25f10599c832	dec434fb-79da-4c39-8375-49791900c354
cb3d362c-108d-4a7c-8c2a-25f10599c832	e63ac65f-4003-4f7f-bf1f-3957972db08f
cb3d362c-108d-4a7c-8c2a-25f10599c832	a317995b-c64e-45c2-b8a4-a850dd06a6c2
cb3d362c-108d-4a7c-8c2a-25f10599c832	e9420a04-2b49-4954-966c-b91b67cafd26
cb3d362c-108d-4a7c-8c2a-25f10599c832	a76ca499-ec0d-40fd-aec9-1d55d0fcbfda
cb3d362c-108d-4a7c-8c2a-25f10599c832	df2fb3c7-5cb1-4077-979f-34f2b00d64b9
cb3d362c-108d-4a7c-8c2a-25f10599c832	dfb10ff9-ac1b-474c-9a43-d8598c5f3ba4
cb3d362c-108d-4a7c-8c2a-25f10599c832	7d69d441-be0f-4c5a-bc4f-8a6c089d0260
cb3d362c-108d-4a7c-8c2a-25f10599c832	dae3e013-c6cc-4f50-9fbb-71e043cc1b3f
cb3d362c-108d-4a7c-8c2a-25f10599c832	a9aa394f-9d3e-466d-8f43-e3c800456836
cb3d362c-108d-4a7c-8c2a-25f10599c832	6040a507-6889-4356-8958-2a9d168b094d
cb3d362c-108d-4a7c-8c2a-25f10599c832	d168a26f-a801-4c28-9297-9a26d6e62955
cb3d362c-108d-4a7c-8c2a-25f10599c832	7ef7c8b7-4d97-4f7b-ab30-1f5f69c20407
cb3d362c-108d-4a7c-8c2a-25f10599c832	115f9786-6c8c-49fa-8773-c9f33ddef885
cb3d362c-108d-4a7c-8c2a-25f10599c832	4c0c370d-b3bd-4734-8f80-94721ade1f6d
cb3d362c-108d-4a7c-8c2a-25f10599c832	743ad1e2-048c-4e8a-a2c2-b0bab8b7dfc1
cb3d362c-108d-4a7c-8c2a-25f10599c832	0984fd9c-cc82-46c3-9440-d203ce7b91fe
cb3d362c-108d-4a7c-8c2a-25f10599c832	c01318b6-304a-41d1-a376-d40ac746c4fb
cb3d362c-108d-4a7c-8c2a-25f10599c832	b105cda3-ccdc-4129-a876-d8b2863c103f
cb3d362c-108d-4a7c-8c2a-25f10599c832	5d786481-3bb3-4612-999f-54501bc786d3
cb3d362c-108d-4a7c-8c2a-25f10599c832	36c1ebdb-411f-4f47-a797-ab5923fce21f
cb3d362c-108d-4a7c-8c2a-25f10599c832	481089e5-2c8e-426f-bdce-4298062aafb7
cb3d362c-108d-4a7c-8c2a-25f10599c832	91bcdef4-44fd-4ac4-ac74-e90da8218463
cb3d362c-108d-4a7c-8c2a-25f10599c832	e28851da-5ea1-439e-8ae6-331c21bac638
cb3d362c-108d-4a7c-8c2a-25f10599c832	ee2e76c3-c6de-47c2-b88b-ad263d2dbd9a
cb3d362c-108d-4a7c-8c2a-25f10599c832	ee27d42d-282b-4688-8dfe-9bea12d68128
cb3d362c-108d-4a7c-8c2a-25f10599c832	fd284da0-0296-4866-99b9-7e642b9b1b34
cb3d362c-108d-4a7c-8c2a-25f10599c832	8ae07a3c-718e-4acb-95e3-4729cdee8b80
cb3d362c-108d-4a7c-8c2a-25f10599c832	64357bde-020a-49af-8ad3-9f8c139f3c07
cb3d362c-108d-4a7c-8c2a-25f10599c832	ee8d9bfa-a1fb-4bad-bb07-5b17fa08c1c1
cb3d362c-108d-4a7c-8c2a-25f10599c832	b7628cc9-8589-43ee-8b95-2b947e8f9702
cb3d362c-108d-4a7c-8c2a-25f10599c832	456b26a9-51fd-4210-be22-f4c2dd17c131
cb3d362c-108d-4a7c-8c2a-25f10599c832	91cbb291-a6a3-4e64-8954-713ff9221d8c
cb3d362c-108d-4a7c-8c2a-25f10599c832	287d635f-a266-4b59-ac8c-d45d54435684
cb3d362c-108d-4a7c-8c2a-25f10599c832	84fcc7e9-65a7-4f9c-86fc-8583b8fbddf1
cb3d362c-108d-4a7c-8c2a-25f10599c832	ca3c6233-5a58-4e96-93c9-4a2d17164ff3
cb3d362c-108d-4a7c-8c2a-25f10599c832	1d20b4e2-b48b-4d16-a8ad-0121a66a8623
cb3d362c-108d-4a7c-8c2a-25f10599c832	3210f785-5360-4def-87ad-895196191311
cb3d362c-108d-4a7c-8c2a-25f10599c832	0282cc71-2897-4181-b6a9-f555704771fc
cb3d362c-108d-4a7c-8c2a-25f10599c832	cb7c0be5-4b79-4343-a9a9-490c023a8b99
cb3d362c-108d-4a7c-8c2a-25f10599c832	19f3e749-9e70-44d2-a98c-ef553cc66bd8
cb3d362c-108d-4a7c-8c2a-25f10599c832	5e94cbd0-12e1-4976-bb89-aa741494d92c
cb3d362c-108d-4a7c-8c2a-25f10599c832	e3780b09-2c40-44fb-966f-33d2d3fb3074
cb3d362c-108d-4a7c-8c2a-25f10599c832	4478cdca-b602-4724-8a77-e268e775b53e
cb3d362c-108d-4a7c-8c2a-25f10599c832	827e2974-93b0-4190-9342-e8f706cdf171
cb3d362c-108d-4a7c-8c2a-25f10599c832	1cbe78c2-a8e2-4c1b-87e8-bfcf7318bedb
cb3d362c-108d-4a7c-8c2a-25f10599c832	98c34ccb-e2c7-4cdd-9891-a4361f385e4a
cb3d362c-108d-4a7c-8c2a-25f10599c832	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
cb3d362c-108d-4a7c-8c2a-25f10599c832	1095336e-87e8-4bae-9030-3ef31a912faa
cb3d362c-108d-4a7c-8c2a-25f10599c832	62d1e580-87c8-4809-a00d-ee56d6342b20
cb3d362c-108d-4a7c-8c2a-25f10599c832	0e4a6cca-6bca-4584-bc54-c8c8c06c7680
cb3d362c-108d-4a7c-8c2a-25f10599c832	3c369693-3dad-44e7-b7e6-3d40354e9c26
cb3d362c-108d-4a7c-8c2a-25f10599c832	33b37a0d-4084-4b82-a8c9-9d62dafbb920
cb3d362c-108d-4a7c-8c2a-25f10599c832	47de5569-d564-4921-b84d-429de1473f17
cb3d362c-108d-4a7c-8c2a-25f10599c832	19ed0257-02df-4af1-9122-4e6dba71ad01
cb3d362c-108d-4a7c-8c2a-25f10599c832	a79d87dd-cf4e-4871-8125-a5a5b9fac79e
cb3d362c-108d-4a7c-8c2a-25f10599c832	7244ebb1-17e0-4951-aa16-c59867eb6d84
cb3d362c-108d-4a7c-8c2a-25f10599c832	40147c5d-2280-4636-a152-bfb18bd3c281
cb3d362c-108d-4a7c-8c2a-25f10599c832	dbc4baea-b290-4a8d-bb2f-6427a6ed767d
cb3d362c-108d-4a7c-8c2a-25f10599c832	0596b179-f03e-4494-834c-55a1a564170a
cb3d362c-108d-4a7c-8c2a-25f10599c832	e7e92c15-5c85-48bd-ab0d-ec95c8025905
cb3d362c-108d-4a7c-8c2a-25f10599c832	6b231f55-36d2-4c65-81c3-937ec8840484
cb3d362c-108d-4a7c-8c2a-25f10599c832	e7c363e6-8387-4802-a51c-63b7169abf4b
cb3d362c-108d-4a7c-8c2a-25f10599c832	d3be48d9-5430-4ca4-9a1a-5f3298668f82
cb3d362c-108d-4a7c-8c2a-25f10599c832	2c613912-53d1-4aff-84af-f5f12f1ac81f
cb3d362c-108d-4a7c-8c2a-25f10599c832	0e29679b-4697-4838-aeab-a0da25e5cb2f
cb3d362c-108d-4a7c-8c2a-25f10599c832	5def6cc8-dcae-4216-b549-3f7e00d89efb
cb3d362c-108d-4a7c-8c2a-25f10599c832	61d883aa-a7dc-44c5-aacc-6888d521c0d5
cb3d362c-108d-4a7c-8c2a-25f10599c832	1c87ba01-6712-4537-913b-b6cb712f0447
cb3d362c-108d-4a7c-8c2a-25f10599c832	ed1fbc80-57a3-49bd-afd2-c433d37db60e
cb3d362c-108d-4a7c-8c2a-25f10599c832	71b43bcd-68d6-4a87-b6ad-1a2258fc38b2
cb3d362c-108d-4a7c-8c2a-25f10599c832	caa61bed-4640-490c-a912-63ce396e4b24
cb3d362c-108d-4a7c-8c2a-25f10599c832	8db6dc46-5054-420b-ac00-deba6cb81ac7
cb3d362c-108d-4a7c-8c2a-25f10599c832	24e302ce-9430-4f0c-867b-1f1342764bcd
cb3d362c-108d-4a7c-8c2a-25f10599c832	941246ab-1b73-4bb2-957e-54e8da001d37
cb3d362c-108d-4a7c-8c2a-25f10599c832	69d20d05-509d-4122-945d-af77628c8dda
cb3d362c-108d-4a7c-8c2a-25f10599c832	e4ae9603-f3e7-4379-b978-ff2a5e475dc3
cb3d362c-108d-4a7c-8c2a-25f10599c832	0bc18610-ef4a-4a8d-909c-7efba603cadc
cb3d362c-108d-4a7c-8c2a-25f10599c832	ded57887-670b-4f10-8085-8984d2416777
cb3d362c-108d-4a7c-8c2a-25f10599c832	e7c6b411-b93c-4855-b075-00396d9d355e
cb3d362c-108d-4a7c-8c2a-25f10599c832	ba36e031-08c8-4ac4-9008-5e05ec3c8ddf
cb3d362c-108d-4a7c-8c2a-25f10599c832	91127a5c-dc31-4bd1-98ae-a4c54bd9a3c8
cb3d362c-108d-4a7c-8c2a-25f10599c832	a1030013-4934-48b6-bf62-53f5f95daeca
cb3d362c-108d-4a7c-8c2a-25f10599c832	2dc1426d-ee87-455c-a359-b27220bb463b
cb3d362c-108d-4a7c-8c2a-25f10599c832	5fcf978b-92fe-4495-92f3-71db501d32d9
cb3d362c-108d-4a7c-8c2a-25f10599c832	c324bafe-36da-4e73-b227-2a84dd6763c9
cb3d362c-108d-4a7c-8c2a-25f10599c832	e6e7b651-6379-4916-974d-fb410c3fac77
cb3d362c-108d-4a7c-8c2a-25f10599c832	fe426b0d-609d-40f5-98c0-477964d925fd
cb3d362c-108d-4a7c-8c2a-25f10599c832	338bfce5-887d-43b0-8d0b-c97ab7361292
cb3d362c-108d-4a7c-8c2a-25f10599c832	14825cf0-56a1-4e53-857d-451483745145
cb3d362c-108d-4a7c-8c2a-25f10599c832	3364be9d-4668-40ba-8db0-ee2f4a98d611
cb3d362c-108d-4a7c-8c2a-25f10599c832	ec55463c-2f8e-46b1-84ce-3abf434532c6
cb3d362c-108d-4a7c-8c2a-25f10599c832	51b8dcf5-2df4-48ff-bd43-4773817a4773
cb3d362c-108d-4a7c-8c2a-25f10599c832	0774095f-c55e-4be1-827e-99ce5147620a
cb3d362c-108d-4a7c-8c2a-25f10599c832	ad350804-0a5c-4c3c-91ca-88d8228b2575
cb3d362c-108d-4a7c-8c2a-25f10599c832	0ffb61f4-0e43-409a-a125-c78e404171f3
cb3d362c-108d-4a7c-8c2a-25f10599c832	5c63faa1-db8f-4974-af86-562d450ba73f
cb3d362c-108d-4a7c-8c2a-25f10599c832	8ec79b65-14af-4925-a6f0-3919cfc9fa17
cb3d362c-108d-4a7c-8c2a-25f10599c832	e3c12724-f36b-4500-8b19-f2865f6ef2f3
cb3d362c-108d-4a7c-8c2a-25f10599c832	41604b35-7791-488c-9bef-6e9d06340a3a
cb3d362c-108d-4a7c-8c2a-25f10599c832	c2cc3267-bf5c-4d4c-ae17-f57384c91eee
cb3d362c-108d-4a7c-8c2a-25f10599c832	a541696c-8280-4840-9acb-c98a69bc0dc7
cb3d362c-108d-4a7c-8c2a-25f10599c832	2eb0e218-9330-492e-9d56-ccfe21048151
cb3d362c-108d-4a7c-8c2a-25f10599c832	711cee0e-5542-4c34-b861-fb181d7f187f
cb3d362c-108d-4a7c-8c2a-25f10599c832	2e936d5e-833c-4988-bb37-2602e1a35623
cb3d362c-108d-4a7c-8c2a-25f10599c832	c6533ff3-3589-47df-8b91-cf69ac233d9a
cb3d362c-108d-4a7c-8c2a-25f10599c832	eaed9ec5-6635-43f1-b84c-1a58ab001bec
cb3d362c-108d-4a7c-8c2a-25f10599c832	4a1a1be9-8d1d-404d-8b23-a66b6a2abd13
cb3d362c-108d-4a7c-8c2a-25f10599c832	2bc5dea3-0443-405f-bd03-b02c76445fc3
cb3d362c-108d-4a7c-8c2a-25f10599c832	10e27fae-38cb-4bb1-aea3-d8be0399dea8
cb3d362c-108d-4a7c-8c2a-25f10599c832	3dcd4257-ea9c-421d-8623-d6e1302287ed
cb3d362c-108d-4a7c-8c2a-25f10599c832	66208caa-a185-4954-a89d-33d0a77df85a
cb3d362c-108d-4a7c-8c2a-25f10599c832	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
cb3d362c-108d-4a7c-8c2a-25f10599c832	5644e220-8aba-4f7d-bb10-065af0fa5b1d
cb3d362c-108d-4a7c-8c2a-25f10599c832	a9d3240c-8b61-4144-896c-607b14fba00c
cb3d362c-108d-4a7c-8c2a-25f10599c832	3207e98a-48cd-436b-bfde-317de4a87c7f
cb3d362c-108d-4a7c-8c2a-25f10599c832	8aa2682a-b80f-4fba-b882-a600c4aa86c7
cb3d362c-108d-4a7c-8c2a-25f10599c832	334bd3d6-e6bb-47ed-be92-163c2854d2b4
cb3d362c-108d-4a7c-8c2a-25f10599c832	24d4ffd2-2c79-488b-9c2c-cda966ffccdb
cb3d362c-108d-4a7c-8c2a-25f10599c832	dd91e84f-e9bf-459a-8c21-fd8f87696320
cb3d362c-108d-4a7c-8c2a-25f10599c832	678ce342-14ab-418a-acf2-79ba4dd7cdd9
cb3d362c-108d-4a7c-8c2a-25f10599c832	67a7c7aa-a69d-4eaf-ae67-b628b67609a4
cb3d362c-108d-4a7c-8c2a-25f10599c832	498052c1-346c-468e-9bc3-1bf6dfe6eb6a
cb3d362c-108d-4a7c-8c2a-25f10599c832	72d17a78-49f0-4da3-bc99-39132729d8e4
cb3d362c-108d-4a7c-8c2a-25f10599c832	3a5de9a5-5917-4f15-aa31-fae687d60b3a
cb3d362c-108d-4a7c-8c2a-25f10599c832	cdaabece-61df-41bc-b280-18f964915cce
cb3d362c-108d-4a7c-8c2a-25f10599c832	6a38a523-111d-406b-8fc3-ba16e12a0f17
cb3d362c-108d-4a7c-8c2a-25f10599c832	9969d77d-c725-46bb-8000-6310245e51ec
cb3d362c-108d-4a7c-8c2a-25f10599c832	7d58634b-89c0-4f18-8600-f70b67c13812
cb3d362c-108d-4a7c-8c2a-25f10599c832	5c62b59b-4042-4edf-8a7d-60f1bef54b4f
cb3d362c-108d-4a7c-8c2a-25f10599c832	e064529e-9c6f-443a-b270-cef1dbb64fcf
cb3d362c-108d-4a7c-8c2a-25f10599c832	47940bfe-7f6f-46ff-b95b-5cf66b357e5e
cb3d362c-108d-4a7c-8c2a-25f10599c832	5e845b17-ace2-4721-8ceb-60f6508982c1
cb3d362c-108d-4a7c-8c2a-25f10599c832	211fadc1-1c87-47e4-9c76-964a4100088d
cb3d362c-108d-4a7c-8c2a-25f10599c832	7e99f450-be25-4846-a03d-05f9311e17ed
cb3d362c-108d-4a7c-8c2a-25f10599c832	51b960d6-13f8-4e69-86cf-1f61b97ed763
cb3d362c-108d-4a7c-8c2a-25f10599c832	a510927b-975c-4139-8eb8-71fa6e2bdd1c
cb3d362c-108d-4a7c-8c2a-25f10599c832	0143cefe-2b32-4422-bf60-6bed19cafe6e
cb3d362c-108d-4a7c-8c2a-25f10599c832	432c0dfe-e801-45e7-96af-4136225cdaa9
cb3d362c-108d-4a7c-8c2a-25f10599c832	e51014e0-b7a2-4720-b93e-f619e60188e0
cb3d362c-108d-4a7c-8c2a-25f10599c832	406d8863-0de3-4a44-823b-65427c4ca6d6
cb3d362c-108d-4a7c-8c2a-25f10599c832	5f8266a8-c3d2-4cc6-b254-6de01729caf0
cb3d362c-108d-4a7c-8c2a-25f10599c832	f63ee569-2e7c-4d63-bd93-78bd86843305
cb3d362c-108d-4a7c-8c2a-25f10599c832	c06c6401-ca05-46da-8d9e-14809260df45
cb3d362c-108d-4a7c-8c2a-25f10599c832	bd3ee3ad-7578-4f4b-92f2-ab77ccc1e09c
cb3d362c-108d-4a7c-8c2a-25f10599c832	7155d123-11c5-4ccd-80a5-e9e41d2e0331
cb3d362c-108d-4a7c-8c2a-25f10599c832	a172578f-9502-4bf0-8070-7b966be06af7
cb3d362c-108d-4a7c-8c2a-25f10599c832	9891f7bc-f8fc-47a6-8263-75d88913fb68
cb3d362c-108d-4a7c-8c2a-25f10599c832	fc40e933-9cf5-4838-8815-2385bb163c91
cb3d362c-108d-4a7c-8c2a-25f10599c832	77bd5602-b5f4-4712-85ef-138219207369
cb3d362c-108d-4a7c-8c2a-25f10599c832	c86dc0e3-059e-474a-a5ee-41caca9cc50c
cb3d362c-108d-4a7c-8c2a-25f10599c832	856f48b1-1c2e-4fcc-b0cd-fc2d83e93ea9
cb3d362c-108d-4a7c-8c2a-25f10599c832	7c161b04-b823-4f7a-ab24-f22c023f8217
cb3d362c-108d-4a7c-8c2a-25f10599c832	ba3bb0a8-4745-4dce-aa34-c5a67a615ca7
cb3d362c-108d-4a7c-8c2a-25f10599c832	799b03e3-b644-4b48-8ad0-5d0ca8e7be54
cb3d362c-108d-4a7c-8c2a-25f10599c832	aa422596-aca0-4b78-b063-a6b3116f46ba
cb3d362c-108d-4a7c-8c2a-25f10599c832	7cc5f70c-54e8-494b-b430-7890601ef0ed
cb3d362c-108d-4a7c-8c2a-25f10599c832	2b48ce2a-b30c-49fb-80a1-026be9c6b29f
cb3d362c-108d-4a7c-8c2a-25f10599c832	c4d15a53-40f6-4e14-80f7-ef757ff2013b
cb3d362c-108d-4a7c-8c2a-25f10599c832	69d28e63-035f-4a76-92db-865ef917faa8
cb3d362c-108d-4a7c-8c2a-25f10599c832	1bad04e9-c09b-4f74-a5fc-8130d4099e21
cb3d362c-108d-4a7c-8c2a-25f10599c832	24d13168-8fba-4f72-935c-3d9588024c7d
cb3d362c-108d-4a7c-8c2a-25f10599c832	f6bd7a7b-d174-4839-b552-7feaec82648c
cb3d362c-108d-4a7c-8c2a-25f10599c832	5a9acda8-58fe-4cd0-8f24-9988da0c20fd
cb3d362c-108d-4a7c-8c2a-25f10599c832	8828e6c3-4747-4ffa-8627-fa0007cfad7b
cb3d362c-108d-4a7c-8c2a-25f10599c832	d307cdae-e1b6-476b-a535-ee6937862295
cb3d362c-108d-4a7c-8c2a-25f10599c832	3cd66d60-6c93-45f5-b1c2-734394ac2719
cb3d362c-108d-4a7c-8c2a-25f10599c832	c50f67b9-205e-4576-974d-48cb3dc422c0
cb3d362c-108d-4a7c-8c2a-25f10599c832	1a84b01d-2240-47ae-aff0-e40e9d6ba84d
cb3d362c-108d-4a7c-8c2a-25f10599c832	65c1fdb2-6e28-4589-9b95-6c5f9d10ccc8
cb3d362c-108d-4a7c-8c2a-25f10599c832	d3f40435-5d75-4e15-90f8-1e969e6a95ba
cb3d362c-108d-4a7c-8c2a-25f10599c832	ca866cf7-49df-41bf-863e-24859ed9a8fa
cb3d362c-108d-4a7c-8c2a-25f10599c832	c16b6a19-f1b4-4687-a096-c7f425c4dfca
cb3d362c-108d-4a7c-8c2a-25f10599c832	e8d47565-bcb0-4b14-8eea-df1021014e0b
cb3d362c-108d-4a7c-8c2a-25f10599c832	8917333c-f663-43f6-a34b-7a1a8c500b37
cb3d362c-108d-4a7c-8c2a-25f10599c832	96df1c2a-2bf5-46b4-bb32-7a1ddf6cfcc0
cb3d362c-108d-4a7c-8c2a-25f10599c832	341a92fa-f1d4-4d22-a9dc-6d99c10f5db9
cb3d362c-108d-4a7c-8c2a-25f10599c832	34b8b827-2eea-4ec9-a624-6e5f144cd099
cb3d362c-108d-4a7c-8c2a-25f10599c832	fb009307-4a65-4ab2-bc44-04fb0307761e
cb3d362c-108d-4a7c-8c2a-25f10599c832	10e89bf3-efac-4cb9-b6f7-c76b60ca8fd7
cb3d362c-108d-4a7c-8c2a-25f10599c832	0d8eb0ad-8209-4e00-bfc4-663e53721c78
cb3d362c-108d-4a7c-8c2a-25f10599c832	b68d09db-1ea5-4306-b160-ce9689e52701
cb3d362c-108d-4a7c-8c2a-25f10599c832	409a5752-eba5-49cc-bae3-2bf0a5091bdc
cb3d362c-108d-4a7c-8c2a-25f10599c832	82287431-e174-469a-9e3c-c9786a6c0e50
cb3d362c-108d-4a7c-8c2a-25f10599c832	d384612f-09a1-4414-a4b7-4d0133ea6c83
cb3d362c-108d-4a7c-8c2a-25f10599c832	0b1f004c-36b6-4c6b-99d7-fb0980c39b74
cb3d362c-108d-4a7c-8c2a-25f10599c832	4fc403a6-4d05-48b0-a6c2-b707eedcb642
cb3d362c-108d-4a7c-8c2a-25f10599c832	6a47e0e2-7471-4c78-9feb-5e74fa6f0375
cb3d362c-108d-4a7c-8c2a-25f10599c832	d17313b3-6847-48c3-b925-3281efdc8a7e
cb3d362c-108d-4a7c-8c2a-25f10599c832	e642c938-895f-4e06-883e-44e1ba94669e
cb3d362c-108d-4a7c-8c2a-25f10599c832	40a25369-020f-4591-911d-46c6b2f7fa2b
cb3d362c-108d-4a7c-8c2a-25f10599c832	1f9a3f56-ce6b-4d42-b07b-898d4a19ccd2
cb3d362c-108d-4a7c-8c2a-25f10599c832	8d51d66a-66a1-4d8b-8f38-b82f74385a9b
cb3d362c-108d-4a7c-8c2a-25f10599c832	dbdfab7f-a4f4-4a57-a446-93d9eff1d83a
cb3d362c-108d-4a7c-8c2a-25f10599c832	9877957b-ebc5-415f-a67c-1622a5634595
cb3d362c-108d-4a7c-8c2a-25f10599c832	53e2bb1d-f51b-4b9a-b3c2-c37d635d6587
cb3d362c-108d-4a7c-8c2a-25f10599c832	37dff388-f58e-4669-90b6-d6b42b5acfb8
cb3d362c-108d-4a7c-8c2a-25f10599c832	4a39413d-82ea-4601-94cf-2b170b3a1b3b
cb3d362c-108d-4a7c-8c2a-25f10599c832	9d9dba02-61bb-44ed-8aa4-b46bc9576876
cb3d362c-108d-4a7c-8c2a-25f10599c832	f30d142a-4b8b-43c2-be13-19a83f153e48
cb3d362c-108d-4a7c-8c2a-25f10599c832	4df36a47-0d8f-411e-b33b-9a05b434e348
cb3d362c-108d-4a7c-8c2a-25f10599c832	811f52ef-be44-4193-8fa4-a6d874d6ef26
cb3d362c-108d-4a7c-8c2a-25f10599c832	6350ed08-6ceb-437c-a688-3207c31daffc
cb3d362c-108d-4a7c-8c2a-25f10599c832	91488504-2065-441d-b2a5-04128f83f4ca
cb3d362c-108d-4a7c-8c2a-25f10599c832	b1954232-3fc1-449c-a848-749e44d6af64
cb3d362c-108d-4a7c-8c2a-25f10599c832	5f1c39c2-0a75-4fb8-b1e5-b9744e68e803
cb3d362c-108d-4a7c-8c2a-25f10599c832	1cc67f1e-7d61-4971-a7c4-cb7583794569
cb3d362c-108d-4a7c-8c2a-25f10599c832	76dd10f6-c8c1-47ff-942f-16796d7d18ce
cb3d362c-108d-4a7c-8c2a-25f10599c832	8fa9704d-68b6-4cf0-9285-15ce22fdf6cc
cb3d362c-108d-4a7c-8c2a-25f10599c832	7aa9855f-cd61-4537-8459-3b9c19149f51
cb3d362c-108d-4a7c-8c2a-25f10599c832	63fc86ab-9e21-4105-a9be-779c9f9f008c
cb3d362c-108d-4a7c-8c2a-25f10599c832	b363d041-5721-4d3b-b92a-07cf10b83723
cb3d362c-108d-4a7c-8c2a-25f10599c832	daf91d1a-a35a-40e7-9033-59c9dd417d9f
cb3d362c-108d-4a7c-8c2a-25f10599c832	cfbe5203-8f17-410b-b969-65156bddafea
cb3d362c-108d-4a7c-8c2a-25f10599c832	e8fac3df-72b3-4ffd-abec-697c8c35cb53
cb3d362c-108d-4a7c-8c2a-25f10599c832	276fa532-4eb4-429b-87a4-28ba188a4563
cb3d362c-108d-4a7c-8c2a-25f10599c832	d0ed0a4b-1902-4d20-ac81-d53b39273f9a
cb3d362c-108d-4a7c-8c2a-25f10599c832	5762d8c1-b9d2-4bcd-965f-5525fc2dcaed
cb3d362c-108d-4a7c-8c2a-25f10599c832	bbfa2be6-42a7-4c3e-a6f0-012f938a7b15
cb3d362c-108d-4a7c-8c2a-25f10599c832	6e544016-e480-460f-92e8-d0574bb5911a
cb3d362c-108d-4a7c-8c2a-25f10599c832	6aca9891-4527-4191-8191-94dc00bd4bd9
cb3d362c-108d-4a7c-8c2a-25f10599c832	2a1bf877-16e8-488c-bb3e-5523c76d1ac8
cb3d362c-108d-4a7c-8c2a-25f10599c832	62003316-bad4-409f-bcc5-aa3c8d628773
cb3d362c-108d-4a7c-8c2a-25f10599c832	a5517342-5522-4456-8db2-87b3813d7f8d
cb3d362c-108d-4a7c-8c2a-25f10599c832	12f36542-128f-4719-bbd4-bab2d4f3e98f
cb3d362c-108d-4a7c-8c2a-25f10599c832	c6f31724-0db8-4eb1-917e-4a41af3167f8
cb3d362c-108d-4a7c-8c2a-25f10599c832	e7fd3821-d49b-4538-9e8d-dd92d5288864
cb3d362c-108d-4a7c-8c2a-25f10599c832	7736ac7e-ddd6-4c04-a767-caeca3ded977
cb3d362c-108d-4a7c-8c2a-25f10599c832	a08203dc-afe0-4466-a0c6-5be18b46d364
cb3d362c-108d-4a7c-8c2a-25f10599c832	0eb1b21a-33f5-45e5-8424-a0c72356c7df
cb3d362c-108d-4a7c-8c2a-25f10599c832	fc39ce1f-9f72-4781-b7f4-7d7661c12258
cb3d362c-108d-4a7c-8c2a-25f10599c832	8645b659-2d69-4a0c-9b81-dcd39ef8519a
cb3d362c-108d-4a7c-8c2a-25f10599c832	34c53234-dd47-48bb-ac19-a2f2c760cadb
cb3d362c-108d-4a7c-8c2a-25f10599c832	3869381f-ede9-4b73-9296-76ee4f5daffc
cb3d362c-108d-4a7c-8c2a-25f10599c832	52671b83-0e02-4d96-a011-8f37ff8cba01
cb3d362c-108d-4a7c-8c2a-25f10599c832	b9b512b2-4b4a-4675-b0a5-f6db75fec00c
cb3d362c-108d-4a7c-8c2a-25f10599c832	dded6a07-cea5-491b-81d2-19f3dcf88366
cb3d362c-108d-4a7c-8c2a-25f10599c832	5d6e4535-f23e-410a-8a68-ee6e0af9b149
cb3d362c-108d-4a7c-8c2a-25f10599c832	2bca06a4-52ea-4d56-8afa-1631731d70d7
cb3d362c-108d-4a7c-8c2a-25f10599c832	e9c26bf5-06e2-4378-ba96-3096bb148a9b
cb3d362c-108d-4a7c-8c2a-25f10599c832	b7ea7b30-1b2c-45d2-87b4-6d030cf5de19
cb3d362c-108d-4a7c-8c2a-25f10599c832	b63aec61-7f8f-4d81-81b2-c83b6c011cc0
cb3d362c-108d-4a7c-8c2a-25f10599c832	5f0a970d-22c7-47f1-aab7-ad41dcfeb7d4
cb3d362c-108d-4a7c-8c2a-25f10599c832	4cf6a152-7ebb-4c12-b8d8-457c8eec5ed8
cb3d362c-108d-4a7c-8c2a-25f10599c832	fc9579bb-a94c-4976-9d50-2b48967e601f
cb3d362c-108d-4a7c-8c2a-25f10599c832	479d55f4-df2a-4718-b732-1e0b5c17e977
cb3d362c-108d-4a7c-8c2a-25f10599c832	425c78e9-5054-4986-8867-87c1417abe26
cb3d362c-108d-4a7c-8c2a-25f10599c832	52d99454-f27f-41ce-a18a-aaf4241574bb
cb3d362c-108d-4a7c-8c2a-25f10599c832	b7c8be94-31de-4e1e-90ff-540e212a98b9
cb3d362c-108d-4a7c-8c2a-25f10599c832	9a960c06-d4fe-4a05-a2bb-495520c8d672
cb3d362c-108d-4a7c-8c2a-25f10599c832	70aed2ca-b35d-4af0-8acf-68c17d17efa4
cb3d362c-108d-4a7c-8c2a-25f10599c832	16fb168d-3006-4073-9697-1e44da8846d4
cb3d362c-108d-4a7c-8c2a-25f10599c832	847f530b-9d39-47c2-ab26-6f7bb4242f1f
cb3d362c-108d-4a7c-8c2a-25f10599c832	f910ed4c-2aa0-4413-9e81-74c513d14164
cb3d362c-108d-4a7c-8c2a-25f10599c832	f9900b67-3209-4897-bcbd-e58cb217db15
cb3d362c-108d-4a7c-8c2a-25f10599c832	d455877c-01e8-408c-9ac2-c4458dad9473
cb3d362c-108d-4a7c-8c2a-25f10599c832	86d56048-a62e-494d-86b1-ace4f0d7a1e3
cb3d362c-108d-4a7c-8c2a-25f10599c832	fd125f06-845e-4e06-b806-e04ed703b6fc
cb3d362c-108d-4a7c-8c2a-25f10599c832	3ef4f942-5c23-4966-9edb-f0b9552f9f0f
cb3d362c-108d-4a7c-8c2a-25f10599c832	e40d1ce5-0ed6-4f87-9288-bbe9724edd32
cb3d362c-108d-4a7c-8c2a-25f10599c832	cd50b1b9-8324-49bf-9e10-1a71740db333
cb3d362c-108d-4a7c-8c2a-25f10599c832	afec470a-4bbc-471d-a58e-f1f96a9e2863
c5a53957-315f-4cb3-a02b-37c38e5bded0	91636e6b-00c5-49b4-abf6-6764099c775e
c5a53957-315f-4cb3-a02b-37c38e5bded0	a36f9f85-48f1-4227-9a1b-74bb8ae0b785
c5a53957-315f-4cb3-a02b-37c38e5bded0	8a9338d1-b719-4923-82c4-7a27bdf91730
c5a53957-315f-4cb3-a02b-37c38e5bded0	7de2c572-a4f2-440d-bee0-f245c1158026
c5a53957-315f-4cb3-a02b-37c38e5bded0	6d6bf91a-6c54-4cac-9a1e-b07185374754
c5a53957-315f-4cb3-a02b-37c38e5bded0	5e845b17-ace2-4721-8ceb-60f6508982c1
c5a53957-315f-4cb3-a02b-37c38e5bded0	211fadc1-1c87-47e4-9c76-964a4100088d
c5a53957-315f-4cb3-a02b-37c38e5bded0	a510927b-975c-4139-8eb8-71fa6e2bdd1c
c5a53957-315f-4cb3-a02b-37c38e5bded0	3364be9d-4668-40ba-8db0-ee2f4a98d611
c5a53957-315f-4cb3-a02b-37c38e5bded0	ec55463c-2f8e-46b1-84ce-3abf434532c6
c5a53957-315f-4cb3-a02b-37c38e5bded0	51b8dcf5-2df4-48ff-bd43-4773817a4773
c5a53957-315f-4cb3-a02b-37c38e5bded0	a541696c-8280-4840-9acb-c98a69bc0dc7
c5a53957-315f-4cb3-a02b-37c38e5bded0	0774095f-c55e-4be1-827e-99ce5147620a
c5a53957-315f-4cb3-a02b-37c38e5bded0	ad350804-0a5c-4c3c-91ca-88d8228b2575
c5a53957-315f-4cb3-a02b-37c38e5bded0	c06c6401-ca05-46da-8d9e-14809260df45
c5a53957-315f-4cb3-a02b-37c38e5bded0	bd3ee3ad-7578-4f4b-92f2-ab77ccc1e09c
c5a53957-315f-4cb3-a02b-37c38e5bded0	7155d123-11c5-4ccd-80a5-e9e41d2e0331
c5a53957-315f-4cb3-a02b-37c38e5bded0	a172578f-9502-4bf0-8070-7b966be06af7
c5a53957-315f-4cb3-a02b-37c38e5bded0	9891f7bc-f8fc-47a6-8263-75d88913fb68
c5a53957-315f-4cb3-a02b-37c38e5bded0	fc40e933-9cf5-4838-8815-2385bb163c91
c5a53957-315f-4cb3-a02b-37c38e5bded0	77bd5602-b5f4-4712-85ef-138219207369
c5a53957-315f-4cb3-a02b-37c38e5bded0	c86dc0e3-059e-474a-a5ee-41caca9cc50c
c5a53957-315f-4cb3-a02b-37c38e5bded0	856f48b1-1c2e-4fcc-b0cd-fc2d83e93ea9
c5a53957-315f-4cb3-a02b-37c38e5bded0	7c161b04-b823-4f7a-ab24-f22c023f8217
c5a53957-315f-4cb3-a02b-37c38e5bded0	ba3bb0a8-4745-4dce-aa34-c5a67a615ca7
c5a53957-315f-4cb3-a02b-37c38e5bded0	799b03e3-b644-4b48-8ad0-5d0ca8e7be54
c5a53957-315f-4cb3-a02b-37c38e5bded0	aa422596-aca0-4b78-b063-a6b3116f46ba
c5a53957-315f-4cb3-a02b-37c38e5bded0	7cc5f70c-54e8-494b-b430-7890601ef0ed
c5a53957-315f-4cb3-a02b-37c38e5bded0	2b48ce2a-b30c-49fb-80a1-026be9c6b29f
c5a53957-315f-4cb3-a02b-37c38e5bded0	c4d15a53-40f6-4e14-80f7-ef757ff2013b
c5a53957-315f-4cb3-a02b-37c38e5bded0	69d28e63-035f-4a76-92db-865ef917faa8
c5a53957-315f-4cb3-a02b-37c38e5bded0	1bad04e9-c09b-4f74-a5fc-8130d4099e21
c5a53957-315f-4cb3-a02b-37c38e5bded0	24d13168-8fba-4f72-935c-3d9588024c7d
c5a53957-315f-4cb3-a02b-37c38e5bded0	f6bd7a7b-d174-4839-b552-7feaec82648c
c5a53957-315f-4cb3-a02b-37c38e5bded0	5a9acda8-58fe-4cd0-8f24-9988da0c20fd
c5a53957-315f-4cb3-a02b-37c38e5bded0	8828e6c3-4747-4ffa-8627-fa0007cfad7b
c5a53957-315f-4cb3-a02b-37c38e5bded0	d307cdae-e1b6-476b-a535-ee6937862295
c5a53957-315f-4cb3-a02b-37c38e5bded0	3cd66d60-6c93-45f5-b1c2-734394ac2719
c5a53957-315f-4cb3-a02b-37c38e5bded0	c50f67b9-205e-4576-974d-48cb3dc422c0
c5a53957-315f-4cb3-a02b-37c38e5bded0	1a84b01d-2240-47ae-aff0-e40e9d6ba84d
c5a53957-315f-4cb3-a02b-37c38e5bded0	65c1fdb2-6e28-4589-9b95-6c5f9d10ccc8
c5a53957-315f-4cb3-a02b-37c38e5bded0	d3f40435-5d75-4e15-90f8-1e969e6a95ba
c5a53957-315f-4cb3-a02b-37c38e5bded0	ca866cf7-49df-41bf-863e-24859ed9a8fa
c5a53957-315f-4cb3-a02b-37c38e5bded0	c16b6a19-f1b4-4687-a096-c7f425c4dfca
c5a53957-315f-4cb3-a02b-37c38e5bded0	e8d47565-bcb0-4b14-8eea-df1021014e0b
c5a53957-315f-4cb3-a02b-37c38e5bded0	8917333c-f663-43f6-a34b-7a1a8c500b37
c5a53957-315f-4cb3-a02b-37c38e5bded0	96df1c2a-2bf5-46b4-bb32-7a1ddf6cfcc0
c5a53957-315f-4cb3-a02b-37c38e5bded0	341a92fa-f1d4-4d22-a9dc-6d99c10f5db9
c5a53957-315f-4cb3-a02b-37c38e5bded0	34b8b827-2eea-4ec9-a624-6e5f144cd099
c5a53957-315f-4cb3-a02b-37c38e5bded0	fb009307-4a65-4ab2-bc44-04fb0307761e
c5a53957-315f-4cb3-a02b-37c38e5bded0	10e89bf3-efac-4cb9-b6f7-c76b60ca8fd7
c5a53957-315f-4cb3-a02b-37c38e5bded0	0d8eb0ad-8209-4e00-bfc4-663e53721c78
c5a53957-315f-4cb3-a02b-37c38e5bded0	b68d09db-1ea5-4306-b160-ce9689e52701
c5a53957-315f-4cb3-a02b-37c38e5bded0	409a5752-eba5-49cc-bae3-2bf0a5091bdc
c5a53957-315f-4cb3-a02b-37c38e5bded0	82287431-e174-469a-9e3c-c9786a6c0e50
c5a53957-315f-4cb3-a02b-37c38e5bded0	0b1f004c-36b6-4c6b-99d7-fb0980c39b74
c5a53957-315f-4cb3-a02b-37c38e5bded0	811f52ef-be44-4193-8fa4-a6d874d6ef26
c5a53957-315f-4cb3-a02b-37c38e5bded0	6350ed08-6ceb-437c-a688-3207c31daffc
c5a53957-315f-4cb3-a02b-37c38e5bded0	8fa9704d-68b6-4cf0-9285-15ce22fdf6cc
c5a53957-315f-4cb3-a02b-37c38e5bded0	daf91d1a-a35a-40e7-9033-59c9dd417d9f
c5a53957-315f-4cb3-a02b-37c38e5bded0	e8fac3df-72b3-4ffd-abec-697c8c35cb53
c5a53957-315f-4cb3-a02b-37c38e5bded0	6e544016-e480-460f-92e8-d0574bb5911a
c5a53957-315f-4cb3-a02b-37c38e5bded0	c6f31724-0db8-4eb1-917e-4a41af3167f8
c5a53957-315f-4cb3-a02b-37c38e5bded0	e7fd3821-d49b-4538-9e8d-dd92d5288864
c5a53957-315f-4cb3-a02b-37c38e5bded0	a08203dc-afe0-4466-a0c6-5be18b46d364
c5a53957-315f-4cb3-a02b-37c38e5bded0	3869381f-ede9-4b73-9296-76ee4f5daffc
c5a53957-315f-4cb3-a02b-37c38e5bded0	dded6a07-cea5-491b-81d2-19f3dcf88366
c5a53957-315f-4cb3-a02b-37c38e5bded0	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
c5a53957-315f-4cb3-a02b-37c38e5bded0	1095336e-87e8-4bae-9030-3ef31a912faa
c5a53957-315f-4cb3-a02b-37c38e5bded0	62d1e580-87c8-4809-a00d-ee56d6342b20
c5a53957-315f-4cb3-a02b-37c38e5bded0	0e4a6cca-6bca-4584-bc54-c8c8c06c7680
c5a53957-315f-4cb3-a02b-37c38e5bded0	3c369693-3dad-44e7-b7e6-3d40354e9c26
c5a53957-315f-4cb3-a02b-37c38e5bded0	33b37a0d-4084-4b82-a8c9-9d62dafbb920
c5a53957-315f-4cb3-a02b-37c38e5bded0	47de5569-d564-4921-b84d-429de1473f17
c5a53957-315f-4cb3-a02b-37c38e5bded0	19ed0257-02df-4af1-9122-4e6dba71ad01
5bbf24c0-e072-4893-9e2a-66fd009e6889	409a5752-eba5-49cc-bae3-2bf0a5091bdc
5bbf24c0-e072-4893-9e2a-66fd009e6889	82287431-e174-469a-9e3c-c9786a6c0e50
5bbf24c0-e072-4893-9e2a-66fd009e6889	d384612f-09a1-4414-a4b7-4d0133ea6c83
5bbf24c0-e072-4893-9e2a-66fd009e6889	0b1f004c-36b6-4c6b-99d7-fb0980c39b74
5bbf24c0-e072-4893-9e2a-66fd009e6889	4fc403a6-4d05-48b0-a6c2-b707eedcb642
5bbf24c0-e072-4893-9e2a-66fd009e6889	d17313b3-6847-48c3-b925-3281efdc8a7e
5bbf24c0-e072-4893-9e2a-66fd009e6889	e642c938-895f-4e06-883e-44e1ba94669e
5bbf24c0-e072-4893-9e2a-66fd009e6889	40a25369-020f-4591-911d-46c6b2f7fa2b
5bbf24c0-e072-4893-9e2a-66fd009e6889	1f9a3f56-ce6b-4d42-b07b-898d4a19ccd2
5bbf24c0-e072-4893-9e2a-66fd009e6889	8d51d66a-66a1-4d8b-8f38-b82f74385a9b
5bbf24c0-e072-4893-9e2a-66fd009e6889	dbdfab7f-a4f4-4a57-a446-93d9eff1d83a
5bbf24c0-e072-4893-9e2a-66fd009e6889	9877957b-ebc5-415f-a67c-1622a5634595
5bbf24c0-e072-4893-9e2a-66fd009e6889	53e2bb1d-f51b-4b9a-b3c2-c37d635d6587
5bbf24c0-e072-4893-9e2a-66fd009e6889	37dff388-f58e-4669-90b6-d6b42b5acfb8
5bbf24c0-e072-4893-9e2a-66fd009e6889	4a39413d-82ea-4601-94cf-2b170b3a1b3b
5bbf24c0-e072-4893-9e2a-66fd009e6889	9d9dba02-61bb-44ed-8aa4-b46bc9576876
5bbf24c0-e072-4893-9e2a-66fd009e6889	4df36a47-0d8f-411e-b33b-9a05b434e348
5bbf24c0-e072-4893-9e2a-66fd009e6889	6350ed08-6ceb-437c-a688-3207c31daffc
5bbf24c0-e072-4893-9e2a-66fd009e6889	91488504-2065-441d-b2a5-04128f83f4ca
5bbf24c0-e072-4893-9e2a-66fd009e6889	b1954232-3fc1-449c-a848-749e44d6af64
5bbf24c0-e072-4893-9e2a-66fd009e6889	1cc67f1e-7d61-4971-a7c4-cb7583794569
5bbf24c0-e072-4893-9e2a-66fd009e6889	76dd10f6-c8c1-47ff-942f-16796d7d18ce
5bbf24c0-e072-4893-9e2a-66fd009e6889	8fa9704d-68b6-4cf0-9285-15ce22fdf6cc
5bbf24c0-e072-4893-9e2a-66fd009e6889	7aa9855f-cd61-4537-8459-3b9c19149f51
5bbf24c0-e072-4893-9e2a-66fd009e6889	63fc86ab-9e21-4105-a9be-779c9f9f008c
5bbf24c0-e072-4893-9e2a-66fd009e6889	b363d041-5721-4d3b-b92a-07cf10b83723
5bbf24c0-e072-4893-9e2a-66fd009e6889	daf91d1a-a35a-40e7-9033-59c9dd417d9f
5bbf24c0-e072-4893-9e2a-66fd009e6889	cfbe5203-8f17-410b-b969-65156bddafea
5bbf24c0-e072-4893-9e2a-66fd009e6889	e8fac3df-72b3-4ffd-abec-697c8c35cb53
5bbf24c0-e072-4893-9e2a-66fd009e6889	d0ed0a4b-1902-4d20-ac81-d53b39273f9a
5bbf24c0-e072-4893-9e2a-66fd009e6889	5762d8c1-b9d2-4bcd-965f-5525fc2dcaed
5bbf24c0-e072-4893-9e2a-66fd009e6889	bbfa2be6-42a7-4c3e-a6f0-012f938a7b15
5bbf24c0-e072-4893-9e2a-66fd009e6889	6e544016-e480-460f-92e8-d0574bb5911a
5bbf24c0-e072-4893-9e2a-66fd009e6889	6aca9891-4527-4191-8191-94dc00bd4bd9
5bbf24c0-e072-4893-9e2a-66fd009e6889	2a1bf877-16e8-488c-bb3e-5523c76d1ac8
5bbf24c0-e072-4893-9e2a-66fd009e6889	62003316-bad4-409f-bcc5-aa3c8d628773
5bbf24c0-e072-4893-9e2a-66fd009e6889	12f36542-128f-4719-bbd4-bab2d4f3e98f
5bbf24c0-e072-4893-9e2a-66fd009e6889	c6f31724-0db8-4eb1-917e-4a41af3167f8
5bbf24c0-e072-4893-9e2a-66fd009e6889	e7fd3821-d49b-4538-9e8d-dd92d5288864
5bbf24c0-e072-4893-9e2a-66fd009e6889	a08203dc-afe0-4466-a0c6-5be18b46d364
5bbf24c0-e072-4893-9e2a-66fd009e6889	8645b659-2d69-4a0c-9b81-dcd39ef8519a
5bbf24c0-e072-4893-9e2a-66fd009e6889	34c53234-dd47-48bb-ac19-a2f2c760cadb
5bbf24c0-e072-4893-9e2a-66fd009e6889	fc39ce1f-9f72-4781-b7f4-7d7661c12258
5bbf24c0-e072-4893-9e2a-66fd009e6889	3869381f-ede9-4b73-9296-76ee4f5daffc
5bbf24c0-e072-4893-9e2a-66fd009e6889	52671b83-0e02-4d96-a011-8f37ff8cba01
5bbf24c0-e072-4893-9e2a-66fd009e6889	b9b512b2-4b4a-4675-b0a5-f6db75fec00c
5bbf24c0-e072-4893-9e2a-66fd009e6889	dded6a07-cea5-491b-81d2-19f3dcf88366
657cd2c4-a044-48f8-a24a-4074313cf61d	91636e6b-00c5-49b4-abf6-6764099c775e
657cd2c4-a044-48f8-a24a-4074313cf61d	a36f9f85-48f1-4227-9a1b-74bb8ae0b785
657cd2c4-a044-48f8-a24a-4074313cf61d	8a9338d1-b719-4923-82c4-7a27bdf91730
657cd2c4-a044-48f8-a24a-4074313cf61d	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
657cd2c4-a044-48f8-a24a-4074313cf61d	897b0471-cb96-49de-826c-b9b8c512a342
657cd2c4-a044-48f8-a24a-4074313cf61d	dd1597d0-6222-412b-82d3-b4395b00b4c9
657cd2c4-a044-48f8-a24a-4074313cf61d	3396ac25-2554-407b-9e72-a765be3778e7
657cd2c4-a044-48f8-a24a-4074313cf61d	d2aa621a-a65e-46c1-b910-c4fb4c84259c
657cd2c4-a044-48f8-a24a-4074313cf61d	3364be9d-4668-40ba-8db0-ee2f4a98d611
657cd2c4-a044-48f8-a24a-4074313cf61d	ec55463c-2f8e-46b1-84ce-3abf434532c6
657cd2c4-a044-48f8-a24a-4074313cf61d	51b8dcf5-2df4-48ff-bd43-4773817a4773
657cd2c4-a044-48f8-a24a-4074313cf61d	5e845b17-ace2-4721-8ceb-60f6508982c1
657cd2c4-a044-48f8-a24a-4074313cf61d	0774095f-c55e-4be1-827e-99ce5147620a
657cd2c4-a044-48f8-a24a-4074313cf61d	ad350804-0a5c-4c3c-91ca-88d8228b2575
657cd2c4-a044-48f8-a24a-4074313cf61d	66208caa-a185-4954-a89d-33d0a77df85a
657cd2c4-a044-48f8-a24a-4074313cf61d	5644e220-8aba-4f7d-bb10-065af0fa5b1d
657cd2c4-a044-48f8-a24a-4074313cf61d	bd3ee3ad-7578-4f4b-92f2-ab77ccc1e09c
657cd2c4-a044-48f8-a24a-4074313cf61d	7155d123-11c5-4ccd-80a5-e9e41d2e0331
657cd2c4-a044-48f8-a24a-4074313cf61d	9891f7bc-f8fc-47a6-8263-75d88913fb68
657cd2c4-a044-48f8-a24a-4074313cf61d	fc40e933-9cf5-4838-8815-2385bb163c91
657cd2c4-a044-48f8-a24a-4074313cf61d	c86dc0e3-059e-474a-a5ee-41caca9cc50c
657cd2c4-a044-48f8-a24a-4074313cf61d	856f48b1-1c2e-4fcc-b0cd-fc2d83e93ea9
657cd2c4-a044-48f8-a24a-4074313cf61d	ba3bb0a8-4745-4dce-aa34-c5a67a615ca7
657cd2c4-a044-48f8-a24a-4074313cf61d	799b03e3-b644-4b48-8ad0-5d0ca8e7be54
657cd2c4-a044-48f8-a24a-4074313cf61d	aa422596-aca0-4b78-b063-a6b3116f46ba
657cd2c4-a044-48f8-a24a-4074313cf61d	7cc5f70c-54e8-494b-b430-7890601ef0ed
657cd2c4-a044-48f8-a24a-4074313cf61d	69d28e63-035f-4a76-92db-865ef917faa8
657cd2c4-a044-48f8-a24a-4074313cf61d	1bad04e9-c09b-4f74-a5fc-8130d4099e21
657cd2c4-a044-48f8-a24a-4074313cf61d	f6bd7a7b-d174-4839-b552-7feaec82648c
657cd2c4-a044-48f8-a24a-4074313cf61d	5a9acda8-58fe-4cd0-8f24-9988da0c20fd
657cd2c4-a044-48f8-a24a-4074313cf61d	8828e6c3-4747-4ffa-8627-fa0007cfad7b
657cd2c4-a044-48f8-a24a-4074313cf61d	d307cdae-e1b6-476b-a535-ee6937862295
657cd2c4-a044-48f8-a24a-4074313cf61d	c50f67b9-205e-4576-974d-48cb3dc422c0
657cd2c4-a044-48f8-a24a-4074313cf61d	1a84b01d-2240-47ae-aff0-e40e9d6ba84d
657cd2c4-a044-48f8-a24a-4074313cf61d	65c1fdb2-6e28-4589-9b95-6c5f9d10ccc8
657cd2c4-a044-48f8-a24a-4074313cf61d	d3f40435-5d75-4e15-90f8-1e969e6a95ba
657cd2c4-a044-48f8-a24a-4074313cf61d	c16b6a19-f1b4-4687-a096-c7f425c4dfca
657cd2c4-a044-48f8-a24a-4074313cf61d	e8d47565-bcb0-4b14-8eea-df1021014e0b
657cd2c4-a044-48f8-a24a-4074313cf61d	8917333c-f663-43f6-a34b-7a1a8c500b37
657cd2c4-a044-48f8-a24a-4074313cf61d	96df1c2a-2bf5-46b4-bb32-7a1ddf6cfcc0
657cd2c4-a044-48f8-a24a-4074313cf61d	341a92fa-f1d4-4d22-a9dc-6d99c10f5db9
657cd2c4-a044-48f8-a24a-4074313cf61d	34b8b827-2eea-4ec9-a624-6e5f144cd099
657cd2c4-a044-48f8-a24a-4074313cf61d	fb009307-4a65-4ab2-bc44-04fb0307761e
657cd2c4-a044-48f8-a24a-4074313cf61d	10e89bf3-efac-4cb9-b6f7-c76b60ca8fd7
657cd2c4-a044-48f8-a24a-4074313cf61d	409a5752-eba5-49cc-bae3-2bf0a5091bdc
657cd2c4-a044-48f8-a24a-4074313cf61d	82287431-e174-469a-9e3c-c9786a6c0e50
657cd2c4-a044-48f8-a24a-4074313cf61d	0b1f004c-36b6-4c6b-99d7-fb0980c39b74
657cd2c4-a044-48f8-a24a-4074313cf61d	4fc403a6-4d05-48b0-a6c2-b707eedcb642
657cd2c4-a044-48f8-a24a-4074313cf61d	e642c938-895f-4e06-883e-44e1ba94669e
657cd2c4-a044-48f8-a24a-4074313cf61d	1f9a3f56-ce6b-4d42-b07b-898d4a19ccd2
657cd2c4-a044-48f8-a24a-4074313cf61d	9877957b-ebc5-415f-a67c-1622a5634595
657cd2c4-a044-48f8-a24a-4074313cf61d	53e2bb1d-f51b-4b9a-b3c2-c37d635d6587
657cd2c4-a044-48f8-a24a-4074313cf61d	37dff388-f58e-4669-90b6-d6b42b5acfb8
657cd2c4-a044-48f8-a24a-4074313cf61d	4a39413d-82ea-4601-94cf-2b170b3a1b3b
657cd2c4-a044-48f8-a24a-4074313cf61d	4df36a47-0d8f-411e-b33b-9a05b434e348
657cd2c4-a044-48f8-a24a-4074313cf61d	6350ed08-6ceb-437c-a688-3207c31daffc
657cd2c4-a044-48f8-a24a-4074313cf61d	91488504-2065-441d-b2a5-04128f83f4ca
657cd2c4-a044-48f8-a24a-4074313cf61d	b1954232-3fc1-449c-a848-749e44d6af64
657cd2c4-a044-48f8-a24a-4074313cf61d	5f1c39c2-0a75-4fb8-b1e5-b9744e68e803
657cd2c4-a044-48f8-a24a-4074313cf61d	1cc67f1e-7d61-4971-a7c4-cb7583794569
657cd2c4-a044-48f8-a24a-4074313cf61d	8fa9704d-68b6-4cf0-9285-15ce22fdf6cc
657cd2c4-a044-48f8-a24a-4074313cf61d	7aa9855f-cd61-4537-8459-3b9c19149f51
657cd2c4-a044-48f8-a24a-4074313cf61d	b363d041-5721-4d3b-b92a-07cf10b83723
657cd2c4-a044-48f8-a24a-4074313cf61d	daf91d1a-a35a-40e7-9033-59c9dd417d9f
657cd2c4-a044-48f8-a24a-4074313cf61d	e8fac3df-72b3-4ffd-abec-697c8c35cb53
657cd2c4-a044-48f8-a24a-4074313cf61d	d0ed0a4b-1902-4d20-ac81-d53b39273f9a
657cd2c4-a044-48f8-a24a-4074313cf61d	5762d8c1-b9d2-4bcd-965f-5525fc2dcaed
657cd2c4-a044-48f8-a24a-4074313cf61d	6e544016-e480-460f-92e8-d0574bb5911a
657cd2c4-a044-48f8-a24a-4074313cf61d	62003316-bad4-409f-bcc5-aa3c8d628773
657cd2c4-a044-48f8-a24a-4074313cf61d	c6f31724-0db8-4eb1-917e-4a41af3167f8
657cd2c4-a044-48f8-a24a-4074313cf61d	7736ac7e-ddd6-4c04-a767-caeca3ded977
657cd2c4-a044-48f8-a24a-4074313cf61d	fc39ce1f-9f72-4781-b7f4-7d7661c12258
657cd2c4-a044-48f8-a24a-4074313cf61d	3869381f-ede9-4b73-9296-76ee4f5daffc
657cd2c4-a044-48f8-a24a-4074313cf61d	b9b512b2-4b4a-4675-b0a5-f6db75fec00c
657cd2c4-a044-48f8-a24a-4074313cf61d	dded6a07-cea5-491b-81d2-19f3dcf88366
657cd2c4-a044-48f8-a24a-4074313cf61d	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
657cd2c4-a044-48f8-a24a-4074313cf61d	1095336e-87e8-4bae-9030-3ef31a912faa
657cd2c4-a044-48f8-a24a-4074313cf61d	62d1e580-87c8-4809-a00d-ee56d6342b20
657cd2c4-a044-48f8-a24a-4074313cf61d	0e4a6cca-6bca-4584-bc54-c8c8c06c7680
657cd2c4-a044-48f8-a24a-4074313cf61d	3c369693-3dad-44e7-b7e6-3d40354e9c26
657cd2c4-a044-48f8-a24a-4074313cf61d	33b37a0d-4084-4b82-a8c9-9d62dafbb920
657cd2c4-a044-48f8-a24a-4074313cf61d	47de5569-d564-4921-b84d-429de1473f17
657cd2c4-a044-48f8-a24a-4074313cf61d	19ed0257-02df-4af1-9122-4e6dba71ad01
657cd2c4-a044-48f8-a24a-4074313cf61d	5d6e4535-f23e-410a-8a68-ee6e0af9b149
657cd2c4-a044-48f8-a24a-4074313cf61d	e9c26bf5-06e2-4378-ba96-3096bb148a9b
657cd2c4-a044-48f8-a24a-4074313cf61d	b7ea7b30-1b2c-45d2-87b4-6d030cf5de19
657cd2c4-a044-48f8-a24a-4074313cf61d	b63aec61-7f8f-4d81-81b2-c83b6c011cc0
8f652db2-db1d-4e66-9496-a9825294f946	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
8f652db2-db1d-4e66-9496-a9825294f946	0e4ce8e2-f5a7-44a4-91e2-c8157ff57e61
8f652db2-db1d-4e66-9496-a9825294f946	f1f00f22-645d-45db-ba6d-2950512b07e1
8f652db2-db1d-4e66-9496-a9825294f946	dd1597d0-6222-412b-82d3-b4395b00b4c9
8f652db2-db1d-4e66-9496-a9825294f946	64357bde-020a-49af-8ad3-9f8c139f3c07
8f652db2-db1d-4e66-9496-a9825294f946	ee8d9bfa-a1fb-4bad-bb07-5b17fa08c1c1
8f652db2-db1d-4e66-9496-a9825294f946	0774095f-c55e-4be1-827e-99ce5147620a
8f652db2-db1d-4e66-9496-a9825294f946	0282cc71-2897-4181-b6a9-f555704771fc
8f652db2-db1d-4e66-9496-a9825294f946	66208caa-a185-4954-a89d-33d0a77df85a
8f652db2-db1d-4e66-9496-a9825294f946	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
8f652db2-db1d-4e66-9496-a9825294f946	c06c6401-ca05-46da-8d9e-14809260df45
8f652db2-db1d-4e66-9496-a9825294f946	a172578f-9502-4bf0-8070-7b966be06af7
8f652db2-db1d-4e66-9496-a9825294f946	aa422596-aca0-4b78-b063-a6b3116f46ba
8f652db2-db1d-4e66-9496-a9825294f946	c4d15a53-40f6-4e14-80f7-ef757ff2013b
8f652db2-db1d-4e66-9496-a9825294f946	24d13168-8fba-4f72-935c-3d9588024c7d
8f652db2-db1d-4e66-9496-a9825294f946	3cd66d60-6c93-45f5-b1c2-734394ac2719
8f652db2-db1d-4e66-9496-a9825294f946	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
8f652db2-db1d-4e66-9496-a9825294f946	33b37a0d-4084-4b82-a8c9-9d62dafbb920
8f652db2-db1d-4e66-9496-a9825294f946	19ed0257-02df-4af1-9122-4e6dba71ad01
3ed5b34c-d917-4c72-9ae2-2d828fe7b86d	91636e6b-00c5-49b4-abf6-6764099c775e
3ed5b34c-d917-4c72-9ae2-2d828fe7b86d	3364be9d-4668-40ba-8db0-ee2f4a98d611
3ed5b34c-d917-4c72-9ae2-2d828fe7b86d	0774095f-c55e-4be1-827e-99ce5147620a
3ed5b34c-d917-4c72-9ae2-2d828fe7b86d	66208caa-a185-4954-a89d-33d0a77df85a
3ed5b34c-d917-4c72-9ae2-2d828fe7b86d	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
3ed5b34c-d917-4c72-9ae2-2d828fe7b86d	3cd66d60-6c93-45f5-b1c2-734394ac2719
3ed5b34c-d917-4c72-9ae2-2d828fe7b86d	8917333c-f663-43f6-a34b-7a1a8c500b37
e4cda860-6633-43a6-8d50-be4b847015bd	ccabc83a-7084-4d5d-b2fb-c7e65c0c3c25
e4cda860-6633-43a6-8d50-be4b847015bd	f627d602-9494-417d-a266-c11889f5e6e6
e4cda860-6633-43a6-8d50-be4b847015bd	0774095f-c55e-4be1-827e-99ce5147620a
e4cda860-6633-43a6-8d50-be4b847015bd	c86dc0e3-059e-474a-a5ee-41caca9cc50c
e4cda860-6633-43a6-8d50-be4b847015bd	856f48b1-1c2e-4fcc-b0cd-fc2d83e93ea9
e4cda860-6633-43a6-8d50-be4b847015bd	aa422596-aca0-4b78-b063-a6b3116f46ba
1b205d8c-5b42-4a3d-a677-9cdf0c5c2274	2b28e972-880e-4e36-898d-07c2b8c34ac7
1b205d8c-5b42-4a3d-a677-9cdf0c5c2274	509224ce-8b72-4a85-89b3-465e10492f4e
1b205d8c-5b42-4a3d-a677-9cdf0c5c2274	0774095f-c55e-4be1-827e-99ce5147620a
1b205d8c-5b42-4a3d-a677-9cdf0c5c2274	ba3bb0a8-4745-4dce-aa34-c5a67a615ca7
1b205d8c-5b42-4a3d-a677-9cdf0c5c2274	799b03e3-b644-4b48-8ad0-5d0ca8e7be54
1b205d8c-5b42-4a3d-a677-9cdf0c5c2274	aa422596-aca0-4b78-b063-a6b3116f46ba
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	48924f3d-2393-41ea-853d-b4e69bd57de5
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	9cfd3e00-712b-4e13-b1e8-790b37026d83
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	a1a7e2c0-af52-490d-b0fd-a86be023c202
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	5f3359bf-3477-4d7e-934f-8bc79c7786e1
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	52d175a2-ed50-4e88-a905-74a303739d67
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	84a4116a-e388-4695-beb1-858dddcbe9b0
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	d59a4a41-08aa-4db2-8c0b-0f26e19b493f
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	6c1bf982-23a8-403d-bdc0-c89c976601b1
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	ee4e4e23-cd64-414d-bba0-6dd609f9c973
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	a4eeabe2-6d29-406a-a4d6-9445c1faeb70
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	5eef00bb-7222-406e-93f9-601900ec7c0c
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	72a7b751-b2b4-44bc-bfc5-ed4b101d17b4
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	dec434fb-79da-4c39-8375-49791900c354
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	e63ac65f-4003-4f7f-bf1f-3957972db08f
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	0774095f-c55e-4be1-827e-99ce5147620a
2eb9dcd9-623f-4e31-874e-dfa7de94341a	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
2eb9dcd9-623f-4e31-874e-dfa7de94341a	dd1597d0-6222-412b-82d3-b4395b00b4c9
2eb9dcd9-623f-4e31-874e-dfa7de94341a	ccabc83a-7084-4d5d-b2fb-c7e65c0c3c25
2eb9dcd9-623f-4e31-874e-dfa7de94341a	2b28e972-880e-4e36-898d-07c2b8c34ac7
2eb9dcd9-623f-4e31-874e-dfa7de94341a	0774095f-c55e-4be1-827e-99ce5147620a
2eb9dcd9-623f-4e31-874e-dfa7de94341a	0282cc71-2897-4181-b6a9-f555704771fc
4ea7acdd-0566-4208-adb6-545e6b5224e1	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
4ea7acdd-0566-4208-adb6-545e6b5224e1	dd1597d0-6222-412b-82d3-b4395b00b4c9
4ea7acdd-0566-4208-adb6-545e6b5224e1	64357bde-020a-49af-8ad3-9f8c139f3c07
4ea7acdd-0566-4208-adb6-545e6b5224e1	0282cc71-2897-4181-b6a9-f555704771fc
25571bda-2dcf-410c-a566-7c17bad1cdf4	91636e6b-00c5-49b4-abf6-6764099c775e
25571bda-2dcf-410c-a566-7c17bad1cdf4	a36f9f85-48f1-4227-9a1b-74bb8ae0b785
25571bda-2dcf-410c-a566-7c17bad1cdf4	8a9338d1-b719-4923-82c4-7a27bdf91730
25571bda-2dcf-410c-a566-7c17bad1cdf4	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
25571bda-2dcf-410c-a566-7c17bad1cdf4	897b0471-cb96-49de-826c-b9b8c512a342
25571bda-2dcf-410c-a566-7c17bad1cdf4	dd1597d0-6222-412b-82d3-b4395b00b4c9
25571bda-2dcf-410c-a566-7c17bad1cdf4	3396ac25-2554-407b-9e72-a765be3778e7
25571bda-2dcf-410c-a566-7c17bad1cdf4	d2aa621a-a65e-46c1-b910-c4fb4c84259c
25571bda-2dcf-410c-a566-7c17bad1cdf4	3364be9d-4668-40ba-8db0-ee2f4a98d611
25571bda-2dcf-410c-a566-7c17bad1cdf4	ec55463c-2f8e-46b1-84ce-3abf434532c6
25571bda-2dcf-410c-a566-7c17bad1cdf4	51b8dcf5-2df4-48ff-bd43-4773817a4773
25571bda-2dcf-410c-a566-7c17bad1cdf4	5e845b17-ace2-4721-8ceb-60f6508982c1
25571bda-2dcf-410c-a566-7c17bad1cdf4	0774095f-c55e-4be1-827e-99ce5147620a
25571bda-2dcf-410c-a566-7c17bad1cdf4	ad350804-0a5c-4c3c-91ca-88d8228b2575
25571bda-2dcf-410c-a566-7c17bad1cdf4	66208caa-a185-4954-a89d-33d0a77df85a
25571bda-2dcf-410c-a566-7c17bad1cdf4	5644e220-8aba-4f7d-bb10-065af0fa5b1d
25571bda-2dcf-410c-a566-7c17bad1cdf4	bd3ee3ad-7578-4f4b-92f2-ab77ccc1e09c
25571bda-2dcf-410c-a566-7c17bad1cdf4	7155d123-11c5-4ccd-80a5-e9e41d2e0331
25571bda-2dcf-410c-a566-7c17bad1cdf4	9891f7bc-f8fc-47a6-8263-75d88913fb68
25571bda-2dcf-410c-a566-7c17bad1cdf4	fc40e933-9cf5-4838-8815-2385bb163c91
25571bda-2dcf-410c-a566-7c17bad1cdf4	aa422596-aca0-4b78-b063-a6b3116f46ba
25571bda-2dcf-410c-a566-7c17bad1cdf4	7cc5f70c-54e8-494b-b430-7890601ef0ed
25571bda-2dcf-410c-a566-7c17bad1cdf4	69d28e63-035f-4a76-92db-865ef917faa8
25571bda-2dcf-410c-a566-7c17bad1cdf4	1bad04e9-c09b-4f74-a5fc-8130d4099e21
25571bda-2dcf-410c-a566-7c17bad1cdf4	c50f67b9-205e-4576-974d-48cb3dc422c0
25571bda-2dcf-410c-a566-7c17bad1cdf4	1a84b01d-2240-47ae-aff0-e40e9d6ba84d
25571bda-2dcf-410c-a566-7c17bad1cdf4	d3f40435-5d75-4e15-90f8-1e969e6a95ba
25571bda-2dcf-410c-a566-7c17bad1cdf4	409a5752-eba5-49cc-bae3-2bf0a5091bdc
25571bda-2dcf-410c-a566-7c17bad1cdf4	0b1f004c-36b6-4c6b-99d7-fb0980c39b74
25571bda-2dcf-410c-a566-7c17bad1cdf4	9877957b-ebc5-415f-a67c-1622a5634595
25571bda-2dcf-410c-a566-7c17bad1cdf4	4a39413d-82ea-4601-94cf-2b170b3a1b3b
25571bda-2dcf-410c-a566-7c17bad1cdf4	daf91d1a-a35a-40e7-9033-59c9dd417d9f
25571bda-2dcf-410c-a566-7c17bad1cdf4	e8fac3df-72b3-4ffd-abec-697c8c35cb53
25571bda-2dcf-410c-a566-7c17bad1cdf4	c6f31724-0db8-4eb1-917e-4a41af3167f8
25571bda-2dcf-410c-a566-7c17bad1cdf4	7736ac7e-ddd6-4c04-a767-caeca3ded977
25571bda-2dcf-410c-a566-7c17bad1cdf4	3869381f-ede9-4b73-9296-76ee4f5daffc
25571bda-2dcf-410c-a566-7c17bad1cdf4	dded6a07-cea5-491b-81d2-19f3dcf88366
25571bda-2dcf-410c-a566-7c17bad1cdf4	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
25571bda-2dcf-410c-a566-7c17bad1cdf4	3c369693-3dad-44e7-b7e6-3d40354e9c26
25571bda-2dcf-410c-a566-7c17bad1cdf4	33b37a0d-4084-4b82-a8c9-9d62dafbb920
25571bda-2dcf-410c-a566-7c17bad1cdf4	47de5569-d564-4921-b84d-429de1473f17
25571bda-2dcf-410c-a566-7c17bad1cdf4	19ed0257-02df-4af1-9122-4e6dba71ad01
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	91636e6b-00c5-49b4-abf6-6764099c775e
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	a36f9f85-48f1-4227-9a1b-74bb8ae0b785
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	8a9338d1-b719-4923-82c4-7a27bdf91730
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	897b0471-cb96-49de-826c-b9b8c512a342
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	dd1597d0-6222-412b-82d3-b4395b00b4c9
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	3396ac25-2554-407b-9e72-a765be3778e7
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	d2aa621a-a65e-46c1-b910-c4fb4c84259c
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	3364be9d-4668-40ba-8db0-ee2f4a98d611
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	ec55463c-2f8e-46b1-84ce-3abf434532c6
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	51b8dcf5-2df4-48ff-bd43-4773817a4773
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	5e845b17-ace2-4721-8ceb-60f6508982c1
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	0774095f-c55e-4be1-827e-99ce5147620a
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	ad350804-0a5c-4c3c-91ca-88d8228b2575
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	66208caa-a185-4954-a89d-33d0a77df85a
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	5644e220-8aba-4f7d-bb10-065af0fa5b1d
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	bd3ee3ad-7578-4f4b-92f2-ab77ccc1e09c
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	7155d123-11c5-4ccd-80a5-e9e41d2e0331
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	9891f7bc-f8fc-47a6-8263-75d88913fb68
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	fc40e933-9cf5-4838-8815-2385bb163c91
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	aa422596-aca0-4b78-b063-a6b3116f46ba
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	7cc5f70c-54e8-494b-b430-7890601ef0ed
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	69d28e63-035f-4a76-92db-865ef917faa8
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	1bad04e9-c09b-4f74-a5fc-8130d4099e21
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	c50f67b9-205e-4576-974d-48cb3dc422c0
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	1a84b01d-2240-47ae-aff0-e40e9d6ba84d
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	409a5752-eba5-49cc-bae3-2bf0a5091bdc
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	0b1f004c-36b6-4c6b-99d7-fb0980c39b74
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	9877957b-ebc5-415f-a67c-1622a5634595
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	4a39413d-82ea-4601-94cf-2b170b3a1b3b
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	3869381f-ede9-4b73-9296-76ee4f5daffc
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	3c369693-3dad-44e7-b7e6-3d40354e9c26
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	19ed0257-02df-4af1-9122-4e6dba71ad01
6bb401b1-e59d-4065-bd51-48f6faf71c04	91636e6b-00c5-49b4-abf6-6764099c775e
6bb401b1-e59d-4065-bd51-48f6faf71c04	a36f9f85-48f1-4227-9a1b-74bb8ae0b785
6bb401b1-e59d-4065-bd51-48f6faf71c04	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
6bb401b1-e59d-4065-bd51-48f6faf71c04	dd1597d0-6222-412b-82d3-b4395b00b4c9
6bb401b1-e59d-4065-bd51-48f6faf71c04	3396ac25-2554-407b-9e72-a765be3778e7
6bb401b1-e59d-4065-bd51-48f6faf71c04	3364be9d-4668-40ba-8db0-ee2f4a98d611
6bb401b1-e59d-4065-bd51-48f6faf71c04	ec55463c-2f8e-46b1-84ce-3abf434532c6
6bb401b1-e59d-4065-bd51-48f6faf71c04	5e845b17-ace2-4721-8ceb-60f6508982c1
6bb401b1-e59d-4065-bd51-48f6faf71c04	0774095f-c55e-4be1-827e-99ce5147620a
6bb401b1-e59d-4065-bd51-48f6faf71c04	66208caa-a185-4954-a89d-33d0a77df85a
6bb401b1-e59d-4065-bd51-48f6faf71c04	5644e220-8aba-4f7d-bb10-065af0fa5b1d
6bb401b1-e59d-4065-bd51-48f6faf71c04	bd3ee3ad-7578-4f4b-92f2-ab77ccc1e09c
6bb401b1-e59d-4065-bd51-48f6faf71c04	9891f7bc-f8fc-47a6-8263-75d88913fb68
6bb401b1-e59d-4065-bd51-48f6faf71c04	aa422596-aca0-4b78-b063-a6b3116f46ba
6bb401b1-e59d-4065-bd51-48f6faf71c04	409a5752-eba5-49cc-bae3-2bf0a5091bdc
6bb401b1-e59d-4065-bd51-48f6faf71c04	0b1f004c-36b6-4c6b-99d7-fb0980c39b74
6bb401b1-e59d-4065-bd51-48f6faf71c04	3869381f-ede9-4b73-9296-76ee4f5daffc
f8349a90-e248-4492-8734-d6bdc1f49127	91636e6b-00c5-49b4-abf6-6764099c775e
f8349a90-e248-4492-8734-d6bdc1f49127	7b0f0dbb-ceea-48f7-bdf5-113a2217b46a
f8349a90-e248-4492-8734-d6bdc1f49127	81132ccb-4aa4-449b-8a23-5c634143aa9b
f8349a90-e248-4492-8734-d6bdc1f49127	6ddfb745-3b51-40a6-a4ac-f2080b03e24d
f8349a90-e248-4492-8734-d6bdc1f49127	bedd5e5b-4400-4986-ae3b-7ad3858f6f74
f8349a90-e248-4492-8734-d6bdc1f49127	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
f8349a90-e248-4492-8734-d6bdc1f49127	dd1597d0-6222-412b-82d3-b4395b00b4c9
f8349a90-e248-4492-8734-d6bdc1f49127	3364be9d-4668-40ba-8db0-ee2f4a98d611
f8349a90-e248-4492-8734-d6bdc1f49127	0774095f-c55e-4be1-827e-99ce5147620a
f8349a90-e248-4492-8734-d6bdc1f49127	ad350804-0a5c-4c3c-91ca-88d8228b2575
f8349a90-e248-4492-8734-d6bdc1f49127	66208caa-a185-4954-a89d-33d0a77df85a
f8349a90-e248-4492-8734-d6bdc1f49127	5644e220-8aba-4f7d-bb10-065af0fa5b1d
f8349a90-e248-4492-8734-d6bdc1f49127	c50f67b9-205e-4576-974d-48cb3dc422c0
f8349a90-e248-4492-8734-d6bdc1f49127	c16b6a19-f1b4-4687-a096-c7f425c4dfca
f8349a90-e248-4492-8734-d6bdc1f49127	409a5752-eba5-49cc-bae3-2bf0a5091bdc
f8349a90-e248-4492-8734-d6bdc1f49127	3869381f-ede9-4b73-9296-76ee4f5daffc
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	91636e6b-00c5-49b4-abf6-6764099c775e
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	a36f9f85-48f1-4227-9a1b-74bb8ae0b785
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	8a9338d1-b719-4923-82c4-7a27bdf91730
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	897b0471-cb96-49de-826c-b9b8c512a342
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	dd1597d0-6222-412b-82d3-b4395b00b4c9
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	3396ac25-2554-407b-9e72-a765be3778e7
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	3364be9d-4668-40ba-8db0-ee2f4a98d611
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	ec55463c-2f8e-46b1-84ce-3abf434532c6
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	0774095f-c55e-4be1-827e-99ce5147620a
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	66208caa-a185-4954-a89d-33d0a77df85a
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	5644e220-8aba-4f7d-bb10-065af0fa5b1d
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	bd3ee3ad-7578-4f4b-92f2-ab77ccc1e09c
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	9891f7bc-f8fc-47a6-8263-75d88913fb68
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	69d28e63-035f-4a76-92db-865ef917faa8
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	c50f67b9-205e-4576-974d-48cb3dc422c0
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	409a5752-eba5-49cc-bae3-2bf0a5091bdc
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	3869381f-ede9-4b73-9296-76ee4f5daffc
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	19ed0257-02df-4af1-9122-4e6dba71ad01
f8a57e45-9fd7-4095-96b9-f7a779bb5861	91636e6b-00c5-49b4-abf6-6764099c775e
f8a57e45-9fd7-4095-96b9-f7a779bb5861	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
f8a57e45-9fd7-4095-96b9-f7a779bb5861	dd1597d0-6222-412b-82d3-b4395b00b4c9
f8a57e45-9fd7-4095-96b9-f7a779bb5861	bedd5e5b-4400-4986-ae3b-7ad3858f6f74
f8a57e45-9fd7-4095-96b9-f7a779bb5861	8a0eba4b-01b9-49ef-93bb-ac6b191c07a4
f8a57e45-9fd7-4095-96b9-f7a779bb5861	0774095f-c55e-4be1-827e-99ce5147620a
f8a57e45-9fd7-4095-96b9-f7a779bb5861	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
f8a57e45-9fd7-4095-96b9-f7a779bb5861	1095336e-87e8-4bae-9030-3ef31a912faa
f8a57e45-9fd7-4095-96b9-f7a779bb5861	62d1e580-87c8-4809-a00d-ee56d6342b20
f8a57e45-9fd7-4095-96b9-f7a779bb5861	3c369693-3dad-44e7-b7e6-3d40354e9c26
f8a57e45-9fd7-4095-96b9-f7a779bb5861	33b37a0d-4084-4b82-a8c9-9d62dafbb920
f8a57e45-9fd7-4095-96b9-f7a779bb5861	47de5569-d564-4921-b84d-429de1473f17
f8a57e45-9fd7-4095-96b9-f7a779bb5861	19ed0257-02df-4af1-9122-4e6dba71ad01
f8a57e45-9fd7-4095-96b9-f7a779bb5861	bd3ee3ad-7578-4f4b-92f2-ab77ccc1e09c
f8a57e45-9fd7-4095-96b9-f7a779bb5861	9891f7bc-f8fc-47a6-8263-75d88913fb68
f8a57e45-9fd7-4095-96b9-f7a779bb5861	f6bd7a7b-d174-4839-b552-7feaec82648c
f8a57e45-9fd7-4095-96b9-f7a779bb5861	d307cdae-e1b6-476b-a535-ee6937862295
f8a57e45-9fd7-4095-96b9-f7a779bb5861	aa422596-aca0-4b78-b063-a6b3116f46ba
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	0e4ce8e2-f5a7-44a4-91e2-c8157ff57e61
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	f1f00f22-645d-45db-ba6d-2950512b07e1
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	dd1597d0-6222-412b-82d3-b4395b00b4c9
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	64357bde-020a-49af-8ad3-9f8c139f3c07
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	ee8d9bfa-a1fb-4bad-bb07-5b17fa08c1c1
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	0774095f-c55e-4be1-827e-99ce5147620a
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	0282cc71-2897-4181-b6a9-f555704771fc
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	66208caa-a185-4954-a89d-33d0a77df85a
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	c06c6401-ca05-46da-8d9e-14809260df45
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	aa422596-aca0-4b78-b063-a6b3116f46ba
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	1095336e-87e8-4bae-9030-3ef31a912faa
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	62d1e580-87c8-4809-a00d-ee56d6342b20
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	33b37a0d-4084-4b82-a8c9-9d62dafbb920
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	19ed0257-02df-4af1-9122-4e6dba71ad01
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	0e4ce8e2-f5a7-44a4-91e2-c8157ff57e61
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	f1f00f22-645d-45db-ba6d-2950512b07e1
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	dd1597d0-6222-412b-82d3-b4395b00b4c9
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	64357bde-020a-49af-8ad3-9f8c139f3c07
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	ee8d9bfa-a1fb-4bad-bb07-5b17fa08c1c1
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	0774095f-c55e-4be1-827e-99ce5147620a
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	0282cc71-2897-4181-b6a9-f555704771fc
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	66208caa-a185-4954-a89d-33d0a77df85a
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	c06c6401-ca05-46da-8d9e-14809260df45
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	aa422596-aca0-4b78-b063-a6b3116f46ba
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	1095336e-87e8-4bae-9030-3ef31a912faa
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	62d1e580-87c8-4809-a00d-ee56d6342b20
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	3c369693-3dad-44e7-b7e6-3d40354e9c26
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	33b37a0d-4084-4b82-a8c9-9d62dafbb920
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	47de5569-d564-4921-b84d-429de1473f17
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	19ed0257-02df-4af1-9122-4e6dba71ad01
83786f07-c911-4526-bbe9-04d55f5990d0	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
83786f07-c911-4526-bbe9-04d55f5990d0	0e4ce8e2-f5a7-44a4-91e2-c8157ff57e61
83786f07-c911-4526-bbe9-04d55f5990d0	f1f00f22-645d-45db-ba6d-2950512b07e1
83786f07-c911-4526-bbe9-04d55f5990d0	dd1597d0-6222-412b-82d3-b4395b00b4c9
83786f07-c911-4526-bbe9-04d55f5990d0	0774095f-c55e-4be1-827e-99ce5147620a
83786f07-c911-4526-bbe9-04d55f5990d0	0282cc71-2897-4181-b6a9-f555704771fc
83786f07-c911-4526-bbe9-04d55f5990d0	66208caa-a185-4954-a89d-33d0a77df85a
83786f07-c911-4526-bbe9-04d55f5990d0	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
83786f07-c911-4526-bbe9-04d55f5990d0	c06c6401-ca05-46da-8d9e-14809260df45
83786f07-c911-4526-bbe9-04d55f5990d0	aa422596-aca0-4b78-b063-a6b3116f46ba
51b71bcf-0ea7-4b2a-90bd-aaa0f0708dce	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
51b71bcf-0ea7-4b2a-90bd-aaa0f0708dce	0e4ce8e2-f5a7-44a4-91e2-c8157ff57e61
51b71bcf-0ea7-4b2a-90bd-aaa0f0708dce	dd1597d0-6222-412b-82d3-b4395b00b4c9
51b71bcf-0ea7-4b2a-90bd-aaa0f0708dce	0774095f-c55e-4be1-827e-99ce5147620a
51b71bcf-0ea7-4b2a-90bd-aaa0f0708dce	66208caa-a185-4954-a89d-33d0a77df85a
baac80d8-48ec-4f57-b4de-8c7606d09fa7	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
baac80d8-48ec-4f57-b4de-8c7606d09fa7	0e4ce8e2-f5a7-44a4-91e2-c8157ff57e61
baac80d8-48ec-4f57-b4de-8c7606d09fa7	f1f00f22-645d-45db-ba6d-2950512b07e1
baac80d8-48ec-4f57-b4de-8c7606d09fa7	dd1597d0-6222-412b-82d3-b4395b00b4c9
baac80d8-48ec-4f57-b4de-8c7606d09fa7	64357bde-020a-49af-8ad3-9f8c139f3c07
baac80d8-48ec-4f57-b4de-8c7606d09fa7	ee8d9bfa-a1fb-4bad-bb07-5b17fa08c1c1
baac80d8-48ec-4f57-b4de-8c7606d09fa7	0774095f-c55e-4be1-827e-99ce5147620a
baac80d8-48ec-4f57-b4de-8c7606d09fa7	66208caa-a185-4954-a89d-33d0a77df85a
baac80d8-48ec-4f57-b4de-8c7606d09fa7	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
baac80d8-48ec-4f57-b4de-8c7606d09fa7	c06c6401-ca05-46da-8d9e-14809260df45
baac80d8-48ec-4f57-b4de-8c7606d09fa7	aa422596-aca0-4b78-b063-a6b3116f46ba
baac80d8-48ec-4f57-b4de-8c7606d09fa7	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
baac80d8-48ec-4f57-b4de-8c7606d09fa7	1095336e-87e8-4bae-9030-3ef31a912faa
baac80d8-48ec-4f57-b4de-8c7606d09fa7	33b37a0d-4084-4b82-a8c9-9d62dafbb920
baac80d8-48ec-4f57-b4de-8c7606d09fa7	19ed0257-02df-4af1-9122-4e6dba71ad01
baac80d8-48ec-4f57-b4de-8c7606d09fa7	a317995b-c64e-45c2-b8a4-a850dd06a6c2
baac80d8-48ec-4f57-b4de-8c7606d09fa7	dae3e013-c6cc-4f50-9fbb-71e043cc1b3f
8a7dcd8c-7677-4638-8885-03577c8fdb8e	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
8a7dcd8c-7677-4638-8885-03577c8fdb8e	0e4ce8e2-f5a7-44a4-91e2-c8157ff57e61
8a7dcd8c-7677-4638-8885-03577c8fdb8e	0774095f-c55e-4be1-827e-99ce5147620a
8a7dcd8c-7677-4638-8885-03577c8fdb8e	0282cc71-2897-4181-b6a9-f555704771fc
8a7dcd8c-7677-4638-8885-03577c8fdb8e	66208caa-a185-4954-a89d-33d0a77df85a
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	0e4ce8e2-f5a7-44a4-91e2-c8157ff57e61
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	f1f00f22-645d-45db-ba6d-2950512b07e1
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	dd1597d0-6222-412b-82d3-b4395b00b4c9
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	3396ac25-2554-407b-9e72-a765be3778e7
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	bedd5e5b-4400-4986-ae3b-7ad3858f6f74
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	7b0f0dbb-ceea-48f7-bdf5-113a2217b46a
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	0774095f-c55e-4be1-827e-99ce5147620a
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	ad350804-0a5c-4c3c-91ca-88d8228b2575
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	66208caa-a185-4954-a89d-33d0a77df85a
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	c06c6401-ca05-46da-8d9e-14809260df45
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	a172578f-9502-4bf0-8070-7b966be06af7
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	aa422596-aca0-4b78-b063-a6b3116f46ba
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	19ed0257-02df-4af1-9122-4e6dba71ad01
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	409a5752-eba5-49cc-bae3-2bf0a5091bdc
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	3869381f-ede9-4b73-9296-76ee4f5daffc
9ec877f4-f259-43be-89ce-6b182202e96d	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
9ec877f4-f259-43be-89ce-6b182202e96d	f1f00f22-645d-45db-ba6d-2950512b07e1
9ec877f4-f259-43be-89ce-6b182202e96d	897b0471-cb96-49de-826c-b9b8c512a342
9ec877f4-f259-43be-89ce-6b182202e96d	dd1597d0-6222-412b-82d3-b4395b00b4c9
9ec877f4-f259-43be-89ce-6b182202e96d	8a0eba4b-01b9-49ef-93bb-ac6b191c07a4
9ec877f4-f259-43be-89ce-6b182202e96d	0f8365f6-d8ed-498a-a870-ed260488b6cb
9ec877f4-f259-43be-89ce-6b182202e96d	bedd5e5b-4400-4986-ae3b-7ad3858f6f74
9ec877f4-f259-43be-89ce-6b182202e96d	0774095f-c55e-4be1-827e-99ce5147620a
9ec877f4-f259-43be-89ce-6b182202e96d	ad350804-0a5c-4c3c-91ca-88d8228b2575
9ec877f4-f259-43be-89ce-6b182202e96d	bd3ee3ad-7578-4f4b-92f2-ab77ccc1e09c
9ec877f4-f259-43be-89ce-6b182202e96d	9891f7bc-f8fc-47a6-8263-75d88913fb68
9ec877f4-f259-43be-89ce-6b182202e96d	f6bd7a7b-d174-4839-b552-7feaec82648c
9ec877f4-f259-43be-89ce-6b182202e96d	aa422596-aca0-4b78-b063-a6b3116f46ba
9ec877f4-f259-43be-89ce-6b182202e96d	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
9ec877f4-f259-43be-89ce-6b182202e96d	62d1e580-87c8-4809-a00d-ee56d6342b20
9ec877f4-f259-43be-89ce-6b182202e96d	3c369693-3dad-44e7-b7e6-3d40354e9c26
9ec877f4-f259-43be-89ce-6b182202e96d	33b37a0d-4084-4b82-a8c9-9d62dafbb920
9ec877f4-f259-43be-89ce-6b182202e96d	47de5569-d564-4921-b84d-429de1473f17
9ec877f4-f259-43be-89ce-6b182202e96d	19ed0257-02df-4af1-9122-4e6dba71ad01
67530ebb-3d44-457e-8ca5-8a9a299b0503	7b0f0dbb-ceea-48f7-bdf5-113a2217b46a
67530ebb-3d44-457e-8ca5-8a9a299b0503	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
67530ebb-3d44-457e-8ca5-8a9a299b0503	dd1597d0-6222-412b-82d3-b4395b00b4c9
67530ebb-3d44-457e-8ca5-8a9a299b0503	0774095f-c55e-4be1-827e-99ce5147620a
67530ebb-3d44-457e-8ca5-8a9a299b0503	66208caa-a185-4954-a89d-33d0a77df85a
67530ebb-3d44-457e-8ca5-8a9a299b0503	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
67530ebb-3d44-457e-8ca5-8a9a299b0503	0596b179-f03e-4494-834c-55a1a564170a
67530ebb-3d44-457e-8ca5-8a9a299b0503	e7e92c15-5c85-48bd-ab0d-ec95c8025905
67530ebb-3d44-457e-8ca5-8a9a299b0503	6b231f55-36d2-4c65-81c3-937ec8840484
67530ebb-3d44-457e-8ca5-8a9a299b0503	e7c363e6-8387-4802-a51c-63b7169abf4b
67530ebb-3d44-457e-8ca5-8a9a299b0503	d3be48d9-5430-4ca4-9a1a-5f3298668f82
67530ebb-3d44-457e-8ca5-8a9a299b0503	2c613912-53d1-4aff-84af-f5f12f1ac81f
67530ebb-3d44-457e-8ca5-8a9a299b0503	0e29679b-4697-4838-aeab-a0da25e5cb2f
67530ebb-3d44-457e-8ca5-8a9a299b0503	5def6cc8-dcae-4216-b549-3f7e00d89efb
67530ebb-3d44-457e-8ca5-8a9a299b0503	61d883aa-a7dc-44c5-aacc-6888d521c0d5
67530ebb-3d44-457e-8ca5-8a9a299b0503	aa422596-aca0-4b78-b063-a6b3116f46ba
67530ebb-3d44-457e-8ca5-8a9a299b0503	3869381f-ede9-4b73-9296-76ee4f5daffc
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	7b0f0dbb-ceea-48f7-bdf5-113a2217b46a
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	dd1597d0-6222-412b-82d3-b4395b00b4c9
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	0774095f-c55e-4be1-827e-99ce5147620a
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	66208caa-a185-4954-a89d-33d0a77df85a
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	0596b179-f03e-4494-834c-55a1a564170a
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	e7c363e6-8387-4802-a51c-63b7169abf4b
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	d3be48d9-5430-4ca4-9a1a-5f3298668f82
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	2c613912-53d1-4aff-84af-f5f12f1ac81f
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	0e29679b-4697-4838-aeab-a0da25e5cb2f
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	5def6cc8-dcae-4216-b549-3f7e00d89efb
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	61d883aa-a7dc-44c5-aacc-6888d521c0d5
46480511-7537-4ea9-809e-4be743e76b08	7b0f0dbb-ceea-48f7-bdf5-113a2217b46a
46480511-7537-4ea9-809e-4be743e76b08	0774095f-c55e-4be1-827e-99ce5147620a
46480511-7537-4ea9-809e-4be743e76b08	66208caa-a185-4954-a89d-33d0a77df85a
46480511-7537-4ea9-809e-4be743e76b08	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
46480511-7537-4ea9-809e-4be743e76b08	0596b179-f03e-4494-834c-55a1a564170a
46480511-7537-4ea9-809e-4be743e76b08	0e29679b-4697-4838-aeab-a0da25e5cb2f
46480511-7537-4ea9-809e-4be743e76b08	5def6cc8-dcae-4216-b549-3f7e00d89efb
46480511-7537-4ea9-809e-4be743e76b08	409a5752-eba5-49cc-bae3-2bf0a5091bdc
46480511-7537-4ea9-809e-4be743e76b08	8d51d66a-66a1-4d8b-8f38-b82f74385a9b
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	91636e6b-00c5-49b4-abf6-6764099c775e
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	a36f9f85-48f1-4227-9a1b-74bb8ae0b785
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	7b0f0dbb-ceea-48f7-bdf5-113a2217b46a
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	81132ccb-4aa4-449b-8a23-5c634143aa9b
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	6ddfb745-3b51-40a6-a4ac-f2080b03e24d
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	3364be9d-4668-40ba-8db0-ee2f4a98d611
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	ec55463c-2f8e-46b1-84ce-3abf434532c6
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	51b8dcf5-2df4-48ff-bd43-4773817a4773
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	0774095f-c55e-4be1-827e-99ce5147620a
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	66208caa-a185-4954-a89d-33d0a77df85a
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	3cd66d60-6c93-45f5-b1c2-734394ac2719
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	409a5752-eba5-49cc-bae3-2bf0a5091bdc
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	d384612f-09a1-4414-a4b7-4d0133ea6c83
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	d17313b3-6847-48c3-b925-3281efdc8a7e
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	3869381f-ede9-4b73-9296-76ee4f5daffc
63dd9060-7de6-4276-9708-e62d4e178e5d	a317995b-c64e-45c2-b8a4-a850dd06a6c2
63dd9060-7de6-4276-9708-e62d4e178e5d	a76ca499-ec0d-40fd-aec9-1d55d0fcbfda
63dd9060-7de6-4276-9708-e62d4e178e5d	df2fb3c7-5cb1-4077-979f-34f2b00d64b9
63dd9060-7de6-4276-9708-e62d4e178e5d	7d69d441-be0f-4c5a-bc4f-8a6c089d0260
63dd9060-7de6-4276-9708-e62d4e178e5d	dae3e013-c6cc-4f50-9fbb-71e043cc1b3f
63dd9060-7de6-4276-9708-e62d4e178e5d	a9aa394f-9d3e-466d-8f43-e3c800456836
63dd9060-7de6-4276-9708-e62d4e178e5d	6040a507-6889-4356-8958-2a9d168b094d
63dd9060-7de6-4276-9708-e62d4e178e5d	0774095f-c55e-4be1-827e-99ce5147620a
63dd9060-7de6-4276-9708-e62d4e178e5d	66208caa-a185-4954-a89d-33d0a77df85a
63dd9060-7de6-4276-9708-e62d4e178e5d	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
63dd9060-7de6-4276-9708-e62d4e178e5d	9877957b-ebc5-415f-a67c-1622a5634595
63dd9060-7de6-4276-9708-e62d4e178e5d	53e2bb1d-f51b-4b9a-b3c2-c37d635d6587
63dd9060-7de6-4276-9708-e62d4e178e5d	4df36a47-0d8f-411e-b33b-9a05b434e348
63dd9060-7de6-4276-9708-e62d4e178e5d	7aa9855f-cd61-4537-8459-3b9c19149f51
81705e34-6e86-4be8-95e3-6a620c9a33a0	a317995b-c64e-45c2-b8a4-a850dd06a6c2
81705e34-6e86-4be8-95e3-6a620c9a33a0	7d69d441-be0f-4c5a-bc4f-8a6c089d0260
81705e34-6e86-4be8-95e3-6a620c9a33a0	dae3e013-c6cc-4f50-9fbb-71e043cc1b3f
81705e34-6e86-4be8-95e3-6a620c9a33a0	a9aa394f-9d3e-466d-8f43-e3c800456836
81705e34-6e86-4be8-95e3-6a620c9a33a0	0774095f-c55e-4be1-827e-99ce5147620a
81705e34-6e86-4be8-95e3-6a620c9a33a0	66208caa-a185-4954-a89d-33d0a77df85a
003217d2-6dea-4c10-8503-e3c2b6793bbb	a317995b-c64e-45c2-b8a4-a850dd06a6c2
003217d2-6dea-4c10-8503-e3c2b6793bbb	7d69d441-be0f-4c5a-bc4f-8a6c089d0260
003217d2-6dea-4c10-8503-e3c2b6793bbb	dae3e013-c6cc-4f50-9fbb-71e043cc1b3f
003217d2-6dea-4c10-8503-e3c2b6793bbb	a9aa394f-9d3e-466d-8f43-e3c800456836
003217d2-6dea-4c10-8503-e3c2b6793bbb	3364be9d-4668-40ba-8db0-ee2f4a98d611
003217d2-6dea-4c10-8503-e3c2b6793bbb	0774095f-c55e-4be1-827e-99ce5147620a
003217d2-6dea-4c10-8503-e3c2b6793bbb	66208caa-a185-4954-a89d-33d0a77df85a
814dd001-57a7-4587-b990-68abd46bce76	3364be9d-4668-40ba-8db0-ee2f4a98d611
814dd001-57a7-4587-b990-68abd46bce76	ec55463c-2f8e-46b1-84ce-3abf434532c6
814dd001-57a7-4587-b990-68abd46bce76	7b0f0dbb-ceea-48f7-bdf5-113a2217b46a
814dd001-57a7-4587-b990-68abd46bce76	0774095f-c55e-4be1-827e-99ce5147620a
814dd001-57a7-4587-b990-68abd46bce76	66208caa-a185-4954-a89d-33d0a77df85a
4cdebabd-8e1f-43a5-8e33-20bf416d2ca3	a317995b-c64e-45c2-b8a4-a850dd06a6c2
4cdebabd-8e1f-43a5-8e33-20bf416d2ca3	dae3e013-c6cc-4f50-9fbb-71e043cc1b3f
4cdebabd-8e1f-43a5-8e33-20bf416d2ca3	0774095f-c55e-4be1-827e-99ce5147620a
4cdebabd-8e1f-43a5-8e33-20bf416d2ca3	66208caa-a185-4954-a89d-33d0a77df85a
4cdebabd-8e1f-43a5-8e33-20bf416d2ca3	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
4cdebabd-8e1f-43a5-8e33-20bf416d2ca3	bedd5e5b-4400-4986-ae3b-7ad3858f6f74
44d7e404-ae06-4611-9a07-34ba30d9db5c	91636e6b-00c5-49b4-abf6-6764099c775e
44d7e404-ae06-4611-9a07-34ba30d9db5c	5e845b17-ace2-4721-8ceb-60f6508982c1
44d7e404-ae06-4611-9a07-34ba30d9db5c	a510927b-975c-4139-8eb8-71fa6e2bdd1c
44d7e404-ae06-4611-9a07-34ba30d9db5c	0774095f-c55e-4be1-827e-99ce5147620a
44d7e404-ae06-4611-9a07-34ba30d9db5c	66208caa-a185-4954-a89d-33d0a77df85a
44d7e404-ae06-4611-9a07-34ba30d9db5c	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
44d7e404-ae06-4611-9a07-34ba30d9db5c	a317995b-c64e-45c2-b8a4-a850dd06a6c2
44d7e404-ae06-4611-9a07-34ba30d9db5c	a76ca499-ec0d-40fd-aec9-1d55d0fcbfda
44d7e404-ae06-4611-9a07-34ba30d9db5c	df2fb3c7-5cb1-4077-979f-34f2b00d64b9
efe7eb62-e748-4a1b-83c8-7a8b76d816a7	91636e6b-00c5-49b4-abf6-6764099c775e
efe7eb62-e748-4a1b-83c8-7a8b76d816a7	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
efe7eb62-e748-4a1b-83c8-7a8b76d816a7	dd1597d0-6222-412b-82d3-b4395b00b4c9
efe7eb62-e748-4a1b-83c8-7a8b76d816a7	0774095f-c55e-4be1-827e-99ce5147620a
efe7eb62-e748-4a1b-83c8-7a8b76d816a7	66208caa-a185-4954-a89d-33d0a77df85a
efe7eb62-e748-4a1b-83c8-7a8b76d816a7	8f82cff6-a5bc-48b3-9c38-cd04424f47a9
efe7eb62-e748-4a1b-83c8-7a8b76d816a7	19ed0257-02df-4af1-9122-4e6dba71ad01
efe7eb62-e748-4a1b-83c8-7a8b76d816a7	a317995b-c64e-45c2-b8a4-a850dd06a6c2
e6a30931-5231-41eb-bf3a-a271d4fa967f	c209b4ed-d9d5-45ca-89e5-2277fcc52f3e
e6a30931-5231-41eb-bf3a-a271d4fa967f	7b0f0dbb-ceea-48f7-bdf5-113a2217b46a
e6a30931-5231-41eb-bf3a-a271d4fa967f	0774095f-c55e-4be1-827e-99ce5147620a
e6a30931-5231-41eb-bf3a-a271d4fa967f	66208caa-a185-4954-a89d-33d0a77df85a
e6a30931-5231-41eb-bf3a-a271d4fa967f	64357bde-020a-49af-8ad3-9f8c139f3c07
550fa94c-fd39-43ae-9e33-5e8ee46ac4ee	7b0f0dbb-ceea-48f7-bdf5-113a2217b46a
550fa94c-fd39-43ae-9e33-5e8ee46ac4ee	bedd5e5b-4400-4986-ae3b-7ad3858f6f74
550fa94c-fd39-43ae-9e33-5e8ee46ac4ee	0774095f-c55e-4be1-827e-99ce5147620a
550fa94c-fd39-43ae-9e33-5e8ee46ac4ee	ad350804-0a5c-4c3c-91ca-88d8228b2575
550fa94c-fd39-43ae-9e33-5e8ee46ac4ee	66208caa-a185-4954-a89d-33d0a77df85a
550fa94c-fd39-43ae-9e33-5e8ee46ac4ee	5644e220-8aba-4f7d-bb10-065af0fa5b1d
550fa94c-fd39-43ae-9e33-5e8ee46ac4ee	c50f67b9-205e-4576-974d-48cb3dc422c0
550fa94c-fd39-43ae-9e33-5e8ee46ac4ee	c16b6a19-f1b4-4687-a096-c7f425c4dfca
550fa94c-fd39-43ae-9e33-5e8ee46ac4ee	ccabc83a-7084-4d5d-b2fb-c7e65c0c3c25
550fa94c-fd39-43ae-9e33-5e8ee46ac4ee	2b28e972-880e-4e36-898d-07c2b8c34ac7
64daece2-c730-42d2-bbdd-b527bc9783f3	7b0f0dbb-ceea-48f7-bdf5-113a2217b46a
64daece2-c730-42d2-bbdd-b527bc9783f3	0774095f-c55e-4be1-827e-99ce5147620a
64daece2-c730-42d2-bbdd-b527bc9783f3	66208caa-a185-4954-a89d-33d0a77df85a
64daece2-c730-42d2-bbdd-b527bc9783f3	4948fb4c-a3b8-46b4-b23c-13aec7ecac80
64daece2-c730-42d2-bbdd-b527bc9783f3	ccabc83a-7084-4d5d-b2fb-c7e65c0c3c25
64daece2-c730-42d2-bbdd-b527bc9783f3	2b28e972-880e-4e36-898d-07c2b8c34ac7
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, code, libelle, description, "estSysteme", "estActif", "parentId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
cb3d362c-108d-4a7c-8c2a-25f10599c832	SUPER_ADMIN	Super Administrateur	Accès total à toutes les fonctionnalités	t	t	\N	\N	2026-06-14 03:05:31.574848	2026-06-14 03:05:31.574848
c5a53957-315f-4cb3-a02b-37c38e5bded0	ADMIN	Administrateur	Administrateur de l'établissement	t	t	\N	\N	2026-06-14 03:05:31.580145	2026-06-14 03:05:31.580145
657cd2c4-a044-48f8-a24a-4074313cf61d	CHEF_ETABLISSEMENT	Chef d'Établissement	Direction de l'établissement	t	t	\N	\N	2026-06-14 03:05:31.593229	2026-06-14 03:05:31.593229
8f652db2-db1d-4e66-9496-a9825294f946	ENSEIGNANT	Enseignant	Enseignant (générique)	t	t	\N	\N	2026-06-14 03:05:31.610589	2026-06-14 03:05:31.610589
3ed5b34c-d917-4c72-9ae2-2d828fe7b86d	PERSONNEL	Personnel	Personnel non-enseignant (générique)	t	t	\N	\N	2026-06-14 03:05:31.618689	2026-06-14 03:05:31.618689
2eb9dcd9-623f-4e31-874e-dfa7de94341a	PARENT	Parent	Parent d'élève (générique)	t	t	\N	\N	2026-06-14 03:05:31.630628	2026-06-14 03:05:31.630628
4ea7acdd-0566-4208-adb6-545e6b5224e1	ELEVE	Élève	Élève (générique)	t	t	\N	\N	2026-06-14 03:05:31.637743	2026-06-14 03:05:31.637743
25571bda-2dcf-410c-a566-7c17bad1cdf4	PROVISEUR	Proviseur	Chef d'établissement secondaire (lycée)	t	t	\N	\N	2026-06-14 03:05:31.646235	2026-06-14 03:05:31.646235
5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	PRINCIPAL	Principal	Chef d'établissement collège	t	t	\N	\N	2026-06-14 03:05:31.654863	2026-06-14 03:05:31.654863
6bb401b1-e59d-4065-bd51-48f6faf71c04	DIRECTEUR	Directeur	Chef d'école primaire	t	t	\N	\N	2026-06-14 03:05:31.666391	2026-06-14 03:05:31.666391
f8349a90-e248-4492-8734-d6bdc1f49127	CENSEUR	Censeur	Responsable discipline & organisation	t	t	\N	\N	2026-06-14 03:05:31.676253	2026-06-14 03:05:31.676253
ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	DIRECTEUR_ADJOINT	Directeur Adjoint	Chef d'établissement adjoint	t	t	\N	\N	2026-06-14 03:05:31.690857	2026-06-14 03:05:31.690857
f8a57e45-9fd7-4095-96b9-f7a779bb5861	RESPONSABLE_PEDAGOGIQUE	Responsable Pédagogique	Conseiller pédagogique interne	t	t	\N	\N	2026-06-14 03:05:31.702513	2026-06-14 03:05:31.702513
a03e7960-d69e-4e39-a718-cc2abdb4cfdb	PROFESSEUR_CERTIFIE	Professeur Certifié	Enseignant secondaire certifié	t	t	\N	\N	2026-06-14 03:05:31.711156	2026-06-14 03:05:31.711156
fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	PROFESSEUR_AGREGE	Professeur Agrégé	Enseignant lycée (agrégé)	t	t	\N	\N	2026-06-14 03:05:31.722865	2026-06-14 03:05:31.722865
83786f07-c911-4526-bbe9-04d55f5990d0	INSTITUTEUR	Instituteur	Enseignant primaire	t	t	\N	\N	2026-06-14 03:05:31.737225	2026-06-14 03:05:31.737225
51b71bcf-0ea7-4b2a-90bd-aaa0f0708dce	MAITRE_AUXILIAIRE	Maître Auxiliaire	Enseignant contractuel	t	t	\N	\N	2026-06-14 03:05:31.751181	2026-06-14 03:05:31.751181
baac80d8-48ec-4f57-b4de-8c7606d09fa7	PROFESSEUR_TECHNIQUE	Professeur Technique	Enseignant technique/professionnel	t	t	\N	\N	2026-06-14 03:05:31.760153	2026-06-14 03:05:31.760153
8a7dcd8c-7677-4638-8885-03577c8fdb8e	EDUCATEUR_MATERNELLE	Éducateur Maternelle	Enseignant maternelle	t	t	\N	\N	2026-06-14 03:05:31.770588	2026-06-14 03:05:31.770588
0fd69ff7-7cb8-4500-96c6-e2c8f705f926	PROFESSEUR_PRINCIPAL	Professeur Principal	Responsable de classe	t	t	\N	\N	2026-06-14 03:05:31.785155	2026-06-14 03:05:31.785155
9ec877f4-f259-43be-89ce-6b182202e96d	COORDINATEUR_DISCIPLINE	Coordinateur	Coordinateur matière/département	t	t	\N	\N	2026-06-14 03:05:31.792364	2026-06-14 03:05:31.792364
67530ebb-3d44-457e-8ca5-8a9a299b0503	CONSEILLER_ORIENTEUR	Conseiller d'Orientation	Conseiller orientation scolaire	t	t	\N	\N	2026-06-14 03:05:31.797272	2026-06-14 03:05:31.797272
dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	PSYCHOLOGUE_SCOLAIRE	Psychologue Scolaire	Psychologue de l'éducation	t	t	\N	\N	2026-06-14 03:05:31.80294	2026-06-14 03:05:31.80294
46480511-7537-4ea9-809e-4be743e76b08	ASSISTANT_SOCIAL	Assistant Social	Assistant social scolaire	t	t	\N	\N	2026-06-14 03:05:31.808187	2026-06-14 03:05:31.808187
7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	SECRETAIRE_DIRECTION	Secrétaire de Direction	Secrétaire de direction	t	t	\N	\N	2026-06-14 03:05:31.813561	2026-06-14 03:05:31.813561
5bbf24c0-e072-4893-9e2a-66fd009e6889	COMPTABLE	Comptable	Agent comptable	t	t	\N	\N	2026-06-14 03:05:31.820423	2026-06-14 03:05:31.820423
63dd9060-7de6-4276-9708-e62d4e178e5d	GESTIONNAIRE	Gestionnaire	Gestionnaire matériel/logistique	t	t	\N	\N	2026-06-14 03:05:31.82687	2026-06-14 03:05:31.82687
81705e34-6e86-4be8-95e3-6a620c9a33a0	BIBLIOTHECAIRE	Bibliothécaire	Responsable bibliothèque	t	t	\N	\N	2026-06-14 03:05:31.839373	2026-06-14 03:05:31.839373
003217d2-6dea-4c10-8503-e3c2b6793bbb	DOCUMENTALISTE	Documentaliste	Responsable documentation	t	t	\N	\N	2026-06-14 03:05:31.849146	2026-06-14 03:05:31.849146
814dd001-57a7-4587-b990-68abd46bce76	ARCHIVISTE	Archiviste	Responsable archives	t	t	\N	\N	2026-06-14 03:05:31.859142	2026-06-14 03:05:31.859142
4cdebabd-8e1f-43a5-8e33-20bf416d2ca3	TECHNICIEN_LABO	Technicien Labo	Technicien laboratoire sciences	t	t	\N	\N	2026-06-14 03:05:31.864427	2026-06-14 03:05:31.864427
44d7e404-ae06-4611-9a07-34ba30d9db5c	TECHNICIEN_INFO	Technicien Informatique	Technicien informatique	t	t	\N	\N	2026-06-14 03:05:31.869564	2026-06-14 03:05:31.869564
efe7eb62-e748-4a1b-83c8-7a8b76d816a7	CONSEILLER_TIC	Conseiller TIC	Conseiller TIC pédagogique	t	t	\N	\N	2026-06-14 03:05:31.874934	2026-06-14 03:05:31.874934
e6a30931-5231-41eb-bf3a-a271d4fa967f	AIDE_EDUCATEUR	Aide Éducateur	Assistant pédagogique	t	t	\N	\N	2026-06-14 03:05:31.879758	2026-06-14 03:05:31.879758
550fa94c-fd39-43ae-9e33-5e8ee46ac4ee	SURVEILLANT_GENERAL	Surveillant Général	Responsable surveillance	t	t	\N	\N	2026-06-14 03:05:31.884076	2026-06-14 03:05:31.884076
64daece2-c730-42d2-bbdd-b527bc9783f3	SURVEILLANT	Surveillant	Maître d'internat / surveillant	t	t	\N	\N	2026-06-14 03:05:31.888048	2026-06-14 03:05:31.888048
e4cda860-6633-43a6-8d50-be4b847015bd	RESPONSABLE_CANTINE	Responsable Cantine	Gestion de la cantine	t	t	\N	\N	2026-06-14 03:05:31.892448	2026-06-14 03:05:31.892448
1b205d8c-5b42-4a3d-a677-9cdf0c5c2274	RESPONSABLE_TRANSPORT	Responsable Transport	Gestion du transport	t	t	\N	\N	2026-06-14 03:05:31.89728	2026-06-14 03:05:31.89728
7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	RESPONSABLE_INFRASTRUCTURE	Responsable Infrastructure	Parking, maintenance, sécurité	t	t	\N	\N	2026-06-14 03:05:31.900961	2026-06-14 03:05:31.900961
\.


--
-- Data for Name: sanctions_eleves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sanctions_eleves (id, "eleveId", "incidentId", type, statut, motif, description, "dateDebut", "dateFin", "joursExclusion", "mesuresAccompagnement", "decideParId", "etablissementId", "anneeScolaireId", "periodeId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: scores_eleves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scores_eleves (id, "eleveId", "periodeId", type, score, rang, details, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: scores_personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scores_personnel (id, "membrePersonnelId", "etablissementId", "anneeScolaireId", "periodeId", "typePersonnelId", "categoriePersonnel", "matiereId", "classeId", "scoreGlobal", "scoreAssiduite", "scoreComportement", "scorePerformance", "scorePedagogie", "pointsPositifs", "pointsNegatifs", "nombreIncidents", "nombreAbsences", "nombreRetards", "nombreEvaluations", "noteMoyenneEvaluations", "rangGlobal", "rangParCategorie", "rangParMatiere", "rangParClasse", "derniereMAJ", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sections (id, nom, code, "typeSection", description, ordre, "cycleId", "etablissementId", active, "coefficientFrais", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: sondage_options; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sondage_options (id, texte, ordre, "nombreVotes", "sondageId", "createdAt") FROM stdin;
\.


--
-- Data for Name: sondage_votes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sondage_votes (id, "sondageId", "optionId", "utilisateurId", "createdAt") FROM stdin;
\.


--
-- Data for Name: sondages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sondages (id, question, statut, "estAnonyme", "choixMultiple", "dateLimite", "dateProgrammation", "dateFermeture", "nombreDestinataires", "nombreVotes", "niveauAccesAnalyses", "utilisateursAutorisesAnalyses", "creerConversation", "templateId", "modeDestinataires", "estRecurrent", "frequenceRecurrent", "jourRecurrent", "heureRecurrent", "dateFinRecurrent", "sondageParentId", "auteurId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: specialites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.specialites (id, nom, code, description, "filiereId", ordre, actif, "createdAt", "updatedAt", "etablissementId") FROM stdin;
01638fc2-19fa-42cf-933d-d84872b0bba1	Maintenance Automobile	MA	Maintenance et réparation des véhicules automobiles	95f2d42a-6c41-4c36-bfc0-5a96c929b603	1	t	2026-06-14 03:05:35.015653	2026-06-14 03:05:35.015653	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
f53696d4-efc2-4c7a-a21a-ec953fd5aebe	Usinage Conventionnel	UC	Usinage sur machines conventionnelles (tour, fraiseuse)	95f2d42a-6c41-4c36-bfc0-5a96c929b603	2	t	2026-06-14 03:05:35.021441	2026-06-14 03:05:35.021441	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
4bbbaae9-d2bb-43fe-81e3-e0b4ca05f9f8	Usinage CNC	UCN	Usinage sur machines à commande numérique	95f2d42a-6c41-4c36-bfc0-5a96c929b603	3	t	2026-06-14 03:05:35.025304	2026-06-14 03:05:35.025304	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
5204b48a-7988-4ca4-8680-736285048e73	Soudure Industrielle	SI	Techniques de soudure MIG, TIG, à l'arc	95f2d42a-6c41-4c36-bfc0-5a96c929b603	4	t	2026-06-14 03:05:35.029201	2026-06-14 03:05:35.029201	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
77967b39-b245-4bda-a174-89ddaf4047b8	Électrotechnique Industrielle	EI	Installation et maintenance électrique industrielle	af436829-a165-49af-a510-e53964100645	1	t	2026-06-14 03:05:35.034948	2026-06-14 03:05:35.034948	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
8957a80d-195f-46c3-be11-4bebea7d2689	Automatismes Industriels	AI	Programmation d'automates et systèmes automatisés	af436829-a165-49af-a510-e53964100645	2	t	2026-06-14 03:05:35.04041	2026-06-14 03:05:35.04041	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
ea7afc02-a0fe-4c01-904a-3825e1720299	Électronique de Puissance	EP	Circuits électroniques de puissance et variateurs	af436829-a165-49af-a510-e53964100645	3	t	2026-06-14 03:05:35.044172	2026-06-14 03:05:35.044172	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
14c5130f-8c8d-4677-b07c-c7680962056a	Informatique Industrielle	II	Systèmes informatiques embarqués industriels	af436829-a165-49af-a510-e53964100645	4	t	2026-06-14 03:05:35.047266	2026-06-14 03:05:35.047266	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
cde73b47-eb57-4afb-91a8-5312d5305a39	Gros Œuvre Bâtiment	GOB	Construction structure bâtiment (fondations, maçonnerie)	9dc2bdc3-fba7-486f-9c5e-8257c6064d7d	1	t	2026-06-14 03:05:35.050458	2026-06-14 03:05:35.050458	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
834b010e-985a-4082-9361-ffc18881982f	Finition Bâtiment	FIN	Travaux de finition (enduit, carrelage, peinture)	9dc2bdc3-fba7-486f-9c5e-8257c6064d7d	2	t	2026-06-14 03:05:35.056146	2026-06-14 03:05:35.056146	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
f853b002-3da4-4346-ab04-b61238bfd6a2	Topographie	TOPO	Mesures topographiques et implantation de chantiers	9dc2bdc3-fba7-486f-9c5e-8257c6064d7d	3	t	2026-06-14 03:05:35.060742	2026-06-14 03:05:35.060742	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
ffa6354c-9ec2-43a2-8417-7deb83663365	Procédés Chimiques Industriels	PCI	Conduite de procédés de transformation chimique	2c49ad5f-9f79-4013-93e6-b8f362ba886d	1	t	2026-06-14 03:05:35.064186	2026-06-14 03:05:35.064186	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
c028b1a8-ef80-43cc-a000-e26c52caf8cc	Contrôle Qualité	CQ	Analyses et contrôle qualité en laboratoire	2c49ad5f-9f79-4013-93e6-b8f362ba886d	2	t	2026-06-14 03:05:35.067413	2026-06-14 03:05:35.067413	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
40157e92-375b-46cd-8258-872caad54d85	Secrétariat de Direction	SD	Assistanat et secrétariat de direction	a08c9a71-330f-486c-963e-a5dea05feec4	1	t	2026-06-14 03:05:35.071168	2026-06-14 03:05:35.071168	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
bc905271-a2ea-4108-9bed-a16fcffd6dc6	Gestion Administrative	GA	Gestion des documents et procédures administratives	a08c9a71-330f-486c-963e-a5dea05feec4	2	t	2026-06-14 03:05:35.076025	2026-06-14 03:05:35.076025	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
6ac48905-e0f6-40bc-972b-6c58068e81f2	Commerce International	CI	Techniques du commerce international et import-export	c6c25a00-a58f-4a32-846b-5bb62f93f3bd	1	t	2026-06-14 03:05:35.080234	2026-06-14 03:05:35.080234	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
3dc5fb7d-9ebc-4798-9eb7-5cfc4474d0ba	Marketing Digital	MD	Stratégies marketing et commerce électronique	c6c25a00-a58f-4a32-846b-5bb62f93f3bd	2	t	2026-06-14 03:05:35.084801	2026-06-14 03:05:35.084801	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
2b6fc346-a93f-4872-a986-401cb71d0033	Gestion de la Clientèle	GC	Relation client et gestion de portefeuille	c6c25a00-a58f-4a32-846b-5bb62f93f3bd	3	t	2026-06-14 03:05:35.088853	2026-06-14 03:05:35.088853	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
1d39f514-bdd1-4e8c-8b68-f7a9eb0e65dd	Comptabilité et Gestion	CG	Comptabilité générale et analytique	22cd02c5-6744-4419-863a-22a32a8a0284	1	t	2026-06-14 03:05:35.093096	2026-06-14 03:05:35.093096	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
d436435e-a722-42c8-8273-3eb31888b449	Finance d'Entreprise	FE	Analyse financière et gestion de trésorerie	22cd02c5-6744-4419-863a-22a32a8a0284	2	t	2026-06-14 03:05:35.097727	2026-06-14 03:05:35.097727	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
df9c344f-a03f-40cb-8884-acce7a439150	Développement Logiciel	DL	Conception et développement d'applications	bef352cb-542a-444d-a858-8096271dacd5	1	t	2026-06-14 03:05:35.101937	2026-06-14 03:05:35.101937	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
7bccb558-cff6-418f-ad9d-d0d1820edf0f	Réseaux et Systèmes	RS	Administration réseaux et systèmes informatiques	bef352cb-542a-444d-a858-8096271dacd5	2	t	2026-06-14 03:05:35.106738	2026-06-14 03:05:35.106738	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
66305f89-e397-4781-a76d-d6da25fc8dbe	Base de Données	BD	Conception et administration de bases de données	bef352cb-542a-444d-a858-8096271dacd5	3	t	2026-06-14 03:05:35.110902	2026-06-14 03:05:35.110902	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
7b94c633-428b-4a50-bf7e-c95dadcd4f9a	Design Graphique	DG	Création visuelle et communication graphique	fc5798ad-04b5-4bfd-ad2f-cdbc96f2419e	1	t	2026-06-14 03:05:35.115652	2026-06-14 03:05:35.115652	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
9fefeafb-36c8-4902-b166-aacb30828de1	Arts Plastiques	AP	Techniques artistiques et création plastique	fc5798ad-04b5-4bfd-ad2f-cdbc96f2419e	2	t	2026-06-14 03:05:35.119417	2026-06-14 03:05:35.119417	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
a9819c04-b1a0-442b-8942-40fcc05c4804	Cuisine Professionnelle	CP	Techniques culinaires et cuisine gastronomique	ef5aca3e-beb8-490e-a03e-1d1ac6dccfe9	1	t	2026-06-14 03:05:35.123504	2026-06-14 03:05:35.123504	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
f323edda-3d15-4946-a6a5-2a0a2bcbf40b	Service en Salle	SS	Art du service et gestion de restaurant	ef5aca3e-beb8-490e-a03e-1d1ac6dccfe9	2	t	2026-06-14 03:05:35.12724	2026-06-14 03:05:35.12724	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
0bf440d8-d2d4-4d87-9fdd-0829a057efef	Pâtisserie	PAT	Techniques de pâtisserie et viennoiserie	ef5aca3e-beb8-490e-a03e-1d1ac6dccfe9	3	t	2026-06-14 03:05:35.130551	2026-06-14 03:05:35.130551	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266
\.


--
-- Data for Name: templates_message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.templates_message (id, "etablissementId", code, titre, contenu, categorie, actif, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: templates_sondage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.templates_sondage (id, nom, description, question, options, parametres, categorie, visibilite, tags, "estTemplateSysteme", "utilisationCount", "createurId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: types_contrat_personnalises; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.types_contrat_personnalises (id, code, nom, description, categorie, actif, "estSysteme", ordre, "renouvellementAutoDefaut", "dureeMaxMois", "clausesDefaut", "avantagesDefaut", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: types_enum; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.types_enum (id, categorie, code, libelle, description, "estSysteme", "estActif", ordre, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: types_periodes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.types_periodes (id, code, nom, "createdAt") FROM stdin;
\.


--
-- Data for Name: types_personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.types_personnel (id, code, nom, "permissionsDefaut", "createdAt") FROM stdin;
\.


--
-- Data for Name: types_primes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.types_primes (id, code, nom, "typeCalcul", valeur, description, "etablissementId", actif, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: types_retenues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.types_retenues (id, code, nom, frequence, "montantMax", description, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: unites_organisationnelles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unites_organisationnelles (id, nom, description, type, code, statut, actif, "organisationId", "parentId", ordre, "responsableNom", "responsableId", localisation, telephone, email, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: utilisateur_etablissements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utilisateur_etablissements (id, "utilisateurId", "etablissementId", role, "etablissementPrincipal", actif, "dateDebut", "dateFin", motif, "creePar", "creeAt", "majAt") FROM stdin;
\.


--
-- Data for Name: utilisateur_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utilisateur_permissions (id, "utilisateurId", "permissionId", type, motif, "attribuePar", "dateAttribution", "createdAt") FROM stdin;
\.


--
-- Data for Name: utilisateur_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utilisateur_roles (id, "utilisateurId", "roleId", "estPrincipal", "dateAttribution", "attribuePar", "createdAt") FROM stdin;
f73535d2-25ac-480c-9cb0-72134134d93f	f77dfb17-d8cc-40d5-bb52-505610b3dc37	c5a53957-315f-4cb3-a02b-37c38e5bded0	t	2026-06-14 04:05:36.366	\N	2026-06-14 03:05:36.366723
d28a8aab-29f9-4fa7-a148-430d5b459e7a	ce2e480d-1b39-4162-bfc8-fa2a6503103f	657cd2c4-a044-48f8-a24a-4074313cf61d	t	2026-06-14 04:05:36.887	\N	2026-06-14 03:05:36.887585
e8cd562c-6cdf-4188-9fc4-804c6666ec42	39ff99d5-f9f3-49d2-855f-1121d24c84e2	25571bda-2dcf-410c-a566-7c17bad1cdf4	t	2026-06-14 04:05:37.38	\N	2026-06-14 03:05:37.380679
be506d9a-0bf8-4f11-ac4d-23c05d864207	db714f47-9509-4edb-89d2-406d8f9249e2	5f7f3884-9eab-4c69-a218-09f9fa6c6cf7	t	2026-06-14 04:05:37.837	\N	2026-06-14 03:05:37.837523
6ae5b817-53ca-4bd1-84a8-a7014c2eaefe	89cca293-caa1-4d71-b69f-a4074e197939	6bb401b1-e59d-4065-bd51-48f6faf71c04	t	2026-06-14 04:05:38.319	\N	2026-06-14 03:05:38.31984
5fed7e8b-3846-48d7-8aa1-aa7109db25d9	7a3e08ec-461f-4f53-8b23-eaf96a6db06c	f8349a90-e248-4492-8734-d6bdc1f49127	t	2026-06-14 04:05:38.808	\N	2026-06-14 03:05:38.809072
872e2e30-2972-42f5-adda-2d37386ecba1	bd173360-635d-4d13-8943-87dd15895ea3	ffb4fbd4-1e04-4f4f-83f8-944d6dbf83d0	t	2026-06-14 04:05:39.29	\N	2026-06-14 03:05:39.291085
8c42e704-7900-406d-bc6a-5a36c2658570	3ee8f4bc-dd13-48b0-8e9c-703655822d8b	f8a57e45-9fd7-4095-96b9-f7a779bb5861	t	2026-06-14 04:05:39.778	\N	2026-06-14 03:05:39.779449
1e6317f8-8374-46fa-af2c-d10156e34012	247d785c-ef25-4ae4-bade-45a8e33feb1b	8f652db2-db1d-4e66-9496-a9825294f946	t	2026-06-14 04:05:40.291	\N	2026-06-14 03:05:40.291424
4c46f8ee-79bb-4a4b-a218-ded74cc32d49	86a246c4-ece4-45dd-b8a9-af35286957de	a03e7960-d69e-4e39-a718-cc2abdb4cfdb	t	2026-06-14 04:05:40.849	\N	2026-06-14 03:05:40.850295
e474308b-20f7-4b4a-a09c-918c2f152cc4	4c837c10-351a-4555-9c91-f97ea11ff180	fe8f59d3-2d63-4c3f-b25e-70fa8b1ebee3	t	2026-06-14 04:05:41.369	\N	2026-06-14 03:05:41.369358
1c10a3d2-9380-41d1-bf10-49e87891c751	1fadafe6-5a9a-49f0-a2bd-51acd1755295	83786f07-c911-4526-bbe9-04d55f5990d0	t	2026-06-14 04:05:41.876	\N	2026-06-14 03:05:41.876366
46f403cc-ea98-4fc5-a560-58ca410414ff	95c0c8c9-99f1-4a1b-8bb5-15c7bf482191	51b71bcf-0ea7-4b2a-90bd-aaa0f0708dce	t	2026-06-14 04:05:42.377	\N	2026-06-14 03:05:42.377867
25a925d7-c19b-447d-a745-3cf2e4522718	ba2a8262-6bbd-4ca9-afd2-25a1d07fcd37	baac80d8-48ec-4f57-b4de-8c7606d09fa7	t	2026-06-14 04:05:42.947	\N	2026-06-14 03:05:42.948156
23f973ed-e1eb-4aa2-88d2-f55697702e02	228e45de-bb59-43f1-955b-4b34921e37d1	8a7dcd8c-7677-4638-8885-03577c8fdb8e	t	2026-06-14 04:05:43.441	\N	2026-06-14 03:05:43.441336
c1761393-2438-4e0a-a9dc-1be8bd90642e	e04601d3-f069-4dc0-9a0e-d853acc3b5eb	0fd69ff7-7cb8-4500-96c6-e2c8f705f926	t	2026-06-14 04:05:43.95	\N	2026-06-14 03:05:43.950825
96b38a7d-33e8-43ce-8275-9124ab237ed6	f9b11fec-f19e-40db-ba38-0bc151cd3679	9ec877f4-f259-43be-89ce-6b182202e96d	t	2026-06-14 04:05:44.429	\N	2026-06-14 03:05:44.429325
4be428a5-fe93-4d29-9611-e82937f3216a	016749bb-aa1e-4018-a958-8519fb87465c	67530ebb-3d44-457e-8ca5-8a9a299b0503	t	2026-06-14 04:05:44.965	\N	2026-06-14 03:05:44.965621
77ca69c3-d4f0-4680-a187-83e22bb81117	4c3e1157-e955-4940-a528-467d96a13c9d	dcd0e55d-db45-43aa-a6ef-0ceb58f1b4ea	t	2026-06-14 04:05:45.462	\N	2026-06-14 03:05:45.462675
23c457a5-529e-4f04-8aca-f268d453778a	6d6a5de1-6af5-4a93-9c68-da8b0f5e19d5	46480511-7537-4ea9-809e-4be743e76b08	t	2026-06-14 04:05:45.964	\N	2026-06-14 03:05:45.965127
4fe06a63-ab00-4ddc-abdf-2a8f51300c20	d4347fa8-52cc-4956-9e74-056d06453155	3ed5b34c-d917-4c72-9ae2-2d828fe7b86d	t	2026-06-14 04:05:46.464	\N	2026-06-14 03:05:46.464744
fb6c7e59-6c27-491c-bd27-32b399ef5b58	78e04134-22fb-4f69-bce1-19c6ed7e3cf0	7211c55c-d5a0-4e75-84fc-8ffb3e0f7b6a	t	2026-06-14 04:05:46.97	\N	2026-06-14 03:05:46.971065
fca4cde0-c05f-450d-a0c7-10605c279b6e	8b9d70ba-d9e9-4436-8090-3fca01c0197b	5bbf24c0-e072-4893-9e2a-66fd009e6889	t	2026-06-14 04:05:47.441	\N	2026-06-14 03:05:47.442217
dcbfcdd0-bfce-4307-ab78-f9b4562af8ab	39de311e-e280-4baa-8907-ae0937aa454f	63dd9060-7de6-4276-9708-e62d4e178e5d	t	2026-06-14 04:05:47.965	\N	2026-06-14 03:05:47.96546
f49f625d-2ff2-4f54-b54f-ad3393291569	f348e16a-ceef-43c3-9a46-d31f7dce82d2	81705e34-6e86-4be8-95e3-6a620c9a33a0	t	2026-06-14 04:05:48.425	\N	2026-06-14 03:05:48.426082
fc62637a-7750-4b99-9a48-5f7d5542af49	dfcd737b-6809-4457-a193-b24e9350cf73	003217d2-6dea-4c10-8503-e3c2b6793bbb	t	2026-06-14 04:05:48.851	\N	2026-06-14 03:05:48.851833
1c52b57a-9a55-4c3e-8b48-4f69f7e6767e	6427200c-3e66-4432-8103-674d0cf24eb8	814dd001-57a7-4587-b990-68abd46bce76	t	2026-06-14 04:05:49.307	\N	2026-06-14 03:05:49.307783
73446550-9871-435e-954d-32eef0c102f5	6acba1ec-24de-49f4-b06e-a0917c2a3b32	4cdebabd-8e1f-43a5-8e33-20bf416d2ca3	t	2026-06-14 04:05:49.816	\N	2026-06-14 03:05:49.81728
cce92a29-96af-4e70-b26e-6eada24a25e3	950c5aeb-2a78-4ae0-95b2-bf2f4d5698b9	44d7e404-ae06-4611-9a07-34ba30d9db5c	t	2026-06-14 04:05:50.321	\N	2026-06-14 03:05:50.321574
3e9d4276-6322-4120-905d-16a39cb31503	341628e9-763a-4f7c-beba-bf0856435a7d	efe7eb62-e748-4a1b-83c8-7a8b76d816a7	t	2026-06-14 04:05:50.797	\N	2026-06-14 03:05:50.797921
37045aa7-b374-417b-86c7-75758ede65c8	55e11115-1b98-4170-abcd-f3b69338000a	e6a30931-5231-41eb-bf3a-a271d4fa967f	t	2026-06-14 04:05:51.276	\N	2026-06-14 03:05:51.277098
506219ed-8e78-44b0-9dfb-f56d0b83b413	87db2b9c-233a-4913-a674-6a6ed97ed4b8	550fa94c-fd39-43ae-9e33-5e8ee46ac4ee	t	2026-06-14 04:05:51.776	\N	2026-06-14 03:05:51.776955
a82a5409-8ac0-498a-8e82-ed7317abe60f	ecfdeaeb-3619-4e08-a682-58ae148e3f34	64daece2-c730-42d2-bbdd-b527bc9783f3	t	2026-06-14 04:05:52.272	\N	2026-06-14 03:05:52.272492
a010a826-3421-40f8-a5ea-36bf17a2b31a	67ac40d5-e92b-4f07-ae27-1e681609b6d8	e4cda860-6633-43a6-8d50-be4b847015bd	t	2026-06-14 04:05:52.748	\N	2026-06-14 03:05:52.749302
fb3ba77a-4b14-40c2-90f4-803ce2afe2be	9cebe557-6d20-48ec-9d49-e6420278e426	1b205d8c-5b42-4a3d-a677-9cdf0c5c2274	t	2026-06-14 04:05:53.246	\N	2026-06-14 03:05:53.246664
fd068c2b-5253-4f60-ae8b-398b9eeac856	85362b44-2cb2-4f30-94a2-894045426c20	7144e0e5-f9f9-49b5-8a8a-cbfc0923ca54	t	2026-06-14 04:05:53.735	\N	2026-06-14 03:05:53.736186
9dfab361-717d-4886-b9fc-678891762925	5cd20fce-903c-4106-ae89-95c61a9f9d7a	2eb9dcd9-623f-4e31-874e-dfa7de94341a	t	2026-06-14 04:05:54.214	\N	2026-06-14 03:05:54.21494
8c701a04-f5a3-400b-868b-65bfee2ecf8f	b89c0db8-6573-4763-8991-a900ad290901	4ea7acdd-0566-4208-adb6-545e6b5224e1	t	2026-06-14 04:05:54.703	\N	2026-06-14 03:05:54.703905
0306b09e-1820-41e0-b27b-a8b5ced2cbf0	acfb60ea-3913-48b5-9045-fc1a8fac9986	cb3d362c-108d-4a7c-8c2a-25f10599c832	t	2026-06-14 04:43:10.559	\N	2026-06-14 03:43:10.559842
\.


--
-- Data for Name: utilisateurs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utilisateurs (id, email, matricule, pseudonyme, "qrCodeId", "motDePasse", role, statut, "emailVerifie", "tokenVerificationEmail", "tokenReinitialisationMdp", "expirationTokenMdp", "tentativesConnexion", "bloqueJusqua", "derniereConnexion", langue, "etablissementId", "createdAt", "updatedAt", "maxEtablissementsPersonnel") FROM stdin;
f77dfb17-d8cc-40d5-bb52-505610b3dc37	admin.test@elisaschool.cm	ADMIN-001	\N	\N	$2a$12$J2GHlZjXvNWEOEQoO3ymr.p3onYojcbsYl3w/1h8Ohi82L4y3SY9q	ADMIN	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:35.846986	2026-06-14 03:05:35.846986	1
ce2e480d-1b39-4162-bfc8-fa2a6503103f	chef.etablissement@elisaschool.cm	CHEF-001	\N	\N	$2a$12$8j87DENd8ddE.KTeuwr2UuxtZy4Qw35O9Urs.A6vbTLyRLUNXfDlG	CHEF_ETABLISSEMENT	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:36.37449	2026-06-14 03:05:36.37449	1
39ff99d5-f9f3-49d2-855f-1121d24c84e2	proviseur@elisaschool.cm	PROV-001	\N	\N	$2a$12$3D5FU4EBBPP2MNZEXE3z4eDatlBkS8Suf6maIcmVJKZG2SFkj9u3.	PROVISEUR	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:36.893749	2026-06-14 03:05:36.893749	1
db714f47-9509-4edb-89d2-406d8f9249e2	principal@elisaschool.cm	PRIN-001	\N	\N	$2a$12$NY/hHGQEsl.R5qOrjnMX6uOp.tVtOiVNfj6QJqBbXJGne22gna74u	PRINCIPAL	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:37.385671	2026-06-14 03:05:37.385671	1
89cca293-caa1-4d71-b69f-a4074e197939	directeur@elisaschool.cm	DIR-001	\N	\N	$2a$12$GeTirrDzElWI622X6rBrEuwEWei37drSfYJemo6CoKkgAvf.0wG.u	DIRECTEUR	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:37.843627	2026-06-14 03:05:37.843627	1
7a3e08ec-461f-4f53-8b23-eaf96a6db06c	censeur@elisaschool.cm	CENS-001	\N	\N	$2a$12$LxN7j83suKAKi2ncpIz6beJzpQ9E6awGzWpFMvZZkrmJT6/7e3YMm	CENSEUR	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:38.324529	2026-06-14 03:05:38.324529	1
bd173360-635d-4d13-8943-87dd15895ea3	directeur.adjoint@elisaschool.cm	DIRADJ-001	\N	\N	$2a$12$WcciNpHUazgzZEKH5dwqG.qMyxWhToIkgce76I8WvlEGT9Pu6weVm	DIRECTEUR_ADJOINT	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:38.815505	2026-06-14 03:05:38.815505	1
3ee8f4bc-dd13-48b0-8e9c-703655822d8b	resp.pedagogique@elisaschool.cm	RESPED-001	\N	\N	$2a$12$DMogZeE40ks9maw8OP91r.ScNVH5LI91q7NYXtzHQfd9RrC2lF6Iy	RESPONSABLE_PEDAGOGIQUE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:39.297476	2026-06-14 03:05:39.297476	1
247d785c-ef25-4ae4-bade-45a8e33feb1b	enseignant@elisaschool.cm	ENS-001	\N	\N	$2a$12$RReRyPS99bCE2InXNyGwJeUVnfkAnLzN/vlpdj/BKg6jpyFl1vxOS	ENSEIGNANT	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:39.784584	2026-06-14 03:05:39.784584	1
86a246c4-ece4-45dd-b8a9-af35286957de	prof.certifie@elisaschool.cm	PCERT-001	\N	\N	$2a$12$96TBJRTZzBlIt.siV.TivOGKNECuCaYTCi1yYqJfSpbxbO1N0MNMm	PROFESSEUR_CERTIFIE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:40.298131	2026-06-14 03:05:40.298131	1
4c837c10-351a-4555-9c91-f97ea11ff180	prof.agrege@elisaschool.cm	PAGREG-001	\N	\N	$2a$12$8D5ltkzXZVhl2Y/4znXNBOFX9vw31HYiRUxQDJs3S/PthjBNDuA0S	PROFESSEUR_AGREGE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:40.857102	2026-06-14 03:05:40.857102	1
1fadafe6-5a9a-49f0-a2bd-51acd1755295	instituteur@elisaschool.cm	INST-001	\N	\N	$2a$12$/a07m0KRjueWUfkBmY8GzulhKUl2EXM5arAqfVu/t0nfFrnF4HKWi	INSTITUTEUR	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:41.375097	2026-06-14 03:05:41.375097	1
95c0c8c9-99f1-4a1b-8bb5-15c7bf482191	maitre.auxiliaire@elisaschool.cm	MAUX-001	\N	\N	$2a$12$tQPQQxweTu5ViaKCFBPXQOEsuW4eMufozgkW4b12OY6jU5L0jTBy6	MAITRE_AUXILIAIRE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:41.881489	2026-06-14 03:05:41.881489	1
ba2a8262-6bbd-4ca9-afd2-25a1d07fcd37	prof.technique@elisaschool.cm	PTECH-001	\N	\N	$2a$12$soFr5Kkk8Y4PmEOwOnetauwInbsUmpzgOx3jz1W0luv4HHX2Mzhqa	PROFESSEUR_TECHNIQUE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:42.38328	2026-06-14 03:05:42.38328	1
228e45de-bb59-43f1-955b-4b34921e37d1	educateur.maternelle@elisaschool.cm	EDUMAT-001	\N	\N	$2a$12$iwFCys9eQxsYQr.kn.QxzOaFI1UUP4MhcYcFxJYsi7AqUktbY9jky	EDUCATEUR_MATERNELLE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:42.953592	2026-06-14 03:05:42.953592	1
e04601d3-f069-4dc0-9a0e-d853acc3b5eb	prof.principal@elisaschool.cm	PPRINC-001	\N	\N	$2a$12$4U5YSksBZtfXxKANckinVulZmR/rDPDWNI3cwIKyUciTY/muznBKC	PROFESSEUR_PRINCIPAL	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:43.446152	2026-06-14 03:05:43.446152	1
f9b11fec-f19e-40db-ba38-0bc151cd3679	coordinateur@elisaschool.cm	COORD-001	\N	\N	$2a$12$ZwK8D5nnT1pdyRKEHZ9ivuAJP.LZDWvZImG3GIk4RJiNTFoLAdi1K	COORDINATEUR_DISCIPLINE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:43.956182	2026-06-14 03:05:43.956182	1
016749bb-aa1e-4018-a958-8519fb87465c	conseiller.orientation@elisaschool.cm	CORIENT-001	\N	\N	$2a$12$ftFRVO6le/dzrQJZQ3cRVOl64d11AJRCtLLWlMNd4w7qF5COW/vxO	CONSEILLER_ORIENTEUR	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:44.435702	2026-06-14 03:05:44.435702	1
4c3e1157-e955-4940-a528-467d96a13c9d	psychologue@elisaschool.cm	PSY-001	\N	\N	$2a$12$jIUk3X4JhqKJyFmaXvOpSekLpEVAl3A9sZ8QSZaXPf9gSVR2IRKEq	PSYCHOLOGUE_SCOLAIRE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:44.970452	2026-06-14 03:05:44.970452	1
6d6a5de1-6af5-4a93-9c68-da8b0f5e19d5	assistant.social@elisaschool.cm	ASSOSOC-001	\N	\N	$2a$12$3SPtXACZ6jXm8T7FDUyus.VCvdYn.iwYjqobPfhehH95VxedCihHi	ASSISTANT_SOCIAL	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:45.467171	2026-06-14 03:05:45.467171	1
d4347fa8-52cc-4956-9e74-056d06453155	personnel@elisaschool.cm	PERS-001	\N	\N	$2a$12$ydi35sVN.1aR2eQGvpj6SODnaZszHXRDLYQN2rQd4iO7yYZjRPgsS	PERSONNEL	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:45.969071	2026-06-14 03:05:45.969071	1
8b9d70ba-d9e9-4436-8090-3fca01c0197b	comptable@elisaschool.cm	COMPT-001	\N	\N	$2a$12$Uph14iS8cpQ04ipnfQDMs.pt5wJYQgscAt/fr.hNuuxJcuiwcnxa2	COMPTABLE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:46.976621	2026-06-14 03:05:46.976621	1
39de311e-e280-4baa-8907-ae0937aa454f	gestionnaire@elisaschool.cm	GEST-001	\N	\N	$2a$12$9CgtEEMIe.LEOch1GuTj8.o6N.ToB96B.032l9pRqA23yiJ/MAzMC	GESTIONNAIRE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:47.446916	2026-06-14 03:05:47.446916	1
f348e16a-ceef-43c3-9a46-d31f7dce82d2	bibliothequaire@elisaschool.cm	BIBLIO-001	\N	\N	$2a$12$DS9nEv80nHcjFp4MXAAUtuGdyLApy84PzTAa/C7fZwHvb/eVQntWy	BIBLIOTHECAIRE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:47.969503	2026-06-14 03:05:47.969503	1
dfcd737b-6809-4457-a193-b24e9350cf73	documentaliste@elisaschool.cm	DOCUM-001	\N	\N	$2a$12$lxIe7gztVlANrkcZPdY7WeL/E/KuWdTNNYMP/hvuP0/qcUmUkqu5m	DOCUMENTALISTE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:48.42954	2026-06-14 03:05:48.42954	1
6427200c-3e66-4432-8103-674d0cf24eb8	archiviste@elisaschool.cm	ARCH-001	\N	\N	$2a$12$gJ26v53pvIB0U8H1c2z.oOs62ehVGyc.W1fY4t6ELeyYRy5cNi1kq	ARCHIVISTE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:48.857222	2026-06-14 03:05:48.857222	1
6acba1ec-24de-49f4-b06e-a0917c2a3b32	technicien.labo@elisaschool.cm	TECHLAB-001	\N	\N	$2a$12$v38AV1TWPjsD0i3MVYvJMe5/FfkUtUDvUYAoYaZRMpNA/UwyctaBu	TECHNICIEN_LABO	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:49.312843	2026-06-14 03:05:49.312843	1
950c5aeb-2a78-4ae0-95b2-bf2f4d5698b9	technicien.info@elisaschool.cm	TECHINFO-001	\N	\N	$2a$12$oGqgnF.zlej6akTAN6KsZ.mPgKE3pgsWUijSZYs6DFjeKgWjKwSim	TECHNICIEN_INFO	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:49.821917	2026-06-14 03:05:49.821917	1
341628e9-763a-4f7c-beba-bf0856435a7d	conseiller.tic@elisaschool.cm	CTIC-001	\N	\N	$2a$12$x2v/6yzFdiqbmzPAhu/iv.ZTRf8sok3eTbLhbMr72BNWmOMscE5cy	CONSEILLER_TIC	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:50.325751	2026-06-14 03:05:50.325751	1
55e11115-1b98-4170-abcd-f3b69338000a	aide.educateur@elisaschool.cm	AIDEEDU-001	\N	\N	$2a$12$QWw6hrhf69jEADYAoEGXVOR.hG/XtyvLvLQxB0CBeYocZdfIPoJp.	AIDE_EDUCATEUR	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:50.80218	2026-06-14 03:05:50.80218	1
87db2b9c-233a-4913-a674-6a6ed97ed4b8	surveillant.general@elisaschool.cm	SURVGEN-001	\N	\N	$2a$12$EUmvtve2wnJcUcjMDw94ouzIaz8limSdaHz34uhieGInRj/MlOQei	SURVEILLANT_GENERAL	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:51.28202	2026-06-14 03:05:51.28202	1
ecfdeaeb-3619-4e08-a682-58ae148e3f34	surveillant@elisaschool.cm	SURV-001	\N	\N	$2a$12$s4K376NoYke96fZZga6oVuWYnKyvjVH02jDQj7SSA7vicVm1Nbxbu	SURVEILLANT	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:51.782438	2026-06-14 03:05:51.782438	1
67ac40d5-e92b-4f07-ae27-1e681609b6d8	resp.cantine@elisaschool.cm	RESPCANT-001	\N	\N	$2a$12$upC40he9HVHltFUZNQ9VXe08GQm90ugX55WjJtZBv.OQnJMzysXwK	RESPONSABLE_CANTINE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:52.277692	2026-06-14 03:05:52.277692	1
9cebe557-6d20-48ec-9d49-e6420278e426	resp.transport@elisaschool.cm	RESPTRAN-001	\N	\N	$2a$12$beN3d8JyG1nKTAmpJdMXvu187s38PJAWMV960MhZl6Jf6yO5yJQ2a	RESPONSABLE_TRANSPORT	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:52.75597	2026-06-14 03:05:52.75597	1
85362b44-2cb2-4f30-94a2-894045426c20	resp.infrastructure@elisaschool.cm	RESPINFRA-001	\N	\N	$2a$12$wazMDvlze39MKIUfa3DT5.OqpeAgs11YB9hgrJK22xwQMKfFyxog.	RESPONSABLE_INFRASTRUCTURE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:53.251989	2026-06-14 03:05:53.251989	1
5cd20fce-903c-4106-ae89-95c61a9f9d7a	parent@elisaschool.cm	PAR-001	\N	\N	$2a$12$z3sUghqjhpncNhi7EsPILOQE.Al6TCIdZIgAYaGNw0bULxFRZ0REi	PARENT	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:53.741577	2026-06-14 03:05:53.741577	1
b89c0db8-6573-4763-8991-a900ad290901	eleve@elisaschool.cm	ELV-001	\N	\N	$2a$12$ATjCVRmZFMhaHaqXgKiVNOqGRYTzrdrbAnw4XxqumA/KXgwHKd1Xa	ELEVE	ACTIF	t	\N	\N	\N	0	\N	\N	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:54.220038	2026-06-14 03:05:54.220038	1
78e04134-22fb-4f69-bce1-19c6ed7e3cf0	secretaire@elisaschool.cm	SECRET-001	\N	\N	$2a$12$qt2oapb.BF1KyOvIxRxkJOvRPCL.9QOOUkvvhUYZ8Ki0vaJzIlKCO	SECRETAIRE_DIRECTION	ACTIF	t	\N	\N	\N	0	\N	2026-06-14 04:28:22.581	fr	49d9bebd-f98b-4517-9cbd-a2ce1a0ad266	2026-06-14 03:05:46.469387	2026-06-14 03:28:22.588255	1
acfb60ea-3913-48b5-9045-fc1a8fac9986	admin@elisaschool.cm	ADMIN001	\N	\N	$2a$12$GhKprg0yNQ3JCYv26aRk6e9dX5/sBn7A6geB5L.oaNcMfp3ltuVwG	SUPER_ADMIN	ACTIF	t	\N	\N	\N	0	\N	2026-06-14 12:35:58.801	fr	\N	2026-06-14 03:05:35.269353	2026-06-14 11:35:58.822419	1
\.


--
-- Data for Name: vehicules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicules (id, "proprietaireId", immatriculation, marque, modele, couleur, type, "placeParkingId", "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: workflows_validation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workflows_validation (id, module, "entiteId", "entiteType", "niveauxRequis", "niveauActuel", statut, "configRoles", historique, "dernierValidateurId", "dateCompletion", commentaire, "etablissementId", "createdAt", "updatedAt") FROM stdin;
\.


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
-- Name: utilisateur_etablissements PK_82168f9601d3dfc1a5eac82f7f8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_etablissements
    ADD CONSTRAINT "PK_82168f9601d3dfc1a5eac82f7f8" PRIMARY KEY (id);


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
-- Name: utilisateur_roles PK_ac82a8b1d6349aafc502a7ef11a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_roles
    ADD CONSTRAINT "PK_ac82a8b1d6349aafc502a7ef11a" PRIMARY KEY (id);


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
-- Name: sections PK_f9749dd3bffd880a497d007e450; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT "PK_f9749dd3bffd880a497d007e450" PRIMARY KEY (id);


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
-- Name: cycles UQ_3a557a629440a1710793d2cdcb3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycles
    ADD CONSTRAINT "UQ_3a557a629440a1710793d2cdcb3" UNIQUE (code);


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
-- Name: parametres_systeme UQ_65b1e738c8c19c81eb8add4edf0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametres_systeme
    ADD CONSTRAINT "UQ_65b1e738c8c19c81eb8add4edf0" UNIQUE (cle);


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
-- Name: sections UQ_8abcae323050fbeb87150c6f78f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT "UQ_8abcae323050fbeb87150c6f78f" UNIQUE (code);


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
-- Name: utilisateur_roles UQ_a80aebaffbe223503aac8964182; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_roles
    ADD CONSTRAINT "UQ_a80aebaffbe223503aac8964182" UNIQUE ("utilisateurId", "roleId");


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
-- Name: cycles UQ_bee85318f43305f3099e7ee8c84; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cycles
    ADD CONSTRAINT "UQ_bee85318f43305f3099e7ee8c84" UNIQUE (nom);


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
-- Name: IDX_0fbebbd91bc12343461d88833e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0fbebbd91bc12343461d88833e" ON public.utilisateur_roles USING btree ("roleId");


--
-- Name: IDX_1054dc6156f89b81871f742456; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1054dc6156f89b81871f742456" ON public.notes USING btree ("classeId");


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
-- Name: IDX_1ac2df5bfacc8b5e3f498ebfc0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1ac2df5bfacc8b5e3f498ebfc0" ON public.classes USING btree ("niveauId");


--
-- Name: IDX_1c6ad5e628415ec0613ab83942; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1c6ad5e628415ec0613ab83942" ON public.demandes_depense USING btree (statut);


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
-- Name: IDX_464bd4e54c5bb6f98d3604b068; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_464bd4e54c5bb6f98d3604b068" ON public.evaluations_personnel USING btree (periode);


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
-- Name: IDX_4f019be481e0773ba6ab445d4d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4f019be481e0773ba6ab445d4d" ON public.sanctions_eleves USING btree ("etablissementId");


--
-- Name: IDX_4f7ad64f1df99f5375cec0549d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4f7ad64f1df99f5375cec0549d" ON public.inscriptions_transport USING btree ("etablissementId");


--
-- Name: IDX_50ddde301674ec4a7258e9d4db; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_50ddde301674ec4a7258e9d4db" ON public.scores_personnel USING btree ("categoriePersonnel");


--
-- Name: IDX_510bbcadeb79adb7dcf97836a5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_510bbcadeb79adb7dcf97836a5" ON public.evaluations_personnel USING btree ("anneeScolaireId", "membrePersonnelId");


--
-- Name: IDX_53ac290b84fcb99dccdb6f668b; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_53ac290b84fcb99dccdb6f668b" ON public.preferences_utilisateur USING btree ("utilisateurId", cle);


--
-- Name: IDX_54182584e2920a38d9c5dfa70d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_54182584e2920a38d9c5dfa70d" ON public.historique_scores_personnel USING btree ("sourceModule", "sourceId");


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
-- Name: IDX_64ca3cc590a4ef3abd1db09156; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_64ca3cc590a4ef3abd1db09156" ON public.entretiens_recrutement USING btree ("etablissementId");


--
-- Name: IDX_64cdb31c1ab068815eb54705ae; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_64cdb31c1ab068815eb54705ae" ON public.annonces USING btree ("etablissementId");


--
-- Name: IDX_653d4d149a9b367bffe636f9cc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_653d4d149a9b367bffe636f9cc" ON public.historique_scores_personnel USING btree ("anneeScolaireId");


--
-- Name: IDX_66127c691e1bd1719295a76280; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_66127c691e1bd1719295a76280" ON public.utilisateur_roles USING btree ("utilisateurId");


--
-- Name: IDX_668cc2080d6093517f5fbf6826; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_668cc2080d6093517f5fbf6826" ON public.utilisateur_roles USING btree ("estPrincipal");


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
-- Name: IDX_6e9db6eb753214621ce2e713ef; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_6e9db6eb753214621ce2e713ef" ON public.groupe_etablissement_liens USING btree ("groupeId", "etablissementId");


--
-- Name: IDX_6e9f18261170b6f202b29afde0; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_6e9f18261170b6f202b29afde0" ON public.sections USING btree (code, "etablissementId");


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
-- Name: IDX_a3899c1a722c3c9b3b27cc66cf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a3899c1a722c3c9b3b27cc66cf" ON public.contrats_personnel USING btree ("etablissementId");


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
-- Name: IDX_a515a13f03ef7ad02efeedc071; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a515a13f03ef7ad02efeedc071" ON public.notes USING btree ("createdAt");


--
-- Name: IDX_a5c87872d19af4df4c30ec42af; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a5c87872d19af4df4c30ec42af" ON public.sanctions_eleves USING btree ("anneeScolaireId", "eleveId");


--
-- Name: IDX_a69aa148d70dc576eb1872ecd3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a69aa148d70dc576eb1872ecd3" ON public.menus_cantine USING btree ("etablissementId", date);


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
-- Name: IDX_ac556d88a7736df5184d3cb951; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ac556d88a7736df5184d3cb951" ON public.inscriptions_cantine USING btree ("etablissementId", "eleveId");


--
-- Name: IDX_ac704c4537199bffbd4cc0057f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ac704c4537199bffbd4cc0057f" ON public.evaluations_personnel USING btree ("anneeScolaireId");


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

CREATE INDEX "IDX_ddc3c8d7413863a52267db4702" ON public.competences USING btree ("niveauId", "matiereId", "etablissementId");


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
-- Name: IDX_e6142848586980d507ae567322; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e6142848586980d507ae567322" ON public.sondages USING btree (statut);


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
-- Name: IDX_eb94ee7722313530bc0014aa77; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_eb94ee7722313530bc0014aa77" ON public.incidents_personnel USING btree (statut);


--
-- Name: IDX_ec203ffd05a5488445e1be4420; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ec203ffd05a5488445e1be4420" ON public.incidents_eleves USING btree ("etablissementId", "eleveId");


--
-- Name: IDX_ed499504dee9d64ff0cc456b34; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ed499504dee9d64ff0cc456b34" ON public.sections USING btree ("etablissementId");


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
-- Name: utilisateur_roles FK_0fbebbd91bc12343461d88833ef; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_roles
    ADD CONSTRAINT "FK_0fbebbd91bc12343461d88833ef" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: notes FK_1054dc6156f89b81871f7424566; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "FK_1054dc6156f89b81871f7424566" FOREIGN KEY ("classeId") REFERENCES public.classes(id);


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
-- Name: eleves FK_3405ef4ac266db68f3a034c2756; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT "FK_3405ef4ac266db68f3a034c2756" FOREIGN KEY ("traitePar") REFERENCES public.utilisateurs(id);


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
-- Name: participants_conversation FK_5de73a721caa36ea32465a912c0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants_conversation
    ADD CONSTRAINT "FK_5de73a721caa36ea32465a912c0" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


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
-- Name: utilisateur_roles FK_66127c691e1bd1719295a762803; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateur_roles
    ADD CONSTRAINT "FK_66127c691e1bd1719295a762803" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


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
-- Name: frais_scolarite FK_786a70063c45315f7437f661b6b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais_scolarite
    ADD CONSTRAINT "FK_786a70063c45315f7437f661b6b" FOREIGN KEY ("sectionId") REFERENCES public.sections(id);


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
-- Name: utilisateurs FK_8384f5f2308864a64302b901b1f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT "FK_8384f5f2308864a64302b901b1f" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id);


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
-- Name: sections FK_d12e75419cc8db38fe2104b581c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT "FK_d12e75419cc8db38fe2104b581c" FOREIGN KEY ("cycleId") REFERENCES public.cycles(id);


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
-- Name: profils_utilisateurs FK_ecb296e7df42f4b9a8e1cdf9598; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profils_utilisateurs
    ADD CONSTRAINT "FK_ecb296e7df42f4b9a8e1cdf9598" FOREIGN KEY ("utilisateurId") REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: sections FK_ed499504dee9d64ff0cc456b349; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT "FK_ed499504dee9d64ff0cc456b349" FOREIGN KEY ("etablissementId") REFERENCES public.etablissements(id) ON DELETE CASCADE;


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
-- Name: remises FK_fc052b47453b7dd9e777dd8793f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remises
    ADD CONSTRAINT "FK_fc052b47453b7dd9e777dd8793f" FOREIGN KEY ("sectionId") REFERENCES public.sections(id);


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
-- PostgreSQL database dump complete
--

\unrestrict H0pUumCjTxgi4iNdkEX7kw7ohZmKdntvMp2dbexrTtpMV1X3RcGaSe94dxiwCVg

