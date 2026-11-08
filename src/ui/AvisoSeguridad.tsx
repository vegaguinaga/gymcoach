/** Aviso de seguridad que se muestra en Perfil y en las fichas de ejercicios. */
export function AvisoSeguridad({ compuesto = false }: { compuesto?: boolean }) {
  return (
    <aside className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
      <p>
        {compuesto
          ? 'Calienta 5–10 min y haz 1–2 series de aproximación con poco peso antes de empezar. '
          : 'Prioriza la técnica: los ejercicios nuevos empiézalos con poco peso. '}
        <strong>Si sientes dolor agudo, detente.</strong> Esta app no sustituye a un profesional.
      </p>
    </aside>
  )
}
