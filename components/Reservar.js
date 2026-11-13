'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import EnDesarrollo from '@/components/EnDesarrollo'
import {
  useUsuario, useCancha, precio, proximosDias, partesFecha, fechaISO, fechaCorta, horaTexto, duracionTexto,
  turnosDelDia, turnosOcupados, rangoLibre, precioTurno, mejorPromo, promosDe, EQUIPOS, NIVELES, CUPOS,
} from '@/lib/canchas'

const DURACIONES = [60, 90, 120]
const METODOS = ['Mercado Pago', 'Tarjeta de crédito o débito']

export default function Reservar({ id }) {
  const router = useRouter()
  const usuario = useUsuario()
  const { cancha, error, cargar } = useCancha(id, usuario)
  const dias = useMemo(() => proximosDias(7), [])
  const [dia, setDia] = useState(null)
  const [ocupados, setOcupados] = useState(null)
  const [promos, setPromos] = useState([])
  const [hora, setHora] = useState(null)
  const [duracion, setDuracion] = useState(60)
  const [deporte, setDeporte] = useState(null)
  const [equipos, setEquipos] = useState({})
  const [abierto, setAbierto] = useState(false) // abrir el partido a otros jugadores
  const [cupo, setCupo] = useState(10)
  const [nivel, setNivel] = useState('Todos los niveles')
  const [paso, setPaso] = useState(1) // 1 = turno, 2 = pago
  const [metodo, setMetodo] = useState(METODOS[0])
  const [cambiar, setCambiar] = useState(null) // id de la reserva que se está reprogramando
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')

  const estaAbierto = (d) => cancha && !(cancha.dias_cerrados || []).includes(d.getDay())

  useEffect(() => {
    if (!cancha || dia !== null) return
    const q = new URLSearchParams(window.location.search)
    const pedido = dias.findIndex((d) => fechaISO(d) === q.get('fecha'))
    const primero = dias.findIndex(estaAbierto)
    setDia(pedido >= 0 && estaAbierto(dias[pedido]) ? pedido : Math.max(primero, 0))
    if (pedido >= 0 && q.get('hora')) setHora(Number(q.get('hora')))
    const dep = cancha.deportes?.[0] || 'Deporte'
    setDeporte(dep)
    setCupo(CUPOS[dep] || 10)
    promosDe(cancha.id).then(setPromos)
    if (q.get('cambiar')) {
      setCambiar(q.get('cambiar'))
      supabase.from('reservas').select('deporte, duracion_min, equipamiento').eq('id', q.get('cambiar')).maybeSingle().then(({ data }) => {
        if (!data) return
        setDeporte(data.deporte)
        setDuracion(data.duracion_min)
        setEquipos(data.equipamiento || {})
      })
    }
  }, [cancha]) // eslint-disable-line react-hooks/exhaustive-deps

  async function cargarOcupados() {
    setOcupados(null)
    setOcupados(await turnosOcupados(id, dias[dia]))
  }
  useEffect(() => {
    if (dia !== null) cargarOcupados()
  }, [dia]) // eslint-disable-line react-hooks/exhaustive-deps

  const turnos = useMemo(
    () => (cancha && dia !== null && ocupados ? turnosDelDia(cancha, dias[dia], ocupados) : []),
    [cancha, dia, ocupados, dias]
  )
  const entra = (h, min) => h !== null && h * 60 + min <= cancha.cierra * 60 && rangoLibre(ocupados || [], h * 60, min)

  useEffect(() => {
    if (hora === null || !ocupados) return
    const t = turnos.find((x) => x.hora === hora)
    if (!t || t.ocupado || t.pasado) setHora(null)
    else if (!entra(hora, duracion)) setDuracion(60)
  }, [turnos]) // eslint-disable-line react-hooks/exhaustive-deps

  if (cancha === null) return <EnDesarrollo />
  if (error) {
    return (
      <main className="ficha-estado">
        <div className="ex-vacio" role="alert">
          <b>No pudimos cargar la cancha</b>
          <button type="button" onClick={cargar}>Reintentar</button>
        </div>
      </main>
    )
  }
  if (!cancha || dia === null) return <main className="ficha-estado" aria-busy="true"><div className="ex-esqueleto" style={{ margin: 20 }} /></main>

  const disponibles = (cancha.equipamiento || []).filter((e) => EQUIPOS[e])
  const totalEquipos = disponibles.reduce((t, e) => t + (equipos[e] || 0) * EQUIPOS[e].precio, 0)
  const promo = hora === null ? null : mejorPromo(promos, dias[dia], hora)
  const totalTurno = hora === null ? 0 : precioTurno(cancha, hora, duracion, promo)
  const total = totalTurno + totalEquipos
  const porJugador = Math.ceil(total / cupo / 100) * 100
  const aPagar = abierto && !cambiar ? porJugador : total
  const resumen = hora === null ? 'Elegí un horario' : `${fechaCorta(dias[dia])} · ${horaTexto(hora * 60)} · ${duracionTexto(duracion)}`
  const cambiarEquipo = (e, n) => setEquipos({ ...equipos, [e]: Math.max(0, Math.min(10, (equipos[e] || 0) + n)) })
  const pedidos = Object.fromEntries(disponibles.filter((e) => equipos[e] > 0).map((e) => [e, equipos[e]]))

  function ocupadoError(error) {
    setEnviando(false)
    setPaso(1)
    if (error.code === '23P01') {
      setAviso('Ese horario se acaba de ocupar. Elegí otro.')
      setHora(null)
      cargarOcupados()
    } else setAviso('No pudimos confirmar la reserva. Probá de nuevo.')
  }

  async function confirmar() {
    if (hora === null) return
    setAviso('')
    setEnviando(true)
    const turno = { fecha: fechaISO(dias[dia]), hora_inicio: `${horaTexto(hora * 60)}:00`, duracion_min: duracion }
    if (cambiar) {
      const { error } = await supabase.from('reservas').update({ ...turno, total }).eq('id', cambiar)
      if (error) return ocupadoError(error)
      await supabase.from('partidos').update(turno).eq('reserva_id', cambiar)
      return router.replace(`/app/reserva/${cambiar}?cambio=1`)
    }
    const { data, error } = await supabase.from('reservas')
      .insert({ cancha_id: cancha.id, ...turno, deporte, equipamiento: pedidos, total, metodo_pago: metodo })
      .select('id').single()
    if (error) return ocupadoError(error)
    if (abierto) {
      await supabase.from('partidos').insert({
        creador_id: usuario.id, cancha_id: cancha.id, reserva_id: data.id, deporte, ...turno, cupo, nivel, precio_por_jugador: porJugador,
      })
    }
    router.replace(`/app/reserva/${data.id}?nueva=1`)
  }

  return (
    <div className="reservar">
      <header className="cabecera">
        {paso === 1 ? (
          <Link href={`/app/cancha/${cancha.id}`} className="ex-redondo" aria-label="Volver a la cancha">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
        ) : (
          <button type="button" className="ex-redondo" onClick={() => setPaso(1)} aria-label="Volver a elegir el turno">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        )}
        <div>
          <h1>{cambiar ? 'Cambiá la fecha o el turno' : paso === 1 ? 'Reservá tu turno' : 'Pagá tu reserva'}</h1>
          <span className="ex-sub">{cancha.nombre} · {deporte}</span>
        </div>
      </header>

      {paso === 1 && (
        <main className="reservar-cuerpo">
          {!cambiar && (cancha.deportes || []).length > 1 && (
            <section>
              <h2>Deporte</h2>
              <div className="reservar-deportes" role="group" aria-label="Deporte">
                {cancha.deportes.map((d) => (
                  <button key={d} type="button" className="chip" aria-pressed={d === deporte} onClick={() => { setDeporte(d); setCupo(CUPOS[d] || 10) }}>{d}</button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2>Día</h2>
            <div className="reservar-dias" role="group" aria-label="Día">
              {dias.map((d, i) => {
                const p = partesFecha(d)
                return (
                  <button key={i} type="button" aria-pressed={i === dia} disabled={!estaAbierto(d)} onClick={() => setDia(i)} aria-label={`${fechaCorta(d)}${estaAbierto(d) ? '' : ', cerrado'}`}>
                    <span>{i === 0 ? 'Hoy' : p.dia}</span>
                    <b>{p.numero}</b>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <div className="ex-titulo">
              <h2>Horarios disponibles</h2>
              <span className="ex-sub">El horario pico cuesta más</span>
            </div>
            {!ocupados && <div className="ex-esqueleto" style={{ height: 120 }} />}
            {ocupados && turnos.every((t) => t.pasado || t.ocupado) && (
              <div className="ex-vacio"><b>No quedan turnos este día</b>Probá con otro día.</div>
            )}
            {ocupados && (
              <div className="reservar-turnos" role="group" aria-label="Horario">
                {turnos.filter((t) => !t.pasado).map((t) => {
                  const p = mejorPromo(promos, dias[dia], t.hora)
                  return (
                    <button key={t.hora} type="button" disabled={t.ocupado} aria-pressed={t.hora === hora} onClick={() => setHora(t.hora)}>
                      <b>{horaTexto(t.hora * 60)}</b>
                      <span>{t.ocupado ? 'Ocupado' : p ? `Promo −${p.descuento} %` : t.pico ? 'Horario pico' : 'Libre'}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <section>
            <h2>Duración</h2>
            <div className="reservar-duracion" role="group" aria-label="Duración">
              {DURACIONES.map((m) => (
                <button key={m} type="button" aria-pressed={m === duracion} disabled={hora !== null && !entra(hora, m)} onClick={() => setDuracion(m)}>
                  {duracionTexto(m)}
                </button>
              ))}
            </div>
          </section>

          {!cambiar && disponibles.length > 0 && (
            <section>
              <h2>Sumá equipamiento</h2>
              <div>
                {disponibles.map((e) => (
                  <div key={e} className="reservar-equipo">
                    <span>
                      <b>{EQUIPOS[e].nombre}</b>
                      <span className="ex-sub">{precio(EQUIPOS[e].precio)} {EQUIPOS[e].unidad}</span>
                    </span>
                    <span>
                      <button type="button" className="ex-redondo" onClick={() => cambiarEquipo(e, -1)} disabled={!equipos[e]} aria-label={`Quitar ${EQUIPOS[e].nombre.toLowerCase()}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
                      </button>
                      <b aria-live="polite">{equipos[e] || 0}</b>
                      <button type="button" className="ex-redondo" onClick={() => cambiarEquipo(e, 1)} aria-label={`Agregar ${EQUIPOS[e].nombre.toLowerCase()}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!cambiar && (
            <section>
              <h2>Invitá jugadores y dividí el pago</h2>
              <label className="interruptor">
                <input type="checkbox" checked={abierto} onChange={(e) => setAbierto(e.target.checked)} />
                <span>Abrir el partido a otros jugadores (aparece en Comunidad)</span>
              </label>
              {abierto && (
                <div className="dos-campos">
                  <div className="campo">
                    <label htmlFor="cupo">Jugadores en total</label>
                    <input id="cupo" type="number" min={2} max={30} value={cupo} onChange={(e) => setCupo(Math.max(2, Math.min(30, Number(e.target.value) || 2)))} />
                  </div>
                  <div className="campo">
                    <label htmlFor="nivel">Nivel</label>
                    <select id="nivel" value={nivel} onChange={(e) => setNivel(e.target.value)}>
                      {['Todos los niveles', ...NIVELES].map((n) => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {abierto && hora !== null && <span className="ex-sub">Cada jugador paga {precio(porJugador)}. Vos pagás tu parte ahora y el resto al sumarse.</span>}
            </section>
          )}
          {aviso && <div className="aviso aviso-error" role="alert">{aviso}</div>}
        </main>
      )}

      {paso === 2 && (
        <main className="reservar-cuerpo">
          <section>
            <h2>Resumen</h2>
            <dl className="ficha-datos">
              <div><dt>Turno</dt><dd>{resumen}</dd></div>
              <div><dt>Cancha{promo ? ` (promo −${promo.descuento} %)` : ''}</dt><dd>{precio(totalTurno)}</dd></div>
              {Object.entries(pedidos).map(([e, n]) => <div key={e}><dt>{n} × {EQUIPOS[e].nombre}</dt><dd>{precio(n * EQUIPOS[e].precio)}</dd></div>)}
              <div><dt>Total</dt><dd>{precio(total)}</dd></div>
              {abierto && <div><dt>Tu parte (1 de {cupo})</dt><dd>{precio(porJugador)}</dd></div>}
            </dl>
          </section>
          <section>
            <h2>Medio de pago</h2>
            <div className="opciones" role="radiogroup" aria-label="Medio de pago">
              {METODOS.map((m) => (
                <label key={m} className={m === metodo ? 'elegida' : ''}>
                  <input type="radio" name="metodo" checked={m === metodo} onChange={() => setMetodo(m)} />
                  {m}
                </label>
              ))}
            </div>
          </section>
          <p className="reservar-nota">Juntik es un prototipo académico: el pago es simulado y no se cobra nada.</p>
          {aviso && <div className="aviso aviso-error" role="alert">{aviso}</div>}
        </main>
      )}

      <div className="barra-accion">
        <div>
          <span className="barra-precio"><b>{precio(paso === 2 ? aPagar : total)}</b></span>
          <span className="ex-sub">{resumen}</span>
        </div>
        {cambiar ? (
          <button type="button" className="boton boton-verde" onClick={confirmar} disabled={hora === null || enviando}>{enviando ? 'Guardando…' : 'Guardar cambio'}</button>
        ) : paso === 1 ? (
          <button type="button" className="boton boton-verde" onClick={() => { setAviso(''); setPaso(2) }} disabled={hora === null}>Continuar</button>
        ) : (
          <button type="button" className="boton boton-verde" onClick={confirmar} disabled={enviando}>{enviando ? 'Pagando…' : `Pagar ${precio(aPagar)}`}</button>
        )}
      </div>
    </div>
  )
}
