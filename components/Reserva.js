'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { Cabecera, Cargando, Vacio, Avatar } from '@/components/Piezas'
import { comoLlegar } from '@/lib/mapa'
import { useUsuario, precio, deISO, fechaCorta, horaTexto, duracionTexto, codigoReserva, primerNombre, EQUIPOS, CUPOS } from '@/lib/canchas'

// Reserva confirmada: QR de check-in, calendario, jugadores y pagos
export default function Reserva({ id }) {
  const router = useRouter()
  const usuario = useUsuario()
  const [r, setR] = useState(undefined)
  const [partido, setPartido] = useState(null)
  const [qr, setQr] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function cargar() {
    const { data } = await supabase.from('reservas').select('*, canchas(id, nombre, barrio, direccion, lat, lng, politica_cancelacion)').eq('id', id).maybeSingle()
    setR(data || null)
    if (!data) return
    const p = await supabase.from('partidos').select('*, partido_jugadores(user_id, pagado, profiles(full_name))').eq('reserva_id', id).maybeSingle()
    setPartido(p.data || null)
    setQr(await QRCode.toDataURL(`JUNTIK:${codigoReserva(data.id)}`, { margin: 1, width: 440, color: { dark: '#101828', light: '#FFFFFF' } }))
  }
  useEffect(() => {
    if (!usuario) return
    cargar()
    const q = new URLSearchParams(window.location.search)
    if (q.get('nueva')) setAviso('¡Listo! Tu reserva quedó confirmada.')
    if (q.get('cambio')) setAviso('Listo, cambiamos la fecha de tu reserva.')
    if (q.toString()) window.history.replaceState(null, '', `/app/reserva/${id}`)
  }, [usuario]) // eslint-disable-line react-hooks/exhaustive-deps

  if (r === undefined) return <><Cabecera titulo="Tu reserva" volver="/app/reservas" /><main className="pag"><Cargando /></main></>
  if (r === null) return <><Cabecera titulo="Tu reserva" volver="/app/reservas" /><main className="pag"><Vacio titulo="No encontramos esta reserva">Puede que sea de otra cuenta.</Vacio></main></>

  const inicio = deISO(r.fecha, r.hora_inicio)
  const fin = new Date(inicio.getTime() + r.duracion_min * 60000)
  const activa = r.estado === 'confirmada' && fin > new Date()
  const equipos = Object.entries(r.equipamiento || {})
  const horaFin = horaTexto(fin.getHours() * 60 + fin.getMinutes())

  function calendario() {
    const f = (d) => d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Juntik//ES', 'BEGIN:VEVENT', `UID:${r.id}@juntik.com`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(inicio)}`, `DTEND:${f(fin)}`,
      `SUMMARY:${r.deporte} en ${r.canchas.nombre}`, `LOCATION:${r.canchas.direccion || r.canchas.barrio}`, `DESCRIPTION:Reserva Juntik ${codigoReserva(r.id)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
    a.download = 'reserva-juntik.ics'
    a.click()
  }
  async function abrirPartido() {
    setOcupado(true)
    const cupo = CUPOS[r.deporte] || 10
    const { data, error } = await supabase.from('partidos').insert({
      creador_id: usuario.id, cancha_id: r.cancha_id, reserva_id: r.id, deporte: r.deporte, fecha: r.fecha, hora_inicio: r.hora_inicio,
      duracion_min: r.duracion_min, cupo, precio_por_jugador: Math.ceil(r.total / cupo / 100) * 100,
    }).select('id').single()
    setOcupado(false)
    if (error) return setAviso('No pudimos abrir el partido. Probá de nuevo.')
    router.push(`/app/partido/${data.id}`)
  }

  return (
    <>
      <Cabecera titulo={r.estado === 'cancelada' ? 'Reserva cancelada' : 'Reserva confirmada'} sub={r.canchas.nombre} volver="/app/reservas" />
      <main className="pag">
        {aviso && <div className="aviso aviso-ok" role="status">{aviso}</div>}

        {activa && (
          <section className="qr">
            {qr && <img src={qr} alt={`Código QR de la reserva ${codigoReserva(r.id)}`} width="220" height="220" />}
            <b className="res-codigo">{codigoReserva(r.id)}</b>
            <span className="ex-sub">{r.checkin ? 'Check-in hecho. ¡Buen partido!' : 'Mostrá este código en la cancha para hacer el check-in.'}</span>
          </section>
        )}

        <dl className="ficha-datos tarjeta">
          <div><dt>Cancha</dt><dd><Link href={`/app/cancha/${r.cancha_id}`}>{r.canchas.nombre}</Link></dd></div>
          <div><dt>Cuándo</dt><dd>{fechaCorta(inicio)} · {r.hora_inicio.slice(0, 5)} a {horaFin} ({duracionTexto(r.duracion_min)})</dd></div>
          <div><dt>Deporte</dt><dd>{r.deporte}</dd></div>
          <div><dt>Dirección</dt><dd>{r.canchas.direccion || r.canchas.barrio}</dd></div>
          <div><dt>Equipamiento</dt><dd>{equipos.length ? equipos.map(([e, n]) => `${n} × ${EQUIPOS[e]?.nombre || e}`).join(', ') : 'Sin equipamiento'}</dd></div>
          <div><dt>Total</dt><dd>{precio(r.total)}{r.metodo_pago ? ` · ${r.metodo_pago}` : ''}</dd></div>
          {r.canchas.politica_cancelacion && <div><dt>Cancelación</dt><dd>{r.canchas.politica_cancelacion}</dd></div>}
        </dl>

        {activa && (
          <div className="res-botones dos">
            <button type="button" onClick={calendario}>Agregar al calendario</button>
            <a href={comoLlegar(r.canchas)} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
            <Link href={`/app/cancha/${r.cancha_id}/reservar?cambiar=${r.id}`}>Cambiar fecha o turno</Link>
            <Link href="/app/reservas">Cancelar en Mis reservas</Link>
          </div>
        )}

        <section className="tarjeta">
          <h2>Jugadores y pagos</h2>
          {partido ? (
            <>
              <span className="ex-sub">{partido.partido_jugadores.length} de {partido.cupo} jugadores · {precio(partido.precio_por_jugador)} cada uno</span>
              <ul className="gente">
                {partido.partido_jugadores.map((j) => (
                  <li key={j.user_id}>
                    <Avatar nombre={j.profiles?.full_name} />
                    <span>{primerNombre(j.profiles?.full_name)}{j.user_id === usuario.id ? ' (vos)' : ''}</span>
                    <span className={`etiqueta${j.pagado ? ' ok' : ''}`}>{j.pagado ? 'Pagó' : 'Falta pagar'}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/app/partido/${partido.id}`} className="boton boton-borde">Abrir el partido: invitar y chat</Link>
            </>
          ) : activa ? (
            <>
              <span className="ex-sub">Todavía es una reserva solo tuya. Abrila para invitar jugadores, dividir el pago y chatear.</span>
              <button type="button" className="boton boton-borde" onClick={abrirPartido} disabled={ocupado}>{ocupado ? 'Abriendo…' : 'Abrir el partido a otros jugadores'}</button>
            </>
          ) : <span className="ex-sub">Esta reserva no tuvo partido abierto.</span>}
        </section>
      </main>
    </>
  )
}
