# Guide d'Intégration - Module Salles Frontend

## ✅ Fichiers Créés

### Structure
```
frontend/src/features/salles/
├── types/
│   └── salle.types.ts           # Types TypeScript (97 lignes)
├── hooks/
│   └── use-salles.ts            # Hooks React Query (186 lignes)
├── components/
│   ├── SalleFormModal.tsx       # Formulaire création/édition (270 lignes)
│   └── SalleSelect.tsx          # Dropdown pour emploi du temps (110 lignes)
├── pages/
│   ├── SallesPage.tsx           # Page liste avec tableau (378 lignes)
│   └── SallesStatistiquesPage.tsx # Dashboard stats (336 lignes)
└── index.ts                     # Barrel exports (15 lignes)

Total: ~1 400 lignes de code frontend
```

---

## 🔌 Intégration dans le Router

### 1. Ajouter les routes dans `frontend/src/router/index.tsx` ou fichier de routing

```tsx
import { SallesPage, SallesStatistiquesPage } from '@/features/salles';

// Dans la définition des routes
{
    path: '/salles',
    children: [
        {
            index: true,
            element: <SallesPage />,
        },
        {
            path: 'statistiques',
            element: <SallesStatistiquesPage />,
        },
    ],
}
```

### 2. Ajouter dans le menu latéral (Sidebar)

```tsx
// Dans le composant Sidebar/Navigation
{
    icon: Building2,
    label: 'Salles',
    path: '/salles',
    permission: 'salles:view',
}
```

---

## 🎓 Intégration dans Emploi du Temps

### Utiliser le composant SalleSelect

Dans le formulaire de création de créneau d'emploi du temps :

```tsx
import { SalleSelect } from '@/features/salles';

function CreneauForm() {
    const [salleId, setSalleId] = useState('');

    return (
        <form>
            {/* Autres champs */}
            
            <SalleSelect
                value={salleId}
                onChange={setSalleId}
                required
                capaciteMin={30} // Optionnel: filtrer par capacité
                typeSalle="CLASSIQUE" // Optionnel: filtrer par type
                label="Salle de cours"
            />
            
            {/* Autres champs */}
        </form>
    );
}
```

### Avantages du SalleSelect

- ✅ **Chargement automatique** des salles disponibles
- ✅ **Filtrage** par capacité et type
- ✅ **Affichage riche** : nom, capacité, localisation, équipements
- ✅ **État de chargement** avec spinner
- ✅ **Message vide** si aucune salle disponible

---

## 🎨 Personnalisation des Styles

### Thème de couleurs par type de salle

```tsx
const TYPE_COLORS = {
    CLASSIQUE: 'blue',
    LABORATOIRE: 'purple',
    INFORMATIQUE: 'cyan',
    AMPHITHEATRE: 'red',
    SPORT: 'green',
    MUSIQUE: 'pink',
    ARTS: 'orange',
    BIBLIOTHEQUE: 'indigo',
    ADMINISTRATION: 'gray',
    AUTRE: 'yellow',
};
```

### Icônes par type (à ajouter si besoin)

```tsx
import {
    Building2,    // CLASSIQUE
    FlaskConical, // LABORATOIRE
    Monitor,      // INFORMATIQUE
    GraduationCap,// AMPHITHEATRE
    Dumbbell,     // SPORT
    Music,        // MUSIQUE
    Palette,      // ARTS
    BookOpen,     // BIBLIOTHEQUE
    Briefcase,    // ADMINISTRATION
    Box,          // AUTRE
} from 'lucide-react';
```

---

## 📊 Utilisation des Hooks

### 1. Liste paginée avec filtres

```tsx
import { useSalles } from '@/features/salles';

function MaPage() {
    const { data, isLoading, refetch } = useSalles({
        page: 1,
        limit: 20,
        typeSalle: 'LABORATOIRE',
        disponible: true,
        search: 'Labo',
    });

    if (isLoading) return <div>Chargement...</div>;

    return (
        <div>
            {data?.data.map(salle => (
                <div key={salle.id}>{salle.nom}</div>
            ))}
        </div>
    );
}
```

### 2. Détail d'une salle

```tsx
import { useSalle } from '@/features/salles';

function DetailSalle({ id }: { id: string }) {
    const { data: salle, isLoading } = useSalle(id);
    
    if (isLoading) return <div>Chargement...</div>;
    
    return <div>{salle?.nom} - {salle?.capacite} places</div>;
}
```

### 3. Création de salle

```tsx
import { useCreerSalle } from '@/features/salles';

function FormulaireCreation() {
    const creerSalle = useCreerSalle();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        await creerSalle.mutateAsync({
            nom: 'Salle 201',
            code: 'S201',
            capacite: 40,
            typeSalle: 'CLASSIQUE',
        });
    };

    return <form onSubmit={handleSubmit}>...</form>;
}
```

### 4. Statistiques

```tsx
import { useStatistiquesSalles } from '@/features/salles';

function Dashboard() {
    const { data: stats } = useStatistiquesSalles();

    return (
        <div>
            <p>Total: {stats?.total}</p>
            <p>Disponibles: {stats?.disponibles}</p>
            <p>Capacité: {stats?.capaciteTotale}</p>
        </div>
    );
}
```

---

## 🔧 API Endpoints Utilisés

| Méthode | Endpoint | Hook | Usage |
|---------|----------|------|-------|
| GET | `/api/salles` | `useSalles` | Liste paginée |
| GET | `/api/salles/:id` | `useSalle` | Détail |
| GET | `/api/salles/disponibles` | `useSallesDisponibles` | Salles libres |
| GET | `/api/salles/statistiques` | `useStatistiquesSalles` | Stats |
| POST | `/api/salles` | `useCreerSalle` | Créer |
| PATCH | `/api/salles/:id` | `useModifierSalle` | Modifier |
| DELETE | `/api/salles/:id` | `useSupprimerSalle` | Supprimer |

---

## 🎯 Fonctionnalités Implémentées

### ✅ Page de Liste
- Tableau avec pagination
- Recherche en temps réel
- Filtres (type, statut, capacité)
- Statistiques rapides (KPIs)
- Actions (éditer, supprimer)
- Confirmation de suppression

### ✅ Formulaire Modal
- Création et édition
- Validation des champs
- Champs conditionnels
- État de chargement
- Feedback utilisateur (toast)

### ✅ Dropdown Salles
- Chargement automatique
- Filtrage par capacité/type
- Affichage riche
- Optimisé pour l'emploi du temps

### ✅ Dashboard Statistiques
- KPIs principaux
- Taux de disponibilité
- Répartition par type
- Répartition par statut
- Top salles par capacité

---

## 🚀 Prochaines Étapes (Optionnelles)

### 1. Réservation de Salles
```tsx
// Nouveau hook
export function useReserverSalle() {
    return useMutation({
        mutationFn: async (dto: ReservationDto) => {
            return apiClient.post('/api/salles/reservations', dto);
        }
    });
}
```

### 2. Plan Interactif
```tsx
// Composant de plan d'établissement
function PlanInteractif() {
    // Afficher les salles sur un plan SVG/Canvas
    // Cliquer pour voir les détails
    // Drag & drop pour réserver
}
```

### 3. QR Code par Salle
```tsx
// Générer un QR code pour chaque salle
import QRCode from 'react-qr-code';

function SalleQRCode({ salleId }: { salleId: string }) {
    const url = `${window.location.origin}/salles/${salleId}`;
    return <QRCode value={url} size={200} />;
}
```

### 4. Calendrier d'Occupation
```tsx
// Voir les créneaux occupés/libres
function CalendrierSalle({ salleId }: { salleId: string }) {
    // Intégrer avec le module emploi du temps
    // Afficher les disponibilités
}
```

---

## 📝 Notes Importantes

1. **Multi-tenant** : Toutes les requêtes sont automatiquement filtrées par `etablissementId`
2. **Cache** : Les données sont cachées (2-5 min selon le hook)
3. **Invalidation** : Le cache est invalidé automatiquement après mutation
4. **Permissions** : Vérifier les rôles avant d'afficher les boutons d'action
5. **Erreurs** : Les toasts d'erreur sont automatiques via les hooks

---

## 🐛 Dépannage

### "Aucune salle disponible"
- Vérifier que des salles ont été créées en base
- Vérifier le filtre `disponible`

### Erreur 401
- Vérifier l'authentification
- Vérifier le token JWT

### Erreur 403
- Vérifier les permissions de l'utilisateur
- Rôles requis : ADMIN, SUPER_ADMIN, CHEF_ETABLISSEMENT

---

## 📚 Références

- **Backend** : `backend/src/modules/salles/`
- **API Docs** : Swagger sur `/api/docs`
- **Types** : `frontend/src/features/salles/types/salle.types.ts`
- **Hooks** : `frontend/src/features/salles/hooks/use-salles.ts`

---

**Version** : 1.0.0  
**Date** : 14 juin 2026  
**Auteur** : franck arlos chendjou
