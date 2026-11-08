// Utilidades de unidades. Convención de la app: pesos en kg con 1 decimal.

/** Redondea un peso en kg a 1 decimal (ej. 62.46 → 62.5). */
export function redondearKg(kg: number): number {
  return Math.round(kg * 10) / 10
}
