'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Cabecera, Cargando, Vacio } from '@/components/Piezas'
import { useUsuario, precio, deISO, fechaCorta } from '@/lib/canchas'

export default function Torneo({ id }) {
  const usuario = useUsuario()
  const [t, setT] = useState(undefined)
  const [nombre, setNombre] = useState('')
  const [aviso, setAviso] = useState('')

  async function cargar() {
    const { data } = await supabase.from('torneos').select('*, canchas(id, nombre, barrio), torneo_equipos(*)').eq('id', id).maybeSingle()
    setT(data || null)
  }
  useEffect(() => {
    if (usuario) cargar()
  }, [usuario]) // eslint-disable-line react-hooks/exhaustive-deps

  if (t === undefined) return <><Cabecera titulo="Torneo" volver="/app/torneos" /><main className="pag"><Cargando /></main></>
  if (t === null) return <><Cabecera titulo="Torneo" volver="/app/torneos" /><main className="pag"><Vacio titulo="No encontramos este torneo" /></main></>

  const empezo = deISO(t.fecha_inicio) <= new Date()
  const equipos = [...t.torneo_equipos].map((e) => ({ ...e, pts: e.pg * 3 + e.pe, dif: e.gf - e.gc })).sort((a, b) => b.pts - a.pts || b.dif - a.dif || a.nombre.localeCompare(b.nombre))
  const mio = equipos.find((e) => e.capitan_id === usuario.id)
  const lleno = equipos.length >= t.cupo_equipos

  async function inscribir(e) {
    e.preventDefault()
    setAviso('')
    if (nombre.trim().length < 2) return setAviso('Poné el nombre de tu equipo.')
    const { error } = await supabase.from('torneo_equipos').insert({ torneo_id: t.id, nombre: nombre.trim(), capitan_id: usuario.id })
    if (error) return setAviso(error.code === '23505' ? 'Ya hay un equipo con ese nombre en el torneo.' : 'No pudimos inscribir al equipo. Probá de nuevo.')
    setNombre('')
    setAviso('¡Equipo inscripto! El pago de la inscripción es simulado.')
    cargar()
  }
  async function baja() {
    await supabase.from('torneo_equipos').delete().eq('id', mio.id)
    setAviso('Diste de baja a tu equipo.')
    cargar()
  }

  return (
    <>
      <Cabecera titulo={t.nombre} sub={`${t.deporte} · ${empezo ? 'En curso' : 'Inscripción abierta'}`} volver="/app/torneos" />
      <main className="pag">
        {aviso && <div className="aviso aviso-ok" role="status">{aviso}</div>}
        <dl className="ficha-datos tarjeta">
          <div><dt>{empezo ? 'Empezó' : 'Empieza'}</dt><dd>{fechaCorta(deISO(t.fecha_inicio))}</dd></div>
          {t.canchas && <div><dt>Sede</dt><dd><Link href={`/app/cancha/${t.canchas.id}`}>{t.canchas.nombre}</Link> · {t.canchas.barrio}</dd></div>}
          {t.formato && <div><dt>Formato</dt><dd>{t.formato}</dd></div>}
          <div><dt>Inscripción por equipo</dt><dd>{precio(t.precio_equipo)}</dd></div>
          {t.premio && <div><dt>Premio</dt><dd>{t.premio}</dd></div>}
          <div><dt>Equipos</dt><dd>{equipos.length} de {t.cupo_equipos}</dd></div>
        </dl>
        {t.descripcion && <p className="texto">{t.descripcion}</p>}

        {!empezo && !mio && !lleno && (
          <form className="tarjeta formulario" onSubmit={inscribir}>
            <h2>Inscribí a tu equipo</h2>
            <div className="campo"><label htmlFor="equipo">Nombre del equipo</label><input id="equipo" value={nombre} maxLength={40} onChange={(e) => setNombre(e.target.value)} /></div>
            <button type="submit" className="boton boton-verde">Inscribir equipo · {precio(t.precio_equipo)}</button>
          </form>
        )}
        {!empezo && lleno && !mio && <span className="ex-sub">El torneo ya tiene todos los equipos.</span>}
        {mio && !empezo && <button type="button" className="boton boton-borde" onClick={baja}>Dar de baja a {mio.nombre}</button>}

        <section className="tarjeta">
          <h2>{empezo ? 'Tabla de posiciones' : 'Equipos inscriptos'}</h2>
          <div className="tabla-caja">
            <table className="tabla">
              <thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>Pts</th></tr></thead>
              <tbody>
                {equipos.map((e, i) => (
                  <tr key={e.id} className={e.capitan_id === usuario.id ? 'es-mio' : ''}>
                    <td>{i + 1}</td><th scope="row">{e.nombre}</th><td>{e.pj}</td><td>{e.pg}</td><td>{e.pe}</td><td>{e.pp}</td><td>{e.dif > 0 ? `+${e.dif}` : e.dif}</td><td><b>{e.pts}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span className="ex-sub">Torneo de ejemplo: los resultados los carga la organización.</span>
        </section>
      </main>
    </>
  )
}
