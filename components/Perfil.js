'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BarraNav from '@/components/BarraNav'
import { Cargando, Avatar, Multi } from '@/components/Piezas'
import { useUsuario, puntosDe, conteos, precio, deISO, fechaCorta, DESAFIOS, DEPORTES, NIVELES, BARRIOS } from '@/lib/canchas'

export default function Perfil() {
  const router = useRouter()
  const usuario = useUsuario()
  const [perfil, setPerfil] = useState(null)
  const [c, setC] = useState(null)
  const [puesto, setPuesto] = useState(null)
  const [favoritos, setFavoritos] = useState([])
  const [pagos, setPagos] = useState([])
  const [fair, setFair] = useState(null)
  const [form, setForm] = useState(null)
  const [aviso, setAviso] = useState('')

  async function cargar() {
    const [p, pts, rk, fav, res, fp] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', usuario.id).maybeSingle(),
      puntosDe(usuario.id),
      supabase.from('ranking').select('id, puntos').order('puntos', { ascending: false }),
      supabase.from('favoritos').select('canchas(id, nombre, barrio)'),
      supabase.from('reservas').select('id, fecha, hora_inicio, total, estado, metodo_pago, canchas(nombre)').eq('user_id', usuario.id).eq('tipo', 'reserva').order('fecha', { ascending: false }),
      supabase.from('fairplay').select('nota').eq('para_id', usuario.id),
    ])
    setPerfil(p.data || { full_name: usuario.user_metadata?.full_name })
    setC(conteos(pts))
    setPuesto((rk.data || []).findIndex((x) => x.id === usuario.id) + 1)
    setFavoritos((fav.data || []).map((f) => f.canchas).filter(Boolean))
    setPagos(res.data || [])
    const n = (fp.data || []).map((x) => x.nota)
    setFair(n.length ? n.reduce((a, b) => a + b, 0) / n.length : null)
  }
  useEffect(() => {
    if (usuario) cargar()
  }, [usuario]) // eslint-disable-line react-hooks/exhaustive-deps

  async function guardar(e) {
    e.preventDefault()
    setAviso('')
    if (form.full_name.trim().length < 2) return setAviso('Poné tu nombre.')
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name.trim(), barrio: form.barrio || null, deportes: form.deportes, nivel: form.nivel || null, bio: form.bio.trim() || null,
    }).eq('id', usuario.id)
    if (error) return setAviso('No pudimos guardar tu perfil. Probá de nuevo.')
    setForm(null)
    cargar()
  }
  async function salir() {
    await supabase.auth.signOut()
    router.replace('/app')
  }

  if (!perfil || !c) return <><main className="res"><h1>Perfil</h1><Cargando /></main><BarraNav activa="perfil" /></>
  const insignias = DESAFIOS.filter((d) => c[d.clave] >= d.meta)
  const gastado = pagos.filter((r) => r.estado === 'confirmada').reduce((t, r) => t + r.total, 0)

  return (
    <>
      <main className="res">
        <h1>Perfil</h1>
        <div className="perfil-cab">
          <Avatar nombre={perfil.full_name} grande />
          <div>
            <b>{perfil.full_name || 'Jugador'}</b>
            <span className="ex-sub">{usuario.email}</span>
            <span className="ex-sub">{[perfil.barrio, perfil.nivel, (perfil.deportes || []).join(', ')].filter(Boolean).join(' · ') || 'Completá tu perfil para que te encuentren'}</span>
          </div>
        </div>
        {perfil.bio && <p className="texto">{perfil.bio}</p>}

        {!form && <button type="button" className="boton boton-borde" onClick={() => setForm({ full_name: perfil.full_name || '', barrio: perfil.barrio || '', deportes: perfil.deportes || [], nivel: perfil.nivel || '', bio: perfil.bio || '' })}>Editar mis datos</button>}
        {form && (
          <form className="tarjeta formulario" onSubmit={guardar}>
            <h2>Mis datos</h2>
            <div className="campo"><label htmlFor="p-nombre">Nombre completo</label><input id="p-nombre" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} autoComplete="name" /></div>
            <div className="dos-campos">
              <div className="campo"><label htmlFor="p-barrio">Barrio</label><select id="p-barrio" value={form.barrio} onChange={(e) => setForm({ ...form, barrio: e.target.value })}><option value="">Sin elegir</option>{Object.keys(BARRIOS).map((b) => <option key={b}>{b}</option>)}</select></div>
              <div className="campo"><label htmlFor="p-nivel">Nivel</label><select id="p-nivel" value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })}><option value="">Sin elegir</option>{NIVELES.map((n) => <option key={n}>{n}</option>)}</select></div>
            </div>
            <div className="campo"><span className="campo-titulo">Deportes que jugás</span><Multi opciones={DEPORTES.slice(1)} valor={form.deportes} onChange={(v) => setForm({ ...form, deportes: v })} etiqueta="Deportes que jugás" /></div>
            <div className="campo"><label htmlFor="p-bio">Sobre vos (opcional)</label><textarea id="p-bio" rows={2} maxLength={300} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
            {aviso && <div className="aviso aviso-error" role="alert">{aviso}</div>}
            <div className="dos-campos">
              <button type="button" className="boton boton-borde" onClick={() => setForm(null)}>Cancelar</button>
              <button type="submit" className="boton boton-verde">Guardar</button>
            </div>
          </form>
        )}

        <section className="tarjeta">
          <h2>Mi Liga</h2>
          <div className="numeros">
            <div><b>{c.total}</b><span>puntos</span></div>
            <div><b>{puesto ? `#${puesto}` : '—'}</b><span>en el ranking</span></div>
            <div><b>{fair ? fair.toFixed(1).replace('.', ',') : '—'}</b><span>fair play</span></div>
          </div>
          {insignias.length > 0 && <div className="multi">{insignias.map((d) => <span key={d.id} className="etiqueta ok">{d.nombre}</span>)}</div>}
          <Link href="/app/torneos" className="ficha-enlace">Ver ranking y desafíos</Link>
        </section>

        <section className="tarjeta">
          <h2>Estadísticas</h2>
          <dl className="ficha-datos">
            <div><dt>Reservas</dt><dd>{c.reservas}</dd></div>
            <div><dt>Partidos a los que te sumaste</dt><dd>{c.partidos}</dd></div>
            <div><dt>Canchas calificadas</dt><dd>{c.resenas}</dd></div>
            <div><dt>Fotos subidas</dt><dd>{c.fotos}</dd></div>
            <div><dt>Torneos</dt><dd>{c.torneos}</dd></div>
          </dl>
        </section>

        <section className="tarjeta">
          <h2>Canchas favoritas</h2>
          {favoritos.length === 0 && <span className="ex-sub">Tocá el corazón de una cancha para guardarla acá.</span>}
          <ul className="gente">
            {favoritos.map((f) => <li key={f.id}><Link href={`/app/cancha/${f.id}`} className="gente-datos"><b>{f.nombre}</b><span className="ex-sub">{f.barrio}</span></Link></li>)}
          </ul>
        </section>

        <section className="tarjeta">
          <h2>Pagos</h2>
          {pagos.length === 0 && <span className="ex-sub">Todavía no hiciste pagos.</span>}
          {pagos.length > 0 && <span className="ex-sub">Total pagado: {precio(gastado)} (pagos simulados)</span>}
          <dl className="ficha-datos">
            {pagos.slice(0, 8).map((r) => (
              <div key={r.id}>
                <dt><Link href={`/app/reserva/${r.id}`}>{r.canchas?.nombre}</Link> · {fechaCorta(deISO(r.fecha)).toLowerCase()}</dt>
                <dd>{r.estado === 'cancelada' ? 'Cancelada' : precio(r.total)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="res-botones dos">
          <Link href="/app/notificaciones">Notificaciones</Link>
          <Link href="/app/dueno">Cambiar a modo dueño</Link>
        </div>
        <button type="button" className="boton boton-borde" onClick={salir}>Cerrar sesión</button>
      </main>
      <BarraNav activa="perfil" />
    </>
  )
}
