# IMPLÉMENTATION MULTI-TENANT V3.0 - eLISAschool

## 📋 Vue d'Ensemble

Implémentation avancée du système de sélection d'établissement pour les utilisateurs multi-tenants, avec isolation stricte des données et expérience utilisateur moderne.

---

## ✅ Fonctionnalités Implémentées

### **1. Backend - Middleware de Filtrage Multi-Tenant**

**Fichier**: `backend/src/modules/auth/middlewares/etablissement.middleware.ts`

#### Middleware `filterByEtablissement()`
- ✅ Injection automatique de `etablissementId` dans `req`
- ✅ Validation stricte pour tous les rôles sauf SUPER_ADMIN
- ✅ Détection et blocage des tentatives de bypass cross-tenant
- ✅ Logging des violations de sécurité
- ✅ Support override contrôlé pour SUPER_ADMIN

**Usage**:
```typescript
import { filterByEtablissement } from '@modules/auth/middlewares';

router.get('/eleves', 
    authMiddleware,
    filterByEtablissement(),  // ← Filtrage automatique
    async (req, res) => {
        const eleves = await eleveService.findAll(req.etablissementId);
        res.json({ success: true, data: eleves });
    }
);
```

#### Helpers Exportés
- `filterByEtablissement(options?)` - Middleware principal
- `validateResourceOwnership(entityName)` - Validation propriété ressource
- `getEtablissementId(req)` - Récupération sécurisée (throw si absent)
- `getEtablissementIdOptional(req)` - Récupération optionnelle

---

### **2. Backend - Service de Sélection d'Établissement**

**Fichier**: `backend/src/modules/auth/services/etablissement-selection.service.ts`

#### Méthodes Principales

**`preLogin(utilisateurId)`**
- Détecte le nombre d'établissements actifs
- Retourne `requiereSelection: false` si 0 ou 1 établissement
- Retourne `requiereSelection: true` + liste si >1 établissement
- Génère token temporaire (5 min) pour forcer la sélection

**`completeLogin(utilisateurId, etablissementId)`**
- Valide l'accès à l'établissement sélectionné
- Génère token JWT complet avec `roleDansEtablissement`
- Inclut permissions contextuelles (à améliorer v3.1)
- Retourne données utilisateur complètes

**`getEtablissementsDisponibles(utilisateurId)`**
- Liste tous les établissements avec détails (nom, logo, rôle)

---

### **3. Backend - Endpoints API**

**Fichier**: `backend/src/modules/auth/controllers/auth.controller.ts`

#### Nouveaux Endpoints

**`POST /api/auth/pre-login`**
```json
// Requête: Token JWT (après validation credentials)
// Réponse si >1 établissement:
{
  "success": true,
  "data": {
    "requiereSelection": true,
    "etablissements": [
      {
        "id": "uuid",
        "nom": "École Saint-Pierre",
        "code": "ESP001",
        "role": "ADMIN",
        "etablissementPrincipal": true,
        "logoUrl": "/logos/esp.png"
      }
    ],
    "tokenTemporaire": "eyJ...",
    "expiresIn": 300
  }
}
```

**`POST /api/auth/complete-login`**
```json
// Requête: { "etablissementId": "uuid" }
// Réponse:
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 86400,
    "utilisateur": {
      "id": "uuid",
      "email": "user@school.com",
      "etablissementActif": "uuid",
      "etablissements": [...]
    }
  }
}
```

**`GET /api/auth/etablissements-disponibles`**
- Récupère la liste des établissements pour l'utilisateur connecté

---

### **4. Frontend - Modal de Sélection**

**Fichier**: `frontend/src/components/auth/EtablissementSelectionModal.tsx`

#### Fonctionnalités
- ✅ Design moderne avec animations Framer Motion
- ✅ Affichage carte par établissement (logo, nom, rôle, badge "Principal")
- ✅ Sélection visuelle avec check animé
- ✅ Timer countdown pour token temporaire
- ✅ Auto-sélection de l'établissement principal
- ✅ Footer avec bouton "Continuer" et état de chargement
- ✅ Message d'aide pour changement futur

#### Props
```typescript
interface EtablissementSelectionModalProps {
    open: boolean;
    etablissements: EtablissementDisponible[];
    onSelect: (etablissementId: string) => Promise<void>;
    tokenTemporaire?: string;
    expiresIn?: number;
}
```

---

### **5. Frontend - Switcher Navbar**

**Fichier**: `frontend/src/components/auth/EtablissementSwitcher.tsx`

#### Fonctionnalités
- ✅ Dropdown animé avec Framer Motion
- ✅ Affichage établissement actif dans navbar
- ✅ Changement rapide avec rechargement automatique
- ✅ Badge "Principal" sur l'établissement par défaut
- ✅ Backdrop click-to-close
- ✅ Accessibilité clavier
- ✅ Ne s'affiche que si >1 établissement

#### Usage dans la Navbar
```tsx
import { EtablissementSwitcher } from '@/components/auth/EtablissementSwitcher';

// Dans votre Navbar
<EtablissementSwitcher className="ml-auto" />
```

---

### **6. Frontend - Store Auth**

**Fichier**: `frontend/src/stores/auth.store.ts`

#### Nouveaux États
```typescript
interface AuthState {
    // ... existing
    preLoginData: PreLoginResponse | null;
    showEtablissementModal: boolean;
    
    // Actions
    completeLogin: (etablissementId: string) => Promise<void>;
    setShowEtablissementModal: (show: boolean) => void;
}
```

#### Nouvelle Méthode `completeLogin()`
- Appelle `POST /api/auth/complete-login`
- Met à jour tous les tokens et états
- Ferme le modal de sélection

---

## 🔄 Flux de Connexion V3.0

### **Scénario 1 : Utilisateur mono-établissement**
```
1. Login (email/mot de passe)
2. Backend détecte 1 seul établissement
3. Token complet généré automatiquement
4. Redirect → /dashboard
```

### **Scénario 2 : Utilisateur multi-établissements**
```
1. Login (email/mot de passe)
2. Backend détecte >1 établissements
3. Retourne token temporaire (5 min) + liste
4. Frontend affiche modal de sélection
5. Utilisateur clique sur établissement
6. Frontend appelle POST /api/auth/complete-login
7. Backend génère token complet
8. Redirect → /dashboard
```

### **Scénario 3 : Changement d'établissement**
```
1. Utilisateur clique sur EtablissementSwitcher (navbar)
2. Dropdown affiche liste des établissements
3. Utilisateur sélectionne autre établissement
4. Frontend appelle POST /api/auth/switch-etablissement
5. Nouveau token généré
6. Page rechargée automatiquement
```

---

## 📊 Extensions JWT

### **Payload JWT v3.0**
```typescript
interface JwtPayload {
    sub: string;
    email: string;
    role: string;                    // Rôle global (backward compat)
    roles?: string[];                // Tous les rôles
    permissions?: string[];          // Permissions résolues
    etablissementId?: string;        // Établissement actif
    roleDansEtablissement?: string;  // NOUVEAU v3.0: Rôle contextuel
    etablissements?: Array<{
        etablissementId: string;
        role: string;
        etablissementPrincipal: boolean;
        actif: boolean;
    }>;
    iat?: number;
    exp?: number;
}
```

---

## 🚀 Prochaines Étapes (TODO)

### **Priorité HAUTE**
1. [ ] **Intégrer le middleware `filterByEtablissement()` sur TOUS les contrôleurs**
   - Auditer tous les endpoints
   - Ajouter le middleware systématiquement
   - Tests d'injection cross-tenant

2. [ ] **Modifier `LoginPage.tsx` pour gérer le flux de sélection**
   - Appeler `POST /api/auth/pre-login` après login
   - Afficher modal si `requiereSelection: true`
   - Appeler `completeLogin()` après sélection

3. [ ] **Migration SQL pour `maxEtablissementsPersonnel`**
   - Ajouter colonne dans table `utilisateurs`
   - Script de seed pour configurer les limites

### **Priorité MOYENNE**
4. [ ] **Permissions contextuelles par établissement**
   - Implémenter `resolvePermissionsForEtablissement()`
   - Modifier RBAC pour utiliser rôle contextuel
   - Tests de permissions croisées

5. [ ] **Ajouter `EtablissementSwitcher` dans la navbar principale**
   - Identifier le composant navbar
   - Intégrer le switcher à droite

6. [ ] **Tests d'intégration multi-tenant**
   - Créer comptes test multi-établissements
   - Tester isolation des données
   - Tester changements d'établissement

### **Priorité BASSE**
7. [ ] **Optimisations UX**
   - Animation de transition lors du switch
   - Toast de confirmation personnalisé
   - Sauvegarde du dernier établissement utilisé

8. [ ] **Monitoring & Alerting**
   - Dashboard des tentatives cross-tenant
   - Alertes sur violations répétées
   - Métriques d'utilisation multi-tenant

---

## 🧪 Guide de Test

### **Tester la Sélection d'Établissement**

1. **Créer un utilisateur multi-établissements** :
```sql
-- Via script ou interface admin
INSERT INTO utilisateur_etablissements (utilisateur_id, etablissement_id, role, etablissement_principal, actif)
VALUES 
  ('user-uuid', 'etab-1-uuid', 'ADMIN', true, true),
  ('user-uuid', 'etab-2-uuid', 'ENSEIGNANT', false, true);
```

2. **Se connecter avec cet utilisateur** :
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifiant": "user@email.com", "motDePasse": "password"}'
```

3. **Vérifier la réponse** :
```json
{
  "data": {
    "requiereSelection": true,
    "etablissements": [...],
    "tokenTemporaire": "eyJ...",
    "expiresIn": 300
  }
}
```

4. **Sélectionner un établissement** :
```bash
curl -X POST http://localhost:3000/api/auth/complete-login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token_temporaire>" \
  -d '{"etablissementId": "etab-1-uuid"}'
```

5. **Tester le middleware** :
```bash
# Requête légitime
curl http://localhost:3000/api/eleves \
  -H "Authorization: Bearer <token_complet>"

# Tentative de bypass (doit échouer)
curl http://localhost:3000/api/eleves?etablissementId=etab-2-uuid \
  -H "Authorization: Bearer <token_complet>"
# → 403 CROSS_TENANT_ACCESS_DENIED
```

---

## 🔒 Sécurité

### **Mesures Implémentées**
- ✅ Token temporaire avec expiration courte (5 min)
- ✅ Validation stricte de l'appartenance à l'établissement
- ✅ Blocage des tentatives de bypass via query params
- ✅ Logging de toutes les violations cross-tenant
- ✅ Permissions isolées par établissement (à compléter v3.1)

### **Bonnes Pratiques**
- **NE JAMAIS** faire confiance au frontend pour le filtrage
- **TOUJOURS** utiliser `filterByEtablissement()` sur les endpoints sensibles
- **TOUJOURS** logger les tentatives cross-tenant
- **JAMAIS** utiliser `SELECT *` sans clause `WHERE etablissementId = ?`

---

## 📚 Fichiers Modifiés/Créés

### **Backend**
- ✅ `backend/src/modules/auth/middlewares/etablissement.middleware.ts` (NOUVEAU)
- ✅ `backend/src/modules/auth/middlewares/index.ts` (MODIFIÉ)
- ✅ `backend/src/modules/auth/services/etablissement-selection.service.ts` (NOUVEAU)
- ✅ `backend/src/modules/auth/services/index.ts` (MODIFIÉ)
- ✅ `backend/src/modules/auth/services/token.service.ts` (MODIFIÉ)
- ✅ `backend/src/modules/auth/controllers/auth.controller.ts` (MODIFIÉ)
- ✅ `backend/src/modules/auth/dto/auth.dto.ts` (MODIFIÉ)

### **Frontend**
- ✅ `frontend/src/components/auth/EtablissementSelectionModal.tsx` (NOUVEAU)
- ✅ `frontend/src/components/auth/EtablissementSwitcher.tsx` (NOUVEAU)
- ✅ `frontend/src/stores/auth.store.ts` (MODIFIÉ)

---

## 🎯 Checklist de Déploiement

- [ ] Exécuter les tests unitaires backend
- [ ] Exécuter les tests d'intégration multi-tenant
- [ ] Vérifier que tous les endpoints critiques ont le middleware
- [ ] Tester le flux complet de connexion avec 1 établissement
- [ ] Tester le flux complet de connexion avec >1 établissements
- [ ] Tester le changement d'établissement depuis la navbar
- [ ] Vérifier les logs de sécurité
- [ ] Mettre à jour la documentation API (Swagger)
- [ ] Préparer les scripts de migration SQL
- [ ] Planifier le déploiement en production

---

## 📞 Support

Pour toute question ou problème :
- Consulter la documentation dans `.qoder/rules/elisaschool-conventions.md`
- Vérifier les logs backend : `logger.info/warn/error`
- Tester avec les scripts dans `scripts/`

---

**Version**: 3.0.0  
**Auteur**: franck arlos chendjou  
**Date**: 2025-06-14  
**Statut**: ✅ Backend complet, 🔄 Frontend en cours d'intégration
