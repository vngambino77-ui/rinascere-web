'use strict';
const {getFirebaseAdmin,send,readBody,requireAdmin}=require('../lib/firebase-admin');
const {listFolderImages}=require('../lib/drive-private');
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return send(405,{error:'Método no permitido'});
 try{
  await requireAdmin(event);
  const body=readBody(event)||{},albumId=String(body.albumId||''),folderId=String(body.driveFolderId||'').trim();
  if(!/^[A-Za-z0-9_-]{5,150}$/.test(albumId)||!/^[A-Za-z0-9_-]{10,200}$/.test(folderId))return send(400,{error:'Álbum o carpeta inválidos'});
  const {db,admin}=getFirebaseAdmin(),base=db.collection('albumes').doc(albumId);
  const snap=await base.get();if(!snap.exists)return send(404,{error:'Álbum inexistente'});
  const files=await listFolderImages(folderId);
  if(!files.length)return send(409,{error:'La carpeta no contiene imágenes accesibles para la cuenta de servicio'});
  if(files.length>500)return send(409,{error:'La galería supera el límite actual de 500 fotografías; no se activó la venta'});
  const precio=Number(snap.data().precioFoto);
  if(!Number.isSafeInteger(precio)||precio<1)return send(409,{error:'Primero configurá el precio por unidad en el administrador'});
  const fotosOriginales=files.map((f,previewIndex)=>({previewIndex,driveFileId:f.id}));
  const fotosPreview=files.map((_,i)=>'/.netlify/functions/preview-foto?albumId='+encodeURIComponent(albumId)+'&foto='+i);
  const stamp=admin.firestore.FieldValue.serverTimestamp();
  const batch=db.batch();
  batch.set(base,{metodo:'por_unidad',precioFoto:precio,cantidadFotos:files.length,entregaIndividualActiva:true,actualizadoEn:stamp},{merge:true});
  batch.set(db.collection('albumesPrivados').doc(albumId),{driveFolderId:folderId,precioFoto:precio,fotosOriginales,entregaIndividualActiva:true,actualizadoEn:stamp},{merge:true});
  batch.set(db.collection('albumesPublicos').doc(albumId),{metodo:'por_unidad',precioFoto:precio,fotosPreview,cantidadFotos:files.length,entregaIndividualActiva:true,actualizadoEn:stamp},{merge:true});
  await batch.commit();
  return send(200,{ok:true,cantidadFotos:files.length,mensaje:'Galería y originales vinculados. Verificá las muestras con marca de agua antes de vender.'});
 }catch(e){
  if(e.message==='UNAUTHORIZED')return send(401,{error:'Iniciá sesión'});
  if(e.message==='FORBIDDEN')return send(403,{error:'No autorizado'});
  console.error('sincronizar-galeria-drive:',e);return send(502,{error:'No se pudo sincronizar Drive. Verificá que la carpeta esté compartida con la cuenta de servicio.'});
 }
};