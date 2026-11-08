import { BarraNavegacion } from './ui/BarraNavegacion'
import { Pantalla } from './ui/Pantalla'
import { useRuta, type Ruta } from './ui/useRuta'

// Pantallas provisionales: cada fase las irá reemplazando por las reales
const PROVISIONAL: Record<Ruta, { titulo: string; texto: string }> = {
  rutina: { titulo: 'Mi rutina', texto: 'Aquí verás tu plan semanal (fase 2).' },
  entrenar: { titulo: 'Entrenar', texto: 'Aquí registrarás tu sesión en vivo (fase 3).' },
  progreso: { titulo: 'Progreso', texto: 'Aquí verás tu historial y gráficas (fase 4).' },
  perfil: { titulo: 'Perfil', texto: 'Aquí configurarás tu objetivo y equipo (fase 1).' },
}

export default function App() {
  const ruta = useRuta()
  const { titulo, texto } = PROVISIONAL[ruta]

  return (
    <>
      <Pantalla titulo={titulo}>
        <p className="text-neutral-400">{texto}</p>
      </Pantalla>
      <BarraNavegacion actual={ruta} />
    </>
  )
}
