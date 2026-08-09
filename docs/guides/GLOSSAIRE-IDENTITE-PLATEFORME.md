# Glossaire — Identité & Plateforme

## Termes

| Terme | Définition |
|-------|-----------|
| **Identité** | Source unique de vérité pour l'authentification. Une identité = un email + mot de passe + MFA. Stockée dans la table `identites`. |
| **Membership** | Association entre une Identité et un contexte (Plateforme ou Établissement). Une identité peut avoir N memberships. Table pivot `memberships`. |
| **Control Plane** | La plateforme eLISAschool elle-même — gestion des admins, configurations globales, facturation, monitoring. Opposé de Data Plane. |
| **Data Plane** | Les établissements tenants — gestion des élèves, notes, bulletins, etc. Chaque établissement est isolé (multi-tenant). |
| **Scope JWT** | Claims `platform` et `tenant` dans le JWT qui déterminent le périmètre d'accès de l'utilisateur authentifié. |
| **Dual CASL** | Deux systèmes de capacités CASL coexistants : `defineAbility()` pour le Data Plane (tenant), `definePlatformAbility()` pour le Control Plane (plateforme). |
| **Rôle plateforme** | L'un des 6 rôles du Control Plane : SUPER_ADMIN, ADMIN_PLATEFORME, SUPPORT, BILLING_MANAGER, ANALYST, AUDITOR. |
| **Permission plateforme** | L'une des ~40 permissions granulaires du Control Plane (ex: `platform:users:read`, `platform:facturation:manage`). |
| **Session plateforme** | Session active d'un utilisateur plateforme. Limite 3 sessions LRU par utilisateur. Table `sessions_plateforme`. |
| **Impersonate** | Fonctionnalité future permettant à un admin plateforme de se connecter en tant qu'un autre utilisateur (à des fins de support). |
| **LRU** | Least Recently Used — stratégie de limite de sessions : quand un utilisateur dépasse 3 sessions, la plus ancienne est supprimée. |
| **Big-bang migration** | Stratégie de migration qui crée toutes les nouvelles tables d'un coup (vs migration progressive). |
| **Modèle C** | Architecture choisie : reproduire les concepts Auth0 en interne (PostgreSQL + CASL), sans dépendance externe. Score 8.0/10. |

## Enums

### RolePlateforme
```
SUPER_ADMIN        — Accès total
ADMIN_PLATEFORME   — Gestion quotidienne
SUPPORT            — Support technique (lecture)
BILLING_MANAGER    — Facturation & revenus
ANALYST            — Analyse & export (lecture)
AUDITOR            — Audit & sécurité
```

### ContexteType
```
PLATEFORME     — Membership au niveau plateforme
ETABLISSEMENT  — Membership au niveau établissement
```

### StatutIdentite
```
ACTIF       — Compte actif
SUSPENDU    — Compte temporairement suspendu
DESACTIVE   — Compte désactivé définitivement
```
