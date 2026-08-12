-- ==================================
-- eLISAschool - Migration 183 — Inscription module CMS au catalogue
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-08-12
--
-- Objectif : Ajouter le module CMS (pages publiques white-label) au catalogue
--            pour qu'il soit détecté comme actif par défaut par isModuleActive().
-- ==================================

-- Insertion du module CMS dans le catalogue (source de vérité)
INSERT INTO modules_catalogue (
    code, nom, "nomEn", description, categorie,
    icone, "prixMensuel", "prixAnnuel",
    "estFacturable", "estSouscriptible", "actifParDefaut",
    "planMinimal", dependencies, "permissionsRequises", ordre, "estActif", "estSysteme",
    "createdAt", "updatedAt"
)
VALUES (
    'cms', 'Site Web (CMS)', 'Website (CMS)',
    'Pages publiques white-label par établissement : galerie, contact, inscriptions, éditeur CMS',
    'ADDON', 'Globe', 0, 0, false, false, true,
    NULL, '[]',
    'cms:pages:view,cms:pages:create,cms:pages:edit,cms:pages:publish,cms:pages:delete,cms:sections:view,cms:sections:create,cms:sections:edit,cms:sections:delete,cms:medias:view,cms:medias:upload,cms:medias:delete,cms:themes:view,cms:themes:manage,cms:menus:manage,cms:widgets:manage,cms:versions:view,cms:versions:restore',
    50, true, true,
    NOW(), NOW()
)
ON CONFLICT (code) DO NOTHING;

-- Paramètre système global : module CMS actif (Niveau 1 — résolution rapide)
INSERT INTO parametres_systeme (
    cle, valeur, "typeValeur", categorie, module,
    description, visible, "modifiableRuntime", ordre,
    "createdAt", "updatedAt"
)
VALUES (
    'modules.cms.actif', 'true', 'BOOLEAN', 'MODULE', 'cms',
    'Activation du module Site Web (CMS)', true, true, 0,
    NOW(), NOW()
)
ON CONFLICT DO NOTHING;
