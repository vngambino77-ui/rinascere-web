'use strict';
const {getFirebaseAdmin,send,readBody,requireAdmin}=require('../lib/firebase-admin');
const clean=(v,n)=>String(v??'').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,n);
const categorias=['Espectáculos','Eventos','Deporte','Retratos personalizados'];
exports.handler=async(event)=>{
 const method=event.httpMethod;
 if(!['GET','POST','DELETE'].includes(method))return send(405,{error:'Método no permitido'});
 try{
 const {db,admin}=getFirebaseAdmin(),collection=db.collection('paquetesServicios');
 if(method==='GET'){
  const snapshot=await collection.limit(100).get();
  const paquetes=snapshot.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.publicado===true)
   .map(p=>({id:p.id,titulo:p.titulo,categoria:p.categoria,descripcion:p.descripcion,incluye:p.incluye,precio:p.precio,moneda:'ARS',orden:p.orden||0}))
   .sort((a,b)=>a.orden-b.orden||a.titulo.localeCompare(b.titulo,'es'));
  return send(200,{ok:true,paquetes});
 }
 await requireAdmin(event);
 const body=readBody(event)||{};
 if(method==='DELETE'){
  const id=clean(body.id,100);if(!/^[a-zA-Z0-9_-]{5,100}$/.test(id))return send(400,{error:'ID inválido'});
  await collection.doc(id).delete();return send(200,{ok:true});
 }
 const id=clean(body.id,100),titulo=clean(body.titulo,100),categoria=clean(body.categoria,80),descripcion=clean(body.descripcion,600),incluye=clean(body.incluye,600);
 const precio=Number(body.precio),orden=Number(body.orden||0);
 if(titulo.length<3||!categorias.includes(categoria)||!descripcion||!Number.isSafeInteger(precio)||precio<=0||precio>100000000||!Number.isSafeInteger(orden)||orden<0||orden>9999)
  return send(400,{error:'Revisá título, categoría, descripción y precio entero en ARS'});
 const data={titulo,categoria,descripcion,incluye,precio,orden,publicado:body.publicado===true,actualizadoEn:admin.firestore.FieldValue.serverTimestamp()};
 const ref=id?collection.doc(id):collection.doc();
 if(id&&!/^[a-zA-Z0-9_-]{5,100}$/.test(id))return send(400,{error:'ID inválido'});
 await ref.set(data,{merge:true});return send(200,{ok:true,id:ref.id});
 }catch(e){
 if(e.message==='UNAUTHORIZED')return send(401,{error:'Iniciá sesión como administradora'});
 if(e.message==='FORBIDDEN')return send(403,{error:'Acceso denegado'});
 console.error('paquetes-servicios',e);return send(500,{error:'No se pudo procesar la solicitud'});
 }
};
