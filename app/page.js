import Link from 'next/link'
import Logo, { Simbolo } from '@/components/Logo'
import QRCode from 'qrcode'
import HeroJuego from '@/components/HeroJuego'
import './landing.css'

export const metadata = {
  title: 'Juntik — Encontrá con quién jugar y reservá tu cancha',
  description:
    'Sumate a partidos donde falta uno, unite a grupos de tu barrio y reservá canchas en Buenos Aires al mismo precio que en el lugar. Gratis.',
  openGraph: {
    title: 'Tu próximo partido ya está armado. Solo faltás vos.',
    description: 'Encontrá con quién jugar cerca tuyo. Gratis, desde tu celular.',
    url: 'https://juntik.com',
    siteName: 'Juntik',
    locale: 'es_AR',
    type: 'website',
  },
}

const REGISTRO = '/app/registro'
const DEPORTES = ['Fútbol 5', 'Fútbol 7', 'Pádel', 'Tenis', 'Básquet', 'Vóley']

const PASOS = [
  ['Contanos qué jugás', 'Elegí tu deporte, tu barrio y tu nivel. Te lleva un minuto.'],
  ['Sumate a un partido', 'Mirá dónde falta uno cerca tuyo, o abrí tu propio partido y dejá que otros se sumen.'],
  ['Jugá y volvé', 'Entrás con tu QR, jugás, calificás la cancha y sumás puntos. La próxima vez ya conocés gente.'],
]

const COMUNIDAD = [
  ['uno', 'Falta uno', 'Partidos abiertos que necesitan un jugador más. Antes de sumarte ves el día, la cancha, quiénes van y cuánto sale tu parte.'],
  ['grupo', 'Grupos', 'Unite a grupos de tu barrio y tu deporte, o armá el tuyo. Con chat propio, para no depender de otro grupo de WhatsApp.'],
  ['lupa', 'Jugadores', 'Buscá gente por deporte y nivel, mirá su perfil e invitala a tu partido.'],
  ['mano', 'Fair play', 'Después de cada partido, los jugadores se califican entre sí. Sabés con quién vas a jugar antes de llegar.'],
]

const RESERVAS = [
  ['Mismo precio que en la cancha.', 'Juntik no te cobra de más.'],
  ['Cada uno paga su parte.', 'Se terminó perseguir a los que deben.'],
  ['Todo en tu celular.', 'QR para entrar, cómo llegar y aviso en tu calendario.'],
  ['¿Te falta la paleta o la pelota?', 'Sumá el equipamiento a tu reserva.'],
  ['¿Surgió algo?', 'Cambiás la fecha desde la app.'],
]

const TORNEOS = [
  ['podio', 'Ranking por barrio y deporte'],
  ['medalla', 'Insignias y desafíos'],
  ['copa', 'Torneos con tabla de posiciones'],
]

const CANCHAS = [
  ['Tu agenda en un solo lugar:', 'reservas, bloqueos y check-in.'],
  ['Promociones', 'para los horarios que más cuesta llenar.'],
  ['Reseñas', 'que podés responder.'],
  ['Más visibilidad:', 'destacá tu cancha en el buscador y en el mapa.'],
]

const PREGUNTAS = [
  ['¿Juntik es gratis?', 'Sí. Crear tu cuenta, sumarte a partidos y reservar no cuesta nada. Pagás la cancha al mismo precio que en el lugar.'],
  ['¿Tengo que descargar algo?', 'No. Juntik funciona desde el navegador de tu celular. Si querés, lo agregás a tu pantalla de inicio y queda como una app.'],
  ['No conozco a nadie. ¿Puedo sumarme igual?', 'Para eso existe Juntik. En Falta uno hay partidos que están buscando gente, y nadie te va a preguntar de parte de quién venís.'],
  ['Hace mucho que no juego. ¿Voy a desentonar?', 'En tu perfil ponés tu nivel y ves el de los demás. Elegís partidos con gente que juega parecido a vos.'],
  ['¿Qué pasa si no puedo ir?', 'Te bajás del partido o cambiás la fecha de tu reserva desde la app, para que otro ocupe tu lugar.'],
  ['¿En qué zonas funciona?', 'Hoy, en la Ciudad de Buenos Aires.'],
  ['Tengo una cancha. ¿Cómo la sumo?', 'Creás tu cuenta, activás el modo dueño y cargás tu cancha con fotos, horarios y precio.'],
]

const ICONOS = {
  uno: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.900 6.500 5.500" /><path d="M19 7v6M16 10h6" /></>,
  grupo: <><circle cx="8" cy="9" r="3" /><circle cx="16.500" cy="9" r="3" /><path d="M2.500 19c.5-3 2.700-4.500 5.500-4.500s5 1.500 5.500 4.500M14.500 14.600c3.400-.6 6.400 1 7 4.400" /></>,
  lupa: <><circle cx="10.500" cy="10.500" r="6.500" /><path d="m15.500 15.500 5.500 5.500" /></>,
  mano: <><path d="M7 11v9H4v-9zM7 12l4.200-7.500c1.600 0 2.600 1.300 2.300 2.900L13 10h5.300c1.300 0 2.200 1.200 1.900 2.400l-1.500 6c-.2 1-1 1.600-2 1.600H7" /></>,
  podio: <><path d="M3 20v-6h6v6M9 20V8h6v12M15 20v-9h6v9M2 20h20" /></>,
  medalla: <><circle cx="12" cy="14.500" r="5.500" /><path d="m8.500 10-3-7M15.500 10l3-7M9.500 3h5" /></>,
  copa: <><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4c0 3 1.500 4.500 3.500 4.500M17 6h3c0 3-1.500 4.500-3.500 4.500M12 14v4M8 20h8" /></>,
}

function Icono({ nombre }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONOS[nombre]}
    </svg>
  )
}

function Empezar({ className = '' }) {
  return <Link href={REGISTRO} className={`boton boton-verde lp-cta ${className}`}>Empezar gratis</Link>
}

// Patrón decorativo con forma de QR (no es un código real)
const N = 21
const enEsquina = (f, c) => (f < 7 && c < 7) || (f < 7 && c >= N - 7) || (f >= N - 7 && c < 7)
const QR = Array.from({ length: N * N }, (_, i) => {
  const f = Math.floor(i / N), c = i % N
  if (enEsquina(f, c)) {
    const y = f < 7 ? f : f - (N - 7), x = c < 7 ? c : c - (N - 7)
    return y === 0 || y === 6 || x === 0 || x === 6 || (y > 1 && y < 5 && x > 1 && x < 5)
  }
  return (f * 7 + c * 13 + ((f * c) % 5)) % 3 === 0 || (f + c) % 7 === 0
})

const INSTALAR = [
  <>Abrí <b>juntik.com/app</b> en tu celular<span className="lp-solo-escritorio">, o escaneá el código</span>.</>,
  <>Tocá <b>Compartir</b> en iPhone, o el menú <b>⋮</b> en Android.</>,
  <>Elegí <b>«Agregar a inicio»</b> o <b>«Instalar app»</b>. Listo: Juntik queda como una app más.</>,
]

// Silueta punteada: el compañero que falta
function Fantasma({ className = '' }) {
  return (
    <svg className={`lp-fantasma ${className}`} viewBox="0 0 120 300" fill="none" stroke="#C8F36A" strokeWidth="3" strokeDasharray="9 9" strokeLinecap="round" aria-hidden="true">
      <circle cx="60" cy="46" r="30" />
      <path d="M14 298V152a46 46 0 0 1 92 0v146" />
      <text x="60" y="58" textAnchor="middle" fill="#C8F36A" stroke="none" fontSize="34" fontWeight="800">?</text>
    </svg>
  )
}

export default async function Inicio() {
  const qr = await QRCode.toString('https://juntik.com/app', {
    type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#101828', light: '#0000' },
  })
  return (
    <div className="lp">
      <header className="lp-barra">
        <div className="lp-ancho lp-barra-fila">
          <Link href="/" className="lp-logo" aria-label="Juntik, inicio"><Logo height={30} /></Link>
          <nav className="lp-nav" aria-label="Secciones">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#comunidad">Comunidad</a>
            <a href="#app">La app</a>
            <a href="#canchas">Para canchas</a>
          </nav>
          <Link href="/app" className="lp-entrar">Ya tengo cuenta</Link>
          <Empezar className="lp-cta-chico" />
        </div>
      </header>

      <main>
        {/* 1 · Hero */}
        <section className="lp-hero">
          <div className="lp-ancho lp-hero-fila">
            <div className="lp-hero-texto">
              <span className="lp-etiqueta">Reservas y comunidad deportiva en Buenos Aires</span>
              <h1>Tu próximo partido ya está armado. <br /><em>Solo faltás vos.</em></h1>
              <p className="lp-bajada">
                Juntik te muestra partidos abiertos, grupos y canchas cerca tuyo. Te sumás, pagás tu parte y jugás,
                aunque todavía no conozcas a nadie.
              </p>
              <Empezar />
              <ul className="lp-garantias">
                <li>Gratis para jugar</li>
                <li>Sin descargar nada</li>
                <li>Al mismo precio que en la cancha</li>
              </ul>
            </div>
            <HeroJuego />
          </div>
        </section>

        {/* 2 · Deportes */}
        <section className="lp-deportes" aria-label="Deportes">
          <div className="lp-ancho lp-deportes-fila">
            <p>Tu deporte, tu barrio, tu nivel.</p>
            <ul>{DEPORTES.map((d) => <li key={d} className="chip">{d}</li>)}</ul>
          </div>
        </section>

        {/* 3 · El problema */}
        <section className="lp-problema">
          <div className="lp-ancho">
            <div className="lp-problema-caja">
              <div className="lp-problema-texto">
                <span className="lp-etiqueta">El problema</span>
                <h2>El problema nunca fue la cancha.</h2>
                <p className="lp-problema-bajada">Canchas hay en todos los barrios. Lo difícil es juntar a la gente.</p>
                <ol className="lp-frases">
                  <li><span>01</span><p>Te mudaste y tu equipo quedó lejos.</p></li>
                  <li><span>02</span><p>Los grupos de WhatsApp ya están armados, y no estás en ninguno.</p></li>
                  <li><span>03</span><p>Caer solo a una cancha da un poco de vergüenza.</p></li>
                </ol>
              </div>
              <div className="lp-solo">
                <div className="lp-burbuja" aria-hidden="true">
                  <b>¿Alguien juega hoy?</b>
                  <span>Visto · sin respuestas</span>
                </div>
                <Fantasma />
                <img
                  className="lp-solo-jugador" src="/ilustraciones/duo-padel.svg#svgView(viewBox(345,40,468,940))"
                  width="468" height="940" loading="lazy"
                  alt="Ilustración de un jugador de pádel solo, con dos lugares vacíos a los costados."
                />
                <Fantasma className="lp-fantasma-2" />
              </div>
              <p className="lp-problema-cierre">Por eso existe Juntik: para que jugar no dependa de a quién conocés.</p>
            </div>
          </div>
        </section>

        {/* 4 · Cómo funciona */}
        <section className="lp-seccion" id="como-funciona">
          <div className="lp-ancho">
            <h2>De las ganas al partido, en tres pasos.</h2>
            <ol className="lp-pasos">
              {PASOS.map(([titulo, texto], i) => (
                <li key={titulo}>
                  <span className="lp-numero">{i + 1}</span>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </li>
              ))}
            </ol>
            <Empezar />
          </div>
        </section>

        {/* 5 · Comunidad */}
        <section className="lp-seccion lp-suave" id="comunidad">
          <div className="lp-ancho">
            <div className="lp-comunidad-cabeza">
              <div>
                <span className="lp-etiqueta">Comunidad</span>
                <h2>Llegás solo. <br />Te vas con equipo.</h2>
                <p className="lp-intro">En Juntik no hace falta tener grupo para jugar. El grupo se arma jugando.</p>
              </div>
              <img
                className="lp-duo" src="/ilustraciones/duo-padel.svg" width="1040" height="940" loading="lazy"
                alt="Ilustración de dos jugadores de pádel, cada uno con su paleta."
              />
            </div>
            <ul className="lp-tarjetas">
              {COMUNIDAD.map(([icono, titulo, texto]) => (
                <li key={titulo}>
                  <span className="lp-icono"><Icono nombre={icono} /></span>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6 · Reservas */}
        <section className="lp-seccion" id="reservas">
          <div className="lp-ancho lp-dos">
            <div>
              <span className="lp-etiqueta">Reservas</span>
              <h2>Reservá tu cancha sin llamar a nadie.</h2>
              <p className="lp-intro">
                Buscá en la lista o en el mapa, mirá fotos, reseñas y horarios libres, y reservá en el momento.
              </p>
              <ul className="lp-puntos">
                {RESERVAS.map(([fuerte, resto]) => <li key={fuerte}><b>{fuerte}</b> {resto}</li>)}
              </ul>
            </div>
            <div className="lp-ticket" aria-hidden="true">
              <div className="lp-ticket-arriba">
                <span className="lp-tag lp-tag-verde">Reserva confirmada</span>
                <b>Fútbol 5 · Sábado 19:00</b>
                <span>1 hora · 10 jugadores</span>
              </div>
              <div className="lp-qr">
                {QR.map((on, i) => <i key={i} className={on ? 'on' : ''} />)}
              </div>
              <div className="lp-ticket-abajo">
                <span>Tu parte</span>
                <b>1 de 10</b>
              </div>
            </div>
          </div>
        </section>

        {/* 7 · Torneos */}
        <section className="lp-seccion lp-lima" id="torneos">
          <div className="lp-ancho lp-torneos">
            <div>
              <span className="lp-etiqueta lp-etiqueta-azul">Torneos y desafíos</span>
              <h2>Acá cada partido cuenta.</h2>
              <p className="lp-intro">
                Sumás puntos por jugar, reservar y dejar reseñas. Subís en el ranking de tu barrio, ganás insignias y
                anotás a tu equipo en torneos.
              </p>
              <ul className="lp-destacados">
                {TORNEOS.map(([icono, texto]) => (
                  <li key={texto}><Icono nombre={icono} /><span>{texto}</span></li>
                ))}
              </ul>
            </div>
            {/* El jugador y la pelota son la misma ilustración, recortada en dos capas para animarlas */}
            <div className="lp-salto" role="img" aria-label="Ilustración de un jugador de vóley saltando para pegarle a la pelota.">
              <span className="lp-salto-capa lp-salto-jugador"><img src="/ilustraciones/jugador-voley.svg" alt="" width="830" height="1080" loading="lazy" /></span>
              <span className="lp-salto-capa lp-salto-pelota"><img src="/ilustraciones/jugador-voley.svg" alt="" width="830" height="1080" loading="lazy" /></span>
            </div>
          </div>
        </section>

        {/* 8 · Precio */}
        <section className="lp-seccion lp-precio" id="precio">
          <div className="lp-ancho lp-centro">
            <h2>Jugar con Juntik es <em>gratis</em>.</h2>
            <p className="lp-intro">
              Crear tu cuenta, sumarte a partidos y reservar no tiene costo. Pagás solo la cancha, al mismo precio
              que si fueras en persona.
            </p>
            <Empezar />
            <p className="lp-chico">Próximamente, Juntik Plus: beneficios extra para los que juegan seguido.</p>
          </div>
        </section>

        {/* La app */}
        <section className="lp-seccion lp-suave lp-app" id="app">
          <div className="lp-ancho lp-app-fila">
            <img
              className="lp-app-celular" src="/mockup-iphone.webp" width="820" height="1189" loading="lazy"
              alt="La app de Juntik en un celular: buscador, filtros por deporte y partidos abiertos cerca tuyo."
            />
            <div>
              <span className="lp-etiqueta">La app</span>
              <h2>Llevá Juntik en tu celular.</h2>
              <p className="lp-intro">Se instala en segundos desde el navegador, sin pasar por la tienda.</p>
              <ol className="lp-instalar">
                {INSTALAR.map((paso, i) => <li key={i}><span>{i + 1}</span><p>{paso}</p></li>)}
              </ol>
              <div className="lp-app-acciones">
                <Link href="/app" className="boton boton-verde lp-cta">Abrir la app</Link>
                <div className="lp-app-qr lp-solo-escritorio">
                  <span dangerouslySetInnerHTML={{ __html: qr }} />
                  <p>Escaneá para abrirla en tu celular</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9 · Para canchas */}
        <section className="lp-canchas" id="canchas">
          <div className="lp-ancho lp-dos">
            <div>
              <span className="lp-etiqueta">Para dueños de canchas</span>
              <h2>Tus turnos vacíos, llenos de gente con ganas de jugar.</h2>
              <p className="lp-intro">
                Publicá tu cancha en Juntik y recibí reservas de jugadores y grupos de tu zona. Vos ponés el precio.
                Nosotros no cobramos comisión por reserva.
              </p>
              <Link href={REGISTRO} className="boton lp-boton-claro">Sumar mi cancha</Link>
              <p className="lp-chico">
                ¿Preferís que hablemos? Escribinos a <a href="mailto:somos@juntik.com">somos@juntik.com</a>
              </p>
            </div>
            <ul className="lp-puntos lp-puntos-oscuro">
              {CANCHAS.map(([fuerte, resto]) => <li key={fuerte}><b>{fuerte}</b> {resto}</li>)}
            </ul>
          </div>
        </section>

        {/* 10 · Preguntas */}
        <section className="lp-seccion" id="preguntas">
          <div className="lp-ancho lp-angosto">
            <h2>Antes de entrar a la cancha.</h2>
            <div className="lp-faq">
              {PREGUNTAS.map(([pregunta, respuesta]) => (
                <details key={pregunta}>
                  <summary>{pregunta}</summary>
                  <p>{respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 11 · Cierre */}
        <section className="lp-cierre">
          <Simbolo size={420} color="#101828" className="lp-cierre-simbolo" />
          <div className="lp-ancho lp-centro">
            <h2>Esta semana, cerca tuyo, hay un partido donde falta uno.</h2>
            <p>Que no te quedes sin jugar por no tener equipo.</p>
            <Link href={REGISTRO} className="boton boton-oscuro lp-cta">Empezar gratis</Link>
            <span className="lp-firma">Juntik. Juntate a jugar.</span>
          </div>
        </section>
      </main>

      {/* 12 · Pie */}
      <footer className="lp-pie">
        <div className="lp-ancho">
          <div className="lp-pie-fila">
            <div>
              <Logo height={28} />
              <p>Juntik conecta personas, grupos y canchas para que más gente se junte a jugar.</p>
            </div>
            <nav aria-label="Pie de página">
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#comunidad">Comunidad</a>
              <a href="#canchas">Para canchas</a>
              <Link href="/app">Entrar a la app</Link>
            </nav>
            <div className="lp-pie-contacto">
              <a href="mailto:somos@juntik.com">somos@juntik.com</a>
              <a href="https://www.instagram.com/somosjuntik" target="_blank" rel="noopener noreferrer">Instagram @somosjuntik</a>
            </div>
          </div>
          <p className="lp-pie-nota">
            Juntik es un proyecto académico desarrollado en la Universidad de Palermo. En esta versión, los pagos son
            una demostración y no mueven dinero.
          </p>
        </div>
      </footer>
    </div>
  )
}
