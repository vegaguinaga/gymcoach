import { useState } from 'react'

/**
 * Input numérico que guarda al salir del campo (así se puede escribir "22." sin que se borre).
 * Si el valor cambia desde fuera mientras no se edita, se actualiza.
 */
export function CampoNumero({
  etiqueta,
  valor,
  decimales = false,
  alCambiar,
}: {
  etiqueta: string
  valor: number
  decimales?: boolean
  alCambiar: (n: number) => void
}) {
  const [texto, setTexto] = useState(String(valor))
  const [editando, setEditando] = useState(false)
  const mostrado = editando ? texto : String(valor)

  function guardar() {
    setEditando(false)
    const n = Number(texto.replace(',', '.'))
    if (texto.trim() !== '' && Number.isFinite(n) && n >= 0 && n !== valor) alCambiar(n)
  }

  return (
    <input
      aria-label={etiqueta}
      inputMode={decimales ? 'decimal' : 'numeric'}
      value={mostrado}
      onFocus={(e) => {
        setTexto(String(valor))
        setEditando(true)
        e.target.select()
      }}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="min-h-11 w-full min-w-0 rounded-lg border border-neutral-700 bg-neutral-950 px-2 text-center text-lg"
    />
  )
}
