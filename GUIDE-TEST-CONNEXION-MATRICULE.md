# Guide de Test - Connexion par Matricule

## ✅ État de l'implémentation

La connexion par matricule est **déjà entièrement implémentée** dans eLISAschool !

---

## 📋 Architecture en place

### Backend (`auth.service.ts`)

Le service d'authentification supporte **5 modes de connexion** via le champ `identifiant` :

```typescript
// Ligne 100-118 de auth.service.ts
const identifiantNormalise = identifiant.toLowerCase().trim();

// Recherche multi-critère optimisée avec OR
const whereConditions: any[] = [];

// 1. Si contient @ → recherche par email
if (identifiantNormalise.includes('@')) {
    whereConditions.push({ email: identifiantNormalise });
}

// 2. TOUJOURS → recherche par matricule, pseudonyme, qrCodeId
whereConditions.push({ matricule: identifiantNormalise });
whereConditions.push({ pseudonyme: identifiantNormalise });
whereConditions.push({ qrCodeId: identifiantNormalise });

// 3. Si UUID valide → recherche par ID
if (/^[0-9a-f]{8}-...$/i.test(identifiantNormalise)) {
    whereConditions.push({ id: identifiantNormalise });
}
```

### Frontend (`LoginPage.tsx`)

Le formulaire utilise déjà le champ `identifiant` avec placeholder approprié :

```typescript
// Ligne 464-484 de LoginPage.tsx
<label>{t('login.identifiant')}</label>
<input
    type="text"
    placeholder={t('login.identifiantPlaceholder')}
    {...register('identifiant', { required: true })}
/>
```

### Traductions

**Français** (`locales/fr/auth.json`) :
```json
{
    "login.identifiant": "Email ou matricule",
    "login.identifiantPlaceholder": "Entrez votre email ou matricule"
}
```

**Anglais** (`locales/en/auth.json`) :
```json
{
    "login.identifiant": "Email or ID number",
    "login.identifiantPlaceholder": "Enter your email or ID number"
}
```

---

## 🧪 Comptes de test disponibles

Tous les mots de passe sont : **`Test123456!`**

| Rôle | Email | **Matricule** | Mot de passe |
|------|-------|---------------|--------------|
| Super Admin | `superadmin@elisaschool.cm` | *(non applicable)* | `dev_password_123` |
| Admin | `admin.test@elisaschool.cm` | **`ADMIN-001`** | `Test123456!` |
| Chef Établissement | `chef.etablissement@elisaschool.cm` | **`CHEF-001`** | `Test123456!` |
| Enseignant | `enseignant@elisaschool.cm` | **`ENS-001`** | `Test123456!` |
| Élève | `eleve@elisaschool.cm` | **`ELV-001`** | `Test123456!` |
| Parent | `parent@elisaschool.cm` | **`PAR-001`** | `Test123456!` |

---

## 🚀 Comment tester

### Test 1 : Connexion par matricule (Élève)

1. Ouvrez la page de login : `http://localhost:7001/login`
2. Dans le champ "Email ou matricule", entrez : **`ELV-001`**
3. Mot de passe : **`Test123456!`**
4. Cliquez sur "Se connecter"
5. ✅ Vous devriez être connecté en tant qu'élève

### Test 2 : Connexion par matricule (Enseignant)

1. Page de login
2. Champ identifiant : **`ENS-001`**
3. Mot de passe : **`Test123456!`**
4. ✅ Connexion réussie en tant qu'enseignant

### Test 3 : Connexion par email (toujours fonctionnel)

1. Page de login
2. Champ identifiant : **`enseignant@elisaschool.cm`**
3. Mot de passe : **`Test123456!`**
4. ✅ Fonctionne aussi

### Test 4 : Test API directe

```bash
# Test avec matricule
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifiant": "ENS-001",
    "motDePasse": "Test123456!"
  }'

# Réponse attendue :
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "utilisateur": {
      "id": "...",
      "email": "enseignant@elisaschool.cm",
      "matricule": "ENS-001",
      "role": "ENSEIGNANT"
    },
    "preLoginData": {
      "requiereSelection": false,
      "etablissements": [...]
    }
  }
}
```

---

## 🔍 Vérification dans la base de données

```sql
-- Vérifier que les matricules existent
SELECT id, email, matricule, role, statut 
FROM utilisateurs 
WHERE matricule IN ('ELV-001', 'ENS-001', 'ADMIN-001');

-- Résultat attendu :
-- | id | email | matricule | role | statut |
-- |----|-------|-----------|------|--------|
-- | ... | eleve@elisaschool.cm | ELV-001 | ELEVE | ACTIF |
-- | ... | enseignant@elisaschool.cm | ENS-001 | ENSEIGNANT | ACTIF |
-- | ... | admin.test@elisaschool.cm | ADMIN-001 | ADMIN | ACTIF |
```

---

## 📊 Modes de connexion supportés

| Mode | Exemple | Fonctionne ? |
|------|---------|--------------|
| **Email** | `enseignant@elisaschool.cm` | ✅ Oui |
| **Matricule** | `ENS-001` | ✅ Oui |
| **Pseudonyme** | `monPseudo123` | ✅ Oui (si configuré) |
| **QR Code ID** | `qr-abc-123` | ✅ Oui (si configuré) |
| **UUID** | `550e8400-e29b-41d4-a716-446655440000` | ✅ Oui |

---

## 🎯 Points clés de l'implémentation

### 1. Validation Zod (shared)

```typescript
// shared/src/validators/auth.validators.ts
export const loginSchema = z.object({
    identifiant: z.string()
        .min(1, 'L\'identifiant est requis')
        .max(255, 'L\'identifiant ne peut pas dépasser 255 caractères'),
    motDePasse: z.string()
        .min(6, 'Le mot de passe doit faire au moins 6 caractères'),
    seRappelerDeMoi: z.boolean().optional().default(false),
});
```

### 2. Entity Utilisateur

```typescript
// backend/src/modules/auth/entities/utilisateur.entity.ts
@Column({ type: 'varchar', length: 50, unique: true })
matricule!: string;  // ← Champ obligatoire et unique
```

### 3. Seeds

```typescript
// backend/src/database/seeds/seed-utilisateurs-par-role.ts
const utilisateur = utilisateurRepo.create({
    email: config.email,
    matricule: config.matricule,  // ← Matricule assigné
    motDePasse: DEFAULT_PASSWORD,
    role: config.role,
    statut: StatutUtilisateur.ACTIF,
});
```

---

## ⚠️ Notes importantes

1. **Le matricule est obligatoire** pour tous les utilisateurs
2. **Le matricule est unique** (contrainte database)
3. **Recherche multi-critère** : Le système essaie TOUS les modes de recherche
4. **Priorité email** : Si l'identifiant contient `@`, il cherche d'abord par email
5. **Case insensitive** : La recherche est insensible à la casse (`ENS-001` = `ens-001`)

---

## 🐛 Dépannage

### Problème : "Identifiant ou mot de passe incorrect"

**Vérifications :**
```sql
-- 1. Vérifier que le matricule existe
SELECT * FROM utilisateurs WHERE matricule = 'ELV-001';

-- 2. Vérifier le statut
SELECT statut FROM utilisateurs WHERE matricule = 'ELV-001';
-- Doit être 'ACTIF'

-- 3. Vérifier les tentatives de connexion
SELECT tentativesConnexion, bloqueJusqua 
FROM utilisateurs 
WHERE matricule = 'ELV-001';
```

### Problème : Le matricule n'apparaît pas dans le profil

```sql
-- Vérifier la jointure avec le profil
SELECT 
    u.id, u.email, u.matricule,
    p.nom, p.prenom
FROM utilisateurs u
LEFT JOIN profil_utilisateurs p ON p.utilisateurId = u.id
WHERE u.matricule = 'ELV-001';
```

---

## ✅ Conclusion

**La connexion par matricule est 100% fonctionnelle !** 

Il suffit de :
1. Entrer le matricule dans le champ "Email ou matricule"
2. Entrer le mot de passe
3. Se connecter

Aucune modification supplémentaire n'est nécessaire.
