# Human Resources API

<cite>
**Referenced Files in This Document**
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)
- [backend/src/modules/recrutement/index.ts](file://backend/src/modules/recrutement/index.ts)
- [backend/src/modules/paie/index.ts](file://backend/src/modules/paie/index.ts)
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)
- [backend/database/migrations/045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [backend/database/migrations/016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [backend/database/migrations/017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [backend/database/migrations/018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [backend/database/migrations/019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [backend/database/migrations/020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [backend/database/migrations/029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [backend/database/migrations/031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)
- [backend/src/shared/constants/personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
</cite>

## Update Summary
**Changes Made**
- Updated Personnel Administration section to reflect consolidation of personnel type services
- Removed references to standalone personnel type endpoints that no longer exist
- Updated architecture diagrams to show consolidated service approach
- Revised dependency analysis to reflect integrated functionality

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
10. [Appendices](#appendices)

## Introduction
This document provides comprehensive API documentation for eLISAschool's human resources module, covering:
- Personnel administration: staff recruitment workflow, employee profiles, contract management, and document handling
- Payroll processing: salary structure configuration, tax calculations, payment processing, and payroll reports
- Attendance and leave management: time tracking systems, leave request workflows, absence monitoring, and attendance reports
- Performance evaluation: metrics, review workflows, career progression, and training management

The goal is to enable developers and integrators to implement HR workflows confidently using the available endpoints, data models, and relationships.

**Updated** The personnel type management has been consolidated into core services, eliminating separate type-specific endpoints in favor of a unified approach.

## Project Structure
The HR functionality is implemented across dedicated backend modules and database migrations:
- Recruitment module: manages candidate lifecycle and hiring workflow
- Personnel module: core employee profiles, contracts, documents, and consolidated type management
- Payroll (paie) module: salary structures, taxes, payments, and reporting
- Personnel tracking (suivi-personnel): attendance, leave requests, absences, and performance evaluations

```mermaid
graph TB
subgraph "HR Modules"
R["Recruitment Module"]
P["Personnel Module (Consolidated Types)"]
PA["Payroll (Paie) Module"]
S["Personnel Tracking Module"]
end
subgraph "Database Migrations"
M1["045-module-recrutement.sql"]
M2["016..020 personnel RH phases"]
M3["029 paie etendue.sql"]
M4["031 suivi-personnel.sql"]
end
R --> M1
P --> M2
PA --> M3
S --> M4
```

**Diagram sources**
- [backend/src/modules/recrutement/index.ts](file://backend/src/modules/recrutement/index.ts)
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)
- [backend/src/modules/paie/index.ts](file://backend/src/modules/paie/index.ts)
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)
- [backend/database/migrations/045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [backend/database/migrations/016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [backend/database/migrations/017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [backend/database/migrations/018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [backend/database/migrations/019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [backend/database/migrations/020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [backend/database/migrations/029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [backend/database/migrations/031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)

**Section sources**
- [backend/src/modules/recrutement/index.ts](file://backend/src/modules/recrutement/index.ts)
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)
- [backend/src/modules/paie/index.ts](file://backend/src/modules/paie/index.ts)
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)
- [backend/database/migrations/045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [backend/database/migrations/016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [backend/database/migrations/017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [backend/database/migrations/018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [backend/database/migrations/019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [backend/database/migrations/020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [backend/database/migrations/029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [backend/database/migrations/031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)

## Core Components
- Recruitment API: Candidate registration, application submission, interview scheduling, offer generation, and onboarding triggers
- Personnel API: Employee profile CRUD, contract lifecycle, document storage and retrieval, status transitions, and **consolidated type management**
- Payroll API: Salary structure setup, tax rules, pay slips, payment runs, and payroll reports
- Attendance & Leave API: Time entries, leave requests/approvals, absence tracking, and attendance summaries
- Performance Evaluation API: Metrics definition, review cycles, career progression records, and training logs

These components are backed by well-defined database schemas created via migrations and exposed through REST endpoints within each module.

**Updated** Personnel type management is now integrated directly into the core personnel service rather than being handled by separate type-specific endpoints.

**Section sources**
- [backend/src/modules/recrutement/index.ts](file://backend/src/modules/recrutement/index.ts)
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)
- [backend/src/modules/paie/index.ts](file://backend/src/modules/paie/index.ts)
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)

## Architecture Overview
The HR system follows a modular architecture where each domain has its own controller/service layer and database schema. Endpoints are registered per module and share common authentication, authorization, and multi-tenant scoping. Personnel type operations are now handled within the consolidated personnel service.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant Auth as "Auth Middleware"
participant Router as "Route Registry"
participant Recruit as "Recruitment Controller"
participant Person as "Personnel Controller (Consolidated)"
participant Paie as "Payroll Controller"
participant Track as "Tracking Controller"
participant DB as "Database"
Client->>Auth : "HTTP Request with Token"
Auth-->>Router : "Authenticated Context"
Router->>Recruit : "POST /recruitment/candidates"
Recruit->>DB : "Insert candidate record"
DB-->>Recruit : "Candidate ID"
Recruit-->>Client : "201 Created"
Client->>Person : "POST /personnel/employees"
Person->>DB : "Create employee profile with type"
DB-->>Person : "Employee ID"
Person-->>Client : "201 Created"
Client->>Person : "PUT /personnel/employees/ : id/types"
Person->>DB : "Update consolidated types"
DB-->>Person : "Success"
Person-->>Client : "200 OK"
Client->>Paie : "POST /paie/payrolls/run"
Paie->>DB : "Compute salaries and taxes"
DB-->>Paie : "Payroll results"
Paie-->>Client : "200 OK"
Client->>Track : "POST /tracking/attendance"
Track->>DB : "Record time entry"
DB-->>Track : "Entry ID"
Track-->>Client : "201 Created"
```

**Diagram sources**
- [backend/src/modules/recrutement/index.ts](file://backend/src/modules/recrutement/index.ts)
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)
- [backend/src/modules/paie/index.ts](file://backend/src/modules/paie/index.ts)
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)

## Detailed Component Analysis

### Recruitment API
Covers candidate lifecycle from application to onboarding. Typical operations include creating candidates, submitting applications, scheduling interviews, issuing offers, and transitioning to employee records.

Key concepts:
- Candidate entity with application history
- Interview sessions and outcomes
- Offer letters and acceptance flow
- Onboarding trigger that creates an employee profile

```mermaid
flowchart TD
Start(["Start Recruitment"]) --> CreateCandidate["Create Candidate"]
CreateCandidate --> SubmitApplication["Submit Application"]
SubmitApplication --> ScheduleInterview["Schedule Interview"]
ScheduleInterview --> EvaluateOutcome{"Evaluation Outcome"}
EvaluateOutcome --> |Rejected| CloseRejection["Close as Rejected"]
EvaluateOutcome --> |Accepted| GenerateOffer["Generate Offer"]
GenerateOffer --> AcceptOffer{"Offer Accepted?"}
AcceptOffer --> |No| CloseDeclined["Close as Declined"]
AcceptOffer --> |Yes| OnboardEmployee["Onboard Employee"]
OnboardEmployee --> End(["End Recruitment"])
```

**Diagram sources**
- [backend/database/migrations/045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [backend/src/modules/recrutement/index.ts](file://backend/src/modules/recrutement/index.ts)

**Section sources**
- [backend/src/modules/recrutement/index.ts](file://backend/src/modules/recrutement/index.ts)
- [backend/database/migrations/045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)

### Personnel Administration API
Handles employee profiles, contracts, documents, and **consolidated type management**. Includes creation, updates, status transitions, attachment handling, and integrated personnel type operations.

Key concepts:
- Employee profile with personal and professional details
- Contract types and lifecycle states
- Document attachments linked to employees or contracts
- Status transitions (active, inactive, terminated)
- **Consolidated personnel type management within core service**

```mermaid
classDiagram
class Employee {
+id
+personalInfo
+professionalInfo
+status
+types
}
class Contract {
+id
+employeeId
+type
+startDate
+endDate
+status
}
class Document {
+id
+entityType
+entityId
+metadata
}
class PersonnelTypes {
+id
+employeeId
+typeCategory
+value
+effectiveDate
}
Employee "1" -- "0..*" Contract : "has"
Employee "1" -- "0..*" Document : "owns"
Employee "1" -- "0..*" PersonnelTypes : "manages"
Contract "1" -- "0..*" Document : "references"
```

**Updated** Personnel type management is now integrated directly into the employee entity and core service, eliminating the need for separate type-specific endpoints.

**Diagram sources**
- [backend/database/migrations/016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [backend/database/migrations/017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [backend/database/migrations/018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [backend/database/migrations/019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [backend/database/migrations/020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)

**Section sources**
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)
- [backend/database/migrations/016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [backend/database/migrations/017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [backend/database/migrations/018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [backend/database/migrations/019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [backend/database/migrations/020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)

### Payroll Processing API
Provides salary structure configuration, tax calculations, pay slip generation, payment runs, and payroll reports.

Key concepts:
- Salary components (base, allowances, deductions)
- Tax rules and brackets
- Payroll run execution and batch processing
- Reports summarizing totals, taxes, and net pay

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant PayrollAPI as "Payroll Controller"
participant Engine as "Payroll Engine"
participant DB as "Database"
Admin->>PayrollAPI : "Configure salary structure"
PayrollAPI->>DB : "Persist structure"
Admin->>PayrollAPI : "Run payroll for period"
PayrollAPI->>Engine : "Compute salaries and taxes"
Engine->>DB : "Read employee data and rules"
DB-->>Engine : "Data"
Engine-->>PayrollAPI : "Payroll results"
PayrollAPI->>DB : "Store pay slips and payments"
PayrollAPI-->>Admin : "Report summary"
```

**Diagram sources**
- [backend/src/modules/paie/index.ts](file://backend/src/modules/paie/index.ts)
- [backend/database/migrations/029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)

**Section sources**
- [backend/src/modules/paie/index.ts](file://backend/src/modules/paie/index.ts)
- [backend/database/migrations/029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)

### Attendance and Leave Management API
Supports time tracking, leave requests, approvals, absence monitoring, and attendance reports.

Key concepts:
- Time entries for daily attendance
- Leave request lifecycle (submitted, approved, rejected)
- Absence aggregation and alerts
- Attendance summaries by period and employee

```mermaid
flowchart TD
AStart(["Start Day"]) --> ClockIn["Clock In"]
ClockIn --> WorkEntries["Work Entries"]
WorkEntries --> ClockOut["Clock Out"]
ClockOut --> ComputeHours["Compute Hours"]
ComputeHours --> LeaveRequest{"Leave Needed?"}
LeaveRequest --> |Yes| SubmitLeave["Submit Leave Request"]
SubmitLeave --> ApproveLeave{"Approval Decision"}
ApproveLeave --> |Approved| RecordAbsence["Record Absence"]
ApproveLeave --> |Rejected| ResumeWork["Resume Work"]
LeaveRequest --> |No| EndDay(["End Day"])
RecordAbsence --> EndDay
ResumeWork --> EndDay
```

**Diagram sources**
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)
- [backend/database/migrations/031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)

**Section sources**
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)
- [backend/database/migrations/031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)

### Performance Evaluation API
Manages metrics, review cycles, career progression, and training management.

Key concepts:
- Metrics definitions and scoring
- Review cycle orchestration
- Career progression records tied to employee profiles
- Training logs and certifications

```mermaid
classDiagram
class Metric {
+id
+name
+weight
+scoringRules
}
class ReviewCycle {
+id
+period
+status
}
class Evaluation {
+id
+employeeId
+cycleId
+scores
}
class CareerProgression {
+id
+employeeId
+level
+date
}
class Training {
+id
+employeeId
+title
+completionDate
}
ReviewCycle "1" -- "0..*" Evaluation : "contains"
Employee "1" -- "0..*" Evaluation : "has"
Employee "1" -- "0..*" CareerProgression : "tracks"
Employee "1" -- "0..*" Training : "completes"
```

**Diagram sources**
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)
- [backend/database/migrations/031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)

**Section sources**
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)
- [backend/database/migrations/031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)

## Dependency Analysis
HR modules depend on shared constants and database schemas defined in migrations. The following diagram shows module-to-migration dependencies and shared constants usage. Personnel type functionality is now consolidated within the core personnel service.

```mermaid
graph TB
R["Recruitment Module"] --> MR["045-module-recrutement.sql"]
P["Personnel Module (Consolidated)"] --> MP1["016-module-personnel-rh-phase1.sql"]
P --> MP2["017-module-personnel-rh-phase2.sql"]
P --> MP3["018-module-personnel-rh-phase3.sql"]
P --> MP4["019-module-personnel-rh-phase4.sql"]
P --> MP5["020-module-personnel-rh-phase5.sql"]
PA["Payroll Module"] --> MPA["029-paie-etendue.sql"]
S["Tracking Module"] --> MS["031-suivi-personnel.sql"]
C["Shared Constants"] --> P
C --> S
```

**Updated** Personnel type management is now part of the consolidated personnel service rather than a separate module.

**Diagram sources**
- [backend/src/modules/recrutement/index.ts](file://backend/src/modules/recrutement/index.ts)
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)
- [backend/src/modules/paie/index.ts](file://backend/src/modules/paie/index.ts)
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)
- [backend/database/migrations/045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [backend/database/migrations/016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [backend/database/migrations/017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [backend/database/migrations/018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [backend/database/migrations/019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [backend/database/migrations/020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [backend/database/migrations/029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [backend/database/migrations/031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)
- [backend/src/shared/constants/personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)

**Section sources**
- [backend/src/modules/recrutement/index.ts](file://backend/src/modules/recrutement/index.ts)
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)
- [backend/src/modules/paie/index.ts](file://backend/src/modules/paie/index.ts)
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)
- [backend/src/shared/constants/personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
- [backend/database/migrations/045-module-recrutement.sql](file://backend/database/migrations/045-module-recrutement.sql)
- [backend/database/migrations/016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [backend/database/migrations/017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [backend/database/migrations/018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [backend/database/migrations/019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [backend/database/migrations/020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [backend/database/migrations/029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [backend/database/migrations/031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)

## Performance Considerations
- Use pagination and filtering on list endpoints to reduce payload sizes
- Batch payroll computations to avoid long-running transactions
- Index frequently queried fields (e.g., employeeId, date ranges) as defined in migrations
- Cache static configurations like salary structures and tax rules when appropriate
- Monitor database query performance and adjust indexes based on workload patterns
- **Consolidated personnel type operations reduce API call overhead and improve response times**

## Troubleshooting Guide
Common issues and resolutions:
- Authentication failures: Ensure tokens are valid and include required scopes; verify multi-tenant context headers
- Permission errors: Confirm user roles have necessary permissions for HR endpoints
- Data integrity errors: Validate foreign key constraints between recruitment, personnel, and payroll entities
- Payroll computation errors: Check salary structure and tax rule configurations; validate input data completeness
- Attendance anomalies: Verify clock-in/out timestamps and timezone settings; reconcile leave approvals with absence records
- **Personnel type errors**: Since type management is now consolidated, ensure all type operations use the main personnel endpoints rather than deprecated type-specific routes

**Updated** Personnel type-related issues should now be resolved through the consolidated personnel service endpoints.

**Section sources**
- [backend/src/shared/constants/personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)

## Conclusion
The eLISAschool HR API provides a robust set of endpoints to manage recruitment, personnel, payroll, attendance, leave, and performance evaluation. The recent consolidation of personnel type management into the core service improves efficiency and simplifies the API surface. By leveraging the documented workflows, data models, and relationships, integrators can build reliable HR processes aligned with institutional needs.

**Updated** The consolidation of personnel type services eliminates redundant endpoints and provides a more streamlined approach to managing employee classifications and attributes.

## Appendices

### Example HR Workflows
- Recruitment to Onboarding: Create candidate → submit application → schedule interview → issue offer → accept offer → onboard employee
- **Consolidated Personnel Management**: Create employee → set basic info → assign types → manage contracts → handle documents
- Payroll Run: Configure salary structure → compute taxes → generate pay slips → execute payments → produce report
- Attendance and Leave: Clock in/out → submit leave request → approve/reject → record absence → generate attendance report
- Performance Review: Define metrics → initiate review cycle → evaluate scores → update career progression → log training

**Updated** Personnel management workflow now includes consolidated type assignment within the main employee management process.