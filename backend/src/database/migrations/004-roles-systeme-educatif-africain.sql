-- ==================================
-- eLISAschool - Migration Rôles Système Éducatif Africain v3.0
-- ==================================
-- Cette migration ajoute 58 nouveaux rôles pour couvrir :
-- - Système éducatif camerounais (francophone + anglophone)
-- - Systèmes sous-régionaux (Afrique Centrale & Ouest)
-- Total : 67 rôles

-- ÉTAPE 1 : Insérer les nouveaux rôles avec leurs limitations
INSERT INTO role_limitations_etablissements (
    role, 
    max_etablissements, 
    peut_changer, 
    necessite_validation,
    description
) VALUES
    -- ADMINISTRATION NATIONALE/RÉGIONALE (7 rôles)
    ('MINISTRE', 999, true, false, 'Ministre de l''Éducation - accès national'),
    ('SECRETAIRE_GENERAL', 999, true, false, 'Secrétaire Général du Ministère'),
    ('INSPECTEUR_GENERAL', 100, true, false, 'Inspecteur Général - contrôle national'),
    ('DIRECTEUR_REGIONAL', 50, true, false, 'Délégué Régional de l''Éducation'),
    ('DELEGUE_DEPARTEMENTAL', 30, true, false, 'Délégué Départemental'),
    ('INSPECTEUR_PEDAGOGIQUE', 40, true, false, 'Inspecteur Pédagogique / IA-IPR'),
    ('INSPECTEUR_NATIONAL', 100, true, false, 'Inspecteur National'),

    -- DIRECTION D'ÉTABLISSEMENT (6 rôles)
    ('PROVISEUR', 1, false, false, 'Chef d''établissement lycée - mono-établissement'),
    ('PRINCIPAL', 1, false, false, 'Chef d''établissement collège - mono-établissement'),
    ('DIRECTEUR', 1, false, false, 'Chef d''école primaire - mono-établissement'),
    ('CENSEUR', 1, false, false, 'Responsable discipline lycée - mono-établissement'),
    ('DIRECTEUR_ADJOINT', 2, true, false, 'Chef d''établissement adjoint'),
    ('RESPONSABLE_PEDAGOGIQUE', 3, true, false, 'Conseiller pédagogique interne'),

    -- ENSEIGNANTS (10 rôles)
    ('PROFESSEUR_CERTIFIE', 5, true, false, 'Enseignant secondaire certifié'),
    ('PROFESSEUR_AGREGE', 3, true, false, 'Enseignant lycée agrégé'),
    ('INSTITUTEUR', 3, true, false, 'Enseignant primaire'),
    ('MAITRE_AUXILIAIRE', 5, true, false, 'Enseignant contractuel/vacataire'),
    ('PROFESSEUR_TECHNIQUE', 4, true, false, 'Enseignant technique/professionnel'),
    ('EDUCATEUR_MATERNELLE', 3, true, false, 'Enseignant maternelle'),
    ('PROFESSEUR_PRINCIPAL', 3, true, false, 'Professeur principal (responsable classe)'),
    ('COORDINATEUR_DISCIPLINE', 5, true, false, 'Coordinateur matière/département'),
    ('PROFESSEUR_SPECIAL', 5, true, false, 'Enseignant éducation spécialisée'),
    ('PROFESSEUR_LANGUES', 5, true, false, 'Professeur langues étrangères'),

    -- ORIENTATION & CONSEIL (4 rôles)
    ('CONSEILLER_ORIENTEUR', 5, true, false, 'Conseiller orientation scolaire'),
    ('PSYCHOLOGUE_SCOLAIRE', 8, true, false, 'Psychologue de l''éducation'),
    ('ASSISTANT_SOCIAL', 8, true, false, 'Assistant social scolaire'),
    ('MEDECIN_SCOLAIRE', 10, true, false, 'Médecin de l''Éducation nationale'),

    -- PERSONNEL ADMINISTRATIF (7 rôles)
    ('SECRETAIRE_DIRECTION', 2, true, false, 'Secrétaire de direction'),
    ('COMPTABLE', 3, true, false, 'Agent comptable'),
    ('GESTIONNAIRE', 3, true, false, 'Gestionnaire matériel/logistique'),
    ('BIBLIOTHECAIRE', 3, true, false, 'Responsable bibliothèque'),
    ('DOCUMENTALISTE', 3, true, false, 'Responsable documentation'),
    ('ARCHIVISTE', 3, true, false, 'Responsable archives'),
    ('ACCUEIL_STANDARD', 2, true, false, 'Agent d''accueil'),

    -- PERSONNEL TECHNIQUE (5 rôles)
    ('TECHNICIEN_LABO', 3, true, false, 'Technicien laboratoire'),
    ('TECHNICIEN_INFO', 5, true, false, 'Technicien informatique'),
    ('CONSEILLER_TIC', 8, true, false, 'Conseiller TIC pédagogique'),
    ('AIDE_EDUCATEUR', 5, true, false, 'Assistant pédagogique'),
    ('ANIMATEUR_TICE', 5, true, false, 'Animateur TICE'),

    -- SURVEILLANCE & INTERNAT (4 rôles)
    ('SURVEILLANT_GENERAL', 1, false, false, 'Responsable surveillance - mono-établissement'),
    ('SURVEILLANT', 2, true, false, 'Maître d''internat/surveillant'),
    ('MAITRE_INTERNAT', 1, false, false, 'Responsable internat - mono-établissement'),
    ('CONSEILLER_VIE_SCOLAIRE', 2, true, false, 'Conseiller Principal d''Éducation (CPE)'),

    -- SANTÉ & BIEN-ÊTRE (3 rôles)
    ('INFIRMIER_SCOLAIRE', 5, true, false, 'Infirmier de l''établissement'),
    ('NUTRITIONNISTE', 5, true, true, 'Nutritionniste cantine - nécessite validation'),
    ('KINESITHERAPEUTE', 8, true, false, 'Kinésithérapeute scolaire'),

    -- CANTINE & LOGISTIQUE (3 rôles)
    ('CUISINIER', 2, true, true, 'Personnel cuisine - nécessite validation'),
    ('CHAUFFEUR', 3, true, true, 'Chauffeur bus scolaire - nécessite validation'),
    ('AGENT_ENTRETIEN', 3, true, false, 'Personnel maintenance'),

    -- CLUBS & ACTIVITÉS (3 rôles)
    ('COORDINATEUR_CLUBS', 3, true, false, 'Coordinateur activités parascolaires'),
    ('ENTRAINEUR_SPORTIF', 5, true, false, 'Coach sport'),
    ('ANIMATEUR_CULTUREL', 5, true, false, 'Animateur culturel'),

    -- SPÉCIALISÉ (5 rôles)
    ('COORDINATEUR_EXAMEN', 20, true, false, 'Responsable examens nationaux'),
    ('RESPONSABLE_BOURSES', 50, true, false, 'Gestionnaire bourses'),
    ('AUDITEUR_INTERNE', 100, true, false, 'Audit interne MINEDUC'),
    ('STATISTICIEN', 50, true, false, 'Statisticien éducation'),
    ('CHARGE_COMMUNICATION', 30, true, false, 'Communication institutionnelle')

ON CONFLICT (role) DO NOTHING;

-- ÉTAPE 2 : Mettre à jour les descriptions des rôles existants
UPDATE role_limitations_etablissements 
SET description = 'Super administrateur - accès total à tout le système'
WHERE role = 'SUPER_ADMIN' AND description IS NULL;

UPDATE role_limitations_etablissements 
SET description = 'Administrateur de l''établissement'
WHERE role = 'ADMIN' AND description IS NULL;

UPDATE role_limitations_etablissements 
SET description = 'Chef d''établissement (générique)'
WHERE role = 'CHEF_ETABLISSEMENT' AND description IS NULL;

UPDATE role_limitations_etablissements 
SET description = 'Enseignant (générique)'
WHERE role = 'ENSEIGNANT' AND description IS NULL;

UPDATE role_limitations_etablissements 
SET description = 'Personnel non-enseignant (générique)'
WHERE role = 'PERSONNEL' AND description IS NULL;

UPDATE role_limitations_etablissements 
SET description = 'Responsable cantine'
WHERE role = 'RESPONSABLE_CANTINE' AND description IS NULL;

UPDATE role_limitations_etablissements 
SET description = 'Responsable transport'
WHERE role = 'RESPONSABLE_TRANSPORT' AND description IS NULL;

UPDATE role_limitations_etablissements 
SET description = 'Parent d''élève'
WHERE role = 'PARENT' AND description IS NULL;

UPDATE role_limitations_etablissements 
SET description = 'Élève - mono-établissement'
WHERE role = 'ELEVE' AND description IS NULL;

-- ÉTAPE 3 : Vérification - Afficher TOUS les rôles
SELECT 
    role,
    max_etablissements,
    peut_changer,
    necessite_validation,
    description
FROM role_limitations_etablissements
ORDER BY 
    CASE 
        WHEN max_etablissements >= 100 THEN 1  -- National
        WHEN max_etablissements >= 50 THEN 2   -- Régional
        WHEN max_etablissements >= 20 THEN 3   -- Départemental
        WHEN max_etablissements >= 10 THEN 4   -- Multi-sites
        WHEN max_etablissements >= 5 THEN 5    -- Multi limité
        WHEN max_etablissements >= 2 THEN 6    —- Bi-établissement
        WHEN max_etablissements = 1 THEN 7     —- Mono-établissement
        ELSE 8
    END,
    max_etablissements DESC;

-- ÉTAPE 4 : Statistiques par catégorie
SELECT 
    CASE 
        WHEN max_etablissements >= 100 THEN 'NATIONAL (100+)'
        WHEN max_etablissements >= 50 THEN 'RÉGIONAL (50-99)'
        WHEN max_etablissements >= 20 THEN 'DÉPARTEMENTAL (20-49)'
        WHEN max_etablissements >= 10 THEN 'MULTI-SITES (10-19)'
        WHEN max_etablissements >= 5 THEN 'MULTI-LIMITÉ (5-9)'
        WHEN max_etablissements >= 2 THEN 'BI-ÉTABLISSEMENT (2-4)'
        WHEN max_etablissements = 1 THEN 'MONO-ÉTABLISSEMENT (1)'
        ELSE 'AUTRE'
    END AS categorie,
    COUNT(*) AS nombre_roles,
    STRING_AGG(role, ', ') AS roles
FROM role_limitations_etablissements
GROUP BY 
    CASE 
        WHEN max_etablissements >= 100 THEN 'NATIONAL (100+)'
        WHEN max_etablissements >= 50 THEN 'RÉGIONAL (50-99)'
        WHEN max_etablissements >= 20 THEN 'DÉPARTEMENTAL (20-49)'
        WHEN max_etablissements >= 10 THEN 'MULTI-SITES (10-19)'
        WHEN max_etablissements >= 5 THEN 'MULTI-LIMITÉ (5-9)'
        WHEN max_etablissements >= 2 THEN 'BI-ÉTABLISSEMENT (2-4)'
        WHEN max_etablissements = 1 THEN 'MONO-ÉTABLISSEMENT (1)'
        ELSE 'AUTRE'
    END
ORDER BY nombre_roles DESC;

-- COMMENTAIRES :
-- ==============
-- Cette migration couvre les systèmes éducatifs de :
-- ✅ Cameroun (francophone + anglophone)
-- ✅ Gabon, Congo, Tchad, RCA (Afrique Centrale)
-- ✅ Sénégal, Côte d'Ivoire, Mali, Burkina (Afrique de l'Ouest)
-- ✅ Nigeria, Ghana (anglophones)
--
-- Les rôles avec necessite_validation=true nécessitent l'approbation d'un SUPER_ADMIN
-- avant l'affectation à un établissement.
--
-- ROLLBACK :
-- ==========
-- DELETE FROM role_limitations_etablissements 
-- WHERE role IN (
--     'MINISTRE', 'SECRETAIRE_GENERAL', 'INSPECTEUR_GENERAL', 
--     'DIRECTEUR_REGIONAL', 'DELEGUE_DEPARTEMENTAL', 'INSPECTEUR_PEDAGOGIQUE',
--     'INSPECTEUR_NATIONAL', 'PROVISEUR', 'PRINCIPAL', 'DIRECTEUR',
--     'CENSEUR', 'DIRECTEUR_ADJOINT', 'RESPONSABLE_PEDAGOGIQUE',
--     'PROFESSEUR_CERTIFIE', 'PROFESSEUR_AGREGE', 'INSTITUTEUR',
--     'MAITRE_AUXILIAIRE', 'PROFESSEUR_TECHNIQUE', 'EDUCATEUR_MATERNELLE',
--     'PROFESSEUR_PRINCIPAL', 'COORDINATEUR_DISCIPLINE', 'PROFESSEUR_SPECIAL',
--     'PROFESSEUR_LANGUES', 'CONSEILLER_ORIENTEUR', 'PSYCHOLOGUE_SCOLAIRE',
--     'ASSISTANT_SOCIAL', 'MEDECIN_SCOLAIRE', 'SECRETAIRE_DIRECTION',
--     'COMPTABLE', 'GESTIONNAIRE', 'BIBLIOTHECAIRE', 'DOCUMENTALISTE',
--     'ARCHIVISTE', 'ACCUEIL_STANDARD', 'TECHNICIEN_LABO', 'TECHNICIEN_INFO',
--     'CONSEILLER_TIC', 'AIDE_EDUCATEUR', 'ANIMATEUR_TICE', 'SURVEILLANT_GENERAL',
--     'SURVEILLANT', 'MAITRE_INTERNAT', 'CONSEILLER_VIE_SCOLAIRE', 'INFIRMIER_SCOLAIRE',
--     'NUTRITIONNISTE', 'KINESITHERAPEUTE', 'CUISINIER', 'CHAUFFEUR', 'AGENT_ENTRETIEN',
--     'COORDINATEUR_CLUBS', 'ENTRAINEUR_SPORTIF', 'ANIMATEUR_CULTUREL',
--     'COORDINATEUR_EXAMEN', 'RESPONSABLE_BOURSES', 'AUDITEUR_INTERNE',
--     'STATISTICIEN', 'CHARGE_COMMUNICATION'
-- );
