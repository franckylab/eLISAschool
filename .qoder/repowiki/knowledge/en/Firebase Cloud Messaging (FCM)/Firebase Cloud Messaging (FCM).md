---
kind: external_dependency
name: Firebase Cloud Messaging (FCM)
slug: firebase-admin-sdk
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
---

### Firebase Admin SDK v13.10.0
- **Role**: Push notification delivery for PWA clients
- **Integration**: firebase-admin package, configurable via environment variables
- **Usage**: Mobile and desktop push notifications through FCM protocol
- **Configuration**: Requires FIREBASE_PROJECT_ID, FIREBASE_SERVER_KEY, FIREBASE_VAPID_KEY
- **Auth Protocol**: Service account authentication using server key
- **Status**: Optional feature - disabled when credentials not provided
- **Note**: Verify exact API keys and project configuration against Firebase Console