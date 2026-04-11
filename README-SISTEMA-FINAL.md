# 📸 Ph. Rinascere - Sistema Final con Google Drive

## ✅ ARCHIVOS ACTUALIZADOS - LISTOS PARA SUBIR

---

## 🚀 PASO 1: REEMPLAZAR ARCHIVOS EN TU PROYECTO

Descargá estos archivos y reemplazalos en tu proyecto `rinascere-web`:

```
rinascere-web/
├── index.html              ✅ (sin cambios)
├── admin.html              ✅ (sin cambios)
├── login.html              ✅ (sin cambios)
├── buscar.html             ✅ (sin cambios)
├── ver-album.html          ✅ (sin cambios)
├── subir.html              🔄 REEMPLAZAR (NUEVO)
├── evento.html             🔄 REEMPLAZAR (NUEVO)
├── exito.html              🔄 REEMPLAZAR (NUEVO)
├── vercel.json             ✅ (sin cambios)
├── js/
│   └── admin.js            ✅ (sin cambios)
└── api/
    ├── crear-preferencia.js   🔄 REEMPLAZAR (NUEVO)
    └── verificar-pago.js      ✅ (sin cambios)
```

---

## ⚙️ PASO 2: CONFIGURAR VERCEL

### **Solo necesitás 1 variable de entorno:**

```
https://vercel.com/vngambino77-4357/rinascere-web-3cvf/settings/environment-variables

Name: MERCADOPAGO_ACCESS_TOKEN
Value: APP_USR-2728717194982261-032915-732e9a841643b7a4b6636b5255120cbb-3297989181
Environment: ☑️ Production ☑️ Preview ☑️ Development
```

**Save** → **Redeploy**

---

## 📁 PASO 3: CONFIGURAR GOOGLE DRIVE

### **Setup inicial (solo una vez):**

1. **Ir a Google Drive:** https://drive.google.com
2. **Crear carpeta principal:** "Rinascere Fotos"
3. **Dentro de esa carpeta, crear subcarpetas por evento:**
   ```
   Rinascere Fotos/
   ├── Maratón Nocturna 2024/
   │   ├── foto001.jpg
   │   ├── foto002.jpg
   │   └── ...
   ├── Carrera del Sol 2024/
   │   └── ...
   └── Sesión Estudio Cliente X/
       └── ...
   ```

---

## 🎯 PASO 4: CREAR UN ÁLBUM (WORKFLOW COMPLETO)

### **1. Subir fotos a Google Drive:**
1. Ir a tu carpeta "Rinascere Fotos"
2. Crear subcarpeta: "Maratón Nocturna 2024"
3. Subir todas las fotos del evento a esa subcarpeta
4. **Clic derecho en la subcarpeta** → **Compartir**
5. Cambiar a: **"Cualquier persona con el enlace"**
6. Permisos: **"Puede ver"**
7. **Copiar el enlace** (ejemplo: `https://drive.google.com/drive/folders/1ABC123xyz...`)

### **2. Crear álbum en tu web:**
1. Login: https://rinascere-web-3cvf.vercel.app/login.html
   - Contraseña: `rinascere2024`
2. Ir al panel de Admin
3. Clic en **"+ Nuevo Álbum"**
4. **Completar datos:**
   - Nombre: "Maratón Nocturna 2024"
   - Fecha: Hoy
   - **Enlace de Google Drive:** (pegar el que copiaste)
   - **Método de Venta:** Elegir uno de los 3:

---

## 💰 LOS 3 MÉTODOS DE PAGO

### **Opción 1: 🎁 Gratis**
- Cliente descarga directo desde Google Drive
- Sin pago, sin trámites
- Ideal para: eventos comunitarios, pruebas

### **Opción 2: ☕ Cafecito (Cliente elige precio)**
- Vos sugerís un precio (ej: $3.000)
- Cliente puede pagar MÁS o MENOS
- Mercado Pago procesa el pago
- Ideal para: eventos casuales, colaboraciones

### **Opción 3: 💰 Precio Fijo**
- Vos ponés el precio (ej: $5.000)
- Cliente DEBE pagar ese precio exacto
- Mercado Pago procesa el pago
- Ideal para: sesiones profesionales, eventos premium

---

## 🧪 PASO 5: PROBAR TODO EL FLUJO

### **Prueba 1: Álbum Gratis**
1. Crear álbum con método "Gratis"
2. Ir a la web → Ver álbum
3. Verificar botón "Abrir Google Drive"
4. Verificar que NO aparece opción de pago

### **Prueba 2: Álbum Cafecito**
1. Crear álbum con método "Cafecito" (precio sugerido: $3.000)
2. Ir a la web → Ver álbum
3. Cambiar precio a $1.500
4. Clic en "Contribuir"
5. Verificar redirect a Mercado Pago
6. Pagar → Verificar redirect a exito.html
7. Verificar botón a Google Drive

### **Prueba 3: Álbum Precio Fijo**
1. Crear álbum con método "Precio Fijo" ($5.000)
2. Ir a la web → Ver álbum
3. Verificar que precio NO se puede cambiar
4. Clic en "Pagar y Descargar"
5. Verificar redirect a Mercado Pago
6. Pagar → Verificar redirect a exito.html

---

## 📊 VENTAJAS DE ESTE SISTEMA

✅ **Sin límites de almacenamiento** (usás tu Google Drive)  
✅ **Sin APIs complicadas** (solo Mercado Pago)  
✅ **3 modelos de negocio** en uno  
✅ **Súper rápido** para vos (subir fotos → compartir link → listo)  
✅ **Fácil para clientes** (ven fotos en Google Drive)  

---

## 🔧 SUBIR CAMBIOS A GITHUB

### **Con GitHub Desktop:**
1. Abrir GitHub Desktop
2. Ver cambios (3 archivos modificados)
3. Commit: "Sistema final Google Drive + 3 métodos de pago"
4. Push
5. Vercel despliega automáticamente

---

## ✅ CHECKLIST FINAL

- [ ] Descargar 3 archivos actualizados (subir.html, evento.html, exito.html)
- [ ] Descargar crear-preferencia.js
- [ ] Reemplazar en proyecto local
- [ ] Subir a GitHub (commit + push)
- [ ] Configurar variable MERCADOPAGO_ACCESS_TOKEN en Vercel
- [ ] Redeploy en Vercel
- [ ] Crear carpeta "Rinascere Fotos" en Google Drive
- [ ] Probar los 3 flujos (gratis, cafecito, precio fijo)

---

## 🆘 SOPORTE

**Si algo no funciona:**
1. Verificar variable `MERCADOPAGO_ACCESS_TOKEN` en Vercel
2. Verificar que hiciste redeploy
3. Verificar que el enlace de Google Drive sea público ("Cualquier persona con el enlace")

---

**¡Todo listo para funcionar!** 🚀
