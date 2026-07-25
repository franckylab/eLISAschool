# 📋 IMPLEMENTATION — Suppression de TypePersonnel au profit de Fonction.categorie (v5.0)

> **Contexte** : Le personnel enseignant était déterminé par l'entité `TypePersonnel` (table globale `types_personnel`), redondante avec le système Fonction/Poste. Refonte pour dériver la catégorie statutaire depuis la fonction du poste occupé.
> **Date** : 2026-07-25
> **Auteur** : franck arlos chendjou
> **Statut** : ✅ Terminé

---

## 🎯 Objectif

Distinguer le personnel enseignant (et toutes les catégories statutaires) via la **fonction** de son poste, et supprimer complètement l'entité obsolète `TypePersonnel` :

- Un membre est **enseignant** ⟺ il occupe un poste dont `fonction.categorie === 'ENSEIGNANT'`.
- La catégorie est **toujours dérivée**, jamais stockée sur le membre.
- Backend + frontend + i18n + seeds + migration.

## 🔍 Analyse

### Problèmes du modèle v4.0
- Double source de vérité : `MembrePersonnel.typePersonnelId` (stocké) vs `poste.fonction.typePersonnel` (dérivé) → incohérences possibles.
- Entité globale `TypePersonnel` avec un seul rôle réel : qualifier la fonction — un simple enum suffit.
- Nomenclature « Types personnel » (page + CRUD + hooks + i18n) maintenue pour rien.

### Décision
Remplacer la FK `Fonction.typePersonnelId` par un champ enum `Fonction.categorie` :

```
CategorieFonction = ENSEIGNANT | DIRECTION | ADMINISTRATIF | TECHNIQUE | SERVICE | SANTE | SOCIAL | AUTRE
```

Colonne : `varchar(20) NOT NULL DEFAULT 'AUTRE'`.

## ✅ Solution / Implémentation

### Backend
| Élément | Changement |
|---------|-----------|
| `shared` constantes | Enum `CategorieFonction` (8 valeurs) + labels |
| `Fonction` entity | `typePersonnelId` (FK) → `categorie` (varchar 20, défaut AUTRE), fonctions ENSEIGNANT en seed système |
| Migration **121** | Backfill `categorie` depuis l'ancien type, `DROP TABLE types_personnel CASCADE`, `DROP COLUMN fonctions."typePersonnelId"` |
| `personnel.service` | Catégorie **calculée** : affectations → `poste.fonction.categorie`, fallback `MembreFonction`. API expose `categorie`, `estEnseignant`, `categorieSource` |
| `contrat.service` | Compatibilité vérifiée via `poste.fonction?.categorie` |
| Controllers | Routes `/api/personnel/types-personnel` supprimées |
| Seeds | `seed-type-personnel.ts` supprimé ; `seed-organisation.ts` et `seed-nomenclatures.ts` adaptés ; templates avec `categorie` |

### Frontend
| Élément | Changement |
|---------|-----------|
| Nomenclatures | Onglet « Types personnel » supprimé → 3 onglets (Échelons, Responsabilités, Modes rémun.) |
| `use-types-personnel.ts` | Supprimé ; `query-keys.ts` factorisé (`liste: (filtres: object)`) |
| Fonctions | Sélecteur `categorie` (badge coloré, icône GraduationCap pour ENSEIGNANT) dans formulaire + colonnes + détail |
| Personnel | Badge catégorie dérivée (`categorie`, `estEnseignant`) sur liste et fiche |
| `personnel-search-field` | Prop obsolète `typeCode` supprimée |
| i18n FR/EN | Clés `categorie_*` ajoutées, clés `typePersonnel*` nettoyées |
| Générique | `NomenclatureCrudPage<T>` : contrainte `EntityWithId` assainie (index signature retirée) |

### Documentation / Règles
- `AGENTS.md` : bloc architecture v4.0 → **v5.0** (7 entités, TypePersonnel dans les entités supprimées).
- `.qoder/skills/elisaschool-business-logic/SKILL.md` : Domaine 11 réécrit (Catégorie de Fonction v5.0).
- `.qoder/skills/elisaschool-dev/SKILL.md` : exemple « type dérivé » mis à jour.
- `.qoder/rules/elisaschool-conventions.md` : exemple DTO paginé dé-TypePersonnel-isé.

## 📊 Statistiques

| Métrique | Valeur |
|----------|--------|
| Entités supprimées | 1 (`TypePersonnel`) |
| Migration | 121 (idempotente) |
| Routes API supprimées | 4 (CRUD types-personnel) |
| Pages frontend supprimées | 1 (`types-personnel-page`) + hook `use-types-personnel` |
| Erreurs TS corrigées (modules touchés) | ~20 → 0 |

## 📚 Références

- [AGENTS.md — Décisions Architecturales v5.0](../../AGENTS.md)
- Migration : `backend/database/migrations/121-*.sql`
- Skill logique métier : `.qoder/skills/elisaschool-business-logic/SKILL.md` (Domaine 11)

---

**📌 Notes** : L'erreur `personnel-detail-page.tsx(178)` (icône PageHeader) est pré-existante au refactoring et hors périmètre.
