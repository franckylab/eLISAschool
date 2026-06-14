-- ==================================
-- eLISAschool - Suppression des paramètres dupliqués
-- ==================================
-- Les informations établissement (nom, type, email, etc.) sont déjà
-- dans la table 'etablissements'. Elles ne doivent PAS être dupliquées
-- dans 'parametres_systeme'.
--
-- Source de vérité : Table ETABLISSEMENTS uniquement
-- ParamètreSysteme : Uniquement pour la configuration applicative

-- Paramètres à supprimer (dupliqués de la table etablissements)
DELETE FROM parametres_systeme 
WHERE cle IN (
    'app.nom_etablissement',
    'app.type_etablissement',
    'app.message_accueil',
    'app.email',
    'app.telephone',
    'app.adresse',
    'app.code_etablissement'
);

-- Vérification
SELECT COUNT(*) as remaining 
FROM parametres_systeme 
WHERE cle LIKE 'app.%' 
AND cle NOT IN (
    'app.langue_defaut',
    'app.devise',
    'app.fuseau_horaire',
    'app.format_date',
    'app.theme',
    'app.nom_etablissement',
    'app.type_etablissement',
    'app.message_accueil',
    'app.email',
    'app.telephone',
    'app.adresse',
    'app.code_etablissement'
);
