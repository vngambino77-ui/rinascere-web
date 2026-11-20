'use strict';
const {getFirebaseAdmin,send,readBody,requireAdmin}=require('../lib/firebase-admin');
const valido=id=>/^[A-Za-z0-9_-]{5,150}$/.test(id);
exports.handler=async event=>{
 if(!['GET','POST'].includes(event.httpMethod))return send(405,{error:'Método no permitido'});
 try{
  await requireAdmin(event);
  const body=event.httpMethod==='POST'?readBody(event):(event.queryStringParameters||{});
  if(!body)return send(400,{error:'Solicitud inválida'});
  const id=String(body.albumId||'').trim();
  if(!valido(id))return send(400,{error:'Álbum inválido'});
  const {db,admin}=getFirebaseAdmin(),ref=db.collection('albumes').doc(id),snap=await ref.get();
  if(!snap.exists)return send(404,{error:'Álbum no encontrado'});
  const data=snap.data();
  if(event.httpMethod==='GET')return send(200,{ok:true,albumId:id,precioFoto:data.precioFoto||0,modalidad:data.modalidadPacks||'automatico',packs:data.packsCarrito||[]});
  const precioFoto=Number(body.precioFoto),modalidad=body.modalidad;
  if(!Number.isSafeInteger(precioFoto)||precioFoto<1||precioFoto>100000000)return send(400,{error:'Precio individual inválido'});
  if(!['exacto','hasta','automatico'].includes(modalidad))return send(400,{error:'Modalidad inválida'});
  if(!Array.isArray(body.packs)||body.packs.length>40)return send(400,{error:'Máximo 40 packs por álbum'});
  const ids=new Set(),packs=[];
  for(const p of body.packs){
   const packId=String(p.id||'').trim(),nombre=String(p.nombre||'').trim();
   const cantidad=Number(p.cantidad),precio=Number(p.precio);
   if(!/^[A-Za-z0-9_-]{5,80}$/.test(packId)||ids.has(packId)||nombre.length<1||nombre.length>80||
      !Number.isSafeInteger(cantidad)||cantidad<5||cantidad>500||
      !Number.isSafeInteger(precio)||precio<1||precio>100000000||
      !['exacto','hasta'].includes(p.tipo)||typeof p.activo!=='boolean')
    return send(400,{error:'Datos de pack inválidos o duplicados'});
   ids.add(packId);packs.push({id:packId,nombre,cantidad,precio,tipo:p.tipo,activo:p.activo});
  }
  const cambio={precioFoto,modalidadPacks:modalidad,packsCarrito:packs,actualizadoEn:admin.firestore.FieldValue.serverTimestamp()};
  // Guardar los precios de todas las colecciones de forma atómica.
  // Si una escritura falla, no queda un precio distinto entre admin y carrito.
  const privado=db.collection('albumesPrivados').doc(id);
  const publico=db.collection('albumesPublicos').doc(id);
  const pub=await publico.get();
  const batch=db.batch();
  batch.update(ref,cambio);
  batch.set(privado,cambio,{merge:true});
  if(pub.exists)batch.set(publico,{precioFoto,modalidadPacks:modalidad,packsCarrito:packs},{merge:true});
  await batch.commit();
  return send(200,{ok:true,albumId:id,precioFoto,modalidad,packs});
 }catch(e){
  if(e.message==='UNAUTHORIZED')return send(401,{error:'Iniciá sesión'});
  if(e.message==='FORBIDDEN')return send(403,{error:'No autorizado'});
  console.error('configurar-packs-album:',e);return send(500,{error:'No se pudo guardar el catálogo'});
 }
};
