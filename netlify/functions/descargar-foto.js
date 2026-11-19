'use strict';
const crypto=require('node:crypto');
const {getFirebaseAdmin,send}=require('../lib/firebase-admin');
const {downloadFile}=require('../lib/drive-private');
exports.handler=async event=>{
 if(event.httpMethod!=='GET')return send(405,{error:'Método no permitido'});
 const q=event.queryStringParameters||{},token=String(q.token||''),index=Number(q.foto);
 if(!/^[a-f0-9]{64}$/.test(token)||!Number.isSafeInteger(index)||index<0||index>499)return send(400,{error:'Solicitud inválida'});
 try{
  const {db}=getFirebaseAdmin(),hash=crypto.createHash('sha256').update(token).digest('hex');
  const snap=await db.collection('descargasFotos').doc(hash).get();
  if(!snap.exists)return send(403,{error:'Enlace no autorizado'});
  const d=snap.data();
  if(!d.vence||d.vence.toMillis()<Date.now()||!Array.isArray(d.fotosDriveIds)||index>=d.fotosDriveIds.length)return send(403,{error:'Enlace vencido o fotografía no comprada'});
  const album=await db.collection('albumesPrivados').doc(d.albumId).get();
  if(!album.exists)return send(404,{error:'Álbum no disponible'});
  const folderId=album.data().driveFolderId;
  if(!folderId)return send(409,{error:'La carpeta privada de Drive no está configurada'});
  const {bytes,name,mime}=await downloadFile(d.fotosDriveIds[index],folderId);
  return {statusCode:200,isBase64Encoded:true,headers:{'Content-Type':mime,'Content-Disposition':'attachment; filename="'+name+'"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},body:bytes.toString('base64')};
 }catch(e){console.error('descargar-foto:',e);return send(e.message==='DRIVE_FILE_TOO_LARGE'?413:502,{error:e.message==='DRIVE_FILE_TOO_LARGE'?'Este original supera el límite de descarga del servidor de pruebas': 'No se pudo entregar la fotografía de forma segura'})}
};
