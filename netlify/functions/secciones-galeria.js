'use strict';
const {getFirebaseAdmin,send,readBody,requireAdmin}=require('../lib/firebase-admin');
const valid=s=>typeof s==='string'&&s.length>=2&&s.length<=45;
exports.handler=async event=>{
 try{
  const {db}=getFirebaseAdmin(),ref=db.collection('configuracion').doc('seccionesGaleria');
  if(event.httpMethod==='GET'){
   const snap=await ref.get();return send(200,{secciones:snap.exists?(snap.data().secciones||[]):[]});
  }
  if(event.httpMethod!=='POST')return send(405,{error:'Método no permitido'});
  await requireAdmin(event);
  const body=readBody(event)||{},nombre=String(body.nombre||'').trim();
  if(!valid(nombre))return send(400,{error:'Nombre de sección inválido'});
  const slug=nombre.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(!slug||slug.length>50)return send(400,{error:'Nombre inválido'});
  const reservadas=['espectaculos','eventos','deportes','retratos'];
  if(reservadas.includes(slug))return send(409,{error:'Ya existe esa sección'});
  await db.runTransaction(async t=>{
   const doc=await t.get(ref),actual=doc.exists?(doc.data().secciones||[]):[];
   if(actual.some(s=>s.slug===slug))throw new Error('DUPLICATE');
   t.set(ref,{secciones:[...actual,{slug,nombre}]},{merge:true});
  });
  return send(200,{ok:true,slug,nombre});
 }catch(e){if(e.message==='UNAUTHORIZED')return send(401,{error:'Iniciá sesión'});if(e.message==='FORBIDDEN')return send(403,{error:'Sin permiso'});if(e.message==='DUPLICATE')return send(409,{error:'Ya existe esa sección'});console.error(e);return send(500,{error:'No se pudo guardar'});}
};