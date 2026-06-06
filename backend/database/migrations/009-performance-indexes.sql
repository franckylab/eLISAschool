-- ==================================
-- eLISAschool - Script d'Optimisation des Index
-- ==================================
-- Version: 1.0.0
-- Date: 6 juin 2026
-- 
-- Ce script crée des index stratégiques pour optimiser
-- les performances des requêtes de pagination et de filtrage.
-- 
-- Impact estimé : 50-80% d'amélioration sur les temps de requête
-- ==================================

-- ============================================
-- INDEX POUR LE MODULE ÉLÈVES
-- ============================================

-- Index sur le matricule (recherche fréquente)
CREATE INDEX IF NOT EXISTS idx_eleves_matricule 
ON eleves(matricule);

-- Index sur l'établissement (multi-tenancy)
CREATE INDEX IF NOT EXISTS idx_eleves_etablissement_id 
ON eleves(etablissementId);

-- Index sur le statut (filtrage fréquent)
CREATE INDEX IF NOT EXISTS idx_eleves_statut 
ON eleves(statut);

-- Index sur le sous-système
CREATE INDEX IF NOT EXISTS idx_eleves_sous_systeme 
ON eleves(sousSysteme);

-- Index composite pour les recherches courantes
CREATE INDEX IF NOT EXISTS idx_eleves_etablissement_statut 
ON eleves(etablissementId, statut);

-- Index sur la date d'inscription (tri fréquent)
CREATE INDEX IF NOT EXISTS idx_eleves_date_inscription 
ON eleves(dateInscription DESC);

-- ============================================
-- INDEX POUR LE MODULE UTILISATEURS
-- ============================================

-- Index sur l'email (recherche et authentification)
CREATE UNIQUE INDEX IF NOT EXISTS idx_utilisateurs_email 
ON utilisateurs(email);

-- Index sur le rôle (filtrage fréquent)
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role 
ON utilisateurs(role);

-- Index sur le statut
CREATE INDEX IF NOT EXISTS idx_utilisateurs_statut 
ON utilisateurs(statut);

-- Index sur l'établissement
CREATE INDEX IF NOT EXISTS idx_utilisateurs_etablissement_id 
ON utilisateurs(etablissementId);

-- Index sur le matricule
CREATE INDEX IF NOT EXISTS idx_utilisateurs_matricule 
ON utilisateurs(matricule);

-- Index composite pour les listes
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role_statut 
ON utilisateurs(role, statut);

-- Index sur la date de création (tri par défaut)
CREATE INDEX IF NOT EXISTS idx_utilisateurs_created_at 
ON utilisateurs("createdAt" DESC);

-- ============================================
-- INDEX POUR LE MODULE NOTES
-- ============================================

-- Index sur l'élève (recherche fréquente)
CREATE INDEX IF NOT EXISTS idx_notes_eleve_id 
ON notes(eleveId);

-- Index sur la matière
CREATE INDEX IF NOT EXISTS idx_notes_matiere_id 
ON notes(matiereId);

-- Index sur la classe
CREATE INDEX IF NOT EXISTS idx_notes_classe_id 
ON notes(classeId);

-- Index sur la période
CREATE INDEX IF NOT EXISTS idx_notes_periode_id 
ON notes(periodeId);

-- Index sur l'année scolaire
CREATE INDEX IF NOT EXISTS idx_notes_annee_scolaire_id 
ON notes(anneeScolaireId);

-- Index composite pour les calculs de moyennes
CREATE INDEX IF NOT EXISTS idx_notes_eleve_matiere_periode 
ON notes(eleveId, matiereId, periodeId);

-- Index sur le type d'évaluation
CREATE INDEX IF NOT EXISTS idx_notes_type_evaluation 
ON notes(typeEvaluation);

-- Index sur le statut
CREATE INDEX IF NOT EXISTS idx_notes_statut 
ON notes(statut);

-- ============================================
-- INDEX POUR LE MODULE MESSAGERIE
-- ============================================

-- Index sur la conversation (recherche de messages)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON messages(conversationId);

-- Index sur l'expéditeur
CREATE INDEX IF NOT EXISTS idx_messages_expediteur_id 
ON messages(expediteurId);

-- Index sur la date de création (tri par défaut)
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON messages("createdAt" DESC);

-- Index composite pour les conversations
CREATE INDEX IF NOT EXISTS idx_messages_conversation_date 
ON messages(conversationId, "createdAt" DESC);

-- Index sur le statut (supprimé ou non)
CREATE INDEX IF NOT EXISTS idx_messages_supprime 
ON messages(supprime);

-- ============================================
-- INDEX POUR LE MODULE NOTIFICATIONS
-- ============================================

-- Index sur le destinataire (recherche fréquente)
CREATE INDEX IF NOT EXISTS idx_notifications_destinataire_id 
ON notifications(destinataireId);

-- Index sur le statut (filtrage non-lues)
CREATE INDEX IF NOT EXISTS idx_notifications_statut 
ON notifications(statut);

-- Index sur le type
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(type);

-- Index sur la catégorie
CREATE INDEX IF NOT EXISTS idx_notifications_categorie 
ON notifications(categorie);

-- Index sur la date de création
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications("createdAt" DESC);

-- Index composite pour les notifications non-lues
CREATE INDEX IF NOT EXISTS idx_notifications_destinataire_statut 
ON notifications(destinataireId, statut);

-- ============================================
-- INDEX POUR LE MODULE REQUÊTES
-- ============================================

-- Index sur le demandeur
CREATE INDEX IF NOT EXISTS idx_requetes_demandeur_id 
ON requetes(demandeurId);

-- Index sur le type
CREATE INDEX IF NOT EXISTS idx_requetes_type 
ON requetes(type);

-- Index sur le statut (filtrage fréquent)
CREATE INDEX IF NOT EXISTS idx_requetes_statut 
ON requetes(statut);

-- Index sur l'établissement
CREATE INDEX IF NOT EXISTS idx_requetes_etablissement_id 
ON requetes(etablissementId);

-- Index sur la date de création
CREATE INDEX IF NOT EXISTS idx_requetes_created_at 
ON requetes("createdAt" DESC);

-- Index composite
CREATE INDEX IF NOT EXISTS idx_requetes_demandeur_statut 
ON requetes(demandeurId, statut);

-- ============================================
-- INDEX POUR LE MODULE MATIÈRES
-- ============================================

-- Index sur le groupe
CREATE INDEX IF NOT EXISTS idx_matieres_groupe_id 
ON matieres(groupeId);

-- Index sur le statut actif
CREATE INDEX IF NOT EXISTS idx_matieres_actif 
ON matieres(actif);

-- Index sur le nom (tri alphabétique)
CREATE INDEX IF NOT EXISTS idx_matieres_nom 
ON matieres(nom);

-- ============================================
-- INDEX POUR LE MODULE CLASSES
-- ============================================

-- Index sur le niveau
CREATE INDEX IF NOT EXISTS idx_classes_niveau_id 
ON classes(niveauId);

-- Index sur l'année scolaire
CREATE INDEX IF NOT EXISTS idx_classes_annee_scolaire_id 
ON classes(anneeScolaireId);

-- Index sur l'établissement
CREATE INDEX IF NOT EXISTS idx_classes_etablissement_id 
ON classes(etablissementId);

-- Index composite
CREATE INDEX IF NOT EXISTS idx_classes_niveau_annee 
ON classes(niveauId, anneeScolaireId);

-- ============================================
-- INDEX POUR LE MODULE BULLETINS
-- ============================================

-- Index sur l'élève
CREATE INDEX IF NOT EXISTS idx_bulletins_eleve_id 
ON bulletins(eleveId);

-- Index sur la classe
CREATE INDEX IF NOT EXISTS idx_bulletins_classe_id 
ON bulletins(classeId);

-- Index sur la période
CREATE INDEX IF NOT EXISTS idx_bulletins_periode_id 
ON bulletins(periodeId);

-- Index sur l'année scolaire
CREATE INDEX IF NOT EXISTS idx_bulletins_annee_scolaire_id 
ON bulletins(anneeScolaireId);

-- Index sur le statut publié
CREATE INDEX IF NOT EXISTS idx_bulletins_publie 
ON bulletins(publie);

-- Index composite
CREATE INDEX IF NOT EXISTS idx_bulletins_eleve_periode 
ON bulletins(eleveId, periodeId);

-- ============================================
-- INDEX POUR LE MODULE CANTINE
-- ============================================

-- Index sur la date du menu
CREATE INDEX IF NOT EXISTS idx_menus_date 
ON menus(date);

-- Index sur le type de repas
CREATE INDEX IF NOT EXISTS idx_menus_type_repas 
ON menus("typeRepas");

-- ============================================
-- INDEX POUR LE MODULE AUDIT
-- ============================================

-- Index sur l'utilisateur (recherche fréquente)
CREATE INDEX IF NOT EXISTS idx_audit_utilisateur_id 
ON audit_logs(utilisateurId);

-- Index sur l'action
CREATE INDEX IF NOT EXISTS idx_audit_action 
ON audit_logs(action);

-- Index sur le module
CREATE INDEX IF NOT EXISTS idx_audit_module 
ON audit_logs(module);

-- Index sur la date de création
CREATE INDEX IF NOT EXISTS idx_audit_created_at 
ON audit_logs("createdAt" DESC);

-- Index sur la sévérité
CREATE INDEX IF NOT EXISTS idx_audit_severity 
ON audit_logs(severity);

-- Index composite pour les filtres courants
CREATE INDEX IF NOT EXISTS idx_audit_utilisateur_date 
ON audit_logs(utilisateurId, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_audit_module_date 
ON audit_logs(module, "createdAt" DESC);

-- ============================================
-- INDEX POUR LE MODULE CONFIGURATION
-- ============================================

-- Index sur la clé du paramètre
CREATE UNIQUE INDEX IF NOT EXISTS idx_parametres_cle 
ON parametres_systeme(cle);

-- Index sur la catégorie
CREATE INDEX IF NOT EXISTS idx_parametres_categorie 
ON parametres_systeme(categorie);

-- Index sur le module
CREATE INDEX IF NOT EXISTS idx_parametres_module 
ON parametres_systeme(module);

-- Index sur l'établissement
CREATE INDEX IF NOT EXISTS idx_parametres_etablissement_id 
ON parametres_systeme(etablissementId);

-- ============================================
-- INDEX POUR LE MODULE RBAC
-- ============================================

-- Index sur le nom du rôle
CREATE INDEX IF NOT EXISTS idx_roles_nom 
ON roles(nom);

-- Index sur l'établissement
CREATE INDEX IF NOT EXISTS idx_roles_etablissement_id 
ON roles(etablissementId);

-- Index sur le module de permission
CREATE INDEX IF NOT EXISTS idx_permissions_module 
ON permissions(module);

-- Index sur le rôle de l'utilisateur
CREATE INDEX IF NOT EXISTS idx_utilisateur_roles_utilisateur_id 
ON utilisateur_roles(utilisateurId);

-- Index sur le rôle
CREATE INDEX IF NOT EXISTS idx_utilisateur_roles_role_id 
ON utilisateur_roles(roleId);

-- ============================================
-- INDEX POUR LE MODULE CARTES SCOLAIRES
-- ============================================

-- Index sur le type
CREATE INDEX IF NOT EXISTS idx_cartes_type 
ON cartes_scolaires(type);

-- Index sur le statut
CREATE INDEX IF NOT EXISTS idx_cartes_statut 
ON cartes_scolaires(statut);

-- Index sur l'établissement
CREATE INDEX IF NOT EXISTS idx_cartes_etablissement_id 
ON cartes_scolaires(etablissementId);

-- Index sur l'utilisateur
CREATE INDEX IF NOT EXISTS idx_cartes_utilisateur_id 
ON cartes_scolaires(utilisateurId);

-- ============================================
-- INDEX POUR LE MODULE MATÉRIEL
-- ============================================

-- Index sur la catégorie
CREATE INDEX IF NOT EXISTS idx_materiel_categorie 
ON materiel(categorie);

-- Index sur la disponibilité
CREATE INDEX IF NOT EXISTS idx_materiel_disponible 
ON materiel(disponible);

-- Index sur l'établissement
CREATE INDEX IF NOT EXISTS idx_materiel_etablissement_id 
ON materiel(etablissementId);

-- ============================================
-- VÉRIFICATION DES INDEX CRÉÉS
-- ============================================

-- Afficher tous les index créés
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Statistiques sur les index
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- ============================================
-- NOTES DE PERFORMANCE
-- ============================================

-- Pour maintenir les index :
-- REINDEX TABLE eleves;
-- REINDEX DATABASE elisaschool;

-- Pour analyser l'utilisation des index :
-- EXPLAIN ANALYZE SELECT * FROM eleves WHERE etablissementId = 'xxx' AND statut = 'ACTIF';

-- Pour vérifier les index manquants :
-- SELECT * FROM pg_stat_user_tables WHERE idx_scan = 0 AND seq_scan > 0;

-- Recommandations :
-- 1. Exécuter ce script pendant les heures creuses
-- 2. Monitorer l'espace disque (les index prennent ~20-30% de la taille des données)
-- 3. Exécuter ANALYZE après la création des index
-- 4. Tester les performances avant/après avec EXPLAIN ANALYZE

-- Analyser les tables pour mettre à jour les statistiques
ANALYZE eleves;
ANALYZE utilisateurs;
ANALYZE notes;
ANALYZE messages;
ANALYZE notifications;
ANALYZE requetes;
ANALYZE matieres;
ANALYZE classes;
ANALYZE bulletins;
ANALYZE audit_logs;
