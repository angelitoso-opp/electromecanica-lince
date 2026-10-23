import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mapeo de números hablados en español
const NUMBER_WORDS: Record<string, number> = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
  mil: 1000,
};

function parseSpanishNumber(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  if (/^\d+([.,]\d+)?$/.test(cleaned)) {
    return parseFloat(cleaned.replace(',', '.'));
  }
  const tokens = cleaned.split(/[\s-]+/).filter((t) => t !== 'y');
  let total = 0;
  let current = 0;
  let matched = false;

  for (const token of tokens) {
    const val = NUMBER_WORDS[token];
    if (val !== undefined) {
      matched = true;
      if (val === 1000) {
        if (current === 0) current = 1;
        total += current * 1000;
        current = 0;
      } else {
        current += val;
      }
    } else if (/^\d+$/.test(token)) {
      matched = true;
      current += parseInt(token, 10);
    }
  }
  total += current;
  return matched ? total : null;
}

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Catálogo amplio de servicios de taller automotriz
const SERVICE_CATALOG = [
  // Aceite y Filtros
  { triggers: ['cambio de aceite', 'cambiar aceite', 'aceite y filtro', 'lubricacion', 'cambio de lubricante'], label: 'Servicio de cambio de aceite y filtro', defaultCost: 35 },
  // Frenos
  { triggers: ['rectificacion de discos', 'rectificar discos', 'rectificado de tambor', 'rectificacion'], label: 'Rectificación de discos y tambores de freno', defaultCost: 60 },
  { triggers: ['purgado de frenos', 'purgar frenos', 'purgado de liquido', 'cambio de liquido de frenos', 'purgar circuito'], label: 'Purgado y renovación de líquido de frenos', defaultCost: 40 },
  { triggers: ['pastillas de freno', 'cambio de pastillas', 'frenos delanteros', 'frenos traseros', 'regulacion de frenos', 'mantenimiento de frenos', 'frenos'], label: 'Mantenimiento y regulación del sistema de frenos', defaultCost: 50 },
  { triggers: ['zapatas', 'freno de mano'], label: 'Regulación de freno de mano y zapatas', defaultCost: 40 },
  // Motor y Afinamiento
  { triggers: ['afinamiento electronico', 'afinamiento', 'puesta a punto'], label: 'Afinamiento electrónico integral de motor', defaultCost: 70 },
  { triggers: ['limpieza de inyectores', 'lavado de inyectores', 'inyectores', 'ultrasonido'], label: 'Limpieza y calibración de inyectores por ultrasonido', defaultCost: 80 },
  { triggers: ['cambio de bujias', 'calibracion de bujias', 'bujias', 'bujia'], label: 'Calibración e instalación de bujías', defaultCost: 30 },
  { triggers: ['faja de distribucion', 'cambio de faja', 'faja de alternador', 'fajas', 'correa de distribucion', 'correas'], label: 'Cambio y tensión de fajas de motor', defaultCost: 60 },
  { triggers: ['embrague', 'disco de embrague', 'kit de embrague', 'bajada de caja', 'clutch'], label: 'Bajada de caja y sustitución de embrague', defaultCost: 180 },
  { triggers: ['bomba de agua', 'termostato', 'sistema de refrigeracion', 'fuga de agua'], label: 'Mantenimiento de refrigeración y termostato', defaultCost: 65 },
  // Suspensión y Dirección
  { triggers: ['alineacion y balanceo', 'alineacion computarizada', 'alineacion', 'balanceo'], label: 'Alineación computarizada y balanceo de ruedas', defaultCost: 45 },
  { triggers: ['amortiguador', 'amortiguadores', 'cambio de amortiguadores'], label: 'Instalación de amortiguadores y topes', defaultCost: 70 },
  { triggers: ['mantenimiento de suspension', 'suspension', 'tren delantero'], label: 'Revisión y mantenimiento de suspensión', defaultCost: 60 },
  { triggers: ['terminales', 'rotulas', 'trapecios', 'cremallera'], label: 'Sustitución de componentes de dirección', defaultCost: 55 },
  // Electricidad y Diagnóstico
  { triggers: ['escaneo computarizado', 'escaneo', 'scanner', 'obd2', 'diagnostico electronico', 'borrado de codigos'], label: 'Diagnóstico computarizado OBD2 con escáner', defaultCost: 40 },
  { triggers: ['bateria', 'sistema de carga'], label: 'Diagnóstico de batería y sistema de carga', defaultCost: 25 },
  { triggers: ['alternador', 'reparacion de alternador'], label: 'Reparación y mantenimiento de alternador', defaultCost: 75 },
  { triggers: ['arranque', 'motor de arranque'], label: 'Mantenimiento de motor de arranque', defaultCost: 65 },
  { triggers: ['luces', 'sistema electrico', 'cortocircuito', 'fusibles', 'faros'], label: 'Revisión y reparación de circuito eléctrico', defaultCost: 40 },
  // Preventivo e Inspección
  { triggers: ['mantenimiento preventivo', 'mantenimiento general', 'servicio preventivo'], label: 'Mantenimiento preventivo de rutina', defaultCost: 80 },
  { triggers: ['revision por viaje', 'revision general', 'chequeo general', 'inspeccion tecnica', 'inspeccion'], label: 'Inspección técnica general multipunto', defaultCost: 45 },
  { triggers: ['lavado de salon', 'lavado de motor', 'lavado'], label: 'Lavado técnico y detallado de motor', defaultCost: 35 },
];

const KNOWN_BRANDS = [
  'Toyota', 'Nissan', 'Hyundai', 'Kia', 'Chevrolet', 'Suzuki', 'Honda', 'Volkswagen',
  'Ford', 'Mazda', 'Mitsubishi', 'Chery', 'JAC', 'Changan', 'Renault', 'Peugeot', 'Subaru'
];

const KNOWN_MODELS = [
  'Yaris', 'Corolla', 'Hilux', 'Rav4', 'Sentra', 'Versa', 'Tiida', 'Tucson', 'Accent',
  'Elantra', 'Santa Fe', 'Rio', 'Sportage', 'Cerato', 'Picanto', 'Sail', 'Spark', 'Cruze',
  'Swift', 'Grand Vitara', 'Civic', 'CR-V', 'Gol', 'Amarok', 'Ranger', 'Duster'
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Se requiere el texto transcrito de la nota de voz' },
        { status: 400 }
      );
    }

    const text = transcript.trim();
    const normText = normalize(text);

    // Cargar base de datos relevante
    const [inventoryItems, registeredClients, allVehicles] = await Promise.all([
      prisma.inventoryItem.findMany(),
      prisma.client.findMany({ include: { vehicles: true } }),
      prisma.vehicle.findMany({ include: { client: true } }),
    ]);

    // ==========================================
    // 1. Detección Inteligente de Placa
    // ==========================================
    let detectedPlate: string | null = null;
    const cleanTextAlphanum = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    // 1.1 Coincidencia con vehículos ya registrados
    for (const v of allVehicles) {
      const cleanPlate = v.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (cleanTextAlphanum.includes(cleanPlate)) {
        detectedPlate = v.plate;
        break;
      }
    }

    // 1.2 Detección precedida por palabra clave ('placa', 'unidad', 'patente', 'auto', 'camioneta')
    if (!detectedPlate) {
      const keywordMatch = text.match(
        /(?:placa|patente|matricula|unidad|auto|vehiculo|camioneta)\s*[:=]?\s*([A-Za-z0-9\s-]{5,12})/i
      );
      if (keywordMatch) {
        const rawCandidate = keywordMatch[1].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (rawCandidate.length >= 6 && rawCandidate.length <= 7) {
          detectedPlate = `${rawCandidate.slice(0, 3)}-${rawCandidate.slice(3)}`;
        }
      }
    }

    // 1.3 Formatos estándar peruanos y latinoamericanos
    if (!detectedPlate) {
      // Formato 1: ABC-123 o ABC 123 (3 letras, 3-4 dígitos)
      const p1 = text.match(/\b([A-Za-z]{3})[- ]?(\d{3,4})\b/i);
      if (p1) {
        detectedPlate = `${p1[1].toUpperCase()}-${p1[2]}`;
      } else {
        // Formato 2: B4M-230, P1Q-456 (1 letra, 1 número, 1 letra - 3 números)
        const p2 = text.match(/\b([A-Za-z]\d[A-Za-z])[- ]?(\d{3})\b/i);
        if (p2) {
          detectedPlate = `${p2[1].toUpperCase()}-${p2[2]}`;
        } else {
          // Formato 3: AB1-234 (2 letras, 1 número - 3 números)
          const p3 = text.match(/\b([A-Za-z]{2}\d)[- ]?(\d{3})\b/i);
          if (p3) {
            detectedPlate = `${p3[1].toUpperCase()}-${p3[2]}`;
          }
        }
      }
    }

    // ==========================================
    // 2. Extracción de Kilometraje
    // ==========================================
    let detectedMileage: number | null = null;

    // 2.1 Cifras explícitas seguidas de km/kilometros (ej. '82000 km', '45000km')
    const directKmMatch = normText.match(/(\d{1,3}(?:[.,]\d{3})*|\d+)\s*(?:mil\s*km|kilometros|km|kms)\b/);
    if (directKmMatch) {
      const raw = directKmMatch[1].replace(/[.,]/g, '');
      let val = parseInt(raw, 10);
      if (directKmMatch[0].includes('mil') && val < 1000) val *= 1000;
      if (val >= 500 && val <= 999999) detectedMileage = val;
    }

    // 2.2 Precedido por términos de odómetro (ej. 'odómetro en 82 mil', 'marcando 75000')
    if (!detectedMileage) {
      const kwMatch = normText.match(/\b(?:kilometraje|odometro|recorrido|marcando|marca)\b\s*(?:de|en|con)?\s*([a-z0-9\s.,-]+?)(?:\s*(?:kilometros|km|kms)|\s+para|\s+le|\s+y|\s+con|\s*$)/);
      if (kwMatch) {
        const parsed = parseSpanishNumber(kwMatch[1]);
        if (parsed) {
          if (kwMatch[1].includes('mil') && parsed < 1000) {
            detectedMileage = parsed * 1000;
          } else if (parsed >= 500 && parsed <= 999999) {
            detectedMileage = Math.round(parsed);
          }
        }
      }
    }

    // 2.3 Números hablados antes de kilómetros (ej. 'setenta y ocho mil kilometros')
    if (!detectedMileage) {
      const spokenMatch = normText.match(/([a-z\s]+?)\s*(?:mil\s*km|kilometros|km)\b/);
      if (spokenMatch) {
        const words = spokenMatch[1].trim().split(/\s+/).slice(-4).join(' ');
        const parsed = parseSpanishNumber(words);
        if (parsed && parsed >= 500 && parsed <= 999999) {
          detectedMileage = Math.round(parsed);
        }
      }
    }

    // ==========================================
    // 3. Asociación de Vehículo y Cliente
    // ==========================================
    let matchedVehicle: any = null;
    let matchedClient: any = null;

    if (detectedPlate) {
      const cleanPlate = detectedPlate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      matchedVehicle = allVehicles.find((v) => {
        const vp = v.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        return vp === cleanPlate;
      });
      if (matchedVehicle) {
        matchedClient = matchedVehicle.client;
      }
    }

    // Si aún no se asoció cliente, buscar por nombre de cliente mencionado en la nota
    if (!matchedClient) {
      for (const client of registeredClients) {
        const normClientName = normalize(client.name);
        // Si el nombre completo o dos palabras coinciden
        const clientWords = normClientName.split(/\s+/).filter((w) => w.length > 2);
        const matchesCount = clientWords.filter((w) => normText.includes(w)).length;
        if (matchesCount >= 2 || (clientWords.length === 1 && matchesCount === 1)) {
          matchedClient = client;
          if (!matchedVehicle && client.vehicles?.length > 0) {
            matchedVehicle = client.vehicles[0];
            if (!detectedPlate) detectedPlate = matchedVehicle.plate;
          }
          break;
        }
      }
    }

    // Extraer marca y modelo del texto
    let detectedBrand: string | null = null;
    let detectedModel: string | null = null;

    for (const b of KNOWN_BRANDS) {
      if (normText.includes(b.toLowerCase())) {
        detectedBrand = b;
        break;
      }
    }
    for (const m of KNOWN_MODELS) {
      if (normText.includes(m.toLowerCase())) {
        detectedModel = m;
        break;
      }
    }

    // ==========================================
    // 4. Extracción de Repuestos e Insumos
    // ==========================================
    const detectedItems: any[] = [];

    for (const item of inventoryItems) {
      const normName = normalize(item.name);
      const normCode = normalize(item.code);

      let isMatched = false;
      let matchIdx = -1;

      // 4.1 Coincidencia de código SKU exacto
      if (normText.includes(normCode)) {
        isMatched = true;
        matchIdx = normText.indexOf(normCode);
      } else {
        // 4.2 Coincidencia semántica diferencial (evita falsos positivos entre marcas y tipos)
        if (normName.includes('castrol') && normText.includes('castrol')) {
          isMatched = true;
          matchIdx = normText.indexOf('castrol');
        } else if (normName.includes('mobil') && normText.includes('mobil')) {
          isMatched = true;
          matchIdx = normText.indexOf('mobil');
        } else if (normName.includes('20w-50') && (normText.includes('20w50') || normText.includes('20w-50'))) {
          isMatched = true;
          matchIdx = normText.indexOf('20w');
        } else if (normName.includes('5w-30') && (normText.includes('5w30') || normText.includes('5w-30'))) {
          isMatched = true;
          matchIdx = normText.indexOf('5w');
        } else if (normName.includes('filtro de aceite') && normText.includes('filtro de aceite')) {
          isMatched = true;
          matchIdx = normText.indexOf('filtro de aceite');
        } else if (normName.includes('filtro de aire') && normText.includes('filtro de aire')) {
          isMatched = true;
          matchIdx = normText.indexOf('filtro de aire');
        } else if (normName.includes('pastillas') && (normText.includes('pastillas') || normText.includes('pastilla'))) {
          isMatched = true;
          matchIdx = normText.indexOf('pastilla');
        } else if (normName.includes('liquido de frenos') && (normText.includes('liquido de frenos') || normText.includes('dot 4') || normText.includes('dot4') || (normText.includes('liquido') && normText.includes('freno')))) {
          isMatched = true;
          matchIdx = normText.indexOf('liquido');
        } else if (normName.includes('bujia') && (normText.includes('bujia') || normText.includes('bujias') || normText.includes('ngk'))) {
          isMatched = true;
          matchIdx = normText.indexOf('bujia') !== -1 ? normText.indexOf('bujia') : normText.indexOf('ngk');
        }
      }

      if (isMatched && !detectedItems.some((d) => d.inventoryItemId === item.id)) {
        // Extraer cantidad buscando números o palabras numéricas justo antes del repuesto
        let quantity = 1;
        const windowStart = Math.max(0, matchIdx - 45);
        const windowText = normText.slice(windowStart, matchIdx);

        const matches = [
          ...windowText.matchAll(
            /(?:^|\s)(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|diez|\d+)\s*(?:cuartos|cuarto|litros|litro|galones|galon|unidades|unidad|piezas|pieza|juegos|juego|pares|par)?\s*(?:de)?/gi
          ),
        ];

        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          const parsedQty = parseSpanishNumber(lastMatch[1]);
          if (parsedQty && parsedQty > 0 && parsedQty <= 50) {
            quantity = parsedQty;
          }
        }

        detectedItems.push({
          inventoryItemId: item.id,
          description: item.name,
          quantity,
          unitPrice: item.unitPrice,
          subtotal: quantity * item.unitPrice,
        });
      }
    }

    // ==========================================
    // 5. Extracción de Mano de Obra y Servicios
    // ==========================================
    // Detectar costo global de mano de obra (ej. "mano de obra 70 soles", "cobramos 80 soles", "mano de obra cien soles")
    let globalLaborCost: number | null = null;
    const laborCostMatch = text.match(
      /(?:mano de obra|se cobro|cobramos|costo del servicio|costo de mano de obra|servicio por|precio de|por la mano de obra)\s*(?:es|de|en|fue|por|:)?\s*([a-záéíóú0-9\s.,-]+?)(?:soles|pesos|dolares|usd|\$|s\/|\.|$|\b)/i
    );

    if (laborCostMatch) {
      const parsedCost = parseSpanishNumber(laborCostMatch[1]);
      if (parsedCost && parsedCost > 0 && parsedCost <= 5000) {
        globalLaborCost = parsedCost;
      }
    }

    // Buscar servicios en el catálogo
    const detectedServices: any[] = [];
    for (const service of SERVICE_CATALOG) {
      const matchedTrigger = service.triggers.find((tr) => normText.includes(tr));
      if (matchedTrigger && !detectedServices.some((s) => s.description === service.label)) {
        detectedServices.push({
          description: service.label,
          cost: service.defaultCost,
        });
      }
    }

    // Si se especificó un monto de mano de obra global, asignarlo inteligentemente
    if (globalLaborCost !== null) {
      if (detectedServices.length === 1) {
        detectedServices[0].cost = globalLaborCost;
      } else if (detectedServices.length > 1) {
        // Asignar el monto al servicio principal y poner proporciones equilibradas
        detectedServices[0].cost = globalLaborCost;
        for (let i = 1; i < detectedServices.length; i++) {
          detectedServices[i].cost = 0;
        }
      } else {
        // Ningún servicio específico detectado, agregar entrada de mano de obra con el monto
        detectedServices.push({
          description: 'Mano de obra y servicios mecánicos en bahía',
          cost: globalLaborCost,
        });
      }
    }

    // Si aún no hay servicios, pero se detectaron repuestos, agregar servicio genérico
    if (detectedServices.length === 0 && detectedItems.length > 0) {
      detectedServices.push({
        description: 'Instalación de repuestos y mantenimiento en bahía',
        cost: 40,
      });
    }

    // Generar resumen explicativo
    const summaryParts: string[] = [];
    if (detectedPlate) {
      summaryParts.push(`Unidad ${detectedPlate}${matchedVehicle ? ` (${matchedVehicle.brand} ${matchedVehicle.model})` : ''}`);
    } else if (detectedBrand || detectedModel) {
      summaryParts.push(`Vehículo ${detectedBrand || ''} ${detectedModel || ''}`.trim());
    } else {
      summaryParts.push('Vehículo no especificado');
    }

    if (matchedClient) {
      summaryParts.push(`Cliente ${matchedClient.name}`);
    }
    if (detectedMileage) {
      summaryParts.push(`${detectedMileage.toLocaleString()} km`);
    }
    summaryParts.push(`${detectedServices.length} servicio(s)`);
    summaryParts.push(`${detectedItems.length} repuesto(s)`);

    return NextResponse.json({
      success: true,
      parsed: {
        rawTranscript: text,
        plate: detectedPlate,
        mileage: detectedMileage,
        matchedVehicle,
        matchedClient,
        vehicleBrand: detectedBrand || matchedVehicle?.brand || null,
        vehicleModel: detectedModel || matchedVehicle?.model || null,
        suggestedItems: detectedItems,
        suggestedServices: detectedServices,
        summary: `Detectado: ${summaryParts.join(' · ')}.`,
      },
    });
  } catch (error) {
    console.error('Error parsing voice audio/transcript:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la nota de voz' },
      { status: 500 }
    );
  }
}
