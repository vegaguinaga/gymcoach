# Progreso de GymCoach

## Estado actual: Fase 7 completada (2026-11-08)
- **Calentamiento**: `src/domain/calentamiento.ts` (con tests). Solo compuestos con carga: 40 % × 8, 60 % × 5 y 80 % × 3 del peso de la 1.ª serie, redondeado al incremento (`incrementoKg`). Con < 20 kg, 1 serie al 50 %. Desplegable «🔥 Calentamiento» en la tarjeta hasta marcar la primera serie; no se registra.
- **Notas**: `WorkoutSession.notasEjercicio` (opcional, sin índice: Dexie sigue en **v3**). `src/domain/notas.ts` (`conNotaEjercicio`, `ultimaNota`, con tests). En la tarjeta: «📝 Añadir nota» y «La última vez: …». Nota de la sesión en el resumen (`guardarNotaSesion`, sirve también en sesiones terminadas). Se ven en el detalle del historial.
- **Recordatorio de copia**: `Profile.ultimaCopia`, que se guarda al exportar y al importar. `guardarPerfil` la conserva (el formulario no la pisa). `necesitaCopia`/`textoUltimaCopia` en `respaldo.ts` (con tests): avisa si nunca hubo copia y hay ≥ 3 sesiones, o si la copia tiene 14+ días y hay sesiones posteriores. Aviso en el selector de día de Entrenar y «Última copia: …» en Tus datos.
- **Instalación**: `src/ui/instalacion.ts` (`detectarPlataforma` con tests; `beforeinstallprompt` se escucha desde `main.tsx`). Tarjeta «📲 Instala la app» en Perfil: botón en Android/Chrome y pasos para iOS; se oculta si ya está instalada. Meta tags `apple-mobile-web-app-*` y manifest con `id`, `scope` y `categories`. **Falta probarla en un teléfono real.**
- Build: JS inicial ≈ 124 KB gzip.

## Fase 6 (2026-11-08)
- **PWA** con `vite-plugin-pwa` (generateSW, `registerType: 'prompt'`): precache de todo (JS, incluido el chunk de Progreso, CSS, iconos y fotos; ~100 archivos, 1.8 MB). Manifest con `start_url: /#/entrenar`. Iconos generados (mancuerna lima) en `public/` (`pwa-192/512`, maskable, apple-touch-icon y favicon.svg). `src/ui/AvisoActualizacion.tsx` avisa de una versión nueva y no recarga sola, para no cortar una sesión.
- **Cambiar un ejercicio en la sesión** (máquina ocupada): `cambiarEjercicioEnSesion` en `sesion.ts` (con tests). Solo afecta a la sesión de hoy: conserva las series hechas del original (queda su tarjeta con esas series) y el nuevo hace las que faltan, con su prescripción y su sugerencia de peso. En descarga no vuelve a dividir las series. UI: botón "⇄ Cambiar" en cada tarjeta. `OpcionesCambio` pasó a `src/ui/` (se usa en Rutina y en Entrenar).
- **Copia de seguridad**: `src/domain/respaldo.ts` (formato v1, `validarRespaldo` con mensajes en español, con tests) y `src/data/repos/respaldo.ts` (exportar en una transacción; importar todo o nada, reemplaza y conserva los ids). Sección "Tus datos" en Perfil: antes de importar pide confirmación y descarga una copia de lo actual. La biblioteca no se exporta.
- Dexie sigue en **v3**. Build: JS inicial ≈ 122 KB gzip.

## Fase 5 (2026-11-08)
- Dominio: `src/domain/progresion.ts` (con tests):
  - `sugerencia` aplica la doble progresión. **Sube** si llegaste al tope del rango en todas las series con RPE ≤ 8. **Mantiene** el peso y pide +1 rep si estás dentro del rango. **Baja** un 10 % si quedaste bajo el mínimo en más de la mitad de las series en 2 sesiones seguidas. Un ejercicio **nuevo** empieza en 0 kg con RPE 6. En peso corporal sin lastre se progresa en reps.
  - `incrementoKg`: 2 kg con mancuernas, 2.5 kg en compuestos y 1 kg en accesorios de gym.
  - `estadoDescarga` se recomienda tras 6 semanas sin descarga o si el 1RM de un compuesto baja 2 sesiones seguidas. La descarga queda activa 7 días desde su primera sesión y se hace con la mitad de las series y el mismo peso.
- `sesion.ts`: `nuevaSesion(rutina, dia, historial, { ejercicios, descarga, ahora })` guarda `sugerencias` y `descarga` en la sesión. Las sesiones de descarga no cuentan para la progresión.
- `generador.ts`: `opcionesDeCambio` (alternativas, después otros ejercicios del mismo grupo, con tu equipo y sin repetir en el día) y `cambiarEjercicio` (cambia en todos los días con el mismo nombre y conserva las series).
- Datos: Dexie sigue en **v3** (solo campos opcionales que no son índices). Nuevo: `actualizarRutina`. `empezarSesion` recibe el parámetro `descarga`.
- Interfaz:
  - Entrenar: línea de sugerencia por ejercicio (colores según el tipo), aviso de descarga con interruptor en el selector de día y banner durante la sesión.
  - Rutina: botón "Cambiar" en cada ejercicio.
- Build: JS inicial ≈ 119 KB gzip.

## Fase 4 (2026-11-08)
- Dominio: `src/domain/progreso.ts` (con tests): `historialEjercicio` (1RM, volumen y mejor serie por sesión), `recordsPorEjercicio` (mayor 1RM y mejor kg × reps; en peso corporal, más reps), `recordsNuevos` (la primera vez que se hace un ejercicio no cuenta; igualar tampoco), `ejerciciosRealizados`, `sesionesEnDias`.
- Datos: sin cambio de esquema (Dexie sigue en **v3**). Hooks nuevos: `useSesionesTerminadas`, `useSesion`, `borrarSesion` y `usePesosCorporales`.
- Pantalla Progreso (`src/features/progreso/`), cargada con `lazy()`: resumen (sesiones en 7 y 30 días, ejercicios con récord) y 3 secciones: Historial (detalle en `#/progreso/<id>`, se puede borrar), Ejercicios (selector, chips 1RM/Volumen/Reps, récords, últimas 5 sesiones) y Peso.
- `GraficaLinea.tsx`: Recharts con una sola serie por gráfica (sin doble eje). Para peso corporal sin lastre solo se muestran reps.
- Resumen de Entrenar: tarjeta "🏆 ¡Nuevo récord!".
- Build: JS inicial ≈ 117 KB gzip; chunk de Progreso (Recharts) ≈ 108 KB gzip, se descarga solo al abrir la pestaña.

## Fase 3 (2026-11-08)
- Dominio: `src/domain/fuerza.ts` (Epley 1–12 reps, volumen, mejor 1RM) y `src/domain/sesion.ts` (día que toca, series iniciales con kg/reps de la última vez, agregar/quitar serie, temporizador, resumen). Con tests.
- `WorkoutSession` ahora guarda `estado` (en_curso | terminada), `diaIndice`, `fin`, `descansoHasta` y una copia del plan del día (`ejercicios`).
- Dexie **versión 3**: tabla `sesiones` ('++id, fecha, estado'). La sesión en curso se guarda en cada cambio con `modificarSesion` (transacción sobre lo último guardado: evita pisar cambios).
- Pantalla Entrenar (`src/features/entrenar/`): selector de día ("Toca hoy"), tarjetas con kg/reps/RPE/✓, + serie / quitar, barra de descanso fija (±15 s, saltar, vibración + pitido; el audio se prepara al tocar ✓ por las reglas del navegador), pantalla encendida (Wake Lock) y resumen final.
- Peso corporal: el campo kg es el lastre extra (0 = sin lastre), así que no suma volumen.
- Build: JS ≈ 115 KB gzip.

## Fase 2 (2026-11-08)
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

## Siguiente: Fase 8
Por definir. Ideas: probar la instalación en iOS/Android y corregir lo que aparezca, editar sesiones ya terminadas, plantillas de rutina propias, vista del calendario de entrenamientos.

## Notas
- Node se instaló con nvm: en shells no interactivos hay que cargar `~/.nvm/nvm.sh` antes de `npm`.
