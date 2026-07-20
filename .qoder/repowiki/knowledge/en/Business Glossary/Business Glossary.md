---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### Établissement
- Definition：Primary organizational unit representing a school or educational institution in the multi-tenant architecture. Each établissement has its own configuration, users, classes, and academic data. Serves as the tenant boundary for data isolation.
- Aliases：school、institution、établissement scolaire

### Année Scolaire
- Definition：Academic year entity that groups all academic activities within a specific school year (e.g., 2024-2025). Contains periods, grades, and student progress tracking. Multiple établissements can have overlapping academic years.
- Aliases：academic year、annee_scolaire、school year

### Période
- Definition：Time-based academic division within an academic year that can be configured as trimesters, semesters, sequences, or custom templates. Supports African educational systems with flexible hierarchical structures (Year > Semester > Trimester > Sequence).
- Aliases：period、trimestre、semestre、séquence、term

### TypeCycle
- Definition：Educational cycle classification defining the broader educational stage (Maternelle, Primaire, Secondaire 1er Cycle, Secondaire 2nd Cycle, Supérieur). Forms the top-level hierarchy in the Cameroonian/African educational system.
- Aliases：cycle type、educational cycle、type_cycle

### Niveau
- Definition：Specific grade level within an educational cycle (e.g., Petite Section, CP, 6ème, Terminale). Contains detailed curriculum information, subject coefficients, and student enrollment data.
- Aliases：grade level、niveau scolaire、class level

### Filière
- Definition：Academic track or specialization within secondary education (Scientifique C/D/E, Littéraire A/A1, Technique). Determines available subjects and examination pathways for students.
- Aliases：academic track、stream、filiere

### ExamenNational
- Definition：National examination certification recognized by the Ministry of Education (CEP, BEPC, BAC, GCE O/A Level). Links student achievements to official national qualifications.
- Aliases：national exam、certification、examen national

### DiplomeEleve
- Definition：Student diploma record linking academic achievements to national examinations. Tracks graduation status and certification completion for each student.
- Aliases：student diploma、diploma、diplome_eleve

### Professeur Principal
- Definition：Class advisor role responsible for managing a specific class's academic progress, student welfare, and parent communication. Has elevated permissions over their assigned class.
- Aliases：class advisor、homeroom teacher、professeur_principal

### Conseiller d'Orientation
- Definition：School counselor role providing academic guidance, career counseling, and student support services. Manages orientation assessments and academic pathway recommendations.
- Aliases：counselor、orientation advisor、conseiller_orientation

### Chef d'Établissement
- Definition：School principal or headmaster role with administrative authority over the entire establishment. Responsible for institutional management, staff oversight, and strategic decisions.
- Aliases：principal、headmaster、chef_etablissement

### Super Administrateur
- Definition：System-wide administrator with access to all établissements and global system configuration. Can manage multiple institutions and system-wide settings.
- Aliases：super admin、system admin、super_admin

### Paramètre Système
- Definition：System configuration entity storing application settings at global or établissement-specific scope. Supports multi-tenant configuration with fallback hierarchy.
- Aliases：system parameter、configuration、parametre_systeme

### Template Période
- Definition：Configurable template defining the hierarchical structure of academic periods (e.g., '3 Trimestres × 2 Séquences'). Allows établissements to customize their academic calendar structure without code changes.
- Aliases：period template、academic template、template_periode

### Fond d'écran
- Definition：Customizable background images and themes for the application interface. Supports establishment-specific theming with automatic rotation and catalog management.
- Aliases：background、wallpaper、fond_ecran、theme

### Bulletin
- Definition：Student report card or transcript containing grades, evaluations, and academic performance metrics for specific periods or academic years.
- Aliases：report card、transcript、bulletin_scolaire

### Gratification
- Definition：Teacher bonus or incentive payment system linked to academic performance and teaching quality metrics.
- Aliases：teacher bonus、incentive、gratification_professeur
