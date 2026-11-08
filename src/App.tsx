import { useEffect } from 'react'
import { sincronizarBiblioteca } from './data/repos/ejercicios'
import { PantallaEntrenar } from './features/entrenar/PantallaEntrenar'
import { FichaEjercicio } from './features/biblioteca/FichaEjercicio'
import { PantallaBiblioteca } from './features/biblioteca/PantallaBiblioteca'
import { PantallaPerfil } from './features/perfil/PantallaPerfil'
import { PantallaRutina } from './features/rutina/PantallaRutina'
import { BarraNavegacion } from './ui/BarraNavegacion'
import { Pantalla } from './ui/Pantalla'
import { useRuta } from './ui/useRuta'

// Pantallas provisionales: cada fase las irá reemplazando por las reales
const PROVISIONAL = {
  progreso: { titulo: 'Progreso', texto: 'Aquí verás tu historial y gráficas (fase 4).' },
}

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
      <Pantalla titulo={PROVISIONAL[ruta].titulo}>
        <p className="text-neutral-400">{PROVISIONAL[ruta].texto}</p>
      </Pantalla>
    )

  return (
    <>
      {contenido}
      {/* La biblioteca cuelga de Perfil: esa pestaña queda marcada */}
      <BarraNavegacion actual={ruta === 'ejercicios' ? 'perfil' : ruta} />
    </>
  )
}
