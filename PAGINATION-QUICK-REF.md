# 🚀 Pagination eLISAschool v2.0 - Quick Reference

## 📦 Installation (Aucune)

Le système est déjà intégré. Importez simplement :

```typescript
import { paginationSchema } from '@common/dto/pagination.dto';
import { paginateWithQueryBuilder } from '@common/utils/pagination.util';
import { sendPaginatedV2 } from '@common/utils/api-response.util';
```

---

## 🎯 Utilisation en 3 Étapes

### 1. DTO

```typescript
import { paginationSchema, searchSchema } from '@common/dto/pagination.dto';

export const querySchema = paginationSchema
    .merge(searchSchema)
    .extend({
        // vos filtres ici
        statut: z.string().optional(),
    });
```

### 2. Service

```typescript
import { paginateWithQueryBuilder } from '@common/utils/pagination.util';

async findAll(query: QueryDto) {
    const { page, limit, search } = query;
    
    const qb = this.repo.createQueryBuilder('e')
        .where('e.actif = true');
    
    if (search) {
        qb.andWhere('e.nom ILIKE :search', { search: `%${search}%` });
    }
    
    // useOptimizedCount = true si JOINs, false sinon
    return paginateWithQueryBuilder(qb, page, limit, true);
}
```

### 3. Controller

```typescript
import { sendPaginatedV2 } from '@common/utils/api-response.util';

router.get('/', async (req, res) => {
    const query = querySchema.parse(req.query);
    const result = await service.findAll(query);
    sendPaginatedV2(res, result);
});
```

---

## 📊 Format de Réponse

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "currentPage": 1,
    "itemsPerPage": 20,
    "totalItems": 100,
    "totalPages": 5,
    "itemCount": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## ⚡ Performance

| Situation | Paramètre | Gain |
|-----------|-----------|------|
| Requêtes avec JOINs | `useOptimizedCount = true` | **5-10x** |
| Pagination en mémoire | Utiliser QueryBuilder | **95% mémoire** |
| Grosses tables | `paginateWithCustomCount()` | **Ultra-rapide** |

---

## 🔒 Sécurité Automatique

- ✅ Page : `≥ 1`
- ✅ Limit : `1-100`
- ✅ Validation : Zod stricte
- ✅ Tri : Liste blanche obligatoire

---

## 📚 Resources

- **Guide Complet :** `backend/docs/pagination-guide.md`
- **Exemples :** `backend/src/common/examples/pagination-examples.ts`
- **Rapport :** `RAPPORT-PAGINATION-IMPROVEMENTS.md`
- **Vérification :** `bash backend/scripts/verify-pagination.sh`

---

## 🆘 Dépannage Rapide

| Problème | Solution |
|----------|----------|
| "COUNT lent" | `useOptimizedCount = true` |
| "Limite ignorée" | Max = 100 (configurable) |
| "Page vide" | Vérifier `page > totalPages` |
| "Erreur tri" | Utiliser liste blanche |

---

**Version :** 2.0.0 | **Date :** 6 juin 2026
