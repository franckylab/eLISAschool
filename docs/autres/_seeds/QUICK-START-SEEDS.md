# 🚀 Quick Start - Seeds eLISAschool

## Installation & Configuration

```bash
# 1. Cloner le projet
cd /mnt/DONNEES/projets/eLISAschool

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# 3. Démarrer Docker (PostgreSQL + Redis)
docker-compose up -d
```

## Exécution des Seeds

### Option 1: Script interactif (RECOMMANDÉ)
```bash
# Reset complet + seeds (développement)
./scripts/run-seeds.sh reset+seed

# Seeds uniquement
./scripts/run-seeds.sh seeds

# Aide
./scripts/run-seeds.sh help
```

### Option 2: Commande npm
```bash
cd backend
npm run seed
```

## Identifiants de Connexion

### Super Admin
```
Email: admin@elisaschool.cm
Password: AdminSecret123!
```

### Utilisateurs de Test
```
Password: Test123456!

Direction:
  - admin.test@elisaschool.cm
  - chef.etablissement@elisaschool.cm
  - proviseur@elisaschool.cm

Enseignants:
  - enseignant@elisaschool.cm
  - prof.certifie@elisaschool.cm

Personnel:
  - comptable@elisaschool.cm
  - secretaire@elisaschool.cm

Parents & Élèves:
  - parent@elisaschool.cm
  - eleve@elisaschool.cm
```

## Démarrer l'Application

```bash
# Backend (port 7000)
cd backend
npm run dev

# Frontend (port 7001)
cd frontend
npm run dev
```

## Structure des Seeds

```
1. 🏫 Établissement par défaut (ETAB-001)
2. ⚙️  Configuration (modules, paramètres)
3. 🔐 RBAC (39 rôles, ~200 permissions)
4. 🎓 Structure académique
5. 👤 Super admin
6. 👥 38 utilisateurs de test
```

## Résolution de Problèmes

### PostgreSQL ne démarre pas
```bash
docker-compose down -v
docker-compose up -d
```

### Erreur de connexion
```bash
# Vérifier Docker
docker ps

# Vérifier les ports
lsof -i :7002  # PostgreSQL
lsof -i :6379  # Redis
```

### Reset complet
```bash
./scripts/run-seeds.sh reset+seed
```

## Documentation Complète

Voir [RBAC-SEEDS-REFACTORING.md](./RBAC-SEEDS-REFACTORING.md)
