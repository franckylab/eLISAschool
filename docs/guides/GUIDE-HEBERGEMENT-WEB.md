/**
 * ==================================
 * eLISAschool - Guide complet d'hébergement web
 * ==================================
 * Version: 1.0.0
 * Portée: Architecture, types d'hébergement, comparatif fournisseurs, recommandations eLISAschool
 * Auteur: franck arlos chendjou
 * Date: 2026-08-05
 */

# Guide complet — Hébergement des applications web

> **Contexte** : Guide approfondi couvrant le fonctionnement de l'hébergement web, les types d'offres, les principaux fournisseurs, et les recommandations d'hébergement adaptées à eLISAschool.
> **Date** : 2026-08-05
> **Statut** : Actif

---

## Table des matières

1. [Comment fonctionne l'hébergement web](#1-comment-fonctionne-lhébergement-web)
2. [Types d'hébergement — Comparatif complet](#2-types-dhébergement--comparatif-complet)
3. [Principaux fournisseurs d'hébergement](#3-principaux-fournisseurs-dhébergement)
4. [Recommandations pour eLISAschool](#4-recommandations-pour-elisaschool)

---

## 1. Comment fonctionne l'hébergement web

### 1.1 Principe fondamental

L'hébergement web consiste à mettre à disposition d'une application (site web, API, SaaS) les ressources informatiques nécessaires à son fonctionnement 24h/24 :

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERNET (DNS Resolution)                     │
│                                                                  │
│  Utilisateur → elisaschool.com → DNS → 193.62.128.45            │
│                                          │                       │
│                                          ▼                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              SERVEUR D'HÉBERGEMENT                    │       │
│  │                                                       │       │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────────────┐   │       │
│  │  │  Nginx   │→ │ Node.js  │→ │   PostgreSQL      │   │       │
│  │  │  (proxy) │  │ (Express)│  │   (base données)  │   │       │
│  │  └─────────┘  └──────────┘  └───────────────────┘   │       │
│  │       │              │                                │       │
│  │       │         ┌──────────┐                         │       │
│  │       │         │  Redis   │  (cache + sessions)     │       │
│  │       │         └──────────┘                         │       │
│  │       ▼                                              │       │
│  │  ┌─────────┐                                        │       │
│  │  │ Fichiers│  (uploads, exports PDF, avatars)       │       │
│  │  │  /data  │                                        │       │
│  │  └─────────┘                                        │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Cycle de vie d'une requête

```
1. L'utilisateur tape https://elisaschool.com
2. Le DNS résout le domaine → adresse IP du serveur
3. Le navigateur envoie une requête HTTPS (port 443)
4. Le reverse proxy (Nginx/Caddy) reçoit la requête
5. Il route vers le bon service backend (Node.js)
6. Le backend traite : authentification, logique métier, requêtes DB
7. PostgreSQL retourne les données
8. Redis sert le cache si disponible
9. Le backend construit la réponse JSON
10. Nginx compresse (gzip/brotli) et renvoie au navigateur
11. Le navigateur affiche la page React
```

### 1.3 Composants essentiels d'un hébergement

| Composant | Rôle | Exemple |
|-----------|------|---------|
| **Serveur** | Machine physique ou virtuelle qui exécute le code | CPU 4 vCPU, RAM 8 Go |
| **Système d'exploitation** | Couche basse entre matériel et applications | Ubuntu 22.04 LTS, Debian 12 |
| **Runtime** | Environnement d'exécution de l'application | Node.js 20 LTS |
| **Base de données** | Stockage persistant des données | PostgreSQL 16 |
| **Cache** | Données fréquemment accédées en mémoire | Redis 7 |
| **Reverse proxy** | Route les requêtes HTTP, gère SSL, compression | Nginx, Caddy, Traefik |
| **Stockage fichiers** | Disque pour uploads, exports, médias | SSD NVMe, S3, R2 |
| **Réseau** | Connectivité internet, bande passante, IP publique | 1 Gbps, IP fixe |
| **DNS** | Résolution nom de domaine → IP | Cloudflare DNS, OVH DNS |
| **SSL/TLS** | Chiffrement HTTPS | Let's Encrypt (gratuit) |

### 1.4 Notions clés de performance

| Notion | Définition | Impact |
|--------|-----------|--------|
| **Latence** | Temps aller-retour entre client et serveur (ms) | < 100ms = excellent, > 300ms = mauvais |
| **Bande passante** | Volume de données transférées par seconde | 1 Gbps = ~125 Mo/s |
| **IOPS** | Opérations d'entrée/sortie par seconde (disque) | SSD NVMe = 100K+ IOPS |
| **CPU cores** | Nombre de cœurs de processeur | Plus de cœurs = plus de requêtes parallèles |
| **RAM** | Mémoire vive disponible | PostgreSQL + Redis = gros consommateurs |
| **Uptime** | Disponibilité du service (pourcentage) | 99.9% = 8.7h d'arrêt/an max |
| **MTTR** | Temps moyen de réparation | < 1h = bon, < 15min = excellent |

---

## 2. Types d'hébergement — Comparatif complet

### 2.1 Vue d'ensemble — 8 types d'hébergement

```
Complexité croissante →                        Coût décroissant par utilisateur →
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Hébergement    VPS          Serveur      Cloud IaaS    PaaS      Serverless │
│  partagé        (KVM)        dédié        (EC2, GCE)    (Railway) (Lambda)   │
│                                                                              │
│  ◄──────────────────────────────────────────────────────────────────────►    │
│  Contrôle croissant          Flexibilité croissante                          │
│  Maintenance croissante      Scalabilité croissante                          │
│                                                                              │
│  $2-10/mois   $5-50/mois   $50-500/mois  $20-200/mois  $5-100/mois  $0.001/ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Hébergement mutualisé (Shared Hosting)

**Principe** : Des centaines de sites partagent les mêmes ressources serveur (CPU, RAM, disque).

```
┌─────────────────────────────────────────┐
│           SERVEUR PHYSIQUE              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │Site │ │Site │ │Site │ │Site │ ...   │
│  │  A  │ │  B  │ │  C  │ │  D  │       │
│  │     │ │     │ │     │ │     │       │
│  │PHP  │ │PHP  │ │PHP  │ │PHP  │       │
│  │MySQL│ │MySQL│ │MySQL│ │MySQL│       │
│  └─────┘ └─────┘ └─────┘ └─────┘      │
│                                         │
│  Ressources partagées :                 │
│  CPU: 16 cores | RAM: 64 Go            │
│  DISQUE: 2 To RAID                     │
│  → Chaque site a ~256 Mo RAM max       │
└─────────────────────────────────────────┘
```

| Critère | Détail |
|---------|--------|
| **Prix** | 2-10 €/mois |
| **Performance** | Faible — voisinage bruyant (noisy neighbor) |
| **Contrôle** | Aucun — panneau cPanel/Plesk uniquement |
| **Scalabilité** | Nulle — plafond hard |
| **Technologies** | PHP + MySQL uniquement (pas Node.js) |
| **SSL** | Let's Encrypt inclus |
| **Email** | Souvent inclus |

**Avantages** :
- Prix très bas
- Zéro maintenance serveur
- Panneau d'administration simple
- Email inclus

**Inconvénients** :
- Pas de Node.js / Redis / PostgreSQL custom
- Performance imprévisible
- Pas de SSH complet
- Pas de Docker
- Pas de WebSocket
- Limité en trafic

**Verdict pour eLISAschool** : **IMPOSSIBLE** — pas de support Node.js ni PostgreSQL.

---

### 2.3 VPS (Virtual Private Server)

**Principe** : Un serveur physique découpé en plusieurs machines virtuelles isolées via hyperviseur (KVM, VMware). Chaque VPS a ses propres ressources garanties.

```
┌─────────────────────────────────────────────┐
│           SERVEUR PHYSIQUE                  │
│  Hyperviseur : KVM / VMware ESXi            │
│                                             │
│  ┌──────────────┐  ┌──────────────┐         │
│  │   VPS A      │  │   VPS B      │         │
│  │  (eLISAschool)│  │  (autre)     │         │
│  │              │  │              │         │
│  │ 4 vCPU       │  │ 2 vCPU       │         │
│  │ 8 Go RAM     │  │ 4 Go RAM     │         │
│  │ 100 Go SSD   │  │ 50 Go SSD    │         │
│  │ Ubuntu 22.04 │  │ Debian 12    │         │
│  │              │  │              │         │
│  │ ┌──────────┐ │  │ ┌──────────┐ │         │
│  │ │ Docker   │ │  │ │ LAMP     │ │         │
│  │ │ Compose  │ │  │ │ Stack    │ │         │
│  │ └──────────┘ │  │ └──────────┘ │         │
│  └──────────────┘  └──────────────┘         │
│                                             │
│  CPU: 32 cores | RAM: 128 Go | NVMe 4 To   │
└─────────────────────────────────────────────┘
```

| Critère | Détail |
|---------|--------|
| **Prix** | 5-50 €/mois (4 vCPU / 8 Go = ~15-20 €) |
| **Performance** | Bonne — ressources garanties |
| **Contrôle** | Total — root SSH, Docker, custom kernel |
| **Scalabilité** | Verticale (upgrade CPU/RAM en 1 clic) |
| **Technologies** | Tout : Node.js, PostgreSQL, Redis, Docker |
| **Maintenance** | À votre charge (OS, sécurité, updates) |

**Avantages** :
- Rapport qualité/prix excellent
- Contrôle total (root access)
- Docker supporté
- IP publique dédiée
- Scalabilité verticale rapide
- Choix de la localisation (Paris, Francfort, Londres...)

**Inconvénients** :
- Maintenance serveur à votre charge
- Pas de haute disponibilité native (1 seul serveur)
- Backup à configurer soi-même
- Pas de load balancing natif

**Verdict pour eLISAschool** : **RECOMMANDÉ Phase 1** — meilleur rapport qualité/prix pour démarrer.

---

### 2.4 Serveur dédié

**Principe** : Un serveur physique entier qui vous est exclusivement réservé. Aucune virtualisation.

```
┌─────────────────────────────────────────────┐
│           SERVEUR PHYSIQUE (100% à vous)    │
│                                             │
│  CPU: Intel Xeon E-2388G (8c/16t)          │
│  RAM: 64 Go DDR4 ECC                       │
│  DISQUE: 2 × 1 To NVMe SSD (RAID 1)       │
│  RÉSEAU: 1 Gbps (illimité)                 │
│  IP: 1 IP publique dédiée                  │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  Votre OS : Ubuntu 22.04 LTS        │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐   │   │
│  │  │Docker  │ │Docker  │ │Docker  │   │   │
│  │  │Nginx   │ │Node.js │ │Postgres│   │   │
│  │  │:443    │ │:3000   │ │:5432   │   │   │
│  │  └────────┘ └────────┘ └────────┘   │   │
│  │  ┌────────┐ ┌────────┐              │   │
│  │  │Docker  │ │Docker  │              │   │
│  │  │Redis   │ │Cron    │              │   │
│  │  │:6379   │ │Jobs    │              │   │
│  │  └────────┘ └────────┘              │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Performance maximale — zéro voisinage      │
└─────────────────────────────────────────────┘
```

| Critère | Détail |
|---------|--------|
| **Prix** | 50-500 €/mois |
| **Performance** | Maximale — pas de virtualisation |
| **Contrôle** | Total — hardware + software |
| **Scalabilité** | Limitée (changer de serveur = migration) |
| **Maintenance** | Totale (hardware + software) |

**Avantages** :
- Performance maximale (pas d'overhead virtualisation)
- Contrôle total du hardware
- Pas de noisy neighbor
- RAID matériel pour les données
- Idéal pour les charges lourdes et stables

**Inconvénients** :
- Prix élevé pour les petites charges
- Pas de scalabilité instantanée
- Maintenance hardware (panne disque = intervention physique)
- Provisioning lent (24-48h)
- Sur-provisionnement fréquent (payer pour de la reserve)

**Verdict pour eLISAschool** : **Phase 3** — pertinent à partir de 200+ écoles.

---

### 2.5 Cloud IaaS (Infrastructure as a Service)

**Principe** : Machines virtuelles à la demande sur l'infrastructure d'un hyperscaler (AWS, Google Cloud, Azure). Facturation à l'heure/seconde.

```
┌──────────────────────────────────────────────────────────────┐
│                    AWS / Google Cloud / Azure                 │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  VPC (Virtual Private Cloud)                         │    │
│  │                                                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │  EC2 / GCE  │  │  EC2 / GCE  │  │  EC2 / GCE  │  │    │
│  │  │  App Node   │  │  App Node   │  │  Worker     │  │    │
│  │  │  (2 vCPU)   │  │  (2 vCPU)   │  │  (4 vCPU)   │  │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │    │
│  │         │                 │                 │          │    │
│  │         └────────┬────────┘                 │          │    │
│  │                  │                          │          │    │
│  │         ┌────────▼────────┐        ┌───────▼───────┐  │    │
│  │         │  RDS / Cloud SQL│        │  ElastiCache  │  │    │
│  │         │  PostgreSQL     │        │  Redis        │  │    │
│  │         │  (managed)      │        │  (managed)    │  │    │
│  │         └─────────────────┘        └───────────────┘  │    │
│  │                                                       │    │
│  │  ┌─────────────┐  ┌─────────────┐                    │    │
│  │  │  S3 / GCS   │  │  CloudFront │                    │    │
│  │  │  (fichiers) │  │  (CDN)      │                    │    │
│  │  └─────────────┘  └─────────────┘                    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Facturation : à l'heure, scaling auto, API complète         │
└──────────────────────────────────────────────────────────────┘
```

| Critère | Détail |
|---------|--------|
| **Prix** | 20-200 €/mois (très variable selon usage) |
| **Performance** | Excellente — hardware récent, network backbone |
| **Contrôle** | Total sur les VMs, services managés optionnels |
| **Scalabilité** | Horizontale illimitée (auto-scaling groups) |
| **Services managés** | RDS (PostgreSQL), ElastiCache (Redis), S3, CloudFront |
| **Maintenance** | Partielle (VMs à gérer, DB/cache managés) |

**Avantages** :
- Scalabilité horizontale illimitée
- Services managés (RDS, ElastiCache) = moins de maintenance
- Auto-scaling (ajoute des instances automatiquement)
- Réseau backbone mondial (latence minimale)
- Écosystème complet (CDN, DNS, monitoring, logs)
- Multi-région pour la haute disponibilité

**Inconvénients** :
- Facturation complexe et imprévisible
- Courbe d'apprentissage raide (IAM, VPC, security groups)
- Coût élevé si mal optimisé (instances tournant à vide)
- Vendor lock-in (services propriétaires)
- Support lent (sauf plan enterprise $$$$)
- Pas de PoP au Cameroun (plus proche : Lagos, Johannesburg)

**Verdict pour eLISAschool** : **Phase 3** — pertinent si scaling massif international.

---

### 2.6 Cloud PaaS (Platform as a Service)

**Principe** : Vous déployez votre code, la plateforme gère tout le reste (serveur, OS, scaling, SSL, DNS).

```
┌──────────────────────────────────────────────────────┐
│         Railway / Render / Fly.io / Heroku           │
│                                                       │
│  Vous fournissez :                                    │
│  ┌─────────────────────┐                              │
│  │  Dockerfile ou      │                              │
│  │  package.json +     │────── git push ──────►       │
│  │  Procfile           │                              │
│  └─────────────────────┘                              │
│                                                       │
│  La plateforme fournit :                              │
│  ┌──────────────────────────────────────────────┐     │
│  │  • Build automatique (Docker / Nixpacks)     │     │
│  │  • Déploiement zero-downtime                 │     │
│  │  • SSL automatique (Let's Encrypt)           │     │
│  │  • Scaling horizontal auto                   │     │
│  │  • Base de données managée (PostgreSQL)      │     │
│  │  • Redis managé                              │     │
│  │  • Volume persistant (parfois limité)        │     │
│  │  • Logs + monitoring intégrés                │     │
│  │  • Domaine custom + DNS                      │     │
│  └──────────────────────────────────────────────┘     │
│                                                       │
│  Limitation : WebSocket souvent limité,              │
│  cron jobs restreints, pricing imprévisible          │
└──────────────────────────────────────────────────────┘
```

| Plateforme | Prix min | PostgreSQL | Redis | WebSocket | Cron | Docker |
|------------|----------|-----------|-------|-----------|------|--------|
| **Railway** | $5/mois | Oui ($1.25/Go) | Oui | Oui | Oui | Oui |
| **Render** | $7/mois | Oui ($7/mois) | Non natif | Limité | Oui | Oui |
| **Fly.io** | $0 + usage | Oui (managed) | Non | Oui | Oui | Oui |
| **Heroku** | $5+/mois | Oui ($9/mois) | Oui ($3/mois) | Oui | Oui | Oui |
| **Koyeb** | $0 + usage | Oui | Non | Oui | Oui | Oui |

**Avantages** :
- Déploiement ultra-simple (git push = deploy)
- Zéro maintenance serveur
- SSL/DNS automatique
- Scaling horizontal facile
- CI/CD intégré
- Idéal pour les startups et MVP

**Inconvénients** :
- Prix qui grimpe vite avec le scale
- WebSocket souvent limité (timeout, pas de sticky sessions)
- Cron jobs restreints ou non garantis
- Volume persistant limité ou cher
- Vendor lock-in fort
- Pas de contrôle OS/kernel
- Latence sous-optimale (pas de choix précis de région)

**Verdict pour eLISAschool** : **NON RECOMMANDÉ** — WebSocket + cron + volume persistant = trop de limitations.

---

### 2.7 Conteneurs (Docker Compose / Swarm / Kubernetes)

**Principe** : L'application et ses dépendances sont empaquetées dans des conteneurs Docker, orchestrés par un système de gestion.

#### Docker Compose (1 serveur)

```
┌──────────────────────────────────────────────────────┐
│  SERVEUR VPS (Ubuntu 22.04 + Docker)                 │
│                                                       │
│  docker-compose.yml :                                 │
│  ┌──────────────────────────────────────────────┐     │
│  │  services:                                    │     │
│  │    nginx:     (reverse proxy, SSL, static)    │     │
│  │    backend:   (Node.js API :3000)             │     │
│  │    frontend:  (React SPA via Nginx)           │     │
│  │    postgres:  (base données :5432)            │     │
│  │    redis:     (cache :6379)                   │     │
│  │    cron:      (jobs planifiés)                │     │
│  │                                               │     │
│  │  volumes:                                     │     │
│  │    pg_data:     (données DB persistantes)     │     │
│  │    redis_data:  (cache persistant)            │     │
│  │    uploads:     (fichiers utilisateurs)       │     │
│  │    backups:     (sauvegardes)                 │     │
│  └──────────────────────────────────────────────┘     │
│                                                       │
│  Commandes :                                          │
│  docker compose up -d      → démarrer                 │
│  docker compose pull       → mettre à jour            │
│  docker compose logs -f    → voir les logs            │
│  docker compose restart    → redémarrer               │
└──────────────────────────────────────────────────────┘
```

#### Kubernetes (multi-serveurs)

```
┌──────────────────────────────────────────────────────────────┐
│                    CLUSTER KUBERNETES                         │
│                                                               │
│  ┌─────────────────┐  Control Plane (master)                 │
│  │  API Server      │  ← kubectl communique ici              │
│  │  etcd            │  ← état du cluster                     │
│  │  Scheduler       │  ← placement des pods                  │
│  │  Controller Mgr  │  ← reconciliation                      │
│  └─────────────────┘                                         │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Node 1      │  │  Node 2      │  │  Node 3      │       │
│  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │       │
│  │  │backend │  │  │  │backend │  │  │  │worker  │  │       │
│  │  │pod x2  │  │  │  │pod x2  │  │  │  │pod x3  │  │       │
│  │  └────────┘  │  │  └────────┘  │  │  └────────┘  │       │
│  │  ┌────────┐  │  │  ┌────────┐  │  │              │       │
│  │  │nginx   │  │  │  │nginx   │  │  │              │       │
│  │  │pod x1  │  │  │  │pod x1  │  │  │              │       │
│  │  └────────┘  │  │  └────────┘  │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  Services managés :                                           │
│  • PostgreSQL (Cloud SQL / RDS externe)                      │
│  • Redis (ElastiCache externe)                               │
│  • Ingress Controller (Nginx/Traefik)                        │
│  • Cert-Manager (SSL auto)                                   │
│  • Horizontal Pod Autoscaler                                 │
└──────────────────────────────────────────────────────────────┘
```

| Orchestrateur | Complexité | Scale | Usage |
|---------------|-----------|-------|-------|
| **Docker Compose** | Faible | 1 serveur | Phase 1 (1-50 écoles) |
| **Docker Swarm** | Moyenne | 5-20 serveurs | Phase 2 (50-200 écoles) |
| **Kubernetes** | Élevée | 100+ serveurs | Phase 3 (200+ écoles) |
| **Coolify** | Faible | 1-5 serveurs | Alternative simple à K8s |

**Verdict pour eLISAschool** : **Docker Compose = Phase 1** (recommandé), Kubernetes = Phase 3.

---

### 2.8 Serverless / FaaS (Function as a Service)

**Principe** : Exécution de fonctions à la demande, sans serveur permanent. Facturation à l'exécution (nombre d'invocations + durée).

```
┌──────────────────────────────────────────────────────┐
│         AWS Lambda / Google Cloud Functions           │
│                                                       │
│  Requête HTTP ──► API Gateway ──► Lambda Function    │
│                                      │                │
│                                      ▼                │
│                              ┌──────────────┐         │
│                              │  Exécute le   │         │
│                              │  handler()    │         │
│                              │  (max 15 min) │         │
│                              └──────┬───────┘         │
│                                     │                 │
│                              ┌──────▼───────┐         │
│                              │  DynamoDB /   │         │
│                              │  Aurora / S3  │         │
│                              └──────────────┘         │
│                                                       │
│  Facturation :                                        │
│  • $0.20 / 1M invocations                            │
│  • $0.00001667 / Go-seconde                          │
│  • 1er million de requêtes/mois = GRATUIT            │
│                                                       │
│  ⚠️ PAS de WebSocket natif                           │
│  ⚠️ Cold start = 200-2000ms de latence               │
│  ⚠️ Timeout max = 15 minutes                         │
│  ⚠️ Pas de cron natif (EventBridge requis)           │
└──────────────────────────────────────────────────────┘
```

| Critère | Détail |
|---------|--------|
| **Prix** | Quasi gratuit à faible charge, cher à haute charge |
| **Performance** | Cold start imprévisible (200ms-2s) |
| **WebSocket** | NON SUPPORTÉ nativement |
| **Cron** | Via EventBridge (complexe) |
| **Connexions DB** | Limitées (max 1000 connexions simultanées) |

**Verdict pour eLISAschool** : **NON COMPATIBLE** — WebSocket requis pour notifications temps réel, cron jobs pour matérialisation EDT.

---

### 2.9 Edge Computing

**Principe** : Exécution de code au plus près des utilisateurs, sur des centaines de PoPs (Points of Presence) répartis dans le monde.

```
┌──────────────────────────────────────────────────────┐
│         Cloudflare Workers / Vercel Edge              │
│                                                       │
│  Utilisateur Douala ──► PoP Lagos (5ms)              │
│  Utilisateur Paris  ──► PoP Paris (15ms)             │
│  Utilisateur NYC    ──► PoP New York (10ms)          │
│                                                       │
│  Chaque PoP exécute le code localement               │
│  → Latence minimale pour tous                         │
│                                                       │
│  ⚠️ Limité à des fonctions légères (V8 isolates)     │
│  ⚠️ Pas de Node.js complet (API restreintes)         │
│  ⚠️ Pas de WebSocket persistant                      │
│  ⚠️ Pas de filesystem                                │
│  ⚠️ Max 30 secondes d'exécution                      │
└──────────────────────────────────────────────────────┘
```

**Verdict pour eLISAschool** : **NON COMPATIBLE comme hébergement principal** — mais Cloudflare CDN excellent en complément (cache static assets, DDoS protection).

---

### 2.10 Tableau comparatif synthétique

| Critère | Mutualisé | VPS | Dédié | Cloud IaaS | PaaS | Docker Compose | Serverless | Edge |
|---------|-----------|-----|-------|------------|------|----------------|------------|------|
| **Prix/mois** | 2-10 € | 5-50 € | 50-500 € | 20-200 € | 5-100 € | 5-50 € | ~0-50 € | ~0-20 € |
| **Node.js** | Non | Oui | Oui | Oui | Oui | Oui | Oui* | Limité |
| **PostgreSQL** | MySQL seul | Oui | Oui | Oui (RDS) | Oui | Oui | Oui* | Non |
| **Redis** | Non | Oui | Oui | Oui | Oui | Oui | Limité | Non |
| **WebSocket** | Non | Oui | Oui | Oui | Limité | Oui | Non | Non |
| **Cron jobs** | Non | Oui | Oui | Oui | Limité | Oui | EventBridge | Non |
| **Docker** | Non | Oui | Oui | Oui | Oui | Oui | Non | Non |
| **Scalabilité** | Nulle | Verticale | Limitée | Horizontale | Horizontale | Verticale | Auto | Auto |
| **Maintenance** | Nulle | Moyenne | Élevée | Partielle | Nulle | Moyenne | Nulle | Nulle |
| **Contrôle** | Aucun | Root | Total | VM root | Aucun | Root | Aucun | Aucun |
| **Haute dispo** | Non | Non | RAID | Multi-AZ | Auto | Non | Auto | Auto |
| **Performance** | Faible | Bonne | Maximale | Excellente | Bonne | Bonne | Variable | Minimale latence |

*Serverless : possible mais avec limitations fortes (cold start, timeout, connexions DB).

---

## 3. Principaux fournisseurs d'hébergement

### 3.1 Fournisseurs VPS — Comparatif détaillé

#### 3.1.1 OVHcloud (France)

| Offre | vCPU | RAM | SSD | Prix/mois | Localisation |
|-------|------|-----|-----|-----------|-------------|
| Starter | 1 | 2 Go | 20 Go | 3.50 € | Gravelines, Roubaix, Strasbourg |
| Value | 2 | 4 Go | 80 Go | 7.40 € | Idem |
| **Comfort** | **4** | **8 Go** | **160 Go** | **15.80 €** | **Idem** |
| Elite | 8 | 16 Go | 240 Go | 28.40 € | Idem |

**Avantages** :
- Datacenters en France (Paris) — ~120-140ms vers Douala
- Prix très compétitifs
- Anti-DDoS inclus (VAC)
- Réseau 1 Gbps illimité
- Backup storage inclus (50-250 Go)
- Support français
- Certifications européennes (RGPD)

**Inconvénients** :
- Support lent (réponse 24-48h)
- Pas de managed PostgreSQL
- Incendie Strasbourg 2021 (SBG1-4 détruits) — redondance à prévoir
- Pas de PoP Afrique

**Verdict** : **RECOMMANDÉ pour eLISAschool Phase 1** — meilleur rapport qualité/prix/localisation.

---

#### 3.1.2 Hetzner (Allemagne/Finlande)

| Offre | vCPU | RAM | SSD | Prix/mois | Localisation |
|-------|------|-----|-----|-----------|-------------|
| CX22 | 2 | 4 Go | 40 Go | 4.85 € | Nuremberg, Falkenstein, Helsinki |
| **CX32** | **4** | **8 Go** | **80 Go** | **8.49 €** | **Idem** |
| CX42 | 8 | 16 Go | 160 Go | 15.49 € | Idem |
| CCX33 (dédié) | 4 | 16 Go | 160 Go | 24.99 € | Idem |

**Avantages** :
- Prix les plus bas du marché européen
- Performance CPU excellente (AMD EPYC récents)
- API complète
- Volumes additionnels pas chers (4.85€/mois pour 100 Go)
- Cloud-init, Terraform provider
- Firewall gratuit

**Inconvénients** :
- Localisation Allemagne/Finlande uniquement (~140-170ms vers Douala)
- Pas de managed DB
- Support minimaliste
- Pas de backup inclus (option payante 20% du prix)
- Pas de réseau privé gratuit

**Verdict** : Excellent rapport qualité/prix, mais latence légèrement supérieure à OVH pour le Cameroun.

---

#### 3.1.3 DigitalOcean (USA/Europe/Asie)

| Offre | vCPU | RAM | SSD | Prix/mois | Localisation |
|-------|------|-----|-----|-----------|-------------|
| Basic S-2vCPU | 2 | 4 Go | 80 Go | 12 $ | NYC, SFO, AMS, FRA, LON, BLR, SYD |
| **Basic S-4vCPU** | **4** | **8 Go** | **160 Go** | **24 $** | **Idem** |
| General S-4vCPU | 4 | 16 Go | 200 Go | 48 $ | Idem |

**Services managés** :
- Managed PostgreSQL : $15/mois (1 Go RAM, 10 Go storage)
- Managed Redis : $15/mois (1 Go RAM)
- Spaces (S3-compatible) : $5/mois (250 Go)
- App Platform (PaaS) : $5/mois + usage

**Avantages** :
- Interface utilisateur excellente
- Documentation de référence
- Managed PostgreSQL et Redis
- Spaces = S3-compatible (stockage objets)
- CDN intégré
- Kubernetes managé (DOKS) gratuit
- API et CLI très bien conçus
- Community tutorials

**Inconvénients** :
- Prix 2-3x supérieur à OVH/Hetzner pour les mêmes specs
- Pas de datacenter en Afrique
- Latence similaire à OVH (~130ms depuis NYC vers Douala)
- Facturation à l'heure (bien pour le testing)

**Verdict** : Bonne option si les services managés (PostgreSQL, Redis) sont importants.

---

#### 3.1.4 Scaleway (France)

| Offre | vCPU | RAM | SSD | Prix/mois | Localisation |
|-------|------|-----|-----|-----------|-------------|
| DEV1-M | 2 | 4 Go | 40 Go | 6.99 € | Paris-DC1, DC3, Warsaw |
| **DEV1-L** | **4** | **8 Go** | **80 Go** | **12.99 €** | **Idem** |
| PLAY2-S | 4 | 16 Go | 200 Go | 29.99 € | Idem |

**Services managés** :
- PostgreSQL managé (RDB) : à partir de 9.49 €/mois
- Redis managé : à partir de 9.49 €/mois
- Object Storage (S3-compatible) : 0.01 €/Go/mois
- Serverless Containers / Functions

**Avantages** :
- Datacenter Paris (latence similaire à OVH)
- Services managés (PostgreSQL, Redis)
- Object Storage S3-compatible
- Good API / Terraform
- Prix compétitifs
- Support français

**Inconvénients** :
- Réseau moins robuste qu'OVH
- Moins de datacenters
- Communauté plus petite
- Documentation moins riche

---

#### 3.1.5 Contabo (Allemagne)

| Offre | vCPU | RAM | SSD | Prix/mois | Localisation |
|-------|------|-----|-----|-----------|-------------|
| VPS S | 4 | 8 Go | 200 Go | 7.99 € | Nuremberg, Singapour, USA |
| **VPS M** | **6** | **16 Go** | **400 Go** | **15.99 €** | **Idem** |
| VPS L | 8 | 24 Go | 600 Go | 29.99 € | Idem |

**Avantages** :
- RAM et stockage massifs pour le prix
- Bon pour les workloads memory-intensive
- Pas de limite de bande passante

**Inconvénients** :
- Performance CPU inconsistante (overselling)
- Support très lent
- Pas de managed services
- Réseau de qualité inférieure
- Pas de datacenter Afrique

---

### 3.2 Fournisseurs Cloud (IaaS + services managés)

#### 3.2.1 AWS (Amazon Web Services)

| Service | Équivalent | Prix/mois (min) |
|---------|-----------|-----------------|
| EC2 t3.medium | VPS 2 vCPU / 4 Go | ~30 $ |
| RDS PostgreSQL | Managed PostgreSQL | ~15 $ |
| ElastiCache Redis | Managed Redis | ~15 $ |
| S3 | Object storage | ~0.023 $/Go |
| CloudFront | CDN | ~0.085 $/Go transféré |
| Route 53 | DNS | ~0.50 $/mois |

**Avantages** : Écosystème le plus complet, multi-région, services managés matures
**Inconvénients** : Complexité, coût imprévisible, pas de PoP Afrique centrale

#### 3.2.2 Google Cloud Platform

| Service | Équivalent | Prix/mois (min) |
|---------|-----------|-----------------|
| Compute Engine e2-medium | VPS 2 vCPU / 4 Go | ~25 $ |
| Cloud SQL PostgreSQL | Managed PostgreSQL | ~10 $ |
| Memorystore Redis | Managed Redis | ~13 $ |
| Cloud Storage | Object storage | ~0.020 $/Go |
| Cloud CDN | CDN | ~0.08 $/Go |

**Avantages** : Réseau fibre Google (latence optimale), Kubernetes natif (GKE), BigQuery
**Inconvénients** : Support lent, facturation complexe, pas de PoP Afrique centrale

#### 3.2.3 Azure (Microsoft)

**Avantages** : Intégration Microsoft (Active Directory, Office 365), hybrid cloud
**Inconvénients** : Plus cher qu'AWS/GCP, interface complexe, moins de régions Afrique

---

### 3.3 Fournisseurs CDN et stockage

| Fournisseur | CDN | Stockage objets | Prix stockage | PoP Afrique |
|-------------|-----|-----------------|---------------|-------------|
| **Cloudflare** | Oui (gratuit) | R2 (S3-compat) | $0.015/Go (pas de frais egress!) | Lagos, Johannesburg |
| **Bunny CDN** | Oui | Bunnycdn Storage | $0.01/Go | Johannesburg |
| **AWS CloudFront** | Oui | S3 | $0.023/Go | Le Cap, Nairobi |
| **OVH CDN** | Oui | OVH Object Storage | $0.008/Go | Aucun en Afrique |

**Cloudflare (plan gratuit) — RECOMMANDÉ pour eLISAschool** :
- CDN mondial avec PoP à Lagos et Johannesburg (proche du Cameroun)
- DNS ultra-rapide (Anycast)
- Protection DDoS illimitée
- SSL automatique
- R2 pour le stockage fichiers (pas de frais de sortie = énorme économie)
- Workers pour les fonctions edge (cache, redirections)
- Plan gratuit = 100 000 requêtes/jour

---

### 3.4 Fournisseurs africains

| Fournisseur | Localisation | Type | Usage |
|-------------|-------------|------|-------|
| **MainOne / Equinix** | Lagos, Nigeria | Datacenter Tier III | Colocation, serveurs dédiés |
| **WIOCC / OADC** | Lagos (câble sous-marin) | Infrastructure | Backhaul internet |
| **Axian / Orange DC** | Douala, Cameroun | Datacenter | Colocation locale |
| **Camtel** | Douala, Yaoundé | Opérateur | Serveurs dédiés, colocation |
| **MTN Data Center** | Douala | Opérateur | Hébergement enterprise |

**Latence mesurée depuis le Cameroun** :

| Destination | Latence | Notes |
|-------------|---------|-------|
| Local (Camtel/Axian) | < 5ms | Hébergement local |
| Lagos (MainOne) | 30-50ms | Via câble sous-marin |
| Paris (OVH) | 120-140ms | Via câble WACS/ACE |
| Francfort (Hetzner) | 140-170ms | Via Paris |
| New York (DigitalOcean) | 180-220ms | Transatlantique |

---

### 3.5 Tableau comparatif final — Top 5 pour eLISAschool

| Critère | OVH Comfort | Hetzner CX32 | DigitalOcean S-4 | Scaleway DEV1-L | Contabo VPS M |
|---------|-------------|-------------|-------------------|-----------------|---------------|
| **Prix/mois** | 15.80 € | 8.49 € | 24 $ (~22 €) | 12.99 € | 15.99 € |
| **vCPU** | 4 | 4 | 4 | 4 | 6 |
| **RAM** | 8 Go | 8 Go | 8 Go | 8 Go | 16 Go |
| **SSD** | 160 Go | 80 Go | 160 Go | 80 Go | 400 Go |
| **Bande passante** | Illimitée | 20 To | 4 To | Illimitée | Illimitée |
| **Latence Douala** | ~130ms | ~150ms | ~180ms | ~130ms | ~150ms |
| **Anti-DDoS** | VAC inclus | Non | Basique | Non | Non |
| **Backup inclus** | 50 Go | 20% (payant) | 1 $ (add-on) | Non | Non |
| **Managed PG** | Non | Non | Oui (15 $) | Oui (9.49 €) | Non |
| **API/Terraform** | Oui | Oui | Excellent | Oui | Basique |
| **Support FR** | Oui | Non | Non | Oui | Non |
| **Score eLISAschool** | **9/10** | 8/10 | 7/10 | 7.5/10 | 6/10 |

---

## 4. Recommandations pour eLISAschool

### 4.1 Contraintes techniques eLISAschool

| Contrainte | Détail | Impact hébergement |
|------------|--------|-------------------|
| **Stack** | Node.js 20 + Express + TypeORM | VPS/Cloud requis (pas mutualisé) |
| **Base de données** | PostgreSQL 16 | Support PostgreSQL requis |
| **Cache** | Redis 7 | Support Redis requis |
| **WebSocket** | Socket.IO (notifications temps réel) | Connexions persistantes requises |
| **Cron jobs** | node-cron (matérialisation EDT, rappels) | Exécution planifiée garantie |
| **Fichiers** | Uploads, exports PDF, avatars | Stockage persistant requis |
| **Multi-tenant** | Single-DB + etablissementId | Pattern déjà implémenté |
| **Cible géographique** | Cameroun, Afrique centrale | Latence < 200ms requise |
| **Budget** | SaaS éducatif — budget serré | Optimisation coût essentielle |
| **Croissance** | 1 → 10 → 50 → 200+ écoles | Scalabilité progressive |

### 4.2 Architecture recommandée — Phase 1 (1-10 écoles, ~500 élèves)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE PHASE 1                          │
│                        (1 serveur, Docker Compose)                    │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                    Cloudflare (gratuit)                      │     │
│  │  DNS + CDN + DDoS + SSL + Cache static assets              │     │
│  │  PoP Lagos + Johannesburg (proche Cameroun)                │     │
│  │  R2 pour stockage fichiers (pas de frais egress)           │     │
│  └──────────────────────────┬──────────────────────────────────┘     │
│                              │                                        │
│                              │ HTTPS                                  │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  OVH VPS Comfort — Paris                                     │    │
│  │  4 vCPU / 8 Go RAM / 160 Go SSD NVMe / 15.80 €/mois        │    │
│  │  Ubuntu 22.04 LTS + Docker 24+                              │    │
│  │                                                               │    │
│  │  ┌─────────────────────────────────────────────────────────┐ │    │
│  │  │  Docker Compose                                          │ │    │
│  │  │                                                          │ │    │
│  │  │  ┌──────────┐   ┌──────────┐   ┌──────────────────┐    │ │    │
│  │  │  │  Nginx    │──►│ Node.js  │──►│  PostgreSQL 16   │    │ │    │
│  │  │  │  reverse  │   │ Express  │   │  (données)       │    │ │    │
│  │  │  │  proxy    │   │ API      │   │  Volume: pg_data │    │ │    │
│  │  │  │  SSL      │   │ :3000    │   └──────────────────┘    │ │    │
│  │  │  │  :443     │   │          │                            │ │    │
│  │  │  └──────────┘   │          │   ┌──────────────────┐    │ │    │
│  │  │                  │          │──►│  Redis 7         │    │ │    │
│  │  │  ┌──────────┐   │          │   │  (cache+sessions)│    │ │    │
│  │  │  │  React   │   │          │   │  Volume: redis   │    │ │    │
│  │  │  │  SPA     │   │          │   └──────────────────┘    │ │    │
│  │  │  │  (static)│   │          │                            │ │    │
│  │  │  │  via     │   │          │   ┌──────────────────┐    │ │    │
│  │  │  │  Nginx   │   │          │   │  Cron Jobs       │    │ │    │
│  │  │  └──────────┘   └──────────┘   │  (node-cron)     │    │ │    │
│  │  │                                  │  EDT, rappels    │    │ │    │
│  │  │                                  └──────────────────┘    │ │    │
│  │  │                                                          │ │    │
│  │  │  Volumes :                                               │ │    │
│  │  │  • pg_data (50 Go) — données DB                          │ │    │
│  │  │  • redis_data (2 Go) — cache                             │ │    │
│  │  │  • uploads (20 Go) — fichiers locaux                     │ │    │
│  │  │  • backups (30 Go) — sauvegardes quotidiennes            │ │    │
│  │  └─────────────────────────────────────────────────────────┘ │    │
│  │                                                               │    │
│  │  Backup : pg_dump quotidien → OVH Backup Storage (50 Go)     │    │
│  │  Monitoring : Uptime Kuma (Docker) + logs Docker             │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Coût total : ~15.80 €/mois + Cloudflare gratuit                     │
│  Latence Douala : ~130ms                                             │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.3 Architecture Phase 2 (10-50 écoles, ~5000 élèves)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE PHASE 2                          │
│                   (Serveurs séparés, load balancer)                   │
│                                                                       │
│  Cloudflare CDN + R2 + DNS (inchangé)                               │
│                                                                       │
│  ┌───────────────────┐    ┌────────────────────────────────────┐    │
│  │  OVH VPS Elite    │    │  OVH VPS Comfort × 2              │    │
│  │  8 vCPU / 16 Go   │    │  (App nodes)                       │    │
│  │                   │    │  4 vCPU / 8 Go / chacun            │    │
│  │  ┌─────────────┐  │    │                                    │    │
│  │  │ PostgreSQL  │  │    │  ┌──────────┐  ┌──────────┐       │    │
│  │  │ 16 (managed │  │    │  │ Node.js  │  │ Node.js  │       │    │
│  │  │  ou self)   │  │    │  │ App #1   │  │ App #2   │       │    │
│  │  │             │  │    │  │ Docker   │  │ Docker   │       │    │
│  │  │ 32 Go RAM   │  │    │  └──────────┘  └──────────┘       │    │
│  │  │ 200 Go SSD  │  │    │                                    │    │
│  │  └─────────────┘  │    │  ┌──────────┐                     │    │
│  │                   │    │  │  Redis   │                     │    │
│  │  ┌─────────────┐  │    │  │  (shared │                     │    │
│  │  │  Redis 7    │  │    │  │  cache)  │                     │    │
│  │  │  4 Go RAM   │  │    │  └──────────┘                     │    │
│  │  └─────────────┘  │    │                                    │    │
│  │                   │    │  Load balancer Nginx round-robin   │    │
│  │  47.40 €/mois     │    │  2 × 15.80 = 31.60 €/mois         │    │
│  └───────────────────┘    └────────────────────────────────────┘    │
│                                                                       │
│  Coût total : ~87 €/mois                                            │
│  Haute disponibilité : redondance app + DB backup                   │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.4 Architecture Phase 3 (50-200+ écoles, ~20 000+ élèves)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE PHASE 3                          │
│                 (Dédiés + clustering + multi-région)                  │
│                                                                       │
│  Option A : Serveurs dédiés OVH                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Dédié #1 (App) : E-2388G / 64 Go / 2×1 To NVMe            │    │
│  │  Dédié #2 (DB)  : E-2336G / 32 Go / 2×2 To NVMe RAID      │    │
│  │  Dédié #3 (Cache/Worker) : E-2336G / 32 Go / 500 Go SSD    │    │
│  │  Total : ~300-500 €/mois                                     │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Option B : AWS multi-région                                         │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  EC2 App × 3-5 (auto-scaling) : ~150 €/mois                 │    │
│  │  RDS PostgreSQL Multi-AZ : ~100 €/mois                       │    │
│  │  ElastiCache Redis (cluster) : ~80 €/mois                    │    │
│  │  S3 + CloudFront : ~30 €/mois                                │    │
│  │  Total : ~360-670 €/mois                                     │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Option C : Hébergement local Cameroun (latence minimale)            │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Colocation Axian/Orange DC Douala                           │    │
│  │  Serveur dédié sur place : ~200-400 €/mois                   │    │
│  │  Latence < 5ms pour tous les utilisateurs locaux             │    │
│  │  Connexion Camtel fibre dédiée                               │    │
│  │  ⚠️ Maintenance sur place requise                            │    │
│  │  ⚠️ Redondance électrique/internet à négocier               │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.5 Stratégie de déploiement

#### CI/CD Pipeline (GitHub Actions)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Push    │───►│  Build   │───►│  Test    │───►│  Deploy  │
│  Git     │    │  Docker  │    │  Jest    │    │  SSH     │
│          │    │  Image   │    │  + tsc   │    │  + pull  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘

Étapes :
1. git push → GitHub Actions déclenché
2. docker build → image elisaschool:latest
3. docker push → registry (GitHub Container Registry)
4. Tests : jest + tsc --noEmit
5. SSH vers serveur → docker compose pull → docker compose up -d
6. Health check → rollback si échec
```

#### Blue-Green Deployment (zero-downtime)

```
┌──────────────────────────────────────────────────┐
│  Nginx reverse proxy                              │
│                                                    │
│  upstream backend {                                │
│    server backend-blue:3000;   ← actif            │
│    server backend-green:3000;  ← standby          │
│  }                                                 │
│                                                    │
│  Déploiement :                                     │
│  1. Déployer nouvelle version sur "green"          │
│  2. Tester green (health check)                    │
│  3. Basculer upstream → green                      │
│  4. Ancien "blue" devient standby                  │
│  5. Prochain déploiement → blue                    │
│                                                    │
│  Résultat : zero-downtime, rollback instantané     │
└──────────────────────────────────────────────────┘
```

### 4.6 Stratégie de backup

| Composant | Méthode | Fréquence | Rétention | Stockage |
|-----------|---------|-----------|-----------|----------|
| **PostgreSQL** | pg_dump + pgBackRest | Toutes les 6h + WAL continu | 30 jours | OVH Backup Storage |
| **Redis** | RDB (snapshot) + AOF (log) | RDB : 1h / AOF : chaque sec | 7 jours | Volume local |
| **Fichiers** | rsync + Cloudflare R2 | Quotidien | 90 jours | R2 (pas de frais egress) |
| **Configuration** | Git (docker-compose.yml, .env) | Continu | Permanent | GitHub (privé) |

**Plan de restauration testé** :
- RTO (Recovery Time Objective) : < 1 heure
- RPO (Recovery Point Objective) : < 6 heures (max 6h de données perdues)

### 4.7 Optimisation des coûts

| Niveau | Écoles | Élèves | Architecture | Coût/mois |
|--------|--------|--------|-------------|-----------|
| **Niveau 1** | 1-10 | ~500 | VPS OVH Comfort + Cloudflare Free | ~16 € |
| **Niveau 2** | 10-50 | ~5 000 | DB séparée + 2 app nodes + CDN | ~87 € |
| **Niveau 3** | 50-200 | ~20 000 | Dédiés ou AWS + multi-région | ~300-670 € |

**Astuces d'optimisation** :
1. **Cloudflare CDN** : cacher les assets statiques (JS, CSS, images) = -60% de bande passante serveur
2. **Redis cache** : TTL 5 min pour les configs, 1 min pour les données volatiles = -80% de requêtes DB
3. **Compression** : Brotli pour le texte (meilleur que gzip) = -30% de transfert
4. **R2 au lieu de S3** : pas de frais de sortie = économie massive sur les exports PDF
5. **pgBouncer** : connection pooling = moins de connexions PostgreSQL = moins de RAM
6. **Images Docker multi-stage** : image finale ~150 Mo au lieu de ~800 Mo = déploiement plus rapide

### 4.8 Sécurité

| Couche | Mesure | Outil |
|--------|--------|-------|
| **DNS** | DNSSEC + Cloudflare proxy | Cloudflare |
| **DDoS** | Protection L3/L4/L7 | Cloudflare (inclus) |
| **SSL/TLS** | TLS 1.3, HSTS, certificat auto-renouvelé | Let's Encrypt + Cloudflare |
| **Firewall** | Ports ouverts : 80, 443 uniquement | UFW + Cloudflare WAF |
| **SSH** | Clé publique uniquement, port changé, fail2ban | OpenSSH + fail2ban |
| **App** | JWT + RBAC + rate limiting | Helmet + express-rate-limit |
| **DB** | Pas d'accès internet, mot de passe fort, SSL interne | PostgreSQL config |
| **Backup** | Chiffré (AES-256), testé mensuellement | pgBackRest + gpg |
| **Monitoring** | Alertes uptime, CPU, RAM, disque | Uptime Kuma + Prometheus |

### 4.9 Checklist de démarrage

```
Phase 1 — Mise en production (semaine 1-2) :
□ Acheter domaine (elisaschool.com ou .cm)
□ Créer compte OVH + commander VPS Comfort (Paris)
□ Créer compte Cloudflare (gratuit)
□ Configurer DNS (Cloudflare → OVH VPS IP)
□ Installer Docker + Docker Compose sur le VPS
□ Configurer UFW (80, 443, SSH)
□ Déployer docker-compose.yml (nginx + backend + frontend + postgres + redis)
□ Configurer SSL (Let's Encrypt via Certbot ou Caddy)
□ Configurer pg_dump quotidien + upload vers OVH Backup Storage
□ Configurer Uptime Kuma pour monitoring
□ Tester backup + restauration
□ Documenter runbook (procédures d'urgence)

Phase 2 — Scaling (mois 6-12) :
□ Séparer DB sur un VPS dédié
□ Ajouter un 2ème node app + load balancer
□ Migrer fichiers vers Cloudflare R2
□ Configurer BullMQ pour les cron jobs (garantie single-execution)
□ Ajouter PgBouncer pour le connection pooling
□ Mettre en place CI/CD (GitHub Actions)
□ Configurer blue-green deployment

Phase 3 — Croissance (année 2+) :
□ Évaluer serveurs dédiés ou AWS
□ Considérer hébergement local Cameroun pour latence
□ Kubernetes si > 200 écoles
□ Multi-région pour résilience
```

---

## Résumé exécutif

| Question | Réponse |
|----------|---------|
| **Quel hébergement pour démarrer ?** | OVH VPS Comfort (4 vCPU, 8 Go, 160 Go SSD) à 15.80 €/mois |
| **Où ?** | Paris, France (~130ms vers Douala) |
| **Comment déployer ?** | Docker Compose + Cloudflare CDN (gratuit) |
| **Combien ça coûte ?** | ~16 €/mois pour 1-10 écoles |
| **Quand scaler ?** | À partir de 10 écoles → séparer DB + ajouter nodes |
| **Quelle latence ?** | ~130ms (Paris→Douala), < 50ms via CDN pour le static |
| **Backup ?** | pg_dump quotidien + R2 pour les fichiers |
| **Sécurité ?** | Cloudflare DDoS + UFW + SSH keys + Let's Encrypt |
| **Alternative locale ?** | Colocation Axian/Orange DC Douala pour latence < 5ms |

---

**📌 Prochaines étapes** :
1. Valider le budget hébergement avec les parties prenantes
2. Commander le VPS OVH Comfort
3. Préparer le docker-compose.yml de production
4. Configurer Cloudflare + DNS
5. Déployer la première instance de test
