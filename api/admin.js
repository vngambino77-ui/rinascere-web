import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase NUEVO
const firebaseConfig = {
    apiKey: "AIzaSyC-8dbhyKVKDlEndWJ3UfEEu3EiAnZI-XU",
    authDomain: "rinascere-web-2025.firebaseapp.com",
    projectId: "rinascere-web-2025",
    storageBucket: "rinascere-web-2025.firebasestorage.app",
    messagingSenderId: "781300280640",
    appId: "1:781300280640:web:34c98efa7780a8218cdea5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Cargar cuando la página esté lista
document.addEventListener('DOMContentLoaded', async () => {
    await cargarEstadisticas();
    await cargarAlbumes();
});

// Estadísticas
async function cargarEstadisticas() {
    try {
        const snapshot = await getDocs(collection(db, 'albumes'));
        
        let publicos = 0;
        let privados = 0;

        snapshot.forEach(doc => {
            if (doc.data().esPublico) publicos++;
            else privados++;
        });

        document.getElementById('totalAlbumes').textContent = snapshot.size;
        document.getElementById('totalPublicos').textContent = publicos;
        document.getElementById('totalPrivados').textContent = privados;
        document.getElementById('totalFotos').textContent = 0;

    } catch (error) {
        console.error('Error estadísticas:', error);
    }
}

// Cargar álbumes
async function cargarAlbumes() {
    const tbody = document.getElementById('albumesTableBody');
    
    try {
        const q = query(collection(db, 'albumes'), orderBy('fecha', 'desc'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #999;">No hay álbumes creados</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        snapshot.forEach(doc => {
            const album = doc.data();
            const id = doc.id;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    ${album.portadaUrl ? `<img src="${album.portadaUrl}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">` : '<div style="width: 60px; height: 60px; background: #333; border-radius: 5px;"></div>'}
                </td>
                <td>${album.nombre || 'Sin nombre'}</td>
                <td>${album.fecha || '-'}</td>
                <td>0</td>
                <td>
                    <span style="background: ${album.metodo === 'gratis' ? '#10b981' : album.metodo === 'cafecito' ? '#f59e0b' : '#7c3aed'}; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.85em;">
                        ${album.metodo === 'gratis' ? '🎁 Gratis' : album.metodo === 'cafecito' ? '☕ Cafecito' : '💰 $' + (album.precio || 0)}
                    </span>
                </td>
                <td>
                    <span style="color: #f59e0b;">⏳ Pendiente</span>
                </td>
                <td>
                    <button onclick="verAlbum('${id}')" style="background: #d4af37; color: #1a1a1a; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; margin: 2px;">
                        👁️ Ver
                    </button>
                    <button onclick="eliminarAlbum('${id}')" style="background: #dc2626; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; margin: 2px;">
                        🗑️
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error cargar álbumes:', error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #dc2626;">Error: ${error.message}</td></tr>`;
    }
}

// Funciones globales
window.verAlbum = function(id) {
    window.location.href = `evento.html?album=${id}`;
};

window.eliminarAlbum = async function(id) {
    if (!confirm('¿Eliminar este álbum?')) return;
    
    try {
        await deleteDoc(doc(db, 'albumes', id));
        alert('Álbum eliminado');
        location.reload();
    } catch (error) {
        alert('Error al eliminar: ' + error.message);
    }
};
