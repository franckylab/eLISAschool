# Guide d'Instrumentation Audit Trail - eLISAschool

## Vue d'ensemble

Ce guide explique comment ajouter l'audit trail dans les modules eLISAschool.

## Pattern Standard d'Instrumentation

### 1. Imports à ajouter

```typescript
import { Request } from 'express';
import { auditService, AuditAction } from '@modules/auth';
```

### 2. Méthode CREATE

```typescript
async create(dto: CreateDto, req?: Request): Promise<Entity> {
    // ... logique métier existante ...
    const entity = this.repo.create(dto);
    await this.repo.save(entity);
    
    // AUDIT
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.ENTITY_CREATE, // Adapter selon l'entité
            cible: 'NomEntité',
            cibleId: entity.id,
            description: `Création entité: ${entity.identifiant}`,
            nouvellesValeurs: dto,
            module: 'nom-module',
        }, req);
    }
    
    return entity;
}
```

### 3. Méthode UPDATE

```typescript
async update(id: string, dto: UpdateDto, req?: Request): Promise<Entity> {
    const entity = await this.findOne(id);
    
    // Capturer les anciennes valeurs
    const anciennesValeurs = {
        champ1: entity.champ1,
        champ2: entity.champ2,
    };
    
    // ... logique de mise à jour ...
    Object.assign(entity, dto);
    await this.repo.save(entity);
    
    // AUDIT
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.ENTITY_UPDATE,
            cible: 'NomEntité',
            cibleId: entity.id,
            description: `Modification entité: ${entity.identifiant}`,
            anciennesValeurs,
            nouvellesValeurs: dto,
            module: 'nom-module',
        }, req);
    }
    
    return entity;
}
```

### 4. Méthode DELETE

```typescript
async delete(id: string, req?: Request): Promise<void> {
    const entity = await this.findOne(id);
    
    await this.repo.remove(entity);
    
    // AUDIT
    if (req?.utilisateur?.id) {
        await auditService.log({
            utilisateurId: req.utilisateur.id,
            action: AuditAction.ENTITY_DELETE,
            cible: 'NomEntité',
            cibleId: id,
            description: `Suppression entité: ${entity.identifiant}`,
            anciennesValeurs: { identifiant: entity.identifiant },
            module: 'nom-module',
            severity: 'WARNING' as any,
        }, req);
    }
}
```

### 5. Modifier le Controller

```typescript
// Avant
router.post('/', authMiddleware, async (req, res, next) => {
    const entity = await service.create(req.body);
    res.json({ success: true, data: entity });
});

// Après
router.post('/', authMiddleware, async (req, res, next) => {
    const entity = await service.create(req.body, req); // Passer req
    res.json({ success: true, data: entity });
});
```

## Actions d'Audit Disponibles

Voir la liste complète dans : `backend/src/modules/auth/entities/audit-log.entity.ts`

### Catégories principales :

- **Élèves** : `ELEVE_CREATE`, `ELEVE_UPDATE`, `ELEVE_DELETE`, `ELEVE_INSCRIPTION`
- **Académique** : `CYCLE_CREATE/UPDATE/DELETE`, `NIVEAU_CREATE/UPDATE/DELETE`, `CLASSE_CREATE/UPDATE/DELETE`, etc.
- **Cantine** : `MENU_CREATE`, `INSCRIPTION_CANTINE_CREATE`, `SOLDE_RECHARGE`, etc.
- **Transport** : `LIGNE_CREATE`, `INSCRIPTION_TRANSPORT_CREATE`, etc.
- **RBAC** : `ROLE_CREATE`, `ROLE_ASSIGN`, `PERMISSION_CREATE`, etc.

## Modules Déjà Instrumentés

- ✅ Auth (login, password, access denied)
- ✅ Notes (create, update)
- ✅ Configuration (via historique dédié)
- ✅ Élèves (create, update, delete)
- ✅ Utilisateurs (create, update, delete, suspend/activate)

## Modules Restants à Instrumenter

### Priorité Haute (Données sensibles)
- [ ] Établissement
- [ ] Personnel
- [ ] RBAC (rôles, permissions)

### Priorité Moyenne (Académique)
- [ ] Bulletins
- [ ] Cycles
- [ ] Niveaux
- [ ] Classes
- [ ] Matières
- [ ] Périodes
- [ ] Années scolaires

### Priorité Moyenne (Services)
- [ ] Cantine
- [ ] Transport
- [ ] Cartes
- [ ] Matériel

### Priorité Basse (Communication & Autres)
- [ ] Messagerie
- [ ] Clubs
- [ ] Gamification
- [ ] Orientation
- [ ] Requêtes
- [ ] Impressions

## Bonnes Pratiques

1. **Toujours vérifier** `req?.utilisateur?.id` avant de logger
2. **Passer l'objet `req`** à `auditService.log()` pour capturer IP et User-Agent
3. **Sanitiser** les données sensibles (le service le fait automatiquement pour passwords, tokens)
4. **Utiliser la bonne sévérité** :
   - `INFO` : opérations normales (CREATE, UPDATE)
   - `WARNING` : suppressions, changements sensibles
   - `CRITICAL` : erreurs de sécurité
5. **Définir le `module`** correspondant au module métier
6. **Capturer anciennes ET nouvelles valeurs** pour les UPDATE

## Testing

Tester l'instrumentation :
```bash
# Consulter les logs
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/audit/logs

# Export CSV
curl -H "Authorization: Bearer <token>" "http://localhost:3000/api/audit/logs/export?format=csv"
```
