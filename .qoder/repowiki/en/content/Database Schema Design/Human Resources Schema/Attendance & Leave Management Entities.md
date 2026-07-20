# Attendance & Leave Management Entities

<cite>
**Referenced Files in This Document**
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)
- [backend/database/migrations/016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [backend/database/migrations/017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [backend/database/migrations/018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [backend/database/migrations/019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [backend/database/migrations/020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [backend/database/migrations/022-module-personnel-rh-complete.sql](file://backend/database/migrations/022-module-personnel-rh-complete.sql)
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)
- [backend/database/migrations/031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)
- [backend/src/shared/constants/personnel.constants.ts](file://backend/src/shared/constants/personnel.constants.ts)
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

This document provides comprehensive data model documentation for eLISAschool's attendance and leave management system. The system manages time tracking, leave requests, absence monitoring, and related workflows for school personnel including teachers, administrative staff, and support personnel.

The attendance and leave management module is a critical component of the Human Resources (HR) system, providing comprehensive tracking of employee working hours, leave balances, approval workflows, and compliance reporting.

## Project Structure

The attendance and leave management functionality is primarily implemented within the Personnel module (`personnel`) and the Personnel Tracking module (`suivi-personnel`). The system follows a modular architecture with clear separation between core HR entities and specialized tracking functionality.

```mermaid
graph TB
subgraph "Personnel Module"
A[Employee Core Data]
B[Contract Information]
C[Position & Role]
D[Work Schedule]
end
subgraph "Tracking Module"
E[Time Records]
F[Leave Requests]
G[Absence Monitoring]
H[Timesheets]
end
subgraph "Supporting Systems"
I[Approval Workflows]
J[Notifications]
K[Reporting & Analytics]
L[Payroll Integration]
end
A --> E
A --> F
B --> D
D --> E
F --> I
E --> H
H --> L
G --> K
I --> J
```

**Diagram sources**
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)

## Core Components

### Time Tracking System

The time tracking system captures clock-in/clock-out records, calculates work hours, and generates timesheets for payroll processing.

#### Key Entities:
- **ClockInRecord**: Individual time entry events
- **WorkDay**: Aggregated daily work summary
- **Timesheet**: Periodic work hour compilation
- **WorkSchedule**: Standard working hours configuration

#### Data Flow:
```mermaid
sequenceDiagram
participant Employee as "Employee"
participant Clock as "Clock System"
participant Tracker as "Time Tracker"
participant Calculator as "Hours Calculator"
participant Timesheet as "Timesheet Generator"
Employee->>Clock : Clock In/Out
Clock->>Tracker : Record Event
Tracker->>Calculator : Calculate Hours
Calculator->>Calculator : Apply Break Rules
Calculator->>Calculator : Process Overtime
Calculator->>Timesheet : Generate Summary
Timesheet-->>Employee : Daily Report
```

**Diagram sources**
- [backend/database/migrations/016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [backend/database/migrations/031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)

### Leave Management System

The leave management system handles various types of leave requests, approval workflows, and balance tracking.

#### Leave Types Supported:
- Annual Leave (Vacation)
- Sick Leave
- Maternity/Paternity Leave
- Personal Leave
- Unpaid Leave
- Training Leave

#### Approval Workflow:
```mermaid
flowchart TD
Start([Leave Request Submitted]) --> Validate["Validate Eligibility"]
Validate --> CheckBalance{"Sufficient Balance?"}
CheckBalance --> |No| Reject["Request Rejected"]
CheckBalance --> |Yes| RouteApproval["Route to Approver"]
RouteApproval --> Level1{"Level 1 Approval"}
Level1 --> |Approved| Level2{"Level 2 Required?"}
Level1 --> |Rejected| EndReject["Request Rejected"]
Level2 --> |No| FinalApprove["Final Approval"]
Level2 --> |Yes| Level2Check["Level 2 Approval"]
Level2Check --> |Approved| FinalApprove
Level2Check --> |Rejected| EndReject
FinalApprove --> UpdateBalance["Update Leave Balance"]
UpdateBalance --> Notify["Send Notifications"]
Notify --> End([Request Approved])
Reject --> EndReject
```

**Diagram sources**
- [backend/database/migrations/017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [backend/database/migrations/018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)

### Absence Monitoring System

The absence monitoring system tracks unexcused absences, generates automatic notifications, and analyzes productivity impact.

#### Monitoring Features:
- Real-time absence detection
- Automatic notification generation
- Coverage planning alerts
- Productivity impact analysis
- Compliance violation tracking

## Architecture Overview

The attendance and leave management system follows a layered architecture with clear separation of concerns:

```mermaid
graph TB
subgraph "Presentation Layer"
UI[User Interface]
API[API Endpoints]
end
subgraph "Business Logic Layer"
Service[Service Layer]
Validator[Validation Engine]
Workflow[Workflow Engine]
end
subgraph "Data Access Layer"
Repository[Repository Pattern]
Cache[Cache Layer]
Queue[Message Queue]
end
subgraph "Infrastructure Layer"
Database[(Database)]
Notification[Notification Service]
Calendar[Calendar Integration]
Payroll[Payroll System]
end
UI --> API
API --> Service
Service --> Validator
Service --> Workflow
Service --> Repository
Repository --> Database
Workflow --> Queue
Queue --> Notification
Service --> Calendar
Service --> Payroll
```

**Diagram sources**
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)

## Detailed Component Analysis

### Time Entry and Clock Management

The time entry system handles real-time clock-in/clock-out operations with validation and conflict resolution.

#### Entity Relationships:
```mermaid
erDiagram
EMPLOYEE {
uuid id PK
string matricule UK
string first_name
string last_name
uuid position_id FK
uuid contract_id FK
timestamp created_at
timestamp updated_at
}
WORK_SCHEDULE {
uuid id PK
uuid employee_id FK
date schedule_date
time start_time
time end_time
decimal break_duration
enum status
json metadata
}
CLOCK_RECORD {
uuid id PK
uuid employee_id FK
uuid work_schedule_id FK
datetime clock_in_time
datetime clock_out_time
decimal worked_hours
enum status
string location
json device_info
}
LEAVE_REQUEST {
uuid id PK
uuid employee_id FK
uuid leave_type_id FK
date start_date
date end_date
decimal requested_days
enum status
uuid approver_id FK
json attachments
}
LEAVE_BALANCE {
uuid id PK
uuid employee_id FK
uuid leave_type_id FK
year leave_year
decimal total_allocated
decimal used_balance
decimal remaining_balance
decimal carry_forward
}
TIMESHEET {
uuid id PK
uuid employee_id FK
date period_start
date period_end
decimal total_hours
decimal overtime_hours
decimal regular_hours
decimal break_hours
enum status
uuid approver_id FK
}
ABSENCE_RECORD {
uuid id PK
uuid employee_id FK
date absence_date
enum absence_type
decimal duration_hours
boolean is_excused
uuid related_leave_id FK
string reason
}
EMPLOYEE ||--o{ WORK_SCHEDULE : has
EMPLOYEE ||--o{ CLOCK_RECORD : clocks
EMPLOYEE ||--o{ LEAVE_REQUEST : submits
EMPLOYEE ||--o{ LEAVE_BALANCE : maintains
EMPLOYEE ||--o{ TIMESHEET : generates
EMPLOYEE ||--o{ ABSENCE_RECORD : has
WORK_SCHEDULE ||--o{ CLOCK_RECORD : contains
LEAVE_REQUEST ||--|| LEAVE_TYPE : references
LEAVE_REQUEST ||--|| APPROVER : requires
```

**Diagram sources**
- [backend/database/migrations/016-module-personnel-rh-phase1.sql](file://backend/database/migrations/016-module-personnel-rh-phase1.sql)
- [backend/database/migrations/017-module-personnel-rh-phase2.sql](file://backend/database/migrations/017-module-personnel-rh-phase2.sql)
- [backend/database/migrations/018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [backend/database/migrations/019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)
- [backend/database/migrations/020-module-personnel-rh-phase5.sql](file://backend/database/migrations/020-module-personnel-rh-phase5.sql)
- [backend/database/migrations/022-module-personnel-rh-complete.sql](file://backend/database/migrations/022-module-personnel-rh-complete.sql)
- [backend/database/migrations/031-suivi-personnel.sql](file://backend/database/migrations/031-suivi-personnel.sql)

### Leave Type Configuration and Policies

The system supports configurable leave types with specific policies and rules.

#### Leave Type Categories:
- **Paid Leave**: Annual, sick, maternity/paternity
- **Unpaid Leave**: Personal, sabbatical, unpaid training
- **Special Leave**: Jury duty, bereavement, civic duties
- **Compensatory Leave**: Overtime compensation, holiday make-up

#### Policy Rules:
- Minimum notice periods
- Maximum consecutive days
- Carry-forward limits
- Pro-rated calculations
- Special conditions for different employment types

### Approval Workflow Engine

Multi-level approval workflows ensure proper authorization and compliance.

#### Workflow Configuration:
```mermaid
stateDiagram-v2
[*] --> Draft
Draft --> PendingApproval : Submit
PendingApproval --> UnderReview : Manager Review
UnderReview --> Approved : Manager Approves
UnderReview --> Rejected : Manager Rejects
UnderReview --> PendingHR : Escalate to HR
PendingHR --> Approved : HR Approves
PendingHR --> Rejected : HR Rejects
Approved --> Processing : Process Leave
Processing --> Completed : Complete
Rejected --> [*]
Completed --> [*]
```

**Diagram sources**
- [backend/database/migrations/018-module-personnel-rh-phase3.sql](file://backend/database/migrations/018-module-personnel-rh-phase3.sql)
- [backend/database/migrations/019-module-personnel-rh-phase4.sql](file://backend/database/migrations/019-module-personnel-rh-phase4.sql)

### Attendance Policies and Rules

Working hours, break rules, and overtime regulations are configurable per organization or position.

#### Working Hour Policies:
- Standard working week (40 hours)
- Flexible working arrangements
- Shift-based schedules
- Part-time configurations
- Seasonal variations

#### Break Rules:
- Mandatory lunch breaks
- Rest period requirements
- Break duration calculations
- Overtime eligibility thresholds

### Reporting and Analytics

Comprehensive reporting capabilities for compliance, payroll, and operational insights.

#### Key Reports:
- Daily attendance summaries
- Monthly leave utilization
- Overtime analysis
- Absenteeism trends
- Compliance violations
- Payroll integration data

## Dependency Analysis

The attendance and leave management system has several key dependencies:

```mermaid
graph LR
subgraph "Internal Dependencies"
Auth[Authentication]
RBAC[Role-Based Access Control]
Notification[Notification System]
Calendar[Calendar Integration]
Payroll[Payroll System]
Audit[Audit Trail]
end
subgraph "External Dependencies"
Email[Email Service]
SMS[SMS Gateway]
Push[Push Notifications]
Mobile[Mobile App]
end
Attendance --> Auth
Attendance --> RBAC
Leave --> Notification
Leave --> Calendar
Timesheet --> Payroll
Absence --> Audit
Notification --> Email
Notification --> SMS
Notification --> Push
Mobile --> Attendance
```

**Diagram sources**
- [backend/src/modules/personnel/index.ts](file://backend/src/modules/personnel/index.ts)
- [backend/src/modules/suivi-personnel/index.ts](file://backend/src/modules/suivi-personnel/index.ts)

## Performance Considerations

### Database Optimization
- Indexed queries for time range lookups
- Partitioned tables for large datasets
- Materialized views for reporting
- Connection pooling for high concurrency

### Caching Strategies
- Session-based clock state caching
- Leave balance cache invalidation
- Scheduled report pre-computation
- Hot path optimization for clock operations

### Scalability Patterns
- Horizontal scaling for clock services
- Message queue for async processing
- Read replicas for reporting queries
- CDN for static attendance data

## Troubleshooting Guide

### Common Issues and Solutions

#### Time Entry Problems
- **Duplicate clock entries**: Implement deduplication logic
- **Time zone conflicts**: Use UTC storage with local display
- **Network connectivity**: Offline mode with sync capability
- **Device synchronization**: Conflict resolution algorithms

#### Leave Request Issues
- **Balance calculation errors**: Recalculation triggers
- **Approval routing failures**: Fallback approver assignment
- **Policy validation conflicts**: Rule engine debugging
- **Integration failures**: Retry mechanisms with logging

#### Performance Bottlenecks
- **Slow report generation**: Query optimization and indexing
- **High database load**: Connection pooling and query caching
- **Memory leaks**: Proper resource cleanup and monitoring
- **API response times**: Response compression and pagination

### Monitoring and Alerting
- Real-time system health checks
- Error rate monitoring
- Performance metric collection
- Business rule violation alerts

## Conclusion

The eLISAschool attendance and leave management system provides a comprehensive solution for managing employee time tracking, leave administration, and absence monitoring. The modular architecture ensures scalability and maintainability while supporting complex business rules and workflows.

Key strengths include:
- Flexible leave type configuration
- Multi-level approval workflows
- Comprehensive reporting capabilities
- Integration with payroll and calendar systems
- Robust audit trail and compliance features

Future enhancements may include mobile app integration, advanced analytics, predictive absence modeling, and enhanced automation capabilities.

## Appendices

### API Endpoints Reference

#### Time Tracking Endpoints
- `POST /api/attendance/clock-in` - Clock in operation
- `POST /api/attendance/clock-out` - Clock out operation  
- `GET /api/attendance/timesheet/{period}` - Get timesheet data
- `PUT /api/attendance/clock-record/{id}` - Edit clock record

#### Leave Management Endpoints
- `POST /api/leave/request` - Submit leave request
- `GET /api/leave/balance/{employee-id}` - Get leave balance
- `PUT /api/leave/approve/{request-id}` - Approve/reject request
- `GET /api/leave/calendar/{month}` - View leave calendar

#### Reporting Endpoints
- `GET /api/reports/attendance/monthly` - Monthly attendance report
- `GET /api/reports/leave/utilization` - Leave utilization report
- `GET /api/reports/absence/trends` - Absence trend analysis

### Data Migration Notes

All database migrations follow semantic versioning and include rollback capabilities. Migration files are organized by phase and feature area to ensure clean deployment and easy troubleshooting.