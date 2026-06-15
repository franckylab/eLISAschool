# Module Salles - eLISAschool

## 📋 Présentation

Module de gestion des **salles physiques** de l'établissement. Ce module permet de gérer l'infrastructure physique (salles de cours, laboratoires, amphithéâtres, etc.) et de les associer aux créneaux de l'emploi du temps.

## 🎯 Fonctionnalités

- ✅ **CRUD complet** des salles (créer, lire, modifier, supprimer)
- ✅ **Typologie des salles** (classique, laboratoire, informatique, amphi, sport, etc.)
- ✅ **Gestion de capacité** (nombre de places)
- ✅ **Équipements** (projecteur, clim, ordinateurs, etc.)
- ✅ **Statut de disponibilité** (disponible, en maintenance, indisponible)
- ✅ **Recherche et filtrage** (par type, capacité, disponibilité)
- ✅ **Statistiques** (nombre total, par type, capacité totale)
- ✅ **Intégration emploi du temps** (vérification des conflits)
- ✅ **Multi-tenant** (isolation par établissement)

## 📁 Structure du Module

```
salles/
├── entities/
│   ├── salle.entity.ts      # Entité TypeORM
│   └── index.ts
├── dto/
│   ├── salle.dto.ts         # Schémas Zod
│   └── index.ts
├── services/
│   ├── salle.service.ts     # Logique métier
│   └── index.ts
├── controllers/
│   ├── salles.controller.ts # Routes Express
│   └── index.ts
└── index.ts                 # Barrel export
```

## 🔌 API REST

### Routes

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| `GET` | `/api/salles` | Lister les salles (paginé) | Authentifié |
| `GET` | `/api/salles/:id` | Détail d'une salle | Authentifié |
| `GET` | `/api/salles/disponibles` | Salles disponibles | Authentifié |
| `GET` | `/api/salles/statistiques` | Statistiques | Authentifié |
| `POST` | `/api/salles` | Créer une salle | ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT |
| `PATCH` | `/api/salles/:id` | Modifier une salle | ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT |
| `DELETE` | `/api/salles/:id` | Supprimer une salle | ADMIN, SUPER_ADMIN |

### Exemples de Requêtes

#### Créer une salle

```bash
POST /api/salles
Content-Type: application/json

{
  "nom": "Salle 101",
  "code": "S101",
  "capacite": 35,
  "localisation": "Bâtiment A, Rez-de-chaussée",
  "typeSalle": "CLASSIQUE",
  "equipements": ["tableau", "projecteur"],
  "description": "Salle de cours standard"
}
```

#### Lister les salles disponibles

```bash
GET /api/salles/disponibles?capaciteMin=30&typeSalle=LABORATOIRE
```

#### Statistiques

```bash
GET /api/salles/statistiques

Response:
{
  "success": true,
  "data": {
    "total": 15,
    "disponibles": 12,
    "enMaintenance": 2,
    "indisponibles": 1,
    "capaciteTotale": 520,
    "parType": {
      "CLASSIQUE": 8,
      "LABORATOIRE": 3,
      "INFORMATIQUE": 2,
      "AMPHITHEATRE": 1,
      "SPORT": 1
    }
  }
}
```

## 🗄️ Entité Salle

### Champs

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `nom` | varchar(100) | Nom de la salle (ex: "Salle 101") |
| `code` | varchar(50) | Code unique (ex: "S101") |
| `capacite` | int | Nombre de places (1-1000) |
| `localisation` | varchar(100) | Localisation (ex: "Bâtiment A, 1er étage") |
| `typeSalle` | enum | Type de salle |
| `equipements` | jsonb | Liste d'équipements |
| `description` | text | Description optionnelle |
| `statut` | enum | Statut (DISPONIBLE, EN_MAINTENANCE, INDISPONIBLE) |
| `disponible` | boolean | Disponibilité effective |
| `etablissementId` | UUID | ID de l'établissement (multi-tenant) |

### Types de Salle

```typescript
enum TypeSalle {
    CLASSIQUE = 'CLASSIQUE',
    LABORATOIRE = 'LABORATOIRE',
    INFORMATIQUE = 'INFORMATIQUE',
    AMPHITHEATRE = 'AMPHITHEATRE',
    SPORT = 'SPORT',
    MUSIQUE = 'MUSIQUE',
    ARTS = 'ARTS',
    BIBLIOTHEQUE = 'BIBLIOTHEQUE',
    ADMINISTRATION = 'ADMINISTRATION',
    AUTRE = 'AUTRE',
}
```

## 🔄 Intégration avec Emploi du Temps

La relation entre `EmploiDuTemps` et `Salle` est **many-to-one** :

```typescript
// Dans emploi-du-temps.entity.ts
@Column({ type: 'uuid', nullable: true })
salleId?: string;

@ManyToOne(() => Salle, { nullable: true })
@JoinColumn({ name: 'salleId' })
salle?: Salle;
```

### Vérification des Conflits

Le service `SalleService` fournit une méthode pour vérifier la disponibilité :

```typescript
async estDisponiblePourCreneau(
    salleId: string,
    etablissementId: string,
    jour: string,
    heureDebut: string,
    heureFin: string,
    anneeScolaireId: string,
    excludeEmploiId?: string
): Promise<boolean>
```

## 🚀 Migration

La migration `070-module-salles.sql` :

1. ✅ Crée la table `salles` avec tous les indexes
2. ✅ Active la FK `salle_id` dans `emploi_du_temps`
3. ✅ Supprime `salle_principale` de `classes` (nettoyage)
4. ✅ Insère des salles par défaut (8 salles types)

### Exécuter la Migration

```bash
# Via Docker
docker exec -i elisaschool-postgres psql -U elisaschool -d elisaschool < backend/database/migrations/070-module-salles.sql

# Ou directement
psql -U elisaschool -d elisaschool -f backend/database/migrations/070-module-salles.sql
```

## 🎨 Différence Classe vs Salle

| Aspect | **Classe** | **Salle** |
|--------|-----------|-----------|
| **Nature** | Groupe pédagogique d'élèves | Espace physique/local |
| **Exemple** | "6ème A", "Terminale S" | "Salle 101", "Labo Info 2" |
| **Cycle de vie** | Change chaque année scolaire | Persiste dans le temps |
| **Usage** | Gérer les élèves | Accueillir des cours |
| **Relation** | Many salles via EmploiDuTemps | Many classes via EmploiDuTemps |

**Lien** : `Classe → EmploiDuTemps → Salle` (relation indirecte via l'emploi du temps)

## 📝 Bonnes Pratiques

1. **Unicité du code** : Le code doit être unique par établissement
2. **Capacité réaliste** : Respecter la capacité physique réelle
3. **Équipements à jour** : Maintenir la liste des équipements
4. **Statut cohérent** : Mettre `disponible=false` si `statut != DISPONIBLE`
5. **Nettoyage** : Supprimer les salles obsolètes ou hors service

## 🔐 Sécurité

- **Multi-tenant** : Toutes les requêtes sont filtrées par `etablissementId`
- **RBAC** : CRUD réservé aux administrateurs
- **Validation** : Schémas Zod pour toutes les entrées
- **Audit** : Logs des opérations critiques (création, suppression)

## 📊 Métriques

- **Endpoints** : 7 routes REST
- **Entités** : 1 (Salle)
- **DTOs** : 3 schémas Zod (create, update, query)
- **Indexes** : 4 indexes PostgreSQL
- **Temps d'implémentation** : ~30 minutes

---

**Auteur** : franck arlos chendjou  
**Version** : 1.0.0  
**Date** : 2026-06-14
