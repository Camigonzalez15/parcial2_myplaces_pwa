Vue.createApp({
    data() {
        return {
            nombreUsuario: '',
            categorias: [],
            lugares: [],
            offline: false,
            mostrarModalOffline: false,
            mostrarModalOnline: false,
            pantallaActual: 'home',
            formulario: {
                nombre: '',
                categoria: '',
                colorCategoria: '#D0D0D0',
                descripcion: '',
                estado: '',
                ubicacion: {
                    texto: '',
                    lat: null,
                    lon: null,
                },
            },
            iconosCategorias: {
                'cafeterías': 'assets/iconos-c/cafeterias.svg',
                'restaurantes': 'assets/iconos-c/restaurantes.svg',
                'librerías': 'assets/iconos-c/librerias.svg',
                'parques': 'assets/iconos-c/parques.svg',
                'gimnasios': 'assets/iconos-c/gym.svg',
                'tiendas': 'assets/iconos-c/tiendas.svg',
            },
            detallesLugar: null,
            categoriaSeleccionada: null,
            busquedaLugar: '',
        };
    },

    async mounted() {
        // nombre de usuario
        const nombre = localStorage.getItem('nombreUsuario');
        if (nombre) {
            this.nombreUsuario = nombre;
        } else {
            this.pantallaActual = 'bienvenida';
        }

        // cargar categorías desde IndexedDB
        this.categorias = await obtenerCategoriasDB();

        // si no hay categorías, cargar las predefinidas
        if (this.categorias.length === 0) {
            const predefinidas = [
                { nombre: 'Cafeterías', color: '#B7B09D', icono: 'assets/iconos-c/cafeterias.svg' },
                { nombre: 'Restaurantes', color: '#C2C7A3', icono: 'assets/iconos-c/restaurantes.svg' },
                { nombre: 'Gimnasios', color: '#D0D0D0', icono: 'assets/iconos-c/gym.svg' },
                { nombre: 'Parques', color: '#A5C99D', icono: 'assets/iconos-c/parques.svg' },
                { nombre: 'Librerías', color: '#B1D0DC', icono: 'assets/iconos-c/librerias.svg' },
                { nombre: 'Tiendas', color: '#DFC4D9', icono: 'assets/iconos-c/tiendas.svg' },
            ];

            for (const cat of predefinidas) {
                const id = await guardarCategoriaDB(cat);
                cat.id = id;
            }

            this.categorias = await obtenerCategoriasDB();
        }

        // cargar lugares desde IndexedDB
        this.lugares = await obtenerLugaresDB();

        // verificar si hay conexión a internet
        window.addEventListener('offline', () => {
            this.offline = true;
            this.mostrarModalOffline = true;
        });

        window.addEventListener('online', () => {
            this.offline = false;
            this.mostrarModalOffline = false;
            this.mostrarModalOnline = true;
            setTimeout(() => {
                this.mostrarModalOnline = false;
            }, 5000);
        });

        // verificar el estado inicial de la conexión
        this.offline = !navigator.onLine;
    },

    computed: {
        lugaresFiltrados() {
            if (!this.categoriaSeleccionada) return this.lugares;
            return this.lugares.filter(
                l => l.categoria === this.categoriaSeleccionada.nombre
            );
        },
        lugaresBuscados() {
            const texto = this.busquedaLugar.trim().toLowerCase();
            if (!texto) return this.lugaresFiltrados;
            return this.lugaresFiltrados.filter(l =>
                l.nombre.toLowerCase().includes(texto) ||
                (l.descripcion && l.descripcion.toLowerCase().includes(texto))
            );
        },
    },

    // MAPA CON LEAFLET
    watch: {
        pantallaActual(nueva) {
            if (nueva === 'mapa') {
                this.$nextTick(() => {
                    const mapa = L.map('mapa').setView([-34.6037, -58.3816], 12);
                    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap'
                    }).addTo(mapa);

                    // pin por cada lugar con coordenadas
                    this.lugares.forEach(lugar => {
                        if (lugar.ubicacion && lugar.ubicacion.lat) {
                            L.marker([lugar.ubicacion.lat, lugar.ubicacion.lon])
                                .addTo(mapa)
                                .bindPopup(lugar.nombre);
                        }
                    });
                });
            }
        }
    },

    methods: {
        // NOMBRE DEL USUARIO
        guardarNombre() {
            localStorage.setItem('nombreUsuario', this.nombreUsuario);
            this.irA('home');
        },

        // FUNCIONES DE LA APP

        irA(pantalla) {
            this.pantallaActual = pantalla;
        },
        
        async guardarLugar() {
            //verificar si la categoría ya existe
            let categoria = this.categorias.find(
                c => c.nombre.toLowerCase() === this.formulario.categoria.toLowerCase()
            );
            //si no existe, crearla
            if (!categoria) {
                const nuevaCategoria = {
                    nombre: this.formulario.categoria,
                    color: this.formulario.colorCategoria,
                    icono: this.iconosCategorias[this.formulario.categoria.toLowerCase()] || 'assets/iconos-otros/ubi-negro.svg'
                };
                const id = await guardarCategoriaDB(nuevaCategoria);
                nuevaCategoria.id = id;
                this.categorias.push(nuevaCategoria);
                categoria = nuevaCategoria;
            }
            // armar el objeto del lugar
            const lugar = {
                nombre: this.formulario.nombre,
                descripcion: this.formulario.descripcion,
                categoria: categoria.nombre,
                estado: this.formulario.estado,
                ubicacion: {
                    texto: this.formulario.ubicacion.texto,
                    lat: this.formulario.ubicacion.lat,
                    lon: this.formulario.ubicacion.lon,
                },
                fecha: new Date().toLocaleString()
            };
            // guardar o actualizar el lugar en IndexedDB
            if (this.formulario.id) {
                lugar.id = this.formulario.id;
                await actualizarLugarDB(lugar);
            } else {
                await guardarLugarDB(lugar);
            }
            // actualizar la lista de lugares y volver al inicio
            this.lugares = await obtenerLugaresDB();
            this.formulario = {
                nombre: '',
                categoria: '',
                colorCategoria: this.formulario.colorCategoria,
                descripcion: '',
                estado: '',
                ubicacion: {
                    texto: '',
                    lat: null,
                    lon: null,
                },   
            };
            this.irA('home');
        },

        obtenerColorCategoria(nombre) {
            const cat = this.categorias.find(
                c => c.nombre.toLowerCase() === nombre.toLowerCase()
            );
            return cat ? cat.color : '#D0D0D0';
        },

        obtenerIconoCategoria(nombre) {
            const cat = this.categorias.find(
                c => c.nombre.toLowerCase() === nombre.toLowerCase()
            );
            return cat ? cat.icono : 'assets/iconos-otros/ubi-negro.svg';
        },

        editarLugar(lugar) {
            this.formulario = {
                id: lugar.id,
                nombre: lugar.nombre,
                categoria: lugar.categoria,
                colorCategoria: this.obtenerColorCategoria(lugar.categoria),
                descripcion: lugar.descripcion,
                estado: lugar.estado,
                ubicacion: lugar.ubicacion
            };
            this.irA('formulario');
        },

        async eliminarLugar(id) {
            const confirmacion = confirm('¿Seguro que quieres eliminar este lugar?');
            if (!confirmacion) return;
            
            await eliminarLugarDB(id);
            this.lugares = await obtenerLugaresDB();
            this.irA('home');
        },

        seleccionarCategoria(categoria) {
            this.categoriaSeleccionada = categoria;
            this.busquedaLugar = '';
            this.irA('lugares');
        },

        verDetalle(lugar) {
            this.detallesLugar = lugar;
            this.irA('detalle');
        },

        async capturarUbicacion() {
            try {
                const coords = await obtenerUbicacionActual();
                this.formulario.ubicacion.lat = coords.lat;
                this.formulario.ubicacion.lon = coords.lon;
                const direccion = await obtenerDireccion(coords.lat, coords.lon);
                this.formulario.ubicacion.texto = direccion, `${coords.lon}`;
            } catch (error) {
                alert('No se pudo obtener la ubicación: ' + error);
            }
        },
    }

}).mount('#app');



if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker registrado'))
        .catch((error) => console.error('Error al registrar el Service Worker', error));
}