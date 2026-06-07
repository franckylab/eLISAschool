# 🔔 Intégration des Notifications dans les Modules Métier

## ✅ Travail Accompli

### 1. Service de Templates de Notifications Créé

**Fichier** : `backend/src/modules/notifications/services/notification-templates.service.ts`

Un service centralisé qui fournit des templates réutilisables pour tous les modules métier :

#### Templates Disponibles

| Module | Template | Description | Priorité |
|--------|----------|-------------|----------|
| **Notes** | `nouvelleNote()` | Notifie les parents quand une note est ajoutée | Normal |
| **Notes** | `noteModifiee()` | Notifie quand une note est modifiée | Normal |
| **Bulletins** | `bulletinDisponible()` | Notifie quand un bulletin est prêt (In-App + Email) | Haute |
| **Élèves** | `absenceNonJustifiee()` | Alerte absence non justifiée (In-App + SMS) | Urgente |
| **Élèves** | `retard()` | Notifie un retard | Normal |
| **Cantine** | `rappelPaiementCantine()` | Rappel de paiement (In-App + Email) | Haute |
| **Cantine** | `menuDuJour()` | Menu quotidien | Normal |
| **Transport** | `retardBus()` | Alerte retard bus (In-App + SMS si >15min) | Urgente |
| **Transport** | `changementItineraire()` | Changement d'itinéraire | Haute |
| **Générique** | `messageAdministration()` | Message de l'administration | Haute |

### 2. Intégration Module Notes

**Fichier modifié** : `backend/src/modules/notes/services/notes.service.ts`

**Fonctionnalité** : Quand un enseignant crée une note, les parents reçoivent automatiquement une notification.

```typescript
// Après la création d'une note
await notificationTemplates.nouvelleNote({
    destinataireId: responsable.utilisateurId,
    etablissementId,
    metadata: { noteId, eleveId },
}, {
    eleveNom: `${eleve.prenom} ${eleve.nom}`,
    matiere: matiere.nom,
    note: note.valeur,
    bareme: note.bareme,
    periode: periode.nom,
    enseignant: `${enseignant.prenom} ${enseignant.nom}`,
});
```

**Résultat** :
- ✅ Notification In-App envoyée à chaque responsable
- ✅ Metadata complète pour tracking
- ✅ Gestion d'erreurs non bloquante
- ✅ Multi-tenant (etablissementId)

---

## 📋 Guide d'Intégration pour les Autres Modules

### Module Bulletins

**Fichier à modifier** : `backend/src/modules/bulletins/services/bulletins.service.ts`

**Point d'intégration** : Après la génération d'un bulletin (méthode `generate()`)

```typescript
import { notificationTemplates } from '@modules/notifications/services';
import { Eleve } from '@modules/eleves/entities';

// Dans la méthode generate(), après avoir créé les bulletins :
for (const eleve of eleves) {
    // Récupérer les responsables
    const eleveWithResponsables = await eleveRepo.findOne({
        where: { id: eleve.id },
        relations: ['responsables'],
    });

    if (eleveWithResponsables?.responsables) {
        // Calculer la moyenne générale
        const moyenneGenerale = await this.calculerMoyenneGenerale(...);
        
        // Notifier chaque responsable
        for (const responsable of eleveWithResponsables.responsables) {
            await notificationTemplates.bulletinDisponible({
                destinataireId: responsable.utilisateurId,
                etablissementId,
                metadata: {
                    bulletinId: bulletin.id,
                    eleveId: eleve.id,
                    email: responsable.email, // Pour envoi email
                },
            }, {
                eleveNom: `${eleve.prenom} ${eleve.nom}`,
                periode: periode.nom,
                moyenne: moyenneGenerale,
                rang: bulletin.rang,
                totalEleves: totalElevesInClass,
            });
        }
    }
}
```

### Module Élèves (Absences)

**Fichier à modifier** : `backend/src/modules/eleves/services/eleves.service.ts`

**Point d'intégration** : Après la création d'une absence

```typescript
import { notificationTemplates } from '@modules/notifications/services';

// Méthode à créer : enregistrerAbsence()
async enregistrerAbsence(absenceDto: CreateAbsenceDto, utilisateurId: string): Promise<Absence> {
    // ... logique de création ...
    
    await absencesRepository.save(absence);
    
    // NOTIFICATION
    const eleve = await eleveRepo.findOne({
        where: { id: absence.eleveId },
        relations: ['responsables'],
    });
    
    if (eleve?.responsables) {
        for (const responsable of eleve.responsables) {
            await notificationTemplates.absenceNonJustifiee({
                destinataireId: responsable.utilisateurId,
                metadata: {
                    telephone: responsable.telephone, // Pour SMS
                    absenceId: absence.id,
                },
            }, {
                eleveNom: `${eleve.prenom} ${eleve.nom}`,
                date: absence.date.toLocaleDateString('fr-FR'),
                heures: absence.heures,
                matiere: absence.matiere?.nom,
            });
        }
    }
    
    return absence;
}
```

### Module Cantine

**Fichier à modifier** : `backend/src/modules/cantine/services/cantine.service.ts`

**Point d'intégration 1** : Rappel de paiement (cron job ou manuel)

```typescript
import { notificationTemplates } from '@modules/notifications/services';

async envoyerRappelsPaiement(): Promise<number> {
    const reservations = await getReservationsImpayees();
    let count = 0;
    
    for (const reservation of reservations) {
        const eleve = await eleveRepo.findOne({
            where: { id: reservation.eleveId },
            relations: ['responsables'],
        });
        
        if (eleve?.responsables) {
            for (const responsable of eleve.responsables) {
                await notificationTemplates.rappelPaiementCantine({
                    destinataireId: responsable.utilisateurId,
                    metadata: {
                        email: responsable.email,
                        reservationId: reservation.id,
                    },
                }, {
                    eleveNom: `${eleve.prenom} ${eleve.nom}`,
                    montant: reservation.montant,
                    echeance: reservation.dateEcheance.toLocaleDateString('fr-FR'),
                    solde: reservation.solde,
                });
                count++;
            }
        }
    }
    
    return count;
}
```

**Point d'intégration 2** : Menu du jour (cron job quotidien)

```typescript
async diffuserMenuDuJour(menu: MenuCantine): Promise<number> {
    const reservations = await getReservationsForDate(menu.date);
    let count = 0;
    
    for (const reservation of reservations) {
        const eleve = await eleveRepo.findOne({
            where: { id: reservation.eleveId },
            relations: ['responsables'],
        });
        
        if (eleve?.responsables) {
            for (const responsable of eleve.responsables) {
                await notificationTemplates.menuDuJour({
                    destinataireId: responsable.utilisateurId,
                }, {
                    date: menu.date.toLocaleDateString('fr-FR'),
                    entree: menu.entree,
                    plat: menu.plat,
                    dessert: menu.dessert,
                });
                count++;
            }
        }
    }
    
    return count;
}
```

### Module Transport

**Fichier à modifier** : `backend/src/modules/transport/services/transport.service.ts`

**Point d'intégration** : Quand un retard ou changement est signalé

```typescript
import { notificationTemplates } from '@modules/notifications/services';

async signalerRetardBus(retardDto: CreateRetardDto): Promise<void> {
    // ... logique de sauvegarde ...
    
    // Récupérer tous les élèves de cette ligne
    const inscriptions = await inscriptionRepo.find({
        where: { ligneId: retardDto.ligneId, actif: true },
        relations: ['eleve.responsables'],
    });
    
    for (const inscription of inscriptions) {
        const eleve = inscription.eleve;
        if (eleve?.responsables) {
            for (const responsable of eleve.responsables) {
                await notificationTemplates.retardBus({
                    destinataireId: responsable.utilisateurId,
                    metadata: {
                        telephone: responsable.telephone,
                        ligneId: retardDto.ligneId,
                    },
                }, {
                    ligne: inscription.ligne.nom,
                    retard: retardDto.minutes,
                    raison: retardDto.raison,
                });
            }
        }
    }
}
```

---

## 🎨 Pattern Standard d'Intégration

Pour tous les modules, suivre ce pattern :

```typescript
import { notificationTemplates } from '@modules/notifications/services';

async methodeMetier(dto: CreateDto): Promise<Entity> {
    // 1. Logique métier principale
    const entity = repository.create(dto);
    await repository.save(entity);
    
    // 2. Audit (toujours)
    await auditService.log({ ... });
    
    // 3. NOTIFICATION (try/catch pour ne pas bloquer)
    try {
        // Récupérer l'entité liée (élève, etc.) avec ses responsables
        const relatedEntity = await relatedRepo.findOne({
            where: { ... },
            relations: ['responsables'],
        });
        
        if (relatedEntity?.responsables) {
            for (const responsable of relatedEntity.responsables) {
                await notificationTemplates.nomDuTemplate({
                    destinataireId: responsable.utilisateurId,
                    etablissementId,
                    metadata: {
                        // IDs pour tracking
                        entityId: entity.id,
                        // Données pour email/SMS
                        email: responsable.email,
                        telephone: responsable.telephone,
                    },
                }, {
                    // Variables du template
                    ...donneesContexte,
                });
            }
        }
    } catch (error) {
        // Jamais bloquant pour la logique métier
        logger.warn('[Module] Échec envoi notification (non bloquant)', error);
    }
    
    return entity;
}
```

---

## ✅ Checklist d'Intégration

Pour chaque module :

- [ ] Importer `notificationTemplates`
- [ ] Identifier le point d'intégration (après quelle action ?)
- [ ] Récupérer les destinataires (responsables de l'élève)
- [ ] Choisir le template approprié
- [ ] Passer les variables nécessaires
- [ ] Inclure metadata (IDs, email, telephone)
- [ ] Wraper dans try/catch (non bloquant)
- [ ] Logger les erreurs avec `logger.warn()`
- [ ] Tester l'envoi de notification

---

## 🧪 Tests

### Tester l'intégration Notes

```bash
# 1. Créer une note via l'API
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eleveId": "UUID_ELEVE",
    "matiereId": "UUID_MATIERE",
    "classeId": "UUID_CLASSE",
    "periodeId": "UUID_PERIODE",
    "valeur": 15,
    "bareme": 20,
    "typeEvaluation": "DEVOIR",
    "description": "Test notification"
  }'

# 2. Vérifier les logs
docker compose logs backend | grep "Template.*nouvelle note"

# 3. Vérifier les notifications en DB
docker compose exec postgres psql -U elisaschool_user -d elisaschool \
  -c "SELECT titre, contenu, statut, type FROM notifications ORDER BY createdAt DESC LIMIT 5;"
```

---

## 📊 Statistiques d'Envoi

Pour monitorer les notifications envoyées par module :

```sql
SELECT 
    metadata->>'type' as type_notification,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE statut = 'ENVOYEE') as envoyees,
    COUNT(*) FILTER (WHERE statut = 'ECHEC') as echecs
FROM notifications
WHERE createdAt > NOW() - INTERVAL '7 days'
GROUP BY metadata->>'type'
ORDER BY total DESC;
```

---

## 🚀 Prochaines Étapes

1. **Intégrer dans Bulletins** - Notifier quand bulletin généré
2. **Intégrer dans Élèves** - Absences et retards
3. **Intégrer dans Cantine** - Rappels paiement + menus
4. **Intégrer dans Transport** - Retards et changements
5. **Tester end-to-end** - Vérifier tous les canaux (In-App, Email, SMS)
6. **Monitoring** - Dashboard des statistiques d'envoi

---

**💡 Le système de templates rend l'intégration simple et cohérente dans tous les modules !**
