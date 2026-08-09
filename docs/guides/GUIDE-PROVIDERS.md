# Guide Intégration Providers

> Phase 5 — Refonte SaaS v5

## Architecture Provider Abstrait

Tous les providers externes suivent le pattern **Adapter** avec une interface commune.

### Payment Providers

```typescript
interface IPaymentProvider {
    name: string;
    initierPaiement(montant: number, reference: string, metadata: Record<string, any>): Promise<PaiementResult>;
    verifierStatut(transactionId: string): Promise<StatutPaiement>;
    rembourser(transactionId: string, montant?: number): Promise<RemboursementResult>;
    webhookHandler(body: any, headers: Record<string, string>): Promise<void>;
}
```

### SMS Providers

```typescript
interface ISmsProvider {
    name: string;
    envoyer(destination: string, message: string): Promise<SmsResult>;
    verifierStatut(messageId: string): Promise<StatutSms>;
}
```

### Email Providers

```typescript
interface IEmailProvider {
    name: string;
    envoyer(destinataire: string, sujet: string, html: string, attachments?: any[]): Promise<EmailResult>;
}
```

---

## Providers Disponibles

### Paiement

| Provider | Fichier | Région | Configuration |
|----------|---------|--------|---------------|
| MTN MoMo | `payments/mtn-momo.provider.ts` | Cameroun | `apiKey`, `apiSecret`, `webhookSecret` |
| Orange Money | `payments/om-provider.ts` | Cameroun | `apiKey`, `apiSecret` |
| Wave | `payments/wave-provider.ts` | Afrique O. | `apiKey`, `webhookSecret` |
| Paystack | `payments/paystack-provider.ts` | Afrique | `apiKey`, `webhookSecret` |
| Flutterwave | `payments/flutterwave-provider.ts` | Afrique | `apiKey`, `secretKey` |
| Stripe | `payments/stripe-provider.ts` | International | `apiKey`, `webhookSecret` |
| Manuel | `payments/manuel-provider.ts` | Global | Aucun |

### SMS

| Provider | Fichier | Configuration |
|----------|---------|---------------|
| Twilio | `sms/twilio-provider.ts` | `accountSid`, `authToken`, `fromNumber` |
| Africa's Talking | `sms/africastalking-provider.ts` | `apiKey`, `shortCode` |

### Email

| Provider | Fichier | Configuration |
|----------|---------|---------------|
| Resend | `email/resend-provider.ts` | `apiKey`, `fromEmail`, `fromName` |
| SendGrid | `email/sendgrid-provider.ts` | `apiKey`, `fromEmail` |

---

## Configuration

### Via l'API

```
GET    /api/platform/providers           — Liste tous les providers
GET    /api/platform/providers/:type     — Providers d'un type (payment/sms/email)
POST   /api/platform/providers/config    — Configurer un provider
POST   /api/platform/providers/test      — Tester la connexion
GET    /api/platform/providers/webhooks  — Logs webhooks
```

### Via le Frontend

Page `_platform.notifications-config.tsx` — Interface de configuration centralisée.

### Entité ProviderConfig

```typescript
@Entity('provider_configs')
export class ProviderConfig {
    id: string;
    type: 'payment' | 'sms' | 'email' | 'storage' | 'backup';
    providerName: string;          // ex: 'mtn_momo', 'twilio'
    etablissementId?: string;      // null = global (plateforme)
    config: Record<string, any>;   // Credentials (chiffrés)
    mode: 'sandbox' | 'production';
    actif: boolean;
    canaux: string[];              // ex: ['mobile_money', 'card']
}
```

---

## Webhooks

Tous les providers de paiement supportent les webhooks pour la confirmation asynchrone :

```
POST /api/webhooks/mtn-momo
POST /api/webhooks/orange-money
POST /api/webhooks/wave
POST /api/webhooks/paystack
POST /api/webhooks/flutterwave
POST /api/webhooks/stripe
```

Les webhooks sont vérifiés par signature HMAC et logués dans `provider_webhook_logs`.

---

## Ajout d'un Nouveau Provider

1. Créer le fichier dans `backend/src/modules/paiement/providers/{type}/{name}.provider.ts`
2. Implémenter l'interface (`IPaymentProvider`, `ISmsProvider`, `IEmailProvider`)
3. Ajouter dans le `ProviderRegistry` (`providers/provider-registry.ts`)
4. Ajouter la configuration dans `ProviderConfig`
5. Ajouter le webhook handler si applicable
6. Mettre à jour les fichiers i18n `providers.json`
