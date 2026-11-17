'use strict';
const crypto=require('node:crypto');
const {getFirebaseAdmin,send,readBody}=require('../lib/firebase-admin');
const {calcularCarrito}=require('../lib/precios-rinascere');
const clean=(v,n)=>String(v||'').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,n);
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return send(405,{error:'Método no permitido'});
 const body=readBody(event);if(!body)return send(400,{error:'Solicitud inválida'});
 const albumId=clean(body.albumId,150),comprador=clean(body.comprador,120),contacto=clean(body.contacto,160);
 if(!/^[a-zA-Z0-9_-]{5,150}$/.test(albumId)||comprador.length<2||contacto.length<5)return send(400,{error:'Faltan datos del comprador'});
 try{
 const {db,admin}=getFirebaseAdmin();
 const ip=String(event.headers?.['x-nf-client-connection-ip']||event.headers?.['x-forwarded-for']||'unknown').split(',')[0].trim();
 const key=crypto.createHash('sha256').update(ip).digest('hex');
 const refLimite=db.collection('limitesTransferencias').doc(key),now=Date.now();
 const permitido=await db.runTransaction(async tx=>{
 const s=await tx.get(refLimite),p=s.exists?s.data():{},activo=p.inicio?.toMillis?.()>now-3600000,n=activo?(Number(p.cantidad)||0):0;
 if(n>=15)return false;tx.set(refLimite,{inicio:activo?p.inicio:admin.firestore.Timestamp.fromMillis(now),cantidad:n+1});return true;
 });
 if(!permitido)return send(429,{error:'Límite de pedidos alcanzado. Intentá más tarde'});
 let album=await db.collection('albumesPrivados').doc(albumId).get();
 if(!album.exists)album=await db.collection('albumes').doc(albumId).get();
 if(!album.exists)return send(404,{error:'Álbum no encontrado'});
 const data=album.data();
 if(!data.driveLink)return send(409,{error:'Este álbum no tiene entrega configurada'});
 const previews=Array.isArray(data.fotosPreview)?data.fotosPreview:[];
 const fotos=body.fotos;
 if(!Array.isArray(fotos)||fotos.length>500||fotos.length===0)return send(400,{error:'Seleccioná fotos del álbum'});
 const indices=fotos.map(Number);
 if(indices.some(i=>!Number.isSafeInteger(i)||i<0||i>=previews.length)||new Set(indices).size!==indices.length)return send(400,{error:'Selección inválida'});
 const unitario=Number(data.precioFoto);
 if(!Number.isSafeInteger(unitario)||unitario<=0)return send(409,{error:'El precio individual todavía no está configurado para este álbum'});
 const packs=Array.isArray(data.packs)?data.packs.filter(p=>Number.isSafeInteger(Number(p.cantidad))&&Number(p.cantidad)>1&&Number.isSafeInteger(Number(p.precio))&&Number(p.precio)>0).map(p=>({nombre:String(p.nombre||'Pack'),cantidad:Number(p.cantidad),precio:Number(p.precio)})):[];
 const calculo=calcularCarrito({fotos:indices.map(i=>'foto_'+i),precioUnitario:unitario,packs});
 const pedido=await db.collection('transferencias').add({albumId,albumNombre:clean(data.nombre,180),comprador,contacto,metodo:'transferencia',tipo:'carrito_fotos',fotosIndices:indices, cantidadFotos:indices.length,monto:calculo.total,desglose:calculo.desglose,estado:'pendiente',fecha:admin.firestore.FieldValue.serverTimestamp()});
 return send(201,{ok:true,transferenciaId:pedido.id,estado:'pendiente',monto:calculo.total,alias:'verogfotos.nx.arg',cantidadFotos:indices.length});
 }catch(error){console.error('crear-carrito:',error);return send(500,{error:'No se pudo registrar el carrito'});}
};
