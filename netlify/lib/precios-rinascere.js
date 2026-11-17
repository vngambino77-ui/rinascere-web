'use strict';

// Rinascere: motor de precios compartido. No valida pagos ni habilita descargas.
// El servidor debe recalcular el total con el catálogo almacenado en Firebase.
function pesos(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) throw new TypeError('Precio inválido en pesos');
  return n;
}
function calcularCarrito({ fotos, precioUnitario, packs = [], cupon = null }) {
  if (!Array.isArray(fotos) || fotos.length === 0 || fotos.length > 500) throw new TypeError('Seleccioná entre 1 y 500 fotos');
  const ids = fotos.map(id => String(id));
  if (ids.some(id => !/^[a-zA-Z0-9_.-]{1,160}$/.test(id)) || new Set(ids).size !== ids.length) throw new TypeError('Identificadores de fotos inválidos o repetidos');
  const unitario = pesos(precioUnitario);
  if (unitario === 0) throw new TypeError('El precio unitario debe ser positivo');
  const n = ids.length;
  // Optimización por programación dinámica: permite combinar packs y fotos individuales.
  const dp = Array.from({ length: n + 1 }, () => ({ total: Infinity, desglose: [] }));
  dp[0] = { total: 0, desglose: [] };
  const opciones = [{ cantidad: 1, precio: unitario, nombre: 'Foto individual' }];
  for (const pack of packs) {
    const cantidad = Number(pack.cantidad);
    if (!Number.isSafeInteger(cantidad) || cantidad < 2 || cantidad > 500) throw new TypeError('Cantidad de pack inválida');
    const precio = pesos(pack.precio);
    if (precio === 0) throw new TypeError('Precio de pack inválido');
    opciones.push({ cantidad, precio, nombre: String(pack.nombre || 'Pack').slice(0, 80) });
  }
  for (let i = 1; i <= n; i++) {
    for (const opcion of opciones) {
      if (i < opcion.cantidad) continue;
      const prev = dp[i - opcion.cantidad];
      const total = prev.total + opcion.precio;
      if (total < dp[i].total) dp[i] = { total, desglose: [...prev.desglose, { nombre: opcion.nombre, cantidad: opcion.cantidad, precio: opcion.precio }] };
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
