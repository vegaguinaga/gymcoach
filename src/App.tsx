import { useEffect } from 'react'
import { sincronizarBiblioteca } from './data/repos/ejercicios'
import { FichaEjercicio } from './features/biblioteca/FichaEjercicio'
import { PantallaBiblioteca } from './features/biblioteca/PantallaBiblioteca'
import { PantallaPerfil } from './features/perfil/PantallaPerfil'
import { BarraNavegacion } from './ui/BarraNavegacion'
import { Pantalla } from './ui/Pantalla'
import { useRuta } from './ui/useRuta'

// Pantallas provisionales: cada fase las irá reemplazando por las reales
const PROVISIONAL = {
  rutina: { titulo: 'Mi rutina', texto: 'Aquí verás tu plan semanal (fase 2).' },
  entrenar: { titulo: 'Entrenar', texto: 'Aquí registrarás tu sesión en vivo (fase 3).' },
  progreso: { titulo: 'Progreso', texto: 'Aquí verás tu historial y gráficas (fase 4).' },
}

export default function App() {
  const { ruta, param } = useRuta()

  useEffect(() => {
    sincronizarBiblioteca().catch((e: unknown) => console.error('No se pudo cargar la biblioteca', e))
  }, [])

  let contenido
  if (ruta === 'perfil') contenido = <PantallaPerfil />
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
