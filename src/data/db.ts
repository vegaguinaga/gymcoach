// Base de datos local (IndexedDB vía Dexie). Todo vive en el dispositivo: funciona offline.
// REGLA: para cambiar el esquema, agrega un nuevo db.version(n+1) con su .upgrade();
// nunca modifiques una versión existente ni borres datos del usuario.
import { Dexie, type EntityTable } from 'dexie'
import type { BodyMeasurement, BodyWeightEntry, Exercise, Profile, Routine, WorkoutSession } from '../domain/tipos'

export const db = new Dexie('gymcoach') as Dexie & {
  perfil: EntityTable<Profile, 'id'>
  pesosCorporales: EntityTable<BodyWeightEntry, 'id'>
  ejercicios: EntityTable<Exercise, 'id'>
  rutinas: EntityTable<Routine, 'id'>
  sesiones: EntityTable<WorkoutSession, 'id'>
  medidas: EntityTable<BodyMeasurement, 'id'>
}

// Versión 1 (Fase 1): perfil, peso corporal y biblioteca de ejercicios
db.version(1).stores({
  perfil: 'id',
  pesosCorporales: '++id, fecha',
  ejercicios: 'id, grupoPrincipal, equipo',
})

// Versión 2 (Fase 2): rutinas generadas. Tabla nueva: no hay datos que migrar
// y las tablas de la versión 1 se conservan tal cual.
db.version(2).stores({
  rutinas: '++id, creada',
})

// Versión 3 (Fase 3): sesiones de entrenamiento. Tabla nueva, sin datos que migrar.
db.version(3).stores({
  sesiones: '++id, fecha, estado',
})

// Versión 4 (Fase 10): medidas corporales (cm). Tabla nueva, sin datos que migrar.
db.version(4).stores({
  medidas: '++id, fecha',
})
