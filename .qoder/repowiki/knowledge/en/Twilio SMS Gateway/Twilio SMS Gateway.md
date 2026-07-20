---
kind: external_dependency
name: Twilio SMS Gateway
slug: twilio
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
---

### Twilio SMS API
- **Role**: SMS notification delivery for parent alerts and system notifications
- **Integration**: twilio npm package, configurable via environment variables
- **Usage**: Send SMS messages to parents and staff for important school events
- **Configuration**: Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
- **Auth Protocol**: Account SID + Auth Token authentication
- **Status**: Optional feature - disabled when credentials not provided
- **Note**: Verify exact account credentials and phone number configuration against Twilio Console