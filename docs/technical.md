# Documentation Technique eLISAschool

## Architecture

L'application suit une architecture **monolithe modulaire** avec :

- **Backend** : Node.js + Express.js + TypeScript
- **Frontend** : React + Vite + Tailwind CSS (PWA)
- **Base de données** : PostgreSQL avec RLS
- **Déploiement** : Docker

## Structure des Modules

Chaque module backend contient :
- `controllers/` - Points d'entrée API
- `services/` - Logique métier
- `entities/` - Entités TypeORM
- `dto/` - Objets de transfert de données
- `utils/` - Utilitaires spécifiques

## API

Documentation Swagger disponible sur `/api/docs`

---

**eLISAschool** - xAI Éducation - v1.0.0
