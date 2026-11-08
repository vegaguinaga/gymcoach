# Progreso de GymCoach

## Estado actual: Fase 0 completada (2026-11-08)
- Proyecto Vite 8 + React 19 + TypeScript (estricto) + Tailwind 4 + Vitest 5.
- Lint con **oxlint** (viene por defecto en Vite; reemplaza a ESLint). Regla `no-explicit-any` activada.
- Navegación propia por hash (`#/rutina`, `#/perfil`…) en `src/ui/useRuta.ts`, sin librería de rutas.
- Barra inferior con 4 pestañas: Rutina, Entrenar, Progreso, Perfil (pantallas provisionales en `src/App.tsx`).
- Primer test de dominio: `redondearKg` (`src/domain/unidades.ts`).
- Build: JS inicial ≈ 69 KB gzip.

## Siguiente: Fase 1
Tipos de dominio + Dexie, `src/data/exercises.json` (~40 ejercicios), pantalla Perfil y biblioteca de ejercicios.

## Notas
- Node se instaló con nvm: en shells no interactivos hay que cargar `~/.nvm/nvm.sh` antes de `npm`.
