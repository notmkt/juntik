'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BarraNav from '@/components/BarraNav'
import Chips from '@/components/Chips'
import { Pestanas, Vacio, Cargando, Avatar } from '@/components/Piezas'
import { useUsuario, precio, fechaISO, cuandoEs, DEPORTES, NIVELES, BARRIOS } from '@/lib/canchas'

export function TarjetaPartido({ p }) {
  const anotados = p.partido_jugadores.length + p.jugadores_demo
  const faltan = Math.max(0, p.cupo - anotados)
  return (
    <article className="ex-partido">
      <div className="ex-partido-arriba">
        <span className="ex-etiqueta">{p.deporte} · {faltan === 0 ? 'Completo' : faltan === 1 ? 'Falta 1' : `Faltan ${faltan}`}</span>
        <span className="ex-cuando">{cuandoEs(p.fecha, p.hora_inicio)}</span>
      </div>
      <div>
        <div className="ex-partido-nombre">{p.canchas?.nombre}</div>
        <div className="ex-sub">{p.canchas?.barrio} · {p.nivel}</div>
      </div>
      <div className="ex-partido-gente">
        <span>{anotados} de {p.cupo} jugadores</span>
        <span>{precio(p.precio_por_jugador)} c/u</span>
      </div>
      <Link href={`/app/partido/${p.id}`} className="boton boton-verde">{faltan === 0 ? 'Ver partido' : 'Sumarme'}</Link>
    </article>
  )
}
export const PARTIDO_CAMPOS = '*, canchas(id, nombre, barrio, direccion, lat, lng), partido_jugadores(user_id, pagado, profiles(full_name))'

export default function Comunidad() {
  const usuario = useUsuario()
  const [pestana, setPestana] = useState('partidos')
  const [deporte, setDeporte] = useState('Todos')
  const [partidos, setPartidos] = useState(null)
  const [grupos, setGrupos] = useState(null)
  const [jugadores, setJugadores] = useState(null)
  const [nivel, setNivel] = useState('Todos')
  const [form, setForm] = useState(null) // crear grupo
  const [aviso, setAviso] = useState('')

  async function cargar() {
    const [p, g, j] = await Promise.all([
      supabase.from('partidos').select(PARTIDO_CAMPOS).gte('fecha', fechaISO(new Date())).order('fecha').order('hora_inicio'),
      supabase.from('grupos').select('*, grupo_miembros(user_id)').order('created_at'),
      supabase.from('ranking').select('*').order('puntos', { ascending: false }),
    ])
    setPartidos(p.data || [])
    setGrupos(g.data || [])
    setJugadores((j.data || []).filter((x) => x.id !== usuario.id))
    const yo = (j.data || []).find((x) => x.id === usuario.id)
    if (yo?.nivel) setNivel(yo.nivel)
  }
  useEffect(() => {
    if (usuario) cargar()
  }, [usuario]) // eslint-disable-line react-hooks/exhaustive-deps

  async function crearGrupo(e) {
    e.preventDefault()
    setAviso('')
    if (form.nombre.trim().length < 3) return setAviso('Poné un nombre de al menos 3 letras.')
    const { error } = await supabase.from('grupos').insert({ creador_id: usuario.id, nombre: form.nombre.trim(), deporte: form.deporte, barrio: form.barrio, horario_habitual: form.horario || null, descripcion: form.descripcion || null })
    if (error) return setAviso('No pudimos crear el grupo. Probá de nuevo.')
    setForm(null)
    cargar()
  }

  const filtra = (d) => deporte === 'Todos' || d === deporte
  const verPartidos = (partidos || []).filter((p) => filtra(p.deporte))
  const verGrupos = (grupos || []).filter((g) => filtra(g.deporte))
  const verJugadores = (jugadores || []).filter((j) => (deporte === 'Todos' || (j.deportes || []).includes(deporte)) && (nivel === 'Todos' || j.nivel === nivel))

  return (
    <>
      <main className="res">
        <h1>Comunidad</h1>
        <Pestanas valor={pestana} onChange={setPestana} opciones={[['partidos', 'Falta uno'], ['grupos', 'Grupos'], ['jugadores', 'Jugadores']]} />
        <Chips deporte={deporte} onChange={setDeporte} className="chips-pag" />

        {pestana === 'partidos' && (
          <>
            {partidos === null && <Cargando />}
            {partidos !== null && verPartidos.length === 0 && <Vacio titulo="No hay partidos abiertos">Reservá una cancha y abrí tu partido para que otros se sumen.</Vacio>}
            <div className="res-lista">{verPartidos.map((p) => <TarjetaPartido key={p.id} p={p} />)}</div>
            <Link href="/app/explorar" className="boton boton-borde">Armar un partido: reservá una cancha</Link>
          </>
        )}

        {pestana === 'grupos' && (
          <>
            {grupos === null && <Cargando />}
            <div className="res-lista">
              {verGrupos.map((g) => (
                <Link key={g.id} href={`/app/grupo/${g.id}`} className="res-tarjeta enlace">
                  <b>{g.nombre}</b>
                  <span className="ex-sub">{g.deporte}{g.barrio ? ` · ${g.barrio}` : ''}{g.horario_habitual ? ` · ${g.horario_habitual}` : ''}</span>
                  <span className="ex-sub">{g.grupo_miembros.length + g.miembros_demo} miembros{g.grupo_miembros.some((m) => m.user_id === usuario?.id) ? ' · Sos parte' : ''}</span>
                </Link>
              ))}
            </div>
            {!form && <button type="button" className="boton boton-borde" onClick={() => setForm({ nombre: '', deporte: 'Fútbol 5', barrio: 'Palermo', horario: '', descripcion: '' })}>Crear un grupo</button>}
            {form && (
              <form className="tarjeta formulario" onSubmit={crearGrupo}>
                <h2>Nuevo grupo</h2>
                <div className="campo"><label htmlFor="g-nombre">Nombre</label><input id="g-nombre" value={form.nombre} maxLength={60} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
                <div className="dos-campos">
                  <div className="campo"><label htmlFor="g-dep">Deporte</label><select id="g-dep" value={form.deporte} onChange={(e) => setForm({ ...form, deporte: e.target.value })}>{DEPORTES.slice(1).map((d) => <option key={d}>{d}</option>)}</select></div>
                  <div className="campo"><label htmlFor="g-bar">Barrio</label><select id="g-bar" value={form.barrio} onChange={(e) => setForm({ ...form, barrio: e.target.value })}>{Object.keys(BARRIOS).map((b) => <option key={b}>{b}</option>)}</select></div>
                </div>
                <div className="campo"><label htmlFor="g-hor">Día y hora habitual (opcional)</label><input id="g-hor" value={form.horario} placeholder="Ej.: Jueves 21 h" onChange={(e) => setForm({ ...form, horario: e.target.value })} /></div>
                <div className="campo"><label htmlFor="g-des">Descripción (opcional)</label><textarea id="g-des" rows={2} maxLength={300} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
                {aviso && <div className="aviso aviso-error" role="alert">{aviso}</div>}
                <div className="dos-campos">
                  <button type="button" className="boton boton-borde" onClick={() => setForm(null)}>Cancelar</button>
                  <button type="submit" className="boton boton-verde">Crear grupo</button>
                </div>
              </form>
            )}
          </>
        )}

        {pestana === 'jugadores' && (
          <>
            <div className="campo">
              <label htmlFor="j-nivel">Nivel</label>
              <select id="j-nivel" value={nivel} onChange={(e) => setNivel(e.target.value)}>{['Todos', ...NIVELES].map((n) => <option key={n}>{n}</option>)}</select>
            </div>
            {jugadores === null && <Cargando />}
            {jugadores !== null && verJugadores.length === 0 && <Vacio titulo="No encontramos jugadores">Probá con otro deporte o nivel. Los jugadores aparecen cuando completan su perfil.</Vacio>}
            <ul className="gente tarjeta">
              {verJugadores.map((j) => (
                <li key={j.id}>
                  <Avatar nombre={j.full_name} />
                  <Link href={`/app/jugador/${j.id}`} className="gente-datos">
                    <b>{j.full_name || 'Jugador'}</b>
                    <span className="ex-sub">{[j.barrio, j.nivel, (j.deportes || []).join(', ')].filter(Boolean).join(' · ') || 'Perfil sin completar'}</span>
                  </Link>
                  <span className="etiqueta">{j.puntos} pts</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <BarraNav activa="comunidad" />
    </>
  )
}
