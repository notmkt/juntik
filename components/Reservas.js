'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BarraNav from '@/components/BarraNav'
import { comoLlegar } from '@/lib/mapa'
import { useUsuario, precio, deISO, partesFecha, horaTexto, EQUIPOS } from '@/lib/canchas'

const ESTRELLA = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

function cuanto(inicio, ahora) {
  const hoy = new Date(ahora)
  hoy.setHours(0, 0, 0, 0)
  const dia = new Date(inicio)
  dia.setHours(0, 0, 0, 0)
  const dias = Math.round((dia - hoy) / 86400000)
  if (inicio <= ahora) return 'En curso'
  return dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `En ${dias} días`
}

export default function Reservas() {
  const usuario = useUsuario()
  const [reservas, setReservas] = useState(null) // null = cargando
  const [notas, setNotas] = useState({}) // cancha_id → estrellas que dio el usuario
  const [error, setError] = useState(false)
  const [pestana, setPestana] = useState('proximas')
  const [abierta, setAbierta] = useState(null) // id con el detalle abierto
  const [porCancelar, setPorCancelar] = useState(null) // id pidiendo confirmación
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState('')

  async function cargar() {
    setError(false)
    const [r, c] = await Promise.all([
      supabase.from('reservas').select('*, canchas(id, nombre, barrio, direccion, lat, lng, politica_cancelacion)').order('fecha').order('hora_inicio'),
      supabase.from('calificaciones').select('cancha_id, general').eq('user_id', usuario.id),
    ])
    if (r.error) {
      setError(true)
      setReservas([])
      return
    }
    setNotas(Object.fromEntries((c.data || []).map((x) => [x.cancha_id, x.general])))
    setReservas(r.data)
  }

  useEffect(() => {
    if (!usuario) return
    cargar()
    if (new URLSearchParams(window.location.search).get('nueva')) {
      setAviso('¡Listo! Tu reserva quedó confirmada.')
      window.history.replaceState(null, '', '/app/reservas')
    }
  }, [usuario]) // eslint-disable-line react-hooks/exhaustive-deps

  const { proximas, pasadas, paraCalificar } = useMemo(() => {
    const ahora = new Date()
    const todas = (reservas || []).map((r) => {
      const inicio = deISO(r.fecha, r.hora_inicio)
      const fin = new Date(inicio.getTime() + r.duracion_min * 60000)
      return { ...r, inicio, fin, ahora }
    })
    const proximas = todas.filter((r) => r.estado === 'confirmada' && r.fin > ahora)
    const pasadas = todas.filter((r) => !(r.estado === 'confirmada' && r.fin > ahora)).reverse()
    const paraCalificar = pasadas.find((r) => r.estado === 'confirmada' && !notas[r.cancha_id])
    return { proximas, pasadas, paraCalificar }
  }, [reservas, notas])

  async function cancelar(id) {
    setOcupado(true)
    const { error } = await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', id)
    setOcupado(false)
    setPorCancelar(null)
    if (error) return setAviso('No pudimos cancelar la reserva. Probá de nuevo.')
    setAviso('Reserva cancelada.')
    cargar()
  }

  const lista = pestana === 'proximas' ? proximas : pasadas

  function Fecha({ r, destacada }) {
    const p = partesFecha(r.inicio)
    return (
      <span className={`res-fecha${destacada ? ' destacada' : ''}`} aria-hidden="true">
        <span>{p.dia.toUpperCase()}</span>
        <b>{p.numero}</b>
        <span>{p.mes.toUpperCase()}</span>
      </span>
    )
  }
  const horario = (r) => `${horaTexto(r.inicio.getHours() * 60 + r.inicio.getMinutes())} a ${horaTexto(r.fin.getHours() * 60 + r.fin.getMinutes())}`

  return (
    <>
      <main className="res">
        <h1>Mis reservas</h1>
        <div className="res-pestanas" role="tablist">
          <button type="button" role="tab" aria-selected={pestana === 'proximas'} onClick={() => setPestana('proximas')}>
            Próximas{proximas.length > 0 && ` (${proximas.length})`}
          </button>
          <button type="button" role="tab" aria-selected={pestana === 'pasadas'} onClick={() => setPestana('pasadas')}>Pasadas</button>
        </div>

        {aviso && <div className="aviso aviso-ok" role="status">{aviso}</div>}

        {paraCalificar && (
          <Link href={`/app/cancha/${paraCalificar.cancha_id}#calificar`} className="res-calificar">
            <span><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={ESTRELLA} /></svg></span>
            <span>
              <b>¿Cómo estuvo {paraCalificar.canchas.nombre}?</b>
              <span className="ex-sub">Calificá la cancha y ayudá a otros jugadores</span>
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </Link>
        )}

        {reservas === null && (
          <div aria-busy="true" aria-label="Cargando reservas">
            <div className="ex-esqueleto" style={{ height: 150 }} />
          </div>
        )}

        {error && (
          <div className="ex-vacio" role="alert">
            <b>No pudimos cargar tus reservas</b>
            Revisá tu conexión y probá de nuevo.
            <br />
            <button type="button" onClick={cargar}>Reintentar</button>
          </div>
        )}

        {reservas !== null && !error && lista.length === 0 && (
          <div className="ex-vacio">
            <b>{pestana === 'proximas' ? 'No tenés reservas próximas' : 'Todavía no jugaste ningún partido'}</b>
            {pestana === 'proximas' ? 'Encontrá una cancha y reservá tu turno.' : 'Acá vas a ver los turnos que ya pasaron y los cancelados.'}
            <br />
            <Link href="/app/explorar" className="boton boton-verde">Explorar canchas</Link>
          </div>
        )}

        <div className="res-lista">
          {pestana === 'proximas' && proximas.map((r, i) => {
            const equipos = Object.entries(r.equipamiento || {})
            return (
              <article key={r.id} className="res-tarjeta">
                <div className="res-arriba">
                  <Fecha r={r} destacada={i === 0} />
                  <span>
                    <Link href={`/app/cancha/${r.cancha_id}`} className="res-nombre">{r.canchas.nombre}</Link>
                    <span className="ex-sub">{r.deporte} · {horario(r)}</span>
                    <span className="res-cuando">{cuanto(r.inicio, r.ahora)}</span>
                  </span>
                </div>
                <div className="res-pago">
                  <span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                    Pago completo
                  </span>
                  <b>{precio(r.total)}</b>
                </div>
                <div className="res-botones">
                  <button type="button" aria-expanded={abierta === r.id} onClick={() => setAbierta(abierta === r.id ? null : r.id)}>
                    {abierta === r.id ? 'Ocultar' : 'Ver detalle'}
                  </button>
                  <a href={comoLlegar(r.canchas)} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
                  <button type="button" onClick={() => setPorCancelar(r.id)}>Cancelar</button>
                </div>
                {abierta === r.id && (
                  <dl className="ficha-datos res-detalle">
                    <div><dt>Código de reserva</dt><dd className="res-codigo">JTK-{r.id.slice(0, 6).toUpperCase()}</dd></div>
                    <div><dt>Dirección</dt><dd>{r.canchas.direccion || r.canchas.barrio}</dd></div>
                    <div><dt>Equipamiento</dt><dd>{equipos.length ? equipos.map(([e, n]) => `${n} × ${EQUIPOS[e]?.nombre || e}`).join(', ') : 'Sin equipamiento'}</dd></div>
                    {r.canchas.politica_cancelacion && <div><dt>Cancelación</dt><dd>{r.canchas.politica_cancelacion}</dd></div>}
                  </dl>
                )}
                {porCancelar === r.id && (
                  <div className="res-confirmar" role="alertdialog" aria-label="Confirmar cancelación">
                    <b>¿Cancelar esta reserva?</b>
                    <span className="ex-sub">El turno vuelve a quedar libre para otras personas.</span>
                    <div>
                      <button type="button" className="boton boton-borde" onClick={() => setPorCancelar(null)} disabled={ocupado}>No, mantener</button>
                      <button type="button" className="boton boton-oscuro" onClick={() => cancelar(r.id)} disabled={ocupado}>{ocupado ? 'Cancelando…' : 'Sí, cancelar'}</button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}

          {pestana === 'pasadas' && pasadas.map((r) => {
            const cancelada = r.estado === 'cancelada'
            const nota = notas[r.cancha_id]
            return (
              <article key={r.id} className="res-tarjeta">
                <div className="res-arriba">
                  <Fecha r={r} />
                  <span>
                    <Link href={`/app/cancha/${r.cancha_id}`} className="res-nombre">{r.canchas.nombre}</Link>
                    <span className="ex-sub">{r.deporte} · {horario(r)}</span>
                    {cancelada && <span className="res-estado">Cancelada</span>}
                    {!cancelada && nota && <span className="ex-sub">Calificaste con {nota} {nota === 1 ? 'estrella' : 'estrellas'}</span>}
                  </span>
                </div>
                {!cancelada && !nota ? (
                  <Link href={`/app/cancha/${r.cancha_id}#calificar`} className="boton boton-verde">Calificar la cancha</Link>
                ) : (
                  <Link href={`/app/cancha/${r.cancha_id}/reservar`} className="boton boton-borde">Volver a reservar</Link>
                )}
              </article>
            )
          })}
        </div>
      </main>
      <BarraNav activa="reservas" />
    </>
  )
}
