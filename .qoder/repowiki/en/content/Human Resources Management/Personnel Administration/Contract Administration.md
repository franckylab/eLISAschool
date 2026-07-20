# Contract Administration

<cite>
**Referenced Files in This Document**
- [046-types-contrat-personnalises.sql](file://backend/database/migrations/046-types-contrat-personnalises.sql)
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [index.ts](file://backend/src/modules/index.ts)
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
10. [Appendices](#appendices)

## Introduction
This document describes the contract administration sub-feature for personnel management within the system. It explains supported contract types, employment terms, salary structures, and benefit packages. It also documents the end-to-end lifecycle of contracts (creation, renewal, modification, termination), integration with payroll, compliance requirements, templates, version control, and automated reminders for renewals or expirations. The content is grounded in the repository’s database migrations and module structure to ensure accuracy and traceability.

## Project Structure
Contract administration spans multiple modules:
- Personnel (HR) module: defines core entities and relationships for staff and contracts.
- Payroll (paie) module: extends compensation and payment scheduling.
- Shared constants: enumerations and configuration used across modules.
- Routes and module index: wiring of endpoints and feature activation.

```mermaid
graph TB
subgraph "Personnel Module"
P1["Migr: 016-module-personnel-rh-phase1.sql"]
P2["Migr: 017-module-personnel-rh-phase2.sql"]
P3["Migr: 018-module-personnel-rh-phase3.sql"]
P4["Migr: 019-module-personnel-rh-phase4.sql"]
P5["Migr: 020-module-personnel-rh-phase5.sql"]
Cst["Shared Constants<br/>personnel.constants.ts"]
end
subgraph "Payroll Module"
PY["Migr: 029-paie-etendue.sql"]
end
subgraph "App Wiring"
R["Routes<br/>route-registry.ts"]
I["Module Index<br/>modules/index.ts"]
end
P1 --> P2 --> P3 --> P4 --> P5
P5 --> PY
Cst --> P5
R --> I
R --> P5
R --> PY
```

**Diagram sources**
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [index.ts](file://backend/src/modules/index.ts)

**Section sources**
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019/module-personnel-rh-phase4.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [index.ts](file://backend/src/modules/index.ts)

## Core Components
- Contract Types and Customization
  - A dedicated migration introduces customizable contract types, enabling support for permanent, temporary, and part-time classifications.
  - See: [046-types-contrat-personnalises.sql](file://backend/database/migrations/046-types-contrat-personnalises.sql)

- Personnel Data Model Evolution
  - Phased migrations build out HR tables and relationships required for contracts, roles, and assignments.
  - See: [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql), [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql), [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql), [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql), [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)

- Payroll Integration
  - Extended payroll schema supports compensation elements and payment schedules linked to contracts.
  - See: [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)

- Shared Enumerations and Constants
  - Centralized constants define shared enums and configuration values consumed by personnel and related modules.
  - See: [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)

- Application Wiring
  - Route registry and module index integrate features into the application runtime.
  - See: [route-registry.ts](file://backend/src/routes/route-registry.ts), [index.ts](file://backend/src/modules/index.ts)

**Section sources**
- [046-types-contrat-personnalises.sql](file://backend/database/migrations/046-types-contrat-personnalises.sql)
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [index.ts](file://backend/src/modules/index.ts)

## Architecture Overview
The contract administration architecture connects HR data models with payroll and routing layers. Contracts are defined using customizable types and stored in the personnel schema. Payroll references contracts to compute compensation and schedule payments. Routes expose APIs that orchestrate these operations.

```mermaid
classDiagram
class ContractType {
+id
+name
+description
+is_active
}
class Contract {
+id
+employee_id
+contract_type_id
+start_date
+end_date
+status
+metadata
}
class Employee {
+id
+personal_info
+role_id
}
class PayrollSchedule {
+id
+contract_id
+period_start
+period_end
+amount
+currency
+status
}
ContractType --> Contract : "one-to-many"
Employee --> Contract : "one-to-many"
Contract --> PayrollSchedule : "one-to-many"
```

**Diagram sources**
- [046-types-contrat-personnalises.sql](file://backend/database/migrations/046-types-contrat-personnalises.sql)
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)

## Detailed Component Analysis

### Contract Types and Employment Terms
- Supported types include permanent, temporary, and part-time, enabled via a customization layer.
- Employment terms such as start/end dates, status, and metadata are modeled to capture full lifecycle context.
- Refer to the contract type customization migration and personnel phase migrations for entity definitions.

**Section sources**
- [046-types-contrat-personnalises.sql](file://backend/database/migrations/046-types-contrat-personnalises.sql)
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)

### Salary Structures and Benefit Packages
- Compensation and benefits are integrated through extended payroll schemas, linking pay components to contracts.
- Payment schedules reference contracts to align periodic payouts with employment terms.

**Section sources**
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)

### Contract Lifecycle Management
Lifecycle stages: creation, approval, active period, renewal, modification, and termination.

```mermaid
flowchart TD
Start(["Create Contract"]) --> Draft["Draft Contract"]
Draft --> Review["Legal/HR Review"]
Review --> Approved{"Approved?"}
Approved --> |No| Revise["Revise and Resubmit"]
Revise --> Review
Approved --> Activate["Activate Contract"]
Activate --> Monitor["Monitor Expiration/Renewal"]
Monitor --> Renew{"Renewal Needed?"}
Renew --> |Yes| Modify["Modify Terms"]
Modify --> ApproveMod["Approve Modification"]
ApproveMod --> Extend["Extend Period"]
Extend --> Monitor
Renew --> |No| Continue["Continue Active"]
Continue --> Terminate{"Termination Trigger?"}
Terminate --> |Yes| EndContract["Terminate Contract"]
Terminate --> |No| Continue
EndContract --> Close(["Close Lifecycle"])
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

### Generating Contracts and Attaching Legal Documents
- Contract generation uses template-driven workflows to produce standardized documents.
- Legal attachments are associated with contracts for auditability and compliance.
- Templates and attachment handling are typically implemented alongside the personnel and document storage layers.

[No sources needed since this section provides general guidance]

### Setting Up Payment Schedules
- Payment schedules are created per contract, aligned with periods and amounts.
- Status tracking ensures accurate payroll processing and reconciliation.

**Section sources**
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)

### Managing Contract Approvals
- Approval workflows validate terms before activation.
- Audit trails record changes and approvals for compliance.

[No sources needed since this section provides general guidance]

### Integration with Payroll System
- Contracts link to payroll schedules and compensation entries.
- Payroll computations use contract metadata (type, duration, benefits) to calculate net pay and deductions.

**Section sources**
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)

### Compliance Requirements
- Retain legal documents and approvals.
- Enforce data integrity constraints on critical fields (dates, statuses).
- Ensure multi-tenant isolation where applicable.

[No sources needed since this section provides general guidance]

### Contract Templates and Version Control
- Template management enables consistent contract formats.
- Versioning tracks revisions and maintains historical records.

[No sources needed since this section provides general guidance]

### Automated Reminders for Renewals or Expirations
- Scheduled tasks monitor upcoming expirations and trigger notifications.
- Notifications can be delivered via internal messaging or external channels.

[No sources needed since this section provides general guidance]

## Dependency Analysis
Contract administration depends on:
- Personnel module migrations for core entities.
- Payroll extension for compensation and schedules.
- Shared constants for enums and configuration.
- Routes and module index for API exposure and feature activation.

```mermaid
graph TB
Const["personnel.constants.ts"] --> Pers["Personnel Migrations (016-020)"]
Pers --> Pay["Payroll Extension (029)"]
Routes["route-registry.ts"] --> Pers
Routes --> Pay
ModIdx["modules/index.ts"] --> Routes
```

**Diagram sources**
- [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [index.ts](file://backend/src/modules/index.ts)

**Section sources**
- [personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
- [016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [index.ts](file://backend/src/modules/index.ts)

## Performance Considerations
- Indexes and constraints on foreign keys and date ranges improve query performance for contract lookups and payroll calculations.
- Batch operations for bulk contract updates should leverage transaction boundaries to reduce overhead.
- Avoid N+1 queries when rendering contract lists; prefer joins or preloading related entities.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Missing contract type options: verify the custom contract types migration has been applied.
- Payroll mismatch: confirm payroll extension migration and contract-payroll linkage.
- Routing errors: check route registration and module index inclusion.
- Data integrity failures: review constraints on dates and statuses in personnel and payroll schemas.

**Section sources**
- [046-types-contrat-personnalises.sql](file://backend/database/migrations/046-types-contrat-personnalises.sql)
- [029-paie-etendue.sql](file://backend/database/migrations/029-paie-etendue.sql)
- [route-registry.ts](file://backend/src/routes/route-registry.ts)
- [index.ts](file://backend/src/modules/index.ts)

## Conclusion
Contract administration integrates personnel data models with payroll capabilities, supporting flexible contract types, structured employment terms, and robust lifecycle management. The phased migrations and extensions provide a solid foundation for compliance, automation, and operational efficiency.

## Appendices

### Concrete Examples and Workflows
- Generate a new contract:
  - Create draft with employee, contract type, and term dates.
  - Attach legal documents and submit for approval.
  - Upon approval, activate and link to payroll schedule.
- Renew an existing contract:
  - Modify terms and dates, re-approve, and extend the active period.
- Terminate a contract:
  - Record termination reason and effective date, finalize payroll adjustments.

[No sources needed since this section provides general guidance]