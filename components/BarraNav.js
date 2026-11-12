import Link from 'next/link'

const ICONO = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

const PESTANAS = [
  { id: 'explorar', texto: 'Explorar', icono: <svg {...ICONO}><circle cx="12" cy="12" r="10" /><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z" /></svg> },
  { id: 'reservas', texto: 'Reservas', icono: <svg {...ICONO}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
  { id: 'comunidad', texto: 'Comunidad', icono: <svg {...ICONO}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  { id: 'torneos', texto: 'Torneos', icono: <svg {...ICONO}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg> },
  { id: 'perfil', texto: 'Perfil', icono: <svg {...ICONO}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg> },
]

// Barra inferior del app. `activa` = id de la pestaña actual; `mapa` muestra el botón flotante "Mapa".
export default function BarraNav({ activa, mapa = false }) {
  return (
    <div className="nav-pie">
      {mapa && (
        <Link href="/app/mapa" className="nav-mapa">
          Mapa
          <svg {...ICONO} width={18} height={18}><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15M15 6v15" /></svg>
        </Link>
      )}
      <nav className="nav" aria-label="Navegación principal">
        {PESTANAS.map((p) => (
          <Link key={p.id} href={`/app/${p.id}`} aria-current={p.id === activa ? 'page' : undefined}>
            {p.icono}
            {p.texto}
          </Link>
        ))}
      </nav>
    </div>
  )
}
