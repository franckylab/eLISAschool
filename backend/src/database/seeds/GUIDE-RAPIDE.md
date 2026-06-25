# 🚀 Guide Rapide - Seeds eLISAschool

## ⚡ Démarrage Rapide

### 1. Exécuter tous les seeds (Base vide)
```bash
cd backend
npm run seed
```

### 2. Vérifier l'état
```bash
npm run seed:check
```

## 🔑 Comptes de Test

### Super Administrateur
- **Email:** `admin@elisaschool.cm`
- **Mot de passe:** `AdminSecret123!`
- **Rôle:** SUPER_ADMIN
- **Établissements:** ETAB-001 et ETAB-002

### Utilisateurs de Test
Tous les mots de passe sont: `Test123456!`

| Rôle | Email |
|------|-------|
| Admin | `admin.test@elisaschool.cm` |
| Chef Établissement | `chef.etablissement@elisaschool.cm` |
| Proviseur | `proviseur@elisaschool.cm` |
| Enseignant | `enseignant@elisaschool.cm` |
| Parent | `parent@elisaschool.cm` |
| Élève | `eleve@elisaschool.cm` |

### Élèves Exemples
Format email: `eleve.{matricule}@elisaschool.cm`
Exemple: `eleve.elv-2025-001@elisaschool.cm`

## 📊 Données Créées

### Par Établissement
- ✅ 3 années scolaires (2024-2025, 2025-2026, 2026-2027)
- ✅ 4 cycles pédagogiques
- ✅ 28 niveaux (16 FR + 12 EN)
- ✅ 34 classes (1 par niveau)
- ✅ 15 matières
- ✅ ~100 associations matières-niveaux

### Global
- ✅ 2 établissements
- ✅ 39 utilisateurs (1 super admin + 38 test)
- ✅ 34 élèves exemples (uniquement ETAB-001)

## 🎯 Exécution Individuelle

### Seeds Principaux
```bash
# Années scolaires
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-annees-scolaires.ts

# Matières
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-matieres.ts

# Matières-Niveaux
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-matieres-niveaux.ts

# Élèves exemples
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-eleves-exemples.ts
```

### Seeds de Base
```bash
# Établissements
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-etablissement-par-defaut.ts

# Structure académique
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-structure-academique.ts

# Classes
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-classes-par-defaut.ts

# Utilisateurs
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-utilisateurs-par-role.ts
```

## 🔍 Vérification

### Compter les entités
```bash
npm run seed:check
```

### Vérifier dans la base
```sql
-- Établissements
SELECT COUNT(*) FROM etablissements;

-- Années scolaires
SELECT COUNT(*) FROM annees_scolaires;

-- Classes
SELECT COUNT(*) FROM classes;

-- Élèves
SELECT COUNT(*) FROM eleves;

-- Utilisateurs
SELECT COUNT(*) FROM utilisateurs;
```

## 🐛 Dépannage

### Erreur de connexion
```bash
# Vérifier PostgreSQL
pg_isready -h localhost -p 7002

# Vérifier .env
cat .env | grep DB_
```

### Données déjà existantes
Les seeds sont idempotents, ils skip les données existantes. Pas de problème!

### Reset complet
```bash
# 1. Supprimer la base
dropdb elisaschool

# 2. Recréer
createdb elisaschool

# 3. Exécuter les seeds
npm run seed
```

## 📚 Documentation Complète

- **README.md** - Guide complet
- **CHANGELOG.md** - Historique des versions
- **RESUME.md** - Résumé détaillé

## ⚠️ Important

1. **Ordre d'exécution:** Utiliser `npm run seed` ou suivre l'ordre recommandé
2. **Multi-tenant:** Toutes les données sont liées à un établissement
3. **Mots de passe:** Changer en production!
4. **Idempotence:** Peut être exécuté plusieurs fois sans danger

## 🎓 Système Éducatif

### Francophone
- Maternelle: PS, MS, GS
- Primaire: CI, CP, CE1, CE2, CM1, CM2
- Collège: 6ème, 5ème, 4ème, 3ème
- Lycée: Seconde, Première, Terminale

### Anglophone
- Nursery: Nursery 1, Nursery 2
- Primary: STD1 à STD6
- Secondary: FORM1 à FORM5
- High School: Lower 6, Upper 6

## 📞 Support

En cas de problème:
1. Vérifier `npm run seed:check`
2. Consulter les logs
3. Vérifier la documentation
4. Contacter l'équipe de développement

---

**Version:** 5.0.0  
**Dernière mise à jour:** 21 juin 2026
