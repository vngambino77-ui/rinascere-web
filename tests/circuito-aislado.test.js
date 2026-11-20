'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {calcularCarrito}=require('../netlify/lib/precios-rinascere');
const prices={fotos:Array.from({length:5},(_,i)=>'foto_'+i),precioUnitario:5000,packs:[{nombre:'Cinco',cantidad:5,precio:20000,tipo:'exacto'}]};
assert.equal(calcularCarrito(prices).total,20000);
assert.equal(calcularCarrito({...prices,fotos:prices.fotos.slice(0,4)}).total,20000);
assert.throws(()=>calcularCarrito({...prices,fotos:['foto_1','foto_1']}));
function loadHandler(file,mocks){
 const filename=path.resolve(__dirname,'../netlify/functions',file);
 const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(filename,'utf8'),{module,exports:module.exports,require:id=>{if(!(id in mocks))throw Error('Unmocked dependency: '+id);return mocks[id]},console,process:{env:{}},Date,Number,String,Array,Set,Promise,Error,JSON,RegExp,Buffer},{filename,timeout:1000});
 return module.exports.handler;
}
const send=(statusCode,data)=>({statusCode,body:JSON.stringify(data)});
const firebase={getFirebaseAdmin:()=>{throw Error('Firebase should not be reached for invalid requests')},send,readBody:event=>{try{return JSON.parse(event.body)}catch{return null}}};
const crypto=require('node:crypto');
(async()=>{
 const create=loadHandler('crear-carrito.js',{'node:crypto':crypto,'../lib/firebase-admin':firebase,'../lib/precios-rinascere':{calcularCarrito}});
 assert.equal((await create({httpMethod:'GET'})).statusCode,405);
 assert.equal((await create({httpMethod:'POST',body:'{'})).statusCode,400);
 assert.equal((await create({httpMethod:'POST',body:JSON.stringify({albumId:'album-prueba',comprador:'',contacto:''})})).statusCode,400);
 const download=loadHandler('descargar-foto.js',{'node:crypto':crypto,'../lib/firebase-admin':firebase,'../lib/drive-private':{downloadFile:()=>{throw Error('Never call Drive')}}});
 assert.equal((await download({httpMethod:'GET',queryStringParameters:{token:'invalid',foto:'0'}})).statusCode,400);
 assert.equal((await download({httpMethod:'GET',queryStringParameters:{token:'a'.repeat(64),foto:'-1'}})).statusCode,400);
 const confirm=loadHandler('confirmar-transferencia.js',{crypto,'../lib/firebase-admin':{...firebase,requireAdmin:async()=>{throw Error('UNAUTHORIZED')}}});
 assert.equal((await confirm({httpMethod:'POST',body:JSON.stringify({id:'pedido12345'})})).statusCode,401);
 console.log('Pruebas aisladas: precios, métodos, formulario inválido, tokens inválidos y autorización administrativa correctas');
})().catch(e=>{console.error(e);process.exitCode=1});
