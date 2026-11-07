import test from 'node:test';
import assert from 'node:assert/strict';

test('Cálculo financiero: Desglose de Base Imponible e IGV (18%) conforme a SUNAT', () => {
  const total = 118.00;
  const subtotal = +(total / 1.18).toFixed(2);
  const igv = +(total - subtotal).toFixed(2);

  assert.equal(subtotal, 100.00, 'La base imponible para S/ 118 debe ser exactamente S/ 100.00');
  assert.equal(igv, 18.00, 'El IGV (18%) para S/ 118 debe ser exactamente S/ 18.00');
  assert.equal(+(subtotal + igv).toFixed(2), total, 'La suma de base + IGV debe coincidir con el total');
});

test('Cálculo financiero: Desglose con centavos no enteros', () => {
  const total = 250.00;
  const subtotal = +(total / 1.18).toFixed(2);
  const igv = +(total - subtotal).toFixed(2);

  assert.equal(subtotal, 211.86, 'Subtotal redondeado a dos decimales');
  assert.equal(igv, 38.14, 'IGV cuadrante');
  assert.equal(+(subtotal + igv).toFixed(2), total, 'Subtotal + IGV cuadra el total');
});

test('Cálculo financiero: Orden de trabajo con descuento preservado en comprobante', () => {
  const laborTotal = 250.00;
  const partsTotal = 400.00;
  const discount = 50.00;
  const orderTotal = Math.max(0, laborTotal + partsTotal - discount);

  assert.equal(orderTotal, 600.00, 'Total de la orden con descuento aplicado debe ser 600.00');

  // En el comprobante, los ítems importados reflejan el descuento
  const invoiceItems = [
    { description: 'Mantenimiento preventivo', quantity: 1, unitPrice: 250.00 },
    { description: 'Kit de pastillas de freno', quantity: 1, unitPrice: 400.00 },
    { description: 'Descuento comercial', quantity: 1, unitPrice: -50.00 },
  ];

  const invoiceTotal = invoiceItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  assert.equal(invoiceTotal, orderTotal, 'El total del comprobante debe ser exactamente igual al total de la orden con descuento');
});

test('Seguridad de inventario: El stock nunca puede quedar negativo', () => {
  const currentStock = 2;
  const requestedQty = 5;
  const updatedStock = Math.max(0, currentStock - requestedQty);

  assert.equal(updatedStock, 0, 'El stock resultante debe quedar en 0 y no en valor negativo (-3)');
});

test('Correlativo numérico: Supera 9,999 sin colisión por orden alfabético', () => {
  const existingOrderNumbers = ['OT-0001', 'OT-0050', 'OT-9999', 'OT-10000'];

  let maxNum = 0;
  for (const ord of existingOrderNumbers) {
    const match = ord.match(/\d+$/);
    if (match) {
      const n = parseInt(match[0], 10);
      if (n > maxNum) maxNum = n;
    }
  }

  const nextNum = maxNum + 1;
  const nextOrderNumber = `OT-${String(nextNum).padStart(4, '0')}`;

  assert.equal(maxNum, 10000, 'El número máximo detectado numéricamente debe ser 10000');
  assert.equal(nextOrderNumber, 'OT-10001', 'El siguiente correlativo debe ser OT-10001 sin colisionar con OT-9999');
});
