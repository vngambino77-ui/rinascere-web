'use strict';
const crypto=require('node:crypto');
const {getFirebaseAdmin,send,readBody}=require('../lib/firebase-admin');
const clean=(v,max)=>String(v||'').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,max);
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return send(405,{error:'Método no permitido'});
 const body=readBody(event);if(!body)return send(400,{error:'Solicitud inválida'});
 const nombre=clean(body.nombre,120),contacto=clean(body.contacto,160),servicio=clean(body.servicio,80);
 const fecha=clean(body.fecha,10),lugar=clean(body.lugar,160),duracion=clean(body.duracion,60),detalles=clean(body.detalles,1500);
 const servicios=['Espectáculos','Eventos','Deporte','Retratos personalizados','Otro'];
 if(nombre.length<2||contacto.length<5||!servicios.includes(servicio)||detalles.length<10||!(!fecha||/^\d{4}-\d{2}-\d{2}$/.test(fecha)))return send(400,{error:'Revisá los datos obligatorios'});
 try{
 const {db,admin}=getFirebaseAdmin();
 const ip=String(event.headers?.['x-nf-client-connection-ip']||event.headers?.['x-forwarded-for']||'unknown').split(',')[0].trim();
 const key=crypto.createHash('sha256').update(ip).digest('hex');
 const limite=db.collection('limitesCotizaciones').doc(key);
 const permitido=await db.runTransaction(async tx=>{
 const snap=await tx.get(limite);const now=Date.now();const prev=snap.exists?snap.data():{};
 const activo=prev.inicio?.toMillis?.()>now-3600000;const cantidad=activo?(Number(prev.cantidad)||0):0;
 if(cantidad>=5)return false;
 tx.set(limite,{inicio:activo?prev.inicio:admin.firestore.Timestamp.fromMillis(now),cantidad:cantidad+1});return true;
 });
 if(!permitido)return send(429,{error:'Demasiadas solicitudes. Intentá más tarde'});
 const doc=await db.collection('cotizaciones').add({nombre,contacto,servicio,fecha,lugar,duracion,detalles,estado:'pendiente',origen:'web',creadoEn:admin.firestore.FieldValue.serverTimestamp()});
 return send(201,{ok:true,solicitudId:doc.id});
 }catch(error){console.error('solicitar-cotizacion:',error);return send(500,{error:'No se pudo registrar la cotización'});}
};
