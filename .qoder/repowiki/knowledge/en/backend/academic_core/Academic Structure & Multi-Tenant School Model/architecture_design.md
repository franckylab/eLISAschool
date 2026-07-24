Six sibling Nest-style modules share an identical internal layout: `entities/` (TypeORM `@Entity` classes), `dto/` (class-validator schemas via `validateDto`), `services/` (stateless class using `AppDataSource.getRepository(...)` with explicit `etablissementId` scoping), `controllers/` (Express `Router` instances mounted under `/api/<module>`), plus per-module barrel `index.ts` re-exporting the four subfolders.

Dependency direction is strictly hierarchical — each module depends only on its parent in the academic tree and on `Etablissement` from `@modules/etablissement/entities`, never upward:
- `Cycle` → `Etablissement` (ManyToOne)
- `Niveau` → `Cycle` + `Etablissement` (+ optional `ExamenNational`)
- `Filiere` → `Cycle` + `Etablissement`
- `Specialite` → `Filiere` + `Etablissement`
- `AnneeScolaire` → `Etablissement` (+ `Periode` OneToMany)

Multi-tenancy is enforced at every level by an `etablissementId` column plus composite unique indexes (`code+etablissementId`, `nom+etablissementId`, `libelle+etablissementId`) and service-layer `findOne({ id, etablissementId })` guards. The `Etablissement` entity owns shared enums (`SousSysteme`, `TypeEtablissement`, `StatutEtablissement`) and a 1:1 `EtablissementConfig` relation loaded lazily (`select: false`). DTOs are split into create/update/query variants per resource; controllers validate payloads through `validateDto(schema, req.body)` and delegate to services that throw `AppError` with typed codes (e.g. `CYCLE_EXISTS`).