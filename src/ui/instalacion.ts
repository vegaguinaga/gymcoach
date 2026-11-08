// Instalar la app en la pantalla de inicio. Android/Chrome ofrece un aviso propio (beforeinstallprompt);
// iOS no: allí solo se puede desde el menú Compartir.
import { useSyncExternalStore } from 'react'

export type Plataforma = 'ios' | 'android' | 'otra'

/** Plataforma según el user agent. El iPad moderno se presenta como Mac, pero tiene pantalla táctil. */
export function detectarPlataforma(userAgent: string, puntosTactiles = 0): Plataforma {
  if (/iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && puntosTactiles > 1)) return 'ios'
  if (/android/i.test(userAgent)) return 'android'
  return 'otra'
}

/** ¿Se abrió como app instalada (sin barra del navegador)? */
export function estaInstalada(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let aviso: BeforeInstallPromptEvent | null = null
let instalada = false
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((f) => f())

/**
 * Se llama al arrancar (main.tsx): el evento puede llegar antes de que se abra Perfil,
 * así que se guarda para usarlo cuando el usuario toque "Instalar".
 */
export function escucharInstalacion(): void {
  instalada = estaInstalada()
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // sin la mini barra automática: lo ofrecemos nosotros en Perfil
    aviso = e as BeforeInstallPromptEvent
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    aviso = null
    instalada = true
    avisar()
  })
}

interface EstadoInstalacion {
  instalada: boolean
  /** El navegador permite instalar con un botón (Android/Chrome de escritorio) */
  puedeInstalar: boolean
}

let foto: EstadoInstalacion = { instalada: false, puedeInstalar: false }
function leer(): EstadoInstalacion {
  if (foto.instalada !== instalada || foto.puedeInstalar !== (aviso !== null))
    foto = { instalada, puedeInstalar: aviso !== null }
  return foto
}
function suscribir(f: () => void) {
  oyentes.add(f)
  return () => oyentes.delete(f)
}

export function useInstalacion(): EstadoInstalacion {
  return useSyncExternalStore(suscribir, leer)
}

/** Muestra el aviso de instalación del navegador. Devuelve true si el usuario aceptó. */
export async function instalar(): Promise<boolean> {
  if (!aviso) return false
  const evento = aviso
  aviso = null // solo se puede usar una vez
  await evento.prompt()
  const { outcome } = await evento.userChoice
  avisar()
  return outcome === 'accepted'
}
