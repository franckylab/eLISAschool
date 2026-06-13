# 🚀 Structure Académique - Commands & Integration Guide

## ✅ État Final

**Backend** : 100% ✅  
**Frontend** : 100% ✅ (hooks, pages, formulaires)  
**Routes** : À configurer  
**Menu** : À intégrer  

---

## 📋 Checklist d'Intégration

### 1. Créer les Fichiers de Routes

```bash
cd /home/franckylab/projets/eLISAschool/frontend/src/routes/(authenticated)/parametres

# Créer le dossier
mkdir -p structure-academique

# Créer les 7 fichiers de routes
touch structure-academique/route.tsx
touch structure-academique/types-cycles.tsx
touch structure-academique/cycles.tsx
touch structure-academique/niveaux.tsx
touch structure-academique/filieres.tsx
touch structure-academique/examens-nationaux.tsx
touch structure-academique/diplomes-eleves.tsx
```

### 2. Configurer les Routes

Voir `IMPLEMENTATION-COMPLETE-STRUCTURE-ACADEMIQUE.md` Étape 1 pour le contenu des fichiers.

### 3. Générer les Routes (si nécessaire)

```bash
cd frontend
npm run generate-routes  # ou équivalent selon la config
```

### 4. Ajouter au Menu de Navigation

Localiser le fichier de navigation (ex: `src/components/layout/Sidebar.tsx`) et ajouter la section.

### 5. Tester

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Browser
http://localhost:7001/parametres/structure-academique
```

---

## 🧪 Tests API

```bash
# Variables
TOKEN="votre_token_jwt"
BASE_URL="http://localhost:7000"

# Types de Cycles
curl $BASE_URL/api/types-cycles -H "Authorization: Bearer $TOKEN" | jq

# Cycles
curl $BASE_URL/api/cycles -H "Authorization: Bearer $TOKEN" | jq

# Niveaux
curl $BASE_URL/api/niveaux -H "Authorization: Bearer $TOKEN" | jq
curl "$BASE_URL/api/niveaux?sousSysteme=FRANCOPHONE" -H "Authorization: Bearer $TOKEN" | jq

# Filières
curl $BASE_URL/api/filieres -H "Authorization: Bearer $TOKEN" | jq
curl "$BASE_URL/api/filieres?sousSysteme=FRANCOPHONE" -H "Authorization: Bearer $TOKEN" | jq

# Examens Nationaux
curl $BASE_URL/api/examens-nationaux -H "Authorization: Bearer $TOKEN" | jq
curl "$BASE_URL/api/examens-nationaux?sousSysteme=ANGLOPHONE" -H "Authorization: Bearer $TOKEN" | jq

# Diplômes Élèves
curl $BASE_URL/api/diplomes-eleves -H "Authorization: Bearer $TOKEN" | jq

# Test création filière
curl -X POST $BASE_URL/api/filieres \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Série F - Sciences de l'Ingénieur",
    "code": "F",
    "cycleId": "ID_CYCLE_SECONDAIRE_2",
    "sousSysteme": "FRANCOPHONE",
    "actif": true
  }' | jq
```

---

## 📊 Vérification Base de Données

```bash
PGPASSWORD=elisaschool_password psql -h localhost -p 7002 -U elisaschool_user -d elisaschool << 'EOF'

-- Statistiques
SELECT 'Types cycles' as element, COUNT(*) FROM types_cycles
UNION ALL SELECT 'Cycles', COUNT(*) FROM cycles
UNION ALL SELECT 'Niveaux FR', COUNT(*) FROM niveaux WHERE "sousSysteme" = 'FRANCOPHONE'
UNION ALL SELECT 'Niveaux EN', COUNT(*) FROM niveaux WHERE "sousSysteme" = 'ANGLOPHONE'
UNION ALL SELECT 'Total Niveaux', COUNT(*) FROM niveaux
UNION ALL SELECT 'Filières', COUNT(*) FROM filieres
UNION ALL SELECT 'Examens FR', COUNT(*) FROM examens_nationaux WHERE soussysteme = 'FRANCOPHONE'
UNION ALL SELECT 'Examens EN', COUNT(*) FROM examens_nationaux WHERE soussysteme = 'ANGLOPHONE'
UNION ALL SELECT 'Total Examens', COUNT(*) FROM examens_nationaux
ORDER BY element;

-- Voir examens
SELECT e.nom, e.code, n.nom as niveau, e.soussysteme
FROM examens_nationaux e
JOIN niveaux n ON e."niveauId" = n.id
ORDER BY e.soussysteme, n.ordre;

EOF
```

---

## 🎯 Structure des Fichiers Créés

### Frontend Features (11 nouveaux fichiers)
```
frontend/src/features/
├── filieres/components/
│   ├── filieres-page.tsx (278 lignes)
│   └── filiere-form-modal.tsx (182 lignes)
├── examens-nationaux/components/
│   ├── examens-nationaux-page.tsx (286 lignes)
│   └── examen-national-form-modal.tsx (259 lignes)
├── diplomes-eleves/components/
│   ├── diplomes-eleves-page.tsx (280 lignes)
│   └── diplome-eleve-form-modal.tsx (236 lignes)
└── structure-academique/
    ├── components/
    │   └── structure-academique-page.tsx (256 lignes)
    └── index.ts (9 lignes)

frontend/src/locales/fr/
├── types-cycles.json (47 lignes)
├── filieres.json (50 lignes)
└── examens-nationaux.json (61 lignes)
```

### Backend Corrections (3 fichiers)
```
backend/src/modules/
├── types-cycles/entities/type-cycle.entity.ts
├── filieres/entities/filiere.entity.ts
└── examens-nationaux/entities/examen-national.entity.ts
```

### Documentation (5 fichiers)
```
├── SEED-STRUCTURE-ACADEMIQUE-SUCCES.md
├── STRUCTURE-ACADEMIQUE-COMPLETE-FR-EN.md
├── FRONTEND-STRUCTURE-ACADEMIQUE-PROGRESS.md
├── RESUME-FRONTEND-STRUCTURE-ACADEMIQUE.md
└── IMPLEMENTATION-COMPLETE-STRUCTURE-ACADEMIQUE.md
```

---

## 🔧 Résolution de Problèmes

### Problème : Routes non trouvées
```bash
# Régénérer les routes TanStack
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### Problème : Module non trouvé
```bash
# Vérifier les exports
cat frontend/src/features/filieres/index.ts

# Devrait contenir :
export { FilieresPage } from './components/filieres-page';
```

### Problème : Erreur TypeORM colonnes
```bash
# Vérifier le nom des colonnes en base
PGPASSWORD=elisaschool_password psql -h localhost -p 7002 -U elisaschool_user -d elisaschool -c "\d+ types_cycles"

# Doit correspondre à l'attribut name: dans @Column()
```

---

## 📚 Documentation de Référence

1. **Backend** : Conventions dans `.qoder/rules/elisaschool-conventions.md`
2. **Frontend** : Skill `elisaschool-frontend-dev`
3. **Business Logic** : Skill `elisaschool-business-logic`
4. **Modals** : Utiliser toujours `CustomModal`, jamais d'overlay custom

---

## ✨ Fonctionnalités Clés

### Page Principale Structurée
- ✅ Organisation hiérarchique visuelle
- ✅ 6 cartes avec icônes et couleurs
- ✅ Navigation par clic
- ✅ Information systèmes FR/EN
- ✅ Design responsive

### Pages CRUD
- ✅ DataTable avec pagination
- ✅ Filtres avancés
- ✅ Actions RBAC
- ✅ Badges colorés
- ✅ Animations

### Formulaires
- ✅ CustomModal system
- ✅ Validation
- ✅ Dropdowns liés
- ✅ Création/édition unifiées

---

**Prêt pour intégration** ! Suivre la checklist ci-dessus.
