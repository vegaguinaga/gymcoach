---
name: optimizacion-rendimiento
description: Úsala cuando pida optimizar, cuando la app se sienta lenta, al revisar el tamaño del bundle, o antes de publicar una versión. Cubre rendimiento, PWA y calidad de código.
---

# Optimización

## Medir antes de tocar
- `npm run build` y anotar el tamaño de los chunks (meta: JS inicial < 200 KB gzip).
- Si hace falta detalle: `npx vite-bundle-visualizer`.
- Lighthouse (móvil) en el build de `npm run preview`: meta ≥ 90 en Performance, Accesibilidad, Best Practices y PWA.

## Técnicas (en este orden)
1. Lazy load por ruta (`React.lazy`) para Progreso/Gráficas (Recharts es pesado).
2. Importar solo lo que se usa de cada librería.
3. Evitar re-renders: `useLiveQuery` con consultas específicas, `memo`/`useMemo` solo donde se mida el beneficio.
4. Índices en Dexie para las consultas frecuentes (por fecha, por ejercicio).
5. Listas largas del historial: paginar o virtualizar.
6. Precache del service worker: solo el app shell y `exercises.json`.

## Calidad de código
- Funciones de más de ~50 líneas o archivos de más de ~250 → proponer dividir.
- Duplicación en 3 o más lugares → extraer.
- Siempre: tests verdes + build OK después de optimizar. Reportar antes/después con números.
