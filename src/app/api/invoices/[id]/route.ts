import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        workOrder: {
          include: {
            vehicle: true,
            client: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Comprobante no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener comprobante' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, paymentMethod } = body;

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: status !== undefined ? status : undefined,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : undefined,
      },
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar comprobante' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Comprobante eliminado' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar comprobante' },
      { status: 500 }
    );
  }
}
