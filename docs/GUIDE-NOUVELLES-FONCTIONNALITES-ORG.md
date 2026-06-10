# Guide des Nouvelles Fonctionnalités - Organisation v1.1.0

> **Date**: 9 Juin 2026  
> **Version**: 1.1.0  
> **Statut**: ✅ Production Ready

---

## 🎯 Nouvelles Fonctionnalités

### 1. Validation d'Arborescence

**Route** : `GET /api/organisation/valider-arborescence/:organisationId`

**Objectif** : Vérifier la cohérence complète de la structure organisationnelle

**Exemple d'utilisation** :

```bash
curl -X GET \
  'http://localhost:3000/api/organisation/valider-arborescence/UUID-ORGANISATION' \
  -H 'Authorization: Bearer VOTRE_TOKEN'
```

**Réponse** :

```json
{
  "success": true,
  "data": {
    "valide": false,
    "erreurs": [
      "Cycle détecté dans la branche de l'unité Direction",
      "L'unité Sciences référence un parent inexistant (abc-123)",
      "Code en double: DEP-SCI (2 occurrences)"
    ],
    "avertissements": [
      "L'unité Lettres n'a aucun poste défini",
      "L'unité Sports n'a aucun poste défini"
    ],
    "statistiques": {
      "totalUnites": 15,
      "totalPostes": 42,
      "unitesSansPoste": 2,
      "profondeurMax": 4
    }
  }
}
```

**Cas d'usage** :
- ✅ Avant de générer un organigramme
- ✅ Après des modifications massives
- ✅ Pour diagnostiquer des problèmes
- ✅ Intégration CI/CD (validation automatique)

---

### 2. Pagination sur les Listes

**Routes supportées** :
- `GET /api/organisation/organisations?page=1&limit=20`
- `GET /api/organisation/unites?page=1&limit=20&organisationId=XXX`

**Exemple** :

```bash
# Page 1, 20 résultats
curl -X GET \
  'http://localhost:3000/api/organisation/unites?page=1&limit=20' \
  -H 'Authorization: Bearer VOTRE_TOKEN'
```

**Réponse** :

```json
{
  "success": true,
  "data": [
    { "id": "...", "nom": "Direction", "code": "DIR", ... },
    // ... 19 autres unités
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Exemple TypeScript/React** :

```typescript
interface PaginationResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

async function loadUnites(page: number = 1, limit: number = 20) {
  const response = await fetch(
    `/api/organisation/unites?page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  const result: PaginationResponse<UniteOrganisationnelle> = await response.json();
  
  return result;
}

// Utilisation dans un composant React
function ListeUnites() {
  const [page, setPage] = useState(1);
  const [unites, setUnites] = useState([]);
  const [pagination, setPagination] = useState(null);
  
  useEffect(() => {
    loadUnites(page, 20).then(result => {
      setUnites(result.data);
      setPagination(result.pagination);
    });
  }, [page]);
  
  return (
    <div>
      {unites.map(unite => (
        <UniteCard key={unite.id} unite={unite} />
      ))}
      
      <Pagination>
        <button 
          disabled={!pagination?.hasPrev}
          onClick={() => setPage(p => p - 1)}
        >
          Précédent
        </button>
        
        <span>Page {pagination?.page} / {pagination?.totalPages}</span>
        
        <button 
          disabled={!pagination?.hasNext}
          onClick={() => setPage(p => p + 1)}
        >
          Suivant
        </button>
      </Pagination>
    </div>
  );
}
```

---

### 3. Détection de Cycles Améliorée

**Fonctionnement** : Détection automatique lors de la création/modification de hiérarchies

**Exemple** :

```typescript
// Création d'une relation hiérarchique
try {
  await fetch('/api/organisation/hierarchie', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      personnelId: 'personnel-A',
      superieurId: 'personnel-B',
      typeRelation: 'SUPERVISE_DIRECT',
    }),
  });
} catch (error) {
  // Si cycle détecté
  if (error.code === 'HIERARCHIE_CYCLE') {
    console.error('❌ Cycle détecté:', error.message);
    // "Cycle hiérarchique détecté : ce supérieur est déjà subordonné 
    // (directement ou indirectement) à cette personne"
  }
}
```

**Types de cycles détectés** :

| Type | Exemple | Détecté |
|------|---------|---------|
| **Direct** | A supervise B, B supervise A | ✅ Oui |
| **Indirect (2 niveaux)** | A→B→C→A | ✅ Oui |
| **Indirect (N niveaux)** | A→B→C→D→...→A | ✅ Oui |
| **Auto-référence** | A supervise A | ✅ Oui |

---

### 4. Sécurité Multi-Tenancy Renforcée

**Fonctionnement** : Toutes les routes de lecture vérifient maintenant l'appartenance à l'établissement

**Exemple de protection** :

```typescript
// ❌ AVANT : Un utilisateur d'établissement A pouvait accéder aux données de B
GET /api/organisation/organisations/UUID-ETABLISSEMENT-B
// → Retournait les données (FAILLE DE SÉCURITÉ)

// ✅ APRÈS : Vérification automatique
GET /api/organisation/organisations/UUID-ETABLISSEMENT-B
// → Retourne 404 NOT_FOUND si l'organisation n'appartient pas à l'établissement de l'utilisateur
```

**Routes protégées** (6 routes) :
1. `GET /organisations/:id`
2. `GET /unites/:id`
3. `GET /postes/:id`
4. `GET /arborescence/:organisationId`
5. `GET /statistiques/:organisationId`
6. `GET /organigramme/:organisationId`

---

### 5. Vérification Avant Suppression

**Fonctionnement** : Empêche la suppression d'une organisation avec des unités actives

**Exemple** :

```bash
# Tentative de suppression avec unités actives
curl -X DELETE \
  'http://localhost:3000/api/organisation/organisations/UUID-ORG' \
  -H 'Authorization: Bearer VOTRE_TOKEN'
```

**Réponse en cas d'unités actives** :

```json
{
  "success": false,
  "error": {
    "code": "ORGANISATION_HAS_ACTIVE_UNITES",
    "message": "Impossible de supprimer : 5 unité(s) active(s). Archivez d'abord les unités."
  },
  "timestamp": "2026-06-09T10:30:00.000Z",
  "path": "/api/organisation/organisations/UUID-ORG"
}
```

**Workflow correct** :

```bash
# 1. Archiver toutes les unités
PATCH /api/organisation/unites/UUID-UNITE
{ "actif": false }

# 2. Supprimer l'organisation
DELETE /api/organisation/organisations/UUID-ORG
# → Succès
```

---

## 🚀 Optimisations de Performance

### Comparatif Avant/Après

| Opération | Avant | Après | Gain |
|-----------|-------|-------|------|
| **Organigramme (100 unités)** | 101 requêtes SQL | 2 requêtes SQL | **98% ↓** |
| **Chemin hiérarchique (prof. 10)** | 10 requêtes SQL | 2 requêtes SQL | **80% ↓** |
| **Liste (1000 unités)** | Tout charger (timeout) | Paginé (20) | **98% ↓** |
| **Détection cycles** | 50% coverage | 100% coverage | **2x** plus sûr |

### Exemple : Temps de Réponse

```
AVANT (100 unités):
- getOrganigramme: ~2500ms (101 requêtes × 25ms)

APRÈS (100 unités):
- getOrganigramme: ~50ms (2 requêtes × 25ms)

GAIN: 50x plus rapide! 🚀
```

---

## 📋 Migration des Index

**Fichier** : `database/migrations/045-organisation-optimisations.sql`

**Index créés** (6) :

| Index | Type | Colonnes | Usage |
|-------|------|----------|-------|
| `idx_unites_code_unique` | UNIQUE | (code, organisationId) | Unicité des codes par org |
| `idx_postes_code_unique` | UNIQUE | (code, uniteOrganisationnelleId) | Unicité des codes par unité |
| `idx_unites_statut` | STANDARD | statut | Filtres par statut |
| `idx_postes_occupant` | PARTIAL | occupantId WHERE NOT NULL | Postes occupés |
| `idx_hierarchie_personnel_etablissement` | PARTIAL | (personnelId, etablissementId) | Recherche hiérarchie |
| `idx_hierarchie_superieur_etablissement` | PARTIAL | (superieurId, etablissementId) | Subordonnés |

**Application** :

```bash
# Via script automatisé
./scripts/deploy-organisation-v1.1.sh

# OU manuellement
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE \
  -f database/migrations/045-organisation-optimisations.sql
```

---

## 🔧 Intégration Backend

### Service - Nouvelles Méthodes

```typescript
import { organisationService } from '@modules/organisation/services';

// Pagination
const { data, total } = await organisationService.findAllOrganisationsPaginated(
  page: 1,
  limit: 20,
  etablissementId?: string
);

// Validation d'arborescence
const validation = await organisationService.validerArborescence(
  organisationId: string
);
// Retourne: { valide, erreurs, avertissements, statistiques }

// Compter unités actives
const count = await organisationService.countUnitesActives(
  organisationId: string
);
```

### Controller - Nouvelles Routes

```typescript
import { organisationController } from '@modules/organisation/controllers';

// Montage dans app.ts
app.use('/api/organisation', organisationController);

// Routes disponibles:
// GET    /api/organisation/organisations?page=1&limit=20
// GET    /api/organisation/unites?page=1&limit=20
// GET    /api/organisation/valider-arborescence/:organisationId
// ... et toutes les autres routes existantes
```

---

## ✅ Checklist d'Intégration Frontend

### React/Vue/Angular

- [ ] **Utiliser la pagination** sur les listes d'unités et organisations
- [ ] **Afficher les métadonnées de pagination** (page X/Y, boutons prev/next)
- [ ] **Appeler la validation** avant de générer un organigramme
- [ ] **Gérer les erreurs de cycle** avec des messages explicites
- [ ] **Afficher les avertissements** de validation (unités sans poste)
- [ ] **Désactiver le bouton supprimer** si unités actives (ou afficher modal d'explication)

### Exemple React Complet

```typescript
import { useState, useEffect } from 'react';

interface Unite {
  id: string;
  nom: string;
  code: string;
  actif: boolean;
}

interface ValidationData {
  valide: boolean;
  erreurs: string[];
  avertissements: string[];
  statistiques: {
    totalUnites: number;
    totalPostes: number;
    unitesSansPoste: number;
    profondeurMax: number;
  };
}

function OrganigrammePage({ organisationId }: { organisationId: string }) {
  const [validation, setValidation] = useState<ValidationData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const validerArborescence = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/organisation/valider-arborescence/${organisationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await response.json();
      setValidation(result.data);
    } catch (error) {
      console.error('Erreur validation:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    validerArborescence();
  }, [organisationId]);
  
  if (loading) return <div>Validation en cours...</div>;
  
  if (!validation?.valide) {
    return (
      <div className="alert alert-error">
        <h3>⚠️ Arborescence invalide</h3>
        
        {validation?.erreurs.map((erreur, i) => (
          <div key={i} className="error">❌ {erreur}</div>
        ))}
        
        {validation?.avertissements.map((avert, i) => (
          <div key={i} className="warning">⚠️ {avert}</div>
        ))}
        
        <button onClick={validerArborescence}>Réessayer</button>
      </div>
    );
  }
  
  return (
    <div>
      <h2>✅ Arborescence valide</h2>
      <p>
        {validation.statistiques.totalUnites} unités,
        {validation.statistiques.totalPostes} postes,
        profondeur max: {validation.statistiques.profondeurMax}
      </p>
      
      {/* Afficher l'organigramme */}
      <Organigramme organisationId={organisationId} />
    </div>
  );
}
```

---

## 📊 Monitoring

### Métriques à Suivre

| Métrique | Seuil | Action |
|----------|-------|--------|
| **Temps de réponse getOrganigramme** | < 100ms | Optimiser si > 100ms |
| **Temps de réponse liste unités** | < 200ms | Réduire limit si > 200ms |
| **Taux de validation réussie** | > 95% | Investiguer si < 95% |
| **Erreurs HIERARCHIE_CYCLE** | < 1% | Former les utilisateurs si > 1% |

### Logs Importants

```typescript
// Logs générés automatiquement
logger.info('Organisation supprimée', { organisationId });
logger.info('Unité créée', { uniteId, code, organisationId });
logger.info('Poste modifié', { posteId, intitule });

// À ajouter pour monitoring
logger.info('Validation arborescence', {
  organisationId,
  valide: validation.valide,
  erreurs: validation.erreurs.length,
  duree: Date.now() - startTime,
});
```

---

## 🎓 Bonnes Pratiques

### 1. Toujours Valider Avant d'Afficher

```typescript
// ❌ Afficher directement
const organigramme = await getOrganigramme(id);

// ✅ Valider d'abord
const validation = await validerArborescence(id);
if (!validation.valide) {
  afficherErreurs(validation.erreurs);
  return;
}
const organigramme = await getOrganigramme(id);
```

### 2. Utiliser la Pagination Systématiquement

```typescript
// ❌ Charger tout
const toutesUnites = await fetch('/api/organisation/unites');

// ✅ Paginer
const unites = await fetch('/api/organisation/unites?page=1&limit=50');
```

### 3. Gérer les Erreurs de Cycle

```typescript
try {
  await creerHierarchie(personnelId, superieurId);
} catch (error) {
  if (error.code === 'HIERARCHIE_CYCLE') {
    showMessage(
      '❌ Cette relation créerait un cycle hiérarchique. ' +
      'Vérifiez la chaîne de supervision.'
    );
  }
}
```

### 4. Vérifier Avant Suppression

```typescript
// Vérifier d'abord
const unitesActives = await countUnitesActives(organisationId);
if (unitesActives > 0) {
  if (!confirm(
    `Cette organisation contient ${unitesActives} unité(s) active(s). ` +
    `Voulez-vous vraiment la supprimer?`
  )) {
    return;
  }
}

// Puis supprimer
await deleteOrganisation(organisationId);
```

---

## 🔮 Prochaines Améliorations (Roadmap)

| Fonctionnalité | Priorité | ETA |
|----------------|----------|-----|
| **Cache Redis** pour arborescence | Haute | v1.2.0 |
| **Export PDF** organigramme | Moyenne | v1.2.0 |
| **Notifications** postes vacants | Moyenne | v1.3.0 |
| **Historique des mouvements** | Basse | v1.3.0 |
| **Clonage d'unité** | Basse | v1.4.0 |

---

## 📞 Support

- **Documentation complète** : `docs/MODULE-ORGANISATION.md`
- **Guide de démarrage** : `docs/QUICKSTART-ORGANISATION.md`
- **Améliorations détaillées** : `AMELIORATIONS-ORGANISATION-v1.1.md`
- **Script de déploiement** : `scripts/deploy-organisation-v1.1.sh`

---

**Version** : 1.1.0  
**Date** : 9 Juin 2026  
**Statut** : ✅ **PRODUCTION READY** 🚀
