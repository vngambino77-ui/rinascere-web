'use strict';
const {getFirebaseAdmin,send,readBody,requireAdmin}=require('../lib/firebase-admin');
const {listFolderImages}=require('../lib/drive-private');
// Importación por páginas: no activa la venta ni publica originales hasta completar el catálogo.
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return send(405,{error:'Método no permitido'});
 try{
  await requireAdmin(event);
  const body=readBody(event)||{};
  const albumId=String(body.albumId||'').trim(),folderId=String(body.driveFolderId||'').trim();
  if(!/^[A-Za-z0-9_-]{5,150}$/.test(albumId)||!/^[A-Za-z0-9_-]{10,200}$/.test(folderId))
   return send(400,{error:'Álbum o carpeta inválidos'});
  const {db,admin}=getFirebaseAdmin();
  const album=await db.collection('albumes').doc(albumId).get();
  if(!album.exists)return send(404,{error:'Álbum inexistente'});
  // El manifiesto se guarda en documentos pequeños, evitando el límite de 1 MiB de Firestore.
  const files=await listFolderImages(folderId);
  if(!files.length)return send(409,{error:'La carpeta no contiene imágenes accesibles'});
  const page=Number(body.page||0),pageSize=100,totalPages=Math.ceil(files.length/pageSize);
  if(!Number.isSafeInteger(page)||page<0||page>=totalPages)return send(400,{error:'Página inválida'});
  const configRef=db.collection('catalogosFotos').doc(albumId);
  if(page===0){
   // No permitir mezclar importaciones de carpetas diferentes.
   await configRef.set({driveFolderId:folderId,total:files.length,totalPages,estado:'importando',
    actualizadoEn:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
  }else{
   const config=await configRef.get();
   if(!config.exists||config.data().driveFolderId!==folderId||config.data().total!==files.length)
    return send(409,{error:'El inventario cambió. Reiniciá la importación desde la página cero'});
  }
  const batch=db.batch();
  files.slice(page*pageSize,(page+1)*pageSize).forEach((file,i)=>{
   const index=page*pageSize+i;
   batch.set(configRef.collection('fotos').doc(String(index).padStart(7,'0')),
    {index,driveFileId:file.id,nombre:file.name,folderId},{merge:false});
  });
  await batch.commit();
  // La activación queda bloqueada hasta contar con todas las páginas.
  return send(200,{ok:true,page,totalPages,total:files.length,importadas:Math.min((page+1)*pageSize,files.length),
   siguientePagina:page+1<totalPages?page+1:null,
   mensaje:'Inventario privado guardado por lotes; la venta permanece desactivada hasta su validación'});
 }catch(e){
  if(e.message==='UNAUTHORIZED')return send(401,{error:'Iniciá sesión'});
  if(e.message==='FORBIDDEN')return send(403,{error:'No autorizado'});
  console.error('importar-catalogo-lote:',e);
  const known={DRIVE_NOT_CONFIGURED:'Faltan credenciales de Drive en Netlify',DRIVE_AUTH_FAILED:'Falló la autenticación con Google',
   DRIVE_LIST_FAILED:'Google Drive no permitió listar la carpeta',DRIVE_TOO_MANY_FILES:'La carpeta supera el máximo de seguridad de 5000 archivos'};
  return send(502,{error:known[e.message]||'No se pudo importar este lote; consultá los registros de Netlify'});
 }
};
