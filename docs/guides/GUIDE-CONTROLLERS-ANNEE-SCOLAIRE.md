# 🎯 GUIDE IMPLÉMENTATION - Controllers & Tests Finaux

**Date**: 8 juin 2026  
**Statut**: ✅ Services mis à jour | ⏳ Controllers à modifier  

---

## ✅ Déjà Fait

### Entités (8)
- [x] IncidentEleve (+ contexte pédagogique)
- [x] ObservationEleve
- [x] SanctionEleve
- [x] FelicitationEleve
- [x] IncidentPersonnel
- [x] EvaluationPersonnel (+ periodeId)
- [x] DossierMedical
- [x] ConsultationMedicale

### DTOs (4)
- [x] createIncidentEleveSchema (+ anneeScolaireId, classeId, matiereId, enseignantId)
- [x] createObservationEleveSchema (+ anneeScolaireId)
- [x] createSanctionEleveSchema (+ anneeScolaireId)
- [x] createFelicitationEleveSchema (+ anneeScolaireId)

### Services (1/6 complets)
- [x] suivi-eleve.service.ts (incident, observation, sanction, felicitation)
- [ ] suivi-personnel.service.ts
- [ ] sante.service.ts
- [ ] autres services

### Migration SQL
- [x] 034-annee-scolaire-suivi.sql (429 lignes)

---

## 📋 Modifications Controllers Requises

### 1. suivi-eleve.controller.ts

**Fichier**: `backend/src/modules/suivi-eleves/controllers/suivi-eleve.controller.ts`

#### Route GET /eleve/:eleveId/incidents

**AVANT** :
```typescript
router.get('/eleve/:eleveId/incidents', staffOnly, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const result = await suiviEleveService.getIncidentsByEleve(
            req.params.eleveId,
            req.utilisateur!.etablissementId!,
            page,
            limit
        );
        res.json({ success: true, data: result.data, pagination: {...} });
    } catch (error) {
        next(error);
    }
});
```

**APRÈS** :
```typescript
router.get('/eleve/:eleveId/incidents', staffOnly, async (req, res, next) => {
    try {
        // ← NOUVEAU: Validation année scolaire obligatoire
        const anneeScolaireId = req.query.anneeScolaireId as string;
        if (!anneeScolaireId) {
            throw new AppError(
                'Paramètre anneeScolaireId obligatoire',
                400,
                'MISSING_ANNEE_SCOLAIRE'
            );
        }
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const result = await suiviEleveService.getIncidentsByEleve(
            req.params.eleveId,
            req.utilisateur!.etablissementId!,
            anneeScolaireId, // ← NOUVEAU
            page,
            limit
        );
        res.json({ 
            success: true, 
            data: result.data, 
            pagination: {
                page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit),
                hasNext: page * limit < result.total,
                hasPrev: page > 1,
            },
            metadata: {
                anneeScolaireId, // ← NOUVEAU
            }
        });
    } catch (error) {
        next(error);
    }
});
```

**Même pattern pour** :
- GET /eleve/:eleveId/observations
- GET /eleve/:eleveId/sanctions
- GET /eleve/:eleveId/felicitations

---

#### Routes POST (incidents, observations, sanctions, felicitations)

**AUCUNE MODIFICATION REQUISE** car le DTO contient déjà `anneeScolaireId` et le service utilise `...dto`.

**Exemple incident** :
```typescript
router.post('/incidents', staffOnly, async (req, res, next) => {
    try {
        const dto = validate(createIncidentEleveSchema, req.body);
        const incident = await suiviEleveService.createIncident(
            dto, // ← Contient déjà anneeScolaireId
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!,
            req
        );
        res.status(201).json({ success: true, data: incident });
    } catch (error) {
        next(error);
    }
});
```

---

### 2. suivi-personnel.controller.ts

**Même pattern que suivi-eleve**

#### GET /personnel/:personnelId/incidents

```typescript
router.get('/personnel/:personnelId/incidents', staffOnly, async (req, res, next) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string;
        if (!anneeScolaireId) {
            throw new AppError('Paramètre anneeScolaireId obligatoire', 400, 'MISSING_ANNEE_SCOLAIRE');
        }
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        
        const result = await suiviPersonnelService.getIncidentsByPersonnel(
            req.params.personnelId,
            req.utilisateur!.etablissementId!,
            anneeScolaireId, // ← NOUVEAU
            page,
            limit
        );
        
        res.json({ success: true, data: result.data, pagination: {...} });
    } catch (error) {
        next(error);
    }
});
```

---

### 3. sante.controller.ts

**Même pattern** pour :
- GET /patients/:patientId/consultations
- GET /patients/:patientId/incidents

**Ajouter** :
```typescript
const anneeScolaireId = req.query.anneeScolaireId as string;
if (!anneeScolaireId) {
    throw new AppError('Paramètre anneeScolaireId obligatoire', 400, 'MISSING_ANNEE_SCOLAIRE');
}
```

---

## 🔧 Code Complet pour Controllers

### suivi-eleve.controller.ts - Modifications Requises

```typescript
// 4 routes GET à modifier :
// 1. /eleve/:eleveId/incidents
// 2. /eleve/:eleveId/observations  
// 3. /eleve/:eleveId/sanctions
// 4. /eleve/:eleveId/felicitations

// Pattern identique pour chaque :
const anneeScolaireId = req.query.anneeScolaireId as string;
if (!anneeScolaireId) {
    throw new AppError('Paramètre anneeScolaireId obligatoire', 400, 'MISSING_ANNEE_SCOLAIRE');
}

const result = await service.getXByEleve(
    req.params.eleveId,
    req.utilisateur!.etablissementId!,
    anneeScolaireId, // ← Ajouter ici
    page,
    limit
);
```

---

## 🧪 Tests à Effectuer

### 1. Tester Migration SQL

```bash
cd backend
npm run typeorm migration:run
```

**Vérification** :
```sql
-- Vérifier colonnes créées
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'incidents_eleves' 
AND (column_name LIKE '%annee%' OR column_name LIKE '%classe%' OR column_name LIKE '%matiere%');

-- Vérifier index
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'incidents_eleves' 
AND indexname LIKE '%annee%';

-- Vérifier données remplies
SELECT COUNT(*) as total, 
       COUNT(annee_scolaire_id) as avec_annee,
       COUNT(classe_id) as avec_classe
FROM incidents_eleves;
```

### 2. Compiler Backend

```bash
npm run build:backend
```

**Attendu** : ✅ 0 erreur TypeScript

### 3. Tester API

```bash
# Créer incident (avec anneeScolaireId)
curl -X POST http://localhost:3000/api/suivi-eleves/incidents \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "eleveId": "{eleve-id}",
    "anneeScolaireId": "{annee-id}",
    "gravite": "MODERE",
    "type": "RETARD",
    "description": "Test incident avec année scolaire",
    "classeId": "{classe-id}",
    "matiereId": "{matiere-id}"
  }'

# Lire incidents (avec filtre année)
curl "http://localhost:3000/api/suivi-eleves/eleve/{eleve-id}/incidents?anneeScolaireId={annee-id}&page=1&limit=10" \
  -H "Authorization: Bearer {token}"

# Réponse attendue :
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "metadata": {
    "anneeScolaireId": "{annee-id}"
  }
}

# Test sans anneeScolaireId (doit échouer)
curl "http://localhost:3000/api/suivi-eleves/eleve/{eleve-id}/incidents?page=1&limit=10" \
  -H "Authorization: Bearer {token}"

# Réponse attendue : 400 Bad Request
{
  "success": false,
  "error": {
    "code": "MISSING_ANNEE_SCOLAIRE",
    "message": "Paramètre anneeScolaireId obligatoire"
  }
}
```

---

## 📊 Checklist Finale

### Phase 1 P0
- [x] 8 entités modifiées avec anneeScolaireId
- [x] Contexte pédagogique ajouté (incident élèves)
- [x] Migration SQL 034 créée (429 lignes)
- [x] 17 index composites créés
- [x] 4 DTOs Zod mis à jour
- [x] 1 service complet (suivi-eleve)
- [ ] 4 controllers à modifier
- [ ] 2 services restants (suivi-personnel, sante)
- [ ] Tests migration
- [ ] Tests compilation
- [ ] Tests API

### Phase 2 P1 (À venir)
- [ ] Catégorisation structurée incidents
- [ ] Système de jalons suivi progressif
- [ ] Alertes prédictives

---

## ⚡ Commandes Rapides

```bash
# 1. Migration
cd backend && npm run typeorm migration:run

# 2. Build
npm run build:backend

# 3. Start
npm run start:dev

# 4. Logs
docker-compose logs -f backend | grep -E "(Suivi-Élèves|ERROR|WARN)"

# 5. DB Check
psql -d elisaschool -c "\d incidents_eleves" | grep annee
```

---

## 🎯 Prochaines Étapes

1. **Modifier 4 controllers** (30 min)
2. **Mettre à jour 2 services restants** (30 min)
3. **Exécuter migration** (5 min)
4. **Tests API** (15 min)
5. **Déploiement** (10 min)

**Temps total estimé** : ~1h30

---

**🚀 PRÊT POUR MODIFICATIONS CONTROLLERS !**
