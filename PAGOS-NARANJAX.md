# Cobros directos Naranja X — entorno de prueba

- Alias receptor: `verogfotos.nx.arg` (confirmarlo en la app antes de recibir pagos).
- No se usa Checkout ni se necesita un token de API de Naranja X para transferencias ordinarias.
- El pedido se registra en Firestore antes de mostrar los datos de pago. La confirmación de la acreditación es **manual**, exclusivamente desde el administrador autenticado. No basta un comprobante enviado por WhatsApp.
- Las funciones de Netlify se reutilizan en Vercel mediante adaptadores de `api/` y la reescritura de `vercel.json`. En Netlify, las funciones originales y la configuración `netlify.toml` siguen disponibles.
- Vercel o Netlify **sí necesitan las variables Firebase** para las funciones: `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_PROJECT_ID`, `FIREBASE_ADMIN_UID`; el build web requiere `FIREBASE_WEB_CONFIG_JSON`. Deben ser credenciales del Firebase de **pruebas** en entornos de preview, no de producción.
- No guardar tokens ni cuentas de servicio en GitHub, archivos HTML/JS del cliente o Cloudinary. Cloudinary es ajeno al procesamiento de transferencias.
- Las variables heredadas `MP_ACCESS_TOKEN` y `MERCADOPAGO_ACCESS_TOKEN` no se necesitan para este flujo. Revisar dependencias antes de desactivarlas en producción.
- Verificar que el proyecto de Vercel correcto tenga las variables Firebase para Preview. Los proyectos diferentes de Vercel no comparten automáticamente sus variables.

## Comprobaciones antes de publicar

1. Verificar build y funciones en Deploy Preview de Netlify y/o Vercel con Firebase de pruebas.
2. Crear pedido de importe fijo, pack y cafecito; verificar que se registra con nombre, contacto, importe y número de pedido.
3. Confirmar que el alias y el importe coinciden entre servidor, página y cuenta Naranja X.
4. Verificar que el sitio nunca abre Checkout ni genera preferencias de Mercado Pago.
5. Intentar confirmar sin sesión de admin y comprobar que es rechazado; luego confirmar con sesión válida y verificar autorización de descarga.
6. Revisar permisos de Google Drive: los enlaces a carpetas no garantizan aislamiento por foto ni la limitación real de packs; esto requiere una fase adicional.
7. No fusionar a `main` ni desplegar en producción antes de pruebas completas.
