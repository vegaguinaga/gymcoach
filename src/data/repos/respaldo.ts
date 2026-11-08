// Exportar e importar todos los datos del usuario (copia de seguridad en un archivo JSON).
import { crearRespaldo, nombreArchivo, type Respaldo } from '../../domain/respaldo'
import { db } from '../db'

const TABLAS = () => [db.perfil, db.pesosCorporales, db.rutinas, db.sesiones, db.medidas]

/** Lee todas las tablas del usuario en una sola transacción (una foto consistente). */
export async function exportarDatos(ahora = new Date()): Promise<Respaldo> {
  return db.transaction('r', TABLAS(), async () =>
    crearRespaldo(
      {
        perfil: await db.perfil.toArray(),
        pesosCorporales: await db.pesosCorporales.toArray(),
        rutinas: await db.rutinas.toArray(),
        sesiones: await db.sesiones.toArray(),
        medidas: await db.medidas.toArray(),
      },
      ahora,
    ),
  )
}

/** Descarga un respaldo de los datos actuales como archivo .json. */
export async function descargarRespaldo(): Promise<void> {
  const ahora = new Date()
  const respaldo = await exportarDatos(ahora)
  const url = URL.createObjectURL(new Blob([JSON.stringify(respaldo)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo(ahora)
  a.click()
  // Se libera después: algunos navegadores móviles leen el enlace de forma asíncrona
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  await marcarCopia(ahora)
}

/** Recuerda cuándo se hizo la última copia (para el recordatorio). Sin perfil no hay nada que guardar. */
async function marcarCopia(ahora = new Date()): Promise<void> {
  await db.perfil.update(1, { ultimaCopia: ahora.toISOString() })
}

/**
 * Reemplaza los datos del usuario por los del respaldo (ya validado). Todo o nada: si algo falla,
 * la transacción se deshace y los datos actuales quedan intactos. Conserva los ids para que
 * las sesiones sigan apuntando a sus rutinas.
 */
export async function importarDatos(respaldo: Respaldo): Promise<void> {
  await db.transaction('rw', TABLAS(), async () => {
    await Promise.all(TABLAS().map((t) => t.clear()))
    await db.perfil.bulkPut(respaldo.perfil)
    await db.pesosCorporales.bulkPut(respaldo.pesosCorporales)
    await db.rutinas.bulkPut(respaldo.rutinas)
    await db.sesiones.bulkPut(respaldo.sesiones)
    await db.medidas.bulkPut(respaldo.medidas)
  })
  // Los datos actuales son ahora los de un archivo que el usuario ya tiene guardado
  await marcarCopia()
}
