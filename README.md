# Electromecánica Lince — Sistema Integral de Gestión Automotriz

Sistema web **Local-First** de alto rendimiento diseñado a la medida para talleres mecánicos y centros de diagnóstico automotriz multimarca. Construido con arquitectura moderna sobre **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **TypeScript estricto**, **Prisma ORM** y base de datos embebida **SQLite**.

> **Ubicación del Taller:** Jr. Soledad 330, Lince, Lima - Perú  
> **Especialidad:** Diagnóstico Computarizado, Electromecánica Integral, Inyección Electrónica, Frenos ABS y Mantenimiento Preventivo.

---

## 🚀 Características Principales

1. **Ciclo de Vida de Órdenes de Trabajo (Work Orders):**
   - Tablero interactivo Kanban con columnas por estado: *Pendiente*, *En Proceso*, *Esperando Repuestos*, *Listo* y *Entregado*.
   - Generación automática de correlativos únicos (`OT-0001`, `OT-0002`).
   - Desglose dinámico en tiempo real de servicios de mano de obra, repuestos y descuentos comerciales.

2. **Recepción Rápida y Dictado por Voz (Speech-to-Text & NLP):**
   - Módulo manos libres usando la API nativa de Web Speech para registrar vehículos en bahía sin ensuciar la pantalla.
   - Motor NLP en memoria para reconocimiento de placas peruanas e internacionales (`ABC-123`, `B4M-230`).
   - Parser fonético de números cardinales en español (*"ochenta mil"* $\rightarrow$ `80000`, *"trescientos cincuenta"* $\rightarrow$ `350`).
   - Mapeo difuso contra un catálogo de más de 25 labores mecánicas y deducción automática de repuestos de almacén.

3. **Facturación Electrónica y Comprobantes SUNAT:**
   - Emisión formal de **Boletas de Venta** (`B001-XXXX`) y **Facturas Comerciales** (`F001-XXXX`).
   - Desglose contable automático de Base Imponible y débito fiscal (IGV 18%).
   - Plantilla de impresión profesional optimizada para hojas A4 y tickets térmicos de punto de venta (80 mm).

4. **Control de Almacén y Kardex de Repuestos:**
   - Control de existencias con SKU único, marca, ubicación de estante y costo vs. precio de venta.
   - Alerta visual inmediata de reposición ante stock crítico (`stock <= minStock`).
   - Deducción transaccional automática de existencias al despachar repuestos en órdenes.

5. **Directorio de Clientes e Historial Clínico Vehicular:**
   - Relación 1 a N de clientes con múltiples vehículos.
   - Bitácora cronológica de reparaciones anteriores, historial de odómetros y repuestos cambiados por placa.

6. **Notificaciones y Presupuestos vía WhatsApp:**
   - Generación instantánea de enlaces de WhatsApp (`https://wa.me/`) con textos preformateados para envío de proformas, presupuestos y avisos de retiro de vehículo.

7. **Paleta de Comandos Rápida (`Ctrl + K` / `Cmd + K`):**
   - Navegación instantánea por teclado y disparadores rápidos de creación de órdenes, repuestos y comprobantes.

---

## 🛠️ Pila Tecnológica

| Componente | Tecnología |
| :--- | :--- |
| **Framework Web** | [Next.js 16](https://nextjs.org/) (App Router & Server Actions) |
| **Librería de UI** | [React 19](https://react.dev/) |
| **Lenguaje** | [TypeScript 5](https://www.typescriptlang.org/) (Strict mode) |
| **Estilos** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Sistema de Diseño** | Taste-Skill v2 & Emil Kowalski Motion Tokens |
| **ORM** | [Prisma v6](https://www.prisma.io/) |
| **Base de Datos** | [SQLite 3](https://sqlite.org/) (Modo WAL local-first) |
| **Reconocimiento de Voz** | Web Speech API (W3C standard) |
| **Iconos** | [Lucide React](https://lucide.dev/) |
| **Notificaciones** | [Sonner](https://sonner.emilkowal.ski/) |

---

## 📋 Documentación de Ingeniería

Para consultar el análisis de requerimientos bajo normas internacionales, revisa el documento formal:
- **[Especificación de Requisitos de Software (SRS / ERS - IEEE 830)](docs/SRS.md)**

---

## 🏁 Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js 20.x o superior.
- npm, pnpm o yarn.

### Pasos de Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/angelitoso-opp/electromecanica-lince.git
   cd electromecanica-lince
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```

4. **Sincronizar base de datos SQLite y sembrar datos iniciales:**
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

5. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

6. Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

---

## 📄 Licencia

Este proyecto está disponible bajo la licencia [MIT](LICENSE).
