---
kind: external_dependency
name: PostgreSQL Database
slug: postgresql
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
---

### PostgreSQL 16 (Alpine)
- **Role**: Primary relational database for eLISAschool
- **Integration**: TypeORM data source configuration, Docker service `elisaschool_db`
- **Usage**: Multi-tenant school management data with Row Level Security (RLS) enabled
- **Constraints**: Custom port 7002 (non-standard), dedicated user `elisaschool_user`, database `elisaschool`
- **Connection**: Service name `postgres` within Docker network, external access via mapped port 7002
- **Verification**: Health check via `pg_isready` command, persistent volume `postgres_data`
- **Note**: Verify exact connection parameters against docker-compose.yml environment variables