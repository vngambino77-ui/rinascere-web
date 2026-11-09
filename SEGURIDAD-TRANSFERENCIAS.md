# Seguridad y cobros por transferencia — Rinascere

## Estado de esta rama

Estos cambios están en la rama `seguridad-transferencias-integrada`. No están fusionados en `main` ni publicados en el sitio de producción.

Se reemplazó el registro directo de solicitudes desde el navegador por una función Netlify que calcula el importe consultando el álbum en Firestore. La confirmación administrativa ahora se realiza en el servidor, con verificación del ID token de Firebase Auth y una transacción atómica. El canje de códigos también se realiza en el servidor y marca el código como usado dentro de una transacción. La reactivación de códigos requiere autenticación administrativa.

## Variables necesarias en Netlify

Configurar variables separadas por contexto en Netlify:

**Deploy Previews (pruebas):**
- `FIREBASE_WEB_CONFIG_JSON`: configuración web JSON del proyecto Firebase de pruebas (apiKey, authDomain, projectId, appId y los campos opcionales que correspondan).
- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON de una cuenta de servicio de un proyecto Firebase de pruebas, no del proyecto publicado.
- `FIREBASE_ADMIN_UID`: UID del usuario administrador creado en ese proyecto de pruebas.
- `FIREBASE_PROJECT_ID`: ID del proyecto Firebase de pruebas.

**Production (producción):**
- `FIREBASE_WEB_CONFIG_JSON`: usar exactamente este JSON de configuración web ya presente en la versión publicada del proyecto (es configuración pública del cliente, no una clave privada):

```json
{"apiKey":"AIzaSyC-8dbhyKVKDlEndWJ3UfEEu3EiAnZI-XU","authDomain":"rinascere-web-2025.firebaseapp.com","projectId":"rinascere-web-2025","storageBucket":"rinascere-web-2025.firebasestorage.app","messagingSenderId":"781300280640","appId":"1:781300280640:web:34c98efa7780a8218cdea5"}
```

- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON de una cuenta de servicio del proyecto `rinascere-web-2025`.
- `FIREBASE_ADMIN_UID`: UID autorizado del administrador.
- `FIREBASE_PROJECT_ID`: `rinascere-web-2025`.

Netlify suele proporcionar `URL` automáticamente. Si no está disponible, configurar `URL` con la URL canónica del sitio. No reutilizar credenciales de producción en Deploy Previews.

El build de Netlify genera automáticamente `firebase-config.js` a partir de `FIREBASE_WEB_CONFIG_JSON` y `FIREBASE_ADMIN_UID`, según el contexto (Deploy Preview o Production). Ese archivo es público y contiene solo la configuración web y el UID, nunca la clave privada. No colocar la clave privada de la cuenta de servicio en HTML, GitHub, mensajes ni archivos públicos. Si se genera una clave, limitar su uso al backend de Netlify y rotarla si alguna vez se expone. Para la cuenta de servicio, asignar el rol mínimo necesario para leer/escribir Firestore (por ejemplo, Cloud Datastore User) en el proyecto correspondiente.

## Funciones creadas

- `/.netlify/functions/crear-transferencia`: valida el álbum, el pack y el importe en Firestore; limita solicitudes por IP; crea la transferencia pendiente.
- `/.netlify/functions/confirmar-transferencia`: exige token Firebase del administrador y confirma una sola vez, crea el código y registra la compra/contadores en una transacción.
- `/.netlify/functions/canjear-codigo`: consume el código una sola vez y genera un enlace de descarga temporal, también de un solo uso.
- `/.netlify/functions/obtener-album`: entrega metadatos de un álbum sin exponer el enlace de Drive.
- `/.netlify/functions/descargar-album`: redirige a Drive para álbumes gratuitos o mediante un token de descarga temporal tras una compra.
- `/.netlify/functions/sincronizar-album`: replica un álbum creado/editado desde el panel en las colecciones separadas.
- `/.netlify/functions/migrar-albumes`: migra álbumes históricos por lotes, con paginación.
- `/.netlify/functions/revivir-codigo`: exige token Firebase del administrador para reactivar un código.

## Separación de álbumes y enlaces de Drive

La nueva estructura usa tres colecciones:

- `albumes`: respaldo histórico y fuente administrativa; solo UID administrador puede leer/escribir desde el navegador.
- `albumesPublicos`: metadatos de álbumes públicos, sin `driveLink` ni `driveFolderId`; lectura pública solo si `esPublico == true`.
- `albumesPrivados`: documento completo, incluido el enlace de Drive; no admite lecturas ni escrituras desde el navegador. Solo Netlify Functions con Firebase Admin SDK acceden a esta colección.

La página principal consulta exclusivamente `albumesPublicos`. La página de evento obtiene los metadatos mediante `obtener-album`; los enlaces de descarga gratuita pasan por `descargar-album`, que redirige a Drive solo para álbumes gratuitos o de acceso gratis/cafecito. Los códigos de compra se canjean mediante `canjear-codigo`, que consulta `albumesPrivados` y genera un token temporal de descarga. El token expira a los 30 minutos y se consume al redirigir a Drive. El navegador no recibe el enlace de Drive desde los endpoints de metadatos o canje.

Los álbumes existentes se copian desde `albumes` mediante el botón **Proteger enlaces de Drive** del panel administrativo. La migración es por lotes, conserva los documentos originales como respaldo y puede ejecutarse más de una vez. No borrar manualmente la colección legacy durante la migración.

El enlace privado de evento conserva su formato actual con el ID del documento. Ese ID funciona como enlace no listado; no se muestra en el home. Si alguien comparte el enlace privado del evento, otra persona que lo reciba podrá ver sus muestras/metadatos. Los enlaces de Drive completos no se entregan en la respuesta pública de metadatos.

El archivo `firebase.json` apunta a las reglas. Desplegarlas únicamente después de que las funciones de Netlify estén disponibles y la migración haya terminado correctamente.

## Secuencia de despliegue sin interrumpir la galería

1. Crear un proyecto Firebase separado para pruebas y habilitar Authentication (Email/Password) y Firestore.
2. Crear el usuario administrador de pruebas y guardar su UID; el build inyecta el UID de ese contexto en las páginas.
3. En Netlify, configurar las variables del contexto Deploy Previews con las credenciales del proyecto de pruebas.
4. Esperar el Deploy Preview de la PR y probar todo el flujo en ese proyecto.
5. Configurar las variables de Production con la cuenta de servicio del proyecto publicado.
6. Una vez aprobadas las pruebas, fusionar la PR. El nuevo código mantiene compatibilidad temporal con la colección histórica, por lo que la galería sigue funcionando antes de migrar.
7. En la web publicada, entrar al panel y ejecutar **Proteger enlaces de Drive**. Verificar que los contadores de álbumes públicos/privados y los álbumes sin Drive sean correctos.
8. Solo después de verificar la migración, desplegar las reglas con `firebase deploy --only firestore:rules --project rinascere-web-2025`.

## Migración de álbumes

El panel administrativo incorpora el botón **Proteger enlaces de Drive**. Una vez desplegadas las funciones Netlify y configuradas las variables, iniciá sesión en `admin.html` y ejecutá la migración. Copia los documentos de `albumes` a `albumesPrivados` y crea una versión sin `driveLink` ni `driveFolderId` en `albumesPublicos`. La migración es repetible y conserva los documentos originales como respaldo. Revisá el resumen de álbumes sin carpeta antes de continuar.

Después de confirmar que la galería pública y los enlaces privados funcionan con las colecciones nuevas, desplegá `firestore.rules`. No cierres la colección histórica antes de migrar y comprobar los álbumes. Las reglas del repositorio no se aplican automáticamente por el deploy de Netlify.

## Limitaciones funcionales y de protección confirmadas en la revisión

- **Google Drive no queda oculto frente al comprador que descarga.** La función `descargar-album` responde con una redirección HTTP 302. El navegador recibe la URL de destino de Drive; por lo tanto, el token de un solo uso controla el acceso al endpoint de Rinascere, pero no impide que quien ya llegó a Drive copie o comparta el enlace. Para impedirlo se necesita servir los archivos mediante un proxy autenticado o almacenamiento con URLs firmadas y permisos privados. Esa solución no está implementada.
- **Los packs todavía no limitan la cantidad de fotografías descargables.** El servidor valida el nombre y el precio del pack, pero el acceso resultante redirige a la carpeta completa de Drive. La cantidad indicada en el pack es informativa y no se aplica sobre archivos individuales. No anunciar los packs como selección/descarga limitada hasta implementar esa separación.
- **Los álbumes privados son enlaces no listados, no galerías con autenticación individual.** Quien obtenga el enlace de evento puede consultar sus metadatos y muestras. No distribuir esos enlaces públicamente si contienen material sensible.
- **Los pedidos gratis siguen un flujo de entrega por WhatsApp desde el panel.** El endpoint gratuito también redirige a Drive; no es una descarga protegida contra redistribución.

Estas limitaciones no se corrigen con las reglas de Firestore: requieren cambios en la forma de entregar los archivos y en la organización de las fotos. La transferencia manual y la confirmación de pago sí están separadas del comprobante enviado por el cliente, pero eso no convierte la URL final de Drive en un enlace privado.

## Verificación obligatoria en un entorno de prueba

El workflow de GitHub Actions comprueba sintaxis de funciones y scripts JavaScript, generación de configuración y vulnerabilidades altas de dependencias de producción. Eso no sustituye pruebas conectadas a Firebase/Netlify. Antes de fusionar o publicar, probar en staging:

1. Crear una transferencia con importe correcto.
2. Alterar el precio desde el navegador y confirmar que el servidor lo rechaza.
3. Verificar que una sesión sin UID administrador no pueda confirmar ni reactivar códigos.
4. Confirmar una transferencia pendiente y comprobar que se genera un único código.
5. Intentar confirmar la misma transferencia otra vez y comprobar respuesta `409`.
6. Canjear el código una vez y comprobar que el segundo intento devuelve `403`.
7. Reactivar un código desde el panel y verificar un nuevo canje.
8. Comprobar que un token de descarga vence a los 30 minutos y no puede usarse por segunda vez.
9. Comprobar que los enlaces de Drive no aparecen en documentos de `albumesPublicos` ni en respuestas de metadatos/canje; verificar también que la redirección 302 a Drive es visible para el comprador y que los permisos de cada carpeta son los esperados.
10. Comprobar que las galerías públicas, privadas, las métricas y el panel siguen funcionando.

No se ejecutaron pruebas reales contra Firebase, Netlify ni Google Drive desde esta sesión: no hay conexión administrativa a Netlify ni credenciales de un proyecto Firebase de pruebas. El workflow de GitHub sí valida sintaxis de funciones y scripts HTML, generación del archivo de configuración web con valores ficticios y dependencias. Por eso esta rama está preparada para staging, pero no se puede certificar como lista para producción hasta ejecutar las pruebas conectadas descritas arriba.
