// Base de datos local (IndexedDB vía Dexie). Todo vive en el dispositivo: funciona offline.
// REGLA: para cambiar el esquema, agrega un nuevo db.version(n+1) con su .upgrade();
// nunca modifiques una versión existente ni borres datos del usuario.
import { Dexie, type EntityTable } from 'dexie'
import type { BodyWeightEntry, Exercise, Profile } from '../domain/tipos'

export const db = new Dexie('gymcoach') as Dexie & {
  perfil: EntityTable<Profile, 'id'>
  pesosCorporales: EntityTable<BodyWeightEntry, 'id'>
  ejercicios: EntityTable<Exercise, 'id'>
}

// Versión 1 (Fase 1): perfil, peso corporal y biblioteca de ejercicios
db.version(1).stores({
  perfil: 'id',
  pesosCorporales: '++id, fecha',
  ejercicios: 'id, grupoPrincipal, equipo',
})
