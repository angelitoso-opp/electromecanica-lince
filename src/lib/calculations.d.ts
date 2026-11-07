export interface TaxBreakdown {
  subtotal: number;
  igv: number;
  total: number;
}

export declare function calculateTaxBreakdown(total: number): TaxBreakdown;

export declare function calculateOrderTotal(
  laborTotal: number,
  partsTotal: number,
  discount: number
): number;

export declare function calculateNextSequence(
  existingCodes: string[],
  prefix: string
): string;

export declare function validateStockAvailability(
  requestedQty: number,
  availableStock: number
): {
  valid: boolean;
  missing: number;
  available: number;
  requested: number;
};
