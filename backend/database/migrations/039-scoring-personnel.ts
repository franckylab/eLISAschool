/**
 * ==================================
 * eLISAschool - Migration Scoring Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée les tables pour le système de scoring et classement du personnel:
 * - scores_personnel: Scores agrégés par membre du personnel
 * - regles_scoring_personnel: Règles configurables d'attribution de points
 * - historique_scores_personnel: Historique des modifications de scores
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScoringPersonnel1720000000000 implements MigrationInterface {
    name = 'ScoringPersonnel1720000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // =====================================================
        // TABLE 1: scores_personnel (scores agrégés)
        // =====================================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS scores_personnel (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "membrePersonnelId" UUID NOT NULL,
                "etablissementId" UUID NOT NULL,
                "anneeScolaireId" UUID NOT NULL,
                "periodeId" UUID,
                "typePersonnelId" UUID,
                "categoriePersonnel" VARCHAR(50),
                "matiereId" UUID,
                "classeId" UUID,
                "scoreGlobal" DECIMAL(10, 2) DEFAULT 0,
                "scoreAssiduite" DECIMAL(10, 2) DEFAULT 0,
                "scoreComportement" DECIMAL(10, 2) DEFAULT 0,
                "scorePerformance" DECIMAL(10, 2) DEFAULT 0,
                "scorePedagogie" DECIMAL(10, 2) DEFAULT 0,
                "pointsPositifs" INTEGER DEFAULT 0,
                "pointsNegatifs" INTEGER DEFAULT 0,
                "nombreIncidents" INTEGER DEFAULT 0,
                "nombreAbsences" INTEGER DEFAULT 0,
                "nombreRetards" INTEGER DEFAULT 0,
                "nombreEvaluations" INTEGER DEFAULT 0,
                "noteMoyenneEvaluations" DECIMAL(5, 2),
                "rangGlobal" INTEGER,
                "rangParCategorie" INTEGER,
                "rangParMatiere" INTEGER,
                "rangParClasse" INTEGER,
                "derniereMAJ" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // =====================================================
        // TABLE 2: regles_scoring_personnel (règles configurables)
        // =====================================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS regles_scoring_personnel (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "etablissementId" UUID NOT NULL,
                code VARCHAR(100) NOT NULL,
                libelle VARCHAR(200) NOT NULL,
                description TEXT,
                "typeAction" VARCHAR(50) NOT NULL,
                "pointsAttribues" INTEGER NOT NULL,
                "estAutomatique" BOOLEAN DEFAULT true,
                "estActif" BOOLEAN DEFAULT true,
                "priorite" INTEGER DEFAULT 0,
                "conditionsSupplementaires" JSONB,
                "categorieCible" VARCHAR(50),
                "typePersonnelCible" VARCHAR(50),
                "dateDebut" DATE,
                "dateFin" DATE,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                CONSTRAINT regles_scoring_personnel_code_etablissement_unique 
                    UNIQUE (code, "etablissementId")
            )
        `);

        // =====================================================
        // TABLE 3: historique_scores_personnel (traçabilité)
        // =====================================================
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS historique_scores_personnel (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "scorePersonnelId" UUID NOT NULL,
                "membrePersonnelId" UUID NOT NULL,
                "etablissementId" UUID NOT NULL,
                "anneeScolaireId" UUID NOT NULL,
                "periodeId" UUID,
                "typeModification" VARCHAR(50) NOT NULL,
                "sourceModule" VARCHAR(50),
                "sourceId" UUID,
                "pointsAnciens" INTEGER DEFAULT 0,
                "pointsNouveaux" INTEGER NOT NULL,
                "pointsDelta" INTEGER NOT NULL,
                "categorieScore" VARCHAR(50),
                "raison" TEXT,
                "declencheurAutomatique" BOOLEAN DEFAULT false,
                "utilisateurId" UUID,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // =====================================================
        // INDEX STRATÉGIQUES - scores_personnel
        // =====================================================
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_membre ON scores_personnel("membrePersonnelId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_etablissement ON scores_personnel("etablissementId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_annee ON scores_personnel("anneeScolaireId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_periode ON scores_personnel("periodeId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_type ON scores_personnel("typePersonnelId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_categorie ON scores_personnel("categoriePersonnel")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_matiere ON scores_personnel("matiereId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_classe ON scores_personnel("classeId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_score_global ON scores_personnel("scoreGlobal" DESC)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_rang ON scores_personnel("rangGlobal")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_composite_annee_membre 
            ON scores_personnel("anneeScolaireId", "membrePersonnelId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_composite_categorie_score 
            ON scores_personnel("categoriePersonnel", "scoreGlobal" DESC)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_composite_matiere_score 
            ON scores_personnel("matiereId", "scoreGlobal" DESC)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_personnel_composite_classe_score 
            ON scores_personnel("classeId", "scoreGlobal" DESC)
        `);

        // =====================================================
        // INDEX STRATÉGIQUES - regles_scoring_personnel
        // =====================================================
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_regles_scoring_etablissement ON regles_scoring_personnel("etablissementId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_regles_scoring_type_action ON regles_scoring_personnel("typeAction")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_regles_scoring_est_actif ON regles_scoring_personnel("estActif")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_regles_scoring_categorie ON regles_scoring_personnel("categorieCible")
        `);

        // =====================================================
        // INDEX STRATÉGIQUES - historique_scores_personnel
        // =====================================================
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_scores_score ON historique_scores_personnel("scorePersonnelId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_scores_membre ON historique_scores_personnel("membrePersonnelId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_scores_etablissement ON historique_scores_personnel("etablissementId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_scores_annee ON historique_scores_personnel("anneeScolaireId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_scores_type ON historique_scores_personnel("typeModification")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_scores_source ON historique_scores_personnel("sourceModule", "sourceId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_scores_categorie ON historique_scores_personnel("categorieScore")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_scores_created ON historique_scores_personnel("createdAt" DESC)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_historique_scores_composite_membre_annee 
            ON historique_scores_personnel("membrePersonnelId", "anneeScolaireId")
        `);

        // =====================================================
        // CLÉS ÉTRANGÈRES - scores_personnel
        // =====================================================
        await queryRunner.query(`
            ALTER TABLE scores_personnel 
            ADD CONSTRAINT fk_scores_personnel_membre 
            FOREIGN KEY ("membrePersonnelId") 
            REFERENCES membres_personnel(id) 
            ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE scores_personnel 
            ADD CONSTRAINT fk_scores_personnel_etablissement 
            FOREIGN KEY ("etablissementId") 
            REFERENCES etablissements(id) 
            ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE scores_personnel 
            ADD CONSTRAINT fk_scores_personnel_annee 
            FOREIGN KEY ("anneeScolaireId") 
            REFERENCES annees_scolaires(id) 
            ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE scores_personnel 
            ADD CONSTRAINT fk_scores_personnel_periode 
            FOREIGN KEY ("periodeId") 
            REFERENCES periodes(id) 
            ON DELETE SET NULL
        `);
        await queryRunner.query(`
            ALTER TABLE scores_personnel 
            ADD CONSTRAINT fk_scores_personnel_type 
            FOREIGN KEY ("typePersonnelId") 
            REFERENCES types_personnel(id) 
            ON DELETE SET NULL
        `);

        // =====================================================
        // CLÉS ÉTRANGÈRES - regles_scoring_personnel
        // =====================================================
        await queryRunner.query(`
            ALTER TABLE regles_scoring_personnel 
            ADD CONSTRAINT fk_regles_scoring_etablissement 
            FOREIGN KEY ("etablissementId") 
            REFERENCES etablissements(id) 
            ON DELETE CASCADE
        `);

        // =====================================================
        // CLÉS ÉTRANGÈRES - historique_scores_personnel
        // =====================================================
        await queryRunner.query(`
            ALTER TABLE historique_scores_personnel 
            ADD CONSTRAINT fk_historique_scores_score 
            FOREIGN KEY ("scorePersonnelId") 
            REFERENCES scores_personnel(id) 
            ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE historique_scores_personnel 
            ADD CONSTRAINT fk_historique_scores_membre 
            FOREIGN KEY ("membrePersonnelId") 
            REFERENCES membres_personnel(id) 
            ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE historique_scores_personnel 
            ADD CONSTRAINT fk_historique_scores_etablissement 
            FOREIGN KEY ("etablissementId") 
            REFERENCES etablissements(id) 
            ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE historique_scores_personnel 
            ADD CONSTRAINT fk_historique_scores_annee 
            FOREIGN KEY ("anneeScolaireId") 
            REFERENCES annees_scolaires(id) 
            ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE historique_scores_personnel 
            ADD CONSTRAINT fk_historique_scores_periode 
            FOREIGN KEY ("periodeId") 
            REFERENCES periodes(id) 
            ON DELETE SET NULL
        `);
        await queryRunner.query(`
            ALTER TABLE historique_scores_personnel 
            ADD CONSTRAINT fk_historique_scores_utilisateur 
            FOREIGN KEY ("utilisateurId") 
            REFERENCES utilisateurs(id) 
            ON DELETE SET NULL
        `);

        // =====================================================
        // COMMENTAIRES (documentation DB)
        // =====================================================
        await queryRunner.query(`
            COMMENT ON TABLE scores_personnel IS 'Scores agrégés par membre du personnel pour classement multi-dimensionnel'
        `);
        await queryRunner.query(`
            COMMENT ON TABLE regles_scoring_personnel IS 'Règles configurables d''attribution de points pour le scoring personnel'
        `);
        await queryRunner.query(`
            COMMENT ON TABLE historique_scores_personnel IS 'Historique complet des modifications de scores (audit trail)'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les tables dans l'ordre inverse des dépendances
        await queryRunner.query(`DROP TABLE IF EXISTS historique_scores_personnel CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS regles_scoring_personnel CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS scores_personnel CASCADE`);
    }
}
