// Función para abrir la base de datos IndexedDB
function abrirDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MyPlacesDB', 1);

        request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('categorias')) {
            db.createObjectStore('categorias', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('lugares')) {
            db.createObjectStore('lugares', { keyPath: 'id', autoIncrement: true });
        }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}


// LUGARES Y CATEGORÍAS - FUNCIONES PARA MANEJAR LA BASE DE DATOS IndexedDB

// Función para agregar un lugar
async function guardarLugarDB(lugar) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('lugares', 'readwrite');
        const store = tx.objectStore('lugares');
        const request = store.add(lugar);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Función para obtener todos los lugares (leer)
async function obtenerLugaresDB() {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('lugares', 'readonly');
        const store = tx.objectStore('lugares');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Función para modificar un lugar
async function actualizarLugarDB(lugar) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('lugares', 'readwrite');
        const store = tx.objectStore('lugares');
        const request = store.put(lugar);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Función para eliminar un lugar
async function eliminarLugarDB(id) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('lugares', 'readwrite');
        const store = tx.objectStore('lugares');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Función para agregar una categoría
async function guardarCategoriaDB(categoria) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('categorias', 'readwrite');
        const store = tx.objectStore('categorias');
        const request = store.add(categoria);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Función para obtener todas las categorías (leer)
async function obtenerCategoriasDB() {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('categorias', 'readonly');
        const store = tx.objectStore('categorias');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}