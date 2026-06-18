# Seed Module Groupes d'Établissements

## 📋 Description

Ce seed crée les données initiales pour le module **groupes d'établissements** :

### Données créées

1. **Paramètre système** :
   - `groupes-etablissements.actif = true` - Active le module

2. **Groupe de démonstration** (`GROUPE_DEMO`) :
   - Nom : "Groupe Démonstration"
   - Description : "Groupe de démonstration pour tester la consolidation multi-établissements"
   - Propriétaire : Super Admin
   - Statut : Actif

3. **Associations** :
   - Établissement principal ajouté au groupe
   - Super Admin comme administrateur du groupe

4. **Second groupe** (si 2+ établissements existent) :
   - Nom : "Groupe Multi-Établissements"
   - Code : `GROUPE_MULTI`
   - Contient les 2 premiers établissements

## 🚀 Exécution

### Option 1 : Seed complet (recommandé pour fresh install)

```bash
cd /mnt/DONNEES/projets/eLISAschool/backend
npm run seed
```

Ce script exécute **TOUS** les seeds dans l'ordre :
1. Établissements
2. Structure académique
3. Classes
4. Configuration
5. RBAC (rôles, permissions)
6. Super Admin
7. **Groupes d'établissements** ← NOUVEAU
8. Chef d'établissement secondaire
9. Utilisateurs de test

### Option 2 : Script dédié

```bash
cd /mnt/DONNEES/projets/eLISAschool
./scripts/seed-groupes-etablissements.sh
```

### Option 3 : Manuellement dans le code

```typescript
import { seedGroupesEtablissements } from './src/database/seeds/seed-groupes-etablissements';

// Après avoir créé le super admin et l'établissement principal
await seedGroupesEtablissements(etablissementPrincipalId, superAdmin.id);
```

## ✅ Vérification

Après l'exécution du seed, vérifier les données créées :

```sql
-- Vérifier le paramètre système
SELECT cle, valeur FROM parametres_systeme 
WHERE cle = 'groupes-etablissements.actif';

-- Vérifier les groupes
SELECT id, nom, code, actif FROM groupes_etablissements;

-- Vérifier les associations établissements
SELECT g.nom as groupe, e.nom as etablissement
FROM groupes_etablissements g
JOIN groupe_etablissement_liens l ON g.id = l."groupeId"
JOIN etablissements e ON l."etablissementId" = e.id;

-- Vérifier les administrateurs
SELECT g.nom as groupe, u.email as admin
FROM groupes_etablissements g
JOIN groupe_admins ga ON g.id = ga."groupeId"
JOIN utilisateurs u ON ga."utilisateurId" = u.id;
```

## 📝 Fichiers créés

| Fichier | Description |
|---------|-------------|
| `src/database/seeds/seed-groupes-etablissements.ts` | Fonction de seed principale |
| `scripts/seed-groupes-etablissements.sh` | Script d'exécution standalone |
| `docs/SEED-GROUPES-ETABLISSEMENTS.md` | Cette documentation |

## 🔄 Idempotence

Le seed est **idempotent** :

- ✅ Peut être exécuté plusieurs fois sans erreur
- ✅ Vérifie l'existence avant de créer (`ON CONFLICT DO NOTHING`)
- ✅ Skip si le groupe `GROUPE_DEMO` existe déjà
- ✅ Ne duplique pas les associations

## ⚠️ Prérequis

Le seed nécessite que les données suivantes existent déjà :

1. ✅ **Super Admin** - email: `admin@elisaschool.cm`
2. ✅ **Au moins 1 établissement** - créé par `seed-etablissement-par-defaut.ts`

**Si ces données n'existent pas**, exécuter d'abord :

```bash
npm run seed
```

## 🎯 Intégration dans le workflow

Le seed est intégré dans `initial.seed.ts` et s'exécute **automatiquement** après :

```
1. ✅ Établissements
2. ✅ Structure académique
3. ✅ Classes
4. ✅ Configuration
5. ✅ RBAC
6. ✅ Super Admin
7. ⬇️ GROUPES (NOUVEAU)
8. ✅ Chef établissement secondaire
9. ✅ Utilisateurs de test
```

**Position stratégique** : Après le Super Admin (nécessaire comme propriétaire) et avant les autres utilisateurs.

## 🔧 Personnalisation

### Modifier les données du groupe de démo

Éditer `src/database/seeds/seed-groupes-etablissements.ts` :

```typescript
// Ligne ~70
const groupeResult = await queryRunner.query(`
    INSERT INTO groupes_etablissements (
        nom, description, "proprietaireId", code, actif
    )
    VALUES (
        'Votre Nom Personnalisé',  // ← Modifier ici
        'Votre description',        // ← Modifier ici
        $1,
        'GROUPE_DEMO',
        true,
        NOW(),
        NOW()
    )
    RETURNING id
`, [superAdminId]);
```

### Ajouter plus de groupes de test

Dupliquer la section "Créer un second groupe" (ligne ~137) et adapter les valeurs.

## 📊 Exemple de résultat

```
[Seed] Début seed module groupes d'établissements...
[Seed] ✅ Paramètre groupes-etablissements.actif créé
[Seed] ✅ Groupe de démonstration créé: abc123-def456
[Seed] ✅ Établissement principal ajouté au groupe
[Seed] ✅ Super admin ajouté comme administrateur du groupe
[Seed] ✅ Second groupe créé: xyz789-uvw012
[Seed] ✅ 2 établissements ajoutés au second groupe
[Seed] ✅ Seed module groupes d'établissements terminé avec succès
```

---

**Version** : 1.0.0  
**Auteur** : franck arlos chendjou  
**Date** : 2026-06-17  
**Status** : ✅ Prêt pour exécution
