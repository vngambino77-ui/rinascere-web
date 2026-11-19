'use strict';
const { getFirebaseAdmin, send } = require('../lib/firebase-admin');
// Solo datos autorizados para mostrarse en el catálogo público.
exports.handler = async event => {
 if(event.httpMethod!=='GET')return send(405,{error:'Método no permitido'});
 try {
  const {db}=getFirebaseAdmin();
  const snap=await db.collection('albumesPrivados').get();
  const porId=new Map(snap.docs.filter(d=>d.data().esPublico===false).map(d=>[d.id,d.data()]));
  // Compatibilidad con álbumes privados anteriores a la migración.
  // Consulta solo del lado del servidor: nunca se devuelven enlaces ni tokens.
  const antiguos=await db.collection('albumes').where('esPublico','==',false).get();
  for(const d of antiguos.docs)if(!porId.has(d.id))porId.set(d.id,d.data());
  const albumes=Array.from(porId,([id,a])=>{
   return {id,nombre:String(a.nombre||''),portadaUrl:String(a.portadaUrl||''),
    fecha:String(a.fecha||''),lugar:String(a.lugar||''),cantidadFotos:Number(a.cantidadFotos)||0,
    categoria:String(a.categoria||a.tipoCategoria||''),ordenPublicacion:Number.isFinite(Number(a.ordenPublicacion))?Number(a.ordenPublicacion):9999,
    publico:false};
  });
  return send(200,{albumes});
 }catch(e){console.error('listar-portadas-privadas:',e);return send(500,{error:'No se pudo cargar el catálogo'});}
};
