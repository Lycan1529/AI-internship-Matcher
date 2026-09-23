# Architecture Report

## System Overview

The FHNW AI Internship Matching Platform is structured as a SaaS application with a browser dashboard, Express API, PostgreSQL database, and service modules for matching, CV parsing, notifications, and internship ingestion.

```mermaid
flowchart LR
  F["Frontend Dashboard"] --> A["Express REST API"]
  A --> D["PostgreSQL via Prisma"]
  A --> M["AI Matching Service"]
  A --> C["CV Parsing Service"]
  A --> I["Internship Ingestion Service"]
  A --> N["Notification Service"]
  I --> S1["Approved Job APIs"]
  I --> S2["Company Career Pages"]
  M --> L["Embeddings / LLM Provider"]
```

## ER Diagram

```mermaid
erDiagram
  USER ||--o| STUDENT_PROFILE : has
  USER ||--o| RECRUITER : has
  COMPANY ||--o{ RECRUITER : employs
  COMPANY ||--o{ INTERNSHIP : posts
  STUDENT_PROFILE ||--o{ STUDENT_SKILL : owns
  SKILL ||--o{ STUDENT_SKILL : appears_in
  STUDENT_PROFILE ||--o{ PROJECT : creates
  INTERNSHIP ||--o{ INTERNSHIP_SOURCE : collected_from
  INTERNSHIP ||--o{ INTERNSHIP_SKILL_REQUIREMENT : requires
  SKILL ||--o{ INTERNSHIP_SKILL_REQUIREMENT : required_as
  STUDENT_PROFILE ||--o{ MATCH_RECOMMENDATION : receives
  INTERNSHIP ||--o{ MATCH_RECOMMENDATION : ranked_for
  STUDENT_PROFILE ||--o{ APPLICATION : submits
  INTERNSHIP ||--o{ APPLICATION : receives
  APPLICATION ||--o{ NOTIFICATION : triggers
```

## UML Class Diagram

```mermaid
classDiagram
  class StudentProfile {
    +createProfile()
    +updateSkills()
    +applyToInternship()
  }
  class Internship {
    +publish()
    +closePosting()
  }
  class MatchRecommendation {
    +calculateScore()
    +generateExplanation()
  }
  class Application {
    +submit()
    +updateStatus()
  }
  class Notification {
    +create()
    +markAsRead()
  }
  StudentProfile "1" --> "0..*" Application
  StudentProfile "1" --> "0..*" MatchRecommendation
  Internship "1" --> "0..*" Application
  Internship "1" --> "0..*" MatchRecommendation
  Application "1" --> "0..*" Notification
```

## Use Cases

```mermaid
flowchart LR
  Student["Student"] --> S1["Create profile"]
  Student --> S2["Upload CV"]
  Student --> S3["View AI matches"]
  Student --> S4["Apply for internship"]
  Student --> S5["Track application status"]
  Recruiter["Recruiter"] --> R1["Create internship"]
  Recruiter --> R2["Review applications"]
  Recruiter --> R3["Update hiring status"]
  Admin["Admin"] --> A1["Manage users"]
  Admin --> A2["Monitor recommendations"]
  Admin --> A3["Maintain source data"]
```

## Sequence: Recommendation Flow

```mermaid
sequenceDiagram
  Student->>Frontend: Open dashboard
  Frontend->>API: GET /api/recommendations/:studentId
  API->>Database: Load profile, skills, projects
  API->>Database: Load internships and requirements
  API->>MatchingService: Calculate weighted scores
  MatchingService-->>API: Ranked recommendations
  API->>Database: Store MatchRecommendation
  API-->>Frontend: Ranked list with explanation
```

## Sequence: Application Flow

```mermaid
sequenceDiagram
  Student->>Frontend: Click Apply
  Frontend->>API: POST /api/applications
  API->>Database: Create Application
  API->>NotificationService: create application_submitted
  NotificationService->>Database: Store Notification
  API-->>Frontend: Application created
```

## Sequence: Status Update Flow

```mermaid
sequenceDiagram
  Recruiter->>Frontend: Change status
  Frontend->>API: PUT /api/applications/:id/status
  API->>Database: Update Application
  API->>NotificationService: create application_status_updated
  NotificationService->>Database: Store Notification
  API-->>Frontend: Updated application
```

## Application State Diagram

```mermaid
stateDiagram-v2
  [*] --> Applied
  Applied --> Interview
  Applied --> Rejected
  Interview --> Offer
  Interview --> Rejected
  Offer --> [*]
  Rejected --> [*]
```

## Matching Formula

```txt
match_score =
  skills_score * 0.50 +
  project_relevance_score * 0.25 +
  preference_score * 0.15 +
  availability_score * 0.10
```
