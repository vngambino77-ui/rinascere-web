// admin.js - Script actualizado para el panel de administración

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    query, 
    orderBy 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCikmYa4r3LwdWDUZX9_RL9lx_EqGUF1Bg",
    authDomain: "rinascere-fotos.firebaseapp.com",
    projectId: "rinascere-fotos",
    storageBucket: "rinascere-fotos.firebasestorage.app",
    messagingSenderId: "844732353699",
    appId: "1:844732353699:web:7654d5fc2b85754a123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Cargar estadísticas y álbumes al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    await cargarEstadisticas();
    await cargarAlbumes();
});

// Función para cargar estadísticas
async function cargarEstadisticas() {
    try {
        const albumesSnapshot = await getDocs(collection(db, 'albumes'));
        
        let totalPublicos = 0;
        let totalPrivados = 0;
        let totalFotos = 0;

        for (const albumDoc of albumesSnapshot.docs) {
            const albumData = albumDoc.data();
            const fotosSnapshot = await getDocs(collection(db, 'albumes', albumDoc.id, 'fotos'));
            const numFotos = fotosSnapshot.size;
            
            totalFotos += numFotos;
            
            if (albumData.esPublico) {
                totalPublicos++;
            } else {
                totalPrivados++;
            }
        }

        // Actualizar estadísticas en la UI
        document.getElementById('totalAlbumes').textContent = albumesSnapshot.size;
        document.getElementById('totalPublicos').textContent = totalPublicos;
        document.getElementById('totalPrivados').textContent = totalPrivados;
        document.getElementById('totalFotos').textContent = totalFotos;

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Función para cargar lista de álbumes
async function cargarAlbumes() {
    try {
        const albumesRef = collection(db, 'albumes');
        const q = query(albumesRef, orderBy('fecha', 'desc'));
        const snapshot = await getDocs(q);

        const tbody = document.getElementById('albumesTableBody');
        tbody.innerHTML = '';

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No hay álbumes creados aún</td></tr>';
            return;
        }

        for (const albumDoc of snapshot.docs) {
            const album = albumDoc.data();
            const albumId = albumDoc.id;

            // Contar fotos del álbum
            const fotosSnapshot = await getDocs(collection(db, 'albumes', albumId, 'fotos'));
            const numFotos = fotosSnapshot.size;

            // Obtener URL de portada (primera foto)
            let portadaUrl = '';
            if (!fotosSnapshot.empty) {
                portadaUrl = fotosSnapshot.docs[0].data().url;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    ${portadaUrl ? `<img src="${portadaUrl}" alt="Portada" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">` : '<div style="width: 60px; height: 60px; background: #333; border-radius: 5px;"></div>'}
                </td>
                <td>${album.nombre || 'Sin nombre'}</td>
                <td>${album.fecha || 'Sin fecha'}</td>
                <td>${numFotos}</td>
                <td>
                    <span style="background: ${album.metodo === 'cafecito' ? '#7c3aed' : '#10b981'}; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.85em;">
                        ${album.metodo === 'cafecito' ? '● Cafecito' : '✓ Libre'}
                    </span>
                </td>
                <td>
                    ${album.cobro === 'cobrado' 
                        ? '<span style="color: #10b981;">✓ Cobrado</span>' 
                        : '<span style="color: #f59e0b;">⏳ Pendiente</span>'}
                </td>
                <td>
                    <button class="btn-ver" onclick="verAlbum('${albumId}')" title="Ver álbum">
                        👁️ Ver
                    </button>
                    <button class="btn-qr" onclick="generarQR('${albumId}')" title="Generar código QR">
                        📱 QR
                    </button>
                    <button class="btn-cobro" onclick="marcarCobro('${albumId}')" title="Marcar como cobrado">
                        💰 Cobro
                    </button>
                    <button class="btn-eliminar" onclick="eliminarAlbum('${albumId}')" title="Eliminar álbum">
                        🗑️
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        }

    } catch (error) {
        console.error('Error al cargar álbumes:', error);
        alert('Error al cargar los álbumes. Revisa la consola para más detalles.');
    }
}

// ✅ CORREGIDO: Redirige a ver-album.html
window.verAlbum = function(albumId) {
    window.location.href = `ver-album.html?id=${albumId}`;
};

// Función para generar código QR
window.generarQR = function(albumId) {
    const url = `${window.location.origin}/evento.html?album=${albumId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    
    const ventana = window.open('', 'QR Code', 'width=400,height=450');
    ventana.document.write(`
        <html>
        <head>
            <title>Código QR - Álbum</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                    background: #1a1a1a;
                    color: #fff;
                }
                img {
                    margin: 20px 0;
                    border: 3px solid #d4af37;
                    border-radius: 10px;
                }
                .url {
                    background: #2d2d2d;
                    padding: 10px;
                    border-radius: 5px;
                    word-break: break-all;
                    margin: 20px 0;
                }
                button {
                    background: #d4af37;
                    color: #1a1a1a;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    margin: 5px;
                }
                button:hover {
                    background: #f0c14b;
                }
            </style>
        </head>
        <body>
            <h2>Código QR del Álbum</h2>
            <img src="${qrUrl}" alt="QR Code">
            <div class="url">${url}</div>
            <button onclick="window.print()">🖨️ Imprimir</button>
            <button onclick="window.close()">✕ Cerrar</button>
        </body>
        </html>
    `);
};

// Función para marcar como cobrado
window.marcarCobro = async function(albumId) {
    if (!confirm('¿Marcar este álbum como cobrado?')) return;
    
    try {
        const { updateDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        await updateDoc(doc(db, 'albumes', albumId), {
            cobro: 'cobrado',
            fechaCobro: new Date().toISOString()
        });
        alert('✓ Álbum marcado como cobrado');
        await cargarAlbumes();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el estado de cobro');
    }
};

// Función para eliminar álbum
window.eliminarAlbum = async function(albumId) {
    if (!confirm('⚠️ ¿Estás segura de eliminar este álbum? Esta acción no se puede deshacer.')) return;
    
    try {
        const { deleteDoc, getDocs } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        
        // Primero eliminar todas las fotos del álbum
        const fotosSnapshot = await getDocs(collection(db, 'albumes', albumId, 'fotos'));
        for (const fotoDoc of fotosSnapshot.docs) {
            await deleteDoc(doc(db, 'albumes', albumId, 'fotos', fotoDoc.id));
        }
        
        // Luego eliminar el álbum
        await deleteDoc(doc(db, 'albumes', albumId));
        
        alert('✓ Álbum eliminado correctamente');
        await cargarEstadisticas();
        await cargarAlbumes();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el álbum');
    }
};

// Función para crear nuevo álbum
window.nuevoAlbum = function() {
    window.location.href = 'subir.html';
};

// Función de cerrar sesión
window.cerrarSesion = function() {
    if (confirm('¿Segura que querés cerrar sesión?')) {
        localStorage.removeItem('adminLoggedIn');
        window.location.href = 'login.html';
    }
};
