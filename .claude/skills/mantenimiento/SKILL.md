---
name: mantenimiento
description: Úsala cuando pida actualizar dependencias, revisar el estado del proyecto, corregir bugs, hacer una revisión mensual o preparar una nueva versión de GymCoach.
---

# Mantenimiento y actualización

## Revisión mensual (cuando diga "mantenimiento" o "revisión")
1. `npm outdated` → separar parches/minor (seguras) de majors (riesgo).
2. Actualizar parches/minor: `npm update`, luego tests + build.
3. Para cada major: leer el changelog o la guía de migración, explicarme el impacto en 2 líneas y actualizar de una en una, con commit por cada una.
4. `npm audit` → corregir lo que tenga arreglo sin majors forzados (no usar `--force` sin preguntarme).
5. Buscar código muerto y archivos sin uso; proponer antes de borrar.
6. Actualizar `CHANGELOG.md` (fecha, Agregado/Cambiado/Corregido) y la versión en `package.json` (semver).

## Corregir un bug
1. Reproducirlo: escribir primero un test que falle si es lógica de dominio.
2. Arreglarlo con el cambio mínimo.
3. Confirmar que el test pasa y que no se rompió nada más.

## Datos del usuario (crítico)
- Cualquier cambio de esquema Dexie: nueva `version(n)` con `.upgrade()` que transforme los datos existentes.
- Antes de un cambio de esquema, recordarme exportar el respaldo JSON.
- El import de respaldos debe aceptar versiones anteriores del formato.

## Despliegue
- `npm run build` sin errores ni warnings nuevos → desplegar (GitHub Pages o Netlify).
- Al cambiar el service worker, verificar que la app se actualice (aviso "Nueva versión disponible").
