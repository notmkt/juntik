const ESTRELLA = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

// Selector de 1 a 5 estrellas
export default function EstrellasInput({ valor, onChange, etiqueta, size = 30 }) {
  return (
    <span className="estrellas-input" role="radiogroup" aria-label={etiqueta}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={valor === n} aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`} onClick={() => onChange(n)}>
          <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d={ESTRELLA} fill={n <= (valor || 0) ? 'var(--azul)' : 'var(--borde)'} /></svg>
        </button>
      ))}
    </span>
  )
}
