# ✅ Checklist de Vérification - Seeds v5.0.0

## 🎯 Pré-requis

- [ ] PostgreSQL est en cours d'exécution
- [ ] Base de données `elisaschool` créée
- [ ] Fichier `.env` configuré correctement
- [ ] Dépendances installées (`npm install`)

## 📋 Exécution des Seeds

### 1. Exécution complète
```bash
cd backend
npm run seed
```

**Vérifications:**
- [ ] Aucun message d'erreur critique
- [ ] Logs montrent la création des entités
- [ ] Message "✅ Seeds exécutés avec succès" affiché
- [ ] IDs des établissements affichés

### 2. Vérification de l'état
```bash
npm run seed:check
```

**Résultat attendu:**
```
📊 Rapport d'état des seeds:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ OK    Établissements                 2 enregistrment(s)
✅ OK    Cycles                        8 enregistrment(s)
✅ OK    Niveaux                      56 enregistrment(s)
✅ OK    Filières                     32 enregistrment(s)
✅ OK    Spécialités                  68 enregistrment(s)
✅ OK    Examens Nationaux            14 enregistrment(s)
✅ OK    Compétences                  56 enregistrment(s)
✅ OK    Années Scolaires              6 enregistrment(s)
✅ OK    Classes                      68 enregistrment(s)
✅ OK    Matières                     30 enregistrment(s)
✅ OK    Matières-Niveaux            200 enregistrment(s)
✅ OK    Utilisateurs                 39 enregistrment(s)
✅ OK    Élèves                       34 enregistrment(s)
✅ OK    Rôles                        XX enregistrment(s)
✅ OK    Permissions                XXX enregistrment(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Résumé:
  Total entités: ~600+
  Seeds OK: 15/15
  Seeds vides: 0/15
  Complétion: 100%

✅ Tous les seeds sont correctement initialisés!
```

## 🔍 Vérifications Détaillées

### Établissements
- [ ] 2 établissements créés (ETAB-001, ETAB-002)
- [ ] ETAB-001: Lycée Bilingue eLISAschool (Biculturel)
- [ ] ETAB-002: Collège Privé Les Palmiers (Francophone)
- [ ] Configurations associées créées

### Structure Académique (par établissement)
- [ ] 4 cycles (Maternelle, Primaire, Collège, Lycée)
- [ ] 28 niveaux (16 FR + 12 EN)
- [ ] 16 filières (Second cycle FR)
- [ ] 34 spécialités techniques
- [ ] 7 examens nationaux
- [ ] 28 compétences APC

### Années Scolaires
- [ ] 3 années créées par établissement
- [ ] 2024-2025 (enCours: false)
- [ ] 2025-2026 (enCours: true) ← Active
- [ ] 2026-2027 (enCours: false)

### Classes
- [ ] 34 classes par établissement (1 par niveau)
- [ ] Classes liées à l'année scolaire active
- [ ] Effectif max défini correctement
- [ ] Effectif actuel = 0 (avant seed élèves)

### Matières
- [ ] 15 matières créées par établissement:
  - [ ] Mathématiques (MATH)
  - [ ] Physique-Chimie (PC)
  - [ ] Sciences de la Vie et de la Terre (SVT)
  - [ ] Informatique (INFO)
  - [ ] Français (FR)
  - [ ] Anglais (ANG)
  - [ ] Histoire-Géographie (HG)
  - [ ] Philosophie (PHILO)
  - [ ] Lettres (LETT)
  - [ ] Éducation Physique et Sportive (EPS)
  - [ ] Éducation Artistique (ART)
  - [ ] Musique (MUS)
  - [ ] Éducation Morale et Civique (EMC)
  - [ ] Technologie (TECH)
  - [ ] Sciences Économiques (SE)

### Matières-Niveaux
- [ ] ~100 associations par établissement
- [ ] Coefficients corrects
- [ ] Volumes horaires définis
- [ ] Matières obligatoires marquées

### Utilisateurs
- [ ] 1 Super Admin (admin@elisaschool.cm)
- [ ] 38 utilisateurs de test
- [ ] Tous liés à l'établissement principal
- [ ] Profils créés pour chaque utilisateur
- [ ] Rôles correctement assignés

### Élèves
- [ ] 34 élèves créés (uniquement ETAB-001)
- [ ] Utilisateurs associés créés
- [ ] Répartis dans différentes classes
- [ ] Effectifs des classes mis à jour
- [ ] Données réalistes (noms, dates, lieux)

## 🔑 Tests de Connexion

### Super Admin
- [ ] Email: `admin@elisaschool.cm`
- [ ] Mot de passe: `AdminSecret123!`
- [ ] Accès aux 2 établissements
- [ ] Tous les droits

### Utilisateurs de Test
- [ ] admin.test@elisaschool.cm / Test123456!
- [ ] chef.etablissement@elisaschool.cm / Test123456!
- [ ] enseignant@elisaschool.cm / Test123456!
- [ ] parent@elisaschool.cm / Test123456!
- [ ] eleve@elisaschool.cm / Test123456!

### Élèves
- [ ] eleve.elv-2025-001@elisaschool.cm / Test123456!
- [ ] eleve.elv-2025-015@elisaschool.cm / Test123456!
- [ ] eleve.elv-2025-025@elisaschool.cm / Test123456!

## 📊 Vérification Base de Données

### Requêtes SQL
```sql
-- Établissements
SELECT id, nom, code_etablissement, sous_systeme 
FROM etablissements 
ORDER BY code_etablissement;

-- Années scolaires
SELECT annee.libelle, annee.en_cours, etab.nom 
FROM annees_scolaires annee
JOIN etablissements etab ON annee.etablissement_id = etab.id
WHERE annee.en_cours = true;

-- Classes avec effectifs
SELECT c.nom, c.code, c.effectif_max, c.effectif_actuel, n.code as niveau_code
FROM classes c
JOIN niveaux n ON c.niveau_id = n.id
WHERE c.etablissement_id = (SELECT id FROM etablissements WHERE code_etablissement = 'ETAB-001')
AND c.annee_scolaire_id = (SELECT id FROM annees_scolaires WHERE en_cours = true LIMIT 1)
ORDER BY n.ordre;

-- Élèves par classe
SELECT c.nom as classe, COUNT(e.id) as nombre_eleves
FROM eleves e
JOIN classes c ON e.classe_id = c.id
WHERE e.etablissement_id = (SELECT id FROM etablissements WHERE code_etablissement = 'ETAB-001')
GROUP BY c.nom
ORDER BY c.nom;

-- Matières-Niveaux
SELECT m.nom as matiere, n.code as niveau, mn.coefficient, mn.volume_horaire
FROM matieres_niveaux mn
JOIN matieres m ON mn.matiere_id = m.id
JOIN niveaux n ON mn.niveau_id = n.id
WHERE n.code IN ('CM2', '3EME', 'TERMINALE')
ORDER BY n.code, m.code;
```

## 🎓 Tests Fonctionnels

### Navigation
- [ ] Voir la liste des établissements
- [ ] Voir les classes d'un établissement
- [ ] Voir les élèves d'une classe
- [ ] Voir le profil d'un élève
- [ ] Voir les matières d'un niveau

### Bulletins
- [ ] Les matières sont associées aux niveaux
- [ ] Les coefficients sont corrects
- [ ] Les volumes horaires sont affichés

### Emploi du temps
- [ ] Les classes existent
- [ ] Les niveaux sont définis
- [ ] Les matières sont disponibles

### Notes
- [ ] Les matières-niveaux sont configurées
- [ ] Les coefficients sont appliqués
- [ ] Les élèves sont dans les classes

## ⚠️ Points d'Attention

### Multi-Tenancy
- [ ] Les données de ETAB-001 ne fuient pas vers ETAB-002
- [ ] Chaque établissement a ses propres données
- [ ] Le Super Admin voit les 2 établissements
- [ ] Les autres utilisateurs voient 1 seul établissement

### Idempotence
- [ ] Ré-exécuter `npm run seed` ne crée pas de doublons
- [ ] Les compteurs restent stables
- [ ] Aucun message d'erreur

### Performance
- [ ] L'exécution prend moins de 30 secondes
- [ ] Pas de memory leak
- [ ] Logs fluides

## 🐛 Dépannage

### Si erreur de connexion
```bash
# Vérifier PostgreSQL
pg_isready -h localhost -p 7002

# Vérifier .env
cat .env | grep DB_

# Tester la connexion
psql -h localhost -p 7002 -U elisaschool_user -d elisaschool
```

### Si données manquantes
```bash
# Vérifier l'état
npm run seed:check

# Re-exécuter les seeds
npm run seed

# Ou reset complet
dropdb elisaschool
createdb elisaschool
npm run seed
```

### Si doublons détectés
- [ ] Vérifier que les seeds sont idempotents
- [ ] Regarder les logs pour identifier le problème
- [ ] Vérifier les contraintes d'unicité en base

## 📝 Documentation

- [ ] README.md lu et compris
- [ ] GUIDE-RAPIDE.md consulté
- [ ] CHANGELOG.md vérifié
- [ ] RESUME.md parcouru

## ✨ Validation Finale

- [ ] Tous les tests passent
- [ ] Aucune erreur dans les logs
- [ ] Données cohérentes
- [ ] Performance acceptable
- [ ] Documentation à jour

## 🎉 Félicitations!

Si toutes les cases sont cochées, les seeds v5.0.0 sont correctement installés et fonctionnels!

**Prochains steps:**
1. Tester les fonctionnalités de l'application
2. Créer des données supplémentaires si nécessaire
3. Commencer le développement des features

---

**Date de vérification:** ________________  
**Vérifié par:** ________________  
**Statut:** ✅ OK / ❌ Problèmes détectés

**Notes:**
___________________________________________
___________________________________________
___________________________________________
