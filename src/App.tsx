import { lazy, Suspense, useEffect } from 'react'
import { sincronizarBiblioteca } from './data/repos/ejercicios'
import { PantallaEntrenar } from './features/entrenar/PantallaEntrenar'
import { FichaEjercicio } from './features/biblioteca/FichaEjercicio'
import { PantallaBiblioteca } from './features/biblioteca/PantallaBiblioteca'
import { PantallaPerfil } from './features/perfil/PantallaPerfil'
import { PantallaRutina } from './features/rutina/PantallaRutina'
import { AvisoActualizacion } from './ui/AvisoActualizacion'
import { BarraNavegacion } from './ui/BarraNavegacion'
import { Pantalla } from './ui/Pantalla'
import { useRuta } from './ui/useRuta'

// Carga diferida: Progreso usa Recharts (~100 KB), que solo se descarga al abrir esa pestaña
const PantallaProgreso = lazy(() => import('./features/progreso/PantallaProgreso'))

export default function App() {
  const { ruta, param } = useRuta()

  useEffect(() => {
    sincronizarBiblioteca().catch((e: unknown) => console.error('No se pudo cargar la biblioteca', e))
  }, [])

  let contenido
  if (ruta === 'perfil') contenido = <PantallaPerfil />
  else if (ruta === 'rutina') contenido = <PantallaRutina />
  else if (ruta === 'entrenar') contenido = <PantallaEntrenar />
  else if (ruta === 'ejercicios')
    contenido = param ? <FichaEjercicio id={param} /> : <PantallaBiblioteca />
  else
    contenido = (
      <Suspense
        fallback={
          <Pantalla titulo="Progreso">
            <p className="text-neutral-400">Cargando…</p>
          </Pantalla>
        }
      >
        <PantallaProgreso param={param} />
      </Suspense>
    )

  return (
    <>
      <AvisoActualizacion />
      {contenido}
      {/* La biblioteca cuelga de Perfil: esa pestaña queda marcada */}
      <BarraNavegacion actual={ruta === 'ejercicios' ? 'perfil' : ruta} />
    </>
  )
}
