'use strict';

// Rinascere: motor de precios compartido. No valida pagos ni habilita descargas.
// El servidor debe recalcular el total con el catálogo almacenado en Firebase.
function pesos(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) throw new TypeError('Precio inválido en pesos');
  return n;
}
function calcularCarrito({ fotos, precioUnitario, packs = [], cupon = null, modalidad = 'automatico' }) {
  if (!Array.isArray(fotos) || fotos.length === 0 || fotos.length > 500) throw new TypeError('Seleccioná entre 1 y 500 fotos');
  const ids = fotos.map(id => String(id));
  if (ids.some(id => !/^[a-zA-Z0-9_.-]{1,160}$/.test(id)) || new Set(ids).size !== ids.length) throw new TypeError('Identificadores de fotos inválidos o repetidos');
  const unitario = pesos(precioUnitario);
  if (unitario === 0) throw new TypeError('El precio unitario debe ser positivo');
  const n = ids.length;
  const modo = modalidad;
  if (!['exacto','hasta','automatico'].includes(modo)) throw new TypeError('Modalidad inválida');
  // Las promociones son opcionales y solo se habilitan a partir de 5 fotos seleccionadas.
  const activos = (n >= 5 ? packs : []).filter(p => p.activo !== false).map(p => {
    const cantidad = Number(p.cantidad), precio = pesos(p.precio);
    if (!Number.isSafeInteger(cantidad) || cantidad < 5 || cantidad > 500 || precio <= 0)
      throw new TypeError('Pack inválido');
    const tipo = p.tipo || 'exacto';
    if (!['exacto','hasta'].includes(tipo)) throw new TypeError('Tipo de pack inválido');
    return { cantidad, precio, tipo, nombre: String(p.nombre || 'Pack').slice(0,80) };
  });
  const dp = Array.from({ length:n+1 }, () => ({total:Infinity, desglose:[]}));
  dp[0]={total:0,desglose:[]};
  for (let i=1;i<=n;i++) {
    const individual=dp[i-1];
    dp[i]={total:individual.total+unitario,desglose:[...individual.desglose,{nombre:'Foto individual',cantidad:1,precio:unitario}]};
    for(const p of activos) {
      const tamaños = modo === 'exacto' ? (i === n && n === p.cantidad ? [p.cantidad] : [])
        : modo === 'hasta' ? (i === n && n <= p.cantidad ? [n] : [])
        : p.tipo === 'hasta' ? Array.from({length:Math.min(i,p.cantidad)},(_,k)=>k+1) : [p.cantidad];
      for(const cantidad of tamaños) {
        if(i<cantidad || i<5) continue;
        const prev=dp[i-cantidad],total=prev.total+p.precio;
        if(total<dp[i].total) dp[i]={total,desglose:[...prev.desglose,{nombre:p.nombre,cantidad,precio:p.precio}]};
      }
    }
  }
  const subtotal = dp[n].total;
  let descuento = 0;
  if (cupon) {
    const tipo = String(cupon.tipo || '');
    const valor = Number(cupon.valor);
    if (!Number.isFinite(valor) || valor < 0) throw new TypeError('Cupón inválido');
    if (tipo === 'porcentaje' && valor <= 100) descuento = Math.floor(subtotal * valor / 100);
    else if (tipo === 'importe') descuento = Math.min(subtotal, pesos(valor));
    else throw new TypeError('Cupón inválido');
  }
  return { fotos: ids, cantidad: n, subtotal, descuento, total: subtotal - descuento, desglose: dp[n].desglose, moneda: 'ARS' };
}
module.exports = { calcularCarrito };
