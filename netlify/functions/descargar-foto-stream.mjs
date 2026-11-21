import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {getFirebaseAdmin}=require('../lib/firebase-admin.js');
const {streamFile}=require('../lib/drive-private.js');
const json=(status,message)=>Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
export default async function handler(request){
 if(request.method!=='GET')return json(405,'Método no permitido');
 const q=new URL(request.url).searchParams,token=q.get('token')||'',raw=q.get('foto');
 if(!/^[a-f0-9]{64}$/.test(token)||raw===null||!/^(0|[1-9][0-9]{0,2})$/.test(raw))return json(400,'Solicitud inválida');
 const index=Number(raw);
 if(index>499)return json(400,'Solicitud inválida');
 try{
  const {db}=getFirebaseAdmin();
  const hash=crypto.createHash('sha256').update(token).digest('hex');
  const snap=await db.collection('descargasFotos').doc(hash).get();
  if(!snap.exists)return json(403,'Enlace no autorizado');
  const data=snap.data();
  if(!data.vence||data.vence.toMillis()<Date.now()||!Array.isArray(data.fotosDriveIds)||index>=data.fotosDriveIds.length)return json(403,'Enlace vencido o fotografía no comprada');
  const album=await db.collection('albumesPrivados').doc(data.albumId).get();
  if(!album.exists||!album.data().driveFolderId)return json(409,'Carpeta privada no configurada');
  const {body,name,mime,size}=await streamFile(data.fotosDriveIds[index],album.data().driveFolderId);
  return new Response(body,{status:200,headers:{'Content-Type':mime,'Content-Length':String(size),'Content-Disposition':'attachment; filename="'+name+'"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
 }catch(error){
  console.error('descargar-foto-stream:',error);
  if(error.message==='DRIVE_FILE_TOO_LARGE')return json(413,'El original supera el máximo seguro de 19 MB para Netlify. No se entregó un archivo incompleto.');
  return json(502,'No se pudo entregar la fotografía de forma segura');
 }
}
