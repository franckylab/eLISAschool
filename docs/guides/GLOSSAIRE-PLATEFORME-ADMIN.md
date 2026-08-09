# Glossaire — Plateforme Admin eLISAschool

**Version** : 1.0.0
**Date** : 2025-07-10
**Portée** : Panel d'administration plateforme (Control Plane)

---

## Termes Architecture

| Terme | Définition |
|-------|-----------|
| **Control Plane** | Plan de contrôle — Interface d'administration globale de la plateforme eLISAschool. Gère les établissements, utilisateurs plateforme, configuration système. |
| **Data Plane** | Plan de données — Espace de travail de chaque établissement (tenant). Contient les données métier : élèves, notes, bulletins, etc. |
| **Tenant** | Locataire — Un établissement (école) utilisant la plateforme eLISAschool. Isolé des autres tenants. |
| **Multi-tenancy** | Architecture permettant à plusieurs établissements de partager la même instance applicative avec isolation des données. |
| **SaaS** | Software as a Service — Modèle de distribution logicielle où eLISAschool est hébergé centralement et fourni aux établissements par abonnement. |

## Termes Navigation

| Terme | Définition |
|-------|-----------|
| **Sidebar** | Barre latérale de navigation. Dans le contexte plateforme, organisée en 4 groupes : Pilotage, Tenants, Technique, Sécurité. |
| **PlatformHeader** | Header dédié à l'espace plateforme avec logo, badge ADMIN, recherche Cmd+K, notifications, santé système, dropdown profil. |
| **CommandPalette** | Palette de commande (Cmd+K) — Navigation rapide par recherche fuzzy vers toutes les routes de l'application. |
| **Groupe workflow** | Regroupement d'items sidebar par intention métier (Pilotage, Tenants, Technique, Sécurité). |

## Termes Rôles & Sécurité

| Terme | Définition |
|-------|-----------|
| **SUPER_ADMIN** | Rôle disposant de l'accès total à la plateforme. Ne peut pas être supprimé. Protection : dernier SUPER_ADMIN non supprimable. |
| **ADMINISTRATION_PLATEFORME** | Rôle de gestion quotidienne — CRUD établissements, facturation, modules, configuration. |
| **SECURITE_PLATEFORME** | Rôle sécurité — RBAC, audit, MFA, utilisateurs plateforme. |
| **SUPPORT_PLATEFORME** | Rôle support — Monitoring read/write, providers, debugging. |
| **COMMERCIAL_PLATEFORME** | Rôle commercial — Plans, tarifs, offres, revenus. |
| **MONITORING_PLATEFORME** | Rôle monitoring — Dashboards, alertes, metrics (read-only sur le reste). |
| **Role Builder** | Interface de création de rôles personnalisés avec sélection granulaire de permissions. |
| **RBAC** | Role-Based Access Control — Modèle de contrôle d'accès basé sur les rôles et permissions. |
| **Scope** | Portée d'un rôle — Définit quels groupes d'établissements un admin peut gérer. |
| **MFA** | Multi-Factor Authentication — Authentification à deux facteurs. Obligatoire pour tous les comptes plateforme. |
| **Grace period** | Période de grâce — Délai (24h) pendant lequel un utilisateur sans MFA peut encore accéder au panel. |
| **Audit trail** | Journal d'audit — Trace horodatée de toutes les actions effectuées sur la plateforme. |
| **Délégation** | Mécanisme permettant à un admin de transférer temporairement ses droits à un autre utilisateur. |

## Termes Paramètres

| Terme | Définition |
|-------|-----------|
| **Cascade** | Modèle de résolution des paramètres en 4 niveaux : Système → Global → Groupe → Établissement. |
| **Override** | Valeur spécifique définie à un niveau inférieur qui remplace la valeur du niveau parent. |
| **Propagation** | Action d'appliquer une valeur globale à tous les établissements (sauf ceux ayant un override). |
| **Valeur effective** | Valeur finale d'un paramètre pour un établissement donné, après résolution de la cascade. |
| **Incohérence** | Situation où des overrides contradictoires créent des conflits de configuration. |
| **Rollback** | Action de revenir à une version précédente d'un paramètre. |

## Termes Facturation

| Terme | Définition |
|-------|-----------|
| **MRR** | Monthly Recurring Revenue — Revenu récurrent mensuel. KPI principal SaaS. |
| **ARR** | Annual Recurring Revenue — Revenu récurrent annuel (MRR × 12). |
| **ARPU** | Average Revenue Per User — Revenu moyen par établissement. |
| **Churn Rate** | Taux d'attrition — Pourcentage d'établissements qui annulent leur abonnement. |
| **Plan** | Formule d'abonnement (Gratuit, Standard, Premium, Enterprise). |

## Termes Groupes

| Terme | Définition |
|-------|-----------|
| **Groupe d'établissements** | Ensemble logique d'établissements permettant une gestion groupée (configuration, scope admin, facturation). |
| **Scope groupe** | Restriction du périmètre d'un admin à un ou plusieurs groupes d'établissements. |

## Termes UI/UX

| Terme | Définition |
|-------|-----------|
| **Ultra-responsivité** | Approche responsive avec 11 breakpoints (100px → 2560px) et `clamp()` pour les tailles fluides. |
| **CSS Variables** | Variables CSS personnalisées pour le theming : `--color-dominante`, `--color-bordure`, `--space-md`, etc. |
| **Skeleton loading** | Placeholder animé affiché pendant le chargement d'une page. |
| **Badge** | Petit indicateur visuel (compteur notifications, statut rôle, état MFA). |

---

## Conventions de nommage

| Contexte | Convention | Exemple |
|----------|-----------|---------|
| Routes frontend | `platform.{section}.tsx` | `platform.revenus.tsx` |
| Clés i18n sidebar | `sidebar.groupe{Nom}` | `sidebar.groupePilotage` |
| Clés i18n navigation | `navigation.{item}` | `navigation.revenus` |
| Clés i18n descriptions | `sidebar.desc{Item}` | `sidebar.descRevenus` |
| Permissions backend | `platform:{module}:{action}` | `platform:administration:*` |
| Rôles enum | `{ROLE}_PLATEFORME` | `SECURITE_PLATEFORME` |
