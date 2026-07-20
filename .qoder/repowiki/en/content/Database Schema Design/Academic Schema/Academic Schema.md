# Academic Schema

<cite>
**Referenced Files in This Document**
- [043-structure-academique-v4.sql](file://backend/database/migrations/043-structure-academique-v4.sql)
- [053-structure-academique-complete.sql](file://backend/database/migrations/053-structure-academique-complete.sql)
- [054-refonte-structure-academique-v2.sql](file://backend/database/migrations/054-refonte-structure-academique-v2.sql)
- [058-multi-tenant-structure-academique.sql](file://backend/database/migrations/058-multi-tenant-structure-academique.sql)
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [091-peuplement-architecture-academique.sql](file://backend/database/migrations/091-peuplement-architecture-academique.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [101-normalisation-annee-scolaire-cloture.sql](file://backend/database/migrations/101-normalisation-annee-scolaire-cloture.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [059-ajouter-affectation-matiere-sous-systeme.sql](file://backend/database/migrations/059-ajouter-affectation-matiere-sous-systeme.sql)
- [060-ajouter-affectation-matiere-coefficient.sql](file://backend/database/migrations/060-ajouter-affectation-matiere-coefficient.sql)
- [061-creer-table-bulletins-matieres.sql](file://backend/database/migrations/061-creer-table-bulletins-matieres.sql)
- [062-creer-table-evaluations-competences.sql](file://backend/database/migrations/062-creer-table-evaluations-competences.sql)
- [063-creer-module-emploi-du-temps.sql](file://backend/database/migrations/063-creer-module-emploi-du-temps.sql)
- [070-module-salles.sql](file://backend/database/migrations/070-module-salles.sql)
- [072-scoping-cycles-niveaux.sql](file://backend/database/migrations/072-scoping-cycles-niveaux.sql)
- [073-competence-unique-composite.sql](file://backend/database/migrations/073-competence-unique-composite.sql)
- [074-matiere-niveau-unique-composite.sql](file://backend/database/migrations/074-matiere-niveau-unique-composite.sql)
- [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)
- [eleves/entities/Eleve.entity.ts](file://backend/src/modules/eleves/entities/Eleve.entity.ts)
- [responsables-eleves/entities/ResponsableEleve.entity.ts](file://backend/src/modules/responsables-eleves/entities/ResponsableEleve.entity.ts)
- [cycles/entities/Cycle.entity.ts](file://backend/src/modules/cycles/entities/Cycle.entity.ts)
- [niveaux/entities/Niveau.entity.ts](file://backend/src/modules/niveaux/entities/Niveau.entity.ts)
- [filieres/entities/Filiere.entity.ts](file://backend/src/modules/filieres/entities/Filiere.entity.ts)
- [classes/entities/Classe.entity.ts](file://backend/src/modules/classes/entities/Classe.entity.ts)
- [matieres/entities/Matiere.entity.ts](file://backend/src/modules/matieres/entities/Matiere.entity.ts)
- [bulletins/entities/Bulletin.entity.ts](file://backend/src/modules/bulletins/entities/Bulletin.entity.ts)
- [notes/entities/Note.entity.ts](file://backend/src/modules/notes/entities/Note.entity.ts)
- [competences/entities/Competence.entity.ts](file://backend/src/modules/competences/entities/Competence.entity.ts)
- [emploi-du-temps/entities/PlanningSession.entity.ts](file://backend/src/modules/emploi-du-temps/entities/PlanningSession.entity.ts)
- [salles/entities/Salle.entity.ts](file://backend/src/modules/salles/entities/Salle.entity.ts)
- [annees-scolaires/entities/AnneeScolaire.entity.ts](file://backend/src/modules/annees-scolaires/entities/AnneeScolaire.entity.ts)
- [diplomes-eleves/entities/DiplomeEleve.entity.ts](file://backend/src/modules/diplomes-eleves/entities/DiplomeEleve.entity.ts)
- [examens-nationaux/entities/ExamenNational.entity.ts](file://backend/src/modules/examens-nationaux/entities/ExamenNational.entity.ts)
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
This document provides a comprehensive data model for eLISAschool’s academic management system. It covers the complete educational hierarchy (cycles, levels, classes), student enrollment and profile management, subject and teacher assignment, competency-based assessment with evaluation criteria and scoring, timetable scheduling with room allocation and conflict resolution, report card generation, exam management, diploma tracking, and academic calendar entities. The documentation is grounded in the repository’s database migrations and entity definitions to ensure accuracy and traceability.

## Project Structure
The academic schema spans multiple modules and migrations:
- Academic hierarchy: cycles, levels, streams, classes
- Students and guardians: enrollment, profiles, relationships
- Subjects and assignments: subjects, coefficients, teacher assignments
- Assessment and grading: evaluations, competencies, notes, bulletins
- Scheduling: sessions, rooms, conflicts
- Calendar and periods: school years, periods, templates
- Exams and diplomas: national exams, diplomas per student
- Multi-tenant scoping: establishment-level isolation

```mermaid
graph TB
subgraph "Academic Hierarchy"
Cycle["Cycle"] --> Niveau["Niveau"]
Niveau --> Filiere["Filiere"]
Filiere --> Classe["Classe"]
end
subgraph "Students & Guardians"
Eleve["Eleve"] --> Classe
Eleve --> ResponsableEleve["ResponsableEleve"]
end
subgraph "Subjects & Assignments"
Matiere["Matiere"] --> AffectationMatiere["AffectationMatiere"]
Personnel["Personnel"] --> AffectationMatiere
end
subgraph "Assessment & Grading"
Evaluation["Evaluation"] --> Note["Note"]
Competence["Competence"] --> Evaluation
Bulletin["Bulletin"] --> Note
end
subgraph "Scheduling"
PlanningSession["PlanningSession"] --> Salle["Salle"]
PlanningSession --> Classe
PlanningSession --> Matiere
end
subgraph "Calendar"
AnneeScolaire["AnneeScolaire"] --> Periode["Periode"]
end
subgraph "Exams & Diplomas"
ExamenNational["ExamenNational"] --> Eleve
DiplomeEleve["DiplomeEleve"] --> Eleve
end
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

## Core Components
- Academic hierarchy: Cycles contain Levels; Levels may have Streams; Streams organize Classes.
- Student lifecycle: Enrollment into a Class within an academic year; Guardian associations for contact and consent.
- Subject management: Subjects scoped by Level or Stream; Teacher assignments with coefficients for weighting.
- Assessment model: Competency-based evaluations linked to subjects and periods; Notes recorded per student per evaluation; Bulletins aggregate results.
- Scheduling: Sessions assigned to Classes, Subjects, Rooms, and Teachers with conflict checks.
- Calendar: School Years define Periods; Periods can be templated and configured per Level.
- Exams and Diplomas: National exams associated with students; Diplomas issued upon completion.

**Section sources**
- [053-structure-academique-complete.sql](file://backend/database/migrations/053-structure-academique-complete.sql)
- [054-refonte-structure-academique-v2.sql](file://backend/database/migrations/054-refonte-structure-academique-v2.sql)
- [058-multi-tenant-structure-academique.sql](file://backend/database/migrations/058-multi-tenant-structure-academique.sql)
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [091-peuplement-architecture-academique.sql](file://backend/database/migrations/091-peuplement-architecture-academique.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [101-normalisation-annee-scolaire-cloture.sql](file://backend/database/migrations/101-normalisation-annee-scolaire-cloture.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [059-ajouter-affectation-matiere-sous-systeme.sql](file://backend/database/migrations/059-ajouter-affectation-matiere-sous-systeme.sql)
- [060-ajouter-affectation-matiere-coefficient.sql](file://backend/database/migrations/060-ajouter-affectation-matiere-coefficient.sql)
- [061-creer-table-bulletins-matieres.sql](file://backend/database/migrations/061-creer-table-bulletins-matieres.sql)
- [062-creer-table-evaluations-competences.sql](file://backend/database/migrations/062-creer-table-evaluations-competences.sql)
- [063-creer-module-emploi-du-temps.sql](file://backend/database/migrations/063-creer-module-emploi-du-temps.sql)
- [070-module-salles.sql](file://backend/database/migrations/070-module-salles.sql)
- [072-scoping-cycles-niveaux.sql](file://backend/database/migrations/072-scoping-cycles-niveaux.sql)
- [073-competence-unique-composite.sql](file://backend/database/migrations/073-competence-unique-composite.sql)
- [074-matiere-niveau-unique-composite.sql](file://backend/database/migrations/074-matiere-niveau-unique-composite.sql)
- [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)

## Architecture Overview
The academic architecture is multi-tenant and hierarchical:
- Establishment-scoped entities ensure isolation across institutions.
- Hierarchical organization from Cycles down to Classes supports curriculum structuring.
- Assessment and scheduling are period-aware and tied to academic calendars.
- Report cards aggregate evaluations and notes per period and class.

```mermaid
classDiagram
class Cycle {
+id
+nom
+etablissement_id
}
class Niveau {
+id
+nom
+cycle_id
+etablissement_id
}
class Filiere {
+id
+nom
+niveau_id
+etablissement_id
}
class Classe {
+id
+nom
+filiere_id
+annee_scolaire_id
+etablissement_id
}
class Eleve {
+id
+nom
+prenom
+classe_id
+annee_scolaire_id
+etablissement_id
}
class ResponsableEleve {
+id
+eleve_id
+contact
+etablissement_id
}
class Matiere {
+id
+nom
+niveau_id
+etablissement_id
}
class AffectationMatiere {
+id
+matiere_id
+personnel_id
+coefficient
+etablissement_id
}
class Evaluation {
+id
+titre
+periode_id
+matiere_id
+etablissement_id
}
class Note {
+id
+evaluation_id
+eleve_id
+valeur
+commentaire
+etablissement_id
}
class Bulletin {
+id
+eleve_id
+periode_id
+annee_scolaire_id
+etablissement_id
}
class PlanningSession {
+id
+classe_id
+matiere_id
+personnel_id
+salle_id
+jour
+heure_debut
+heure_fin
+etablissement_id
}
class Salle {
+id
+nom
+capacite
+etablissement_id
}
class AnneeScolaire {
+id
+nom
+date_debut
+date_fin
+cloture
+etablissement_id
}
class Periode {
+id
+nom
+annee_scolaire_id
+debut
+fin
+etablissement_id
}
class Competence {
+id
+libelle
+niveau_id
+etablissement_id
}
class ExamenNational {
+id
+nom
+date
+annee_scolaire_id
+etablissement_id
}
class DiplomeEleve {
+id
+eleve_id
+annee_scolaire_id
+type_diplome
+date_delivrance
+etablissement_id
}
Cycle --> Niveau : "has many"
Niveau --> Filiere : "has many"
Filiere --> Classe : "has many"
Classe --> Eleve : "enrolls"
Eleve --> ResponsableEleve : "linked to"
Matiere --> AffectationMatiere : "assigned via"
Personnel --> AffectationMatiere : "teaches"
Evaluation --> Note : "records"
Eleve --> Note : "receives"
Bulletin --> Note : "aggregates"
PlanningSession --> Salle : "uses"
PlanningSession --> Classe : "scheduled for"
PlanningSession --> Matiere : "covers"
AnneeScolaire --> Periode : "defines"
Competence --> Evaluation : "assessed by"
ExamenNational --> Eleve : "taken by"
DiplomeEleve --> Eleve : "issued to"
```

**Diagram sources**
- [053-structure-academique-complete.sql](file://backend/database/migrations/053-structure-academique-complete.sql)
- [054-refonte-structure-academique-v2.sql](file://backend/database/migrations/054-refonte-structure-academique-v2.sql)
- [058-multi-tenant-structure-academique.sql](file://backend/database/migrations/058-multi-tenant-structure-academique.sql)
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [091-peuplement-architecture-academique.sql](file://backend/database/migrations/091-peuplement-architecture-academique.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [101-normalisation-annee-scolaire-cloture.sql](file://backend/database/migrations/101-normalisation-annee-scolaire-cloture.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [059-ajouter-affectation-matiere-sous-systeme.sql](file://backend/database/migrations/059-ajouter-affectation-matiere-sous-systeme.sql)
- [060-ajouter-affectation-matiere-coefficient.sql](file://backend/database/migrations/060-ajouter-affectation-matiere-coefficient.sql)
- [061-creer-table-bulletins-matieres.sql](file://backend/database/migrations/061-creer-table-bulletins-matieres.sql)
- [062-creer-table-evaluations-competences.sql](file://backend/database/migrations/062-creer-table-evaluations-competences.sql)
- [063-creer-module-emploi-du-temps.sql](file://backend/database/migrations/063-creer-module-emploi-du-temps.sql)
- [070-module-salles.sql](file://backend/database/migrations/070-module-salles.sql)
- [072-scoping-cycles-niveaux.sql](file://backend/database/migrations/072-scoping-cycles-niveaux.sql)
- [073-competence-unique-composite.sql](file://backend/database/migrations/073-competence-unique-composite.sql)
- [074-matiere-niveau-unique-composite.sql](file://backend/database/migrations/074-matiere-niveau-unique-composite.sql)
- [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)

## Detailed Component Analysis

### Academic Hierarchy: Cycles, Levels, Streams, Classes
- Cycles group Levels; Levels may define Streams; Streams organize Classes.
- Multi-tenant scoping ensures each entity belongs to an establishment.
- Class-year linkage ties enrollment to a specific academic year.

```mermaid
flowchart TD
Start(["Create Academic Year"]) --> DefineCycles["Define Cycles"]
DefineCycles --> DefineLevels["Define Levels per Cycle"]
DefineLevels --> DefineStreams["Define Streams per Level"]
DefineStreams --> CreateClasses["Create Classes per Stream"]
CreateClasses --> LinkYear["Link Classes to Academic Year"]
LinkYear --> End(["Hierarchy Ready"])
```

**Diagram sources**
- [053-structure-academique-complete.sql](file://backend/database/migrations/053-structure-academique-complete.sql)
- [054-refonte-structure-academique-v2.sql](file://backend/database/migrations/054-refonte-structure-academique-v2.sql)
- [072-scoping-cycles-niveaux.sql](file://backend/database/migrations/072-scoping-cycles-niveaux.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)

**Section sources**
- [053-structure-academique-complete.sql](file://backend/database/migrations/053-structure-academique-complete.sql)
- [054-refonte-structure-academique-v2.sql](file://backend/database/migrations/054-refonte-structure-academique-v2.sql)
- [072-scoping-cycles-niveaux.sql](file://backend/database/migrations/072-scoping-cycles-niveaux.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)

### Student Information System: Enrollment, Profiles, Guardians
- Students are enrolled in a Class within an Academic Year.
- Guardians link to Students for contact and consent management.
- Profile fields support additional demographic and administrative data.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant Student as "Eleve"
participant Class as "Classe"
participant Year as "AnneeScolaire"
participant Guardian as "ResponsableEleve"
Admin->>Year : "Select active academic year"
Admin->>Class : "Choose target class"
Admin->>Student : "Create student profile"
Student->>Class : "Enroll in class (year-scoped)"
Admin->>Guardian : "Add guardian(s) to student"
Guardian-->>Student : "Linked contacts"
```

**Diagram sources**
- [eleves/entities/Eleve.entity.ts](file://backend/src/modules/eleves/entities/Eleve.entity.ts)
- [responsables-eleves/entities/ResponsableEleve.entity.ts](file://backend/src/modules/responsables-eleves/entities/ResponsableEleve.entity.ts)
- [classes/entities/Classe.entity.ts](file://backend/src/modules/classes/entities/Classe.entity.ts)
- [annees-scolaires/entities/AnneeScolaire.entity.ts](file://backend/src/modules/annees-scolaires/entities/AnneeScolaire.entity.ts)

**Section sources**
- [eleves/entities/Eleve.entity.ts](file://backend/src/modules/eleves/entities/Eleve.entity.ts)
- [responsables-eleves/entities/ResponsableEleve.entity.ts](file://backend/src/modules/responsables-eleves/entities/ResponsableEleve.entity.ts)
- [classes/entities/Classe.entity.ts](file://backend/src/modules/classes/entities/Classe.entity.ts)
- [annees-scolaires/entities/AnneeScolaire.entity.ts](file://backend/src/modules/annees-scolaires/entities/AnneeScolaire.entity.ts)

### Subject Management and Teacher Assignments
- Subjects are defined at Level scope and can be assigned to teachers with coefficients.
- Coefficients influence grade calculations and report card weights.
- Assignment records tie personnel to subjects for scheduling and grading.

```mermaid
flowchart TD
DefineSubject["Define Subject at Level"] --> AssignTeacher["Assign Teacher via Affectation"]
AssignTeacher --> SetCoefficient["Set Coefficient"]
SetCoefficient --> Schedule["Use in Scheduling"]
Schedule --> Assess["Use in Evaluations"]
Assess --> Grade["Compute Grades"]
```

**Diagram sources**
- [059-ajouter-affectation-matiere-sous-systeme.sql](file://backend/database/migrations/059-ajouter-affectation-matiere-sous-systeme.sql)
- [060-ajouter-affectation-matiere-coefficient.sql](file://backend/database/migrations/060-ajouter-affectation-matiere-coefficient.sql)
- [matieres/entities/Matiere.entity.ts](file://backend/src/modules/matieres/entities/Matiere.entity.ts)

**Section sources**
- [059-ajouter-affectation-matiere-sous-systeme.sql](file://backend/database/migrations/059-ajouter-affectation-matiere-sous-systeme.sql)
- [060-ajouter-affectation-matiere-coefficient.sql](file://backend/database/migrations/060-ajouter-affectation-matiere-coefficient.sql)
- [matieres/entities/Matiere.entity.ts](file://backend/src/modules/matieres/entities/Matiere.entity.ts)

### Competency-Based Assessment Model
- Competencies are defined per Level and assessed through Evaluations.
- Evaluations record student performance via Notes.
- Unique constraints ensure consistent competency definitions.

```mermaid
classDiagram
class Competence {
+id
+libelle
+niveau_id
+etablissement_id
}
class Evaluation {
+id
+titre
+periode_id
+matiere_id
+etablissement_id
}
class Note {
+id
+evaluation_id
+eleve_id
+valeur
+commentaire
+etablissement_id
}
Competence --> Evaluation : "assessed by"
Evaluation --> Note : "records"
```

**Diagram sources**
- [062-creer-table-evaluations-competences.sql](file://backend/database/migrations/062-creer-table-evaluations-competences.sql)
- [073-competence-unique-composite.sql](file://backend/database/migrations/073-competence-unique-composite.sql)
- [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)
- [competences/entities/Competence.entity.ts](file://backend/src/modules/competences/entities/Competence.entity.ts)
- [notes/entities/Note.entity.ts](file://backend/src/modules/notes/entities/Note.entity.ts)

**Section sources**
- [062-creer-table-evaluations-competences.sql](file://backend/database/migrations/062-creer-table-evaluations-competences.sql)
- [073-competence-unique-composite.sql](file://backend/database/migrations/073-competence-unique-composite.sql)
- [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)
- [competences/entities/Competence.entity.ts](file://backend/src/modules/competences/entities/Competence.entity.ts)
- [notes/entities/Note.entity.ts](file://backend/src/modules/notes/entities/Note.entity.ts)

### Timetable Scheduling and Room Allocation
- Sessions are scheduled for Classes, Subjects, and Teachers in Rooms.
- Conflict resolution prevents double-booking of Rooms, Teachers, and Classes.
- Primary room association per Class aids default allocation.

```mermaid
flowchart TD
PlanSession["Plan Session"] --> CheckRoom["Check Room Availability"]
CheckRoom --> CheckTeacher["Check Teacher Availability"]
CheckTeacher --> CheckClass["Check Class Availability"]
CheckClass --> |All Clear| Confirm["Confirm Session"]
CheckClass --> |Conflict| Resolve["Resolve Conflict"]
Resolve --> Replan["Replan Session"]
Confirm --> Publish["Publish Schedule"]
```

**Diagram sources**
- [063-creer-module-emploi-du-temps.sql](file://backend/database/migrations/063-creer-module-emploi-du-temps.sql)
- [070-module-salles.sql](file://backend/database/migrations/070-module-salles.sql)
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [emploi-du-temps/entities/PlanningSession.entity.ts](file://backend/src/modules/emploi-du-temps/entities/PlanningSession.entity.ts)
- [salles/entities/Salle.entity.ts](file://backend/src/modules/salles/entities/Salle.entity.ts)

**Section sources**
- [063-creer-module-emploi-du-temps.sql](file://backend/database/migrations/063-creer-module-emploi-du-temps.sql)
- [070-module-salles.sql](file://backend/database/migrations/070-module-salles.sql)
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [emploi-du-temps/entities/PlanningSession.entity.ts](file://backend/src/modules/emploi-du-temps/entities/PlanningSession.entity.ts)
- [salles/entities/Salle.entity.ts](file://backend/src/modules/salles/entities/Salle.entity.ts)

### Academic Calendar: School Years and Periods
- School Years define start/end dates and closure status.
- Periods are scoped to School Years and can be templated/configured per Level.
- Templates enable standardized period structures across Levels.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant Year as "AnneeScolaire"
participant Template as "Period Template"
participant Level as "Niveau"
participant Period as "Periode"
Admin->>Year : "Create academic year"
Admin->>Template : "Define period template"
Template->>Level : "Apply to level configuration"
Level->>Period : "Generate periods"
Period-->>Admin : "Ready for assessments"
```

**Diagram sources**
- [101-normalisation-annee-scolaire-cloture.sql](file://backend/database/migrations/101-normalisation-annee-scolaire-cloture.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [annees-scolaires/entities/AnneeScolaire.entity.ts](file://backend/src/modules/annees-scolaires/entities/AnneeScolaire.entity.ts)

**Section sources**
- [101-normalisation-annee-scolaire-cloture.sql](file://backend/database/migrations/101-normalisation-annee-scolaire-cloture.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [annees-scolaires/entities/AnneeScolaire.entity.ts](file://backend/src/modules/annees-scolaires/entities/AnneeScolaire.entity.ts)

### Report Card Generation and Grade Calculations
- Bulletins aggregate Notes per student per period/year.
- Subject-specific bulletin entries allow detailed breakdowns.
- Coefficients from subject assignments influence weighted averages.

```mermaid
flowchart TD
CollectNotes["Collect Notes per Evaluation"] --> Aggregate["Aggregate by Student and Period"]
Aggregate --> ApplyCoeff["Apply Subject Coefficients"]
ApplyCoeff --> ComputeAvg["Compute Weighted Averages"]
ComputeAvg --> GenerateBulletin["Generate Bulletin Entries"]
GenerateBulletin --> Publish["Publish Report Cards"]
```

**Diagram sources**
- [061-creer-table-bulletins-matieres.sql](file://backend/database/migrations/061-creer-table-bulletins-matieres.sql)
- [bulletins/entities/Bulletin.entity.ts](file://backend/src/modules/bulletins/entities/Bulletin.entity.ts)
- [notes/entities/Note.entity.ts](file://backend/src/modules/notes/entities/Note.entity.ts)
- [060-ajouter-affectation-matiere-coefficient.sql](file://backend/database/migrations/060-ajouter-affectation-matiere-coefficient.sql)

**Section sources**
- [061-creer-table-bulletins-matieres.sql](file://backend/database/migrations/061-creer-table-bulletins-matieres.sql)
- [bulletins/entities/Bulletin.entity.ts](file://backend/src/modules/bulletins/entities/Bulletin.entity.ts)
- [notes/entities/Note.entity.ts](file://backend/src/modules/notes/entities/Note.entity.ts)
- [060-ajouter-affectation-matiere-coefficient.sql](file://backend/database/migrations/060-ajouter-affectation-matiere-coefficient.sql)

### Exam Management and Diploma Tracking
- National Exams are associated with Students and Academic Years.
- Diplomas are issued to Students upon completion, capturing type and issuance date.
- These entities support certification workflows and transcript generation.

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant Exam as "ExamenNational"
participant Student as "Eleve"
participant Diploma as "DiplomeEleve"
Admin->>Exam : "Schedule national exam"
Exam->>Student : "Register eligible students"
Admin->>Diploma : "Issue diploma upon completion"
Diploma-->>Student : "Recorded in academic history"
```

**Diagram sources**
- [examens-nationaux/entities/ExamenNational.entity.ts](file://backend/src/modules/examens-nationaux/entities/ExamenNational.entity.ts)
- [diplomes-eleves/entities/DiplomeEleve.entity.ts](file://backend/src/modules/diplomes-eleves/entities/DiplomeEleve.entity.ts)
- [eleves/entities/Eleve.entity.ts](file://backend/src/modules/eleves/entities/Eleve.entity.ts)

**Section sources**
- [examens-nationaux/entities/ExamenNational.entity.ts](file://backend/src/modules/examens-nationaux/entities/ExamenNational.entity.ts)
- [diplomes-eleves/entities/DiplomeEleve.entity.ts](file://backend/src/modules/diplomes-eleves/entities/DiplomeEleve.entity.ts)
- [eleves/entities/Eleve.entity.ts](file://backend/src/modules/eleves/entities/Eleve.entity.ts)

## Dependency Analysis
Key dependency chains:
- Academic hierarchy drives class composition and enrollment.
- Subject assignments drive scheduling and assessment opportunities.
- Evaluations and Notes feed Bulletin aggregation and grade computation.
- Scheduling depends on Room availability and teacher/class constraints.
- Calendar periods gate assessment windows and report card generation.

```mermaid
graph TB
Hierarchy["Academic Hierarchy"] --> Enrollment["Student Enrollment"]
Hierarchy --> Scheduling["Timetable Scheduling"]
Subjects["Subjects & Assignments"] --> Scheduling
Subjects --> Assessment["Evaluations & Notes"]
Calendar["Calendar & Periods"] --> Assessment
Assessment --> Reporting["Bulletins & Grades"]
Scheduling --> Resources["Rooms & Teachers"]
Enrollment --> Reporting
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

**Section sources**
- [053-structure-academique-complete.sql](file://backend/database/migrations/053-structure-academique-complete.sql)
- [054-refonte-structure-academique-v2.sql](file://backend/database/migrations/054-refonte-structure-academique-v2.sql)
- [058-multi-tenant-structure-academique.sql](file://backend/database/migrations/058-multi-tenant-structure-academique.sql)
- [088-refactorisation-architecture-academique.sql](file://backend/database/migrations/088-refactorisation-architecture-academique.sql)
- [089-finalisation-architecture-academique-v2.sql](file://backend/database/migrations/089-finalisation-architecture-academique-v2.sql)
- [091-peuplement-architecture-academique.sql](file://backend/database/migrations/091-peuplement-architecture-academique.sql)
- [092-refactorisation-classeAnneeId.sql](file://backend/database/migrations/092-refactorisation-classeAnneeId.sql)
- [100-classes-salle-principale.sql](file://backend/database/migrations/100-classes-salle-principale.sql)
- [101-normalisation-annee-scolaire-cloture.sql](file://backend/database/migrations/101-normalisation-annee-scolaire-cloture.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)
- [103-templates-periode-personnalisables.sql](file://backend/database/migrations/103-templates-periode-personnalisables.sql)
- [104-refonte-periodes-niveaux-configurables.sql](file://backend/database/migrations/104-refonte-periodes-niveaux-configurables.sql)
- [059-ajouter-affectation-matiere-sous-systeme.sql](file://backend/database/migrations/059-ajouter-affectation-matiere-sous-systeme.sql)
- [060-ajouter-affectation-matiere-coefficient.sql](file://backend/database/migrations/060-ajouter-affectation-matiere-coefficient.sql)
- [061-creer-table-bulletins-matieres.sql](file://backend/database/migrations/061-creer-table-bulletins-matieres.sql)
- [062-creer-table-evaluations-competences.sql](file://backend/database/migrations/062-creer-table-evaluations-competences.sql)
- [063-creer-module-emploi-du-temps.sql](file://backend/database/migrations/063-creer-module-emploi-du-temps.sql)
- [070-module-salles.sql](file://backend/database/migrations/070-module-salles.sql)
- [072-scoping-cycles-niveaux.sql](file://backend/database/migrations/072-scoping-cycles-niveaux.sql)
- [073-competence-unique-composite.sql](file://backend/database/migrations/073-competence-unique-composite.sql)
- [074-matiere-niveau-unique-composite.sql](file://backend/database/migrations/074-matiere-niveau-unique-composite.sql)
- [106-rename-sequence-to-evaluation.sql](file://backend/database/migrations/106-rename-sequence-to-evaluation.sql)

## Performance Considerations
- Indexing strategies should prioritize foreign keys used in frequent joins (e.g., classe_id, matiere_id, evaluation_id).
- Composite unique constraints reduce duplicate data and improve query efficiency.
- Partitioning large tables (Notes, Bulletins) by academic year can enhance reporting performance.
- Avoid over-fetching in schedule conflict checks; use targeted queries with existence checks.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Duplicate subject definitions: Ensure composite uniqueness at Level scope.
- Scheduling conflicts: Validate Room, Teacher, and Class availability before confirmation.
- Grade calculation discrepancies: Verify coefficient values and evaluation coverage.
- Period misalignment: Confirm Period boundaries match assessment windows.

**Section sources**
- [074-matiere-niveau-unique-composite.sql](file://backend/database/migrations/074-matiere-niveau-unique-composite.sql)
- [063-creer-module-emploi-du-temps.sql](file://backend/database/migrations/063-creer-module-emploi-du-temps.sql)
- [060-ajouter-affectation-matiere-coefficient.sql](file://backend/database/migrations/060-ajouter-affectation-matiere-coefficient.sql)
- [102-periodes-hierarchie.sql](file://backend/database/migrations/102-periodes-hierarchie.sql)

## Conclusion
The eLISAschool academic schema provides a robust, multi-tenant foundation for managing educational hierarchies, student lifecycles, subject assignments, competency-based assessments, scheduling, and reporting. Its design emphasizes clarity, scalability, and operational integrity through well-defined relationships, constraints, and calendar-driven workflows.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices
- Entity relationship overview: See Architecture Overview diagram.
- Migration timeline: Refer to referenced migration files for evolution details.
- Module integration points: Consult module entity files for API and service hooks.

[No sources needed since this section provides general references]