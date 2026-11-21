'use strict';
const {getFirebaseAdmin,requireAdmin,send,readBody}=require('../lib/firebase-admin');
const estados=['pendiente_cotizacion','contactado','presupuestado','finalizado','cancelado'];
exports.handler=async event=>{
 if(!['GET','PATCH'].includes(event.httpMethod))return send(405,{error:'Método no permitido'});
 try{
  await requireAdmin(event);
  const {db,admin}=getFirebaseAdmin();
  if(event.httpMethod==='GET'){
   const snap=await db.collection('solicitudesEspeciales').orderBy('fecha','desc').limit(100).get();
   return send(200,{solicitudes:snap.docs.map(d=>({id:d.id,...d.data(),fecha:d.data().fecha?.toDate?.()?.toISOString?.()||null,actualizadoEn:d.data().actualizadoEn?.toDate?.()?.toISOString?.()||null}))});
  }
  const body=readBody(event);
  if(!body||!(/^[A-Za-z0-9]{10,150}$/.test(body.id||''))||!estados.includes(body.estado))return send(400,{error:'Solicitud o estado inválido'});
  const ref=db.collection('solicitudesEspeciales').doc(body.id),snap=await ref.get();
  if(!snap.exists)return send(404,{error:'Solicitud inexistente'});
  await ref.update({estado:body.estado,actualizadoEn:admin.firestore.FieldValue.serverTimestamp()});
  return send(200,{ok:true});
 }catch(e){
  if(['UNAUTHORIZED','FORBIDDEN'].includes(e.message))return send(403,{error:'Acceso administrativo requerido'});
  console.error('admin-solicitudes-especiales:',e);return send(500,{error:'No se pudieron consultar las solicitudes'});
 }
};
