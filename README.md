# Electromecánica Lince — Sistema Integral de Gestión Automotriz

Sistema web y de escritorio **Local-First** de alto rendimiento diseñado a la medida para la gestión operativa, diagnóstico computarizado y facturación de **Electromecánica Lince**. Construido con **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **TypeScript estricto**, **Prisma ORM** y base de datos embebida **SQLite**.

> **Ubicación del Taller:** Jr. Soledad 330, Lince, Lima - Perú · **Teléfono:** (01) 704-3157  
> **Especialidad:** Diagnóstico Computarizado, Electromecánica Integral, Inyección Electrónica, Frenos ABS y Mantenimiento Preventivo.

---

## 🚀 Características Principales

1. **Ciclo de Vida de Órdenes de Trabajo (Work Orders):**
   - Tablero interactivo Kanban con columnas por estado: *Pendiente*, *En Proceso*, *Esperando Repuestos*, *Listo* y *Entregado*.
   - Generación automática de correlativos únicos (`OT-0001`, `OT-0002`).
   - Desglose dinámico en tiempo real de servicios de mano de obra, repuestos y descuentos comerciales.

2. **Recepción Rápida y Dictado por Voz (Speech-to-Text & NLP):**
   - Módulo manos libres usando la API nativa de Web Speech para registrar vehículos en bahía sin ensuciar la pantalla.
   - Motor NLP en memoria para reconocimiento fonético de placas peruanas e internacionales (`ABC-123`, `B4M-230`).
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
   - Relación 1 a N de clientes con múltiples vehículos asociados.
   - Bitácora cronológica de reparaciones anteriores, historial de odómetros y repuestos cambiados por placa.

6. **Notificaciones y Presupuestos vía WhatsApp:**
   - Generación instantánea de enlaces de WhatsApp (`https://wa.me/`) con textos preformateados para envío de proformas, presupuestos y avisos de retiro de vehículo.

7. **Paleta de Comandos Rápida (`Ctrl + K` / `Cmd + K`):**
   - Navegación instantánea por teclado y disparadores rápidos de creación de órdenes, repuestos y comprobantes.

---

## 🔐 Acceso de Cuenta Única (Software a Medida)

El sistema cuenta con una estación de acceso protegida de **Operador Titular Único** (sin necesidad de registros multi-usuario innecesarios):

| Campo | Credencial Predeterminada |
| :--- | :--- |
| **Usuario** | `lince` *(también admite `timoteo` o `admin`)* |
| **Clave de taller** | `lince2026` |
| **PIN rápido** | `1234` |
| **Base inicial** | **100% limpia (0 registros)** lista para operaciones reales. |

---

## 🖥️ Ejecutable de Escritorio para Windows (.EXE Portable)

El software puede compilarse como **un único archivo ejecutable `.exe` independiente** que puedes llevar en un USB o enviar a otra PC:

### ¿Cómo generar el archivo `.exe`?
```bash
npm run desktop:build
```

### ¿Dónde queda el ejecutable listo?
El archivo generado queda en:
👉 `dist-exe/ElectromecanicaLince.exe`

### ¿Cómo funciona en otra PC?
- **Archivo único:** No requiere carpetas ni archivos `.dll` sueltos. Todo (`icudtl.dat`, motor gráfico, servidor Next.js y base de datos) está empaquetado dentro de `ElectromecanicaLince.exe`.
- **Cero dependencias:** En la otra PC **no necesitas instalar Node.js ni ninguna otra herramienta**.
- **Auto-extracción en primer uso:** La primera vez que abras el `.exe` en una PC, inicializará sus componentes locales en `%LOCALAPPDATA%\ElectromecanicaLince` y creará la base de datos limpia en `%APPDATA%\electromecanica-lince\electromecanica.db`. En aperturas posteriores iniciará de inmediato en menos de 2 segundos.

---

## 💾 Protección contra Pérdida de Datos y Copias de Seguridad

El sistema cuenta con una triple capa de seguridad para garantizar que nunca se pierda información:

1. **Auto-respaldo diario local:**
   - Cada vez que cierras la aplicación, se guarda una copia automática en `%APPDATA%\electromecanica-lince\backups\electromecanica-auto-YYYY-MM-DD.db`.
   - Mantiene automáticamente el historial de los últimos 7 días.
2. **Descarga en 1 Clic (Exportar a USB o Nube):**
   - Desde la barra lateral o con `Ctrl + K` seleccionando **"Copia de seguridad y respaldo"**, puedes descargar instantáneamente tu base de datos completa (`.db`).
   - El sistema ejecuta un `PRAGMA wal_checkpoint(FULL)` garantizando que hasta la última orden guardada esté 100% consolidada en el archivo descargado.
   - Guarda este archivo en tu USB o carpeta de Google Drive / OneDrive para máxima seguridad.
3. **Restauración con respaldo preventivo:**
   - Si cambias de PC o necesitas recuperar un punto anterior, puedes arrastrar tu archivo `.db` en la misma ventana de Respaldo.
   - El sistema genera un snapshot de seguridad preventivo antes de restaurar, protegiéndote contra sobrescrituras accidentales.

---

## 🛠️ Instalación y Modo Desarrollo (Web / Local)

### Prerrequisitos
- Node.js 20.x o superior.
- Git.

### Comandos de Configuración Rápida

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/angelitoso-opp/electromecanica-lince.git
   cd electromecanica-lince
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar el archivo de entorno:**
   ```bash
   cp .env.example .env
   ```

4. **Inicializar la base de datos SQLite limpia:**
   ```bash
   npx prisma db push
   npm run db:clean
   ```
   *(Si deseas cargar datos de prueba para demostración, puedes ejecutar `npm run db:demo`)*

5. **Iniciar en modo desarrollo web:**
   ```bash
   npm run dev
   ```
   Abre en el navegador: [http://localhost:3000](http://localhost:3000)

6. **O iniciar en modo escritorio (Electron Dev):**
   ```bash
   npm run desktop:start
   ```

---

## 📋 Documentación de Ingeniería

Para consultar el análisis detallado bajo estándares internacionales, revisa el documento formal:
- **[Especificación de Requisitos de Software (SRS / ERS - IEEE 830 / ISO 29148)](docs/SRS.md)**

---

## 📁 Estructura del Proyecto

```text
├── dist-exe/                  # Ejecutable compilado (ElectromecanicaLince.exe)
├── docs/                      # Documentación formal de ingeniería (SRS.md)
├── electron/
│   └── main.js                # Ventana nativa Electron y servidor local
├── prisma/
│   ├── schema.prisma          # Modelo de datos relacional
│   ├── clean.db               # Plantilla de base de datos vacía
│   └── seed.js                # Script de reinicio e inicialización
├── scripts/
│   ├── prepare-standalone.mjs # Copia assets y motor Prisma a standalone
│   └── build-exe.mjs          # Compila el ejecutable portable de archivo único
├── src/
│   ├── app/
│   │   ├── api/               # Route Handlers RESTful (auth, orders, invoices, inventory)
│   │   ├── ordenes/           # Tablero Kanban y lista de órdenes
│   │   ├── facturas/          # Comprobantes de pago y facturación SUNAT
│   │   ├── inventario/        # Almacén, SKU y control de existencias
│   │   ├── clientes/          # Directorio y flota vehicular
│   │   ├── asistente-voz/     # Dictado por voz manos libres
│   │   └── page.tsx           # Dashboard principal del taller
│   ├── components/            # Componentes UI (Taste-Skill / Emil Kowalski tokens)
│   │   ├── auth/              # Estación de acceso monousuario
│   │   ├── layout/            # Sidebar, Navbar, AppShell, CommandPalette
│   │   ├── orders/            # Modales y fichas de órdenes
│   │   ├── invoices/          # Comprobantes e impresión A4/Ticket
│   │   └── voice/             # Asistente de captura por voz
│   └── lib/                   # Cliente Prisma y utilidades
```

---

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).
