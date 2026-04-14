# 🚀 RINASCERE WEB - PAQUETE COMPLETO CON MERCADO PAGO

## ✅ QUÉ INCLUYE:

### **Archivos HTML (Firebase 2025):**
1. `index.html` → Home con diseño ORIGINAL crema/dorado ✅
2. `admin.html` → Panel admin ✅
3. `evento.html` → Página álbum ✅
4. `subir.html` → Crear álbumes ✅
5. `login.html` → Login admin ✅
6. `buscar.html` → Búsqueda dorsal ✅
7. `exito.html` → Página éxito pago ✅

### **API Mercado Pago:**
- `api/crear-preferencia.js` → API serverless ✅
- `package.json` → Dependencias ✅
- `vercel.json` → Configuración ✅

---

## 📦 SUBIR A GITHUB:

### **PASO 1: Borrar TODO**

1. Ir a: https://github.com/vngambino77-ui/rinascere-web
2. Borrar TODOS los archivos .html actuales
3. Borrar carpeta `api/` si existe
4. Borrar `package.json` si existe

### **PASO 2: Subir archivos nuevos**

1. "Add file" → "Upload files"
2. Arrastrar TODOS los archivos del ZIP:
   - index.html
   - admin.html
   - evento.html
   - subir.html
   - login.html
   - buscar.html
   - exito.html
   - package.json
   - vercel.json

3. Crear carpeta `api/`:
   - Click "Create new file"
   - Nombre: `api/crear-preferencia.js`
   - Copiar contenido del archivo
   - Commit

4. Commit: "Deploy completo con Mercado Pago"

---

## ⚙️ CONFIGURAR VERCEL:

### **Variables de entorno:**

1. Ir a: https://vercel.com/vngambino77-ui/rinascere-web-nwt9/settings/environment-variables

2. Agregar:
   ```
   MERCADOPAGO_ACCESS_TOKEN
   APP_USR-2728717194982261-032915-732e9a841643b7a4b6636b5255120cbb-3297989181
   ```

3. Aplicar a: Production, Preview, Development

4. Save

---

## 🔄 REDEPLOY FORZADO:

1. Ir a: https://vercel.com/vngambino77-ui/rinascere-web-nwt9/deployments

2. Click último deployment

3. "..." → "Redeploy"

4. **CRÍTICO:** ❌ Desmarcar "Use existing Build Cache"

5. Redeploy

6. Esperar 3-5 min

---

## ✅ VERIFICAR:

### **HOME:**
- https://rinascere-web-nwt9.vercel.app
- ✅ Diseño crema/dorado
- ✅ 7 álbumes
- ✅ Click → abre evento

### **EVENTO:**
- Click en álbum
- ✅ Muestra info
- ✅ Botón pagar → redirige a Mercado Pago
- ✅ Después de pagar → exito.html

### **ADMIN:**
- https://rinascere-web-nwt9.vercel.app/admin.html
- Login: rinascere2024
- ✅ Tabla con álbumes
- ✅ "+ Nuevo Álbum" funciona

---

## 🔥 IMPORTANTE:

**USAR CHROME:**
- Firefox/Safari bloquean Firebase

**LIMPIAR CACHÉ:**
- Ctrl+Shift+R después del deploy

---

## 🆘 SI SIGUE SIN FUNCIONAR:

**OPCIÓN A:** Crear proyecto Vercel NUEVO
1. vercel.com/new
2. Import rinascere-web
3. Deploy limpio

**OPCIÓN B:** Verificar API
1. Probar: https://rinascere-web-nwt9.vercel.app/api/crear-preferencia
2. Debe responder (aunque con error por falta de datos)

---

**TODO LISTO PARA SUBIR** ✅
