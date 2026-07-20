# Login & Authentication Forms

<cite>
**Referenced Files in This Document**
- [App.tsx](file://frontend/src/App.tsx)
- [main.tsx](file://frontend/src/main.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [login.tsx](file://frontend/src/routes/login.tsx)
- [forgot-password.tsx](file://frontend/src/routes/forgot-password.tsx)
- [reset-password.tsx](file://frontend/src/routes/reset-password.tsx)
- [auth-layout.tsx](file://frontend/src/components/auth/auth-layout.tsx)
- [LoginForm.tsx](file://frontend/src/features/auth/LoginForm.tsx)
- [ForgotPasswordForm.tsx](file://frontend/src/features/auth/ForgotPasswordForm.tsx)
- [ResetPasswordForm.tsx](file://frontend/src/features/auth/ResetPasswordForm.tsx)
- [EtablissementSelectionModal.tsx](file://frontend/src/features/auth/EtablissementSelectionModal.tsx)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [authService.ts](file://frontend/src/lib/authService.ts)
- [i18n.ts](file://frontend/src/lib/i18n.ts)
- [locales/en.json](file://frontend/src/locales/en.json)
- [locales/fr.json](file://frontend/src/locales/fr.json)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [auth.routes.ts](file://backend/src/modules/auth/routes/auth.routes.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the login and authentication form components, focusing on:
- LoginPage implementation with multi-tenant institution selection, credential validation, and error handling
- ForgotPassword and ResetPassword workflows including form validation and API integration patterns
- EtablissementSelectionModal for switching institutions during authentication
- Accessibility, internationalization (i18n), and security considerations such as password masking and input sanitization

The goal is to provide a clear understanding of how these components work together across frontend and backend layers.

## Project Structure
Authentication-related UI is organized under routes and features:
- Routes define page-level entry points for login, forgot password, and reset password
- Feature components encapsulate form logic, validation, and user interactions
- Shared hooks and services manage authentication state and API calls
- Backend modules expose endpoints for login, password reset, and session management

```mermaid
graph TB
subgraph "Frontend"
App["App.tsx"]
Main["main.tsx"]
Router["routeTree.gen.ts"]
LoginPage["routes/login.tsx"]
ForgotPage["routes/forgot-password.tsx"]
ResetPage["routes/reset-password.tsx"]
AuthLayout["components/auth/auth-layout.tsx"]
LoginForm["features/auth/LoginForm.tsx"]
ForgotForm["features/auth/ForgotPasswordForm.tsx"]
ResetForm["features/auth/ResetPasswordForm.tsx"]
InstModal["features/auth/EtablissementSelectionModal.tsx"]
UseAuth["hooks/useAuth.ts"]
AuthService["lib/authService.ts"]
I18N["lib/i18n.ts"]
LocalesEn["locales/en.json"]
LocalesFr["locales/fr.json"]
end
subgraph "Backend"
AuthRoutes["modules/auth/routes/auth.routes.ts"]
AuthController["modules/auth/controllers/auth.controller.ts"]
AuthServiceB["modules/auth/services/auth.service.ts"]
AuthMW["common/middlewares/auth.middleware.ts"]
end
App --> Main
Main --> Router
Router --> LoginPage
Router --> ForgotPage
Router --> ResetPage
LoginPage --> AuthLayout
LoginPage --> LoginForm
LoginPage --> InstModal
ForgotPage --> AuthLayout
ForgotPage --> ForgotForm
ResetPage --> AuthLayout
ResetPage --> ResetForm
LoginForm --> UseAuth
ForgotForm --> UseAuth
ResetForm --> UseAuth
UseAuth --> AuthService
AuthService --> AuthRoutes
AuthRoutes --> AuthController
AuthController --> AuthServiceB
AuthController --> AuthMW
LoginForm --> I18N
ForgotForm --> I18N
ResetForm --> I18N
I18N --> LocalesEn
I18N --> LocalesFr
```

**Diagram sources**
- [App.tsx](file://frontend/src/App.tsx)
- [main.tsx](file://frontend/src/main.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)
- [login.tsx](file://frontend/src/routes/login.tsx)
- [forgot-password.tsx](file://frontend/src/routes/forgot-password.tsx)
- [reset-password.tsx](file://frontend/src/routes/reset-password.tsx)
- [auth-layout.tsx](file://frontend/src/components/auth/auth-layout.tsx)
- [LoginForm.tsx](file://frontend/src/features/auth/LoginForm.tsx)
- [ForgotPasswordForm.tsx](file://frontend/src/features/auth/ForgotPasswordForm.tsx)
- [ResetPasswordForm.tsx](file://frontend/src/features/auth/ResetPasswordForm.tsx)
- [EtablissementSelectionModal.tsx](file://frontend/src/features/auth/EtablissementSelectionModal.tsx)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [authService.ts](file://frontend/src/lib/authService.ts)
- [i18n.ts](file://frontend/src/lib/i18n.ts)
- [locales/en.json](file://frontend/src/locales/en.json)
- [locales/fr.json](file://frontend/src/locales/fr.json)
- [auth.routes.ts](file://backend/src/modules/auth/routes/auth.routes.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)

**Section sources**
- [App.tsx](file://frontend/src/App.tsx)
- [main.tsx](file://frontend/src/main.tsx)
- [routeTree.gen.ts](file://frontend/src/routeTree.gen.ts)

## Core Components
- LoginPage: Entry point for authentication; orchestrates institution selection, credentials submission, and navigation after success or failure.
- LoginForm: Encapsulates login form fields, validation rules, and submission flow. Integrates with useAuth and authService for API calls.
- EtablissementSelectionModal: Modal for selecting an institution when users belong to multiple tenants; updates context before login attempts.
- ForgotPasswordForm: Handles email-based password reset requests with validation and feedback.
- ResetPasswordForm: Manages token-based password reset with strong password validation and confirmation checks.
- useAuth: Centralized hook providing login/logout state, error handling, and tenant-aware operations.
- authService: HTTP client wrapper for auth endpoints, token storage, and request/response normalization.
- i18n and locales: Provide localized labels, errors, and messages across forms.

Key responsibilities:
- Multi-tenant awareness via institution selection
- Robust client-side validation and user-friendly error messages
- Secure handling of sensitive inputs (password masking)
- Consistent API integration patterns with centralized error mapping

**Section sources**
- [login.tsx](file://frontend/src/routes/login.tsx)
- [LoginForm.tsx](file://frontend/src/features/auth/LoginForm.tsx)
- [EtablissementSelectionModal.tsx](file://frontend/src/features/auth/EtablissementSelectionModal.tsx)
- [ForgotPasswordForm.tsx](file://frontend/src/features/auth/ForgotPasswordForm.tsx)
- [ResetPasswordForm.tsx](file://frontend/src/features/auth/ResetPasswordForm.tsx)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [authService.ts](file://frontend/src/lib/authService.ts)
- [i18n.ts](file://frontend/src/lib/i18n.ts)
- [locales/en.json](file://frontend/src/locales/en.json)
- [locales/fr.json](file://frontend/src/locales/fr.json)

## Architecture Overview
The authentication flow spans frontend components, hooks, services, and backend controllers:

```mermaid
sequenceDiagram
participant User as "User"
participant Page as "LoginPage"
participant Form as "LoginForm"
participant Hook as "useAuth"
participant Service as "authService"
participant Routes as "auth.routes.ts"
participant Controller as "auth.controller.ts"
participant Svc as "auth.service.ts"
participant MW as "auth.middleware.ts"
User->>Page : Open login page
Page->>Form : Render form + modal trigger
User->>Form : Enter credentials / select institution
Form->>Hook : submit(credentials, institutionId)
Hook->>Service : POST /auth/login
Service->>Routes : Forward request
Routes->>Controller : Handle login
Controller->>Svc : Authenticate user
Svc-->>Controller : Result {token, user, roles}
Controller-->>Service : Response
Service-->>Hook : Normalize response
Hook-->>Form : Success or error
Form->>Page : Navigate to dashboard or show error
```

**Diagram sources**
- [login.tsx](file://frontend/src/routes/login.tsx)
- [LoginForm.tsx](file://frontend/src/features/auth/LoginForm.tsx)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [authService.ts](file://frontend/src/lib/authService.ts)
- [auth.routes.ts](file://backend/src/modules/auth/routes/auth.routes.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)

## Detailed Component Analysis

### LoginPage
Responsibilities:
- Renders AuthLayout and LoginForm
- Manages route transitions and redirects based on authentication state
- Integrates EtablissementSelectionModal for multi-tenant scenarios
- Displays global errors and loading states

Validation and error handling:
- Delegates field validation to LoginForm
- Uses centralized error mapping from authService
- Presents user-friendly messages via i18n

Accessibility:
- Provides descriptive aria-labels and role attributes
- Ensures focus management on modal open/close
- Supports keyboard navigation for institution selection

Internationalization:
- Loads localized strings for labels, placeholders, and errors
- Switches language dynamically using i18n configuration

Security:
- Avoids logging sensitive data
- Enforces HTTPS-only tokens and secure storage patterns through authService

**Section sources**
- [login.tsx](file://frontend/src/routes/login.tsx)
- [auth-layout.tsx](file://frontend/src/components/auth/auth-layout.tsx)
- [EtablissementSelectionModal.tsx](file://frontend/src/features/auth/EtablissementSelectionModal.tsx)
- [i18n.ts](file://frontend/src/lib/i18n.ts)
- [locales/en.json](file://frontend/src/locales/en.json)
- [locales/fr.json](file://frontend/src/locales/fr.json)

#### LoginPage Class Diagram
```mermaid
classDiagram
class LoginPage {
+render()
+handleSuccess()
+handleError(error)
+openInstitutionModal()
+closeInstitutionModal()
}
class AuthLayout {
+children
+title
+subtitle
}
class LoginForm {
+fields
+validate()
+submit()
}
class EtablissementSelectionModal {
+institutions
+selectedId
+onSelect(id)
+isOpen
}
LoginPage --> AuthLayout : "wraps"
LoginPage --> LoginForm : "renders"
LoginPage --> EtablissementSelectionModal : "controls visibility"
```

**Diagram sources**
- [login.tsx](file://frontend/src/routes/login.tsx)
- [auth-layout.tsx](file://frontend/src/components/auth/auth-layout.tsx)
- [LoginForm.tsx](file://frontend/src/features/auth/LoginForm.tsx)
- [EtablissementSelectionModal.tsx](file://frontend/src/features/auth/EtablissementSelectionModal.tsx)

### LoginForm
Responsibilities:
- Manages username/email and password fields
- Validates inputs locally before submission
- Submits credentials via useAuth and authService
- Updates UI state (loading, errors, success)

Validation rules:
- Required fields and format checks
- Password length constraints
- Institution selection requirement when applicable

API integration pattern:
- useAuth.submitLogin(payload) triggers authService.post('/auth/login')
- Normalizes responses and stores tokens securely
- Maps backend errors to user-facing messages

Error handling:
- Distinguishes between network errors, invalid credentials, and account lockouts
- Displays contextual messages and guidance

Accessibility:
- Associates labels with inputs
- Announces errors via aria-live regions
- Supports tab order and focus indicators

Internationalization:
- Uses i18n keys for labels, placeholders, and validation messages

Security:
- Masks password input
- Sanitizes inputs to prevent XSS
- Avoids storing passwords in memory longer than necessary

**Section sources**
- [LoginForm.tsx](file://frontend/src/features/auth/LoginForm.tsx)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [authService.ts](file://frontend/src/lib/authService.ts)
- [i18n.ts](file://frontend/src/lib/i18n.ts)
- [locales/en.json](file://frontend/src/locales/en.json)
- [locales/fr.json](file://frontend/src/locales/fr.json)

#### LoginForm Sequence Diagram
```mermaid
sequenceDiagram
participant User as "User"
participant Form as "LoginForm"
participant Hook as "useAuth"
participant Service as "authService"
participant Routes as "auth.routes.ts"
participant Controller as "auth.controller.ts"
participant Svc as "auth.service.ts"
User->>Form : Fill fields + click Submit
Form->>Form : validateFields()
alt Valid
Form->>Hook : submitLogin({email, password, institutionId})
Hook->>Service : POST /auth/login
Service->>Routes : Forward request
Routes->>Controller : Handle login
Controller->>Svc : Authenticate
Svc-->>Controller : Token + user info
Controller-->>Service : Response
Service-->>Hook : Normalized result
Hook-->>Form : Success
Form->>Form : navigateToDashboard()
else Invalid
Form->>Form : Show validation errors
end
```

**Diagram sources**
- [LoginForm.tsx](file://frontend/src/features/auth/LoginForm.tsx)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [authService.ts](file://frontend/src/lib/authService.ts)
- [auth.routes.ts](file://backend/src/modules/auth/routes/auth.routes.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)

### EtablissementSelectionModal
Responsibilities:
- Lists available institutions for the authenticated user
- Allows selection of a target tenant before login
- Persists selected institution in local context or store

Behavior:
- Opens automatically if multiple institutions are detected
- Closes upon selection or explicit dismissal
- Updates LoginForm payload with selected institutionId

Accessibility:
- Focus trap while modal is open
- Escape key closes modal
- Descriptive aria-modal and role attributes

Internationalization:
- Displays institution names and instructions in current locale

Security:
- Validates institutionId against allowed list
- Prevents unauthorized tenant switching

**Section sources**
- [EtablissementSelectionModal.tsx](file://frontend/src/features/auth/EtablissementSelectionModal.tsx)
- [i18n.ts](file://frontend/src/lib/i18n.ts)
- [locales/en.json](file://frontend/src/locales/en.json)
- [locales/fr.json](file://frontend/src/locales/fr.json)

#### EtablissementSelectionModal Flowchart
```mermaid
flowchart TD
Start(["Open Modal"]) --> LoadInst["Load Institutions"]
LoadInst --> HasMultiple{"Multiple Institutions?"}
HasMultiple --> |No| CloseAuto["Close Automatically"]
HasMultiple --> |Yes| ShowList["Show Institution List"]
ShowList --> SelectInst["User Selects Institution"]
SelectInst --> ValidateInst["Validate institutionId"]
ValidateInst --> |Valid| Persist["Persist Selected Institution"]
Persist --> CloseModal["Close Modal"]
ValidateInst --> |Invalid| ShowError["Display Error Message"]
ShowError --> ShowList
CloseAuto --> End(["End"])
CloseModal --> End
```

**Diagram sources**
- [EtablissementSelectionModal.tsx](file://frontend/src/features/auth/EtablissementSelectionModal.tsx)

### ForgotPassword Workflow
Responsibilities:
- Accepts user email
- Validates email format
- Sends reset request via authService
- Displays success or error feedback

Validation:
- Required email field
- Email format check
- Optional rate-limiting UI hints

API integration:
- POST /auth/forgot-password with normalized payload
- Centralized error mapping for user-friendly messages

Accessibility:
- Clear label and placeholder
- Announces success/error via aria-live

Internationalization:
- Localized messages for success and errors

Security:
- Does not reveal whether email exists
- Rate-limits on backend enforced by middleware

**Section sources**
- [forgot-password.tsx](file://frontend/src/routes/forgot-password.tsx)
- [ForgotPasswordForm.tsx](file://frontend/src/features/auth/ForgotPasswordForm.tsx)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [authService.ts](file://frontend/src/lib/authService.ts)
- [i18n.ts](file://frontend/src/lib/i18n.ts)
- [locales/en.json](file://frontend/src/locales/en.json)
- [locales/fr.json](file://frontend/src/locales/fr.json)

#### ForgotPassword Sequence Diagram
```mermaid
sequenceDiagram
participant User as "User"
participant Page as "ForgotPasswordPage"
participant Form as "ForgotPasswordForm"
participant Hook as "useAuth"
participant Service as "authService"
participant Routes as "auth.routes.ts"
participant Controller as "auth.controller.ts"
participant Svc as "auth.service.ts"
User->>Page : Open forgot password
Page->>Form : Render email form
User->>Form : Enter email + Submit
Form->>Hook : requestPasswordReset(email)
Hook->>Service : POST /auth/forgot-password
Service->>Routes : Forward request
Routes->>Controller : Handle reset request
Controller->>Svc : Process reset
Svc-->>Controller : Acknowledgement
Controller-->>Service : Response
Service-->>Hook : Normalized result
Hook-->>Form : Success/Error
Form->>Page : Show message
```

**Diagram sources**
- [forgot-password.tsx](file://frontend/src/routes/forgot-password.tsx)
- [ForgotPasswordForm.tsx](file://frontend/src/features/auth/ForgotPasswordForm.tsx)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [authService.ts](file://frontend/src/lib/authService.ts)
- [auth.routes.ts](file://backend/src/modules/auth/routes/auth.routes.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)

### ResetPassword Workflow
Responsibilities:
- Accepts token, new password, and confirmation
- Validates password strength and match
- Submits reset via authService
- Navigates to login on success

Validation:
- Required token, password, confirm password
- Password complexity rules
- Confirmation equality check

API integration:
- POST /auth/reset-password with normalized payload
- Centralized error mapping

Accessibility:
- Clear instructions and error announcements
- Keyboard support

Internationalization:
- Localized labels and messages

Security:
- Strong password requirements
- Masked input for password fields
- Input sanitization

**Section sources**
- [reset-password.tsx](file://frontend/src/routes/reset-password.tsx)
- [ResetPasswordForm.tsx](file://frontend/src/features/auth/ResetPasswordForm.tsx)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [authService.ts](file://frontend/src/lib/authService.ts)
- [i18n.ts](file://frontend/src/lib/i18n.ts)
- [locales/en.json](file://frontend/src/locales/en.json)
- [locales/fr.json](file://frontend/src/locales/fr.json)

#### ResetPassword Sequence Diagram
```mermaid
sequenceDiagram
participant User as "User"
participant Page as "ResetPasswordPage"
participant Form as "ResetPasswordForm"
participant Hook as "useAuth"
participant Service as "authService"
participant Routes as "auth.routes.ts"
participant Controller as "auth.controller.ts"
participant Svc as "auth.service.ts"
User->>Page : Open reset password with token
Page->>Form : Render password form
User->>Form : Enter new password + confirm
Form->>Form : validateStrengthAndMatch()
alt Valid
Form->>Hook : resetPassword(token, newPassword)
Hook->>Service : POST /auth/reset-password
Service->>Routes : Forward request
Routes->>Controller : Handle reset
Controller->>Svc : Update password
Svc-->>Controller : Success
Controller-->>Service : Response
Service-->>Hook : Normalized result
Hook-->>Form : Success
Form->>Page : Redirect to login
else Invalid
Form->>Form : Show validation errors
end
```

**Diagram sources**
- [reset-password.tsx](file://frontend/src/routes/reset-password.tsx)
- [ResetPasswordForm.tsx](file://frontend/src/features/auth/ResetPasswordForm.tsx)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [authService.ts](file://frontend/src/lib/authService.ts)
- [auth.routes.ts](file://backend/src/modules/auth/routes/auth.routes.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)

## Dependency Analysis
Component relationships and dependencies:

```mermaid
graph LR
LoginPage["LoginPage"] --> AuthLayout["AuthLayout"]
LoginPage --> LoginForm["LoginForm"]
LoginPage --> EtablissementSelectionModal["EtablissementSelectionModal"]
LoginForm --> useAuth["useAuth"]
LoginForm --> authService["authService"]
ForgotPasswordForm["ForgotPasswordForm"] --> useAuth
ForgotPasswordForm --> authService
ResetPasswordForm["ResetPasswordForm"] --> useAuth
ResetPasswordForm --> authService
useAuth --> authService
authService --> AuthRoutes["auth.routes.ts"]
AuthRoutes --> AuthController["auth.controller.ts"]
AuthController --> AuthServiceB["auth.service.ts"]
AuthController --> AuthMW["auth.middleware.ts"]
LoginForm --> I18N["i18n.ts"]
ForgotPasswordForm --> I18N
ResetPasswordForm --> I18N
I18N --> LocalesEn["locales/en.json"]
I18N --> LocalesFr["locales/fr.json"]
```

**Diagram sources**
- [login.tsx](file://frontend/src/routes/login.tsx)
- [auth-layout.tsx](file://frontend/src/components/auth/auth-layout.tsx)
- [LoginForm.tsx](file://frontend/src/features/auth/LoginForm.tsx)
- [EtablissementSelectionModal.tsx](file://frontend/src/features/auth/EtablissementSelectionModal.tsx)
- [ForgotPasswordForm.tsx](file://frontend/src/features/auth/ForgotPasswordForm.tsx)
- [ResetPasswordForm.tsx](file://frontend/src/features/auth/ResetPasswordForm.tsx)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [authService.ts](file://frontend/src/lib/authService.ts)
- [auth.routes.ts](file://backend/src/modules/auth/routes/auth.routes.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)
- [i18n.ts](file://frontend/src/lib/i18n.ts)
- [locales/en.json](file://frontend/src/locales/en.json)
- [locales/fr.json](file://frontend/src/locales/fr.json)

**Section sources**
- [login.tsx](file://frontend/src/routes/login.tsx)
- [auth-layout.tsx](file://frontend/src/components/auth/auth-layout.tsx)
- [LoginForm.tsx](file://frontend/src/features/auth/LoginForm.tsx)
- [EtablissementSelectionModal.tsx](file://frontend/src/features/auth/EtablissementSelectionModal.tsx)
- [ForgotPasswordForm.tsx](file://frontend/src/features/auth/ForgotPasswordForm.tsx)
- [ResetPasswordForm.tsx](file://frontend/src/features/auth/ResetPasswordForm.tsx)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [authService.ts](file://frontend/src/lib/authService.ts)
- [auth.routes.ts](file://backend/src/modules/auth/routes/auth.routes.ts)
- [auth.controller.ts](file://backend/src/modules/auth/controllers/auth.controller.ts)
- [auth.service.ts](file://backend/src/modules/auth/services/auth.service.ts)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)
- [i18n.ts](file://frontend/src/lib/i18n.ts)
- [locales/en.json](file://frontend/src/locales/en.json)
- [locales/fr.json](file://frontend/src/locales/fr.json)

## Performance Considerations
- Debounce or throttle repeated submissions to avoid redundant API calls
- Cache institution lists where appropriate to reduce network overhead
- Minimize re-renders by memoizing validation results and derived state
- Use progressive loading for large institution lists
- Ensure efficient error mapping without heavy computations

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Network errors: Check connectivity and CORS settings; verify authService base URL and headers
- Invalid credentials: Confirm username/email and password; ensure correct institution selection
- Account lockout: Follow backend policies; display guidance and retry intervals
- Token expiration: Refresh or re-authenticate; handle 401 responses gracefully
- Validation failures: Inspect field-specific error messages and ensure proper i18n keys
- Modal focus issues: Verify focus trap and escape behavior in EtablissementSelectionModal

**Section sources**
- [authService.ts](file://frontend/src/lib/authService.ts)
- [useAuth.ts](file://frontend/src/hooks/useAuth.ts)
- [EtablissementSelectionModal.tsx](file://frontend/src/features/auth/EtablissementSelectionModal.tsx)
- [auth.middleware.ts](file://backend/src/common/middlewares/auth.middleware.ts)

## Conclusion
The login and authentication forms implement a robust, accessible, and internationalized user experience with strong security practices. Multi-tenant support is handled via EtablissementSelectionModal, ensuring users can switch institutions safely. The separation of concerns across routes, features, hooks, and services promotes maintainability and testability. Following the recommended performance and troubleshooting guidelines will help keep the system reliable and user-friendly.

[No sources needed since this section summarizes without analyzing specific files]