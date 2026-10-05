# CHIP Rent a Car · CRM de Contratos

CRM para crear y gestionar contratos de renta de autos. Construido con **Next.js 16 + React 19 + Tailwind CSS 4 + Firebase (Auth + Firestore)**.

## Funcionalidades

- **Autenticación** con correo y contraseña (registro, login, recuperación).
- **Panel** con ingresos del mes, rentas activas, flota disponible, gráfica de 6 meses y agenda de entregas/devoluciones.
- **Contratos**: asistente de 5 pasos con todos los campos del formato original (arrendatario, hospedaje y vuelo, segundo conductor, tarjeta, vehículo, tarifas, deducible, depósito, fechas/horas, sucursales, cambio de vehículo, forma de pago).
  - Folio consecutivo automático (transacción en Firestore).
  - Inspección digital: diagrama de daños clicable, medidor de gasolina y kilometraje de salida/regreso.
  - Firma digital en pantalla, relevo de responsabilidad (acepto/declino), pagaré con importe en letra.
  - Vista de contrato tamaño carta lista para **Imprimir / Guardar como PDF**.
  - Flujo: Reservación → Activo → Finalizado (recepción con gasolina y km) / Cancelado.
  - Envío de resumen por WhatsApp.
- **Clientes**: cartera con búsqueda, historial de rentas y alerta de licencia vencida. Se guardan automáticamente al crear un contrato.
- **Flota**: vehículos con estado (disponible / rentado / mantenimiento), tarifa y kilometraje; se actualiza al entregar/recibir.
- **Configuración**: datos del arrendador, folio, aviso de seguro, sucursales, categorías, cláusulas y color de marca.

## Configuración de Firebase (una sola vez)

En la consola de Firebase del proyecto **cdpa-crm**:

1. **Authentication → Sign-in method →** habilita **Correo electrónico/contraseña**.
2. **Firestore Database → Crear base de datos** (modo producción).
3. **Firestore → Reglas →** pega el contenido de `firestore.rules` y publica.

## Variables de entorno

La app lee la configuración de Firebase **solo** desde variables de entorno (`NEXT_PUBLIC_FIREBASE_*`). Si falta alguna, la app muestra un error indicando cuál.

```bash
cp .env.example .env   # en Windows: copy .env.example .env
```

Llena `.env` con los datos de tu app web en Firebase (Configuración del proyecto → Tus apps). En producción (Vercel, Firebase App Hosting, etc.) define las mismas variables en el panel del hosting.

## Ejecutar

```bash
npm install
npm run dev
```

Abre http://localhost:3000, crea tu cuenta y comienza.

## Producción

```bash
npm run build && npm start
```

Se puede desplegar en Vercel o Firebase App Hosting. Las credenciales pueden sobrescribirse con variables `NEXT_PUBLIC_FIREBASE_*`.
