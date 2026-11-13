'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BarraNav from '@/components/BarraNav'
import Chips from '@/components/Chips'
import { Pestanas, Cargando, Vacio, Avatar } from '@/components/Piezas'
import { useUsuario, puntosDe, conteos, DESAFIOS, deISO, fechaCorta, BARRIOS } from '@/lib/canchas'

export default function Torneos() {
  const usuario = useUsuario()
  const [pestana, setPestana] = useState('torneos')
  const [torneos, setTorneos] = useState(null)
  const [ranking, setRanking] = useState(null)
  const [puntos, setPuntos] = useState(null)
  const [deporte, setDeporte] = useState('Todos')
  const [barrio, setBarrio] = useState('Todos')

  useEffect(() => {
    if (!usuario) return
    ;(async () => {
      const [t, r, p] = await Promise.all([
        supabase.from('torneos').select('*, canchas(nombre, barrio), torneo_equipos(id, capitan_id)').order('fecha_inicio'),
        supabase.from('ranking').select('*').order('puntos', { ascending: false }),
        puntosDe(usuario.id),
      ])
      setTorneos(t.data || [])
      setRanking(r.data || [])
      setPuntos(p)
    })()
  }, [usuario])

  const hoy = new Date()
  const c = puntos ? conteos(puntos) : null
  const tabla = (ranking || []).filter((j) => (deporte === 'Todos' || (j.deportes || []).includes(deporte)) && (barrio === 'Todos' || j.barrio === barrio))

  return (
    <>
      <main className="res">
        <h1>Torneos</h1>
        <Pestanas valor={pestana} onChange={setPestana} opciones={[['torneos', 'Torneos'], ['ranking', 'Ranking'], ['desafios', 'Desafíos']]} />

        {pestana === 'torneos' && (
          <>
            {torneos === null && <Cargando />}
            <div className="res-lista">
              {(torneos || []).map((t) => {
                const empezo = deISO(t.fecha_inicio) <= hoy
                return (
                  <Link key={t.id} href={`/app/torneo/${t.id}`} className="res-tarjeta enlace">
                    <span className="ex-partido-arriba">
                      <span className="ex-etiqueta">{t.deporte}</span>
                      <span className={`etiqueta${empezo ? '' : ' ok'}`}>{empezo ? 'En curso' : 'Inscripción abierta'}</span>
                    </span>
                    <b>{t.nombre}</b>
                    <span className="ex-sub">{empezo ? 'Empezó el' : 'Empieza el'} {fechaCorta(deISO(t.fecha_inicio)).toLowerCase()}{t.canchas ? ` · ${t.canchas.nombre}` : ''}</span>
                    <span className="ex-sub">{t.torneo_equipos.length} de {t.cupo_equipos} equipos{t.torneo_equipos.some((e) => e.capitan_id === usuario?.id) ? ' · Estás inscripto' : ''}</span>
                  </Link>
                )
              })}
            </div>
          </>
        )}

        {pestana === 'ranking' && (
          <>
            <Chips deporte={deporte} onChange={setDeporte} className="chips-pag" />
            <div className="campo">
              <label htmlFor="r-barrio">Barrio</label>
              <select id="r-barrio" value={barrio} onChange={(e) => setBarrio(e.target.value)}>{['Todos', ...Object.keys(BARRIOS)].map((b) => <option key={b}>{b}</option>)}</select>
            </div>
            {ranking === null && <Cargando />}
            {ranking !== null && tabla.length === 0 && <Vacio titulo="Nadie en este ranking todavía">Probá con otro deporte o barrio.</Vacio>}
            <ol className="gente tarjeta ranking">
              {tabla.map((j, i) => (
                <li key={j.id} className={j.id === usuario?.id ? 'es-mio' : ''}>
                  <span className="puesto">{i + 1}</span>
                  <Avatar nombre={j.full_name} />
                  <Link href={`/app/jugador/${j.id}`} className="gente-datos">
                    <b>{j.full_name || 'Jugador'}{j.id === usuario?.id ? ' (vos)' : ''}</b>
                    <span className="ex-sub">{[j.barrio, j.nivel].filter(Boolean).join(' · ')}</span>
                  </Link>
                  <span className="etiqueta">{j.puntos} pts</span>
                </li>
              ))}
            </ol>
            <span className="ex-sub">Los puntos se suman solos: reserva 50, partido 30, torneo 40, reseña 20, foto 10, fair play 5.</span>
          </>
        )}

        {pestana === 'desafios' && (
          <>
            {!c && <Cargando />}
            {c && (
              <>
                <div className="numeros">
                  <div><b>{c.total}</b><span>puntos</span></div>
                  <div><b>{DESAFIOS.filter((d) => c[d.clave] >= d.meta).length}</b><span>insignias</span></div>
                  <div><b>{DESAFIOS.length}</b><span>desafíos</span></div>
                </div>
                <div className="res-lista">
                  {DESAFIOS.map((d) => {
                    const hecho = Math.min(c[d.clave], d.meta)
                    return (
                      <div key={d.id} className="res-tarjeta">
                        <span className="ex-partido-arriba">
                          <b>{d.nombre}</b>
                          <span className={`etiqueta${hecho >= d.meta ? ' ok' : ''}`}>{hecho >= d.meta ? 'Insignia ganada' : `${hecho} de ${d.meta}`}</span>
                        </span>
                        <span className="ex-sub">{d.detalle}</span>
                        <span className="progreso" role="progressbar" aria-valuenow={hecho} aria-valuemin={0} aria-valuemax={d.meta} aria-label={d.nombre}><span style={{ width: `${(hecho / d.meta) * 100}%` }} /></span>
                      </div>
                    )
                  })}
                </div>
                <section className="tarjeta">
                  <h2>Últimos puntos</h2>
                  {puntos.length === 0 && <span className="ex-sub">Todavía no sumaste puntos. Reservá un turno o sumate a un partido.</span>}
                  <dl className="ficha-datos">
                    {puntos.slice(0, 8).map((p, i) => <div key={i}><dt>{p.motivo}</dt><dd>{p.cantidad > 0 ? '+' : ''}{p.cantidad}</dd></div>)}
                  </dl>
                </section>
              </>
            )}
          </>
        )}
      </main>
      <BarraNav activa="torneos" />
    </>
  )
}
