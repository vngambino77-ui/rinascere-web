'use strict';
const {getFirebaseAdmin,send,readBody,requireAdmin}=require('../lib/firebase-admin');
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return send(405,{error:'Método no permitido'});
 try{
  await requireAdmin(event);
  const b=readBody(event)||{},id=String(b.albumId||'').trim();
  if(!/^[A-Za-z0-9_-]{5,150}$/.test(id))return send(400,{error:'Álbum inválido'});
  const orden=Number(b.orden);
  if(!Number.isSafeInteger(orden)||orden<0||orden>9999||typeof b.publicar!=='boolean')return send(400,{error:'Elegí un orden entre 0 y 9999 y un estado de publicación'});
  const {db,admin}=getFirebaseAdmin(),ref=db.collection('albumes').doc(id),snap=await ref.get();
  if(!snap.exists)return send(404,{error:'Álbum no encontrado'});
  const album=snap.data();
  if(b.publicar&&!album.driveLink)return send(400,{error:'Configurá la carpeta de Google Drive antes de publicar'});
  const cambio={ordenPublicacion:orden,esPublico:b.publicar,actualizadoEn:admin.firestore.FieldValue.serverTimestamp()};
  await ref.update(cambio);
  const data={...album,ordenPublicacion:orden,esPublico:b.publicar};
  const privateRef=db.collection('albumesPrivados').doc(id),publicRef=db.collection('albumesPublicos').doc(id);
  await privateRef.set({...data,migratedAt:new Date().toISOString()});
  if(b.publicar){
   const {driveLink,driveFolderId,privateTokenHash,privateAccessToken,downloadUrl,codigoAcceso,...safe}=data;
   await publicRef.set(safe);
  }else await publicRef.delete();
  return send(200,{ok:true,publicado:b.publicar,orden});
 }catch(e){
  if(e.message==='UNAUTHORIZED')return send(401,{error:'Iniciá sesión como administradora'});
  if(e.message==='FORBIDDEN')return send(403,{error:'Acceso denegado'});
  console.error('configurar-publicacion-album',e);return send(500,{error:'No se pudo guardar la publicación'});
 }
};