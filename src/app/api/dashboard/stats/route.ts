import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalClients,
      totalVehicles,
      allOrders,
      allInventory,
      invoicesCount,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.vehicle.count(),
      prisma.workOrder.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          vehicle: true,
          services: true,
          items: true,
          progressNotes: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.inventoryItem.findMany({
        orderBy: { stock: 'asc' },
      }),
      prisma.invoice.count(),
    ]);

    const activeStatuses = new Set(['PENDIENTE', 'EN_PROCESO', 'ESPERANDO_REPUESTOS']);
    const activeOrders = allOrders.filter((o) => activeStatuses.has(o.status)).length;
    const readyOrders = allOrders.filter((o) => o.status === 'LISTO').length;

    const lowStockItems = allInventory.filter((item) => item.stock <= item.minStock);

    const validOrders = allOrders.filter((o) => o.status !== 'CANCELADO');
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
        count: allOrders.filter((o) => o.status === status).length,
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
        inventoryCount: allInventory.length,
        invoicesCount,
        totalRevenue,
        totalCollected,
        pendingCollection,
        laborRevenue,
        partsRevenue,
        ordersByStatus,
        lowStockItems: lowStockItems.slice(0, 6),
        allInventory: allInventory.slice(0, 8),
        recentOrders: allOrders.slice(0, 8),
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
