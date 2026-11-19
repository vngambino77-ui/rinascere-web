'use strict';
const {getFirebaseAdmin,send,readBody,requireAdmin}=require('../lib/firebase-admin');
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return send(405,{error:'Método no permitido'});
 try{
  await requireAdmin(event);
  const body=readBody(event)||{};
  const id=String(body.albumId||'').trim();
  const nombre=String(body.nombre||'').trim().replace(/\\s+/g,' ');
  if(!/^[A-Za-z0-9_-]{5,150}$/.test(id))return send(400,{error:'Álbum inválido'});
  if(nombre.length<2||nombre.length>120||/[<>\\x00-\\x1f]/.test(nombre))return send(400,{error:'Ingresá un nombre válido (2 a 120 caracteres)'});
  const {db,admin}=getFirebaseAdmin();
  const base=db.collection('albumes').doc(id),snap=await base.get();
  if(!snap.exists)return send(404,{error:'Álbum no encontrado'});
  const batch=db.batch();
  batch.update(base,{nombre,actualizadoEn:admin.firestore.FieldValue.serverTimestamp()});
  for(const col of ['albumesPublicos','albumesPrivados']){
   const ref=db.collection(col).doc(id),s=await ref.get();
   if(s.exists)batch.update(ref,{nombre});
  }
  await batch.commit();
  return send(200,{ok:true,albumId:id,nombre});
 }catch(e){
  if(e.message==='UNAUTHORIZED')return send(401,{error:'Iniciá sesión'});
  if(e.message==='FORBIDDEN')return send(403,{error:'No autorizado'});
  console.error('renombrar-album:',e);return send(500,{error:'No se pudo cambiar el nombre'});
 }
};