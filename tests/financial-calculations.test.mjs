import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTaxBreakdown,
  calculateOrderTotal,
  calculateNextSequence,
  validateStockAvailability,
} from '../src/lib/calculations.js';

test('Cálculo financiero: Desglose de Base Imponible e IGV (18%) conforme a SUNAT', () => {
  const result = calculateTaxBreakdown(118.00);

  assert.equal(result.subtotal, 100.00, 'La base imponible para S/ 118 debe ser exactamente S/ 100.00');
  assert.equal(result.igv, 18.00, 'El IGV (18%) para S/ 118 debe ser exactamente S/ 18.00');
  assert.equal(result.total, 118.00, 'El total debe mantenerse idéntico');
  assert.equal(+(result.subtotal + result.igv).toFixed(2), result.total, 'Base + IGV debe sumar exactamente el total');
});

test('Cálculo financiero: Desglose con centavos fraccionarios (cuadre al centavo)', () => {
  const result = calculateTaxBreakdown(250.00);

  assert.equal(result.subtotal, 211.86, 'Subtotal redondeado formalmente');
  assert.equal(result.igv, 38.14, 'IGV cuadrante con base imponible');
  assert.equal(+(result.subtotal + result.igv).toFixed(2), 250.00, 'La suma debe cuadrar exactamente S/ 250.00');
});

test('Cálculo de orden de trabajo: Total con descuento comercial deducido', () => {
  const labor = 250.00;
  const parts = 400.00;
  const discount = 50.00;
  const total = calculateOrderTotal(labor, parts, discount);

  assert.equal(total, 600.00, 'Mano de obra (250) + Repuestos (400) - Descuento (50) debe dar 600.00');
});

test('Validación de inventario: Detección estricta de faltantes y stock suficiente', () => {
  // Caso 1: Hay stock suficiente
  const okCheck = validateStockAvailability(2, 5);
  assert.equal(okCheck.valid, true);
  assert.equal(okCheck.missing, 0);

  // Caso 2: Stock insuficiente (evita decrementos a ciegas y stock fantasma en rollback)
  const failCheck = validateStockAvailability(4, 1);
  assert.equal(failCheck.valid, false);
  assert.equal(failCheck.missing, 3, 'Deben faltar exactamente 3 unidades');
  assert.equal(failCheck.available, 1);
  assert.equal(failCheck.requested, 4);
});

test('Correlatividad segura: Supera el umbral alfanumérico de 9,999 sin colisión', () => {
  const existingOrders = ['OT-0001', 'OT-0500', 'OT-9999', 'OT-10000'];
  const next = calculateNextSequence(existingOrders, 'OT');

  assert.equal(next, 'OT-10001', 'El siguiente correlativo a OT-10000 debe ser OT-10001 y no volver a OT-10000');
});
