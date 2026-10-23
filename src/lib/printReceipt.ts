import { formatCurrency, formatDate, formatPlate } from './utils';

function printHtmlInIframe(html: string) {
  // Eliminar iframes de impresión previos si existieran
  const existing = document.getElementById('electromecanica-print-frame');
  if (existing) {
    existing.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'electromecanica-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Esperar brevemente a que el motor Chromium procese los estilos antes de abrir el diálogo de impresión
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Error al imprimir mediante iframe aislado:', err);
      window.print();
    }
  }, 250);
}

export function printInvoiceDocument(invoice: any) {
  const isFactura = invoice.type === 'FACTURA';
  const docTitle = isFactura ? 'Factura Electrónica' : 'Boleta de Venta';
  const docNumber = invoice.invoiceNumber || 'B001-0001';
  const clientName = invoice.clientName || 'Cliente';
  const clientDoc = invoice.clientDoc || 'S/R';
  const clientAddress = invoice.clientAddress || '';
  const issueDate = formatDate(invoice.issueDate || invoice.createdAt || new Date());
  const paymentMethod = invoice.paymentMethod || 'EFECTIVO';
  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || 0);
  const igv = Number(invoice.igv || 0);
  const total = Number(invoice.total || 0);

  const itemsRows = items
    .map(
      (item: any, idx: number) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 12px;">${idx + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 12px; font-weight: 600;">${item.quantity || 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${item.description || ''}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px; font-variant-numeric: tabular-nums;">${formatCurrency(item.unitPrice || 0)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums;">${formatCurrency(item.subtotal || 0)}</td>
      </tr>
    `
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${docTitle} - ${docNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.4;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .company-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px 0;
      letter-spacing: -0.01em;
    }
    .company-subtitle {
      font-size: 12px;
      color: #4b5563;
      margin: 0 0 4px 0;
    }
    .company-meta {
      font-size: 11px;
      color: #6b7280;
      margin: 0;
    }
    .ruc-box {
      border: 2px solid #111827;
      border-radius: 6px;
      padding: 12px 16px;
      text-align: center;
      background: #fafafa;
      width: 240px;
    }
    .ruc-box .ruc-number {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .ruc-box .doc-type {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      color: #1b6c80;
      margin-bottom: 4px;
    }
    .ruc-box .doc-number {
      font-size: 15px;
      font-weight: 700;
      font-variant-numeric: tabular-nums; font-family: inherit;
      color: #111827;
    }
    .client-card {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 20px;
      background: #f9fafb;
    }
    .client-grid {
      width: 100%;
      border-collapse: collapse;
    }
    .client-grid td {
      padding: 3px 6px;
      font-size: 12px;
      vertical-align: top;
    }
    .label {
      color: #4b5563;
      font-weight: 600;
      width: 120px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      overflow: hidden;
    }
    .items-table th {
      background: #f3f4f6;
      color: #374151;
      font-weight: 600;
      font-size: 12px;
      padding: 8px 10px;
      border-bottom: 1px solid #d1d5db;
    }
    .totals-container {
      width: 100%;
      margin-bottom: 25px;
    }
    .totals-box {
      float: right;
      width: 260px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 10px 14px;
      background: #f9fafb;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 4px;
      color: #4b5563;
    }
    .totals-row.grand-total {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #d1d5db;
      font-size: 15px;
      font-weight: 700;
      color: #111827;
    }
    .footer-note {
      clear: both;
      padding-top: 25px;
      border-top: 1px dashed #d1d5db;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: middle;">
        <h1 class="company-title">Electromecánica Lince</h1>
        <p class="company-subtitle">Diagnóstico Computarizado & Electromecánica Automotriz Integral</p>
        <p class="company-meta">Jr. Soledad 330, Lince, Lima - Perú · Teléfono: (01) 704-3157</p>
        <p class="company-meta">Atención especializada en sistemas de inyección, arranque, alternadores y frenos</p>
      </td>
      <td style="width: 260px; text-align: right; vertical-align: middle;">
        <div class="ruc-box">
          <div class="ruc-number">R.U.C. 20601234567</div>
          <div class="doc-type">${docTitle}</div>
          <div class="doc-number">${docNumber}</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Client Details -->
  <div class="client-card">
    <table class="client-grid">
      <tr>
        <td class="label">${isFactura ? 'Razón Social:' : 'Señor(a):'}</td>
        <td style="font-weight: 600; color: #111827;">${clientName}</td>
        <td class="label">Fecha de Emisión:</td>
        <td>${issueDate}</td>
      </tr>
      <tr>
        <td class="label">${isFactura ? 'R.U.C.:' : 'DNI / Doc:'}</td>
        <td style="font-variant-numeric: tabular-nums; font-family: inherit; font-weight: 600;">${clientDoc}</td>
        <td class="label">Medio de Pago:</td>
        <td>${paymentMethod}</td>
      </tr>
      ${
        clientAddress
          ? `<tr><td class="label">Dirección:</td><td colspan="3">${clientAddress}</td></tr>`
          : ''
      }
    </table>
  </div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">Item</th>
        <th style="width: 60px; text-align: center;">Cant.</th>
        <th style="text-align: left;">Descripción / Concepto</th>
        <th style="width: 100px; text-align: right;">P. Unitario</th>
        <th style="width: 110px; text-align: right;">Importe</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-container">
    <div class="totals-box">
      ${
        isFactura
          ? `
        <div class="totals-row">
          <span>Op. Gravada:</span>
          <span style="font-variant-numeric: tabular-nums; font-family: inherit;">${formatCurrency(subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>I.G.V. (18%):</span>
          <span style="font-variant-numeric: tabular-nums; font-family: inherit;">${formatCurrency(igv)}</span>
        </div>
      `
          : ''
      }
      <div class="totals-row grand-total">
        <span>IMPORTE TOTAL:</span>
        <span style="font-variant-numeric: tabular-nums; font-family: inherit;">${formatCurrency(total)}</span>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer-note">
    <p style="margin: 0 0 4px 0;">Representación impresa del comprobante de pago electrónico.</p>
    <p style="margin: 0; font-weight: 500;">¡Gracias por confiar en Electromecánica Lince! Garantía y confianza en cada servicio.</p>
  </div>

</body>
</html>`;

  printHtmlInIframe(html);
}

export function printWorkOrderDocument(order: any) {
  const orderNumber = order.orderNumber || 'OT-0001';
  const plate = formatPlate(order.vehicle?.plate || '');
  const vehicleDesc = `${order.vehicle?.brand || ''} ${order.vehicle?.model || ''}`.trim() || 'Vehículo';
  const mileage = order.mileageAtService || order.vehicle?.mileage;
  const clientName = order.client?.name || 'Cliente';
  const clientPhone = order.client?.phone || '';
  const technician = order.technicianName || 'Timoteo Pariona';
  const dateStr = formatDate(order.createdAt || new Date());
  const statusStr = order.status || 'PENDIENTE';

  const servicesRows = (order.services || [])
    .map(
      (s: any) => `
      <tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${s.description}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px; font-variant-numeric: tabular-nums;">${formatCurrency(s.cost || 0)}</td>
      </tr>
    `
    )
    .join('');

  const itemsRows = (order.items || [])
    .map(
      (i: any) => `
      <tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 12px; font-weight: 600;">${i.quantity || 1}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${i.description}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px; font-variant-numeric: tabular-nums;">${formatCurrency(i.unitPrice || 0)}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums;">${formatCurrency((i.quantity || 1) * (i.unitPrice || 0))}</td>
      </tr>
    `
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Orden de Trabajo ${orderNumber} - ${plate}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.4;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
    .company-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px 0;
    }
    .company-subtitle {
      font-size: 12px;
      color: #4b5563;
      margin: 0 0 3px 0;
    }
    .order-box {
      border: 2px solid #1b6c80;
      border-radius: 6px;
      padding: 10px 16px;
      text-align: center;
      background: #eef6f8;
      width: 220px;
    }
    .order-box .order-tag {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #1b6c80;
    }
    .order-box .order-num {
      font-size: 18px;
      font-weight: 700;
      font-variant-numeric: tabular-nums; font-family: inherit;
      color: #111827;
    }
    .info-grid {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #f9fafb;
      margin-bottom: 16px;
    }
    .info-grid td {
      padding: 6px 10px;
      font-size: 12px;
      vertical-align: top;
      border-bottom: 1px solid #e5e7eb;
    }
    .label {
      color: #4b5563;
      font-weight: 600;
      width: 130px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1b6c80;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin: 16px 0 6px 0;
    }
    .table-clean {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      overflow: hidden;
    }
    .table-clean th {
      background: #f3f4f6;
      color: #374151;
      font-weight: 600;
      font-size: 12px;
      padding: 6px 10px;
      border-bottom: 1px solid #d1d5db;
    }
    .totals-box {
      float: right;
      width: 250px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 10px 14px;
      background: #f9fafb;
      margin-bottom: 25px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 4px;
      color: #4b5563;
    }
    .totals-row.grand-total {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #d1d5db;
      font-size: 15px;
      font-weight: 700;
      color: #111827;
    }
    .signatures {
      clear: both;
      width: 100%;
      margin-top: 50px;
      border-collapse: collapse;
    }
    .signatures td {
      width: 50%;
      text-align: center;
      padding: 0 30px;
      font-size: 12px;
      color: #4b5563;
    }
    .sig-line {
      border-top: 1px solid #9ca3af;
      margin-bottom: 6px;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: middle;">
        <h1 class="company-title">Electromecánica Lince</h1>
        <p class="company-subtitle">Jr. Soledad 330, Lince, Lima · Teléfono: (01) 704-3157</p>
        <p style="margin: 0; font-size: 11px; color: #6b7280;">Especialistas en Electricidad Automotriz, Inyección Electrónica y Diagnóstico OBD2</p>
      </td>
      <td style="width: 230px; text-align: right; vertical-align: middle;">
        <div class="order-box">
          <div class="order-tag">Orden de Trabajo</div>
          <div class="order-num">${orderNumber}</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Unidad y Propietario -->
  <table class="info-grid">
    <tr>
      <td class="label">Placa Vehicular:</td>
      <td style="font-weight: 700; font-variant-numeric: tabular-nums; font-family: inherit; font-size: 14px; color: #111827;">${plate}</td>
      <td class="label">Fecha Ingreso:</td>
      <td>${dateStr}</td>
    </tr>
    <tr>
      <td class="label">Vehículo:</td>
      <td style="font-weight: 600;">${vehicleDesc}</td>
      <td class="label">Kilometraje:</td>
      <td style="font-variant-numeric: tabular-nums; font-family: inherit;">${mileage ? `${Number(mileage).toLocaleString()} km` : 'No registrado'}</td>
    </tr>
    <tr>
      <td class="label">Titular / Cliente:</td>
      <td style="font-weight: 600;">${clientName}</td>
      <td class="label">Teléfono:</td>
      <td>${clientPhone || 'S/R'}</td>
    </tr>
    <tr>
      <td class="label">Técnico Asignado:</td>
      <td>${technician}</td>
      <td class="label">Estado Actual:</td>
      <td style="font-weight: 600;">${statusStr}</td>
    </tr>
  </table>

  <!-- Diagnóstico y Falla -->
  <div style="margin-bottom: 16px; border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; background: #fff;">
    <div style="font-size: 11px; font-weight: 700; color: #4b5563; text-transform: uppercase; margin-bottom: 3px;">Falla Reportada / Motivo de Ingreso:</div>
    <div style="font-size: 12px; color: #111827; margin-bottom: 8px;">${order.issueDescription || 'Sin motivo especificado'}</div>
    ${
      order.diagnostic
        ? `
      <div style="font-size: 11px; font-weight: 700; color: #1b6c80; text-transform: uppercase; margin-bottom: 3px; border-top: 1px dashed #e5e7eb; padding-top: 6px;">Diagnóstico del Mecánico:</div>
      <div style="font-size: 12px; color: #111827;">${order.diagnostic}</div>
    `
        : ''
    }
  </div>

  <!-- Servicios / Mano de Obra -->
  ${
    order.services && order.services.length > 0
      ? `
    <div class="section-title">Trabajos y Servicios Realizados</div>
    <table class="table-clean">
      <thead>
        <tr>
          <th style="text-align: left;">Descripción de la Labor</th>
          <th style="width: 120px; text-align: right;">Costo (S/)</th>
        </tr>
      </thead>
      <tbody>
        ${servicesRows}
      </tbody>
    </table>
  `
      : ''
  }

  <!-- Repuestos e Insumos -->
  ${
    order.items && order.items.length > 0
      ? `
    <div class="section-title">Repuestos y Materiales Instalados</div>
    <table class="table-clean">
      <thead>
        <tr>
          <th style="width: 60px; text-align: center;">Cant.</th>
          <th style="text-align: left;">Descripción del Repuesto</th>
          <th style="width: 100px; text-align: right;">P. Unitario</th>
          <th style="width: 110px; text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
  `
      : ''
  }

  <!-- Totales -->
  <div style="width: 100%;">
    <div class="totals-box">
      <div class="totals-row">
        <span>Mano de obra:</span>
        <span style="font-variant-numeric: tabular-nums; font-family: inherit;">${formatCurrency(order.laborTotal || 0)}</span>
      </div>
      <div class="totals-row">
        <span>Repuestos:</span>
        <span style="font-variant-numeric: tabular-nums; font-family: inherit;">${formatCurrency(order.partsTotal || 0)}</span>
      </div>
      ${
        order.discount && Number(order.discount) > 0
          ? `
        <div class="totals-row" style="color: #b91c1c;">
          <span>Descuento:</span>
          <span style="font-variant-numeric: tabular-nums; font-family: inherit;">-${formatCurrency(order.discount)}</span>
        </div>
      `
          : ''
      }
      <div class="totals-row grand-total">
        <span>TOTAL NETO:</span>
        <span style="font-variant-numeric: tabular-nums; font-family: inherit;">${formatCurrency(order.totalAmount || 0)}</span>
      </div>
    </div>
  </div>

  <!-- Firmas -->
  <table class="signatures">
    <tr>
      <td>
        <div class="sig-line"></div>
        <div><strong>${technician}</strong></div>
        <div style="font-size: 11px;">Jefe de Taller / Electromecánica Lince</div>
      </td>
      <td>
        <div class="sig-line"></div>
        <div><strong>${clientName}</strong></div>
        <div style="font-size: 11px;">Conformidad del Cliente</div>
      </td>
    </tr>
  </table>

</body>
</html>`;

  printHtmlInIframe(html);
}
