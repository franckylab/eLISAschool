# Correction Architecture - Source de Vérité Etablissement

**Date**: 2026-06-13  
**Problème**: Confusion entre ParametreSysteme et table Etablissement  
**Statut**: ✅ CORRIGÉ

---

## 🐛 Problème Identifié

Les informations de l'établissement étaient **dupliquées** dans deux endroits :

1. **Table `etablissements`** (✅ Source de vérité correcte)
   - `nom`, `codeEtablissement`, `contactEmail`, `contactTelephone`, `adresse`, etc.

2. **Table `parametres_systeme`** (❌ Duplication incorrecte)
   - `app.nom_etablissement`
   - `app.code_etablissement`
   - `app.email`
   - `app.telephone`
   - `app.adresse`
   - `app.type_etablissement`
   - `app.message_accueil`

---

## ✅ Correction Appliquée

### 1. Backend - Suppression des paramètres dupliqués

**Script créé**: `backend/scripts/supprimer-parametres-dupliques-etablissement.ts`

**Résultat** :
```
📊 Paramètres dupliqués trouvés: 3
📋 Paramètres supprimés:
   - app.message_accueil (global)
   - app.nom_etablissement (global)
   - app.type_etablissement (global)

✅ 3 paramètres supprimés
```

**Migration SQL**: `backend/database/migrations/057-supprimer-parametres-dupliques-etablissement.sql`

### 2. Frontend - Migration vers l'entité Etablissement

**Fichier modifié**: `frontend/src/features/configuration/ConfigurationPage.tsx`

**Avant** (❌ Utilisait ParametreSysteme) :
```typescript
// Charger les paramètres établissement
const { data: paramsResponse } = useParametres({
    categorie: 'ETABLISSEMENT',
    limit: 100,
});

const getParamValue = (cle: string, defaultValue: string) => {
    const param = params.find(p => p.cle === `app.${cle}`);
    return param ? JSON.parse(param.valeur) : defaultValue;
};

const [formData, setFormData] = useState({
    nomEtablissement: getParamValue('nom_etablissement', ''),
    email: getParamValue('email', ''),
    // ...
});

// Mise à jour via ParametreSysteme
await modifierParametre.mutateAsync({
    id: param.id,
    valeur: JSON.stringify(formData.nomEtablissement),
});
```

**Après** (✅ Utilise l'entité Etablissement) :
```typescript
const { etablissementId } = useAuthStore();

// Charger les données de l'établissement (source de vérité)
const { data: etablissement } = useEtablissement(etablissementId || '');
const modifierEtablissement = useModifierEtablissement();

// État du formulaire (depuis l'entité Etablissement)
const [formData, setFormData] = useState({
    nomEtablissement: etablissement?.nom || '',
    email: etablissement?.contactEmail || '',
    // ...
});

// Mise à jour via l'entité Etablissement
await modifierEtablissement.mutateAsync({
    id: etablissementId!,
    nom: formData.nomEtablissement,
    contactEmail: formData.email,
    // ...
});
```

---

## 📊 Architecture Corrigée

### Avant (❌ Incohérent)
```
┌─────────────────────────────────┐
│   ConfigurationPage.tsx         │
│                                 │
│  Utilise ParametreSysteme       │
│  pour infos établissement       │
│  (nom, email, téléphone, etc.)  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  parametres_systeme             │
│  ───────────────────────────    │
│  app.nom_etablissement ❌       │
│  app.email ❌                   │
│  app.telephone ❌               │
│  app.adresse ❌                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  etablissements                 │
│  ───────────────────────────    │
│  nom ✅                         │
│  contactEmail ✅                │
│  contactTelephone ✅            │
│  adresse ✅                     │
└─────────────────────────────────┘

❌ DEUX sources de vérité !
```

### Après (✅ Cohérent)
```
┌─────────────────────────────────┐
│   ConfigurationPage.tsx         │
│                                 │
│  Utilise entité Etablissement   │
│  (source de vérité unique)      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  etablissements                 │
│  ───────────────────────────    │
│  nom ✅ SOURCE DE VÉRITÉ        │
│  contactEmail ✅                │
│  contactTelephone ✅            │
│  adresse ✅                     │
│  codeEtablissement ✅           │
│  type ✅                        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  parametres_systeme             │
│  ───────────────────────────    │
│  app.langue_defaut ✅           │
│  app.devise ✅                  │
│  app.fuseau_horaire ✅          │
│  app.theme ✅                   │
│  (Uniquement config applicative)│
└─────────────────────────────────┘

✅ UNE seule source de vérité !
```

---

## 🎯 Règle Architecturale

### Table ETABLISSEMENTS (Entité Etablissement)
**Responsabilité** : Informations PROPRES à l'établissement
- ✅ `nom` - Nom de l'établissement
- ✅ `codeEtablissement` - Code unique
- ✅ `contactEmail` - Email de contact
- ✅ `contactTelephone` - Téléphone
- ✅ `adresse` - Adresse physique
- ✅ `type` - Type (laïc, confessionnel, etc.)
- ✅ `sousSysteme` - Francophone, anglophone, biculturel
- ✅ `slogan`, `logoUrl`, `siteWeb`, etc.

### Table PARAMETRE_SYSTEME
**Responsabilité** : Configuration APPLICATIVE transversale
- ✅ `app.langue_defaut` - Langue par défaut de l'app
- ✅ `app.devise` - Devise monétaire
- ✅ `app.fuseau_horaire` - Fuseau horaire
- ✅ `app.format_date` - Format de date
- ✅ `app.theme` - Thème de l'interface
- ✅ `module.xxx.actif` - Activation des modules
- ❌ **PAS** les informations établissement

---

## 📝 Fichiers Modifiés

### Backend
1. ✅ `backend/scripts/supprimer-parametres-dupliques-etablissement.ts` - **CRÉÉ**
2. ✅ `backend/database/migrations/057-supprimer-parametres-dupliques-etablissement.sql` - **CRÉÉ**

### Frontend
3. ✅ `frontend/src/features/configuration/ConfigurationPage.tsx` - **MODIFIÉ**
   - Import: `useEtablissement`, `useModifierEtablissement`
   - Hook: `useParametres` → `useEtablissement`
   - Hook: `useModifierParametre` → `useModifierEtablissement`
   - Données: ParametreSysteme → Entité Etablissement
   - Champs mappés correctement:
     - `app.nom_etablissement` → `etablissement.nom`
     - `app.email` → `etablissement.contactEmail`
     - `app.telephone` → `etablissement.contactTelephone`
     - `app.adresse` → `etablissement.adresse`
     - `app.code_etablissement` → `etablissement.codeEtablissement`

---

## ✅ Vérification

### Base de données
```sql
-- Paramètres dupliqués restants
SELECT COUNT(*) FROM parametres_systeme 
WHERE cle IN (
    'app.nom_etablissement',
    'app.email',
    'app.telephone',
    'app.adresse'
);
-- Résultat: 0 ✅
```

### Frontend
```bash
# Vérifier qu'il n'y a plus de référence aux paramètres dupliqués
grep -r "app.nom_etablissement" frontend/src/
# Résultat: 0 match ✅

grep -r "app.email" frontend/src/features/configuration/
# Résultat: 0 match ✅
```

---

## 🚀 Bénéfices

1. **Cohérence** : Une seule source de vérité pour les infos établissement
2. **Simplicité** : Pas de synchronisation nécessaire entre deux tables
3. **Performance** : Moins de requêtes (1 au lieu de 2)
4. **Maintenance** : Plus facile à comprendre et à modifier
5. **Intégrité** : Pas de risque de désynchronisation des données

---

## 📚 Documentation Mise à Jour

**Règle à ajouter dans les conventions** :

```markdown
## Sources de Vérité

### Entité Etablissement
- TOUJOURS utiliser la table `etablissements` pour :
  - Nom, code, slogan, logo
  - Contact (email, téléphone, adresse)
  - Type, sous-système
  - Effectifs, directeurs, etc.

### Entité ParametreSysteme
- UTILISER UNIQUEMENT pour la configuration applicative :
  - Langue, devise, fuseau horaire
  - Thème, couleurs
  - Activation des modules
  - Paramètres système globaux

- JAMAIS dupliquer les informations établissement dans ParametreSysteme
```

---

**Rapport généré le**: 2026-06-13  
**Statut**: ✅ **ARCHITECTURE CORRIGÉE ET COHÉRENTE**
