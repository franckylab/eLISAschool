# 🚀 GUIDE DE DÉPLOIEMENT RAPIDE

> **Date**: 2026-06-13  
> **Version**: 3.2.0  
> **Temps estimé**: 5 minutes

---

## ✅ PRÉREQUIS

- [ ] PostgreSQL en cours d'exécution
- [ ] Node.js 18+ installé
- [ ] Backend configuré (.env)
- [ ] Frontend configuré

---

## 📦 DÉPLOIEMENT EN 3 COMMANDES

### Option 1: Script Automatisé (Recommandé)

```bash
# Depuis la racine du projet
bash scripts/deploy-complete-structure-v2.sh
```

**Ce script fait automatiquement**:
1. ✅ Backup de la base de données
2. ✅ Exécution de la migration DB
3. ✅ Seed des 35 spécialités + 30 compétences
4. ✅ Vérification des tables
5. ✅ Instructions pour le frontend

### Option 2: Manuel

```bash
# 1. Migration DB
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d elisaschool \
    -f backend/database/migrations/054-refonte-structure-academique-v2.sql

# 2. Seed données
cd backend
npx ts-node src/database/seeds/seed-specialites-competences.ts
cd ..

# 3. Redémarrer backend
cd backend && npm run dev &

# 4. Démarrer frontend
cd frontend && npm run dev
```

---

## 🧪 TESTS POST-DÉPLOIEMENT

### Backend API

```bash
# Tester les spécialités
curl http://localhost:7000/api/specialites | jq '.meta.totalItems'
# Attendu: 35

# Tester les compétences
curl http://localhost:7000/api/competences | jq '.meta.totalItems'
# Attendu: 30
```

### Frontend UI

Ouvrir dans le navigateur:
- **Spécialités**: http://localhost:7001/specialites
- **Compétences**: http://localhost:7001/competences

**Vérifier**:
- [ ] DataTable affiche les données
- [ ] Modal de création fonctionne
- [ ] Toasts de succès apparaissent
- [ ] Navigation sidebar fonctionne

---

## 📊 VÉRIFICATION DB

```bash
# Compter les spécialités
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d elisaschool -c \
    "SELECT COUNT(*) as specialites FROM specialites;"

# Compter les compétences
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d elisaschool -c \
    "SELECT COUNT(*) as competences FROM competences;"

# Voir les spécialités par filière
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d elisaschool -c \
    "SELECT f.code, f.nom, COUNT(s.id) as nb_specialites 
     FROM filieres f 
     LEFT JOIN specialites s ON s.\"filiereId\" = f.id 
     WHERE f.code IN ('F1','F2','F3','F4','G1','G2','H','I','K','L')
     GROUP BY f.id, f.code, f.nom 
     ORDER BY f.code;"
```

---

## 🎯 STRUCTURE CRÉÉE

### Spécialités (35 items)

| Filière | Spécialités | Exemples |
|---------|-------------|----------|
| F1 - Mécanique | 4 | Maintenance Auto, Usinage CNC |
| F2 - Électrotechnique | 4 | Électrotechnique, Automatismes |
| F3 - Génie Civil | 3 | Gros Œuvre, Topographie |
| F4 - Chimique | 2 | Procédés, Contrôle Qualité |
| G1 - Administratif | 2 | Secrétariat, Gestion |
| G2 - Commercial | 3 | Commerce International, Marketing |
| H - Économique | 2 | Comptabilité, Finance |
| I - Informatique | 3 | Développement, Réseaux, BD |
| K - Arts | 2 | Design Graphique, Arts Plastiques |
| L - Hôtellerie | 3 | Cuisine, Service, Pâtisserie |

### Compétences (30 items)

| Domaine | Niveaux | Exemples |
|---------|---------|----------|
| Mathématiques | 6ème, 3ème, Terminale | Équations, Dérivées, Intégrales |
| Sciences | 6ème, 3ème, Terminale | Matière, Chimie, Mécanique |
| Français | 6ème, Terminale | Narration, Analyse littéraire |
| Anglais | 6ème, Terminale | Présentation, Conversation |
| Informatique | Seconde | Programmation, HTML/CSS |
| Histoire-Géo | 3ème | WWII, Décolonisation |

---

## 🔧 RÉSOLUTION DE PROBLÈMES

### Problème: Migration échoue

```bash
# Vérifier la connexion DB
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d elisaschool -c "SELECT 1;"

# Vérifier les tables existantes
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d elisaschool -c "\dt"
```

### Problème: Seed échoue

```bash
# Vérifier que les filières existent
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d elisaschool -c \
    "SELECT code, nom FROM filieres WHERE code IN ('F1','F2','I');"

# Si vides, exécuter le seed structure académique d'abord
bash scripts/deploy-structure-academique-v2.sh
```

### Problème: Frontend ne charge pas

```bash
# Vérifier les erreurs console
# F12 → Console

# Vérifier que le backend tourne
curl http://localhost:7000/api/health

# Redémarrer le frontend
cd frontend
rm -rf node_modules/.vite
npm run dev
```

---

## 📚 DOCUMENTATION COMPLÈTE

1. **IMPLÉMENTATION-COMPLETE-SPECIALITES-COMPETENCES.md** - Guide complet (ce fichier)
2. **MISE-A-JOUR-FRONTEND-SPECIALITES-COMPETENCES.md** - Frontend details
3. **REFONTE-STRUCTURE-ACADEMIQUE-V2.md** - Backend details
4. **RESUME-REFONTE-STRUCTURE-V2.md** - Résumé exécutif

---

## ✅ CHECKLIST FINALE

- [ ] Backup DB créé
- [ ] Migration exécutée
- [ ] Seed exécuté (35+30 items)
- [ ] Backend redémarré
- [ ] Frontend redémarré
- [ ] Page /specialites testée
- [ ] Page /competences testée
- [ ] Navigation sidebar vérifiée
- [ ] Modals fonctionnels
- [ ] Toasts de feedback OK

---

**✅ DÉPLOIEMENT RÉUSSI** 🎉

*Le système de structure académique v2 est maintenant en production avec 35 spécialités et 30 compétences.*
