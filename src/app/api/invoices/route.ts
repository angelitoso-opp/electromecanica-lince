import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateNextSequence, calculateTaxBreakdown } from '@/lib/calculations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const query = searchParams.get('q')?.trim() || '';

    const whereClause: any = {};

    if (type && type !== 'TODOS') {
      whereClause.type = type;
    }

    if (query) {
      whereClause.OR = [
        { invoiceNumber: { contains: query.toUpperCase() } },
        { clientName: { contains: query } },
        { clientDoc: { contains: query } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        items: true,
        workOrder: {
          include: {
            vehicle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Error al listar comprobantes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type = 'BOLETA', // FACTURA o BOLETA
      clientName,
      clientDoc,
      clientAddress,
      clientPhone,
      workOrderId,
      items = [], // [{ description, quantity, unitPrice }]
      paymentMethod = 'EFECTIVO',
      status = 'EMITIDA',
    } = body;

    if (!clientName || !clientDoc || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nombre, documento y conceptos a facturar son obligatorios' },
        { status: 400 }
      );
    }

    // 1. Evitar duplicar comprobante activo para una misma orden (Hallazgo #8)
    if (workOrderId) {
      const existing = await prisma.invoice.findFirst({
        where: { workOrderId, status: { not: 'ANULADA' } },
        select: { invoiceNumber: true },
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: `La orden de trabajo ya cuenta con un comprobante emitido (${existing.invoiceNumber}).`,
          },
          { status: 400 }
        );
      }
    }

    // 2. Generar correlativo numérico robusto superando 9,999 (Hallazgo #11)
    const prefix = type === 'FACTURA' ? 'F001' : 'B001';
    const allInvoices = await prisma.invoice.findMany({
      where: { type },
      select: { invoiceNumber: true },
    });
    const invoiceNumber = calculateNextSequence(
      allInvoices.map((i) => i.invoiceNumber),
      prefix
    );

    // 3. Calcular montos
    const rawTotal = items.reduce(
      (sum: number, item: any) =>
        sum + (parseInt(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
      0
    );

    // 4. Desglose contable oficial de IGV (18%) conforme a normativa peruana (Hallazgo #7)
    const { subtotal, igv, total } = calculateTaxBreakdown(rawTotal);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        type,
        clientName,
        clientDoc,
        clientAddress: clientAddress || null,
        clientPhone: clientPhone || null,
        workOrderId: workOrderId || null,
        subtotal,
        igv,
        total: +total.toFixed(2),
        paymentMethod,
        status,
        items: {
          create: items.map((i: any) => {
            const qty = parseInt(i.quantity) || 1;
            const price = parseFloat(i.unitPrice) || 0;
            return {
              description: i.description,
              quantity: qty,
              unitPrice: price,
              subtotal: +(qty * price).toFixed(2),
            };
          }),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Error al emitir comprobante' },
      { status: 500 }
    );
  }
}
