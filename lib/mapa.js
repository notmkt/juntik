// Mapa base compartido (CARTO Voyager sobre OpenStreetMap).
// La clave se configura en Vercel como NEXT_PUBLIC_CARTO_KEY (no va en el repo).
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY

export function capaBase(L) {
  return L.tileLayer(
    `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${CARTO_KEY ? `?key=${CARTO_KEY}` : ''}`,
    {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }
  )
}

export const comoLlegar = (c) => `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`
