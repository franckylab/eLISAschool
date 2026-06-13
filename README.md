# eLISAschool - PWA de Gestion Scolaire

Application Progressive Web App (PWA) modulaire pour la gestion avancée d'établissements scolaires en Afrique subsaharienne (Cameroun).

## 🚀 Démarrage Rapide

```bash
# Installation des dépendances
npm install

# Démarrage avec Docker
docker-compose up -d

# Démarrage en développement
npm run dev
```

## 📁 Structure du Projet

```
eLISAschool/
├── backend/          # API Express.js (TypeScript)
├── frontend/         # React + Vite PWA
├── shared/           # Types et validateurs partagés
├── docker/           # Configuration Docker
└── docs/             # Documentation
```

## 🛠️ Stack Technologique

- **Backend**: Node.js, Express.js, TypeScript, TypeORM
- **Frontend**: React, Vite, Tailwind CSS, PWA
- **Base de données**: PostgreSQL avec RLS
- **Sécurité**: JWT, AES-256, RBAC

## 🎓 Nouvelle Structure Académique (2026-06-12)

### ✅ Implémentation Complète

eLISAschool supporte maintenant **l'ensemble du parcours scolaire camerounais/africain**:

**Structure Hiérarchique:**
```
TypeCycle → Cycle → Niveau → Filière → ExamenNational → DiplomeEleve
```

**Modules Créés:**
- ✅ **types-cycles** - Maternelle, Primaire, Secondaire 1er/2nd Cycle
- ✅ **filieres** - Séries C, D, E, A, A1 (2nd cycle)
- ✅ **examens-nationaux** - CEP, BEPC, BAC, GCE O/A Level
- ✅ **diplomes-eleves** - Historique des diplômes obtenus

**Données Implantées:**
- 34 niveaux (17 francophone + 17 anglophone)
- 5 filières francophones
- 5 examens nationaux
- Support bilingue complet

**Documentation:**
- [Guide Complet](COMPLET-STRUCTURE-ACADEMIQUE.md)
- [Guide d'Utilisation](GUIDE-STRUCTURE-ACADEMIQUE.md)
- [Commandes Rapides](COMMANDES-RAPIDES.md)

**Déploiement:**
```bash
cd backend
../scripts/deploy-structure-academique.sh
```

## 📄 Licence

**eLISAschool** - franck arlos chendjou - v1.0.0
