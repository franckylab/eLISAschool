# Correction Erreur roleId - UtilisateurEtablissement

## Problème

**Erreur** : `QueryFailedError: column UtilisateurEtablissement.roleId does not exist`

**Endpoint affecté** : `GET /api/auth/etablissements-disponibles`

**Cause** : 
- L'entité TypeORM `UtilisateurEtablissement` définissait une relation `@ManyToOne(() => Role)` avec `@JoinColumn({ name: 'roleId' })`
- La table PostgreSQL `utilisateur_etablissements` n'avait PAS de colonne `roleId` (UUID)
- La migration 050 utilisait une colonne `role` de type texte/enum au lieu d'une relation UUID

## Solution

### Migration Créée
**Fichier** : `backend/database/migrations/079-add-roleId-utilisateur-etablissements.sql`

**Étapes** :
1. ✅ Ajout de la colonne `roleId` UUID
2. ✅ Migration des données (correspondance `role.code` → `roles.id`)
3. ✅ Fallback sur rôle ADMIN pour les entrées sans correspondance
4. ✅ Ajout de la contrainte FK vers `roles(id)`
5. ✅ Colonne rendue NOT NULL
6. ✅ Création d'un index pour les performances

### Résultat

```sql
Table "public.utilisateur_etablissements"
    Column         | Type                  | Nullable
    ---------------+-----------------------+----------
    roleId         | uuid                  | not null
    
Foreign-key constraints:
    "FK_utilisateur_etablissements_roleId" 
    FOREIGN KEY ("roleId") REFERENCES roles(id) ON DELETE CASCADE

Index:
    "IDX_utilisateur_etablissements_roleId" btree ("roleId")
```

**Statut** : ✅ 43 affectations migrées avec succès

## Vérification

- Backend redémarré avec succès sur port 7000
- Endpoint `/api/auth/etablissements-disponibles` fonctionnel (répond 401 pour token invalide, plus de 500)
- Plus d'erreur `EntityPropertyNotFoundError` dans les logs
- Structure DB alignée avec l'entité TypeORM

## Fichiers Modifiés

| Fichier | Action | Raison |
|---------|--------|--------|
| `079-add-roleId-utilisateur-etablissements.sql` | Créé | Migration corrective |
| `utilisateur_etablissements` (table) | Modifiée | Ajout colonne roleId + FK |

## Impact

- **Multi-tenancy** : Relation rôle par établissement maintenant fonctionnelle
- **Authentification** : Endpoint `etablissements-disponibles` opérationnel
- **Cohérence** : Alignement DB ↔ Entity TypeORM restauré
