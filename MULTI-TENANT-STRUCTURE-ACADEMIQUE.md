# Multi-Tenant Structure Académique - Guide Complet

**Version:** 2.0.0  
**Date:** 2026-06-13  
**Auteur:** Franck Arlos Chendjou

---

## 📋 Résumé Exécutif

Implémentation du **multi-tenant maximal** pour la structure académique d'eLISAschool. Chaque établissement possède maintenant ses propres configurations pédagogiques tout en partageant les référentiels nationaux.

---

## 🎯 Stratégie Multi-Tenant

### Entités GLOBALES (Partagées entre tous les établissements)

| Entité | Raison | Exemple |
|--------|--------|---------|
| **Cycle** | Référentiel national | Maternelle, Primaire, Collège, Lycée |
| **Niveau** | Structure officielle | CP, CE1, 6ème, Terminale |
| **ExamenNational** | Examens officiels d'État | BEPC, BAC, GCE O/A Level |

**Pourquoi global ?**
- Ces entités sont définies par le Ministère (MINESEC/MINEDUB)
- Tous les établissements du Cameroun utilisent la même structure
- Éviter la duplication inutile de données

### Entités PAR ÉTABLISSEMENT (Multi-tenant)

| Entité | Raison | Impact |
|--------|--------|--------|
| **Filiere** | Choix pédagogique | Chaque établissement choisit ses filières |
| **Specialite** | Offre de formation | Spécialités techniques disponibles |
| **Competence** | Programme APC | Compétences enseignées par niveau/matière |
| **Matiere** | Grille horaire | Matières proposées |
| **Classe** | Organisation | Classes ouvertes |
| **Eleve** | Inscription | Élèves inscrits |
| **Enseignant** | Personnel | Enseignants employés |

**Pourquoi par établissement ?**
- Chaque établissement a son **projet pédagogique**
- Offre de formation **différenciée**
- **Autonomie** dans les choix éducatifs
- **Isolation** des données entre établissements

---

## 🏗️ Architecture Technique

### 1. Entités Modifiées

#### Filiere (`backend/src/modules/filieres/entities/filiere.entity.ts`)

```typescript
@Entity('filieres')
@Index(['cycleId'])
@Index(['etablissementId'])  // ✅ NOUVEAU
@Index(['cycleId', 'etablissementId'])  // ✅ NOUVEAU - Index composite
export class Filiere {
    // ... champs existants ...
    
    /**
     * Relation multi-tenant : chaque filière appartient à un établissement.
     * Permet à chaque établissement de choisir ses filières actives.
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;  // ✅ NOUVEAU

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;  // ✅ NOUVEAU
}
```

#### Specialite (`backend/src/modules/specialites/entities/specialite.entity.ts`)

```typescript
@Entity('specialites')
@Index(['filiereId'])
@Index(['etablissementId'])  // ✅ NOUVEAU
@Index(['filiereId', 'etablissementId'])  // ✅ NOUVEAU
export class Specialite {
    // ... champs existants ...
    
    @Column({ type: 'uuid' })
    etablissementId!: string;  // ✅ NOUVEAU

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;  // ✅ NOUVEAU
}
```

#### Competence (`backend/src/modules/competences/entities/competence.entity.ts`)

```typescript
@Entity('competences')
@Index(['niveauId'])
@Index(['matiereId'])
@Index(['etablissementId'])  // ✅ NOUVEAU
@Index(['niveauId', 'matiereId', 'etablissementId'])  // ✅ NOUVEAU
export class Competence {
    // ... champs existants ...
    
    @Column({ type: 'varchar', length: 50 })
    code!: string;  // ⚠️ UNIQUE supprimé (maintenant unique par établissement)

    @Column({ type: 'uuid' })
    etablissementId!: string;  // ✅ NOUVEAU

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;  // ✅ NOUVEAU
}
```

### 2. Migration SQL

**Fichier:** `backend/database/migrations/058-multi-tenant-structure-academique.sql`

```sql
-- Ajouter la colonne
ALTER TABLE filieres ADD COLUMN IF NOT EXISTS "etablissementId" UUID;

-- Lier à l'établissement par défaut
UPDATE filieres 
SET "etablissementId" = (SELECT id FROM etablissements LIMIT 1)
WHERE "etablissementId" IS NULL;

-- Rendre NOT NULL
ALTER TABLE filieres ALTER COLUMN "etablissementId" SET NOT NULL;

-- Contrainte FK
ALTER TABLE filieres
ADD CONSTRAINT fk_filieres_etablissement
FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;

-- Index pour performance
CREATE INDEX idx_filieres_etablissement ON filieres("etablissementId");
CREATE INDEX idx_filieres_cycle_etablissement ON filieres("cycleId", "etablissementId");

-- Même pattern pour specialites et competences
```

### 3. Script de Mise à Jour

**Fichier:** `backend/src/database/seeds/update-multi-tenant-structure.ts`

```bash
cd backend
npx ts-node src/database/seeds/update-multi-tenant-structure.ts
```

---

## 🚀 Déploiement

### Étape 1: Exécuter la Migration SQL

```bash
# Connexion à la base
psql -U postgres -d elisaschool

# Exécuter la migration
\i backend/database/migrations/058-multi-tenant-structure-academique.sql

# Vérifier
SELECT COUNT(*) as filieres, 
       COUNT(DISTINCT "etablissementId") as etablissements
FROM filieres;
```

### Étape 2: Mettre à Jour les Données Existantes

```bash
cd backend
npx ts-node src/database/seeds/update-multi-tenant-structure.ts
```

### Étape 3: Mettre à Jour les Seeds

Les seeds doivent maintenant inclure `etablissementId` :

```typescript
const filiere = filiereRepo.create({
    nom: 'Série C - Mathématiques et Physique',
    code: 'C',
    cycleId: cycles[3].id,
    etablissementId: etablissement.id,  // ✅ OBLIGATOIRE
    sousSysteme: 'FRANCOPHONE',
    actif: true,
});
```

---

## 🔍 Impact sur les Services

### Avant (Sans Multi-Tenant)

```typescript
// ❌ Retourne TOUTES les filières (tous établissements)
async findAll(): Promise<Filiere[]> {
    return this.repo.find({ relations: ['cycle'] });
}
```

### Après (Avec Multi-Tenant)

```typescript
// ✅ Retourne uniquement les filières de l'établissement
async findAll(etablissementId: string): Promise<Filiere[]> {
    return this.repo.find({
        where: { etablissementId },
        relations: ['cycle'],
        order: { code: 'ASC' }
    });
}

// ✅ Créer une filière pour l'établissement
async create(dto: CreateFiliereDto, etablissementId: string): Promise<Filiere> {
    const filiere = this.repo.create({
        ...dto,
        etablissementId,  // ✅ Isolée par établissement
    });
    return this.repo.save(filiere);
}
```

---

## 📊 Meilleures Pratiques Multi-Tenant

### ✅ BONNES PRATIQUES

1. **Toujours filtrer par `etablissementId`**
   ```typescript
   // ✅ CORRECT
   const filieres = await repo.find({ where: { etablissementId } });
   
   // ❌ INCORRECT - Fuite de données
   const filieres = await repo.find();
   ```

2. **Index composites pour requêtes fréquentes**
   ```typescript
   @Index(['cycleId', 'etablissementId'])  // Recherche par cycle + établissement
   ```

3. **CASCADE DELETE approprié**
   ```typescript
   // Si l'établissement est supprimé, ses filières aussi
   FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;
   ```

4. **Unicité PAR établissement**
   ```sql
   -- ❌ Ancien: Code unique globalement
   ALTER TABLE competences ADD CONSTRAINT uq_code UNIQUE (code);
   
   -- ✅ Nouveau: Code unique par établissement
   ALTER TABLE competences ADD CONSTRAINT uq_code_etab UNIQUE (code, "etablissementId");
   ```

5. **DTO avec etablissementId**
   ```typescript
   // Le controller passe toujours l'etablissementId
   const filieres = await service.findAll(req.utilisateur.etablissementId);
   ```

### ❌ ANTI-PATTERNS À ÉVITER

1. **Pas de fuite de données**
   ```typescript
   // ❌ DANGER - Un établissement voit les données d'un autre
   const filiere = await repo.findOne({ where: { id } });
   
   // ✅ SÉCURISÉ
   const filiere = await repo.findOne({ 
       where: { id, etablissementId } 
   });
   ```

2. **Pas de requêtes sans contexte**
   ```typescript
   // ❌ MANQUE contexte multi-tenant
   async count(): Promise<number> {
       return this.repo.count();
   }
   
   // ✅ AVEC contexte
   async count(etablissementId: string): Promise<number> {
       return this.repo.count({ where: { etablissementId } });
   }
   ```

---

## 🔐 Sécurité

### Isolation des Données

```typescript
// Middleware de vérification multi-tenant
export function requireEtablissement() {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.utilisateur?.etablissementId) {
            throw new AppError('Établissement non défini', 403, 'NO_ESTABLISHMENT');
        }
        req.etablissementId = req.utilisateur.etablissementId;
        next();
    };
}

// Utilisation dans le controller
router.get('/', authMiddleware, requireEtablissement(), async (req, res) => {
    const filieres = await service.findAll(req.etablissementId!);
    res.json({ success: true, data: filieres });
});
```

### Validation des Données

```typescript
// Vérifier que la ressource appartient à l'établissement
async verifyOwnership(id: string, etablissementId: string): Promise<Filiere> {
    const filiere = await this.repo.findOne({
        where: { id, etablissementId }
    });
    
    if (!filiere) {
        throw new AppError('Filière non trouvée', 404, 'NOT_FOUND');
    }
    
    return filiere;
}
```

---

## 📈 Performance

### Index Stratégiques

```sql
-- Index simple pour filtre par établissement
CREATE INDEX idx_filieres_etablissement ON filieres("etablissementId");

-- Index composite pour requêtes combinées
CREATE INDEX idx_filieres_cycle_etablissement ON filieres("cycleId", "etablissementId");

-- Index couvrant pour éviter les lookups supplémentaires
CREATE INDEX idx_filieres_etab_code_actif ON filieres("etablissementId", code, actif);
```

### Requêtes Optimisées

```typescript
// ✅ REQUÊTE OPTIMISÉE avec index
const filieres = await repo.find({
    where: { 
        etablissementId,
        actif: true 
    },
    select: ['id', 'nom', 'code'],  // Colonnes spécifiques
    relations: ['cycle'],  // Relations nécessaires uniquement
    order: { code: 'ASC' }
});
```

---

## 🧪 Testing

### Test d'Isolation Multi-Tenant

```typescript
describe('Multi-Tenant Isolation', () => {
    it('ne doit pas voir les filières d\'un autre établissement', async () => {
        const filieresEtab1 = await service.findAll(etablissement1.id);
        const filieresEtab2 = await service.findAll(etablissement2.id);
        
        expect(filieresEtab1).not.toContainEqual(
            expect.objectContaining({ etablissementId: etablissement2.id })
        );
    });
    
    it('doit créer une filière isolée', async () => {
        const filiere = await service.create(dto, etablissement1.id);
        
        expect(filiere.etablissementId).toBe(etablissement1.id);
        
        const found = await service.findOne(filiere.id, etablissement1.id);
        expect(found).toBeDefined();
        
        // Un autre établissement ne la voit pas
        await expect(
            service.findOne(filiere.id, etablissement2.id)
        ).rejects.toThrow('NOT_FOUND');
    });
});
```

---

## 📚 Fichiers Modifiés

### Backend - Entités
- ✅ `backend/src/modules/filieres/entities/filiere.entity.ts` (v2.0.0)
- ✅ `backend/src/modules/specialites/entities/specialite.entity.ts` (v2.0.0)
- ✅ `backend/src/modules/competences/entities/competence.entity.ts` (v2.0.0)

### Backend - Migration
- ✅ `backend/database/migrations/058-multi-tenant-structure-academique.sql`

### Backend - Seeds
- ✅ `backend/src/database/seeds/update-multi-tenant-structure.ts`
- ⚠️ À faire: `backend/src/database/seeds/seed-structure-academique.ts` (mettre à jour manuellement)

### Services à Mettre à Jour
- ⚠️ `backend/src/modules/filieres/services/filiere.service.ts`
- ⚠️ `backend/src/modules/specialites/services/specialite.service.ts`
- ⚠️ `backend/src/modules/competences/services/competence.service.ts`

---

## 🔄 Checklist de Migration

- [x] Modifier les entités (ajouter `etablissementId`)
- [x] Créer la migration SQL
- [x] Créer le script de mise à jour
- [ ] Exécuter la migration en production
- [ ] Exécuter le script de mise à jour
- [ ] Mettre à jour les services (ajouter paramètre `etablissementId`)
- [ ] Mettre à jour les controllers (passer `req.utilisateur.etablissementId`)
- [ ] Mettre à jour les seeds
- [ ] Tests d'isolation multi-tenant
- [ ] Documentation API mise à jour
- [ ] Monitoring des requêtes multi-tenant

---

## 🎓 Concepts Clés

### Pourquoi Multi-Tenant Maximal ?

1. **Sécurité**: Isolation totale des données entre établissements
2. **Flexibilité**: Chaque établissement configure sa pédagogie
3. **Conformité**: Respect du RGPD et regulations locales
4. **Scalabilité**: Architecture prête pour le SaaS
5. **Autonomie**: Pas de dépendance entre établissements

### Modèle de Données

```
┌─────────────────┐
│   ÉTABLISSEMENT │
│   (Tenant)      │
└────────┬────────┘
         │
         ├──────────────────────┬──────────────────┐
         │                      │                  │
    ┌────▼────┐          ┌──────▼──────┐    ┌─────▼──────┐
    │ FILIÈRE │          │SPÉCIALITÉ   │    │COMPÉTENCE  │
    │ (Isolée)│          │  (Isolée)   │    │ (Isolée)   │
    └─────────┘          └─────────────┘    └────────────┘
         │                      │                  │
         └──────────────────────┴──────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │       CLASSE        │
                    │     (Isolée)        │
                    └─────────────────────┘
```

---

## 📞 Support

Pour toute question ou problème :
1. Consulter ce guide
2. Vérifier les logs de migration
3. Tester l'isolation avec les tests unitaires
4. Contacter l'équipe de développement

---

**Fin du document - Version 2.0.0 - 2026-06-13**
