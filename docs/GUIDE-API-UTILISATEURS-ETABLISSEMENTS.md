# Guide API - Gestion Multi-Établissements des Utilisateurs

> **Version**: 1.0.0  
> **Auteur**: Franck Arlos Chendjou  
> **Date**: 18 Juin 2026  
> **Statut**: ✅ Implémenté et Testé

---

## 📋 Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Endpoints API](#endpoints-api)
4. [Hooks Frontend](#hooks-frontend)
5. [Exemples d'Utilisation](#exemples-dutilisation)
6. [Tests](#tests)
7. [Permissions RBAC](#permissions-rbac)

---

## Vue d'ensemble

Ce module permet la gestion complète des affectations d'utilisateurs à plusieurs établissements avec :

- ✅ **Assignation multi-établissements** : Un utilisateur peut travailler dans plusieurs établissements
- ✅ **Rôles par établissement** : Le rôle peut varier selon l'établissement
- ✅ **Établissement principal** : Un établissement de référence par utilisateur
- ✅ **Filtrage intelligent** : Exclusion des utilisateurs déjà assignés
- ✅ **Permissions fines** : Contrôle d'accès basé sur les permissions RBAC

---

## Architecture

### Tables de Base de Données

```
utilisateurs
├── id (UUID)
├── email (unique)
├── matricule (unique)
├── role (enum)
├── statut (enum)
└── etablissementId (UUID, nullable)

utilisateur_etablissements (table de jointure)
├── utilisateurId (FK)
├── etablissementId (FK)
├── role (enum)
├── etablissementPrincipal (boolean)
├── actif (boolean)
├── dateDebut (timestamp)
├── dateFin (timestamp, nullable)
└── motif (text, nullable)
```

### Fichiers Backend

```
backend/src/
├── modules/
│   ├── auth/
│   │   ├── controllers/
│   │   │   └── utilisateur-etablissement.controller.ts  # Routes API
│   │   ├── services/
│   │   │   └── utilisateur-etablissement.service.ts     # Logique métier
│   │   └── entities/
│   │       └── utilisateur-etablissement.entity.ts      # Entité TypeORM
│   └── utilisateurs/
│       ├── controllers/
│       │   └── utilisateurs.controller.ts               # CRUD utilisateurs
│       ├── services/
│       │   └── utilisateurs.service.ts                  # Service avec exclureEtablissement
│       └── dto/
│           └── utilisateur.dto.ts                       # Schémas Zod
```

### Fichiers Frontend

```
frontend/src/
├── features/
│   └── utilisateurs/
│       ├── hooks/
│       │   └── use-utilisateurs.ts                      # Hooks TanStack Query
│       └── types/
│           └── utilisateur.types.ts                     # Types TypeScript
```

---

## Endpoints API

### 1. Lister les Utilisateurs avec Filtre

**Endpoint**: `GET /api/utilisateurs`

**Paramètres de Requête** :

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `page` | number | Non | Numéro de page (défaut: 1) |
| `limit` | number | Non | Éléments par page (défaut: 20, max: 100) |
| `search` | string | Non | Recherche par email ou matricule |
| `role` | string | Non | Filtrer par rôle (peut être une liste CSV) |
| `statut` | string | Non | Filtrer par statut (ACTIF, INACTIF, SUSPENDU) |
| `etablissementId` | UUID | Non | Filtrer par établissement |
| **`exclureEtablissement`** | **UUID** | **Non** | **Exclure les utilisateurs déjà assignés à cet établissement** |
| `sortBy` | string | Non | Champ de tri (createdAt, email, matricule, etc.) |
| `sortOrder` | string | Non | Ordre de tri (ASC, DESC) |

**Exemple** :

```bash
# Obtenir les utilisateurs NON assignés à l'établissement X
GET /api/utilisateurs?exclureEtablissement=550e8400-e29b-41d4-a716-446655440000&limit=50

# Filtrer par rôle ET exclure un établissement
GET /api/utilisateurs?role=ENSEIGNANT&exclureEtablissement=550e8400-e29b-41d4-a716-446655440000
```

**Réponse** :

```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "email": "jean.dupont@example.com",
      "matricule": "EL-2024-0001",
      "role": "ENSEIGNANT",
      "statut": "ACTIF",
      "profil": {
        "nom": "Dupont",
        "prenom": "Jean",
        "telephone": "+237612345678"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalItems": 120,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Permission requise** : Utilisateur authentifié

---

### 2. Assigner un Utilisateur à un Établissement

**Endpoint**: `POST /api/utilisateurs/:id/etablissements`

**Paramètres d'URL** :

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | UUID | ID de l'utilisateur |

**Body** :

```json
{
  "etablissementId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "ENSEIGNANT",
  "etablissementPrincipal": false,
  "dateDebut": "2024-01-01T00:00:00.000Z",
  "dateFin": "2024-12-31T23:59:59.999Z",
  "motif": "Remplacement temporaire"
}
```

**Réponse** :

```json
{
  "success": true,
  "message": "Utilisateur assigné avec succès",
  "data": {
    "utilisateurId": "user-uuid",
    "etablissementId": "etab-uuid",
    "role": "ENSEIGNANT",
    "etablissementPrincipal": false,
    "actif": true,
    "dateDebut": "2024-01-01T00:00:00.000Z",
    "dateFin": "2024-12-31T23:59:59.999Z",
    "motif": "Remplacement temporaire"
  }
}
```

**Codes d'Erreur** :

| Code HTTP | Code Erreur | Description |
|-----------|-------------|-------------|
| 400 | `INVALID_ROLE` | Rôle invalide |
| 400 | `INVALID_DATA` | Données invalides |
| 404 | `NOT_FOUND` | Utilisateur ou établissement non trouvé |
| 409 | `ALREADY_ASSIGNED` | Utilisateur déjà assigné à cet établissement |
| 409 | `ELEVE_MULTI_ETABLISSEMENT_NOT_ALLOWED` | Un élève ne peut être que dans un seul établissement |
| 409 | `MAX_ETABLISSEMENTS_REACHED` | Nombre max d'établissements atteint pour ce rôle |
| 403 | `INSUFFICIENT_PERMISSIONS` | Permission `utilisateurs:manage` requise |

**Permission requise** : `utilisateurs:manage`

---

### 3. Changer le Rôle dans un Établissement

**Endpoint**: `PATCH /api/utilisateurs/:id/etablissements/:etablissementId/role`

**Paramètres d'URL** :

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | UUID | ID de l'utilisateur |
| `etablissementId` | UUID | ID de l'établissement |

**Body** :

```json
{
  "role": "ADMIN"
}
```

**Réponse** :

```json
{
  "success": true,
  "message": "Rôle mis à jour avec succès",
  "data": {
    "utilisateurId": "user-uuid",
    "etablissementId": "etab-uuid",
    "role": "ADMIN",
    "etablissementPrincipal": true,
    "actif": true
  }
}
```

**Codes d'Erreur** :

| Code HTTP | Code Erreur | Description |
|-----------|-------------|-------------|
| 400 | `INVALID_ROLE` | Rôle invalide |
| 404 | `NOT_FOUND` | Affectation non trouvée |
| 403 | `INSUFFICIENT_PERMISSIONS` | Permission requise |

**Permission requise** : `utilisateurs:manage`

---

### 4. Définir l'Établissement Principal

**Endpoint**: `PATCH /api/utilisateurs/:id/etablissements/:etablissementId/principal`

**Paramètres d'URL** :

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | UUID | ID de l'utilisateur |
| `etablissementId` | UUID | ID de l'établissement |

**Body** : Aucun (vide)

**Réponse** :

```json
{
  "success": true,
  "message": "Établissement principal défini avec succès"
}
```

**Effets** :

- Définit `etablissementPrincipal = true` pour cette affectation
- Définit `etablissementPrincipal = false` pour toutes les autres affectations de l'utilisateur

**Codes d'Erreur** :

| Code HTTP | Code Erreur | Description |
|-----------|-------------|-------------|
| 404 | `NOT_FOUND` | Affectation non trouvée |
| 403 | `INSUFFICIENT_PERMISSIONS` | Permission requise |

**Permission requise** : `utilisateurs:manage`

---

### 5. Retirer un Utilisateur d'un Établissement

**Endpoint**: `DELETE /api/utilisateurs/:id/etablissements/:etablissementId`

**Paramètres d'URL** :

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | UUID | ID de l'utilisateur |
| `etablissementId` | UUID | ID de l'établissement |

**Body** : Aucun

**Réponse** :

```json
{
  "success": true,
  "message": "Utilisateur retiré de l'établissement"
}
```

**Effets** :

- **Suppression logique** : `actif = false` (soft delete)
- L'utilisateur conserve son accès aux autres établissements
- L'historique est préservé pour l'audit

**Codes d'Erreur** :

| Code HTTP | Code Erreur | Description |
|-----------|-------------|-------------|
| 404 | `NOT_FOUND` | Affectation non trouvée |
| 400 | `LAST_ETABLISSEMENT` | Impossible de retirer le dernier établissement |
| 403 | `INSUFFICIENT_PERMISSIONS` | Permission requise |

**Permission requise** : `utilisateurs:manage`

---

## Hooks Frontend

### 1. `useUtilisateursDisponibles`

**Usage** : Lister les utilisateurs NON assignés à un établissement

```typescript
import { useUtilisateursDisponibles } from '@/features/utilisateurs/hooks/use-utilisateurs';

function ModalAssignation({ etablissementId }) {
  const { data, isLoading, error } = useUtilisateursDisponibles(etablissementId);
  
  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur</div>;
  
  return (
    <ul>
      {data?.items.map(user => (
        <li key={user.id}>{user.profil.prenom} {user.profil.nom}</li>
      ))}
    </ul>
  );
}
```

**Invalider le cache** :

Le cache est automatiquement invalidé lors des mutations (assignation, retrait).

---

### 2. `useAffecterUtilisateurEtablissement`

**Usage** : Assigner un utilisateur

```typescript
import { useAffecterUtilisateurEtablissement } from '@/features/utilisateurs/hooks/use-utilisateurs';

function AssignerUtilisateur({ etablissementId }) {
  const mutation = useAffecterUtilisateurEtablissement(etablissementId);
  
  const handleAssigner = async (utilisateurId) => {
    await mutation.mutateAsync({
      utilisateurId,
      etablissementId,
      role: 'ENSEIGNANT',
      etablissementPrincipal: false,
    });
  };
  
  return (
    <button onClick={handleAssigner} disabled={mutation.isPending}>
      {mutation.isPending ? 'Assignation...' : 'Assigner'}
    </button>
  );
}
```

---

### 3. `useChangerRoleEtablissement`

**Usage** : Changer le rôle d'un utilisateur dans un établissement

```typescript
import { useChangerRoleEtablissement } from '@/features/utilisateurs/hooks/use-utilisateurs';

function ChangerRole({ utilisateurId, etablissementId }) {
  const mutation = useChangerRoleEtablissement(etablissementId);
  
  const handleChanger = async () => {
    await mutation.mutateAsync({
      utilisateurId,
      etablissementId,
      nouveauRole: 'ADMIN',
    });
  };
  
  return <button onClick={handleChanger}>Promouvoir Admin</button>;
}
```

---

### 4. `useDefinirEtablissementPrincipal`

**Usage** : Définir l'établissement principal

```typescript
import { useDefinirEtablissementPrincipal } from '@/features/utilisateurs/hooks/use-utilisateurs';

function DefinirPrincipal({ utilisateurId, etablissementId }) {
  const mutation = useDefinirEtablissementPrincipal();
  
  const handleDefinir = async () => {
    await mutation.mutateAsync({ utilisateurId, etablissementId });
  };
  
  return <button onClick={handleDefinir}>Définir comme principal</button>;
}
```

---

### 5. `useRetirerUtilisateurEtablissement`

**Usage** : Retirer un utilisateur d'un établissement

```typescript
import { useRetirerUtilisateurEtablissement } from '@/features/utilisateurs/hooks/use-utilisateurs';

function RetirerUtilisateur({ utilisateurId, etablissementId }) {
  const mutation = useRetirerUtilisateurEtablissement(etablissementId);
  
  const handleRetirer = async () => {
    if (confirm('Retirer cet utilisateur ?')) {
      await mutation.mutateAsync({ utilisateurId });
    }
  };
  
  return <button onClick={handleRetirer}>Retirer</button>;
}
```

---

## Exemples d'Utilisation

### Scénario 1 : Assigner un Enseignant à Plusieurs Établissements

```bash
# 1. Créer l'utilisateur
POST /api/utilisateurs
{
  "email": "prof@example.com",
  "motDePasse": "SecurePass123!",
  "role": "ENSEIGNANT",
  "nom": "Dupont",
  "prenom": "Jean"
}

# 2. Assigner à l'établissement A (principal)
POST /api/utilisateurs/{userId}/etablissements
{
  "etablissementId": "etab-a-uuid",
  "role": "ENSEIGNANT",
  "etablissementPrincipal": true
}

# 3. Assigner à l'établissement B (secondaire)
POST /api/utilisateurs/{userId}/etablissements
{
  "etablissementId": "etab-b-uuid",
  "role": "ENSEIGNANT",
  "etablissementPrincipal": false
}

# 4. Promouvoir dans l'établissement B
PATCH /api/utilisateurs/{userId}/etablissements/{etabBId}/role
{
  "role": "ADMIN"
}
```

---

### Scénario 2 : Interface d'Assignation en Masse

```typescript
// Modal d'assignation multi-utilisateurs
function ModalAssignationMultiple({ etablissementId }) {
  const { data: utilisateursDisponibles } = useUtilisateursDisponibles(etablissementId);
  const mutation = useAffecterUtilisateurEtablissement(etablissementId);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const handleAssignerMultiple = async () => {
    for (const userId of selectedUsers) {
      await mutation.mutateAsync({
        utilisateurId: userId,
        etablissementId,
        role: 'ENSEIGNANT',
      });
    }
    toast.success(`${selectedUsers.length} utilisateurs assignés`);
  };
  
  return (
    <CustomModal open={isOpen} onOpenChange={setIsOpen} title="Assigner des utilisateurs">
      <DataTable
        data={utilisateursDisponibles?.items || []}
        onSelect={setSelectedUsers}
      />
      <button onClick={handleAssignerMultiple}>
        Assigner {selectedUsers.length} utilisateur(s)
      </button>
    </CustomModal>
  );
}
```

---

## Tests

### Tests Unitaires Backend

```bash
# Exécuter les tests
cd backend
npm test

# Tests spécifiques
npm test -- utilisateur-etablissement.service.test.ts
npm test -- utilisateurs.service.test.ts

# Avec couverture
npm run test:coverage
```

**Fichiers de test** :

- `backend/test/services/utilisateur-etablissement.service.test.ts`
- `backend/test/services/utilisateurs.service.test.ts`

### Tests Manuels avec cURL

```bash
# Script de test automatisé
cd /mnt/DONNEES/projets/eLISAschool
export API_TOKEN='votre-jwt-token'
bash scripts/test-endpoints-utilisateurs.sh
```

**Voir le script complet** : [`scripts/test-endpoints-utilisateurs.sh`](../../scripts/test-endpoints-utilisateurs.sh)

---

## Permissions RBAC

### Rôle `utilisateurs:manage`

Cette permission contrôle l'accès à toutes les opérations d'écriture sur les affectations :

| Opération | Permission | Méthode |
|-----------|-----------|---------|
| Assigner un utilisateur | `utilisateurs:manage` | `requirePermission()` |
| Changer le rôle | `utilisateurs:manage` | `requirePermission()` |
| Définir principal | `utilisateurs:manage` | `requirePermission()` |
| Retirer un utilisateur | `utilisateurs:manage` | `requirePermission()` |
| Lister les utilisateurs | Authentification simple | - |

### Rôles par Défaut avec cette Permission

| Rôle | Permission `utilisateurs:manage` |
|------|----------------------------------|
| `SUPER_ADMIN` | ✅ Oui (toujours) |
| `ADMIN` | ✅ Oui (dans son établissement) |
| `CHEF_ETABLISSEMENT` | ✅ Oui (dans son établissement) |
| `ENSEIGNANT` | ❌ Non |
| `PARENT` | ❌ Non |

### Vérification des Permissions

Le middleware `checkPermission()` vérifie :

1. **Authentification** : L'utilisateur est-il connecté ?
2. **Résolution des permissions** : Chargement depuis la base (avec cache Redis)
3. **Vérification** : La permission est-elle dans le set de l'utilisateur ?
4. **Multi-tenant** : L'utilisateur a-t-il accès à cet établissement ?

```typescript
// Exemple dans le controller
router.patch(
    '/:id/etablissements/:etablissementId/role',
    checkPermission('utilisateurs:manage'),  // ← Middleware de permission
    async (req: Request, res: Response, next: NextFunction) => {
        // Handler sécurisé
    }
);
```

---

## Bonnes Pratiques

### 1. Gestion des Erreurs

```typescript
try {
    await mutation.mutateAsync(dto);
    toast.success('Opération réussie');
} catch (error) {
    const code = error.response?.data?.error?.code;
    
    if (code === 'ALREADY_ASSIGNED') {
        toast.error('Utilisateur déjà assigné');
    } else if (code === 'MAX_ETABLISSEMENTS_REACHED') {
        toast.error('Limite d\'établissements atteinte');
    } else {
        toast.error('Erreur inattendue');
    }
}
```

### 2. Invalidation du Cache

Les mutations invalident automatiquement :

- `utilisateurs.liste`
- `utilisateurs.disponibles[etablissementId]`
- `utilisateurs.etablissement[etablissementId]`

### 3. Limitations

- **Élèves** : Un seul établissement autorisé
- **Parents** : Maximum 3 établissements
- **Enseignants** : Maximum 5 établissements
- **Administratifs** : Pas de limite

### 4. Audit Trail

Toutes les opérations sont journalisées :

- Qui a fait l'action (`utilisateurId`)
- Quand (`timestamp`)
- Quelle action (`CREATE`, `UPDATE`, `DELETE`)
- Sur quelle entité (`utilisateur_etablissement`)

---

## Dépannage

### Problème : L'utilisateur apparaît encore dans la liste disponible

**Solution** : Le paramètre `exclureEtablissement` filtre sur `actif = true`. Vérifiez que l'ancienne affectation est bien marquée `actif = false`.

```sql
SELECT * FROM utilisateur_etablissements 
WHERE "utilisateurId" = 'user-uuid' 
AND "etablissementId" = 'etab-uuid';
```

### Problème : Erreur 403 INSUFFICIENT_PERMISSIONS

**Solution** : Vérifiez que l'utilisateur connecté a la permission `utilisateurs:manage`.

```bash
# Vérifier les permissions d'un utilisateur
GET /api/utilisateurs/me/permissions
```

### Problème : Le cache ne s'invalide pas

**Solution** : Forcer l'invalidation manuelle.

```typescript
queryClient.invalidateQueries({
    queryKey: ['utilisateurs', 'disponibles', etablissementId]
});
```

---

## Historique des Versions

| Version | Date | Changements |
|---------|------|-------------|
| 1.0.0 | 18/06/2026 | Implémentation initiale complète |

---

## Ressources

- **Controller Backend** : [`utilisateur-etablissement.controller.ts`](../../backend/src/modules/auth/controllers/utilisateur-etablissement.controller.ts)
- **Service Backend** : [`utilisateur-etablissement.service.ts`](../../backend/src/modules/auth/services/utilisateur-etablissement.service.ts)
- **Hooks Frontend** : [`use-utilisateurs.ts`](../../frontend/src/features/utilisateurs/hooks/use-utilisateurs.ts)
- **Tests** : [`test/services/`](../../backend/test/services/)
- **Script de Test** : [`test-endpoints-utilisateurs.sh`](../../scripts/test-endpoints-utilisateurs.sh)

---

**Maintenu par** : Franck Arlos Chendjou  
**Contact** : Voir README principal du projet
