-- ==================================
-- eLISAschool - Correction Index Dupliqué
-- ==================================
-- Ce script supprime l'index qui cause l'erreur:
-- "relation IDX_0bf6f45eec40da903429d755d5 already exists"
--
-- Utilisation:
-- psql -h localhost -U elisaschool_user -d elisaschool -f fix-index.sql
-- ==================================

BEGIN;

-- Supprimer l'index dupliqué sur la table classes
DROP INDEX IF EXISTS "IDX_0bf6f45eec40da903429d755d5";

-- Vérifier que l'index a été supprimé
SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname = 'IDX_0bf6f45eec40da903429d755d5';

COMMIT;

-- Message de confirmation
SELECT '✅ Index dupliqué supprimé avec succès !' as status;
SELECT '💡 Vous pouvez maintenant démarrer l''application avec: npm run dev' as next_step;
