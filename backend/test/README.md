# Tests eLISAschool Backend

## Structure des Tests

```
test/
├── unit/                      # Tests unitaires
│   ├── pagination.util.spec.ts
│   ├── redis.service.spec.ts
│   └── *.spec.ts
├── integration/               # Tests d'intégration
│   ├── auth.integration.spec.ts
│   ├── eleves.integration.spec.ts
│   └── *.integration.spec.ts
└── e2e/                       # Tests end-to-end
    └── *.e2e.spec.ts
```

## Exécuter les Tests

```bash
# Tous les tests
npm test

# Tests unitaires uniquement
npm test -- test/unit

# Tests d'intégration
npm test -- test/integration

# Mode watch (développement)
npm run test:watch

# Couverture de code
npm run test:coverage
```

## Bonnes Pratiques

### 1. Nommage des Tests
- Fichiers : `*.spec.ts` ou `*.test.ts`
- Describe : décrire le module/fonction testé
- It : décrire le comportement attendu en français

### 2. Structure AAA (Arrange-Act-Assert)
```typescript
it('devrait faire X', () => {
    // Arrange
    const input = {...};
    
    // Act
    const result = service.method(input);
    
    // Assert
    expect(result).toBe(expected);
});
```

### 3. Tests Isolés
- Utiliser `beforeEach` et `afterEach` pour le setup/teardown
- Nettoyer la base de données après chaque test
- Mock les services externes (Redis, SMTP, etc.)

### 4. Couverture Minimale
- Services critiques : 80%+
- Utils/helpers : 90%+
- Controllers : 70%+

## Mocks

### Mock Redis
```typescript
jest.mock('../src/common/services/redis.service', () => ({
    redisService: {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
    }
}));
```

### Mock Database
```typescript
jest.mock('../src/database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn(() => mockRepo),
    }
}));
```

## CI/CD

Les tests sont exécutés automatiquement dans le pipeline CI :
- Push sur `main` ou `develop`
- Pull requests
- Avant déploiement en production
