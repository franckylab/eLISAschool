---
kind: external_dependency
name: Redis Cache & Queue
slug: redis
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
---

### Redis 7 (Alpine)
- **Role**: Caching layer, session storage, and message queue for eLISAschool
- **Integration**: ioredis client, Docker service `elisaschool_redis`
- **Usage**: Organization cache with TTL, real-time synchronization between containers
- **Constraints**: Custom port 7003, password authentication required, maxmemory 256mb with allkeys-lru policy
- **Connection**: Service name `redis` within Docker network, external access via mapped port 7003
- **Persistence**: Append-only file (AOF) enabled for data durability
- **Verification**: Health check via `redis-cli ping` command