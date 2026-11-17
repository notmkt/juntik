// Ilustración animada del hero: una cancha vista desde arriba donde "falta uno".
// Un jugador (vos) entra, completa el equipo y el partido arranca. Solo SVG + CSS.

const RIVALES = [[220, 78], [130, 150], [310, 150], [170, 220], [270, 220]]
const EQUIPO = [[220, 442], [130, 370], [310, 370], [175, 305]]

export default function HeroJuego() {
  return (
    <div className="lp-juego" role="img" aria-label="Ilustración: en una cancha falta un jugador; llega uno más y el equipo queda completo.">
      <svg viewBox="0 0 440 520" aria-hidden="true">
        <rect x="20" y="20" width="400" height="480" rx="32" fill="#101828" />
        <g fill="none" stroke="#20D68A" strokeWidth="2" opacity="0.55">
          <rect x="44" y="44" width="352" height="432" rx="12" />
          <line x1="44" y1="260" x2="396" y2="260" />
          <circle cx="220" cy="260" r="46" />
          <rect x="150" y="44" width="140" height="58" />
          <rect x="150" y="418" width="140" height="58" />
          <path d="M190 102a30 30 0 0 0 60 0" />
          <path d="M190 418a30 30 0 0 1 60 0" />
        </g>
        <circle cx="220" cy="260" r="4" fill="#20D68A" opacity="0.55" />

        {RIVALES.map(([x, y], i) => (
          <g key={`r${i}`} className="lp-jugador" style={{ animationDelay: `${-i * 0.7}s` }}>
            <circle cx={x} cy={y} r="15" fill="#20D68A" />
          </g>
        ))}
        {EQUIPO.map(([x, y], i) => (
          <g key={`e${i}`} className="lp-jugador" style={{ animationDelay: `${-0.35 - i * 0.6}s` }}>
            <circle cx={x} cy={y} r="15" fill="#F7F8F5" />
          </g>
        ))}

        {/* El lugar vacío */}
        <g className="lp-hueco">
          <circle className="lp-hueco-aro" cx="275" cy="305" r="17" fill="none" stroke="#C8F36A" strokeWidth="2.5" strokeDasharray="6 6" />
          <text x="275" y="310" textAnchor="middle" fill="#C8F36A" fontSize="16" fontWeight="800">?</text>
        </g>

        {/* Vos */}
        <g className="lp-vos">
          <circle cx="275" cy="305" r="24" fill="#C8F36A" opacity="0.22" />
          <circle cx="275" cy="305" r="15" fill="#C8F36A" />
          <text x="275" y="343" textAnchor="middle" fill="#C8F36A" fontSize="13" fontWeight="800">vos</text>
        </g>

        <circle className="lp-pelota" cx="0" cy="0" r="6.5" fill="#FFFFFF" stroke="#101828" strokeWidth="1.5" />
      </svg>

      <div className="lp-flota lp-flota-partido" aria-hidden="true">
        <span className="lp-cambia">
          <span className="lp-tag lp-antes">Falta 1</span>
          <span className="lp-tag lp-tag-verde lp-despues">Completo</span>
        </span>
        <b>Fútbol 5 · Hoy 20:00</b>
        <span className="lp-cambia lp-flota-sub">
          <span className="lp-antes">9 de 10 jugadores</span>
          <span className="lp-despues">10 de 10 jugadores</span>
        </span>
      </div>

      <div className="lp-flota lp-flota-puntos" aria-hidden="true">
        <span className="lp-mas">+30</span>
        <span><b>Te sumaste</b><br />puntos para tu ranking</span>
      </div>
    </div>
  )
}
