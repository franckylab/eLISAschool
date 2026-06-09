#!/bin/bash
# ==================================
# eLISAschool - Script SQL Direct Migration Scoring Personnel
# ==================================
# Exécuter via: docker exec -i elisaschool_postgres psql -U elisaschool_user -d elisaschool < ce_fichier.sql

set -e

echo "=== Vérification des tables existantes ==="
docker exec -i elisaschool_postgres psql -U elisaschool_user -d elisaschool -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name LIMIT 50;
"

echo ""
echo "=== L'application doit être démarrée pour créer les tables de base ==="
echo "Redémarrons le backend pour que synchronize crée les tables..."
docker restart elisaschool_backend

echo "Attente du démarrage..."
sleep 15

echo "=== Tables après redémarrage ==="
docker exec -i elisaschool_postgres psql -U elisaschool_user -d elisaschool -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name LIMIT 50;
"

echo ""
echo "=== Exécution de la migration scoring personnel ==="
docker exec -i elisaschool_postgres psql -U elisaschool_user -d elisaschool << 'EOSQL'

-- TABLE 1: scores_personnel
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
);

-- TABLE 2: regles_scoring_personnel
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
    CONSTRAINT regles_scoring_code_etab_unique UNIQUE (code, "etablissementId")
);

-- TABLE 3: historique_scores_personnel
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
    raison TEXT,
    "declencheurAutomatique" BOOLEAN DEFAULT false,
    "utilisateurId" UUID,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEX scores_personnel
CREATE INDEX IF NOT EXISTS idx_scores_pers_membre ON scores_personnel("membrePersonnelId");
CREATE INDEX IF NOT EXISTS idx_scores_pers_etab ON scores_personnel("etablissementId");
CREATE INDEX IF NOT EXISTS idx_scores_pers_annee ON scores_personnel("anneeScolaireId");
CREATE INDEX IF NOT EXISTS idx_scores_pers_periode ON scores_personnel("periodeId");
CREATE INDEX IF NOT EXISTS idx_scores_pers_type ON scores_personnel("typePersonnelId");
CREATE INDEX IF NOT EXISTS idx_scores_pers_categorie ON scores_personnel("categoriePersonnel");
CREATE INDEX IF NOT EXISTS idx_scores_pers_matiere ON scores_personnel("matiereId");
CREATE INDEX IF NOT EXISTS idx_scores_pers_classe ON scores_personnel("classeId");
CREATE INDEX IF NOT EXISTS idx_scores_pers_global ON scores_personnel("scoreGlobal" DESC);
CREATE INDEX IF NOT EXISTS idx_scores_pers_rang ON scores_personnel("rangGlobal");
CREATE INDEX IF NOT EXISTS idx_scores_pers_comp_an_membre ON scores_personnel("anneeScolaireId", "membrePersonnelId");
CREATE INDEX IF NOT EXISTS idx_scores_pers_comp_cat_score ON scores_personnel("categoriePersonnel", "scoreGlobal" DESC);
CREATE INDEX IF NOT EXISTS idx_scores_pers_comp_mat_score ON scores_personnel("matiereId", "scoreGlobal" DESC);
CREATE INDEX IF NOT EXISTS idx_scores_pers_comp_cls_score ON scores_personnel("classeId", "scoreGlobal" DESC);

-- INDEX regles_scoring
CREATE INDEX IF NOT EXISTS idx_regles_pers_etab ON regles_scoring_personnel("etablissementId");
CREATE INDEX IF NOT EXISTS idx_regles_pers_type ON regles_scoring_personnel("typeAction");
CREATE INDEX IF NOT EXISTS idx_regles_pers_actif ON regles_scoring_personnel("estActif");
CREATE INDEX IF NOT EXISTS idx_regles_pers_cat ON regles_scoring_personnel("categorieCible");

-- INDEX historique_scores
CREATE INDEX IF NOT EXISTS idx_hist_pers_score ON historique_scores_personnel("scorePersonnelId");
CREATE INDEX IF NOT EXISTS idx_hist_pers_membre ON historique_scores_personnel("membrePersonnelId");
CREATE INDEX IF NOT EXISTS idx_hist_pers_etab ON historique_scores_personnel("etablissementId");
CREATE INDEX IF NOT EXISTS idx_hist_pers_annee ON historique_scores_personnel("anneeScolaireId");
CREATE INDEX IF NOT EXISTS idx_hist_pers_type ON historique_scores_personnel("typeModification");
CREATE INDEX IF NOT EXISTS idx_hist_pers_source ON historique_scores_personnel("sourceModule", "sourceId");
CREATE INDEX IF NOT EXISTS idx_hist_pers_cat ON historique_scores_personnel("categorieScore");
CREATE INDEX IF NOT EXISTS idx_hist_pers_created ON historique_scores_personnel("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_hist_pers_comp_membre_annee ON historique_scores_personnel("membrePersonnelId", "anneeScolaireId");

-- FK (avec IF NOT EXISTS implicite via les contraintes)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_scores_pers_membre') THEN
        ALTER TABLE scores_personnel ADD CONSTRAINT fk_scores_pers_membre FOREIGN KEY ("membrePersonnelId") REFERENCES membres_personnel(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_scores_pers_etab') THEN
        ALTER TABLE scores_personnel ADD CONSTRAINT fk_scores_pers_etab FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_scores_pers_annee') THEN
        ALTER TABLE scores_personnel ADD CONSTRAINT fk_scores_pers_annee FOREIGN KEY ("anneeScolaireId") REFERENCES annees_scolaires(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_scores_pers_periode') THEN
        ALTER TABLE scores_personnel ADD CONSTRAINT fk_scores_pers_periode FOREIGN KEY ("periodeId") REFERENCES periodes(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_scores_pers_type') THEN
        ALTER TABLE scores_personnel ADD CONSTRAINT fk_scores_pers_type FOREIGN KEY ("typePersonnelId") REFERENCES types_personnel(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_regles_pers_etab') THEN
        ALTER TABLE regles_scoring_personnel ADD CONSTRAINT fk_regles_pers_etab FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_hist_pers_score') THEN
        ALTER TABLE historique_scores_personnel ADD CONSTRAINT fk_hist_pers_score FOREIGN KEY ("scorePersonnelId") REFERENCES scores_personnel(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_hist_pers_membre') THEN
        ALTER TABLE historique_scores_personnel ADD CONSTRAINT fk_hist_pers_membre FOREIGN KEY ("membrePersonnelId") REFERENCES membres_personnel(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_hist_pers_etab') THEN
        ALTER TABLE historique_scores_personnel ADD CONSTRAINT fk_hist_pers_etab FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_hist_pers_annee') THEN
        ALTER TABLE historique_scores_personnel ADD CONSTRAINT fk_hist_pers_annee FOREIGN KEY ("anneeScolaireId") REFERENCES annees_scolaires(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_hist_pers_periode') THEN
        ALTER TABLE historique_scores_personnel ADD CONSTRAINT fk_hist_pers_periode FOREIGN KEY ("periodeId") REFERENCES periodes(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_hist_pers_user') THEN
        ALTER TABLE historique_scores_personnel ADD CONSTRAINT fk_hist_pers_user FOREIGN KEY ("utilisateurId") REFERENCES utilisateurs(id) ON DELETE SET NULL;
    END IF;
END $$;

EOSQL

echo ""
echo "=== Vérification finale ==="
docker exec -i elisaschool_postgres psql -U elisaschool_user -d elisaschool -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%scoring%' OR table_name LIKE '%scores%'
ORDER BY table_name;
"

echo "=== Index créés ==="
docker exec -i elisaschool_postgres psql -U elisaschool_user -d elisaschool -c "
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('scores_personnel', 'regles_scoring_personnel', 'historique_scores_personnel')
ORDER BY indexname;
"

echo ""
echo "✅ Migration scoring personnel terminée !"
