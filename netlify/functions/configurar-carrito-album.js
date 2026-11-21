'use strict';
const {getFirebaseAdmin,send,readBody,requireAdmin}=require('../lib/firebase-admin');
const validId=s=>/^[A-Za-z0-9_-]{5,150}$/.test(s);
const validDrive=s=>/^[A-Za-z0-9_-]{10,200}$/.test(s);
exports.handler=async event=>{
 if(!['GET','POST'].includes(event.httpMethod))return send(405,{error:'Método no permitido'});
 try{
  await requireAdmin(event);
  const body=event.httpMethod==='POST'?readBody(event):(event.queryStringParameters||{});
  if(!body||!validId(String(body.albumId||'')))return send(400,{error:'Álbum inválido'});
  const {db,admin}=getFirebaseAdmin(),id=body.albumId,base=db.collection('albumes').doc(id),snap=await base.get();
  if(!snap.exists)return send(404,{error:'Álbum inexistente'});
  const privateRef=db.collection('albumesPrivados').doc(id),privateSnap=await privateRef.get(),data={...snap.data(),...(privateSnap.exists?privateSnap.data():{})};
  const previews=Array.isArray(data.fotosPreview)?data.fotosPreview:[];
  const originales=Array.isArray(data.fotosOriginales)?data.fotosOriginales:[];
  if(event.httpMethod==='GET')return send(200,{ok:true,albumId:id,nombre:data.nombre||'',precioFoto:Number(data.precioFoto)||0,entregaIndividualActiva:data.entregaIndividualActiva===true,driveFolderId:data.driveFolderId||'',cantidadPreviews:previews.length,fotosOriginales:originales,configurado:originales.length===previews.length&&previews.length>0});
  const precio=Number(body.precioFoto),folder=String(body.driveFolderId||'').trim(),active=body.entregaIndividualActiva===true,items=body.fotosOriginales;
  if(!Number.isSafeInteger(precio)||precio<0||precio>100000000)return send(400,{error:'Precio inválido'});
  if(folder&&!validDrive(folder))return send(400,{error:'ID de carpeta Drive inválido'});
  if(!Array.isArray(items)||items.length>500)return send(400,{error:'Inventario inválido'});
  const seenIndices=new Set(),seenIds=new Set(),clean=[];
  for(const item of items){
   const i=Number(item?.previewIndex),driveFileId=String(item?.driveFileId||'').trim();
   if(!Number.isSafeInteger(i)||i<0||i>=previews.length||!validDrive(driveFileId)||seenIndices.has(i)||seenIds.has(driveFileId))return send(400,{error:'Índices o archivos originales inválidos/duplicados'});
   seenIndices.add(i);seenIds.add(driveFileId);clean.push({previewIndex:i,driveFileId});
  }
  if(active&&(precio<1||!folder||!previews.length||clean.length!==previews.length||!previews.every((_,i)=>seenIndices.has(i))))return send(409,{error:'Para activar: precio mayor a cero, carpeta Drive y un original distinto para cada fotografía de muestra'});
  // Never publish Drive IDs to public album documents.
  const batch=db.batch(),stamp=admin.firestore.FieldValue.serverTimestamp();
  batch.set(base,{precioFoto:precio,entregaIndividualActiva:active,actualizadoEn:stamp},{merge:true});
  batch.set(privateRef,{precioFoto:precio,entregaIndividualActiva:active,driveFolderId:folder,fotosOriginales:clean,actualizadoEn:stamp},{merge:true});
  const publicRef=db.collection('albumesPublicos').doc(id),pub=await publicRef.get();
  if(pub.exists)batch.set(publicRef,{precioFoto:precio,entregaIndividualActiva:active},{merge:true});
  await batch.commit();
  return send(200,{ok:true,albumId:id,precioFoto:precio,entregaIndividualActiva:active,cantidadVinculada:clean.length});
 }catch(e){
  if(e.message==='UNAUTHORIZED')return send(401,{error:'Iniciá sesión'});
  if(e.message==='FORBIDDEN')return send(403,{error:'No autorizado'});
  console.error('configurar-carrito-album:',e);return send(500,{error:'No se pudo guardar la configuración'});
 }
};
