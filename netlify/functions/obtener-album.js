const { getFirebaseAdmin, send, readBody } = require('../lib/firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return send(405, { error: 'Método no permitido' });
  try {
    const params = event.httpMethod === 'GET' ? (event.queryStringParameters || {}) : (readBody(event) || {});
    const albumId = String(params.albumId || params.album || '').trim();
    if (!/^[A-Za-z0-9_-]{5,150}$/.test(albumId)) return send(400, { error: 'Álbum inválido' });
    const { db } = getFirebaseAdmin();
    const [publicSnap, privateSnap, legacySnap] = await Promise.all([
      db.collection('albumesPublicos').doc(albumId).get(),
      db.collection('albumesPrivados').doc(albumId).get(),
      db.collection('albumes').doc(albumId).get()
    ]);
    if (!publicSnap.exists && !privateSnap.exists && !legacySnap.exists) {
      return send(404, { error: 'El álbum no existe o no está disponible' });
    }
    // El catálogo público puede tener datos desactualizados respecto del álbum
    // administrativo. Solo recuperar los campos de muestra necesarios.
    const data = {
      ...(legacySnap.exists ? legacySnap.data() : {}),
      ...(privateSnap.exists ? privateSnap.data() : {}),
      ...(publicSnap.exists ? publicSnap.data() : {})
    };
    const previews = [
      publicSnap.exists ? publicSnap.data().fotosPreview : null,
      privateSnap.exists ? privateSnap.data().fotosPreview : null,
      legacySnap.exists ? legacySnap.data().fotosPreview : null
    ].find(v => Array.isArray(v) && v.length > 0);
    data.fotosPreview = Array.isArray(previews) ? previews.filter(url => typeof url === 'string' && /^https:\/\//i.test(url)) : [];
    if (privateSnap.exists) {
      const privado = privateSnap.data();
      if (privado.precioFoto != null) data.precioFoto = privado.precioFoto;
      data.entregaIndividualActiva = privado.entregaIndividualActiva === true;
    }

    // Lista explícita: no exponer accidentalmente campos privados de Firebase.
    const visible = ['nombre','fecha','lugar','portadaUrl','cantidadFotos','categoria',
      'tipoCategoria','metodo','precio','packs','precioFoto','packsCarrito',
      'modalidadPacks','entregaIndividualActiva','esPublico','descripcion'];
    const safeAlbum = {};
    for (const campo of visible) if (data[campo] !== undefined) safeAlbum[campo] = data[campo];
    safeAlbum.fotosPreview = data.fotosPreview;
    return send(200, { ok: true, album: { id: albumId, ...safeAlbum } });
  } catch (error) {
    console.error('obtener-album:', error);
    return send(500, { error: 'No se pudo cargar el álbum' });
  }
};