# 📋 Template - Documentation d'un Nouveau Module

**Nom du Module** : [Nom]  
**Date de Création** : [Date]  
**Version** : 1.0.0  
**Statut** : 🚧 En développement / ✅ Complété

---

## 🎯 Description

[Description courte du module et de son objectif]

---

## 📁 Structure des Fichiers

### Backend

```
backend/src/modules/[module-name]/
├── controllers/
│   ├── [module].controller.ts    # Routes API
│   └── index.ts
├── services/
│   ├── [module].service.ts       # Logique métier
│   └── index.ts
├── entities/
│   ├── [entity].entity.ts        # Entités TypeORM
│   └── index.ts
├── dto/
│   ├── [module].dto.ts           # Schémas Zod
│   └── index.ts
└── index.ts
```

### Frontend

```
frontend/src/features/[module-name]/
├── components/
│   ├── [module]-page.tsx         # Page principale
│   ├── [entity]-form.tsx         # Formulaire
│   └── [entity]-detail-page.tsx  # Page détail
├── hooks/
│   ├── use-[entities].ts         # Hook liste
│   ├── use-[entity].ts           # Hook unité
│   └── use-[entity]-[action].ts  # Hooks CRUD
├── types/
│   └── [entity].types.ts         # Types TypeScript
└── utils/
    └── [entity].schema.ts        # Validation Zod
```

---

## 🔌 API Endpoints

| Méthode | Route | Description | Auth | Rôles |
|---------|-------|-------------|------|-------|
| GET | `/api/[module]` | Liste paginée | ✅ | ADMIN, PERSONNEL |
| GET | `/api/[module]/:id` | Détail | ✅ | ADMIN, PERSONNEL |
| POST | `/api/[module]` | Création | ✅ | ADMIN |
| PATCH | `/api/[module]/:id` | Modification | ✅ | ADMIN, PERSONNEL |
| DELETE | `/api/[module]/:id` | Suppression | ✅ | ADMIN |

---

## 🗂️ Entités

### [NomEntité]

**Table** : `[nom_table]`

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| `id` | uuid | Non | Identifiant unique |
| `nom` | varchar(100) | Non | Nom |
| `createdAt` | timestamp | Non | Date création |
| `updatedAt` | timestamp | Non | Date modification |

---

## 🎨 Composants Frontend

### [Module]Page

**Chemin** : `/[route]`

**Fonctionnalités** :
- ✅ Tableau paginé avec DataTable
- ✅ Filtres avancés
- ✅ Actions CRUD
- ✅ Export CSV

### [Entity]Form

**Type** : Modal / Page

**Étapes** (si multi-étapes) :
1. [Étape 1] - [Description]
2. [Étape 2] - [Description]
3. [Étape 3] - [Description]

### [Entity]DetailPage

**Chemin** : `/[route]/:id`

**Onglets** :
1. ℹ️ Informations
2. 📊 Statistiques
3. 📜 Historique

---

## 🔐 Permissions RBAC

| Permission | ADMIN | PERSONNEL | ENSEIGNANT |
|-----------|-------|-----------|------------|
| `[module]:view` | ✅ | ✅ | ✅ |
| `[module]:create` | ✅ | ✅ | ❌ |
| `[module]:edit` | ✅ | ✅ | ❌ |
| `[module]:delete` | ✅ | ❌ | ❌ |
| `[module]:export` | ✅ | ✅ | ❌ |

---

## 🧪 Tests

### Tests à Exécuter

- [ ] **Test 1** : Création d'une entité
- [ ] **Test 2** : Modification
- [ ] **Test 3** : Suppression
- [ ] **Test 4** : Liste avec filtres
- [ ] **Test 5** : Export CSV
- [ ] **Test 6** : Permissions RBAC
- [ ] **Test 7** : Multi-tenancy
- [ ] **Test 8** : Responsive mobile

---

## 📝 Notes d'Implémentation

### Backend

```typescript
// Exemple de service
export class [Module]Service {
    async create(dto: CreateDto): Promise<Entity> {
        // Logique métier
    }
}
```

### Frontend

```typescript
// Exemple de hook
export function useEntities() {
    return useQuery({
        queryKey: ['entities'],
        queryFn: () => apiClient.get('/entities')
    });
}
```

---

## 🔗 Dépendances

### Backend
- `@modules/auth` - Authentification
- `@modules/[autre]` - [Description]

### Frontend
- `@/lib/api-client` - Client API
- `@/components/ui/DataTable` - Tableau
- `@/hooks/use-pagination` - Pagination

---

## 🐛 Problèmes Connus

| Problème | Statut | Workaround |
|----------|--------|------------|
| [Description] | 🚧 Open / ✅ Fixed | [Solution] |

---

## 📈 Améliorations Futures

- [ ] [Amélioration 1]
- [ ] [Amélioration 2]
- [ ] [Amélioration 3]

---

## 📚 Documentation Liée

- [`README-MODULE-*.md`](../README-MODULE-*.md) - Documentation d'autres modules
- [`GUIDE-TEST-*.md`](../GUIDE-TEST-*.md) - Guides de test
- [Conventions de code](../.qoder/rules/elisaschool-conventions.md)

---

*Dernière mise à jour : [Date]*  
*Version : 1.0.0*  
*eLISAschool - Système de Gestion Scolaire*
