import { DEPORTES } from '@/lib/canchas'

// Filtro de deportes en pastillas con relieve (la elegida queda "hundida")
export default function Chips({ deporte, onChange, className = '' }) {
  return (
    <div className={`chips ${className}`} role="group" aria-label="Filtrar por deporte">
      {DEPORTES.map((d) => (
        <button key={d} type="button" className="chip" aria-pressed={d === deporte} onClick={() => onChange(d)}>
          {d}
        </button>
      ))}
    </div>
  )
}
