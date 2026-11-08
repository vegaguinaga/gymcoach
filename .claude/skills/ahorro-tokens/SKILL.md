---
name: ahorro-tokens
description: Aplica SIEMPRE en este proyecto. Reglas para trabajar con el menor uso de tokens y contexto posible sin perder calidad.
---

# Uso eficiente de tokens

## Leer menos
- Buscar antes de leer: usar Grep/Glob para ubicar el código; leer solo el archivo y rango de líneas necesarios.
- No releer un archivo que acabas de editar ni uno que ya está en el contexto sin cambios.
- Nunca leer `node_modules`, `dist`, `package-lock.json` ni la cobertura.
- Para búsquedas amplias o de exploración usar un subagente (Explore) y quedarse solo con la conclusión.

## Escribir menos
- Editar con cambios puntuales (Edit), no reescribir archivos completos.
- No pegar en la respuesta código que ya está en los archivos.
- Respuestas breves: qué cambió, cómo probarlo y el siguiente paso. Sin resúmenes de lo ya dicho.

## Salidas de comandos cortas
- Tests: `npm test -- --run --reporter=dot`; si fallan, mostrar solo los fallos.
- Instalar: `npm install --silent` / `npm install <pkg> --silent`.
- Comandos largos: filtrar con `| tail -n 30` o `| grep -i error`.
- Ejecutar en paralelo las acciones independientes.

## Gestión de la sesión (recordármelo cuando aplique)
- Al terminar una funcionalidad y empezar otra no relacionada: sugerir `/clear`.
- Si la conversación se alarga: sugerir `/compact` con un enfoque (ej. `/compact conserva el estado de la fase 4`).
- `/context` para ver cuánto contexto se está usando.
- Tareas rutinarias (textos, estilos, bugs simples) pueden ir con un modelo más ligero (`/model`); arquitectura y lógica compleja, con el más capaz.
- Features grandes: modo plan primero (Shift+Tab) para no gastar tokens en un camino equivocado.

## Mantener el contexto ligero
- `CLAUDE.md` por debajo de unas 80 líneas: los detalles van en skills (se cargan solo cuando se usan).
- Al cerrar cada fase, actualizar `docs/progreso.md` con 5–10 líneas de estado, para retomar en una sesión nueva leyendo solo ese archivo.
