-- ==================================
-- Migration 111: Nettoyage trigger occupantId orphelin
-- ==================================
-- La migration 110 a supprimé la colonne "occupantId" de la table postes,
-- mais le trigger trg_sync_poste_occupant (créé par migration 073) référençait
-- encore cette colonne, provoquant des erreurs 500 sur toute opération
-- INSERT/UPDATE/DELETE dans affectations_postes.
--
-- Cette migration supprime le trigger et sa fonction associée.
-- ==================================

-- 1. Supprimer le trigger sur affectations_postes
DROP TRIGGER IF EXISTS trg_sync_poste_occupant ON affectations_postes;

-- 2. Supprimer la fonction trigger
DROP FUNCTION IF EXISTS sync_poste_occupant();
