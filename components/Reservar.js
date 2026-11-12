'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import EnDesarrollo from '@/components/EnDesarrollo'
import {
  useUsuario, useCancha, precio, proximosDias, partesFecha, fechaISO, fechaCorta, horaTexto, duracionTexto,
  turnosDelDia, turnosOcupados, rangoLibre, precioTurno, EQUIPOS,
} from '@/lib/canchas'

const DURACIONES = [60, 90, 120]

export default function Reservar({ id }) {
  const router = useRouter()
  const usuario = useUsuario()
  const { cancha, error, cargar } = useCancha(id, usuario)
  const dias = useMemo(() => proximosDias(7), [])
  const [dia, setDia] = useState(null) // índice en `dias`
  const [ocupados, setOcupados] = useState(null) // null = cargando
  const [hora, setHora] = useState(null)
  const [duracion, setDuracion] = useState(60)
  const [deporte, setDeporte] = useState(null)
  const [equipos, setEquipos] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')

  const abierto = (d) => cancha && !(cancha.dias_cerrados || []).includes(d.getDay())

  // Al cargar la cancha: día y hora que vinieron en el enlace, o el primer día abierto
  useEffect(() => {
    if (!cancha || dia !== null) return
    const q = new URLSearchParams(window.location.search)
    const pedido = dias.findIndex((d) => fechaISO(d) === q.get('fecha'))
    const primero = dias.findIndex(abierto)
    setDia(pedido >= 0 && abierto(dias[pedido]) ? pedido : Math.max(primero, 0))
    if (pedido >= 0 && q.get('hora')) setHora(Number(q.get('hora')))
    setDeporte(cancha.deportes?.[0] || 'Deporte')
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

  // Si el turno elegido deja de ser válido (otro día, ocupado, no entra la duración), ajustarlo
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
  const total = hora === null ? 0 : precioTurno(cancha, hora, duracion) + totalEquipos
  const resumen = hora === null ? 'Elegí un horario' : `${fechaCorta(dias[dia])} · ${horaTexto(hora * 60)} · ${duracionTexto(duracion)}`
  const cambiar = (e, n) => setEquipos({ ...equipos, [e]: Math.max(0, Math.min(10, (equipos[e] || 0) + n)) })

  async function confirmar() {
    if (hora === null) return
    setAviso('')
    setEnviando(true)
    const pedidos = Object.fromEntries(disponibles.filter((e) => equipos[e] > 0).map((e) => [e, equipos[e]]))
    const { error } = await supabase.from('reservas').insert({
      cancha_id: cancha.id, fecha: fechaISO(dias[dia]), hora_inicio: `${horaTexto(hora * 60)}:00`,
      duracion_min: duracion, deporte, equipamiento: pedidos, total,
    })
    if (error) {
      setEnviando(false)
      if (error.code === '23P01') {
        setAviso('Ese horario se acaba de ocupar. Elegí otro.')
        setHora(null)
        cargarOcupados()
      } else setAviso('No pudimos confirmar la reserva. Probá de nuevo.')
      return
    }
    router.replace('/app/reservas?nueva=1')
  }

  return (
    <div className="reservar">
      <header className="cabecera">
        <Link href={`/app/cancha/${cancha.id}`} className="ex-redondo" aria-label="Volver a la cancha">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <div>
          <h1>Reservá tu turno</h1>
          <span className="ex-sub">{cancha.nombre} · {deporte}</span>
        </div>
      </header>

      <main className="reservar-cuerpo">
        {(cancha.deportes || []).length > 1 && (
          <section>
            <h2>Deporte</h2>
            <div className="reservar-deportes" role="group" aria-label="Deporte">
              {cancha.deportes.map((d) => (
                <button key={d} type="button" className="chip" aria-pressed={d === deporte} onClick={() => setDeporte(d)}>{d}</button>
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
                <button key={i} type="button" aria-pressed={i === dia} disabled={!abierto(d)} onClick={() => setDia(i)} aria-label={`${fechaCorta(d)}${abierto(d) ? '' : ', cerrado'}`}>
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
              {turnos.filter((t) => !t.pasado).map((t) => (
                <button key={t.hora} type="button" disabled={t.ocupado} aria-pressed={t.hora === hora} onClick={() => setHora(t.hora)}>
                  <b>{horaTexto(t.hora * 60)}</b>
                  <span>{t.ocupado ? 'Ocupado' : t.pico ? 'Horario pico' : 'Libre'}</span>
                </button>
              ))}
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

        {disponibles.length > 0 && (
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
                    <button type="button" className="ex-redondo" onClick={() => cambiar(e, -1)} disabled={!equipos[e]} aria-label={`Quitar ${EQUIPOS[e].nombre.toLowerCase()}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
                    </button>
                    <b aria-live="polite">{equipos[e] || 0}</b>
                    <button type="button" className="ex-redondo" onClick={() => cambiar(e, 1)} aria-label={`Agregar ${EQUIPOS[e].nombre.toLowerCase()}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="reservar-nota">Juntik es un prototipo académico: el pago es simulado y no se cobra nada.</p>
        {aviso && <div className="aviso aviso-error" role="alert">{aviso}</div>}
      </main>

      <div className="barra-accion">
        <div>
          <span className="barra-precio"><b>{precio(total)}</b></span>
          <span className="ex-sub">{resumen}</span>
        </div>
        <button type="button" className="boton boton-verde" onClick={confirmar} disabled={hora === null || enviando}>
          {enviando ? 'Confirmando…' : 'Confirmar reserva'}
        </button>
      </div>
    </div>
  )
}
