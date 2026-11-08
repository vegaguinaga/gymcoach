// El navegador solo deja sonar audio si se activó durante un toque del usuario:
// se prepara al marcar una serie (prepararAviso) y suena al terminar el descanso.
let audio: AudioContext | null = null

export function prepararAviso() {
  try {
    audio ??= new AudioContext()
    void audio.resume()
  } catch {
    // Navegador sin Web Audio: solo habrá vibración
  }
}

/** Pitido corto + vibración al terminar el descanso (la vibración no existe en iPhone). */
export function avisarFin() {
  navigator.vibrate?.([200, 100, 200])
  if (!audio) return
  const osc = audio.createOscillator()
  osc.frequency.value = 880
  osc.connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + 0.25)
}
