# Guide d'Utilisation — Retrait d'Utilisateur d'Établissement v5.0

## 📋 Vue d'Ensemble

Le système de retrait d'utilisateur d'un établissement a été complètement repensé en **version 5.0** avec :
- ✅ Vérification préalable des impacts
- ✅ Blocages et avertissements détaillés
- ✅ Gestion explicite de l'établissement principal
- ✅ Modal de confirmation avancé avec UX professionnelle

---

## 🎯 Fonctionnalités Implémentées

### **1. Vérification Automatique des Impacts**

Quand un administrateur clique sur "Retirer" pour un utilisateur :

1. **Appel API automatique** : `POST /api/utilisateurs/:id/etablissements/:etablissementId/verifier-retrait`
2. **Analyse backend** :
   - Vérifie si l'utilisateur est le dernier chef d'établissement (BLOCAGE)
   - Compte les classes assignées dans CET établissement (AVERTISSEMENT)
   - Compte les élèves responsables dans CET établissement (AVERTISSEMENT)
3. **Affichage modal** avec les résultats

### **2. Types de Vérifications**

#### 🚫 **BLOCAGES** (empêchent le retrait)
| Code | Situation | Message | Action Requise |
|------|-----------|---------|----------------|
| `DERNIER_CHEF_ETABLISSEMENT` | L'utilisateur est le dernier chef | "Cet utilisateur est le dernier chef d'établissement" | "Désignez un autre chef avant de retirer" |

**Comportement** :
- Bouton "Confirmer le retrait" **DÉSACTIVÉ**
- Message : *"Le retrait est impossible tant que ces blocages ne sont pas résolus"*
- L'utilisateur doit d'abord résoudre le blocage

#### ⚠️ **AVERTISSEMENTS** (confirmation requise)
| Code | Situation | Message | Action Recommandée |
|------|-----------|---------|-------------------|
| `CLASSES_ASSIGNEES` | Classes assignées à l'utilisateur | "X classe(s) sont assignées à cet utilisateur" | "Réassignez les classes à un autre utilisateur" |
| `RESPONSABLE_ELEVES` | Élèves sous responsabilité | "Cet utilisateur est responsable de X élève(s)" | "Les liens de responsabilité seront rompus" |

**Comportement** :
- Bouton "Confirmer le retrait" **DÉSACTIVÉ** tant que checkbox non cochée
- Checkbox obligatoire : *"Je comprends les impacts et souhaite continuer"*
- Toast warning si tentative de validation sans confirmation

### **3. Gestion de l'Établissement Principal**

Si l'établissement retiré est l'**établissement principal** de l'utilisateur :

1. **Champ affiché** : "Nouvel établissement principal (optionnel)"
2. **Options** :
   - Saisir l'ID d'un autre établissement actif de l'utilisateur
   - Laisser vide → attribution automatique au **plus ancien établissement actif**
3. **Validation** : Si ID fourni, vérification que l'établissement est bien affecté à l'utilisateur

### **4. Interface du Modal Avancé**

```
┌─────────────────────────────────────────────┐
│  Retirer l'utilisateur de l'établissement   │
│  Vérification des impacts avant le retrait  │
├─────────────────────────────────────────────┤
│                                             │
│  👤 [Avatar] Jean Dupont                    │
│      ID: a1b2c3d4...                        │
│                                             │
│  🚫 Blocages (0)                            │
│  (Section masquée si aucun blocage)         │
│                                             │
│  ⚠️ Avertissements (2)                      │
│  ┌─────────────────────────────────────┐   │
│  │ ⚠️ 3 classes assignées à cet user  │   │
│  │ → Réassignez les classes           │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ ⚠️ 5 élèves responsables           │   │
│  │ → Liens de responsabilité rompus   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  🏫 Nouvel établissement principal         │
│  (Affiché uniquement si établissement princ.)│
│  [ID de l'établissement (optionnel)     ]   │
│                                             │
│  📊 Résumé des impacts                      │
│  ┌──────────────┬──────────────┐           │
│  │ 📚 Classes: 3│ 👨‍🎓 Élèves: 5│           │
│  └──────────────┴──────────────┘           │
│                                             │
│  ☑ Je comprends les impacts et souhaite     │
│    continuer                                │
│  (Checkbox obligatoire si avertissements)   │
│                                             │
│  Motif du retrait (optionnel)               │
│  [Saisissez un motif...                 ]   │
│  🔄 Mutation 📅 Fin de contrat 📝 ...       │
│                                             │
│  ℹ️ Le motif sera enregistré dans l'historique│
│                                             │
├─────────────────────────────────────────────┤
│              [Annuler] [Confirmer le retrait]│
└─────────────────────────────────────────────┘
```

---

## 🔧 API Endpoints

### **1. Vérifier les Impacts (NOUVEAU)**

```bash
POST /api/utilisateurs/:id/etablissements/:etablissementId/verifier-retrait
```

**Permission requise** : `utilisateurs:etablissements:manage` ou `SUPER_ADMIN`

**Réponse succès (200)** :
```json
{
  "success": true,
  "data": {
    "peutRetirer": true,
    "blocages": [],
    "avertissements": [
      {
        "code": "CLASSES_ASSIGNEES",
        "message": "3 classe(s) sont assignées à cet utilisateur dans cet établissement",
        "severite": "avertissement",
        "nombre": 3,
        "actionRecommandee": "Réassignez les classes à un autre utilisateur avant le retrait"
      }
    ],
    "resume": {
      "nombreBlocages": 0,
      "nombreAvertissements": 1,
      "classesAssignees": 3,
      "elevesResponsables": 0,
      "estDernierChef": false
    }
  }
}
```

**Réponse avec blocage (200)** :
```json
{
  "success": true,
  "data": {
    "peutRetirer": false,
    "blocages": [
      {
        "code": "DERNIER_CHEF_ETABLISSEMENT",
        "message": "Cet utilisateur est le dernier chef d'établissement dans cet établissement",
        "severite": "bloquant",
        "actionRequise": "Désignez un autre chef d'établissement avant de retirer cet utilisateur"
      }
    ],
    "avertissements": [],
    "resume": {
      "nombreBlocages": 1,
      "nombreAvertissements": 0,
      "classesAssignees": 0,
      "elevesResponsables": 0,
      "estDernierChef": true
    }
  }
}
```

### **2. Retirer l'Utilisateur (MIS À JOUR)**

```bash
DELETE /api/utilisateurs/:id/etablissements/:etablissementId?motif=Mutation&nouveauPrincipalId=xyz-123
```

**Paramètres query** :
- `motif` (optionnel) : Raison du retrait
- `nouveauPrincipalId` (optionnel) : ID du nouvel établissement principal

**Permission requise** : `utilisateurs:etablissements:manage` ou `SUPER_ADMIN`

**Réponse succès (200)** :
```json
{
  "success": true,
  "message": "Établissement retiré avec succès"
}
```

**Réponse erreur (400)** :
```json
{
  "success": false,
  "error": {
    "code": "NOUVEAU_PRINCIPAL_INVALIDE",
    "message": "L'établissement principal spécifié n'est pas valide ou n'est pas affecté à cet utilisateur"
  }
}
```

---

## 🎓 Scénarios de Test

### **Scénario 1 : Retrait sans impact**
**Conditions** :
- Utilisateur simple (enseignant)
- Pas de classes assignées
- Pas d'élèves responsables
- Pas chef d'établissement

**Résultat attendu** :
- ✅ Modal s'ouvre sans blocages ni avertissements
- ✅ Checkbox de confirmation **NON affichée** (pas d'avertissements)
- ✅ Bouton "Confirmer le retrait" **ACTIVÉ**
- ✅ Retrait possible immédiatement

### **Scénario 2 : Retrait avec classes assignées**
**Conditions** :
- Utilisateur est responsable de 3 classes
- Pas chef d'établissement

**Résultat attendu** :
- ⚠️ Modal affiche 1 avertissement : "3 classe(s) assignées"
- ☑️ Checkbox de confirmation **OBLIGATOIRE**
- 🔒 Bouton "Confirmer le retrait" **DÉSACTIVÉ** jusqu'à confirmation
- ✅ Après checkbox cochée → bouton activé → retrait possible

### **Scénario 3 : Retrait du dernier chef d'établissement**
**Conditions** :
- Utilisateur est le SEUL chef d'établissement
- Aucune autre personne avec rôle `CHEF_ETABLISSEMENT`

**Résultat attendu** :
- 🚫 Modal affiche 1 blocage : "Dernier chef d'établissement"
- 🔒 Bouton "Confirmer le retrait" **TOUJOURS DÉSACTIVÉ**
- ⛔ Retrait **IMPOSSIBLE**
- 💡 Message : "Le retrait est impossible tant que ces blocages ne sont pas résolus"

**Solution** :
1. Assigner un autre utilisateur comme chef d'établissement
2. Réessayer le retrait

### **Scénario 4 : Retrait de l'établissement principal**
**Conditions** :
- Établissement à retirer est marqué `etablissementPrincipal: true`
- Utilisateur a d'autres établissements actifs

**Résultat attendu** :
- 🏫 Champ "Nouvel établissement principal" **AFFICHÉ**
- 💡 Texte explicatif : "Choisissez un autre établissement ou laissez vide"
- ✅ Si ID fourni → validation que l'établissement est bien affecté
- ✅ Si vide → attribution automatique au plus ancien établissement actif

### **Scénario 5 : Retrait total (dernier établissement)**
**Conditions** :
- Utilisateur n'est affecté qu'à UN SEUL établissement
- Tentative de retrait de cet établissement

**Résultat autorisé** (changement v5.0) :
- ✅ Retrait **AUTORISÉ** (ancien système bloquait)
- 📌 Compte utilisateur reste actif
- 🔄 Peut être réaffecté plus tard
- 💾 Historique conservé

---

## 🔄 Migration RBAC

### **Exécuter la Migration**

```bash
# Se connecter à PostgreSQL
psql -U postgres -d elisaschool

# Exécuter le script de migration
\i /mnt/DONNEES/projets/eLISAschool/backend/src/database/migrations/068-rbac-permission-retrait-etablissement.sql
```

### **Vérifier l'Installation**

```sql
-- Vérifier que la permission existe
SELECT nom, description FROM permissions 
WHERE nom = 'utilisateurs:etablissements:manage';

-- Vérifier les attributions
SELECT r.nom as role, p.nom as permission
FROM role_permissions rp
JOIN roles r ON r.id = rp."roleId"
JOIN permissions p ON p.id = rp."permissionId"
WHERE p.nom = 'utilisateurs:etablissements:manage';
```

**Résultat attendu** :
```
 permission                  | role
-----------------------------+---------------
 utilisateurs:etablissements:manage | ADMIN
 utilisateurs:etablissements:manage | SUPER_ADMIN
(2 lignes)
```

---

## 📝 Notes Importantes

### **Permissions**

**Ancien système** (toujours fonctionnel pour compatibilité) :
- `utilisateurs:manage` → Accès complet à la gestion des utilisateurs

**Nouveau système** (recommandé) :
- `utilisateurs:etablissements:manage` → Gestion des affectations uniquement

**Recommandation** :
- Conserver les deux permissions pendant la transition
- Migrer progressivement vers la nouvelle permission
- Documenter dans le guide RBAC

### **Filtrage Multi-Tenant**

Toutes les vérifications sont **filtrées par `etablissementId`** :

```typescript
// ✅ CORRECT — Vérification scopée
const classesAssignees = await classeRepo.count({
    where: { 
        responsableId: utilisateurId,
        anneeScolaire: { etablissementId } // ← Filtrage par établissement
    },
    relations: ['anneeScolaire']
});

// ❌ INCORRECT — Vérification globale (faux positifs)
const classesAssignees = await classeRepo.count({
    where: { responsableId: utilisateurId }
});
```

### **Idempotence**

Le retrait est **idempotent** :

```typescript
// Premier appel
await retirer.mutateAsync({ utilisateurId, etablissementId });
// → Succès, affectation désactivée

// Second appel (même utilisateur, même établissement)
await retirer.mutateAsync({ utilisateurId, etablissementId });
// → Succès silencieux (déjà retiré)
```

### **Soft Delete**

Le retrait utilise le **soft delete** (`actif = false`) :

```sql
-- Avant retrait
SELECT actif FROM utilisateur_etablissements 
WHERE utilisateurId = 'xxx' AND etablissementId = 'yyy';
-- → true

-- Après retrait
SELECT actif, dateFin, motif FROM utilisateur_etablissements 
WHERE utilisateurId = 'xxx' AND etablissementId = 'yyy';
-- → false, '2025-01-15 10:30:00', 'Mutation'
```

---

## 🐛 Résolution de Problèmes

### **Problème : Le modal ne s'ouvre pas**

**Vérifications** :
1. Console navigateur → erreur API ?
2. Network tab → statut HTTP de `/verifier-retrait` ?
3. Permission utilisateur → a-t-il `utilisateurs:etablissements:manage` ?

**Solution** :
```bash
# Vérifier les logs backend
tail -f backend/logs/app.log | grep "verifier-retrait"
```

### **Problème : Bouton "Confirmer" reste désactivé**

**Causes possibles** :
- ✅ Blocages présents → **NORMAL**, retrait impossible
- ⚠️ Avertissements sans checkbox cochée → **NORMAL**, cocher la checkbox
- ❌ Bug frontend → vérifier console

**Solution** :
```typescript
// Dans le modal, vérifier l'état
console.log('Blocages:', retraitModal.verification?.blocages);
console.log('Avertissements:', retraitModal.verification?.avertissements);
console.log('Checkbox:', retraitModal.comprendImpacts);
```

### **Problème : Erreur "NOUVEAU_PRINCIPAL_INVALIDE"**

**Cause** : L'ID fourni ne correspond pas à un établissement actif de l'utilisateur

**Solution** :
```sql
-- Vérifier les établissements actifs de l'utilisateur
SELECT e.id, e.nom, ue.etablissementPrincipal, ue.actif
FROM utilisateur_etablissements ue
JOIN etablissements e ON e.id = ue.etablissementId
WHERE ue.utilisateurId = 'xxx'
  AND ue.actif = true;
```

---

## 📊 Métriques et Monitoring

### **Endpoints à Monitorer**

| Endpoint | Métrique | Seuil d'Alerte |
|----------|----------|----------------|
| `POST /verifier-retrait` | Temps de réponse | > 500ms |
| `DELETE /:etablissementId` | Taux d'erreur | > 5% |
| `POST /verifier-retrait` | Taux de blocages | > 20% (anormal) |

### **Logs Structurés**

```typescript
// Backend - Logs automatiques
logger.info('[Retrait] Vérification impacts', {
    utilisateurId: 'xxx',
    etablissementId: 'yyy',
    blocages: 0,
    avertissements: 2,
    peutRetirer: true
});

logger.info('[Retrait] Exécuté', {
    utilisateurId: 'xxx',
    etablissementId: 'yyy',
    motif: 'Mutation',
    nouveauPrincipalId: 'zzz',
    etaitPrincipal: true
});
```

---

## 🎯 Checklist de Déploiement

### **Backend**
- [x] DTOs créés (`verificationRetraitSchema`)
- [x] Méthode `verifierRetrait()` implémentée
- [x] Méthode `retirer()` mise à jour
- [x] Endpoint `POST /verifier-retrait` ajouté
- [x] Permission `utilisateurs:etablissements:manage` sur 5 routes
- [x] Migration RBAC créée (`068-rbac-permission-retrait-etablissement.sql`)

### **Frontend**
- [x] Hook `useVerifierRetraitUtilisateurEtablissement` créé
- [x] Hook `useRetirerUtilisateurEtablissement` mis à jour
- [x] Modal avancé dans `etablissement-edit-page.tsx`
- [x] Affichage blocages/avertissements
- [x] Checkbox de confirmation
- [x] Sélection établissement principal
- [x] Gestion états de chargement

### **Tests**
- [ ] Retrait sans impact (scénario 1)
- [ ] Retrait avec classes assignées (scénario 2)
- [ ] Retrait dernier chef (scénario 3)
- [ ] Retrait établissement principal (scénario 4)
- [ ] Retrait total dernier établissement (scénario 5)

### **Documentation**
- [x] Guide d'utilisation créé (ce fichier)
- [x] Scénarios de test documentés
- [x] API endpoints documentés
- [x] Résolution de problèmes documentée

---

## 🚀 Prochaines Améliorations (Optionnelles)

1. **Dropdown établissements** : Remplacer le champ texte ID par un dropdown listant les établissements actifs de l'utilisateur
2. **Historique visuel** : Afficher la timeline des affectations de l'utilisateur dans le modal
3. **Export PDF** : Générer un rapport PDF des impacts avant retrait
4. **Notifications** : Notifier l'utilisateur quand il est retiré d'un établissement
5. **Audit avancé** : Logger dans `audit_logs` toutes les vérifications et retraits

---

**Version** : 5.0.0  
**Date** : 2025-01-15  
**Auteur** : franck arlos chendjou  
**Statut** : ✅ IMPLÉMENTÉ ET PRÊT POUR TESTS
