// Para "Agregar a inicio": nombre, ícono y que todo el sitio se abra sin la barra del navegador
export default function manifest() {
  return {
    name: 'Juntik',
    short_name: 'Juntik',
    description: 'Juntate a jugar: canchas, reservas y partidos en Buenos Aires.',
    lang: 'es',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F7F8F5',
    theme_color: '#F7F8F5',
    icons: [
      { src: '/icono-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icono-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
