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
 const [privateAlbum,legacyAlbum]=await Promise.all([db.collection('albumesPrivados').doc(albumId).get(),db.collection('albumes').doc(albumId).get()]);
 if(!privateAlbum.exists&&!legacyAlbum.exists)return send(404,{error:'Álbum no encontrado'});
 const data={...(legacyAlbum.exists?legacyAlbum.data():{}),...(privateAlbum.exists?privateAlbum.data():{})};
 // No aceptar pagos de fotos individuales hasta disponer de entrega segura por archivo.
 if(data.entregaIndividualActiva!==true)return send(409,{error:'La compra individual aún no está habilitada para este álbum. Podés comprar los packs disponibles o solicitar información.'});
 if(!data.driveFolderId)return send(409,{error:'Este álbum no tiene carpeta privada de originales configurada'});
 // Una carpeta compartida no sirve para entregar compras individuales: expone fotos no compradas.
 // Exigir un inventario privado de archivos originales con identificadores únicos de Drive.
 const originales=Array.isArray(data.fotosOriginales)?data.fotosOriginales:[];
 if(!originales.length)return send(409,{error:'Falta configurar el inventario privado de fotos originales de Drive para este álbum'});
 const previews=[...(data.metodo==='por_unidad'?[(await db.collection('albumesPublicos').doc(albumId).get()).data()?.fotosPreview]:[]),privateAlbum.exists?privateAlbum.data().fotosPreview:null,legacyAlbum.exists?legacyAlbum.data().fotosPreview:null].find(v=>Array.isArray(v)&&v.length>0)||[];
 const fotos=body.fotos;
 if(!Array.isArray(fotos)||fotos.length>500||fotos.length===0)return send(400,{error:'Seleccioná fotos del álbum'});
 const indices=fotos.map(Number);
 if(indices.some(i=>!Number.isSafeInteger(i)||i<0||i>=previews.length)||new Set(indices).size!==indices.length)return send(400,{error:'Selección inválida'});
 const originalesSeleccionados=indices.map(i=>originales.find(f=>f&&f.previewIndex===i));
 if(originalesSeleccionados.some(f=>!f||typeof f.driveFileId!=='string'||!/^[A-Za-z0-9_-]{10,200}$/.test(f.driveFileId)))return send(409,{error:'No están vinculados los originales de Drive para todas las fotos seleccionadas'});
 if(new Set(originalesSeleccionados.map(f=>f.driveFileId)).size!==indices.length)return send(409,{error:'El inventario de originales contiene archivos duplicados'});
 const unitario=Number(data.precioFoto);
 if(!Number.isSafeInteger(unitario)||unitario<=0)return send(409,{error:'El precio individual todavía no está configurado para este álbum'});
 const packs=Array.isArray(data.packsCarrito)?data.packsCarrito:[];
 const modalidad=data.modalidadPacks||'automatico';
 const calculo=calcularCarrito({fotos:indices.map(i=>'foto_'+i),precioUnitario:unitario,packs,modalidad});
 const pedido=await db.collection('transferencias').add({albumId,albumNombre:clean(data.nombre,180),comprador,contacto,metodo:'transferencia',tipo:'carrito_fotos',fotosIndices:indices, fotosDriveIds:originalesSeleccionados.map(f=>f.driveFileId), cantidadFotos:indices.length,monto:calculo.total,desglose:calculo.desglose,estado:'pendiente',fecha:admin.firestore.FieldValue.serverTimestamp()});
 return send(201,{ok:true,transferenciaId:pedido.id,estado:'pendiente',monto:calculo.total,alias:'verogfotos.nx.arg',cantidadFotos:indices.length});
 }catch(error){console.error('crear-carrito:',error);return send(500,{error:'No se pudo registrar el carrito'});}
};
