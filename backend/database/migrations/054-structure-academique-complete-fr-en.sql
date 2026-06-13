-- ==================================
-- MISE À JOUR STRUCTURE ACADÉMIQUE COMPLÈTE
-- ==================================
-- Ajoute:
-- 1. Examen Probatoire (1ère francophone)
-- 2. Niveaux Anglophones complets (Nursery à Upper 6th)
-- 3. Examens GCE O Level et A Level
-- 4. Filières anglophones
-- ==================================

-- ==================================
-- 1. EXAMEN PROBATOIRE (1ère Francophone)
-- ==================================

INSERT INTO examens_nationaux (id, nom, code, type, "niveauId", "diplomeDelivre", "sousSysteme", "estObligatoire", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'PROBATOIRE',
    'PROBATOIRE',
    'NATIONAL',
    n.id,
    'PROBATOIRE',
    'FRANCOPHONE',
    true,
    NOW(),
    NOW()
FROM niveaux n
WHERE n.code = 'PREMIERE'
AND NOT EXISTS (SELECT 1 FROM examens_nationaux WHERE code = 'PROBATOIRE');

-- ==================================
-- 2. NIVEAUX ANGLOPHONES COMPLETS
-- ==================================

DO $$
DECLARE
    cycle_maternel UUID;
    cycle_primaire UUID;
    cycle_sec1 UUID;
    cycle_sec2 UUID;
BEGIN
    -- Récupérer les IDs des cycles
    SELECT id INTO cycle_maternel FROM cycles WHERE code = 'CYCLE_MATERNEL';
    SELECT id INTO cycle_primaire FROM cycles WHERE code = 'CYCLE_PRIMAIRE';
    SELECT id INTO cycle_sec1 FROM cycles WHERE code = 'SECONDAIRE_1';
    SELECT id INTO cycle_sec2 FROM cycles WHERE code = 'SECONDAIRE_2';

    -- Nursery (2 ans) - Cycle Maternel
    INSERT INTO niveaux (id, nom, code, ordre, "cycleId", "sousSysteme", "estClasseExamen", "createdAt", "updatedAt")
    SELECT gen_random_uuid(), v.nom, v.code, v.ordre, cycle_maternel, 'ANGLOPHONE', false, NOW(), NOW()
    FROM (VALUES
        ('Nursery 1', 'NURSERY1', 1),
        ('Nursery 2', 'NURSERY2', 2)
    ) AS v(nom, code, ordre)
    WHERE NOT EXISTS (SELECT 1 FROM niveaux WHERE code = v.code);

    -- Primary (5 ans) - Cycle Primaire
    INSERT INTO niveaux (id, nom, code, ordre, "cycleId", "sousSysteme", "estClasseExamen", "createdAt", "updatedAt")
    SELECT gen_random_uuid(), v.nom, v.code, v.ordre, cycle_primaire, 'ANGLOPHONE', false, NOW(), NOW()
    FROM (VALUES
        ('Standard 1', 'STD1', 1),
        ('Standard 2', 'STD2', 2),
        ('Standard 3', 'STD3', 3),
        ('Standard 4', 'STD4', 4),
        ('Standard 5', 'STD5', 5)
    ) AS v(nom, code, ordre)
    WHERE NOT EXISTS (SELECT 1 FROM niveaux WHERE code = v.code);

    -- Secondary 1st Cycle (5 ans) - Collège
    INSERT INTO niveaux (id, nom, code, ordre, "cycleId", "sousSysteme", "estClasseExamen", "createdAt", "updatedAt")
    SELECT gen_random_uuid(), v.nom, v.code, v.ordre, cycle_sec1, 'ANGLOPHONE', (v.code = 'FORM5'), NOW(), NOW()
    FROM (VALUES
        ('Form 1', 'FORM1', 1),
        ('Form 2', 'FORM2', 2),
        ('Form 3', 'FORM3', 3),
        ('Form 4', 'FORM4', 4),
        ('Form 5', 'FORM5', 5)
    ) AS v(nom, code, ordre)
    WHERE NOT EXISTS (SELECT 1 FROM niveaux WHERE code = v.code);

    -- Secondary 2nd Cycle (2 ans) - Lycée
    INSERT INTO niveaux (id, nom, code, ordre, "cycleId", "sousSysteme", "estClasseExamen", "createdAt", "updatedAt")
    SELECT gen_random_uuid(), v.nom, v.code, v.ordre, cycle_sec2, 'ANGLOPHONE', (v.code = 'UPPER6'), NOW(), NOW()
    FROM (VALUES
        ('Lower Sixth', 'LOWER6', 1),
        ('Upper Sixth', 'UPPER6', 2)
    ) AS v(nom, code, ordre)
    WHERE NOT EXISTS (SELECT 1 FROM niveaux WHERE code = v.code);

    RAISE NOTICE 'Niveaux anglophones insérés avec succès';
END $$;

-- ==================================
-- 3. EXAMENS GCE (ANGLOPHONE)
-- ==================================

-- GCE Ordinary Level (Form 5)
INSERT INTO examens_nationaux (id, nom, code, type, "niveauId", "diplomeDelivre", "sousSysteme", "estObligatoire", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'GCE Ordinary Level',
    'GCE_OL',
    'NATIONAL',
    n.id,
    'GCE_ORDINARY_LEVEL',
    'ANGLOPHONE',
    true,
    NOW(),
    NOW()
FROM niveaux n
WHERE n.code = 'FORM5'
AND NOT EXISTS (SELECT 1 FROM examens_nationaux WHERE code = 'GCE_OL');

-- GCE Advanced Level (Upper 6th)
INSERT INTO examens_nationaux (id, nom, code, type, "niveauId", "diplomeDelivre", "sousSysteme", "estObligatoire", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'GCE Advanced Level',
    'GCE_AL',
    'NATIONAL',
    n.id,
    'GCE_ADVANCED_LEVEL',
    'ANGLOPHONE',
    true,
    NOW(),
    NOW()
FROM niveaux n
WHERE n.code = 'UPPER6'
AND NOT EXISTS (SELECT 1 FROM examens_nationaux WHERE code = 'GCE_AL');

-- ==================================
-- 4. FILIÈRES ANGLOPHONES (Optionnel)
-- ==================================

-- Les filières anglophones sont moins formelles que le système francophone
-- Mais on peut ajouter des "tracks" ou "options" si nécessaire
-- Pour l'instant, on laisse vide car le système anglophone utilise des "subject combinations"

-- ==================================
-- VÉRIFICATION
-- ==================================

SELECT 'Types cycles' as element, COUNT(*) FROM types_cycles
UNION ALL SELECT 'Cycles', COUNT(*) FROM cycles
UNION ALL SELECT 'Niveaux FR', COUNT(*) FROM niveaux WHERE "sousSysteme" = 'FRANCOPHONE'
UNION ALL SELECT 'Niveaux EN', COUNT(*) FROM niveaux WHERE "sousSysteme" = 'ANGLOPHONE'
UNION ALL SELECT 'Filières FR', COUNT(*) FROM filieres WHERE soussysteme = 'FRANCOPHONE'
UNION ALL SELECT 'Examens FR', COUNT(*) FROM examens_nationaux WHERE "sousSysteme" = 'FRANCOPHONE'
UNION ALL SELECT 'Examens EN', COUNT(*) FROM examens_nationaux WHERE "sousSysteme" = 'ANGLOPHONE'
ORDER BY element;
