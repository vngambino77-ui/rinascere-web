'use strict';
const crypto=require('node:crypto');
const credential=()=>{const raw=process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON||process.env.FIREBASE_SERVICE_ACCOUNT_JSON;if(!raw)throw Error('DRIVE_NOT_CONFIGURED');const c=JSON.parse(raw);if(!c.client_email||!c.private_key)throw Error('DRIVE_NOT_CONFIGURED');return c;};
const base64url=o=>Buffer.from(typeof o==='string'?o:JSON.stringify(o)).toString('base64url');
async function accessToken(){
 const c=credential(),now=Math.floor(Date.now()/1000);
 const head=base64url({alg:'RS256',typ:'JWT'}),body=base64url({iss:c.client_email,scope:'https://www.googleapis.com/auth/drive.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3500});
 const signature=crypto.sign('RSA-SHA256',Buffer.from(head+'.'+body),c.private_key).toString('base64url');
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:head+'.'+body+'.'+signature})});
 if(!response.ok)throw Error('DRIVE_AUTH_FAILED');return (await response.json()).access_token;
}
async function fileMetadata(id,token){const r=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?fields=id,name,mimeType,size,parents,trashed&supportsAllDrives=true',{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error('DRIVE_FILE_UNAVAILABLE');return r.json();}
async function streamFile(id,folderId){
 if(!/^[\w-]{10,200}$/.test(id)||!/^[\w-]{10,200}$/.test(folderId))throw Error('DRIVE_INVALID_ID');
 const token=await accessToken(),meta=await fileMetadata(id,token);
 if(meta.trashed||!Array.isArray(meta.parents)||!meta.parents.includes(folderId)||meta.mimeType?.startsWith('application/vnd.google-apps.'))throw Error('DRIVE_FILE_UNAVAILABLE');
 const size=Number(meta.size);
 // Netlify streamed functions are limited to 20 MB. Leave a margin for provider overhead.
 if(!Number.isSafeInteger(size)||size<1||size>19000000)throw Error('DRIVE_FILE_TOO_LARGE');
 const response=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media&supportsAllDrives=true',{headers:{Authorization:'Bearer '+token}});
 if(!response.ok||!response.body)throw Error('DRIVE_FILE_UNAVAILABLE');
 const filename=String(meta.name||'fotografia.jpg').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120);
 return {body:response.body,name:filename,mime:meta.mimeType||'application/octet-stream',size};
}
async function downloadFile(id,folderId){
 if(!/^[\w-]{10,200}$/.test(id)||!/^[\w-]{10,200}$/.test(folderId))throw Error('DRIVE_INVALID_ID');
 const token=await accessToken(),meta=await fileMetadata(id,token);
 if(meta.trashed||!Array.isArray(meta.parents)||!meta.parents.includes(folderId)||meta.mimeType?.startsWith('application/vnd.google-apps.'))throw Error('DRIVE_FILE_UNAVAILABLE');
 const size=Number(meta.size);
 if(!Number.isSafeInteger(size)||size<1||size>4500000)throw Error('DRIVE_FILE_TOO_LARGE');
 const r=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media&supportsAllDrives=true',{headers:{Authorization:'Bearer '+token}});
 if(!r.ok)throw Error('DRIVE_FILE_UNAVAILABLE');
 const bytes=Buffer.from(await r.arrayBuffer());
 if(bytes.length!==size)throw Error('DRIVE_FILE_UNAVAILABLE');
 return {bytes,name:String(meta.name||'fotografia.jpg').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120),mime:meta.mimeType||'application/octet-stream'};
}
async function listFolderImages(folderId){
 if(!/^[\\w-]{10,200}$/.test(folderId))throw Error('DRIVE_INVALID_ID');
 const token=await accessToken(),files=[];let pageToken;
 do{
  const params=new URLSearchParams({q:"'"+folderId+"' in parents and trashed = false and mimeType contains 'image/'",fields:'nextPageToken,files(id,name,mimeType,size,parents)',pageSize:'1000',orderBy:'name',supportsAllDrives:'true',includeItemsFromAllDrives:'true'});
  if(pageToken)params.set('pageToken',pageToken);
  const r=await fetch('https://www.googleapis.com/drive/v3/files?'+params,{headers:{Authorization:'Bearer '+token}});
  if(!r.ok)throw Error('DRIVE_LIST_FAILED');
  const data=await r.json();files.push(...(data.files||[]).filter(f=>/^[\\w-]{10,200}$/.test(f.id)&&f.mimeType?.startsWith('image/')));
  pageToken=data.nextPageToken;
  if(files.length>5000)throw Error('DRIVE_TOO_MANY_FILES');
 }while(pageToken);
 return files.sort((a,b)=>a.name.localeCompare(b.name,'es',{numeric:true}));
}
module.exports={downloadFile,streamFile,listFolderImages};
