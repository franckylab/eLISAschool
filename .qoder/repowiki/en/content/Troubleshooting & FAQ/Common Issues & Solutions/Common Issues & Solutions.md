# Common Issues & Solutions

<cite>
**Referenced Files in This Document**
- [docker-compose.yml](file://docker/docker-compose.yml)
- [database.config.ts](file://backend/src/config/database.config.ts)
- [env.config.ts](file://backend/src/config/env.config.ts)
- [vite.config.ts](file://frontend/vite.config.ts)
- [app.ts](file://backend/src/app.ts)
- [index.ts](file://backend/src/index.ts)
- [package.json](file://backend/package.json)
- [package.json](file://frontend/package.json)
- [Dockerfile.backend](file://docker/Dockerfile.backend)
- [Dockerfile.frontend](file://docker/Dockerfile.frontend)
- [nginx.conf](file://docker/nginx.conf)
- [start-dev.sh](file://scripts/start-dev.sh)
- [deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [run-migration.ts](file://backend/scripts/run-migration.ts)
- [diagnose-enum.ts](file://backend/diagnose-enum.ts)
- [verify-setup.sh](file://scripts/verify-setup.sh)
- [GUIDE-CONNEXION-BASE-DE-DONNEES.md](file://docs/guides/GUIDE-CONNEXION-BASE-DE-DONNEES.md)
- [GUIDE-DEPANNAGE-ACCES-RESEAU-LOCAL.md](file://docs/guides/GUIDE-DEPANNAGE-ACCES-RESEAU-LOCAL.md)
- [CORRECTION-CORS-PORTS.md](file://docs/corrections/CORRECTION-CORS-PORTS.md)
- [FIX-CORS-COMPLET.md](file://docs/autres/_fix/FIX-CORS-COMPLET.md)
- [DIAGNOSTIC-401-TOKEN-INVALIDE.md](file://docs/autres/_fix/DIAGNOSTIC-401-TOKEN-INVALIDE.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Installation & Setup Issues](#installation--setup-issues)
3. [Database Connection Problems](#database-connection-problems)
4. [Authentication & Authorization Errors](#authentication--authorization-errors)
5. [Network & CORS Configuration](#network--cors-configuration)
6. [Permission Denied Issues](#permission-denied-issues)
7. [Module Loading & Dependency Conflicts](#module-loading--dependency-conflicts)
8. [Performance & Browser Compatibility](#performance--browser-compatibility)
9. [Diagnostic Tools & Log Analysis](#diagnostic-tools--log-analysis)
10. [Troubleshooting Workflow](#troubleshooting-workflow)

## Introduction

This comprehensive troubleshooting guide addresses the most common issues encountered when deploying, running, and maintaining eLISAschool. The document provides step-by-step solutions for installation problems, runtime errors, network connectivity issues, and performance bottlenecks. Each section includes specific error messages, their meanings, diagnostic commands, and exact resolution procedures.

## Installation & Setup Issues

### Docker Setup Failures

#### Container Build Failures
**Common Error Messages:**
- `ERROR: failed to solve: process "/bin/sh -c npm install" did not complete successfully`
- `npm ERR! code ERESOLVE`
- `Cannot find module 'typescript'`

**Resolution Steps:**

1. **Clear Docker Cache and Rebuild:**
```bash
docker system prune -a --volumes
cd docker
./deploy.sh --rebuild
```

2. **Check Node.js Version Compatibility:**
```bash
node --version
npm --version
docker exec -it elisaschool-backend node --version
```

3. **Verify Docker Compose Services:**
```bash
docker-compose ps
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

#### Port Conflicts During Startup
**Error Message:**
- `Error starting userland proxy: listen tcp 0.0.0.0:3000: bind: address already in use`

**Solution:**
```bash
# Check which process is using the port
lsof -i :3000
sudo lsof -i :3000

# Kill the conflicting process
kill -9 <PID>

# Or modify ports in docker-compose.yml
```

**Section sources**
- [docker-compose.yml](file://docker/docker-compose.yml)
- [Dockerfile.backend](file://docker/Dockerfile.backend)
- [Dockerfile.frontend](file://docker/Dockerfile.frontend)

### Database Initialization Problems

#### Migration Failures
**Error Message:**
- `error: relation "users" does not exist`
- `migration failed: duplicate table or index`

**Resolution Procedure:**

1. **Check Migration Status:**
```bash
cd backend
npm run db:migrate:status
```

2. **Reset Database (Development Only):**
```bash
npm run db:drop
npm run db:create
npm run db:migrate
npm run db:seed
```

3. **Run Specific Migration:**
```bash
npm run db:migrate:up -- --name migration_name
```

**Section sources**
- [deploy-all-migrations.sh](file://backend/deploy-all-migrations.sh)
- [run-migration.ts](file://backend/scripts/run-migration.ts)

## Database Connection Problems

### Connection Refused Errors

#### PostgreSQL Connection Issues
**Error Messages:**
- `connect ECONNREFUSED 127.0.0.1:5432`
- `password authentication failed for user "elisaschool"`
- `FATAL: database "elisaschool" does not exist`

**Diagnostic Commands:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection from container
docker exec -it elisaschool-backend psql -h postgres -U elisaschool -d elisaschool

# Check database credentials
echo $DATABASE_URL
```

**Step-by-Step Resolution:**

1. **Verify Database Service:**
```bash
docker-compose ps postgres
docker-compose logs postgres
```

2. **Check Environment Variables:**
```bash
cat .env | grep DATABASE
docker inspect elisaschool-backend | grep DATABASE
```

3. **Reset Database Connection:**
```bash
docker-compose down
docker-compose up -d postgres
sleep 10
docker-compose up -d backend
```

### Database Schema Mismatch

#### Type Definition Errors
**Error Message:**
- `error: column "field_name" of relation "table_name" does not exist`
- `type "custom_type" does not exist`

**Resolution Steps:**

1. **Diagnose Enum Issues:**
```bash
cd backend
npm run diagnose:enums
```

2. **Reapply Schema:**
```bash
npm run db:reset
npm run db:migrate
```

3. **Check Entity Definitions:**
```bash
npm run typeorm:schema:log
```

**Section sources**
- [database.config.ts](file://backend/src/config/database.config.ts)
- [diagnose-enum.ts](file://backend/diagnose-enum.ts)
- [GUIDE-CONNEXION-BASE-DE-DONNEES.md](file://docs/guides/GUIDE-CONNEXION-BASE-DE-DONNEES.md)

## Authentication & Authorization Errors

### JWT Token Validation Failures

#### Invalid Token Errors
**Error Messages:**
- `401 Unauthorized: Invalid token`
- `JWT expired`
- `Token verification failed`

**Diagnostic Procedure:**

1. **Check JWT Configuration:**
```bash
echo $JWT_SECRET
echo $JWT_EXPIRATION
```

2. **Validate Token Manually:**
```bash
# Decode token without verification
echo "your.token.here" | cut -d. -f2 | base64 -d
```

3. **Test Authentication Endpoint:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

**Resolution Steps:**

1. **Regenerate JWT Secret:**
```bash
openssl rand -hex 32 > .env
export JWT_SECRET=$(cat .env)
```

2. **Clear User Sessions:**
```bash
redis-cli FLUSHALL
docker restart elisaschool-backend
```

**Section sources**
- [DIAGNOSTIC-401-TOKEN-INVALIDE.md](file://docs/autres/_fix/DIAGNOSTIC-401-TOKEN-INVALIDE.md)

### Multi-Tenant Authentication Issues

#### Establishment Context Problems
**Error Message:**
- `403 Forbidden: No establishment context`
- `User not associated with establishment`

**Resolution Procedure:**

1. **Check User-Establishment Association:**
```bash
docker exec -it elisaschool-backend psql -U elisaschool -d elisaschool \
  -c "SELECT * FROM users_establishments WHERE user_id = 'user_uuid';"
```

2. **Reset User Permissions:**
```bash
npm run seed:rbac
```

3. **Verify Role Assignments:**
```bash
docker exec -it elisaschool-backend psql -U elisaschool -d elisaschool \
  -c "SELECT ur.role_id, r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = 'user_uuid';"
```

## Network & CORS Configuration

### CORS Policy Violations

#### Cross-Origin Request Blocked
**Error Messages:**
- `Access to XMLHttpRequest at 'http://localhost:3000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy`
- `CORS header 'Access-Control-Allow-Origin' missing`

**Configuration Fix:**

1. **Update Backend CORS Settings:**
```typescript
// In app.ts or main configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

2. **Configure Frontend Proxy:**
```javascript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

**Section sources**
- [CORRECTION-CORS-PORTS.md](file://docs/corrections/CORRECTION-CORS-PORTS.md)
- [FIX-CORS-COMPLET.md](file://docs/autres/_fix/FIX-CORS-COMPLET.md)
- [vite.config.ts](file://frontend/vite.config.ts)

### Port Binding Issues

#### Service Port Conflicts
**Error Messages:**
- `EADDRINUSE: address already in use`
- `Port 3000 is already in use`

**Resolution Steps:**

1. **Identify Port Usage:**
```bash
netstat -tulpn | grep :3000
lsof -i :3000
```

2. **Kill Conflicting Process:**
```bash
kill -9 $(lsof -t -i :3000)
```

3. **Change Application Ports:**
```bash
# Update .env files
PORT=3001
FRONTEND_PORT=5174
```

**Section sources**
- [GUIDE-DEPANNAGE-ACCES-RESEAU-LOCAL.md](file://docs/guides/GUIDE-DEPANNAGE-ACCES-RESEAU-LOCAL.md)

## Permission Denied Issues

### RBAC Permission Errors

#### Insufficient Privileges
**Error Messages:**
- `403 Forbidden: Insufficient permissions`
- `Permission denied: require role 'ADMIN'`
- `Action not allowed for current role`

**Diagnostic Commands:**

1. **Check User Roles:**
```bash
docker exec -it elisaschool-backend psql -U elisaschool -d elisaschool \
  -c "SELECT u.email, r.name as role FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id;"
```

2. **Verify Permission Matrix:**
```bash
npm run check:permissions
```

**Resolution Steps:**

1. **Grant Required Permissions:**
```bash
npm run seed:permissions
```

2. **Update User Role:**
```bash
docker exec -it elisaschool-backend psql -U elisaschool -d elisaschool \
  -c "INSERT INTO user_roles (user_id, role_id) VALUES ('user_uuid', 'role_uuid');"
```

3. **Clear Permission Cache:**
```bash
redis-cli DEL "permissions:*"
```

### File System Permission Issues

#### Write Access Problems
**Error Messages:**
- `EACCES: permission denied, mkdir '/app/uploads'`
- `ENOENT: no such file or directory`

**Resolution:**

1. **Fix Directory Permissions:**
```bash
chmod -R 755 /path/to/eLISAschool
chown -R $USER:$USER /path/to/eLISAschool
```

2. **Docker Volume Permissions:**
```bash
docker volume ls
docker run --rm -v elisaschool_uploads:/data alpine chmod -R 777 /data
```

**Section sources**
- [verify-setup.sh](file://scripts/verify-setup.sh)

## Module Loading & Dependency Conflicts

### TypeScript Compilation Errors

#### Missing Dependencies
**Error Messages:**
- `Cannot find module '@elisaschool/shared'`
- `TS2307: Cannot find module 'typeorm'`
- `Module not found: Error: Can't resolve 'class-validator'`

**Resolution Steps:**

1. **Install Dependencies:**
```bash
npm install
npm run build:shared
```

2. **Clean and Rebuild:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

3. **Check Shared Package:**
```bash
cd shared
npm run build
cd ..
npm link @elisaschool/shared
```

### Runtime Module Loading Failures

#### Dynamic Import Errors
**Error Messages:**
- `Error: Cannot find module './modules/auth/controllers/auth.controller'`
- `Module parse failed: Unexpected token`

**Resolution Procedure:**

1. **Verify Module Structure:**
```bash
ls -la backend/src/modules/auth/controllers/
```

2. **Check Import Paths:**
```bash
grep -r "import.*auth.controller" backend/src/
```

3. **Rebuild Project:**
```bash
npm run build
npm start
```

**Section sources**
- [package.json](file://backend/package.json)
- [package.json](file://frontend/package.json)

## Performance & Browser Compatibility

### Slow API Response Times

#### Database Query Optimization
**Symptoms:**
- API responses taking more than 5 seconds
- Database connection pool exhaustion
- Memory usage increasing over time

**Optimization Steps:**

1. **Enable Query Logging:**
```typescript
// Enable TypeORM logging
logging: true,
```

2. **Add Database Indexes:**
```bash
npm run db:indexes:add
```

3. **Monitor Performance:**
```bash
docker stats
htop
```

### Browser Compatibility Issues

#### Modern JavaScript Features
**Error Messages:**
- `SyntaxError: Unexpected token '??='`
- `TypeError: Object.fromEntries is not a function`
- `ReferenceError: fetch is not defined`

**Resolution:**

1. **Update Browserslist:**
```json
{
  "browserslist": [
    "> 1%",
    "last 2 versions",
    "not dead",
    "not ie 11"
  ]
}
```

2. **Add Polyfills:**
```bash
npm install core-js regenerator-runtime
```

3. **Configure Transpilation:**
```javascript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2019",
    "lib": ["ES2019", "DOM"]
  }
}
```

## Diagnostic Tools & Log Analysis

### Centralized Logging

#### Log Collection Setup
```bash
# Start with logging enabled
docker-compose up -d --scale backend=1

# View real-time logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Health Check Endpoints

#### Service Monitoring
```bash
# Backend health check
curl http://localhost:3000/api/health

# Database connectivity
curl http://localhost:3000/api/health/db

# Redis status
curl http://localhost:3000/api/health/redis
```

### Debug Mode Activation

#### Development Diagnostics
```bash
# Enable debug logging
export DEBUG=*
export LOG_LEVEL=debug

# Restart services
docker-compose restart backend
```

**Section sources**
- [app.ts](file://backend/src/app.ts)
- [index.ts](file://backend/src/index.ts)

## Troubleshooting Workflow

### Systematic Issue Resolution

#### Step-by-Step Diagnostic Process

1. **Initial Assessment:**
```bash
# Check overall system status
./scripts/verify-setup.sh

# Verify all services are running
docker-compose ps
```

2. **Service-Specific Checks:**
```bash
# Backend health
curl http://localhost:3000/api/health

# Database connectivity
docker exec -it elisaschool-backend pg_isready -h postgres -U elisaschool

# Frontend accessibility
curl -I http://localhost:5173
```

3. **Log Analysis:**
```bash
# Collect recent logs
docker-compose logs --tail=100 backend > backend.log
docker-compose logs --tail=100 postgres > postgres.log

# Search for errors
grep -i "error\|exception\|failed" backend.log
```

4. **Environment Validation:**
```bash
# Check environment variables
docker exec -it elisaschool-backend env | sort

# Verify configuration files
docker exec -it elisaschool-backend cat /app/.env
```

### Emergency Recovery Procedures

#### Complete System Reset
```bash
# Stop all services
docker-compose down -v

# Remove volumes (WARNING: This deletes all data)
docker volume rm elisaschool_postgres_data

# Rebuild and start fresh
docker-compose up -d --build

# Initialize database
cd backend && npm run db:init
```

#### Backup and Restore
```bash
# Create backup
docker exec -it elisaschool-postgres pg_dump -U elisaschool elisaschool > backup.sql

# Restore from backup
docker exec -i elisaschool-postgres psql -U elisaschool elisaschool < backup.sql
```

**Section sources**
- [verify-setup.sh](file://scripts/verify-setup.sh)
- [start-dev.sh](file://scripts/start-dev.sh)

## Conclusion

This troubleshooting guide provides comprehensive solutions for the most common eLISAschool issues. By following the systematic approach outlined above, administrators can quickly identify and resolve problems related to installation, database connectivity, authentication, networking, permissions, and performance. Regular monitoring, proper logging configuration, and adherence to the recommended deployment practices will help maintain a stable and performant eLISAschool environment.

For persistent issues not covered in this guide, consult the detailed documentation in the `docs/` directory and consider enabling debug logging to capture additional diagnostic information for further analysis.