---
name: desarrollo-gymcoach
description: Úsala al crear o modificar cualquier funcionalidad, pantalla o componente de GymCoach. Define arquitectura, convenciones y el flujo para agregar features.
---

# Desarrollo de GymCoach

## Flujo para una funcionalidad nueva
1. Si toca más de 3 archivos, propón primero un plan corto (archivos + pasos) y espera mi OK.
2. Primero la lógica pura en `src/domain/` con su test en Vitest.
3. Después los datos (Dexie) si hacen falta: tipo en `src/data/types.ts` y repositorio en `src/data/repos/`.
4. Al final la UI en `src/features/<feature>/`.
5. Corre `npm test -- --run --reporter=dot` y `npm run build`. Si algo falla, arréglalo antes de terminar.
6. Explícame en 2–3 líneas qué cambió y cómo probarlo en el celular.
7. Propón un mensaje de commit en español.

## Convenciones
- TypeScript estricto, sin `any`. Tipos de dominio: `Exercise`, `Routine`, `WorkoutSession`, `SetLog`, `Profile`, `BodyWeightEntry`.
- Componentes funcionales y hooks. El estado persistente vive en Dexie (`useLiveQuery`), no en un estado global.
- Fechas en ISO string; pesos en kg con 1 decimal.
- Textos de la UI en español, cortos y claros.
- Accesibilidad: labels en inputs, contraste suficiente, tamaño táctil ≥ 44px.
- Tema oscuro por defecto (se usa en el gym).

## Lo que NO hacer
- No agregar backend, login ni APIs de pago sin pedírmelo.
- No instalar librerías nuevas sin decir por qué y qué alternativa más ligera existe.
