# Guide de Migration Services & Controllers - Architecture V2

> **Date**: 27 juin 2026
> **Statut**: Document de référence pour migration complète
> **Migration DB**: ✅ Exécutée (092-refactorisation-classeAnneeId.sql)
> **Entités**: ✅ Mises à jour (6 fichiers)
> **DTOs**: ✅ Mis à jour (6 fichiers)

---

## Règle de Migration Universelle

### Pattern à appliquer dans TOUS les services/controllers:

```typescript
// ❌ AVANT
where: {
    classeId: dto.classeId,
    anneeScolaireId: dto.anneeScolaireId,
}

// ✅ APRÈS
where: {
    classeAnneeId: dto.classeAnneeId,
}
```

```typescript
// ❌ AVANT
relations: ['classe', 'anneeScolaire']

// ✅ APRÈS
relations: ['classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire']
```

---

## Fichiers à Modifier

### 1. `notes/services/notes.service.ts`

**Changements requis**:
- Ligne ~49: `createDto.anneeScolaireId` → `classeAnneeId` via JOIN
- Ligne ~69: `anneeScolaireId: anneeId` → Supprimer (déjà dans classeAnneeId)
- Ligne ~86: `anneeScolaireId: anneeId` → Supprimer

**Pattern de conversion**:
```typescript
// Récupérer l'année scolaire depuis classeAnnee
const classeAnnee = await classeAnneeRepo.findOne({
    where: { id: createDto.classeAnneeId },
    relations: ['anneeScolaire', 'classe']
});
const anneeId = classeAnnee.anneeScolaireId;
```

### 2. `bulletins/services/bulletins.service.ts`

**Changements requis**:
- Ligne ~52: `dto.classeId` → `dto.classeAnneeId`
- Ligne ~56: `classe.anneeScolaireId` → `classeAnnee.anneeScolaireId`
- Ligne ~70: `classeId: dto.classeId` → `classeAnneeId: dto.classeAnneeId`
- Ligne ~92-93: `classeId` + `anneeScolaireId` → `classeAnneeId`

**Pattern**:
```typescript
// ✅ APRÈS
const classeAnnee = await classesService.findClasseAnnee(dto.classeAnneeId, etablissementId);
const periode = await periodesService.findOne(dto.periodeId);

if (periode.anneeScolaireId !== classeAnnee.anneeScolaireId) {
    throw new AppError('La période ne correspond pas à l\'année scolaire', 400, 'PERIODE_MISMATCH');
}

// Trouver les élèves via affectations
const affectations = await affectationRepo.find({
    where: { classeAnneeId: dto.classeAnneeId, actif: true },
});
```

### 3. `emploi-du-temps/services/emploi-du-temps.service.ts`

**Changements requis**:
- Tous les `classeId` → `classeAnneeId`
- Méthode `findByClasse(classeId, anneeScolaireId)` → `findByClasseAnnee(classeAnneeId)`

### 4. `matieres/services/matieres.service.ts`

**Changements requis**:
- `affecterEnseignant(dto)`: `classeId` → `classeAnneeId`
- `createConfiguration(dto)`: `classeId` + `anneeScolaireId` → `classeAnneeId`

### 5. `classes/services/classes.service.ts`

**Changements requis**:
- Supprimer références à `professeurPrincipalId`, `effectifMax`, `effectifActuel`
- Ces champs sont maintenant dans `ClasseAnnee` uniquement

### 6. `classes/services/classes-annees.service.ts`

**Changements requis**:
- ✅ Déjà correct (c'est le service qui gère ClasseAnnee)

---

## Controllers - Modifications Requises

### Pattern universel:

```typescript
// ❌ AVANT
const { classeId, anneeScolaireId } = req.query;
const result = await service.findByClasse(classeId, anneeScolaireId);

// ✅ APRÈS
const { classeAnneeId } = req.query;
const result = await service.findByClasseAnnee(classeAnneeId);
```

### Fichiers controllers à modifier:

1. `notes/controllers/notes.controller.ts`
   - Query params: remplacer `classeId` + `anneeScolaireId` par `classeAnneeId`
   - Validation DTO: déjà faite ✅

2. `bulletins/controllers/bulletins.controller.ts`
   - Query params: `classeAnneeId` au lieu de `classeId` + `anneeScolaireId`

3. `emploi-du-temps/controllers/emploi-du-temps.controller.ts`
   - Routes: `classeAnneeId` obligatoire

4. `matieres/controllers/matieres.controller.ts`
   - Routes de configuration: `classeAnneeId`

5. `classes/controllers/classes.controller.ts`
   - Supprimer `professeurPrincipalId`, `effectifMax` du createClasseSchema
   - Déjà fait dans DTO ✅

---

## Checklist de Validation

Pour chaque fichier modifié:

- [ ] Remplacé tous les `classeId` par `classeAnneeId`
- [ ] Supprimé les références à `anneeScolaireId` (sauf via classeAnnee.anneeScolaireId)
- [ ] Mis à jour les `relations: []` pour inclure `classeAnnee`
- [ ] Mis à jour les `where: {}` pour utiliser `classeAnneeId`
- [ ] Testé la compilation: `npm run build`
- [ ] Vérifié les imports (pas de référence à anciennes colonnes)

---

## Tests à Effectuer Après Migration

```bash
# 1. Compilation backend
cd backend && npm run build

# 2. Test API notes
curl -X POST http://localhost:7001/api/notes \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eleveId": "UUID",
    "matiereId": "UUID",
    "classeAnneeId": "UUID",
    "periodeId": "UUID",
    "valeur": 15
  }'

# 3. Test API bulletins
curl -X POST http://localhost:7001/api/bulletins/generer \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "classeAnneeId": "UUID",
    "periodeId": "UUID"
  }'

# 4. Validation DB
psql -h localhost -p 7002 -U postgres -d elisaschool -c "
SELECT COUNT(*) as notes_sans_classeAnnee
FROM notes WHERE \"classeAnneeId\" IS NULL;
"
```

---

## Prochaines Étapes

1. ✅ **Entités**: Complété
2. ✅ **DTOs**: Complété  
3. ⏳ **Services**: À faire (~10 fichiers) - Voir patterns ci-dessus
4. ⏳ **Controllers**: À faire (~8 fichiers) - Voir patterns ci-dessus
5. ⏳ **Frontend**: Priorité - Commencer par types/hooks
6. ⏳ **Compilation & Tests**: Après modifications

---

## Notes Importantes

- **Migration DB déjà exécutée**: Tables vides, pas de données à migrer
- **Entités synchronisées**: TypeORM utilise déjà les nouvelles colonnes
- **DTOs validés**: Schémas Zod cohérents avec entités
- **Priorité**: Frontend > Services > Controllers (selon demande utilisateur)
