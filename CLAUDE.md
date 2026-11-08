# GymCoach — guía para Claude

App PWA móvil para registrar entrenamientos de gym y recomendar rutinas. Usuario: principiante, en español.

## Stack
React + Vite + TypeScript + Tailwind · Dexie (IndexedDB) · Recharts · vite-plugin-pwa · Vitest · oxlint (lint)

## Comandos
- `npm run dev` — servidor local (`npm run dev -- --host` para probar en el celular)
- `npm run build` — build de producción
- `npm test -- --run --reporter=dot` — tests (salida corta)
- `npm run lint` — lint

## Estructura
- `src/domain/` — lógica pura de entrenamiento (generador, progresión, 1RM). Sin React. Con tests.
- `src/data/` — Dexie: esquema, migraciones, repositorios. `exercises.json` = biblioteca base.
- `src/features/<feature>/` — pantallas y componentes por funcionalidad.
- `src/ui/` — componentes reutilizables.
- `docs/progreso.md` — estado actual del proyecto; leerlo al empezar una sesión nueva.

## Reglas
- Mobile-first; botones táctiles ≥ 44px; funciona offline.
- La lógica de entrenamiento vive en `src/domain/` y siempre lleva test.
- Si cambias el esquema de Dexie, sube la versión y escribe la migración; nunca borres datos del usuario.
- Commits pequeños por funcionalidad, en español.
- Todo en español: UI, comentarios del código y respuestas.
- Skills disponibles en `.claude/skills/`: úsalas según la tarea.
