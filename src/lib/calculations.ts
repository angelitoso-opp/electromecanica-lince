/**
 * Funciones puras de cálculo financiero, inventario y correlatividad
 * Compartidas entre las rutas de API, componentes y pruebas unitarias.
 */

export interface TaxBreakdown {
  subtotal: number;
  igv: number;
  total: number;
}

/**
 * Desglosa la Base Imponible y el IGV (18%) conforme a la normativa tributaria peruana.
 * subtotal + igv = total con precisión de dos decimales.
 */
export function calculateTaxBreakdown(total: number): TaxBreakdown {
  const safeTotal = Math.max(0, Number(total) || 0);
  const subtotal = Number((safeTotal / 1.18).toFixed(2));
  const igv = Number((safeTotal - subtotal).toFixed(2));
  return {
    subtotal,
    igv,
    total: Number(safeTotal.toFixed(2)),
  };
}

/**
 * Calcula el importe total de una orden de trabajo aplicando mano de obra,
 * repuestos y deducción de descuento comercial acordado.
 */
export function calculateOrderTotal(
  laborTotal: number,
  partsTotal: number,
  discount: number
): number {
  const labor = Math.max(0, Number(laborTotal) || 0);
  const parts = Math.max(0, Number(partsTotal) || 0);
  const disc = Math.max(0, Number(discount) || 0);
  const net = Math.max(0, labor + parts - disc);
  return Number(net.toFixed(2));
}

/**
 * Genera el siguiente código correlativo numérico a partir de los registros existentes.
 * Evita colisiones de ordenamiento alfabético cuando la numeración supera 9,999 (ej. OT-10000).
 */
export function calculateNextSequence(
  existingCodes: string[],
  prefix: string
): string {
  let maxNum = 0;
  for (const code of existingCodes) {
    if (!code) continue;
    const match = code.match(/\d+$/);
    if (match) {
      const n = parseInt(match[0], 10);
      if (!isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Valida la disponibilidad de stock en almacén para un repuesto.
 * Si no hay suficientes existencias, indica cuántas unidades faltan.
 */
export function validateStockAvailability(
  requestedQty: number,
  availableStock: number
): {
  valid: boolean;
  missing: number;
  available: number;
  requested: number;
} {
  const req = Math.max(0, Math.floor(Number(requestedQty) || 0));
  const avail = Math.max(0, Math.floor(Number(availableStock) || 0));
  const valid = avail >= req;
  const missing = valid ? 0 : req - avail;
  return {
    valid,
    missing,
    available: avail,
    requested: req,
  };
}
