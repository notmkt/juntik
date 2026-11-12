import Link from 'next/link'
import Logo from '@/components/Logo'

export default function EnDesarrollo({ volverA = '/', textoVolver = 'Ir al inicio' }) {
  return (
    <main className="dev">
      <Link href="/" className="dev-logo"><Logo height={36} /></Link>
      <div className="dev-icono" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20h20" />
          <path d="M5 20V9l7-5 7 5v11" />
          <path d="M9 20v-6h6v6" />
        </svg>
      </div>
      <h1>Página en desarrollo</h1>
      <p>
        Juntik es un proyecto académico de la Universidad de Palermo. Estamos construyendo esta sección.
      </p>
      <p>
        Para más información escribinos a{' '}
        <a href="mailto:somos@juntik.com">somos@juntik.com</a>.
      </p>
      <div className="dev-acciones">
        <Link href={volverA} className="boton boton-verde">{textoVolver}</Link>
        <a href="mailto:somos@juntik.com" className="boton boton-borde">Escribinos</a>
      </div>
      <span className="dev-pie">Universidad de Palermo · 2026</span>
    </main>
  )
}
