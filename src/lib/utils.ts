import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'S/'): string {
  const num = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return `${currency} ${formatted}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatShortDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date));
}

export function formatPlate(plate: string): string {
  if (!plate) return '';
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length === 6) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return clean;
}

export function generateWhatsAppQuoteUrl(data: {
  clientPhone: string;
  clientName: string;
  plate: string;
  vehicleModel: string;
  orderNumber: string;
  services: { description: string; cost: number }[];
  items: { description: string; quantity: number; unitPrice: number; subtotal: number }[];
  total: number;
}): string {
  let message = `*ELECTROMECANICA LINCE - PROFORMA Y ESTADO*\n\n`;
  message += `Estimado(a) *${data.clientName}*,\n`;
  message += `Detalle de atención para su vehículo *${data.vehicleModel}* (Placa: *${data.plate}*):\n\n`;
  message += `*Orden:* ${data.orderNumber}\n`;
  message += `------------------------------------\n`;

  if (data.services.length > 0) {
    message += `*Trabajos / Mano de obra:*\n`;
    data.services.forEach((s) => {
      message += `- ${s.description}: ${formatCurrency(s.cost)}\n`;
    });
    message += `\n`;
  }

  if (data.items.length > 0) {
    message += `*Repuestos e insumos:*\n`;
    data.items.forEach((i) => {
      message += `- ${i.description} (x${i.quantity}): ${formatCurrency(i.subtotal)}\n`;
    });
    message += `\n`;
  }

  message += `------------------------------------\n`;
  message += `*TOTAL A PAGAR:* *${formatCurrency(data.total)}*\n\n`;
  message += `Jr. Soledad 330, Lince · Tel: (01) 704-3157 · Quedamos atentos a su confirmación.`;

  let phone = data.clientPhone.replace(/\D/g, '');
  if (phone.length === 9) {
    phone = `51${phone}`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
