# 📋 AMÉLIORATION — Cohérence académique : coefficient, barème, volume horaire, affectations

> **Contexte** : Design formel issu de l'audit /grill-me (coefficient, barème, crédit, volume horaire, programme, chapitre, AffectationMatiere, AffectationEleve, Classe/ClasseAnnee). 4 audits parallèles consolidés, 6 arbitrages utilisateur validés.
> **Date** : 2026-07-27
> **Auteur** : franck arlos chendjou
> **Statut** : ✅ Validé — prêt pour implémentation

---

## 🎯 Arbitrages validés (source de vérité)

| # | Sujet | Décision |
|---|-------|----------|
| A1 | Chaîne coefficient | **Canon unique** : `AffectationMatiere` (active) → `ProgrammeMatiere` (du programme de la ClasseAnnee) → `MatiereNiveau` → `1`. Helper partagé unique. |
| A2 | `MatiereNiveau.credits` | **Supprimer** (entité + DTO + frontend + migration DROP COLUMN). |
| A3 | AffectationEleve | **`classeAnneeId` NOT NULL = source unique** + index unique **partiel** `WHERE actif=true` + fonction `transfererEleve()` historisante (`dateSortie`, `motifChangement`). |
| A4 | Volume horaire | **Minutes partout** — normaliser toute la chaîne (seed, entités, EDT, conflits, synthèse, frontend) en minutes. |
| A5 | Chapitres (corrélation `programmeMatiereId`) | **Différé** — hors périmètre de cette itération. |
| A6 | `AffectationMatiere.obligatoire` / `statutValidation` | **Garder + brancher** : `statutValidation` connecté au `validationWorkflowService` ; `obligatoire` lu par les bulletins (matière optionnelle sans note = exclue de la moyenne). |

---

## 🔍 Phase P0 — Correctifs critiques (données fausses / flux bloqués)

### P0.1 — Helper coefficient unique (A1)

**Problème** : 3 chaînes de résolution contradictoires :
- `notes.service.ts:156-196` : Affectation → ProgrammeMatiere → MatiereNiveau (+ code mort `pm?.bareme` l.179,403 — champ inexistant sur ProgrammeMatiere)
- `bulletins.service.ts:179-188` : Affectation → MatiereNiveau (ProgrammeMatiere ignoré)
- `matieres.service.ts:451-453` : ProgrammeMatiere → MatiereNiveau → Affectation

**Solution** : créer `backend/src/modules/matieres/services/coefficient-resolver.service.ts`
```typescript
export interface CoefficientResolu {
    coefficient: number;
    bareme: number;
    source: 'affectation' | 'programme' | 'matiere_niveau' | 'defaut';
}

// Chaîne canonique :
// 1. AffectationMatiere ACTIVE (classeAnneeId, matiereId) — coefficient si défini
// 2. ProgrammeMatiere du programme de la ClasseAnnee (classeAnnee.programmeId + matiereId)
// 3. MatiereNiveau (matiereId, niveauId de la ClasseAnnee)
// 4. Défaut : coefficient = 1, bareme = 20
async resoudreCoefficient(classeAnneeId: string, matiereId: string, etablissementId: string): Promise<CoefficientResolu>
// + variante batch : resoudreCoefficients(classeAnneeId, matiereIds[]) — 3 requêtes max, pas de N+1
```

**Consommateurs à migrer** (suppression des logiques locales) :
- `notes.service.ts` (:156-196 + fix :158-160 filtre `actif: true` manquant, code mort `pm?.bareme` supprimé)
- `bulletins.service.ts` (:179-188)
- `matieres.service.ts` (:451-453)
- `dashboard-dataloader.service.ts` (:127-133 — ajouter la pondération coefficient à la moyenne AVG)

**Règle barème** : le barème vit sur `MatiereNiveau.bareme` (et Note.bareme pour la saisie). ProgrammeMatiere n'a PAS de barème — ne pas l'inventer.

### P0.2 — Volume horaire en minutes partout (A4)

**Problème** : `seed-matieres-niveaux.ts:212` seed `horaireHebdo * 60` (minutes) mais tous les consommateurs traitent la valeur en heures → EDT génère ~262 créneaux au lieu de ~4.

**Solution** — convention unique : **`MatiereNiveau.volumeHoraire` = minutes/semaine**.
1. **Entité** : renommer sémantiquement via commentaire + doc ; type int inchangé.
2. **Migration `128-volume-horaire-minutes.sql`** (idempotente) : détecter les lignes en heures (`volumeHoraire < 60` = heuristique valeur en heures) → `UPDATE ... SET "volumeHoraire" = "volumeHoraire" * 60 WHERE "volumeHoraire" > 0 AND "volumeHoraire" < 60`. Garde-fou : log du nombre de lignes converties.
3. **Seed** : conserver `* 60` (désormais correct), commenter explicitement l'unité.
4. **Consommateurs backend** :
   - `emploi-du-temps.service.ts:329-330` : `volumeHeures*60/dureeCreneau` → `volumeMinutes/dureeCreneau`. Supprimer le défaut silencieux `|| 2` → si volume absent, warning logger + skip matière.
   - `emploi-du-temps.service.ts:326-328` + `conflit-detection.service.ts:240-273` : lookup MatiereNiveau non déterministe → utiliser (matiereId, niveauId de la ClasseAnnee) avec `findOneOrFail`-style garde.
   - `conflit-detection.service.ts:247` : `if (!volumeHoraire) return null` → émettre un avertissement « volume non défini » au lieu de passer silencieusement.
   - `programme-pedagogique.service.ts:109-110` : somme en minutes, exposer `volumeTotalMinutes` + dérivée `volumeTotalHeures` (affichage).
   - `programme-chapitre.service.ts:185-197` : idem.
5. **Frontend** :
   - Helper partagé `frontend/src/lib/duree-utils.ts` : `formatMinutes(min): "4h" | "1h30" | "45min"` — AUCUN affichage brut de minutes.
   - `edt-synthese.tsx:63-65` : `volumeRequis` câblé sur la vraie valeur (minutes), affichage via `formatMinutes`.
   - Formulaires MatiereNiveau : saisie en heures+minutes (2 champs ou input `h:mm`), stockage minutes.
   - `matiere-detail-page.tsx`, `programme-matiere-modal.tsx` : affichages convertis.
6. **i18n** : clés `volumeHoraireMinutes`, `parSemaine`, formats FR/EN.

### P0.3 — Refonte AffectationEleve + transfert de classe (A3)

**Problème** : `affectation-eleve.entity.ts:40` index unique strict `['eleveId','anneeScolaireId']` → un élève ne peut JAMAIS changer de classe dans l'année. Triple stockage redondant (`classeId` NOT NULL, `classeAnneeId` nullable, `anneeScolaireId` sans FK). `desaffecterEleve` (:464-506) conserve la ligne `actif=false` → violation d'unicité à la réaffectation.

**Solution** :
1. **Entité** :
   - `classeAnneeId` → NOT NULL, FK ClasseAnnee = **source unique** (classeId/anneeScolaireId dérivés via relation ; conserver `classeId` en colonne dénormalisée lecture seule si des requêtes legacy en dépendent, sinon DROP — à trancher à l'implémentation selon le volume d'usages).
   - Ajouter `dateSortie?: Date`, `motifChangement?: string` (varchar 50 : TRANSFERT, DEMENAGEMENT, DISCIPLINE, AUTRE).
   - Index unique **partiel** : `@Index(['eleveId','anneeScolaireId'], { unique: true, where: '"actif" = true' })` — un seul actif par an, historique conservé.
2. **Migration `129-affectation-eleve-refonte.sql`** (idempotente) :
   - Backfill `classeAnneeId` depuis (classeId, anneeScolaireId) pour les lignes NULL ; puis SET NOT NULL.
   - DROP index unique strict, CREATE index unique partiel `WHERE actif = true`.
   - ADD COLUMN dateSortie, motifChangement.
   - FK anneeScolaireId.
3. **Service `classes.service.ts`** — nouvelle méthode `transfererEleve(eleveId, versClasseAnneeId, motif, utilisateurId, etablissementId)` :
   - Transaction : clore l'affectation active (`actif=false`, `dateSortie=now`, `motifChangement`), créer la nouvelle, décrémenter/incrémenter `effectifActuel`, audit log.
   - `affecterEleve` (:384-432) : si affectation active existante → 409 avec message orientant vers le transfert.
   - `desaffecterEleve` (:464-506) : renseigner `dateSortie` + `motifChangement`, décrémenter effectif, filtre `etablissementId` sur le findOne.
   - Effectif : incrément déplacé APRÈS validation workflow (bug :427-436 — incrément seulement si `!requireValidation` → jamais incrémenté à l'approbation).
4. **Frontend** :
   - `classe.types.ts:143-149` : `AffecterEleveDto.classeId` → `classeAnneeId` (aligné v4.0).
   - Modal « Transférer l'élève » (CustomModal + RHF/zod) : sélecteur classe cible + motif ; historique des affectations visible sur la fiche élève (onglet, badges motif).
   - Hooks : `useTransfererEleve` + invalidations croisées (élèves, classes, effectifs, notes).
5. **Définition unique « élève actif »** : helper/scope partagé = `actif: true AND statut: ACTIVE AND anneeScolaireId = <année courante>`. Migrer les 3 variantes divergentes (notes.service:116-131,341-358 ; classes.service:253-254,317,384-390 ; dashboard-dataloader:131,182).

### P0.4 — Portail parents : données fausses et fuites

`portal-parent.service.ts` :
- `:110` : `moyennesParMatiere[matiereId] += note.noteSur20` sans division → remplacer par accumulateur `{ somme, sommeCoef }` et moyenne pondérée via le helper P0.1 (cohérent avec `calculerMoyenne` notes.service:634-656 : VALIDEE+PUBLIEE, /20, pondéré).
- `:95-101` : filtrer `statut IN (VALIDEE, PUBLIEE)` — ne JAMAIS exposer BROUILLON aux parents. (Décision produit : exposer uniquement PUBLIEE si le workflow de publication est actif — paramètre `notes.parent_voir_validees` défaut false.)
- `:142` : n'exposer que les bulletins `publie = true`.
- `:283` : « dernierBulletin » → tri `dateDebut DESC` (ou `createdAt DESC`).

### P0.5 — Multi-tenant : gardes manquantes

- `notes.service.ts:70-78`, `bulletins.service.ts:59-70`, `classes-annees.service.ts:86` : lecture de `ParametreSysteme` sans `etablissementId` → passer le tenant partout (`getParam*(cle, { defaultValue, etablissementId })`).
- `matieres.service.ts:246-250,364-368` : ClasseAnnee chargée sans filtre `etablissementId` → ajouter.
- `classes.service.ts:416` : `require_validation` lu sans tenant → corriger.
- `bulletins.service.ts:129` : `getMatieresParNiveau` → filtrer par programme de la ClasseAnnee + tenant.

### P0.6 — Config : bug falsy + clés fantômes

- `config.helper.ts:74` : `parseFloat(...) || defaultValue || 0` écrase un 0 légitime → `Number.isFinite(n) ? n : defaultValue`.
- Clés lues mais jamais seedées → ajouter au `configuration-seed.service.ts` : `programme.ecart_acceptable_progression` (10), `programme.gamification_enseignants_actif` (false), clé fallback bulletins (:56).
- Appels avec défauts positionnels ignorés (`, 10`, `, true`) → forme `{ defaultValue }` partout (correlation-programme.service.ts:70,111,202,231).
- Clés seedées jamais lues (`notes.show_ranking`, `bulletins.validation_threshold`, `notes.auto_notify_on_validation`, `programmes.auto_calcul_progression`) : documenter comme réservées OU brancher — décision à l'implémentation, a minima commentaire dans le seed.

---

## 🔍 Phase P1 — Cohérence métier

### P1.1 — Brancher `statutValidation` + `obligatoire` (A6)

- **`statutValidation`** : intégrer AffectationMatiere au pattern workflow standard (§17 conventions) :
  - `matieres.service.ts` création affectation : si `matieres.require_validation` → `statutValidation = EN_ATTENTE_VALIDATION` + `validationWorkflowService.createWorkflow({ module: 'matieres', entiteId, entiteType: 'AffectationMatiere', ... })`.
  - Dispatch effectif du workflow → statut VALIDEE/REJETEE sur l'entité.
  - EDT + notes : ignorer les affectations `EN_ATTENTE_VALIDATION`.
- **`obligatoire`** : `bulletins.service.ts:179-188` — matière `obligatoire=false` SANS note validée → exclue de la moyenne (au lieu de compter 0). Matière obligatoire sans note → reste comptée 0 + mention « non évaluée » sur le bulletin.
- Frontend : badge statut validation sur les affectations, toggle obligatoire visible, i18n FR/EN.

### P1.2 — Suppression `credits` (A2)

- Entité `matiere-niveau.entity.ts:113` : champ supprimé.
- DTO Zod, types frontend, formulaires, colonnes : supprimés.
- Migration `130-drop-matiere-niveau-credits.sql` : `ALTER TABLE matieres_niveaux DROP COLUMN IF EXISTS credits`.

### P1.3 — Index/contraintes MatiereNiveau

- `matiere-niveau.entity.ts:51` : index composite → `{ unique: true }` sur `['matiereId','niveauId','etablissementId']`, aligné sur `074-matiere-niveau-unique-composite.sql`. Purger l'index unique résiduel divergent.
- `bareme` : reste INT ; validation Zod `min(1)`.

### P1.4 — Intégrité suppressions matières

- `matieres.service.ts:106-113,181-186` : avant delete → vérifier notes/affectations/créneaux dépendants, 409 avec détail. (Pattern `verification-suppression.service`.)
- `:340` : `dto.actif` réactivation arbitraire d'affectation → interdire via update générique, passer par endpoint dédié.
- `:360-380` : `moveAffectation` → check doublon (classeAnneeId cible, matiereId) avant move.
- `classes-annees.service.ts:228-247` : delete → vérifier aussi affectations matières + créneaux. `:423,478` : `promouvoirClasse` ne pas écraser `effectifActuel` (recalculer depuis les affectations actives).

### P1.5 — Stats bulletins cohérentes

- `bulletins.service.ts:269-283` vs `:349-363` : unifier `calculerStatsMatieres` — MIN/MAX sur les **moyennes d'élèves** (pas les notes individuelles), join filtré par `classeAnneeId`.
- `notes.service.ts:709-710` : `getStatistiques` → moyenne pondérée (aligner sur `calculerMoyenne`).

---

## 🔍 Phase P2 — Frontend / UX

### P2.1 — Invalidations TanStack Query
- `use-notes.ts` : mutations → invalider aussi `BULLETINS_KEYS` + dashboard.
- `use-matieres.ts:219-249,314-363` : invalidations croisées (programmes, EDT). Déduplication des hooks vs `use-programmes.ts:133-178` (une seule source, barrel).

### P2.2 — Barème dynamique
- `bulletin-detail-page.tsx:68-69,209-217` : `/20` hardcodé → barème résolu depuis les données (note.bareme, moyennes /20 canoniques affichées avec le libellé du barème).
- Réutiliser `note-couleur.ts` (helper exemplaire) partout où des couleurs de note sont affichées.

### P2.3 — Nettoyage UX
- `classe-detail-page.tsx` (830 l.) : refactor pattern `utilisateurs` (TabsBar `?tab=`, suppression code mort, `bg-pink-500` → CSS vars).
- `programmes-page.tsx` : câbler l'édition (bouton mort).
- `edt-page.tsx` : toggle sans effet → câbler ou supprimer.
- `edt-calendar.tsx:15-22` : couleurs par nom FR → `matiere.couleur` (fallback palette CSS vars).
- `matiere-detail-page.tsx:114-124` : bug `niveauId` vs Set `classeAnneeId` → corriger le membership check.
- `programme-matiere-modal.tsx:50` : champ `volumeHoraire` fantôme supprimé (source = MatiereNiveau) ; 100% des chaînes FR → i18n.
- Typo i18n `oubligatoire` → `obligatoire` (FR+EN, tous usages).

### P2.4 — Canon d'icônes (académique)
| Concept | Icône Lucide |
|---------|--------------|
| Matière | BookOpen |
| Programme | BookMarked |
| Chapitre | Bookmark |
| Coefficient/barème | Scale |
| Volume horaire | Clock3 |
| Affectation matière | Link2 |
| Classe / ClasseAnnee | School |
| Affectation élève / transfert | ArrowRightLeft |
| Notes | ClipboardList |
| Bulletins | FileText |

---

## 📊 Plan de migrations

| # | Fichier | Contenu |
|---|---------|---------|
| 128 | `128-volume-horaire-minutes.sql` | Conversion heures→minutes (heuristique <60), idempotente |
| 129 | `129-affectation-eleve-refonte.sql` | Backfill classeAnneeId, NOT NULL, index partiel, dateSortie/motifChangement, FK |
| 130 | `130-drop-matiere-niveau-credits.sql` | DROP COLUMN credits ; fix index unique composite |
| 131 | `131-affectation-matiere-validation.sql` | Permissions validation matieres (si manquantes), paramètres seed |

Ordre d'implémentation : P0.6 (config, prérequis) → P0.1 (helper) → P0.2 (minutes) → P0.3 (affectations) → P0.4/P0.5 → P1 → P2.

---

## ✅ Critères d'acceptation

- 0 `any` nouveau, 0 couleur hardcodée, 0 chaîne FR en dur, i18n FR/EN parité.
- `tsc --noEmit` 0 erreur in-scope (backend + frontend).
- Un seul point de résolution coefficient/barème (grep : aucune logique locale résiduelle).
- Génération EDT : matière 4h/sem → 4-5 créneaux (plus jamais ~262).
- Transfert de classe fonctionnel bout-en-bout (API + UI + historique).
- Portail parents : moyennes pondérées exactes, aucune note brouillon ni bulletin non publié exposé.
- Migrations idempotentes, appliquées et vérifiées en local.

---

## 🧭 Arbitrages restants — décisions de design

Points laissés « à trancher à l'implémentation » dans les phases P0-P2, tranchés ici pour lever toute ambiguïté avant le code.

### R1 — Colonne dénormalisée `AffectationEleve.classeId` : **conserver en lecture seule (phase 1), DROP différé (phase 2)**

**Contexte** : `classeAnneeId` devient la source unique (P0.3), mais `classeId` NOT NULL est encore lu par des requêtes legacy (classes.service, dashboards, seeds démo).

**Décision** :
1. **Phase 1 (cette itération)** : `classeId` conservé, rendu **dérivé automatiquement** — le service renseigne `classeId = classeAnnee.classeId` à toute création/transfert (jamais fourni par le client). DTO : `classeId` retiré des schémas Zod create/update. Commentaire entité : `/** Dénormalisé depuis classeAnnee.classeId — lecture seule, ne jamais écrire directement */`.
2. **Phase 2 (itération future)** : après migration de tous les consommateurs vers `classeAnneeId` (grep `affectation.classeId` = 0 usage en écriture), migration DROP COLUMN dédiée.

**Justification** : le DROP immédiat imposerait de réécrire dans la même itération tous les joins legacy — risque de régression hors périmètre. La dérivation automatique garantit la cohérence sans big-bang.

### R2 — Clés config seedées jamais lues : **brancher 1, documenter 3 comme réservées**

| Clé | Décision | Détail |
|-----|----------|--------|
| `notes.show_ranking` | **Brancher** | Coût marginal : `bulletins.service.ts` masque `rang`/`rangClasse` dans la réponse API + export PDF si `false` (défaut `true`). Frontend : colonne rang conditionnelle. |
| `bulletins.validation_threshold` | **Réservée** | Le workflow validation utilise `bulletins.validation_levels` (§17). Doublon conceptuel — commentaire `@reserved` dans le seed, candidate à suppression future. |
| `notes.auto_notify_on_validation` | **Réservée** | Les notifications notes sont déjà émises via `notificationTemplates` (non-bloquant). Brancher exigerait un refactor du flux notif hors périmètre. Commentaire `@reserved`. |
| `programmes.auto_calcul_progression` | **Réservée** | Dépend du module progression chapitres (A5 différé). Sera branchée dans l'itération chapitres. Commentaire `@reserved (A5)`. |

### R3 — Exposition parents : **PUBLIEE par défaut, VALIDEE opt-in**

- Paramètre `notes.parent_voir_validees` (boolean, défaut **`false`**, scopé établissement) ajouté au seed.
- `portal-parent.service.ts` : filtre `statut IN (PUBLIEE)` par défaut ; si le paramètre est `true` → `statut IN (VALIDEE, PUBLIEE)`.
- **Jamais** BROUILLON ni EN_ATTENTE_VALIDATION, quel que soit le paramètre.
- Bulletins : uniquement `publie = true`, non paramétrable (la publication EST l'acte d'exposition).
- Frontend portail : aucun badge de statut interne exposé aux parents (VALIDEE et PUBLIEE rendues identiquement).

---

## 📦 A5 — Chapitres : design préparé (itération future, hors périmètre)

> Documenté ici pour que l'itération future démarre sans ré-audit. **Aucun de ces changements n'est inclus dans le plan de migrations 128-131.**

### Problèmes constatés (audit)
1. `programme-chapitre.entity.ts:31` : colonne legacy `matiereNiveauId` — les chapitres devraient s'ancrer sur `programmeMatiereId` (le chapitre appartient à un programme, pas à une matière-niveau globale).
2. `programme-chapitre.service.ts:232` : `getChapitresParMatiereNiveau(matiereNiveauId, '')` — `etablissementId=''` passé en dur → le filtre tenant ne matche jamais → **progression toujours 0**.
3. `programme-chapitre.service.ts:185-197` : agrégations sans garde tenant.
4. `correlation-programme.service.ts:70,111,202,231` : corrélation EDT↔chapitres résolue via `matiereNiveauId` → deux classes de même niveau avec des programmes différents partagent à tort les mêmes chapitres.

### Plan cible
1. **Migration `1XX-chapitres-programme-matiere.sql`** : ADD COLUMN `programmeMatiereId` FK + backfill (join `matiereNiveauId` × programme de chaque ClasseAnnee) + index ; `matiereNiveauId` conservé une itération puis DROP.
2. **Service** : `getChapitresParProgrammeMatiere(programmeMatiereId, etablissementId)` remplace la variante matiereNiveau ; fix immédiat du `''` (:232) en passant le vrai tenant.
3. **Corrélation** : `correlation-programme.service.ts` résout `programmeMatiereId` via `creneaHoraire.affectationMatiere.classeAnnee.programmeId + matiereId`.
4. **Brancher** `programmes.auto_calcul_progression` (cf. R2).
5. **Frontend** : progression par classe (et non par niveau), invalidations croisées programmes/EDT.

### Critères d'acceptation (itération future)
- Deux classes de même niveau, programmes différents → listes de chapitres distinctes.
- Progression ≠ 0 dès qu'un chapitre est complété (bug `''` corrigé).
- 0 référence résiduelle à `ProgrammeChapitre.matiereNiveauId` en écriture.

---

## 🧪 Plan de tests (validation manuelle + API)

| # | Scénario | Attendu |
|---|----------|---------|
| T1 | Coefficient : affectation avec coef=3, programme coef=2, matiereNiveau coef=4 | Helper retourne 3, source='affectation' |
| T2 | Coefficient : affectation sans coef, programme coef=2 | 2, source='programme' |
| T3 | Coefficient : ni affectation ni programme | matiereNiveau puis défaut 1 |
| T4 | Génération EDT matière 240 min/sem, créneaux 55 min | 4-5 créneaux (jamais ~262) |
| T5 | Migration 128 : ligne volumeHoraire=4 | devient 240 ; ligne=240 inchangée (idempotence) |
| T6 | Transfert élève classe A → B mi-année | Ancienne ligne actif=false + dateSortie + motif ; nouvelle active ; effectifs A-1/B+1 ; historique visible fiche élève |
| T7 | Réaffectation après désaffectation | Pas de violation d'unicité (index partiel) |
| T8 | Portail parent : note BROUILLON + note PUBLIEE | Seule PUBLIEE visible ; moyenne pondérée exacte |
| T9 | `notes.parent_voir_validees=true` | VALIDEE aussi visible, rendue sans badge de statut |
| T10 | Affectation matière avec `matieres.require_validation=true` | statutValidation=EN_ATTENTE, invisible EDT/notes, dispatch workflow → VALIDEE |
| T11 | Matière obligatoire=false sans note | Exclue de la moyenne bulletin ; obligatoire sans note → 0 + « non évaluée » |
| T12 | `getParamNumber` avec valeur 0 en DB | Retourne 0 (pas le défaut) |
| T13 | Cross-tenant : lecture note/bulletin/classe d'un autre établissement | 404 |
| T14 | `notes.show_ranking=false` | Rang absent de l'API bulletin + PDF |

---

## 📚 Mises à jour documentaires post-implémentation

- **Skill `elisaschool-business-logic`** : réécrire la section coefficient/barème (chaîne canonique A1, helper unique), volume horaire en minutes, transfert élève, workflow AffectationMatiere.
- **`AGENTS.md`** : section session avec décisions A1-A6 + R1-R3, état migrations 128-131.
- **`docs/INDEX.md`** : référencer ce document (catégorie ameliorations).
- **Règle frontend** : ajouter `duree-utils.ts` (formatMinutes) aux helpers partagés + canon d'icônes académique (P2.4) si adopté.

---

**📌 Différé (hors périmètre)** : bascule corrélation chapitres sur `programmeMatiereId` (A5) — design complet ci-dessus (section A5), à exécuter dans une itération dédiée.
