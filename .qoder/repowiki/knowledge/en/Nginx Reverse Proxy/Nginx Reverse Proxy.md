---
kind: external_dependency
name: Nginx Reverse Proxy
slug: nginx
category: external_dependency
category_hints:
    - vendor_identity
    - framework_behavior
scope:
    - '**'
---

### Nginx Web Server
- **Role**: Production reverse proxy and static file serving
- **Integration**: Docker image with custom nginx.conf configuration
- **Usage**: HTTPS termination, request routing, load balancing for production deployments
- **Behavior**: Configured to proxy requests to backend (7000) and frontend (7001) services
- **Production**: Used in cloud deployment configurations for SSL termination and security headers
- **Development**: Not used in local development mode (direct container access)