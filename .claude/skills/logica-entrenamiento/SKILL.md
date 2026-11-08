---
name: logica-entrenamiento
description: Úsala al trabajar en el generador de rutinas, las recomendaciones de progresión, el cálculo de 1RM, las descargas o la biblioteca de ejercicios. Contiene las reglas de entrenamiento de la app.
---

# Reglas de entrenamiento

## Selección del split según los días por semana
- 2–3 días: Full Body (A/B alternadas).
- 4 días: Torso / Pierna ×2.
- 5–6 días: Push / Pull / Legs (principiantes: máximo 5 días por defecto).

## Volumen para principiante
- 10–12 series efectivas por grupo muscular por semana al inicio; subir hasta 16 como máximo.
- Compuestos: 3 series de 6–10 reps, RPE 7–8, descanso de 2–3 min.
- Accesorios: 2–3 series de 10–15 reps, RPE 8, descanso de 60–90 s.
- La sesión debe caber en los minutos del perfil (unos 2.5 min por serie, incluido el descanso).
- Para pérdida de grasa: mantener la fuerza (no bajar intensidad) y sugerir cardio de 10–20 min al final.

## Progresión (doble progresión)
- Si se completa el tope del rango de reps en todas las series con RPE ≤ 8, la próxima sesión se sube +2.5 kg en compuestos de tren inferior o +1–2.5 kg en el resto (+1 kg o la mancuerna siguiente si no hay incrementos finos).
- Dentro del rango: mismo peso, intentar +1 rep.
- Por debajo del mínimo de reps en 2 sesiones seguidas: bajar un 10%.
- Descarga: cada 4–6 semanas, o si el 1RM estimado baja en 2 sesiones seguidas → una semana con 50% de las series y el mismo peso.

## Fórmulas
- 1RM estimado (Epley): peso × (1 + reps / 30); solo con reps ≤ 12.
- Volumen = Σ (peso × reps) de las series completadas.
- Récord personal: mayor 1RM estimado y mayor peso × reps por ejercicio.

## Seguridad (mostrar en la app)
- Calentamiento de 5–10 min y series de aproximación antes de los compuestos.
- Avisar: "Si sientes dolor agudo, detente". La app no sustituye a un profesional.
- Priorizar la técnica: los ejercicios nuevos empiezan liviano (RPE 6).

## Biblioteca (`src/data/exercises.json`)
Cada ejercicio tiene: `id`, `nombre`, `grupoPrincipal`, `gruposSecundarios`, `equipo` (gym | mancuernas | peso_corporal), `tipo` (compuesto | accesorio), `instrucciones` (3–5 pasos), `erroresComunes`, `alternativas` (ids).

Toda regla nueva va con su test en `src/domain/__tests__/`.
