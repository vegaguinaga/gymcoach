# Progreso de GymCoach

## Estado actual: Fase 2 completada (2026-11-08)
- Generador en `src/domain/generador.ts` (con tests): split por días (2–3 Full Body A/B, 4 Torso/Pierna, 5 Empuje/Tirón/Pierna + Torso/Pierna; 6 se limita a 5).
- Plantillas de días con "huecos" = listas de ejercicios por preferencia; se elige el primero con el equipo del perfil, sin repetir en el día y, si se puede, en la semana. La plancha no entra (se mide en segundos).
- Compuestos 3×6–10 RPE 7, 150 s; accesorios 3×10–15 RPE 8, 75 s (2 series con 5 días). Tiempo: 5 min de calentamiento + 2.5 min/serie + cardio; `ajustarATiempo` recorta accesorios y después compuestos.
- Pérdida de grasa: `cardioMin` (10–20) en cada día. Volumen probado: 9–16 series/semana en pecho, espalda y cuádriceps.
- Dexie **versión 2**: tabla `rutinas` ('++id, creada'). Cada generación agrega una rutina nueva; la actual es la más reciente (`useRutinaActual`).
- Pantalla Rutina (`src/features/rutina/`): generar/regenerar, aviso si el perfil cambió, tarjetas por día y enlace a la ficha de cada ejercicio.
- Build: JS ≈ 112 KB gzip.

## Fase 1 (2026-11-08)
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

## Siguiente: Fase 3
Entrenar en vivo: elegir día de la rutina, registrar series (kg, reps, RPE), temporizador de descanso, guardar `WorkoutSession` (Dexie v3).
Pendiente opcional: cambiar un ejercicio de la rutina por una de sus alternativas.

## Notas
- Node se instaló con nvm: en shells no interactivos hay que cargar `~/.nvm/nvm.sh` antes de `npm`.
