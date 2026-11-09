# Seguridad y cobros por transferencia — Rinascere

## Estado de esta rama

Estos cambios están en la rama `seguridad-transferencias-integrada`. No están fusionados en `main` ni publicados en el sitio de producción.

Se reemplazó el registro directo de solicitudes desde el navegador por una función Netlify que calcula el importe consultando el álbum en Firestore. La confirmación administrativa ahora se realiza en el servidor, con verificación del ID token de Firebase Auth y una transacción atómica. El canje de códigos también se realiza en el servidor y marca el código como usado dentro de una transacción. La reactivación de códigos requiere autenticación administrativa.

## Variables necesarias en Netlify

Configurar en el sitio Netlify, en variables de entorno (no en el repositorio):

- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON completo de una cuenta de servicio de Firebase con permisos de administración de Firestore. Guardarlo como valor secreto, sin comillas externas añadidas por el panel.
- `FIREBASE_ADMIN_UID`: UID autorizado del administrador.
- `FIREBASE_PROJECT_ID`: `rinascere-web-2025`.

Netlify suele proporcionar `URL` automáticamente. Si no está disponible, configurar `URL` con la URL canónica del sitio.

No colocar la clave privada de la cuenta de servicio en HTML, GitHub, mensajes ni archivos públicos. Si se genera una clave, limitar su uso al backend de Netlify y rotarla si alguna vez se expone.

## Funciones creadas

- `/.netlify/functions/crear-transferencia`: valida el álbum, el pack y el importe en Firestore; limita solicitudes por IP; crea la transferencia pendiente.
- `/.netlify/functions/confirmar-transferencia`: exige token Firebase del administrador y confirma una sola vez, crea el código y registra la compra/contadores en una transacción.
- `/.netlify/functions/canjear-codigo`: consume el código una sola vez y devuelve el enlace del álbum.
- `/.netlify/functions/revivir-codigo`: exige token Firebase del administrador para reactivar un código.

## Separación de álbumes y enlaces de Drive

La nueva estructura usa tres colecciones:

- `albumes`: respaldo histórico y fuente administrativa; solo UID administrador puede leer/escribir desde el navegador.
- `albumesPublicos`: metadatos de álbumes públicos, sin `driveLink` ni `driveFolderId`; lectura pública solo si `esPublico == true`.
- `albumesPrivados`: documento completo, incluido el enlace de Drive; no admite lecturas ni escrituras desde el navegador. Solo Netlify Functions con Firebase Admin SDK acceden a esta colección.

La página principal consulta exclusivamente `albumesPublicos`. La página de evento obtiene los metadatos mediante `obtener-album`; los enlaces de descarga gratuita pasan por `descargar-album`, que redirige a Drive solo para álbumes gratuitos o de acceso gratis/cafecito. Los códigos de compra se canjean mediante `canjear-codigo`, que consulta `albumesPrivados`.

Los álbumes existentes se copian desde `albumes` mediante el botón **Proteger enlaces de Drive** del panel administrativo. La migración es por lotes, conserva los documentos originales como respaldo y puede ejecutarse más de una vez. No borrar manualmente la colección legacy durante la migración.

El enlace privado de evento conserva su formato actual con el ID del documento. Ese ID funciona como enlace no listado; no se muestra en el home. Si alguien comparte el enlace privado del evento, otra persona que lo reciba podrá ver sus muestras/metadatos. Los enlaces de Drive completos no se entregan en la respuesta pública de metadatos.

El archivo `firebase.json` apunta a las reglas. Desplegarlas únicamente después de que las funciones de Netlify estén disponibles y la migración haya terminado correctamente.

## Verificación obligatoria en un entorno de prueba

El workflow de GitHub Actions comprueba sintaxis JavaScript e instalación de dependencias. Eso no sustituye pruebas conectadas a Firebase/Netlify. Antes de fusionar o publicar, probar en staging:

1. Crear una transferencia con importe correcto.
2. Alterar el precio desde el navegador y confirmar que el servidor lo rechaza.
3. Verificar que una sesión sin UID administrador no pueda confirmar ni reactivar códigos.
4. Confirmar una transferencia pendiente y comprobar que se genera un único código.
5. Intentar confirmar la misma transferencia otra vez y comprobar respuesta `409`.
6. Canjear el código una vez y comprobar que el segundo intento devuelve `403`.
7. Reactivar un código desde el panel y verificar un nuevo canje.
8. Comprobar que las galerías públicas, privadas, las métricas y el panel siguen funcionando.

No se ejecutaron pruebas reales contra Firebase, Netlify ni Google Drive desde esta sesión: faltan las variables secretas del backend y acceso de ejecución al proyecto. Por eso esta rama es una implementación preparada para staging, no una publicación certificada como libre de errores.
