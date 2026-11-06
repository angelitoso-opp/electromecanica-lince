import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalClients,
      totalVehicles,
      ordersSummary,
      recentOrders,
      inventorySummary,
      invoicesCount,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.vehicle.count(),
      // Solo campos escalares necesarios para métricas financieras (evita cargar miles de notas y relaciones en memoria)
      prisma.workOrder.findMany({
        select: {
          status: true,
          isPaid: true,
          totalAmount: true,
          laborTotal: true,
          partsTotal: true,
        },
      }),
      // Solo las últimas 8 órdenes con sus detalles para la vista del dashboard
      prisma.workOrder.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          vehicle: true,
          services: true,
          items: true,
        },
      }),
      prisma.inventoryItem.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          brand: true,
          category: true,
          stock: true,
          minStock: true,
          unitPrice: true,
          unit: true,
        },
        orderBy: { stock: 'asc' },
      }),
      prisma.invoice.count(),
    ]);

    const activeStatuses = new Set(['PENDIENTE', 'EN_PROCESO', 'ESPERANDO_REPUESTOS']);
    const activeOrders = ordersSummary.filter((o) => activeStatuses.has(o.status)).length;
    const readyOrders = ordersSummary.filter((o) => o.status === 'LISTO').length;

    const lowStockItems = inventorySummary.filter((item) => item.stock <= item.minStock);

    const validOrders = ordersSummary.filter((o) => o.status !== 'CANCELADO');
    const totalRevenue = +validOrders
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      .toFixed(2);
    const totalCollected = +validOrders
      .filter((o) => o.isPaid)
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      .toFixed(2);
    const pendingCollection = +(totalRevenue - totalCollected).toFixed(2);

    const laborRevenue = +validOrders
      .reduce((sum, o) => sum + (o.laborTotal || 0), 0)
      .toFixed(2);
    const partsRevenue = +validOrders
      .reduce((sum, o) => sum + (o.partsTotal || 0), 0)
      .toFixed(2);

    const ordersByStatus = ['PENDIENTE', 'EN_PROCESO', 'ESPERANDO_REPUESTOS', 'LISTO', 'ENTREGADO'].map(
      (status) => ({
        status,
        count: ordersSummary.filter((o) => o.status === status).length,
      })
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalClients,
        totalVehicles,
        activeOrders,
        readyOrders,
        lowStockCount: lowStockItems.length,
        inventoryCount: inventorySummary.length,
        invoicesCount,
        totalRevenue,
        totalCollected,
        pendingCollection,
        laborRevenue,
        partsRevenue,
        ordersByStatus,
        lowStockItems: lowStockItems.slice(0, 6),
        allInventory: inventorySummary.slice(0, 8),
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
