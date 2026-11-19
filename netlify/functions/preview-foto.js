'use strict';
const sharp=require('sharp');
const {getFirebaseAdmin}=require('../lib/firebase-admin');
const {previewSource}=require('../lib/drive-private');
exports.handler=async event=>{
 if(event.httpMethod!=='GET')return {statusCode:405,body:'Método no permitido'};
 try{
  const id=String(event.queryStringParameters?.albumId||''),i=Number(event.queryStringParameters?.foto);
  if(!/^[A-Za-z0-9_-]{5,150}$/.test(id)||!Number.isSafeInteger(i)||i<0||i>=500)return {statusCode:400,body:'Solicitud inválida'};
  const {db}=getFirebaseAdmin();
  const snap=await db.collection('albumesPrivados').doc(id).get();
  if(!snap.exists)return {statusCode:404,body:'No disponible'};
  const d=snap.data(),file=d.fotosOriginales?.find(x=>x.previewIndex===i);
  if(!d.driveFolderId||!file||!d.entregaIndividualActiva)return {statusCode:404,body:'No disponible'};
  const bytes=await previewSource(file.driveFileId,d.driveFolderId);
  const reduced=await sharp(bytes).rotate().resize({width:900,height:900,fit:'inside',withoutEnlargement:true}).toBuffer();
  const meta=await sharp(reduced).metadata(),w=meta.width,h=meta.height;
  const svg=Buffer.from('<svg width="'+w+'" height="'+h+'" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(-25 '+w/2+' '+h/2+')"><text x="50%" y="50%" text-anchor="middle" fill="white" fill-opacity=".5" font-size="46" font-family="sans-serif" font-weight="bold">RINASCERE · MUESTRA</text></g></svg>');
  const out=await sharp(reduced).composite([{input:svg,gravity:'centre'}]).jpeg({quality:65}).toBuffer();
  return {statusCode:200,isBase64Encoded:true,headers:{'Content-Type':'image/jpeg','Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'},body:out.toString('base64')};
 }catch(e){console.error('preview-foto',e);return {statusCode:404,body:'Muestra no disponible'};}
};