/**
 * ==================================
 * eLISAschool - Énumérations des rôles et permissions
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

/**
 * Rôles disponibles dans l'application
 * Version 2.0 - Système éducatif camerounais et sous-régional
 * Total : 67 rôles
 */
export enum Role {
    // ==================================
    // RÔLES EXISTANTS (conservés)
    // ==================================
    
    /** Super administrateur - accès total */
    SUPER_ADMIN = 'SUPER_ADMIN',

    /** Administrateur de l'établissement */
    ADMIN = 'ADMIN',

    /** Chef d'établissement (générique) */
    CHEF_ETABLISSEMENT = 'CHEF_ETABLISSEMENT',

    /** Enseignant (générique) */
    ENSEIGNANT = 'ENSEIGNANT',

    /** Personnel non-enseignant (générique) */
    PERSONNEL = 'PERSONNEL',

    /** Responsable cantine */
    RESPONSABLE_CANTINE = 'RESPONSABLE_CANTINE',

    /** Responsable transport */
    RESPONSABLE_TRANSPORT = 'RESPONSABLE_TRANSPORT',

    /** Responsable infrastructure (parking, maintenance, sécurité) */
    RESPONSABLE_INFRASTRUCTURE = 'RESPONSABLE_INFRASTRUCTURE',

    /** Parent d'élève */
    PARENT = 'PARENT',

    /** Élève */
    ELEVE = 'ELEVE',

    // ==================================
    // DIRECTION D'ÉTABLISSEMENT (6 rôles)
    // ==================================
    
    /** Chef d'établissement secondaire (lycée) */
    PROVISEUR = 'PROVISEUR',
    
    /** Chef d'établissement collège */
    PRINCIPAL = 'PRINCIPAL',
    
    /** Chef d'école primaire */
    DIRECTEUR = 'DIRECTEUR',
    
    /** Responsable discipline & organisation (lycée) */
    CENSEUR = 'CENSEUR',
    
    /** Chef d'établissement adjoint */
    DIRECTEUR_ADJOINT = 'DIRECTEUR_ADJOINT',
    
    /** Conseiller pédagogique interne */
    RESPONSABLE_PEDAGOGIQUE = 'RESPONSABLE_PEDAGOGIQUE',

    // ==================================
    // ENSEIGNANTS (10 rôles)
    // ==================================
    
    /** Enseignant secondaire certifié */
    PROFESSEUR_CERTIFIE = 'PROFESSEUR_CERTIFIE',
    
    /** Enseignant lycée (agrégé) */
    PROFESSEUR_AGREGE = 'PROFESSEUR_AGREGE',
    
    /** Enseignant primaire */
    INSTITUTEUR = 'INSTITUTEUR',
    
    /** Enseignant contractuel / vacataire */
    MAITRE_AUXILIAIRE = 'MAITRE_AUXILIAIRE',
    
    /** Enseignant enseignement technique/professionnel */
    PROFESSEUR_TECHNIQUE = 'PROFESSEUR_TECHNIQUE',
    
    /** Enseignant maternelle */
    EDUCATEUR_MATERNELLE = 'EDUCATEUR_MATERNELLE',
    
    /** Professeur principal (responsable classe) */
    PROFESSEUR_PRINCIPAL = 'PROFESSEUR_PRINCIPAL',
    
    /** Coordinateur matière/département */
    COORDINATEUR_DISCIPLINE = 'COORDINATEUR_DISCIPLINE',
    
    /** Enseignant éducation spécialisée (handicap) */
    PROFESSEUR_SPECIAL = 'PROFESSEUR_SPECIAL',
    
    /** Professeur langues étrangères */
    PROFESSEUR_LANGUES = 'PROFESSEUR_LANGUES',

    // ==================================
    // ORIENTATION & CONSEIL (4 rôles)
    // ==================================
    
    /** Conseiller orientation scolaire */
    CONSEILLER_ORIENTEUR = 'CONSEILLER_ORIENTEUR',
    
    /** Psychologue de l'éducation */
    PSYCHOLOGUE_SCOLAIRE = 'PSYCHOLOGUE_SCOLAIRE',
    
    /** Assistant social scolaire */
    ASSISTANT_SOCIAL = 'ASSISTANT_SOCIAL',
    
    /** Médecin de l'Éducation nationale */
    MEDECIN_SCOLAIRE = 'MEDECIN_SCOLAIRE',

    // ==================================
    // PERSONNEL ADMINISTRATIF (7 rôles)
    // ==================================
    
    /** Secrétaire de direction */
    SECRETAIRE_DIRECTION = 'SECRETAIRE_DIRECTION',
    
    /** Agent comptable de l'établissement */
    COMPTABLE = 'COMPTABLE',
    
    /** Gestionnaire matériel/logistique */
    GESTIONNAIRE = 'GESTIONNAIRE',
    
    /** Responsable bibliothèque */
    BIBLIOTHECAIRE = 'BIBLIOTHECAIRE',
    
    /** Responsable documentation */
    DOCUMENTALISTE = 'DOCUMENTALISTE',
    
    /** Responsable archives */
    ARCHIVISTE = 'ARCHIVISTE',
    
    /** Agent d'accueil */
    ACCUEIL_STANDARD = 'ACCUEIL_STANDARD',

    // ==================================
    // PERSONNEL TECHNIQUE (5 rôles)
    // ==================================
    
    /** Technicien laboratoire (sciences) */
    TECHNICIEN_LABO = 'TECHNICIEN_LABO',
    
    /** Technicien informatique */
    TECHNICIEN_INFO = 'TECHNICIEN_INFO',
    
    /** Conseiller TIC pédagogique */
    CONSEILLER_TIC = 'CONSEILLER_TIC',
    
    /** Assistant pédagogique */
    AIDE_EDUCATEUR = 'AIDE_EDUCATEUR',
    
    /** Animateur TICE */
    ANIMATEUR_TICE = 'ANIMATEUR_TICE',

    // ==================================
    // SURVEILLANCE & INTERNAT (4 rôles)
    // ==================================
    
    /** Responsable surveillance */
    SURVEILLANT_GENERAL = 'SURVEILLANT_GENERAL',
    
    /** Maître d'internat / surveillant */
    SURVEILLANT = 'SURVEILLANT',
    
    /** Responsable internat */
    MAITRE_INTERNAT = 'MAITRE_INTERNAT',
    
    /** Conseiller Principal d'Éducation (CPE) */
    CONSEILLER_VIE_SCOLAIRE = 'CONSEILLER_VIE_SCOLAIRE',

    // ==================================
    // SANTÉ & BIEN-ÊTRE (3 rôles)
    // ==================================
    
    /** Infirmier de l'établissement */
    INFIRMIER_SCOLAIRE = 'INFIRMIER_SCOLAIRE',
    
    /** Nutritionniste (cantine) */
    NUTRITIONNISTE = 'NUTRITIONNISTE',
    
    /** Kinésithérapeute scolaire */
    KINESITHERAPEUTE = 'KINESITHERAPEUTE',

    // ==================================
    // CANTINE & LOGISTIQUE (2 rôles supplémentaires)
    // ==================================
    
    /** Personnel cuisine */
    CUISINIER = 'CUISINIER',
    
    /** Chauffeur bus scolaire */
    CHAUFFEUR = 'CHAUFFEUR',
    
    /** Personnel de maintenance */
    AGENT_ENTRETIEN = 'AGENT_ENTRETIEN',

    // ==================================
    // CLUBS & ACTIVITÉS (3 rôles)
    // ==================================
    
    /** Coordinateur activités parascolaires */
    COORDINATEUR_CLUBS = 'COORDINATEUR_CLUBS',
    
    /** Coach sport */
    ENTRAINEUR_SPORTIF = 'ENTRAINEUR_SPORTIF',
    
    /** Animateur culturel */
    ANIMATEUR_CULTUREL = 'ANIMATEUR_CULTUREL',

    // ==================================
    // SPÉCIALISÉ (5 rôles)
    // ==================================
    
    /** Responsable examens nationaux */
    COORDINATEUR_EXAMEN = 'COORDINATEUR_EXAMEN',
    
    /** Gestionnaire bourses */
    RESPONSABLE_BOURSES = 'RESPONSABLE_BOURSES',
    
    /** Audit interne (MINEDUC) */
    AUDITEUR_INTERNE = 'AUDITEUR_INTERNE',

    /** Statisticien éducation */
    STATISTICIEN = 'STATISTICIEN',

    /** Communication institutionnelle */
    CHARGE_COMMUNICATION = 'CHARGE_COMMUNICATION',

    // ==================================
    // PERSONNEL RH & PAIE (3 nouveaux rôles)
    // ==================================

    /** Gestionnaire RH — contrats, affectations */
    RH = 'RH',

    /** Gestionnaire de paie — bulletins, cotisations, primes, retenues */
    GESTIONNAIRE_PAIE = 'GESTIONNAIRE_PAIE',

    /** Valideur paie — validation finale des bulletins (séparation 4 yeux) */
    VALIDATEUR_PAIE = 'VALIDATEUR_PAIE',
}

/**
 * Permissions granulaires - Version 2.0
 * ~230 permissions au total
 */
export enum Permission {
    // ==================================
    // SUPER ADMIN (Permission spéciale)
    // ==================================
    SUPER_ADMIN_ALL = 'super_admin:all',

    // ==================================
    // ADMINISTRATION GÉNÉRIQUE
    // ==================================
    ADMIN_MANAGE = 'admin:manage',

    // ==================================
    // UTILISATEURS & AUTH
    // ==================================
    USERS_VIEW = 'users:view',
    USERS_CREATE = 'users:create',
    USERS_EDIT = 'users:edit',
    USERS_DELETE = 'users:delete',
    UTILISATEURS_MANAGE = 'utilisateurs:manage',
    UTILISATEURS_DELETE = 'utilisateurs:delete',
    UTILISATEURS_IMPORT = 'utilisateurs:import',
    UTILISATEURS_EXPORT = 'utilisateurs:export',
    UTILISATEURS_RESET_PASSWORD = 'utilisateurs:reset-password',
    UTILISATEURS_PROFIL_UPDATE = 'utilisateurs:profil:update',
    UTILISATEURS_STATUT_CHANGE = 'utilisateurs:statut:change',
    UTILISATEURS_ETABLISSEMENTS_MANAGE = 'utilisateurs:etablissements:manage',

    // Rôles & Permissions
    ROLES_VIEW = 'roles:view',
    ROLES_MANAGE = 'roles:manage',
    PERMISSIONS_VIEW = 'permissions:view',
    PERMISSIONS_CREATE = 'permissions:create',
    PERMISSIONS_EDIT = 'permissions:edit',
    PERMISSIONS_DELETE = 'permissions:delete',

    // Auth
    AUTH_SESSIONS_MANAGE = 'auth:sessions:manage',

    // ==================================
    // NOTES & BULLETINS
    // ==================================
    NOTES_VIEW = 'notes:view',
    NOTES_CREATE = 'notes:create',
    NOTES_EDIT = 'notes:edit',
    NOTES_DELETE = 'notes:delete',
    NOTES_VALIDATE = 'notes:validate',
    NOTES_BULK_CREATE = 'notes:bulk:create',
    NOTES_IMPORT = 'notes:import',
    NOTES_EXPORT = 'notes:export',
    NOTES_STATISTIQUES_VIEW = 'notes:statistiques:view',
    NOTES_EDITER_APRES_CLOTURE = 'notes:modifier_apres_cloture',

    BULLETINS_VIEW = 'bulletins:view',
    BULLETINS_GENERATE = 'bulletins:generate',
    BULLETINS_PRINT = 'bulletins:print',
    BULLETINS_EDIT = 'bulletins:edit',
    BULLETINS_PUBLIER = 'bulletins:publier',
    BULLETINS_EXPORT = 'bulletins:export',
    BULLETINS_DELETE = 'bulletins:delete',

    // ==================================
    // EMPLOI DU TEMPS
    // ==================================
    EMPLOI_DU_TEMPS_VIEW = 'emploi-du-temps:view',
    EMPLOI_DU_TEMPS_CREATE = 'emploi-du-temps:create',
    EMPLOI_DU_TEMPS_EDIT = 'emploi-du-temps:edit',
    EMPLOI_DU_TEMPS_DELETE = 'emploi-du-temps:delete',
    EMPLOI_DU_TEMPS_GENERER = 'emploi-du-temps:generer',
    EMPLOI_DU_TEMPS_EXPORT = 'emploi-du-temps:export',
    EMPLOI_DU_TEMPS_REALISATION_CREATE = 'emploi-du-temps:realisation:create',
    EMPLOI_DU_TEMPS_REALISATION_VALIDATE = 'emploi-du-temps:realisation:validate',
    EMPLOI_DU_TEMPS_PREFERENCES_MANAGE = 'emploi-du-temps:preferences:manage',
    EMPLOI_DU_TEMPS_TEMPLATES_MANAGE = 'emploi-du-temps:templates:manage',
    EMPLOI_DU_TEMPS_VERIFIER_CONFLITS = 'emploi-du-temps:verifier-conflits',
    EMPLOI_DU_TEMPS_ALL_VIEW = 'emploi-du-temps:all:view',

    // ==================================
    // ÉLÈVES & PERSONNEL
    // ==================================
    ELEVES_VIEW = 'eleves:view',
    ELEVES_CREATE = 'eleves:create',
    ELEVES_EDIT = 'eleves:edit',
    ELEVES_DELETE = 'eleves:delete',
    ELEVES_IMPORT = 'eleves:import',
    ELEVES_EXPORT = 'eleves:export',
    ELEVES_RADIATION = 'eleves:radiation',
    ELEVES_REINSCRIPTION = 'eleves:reinscription',
    ELEVES_DOCUMENTS_GENERATE = 'eleves:documents:generate',
    ELEVES_HISTORIQUE_VIEW = 'eleves:historique:view',

    ENSEIGNANTS_VIEW = 'enseignants:view',
    ENSEIGNANTS_CREATE = 'enseignants:create',
    ENSEIGNANTS_EDIT = 'enseignants:edit',
    ENSEIGNANTS_DELETE = 'enseignants:delete',
    ENSEIGNANTS_ASSIGN = 'enseignants:assign',
    ENSEIGNANT_MANAGE = 'enseignant:manage',

    PERSONNEL_VIEW = 'personnel:view',
    PERSONNEL_CREATE = 'personnel:create',
    PERSONNEL_EDIT = 'personnel:edit',
    PERSONNEL_DELETE = 'personnel:delete',
    PERSONNEL_TYPES_VIEW = 'personnel:types:view',
    PERSONNEL_TYPES_CREATE = 'personnel:types:create',
    PERSONNEL_MANAGE = 'personnel:manage',

    // ==================================
    // CONTRATS (module autonome)
    // ==================================
    CONTRATS_VIEW = 'contrats:view',
    CONTRATS_CREATE = 'contrats:create',
    CONTRATS_EDIT = 'contrats:edit',
    CONTRATS_DELETE = 'contrats:delete',
    CONTRATS_EXPORT = 'contrats:export',
    CONTRATS_CONFIG_VIEW = 'contrats:config:view',
    CONTRATS_CONFIG_CREATE = 'contrats:config:create',
    CONTRATS_CONFIG_EDIT = 'contrats:config:edit',
    CONTRATS_CONFIG_DELETE = 'contrats:config:delete',

    // ==================================
    // PAIE (module autonome)
    // ==================================
    PAIE_VIEW = 'paie:view',
    PAIE_CREATE = 'paie:create',
    PAIE_EDIT = 'paie:edit',
    PAIE_DELETE = 'paie:delete',
    PAIE_GENERER = 'paie:generer',
    PAIE_VALIDER = 'paie:valider',
    PAIE_EXPORT = 'paie:export',
    PAIE_CONFIG_VIEW = 'paie:config:view',
    PAIE_CONFIG_CREATE = 'paie:config:create',
    PAIE_CONFIG_EDIT = 'paie:config:edit',
    PAIE_CONFIG_DELETE = 'paie:config:delete',

    // ==================================
    // CLASSES & MATIÈRES
    // ==================================
    CLASSES_VIEW = 'classes:view',
    CLASSES_CREATE = 'classes:create',
    CLASSES_EDIT = 'classes:edit',
    CLASSES_DELETE = 'classes:delete',
    CLASSES_AFFECTER = 'classes:affecter',
    CLASSES_DESAFFECTER = 'classes:desaffecter',
    CLASSES_EFFECTIFS_VIEW = 'classes:effectifs:view',
    CLASSES_EXPORT = 'classes:export',

    MATIERES_VIEW = 'matieres:view',
    MATIERES_CREATE = 'matieres:create',
    MATIERES_EDIT = 'matieres:edit',
    MATIERES_DELETE = 'matieres:delete',
    MATIERES_ASSIGN = 'matieres:assign',
    MATIERES_GROUPES_VIEW = 'matieres:groupes:view',
    MATIERES_GROUPES_CREATE = 'matieres:groupes:create',
    MATIERES_PROGRAMME_VIEW = 'matieres:programme:view',
    MATIERES_PROGRAMME_CREATE = 'matieres:programme:create',
    MATIERES_PROGRAMME_EDIT = 'matieres:programme:edit',
    MATIERES_AFFECTATIONS_CREATE = 'matieres:affectations:create',

    // ==================================
    // STRUCTURE ACADÉMIQUE
    // ==================================
    ANNEES_VIEW = 'annees:view',
    ANNEES_CREATE = 'annees:create',
    ANNEES_EDIT = 'annees:edit',
    ANNEES_DELETE = 'annees:delete',
    ANNEES_ACTIVER = 'annees:activer',
    ANNEES_CLOTURER = 'annees:cloturer',
    ANNEES_DUPLIQUER = 'annees:dupliquer',

    PERIODES_VIEW = 'periodes:view',
    PERIODES_CREATE = 'periodes:create',
    PERIODES_EDIT = 'periodes:edit',
    PERIODES_DELETE = 'periodes:delete',
    PERIODES_CLOTURER = 'periodes:cloturer',
    PERIODES_REOUVRIR = 'periodes:reouvrir',
    PERIODES_COMPOSITIONS_VIEW = 'periodes:compositions:view',
    PERIODES_COMPOSITIONS_EDIT = 'periodes:compositions:edit',
    PERIODES_TEMPLATES_GENERER = 'periodes:templates:generer',
    PERIODES_TEMPLATES_VIEW = 'periodes:templates:view',
    PERIODES_TEMPLATES_CREATE = 'periodes:templates:create',
    PERIODES_TEMPLATES_EDIT = 'periodes:templates:edit',
    PERIODES_TEMPLATES_DELETE = 'periodes:templates:delete',
    PERIODES_LABELS_VIEW = 'periodes:labels:view',
    PERIODES_LABELS_EDIT = 'periodes:labels:edit',

    NIVEAUX_PERIODE_VIEW = 'niveaux_periode:view',
    NIVEAUX_PERIODE_CREATE = 'niveaux_periode:create',
    NIVEAUX_PERIODE_EDIT = 'niveaux_periode:edit',
    NIVEAUX_PERIODE_DELETE = 'niveaux_periode:delete',

    USAGES_NIVEAU_VIEW = 'usages_niveau:view',
    USAGES_NIVEAU_CREATE = 'usages_niveau:create',
    USAGES_NIVEAU_EDIT = 'usages_niveau:edit',
    USAGES_NIVEAU_DELETE = 'usages_niveau:delete',

    CYCLES_VIEW = 'cycles:view',
    CYCLES_CREATE = 'cycles:create',
    CYCLES_EDIT = 'cycles:edit',
    CYCLES_DELETE = 'cycles:delete',

    NIVEAUX_VIEW = 'niveaux:view',
    NIVEAUX_CREATE = 'niveaux:create',
    NIVEAUX_EDIT = 'niveaux:edit',
    NIVEAUX_DELETE = 'niveaux:delete',

    // ==================================
    // CANTINE & TRANSPORT
    // ==================================
    CANTINE_VIEW = 'cantine:view',
    CANTINE_MANAGE = 'cantine:manage',
    CANTINE_MENUS_CREATE = 'cantine:menus:create',
    CANTINE_MENUS_EDIT = 'cantine:menus:edit',
    CANTINE_MENUS_DELETE = 'cantine:menus:delete',
    CANTINE_INSCRIPTIONS_CREATE = 'cantine:inscriptions:create',
    CANTINE_INSCRIPTIONS_VIEW = 'cantine:inscriptions:view',
    CANTINE_SOLDE_RECHARGER = 'cantine:solde:recharger',
    CANTINE_CONSOMMATIONS_ENREGISTRER = 'cantine:consommations:enregistrer',
    CANTINE_CONSOMMATIONS_VIEW = 'cantine:consommations:view',
    CANTINE_STATISTIQUES_VIEW = 'cantine:statistiques:view',

    TRANSPORT_VIEW = 'transport:view',
    TRANSPORT_MANAGE = 'transport:manage',
    TRANSPORT_LIGNES_VIEW = 'transport:lignes:view',
    TRANSPORT_LIGNES_CREATE = 'transport:lignes:create',
    TRANSPORT_LIGNES_EDIT = 'transport:lignes:edit',
    TRANSPORT_LIGNES_DELETE = 'transport:lignes:delete',
    TRANSPORT_INSCRIPTIONS_CREATE = 'transport:inscriptions:create',
    TRANSPORT_INSCRIPTIONS_VIEW = 'transport:inscriptions:view',
    TRANSPORT_PRESENCES_ENREGISTRER = 'transport:presences:enregistrer',
    TRANSPORT_PRESENCES_VIEW = 'transport:presences:view',

    // ==================================
    // PARKING
    // ==================================
    PARKING_VIEW = 'parking:view',
    PARKING_MANAGE = 'parking:manage',
    PARKING_PLACES_VIEW = 'parking:places:view',
    PARKING_PLACES_CREATE = 'parking:places:create',
    PARKING_PLACES_EDIT = 'parking:places:edit',
    PARKING_PLACES_DELETE = 'parking:places:delete',
    PARKING_VEHICULES_VIEW = 'parking:vehicules:view',
    PARKING_VEHICULES_CREATE = 'parking:vehicules:create',
    PARKING_VEHICULES_EDIT = 'parking:vehicules:edit',
    PARKING_VEHICULES_DELETE = 'parking:vehicules:delete',
    PARKING_ABONNEMENTS_VIEW = 'parking:abonnements:view',
    PARKING_ABONNEMENTS_CREATE = 'parking:abonnements:create',
    PARKING_ABONNEMENTS_EDIT = 'parking:abonnements:edit',
    PARKING_STATISTIQUES_VIEW = 'parking:statistiques:view',

    // Infrastructure
    INFRASTRUCTURE_MANAGE = 'infrastructure:manage',

    // ==================================
    // MATÉRIEL & CARTES
    // ==================================
    MATERIEL_VIEW = 'materiel:view',
    MATERIEL_MANAGE = 'materiel:manage',
    MATERIEL_CREATE = 'materiel:create',
    MATERIEL_EDIT = 'materiel:edit',
    MATERIEL_DELETE = 'materiel:delete',
    MATERIEL_PRETS_VIEW = 'materiel:prets:view',
    MATERIEL_PRETS_CREATE = 'materiel:prets:create',
    MATERIEL_PRETS_RETOUR = 'materiel:prets:retour',
    MATERIEL_INVENTAIRE_MANAGE = 'materiel:inventaire:manage',

    CARTES_VIEW = 'cartes:view',
    CARTES_GENERATE = 'cartes:generate',
    CARTES_PRINT = 'cartes:print',
    CARTES_CREATE = 'cartes:create',
    CARTES_EDIT = 'cartes:edit',
    CARTES_DESACTIVER = 'cartes:desactiver',
    CARTES_PERTE_SIGNALER = 'cartes:perte:signaler',
    CARTES_IMPORT = 'cartes:import',

    // ==================================
    // FINANCES
    // ==================================
    FINANCES_VIEW = 'finances:view',
    FINANCES_MANAGE = 'finances:manage',
    FINANCES_PAIEMENTS_CREATE = 'finances:paiements:create',
    FINANCES_PAIEMENTS_EDIT = 'finances:paiements:edit',
    FINANCES_PAIEMENTS_DELETE = 'finances:paiements:delete',
    FINANCES_FACTURES_CREATE = 'finances:factures:create',
    FINANCES_FACTURES_EDIT = 'finances:factures:edit',
    FINANCES_STATISTIQUES_VIEW = 'finances:statistiques:view',
    FINANCES_EXPORT = 'finances:export',

    // ==================================
    // CLUBS & GAMIFICATION
    // ==================================
    CLUBS_VIEW = 'clubs:view',
    CLUBS_MANAGE = 'clubs:manage',
    CLUBS_CREATE = 'clubs:create',
    CLUBS_EDIT = 'clubs:edit',
    CLUBS_DELETE = 'clubs:delete',
    CLUBS_INSCRIPTIONS_MANAGE = 'clubs:inscriptions:manage',
    CLUBS_EVENEMENTS_CREATE = 'clubs:evenements:create',
    CLUBS_EVENEMENTS_EDIT = 'clubs:evenements:edit',
    CLUBS_EVENEMENTS_DELETE = 'clubs:evenements:delete',
    CLUBS_EVENEMENTS_VIEW = 'clubs:evenements:view',

    GAMIFICATION_VIEW = 'gamification:view',
    GAMIFICATION_MANAGE = 'gamification:manage',
    GAMIFICATION_BADGES_CREATE = 'gamification:badges:create',
    GAMIFICATION_BADGES_EDIT = 'gamification:badges:edit',
    GAMIFICATION_BADGES_DELETE = 'gamification:badges:delete',
    GAMIFICATION_POINTS_ATTRIBUER = 'gamification:points:attribuer',
    GAMIFICATION_BADGES_ATTRIBUER = 'gamification:badges:attribuer',
    GAMIFICATION_CLASSEMENT_VIEW = 'gamification:classement:view',
    GAMIFICATION_HISTORIQUE_VIEW = 'gamification:historique:view',

    // ==================================
    // PROGRAMMES PÉDAGOGIQUES
    // ==================================
    PROGRAMMES_CHAPITRE_READ = 'programmes:chapitre:read',
    PROGRAMMES_CHAPITRE_CREATE = 'programmes:chapitre:create',
    PROGRAMMES_CHAPITRE_EDIT = 'programmes:chapitre:edit',
    PROGRAMMES_CHAPITRE_DELETE = 'programmes:chapitre:delete',
    PROGRAMMES_CHAPITRE_VALIDATE = 'programmes:chapitre:validate',
    PROGRAMMES_CORRELATION_READ = 'programmes:correlation:read',
    PROGRAMMES_CORRELATION_EVALUATE = 'programmes:correlation:evaluate',
    PROGRAMMES_DASHBOARD_READ = 'programmes:dashboard:read',
    PROGRAMMES_HISTORISER = 'programmes:historiser',

    // ==================================
    // ORIENTATION & SCORING
    // ==================================
    ORIENTATION_VIEW = 'orientation:view',
    ORIENTATION_CREATE = 'orientation:create',
    ORIENTATION_EDIT = 'orientation:edit',
    ORIENTATION_VALIDER = 'orientation:valider',
    ORIENTATION_PROFILS_VIEW = 'orientation:profils:view',
    ORIENTATION_PROFILS_CREATE = 'orientation:profils:create',
    ORIENTATION_PROFILS_EDIT = 'orientation:profils:edit',
    ORIENTATION_SUGGESTIONS_VIEW = 'orientation:suggestions:view',
    ORIENTATION_FICHES_VIEW = 'orientation:fiches:view',
    ORIENTATION_FICHES_CREATE = 'orientation:fiches:create',
    ORIENTATION_RDV_VIEW = 'orientation:rdv:view',
    ORIENTATION_RDV_CREATE = 'orientation:rdv:create',
    ORIENTATION_RDV_EDIT = 'orientation:rdv:edit',
    ORIENTATION_RDV_ANNULER = 'orientation:rdv:annuler',

    SCORING_VIEW = 'scoring:view',
    SCORING_CONFIGURER = 'scoring:configurer',
    SCORING_GENERER = 'scoring:generer',
    SCORING_POINTS_ATTRIBUER = 'scoring:points:attribuer',
    SCORING_RANGS_CALCULER = 'scoring:rangs:calculer',
    SCORING_CLASSEMENT_VIEW = 'scoring:classement:view',
    SCORING_REGLES_VIEW = 'scoring:regles:view',
    SCORING_REGLES_CREATE = 'scoring:regles:create',
    SCORING_HISTORIQUE_VIEW = 'scoring:historique:view',
    SCORING_RECALCULER = 'scoring:recalculer',

    // ==================================
    // IMPRESSIONS & DOCUMENTS
    // ==================================
    IMPRESSIONS_VIEW = 'impressions:view',
    IMPRESSIONS_GERER = 'impressions:gerer',
    IMPRESSIONS_MODELES_VIEW = 'impressions:modeles:view',
    IMPRESSIONS_MODELES_CREATE = 'impressions:modeles:create',
    IMPRESSIONS_MODELES_EDIT = 'impressions:modeles:edit',
    IMPRESSIONS_MODELES_DELETE = 'impressions:modeles:delete',
    IMPRESSIONS_FILE_VIEW = 'impressions:file:view',
    IMPRESSIONS_FILE_CREATE = 'impressions:file:create',
    IMPRESSIONS_FILE_GENERER = 'impressions:file:generer',
    IMPRESSIONS_FILE_ANNULER = 'impressions:file:annuler',
    IMPRESSIONS_TRAITER = 'impressions:traiter',

    DOCUMENTS_VIEW = 'documents:view',
    DOCUMENTS_CREATE = 'documents:create',
    DOCUMENTS_PRINT = 'documents:print',

    // ==================================
    // MESSAGERIE & NOTIFICATIONS
    // ==================================
    MESSAGES_SEND = 'messages:send',
    MESSAGES_BROADCAST = 'messages:broadcast',
    MESSAGERIE_VIEW = 'messagerie:view',
    MESSAGERIE_ENVOYER = 'messagerie:envoyer',
    MESSAGERIE_SUPPRIMER = 'messagerie:supprimer',
    MESSAGERIE_CONVERSATIONS_CREATE = 'messagerie:conversations:create',
    MESSAGERIE_BROADCAST = 'messagerie:broadcast',
    MESSAGERIE_MESSAGES_READ = 'messagerie:messages:read',

    NOTIFICATIONS_MANAGE = 'notifications:manage',
    NOTIFICATIONS_VIEW = 'notifications:view',
    NOTIFICATIONS_ENVOYER = 'notifications:envoyer',
    NOTIFICATIONS_CONFIGURER = 'notifications:configurer',
    NOTIFICATIONS_CREATE = 'notifications:create',
    NOTIFICATIONS_BULK_CREATE = 'notifications:bulk:create',
    NOTIFICATIONS_READ = 'notifications:read',
    NOTIFICATIONS_READ_ALL = 'notifications:read-all',
    NOTIFICATIONS_DELETE = 'notifications:delete',
    NOTIFICATIONS_COUNT = 'notifications:count',

    // ==================================
    // REQUÊTES
    // ==================================
    REQUETES_VIEW = 'requetes:view',
    REQUETES_CREATE = 'requetes:create',
    REQUETES_APPROVE = 'requetes:approve',
    REQUETES_REFUSER = 'requetes:refuser',
    REQUETES_TRAITER = 'requetes:traiter',
    REQUETES_ANNULER = 'requetes:annuler',

    // ==================================
    // SONDAGES
    // ==================================
    SONDAGES_CREATE = 'sondages:create',
    SONDAGES_VOTE = 'sondages:vote',
    SONDAGES_ANALYZE = 'sondages:analyze',
    SONDAGES_VIEW = 'sondages:view',
    SONDAGES_EDIT = 'sondages:edit',
    SONDAGES_DELETE = 'sondages:delete',
    SONDAGES_TEMPLATES_MANAGE = 'sondages:templates:manage',

    // ==================================
    // ÉTABLISSEMENTS & CONFIGURATION
    // ==================================
    ETABLISSEMENT_VIEW = 'etablissement:view',
    ETABLISSEMENT_EDIT = 'etablissement:edit',
    ETABLISSEMENTS_LIST = 'etablissements:list',
    ETABLISSEMENTS_CREATE = 'etablissements:create',
    ETABLISSEMENTS_DESACTIVER = 'etablissements:desactiver',
    ETABLISSEMENTS_ACTIVER = 'etablissements:activer',
    ETABLISSEMENTS_CONFIG_VIEW = 'etablissements:config:view',
    ETABLISSEMENTS_CONFIG_EDIT = 'etablissements:config:edit',

    CONFIG_VIEW = 'config:view',
    CONFIG_EDIT = 'config:edit',
    CONFIGURATION_SEED = 'configuration:seed',
    CONFIGURATION_LICENCE_ACTIVER = 'configuration:licence:activer',

    // Permissions granulaires du module Configuration (unifiées Permissions + ConfigPermission)
    CONFIG_APP_VIEW = 'config:app:view',
    CONFIG_APP_EDIT = 'config:app:edit',
    CONFIG_MODULE_VIEW = 'config:module:view',
    CONFIG_MODULE_EDIT = 'config:module:edit',
    CONFIG_MODULE_TOGGLE = 'config:module:toggle',
    CONFIG_PARAM_VIEW = 'config:param:view',
    CONFIG_PARAM_CREATE = 'config:param:create',
    CONFIG_PARAM_EDIT = 'config:param:edit',
    CONFIG_PARAM_DELETE = 'config:param:delete',
    CONFIG_PARAM_RESET = 'config:param:reset',
    CONFIG_HISTORY_VIEW = 'config:history:view',
    CONFIG_HISTORY_RESTORE = 'config:history:restore',
    CONFIG_BACKUP_CREATE = 'config:backup:create',
    CONFIG_BACKUP_RESTORE = 'config:backup:restore',
    CONFIG_EXPORT = 'config:export',
    CONFIG_IMPORT = 'config:import',
    CONFIG_CACHE_INVALIDATE = 'config:cache:invalidate',

    // ==================================
    // APPARENCE (Fonds d'écran, Thème, Logo)
    // ==================================
    APPARENCE_FONDS_VIEW = 'apparence:fonds:view',
    APPARENCE_FONDS_MANAGE = 'apparence:fonds:manage',

    // Santé
    SANTE_VIEW = 'sante:view',
    SANTE_CONSULTATIONS = 'sante:consultations',
    SANTE_VACCINATIONS = 'sante:vaccinations',

    // Menu cantine (view manquant)
    CANTINE_MENUS_VIEW = 'cantine:menus:view',

    // ==================================
    // MONITORING
    // ==================================
    MONITORING_VIEW = 'monitoring:view',
    MONITORING_LOGS = 'monitoring:logs',
    MONITORING_EXPORT = 'monitoring:export',
    MONITORING_METRICS_VIEW = 'monitoring:metrics:view',
    MONITORING_STATS_VIEW = 'monitoring:stats:view',
    MONITORING_HEALTH_VIEW = 'monitoring:health:view',
    MONITORING_MAINTENANCE_TOGGLE = 'monitoring:maintenance:toggle',

    // ==================================
    // VALIDATION WORKFLOW
    // ==================================
    VALIDATION_NOTES_LEVEL1 = 'validation:notes:level1',
    VALIDATION_NOTES_LEVEL2 = 'validation:notes:level2',
    VALIDATION_NOTES_LEVEL3 = 'validation:notes:level3',
    VALIDATION_BULLETINS_LEVEL1 = 'validation:bulletins:level1',
    VALIDATION_BULLETINS_LEVEL2 = 'validation:bulletins:level2',
    VALIDATION_BULLETINS_LEVEL3 = 'validation:bulletins:level3',
    VALIDATION_CANTINE_LEVEL1 = 'validation:cantine:level1',
    VALIDATION_CANTINE_LEVEL2 = 'validation:cantine:level2',
    VALIDATION_CANTINE_LEVEL3 = 'validation:cantine:level3',
    VALIDATION_TRANSPORT_LEVEL1 = 'validation:transport:level1',
    VALIDATION_TRANSPORT_LEVEL2 = 'validation:transport:level2',
    VALIDATION_TRANSPORT_LEVEL3 = 'validation:transport:level3',
    VALIDATION_DASHBOARD_VIEW = 'validation:dashboard:view',
    VALIDATION_RAPPORTS_VIEW = 'validation:rapports:view',
    VALIDATION_RAPPORTS_EXPORT = 'validation:rapports:export',
    VALIDATION_CLASSES_LEVEL1 = 'validation:classes:level1',
    VALIDATION_CLASSES_LEVEL2 = 'validation:classes:level2',
    VALIDATION_CLASSES_LEVEL3 = 'validation:classes:level3',
    VALIDATION_MATIERES_LEVEL1 = 'validation:matieres:level1',
    VALIDATION_MATIERES_LEVEL2 = 'validation:matieres:level2',
    VALIDATION_MATIERES_LEVEL3 = 'validation:matieres:level3',
    VALIDATION_PERIODES_LEVEL1 = 'validation:periodes:level1',
    VALIDATION_PERIODES_LEVEL2 = 'validation:periodes:level2',
    VALIDATION_ELEVES_LEVEL1 = 'validation:eleves:level1',
    VALIDATION_ELEVES_LEVEL2 = 'validation:eleves:level2',
    VALIDATION_ELEVES_LEVEL3 = 'validation:eleves:level3',
    VALIDATION_PERSONNEL_LEVEL1 = 'validation:personnel:level1',
    VALIDATION_PERSONNEL_LEVEL2 = 'validation:personnel:level2',
    VALIDATION_CLUBS_LEVEL1 = 'validation:clubs:level1',
    VALIDATION_CLUBS_LEVEL2 = 'validation:clubs:level2',
    VALIDATION_CLUBS_LEVEL3 = 'validation:clubs:level3',
    VALIDATION_MATERIEL_LEVEL1 = 'validation:materiel:level1',
    VALIDATION_MATERIEL_LEVEL2 = 'validation:materiel:level2',
    VALIDATION_CARTES_LEVEL1 = 'validation:cartes:level1',
    VALIDATION_CARTES_LEVEL2 = 'validation:cartes:level2',
    VALIDATION_ANNEES_SCOLAIRES_LEVEL1 = 'validation:annees_scolaires:level1',
    VALIDATION_ANNEES_SCOLAIRES_LEVEL2 = 'validation:annees_scolaires:level2',
    VALIDATION_ETABLISSEMENT_LEVEL1 = 'validation:etablissement:level1',
    VALIDATION_ETABLISSEMENT_LEVEL2 = 'validation:etablissement:level2',

    // ==================================
    // FINANCES - SCOLARITÉ (12 permissions)
    // ==================================
    FINANCES_SCOLARITE_VIEW = 'finances:scolarite:view',
    FINANCES_SCOLARITE_CONFIG = 'finances:scolarite:config',
    FINANCES_PAIEMENT_CREATE = 'finances:paiement:create',
    FINANCES_PAIEMENT_VALIDATE = 'finances:paiement:validate',
    FINANCES_PAIEMENT_REFUND = 'finances:paiement:refund',
    FINANCES_PAIEMENT_DELETE = 'finances:paiement:delete',
    FINANCES_RECU_GENERATE = 'finances:recu:generate',
    FINANCES_RECU_DOWNLOAD = 'finances:recu:download',
    FINANCES_RELANCE_SEND = 'finances:relance:send',
    FINANCES_ETAT_COMPTE_VIEW = 'finances:etat-compte:view',
    FINANCES_REMISE_GRANT = 'finances:remise:grant',
    FINANCES_ECHEANCIER_GENERATE = 'finances:echeancier:generate',

    // ==================================
    // FINANCES - DÉPENSES (18 permissions)
    // ==================================
    FINANCES_DEPENSES_VIEW = 'finances:depenses:view',
    FINANCES_DEPENSES_CREATE = 'finances:depenses:create',
    FINANCES_DEPENSES_EDIT = 'finances:depenses:edit',
    FINANCES_DEPENSES_VALIDATE = 'finances:depenses:validate',
    FINANCES_DEPENSES_PAYER = 'finances:depenses:payer',
    FINANCES_DEPENSES_DELETE = 'finances:depenses:delete',
    FINANCES_DEPENSES_EXPORT = 'finances:depenses:export',
    FINANCES_DEPENSES_CONFIG = 'finances:depenses:config',
    FINANCES_DEPENSES_RAPPORTS = 'finances:depenses:rapports',
    FINANCES_DEMANDE_CREATE = 'finances:demande:create',
    FINANCES_DEMANDE_VALIDATE = 'finances:demande:validate',
    FINANCES_DEMANDE_REJECT = 'finances:demande:reject',
    FINANCES_DEMANDE_VIEW_ALL = 'finances:demande:view-all',
    FINANCES_BON_COMMANDE_CREATE = 'finances:bon-commande:create',
    FINANCES_BON_COMMANDE_VALIDATE = 'finances:bon-commande:validate',
    FINANCES_FOURNISSEURS_VIEW = 'finances:fournisseurs:view',
    FINANCES_FOURNISSEURS_MANAGE = 'finances:fournisseurs:manage',
    FINANCES_FACTURE_VALIDATE = 'finances:facture:validate',

    // ==================================
    // FINANCES - COMPTABILITÉ (7 permissions)
    // ==================================
    FINANCES_COMPTABILITE_VIEW = 'finances:comptabilite:view',
    FINANCES_COMPTABILITE_ECRIRE = 'finances:comptabilite:ecrire',
    FINANCES_COMPTABILITE_VALIDER = 'finances:comptabilite:valider',
    FINANCES_COMPTABILITE_ANNULER = 'finances:comptabilite:annuler',
    FINANCES_COMPTABILITE_BALANCE = 'finances:comptabilite:balance',
    FINANCES_COMPTABILITE_RAPPORT = 'finances:comptabilite:rapport',
    FINANCES_COMPTABILITE_EXPORT = 'finances:comptabilite:export',

    // ==================================
    // FINANCES - TRÉSORERIE (6 permissions)
    // ==================================
    FINANCES_TRESORERIE_VIEW = 'finances:tresorerie:view',
    FINANCES_TRESORERIE_MANAGE = 'finances:tresorerie:manage',
    FINANCES_CAISSE_ENTRER = 'finances:caisse:entrer',
    FINANCES_CAISSE_SORTIR = 'finances:caisse:sortir',
    FINANCES_CAISSE_CLOTURER = 'finances:caisse:cloturer',
    FINANCES_BANQUE_VIRER = 'finances:banque:virer',

    // ==================================
    // FINANCES - BUDGET (8 permissions)
    // ==================================
    FINANCES_BUDGET_VIEW = 'finances:budget:view',
    FINANCES_BUDGET_CREATE = 'finances:budget:create',
    FINANCES_BUDGET_VALIDATE = 'finances:budget:validate',
    FINANCES_BUDGET_EDIT = 'finances:budget:edit',
    FINANCES_BUDGET_CLOTURER = 'finances:budget:cloturer',
    FINANCES_BUDGET_RAPPORTS = 'finances:budget:rapports',
    FINANCES_BUDGET_ENGAGER = 'finances:budget:engager',
    FINANCES_BUDGET_CONSOMMER = 'finances:budget:consommer',

    // ==================================
    // FINANCES - DASHBOARD & RAPPORTS (4 permissions)
    // ==================================
    FINANCES_DASHBOARD_VIEW = 'finances:dashboard:view',
    FINANCES_DASHBOARD_EXPORT = 'finances:dashboard:export',
    FINANCES_DASHBOARD_KPI = 'finances:dashboard:kpi',
    FINANCES_RAPPORTS_GENERER = 'finances:rapports:generer',

    // ==================================
    // GROUPES ÉTABLISSEMENTS (9 permissions unifiées)
    // ==================================
    GROUPES_ETABLISSEMENTS_VIEW = 'groupes-etablissements:view',
    GROUPES_ETABLISSEMENTS_CREATE = 'groupes-etablissements:create',
    GROUPES_ETABLISSEMENTS_EDIT = 'groupes-etablissements:edit',
    GROUPES_ETABLISSEMENTS_DELETE = 'groupes-etablissements:delete',
    GROUPES_ETABLISSEMENTS_MANAGE = 'groupes-etablissements:manage',
    GROUPES_ETABLISSEMENTS_DASHBOARD = 'groupes-etablissements:dashboard',
    GROUPES_ETABLISSEMENTS_MANAGE_ADMINS = 'groupes-etablissements:manage-admins',
    GROUPES_ETABLISSEMENTS_MANAGE_ETABLISSEMENTS = 'groupes-etablissements:manage-etablissements',
    GROUPES_ETABLISSEMENTS_RAPPORTS = 'groupes-etablissements:rapports',

    // ==================================
    // ORGANISATION (permissions granulaires)
    // ==================================
    ORGANISATION_VIEW = 'organisation:view',
    ORGANISATION_CREATE = 'organisation:create',
    ORGANISATION_EDIT = 'organisation:edit',
    ORGANISATION_DELETE = 'organisation:delete',
    
    // Permissions granulaires — Unités
    ORGANISATION_UNITES_READ = 'organisation:unites:read',
    ORGANISATION_UNITES_WRITE = 'organisation:unites:write',
    ORGANISATION_UNITES_DELETE = 'organisation:unites:delete',
    
    // Permissions granulaires — Postes
    ORGANISATION_POSTES_READ = 'organisation:postes:read',
    ORGANISATION_POSTES_WRITE = 'organisation:postes:write',
    ORGANISATION_POSTES_DELETE = 'organisation:postes:delete',
    
    // Permissions granulaires — Fonctions
    ORGANISATION_FONCTIONS_READ = 'organisation:fonctions:read',
    ORGANISATION_FONCTIONS_WRITE = 'organisation:fonctions:write',
    ORGANISATION_FONCTIONS_DELETE = 'organisation:fonctions:delete',
    
    // Permissions granulaires — Hiérarchie
    ORGANISATION_HIERARCHIE_READ = 'organisation:hierarchie:read',
    ORGANISATION_HIERARCHIE_WRITE = 'organisation:hierarchie:write',
    ORGANISATION_HIERARCHIE_DELETE = 'organisation:hierarchie:delete',
    
    // Permissions granulaires — Nomenclatures
    ORGANISATION_NOMENCLATURES_READ = 'organisation:nomenclatures:read',
    ORGANISATION_NOMENCLATURES_WRITE = 'organisation:nomenclatures:write',
    ORGANISATION_NOMENCLATURES_DELETE = 'organisation:nomenclatures:delete',
    
    // Permissions granulaires — Templates
    ORGANISATION_TEMPLATES_READ = 'organisation:templates:read',
    ORGANISATION_TEMPLATES_WRITE = 'organisation:templates:write',
    ORGANISATION_TEMPLATES_DELETE = 'organisation:templates:delete',
    
    // Permissions granulaires — Génération
    ORGANISATION_GENERATION_EXECUTE = 'organisation:generation:execute',
    
    // Permissions granulaires — Organigramme (lecture seule, ouverte à tous les rôles)
    ORGANISATION_ORGANIGRAMME_READ = 'organisation:organigramme:read',
    
    // Permissions legacy (compatibilité)
    UNITES_VIEW = 'unites:view',
    UNITES_CREATE = 'unites:create',
    UNITES_EDIT = 'unites:edit',
    UNITES_DELETE = 'unites:delete',
    UNITES_ARBRESCENCE_VIEW = 'unites:arborescence:view',
    
    POSTES_VIEW = 'postes:view',
    POSTES_CREATE = 'postes:create',
    POSTES_EDIT = 'postes:edit',
    POSTES_DELETE = 'postes:delete',
    POSTES_ASSIGNER = 'postes:assigner',
    
    ORGANIGRAMME_VIEW = 'organigramme:view',

    // ==================================
    // AUDIT — Logs d'audit par module
    // ==================================
    AUDIT_VIEW = 'audit:view',
    AUDIT_NOTES_VIEW = 'audit:notes:view',
    AUDIT_BULLETINS_VIEW = 'audit:bulletins:view',
    AUDIT_PERSONNEL_VIEW = 'audit:personnel:view',
    AUDIT_CONTRATS_VIEW = 'audit:contrats:view',
    AUDIT_PAIE_VIEW = 'audit:paie:view',
    AUDIT_ELEVES_VIEW = 'audit:eleves:view',
    AUDIT_CLASSES_VIEW = 'audit:classes:view',
    AUDIT_MATIERES_VIEW = 'audit:matieres:view',
    AUDIT_PERIODES_VIEW = 'audit:periodes:view',
    AUDIT_EMPLOI_DU_TEMPS_VIEW = 'audit:emploi-du-temps:view',
    AUDIT_ORGANISATION_VIEW = 'audit:organisation:view',
    AUDIT_COMPETENCES_VIEW = 'audit:competences:view',
    AUDIT_DIPLOMES_ELEVES_VIEW = 'audit:diplomes-eleves:view',
    AUDIT_EXAMENS_NATIONAUX_VIEW = 'audit:examens-nationaux:view',
    AUDIT_GROUPES_ETABLISSEMENTS_VIEW = 'audit:groupes-etablissements:view',
    AUDIT_APPARENCE_VIEW = 'audit:apparence:view',
    AUDIT_FINANCES_VIEW = 'audit:finances:view',
    AUDIT_MESSAGERIE_VIEW = 'audit:messagerie:view',
    AUDIT_SONDAGES_VIEW = 'audit:sondages:view',
    AUDIT_ORIENTATION_VIEW = 'audit:orientation:view',
    AUDIT_REQUETES_VIEW = 'audit:requetes:view',
    // Network / Connectivity
    NETWORK_VIEW = 'network:view',
    NETWORK_DETAILS = 'network:details',
    NETWORK_ADMIN = 'network:admin',

    AUDIT_GAMIFICATION_VIEW = 'audit:gamification:view',
    AUDIT_CARTES_VIEW = 'audit:cartes:view',
    AUDIT_CLUBS_VIEW = 'audit:clubs:view',
    AUDIT_MATERIEL_VIEW = 'audit:materiel:view',
    AUDIT_CONFIGURATION_VIEW = 'audit:configuration:view',
}

/**
 * Mapping des permissions par défaut pour chaque rôle
 * Version 2.0 - Seulement les rôles principaux sont définis ici
 * Les rôles spécifiques héritent des permissions du rôle générique
 */
export const DEFAULT_ROLE_PERMISSIONS: Partial<Record<Role, Permission[]>> = {
    [Role.SUPER_ADMIN]: Object.values(Permission), // Toutes les permissions

    [Role.ADMIN]: [
        Permission.ADMIN_MANAGE,
        Permission.USERS_VIEW, Permission.USERS_CREATE, Permission.USERS_EDIT,
        Permission.UTILISATEURS_MANAGE, Permission.UTILISATEURS_DELETE, Permission.UTILISATEURS_ETABLISSEMENTS_MANAGE, Permission.UTILISATEURS_IMPORT, Permission.UTILISATEURS_EXPORT, Permission.UTILISATEURS_STATUT_CHANGE,
        Permission.ROLES_VIEW, Permission.ROLES_MANAGE,
        Permission.CONFIG_VIEW, Permission.CONFIG_EDIT,
        Permission.CONFIG_APP_VIEW, Permission.CONFIG_APP_EDIT,
        Permission.CONFIG_MODULE_VIEW, Permission.CONFIG_MODULE_EDIT, Permission.CONFIG_MODULE_TOGGLE,
        Permission.CONFIG_PARAM_VIEW, Permission.CONFIG_PARAM_CREATE, Permission.CONFIG_PARAM_EDIT,
        Permission.CONFIG_PARAM_DELETE, Permission.CONFIG_PARAM_RESET,
        Permission.CONFIG_HISTORY_VIEW, Permission.CONFIG_HISTORY_RESTORE,
        Permission.CONFIG_BACKUP_CREATE, Permission.CONFIG_BACKUP_RESTORE,
        Permission.CONFIG_EXPORT, Permission.CONFIG_CACHE_INVALIDATE,
        Permission.MONITORING_VIEW,
        Permission.NETWORK_VIEW, Permission.NETWORK_DETAILS, Permission.NETWORK_ADMIN,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE, Permission.DOCUMENTS_PRINT,
        Permission.NOTIFICATIONS_MANAGE,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        // Classes & Structure académique
        Permission.CLASSES_VIEW, Permission.CLASSES_CREATE, Permission.CLASSES_EDIT, Permission.CLASSES_DELETE,
        Permission.CLASSES_AFFECTER, Permission.CLASSES_DESAFFECTER, Permission.CLASSES_EFFECTIFS_VIEW, Permission.CLASSES_EXPORT,
        Permission.MATIERES_VIEW, Permission.MATIERES_CREATE, Permission.MATIERES_EDIT, Permission.MATIERES_DELETE,
        Permission.MATIERES_ASSIGN,
        Permission.CYCLES_VIEW, Permission.NIVEAUX_VIEW,
        Permission.ANNEES_VIEW,
        Permission.PERIODES_VIEW, Permission.PERIODES_CREATE, Permission.PERIODES_EDIT, Permission.PERIODES_DELETE,
        Permission.PERIODES_CLOTURER, Permission.PERIODES_REOUVRIR,
        Permission.PERIODES_COMPOSITIONS_VIEW, Permission.PERIODES_COMPOSITIONS_EDIT, Permission.PERIODES_TEMPLATES_GENERER,
        Permission.PERIODES_TEMPLATES_VIEW, Permission.PERIODES_TEMPLATES_CREATE, Permission.PERIODES_TEMPLATES_EDIT, Permission.PERIODES_TEMPLATES_DELETE,
        Permission.PERIODES_LABELS_VIEW, Permission.PERIODES_LABELS_EDIT,
        Permission.NIVEAUX_PERIODE_VIEW, Permission.NIVEAUX_PERIODE_CREATE, Permission.NIVEAUX_PERIODE_EDIT, Permission.NIVEAUX_PERIODE_DELETE,
        Permission.USAGES_NIVEAU_VIEW, Permission.USAGES_NIVEAU_CREATE, Permission.USAGES_NIVEAU_EDIT, Permission.USAGES_NIVEAU_DELETE,
        // Notes & Bulletins
        Permission.NOTES_VIEW, Permission.NOTES_CREATE, Permission.NOTES_EDIT, Permission.NOTES_DELETE,
        Permission.NOTES_VALIDATE, Permission.NOTES_BULK_CREATE, Permission.NOTES_IMPORT, Permission.NOTES_EXPORT,
        Permission.NOTES_STATISTIQUES_VIEW, Permission.NOTES_EDITER_APRES_CLOTURE,
        Permission.BULLETINS_VIEW, Permission.BULLETINS_GENERATE, Permission.BULLETINS_PRINT, Permission.BULLETINS_EDIT,
        Permission.BULLETINS_PUBLIER, Permission.BULLETINS_EXPORT, Permission.BULLETINS_DELETE,
        // Validation permissions
        Permission.VALIDATION_NOTES_LEVEL1, Permission.VALIDATION_NOTES_LEVEL2, Permission.VALIDATION_NOTES_LEVEL3,
        Permission.VALIDATION_BULLETINS_LEVEL1, Permission.VALIDATION_BULLETINS_LEVEL2, Permission.VALIDATION_BULLETINS_LEVEL3,
        Permission.VALIDATION_CANTINE_LEVEL1, Permission.VALIDATION_CANTINE_LEVEL2, Permission.VALIDATION_CANTINE_LEVEL3,
        Permission.VALIDATION_TRANSPORT_LEVEL1, Permission.VALIDATION_TRANSPORT_LEVEL2, Permission.VALIDATION_TRANSPORT_LEVEL3,
        Permission.VALIDATION_DASHBOARD_VIEW, Permission.VALIDATION_RAPPORTS_VIEW, Permission.VALIDATION_RAPPORTS_EXPORT,
        Permission.VALIDATION_CLASSES_LEVEL1, Permission.VALIDATION_CLASSES_LEVEL2, Permission.VALIDATION_CLASSES_LEVEL3,
        Permission.VALIDATION_MATIERES_LEVEL1, Permission.VALIDATION_MATIERES_LEVEL2, Permission.VALIDATION_MATIERES_LEVEL3,
        Permission.VALIDATION_PERIODES_LEVEL1, Permission.VALIDATION_PERIODES_LEVEL2,
        Permission.VALIDATION_ELEVES_LEVEL1, Permission.VALIDATION_ELEVES_LEVEL2, Permission.VALIDATION_ELEVES_LEVEL3,
        Permission.VALIDATION_PERSONNEL_LEVEL1, Permission.VALIDATION_PERSONNEL_LEVEL2,
        Permission.VALIDATION_CLUBS_LEVEL1, Permission.VALIDATION_CLUBS_LEVEL2, Permission.VALIDATION_CLUBS_LEVEL3,
        Permission.VALIDATION_MATERIEL_LEVEL1, Permission.VALIDATION_MATERIEL_LEVEL2,
        Permission.VALIDATION_CARTES_LEVEL1, Permission.VALIDATION_CARTES_LEVEL2,
        Permission.VALIDATION_ANNEES_SCOLAIRES_LEVEL1, Permission.VALIDATION_ANNEES_SCOLAIRES_LEVEL2,
        Permission.VALIDATION_ETABLISSEMENT_LEVEL1, Permission.VALIDATION_ETABLISSEMENT_LEVEL2,
        // Finances - Configuration complète
        Permission.FINANCES_SCOLARITE_VIEW,
        Permission.FINANCES_SCOLARITE_CONFIG,
        Permission.FINANCES_PAIEMENT_VALIDATE,
        Permission.FINANCES_DEPENSES_CONFIG,
        Permission.FINANCES_DEPENSES_RAPPORTS,
        Permission.FINANCES_BON_COMMANDE_VALIDATE,
        Permission.FINANCES_COMPTABILITE_VIEW,
        Permission.FINANCES_COMPTABILITE_VALIDER,
        Permission.FINANCES_TRESORERIE_VIEW,
        Permission.FINANCES_BUDGET_VIEW,
        Permission.FINANCES_BUDGET_CREATE,
        Permission.FINANCES_BUDGET_EDIT,
        Permission.FINANCES_DASHBOARD_VIEW,
        Permission.FINANCES_RAPPORTS_GENERER,
        // Programmes Pédagogiques
        Permission.PROGRAMMES_CHAPITRE_READ,
        Permission.PROGRAMMES_CHAPITRE_CREATE,
        Permission.PROGRAMMES_CHAPITRE_EDIT,
        Permission.PROGRAMMES_CHAPITRE_DELETE,
        Permission.PROGRAMMES_CHAPITRE_VALIDATE,
        Permission.PROGRAMMES_CORRELATION_READ,
        Permission.PROGRAMMES_CORRELATION_EVALUATE,
        Permission.PROGRAMMES_DASHBOARD_READ,
        // Emploi du Temps
        Permission.EMPLOI_DU_TEMPS_VIEW,
        Permission.EMPLOI_DU_TEMPS_CREATE,
        Permission.EMPLOI_DU_TEMPS_EDIT,
        Permission.EMPLOI_DU_TEMPS_DELETE,
        Permission.EMPLOI_DU_TEMPS_GENERER,
        Permission.EMPLOI_DU_TEMPS_EXPORT,
        Permission.EMPLOI_DU_TEMPS_REALISATION_CREATE,
        Permission.EMPLOI_DU_TEMPS_REALISATION_VALIDATE,
        Permission.EMPLOI_DU_TEMPS_PREFERENCES_MANAGE,
        Permission.EMPLOI_DU_TEMPS_TEMPLATES_MANAGE,
        Permission.EMPLOI_DU_TEMPS_VERIFIER_CONFLITS,
        Permission.EMPLOI_DU_TEMPS_ALL_VIEW,
        // Organisation
        Permission.ORGANISATION_VIEW,
        Permission.ORGANISATION_CREATE,
        Permission.ORGANISATION_EDIT,
        Permission.ORGANISATION_DELETE,
        // Organisation — permissions granulaires
        Permission.ORGANISATION_UNITES_READ,
        Permission.ORGANISATION_UNITES_WRITE,
        Permission.ORGANISATION_UNITES_DELETE,
        Permission.ORGANISATION_POSTES_READ,
        Permission.ORGANISATION_POSTES_WRITE,
        Permission.ORGANISATION_POSTES_DELETE,
        Permission.ORGANISATION_FONCTIONS_READ,
        Permission.ORGANISATION_FONCTIONS_WRITE,
        Permission.ORGANISATION_FONCTIONS_DELETE,
        Permission.ORGANISATION_HIERARCHIE_READ,
        Permission.ORGANISATION_HIERARCHIE_WRITE,
        Permission.ORGANISATION_HIERARCHIE_DELETE,
        Permission.ORGANISATION_NOMENCLATURES_READ,
        Permission.ORGANISATION_NOMENCLATURES_WRITE,
        Permission.ORGANISATION_NOMENCLATURES_DELETE,
        Permission.ORGANISATION_TEMPLATES_READ,
        Permission.ORGANISATION_TEMPLATES_WRITE,
        Permission.ORGANISATION_TEMPLATES_DELETE,
        Permission.ORGANISATION_GENERATION_EXECUTE,
        Permission.ORGANISATION_ORGANIGRAMME_READ,
        // Apparence
        Permission.APPARENCE_FONDS_VIEW,
        Permission.APPARENCE_FONDS_MANAGE,
        // Contrats (module autonome)
        Permission.CONTRATS_VIEW, Permission.CONTRATS_CREATE, Permission.CONTRATS_EDIT,
        Permission.CONTRATS_DELETE, Permission.CONTRATS_EXPORT,
        Permission.CONTRATS_CONFIG_VIEW, Permission.CONTRATS_CONFIG_CREATE,
        Permission.CONTRATS_CONFIG_EDIT, Permission.CONTRATS_CONFIG_DELETE,
        // Paie (module autonome)
        Permission.PAIE_VIEW, Permission.PAIE_CREATE, Permission.PAIE_EDIT,
        Permission.PAIE_DELETE, Permission.PAIE_GENERER, Permission.PAIE_VALIDER,
        Permission.PAIE_EXPORT,
        Permission.PAIE_CONFIG_VIEW, Permission.PAIE_CONFIG_CREATE,
        Permission.PAIE_CONFIG_EDIT, Permission.PAIE_CONFIG_DELETE,
        // Audit — tous les modules
        Permission.AUDIT_VIEW,
        Permission.AUDIT_NOTES_VIEW, Permission.AUDIT_BULLETINS_VIEW,
        Permission.AUDIT_PERSONNEL_VIEW, Permission.AUDIT_CONTRATS_VIEW,
        Permission.AUDIT_PAIE_VIEW, Permission.AUDIT_ELEVES_VIEW,
        Permission.AUDIT_CLASSES_VIEW, Permission.AUDIT_MATIERES_VIEW,
        Permission.AUDIT_PERIODES_VIEW, Permission.AUDIT_EMPLOI_DU_TEMPS_VIEW,
        Permission.AUDIT_ORGANISATION_VIEW,
        Permission.AUDIT_COMPETENCES_VIEW, Permission.AUDIT_DIPLOMES_ELEVES_VIEW,
        Permission.AUDIT_EXAMENS_NATIONAUX_VIEW, Permission.AUDIT_GROUPES_ETABLISSEMENTS_VIEW,
        Permission.AUDIT_APPARENCE_VIEW, Permission.AUDIT_FINANCES_VIEW,
        Permission.AUDIT_MESSAGERIE_VIEW, Permission.AUDIT_SONDAGES_VIEW,
        Permission.AUDIT_ORIENTATION_VIEW, Permission.AUDIT_REQUETES_VIEW,
        Permission.AUDIT_GAMIFICATION_VIEW, Permission.AUDIT_CARTES_VIEW,
        Permission.AUDIT_CLUBS_VIEW, Permission.AUDIT_MATERIEL_VIEW,
        Permission.AUDIT_CONFIGURATION_VIEW,
    ],

    [Role.COMPTABLE]: [
        Permission.FINANCES_SCOLARITE_VIEW,
        Permission.FINANCES_SCOLARITE_CONFIG,
        Permission.FINANCES_PAIEMENT_CREATE,
        Permission.FINANCES_PAIEMENT_VALIDATE,
        Permission.FINANCES_PAIEMENT_REFUND,
        Permission.FINANCES_RECU_GENERATE,
        Permission.FINANCES_RECU_DOWNLOAD,
        Permission.FINANCES_RELANCE_SEND,
        Permission.FINANCES_ETAT_COMPTE_VIEW,
        Permission.FINANCES_REMISE_GRANT,
        Permission.FINANCES_ECHEANCIER_GENERATE,
        Permission.FINANCES_DEPENSES_VIEW,
        Permission.FINANCES_DEPENSES_CREATE,
        Permission.FINANCES_DEPENSES_EDIT,
        Permission.FINANCES_DEPENSES_VALIDATE,
        Permission.FINANCES_DEPENSES_PAYER,
        Permission.FINANCES_DEPENSES_EXPORT,
        Permission.FINANCES_DEPENSES_RAPPORTS,
        Permission.FINANCES_DEMANDE_CREATE,
        Permission.FINANCES_DEMANDE_VALIDATE,
        Permission.FINANCES_DEMANDE_VIEW_ALL,
        Permission.FINANCES_BON_COMMANDE_CREATE,
        Permission.FINANCES_BON_COMMANDE_VALIDATE,
        Permission.FINANCES_FOURNISSEURS_VIEW,
        Permission.FINANCES_FOURNISSEURS_MANAGE,
        Permission.FINANCES_FACTURE_VALIDATE,
        Permission.FINANCES_COMPTABILITE_VIEW,
        Permission.FINANCES_COMPTABILITE_ECRIRE,
        Permission.FINANCES_COMPTABILITE_VALIDER,
        Permission.FINANCES_COMPTABILITE_BALANCE,
        Permission.FINANCES_COMPTABILITE_RAPPORT,
        Permission.FINANCES_COMPTABILITE_EXPORT,
        Permission.FINANCES_TRESORERIE_VIEW,
        Permission.FINANCES_TRESORERIE_MANAGE,
        Permission.FINANCES_CAISSE_ENTRER,
        Permission.FINANCES_CAISSE_SORTIR,
        Permission.FINANCES_BANQUE_VIRER,
        Permission.FINANCES_BUDGET_VIEW,
        Permission.FINANCES_BUDGET_CREATE,
        Permission.FINANCES_BUDGET_EDIT,
        Permission.FINANCES_BUDGET_ENGAGER,
        Permission.FINANCES_BUDGET_CONSOMMER,
        Permission.FINANCES_BUDGET_RAPPORTS,
        Permission.FINANCES_DASHBOARD_VIEW,
        Permission.FINANCES_DASHBOARD_EXPORT,
        Permission.FINANCES_DASHBOARD_KPI,
        Permission.FINANCES_RAPPORTS_GENERER,
        // Paie (module autonome) — opérationnel, ne valide pas
        Permission.PAIE_VIEW, Permission.PAIE_CREATE, Permission.PAIE_EDIT,
        Permission.PAIE_GENERER, Permission.PAIE_EXPORT,
        Permission.PAIE_CONFIG_VIEW,
        // Audit — accès global à tous les modules
        Permission.AUDIT_VIEW,
        Permission.AUDIT_NOTES_VIEW, Permission.AUDIT_BULLETINS_VIEW,
        Permission.AUDIT_PERSONNEL_VIEW, Permission.AUDIT_CONTRATS_VIEW,
        Permission.AUDIT_PAIE_VIEW, Permission.AUDIT_ELEVES_VIEW,
        Permission.AUDIT_CLASSES_VIEW, Permission.AUDIT_MATIERES_VIEW,
        Permission.AUDIT_PERIODES_VIEW, Permission.AUDIT_EMPLOI_DU_TEMPS_VIEW,
        Permission.AUDIT_ORGANISATION_VIEW,
        Permission.AUDIT_FINANCES_VIEW,
    ],

    [Role.CHEF_ETABLISSEMENT]: [
        Permission.USERS_VIEW, Permission.USERS_CREATE, Permission.USERS_EDIT, Permission.UTILISATEURS_DELETE, Permission.UTILISATEURS_STATUT_CHANGE,
        // Classes & Structure académique
        Permission.CLASSES_VIEW, Permission.CLASSES_CREATE, Permission.CLASSES_EDIT, Permission.CLASSES_DELETE,
        Permission.CLASSES_AFFECTER, Permission.CLASSES_DESAFFECTER, Permission.CLASSES_EFFECTIFS_VIEW, Permission.CLASSES_EXPORT,
        Permission.MATIERES_VIEW, Permission.MATIERES_EDIT, Permission.MATIERES_ASSIGN,
        Permission.CYCLES_VIEW, Permission.NIVEAUX_VIEW,
        Permission.ANNEES_VIEW,
        Permission.PERIODES_VIEW, Permission.PERIODES_CREATE, Permission.PERIODES_EDIT, Permission.PERIODES_DELETE,
        Permission.PERIODES_CLOTURER, Permission.PERIODES_REOUVRIR,
        Permission.PERIODES_COMPOSITIONS_VIEW, Permission.PERIODES_COMPOSITIONS_EDIT, Permission.PERIODES_TEMPLATES_GENERER,
        Permission.PERIODES_TEMPLATES_VIEW, Permission.PERIODES_TEMPLATES_CREATE, Permission.PERIODES_TEMPLATES_EDIT, Permission.PERIODES_TEMPLATES_DELETE,
        Permission.PERIODES_LABELS_VIEW, Permission.PERIODES_LABELS_EDIT,
        Permission.NIVEAUX_PERIODE_VIEW, Permission.NIVEAUX_PERIODE_CREATE, Permission.NIVEAUX_PERIODE_EDIT, Permission.NIVEAUX_PERIODE_DELETE,
        Permission.USAGES_NIVEAU_VIEW, Permission.USAGES_NIVEAU_CREATE, Permission.USAGES_NIVEAU_EDIT, Permission.USAGES_NIVEAU_DELETE,
        Permission.NOTES_VIEW, Permission.NOTES_VALIDATE,
        Permission.BULLETINS_VIEW, Permission.BULLETINS_GENERATE, Permission.BULLETINS_PRINT, Permission.BULLETINS_DELETE,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE, Permission.DOCUMENTS_PRINT,
        Permission.CONFIG_VIEW, Permission.CONFIG_MODULE_VIEW, Permission.CONFIG_PARAM_VIEW, Permission.CONFIG_HISTORY_VIEW,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        Permission.REQUETES_VIEW, Permission.REQUETES_APPROVE,
        // Validation permissions
        Permission.VALIDATION_NOTES_LEVEL2, Permission.VALIDATION_NOTES_LEVEL3,
        Permission.VALIDATION_BULLETINS_LEVEL2, Permission.VALIDATION_BULLETINS_LEVEL3,
        Permission.VALIDATION_CANTINE_LEVEL2, Permission.VALIDATION_CANTINE_LEVEL3,
        Permission.VALIDATION_TRANSPORT_LEVEL2, Permission.VALIDATION_TRANSPORT_LEVEL3,
        Permission.VALIDATION_DASHBOARD_VIEW, Permission.VALIDATION_RAPPORTS_VIEW,
        Permission.VALIDATION_CLASSES_LEVEL2, Permission.VALIDATION_CLASSES_LEVEL3,
        Permission.VALIDATION_MATIERES_LEVEL2, Permission.VALIDATION_MATIERES_LEVEL3,
        Permission.VALIDATION_PERIODES_LEVEL1, Permission.VALIDATION_PERIODES_LEVEL2,
        Permission.VALIDATION_ELEVES_LEVEL2, Permission.VALIDATION_ELEVES_LEVEL3,
        Permission.VALIDATION_PERSONNEL_LEVEL1, Permission.VALIDATION_PERSONNEL_LEVEL2,
        Permission.VALIDATION_CLUBS_LEVEL2, Permission.VALIDATION_CLUBS_LEVEL3,
        Permission.VALIDATION_MATERIEL_LEVEL1, Permission.VALIDATION_MATERIEL_LEVEL2,
        Permission.VALIDATION_CARTES_LEVEL1, Permission.VALIDATION_CARTES_LEVEL2,
        Permission.VALIDATION_ANNEES_SCOLAIRES_LEVEL1, Permission.VALIDATION_ANNEES_SCOLAIRES_LEVEL2,
        // Finances (18 permissions)
        Permission.FINANCES_SCOLARITE_VIEW,
        Permission.FINANCES_SCOLARITE_CONFIG,
        Permission.FINANCES_PAIEMENT_VALIDATE,
        Permission.FINANCES_PAIEMENT_REFUND,
        Permission.FINANCES_RECU_DOWNLOAD,
        Permission.FINANCES_ETAT_COMPTE_VIEW,
        Permission.FINANCES_DEPENSES_VIEW,
        Permission.FINANCES_DEPENSES_CREATE,
        Permission.FINANCES_DEPENSES_EDIT,
        Permission.FINANCES_DEPENSES_VALIDATE,
        Permission.FINANCES_DEPENSES_EXPORT,
        Permission.FINANCES_DEPENSES_RAPPORTS,
        Permission.FINANCES_DEMANDE_CREATE,
        Permission.FINANCES_DEMANDE_VALIDATE,
        Permission.FINANCES_DEMANDE_REJECT,
        Permission.FINANCES_DEMANDE_VIEW_ALL,
        Permission.FINANCES_BON_COMMANDE_VALIDATE,
        Permission.FINANCES_FOURNISSEURS_VIEW,
        Permission.FINANCES_FACTURE_VALIDATE,
        Permission.FINANCES_COMPTABILITE_VIEW,
        Permission.FINANCES_COMPTABILITE_VALIDER,
        Permission.FINANCES_COMPTABILITE_BALANCE,
        Permission.FINANCES_COMPTABILITE_RAPPORT,
        Permission.FINANCES_TRESORERIE_VIEW,
        Permission.FINANCES_CAISSE_SORTIR,
        Permission.FINANCES_BUDGET_VIEW,
        Permission.FINANCES_BUDGET_VALIDATE,
        Permission.FINANCES_BUDGET_RAPPORTS,
        Permission.FINANCES_DASHBOARD_VIEW,
        Permission.FINANCES_DASHBOARD_KPI,
        Permission.FINANCES_RAPPORTS_GENERER,
        // Groupes Établissements (9 permissions unifiées)
        Permission.GROUPES_ETABLISSEMENTS_VIEW,
        Permission.GROUPES_ETABLISSEMENTS_CREATE,
        Permission.GROUPES_ETABLISSEMENTS_EDIT,
        Permission.GROUPES_ETABLISSEMENTS_DELETE,
        Permission.GROUPES_ETABLISSEMENTS_MANAGE,
        Permission.GROUPES_ETABLISSEMENTS_DASHBOARD,
        Permission.GROUPES_ETABLISSEMENTS_MANAGE_ADMINS,
        Permission.GROUPES_ETABLISSEMENTS_MANAGE_ETABLISSEMENTS,
        Permission.GROUPES_ETABLISSEMENTS_RAPPORTS,
        // Programmes Pédagogiques
        Permission.PROGRAMMES_CHAPITRE_READ,
        Permission.PROGRAMMES_CHAPITRE_CREATE,
        Permission.PROGRAMMES_CHAPITRE_EDIT,
        Permission.PROGRAMMES_CHAPITRE_DELETE,
        Permission.PROGRAMMES_CHAPITRE_VALIDATE,
        Permission.PROGRAMMES_CORRELATION_READ,
        Permission.PROGRAMMES_CORRELATION_EVALUATE,
        Permission.PROGRAMMES_DASHBOARD_READ,
        // Emploi du Temps
        Permission.EMPLOI_DU_TEMPS_VIEW,
        Permission.EMPLOI_DU_TEMPS_CREATE,
        Permission.EMPLOI_DU_TEMPS_EDIT,
        Permission.EMPLOI_DU_TEMPS_DELETE,
        Permission.EMPLOI_DU_TEMPS_GENERER,
        Permission.EMPLOI_DU_TEMPS_EXPORT,
        Permission.EMPLOI_DU_TEMPS_REALISATION_CREATE,
        Permission.EMPLOI_DU_TEMPS_REALISATION_VALIDATE,
        Permission.EMPLOI_DU_TEMPS_PREFERENCES_MANAGE,
        Permission.EMPLOI_DU_TEMPS_TEMPLATES_MANAGE,
        Permission.EMPLOI_DU_TEMPS_VERIFIER_CONFLITS,
        Permission.EMPLOI_DU_TEMPS_ALL_VIEW,
        // Apparence
        Permission.APPARENCE_FONDS_VIEW,
        Permission.APPARENCE_FONDS_MANAGE,
        // Contrats (module autonome)
        Permission.CONTRATS_VIEW, Permission.CONTRATS_CREATE, Permission.CONTRATS_EDIT,
        Permission.CONTRATS_DELETE, Permission.CONTRATS_EXPORT,
        Permission.CONTRATS_CONFIG_VIEW, Permission.CONTRATS_CONFIG_CREATE,
        Permission.CONTRATS_CONFIG_EDIT, Permission.CONTRATS_CONFIG_DELETE,
        // Paie (module autonome)
        Permission.PAIE_VIEW, Permission.PAIE_CREATE, Permission.PAIE_EDIT,
        Permission.PAIE_DELETE, Permission.PAIE_GENERER, Permission.PAIE_VALIDER,
        Permission.PAIE_EXPORT,
        Permission.PAIE_CONFIG_VIEW, Permission.PAIE_CONFIG_CREATE,
        Permission.PAIE_CONFIG_EDIT, Permission.PAIE_CONFIG_DELETE,
        // Audit — 13 modules clés
        Permission.AUDIT_NOTES_VIEW, Permission.AUDIT_BULLETINS_VIEW,
        Permission.AUDIT_PERSONNEL_VIEW, Permission.AUDIT_ELEVES_VIEW,
        Permission.AUDIT_CLASSES_VIEW, Permission.AUDIT_ORGANISATION_VIEW,
        Permission.AUDIT_COMPETENCES_VIEW, Permission.AUDIT_EXAMENS_NATIONAUX_VIEW,
        Permission.AUDIT_DIPLOMES_ELEVES_VIEW, Permission.AUDIT_GROUPES_ETABLISSEMENTS_VIEW,
        Permission.AUDIT_APPARENCE_VIEW, Permission.AUDIT_FINANCES_VIEW,
        Permission.AUDIT_ORIENTATION_VIEW, Permission.AUDIT_REQUETES_VIEW,
        Permission.AUDIT_MATERIEL_VIEW, Permission.AUDIT_CARTES_VIEW,
        Permission.AUDIT_CLUBS_VIEW, Permission.AUDIT_SONDAGES_VIEW,
        Permission.AUDIT_GAMIFICATION_VIEW, Permission.AUDIT_CONFIGURATION_VIEW,
    ],

    [Role.ENSEIGNANT]: [
        // Classes & Structure académique
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_CREATE, Permission.NOTES_EDIT,
        Permission.BULLETINS_VIEW,
        Permission.CLUBS_VIEW, Permission.CLUBS_MANAGE,
        Permission.MESSAGES_SEND,
        Permission.GAMIFICATION_VIEW,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        // Validation permissions (niveau 1 seulement)
        Permission.VALIDATION_NOTES_LEVEL1,
        Permission.VALIDATION_BULLETINS_LEVEL1,
        Permission.VALIDATION_DASHBOARD_VIEW,
        Permission.VALIDATION_CLASSES_LEVEL1,
        Permission.VALIDATION_MATIERES_LEVEL1,
        Permission.VALIDATION_ELEVES_LEVEL1,
        // Programmes Pédagogiques (lecture + corrélation)
        Permission.PROGRAMMES_CHAPITRE_READ,
        Permission.PROGRAMMES_CORRELATION_READ,
        Permission.PROGRAMMES_DASHBOARD_READ,
        // Emploi du Temps (son propre EDT + déclaration réalisation)
        Permission.EMPLOI_DU_TEMPS_VIEW,
        Permission.EMPLOI_DU_TEMPS_REALISATION_CREATE,
    ],

    [Role.PERSONNEL]: [
        Permission.USERS_VIEW,
        Permission.DOCUMENTS_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.VALIDATION_ELEVES_LEVEL1,
        Permission.VALIDATION_MATERIEL_LEVEL1,
    ],

    [Role.RESPONSABLE_CANTINE]: [
        Permission.CANTINE_VIEW, Permission.CANTINE_MANAGE,
        Permission.MESSAGES_SEND,
        // Validation permissions
        Permission.VALIDATION_CANTINE_LEVEL2, Permission.VALIDATION_CANTINE_LEVEL3,
        Permission.VALIDATION_DASHBOARD_VIEW,
    ],

    [Role.RESPONSABLE_TRANSPORT]: [
        Permission.TRANSPORT_VIEW, Permission.TRANSPORT_MANAGE,
        Permission.MESSAGES_SEND,
        // Validation permissions
        Permission.VALIDATION_TRANSPORT_LEVEL2, Permission.VALIDATION_TRANSPORT_LEVEL3,
        Permission.VALIDATION_DASHBOARD_VIEW,
    ],

    [Role.RESPONSABLE_INFRASTRUCTURE]: [
        Permission.PARKING_VIEW, Permission.PARKING_MANAGE,
        Permission.PARKING_PLACES_VIEW, Permission.PARKING_PLACES_CREATE,
        Permission.PARKING_PLACES_EDIT, Permission.PARKING_PLACES_DELETE,
        Permission.PARKING_VEHICULES_VIEW, Permission.PARKING_VEHICULES_CREATE,
        Permission.PARKING_VEHICULES_EDIT, Permission.PARKING_VEHICULES_DELETE,
        Permission.PARKING_ABONNEMENTS_VIEW, Permission.PARKING_ABONNEMENTS_CREATE,
        Permission.PARKING_ABONNEMENTS_EDIT,
        Permission.PARKING_STATISTIQUES_VIEW,
        Permission.MESSAGES_SEND,
    ],

    [Role.PARENT]: [
        Permission.NOTES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.CANTINE_VIEW,
        Permission.TRANSPORT_VIEW,
        Permission.MESSAGES_SEND,
        Permission.GAMIFICATION_VIEW,
    ],

    [Role.ELEVE]: [
        Permission.NOTES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.CLUBS_VIEW,
        Permission.GAMIFICATION_VIEW,
    ],

    // ==================================
    // DIRECTION D'ÉTABLISSEMENT
    // ==================================

    [Role.PROVISEUR]: [
        // Permissions CHEF_ETABLISSEMENT (héritage)
        Permission.USERS_VIEW, Permission.USERS_CREATE, Permission.USERS_EDIT, Permission.UTILISATEURS_STATUT_CHANGE,
        // Classes & Structure académique
        Permission.CLASSES_VIEW, Permission.CLASSES_CREATE, Permission.CLASSES_EDIT, Permission.CLASSES_DELETE,
        Permission.CLASSES_AFFECTER, Permission.CLASSES_DESAFFECTER, Permission.CLASSES_EFFECTIFS_VIEW,
        Permission.MATIERES_VIEW, Permission.MATIERES_EDIT,
        Permission.CYCLES_VIEW, Permission.NIVEAUX_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_VALIDATE,
        Permission.BULLETINS_VIEW, Permission.BULLETINS_GENERATE, Permission.BULLETINS_PRINT, Permission.BULLETINS_DELETE,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE, Permission.DOCUMENTS_PRINT,
        Permission.CONFIG_VIEW, Permission.CONFIG_MODULE_VIEW, Permission.CONFIG_PARAM_VIEW, Permission.CONFIG_HISTORY_VIEW,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        Permission.REQUETES_VIEW, Permission.REQUETES_APPROVE,
        // Validation niveaux 2-3
        Permission.VALIDATION_NOTES_LEVEL2, Permission.VALIDATION_NOTES_LEVEL3,
        Permission.VALIDATION_BULLETINS_LEVEL2, Permission.VALIDATION_BULLETINS_LEVEL3,
        Permission.VALIDATION_DASHBOARD_VIEW, Permission.VALIDATION_RAPPORTS_VIEW,
        Permission.VALIDATION_CLASSES_LEVEL2, Permission.VALIDATION_CLASSES_LEVEL3,
        Permission.VALIDATION_ELEVES_LEVEL2, Permission.VALIDATION_ELEVES_LEVEL3,
        Permission.VALIDATION_PERSONNEL_LEVEL2,
        // Finances (lecture + validation)
        Permission.FINANCES_SCOLARITE_VIEW,
        Permission.FINANCES_PAIEMENT_VALIDATE,
        Permission.FINANCES_DEPENSES_VIEW, Permission.FINANCES_DEPENSES_VALIDATE,
        Permission.FINANCES_COMPTABILITE_VIEW, Permission.FINANCES_COMPTABILITE_VALIDER,
        Permission.FINANCES_BUDGET_VIEW, Permission.FINANCES_BUDGET_VALIDATE,
        Permission.FINANCES_DASHBOARD_VIEW, Permission.FINANCES_RAPPORTS_GENERER,
        // Programmes Pédagogiques
        Permission.PROGRAMMES_CHAPITRE_READ, Permission.PROGRAMMES_CHAPITRE_VALIDATE,
        Permission.PROGRAMMES_CORRELATION_READ, Permission.PROGRAMMES_CORRELATION_EVALUATE,
        Permission.PROGRAMMES_DASHBOARD_READ,
        // Emploi du Temps
        Permission.EMPLOI_DU_TEMPS_VIEW,
        Permission.EMPLOI_DU_TEMPS_CREATE,
        Permission.EMPLOI_DU_TEMPS_EDIT,
        Permission.EMPLOI_DU_TEMPS_DELETE,
        Permission.EMPLOI_DU_TEMPS_GENERER,
        Permission.EMPLOI_DU_TEMPS_EXPORT,
        Permission.EMPLOI_DU_TEMPS_REALISATION_CREATE,
        Permission.EMPLOI_DU_TEMPS_REALISATION_VALIDATE,
        Permission.EMPLOI_DU_TEMPS_PREFERENCES_MANAGE,
        Permission.EMPLOI_DU_TEMPS_TEMPLATES_MANAGE,
        Permission.EMPLOI_DU_TEMPS_VERIFIER_CONFLITS,
        Permission.EMPLOI_DU_TEMPS_ALL_VIEW,
    ],

    [Role.PRINCIPAL]: [
        // Similaire à PROVISEUR (collège au lieu de lycée)
        Permission.USERS_VIEW, Permission.USERS_CREATE, Permission.USERS_EDIT, Permission.UTILISATEURS_STATUT_CHANGE,
        // Classes & Structure académique
        Permission.CLASSES_VIEW, Permission.CLASSES_CREATE, Permission.CLASSES_EDIT, Permission.CLASSES_DELETE,
        Permission.CLASSES_AFFECTER, Permission.CLASSES_DESAFFECTER, Permission.CLASSES_EFFECTIFS_VIEW,
        Permission.MATIERES_VIEW, Permission.MATIERES_EDIT,
        Permission.CYCLES_VIEW, Permission.NIVEAUX_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_VALIDATE,
        Permission.BULLETINS_VIEW, Permission.BULLETINS_GENERATE, Permission.BULLETINS_PRINT, Permission.BULLETINS_DELETE,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE, Permission.DOCUMENTS_PRINT,
        Permission.CONFIG_VIEW, Permission.CONFIG_MODULE_VIEW, Permission.CONFIG_PARAM_VIEW, Permission.CONFIG_HISTORY_VIEW,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        Permission.REQUETES_VIEW, Permission.REQUETES_APPROVE,
        Permission.VALIDATION_NOTES_LEVEL2, Permission.VALIDATION_NOTES_LEVEL3,
        Permission.VALIDATION_BULLETINS_LEVEL2, Permission.VALIDATION_BULLETINS_LEVEL3,
        Permission.VALIDATION_DASHBOARD_VIEW, Permission.VALIDATION_RAPPORTS_VIEW,
        Permission.VALIDATION_CLASSES_LEVEL2, Permission.VALIDATION_CLASSES_LEVEL3,
        Permission.VALIDATION_ELEVES_LEVEL2, Permission.VALIDATION_ELEVES_LEVEL3,
        Permission.FINANCES_SCOLARITE_VIEW,
        Permission.FINANCES_PAIEMENT_VALIDATE,
        Permission.FINANCES_DEPENSES_VIEW, Permission.FINANCES_DEPENSES_VALIDATE,
        Permission.FINANCES_DASHBOARD_VIEW,
        Permission.PROGRAMMES_CHAPITRE_READ, Permission.PROGRAMMES_CHAPITRE_VALIDATE,
        Permission.PROGRAMMES_DASHBOARD_READ,
        // Emploi du Temps
        Permission.EMPLOI_DU_TEMPS_VIEW,
        Permission.EMPLOI_DU_TEMPS_CREATE,
        Permission.EMPLOI_DU_TEMPS_EDIT,
        Permission.EMPLOI_DU_TEMPS_DELETE,
        Permission.EMPLOI_DU_TEMPS_GENERER,
        Permission.EMPLOI_DU_TEMPS_EXPORT,
        Permission.EMPLOI_DU_TEMPS_REALISATION_CREATE,
        Permission.EMPLOI_DU_TEMPS_REALISATION_VALIDATE,
        Permission.EMPLOI_DU_TEMPS_VERIFIER_CONFLITS,
        Permission.EMPLOI_DU_TEMPS_ALL_VIEW,
    ],

    [Role.DIRECTEUR]: [
        // École primaire - permissions simplifiées
        Permission.USERS_VIEW, Permission.USERS_CREATE, Permission.UTILISATEURS_STATUT_CHANGE,
        // Classes & Structure académique
        Permission.CLASSES_VIEW, Permission.CLASSES_CREATE, Permission.CLASSES_EDIT, Permission.CLASSES_DELETE,
        Permission.CLASSES_AFFECTER, Permission.CLASSES_DESAFFECTER, Permission.CLASSES_EFFECTIFS_VIEW,
        Permission.MATIERES_VIEW, Permission.MATIERES_EDIT,
        Permission.CYCLES_VIEW, Permission.NIVEAUX_VIEW,
        Permission.NOTES_VIEW,
        Permission.BULLETINS_VIEW, Permission.BULLETINS_GENERATE, Permission.BULLETINS_DELETE,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE,
        Permission.CONFIG_VIEW, Permission.CONFIG_MODULE_VIEW, Permission.CONFIG_PARAM_VIEW, Permission.CONFIG_HISTORY_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_APPROVE,
        Permission.VALIDATION_NOTES_LEVEL2,
        Permission.VALIDATION_BULLETINS_LEVEL2,
        Permission.VALIDATION_DASHBOARD_VIEW,
        Permission.FINANCES_SCOLARITE_VIEW,
        Permission.FINANCES_PAIEMENT_VALIDATE,
        Permission.FINANCES_DASHBOARD_VIEW,
        // Groupes Établissements (9 permissions unifiées)
        Permission.GROUPES_ETABLISSEMENTS_VIEW,
        Permission.GROUPES_ETABLISSEMENTS_CREATE,
        Permission.GROUPES_ETABLISSEMENTS_EDIT,
        Permission.GROUPES_ETABLISSEMENTS_DELETE,
        Permission.GROUPES_ETABLISSEMENTS_MANAGE,
        Permission.GROUPES_ETABLISSEMENTS_DASHBOARD,
        Permission.GROUPES_ETABLISSEMENTS_MANAGE_ADMINS,
        Permission.GROUPES_ETABLISSEMENTS_MANAGE_ETABLISSEMENTS,
        Permission.GROUPES_ETABLISSEMENTS_RAPPORTS,
        // Emploi du Temps
        Permission.EMPLOI_DU_TEMPS_VIEW,
        Permission.EMPLOI_DU_TEMPS_CREATE,
        Permission.EMPLOI_DU_TEMPS_EDIT,
        Permission.EMPLOI_DU_TEMPS_DELETE,
        Permission.EMPLOI_DU_TEMPS_EXPORT,
        Permission.EMPLOI_DU_TEMPS_REALISATION_CREATE,
        Permission.EMPLOI_DU_TEMPS_REALISATION_VALIDATE,
        Permission.EMPLOI_DU_TEMPS_ALL_VIEW,
    ],

    [Role.CENSEUR]: [
        // Discipline & organisation
        Permission.USERS_VIEW,
        Permission.ELEVES_VIEW, Permission.ELEVES_CREATE, Permission.ELEVES_EDIT,
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.DOCUMENTS_VIEW,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        Permission.REQUETES_VIEW, Permission.REQUETES_APPROVE,
        // Sanctions & discipline
        Permission.VALIDATION_ELEVES_LEVEL2,
        Permission.VALIDATION_CLUBS_LEVEL2,
        // Finances (lecture seule)
        Permission.FINANCES_SCOLARITE_VIEW,
        Permission.FINANCES_DASHBOARD_VIEW,
        // Emploi du Temps
        Permission.EMPLOI_DU_TEMPS_VIEW,
        Permission.EMPLOI_DU_TEMPS_CREATE,
        Permission.EMPLOI_DU_TEMPS_EDIT,
        Permission.EMPLOI_DU_TEMPS_DELETE,
        Permission.EMPLOI_DU_TEMPS_EXPORT,
        Permission.EMPLOI_DU_TEMPS_REALISATION_CREATE,
        Permission.EMPLOI_DU_TEMPS_REALISATION_VALIDATE,
        Permission.EMPLOI_DU_TEMPS_VERIFIER_CONFLITS,
        Permission.EMPLOI_DU_TEMPS_ALL_VIEW,
        // Organisation — lecture (rôle intermédiaire « discipline & organisation »)
        Permission.ORGANISATION_VIEW,
        Permission.ORGANISATION_UNITES_READ,
        Permission.ORGANISATION_POSTES_READ,
        Permission.ORGANISATION_FONCTIONS_READ,
        Permission.ORGANISATION_HIERARCHIE_READ,
    ],

    [Role.DIRECTEUR_ADJOINT]: [
        // Similaire à CHEF_ETABLISSEMENT mais en lecture pour finances
        Permission.USERS_VIEW, Permission.USERS_CREATE, Permission.USERS_EDIT,
        // Classes & Structure académique
        Permission.CLASSES_VIEW, Permission.CLASSES_CREATE, Permission.CLASSES_EDIT,
        Permission.CLASSES_AFFECTER, Permission.CLASSES_DESAFFECTER, Permission.CLASSES_EFFECTIFS_VIEW,
        Permission.MATIERES_VIEW, Permission.MATIERES_EDIT,
        Permission.CYCLES_VIEW, Permission.NIVEAUX_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_VALIDATE,
        Permission.BULLETINS_VIEW, Permission.BULLETINS_GENERATE, Permission.BULLETINS_DELETE,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_APPROVE,
        Permission.VALIDATION_NOTES_LEVEL2,
        Permission.VALIDATION_BULLETINS_LEVEL2,
        Permission.VALIDATION_CLASSES_LEVEL2,
        Permission.VALIDATION_ELEVES_LEVEL2,
        Permission.FINANCES_SCOLARITE_VIEW,
        Permission.FINANCES_DASHBOARD_VIEW,
        Permission.PROGRAMMES_CHAPITRE_READ,
        Permission.PROGRAMMES_DASHBOARD_READ,
        // Audit — 4 modules pédagogiques
        Permission.AUDIT_NOTES_VIEW, Permission.AUDIT_BULLETINS_VIEW,
        Permission.AUDIT_ELEVES_VIEW, Permission.AUDIT_CLASSES_VIEW,
    ],

    [Role.RESPONSABLE_PEDAGOGIQUE]: [
        // Conseil pédagogique
        Permission.USERS_VIEW,
        // Classes & Structure académique
        Permission.CLASSES_VIEW, Permission.CLASSES_CREATE, Permission.CLASSES_EDIT,
        Permission.CLASSES_AFFECTER, Permission.CLASSES_DESAFFECTER, Permission.CLASSES_EFFECTIFS_VIEW,
        Permission.MATIERES_VIEW, Permission.MATIERES_EDIT,
        Permission.CYCLES_VIEW, Permission.NIVEAUX_VIEW,
        Permission.NOTES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.MESSAGES_SEND,
        // Programmes Pédagogiques (complet)
        Permission.PROGRAMMES_CHAPITRE_READ, Permission.PROGRAMMES_CHAPITRE_CREATE,
        Permission.PROGRAMMES_CHAPITRE_EDIT, Permission.PROGRAMMES_CHAPITRE_VALIDATE,
        Permission.PROGRAMMES_CORRELATION_READ, Permission.PROGRAMMES_CORRELATION_EVALUATE,
        Permission.PROGRAMMES_DASHBOARD_READ,
        // Validation
        Permission.VALIDATION_NOTES_LEVEL2,
        Permission.VALIDATION_BULLETINS_LEVEL2,
        Permission.VALIDATION_MATIERES_LEVEL2,
        Permission.VALIDATION_PERIODES_LEVEL2,
        Permission.VALIDATION_DASHBOARD_VIEW,
    ],

    // ==================================
    // ENSEIGNANTS SPÉCIALISÉS
    // ==================================

    [Role.PROFESSEUR_CERTIFIE]: [
        // Hérite ENSEIGNANT + programmes
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_CREATE, Permission.NOTES_EDIT,
        Permission.BULLETINS_VIEW,
        Permission.CLUBS_VIEW, Permission.CLUBS_MANAGE,
        Permission.MESSAGES_SEND,
        Permission.GAMIFICATION_VIEW,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.VALIDATION_NOTES_LEVEL1,
        Permission.VALIDATION_DASHBOARD_VIEW,
        Permission.PROGRAMMES_CHAPITRE_READ, Permission.PROGRAMMES_CHAPITRE_CREATE,
        Permission.PROGRAMMES_CHAPITRE_EDIT,
        Permission.PROGRAMMES_CORRELATION_READ,
        Permission.PROGRAMMES_DASHBOARD_READ,
    ],

    [Role.PROFESSEUR_AGREGE]: [
        // Similaire à PROFESSEUR_CERTIFIE (lycée)
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_CREATE, Permission.NOTES_EDIT,
        Permission.BULLETINS_VIEW,
        Permission.CLUBS_VIEW, Permission.CLUBS_MANAGE,
        Permission.MESSAGES_SEND,
        Permission.GAMIFICATION_VIEW,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.VALIDATION_NOTES_LEVEL1,
        Permission.VALIDATION_DASHBOARD_VIEW,
        Permission.PROGRAMMES_CHAPITRE_READ, Permission.PROGRAMMES_CHAPITRE_CREATE,
        Permission.PROGRAMMES_CHAPITRE_EDIT, Permission.PROGRAMMES_CHAPITRE_VALIDATE,
        Permission.PROGRAMMES_CORRELATION_READ, Permission.PROGRAMMES_CORRELATION_EVALUATE,
        Permission.PROGRAMMES_DASHBOARD_READ,
    ],

    [Role.INSTITUTEUR]: [
        // Primaire - simplifié
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_CREATE, Permission.NOTES_EDIT,
        Permission.BULLETINS_VIEW,
        Permission.MESSAGES_SEND,
        Permission.GAMIFICATION_VIEW,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.VALIDATION_NOTES_LEVEL1,
        Permission.VALIDATION_DASHBOARD_VIEW,
    ],

    [Role.MAITRE_AUXILIAIRE]: [
        // Contractuel - permissions limitées
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_CREATE,
        Permission.BULLETINS_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
    ],

    [Role.PROFESSEUR_TECHNIQUE]: [
        // Enseignement technique
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_CREATE, Permission.NOTES_EDIT,
        Permission.BULLETINS_VIEW,
        Permission.CLUBS_VIEW, Permission.CLUBS_MANAGE,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.VALIDATION_NOTES_LEVEL1,
        Permission.VALIDATION_DASHBOARD_VIEW,
        Permission.PROGRAMMES_CHAPITRE_READ, Permission.PROGRAMMES_CHAPITRE_CREATE,
        Permission.PROGRAMMES_CORRELATION_READ,
        Permission.PROGRAMMES_DASHBOARD_READ,
        // Matériel technique
        Permission.MATERIEL_VIEW, Permission.MATERIEL_PRETS_CREATE,
    ],

    [Role.EDUCATEUR_MATERNELLE]: [
        // Maternelle - très simplifié
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_CREATE,
        Permission.MESSAGES_SEND,
        Permission.GAMIFICATION_VIEW,
        Permission.REQUETES_VIEW,
    ],

    [Role.PROFESSEUR_PRINCIPAL]: [
        // Responsable de classe - vision complète de SA classe
        Permission.NOTES_VIEW, Permission.NOTES_CREATE, Permission.NOTES_EDIT,
        Permission.BULLETINS_VIEW, Permission.BULLETINS_GENERATE, Permission.BULLETINS_DELETE,
        Permission.CLASSES_VIEW,
        Permission.ELEVES_VIEW,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.VALIDATION_NOTES_LEVEL1,
        Permission.VALIDATION_BULLETINS_LEVEL1,
        Permission.VALIDATION_DASHBOARD_VIEW,
        Permission.PROGRAMMES_CHAPITRE_READ,
        Permission.PROGRAMMES_DASHBOARD_READ,
        // Finances (lecture pour sa classe)
        Permission.FINANCES_SCOLARITE_VIEW,
        Permission.FINANCES_DASHBOARD_VIEW,
    ],

    [Role.COORDINATEUR_DISCIPLINE]: [
        // Coordinateur matière/département
        Permission.NOTES_VIEW, Permission.NOTES_EDIT, Permission.NOTES_VALIDATE,
        Permission.BULLETINS_VIEW,
        Permission.MATIERES_VIEW, Permission.MATIERES_EDIT,
        Permission.CLASSES_VIEW,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        Permission.VALIDATION_NOTES_LEVEL2,
        Permission.VALIDATION_BULLETINS_LEVEL2,
        Permission.VALIDATION_MATIERES_LEVEL2,
        Permission.VALIDATION_DASHBOARD_VIEW,
        Permission.PROGRAMMES_CHAPITRE_READ, Permission.PROGRAMMES_CHAPITRE_EDIT,
        Permission.PROGRAMMES_CHAPITRE_VALIDATE,
        Permission.PROGRAMMES_CORRELATION_READ, Permission.PROGRAMMES_CORRELATION_EVALUATE,
        Permission.PROGRAMMES_DASHBOARD_READ,
        // Organisation — lecture (rôle intermédiaire « chef de département »)
        Permission.ORGANISATION_VIEW,
        Permission.ORGANISATION_UNITES_READ,
        Permission.ORGANISATION_POSTES_READ,
        Permission.ORGANISATION_FONCTIONS_READ,
        Permission.ORGANISATION_HIERARCHIE_READ,
    ],

    // ==================================
    // ORIENTATION & CONSEIL
    // ==================================

    [Role.CONSEILLER_ORIENTEUR]: [
        // Orientation scolaire
        Permission.CLASSES_VIEW,
        Permission.ELEVES_VIEW,
        Permission.NOTES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        // Orientation (module dédié)
        Permission.ORIENTATION_PROFILS_VIEW, Permission.ORIENTATION_PROFILS_CREATE,
        Permission.ORIENTATION_PROFILS_EDIT,
        Permission.ORIENTATION_SUGGESTIONS_VIEW,
        Permission.ORIENTATION_FICHES_VIEW, Permission.ORIENTATION_FICHES_CREATE,
        Permission.ORIENTATION_RDV_VIEW, Permission.ORIENTATION_RDV_CREATE,
        Permission.ORIENTATION_RDV_EDIT,
        // Statistiques
        Permission.VALIDATION_DASHBOARD_VIEW,
        Permission.FINANCES_DASHBOARD_VIEW,
    ],

    [Role.PSYCHOLOGUE_SCOLAIRE]: [
        // Psychologue
        Permission.CLASSES_VIEW,
        Permission.ELEVES_VIEW,
        Permission.NOTES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
        // Orientation (lecture + fiches)
        Permission.ORIENTATION_PROFILS_VIEW,
        Permission.ORIENTATION_SUGGESTIONS_VIEW,
        Permission.ORIENTATION_FICHES_VIEW, Permission.ORIENTATION_FICHES_CREATE,
        Permission.ORIENTATION_RDV_VIEW, Permission.ORIENTATION_RDV_CREATE,
        Permission.ORIENTATION_RDV_EDIT,
    ],

    [Role.ASSISTANT_SOCIAL]: [
        // Assistant social
        Permission.CLASSES_VIEW,
        Permission.ELEVES_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.ORIENTATION_PROFILS_VIEW,
        Permission.ORIENTATION_RDV_VIEW, Permission.ORIENTATION_RDV_CREATE,
        // Aide sociale (via requêtes)
        Permission.FINANCES_SCOLARITE_VIEW,
        Permission.FINANCES_REMISE_GRANT,
    ],

    // ==================================
    // PERSONNEL ADMINISTRATIF
    // ==================================

    [Role.SECRETAIRE_DIRECTION]: [
        // Secrétaire
        Permission.USERS_VIEW, Permission.USERS_CREATE,
        Permission.ELEVES_VIEW, Permission.ELEVES_CREATE, Permission.ELEVES_EDIT,
        // Classes & Structure académique
        Permission.CLASSES_VIEW, Permission.CLASSES_CREATE, Permission.CLASSES_EDIT,
        Permission.CLASSES_AFFECTER, Permission.CLASSES_DESAFFECTER, Permission.CLASSES_EFFECTIFS_VIEW,
        Permission.MATIERES_VIEW,
        Permission.CYCLES_VIEW, Permission.NIVEAUX_VIEW,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE, Permission.DOCUMENTS_PRINT,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        // Inscriptions
        Permission.VALIDATION_ELEVES_LEVEL1,
        // Finances (lecture + encaissement)
        Permission.FINANCES_SCOLARITE_VIEW,
        Permission.FINANCES_PAIEMENT_CREATE,
        Permission.FINANCES_RECU_GENERATE,
        Permission.FINANCES_DASHBOARD_VIEW,
        // Emploi du Temps
        Permission.EMPLOI_DU_TEMPS_VIEW,
        Permission.EMPLOI_DU_TEMPS_CREATE,
        Permission.EMPLOI_DU_TEMPS_EDIT,
        Permission.EMPLOI_DU_TEMPS_DELETE,
        Permission.EMPLOI_DU_TEMPS_EXPORT,
        Permission.EMPLOI_DU_TEMPS_REALISATION_CREATE,
        Permission.EMPLOI_DU_TEMPS_ALL_VIEW,
    ],

    [Role.GESTIONNAIRE]: [
        // Gestionnaire matériel/logistique
        Permission.MATERIEL_VIEW, Permission.MATERIEL_CREATE, Permission.MATERIEL_EDIT,
        Permission.MATERIEL_PRETS_VIEW, Permission.MATERIEL_PRETS_CREATE,
        Permission.MATERIEL_PRETS_RETOUR, Permission.MATERIEL_INVENTAIRE_MANAGE,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        // Finances (dépenses)
        Permission.FINANCES_DEPENSES_VIEW, Permission.FINANCES_DEPENSES_CREATE,
        Permission.FINANCES_DEPENSES_EXPORT,
        Permission.FINANCES_FOURNISSEURS_VIEW,
    ],

    [Role.BIBLIOTHECAIRE]: [
        // Bibliothèque
        Permission.MATERIEL_VIEW, // Livres = matériel
        Permission.MATERIEL_PRETS_VIEW, Permission.MATERIEL_PRETS_CREATE,
        Permission.MATERIEL_PRETS_RETOUR,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
    ],

    [Role.DOCUMENTALISTE]: [
        // Documentation (similaire à bibliothécaire)
        Permission.MATERIEL_VIEW,
        Permission.MATERIEL_PRETS_VIEW, Permission.MATERIEL_PRETS_CREATE,
        Permission.MATERIEL_PRETS_RETOUR,
        Permission.DOCUMENTS_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
    ],

    [Role.ARCHIVISTE]: [
        // Archives
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE,
        Permission.ELEVES_VIEW, // Archives élèves
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
    ],

    // ==================================
    // PERSONNEL TECHNIQUE
    // ==================================

    [Role.TECHNICIEN_LABO]: [
        // Technicien laboratoire
        Permission.MATERIEL_VIEW, Permission.MATERIEL_PRETS_CREATE,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        // Accès salles/labos
        Permission.CLASSES_VIEW,
    ],

    [Role.TECHNICIEN_INFO]: [
        // Technicien informatique
        Permission.USERS_VIEW,
        Permission.CONFIG_VIEW,
        Permission.MONITORING_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        // Matériel informatique
        Permission.MATERIEL_VIEW, Permission.MATERIEL_CREATE, Permission.MATERIEL_EDIT,
    ],

    [Role.CONSEILLER_TIC]: [
        // Conseiller TIC pédagogique
        Permission.USERS_VIEW,
        Permission.NOTES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
        Permission.PROGRAMMES_CHAPITRE_READ,
        Permission.PROGRAMMES_DASHBOARD_READ,
        // Matériel TIC
        Permission.MATERIEL_VIEW,
    ],

    [Role.AIDE_EDUCATEUR]: [
        // Assistant pédagogique
        Permission.NOTES_VIEW,
        Permission.ELEVES_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
        Permission.CLUBS_VIEW,
    ],

    // ==================================
    // SURVEILLANCE & VIE SCOLAIRE
    // ==================================

    [Role.SURVEILLANT_GENERAL]: [
        // Responsable surveillance
        Permission.ELEVES_VIEW,
        Permission.CLASSES_VIEW,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        Permission.REQUETES_VIEW, Permission.REQUETES_APPROVE,
        // Sanctions
        Permission.VALIDATION_ELEVES_LEVEL2,
        Permission.VALIDATION_CLUBS_LEVEL2,
        // Retards/absences (via cantine/transport)
        Permission.CANTINE_VIEW,
        Permission.TRANSPORT_VIEW,
    ],

    [Role.SURVEILLANT]: [
        // Surveillant
        Permission.ELEVES_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.CANTINE_VIEW,
        Permission.TRANSPORT_VIEW,
        Permission.EMPLOI_DU_TEMPS_VIEW,
    ],

    // ==================================
    // ENSEIGNANTS SPÉCIALISÉS (manquants)
    // ==================================

    [Role.PROFESSEUR_SPECIAL]: [
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_CREATE, Permission.NOTES_EDIT,
        Permission.BULLETINS_VIEW,
        Permission.MESSAGES_SEND,
        Permission.GAMIFICATION_VIEW,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.VALIDATION_NOTES_LEVEL1,
        Permission.VALIDATION_DASHBOARD_VIEW,
    ],

    [Role.PROFESSEUR_LANGUES]: [
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_CREATE, Permission.NOTES_EDIT,
        Permission.BULLETINS_VIEW,
        Permission.CLUBS_VIEW,
        Permission.MESSAGES_SEND,
        Permission.GAMIFICATION_VIEW,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.VALIDATION_NOTES_LEVEL1,
        Permission.VALIDATION_DASHBOARD_VIEW,
    ],

    // ==================================
    // SANTÉ & BIEN-ÊTRE (manquants)
    // ==================================

    [Role.MEDECIN_SCOLAIRE]: [
        Permission.SANTE_VIEW,
        Permission.ELEVES_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.DOCUMENTS_VIEW,
    ],

    [Role.INFIRMIER_SCOLAIRE]: [
        Permission.SANTE_VIEW,
        Permission.ELEVES_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.DOCUMENTS_VIEW,
    ],

    [Role.NUTRITIONNISTE]: [
        Permission.CANTINE_VIEW, Permission.CANTINE_MANAGE,
        Permission.CANTINE_MENUS_CREATE, Permission.CANTINE_MENUS_EDIT,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
    ],

    [Role.KINESITHERAPEUTE]: [
        Permission.SANTE_VIEW,
        Permission.ELEVES_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
    ],

    // ==================================
    // CANTINE & LOGISTIQUE (manquants)
    // ==================================

    [Role.CUISINIER]: [
        Permission.CANTINE_VIEW,
        Permission.CANTINE_MENUS_VIEW,
        Permission.MESSAGES_SEND,
    ],

    [Role.CHAUFFEUR]: [
        Permission.TRANSPORT_VIEW,
        Permission.TRANSPORT_LIGNES_VIEW,
        Permission.TRANSPORT_PRESENCES_ENREGISTRER,
        Permission.MESSAGES_SEND,
    ],

    [Role.AGENT_ENTRETIEN]: [
        Permission.MATERIEL_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
    ],

    // ==================================
    // CLUBS & ACTIVITÉS (manquants)
    // ==================================

    [Role.COORDINATEUR_CLUBS]: [
        Permission.CLUBS_VIEW, Permission.CLUBS_MANAGE,
        Permission.CLUBS_CREATE, Permission.CLUBS_EDIT, Permission.CLUBS_DELETE,
        Permission.CLUBS_INSCRIPTIONS_MANAGE,
        Permission.CLUBS_EVENEMENTS_VIEW, Permission.CLUBS_EVENEMENTS_CREATE,
        Permission.CLUBS_EVENEMENTS_EDIT, Permission.CLUBS_EVENEMENTS_DELETE,
        Permission.GAMIFICATION_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
    ],

    [Role.ENTRAINEUR_SPORTIF]: [
        Permission.CLUBS_VIEW, Permission.CLUBS_MANAGE,
        Permission.CLUBS_EVENEMENTS_VIEW, Permission.CLUBS_EVENEMENTS_CREATE,
        Permission.GAMIFICATION_VIEW,
        Permission.GAMIFICATION_CLASSEMENT_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
    ],

    [Role.ANIMATEUR_CULTUREL]: [
        Permission.CLUBS_VIEW,
        Permission.CLUBS_EVENEMENTS_VIEW, Permission.CLUBS_EVENEMENTS_CREATE,
        Permission.CLUBS_EVENEMENTS_EDIT,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
    ],

    // ==================================
    // SPÉCIALISÉ (manquants)
    // ==================================

    [Role.COORDINATEUR_EXAMEN]: [
        Permission.USERS_VIEW,
        Permission.ELEVES_VIEW,
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_VALIDATE,
        Permission.BULLETINS_VIEW, Permission.BULLETINS_GENERATE, Permission.BULLETINS_PRINT, Permission.BULLETINS_DELETE,
        Permission.BULLETINS_EXPORT,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE, Permission.DOCUMENTS_PRINT,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        Permission.REQUETES_VIEW, Permission.REQUETES_APPROVE,
        Permission.VALIDATION_DASHBOARD_VIEW,
    ],

    [Role.RESPONSABLE_BOURSES]: [
        Permission.USERS_VIEW,
        Permission.ELEVES_VIEW,
        Permission.FINANCES_SCOLARITE_VIEW,
        Permission.FINANCES_ETAT_COMPTE_VIEW,
        Permission.FINANCES_REMISE_GRANT,
        Permission.FINANCES_DASHBOARD_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
    ],

    [Role.AUDITEUR_INTERNE]: [
        Permission.USERS_VIEW,
        Permission.ROLES_VIEW,
        Permission.CONFIG_VIEW, Permission.CONFIG_MODULE_VIEW,
        Permission.FINANCES_DASHBOARD_VIEW, Permission.FINANCES_RAPPORTS_GENERER,
        Permission.FINANCES_COMPTABILITE_VIEW, Permission.FINANCES_COMPTABILITE_BALANCE,
        Permission.FINANCES_COMPTABILITE_RAPPORT,
        Permission.FINANCES_BUDGET_VIEW, Permission.FINANCES_BUDGET_RAPPORTS,
        Permission.MONITORING_VIEW,
        Permission.ELEVES_VIEW,
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_STATISTIQUES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.DOCUMENTS_VIEW,
        Permission.VALIDATION_DASHBOARD_VIEW, Permission.VALIDATION_RAPPORTS_VIEW,
    ],

    [Role.STATISTICIEN]: [
        Permission.ELEVES_VIEW,
        Permission.CLASSES_VIEW, Permission.CLASSES_EFFECTIFS_VIEW,
        Permission.NOTES_VIEW, Permission.NOTES_STATISTIQUES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.FINANCES_DASHBOARD_VIEW, Permission.FINANCES_DASHBOARD_KPI,
        Permission.FINANCES_RAPPORTS_GENERER,
        Permission.MONITORING_VIEW, Permission.MONITORING_STATS_VIEW,
        Permission.MONITORING_METRICS_VIEW,
        Permission.VALIDATION_DASHBOARD_VIEW, Permission.VALIDATION_RAPPORTS_VIEW,
        Permission.VALIDATION_RAPPORTS_EXPORT,
        Permission.MESSAGES_SEND,
    ],

    [Role.CHARGE_COMMUNICATION]: [
        Permission.NOTIFICATIONS_VIEW, Permission.NOTIFICATIONS_MANAGE,
        Permission.NOTIFICATIONS_ENVOYER, Permission.NOTIFICATIONS_CREATE,
        Permission.NOTIFICATIONS_BULK_CREATE,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        Permission.MESSAGERIE_VIEW,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE,
        Permission.APPARENCE_FONDS_VIEW,
        Permission.SONDAGES_CREATE, Permission.SONDAGES_VOTE, Permission.SONDAGES_ANALYZE,
        Permission.REQUETES_VIEW,
    ],

    // ==================================
    // PERSONNEL ADMINISTRATIF (manquants)
    // ==================================

    [Role.ACCUEIL_STANDARD]: [
        Permission.USERS_VIEW,
        Permission.ELEVES_VIEW,
        Permission.DOCUMENTS_VIEW, Permission.DOCUMENTS_CREATE, Permission.DOCUMENTS_PRINT,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
        Permission.NOTIFICATIONS_VIEW,
    ],

    // ==================================
    // PERSONNEL TECHNIQUE (manquants)
    // ==================================

    [Role.ANIMATEUR_TICE]: [
        Permission.USERS_VIEW,
        Permission.NOTES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.MATERIEL_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
        Permission.PROGRAMMES_CHAPITRE_READ,
        Permission.PROGRAMMES_DASHBOARD_READ,
    ],

    // ==================================
    // SURVEILLANCE & VIE SCOLAIRE (manquants)
    // ==================================

    [Role.MAITRE_INTERNAT]: [
        // Responsable internat
        Permission.ELEVES_VIEW,
        Permission.CLASSES_VIEW,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        Permission.REQUETES_VIEW, Permission.REQUETES_APPROVE,
        Permission.CANTINE_VIEW,
        Permission.TRANSPORT_VIEW,
        Permission.VALIDATION_ELEVES_LEVEL2,
    ],

    [Role.CONSEILLER_VIE_SCOLAIRE]: [
        // CPE
        Permission.ELEVES_VIEW, Permission.ELEVES_EDIT,
        Permission.CLASSES_VIEW,
        Permission.NOTES_VIEW,
        Permission.BULLETINS_VIEW,
        Permission.MESSAGES_SEND, Permission.MESSAGES_BROADCAST,
        Permission.REQUETES_VIEW, Permission.REQUETES_APPROVE,
        Permission.CANTINE_VIEW,
        Permission.TRANSPORT_VIEW,
        Permission.CLUBS_VIEW,
        Permission.VALIDATION_ELEVES_LEVEL2,
        Permission.VALIDATION_CLUBS_LEVEL2,
        Permission.VALIDATION_DASHBOARD_VIEW,
        Permission.DOCUMENTS_VIEW,
    ],

    // ==================================
    // PERSONNEL RH & PAIE (3 nouveaux rôles)
    // ==================================

    [Role.RH]: [
        // Contrats (module autonome) — intégral
        Permission.CONTRATS_VIEW, Permission.CONTRATS_CREATE, Permission.CONTRATS_EDIT,
        Permission.CONTRATS_DELETE, Permission.CONTRATS_EXPORT,
        Permission.CONTRATS_CONFIG_VIEW, Permission.CONTRATS_CONFIG_CREATE,
        Permission.CONTRATS_CONFIG_EDIT, Permission.CONTRATS_CONFIG_DELETE,
        // Paie — lecture seule (voir salaires des membres)
        Permission.PAIE_VIEW,
        // Personnel
        Permission.PERSONNEL_VIEW, Permission.PERSONNEL_CREATE, Permission.PERSONNEL_EDIT,
        Permission.PERSONNEL_DELETE,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
    ],

    [Role.GESTIONNAIRE_PAIE]: [
        // Paie (module autonome) — complet sauf validation (4 yeux)
        Permission.PAIE_VIEW, Permission.PAIE_CREATE, Permission.PAIE_EDIT,
        Permission.PAIE_DELETE, Permission.PAIE_GENERER, Permission.PAIE_EXPORT,
        Permission.PAIE_CONFIG_VIEW, Permission.PAIE_CONFIG_CREATE,
        Permission.PAIE_CONFIG_EDIT, Permission.PAIE_CONFIG_DELETE,
        // Lecture personnel (pour contexte)
        Permission.PERSONNEL_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW, Permission.REQUETES_CREATE,
    ],

    [Role.VALIDATEUR_PAIE]: [
        // Paie (module autonome) — validation uniquement
        Permission.PAIE_VIEW, Permission.PAIE_VALIDER, Permission.PAIE_EXPORT,
        // Lecture personnel (pour contexte)
        Permission.PERSONNEL_VIEW,
        Permission.MESSAGES_SEND,
        Permission.REQUETES_VIEW,
    ],
};

// L'organigramme est consultable par toute la communauté scolaire (enseignants,
// élèves, parents, personnel…) sans donner accès au reste du module organisation.
for (const permissions of Object.values(DEFAULT_ROLE_PERMISSIONS)) {
    if (permissions && !permissions.includes(Permission.ORGANISATION_ORGANIGRAMME_READ)) {
        permissions.push(Permission.ORGANISATION_ORGANIGRAMME_READ);
    }
}

export default { Role, Permission, DEFAULT_ROLE_PERMISSIONS };
