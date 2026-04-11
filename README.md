# 📸 Ph. Rinascere - Sistema Final Completo

## ✅ TODOS LOS ARCHIVOS LISTOS PARA USAR

---

## 🚀 PASO 1: REEMPLAZAR ARCHIVOS

Copiá todos estos archivos a tu proyecto `rinascere-web`:

```
rinascere-web/
├── .gitignore
├── admin.html
├── buscar.html
├── evento.html
├── exito.html
├── index.html
├── login.html
├── subir.html
├── ver-album.html
├── vercel.json
├── api/
│   ├── crear-preferencia.js
│   └── verificar-pago.js
└── js/
    └── admin.js
```

**REEMPLAZÁ TODO** - Borrá lo viejo y usá estos archivos.

---

## ⚙️ PASO 2: CONFIGURAR VERCEL

### **Variable de entorno:**

```
https://vercel.com/vngambino77-ui/rinascere-web/settings/environment-variables

Name: MERCADOPAGO_ACCESS_TOKEN
Value: APP_USR-2728717194982261-032915-732e9a841643b7a4b6636b5255120cbb-3297989181
Environments: ☑️ Production ☑️ Preview ☑️ Development
```

---

## 📁 PASO 3: CONFIGURAR CLOUDINARY

### **Upload Preset (si no existe):**

1. **Ir a:** https://console.cloudinary.com/console/c-ed6d9181397af455eaee4496d2a0e8/settings/upload

2. **Scroll abajo → "Upload presets"**

3. **Clic en "Add upload preset"**

4. **Configurar:**
   - **Preset name:** `rinascere_fotos`
   - **Signing Mode:** `Unsigned`
   - **Folder:** `rinascere`
   - **Access Mode:** `Public`

5. **Save**

---

## 🔄 PASO 4: SUBIR A GITHUB

### **Con GitHub Desktop:**

1. **Abrir GitHub Desktop**
2. **Ver cambios** (todos los archivos)
3. **Commit:** "Sistema final completo - Cloudinary + Google Drive"
4. **Push**
5. **Esperar 1-2 minutos** (Vercel redespliega automático)

---

## 🎯 CÓMO FUNCIONA

### **CREAR ÁLBUM:**

1. **Login:** https://vngambino77-ui-rinascere-web.vercel.app/login.html
   - Contraseña: `rinascere2024`

2. **Admin → "+ Nuevo Álbum"**

3. **Subir foto de portada:**
   - Click en "📸 Foto de Portada"
   - Seleccionar 1 foto (se sube a Cloudinary)
   - Aparecerá como miniatura en la web

4. **Google Drive:**
   - Ir a: https://drive.google.com/drive/folders/1QSCBjnfJhJjrFxFKTYEhV9p0aMDDbmyL
   - Crear subcarpeta: "Maratón 2024"
   - Subir TODAS las fotos del evento
   - Clic derecho → Compartir → "Cualquier persona con el enlace"
   - Copiar enlace

5. **Completar formulario:**
   - Nombre: "Maratón Nocturna 2024"
   - Fecha: Hoy
   - Enlace Google Drive: (pegar)
   - Método de venta:
     - 🎁 **Gratis** → Descarga directa
     - ☕ **Cafecito** → Cliente elige precio (mínimo $100)
     - 💰 **Precio Fijo** → Vos ponés precio exacto

6. **Crear Álbum**

---

### **LO QUE VE EL CLIENTE:**

**1. Página principal (index.html):**
- Galería con miniaturas de Cloudinary
- Carga rápida

**2. Click en álbum (evento.html):**
- Botón "📁 Abrir Google Drive"
- Opción de pago según método elegido

**3. Pago (si aplica):**
- Mercado Pago → Pagar
- Redirect a exito.html
- Botón para ir a Google Drive

---

## 📊 ESTRUCTURA DEL SISTEMA

```
PORTADAS → Cloudinary (1 foto por álbum, carga rápida)
ÁLBUMES → Google Drive (todas las fotos, sin límites)
PAGOS → Mercado Pago (3 métodos)
```

---

## ✅ CHECKLIST

- [ ] Reemplazar todos los archivos
- [ ] Configurar variable MERCADOPAGO_ACCESS_TOKEN en Vercel
- [ ] Verificar upload preset en Cloudinary
- [ ] Subir a GitHub (commit + push)
- [ ] Esperar redeploy (1-2 min)
- [ ] Probar login
- [ ] Crear álbum de prueba
- [ ] Verificar que funcione todo

---

## 🆘 SOPORTE

**Si algo falla:**

1. Verificar consola del navegador (F12)
2. Verificar que la variable de Vercel esté configurada
3. Verificar que el upload preset de Cloudinary exista
4. Verificar que los enlaces de Google Drive sean públicos

---

**¡SISTEMA LISTO PARA USAR!** 🚀
