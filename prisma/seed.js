const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const isDemo = process.argv.includes('--demo');

  // 1. Limpiar base de datos (en orden)
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.workOrderProgressNote.deleteMany();
  await prisma.workOrderService.deleteMany();
  await prisma.workOrderItem.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.client.deleteMany();
  await prisma.inventoryItem.deleteMany();

  if (!isDemo) {
    console.log('✅ Base de datos local inicializada en limpio (0 registros pre-cargados) lista para Electromecánica Lince.');
    return;
  }

  console.log('🌱 Sembrando datos demostrativos (--demo)...');

  // 2. Crear Repuestos / Inventario inicial
  const items = await Promise.all([
    prisma.inventoryItem.create({
      data: {
        code: 'ACE-20W50-CASTROL',
        name: 'Aceite Castrol GTX 20W-50 (Galón)',
        category: 'Lubricantes',
        brand: 'Castrol',
        stock: 12,
        minStock: 4,
        unit: 'GALON',
        unitCost: 75.0,
        unitPrice: 110.0,
        location: 'Estante A-1',
      },
    }),
    prisma.inventoryItem.create({
      data: {
        code: 'ACE-5W30-SYNTH',
        name: 'Aceite Sintético Mobil 1 5W-30 (1/4 Galón)',
        category: 'Lubricantes',
        brand: 'Mobil',
        stock: 18,
        minStock: 6,
        unit: 'UNIDAD',
        unitCost: 32.0,
        unitPrice: 48.0,
        location: 'Estante A-2',
      },
    }),
    prisma.inventoryItem.create({
      data: {
        code: 'FIL-ACE-PH4967',
        name: 'Filtro de Aceite PH4967 (Toyota/Nissan)',
        category: 'Filtros',
        brand: 'Fram',
        stock: 8,
        minStock: 3,
        unit: 'UNIDAD',
        unitCost: 14.0,
        unitPrice: 25.0,
        location: 'Estante B-1',
      },
    }),
    prisma.inventoryItem.create({
      data: {
        code: 'FIL-AIRE-TY-YARIS',
        name: 'Filtro de Aire Toyota Yaris 2015-2022',
        category: 'Filtros',
        brand: 'Sakura',
        stock: 2, // Alerta: bajo stock
        minStock: 3,
        unit: 'UNIDAD',
        unitCost: 20.0,
        unitPrice: 35.0,
        location: 'Estante B-3',
      },
    }),
    prisma.inventoryItem.create({
      data: {
        code: 'PAS-FRE-DEL-BOSCH',
        name: 'Pastillas de Freno Delanteras Bosch',
        category: 'Frenos',
        brand: 'Bosch',
        stock: 5,
        minStock: 2,
        unit: 'JUEGO',
        unitCost: 65.0,
        unitPrice: 105.0,
        location: 'Estante C-1',
      },
    }),
    prisma.inventoryItem.create({
      data: {
        code: 'LIQ-FRE-DOT4',
        name: 'Líquido de Frenos DOT 4 Bosch (500ml)',
        category: 'Frenos',
        brand: 'Bosch',
        stock: 1, // Alerta: bajo stock
        minStock: 4,
        unit: 'UNIDAD',
        unitCost: 18.0,
        unitPrice: 30.0,
        location: 'Estante C-2',
      },
    }),
    prisma.inventoryItem.create({
      data: {
        code: 'BUJ-IRIDIUM-NGK',
        name: 'Bujía NGK Iridium Laser (Juego x4)',
        category: 'Motor',
        brand: 'NGK',
        stock: 6,
        minStock: 2,
        unit: 'JUEGO',
        unitCost: 90.0,
        unitPrice: 140.0,
        location: 'Estante D-1',
      },
    }),
  ]);

  // 3. Crear Clientes y sus Vehículos
  const cliente1 = await prisma.client.create({
    data: {
      name: 'Carlos Mendoza Ríos',
      phone: '987654321',
      document: '45678912',
      email: 'carlos.mendoza@email.com',
      notes: 'Cliente puntual, recomienda usar repuestos originales',
      vehicles: {
        create: [
          {
            plate: 'ABC-123',
            brand: 'Toyota',
            model: 'Yaris',
            year: 2018,
            color: 'Plata',
            mileage: 78500,
          },
        ],
      },
    },
    include: { vehicles: true },
  });

  const cliente2 = await prisma.client.create({
    data: {
      name: 'María Fernández Soto',
      phone: '912345678',
      document: '10293847',
      email: 'm.fernandez@empresa.com',
      notes: 'Vehículo de trabajo diario',
      vehicles: {
        create: [
          {
            plate: 'XYZ-789',
            brand: 'Nissan',
            model: 'Sentra',
            year: 2020,
            color: 'Negro',
            mileage: 45200,
          },
        ],
      },
    },
    include: { vehicles: true },
  });

  const cliente3 = await prisma.client.create({
    data: {
      name: 'Jorge Luis Huamán',
      phone: '998877665',
      document: '76543210',
      vehicles: {
        create: [
          {
            plate: 'PER-456',
            brand: 'Hyundai',
            model: 'Tucson',
            year: 2019,
            color: 'Rojo',
            mileage: 92000,
          },
        ],
      },
    },
    include: { vehicles: true },
  });

  // 4. Crear Órdenes de Trabajo de ejemplo
  const auto1 = cliente1.vehicles[0];
  const auto2 = cliente2.vehicles[0];
  const auto3 = cliente3.vehicles[0];

  // Orden 1: En Proceso (con repuestos y servicios)
  const orden1 = await prisma.workOrder.create({
    data: {
      orderNumber: 'OT-0001',
      status: 'EN_PROCESO',
      issueDescription: 'Mantenimiento preventivo de los 80,000 km y ruido chillón al frenar.',
      diagnostic: 'Desgaste severo en pastillas delanteras, aceite degradado, filtro de aire sucio.',
      mileageAtService: 78500,
      technicianName: 'Timoteo Pariona',
      laborTotal: 90.0,
      partsTotal: 178.0,
      totalAmount: 268.0,
      isPaid: false,
      clientId: cliente1.id,
      vehicleId: auto1.id,
      items: {
        create: [
          {
            inventoryItemId: items[1].id, // Aceite 5W30
            description: 'Aceite Sintético Mobil 1 5W-30 (1/4 Galón) x 4',
            quantity: 4,
            unitPrice: 48.0,
            subtotal: 192.0,
          },
          {
            inventoryItemId: items[2].id, // Filtro
            description: 'Filtro de Aceite PH4967',
            quantity: 1,
            unitPrice: 25.0,
            subtotal: 25.0,
          },
          {
            inventoryItemId: items[4].id, // Pastillas
            description: 'Pastillas de Freno Delanteras Bosch',
            quantity: 1,
            unitPrice: 105.0,
            subtotal: 105.0,
          },
        ],
      },
      services: {
        create: [
          {
            description: 'Mano de obra cambio de aceite y filtros',
            cost: 40.0,
          },
          {
            description: 'Rectificación y cambio de pastillas de freno',
            cost: 50.0,
          },
        ],
      },
      progressNotes: {
        create: [
          {
            note: 'Se desmontaron las ruedas delanteras y se verificaron los discos. Tienen buen grosor.',
            source: 'VOZ',
            author: 'Técnico de Bahía',
          },
        ],
      },
    },
  });

  // Orden 2: Listo para entrega
  await prisma.workOrder.create({
    data: {
      orderNumber: 'OT-0002',
      status: 'LISTO',
      issueDescription: 'Falla de encendido en frío y pérdida de potencia en subidas.',
      diagnostic: 'Bujías con desgaste de electrodo y filtro de gasolina obstruido.',
      mileageAtService: 45200,
      technicianName: 'Timoteo Pariona',
      laborTotal: 60.0,
      partsTotal: 140.0,
      totalAmount: 200.0,
      isPaid: true,
      paymentMethod: 'YAPE_PLIN',
      clientId: cliente2.id,
      vehicleId: auto2.id,
      services: {
        create: [
          {
            description: 'Afinamiento electrónico y limpieza de inyectores',
            cost: 60.0,
          },
        ],
      },
      items: {
        create: [
          {
            inventoryItemId: items[6].id,
            description: 'Bujía NGK Iridium Laser (Juego x4)',
            quantity: 1,
            unitPrice: 140.0,
            subtotal: 140.0,
          },
        ],
      },
    },
  });

  // Orden 3: Pendiente de revisión
  await prisma.workOrder.create({
    data: {
      orderNumber: 'OT-0003',
      status: 'PENDIENTE',
      issueDescription: 'Revisión general por viaje largo y chequeo de suspensión.',
      diagnostic: 'Pendiente de subir al elevador.',
      mileageAtService: 92000,
      technicianName: 'Técnico Roberto',
      laborTotal: 0.0,
      partsTotal: 0.0,
      totalAmount: 0.0,
      isPaid: false,
      clientId: cliente3.id,
      vehicleId: auto3.id,
    },
  });

  console.log('✅ Base de datos sembrada con éxito!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
