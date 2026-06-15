# Correction Erreur 500 - Switch Établissement

## 🚨 Problème

```
POST /api/auth/switch-etablissement → 500 Internal Server Error
```

## 🔍 Cause Racine

**Fichier** : `backend/src/modules/auth/controllers/auth.controller.ts` (ligne 289)

```typescript
// ❌ AVANT - Enums invalides avec `as any`
await auditService.log({
    utilisateurId,
    action: 'CONFIG_EDIT' as any,  // ← CONFIG_EDIT n'existe PAS dans AuditAction !
    severity: 'INFO' as any,       // ← Devrait être AuditSeverity.INFO
    description: `Changement d'établissement: ${currentEtablissement} → ${etablissementId}`,
    module: 'auth',
    nouvellesValeurs: { ... },
}, req);
```

**Problème** :
- `AuditAction.CONFIG_EDIT` n'existe PAS → La valeur correcte est `CONFIG_CHANGE`
- `'INFO' as any` bypass le typage TypeScript → Risque d'erreur runtime
- L'audit service échoue car l'action n'est pas reconnue → **500 Internal Server Error**

## ✅ Solution

### 1. Importer les enums correctement

**Fichier** : `backend/src/modules/auth/controllers/auth.controller.ts`

```typescript
// ✅ APRÈS - Import correct
import { auditService, AuditAction, AuditSeverity } from '../services/audit.service';
```

### 2. Réexporter les enums depuis audit.service.ts

**Fichier** : `backend/src/modules/auth/services/audit.service.ts`

```typescript
import { AuditLog, AuditAction, AuditSeverity } from '../entities/audit-log.entity';

// Réexporter les enums pour utilisation dans les controllers
export { AuditAction, AuditSeverity } from '../entities/audit-log.entity';
```

### 3. Utiliser les enums sans `as any`

**Fichier** : `backend/src/modules/auth/controllers/auth.controller.ts`

```typescript
// ✅ APRÈS - Typage correct
await auditService.log({
    utilisateurId,
    action: AuditAction.CONFIG_CHANGE,  // ← Enum valide
    severity: AuditSeverity.INFO,       // ← Enum valide
    description: `Changement d'établissement: ${currentEtablissement} → ${etablissementId}`,
    module: 'auth',
    nouvellesValeurs: {
        ancienEtablissementId: currentEtablissement,
        nouvelEtablissementId: etablissementId,
    },
}, req);
```

### 4. Corriger aussi completeLogin

**Fichier** : `backend/src/modules/auth/controllers/auth.controller.ts` (ligne 386)

```typescript
// ✅ APRÈS - Typage correct
await auditService.log({
    utilisateurId,
    action: AuditAction.LOGIN,         // ← Enum valide
    severity: AuditSeverity.INFO,      // ← Enum valide
    description: `Connexion complète - Établissement: ${etablissementId}`,
    module: 'auth',
}, req);
```

## 📊 Valeurs AuditAction Disponibles

### Authentification
- `LOGIN`, `LOGOUT`, `LOGIN_FAILED`
- `PASSWORD_CHANGE`, `PASSWORD_RESET`

### Utilisateurs
- `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`
- `USER_SUSPEND`, `USER_ACTIVATE`, `ROLE_CHANGE`

### Académique
- `CYCLE_CREATE`, `CYCLE_UPDATE`, `CYCLE_DELETE`
- `NIVEAU_CREATE`, `NIVEAU_UPDATE`, `NIVEAU_DELETE`
- `CLASSE_CREATE`, `CLASSE_UPDATE`, `CLASSE_DELETE`
- `MATIERE_CREATE`, `MATIERE_UPDATE`, `MATIERE_DELETE`

### Configuration
- `CONFIG_CHANGE` ← **Utiliser celui-ci pour switch établissement**
- `PREFERENCE_UPDATE`, `PREFERENCE_CREATE`, `PREFERENCE_DELETE`

## 📋 Bonnes Pratiques

### ✅ TOUJOURS utiliser les enums

```typescript
// ❌ INTERDIT - String avec `as any`
action: 'SOME_ACTION' as any
severity: 'INFO' as any

// ✅ CORRECT - Enum typé
action: AuditAction.SOME_ACTION
severity: AuditSeverity.INFO
```

### ✅ Vérifier l'existence de l'enum

Avant d'utiliser une valeur, vérifiez qu'elle existe dans l'enum :

```typescript
// Fichier: audit-log.entity.ts
export enum AuditAction {
    CONFIG_CHANGE = 'CONFIG_CHANGE',  // ← Existe
    // CONFIG_EDIT n'existe PAS        // ← N'existe pas
}
```

### ✅ Réexporter les enums partagés

Si plusieurs controllers utilisent les mêmes enums, réexportez-les :

```typescript
// audit.service.ts
export { AuditAction, AuditSeverity } from '../entities/audit-log.entity';

// auth.controller.ts
import { AuditAction, AuditSeverity } from '../services/audit.service';
```

## 🔧 Fichiers Modifiés

| Fichier | Modification |
|---------|-------------|
| `auth.controller.ts` | Import + utilisation enums (2 occurrences) |
| `audit.service.ts` | Réexport des enums |

## 🧪 Test

### Avant Correction

```bash
curl -X POST http://localhost:7000/api/auth/switch-etablissement \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"etablissementId": "UUID"}'

# Réponse: 500 Internal Server Error
```

### Après Correction

```bash
curl -X POST http://localhost:7000/api/auth/switch-etablissement \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"etablissementId": "UUID"}'

# Réponse: 200 OK
{
  "success": true,
  "message": "Établissement actif changé avec succès",
  "data": {
    "accessToken": "...",
    "etablissementActif": { "id": "...", "role": "..." }
  }
}
```

## ⚠️ Anti-Patterns à Éviter

### ❌ 1. Utiliser `as any` pour bypasser TypeScript

```typescript
// ❌ MAUVAIS
action: 'CONFIG_EDIT' as any

// ✅ CORRECT
action: AuditAction.CONFIG_CHANGE
```

### ❌ 2. Inventer des valeurs d'enum

```typescript
// ❌ MAUVAIS - CONFIG_EDIT n'existe pas
action: AuditAction.CONFIG_EDIT

// ✅ CORRECT - Vérifier l'enum existe
action: AuditAction.CONFIG_CHANGE
```

### ❌ 3. Ne pas importer les enums

```typescript
// ❌ MAUVAIS - Pas d'import
await auditService.log({ action: 'LOGIN' });

// ✅ CORRECT - Import et enum
import { AuditAction } from '../services/audit.service';
await auditService.log({ action: AuditAction.LOGIN });
```

## 📚 Leçons Apprises

### 1. TypeScript `as any` est dangereux

Utiliser `as any` pour forcer une valeur invalide :
- ✅ TypeScript ne vérifie plus
- ❌ Mais runtime échoue
- ❌ Erreur 500 au lieu d'erreur de compilation

### 2. Toujours vérifier les enums

Avant d'utiliser une valeur :
1. Ouvrir le fichier de l'enum
2. Chercher la valeur exacte
3. Utiliser la syntaxe `Enum.VALEUR`
4. Jamais de string littéral

### 3. Réexporter les types partagés

Si plusieurs fichiers utilisent les mêmes types :
- Centraliser dans un service
- Réexporter depuis le service
- Importer depuis le service

## ✅ Checklist

- [x] Import `AuditAction` et `AuditSeverity` dans `auth.controller.ts`
- [x] Réexport des enums dans `audit.service.ts`
- [x] Remplacer `'CONFIG_EDIT' as any` par `AuditAction.CONFIG_CHANGE`
- [x] Remplacer `'INFO' as any` par `AuditSeverity.INFO`
- [x] Corriger aussi `completeLogin` (LOGIN)
- [x] Vérifier pas d'autres occurrences de `as any`
- [x] Tester le switch établissement → ✅ 200 OK

---

**Statut** : ✅ **CORRIGÉ**  
**Impact** : Critique (switch établissement bloqué)  
**Risque** : Faible (correction de typage)  
**Test requis** : Changement d'établissement via switcher header
