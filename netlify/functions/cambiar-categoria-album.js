'use strict';
const {getFirebaseAdmin,send,readBody,requireAdmin}=require('../lib/firebase-admin');
const categories=['espectaculos','eventos','deportes','retratos'];
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return send(405,{error:'Método no permitido'});
 try{
  await requireAdmin(event);
  const body=readBody(event)||{},id=String(body.albumId||''),categoria=String(body.categoria||'');
  if(!/^[A-Za-z0-9_-]{5,150}$/.test(id)||!categories.includes(categoria))return send(400,{error:'Álbum o categoría inválidos'});
  const {db,admin}=getFirebaseAdmin(),base=db.collection('albumes').doc(id),snap=await base.get();
  if(!snap.exists)return send(404,{error:'Álbum no encontrado'});
  const batch=db.batch(),change={categoria,actualizadoEn:admin.firestore.FieldValue.serverTimestamp()};
  batch.update(base,change);
  for(const col of ['albumesPublicos','albumesPrivados']){
   const ref=db.collection(col).doc(id),s=await ref.get();
   if(s.exists)batch.update(ref,{categoria});
  }
  await batch.commit();
  return send(200,{ok:true,albumId:id,categoria});
 }catch(e){
  if(e.message==='UNAUTHORIZED')return send(401,{error:'Iniciá sesión'});
  if(e.message==='FORBIDDEN')return send(403,{error:'No autorizado'});
  console.error('cambiar-categoria-album:',e);return send(500,{error:'No se pudo cambiar la categoría'});
 }
};