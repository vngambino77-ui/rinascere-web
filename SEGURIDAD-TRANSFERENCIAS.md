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

## Reglas Firestore

El archivo `firestore.rules` bloquea la creación directa de transferencias y todo acceso de navegador a `codigosAcceso`; permite las operaciones administrativas autenticadas y conserva las lecturas actuales de álbumes para no romper las galerías existentes.

**Limitación pendiente importante:** los documentos actuales de `albumes` contienen `driveLink`. Firestore no puede ocultar ese campo y permitir a la vez leer el resto del documento. Por compatibilidad, esta versión conserva la lectura de esos documentos; por lo tanto, todavía no es posible afirmar que los enlaces de Drive estén protegidos frente a quien pueda leer el documento o compartir el enlace. La solución completa requiere migrar los datos a dos colecciones (`albumesPublicos` y `albumesPrivados`), adaptar la portada, la galería y el panel, y migrar los álbumes existentes antes de cerrar la lectura pública de la colección legacy.

El archivo `firebase.json` apunta a estas reglas. No desplegar las reglas hasta verificar las operaciones del panel y migrar los álbumes si se desea ocultar los enlaces de Drive.

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
