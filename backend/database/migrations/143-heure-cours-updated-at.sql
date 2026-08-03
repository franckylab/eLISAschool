/**
 * ==================================
 * eLISAschool - Migration 143
 * ==================================
 * Ajout de la colonne "updatedAt" sur heures_cours.
 *
 * Contexte : @UpdateDateColumn() ajoutée sur l'entité HeureCours
 * (nécessaire pour tracer les propagations créneau → instances,
 * lot 1 de la synchronisation créneau/heure de cours).
 *
 * TypeORM gère le remplissage automatique ; la colonne est ajoutée
 * avec un défaut pour les lignes existantes.
 */

ALTER TABLE heures_cours ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now();
