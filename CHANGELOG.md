# Cambios de GymCoach

Formato: fecha, Agregado / Cambiado / Corregido. Versiones con [semver](https://semver.org/lang/es/); 0.x = fase de desarrollo.

## [0.10.0] - 2026-11-08
### Agregado
- Volumen semanal por grupo muscular: en Rutina (planificado, con aviso si queda corto o alto) y en Progreso (hecho esta semana frente a lo planificado).
- Ejercicios por tiempo: la plancha entra en la rutina (3 × 20–45 s), con cronómetro en la sesión y progresión de 5 en 5 s.
- Medidas corporales (cintura, cadera, pecho, brazo y muslo) en Progreso › Cuerpo, con gráfica y cambio desde el inicio.
### Cambiado
- La sección «Peso» de Progreso ahora se llama «Cuerpo» (peso y medidas).
- Copia de seguridad v2: incluye las medidas. Las copias v1 se siguen pudiendo importar.
- Base de datos v4 (tabla nueva `medidas`, sin migración de datos).
### Quitado
- `.gitkeep` sobrantes; `seriesPorGrupo` pasó del generador a `volumen.ts`.

## [0.9.0] - 2026-11-08
### Agregado
- Cambiar la fecha de una sesión terminada desde el historial.
- Registrar una sesión olvidada: día de la rutina, fecha, hora y duración; las series se completan después.
- Añadir días a la rutina (copia de otro día) y quitarlos.
### Cambiado
- `@types/node` 26.

## [0.8.0] - 2026-11-08
### Agregado
- Editar las series de una sesión terminada, calendario con racha semanal y edición manual de la rutina.

## Fases 0–7 - 2026-11-08
- Ver `docs/progreso.md`.
