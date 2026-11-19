'use strict';
const { getFirebaseAdmin, send } = require('../lib/firebase-admin');
// Solo datos autorizados para mostrarse en el catálogo público.
exports.handler = async event => {
 if(event.httpMethod!=='GET')return send(405,{error:'Método no permitido'});
 try {
  const {db}=getFirebaseAdmin();
  const snap=await db.collection('albumesPrivados').get();
  const albumes=snap.docs.filter(d=>d.data().esPublico===false).map(d=>{
   const a=d.data();
   return {id:d.id,nombre:String(a.nombre||''),portadaUrl:String(a.portadaUrl||''),
    fecha:String(a.fecha||''),lugar:String(a.lugar||''),cantidadFotos:Number(a.cantidadFotos)||0,
    categoria:String(a.categoria||a.tipoCategoria||''),ordenPublicacion:Number.isFinite(Number(a.ordenPublicacion))?Number(a.ordenPublicacion):9999,
    publico:false};
  });
  return send(200,{albumes});
 }catch(e){console.error('listar-portadas-privadas:',e);return send(500,{error:'No se pudo cargar el catálogo'});}
};
