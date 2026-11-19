'use strict';
const {getFirebaseAdmin,send,readBody}=require('../lib/firebase-admin');
const clean=(x,n)=>String(x||'').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,n);
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return send(405,{error:'Método no permitido'});
 const body=readBody(event);if(!body)return send(400,{error:'Solicitud inválida'});
 const albumId=clean(body.albumId,150),nombre=clean(body.nombre,120),contacto=clean(body.contacto,160),uso=clean(body.uso,80),medidas=clean(body.medidas,80),formato=clean(body.formato,40),observaciones=clean(body.observaciones,700),foto=Number(body.foto);
 if(!/^[A-Za-z0-9_-]{5,150}$/.test(albumId)||nombre.length<2||contacto.length<5||!['Banner','Gigantografía','Impresión profesional','Otro'].includes(uso)||!Number.isSafeInteger(foto)||foto<0||foto>499)return send(400,{error:'Completá los datos y seleccioná una fotografía'});
 try{
  const {db,admin}=getFirebaseAdmin();
  let album=await db.collection('albumesPublicos').doc(albumId).get();
  if(!album.exists)album=await db.collection('albumes').doc(albumId).get();
  if(!album.exists)return send(404,{error:'Álbum no disponible'});
  const previews=album.data().fotosPreview;
  if(!Array.isArray(previews)||foto>=previews.length)return send(400,{error:'Fotografía inválida'});
  const ref=await db.collection('solicitudesEspeciales').add({albumId,foto,nombre,contacto,uso,medidas,formato,observaciones,estado:'pendiente_cotizacion',entrega:'privada_manual',precioConfirmado:false,fecha:admin.firestore.FieldValue.serverTimestamp()});
  return send(201,{ok:true,solicitudId:ref.id,estado:'pendiente_cotizacion',mensaje:'Recibimos tu solicitud. Rinascere confirmará precio, formato y entrega de forma privada. No realices pagos todavía.'});
 }catch(e){console.error('solicitar-archivo-especial:',e);return send(500,{error:'No pudimos registrar la solicitud'});}
};
