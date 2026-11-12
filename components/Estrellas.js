const ESTRELLA = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

// Calificación en estrellas (0 a 5, con medias). Sin reseñas: estrellas vacías + "Sin reseñas".
export default function Estrellas({ nota, total = 0, size = 15, soloEstrellas = false }) {
  const valor = Number(nota) || 0
  const texto = valor.toFixed(1).replace('.', ',')
  return (
    <span className="estrellas" role="img" aria-label={total ? `${texto} de 5 estrellas, ${total} ${total === 1 ? 'reseña' : 'reseñas'}` : 'Sin reseñas todavía'}>
      <span className="estrellas-fila" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => {
          const lleno = Math.max(0, Math.min(1, valor - i))
          return (
            <svg key={i} width={size} height={size} viewBox="0 0 24 24">
              <path d={ESTRELLA} fill="var(--borde)" />
              {lleno > 0 && <path d={ESTRELLA} fill="var(--azul)" style={{ clipPath: `inset(0 ${(1 - Math.round(lleno * 2) / 2) * 100}% 0 0)` }} />}
            </svg>
          )
        })}
      </span>
      {!soloEstrellas && <span aria-hidden="true">{total ? <><b>{texto}</b> ({total})</> : 'Sin reseñas'}</span>}
    </span>
  )
}
