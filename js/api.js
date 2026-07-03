// GEOLOCALIZACIÓN

function obtenerUbicacionActual() {
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject('Geolocalización no soportada');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                reject(error.message);
            }
        );
    });
}

async function obtenerDireccion(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data.display_name || `${lat}, ${lon}`;
}