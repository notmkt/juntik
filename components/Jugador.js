'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Cabecera, Cargando, Vacio, Avatar } from '@/components/Piezas'
import { useUsuario, puntosDe, conteos, DESAFIOS, fechaISO, cuandoEs } from '@/lib/canchas'

export default function Jugador({ id }) {
  const usuario = useUsuario()
  const [j, setJ] = useState(undefined)
  const [c, setC] = useState(null)
  const [fair, setFair] = useState(null)
  const [misPartidos, setMisPartidos] = useState([])
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    if (!usuario) return
    ;(async () => {
      const [a, b, f, p] = await Promise.all([
        supabase.from('ranking').select('*').eq('id', id).maybeSingle(),
        puntosDe(id),
        supabase.from('fairplay').select('nota').eq('para_id', id),
        supabase.from('partidos').select('id, deporte, fecha, hora_inicio').eq('creador_id', usuario.id).gte('fecha', fechaISO(new Date())),
      ])
      setJ(a.data || null)
      setC(conteos(b))
      const n = (f.data || []).map((x) => x.nota)
      setFair(n.length ? n.reduce((x, y) => x + y, 0) / n.length : null)
      setMisPartidos(p.data || [])
    })()
  }, [usuario, id])

  if (j === undefined) return <><Cabecera titulo="Jugador" volver="/app/comunidad" /><main className="pag"><Cargando /></main></>
  if (j === null) return <><Cabecera titulo="Jugador" volver="/app/comunidad" /><main className="pag"><Vacio titulo="No encontramos a este jugador" /></main></>

  const insignias = DESAFIOS.filter((d) => c && c[d.clave] >= d.meta)
  async function invitar(partidoId) {
    const { error } = await supabase.from('invitaciones').insert({ partido_id: partidoId, invitado_id: id })
    setAviso(error ? 'Ya lo habías invitado a ese partido.' : 'Invitación enviada.')
  }

  return (
    <>
      <Cabecera titulo={j.full_name || 'Jugador'} sub={[j.barrio, j.nivel].filter(Boolean).join(' · ')} volver="/app/comunidad" />
      <main className="pag">
        <div className="perfil-cab">
          <Avatar nombre={j.full_name} grande />
          <div>
            <b>{j.full_name || 'Jugador'}</b>
            <span className="ex-sub">{(j.deportes || []).join(', ') || 'Sin deportes cargados'}</span>
          </div>
        </div>
        <div className="numeros">
          <div><b>{j.puntos}</b><span>puntos</span></div>
          <div><b>{fair ? fair.toFixed(1).replace('.', ',') : '—'}</b><span>fair play</span></div>
          <div><b>{insignias.length}</b><span>insignias</span></div>
        </div>
        {insignias.length > 0 && (
          <section className="tarjeta">
            <h2>Insignias</h2>
            <div className="multi">{insignias.map((d) => <span key={d.id} className="etiqueta ok">{d.nombre}</span>)}</div>
          </section>
        )}
        {id !== usuario.id && (
          <section className="tarjeta">
            <h2>Invitar a un partido</h2>
            {aviso && <div className="aviso aviso-ok" role="status">{aviso}</div>}
            {misPartidos.length === 0 && <span className="ex-sub">No tenés partidos abiertos. Reservá una cancha y abrí el partido para invitar.</span>}
            <ul className="gente">
              {misPartidos.map((p) => (
                <li key={p.id}>
                  <span className="gente-datos"><b>{p.deporte}</b><span className="ex-sub">{cuandoEs(p.fecha, p.hora_inicio)}</span></span>
                  <button type="button" className="mini" onClick={() => invitar(p.id)}>Invitar</button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  )
}
