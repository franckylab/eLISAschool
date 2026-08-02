# ADR — Architecture Template/Instance pour l'Emploi du Temps

**Statut** : Accepté
**Date** : 2026-08-04
**Décideurs** : Équipe eLISAschool

---

## Contexte

Le système d'emploi du temps eLISAschool gère deux entités distinctes :

- **CreneauHoraire** — pattern hebdomadaire abstrait (« Tous les lundis, 08:00-09:00, Maths en 6A »)
- **HeureCours** — instance concrète datée (« Lundi 04 août 2026, 08:00-09:00, Maths en 6A — EFFECTUE »)

La question s'est posée de savoir si ces deux entités étaient redondantes et devaient être fusionnées.

## Décision

**Les deux entités sont maintenues séparées.** Elles suivent le **pattern Template/Instance**, universel en planification (calendrier, ERP, RH).

Cette séparation est architecturalement correcte et ne doit pas être fusionnée.

## Flux de données

```
AffectationMatiere (source de vérité)
    │
    │  qui: enseignantId
    │  quoi: matiereId
    │  à qui: classeAnneeId
    │
    ▼
CreneauHoraire (pattern hebdomadaire)
    │
    │  jour: LUNDI | MARDI | ...
    │  heureDebut/heureFin
    │  typeCreneau: COURS | TP | TD | ...
    │  salleId, periodeId
    │
    │  genererHeuresCoursFromEdt()
    ▼
HeureCours (instance concrète datée)
    │
    │  date: 2026-08-04
    │  heureDebut/heureFin
    │  typeCreneau (copié depuis le créneau)
    │  statutEffectue: PLANIFIE | EFFECTUE | ANNULE | REMPLACE
    │  creneauId (FK vers le pattern source)
    │  enseignantId, classeAnneeId, matiereId (dénormalisés pour performance)
```

## Responsabilités

### CreneauHoraire (Template)

| Responsabilité | Description |
|---|---|
| Définition récurrente | Jour de la semaine + plage horaire + matière + classe |
| Source pour génération | Sert de modèle pour `genererHeuresCoursFromEdt()` |
| Détection de conflits EDT | Les conflits sont détectés au niveau des créneaux |
| Gestion des préférences | Créneaux imposables, volume horaire max |

### HeureCours (Instance)

| Responsabilité | Description |
|---|---|
| Suivi quotidien | Date réelle, statut (effectué/annulé/remplacé) |
| Calcul de paie | Volume horaire réel par enseignant |
| Historique | Archive datée de chaque cours donné |
| Remplacement | Gestion des absences et remplaçants |

## Règles d'or

1. **Ne jamais créer de HeureCours sans creneauId** sauf lors d'une création manuelle explicite
2. **La génération est idempotente** : re-générer ne crée pas de doublons (index unique)
3. **typeCreneau est copié** du CreneauHoraire vers le HeureCours lors de la génération
4. **Les conflits se détectent aux deux niveaux** : EDT (patterns) et HeuresCours (instances)

## Dénormalisation contrôlée

HeureCours stocke en propre `enseignantId`, `classeAnneeId`, `matiereId` en plus de `creneauId`.
Ce choix est **volontaire** pour les raisons suivantes :

- Performance des requêtes quotidiennes (suivi, paie, bulletin)
- Indépendance temporelle : si le pattern change, les instances passées restent valides
- Facilité d'audit : chaque heure contient toutes les informations nécessaires

## Ce qui ne sera PAS fait

- **Fusionner les 2 entités** : détruirait la séparation pattern/instance, rendrait le suivi opérationnel impossible sans filtrage complexe par date
- **Supprimer la dénormalisation** : choix performance valide pour les requêtes quotidiennes
- **Unifier les modules** : `emploi-du-temps` et `personnel` ont des périmètres métier distincts (planification vs gestion du personnel)

## Services partagés

Le service `conflit-commun.service.ts` fournit la logique d'overlap horaire utilisée par les deux modules :

- `verifierOverlapHoraire(debut1, fin1, debut2, fin2)` — vérification de chevauchement
- `calculerDureeMinutes(debut, fin)` — calcul de durée
- `detecterConflitsRessource(existants, nouveau, excludeId)` — détection générique

## Migration et contraintes

- **Migration 139** : ajout colonne `typeCreneau` + index unique anti-doublon
- **Index partiel** : `(enseignantId, date, heureDebut, creneauId) WHERE deletedAt IS NULL`
- **Index alternatif** : `(enseignantId, date, heureDebut) WHERE deletedAt IS NULL AND creneauId IS NULL`
