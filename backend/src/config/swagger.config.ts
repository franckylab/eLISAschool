/**
 * ==================================
 * eLISAschool - Configuration Swagger / OpenAPI
 * ==================================
 * Documentation API interactive via Swagger UI
 */

export const swaggerSpec = {
    openapi: '3.0.3',
    info: {
        title: 'eLISAschool API',
        description: 'API de gestion scolaire avancée - eLISAschool\n\n## Authentification\nL\'API utilise des tokens JWT. Incluez le header `Authorization: Bearer <token>` pour les routes protégées.',
        version: '1.0.0',
        contact: { name: 'xAI Éducation' },
    },
    servers: [{ url: '/api', description: 'Serveur API' }],
    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
        schemas: {
            SuccessResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                },
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: {
                        type: 'object',
                        properties: {
                            code: { type: 'string' },
                            message: { type: 'string' },
                        },
                    },
                },
            },
        },
    },
    security: [{ bearerAuth: [] }],
    tags: [
        { name: 'Système', description: 'Endpoints système' },
        { name: 'Authentification', description: 'Connexion, inscription, tokens' },
        { name: 'Utilisateurs', description: 'Gestion des utilisateurs' },
        { name: 'Élèves', description: 'Gestion des élèves' },
        { name: 'Configuration', description: 'Paramètres et modules' },
        { name: 'Notes', description: 'Évaluations et notes' },
        { name: 'Cantine', description: 'Service de cantine' },
        { name: 'Transport', description: 'Transport scolaire' },
        { name: 'Messagerie', description: 'Communications' },
        { name: 'Notifications', description: 'Alertes et notifications' },
        { name: 'Clubs', description: 'Activités parascolaires' },
        { name: 'Gamification', description: 'Points, badges, classement' },
        { name: 'Matériel', description: 'Inventaire et prêts' },
        { name: 'Requêtes', description: 'Demandes et approbations' },
        { name: 'Cartes', description: 'Cartes scolaires' },
        { name: 'Académique', description: 'Périodes, classes, matières, personnel' },
        { name: 'Orientation', description: 'Conseil d\'orientation' },
        { name: 'Impressions', description: 'Génération de documents' },
        { name: 'Monitoring', description: 'Surveillance du système' },
    ],
    paths: {
        '/health': {
            get: {
                tags: ['Système'],
                summary: 'Health check',
                security: [],
                responses: { '200': { description: 'API opérationnelle' } },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Authentification'],
                summary: 'Connexion utilisateur',
                security: [],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object', required: ['email', 'motDePasse'], properties: { email: { type: 'string', format: 'email' }, motDePasse: { type: 'string' } } } } },
                },
                responses: { '200': { description: 'Tokens JWT' } },
            },
        },
        '/auth/register': {
            post: {
                tags: ['Authentification'],
                summary: 'Inscription utilisateur',
                security: [],
                responses: { '201': { description: 'Compte créé' } },
            },
        },
        '/auth/refresh': {
            post: { tags: ['Authentification'], summary: 'Rafraîchir le token JWT', security: [], responses: { '200': { description: 'Nouveau token' } } },
        },
        '/auth/me': {
            get: { tags: ['Authentification'], summary: 'Profil utilisateur courant', responses: { '200': { description: 'Profil utilisateur' } } },
        },
        '/auth/forgot-password': {
            post: { tags: ['Authentification'], summary: 'Mot de passe oublié', security: [], responses: { '200': { description: 'Email envoyé' } } },
        },
        '/auth/change-password': {
            post: { tags: ['Authentification'], summary: 'Changer le mot de passe', responses: { '200': { description: 'Mot de passe changé' } } },
        },
        '/utilisateurs': {
            get: { tags: ['Utilisateurs'], summary: 'Lister les utilisateurs', responses: { '200': { description: 'Liste paginée' } } },
        },
        '/configuration': {
            get: { tags: ['Configuration'], summary: 'Configuration application', responses: { '200': { description: 'Configuration' } } },
            patch: { tags: ['Configuration'], summary: 'Modifier la configuration', responses: { '200': { description: 'Configuration mise à jour' } } },
        },
        '/configuration/modules': {
            get: { tags: ['Configuration'], summary: 'Lister les modules', responses: { '200': { description: 'Modules' } } },
        },
        '/configuration/parametres': {
            get: { tags: ['Configuration'], summary: 'Lister les paramètres', responses: { '200': { description: 'Paramètres' } } },
            post: { tags: ['Configuration'], summary: 'Créer un paramètre', responses: { '201': { description: 'Paramètre créé' } } },
        },
        '/configuration/historique': {
            get: { tags: ['Configuration'], summary: 'Historique des modifications', responses: { '200': { description: 'Historique' } } },
        },
        '/eleves': {
            get: { tags: ['Élèves'], summary: 'Lister les élèves', responses: { '200': { description: 'Liste paginée' } } },
            post: { tags: ['Élèves'], summary: 'Créer un élève', responses: { '201': { description: 'Élève créé' } } },
        },
        '/notes': {
            get: { tags: ['Notes'], summary: 'Lister les notes', responses: { '200': { description: 'Notes' } } },
            post: { tags: ['Notes'], summary: 'Ajouter une note', responses: { '201': { description: 'Note ajoutée' } } },
        },
        '/bulletins': {
            get: { tags: ['Notes'], summary: 'Générer un bulletin', responses: { '200': { description: 'Bulletin' } } },
        },
        '/cantine/menus': {
            get: { tags: ['Cantine'], summary: 'Lister les menus', responses: { '200': { description: 'Menus' } } },
            post: { tags: ['Cantine'], summary: 'Créer un menu', responses: { '201': { description: 'Menu créé' } } },
        },
        '/cantine/inscriptions': {
            get: { tags: ['Cantine'], summary: 'Lister les inscriptions cantine', responses: { '200': { description: 'Inscriptions' } } },
            post: { tags: ['Cantine'], summary: 'Inscrire un élève', responses: { '201': { description: 'Inscription créée' } } },
        },
        '/cantine/consommations': {
            get: { tags: ['Cantine'], summary: 'Lister les consommations', responses: { '200': { description: 'Consommations' } } },
            post: { tags: ['Cantine'], summary: 'Enregistrer une consommation', responses: { '201': { description: 'Consommation enregistrée' } } },
        },
        '/transport/itineraires': {
            get: { tags: ['Transport'], summary: 'Lister les itinéraires', responses: { '200': { description: 'Itinéraires' } } },
            post: { tags: ['Transport'], summary: 'Créer un itinéraire', responses: { '201': { description: 'Itinéraire créé' } } },
        },
        '/messagerie/conversations': {
            get: { tags: ['Messagerie'], summary: 'Lister les conversations', responses: { '200': { description: 'Conversations' } } },
            post: { tags: ['Messagerie'], summary: 'Créer une conversation', responses: { '201': { description: 'Conversation créée' } } },
        },
        '/messagerie/file': {
            get: { tags: ['Messagerie'], summary: 'File d\'attente messages', responses: { '200': { description: 'File' } } },
            post: { tags: ['Messagerie'], summary: 'Ajouter à la file', responses: { '201': { description: 'Message ajouté' } } },
        },
        '/notifications': {
            get: { tags: ['Notifications'], summary: 'Lister les notifications', responses: { '200': { description: 'Notifications' } } },
            post: { tags: ['Notifications'], summary: 'Créer une notification', responses: { '201': { description: 'Notification créée' } } },
        },
        '/clubs': {
            get: { tags: ['Clubs'], summary: 'Lister les clubs', responses: { '200': { description: 'Clubs' } } },
            post: { tags: ['Clubs'], summary: 'Créer un club', responses: { '201': { description: 'Club créé' } } },
        },
        '/gamification/badges': {
            get: { tags: ['Gamification'], summary: 'Lister les badges', security: [], responses: { '200': { description: 'Badges' } } },
        },
        '/gamification/classement': {
            get: { tags: ['Gamification'], summary: 'Classement', security: [], responses: { '200': { description: 'Classement' } } },
        },
        '/materiel': {
            get: { tags: ['Matériel'], summary: 'Lister le matériel', responses: { '200': { description: 'Matériel' } } },
            post: { tags: ['Matériel'], summary: 'Ajouter du matériel', responses: { '201': { description: 'Matériel ajouté' } } },
        },
        '/materiel/prets': {
            get: { tags: ['Matériel'], summary: 'Lister les prêts', responses: { '200': { description: 'Prêts' } } },
            post: { tags: ['Matériel'], summary: 'Créer un prêt', responses: { '201': { description: 'Prêt créé' } } },
        },
        '/requetes': {
            get: { tags: ['Requêtes'], summary: 'Lister les requêtes', responses: { '200': { description: 'Requêtes' } } },
            post: { tags: ['Requêtes'], summary: 'Créer une requête', responses: { '201': { description: 'Requête créée' } } },
        },
        '/cartes': {
            get: { tags: ['Cartes'], summary: 'Lister les cartes', responses: { '200': { description: 'Cartes' } } },
            post: { tags: ['Cartes'], summary: 'Générer une carte', responses: { '201': { description: 'Carte générée' } } },
        },
        '/periodes': {
            get: { tags: ['Académique'], summary: 'Lister les périodes', responses: { '200': { description: 'Périodes' } } },
            post: { tags: ['Académique'], summary: 'Créer une période', responses: { '201': { description: 'Période créée' } } },
        },
        '/classes': {
            get: { tags: ['Académique'], summary: 'Lister les classes', responses: { '200': { description: 'Classes' } } },
            post: { tags: ['Académique'], summary: 'Créer une classe', responses: { '201': { description: 'Classe créée' } } },
        },
        '/matieres': {
            get: { tags: ['Académique'], summary: 'Lister les matières', responses: { '200': { description: 'Matières' } } },
            post: { tags: ['Académique'], summary: 'Créer une matière', responses: { '201': { description: 'Matière créée' } } },
        },
        '/personnel': {
            get: { tags: ['Académique'], summary: 'Lister le personnel', responses: { '200': { description: 'Personnel' } } },
            post: { tags: ['Académique'], summary: 'Ajouter du personnel', responses: { '201': { description: 'Personnel ajouté' } } },
        },
        '/annees-scolaires': {
            get: { tags: ['Académique'], summary: 'Lister les années scolaires', responses: { '200': { description: 'Années scolaires' } } },
            post: { tags: ['Académique'], summary: 'Créer une année scolaire', responses: { '201': { description: 'Année créée' } } },
        },
        '/cycles': {
            get: { tags: ['Académique'], summary: 'Lister les cycles', responses: { '200': { description: 'Cycles' } } },
        },
        '/niveaux': {
            get: { tags: ['Académique'], summary: 'Lister les niveaux', responses: { '200': { description: 'Niveaux' } } },
        },
        '/orientation': {
            get: { tags: ['Orientation'], summary: 'Lister les dossiers d\'orientation', responses: { '200': { description: 'Dossiers' } } },
        },
        '/impressions/modeles': {
            get: { tags: ['Impressions'], summary: 'Lister les modèles', responses: { '200': { description: 'Modèles' } } },
            post: { tags: ['Impressions'], summary: 'Créer un modèle', responses: { '201': { description: 'Modèle créé' } } },
        },
        '/impressions/file': {
            get: { tags: ['Impressions'], summary: 'File d\'impression', responses: { '200': { description: 'File' } } },
            post: { tags: ['Impressions'], summary: 'Ajouter à la file', responses: { '201': { description: 'Tâche ajoutée' } } },
        },
        '/monitoring': {
            get: { tags: ['Monitoring'], summary: 'État du système', responses: { '200': { description: 'État système' } } },
        },
    },
};
