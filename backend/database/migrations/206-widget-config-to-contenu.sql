-- ==================================
-- eLISAschool - Migration 206: Widget config → contenu
-- ==================================
-- Renomme la colonne 'config' en 'contenu' sur cms_widgets
-- pour cohérence avec cms_sections.contenu
-- ==================================

-- Renommer la colonne (la contrainte NOT NULL est conservée)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cms_widgets' AND column_name = 'config'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cms_widgets' AND column_name = 'contenu'
    ) THEN
        ALTER TABLE cms_widgets RENAME COLUMN config TO contenu;
        RAISE NOTICE 'Colonne cms_widgets.config renommée en contenu';
    ELSE
        RAISE NOTICE 'Migration déjà appliquée ou colonne déjà renommée';
    END IF;
END $$;
