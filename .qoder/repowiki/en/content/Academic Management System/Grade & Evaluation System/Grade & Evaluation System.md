# Grade & Evaluation System

<cite>
**Referenced Files in This Document**
- [061-creer-table-bulletins-matieres.sql](file://backend/database/migrations/061-creer-table-bulletins-matieres.sql)
- [062-creer-table-evaluations-competences.sql](file://backend/database/migrations/062-creer-table-evaluations-competences.sql)
- [073-competence-unique-composite.sql](file://backend/database/migrations/073-competence-unique-composite.sql)
- [084-cleanup-classe-id-notes.sql](file://backend/database/migrations/084-cleanup-classe-id-notes.sql)
- [085-periode-etablissement-id.sql](file://backend/database/migrations/085-periode-etablissement-id.sql)
- [086-affectation-matiere-etablissement-id.sql](file://backend/database/migrations/086-affectation-matiere-etablissement-id.sql)
- [087-affectation-matiere-verifications.sql](file://backend/database/migrations/087-affectation-matiere-verifications.sql)
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [090-correction-migration-088-camelcase.sql](file://backend/database/migrations/090-correction-migration-088-camelcase.sql)
- [091-peuplement-architecture-academique.sql](file://backend/database/migrations/091-peuplement-architecture-academique.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)
- [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)
- [bulletins.service.ts](file://backend/src/modules/bulletins/services/bulletins.service.ts)
- [bulletins.controller.ts](file://backend/src/modules/bulletins/controllers/bulletins.controller.ts)
- [bulletins.module.ts](file://backend/src/modules/bulletins/bulletins.module.ts)
- [competences.service.ts](file://backend/src/modules/competences/services/competences.service.ts)
- [competences.controller.ts](file://backend/src/modules/competences/controllers/competences.controller.ts)
- [competences.module.ts](file://backend/src/modules/competences/competences.module.ts)
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)
- [notes.controller.ts](file://backend/src/modules/notes/controllers/notes.controller.ts)
- [notes.module.ts](file://backend/src/modules/notes/notes.module.ts)
- [examens-nationaux.service.ts](file://backend/src/modules/examens-nationaux/services/examens-nationaux.service.ts)
- [examens-nationaux.controller.ts](file://backend/src/modules/examens-nationaux/controllers/examens-nationaux.controller.ts)
- [examens-nationaux.module.ts](file://backend/src/modules/examens-nationaux/examens-nationaux.module.ts)
- [scoring.service.ts](file://backend/src/modules/scoring/services/scoring.service.ts)
- [scoring.controller.ts](file://backend/src/modules/scoring/controllers/scoring.controller.ts)
- [scoring.module.ts](file://backend/src/modules/scoring/scoring.module.ts)
- [perodes.service.ts](file://backend/src/modules/periodes/services/periodes.service.ts)
- [perodes.controller.ts](file://backend/src/modules/periodes/controllers/periodes.controller.ts)
- [perodes.module.ts](file://backend/src/modules/periodes/periodes.module.ts)
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
This document explains eLISAschool’s Grade & Evaluation System with a focus on competency-based assessment, continuous and periodic evaluation, national examination integration, grade calculation algorithms, academic standing determination, competency tracking, report card generation (including customizable templates and multi-language support), and exam management for internal assessments and national coordination. It provides practical examples of workflows, rules, and customization patterns to help educators and administrators implement consistent and transparent grading practices.

## Project Structure
The system is organized into backend modules that encapsulate domain responsibilities:
- Notes: captures continuous and periodic grades per student, subject, period, and class.
- Competences: defines skills, descriptors, levels, and tracks student progress against competencies.
- Bulletins: generates report cards from evaluated data, supports templates and localization.
- Examens Nationaux: manages national exams, schedules, results, and integration with school records.
- Scoring: centralizes grade computation, weighting, scales, and academic standing logic.
- Periodes: configures academic periods, term boundaries, and template scoping.

```mermaid
graph TB
subgraph "Academic Core"
PER["Periodes"]
MAT["Matieres"]
CLS["Classes"]
ELC["Eleves"]
end
subgraph "Assessment"
NOTES["Notes Module"]
COMP["Competences Module"]
EXN["Examens Nationaux Module"]
end
subgraph "Computation"
SCORE["Scoring Service"]
end
subgraph "Reporting"
BULL["Bulletins Module"]
end
PER --> NOTES
MAT --> NOTES
CLS --> NOTES
ELC --> NOTES
COMP --> NOTES
EXN --> NOTES
NOTES --> SCORE
COMP --> SCORE
SCORE --> BULL
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

## Core Components
- Notes Module: Stores and manages all types of evaluations (continuous, periodic, remediation). Supports coefficients, weights, and validation constraints.
- Competences Module: Defines skill taxonomies, proficiency levels, and evidence-based assessment entries linked to students and subjects.
- Scoring Service: Implements weighted aggregation, scale mapping, and academic standing determination based on configured policies.
- Bulletins Module: Produces report cards using configurable templates and localized content; aggregates scores and competencies.
- Examens Nationaux Module: Coordinates national exam scheduling, result ingestion, and alignment with school reporting.
- Periodes Module: Manages academic calendar, period definitions, and template scoping for reports.

**Section sources**
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)
- [competences.service.ts](file://backend/src/modules/competences/services/competences.service.ts)
- [scoring.service.ts](file://backend/src/modules/scoring/services/scoring.service.ts)
- [bulletins.service.ts](file://backend/src/modules/bulletins/services/bulletins.service.ts)
- [examens-nationaux.service.ts](file://backend/src/modules/examens-nationaux/services/examens-nationaux.service.ts)
- [perodes.service.ts](file://backend/src/modules/periodes/services/periodes.service.ts)

## Architecture Overview
The evaluation architecture follows a layered approach:
- Data Layer: Migrations define tables for bulletins, competencies, notes, and related entities.
- Service Layer: Business logic for scoring, validation, and report generation.
- Controller Layer: REST endpoints for CRUD and operations like compute, publish, and export.
- Template Engine: Configurable report templates with multi-language support.

```mermaid
sequenceDiagram
participant Teacher as "Teacher"
participant API as "Notes Controller"
participant Svc as "Notes Service"
participant DB as "Database"
participant Score as "Scoring Service"
participant Bull as "Bulletins Service"
Teacher->>API : Submit evaluation entry
API->>Svc : Validate and persist
Svc->>DB : Insert/update note
Note over Svc,DB : Continuous or periodic evaluation recorded
Teacher->>API : Request computed score
API->>Score : Compute weighted average + scale
Score-->>API : Finalized score and standing
API-->>Teacher : Return computed result
Admin->>Bull : Generate report card
Bull->>DB : Aggregate notes and competencies
Bull-->>Admin : Rendered bulletin (localized)
```

**Diagram sources**
- [notes.controller.ts](file://backend/src/modules/notes/controllers/notes.controller.ts)
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)
- [scoring.service.ts](file://backend/src/modules/scoring/services/scoring.service.ts)
- [bulletins.service.ts](file://backend/src/modules/bulletins/services/bulletins.service.ts)

## Detailed Component Analysis

### Evaluation Framework: Continuous, Periodic, and National Exams
- Continuous Assessment: Frequent formative evaluations captured via the Notes module, supporting multiple attempts and feedback.
- Periodic Exams: Summative evaluations aligned with academic periods defined by the Periodes module.
- National Examination Integration: The Examens Nationaux module coordinates external exam schedules and results, merging them into school records and reports.

```mermaid
flowchart TD
Start(["Evaluation Entry"]) --> Type{"Type?"}
Type --> |Continuous| Cont["Record continuous evaluation<br/>with coefficient and weight"]
Type --> |Periodic| Per["Record periodic exam<br/>linked to period and class"]
Type --> |National| Nat["Ingest national exam result<br/>and align with curriculum"]
Cont --> Validate["Validate inputs and constraints"]
Per --> Validate
Nat --> Validate
Validate --> Persist["Persist to database"]
Persist --> Compute["Trigger scoring computation"]
Compute --> Standing["Determine academic standing"]
Standing --> End(["Ready for reporting"])
```

**Section sources**
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)
- [perodes.service.ts](file://backend/src/modules/periodes/services/periodes.service.ts)
- [examens-nationaux.service.ts](file://backend/src/modules/examens-nationaux/services/examens-nationaux.service.ts)

### Grade Calculation Algorithms: Weighting, Scales, and Academic Standing
- Weighting System: Each evaluation has a coefficient and weight; final subject score is a weighted average across valid entries within the selected period(s).
- Grading Scale: Scores are mapped to letter grades or descriptive levels according to institution policy.
- Academic Standing: Determined by aggregated subject scores and institutional thresholds (e.g., pass/fail, honors).

```mermaid
flowchart TD
A["Collect eligible evaluations"] --> B["Apply coefficients and weights"]
B --> C["Compute weighted average"]
C --> D["Map to grading scale"]
D --> E["Aggregate across subjects"]
E --> F["Apply standing rules"]
F --> G["Output final grade and standing"]
```

**Section sources**
- [scoring.service.ts](file://backend/src/modules/scoring/services/scoring.service.ts)
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)

### Competency Tracking: Skill-Based Evaluation and Progress Monitoring
- Competency Model: Skills, descriptors, and proficiency levels are defined centrally and linked to subjects and classes.
- Evidence Collection: Teachers record competency achievements tied to specific evaluations and activities.
- Progress Monitoring: Aggregated competency data informs individualized learning pathways and interventions.

```mermaid
classDiagram
class Competence {
+id
+name
+level
+descriptor
}
class StudentCompetence {
+studentId
+competenceId
+achievementLevel
+evidence
}
class Evaluation {
+id
+type
+score
+coefficient
}
Competence <.. StudentCompetence : "tracked by"
Evaluation <.. StudentCompetence : "informs"
```

**Diagram sources**
- [competences.service.ts](file://backend/src/modules/competences/services/competences.service.ts)
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)

**Section sources**
- [competences.service.ts](file://backend/src/modules/competences/services/competences.service.ts)
- [competences.controller.ts](file://backend/src/modules/competences/controllers/competences.controller.ts)
- [competences.module.ts](file://backend/src/modules/competences/competences.module.ts)

### Report Card Generation: Customizable Templates and Multi-Language Support
- Template Configuration: Reports are generated using configurable templates scoped to periods and institutions.
- Localization: Templates support multiple languages for labels, comments, and descriptions.
- Content Aggregation: Bulletins combine numeric grades, competency summaries, and teacher remarks.

```mermaid
sequenceDiagram
participant Admin as "Administrator"
participant BullCtrl as "Bulletins Controller"
participant BullSvc as "Bulletins Service"
participant DB as "Database"
participant Temp as "Template Engine"
Admin->>BullCtrl : Generate bulletin (period, language)
BullCtrl->>BullSvc : Prepare data and select template
BullSvc->>DB : Fetch grades, competencies, remarks
BullSvc->>Temp : Render template with localized content
Temp-->>BullSvc : Rendered report
BullSvc-->>Admin : Download/view bulletin
```

**Diagram sources**
- [bulletins.controller.ts](file://backend/src/modules/bulletins/controllers/bulletins.controller.ts)
- [bulletins.service.ts](file://backend/src/modules/bulletins/services/bulletins.service.ts)

**Section sources**
- [bulletins.service.ts](file://backend/src/modules/bulletins/services/bulletins.service.ts)
- [bulletins.controller.ts](file://backend/src/modules/bulletins/controllers/bulletins.controller.ts)
- [bulletins.module.ts](file://backend/src/modules/bulletins/bulletins.module.ts)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)

### Exam Management: Internal Assessments and National Coordination
- Internal Assessments: Managed through the Notes module with clear linkage to periods and classes.
- National Exams: The Examens Nationaux module handles scheduling, result ingestion, and alignment with curriculum standards.
- Integration Points: Results flow into scoring and reporting pipelines, ensuring consistency across internal and external evaluations.

```mermaid
flowchart TD
Plan["Plan internal and national exams"] --> Schedule["Set dates and scopes"]
Schedule --> Ingest["Ingest results (internal/national)"]
Ingest --> Validate["Validate and reconcile"]
Validate --> Publish["Publish to reports and dashboards"]
```

**Section sources**
- [examens-nationaux.service.ts](file://backend/src/modules/examens-nationaux/services/examens-nationaux.service.ts)
- [examens-nationaux.controller.ts](file://backend/src/modules/examens-nationaux/controllers/examens-nationaux.controller.ts)
- [examens-nationaux.module.ts](file://backend/src/modules/examens-nationaux/examens-nationaux.module.ts)

### Practical Examples: Workflows, Rules, and Customization Patterns
- Grade Entry Workflow:
  - Select class, subject, and period.
  - Enter evaluation type (continuous/periodic), score, coefficient, and optional remarks.
  - Save and validate; system computes preliminary score.
- Calculation Rules:
  - Apply coefficients and weights per evaluation.
  - Map raw averages to institutional grading scale.
  - Determine academic standing based on aggregated subject performance.
- Report Customization:
  - Choose template variant per period and institution.
  - Configure localized labels and comments.
  - Preview and export PDF or digital formats.

[No sources needed since this section provides general guidance]

## Dependency Analysis
Module interactions and dependencies:
- Notes depends on Matieres, Classes, Eleves, and Periodes for context and scoping.
- Competences integrates with Notes to link skill achievements to evaluations.
- Scoring consumes Notes and Competences outputs to compute final grades and standing.
- Bulletins aggregates Scoring outputs and renders localized templates.
- Examens Nationaux feeds external results into Notes and Scoring.

```mermaid
graph TB
NOTES["Notes Module"] --> SCORE["Scoring Service"]
COMP["Competences Module"] --> SCORE
SCORE --> BULL["Bulletins Module"]
EXN["Examens Nationaux Module"] --> NOTES
PER["Periodes Module"] --> NOTES
```

**Diagram sources**
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)
- [competences.service.ts](file://backend/src/modules/competences/services/competences.service.ts)
- [scoring.service.ts](file://backend/src/modules/scoring/services/scoring.service.ts)
- [bulletins.service.ts](file://backend/src/modules/bulletins/services/bulletins.service.ts)
- [examens-nationaux.service.ts](file://backend/src/modules/examens-nationaux/services/examens-nationaux.service.ts)
- [perodes.service.ts](file://backend/src/modules/periodes/services/periodes.service.ts)

**Section sources**
- [notes.module.ts](file://backend/src/modules/notes/notes.module.ts)
- [competences.module.ts](file://backend/src/modules/competences/competences.module.ts)
- [scoring.module.ts](file://backend/src/modules/scoring/scoring.module.ts)
- [bulletins.module.ts](file://backend/src/modules/bulletins/bulletins.module.ts)
- [examens-nationaux.module.ts](file://backend/src/modules/examens-nationaux/examens-nationaux.module.ts)
- [perodes.module.ts](file://backend/src/modules/periodes/periodes.module.ts)

## Performance Considerations
- Indexing: Ensure indexes on frequently queried columns such as studentId, matiereId, periodeId, and classeId to optimize retrieval during report generation.
- Batch Processing: Use batch computations for large cohorts when generating bulletins to reduce database load.
- Caching: Cache computed scores and template renderings where appropriate to improve responsiveness.
- Validation Efficiency: Perform lightweight client-side validations before server submission to minimize round-trips.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Missing Coefficients: Verify that each evaluation has a valid coefficient; default values should be enforced at the service layer.
- Period Misalignment: Ensure evaluations are scoped to the correct period; use period boundaries to filter eligible entries.
- Template Rendering Errors: Confirm template availability and localization keys; validate placeholders match data schema.
- National Exam Integration Failures: Check result ingestion mappings and reconciliation rules; log discrepancies for manual review.

**Section sources**
- [notes.service.ts](file://backend/src/modules/notes/services/notes.service.ts)
- [bulletins.service.ts](file://backend/src/modules/bulletins/services/bulletins.service.ts)
- [examens-nationaux.service.ts](file://backend/src/modules/examens-nationaux/services/examens-nationaux.service.ts)

## Conclusion
eLISAschool’s Grade & Evaluation System provides a robust framework for competency-based assessment, comprehensive grading calculations, and flexible report generation. By integrating continuous and periodic evaluations with national examinations, it ensures transparency and alignment with institutional policies. The modular architecture supports customization, localization, and scalability, enabling schools to tailor assessment practices to their needs while maintaining consistency and reliability.

## Appendices

### Database Schema Highlights
Key migrations underpinning the evaluation system:
- Bulletins and Subjects:
  - [061-creer-table-bulletins-matieres.sql](file://backend/database/migrations/061-creer-table-bulletins-matieres.sql)
- Competencies and Evaluations:
  - [062-creer-table-evaluations-competences.sql](file://backend/database/migrations/062-creer-table-evaluations-competences.sql)
  - [073-competence-unique-composite.sql](file://backend/database/migrations/073-competence-unique-composite.sql)
- Notes Cleanup and Contextual Integrity:
  - [084-cleanup-classe-id-notes.sql](file://backend/database/migrations/084-cleanup-classe-id-notes.sql)
  - [085-periode-etablissement-id.sql](file://backend/database/migrations/085-periode-etablissement-id.sql)
  - [086-affectation-matiere-etablissement-id.sql](file://backend/database/migrations/086-affectation-matiere-etablissement-id.sql)
  - [087-affectation-matiere-verifications.sql](file://backend/database/migrations/087-affectation-matiere-verifications.sql)
- Academic Architecture Refactoring:
  - [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
  - [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
  - [090-correction-migration-088-camelcase.sql](file://backend/database/migrations/090-correction-migration-088-camelcase.sql)
  - [091-peuplement-architecture-academique.sql](file://backend/database/migrations/091-peuplement-architecture-academique.sql)
  - [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)
- Periods and Templates:
  - [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
  - [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
  - [105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)
  - [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)

**Section sources**
- [061-creer-table-bulletins-matieres.sql](file://backend/database/migrations/061-creer-table-bulletins-matieres.sql)
- [062-creer-table-evaluations-competences.sql](file://backend/database/migrations/062-creer-table-evaluations-competences.sql)
- [073-competence-unique-composite.sql](file://backend/database/migrations/073-competence-unique-composite.sql)
- [084-cleanup-classe-id-notes.sql](file://backend/database/migrations/084-cleanup-classe-id-notes.sql)
- [085-periode-etablissement-id.sql](file://backend/database/migrations/085-periode-etablissement-id.sql)
- [086-affectation-matiere-etablissement-id.sql](file://backend/database/migrations/086-affectation-matiere-etablissement-id.sql)
- [087-affectation-matiere-verifications.sql](file://backend/database/migrations/087-affectation-matiere-verifications.sql)
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [090-correction-migration-088-camelcase.sql](file://backend/database/migrations/090-correction-migration-088-camelcase.sql)
- [091-peuplement-architecture-academique.sql](file://backend/database/migrations/091-peuplement-architecture-academique.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [105-migration-templates-v5.sql](file://backend/database/migrations/105-migration-templates-v5.sql)
- [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)