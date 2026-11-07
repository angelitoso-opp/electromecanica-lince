# Auditoría técnica — Electromecánica Lince

**Fecha:** 7 de noviembre de 2026
**Alcance:** repositorio completo (`src/`, `electron/`, `prisma/`, `scripts/`, `docs/`, configuración y dependencias).
**Commit auditado:** `880329e` (v1.0.3, árbol limpio).
**Estado declarado por el cliente:** producto terminado.

## Método

- Lectura completa de las 20 rutas de API, los 22 componentes de UI, el esquema Prisma, el proceso principal de Electron y los dos scripts de empaquetado.
- Verificación estática: `npx tsc --noEmit` → **pasa**; `npm run lint` → **falla con 157 errores**.
- Pruebas puntuales contra **copias** de la base SQLite (nunca la base real): modo de journal, llaves foráneas, stock negativo, estados libres, orden de correlativos y borrado en cascada.
- Lectura del README y del SRS para contrastar lo prometido contra lo implementado.

## Carga asumida

Una sola PC, un solo operador, uso diario durante años: decenas de órdenes por semana, miles de registros acumulados, sin internet garantizado. Con esa carga se juzga cada hallazgo; varios problemas que hoy no se notan tienen un techo cercano.

---

## Must fix — bugs, seguridad y pérdida de datos

### 1. El login es decorativo y toda la API está abierta

`src/app/api/auth/route.ts:5` · `src/components/layout/AppShell.tsx:22` · `src/app/api/backup/route.ts:6`

- **Qué es:** el acceso se controla solo en el navegador. `AppShell` pregunta a `/api/auth` y, si no hay sesión, pinta la pantalla de login.
- **Problema:** no existe `middleware.ts`, ninguna ruta comprueba la cookie, y la cookie es un texto fijo escrito en el código (`authenticated_operator_lince_v1`). Sin login se puede `POST /api/orders`, `DELETE /api/clients/...`, y `GET /api/backup` descarga la base completa. Con `npm run dev` (el camino que documenta el README) Next escucha en todas las interfaces: cualquiera en el WiFi del taller puede bajarse la base o borrarla.
- **Arreglo:** un `middleware.ts` que exija la cookie en `/api/*` y en las páginas, cookie firmada (o al menos un valor aleatorio por instalación), y `next dev -H 127.0.0.1`.
- **Si no se corrige:** el candado de la puerta está pintado; los datos de clientes y la caja quedan a un `curl` de distancia.

### 2. “Vaciar base” + respaldo que se sobrescribe = pérdida total

`src/app/page.tsx:51-72` · `src/app/api/admin/clear-data/route.ts:26` · `electron/main.js:312-316`

- **Qué es:** el botón del dashboard borra clientes, carros, órdenes y comprobantes (con `keepInventory:false` también el almacén), con una sola confirmación de dos clics y sin PIN.
- **Problema:** la ruta acepta la cookie fija como autenticación (o un PIN que la UI nunca pide). Peor: el respaldo automático escribe **siempre el mismo archivo del día** (`electromecanica-auto-YYYY-MM-DD.db`) y se ejecuta al cerrar. Tras un vaciado accidental, cerrar la app copia la base ya vacía encima del respaldo de hoy.
- **Arreglo:** pedir el PIN en el modal (la ruta ya lo acepta), hacer un respaldo forzado antes de borrar, y nombrar los respaldos con hora (`...-YYYY-MM-DD-HHmm.db`) sin sobrescribir.
- **Si no se corrige:** un clic de más y se va el historial de años, incluido el respaldo del día.

### 3. El respaldo automático copia la base mientras está abierta

`electron/main.js:300-337` · `src/app/api/backup/route.ts:127-142`

- **Qué es:** cada 30 minutos y al cerrar, Electron hace `fs.copyFileSync` del archivo `.db`.
- **Problema:** la base **no está en modo WAL** (verificado: `PRAGMA journal_mode` devuelve `delete`), así que una copia tomada a mitad de escritura puede salir inconsistente. El “Boot Guard” solo mira los 16 bytes de cabecera, de modo que un archivo roto pasa como válido. Además el nombre usa la fecha **UTC**: un respaldo a las 20:00 de Lima se guarda con la fecha de mañana y choca con el del día siguiente. Al restaurar se borran `-wal`/`-shm` pero **no el `-journal`**, que es el que usa esta base.
- **Arreglo:** activar WAL (`PRAGMA journal_mode=WAL`) o copiar con `VACUUM INTO` / la API de backup de SQLite, validar con `PRAGMA integrity_check`, borrar también `-journal` y usar la fecha local.
- **Si no se corrige:** el respaldo que la app promete como “triple capa” puede ser justo el archivo que no abre el día que se necesita. La carpeta real es `%APPDATA%\Electromecánica Lince`, no la que dice el README; en esta PC hay tres carpetas distintas y es fácil restaurar la equivocada.

### 4. Borrar un cliente borra todo su historial

`src/app/api/clients/[id]/route.ts:82-135`

- **Qué es:** el botón de basura de la lista de clientes elimina al cliente, sus carros, **todas sus órdenes** y desvincula sus facturas.
- **Problema:** es un clic de dos pasos sin aviso de cuánto se va a borrar. Y contradice la regla del vehículo, que sí se niega a borrarse si tiene órdenes (`src/app/api/vehicles/[id]/route.ts:89-102`). Dos políticas opuestas para el mismo dato.
- **Arreglo:** bloquear el borrado si hay órdenes (como ya hace el vehículo) o pedir confirmación escribiendo el nombre. Lo mínimo: contar y mostrar “se borrarán N órdenes”.
- **Si no se corrige:** un cliente con cinco años de mantenimientos desaparece por limpiar la lista.

### 5. El stock puede quedar negativo y no hay entradas de almacén

`src/app/api/orders/route.ts:164-177` · `src/components/inventory/InventoryTable.tsx:43-58`

- **Qué es:** al guardar una orden se descuenta `stock: { decrement: qty }` sin comprobar existencias.
- **Problema:** probado: descontar 5 de un stock de 1 deja **-4**. No hay validación en ningún lado y el “kardex” del README no existe: no hay movimientos, solo un número que se pisa. Tampoco hay forma de registrar una compra (entrada); solo editar el campo a mano.
- **Arreglo:** rechazar la orden si `quantity > stock` (o marcar el faltante), y agregar un movimiento (`InventoryMovement`) que sume/resta con motivo, fecha y orden.
- **Si no se corrige:** el almacén miente, el margen se calcula sobre datos falsos y nadie sabe por qué falta un repuesto.

### 6. La factura ignora el descuento de la orden

`src/components/invoices/InvoiceFormModal.tsx:95-113` · `src/app/api/invoices/route.ts:86-94`

- **Qué es:** al importar una orden se copian servicios y repuestos, y el total del comprobante se recalcula desde esas líneas.
- **Problema:** el descuento de la orden no se copia ni se resta. Una orden de S/ 1,000 con S/ 50 de descuento genera un comprobante por S/ 1,000: el cliente paga S/ 50 más de lo acordado y la caja no cuadra con la orden.
- **Arreglo:** una línea “Descuento” negativa, o emitir por `order.totalAmount`. Dos líneas de código en el modal y en la ruta.
- **Si no se corrige:** el documento fiscal y el precio pactado dicen cosas distintas.

### 7. Las boletas salen sin IGV y el panel lo subestima

`src/app/api/invoices/route.ts:93-94` · `src/components/invoices/InvoiceTable.tsx:139-141`

- **Qué es:** el IGV solo se desglosa cuando `type === 'FACTURA'`; en boleta `igv = 0` y `subtotal = total`.
- **Problema:** la boleta es un comprobante con IGV incluido, pero el sistema lo registra como cero, y el KPI “IGV incluido” suma solo facturas. El README y el SRS prometen “desglose contable automático de base imponible y débito fiscal (IGV 18%)” en general.
- **Arreglo:** desglosar igual en boleta (`total / 1.18`) y guardar el IGV; que el KPI sume ambos.
- **Si no se corrige:** la declaración mensual de IGV sale corta y el dueño no tiene de dónde sacar el número.

### 8. Se pueden emitir comprobantes duplicados y borrarlos

`src/app/api/invoices/route.ts:69-83` · `src/components/invoices/InvoiceTable.tsx:78-92`

- **Qué es:** nada impide emitir dos o tres comprobantes para la misma orden, y el botón de borrar elimina el registro.
- **Problema:** el correlativo se calcula como “el último número + 1”, así que al borrar `B001-0005` el siguiente vuelve a ser `B001-0005` con otro contenido: dos papeles distintos con el mismo número. Para SUNAT un comprobante no se borra, se anula (el esquema tiene `ANULADA`, pero ninguna pantalla lo usa).
- **Arreglo:** rechazar si la orden ya tiene comprobante, y cambiar “Eliminar” por “Anular” (estado + motivo) sin reutilizar el número.
- **Si no se corrige:** la numeración deja de ser confiable justo en el registro que la SUNAT puede pedir.

### 9. RUC fijo y “comprobante electrónico” sin SUNAT

`src/lib/printReceipt.ts:250` · `src/components/invoices/InvoicePrintModal.tsx:178,323`

- **Qué es:** todos los comprobantes impresos llevan `R.U.C. 20601234567`, que además es el *placeholder* del formulario, y el pie dice “Representación impresa del comprobante de pago electrónico”.
- **Problema:** el RUC del taller no está en ningún sitio configurable — es una constante. Y no hay nada de facturación electrónica: ni XML, ni firma, ni hash, ni envío a SUNAT. Se están imprimiendo documentos con apariencia fiscal y un RUC de ejemplo.
- **Arreglo:** RUC y razón social como configuración (o en una tabla `Settings`), y quitar la palabra “electrónico” hasta que exista integración real. Si el documento es interno, que lo diga.
- **Si no se corrige:** riesgo legal y contable; el cliente puede rechazar el documento y el taller no puede demostrar nada.

### 10. La impresión inyecta texto sin escapar

`src/lib/printReceipt.ts:62-90` y `330-331`

- **Qué es:** el recibo se arma concatenando HTML y se escribe dentro de un iframe con `doc.write`.
- **Problema:** `clientName`, `description`, `issueDescription`, `diagnostic` y `technicianName` entran crudos. Un nombre de cliente con `<img src=x onerror="...">` ejecuta código **en el origen de la app**, con acceso a `/api/admin/clear-data`. Cualquiera que escriba en el sistema (o un nombre pegado desde WhatsApp) puede borrar la base.
- **Arreglo:** una función `escapeHtml()` de cinco líneas aplicada a cada interpolación. Mejor todavía: `iframe` con `sandbox` sin `allow-scripts`.
- **Si no se corrige:** una inyección de HTML de toda la vida, en el módulo que se usa a diario.

---

## Should fix — riesgo sin test, duplicación y código que sobra

### 11. Los correlativos se rompen en el 10.000

`src/app/api/orders/route.ts:80-91` · `src/app/api/invoices/route.ts:69-83`

- **Qué es:** el siguiente número se saca con `findFirst({ orderBy: { orderNumber: 'desc' } })` y luego `+1`.
- **Problema:** es orden alfabético, no numérico. Verificado: con `OT-9999` y `OT-10000` en la tabla, el “último” que devuelve es `OT-9999` y el sistema vuelve a generar `OT-10000` → choque de clave única → error 500 y no se puede crear ninguna orden más. Además, dos creaciones simultáneas calculan el mismo número.
- **Arreglo:** un contador en su propia tabla dentro de la misma transacción, o `orderBy` sobre un entero `orderSeq`.
- **Si no se corrige:** el negocio se detiene en seco el día que llega a 10.000 órdenes (o a 10.000 boletas).

### 12. Cero tests

Todo el repositorio

- **Qué es:** no hay un solo archivo de test ni script `test`. El SRS habla de “pruebas unitarias de cálculo financiero”, pero no existen.
- **Problema:** la lógica con dinero (subtotal, IGV, descuento, stock) no tiene ninguna red. Cada cambio se prueba a mano en la app.
- **Arreglo:** tres tests que fallen si se rompen: total de una orden con descuento, desglose de IGV, y descuento de stock. Sin framework nuevo: `node:test` ya viene incluido.
- **Si no se corrige:** los errores de los puntos 5, 6 y 7 volverán cada vez que alguien toque esas rutas.

### 13. El lint está roto (157 errores)

`package.json:10` · `eslint.config.mjs`

- **Qué es:** `npm run lint` termina con código 1 y 157 errores (mayormente `any`, más un `set-state-in-effect`).
- **Problema:** el SRS dice “0 fallos y 0 advertencias en el linter”; la realidad es lo contrario, así que nadie lo corre y deja de servir como freno. El chequeo de tipos sí pasa.
- **Arreglo:** permitir `any` explícitamente donde el código es dinámico (argumentos, datos de Prisma) y arreglar el efecto; luego dejar el script en verde.
- **Si no se corrige:** cualquier error real que el linter detecte quedará enterrado entre 157 falsos.

### 14. El código SKU se puede editar pero no se guarda

`src/app/api/inventory/[id]/route.ts:4-38`

- **Qué es:** el formulario tiene “Código SKU *” editable y lo manda en el `PUT`.
- **Problema:** la ruta no desestructura `code`, así que el cambio se descarta en silencio y el toast dice “guardado”. El usuario cree que renombró el repuesto y sigue igual.
- **Arreglo:** incluir `code` en el `update` (con su validación de único) o deshabilitar el campo en modo edición.
- **Si no se corrige:** alguien reorganiza el almacén, cree que actualizó los códigos y no pasó nada.

### 15. Los botones +/- de stock pierden clics

`src/components/inventory/InventoryTable.tsx:43-58`

- **Qué es:** cada clic calcula `current.stock + delta` usando la lista cargada en memoria y manda el valor absoluto.
- **Problema:** dos clics rápidos antes de que llegue el refresco parten del mismo valor viejo y uno se pierde (y lo mismo pasa si otro proceso descontó stock entretanto: el guardado del formulario pisa el valor con el que se abrió).
- **Arreglo:** mandar `{ delta: -1 }` y usar `increment` / `decrement` en la base, o esperar el refresco antes de habilitar de nuevo.
- **Si no se corrige:** el inventario se desajusta justo cuando se está contando de prisa.

### 16. Ctrl+K no lleva al resultado que elegís

`src/components/layout/CommandPalette.tsx:203-220`

- **Qué es:** la paleta busca órdenes y clientes y los muestra bien.
- **Problema:** al hacer clic (o Enter) solo hace `router.push('/ordenes')`: pierde el resultado y hay que buscar otra vez. El README promete “navegación instantánea”.
- **Arreglo:** abrir la orden con `?order=<id>` (la página ya reacciona a `searchParams`) o abrir el detalle igual que el Kanban.
- **Si no se corrige:** la función más vendida como “atajo” ahorra cero tiempo.

### 17. Los KPIs clicables filtran solo 8 filas

`src/app/page.tsx:77-88`

- **Qué es:** las tarjetas del dashboard son botones que dicen “filtrar”.
- **Problema:** el filtro se aplica únicamente a `recentOrders` (las 8 últimas), no al taller. “Facturado acumulado” no filtra nada, y “Repuestos bajo mínimo” muestra las órdenes que tienen algún repuesto. La pantalla parece filtrada y no lo está.
- **Arreglo:** filtrar en la API (`?filter=`) o quitar la interacción y dejar las tarjetas como lectura.
- **Si no se corrige:** el dueño cree que está viendo “todo lo que falta cobrar” y ve ocho órdenes al azar.

### 18. La impresión no tiene ticket de 80 mm ni QR

`src/lib/printReceipt.ts:96-99` · SRS RF-03.5

- **Qué es:** el README y el SRS prometen tickets térmicos de 80 mm y “firma de recepción y código QR simulado”.
- **Problema:** el CSS de impresión solo define `@page { size: A4 portrait }`; no hay variante 80 mm y no hay QR en ninguna parte. Además la orden de trabajo rotula el total como “TOTAL NETO” cuando incluye IGV, mientras la factura lo llama “Importe total”.
- **Arreglo:** una hoja `@page { size: 80mm auto }` con plantilla aparte, y unificar la etiqueta del total.
- **Si no se corrige:** en la caja, con impresora térmica, los comprobantes salen cortados o en A4.

### 19. El dictado por voz depende de la nube y falla en silencio

`src/components/voice/VoiceAssistantModal.tsx:28-59`

- **Qué es:** usa `webkitSpeechRecognition` del navegador.
- **Problema:** esa API manda el audio a los servidores de Google, así que no funciona sin internet (contradice el “100% offline” del SRS) y en Electron normalmente no está disponible porque el binario no trae la clave del servicio. Cuando falla, `onerror` solo hace `console.error`: para el mecánico, el botón deja de escuchar sin explicar nada. El SRS además promete corregir “a be ce uno dos tres” → `ABC-123`, y el parser solo reconoce letras y dígitos reales.
- **Arreglo:** decirlo en la UI (“requiere internet y Chrome”), mostrar el error real y, si no hay reconocimiento, dejar el cuadro de texto como camino principal. Quitar del SRS lo que no existe.
- **Si no se corrige:** la función estrella no funciona en el `.exe` y nadie sabe por qué.

### 20. `desktop:start` no arranca en un clon nuevo (y la plantilla de base no está en git)

`package.json:13` · `electron/main.js:126-129` · `.gitignore`

- **Qué es:** `desktop:start` ejecuta `electron .` sin definir `ELECTRON_DEV=1`, y `main.js` solo usa el puerto 3000 si esa variable vale `1`.
- **Problema:** sin la variable busca `.next/standalone/server.js`, que no existe en un clon recién instalado (`.next` está ignorado) y muestra “No se encontró el servidor embebido”. Lo mismo le pasa a `Iniciar Taller.vbs`. Y `prisma/clean.db`, que el empaquetador necesita como plantilla, está ignorado por `*.db`: un `desktop:build` sin `prisma db push` previo genera un `.exe` que abre una base sin tablas.
- **Arreglo:** `"desktop:start": "cross-env ELECTRON_DEV=1 electron ."` (o `set ELECTRON_DEV=1&&`), y generar `clean.db` en el script de build (`prisma migrate deploy` + `seed`) en vez de depender de un archivo local.
- **Si no se corrige:** el paso 6 del README y el lanzador del escritorio fallan en cualquier PC que no sea esta.

---

## Detalles menores (fuera de la numeración)

- El pill “Turno abierto · 4 bahías” del navbar está escrito a mano; no existe ese dato (`src/components/layout/Navbar.tsx:72`).
- Llave `}` sobrante al final de `src/app/globals.css:697`.
- `CANCELADO`, `PAGADA` y `ANULADA` existen en el esquema pero ninguna pantalla los produce; `isCustomPart` no se puede marcar nunca.
- `formatCurrency` usa formato `en-US` (`S/ 1,234.56`) en vez de separadores locales.

---

## Veredicto

**No está terminado.** El camino feliz funciona (abrir orden, cobrar, imprimir), pero hay dos agujeros que pueden costar el negocio —el vaciado con respaldo que se sobrescribe y el borrado de cliente con todo su historial— y un problema fiscal serio (RUC fijo + documentos que se dicen electrónicos sin serlo).

Orden sugerido: **1 → 2 → 4 → 9 → 5 → 6**, y los tests del punto 12 en paralelo.

## Lean

Se pueden quitar ~350 líneas y 2 dependencias:

- `src/app/asistente-voz/page.tsx` es casi una copia de `VoiceAssistantModal` (unificar en un componente).
- `PUT /api/invoices/[id]` no lo llama nadie.
- `clsx` y `tailwind-merge` existen solo para `cn()` en dos sitios.

## No verificado

- No se ejecutó el `.exe` empaquetado ni se probó el micrófono real dentro de Electron.
- `npm run build` quedó bloqueado por el sandbox en el paso de TypeScript (`spawn EPERM`); la compilación de producción no está validada, aunque `tsc --noEmit` sí pasa.
- No se hicieron pruebas de carga ni de concurrencia real.
