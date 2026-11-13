import Link from 'next/link'
import { iniciales } from '@/lib/canchas'

export function Cabecera({ titulo, sub, volver = '/app/explorar', children }) {
  return (
    <header className="cabecera">
      <Link href={volver} className="ex-redondo" aria-label="Volver">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
      </Link>
      <div style={{ flex: 1 }}>
        <h1>{titulo}</h1>
        {sub && <span className="ex-sub">{sub}</span>}
      </div>
      {children}
    </header>
  )
}

// opciones: [[id, texto], …]
export function Pestanas({ opciones, valor, onChange }) {
  return (
    <div className="res-pestanas" role="tablist">
      {opciones.map(([id, texto]) => (
        <button key={id} type="button" role="tab" aria-selected={valor === id} onClick={() => onChange(id)}>{texto}</button>
      ))}
    </div>
  )
}

export function Vacio({ titulo, children }) {
  return (
    <div className="ex-vacio">
      <b>{titulo}</b>
      {children}
    </div>
  )
}

export const Cargando = () => <div className="ex-esqueleto" style={{ height: 120 }} aria-busy="true" aria-label="Cargando" />

export function Avatar({ nombre, grande }) {
  return <span className={`avatar${grande ? ' grande' : ''}`} aria-hidden="true">{iniciales(nombre)}</span>
}

// Selección múltiple en pastillas
export function Multi({ opciones, valor, onChange, etiqueta }) {
  return (
    <div className="multi" role="group" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button key={o} type="button" className="chip" aria-pressed={valor.includes(o)} onClick={() => onChange(valor.includes(o) ? valor.filter((v) => v !== o) : [...valor, o])}>{o}</button>
      ))}
    </div>
  )
}
