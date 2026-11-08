# Progreso de GymCoach

## Estado actual: Fase 1 completada (2026-11-08)
- Tipos de dominio en `src/domain/tipos.ts` (incluye `Routine`, `WorkoutSession`, `SetLog` para fases 2–3).
- `src/domain/biblioteca.ts` (filtros, alternativas, validación) y `src/domain/perfil.ts` (límites, valores por defecto), con tests.
- `src/data/exercises.json`: 43 ejercicios; un test valida su integridad (ids, alternativas, 3–5 pasos).
- Dexie **versión 1** (`src/data/db.ts`): `perfil`, `pesosCorporales`, `ejercicios`. La biblioteca base se copia con `bulkPut` al iniciar (`sincronizarBiblioteca`).
- Pantalla Perfil (objetivo, días, minutos, equipo, peso corporal) y biblioteca dentro de Perfil: `#/ejercicios` y `#/ejercicios/<id>`.
- Fichas con animación: 2 fotos (inicio/final) alternadas, de free-exercise-db (dominio público), en `public/ejercicios/` (~1.2 MB WebP). Campo `fotos` en el JSON; `pike_pushup` no tiene fotos. Botón de búsqueda en YouTube.
- Rutas con parámetro: `useRuta()` devuelve `{ ruta, param }`.
- Build: JS ≈ 109 KB gzip (Dexie + JSON).

## Fase 0 (2026-11-08)
- Proyecto Vite 8 + React 19 + TypeScript (estricto) + Tailwind 4 + Vitest 5.
- Lint con **oxlint** (viene por defecto en Vite; reemplaza a ESLint). Regla `no-explicit-any` activada.
- Navegación propia por hash (`#/rutina`, `#/perfil`…) en `src/ui/useRuta.ts`, sin librería de rutas.
- Barra inferior con 4 pestañas: Rutina, Entrenar, Progreso, Perfil (pantallas provisionales en `src/App.tsx`).
- Primer test de dominio: `redondearKg` (`src/domain/unidades.ts`).
- Build: JS inicial ≈ 69 KB gzip.

## Siguiente: Fase 2
Generador de rutinas en `src/domain/` (split según días, volumen, minutos) + tabla `rutinas` en Dexie (versión 2) + pantalla Rutina.

## Notas
- Node se instaló con nvm: en shells no interactivos hay que cargar `~/.nvm/nvm.sh` antes de `npm`.
