'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Chat from '@/components/Chat'
import EstrellasInput from '@/components/EstrellasInput'
import { Cabecera, Cargando, Vacio, Avatar } from '@/components/Piezas'
import { PARTIDO_CAMPOS } from '@/components/Comunidad'
import { comoLlegar } from '@/lib/mapa'
import { useUsuario, precio, deISO, cuandoEs, duracionTexto, primerNombre } from '@/lib/canchas'

export default function Partido({ id }) {
  const usuario = useUsuario()
  const [p, setP] = useState(undefined)
  const [invitacion, setInvitacion] = useState(null)
  const [notas, setNotas] = useState({}) // fair play que ya di
  const [busca, setBusca] = useState('')
  const [encontrados, setEncontrados] = useState([])
  const [invitados, setInvitados] = useState([])
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function cargar() {
    const [a, b, c] = await Promise.all([
      supabase.from('partidos').select(PARTIDO_CAMPOS).eq('id', id).maybeSingle(),
      supabase.from('invitaciones').select('*').eq('partido_id', id),
      supabase.from('fairplay').select('para_id, nota').eq('partido_id', id).eq('de_id', usuario.id),
    ])
    setP(a.data || null)
    setInvitacion((b.data || []).find((i) => i.invitado_id === usuario.id && i.estado === 'pendiente') || null)
    setInvitados((b.data || []).map((i) => i.invitado_id))
    setNotas(Object.fromEntries((c.data || []).map((f) => [f.para_id, f.nota])))
  }
  useEffect(() => {
    if (usuario) cargar()
  }, [usuario]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = busca.trim()
    if (t.length < 2) return setEncontrados([])
    let vigente = true
    supabase.from('profiles').select('id, full_name').ilike('full_name', `%${t}%`).limit(6).then(({ data }) => vigente && setEncontrados(data || []))
    return () => { vigente = false }
  }, [busca])

  if (p === undefined) return <><Cabecera titulo="Partido" volver="/app/comunidad" /><main className="pag"><Cargando /></main></>
  if (p === null) return <><Cabecera titulo="Partido" volver="/app/comunidad" /><main className="pag"><Vacio titulo="No encontramos este partido">Puede que lo hayan cancelado.</Vacio></main></>

  const jugadores = p.partido_jugadores
  const yo = jugadores.find((j) => j.user_id === usuario.id)
  const anotados = jugadores.length + p.jugadores_demo
  const faltan = Math.max(0, p.cupo - anotados)
  const fin = new Date(deISO(p.fecha, p.hora_inicio).getTime() + p.duracion_min * 60000)
  const jugado = fin < new Date()
  const soyCreador = p.creador_id === usuario.id

  async function hacer(fn, ok) {
    setAviso('')
    setOcupado(true)
    const { error } = await fn()
    setOcupado(false)
    if (error) return setAviso(error.message?.includes('PARTIDO_COMPLETO') ? 'El partido ya está completo.' : 'No pudimos hacerlo. Probá de nuevo.')
    if (ok) setAviso(ok)
    cargar()
  }
  const sumarme = () => hacer(async () => {
    const r = await supabase.from('partido_jugadores').insert({ partido_id: p.id })
    if (!r.error && invitacion) await supabase.from('invitaciones').update({ estado: 'aceptada' }).eq('id', invitacion.id)
    return r
  }, '¡Estás adentro! Pagá tu parte para confirmar tu lugar.')
  const pagar = () => hacer(() => supabase.from('partido_jugadores').update({ pagado: true }).eq('partido_id', p.id).eq('user_id', usuario.id), 'Pago registrado (simulado).')
  const bajarme = () => hacer(() => supabase.from('partido_jugadores').delete().eq('partido_id', p.id).eq('user_id', usuario.id), 'Te bajaste del partido.')
  const rechazar = () => hacer(() => supabase.from('invitaciones').update({ estado: 'rechazada' }).eq('id', invitacion.id))
  const invitar = (uid) => hacer(() => supabase.from('invitaciones').insert({ partido_id: p.id, invitado_id: uid }), 'Invitación enviada.')
  const evaluar = (uid, nota) => hacer(() => supabase.from('fairplay').insert({ partido_id: p.id, para_id: uid, nota }))
  async function compartir() {
    const datos = { title: `Partido de ${p.deporte} en Juntik`, url: window.location.href }
    try {
      if (navigator.share) await navigator.share(datos)
      else { await navigator.clipboard.writeText(datos.url); setAviso('Enlace copiado.') }
    } catch {}
  }

  return (
    <>
      <Cabecera titulo={`Partido de ${p.deporte}`} sub={`${cuandoEs(p.fecha, p.hora_inicio)} · ${p.canchas.nombre}`} volver="/app/comunidad" />
      <main className="pag">
        {aviso && <div className="aviso aviso-ok" role="status">{aviso}</div>}
        {invitacion && !yo && (
          <div className="tarjeta">
            <b>Te invitaron a este partido</b>
            <div className="dos-campos">
              <button type="button" className="boton boton-borde" onClick={rechazar} disabled={ocupado}>No puedo</button>
              <button type="button" className="boton boton-verde" onClick={sumarme} disabled={ocupado || faltan === 0}>Aceptar</button>
            </div>
          </div>
        )}

        <dl className="ficha-datos tarjeta">
          <div><dt>Cancha</dt><dd><Link href={`/app/cancha/${p.cancha_id}`}>{p.canchas.nombre}</Link> · {p.canchas.barrio}</dd></div>
          <div><dt>Cuándo</dt><dd>{cuandoEs(p.fecha, p.hora_inicio)} · {duracionTexto(p.duracion_min)}</dd></div>
          <div><dt>Nivel</dt><dd>{p.nivel}</dd></div>
          <div><dt>Cada jugador paga</dt><dd>{precio(p.precio_por_jugador)}</dd></div>
          <div><dt>Lugares</dt><dd>{anotados} de {p.cupo}{faltan ? ` · ${faltan === 1 ? 'falta 1' : `faltan ${faltan}`}` : ' · completo'}</dd></div>
        </dl>
        {p.descripcion && <p className="texto">{p.descripcion}</p>}

        {!jugado && (
          <div className="res-botones dos">
            {!yo && <button type="button" className="primario" onClick={sumarme} disabled={ocupado || faltan === 0}>{faltan === 0 ? 'Partido completo' : 'Sumarme'}</button>}
            {yo && !yo.pagado && <button type="button" className="primario" onClick={pagar} disabled={ocupado}>Pagar mi parte · {precio(p.precio_por_jugador)}</button>}
            {yo && !soyCreador && <button type="button" onClick={bajarme} disabled={ocupado}>Bajarme</button>}
            <a href={comoLlegar(p.canchas)} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
            <button type="button" onClick={compartir}>Compartir</button>
          </div>
        )}

        <section className="tarjeta">
          <h2>Quiénes juegan</h2>
          <ul className="gente">
            {jugadores.map((j) => (
              <li key={j.user_id}>
                <Avatar nombre={j.profiles?.full_name} />
                <Link href={`/app/jugador/${j.user_id}`} className="gente-datos"><b>{primerNombre(j.profiles?.full_name)}{j.user_id === usuario.id ? ' (vos)' : ''}{j.user_id === p.creador_id ? ' · organiza' : ''}</b></Link>
                <span className={`etiqueta${j.pagado ? ' ok' : ''}`}>{j.pagado ? 'Pagó' : 'Falta pagar'}</span>
              </li>
            ))}
            {p.jugadores_demo > 0 && <li><Avatar nombre="+" /><span className="gente-datos ex-sub">{p.jugadores_demo} jugadores más (de ejemplo)</span></li>}
          </ul>
        </section>

        {yo && !jugado && (
          <section className="tarjeta">
            <h2>Invitar jugadores</h2>
            <div className="campo">
              <label htmlFor="busca">Buscá por nombre</label>
              <input id="busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ej.: Martín" />
            </div>
            <ul className="gente">
              {encontrados.filter((u) => u.id !== usuario.id && !jugadores.some((j) => j.user_id === u.id)).map((u) => (
                <li key={u.id}>
                  <Avatar nombre={u.full_name} />
                  <span className="gente-datos"><b>{u.full_name}</b></span>
                  {invitados.includes(u.id) ? <span className="etiqueta">Invitado</span> : <button type="button" className="mini" onClick={() => invitar(u.id)} disabled={ocupado}>Invitar</button>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {yo && jugado && jugadores.length > 1 && (
          <section className="tarjeta">
            <h2>Fair play</h2>
            <span className="ex-sub">¿Cómo jugaron tus compañeros? Tu evaluación suma a su perfil.</span>
            <ul className="gente">
              {jugadores.filter((j) => j.user_id !== usuario.id).map((j) => (
                <li key={j.user_id}>
                  <span className="gente-datos"><b>{primerNombre(j.profiles?.full_name)}</b></span>
                  {notas[j.user_id] ? <span className="etiqueta ok">{notas[j.user_id]} ★</span> : <EstrellasInput valor={0} onChange={(n) => evaluar(j.user_id, n)} etiqueta={`Fair play de ${primerNombre(j.profiles?.full_name)}`} size={24} />}
                </li>
              ))}
            </ul>
          </section>
        )}

        {yo ? (
          <section className="tarjeta">
            <h2>Chat del partido</h2>
            <Chat partidoId={p.id} usuario={usuario} />
          </section>
        ) : <span className="ex-sub">Sumate para ver el chat del partido.</span>}
      </main>
    </>
  )
}
