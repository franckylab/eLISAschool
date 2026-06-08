# Documentation API Module Finances eLISAschool

## Vue d'ensemble

Le module **Finances** gère l'ensemble des opérations financières de l'établissement scolaire :
- **Scolarité** : Configuration des frais, échéanciers, paiements, reçus, relances
- **Dépenses** : Catégories, dépenses, workflow demandes, bons de commande
- **Comptabilité** : Écritures automatiques, grand livre, balance
- **Trésorerie** : Caisse, banque, mouvements de fonds
- **Budget** : Planification, engagement, consommation, suivi

**Base URL** : `/api/finances`

---

## Authentification & Permissions

Toutes les routes nécessitent :
- **Authentification** : `Authorization: Bearer <token>`
- **Permissions** : Variables selon la route (voir détails ci-dessous)

### Rôles principaux

| Rôle | Accès |
|------|-------|
| `COMPTABLE` | Gestion complète paiements, dépenses, comptabilité |
| `CHEF_ETABLISSEMENT` | Validation dépenses, consultation rapports |
| `ADMIN` | Configuration complète, validation budgets |
| `PARENT` | Consultation échéancier et paiements de son enfant |

---

## 1. Configuration Scolarité

### 1.1 Configurer les frais de scolarité

```http
POST /api/finances/scolarite/config
```

**Permissions** : `finances:scolarite:config` (ADMIN)

**Body** :
```json
{
  "anneeScolaireId": "uuid",
  "niveauId": "uuid",
  "fraisInscription": 50000,
  "fraisScolariteAnnuel": 500000,
  "nombreTranches": 3,
  "datePremiereEcheance": "2026-09-15",
  "frequenceEcheance": "TRIMESTRIEL",
  "penaliteRetard": 5,
  "joursGrace": 8
}
```

**Réponse** : `201 Created`
```json
{
  "success": true,
  "data": { /* FraisScolarite créé */ }
}
```

### 1.2 Lister les configurations

```http
GET /api/finances/scolarite/config
```

**Permissions** : `finances:scolarite:view`

---

## 2. Échéanciers

### 2.1 Générer l'échéancier d'un élève

```http
POST /api/finances/echeanciers/generer/:eleveId
```

**Permissions** : `finances:scolarite:view` (COMPTABLE, ADMIN)

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "numeroTranche": 1,
      "montantAttendu": 166667,
      "dateEcheance": "2026-09-15",
      "statut": "EN_ATTENTE"
    }
  ]
}
```

### 2.2 Voir l'échéancier d'un élève

```http
GET /api/finances/echeanciers/eleve/:eleveId
```

**Permissions** : 
- `finances:scolarite:view` (COMPTABLE, ADMIN)
- PARENT pour son enfant uniquement

---

## 3. Paiements

### 3.1 Enregistrer un paiement

```http
POST /api/finances/paiements
```

**Permissions** : `finances:paiement:create` (COMPTABLE)

**Body** :
```json
{
  "eleveId": "uuid",
  "echeancierId": "uuid",
  "montant": 166667,
  "methodePaiement": "ESPECES",
  "observations": "Paiement en espèces"
}
```

**Processus automatique** :
1. ✅ Transaction ACID
2. ✅ Calcul pénalité si retard
3. ✅ Mise à jour écheancier
4. ✅ Génération reçu (numérotation continue)
5. ✅ Création écriture comptable (brouillon)
6. ✅ Notification confirmation

**Réponse** : `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "montantTotal": 166667,
    "numeroRecu": "REC-2026-00001",
    "statut": "CONFIRME"
  }
}
```

### 3.2 Historique des paiements d'un élève

```http
GET /api/finances/paiements/eleve/:eleveId
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "montant": 166667,
      "methodePaiement": "ESPECES",
      "datePaiement": "2026-09-15T10:30:00Z",
      "numeroRecu": "REC-2026-00001"
    }
  ]
}
```

---

## 4. Reçus

### 4.1 Voir un reçu

```http
GET /api/finances/recus/:numeroRecu
```

**Exemple** : `GET /api/finances/recus/REC-2026-00001`

**Réponse** :
```json
{
  "success": true,
  "data": {
    "numeroRecu": "REC-2026-00001",
    "eleveNom": "Élève MAT2026001",
    "montant": 166667,
    "methodePaiement": "ESPECES",
    "objet": "Paiement tranche 1/3 - Scolarité",
    "dateEmission": "2026-09-15T10:30:00Z"
  }
}
```

---

## 5. Relances & Impayés

### 5.1 Liste des impayés

```http
GET /api/finances/impayes
```

**Permissions** : `finances:scolarite:view` (COMPTABLE)

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "eleveId": "uuid",
      "numeroTranche": 2,
      "montantAttendu": 166667,
      "dateEcheance": "2026-12-15",
      "joursRetard": 15,
      "penalite": 8333
    }
  ]
}
```

### 5.2 Envoyer des relances

```http
POST /api/finances/relances/envoyer
```

**Permissions** : `finances:relance:send`

---

## 6. Dépenses

### 6.1 Créer une catégorie de dépenses

```http
POST /api/finances/depenses/categories
```

**Permissions** : `finances:depenses:config` (ADMIN)

**Body** :
```json
{
  "code": "FOURN",
  "libelle": "Fournitures scolaires",
  "type": "CHARGE_VARIABLE",
  "compteComptableCharge": "606100",
  "compteComptableTVA": "445660",
  "budgetAnnuel": 500000
}
```

### 6.2 Créer une dépense

```http
POST /api/finances/depenses
```

**Permissions** : `finances:depenses:create` (COMPTABLE)

**Body** :
```json
{
  "categorieDepenseId": "uuid",
  "libelle": "Achat cahiers",
  "montantHT": 100000,
  "tva": 19.25,
  "dateFacture": "2026-01-15",
  "fournisseur": "Papeterie Centrale",
  "methodePaiement": "VIREMENT"
}
```

**Calcul automatique** :
- `montantTTC = montantHT × (1 + tva/100) = 119,250 FCFA`
- Numérotation : `DEP-2026-00001`

### 6.3 Valider une dépense

```http
PATCH /api/finances/depenses/:id/valider
```

**Permissions** : `finances:depenses:validate`

### 6.4 Payer une dépense

```http
POST /api/finances/depenses/:id/payer
```

**Body** :
```json
{
  "montantPaye": 119250,
  "methodePaiement": "VIREMENT",
  "referenceTransaction": "VIR-12345",
  "datePaiement": "2026-01-20"
}
```

### 6.5 Lister les dépenses (filtrable)

```http
GET /api/finances/depenses?categorieId=uuid&dateDebut=2026-01-01&dateFin=2026-12-31&statut=PAYEE
```

---

## 7. Demandes de Dépenses

### 7.1 Créer une demande

```http
POST /api/finances/depenses/demandes
```

**Body** :
```json
{
  "categorieDepenseId": "uuid",
  "libelle": "Réparation climatiseur",
  "montantEstime": 150000,
  "urgence": "HAUTE",
  "justification": "Climatiseur bureau direction en panne"
}
```

### 7.2 Mes demandes

```http
GET /api/finances/depenses/demandes/mes
```

### 7.3 Demandes à valider

```http
GET /api/finances/depenses/demandes/a-valider
```

**Permissions** : `finances:demande:validate` (CHEF, COMPTABLE)

### 7.4 Valider/Rejeter une demande

```http
PATCH /api/finances/depenses/demandes/:id/valider
```

**Body** (Approber) :
```json
{
  "decision": "APPROUVEE"
}
```

**Body** (Rejeter) :
```json
{
  "decision": "REJETEE",
  "motifRejet": "Budget insuffisant pour ce trimestre"
}
```

---

## 8. Rapports Financiers

### 8.1 Rapport de synthèse

```http
GET /api/finances/depenses/rapports/synthese?dateDebut=2026-01-01&dateFin=2026-12-31
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "totalDepenses": 5000000,
    "totalRecettes": 15000000,
    "balance": 10000000,
    "parCategorie": [
      { "categorie": "Salaires", "montant": 3000000 },
      { "categorie": "Fournitures", "montant": 500000 }
    ]
  }
}
```

### 8.2 Alertes budget

```http
GET /api/finances/depenses/alertes-budget
```

---

## Codes d'erreur

| Code HTTP | Code Interne | Description |
|-----------|--------------|-------------|
| 400 | `VALIDATION_ERROR` | Erreur de validation DTO |
| 400 | `SOLDE_INSUFFISANT` | Solde caisse insuffisant |
| 404 | `NOT_FOUND` | Ressource non trouvée |
| 404 | `FRAIS_NOT_FOUND` | Configuration frais manquante |
| 404 | `BUDGET_LINE_NOT_FOUND` | Ligne budget inexistante |
| 409 | `CATEGORIE_EXISTS` | Code catégorie déjà utilisé |
| 403 | `INSUFFICIENT_PERMISSIONS` | Permissions insuffisantes |

---

## Exemples d'utilisation

### Flux complet scolarité

```bash
# 1. Configurer frais
curl -X POST http://localhost:3000/api/finances/scolarite/config \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"anneeScolaireId":"...","niveauId":"...","fraisScolariteAnnuel":500000}'

# 2. Générer échéancier
curl -X POST http://localhost:3000/api/finances/echeanciers/generer/ELEVE_ID \
  -H "Authorization: Bearer TOKEN"

# 3. Enregistrer paiement
curl -X POST http://localhost:3000/api/finances/paiements \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eleveId":"...","echeancierId":"...","montant":166667,"methodePaiement":"ESPECES"}'

# 4. Voir reçu
curl http://localhost:3000/api/finances/recus/REC-2026-00001 \
  -H "Authorization: Bearer TOKEN"
```

### Flux complet dépenses

```bash
# 1. Créer demande
curl -X POST http://localhost:3000/api/finances/depenses/demandes \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"libelle":"Achat matériel","montantEstime":200000,"urgence":"HAUTE"}'

# 2. Valider demande (CHEF)
curl -X PATCH http://localhost:3000/api/finances/depenses/demandes/DEMANDE_ID/valider \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision":"APPROUVEE"}'

# 3. Payer dépense (COMPTABLE)
curl -X POST http://localhost:3000/api/finances/depenses/DEPENSE_ID/payer \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"montantPaye":200000,"methodePaiement":"VIREMENT"}'
```

---

## Notes importantes

### Numérotation continue
- **Reçus** : `REC-{année}-{sequence}` (ex: `REC-2026-00001`)
- **Dépenses** : `DEP-{année}-{sequence}` (ex: `DEP-2026-00001`)
- **Écritures comptables** : `EC-{année}-{sequence}`

### Règles métier
- ✅ **Jamais supprimer** un paiement ou dépense → utiliser annulation
- ✅ **Double validation** si montant > seuil configurable
- ✅ **Pénalités automatiques** si retard > joursGrace
- ✅ **Écritures comptables** générées automatiquement
- ✅ **Multi-tenant** : toutes les données filtrées par `etablissementId`

### Cron jobs automatiques
- ⏰ **Relances scolarité** : Tous les jours à 8h00
- ⏰ **Alertes budget** : Tous les lundis à 9h00
- ⏰ **Vérification caisse** : Tous les jours à 7h00
- ⏰ **Rapports hebdomadaires** : Vendredi 17h00

---

**Version API** : 1.0.0  
**Dernière mise à jour** : 7 juin 2026
