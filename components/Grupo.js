'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Chat from '@/components/Chat'
import { Cabecera, Cargando, Vacio, Avatar } from '@/components/Piezas'
import { useUsuario, primerNombre } from '@/lib/canchas'

export default function Grupo({ id }) {
  const router = useRouter()
  const usuario = useUsuario()
  const [g, setG] = useState(undefined)
  const [ocupado, setOcupado] = useState(false)

  async function cargar() {
    const { data } = await supabase.from('grupos').select('*, grupo_miembros(user_id, profiles(full_name))').eq('id', id).maybeSingle()
    setG(data || null)
  }
  useEffect(() => {
    if (usuario) cargar()
  }, [usuario]) // eslint-disable-line react-hooks/exhaustive-deps

  if (g === undefined) return <><Cabecera titulo="Grupo" volver="/app/comunidad" /><main className="pag"><Cargando /></main></>
  if (g === null) return <><Cabecera titulo="Grupo" volver="/app/comunidad" /><main className="pag"><Vacio titulo="No encontramos este grupo" /></main></>

  const soy = g.grupo_miembros.some((m) => m.user_id === usuario.id)
  const creador = g.creador_id === usuario.id
  async function hacer(fn) {
    setOcupado(true)
    await fn()
    setOcupado(false)
    cargar()
  }
  const unirme = () => hacer(() => supabase.from('grupo_miembros').insert({ grupo_id: g.id }))
  const salir = () => hacer(() => supabase.from('grupo_miembros').delete().eq('grupo_id', g.id).eq('user_id', usuario.id))
  async function borrar() {
    await supabase.from('grupos').delete().eq('id', g.id)
    router.replace('/app/comunidad')
  }

  return (
    <>
      <Cabecera titulo={g.nombre} sub={[g.deporte, g.barrio].filter(Boolean).join(' · ')} volver="/app/comunidad" />
      <main className="pag">
        <dl className="ficha-datos tarjeta">
          <div><dt>Deporte</dt><dd>{g.deporte}</dd></div>
          {g.barrio && <div><dt>Barrio</dt><dd>{g.barrio}</dd></div>}
          {g.horario_habitual && <div><dt>Juegan</dt><dd>{g.horario_habitual}</dd></div>}
          <div><dt>Miembros</dt><dd>{g.grupo_miembros.length + g.miembros_demo}</dd></div>
        </dl>
        {g.descripcion && <p className="texto">{g.descripcion}</p>}
        <div className="res-botones dos">
          {!soy && <button type="button" className="primario" onClick={unirme} disabled={ocupado}>Unirme al grupo</button>}
          {soy && !creador && <button type="button" onClick={salir} disabled={ocupado}>Salir del grupo</button>}
          {creador && <button type="button" onClick={borrar}>Borrar el grupo</button>}
          <Link href="/app/explorar">Reservar cancha para el grupo</Link>
        </div>
        <section className="tarjeta">
          <h2>Miembros</h2>
          <ul className="gente">
            {g.grupo_miembros.map((m) => (
              <li key={m.user_id}>
                <Avatar nombre={m.profiles?.full_name} />
                <Link href={`/app/jugador/${m.user_id}`} className="gente-datos"><b>{primerNombre(m.profiles?.full_name)}{m.user_id === usuario.id ? ' (vos)' : ''}{m.user_id === g.creador_id ? ' · creó el grupo' : ''}</b></Link>
              </li>
            ))}
            {g.miembros_demo > 0 && <li><Avatar nombre="+" /><span className="gente-datos ex-sub">{g.miembros_demo} miembros más (de ejemplo)</span></li>}
          </ul>
        </section>
        {soy ? (
          <section className="tarjeta">
            <h2>Chat del grupo</h2>
            <Chat grupoId={g.id} usuario={usuario} />
          </section>
        ) : <span className="ex-sub">Unite para ver el chat del grupo.</span>}
      </main>
    </>
  )
}
