'use strict';
const {getFirebaseAdmin,send}=require('../lib/firebase-admin');
exports.handler=async event=>{
 if(event.httpMethod!=='GET')return send(405,{error:'Método no permitido'});
 const id=String(event.queryStringParameters?.albumId||'');
 if(!/^[A-Za-z0-9_-]{5,150}$/.test(id))return send(400,{error:'Álbum inválido'});
 try{
  const {db}=getFirebaseAdmin();
  const [privateSnap,publicSnap]=await Promise.all([db.collection('albumesPrivados').doc(id).get(),db.collection('albumesPublicos').doc(id).get()]);
  if(!privateSnap.exists||!publicSnap.exists)return send(404,{error:'Catálogo no disponible'});
  const d=privateSnap.data(),p=publicSnap.data();
  if(d.entregaIndividualActiva!==true||!d.driveFolderId||!Number.isSafeInteger(Number(d.precioFoto))||Number(d.precioFoto)<=0)return send(409,{error:'La venta individual aún no está habilitada'});
  const previews=Array.isArray(p.fotosPreview)?p.fotosPreview:[];
  const inventory=Array.isArray(d.fotosOriginales)?d.fotosOriginales:[];
  const linked=new Set(inventory.filter(f=>Number.isSafeInteger(f?.previewIndex)&&/^[A-Za-z0-9_-]{10,200}$/.test(f?.driveFileId||'')).map(f=>f.previewIndex));
  const fotos=previews.map((_,i)=>i).filter(i=>linked.has(i)).slice(0,500);
  if(!fotos.length)return send(409,{error:'No hay fotografías vinculadas para venta'});
  return send(200,{ok:true,albumId:id,nombre:String(p.nombre||d.nombre||'Álbum').slice(0,180),precioUnitario:Number(d.precioFoto),packs:(Array.isArray(d.packsCarrito)?d.packsCarrito:[]).filter(x=>x.activo!==false).map(x=>({nombre:String(x.nombre||'Pack').slice(0,80),cantidad:Number(x.cantidad),precio:Number(x.precio),tipo:x.tipo||'exacto'})),modalidad:d.modalidadPacks||'automatico',fotos});
 }catch(e){console.error('catalogo-carrito',e);return send(503,{error:'No se pudo consultar el catálogo'});}
};
